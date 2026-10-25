import type { TFunction } from 'i18next';

import { shortDate } from './period-subtitle';
import {
  DAY_FLAGS,
  LOW_FOOD_SHARE,
  type DayBalance,
  type DayFlag,
} from '@/core/day-balance';
import { fromDateKey } from '@/core/day-record';
import { formatNumber, formatSigned, roundKcal } from '@/core/format';
import type { PeriodBalance } from '@/core/period-balance';
import type { Settings } from '@/core/settings';

export type QualityEntry = { flag: DayFlag; text: string };

// „24 von 30 Tagen vollständig“ with one entry per flag that occurs. Without
// incomplete days the row has nothing to open.
export type QualityRowModel = {
  title: string;
  entries: QualityEntry[];
  tappable: boolean;
  // VoiceOver value: the entries as one sentence.
  spokenEntries: string;
};

export function qualityRow(
  balance: PeriodBalance,
  t: TFunction,
): QualityRowModel {
  const entries = DAY_FLAGS.filter((flag) => balance.flagCounts[flag] > 0).map(
    (flag) => ({
      flag,
      text: t(`quality.${flag}`, { count: balance.flagCounts[flag] }),
    }),
  );
  return {
    title: t('quality.complete', {
      complete: balance.completeDays,
      count: balance.days,
    }),
    entries,
    tappable: balance.completeDays < balance.days,
    spokenEntries: entries.map((entry) => entry.text).join(', '),
  };
}

// „Mo, 12. Okt“ / „Mon, Oct 12“.
export function dayLabel(key: string, t: TFunction): string {
  const date = fromDateKey(key) as Date;
  // Monday first, like the weekday strings.
  const weekday = t('date.weekdaysAbbr').split(' ')[(date.getDay() + 6) % 7];
  const month = t('date.monthsShort').split(' ')[date.getMonth()];
  return t('date.weekdayDayMonth', { weekday, day: date.getDate(), month });
}

export type IncompleteRow = { date: string; label: string; detail: string };

export type IncompleteGroup = {
  flag: DayFlag;
  title: string;
  count: number;
  description: string;
  rows: IncompleteRow[];
  spokenTitle: string;
};

export type IncompleteDays = { subtitle: string; groups: IncompleteGroup[] };

function restingMark(day: DayBalance, t: TFunction): string {
  if (day.restingSource === 'source') return t('incomplete.mark.source');
  if (day.restingSource === 'partial') return t('incomplete.mark.partial');
  return t('incomplete.mark.formula');
}

// The sheet „Unvollständige Tage“: one group per flag in the app's order,
// only groups with days. A day with two flags is in both, like the counts.
// Texts follow what the balance really counts, e.g. the zero day switch.
export function incompleteDays(
  days: readonly DayBalance[],
  { zeroDaysAsMaintenance }: Pick<Settings, 'zeroDaysAsMaintenance'>,
  locale: string,
  t: TFunction,
): IncompleteDays {
  const kcal = (value: number) => formatNumber(roundKcal(value), locale);
  const signed = (value: number) => formatSigned(roundKcal(value), locale);
  const burn = (day: DayBalance) => (day.resting ?? 0) + day.active;
  const food = (day: DayBalance) =>
    day.food === undefined ? '–' : kcal(day.food);

  const detail: Record<DayFlag, (day: DayBalance) => string> = {
    restingEstimated: (day) =>
      t('incomplete.row.estimated', {
        resting: kcal(day.resting ?? 0),
        mark: restingMark(day, t),
        active: kcal(day.active),
        balance: day.kcal === undefined ? '–' : signed(day.kcal),
      }),
    noFood: (day) =>
      day.maintenance
        ? t('incomplete.row.noFoodMaintenance', { burn: kcal(burn(day)) })
        : t('incomplete.row.noFoodDeficit', {
            burn: kcal(burn(day)),
            balance: signed(-burn(day)),
          }),
    lowFood: (day) =>
      t('incomplete.row.lowFood', {
        food: food(day),
        burn: kcal(burn(day)),
        percent: Math.round(((day.food ?? 0) / burn(day)) * 100),
        balance: signed(day.kcal ?? 0),
      }),
    noResting: (day) =>
      t('incomplete.row.noResting', {
        food: food(day),
        active: kcal(day.active),
      }),
  };
  const description: Record<DayFlag, string> = {
    restingEstimated: t('incomplete.restingEstimated.body'),
    noFood: zeroDaysAsMaintenance
      ? t('incomplete.noFood.bodyMaintenance')
      : t('incomplete.noFood.bodyDeficit'),
    lowFood: t('incomplete.lowFood.body', {
      percent: Math.round(LOW_FOOD_SHARE * 100),
    }),
    noResting: t('incomplete.noResting.body'),
  };

  const groups = DAY_FLAGS.map((flag) => {
    const flagged = days.filter((day) => day.flags.includes(flag));
    const title = t(`incomplete.${flag}.title`);
    return {
      flag,
      title,
      count: flagged.length,
      description: description[flag],
      rows: flagged.map((day) => ({
        date: day.date,
        label: dayLabel(day.date, t),
        detail: detail[flag](day),
      })),
      spokenTitle: t('incomplete.groupSpoken', {
        title,
        count: flagged.length,
      }),
    };
  }).filter((group) => group.count > 0);

  const first = days[0]?.date;
  const last = days.at(-1)?.date;
  const crossesYear = first?.slice(0, 4) !== last?.slice(0, 4);
  return {
    subtitle:
      first && last
        ? t('incomplete.subtitle', {
            incomplete: days.filter((day) => day.flags.length > 0).length,
            count: days.length,
            from: shortDate(first, t, crossesYear),
            to: shortDate(last, t, crossesYear),
          })
        : '',
    groups,
  };
}
