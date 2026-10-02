import {
  QuestionSubmission,
  Quiz,
  QuizAttempt,
  QuizQuestion,
} from '@/shared/types/assessment';

export interface QuestionEvaluation {
  questionId: string;
  pointsEarned: number;
  pointsPossible: number;
  isCorrect: boolean;
  feedback?: string;
}

export class QuizEvaluator {
  /**
   * Evaluates a single question against student submissions.
   */
  static evaluateQuestion(
    question: QuizQuestion,
    submission?: QuestionSubmission
  ): QuestionEvaluation {
    if (!submission || (!submission.selectedOptionIds?.length && !submission.textAnswer)) {
      return {
        questionId: question.id,
        pointsEarned: 0,
        pointsPossible: question.points,
        isCorrect: false,
        feedback: 'No answer submitted.',
      };
    }

    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    if (question.type === 'single_choice' || question.type === 'true_false') {
      const selectedId = submission.selectedOptionIds[0];
      const isCorrect = correctOptionIds.includes(selectedId);
      const explanationText = question.explanation ? ` ${question.explanation}` : '';
      return {
        questionId: question.id,
        pointsEarned: isCorrect ? question.points : 0,
        pointsPossible: question.points,
        isCorrect,
        feedback: isCorrect ? `Correct!${explanationText}` : question.explanation || 'Incorrect answer.',
      };
    }

    if (question.type === 'multiple_choice') {
      // Must select all correct options and no incorrect options
      const selectedSet = new Set(submission.selectedOptionIds);
      const allCorrectSelected = correctOptionIds.every((id) => selectedSet.has(id));
      const noExtraSelected = submission.selectedOptionIds.every((id) =>
        correctOptionIds.includes(id)
      );

      const isCorrect = allCorrectSelected && noExtraSelected;

      // Partial credit calculation
      let correctSelectedCount = 0;
      let incorrectSelectedCount = 0;

      submission.selectedOptionIds.forEach((id) => {
        if (correctOptionIds.includes(id)) {
          correctSelectedCount++;
        } else {
          incorrectSelectedCount++;
        }
      });

      const rawRatio =
        correctOptionIds.length > 0
          ? (correctSelectedCount - incorrectSelectedCount) / correctOptionIds.length
          : 0;
      const pointsEarned = Math.max(0, Math.round(rawRatio * question.points * 100) / 100);
      const explanationText = question.explanation ? ` ${question.explanation}` : '';

      return {
        questionId: question.id,
        pointsEarned,
        pointsPossible: question.points,
        isCorrect,
        feedback: isCorrect ? `Completely correct!${explanationText}` : question.explanation || 'Review selected options.',
      };
    }

    if (question.type === 'short_answer') {
      const cleanAnswer = (submission.textAnswer || '').trim().toLowerCase();
      const acceptableAnswers = question.options.map((opt) => opt.text.trim().toLowerCase());
      const isCorrect = acceptableAnswers.includes(cleanAnswer);
      const explanationText = question.explanation ? ` ${question.explanation}` : '';

      return {
        questionId: question.id,
        pointsEarned: isCorrect ? question.points : 0,
        pointsPossible: question.points,
        isCorrect,
        feedback: isCorrect ? `Correct!${explanationText}` : question.explanation || 'Answer did not match expected value.',
      };
    }

    return {
      questionId: question.id,
      pointsEarned: 0,
      pointsPossible: question.points,
      isCorrect: false,
    };
  }

  /**
   * Evaluates an entire quiz attempt and computes score and passing state.
   */
  static evaluateAttempt(
    quiz: Quiz,
    studentId: string,
    answers: Record<string, QuestionSubmission>,
    startedAt: string = new Date().toISOString()
  ): { attempt: QuizAttempt; questionEvaluations: QuestionEvaluation[] } {
    const questionEvaluations = quiz.questions.map((q) =>
      this.evaluateQuestion(q, answers[q.id])
    );

    const score = questionEvaluations.reduce((sum, qe) => sum + qe.pointsEarned, 0);
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;
    const passed = percentage >= quiz.passingScorePercent;

    const attempt: QuizAttempt = {
      attemptId: `att-${Date.now()}`,
      quizId: quiz.id,
      studentId,
      answers,
      startedAt,
      completedAt: new Date().toISOString(),
      score,
      maxScore,
      percentage,
      passed,
    };

    return { attempt, questionEvaluations };
  }
}
