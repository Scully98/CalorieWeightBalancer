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
  // Detail lines in lists, e.g. a day in „Unvollständige Tage“.
  detail: { fontSize: 14, lineHeight: 19, fontVariant: TABULAR },
  // iOS Footnote.
  footnote: { fontSize: 13, lineHeight: 18, fontVariant: TABULAR },
  caption: { fontSize: 12, lineHeight: 16, fontVariant: TABULAR },
  // Small uppercase labels above a number, e.g. „BILANZ“. The text is
  // uppercased by the style, the strings stay normal.
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    fontVariant: TABULAR,
  },
  // Labels of compact segments, e.g. „30 T“.
  segment: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    fontVariant: TABULAR,
  },
  // iOS Caption 2, e.g. chart labels.
  caption2: { fontSize: 11, lineHeight: 13, fontVariant: TABULAR },
  number: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontVariant: TABULAR,
  },
  // Values in cards, e.g. „1.420“ in „Heute bisher“; bold where it matters.
  numberMedium: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '400',
    letterSpacing: -0.5,
    fontVariant: TABULAR,
  },
  // Title of the empty state, „Noch keine Daten.“
  emptyTitle: {
    fontSize: 24,
    lineHeight: 29,
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
    letterSpacing: -2.5,
    fontVariant: TABULAR,
  },
  // Both ends of the balance range.
  heroRange: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '600',
    letterSpacing: -1.5,
    fontVariant: TABULAR,
  },
  // "kcal" next to the hero number.
  heroUnit: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '600',
    fontVariant: TABULAR,
  },
  // "bis" and "kcal" between and after the range ends.
  heroRangeUnit: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    fontVariant: TABULAR,
  },
  // "mehr gegessen als verbraucht".
  heroWords: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '500',
    fontVariant: TABULAR,
  },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;
