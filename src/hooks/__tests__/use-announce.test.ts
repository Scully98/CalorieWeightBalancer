import { isNewAnnouncement } from '../use-announce';

describe('isNewAnnouncement', () => {
  it('is true for a first or changed message', () => {
    expect(isNewAnnouncement(undefined, 'a')).toBe(true);
    expect(isNewAnnouncement('a', 'b')).toBe(true);
  });

  it('is false for the same message or none', () => {
    expect(isNewAnnouncement('a', 'a')).toBe(false);
    expect(isNewAnnouncement('a', undefined)).toBe(false);
  });
});
