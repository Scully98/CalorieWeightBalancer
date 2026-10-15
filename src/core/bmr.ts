export type Sex = 'male' | 'female' | 'unspecified';

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
