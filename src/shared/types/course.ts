export type GradeLevel = 'Grade-4' | 'Grade-5' | 'Grade-6' | 'Grade-7' | 'Grade-8' | 'Grade-9' | 'All Levels';

export type Subject =
  | 'Mathematics'
  | 'Integrated Science'
  | 'English'
  | 'Social Studies'
  | 'Agrinutrition'
  | 'Pre-Technical Studies'
  | 'Creative Arts & Sports';

export interface Lesson {
  id: string;
  courseId: number;
  title: string;
  durationMinutes: number;
  pdfUrl?: string;
  videoUrl?: string;
  description?: string;
  order: number;
  isCompleted?: boolean;
}

export interface Module {
  id: string;
  courseId: number;
  title: string;
  description?: string;
  lessons: Lesson[];
  order: number;
}

export interface Course {
  id: number;
  title: string;
  subject: Subject;
  description: string;
  image: string;
  level: string; // e.g. "Grade-4" or comma-separated "Grade-4, Grade-7"
  lessonCount: number;
  instructorId?: string;
  instructorName?: string;
  modules?: Module[];
  rating?: number;
  reviewCount?: number;
  enrolledStudentsCount?: number;
}

export interface CourseFilter {
  searchQuery?: string;
  subject?: string;
  level?: string;
  sortBy?: 'popular' | 'newest' | 'title';
}

export interface EnrollmentRecord {
  courseId: number;
  userId: string;
  enrolledAt: string;
  progressPercent: number;
  completedLessonIds: string[];
  lastAccessedLessonId?: string;
}
