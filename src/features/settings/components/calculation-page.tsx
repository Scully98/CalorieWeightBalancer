import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Headline } from '@/components/headline';
import { LinkButton } from '@/components/link-button';
import { calculationSections } from '@/features/settings/calculation-sections';
import { formatLocale } from '@/i18n';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Settings → Wie wird gerechnet?
export function CalculationPage() {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinkButton label={t('settings.back')} onPress={router.back} />
        <Headline title={t('calculation.title')} />
        {calculationSections(t, formatLocale()).map((section) => (
          <View key={section.key} style={styles.section}>
            <AppText variant="bodyStrong" accessibilityRole="header">
              {section.title}
            </AppText>
            <AppText>{section.body}</AppText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingVertical: space.l,
    gap: space.xl,
  },
  section: {
    gap: space.xs,
  },
});
