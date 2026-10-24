import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './app-text';
import { space, touchTarget } from '@/theme/spacing';

type InfoRowProps = {
  label: string;
  detail?: string;
  // Replaces the detail, e.g. with an input.
  children?: ReactNode;
};

export function InfoRow({ label, detail, children }: InfoRowProps) {
  return (
    <View style={[styles.row, children ? styles.controlRow : null]}>
      <View style={[styles.label, children ? styles.controlLabel : null]}>
        <AppText>{label}</AppText>
      </View>
      <View style={styles.detail}>
        {children ?? (
          <AppText variant="secondary" tone="muted" style={styles.detailText}>
            {detail}
          </AppText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Label and detail always stay side by side; the label wraps first.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
    paddingVertical: space.m,
  },
  // With a control the row aligns to the top, so a hint below the control
  // does not move the label; the label is centered on the control's height.
  controlRow: {
    alignItems: 'flex-start',
  },
  label: {
    flex: 1,
  },
  controlLabel: {
    minHeight: touchTarget,
    justifyContent: 'center',
  },
  detail: {
    flexShrink: 0,
    // Keeps a long detail from squeezing the label to nothing.
    maxWidth: '60%',
    alignItems: 'flex-end',
  },
  detailText: {
    textAlign: 'right',
  },
});
