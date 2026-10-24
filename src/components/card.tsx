import { StyleSheet, View, type ViewProps } from 'react-native';

import { border, radius, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type CardProps = ViewProps & {
  variant?: 'solid' | 'dashed';
};

export function Card({ variant = 'solid', style, ...rest }: CardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        { borderColor: colors.foreground, borderStyle: variant },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: border.thick,
    borderRadius: radius.card,
    padding: space.l,
    gap: space.s,
  },
});
