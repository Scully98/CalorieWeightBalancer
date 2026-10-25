import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { LegendHint } from '../chart-model';
import { AppText } from '@/components/app-text';
import { QualitySwatch } from '@/components/quality-pattern';
import type { DayFlag } from '@/core/day-balance';
import { useColors } from '@/theme/use-colors';

const HINT_SWATCH: Partial<Record<LegendHint, DayFlag>> = {
  estimated: 'restingEstimated',
  weekIncomplete: 'restingEstimated',
  lowFood: 'lowFood',
  noFood: 'noFood',
};

const SWATCH_SIZE = 10;

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

// What the patterns, the dashed bar and the lines mean.
export function ChartLegend({ hints }: { hints: readonly LegendHint[] }) {
  const { t } = useTranslation();

  return (
    <View style={styles.hints}>
      {hints.map((hint) => (
        <View key={hint} style={styles.hint}>
          <HintMark hint={hint} />
          <AppText variant="caption" tone="muted">
            {t(`chart.hints.${hint}`)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
