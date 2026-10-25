import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from './empty-state';
import { HeroSection } from './hero-section';
import { PeriodSegments } from './period-segments';
import { QualityRow } from './quality-row';
import { TodayCard } from './today-card';
import { AppText } from '@/components/app-text';
import { LinkButton } from '@/components/link-button';
import { PageIndicator } from '@/components/page-indicator';
import type { BalanceState } from '@/features/balance/use-balance';
import { space } from '@/theme/spacing';

type BalancePageProps = {
  state: BalanceState;
  periodLabel?: string;
  pageCount: number;
  // Gallery preset: the tolerance card starts open.
  toleranceOpen?: boolean;
  // Off while a slider is dragged.
  scrollEnabled?: boolean;
  onShowData: () => void;
  onPickCustom: () => void;
  onOpenQuality: () => void;
};

// First page of the balance tab: period, the balance of that period, its
// data quality and today so far. Chart (P8) and Abgleich (P9) follow below.
export function BalancePage({
  state,
  periodLabel,
  pageCount,
  toleranceOpen,
  scrollEnabled = true,
  onShowData,
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
        <View style={styles.titleRow}>
          <AppText variant="largeTitle" accessibilityRole="header">
            {t('home.title')}
          </AppText>
          <PageIndicator
            count={pageCount}
            index={0}
            accessibilityLabel={t('common.pageOf', {
              current: 1,
              count: pageCount,
            })}
          />
        </View>
        <PeriodSegments onPickCustom={onPickCustom} />
        {periodLabel === undefined ? null : (
          <AppText variant="secondary" tone="muted">
            {periodLabel}
          </AppText>
        )}
      </View>
      {state.status === 'done' ? (
        <>
          <View style={styles.data}>
            <HeroSection
              balance={state.value.balance}
              initialOpen={toleranceOpen}
            />
            <QualityRow balance={state.value.balance} onOpen={onOpenQuality} />
          </View>
          <TodayCard
            today={state.value.today}
            loadedAt={state.value.loadedAt}
          />
        </>
      ) : state.status === 'empty' ? (
        <EmptyState report={state.value} />
      ) : state.status === 'error' ? (
        <EmptyState />
      ) : (
        <AppText variant="secondary" tone="muted">
          {t('home.loading')}
        </AppText>
      )}
      <View style={styles.end}>
        <View style={styles.link}>
          <LinkButton label={t('data.showData')} onPress={onShowData} />
        </View>
        <AppText variant="caption" tone="muted" style={styles.footer}>
          {t('home.footer')}
        </AppText>
      </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.m,
  },
  data: {
    gap: 14,
  },
  end: {
    gap: space.xl,
  },
  link: {
    alignItems: 'flex-start',
  },
  footer: {
    textAlign: 'center',
    paddingHorizontal: space.m,
    lineHeight: 17,
  },
});
