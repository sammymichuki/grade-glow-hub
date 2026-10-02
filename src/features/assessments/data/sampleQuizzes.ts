import { Quiz } from '@/shared/types/assessment';

export const SAMPLE_QUIZZES: Quiz[] = [
  {
    id: 'math-quiz-1',
    courseId: 1,
    lessonId: '2',
    title: 'Linear Inequalities Mastery Checkpoint',
    description: 'Test your understanding of linear inequalities, algebraic solutions, and coordinate graphing.',
    timeLimitMinutes: 10,
    passingScorePercent: 70,
    allowedAttempts: 3,
    questions: [
      {
        id: 'mq1',
        prompt: 'Solve for x: 3x - 5 > 7',
        type: 'single_choice',
        points: 25,
        explanation: 'Add 5 to both sides: 3x > 12. Divide both sides by 3: x > 4.',
        options: [
          { id: 'opt1', text: 'x > 4', isCorrect: true },
          { id: 'opt2', text: 'x < 4', isCorrect: false },
          { id: 'opt3', text: 'x > 12', isCorrect: false },
          { id: 'opt4', text: 'x = 4', isCorrect: false },
        ],
      },
      {
        id: 'mq2',
        prompt: 'Which of the following operations reverse the direction of an inequality sign? (Select all that apply)',
        type: 'multiple_choice',
        points: 25,
        explanation: 'Multiplying or dividing both sides of an inequality by a negative number flips the inequality symbol.',
        options: [
          { id: 'optA', text: 'Multiplying both sides by -2', isCorrect: true },
          { id: 'optB', text: 'Dividing both sides by -5', isCorrect: true },
          { id: 'optC', text: 'Adding 10 to both sides', isCorrect: false },
          { id: 'optD', text: 'Subtracting 8 from both sides', isCorrect: false },
        ],
      },
      {
        id: 'mq3',
        prompt: 'If x < -2, then -x > 2. Is this statement True or False?',
        type: 'true_false',
        points: 25,
        explanation: 'Multiplying both sides of x < -2 by -1 reverses the inequality sign to produce -x > 2.',
        options: [
          { id: 'optT', text: 'True', isCorrect: true },
          { id: 'optF', text: 'False', isCorrect: false },
        ],
      },
      {
        id: 'mq4',
        prompt: 'What is the smallest integer that satisfies the inequality 2x >= 9?',
        type: 'short_answer',
        points: 25,
        explanation: '2x >= 9 implies x >= 4.5. The smallest integer greater than or equal to 4.5 is 5.',
        options: [
          { id: 'optAns', text: '5', isCorrect: true },
        ],
      },
    ],
  },
  {
    id: 'science-quiz-1',
    courseId: 2,
    lessonId: '2',
    title: 'Cell Biology & Structure Assessment',
    description: 'Verify your knowledge of animal vs. plant cell organelles and biological functions.',
    timeLimitMinutes: 15,
    passingScorePercent: 75,
    allowedAttempts: 2,
    questions: [
      {
        id: 'sq1',
        prompt: 'Which organelle is widely referred to as the powerhouse of the cell?',
        type: 'single_choice',
        points: 25,
        explanation: 'Mitochondria generate most of the chemical energy needed to power the cell’s biochemical reactions (ATP).',
        options: [
          { id: 'sopt1', text: 'Mitochondria', isCorrect: true },
          { id: 'sopt2', text: 'Ribosome', isCorrect: false },
          { id: 'sopt3', text: 'Nucleus', isCorrect: false },
          { id: 'sopt4', text: 'Golgi Apparatus', isCorrect: false },
        ],
      },
      {
        id: 'sq2',
        prompt: 'Which organelles are present in plant cells but absent in animal cells?',
        type: 'multiple_choice',
        points: 25,
        explanation: 'Plant cells have rigid cell walls and chloroplasts for photosynthesis, which animal cells lack.',
        options: [
          { id: 'soptA', text: 'Cell Wall', isCorrect: true },
          { id: 'soptB', text: 'Chloroplast', isCorrect: true },
          { id: 'soptC', text: 'Cell Membrane', isCorrect: false },
          { id: 'soptD', text: 'Cytoplasm', isCorrect: false },
        ],
      },
      {
        id: 'sq3',
        prompt: 'The cell membrane is selectively permeable.',
        type: 'true_false',
        points: 25,
        explanation: 'True: The phospholipid bilayer regulates what enters and leaves the cell.',
        options: [
          { id: 'soptT', text: 'True', isCorrect: true },
          { id: 'soptF', text: 'False', isCorrect: false },
        ],
      },
      {
        id: 'sq4',
        prompt: 'What green pigment in chloroplasts absorbs light energy during photosynthesis?',
        type: 'short_answer',
        points: 25,
        explanation: 'Chlorophyll is the green pigment responsible for absorbing sunlight.',
        options: [
          { id: 'soptAns1', text: 'chlorophyll', isCorrect: true },
        ],
      },
    ],
  },
];
