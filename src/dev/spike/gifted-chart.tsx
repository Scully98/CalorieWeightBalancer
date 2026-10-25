import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { type SpikeData, tooltipText } from './spike-data';
import { AppText } from '@/components/app-text';
import {
  QualityPatternDefs,
  usePatternPrefix,
} from '@/components/quality-pattern';
import { useColors } from '@/theme/use-colors';

// Spike candidate react-native-gifted-charts: BarChart with negative values,
// a secondary y axis for two lines and the long-press pointer.

const HEIGHT = 92;

export function GiftedChart({
  data,
  width,
}: {
  data: SpikeData;
  width: number;
}) {
  const colors = useColors();
  const prefix = usePatternPrefix();
  const [selected, setSelected] = useState<number>();
  const plotWidth = width - 80;
  const unit = plotWidth / data.slots;

  const bars = data.bars.map((bar) => {
    const barWidth = Math.min(26, bar.span * unit * (data.daily ? 0.7 : 0.78));
    return {
      value: bar.value ?? 0,
      label: bar.label,
      barWidth,
      spacing: bar.span * unit - barWidth,
      frontColor: bar.kind === 'full' ? colors.foreground : colors.background,
      barBorderWidth: bar.kind && bar.kind !== 'full' ? 1 : 0,
      barBorderColor: colors.foreground,
      barStyle:
        bar.kind === 'today' ? { borderStyle: 'dashed' as const } : undefined,
      ...(bar.kind === 'hatch' || bar.kind === 'stripes'
        ? {
            // The library wraps this in <Defs> inside each bar's own <Svg>.
            barBackgroundPattern: () => (
              <QualityPatternDefs idPrefix={prefix} />
            ),
            patternId: `${prefix}-${bar.kind === 'hatch' ? 'hatch' : 'stripes'}`,
          }
        : {}),
    };
  });
  // Two lines at most in a BarChart: weight and fat; the theoretical fat
  // line and hollow measurement points don't fit.
  const weight = data.points.map((point) => ({ value: point.weight ?? 0 }));
  const fat = data.points.map((point) => ({ value: point.fat ?? 0 }));

  return (
    <View>
      <BarChart
        data={bars}
        width={plotWidth}
        height={HEIGHT}
        maxValue={data.kcalMax}
        mostNegativeValue={-data.kcalMax}
        noOfSections={2}
        noOfSectionsBelowXAxis={2}
        stepValue={data.kcalMax / 2}
        initialSpacing={0}
        endSpacing={0}
        yAxisLabelWidth={40}
        yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
        rulesColor={colors.separator}
        rulesType="solid"
        xAxisColor={colors.foreground}
        xAxisThickness={1.25}
        yAxisThickness={0}
        disableScroll
        isAnimated={false}
        showLine
        lineData={weight}
        lineData2={fat}
        lineConfig={{
          isSecondary: true,
          color: colors.foreground,
          thickness: 2.6,
          hideDataPoints: true,
        }}
        lineConfig2={{
          isSecondary: true,
          color: colors.foreground,
          thickness: 1.8,
          strokeDashArray: [6, 3.5],
          hideDataPoints: true,
        }}
        secondaryYAxis={{
          maxValue: data.kgMax,
          mostNegativeValue: -data.kgMax,
          noOfSections: 2,
          noOfSectionsBelowXAxis: 2,
          yAxisTextStyle: { color: colors.muted, fontSize: 10 },
          yAxisThickness: 0,
        }}
        pointerConfig={{
          activatePointersOnLongPress: true,
          activatePointersDelay: 300,
          persistPointer: true,
          pointerStripColor: colors.foreground,
          pointerStripWidth: 1,
          strokeDashArray: [2, 2],
          pointerColor: colors.foreground,
          radius: 0,
          pointerLabelComponent: (_: unknown, __: unknown, index: number) => {
            setTimeout(() => setSelected(index), 0);
            return null;
          },
        }}
        onPress={(_: unknown, index: number) =>
          setSelected((current) => (current === index ? undefined : index))
        }
      />
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
