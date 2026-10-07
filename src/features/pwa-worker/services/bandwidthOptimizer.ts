import { z } from 'zod';
import { BandwidthMode } from '@/features/edge-mesh/types/edgeMesh';

export interface BandwidthPreferences {
  mode: BandwidthMode;
  videoAutoplay: boolean;
  hdImages: boolean;
  autoSync: boolean;
  prefetch: boolean;
  applyOnMeteredConnections: boolean;
}

export const BandwidthPreferencesSchema = z.object({
  mode: z.enum(['rich', 'data-saver']),
  videoAutoplay: z.boolean(),
  hdImages: z.boolean(),
  autoSync: z.boolean(),
  prefetch: z.boolean(),
  applyOnMeteredConnections: z.boolean(),
});

export type ValidatedBandwidthPreferences = z.infer<typeof BandwidthPreferencesSchema>;

export const BANDWIDTH_STORAGE_KEY = 'gg_bandwidth_preferences_v1';

export const DEFAULT_BANDWIDTH_PREFERENCES: BandwidthPreferences = {
  mode: 'rich',
  videoAutoplay: true,
  hdImages: true,
  autoSync: true,
  prefetch: true,
  applyOnMeteredConnections: false,
};

export const DEFAULT_LESSONS_PER_MONTH = 40;

const RICH_VIDEO_KB = 15360;
const RICH_VIDEO_LOW_PRELOAD_KB = 9216;
const RICH_IMAGES_KB = 2400;
const RICH_IMAGES_COMPRESSED_KB = 900;
const SAVER_NARRATION_KB = 260;
const SAVER_THUMBNAIL_KB = 120;
const SAVER_THUMBNAIL_LOW_KB = 40;
const LESSON_TEXT_KB = 60;
const PREFETCH_FACTOR = 1.1;
const AUTOSYNC_MONTHLY_FACTOR = 1.05;

export const estimateKbPerLesson = (preferences: BandwidthPreferences): number => {
  const base =
    preferences.mode === 'data-saver'
      ? SAVER_NARRATION_KB +
        (preferences.hdImages ? SAVER_THUMBNAIL_KB : SAVER_THUMBNAIL_LOW_KB) +
        LESSON_TEXT_KB
      : (preferences.videoAutoplay ? RICH_VIDEO_KB : RICH_VIDEO_LOW_PRELOAD_KB) +
        (preferences.hdImages ? RICH_IMAGES_KB : RICH_IMAGES_COMPRESSED_KB) +
        LESSON_TEXT_KB;
  const withPrefetch = preferences.prefetch ? Math.round(base * PREFETCH_FACTOR) : base;
  return Math.round(withPrefetch);
};

export const projectMonthlyKb = (
  preferences: BandwidthPreferences,
  lessonsPerMonth: number = DEFAULT_LESSONS_PER_MONTH
): number => {
  if (lessonsPerMonth < 0) throw new Error('lessonsPerMonth must be >= 0');
  const monthly = estimateKbPerLesson(preferences) * lessonsPerMonth;
  const withSync = preferences.autoSync ? Math.round(monthly * AUTOSYNC_MONTHLY_FACTOR) : monthly;
  return Math.round(withSync);
};

export const formatKb = (kb: number): string => {
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${Math.round(kb)} KB`;
};

export interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
  type?: string;
  downlink?: number;
}

export interface NavigatorWithNetworkInfo {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
}

export const getNetworkInformation = (
  nav?: NavigatorWithNetworkInfo | null
): NetworkInformationLike | null => {
  if (!nav) return null;
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
};

export const isMeteredConnection = (info: NetworkInformationLike | null): boolean => {
  if (!info) return false;
  if (info.saveData === true) return true;
  return (
    info.effectiveType === 'slow-2g' || info.effectiveType === '2g' || info.effectiveType === '3g'
  );
};

export const shouldApplyDataSaver = (
  preferences: BandwidthPreferences,
  info: NetworkInformationLike | null
): boolean => preferences.applyOnMeteredConnections && isMeteredConnection(info);

const resolveStorage = (storage?: Storage | null): Storage | null => {
  if (storage !== undefined) return storage ?? null;
  return typeof localStorage !== 'undefined' ? localStorage : null;
};

export const loadPreferences = (storage?: Storage | null): BandwidthPreferences => {
  const target = resolveStorage(storage);
  if (!target) return { ...DEFAULT_BANDWIDTH_PREFERENCES };
  try {
    const raw = target.getItem(BANDWIDTH_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BANDWIDTH_PREFERENCES };
    return BandwidthPreferencesSchema.parse(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_BANDWIDTH_PREFERENCES };
  }
};

export const savePreferences = (
  preferences: BandwidthPreferences,
  storage?: Storage | null
): BandwidthPreferences => {
  const validated = BandwidthPreferencesSchema.parse(preferences);
  const target = resolveStorage(storage);
  if (target) target.setItem(BANDWIDTH_STORAGE_KEY, JSON.stringify(validated));
  return validated;
};
