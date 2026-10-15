import { View } from 'react-native';

import { StatusRow } from '@/components/status-row';
import type { FoundRow } from '@/features/intro/found-rows';

type FoundListProps = {
  rows: FoundRow[];
};

export function FoundList({ rows }: FoundListProps) {
  return (
    <View>
      {rows.map((row) => (
        <StatusRow
          key={row.key}
          status={row.status}
          label={row.label}
          detail={row.detail}
          accessibilityLabel={row.accessibilityLabel}
        />
      ))}
    </View>
  );
}
