import type { ConfigContext, ExpoConfig } from 'expo/config';

// Device builds with a free Apple ID (Personal Team): App Groups can't be
// signed there, and a separate bundle ID keeps the real one free for the paid team.
const personalTeamId = process.env.APPLE_PERSONAL_TEAM_ID;

export default ({ config }: ConfigContext): ExpoConfig => {
  const expoConfig = config as ExpoConfig;
  if (!personalTeamId) return expoConfig;

  const bundleIdentifier = expoConfig.ios?.bundleIdentifier;
  if (!bundleIdentifier) {
    throw new Error(
      'app.json needs ios.bundleIdentifier for Personal Team builds.',
    );
  }

  const entitlements = { ...expoConfig.ios?.entitlements };
  delete entitlements['com.apple.security.application-groups'];

  return {
    ...expoConfig,
    ios: {
      ...expoConfig.ios,
      appleTeamId: personalTeamId,
      bundleIdentifier: `${bundleIdentifier}.dev`,
      entitlements,
    },
  };
};
