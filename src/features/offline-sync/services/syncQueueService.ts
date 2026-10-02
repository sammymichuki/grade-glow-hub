import { db, AppDatabase } from '../db/appDatabase';
import { SyncQueueItem, SyncActionType, OfflineQuizAttempt } from '@/shared/types/offline';
import { validateSyncQueueItem, validateOfflineQuizAttempt } from '../repositories/schemas';

export type SyncStateListener = (state: {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: number | null;
}) => void;

export class SyncQueueService {
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isCurrentlySyncing = false;
  private lastSyncTimestamp: number | null = null;
  private listeners: Set<SyncStateListener> = new Set();
  private maxRetries = 3;

  constructor(private database: AppDatabase = db) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnlineStatus;
  }

  public async setOnlineStatus(online: boolean): Promise<any> {
    this.isOnlineStatus = online;
    await this.notifyListeners();
    if (online) {
      return await this.processQueue();
    }
    return null;
  }

  private handleNetworkChange(online: boolean): void {
    this.setOnlineStatus(online);
  }

  public subscribe(listener: SyncStateListener): () => void {
    this.listeners.add(listener);
    // Immediately call listener synchronously with known state
    listener({
      isOnline: this.isOnlineStatus,
      pendingCount: 0,
      isSyncing: this.isCurrentlySyncing,
      lastSyncTime: this.lastSyncTimestamp,
    });
    this.getPendingCount().then((count) => {
      listener({
        isOnline: this.isOnlineStatus,
        pendingCount: count,
        isSyncing: this.isCurrentlySyncing,
        lastSyncTime: this.lastSyncTimestamp,
      });
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners(): Promise<void> {
    const pendingCount = await this.getPendingCount();
    const state = {
      isOnline: this.isOnlineStatus,
      pendingCount,
      isSyncing: this.isCurrentlySyncing,
      lastSyncTime: this.lastSyncTimestamp,
    };
    this.listeners.forEach((listener) => listener(state));
  }

  async getPendingCount(): Promise<number> {
    try {
      return await this.database.syncQueue
        .where('status')
        .equals('pending')
        .count();
    } catch {
      return 0;
    }
  }

  async getAllQueueItems(): Promise<SyncQueueItem[]> {
    return this.database.syncQueue.orderBy('createdAt').reverse().toArray();
  }

  async enqueueAction(type: SyncActionType, payload: Record<string, any>): Promise<string> {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const item: SyncQueueItem = {
      id,
      type,
      payload,
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    };

    const validated = validateSyncQueueItem(item);
    await this.database.syncQueue.put(validated);
    await this.notifyListeners();

    if (this.isOnlineStatus && !this.isCurrentlySyncing) {
      // Trigger background sync
      setTimeout(() => this.processQueue(), 50);
    }

    return id;
  }

  async saveOfflineQuizAttempt(
    attemptData: Omit<OfflineQuizAttempt, 'id' | 'synced'>
  ): Promise<OfflineQuizAttempt> {
    const id = `attempt_${attemptData.quizId}_${Date.now()}`;
    const attempt: OfflineQuizAttempt = {
      ...attemptData,
      id,
      synced: false,
    };

    const validated = validateOfflineQuizAttempt(attempt);
    await this.database.offlineQuizAttempts.put(validated);

    // Enqueue for cloud sync
    await this.enqueueAction('QUIZ_SUBMISSION', {
      attemptId: id,
      quizId: attempt.quizId,
      studentId: attempt.studentId,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      answers: attempt.answers,
    });

    return validated;
  }

  async processQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (!this.isOnlineStatus || this.isCurrentlySyncing) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isCurrentlySyncing = true;
    await this.notifyListeners();

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      const pendingItems = await this.database.syncQueue
        .where('status')
        .anyOf('pending', 'failed')
        .filter((item) => item.retryCount < this.maxRetries)
        .toArray();

      for (const item of pendingItems) {
        processed++;
        await this.database.syncQueue.update(item.id, {
          status: 'syncing',
          lastAttemptAt: Date.now(),
        });

        try {
          // Process based on action type
          await this.syncItemToCloud(item);

          // Mark completed
          await this.database.syncQueue.update(item.id, {
            status: 'completed',
          });

          // If quiz submission, mark attempt as synced
          if (item.type === 'QUIZ_SUBMISSION' && item.payload.attemptId) {
            await this.database.offlineQuizAttempts.update(item.payload.attemptId, {
              synced: true,
            });
          }

          succeeded++;
        } catch (err: any) {
          failed++;
          const nextRetry = item.retryCount + 1;
          await this.database.syncQueue.update(item.id, {
            status: nextRetry >= this.maxRetries ? 'failed' : 'pending',
            retryCount: nextRetry,
            errorMessage: err?.message || 'Sync operation failed',
          });
        }
      }

      this.lastSyncTimestamp = Date.now();
    } finally {
      this.isCurrentlySyncing = false;
      await this.notifyListeners();
    }

    return { processed, succeeded, failed };
  }

  private async syncItemToCloud(item: SyncQueueItem): Promise<void> {
    // Cloud sync simulation with high resilience
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!item.payload) {
          reject(new Error('Invalid sync item payload'));
          return;
        }
        resolve();
      }, 30);
    });
  }

  async clearCompletedItems(): Promise<number> {
    const completed = await this.database.syncQueue
      .where('status')
      .equals('completed')
      .toArray();

    const ids = completed.map((i) => i.id);
    await this.database.syncQueue.bulkDelete(ids);
    await this.notifyListeners();
    return ids.length;
  }
}

export const syncQueueService = new SyncQueueService();
