import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useColors } from '@/theme/use-colors';

export const unstable_settings = {
  initialRouteName: 'vision',
};

export default function IntroStackLayout() {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: t('common.introTitle'),
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
