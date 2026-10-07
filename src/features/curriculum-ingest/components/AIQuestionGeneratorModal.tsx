import React, { useState } from 'react';
import {
  FileQuestion,
  Sparkles,
  Layers,
  BookOpen,
  CheckCircle2,
  Trash2,
  Download,
  Plus,
  HelpCircle,
  X,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  RagService,
  SAMPLE_SYLLABUS_EXCERPTS,
} from '../services/ragService';
import {
  CurriculumStandard,
  BloomTaxonomyLevel,
  GeneratedQuestion,
  IngestionJob,
} from '../types/curriculumIngest';

interface AIQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToCourse?: (questions: GeneratedQuestion[]) => void;
}

export const AIQuestionGeneratorModal: React.FC<AIQuestionGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSaveToCourse,
}) => {
  const [selectedStandard, setSelectedStandard] = useState<CurriculumStandard>('KICD_CBC');
  const [subject, setSubject] = useState('Integrated Science');
  const [grade, setGrade] = useState(7);
  const [title, setTitle] = useState('Photosynthesis & Energy Transformations');
  const [notesText, setNotesText] = useState(SAMPLE_SYLLABUS_EXCERPTS[0].notes);
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ingestionJob, setIngestionJob] = useState<IngestionJob | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLoadSample = (index: number) => {
    const sample = SAMPLE_SYLLABUS_EXCERPTS[index];
    setSelectedStandard(sample.standard);
    setSubject(sample.subject);
    setGrade(sample.grade);
    setTitle(sample.title);
    setNotesText(sample.notes);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSavedSuccess(false);
    await new Promise(r => setTimeout(r, 500));
    const job = RagService.generateQuestionsFromText(
      title,
      subject,
      selectedStandard,
      grade,
      notesText,
      questionCount
    );
    setIngestionJob(job);
    setIsGenerating(false);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!ingestionJob) return;
    setIngestionJob({
      ...ingestionJob,
      generatedQuestions: ingestionJob.generatedQuestions.filter(q => q.id !== qId),
    });
  };

  const handleExportJSON = () => {
    if (!ingestionJob) return;
    const blob = new Blob([JSON.stringify(ingestionJob.generatedQuestions, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_quiz.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (!ingestionJob) return;
    if (onSaveToCourse) {
      onSaveToCourse(ingestionJob.generatedQuestions);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-education-primary p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold">RAG Curriculum Question Generator</h2>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                  Bloom's Taxonomy
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Ingest notes, syllabus frameworks, and generate calibrated K-12 assessments in seconds
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Controls & Ingestion Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Standard */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Curriculum Standard
              </label>
              <select
                value={selectedStandard}
                onChange={e => setSelectedStandard(e.target.value as CurriculumStandard)}
                className="w-full text-xs font-medium border border-gray-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="KICD_CBC">Kenya KICD CBC (Grades 4-9)</option>
                <option value="CAMBRIDGE_LOWER_SEC">Cambridge Lower Secondary</option>
                <option value="US_COMMON_CORE">US Common Core</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Grade & Question Count */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Grade</label>
                <input
                  type="number"
                  min={4}
                  max={9}
                  value={grade}
                  onChange={e => setGrade(Number(e.target.value))}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Count (3-10)</label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Preset Fill Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 font-semibold uppercase text-[10px]">Load Sample Notes:</span>
            {SAMPLE_SYLLABUS_EXCERPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadSample(idx)}
                className="px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors border border-purple-200"
              >
                {sample.subject} (Gr {sample.grade})
              </button>
            ))}
          </div>

          {/* Notes Input Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 block">
              Source Curriculum Notes / Textbook Passage
            </label>
            <textarea
              rows={5}
              value={notesText}
              onChange={e => setNotesText(e.target.value)}
              placeholder="Paste lecture transcript, syllabus standard, or lesson notes here..."
              className="w-full text-xs leading-relaxed text-gray-800 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono"
            />
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!notesText.trim() || isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm"
            >
              {isGenerating ? (
                <>Analyzing Chunks & Synthesizing...</>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate AI Assessment ({questionCount} Items)
                </>
              )}
            </Button>
          </div>

          {/* Generated Questions Preview */}
          {ingestionJob && (
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Generated Questions ({ingestionJob.generatedQuestions.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-1 text-[11px] text-gray-500">
                    <span className="font-semibold text-purple-700">Bloom's Balance:</span>
                    <span>Knowledge: {ingestionJob.bloomDistribution.knowledge}</span> &bull;
                    <span>Comprehension: {ingestionJob.bloomDistribution.comprehension}</span> &bull;
                    <span>Application: {ingestionJob.bloomDistribution.application}</span> &bull;
                    <span>Analysis: {ingestionJob.bloomDistribution.analysis}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportJSON}
                  className="text-xs text-gray-600"
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> Export JSON
                </Button>
              </div>

              {/* Question Cards */}
              <div className="space-y-3">
                {ingestionJob.generatedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white hover:border-purple-200 transition-all shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {q.bloomLevel}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            q.difficulty === 'Easy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.difficulty === 'Medium'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{q.syllabusRef}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Remove question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{q.question}</p>

                    {q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/60 font-medium text-emerald-950'
                                  : 'border-gray-200 bg-gray-50/50 text-gray-700'
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="p-2.5 rounded-lg bg-gray-50 text-[11px] text-gray-600 border border-gray-100">
                      <span className="font-semibold text-gray-700">Rationale: </span>
                      {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-gray-600">
            Cancel
          </Button>

          {ingestionJob && (
            <div className="flex items-center gap-2">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Added to Studio!
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-education-primary hover:bg-education-primary/90 text-white text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Save Questions to Studio
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIQuestionGeneratorModal;
