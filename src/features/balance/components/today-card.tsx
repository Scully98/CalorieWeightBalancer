import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
const CHECK_SIZE = 14;

// Plus in a hollow circle when today stays out of the balance, check in a
// filled one when it counts. Next to the toggle, not inside it, so a tap here never folds the
// card and VoiceOver reaches both.
function IncludeToday({ label }: { label: string }) {
  const colors = useColors();
  const store = useSettingsStore();
  const { includeToday } = useSettings();

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
        {includeToday ? (
          <Svg
            width={CHECK_SIZE}
            height={CHECK_SIZE}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <Path
              d="M2 7.5 L5.5 11 L12 3.5"
              fill="none"
              stroke={colors.background}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <>
            <View
              style={[styles.plusBar, { backgroundColor: colors.foreground }]}
            />
            <View
              style={[styles.plusStem, { backgroundColor: colors.foreground }]}
            />
          </>
        )}
      </View>
    </Pressable>
  );
}

// „Heute“: the running day up to the last load, folded to one row. The plus
// decides whether it counts in the balance: solid when it does, otherwise
// dashed like everything provisional.
export const TodayCard = memo(function TodayCard({
  today,
  loadedAt,
  initialOpen = false,
}: TodayCardProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { includeToday } = useSettings();
  const [open, setOpen] = useState(initialOpen);
  const card = todayCard(today, loadedAt, formatLocale(), t);

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: colors.foreground,
          borderStyle: includeToday && card.canInclude ? 'solid' : 'dashed',
        },
      ]}
    >
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
          <View accessible accessibilityLabel={card.labels.food}>
            <View style={styles.line}>
              <AppText variant="secondary">{t('today.food')}</AppText>
              <AppText variant="secondary" style={styles.value}>
                {card.food}
              </AppText>
            </View>
          </View>
          <View accessible accessibilityLabel={card.labels.burn}>
            <View style={styles.line}>
              <AppText variant="secondary">{t('today.burn')}</AppText>
              <AppText variant="secondary" style={styles.value}>
                {card.burn}
              </AppText>
            </View>
            {card.burnDetail ? (
              <AppText variant="footnote" tone="muted">
                {card.burnDetail}
              </AppText>
            ) : null}
          </View>
          <AppText variant="footnote" tone="muted" style={styles.note}>
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
    gap: space.s,
    paddingTop: space.xs,
    paddingBottom: space.m,
  },
  // At large text sizes the value wraps below the label.
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: space.m,
  },
  value: {
    marginLeft: 'auto',
  },
  note: {
    marginTop: space.xs,
  },
});
