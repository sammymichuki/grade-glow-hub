import { UserRole } from './auth';

export type UserAccountStatus = 'active' | 'suspended' | 'pending';
export type AdminCourseStatus = 'published' | 'draft' | 'archived';
export type AuditCategory = 'auth' | 'course' | 'user' | 'system' | 'grade' | 'security';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserAccountStatus;
  department?: string;
  gradeLevel?: number;
  enrolledCourseIds: number[];
  assignedCourseIds?: number[];
  lastActive: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface AdminCourse {
  id: number;
  title: string;
  subject: string;
  level: string;
  instructorId?: string;
  instructorName: string;
  instructorEmail: string;
  enrolledCount: number;
  lessonCount: number;
  rating: number;
  status: AdminCourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SystemAuditLog {
  id: string;
  actor: string;
  actorEmail?: string;
  action: string;
  target: string;
  category: AuditCategory;
  severity: AuditSeverity;
  timestamp: string;
  details?: string;
}

export interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  averageCourseRating: number;
  systemUptimePercentage: number;
  averageAttendanceRate: number;
  completedQuizzesCount: number;
}

export interface PlatformSettings {
  institutionName: string;
  supportEmail: string;
  allowSelfRegistration: boolean;
  maintenanceMode: boolean;
  offlineSyncIntervalMinutes: number;
  defaultLanguage: 'en' | 'sw';
  enforceQuizTimers: boolean;
  maxQuizAttempts: number;
  allowPeerReviewCrossGrading: boolean;
  sessionTimeoutMinutes: number;
}

export interface UserFilterOptions {
  searchTerm?: string;
  role?: UserRole | 'all';
  status?: UserAccountStatus | 'all';
  department?: string;
  sortBy?: 'name' | 'lastActive' | 'joinedDate' | 'role';
  sortOrder?: 'asc' | 'desc';
}

export interface CourseFilterOptions {
  searchTerm?: string;
  subject?: string | 'all';
  status?: AdminCourseStatus | 'all';
  sortBy?: 'title' | 'enrolled' | 'rating' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
