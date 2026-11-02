import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { toleranceSummary, type HeroModel } from '../hero';
import { AppText } from '@/components/app-text';
import { MarkedSlider } from '@/components/marked-slider';
import {
  TOLERANCE_LIMITS,
  TOLERANCE_NORM,
  type Settings,
} from '@/core/settings';
import { border, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type Tolerance = Settings['tolerance'];
type Side = keyof Tolerance;

type ToleranceCardProps = {
  tolerance: Tolerance;
  // The hero is out of sight down here, so the card repeats the range.
  hero: HeroModel;
  open: boolean;
  onToggle: () => void;
  onChange: (tolerance: Tolerance) => void;
  onComplete: (tolerance: Tolerance) => void;
};

// „Messfehler einrechnen“: folds open to the live range and two sliders, food
// ± and burn −.
export function ToleranceCard({
  tolerance,
  hero,
  open,
  onToggle,
  onChange,
  onComplete,
}: ToleranceCardProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const summary = toleranceSummary(tolerance, t);

  const slider = (side: Side) => {
    const value = tolerance[side];
    const norm = TOLERANCE_NORM[side];
    const food = side === 'foodPercent';
    return (
      <MarkedSlider
        label={t(food ? 'tolerance.food' : 'tolerance.burn')}
        value={value}
        max={TOLERANCE_LIMITS[side]}
        norm={norm}
        valueText={
          value ? t('tolerance.percent', { value }) : t('tolerance.off')
        }
        captions={[
          t(food ? 'tolerance.foodHint' : 'tolerance.burnHint'),
          t('tolerance.typical', norm),
        ]}
        accessibilityLabel={t(
          food ? 'tolerance.foodSpoken' : 'tolerance.burnSpoken',
        )}
        accessibilityValueText={
          value ? t('tolerance.percentSpoken', { value }) : t('tolerance.off')
        }
        onChange={(next) => onChange({ ...tolerance, [side]: next })}
        onComplete={(next) => onComplete({ ...tolerance, [side]: next })}
      />
    );
  };

  return (
    <View style={[styles.card, { borderColor: colors.foreground }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('tolerance.title')}, ${summary.spoken}`}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={styles.header}
      >
        <AppText style={styles.title}>{t('tolerance.title')}</AppText>
        <AppText variant="secondary" tone="muted" style={styles.summary}>
          {summary.text}
        </AppText>
        <View
          style={[
            styles.chevron,
            open ? styles.chevronUp : styles.chevronDown,
            { borderColor: colors.foreground },
          ]}
        />
      </Pressable>
      {open ? (
        <View style={styles.body}>
          <AppText variant="secondary" tone="muted">
            {t('tolerance.explain')}
          </AppText>
          {hero.kind === 'range' ? (
            <View
              accessible
              accessibilityLabel={`${hero.label}, ${hero.fatLabel}`}
              style={styles.range}
            >
              <AppText variant="cardValue">
                {t('tolerance.range', { min: hero.kcal[0], max: hero.kcal[1] })}
              </AppText>
              <AppText variant="secondary" tone="muted">
                {hero.fat}
              </AppText>
            </View>
          ) : null}
          {slider('foodPercent')}
          {slider('burnPercent')}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: border.medium,
    borderRadius: 14,
  },
  header: {
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // The title keeps its words; a long summary wraps instead.
  title: {
    flexGrow: 1,
    flexShrink: 0,
    maxWidth: '60%',
  },
  summary: {
    flexShrink: 1,
    textAlign: 'right',
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
  range: {
    gap: 2,
  },
  body: {
    paddingTop: 2,
    paddingHorizontal: 14,
    paddingBottom: space.l,
    gap: 18,
  },
});
