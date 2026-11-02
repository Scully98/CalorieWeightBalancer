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
const CORE_TEXT_MESSAGE =
  'The core returns states and numbers; texts come from i18n in the UI.';
const NO_I18N = [
  { name: 'i18next', message: CORE_TEXT_MESSAGE },
  { name: 'react-i18next', message: CORE_TEXT_MESSAGE },
  { name: '@/i18n', message: CORE_TEXT_MESSAGE },
];
const ANALYSIS_CARD_MESSAGE =
  'The analysis card gets its values from the core and computes nothing; import types, @/core/format or the constants of its texts only.';
const NO_I18N_PATTERN = { group: ['@/i18n/*'], message: CORE_TEXT_MESSAGE };

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
  // The core has no texts (P9): it says which state, the UI picks the words.
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [RAW_SAMPLES, APP_GROUP, ...NO_I18N],
          patterns: [DEV_CODE, NO_I18N_PATTERN],
        },
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
  // The analysis card picks words for the core's state and computes nothing
  // (P9): besides types and formatting only the constants its texts name.
  {
    files: [
      'src/features/balance/analysis-card.ts',
      'src/features/balance/components/analysis-card.tsx',
    ],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/core/analysis',
              allowImportNames: [
                'KCAL_PER_KG_FAT_TISSUE',
                'KCAL_PER_KG_LEAN',
                'MIN_ANALYSIS_DAYS',
                'MIN_MEASUREMENTS',
              ],
              allowTypeImports: true,
              message: ANALYSIS_CARD_MESSAGE,
            },
            {
              name: '@/core/body',
              allowImportNames: ['TREND_DAYS'],
              allowTypeImports: true,
              message: ANALYSIS_CARD_MESSAGE,
            },
          ],
          patterns: [
            {
              group: [
                '@/core/*',
                '!@/core/format',
                '!@/core/analysis',
                '!@/core/body',
              ],
              allowTypeImports: true,
              message: ANALYSIS_CARD_MESSAGE,
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
