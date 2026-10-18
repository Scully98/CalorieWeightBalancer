import { queryStatisticsCollectionForQuantity } from '@kingstinct/react-native-healthkit';

import { QUANTITY } from './read-types';
import { safe } from './safe';
import type { DayEnergy } from '@/core/balance';

const ENERGY = {
  food: QUANTITY.food,
  resting: QUANTITY.resting,
  active: QUANTITY.active,
} as const satisfies Record<keyof DayEnergy, string>;

type EnergyKey = keyof typeof ENERGY;

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// kcal sum per calendar day; statistics queries deduplicate iPhone and Watch.
async function dailySums(
  key: EnergyKey,
  start: Date,
  end: Date,
): Promise<Map<string, number>> {
  const buckets = await safe(
    () =>
      queryStatisticsCollectionForQuantity(
        ENERGY[key],
        ['cumulativeSum'],
        start,
        { day: 1 },
        { unit: 'kcal', filter: { date: { startDate: start, endDate: end } } },
      ),
    [],
  );
  const sums = new Map<string, number>();
  for (const bucket of buckets) {
    const kcal = bucket.sumQuantity?.quantity ?? 0;
    if (bucket.startDate && kcal > 0) sums.set(dayKey(bucket.startDate), kcal);
  }
  return sums;
}

// One entry per calendar day, starting at the local midnight `start`.
export async function queryDailyEnergy(
  start: Date,
  days: number,
): Promise<DayEnergy[]> {
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + days,
  );
  const [food, resting, active] = await Promise.all([
    dailySums('food', start, end),
    dailySums('resting', start, end),
    dailySums('active', start, end),
  ]);

  return Array.from({ length: days }, (_, index) => {
    const key = dayKey(
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
    );
    return {
      food: food.get(key),
      resting: resting.get(key),
      active: active.get(key),
    };
  });
}
