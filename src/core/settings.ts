import type { Period } from './period';

// What the user can set; stored in the App Group (src/storage).
export type Settings = {
  period: Period;
  // A day without food entry counts as B = 0 instead of a full deficit.
  zeroDaysAsMaintenance: boolean;
  includeToday: boolean;
  // Whole percent, 0 = off. Applied to period sums, not per day: food ± and
  // burn only downwards.
  tolerance: { foodPercent: number; burnPercent: number };
};

export const DEFAULT_SETTINGS: Settings = {
  period: { kind: 'days', days: 30 },
  zeroDaysAsMaintenance: true,
  includeToday: false,
  tolerance: { foodPercent: 0, burnPercent: 0 },
};

// Upper end of each tolerance slider; the usual ranges (food 5–20 %, burn
// 10–30 %) are only marked on it.
export const TOLERANCE_LIMITS: Settings['tolerance'] = {
  foodPercent: 20,
  burnPercent: 30,
};
