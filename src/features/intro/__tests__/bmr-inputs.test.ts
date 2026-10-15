import {
  resolveBmrInputs,
  toStoredProfile,
  type UserInput,
} from '../bmr-inputs';
import type { HealthScan } from '@/health/scan';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
}));

const now = new Date(2026, 9, 15);
const empty: UserInput = { weight: '', age: '', height: '' };
const fullHealth: HealthScan['profile'] = {
  weightKg: 82.4,
  heightCm: 182,
  dateOfBirth: new Date(1992, 0, 10),
  biologicalSex: 2,
};

describe('resolveBmrInputs', () => {
  it('uses Health values without editable fields and matches the wireframe', () => {
    const inputs = resolveBmrInputs(fullHealth, empty, now);
    expect(inputs.weight.source).toBe('health');
    expect(inputs.age).toEqual({ source: 'health', value: 34 });
    expect(inputs.height.source).toBe('health');
    expect(inputs.sex.source).toBe('health');
    expect(inputs.estimate).toBeCloseTo(1796.5);
  });

  it('makes only the missing height editable', () => {
    const profile = { ...fullHealth, heightCm: undefined };
    const missing = resolveBmrInputs(profile, empty, now);
    expect(missing.height).toEqual({
      source: 'input',
      value: undefined,
      showHint: false,
    });
    expect(missing.weight.source).toBe('health');
    expect(missing.estimate).toBeUndefined();

    const entered = resolveBmrInputs(profile, { ...empty, height: '182' }, now);
    expect(entered.estimate).toBeCloseTo(1796.5);
  });

  it('treats out-of-range or malformed input as missing with a hint', () => {
    const profile = { ...fullHealth, heightCm: undefined, weightKg: undefined };
    const inputs = resolveBmrInputs(
      profile,
      { ...empty, height: '1820', weight: '82,45' },
      now,
    );
    expect(inputs.height).toEqual({
      source: 'input',
      value: undefined,
      showHint: true,
    });
    expect(inputs.weight).toMatchObject({ value: undefined, showHint: true });
    expect(
      resolveBmrInputs(
        profile,
        { ...empty, height: '182', weight: '82,4' },
        now,
      ).weight,
    ).toMatchObject({ value: 82.4 });
  });

  it('uses -78 for sex "other" from Health and keeps it fixed', () => {
    const inputs = resolveBmrInputs(
      { ...fullHealth, biologicalSex: 3 },
      empty,
      now,
    );
    expect(inputs.sex).toEqual({
      source: 'health',
      value: 'unspecified',
      fromHealth: 'other',
    });
    expect(inputs.estimate).toBeCloseTo(1713.5);
  });

  it('asks for sex when Health has none and accepts "not specified"', () => {
    const profile = { ...fullHealth, biologicalSex: 0 };
    expect(resolveBmrInputs(profile, empty, now).estimate).toBeUndefined();
    expect(
      resolveBmrInputs(profile, { ...empty, sex: 'unspecified' }, now).estimate,
    ).toBeCloseTo(1713.5);
  });
});

describe('toStoredProfile', () => {
  it('stores only user-entered values with dates', () => {
    const inputs = resolveBmrInputs(
      { biologicalSex: 0 },
      { weight: '82,4', age: '34', height: '182', sex: 'male' },
      now,
    );
    expect(toStoredProfile(inputs, now)).toEqual({
      heightCm: 182,
      sex: 'male',
      weightKg: 82.4,
      weightRecordedOn: '2026-10-15',
      ageYears: 34,
      ageRecordedOn: '2026-10-15',
    });
  });

  it('stores nothing that came from Health', () => {
    const inputs = resolveBmrInputs(fullHealth, empty, now);
    expect(
      Object.values(toStoredProfile(inputs, now)).filter(
        (value) => value !== undefined,
      ),
    ).toEqual([]);
  });
});
