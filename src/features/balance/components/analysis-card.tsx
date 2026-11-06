import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { BurnDifference } from './burn-difference';
import { ComparisonBars } from './comparison-bars';
import { analysisCardModel } from '../analysis-card';
import type { BalanceReport } from '../use-balance';
import { AppText } from '@/components/app-text';
import { formatLocale } from '@/i18n';
import { border, space, touchTarget } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type AnalysisCardProps = Pick<BalanceReport, 'analysis' | 'days'>;

// „Dein tatsächlicher Verbrauch“: the burn the scale implies against the
// tracker, and the balance against the scale, in the four states of the core.
export const AnalysisCard = memo(function AnalysisCard({
  analysis,
  days,
}: AnalysisCardProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const model = analysisCardModel(analysis, days, formatLocale(), t);
  const { body } = model;
  const dashed = [styles.dashed, { borderColor: colors.foreground }];

  return (
    <View style={[styles.card, { borderColor: colors.foreground }]}>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={model.headerLabel}
        style={styles.header}
      >
        <AppText variant="sectionTitle">{model.title}</AppText>
        <AppText variant="footnote" tone="muted">
          {model.subtitle}
        </AppText>
      </View>
      {model.locked ? (
        <View style={dashed}>
          <AppText variant="secondary">{model.locked.hint}</AppText>
          <AppText variant="secondary" style={styles.strong}>
            {model.locked.soFar}
          </AppText>
        </View>
      ) : null}
      {/* While locked the values are a preview: dimmed and not read out. */}
      <View
        accessibilityElementsHidden={model.dimmed}
        importantForAccessibility={
          model.dimmed ? 'no-hide-descendants' : 'auto'
        }
        style={[styles.body, model.dimmed && styles.dimmed]}
      >
        {body.kind === 'weightOnly' ? (
          <>
            <ComparisonBars model={body.comparison} />
            <View style={dashed}>
              <AppText variant="secondary" style={styles.paragraph}>
                {body.note}
              </AppText>
            </View>
          </>
        ) : (
          <>
            <View
              accessible
              accessibilityLabel={body.burn.spoken}
              style={styles.burn}
            >
              <View style={styles.burnRow}>
                <AppText variant="burnNumber">{body.burn.value}</AppText>
                <AppText variant="burnUnit">{body.burn.unit}</AppText>
              </View>
              <BurnDifference model={body.burn.difference} />
            </View>
            <ComparisonBars model={body.comparison} />
            <View style={styles.disclosure}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityValue={
                  open ? undefined : { text: t('a11y.collapsed') }
                }
                onPress={() => setOpen(!open)}
                style={styles.toggle}
              >
                <AppText variant="bodyStrong" style={styles.toggleText}>
                  {body.disclosure.toggle}
                </AppText>
                <View
                  style={[
                    styles.chevron,
                    open ? styles.chevronUp : styles.chevronDown,
                    { borderColor: colors.foreground },
                  ]}
                />
              </Pressable>
              {open ? (
                <View style={styles.details}>
                  {body.disclosure.verdict ? (
                    <AppText variant="secondary" style={styles.paragraph}>
                      {body.disclosure.verdict}
                    </AppText>
                  ) : null}
                  <AppText variant="secondary" style={styles.paragraph}>
                    {body.disclosure.text}
                  </AppText>
                  <AppText variant="footnote" tone="muted">
                    {body.disclosure.formula}
                  </AppText>
                </View>
              ) : null}
            </View>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: border.medium,
    borderRadius: 16,
    padding: space.l,
    gap: space.l,
  },
  header: {
    gap: 2,
  },
  // Dashed means provisional: the locked hint and the weight-only note.
  dashed: {
    borderWidth: border.medium,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: space.m,
    paddingHorizontal: 14,
    gap: space.xs,
  },
  body: {
    gap: space.xl,
  },
  dimmed: {
    opacity: 0.3,
  },
  paragraph: {
    lineHeight: 21,
  },
  strong: {
    fontWeight: '600',
  },
  burn: {
    gap: space.m,
  },
  burnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'center',
    columnGap: space.s,
  },
  disclosure: {
    gap: space.s,
  },
  toggle: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m,
  },
  toggleText: {
    flex: 1,
  },
  chevron: {
    width: 8,
    height: 8,
    marginHorizontal: 2,
    borderRightWidth: border.thick,
    borderBottomWidth: border.thick,
  },
  chevronDown: {
    transform: [{ translateY: -2 }, { rotate: '45deg' }],
  },
  chevronUp: {
    transform: [{ translateY: 2 }, { rotate: '-135deg' }],
  },
  details: {
    gap: space.s,
  },
});
