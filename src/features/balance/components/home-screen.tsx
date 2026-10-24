import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalancePage } from './balance-page';
import { DateRangeSheet } from './date-range-sheet';
import { DataPage } from './data-page';
import type { DateRangeSelection } from '../date-range';
import { periodSpan, periodSubtitle } from '../period-subtitle';
import { useBalance } from '../use-balance';
import { formatLocale } from '@/i18n';
import { addDays } from '@/core/dates';
import { toDateKey } from '@/core/day-record';
import { useSettings, useSettingsStore } from '@/storage/settings-context';
import { useColors } from '@/theme/use-colors';

const PAGES = 2;

// Start state for the development gallery; the app never passes it.
export type HomeUi = {
  toleranceOpen?: boolean;
  picker?: DateRangeSelection;
};

// Balance on the first page, the Health data behind it one swipe to the right.
// Both pages read the same load, so their numbers always match.
export function HomeScreen({ initialUi }: { initialUi?: HomeUi } = {}) {
  const colors = useColors();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { period, includeToday } = useSettings();
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

  function showPage(index: number) {
    pager.current?.scrollTo({ x: index * width, animated: true });
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.flex}
      >
        <View style={{ width }}>
          <BalancePage
            state={state}
            days={span?.days}
            periodLabel={periodLabel}
            pageCount={PAGES}
            onShowData={() => showPage(1)}
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
          <DataPage state={state} periodLabel={periodLabel} pageCount={PAGES} />
        </View>
      </ScrollView>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
