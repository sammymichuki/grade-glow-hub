import { z } from 'zod';
import { SyncActionType, SyncItemStatus } from '@/shared/types/offline';
import { TelemetryCategory, TelemetryLogLevel } from '@/shared/types/telemetry';

export const SyncActionTypeSchema = z.enum([
  'QUIZ_SUBMISSION',
  'LESSON_PROGRESS',
  'RUBRIC_GRADE',
  'FORUM_POST',
  'PEER_REVIEW',
]);

export const SyncItemStatusSchema = z.enum([
  'pending',
  'syncing',
  'completed',
  'failed',
]);

export const CachedLessonSchema = z.object({
  id: z.string().min(1, 'Lesson ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  courseTitle: z.string().min(1, 'Course Title is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  content: z.string().min(1, 'Content is required'),
  pdfUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  order: z.number().int().nonnegative().default(0),
  cachedAt: z.number().positive(),
  sizeBytes: z.number().int().nonnegative().default(0),
  isOfflineAvailable: z.boolean().default(true),
});

export const OfflineProgressSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  studentId: z.string().min(1),
  completedLessonIds: z.array(z.string()).default([]),
  currentLessonId: z.string().default(''),
  progressPercentage: z.number().min(0).max(100).default(0),
  updatedAt: z.number().positive(),
  synced: z.boolean().default(false),
});

export const SyncQueueItemSchema = z.object({
  id: z.string().min(1),
  type: SyncActionTypeSchema,
  payload: z.record(z.any()),
  status: SyncItemStatusSchema.default('pending'),
  retryCount: z.number().int().nonnegative().default(0),
  createdAt: z.number().positive(),
  lastAttemptAt: z.number().positive().optional(),
  errorMessage: z.string().optional(),
});

export const OfflineQuizAttemptSchema = z.object({
  id: z.string().min(1),
  quizId: z.string().min(1),
  courseId: z.string().min(1),
  studentId: z.string().min(1),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  score: z.number().nonnegative(),
  maxScore: z.number().positive(),
  percentage: z.number().min(0).max(100),
  submittedAt: z.number().positive(),
  synced: z.boolean().default(false),
});

export const TelemetryEventSchema = z.object({
  id: z.string().min(1),
  level: z.enum(['info', 'warn', 'error']),
  eventName: z.string().min(1),
  category: z.enum(['navigation', 'assessment', 'sync', 'error', 'performance', 'auth']),
  details: z.record(z.any()).default({}),
  timestamp: z.number().positive(),
  synced: z.boolean().default(false),
});

export type ValidatedCachedLesson = z.infer<typeof CachedLessonSchema>;
export type ValidatedOfflineProgress = z.infer<typeof OfflineProgressSchema>;
export type ValidatedSyncQueueItem = z.infer<typeof SyncQueueItemSchema>;
export type ValidatedOfflineQuizAttempt = z.infer<typeof OfflineQuizAttemptSchema>;
export type ValidatedTelemetryEvent = z.infer<typeof TelemetryEventSchema>;

export const validateCachedLesson = (data: unknown): ValidatedCachedLesson => {
  return CachedLessonSchema.parse(data);
};

export const validateOfflineProgress = (data: unknown): ValidatedOfflineProgress => {
  return OfflineProgressSchema.parse(data);
};

export const validateSyncQueueItem = (data: unknown): ValidatedSyncQueueItem => {
  return SyncQueueItemSchema.parse(data);
};

export const validateOfflineQuizAttempt = (data: unknown): ValidatedOfflineQuizAttempt => {
  return OfflineQuizAttemptSchema.parse(data);
};

export const validateTelemetryEvent = (data: unknown): ValidatedTelemetryEvent => {
  return TelemetryEventSchema.parse(data);
};
