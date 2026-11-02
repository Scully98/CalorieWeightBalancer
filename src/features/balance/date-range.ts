import type { TFunction } from 'i18next';

import { numericDate } from './period-subtitle';
import { addDays, daysBetween, startOfDay } from '@/core/dates';
import { fromDateKey, toDateKey } from '@/core/day-record';

// Date keys (YYYY-MM-DD) compare like dates, so plain < and > work on them.
export type DateRangeSelection = {
  from: string;
  to: string;
  // The field the next tapped day goes into.
  editing: 'from' | 'to';
};

export type PickerBounds = { min: string; max: string };

// How far back the picker goes when Health has no first data point.
export const FALLBACK_LOOKBACK_DAYS = 365;

// From the first data point to yesterday, or to today when today counts.
export function pickerBounds(
  firstDataDate: Date | undefined,
  now: Date,
  includeToday: boolean,
): PickerBounds {
  const max = addDays(startOfDay(now), includeToday ? 0 : -1);
  const first = firstDataDate
    ? startOfDay(firstDataDate)
    : addDays(max, -FALLBACK_LOOKBACK_DAYS);
  return { min: toDateKey(first < max ? first : max), max: toDateKey(max) };
}

const clampKey = (key: string, { min, max }: PickerBounds) =>
  key < min ? min : key > max ? max : key;

// Keeps a selection inside the bounds, e.g. the shown period when the first
// data point is later than its start.
export function clampSelection(
  selection: DateRangeSelection,
  bounds: PickerBounds,
): DateRangeSelection {
  const from = clampKey(selection.from, bounds);
  const to = clampKey(selection.to, bounds);
  return { ...selection, from, to: to < from ? from : to };
}

// With „Von“ active a day becomes the start (the end moves along if needed)
// and „Bis“ is next. With „Bis“ active a day before the start becomes the
// new start, any other day the end.
export function pickDay(
  selection: DateRangeSelection,
  key: string,
  bounds: PickerBounds,
): DateRangeSelection {
  if (key < bounds.min || key > bounds.max) return selection;
  if (selection.editing === 'from')
    return {
      from: key,
      to: key > selection.to ? key : selection.to,
      editing: 'to',
    };
  return key < selection.from
    ? { ...selection, from: key }
    : { ...selection, to: key };
}

export type CalendarCell = {
  key: string;
  day: number;
  selectable: boolean;
  isStart: boolean;
  isEnd: boolean;
  // Strictly between start and end, drawn as a band.
  inRange: boolean;
  isToday: boolean;
};

export type CalendarMonth = {
  // Empty cells before the 1st; weeks start on Monday.
  blanks: number;
  cells: CalendarCell[];
  canGoBack: boolean;
  canGoForward: boolean;
};

// `month` is 0–11 like Date.
export function calendarMonth(
  year: number,
  month: number,
  bounds: PickerBounds,
  selection: DateRangeSelection,
  now: Date,
): CalendarMonth {
  const first = new Date(year, month, 1);
  const length = new Date(year, month + 1, 0).getDate();
  const today = toDateKey(now);
  const cells = Array.from({ length }, (_, index): CalendarCell => {
    const key = toDateKey(new Date(year, month, index + 1));
    return {
      key,
      day: index + 1,
      selectable: key >= bounds.min && key <= bounds.max,
      isStart: key === selection.from,
      isEnd: key === selection.to,
      inRange: key > selection.from && key < selection.to,
      isToday: key === today,
    };
  });
  return {
    blanks: (first.getDay() + 6) % 7,
    cells,
    canGoBack: cells[0].key > bounds.min,
    canGoForward: cells[length - 1].key < bounds.max,
  };
}

export function selectionDays({ from, to }: DateRangeSelection): number {
  return daysBetween(fromDateKey(from) as Date, fromDateKey(to) as Date) + 1;
}

// „15 Tage · bis gestern“ and „Daten ab 26.06.2026 · heute zählt nicht“.
export function selectionSummary(
  selection: DateRangeSelection,
  bounds: PickerBounds,
  includeToday: boolean,
  now: Date,
  locale: string,
  t: TFunction,
): { days: string; caption: string } {
  const parts = [t('picker.days', { count: selectionDays(selection) })];
  if (selection.to === toDateKey(now)) parts.push(t('picker.untilToday'));
  else if (selection.to === toDateKey(addDays(now, -1)))
    parts.push(t('picker.untilYesterday'));
  return {
    days: parts.join(' · '),
    caption: [
      t('picker.dataFrom', { date: numericDate(bounds.min, locale) }),
      t(includeToday ? 'picker.todayIncluded' : 'picker.todayExcluded'),
    ].join(' · '),
  };
}

// „Oktober 2026“.
export function monthTitle(year: number, month: number, t: TFunction) {
  return t('date.monthYear', {
    month: t('date.months').split(' ')[month],
    year,
  });
}

// „Donnerstag, 1. Oktober 2026“ for VoiceOver.
export function spokenDate(key: string, t: TFunction): string {
  const date = fromDateKey(key) as Date;
  return t('date.dayFull', {
    weekday: t('date.weekdays').split(' ')[(date.getDay() + 6) % 7],
    day: date.getDate(),
    month: t('date.months').split(' ')[date.getMonth()],
    year: date.getFullYear(),
  });
}
