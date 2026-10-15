import { Text, type TextProps } from 'react-native';

import { typography, type TextVariant } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

export type TextTone = 'foreground' | 'muted' | 'inverse';

type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

export function AppText({
  variant = 'body',
  tone = 'foreground',
  style,
  ...rest
}: AppTextProps) {
  const colors = useColors();
  const color =
    tone === 'muted'
      ? colors.muted
      : tone === 'inverse'
        ? colors.background
        : colors.foreground;

  return <Text style={[typography[variant], { color }, style]} {...rest} />;
}
