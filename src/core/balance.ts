// Energy of one calendar day in kcal; undefined when Health has no entry.
export type DayEnergy = {
  food?: number;
  resting?: number;
  active?: number;
  // Share of the day's hours with resting energy, 0–1. A watch only measures
  // while worn, so a low share means `resting` covers part of the day.
  restingCoverage?: number;
};

// kcal per kg of adipose tissue.
export const KCAL_PER_KG_FAT = 7700;

// 20 of 24 hours: short charging breaks still count as a full day.
export const FULL_DAY_COVERAGE = 20 / 24;

// Full days needed before their median replaces the estimate.
export const MIN_TYPICAL_DAYS = 7;

export type PeriodBalance = {
  // Plus = ate more than burned.
  kcal: number;
  // Days counted as maintenance (B = 0) because no food was logged.
  daysWithoutFood: number;
  // Days left out because neither Health nor a fallback had resting energy.
  daysWithoutResting: number;
  days: number;
};

function isFullDay(day: DayEnergy): boolean {
  return (day.restingCoverage ?? 1) >= FULL_DAY_COVERAGE;
}

// Measured resting energy for a whole day: full days as measured, partial
// days scaled up to 24 hours, days without data from the fallback.
export function dayResting(
  day: DayEnergy,
  fallback: number | undefined,
): number | undefined {
  if (day.resting === undefined || day.restingCoverage === 0) return fallback;
  if (isFullDay(day)) return day.resting;
  return day.resting / (day.restingCoverage ?? 1);
}

// Median resting energy of fully covered days; undefined below
// MIN_TYPICAL_DAYS days.
export function typicalResting(days: readonly DayEnergy[]): number | undefined {
  const values = days
    .filter((day) => day.resting !== undefined && isFullDay(day))
    .map((day) => day.resting as number)
    .sort((a, b) => a - b);
  if (values.length < MIN_TYPICAL_DAYS) return undefined;
  const middle = Math.floor(values.length / 2);
  return values.length % 2
    ? values[middle]
    : (values[middle - 1] + values[middle]) / 2;
}

// Sums B = A − (R + K) per day. A day without a food entry counts as B = 0
// instead of a full deficit; see dayResting for missing resting energy.
export function periodBalance(
  days: readonly DayEnergy[],
  restingFallback?: number,
): PeriodBalance {
  let kcal = 0;
  let daysWithoutFood = 0;
  let daysWithoutResting = 0;
  for (const day of days) {
    if (day.food === undefined) {
      daysWithoutFood += 1;
      continue;
    }
    const resting = dayResting(day, restingFallback);
    if (resting === undefined) {
      daysWithoutResting += 1;
      continue;
    }
    kcal += day.food - (resting + (day.active ?? 0));
  }
  return { kcal, daysWithoutFood, daysWithoutResting, days: days.length };
}

// Theoretical change in body fat in kg for a balance in kcal.
export function fatKgFromKcal(kcal: number): number {
  return kcal / KCAL_PER_KG_FAT;
}
