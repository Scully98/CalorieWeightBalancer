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
import type { Settings } from '@/core/settings';
import type { HealthProfile } from '@/health/scan';
import type { DataKey, HealthSource } from '@/health/source';
import { useHealthSource } from '@/health/source-context';
import {
  useForegroundRefresh,
  type LoadState,
} from '@/hooks/use-foreground-refresh';
import { useSettings, useStoredProfile } from '@/storage/settings-context';
import type { StoredProfile } from '@/storage/settings-store';

export type { DataKey, EnergyKey } from '@/health/source';

// Rows under „Was ankommt“, in order.
export const DATA_KEYS: readonly DataKey[] = [
  'food',
  'resting',
  'active',
  'weight',
  'bodyFat',
];

// Everything both pages show, from one load so their numbers always match.
export type BalanceReport = {
  balance: PeriodBalance;
  days: DayBalance[];
  // Inputs and result of the resting energy formula, when a counted day used it.
  estimate?: EstimateSummary;
  chart: { buckets: ChartBucket[]; lines: ChartLines };
  analysis: Analysis;
  // Days of the period with any Health value, per type.
  daysWithData: Record<DataKey, number>;
  // Source of the most recent sample, per type.
  sources: Record<DataKey, SourceRevision | undefined>;
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

// Days with a value per row; body fat also counts lean mass, which some
// scales write instead.
const HAS_VALUE: Record<DataKey, (day: DayRecord) => boolean> = {
  food: (day) => day.food !== undefined,
  resting: (day) => day.resting !== undefined,
  active: (day) => day.active !== undefined,
  weight: (day) => day.weightKg !== undefined,
  bodyFat: (day) =>
    day.bodyFatFraction !== undefined || day.leanMassKg !== undefined,
};

// What the period needs from Health. Loaded again only for another period,
// on return to the foreground or with another source; everything else is
// computed from it on every change (`buildReport`).
export type PeriodData = {
  // Lead-in and period, without the running day.
  history: DayRecord[];
  records: DayRecord[];
  // The running day, when the period ends yesterday.
  todayRecord?: DayRecord;
  health: HealthProfile;
  sources: Record<DataKey, SourceRevision | undefined>;
  weightBeforeKg?: number;
};

type LoadSettings = Pick<Settings, 'period' | 'includeToday'>;
type ComputeSettings = Pick<Settings, 'zeroDaysAsMaintenance' | 'tolerance'>;

// Settings that change which days are loaded; zero days and tolerance only
// change the calculation.
export function loadKey({ period, includeToday }: Settings): string {
  return JSON.stringify({ period, includeToday });
}

export async function loadPeriodData(
  source: HealthSource,
  { period, includeToday }: LoadSettings,
  now: Date,
): Promise<PeriodData> {
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

  const history = loaded.slice(0, LEAD_IN_DAYS + count);
  return {
    history,
    records: history.slice(LEAD_IN_DAYS),
    todayRecord: withToday ? loaded[LEAD_IN_DAYS + count] : undefined,
    health,
    sources,
    weightBeforeKg,
  };
}

// Pure: the same data with other settings or body data gives the new numbers
// at once, without asking Health again.
export function buildReport(
  data: PeriodData,
  { zeroDaysAsMaintenance, tolerance }: ComputeSettings,
  stored: StoredProfile,
): BalanceReport {
  const { history, records, todayRecord, health, sources, weightBeforeKg } =
    data;
  const inputs = restingInputs(health, stored);
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
    daysWithData: Object.fromEntries(
      DATA_KEYS.map((key) => [key, records.filter(HAS_VALUE[key]).length]),
    ) as Record<DataKey, number>,
    sources,
  };
}

// Load and calculation in one step, for the tests.
export async function loadBalance(
  source: HealthSource,
  settings: Settings,
  now: Date,
  stored: StoredProfile = {},
): Promise<BalanceReport> {
  return buildReport(
    await loadPeriodData(source, settings, now),
    settings,
    stored,
  );
}

// Settings and body data come from the store; a change shows at once.
export function useBalance(): BalanceState {
  const source = useHealthSource();
  const settings = useSettings();
  const stored = useStoredProfile();
  // New settings with the same days must not trigger a reload.
  const key = loadKey(settings);
  const load = useCallback(
    () => loadPeriodData(source, JSON.parse(key) as LoadSettings, new Date()),
    [source, key],
  );
  const state = useForegroundRefresh(load);
  return toBalanceState(
    state.status === 'done'
      ? { status: 'done', value: buildReport(state.value, settings, stored) }
      : state,
  );
}
