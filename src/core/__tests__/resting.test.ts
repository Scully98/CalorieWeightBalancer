import {
  ageOn,
  dayResting,
  isEstimatedResting,
  RUNNING_DAY_SYNC_LAG_HOURS,
  weightsByDay,
  type RestingProfile,
} from '../resting';

// Wireframe profile: 82.4 kg, 182 cm, 34 years, male → 1,796.5 kcal.
const PROFILE: RestingProfile = {
  heightCm: 182,
  sex: 'male',
  ageYears: 34,
  weightKg: 82.4,
};
const DAY = new Date(2026, 9, 23);

describe('dayResting', () => {
  it('keeps fully covered days as measured', () => {
    expect(dayResting({ resting: 1500 }, 80, PROFILE, DAY)).toEqual({
      kcal: 1500,
      source: 'measured',
    });
    expect(
      dayResting({ resting: 1600, restingCoverage: 20 / 24 }, 80, PROFILE, DAY),
    ).toEqual({ kcal: 1600, source: 'measured' });
  });

  it('scales partial days of six hours or more up to 24 hours', () => {
    expect(
      dayResting({ resting: 900, restingCoverage: 0.5 }, 80, PROFILE, DAY),
    ).toEqual({ kcal: 1800, source: 'scaled' });
    expect(
      dayResting({ resting: 450, restingCoverage: 6 / 24 }, 80, PROFILE, DAY),
    ).toEqual({ kcal: 1800, source: 'scaled' });
  });

  it('estimates below six hours instead of scaling up', () => {
    expect(
      dayResting({ resting: 100, restingCoverage: 5 / 24 }, 82.4, PROFILE, DAY),
    ).toEqual({ kcal: expect.closeTo(1796.5), source: 'formula' });
  });

  it('estimates days without resting energy with the weight of the day', () => {
    expect(dayResting({}, 82.4, PROFILE, DAY).kcal).toBeCloseTo(1796.5);
    // 10 kcal per kg.
    expect(dayResting({}, 80.4, PROFILE, DAY).kcal).toBeCloseTo(1776.5);
  });

  it('keeps an estimate supplied by the source', () => {
    expect(
      dayResting({ resting: 1750, restingEstimated: true }, 80, PROFILE, DAY),
    ).toEqual({ kcal: 1750, source: 'source' });
  });

  it('is missing when an input of the formula is missing', () => {
    expect(dayResting({}, undefined, PROFILE, DAY)).toEqual({
      source: 'missing',
    });
    for (const key of ['heightCm', 'sex', 'ageYears'] as const) {
      const profile = { ...PROFILE, [key]: undefined };
      expect(dayResting({}, 80, profile, DAY).source).toBe('missing');
    }
  });

  it('uses the mean sex constant when no sex is given', () => {
    const profile = { ...PROFILE, sex: 'unspecified' as const };
    // 1,796.5 − 5 − 78.
    expect(dayResting({}, 82.4, profile, DAY).kcal).toBeCloseTo(1713.5);
  });
});

describe('dayResting on the running day', () => {
  // 14:32: 14 full hours have passed.
  const RUNNING = { elapsedHours: 14 + 32 / 60, hoursInDay: 24 };

  it('keeps measured resting energy as it is, without scaling', () => {
    expect(
      dayResting(
        { resting: 1090, restingCoverage: 14 / 24 },
        82.4,
        PROFILE,
        DAY,
        RUNNING,
      ),
    ).toEqual({ kcal: 1090, source: 'partial', filledHours: 0 });
  });

  it('fills hours without any sample, but not the last ones', () => {
    // Watch on from 13:00: 2 hours measured, 14 − 2 − 2 = 10 filled.
    expect(RUNNING_DAY_SYNC_LAG_HOURS).toBe(2);
    const resting = dayResting(
      { resting: 150, restingCoverage: 2 / 24 },
      82.4,
      PROFILE,
      DAY,
      RUNNING,
    );
    expect(resting.source).toBe('partial');
    expect(resting.filledHours).toBe(10);
    expect(resting.kcal).toBeCloseTo(150 + (1796.5 / 24) * 10);
  });

  it('never fills low values or an unknown coverage', () => {
    expect(
      dayResting(
        { resting: 600, restingCoverage: 15 / 24 },
        82.4,
        PROFILE,
        DAY,
        RUNNING,
      ),
    ).toEqual({ kcal: 600, source: 'partial', filledHours: 0 });
    expect(dayResting({ resting: 150 }, 82.4, PROFILE, DAY, RUNNING)).toEqual({
      kcal: 150,
      source: 'partial',
      filledHours: 0,
    });
  });

  it('keeps measured values without inputs for the formula', () => {
    expect(
      dayResting(
        { resting: 150, restingCoverage: 2 / 24 },
        82.4,
        { ...PROFILE, heightCm: undefined },
        DAY,
        RUNNING,
      ),
    ).toEqual({ kcal: 150, source: 'partial', filledHours: 0 });
  });

  it('estimates the hours so far without measurement', () => {
    const resting = dayResting({}, 82.4, PROFILE, DAY, RUNNING);
    expect(resting.source).toBe('formula');
    expect(resting.kcal).toBeCloseTo((1796.5 * RUNNING.elapsedHours) / 24);
    expect(dayResting({}, undefined, PROFILE, DAY, RUNNING).source).toBe(
      'missing',
    );
  });

  it('keeps an estimate supplied by the source', () => {
    expect(
      dayResting(
        { resting: 900, restingEstimated: true },
        82.4,
        PROFILE,
        DAY,
        RUNNING,
      ),
    ).toEqual({ kcal: 900, source: 'source' });
  });
});

describe('ageOn', () => {
  it('uses the age on the day from the date of birth', () => {
    const profile = { ...PROFILE, dateOfBirth: new Date(1992, 9, 10) };
    expect(ageOn(profile, new Date(2026, 9, 9))).toBe(33);
    expect(ageOn(profile, new Date(2026, 9, 10))).toBe(34);
  });

  it('changes the estimate by 5 kcal from the birthday on', () => {
    const profile = { ...PROFILE, dateOfBirth: new Date(1992, 9, 10) };
    const before = dayResting({}, 82.4, profile, new Date(2026, 9, 9));
    const after = dayResting({}, 82.4, profile, new Date(2026, 9, 10));
    expect((before.kcal as number) - (after.kcal as number)).toBeCloseTo(5);
  });

  it('advances an entered age by the years since it was entered', () => {
    const profile = { ...PROFILE, ageRecordedOn: '2025-10-01' };
    expect(ageOn(profile, new Date(2026, 8, 30))).toBe(34);
    expect(ageOn(profile, new Date(2026, 9, 1))).toBe(35);
  });

  it('is undefined without date of birth or age', () => {
    expect(ageOn({}, DAY)).toBeUndefined();
  });
});

describe('weightsByDay', () => {
  it('takes the last measurement on or before the day', () => {
    expect(
      weightsByDay([{}, { weightKg: 81 }, {}, { weightKg: 80.5 }, {}], 82, 90),
    ).toEqual([82, 81, 81, 80.5, 80.5]);
  });

  it('takes the first later measurement when there is no earlier one', () => {
    expect(weightsByDay([{}, {}, { weightKg: 81 }, {}], undefined, 90)).toEqual(
      [81, 81, 81, 81],
    );
  });

  it('falls back to the profile weight without any measurement', () => {
    expect(weightsByDay([{}, {}], undefined, 90)).toEqual([90, 90]);
    expect(weightsByDay([{}], undefined, undefined)).toEqual([undefined]);
    expect(weightsByDay([], 80, 90)).toEqual([]);
  });
});

describe('isEstimatedResting', () => {
  it('marks formula and source estimates, not measured or scaled days', () => {
    expect(isEstimatedResting('formula')).toBe(true);
    expect(isEstimatedResting('source')).toBe(true);
    expect(isEstimatedResting('measured')).toBe(false);
    expect(isEstimatedResting('scaled')).toBe(false);
    expect(isEstimatedResting('partial')).toBe(false);
    expect(isEstimatedResting('missing')).toBe(false);
  });
});
