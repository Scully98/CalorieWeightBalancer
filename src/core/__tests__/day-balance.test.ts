import type { DayRecord } from '../day-record';
import {
  dayBalances,
  isComplete,
  type DayBalanceOptions,
} from '../day-balance';
import type { RestingProfile } from '../resting';

// Wireframe profile: 82.4 kg, 182 cm, 34 years, male → 1,796.5 kcal.
const PROFILE: RestingProfile = {
  heightCm: 182,
  sex: 'male',
  ageYears: 34,
  weightKg: 82.4,
};
const ON: DayBalanceOptions = { zeroDaysAsMaintenance: true, profile: PROFILE };
const OFF: DayBalanceOptions = { ...ON, zeroDaysAsMaintenance: false };

function one(record: Omit<DayRecord, 'date'>, options = ON) {
  return dayBalances([{ date: '2026-10-23', ...record }], options)[0];
}

describe('dayBalances', () => {
  it('computes B = A − (R + K)', () => {
    expect(one({ food: 2900, resting: 1800, active: 800 })).toEqual({
      date: '2026-10-23',
      food: 2900,
      resting: 1800,
      restingSource: 'measured',
      active: 800,
      activeMissing: false,
      kcal: 300,
      maintenance: false,
      flags: [],
    });
  });

  it('counts a day without active energy with K = 0 as complete', () => {
    const day = one({ food: 2000, resting: 1800 });
    expect(day.kcal).toBe(200);
    expect(day.active).toBe(0);
    expect(day.activeMissing).toBe(true);
    expect(isComplete(day)).toBe(true);
  });

  it('counts a day without food as B = 0 with the switch on', () => {
    const day = one({ resting: 1800, active: 800 });
    expect(day.kcal).toBe(0);
    expect(day.maintenance).toBe(true);
    expect(day.flags).toEqual(['noFood']);
  });

  it('counts a day without food as full deficit with the switch off', () => {
    const day = one({ resting: 1800, active: 800 }, OFF);
    expect(day.kcal).toBe(-2600);
    expect(day.maintenance).toBe(false);
    expect(day.flags).toEqual(['noFood']);
  });

  it('estimates missing resting energy and marks the day', () => {
    const day = one({ food: 2500, active: 500 });
    expect(day.restingSource).toBe('formula');
    expect(day.kcal).toBeCloseTo(2500 - 1796.5 - 500);
    expect(day.flags).toEqual(['restingEstimated']);
  });

  it('uses the weight of the day for the estimate', () => {
    const days = dayBalances(
      [
        { date: '2026-10-21' },
        { date: '2026-10-22', weightKg: 80.4 },
        { date: '2026-10-23' },
      ],
      { ...ON, weightBeforeKg: 81.4 },
    );
    expect(days.map((day) => day.resting)).toEqual([
      expect.closeTo(1786.5),
      expect.closeTo(1776.5),
      expect.closeTo(1776.5),
    ]);
  });

  it('flags low food below half of the burn', () => {
    // 1,299 of 2,600 = 49.96 %.
    expect(one({ food: 1299, resting: 1800, active: 800 }).flags).toEqual([
      'lowFood',
    ]);
    // Exactly 50 % is not low.
    expect(one({ food: 1300, resting: 1800, active: 800 }).flags).toEqual([]);
  });

  it('compares low food with the estimated resting energy', () => {
    const day = one({ food: 1000, active: 300 });
    expect(day.flags).toEqual(['restingEstimated', 'lowFood']);
    expect(isComplete(day)).toBe(false);
  });

  it('gives a day several flags', () => {
    const noProfile = { ...ON, profile: {} };
    expect(one({ active: 300 }, noProfile).flags).toEqual([
      'noFood',
      'noResting',
    ]);
    expect(one({ active: 300 }).flags).toEqual(['restingEstimated', 'noFood']);
  });

  it('has no low food flag without resting energy', () => {
    const day = one({ food: 100, active: 300 }, { ...ON, profile: {} });
    expect(day.flags).toEqual(['noResting']);
    expect(day.kcal).toBeUndefined();
  });

  it('counts a zero day without resting energy only with the switch on', () => {
    const noProfile = { zeroDaysAsMaintenance: true, profile: {} };
    expect(one({}, noProfile).kcal).toBe(0);
    expect(one({}, { ...noProfile, zeroDaysAsMaintenance: false }).kcal).toBe(
      undefined,
    );
  });

  it('keeps dates and lookups across the fall daylight saving change', () => {
    const profile = { ...PROFILE, dateOfBirth: new Date(1992, 9, 25) };
    const days = dayBalances(
      [
        { date: '2026-10-24', food: 2000 },
        { date: '2026-10-25', food: 2000 },
        { date: '2026-10-26', food: 2000 },
      ],
      { ...ON, profile },
    );
    expect(days.map((day) => day.date)).toEqual([
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ]);
    // 33 on the 24th, 34 from the 25-hour birthday on: 5 kcal less.
    expect((days[0].resting as number) - (days[1].resting as number)).toBe(5);
    expect(days[1].resting).toBe(days[2].resting);
  });
});
