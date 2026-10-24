import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalancePage } from './balance-page';
import { DataPage } from './data-page';
import { periodSpan, periodSubtitle } from '../period-subtitle';
import { useBalance } from '../use-balance';
import { formatLocale } from '@/i18n';
import { useSettings } from '@/storage/settings-context';
import { useColors } from '@/theme/use-colors';

const PAGES = 2;

// Balance on the first page, the Health data behind it one swipe to the right.
// Both pages read the same load, so their numbers always match.
export function HomeScreen() {
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
            onPickCustom={() => {}}
          />
        </View>
        <View style={{ width }}>
          <DataPage state={state} periodLabel={periodLabel} pageCount={PAGES} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
