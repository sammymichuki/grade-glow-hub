import { describe, it, expect } from 'vitest';
import { GradingEngine } from '../lib/gradingEngine';
import { AssignmentScore, CategoryWeight } from '@/shared/types/grading';

describe('GradingEngine', () => {
  describe('determineLetterGrade', () => {
    it('correctly maps 98% to A+ and 4.0 GPA', () => {
      const result = GradingEngine.determineLetterGrade(98);
      expect(result.letter).toBe('A+');
      expect(result.gpaPoint).toBe(4.0);
    });

    it('correctly maps 85% to B and 3.0 GPA', () => {
      const result = GradingEngine.determineLetterGrade(85);
      expect(result.letter).toBe('B');
      expect(result.gpaPoint).toBe(3.0);
    });

    it('correctly maps scores below 60% to F and 0.0 GPA', () => {
      const result = GradingEngine.determineLetterGrade(52);
      expect(result.letter).toBe('F');
      expect(result.gpaPoint).toBe(0.0);
    });

    it('clamps negative scores to F and scores >100 to A+', () => {
      expect(GradingEngine.determineLetterGrade(-10).letter).toBe('F');
      expect(GradingEngine.determineLetterGrade(120).letter).toBe('A+');
    });
  });

  describe('calculateCategoryScore', () => {
    it('calculates average score across normal assignments', () => {
      const scores: AssignmentScore[] = [
        { id: '1', title: 'HW 1', category: 'homework', pointsEarned: 90, pointsPossible: 100 },
        { id: '2', title: 'HW 2', category: 'homework', pointsEarned: 80, pointsPossible: 100 },
      ];
      const result = GradingEngine.calculateCategoryScore(scores);
      expect(result.percentage).toBe(85);
      expect(result.earned).toBe(170);
      expect(result.possible).toBe(200);
    });

    it('drops the lowest score when requested', () => {
      const scores: AssignmentScore[] = [
        { id: '1', title: 'Quiz 1', category: 'quiz', pointsEarned: 50, pointsPossible: 100 },
        { id: '2', title: 'Quiz 2', category: 'quiz', pointsEarned: 90, pointsPossible: 100 },
        { id: '3', title: 'Quiz 3', category: 'quiz', pointsEarned: 100, pointsPossible: 100 },
      ];
      // Dropping lowest score (Quiz 1 at 50%) leaves Quiz 2 & 3: (190 / 200) * 100 = 95%
      const result = GradingEngine.calculateCategoryScore(scores, 1);
      expect(result.percentage).toBe(95);
      expect(result.earned).toBe(190);
    });

    it('applies late penalties correctly', () => {
      const scores: AssignmentScore[] = [
        {
          id: '1',
          title: 'Late Project',
          category: 'homework',
          pointsEarned: 100,
          pointsPossible: 100,
          isLate: true,
          latePenaltyPercent: 15,
        },
      ];
      const result = GradingEngine.calculateCategoryScore(scores);
      expect(result.earned).toBe(85);
      expect(result.percentage).toBe(85);
    });
  });

  describe('calculateWeightedFinalGrade', () => {
    it('computes weighted total according to syllabus percentage breakdown', () => {
      const assignments: AssignmentScore[] = [
        { id: '1', title: 'HW', category: 'homework', pointsEarned: 100, pointsPossible: 100 },
        { id: '2', title: 'Midterm', category: 'midterm', pointsEarned: 80, pointsPossible: 100 },
        { id: '3', title: 'Final', category: 'final_exam', pointsEarned: 90, pointsPossible: 100 },
      ];

      const weights: CategoryWeight[] = [
        { category: 'homework', weightPercentage: 20 },
        { category: 'midterm', weightPercentage: 30 },
        { category: 'final_exam', weightPercentage: 50 },
      ];

      // Expected: (100 * 0.20) + (80 * 0.30) + (90 * 0.50) = 20 + 24 + 45 = 89 (B+)
      const result = GradingEngine.calculateWeightedFinalGrade(assignments, weights);
      expect(result.numericGrade).toBe(89);
      expect(result.letterGrade).toBe('B+');
      expect(result.passed).toBe(true);
    });
  });

  describe('applyGradeCurve', () => {
    it('applies flat bonus with 100 ceiling', () => {
      const curved = GradingEngine.applyGradeCurve([70, 85, 96], 'flat_bonus', 10);
      expect(curved).toEqual([80, 95, 100]);
    });

    it('applies linear scaling up to the highest score', () => {
      const curved = GradingEngine.applyGradeCurve([40, 60, 80], 'linear_scale');
      // 80 scaled to 100 (multiplier 1.25): 40 * 1.25 = 50, 60 * 1.25 = 75, 80 * 1.25 = 100
      expect(curved).toEqual([50, 75, 100]);
    });

    it('applies square root curving formula', () => {
      // 10 * sqrt(64) = 80
      const curved = GradingEngine.applyGradeCurve([64], 'square_root');
      expect(curved).toEqual([80]);
    });
  });

  describe('generateReportCard', () => {
    it('compiles multi-course results and calculates accurate cumulative GPA', () => {
      const course1 = GradingEngine.calculateWeightedFinalGrade(
        [{ id: '1', title: 'Exam', category: 'final_exam', pointsEarned: 95, pointsPossible: 100 }],
        [{ category: 'final_exam', weightPercentage: 100 }],
        'student-1',
        1
      );
      const course2 = GradingEngine.calculateWeightedFinalGrade(
        [{ id: '2', title: 'Exam', category: 'final_exam', pointsEarned: 85, pointsPossible: 100 }],
        [{ category: 'final_exam', weightPercentage: 100 }],
        'student-1',
        2
      );

      const reportCard = GradingEngine.generateReportCard('student-1', 'Alex Johnson', [course1, course2]);
      expect(reportCard.studentName).toBe('Alex Johnson');
      expect(reportCard.courseGrades.length).toBe(2);
      // Course 1 is 4.0, Course 2 is 3.0 -> Cumulative GPA = 3.5
      expect(reportCard.cumulativeGpa).toBe(3.5);
    });
  });
});
