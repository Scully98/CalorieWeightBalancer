import { StyleSheet, View } from 'react-native';

import type { TooltipModel } from '../chart-tooltip';
import { AppText } from '@/components/app-text';
import { border } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type ChartTooltipProps = {
  model: TooltipModel;
  left: number;
  width: number;
};

// Values of the selected day, week or today above the chart. Not touchable:
// the chart below keeps the gesture. VoiceOver reads the chart's value.
export function ChartTooltip({ model, left, width }: ChartTooltipProps) {
  const colors = useColors();

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.card,
        {
          left,
          width,
          backgroundColor: colors.background,
          borderColor: colors.foreground,
        },
      ]}
    >
      <AppText variant="detail" style={styles.title}>
        {model.title}
      </AppText>
      {model.badge ? (
        <View style={[styles.badge, { borderColor: colors.foreground }]}>
          <AppText variant="caption2" style={styles.badgeText}>
            {model.badge}
          </AppText>
        </View>
      ) : null}
      {model.rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <AppText variant="footnote" style={row.strong && styles.strong}>
            {row.label}
          </AppText>
          <AppText
            variant="footnote"
            style={[styles.value, row.strong && styles.strong]}
          >
            {row.value}
          </AppText>
        </View>
      ))}
      <AppText
        variant="caption"
        tone="muted"
        style={[styles.footer, { borderTopColor: colors.separator }]}
      >
        {model.footer}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 14,
    borderWidth: border.medium,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  title: {
    fontWeight: '600',
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: border.thin,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
  strong: {
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 4,
    marginTop: 2,
  },
});
