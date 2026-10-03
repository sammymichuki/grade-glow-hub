import { describe, it, expect, beforeEach } from 'vitest';
import { AdminService } from '../services/adminService';

describe('adminService', () => {
  beforeEach(() => {
    AdminService.resetToDefault();
  });

  describe('getMetrics', () => {
    it('aggregates user counts by role', () => {
      const metrics = AdminService.getMetrics();

      expect(metrics.totalUsers).toBe(14);
      expect(metrics.totalStudents).toBe(7);
      expect(metrics.totalInstructors).toBe(3);
    });

    it('counts only active users as active', () => {
      const metrics = AdminService.getMetrics();

      // 14 total fixtures minus 1 suspended and 1 pending account.
      expect(metrics.activeUsers).toBe(12);
    });

    it('separates published courses from drafts and archives', () => {
      const metrics = AdminService.getMetrics();

      expect(metrics.totalCourses).toBe(7);
      expect(metrics.publishedCourses).toBe(5);
    });

    it('sums enrollment counts across every course', () => {
      const metrics = AdminService.getMetrics();

      expect(metrics.totalEnrollments).toBe(384 + 295 + 210 + 168 + 142 + 0 + 88);
    });

    it('computes the average course rating to two decimals', () => {
      const metrics = AdminService.getMetrics();

      expect(metrics.averageCourseRating).toBe(4.69);
    });

    it('exposes static platform health indicators', () => {
      const metrics = AdminService.getMetrics();

      expect(metrics.systemUptimePercentage).toBeGreaterThan(99);
      expect(metrics.averageAttendanceRate).toBeGreaterThan(0);
      expect(metrics.completedQuizzesCount).toBeGreaterThan(0);
    });

    it('recomputes metrics after a user is deleted', () => {
      const before = AdminService.getMetrics().totalUsers;

      AdminService.deleteUser('usr-stu-1');

      expect(AdminService.getMetrics().totalUsers).toBe(before - 1);
    });
  });

  describe('getUsers', () => {
    it('returns the full registry when no filters are supplied', () => {
      expect(AdminService.getUsers().length).toBe(14);
    });

    it('searches users by name, email, and department', () => {
      expect(AdminService.getUsers({ searchTerm: 'Amina' }).map((u) => u.name)).toEqual(['Amina Kimani']);

      const byEmail = AdminService.getUsers({ searchTerm: 'alex.rivera@ta.edu' });
      expect(byEmail).toHaveLength(1);
      expect(byEmail[0].name).toBe('Alex Rivera');

      const byDepartment = AdminService.getUsers({ searchTerm: 'Biological Sciences' });
      expect(byDepartment.length).toBeGreaterThan(0);
      expect(byDepartment.every((u) => u.department === 'Biological Sciences')).toBe(true);
    });

    it('matches searches case-insensitively and ignores surrounding whitespace', () => {
      expect(AdminService.getUsers({ searchTerm: '  JANE DOE  ' })).toHaveLength(1);
    });

    it('returns an empty list when the search matches nothing', () => {
      expect(AdminService.getUsers({ searchTerm: 'no-such-person' })).toHaveLength(0);
    });

    it('filters users by role', () => {
      const tas = AdminService.getUsers({ role: 'ta' });

      expect(tas).toHaveLength(2);
      expect(tas.every((u) => u.role === 'ta')).toBe(true);
    });

    it('filters users by account status', () => {
      const suspended = AdminService.getUsers({ status: 'suspended' });
      expect(suspended).toHaveLength(1);
      expect(suspended[0].name).toBe('Tariq Hassan');

      const pending = AdminService.getUsers({ status: 'pending' });
      expect(pending).toHaveLength(1);
      expect(pending[0].name).toBe('Chloe Dubois');
    });

    it('treats the "all" sentinel as no filter', () => {
      expect(AdminService.getUsers({ role: 'all', status: 'all' })).toHaveLength(14);
    });

    it('sorts users by name in both directions', () => {
      const asc = AdminService.getUsers({ sortBy: 'name', sortOrder: 'asc' }).map((u) => u.name);
      const desc = AdminService.getUsers({ sortBy: 'name', sortOrder: 'desc' }).map((u) => u.name);

      expect(asc[0]).toBe('Alex Rivera');
      expect(desc[0]).toBe('Tariq Hassan');
      expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b)));
    });

    it('combines search, role, and status filters conjunctively', () => {
      const result = AdminService.getUsers({
        searchTerm: 'student.edu',
        role: 'student',
        status: 'active',
      });

      // 7 student fixtures minus the 1 suspended and 1 pending account.
      expect(result).toHaveLength(5);
      expect(result.every((u) => u.role === 'student' && u.status === 'active')).toBe(true);
    });

    it('does not mutate the underlying registry when filtering', () => {
      AdminService.getUsers({ role: 'ta' });

      expect(AdminService.getUsers().length).toBe(14);
    });
  });

  describe('updateUserRole', () => {
    it('updates the role of an existing user', () => {
      const updated = AdminService.updateUserRole('usr-stu-2', 'ta');

      expect(updated.role).toBe('ta');
      expect(AdminService.getUsers({ role: 'ta' })).toHaveLength(3);
    });

    it('throws when the user does not exist', () => {
      expect(() => AdminService.updateUserRole('missing-user', 'admin')).toThrow(/not found/i);
    });

    it('writes a warning audit entry describing the previous role', () => {
      AdminService.updateUserRole('usr-stu-2', 'instructor', 'Dr. Robert Vance');

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.action).toBe('ROLE_MODIFIED');
      expect(latest.category).toBe('user');
      expect(latest.severity).toBe('warning');
      expect(latest.actor).toBe('Dr. Robert Vance');
      expect(latest.details).toContain('STUDENT');
      expect(latest.details).toContain('INSTRUCTOR');
    });
  });

  describe('updateUserStatus', () => {
    it('suspends an active account', () => {
      const updated = AdminService.updateUserStatus('usr-stu-3', 'suspended');

      expect(updated.status).toBe('suspended');
    });

    it('logs a critical audit entry when an account is suspended', () => {
      AdminService.updateUserStatus('usr-stu-3', 'suspended');

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.action).toBe('STATUS_CHANGED');
      expect(latest.category).toBe('security');
      expect(latest.severity).toBe('critical');
    });

    it('logs an informational audit entry when an account is reinstated', () => {
      AdminService.updateUserStatus('usr-stu-6', 'active');

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.severity).toBe('info');
      expect(latest.details).toContain('suspended');
      expect(latest.details).toContain('active');
    });

    it('throws when the user does not exist', () => {
      expect(() => AdminService.updateUserStatus('missing-user', 'active')).toThrow(/not found/i);
    });
  });

  describe('addUser', () => {
    const newStudent = {
      name: 'Nia Okafor',
      email: 'nia.okafor@student.edu',
      role: 'student' as const,
      status: 'active' as const,
      gradeLevel: 8,
      department: 'Middle School Secondary',
      enrolledCourseIds: [1],
    };

    it('registers a new account and returns it', () => {
      const created = AdminService.addUser(newStudent);

      expect(created.id).toMatch(/^usr-/);
      expect(created.name).toBe('Nia Okafor');
      expect(AdminService.getUsers()).toHaveLength(15);
      expect(AdminService.getUsers({ searchTerm: 'Nia Okafor' })).toHaveLength(1);
    });

    it('trims whitespace from the supplied name and email', () => {
      const created = AdminService.addUser({ ...newStudent, name: '  Nia Trimmed  ' });

      expect(created.name).toBe('Nia Trimmed');
    });

    it('rejects blank name or email values', () => {
      expect(() => AdminService.addUser({ ...newStudent, name: '   ' })).toThrow(/required/i);
      expect(() => AdminService.addUser({ ...newStudent, email: '' })).toThrow(/required/i);
    });

    it('rejects duplicate email addresses regardless of casing', () => {
      expect(() => AdminService.addUser({ ...newStudent, email: 'JANE.DOE@STUDENT.EDU' })).toThrow(
        /already exists/i
      );
    });

    it('logs an informational audit entry for the creation', () => {
      AdminService.addUser(newStudent, 'Dr. Robert Vance');

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.action).toBe('USER_CREATED');
      expect(latest.actor).toBe('Dr. Robert Vance');
    });
  });

  describe('deleteUser', () => {
    it('removes the account from the registry', () => {
      const removed = AdminService.deleteUser('usr-stu-1');

      expect(removed).toBe(true);
      expect(AdminService.getUsers()).toHaveLength(13);
      expect(AdminService.getUsers({ searchTerm: 'Jane Doe' })).toHaveLength(0);
    });

    it('returns false for an unknown user id', () => {
      expect(AdminService.deleteUser('missing-user')).toBe(false);
    });

    it('logs a critical audit entry for the deletion', () => {
      AdminService.deleteUser('usr-stu-1');

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.action).toBe('USER_DELETED');
      expect(latest.severity).toBe('critical');
    });
  });

  describe('getCourses', () => {
    it('returns the full catalog when no filters are supplied', () => {
      expect(AdminService.getCourses().length).toBe(7);
    });

    it('searches courses by title, subject, and instructor', () => {
      expect(AdminService.getCourses({ searchTerm: 'Biology' })).toHaveLength(1);
      expect(AdminService.getCourses({ searchTerm: 'Zhang' })).toHaveLength(2);
      expect(AdminService.getCourses({ searchTerm: 'Chemistry' })[0].subject).toBe('Science');
    });

    it('filters courses by subject case-insensitively', () => {
      const science = AdminService.getCourses({ subject: 'science' });

      expect(science).toHaveLength(2);
      expect(science.every((c) => c.subject === 'Science')).toBe(true);
    });

    it('filters courses by publication status', () => {
      expect(AdminService.getCourses({ status: 'published' })).toHaveLength(5);
      expect(AdminService.getCourses({ status: 'draft' })).toHaveLength(1);
      expect(AdminService.getCourses({ status: 'archived' })).toHaveLength(1);
    });

    it('sorts courses by enrollment count descending', () => {
      const sorted = AdminService.getCourses({ sortBy: 'enrolled', sortOrder: 'desc' });

      expect(sorted[0].enrolledCount).toBe(384);
      expect(sorted[sorted.length - 1].enrolledCount).toBe(0);
    });

    it('sorts courses by title ascending', () => {
      const sorted = AdminService.getCourses({ sortBy: 'title', sortOrder: 'asc' }).map((c) => c.title);

      expect(sorted[0]).toBe('Biology: Cells & Systems');
      expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)));
    });

    it('sorts courses by rating descending', () => {
      const sorted = AdminService.getCourses({ sortBy: 'rating', sortOrder: 'desc' });

      expect(sorted[0].rating).toBe(5.0);
    });
  });

  describe('updateCourseStatus', () => {
    it('archives a published course and stamps the update date', () => {
      const updated = AdminService.updateCourseStatus(1, 'archived');

      expect(updated.status).toBe('archived');
      expect(AdminService.getCourses({ status: 'published' })).toHaveLength(4);
    });

    it('raises severity to warning when archiving', () => {
      AdminService.updateCourseStatus(1, 'archived');

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.action).toBe('COURSE_STATUS_MODIFIED');
      expect(latest.severity).toBe('warning');
    });

    it('keeps informational severity when publishing', () => {
      AdminService.updateCourseStatus(6, 'published');

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.severity).toBe('info');
    });

    it('throws when the course does not exist', () => {
      expect(() => AdminService.updateCourseStatus(999, 'draft')).toThrow(/not found/i);
    });
  });

  describe('createCourse', () => {
    it('creates a draft course with an incremented id by default', () => {
      const created = AdminService.createCourse({ title: 'Astronomy Basics', subject: 'Science' });

      expect(created.id).toBe(8);
      expect(created.status).toBe('draft');
      expect(created.enrolledCount).toBe(0);
      expect(created.rating).toBe(5.0);
      expect(AdminService.getCourses()).toHaveLength(8);
    });

    it('trims the supplied title', () => {
      const created = AdminService.createCourse({ title: '  Astronomy Basics  ', subject: 'Science' });

      expect(created.title).toBe('Astronomy Basics');
    });

    it('honours an explicit publication status', () => {
      const created = AdminService.createCourse({
        title: 'Astronomy Basics',
        subject: 'Science',
        status: 'published',
      });

      expect(created.status).toBe('published');
    });

    it('rejects a missing title or subject', () => {
      expect(() => AdminService.createCourse({ subject: 'Science' })).toThrow(/required/i);
      expect(() => AdminService.createCourse({ title: 'Astronomy Basics' })).toThrow(/required/i);
    });

    it('logs an audit entry for the creation', () => {
      AdminService.createCourse({ title: 'Astronomy Basics', subject: 'Science' });

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.action).toBe('COURSE_CREATED');
      expect(latest.category).toBe('course');
    });
  });

  describe('deleteCourse', () => {
    it('removes the course from the catalog', () => {
      const removed = AdminService.deleteCourse(1);

      expect(removed).toBe(true);
      expect(AdminService.getCourses()).toHaveLength(6);
    });

    it('returns false for an unknown course id', () => {
      expect(AdminService.deleteCourse(999)).toBe(false);
    });

    it('logs a critical audit entry mentioning the enrollment impact', () => {
      AdminService.deleteCourse(1);

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.action).toBe('COURSE_DELETED');
      expect(latest.severity).toBe('critical');
      expect(latest.details).toContain('384');
    });
  });

  describe('assignInstructor', () => {
    it('reassigns the lead instructor on a course', () => {
      const updated = AdminService.assignInstructor(1, 'Prof. Amina Patel', 'amina.patel@faculty.edu');

      expect(updated.instructorName).toBe('Prof. Amina Patel');
      expect(updated.instructorEmail).toBe('amina.patel@faculty.edu');
    });

    it('records the previous instructor in the audit trail', () => {
      AdminService.assignInstructor(1, 'Prof. Amina Patel', 'amina.patel@faculty.edu');

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.action).toBe('INSTRUCTOR_REASSIGNED');
      expect(latest.details).toContain('Dr. Evelyn Reed');
      expect(latest.details).toContain('Prof. Amina Patel');
    });

    it('throws when the course does not exist', () => {
      expect(() => AdminService.assignInstructor(999, 'Dr. Nobody', 'nobody@faculty.edu')).toThrow(
        /not found/i
      );
    });
  });

  describe('getAuditLogs', () => {
    it('returns the seeded audit trail', () => {
      expect(AdminService.getAuditLogs()).toHaveLength(6);
    });

    it('filters logs by category', () => {
      const security = AdminService.getAuditLogs({ category: 'security' });

      expect(security).toHaveLength(1);
      expect(security[0].action).toBe('SECURITY_ALERT');
    });

    it('filters logs by severity', () => {
      const critical = AdminService.getAuditLogs({ severity: 'critical' });

      expect(critical).toHaveLength(1);
      expect(critical.every((l) => l.severity === 'critical')).toBe(true);
    });

    it('searches logs across actor, action, target, and details', () => {
      expect(AdminService.getAuditLogs({ search: 'Robert Vance' }).length).toBeGreaterThan(0);
      expect(AdminService.getAuditLogs({ search: 'curve' })).toHaveLength(1);
      expect(AdminService.getAuditLogs({ search: '192.168.1.104' })).toHaveLength(1);
    });

    it('prepends newly logged events to the top of the trail', () => {
      const before = AdminService.getAuditLogs().length;

      AdminService.logAuditEvent('CUSTOM_EVENT', 'Test Target', 'system', 'info', 'Manual entry.');

      const logs = AdminService.getAuditLogs();
      expect(logs).toHaveLength(before + 1);
      expect(logs[0].action).toBe('CUSTOM_EVENT');
      expect(logs[0].actor).toBe('System Administrator');
    });

    it('formats logged timestamps as sortable date-time strings', () => {
      const log = AdminService.logAuditEvent('CUSTOM_EVENT', 'Test Target', 'system', 'info');

      expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('platform settings', () => {
    it('returns a defensive copy of the settings', () => {
      const settings = AdminService.getSettings();
      settings.institutionName = 'Mutated';

      expect(AdminService.getSettings().institutionName).toBe('GradeGlow Institutional Academy');
    });

    it('merges partial updates into the existing settings', () => {
      const updated = AdminService.updateSettings({ maintenanceMode: true, maxQuizAttempts: 5 });

      expect(updated.maintenanceMode).toBe(true);
      expect(updated.maxQuizAttempts).toBe(5);
      expect(updated.sessionTimeoutMinutes).toBe(60);
    });

    it('logs a warning audit entry whenever settings change', () => {
      AdminService.updateSettings({ allowSelfRegistration: false });

      const latest = AdminService.getAuditLogs()[0];
      expect(latest.action).toBe('SETTINGS_UPDATED');
      expect(latest.category).toBe('system');
      expect(latest.severity).toBe('warning');
    });

    it('restores institutional defaults on reset', () => {
      AdminService.updateSettings({ maintenanceMode: true, institutionName: 'Temporary Academy' });
      AdminService.resetToDefault();

      const settings = AdminService.getSettings();
      expect(settings.maintenanceMode).toBe(false);
      expect(settings.institutionName).toBe('GradeGlow Institutional Academy');
    });

    it('resets user and course registries alongside settings', () => {
      AdminService.deleteUser('usr-stu-1');
      AdminService.deleteCourse(1);
      AdminService.resetToDefault();

      expect(AdminService.getUsers()).toHaveLength(14);
      expect(AdminService.getCourses()).toHaveLength(7);
    });
  });

  describe('CSV exports', () => {
    it('exports the user registry with a header row and one row per user', () => {
      const csv = AdminService.exportUsersCSV(AdminService.getUsers());
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        'User ID,Name,Email,Role,Status,Department,Created At,Last Active'
      );
      expect(lines).toHaveLength(15);
    });

    it('escapes embedded double quotes in user fields', () => {
      const users = AdminService.getUsers();
      users[0].name = 'Dr. "Bobby" Tables';

      const csv = AdminService.exportUsersCSV([users[0]]);
      expect(csv).toContain('"Dr. ""Bobby"" Tables"');
    });

    it('exports only the supplied subset of users', () => {
      const csv = AdminService.exportUsersCSV(AdminService.getUsers({ role: 'ta' }));

      expect(csv.split('\n')).toHaveLength(3);
    });

    it('exports the audit trail with a header row and one row per log', () => {
      const csv = AdminService.exportAuditLogsCSV(AdminService.getAuditLogs());
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Log ID,Timestamp,Actor,Action,Category,Severity,Target,Details');
      expect(lines).toHaveLength(7);
    });

    it('renders empty details cells for logs without details', () => {
      const logs = AdminService.getAuditLogs();
      delete logs[0].details;

      const csv = AdminService.exportAuditLogsCSV([logs[0]]);
      expect(csv.trim().endsWith(',""')).toBe(true);
    });
  });
});
