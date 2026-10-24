import type { DayBalance } from '@/core/day-balance';
import { fromDateKey, type DayRecord } from '@/core/day-record';
import { ageOn, weightsByDay, type RestingProfile } from '@/core/resting';
import { sexState } from '@/features/intro/bmr-inputs';
import type { HealthProfile } from '@/health/scan';
import type { StoredProfile } from '@/storage/settings';

export type Sourced<T> = { value: T; fromHealth: boolean };

export type EstimateKey = 'weightKg' | 'heightCm' | 'ageYears' | 'sex';

// Inputs of the resting energy estimate, the same as in the intro: Health
// values first, then what the user entered.
export type RestingInputs = {
  profile: RestingProfile;
  // Which values come from Health rather than the user's entries.
  fromHealth: Record<EstimateKey, boolean>;
  // Keeps "other" from Health, which the estimate treats as unspecified.
  sexShown?: 'male' | 'female' | 'other' | 'unspecified';
};

export function restingInputs(
  health: HealthProfile,
  stored: StoredProfile,
): RestingInputs {
  const sex = sexState(health.biologicalSex, stored.sex);
  const fromDateOfBirth = health.dateOfBirth !== undefined;
  return {
    profile: {
      heightCm: health.heightCm ?? stored.heightCm,
      sex: sex.value,
      dateOfBirth: health.dateOfBirth,
      ageYears: fromDateOfBirth ? undefined : stored.ageYears,
      ageRecordedOn: fromDateOfBirth ? undefined : stored.ageRecordedOn,
      weightKg: health.weightKg ?? stored.weightKg,
    },
    fromHealth: {
      weightKg: health.weightKg !== undefined,
      heightCm: health.heightCm !== undefined,
      ageYears: fromDateOfBirth,
      sex: sex.source === 'health',
    },
    sexShown: sex.source === 'health' ? sex.fromHealth : sex.value,
  };
}

// What the data page shows about the estimate: the inputs on the last
// estimated day and the average result.
export type EstimateSummary = {
  weightKg: Sourced<number>;
  heightCm: Sourced<number>;
  ageYears: Sourced<number>;
  sex: Sourced<'male' | 'female' | 'other' | 'unspecified'>;
  // Days estimated by formula that count in the sums.
  days: number;
  avgKcal: number;
};

// Summary of the days estimated by formula that count in the sums, with the
// inputs of the last such day; undefined without any.
export function estimateSummary(
  inputs: RestingInputs,
  records: readonly DayRecord[],
  days: readonly DayBalance[],
  weightBeforeKg: number | undefined,
): EstimateSummary | undefined {
  const formula = days.filter(
    (day) =>
      day.restingSource === 'formula' &&
      day.kcal !== undefined &&
      !day.maintenance,
  );
  const last = formula.at(-1);
  const { profile, fromHealth, sexShown } = inputs;
  if (!last || profile.heightCm === undefined || sexShown === undefined)
    return undefined;

  // A measurement from Health, else the profile weight.
  const index = days.indexOf(last);
  const measured = weightsByDay(records, weightBeforeKg, undefined)[index];
  const weightKg = measured ?? (profile.weightKg as number);
  const ageYears = ageOn(profile, fromDateKey(last.date) as Date) as number;

  return {
    weightKg: {
      value: weightKg,
      fromHealth: measured !== undefined || fromHealth.weightKg,
    },
    heightCm: { value: profile.heightCm, fromHealth: fromHealth.heightCm },
    ageYears: { value: ageYears, fromHealth: fromHealth.ageYears },
    sex: { value: sexShown, fromHealth: fromHealth.sex },
    days: formula.length,
    avgKcal:
      formula.reduce((sum, day) => sum + (day.resting as number), 0) /
      formula.length,
  };
}
