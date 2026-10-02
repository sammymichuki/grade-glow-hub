import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppDatabase } from '../db/appDatabase';
import { SyncQueueService } from '../services/syncQueueService';

describe('SyncQueueService', () => {
  let testDb: AppDatabase;
  let service: SyncQueueService;

  beforeEach(() => {
    testDb = new AppDatabase(`test_sync_${Date.now()}_${Math.random()}`);
    service = new SyncQueueService(testDb);
  });

  it('tracks online and simulated offline state', () => {
    service.setOnlineStatus(false);
    expect(service.getOnlineStatus()).toBe(false);

    service.setOnlineStatus(true);
    expect(service.getOnlineStatus()).toBe(true);
  });

  it('enqueues an action and reflects pending count', async () => {
    service.setOnlineStatus(false); // keep in offline so queue doesn't auto-drain

    const id = await service.enqueueAction('FORUM_POST', {
      threadId: 'thread-1',
      content: 'Offline question submission',
    });

    expect(id).toMatch(/^sync_/);
    const pendingCount = await service.getPendingCount();
    expect(pendingCount).toBe(1);
  });

  it('saves offline quiz attempt and queues submission', async () => {
    service.setOnlineStatus(false);

    const attempt = await service.saveOfflineQuizAttempt({
      quizId: 'quiz-science',
      courseId: 'science-grade-7',
      studentId: 'stud-10',
      answers: { q1: 'A', q2: 'B' },
      score: 10,
      maxScore: 10,
      percentage: 100,
      submittedAt: Date.now(),
    });

    expect(attempt.quizId).toBe('quiz-science');
    expect(attempt.synced).toBe(false);

    const pending = await service.getPendingCount();
    expect(pending).toBe(1);
  });

  it('processes queue when reconnected online', async () => {
    service.setOnlineStatus(false);

    await service.enqueueAction('LESSON_PROGRESS', {
      lessonId: 'l-1',
      studentId: 's-1',
    });

    expect(await service.getPendingCount()).toBe(1);

    // Turn back online and await sync completion
    const result = await service.setOnlineStatus(true);

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    const pendingAfter = await service.getPendingCount();
    expect(pendingAfter).toBe(0);
  });

  it('notifies subscribers on state change', async () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);

    expect(listener).toHaveBeenCalled();

    await service.setOnlineStatus(false);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        isOnline: false,
      })
    );

    unsubscribe();
  });
});
