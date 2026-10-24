import { loadBalance, toBalanceState } from '../use-balance';
import { TREND_MAX_LOOKBACK_DAYS as LEAD_IN } from '@/core/body';
import { addDays } from '@/core/dates';
import { toDateKey } from '@/core/day-record';
import { DEFAULT_SETTINGS } from '@/core/settings';
import type { HealthSource } from '@/health/source';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
}));
jest.mock('@/storage/settings', () => ({ getProfile: () => ({}) }));

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
