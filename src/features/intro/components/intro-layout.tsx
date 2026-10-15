import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinkButton } from '@/components/link-button';
import { PageIndicator } from '@/components/page-indicator';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

export const INTRO_STEPS = 4;

type IntroLayoutProps = {
  // 0-based step for the page indicator.
  step: number;
  onSkip?: () => void;
  footer: ReactNode;
  children: ReactNode;
};

export function IntroLayout({
  step,
  onSkip,
  footer,
  children,
}: IntroLayoutProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  // At large text sizes a pinned footer would cover most of the screen, so it
  // scrolls with the content instead.
  const footerInScroll = fontScale > 1.3;
  const footerView = (
    <View style={footerInScroll ? styles.footerInScroll : styles.footer}>
      {footer}
    </View>
  );

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={styles.header}>
          <PageIndicator
            count={INTRO_STEPS}
            index={step}
            accessibilityLabel={t('common.stepOf', {
              current: step + 1,
              count: INTRO_STEPS,
            })}
          />
          {onSkip ? (
            <LinkButton label={t('common.skip')} onPress={onSkip} />
          ) : null}
        </View>
        <ScrollView
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {children}
          {footerInScroll ? footerView : null}
        </ScrollView>
        {footerInScroll ? null : footerView}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.l,
    paddingBottom: space.xl,
    gap: space.l,
  },
  footerInScroll: {
    paddingTop: space.m,
    gap: space.s,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.m,
    paddingBottom: space.m,
    gap: space.s,
  },
});
