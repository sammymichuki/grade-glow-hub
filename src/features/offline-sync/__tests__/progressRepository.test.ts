import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase } from '../db/appDatabase';
import { ProgressRepository } from '../repositories/progressRepository';

describe('ProgressRepository', () => {
  let testDb: AppDatabase;
  let repo: ProgressRepository;

  beforeEach(() => {
    testDb = new AppDatabase(`test_progress_${Date.now()}_${Math.random()}`);
    repo = new ProgressRepository(testDb);
  });

  it('records lesson completion and computes percentage', async () => {
    const progress = await repo.recordLessonCompletion('math-101', 'student-john', 'lesson-1', 4);

    expect(progress.courseId).toBe('math-101');
    expect(progress.studentId).toBe('student-john');
    expect(progress.completedLessonIds).toEqual(['lesson-1']);
    expect(progress.progressPercentage).toBe(25);
    expect(progress.synced).toBe(false);
  });

  it('accumulates unique lessons and updates progress to 100%', async () => {
    await repo.recordLessonCompletion('eng-1', 'student-alice', 'l-1', 2);
    const progress = await repo.recordLessonCompletion('eng-1', 'student-alice', 'l-2', 2);

    expect(progress.completedLessonIds).toEqual(['l-1', 'l-2']);
    expect(progress.progressPercentage).toBe(100);
  });

  it('marks progress as synced', async () => {
    await repo.recordLessonCompletion('c-1', 's-1', 'l-1', 5);
    await repo.markAsSynced('c-1', 's-1');

    const progress = await repo.getProgress('c-1', 's-1');
    expect(progress?.synced).toBe(true);
  });
});
