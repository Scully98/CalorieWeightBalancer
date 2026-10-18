import { restingFallback } from '../resting-fallback';
import type { HealthProfile } from '@/health/scan';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
}));

const now = new Date(2026, 9, 15);
const noHealth: HealthProfile = { biologicalSex: 0 };

describe('restingFallback', () => {
  it('prefers Health values', () => {
    const health: HealthProfile = {
      weightKg: 82.4,
      heightCm: 182,
      dateOfBirth: new Date(1992, 0, 10),
      biologicalSex: 2,
    };
    expect(restingFallback(health, { weightKg: 60 }, now)).toBeCloseTo(1796.5);
  });

  it('fills gaps from the stored profile', () => {
    const stored = { weightKg: 82.4, heightCm: 182, ageYears: 34 };
    expect(
      restingFallback(noHealth, { ...stored, sex: 'male' }, now),
    ).toBeCloseTo(1796.5);
  });

  it('returns undefined when a value is missing', () => {
    expect(restingFallback(noHealth, { weightKg: 82.4 }, now)).toBeUndefined();
  });
});
