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

// Below 6 of 24 hours a day is not scaled up: a sync app writing the daily
// total as one short sample would otherwise multiply it by up to 24.
export const MIN_SCALED_COVERAGE = 6 / 24;

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

export type PeriodBreakdown = PeriodBalance & {
  // Sums over the days that count, so kcal = food − resting − active.
  foodKcal: number;
  restingKcal: number;
  activeKcal: number;
  countedDays: number;
  // Counted days by origin of their resting energy, see dayRestingKind.
  restingScaledDays: number;
  restingFallbackDays: number;
  // Counted days without active energy; they count it as 0.
  daysWithoutActive: number;
};

export type RestingKind = 'measured' | 'scaled' | 'fallback' | 'missing';

function isFullDay(day: DayEnergy): boolean {
  return (day.restingCoverage ?? 1) >= FULL_DAY_COVERAGE;
}

// Where a day's resting energy comes from: full days as measured, partial
// days scaled up to 24 hours, days with too little data from the fallback.
export function dayRestingKind(
  day: DayEnergy,
  fallback: number | undefined,
): RestingKind {
  if (
    day.resting === undefined ||
    (day.restingCoverage ?? 1) < MIN_SCALED_COVERAGE
  )
    return fallback === undefined ? 'missing' : 'fallback';
  return isFullDay(day) ? 'measured' : 'scaled';
}

// Resting energy for a whole day, see dayRestingKind.
export function dayResting(
  day: DayEnergy,
  fallback: number | undefined,
): number | undefined {
  switch (dayRestingKind(day, fallback)) {
    case 'measured':
      return day.resting;
    case 'scaled':
      return (day.resting as number) / (day.restingCoverage ?? 1);
    case 'fallback':
      return fallback;
    case 'missing':
      return undefined;
  }
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

// Sums B = A − (R + K) per day, split into its parts. A day without a food
// entry counts as B = 0 instead of a full deficit; see dayResting for missing
// resting energy.
export function periodBreakdown(
  days: readonly DayEnergy[],
  restingFallback?: number,
): PeriodBreakdown {
  const result = {
    foodKcal: 0,
    restingKcal: 0,
    activeKcal: 0,
    countedDays: 0,
    restingScaledDays: 0,
    restingFallbackDays: 0,
    daysWithoutActive: 0,
    daysWithoutFood: 0,
    daysWithoutResting: 0,
  };
  for (const day of days) {
    if (day.food === undefined) {
      result.daysWithoutFood += 1;
      continue;
    }
    const kind = dayRestingKind(day, restingFallback);
    if (kind === 'missing') {
      result.daysWithoutResting += 1;
      continue;
    }
    if (kind === 'scaled') result.restingScaledDays += 1;
    if (kind === 'fallback') result.restingFallbackDays += 1;
    if (day.active === undefined) result.daysWithoutActive += 1;
    result.countedDays += 1;
    result.foodKcal += day.food;
    result.restingKcal += dayResting(day, restingFallback) as number;
    result.activeKcal += day.active ?? 0;
  }
  return {
    ...result,
    kcal: result.foodKcal - result.restingKcal - result.activeKcal,
    days: days.length,
  };
}

export function periodBalance(
  days: readonly DayEnergy[],
  restingFallback?: number,
): PeriodBalance {
  const { kcal, daysWithoutFood, daysWithoutResting } = periodBreakdown(
    days,
    restingFallback,
  );
  return { kcal, daysWithoutFood, daysWithoutResting, days: days.length };
}

// Theoretical change in body fat in kg for a balance in kcal.
export function fatKgFromKcal(kcal: number): number {
  return kcal / KCAL_PER_KG_FAT;
}
