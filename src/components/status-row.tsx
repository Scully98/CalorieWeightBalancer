import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from './app-text';
import { border, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

export type Status = 'found' | 'missing';

type StatusIconProps = {
  status: Status;
};

export function StatusIcon({ status }: StatusIconProps) {
  const colors = useColors();
  const { fontScale } = useWindowDimensions();
  const size = Math.round(22 * fontScale);

  return (
    <View
      style={[
        styles.icon,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.foreground,
          borderStyle: status === 'found' ? 'solid' : 'dashed',
          backgroundColor:
            status === 'found' ? colors.foreground : colors.background,
        },
      ]}
    >
      {status === 'found' && (
        <AppText variant="caption" tone="inverse" style={styles.check}>
          ✓
        </AppText>
      )}
    </View>
  );
}

type StatusRowProps = {
  status: Status;
  label: string;
  detail: string;
  accessibilityLabel: string;
};

export function StatusRow({
  status,
  label,
  detail,
  accessibilityLabel,
}: StatusRowProps) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.row}>
      <StatusIcon status={status} />
      <AppText style={styles.label}>{label}</AppText>
      <AppText variant="secondary" tone="muted" style={styles.detail}>
        {detail}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    borderWidth: border.thick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space.m,
    rowGap: space.xs,
    paddingVertical: space.s,
  },
  label: {
    flexShrink: 1,
  },
  detail: {
    flexShrink: 1,
    marginLeft: 'auto',
    textAlign: 'right',
  },
});
