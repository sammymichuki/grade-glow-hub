import { z } from 'zod';

export interface VideoKeynote {
  id: string;
  timestampSeconds: number;
  title: string;
  note: string;
}

export type LessonType = 'video' | 'article' | 'quiz' | 'assignment';

export interface CurriculumLesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  type: LessonType;
  durationMinutes: number;
  contentMarkdown: string;
  videoUrl?: string;
  videoKeynotes?: VideoKeynote[];
  isPublished?: boolean;
}

export interface CurriculumModule {
  id: string;
  courseId: number;
  title: string;
  description: string;
  order: number;
  lessons: CurriculumLesson[];
}

export interface RubricLevel {
  id: string;
  title: string;
  description: string;
  points: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weightPercentage: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  title: string;
  description: string;
  criteria: RubricCriterion[];
  maxPoints: number;
}

export interface SubmissionAnnotation {
  id: string;
  lineOrTimestamp: string;
  comment: string;
  createdAt: string;
  authorName: string;
}

export interface RubricScoreItem {
  levelId: string;
  feedback?: string;
  pointsEarned: number;
}

export type SubmissionStatus = 'pending' | 'graded' | 'returned';

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  status: SubmissionStatus;
  fileUrl?: string;
  textSubmission?: string;
  grade?: number;
  rubricScores?: Record<string, RubricScoreItem>;
  teacherFeedback?: string;
  annotations?: SubmissionAnnotation[];
}

export type StudentStatus = 'active' | 'suspended' | 'pending';

export interface StudentRosterItem {
  id: string;
  studentId: string;
  name: string;
  email: string;
  gradeLevel: number;
  enrolledCourseIds: number[];
  enrollmentDate: string;
  attendancePercentage: number;
  currentGpa: number;
  status: StudentStatus;
}

export interface CourseBuilderDraft {
  courseId: number;
  title: string;
  description: string;
  category: string;
  gradeLevel: string;
  modules: CurriculumModule[];
  rubrics: Rubric[];
  updatedAt: string;
}

// Zod Validation Schemas
export const VideoKeynoteSchema = z.object({
  id: z.string(),
  timestampSeconds: z.number().nonnegative(),
  title: z.string().min(1, 'Title is required'),
  note: z.string().default(''),
});

export const StudentRosterItemSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  gradeLevel: z.number().int().min(1).max(12),
  attendancePercentage: z.number().min(0).max(100).default(100),
  currentGpa: z.number().min(0).max(4.0).default(3.0),
  status: z.enum(['active', 'suspended', 'pending']).default('active'),
});
