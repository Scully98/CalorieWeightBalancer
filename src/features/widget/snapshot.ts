import type { TFunction } from 'i18next';

import { emptyKind } from '../balance/empty';
import { heroModel } from '../balance/hero';
import { shortDate } from '../balance/period-subtitle';
import { formatTime } from '../balance/today';
import type { BalanceState } from '../balance/use-balance';
import { addDays, startOfDay } from '@/core/dates';
import { fromDateKey, toDateKey } from '@/core/day-record';
import { formatSigned } from '@/core/format';
import type { Settings } from '@/core/settings';

// Bumped on every incompatible change; the widget shows its placeholder for
// any other version.
export const SNAPSHOT_VERSION = 1 as const;

// What the widget shows, as finished texts: it formats and computes nothing.
// No raw numbers and no day values, so as little derived Health data as
// possible lands on disk.
export type WidgetSnapshot = {
  version: typeof SNAPSHOT_VERSION;
  // When Health was asked, ISO 8601.
  loadedAt: string;
  // Next local midnight after the load for a period that moves along (ends
  // yesterday or later), else null. From then on the widget shows `stale`.
  staleAfter: string | null;
  // „30 Tage“: the counted calendar days.
  title: string;
  // „24. Sep – 23. Okt“.
  dates: string;
  // „Stand 24. Okt, 08:14“.
  stale: string;
  staleLabel: string;
  content: WidgetBalance | WidgetEmpty;
};

export type WidgetBalance = {
  kind: 'balance';
  // „+7.000“: the single value, also with a tolerance.
  kcal: string;
  unit: string;
  // „+2.650 bis +19.350“ with a tolerance, small widget only.
  range: string | null;
  // „ca. +0,9 kg Körperfett“, a range with a tolerance.
  fat: string;
  // „ca. +0,9 kg Fett“ for the lock screen, always the single value.
  lockFat: string;
  // „+7.000 kcal · 30 T“ above the clock.
  inline: string;
  // VoiceOver, small widget and lock screen.
  label: string;
  lockLabel: string;
};

export type WidgetEmpty = {
  kind: 'empty';
  // Same sentence as the empty balance page.
  message: string;
  inline: string;
  label: string;
};

const OFF: Settings['tolerance'] = { foodPercent: 0, burnPercent: 0 };

// „24. September“ for VoiceOver.
function spokenDate(key: string, t: TFunction): string {
  const date = fromDateKey(key) as Date;
  return t('date.dayMonth', {
    day: date.getDate(),
    month: t('date.months').split(' ')[date.getMonth()],
  });
}

// From a finished load of the balance page; loading and error write nothing.
export function widgetSnapshot(
  state: Extract<BalanceState, { status: 'done' | 'empty' }>,
  tolerance: Settings['tolerance'],
  locale: string,
  t: TFunction,
): WidgetSnapshot {
  const report = state.value;
  const { loadedAt } = report;
  const first = report.days[0]?.date;
  const last = report.days.at(-1)?.date;
  const count = report.days.length;

  const crossesYear =
    first !== undefined && first.slice(0, 4) !== last?.slice(0, 4);
  const dates =
    first === undefined || last === undefined
      ? ''
      : first === last
        ? shortDate(first, t, crossesYear)
        : t('home.subtitle.range', {
            from: shortDate(first, t, crossesYear),
            to: shortDate(last, t, crossesYear),
          });
  const spokenDates =
    first === undefined || last === undefined
      ? ''
      : first === last
        ? spokenDate(first, t)
        : t('widget.a11y.dates', {
            from: spokenDate(first, t),
            to: spokenDate(last, t),
          });
  const title = t('home.subtitle.days', { count });
  const heading = [title, spokenDates].filter(Boolean).join(', ');

  // A preset ends yesterday or today; so does a custom period up to now.
  const moves = last !== undefined && last >= toDateKey(addDays(loadedAt, -1));
  const loadedKey = toDateKey(loadedAt);
  const time = formatTime(loadedAt, locale);

  const common: Omit<WidgetSnapshot, 'content'> = {
    version: SNAPSHOT_VERSION,
    loadedAt: loadedAt.toISOString(),
    staleAfter: moves ? addDays(startOfDay(loadedAt), 1).toISOString() : null,
    title,
    dates,
    stale: t('widget.stale', { date: shortDate(loadedKey, t), time }),
    staleLabel: t('widget.a11y.stale', {
      date: spokenDate(loadedKey, t),
      time,
    }),
  };

  if (state.status === 'empty') {
    const message = t(`empty.${emptyKind(report.emptyInfo, loadedAt)}.title`);
    return {
      ...common,
      content: {
        kind: 'empty',
        message,
        inline: t('widget.inlineEmpty'),
        label: [heading, message].join('. '),
      },
    };
  }

  const single = heroModel(report.balance, OFF, locale, t);
  const withRange =
    tolerance.foodPercent > 0 || tolerance.burnPercent > 0
      ? heroModel(report.balance, tolerance, locale, t)
      : undefined;
  const [kcal] = single.kcal;
  const lockFat = t('widget.lockFat', {
    value: formatSigned(report.balance.fatKg, locale, 1),
  });

  return {
    ...common,
    content: {
      kind: 'balance',
      kcal,
      unit: t('widget.unit'),
      range: withRange
        ? t('widget.range', { min: withRange.kcal[0], max: withRange.kcal[1] })
        : null,
      fat: (withRange ?? single).fat,
      lockFat,
      inline: t('widget.inline', { kcal, days: count }),
      label: [
        heading,
        single.label,
        withRange && t('widget.a11y.range', { range: withRange.label }),
        (withRange ?? single).fatLabel,
      ]
        .filter(Boolean)
        .join('. '),
      lockLabel: [title, single.label, single.fatLabel].join('. '),
    },
  };
}
