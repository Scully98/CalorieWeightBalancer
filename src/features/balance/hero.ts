import type { TFunction } from 'i18next';

import {
  formatNumber,
  formatSigned,
  roundKcal,
  roundRangeKcal,
} from '@/core/format';
import {
  KCAL_PER_KG_FAT,
  toleranceRange,
  type PeriodBalance,
} from '@/core/period-balance';
import type { Settings } from '@/core/settings';

export type BalanceWords = 'more' | 'less' | 'even' | 'either';

// Everything the hero shows, formatted; the labels are what VoiceOver reads.
export type HeroModel = {
  kind: 'single' | 'range';
  // The value, or both ends of the range, with sign.
  kcal: string[];
  words: string;
  avg: string;
  fat: string;
  fatNote: string;
  label: string;
  avgLabel: string;
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
    const words = t(`home.words.${balanceWords(kcal)}`);
    return {
      kind: 'single',
      kcal: [signed(kcal)],
      words,
      avg: t('home.hero.avg', { value: signed(balance.avgKcal) }),
      fat: t('home.hero.fat', { value: signed(balance.fatKg, 1) }),
      fatNote: t('home.hero.fatNote', {
        kcalPerKg: formatNumber(KCAL_PER_KG_FAT, locale),
      }),
      label: t('a11y.heroKcal', { value: spoken(kcal), words }),
      avgLabel: t('a11y.avg', { value: spoken(balance.avgKcal) }),
      fatLabel: t('a11y.fat', { value: spoken(balance.fatKg, 1) }),
    };
  }

  const { range, avgRange, fatRange } = toleranceRange(
    {
      foodKcal: balance.foodKcal,
      burnKcal: balance.restingKcal + balance.activeKcal,
      countedDays: balance.countedDays,
    },
    tolerance,
  );
  const min = roundRangeKcal(range.min);
  const max = roundRangeKcal(range.max);
  const words = t(`home.words.${balanceWords(min, max)}`);
  return {
    kind: 'range',
    kcal: [signed(min), signed(max)],
    words,
    avg: t('home.hero.avgRange', {
      min: signed(avgRange.min),
      max: signed(avgRange.max),
    }),
    fat: t('home.hero.fatRange', {
      min: signed(fatRange.min, 1),
      max: signed(fatRange.max, 1),
    }),
    fatNote: t('home.hero.fatRangeNote'),
    label: t('a11y.heroRange', { min: spoken(min), max: spoken(max), words }),
    avgLabel: t('a11y.avgRange', {
      min: spoken(avgRange.min),
      max: spoken(avgRange.max),
    }),
    fatLabel: t('a11y.fatRange', {
      min: spoken(fatRange.min, 1),
      max: spoken(fatRange.max, 1),
    }),
  };
}
