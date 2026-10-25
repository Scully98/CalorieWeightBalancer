import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dayValueRow, type DayValueRow } from './day-value-rows';
import { AppText } from '@/components/app-text';
import { LinkButton } from '@/components/link-button';
import { addDays, startOfDay } from '@/core/dates';
import { useHealthSource } from '@/health/source-context';
import { formatLocale } from '@/i18n';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Searched for in the release bundle; it must never show up there.
export const DAY_VALUES_MARKER = 'kcalwaage-day-values';

// The last 30 days and today.
const DAYS = 31;

function Row({ row }: { row: DayValueRow }) {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderColor: colors.separator }]}>
      <AppText variant="bodyStrong">{row.title}</AppText>
      {row.lines.map((line) => (
        <AppText key={line} variant="footnote">
          {line}
        </AppText>
      ))}
    </View>
  );
}

// Development only: the raw values of each day as the Health source delivers
// them, to compare single days with the Health app.
export function DayValuesScreen() {
  const colors = useColors();
  const source = useHealthSource();
  const [rows, setRows] = useState<DayValueRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Bumped by pull to refresh to load again.
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const today = startOfDay(new Date());
    source.days(addDays(today, 1 - DAYS), DAYS).then((records) => {
      if (!active) return;
      const locale = formatLocale();
      setRows(
        records
          .map((record, index) =>
            dayValueRow(record, locale, index === records.length - 1),
          )
          .reverse(),
      );
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [source, reload]);

  const refresh = () => {
    setLoading(true);
    setReload((count) => count + 1);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={rows}
        keyExtractor={(row) => row.date}
        renderItem={({ item }) => <Row row={item} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <LinkButton label="‹ Einstellungen" onPress={router.back} />
            <AppText variant="largeTitle" accessibilityRole="header">
              Tageswerte (dev)
            </AppText>
            <AppText variant="footnote" tone="muted">
              Rohwerte aus Health, neueste zuerst
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
    gap: space.xs,
    paddingVertical: space.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
