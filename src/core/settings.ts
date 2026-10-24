import type { Period } from './period';

// What the user can set on the balance screen. Stored in the App Group later
// (step 6); for now only the shape and the defaults.
export type Settings = {
  period: Period;
  // A day without food entry counts as B = 0 instead of a full deficit.
  zeroDaysAsMaintenance: boolean;
  includeToday: boolean;
  // In percent, 0 = off. Applied to period sums, not per day: food ± and
  // burn only downwards.
  tolerance: { foodPercent: number; burnPercent: number };
};

export const DEFAULT_SETTINGS: Settings = {
  period: { kind: 'days', days: 30 },
  zeroDaysAsMaintenance: true,
  includeToday: false,
  tolerance: { foodPercent: 0, burnPercent: 0 },
};
