import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Appearance, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GALLERY_ENTRIES, hasPendingUi, type GalleryUi } from './entries';
import { AppText } from '@/components/app-text';
import { Badge } from '@/components/badge';
import { LinkButton } from '@/components/link-button';
import { createDemoSource } from '@/dev/demo/demo-source';
import { buildScenario } from '@/dev/demo/scenarios';
import { ChartSpike } from '@/dev/spike/chart-spike';
import { addDays } from '@/core/dates';
import { toDateKey } from '@/core/day-record';
import {
  HomeScreen,
  type HomeUi,
} from '@/features/balance/components/home-screen';
import { HealthSourceProvider } from '@/health/source-context';
import { createMemoryStore } from '@/storage/key-value-store';
import { SettingsStoreProvider } from '@/storage/settings-context';
import { createSettingsStore } from '@/storage/settings-store';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Presets of the design that are UI state, not data or settings.
function homeUi(ui: GalleryUi | undefined): HomeUi {
  const now = new Date();
  const key = (daysAgo: number) => toDateKey(addDays(now, -daysAgo));
  return {
    toleranceOpen: ui?.tolerance?.open,
    sheet: ui?.sheet,
    picker: ui?.picker && {
      from: key(ui.picker.fromDaysAgo),
      to: key(ui.picker.toDaysAgo),
      editing: ui.picker.editing,
    },
  };
}

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
  // Settings of the entry in memory, so the gallery never changes the real
  // ones.
  const [store] = useState(() => {
    const memory = createSettingsStore(createMemoryStore());
    if (entry) {
      const tolerance = entry.ui?.tolerance;
      memory.updateSettings({
        period: buildScenario(entry.scenario).period,
        includeToday: entry.ui?.includeToday ?? false,
        ...(tolerance && {
          tolerance: {
            foodPercent: tolerance.foodPercent,
            burnPercent: tolerance.burnPercent,
          },
        }),
      });
    }
    return memory;
  });
  const colorScheme = entry?.ui?.colorScheme;
  const [initialUi] = useState(() => homeUi(entry?.ui));

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
        <SettingsStoreProvider store={store}>
          {entry.ui?.part === 'chartSpike' ? (
            <ChartSpike />
          ) : (
            <HomeScreen initialUi={initialUi} />
          )}
        </SettingsStoreProvider>
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
