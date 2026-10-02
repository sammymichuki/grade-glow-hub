import {
  PeerReviewAssignment,
  PeerReviewSubmission,
  PeerReviewEvaluation,
} from '@/shared/types/collaboration';
import {
  SAMPLE_PEER_REVIEW_ASSIGNMENTS,
  SAMPLE_PEER_SUBMISSIONS,
  SAMPLE_PEER_EVALUATIONS,
} from '../data/sampleCommunityData';

export interface ScoreAggregationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  criterionAverages: Record<string, { average: number; max: number; label: string }>;
  evaluationCount: number;
}

class PeerReviewService {
  private assignments: PeerReviewAssignment[] = [...SAMPLE_PEER_REVIEW_ASSIGNMENTS];
  private submissions: PeerReviewSubmission[] = [...SAMPLE_PEER_SUBMISSIONS];
  private evaluations: PeerReviewEvaluation[] = [...SAMPLE_PEER_EVALUATIONS];

  public getAssignments(courseId?: number): PeerReviewAssignment[] {
    if (courseId !== undefined) {
      return this.assignments.filter((a) => a.courseId === courseId);
    }
    return [...this.assignments];
  }

  public getAssignmentById(id: string): PeerReviewAssignment | undefined {
    return this.assignments.find((a) => a.id === id);
  }

  public getSubmissionsForAssignment(assignmentId: string): PeerReviewSubmission[] {
    return this.submissions.filter((s) => s.assignmentId === assignmentId);
  }

  public getEvaluationsForSubmission(submissionId: string): PeerReviewEvaluation[] {
    return this.evaluations.filter(
      (e) => e.submissionId === submissionId && e.status === 'submitted'
    );
  }

  public getMyAssignedReviews(
    reviewerId: string,
    assignmentId?: string
  ): Array<{ submission: PeerReviewSubmission; evaluation?: PeerReviewEvaluation }> {
    let targetSubs = this.submissions;
    if (assignmentId) {
      targetSubs = targetSubs.filter((s) => s.assignmentId === assignmentId);
    }

    // Exclude student's own submission to guarantee double-blind peer review
    const peerSubs = targetSubs.filter((s) => s.studentId !== reviewerId);

    return peerSubs.map((sub) => {
      const evaluation = this.evaluations.find(
        (e) => e.submissionId === sub.id && e.reviewerId === reviewerId
      );
      return { submission: sub, evaluation };
    });
  }

  public submitEvaluation(data: {
    assignmentId: string;
    submissionId: string;
    reviewerId: string;
    anonymousReviewerAlias: string;
    criterionScores: Record<string, number>;
    criterionFeedback: Record<string, string>;
    generalFeedback: string;
  }): PeerReviewEvaluation {
    const assignment = this.getAssignmentById(data.assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${data.assignmentId} not found.`);
    }

    // Validate that scores do not exceed criteria maximums
    for (const criterion of assignment.rubricCriteria) {
      const score = data.criterionScores[criterion.id];
      if (score === undefined || score < 0 || score > criterion.maxPoints) {
        throw new Error(
          `Invalid score for criterion "${criterion.name}". Must be between 0 and ${criterion.maxPoints}.`
        );
      }
    }

    const existingIndex = this.evaluations.findIndex(
      (e) => e.submissionId === data.submissionId && e.reviewerId === data.reviewerId
    );

    const evaluation: PeerReviewEvaluation = {
      id:
        existingIndex > -1
          ? this.evaluations[existingIndex].id
          : `eval-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      assignmentId: data.assignmentId,
      submissionId: data.submissionId,
      reviewerId: data.reviewerId,
      anonymousReviewerAlias: data.anonymousReviewerAlias,
      criterionScores: data.criterionScores,
      criterionFeedback: data.criterionFeedback,
      generalFeedback: data.generalFeedback,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    if (existingIndex > -1) {
      this.evaluations[existingIndex] = evaluation;
    } else {
      this.evaluations.push(evaluation);
    }

    return evaluation;
  }

  public calculateScoreAggregation(
    submissionId: string,
    assignmentId: string
  ): ScoreAggregationResult {
    const assignment = this.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found.`);
    }

    const evals = this.getEvaluationsForSubmission(submissionId);
    if (evals.length === 0) {
      const emptyAverages: Record<string, { average: number; max: number; label: string }> = {};
      assignment.rubricCriteria.forEach((c) => {
        emptyAverages[c.id] = { average: 0, max: c.maxPoints, label: c.name };
      });
      return {
        totalScore: 0,
        maxScore: assignment.totalPoints,
        percentage: 0,
        criterionAverages: emptyAverages,
        evaluationCount: 0,
      };
    }

    const criterionTotals: Record<string, number> = {};
    assignment.rubricCriteria.forEach((c) => {
      criterionTotals[c.id] = 0;
    });

    evals.forEach((ev) => {
      assignment.rubricCriteria.forEach((c) => {
        const score = ev.criterionScores[c.id] || 0;
        criterionTotals[c.id] += score;
      });
    });

    const criterionAverages: Record<string, { average: number; max: number; label: string }> = {};
    let totalScore = 0;

    assignment.rubricCriteria.forEach((c) => {
      const avg = Number((criterionTotals[c.id] / evals.length).toFixed(1));
      criterionAverages[c.id] = {
        average: avg,
        max: c.maxPoints,
        label: c.name,
      };
      totalScore += avg;
    });

    totalScore = Number(totalScore.toFixed(1));
    const percentage = Number(((totalScore / assignment.totalPoints) * 100).toFixed(1));

    return {
      totalScore,
      maxScore: assignment.totalPoints,
      percentage,
      criterionAverages,
      evaluationCount: evals.length,
    };
  }

  public distributePeerReviews(
    submissions: PeerReviewSubmission[],
    reviewsPerStudent: number = 2
  ): Array<{ submissionId: string; reviewerStudentId: string; anonymousReviewerAlias: string }> {
    if (submissions.length <= 1) {
      return [];
    }

    const assignments: Array<{
      submissionId: string;
      reviewerStudentId: string;
      anonymousReviewerAlias: string;
    }> = [];

    const n = submissions.length;
    // Circular shift distribution: student i reviews submissions at (i + 1)%n, (i + 2)%n, etc.
    const actualK = Math.min(reviewsPerStudent, n - 1);

    submissions.forEach((reviewerSub, i) => {
      for (let step = 1; step <= actualK; step++) {
        const targetSub = submissions[(i + step) % n];
        assignments.push({
          submissionId: targetSub.id,
          reviewerStudentId: reviewerSub.studentId,
          anonymousReviewerAlias: `Peer Evaluator #${(i * 17 + step * 3) % 99 + 1}`,
        });
      }
    });

    return assignments;
  }

  public resetToDefaults(): void {
    this.assignments = [...SAMPLE_PEER_REVIEW_ASSIGNMENTS];
    this.submissions = [...SAMPLE_PEER_SUBMISSIONS];
    this.evaluations = [...SAMPLE_PEER_EVALUATIONS];
  }
}

export const peerReviewService = new PeerReviewService();
