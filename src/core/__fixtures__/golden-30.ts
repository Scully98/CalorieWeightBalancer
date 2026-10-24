import { toDateKey, type DayRecord } from '../day-record';

// Golden test case (CLAUDE.md): 30 days in which the numbers of the design
// prompt fit together. Σ food 87,000 (2,900 a day), Σ burn 80,000: resting
// 1,800 a day (54,000) and active 867 on the first 20 days, 866 on the last
// 10 (26,000). First test of P2 (balance) and P3 (analysis).
export const GOLDEN_DAYS: DayRecord[] = Array.from({ length: 30 }, (_, i) => ({
  date: toDateKey(new Date(2026, 8, 24 + i)),
  food: 2900,
  resting: 1800,
  active: i < 20 ? 867 : 866,
}));

export const GOLDEN_TOLERANCE = { foodPercent: 5, burnPercent: 10 };

// Measured change over the 30 days, for the analysis in P3.
export const GOLDEN_DELTA = { fatKg: 0.4, leanKg: 0.3 };

// Days before the period, so the trend on the first day has a full window.
export const GOLDEN_LEAD_IN = 7;

// Fat and lean mass on day i (lead-in negative): constant up to day 6 and
// from day 23, linear in between, so the 7-day trends at start and end differ
// by exactly GOLDEN_DELTA.
function composition(i: number): { fatKg: number; leanKg: number } {
  const share = Math.min(1, Math.max(0, (i - 6) / 17));
  return {
    fatKg: 17.6 + GOLDEN_DELTA.fatKg * share,
    leanKg: 64.1 + GOLDEN_DELTA.leanKg * share,
  };
}

// Lead-in and period with a weighing (weight and body fat) every other day.
export const GOLDEN_BODY_DAYS: DayRecord[] = Array.from(
  { length: GOLDEN_LEAD_IN + 30 },
  (_, index) => {
    const i = index - GOLDEN_LEAD_IN;
    const date = toDateKey(new Date(2026, 8, 24 + i));
    const energy = i >= 0 ? GOLDEN_DAYS[i] : { date };
    if (i % 2 !== 0) return energy;
    const { fatKg, leanKg } = composition(i);
    const weightKg = fatKg + leanKg;
    return { ...energy, weightKg, bodyFatFraction: fatKg / weightKg };
  },
);

export const GOLDEN_EXPECTED = {
  foodKcal: 87000,
  burnKcal: 80000,
  kcal: 7000,
  avgKcal: 7000 / 30,
  fatKg: 7000 / 7700,
  range: { min: 2650, max: 19350 },
  formatted: {
    kcal: '+7.000',
    avgKcal: '+233',
    fatKg: '+0,9',
    range: { min: '+2.650', max: '+19.350' },
    fatRange: { min: '+0,3', max: '+2,5' },
  },
  // Analysis (P3): 9,400 × 0.4 + 1,800 × 0.3; (87,000 − 4,300) ÷ 30;
  // tracker 80,000 ÷ 30 rounded to 10, difference +90.
  analysis: {
    storedKcal: 4300,
    actualBurnRaw: (87000 - 4300) / 30,
    trackerBurnRaw: 80000 / 30,
    formatted: {
      storedKcal: '+4.300',
      actualBurnPerDay: '2.760',
      trackerBurnPerDay: '2.670',
      differencePerDay: '+90',
    },
    actualBurnPerDay: 2760,
    trackerBurnPerDay: 2670,
    differencePerDay: 90,
  },
};
