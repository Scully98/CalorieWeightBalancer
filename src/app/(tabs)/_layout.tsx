import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { useColors } from '@/theme/use-colors';

// Native UITabBar: at accessibility text sizes iOS keeps the labels intact
// and shows them in the Large Content Viewer on long press.
export default function TabsLayout() {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <NativeTabs
      tintColor={colors.foreground}
      iconColor={{ default: colors.muted, selected: colors.foreground }}
      labelStyle={{
        default: { color: colors.muted },
        selected: { color: colors.foreground },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
        />
        <NativeTabs.Trigger.Label>{t('tabs.balance')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
        />
        <NativeTabs.Trigger.Label>
          {t('tabs.settings')}
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
