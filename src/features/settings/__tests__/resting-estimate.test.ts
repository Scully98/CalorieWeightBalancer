import { todayRestingEstimate } from '../resting-estimate';

jest.mock('@kingstinct/react-native-healthkit', () => ({
  BiologicalSex: { notSet: 0, female: 1, male: 2, other: 3 },
}));

const NOW = new Date(2026, 9, 24);
const notSet = { biologicalSex: 0 };

describe('todayRestingEstimate', () => {
  it('uses Health values before the entered ones', () => {
    const estimate = todayRestingEstimate(
      { biologicalSex: 2, heightCm: 182, weightKg: 82.4 },
      { heightCm: 170, ageYears: 34, ageRecordedOn: '2026-10-24' },
      NOW,
    );
    // 10 × 82.4 + 6.25 × 182 − 5 × 34 + 5.
    expect(estimate).toBeCloseTo(1796.5);
  });

  it('ages the entered age with time', () => {
    const estimate = todayRestingEstimate(
      notSet,
      {
        heightCm: 170,
        weightKg: 70,
        sex: 'female',
        ageYears: 34,
        ageRecordedOn: '2024-10-01',
      },
      NOW,
    );
    // Age 36: 700 + 1,062.5 − 180 − 161.
    expect(estimate).toBeCloseTo(1421.5);
  });

  it('is undefined while a value is missing', () => {
    expect(
      todayRestingEstimate(notSet, { heightCm: 170, weightKg: 70 }, NOW),
    ).toBeUndefined();
  });
});
