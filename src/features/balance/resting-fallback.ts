import { ageInYears, currentAge } from '@/core/age';
import { estimateRestingEnergy, type Sex } from '@/core/bmr';
import { sexState } from '@/features/intro/bmr-inputs';
import type { HealthProfile } from '@/health/scan';
import type { StoredProfile } from '@/storage/settings';

export type Sourced<T> = { value: T; fromHealth: boolean };

export type FallbackInputs = {
  weightKg: Sourced<number>;
  heightCm: Sourced<number>;
  ageYears: Sourced<number>;
  // `shown` keeps "other" from Health, which the estimate treats as
  // unspecified.
  sex: Sourced<Sex> & { shown: 'male' | 'female' | 'other' | 'unspecified' };
};

function pick<T>(
  health: T | undefined,
  stored: T | undefined,
): Sourced<T> | undefined {
  if (health !== undefined) return { value: health, fromHealth: true };
  return stored === undefined
    ? undefined
    : { value: stored, fromHealth: false };
}

// Inputs for the resting energy estimate, the same as in the intro: Health
// values first, then what the user entered. Undefined while one is missing.
export function fallbackInputs(
  health: HealthProfile,
  stored: StoredProfile,
  now: Date,
): FallbackInputs | undefined {
  const weightKg = pick(health.weightKg, stored.weightKg);
  const heightCm = pick(health.heightCm, stored.heightCm);
  const ageYears = pick(
    health.dateOfBirth ? ageInYears(health.dateOfBirth, now) : undefined,
    stored.ageYears === undefined
      ? undefined
      : currentAge(stored.ageYears, stored.ageRecordedOn, now),
  );
  const sex = sexState(health.biologicalSex, stored.sex);

  if (
    weightKg === undefined ||
    heightCm === undefined ||
    ageYears === undefined ||
    sex.value === undefined
  )
    return undefined;
  return {
    weightKg,
    heightCm,
    ageYears,
    sex: {
      value: sex.value,
      fromHealth: sex.source === 'health',
      shown: sex.source === 'health' ? sex.fromHealth : sex.value,
    },
  };
}

export function estimateFromInputs(inputs: FallbackInputs): number {
  return estimateRestingEnergy({
    weightKg: inputs.weightKg.value,
    heightCm: inputs.heightCm.value,
    ageYears: inputs.ageYears.value,
    sex: inputs.sex.value,
  });
}

// Resting energy for days without Health data.
export function restingFallback(
  health: HealthProfile,
  stored: StoredProfile,
  now: Date,
): number | undefined {
  const inputs = fallbackInputs(health, stored, now);
  return inputs && estimateFromInputs(inputs);
}
