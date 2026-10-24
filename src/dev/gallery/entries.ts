import type { ScenarioId } from '@/dev/demo/scenarios';

// What the screen should show besides the data. The new home screen reads
// these later; until then only `colorScheme` and the hint take effect.
export type GalleryUi = {
  colorScheme?: 'dark';
  tolerance?: { foodPercent: number; burnPercent: number; open: boolean };
  sheet?: 'incompleteDays';
  tooltip?: 'lastEstimatedDay';
  // Days before today; „Bis“ is being edited.
  picker?: { fromDaysAgo: number; toDaysAgo: number; editing: 'from' | 'to' };
  part?: 'abgleich';
  // Shown above the screen, for presets the app can't set itself.
  hint?: string;
};

export type GalleryEntry = {
  // Design ID from Kcalwaage Homepage.dc.html, or L1 for gaps.
  id: string;
  title: string;
  scenario: ScenarioId;
  ui?: GalleryUi;
};

export const GALLERY_ENTRIES: readonly GalleryEntry[] = [
  { id: '1a', title: '30 T · ohne Toleranz · hell', scenario: 'normal30' },
  {
    id: '1b',
    title: 'Dark Mode · invertiert',
    scenario: 'normal30',
    ui: { colorScheme: 'dark' },
  },
  {
    id: '1c',
    title: 'Toleranz aufgeklappt · Spanne im Hero',
    scenario: 'normal30',
    ui: { tolerance: { foodPercent: 5, burnPercent: 10, open: true } },
  },
  { id: '1d', title: '90 T · Wochenbalken (Ø kcal/Tag)', scenario: 'long90' },
  {
    id: '1e',
    title: '7 T · Abgleich gesperrt (zu wenig Messungen)',
    scenario: 'short7',
  },
  {
    id: '1f',
    title: 'Leerer Zustand · keine Health-Daten',
    scenario: 'empty',
  },
  {
    id: '1g',
    title: 'Sheet „Unvollständige Tage“',
    scenario: 'normal30',
    ui: { sheet: 'incompleteDays' },
  },
  {
    id: '1h',
    title: 'Chart-Tooltip auf geschätztem Tag',
    scenario: 'normal30',
    ui: { tooltip: 'lastEstimatedDay' },
  },
  {
    id: '1i',
    title: 'Große Dynamic-Type-Stufe (≈ AX1, 140 %)',
    scenario: 'normal30',
    ui: { hint: 'Textgröße am Gerät auf AX1 stellen (≈ 140 %)' },
  },
  {
    id: '1j',
    title: 'Abgleich „Passt gut“',
    scenario: 'goodFit30',
    ui: { part: 'abgleich' },
  },
  {
    id: '1k',
    title: 'Keine Körperfett-Daten · nur Gewicht',
    scenario: 'noBodyFat30',
    ui: { part: 'abgleich' },
  },
  {
    id: '1l',
    title: 'Zu wenig Messungen (7 T)',
    scenario: 'short7',
    ui: { part: 'abgleich' },
  },
  {
    id: '1m',
    title: '„Eigener“ · Datumsbereich-Picker',
    scenario: 'normal30',
    ui: { picker: { fromDaysAgo: 18, toDaysAgo: 4, editing: 'to' } },
  },
  { id: 'L1', title: 'Lücken (nicht im Design)', scenario: 'gaps30' },
];

// Presets the current balance screen can't show yet.
export function hasPendingUi(entry: GalleryEntry): boolean {
  const ui = entry.ui ?? {};
  return Boolean(
    ui.tolerance || ui.sheet || ui.tooltip || ui.picker || ui.part,
  );
}
