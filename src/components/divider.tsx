import { StyleSheet, View } from 'react-native';

import { border } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type DividerProps = {
  variant?: 'solid' | 'dashed';
};

// iOS draws dashed borders only on all four sides, so the dashed line is the
// top edge of a dashed box clipped to the line height.
export function Divider({ variant = 'solid' }: DividerProps) {
  const colors = useColors();

  if (variant === 'solid') {
    return (
      <View
        accessible={false}
        style={[styles.solid, { backgroundColor: colors.foreground }]}
      />
    );
  }

  return (
    <View accessible={false} style={styles.clip}>
      <View style={[styles.dashed, { borderColor: colors.muted }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  solid: {
    height: border.thin,
  },
  clip: {
    height: border.thin,
    overflow: 'hidden',
  },
  dashed: {
    height: border.thin * 4,
    borderWidth: border.thin,
    borderStyle: 'dashed',
  },
});
