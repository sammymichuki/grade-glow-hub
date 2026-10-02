import { describe, it, expect } from 'vitest';
import { QuizEvaluator } from '../lib/quizEvaluator';
import { Quiz, QuizQuestion } from '@/shared/types/assessment';

describe('QuizEvaluator', () => {
  const singleChoiceQ: QuizQuestion = {
    id: 'q1',
    prompt: 'What is 5 + 7?',
    type: 'single_choice',
    points: 10,
    options: [
      { id: 'opt1', text: '10', isCorrect: false },
      { id: 'opt2', text: '12', isCorrect: true },
      { id: 'opt3', text: '14', isCorrect: false },
    ],
  };

  const multiChoiceQ: QuizQuestion = {
    id: 'q2',
    prompt: 'Which of the following are prime numbers?',
    type: 'multiple_choice',
    points: 20,
    options: [
      { id: 'optA', text: '2', isCorrect: true },
      { id: 'optB', text: '3', isCorrect: true },
      { id: 'optC', text: '4', isCorrect: false },
    ],
  };

  const sampleQuiz: Quiz = {
    id: 'quiz-1',
    courseId: 1,
    title: 'Math Checkpoint',
    description: 'Basic arithmetic & primes',
    questions: [singleChoiceQ, multiChoiceQ],
    passingScorePercent: 70,
    allowedAttempts: 3,
  };

  describe('evaluateQuestion', () => {
    it('awards full points for correct single choice answer', () => {
      const evaluation = QuizEvaluator.evaluateQuestion(singleChoiceQ, {
        questionId: 'q1',
        selectedOptionIds: ['opt2'],
      });
      expect(evaluation.isCorrect).toBe(true);
      expect(evaluation.pointsEarned).toBe(10);
    });

    it('awards 0 points for incorrect single choice answer', () => {
      const evaluation = QuizEvaluator.evaluateQuestion(singleChoiceQ, {
        questionId: 'q1',
        selectedOptionIds: ['opt1'],
      });
      expect(evaluation.isCorrect).toBe(false);
      expect(evaluation.pointsEarned).toBe(0);
    });

    it('awards full points for multiple choice when all correct options are selected', () => {
      const evaluation = QuizEvaluator.evaluateQuestion(multiChoiceQ, {
        questionId: 'q2',
        selectedOptionIds: ['optA', 'optB'],
      });
      expect(evaluation.isCorrect).toBe(true);
      expect(evaluation.pointsEarned).toBe(20);
    });

    it('handles partial credit for multiple choice', () => {
      const evaluation = QuizEvaluator.evaluateQuestion(multiChoiceQ, {
        questionId: 'q2',
        selectedOptionIds: ['optA'], // 1 out of 2 correct
      });
      expect(evaluation.isCorrect).toBe(false);
      expect(evaluation.pointsEarned).toBe(10); // 50% of 20 points
    });
  });

  describe('evaluateAttempt', () => {
    it('evaluates entire quiz and marks passed when score >= passing threshold', () => {
      const answers = {
        q1: { questionId: 'q1', selectedOptionIds: ['opt2'] }, // 10 / 10
        q2: { questionId: 'q2', selectedOptionIds: ['optA', 'optB'] }, // 20 / 20
      };

      const result = QuizEvaluator.evaluateAttempt(sampleQuiz, 'student-1', answers);
      expect(result.attempt.score).toBe(30);
      expect(result.attempt.maxScore).toBe(30);
      expect(result.attempt.percentage).toBe(100);
      expect(result.attempt.passed).toBe(true);
    });

    it('marks attempt as failed when score is below passing threshold', () => {
      const answers = {
        q1: { questionId: 'q1', selectedOptionIds: ['opt1'] }, // 0 / 10
        q2: { questionId: 'q2', selectedOptionIds: ['optA', 'optB'] }, // 20 / 20
      };

      // Total: 20 / 30 = 66.67% < 70% threshold
      const result = QuizEvaluator.evaluateAttempt(sampleQuiz, 'student-1', answers);
      expect(result.attempt.score).toBe(20);
      expect(result.attempt.passed).toBe(false);
    });
  });
});
