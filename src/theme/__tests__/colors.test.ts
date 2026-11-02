import { colors, DIMMED_OPACITY, withAlpha } from '../colors';

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

// WCAG relative luminance of a "#RRGGBB" color.
function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const value = parseInt(color.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// `front` at `alpha` over the opaque `back`.
function over(front: string, back: string, alpha: number): string {
  const channels = [1, 3, 5].map((start) => {
    const mix = (color: string) => parseInt(color.slice(start, start + 2), 16);
    const value = Math.round(mix(front) * alpha + mix(back) * (1 - alpha));
    return value.toString(16).padStart(2, '0');
  });
  return `#${channels.join('')}`;
}

describe.each([
  ['light', colors.light],
  ['dark', colors.dark],
])('contrast in %s', (_, theme) => {
  it('keeps text at 4.5:1', () => {
    expect(contrast(theme.foreground, theme.background)).toBeGreaterThan(4.5);
    expect(contrast(theme.muted, theme.background)).toBeGreaterThan(4.5);
  });

  it('keeps control edges and tracks at 3:1', () => {
    expect(contrast(theme.muted, theme.background)).toBeGreaterThan(3);
  });

  it('keeps dimmed bars at 3:1', () => {
    const dimmed = over(theme.foreground, theme.background, DIMMED_OPACITY);
    expect(contrast(dimmed, theme.background)).toBeGreaterThan(3);
  });
});
