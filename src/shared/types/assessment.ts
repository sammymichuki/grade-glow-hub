export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  options: QuizOption[];
  points: number;
  explanation?: string;
  hint?: string;
}

export interface Quiz {
  id: string;
  courseId: number;
  lessonId?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimitMinutes?: number;
  passingScorePercent: number;
  allowedAttempts: number;
}

export interface QuestionSubmission {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
}

export interface QuizAttempt {
  attemptId: string;
  quizId: string;
  studentId: string;
  answers: Record<string, QuestionSubmission>;
  startedAt: string;
  completedAt?: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
}
