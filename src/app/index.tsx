import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { LinkButton } from '@/components/link-button';
import { fatKgFromKcal, type PeriodBalance } from '@/core/balance';
import { formatSigned } from '@/core/format';
import { useBalance } from '@/features/balance/use-balance';
import { formatLocale } from '@/i18n';
import { resetIntro } from '@/storage/settings';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Without a balance (failed load) the empty state is shown.
function BalanceSummary({ balance }: { balance?: PeriodBalance }) {
  const { t } = useTranslation();
  const locale = formatLocale();

  // iOS can't tell us about denied access, so no data at all means "check".
  if (!balance || balance.daysWithoutFood === balance.days) {
    return (
      <>
        <AppText style={styles.center}>{t('home.empty')}</AppText>
        <Button
          variant="secondary"
          label={t('home.checkPermissions')}
          onPress={() => Linking.openSettings()}
        />
      </>
    );
  }

  // Rounded to 10 kcal to avoid false precision.
  const kcal = Math.round(balance.kcal / 10) * 10;

  return (
    <>
      <View style={styles.group}>
        <AppText variant="numberLarge" style={styles.center}>
          {t('home.kcal', { value: formatSigned(kcal, locale) })}
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
    </>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const state = useBalance();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="bodyStrong" style={styles.center}>
          {t('home.period')}
        </AppText>
        {state.status === 'done' ? (
          <BalanceSummary balance={state.value} />
        ) : state.status === 'error' ? (
          <BalanceSummary />
        ) : (
          <AppText variant="secondary" tone="muted" style={styles.center}>
            {t('home.loading')}
          </AppText>
        )}
        {__DEV__ ? (
          <LinkButton label="Reset intro (dev)" onPress={resetIntro} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
