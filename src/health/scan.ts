import {
  BiologicalSex,
  getBiologicalSexAsync,
  getDateOfBirthAsync,
  getMostRecentQuantitySample,
  queryQuantitySamples,
  queryStatisticsCollectionForQuantity,
  type SourceRevision,
} from '@kingstinct/react-native-healthkit';

import { QUANTITY } from './read-types';

const DAY_MS = 24 * 60 * 60 * 1000;

export type RowScan = {
  hasData: boolean;
  // Source of the most recent sample.
  source?: SourceRevision;
  lastDate?: Date;
};

export type HealthScan = {
  food: RowScan & { firstDate?: Date };
  active: RowScan & { daysWithData: number };
  resting: RowScan & { daysWithData: number };
  weight: RowScan & { count: number };
  bodyFat: RowScan & { count: number };
  profile: {
    weightKg?: number;
    heightCm?: number;
    dateOfBirth?: Date;
    biologicalSex: BiologicalSex;
  };
};

// Denied read access looks like missing data, so every query falls back
// instead of failing the whole scan.
async function safe<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback;
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

async function latest(
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
  const start = new Date(today.getTime() - 7 * DAY_MS);
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

async function sampleCount(
  identifier:
    typeof QUANTITY.weight | typeof QUANTITY.bodyFat | typeof QUANTITY.leanMass,
): Promise<number> {
  const samples = await safe(
    () => queryQuantitySamples(identifier, { limit: 0 }),
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
    weightKg,
    height,
    dateOfBirth,
    biologicalSex,
  ] = await Promise.all([
    latest(QUANTITY.food),
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
    safe(() => getMostRecentQuantitySample(QUANTITY.weight, 'kg'), undefined),
    safe(() => getMostRecentQuantitySample(QUANTITY.height, 'cm'), undefined),
    safe(() => getDateOfBirthAsync(), undefined),
    safe(() => getBiologicalSexAsync(), BiologicalSex.notSet),
  ]);

  // Body fat row also counts lean body mass measurements.
  const composition = bodyFat.hasData
    ? { ...bodyFat, count: bodyFatCount }
    : { ...leanMass, count: leanMassCount };

  return {
    food: { ...food, firstDate: firstFood[0]?.startDate },
    active: { ...active, daysWithData: activeDays },
    resting: { ...resting, daysWithData: restingDays },
    weight: { ...weight, count: weightCount },
    bodyFat: composition,
    profile: {
      weightKg: weightKg?.quantity,
      heightCm: height?.quantity,
      dateOfBirth,
      biologicalSex,
    },
  };
}
