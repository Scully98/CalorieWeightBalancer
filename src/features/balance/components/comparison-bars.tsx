import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import type {
  BarSegment,
  ComparisonModel,
  ComparisonRow,
  LegendEntry,
} from '../analysis-card';
import { AppText } from '@/components/app-text';
import {
  QualityPatternDefs,
  QualitySwatch,
  qualityFill,
  usePatternPrefix,
} from '@/components/quality-pattern';
import { border, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

const BAR_HEIGHT = 20;
// So a small share stays visible; its number is in the legend.
const MIN_SEGMENT = 2;
const SWATCH = 11;

type Rectangle = { kind: BarSegment['kind']; x: number; width: number };

// Pixels of the segments: from the left edge, or from the center line with the
// sign deciding the side. The core gave the shares.
function layoutBar(
  segments: readonly BarSegment[],
  width: number,
  diverging: boolean,
): Rectangle[] {
  const unit = diverging ? width / 2 : width;
  let right = diverging ? width / 2 : 0;
  let left = width / 2;
  const rectangles: Rectangle[] = [];
  for (const { kind, share } of segments) {
    if (share === 0) continue;
    const length = Math.max(MIN_SEGMENT, Math.abs(share) * unit);
    if (share > 0) {
      rectangles.push({ kind, x: right, width: length });
      right += length;
    } else {
      left -= length;
      rectangles.push({ kind, x: left, width: length });
    }
  }
  return rectangles;
}

function Bar({ row, diverging }: { row: ComparisonRow; diverging: boolean }) {
  const colors = useColors();
  const prefix = usePatternPrefix();
  const [width, setWidth] = useState<number>();
  const empty = row.segments.every(({ share }) => share === 0);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        styles.bar,
        empty && !diverging
          ? {
              borderWidth: border.thin,
              borderColor: colors.separator,
            }
          : undefined,
      ]}
    >
      {width ? (
        <Svg width={width} height={BAR_HEIGHT}>
          <QualityPatternDefs idPrefix={prefix} />
          {layoutBar(row.segments, width, diverging).map(
            ({ kind, x, width: length }) =>
              kind === 'gap' ? (
                <Rect
                  key={kind}
                  x={x + 0.75}
                  y={0.75}
                  width={Math.max(0, length - 1.5)}
                  height={BAR_HEIGHT - 1.5}
                  rx={3}
                  fill="none"
                  stroke={colors.foreground}
                  strokeWidth={border.thin}
                  strokeDasharray="3 3"
                />
              ) : (
                <Rect
                  key={kind}
                  x={x}
                  y={0}
                  width={length}
                  height={BAR_HEIGHT}
                  fill={
                    kind === 'hatch'
                      ? qualityFill('restingEstimated', prefix)
                      : colors.foreground
                  }
                />
              ),
          )}
          {diverging ? (
            <Line
              x1={width / 2}
              x2={width / 2}
              y1={0}
              y2={BAR_HEIGHT}
              stroke={colors.foreground}
              strokeWidth={border.thin}
            />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}

function Row({ row, diverging }: { row: ComparisonRow; diverging: boolean }) {
  return (
    <View accessible accessibilityLabel={row.spoken} style={styles.row}>
      <View style={styles.rowHead}>
        <AppText variant="bodyStrong">{row.label}</AppText>
        <AppText variant="bodyStrong" style={styles.value}>
          {row.value}
        </AppText>
      </View>
      {row.note ? (
        <AppText variant="footnote" tone="muted">
          {row.note}
        </AppText>
      ) : null}
      <Bar row={row} diverging={diverging} />
    </View>
  );
}

function LegendMark({ kind }: { kind: LegendEntry['kind'] }) {
  const colors = useColors();
  if (kind === 'hatch')
    return <QualitySwatch flag="restingEstimated" size={SWATCH} />;
  if (kind === 'plain') return null;
  return (
    <View
      style={[
        styles.swatch,
        kind === 'solid'
          ? { backgroundColor: colors.foreground }
          : styles.swatchGap,
        { borderColor: colors.foreground },
      ]}
    />
  );
}

// „Bilanz vs. Waage“: two bars and what they are made of. The bars are
// decoration for VoiceOver, each row reads as its numbers.
export function ComparisonBars({ model }: { model: ComparisonModel }) {
  const diverging = model.layout === 'diverging';

  return (
    <View style={styles.section}>
      {model.title ? (
        <View style={styles.head}>
          <AppText variant="burnUnit" accessibilityRole="header">
            {model.title}
          </AppText>
          {model.summary ? (
            <AppText variant="footnote" tone="muted" style={styles.summary}>
              {model.summary}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <Row row={model.balance} diverging={diverging} />
      <Row row={model.scale} diverging={diverging} />
      {model.legend.length > 0 ? (
        <View style={styles.legend}>
          {model.legend.map((entry) => (
            <View key={entry.text} style={styles.entry}>
              <LegendMark kind={entry.kind} />
              <AppText variant="footnote" tone="muted">
                {entry.text}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space.m,
  },
  head: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    columnGap: space.m,
    rowGap: 2,
  },
  summary: {
    flexShrink: 1,
  },
  row: {
    gap: 6,
  },
  // At large text sizes the value wraps below the label.
  rowHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    columnGap: space.m,
  },
  value: {
    marginLeft: 'auto',
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: 4,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 5,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderWidth: 1,
  },
  swatchGap: {
    borderStyle: 'dashed',
  },
});
