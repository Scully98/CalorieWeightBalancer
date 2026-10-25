import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { todayCard } from '../today';
import type { BalanceReport } from '../use-balance';
import { AppText } from '@/components/app-text';
import { formatLocale } from '@/i18n';
import { border, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type TodayCardProps = Pick<BalanceReport, 'today' | 'loadedAt'>;

// „Heute bisher“: the running day up to the last load. Dashed like everything
// provisional, so it never reads as part of the balance above.
export function TodayCard({ today, loadedAt }: TodayCardProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const card = todayCard(today, loadedAt, formatLocale(), t);

  const column = (
    label: string,
    value: string,
    unit: string,
    spoken: string,
    strong = false,
  ) => (
    <View accessible accessibilityLabel={spoken} style={styles.column}>
      <AppText variant="overline" tone="muted">
        {label}
      </AppText>
      <AppText
        variant="numberMedium"
        style={strong ? styles.strong : undefined}
      >
        {value}
      </AppText>
      <AppText variant="footnote" tone="muted">
        {unit}
      </AppText>
    </View>
  );

  return (
    <View style={[styles.card, { borderColor: colors.foreground }]}>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={card.labels.header}
        style={styles.header}
      >
        <AppText variant="bodyStrong">{t('today.title')}</AppText>
        <AppText variant="secondary" tone="muted">
          {card.asOf}
        </AppText>
      </View>
      <View style={[styles.grid, { borderTopColor: colors.separator }]}>
        {column(
          t('today.balance'),
          card.balance,
          card.balanceUnit,
          card.labels.balance,
          true,
        )}
        {column(t('today.food'), card.food, t('today.unit'), card.labels.food)}
        {column(
          t('today.burn'),
          card.burn,
          card.burnDetail ?? t('today.unit'),
          card.labels.burn,
        )}
      </View>
      <AppText variant="footnote" tone="muted">
        {card.note}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: border.medium,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: space.l,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.s,
  },
  // Three columns; at large text sizes they wrap.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.m,
    borderTopWidth: 1,
    paddingTop: space.m,
  },
  column: {
    flexGrow: 1,
    flexBasis: 92,
    gap: space.xs,
  },
  strong: {
    fontWeight: '600',
  },
});
