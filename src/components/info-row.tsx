import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { space } from '@/theme/spacing';

type InfoRowProps = {
  label: string;
  detail?: string;
  // Replaces the detail, e.g. with an input.
  children?: ReactNode;
};

export function InfoRow({ label, detail, children }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <AppText style={styles.label}>{label}</AppText>
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: space.m,
    rowGap: space.xs,
    paddingVertical: space.m,
  },
  label: {
    flexShrink: 1,
  },
  detail: {
    flexShrink: 1,
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  detailText: {
    textAlign: 'right',
  },
});
