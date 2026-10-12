import { useColorScheme } from 'react-native';

import { colors, type ColorTokens } from './colors';

export function useColors(): ColorTokens {
  return useColorScheme() === 'dark' ? colors.dark : colors.light;
}
