import { ArenaRoom } from '@/shared/types/gamification';

export const SAMPLE_ARENA_ROOMS: ArenaRoom[] = [
  {
    id: 'arena-stem-7',
    title: 'Grade 7 STEM Championship Showdown',
    subject: 'Integrated Science & Math',
    grade: 'Grade 7',
    status: 'lobby',
    currentQuestionIndex: 0,
    totalQuestions: 5,
    participants: [
      { id: 'bot-1', name: 'Amina K. (Nairobi)', avatarIcon: '🌟', isBot: true, score: 0, streak: 0 },
      { id: 'bot-2', name: 'David O. (Mombasa)', avatarIcon: '⚡', isBot: true, score: 0, streak: 0 },
      { id: 'bot-3', name: 'Sophia M. (Nakuru)', avatarIcon: '🌿', isBot: true, score: 0, streak: 0 },
      { id: 'bot-4', name: 'Liam W. (Eldoret)', avatarIcon: '🛡️', isBot: true, score: 0, streak: 0 },
    ],
    questions: [
      {
        id: 'stem-q1',
        prompt: 'Which organelle is responsible for generating ATP through cellular respiration?',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt-1', text: 'Ribosome', isCorrect: false },
          { id: 'opt-2', text: 'Mitochondria', isCorrect: true },
          { id: 'opt-3', text: 'Endoplasmic Reticulum', isCorrect: false },
          { id: 'opt-4', text: 'Golgi Apparatus', isCorrect: false },
        ],
        explanation: 'Mitochondria are the powerhouses of eukaryotic cells where ATP is produced via aerobic cellular respiration.',
      },
      {
        id: 'stem-q2',
        prompt: 'Solve for x: 3x - 7 = 14',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt-1', text: 'x = 5', isCorrect: false },
          { id: 'opt-2', text: 'x = 6', isCorrect: false },
          { id: 'opt-3', text: 'x = 7', isCorrect: true },
          { id: 'opt-4', text: 'x = 21', isCorrect: false },
        ],
        explanation: 'Add 7 to both sides: 3x = 21. Divide by 3: x = 7.',
      },
      {
        id: 'stem-q3',
        prompt: 'What happens to the pressure of an enclosed gas if its volume is halved at constant temperature (Boyle’s Law)?',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt-1', text: 'Pressure remains unchanged', isCorrect: false },
          { id: 'opt-2', text: 'Pressure is halved', isCorrect: false },
          { id: 'opt-3', text: 'Pressure doubles', isCorrect: true },
          { id: 'opt-4', text: 'Pressure drops to zero', isCorrect: false },
        ],
        explanation: 'According to Boyle’s Law (P1V1 = P2V2), pressure and volume are inversely proportional at constant temperature.',
      },
      {
        id: 'stem-q4',
        prompt: 'What is the sum of interior angles in a regular pentagon?',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt-1', text: '360°', isCorrect: false },
          { id: 'opt-2', text: '540°', isCorrect: true },
          { id: 'opt-3', text: '720°', isCorrect: false },
          { id: 'opt-4', text: '180°', isCorrect: false },
        ],
        explanation: 'Sum = (n - 2) * 180°. For pentagon n = 5: (5 - 2) * 180° = 3 * 180° = 540°.',
      },
      {
        id: 'stem-q5',
        prompt: 'Which trophic level contains the greatest amount of total biomass in a terrestrial ecosystem?',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt-1', text: 'Primary Producers (Plants)', isCorrect: true },
          { id: 'opt-2', text: 'Primary Consumers (Herbivores)', isCorrect: false },
          { id: 'opt-3', text: 'Secondary Consumers (Carnivores)', isCorrect: false },
          { id: 'opt-4', text: 'Apex Predators', isCorrect: false },
        ],
        explanation: 'Producers occupy the base of the energy pyramid and account for the largest proportion of total biomass.',
      },
    ],
  },
  {
    id: 'arena-algebra-8',
    title: 'Algebra Lightning Sprint',
    subject: 'Mathematics',
    grade: 'Grade 8',
    status: 'lobby',
    currentQuestionIndex: 0,
    totalQuestions: 3,
    participants: [
      { id: 'bot-11', name: 'Zuri M.', avatarIcon: '🔮', isBot: true, score: 0, streak: 0 },
      { id: 'bot-12', name: 'Brian T.', avatarIcon: '🚀', isBot: true, score: 0, streak: 0 },
    ],
    questions: [
      {
        id: 'alg-q1',
        prompt: 'Simplify the expression: 4(2a - 3) + 5a',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt-1', text: '13a - 12', isCorrect: true },
          { id: 'opt-2', text: '8a - 12', isCorrect: false },
          { id: 'opt-3', text: '13a - 3', isCorrect: false },
          { id: 'opt-4', text: '3a - 7', isCorrect: false },
        ],
        explanation: 'Distribute 4: 8a - 12. Add 5a: (8a + 5a) - 12 = 13a - 12.',
      },
      {
        id: 'alg-q2',
        prompt: 'If y = 2x + 1 and x = 4, what is the value of y?',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt-1', text: '7', isCorrect: false },
          { id: 'opt-2', text: '8', isCorrect: false },
          { id: 'opt-3', text: '9', isCorrect: true },
          { id: 'opt-4', text: '10', isCorrect: false },
        ],
        explanation: 'Substitute 4: y = 2(4) + 1 = 8 + 1 = 9.',
      },
      {
        id: 'alg-q3',
        prompt: 'Which point lies on the line defined by equation y = 3x - 2?',
        timeLimitSeconds: 15,
        options: [
          { id: 'opt-1', text: '(1, 1)', isCorrect: true },
          { id: 'opt-2', text: '(2, 3)', isCorrect: false },
          { id: 'opt-3', text: '(0, 2)', isCorrect: false },
          { id: 'opt-4', text: '(3, 5)', isCorrect: false },
        ],
        explanation: 'For x = 1: y = 3(1) - 2 = 1. Therefore (1, 1) lies on the line.',
      },
    ],
  },
];
