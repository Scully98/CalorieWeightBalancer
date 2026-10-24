import type { SourceRevision } from '@kingstinct/react-native-healthkit';
import { useCallback } from 'react';

import {
  estimateSummary,
  restingInputs,
  type EstimateSummary,
} from './resting-fallback';
import { dayBalances, type DayBalance } from '@/core/day-balance';
import type { DayRecord } from '@/core/day-record';
import { resolvePeriod } from '@/core/period';
import { periodBalance, type PeriodBalance } from '@/core/period-balance';
import { DEFAULT_SETTINGS, type Settings } from '@/core/settings';
import type { EnergyKey, HealthSource } from '@/health/source';
import { useHealthSource } from '@/health/source-context';
import {
  useForegroundRefresh,
  type LoadState,
} from '@/hooks/use-foreground-refresh';
import { getProfile } from '@/storage/settings';

export type { EnergyKey } from '@/health/source';

export const ENERGY_KEYS: readonly EnergyKey[] = ['food', 'resting', 'active'];

// Everything both pages show, from one load so their numbers always match.
export type BalanceReport = {
  balance: PeriodBalance;
  days: DayBalance[];
  // Inputs and result of the resting energy formula, when a counted day used it.
  estimate?: EstimateSummary;
  // Days of the period with any Health value, per type.
  daysWithData: Record<EnergyKey, number>;
  // Source of the most recent sample, per type.
  sources: Record<EnergyKey, SourceRevision | undefined>;
};

export type BalanceState = LoadState<BalanceReport>;

function countDays(days: readonly DayRecord[], key: EnergyKey): number {
  return days.filter((day) => day[key] !== undefined).length;
}

async function loadBalance(
  source: HealthSource,
  settings: Settings,
  now: Date,
): Promise<BalanceReport> {
  const { period, includeToday, zeroDaysAsMaintenance, tolerance } = settings;
  const firstDataDate =
    period.kind === 'all' ? await source.firstDataDate() : undefined;
  const { start, days: count } = resolvePeriod(period, now, {
    includeToday,
    firstDataDate,
  });
  const [records, health, sources, weightBeforeKg] = await Promise.all([
    source.days(start, count),
    source.profile(),
    source.latestSources(),
    source.weightBefore(start),
  ]);

  const inputs = restingInputs(health, getProfile());
  const days = dayBalances(records, {
    zeroDaysAsMaintenance,
    profile: inputs.profile,
    weightBeforeKg,
  });

  return {
    balance: periodBalance(days, tolerance),
    days,
    estimate: estimateSummary(inputs, records, days, weightBeforeKg),
    daysWithData: {
      food: countDays(records, 'food'),
      resting: countDays(records, 'resting'),
      active: countDays(records, 'active'),
    },
    sources,
  };
}

export function useBalance(settings: Settings = DEFAULT_SETTINGS): BalanceState {
  const source = useHealthSource();
  // New settings with the same content must not trigger a reload.
  const settingsKey = JSON.stringify(settings);
  const load = useCallback(
    () => loadBalance(source, JSON.parse(settingsKey) as Settings, new Date()),
    [source, settingsKey],
  );
  return useForegroundRefresh(load);
}
