import { StyleSheet, View } from 'react-native';

import { AppText } from './app-text';
import { space } from '@/theme/spacing';
import type { TextVariant } from '@/theme/typography';

export type HeadlineLevel = 'h1' | 'h2' | 'h3';

// h1 = screen title, h2 = section title, h3 = iOS Headline.
const TITLE_VARIANT: Record<HeadlineLevel, TextVariant> = {
  h1: 'screenTitle',
  h2: 'sectionTitle',
  h3: 'bodyStrong',
};

const SUBLINE_VARIANT: Record<HeadlineLevel, TextVariant> = {
  h1: 'body',
  h2: 'body',
  h3: 'secondary',
};

type HeadlineProps = {
  level?: HeadlineLevel;
  title: string;
  subline?: string;
};

export function Headline({ level = 'h1', title, subline }: HeadlineProps) {
  return (
    <View style={styles.container}>
      <AppText variant={TITLE_VARIANT[level]} accessibilityRole="header">
        {title}
      </AppText>
      {subline ? (
        <AppText variant={SUBLINE_VARIANT[level]}>{subline}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
    marginBottom: space.s,
  },
});
