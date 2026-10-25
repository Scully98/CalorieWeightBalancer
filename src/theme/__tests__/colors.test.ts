import { colors, withAlpha } from '../colors';

describe('withAlpha', () => {
  it('appends the alpha byte', () => {
    expect(withAlpha('#6B6B6B', 0.35)).toBe('#6B6B6B59');
    expect(withAlpha('#000000', 1)).toBe('#000000FF');
    expect(withAlpha('#000000', 0)).toBe('#00000000');
  });
});

describe('colors', () => {
  it('derives the separator from muted in both schemes', () => {
    expect(colors.light.separator).toBe(withAlpha(colors.light.muted, 0.35));
    expect(colors.dark.separator).toBe(withAlpha(colors.dark.muted, 0.35));
  });

  it('derives band and scrim', () => {
    expect(colors.light.band).toBe('#6B6B6B33');
    expect(colors.dark.band).toBe(withAlpha(colors.dark.muted, 0.2));
    expect(colors.dark.scrim).toBe('#00000052');
  });
});
