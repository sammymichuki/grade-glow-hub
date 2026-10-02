import { Permission, UserProfile, UserRole } from '@/shared/types/auth';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    'courses:view',
    'courses:enroll',
    'grades:view_own',
    'quizzes:take',
  ],
  parent: [
    'courses:view',
    'grades:view_own',
    'reports:export',
  ],
  ta: [
    'courses:view',
    'grades:view_own',
    'grades:view_all',
    'grades:edit',
    'quizzes:take',
    'quizzes:grade',
  ],
  instructor: [
    'courses:view',
    'courses:enroll',
    'courses:create',
    'courses:edit',
    'grades:view_own',
    'grades:view_all',
    'grades:submit',
    'grades:edit',
    'quizzes:take',
    'quizzes:create',
    'quizzes:grade',
    'reports:export',
  ],
  admin: [
    'courses:view',
    'courses:enroll',
    'courses:create',
    'courses:edit',
    'courses:delete',
    'grades:view_own',
    'grades:view_all',
    'grades:submit',
    'grades:edit',
    'quizzes:take',
    'quizzes:create',
    'quizzes:grade',
    'users:manage',
    'reports:export',
  ],
};

export class RbacService {
  /**
   * Checks whether a role possesses a specific permission.
   */
  static hasPermission(role: UserRole | undefined, permission: Permission): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Checks if user has permission to manage curriculum content.
   */
  static canEditCurriculum(user: UserProfile | null): boolean {
    if (!user) return false;
    return this.hasPermission(user.role, 'courses:edit');
  }

  /**
   * Checks if user has access to grade or review student submissions.
   */
  static canGrade(user: UserProfile | null): boolean {
    if (!user) return false;
    return this.hasPermission(user.role, 'grades:edit') || this.hasPermission(user.role, 'quizzes:grade');
  }

  /**
   * Checks if user is enrolled or has instructor/admin access to a course.
   */
  static canAccessCourse(user: UserProfile | null, courseId: number | string): boolean {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'instructor') return true;
    return user.enrolledCourseIds.includes(courseId.toString());
  }
}
