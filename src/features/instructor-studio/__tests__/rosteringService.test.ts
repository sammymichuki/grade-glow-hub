import { describe, it, expect } from 'vitest';
import { RosteringService } from '../services/rosteringService';
import { StudentRosterItem } from '@/shared/types/instructor';

describe('RosteringService', () => {
  const sampleStudents: StudentRosterItem[] = [
    {
      id: 'stu-1',
      studentId: 'STU-100',
      name: 'Alice Johnson',
      email: 'alice@student.edu',
      gradeLevel: 8,
      enrolledCourseIds: [1, 2],
      enrollmentDate: '2026-09-01',
      attendancePercentage: 98,
      currentGpa: 3.8,
      status: 'active',
    },
    {
      id: 'stu-2',
      studentId: 'STU-101',
      name: 'Bob Williams',
      email: 'bob@student.edu',
      gradeLevel: 7,
      enrolledCourseIds: [1],
      enrollmentDate: '2026-09-01',
      attendancePercentage: 86,
      currentGpa: 2.6,
      status: 'active',
    },
    {
      id: 'stu-3',
      studentId: 'STU-102',
      name: 'Charlie Davis',
      email: 'charlie@student.edu',
      gradeLevel: 8,
      enrolledCourseIds: [],
      enrollmentDate: '2026-09-02',
      attendancePercentage: 70,
      currentGpa: 1.9,
      status: 'suspended',
    },
  ];

  it('parses valid CSV string into StudentRosterItem list', () => {
    const csv = `studentId,name,email,gradeLevel,currentGpa,attendancePercentage,status
STU-501,Daniel Craig,daniel@student.edu,8,3.95,99.0,active
STU-502,Emma Watson,emma@student.edu,9,4.00,100.0,active`;

    const result = RosteringService.parseRosterCSV(csv);
    expect(result.validStudents.length).toBe(2);
    expect(result.errors.length).toBe(0);
    expect(result.validStudents[0].studentId).toBe('STU-501');
    expect(result.validStudents[0].name).toBe('Daniel Craig');
    expect(result.validStudents[0].currentGpa).toBe(3.95);
    expect(result.validStudents[1].gradeLevel).toBe(9);
  });

  it('catches invalid rows and records syntax errors during CSV import', () => {
    const badCsv = `studentId,name,email,gradeLevel,currentGpa,attendancePercentage,status
,Missing Id,test@student.edu,8,3.0,90,active
STU-88,A,,8,3.0,90,active
STU-89,Valid Student,valid@student.edu,8,3.0,90,active`;

    const result = RosteringService.parseRosterCSV(badCsv);
    expect(result.validStudents.length).toBe(1);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0].reason).toContain('Missing student ID');
    expect(result.errors[1].reason).toContain('too short');
  });

  it('exports students list to properly formatted CSV', () => {
    const csvOutput = RosteringService.exportRosterToCSV(sampleStudents);
    const lines = csvOutput.split('\n');

    expect(lines[0]).toContain('studentId,name,email,gradeLevel,currentGpa');
    expect(lines.length).toBe(4); // Header + 3 student lines
    expect(lines[1]).toContain('"Alice Johnson"');
  });

  it('filters students by search query, grade level, and status', () => {
    const searchResult = RosteringService.filterRoster(sampleStudents, { searchTerm: 'alice' });
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].name).toBe('Alice Johnson');

    const grade8Result = RosteringService.filterRoster(sampleStudents, { gradeLevel: 8 });
    expect(grade8Result.length).toBe(2);

    const suspendedResult = RosteringService.filterRoster(sampleStudents, { status: 'suspended' });
    expect(suspendedResult.length).toBe(1);
    expect(suspendedResult[0].name).toBe('Charlie Davis');

    const courseEnrolled = RosteringService.filterRoster(sampleStudents, { courseId: 2 });
    expect(courseEnrolled.length).toBe(1);
    expect(courseEnrolled[0].studentId).toBe('STU-100');
  });

  it('calculates cohort metrics correctly', () => {
    const metrics = RosteringService.calculateRosterMetrics(sampleStudents);

    expect(metrics.totalStudents).toBe(3);
    // GPA average: (3.8 + 2.6 + 1.9) / 3 = 8.3 / 3 = 2.77
    expect(metrics.averageGpa).toBe(2.77);
    // Attendance average: (98 + 86 + 70) / 3 = 254 / 3 = 84.7%
    expect(metrics.averageAttendance).toBe(84.7);
    expect(metrics.activeCount).toBe(2);
    expect(metrics.suspendedCount).toBe(1);
  });

  it('enrolls and unenrolls students in courses without duplicates', () => {
    const student = sampleStudents[1]; // Bob Williams, enrolled in [1]
    const enrolledInCourse2 = RosteringService.enrollStudentInCourse(student, 2);
    expect(enrolledInCourse2.enrolledCourseIds).toEqual([1, 2]);

    // Re-enrolling does not create duplicate
    const reEnrolled = RosteringService.enrollStudentInCourse(enrolledInCourse2, 2);
    expect(reEnrolled.enrolledCourseIds).toEqual([1, 2]);

    // Unenrolling removes course
    const unenrolled = RosteringService.unenrollStudentFromCourse(reEnrolled, 1);
    expect(unenrolled.enrolledCourseIds).toEqual([2]);
  });
});
