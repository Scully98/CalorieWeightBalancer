import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinkButton } from '@/components/link-button';

// Placeholder until the page follows (P5 M5/M6).
export default function Placeholder() {
  return (
    <SafeAreaView>
      <LinkButton label="‹" onPress={router.back} />
    </SafeAreaView>
  );
}
