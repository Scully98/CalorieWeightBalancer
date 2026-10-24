import type { TextStyle } from 'react-native';

// Base sizes of the iOS text styles at the default content size ("Large").
// React Native scales them with Dynamic Type as long as allowFontScaling stays on.
export const typography = {
  // iOS Title 1.
  screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  // iOS Title 2.
  sectionTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  body: { fontSize: 17, lineHeight: 22 },
  bodyStrong: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  secondary: { fontSize: 15, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  number: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  numberLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;
