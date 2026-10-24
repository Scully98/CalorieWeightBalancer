import { ageInYears, currentAge } from './age';
import { estimateRestingEnergy, type Sex } from './bmr';
import type { DayEnergy, DayRecord } from './day-record';

// 20 of 24 hours: short charging breaks still count as a full day.
export const FULL_DAY_COVERAGE = 20 / 24;

// Below 6 of 24 hours a day is not scaled up: a sync app writing the daily
// total as one short sample would otherwise multiply it by up to 24.
export const MIN_SCALED_COVERAGE = 6 / 24;

// What the resting energy estimate needs besides the day's weight. Health
// values and the user's own entries are merged before they get here.
export type RestingProfile = {
  heightCm?: number;
  sex?: Sex;
  // From Health; wins over the entered age.
  dateOfBirth?: Date;
  ageYears?: number;
  // YYYY-MM-DD the age was entered on.
  ageRecordedOn?: string;
  // Newest weight from Health, else the entered one; last resort.
  weightKg?: number;
};

// measured: full day · scaled: partial day scaled to 24 h · source: estimate
// supplied by the source · formula: Mifflin-St Jeor · missing: none of these.
export type RestingSource =
  'measured' | 'scaled' | 'source' | 'formula' | 'missing';

export type DayResting = { kcal?: number; source: RestingSource };

// Age in full years on `day`, from the date of birth or the entered age.
export function ageOn(profile: RestingProfile, day: Date): number | undefined {
  if (profile.dateOfBirth) return ageInYears(profile.dateOfBirth, day);
  if (profile.ageYears === undefined) return undefined;
  return currentAge(profile.ageYears, profile.ageRecordedOn, day);
}

// Weight per record for the estimate: the last measurement on or before the
// day (starting with `weightBeforeKg` from before the records), else the first
// one after it, else the profile weight.
export function weightsByDay(
  records: readonly Pick<DayRecord, 'weightKg'>[],
  weightBeforeKg: number | undefined,
  profileWeightKg: number | undefined,
): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  let last = weightBeforeKg;
  for (const record of records) {
    last = record.weightKg ?? last;
    result.push(last);
  }
  let next: number | undefined;
  for (let index = records.length - 1; index >= 0; index--) {
    next = records[index].weightKg ?? next;
    if (result[index] === undefined) result[index] = next ?? profileWeightKg;
  }
  return result;
}

// Measured or scaled resting energy, without any estimate.
function measuredResting(record: DayEnergy): DayResting | undefined {
  if (record.resting === undefined) return undefined;
  const coverage = record.restingCoverage ?? 1;
  if (coverage >= FULL_DAY_COVERAGE)
    return { kcal: record.resting, source: 'measured' };
  if (coverage >= MIN_SCALED_COVERAGE)
    return { kcal: record.resting / coverage, source: 'scaled' };
  return undefined;
}

// Resting energy for the whole of `day`. Without enough measurement it is
// estimated after Mifflin-St Jeor with that day's weight and age.
export function dayResting(
  record: DayEnergy,
  weightKg: number | undefined,
  profile: RestingProfile,
  day: Date,
): DayResting {
  if (record.restingEstimated && record.resting !== undefined)
    return { kcal: record.resting, source: 'source' };
  const measured = measuredResting(record);
  if (measured) return measured;

  const ageYears = ageOn(profile, day);
  const { heightCm, sex } = profile;
  if (
    weightKg === undefined ||
    heightCm === undefined ||
    ageYears === undefined ||
    sex === undefined
  )
    return { source: 'missing' };
  return {
    kcal: estimateRestingEnergy({ weightKg, heightCm, ageYears, sex }),
    source: 'formula',
  };
}

// Estimated days carry the „geschätzt“ hint; scaled partial days count as
// measured.
export function isEstimatedResting(source: RestingSource): boolean {
  return source === 'source' || source === 'formula';
}
