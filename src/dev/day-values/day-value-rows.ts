import { fromDateKey, type DayRecord } from '@/core/day-record';
import { formatNumber } from '@/core/format';

export type DayValueRow = { date: string; title: string; lines: string[] };

const MISSING = '–';

// One day as Health delivered it, unrounded beyond what the Health app shows:
// whole kcal, kg with two decimals, body fat in percent with one.
export function dayValueRow(
  record: DayRecord,
  locale: string,
  isToday = false,
): DayValueRow {
  const value = (number: number | undefined, digits: number, unit: string) =>
    number === undefined
      ? MISSING
      : `${formatNumber(number, locale, digits)} ${unit}`;

  const coverage = record.restingCoverage;
  const resting =
    value(record.resting, 0, 'kcal') +
    (record.resting !== undefined && coverage !== undefined && coverage < 1
      ? ` (Abdeckung ${formatNumber(coverage * 100, locale)} %)`
      : '');
  const bodyFat =
    record.bodyFatFraction === undefined
      ? undefined
      : record.bodyFatFraction * 100;

  const date = fromDateKey(record.date) as Date;
  const title =
    date.toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    }) + (isToday ? ' (heute)' : '');

  return {
    date: record.date,
    title,
    lines: [
      `Nahrung ${value(record.food, 0, 'kcal')} · Ruhe ${resting}`,
      `Aktiv ${value(record.active, 0, 'kcal')}`,
      `Gewicht ${value(record.weightKg, 2, 'kg')} · KFA ${value(bodyFat, 1, '%')}`,
      `Mager ${value(record.leanMassKg, 2, 'kg')}`,
    ],
  };
}
