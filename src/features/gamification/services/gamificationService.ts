import { 
  StudentGamificationProfile, 
  Badge, 
  AvatarItem, 
  MasterySubject, 
  MasteryNode,
  HouseName,
  StudentAvatarConfig
} from '@/shared/types/gamification';
import { 
  INITIAL_STUDENT_PROFILE, 
  INITIAL_BADGES, 
  INITIAL_AVATAR_ITEMS, 
  INITIAL_MASTERY_SUBJECTS 
} from '../data/sampleGamificationData';

const STORAGE_KEY_PROFILE = 'grade_glow_gamification_profile';
const STORAGE_KEY_SUBJECTS = 'grade_glow_mastery_subjects';
const STORAGE_KEY_ITEMS = 'grade_glow_avatar_items';
const STORAGE_KEY_BADGES = 'grade_glow_badges';

export class GamificationService {
  private profile: StudentGamificationProfile;
  private subjects: MasterySubject[];
  private avatarItems: AvatarItem[];
  private badges: Badge[];

  constructor() {
    this.profile = this.loadFromStorage(STORAGE_KEY_PROFILE, INITIAL_STUDENT_PROFILE);
    this.subjects = this.loadFromStorage(STORAGE_KEY_SUBJECTS, INITIAL_MASTERY_SUBJECTS);
    this.avatarItems = this.loadFromStorage(STORAGE_KEY_ITEMS, INITIAL_AVATAR_ITEMS);
    this.badges = this.loadFromStorage(STORAGE_KEY_BADGES, INITIAL_BADGES);
  }

  private loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (item) {
          return JSON.parse(item) as T;
        }
      }
    } catch {
      // Storage unavailable or disabled
    }
    return JSON.parse(JSON.stringify(defaultValue));
  }

  private saveToStorage<T>(key: string, value: T): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Storage full or unavailable
    }
  }

  /**
   * Calculates level progression using a balanced logarithmic-curved threshold
   */
  public calculateLevelProgression(xp: number): {
    level: number;
    currentLevelMinXp: number;
    nextLevelXp: number;
    progressPercentage: number;
  } {
    const thresholds = [
      0,      // Level 1
      250,    // Level 2
      600,    // Level 3
      1200,   // Level 4
      2200,   // Level 5
      3600,   // Level 6
      5500,   // Level 7
      8000,   // Level 8
      11500,  // Level 9
      16000,  // Level 10
    ];

    let level = 1;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= thresholds[i]) {
        level = i + 1;
        break;
      }
    }

    const currentLevelMinXp = thresholds[level - 1] || 0;
    const nextLevelXp = thresholds[level] || currentLevelMinXp + 5000;
    const xpSpan = Math.max(1, nextLevelXp - currentLevelMinXp);
    const progress = Math.min(100, Math.max(0, Math.round(((xp - currentLevelMinXp) / xpSpan) * 100)));

    return {
      level,
      currentLevelMinXp,
      nextLevelXp,
      progressPercentage: progress,
    };
  }

  /**
   * Retrieves the current student gamification profile
   */
  public getProfile(): StudentGamificationProfile {
    return { ...this.profile };
  }

  /**
   * Awards XP, recalculates level and rewards Glow Coins
   */
  public awardXp(amount: number, reason: string): {
    profile: StudentGamificationProfile;
    leveledUp: boolean;
    newLevel?: number;
    coinsAwarded: number;
    unlockedBadges: Badge[];
  } {
    const prevLevel = this.profile.level;
    const newXp = Math.max(0, this.profile.xp + amount);
    const coinsAwarded = Math.max(1, Math.round(amount * 0.25));
    const newCoins = this.profile.glowCoins + coinsAwarded;

    const progression = this.calculateLevelProgression(newXp);
    const leveledUp = progression.level > prevLevel;

    this.profile.xp = newXp;
    this.profile.level = progression.level;
    this.profile.currentLevelXp = newXp;
    this.profile.nextLevelXp = progression.nextLevelXp;
    this.profile.glowCoins = newCoins;
    this.profile.housePoints += Math.round(amount * 0.2);

    const newlyUnlockedBadges: Badge[] = [];

    // Check level milestone badges
    if (this.profile.streakDays >= 7 && !this.profile.unlockedBadgeIds.includes('streak_7')) {
      this.profile.unlockedBadgeIds.push('streak_7');
      const badge = this.badges.find(b => b.id === 'streak_7');
      if (badge) newlyUnlockedBadges.push(badge);
    }

    this.saveToStorage(STORAGE_KEY_PROFILE, this.profile);

    return {
      profile: { ...this.profile },
      leveledUp,
      newLevel: leveledUp ? progression.level : undefined,
      coinsAwarded,
      unlockedBadges: newlyUnlockedBadges,
    };
  }

  /**
   * Records daily study activity and updates streak counters with freeze protection
   */
  public recordDailyActivity(dateStr?: string, xpGained: number = 50): {
    streakDays: number;
    streakMaintained: boolean;
    freezeConsumed: boolean;
  } {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const lastActive = this.profile.lastActiveDate;

    let freezeConsumed = false;
    let streakMaintained = true;

    if (lastActive === targetDate) {
      // Activity already recorded today, increment today's XP
      const todayRecord = this.profile.streakHistory.find(r => r.date === targetDate);
      if (todayRecord) {
        todayRecord.xpGained += xpGained;
      }
    } else {
      const lastDateObj = new Date(lastActive);
      const currDateObj = new Date(targetDate);
      const diffTime = currDateObj.getTime() - lastDateObj.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays === 1) {
        // Consecutive day
        this.profile.streakDays += 1;
        this.profile.streakHistory.push({ date: targetDate, completed: true, xpGained });
      } else if (diffDays > 1) {
        // Missed one or more days - check if freeze is available
        if (this.profile.streakFreezesAvailable > 0) {
          this.profile.streakFreezesAvailable -= 1;
          freezeConsumed = true;
          this.profile.streakHistory.push({ date: targetDate, completed: true, xpGained });
        } else {
          // Streak broken
          this.profile.streakDays = 1;
          streakMaintained = false;
          this.profile.streakHistory.push({ date: targetDate, completed: true, xpGained });
        }
      }

      this.profile.lastActiveDate = targetDate;
      // Keep only last 14 days in history
      if (this.profile.streakHistory.length > 14) {
        this.profile.streakHistory = this.profile.streakHistory.slice(-14);
      }
    }

    this.saveToStorage(STORAGE_KEY_PROFILE, this.profile);

    return {
      streakDays: this.profile.streakDays,
      streakMaintained,
      freezeConsumed,
    };
  }

  /**
   * Purchase a streak freeze with earned Glow Coins
   */
  public purchaseStreakFreeze(cost: number = 100): { success: boolean; message: string } {
    if (this.profile.glowCoins < cost) {
      return { success: false, message: `Insufficient Glow Coins. Required: ${cost}, available: ${this.profile.glowCoins}` };
    }

    if (this.profile.streakFreezesAvailable >= 3) {
      return { success: false, message: 'Maximum of 3 streak freezes reached.' };
    }

    this.profile.glowCoins -= cost;
    this.profile.streakFreezesAvailable += 1;
    this.saveToStorage(STORAGE_KEY_PROFILE, this.profile);

    return { success: true, message: 'Streak freeze acquired successfully.' };
  }

  /**
   * Unlocks an avatar item using Glow Coins
   */
  public unlockAvatarItem(itemId: string): { success: boolean; message: string; item?: AvatarItem } {
    const item = this.avatarItems.find(i => i.id === itemId);
    if (!item) {
      return { success: false, message: 'Item not found in catalog.' };
    }

    if (this.profile.avatar.unlockedItemIds.includes(itemId)) {
      return { success: false, message: 'Item is already unlocked.' };
    }

    if (this.profile.level < item.requiredLevel) {
      return { success: false, message: `Requires Level ${item.requiredLevel} (Current: Level ${this.profile.level}).` };
    }

    if (this.profile.glowCoins < item.coinCost) {
      return { success: false, message: `Insufficient coins. Cost: ${item.coinCost}, Available: ${this.profile.glowCoins}` };
    }

    this.profile.glowCoins -= item.coinCost;
    this.profile.avatar.unlockedItemIds.push(itemId);
    item.unlocked = true;

    this.saveToStorage(STORAGE_KEY_PROFILE, this.profile);
    this.saveToStorage(STORAGE_KEY_ITEMS, this.avatarItems);

    return { success: true, message: `Unlocked ${item.name}!`, item };
  }

  /**
   * Equips an avatar item
   */
  public equipAvatar(updates: Partial<StudentAvatarConfig>): StudentGamificationProfile {
    this.profile.avatar = {
      ...this.profile.avatar,
      ...updates,
    };
    this.saveToStorage(STORAGE_KEY_PROFILE, this.profile);
    return { ...this.profile };
  }

  /**
   * Returns catalog of avatar items
   */
  public getAvatarItems(): AvatarItem[] {
    return this.avatarItems.map(item => ({
      ...item,
      unlocked: this.profile.avatar.unlockedItemIds.includes(item.id),
    }));
  }

  /**
   * Returns all badges with unlocked status
   */
  public getBadges(): Badge[] {
    return this.badges.map(b => ({
      ...b,
      unlockedAt: this.profile.unlockedBadgeIds.includes(b.id) ? (b.unlockedAt || new Date().toISOString()) : undefined,
    }));
  }

  /**
   * Returns mastery subjects and their learning node trees
   */
  public getMasterySubjects(): MasterySubject[] {
    return JSON.parse(JSON.stringify(this.subjects));
  }

  /**
   * Updates mastery score on a node and automatically unlocks successor nodes
   */
  public updateNodeMastery(subjectId: string, nodeId: string, score: number): {
    updatedNode?: MasteryNode;
    unlockedSuccessors: MasteryNode[];
  } {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (!subject) return { unlockedSuccessors: [] };

    const targetNode = subject.nodes.find(n => n.id === nodeId);
    if (!targetNode) return { unlockedSuccessors: [] };

    targetNode.masteryScore = Math.max(0, Math.min(100, score));
    if (targetNode.masteryScore === 100) {
      targetNode.status = 'mastered';
    } else if (targetNode.masteryScore >= 75) {
      targetNode.status = 'completed';
    } else if (targetNode.masteryScore > 0) {
      targetNode.status = 'in_progress';
    }

    const unlockedSuccessors: MasteryNode[] = [];

    // Check if successor nodes have all prerequisites satisfied
    subject.nodes.forEach(node => {
      if (node.status === 'locked' && node.prerequisites.includes(nodeId)) {
        const allPrereqsMet = node.prerequisites.every(pId => {
          const prereqNode = subject.nodes.find(n => n.id === pId);
          return prereqNode && (prereqNode.status === 'completed' || prereqNode.status === 'mastered');
        });

        if (allPrereqsMet) {
          node.status = 'in_progress';
          unlockedSuccessors.push(node);
        }
      }
    });

    this.saveToStorage(STORAGE_KEY_SUBJECTS, this.subjects);

    return {
      updatedNode: targetNode,
      unlockedSuccessors,
    };
  }

  /**
   * Resets local profile to initial defaults (useful for testing and reset settings)
   */
  public resetToDefaults(): void {
    this.profile = JSON.parse(JSON.stringify(INITIAL_STUDENT_PROFILE));
    this.subjects = JSON.parse(JSON.stringify(INITIAL_MASTERY_SUBJECTS));
    this.avatarItems = JSON.parse(JSON.stringify(INITIAL_AVATAR_ITEMS));
    this.badges = JSON.parse(JSON.stringify(INITIAL_BADGES));

    this.saveToStorage(STORAGE_KEY_PROFILE, this.profile);
    this.saveToStorage(STORAGE_KEY_SUBJECTS, this.subjects);
    this.saveToStorage(STORAGE_KEY_ITEMS, this.avatarItems);
    this.saveToStorage(STORAGE_KEY_BADGES, this.badges);
  }
}

export const gamificationService = new GamificationService();
