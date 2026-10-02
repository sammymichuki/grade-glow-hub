import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase } from '../db/appDatabase';

describe('AppDatabase Dexie IndexedDB Layer', () => {
  let testDb: AppDatabase;

  beforeEach(async () => {
    testDb = new AppDatabase(`test_db_${Date.now()}_${Math.random()}`);
  });

  it('initializes tables with expected schema indexes', () => {
    expect(testDb.cachedLessons).toBeDefined();
    expect(testDb.courseProgress).toBeDefined();
    expect(testDb.syncQueue).toBeDefined();
    expect(testDb.offlineQuizAttempts).toBeDefined();
    expect(testDb.telemetryLogs).toBeDefined();
  });

  it('inserts and retrieves cached lessons', async () => {
    const lesson = {
      id: 'l-1',
      courseId: 'c-1',
      courseTitle: 'Science Grade 6',
      title: 'Photosynthesis',
      description: 'How plants make food',
      content: 'Chlorophyll absorbs sunlight...',
      pdfUrl: 'https://example.com/photosynthesis.pdf',
      order: 1,
      cachedAt: Date.now(),
      sizeBytes: 512,
      isOfflineAvailable: true,
    };

    await testDb.cachedLessons.put(lesson);
    const retrieved = await testDb.cachedLessons.get('l-1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Photosynthesis');
    expect(retrieved?.courseId).toBe('c-1');
  });

  it('computes storage quota estimation correctly', async () => {
    await testDb.cachedLessons.put({
      id: 'l-sample',
      courseId: 'c-1',
      courseTitle: 'Math',
      title: 'Angles',
      description: 'Acute and obtuse',
      content: 'An angle measuring less than 90 degrees',
      order: 1,
      cachedAt: Date.now(),
      sizeBytes: 2048,
      isOfflineAvailable: true,
    });

    const quota = await testDb.getStorageQuota();
    expect(quota.cachedLessonsCount).toBe(1);
    expect(quota.usedBytes).toBeGreaterThanOrEqual(2048);
  });

  it('clears all offline data atomically', async () => {
    await testDb.cachedLessons.put({
      id: 'l-1',
      courseId: 'c-1',
      courseTitle: 'History',
      title: 'Ancient Egypt',
      description: 'Pharaohs and pyramids',
      content: 'The Nile river was central...',
      order: 1,
      cachedAt: Date.now(),
      sizeBytes: 1024,
      isOfflineAvailable: true,
    });

    await testDb.syncQueue.put({
      id: 'q-1',
      type: 'QUIZ_SUBMISSION',
      payload: {},
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    });

    await testDb.clearAllOfflineData();

    const lessonCount = await testDb.cachedLessons.count();
    const queueCount = await testDb.syncQueue.count();

    expect(lessonCount).toBe(0);
    expect(queueCount).toBe(0);
  });
});
