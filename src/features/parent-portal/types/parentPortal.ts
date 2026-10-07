import { z } from 'zod';

export type NotificationChannel = 'sms' | 'whatsapp' | 'push' | 'email';

export type DigestFrequency = 'bi-weekly' | 'weekly';

export type PortalLocale = 'en' | 'sw';

export type ParentRelationship = 'mother' | 'father' | 'guardian';

export type ChildLinkStatus = 'pending' | 'verified' | 'revoked';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type TaskType = 'assignment' | 'quiz' | 'exam';

export type TaskStatus = 'upcoming' | 'submitted' | 'overdue' | 'excused';

export interface ParentProfile {
  id: string;
  fullName: string;
  salutation: string;
  salutationSw: string;
  email: string;
  phone: string;
  relationship: ParentRelationship;
  preferredLocale: PortalLocale;
  createdAt: string;
}

export interface ConsentRecord {
  verified: boolean;
  method: 'invite_code' | 'sms_otp' | 'in_person' | null;
  verifiedAt: string | null;
}

export interface StudentChildLink {
  id: string;
  parentId: string;
  childId: string;
  childName: string;
  gradeLevel: number;
  schoolName: string;
  status: ChildLinkStatus;
  inviteCode: string;
  codeExpiresAt: string;
  requestedAt: string;
  linkedAt: string | null;
  consent: ConsentRecord;
}

export interface ChildAttendanceRecord {
  id: string;
  childId: string;
  date: string;
  status: AttendanceStatus;
}

export interface DailyEngagementRecord {
  id: string;
  childId: string;
  date: string;
  engagementMinutes: number;
  lessonsCompleted: number;
}

export interface ChildSubjectScoreRecord {
  id: string;
  childId: string;
  subject: string;
  date: string;
  score: number;
  modulesCompleted: number;
}

export interface UpcomingTask {
  id: string;
  childId: string;
  title: string;
  subject: string;
  type: TaskType;
  dueDate: string;
  status: TaskStatus;
}

export interface TeacherNote {
  id: string;
  childId: string;
  teacherName: string;
  subject: string;
  note: string;
  createdAt: string;
}

export interface SubjectPerformance {
  subject: string;
  averageScore: number;
  previousAverageScore: number;
  scoreTrend: number;
  modulesCompleted: number;
}

export interface ChildProgressSummary {
  childId: string;
  childName: string;
  gradeLevel: number;
  windowStart: string;
  windowEnd: string;
  attendanceRate: number;
  previousAttendanceRate: number;
  attendanceTrend: number;
  homeworkCompletionRate: number;
  previousHomeworkCompletionRate: number;
  homeworkTrend: number;
  averageScore: number;
  previousAverageScore: number;
  scoreTrend: number;
  engagementMinutes: number;
  previousEngagementMinutes: number;
  engagementTrend: number;
  subjectPerformance: SubjectPerformance[];
  strongSubjects: string[];
  focusSubjects: string[];
  upcomingTasks: UpcomingTask[];
  computedAt: number;
}

export interface NotificationPreference {
  parentId: string;
  channels: Record<NotificationChannel, boolean>;
  frequency: DigestFrequency;
  locale: PortalLocale;
  criticalAlerts: boolean;
  destinationPhone: string;
  destinationEmail: string;
}

export interface DigestSubjectSpotlight {
  subject: string;
  modulesCompleted: number;
  averageScore: number;
}

export interface WeeklyDigest {
  id: string;
  parentId: string;
  childId: string;
  childFirstName: string;
  parentSalutation: string;
  parentSalutationSw: string;
  windowStart: string;
  windowEnd: string;
  generatedAt: number;
  modulesCompleted: number;
  averageScore: number;
  previousAverageScore: number;
  scoreTrend: number;
  attendanceRate: number;
  homeworkCompletionRate: number;
  topSubject: DigestSubjectSpotlight;
  strengths: string[];
  weaknesses: string[];
  teacherNotes: TeacherNote[];
  nextTask: UpcomingTask | null;
}

export type LinkErrorCode = 'invalid_code' | 'expired_code' | 'already_linked';

export interface LinkAttemptResult {
  success: boolean;
  link?: StudentChildLink;
  error?: LinkErrorCode;
  message: string;
}

export interface PreferenceUpdateResult {
  success: boolean;
  preferences?: NotificationPreference;
  error?: string;
}

export const NotificationChannelSchema = z.enum(['sms', 'whatsapp', 'push', 'email']);

export const DigestFrequencySchema = z.enum(['bi-weekly', 'weekly']);

export const PortalLocaleSchema = z.enum(['en', 'sw']);

export const ConsentRecordSchema = z.object({
  verified: z.boolean(),
  method: z.enum(['invite_code', 'sms_otp', 'in_person']).nullable(),
  verifiedAt: z.string().nullable(),
});

export const StudentChildLinkSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().min(1),
  childId: z.string().min(1),
  childName: z.string().min(1),
  gradeLevel: z.number().int().min(4).max(9),
  schoolName: z.string().min(1),
  status: z.enum(['pending', 'verified', 'revoked']),
  inviteCode: z.string().min(1),
  codeExpiresAt: z.string().min(1),
  requestedAt: z.string().min(1),
  linkedAt: z.string().nullable(),
  consent: ConsentRecordSchema,
});

export const ParentProfileSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(1),
  salutation: z.string().min(1),
  salutationSw: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  relationship: z.enum(['mother', 'father', 'guardian']),
  preferredLocale: PortalLocaleSchema,
  createdAt: z.string().min(1),
});

export const ChildAttendanceRecordSchema = z.object({
  id: z.string().min(1),
  childId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['present', 'absent', 'late', 'excused']),
});

export const DailyEngagementRecordSchema = z.object({
  id: z.string().min(1),
  childId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  engagementMinutes: z.number().int().nonnegative(),
  lessonsCompleted: z.number().int().nonnegative(),
});

export const ChildSubjectScoreRecordSchema = z.object({
  id: z.string().min(1),
  childId: z.string().min(1),
  subject: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().min(0).max(100),
  modulesCompleted: z.number().int().nonnegative(),
});

export const UpcomingTaskSchema = z.object({
  id: z.string().min(1),
  childId: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().min(1),
  type: z.enum(['assignment', 'quiz', 'exam']),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['upcoming', 'submitted', 'overdue', 'excused']),
});

export const TeacherNoteSchema = z.object({
  id: z.string().min(1),
  childId: z.string().min(1),
  teacherName: z.string().min(1),
  subject: z.string().min(1),
  note: z.string().min(1),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const NotificationPreferenceSchema = z.object({
  parentId: z.string().min(1),
  channels: z.record(NotificationChannelSchema, z.boolean()),
  frequency: DigestFrequencySchema,
  locale: PortalLocaleSchema,
  criticalAlerts: z.boolean(),
  destinationPhone: z.string(),
  destinationEmail: z.string(),
});

export interface ParentPortalState {
  profile: ParentProfile;
  links: StudentChildLink[];
  preferences: NotificationPreference;
  attendance: ChildAttendanceRecord[];
  engagement: DailyEngagementRecord[];
  subjectScores: ChildSubjectScoreRecord[];
  tasks: UpcomingTask[];
  teacherNotes: TeacherNote[];
}

export const ParentPortalStateSchema = z.object({
  profile: ParentProfileSchema,
  links: z.array(StudentChildLinkSchema),
  preferences: NotificationPreferenceSchema,
  attendance: z.array(ChildAttendanceRecordSchema),
  engagement: z.array(DailyEngagementRecordSchema),
  subjectScores: z.array(ChildSubjectScoreRecordSchema),
  tasks: z.array(UpcomingTaskSchema),
  teacherNotes: z.array(TeacherNoteSchema),
});
