import { memo, useRef, useState } from 'react';
import { type GestureResponderEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text } from 'react-native-svg';

import { barAt, type SpikeData, tooltipText } from './spike-data';
import { AppText } from '@/components/app-text';
import {
  QualityCross,
  QualityPatternDefs,
  usePatternPrefix,
} from '@/components/quality-pattern';
import { useScrollLock } from '@/hooks/scroll-lock';
import { useColors } from '@/theme/use-colors';

// Spike candidate „eigenes SVG“: react-native-svg, patterns from P7, gesture
// via the responder system with a 300 ms long press.

const W = 350;
const H = 232;
const LEFT = 40;
const PLOT = 276;
const ZERO = 106;
const HALF = 92;
const LONG_PRESS_MS = 300;
const MOVE_SLOP = 8;

function Static({ data, width }: { data: SpikeData; width: number }) {
  const colors = useColors();
  const prefix = usePatternPrefix();
  const unit = PLOT / data.slots;
  const x = (center: number) => LEFT + center * unit;
  const yK = (value: number) => ZERO - (value / data.kcalMax) * HALF;
  const yG = (value: number) => ZERO - (value / data.kgMax) * HALF;
  const line = (key: 'weight' | 'fat' | 'theoretical') =>
    data.points
      .filter((point) => point[key] !== undefined)
      .map((point) => `${x(point.center)},${yG(point[key] as number)}`)
      .join(' ');
  const ticks = [1, 0.5, 0, -0.5, -1];

  return (
    <Svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`}>
      <QualityPatternDefs idPrefix={prefix} />
      {ticks.map((tick) => (
        <Line
          key={tick}
          x1={LEFT}
          x2={LEFT + PLOT}
          y1={ZERO - tick * HALF}
          y2={ZERO - tick * HALF}
          stroke={colors.separator}
          strokeWidth={0.75}
        />
      ))}
      {data.bars.map((bar, index) => {
        if (bar.value === undefined || !bar.kind) return null;
        const barWidth = Math.min(
          26,
          bar.span * unit * (data.daily ? 0.7 : 0.78),
        );
        let height = Math.max(1.5, Math.abs(yK(bar.value) - ZERO));
        if (bar.kind === 'today') height = Math.max(height, 14);
        const top = bar.value >= 0 ? ZERO - height : ZERO;
        const fill =
          bar.kind === 'full'
            ? colors.foreground
            : bar.kind === 'today'
              ? 'none'
              : `url(#${prefix}-${bar.kind === 'hatch' ? 'hatch' : 'stripes'})`;
        return (
          <Rect
            key={index}
            x={x(bar.center) - barWidth / 2}
            y={top}
            width={barWidth}
            height={height}
            fill={fill}
            stroke={bar.kind === 'full' ? undefined : colors.foreground}
            strokeWidth={1}
            strokeDasharray={bar.kind === 'today' ? '2.5 2' : undefined}
          />
        );
      })}
      {data.bars
        .filter((bar) => bar.cross)
        .map((bar, index) => (
          <QualityCross key={index} size={7} x={x(bar.center)} y={ZERO} />
        ))}
      <Line
        x1={LEFT}
        x2={LEFT + PLOT}
        y1={ZERO}
        y2={ZERO}
        stroke={colors.foreground}
        strokeWidth={1.25}
      />
      <Polyline
        points={line('theoretical')}
        fill="none"
        stroke={colors.foreground}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray="0.1 4.2"
      />
      <Polyline
        points={line('fat')}
        fill="none"
        stroke={colors.foreground}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeDasharray="6 3.5"
      />
      <Polyline
        points={line('weight')}
        fill="none"
        stroke={colors.foreground}
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.points
        .filter((point) => point.weightPoint !== undefined)
        .map((point) => (
          <Circle
            key={point.center}
            cx={x(point.center)}
            cy={yG(point.weightPoint as number)}
            r={2.5}
            fill={colors.background}
            stroke={colors.foreground}
            strokeWidth={1.25}
          />
        ))}
      {ticks.map((tick) => (
        <Text
          key={`l${tick}`}
          x={37}
          y={ZERO - tick * HALF + 3.5}
          fontSize={10}
          fill={colors.muted}
          textAnchor="end"
        >
          {tick === 0
            ? '0'
            : `${tick > 0 ? '+' : '−'}${Math.abs(tick * data.kcalMax)}`}
        </Text>
      ))}
      {ticks.map((tick) => (
        <Text
          key={`r${tick}`}
          x={322}
          y={ZERO - tick * HALF + 3.5}
          fontSize={10}
          fill={colors.muted}
        >
          {tick === 0
            ? '0'
            : `${tick > 0 ? '+' : '−'}${Math.abs(tick * data.kgMax).toFixed(1)}`}
        </Text>
      ))}
      {data.bars
        .filter((_, index) =>
          data.daily
            ? index % 7 === 0 || index === data.bars.length - 1
            : index % 2 === 0,
        )
        .map((bar) => (
          <Text
            key={bar.label}
            x={x(bar.center)}
            y={216}
            fontSize={10}
            fill={colors.muted}
            textAnchor="middle"
          >
            {bar.label}
          </Text>
        ))}
    </Svg>
  );
}

const StaticLayer = memo(Static);

export function SvgChart({ data, width }: { data: SpikeData; width: number }) {
  const colors = useColors();
  const lockScroll = useScrollLock();
  const [selected, setSelected] = useState<number>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scale = width / W;
  const unit = PLOT / data.slots;

  function indexAt(event: GestureResponderEvent, clamp: boolean) {
    const plotX = event.nativeEvent.locationX / scale - LEFT;
    const dayX = clamp
      ? Math.min(data.slots - 0.001, Math.max(0, plotX / unit))
      : plotX / unit;
    return barAt(data, dayX);
  }

  function finish() {
    clearTimeout(timer.current);
    if (dragging.current) lockScroll(false);
    dragging.current = false;
  }

  const bar = selected === undefined ? undefined : data.bars[selected];

  return (
    <View>
      <StaticLayer data={data} width={width} />
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => dragging.current}
        // Before the long press the scroll views may take the touch over.
        onResponderTerminationRequest={() => !dragging.current}
        onResponderGrant={(event) => {
          startX.current = event.nativeEvent.pageX;
          const index = indexAt(event, false);
          timer.current = setTimeout(() => {
            dragging.current = true;
            lockScroll(true);
            if (index !== undefined) setSelected(index);
          }, LONG_PRESS_MS);
        }}
        onResponderMove={(event) => {
          if (dragging.current) {
            const index = indexAt(event, true);
            if (index !== undefined) setSelected(index);
          } else if (
            Math.abs(event.nativeEvent.pageX - startX.current) > MOVE_SLOP
          ) {
            clearTimeout(timer.current);
          }
        }}
        onResponderRelease={(event) => {
          const wasDragging = dragging.current;
          finish();
          if (!wasDragging) {
            const index = indexAt(event, false);
            setSelected((current) => (current === index ? undefined : index));
          }
        }}
        onResponderTerminate={finish}
      >
        {bar ? (
          <Svg
            width={width}
            height={(width * H) / W}
            viewBox={`0 0 ${W} ${H}`}
            pointerEvents="none"
          >
            <Line
              x1={LEFT + bar.center * unit}
              x2={LEFT + bar.center * unit}
              y1={0}
              y2={200}
              stroke={colors.foreground}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </Svg>
        ) : null}
      </View>
      {selected !== undefined ? (
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
