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
import { DataPage } from './data-page';
import { periodText } from '../data-rows';
import { useBalance } from '../use-balance';
import { PageIndicator } from '@/components/page-indicator';
import { useSettings } from '@/storage/settings-context';
import { space } from '@/theme/spacing';
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
  const days =
    state.status === 'done' || state.status === 'empty'
      ? state.value.balance.days
      : period.kind === 'days'
        ? period.days
        : undefined;
  const periodLabel = periodText(days, includeToday, t);
  const pager = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  function showPage(index: number) {
    pager.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <PageIndicator
          count={PAGES}
          index={page}
          accessibilityLabel={t('common.pageOf', {
            current: page + 1,
            count: PAGES,
          })}
        />
      </View>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setPage(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        style={styles.flex}
      >
        <View style={{ width }}>
          <BalancePage
            state={state}
            days={days}
            periodLabel={periodLabel}
            onShowData={() => showPage(1)}
          />
        </View>
        <View style={{ width }}>
          <DataPage state={state} periodLabel={periodLabel} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xl,
  },
});
