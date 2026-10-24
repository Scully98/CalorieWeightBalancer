import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Appearance, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GALLERY_ENTRIES, hasPendingUi } from './entries';
import { AppText } from '@/components/app-text';
import { Badge } from '@/components/badge';
import { LinkButton } from '@/components/link-button';
import { createDemoSource } from '@/dev/demo/demo-source';
import { buildScenario } from '@/dev/demo/scenarios';
import { HomeScreen } from '@/features/balance/components/home-screen';
import { HealthSourceProvider } from '@/health/source-context';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Development only: the balance tab with the entry's demo scenario. The bar
// sits at the bottom so the screen above keeps its real layout.
export function EntryScreen() {
  const colors = useColors();
  const { entry: id } = useLocalSearchParams<{ entry: string }>();
  const entry = GALLERY_ENTRIES.find((candidate) => candidate.id === id);
  // One source per opened entry; the entry of a screen never changes.
  const [source] = useState(() =>
    entry ? createDemoSource(entry.scenario, new Date()) : undefined,
  );
  const colorScheme = entry?.ui?.colorScheme;

  // Overrides the system appearance for the whole app while open.
  useEffect(() => {
    if (!colorScheme) return;
    Appearance.setColorScheme(colorScheme);
    return () => Appearance.setColorScheme('unspecified');
  }, [colorScheme]);

  if (!entry || !source) {
    return (
      <SafeAreaView
        style={[styles.flex, { backgroundColor: colors.background }]}
      >
        <AppText>Unknown gallery entry „{id}“.</AppText>
        <LinkButton label="‹ Galerie" onPress={router.back} />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <HealthSourceProvider source={source}>
        <HomeScreen period={buildScenario(entry.scenario).period} />
      </HealthSourceProvider>
      <SafeAreaView
        edges={['bottom']}
        style={[styles.bar, { borderColor: colors.separator }]}
      >
        <View style={styles.barRow}>
          <LinkButton label="‹ Galerie" onPress={router.back} />
          <AppText variant="footnote" style={styles.title}>
            {entry.id} · {entry.title}
          </AppText>
        </View>
        {hasPendingUi(entry) ? (
          <Badge label="UI-Vorgabe folgt mit der Homepage" />
        ) : null}
        {entry.ui?.hint ? (
          <AppText variant="footnote" tone="muted">
            {entry.ui.hint}
          </AppText>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bar: {
    gap: space.s,
    paddingHorizontal: space.xl,
    paddingTop: space.m,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  title: {
    flex: 1,
  },
});
