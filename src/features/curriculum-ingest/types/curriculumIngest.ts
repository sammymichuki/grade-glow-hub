export type CurriculumStandard = 'KICD_CBC' | 'CAMBRIDGE_LOWER_SEC' | 'US_COMMON_CORE';

export type BloomTaxonomyLevel =
  | 'knowledge'
  | 'comprehension'
  | 'application'
  | 'analysis'
  | 'synthesis'
  | 'evaluation';

export interface GeneratedQuestion {
  id: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'short-answer' | 'true-false';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  bloomLevel: BloomTaxonomyLevel;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  syllabusRef: string;
}

export interface IngestionJob {
  id: string;
  title: string;
  subject: string;
  grade: number;
  standard: CurriculumStandard;
  sourceText: string;
  questionCount: number;
  bloomDistribution: Record<BloomTaxonomyLevel, number>;
  generatedQuestions: GeneratedQuestion[];
  createdAt: string;
  status: 'ready' | 'processing' | 'completed' | 'failed';
}
