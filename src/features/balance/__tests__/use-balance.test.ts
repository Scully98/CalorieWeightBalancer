import {
  buildReport,
  loadBalance,
  loadKey,
  loadPeriodData,
  toBalanceState,
} from '../use-balance';
import { TREND_MAX_LOOKBACK_DAYS as LEAD_IN } from '@/core/body';
import { addDays } from '@/core/dates';
import { toDateKey } from '@/core/day-record';
import { DEFAULT_SETTINGS } from '@/core/settings';
import type { HealthSource } from '@/health/source';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
}));

const NOW = new Date(2026, 9, 24, 14, 32);

// A source as HealthKit answers without data or without read access.
const nothing: HealthSource = {
  async days(start, count) {
    return Array.from({ length: count }, (_, i) => ({
      date: toDateKey(addDays(start, i)),
    }));
  },
  async profile() {
    return { biologicalSex: 0 };
  },
  async latestSources() {
    return {
      food: undefined,
      resting: undefined,
      active: undefined,
      weight: undefined,
      bodyFat: undefined,
    };
  },
  async firstDataDate() {
    return undefined;
  },
  async weightBefore() {
    return undefined;
  },
};

// Food on the given days of the period (0 = first day); the load asks for
// the lead-in days first.
function withFood(...offsets: number[]): HealthSource {
  return {
    ...nothing,
    async days(start, count) {
      const days = await nothing.days(start, count);
      return days.map((day, i) =>
        offsets.includes(i - LEAD_IN) ? { ...day, food: 2000 } : day,
      );
    },
  };
}

describe('toBalanceState', () => {
  it('reports a period without any food entry as empty', async () => {
    const value = await loadBalance(nothing, DEFAULT_SETTINGS, NOW);
    expect(toBalanceState({ status: 'done', value })).toEqual({
      status: 'empty',
      value,
    });
    expect(value.balance.days).toBe(30);
  });

  it('keeps a period with one food entry done', async () => {
    const value = await loadBalance(withFood(5), DEFAULT_SETTINGS, NOW);
    expect(toBalanceState({ status: 'done', value }).status).toBe('done');
  });

  it('reports "all" without any data as empty, not as error', async () => {
    const value = await loadBalance(
      nothing,
      { ...DEFAULT_SETTINGS, period: { kind: 'all' } },
      NOW,
    );
    expect(value.balance.days).toBe(0);
    expect(toBalanceState({ status: 'done', value }).status).toBe('empty');
  });

  it('passes loading and error through', () => {
    expect(toBalanceState({ status: 'loading' })).toEqual({
      status: 'loading',
    });
    expect(toBalanceState({ status: 'error' })).toEqual({ status: 'error' });
  });
});

// Every period day: food 2,500, resting 1,800, active 500 (B = +200), except
// the given days without food (0 = first day) and, with `noResting`, without
// resting energy.
function steady(
  noFood: number[],
  { noResting = false }: { noResting?: boolean } = {},
): HealthSource {
  return {
    ...nothing,
    async days(start, count) {
      const days = await nothing.days(start, count);
      return days.map((day, i) =>
        i < LEAD_IN
          ? day
          : {
              ...day,
              food: noFood.includes(i - LEAD_IN) ? undefined : 2500,
              resting: noResting ? undefined : 1800,
              active: 500,
            },
      );
    },
  };
}

describe('buildReport', () => {
  it('counts zero days again without loading', async () => {
    const data = await loadPeriodData(steady([3, 4]), DEFAULT_SETTINGS, NOW);
    const on = buildReport(data, DEFAULT_SETTINGS, {});
    const off = buildReport(
      data,
      { ...DEFAULT_SETTINGS, zeroDaysAsMaintenance: false },
      {},
    );
    expect(on.balance).toMatchObject({ kcal: 28 * 200, maintenanceDays: 2 });
    // Two days with the full burn of 2,300 as deficit.
    expect(off.balance).toMatchObject({
      kcal: 28 * 200 - 2 * 2300,
      maintenanceDays: 0,
    });
  });

  it('gives a range with tolerance', async () => {
    const data = await loadPeriodData(steady([]), DEFAULT_SETTINGS, NOW);
    const { range } = buildReport(
      data,
      { ...DEFAULT_SETTINGS, tolerance: { foodPercent: 5, burnPercent: 10 } },
      {},
    ).balance;
    // A = 75,000, V = 69,000: 75,000 × 0.95 − 69,000 and
    // 75,000 × 1.05 − 69,000 × 0.9.
    expect(range.min).toBeCloseTo(2250);
    expect(range.max).toBeCloseTo(16650);
  });

  it('estimates resting energy from the changed body data', async () => {
    const data = await loadPeriodData(
      steady([], { noResting: true }),
      DEFAULT_SETTINGS,
      NOW,
    );
    const body = {
      weightKg: 80,
      weightRecordedOn: '2026-10-01',
      ageYears: 34,
      ageRecordedOn: '2026-10-24',
      sex: 'male' as const,
    };
    const short = buildReport(data, DEFAULT_SETTINGS, {
      ...body,
      heightCm: 170,
    });
    const tall = buildReport(data, DEFAULT_SETTINGS, {
      ...body,
      heightCm: 180,
    });
    // 6.25 kcal per cm.
    expect(tall.estimate!.avgKcal - short.estimate!.avgKcal).toBeCloseTo(62.5);
    expect(short.balance.excludedDays).toBe(0);
  });
});

describe('loadKey', () => {
  it('ignores zero days and tolerance', () => {
    expect(
      loadKey({
        ...DEFAULT_SETTINGS,
        zeroDaysAsMaintenance: false,
        tolerance: { foodPercent: 10, burnPercent: 20 },
      }),
    ).toBe(loadKey(DEFAULT_SETTINGS));
  });

  it('changes with the period and today', () => {
    const base = loadKey(DEFAULT_SETTINGS);
    expect(loadKey({ ...DEFAULT_SETTINGS, includeToday: true })).not.toBe(base);
    expect(
      loadKey({ ...DEFAULT_SETTINGS, period: { kind: 'days', days: 7 } }),
    ).not.toBe(base);
  });
});
