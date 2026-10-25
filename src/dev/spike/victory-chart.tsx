import {
  Circle,
  DashPathEffect,
  Group,
  Line as SkiaLine,
  matchFont,
  Path,
  Rect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { CartesianChart, Line, useChartPressState } from 'victory-native';

import { type SpikeData, barAt, tooltipText } from './spike-data';
import { AppText } from '@/components/app-text';
import { useColors } from '@/theme/use-colors';

// Spike candidate victory-native (Skia): bars and patterns drawn by hand on
// the canvas, two y axes, lines with path effects, long-press pan.

const FONT = matchFont({ fontFamily: 'Helvetica', fontSize: 10 });

type Row = {
  x: number;
  weight?: number;
  fat?: number;
  theoretical?: number;
  point?: number;
};

// Diagonal (45°) or horizontal lines over a rect, clipped by the caller.
function patternPath(
  x: number,
  y: number,
  width: number,
  height: number,
  kind: 'hatch' | 'stripes',
) {
  const path = Skia.Path.Make();
  if (kind === 'stripes') {
    for (let top = y; top < y + height; top += 3.4)
      path.addRect(Skia.XYWHRect(x, top, width, 1.3));
    return path;
  }
  for (let offset = -height; offset < width; offset += 3.6 * Math.SQRT2) {
    path.moveTo(x + offset, y + height);
    path.lineTo(x + offset + height, y);
  }
  return path;
}

export function VictoryChart({
  data,
  width,
}: {
  data: SpikeData;
  width: number;
}) {
  const colors = useColors();
  const [selected, setSelected] = useState<number>();
  const { state } = useChartPressState({
    x: 0,
    y: { weight: 0, fat: 0, theoretical: 0, point: 0 },
  });

  useAnimatedReaction(
    () => (state.isActive.value ? state.x.value.value : undefined),
    (x) => {
      if (x !== undefined) runOnJS(setSelected)(barAt(data, x));
    },
  );

  const rows: Row[] = data.points.map((point) => ({
    x: point.center,
    weight: point.weight,
    fat: point.fat,
    theoretical: point.theoretical,
    point: point.weightPoint,
  }));
  // The today slot has no line point but must exist on the x axis.
  if (data.slots > rows.length) rows.push({ x: data.slots - 0.5 });

  return (
    <View style={{ width, height: (width * 232) / 350 }}>
      <CartesianChart
        data={rows}
        xKey="x"
        yKeys={['weight', 'fat', 'theoretical', 'point']}
        domain={{ x: [0, data.slots] }}
        padding={{ left: 4, right: 4, bottom: 4 }}
        chartPressState={state}
        chartPressConfig={{ pan: { activateAfterLongPress: 300 } }}
        xAxis={{
          font: FONT,
          labelColor: colors.muted,
          lineWidth: 0,
          tickCount: 5,
        }}
        yAxis={[
          {
            yKeys: ['weight', 'fat', 'theoretical', 'point'],
            axisSide: 'right',
            domain: [-data.kgMax, data.kgMax],
            tickValues: [
              -data.kgMax,
              -data.kgMax / 2,
              0,
              data.kgMax / 2,
              data.kgMax,
            ],
            font: FONT,
            labelColor: colors.muted,
            lineColor: colors.separator,
            formatYLabel: (value) => (value as number).toFixed(1),
          },
        ]}
      >
        {({ points, chartBounds, xScale }) => {
          const zero = (chartBounds.top + chartBounds.bottom) / 2;
          const half = (chartBounds.bottom - chartBounds.top) / 2;
          const unit = (chartBounds.right - chartBounds.left) / data.slots;
          return (
            <>
              {data.bars.map((bar, index) => {
                if (bar.value === undefined || !bar.kind) return null;
                const barWidth = Math.min(
                  26,
                  bar.span * unit * (data.daily ? 0.7 : 0.78),
                );
                let height = Math.max(
                  1.5,
                  (Math.abs(bar.value) / data.kcalMax) * half,
                );
                if (bar.kind === 'today') height = Math.max(height, 14);
                const x = xScale(bar.center) - barWidth / 2;
                const y = bar.value >= 0 ? zero - height : zero;
                const rect = Skia.XYWHRect(x, y, barWidth, height);
                const dim =
                  selected !== undefined && selected !== index ? 0.3 : 1;
                if (bar.kind === 'full')
                  return (
                    <Rect
                      key={index}
                      rect={rect}
                      color={colors.foreground}
                      opacity={dim}
                    />
                  );
                return (
                  <Group key={index} opacity={dim}>
                    {bar.kind !== 'today' ? (
                      <Group clip={rect}>
                        <Path
                          path={patternPath(x, y, barWidth, height, bar.kind)}
                          color={colors.foreground}
                          style={bar.kind === 'hatch' ? 'stroke' : 'fill'}
                          strokeWidth={1.5}
                        />
                      </Group>
                    ) : null}
                    <Rect
                      rect={rect}
                      color={colors.foreground}
                      style="stroke"
                      strokeWidth={1}
                    >
                      {bar.kind === 'today' ? (
                        <DashPathEffect intervals={[2.5, 2]} />
                      ) : null}
                    </Rect>
                  </Group>
                );
              })}
              {data.bars
                .filter((bar) => bar.cross)
                .map((bar, index) => (
                  <Group key={`c${index}`}>
                    <SkiaLine
                      p1={vec(xScale(bar.center) - 3, zero - 3)}
                      p2={vec(xScale(bar.center) + 3, zero + 3)}
                      color={colors.foreground}
                      strokeWidth={1.6}
                    />
                    <SkiaLine
                      p1={vec(xScale(bar.center) + 3, zero - 3)}
                      p2={vec(xScale(bar.center) - 3, zero + 3)}
                      color={colors.foreground}
                      strokeWidth={1.6}
                    />
                  </Group>
                ))}
              <SkiaLine
                p1={vec(chartBounds.left, zero)}
                p2={vec(chartBounds.right, zero)}
                color={colors.foreground}
                strokeWidth={1.25}
              />
              <Line
                points={points.theoretical}
                color={colors.foreground}
                strokeWidth={2.2}
                strokeCap="round"
              >
                <DashPathEffect intervals={[0.1, 4.2]} />
              </Line>
              <Line
                points={points.fat}
                color={colors.foreground}
                strokeWidth={1.8}
              >
                <DashPathEffect intervals={[6, 3.5]} />
              </Line>
              <Line
                points={points.weight}
                color={colors.foreground}
                strokeWidth={2.6}
                strokeCap="round"
                strokeJoin="round"
              />
              {points.point.map((point) =>
                point.y === undefined || point.y === null ? null : (
                  <Group key={point.xValue as number}>
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={2.5}
                      color={colors.background}
                    />
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={2.5}
                      color={colors.foreground}
                      style="stroke"
                      strokeWidth={1.25}
                    />
                  </Group>
                ),
              )}
            </>
          );
        }}
      </CartesianChart>
      {selected !== undefined && data.bars[selected] ? (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            {
              borderColor: colors.foreground,
              backgroundColor: colors.background,
            },
          ]}
        >
          <AppText variant="footnote">{tooltipText(data, selected)}</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    top: 14,
    left: 60,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
