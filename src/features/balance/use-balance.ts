import type { SourceRevision } from '@kingstinct/react-native-healthkit';
import { useCallback } from 'react';

import {
  estimateSummary,
  restingInputs,
  type EstimateSummary,
} from './resting-fallback';
import { analyzeBalance, type Analysis } from '@/core/analysis';
import { TREND_MAX_LOOKBACK_DAYS } from '@/core/body';
import { chartBuckets, type ChartBucket } from '@/core/chart';
import { addDays } from '@/core/dates';
import { dayBalances, type DayBalance } from '@/core/day-balance';
import { toDateKey, type DayRecord } from '@/core/day-record';
import { chartLines, type ChartLines } from '@/core/lines';
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
  chart: { buckets: ChartBucket[]; lines: ChartLines };
  analysis: Analysis;
  // Days of the period with any Health value, per type.
  daysWithData: Record<EnergyKey, number>;
  // Source of the most recent sample, per type.
  sources: Record<EnergyKey, SourceRevision | undefined>;
};

// `empty`: no day of the period has a food entry. iOS reports denied read
// access as empty data, so the pages explain it with a permissions hint;
// it is never an error.
export type BalanceState =
  | Exclude<LoadState<BalanceReport>, { status: 'done' }>
  | { status: 'done' | 'empty'; value: BalanceReport };

export function toBalanceState(state: LoadState<BalanceReport>): BalanceState {
  if (state.status !== 'done') return state;
  const { balance } = state.value;
  return balance.flagCounts.noFood === balance.days
    ? { status: 'empty', value: state.value }
    : state;
}

// Days loaded before the period, so the 7-day trend on its first day can
// reach back as far as on any other day.
const LEAD_IN_DAYS = TREND_MAX_LOOKBACK_DAYS;

function countDays(days: readonly DayRecord[], key: EnergyKey): number {
  return days.filter((day) => day[key] !== undefined).length;
}

// Exported for the scenario tests.
export async function loadBalance(
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
  // The running day is loaded too when the period ends yesterday: as a bar
  // marked „zählt nicht“.
  const endsYesterday =
    count > 0 && toDateKey(addDays(start, count)) === toDateKey(now);
  const withToday = !includeToday && endsYesterday ? 1 : 0;
  const [loaded, health, sources, weightBeforeKg] = await Promise.all([
    source.days(
      addDays(start, -LEAD_IN_DAYS),
      LEAD_IN_DAYS + count + withToday,
    ),
    source.profile(),
    source.latestSources(),
    source.weightBefore(start),
  ]);

  // Lead-in and period, without the running day.
  const history = loaded.slice(0, LEAD_IN_DAYS + count);
  const records = history.slice(LEAD_IN_DAYS);
  const todayRecord = withToday ? loaded[LEAD_IN_DAYS + count] : undefined;

  const inputs = restingInputs(health, getProfile());
  const options = {
    zeroDaysAsMaintenance,
    profile: inputs.profile,
    weightBeforeKg,
  };
  const days = dayBalances(records, options);
  const lastWeightKg = records
    .filter((record) => record.weightKg !== undefined)
    .at(-1)?.weightKg;
  const [today] = todayRecord
    ? dayBalances([todayRecord], {
        ...options,
        weightBeforeKg: lastWeightKg ?? weightBeforeKg,
      })
    : [];

  return {
    balance: periodBalance(days, tolerance),
    days,
    estimate: estimateSummary(inputs, records, days, weightBeforeKg),
    chart: {
      buckets: chartBuckets(days, {
        measured: records.map((record) => record.weightKg !== undefined),
        today,
      }),
      lines: chartLines(history, days, LEAD_IN_DAYS),
    },
    analysis: analyzeBalance(history, days, LEAD_IN_DAYS),
    daysWithData: {
      food: countDays(records, 'food'),
      resting: countDays(records, 'resting'),
      active: countDays(records, 'active'),
    },
    sources,
  };
}

export function useBalance(
  settings: Settings = DEFAULT_SETTINGS,
): BalanceState {
  const source = useHealthSource();
  // New settings with the same content must not trigger a reload.
  const settingsKey = JSON.stringify(settings);
  const load = useCallback(
    () => loadBalance(source, JSON.parse(settingsKey) as Settings, new Date()),
    [source, settingsKey],
  );
  return toBalanceState(useForegroundRefresh(load));
}
