import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { HeroModel } from '../hero';
import { AppText } from '@/components/app-text';
import { space } from '@/theme/spacing';

type BalanceHeroProps = {
  model: HeroModel;
};

// The balance of the period: one value or the tolerance range, the words
// that say what plus means, then average and fat equivalent.
export function BalanceHero({ model }: BalanceHeroProps) {
  const { t } = useTranslation();
  const [first, last] = model.kcal;

  return (
    <View style={styles.hero}>
      <View accessible accessibilityLabel={model.label} style={styles.top}>
        {model.kind === 'single' ? (
          <View style={styles.numberRow}>
            <AppText variant="hero">{first}</AppText>
            <AppText variant="heroUnit">{t('home.hero.kcal')}</AppText>
          </View>
        ) : (
          <View style={[styles.numberRow, styles.rangeRow]}>
            <AppText variant="heroRange">{first}</AppText>
            <AppText variant="heroRangeUnit" style={styles.to}>
              {t('home.hero.to')}
            </AppText>
            <AppText variant="heroRange">{last}</AppText>
            <AppText variant="heroRangeUnit">{t('home.hero.kcal')}</AppText>
          </View>
        )}
        <AppText variant="heroWords">{model.words}</AppText>
      </View>
      <View style={styles.details}>
        <AppText
          variant="secondary"
          tone="muted"
          accessibilityLabel={model.avgLabel}
        >
          {model.avg}
        </AppText>
        <AppText accessibilityLabel={model.fatLabel}>
          {model.fat}{' '}
          <AppText variant="footnote" tone="muted">
            {model.fatNote}
          </AppText>
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: space.xs,
  },
  top: {
    gap: space.xs,
  },
  numberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: space.s,
  },
  rangeRow: {
    columnGap: 10,
  },
  to: {
    fontWeight: '500',
  },
  details: {
    gap: 3,
    marginTop: space.s,
  },
});
