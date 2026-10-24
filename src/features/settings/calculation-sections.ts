import type { TFunction } from 'i18next';

import {
  KCAL_PER_KG_FAT_TISSUE,
  KCAL_PER_KG_LEAN,
  MIN_ANALYSIS_DAYS,
  MIN_MEASUREMENTS,
} from '@/core/analysis';
import { TREND_DAYS } from '@/core/body';
import { LOW_FOOD_SHARE } from '@/core/day-balance';
import { formatNumber } from '@/core/format';
import { KCAL_PER_KG_FAT } from '@/core/period-balance';
import { TOLERANCE_LIMITS } from '@/core/settings';

export type CalculationSection = { key: string; title: string; body: string };

// Texts of „Wie wird gerechnet?“; the numbers come from the core, so the
// page can't drift from the calculation.
export function calculationSections(
  t: TFunction,
  locale: string,
): CalculationSection[] {
  const number = (value: number) => formatNumber(value, locale);
  return [
    {
      key: 'balance',
      title: t('calculation.balance.title'),
      body: t('calculation.balance.body'),
    },
    {
      key: 'zeroDays',
      title: t('calculation.zeroDays.title'),
      body: t('calculation.zeroDays.body', {
        lowFood: number(LOW_FOOD_SHARE * 100),
      }),
    },
    {
      key: 'today',
      title: t('calculation.today.title'),
      body: t('calculation.today.body'),
    },
    {
      key: 'tolerance',
      title: t('calculation.tolerance.title'),
      body: t('calculation.tolerance.body', {
        food: number(TOLERANCE_LIMITS.foodPercent),
        burn: number(TOLERANCE_LIMITS.burnPercent),
      }),
    },
    {
      key: 'fat',
      title: t('calculation.fat.title'),
      body: t('calculation.fat.body', { kcalPerKg: number(KCAL_PER_KG_FAT) }),
    },
    {
      key: 'resting',
      title: t('calculation.resting.title'),
      body: t('calculation.resting.body'),
    },
    {
      key: 'analysis',
      title: t('calculation.analysis.title'),
      body: t('calculation.analysis.body', {
        fat: number(KCAL_PER_KG_FAT_TISSUE),
        lean: number(KCAL_PER_KG_LEAN),
        days: number(MIN_ANALYSIS_DAYS),
        measurements: number(MIN_MEASUREMENTS),
        trend: number(TREND_DAYS),
      }),
    },
    {
      key: 'medical',
      title: t('calculation.medical.title'),
      body: t('calculation.medical.body'),
    },
  ];
}
