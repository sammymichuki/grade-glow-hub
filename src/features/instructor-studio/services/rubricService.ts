import {
  Rubric,
  RubricCriterion,
  RubricScoreItem,
  AssignmentSubmission,
  SubmissionAnnotation,
} from '@/shared/types/instructor';

export class RubricService {
  /**
   * Generates a 4-level default rubric structure (Content, Clarity, Formatting).
   */
  static createDefaultRubric(title: string, description: string = ''): Rubric {
    const defaultCriteria: RubricCriterion[] = [
      {
        id: 'crit-content',
        name: 'Content & Accuracy',
        description: 'Demonstrates deep understanding of concepts and thorough solutions',
        weightPercentage: 50,
        levels: [
          { id: 'lvl-c-4', title: 'Excellent', description: 'Complete, rigorous, and completely accurate', points: 4 },
          { id: 'lvl-c-3', title: 'Good', description: 'Minor computational or conceptual oversights', points: 3 },
          { id: 'lvl-c-2', title: 'Fair', description: 'Partial understanding with notable gaps', points: 2 },
          { id: 'lvl-c-1', title: 'Poor', description: 'Substantial misunderstandings or incomplete', points: 1 },
        ],
      },
      {
        id: 'crit-clarity',
        name: 'Clarity & Method',
        description: 'Presents clear, logical reasoning and well-organized steps',
        weightPercentage: 30,
        levels: [
          { id: 'lvl-l-4', title: 'Excellent', description: 'Exceptionally clear structure and reasoning', points: 4 },
          { id: 'lvl-l-3', title: 'Good', description: 'Clear workflow with slight gaps in exposition', points: 3 },
          { id: 'lvl-l-2', title: 'Fair', description: 'Disorganized steps or hard to follow', points: 2 },
          { id: 'lvl-l-1', title: 'Poor', description: 'Illogical sequence or illegible working', points: 1 },
        ],
      },
      {
        id: 'crit-formatting',
        name: 'Formatting & Citations',
        description: 'Adheres to presentation guidelines and citation standards',
        weightPercentage: 20,
        levels: [
          { id: 'lvl-f-4', title: 'Excellent', description: 'Impeccable formatting, labels, and conventions', points: 4 },
          { id: 'lvl-f-3', title: 'Good', description: 'Minor style or notation inconsistencies', points: 3 },
          { id: 'lvl-f-2', title: 'Fair', description: 'Noticeable formatting and labeling defects', points: 2 },
          { id: 'lvl-f-1', title: 'Poor', description: 'Disregards formatting instructions entirely', points: 1 },
        ],
      },
    ];

    const maxPoints = defaultCriteria.reduce((sum, crit) => {
      const topLevel = Math.max(...crit.levels.map((l) => l.points));
      return sum + topLevel;
    }, 0);

    return {
      id: `rubric-${Date.now()}`,
      title,
      description,
      criteria: defaultCriteria,
      maxPoints,
    };
  }

  /**
   * Calculates total points and percentage based on selected rubric criteria levels.
   */
  static calculateRubricScore(
    rubric: Rubric,
    selections: Record<string, RubricScoreItem>
  ): { totalPoints: number; maxPoints: number; percentage: number; letterGrade: string } {
    let earnedWeighted = 0;
    let totalMaxWeighted = 0;

    rubric.criteria.forEach((crit) => {
      const maxCritPoints = Math.max(...crit.levels.map((l) => l.points), 1);
      const selected = selections[crit.id];
      const critPoints = selected ? selected.pointsEarned : 0;

      const critWeight = crit.weightPercentage / 100;
      earnedWeighted += (critPoints / maxCritPoints) * critWeight;
      totalMaxWeighted += critWeight;
    });

    const percentage =
      totalMaxWeighted > 0
        ? Math.round((earnedWeighted / totalMaxWeighted) * 10000) / 100
        : 0;

    const letterGrade = this.percentageToLetter(percentage);

    const totalRawPoints = Object.values(selections).reduce(
      (sum, s) => sum + s.pointsEarned,
      0
    );

    return {
      totalPoints: totalRawPoints,
      maxPoints: rubric.maxPoints,
      percentage,
      letterGrade,
    };
  }

  /**
   * Converts percentage to standard letter grade.
   */
  static percentageToLetter(percentage: number): string {
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * Evaluates student submission and attaches rubric scores, letter grade, and instructor notes.
   */
  static evaluateSubmission(
    submission: AssignmentSubmission,
    rubric: Rubric,
    selections: Record<string, RubricScoreItem>,
    teacherFeedback: string = ''
  ): AssignmentSubmission {
    const scoreResult = this.calculateRubricScore(rubric, selections);

    return {
      ...submission,
      status: 'graded',
      grade: scoreResult.percentage,
      rubricScores: selections,
      teacherFeedback,
    };
  }

  /**
   * Appends an inline margin or timestamp annotation to a student submission.
   */
  static addAnnotation(
    submission: AssignmentSubmission,
    lineOrTimestamp: string,
    comment: string,
    authorName: string = 'Instructor'
  ): AssignmentSubmission {
    const newAnnotation: SubmissionAnnotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      lineOrTimestamp,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      authorName,
    };

    return {
      ...submission,
      annotations: [...(submission.annotations || []), newAnnotation],
    };
  }

  /**
   * Pre-packaged rubrics for common educational disciplines.
   */
  static getPresetRubrics(): Rubric[] {
    return [
      this.createDefaultRubric(
        'Standard Academic Assignment Rubric',
        'Balanced grading matrix for homework, problem sets, and lab exercises.'
      ),
      {
        id: 'rubric-essay-stem',
        title: 'STEM Project & Inquiry Rubric',
        description: 'Comprehensive rubric assessing hypothesis, experimental design, and conclusions.',
        maxPoints: 16,
        criteria: [
          {
            id: 'stem-hyp',
            name: 'Hypothesis & Question',
            description: 'Clear, testable scientific inquiry statement',
            weightPercentage: 25,
            levels: [
              { id: 'stem-h-4', title: 'Exceptional', description: 'Flawless hypothesis backed by theory', points: 4 },
              { id: 'stem-h-3', title: 'Proficient', description: 'Testable hypothesis with minor justification gap', points: 3 },
              { id: 'stem-h-2', title: 'Developing', description: 'Vague hypothesis or untestable variables', points: 2 },
              { id: 'stem-h-1', title: 'Novice', description: 'No hypothesis or entirely off-topic', points: 1 },
            ],
          },
          {
            id: 'stem-data',
            name: 'Data Collection & Charts',
            description: 'Accurate measurements, controlled variables, and well-labeled graphs',
            weightPercentage: 35,
            levels: [
              { id: 'stem-d-4', title: 'Exceptional', description: 'Precise quantitative data with error analysis', points: 4 },
              { id: 'stem-d-3', title: 'Proficient', description: 'Adequate sample size with correct labels', points: 3 },
              { id: 'stem-d-2', title: 'Developing', description: 'Missing labels or questionable data consistency', points: 2 },
              { id: 'stem-d-1', title: 'Novice', description: 'Fabricated or severely missing measurements', points: 1 },
            ],
          },
          {
            id: 'stem-conclusion',
            name: 'Conclusions & Next Steps',
            description: 'Synthesis of results and reflection on systematic errors',
            weightPercentage: 40,
            levels: [
              { id: 'stem-c-4', title: 'Exceptional', description: 'Insightful conclusions linking directly to evidence', points: 4 },
              { id: 'stem-c-3', title: 'Proficient', description: 'Sound conclusion referencing findings', points: 3 },
              { id: 'stem-c-2', title: 'Developing', description: 'General claims not well supported by data', points: 2 },
              { id: 'stem-c-1', title: 'Novice', description: 'Contradicts data or omitted completely', points: 1 },
            ],
          },
        ],
      },
    ];
  }
}
