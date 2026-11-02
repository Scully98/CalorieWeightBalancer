export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  small: 4,
  card: 16,
  pill: 999,
} as const;

// Minimum height of tappable controls (Apple HIG).
export const touchTarget = 44;

export const border = {
  thin: 1,
  // Cards and controls on the balance page (design: 1.5 pt).
  medium: 1.5,
  thick: 2,
} as const;

// Above the largest standard text size (xxxLarge) iOS stacks controls and
// values below their labels.
export const STACKED_FONT_SCALE = 1.35;
