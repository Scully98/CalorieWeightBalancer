import { dayValueRow } from '../day-value-rows';

describe('dayValueRow', () => {
  it('shows every value of a day', () => {
    expect(
      dayValueRow(
        {
          date: '2026-10-23',
          food: 2910.4,
          resting: 1802.2,
          restingCoverage: 0.75,
          active: 845,
          weightKg: 82.412,
          bodyFatFraction: 0.2134,
          leanMassKg: 64.851,
        },
        'de-DE',
      ),
    ).toEqual({
      date: '2026-10-23',
      title: 'Fr., 23.10.',
      lines: [
        'Nahrung 2.910 kcal · Ruhe 1.802 kcal (Abdeckung 75 %)',
        'Aktiv 845 kcal',
        'Gewicht 82,41 kg · KFA 21,3 %',
        'Mager 64,85 kg',
      ],
    });
  });

  it('marks missing values and today', () => {
    expect(dayValueRow({ date: '2026-10-24' }, 'de-DE', true)).toEqual({
      date: '2026-10-24',
      title: 'Sa., 24.10. (heute)',
      lines: ['Nahrung – · Ruhe –', 'Aktiv –', 'Gewicht – · KFA –', 'Mager –'],
    });
  });

  it('names the coverage only for partial days', () => {
    const full = dayValueRow(
      { date: '2026-10-23', resting: 1800, restingCoverage: 1 },
      'de-DE',
    );
    expect(full.lines[0]).toBe('Nahrung – · Ruhe 1.800 kcal');
  });
});
