export type UserRole = 'student' | 'instructor' | 'ta' | 'admin' | 'parent';

export type Permission =
  | 'courses:view'
  | 'courses:enroll'
  | 'courses:create'
  | 'courses:edit'
  | 'courses:delete'
  | 'grades:view_own'
  | 'grades:view_all'
  | 'grades:submit'
  | 'grades:edit'
  | 'quizzes:take'
  | 'quizzes:create'
  | 'quizzes:grade'
  | 'users:manage'
  | 'reports:export';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  gradeLevel?: string;
  enrolledCourseIds: string[];
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}
