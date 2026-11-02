import { StyleSheet, View } from 'react-native';

import type { BurnDifference as Model, BurnPoint } from '../analysis-card';
import { AppText } from '@/components/app-text';
import { border, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

const DOT = 14;
const TARGET = 28;

function Dot({ filled }: { filled: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.dot,
        {
          borderColor: colors.foreground,
          backgroundColor: filled ? colors.foreground : colors.background,
        },
      ]}
    />
  );
}

function Label({ point }: { point: BurnPoint }) {
  return (
    <View style={styles.label}>
      <AppText
        variant="footnote"
        tone={point.actual ? undefined : 'muted'}
        style={point.actual ? styles.strong : undefined}
      >
        {point.label}
      </AppText>
      <AppText
        variant="footnote"
        tone={point.actual ? undefined : 'muted'}
        style={point.actual ? styles.strong : undefined}
      >
        {point.value}
      </AppText>
    </View>
  );
}

// Tracker against actual burn: two points on a line of fixed length, the lower
// value on the left. When they round alike, a target instead. Read as one
// element with the burn number above.
export function BurnDifference({ model }: { model: Model }) {
  const colors = useColors();

  if (model.kind === 'match')
    return (
      <View style={styles.match}>
        <View style={[styles.target, { borderColor: colors.foreground }]}>
          <View
            style={[styles.bullseye, { backgroundColor: colors.foreground }]}
          />
        </View>
        <AppText variant="secondary" tone="muted">
          {model.tracker}
        </AppText>
      </View>
    );

  return (
    <View style={styles.line}>
      <AppText variant="bodyStrong" style={styles.center}>
        {model.difference}
      </AppText>
      <View style={styles.track}>
        <View style={[styles.rule, { backgroundColor: colors.foreground }]} />
        <Dot filled={model.lower.actual} />
        <Dot filled={model.upper.actual} />
      </View>
      <View style={styles.labels}>
        <Label point={model.lower} />
        <Label point={model.upper} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  match: {
    alignItems: 'center',
    gap: space.s,
  },
  target: {
    width: TARGET,
    height: TARGET,
    borderRadius: TARGET / 2,
    borderWidth: border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullseye: {
    width: TARGET / 2 - 1,
    height: TARGET / 2 - 1,
    borderRadius: TARGET / 2,
  },
  line: {
    gap: space.xs,
    paddingHorizontal: space.xl,
  },
  center: {
    textAlign: 'center',
  },
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: DOT,
  },
  // Dots are drawn over it and hide its ends.
  rule: {
    position: 'absolute',
    left: DOT / 2,
    right: DOT / 2,
    height: border.thick,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: border.thick,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.m,
    marginHorizontal: -space.m,
  },
  label: {
    alignItems: 'center',
    flexShrink: 1,
  },
  strong: {
    fontWeight: '600',
  },
});
