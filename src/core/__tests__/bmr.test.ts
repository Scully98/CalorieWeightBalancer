import { estimateRestingEnergy } from '../bmr';

const wireframe = { weightKg: 82.4, heightCm: 182, ageYears: 34 };

describe('estimateRestingEnergy', () => {
  it('matches the wireframe example for male', () => {
    expect(estimateRestingEnergy({ ...wireframe, sex: 'male' })).toBeCloseTo(
      1796.5,
    );
  });

  it('uses -161 for female', () => {
    expect(
      estimateRestingEnergy({ ...wireframe, sex: 'female' }),
    ).toBeCloseTo(1630.5);
  });

  it('uses the mean -78 when no sex is given', () => {
    expect(
      estimateRestingEnergy({ ...wireframe, sex: 'unspecified' }),
    ).toBeCloseTo(1713.5);
  });
});
