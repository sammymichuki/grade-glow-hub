import { describe, it, expect } from 'vitest';
import {
  RagService,
  SAMPLE_SYLLABUS_EXCERPTS,
} from '../services/ragService';

describe('RagService (Curriculum Ingestion & RAG Generation)', () => {
  it('chunks documents into semantic segments', () => {
    const rawText = `Photosynthesis is a chemical process that green plants use to convert light energy into chemical energy.

Chloroplasts are specialized structures that contain chlorophyll pigments. Water and carbon dioxide are the primary reactants.`;

    const chunks = RagService.chunkDocument(rawText);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('generates Bloom-calibrated questions for Science syllabus text', () => {
    const sample = SAMPLE_SYLLABUS_EXCERPTS[0];
    const job = RagService.generateQuestionsFromText(
      sample.title,
      sample.subject,
      sample.standard,
      sample.grade,
      sample.notes,
      5
    );

    expect(job.generatedQuestions).toHaveLength(5);
    expect(job.status).toBe('completed');
    expect(job.bloomDistribution.knowledge).toBeGreaterThan(0);
    expect(job.bloomDistribution.application).toBeGreaterThan(0);

    const q1 = job.generatedQuestions[0];
    expect(q1.question).toContain('organelle');
    expect(q1.options).toContain('Mitochondria');
    expect(q1.correctAnswer).toBe('Chloroplast');
    expect(q1.explanation).toBeDefined();
  });

  it('generates Bloom-calibrated questions for Mathematics linear equations text', () => {
    const sample = SAMPLE_SYLLABUS_EXCERPTS[1];
    const job = RagService.generateQuestionsFromText(
      sample.title,
      sample.subject,
      sample.standard,
      sample.grade,
      sample.notes,
      4
    );

    expect(job.generatedQuestions).toHaveLength(4);
    const slopeQuestion = job.generatedQuestions.find(q => q.id === 'q-math-know-1');
    expect(slopeQuestion).toBeDefined();
    expect(slopeQuestion?.correctAnswer).toContain('gradient');
  });

  it('generates fallback questions for arbitrary custom curriculum text', () => {
    const customText = `Kenyan farmers harvest coffee beans across the slopes of Mount Kenya. Coffee requires fertile volcanic soils and adequate rainfall.`;

    const job = RagService.generateQuestionsFromText(
      'Coffee Farming',
      'Agriculture',
      'KICD_CBC',
      7,
      customText,
      3
    );

    expect(job.generatedQuestions.length).toBeGreaterThan(0);
    expect(job.generatedQuestions[0].options?.length).toBe(4);
  });
});
