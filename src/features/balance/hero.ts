import type { TFunction } from 'i18next';

import {
  formatNumber,
  formatSigned,
  roundKcal,
  roundRangeKcal,
} from '@/core/format';
import { toleranceRange, type PeriodBalance } from '@/core/period-balance';
import type { Settings } from '@/core/settings';

export type BalanceWords = 'more' | 'less' | 'even' | 'either';

// Everything the hero shows, formatted; the labels are what VoiceOver reads.
export type HeroModel = {
  kind: 'single' | 'range';
  // The value, or both ends of the range, with sign.
  kcal: string[];
  // Below the number, with the unit.
  words: string;
  fat: string;
  label: string;
  fatLabel: string;
};

// From the rounded numbers on screen, so „±0“ never says „ate more“. A range
// only says more or less when both ends agree.
export function balanceWords(min: number, max = min): BalanceWords {
  if (min === max) return min > 0 ? 'more' : min < 0 ? 'less' : 'even';
  if (min >= 0) return 'more';
  if (max < 0) return 'less';
  return 'either';
}

// „plus 7.000“, „minus 1.250“, „plus minus 0“: VoiceOver does not read the
// signs reliably.
export function spokenSigned(
  value: number,
  locale: string,
  fractionDigits: number,
  t: TFunction,
): string {
  const magnitude = formatNumber(Math.abs(value), locale, fractionDigits);
  if (Number(Math.abs(value).toFixed(fractionDigits)) === 0)
    return t('a11y.zero', { value: magnitude });
  return t(value < 0 ? 'a11y.minus' : 'a11y.plus', { value: magnitude });
}

// The tolerance may be a slider draft: the range comes from the period sums
// alone, so dragging never touches the days.
export function heroModel(
  balance: PeriodBalance,
  tolerance: Settings['tolerance'],
  locale: string,
  t: TFunction,
): HeroModel {
  const signed = (value: number, digits = 0) =>
    formatSigned(value, locale, digits);
  const spoken = (value: number, digits = 0) =>
    spokenSigned(value, locale, digits, t);

  if (tolerance.foodPercent === 0 && tolerance.burnPercent === 0) {
    const kcal = roundKcal(balance.kcal);
    const words = balanceWords(kcal);
    return {
      kind: 'single',
      kcal: [signed(kcal)],
      words: t(`home.heroWords.${words}`),
      fat: t('home.hero.fat', { value: signed(balance.fatKg, 1) }),
      label: t('a11y.heroKcal', {
        value: spoken(kcal),
        words: t(`home.words.${words}`),
      }),
      fatLabel: t('a11y.fat', { value: spoken(balance.fatKg, 1) }),
    };
  }

  const { range, fatRange } = toleranceRange(
    {
      foodKcal: balance.foodKcal,
      burnKcal: balance.restingKcal + balance.activeKcal,
      countedDays: balance.countedDays,
    },
    tolerance,
  );
  const min = roundRangeKcal(range.min);
  const max = roundRangeKcal(range.max);
  const words = balanceWords(min, max);
  return {
    kind: 'range',
    kcal: [signed(min), signed(max)],
    words: t(`home.heroWords.${words}`),
    fat: t('home.hero.fatRange', {
      min: signed(fatRange.min, 1),
      max: signed(fatRange.max, 1),
    }),
    label: t('a11y.heroRange', {
      min: spoken(min),
      max: spoken(max),
      words: t(`home.words.${words}`),
    }),
    fatLabel: t('a11y.fatRange', {
      min: spoken(fatRange.min, 1),
      max: spoken(fatRange.max, 1),
    }),
  };
}

// Header of the tolerance card: „aus“, or the sides that are on, with the
// spoken text for VoiceOver.
export function toleranceSummary(
  { foodPercent: food, burnPercent: burn }: Settings['tolerance'],
  t: TFunction,
): { text: string; spoken: string } {
  if (food > 0 && burn > 0)
    return {
      text: t('tolerance.summary', { food, burn }),
      spoken: t('tolerance.summarySpoken', { food, burn }),
    };
  if (food > 0)
    return {
      text: t('tolerance.summaryFood', { food }),
      spoken: t('tolerance.summaryFoodSpoken', { food }),
    };
  if (burn > 0)
    return {
      text: t('tolerance.summaryBurn', { burn }),
      spoken: t('tolerance.summaryBurnSpoken', { burn }),
    };
  return { text: t('tolerance.off'), spoken: t('tolerance.off') };
}
