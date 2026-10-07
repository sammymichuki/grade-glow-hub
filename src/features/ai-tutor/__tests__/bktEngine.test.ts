import { describe, it, expect } from 'vitest';
import { BktEngine, DEFAULT_BKT_PARAMETERS } from '../services/bktEngine';

describe('Bayesian Knowledge Tracing (BKT) Engine', () => {
  it('initializes a skill state with default parameters', () => {
    const skill = BktEngine.createSkill('skill-1', 'Linear Equations', 'Mathematics');
    expect(skill.skillId).toBe('skill-1');
    expect(skill.priorMastery).toBe(DEFAULT_BKT_PARAMETERS.priorMastery);
    expect(skill.currentMastery).toBe(DEFAULT_BKT_PARAMETERS.priorMastery);
    expect(skill.masteryLevel).toBe('Novice');
    expect(skill.recommendedDifficulty).toBe('Easy');
    expect(skill.history).toHaveLength(0);
  });

  it('initializes a skill state with custom BKT parameters', () => {
    const skill = BktEngine.createSkill('skill-custom', 'Cell Division', 'Biology', {
      priorMastery: 0.65,
      probabilityOfLearn: 0.20,
    });
    expect(skill.currentMastery).toBe(0.65);
    expect(skill.masteryLevel).toBe('Developing');
    expect(skill.recommendedDifficulty).toBe('Medium');
  });

  it('increases mastery probability when student answers correctly', () => {
    const initialSkill = BktEngine.createSkill('skill-frac', 'Adding Fractions', 'Mathematics', {
      priorMastery: 0.30,
    });

    const updated = BktEngine.updateMastery(initialSkill, true);

    expect(updated.currentMastery).toBeGreaterThan(initialSkill.currentMastery);
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0].isCorrect).toBe(true);
    expect(updated.history[0].updatedMastery).toBe(updated.currentMastery);
  });

  it('decreases or adjusts mastery when student answers incorrectly', () => {
    const initialSkill = BktEngine.createSkill('skill-frac', 'Adding Fractions', 'Mathematics', {
      priorMastery: 0.70,
    });

    const updated = BktEngine.updateMastery(initialSkill, false);

    expect(updated.currentMastery).toBeLessThan(initialSkill.currentMastery);
    expect(updated.history).toHaveLength(1);
    expect(updated.history[0].isCorrect).toBe(false);
  });

  it('progresses to Mastered status after consecutive correct responses', () => {
    let skill = BktEngine.createSkill('skill-geo', 'Pythagoras Theorem', 'Mathematics', {
      priorMastery: 0.50,
      probabilityOfLearn: 0.25,
    });

    for (let i = 0; i < 5; i++) {
      skill = BktEngine.updateMastery(skill, true);
    }

    expect(skill.currentMastery).toBeGreaterThanOrEqual(0.90);
    expect(skill.masteryLevel).toBe('Mastered');
    expect(skill.recommendedDifficulty).toBe('Challenge');
  });

  it('correctly classifies mastery tiers and difficulties', () => {
    expect(BktEngine.classifyLevel(0.20)).toBe('Novice');
    expect(BktEngine.classifyLevel(0.55)).toBe('Developing');
    expect(BktEngine.classifyLevel(0.75)).toBe('Proficient');
    expect(BktEngine.classifyLevel(0.95)).toBe('Mastered');

    expect(BktEngine.getDifficulty(0.30)).toBe('Easy');
    expect(BktEngine.getDifficulty(0.60)).toBe('Medium');
    expect(BktEngine.getDifficulty(0.88)).toBe('Challenge');
  });

  it('performs batch evaluation across multiple quiz question outcomes', () => {
    const skills = [
      BktEngine.createSkill('s1', 'Skill 1', 'Math', { priorMastery: 0.30 }),
      BktEngine.createSkill('s2', 'Skill 2', 'Math', { priorMastery: 0.40 }),
    ];

    const results = [
      { skillId: 's1', isCorrect: true },
      { skillId: 's1', isCorrect: true },
      { skillId: 's2', isCorrect: false },
    ];

    const evaluated = BktEngine.batchEvaluate(skills, results);

    expect(evaluated[0].currentMastery).toBeGreaterThan(0.30);
    expect(evaluated[0].history).toHaveLength(2);
    expect(evaluated[1].currentMastery).toBeLessThan(0.40);
    expect(evaluated[1].history).toHaveLength(1);
  });

  it('computes overall curriculum index statistics', () => {
    const skills = [
      BktEngine.createSkill('s1', 'Skill 1', 'Math', { priorMastery: 0.95 }),
      BktEngine.createSkill('s2', 'Skill 2', 'Math', { priorMastery: 0.75 }),
      BktEngine.createSkill('s3', 'Skill 3', 'Math', { priorMastery: 0.50 }),
      BktEngine.createSkill('s4', 'Skill 4', 'Math', { priorMastery: 0.20 }),
    ];

    const stats = BktEngine.calculateCurriculumIndex(skills);

    expect(stats.averageMastery).toBe(0.6);
    expect(stats.masteredCount).toBe(1);
    expect(stats.proficientCount).toBe(1);
    expect(stats.developingCount).toBe(1);
    expect(stats.noviceCount).toBe(1);
  });
});
