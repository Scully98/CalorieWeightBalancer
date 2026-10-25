import type { TFunction } from 'i18next';

import { spokenSigned } from './hero';
import type { TodayPlacement } from './use-balance';
import type { DayBalance } from '@/core/day-balance';
import { formatNumber, formatSigned, roundKcal } from '@/core/format';

// „14:32“ / „2:32 PM“: when Health was asked, on both pages.
export function formatTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(date);
}

export type TodayCardModel = {
  asOf: string;
  balance: string;
  // „kcal“, or „kcal · als Erhaltung“ for a zero day.
  balanceUnit: string;
  food: string;
  burn: string;
  burnDetail?: string;
  note: string;
  labels: { header: string; balance: string; food: string; burn: string };
};

const NONE = '–';

// „Heute bisher“: the running day up to the load, as the core counts it, so
// the card, the balance with „Heute einrechnen“ and the chart agree.
export function todayCard(
  { day, placement }: { day: DayBalance; placement: TodayPlacement },
  loadedAt: Date,
  locale: string,
  t: TFunction,
): TodayCardModel {
  const kcal = (value: number) => formatNumber(roundKcal(value), locale);
  const time = formatTime(loadedAt, locale);
  const burnKcal =
    day.resting === undefined ? undefined : day.resting + day.active;
  const detailKey =
    (day.restingFilledHours ?? 0) > 0
      ? 'today.burnDetailPartial'
      : day.restingSource === 'formula'
        ? 'today.burnDetailFormula'
        : 'today.burnDetail';
  const burnDetail =
    day.resting === undefined
      ? undefined
      : t(detailKey, { resting: kcal(day.resting), active: kcal(day.active) });
  const balance =
    day.kcal === undefined ? NONE : formatSigned(roundKcal(day.kcal), locale);
  const unknown = (label: string) => t('a11y.todayUnknown', { label });

  return {
    asOf: t('today.asOf', { time }),
    balance,
    balanceUnit: day.maintenance ? t('today.maintenance') : t('today.unit'),
    food: day.food === undefined ? NONE : kcal(day.food),
    burn: burnKcal === undefined ? NONE : kcal(burnKcal),
    burnDetail,
    note: `${t('today.running')} ${t(`today.${placement}`)}`,
    labels: {
      header: t('a11y.todayHeader', { time }),
      balance:
        day.kcal === undefined
          ? unknown(t('today.balance'))
          : t('a11y.todayBalance', {
              value: spokenSigned(roundKcal(day.kcal), locale, 0, t),
            }),
      food:
        day.food === undefined
          ? unknown(t('today.food'))
          : t('a11y.todayFood', { value: kcal(day.food) }),
      burn:
        burnKcal === undefined || burnDetail === undefined
          ? unknown(t('today.burn'))
          : t('a11y.todayBurn', {
              value: kcal(burnKcal),
              // „Ruhe 1.090 plus Aktiv 290“.
              detail: burnDetail.replace('+', t('a11y.plusWord')),
            }),
    },
  };
}
