import { useSyncExternalStore } from 'react';

import { appGroupStorage } from './app-group';
import { LIMITS, type NumberKey, type Sex } from '@/core/bmr';

const INTRO_COMPLETED = 'introCompleted';
const PROFILE = 'profile.v1';

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

const listeners = new Set<() => void>();

export function subscribeToSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function isIntroCompleted(): boolean {
  return appGroupStorage.get(INTRO_COMPLETED) === '1';
}

export function useIntroCompleted(): boolean {
  return useSyncExternalStore(subscribeToSettings, isIntroCompleted);
}

export function completeIntro(profile: StoredProfile) {
  const defined = Object.fromEntries(
    Object.entries(profile).filter(([, value]) => value !== undefined),
  );
  appGroupStorage.set(PROFILE, JSON.stringify(defined));
  appGroupStorage.set(INTRO_COMPLETED, '1');
  notify();
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

// Keeps only valid fields, so an older or damaged entry can't break the
// estimate.
function parseProfile(parsed: Record<string, unknown>): StoredProfile {
  const profile: StoredProfile = {
    heightCm: numberWithin(parsed.heightCm, 'height'),
    sex: sex(parsed.sex),
    weightKg: numberWithin(parsed.weightKg, 'weight'),
    weightRecordedOn: isoDate(parsed.weightRecordedOn),
    ageYears: numberWithin(parsed.ageYears, 'age'),
    ageRecordedOn: isoDate(parsed.ageRecordedOn),
  };
  return Object.fromEntries(
    Object.entries(profile).filter(([, value]) => value !== undefined),
  );
}

export function getProfile(): StoredProfile {
  const raw = appGroupStorage.get(PROFILE);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parseProfile(parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

// Development only: shows the intro again on the next render.
export function resetIntro() {
  appGroupStorage.remove(PROFILE);
  appGroupStorage.remove(INTRO_COMPLETED);
  notify();
}
