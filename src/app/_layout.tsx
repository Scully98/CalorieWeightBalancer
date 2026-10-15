import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import '@/i18n';
import { useIntroCompleted } from '@/storage/settings';
import { useColors } from '@/theme/use-colors';

export default function RootLayout() {
  const colors = useColors();
  const introCompleted = useIntroCompleted();
  const baseTheme = useColorScheme() === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...baseTheme,
    colors: { ...baseTheme.colors, background: colors.background },
  };

  return (
    <ThemeProvider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={introCompleted}>
          <Stack.Screen name="index" />
        </Stack.Protected>
        <Stack.Protected guard={!introCompleted}>
          <Stack.Screen name="intro" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
