import type { SourceRevision } from '@kingstinct/react-native-healthkit';
import { useCallback } from 'react';

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
import { resolvePeriod, type Period } from '@/core/period';
import { DEFAULT_SETTINGS } from '@/core/settings';
import type { EnergyKey, HealthSource } from '@/health/source';
import { useHealthSource } from '@/health/source-context';
import {
  useForegroundRefresh,
  type LoadState,
} from '@/hooks/use-foreground-refresh';
import { getProfile } from '@/storage/settings';

export type { EnergyKey } from '@/health/source';

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

// Complete days of the period; today is still running and left out.
async function loadBalance(
  source: HealthSource,
  period: Period,
  now: Date,
): Promise<BalanceReport> {
  const firstDataDate =
    period.kind === 'all' ? await source.firstDataDate() : undefined;
  const { start, days: count } = resolvePeriod(period, now, { firstDataDate });
  const [days, profile, sources] = await Promise.all([
    source.days(start, count),
    source.profile(),
    source.latestSources(),
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
    sources,
  };
}

export function useBalance(
  period: Period = DEFAULT_SETTINGS.period,
): BalanceState {
  const source = useHealthSource();
  // A new period object with the same content must not trigger a reload.
  const periodKey = JSON.stringify(period);
  const load = useCallback(
    () => loadBalance(source, JSON.parse(periodKey) as Period, new Date()),
    [source, periodKey],
  );
  return useForegroundRefresh(load);
}
