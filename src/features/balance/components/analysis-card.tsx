import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  analysisCardModel,
  type AnalysisColumn as Column,
} from '../analysis-card';
import type { BalanceReport } from '../use-balance';
import { AppText } from '@/components/app-text';
import { formatLocale } from '@/i18n';
import { border, space, touchTarget } from '@/theme/spacing';
import { useColors } from '@/theme/use-colors';

type AnalysisCardProps = Pick<BalanceReport, 'analysis' | 'days'>;

// „Passt die Bilanz zur Waage?“: the balance against the energy the scale
// measured, in the four states of the core.
export function AnalysisCard({ analysis, days }: AnalysisCardProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const model = analysisCardModel(analysis, days, formatLocale(), t);
  const { body } = model;
  const dashed = [styles.dashed, { borderColor: colors.foreground }];

  const column = ({ label, value, lines, spoken }: Column) => (
    <View
      accessible
      accessibilityLabel={spoken}
      style={[styles.column, { borderTopColor: colors.foreground }]}
    >
      <AppText variant="overline" tone="muted">
        {label}
      </AppText>
      <AppText variant="cardValue">{value}</AppText>
      {lines.map((line) =>
        line.small ? (
          <AppText
            key={line.text}
            variant="footnote"
            tone="muted"
            style={styles.small}
          >
            {line.text}
          </AppText>
        ) : (
          <AppText key={line.text} variant="secondary">
            {line.text}
            {line.note ? (
              <AppText variant="footnote" tone="muted">
                {' '}
                {line.note}
              </AppText>
            ) : null}
          </AppText>
        ),
      )}
    </View>
  );

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
        <View style={styles.columns}>
          {column(body.balance)}
          {column(body.scale)}
        </View>
        {body.kind === 'weightOnly' ? (
          <View style={dashed}>
            <AppText variant="secondary" style={styles.paragraph}>
              {body.note}
            </AppText>
          </View>
        ) : (
          <>
            {body.verdict ? (
              <AppText variant="secondary" style={styles.paragraph}>
                {body.verdict}
              </AppText>
            ) : null}
            <View
              style={[styles.separator, { backgroundColor: colors.separator }]}
            />
            <View
              accessible
              accessibilityLabel={body.burn.spoken}
              style={styles.burn}
            >
              <AppText variant="secondary">{body.burn.label}</AppText>
              <View style={styles.burnRow}>
                <AppText variant="burnNumber">{body.burn.value}</AppText>
                <AppText variant="burnUnit">{body.burn.unit}</AppText>
              </View>
              <AppText variant="secondary" tone="muted">
                {body.burn.detail}
              </AppText>
            </View>
            <View style={styles.explanation}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpen(!open)}
                style={styles.toggle}
              >
                <AppText variant="secondary" style={styles.strong}>
                  {body.explanation.toggle}
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
                <View style={styles.explanationBody}>
                  <AppText variant="secondary" style={styles.paragraph}>
                    {body.explanation.text}
                  </AppText>
                  <AppText variant="footnote" tone="muted">
                    {body.explanation.formula}
                  </AppText>
                </View>
              ) : null}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

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
    gap: space.l,
  },
  dimmed: {
    opacity: 0.3,
  },
  // Two columns; at large text sizes they wrap.
  columns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.l,
  },
  column: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 130,
    gap: 3,
    borderTopWidth: border.medium,
    paddingTop: space.s,
  },
  small: {
    marginTop: -2,
  },
  paragraph: {
    lineHeight: 21,
  },
  strong: {
    fontWeight: '600',
  },
  separator: {
    height: 1,
  },
  burn: {
    gap: space.xs,
  },
  burnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: space.s,
  },
  explanation: {
    gap: space.s,
  },
  toggle: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s,
  },
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: border.thick,
    borderBottomWidth: border.thick,
  },
  chevronDown: {
    transform: [{ translateY: -2 }, { rotate: '45deg' }],
  },
  chevronUp: {
    transform: [{ translateY: 2 }, { rotate: '-135deg' }],
  },
  explanationBody: {
    gap: 6,
  },
});
