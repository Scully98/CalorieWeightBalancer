import { createInstance } from 'i18next';

import { emptyKind, emptyModel } from '../empty';
import { de } from '@/i18n/locales/de';
import { en } from '@/i18n/locales/en';

const i18n = createInstance();
i18n.init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: 'de',
  initAsync: false,
  interpolation: { escapeValue: false },
});
const tDe = i18n.getFixedT('de');
const tEn = i18n.getFixedT('en');

const NOW = new Date(2026, 9, 25, 14, 32);

describe('emptyKind', () => {
  it('tells no data, an empty period and the first day apart', () => {
    expect(emptyKind(undefined, NOW)).toBe('noData');
    expect(emptyKind({}, NOW)).toBe('noData');
    expect(emptyKind({ firstDataDate: new Date(2026, 9, 25, 8) }, NOW)).toBe(
      'firstDay',
    );
    expect(emptyKind({ firstDataDate: new Date(2026, 5, 26) }, NOW)).toBe(
      'period',
    );
  });
});

describe('emptyModel', () => {
  it('uses the design texts without any data', () => {
    expect(emptyModel({}, NOW, 'de-DE', tDe)).toEqual({
      kind: 'noData',
      title: 'Noch keine Daten.',
      body: 'Prüfe in Health, ob Kcalwaage lesen darf.',
      showPermissions: true,
    });
  });

  it('names the last entry before an empty period', () => {
    const model = emptyModel(
      {
        firstDataDate: new Date(2026, 5, 26),
        foodBefore: new Date(2026, 8, 12, 19),
      },
      NOW,
      'de-DE',
      tDe,
    );
    expect(model.title).toBe('Keine Nahrung in diesem Zeitraum.');
    expect(model.body).toBe(
      'Letzter Eintrag davor: 12.09.2026. Wähle einen längeren Zeitraum oder prüfe in Health, ob Kcalwaage lesen darf.',
    );
  });

  it('names the first entry when there is none before', () => {
    const model = emptyModel(
      { firstDataDate: new Date(2026, 9, 20) },
      NOW,
      'de-DE',
      tDe,
    );
    expect(model.body).toMatch(/^Erster Eintrag: 20\.10\.2026\./);
  });

  it('starts the balance tomorrow on the first day, without permissions', () => {
    expect(
      emptyModel(
        { firstDataDate: new Date(2026, 9, 25, 7) },
        NOW,
        'de-DE',
        tDe,
      ),
    ).toMatchObject({
      kind: 'firstDay',
      title: 'Deine Bilanz beginnt morgen.',
      showPermissions: false,
    });
  });

  it('speaks English', () => {
    expect(emptyModel({}, NOW, 'en-US', tEn).title).toBe('No data yet.');
  });
});
