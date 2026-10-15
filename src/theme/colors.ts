export type ColorTokens = {
  foreground: string;
  background: string;
  accent: string;
  plus: string;
  minus: string;
};

// V1 has no accent color: plus and minus are told apart by sign, bar direction
// and labels. The tokens exist so V2 can make them user-selectable.
const light: ColorTokens = {
  foreground: '#000000',
  background: '#FFFFFF',
  accent: '#000000',
  plus: '#000000',
  minus: '#000000',
};

const dark: ColorTokens = {
  foreground: '#FFFFFF',
  background: '#000000',
  accent: '#FFFFFF',
  plus: '#FFFFFF',
  minus: '#FFFFFF',
};

export const colors = { light, dark };
