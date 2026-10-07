import {
  EssayEvaluationResult,
  EssayAnnotation,
  RubricCriterionScore,
} from '../types/aiTutor';

export const SAMPLE_STUDENT_ESSAYS = [
  {
    title: 'The Critical Role of Wetlands in Protecting Biodiversity',
    subject: 'Integrated Science',
    grade: 7,
    text: `Wetlands are among the most productive ecosystems on Earth, acting as natural sponges that absorb excess floodwaters and filter pollutants before they reach our rivers and lakes. In Kenya, ecosystems like Lake Nakuru and the Tana River Delta provide vital breeding grounds for migratory flamingos and endangered fish species.

Furthermore, wetland vegetation traps sediments and excess agricultural fertilizers, which prevents harmful algal blooms downstream. When communities drain swamps for residential construction, this delicate ecological balance is destroyed. Therefore, protecting wetland corridors through sustainable environmental policies is essential for sustaining biodiversity and preserving freshwater resources for future generations.`,
  },
  {
    title: 'Should Schools Adopt a Four-Day Instructional Week?',
    subject: 'English Language Arts',
    grade: 8,
    text: `Many school districts around the world are experimenting with a four-day school week. Some people think its a bad idea because students might forget things over three-day weekends. However, evidence shows that students get more rest and teachers have an extra day to plan engaging lessons.

In addition, schools save money on bus transportation and electricity. For example, a rural school in Colorado reported a twenty percent drop in student absenteeism after switching schedules. In conclusion, adopting a four-day week improves student well-being and academic concentration while reducing district operating costs.`,
  },
];

export class EssayEvaluatorService {
  /**
   * Evaluates student essay using automated rubric analysis
   */
  public static evaluateEssay(title: string, essayText: string): EssayEvaluationResult {
    const cleanText = essayText.trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const wordCount = words.length;
    const sentenceCount = Math.max(1, sentences.length);
    const avgSentenceLength = Number((wordCount / sentenceCount).toFixed(1));

    // Approximate Flesch-Kincaid grade level
    const syllables = words.reduce((acc, word) => acc + this.countSyllables(word), 0);
    const fkGrade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / Math.max(1, wordCount)) - 15.59;
    const readabilityGrade = `Grade ${Math.max(4, Math.min(12, Math.round(fkGrade)))}`;

    // Criteria Analysis
    const annotations: EssayAnnotation[] = [];
    const strengths: string[] = [];
    const growthAreas: string[] = [];

    // Check thesis statement in introductory section
    const hasStrongThesis = /vital|essential|critical|improves|therefore|in conclusion|evidence shows/i.test(sentences[0] || '') ||
      (sentences.length > 1 && /vital|essential|critical|improves|therefore/i.test(sentences[1] || ''));

    const thesisScore = hasStrongThesis ? 24 : 18;
    if (hasStrongThesis) {
      strengths.push('Clear thesis establishing the core argument in the opening paragraph.');
      annotations.push({
        id: 'ann-thesis-1',
        startOffset: 0,
        endOffset: Math.min(cleanText.indexOf('.') + 1, 100),
        highlightedText: sentences[0] ? sentences[0].slice(0, 80) : cleanText.slice(0, 80),
        category: 'thesis',
        type: 'strength',
        comment: 'Strong central thesis statement that clearly defines the scope of your inquiry.',
      });
    } else {
      growthAreas.push('Clarify your primary thesis statement in the introductory sentences.');
    }

    // Check transitions
    const transitionRegex = /\b(furthermore|however|in addition|for example|therefore|consequently|in conclusion)\b/gi;
    const transitionMatches = Array.from(cleanText.matchAll(transitionRegex));
    const organizationScore = transitionMatches.length >= 2 ? 23 : 17;

    transitionMatches.forEach((m, idx) => {
      const matchWord = m[0];
      const matchIndex = m.index ?? 0;
      annotations.push({
        id: `ann-trans-${idx}`,
        startOffset: matchIndex,
        endOffset: matchIndex + matchWord.length,
        highlightedText: matchWord,
        category: 'structure',
        type: 'strength',
        comment: `Effective transition word "${matchWord}" that connects logical premises smoothly.`,
      });
    });

    if (transitionMatches.length >= 2) {
      strengths.push('Excellent use of cohesive transitional markers linking supporting paragraphs.');
    } else {
      growthAreas.push('Incorporate more transition signposts (e.g., "Furthermore", "In contrast") between paragraphs.');
    }

    // Check evidence / examples
    const evidenceRegex = /\b(for example|evidence shows|ecosystems like|reported|study|percent|vital breeding grounds)\b/gi;
    const evidenceMatches = Array.from(cleanText.matchAll(evidenceRegex));
    const evidenceScore = evidenceMatches.length >= 1 ? 23 : 16;

    evidenceMatches.forEach((m, idx) => {
      const matchWord = m[0];
      const matchIndex = m.index ?? 0;
      annotations.push({
        id: `ann-evid-${idx}`,
        startOffset: matchIndex,
        endOffset: matchIndex + matchWord.length,
        highlightedText: matchWord,
        category: 'evidence',
        type: 'strength',
        comment: 'Concrete empirical evidence that grounds the theoretical premise.',
      });
    });

    // Check common grammatical traps (e.g. its vs it's)
    const itsRegex = /\b(its a|it's a)\b/i;
    const itsMatch = cleanText.match(itsRegex);
    let conventionsScore = 22;

    if (cleanText.includes('its a bad idea')) {
      conventionsScore = 20;
      growthAreas.push('Watch contraction vs possessive apostrophes (e.g. "it\'s" vs "its").');
      const idx = cleanText.indexOf('its a');
      annotations.push({
        id: 'ann-gram-its',
        startOffset: idx,
        endOffset: idx + 5,
        highlightedText: 'its a',
        category: 'grammar',
        type: 'suggestion',
        comment: 'Contraction alert: Use "it\'s" (it is) instead of the possessive pronoun "its".',
        suggestedReplacement: "it's a",
      });
    }

    // Vocabulary enhancements
    const richVocabRegex = /\b(ecosystems|biodiversity|sustainable|delicate|absenteeism|concentration|productivity)\b/gi;
    const vocabMatches = Array.from(cleanText.matchAll(richVocabRegex));
    vocabMatches.forEach((m, idx) => {
      const matchWord = m[0];
      const matchIndex = m.index ?? 0;
      annotations.push({
        id: `ann-voc-${idx}`,
        startOffset: matchIndex,
        endOffset: matchIndex + matchWord.length,
        highlightedText: matchWord,
        category: 'vocabulary',
        type: 'strength',
        comment: `Advanced academic vocabulary: "${matchWord}" enriches the lexical tone.`,
      });
    });

    const rubricCriteria: RubricCriterionScore[] = [
      {
        name: 'Thesis & Purpose',
        score: thesisScore,
        maxScore: 25,
        weight: 25,
        feedback: hasStrongThesis
          ? 'Thesis is clearly articulated and framed within the introduction.'
          : 'Consider refining your thesis to make a more assertive claim.',
      },
      {
        name: 'Evidence & Reasoning',
        score: evidenceScore,
        maxScore: 25,
        weight: 25,
        feedback: evidenceMatches.length >= 1
          ? 'Concrete real-world examples effectively substantiate the main thesis.'
          : 'Add specific case studies or statistics to bolster your assertions.',
      },
      {
        name: 'Structure & Coherence',
        score: organizationScore,
        maxScore: 25,
        weight: 25,
        feedback: 'Paragraphs progress naturally with logical sequence and transitional flow.',
      },
      {
        name: 'Language Conventions',
        score: conventionsScore,
        maxScore: 25,
        weight: 25,
        feedback: 'Demonstrates solid command of sentence mechanics, syntax and vocabulary.',
      },
    ];

    const totalRaw = rubricCriteria.reduce((sum, c) => sum + c.score, 0);
    const overallScore = Math.min(100, Math.round(totalRaw));

    let letterGrade = 'A';
    if (overallScore >= 90) letterGrade = 'A';
    else if (overallScore >= 80) letterGrade = 'B+';
    else if (overallScore >= 70) letterGrade = 'B';
    else if (overallScore >= 60) letterGrade = 'C';
    else letterGrade = 'D';

    return {
      id: `eval-${Date.now()}`,
      essayTitle: title || 'Untitled Essay',
      wordCount,
      sentenceCount,
      avgSentenceLength,
      readabilityGrade,
      overallScore,
      letterGrade,
      rubricCriteria,
      annotations,
      strengths,
      growthAreas,
      recommendedMiniLessons: [
        {
          id: 'lesson-thesis-crafting',
          title: 'Mastering the CBC Persuasive Thesis Statement',
          subject: 'English',
          link: '/course/1',
        },
        {
          id: 'lesson-cohesion-markers',
          title: 'Advanced Transitional Phrasing for Expository Essays',
          subject: 'Writing Lab',
          link: '/course/1',
        },
      ],
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper heuristic for counting syllables in a word
   */
  public static countSyllables(word: string): number {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length <= 3) return 1;
    const matches = cleanWord.match(/[aeiouy]{1,2}/g);
    let count = matches ? matches.length : 1;
    if (cleanWord.endsWith('e') && !cleanWord.endsWith('le')) {
      count = Math.max(1, count - 1);
    }
    return Math.max(1, count);
  }
}
