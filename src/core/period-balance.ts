import { DAY_FLAGS, type DayBalance, type DayFlag } from './day-balance';
import type { Settings } from './settings';

// kcal per kg of adipose tissue.
export const KCAL_PER_KG_FAT = 7700;

export type KcalRange = { min: number; max: number };

export type PeriodBalance = {
  // Calendar days of the period.
  days: number;
  // Days in the balance, zero days included.
  countedDays: number;
  // Of those, days without food counted as maintenance (B = 0).
  maintenanceDays: number;
  // Days left out: no resting energy and no zero day.
  excludedDays: number;
  // Days without any flag („24 von 30 vollständig“).
  completeDays: number;
  // Days per flag; a day with two flags counts in both.
  flagCounts: Record<DayFlag, number>;
  // Sums over counted days except zero days; kcal = food − resting − active.
  foodKcal: number;
  restingKcal: number;
  activeKcal: number;
  // Of those days: resting by formula or source estimate, scaled, without
  // active energy.
  restingEstimatedDays: number;
  restingScaledDays: number;
  daysWithoutActive: number;
  // Plus = ate more than burned.
  kcal: number;
  avgKcal: number;
  // Theoretical, 7,700 kcal per kg of adipose tissue.
  fatKg: number;
  // min = max = kcal at 0 % tolerance.
  range: KcalRange;
  avgRange: KcalRange;
  fatRange: KcalRange;
};

// Theoretical change in body fat in kg for a balance in kcal.
export function fatKgFromKcal(kcal: number): number {
  return kcal / KCAL_PER_KG_FAT;
}

function divide(range: KcalRange, by: number): KcalRange {
  return { min: range.min / by, max: range.max / by };
}

// Sums the days of a period. The tolerance applies to the period sums, not
// per day: food ± tA, burn only downwards by tV. Zero days add B = 0 and stay
// out of the sums, so the tolerance only widens real entries.
export function periodBalance(
  days: readonly DayBalance[],
  tolerance: Settings['tolerance'],
): PeriodBalance {
  const flagCounts = Object.fromEntries(
    DAY_FLAGS.map((flag) => [flag, 0]),
  ) as Record<DayFlag, number>;
  let completeDays = 0;
  let countedDays = 0;
  let maintenanceDays = 0;
  let foodKcal = 0;
  let restingKcal = 0;
  let activeKcal = 0;
  let restingEstimatedDays = 0;
  let restingScaledDays = 0;
  let daysWithoutActive = 0;

  for (const day of days) {
    for (const flag of day.flags) flagCounts[flag] += 1;
    if (day.flags.length === 0) completeDays += 1;
    if (day.kcal === undefined) continue;
    countedDays += 1;
    if (day.maintenance) {
      maintenanceDays += 1;
      continue;
    }
    foodKcal += day.food ?? 0;
    restingKcal += day.resting as number;
    activeKcal += day.active;
    if (day.flags.includes('restingEstimated')) restingEstimatedDays += 1;
    if (day.restingSource === 'scaled') restingScaledDays += 1;
    if (day.activeMissing) daysWithoutActive += 1;
  }

  const burn = restingKcal + activeKcal;
  const kcal = foodKcal - burn;
  const tA = tolerance.foodPercent / 100;
  const tV = tolerance.burnPercent / 100;
  const range =
    tA === 0 && tV === 0
      ? { min: kcal, max: kcal }
      : {
          min: foodKcal * (1 - tA) - burn,
          max: foodKcal * (1 + tA) - burn * (1 - tV),
        };
  const perDay = countedDays || 1;

  return {
    days: days.length,
    countedDays,
    maintenanceDays,
    excludedDays: days.length - countedDays,
    completeDays,
    flagCounts,
    foodKcal,
    restingKcal,
    activeKcal,
    restingEstimatedDays,
    restingScaledDays,
    daysWithoutActive,
    kcal,
    avgKcal: kcal / perDay,
    fatKg: fatKgFromKcal(kcal),
    range,
    avgRange: divide(range, perDay),
    fatRange: divide(range, KCAL_PER_KG_FAT),
  };
}
