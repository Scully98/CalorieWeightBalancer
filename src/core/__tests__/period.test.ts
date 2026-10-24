import { fromDateKey, toDateKey } from '../day-record';
import { resolvePeriod, type Period } from '../period';

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
