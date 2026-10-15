import { StyleSheet, Text, View } from 'react-native';

import { LinkButton } from '@/components/link-button';
import { resetIntro } from '@/storage/settings';
import { useColors } from '@/theme/use-colors';

export default function HelloScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.foreground }}>Hello Kcalwaage</Text>
      {__DEV__ ? (
        <LinkButton label="Reset intro (dev)" onPress={resetIntro} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
});
