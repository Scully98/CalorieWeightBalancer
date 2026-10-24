import { IMPRINT_URL, PRIVACY_URL } from '../links';

describe('links', () => {
  it('point to the project pages over https', () => {
    for (const url of [PRIVACY_URL, IMPRINT_URL]) {
      expect(url).toMatch(
        /^https:\/\/scully98\.github\.io\/CalorieWeightBalancer\/\w+$/,
      );
    }
    expect(PRIVACY_URL).not.toBe(IMPRINT_URL);
  });
});
