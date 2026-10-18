import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Headline } from '@/components/headline';
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
      <Headline
        title={t('intro.vision.title')}
        subline={t('intro.vision.body')}
      />
      <BalanceBarsIllustration />
      <AppText variant="secondary" tone="muted">
        {t('intro.vision.footer')}
      </AppText>
    </IntroLayout>
  );
}
