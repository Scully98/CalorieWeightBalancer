import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ChartTooltipPreset } from './balance-chart';
import { BalancePage } from './balance-page';
import { DateRangeSheet } from './date-range-sheet';
import { IncompleteDaysSheet } from './incomplete-days-sheet';
import type { DateRangeSelection } from '../date-range';
import { periodSpan, periodSubtitle } from '../period-subtitle';
import { useBalance } from '../use-balance';
import { addDays } from '@/core/dates';
import { toDateKey } from '@/core/day-record';
import { ScrollLockContext } from '@/hooks/scroll-lock';
import { useSettings, useSettingsStore } from '@/storage/settings-context';
import { useColors } from '@/theme/use-colors';

// Start state for the development gallery; the app never passes it.
export type HomeUi = {
  toleranceOpen?: boolean;
  todayOpen?: boolean;
  picker?: DateRangeSelection;
  sheet?: 'incompleteDays';
  tooltip?: ChartTooltipPreset;
};

// The balance page with its two sheets.
export function HomeScreen({ initialUi }: { initialUi?: HomeUi } = {}) {
  const colors = useColors();
  const { t } = useTranslation();
  const { period, includeToday, zeroDaysAsMaintenance } = useSettings();
  const state = useBalance();
  const now = new Date();
  const span = periodSpan(period, includeToday, now);
  const periodLabel =
    period.kind === 'custom' && span
      ? periodSubtitle(span, includeToday, now, t)
      : undefined;
  const store = useSettingsStore();
  // Open while „Eigener“ is being picked.
  const [picking, setPicking] = useState(initialUi?.picker);
  // A slider is being dragged: the page may not scroll.
  const [scrollLocked, setScrollLocked] = useState(false);
  // „Unvollständige Tage“ is open.
  const [qualityOpen, setQualityOpen] = useState(
    initialUi?.sheet === 'incompleteDays',
  );
  // Days for the sheet; a reload without incomplete days closes it.
  const incompleteDays =
    state.status === 'done' &&
    state.value.balance.completeDays < state.value.balance.days
      ? state.value.days
      : undefined;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollLockContext value={setScrollLocked}>
        <BalancePage
          state={state}
          periodLabel={periodLabel}
          toleranceOpen={initialUi?.toleranceOpen}
          todayOpen={initialUi?.todayOpen}
          initialTooltip={initialUi?.tooltip}
          scrollEnabled={!scrollLocked}
          onOpenQuality={() => setQualityOpen(true)}
          onPickCustom={() =>
            setPicking({
              from: span?.first ?? toDateKey(addDays(now, -30)),
              to: span?.last ?? toDateKey(addDays(now, -1)),
              editing: 'from',
            })
          }
        />
      </ScrollLockContext>
      {picking ? (
        <DateRangeSheet
          initial={picking}
          includeToday={includeToday}
          onCancel={() => setPicking(undefined)}
          onApply={(from, to) => {
            store.updateSettings({ period: { kind: 'custom', from, to } });
            setPicking(undefined);
          }}
        />
      ) : null}
      {qualityOpen && incompleteDays ? (
        <IncompleteDaysSheet
          days={incompleteDays}
          settings={{ zeroDaysAsMaintenance }}
          onClose={() => setQualityOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
