export type HouseName = 'Solaris' | 'Terra' | 'Aether' | 'Aqua';

export type MasteryNodeStatus = 'locked' | 'in_progress' | 'completed' | 'mastered';

export interface MasteryNode {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  prerequisites: string[];
  masteryScore: number; // 0 to 100
  status: MasteryNodeStatus;
  quizId?: string;
  courseId?: number;
  xpReward: number;
}

export interface MasterySubject {
  id: string;
  name: string;
  gradeLevel: string;
  color: string;
  nodes: MasteryNode[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'academic' | 'community' | 'arena';
  xpBonus: number;
  unlockedAt?: string;
}

export type AvatarItemType = 'hat' | 'aura' | 'outfit' | 'title';

export interface AvatarItem {
  id: string;
  name: string;
  type: AvatarItemType;
  requiredLevel: number;
  coinCost: number;
  preview: string;
  unlocked: boolean;
}

export interface StudentAvatarConfig {
  skinColor: string;
  hairStyle: string;
  equippedHat?: string;
  equippedAura?: string;
  equippedOutfit?: string;
  equippedTitle: string;
  unlockedItemIds: string[];
}

export interface StreakDayRecord {
  date: string; // YYYY-MM-DD
  completed: boolean;
  xpGained: number;
}

export interface StudentGamificationProfile {
  studentId: string;
  name: string;
  xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  glowCoins: number;
  streakDays: number;
  lastActiveDate: string;
  streakFreezesAvailable: number;
  streakHistory: StreakDayRecord[];
  avatar: StudentAvatarConfig;
  unlockedBadgeIds: string[];
  house: HouseName;
  housePoints: number;
}

export interface ArenaQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ArenaQuestion {
  id: string;
  prompt: string;
  options: ArenaQuestionOption[];
  timeLimitSeconds: number;
  explanation: string;
}

export interface ArenaParticipant {
  id: string;
  name: string;
  avatarIcon: string;
  isBot: boolean;
  score: number;
  streak: number;
  lastAnswerCorrect?: boolean;
  lastAnswerTimeMs?: number;
}

export type ArenaGameStatus = 'lobby' | 'question_active' | 'round_review' | 'game_over';

export interface ArenaRoom {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: ArenaGameStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  participants: ArenaParticipant[];
  questions: ArenaQuestion[];
}
