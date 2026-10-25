import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spikeData } from './spike-data';
import { SvgChart } from './svg-chart';
import { AppText } from '@/components/app-text';
import { useBalance } from '@/features/balance/use-balance';
import { ScrollLockContext } from '@/hooks/scroll-lock';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Spike only (P8 M1), replaced in M4: the chosen SVG candidate inside a pager
// with a scrolling page like the balance tab, so the long press can be tried
// against scrolling and swiping. The other candidates are on the branch
// spike/chart-candidates.

function Filler({ lines }: { lines: number }) {
  return (
    <View style={styles.filler}>
      {Array.from({ length: lines }, (_, index) => (
        <AppText key={index} tone="muted">
          Scroll-Fläche {index + 1}
        </AppText>
      ))}
    </View>
  );
}

export function ChartSpike() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const state = useBalance();
  const [locked, setLocked] = useState(false);
  // Page padding 20 as in the design.
  const chartWidth = width - 40;
  const report =
    state.status === 'done' || state.status === 'empty'
      ? state.value
      : undefined;
  const data = report && spikeData(report.chart.buckets, report.chart.lines);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollLockContext value={setLocked}>
        <ScrollView
          horizontal
          pagingEnabled
          scrollEnabled={!locked}
          showsHorizontalScrollIndicator={false}
        >
          <ScrollView
            style={{ width }}
            scrollEnabled={!locked}
            contentContainerStyle={styles.page}
          >
            <AppText variant="footnote" tone="muted">
              {data
                ? `${data.bars.length} Balken · ${data.points.length} Linienpunkte · lange drücken, dann ziehen`
                : 'lädt …'}
            </AppText>
            <Filler lines={6} />
            {data ? <SvgChart data={data} width={chartWidth} /> : null}
            <Filler lines={20} />
          </ScrollView>
          <View style={[styles.second, { width }]}>
            <AppText>Zweite Seite (Pager)</AppText>
          </View>
        </ScrollView>
      </ScrollLockContext>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    padding: 20,
    gap: space.m,
  },
  filler: {
    gap: space.s,
  },
  second: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
