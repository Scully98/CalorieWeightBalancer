import { colors } from '../colors';

// The widget target cannot import TypeScript; its colors are copies of the
// tokens and must not drift.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const target = require('../../../targets/widget/expo-target.config.js') as {
  colors: Record<string, { light: string; dark: string }>;
};

describe('widget colors', () => {
  it.each([
    ['$widgetBackground', 'background'],
    ['foreground', 'foreground'],
    ['muted', 'muted'],
  ] as const)('%s equals the %s token', (name, token) => {
    expect(target.colors[name]).toEqual({
      light: colors.light[token],
      dark: colors.dark[token],
    });
  });

  it('has no other colors', () => {
    expect(Object.keys(target.colors).sort()).toEqual(
      ['$widgetBackground', 'foreground', 'muted'].sort(),
    );
  });
});
