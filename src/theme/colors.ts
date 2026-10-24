export type ColorTokens = {
  // Text, lines and card borders.
  foreground: string;
  background: string;
  // Secondary text, dashed lines and disabled states.
  muted: string;
  accent: string;
  plus: string;
  minus: string;
};

// Values computed from the tokens, not tokens of their own.
export type ThemeColors = ColorTokens & {
  // Grid lines and separators: muted at 35 %.
  separator: string;
  // Selected range in the calendar: muted at 20 %.
  band: string;
  // Dims the screen behind a sheet: black at 32 % in both schemes.
  scrim: string;
};

// V1 has no accent color: plus and minus are told apart by sign, bar direction
// and labels. The tokens exist so V2 can make them user-selectable.
const light: ColorTokens = {
  foreground: '#0B0B0B',
  background: '#FFFFFF',
  muted: '#6B6B6B',
  accent: '#0B0B0B',
  plus: '#0B0B0B',
  minus: '#0B0B0B',
};

const dark: ColorTokens = {
  foreground: '#F4F4F4',
  background: '#000000',
  muted: '#949494',
  accent: '#F4F4F4',
  plus: '#F4F4F4',
  minus: '#F4F4F4',
};

// "#RRGGBB" plus alpha 0–1 → "#RRGGBBAA".
export function withAlpha(color: string, alpha: number): string {
  const byte = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return `${color.slice(0, 7)}${byte.toString(16).padStart(2, '0').toUpperCase()}`;
}

function theme(tokens: ColorTokens): ThemeColors {
  return {
    ...tokens,
    separator: withAlpha(tokens.muted, 0.35),
    band: withAlpha(tokens.muted, 0.2),
    scrim: withAlpha('#000000', 0.32),
  };
}

export const colors = { light: theme(light), dark: theme(dark) };
