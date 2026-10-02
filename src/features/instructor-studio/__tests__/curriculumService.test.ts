import { describe, it, expect } from 'vitest';
import { CurriculumService } from '../services/curriculumService';
import { CurriculumModule, CurriculumLesson, CourseBuilderDraft } from '@/shared/types/instructor';

describe('CurriculumService', () => {
  const sampleModule: CurriculumModule = {
    id: 'mod-1',
    courseId: 101,
    title: 'Foundations of Algebra',
    description: 'Core concepts of variables',
    order: 1,
    lessons: [
      {
        id: 'les-1',
        moduleId: 'mod-1',
        title: 'Variables and Expressions',
        order: 1,
        type: 'article',
        durationMinutes: 15,
        contentMarkdown: '# Intro',
      },
      {
        id: 'les-2',
        moduleId: 'mod-1',
        title: 'Solving One-Step Equations',
        order: 2,
        type: 'video',
        durationMinutes: 20,
        contentMarkdown: '# Video lesson',
        videoUrl: 'https://example.com/video.mp4',
        videoKeynotes: [
          { id: 'kn-1', timestampSeconds: 120, title: 'Step 1', note: 'Isolate x' },
        ],
      },
    ],
  };

  it('creates a new module with incremented order', () => {
    const newMod = CurriculumService.createModule(101, 'Linear Graphing', 'Slope concepts', [sampleModule]);

    expect(newMod.title).toBe('Linear Graphing');
    expect(newMod.order).toBe(2);
    expect(newMod.lessons).toEqual([]);
    expect(newMod.courseId).toBe(101);
  });

  it('updates an existing module', () => {
    const updated = CurriculumService.updateModule(
      { ...sampleModule, title: 'Advanced Algebra' },
      [sampleModule]
    );

    expect(updated[0].title).toBe('Advanced Algebra');
  });

  it('deletes a module and normalizes remaining order numbers', () => {
    const mod2: CurriculumModule = { ...sampleModule, id: 'mod-2', order: 2 };
    const mod3: CurriculumModule = { ...sampleModule, id: 'mod-3', order: 3 };

    const remaining = CurriculumService.deleteModule('mod-2', [sampleModule, mod2, mod3]);
    expect(remaining.length).toBe(2);
    expect(remaining[0].order).toBe(1);
    expect(remaining[1].order).toBe(2);
    expect(remaining[1].id).toBe('mod-3');
  });

  it('reorders modules correctly', () => {
    const mod2: CurriculumModule = { ...sampleModule, id: 'mod-2', title: 'Mod 2', order: 2 };
    const mod3: CurriculumModule = { ...sampleModule, id: 'mod-3', title: 'Mod 3', order: 3 };

    const reordered = CurriculumService.reorderModules([sampleModule, mod2, mod3], 0, 2);
    expect(reordered[0].id).toBe('mod-2');
    expect(reordered[1].id).toBe('mod-3');
    expect(reordered[2].id).toBe('mod-1');
    expect(reordered[0].order).toBe(1);
    expect(reordered[2].order).toBe(3);
  });

  it('creates and adds a lesson with incremented order within a module', () => {
    const newLesson = CurriculumService.createLesson('mod-1', 'Practice Quiz', 'quiz', 30, sampleModule.lessons);

    expect(newLesson.title).toBe('Practice Quiz');
    expect(newLesson.type).toBe('quiz');
    expect(newLesson.order).toBe(3);
    expect(newLesson.durationMinutes).toBe(30);
  });

  it('deletes a lesson and re-normalizes orders within module', () => {
    const result = CurriculumService.deleteLesson('les-1', 'mod-1', [sampleModule]);
    const moduleLessons = result[0].lessons;

    expect(moduleLessons.length).toBe(1);
    expect(moduleLessons[0].id).toBe('les-2');
    expect(moduleLessons[0].order).toBe(1);
  });

  it('reorders lessons within a module', () => {
    const reordered = CurriculumService.reorderLessons(sampleModule.lessons, 0, 1);

    expect(reordered[0].id).toBe('les-2');
    expect(reordered[1].id).toBe('les-1');
    expect(reordered[0].order).toBe(1);
    expect(reordered[1].order).toBe(2);
  });

  it('moves a lesson from one module to another module', () => {
    const mod2: CurriculumModule = {
      id: 'mod-2',
      courseId: 101,
      title: 'Module 2',
      description: '',
      order: 2,
      lessons: [],
    };

    const modules = [sampleModule, mod2];
    const updated = CurriculumService.moveLessonBetweenModules('mod-1', 'mod-2', 'les-1', 0, modules);

    expect(updated[0].lessons.length).toBe(1);
    expect(updated[0].lessons[0].id).toBe('les-2');
    expect(updated[1].lessons.length).toBe(1);
    expect(updated[1].lessons[0].id).toBe('les-1');
    expect(updated[1].lessons[0].moduleId).toBe('mod-2');
  });

  it('attaches and sorts video keynotes chronologically', () => {
    const lesson = sampleModule.lessons[1];
    const withKeynote = CurriculumService.addVideoKeynote(lesson, {
      timestampSeconds: 45,
      title: 'Intro hook',
      note: 'Engaging real world question',
    });

    expect(withKeynote.videoKeynotes?.length).toBe(2);
    // Keynote at 45s should come before 120s
    expect(withKeynote.videoKeynotes?.[0].timestampSeconds).toBe(45);
    expect(withKeynote.videoKeynotes?.[1].timestampSeconds).toBe(120);

    const deleted = CurriculumService.deleteVideoKeynote(withKeynote, withKeynote.videoKeynotes![0].id);
    expect(deleted.videoKeynotes?.length).toBe(1);
    expect(deleted.videoKeynotes?.[0].timestampSeconds).toBe(120);
  });

  it('validates curriculum completeness and outputs detailed diagnostics', () => {
    const invalidModules: CurriculumModule[] = [
      {
        id: 'mod-empty',
        courseId: 101,
        title: '',
        description: '',
        order: 1,
        lessons: [],
      },
    ];

    const validation = CurriculumService.validateCurriculum(invalidModules);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('missing a title'))).toBe(true);
    expect(validation.errors.some((e) => e.includes('contains no lessons'))).toBe(true);

    const validValidation = CurriculumService.validateCurriculum([sampleModule]);
    expect(validValidation.isValid).toBe(true);
    expect(validValidation.errors.length).toBe(0);
  });

  it('exports a valid curriculum JSON package', () => {
    const draft: CourseBuilderDraft = {
      courseId: 101,
      title: 'Test Course',
      description: 'Test Description',
      category: 'Math',
      gradeLevel: 'Grade 8',
      modules: [sampleModule],
      rubrics: [],
      updatedAt: '2026-10-02T12:00:00Z',
    };

    const exported = CurriculumService.exportCurriculumPackage(draft);
    const parsed = JSON.parse(exported);

    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.course.title).toBe('Test Course');
    expect(parsed.modules.length).toBe(1);
  });
});
