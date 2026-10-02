import { StudentRosterItem, StudentStatus } from '@/shared/types/instructor';

export interface RosterFilterCriteria {
  searchTerm?: string;
  gradeLevel?: number;
  status?: StudentStatus;
  courseId?: number;
}

export interface ParseRosterResult {
  validStudents: StudentRosterItem[];
  errors: { row: number; reason: string }[];
}

export class RosteringService {
  /**
   * Parses a raw CSV string into strongly validated StudentRosterItem objects.
   * Expects header: studentId,name,email,gradeLevel,currentGpa,attendancePercentage,status
   */
  static parseRosterCSV(csvContent: string): ParseRosterResult {
    const validStudents: StudentRosterItem[] = [];
    const errors: { row: number; reason: string }[] = [];

    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      return { validStudents: [], errors: [{ row: 1, reason: 'Empty or missing header line.' }] };
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const idIdx = header.indexOf('studentid');
    const nameIdx = header.indexOf('name');
    const emailIdx = header.indexOf('email');
    const gradeIdx = header.indexOf('gradelevel');
    const gpaIdx = header.indexOf('currentgpa');
    const attIdx = header.indexOf('attendancepercentage');
    const statusIdx = header.indexOf('status');

    if (idIdx === -1 || nameIdx === -1 || emailIdx === -1) {
      return {
        validStudents: [],
        errors: [{ row: 1, reason: 'CSV must include headers: studentId, name, email' }],
      };
    }

    for (let i = 1; i < lines.length; i++) {
      const lineNum = i + 1;
      const values = lines[i].split(',').map((v) => v.trim());

      const studentId = values[idIdx];
      const name = values[nameIdx];
      const email = values[emailIdx];

      if (!studentId) {
        errors.push({ row: lineNum, reason: 'Missing student ID.' });
        continue;
      }
      if (!name || name.length < 2) {
        errors.push({ row: lineNum, reason: 'Name is missing or too short.' });
        continue;
      }
      if (!email || !email.includes('@')) {
        errors.push({ row: lineNum, reason: 'Invalid or missing email address.' });
        continue;
      }

      const gradeLevel = gradeIdx !== -1 && values[gradeIdx] ? parseInt(values[gradeIdx], 10) : 7;
      const currentGpa = gpaIdx !== -1 && values[gpaIdx] ? parseFloat(values[gpaIdx]) : 3.0;
      const attendance = attIdx !== -1 && values[attIdx] ? parseFloat(values[attIdx]) : 95.0;
      const rawStatus = (statusIdx !== -1 ? values[statusIdx] : 'active').toLowerCase();
      const status: StudentStatus =
        rawStatus === 'suspended' || rawStatus === 'pending' ? rawStatus : 'active';

      validStudents.push({
        id: `stu-${Date.now()}-${i}`,
        studentId,
        name,
        email,
        gradeLevel: isNaN(gradeLevel) ? 7 : gradeLevel,
        currentGpa: isNaN(currentGpa) ? 3.0 : Math.min(4.0, Math.max(0, currentGpa)),
        attendancePercentage: isNaN(attendance) ? 95 : Math.min(100, Math.max(0, attendance)),
        status,
        enrolledCourseIds: [],
        enrollmentDate: new Date().toISOString().split('T')[0],
      });
    }

    return { validStudents, errors };
  }

  /**
   * Generates a standard CSV representation of the given student roster.
   */
  static exportRosterToCSV(students: StudentRosterItem[]): string {
    const headers = [
      'studentId',
      'name',
      'email',
      'gradeLevel',
      'currentGpa',
      'attendancePercentage',
      'status',
      'enrolledCourseCount',
    ];

    const rows = students.map((s) => [
      `"${s.studentId}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      s.gradeLevel,
      s.currentGpa.toFixed(2),
      s.attendancePercentage.toFixed(1),
      s.status,
      s.enrolledCourseIds.length,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Filters roster by text query, grade level, status, and course enrollment.
   */
  static filterRoster(
    students: StudentRosterItem[],
    criteria: RosterFilterCriteria
  ): StudentRosterItem[] {
    return students.filter((s) => {
      if (criteria.searchTerm) {
        const query = criteria.searchTerm.toLowerCase();
        const matchesText =
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.studentId.toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      if (criteria.gradeLevel !== undefined && criteria.gradeLevel !== null) {
        if (s.gradeLevel !== criteria.gradeLevel) return false;
      }

      if (criteria.status && s.status !== criteria.status) {
        return false;
      }

      if (criteria.courseId !== undefined && criteria.courseId !== null) {
        if (!s.enrolledCourseIds.includes(criteria.courseId)) return false;
      }

      return true;
    });
  }

  /**
   * Calculates overall attendance, GPA, and enrollment counts for a class cohort.
   */
  static calculateRosterMetrics(students: StudentRosterItem[]): {
    totalStudents: number;
    averageGpa: number;
    averageAttendance: number;
    activeCount: number;
    suspendedCount: number;
  } {
    if (!students.length) {
      return {
        totalStudents: 0,
        averageGpa: 0,
        averageAttendance: 0,
        activeCount: 0,
        suspendedCount: 0,
      };
    }

    const totalGpa = students.reduce((sum, s) => sum + s.currentGpa, 0);
    const totalAttendance = students.reduce((sum, s) => sum + s.attendancePercentage, 0);
    const activeCount = students.filter((s) => s.status === 'active').length;
    const suspendedCount = students.filter((s) => s.status === 'suspended').length;

    return {
      totalStudents: students.length,
      averageGpa: Math.round((totalGpa / students.length) * 100) / 100,
      averageAttendance: Math.round((totalAttendance / students.length) * 10) / 10,
      activeCount,
      suspendedCount,
    };
  }

  /**
   * Enrolls a student in a course if not already enrolled.
   */
  static enrollStudentInCourse(student: StudentRosterItem, courseId: number): StudentRosterItem {
    if (student.enrolledCourseIds.includes(courseId)) {
      return student;
    }
    return {
      ...student,
      enrolledCourseIds: [...student.enrolledCourseIds, courseId],
    };
  }

  /**
   * Unenrolls a student from a course.
   */
  static unenrollStudentFromCourse(student: StudentRosterItem, courseId: number): StudentRosterItem {
    return {
      ...student,
      enrolledCourseIds: student.enrolledCourseIds.filter((id) => id !== courseId),
    };
  }
}
