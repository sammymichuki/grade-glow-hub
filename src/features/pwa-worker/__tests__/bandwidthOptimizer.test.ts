import { describe, it, expect } from 'vitest';
import {
  BANDWIDTH_STORAGE_KEY,
  BandwidthPreferences,
  DEFAULT_BANDWIDTH_PREFERENCES,
  estimateKbPerLesson,
  formatKb,
  getNetworkInformation,
  isMeteredConnection,
  loadPreferences,
  projectMonthlyKb,
  savePreferences,
  shouldApplyDataSaver,
} from '../services/bandwidthOptimizer';
import { MemoryStorage } from './memoryStorage';

describe('estimateKbPerLesson', () => {
  it('projects ~19.6 MB for a rich lesson with prefetch', () => {
    const kb = estimateKbPerLesson(DEFAULT_BANDWIDTH_PREFERENCES);
    expect(kb).toBe(19602);
  });

  it('stays under the 500 KB Horizon-6 target in data-saver mode', () => {
    const kb = estimateKbPerLesson({ ...DEFAULT_BANDWIDTH_PREFERENCES, mode: 'data-saver' });
    expect(kb).toBe(484);
    expect(kb).toBeLessThan(500);
  });

  it('drops compressed thumbnails when HD images are disabled', () => {
    const saver = estimateKbPerLesson({ ...DEFAULT_BANDWIDTH_PREFERENCES, mode: 'data-saver', hdImages: false });
    expect(saver).toBe(396);
  });

  it('reduces video payload when autoplay is disabled and prefetch is off', () => {
    const kb = estimateKbPerLesson({
      ...DEFAULT_BANDWIDTH_PREFERENCES,
      videoAutoplay: false,
      prefetch: false,
    });
    expect(kb).toBe(9216 + 2400 + 60);
  });
});

describe('projectMonthlyKb', () => {
  it('projects monthly usage including the auto-sync factor', () => {
    expect(projectMonthlyKb(DEFAULT_BANDWIDTH_PREFERENCES)).toBe(823284);
  });

  it('skips the sync factor when auto-sync is disabled', () => {
    const monthly = projectMonthlyKb({ ...DEFAULT_BANDWIDTH_PREFERENCES, autoSync: false }, 10);
    expect(monthly).toBe(19602 * 10);
  });

  it('scales linearly with lessons per month', () => {
    const half = projectMonthlyKb({ ...DEFAULT_BANDWIDTH_PREFERENCES, autoSync: false }, 20);
    const single = projectMonthlyKb({ ...DEFAULT_BANDWIDTH_PREFERENCES, autoSync: false }, 10);
    expect(half).toBe(single * 2);
  });

  it('rejects negative lesson counts', () => {
    expect(() => projectMonthlyKb(DEFAULT_BANDWIDTH_PREFERENCES, -1)).toThrow();
  });
});

describe('formatKb', () => {
  it('formats kilobytes, megabytes and gigabytes', () => {
    expect(formatKb(484)).toBe('484 KB');
    expect(formatKb(1024)).toBe('1.0 MB');
    expect(formatKb(1024 * 1024)).toBe('1.00 GB');
  });
});

describe('Network Information API helpers', () => {
  it('finds the standard connection object first', () => {
    const info = getNetworkInformation({
      connection: { effectiveType: '4g' },
      mozConnection: { effectiveType: '2g' },
    });
    expect(info?.effectiveType).toBe('4g');
  });

  it('falls back to the legacy vendor connection', () => {
    const info = getNetworkInformation({ webkitConnection: { saveData: true } } as never);
    expect(info?.saveData).toBe(true);
  });

  it('returns null without any network info', () => {
    expect(getNetworkInformation(null)).toBeNull();
    expect(getNetworkInformation(undefined)).toBeNull();
  });

  it('treats save-data and slow effective types as metered', () => {
    expect(isMeteredConnection({ saveData: true })).toBe(true);
    expect(isMeteredConnection({ effectiveType: '2g' })).toBe(true);
    expect(isMeteredConnection({ effectiveType: 'slow-2g' })).toBe(true);
    expect(isMeteredConnection({ effectiveType: '4g' })).toBe(false);
    expect(isMeteredConnection(null)).toBe(false);
  });

  it('only applies the data-saver rule when enabled and metered', () => {
    expect(shouldApplyDataSaver({ ...DEFAULT_BANDWIDTH_PREFERENCES, applyOnMeteredConnections: true }, { saveData: true })).toBe(true);
    expect(shouldApplyDataSaver(DEFAULT_BANDWIDTH_PREFERENCES, { saveData: true })).toBe(false);
    expect(shouldApplyDataSaver({ ...DEFAULT_BANDWIDTH_PREFERENCES, applyOnMeteredConnections: true }, { effectiveType: '4g' })).toBe(false);
  });
});

describe('preference persistence', () => {
  it('returns defaults when nothing was persisted', () => {
    const prefs = loadPreferences(new MemoryStorage());
    expect(prefs).toEqual(DEFAULT_BANDWIDTH_PREFERENCES);
  });

  it('returns defaults when the payload is invalid', () => {
    const storage = new MemoryStorage();
    storage.setItem(BANDWIDTH_STORAGE_KEY, '{nope');
    expect(loadPreferences(storage)).toEqual(DEFAULT_BANDWIDTH_PREFERENCES);
  });

  it('validates and persists preferences, then reloads them', () => {
    const storage = new MemoryStorage();
    const saved = savePreferences({ ...DEFAULT_BANDWIDTH_PREFERENCES, mode: 'data-saver', hdImages: false }, storage);
    expect(saved.mode).toBe('data-saver');
    expect(JSON.parse(storage.getItem(BANDWIDTH_STORAGE_KEY) as string)).toMatchObject({
      mode: 'data-saver',
      hdImages: false,
    });
    expect(loadPreferences(storage)).toMatchObject({ mode: 'data-saver', hdImages: false });
  });

  it('rejects out-of-domain modes through the zod schema', () => {
    expect(() =>
      savePreferences({ ...DEFAULT_BANDWIDTH_PREFERENCES, mode: 'hd' } as BandwidthPreferences, new MemoryStorage())
    ).toThrow();
  });
});