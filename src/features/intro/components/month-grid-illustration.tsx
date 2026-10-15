import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { border, space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type DayKind = 'minus' | 'pizza' | 'empty';

const ROWS = 3;
const COLUMNS = 10;
// Fixed example from the wireframe, row-major and 0-based.
const EMPTY_DAYS = new Set([5, 21]);
const PIZZA_DAY = 12;
// Diagonal hatch lines, positioned in percent of the cell.
const HATCH_OFFSETS = [
  '-25%',
  '0%',
  '25%',
  '50%',
  '75%',
  '100%',
  '125%',
] as const;

function dayKind(index: number): DayKind {
  if (index === PIZZA_DAY) return 'pizza';
  return EMPTY_DAYS.has(index) ? 'empty' : 'minus';
}

function DayCell({ kind, size }: { kind: DayKind; size?: number }) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.cell,
        size
          ? { width: size, height: size, borderWidth: 1.5 }
          : styles.gridCell,
        {
          borderColor: colors.foreground,
          borderStyle: kind === 'empty' ? 'dashed' : 'solid',
          backgroundColor:
            kind === 'minus' ? colors.foreground : colors.background,
        },
      ]}
    >
      {kind === 'pizza'
        ? HATCH_OFFSETS.map((left) => (
            <View
              key={left}
              style={[
                styles.hatch,
                { left, backgroundColor: colors.foreground },
              ]}
            />
          ))
        : null}
    </View>
  );
}

function LegendItem({ kind, label }: { kind: DayKind; label: string }) {
  return (
    <View style={styles.legendItem}>
      <DayCell kind={kind} size={14} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

// Grid on intro step 3b: 30 days, one pizza night, two days without entry.
export function MonthGridIllustration() {
  const { t } = useTranslation();

  return (
    <View
      accessible
      accessibilityLabel={t('intro.bigPicture.a11y')}
      style={styles.container}
    >
      <View style={styles.grid}>
        {Array.from({ length: ROWS }, (_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: COLUMNS }, (_, column) => (
              <DayCell key={column} kind={dayKind(row * COLUMNS + column)} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <LegendItem kind="minus" label={t('intro.bigPicture.legendMinus')} />
        <LegendItem kind="pizza" label={t('intro.bigPicture.legendPizza')} />
        <LegendItem kind="empty" label={t('intro.bigPicture.legendEmpty')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.m,
  },
  grid: {
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    borderWidth: border.thick,
    borderRadius: 3,
    overflow: 'hidden',
  },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
  },
  hatch: {
    position: 'absolute',
    top: '-50%',
    width: 1.5,
    height: '200%',
    transform: [{ rotate: '45deg' }],
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: space.l,
    rowGap: space.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
});
