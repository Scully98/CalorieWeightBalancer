import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GiftedChart } from './gifted-chart';
import { spikeData } from './spike-data';
import { SvgChart } from './svg-chart';
import { VictoryChart } from './victory-chart';
import { AppText } from '@/components/app-text';
import { SegmentedControl } from '@/components/segmented-control';
import { useBalance } from '@/features/balance/use-balance';
import { ScrollLockContext } from '@/hooks/scroll-lock';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Spike only (P8 M1): the three chart candidates on the same data, inside a
// pager with a scrolling page like the balance tab, so the long press can be
// tried against scrolling and swiping.

type Candidate = 'all' | 'svg' | 'gifted' | 'victory';

const CANDIDATES = [
  { value: 'all', label: 'Alle' },
  { value: 'svg', label: 'SVG' },
  { value: 'gifted', label: 'gifted' },
  { value: 'victory', label: 'victory' },
] as const;

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

export function ChartSpike({ initial = 'all' }: { initial?: Candidate }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const state = useBalance();
  const [candidate, setCandidate] = useState<Candidate>(initial);
  const [locked, setLocked] = useState(false);
  // Time from the candidate switch (or mount) to the chart's first layout.
  const switchedAt = useRef<number>(undefined);
  const [renderMs, setRenderMs] = useState<number>();
  // Page padding 20 as in the design.
  const chartWidth = width - 40;
  const report =
    state.status === 'done' || state.status === 'empty'
      ? state.value
      : undefined;
  const data = report && spikeData(report.chart.buckets, report.chart.lines);

  return (
    <GestureHandlerRootView style={styles.flex}>
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
              <SegmentedControl
                options={CANDIDATES}
                value={candidate}
                onChange={(next) => {
                  switchedAt.current = performance.now();
                  setRenderMs(undefined);
                  setCandidate(next);
                }}
                accessibilityLabel="Kandidat"
              />
              <AppText variant="footnote" tone="muted">
                {data
                  ? `${data.bars.length} Balken · ${data.points.length} Linienpunkte · erste Darstellung ${renderMs ?? '…'} ms`
                  : 'lädt …'}
              </AppText>
              {candidate !== 'all' ? <Filler lines={6} /> : null}
              {data && candidate === 'all' ? (
                <>
                  <AppText variant="footnote">SVG</AppText>
                  <SvgChart data={data} width={chartWidth} />
                  <AppText variant="footnote">gifted-charts</AppText>
                  <GiftedChart data={data} width={chartWidth} />
                  <AppText variant="footnote">victory-native</AppText>
                  <VictoryChart data={data} width={chartWidth} />
                </>
              ) : null}
              {data && candidate !== 'all' ? (
                <View
                  key={candidate}
                  onLayout={() => {
                    if (switchedAt.current !== undefined)
                      setRenderMs(
                        Math.round(performance.now() - switchedAt.current),
                      );
                  }}
                >
                  {candidate === 'svg' ? (
                    <SvgChart data={data} width={chartWidth} />
                  ) : candidate === 'gifted' ? (
                    <GiftedChart data={data} width={chartWidth} />
                  ) : (
                    <VictoryChart data={data} width={chartWidth} />
                  )}
                </View>
              ) : null}
              <Filler lines={20} />
            </ScrollView>
            <View style={[styles.second, { width }]}>
              <AppText>Zweite Seite (Pager)</AppText>
            </View>
          </ScrollView>
        </ScrollLockContext>
      </SafeAreaView>
    </GestureHandlerRootView>
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
