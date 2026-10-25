import { StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { AppText } from '@/components/app-text';
import {
  QualityCross,
  QualityPatternDefs,
  QualitySwatch,
  qualityFill,
  usePatternPrefix,
} from '@/components/quality-pattern';
import type { DayFlag } from '@/core/day-balance';
import { typography, type TextVariant } from '@/theme/typography';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Every flag once, for the pattern sample.
const QUALITY_FLAGS: readonly DayFlag[] = [
  'restingEstimated',
  'lowFood',
  'noFood',
];

// The patterns as legend swatches and as chart bars, the way P8 fills them:
// a full bar, an estimated one, one with little food and a cross on the zero
// line for a day without food.
function QualitySample() {
  const colors = useColors();
  const prefix = usePatternPrefix();
  const bars: { flag?: DayFlag; height: number }[] = [
    { height: 40 },
    { flag: 'restingEstimated', height: 30 },
    { flag: 'lowFood', height: -24 },
  ];
  const zero = 44;

  return (
    <View style={styles.row}>
      <AppText variant="caption" tone="muted">
        quality patterns
      </AppText>
      <View style={styles.swatches}>
        {[10, 11, 13].map((size) =>
          QUALITY_FLAGS.map((flag) => (
            <QualitySwatch key={`${size}-${flag}`} flag={flag} size={size} />
          )),
        )}
      </View>
      <Svg width={160} height={88}>
        <QualityPatternDefs idPrefix={prefix} />
        {bars.map((bar, index) => (
          <Rect
            key={index}
            x={12 + index * 34}
            y={bar.height > 0 ? zero - bar.height : zero}
            width={22}
            height={Math.abs(bar.height)}
            fill={bar.flag ? qualityFill(bar.flag, prefix) : colors.foreground}
            stroke={bar.flag ? colors.foreground : undefined}
            strokeWidth={1}
          />
        ))}
        <QualityCross size={7} x={12 + 3 * 34 + 11} y={zero} />
        <Line
          x1={0}
          x2={160}
          y1={zero}
          y2={zero}
          stroke={colors.foreground}
          strokeWidth={1.25}
        />
      </Svg>
    </View>
  );
}

// Development only: every text style with realistic content, to check Dynamic
// Type at the largest sizes. Texts must wrap, never truncate.
const SAMPLES: Record<TextVariant, string> = {
  largeTitle: 'Bilanz',
  screenTitle: 'Passt die Bilanz zur Waage?',
  sectionTitle: 'Unvollständige Tage',
  body: '24 von 30 Tagen vollständig',
  bodyStrong: 'Messfehler einrechnen',
  secondary: 'Ø +233 kcal pro Tag',
  detail: 'Gegessen 1.060 von 2.650 verbraucht (40 %) · Bilanz −1.590',
  footnote: '≈ +0,9 kg Körperfett (theoretisch, 7.700 kcal/kg)',
  caption: '25. Sep – 24. Okt · 30 Tage · ohne heute',
  overline: 'Verbraucht',
  caption2: 'KW 43 · −1.000 · +0,5',
  segment: '30 T',
  number: '1.420 kcal',
  numberMedium: '1.380',
  emptyTitle: 'Noch keine Daten.',
  numberLarge: '+380 bis +2.150',
  hero: '+7.000',
  heroRange: '+19.350',
  heroUnit: 'kcal',
  heroRangeUnit: 'bis',
  heroWords: 'mehr gegessen als verbraucht',
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
      <QualitySample />
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
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.s,
  },
});
