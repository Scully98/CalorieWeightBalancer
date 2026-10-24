import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { typography, type TextVariant } from '@/theme/typography';
import { space } from '@/theme/spacing';

// Development only: every text style with realistic content, to check Dynamic
// Type at the largest sizes. Texts must wrap, never truncate.
const SAMPLES: Record<TextVariant, string> = {
  largeTitle: 'Bilanz',
  screenTitle: 'Passt die Bilanz zur Waage?',
  sectionTitle: 'Unvollständige Tage',
  body: '24 von 30 Tagen vollständig',
  bodyStrong: 'Messfehler einrechnen',
  secondary: 'Ø +233 kcal pro Tag',
  footnote: '≈ +0,9 kg Körperfett (theoretisch, 7.700 kcal/kg)',
  caption: '25. Sep – 24. Okt · 30 Tage · ohne heute',
  caption2: 'KW 43 · −1.000 · +0,5',
  number: '1.420 kcal',
  numberLarge: '+380 bis +2.150',
  hero: '+7.000',
};

export function TypeSpecimen() {
  const variants = Object.keys(typography) as TextVariant[];

  return (
    <View style={styles.list}>
      <AppText variant="bodyStrong">Type specimen (dev)</AppText>
      {variants.map((variant) => (
        <View key={variant} style={styles.row}>
          <AppText variant="caption" tone="muted">
            {variant}
          </AppText>
          <AppText variant={variant}>{SAMPLES[variant]}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.m,
  },
  row: {
    gap: space.xs,
  },
});
