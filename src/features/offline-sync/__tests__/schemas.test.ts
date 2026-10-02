import { describe, it, expect } from 'vitest';
import {
  validateCachedLesson,
  validateOfflineProgress,
  validateSyncQueueItem,
  validateOfflineQuizAttempt,
  validateTelemetryEvent,
} from '../repositories/schemas';

describe('Offline-Sync Zod Schemas Validation', () => {
  it('validates a correct cached lesson schema', () => {
    const validLesson = {
      id: 'lesson-101',
      courseId: 'math-grade-5',
      courseTitle: 'Grade 5 Mathematics',
      title: 'Fractions and Decimals',
      description: 'Understanding fraction parts',
      content: 'Sample lesson content body',
      pdfUrl: 'https://example.com/math.pdf',
      order: 1,
      cachedAt: Date.now(),
      sizeBytes: 1024,
      isOfflineAvailable: true,
    };

    const result = validateCachedLesson(validLesson);
    expect(result.id).toBe('lesson-101');
    expect(result.courseId).toBe('math-grade-5');
    expect(result.sizeBytes).toBe(1024);
  });

  it('rejects invalid cached lesson when title or content is missing', () => {
    const invalidLesson = {
      id: 'lesson-101',
      courseId: 'math-grade-5',
      courseTitle: 'Math',
      title: '', // empty
      content: '', // empty
      cachedAt: Date.now(),
    };

    expect(() => validateCachedLesson(invalidLesson)).toThrow();
  });

  it('validates offline progress schema', () => {
    const validProgress = {
      id: 'math-5_student-1',
      courseId: 'math-5',
      studentId: 'student-1',
      completedLessonIds: ['1', '2'],
      currentLessonId: '3',
      progressPercentage: 50,
      updatedAt: Date.now(),
      synced: false,
    };

    const result = validateOfflineProgress(validProgress);
    expect(result.progressPercentage).toBe(50);
    expect(result.synced).toBe(false);
  });

  it('validates sync queue items with valid action types', () => {
    const queueItem = {
      id: 'sync-1',
      type: 'QUIZ_SUBMISSION',
      payload: { quizId: 'quiz-1', score: 90 },
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
    };

    const result = validateSyncQueueItem(queueItem);
    expect(result.type).toBe('QUIZ_SUBMISSION');
    expect(result.status).toBe('pending');
  });

  it('validates offline quiz attempt schema', () => {
    const attempt = {
      id: 'attempt-1',
      quizId: 'quiz-algebra',
      courseId: 'course-algebra',
      studentId: 'student-42',
      answers: { q1: 'A', q2: ['B', 'C'] },
      score: 18,
      maxScore: 20,
      percentage: 90,
      submittedAt: Date.now(),
      synced: false,
    };

    const result = validateOfflineQuizAttempt(attempt);
    expect(result.percentage).toBe(90);
    expect(result.maxScore).toBe(20);
  });

  it('validates telemetry event schema', () => {
    const event = {
      id: 'tel-1',
      level: 'error',
      eventName: 'network_timeout',
      category: 'sync',
      details: { url: '/api/v1/sync', retry: 2 },
      timestamp: Date.now(),
      synced: false,
    };

    const result = validateTelemetryEvent(event);
    expect(result.level).toBe('error');
    expect(result.category).toBe('sync');
  });
});
