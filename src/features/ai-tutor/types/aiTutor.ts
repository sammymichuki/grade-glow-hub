export type SocraticMode = 'hint' | 'scaffold' | 'counter-example' | 'reflection' | 'deep-dive';

export interface GlowBotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  socraticMode?: SocraticMode;
  hintsUsed?: number;
  conceptTags?: string[];
  safetyFlagged?: boolean;
  quickPrompts?: string[];
  suggestedSteps?: string[];
}

export interface SocraticContext {
  subject: string;
  gradeLevel: number;
  topic: string;
  currentProblem?: string;
  curriculumStandard?: string;
  studentPriorMastery?: number; // 0 to 1
}

export interface SafetyCheckResult {
  isSafe: boolean;
  category: 'clean' | 'profanity' | 'pii_leak' | 'off_topic' | 'non_academic';
  sanitizedContent: string;
  advisory?: string;
}

export interface BktSkillState {
  skillId: string;
  skillName: string;
  subject: string;
  priorMastery: number; // P(L_0)
  probabilityOfLearn: number; // P(T) - transition probability
  probabilityOfGuess: number; // P(G) - guess probability
  probabilityOfSlip: number; // P(S) - slip probability
  currentMastery: number; // P(L_t) - posterior mastery probability
  history: Array<{
    isCorrect: boolean;
    timestamp: number;
    updatedMastery: number;
  }>;
  masteryLevel: 'Novice' | 'Developing' | 'Proficient' | 'Mastered';
  recommendedDifficulty: 'Easy' | 'Medium' | 'Challenge';
}

export type AnnotationCategory = 'thesis' | 'evidence' | 'grammar' | 'vocabulary' | 'structure';

export interface EssayAnnotation {
  id: string;
  startOffset: number;
  endOffset: number;
  highlightedText: string;
  category: AnnotationCategory;
  type: 'strength' | 'suggestion' | 'revision';
  comment: string;
  suggestedReplacement?: string;
}

export interface RubricCriterionScore {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  feedback: string;
}

export interface EssayEvaluationResult {
  id: string;
  essayTitle: string;
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  readabilityGrade: string;
  overallScore: number; // 0-100
  letterGrade: string;
  rubricCriteria: RubricCriterionScore[];
  annotations: EssayAnnotation[];
  strengths: string[];
  growthAreas: string[];
  recommendedMiniLessons: Array<{
    id: string;
    title: string;
    subject: string;
    link: string;
  }>;
  analyzedAt: string;
}
