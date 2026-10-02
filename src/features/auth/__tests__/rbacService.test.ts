import { describe, it, expect } from 'vitest';
import { RbacService } from '../services/rbacService';
import { UserProfile } from '@/shared/types/auth';

describe('RbacService', () => {
  const studentUser: UserProfile = {
    uid: 'stud-1',
    email: 'student@example.com',
    displayName: 'Student Jane',
    photoURL: null,
    role: 'student',
    enrolledCourseIds: ['1', '2'],
    createdAt: '2026-01-01',
    lastLoginAt: '2026-10-01',
  };

  const instructorUser: UserProfile = {
    uid: 'inst-1',
    email: 'teacher@example.com',
    displayName: 'Prof. Smith',
    photoURL: null,
    role: 'instructor',
    enrolledCourseIds: [],
    createdAt: '2026-01-01',
    lastLoginAt: '2026-10-01',
  };

  describe('hasPermission', () => {
    it('allows student to take quizzes but not create courses', () => {
      expect(RbacService.hasPermission('student', 'quizzes:take')).toBe(true);
      expect(RbacService.hasPermission('student', 'courses:create')).toBe(false);
    });

    it('allows instructor to create and edit courses', () => {
      expect(RbacService.hasPermission('instructor', 'courses:create')).toBe(true);
      expect(RbacService.hasPermission('instructor', 'courses:edit')).toBe(true);
    });

    it('allows admin all management permissions', () => {
      expect(RbacService.hasPermission('admin', 'users:manage')).toBe(true);
      expect(RbacService.hasPermission('admin', 'courses:delete')).toBe(true);
    });
  });

  describe('canAccessCourse', () => {
    it('grants student access only to courses they are enrolled in', () => {
      expect(RbacService.canAccessCourse(studentUser, 1)).toBe(true);
      expect(RbacService.canAccessCourse(studentUser, 2)).toBe(true);
      expect(RbacService.canAccessCourse(studentUser, 99)).toBe(false);
    });

    it('grants instructors access to all courses unconditionally', () => {
      expect(RbacService.canAccessCourse(instructorUser, 99)).toBe(true);
    });
  });

  describe('canGrade and canEditCurriculum', () => {
    it('denies grading privileges to students and grants to instructors', () => {
      expect(RbacService.canGrade(studentUser)).toBe(false);
      expect(RbacService.canGrade(instructorUser)).toBe(true);
    });

    it('denies curriculum edit privileges to students and grants to instructors', () => {
      expect(RbacService.canEditCurriculum(studentUser)).toBe(false);
      expect(RbacService.canEditCurriculum(instructorUser)).toBe(true);
    });
  });
});
