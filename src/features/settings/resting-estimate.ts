import { useCallback } from 'react';

import { estimateRestingEnergy } from '@/core/bmr';
import { ageOn } from '@/core/resting';
import { restingInputs } from '@/features/balance/resting-fallback';
import type { HealthProfile } from '@/health/scan';
import { useHealthSource } from '@/health/source-context';
import {
  useForegroundRefresh,
  type LoadState,
} from '@/hooks/use-foreground-refresh';
import type { StoredProfile } from '@/storage/settings-store';

// Resting energy after Mifflin-St Jeor for today, from Health first and the
// entered values second (as the balance uses them); undefined while a value
// is missing.
export function todayRestingEstimate(
  health: HealthProfile,
  stored: StoredProfile,
  now: Date,
): number | undefined {
  const { profile } = restingInputs(health, stored);
  const ageYears = ageOn(profile, now);
  const { weightKg, heightCm, sex } = profile;
  if (
    weightKg === undefined ||
    heightCm === undefined ||
    ageYears === undefined ||
    sex === undefined
  )
    return undefined;
  return estimateRestingEnergy({ weightKg, heightCm, ageYears, sex });
}

// Height, birth date, sex and newest weight from the active source.
export function useHealthProfile(): LoadState<HealthProfile> {
  const source = useHealthSource();
  return useForegroundRefresh(useCallback(() => source.profile(), [source]));
}
