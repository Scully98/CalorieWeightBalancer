import { useSyncExternalStore } from 'react';

import { appGroupStorage } from './app-group';
import type { Sex } from '@/core/bmr';

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

export function getProfile(): StoredProfile {
  const raw = appGroupStorage.get(PROFILE);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as StoredProfile)
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
