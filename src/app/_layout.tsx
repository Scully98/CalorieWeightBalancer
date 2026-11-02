import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type ErrorBoundaryProps,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import '@/i18n';
import { useIntroCompleted } from '@/storage/settings-context';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Shown instead of a blank screen when rendering throws.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.error, { backgroundColor: colors.background }]}>
      <AppText variant="bodyStrong" style={styles.center}>
        {t('error.title')}
      </AppText>
      <Button label={t('error.retry')} onPress={retry} />
    </View>
  );
}

export default function RootLayout() {
  const colors = useColors();
  const { t } = useTranslation();
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
          <Stack.Screen name="(tabs)" options={{ title: t('home.title') }} />
          <Stack.Screen
            name="settings/resting-estimate"
            options={{ title: t('settings.restingEstimate') }}
          />
          <Stack.Screen
            name="settings/calculation"
            options={{ title: t('calculation.title') }}
          />
          <Stack.Screen
            name="settings/data"
            options={{ title: t('data.title') }}
          />
        </Stack.Protected>
        {/* Development only; the routes are empty in release builds. */}
        <Stack.Protected guard={__DEV__ && introCompleted}>
          <Stack.Screen name="dev/gallery" />
          <Stack.Screen name="dev/[entry]" />
          <Stack.Screen name="dev/day-values" />
        </Stack.Protected>
        <Stack.Protected guard={!introCompleted}>
          <Stack.Screen
            name="intro"
            options={{ title: t('common.introTitle') }}
          />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: space.xl,
    gap: space.xl,
  },
  center: {
    textAlign: 'center',
  },
});
