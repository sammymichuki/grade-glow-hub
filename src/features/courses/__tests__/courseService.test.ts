import { describe, it, expect } from 'vitest';
import { CourseService } from '../services/courseService';

describe('CourseService', () => {
  it('returns all initial courses', () => {
    const courses = CourseService.getCourses();
    expect(courses.length).toBeGreaterThan(0);
    expect(courses[0]).toHaveProperty('title');
    expect(courses[0]).toHaveProperty('subject');
  });

  it('filters courses by subject correctly', () => {
    const mathCourses = CourseService.getCourses({ subject: 'Mathematics' });
    expect(mathCourses.length).toBeGreaterThan(0);
    expect(mathCourses.every((c) => c.subject === 'Mathematics')).toBe(true);
  });

  it('filters courses by search query', () => {
    const searchResults = CourseService.getCourses({ searchQuery: 'linear inequalities' });
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].title).toBe('Mathematics Fundamentals');
  });

  it('finds course by id', () => {
    const course = CourseService.getCourseById(1);
    expect(course).not.toBeNull();
    expect(course?.title).toBe('Mathematics Fundamentals');
  });

  it('returns null for non-existent course id', () => {
    const course = CourseService.getCourseById(99999);
    expect(course).toBeNull();
  });

  it('handles lesson navigation correctly (prev and next links)', () => {
    const nav = CourseService.getLessonWithNavigation(1, 2);
    expect(nav.course).not.toBeNull();
    expect(nav.lesson?.title).toBe('Solving linear inequalities');
    expect(nav.prevLesson?.id).toBe(1);
    expect(nav.nextLesson?.id).toBe(3);
  });

  it('sets prevLesson to null for the first lesson', () => {
    const nav = CourseService.getLessonWithNavigation(1, 1);
    expect(nav.prevLesson).toBeNull();
    expect(nav.nextLesson?.id).toBe(2);
  });

  it('calculates completion rate percentages accurately', () => {
    expect(CourseService.calculateCompletionRate(5, 10)).toBe(50);
    expect(CourseService.calculateCompletionRate(10, 10)).toBe(100);
    expect(CourseService.calculateCompletionRate(0, 10)).toBe(0);
    expect(CourseService.calculateCompletionRate(0, 0)).toBe(0);
  });
});
