import { describe, it, expect, beforeEach } from 'vitest';
import { gamificationService } from '../services/gamificationService';

describe('GamificationService', () => {
  beforeEach(() => {
    gamificationService.resetToDefaults();
  });

  describe('Level Progression Calculation', () => {
    it('calculates correct level thresholds and percentages', () => {
      // 0 XP -> Level 1
      const p1 = gamificationService.calculateLevelProgression(0);
      expect(p1.level).toBe(1);
      expect(p1.progressPercentage).toBe(0);

      // 250 XP -> Level 2
      const p2 = gamificationService.calculateLevelProgression(250);
      expect(p2.level).toBe(2);
      expect(p2.progressPercentage).toBe(0);

      // 425 XP -> Level 2 (50% progress)
      const p2Half = gamificationService.calculateLevelProgression(425);
      expect(p2Half.level).toBe(2);
      expect(p2Half.progressPercentage).toBe(50);

      // High XP (9000 XP) -> Level 8
      const p8 = gamificationService.calculateLevelProgression(9000);
      expect(p8.level).toBe(8);
      expect(p8.progressPercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('XP and Coin Rewards', () => {
    it('awards XP, coins, and updates student level', () => {
      const initialProfile = gamificationService.getProfile();
      const initialXp = initialProfile.xp;
      const initialCoins = initialProfile.glowCoins;

      const result = gamificationService.awardXp(400, 'Quiz Excellence');
      expect(result.profile.xp).toBe(initialXp + 400);
      expect(result.coinsAwarded).toBe(100);
      expect(result.profile.glowCoins).toBe(initialCoins + 100);
    });

    it('triggers level-up flag when XP surpasses current level threshold', () => {
      // Current XP is 1450 (Level 4, threshold is 2200 for Level 5)
      const result = gamificationService.awardXp(1000, 'Milestone Bonus');
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(5);
      expect(result.profile.level).toBe(5);
    });
  });

  describe('Daily Streaks & Freeze Protection', () => {
    it('maintains consecutive daily streak', () => {
      const initialProfile = gamificationService.getProfile();
      const initialStreak = initialProfile.streakDays;

      // Next day activity
      const res = gamificationService.recordDailyActivity('2026-10-08', 50);
      expect(res.streakDays).toBe(initialStreak + 1);
      expect(res.streakMaintained).toBe(true);
      expect(res.freezeConsumed).toBe(false);
    });

    it('consumes streak freeze if a day was skipped', () => {
      // Last active is 2026-10-07, skip to 2026-10-10 (diff > 1 day)
      const initialFreezes = gamificationService.getProfile().streakFreezesAvailable;
      expect(initialFreezes).toBeGreaterThan(0);

      const res = gamificationService.recordDailyActivity('2026-10-10', 50);
      expect(res.freezeConsumed).toBe(true);
      expect(res.streakMaintained).toBe(true);
      expect(gamificationService.getProfile().streakFreezesAvailable).toBe(initialFreezes - 1);
    });

    it('allows purchasing streak freeze with coins up to maximum of 3', () => {
      const initialFreezes = gamificationService.getProfile().streakFreezesAvailable; // 2
      const purchase1 = gamificationService.purchaseStreakFreeze(100);
      expect(purchase1.success).toBe(true);
      expect(gamificationService.getProfile().streakFreezesAvailable).toBe(3);

      // Attempt to purchase a 4th freeze (exceeds cap of 3)
      const purchase2 = gamificationService.purchaseStreakFreeze(100);
      expect(purchase2.success).toBe(false);
      expect(purchase2.message).toContain('Maximum of 3');
    });
  });

  describe('Avatar Customization & Wardrobe', () => {
    it('equips unlocked wardrobe items', () => {
      const updated = gamificationService.equipAvatar({
        equippedHat: 'hat_scholar',
        equippedOutfit: 'outfit_blazer',
        equippedTitle: 'Honors Fellow',
      });

      expect(updated.avatar.equippedHat).toBe('hat_scholar');
      expect(updated.avatar.equippedOutfit).toBe('outfit_blazer');
      expect(updated.avatar.equippedTitle).toBe('Honors Fellow');
    });

    it('prevents unlocking item when level requirement is not met', () => {
      // hat_crown requires level 6 (profile is level 4)
      const res = gamificationService.unlockAvatarItem('hat_crown');
      expect(res.success).toBe(false);
      expect(res.message).toContain('Requires Level 6');
    });

    it('successfully purchases and unlocks affordable item when requirements met', () => {
      // hat_wizard requires Level 4 and costs 180 coins. Profile is Lv 4 and has 380 coins.
      const initialCoins = gamificationService.getProfile().glowCoins;
      const res = gamificationService.unlockAvatarItem('hat_wizard');
      expect(res.success).toBe(true);
      expect(gamificationService.getProfile().glowCoins).toBe(initialCoins - 180);
      expect(gamificationService.getProfile().avatar.unlockedItemIds).toContain('hat_wizard');
    });
  });

  describe('Mastery Tree & Node Progression', () => {
    it('updates node mastery score and status', () => {
      // sci_node_2 starts at 40 (in_progress)
      const res = gamificationService.updateNodeMastery('subject_science', 'sci_node_2', 100);
      expect(res.updatedNode?.masteryScore).toBe(100);
      expect(res.updatedNode?.status).toBe('mastered');
    });

    it('automatically unlocks successor nodes when prerequisites are fulfilled', () => {
      // sci_node_3 prerequisites: ['sci_node_2'].
      // Currently sci_node_2 has score 40. Updating sci_node_2 to 85 (completed) should unlock sci_node_3!
      const res = gamificationService.updateNodeMastery('subject_science', 'sci_node_2', 85);
      expect(res.unlockedSuccessors.some(n => n.id === 'sci_node_3')).toBe(true);

      const subjects = gamificationService.getMasterySubjects();
      const sci = subjects.find(s => s.id === 'subject_science');
      const node3 = sci?.nodes.find(n => n.id === 'sci_node_3');
      expect(node3?.status).toBe('in_progress');
    });
  });
});
