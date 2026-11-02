import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { todayCard } from '../today';
import type { BalanceReport } from '../use-balance';
import { AppText } from '@/components/app-text';
import { formatLocale } from '@/i18n';
import { useSettings, useSettingsStore } from '@/storage/settings-context';
import { border, space, touchTarget } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type TodayCardProps = Pick<BalanceReport, 'today' | 'loadedAt'> & {
  initialOpen?: boolean;
};

const PLUS = { circle: 28, length: 12, stroke: 2 };

// Plus in a circle: hollow when today stays out of the balance, filled when it
// counts. Next to the toggle, not inside it, so a tap here never folds the
// card and VoiceOver reaches both.
function IncludeToday({ label }: { label: string }) {
  const colors = useColors();
  const store = useSettingsStore();
  const { includeToday } = useSettings();
  const mark = includeToday ? colors.background : colors.foreground;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: includeToday }}
      onPress={() => store.updateSettings({ includeToday: !includeToday })}
      style={styles.include}
    >
      <View
        style={[
          styles.circle,
          {
            borderColor: colors.foreground,
            backgroundColor: includeToday ? colors.foreground : undefined,
          },
        ]}
      >
        <View style={[styles.plusBar, { backgroundColor: mark }]} />
        <View style={[styles.plusStem, { backgroundColor: mark }]} />
      </View>
    </Pressable>
  );
}

// „Heute“: the running day up to the last load, folded to one row. Dashed like
// everything provisional; the plus decides whether it counts in the balance.
export const TodayCard = memo(function TodayCard({
  today,
  loadedAt,
  initialOpen = false,
}: TodayCardProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [open, setOpen] = useState(initialOpen);
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
      <View style={styles.row}>
        {card.canInclude ? <IncludeToday label={t('today.include')} /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={card.labels.header}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(!open)}
          style={styles.toggle}
        >
          <View style={styles.titleGroup}>
            <AppText variant="bodyStrong">{t('today.title')}</AppText>
            <AppText variant="secondary" tone="muted">
              {card.asOf}
            </AppText>
          </View>
          <AppText variant="bodyStrong">{card.collapsed}</AppText>
          <View
            style={[
              styles.chevron,
              open ? styles.chevronUp : styles.chevronDown,
              { borderColor: colors.foreground },
            ]}
          />
        </Pressable>
      </View>
      {open ? (
        <View style={styles.body}>
          <View style={[styles.grid, { borderTopColor: colors.separator }]}>
            {column(
              t('today.balance'),
              card.balance,
              card.balanceUnit,
              card.labels.balance,
              true,
            )}
            {column(
              t('today.food'),
              card.food,
              t('today.unit'),
              card.labels.food,
            )}
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
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: border.medium,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: space.xs,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  include: {
    width: touchTarget,
    height: touchTarget,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: PLUS.circle,
    height: PLUS.circle,
    borderRadius: PLUS.circle / 2,
    borderWidth: border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBar: {
    position: 'absolute',
    width: PLUS.length,
    height: PLUS.stroke,
  },
  plusStem: {
    position: 'absolute',
    width: PLUS.stroke,
    height: PLUS.length,
  },
  toggle: {
    flex: 1,
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // At large text sizes „Stand“ wraps below the title.
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: space.s,
  },
  chevron: {
    width: 8,
    height: 8,
    marginHorizontal: 2,
    borderRightWidth: border.thick,
    borderBottomWidth: border.thick,
  },
  chevronDown: {
    transform: [{ translateY: -2 }, { rotate: '45deg' }],
  },
  chevronUp: {
    transform: [{ translateY: 2 }, { rotate: '-135deg' }],
  },
  body: {
    gap: 10,
    paddingBottom: space.m,
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
