import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../config';

describe('Internationalization (i18n) Engine', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('translates navigation keys in English', () => {
    expect(i18n.t('nav.home')).toBe('Home');
    expect(i18n.t('nav.courses')).toBe('Courses');
    expect(i18n.t('nav.gradebook')).toBe('Gradebook');
  });

  it('switches to Swahili and translates keys accurately', async () => {
    await i18n.changeLanguage('sw');

    expect(i18n.t('nav.home')).toBe('Nyumbani');
    expect(i18n.t('nav.courses')).toBe('Kozi');
    expect(i18n.t('nav.gradebook')).toBe('Kitabu cha Alama');
    expect(i18n.t('offline.libraryTitle')).toBe('Maktaba ya Masomo Nje ya Mtandao');
  });

  it('falls back to English when a key is absent', async () => {
    await i18n.changeLanguage('sw');
    // non-existent key returns key name
    expect(i18n.t('non.existent.key')).toBe('non.existent.key');
  });
});
