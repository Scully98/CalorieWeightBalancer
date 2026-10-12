import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/theme/use-colors';

export default function HelloScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.foreground }}>Hello Kcalwaage</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
