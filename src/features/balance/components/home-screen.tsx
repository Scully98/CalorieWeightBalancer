import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ChartTooltipPreset } from './balance-chart';
import { BalancePage } from './balance-page';
import { DateRangeSheet } from './date-range-sheet';
import { DataPage } from './data-page';
import { IncompleteDaysSheet } from './incomplete-days-sheet';
import type { DateRangeSelection } from '../date-range';
import { periodSpan, periodSubtitle } from '../period-subtitle';
import { useBalance } from '../use-balance';
import { formatLocale } from '@/i18n';
import { addDays } from '@/core/dates';
import { toDateKey } from '@/core/day-record';
import { ScrollLockContext } from '@/hooks/scroll-lock';
import { useSettings, useSettingsStore } from '@/storage/settings-context';
import { useColors } from '@/theme/use-colors';

const PAGES = 2;

// Start state for the development gallery; the app never passes it.
export type HomeUi = {
  toleranceOpen?: boolean;
  picker?: DateRangeSelection;
  sheet?: 'incompleteDays';
  tooltip?: ChartTooltipPreset;
};

// Balance on the first page, the Health data behind it one swipe to the right.
// Both pages read the same load, so their numbers always match.
export function HomeScreen({ initialUi }: { initialUi?: HomeUi } = {}) {
  const colors = useColors();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { period, includeToday, zeroDaysAsMaintenance } = useSettings();
  const state = useBalance();
  const now = new Date();
  const span = periodSpan(
    period,
    includeToday,
    now,
    state.status === 'done' || state.status === 'empty'
      ? state.value.days
      : undefined,
  );
  const periodLabel =
    span && periodSubtitle(period, span, includeToday, now, formatLocale(), t);
  const pager = useRef<ScrollView>(null);
  const store = useSettingsStore();
  // Open while „Eigener“ is being picked.
  const [picking, setPicking] = useState(initialUi?.picker);
  // A slider is being dragged: neither the pager nor the page may scroll.
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

  function showPage(index: number) {
    pager.current?.scrollTo({ x: index * width, animated: true });
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollLockContext value={setScrollLocked}>
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          scrollEnabled={!scrollLocked}
          showsHorizontalScrollIndicator={false}
          style={styles.flex}
        >
          <View style={{ width }}>
            <BalancePage
              state={state}
              periodLabel={periodLabel}
              pageCount={PAGES}
              toleranceOpen={initialUi?.toleranceOpen}
              initialTooltip={initialUi?.tooltip}
              scrollEnabled={!scrollLocked}
              onShowData={() => showPage(1)}
              onOpenQuality={() => setQualityOpen(true)}
              onPickCustom={() =>
                setPicking({
                  from: span?.first ?? toDateKey(addDays(now, -30)),
                  to: span?.last ?? toDateKey(addDays(now, -1)),
                  editing: 'from',
                })
              }
            />
          </View>
          <View style={{ width }}>
            <DataPage
              state={state}
              periodLabel={periodLabel}
              pageCount={PAGES}
            />
          </View>
        </ScrollView>
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
