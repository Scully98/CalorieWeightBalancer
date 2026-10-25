import { useTranslation } from 'react-i18next';

import {
  SegmentedControl,
  type SegmentOption,
} from '@/components/segmented-control';
import {
  PERIOD_PRESETS,
  type Period,
  type PeriodSegment,
  type PresetDays,
} from '@/core/period';
import { useSettings, useSettingsStore } from '@/storage/settings-context';

type SegmentValue = `${PeriodSegment}`;

function segmentOf(period: Period): SegmentValue {
  return period.kind === 'days' ? `${period.days}` : period.kind;
}

type PeriodSegmentsProps = {
  // „Eigener“ opens the date range picker instead of setting a period.
  onPickCustom: () => void;
};

// 7 T · 30 T · 60 T · 90 T · Alles · Eigener. A preset is stored at once and
// reloads the period from Health.
export function PeriodSegments({ onPickCustom }: PeriodSegmentsProps) {
  const { t } = useTranslation();
  const { period } = useSettings();
  const store = useSettingsStore();

  const options: SegmentOption<SegmentValue>[] = PERIOD_PRESETS.map(
    (preset) => {
      if (preset === 'all')
        return {
          value: 'all',
          label: t('home.segments.all'),
          accessibilityLabel: t('home.segments.allSpoken'),
        };
      if (preset === 'custom')
        return {
          value: 'custom',
          label: t('home.segments.custom'),
          accessibilityLabel: t('home.segments.customSpoken'),
        };
      return {
        value: `${preset}`,
        label: t('home.segments.days', { count: preset }),
        accessibilityLabel: t('home.segments.daysSpoken', { count: preset }),
      };
    },
  );

  function select(value: SegmentValue) {
    if (value === 'custom') return onPickCustom();
    store.updateSettings({
      period:
        value === 'all'
          ? { kind: 'all' }
          : { kind: 'days', days: Number(value) as PresetDays },
    });
  }

  return (
    <SegmentedControl
      stretch
      options={options}
      value={segmentOf(period)}
      onChange={select}
      accessibilityLabel={t('home.segments.label')}
    />
  );
}
