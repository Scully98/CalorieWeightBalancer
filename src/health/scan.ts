import {
  BiologicalSex,
  getBiologicalSexAsync,
  getDateOfBirthAsync,
  getMostRecentQuantitySample,
  queryQuantitySamples,
  queryStatisticsCollectionForQuantity,
  type SourceRevision,
} from '@kingstinct/react-native-healthkit';

import { queryDailyEnergy } from './daily-energy';
import { QUANTITY } from './read-types';
import { safe } from './safe';
import { startOfDay } from '@/core/dates';
import type { DayEnergy } from '@/core/day-record';
import { FULL_DAY_COVERAGE } from '@/core/resting';

// Measurements are counted up to this number; more shows as "100+".
export const MAX_COUNTED_SAMPLES = 100;

// Days checked for a typical resting energy before asking for an estimate.
const TYPICAL_RESTING_DAYS = 30;

// Full days needed before the intro treats resting energy as measured.
export const MIN_TYPICAL_DAYS = 7;

// Median resting energy of fully covered days; undefined below
// MIN_TYPICAL_DAYS days. Tells the intro whether a watch measures resting
// energy, so it can skip asking for the estimate inputs.
export function typicalResting(days: readonly DayEnergy[]): number | undefined {
  const values = days
    .filter(
      (day) =>
        day.resting !== undefined &&
        !day.restingEstimated &&
        (day.restingCoverage ?? 1) >= FULL_DAY_COVERAGE,
    )
    .map((day) => day.resting as number)
    .sort((a, b) => a - b);
  if (values.length < MIN_TYPICAL_DAYS) return undefined;
  const middle = Math.floor(values.length / 2);
  return values.length % 2
    ? values[middle]
    : (values[middle - 1] + values[middle]) / 2;
}

export type RowScan = {
  hasData: boolean;
  // Source of the most recent sample.
  source?: SourceRevision;
  lastDate?: Date;
};

export type HealthScan = {
  food: RowScan & { firstDate?: Date };
  active: RowScan & { daysWithData: number };
  // Median of fully covered days, see typicalResting.
  resting: RowScan & { daysWithData: number; typical?: number };
  weight: RowScan & { count: number };
  bodyFat: RowScan & { count: number };
  profile: HealthProfile;
};

export type HealthProfile = {
  weightKg?: number;
  heightCm?: number;
  dateOfBirth?: Date;
  biologicalSex: BiologicalSex;
};

// Inputs for the resting energy estimate. Must only run after
// requestReadAccess().
export async function readHealthProfile(): Promise<HealthProfile> {
  const [weightKg, height, dateOfBirth, biologicalSex] = await Promise.all([
    safe(() => getMostRecentQuantitySample(QUANTITY.weight, 'kg'), undefined),
    safe(() => getMostRecentQuantitySample(QUANTITY.height, 'cm'), undefined),
    safe(() => getDateOfBirthAsync(), undefined),
    safe(() => getBiologicalSexAsync(), BiologicalSex.notSet),
  ]);
  return {
    weightKg: weightKg?.quantity,
    heightCm: height?.quantity,
    dateOfBirth,
    biologicalSex,
  };
}

// Most recent sample of a type. Must only run after requestReadAccess().
export async function latest(
  identifier: (typeof QUANTITY)[keyof typeof QUANTITY],
): Promise<RowScan & { value?: number }> {
  const sample = await safe(
    () => getMostRecentQuantitySample(identifier),
    undefined,
  );
  return sample
    ? {
        hasData: true,
        source: sample.sourceRevision,
        lastDate: sample.startDate,
        value: sample.quantity,
      }
    : { hasData: false };
}

async function daysWithEnergy(
  identifier: typeof QUANTITY.active | typeof QUANTITY.resting,
  today: Date,
): Promise<number> {
  // Calendar days, not 7 × 24 h: that would miss a day after a DST change.
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 7,
  );
  const buckets = await safe(
    () =>
      queryStatisticsCollectionForQuantity(
        identifier,
        ['cumulativeSum'],
        today,
        { day: 1 },
        {
          unit: 'kcal',
          filter: { date: { startDate: start, endDate: today } },
        },
      ),
    [],
  );
  return buckets.filter(
    (bucket) =>
      bucket.startDate !== undefined &&
      bucket.startDate >= start &&
      bucket.startDate < today &&
      (bucket.sumQuantity?.quantity ?? 0) > 0,
  ).length;
}

// Counts measurements up to MAX_COUNTED_SAMPLES; a raw sample query is fine
// here because nothing is summed.
async function sampleCount(
  identifier:
    typeof QUANTITY.weight | typeof QUANTITY.bodyFat | typeof QUANTITY.leanMass,
): Promise<number> {
  const samples = await safe(
    () => queryQuantitySamples(identifier, { limit: MAX_COUNTED_SAMPLES }),
    [],
  );
  return samples.length;
}

// Must only run after requestReadAccess().
export async function scanHealthData(now: Date): Promise<HealthScan> {
  const today = startOfDay(now);
  const [
    food,
    firstFood,
    active,
    activeDays,
    resting,
    restingDays,
    weight,
    weightCount,
    bodyFat,
    bodyFatCount,
    leanMass,
    leanMassCount,
    profile,
    recentDays,
  ] = await Promise.all([
    latest(QUANTITY.food),
    // Only the first entry (limit 1), nothing is summed.
    safe(
      () =>
        queryQuantitySamples(QUANTITY.food, {
          limit: 1,
          ascending: true,
          unit: 'kcal',
        }),
      [],
    ),
    latest(QUANTITY.active),
    daysWithEnergy(QUANTITY.active, today),
    latest(QUANTITY.resting),
    daysWithEnergy(QUANTITY.resting, today),
    latest(QUANTITY.weight),
    sampleCount(QUANTITY.weight),
    latest(QUANTITY.bodyFat),
    sampleCount(QUANTITY.bodyFat),
    latest(QUANTITY.leanMass),
    sampleCount(QUANTITY.leanMass),
    readHealthProfile(),
    queryDailyEnergy(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - TYPICAL_RESTING_DAYS,
      ),
      TYPICAL_RESTING_DAYS,
    ),
  ]);

  // Body fat row also counts lean body mass measurements.
  const composition = bodyFat.hasData
    ? { ...bodyFat, count: bodyFatCount }
    : { ...leanMass, count: leanMassCount };

  return {
    food: { ...food, firstDate: firstFood[0]?.startDate },
    active: { ...active, daysWithData: activeDays },
    resting: {
      ...resting,
      daysWithData: restingDays,
      typical: typicalResting(recentDays),
    },
    weight: { ...weight, count: weightCount },
    bodyFat: composition,
    profile,
  };
}
