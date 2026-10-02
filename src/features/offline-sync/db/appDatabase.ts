import Dexie, { Table } from 'dexie';
import {
  CachedLesson,
  OfflineProgress,
  SyncQueueItem,
  OfflineQuizAttempt,
  StorageQuotaInfo,
} from '@/shared/types/offline';
import { TelemetryEvent } from '@/shared/types/telemetry';

export class AppDatabase extends Dexie {
  cachedLessons!: Table<CachedLesson, string>;
  courseProgress!: Table<OfflineProgress, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  offlineQuizAttempts!: Table<OfflineQuizAttempt, string>;
  telemetryLogs!: Table<TelemetryEvent, string>;

  constructor(dbName = 'GradeGlowHubOfflineDB') {
    super(dbName);

    this.version(1).stores({
      cachedLessons: 'id, courseId, cachedAt, isOfflineAvailable',
      courseProgress: 'id, courseId, studentId, synced, updatedAt',
      syncQueue: 'id, type, status, retryCount, createdAt',
      offlineQuizAttempts: 'id, quizId, courseId, studentId, synced, submittedAt',
      telemetryLogs: 'id, level, category, synced, timestamp',
    });
  }

  async getStorageQuota(): Promise<StorageQuotaInfo> {
    const cachedLessonsCount = await this.cachedLessons.count();
    const pendingQueueCount = await this.syncQueue
      .where('status')
      .equals('pending')
      .count();

    let usedBytes = 0;
    let quotaBytes = 50 * 1024 * 1024; // Default fallback: 50MB

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        usedBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || quotaBytes;
      } catch {
        // Fallback calculation from Dexie lessons
        const allLessons = await this.cachedLessons.toArray();
        usedBytes = allLessons.reduce((acc, l) => acc + (l.sizeBytes || 0), 0);
      }
    } else {
      const allLessons = await this.cachedLessons.toArray();
      usedBytes = allLessons.reduce((acc, l) => acc + (l.sizeBytes || 0), 0);
    }

    const percentageUsed = quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : 0;

    return {
      usedBytes,
      quotaBytes,
      percentageUsed,
      cachedLessonsCount,
      pendingQueueCount,
    };
  }

  async clearAllOfflineData(): Promise<void> {
    await this.transaction('rw', [
      this.cachedLessons,
      this.courseProgress,
      this.syncQueue,
      this.offlineQuizAttempts,
      this.telemetryLogs,
    ], async () => {
      await this.cachedLessons.clear();
      await this.courseProgress.clear();
      await this.syncQueue.clear();
      await this.offlineQuizAttempts.clear();
      await this.telemetryLogs.clear();
    });
  }
}

export const db = new AppDatabase();
