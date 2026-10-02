import { AssignmentSubmission } from '@/shared/types/instructor';

export const SAMPLE_ASSIGNMENT_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: 'sub-101',
    assignmentId: 'les-alg-103',
    assignmentTitle: 'Unit 1 Applied Problem Set Assignment',
    courseId: 1,
    studentId: 'STU-1001',
    studentName: 'Jane Doe',
    studentEmail: 'jane.doe@student.edu',
    submittedAt: '2026-09-28T14:32:00Z',
    status: 'pending',
    textSubmission: `
# Jane Doe - Unit 1 Problem Set Submission

### Problem 1: Cell Phone Plan
Let x be the number of text messages.
- Cost Carrier A: C_A = 30 + 0.05x
- Cost Carrier B: C_B = 20 + 0.10x
Setting equations equal:
30 + 0.05x = 20 + 0.10x
30 - 20 = 0.10x - 0.05x
10 = 0.05x
x = 10 / 0.05 = 200 text messages.
Verification:
Carrier A: 30 + 0.05(200) = $40
Carrier B: 20 + 0.10(200) = $40. Exactly matches!

### Problem 2: Rectangular Garden Perimeter
Let w be width in meters. Length l = 2w + 4.
Perimeter formula: P = 2l + 2w = 64
2(2w + 4) + 2w = 64
4w + 8 + 2w = 64
6w + 8 = 64
6w = 56
w = 56 / 6 = 9.33 meters.
Length l = 2(9.33) + 4 = 22.67 meters.
    `.trim(),
    annotations: [
      {
        id: 'ann-1',
        lineOrTimestamp: 'Problem 1, Step 3',
        comment: 'Clear step-by-step arithmetic and algebraic balance.',
        createdAt: '2026-09-29T10:15:00Z',
        authorName: 'Prof. Miller',
      },
    ],
  },
  {
    id: 'sub-102',
    assignmentId: 'les-alg-103',
    assignmentTitle: 'Unit 1 Applied Problem Set Assignment',
    courseId: 1,
    studentId: 'STU-1002',
    studentName: 'Marcus Vance',
    studentEmail: 'marcus.v@student.edu',
    submittedAt: '2026-09-28T16:45:00Z',
    status: 'graded',
    grade: 85,
    textSubmission: `
# Marcus Vance - Problem Set 1
Carrier equation: 30 + 0.05x = 20 + 0.10x -> 10 = 0.05x -> x = 200.
Perimeter: 2(2w + 4) + 2w = 64 -> 6w = 56 -> w = 9.33m.
    `.trim(),
    rubricScores: {
      'crit-content': { levelId: 'lvl-c-4', pointsEarned: 4, feedback: 'Correct values found.' },
      'crit-clarity': { levelId: 'lvl-l-3', pointsEarned: 3, feedback: 'Could show more explanation of variables.' },
      'crit-formatting': { levelId: 'lvl-f-3', pointsEarned: 3, feedback: 'Brief layout.' },
    },
    teacherFeedback: 'Good computation Marcus, try writing out the variable definitions next time.',
    annotations: [],
  },
  {
    id: 'sub-103',
    assignmentId: 'les-alg-103',
    assignmentTitle: 'Unit 1 Applied Problem Set Assignment',
    courseId: 1,
    studentId: 'STU-1004',
    studentName: 'Liam Chen',
    studentEmail: 'liam.chen@student.edu',
    submittedAt: '2026-09-29T09:12:00Z',
    status: 'pending',
    textSubmission: `
I think Carrier A is 30 + 0.05 and Carrier B is 20 + 0.1.
Equating them gave me 150 texts but I am not certain if my fraction math was correct.
    `.trim(),
    annotations: [],
  },
];
