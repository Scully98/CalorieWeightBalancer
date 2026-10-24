import { fromDateKey, type DayRecord } from './day-record';
import {
  dayResting,
  isEstimatedResting,
  weightsByDay,
  type RestingProfile,
  type RestingSource,
} from './resting';

// Data quality of a day, in the order the app lists them. A day can have
// several; a day without any is complete.
export type DayFlag = 'restingEstimated' | 'noFood' | 'lowFood' | 'noResting';

export const DAY_FLAGS: readonly DayFlag[] = [
  'restingEstimated',
  'noFood',
  'lowFood',
  'noResting',
];

// Food below this share of the day's burn is probably not fully tracked.
export const LOW_FOOD_SHARE = 0.5;

export type DayBalance = {
  // Local calendar day, YYYY-MM-DD.
  date: string;
  food?: number;
  // Whole-day resting energy, measured, scaled or estimated.
  resting?: number;
  restingSource: RestingSource;
  // 0 when Health has no active energy.
  active: number;
  activeMissing: boolean;
  // B = A − (R + K); 0 for a zero day; undefined when the day doesn't count.
  kcal?: number;
  // No food, counted as maintenance (B = 0).
  maintenance: boolean;
  flags: DayFlag[];
};

export type DayBalanceOptions = {
  // A day without food entry counts as B = 0 instead of a full deficit.
  zeroDaysAsMaintenance: boolean;
  profile: RestingProfile;
  // Last weight before the first record, from HealthSource.weightBefore.
  weightBeforeKg?: number;
};

function dayFlags(
  food: number | undefined,
  resting: number | undefined,
  source: RestingSource,
  active: number,
): DayFlag[] {
  const flags: DayFlag[] = [];
  if (isEstimatedResting(source)) flags.push('restingEstimated');
  if (food === undefined) flags.push('noFood');
  if (
    food !== undefined &&
    resting !== undefined &&
    food < LOW_FOOD_SHARE * (resting + active)
  )
    flags.push('lowFood');
  if (source === 'missing') flags.push('noResting');
  return flags;
}

// Balance and data quality per day. Records are the days of the period in
// date order, one per day. Flags describe the data, whatever the zero day
// switch says.
export function dayBalances(
  records: readonly DayRecord[],
  { zeroDaysAsMaintenance, profile, weightBeforeKg }: DayBalanceOptions,
): DayBalance[] {
  const weights = weightsByDay(records, weightBeforeKg, profile.weightKg);
  return records.map((record, index) => {
    const day = fromDateKey(record.date) as Date;
    const { kcal: resting, source } = dayResting(
      record,
      weights[index],
      profile,
      day,
    );
    const active = record.active ?? 0;
    const { food } = record;
    const maintenance = food === undefined && zeroDaysAsMaintenance;
    const burn = resting === undefined ? undefined : resting + active;

    let kcal: number | undefined;
    if (maintenance) kcal = 0;
    else if (burn !== undefined) kcal = (food ?? 0) - burn;

    return {
      date: record.date,
      food,
      resting,
      restingSource: source,
      active,
      activeMissing: record.active === undefined,
      kcal,
      maintenance,
      flags: dayFlags(food, resting, source, active),
    };
  });
}

export function isComplete(day: DayBalance): boolean {
  return day.flags.length === 0;
}
