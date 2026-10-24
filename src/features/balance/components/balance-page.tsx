import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BalanceHero } from './balance-hero';
import { PeriodSegments } from './period-segments';
import { heroModel } from '../hero';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { LinkButton } from '@/components/link-button';
import { PageIndicator } from '@/components/page-indicator';
import type { PeriodBalance } from '@/core/period-balance';
import type { BalanceState } from '@/features/balance/use-balance';
import { openHealthApp } from '@/health/open-health-app';
import { formatLocale } from '@/i18n';
import { useSettings } from '@/storage/settings-context';
import { space } from '@/theme/spacing';

function EmptyState({ days }: { days?: number }) {
  const { t } = useTranslation();

  // iOS reports denied read access as empty data, so a period without any
  // food entries shows a permissions hint instead of a balance.
  return (
    <View style={styles.group}>
      <AppText>{t('home.empty', { count: days ?? 0 })}</AppText>
      <Button
        variant="secondary"
        label={t('home.checkPermissions')}
        onPress={openHealthApp}
      />
      <AppText variant="caption" tone="muted">
        {t('common.permissionsPath')}
      </AppText>
    </View>
  );
}

function BalanceSummary({
  balance,
  onShowData,
}: {
  balance: PeriodBalance;
  onShowData: () => void;
}) {
  const { t } = useTranslation();
  const locale = formatLocale();
  const { tolerance } = useSettings();

  return (
    <View style={styles.summary}>
      <BalanceHero model={heroModel(balance, tolerance, locale, t)} />
      {/* Until the data quality row replaces them. */}
      {balance.maintenanceDays > 0 ? (
        <AppText variant="caption" tone="muted">
          {t('home.daysWithoutFood', { count: balance.maintenanceDays })}
        </AppText>
      ) : null}
      {balance.excludedDays > 0 ? (
        <AppText variant="caption" tone="muted">
          {t('home.daysWithoutResting', { count: balance.excludedDays })}
        </AppText>
      ) : null}
      <View style={styles.link}>
        <LinkButton label={t('data.showData')} onPress={onShowData} />
      </View>
    </View>
  );
}

type BalancePageProps = {
  state: BalanceState;
  // Days of the period; undefined while a period like "all" is loading.
  days?: number;
  periodLabel?: string;
  pageCount: number;
  onShowData: () => void;
  onPickCustom: () => void;
};

// First page of the balance tab: period, then the balance of that period.
export function BalancePage({
  state,
  days,
  periodLabel,
  pageCount,
  onShowData,
  onPickCustom,
}: BalancePageProps) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.content}>
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
        <BalanceSummary balance={state.value.balance} onShowData={onShowData} />
      ) : state.status === 'empty' || state.status === 'error' ? (
        <EmptyState days={days} />
      ) : (
        <AppText variant="secondary" tone="muted">
          {t('home.loading')}
        </AppText>
      )}
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
  summary: {
    gap: 14,
  },
  group: {
    gap: space.m,
  },
  link: {
    alignItems: 'flex-start',
  },
});
