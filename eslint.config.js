// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

const COLOR_MESSAGE = 'Use a color token from src/theme/colors.ts.';
const HEX = '#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})';
const FUNCTION = '(rgb|rgba|hsl|hsla)\\(';

const DEV_CODE = {
  group: ['@/dev/*', '**/dev/*'],
  message: 'Development-only code; load it in src/app/dev behind __DEV__.',
};
const RAW_SAMPLES = {
  name: '@kingstinct/react-native-healthkit',
  importNames: ['queryQuantitySamples'],
  message: 'Sum Health values with statistics queries, not raw samples.',
};
const APP_GROUP = {
  name: '@bacons/apple-targets',
  message: 'Read and write the App Group through the store in src/storage.',
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  // Colors live in the token file only, so V2 can make them selectable.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/colors.ts', 'src/theme/__tests__/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: `Literal[value=/^${HEX}$/]`, message: COLOR_MESSAGE },
        { selector: `Literal[value=/^${FUNCTION}/i]`, message: COLOR_MESSAGE },
        {
          selector: `TemplateElement[value.raw=/${HEX}\\b|${FUNCTION}/i]`,
          message: COLOR_MESSAGE,
        },
        // Named colors such as 'red' as a style value or prop.
        {
          selector:
            'Property[key.name=/[cC]olor$/] > Literal[value=/^(?!transparent$)[a-zA-Z]+$/]',
          message: COLOR_MESSAGE,
        },
        {
          selector:
            'JSXAttribute[name.name=/[cC]olor$/] > Literal[value=/^(?!transparent$)[a-zA-Z]+$/]',
          message: COLOR_MESSAGE,
        },
      ],
    },
  },
  // Demo data and the state gallery stay out of release builds: only dev code
  // imports them; routes in src/app/dev load them behind __DEV__.
  // Health values are summed by statistics queries, which deduplicate iPhone
  // and Watch; raw samples are only read where nothing is summed.
  // Only the store touches the App Group.
  // ESLint keeps one config per rule and file, so each block lists every
  // restriction that applies to its files.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [RAW_SAMPLES, APP_GROUP], patterns: [DEV_CODE] },
      ],
    },
  },
  {
    files: ['src/health/scan.ts', 'src/health/healthkit-source.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [APP_GROUP], patterns: [DEV_CODE] },
      ],
    },
  },
  {
    files: ['src/dev/**/*.{ts,tsx}', 'src/app/dev/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { paths: [RAW_SAMPLES, APP_GROUP] }],
    },
  },
  {
    // Tests mock the HealthKit module, including the raw sample query.
    files: ['src/health/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [APP_GROUP], patterns: [DEV_CODE] },
      ],
    },
  },
  {
    files: ['src/storage/app-group.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [RAW_SAMPLES], patterns: [DEV_CODE] },
      ],
    },
  },
  // The chart only draws finished series of the core (P8): from src/core it
  // may import types and the display formatting, nothing that computes.
  {
    files: [
      'src/features/balance/chart-*.ts',
      'src/features/balance/components/chart-*.tsx',
      'src/features/balance/components/balance-chart.tsx',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/core/*', '!@/core/format'],
              allowTypeImports: true,
              message:
                'The chart gets finished series from the core and computes nothing; import types or @/core/format only.',
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
