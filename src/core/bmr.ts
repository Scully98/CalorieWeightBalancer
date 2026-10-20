export type Sex = 'male' | 'female' | 'unspecified';

// Plausible input range for each value the user can enter.
export type NumberKey = 'weight' | 'age' | 'height';

export const LIMITS: Record<
  NumberKey,
  { min: number; max: number; decimals: 0 | 1 }
> = {
  weight: { min: 30, max: 300, decimals: 1 },
  age: { min: 15, max: 100, decimals: 0 },
  height: { min: 100, max: 250, decimals: 0 },
};

// Mifflin-St Jeor sex constant; "unspecified" uses the mean of both.
export const SEX_CONSTANT: Record<Sex, number> = {
  male: 5,
  female: -161,
  unspecified: -78,
};

export type RestingEnergyInput = {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: Sex;
};

// Resting energy in kcal per day after Mifflin-St Jeor, unrounded.
export function estimateRestingEnergy({
  weightKg,
  heightCm,
  ageYears,
  sex,
}: RestingEnergyInput): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + SEX_CONSTANT[sex];
}
