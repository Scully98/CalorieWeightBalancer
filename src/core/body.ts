import type { DayRecord } from './day-record';

// Days in the trend window: the day itself and the six before it.
export const TREND_DAYS = 7;

// Without a measurement the window grows by a week at a time, up to this many
// days back (6, 13, 20, 27, 34).
export const TREND_MAX_LOOKBACK_DAYS = 34;

export type BodyValues = { weightKg?: number; fatKg?: number; leanKg?: number };

export type BodyKey = keyof BodyValues;

// Weight, fat and lean mass of a day. Only values of the same day are
// combined; without lean mass it follows from weight and body fat.
export function bodyValues(record: DayRecord): BodyValues {
  const { weightKg, bodyFatFraction, leanMassKg } = record;
  if (weightKg === undefined) return {};
  if (bodyFatFraction !== undefined)
    return {
      weightKg,
      fatKg: weightKg * bodyFatFraction,
      leanKg: leanMassKg ?? weightKg * (1 - bodyFatFraction),
    };
  if (leanMassKg !== undefined)
    return { weightKg, fatKg: weightKg - leanMassKg, leanKg: leanMassKg };
  return { weightKg };
}

// 7-day trend per record: the mean of all values in the day and the six
// before it, widened by a week while there is none. Records run oldest first,
// one per day, so index distance is day distance. Days without a measurement
// get the trend of their window, which keeps the line without gaps.
export function trendSeries(
  records: readonly DayRecord[],
  key: BodyKey,
): (number | undefined)[] {
  const values = records.map((record) => bodyValues(record)[key]);
  return values.map((_, index) => {
    for (
      let span = TREND_DAYS - 1;
      span <= TREND_MAX_LOOKBACK_DAYS;
      span += TREND_DAYS
    ) {
      const window = values
        .slice(Math.max(0, index - span), index + 1)
        .filter((value): value is number => value !== undefined);
      if (window.length > 0)
        return window.reduce((sum, value) => sum + value, 0) / window.length;
    }
    return undefined;
  });
}
