import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { incompleteDays, type IncompleteGroup } from '../quality';
import { AppText } from '@/components/app-text';
import { LinkButton } from '@/components/link-button';
import { QualitySwatch } from '@/components/quality-pattern';
import type { DayBalance } from '@/core/day-balance';
import type { Settings } from '@/core/settings';
import { formatLocale } from '@/i18n';
import { space } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type IncompleteDaysSheetProps = {
  days: readonly DayBalance[];
  settings: Pick<Settings, 'zeroDaysAsMaintenance'>;
  onClose: () => void;
};

// Distance of the sheet from the top of the safe area (design 1g).
const TOP = 64;

// „Unvollständige Tage“ (design 1g): one group per flag with its days.
export function IncompleteDaysSheet({
  days,
  settings,
  onClose,
}: IncompleteDaysSheetProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const sheet = incompleteDays(days, settings, formatLocale(), t);

  function enterBodyData() {
    onClose();
    router.push('/settings/resting-estimate');
  }

  const group = (item: IncompleteGroup) => (
    <View key={item.flag} style={styles.group}>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={item.spokenTitle}
        style={styles.groupHeader}
      >
        <QualitySwatch flag={item.flag} size={13} />
        <AppText variant="bodyStrong" style={styles.groupTitle}>
          {item.title}
        </AppText>
        <AppText tone="muted">{item.count}</AppText>
      </View>
      <AppText variant="footnote" tone="muted">
        {item.description}
      </AppText>
      {item.flag === 'noResting' ? (
        <View style={styles.link}>
          <LinkButton
            label={t('incomplete.noResting.link')}
            onPress={enterBodyData}
          />
        </View>
      ) : null}
      <View style={[styles.list, { borderTopColor: colors.separator }]}>
        {item.rows.map((row) => (
          <View
            key={row.date}
            accessible
            style={[styles.row, { borderBottomColor: colors.separator }]}
          >
            <AppText variant="secondary" style={styles.rowDate}>
              {row.label}
            </AppText>
            <AppText variant="detail" tone="muted">
              {row.detail}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait']}
    >
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
      />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
        style={[
          styles.sheet,
          { top: insets.top + TOP, backgroundColor: colors.background },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.muted }]} />
        <View style={styles.header}>
          <View style={styles.titles}>
            <AppText variant="sectionTitle" accessibilityRole="header">
              {t('incomplete.title')}
            </AppText>
            <AppText variant="secondary" tone="muted">
              {sheet.subtitle}
            </AppText>
          </View>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onClose}>
            <AppText variant="bodyStrong">{t('incomplete.done')}</AppText>
          </Pressable>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 30 },
          ]}
        >
          {sheet.groups.map(group)}
          <AppText variant="footnote" tone="muted">
            {t('incomplete.note')}
          </AppText>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    opacity: 0.5,
    alignSelf: 'center',
    marginTop: 6,
  },
  // At large text sizes „Fertig“ moves below the title.
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.m,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: space.m,
  },
  titles: {
    flexGrow: 1,
    flexBasis: '60%',
    gap: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: space.xs,
    paddingHorizontal: 20,
    gap: space.xl,
  },
  group: {
    gap: 6,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  groupTitle: {
    flex: 1,
  },
  link: {
    alignItems: 'flex-start',
  },
  list: {
    marginTop: space.xs,
    borderTopWidth: 1,
  },
  row: {
    gap: 2,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowDate: {
    fontWeight: '600',
  },
});
