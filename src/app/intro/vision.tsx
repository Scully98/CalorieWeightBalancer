import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { BalanceBarsIllustration } from '@/features/intro/components/balance-bars-illustration';
import { IntroLayout } from '@/features/intro/components/intro-layout';

// Intro step 3a.
export default function IntroVisionScreen() {
  const { t } = useTranslation();

  return (
    <IntroLayout
      step={0}
      onSkip={() => router.push('/intro/health')}
      footer={
        <Button
          label={t('common.next')}
          onPress={() => router.push('/intro/big-picture')}
        />
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {t('intro.vision.title')}
      </AppText>
      <AppText>{t('intro.vision.body')}</AppText>
      <BalanceBarsIllustration />
      <AppText variant="secondary" tone="muted">
        {t('intro.vision.footer')}
      </AppText>
    </IntroLayout>
  );
}
