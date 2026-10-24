import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageIndicator } from '@/components/page-indicator';
import { BalancePage } from '@/features/balance/components/balance-page';
import { DataPage } from '@/features/balance/components/data-page';
import { useBalance } from '@/features/balance/use-balance';
import { DEFAULT_SETTINGS } from '@/core/settings';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

const PAGES = 2;

// Balance on the first page, the Health data behind it one swipe to the right.
// Both pages read the same load, so their numbers always match.
export default function HomeScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const period = DEFAULT_SETTINGS.period;
  const state = useBalance(period);
  const days =
    state.status === 'done'
      ? state.value.balance.days
      : period.kind === 'days'
        ? period.days
        : undefined;
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
            onShowData={() => showPage(1)}
          />
        </View>
        <View style={{ width }}>
          <DataPage state={state} days={days} />
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
