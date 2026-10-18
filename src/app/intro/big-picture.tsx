import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Headline } from '@/components/headline';
import { formatNumber, formatSigned } from '@/core/format';
import { IntroLayout } from '@/features/intro/components/intro-layout';
import { MonthGridIllustration } from '@/features/intro/components/month-grid-illustration';
import { formatLocale } from '@/i18n';
import { space } from '@/theme/spacing';

// Intro step 3b. The numbers are a fixed illustration: 6.200 kcal ÷ 7.700 ≈ 0,8 kg fat.
export default function IntroBigPictureScreen() {
  const { t } = useTranslation();
  const locale = formatLocale();

  return (
    <IntroLayout
      step={1}
      onSkip={() => router.push('/intro/health')}
      footer={
        <Button
          label={t('common.next')}
          onPress={() => router.push('/intro/health')}
        />
      }
    >
      <Headline
        title={t('intro.bigPicture.title')}
        subline={t('intro.bigPicture.body')}
      />
      <MonthGridIllustration />
      <AppText variant="secondary" tone="muted">
        {t('intro.bigPicture.footer')}
      </AppText>
      <View style={styles.indicator}>
        <AppText variant="secondary">{t('intro.bigPicture.total')}</AppText>
        <AppText variant="numberLarge">
          {formatSigned(-6200, locale)} kcal
        </AppText>
        
        <AppText variant="secondary" tone="muted">
          {t('intro.bigPicture.fat')}
          <AppText>
          ≈ {formatNumber(0.8, locale, 1)} kg
          </AppText>
           {t('intro.bigPicture.theoretical')}
        </AppText>
      </View>
    </IntroLayout>
  );
}

const styles = StyleSheet.create({
  indicator: {
    alignItems: 'center',
    marginTop: space.xxl,
  },
  fat: {
    marginTop: space.s,
  },
});
