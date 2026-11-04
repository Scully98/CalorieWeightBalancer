// Home and lock screen widget (Plan step 9). It reads the finished texts the
// app writes into the App Group container (src/features/widget) and never
// asks HealthKit itself.

// Same values as the tokens in src/theme/colors.ts (checked by
// src/theme/__tests__/widget-colors.test.ts); ESM and TypeScript are not
// supported here.
const colors = {
  $widgetBackground: { light: '#FFFFFF', dark: '#000000' },
  foreground: { light: '#0B0B0B', dark: '#F4F4F4' },
  muted: { light: '#6B6B6B', dark: '#949494' },
};

/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'widget',
  displayName: 'UnRestart',
  deploymentTarget: '16.4',
  colors,
  // Empty on purpose: the plugin then mirrors the App Group of app.json (and
  // none for Personal Team builds, see app.config.ts).
  entitlements: {},
};
