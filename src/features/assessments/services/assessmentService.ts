import { Quiz, QuizAttempt, QuestionSubmission } from '@/shared/types/assessment';
import { SAMPLE_QUIZZES } from '../data/sampleQuizzes';
import { QuizEvaluator, QuestionEvaluation } from '../lib/quizEvaluator';

const ATTEMPTS_STORAGE_KEY = 'grade_glow_quiz_attempts';

export class AssessmentService {
  /**
   * Retrieves a quiz definition by ID.
   */
  static getQuizById(id: string): Quiz | null {
    return SAMPLE_QUIZZES.find((q) => q.id === id) || null;
  }

  /**
   * Retrieves quizzes associated with a course.
   */
  static getQuizzesByCourseId(courseId: number | string): Quiz[] {
    const numId = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    return SAMPLE_QUIZZES.filter((q) => q.courseId === numId);
  }

  /**
   * Retrieves a checkpoint quiz for a specific lesson.
   */
  static getQuizByLesson(courseId: number | string, lessonId: string): Quiz | null {
    const numId = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    return (
      SAMPLE_QUIZZES.find((q) => q.courseId === numId && q.lessonId === lessonId) || null
    );
  }

  /**
   * Evaluates student answers, records the attempt, and saves to localStorage.
   */
  static submitQuiz(
    quizOrId: string | Quiz,
    studentId: string,
    answers: Record<string, QuestionSubmission>
  ): { attempt: QuizAttempt; questionEvaluations: QuestionEvaluation[] } | null {
    const quiz = typeof quizOrId === 'string' ? this.getQuizById(quizOrId) : quizOrId;
    if (!quiz) return null;

    const evaluation = QuizEvaluator.evaluateAttempt(quiz, studentId, answers);

    // Save to local storage cache
    this.saveAttempt(evaluation.attempt);

    return evaluation;
  }

  /**
   * Saves an attempt to local storage.
   */
  static saveAttempt(attempt: QuizAttempt): void {
    try {
      const existingRaw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
      const attempts: QuizAttempt[] = existingRaw ? JSON.parse(existingRaw) : [];
      attempts.unshift(attempt);
      localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts.slice(0, 50)));
    } catch {
      // Storage unavailable or disabled
    }
  }

  /**
   * Returns attempts for a student.
   */
  static getStudentAttempts(studentId?: string, quizId?: string): QuizAttempt[] {
    try {
      const existingRaw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
      if (!existingRaw) return [];
      let attempts: QuizAttempt[] = JSON.parse(existingRaw);

      if (studentId) {
        attempts = attempts.filter((a) => a.studentId === studentId);
      }
      if (quizId) {
        attempts = attempts.filter((a) => a.quizId === quizId);
      }
      return attempts;
    } catch {
      return [];
    }
  }
}
