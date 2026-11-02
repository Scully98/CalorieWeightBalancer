import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  calendarMonth,
  clampSelection,
  monthTitle,
  pickDay,
  pickerBounds,
  selectionSummary,
  spokenDate,
  type CalendarCell,
  type DateRangeSelection,
} from '../date-range';
import { numericDate } from '../period-subtitle';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { fromDateKey } from '@/core/day-record';
import { useHealthSource } from '@/health/source-context';
import { formatLocale } from '@/i18n';
import { border, space, touchTarget } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type DateRangeSheetProps = {
  // Start values; mounted fresh each time the sheet opens.
  initial: DateRangeSelection;
  includeToday: boolean;
  onApply: (from: string, to: string) => void;
  onCancel: () => void;
};

type FirstData = { status: 'loading' } | { status: 'done'; date?: Date };

function monthOf(key: string) {
  const date = fromDateKey(key) as Date;
  return { year: date.getFullYear(), month: date.getMonth() };
}

// „Eigener Zeitraum“ (design 1m): Von/Bis, a month calendar from the first
// data point to yesterday, „Übernehmen“. Nothing changes until then.
export function DateRangeSheet({
  initial,
  includeToday,
  onApply,
  onCancel,
}: DateRangeSheetProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const locale = formatLocale();
  const insets = useSafeAreaInsets();
  const source = useHealthSource();
  const [now] = useState(() => new Date());
  const [firstData, setFirstData] = useState<FirstData>({ status: 'loading' });
  const [picked, setPicked] = useState(initial);
  const [shown, setShown] = useState(() => monthOf(initial.to));

  useEffect(() => {
    let active = true;
    source.firstDataDate().then(
      (date) => active && setFirstData({ status: 'done', date }),
      () => active && setFirstData({ status: 'done' }),
    );
    return () => {
      active = false;
    };
  }, [source]);

  // Until the first data point is known, nothing before the start is open.
  const bounds =
    firstData.status === 'done'
      ? pickerBounds(firstData.date, now, includeToday)
      : {
          ...pickerBounds(undefined, now, includeToday),
          min: initial.from,
        };
  const selection = clampSelection(picked, bounds);
  const month = calendarMonth(shown.year, shown.month, bounds, selection, now);
  const summary = selectionSummary(
    selection,
    bounds,
    includeToday,
    now,
    locale,
    t,
  );

  function editField(editing: 'from' | 'to') {
    setPicked({ ...selection, editing });
    setShown(monthOf(selection[editing]));
  }

  function page(step: -1 | 1) {
    const next = new Date(shown.year, shown.month + step, 1);
    setShown({ year: next.getFullYear(), month: next.getMonth() });
  }

  const field = (editing: 'from' | 'to') => {
    const active = selection.editing === editing;
    const label = t(editing === 'from' ? 'picker.from' : 'picker.to');
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('picker.field', {
          label,
          date: spokenDate(selection[editing], t),
        })}
        accessibilityState={{ selected: active }}
        onPress={() => editField(editing)}
        style={[
          styles.field,
          active
            ? { borderColor: colors.foreground, borderWidth: border.thick }
            : { borderColor: colors.separator, borderWidth: border.medium },
        ]}
      >
        <AppText variant="caption" tone="muted" style={styles.fieldLabel}>
          {label}
        </AppText>
        <AppText variant="bodyStrong">
          {numericDate(selection[editing], locale)}
        </AppText>
      </Pressable>
    );
  };

  const arrow = (step: -1 | 1, enabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(step < 0 ? 'picker.prevMonth' : 'picker.nextMonth')}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={() => page(step)}
      style={[styles.arrow, { opacity: enabled ? 1 : 0.25 }]}
    >
      <View
        style={[
          styles.chevron,
          step < 0 ? styles.chevronBack : styles.chevronForward,
          { borderColor: colors.foreground },
        ]}
      />
    </Pressable>
  );

  const dayCell = (cell: CalendarCell) => {
    const end = cell.isStart || cell.isEnd;
    const ranged = selection.from < selection.to;
    return (
      <Pressable
        key={cell.key}
        accessibilityRole="button"
        accessibilityLabel={spokenDate(cell.key, t)}
        accessibilityState={{ selected: end, disabled: !cell.selectable }}
        disabled={!cell.selectable}
        onPress={() => setPicked(pickDay(selection, cell.key, bounds))}
        style={styles.cell}
      >
        {/* The band runs between start and end, half cells at both. */}
        {cell.inRange ? (
          <View style={[styles.band, { backgroundColor: colors.band }]} />
        ) : null}
        {cell.isStart && ranged ? (
          <View
            style={[
              styles.band,
              styles.bandRight,
              { backgroundColor: colors.band },
            ]}
          />
        ) : null}
        {cell.isEnd && ranged ? (
          <View
            style={[
              styles.band,
              styles.bandLeft,
              { backgroundColor: colors.band },
            ]}
          />
        ) : null}
        <View
          style={[
            styles.day,
            end && { backgroundColor: colors.foreground },
            cell.isToday &&
              !end && [styles.today, { borderColor: colors.foreground }],
            { opacity: cell.selectable || end ? 1 : 0.3 },
          ]}
        >
          <AppText
            tone={end ? 'inverse' : 'foreground'}
            // The grid keeps its size; the month stays usable at AX sizes.
            maxFontSizeMultiplier={1.4}
            style={[
              styles.dayText,
              (end || cell.isToday) && styles.dayTextStrong,
            ]}
          >
            {cell.day}
          </AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      supportedOrientations={['portrait']}
    >
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={onCancel}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
      />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onCancel}
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + space.l,
          },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.muted }]} />
        <View style={styles.header}>
          <AppText
            variant="sectionTitle"
            accessibilityRole="header"
            style={styles.title}
          >
            {t('picker.title')}
          </AppText>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onCancel}>
            <AppText>{t('picker.cancel')}</AppText>
          </Pressable>
        </View>
        {/* At accessibility text sizes the calendar is taller than the screen. */}
        <ScrollView
          bounces={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.fields}>
            {field('from')}
            {field('to')}
          </View>
          <View style={styles.calendar}>
            <View style={styles.monthRow}>
              {arrow(-1, month.canGoBack)}
              <AppText variant="bodyStrong" accessibilityRole="header">
                {monthTitle(shown.year, shown.month, t)}
              </AppText>
              {arrow(1, month.canGoForward)}
            </View>
            <View
              style={styles.week}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              {t('date.weekdaysShort')
                .split(' ')
                .map((weekday) => (
                  <AppText
                    key={weekday}
                    variant="caption"
                    tone="muted"
                    style={styles.weekday}
                  >
                    {weekday}
                  </AppText>
                ))}
            </View>
            <View style={styles.grid}>
              {Array.from({ length: month.blanks }, (_, index) => (
                <View key={`blank-${index}`} style={styles.cell} />
              ))}
              {month.cells.map(dayCell)}
            </View>
          </View>
          <View style={styles.summary}>
            <AppText variant="bodyStrong">{summary.days}</AppText>
            <AppText variant="footnote" tone="muted">
              {summary.caption}
            </AppText>
          </View>
          <Button
            label={t('picker.apply')}
            onPress={() => onApply(selection.from, selection.to)}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

// Slightly under 100 / 7, so rounding never pushes Sunday into the next row.
const CELL = '14.28%';

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '92%',
    paddingTop: 6,
    paddingHorizontal: 20,
    gap: space.l,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    gap: space.l,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    opacity: 0.5,
    alignSelf: 'center',
  },
  // At large text sizes „Abbrechen“ moves below the title.
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.m,
  },
  title: {
    flexGrow: 1,
    flexBasis: '60%',
  },
  fields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    flexGrow: 1,
    flexBasis: 130,
    borderRadius: 12,
    paddingVertical: space.s,
    paddingHorizontal: space.m,
    gap: 2,
  },
  fieldLabel: {
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  calendar: {
    gap: 6,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 9,
    height: 9,
    transform: [{ rotate: '45deg' }],
  },
  chevronBack: {
    borderLeftWidth: border.thick,
    borderBottomWidth: border.thick,
    marginLeft: 4,
  },
  chevronForward: {
    borderRightWidth: border.thick,
    borderTopWidth: border.thick,
    marginRight: 4,
  },
  week: {
    flexDirection: 'row',
  },
  weekday: {
    width: CELL,
    textAlign: 'center',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 2,
  },
  cell: {
    width: CELL,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  band: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  bandRight: {
    left: '50%',
  },
  bandLeft: {
    right: '50%',
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: border.medium,
    borderStyle: 'dashed',
  },
  dayText: {
    fontSize: 16,
  },
  dayTextStrong: {
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: space.s,
  },
});
