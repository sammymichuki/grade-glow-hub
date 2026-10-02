import {
  AssessmentCategory,
  AssignmentScore,
  CategoryWeight,
  FinalGradeResult,
  GradeScaleEntry,
  LetterGrade,
  StudentReportCard,
} from '@/shared/types/grading';

export const DEFAULT_GRADE_SCALE: GradeScaleEntry[] = [
  { letter: 'A+', minScore: 97, maxScore: 100, gpaPoint: 4.0 },
  { letter: 'A', minScore: 93, maxScore: 96.99, gpaPoint: 4.0 },
  { letter: 'A-', minScore: 90, maxScore: 92.99, gpaPoint: 3.7 },
  { letter: 'B+', minScore: 87, maxScore: 89.99, gpaPoint: 3.3 },
  { letter: 'B', minScore: 83, maxScore: 86.99, gpaPoint: 3.0 },
  { letter: 'B-', minScore: 80, maxScore: 82.99, gpaPoint: 2.7 },
  { letter: 'C+', minScore: 77, maxScore: 79.99, gpaPoint: 2.3 },
  { letter: 'C', minScore: 73, maxScore: 76.99, gpaPoint: 2.0 },
  { letter: 'C-', minScore: 70, maxScore: 72.99, gpaPoint: 1.7 },
  { letter: 'D', minScore: 60, maxScore: 69.99, gpaPoint: 1.0 },
  { letter: 'F', minScore: 0, maxScore: 59.99, gpaPoint: 0.0 },
];

export class GradingEngine {
  /**
   * Maps a numeric grade (0-100) to a Letter Grade and GPA point value.
   */
  static determineLetterGrade(
    numericScore: number,
    scale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE
  ): { letter: LetterGrade; gpaPoint: number } {
    const clampedScore = Math.max(0, Math.min(100, numericScore));
    const matched = scale.find(
      (entry) => clampedScore >= entry.minScore && clampedScore <= entry.maxScore
    );

    if (matched) {
      return { letter: matched.letter, gpaPoint: matched.gpaPoint };
    }

    return { letter: 'F', gpaPoint: 0.0 };
  }

  /**
   * Computes points for a specific category, optionally dropping the lowest N scores.
   */
  static calculateCategoryScore(
    scores: AssignmentScore[],
    dropLowest: number = 0
  ): { earned: number; possible: number; percentage: number } {
    if (scores.length === 0) {
      return { earned: 0, possible: 0, percentage: 100 };
    }

    // Process late penalties
    let processed = scores.map((s) => {
      let earned = s.pointsEarned;
      if (s.isLate && s.latePenaltyPercent) {
        const penalty = (s.latePenaltyPercent / 100) * s.pointsEarned;
        earned = Math.max(0, s.pointsEarned - penalty);
      }
      const pct = s.pointsPossible > 0 ? (earned / s.pointsPossible) * 100 : 0;
      return { ...s, effectiveEarned: earned, pct };
    });

    // Drop lowest scores if requested and if remaining scores > 0
    if (dropLowest > 0 && processed.length > dropLowest) {
      processed.sort((a, b) => a.pct - b.pct);
      processed = processed.slice(dropLowest);
    }

    const totalEarned = processed.reduce((acc, curr) => acc + curr.effectiveEarned, 0);
    const totalPossible = processed.reduce((acc, curr) => acc + curr.pointsPossible, 0);
    const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 100;

    return {
      earned: Math.round(totalEarned * 100) / 100,
      possible: Math.round(totalPossible * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  /**
   * Computes the final weighted numeric grade given category scores and their respective weights.
   */
  static calculateWeightedFinalGrade(
    assignments: AssignmentScore[],
    weights: CategoryWeight[],
    studentId: string = 'student-1',
    courseId: number = 1
  ): FinalGradeResult {
    let totalWeightedScore = 0;
    let totalWeightUsed = 0;

    const categoryScores: Record<
      AssessmentCategory,
      { earned: number; possible: number; percentage: number; weightedContribution: number }
    > = {
      homework: { earned: 0, possible: 0, percentage: 0, weightedContribution: 0 },
      quiz: { earned: 0, possible: 0, percentage: 0, weightedContribution: 0 },
      midterm: { earned: 0, possible: 0, percentage: 0, weightedContribution: 0 },
      final_exam: { earned: 0, possible: 0, percentage: 0, weightedContribution: 0 },
      participation: { earned: 0, possible: 0, percentage: 0, weightedContribution: 0 },
    };

    weights.forEach((w) => {
      const categoryAssignments = assignments.filter((a) => a.category === w.category);
      if (categoryAssignments.length > 0) {
        const catScore = this.calculateCategoryScore(categoryAssignments, w.dropLowest || 0);
        const contribution = (catScore.percentage * w.weightPercentage) / 100;

        categoryScores[w.category] = {
          ...catScore,
          weightedContribution: Math.round(contribution * 100) / 100,
        };

        totalWeightedScore += contribution;
        totalWeightUsed += w.weightPercentage;
      }
    });

    // Normalize if weights don't sum to 100%
    const normalizedNumeric =
      totalWeightUsed > 0 ? (totalWeightedScore / totalWeightUsed) * 100 : 0;
    const finalNumeric = Math.round(normalizedNumeric * 100) / 100;
    const { letter, gpaPoint } = this.determineLetterGrade(finalNumeric);

    return {
      studentId,
      courseId,
      numericGrade: finalNumeric,
      letterGrade: letter,
      gpaPoint,
      categoryScores,
      passed: finalNumeric >= 60,
    };
  }

  /**
   * Applies grade curving algorithms.
   */
  static applyGradeCurve(
    rawScores: number[],
    method: 'flat_bonus' | 'linear_scale' | 'square_root',
    bonusPoints: number = 0
  ): number[] {
    if (rawScores.length === 0) return [];

    switch (method) {
      case 'flat_bonus':
        return rawScores.map((s) => Math.min(100, Math.max(0, s + bonusPoints)));

      case 'linear_scale': {
        const maxScore = Math.max(...rawScores);
        if (maxScore === 0 || maxScore >= 100) return rawScores;
        const multiplier = 100 / maxScore;
        return rawScores.map((s) => Math.min(100, Math.round(s * multiplier * 100) / 100));
      }

      case 'square_root':
        // Standard academic square-root curve: 10 * sqrt(score)
        return rawScores.map((s) => {
          const curved = 10 * Math.sqrt(Math.max(0, s));
          return Math.min(100, Math.round(curved * 100) / 100);
        });

      default:
        return rawScores;
    }
  }

  /**
   * Calculates cumulative GPA from an array of course results.
   */
  static calculateCumulativeGpa(courseGrades: FinalGradeResult[]): number {
    if (courseGrades.length === 0) return 0.0;
    const totalGpa = courseGrades.reduce((sum, g) => sum + g.gpaPoint, 0);
    return Math.round((totalGpa / courseGrades.length) * 100) / 100;
  }

  /**
   * Generates a complete academic report card.
   */
  static generateReportCard(
    studentId: string,
    studentName: string,
    courseGrades: FinalGradeResult[],
    academicYear: string = '2026',
    term: string = 'Term 1'
  ): StudentReportCard {
    const cumulativeGpa = this.calculateCumulativeGpa(courseGrades);
    return {
      studentId,
      studentName,
      academicYear,
      term,
      courseGrades,
      cumulativeGpa,
      totalCredits: courseGrades.length * 3, // standard 3 credits per course
      generatedAt: new Date().toISOString(),
    };
  }
}
