import { describe, it, expect, beforeEach } from 'vitest';
import { AiTutorService } from '../services/aiTutorService';

describe('AiTutorService', () => {
  beforeEach(() => {
    AiTutorService.clearHistory();
  });

  describe('Child-Safety & COPPA Guardrails', () => {
    it('detects and redacts phone number PII leaks', () => {
      const check = AiTutorService.checkSafety('Call me at +254 712 345 678 for the homework answers');
      expect(check.isSafe).toBe(false);
      expect(check.category).toBe('pii_leak');
      expect(check.advisory).toContain('Never share phone numbers');
    });

    it('detects and flags email address PII leaks', () => {
      const check = AiTutorService.checkSafety('Send the worksheet to student.kevin@gmail.com');
      expect(check.isSafe).toBe(false);
      expect(check.category).toBe('pii_leak');
    });

    it('sanitizes inappropriate profanity', () => {
      const check = AiTutorService.checkSafety('This stupid math test is damn hard');
      expect(check.isSafe).toBe(false);
      expect(check.category).toBe('profanity');
      expect(check.sanitizedContent).toContain('***');
    });

    it('flags non-academic gaming topics and redirects', () => {
      const check = AiTutorService.checkSafety('How do I get free vbucks in fortnite?');
      expect(check.isSafe).toBe(true);
      expect(check.category).toBe('off_topic');
      expect(check.advisory).toContain('Academic reminder');
    });

    it('approves legitimate curriculum queries as clean', () => {
      const check = AiTutorService.checkSafety('Why do plants need carbon dioxide during photosynthesis?');
      expect(check.isSafe).toBe(true);
      expect(check.category).toBe('clean');
    });
  });

  describe('Socratic Guidance & Response Logic', () => {
    it('returns a child-safety shield notice when PII is passed to askGlowBot', async () => {
      const res = await AiTutorService.askGlowBot('My phone is 555-234-5678', {
        subject: 'Math',
        gradeLevel: 6,
        topic: 'Algebra',
      });

      expect(res.safetyFlagged).toBe(true);
      expect(res.content).toContain('Child Safety Shield');
    });

    it('provides Socratic hints for fraction queries without disclosing answers', async () => {
      const res = await AiTutorService.askGlowBot('How do I add 1/3 and 2/5?', {
        subject: 'Mathematics',
        gradeLevel: 7,
        topic: 'Fractions',
      });

      expect(res.role).toBe('assistant');
      expect(res.content).toContain('denominators');
      expect(res.conceptTags).toContain('Fractions');
      expect(res.suggestedSteps).toBeDefined();
      expect(res.suggestedSteps?.length).toBeGreaterThan(0);
    });

    it('provides pedagogical scaffolding for photosynthesis in science', async () => {
      const res = await AiTutorService.askGlowBot('What are the products of photosynthesis?', {
        subject: 'Integrated Science',
        gradeLevel: 7,
        topic: 'Photosynthesis',
      });

      expect(res.content).toContain('Chloroplast');
      expect(res.conceptTags).toContain('Biology');
    });

    it('guides essay structure with the PEEL formula in English', async () => {
      const res = await AiTutorService.askGlowBot('How do I write a good body paragraph for my essay?', {
        subject: 'English',
        gradeLevel: 8,
        topic: 'Essay Composition',
      });

      expect(res.content).toContain('P.E.E.L.');
    });

    it('handles counter-example Socratic mode', async () => {
      const res = await AiTutorService.askGlowBot('All numbers are positive', {
        subject: 'Math',
        gradeLevel: 7,
        topic: 'Integers',
      }, 'counter-example');

      expect(res.content).toContain('hypothesis');
      expect(res.socraticMode).toBe('counter-example');
    });

    it('persists and retrieves conversation history correctly', async () => {
      expect(AiTutorService.loadHistory()).toHaveLength(0);

      await AiTutorService.askGlowBot('What is a prime number?', {
        subject: 'Math',
        gradeLevel: 6,
        topic: 'Number Theory',
      });

      const history = AiTutorService.loadHistory();
      expect(history.length).toBeGreaterThan(0);

      const stats = AiTutorService.getSessionStats();
      expect(stats.messageCount).toBe(history.length);
      expect(stats.tokensUsed).toBeGreaterThan(0);
    });
  });
});
