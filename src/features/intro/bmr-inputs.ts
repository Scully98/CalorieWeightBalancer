import { BiologicalSex } from '@kingstinct/react-native-healthkit';

import { ageInYears, currentAge } from '@/core/age';
import {
  estimateRestingEnergy,
  LIMITS,
  type NumberKey,
  type Sex,
} from '@/core/bmr';
import { formatNumber, parseLocaleNumber } from '@/core/format';
import type { HealthScan } from '@/health/scan';
import type { StoredProfile } from '@/storage/settings-store';

export { LIMITS, type NumberKey } from '@/core/bmr';

// Raw text from the fields; sex stays undefined until a segment is chosen.
export type UserInput = Record<NumberKey, string> & { sex?: Sex };

export type NumberState =
  | { source: 'health'; value: number }
  | { source: 'input'; value?: number; showHint: boolean };

export type SexState =
  | { source: 'health'; value: Sex; fromHealth: 'male' | 'female' | 'other' }
  | { source: 'input'; value?: Sex };

export type BmrInputs = Record<NumberKey, NumberState> & {
  sex: SexState;
  // kcal per day once all four values are present and valid.
  estimate?: number;
};

function parseWithin(text: string, key: NumberKey): number | undefined {
  const { min, max, decimals } = LIMITS[key];
  const value = parseLocaleNumber(text);
  if (value === undefined || value < min || value > max) return undefined;
  const scaled = value * 10 ** decimals;
  return Math.abs(scaled - Math.round(scaled)) < 1e-9 ? value : undefined;
}

function numberState(
  healthValue: number | undefined,
  text: string,
  key: NumberKey,
): NumberState {
  if (healthValue !== undefined)
    return { source: 'health', value: healthValue };
  const value = parseWithin(text, key);
  return {
    source: 'input',
    value,
    showHint: text !== '' && value === undefined,
  };
}

export function sexState(
  healthSex: BiologicalSex,
  input: Sex | undefined,
): SexState {
  switch (healthSex) {
    case BiologicalSex.male:
      return { source: 'health', value: 'male', fromHealth: 'male' };
    case BiologicalSex.female:
      return { source: 'health', value: 'female', fromHealth: 'female' };
    case BiologicalSex.other:
      return { source: 'health', value: 'unspecified', fromHealth: 'other' };
    default:
      return { source: 'input', value: input };
  }
}

// Only fields Health lacks are editable; Health values always win.
export function resolveBmrInputs(
  profile: HealthScan['profile'],
  input: UserInput,
  now: Date,
): BmrInputs {
  const weight = numberState(profile.weightKg, input.weight, 'weight');
  const age = numberState(
    profile.dateOfBirth ? ageInYears(profile.dateOfBirth, now) : undefined,
    input.age,
    'age',
  );
  const height = numberState(profile.heightCm, input.height, 'height');
  const sex = sexState(profile.biologicalSex, input.sex);

  const estimate =
    weight.value !== undefined &&
    age.value !== undefined &&
    height.value !== undefined &&
    sex.value !== undefined
      ? estimateRestingEnergy({
          weightKg: weight.value,
          ageYears: age.value,
          heightCm: height.value,
          sex: sex.value,
        })
      : undefined;

  return { weight, age, height, sex, estimate };
}

function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Profile to store: only what the user typed, dated where it changes over time.
export function toStoredProfile(inputs: BmrInputs, now: Date): StoredProfile {
  const today = isoDate(now);
  const entered = (state: NumberState) =>
    state.source === 'input' ? state.value : undefined;
  const weightKg = entered(inputs.weight);
  const ageYears = entered(inputs.age);

  return {
    heightCm: entered(inputs.height),
    sex: inputs.sex.source === 'input' ? inputs.sex.value : undefined,
    weightKg,
    weightRecordedOn: weightKg === undefined ? undefined : today,
    ageYears,
    ageRecordedOn: ageYears === undefined ? undefined : today,
  };
}

// Fields filled with what the user entered before (settings); the age as it
// is today.
export function inputFromStored(
  stored: StoredProfile,
  locale: string,
  now: Date,
): UserInput {
  const text = (value: number | undefined, decimals: 0 | 1) =>
    value === undefined
      ? ''
      : formatNumber(value, locale, Number.isInteger(value) ? 0 : decimals);
  return {
    weight: text(stored.weightKg, LIMITS.weight.decimals),
    age: text(
      stored.ageYears === undefined
        ? undefined
        : currentAge(stored.ageYears, stored.ageRecordedOn, now),
      0,
    ),
    height: text(stored.heightCm, LIMITS.height.decimals),
    sex: stored.sex,
  };
}

// Profile to store after editing in settings. An unchanged weight or age
// keeps its date, so the age keeps growing from the first entry; an emptied
// field drops the value. Fields Health now provides keep what was stored.
export function updateStoredProfile(
  previous: StoredProfile,
  inputs: BmrInputs,
  now: Date,
): StoredProfile {
  const today = isoDate(now);
  const next: StoredProfile = {};

  if (inputs.height.source === 'health') next.heightCm = previous.heightCm;
  else next.heightCm = inputs.height.value;

  if (inputs.sex.source === 'health') next.sex = previous.sex;
  else next.sex = inputs.sex.value;

  if (inputs.weight.source === 'health') {
    next.weightKg = previous.weightKg;
    next.weightRecordedOn = previous.weightRecordedOn;
  } else if (inputs.weight.value !== undefined) {
    next.weightKg = inputs.weight.value;
    next.weightRecordedOn =
      inputs.weight.value === previous.weightKg
        ? previous.weightRecordedOn
        : today;
  }

  const previousAge =
    previous.ageYears === undefined
      ? undefined
      : currentAge(previous.ageYears, previous.ageRecordedOn, now);
  if (inputs.age.source === 'health' || inputs.age.value === previousAge) {
    next.ageYears = previous.ageYears;
    next.ageRecordedOn = previous.ageRecordedOn;
  } else if (inputs.age.value !== undefined) {
    next.ageYears = inputs.age.value;
    next.ageRecordedOn = today;
  }

  return Object.fromEntries(
    Object.entries(next).filter(([, value]) => value !== undefined),
  );
}
