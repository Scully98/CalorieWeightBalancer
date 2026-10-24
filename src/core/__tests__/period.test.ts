import { isoWeek } from '../dates';
import { fromDateKey, toDateKey } from '../day-record';
import { periodDateKeys, resolvePeriod, type Period } from '../period';

// Saturday afternoon; yesterday is Friday 23 Oct.
const TODAY = new Date(2026, 9, 24, 14, 32);

function keys(period: Period, options?: Parameters<typeof resolvePeriod>[2]) {
  const { start, days } = resolvePeriod(period, TODAY, options);
  const last = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + days - 1,
  );
  return { first: toDateKey(start), last: toDateKey(last), days };
}

describe('resolvePeriod', () => {
  it('ends with yesterday by default', () => {
    expect(keys({ kind: 'days', days: 30 })).toEqual({
      first: '2026-09-24',
      last: '2026-10-23',
      days: 30,
    });
  });

  it('ends with today when today is included', () => {
    expect(keys({ kind: 'days', days: 7 }, { includeToday: true })).toEqual({
      first: '2026-10-18',
      last: '2026-10-24',
      days: 7,
    });
  });

  it('starts "all" at the first day with data', () => {
    expect(
      keys({ kind: 'all' }, { firstDataDate: new Date(2026, 6, 1, 9) }),
    ).toEqual({ first: '2026-07-01', last: '2026-10-23', days: 115 });
  });

  it('has no days for "all" without data or with data only today', () => {
    expect(resolvePeriod({ kind: 'all' }, TODAY).days).toBe(0);
    expect(
      resolvePeriod({ kind: 'all' }, TODAY, { firstDataDate: TODAY }).days,
    ).toBe(0);
  });

  it('includes both ends of a custom period', () => {
    expect(
      keys({ kind: 'custom', from: '2026-10-06', to: '2026-10-20' }),
    ).toEqual({ first: '2026-10-06', last: '2026-10-20', days: 15 });
  });

  it('clamps a custom period to yesterday, or today when included', () => {
    const period: Period = {
      kind: 'custom',
      from: '2026-10-20',
      to: '2026-10-30',
    };
    expect(keys(period).last).toBe('2026-10-23');
    expect(keys(period, { includeToday: true }).last).toBe('2026-10-24');
  });

  it('swaps a custom period given backwards', () => {
    expect(
      keys({ kind: 'custom', from: '2026-10-20', to: '2026-10-06' }),
    ).toEqual({ first: '2026-10-06', last: '2026-10-20', days: 15 });
  });

  it('has no days for an invalid or future custom period', () => {
    expect(
      resolvePeriod({ kind: 'custom', from: 'x', to: '2026-10-20' }, TODAY)
        .days,
    ).toBe(0);
    expect(
      resolvePeriod(
        { kind: 'custom', from: '2026-11-01', to: '2026-11-05' },
        TODAY,
      ).days,
    ).toBe(0);
  });

  it('counts calendar days across a daylight saving change', () => {
    // Clocks go back on 25 Oct 2026 in Europe; the day has 25 hours.
    const today = new Date(2026, 9, 27, 12);
    const { start, days } = resolvePeriod({ kind: 'days', days: 7 }, today);
    expect(toDateKey(start)).toBe('2026-10-20');
    expect(days).toBe(7);
    expect(
      resolvePeriod(
        { kind: 'custom', from: '2026-10-24', to: '2026-10-26' },
        today,
      ).days,
    ).toBe(3);
  });

  it('keeps every day once across the fall daylight saving change', () => {
    const today = new Date(2026, 9, 27, 12);
    const dates = periodDateKeys(
      resolvePeriod({ kind: 'days', days: 7 }, today),
    );
    expect(dates).toEqual([
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ]);
  });

  it('keeps every day once across the spring daylight saving change', () => {
    // Clocks go forward on 29 Mar 2026 in Europe; the day has 23 hours.
    const today = new Date(2026, 2, 31, 12);
    const resolved = resolvePeriod({ kind: 'days', days: 7 }, today);
    expect(resolved.days).toBe(7);
    expect(periodDateKeys(resolved)).toEqual([
      '2026-03-24',
      '2026-03-25',
      '2026-03-26',
      '2026-03-27',
      '2026-03-28',
      '2026-03-29',
      '2026-03-30',
    ]);
    expect(
      resolvePeriod(
        { kind: 'custom', from: '2026-03-28', to: '2026-03-30' },
        today,
      ).days,
    ).toBe(3);
  });

  it('runs across a month boundary without gaps', () => {
    const dates = periodDateKeys(
      resolvePeriod({ kind: 'days', days: 30 }, TODAY),
    );
    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe('2026-09-24');
    expect(dates.slice(6, 8)).toEqual(['2026-09-30', '2026-10-01']);
    expect(dates[29]).toBe('2026-10-23');
    expect(
      keys({ kind: 'custom', from: '2026-09-28', to: '2026-10-03' }),
    ).toEqual({ first: '2026-09-28', last: '2026-10-03', days: 6 });
  });

  it('runs across a year boundary', () => {
    const dates = periodDateKeys(
      resolvePeriod({ kind: 'days', days: 7 }, new Date(2027, 0, 3, 9)),
    );
    expect(dates[0]).toBe('2026-12-27');
    expect(dates[6]).toBe('2027-01-02');
  });

  it.each([7, 30, 60, 90] as const)(
    'ends %i days with yesterday or today',
    (days) => {
      const off = keys({ kind: 'days', days });
      const on = keys({ kind: 'days', days }, { includeToday: true });
      expect(off.last).toBe('2026-10-23');
      expect(on.last).toBe('2026-10-24');
      expect(off.days).toBe(days);
      expect(on.days).toBe(days);
    },
  );

  it('ends "all" with yesterday or today', () => {
    const firstDataDate = new Date(2026, 9, 20, 8);
    expect(keys({ kind: 'all' }, { firstDataDate })).toEqual({
      first: '2026-10-20',
      last: '2026-10-23',
      days: 4,
    });
    expect(
      keys({ kind: 'all' }, { firstDataDate, includeToday: true }),
    ).toEqual({ first: '2026-10-20', last: '2026-10-24', days: 5 });
    // Data only today: nothing without today, one day with it.
    expect(
      resolvePeriod({ kind: 'all' }, TODAY, {
        firstDataDate: TODAY,
        includeToday: true,
      }).days,
    ).toBe(1);
  });

  it('ignores the time of day', () => {
    const early = resolvePeriod(
      { kind: 'days', days: 30 },
      new Date(2026, 9, 24, 0, 0, 30),
    );
    const late = resolvePeriod(
      { kind: 'days', days: 30 },
      new Date(2026, 9, 24, 23, 59, 30),
    );
    expect(early).toEqual(late);
  });
});

describe('periodDateKeys', () => {
  it('has no keys for an empty period', () => {
    expect(periodDateKeys(resolvePeriod({ kind: 'all' }, TODAY))).toEqual([]);
  });
});

describe('date keys', () => {
  it('round-trips local calendar days', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(fromDateKey('2026-01-05')).toEqual(new Date(2026, 0, 5));
  });

  it('rejects invalid keys', () => {
    expect(fromDateKey('2026-02-30')).toBeUndefined();
    expect(fromDateKey('5.1.2026')).toBeUndefined();
  });
});

describe('isoWeek', () => {
  it('numbers weeks from Monday with the first Thursday in week 1', () => {
    // Fri 23 Oct 2026 and Sun 25 Oct (25 hours) are in week 43.
    expect(isoWeek(new Date(2026, 9, 23))).toEqual({ year: 2026, week: 43 });
    expect(isoWeek(new Date(2026, 9, 25, 23))).toEqual({
      year: 2026,
      week: 43,
    });
    expect(isoWeek(new Date(2026, 9, 26))).toEqual({ year: 2026, week: 44 });
  });

  it('assigns days around new year to the week of their Thursday', () => {
    expect(isoWeek(new Date(2026, 11, 31))).toEqual({ year: 2026, week: 53 });
    expect(isoWeek(new Date(2027, 0, 3))).toEqual({ year: 2026, week: 53 });
    expect(isoWeek(new Date(2027, 0, 4))).toEqual({ year: 2027, week: 1 });
    expect(isoWeek(new Date(2025, 11, 29))).toEqual({ year: 2026, week: 1 });
  });
});
