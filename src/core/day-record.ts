// One local calendar day of Health data. Every value is optional because any
// of them can be missing or unreadable (iOS hides denied read access).
export type DayRecord = {
  // Local calendar day, YYYY-MM-DD.
  date: string;
  // kcal.
  food?: number;
  // kcal.
  resting?: number;
  // The source supplies an estimate instead of a measurement (e.g. the demo's
  // formula value). HealthKit only has measurements and never sets it.
  restingEstimated?: boolean;
  // Share of the day's hours with resting energy, 0–1. A watch only measures
  // while worn, so a low share means `resting` covers part of the day.
  restingCoverage?: number;
  // kcal.
  active?: number;
  // Last value of the day.
  weightKg?: number;
  // 0–1, like HealthKit's "%" unit; shown as percent only in the UI.
  bodyFatFraction?: number;
  // Last value of the day.
  leanMassKg?: number;
};

// The part of a day the energy balance needs.
export type DayEnergy = Pick<
  DayRecord,
  'food' | 'resting' | 'restingEstimated' | 'restingCoverage' | 'active'
>;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// Local calendar day of `date` as YYYY-MM-DD.
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Local midnight of a YYYY-MM-DD key; undefined for anything else.
export function fromDateKey(key: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return toDateKey(date) === key ? date : undefined;
}
