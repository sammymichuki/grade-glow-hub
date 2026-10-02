import {
  CurriculumModule,
  CurriculumLesson,
  VideoKeynote,
  CourseBuilderDraft,
  LessonType,
} from '@/shared/types/instructor';

export class CurriculumService {
  /**
   * Creates a new module with an auto-incremented order.
   */
  static createModule(
    courseId: number,
    title: string,
    description: string = '',
    existingModules: CurriculumModule[] = []
  ): CurriculumModule {
    const nextOrder = existingModules.length > 0
      ? Math.max(...existingModules.map((m) => m.order)) + 1
      : 1;

    return {
      id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      courseId,
      title: title.trim(),
      description: description.trim(),
      order: nextOrder,
      lessons: [],
    };
  }

  /**
   * Updates an existing module in the modules array.
   */
  static updateModule(
    updatedModule: CurriculumModule,
    modules: CurriculumModule[]
  ): CurriculumModule[] {
    return modules.map((m) => (m.id === updatedModule.id ? { ...updatedModule } : m));
  }

  /**
   * Deletes a module and normalizes order indices for remaining modules.
   */
  static deleteModule(moduleId: string, modules: CurriculumModule[]): CurriculumModule[] {
    return modules
      .filter((m) => m.id !== moduleId)
      .map((m, index) => ({ ...m, order: index + 1 }));
  }

  /**
   * Reorders modules given source and target indices.
   */
  static reorderModules(
    modules: CurriculumModule[],
    fromIndex: number,
    toIndex: number
  ): CurriculumModule[] {
    if (
      fromIndex < 0 ||
      fromIndex >= modules.length ||
      toIndex < 0 ||
      toIndex >= modules.length ||
      fromIndex === toIndex
    ) {
      return modules;
    }

    const copy = [...modules];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);

    return copy.map((mod, idx) => ({ ...mod, order: idx + 1 }));
  }

  /**
   * Creates a new lesson inside a module.
   */
  static createLesson(
    moduleId: string,
    title: string,
    type: LessonType = 'article',
    durationMinutes: number = 15,
    existingLessons: CurriculumLesson[] = []
  ): CurriculumLesson {
    const nextOrder = existingLessons.length > 0
      ? Math.max(...existingLessons.map((l) => l.order)) + 1
      : 1;

    return {
      id: `les-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      moduleId,
      title: title.trim(),
      type,
      durationMinutes: Math.max(1, durationMinutes),
      order: nextOrder,
      contentMarkdown: '',
      isPublished: true,
      videoKeynotes: [],
    };
  }

  /**
   * Updates a lesson within the module collection.
   */
  static updateLesson(
    updatedLesson: CurriculumLesson,
    modules: CurriculumModule[]
  ): CurriculumModule[] {
    return modules.map((mod) => {
      if (mod.id !== updatedLesson.moduleId) return mod;
      return {
        ...mod,
        lessons: mod.lessons.map((les) => (les.id === updatedLesson.id ? updatedLesson : les)),
      };
    });
  }

  /**
   * Deletes a lesson and re-normalizes orders within the parent module.
   */
  static deleteLesson(
    lessonId: string,
    moduleId: string,
    modules: CurriculumModule[]
  ): CurriculumModule[] {
    return modules.map((mod) => {
      if (mod.id !== moduleId) return mod;
      const filtered = mod.lessons.filter((l) => l.id !== lessonId);
      return {
        ...mod,
        lessons: filtered.map((l, idx) => ({ ...l, order: idx + 1 })),
      };
    });
  }

  /**
   * Reorders lessons within a module.
   */
  static reorderLessons(
    lessons: CurriculumLesson[],
    fromIndex: number,
    toIndex: number
  ): CurriculumLesson[] {
    if (
      fromIndex < 0 ||
      fromIndex >= lessons.length ||
      toIndex < 0 ||
      toIndex >= lessons.length ||
      fromIndex === toIndex
    ) {
      return lessons;
    }

    const copy = [...lessons];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);

    return copy.map((lesson, idx) => ({ ...lesson, order: idx + 1 }));
  }

  /**
   * Moves a lesson between modules.
   */
  static moveLessonBetweenModules(
    sourceModuleId: string,
    targetModuleId: string,
    lessonId: string,
    targetIndex: number,
    modules: CurriculumModule[]
  ): CurriculumModule[] {
    const sourceModule = modules.find((m) => m.id === sourceModuleId);
    const targetModule = modules.find((m) => m.id === targetModuleId);

    if (!sourceModule || !targetModule) return modules;

    const lessonToMove = sourceModule.lessons.find((l) => l.id === lessonId);
    if (!lessonToMove) return modules;

    if (sourceModuleId === targetModuleId) {
      const fromIndex = sourceModule.lessons.findIndex((l) => l.id === lessonId);
      const reordered = this.reorderLessons(sourceModule.lessons, fromIndex, targetIndex);
      return modules.map((m) => (m.id === sourceModuleId ? { ...m, lessons: reordered } : m));
    }

    const updatedSourceLessons = sourceModule.lessons
      .filter((l) => l.id !== lessonId)
      .map((l, idx) => ({ ...l, order: idx + 1 }));

    const updatedLesson: CurriculumLesson = {
      ...lessonToMove,
      moduleId: targetModuleId,
    };

    const targetLessonsCopy = [...targetModule.lessons];
    const clampedIndex = Math.max(0, Math.min(targetIndex, targetLessonsCopy.length));
    targetLessonsCopy.splice(clampedIndex, 0, updatedLesson);

    const updatedTargetLessons = targetLessonsCopy.map((l, idx) => ({ ...l, order: idx + 1 }));

    return modules.map((m) => {
      if (m.id === sourceModuleId) return { ...m, lessons: updatedSourceLessons };
      if (m.id === targetModuleId) return { ...m, lessons: updatedTargetLessons };
      return m;
    });
  }

  /**
   * Adds a video keynote timestamp to a lesson.
   */
  static addVideoKeynote(
    lesson: CurriculumLesson,
    keynote: Omit<VideoKeynote, 'id'>
  ): CurriculumLesson {
    const newKeynote: VideoKeynote = {
      ...keynote,
      id: `kn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };

    const sortedKeynotes = [...(lesson.videoKeynotes || []), newKeynote].sort(
      (a, b) => a.timestampSeconds - b.timestampSeconds
    );

    return {
      ...lesson,
      videoKeynotes: sortedKeynotes,
    };
  }

  /**
   * Deletes a video keynote from a lesson.
   */
  static deleteVideoKeynote(lesson: CurriculumLesson, keynoteId: string): CurriculumLesson {
    return {
      ...lesson,
      videoKeynotes: (lesson.videoKeynotes || []).filter((kn) => kn.id !== keynoteId),
    };
  }

  /**
   * Validates curriculum completeness and returns structured errors.
   */
  static validateCurriculum(modules: CurriculumModule[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!modules.length) {
      errors.push('Curriculum must contain at least one module.');
    }

    modules.forEach((mod, modIdx) => {
      if (!mod.title.trim()) {
        errors.push(`Module ${modIdx + 1} is missing a title.`);
      }

      if (!mod.lessons.length) {
        errors.push(`Module "${mod.title || `Module ${modIdx + 1}`}" contains no lessons.`);
      }

      mod.lessons.forEach((les, lesIdx) => {
        if (!les.title.trim()) {
          errors.push(`Lesson ${lesIdx + 1} in Module "${mod.title}" has no title.`);
        }
        if (les.type === 'video' && !les.videoUrl) {
          errors.push(`Video lesson "${les.title || lesIdx + 1}" requires a valid video URL.`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Serializes the curriculum draft into an exportable LMS JSON package.
   */
  static exportCurriculumPackage(draft: CourseBuilderDraft): string {
    return JSON.stringify(
      {
        schemaVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        course: {
          id: draft.courseId,
          title: draft.title,
          description: draft.description,
          category: draft.category,
          gradeLevel: draft.gradeLevel,
        },
        modules: draft.modules,
        rubrics: draft.rubrics,
      },
      null,
      2
    );
  }
}
