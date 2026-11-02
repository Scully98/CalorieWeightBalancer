import { useColorScheme } from 'react-native';

import { colors, type ThemeColors } from './colors';

export function useColors(): ThemeColors {
  return useColorScheme() === 'dark' ? colors.dark : colors.light;
}
