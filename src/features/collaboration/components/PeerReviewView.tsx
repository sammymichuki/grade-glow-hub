import React, { useState } from 'react';
import {
  PeerReviewAssignment,
  PeerReviewSubmission,
  PeerReviewEvaluation,
} from '@/shared/types/collaboration';
import { peerReviewService } from '../services/peerReviewService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BookCheck,
  Award,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Send,
  Eye,
  FileText,
} from 'lucide-react';

interface PeerReviewViewProps {
  currentStudentId?: string;
  courseId?: number;
}

export const PeerReviewView: React.FC<PeerReviewViewProps> = ({
  currentStudentId = 'STU-1001',
  courseId,
}) => {
  const assignments = peerReviewService.getAssignments(courseId);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    assignments[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'review-peers' | 'received-reviews'>(
    'review-peers'
  );

  const selectedAssignment: PeerReviewAssignment | undefined =
    assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];

  const assignedReviews = peerReviewService.getMyAssignedReviews(
    currentStudentId,
    selectedAssignment?.id
  );

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>(
    assignedReviews[0]?.submission.id || ''
  );

  const currentReviewItem = assignedReviews.find(
    (r) => r.submission.id === selectedSubmissionId
  ) || assignedReviews[0];

  // Scoring state for current active review
  const [scores, setScores] = useState<Record<string, number>>({});
  const [criterionNotes, setCriterionNotes] = useState<Record<string, string>>({});
  const [generalComments, setGeneralComments] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState<boolean>(false);

  // Sync state if already evaluated
  React.useEffect(() => {
    if (currentReviewItem?.evaluation) {
      setScores(currentReviewItem.evaluation.criterionScores);
      setCriterionNotes(currentReviewItem.evaluation.criterionFeedback);
      setGeneralComments(currentReviewItem.evaluation.generalFeedback);
      setSubmittedStatus(true);
    } else {
      setScores({});
      setCriterionNotes({});
      setGeneralComments('');
      setSubmittedStatus(false);
    }
  }, [selectedSubmissionId, currentReviewItem]);

  const handleScoreSelect = (criterionId: string, points: number) => {
    if (submittedStatus) return;
    setScores((prev) => ({ ...prev, [criterionId]: points }));
  };

  const handleNoteChange = (criterionId: string, note: string) => {
    if (submittedStatus) return;
    setCriterionNotes((prev) => ({ ...prev, [criterionId]: note }));
  };

  const totalCalculatedScore = Object.values(scores).reduce(
    (sum, val) => sum + val,
    0
  );

  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !currentReviewItem) return;

    // Verify all criteria are scored
    for (const c of selectedAssignment.rubricCriteria) {
      if (scores[c.id] === undefined) {
        alert(`Please select a score level for "${c.name}"`);
        return;
      }
    }

    peerReviewService.submitEvaluation({
      assignmentId: selectedAssignment.id,
      submissionId: currentReviewItem.submission.id,
      reviewerId: currentStudentId,
      anonymousReviewerAlias: 'Peer Evaluator #42',
      criterionScores: scores,
      criterionFeedback: criterionNotes,
      generalFeedback: generalComments,
    });

    setSubmittedStatus(true);
  };

  // Received reviews data
  const mySubmissions = peerReviewService
    .getSubmissionsForAssignment(selectedAssignment?.id || '')
    .filter((s) => s.studentId === currentStudentId);

  const firstMySub = mySubmissions[0];
  const receivedAggregation = firstMySub && selectedAssignment
    ? peerReviewService.calculateScoreAggregation(
        firstMySub.id,
        selectedAssignment.id
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-education-primary">
              Peer Learning & Feedback
            </span>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
              Double-Blind Review Active
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Anonymous Peer Review Studio
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Critique classmate projects using standardized rubrics to sharpen evaluation skills
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <Button
            size="sm"
            variant={activeTab === 'review-peers' ? 'default' : 'ghost'}
            className={`text-xs h-8 ${
              activeTab === 'review-peers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('review-peers')}
          >
            <BookCheck className="w-3.5 h-3.5 mr-1.5" /> Assigned Reviews ({assignedReviews.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'received-reviews' ? 'default' : 'ghost'}
            className={`text-xs h-8 ${
              activeTab === 'received-reviews' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('received-reviews')}
          >
            <Award className="w-3.5 h-3.5 mr-1.5" /> My Feedback Report
          </Button>
        </div>
      </div>

      {/* Assignment Picker */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {assignments.map((assignment) => (
          <button
            key={assignment.id}
            type="button"
            onClick={() => {
              setSelectedAssignmentId(assignment.id);
            }}
            className={`p-3 rounded-lg border text-left shrink-0 transition-all ${
              selectedAssignment?.id === assignment.id
                ? 'bg-education-primary/5 border-education-primary ring-1 ring-education-primary/20'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="text-xs font-semibold text-education-primary">
              {assignment.courseName}
            </div>
            <div className="text-sm font-bold text-gray-900 line-clamp-1">
              {assignment.title}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              Review Due: {new Date(assignment.reviewDeadline).toLocaleDateString()} • {assignment.totalPoints} pts
            </div>
          </button>
        ))}
      </div>

      {activeTab === 'review-peers' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submissions Queue */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Assigned Peer Works
            </h3>

            {assignedReviews.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border text-center text-gray-500">
                <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">No assigned reviews remaining</p>
              </div>
            ) : (
              assignedReviews.map(({ submission, evaluation }) => {
                const isSelected = selectedSubmissionId === submission.id;
                const isCompleted = evaluation !== undefined;

                return (
                  <div
                    key={submission.id}
                    onClick={() => setSelectedSubmissionId(submission.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-education-primary bg-white shadow-sm ring-2 ring-education-primary/10'
                        : 'bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-education-primary">
                        {submission.anonymousAlias}
                      </span>
                      {isCompleted ? (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] gap-1">
                          <CheckCircle className="w-3 h-3" /> Submitted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-[10px]">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-bold text-gray-900 mt-1 line-clamp-1">
                      {submission.title}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Review Workspace */}
          <div className="lg:col-span-8 space-y-6">
            {currentReviewItem ? (
              <>
                {/* Submission Reader Card */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-education-primary">
                          {currentReviewItem.submission.anonymousAlias}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-gray-500">
                          Double-Blind Redacted
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900 mt-1">
                        {currentReviewItem.submission.title}
                      </CardTitle>
                    </div>
                    <FileText className="w-6 h-6 text-gray-400" />
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-xs leading-relaxed text-gray-800 border whitespace-pre-line font-mono">
                      {currentReviewItem.submission.content}
                    </div>
                  </CardContent>
                </Card>

                {/* Rubric Evaluation Form */}
                <Card className="shadow-sm border-education-primary/20">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-gray-900">
                        Peer Scoring Rubric & Feedback Matrix
                      </CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Assign points for each learning objective and provide constructive notes
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Total Score</span>
                      <span className="text-xl font-bold text-education-primary">
                        {totalCalculatedScore} / {selectedAssignment?.totalPoints}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-6">
                    {selectedAssignment?.rubricCriteria.map((criterion) => {
                      const selectedScore = scores[criterion.id];

                      return (
                        <div
                          key={criterion.id}
                          className="p-4 rounded-lg border bg-white space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900">
                                {criterion.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {criterion.description}
                              </p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-700">
                              Max {criterion.maxPoints} pts
                            </span>
                          </div>

                          {/* Level Pills */}
                          <div className="grid grid-cols-3 gap-2">
                            {criterion.levels.map((level) => {
                              const isLevelSelected = selectedScore === level.points;

                              return (
                                <button
                                  key={level.points}
                                  type="button"
                                  disabled={submittedStatus}
                                  onClick={() => handleScoreSelect(criterion.id, level.points)}
                                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                                    isLevelSelected
                                      ? 'bg-education-primary/10 border-education-primary text-education-primary font-semibold ring-1 ring-education-primary'
                                      : 'hover:bg-gray-50 text-gray-700'
                                  } ${submittedStatus ? 'cursor-not-allowed opacity-90' : ''}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold">{level.label}</span>
                                    <span>{level.points} pts</span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                                    {level.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>

                          {/* Inline Feedback per Criterion */}
                          <div>
                            <input
                              type="text"
                              disabled={submittedStatus}
                              placeholder={`Constructive note on ${criterion.name.toLowerCase()}...`}
                              value={criterionNotes[criterion.id] || ''}
                              onChange={(e) => handleNoteChange(criterion.id, e.target.value)}
                              className="w-full h-8 px-3 text-xs border rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-education-primary"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Overall Synthesis Feedback */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        Overall Synthesis & Next Steps
                      </label>
                      <Textarea
                        disabled={submittedStatus}
                        placeholder="Highlight 2 key strengths of this work, and 1 specific actionable area for growth..."
                        rows={3}
                        value={generalComments}
                        onChange={(e) => setGeneralComments(e.target.value)}
                        className="text-xs"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Submitted anonymously to author</span>
                      </div>

                      {submittedStatus ? (
                        <Badge className="bg-emerald-600 text-white text-xs py-1 px-3 gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Review Completed
                        </Badge>
                      ) : (
                        <Button
                          onClick={handleSubmitEvaluation}
                          className="bg-education-primary hover:bg-education-primary/90 text-white text-xs h-9 gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit Peer Evaluation
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
                <HelpCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">No submission selected</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Received Reviews Tab */
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Peer Review Synthesis on Your Submission
              </h2>
              <p className="text-xs text-gray-500">
                Aggregated scores from assigned peer evaluators in your cohort
              </p>
            </div>
            {receivedAggregation && (
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Classmate Consensus Score</span>
                <span className="text-2xl font-bold text-education-primary">
                  {receivedAggregation.totalScore} / {receivedAggregation.maxScore}
                </span>
                <span className="text-xs text-emerald-600 font-semibold block">
                  {receivedAggregation.percentage}% Mastery
                </span>
              </div>
            )}
          </div>

          {receivedAggregation && receivedAggregation.evaluationCount > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(receivedAggregation.criterionAverages).map(
                  ([critId, data]) => (
                    <div key={critId} className="p-4 rounded-lg border bg-gray-50/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800">{data.label}</span>
                        <span className="text-xs font-semibold text-education-primary">
                          {data.average} / {data.max} pts
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-education-primary h-full rounded-full transition-all"
                          style={{ width: `${(data.average / data.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                  Anonymous Qualitative Comments
                </h4>
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      Peer Evaluator Consensus
                    </Badge>
                    <span className="text-gray-400 text-[10px]">Double-blind verified</span>
                  </div>
                  <p className="leading-relaxed">
                    "Outstanding work overall! The scenario is practical and the algebraic
                    formulation fits the real data neatly."
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Eye className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold text-gray-700">Reviews in Progress</p>
              <p className="text-xs text-gray-400 mt-1">
                Your peers are currently reviewing your work. Results will appear once submitted.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
