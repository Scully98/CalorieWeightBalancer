import { ageInYears } from '@/core/age';
import { estimateRestingEnergy } from '@/core/bmr';
import { sexState } from '@/features/intro/bmr-inputs';
import type { HealthProfile } from '@/health/scan';
import type { StoredProfile } from '@/storage/settings';

// Resting energy for days without Health data, from the same inputs as the
// intro estimate: Health values first, then what the user entered.
export function restingFallback(
  health: HealthProfile,
  stored: StoredProfile,
  now: Date,
): number | undefined {
  const weightKg = health.weightKg ?? stored.weightKg;
  const heightCm = health.heightCm ?? stored.heightCm;
  const ageYears = health.dateOfBirth
    ? ageInYears(health.dateOfBirth, now)
    : stored.ageYears;
  const sex = sexState(health.biologicalSex, stored.sex).value;

  if (
    weightKg === undefined ||
    heightCm === undefined ||
    ageYears === undefined ||
    sex === undefined
  )
    return undefined;
  return estimateRestingEnergy({ weightKg, heightCm, ageYears, sex });
}
