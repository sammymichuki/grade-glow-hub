import { db, AppDatabase } from '../db/appDatabase';
import { OfflineProgress } from '@/shared/types/offline';
import { validateOfflineProgress } from './schemas';

export class ProgressRepository {
  constructor(private database: AppDatabase = db) {}

  generateProgressId(courseId: string, studentId: string): string {
    return `${courseId}_${studentId}`;
  }

  async getProgress(courseId: string, studentId: string): Promise<OfflineProgress | undefined> {
    const id = this.generateProgressId(courseId, studentId);
    return this.database.courseProgress.get(id);
  }

  async recordLessonCompletion(
    courseId: string,
    studentId: string,
    lessonId: string,
    totalCourseLessons = 10
  ): Promise<OfflineProgress> {
    const id = this.generateProgressId(courseId, studentId);
    const existing = await this.database.courseProgress.get(id);

    const completedLessonIds = existing
      ? Array.from(new Set([...existing.completedLessonIds, lessonId]))
      : [lessonId];

    const progressPercentage = Math.min(
      100,
      Math.round((completedLessonIds.length / Math.max(1, totalCourseLessons)) * 100)
    );

    const updatedProgress: OfflineProgress = {
      id,
      courseId,
      studentId,
      completedLessonIds,
      currentLessonId: lessonId,
      progressPercentage,
      updatedAt: Date.now(),
      synced: false,
    };

    const validated = validateOfflineProgress(updatedProgress);
    await this.database.courseProgress.put(validated);

    return validated;
  }

  async markAsSynced(courseId: string, studentId: string): Promise<void> {
    const id = this.generateProgressId(courseId, studentId);
    await this.database.courseProgress.update(id, { synced: true });
  }

  async getUnsyncedProgress(): Promise<OfflineProgress[]> {
    return this.database.courseProgress.where('synced').equals(0).toArray();
  }

  async getAllProgressForStudent(studentId: string): Promise<OfflineProgress[]> {
    return this.database.courseProgress.where('studentId').equals(studentId).toArray();
  }
}

export const progressRepository = new ProgressRepository();
