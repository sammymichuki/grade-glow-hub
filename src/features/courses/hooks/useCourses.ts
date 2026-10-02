import { useQuery } from '@tanstack/react-query';
import { CourseService } from '../services/courseService';
import { CourseFilter } from '@/shared/types/course';

export function useCoursesList(filters?: CourseFilter) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => CourseService.getCourses(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useCourseDetail(courseId: string | number | undefined) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => (courseId ? CourseService.getCourseById(courseId) : null),
    enabled: !!courseId,
  });
}

export function useLessonDetail(courseId: string | number | undefined, lessonId: string | number | undefined) {
  return useQuery({
    queryKey: ['course-lesson', courseId, lessonId],
    queryFn: () => {
      if (!courseId || !lessonId) return { course: null, lesson: null, prevLesson: null, nextLesson: null };
      return CourseService.getLessonWithNavigation(courseId, lessonId);
    },
    enabled: !!courseId && !!lessonId,
  });
}
