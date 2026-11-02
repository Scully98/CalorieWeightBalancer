import { queryStatisticsCollectionForQuantity } from '@kingstinct/react-native-healthkit';

import { QUANTITY } from './read-types';
import { safe } from './safe';
import { addDays } from '@/core/dates';
import { toDateKey, type DayRecord } from '@/core/day-record';

export type DayBody = Pick<
  DayRecord,
  'date' | 'weightKg' | 'bodyFatFraction' | 'leanMassKg'
>;

const BODY = {
  weightKg: { type: QUANTITY.weight, unit: 'kg' },
  // HealthKit's percent unit gives the fraction 0–1.
  bodyFatFraction: { type: QUANTITY.bodyFat, unit: '%' },
  leanMassKg: { type: QUANTITY.leanMass, unit: 'kg' },
} as const;

type BodyKey = keyof typeof BODY;

// Last value per local calendar day; the statistics query deduplicates
// several sources like the energy sums do.
async function lastPerDay(
  key: BodyKey,
  start: Date,
  end: Date,
): Promise<Map<string, number>> {
  const { type, unit } = BODY[key];
  const buckets = await safe(
    () =>
      queryStatisticsCollectionForQuantity(
        type,
        ['mostRecent'],
        start,
        { day: 1 },
        { unit, filter: { date: { startDate: start, endDate: end } } },
      ),
    [],
  );
  const values = new Map<string, number>();
  for (const bucket of buckets) {
    const value = bucket.mostRecentQuantity?.quantity;
    if (bucket.startDate && value !== undefined)
      values.set(toDateKey(bucket.startDate), value);
  }
  return values;
}

// Weight, body fat and lean mass per calendar day from the local midnight
// `start`, one record per day.
export async function queryDailyBody(
  start: Date,
  days: number,
): Promise<DayBody[]> {
  const end = addDays(start, days);
  const [weightKg, bodyFatFraction, leanMassKg] = await Promise.all([
    lastPerDay('weightKg', start, end),
    lastPerDay('bodyFatFraction', start, end),
    lastPerDay('leanMassKg', start, end),
  ]);
  return Array.from({ length: days }, (_, index) => {
    const date = toDateKey(addDays(start, index));
    return {
      date,
      weightKg: weightKg.get(date),
      bodyFatFraction: bodyFatFraction.get(date),
      leanMassKg: leanMassKg.get(date),
    };
  });
}
