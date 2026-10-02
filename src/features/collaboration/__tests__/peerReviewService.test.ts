import { describe, it, expect, beforeEach } from 'vitest';
import { peerReviewService } from '../services/peerReviewService';

describe('peerReviewService', () => {
  beforeEach(() => {
    peerReviewService.resetToDefaults();
  });

  it('fetches peer review assignments', () => {
    const assignments = peerReviewService.getAssignments();
    expect(assignments.length).toBeGreaterThan(0);
    expect(assignments[0]).toHaveProperty('rubricCriteria');
    expect(assignments[0].rubricCriteria.length).toBeGreaterThan(0);
  });

  it('filters assignments by course ID', () => {
    const course1Assignments = peerReviewService.getAssignments(1);
    expect(course1Assignments.every((a) => a.courseId === 1)).toBe(true);
  });

  it('distributes submissions to peers using circular rotation', () => {
    const dummySubs = [
      { id: 'sub-1', assignmentId: 'a1', studentId: 's1', anonymousAlias: 'A1', title: 'T1', content: 'C1', submittedAt: '' },
      { id: 'sub-2', assignmentId: 'a1', studentId: 's2', anonymousAlias: 'A2', title: 'T2', content: 'C2', submittedAt: '' },
      { id: 'sub-3', assignmentId: 'a1', studentId: 's3', anonymousAlias: 'A3', title: 'T3', content: 'C3', submittedAt: '' },
    ];

    const distribution = peerReviewService.distributePeerReviews(dummySubs, 2);
    expect(distribution.length).toBe(6); // 3 students * 2 reviews each

    // Check no student reviews their own work
    distribution.forEach((dist) => {
      const target = dummySubs.find((s) => s.id === dist.submissionId);
      expect(dist.reviewerStudentId).not.toBe(target?.studentId);
    });
  });

  it('allows submitting an evaluation and saves scores', () => {
    const assignment = peerReviewService.getAssignments()[0];
    const submission = peerReviewService.getSubmissionsForAssignment(assignment.id)[0];

    const scores: Record<string, number> = {};
    const feedback: Record<string, string> = {};
    assignment.rubricCriteria.forEach((c) => {
      scores[c.id] = c.maxPoints;
      feedback[c.id] = 'Very clear demonstration.';
    });

    const evalResult = peerReviewService.submitEvaluation({
      assignmentId: assignment.id,
      submissionId: submission.id,
      reviewerId: 'STU-9999',
      anonymousReviewerAlias: 'Reviewer Test #1',
      criterionScores: scores,
      criterionFeedback: feedback,
      generalFeedback: 'Great effort across the board!',
    });

    expect(evalResult.id).toBeDefined();
    expect(evalResult.status).toBe('submitted');

    const evals = peerReviewService.getEvaluationsForSubmission(submission.id);
    expect(evals.some((e) => e.reviewerId === 'STU-9999')).toBe(true);
  });

  it('validates that criterion scores do not exceed maximum points', () => {
    const assignment = peerReviewService.getAssignments()[0];
    const submission = peerReviewService.getSubmissionsForAssignment(assignment.id)[0];

    const invalidScores: Record<string, number> = {};
    assignment.rubricCriteria.forEach((c) => {
      invalidScores[c.id] = c.maxPoints + 10; // invalid!
    });

    expect(() =>
      peerReviewService.submitEvaluation({
        assignmentId: assignment.id,
        submissionId: submission.id,
        reviewerId: 'STU-9999',
        anonymousReviewerAlias: 'Reviewer Test #1',
        criterionScores: invalidScores,
        criterionFeedback: {},
        generalFeedback: 'test',
      })
    ).toThrow();
  });

  it('calculates score aggregation across multiple peer evaluations', () => {
    const assignment = peerReviewService.getAssignments()[0];
    const submission = peerReviewService.getSubmissionsForAssignment(assignment.id)[0];

    const agg = peerReviewService.calculateScoreAggregation(
      submission.id,
      assignment.id
    );

    expect(agg.maxScore).toBe(assignment.totalPoints);
    expect(agg.evaluationCount).toBeGreaterThanOrEqual(1);
    expect(agg.percentage).toBeGreaterThan(0);
    expect(agg.percentage).toBeLessThanOrEqual(100);
  });
});
