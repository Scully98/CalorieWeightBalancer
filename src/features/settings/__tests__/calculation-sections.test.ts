import { createInstance } from 'i18next';

import { calculationSections } from '../calculation-sections';
import { de } from '@/i18n/locales/de';
import { en } from '@/i18n/locales/en';

function translator(language: 'de' | 'en') {
  const i18n = createInstance();
  i18n.init({
    resources: { de: { translation: de }, en: { translation: en } },
    lng: language,
    initAsync: false,
  });
  return i18n.t;
}

describe('calculationSections', () => {
  it('fills the numbers from the core', () => {
    const sections = calculationSections(translator('de'), 'de-DE');
    const body = (key: string) =>
      sections.find((section) => section.key === key)?.body;
    expect(sections).toHaveLength(8);
    expect(body('fat')).toContain('7.700 kcal');
    expect(body('tolerance')).toContain('bis 20 %');
    expect(body('tolerance')).toContain('bis 30 %');
    expect(body('zeroDays')).toContain('50 %');
    expect(body('analysis')).toContain('9.400 bzw. 1.800');
    expect(body('analysis')).toContain('Ab 21 Tagen und 6 Messungen');
    expect(body('analysis')).toContain('7-Tage-Trend');
  });

  it('leaves no placeholder in either language', () => {
    for (const [language, locale] of [
      ['de', 'de-DE'],
      ['en', 'en-US'],
    ] as const) {
      for (const { title, body } of calculationSections(
        translator(language),
        locale,
      )) {
        expect(title).not.toMatch(/calculation\.|\{\{/);
        expect(body).not.toMatch(/calculation\.|\{\{/);
      }
    }
  });
});
