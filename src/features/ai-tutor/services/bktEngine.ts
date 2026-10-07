import { BktSkillState } from '../types/aiTutor';

/**
 * Standard Bayesian Knowledge Tracing (BKT) Defaults
 * Common parameters in K-12 educational data mining literature
 */
export const DEFAULT_BKT_PARAMETERS = {
  priorMastery: 0.25,        // P(L_0)
  probabilityOfLearn: 0.15,  // P(T) - transition probability
  probabilityOfGuess: 0.20,  // P(G) - guess rate
  probabilityOfSlip: 0.10,   // P(S) - slip rate
};

export class BktEngine {
  /**
   * Initializes a skill state with custom or default BKT parameters
   */
  public static createSkill(
    skillId: string,
    skillName: string,
    subject: string,
    customParams?: Partial<Pick<BktSkillState, 'priorMastery' | 'probabilityOfLearn' | 'probabilityOfGuess' | 'probabilityOfSlip'>>
  ): BktSkillState {
    const prior = customParams?.priorMastery ?? DEFAULT_BKT_PARAMETERS.priorMastery;
    const pT = customParams?.probabilityOfLearn ?? DEFAULT_BKT_PARAMETERS.probabilityOfLearn;
    const pG = customParams?.probabilityOfGuess ?? DEFAULT_BKT_PARAMETERS.probabilityOfGuess;
    const pS = customParams?.probabilityOfSlip ?? DEFAULT_BKT_PARAMETERS.probabilityOfSlip;

    return {
      skillId,
      skillName,
      subject,
      priorMastery: prior,
      probabilityOfLearn: pT,
      probabilityOfGuess: pG,
      probabilityOfSlip: pS,
      currentMastery: prior,
      history: [],
      masteryLevel: this.classifyLevel(prior),
      recommendedDifficulty: this.getDifficulty(prior),
    };
  }

  /**
   * Updates mastery probability given a student observation (correct or incorrect)
   * Formula:
   * P(L_t | Obs) = P(Obs | L) * P(L_{t-1}) / P(Obs)
   * P(L_t) = P(L_t | Obs) + (1 - P(L_t | Obs)) * P(T)
   */
  public static updateMastery(skill: BktSkillState, isCorrect: boolean): BktSkillState {
    const pL = Math.max(0.001, Math.min(0.999, skill.currentMastery));
    const pS = Math.max(0.001, Math.min(0.5, skill.probabilityOfSlip));
    const pG = Math.max(0.001, Math.min(0.5, skill.probabilityOfGuess));
    const pT = Math.max(0.001, Math.min(0.5, skill.probabilityOfLearn));

    let posterior: number;

    if (isCorrect) {
      // P(L_t-1 | Correct)
      const numerator = pL * (1 - pS);
      const denominator = pL * (1 - pS) + (1 - pL) * pG;
      posterior = numerator / (denominator || 1);
    } else {
      // P(L_t-1 | Incorrect)
      const numerator = pL * pS;
      const denominator = pL * pS + (1 - pL) * (1 - pG);
      posterior = numerator / (denominator || 1);
    }

    // Apply transition probability (learning during the step)
    const updatedMastery = posterior + (1 - posterior) * pT;
    const boundedMastery = Number(Math.max(0.01, Math.min(0.999, updatedMastery)).toFixed(4));

    const newHistory = [
      ...skill.history,
      {
        isCorrect,
        timestamp: Date.now(),
        updatedMastery: boundedMastery,
      },
    ];

    return {
      ...skill,
      currentMastery: boundedMastery,
      history: newHistory,
      masteryLevel: this.classifyLevel(boundedMastery),
      recommendedDifficulty: this.getDifficulty(boundedMastery),
    };
  }

  /**
   * Classifies a numerical probability into pedagogical competence tiers
   */
  public static classifyLevel(masteryProbability: number): 'Novice' | 'Developing' | 'Proficient' | 'Mastered' {
    if (masteryProbability < 0.40) return 'Novice';
    if (masteryProbability < 0.70) return 'Developing';
    if (masteryProbability < 0.90) return 'Proficient';
    return 'Mastered';
  }

  /**
   * Dynamically adapts the recommended assessment difficulty level
   */
  public static getDifficulty(masteryProbability: number): 'Easy' | 'Medium' | 'Challenge' {
    if (masteryProbability < 0.45) return 'Easy';
    if (masteryProbability < 0.82) return 'Medium';
    return 'Challenge';
  }

  /**
   * Batch updates an array of skills against quiz or test items
   */
  public static batchEvaluate(
    skills: BktSkillState[],
    results: Array<{ skillId: string; isCorrect: boolean }>
  ): BktSkillState[] {
    const resultMap = new Map<string, boolean[]>();
    results.forEach(r => {
      const arr = resultMap.get(r.skillId) || [];
      arr.push(r.isCorrect);
      resultMap.set(r.skillId, arr);
    });

    return skills.map(skill => {
      const observations = resultMap.get(skill.skillId);
      if (!observations || observations.length === 0) return skill;

      let current = { ...skill };
      observations.forEach(isCorrect => {
        current = this.updateMastery(current, isCorrect);
      });
      return current;
    });
  }

  /**
   * Calculates overall mastery index across an entire curriculum or subject
   */
  public static calculateCurriculumIndex(skills: BktSkillState[]): {
    averageMastery: number;
    masteredCount: number;
    proficientCount: number;
    developingCount: number;
    noviceCount: number;
  } {
    if (skills.length === 0) {
      return { averageMastery: 0, masteredCount: 0, proficientCount: 0, developingCount: 0, noviceCount: 0 };
    }

    const total = skills.reduce((sum, s) => sum + s.currentMastery, 0);
    const avg = Number((total / skills.length).toFixed(4));

    return {
      averageMastery: avg,
      masteredCount: skills.filter(s => s.masteryLevel === 'Mastered').length,
      proficientCount: skills.filter(s => s.masteryLevel === 'Proficient').length,
      developingCount: skills.filter(s => s.masteryLevel === 'Developing').length,
      noviceCount: skills.filter(s => s.masteryLevel === 'Novice').length,
    };
  }
}
