import React, { useState } from 'react';
import {
  AssignmentSubmission,
  Rubric,
  RubricScoreItem,
} from '@/shared/types/instructor';
import { RubricService } from '../services/rubricService';
import { SAMPLE_ASSIGNMENT_SUBMISSIONS } from '../data/sampleSubmissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Award,
  Send,
  Plus,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export const RubricReviewerDrawer: React.FC = () => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>(SAMPLE_ASSIGNMENT_SUBMISSIONS);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string>(
    SAMPLE_ASSIGNMENT_SUBMISSIONS[0]?.id || ''
  );
  const [rubric] = useState<Rubric>(
    RubricService.getPresetRubrics()[0]
  );

  const activeSubmission = submissions.find((s) => s.id === activeSubmissionId);

  // Rubric scoring state for current active submission
  const [rubricSelections, setRubricSelections] = useState<Record<string, RubricScoreItem>>(
    activeSubmission?.rubricScores || {
      'crit-content': { levelId: 'lvl-c-4', pointsEarned: 4, feedback: 'Thorough and accurate.' },
      'crit-clarity': { levelId: 'lvl-l-3', pointsEarned: 3, feedback: 'Well structured.' },
      'crit-formatting': { levelId: 'lvl-f-4', pointsEarned: 4, feedback: 'Clear labels.' },
    }
  );
  const [teacherFeedback, setTeacherFeedback] = useState<string>(
    activeSubmission?.teacherFeedback || ''
  );

  // Annotation input state
  const [newAnnotationRef, setNewAnnotationRef] = useState('');
  const [newAnnotationComment, setNewAnnotationComment] = useState('');

  // Switch active submission
  const handleSelectSubmission = (sub: AssignmentSubmission) => {
    setActiveSubmissionId(sub.id);
    setRubricSelections(
      sub.rubricScores || {
        'crit-content': { levelId: 'lvl-c-3', pointsEarned: 3 },
        'crit-clarity': { levelId: 'lvl-l-3', pointsEarned: 3 },
        'crit-formatting': { levelId: 'lvl-f-3', pointsEarned: 3 },
      }
    );
    setTeacherFeedback(sub.teacherFeedback || '');
  };

  // Click on a rubric level cell
  const handleSelectLevel = (critId: string, levelId: string, points: number) => {
    setRubricSelections((prev) => ({
      ...prev,
      [critId]: {
        levelId,
        pointsEarned: points,
      },
    }));
  };

  // Add inline annotation
  const handleAddAnnotation = () => {
    if (!activeSubmission || !newAnnotationComment.trim()) {
      toast.error('Please enter an annotation comment.');
      return;
    }

    const updated = RubricService.addAnnotation(
      activeSubmission,
      newAnnotationRef.trim() || 'General',
      newAnnotationComment.trim(),
      'Instructor'
    );

    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setNewAnnotationRef('');
    setNewAnnotationComment('');
    toast.success('Annotation pinned to submission.');
  };

  // Finalize grading
  const handleFinalizeGrade = () => {
    if (!activeSubmission) return;

    const evaluated = RubricService.evaluateSubmission(
      activeSubmission,
      rubric,
      rubricSelections,
      teacherFeedback
    );

    setSubmissions((prev) => prev.map((s) => (s.id === evaluated.id ? evaluated : s)));
    toast.success(`Grade submitted for ${evaluated.studentName}: ${evaluated.grade}%`);
  };

  const calculatedScore = RubricService.calculateRubricScore(rubric, rubricSelections);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-education-primary">
            Grading & Rubric Reviewer
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Assignment Submissions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Evaluate homework submissions using multi-level matrix rubrics and inline annotations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 text-sm bg-blue-50 text-blue-800">
            {submissions.filter((s) => s.status === 'pending').length} Pending Review
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm bg-green-50 text-green-800">
            {submissions.filter((s) => s.status === 'graded').length} Graded
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Submissions Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Submissions Queue</CardTitle>
              <CardDescription>Select a student to evaluate</CardDescription>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-gray-100">
              {submissions.map((sub) => {
                const isSelected = sub.id === activeSubmissionId;
                const isGraded = sub.status === 'graded';

                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`p-4 cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'bg-education-primary/10 border-l-4 border-education-primary'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-sm text-gray-900">{sub.studentName}</span>
                      </div>
                      <p className="text-xs text-gray-500">{sub.assignmentTitle}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge
                        variant={isGraded ? 'default' : 'secondary'}
                        className={isGraded ? 'bg-green-600' : 'bg-amber-100 text-amber-800'}
                      >
                        {isGraded ? `${sub.grade}% (${RubricService.percentageToLetter(sub.grade || 0)})` : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Submission Content + Interactive Rubric (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeSubmission ? (
            <>
              {/* Student Submission Card */}
              <Card>
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-education-primary uppercase">
                      Student Work
                    </span>
                    <CardTitle className="text-lg">{activeSubmission.studentName}</CardTitle>
                    <CardDescription>{activeSubmission.studentEmail} • {activeSubmission.studentId}</CardDescription>
                  </div>
                  <Badge variant={activeSubmission.status === 'graded' ? 'default' : 'outline'}>
                    Status: {activeSubmission.status}
                  </Badge>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Submission Body */}
                  <div className="p-4 bg-gray-50 rounded-lg border font-mono text-xs whitespace-pre-wrap leading-relaxed text-gray-800 max-h-64 overflow-y-auto">
                    {activeSubmission.textSubmission}
                  </div>

                  {/* Inline Annotations List */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Margin Notes & Annotations ({activeSubmission.annotations?.length || 0})
                    </span>

                    <div className="space-y-1.5">
                      {activeSubmission.annotations?.map((ann) => (
                        <div key={ann.id} className="p-2.5 rounded bg-blue-50 border border-blue-200 text-xs flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-blue-900">[{ann.lineOrTimestamp}]</span>{' '}
                            <span className="text-gray-800">{ann.comment}</span>
                          </div>
                          <span className="text-[10px] text-blue-600 italic shrink-0">{ann.authorName}</span>
                        </div>
                      ))}
                    </div>

                    {/* Add Annotation Form */}
                    <div className="pt-2 flex gap-2">
                      <Input
                        placeholder="Ref (e.g. Line 4 or Step 2)..."
                        value={newAnnotationRef}
                        onChange={(e) => setNewAnnotationRef(e.target.value)}
                        className="w-36 text-xs h-8"
                      />
                      <Input
                        placeholder="Instructor comment..."
                        value={newAnnotationComment}
                        onChange={(e) => setNewAnnotationComment(e.target.value)}
                        className="flex-1 text-xs h-8"
                      />
                      <Button size="sm" onClick={handleAddAnnotation} className="h-8 text-xs gap-1">
                        <Plus className="w-3 h-3" /> Pin Note
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rubric Evaluation Matrix */}
              <Card className="border-education-primary/40 shadow-sm">
                <CardHeader className="bg-education-primary/5 pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-education-primary" />
                      <CardTitle className="text-lg">Grading Matrix: {rubric.title}</CardTitle>
                    </div>
                    <CardDescription>{rubric.description}</CardDescription>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-500">Projected Score</span>
                    <p className="text-2xl font-extrabold text-education-primary">
                      {calculatedScore.percentage}% ({calculatedScore.letterGrade})
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  {/* Rubric Criteria Rows */}
                  {rubric.criteria.map((crit) => {
                    const currentSelection = rubricSelections[crit.id];

                    return (
                      <div key={crit.id} className="border rounded-lg p-4 space-y-3 bg-white">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900">{crit.name}</h4>
                            <p className="text-xs text-gray-500">{crit.description}</p>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs">
                            Weight: {crit.weightPercentage}%
                          </Badge>
                        </div>

                        {/* Level Buttons Matrix */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {crit.levels.map((level) => {
                            const isSelected = currentSelection?.levelId === level.id;

                            return (
                              <button
                                key={level.id}
                                type="button"
                                onClick={() => handleSelectLevel(crit.id, level.id, level.points)}
                                className={`p-2.5 rounded-lg border text-left transition-all ${
                                  isSelected
                                    ? 'border-education-primary bg-education-primary text-white shadow-sm ring-2 ring-education-primary/30'
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-xs">{level.title}</span>
                                  <span className={`text-[11px] font-mono ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                                    {level.points} pts
                                  </span>
                                </div>
                                <p className={`text-[11px] leading-snug ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                  {level.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Teacher Feedback Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-800">
                      Overall Written Feedback to Student:
                    </label>
                    <Textarea
                      rows={3}
                      value={teacherFeedback}
                      onChange={(e) => setTeacherFeedback(e.target.value)}
                      placeholder="Praise strengths, highlight areas for improvement, and suggest further study..."
                      className="text-xs"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-4 bg-gray-50/50">
                  <div className="text-xs text-gray-600">
                    Total Rubric Points: <span className="font-bold text-gray-900">{calculatedScore.totalPoints} / {calculatedScore.maxPoints}</span>
                  </div>

                  <Button onClick={handleFinalizeGrade} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                    <FileCheck className="w-4 h-4" /> Finalize Grade & Return
                  </Button>
                </CardFooter>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-gray-400">
              <FileCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No submission selected.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
