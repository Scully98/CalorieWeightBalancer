import type { SourceRevision } from '@kingstinct/react-native-healthkit';

import {
  estimateFromInputs,
  fallbackInputs,
  type FallbackInputs,
} from './resting-fallback';
import {
  periodBreakdown,
  typicalResting,
  type DayEnergy,
  type PeriodBreakdown,
} from '@/core/balance';
import { queryDailyEnergy } from '@/health/daily-energy';
import { QUANTITY } from '@/health/read-types';
import { latest, readHealthProfile } from '@/health/scan';
import {
  useForegroundRefresh,
  type LoadState,
} from '@/hooks/use-foreground-refresh';
import { getProfile } from '@/storage/settings';

export const BALANCE_DAYS = 30;

export type EnergyKey = 'food' | 'resting' | 'active';

export const ENERGY_KEYS: readonly EnergyKey[] = ['food', 'resting', 'active'];

// Resting energy for days without enough measurement: the median of measured
// full days, else the estimate from the profile.
export type RestingFallback =
  | { kind: 'typical'; kcal: number }
  | { kind: 'estimate'; kcal: number; inputs: FallbackInputs };

// Everything both pages show, from one load so their numbers always match.
export type BalanceReport = {
  balance: PeriodBreakdown;
  fallback?: RestingFallback;
  // Days of the period with any Health value, per type.
  daysWithData: Record<EnergyKey, number>;
  // Source of the most recent sample, per type.
  sources: Record<EnergyKey, SourceRevision | undefined>;
};

export type BalanceState = LoadState<BalanceReport>;

function countDays(days: readonly DayEnergy[], key: EnergyKey): number {
  return days.filter((day) => day[key] !== undefined).length;
}

// The last BALANCE_DAYS complete days; today is still running and left out.
async function loadBalance(): Promise<BalanceReport> {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - BALANCE_DAYS,
  );
  const [days, profile, food, resting, active] = await Promise.all([
    queryDailyEnergy(start, BALANCE_DAYS),
    readHealthProfile(),
    latest(QUANTITY.food),
    latest(QUANTITY.resting),
    latest(QUANTITY.active),
  ]);

  const typical = typicalResting(days);
  const inputs =
    typical === undefined
      ? fallbackInputs(profile, getProfile(), now)
      : undefined;
  const fallback: RestingFallback | undefined =
    typical !== undefined
      ? { kind: 'typical', kcal: typical }
      : inputs
        ? { kind: 'estimate', kcal: estimateFromInputs(inputs), inputs }
        : undefined;

  return {
    balance: periodBreakdown(days, fallback?.kcal),
    fallback,
    daysWithData: {
      food: countDays(days, 'food'),
      resting: countDays(days, 'resting'),
      active: countDays(days, 'active'),
    },
    sources: {
      food: food.source,
      resting: resting.source,
      active: active.source,
    },
  };
}

export function useBalance(): BalanceState {
  return useForegroundRefresh(loadBalance);
}
