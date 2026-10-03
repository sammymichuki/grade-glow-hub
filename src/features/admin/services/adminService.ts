import {
  AdminUser,
  AdminCourse,
  SystemAuditLog,
  PlatformSettings,
  PlatformMetrics,
  UserFilterOptions,
  CourseFilterOptions,
  UserAccountStatus,
  AdminCourseStatus,
  AuditCategory,
  AuditSeverity,
} from '@/shared/types/admin';
import { UserRole } from '@/shared/types/auth';
import {
  SAMPLE_ADMIN_USERS,
  SAMPLE_ADMIN_COURSES,
  SAMPLE_SYSTEM_AUDIT_LOGS,
  DEFAULT_PLATFORM_SETTINGS,
} from '../data/sampleAdminData';

export class AdminService {
  private static users: AdminUser[] = [...SAMPLE_ADMIN_USERS];
  private static courses: AdminCourse[] = [...SAMPLE_ADMIN_COURSES];
  private static auditLogs: SystemAuditLog[] = [...SAMPLE_SYSTEM_AUDIT_LOGS];
  private static settings: PlatformSettings = { ...DEFAULT_PLATFORM_SETTINGS };

  /**
   * Resets all administrative state to initial fixtures (useful for testing).
   */
  static resetToDefault(): void {
    this.users = [...SAMPLE_ADMIN_USERS];
    this.courses = [...SAMPLE_ADMIN_COURSES];
    this.auditLogs = [...SAMPLE_SYSTEM_AUDIT_LOGS];
    this.settings = { ...DEFAULT_PLATFORM_SETTINGS };
  }

  /**
   * Calculates overall platform metrics dynamically.
   */
  static getMetrics(): PlatformMetrics {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter((u) => u.status === 'active').length;
    const totalStudents = this.users.filter((u) => u.role === 'student').length;
    const totalInstructors = this.users.filter((u) => u.role === 'instructor').length;
    const totalCourses = this.courses.length;
    const publishedCourses = this.courses.filter((c) => c.status === 'published').length;
    const totalEnrollments = this.courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0);

    const ratings = this.courses.map((c) => c.rating).filter((r) => r > 0);
    const averageCourseRating = ratings.length > 0
      ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
      : 0;

    return {
      totalUsers,
      activeUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      averageCourseRating,
      systemUptimePercentage: 99.98,
      averageAttendanceRate: 94.6,
      completedQuizzesCount: 1280,
    };
  }

  /**
   * Retrieves users applying search, role, status filters, and sorting.
   */
  static getUsers(filters?: UserFilterOptions): AdminUser[] {
    let list = [...this.users];

    if (!filters) return list;

    if (filters.searchTerm && filters.searchTerm.trim().length > 0) {
      const q = filters.searchTerm.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q))
      );
    }

    if (filters.role && filters.role !== 'all') {
      list = list.filter((u) => u.role === filters.role);
    }

    if (filters.status && filters.status !== 'all') {
      list = list.filter((u) => u.status === filters.status);
    }

    if (filters.department && filters.department !== 'all') {
      list = list.filter((u) => u.department === filters.department);
    }

    if (filters.sortBy) {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      switch (filters.sortBy) {
        case 'name':
          list.sort((a, b) => a.name.localeCompare(b.name) * order);
          break;
        case 'role':
          list.sort((a, b) => a.role.localeCompare(b.role) * order);
          break;
        case 'joinedDate':
          list.sort((a, b) => a.createdAt.localeCompare(b.createdAt) * order);
          break;
        case 'lastActive':
          list.sort((a, b) => a.lastActive.localeCompare(b.lastActive) * order);
          break;
      }
    }

    return list;
  }

  /**
   * Updates an existing user's role and logs an audit trail event.
   */
  static updateUserRole(userId: string, newRole: UserRole, actorName = 'Admin'): AdminUser {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const previousRole = this.users[userIndex].role;
    this.users[userIndex] = {
      ...this.users[userIndex],
      role: newRole,
    };

    this.logAuditEvent(
      'ROLE_MODIFIED',
      `${this.users[userIndex].name} (${userId})`,
      'user',
      'warning',
      `Changed role from ${previousRole.toUpperCase()} to ${newRole.toUpperCase()}.`,
      actorName
    );

    return this.users[userIndex];
  }

  /**
   * Updates an existing user's account status (active, suspended, pending).
   */
  static updateUserStatus(userId: string, newStatus: UserAccountStatus, actorName = 'Admin'): AdminUser {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const previousStatus = this.users[userIndex].status;
    this.users[userIndex] = {
      ...this.users[userIndex],
      status: newStatus,
    };

    const severity: AuditSeverity = newStatus === 'suspended' ? 'critical' : 'info';
    this.logAuditEvent(
      'STATUS_CHANGED',
      `${this.users[userIndex].name} (${userId})`,
      'security',
      severity,
      `Changed account status from ${previousStatus} to ${newStatus}.`,
      actorName
    );

    return this.users[userIndex];
  }

  /**
   * Registers a new user into the administrative registry.
   */
  static addUser(
    userData: Omit<AdminUser, 'id' | 'createdAt' | 'lastActive'>,
    actorName = 'Admin'
  ): AdminUser {
    if (!userData.name.trim() || !userData.email.trim()) {
      throw new Error('Name and email are required fields.');
    }

    const existingUser = this.users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      throw new Error(`A user with email ${userData.email} already exists.`);
    }

    const newUser: AdminUser = {
      ...userData,
      name: userData.name.trim(),
      email: userData.email.trim(),
      department: userData.department?.trim(),
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: 'Just registered',
      enrolledCourseIds: userData.enrolledCourseIds || [],
    };

    this.users.unshift(newUser);

    this.logAuditEvent(
      'USER_CREATED',
      `${newUser.name} (${newUser.id})`,
      'user',
      'info',
      `Registered new ${newUser.role.toUpperCase()} account with email ${newUser.email}.`,
      actorName
    );

    return newUser;
  }

  /**
   * Deletes a user from the registry.
   */
  static deleteUser(userId: string, actorName = 'Admin'): boolean {
    const targetUser = this.users.find((u) => u.id === userId);
    if (!targetUser) return false;

    this.users = this.users.filter((u) => u.id !== userId);

    this.logAuditEvent(
      'USER_DELETED',
      `${targetUser.name} (${userId})`,
      'user',
      'critical',
      `Deleted ${targetUser.role} account with email ${targetUser.email}.`,
      actorName
    );

    return true;
  }

  /**
   * Retrieves managed courses with optional filtering and sorting.
   */
  static getCourses(filters?: CourseFilterOptions): AdminCourse[] {
    let list = [...this.courses];

    if (!filters) return list;

    if (filters.searchTerm && filters.searchTerm.trim().length > 0) {
      const q = filters.searchTerm.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.instructorName.toLowerCase().includes(q)
      );
    }

    if (filters.subject && filters.subject !== 'all') {
      list = list.filter((c) => c.subject.toLowerCase() === filters.subject?.toLowerCase());
    }

    if (filters.status && filters.status !== 'all') {
      list = list.filter((c) => c.status === filters.status);
    }

    if (filters.sortBy) {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      switch (filters.sortBy) {
        case 'title':
          list.sort((a, b) => a.title.localeCompare(b.title) * order);
          break;
        case 'enrolled':
          list.sort((a, b) => (a.enrolledCount - b.enrolledCount) * order);
          break;
        case 'rating':
          list.sort((a, b) => (a.rating - b.rating) * order);
          break;
        case 'updatedAt':
          list.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) * order);
          break;
      }
    }

    return list;
  }

  /**
   * Changes course publication status (published, draft, archived).
   */
  static updateCourseStatus(courseId: number, status: AdminCourseStatus, actorName = 'Admin'): AdminCourse {
    const index = this.courses.findIndex((c) => c.id === courseId);
    if (index === -1) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }

    const previousStatus = this.courses[index].status;
    this.courses[index] = {
      ...this.courses[index],
      status,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    this.logAuditEvent(
      'COURSE_STATUS_MODIFIED',
      `${this.courses[index].title} (Course #${courseId})`,
      'course',
      status === 'archived' ? 'warning' : 'info',
      `Course status updated from ${previousStatus} to ${status}.`,
      actorName
    );

    return this.courses[index];
  }

  /**
   * Creates a new course in the curriculum catalog.
   */
  static createCourse(courseData: Partial<AdminCourse>, actorName = 'Admin'): AdminCourse {
    if (!courseData.title?.trim() || !courseData.subject?.trim()) {
      throw new Error('Course title and subject are required.');
    }

    const nextId = this.courses.length > 0 ? Math.max(...this.courses.map((c) => c.id)) + 1 : 1;
    const today = new Date().toISOString().split('T')[0];

    const newCourse: AdminCourse = {
      id: nextId,
      title: courseData.title.trim(),
      subject: courseData.subject.trim(),
      level: courseData.level || 'Grade 6, Grade 7, Grade 8',
      instructorId: courseData.instructorId || 'usr-inst-1',
      instructorName: courseData.instructorName || 'Dr. Evelyn Reed',
      instructorEmail: courseData.instructorEmail || 'evelyn.reed@faculty.edu',
      enrolledCount: 0,
      lessonCount: courseData.lessonCount || 1,
      rating: 5.0,
      status: courseData.status || 'draft',
      createdAt: today,
      updatedAt: today,
    };

    this.courses.unshift(newCourse);

    this.logAuditEvent(
      'COURSE_CREATED',
      `${newCourse.title} (Course #${newCourse.id})`,
      'course',
      'info',
      `Created new course section assigned to ${newCourse.instructorName}.`,
      actorName
    );

    return newCourse;
  }

  /**
   * Deletes a course from the platform.
   */
  static deleteCourse(courseId: number, actorName = 'Admin'): boolean {
    const target = this.courses.find((c) => c.id === courseId);
    if (!target) return false;

    this.courses = this.courses.filter((c) => c.id !== courseId);

    this.logAuditEvent(
      'COURSE_DELETED',
      `${target.title} (Course #${courseId})`,
      'course',
      'critical',
      `Deleted course with ${target.enrolledCount} enrolled students.`,
      actorName
    );

    return true;
  }

  /**
   * Reassigns an instructor to a course.
   */
  static assignInstructor(
    courseId: number,
    instructorName: string,
    instructorEmail: string,
    actorName = 'Admin'
  ): AdminCourse {
    const index = this.courses.findIndex((c) => c.id === courseId);
    if (index === -1) {
      throw new Error(`Course with ID ${courseId} not found.`);
    }

    const prevInstructor = this.courses[index].instructorName;
    this.courses[index] = {
      ...this.courses[index],
      instructorName,
      instructorEmail,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    this.logAuditEvent(
      'INSTRUCTOR_REASSIGNED',
      `${this.courses[index].title} (Course #${courseId})`,
      'course',
      'info',
      `Reassigned lead instructor from ${prevInstructor} to ${instructorName}.`,
      actorName
    );

    return this.courses[index];
  }

  /**
   * Retrieves system audit logs with filtering capability.
   */
  static getAuditLogs(filters?: {
    category?: string;
    severity?: string;
    search?: string;
  }): SystemAuditLog[] {
    let logs = [...this.auditLogs];

    if (!filters) return logs;

    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase().trim();
      logs = logs.filter(
        (l) =>
          l.actor.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.target.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    if (filters.category && filters.category !== 'all') {
      logs = logs.filter((l) => l.category === filters.category);
    }

    if (filters.severity && filters.severity !== 'all') {
      logs = logs.filter((l) => l.severity === filters.severity);
    }

    return logs;
  }

  /**
   * Logs a new event into the administrative audit trail.
   */
  static logAuditEvent(
    action: string,
    target: string,
    category: AuditCategory,
    severity: AuditSeverity,
    details?: string,
    actor = 'System Administrator'
  ): SystemAuditLog {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logItem: SystemAuditLog = {
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      actor,
      action,
      target,
      category,
      severity,
      timestamp,
      details,
    };

    this.auditLogs.unshift(logItem);
    return logItem;
  }

  /**
   * Returns current institutional platform settings.
   */
  static getSettings(): PlatformSettings {
    return { ...this.settings };
  }

  /**
   * Updates platform settings and generates an audit log entry.
   */
  static updateSettings(newSettings: Partial<PlatformSettings>, actorName = 'Admin'): PlatformSettings {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };

    this.logAuditEvent(
      'SETTINGS_UPDATED',
      'Platform Configuration',
      'system',
      'warning',
      `Institutional platform settings updated. Maintenance mode: ${this.settings.maintenanceMode}.`,
      actorName
    );

    return { ...this.settings };
  }

  /**
   * Exports user registry to CSV format.
   */
  static exportUsersCSV(users: AdminUser[]): string {
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Department', 'Created At', 'Last Active'];
    const rows = users.map((u) => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email.replace(/"/g, '""')}"`,
      u.role,
      u.status,
      `"${(u.department || '').replace(/"/g, '""')}"`,
      u.createdAt,
      `"${u.lastActive.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Exports system audit trail to CSV format.
   */
  static exportAuditLogsCSV(logs: SystemAuditLog[]): string {
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Action', 'Category', 'Severity', 'Target', 'Details'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      l.action,
      l.category,
      l.severity,
      `"${l.target.replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
