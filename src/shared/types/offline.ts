export type SyncActionType =
  | 'QUIZ_SUBMISSION'
  | 'LESSON_PROGRESS'
  | 'RUBRIC_GRADE'
  | 'FORUM_POST'
  | 'PEER_REVIEW';

export type SyncItemStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export interface CachedLesson {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  content: string;
  pdfUrl?: string;
  videoUrl?: string;
  order: number;
  cachedAt: number;
  sizeBytes: number;
  isOfflineAvailable: boolean;
}

export interface OfflineProgress {
  id: string; // e.g. `${courseId}_${studentId}`
  courseId: string;
  studentId: string;
  completedLessonIds: string[];
  currentLessonId: string;
  progressPercentage: number;
  updatedAt: number;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: SyncActionType;
  payload: Record<string, any>;
  status: SyncItemStatus;
  retryCount: number;
  createdAt: number;
  lastAttemptAt?: number;
  errorMessage?: string;
}

export interface OfflineQuizAttempt {
  id: string;
  quizId: string;
  courseId: string;
  studentId: string;
  answers: Record<string, string | string[]>;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: number;
  synced: boolean;
}

export interface StorageQuotaInfo {
  usedBytes: number;
  quotaBytes: number;
  percentageUsed: number;
  cachedLessonsCount: number;
  pendingQueueCount: number;
}
