export type ForumCategory = 'all' | 'question' | 'discussion' | 'announcement' | 'resource';

export type UserRole = 'student' | 'teacher' | 'ta' | 'admin' | 'parent';

export interface AuthorRef {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  titleBadge?: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  author: AuthorRef;
  content: string;
  createdAt: string;
  upvotes: number;
  upvotedUserIds: string[];
  isAcceptedSolution: boolean;
  parentReplyId?: string;
}

export interface ForumThread {
  id: string;
  courseId?: number;
  courseName?: string;
  title: string;
  content: string;
  author: AuthorRef;
  category: ForumCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  upvotedUserIds: string[];
  repliesCount: number;
  viewsCount: number;
  isPinned: boolean;
  isSolved: boolean;
  solvedReplyId?: string;
}

export interface RubricLevel {
  points: number;
  label: string;
  description: string;
}

export interface PeerRubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface PeerReviewAssignment {
  id: string;
  courseId: number;
  courseName: string;
  title: string;
  description: string;
  submissionDeadline: string;
  reviewDeadline: string;
  rubricCriteria: PeerRubricCriterion[];
  totalPoints: number;
  reviewsRequiredPerStudent: number;
}

export interface PeerReviewSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  anonymousAlias: string;
  title: string;
  content: string;
  submittedAt: string;
  attachmentUrl?: string;
}

export interface PeerReviewEvaluation {
  id: string;
  assignmentId: string;
  submissionId: string;
  reviewerId: string;
  anonymousReviewerAlias: string;
  criterionScores: Record<string, number>;
  criterionFeedback: Record<string, string>;
  generalFeedback: string;
  status: 'draft' | 'submitted';
  submittedAt?: string;
}

export type NotificationType =
  | 'forum_reply'
  | 'peer_review_assigned'
  | 'peer_review_received'
  | 'grade_posted'
  | 'announcement'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'normal' | 'high';
}
