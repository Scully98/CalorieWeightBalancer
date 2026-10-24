// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

const COLOR_MESSAGE = 'Use a color token from src/theme/colors.ts.';
const HEX = '#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})';
const FUNCTION = '(rgb|rgba|hsl|hsla)\\(';

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
  eslintConfigPrettier,
]);
