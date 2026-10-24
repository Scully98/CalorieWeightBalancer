import { queryStatisticsCollectionForQuantity } from '@kingstinct/react-native-healthkit';

import { QUANTITY } from './read-types';
import { safe } from './safe';
import { addDays } from '@/core/dates';
import { toDateKey, type DayRecord } from '@/core/day-record';

const ENERGY = {
  food: QUANTITY.food,
  resting: QUANTITY.resting,
  active: QUANTITY.active,
} as const;

type EnergyKey = keyof typeof ENERGY;

const HOUR_MS = 60 * 60 * 1000;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// kcal sums per bucket; statistics queries deduplicate iPhone and Watch.
async function buckets(
  key: EnergyKey,
  start: Date,
  end: Date,
  interval: { day: 1 } | { hour: 1 },
): Promise<{ start: Date; kcal: number }[]> {
  const result = await safe(
    () =>
      queryStatisticsCollectionForQuantity(
        ENERGY[key],
        ['cumulativeSum'],
        start,
        interval,
        { unit: 'kcal', filter: { date: { startDate: start, endDate: end } } },
      ),
    [],
  );
  return result.flatMap((bucket) => {
    const kcal = bucket.sumQuantity?.quantity ?? 0;
    return bucket.startDate && kcal > 0
      ? [{ start: bucket.startDate, kcal }]
      : [];
  });
}

async function dailySums(
  key: EnergyKey,
  start: Date,
  end: Date,
): Promise<Map<string, number>> {
  const sums = new Map<string, number>();
  for (const bucket of await buckets(key, start, end, { day: 1 })) {
    sums.set(dayKey(bucket.start), bucket.kcal);
  }
  return sums;
}

// Hours with resting energy per calendar day. A watch writes resting energy
// only while worn, so missing hours mark a partial day.
async function restingHours(
  start: Date,
  end: Date,
): Promise<Map<string, number>> {
  const hours = new Map<string, number>();
  for (const bucket of await buckets('resting', start, end, { hour: 1 })) {
    const key = dayKey(bucket.start);
    hours.set(key, (hours.get(key) ?? 0) + 1);
  }
  return hours;
}

// One record per calendar day, starting at the local midnight `start`.
export async function queryDailyEnergy(
  start: Date,
  days: number,
): Promise<DayRecord[]> {
  const end = addDays(start, days);
  const [food, resting, active, hours] = await Promise.all([
    dailySums('food', start, end),
    dailySums('resting', start, end),
    dailySums('active', start, end),
    restingHours(start, end),
  ]);

  return Array.from({ length: days }, (_, index) => {
    const day = addDays(start, index);
    const key = dayKey(day);
    // 23 or 25 hours on daylight saving changes.
    const hoursInDay = (addDays(day, 1).getTime() - day.getTime()) / HOUR_MS;
    const restingHoursOfDay = hours.get(key);
    return {
      date: toDateKey(day),
      food: food.get(key),
      resting: resting.get(key),
      active: active.get(key),
      // Unknown when the hourly query failed; the day then counts as measured.
      restingCoverage:
        restingHoursOfDay === undefined
          ? undefined
          : Math.min(1, restingHoursOfDay / hoursInDay),
    };
  });
}
