import { LIMITS, type NumberKey, type Sex } from '@/core/bmr';
import type { Period, PresetDays } from '@/core/period';
import {
  DEFAULT_SETTINGS,
  TOLERANCE_LIMITS,
  type Settings,
} from '@/core/settings';

// Only values the user entered because Health lacked them; never copies of
// HealthKit data. Dates are YYYY-MM-DD.
export type StoredProfile = {
  heightCm?: number;
  sex?: Sex;
  weightKg?: number;
  weightRecordedOn?: string;
  ageYears?: number;
  ageRecordedOn?: string;
};

type Json = Record<string, unknown>;

// An object from stored JSON, or undefined for anything else.
export function parseObject(raw: string | null): Json | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Json)
      : undefined;
  } catch {
    return undefined;
  }
}

function numberWithin(value: unknown, key: NumberKey): number | undefined {
  const { min, max } = LIMITS[key];
  return typeof value === 'number' && value >= min && value <= max
    ? value
    : undefined;
}

function isoDate(value: unknown): string | undefined {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined;
}

function sex(value: unknown): Sex | undefined {
  return value === 'male' || value === 'female' || value === 'unspecified'
    ? value
    : undefined;
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  ) as T;
}

// Keeps only valid fields, so an older or damaged entry can't break the
// estimate.
export function parseProfile(raw: string | null): StoredProfile {
  const parsed = parseObject(raw);
  if (!parsed) return {};
  return withoutUndefined({
    heightCm: numberWithin(parsed.heightCm, 'height'),
    sex: sex(parsed.sex),
    weightKg: numberWithin(parsed.weightKg, 'weight'),
    weightRecordedOn: isoDate(parsed.weightRecordedOn),
    ageYears: numberWithin(parsed.ageYears, 'age'),
    ageRecordedOn: isoDate(parsed.ageRecordedOn),
  });
}

export function profileToJson(profile: StoredProfile): string {
  return JSON.stringify(withoutUndefined(profile));
}

const PRESETS: readonly PresetDays[] = [7, 30, 60, 90];

function period(value: unknown): Period | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Json;
  switch (candidate.kind) {
    case 'days':
      return PRESETS.includes(candidate.days as PresetDays)
        ? { kind: 'days', days: candidate.days as PresetDays }
        : undefined;
    case 'all':
      return { kind: 'all' };
    case 'custom': {
      const from = isoDate(candidate.from);
      const to = isoDate(candidate.to);
      return from && to ? { kind: 'custom', from, to } : undefined;
    }
    default:
      return undefined;
  }
}

function percent(value: unknown, max: number, fallback: number): number {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= max
    ? value
    : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

// Each invalid or missing field falls back to its default, so an older or
// damaged entry can't break the balance.
export function parseSettings(raw: string | null): Settings {
  const parsed = parseObject(raw) ?? {};
  const tolerance = (
    parsed.tolerance && typeof parsed.tolerance === 'object'
      ? parsed.tolerance
      : {}
  ) as Json;
  const defaults = DEFAULT_SETTINGS;
  return {
    period: period(parsed.period) ?? defaults.period,
    zeroDaysAsMaintenance: flag(
      parsed.zeroDaysAsMaintenance,
      defaults.zeroDaysAsMaintenance,
    ),
    includeToday: flag(parsed.includeToday, defaults.includeToday),
    tolerance: {
      foodPercent: percent(
        tolerance.foodPercent,
        TOLERANCE_LIMITS.foodPercent,
        defaults.tolerance.foodPercent,
      ),
      burnPercent: percent(
        tolerance.burnPercent,
        TOLERANCE_LIMITS.burnPercent,
        defaults.tolerance.burnPercent,
      ),
    },
  };
}
