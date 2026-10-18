// Energy of one calendar day in kcal; undefined when Health has no entry.
export type DayEnergy = {
  food?: number;
  resting?: number;
  active?: number;
};

// kcal per kg of adipose tissue.
export const KCAL_PER_KG_FAT = 7700;

export type PeriodBalance = {
  // Plus = ate more than burned.
  kcal: number;
  // Days counted as maintenance (B = 0) because no food was logged.
  daysWithoutFood: number;
  days: number;
};

// Sums B = A − (R + K) per day. A day without a food entry counts as B = 0
// instead of a full deficit; missing resting energy uses the fallback.
export function periodBalance(
  days: readonly DayEnergy[],
  restingFallback = 0,
): PeriodBalance {
  let kcal = 0;
  let daysWithoutFood = 0;
  for (const day of days) {
    if (day.food === undefined) {
      daysWithoutFood += 1;
      continue;
    }
    kcal += day.food - ((day.resting ?? restingFallback) + (day.active ?? 0));
  }
  return { kcal, daysWithoutFood, days: days.length };
}

// Theoretical change in body fat in kg for a balance in kcal.
export function fatKgFromKcal(kcal: number): number {
  return kcal / KCAL_PER_KG_FAT;
}
