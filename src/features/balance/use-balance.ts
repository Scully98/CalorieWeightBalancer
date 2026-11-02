import type { SourceRevision } from '@kingstinct/react-native-healthkit';
import { useCallback } from 'react';

import {
  estimateSummary,
  restingInputs,
  type EstimateSummary,
} from './resting-fallback';
import { analyzeBalance, type Analysis } from '@/core/analysis';
import { bodyValues, TREND_MAX_LOOKBACK_DAYS } from '@/core/body';
import { chartBuckets, type ChartBucket } from '@/core/chart';
import { addDays, elapsedDayHours, startOfDay } from '@/core/dates';
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
  // The running day up to `loadedAt`, wherever it stands to the period.
  today: { day: DayBalance; placement: TodayPlacement };
  // When Health was asked.
  loadedAt: Date;
  // Only when no day of the period has food, for the empty state.
  emptyInfo?: EmptyInfo;
};

// included: last day of the period · excluded: the day right after it, shown
// but not counted · outside: a custom period that ends earlier.
export type TodayPlacement = 'included' | 'excluded' | 'outside';

export type EmptyInfo = {
  // First day with food in Health; undefined without any.
  firstDataDate?: Date;
  // Newest food entry before the period.
  foodBefore?: Date;
};

// `empty`: no day of the period has a food entry. iOS reports denied read
// access as empty data, so the pages explain it with a permissions hint;
// it is never an error.
export type BalanceState =
  | Exclude<LoadState<BalanceReport>, { status: 'done' }>
  | { status: 'done' | 'empty'; value: BalanceReport };

export function toBalanceState(state: LoadState<BalanceReport>): BalanceState {
  if (state.status !== 'done') return state;
  // Not by the noFood flag: the running day never has it.
  return state.value.days.every((day) => day.food === undefined)
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
  // Lead-in and period; the running day only when the period includes it.
  history: DayRecord[];
  records: DayRecord[];
  // The running day; with `included` also the last record.
  todayRecord: DayRecord;
  todayPlacement: TodayPlacement;
  // Newest weight before today, for the estimate of an outside running day.
  todayWeightBeforeKg?: number;
  health: HealthProfile;
  sources: Record<DataKey, SourceRevision | undefined>;
  weightBeforeKg?: number;
  // The running day counts up to here.
  loadedAt: Date;
  emptyInfo?: EmptyInfo;
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
  const today = startOfDay(now);
  const todayKey = toDateKey(today);
  // The running day is always loaded: in the period, as the day after it
  // (a bar marked „zählt nicht“), or on its own.
  const todayPlacement: TodayPlacement =
    count > 0 && toDateKey(addDays(start, count - 1)) === todayKey
      ? 'included'
      : toDateKey(addDays(start, count)) === todayKey
        ? 'excluded'
        : 'outside';
  const withToday = todayPlacement === 'excluded' ? 1 : 0;
  const outside = todayPlacement === 'outside';
  const [loaded, health, sources, weightBeforeKg, ownToday] = await Promise.all(
    [
      source.days(
        addDays(start, -LEAD_IN_DAYS),
        LEAD_IN_DAYS + count + withToday,
      ),
      source.profile(),
      source.latestSources(),
      source.weightBefore(start),
      outside
        ? Promise.all([
            source.days(today, 1),
            source.weightBefore(addDays(today, 1)),
          ])
        : undefined,
    ],
  );

  const history = loaded.slice(0, LEAD_IN_DAYS + count);
  const records = history.slice(LEAD_IN_DAYS);
  // Why the period is empty: no data at all, or none in this period.
  const emptyInfo = records.some((record) => record.food !== undefined)
    ? undefined
    : await Promise.all([
        firstDataDate ?? source.firstDataDate(),
        source.foodBefore(start),
      ]).then(([first, before]) => ({
        firstDataDate: first,
        foodBefore: before,
      }));
  return {
    history,
    records,
    todayRecord: ownToday
      ? ownToday[0][0]
      : (loaded.at(-1) ?? { date: todayKey }),
    todayPlacement,
    todayWeightBeforeKg: ownToday?.[1],
    health,
    sources,
    weightBeforeKg,
    loadedAt: now,
    emptyInfo,
  };
}

// Pure: the same data with other settings or body data gives the new numbers
// at once, without asking Health again.
export function buildReport(
  data: PeriodData,
  { zeroDaysAsMaintenance, tolerance }: ComputeSettings,
  stored: StoredProfile,
): BalanceReport {
  const {
    history,
    records,
    todayRecord,
    todayPlacement,
    todayWeightBeforeKg,
    health,
    sources,
    weightBeforeKg,
    loadedAt,
    emptyInfo,
  } = data;
  const inputs = restingInputs(health, stored);
  const options = {
    zeroDaysAsMaintenance,
    profile: inputs.profile,
    weightBeforeKg,
    // Counted up to the load, never scaled to 24 hours.
    runningDay: { date: todayRecord.date, ...elapsedDayHours(loadedAt) },
  };
  const days = dayBalances(records, options);
  const lastWeightKg = records
    .filter((record) => record.weightKg !== undefined)
    .at(-1)?.weightKg;
  const today =
    todayPlacement === 'included'
      ? (days.at(-1) as DayBalance)
      : dayBalances([todayRecord], {
          ...options,
          weightBeforeKg:
            todayPlacement === 'outside'
              ? todayWeightBeforeKg
              : (lastWeightKg ?? weightBeforeKg),
        })[0];

  return {
    balance: periodBalance(days, tolerance),
    days,
    estimate: estimateSummary(inputs, records, days, weightBeforeKg),
    chart: {
      buckets: chartBuckets(days, {
        measured: records.map((record) => record.weightKg !== undefined),
        body: records.map(bodyValues),
        today: todayPlacement === 'excluded' ? today : undefined,
      }),
      lines: chartLines(history, days, LEAD_IN_DAYS),
    },
    analysis: analyzeBalance(history, days, LEAD_IN_DAYS),
    daysWithData: Object.fromEntries(
      DATA_KEYS.map((key) => [key, records.filter(HAS_VALUE[key]).length]),
    ) as Record<DataKey, number>,
    sources,
    today: { day: today, placement: todayPlacement },
    loadedAt,
    emptyInfo,
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
