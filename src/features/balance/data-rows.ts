import type { TFunction } from 'i18next';

import type { FallbackInputs } from './resting-fallback';
import {
  BALANCE_DAYS,
  ENERGY_KEYS,
  type BalanceReport,
  type EnergyKey,
  type RestingFallback,
} from './use-balance';
import type { Status } from '@/components/status-row';
import type { PeriodBreakdown } from '@/core/balance';
import { formatNumber, formatSigned, roundKcal } from '@/core/format';
import { sourceLabel } from '@/features/intro/found-rows';

export type CalcLine = {
  key: EnergyKey | 'total';
  label: string;
  value: string;
  detail?: string;
};

export type DataRow = {
  key: EnergyKey;
  status: Status;
  label: string;
  detail: string;
  accessibilityLabel: string;
};

export type EstimateLine = {
  key: keyof FallbackInputs;
  label: string;
  detail: string;
};

// Food − resting − active = balance, with the same rounding as the balance
// page, so the total matches the big number there.
export function buildCalcLines(
  balance: PeriodBreakdown,
  fallback: RestingFallback | undefined,
  t: TFunction,
  locale: string,
): CalcLine[] {
  const kcal = (value: number) =>
    t('home.kcal', { value: formatNumber(roundKcal(value), locale) });
  const avg = (value: number) =>
    formatNumber(roundKcal(value / balance.countedDays), locale);

  const resting = [t('data.avg', { value: avg(balance.restingKcal) })];
  if (balance.restingFallbackDays > 0) {
    resting.push(
      t(
        fallback?.kind === 'typical'
          ? 'data.restingTypical'
          : 'data.restingEstimate',
        { count: balance.restingFallbackDays },
      ),
    );
  }
  if (balance.restingScaledDays > 0) {
    resting.push(t('data.restingScaled', { count: balance.restingScaledDays }));
  }

  // Switched-off active energy looks like 0 kcal, so it is named explicitly.
  const active =
    balance.daysWithoutActive === balance.countedDays
      ? [t('data.activeMissing')]
      : [t('data.avg', { value: avg(balance.activeKcal) })];
  if (
    balance.daysWithoutActive > 0 &&
    balance.daysWithoutActive < balance.countedDays
  ) {
    active.push(t('data.activeZero', { count: balance.daysWithoutActive }));
  }

  return [
    {
      key: 'food',
      label: t('data.calc.food'),
      value: kcal(balance.foodKcal),
      detail: t('data.avgDays', {
        value: avg(balance.foodKcal),
        count: balance.countedDays,
      }),
    },
    {
      key: 'resting',
      label: t('data.calc.resting'),
      value: kcal(balance.restingKcal),
      detail: resting.join(' · '),
    },
    {
      key: 'active',
      label: t('data.calc.active'),
      value: kcal(balance.activeKcal),
      detail: active.join(' · '),
    },
    {
      key: 'total',
      label: t('data.calc.total'),
      value: t('home.kcal', {
        value: formatSigned(roundKcal(balance.kcal), locale),
      }),
    },
  ];
}

export function buildCalcNotes(
  balance: PeriodBreakdown,
  t: TFunction,
): string[] {
  const notes: string[] = [];
  if (balance.daysWithoutFood > 0) {
    notes.push(t('home.daysWithoutFood', { count: balance.daysWithoutFood }));
  }
  if (balance.daysWithoutResting > 0) {
    notes.push(
      t('home.daysWithoutResting', { count: balance.daysWithoutResting }),
    );
  }
  notes.push(t('data.rounded'));
  return notes;
}

// Which values arrive from Health over the period, and from where.
export function buildDataRows(report: BalanceReport, t: TFunction): DataRow[] {
  return ENERGY_KEYS.map((key) => {
    const count = report.daysWithData[key];
    const found = count > 0;
    const label = t(`data.rows.${key}`);
    const detail = found
      ? [
          sourceLabel(report.sources[key]),
          t('data.daysOf', { count, days: BALANCE_DAYS }),
        ]
          .filter(Boolean)
          .join(' · ')
      : t(
          key === 'resting' && report.fallback?.kind === 'estimate'
            ? 'data.missingEstimate'
            : 'data.missing',
        );
    const status = found ? 'found' : 'missing';
    return {
      key,
      status,
      label,
      detail,
      accessibilityLabel: [
        label,
        t(`intro.found.status.${status}`),
        detail,
      ].join(', '),
    };
  });
}

// The inputs behind the resting energy estimate and where each comes from.
export function buildEstimateLines(
  inputs: FallbackInputs,
  t: TFunction,
  locale: string,
): EstimateLine[] {
  const sexLabels = {
    male: t('intro.found.bmr.sexMaleLong'),
    female: t('intro.found.bmr.sexFemaleLong'),
    other: t('intro.found.bmr.sexOther'),
    unspecified: t('intro.found.bmr.sexUnspecified'),
  };
  const sourced = (value: string, fromHealth: boolean) =>
    fromHealth
      ? t('intro.found.bmr.fromHealth', { value })
      : t('data.fromInput', { value });

  return [
    {
      key: 'weightKg',
      label: t('intro.found.bmr.weight'),
      detail: sourced(
        `${formatNumber(inputs.weightKg.value, locale, 1)} kg`,
        inputs.weightKg.fromHealth,
      ),
    },
    {
      key: 'heightCm',
      label: t('intro.found.bmr.height'),
      detail: sourced(
        `${formatNumber(inputs.heightCm.value, locale)} cm`,
        inputs.heightCm.fromHealth,
      ),
    },
    {
      key: 'ageYears',
      label: t('intro.found.bmr.age'),
      detail: sourced(
        `${formatNumber(inputs.ageYears.value, locale)} ${t('intro.found.bmr.years')}`,
        inputs.ageYears.fromHealth,
      ),
    },
    {
      key: 'sex',
      label: t('intro.found.bmr.sex'),
      detail: sourced(sexLabels[inputs.sex.shown], inputs.sex.fromHealth),
    },
  ];
}
