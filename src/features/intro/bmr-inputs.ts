import { BiologicalSex } from '@kingstinct/react-native-healthkit';

import { ageInYears } from '@/core/age';
import { estimateRestingEnergy, type Sex } from '@/core/bmr';
import { parseLocaleNumber } from '@/core/format';
import type { HealthScan } from '@/health/scan';
import type { StoredProfile } from '@/storage/settings';

export type NumberKey = 'weight' | 'age' | 'height';

export const LIMITS: Record<
  NumberKey,
  { min: number; max: number; decimals: 0 | 1 }
> = {
  weight: { min: 30, max: 300, decimals: 1 },
  age: { min: 15, max: 100, decimals: 0 },
  height: { min: 100, max: 250, decimals: 0 },
};

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

function sexState(healthSex: BiologicalSex, input: Sex | undefined): SexState {
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
