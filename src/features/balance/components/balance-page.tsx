import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BalanceContent } from './balance-content';
import type { ChartTooltipPreset } from './balance-chart';
import { EmptyState } from './empty-state';
import { PeriodSegments } from './period-segments';
import { AppText } from '@/components/app-text';
import type { BalanceState } from '@/features/balance/use-balance';
import { space } from '@/theme/spacing';

type BalancePageProps = {
  state: BalanceState;
  // Only for a custom period; the presets name their days themselves.
  periodLabel?: string;
  // Gallery preset: the tolerance card starts open.
  toleranceOpen?: boolean;
  // Gallery preset: the today card starts open.
  todayOpen?: boolean;
  // Gallery preset: a bar of the chart starts selected.
  initialTooltip?: ChartTooltipPreset;
  // Off while a slider is dragged.
  scrollEnabled?: boolean;
  onPickCustom: () => void;
  onOpenQuality: () => void;
};

// The balance tab: period, the balance of that period, today so far, the
// actual burn from balance and scale, the chart, data quality and tolerance.
export function BalancePage({
  state,
  periodLabel,
  toleranceOpen,
  todayOpen,
  initialTooltip,
  scrollEnabled = true,
  onPickCustom,
  onOpenQuality,
}: BalancePageProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      scrollEnabled={scrollEnabled}
      contentContainerStyle={styles.content}
    >
      <View style={styles.top}>
        <AppText variant="largeTitle" accessibilityRole="header">
          {t('home.title')}
        </AppText>
        <PeriodSegments onPickCustom={onPickCustom} />
        {periodLabel === undefined ? null : (
          <AppText variant="secondary" tone="muted">
            {periodLabel}
          </AppText>
        )}
      </View>
      {state.status === 'done' ? (
        <BalanceContent
          report={state.value}
          toleranceOpen={toleranceOpen}
          todayOpen={todayOpen}
          initialTooltip={initialTooltip}
          onOpenQuality={onOpenQuality}
        />
      ) : state.status === 'empty' ? (
        <EmptyState report={state.value} />
      ) : state.status === 'error' ? (
        <EmptyState />
      ) : (
        <AppText variant="secondary" tone="muted">
          {t('home.loading')}
        </AppText>
      )}
      <AppText variant="caption" tone="muted" style={styles.footer}>
        {t('home.footer')}
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: space.xxl,
    gap: 28,
  },
  top: {
    gap: space.m,
  },
  footer: {
    textAlign: 'center',
    paddingHorizontal: space.m,
    lineHeight: 17,
  },
});
