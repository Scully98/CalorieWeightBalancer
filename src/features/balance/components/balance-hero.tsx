import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { HeroModel } from '../hero';
import { AppText } from '@/components/app-text';
import { space } from '@/theme/spacing';

type BalanceHeroProps = {
  model: HeroModel;
};

// The balance of the period: one value or the tolerance range, the words
// that say what plus means, then the fat equivalent.
export function BalanceHero({ model }: BalanceHeroProps) {
  const { t } = useTranslation();
  const [first, last] = model.kcal;

  return (
    <View style={styles.hero}>
      <View accessible accessibilityLabel={model.label} style={styles.top}>
        {model.kind === 'single' ? (
          <AppText variant="hero" style={styles.center}>
            {first}
          </AppText>
        ) : (
          <View style={styles.rangeRow}>
            <AppText variant="heroRange">{first}</AppText>
            <AppText variant="heroRangeUnit" style={styles.to}>
              {t('home.hero.to')}
            </AppText>
            <AppText variant="heroRange">{last}</AppText>
          </View>
        )}
        <AppText variant="heroWords" style={styles.center}>
          {model.words}
        </AppText>
      </View>
      <AppText
        variant="secondary"
        tone="muted"
        accessibilityLabel={model.fatLabel}
        style={styles.center}
      >
        {model.fat}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: space.s,
    paddingVertical: space.s,
  },
  top: {
    gap: space.xs,
  },
  center: {
    textAlign: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'center',
    columnGap: 10,
  },
  to: {
    fontWeight: '500',
  },
});
