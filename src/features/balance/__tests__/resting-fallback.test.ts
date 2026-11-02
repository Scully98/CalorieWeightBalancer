import { estimateSummary, restingInputs } from '../resting-fallback';
import { dayBalances } from '@/core/day-balance';
import type { DayRecord } from '@/core/day-record';
import { dayResting } from '@/core/resting';
import type { HealthProfile } from '@/health/scan';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
}));

const noHealth: HealthProfile = { biologicalSex: 0 };
const DAY = new Date(2026, 9, 15);

describe('restingInputs', () => {
  it('prefers Health values', () => {
    const health: HealthProfile = {
      weightKg: 82.4,
      heightCm: 182,
      dateOfBirth: new Date(1992, 0, 10),
      biologicalSex: 2,
    };
    const { profile } = restingInputs(health, { weightKg: 60, ageYears: 20 });
    expect(dayResting({}, profile.weightKg, profile, DAY).kcal).toBeCloseTo(
      1796.5,
    );
    expect(profile.ageYears).toBeUndefined();
  });

  it('fills gaps from the stored profile, with the age of the day', () => {
    const { profile } = restingInputs(noHealth, {
      weightKg: 82.4,
      heightCm: 182,
      ageYears: 33,
      ageRecordedOn: '2025-10-01',
      sex: 'male',
    });
    expect(dayResting({}, profile.weightKg, profile, DAY).kcal).toBeCloseTo(
      1796.5,
    );
  });

  it('marks which values come from Health and keeps "other"', () => {
    const inputs = restingInputs(
      { weightKg: 82.4, dateOfBirth: new Date(1992, 0, 10), biologicalSex: 3 },
      { heightCm: 182, sex: 'female' },
    );
    expect(inputs.fromHealth).toEqual({
      weightKg: true,
      heightCm: false,
      ageYears: true,
      sex: true,
    });
    expect(inputs.profile.sex).toBe('unspecified');
    expect(inputs.sexShown).toBe('other');
  });
});

describe('estimateSummary', () => {
  const inputs = restingInputs(noHealth, {
    weightKg: 90,
    heightCm: 182,
    ageYears: 34,
    sex: 'male',
  });
  const records: DayRecord[] = [
    { date: '2026-10-13', food: 2500, active: 300 },
    { date: '2026-10-14', food: 2500, resting: 1800, weightKg: 82.4 },
    { date: '2026-10-15', food: 2500, active: 300 },
    { date: '2026-10-16', active: 300 },
  ];
  const days = dayBalances(records, {
    zeroDaysAsMaintenance: true,
    profile: inputs.profile,
    weightBeforeKg: 83.4,
  });

  it('shows the inputs of the last estimated day and the average', () => {
    const summary = estimateSummary(inputs, records, days, 83.4);
    expect(summary).toEqual({
      weightKg: { value: 82.4, fromHealth: true },
      heightCm: { value: 182, fromHealth: false },
      ageYears: { value: 34, fromHealth: false },
      sex: { value: 'male', fromHealth: false },
      // The zero day on the 16th doesn't count in the sums.
      days: 2,
      // (1,806.5 + 1,796.5) ÷ 2.
      avgKcal: expect.closeTo(1801.5),
    });
  });

  it('names the profile weight when no measurement exists', () => {
    const plain = records.map(({ weightKg, ...rest }) => rest);
    const summary = estimateSummary(
      inputs,
      plain,
      dayBalances(plain, {
        zeroDaysAsMaintenance: true,
        profile: inputs.profile,
      }),
      undefined,
    );
    expect(summary?.weightKg).toEqual({ value: 90, fromHealth: false });
  });

  it('is undefined without an estimated day', () => {
    const measured = days.filter((day) => day.restingSource === 'measured');
    expect(estimateSummary(inputs, records, measured, 83.4)).toBeUndefined();
  });
});
