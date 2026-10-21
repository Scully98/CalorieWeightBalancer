import { Linking } from 'react-native';

// Health permissions live only in the Health app (Profile → Apps), not on
// the app's own Settings page, and iOS offers no link straight to them.
// `x-apple-health://` is undocumented, so Settings is the fallback.
export async function openHealthApp(): Promise<void> {
  try {
    await Linking.openURL('x-apple-health://');
  } catch {
    await Linking.openSettings();
  }
}
