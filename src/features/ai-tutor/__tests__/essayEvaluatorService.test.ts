import { describe, it, expect } from 'vitest';
import {
  EssayEvaluatorService,
  SAMPLE_STUDENT_ESSAYS,
} from '../services/essayEvaluatorService';

describe('EssayEvaluatorService', () => {
  it('correctly evaluates a high-quality science essay draft', () => {
    const sample = SAMPLE_STUDENT_ESSAYS[0];
    const evaluation = EssayEvaluatorService.evaluateEssay(sample.title, sample.text);

    expect(evaluation.essayTitle).toBe(sample.title);
    expect(evaluation.wordCount).toBeGreaterThan(50);
    expect(evaluation.sentenceCount).toBeGreaterThan(2);
    expect(evaluation.overallScore).toBeGreaterThanOrEqual(80);
    expect(evaluation.letterGrade).toMatch(/A|B\+/);

    expect(evaluation.rubricCriteria).toHaveLength(4);
    expect(evaluation.annotations.length).toBeGreaterThan(0);
    expect(evaluation.strengths.length).toBeGreaterThan(0);
    expect(evaluation.recommendedMiniLessons.length).toBeGreaterThan(0);
  });

  it('detects missing or weak thesis statements and provides remediation', () => {
    const weakText = 'Hello. Today I am going to talk about trees. Trees are nice. Goodbye.';
    const evaluation = EssayEvaluatorService.evaluateEssay('Trees', weakText);

    expect(evaluation.growthAreas.some(g => g.toLowerCase().includes('thesis'))).toBe(true);
    const thesisCriterion = evaluation.rubricCriteria.find(c => c.name === 'Thesis & Purpose');
    expect(thesisCriterion?.score).toBeLessThan(20);
  });

  it('identifies transition markers like furthermore and therefore', () => {
    const textWithTransitions = `Furthermore, solar panels generate electricity without pollution. Therefore, cities should invest in solar power.`;
    const evaluation = EssayEvaluatorService.evaluateEssay('Solar Energy', textWithTransitions);

    const transitionAnnotations = evaluation.annotations.filter(a => a.category === 'structure');
    expect(transitionAnnotations.length).toBeGreaterThanOrEqual(2);
  });

  it('flags grammar issues such as possessive vs contraction confusion', () => {
    const textWithGrammarError = `Some people think its a bad idea to walk outside at night.`;
    const evaluation = EssayEvaluatorService.evaluateEssay('Night Walks', textWithGrammarError);

    const grammarAnn = evaluation.annotations.find(a => a.id === 'ann-gram-its');
    expect(grammarAnn).toBeDefined();
    expect(grammarAnn?.suggestedReplacement).toBe("it's a");
  });

  it('accurately estimates syllable counts using heuristic', () => {
    expect(EssayEvaluatorService.countSyllables('cat')).toBe(1);
    expect(EssayEvaluatorService.countSyllables('water')).toBe(2);
    expect(EssayEvaluatorService.countSyllables('photosynthesis')).toBeGreaterThanOrEqual(4);
  });
});
