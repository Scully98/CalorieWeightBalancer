import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { LinkButton } from '@/components/link-button';
import { fatKgFromKcal, type PeriodBalance } from '@/core/balance';
import { formatSigned, roundKcal } from '@/core/format';
import type { BalanceState } from '@/features/balance/use-balance';
import { openHealthApp } from '@/health/open-health-app';
import { formatLocale } from '@/i18n';
import { resetIntro } from '@/storage/settings';
import { space } from '@/theme/spacing';

type BalanceSummaryProps = {
  // Without a balance (failed load) the empty state is shown.
  balance?: PeriodBalance;
  onShowData: () => void;
};

function BalanceSummary({ balance, onShowData }: BalanceSummaryProps) {
  const { t } = useTranslation();
  const locale = formatLocale();

  // iOS can't tell us about denied access, so no data at all means "check".
  if (!balance || balance.daysWithoutFood === balance.days) {
    return (
      <>
        <AppText style={styles.center}>{t('home.empty')}</AppText>
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
            value: formatSigned(fatKgFromKcal(balance.kcal), locale, 1),
          })}
        </AppText>
        <AppText variant="secondary" tone="muted" style={styles.center}>
          {t('home.fatLabel')}
        </AppText>
      </View>
      {balance.daysWithoutFood > 0 ? (
        <AppText variant="caption" tone="muted" style={styles.center}>
          {t('home.daysWithoutFood', { count: balance.daysWithoutFood })}
        </AppText>
      ) : null}
      {balance.daysWithoutResting > 0 ? (
        <AppText variant="caption" tone="muted" style={styles.center}>
          {t('home.daysWithoutResting', { count: balance.daysWithoutResting })}
        </AppText>
      ) : null}
      <LinkButton label={t('data.showData')} onPress={onShowData} />
    </>
  );
}

type BalancePageProps = {
  state: BalanceState;
  onShowData: () => void;
};

export function BalancePage({ state, onShowData }: BalancePageProps) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText variant="bodyStrong" style={styles.center}>
        {t('home.period')}
      </AppText>
      {state.status === 'done' ? (
        <BalanceSummary balance={state.value.balance} onShowData={onShowData} />
      ) : state.status === 'error' ? (
        <BalanceSummary onShowData={onShowData} />
      ) : (
        <AppText variant="secondary" tone="muted" style={styles.center}>
          {t('home.loading')}
        </AppText>
      )}
      {__DEV__ ? (
        <LinkButton label="Reset intro (dev)" onPress={resetIntro} />
      ) : null}
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
