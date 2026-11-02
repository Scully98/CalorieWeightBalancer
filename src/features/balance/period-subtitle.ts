import type { TFunction } from 'i18next';

import { addDays } from '@/core/dates';
import { fromDateKey, toDateKey } from '@/core/day-record';
import { resolvePeriod, type Period } from '@/core/period';

// First and last local day of a period, as date keys.
export type PeriodSpan = { first: string; last: string; days: number };

// The span the page is about, known before the load.
export function periodSpan(
  period: Period,
  includeToday: boolean,
  now: Date,
): PeriodSpan | undefined {
  const { start, days } = resolvePeriod(period, now, { includeToday });
  if (days === 0) return undefined;
  return {
    first: toDateKey(start),
    last: toDateKey(addDays(start, days - 1)),
    days,
  };
}

// „24. Sep“ / „Sep 24“, with the year when asked.
export function shortDate(key: string, t: TFunction, withYear = false) {
  const date = fromDateKey(key) as Date;
  const month = t('date.monthsShort').split(' ')[date.getMonth()];
  const values = { day: date.getDate(), month, year: date.getFullYear() };
  return withYear ? t('date.dayMonthYear', values) : t('date.dayMonth', values);
}

// „26.06.2026“ / „06/26/2026“.
export function numericDate(key: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fromDateKey(key));
}

// „24. Sep – 23. Okt · 30 Tage · ohne heute“.
export function periodSubtitle(
  span: PeriodSpan,
  includeToday: boolean,
  now: Date,
  t: TFunction,
): string {
  const crossesYear = span.first.slice(0, 4) !== span.last.slice(0, 4);
  const dates =
    span.first === span.last
      ? shortDate(span.first, t, crossesYear)
      : t('home.subtitle.range', {
          from: shortDate(span.first, t, crossesYear),
          to: shortDate(span.last, t, crossesYear),
        });
  const parts = [dates, t('home.subtitle.days', { count: span.days })];

  const today = toDateKey(now);
  if (includeToday && span.last === today)
    parts.push(t('home.subtitle.withToday'));
  if (!includeToday && span.last === toDateKey(addDays(now, -1)))
    parts.push(t('home.subtitle.withoutToday'));
  return parts.join(' · ');
}
