import { describe, it, expect } from 'vitest';
import { RubricService } from '../services/rubricService';
import { AssignmentSubmission, RubricScoreItem } from '@/shared/types/instructor';

describe('RubricService', () => {
  const defaultRubric = RubricService.createDefaultRubric(
    'Assignment Scoring Rubric',
    'Standard rubric'
  );

  it('generates a 3-criteria default rubric with calculated max points', () => {
    expect(defaultRubric.title).toBe('Assignment Scoring Rubric');
    expect(defaultRubric.criteria.length).toBe(3);
    expect(defaultRubric.criteria.map((c) => c.name)).toEqual([
      'Content & Accuracy',
      'Clarity & Method',
      'Formatting & Citations',
    ]);
    expect(defaultRubric.maxPoints).toBe(12); // 4 + 4 + 4
  });

  it('calculates 100% score and "A" letter grade when top levels are selected', () => {
    const perfectSelections: Record<string, RubricScoreItem> = {
      'crit-content': { levelId: 'lvl-c-4', pointsEarned: 4 },
      'crit-clarity': { levelId: 'lvl-l-4', pointsEarned: 4 },
      'crit-formatting': { levelId: 'lvl-f-4', pointsEarned: 4 },
    };

    const result = RubricService.calculateRubricScore(defaultRubric, perfectSelections);
    expect(result.totalPoints).toBe(12);
    expect(result.maxPoints).toBe(12);
    expect(result.percentage).toBe(100);
    expect(result.letterGrade).toBe('A');
  });

  it('calculates weighted score accurately with mixed criteria levels', () => {
    // Content (50%): 3/4 = 75% -> 37.5%
    // Clarity (30%): 4/4 = 100% -> 30.0%
    // Formatting (20%): 2/4 = 50% -> 10.0%
    // Total = 37.5 + 30.0 + 10.0 = 77.5% -> C+
    const mixedSelections: Record<string, RubricScoreItem> = {
      'crit-content': { levelId: 'lvl-c-3', pointsEarned: 3 },
      'crit-clarity': { levelId: 'lvl-l-4', pointsEarned: 4 },
      'crit-formatting': { levelId: 'lvl-f-2', pointsEarned: 2 },
    };

    const result = RubricService.calculateRubricScore(defaultRubric, mixedSelections);
    expect(result.percentage).toBe(77.5);
    expect(result.letterGrade).toBe('C+');
    expect(result.totalPoints).toBe(9);
  });

  it('correctly maps percentage scores to standard letter grades', () => {
    expect(RubricService.percentageToLetter(95)).toBe('A');
    expect(RubricService.percentageToLetter(91)).toBe('A-');
    expect(RubricService.percentageToLetter(88)).toBe('B+');
    expect(RubricService.percentageToLetter(84)).toBe('B');
    expect(RubricService.percentageToLetter(81)).toBe('B-');
    expect(RubricService.percentageToLetter(78)).toBe('C+');
    expect(RubricService.percentageToLetter(74)).toBe('C');
    expect(RubricService.percentageToLetter(71)).toBe('C-');
    expect(RubricService.percentageToLetter(65)).toBe('D');
    expect(RubricService.percentageToLetter(50)).toBe('F');
  });

  it('evaluates student submission and returns graded state with feedback', () => {
    const rawSubmission: AssignmentSubmission = {
      id: 'sub-test-1',
      assignmentId: 'assign-1',
      assignmentTitle: 'Math Problem Set',
      courseId: 101,
      studentId: 'STU-99',
      studentName: 'Alex Smith',
      studentEmail: 'alex@example.com',
      submittedAt: '2026-10-01T10:00:00Z',
      status: 'pending',
      textSubmission: 'Solution: 2x = 10 -> x = 5',
    };

    const selections: Record<string, RubricScoreItem> = {
      'crit-content': { levelId: 'lvl-c-4', pointsEarned: 4 },
      'crit-clarity': { levelId: 'lvl-l-4', pointsEarned: 4 },
      'crit-formatting': { levelId: 'lvl-f-4', pointsEarned: 4 },
    };

    const graded = RubricService.evaluateSubmission(
      rawSubmission,
      defaultRubric,
      selections,
      'Great work Alex!'
    );

    expect(graded.status).toBe('graded');
    expect(graded.grade).toBe(100);
    expect(graded.teacherFeedback).toBe('Great work Alex!');
    expect(graded.rubricScores).toEqual(selections);
  });

  it('adds margin annotation to student submission with author tag', () => {
    const rawSubmission: AssignmentSubmission = {
      id: 'sub-test-2',
      assignmentId: 'assign-1',
      assignmentTitle: 'Essay',
      courseId: 101,
      studentId: 'STU-99',
      studentName: 'Alex Smith',
      studentEmail: 'alex@example.com',
      submittedAt: '2026-10-01T10:00:00Z',
      status: 'pending',
      textSubmission: 'Paragraph 1...',
      annotations: [],
    };

    const annotated = RubricService.addAnnotation(
      rawSubmission,
      'Line 12',
      'Strong thesis statement',
      'Teacher Sarah'
    );

    expect(annotated.annotations?.length).toBe(1);
    expect(annotated.annotations?.[0].lineOrTimestamp).toBe('Line 12');
    expect(annotated.annotations?.[0].comment).toBe('Strong thesis statement');
    expect(annotated.annotations?.[0].authorName).toBe('Teacher Sarah');
  });

  it('provides rich preset rubrics with valid criteria structures', () => {
    const presets = RubricService.getPresetRubrics();
    expect(presets.length).toBeGreaterThanOrEqual(2);

    presets.forEach((p) => {
      expect(p.criteria.length).toBeGreaterThan(0);
      expect(p.maxPoints).toBeGreaterThan(0);
      const totalWeight = p.criteria.reduce((sum, c) => sum + c.weightPercentage, 0);
      expect(totalWeight).toBe(100);
    });
  });
});
