import { createRandom } from './random';

// Port of gen() in .claude/design/homepage/…/BilanzScreen.dc.html. Keep the
// order of random calls: any change shifts every number after it.

export const SERIES_DAYS = 120;
// Last 30 days of the series, where the design fixes the totals.
const WINDOW = 30;
const WINDOW_BURN = 80100;
const WINDOW_BALANCE = 7000;
// Resting energy from the formula on estimated days.
const ESTIMATED_RESTING = 1750;

export type DemoDay = {
  // Position in the series; SERIES_DAYS − 1 is yesterday.
  index: number;
  estimated: boolean;
  lowFood: boolean;
  noFood: boolean;
  resting: number;
  active: number;
  // Food in kcal; 0 on days without food.
  food: number;
  balance: number;
  measured: boolean;
  weightKg?: number;
  fatKg?: number;
};

export type SeriesOptions = {
  // Change of fat and lean mass over 30 days in kg.
  fatPer30Days?: number;
  leanPer30Days?: number;
};

// Day of week (0 = Sunday) as in the design, where yesterday is Friday
// 23 Oct 2026. Tied to the index, so the numbers don't change with the date.
function designWeekday(index: number): number {
  return (((6 - (SERIES_DAYS - index)) % 7) + 7) % 7;
}

export function generateSeries({
  fatPer30Days = 0.4,
  leanPer30Days = 0.3,
}: SeriesOptions = {}): DemoDay[] {
  const { next, gauss } = createRandom(42);
  const firstOfWindow = SERIES_DAYS - WINDOW;

  const days: DemoDay[] = [];
  for (let index = 0; index < SERIES_DAYS; index++) {
    const w = index - firstOfWindow;
    let estimated: boolean;
    let lowFood: boolean;
    let noFood: boolean;
    if (w >= 0) {
      estimated = [4, 11, 19].includes(w);
      lowFood = [8, 24].includes(w);
      noFood = w === 15;
    } else {
      const x = next();
      estimated = x < 0.06;
      lowFood = x >= 0.06 && x < 0.085;
      noFood = x >= 0.085 && x < 0.1;
    }
    const resting = estimated
      ? ESTIMATED_RESTING
      : Math.round(1795 + gauss() * 22);
    const active = Math.round(
      Math.min(1500, Math.max(240, 880 + gauss() * 280)),
    );
    const weekday = designWeekday(index);
    const weekend = weekday === 6 || weekday === 5;
    const balance = Math.round(
      (w >= 0 ? 200 : 90) + gauss() * 460 + (weekend ? 520 : -140),
    );
    days.push({
      index,
      estimated,
      lowFood,
      noFood,
      resting,
      active,
      food: 0,
      balance,
      measured: false,
    });
  }

  // Scale active energy so the window burns exactly WINDOW_BURN.
  const window = days.slice(firstOfWindow);
  const restingSum = window.reduce((sum, day) => sum + day.resting, 0);
  const activeSum = window.reduce((sum, day) => sum + day.active, 0);
  const factor = (WINDOW_BURN - restingSum) / activeSum;
  window.forEach((day) => (day.active = Math.round(day.active * factor)));
  window[0].active +=
    WINDOW_BURN -
    window.reduce((sum, day) => sum + day.resting + day.active, 0);

  for (const day of days) {
    const burn = day.resting + day.active;
    if (day.lowFood) {
      day.food = Math.round(burn * 0.4);
      day.balance = day.food - burn;
    }
    if (day.noFood) {
      day.food = 0;
      day.balance = 0;
    }
  }

  // Shift normal days so the window adds up to exactly WINDOW_BALANCE.
  const normal = window.filter((day) => !day.lowFood && !day.noFood);
  const windowBalance = () => window.reduce((sum, day) => sum + day.balance, 0);
  const delta = WINDOW_BALANCE - windowBalance();
  normal.forEach((day) => (day.balance += Math.round(delta / normal.length)));
  normal[normal.length - 1].balance += WINDOW_BALANCE - windowBalance();

  for (const day of days) {
    if (!day.lowFood && !day.noFood)
      day.food = day.resting + day.active + day.balance;
  }

  // Scale measurements: fat and lean trends with noise, every second day in
  // the last week, otherwise on about half the days.
  const fatSlope = fatPer30Days / 30;
  const leanSlope = leanPer30Days / 30;
  let noise = 0;
  days.forEach((day, index) => {
    const fatTrend = 17.6 + fatSlope * (index - firstOfWindow);
    const leanTrend = 64.1 + leanSlope * (index - firstOfWindow);
    noise = noise * 0.6 + gauss() * 0.22;
    day.measured =
      index >= SERIES_DAYS - 7
        ? (index - (SERIES_DAYS - 7)) % 2 === 0
        : next() < 0.47;
    if (day.measured) {
      day.weightKg = fatTrend + leanTrend + noise + gauss() * 0.12;
      day.fatKg = fatTrend + gauss() * 0.2;
    }
  });

  return days;
}
