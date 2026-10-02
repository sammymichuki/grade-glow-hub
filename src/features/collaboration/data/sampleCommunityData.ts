import {
  ForumThread,
  ForumReply,
  PeerReviewAssignment,
  PeerReviewSubmission,
  PeerReviewEvaluation,
  AppNotification,
} from '@/shared/types/collaboration';

export const SAMPLE_FORUM_THREADS: ForumThread[] = [
  {
    id: 'thread-1',
    courseId: 1,
    courseName: 'Mathematics: Foundations of Algebra',
    title: 'How do you determine the order of operations when negative signs precede brackets?',
    content:
      'In our lesson on algebraic expressions, problem 4 has `-(3 - 7)^2 + 5`. Some students calculated 21 and others -11. Could someone explain step by step why exponents take precedence over the outside negative sign?',
    author: {
      id: 'user-stu-1',
      name: 'Jane Doe',
      role: 'student',
      titleBadge: 'Grade 8 Scholar',
    },
    category: 'question',
    tags: ['algebra', 'order-of-operations', 'brackets', 'exponents'],
    createdAt: '2026-09-28T10:15:00Z',
    updatedAt: '2026-09-28T11:42:00Z',
    upvotes: 14,
    upvotedUserIds: ['user-stu-2', 'user-stu-3', 'user-teacher-1'],
    repliesCount: 3,
    viewsCount: 142,
    isPinned: true,
    isSolved: true,
    solvedReplyId: 'reply-1-1',
  },
  {
    id: 'thread-2',
    courseId: 1,
    courseName: 'Mathematics: Foundations of Algebra',
    title: 'Tips for memorizing the standard quadratic formula derivation',
    content:
      'Completing the square on `ax^2 + bx + c = 0` is tricky on step 3 when dividing by `a`. Does anyone have an intuitive mental diagram or memory trick for moving `c/a` across?',
    author: {
      id: 'user-stu-2',
      name: 'Marcus Vance',
      role: 'student',
      titleBadge: 'Math Enthusiast',
    },
    category: 'discussion',
    tags: ['quadratic', 'algebra', 'study-tips'],
    createdAt: '2026-09-29T14:30:00Z',
    updatedAt: '2026-09-29T16:00:00Z',
    upvotes: 9,
    upvotedUserIds: ['user-stu-1', 'user-stu-4'],
    repliesCount: 2,
    viewsCount: 98,
    isPinned: false,
    isSolved: false,
  },
  {
    id: 'thread-3',
    courseId: 2,
    courseName: 'General Science: Cells & Ecosystems',
    title: 'Upcoming Virtual Lab: Osmosis Egg Experiment Checklist',
    content:
      'Please ensure you have reviewed the Osmosis protocol before Friday. We will record egg mass changes after soaking in vinegar, distilled water, and corn syrup.',
    author: {
      id: 'user-teacher-1',
      name: 'Dr. Evelyn Reed',
      role: 'teacher',
      titleBadge: 'Lead Science Instructor',
    },
    category: 'announcement',
    tags: ['science', 'lab-protocol', 'biology', 'osmosis'],
    createdAt: '2026-09-30T08:00:00Z',
    updatedAt: '2026-09-30T08:00:00Z',
    upvotes: 22,
    upvotedUserIds: ['user-stu-1', 'user-stu-2', 'user-stu-3', 'user-stu-4'],
    repliesCount: 4,
    viewsCount: 230,
    isPinned: true,
    isSolved: false,
  },
  {
    id: 'thread-4',
    courseId: 3,
    courseName: 'English Literature & Creative Writing',
    title: 'Peer Review Rubric Clarification for Narrative Essay Opening',
    content:
      'For criterion 2 ("Sensory Imagery & Setting"), does metaphor count towards points if the sensory anchor is auditory rather than visual?',
    author: {
      id: 'user-stu-3',
      name: 'Amina Kimani',
      role: 'student',
      titleBadge: 'Creative Writing Lead',
    },
    category: 'question',
    tags: ['writing', 'rubric', 'peer-review'],
    createdAt: '2026-10-01T11:20:00Z',
    updatedAt: '2026-10-01T13:45:00Z',
    upvotes: 6,
    upvotedUserIds: ['user-stu-1'],
    repliesCount: 2,
    viewsCount: 65,
    isPinned: false,
    isSolved: true,
    solvedReplyId: 'reply-4-1',
  },
];

export const SAMPLE_FORUM_REPLIES: Record<string, ForumReply[]> = {
  'thread-1': [
    {
      id: 'reply-1-1',
      threadId: 'thread-1',
      author: {
        id: 'user-teacher-1',
        name: 'Dr. Evelyn Reed',
        role: 'teacher',
        titleBadge: 'Lead Instructor',
      },
      content:
        'Great question! Remember PEMDAS / BODMAS hierarchy: \n1. Parentheses first: `(3 - 7) = -4`.\n2. Exponents next: `(-4)^2 = +16`.\n3. The leading negative sign applies to the result: `-(+16) = -16`.\n4. Addition: `-16 + 5 = -11`.\nThe answer is strictly **-11** because exponentiation binds more tightly than the unary negative prefix outside the bracket!',
      createdAt: '2026-09-28T10:45:00Z',
      upvotes: 18,
      upvotedUserIds: ['user-stu-1', 'user-stu-2', 'user-stu-3'],
      isAcceptedSolution: true,
    },
    {
      id: 'reply-1-2',
      threadId: 'thread-1',
      author: {
        id: 'user-stu-2',
        name: 'Marcus Vance',
        role: 'student',
      },
      content:
        'That makes total sense now! I had distributed the negative before squaring which caused my error (+4)^2 = 16 then + 5 = 21. Thanks Dr. Reed!',
      createdAt: '2026-09-28T11:05:00Z',
      upvotes: 4,
      upvotedUserIds: ['user-stu-1'],
      isAcceptedSolution: false,
      parentReplyId: 'reply-1-1',
    },
    {
      id: 'reply-1-3',
      threadId: 'thread-1',
      author: {
        id: 'user-stu-4',
        name: 'Liam Chen',
        role: 'student',
      },
      content: 'Bookmarked this explanation. Will be super helpful for the module exam.',
      createdAt: '2026-09-28T11:42:00Z',
      upvotes: 2,
      upvotedUserIds: [],
      isAcceptedSolution: false,
    },
  ],
  'thread-2': [
    {
      id: 'reply-2-1',
      threadId: 'thread-2',
      author: {
        id: 'user-stu-1',
        name: 'Jane Doe',
        role: 'student',
      },
      content:
        'I use the box method for `(x + b/(2a))^2`! If you draw a 2x2 grid, you see clearly why `b^2 / (4a^2)` must be added to both sides.',
      createdAt: '2026-09-29T15:10:00Z',
      upvotes: 5,
      upvotedUserIds: ['user-stu-2'],
      isAcceptedSolution: false,
    },
  ],
  'thread-4': [
    {
      id: 'reply-4-1',
      threadId: 'thread-4',
      author: {
        id: 'user-teacher-2',
        name: 'Prof. Alistair Finch',
        role: 'teacher',
        titleBadge: 'Language Arts Head',
      },
      content:
        'Yes, absolutely! All five sensory modalities (auditory, olfactory, tactile, gustatory, visual) receive full credit under Setting & Imagery, provided they deepen reader immersion.',
      createdAt: '2026-10-01T12:00:00Z',
      upvotes: 7,
      upvotedUserIds: ['user-stu-3'],
      isAcceptedSolution: true,
    },
  ],
};

export const SAMPLE_PEER_REVIEW_ASSIGNMENTS: PeerReviewAssignment[] = [
  {
    id: 'pra-1',
    courseId: 1,
    courseName: 'Mathematics: Foundations of Algebra',
    title: 'Peer Review: Real-World Linear Modeling Essay',
    description:
      'Evaluate your peer’s real-world linear equation model. Verify equation formulation, table of values, graph interpretation, and contextual justification.',
    submissionDeadline: '2026-10-04T23:59:00Z',
    reviewDeadline: '2026-10-07T23:59:00Z',
    reviewsRequiredPerStudent: 2,
    totalPoints: 20,
    rubricCriteria: [
      {
        id: 'crit-math-1',
        name: 'Model Formulation & Variables',
        description: 'Independent (x) and dependent (y) variables correctly identified with units.',
        maxPoints: 5,
        levels: [
          { points: 5, label: 'Exemplary', description: 'Variables and constants impeccably defined.' },
          { points: 3, label: 'Proficient', description: 'Variables defined, minor unit ambiguity.' },
          { points: 1, label: 'Emerging', description: 'Variables incorrectly labeled or missing.' },
        ],
      },
      {
        id: 'crit-math-2',
        name: 'Slope & Y-Intercept Interpretation',
        description: 'Physical meaning of rate of change (slope) and initial condition (y-intercept) explained.',
        maxPoints: 5,
        levels: [
          { points: 5, label: 'Exemplary', description: 'In-depth real-world translation with precise units.' },
          { points: 3, label: 'Proficient', description: 'Basic conceptual meaning captured.' },
          { points: 1, label: 'Emerging', description: 'Confuses slope with initial value.' },
        ],
      },
      {
        id: 'crit-math-3',
        name: 'Graphing & Predictive Accuracy',
        description: 'Correct axes scaling, plotted coordinates, and interpolation calculations.',
        maxPoints: 5,
        levels: [
          { points: 5, label: 'Exemplary', description: 'Flawless calculations and clear visual labeling.' },
          { points: 3, label: 'Proficient', description: 'Minor calculation error in projection.' },
          { points: 1, label: 'Emerging', description: 'Incorrect trend line or missing coordinates.' },
        ],
      },
      {
        id: 'crit-math-4',
        name: 'Constructive Feedback & Clarity',
        description: 'Actionable suggestions provided with encouraging tone.',
        maxPoints: 5,
        levels: [
          { points: 5, label: 'Exemplary', description: 'Deep insight with constructive suggestions.' },
          { points: 3, label: 'Proficient', description: 'Generic praise with limited specifics.' },
          { points: 1, label: 'Emerging', description: 'Dismissive or single-sentence remark.' },
        ],
      },
    ],
  },
  {
    id: 'pra-2',
    courseId: 3,
    courseName: 'English Literature & Creative Writing',
    title: 'Peer Review: Short Story Climax & Conflict Resolution',
    description:
      'Provide constructive feedback on character arc progression, pacing of tension, and dialogue formatting.',
    submissionDeadline: '2026-10-06T23:59:00Z',
    reviewDeadline: '2026-10-09T23:59:00Z',
    reviewsRequiredPerStudent: 2,
    totalPoints: 15,
    rubricCriteria: [
      {
        id: 'crit-lit-1',
        name: 'Pacing & Narrative Tension',
        description: 'Climax builds tension organically without abrupt jumps.',
        maxPoints: 5,
        levels: [
          { points: 5, label: 'Exemplary', description: 'Masterful suspense and vivid sensory beats.' },
          { points: 3, label: 'Proficient', description: 'Good buildup, pacing slightly rushed.' },
          { points: 1, label: 'Emerging', description: 'Plot resolved without organic climax.' },
        ],
      },
      {
        id: 'crit-lit-2',
        name: 'Character Voice & Dialogue Mechanics',
        description: 'Accurate quotation punctuation, distinct speech patterns.',
        maxPoints: 5,
        levels: [
          { points: 5, label: 'Exemplary', description: 'Polished formatting and authentic voice.' },
          { points: 3, label: 'Proficient', description: 'Minor comma splice in dialogue tags.' },
          { points: 1, label: 'Emerging', description: 'Unformatted dialogue blocks.' },
        ],
      },
      {
        id: 'crit-lit-3',
        name: 'Theme & Resolution',
        description: 'Resolution delivers thematic resonance consistent with character motives.',
        maxPoints: 5,
        levels: [
          { points: 5, label: 'Exemplary', description: 'Emotionally compelling and complete.' },
          { points: 3, label: 'Proficient', description: 'Satisfying ending, minor loose threads.' },
          { points: 1, label: 'Emerging', description: 'Abrupt ending lacking closure.' },
        ],
      },
    ],
  },
];

export const SAMPLE_PEER_SUBMISSIONS: PeerReviewSubmission[] = [
  {
    id: 'sub-peer-101',
    assignmentId: 'pra-1',
    studentId: 'STU-1002',
    studentName: 'Marcus Vance',
    anonymousAlias: 'Author Orion #49',
    title: 'Solar Panel Energy Generation Model',
    content:
      '**Real-World Scenario:**\nA household installs a 5 kW rooftop photovoltaic system. Energy output is modeled by `E(t) = 4.2t + 1.5`, where `t` represents hours of peak daylight and `E` is kWh generated.\n\n**1. Slope Interpretation:**\nThe slope `m = 4.2` means that for each additional hour of peak sunshine, the solar array produces 4.2 kilowatt-hours of clean electricity.\n\n**2. Y-Intercept Interpretation:**\nThe y-intercept `(0, 1.5)` indicates residual ambient generation from dawn twilight before direct solar noon rays strike the panels.\n\n**3. Projection:**\nOn a bright summer day with 8.5 hours of sunlight:\n`E(8.5) = 4.2(8.5) + 1.5 = 35.7 + 1.5 = 37.2 kWh`.\nThis covers 124% of typical daily household electricity requirements.',
    submittedAt: '2026-10-01T15:20:00Z',
  },
  {
    id: 'sub-peer-102',
    assignmentId: 'pra-1',
    studentId: 'STU-1003',
    studentName: 'Amina Kimani',
    anonymousAlias: 'Author Lyra #18',
    title: 'Cellular Data Subscription Cost Comparison',
    content:
      '**Real-World Scenario:**\nComparing two wireless plans: Plan Alpha charges $20 base plus $5/GB (`C_A = 5g + 20`), while Plan Beta charges $35 base plus $2/GB (`C_B = 2g + 35`).\n\n**Break-Even Calculation:**\nSetting `5g + 20 = 2g + 35`:\n`3g = 15 => g = 5 GB`.\nFor less than 5 GB, Plan Alpha is more economical. Beyond 5 GB, Plan Beta saves money.',
    submittedAt: '2026-10-01T17:45:00Z',
  },
];

export const SAMPLE_PEER_EVALUATIONS: PeerReviewEvaluation[] = [
  {
    id: 'eval-1',
    assignmentId: 'pra-1',
    submissionId: 'sub-peer-101',
    reviewerId: 'STU-1001',
    anonymousReviewerAlias: 'Reviewer Phoenix #88',
    criterionScores: {
      'crit-math-1': 5,
      'crit-math-2': 5,
      'crit-math-3': 5,
      'crit-math-4': 4,
    },
    criterionFeedback: {
      'crit-math-1': 'Clear definition of kWh and daylight hours with proper metric notation.',
      'crit-math-2': 'Great explanation of ambient twilight generation at the intercept.',
      'crit-math-3': 'Calculations are 100% accurate, and the percentage comparison is a great touch.',
      'crit-math-4': 'Could have included a small sketch or graph table.',
    },
    generalFeedback:
      'Outstanding work overall! The solar array scenario is practical and the linear equation fits the real data neatly.',
    status: 'submitted',
    submittedAt: '2026-10-02T09:30:00Z',
  },
];

export const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'current-user',
    type: 'forum_reply',
    title: 'Dr. Evelyn Reed replied to your question',
    message: 'Your thread "Order of operations with negative signs" received an instructor solution.',
    linkUrl: '/community?thread=thread-1',
    isRead: false,
    createdAt: '2026-09-28T10:45:00Z',
    priority: 'high',
  },
  {
    id: 'notif-2',
    userId: 'current-user',
    type: 'peer_review_assigned',
    title: 'New Peer Review Assigned',
    message: 'You have been assigned to evaluate "Author Orion #49" for Linear Modeling.',
    linkUrl: '/community?tab=peer-review',
    isRead: false,
    createdAt: '2026-10-01T16:00:00Z',
    priority: 'normal',
  },
  {
    id: 'notif-3',
    userId: 'current-user',
    type: 'grade_posted',
    title: 'Gradebook Updated',
    message: 'Module 1 Quiz scores have been posted to your academic transcript.',
    linkUrl: '/grades',
    isRead: true,
    createdAt: '2026-09-29T18:00:00Z',
    priority: 'normal',
  },
  {
    id: 'notif-4',
    userId: 'current-user',
    type: 'announcement',
    title: 'Virtual Science Lab Friday',
    message: 'Review the Osmosis egg protocol before class at 10:00 AM.',
    linkUrl: '/community?thread=thread-3',
    isRead: true,
    createdAt: '2026-09-30T08:00:00Z',
    priority: 'low',
  },
];
