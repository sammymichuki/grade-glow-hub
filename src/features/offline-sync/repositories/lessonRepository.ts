import { db, AppDatabase } from '../db/appDatabase';
import { CachedLesson } from '@/shared/types/offline';
import { validateCachedLesson } from './schemas';

export class LessonRepository {
  constructor(private database: AppDatabase = db) {}

  calculateLessonSizeBytes(lesson: Partial<CachedLesson>): number {
    const jsonStr = JSON.stringify(lesson);
    return new TextEncoder().encode(jsonStr).length;
  }

  async cacheLesson(lessonData: Omit<CachedLesson, 'sizeBytes' | 'cachedAt'> & { cachedAt?: number; sizeBytes?: number }): Promise<CachedLesson> {
    const cachedAt = lessonData.cachedAt || Date.now();
    const sizeBytes = lessonData.sizeBytes || this.calculateLessonSizeBytes(lessonData);

    const fullLesson: CachedLesson = {
      ...lessonData,
      cachedAt,
      sizeBytes,
      isOfflineAvailable: lessonData.isOfflineAvailable ?? true,
    };

    const validated = validateCachedLesson(fullLesson);
    await this.database.cachedLessons.put(validated);
    return validated;
  }

  async getCachedLesson(id: string): Promise<CachedLesson | undefined> {
    return this.database.cachedLessons.get(id);
  }

  async getCachedLessonsByCourse(courseId: string): Promise<CachedLesson[]> {
    return this.database.cachedLessons
      .where('courseId')
      .equals(courseId)
      .sortBy('order');
  }

  async getAllCachedLessons(): Promise<CachedLesson[]> {
    return this.database.cachedLessons.toArray();
  }

  async removeCachedLesson(id: string): Promise<void> {
    await this.database.cachedLessons.delete(id);
  }

  async isLessonCached(id: string): Promise<boolean> {
    const count = await this.database.cachedLessons.where('id').equals(id).count();
    return count > 0;
  }

  async searchCachedLessons(query: string): Promise<CachedLesson[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAllCachedLessons();

    const all = await this.database.cachedLessons.toArray();
    return all.filter((lesson) => 
      (lesson.title || '').toLowerCase().includes(q) ||
      (lesson.courseTitle || '').toLowerCase().includes(q) ||
      (lesson.description || '').toLowerCase().includes(q) ||
      (lesson.content || '').toLowerCase().includes(q)
    );
  }
}

export const lessonRepository = new LessonRepository();
