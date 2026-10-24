import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { LinkButton } from '@/components/link-button';
import type { PeriodBalance } from '@/core/period-balance';
import { formatSigned, roundKcal } from '@/core/format';
import type { BalanceState } from '@/features/balance/use-balance';
import { openHealthApp } from '@/health/open-health-app';
import { formatLocale } from '@/i18n';
import { space } from '@/theme/spacing';

type BalanceSummaryProps = {
  // Without a balance (failed load) the empty state is shown.
  balance?: PeriodBalance;
  days?: number;
  onShowData: () => void;
};

function BalanceSummary({ balance, days, onShowData }: BalanceSummaryProps) {
  const { t } = useTranslation();
  const locale = formatLocale();

  // iOS reports denied read access as empty data, so a period without any
  // food entries shows the empty state with a permissions hint instead of a
  // balance.
  if (!balance || balance.flagCounts.noFood === balance.days) {
    return (
      <>
        <AppText style={styles.center}>
          {t('home.empty', { count: balance?.days ?? days ?? 0 })}
        </AppText>
        <View style={styles.group}>
          <Button
            variant="secondary"
            label={t('home.checkPermissions')}
            onPress={openHealthApp}
          />
          <AppText variant="caption" tone="muted" style={styles.center}>
            {t('common.permissionsPath')}
          </AppText>
        </View>
      </>
    );
  }

  return (
    <>
      <View style={styles.group}>
        <AppText variant="numberLarge" style={styles.center}>
          {t('home.kcal', {
            value: formatSigned(roundKcal(balance.kcal), locale),
          })}
        </AppText>
        <AppText variant="secondary" tone="muted" style={styles.center}>
          {t('home.sign')}
        </AppText>
      </View>
      <View style={styles.group}>
        <AppText variant="number" style={styles.center}>
          {t('home.fat', {
            value: formatSigned(balance.fatKg, locale, 1),
          })}
        </AppText>
        <AppText variant="secondary" tone="muted" style={styles.center}>
          {t('home.fatLabel')}
        </AppText>
      </View>
      {balance.maintenanceDays > 0 ? (
        <AppText variant="caption" tone="muted" style={styles.center}>
          {t('home.daysWithoutFood', { count: balance.maintenanceDays })}
        </AppText>
      ) : null}
      {balance.excludedDays > 0 ? (
        <AppText variant="caption" tone="muted" style={styles.center}>
          {t('home.daysWithoutResting', { count: balance.excludedDays })}
        </AppText>
      ) : null}
      <LinkButton label={t('data.showData')} onPress={onShowData} />
    </>
  );
}

type BalancePageProps = {
  state: BalanceState;
  // Days of the period; undefined while a period like "all" is loading.
  days?: number;
  onShowData: () => void;
};

export function BalancePage({ state, days, onShowData }: BalancePageProps) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {days === undefined ? null : (
        <AppText variant="bodyStrong" style={styles.center}>
          {t('home.period', { count: days })}
        </AppText>
      )}
      {state.status === 'done' ? (
        <BalanceSummary
          balance={state.value.balance}
          days={days}
          onShowData={onShowData}
        />
      ) : state.status === 'error' ? (
        <BalanceSummary days={days} onShowData={onShowData} />
      ) : (
        <AppText variant="secondary" tone="muted" style={styles.center}>
          {t('home.loading')}
        </AppText>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.xl,
    gap: space.xl,
  },
  group: {
    alignItems: 'center',
    gap: space.xs,
  },
  center: {
    textAlign: 'center',
  },
});
