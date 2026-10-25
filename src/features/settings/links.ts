import { Linking } from 'react-native';

// The pages follow in step 11 (GitHub Pages); they must be online before the
// app is submitted.
export const PRIVACY_URL =
  'https://scully98.github.io/CalorieWeightBalancer/datenschutz';
export const IMPRINT_URL =
  'https://scully98.github.io/CalorieWeightBalancer/impressum';

export function openPrivacy(): Promise<void> {
  return Linking.openURL(PRIVACY_URL);
}

export function openImprint(): Promise<void> {
  return Linking.openURL(IMPRINT_URL);
}

// iOS offers the language per app on the app's own Settings page, because
// the app declares German and English.
export function openLanguageSettings(): Promise<void> {
  return Linking.openSettings();
}
