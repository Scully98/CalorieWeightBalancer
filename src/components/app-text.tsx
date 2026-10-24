import { Text, type TextProps } from 'react-native';

import { typography, type TextVariant } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

// iOS grows titles less than body text at accessibility sizes; React Native
// scales all text alike, so large styles are capped to keep words intact.
const MAX_FONT_SCALE: Partial<Record<TextVariant, number>> = {
  largeTitle: 1.6,
  screenTitle: 2,
  sectionTitle: 2,
  number: 2,
  numberLarge: 1.5,
  hero: 1.2,
  heroRange: 1.2,
  heroUnit: 1.4,
  heroRangeUnit: 1.4,
};

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

  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE[variant]}
      style={[typography[variant], { color }, style]}
      {...rest}
    />
  );
}
