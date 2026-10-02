import { Course, CourseFilter } from '@/shared/types/course';
import { COURSES_DATA, LESSONS_BY_COURSE_NAME, LegacyLesson } from '../data/coursesData';

export class CourseService {
  /**
   * Retrieves all available courses, optionally applying filter criteria.
   */
  static getCourses(filters?: CourseFilter): Course[] {
    let results = [...COURSES_DATA];

    if (!filters) {
      return results;
    }

    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q)
      );
    }

    if (filters.subject && filters.subject !== 'all') {
      const subjectLower = filters.subject.toLowerCase();
      results = results.filter((c) => c.subject.toLowerCase() === subjectLower);
    }

    if (filters.level && filters.level !== 'all') {
      const levelLower = filters.level.toLowerCase();
      results = results.filter((c) => c.level.toLowerCase().includes(levelLower));
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'popular':
          results.sort((a, b) => (b.enrolledStudentsCount || 0) - (a.enrolledStudentsCount || 0));
          break;
        case 'title':
          results.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'newest':
          results.sort((a, b) => b.id - a.id);
          break;
      }
    }

    return results;
  }

  /**
   * Retrieves a single course by its numeric ID.
   */
  static getCourseById(id: number | string): Course | null {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numId)) return null;
    return COURSES_DATA.find((c) => c.id === numId) || null;
  }

  /**
   * Retrieves lessons associated with a course by its title or ID.
   */
  static getLessonsByCourse(course: Course | string): LegacyLesson[] {
    const title = typeof course === 'string' ? course : course.title;
    return LESSONS_BY_COURSE_NAME[title] || [];
  }

  /**
   * Retrieves a specific lesson and its surrounding next/previous lessons.
   */
  static getLessonWithNavigation(courseId: number | string, lessonId: number | string) {
    const course = this.getCourseById(courseId);
    if (!course) {
      return { course: null, lesson: null, prevLesson: null, nextLesson: null };
    }

    const lessons = this.getLessonsByCourse(course);
    const numLessonId = typeof lessonId === 'string' ? parseInt(lessonId, 10) : lessonId;
    const currentIndex = lessons.findIndex((l) => l.id === numLessonId);

    if (currentIndex === -1) {
      return { course, lesson: null, prevLesson: null, nextLesson: null };
    }

    const lesson = lessons[currentIndex];
    const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

    return { course, lesson, prevLesson, nextLesson };
  }

  /**
   * Returns a list of distinct subjects across all courses.
   */
  static getUniqueSubjects(): string[] {
    return Array.from(new Set(COURSES_DATA.map((c) => c.subject)));
  }

  /**
   * Returns a list of distinct level identifiers across all courses.
   */
  static getUniqueLevels(): string[] {
    const levels = new Set<string>();
    COURSES_DATA.forEach((c) => {
      c.level.split(',').forEach((l) => levels.add(l.trim()));
    });
    return Array.from(levels);
  }

  /**
   * Calculates completion percentage for a course.
   */
  static calculateCompletionRate(completedCount: number, totalCount: number): number {
    if (totalCount <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100)));
  }
}
