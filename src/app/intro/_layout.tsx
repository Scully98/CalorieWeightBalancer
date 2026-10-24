import { Stack } from 'expo-router';

import { useColors } from '@/theme/use-colors';

export const unstable_settings = {
  initialRouteName: 'vision',
};

export default function IntroStackLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
