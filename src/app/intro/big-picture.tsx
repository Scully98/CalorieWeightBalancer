import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Headline } from '@/components/headline';
import { formatSigned } from '@/core/format';
import { IntroLayout } from '@/features/intro/components/intro-layout';
import { MonthGridIllustration } from '@/features/intro/components/month-grid-illustration';
import { formatLocale } from '@/i18n';

// Intro step 3b. The numbers are a fixed illustration: −6.200 kcal ÷ 7.700 ≈ −0,8 kg.
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
      <Card>
        <AppText variant="secondary">{t('intro.bigPicture.total')}</AppText>
        <AppText variant="numberLarge">
          {formatSigned(-0.8, locale, 1)} kg
        </AppText>
        <AppText>
          {t('intro.bigPicture.fat', { kcal: formatSigned(-6200, locale) })}{' '}
          <AppText variant="caption" tone="muted">
            {t('intro.bigPicture.theoretical')}
          </AppText>
        </AppText>
      </Card>
      <AppText variant="secondary" tone="muted">
        {t('intro.bigPicture.footer')}
      </AppText>
    </IntroLayout>
  );
}
