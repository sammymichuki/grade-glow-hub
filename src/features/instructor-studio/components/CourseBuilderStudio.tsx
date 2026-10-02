import React, { useState } from 'react';
import {
  CurriculumModule,
  CurriculumLesson,
  CourseBuilderDraft,
  LessonType,
} from '@/shared/types/instructor';
import { CurriculumService } from '../services/curriculumService';
import { SAMPLE_CURRICULUM_DRAFT } from '../data/sampleCurriculum';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlayCircle,
  Eye,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';

export const CourseBuilderStudio: React.FC = () => {
  const [draft, setDraft] = useState<CourseBuilderDraft>(SAMPLE_CURRICULUM_DRAFT);
  const [selectedLesson, setSelectedLesson] = useState<CurriculumLesson | null>(
    SAMPLE_CURRICULUM_DRAFT.modules[0]?.lessons[0] || null
  );
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<LessonType>('article');
  const [activeModuleIdForNewLesson, setActiveModuleIdForNewLesson] = useState<string | null>(null);

  // New keynote state
  const [keynoteTime, setKeynoteTime] = useState<number>(60);
  const [keynoteTitle, setKeynoteTitle] = useState('');
  const [keynoteNote, setKeynoteNote] = useState('');

  // Module actions
  const handleAddModule = () => {
    if (!newModuleTitle.trim()) {
      toast.error('Please enter a module title.');
      return;
    }

    const newMod = CurriculumService.createModule(
      draft.courseId,
      newModuleTitle,
      '',
      draft.modules
    );

    setDraft((prev) => ({
      ...prev,
      modules: [...prev.modules, newMod],
      updatedAt: new Date().toISOString(),
    }));

    setNewModuleTitle('');
    toast.success(`Module "${newMod.title}" created.`);
  };

  const handleDeleteModule = (moduleId: string) => {
    const updated = CurriculumService.deleteModule(moduleId, draft.modules);
    setDraft((prev) => ({ ...prev, modules: updated }));
    if (selectedLesson && !updated.some((m) => m.lessons.some((l) => l.id === selectedLesson.id))) {
      setSelectedLesson(null);
    }
    toast.info('Module deleted.');
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = CurriculumService.reorderModules(draft.modules, index, targetIndex);
    setDraft((prev) => ({ ...prev, modules: reordered }));
  };

  // Lesson actions
  const handleAddLesson = (moduleId: string) => {
    if (!newLessonTitle.trim()) {
      toast.error('Please enter a lesson title.');
      return;
    }

    const parentModule = draft.modules.find((m) => m.id === moduleId);
    const newLes = CurriculumService.createLesson(
      moduleId,
      newLessonTitle,
      newLessonType,
      20,
      parentModule?.lessons || []
    );

    const updatedModules = draft.modules.map((m) => {
      if (m.id !== moduleId) return m;
      return { ...m, lessons: [...m.lessons, newLes] };
    });

    setDraft((prev) => ({ ...prev, modules: updatedModules }));
    setSelectedLesson(newLes);
    setNewLessonTitle('');
    setActiveModuleIdForNewLesson(null);
    toast.success(`Lesson "${newLes.title}" added.`);
  };

  const handleDeleteLesson = (lessonId: string, moduleId: string) => {
    const updated = CurriculumService.deleteLesson(lessonId, moduleId, draft.modules);
    setDraft((prev) => ({ ...prev, modules: updated }));
    if (selectedLesson?.id === lessonId) {
      setSelectedLesson(null);
    }
    toast.info('Lesson deleted.');
  };

  const handleMoveLesson = (moduleId: string, lessonIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? lessonIdx - 1 : lessonIdx + 1;
    const targetModule = draft.modules.find((m) => m.id === moduleId);
    if (!targetModule) return;

    const reordered = CurriculumService.reorderLessons(targetModule.lessons, lessonIdx, targetIdx);
    const updatedModules = draft.modules.map((m) =>
      m.id === moduleId ? { ...m, lessons: reordered } : m
    );

    setDraft((prev) => ({ ...prev, modules: updatedModules }));
  };

  const handleUpdateSelectedLesson = (field: keyof CurriculumLesson, value: any) => {
    if (!selectedLesson) return;

    const updated = { ...selectedLesson, [field]: value };
    setSelectedLesson(updated);

    const updatedModules = CurriculumService.updateLesson(updated, draft.modules);
    setDraft((prev) => ({ ...prev, modules: updatedModules }));
  };

  // Video Keynote handler
  const handleAddKeynote = () => {
    if (!selectedLesson || !keynoteTitle.trim()) {
      toast.error('Please enter a keynote title.');
      return;
    }

    const updatedLesson = CurriculumService.addVideoKeynote(selectedLesson, {
      timestampSeconds: Number(keynoteTime),
      title: keynoteTitle.trim(),
      note: keynoteNote.trim(),
    });

    setSelectedLesson(updatedLesson);
    const updatedModules = CurriculumService.updateLesson(updatedLesson, draft.modules);
    setDraft((prev) => ({ ...prev, modules: updatedModules }));

    setKeynoteTitle('');
    setKeynoteNote('');
    toast.success('Keynote timestamp attached.');
  };

  const handleDeleteKeynote = (keynoteId: string) => {
    if (!selectedLesson) return;
    const updatedLesson = CurriculumService.deleteVideoKeynote(selectedLesson, keynoteId);
    setSelectedLesson(updatedLesson);
    const updatedModules = CurriculumService.updateLesson(updatedLesson, draft.modules);
    setDraft((prev) => ({ ...prev, modules: updatedModules }));
  };

  // Export curriculum
  const handleExport = () => {
    const jsonStr = CurriculumService.exportCurriculumPackage(draft);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `curriculum-${draft.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Curriculum package exported successfully.');
  };

  const validation = CurriculumService.validateCurriculum(draft.modules);

  const getTypeIcon = (type: LessonType) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
      case 'assignment':
        return <ClipboardList className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-education-primary">
              Instructor Studio
            </span>
            <Badge variant={validation.isValid ? 'default' : 'destructive'} className="text-xs">
              {validation.isValid ? 'Curriculum Ready' : `${validation.errors.length} Issues`}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{draft.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {draft.category} • {draft.gradeLevel} • Drag & reorder syllabus modules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> Export Package
          </Button>
        </div>
      </div>

      {/* Validation alert banner if issues exist */}
      {!validation.isValid && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-sm">Curriculum Validation Warnings:</p>
            {validation.errors.map((err, i) => (
              <p key={i}>• {err}</p>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Left = Modules & Lessons Tree; Right = Lesson Editor & Video Keynotes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Syllabus Structure (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Curriculum Structure</CardTitle>
                <CardDescription>Organize modules and drag-reorder lessons</CardDescription>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600">
                {draft.modules.length} Modules
              </span>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {draft.modules.map((mod, modIdx) => (
                <div key={mod.id} className="border rounded-lg p-3 bg-gray-50/70 space-y-2">
                  {/* Module header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-semibold text-sm truncate text-gray-900">
                        {mod.order}. {mod.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={modIdx === 0}
                        onClick={() => handleMoveModule(modIdx, 'up')}
                        className="h-7 w-7 p-0"
                        title="Move Module Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={modIdx === draft.modules.length - 1}
                        onClick={() => handleMoveModule(modIdx, 'down')}
                        className="h-7 w-7 p-0"
                        title="Move Module Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModule(mod.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Lessons list in module */}
                  <div className="space-y-1.5 pl-4 border-l-2 border-education-primary/30 my-2">
                    {mod.lessons.map((les, lesIdx) => {
                      const isSelected = selectedLesson?.id === les.id;
                      return (
                        <div
                          key={les.id}
                          onClick={() => setSelectedLesson(les)}
                          className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-education-primary text-white font-medium shadow-sm'
                              : 'bg-white hover:bg-gray-100 text-gray-800 border'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={isSelected ? 'text-white' : ''}>{getTypeIcon(les.type)}</span>
                            <span className="truncate">
                              {les.order}. {les.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={lesIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLesson(mod.id, lesIdx, 'up');
                              }}
                              className={`p-1 rounded ${
                                isSelected ? 'hover:bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-500'
                              } disabled:opacity-30`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={lesIdx === mod.lessons.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLesson(mod.id, lesIdx, 'down');
                              }}
                              className={`p-1 rounded ${
                                isSelected ? 'hover:bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-500'
                              } disabled:opacity-30`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(les.id, mod.id);
                              }}
                              className={`p-1 rounded ${
                                isSelected ? 'hover:bg-red-700 text-white' : 'hover:bg-red-100 text-red-500'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {mod.lessons.length === 0 && (
                      <p className="text-xs text-gray-400 italic py-1">No lessons yet in this module.</p>
                    )}
                  </div>

                  {/* Add Lesson to this module inline */}
                  {activeModuleIdForNewLesson === mod.id ? (
                    <div className="p-2.5 bg-white border rounded space-y-2 mt-2">
                      <Input
                        placeholder="Lesson title..."
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        className="text-xs h-8"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={newLessonType}
                          onChange={(e) => setNewLessonType(e.target.value as LessonType)}
                          aria-label="New Lesson Type"
                          className="text-xs border rounded p-1.5 flex-1 bg-white"
                        >
                          <option value="article">Article / Reading</option>
                          <option value="video">Interactive Video</option>
                          <option value="quiz">Checkpoint Quiz</option>
                          <option value="assignment">Homework Assignment</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleAddLesson(mod.id)}
                          className="h-8 text-xs bg-education-primary"
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveModuleIdForNewLesson(null)}
                          className="h-8 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveModuleIdForNewLesson(mod.id)}
                      className="w-full text-xs text-education-primary h-7 gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Lesson
                    </Button>
                  )}
                </div>
              ))}

              {/* Add New Module Input */}
              <div className="pt-2 border-t flex gap-2">
                <Input
                  placeholder="New module title..."
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="text-sm"
                />
                <Button onClick={handleAddModule} size="sm" className="gap-1 shrink-0">
                  <Plus className="w-4 h-4" /> Add Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Selected Lesson Editor & Keynotes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedLesson ? (
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-education-primary">
                      Lesson Editor
                    </span>
                    <CardTitle className="text-xl flex items-center gap-2 mt-0.5">
                      {getTypeIcon(selectedLesson.type)}
                      {selectedLesson.title}
                    </CardTitle>
                  </div>
                  <Badge variant="outline">{selectedLesson.durationMinutes} mins</Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-5">
                {/* Basic lesson metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-medium text-gray-700">Lesson Title</label>
                    <Input
                      value={selectedLesson.title}
                      onChange={(e) => handleUpdateSelectedLesson('title', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Duration (Minutes)</label>
                    <Input
                      type="number"
                      value={selectedLesson.durationMinutes}
                      onChange={(e) =>
                        handleUpdateSelectedLesson('durationMinutes', parseInt(e.target.value, 10) || 10)
                      }
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* If Video Lesson: Video URL & Keynotes */}
                {selectedLesson.type === 'video' && (
                  <div className="p-4 border rounded-lg bg-blue-50/40 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" /> Video Stream URL (MP4 / HLS / WebM)
                      </label>
                      <Input
                        value={selectedLesson.videoUrl || ''}
                        onChange={(e) => handleUpdateSelectedLesson('videoUrl', e.target.value)}
                        placeholder="https://.../video.mp4"
                        className="text-xs font-mono bg-white"
                      />
                    </div>

                    {/* Timestamped Keynotes List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-800">
                          Timestamped Keynotes & Bookmarks ({selectedLesson.videoKeynotes?.length || 0})
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedLesson.videoKeynotes?.map((kn) => {
                          const mins = Math.floor(kn.timestampSeconds / 60);
                          const secs = kn.timestampSeconds % 60;
                          const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

                          return (
                            <div
                              key={kn.id}
                              className="p-2 rounded bg-white border flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                                  {formattedTime}
                                </span>
                                <div>
                                  <p className="font-semibold text-gray-900">{kn.title}</p>
                                  {kn.note && <p className="text-gray-500 text-[11px]">{kn.note}</p>}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteKeynote(kn.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}

                        {(!selectedLesson.videoKeynotes || selectedLesson.videoKeynotes.length === 0) && (
                          <p className="text-xs text-gray-400 italic">No timestamped keynotes added yet.</p>
                        )}
                      </div>

                      {/* Add Keynote row */}
                      <div className="pt-2 border-t flex flex-wrap gap-2 items-center">
                        <Input
                          type="number"
                          placeholder="Seconds"
                          value={keynoteTime}
                          onChange={(e) => setKeynoteTime(parseInt(e.target.value, 10) || 0)}
                          className="w-20 text-xs h-8 bg-white"
                          title="Timestamp in seconds"
                        />
                        <Input
                          placeholder="Keynote Title..."
                          value={keynoteTitle}
                          onChange={(e) => setKeynoteTitle(e.target.value)}
                          className="flex-1 min-w-[140px] text-xs h-8 bg-white"
                        />
                        <Input
                          placeholder="Pedagogical note (optional)..."
                          value={keynoteNote}
                          onChange={(e) => setKeynoteNote(e.target.value)}
                          className="flex-1 min-w-[140px] text-xs h-8 bg-white"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddKeynote}
                          className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Attach Keynote
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Markdown & LaTeX Lesson Content Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-800">
                      Lesson Body Content (Markdown & LaTeX Math $$...$$)
                    </label>
                    <span className="text-[11px] text-gray-400">Supports MathJax / KaTeX formulas</span>
                  </div>

                  <Textarea
                    rows={8}
                    value={selectedLesson.contentMarkdown}
                    onChange={(e) => handleUpdateSelectedLesson('contentMarkdown', e.target.value)}
                    placeholder="Enter lesson text, explanations, formulas ($$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$)..."
                    className="font-mono text-xs"
                  />
                </div>

                {/* Live Lesson Markdown Preview */}
                <div className="border rounded-lg p-4 bg-gray-50/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 border-b pb-1.5">
                    <Eye className="w-3.5 h-3.5" /> Content Live Preview
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-line text-xs font-sans">
                    {selectedLesson.contentMarkdown || '(No content written yet)'}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <span className="text-xs text-gray-500">Changes are automatically saved to your draft.</span>
                <Button size="sm" onClick={() => toast.success('Lesson saved to course draft!')} className="gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Save Lesson
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
              <FileText className="w-12 h-12 mb-3 stroke-[1.5]" />
              <p className="font-semibold text-base text-gray-600">No Lesson Selected</p>
              <p className="text-xs mt-1">Select a lesson from the curriculum outline on the left to edit its content.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
