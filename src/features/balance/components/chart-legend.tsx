import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { LINE_STROKE } from './chart-canvas';
import type {
  ChartLegend as Legend,
  ChartSeries,
  LegendHint,
} from '../chart-model';
import { AppText } from '@/components/app-text';
import { QualitySwatch } from '@/components/quality-pattern';
import type { DayFlag } from '@/core/day-balance';
import { border } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

const HINT_SWATCH: Partial<Record<LegendHint, DayFlag>> = {
  estimated: 'restingEstimated',
  weekIncomplete: 'restingEstimated',
  lowFood: 'lowFood',
  noFood: 'noFood',
};

const SWATCH_SIZE = 10;
const CHIP_ICON = { width: 22, height: 8 };
const HIDDEN_OPACITY = 0.35;

function HintMark({ hint }: { hint: LegendHint }) {
  const colors = useColors();
  const flag = HINT_SWATCH[hint];
  if (flag) return <QualitySwatch flag={flag} size={SWATCH_SIZE} />;
  if (hint === 'todayExcluded' || hint === 'todayIncluded')
    return (
      <View
        accessible={false}
        style={[styles.dashed, { borderColor: colors.foreground }]}
      />
    );
  return null;
}

// Bar or line sample of a chip, drawn like the chart.
function ChipIcon({ series }: { series: ChartSeries }) {
  const colors = useColors();
  if (series === 'bars')
    return (
      <View style={[styles.barIcon, { backgroundColor: colors.foreground }]} />
    );
  const stroke = LINE_STROKE[series];
  const inset = stroke.strokeLinecap ? 1.5 : 0;
  return (
    <Svg
      width={CHIP_ICON.width}
      height={CHIP_ICON.height}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Line
        x1={inset}
        x2={CHIP_ICON.width - inset}
        y1={CHIP_ICON.height / 2}
        y2={CHIP_ICON.height / 2}
        stroke={colors.foreground}
        {...stroke}
      />
    </Svg>
  );
}

type ChartLegendProps = {
  legend: Legend;
  onToggle: (series: ChartSeries) => void;
};

// Chips that show or hide bars and lines, and what the patterns, the dashed
// bar and the lines mean.
export function ChartLegend({ legend, onToggle }: ChartLegendProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={styles.legend}>
      <View style={styles.chips}>
        {legend.chips.map((chip) => (
          <Pressable
            key={chip.series}
            accessibilityRole="switch"
            accessibilityState={{ checked: chip.visible }}
            accessibilityLabel={t(`chart.chips.${chip.series}`)}
            onPress={() => onToggle(chip.series)}
            style={[
              styles.chip,
              {
                borderColor: colors.foreground,
                opacity: chip.visible ? 1 : HIDDEN_OPACITY,
              },
            ]}
          >
            <ChipIcon series={chip.series} />
            <AppText variant="footnote">
              {t(`chart.chips.${chip.series}`)}
            </AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.hints}>
        {legend.hints.map((hint) => (
          <View key={hint} style={styles.hint}>
            <HintMark hint={hint} />
            <AppText variant="caption" tone="muted">
              {t(`chart.hints.${hint}`)}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    gap: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 32,
    paddingHorizontal: 11,
    borderWidth: border.medium,
    borderRadius: 16,
  },
  barIcon: {
    width: 7,
    height: 13,
  },
  hints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 5,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dashed: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
