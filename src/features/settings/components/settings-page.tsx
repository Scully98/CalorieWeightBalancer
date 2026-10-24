import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TypeSpecimen } from './type-specimen';
import { AppText } from '@/components/app-text';
import { Divider } from '@/components/divider';
import { LinkButton } from '@/components/link-button';
import { resetIntro } from '@/storage/settings';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

// Placeholder until period, tolerance and zero days move here (step 6).
export function SettingsPage() {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="largeTitle" accessibilityRole="header">
          {t('settings.title')}
        </AppText>
        <AppText tone="muted">{t('settings.placeholder')}</AppText>
        {__DEV__ ? (
          <View style={styles.dev}>
            <Divider />
            <LinkButton label="Reset intro (dev)" onPress={resetIntro} />
            <TypeSpecimen />
          </View>
        ) : null}
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
    gap: space.l,
  },
  dev: {
    gap: space.l,
  },
});
