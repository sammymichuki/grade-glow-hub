import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase } from '../db/appDatabase';
import { LessonRepository } from '../repositories/lessonRepository';

describe('LessonRepository', () => {
  let testDb: AppDatabase;
  let repo: LessonRepository;

  beforeEach(() => {
    testDb = new AppDatabase(`test_repo_${Date.now()}_${Math.random()}`);
    repo = new LessonRepository(testDb);
  });

  it('caches a lesson and calculates size in bytes', async () => {
    const cached = await repo.cacheLesson({
      id: 'lesson-1',
      courseId: 'course-sci',
      courseTitle: 'General Science',
      title: 'Solar System',
      description: 'Planets in our orbit',
      content: 'There are eight planets orbiting the sun...',
      order: 1,
    });

    expect(cached.id).toBe('lesson-1');
    expect(cached.sizeBytes).toBeGreaterThan(0);
    expect(cached.isOfflineAvailable).toBe(true);

    const isAvailable = await repo.isLessonCached('lesson-1');
    expect(isAvailable).toBe(true);
  });

  it('retrieves lessons sorted by order for a specific course', async () => {
    await repo.cacheLesson({
      id: 'lesson-2',
      courseId: 'course-sci',
      courseTitle: 'General Science',
      title: 'Mars Exploration',
      description: 'The Red Planet',
      content: 'Rovers exploring the surface',
      order: 2,
    });

    await repo.cacheLesson({
      id: 'lesson-1',
      courseId: 'course-sci',
      courseTitle: 'General Science',
      title: 'Solar System',
      description: 'Planets in our orbit',
      content: 'Planets orbiting the sun',
      order: 1,
    });

    const lessons = await repo.getCachedLessonsByCourse('course-sci');
    expect(lessons).toHaveLength(2);
    expect(lessons[0].id).toBe('lesson-1');
    expect(lessons[1].id).toBe('lesson-2');
  });

  it('searches cached lessons by keyword', async () => {
    await repo.cacheLesson({
      id: 'lesson-bio',
      courseId: 'bio-1',
      courseTitle: 'Biology',
      title: 'Cellular Respiration',
      description: 'Mitochondria function',
      content: 'Adenosine triphosphate energy generation',
      order: 1,
    });

    const matches = await repo.searchCachedLessons('mitochondria');
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('lesson-bio');

    const emptyMatches = await repo.searchCachedLessons('nonexistent_topic');
    expect(emptyMatches).toHaveLength(0);
  });

  it('deletes a cached lesson', async () => {
    await repo.cacheLesson({
      id: 'lesson-del',
      courseId: 'c-del',
      courseTitle: 'Delete Me',
      title: 'Temporary Lesson',
      description: 'Temporary',
      content: 'Temporary text',
      order: 1,
    });

    expect(await repo.isLessonCached('lesson-del')).toBe(true);
    await repo.removeCachedLesson('lesson-del');
    expect(await repo.isLessonCached('lesson-del')).toBe(false);
  });
});
