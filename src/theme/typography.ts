import type { TextStyle } from 'react-native';

// Every style uses the system font (SF Pro on iOS) with tabular figures, so
// numbers keep their width when they change.
const TABULAR: TextStyle['fontVariant'] = ['tabular-nums'];

// Base sizes of the iOS text styles at the default content size ("Large").
// React Native scales them with Dynamic Type as long as allowFontScaling stays on.
export const typography = {
  // iOS Large Title.
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    fontVariant: TABULAR,
  },
  // iOS Title 1.
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontVariant: TABULAR,
  },
  // iOS Title 2.
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    fontVariant: TABULAR,
  },
  body: { fontSize: 17, lineHeight: 22, fontVariant: TABULAR },
  bodyStrong: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    fontVariant: TABULAR,
  },
  secondary: { fontSize: 15, lineHeight: 20, fontVariant: TABULAR },
  // iOS Footnote.
  footnote: { fontSize: 13, lineHeight: 18, fontVariant: TABULAR },
  caption: { fontSize: 12, lineHeight: 16, fontVariant: TABULAR },
  // iOS Caption 2, e.g. chart labels.
  caption2: { fontSize: 11, lineHeight: 13, fontVariant: TABULAR },
  number: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontVariant: TABULAR,
  },
  numberLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    fontVariant: TABULAR,
  },
  // The big balance number on the home screen.
  hero: {
    fontSize: 68,
    lineHeight: 76,
    fontWeight: '600',
    fontVariant: TABULAR,
  },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;
