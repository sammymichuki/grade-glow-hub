import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Tag,
  Highlighter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EssayEvaluatorService,
  SAMPLE_STUDENT_ESSAYS,
} from '../services/essayEvaluatorService';
import {
  EssayEvaluationResult,
  EssayAnnotation,
} from '../types/aiTutor';

export const AIEssayFeedbackViewer: React.FC = () => {
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [essayTitle, setEssayTitle] = useState(SAMPLE_STUDENT_ESSAYS[0].title);
  const [essayText, setEssayText] = useState(SAMPLE_STUDENT_ESSAYS[0].text);
  const [evaluation, setEvaluation] = useState<EssayEvaluationResult | null>(() =>
    EssayEvaluatorService.evaluateEssay(SAMPLE_STUDENT_ESSAYS[0].title, SAMPLE_STUDENT_ESSAYS[0].text)
  );
  const [activeAnnotation, setActiveAnnotation] = useState<EssayAnnotation | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleSelectSample = (idx: number) => {
    const sample = SAMPLE_STUDENT_ESSAYS[idx];
    setSelectedSampleIndex(idx);
    setEssayTitle(sample.title);
    setEssayText(sample.text);
    const result = EssayEvaluatorService.evaluateEssay(sample.title, sample.text);
    setEvaluation(result);
    setActiveAnnotation(result.annotations[0] || null);
  };

  const handleAnalyze = async () => {
    setIsEvaluating(true);
    await new Promise(r => setTimeout(r, 400));
    const result = EssayEvaluatorService.evaluateEssay(essayTitle, essayText);
    setEvaluation(result);
    setActiveAnnotation(result.annotations[0] || null);
    setIsEvaluating(false);
  };

  const filteredAnnotations = evaluation?.annotations.filter(ann => {
    if (filterCategory === 'all') return true;
    return ann.category === filterCategory;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Sample Presets */}
      <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">AI Essay & Open-Response Evaluator</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Rubric-driven syntactic, thesis, and evidence analysis aligned with KICD CBC & Cambridge standards
          </p>
        </div>

        {/* Sample preset buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Presets:</span>
          {SAMPLE_STUDENT_ESSAYS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selectedSampleIndex === idx
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {sample.subject} (Gr {sample.grade})
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Essay Text Input & Annotations */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Essay Draft Content
              </label>
              <div className="text-xs text-gray-500">
                {essayText.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            <input
              type="text"
              value={essayTitle}
              onChange={e => setEssayTitle(e.target.value)}
              placeholder="Essay Title..."
              className="w-full text-base font-bold text-gray-900 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <textarea
              rows={9}
              value={essayText}
              onChange={e => setEssayText(e.target.value)}
              placeholder="Paste or write student essay response here..."
              className="w-full text-sm leading-relaxed text-gray-800 p-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-sans"
            />

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEssayTitle('');
                  setEssayText('');
                  setEvaluation(null);
                  setActiveAnnotation(null);
                }}
                className="text-xs text-gray-500"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>

              <Button
                onClick={handleAnalyze}
                disabled={!essayText.trim() || isEvaluating}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm"
              >
                {isEvaluating ? (
                  <>Evaluating Rubric...</>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Analyze with AI Rubric
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Interactive Annotation Markup View */}
          {evaluation && (
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Highlighter className="h-4 w-4 text-purple-600" />
                  Inline Socratic Markup & Highlights
                </h3>
                {/* Category filters */}
                <div className="flex space-x-1">
                  {['all', 'thesis', 'structure', 'evidence', 'grammar', 'vocabulary'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterCategory(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium transition-colors ${
                        filterCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Annotation Chips List */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredAnnotations.map(ann => {
                  const isSelected = activeAnnotation?.id === ann.id;
                  const badgeBg =
                    ann.category === 'thesis'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : ann.category === 'evidence'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : ann.category === 'structure'
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : ann.category === 'grammar'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-indigo-100 text-indigo-800 border-indigo-300';

                  return (
                    <div
                      key={ann.id}
                      onClick={() => setActiveAnnotation(ann)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/40 shadow-sm'
                          : 'border-gray-100 hover:border-gray-300 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeBg}`}>
                          {ann.category}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          "{ann.highlightedText.slice(0, 35)}..."
                        </span>
                      </div>
                      <p className="text-gray-800 font-medium">{ann.comment}</p>
                      {ann.suggestedReplacement && (
                        <p className="mt-1 text-[11px] text-purple-700 font-semibold">
                          💡 Suggestion: Replace with "{ann.suggestedReplacement}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scorecard, Rubric Metrics & Remediation */}
        <div className="lg:col-span-5 space-y-4">
          {evaluation ? (
            <>
              {/* Overall Score Card */}
              <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-education-primary rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-purple-200 font-semibold">
                      Automated Assessment
                    </span>
                    <h3 className="text-3xl font-extrabold mt-0.5 flex items-center gap-2">
                      {evaluation.overallScore}%
                      <span className="text-lg font-bold bg-white/20 px-2.5 py-0.5 rounded-lg">
                        Grade {evaluation.letterGrade}
                      </span>
                    </h3>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Award className="h-8 w-8 text-amber-300" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 text-center">
                  <div>
                    <p className="text-[10px] text-purple-200">Word Count</p>
                    <p className="font-bold text-sm">{evaluation.wordCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-200">Readability</p>
                    <p className="font-bold text-sm">{evaluation.readabilityGrade}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-200">Avg Sentence</p>
                    <p className="font-bold text-sm">{evaluation.avgSentenceLength} wds</p>
                  </div>
                </div>
              </div>

              {/* Rubric Criteria Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  CBC Rubric Breakdown
                </h3>

                <div className="space-y-3">
                  {evaluation.rubricCriteria.map(crit => {
                    const pct = Math.round((crit.score / crit.maxScore) * 100);
                    return (
                      <div key={crit.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-gray-700">
                          <span>{crit.name}</span>
                          <span className="text-purple-700">
                            {crit.score} / {crit.maxScore} pts ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              pct >= 85 ? 'bg-emerald-500' : pct >= 70 ? 'bg-purple-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-gray-500">{crit.feedback}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Growth Areas */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Pedagogical Insights
                </h3>

                <div className="space-y-2">
                  {evaluation.strengths.map((str, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span>{str}</span>
                    </div>
                  ))}

                  {evaluation.growthAreas.map((gr, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="text-amber-500 font-bold mt-0.5">▲</span>
                      <span>{gr}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Mini-Lessons */}
              <div className="bg-purple-50/60 rounded-2xl p-5 border border-purple-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-purple-900 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-purple-700" />
                  Recommended Mini-Lessons
                </h3>
                <div className="space-y-2">
                  {evaluation.recommendedMiniLessons.map(lesson => (
                    <div
                      key={lesson.id}
                      className="p-2.5 rounded-xl bg-white border border-purple-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{lesson.title}</p>
                        <p className="text-[11px] text-gray-500">{lesson.subject}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-purple-600" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-8 border border-dashed border-gray-300 text-center space-y-2 text-gray-400">
              <FileText className="h-10 w-10 mx-auto text-gray-300" />
              <p className="text-sm font-medium">Ready for Essay Input</p>
              <p className="text-xs">
                Select a preset or paste student composition text to generate rubric feedback.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIEssayFeedbackViewer;
