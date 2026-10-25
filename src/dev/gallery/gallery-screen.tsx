import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GALLERY_ENTRIES, hasPendingUi, type GalleryEntry } from './entries';
import { AppText } from '@/components/app-text';
import { Badge } from '@/components/badge';
import { LinkButton } from '@/components/link-button';
import { buildScenario } from '@/dev/demo/scenarios';
import { space, touchTarget } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

function GalleryRow({ entry }: { entry: GalleryEntry }) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/dev/[entry]', params: { entry: entry.id } })
      }
      style={({ pressed }) => [
        styles.row,
        { borderColor: colors.separator, opacity: pressed ? 0.5 : 1 },
      ]}
    >
      <AppText variant="bodyStrong" style={styles.id}>
        {entry.id}
      </AppText>
      <View style={styles.text}>
        <AppText>{entry.title}</AppText>
        <AppText variant="footnote" tone="muted">
          {buildScenario(entry.scenario).name}
        </AppText>
        {hasPendingUi(entry) ? <Badge label="UI folgt" /> : null}
      </View>
      <AppText tone="muted">›</AppText>
    </Pressable>
  );
}

// Development only: every design state of the home screen with demo data.
export function GalleryScreen() {
  const colors = useColors();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={GALLERY_ENTRIES}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => <GalleryRow entry={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <LinkButton label="‹ Einstellungen" onPress={router.back} />
            <AppText variant="largeTitle" accessibilityRole="header">
              Zustandsgalerie
            </AppText>
          </View>
        }
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
  },
  header: {
    gap: space.m,
    paddingVertical: space.l,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    minHeight: touchTarget,
    paddingVertical: space.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  id: {
    minWidth: 32,
  },
  text: {
    flex: 1,
    gap: space.xs,
  },
});
