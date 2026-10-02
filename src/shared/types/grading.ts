export type LetterGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface GradeScaleEntry {
  letter: LetterGrade;
  minScore: number;
  maxScore: number;
  gpaPoint: number;
}

export type AssessmentCategory = 'homework' | 'quiz' | 'midterm' | 'final_exam' | 'participation';

export interface CategoryWeight {
  category: AssessmentCategory;
  weightPercentage: number; // e.g. 20 for 20%
  dropLowest?: number; // number of lowest scores to drop in this category
}

export interface AssignmentScore {
  id: string;
  title: string;
  category: AssessmentCategory;
  pointsEarned: number;
  pointsPossible: number;
  submittedAt?: string;
  isLate?: boolean;
  latePenaltyPercent?: number;
}

export interface FinalGradeResult {
  studentId: string;
  courseId: number;
  numericGrade: number; // 0 - 100
  letterGrade: LetterGrade;
  gpaPoint: number;
  categoryScores: Record<AssessmentCategory, {
    earned: number;
    possible: number;
    percentage: number;
    weightedContribution: number;
  }>;
  curvedScore?: number;
  passed: boolean;
}

export interface StudentReportCard {
  studentId: string;
  studentName: string;
  academicYear: string;
  term: string;
  courseGrades: FinalGradeResult[];
  cumulativeGpa: number;
  totalCredits: number;
  generatedAt: string;
}
