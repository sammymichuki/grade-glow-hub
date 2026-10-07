import { describe, it, expect, beforeEach } from 'vitest';
import { arenaService } from '../services/arenaService';
import { gamificationService } from '@/features/gamification/services/gamificationService';

describe('ArenaService', () => {
  const testRoomId = 'arena-stem-7';

  beforeEach(() => {
    gamificationService.resetToDefaults();
    arenaService.resetRoom(testRoomId);
  });

  describe('Lobby & Room Management', () => {
    it('returns available multiplayer arena rooms', () => {
      const rooms = arenaService.getRooms();
      expect(rooms.length).toBeGreaterThan(0);
      expect(rooms[0].id).toBe(testRoomId);
    });

    it('allows a human player to join the room', () => {
      const { room, participantId } = arenaService.joinRoom(testRoomId, 'Sammy M.', '🎓');
      expect(participantId).toBeDefined();
      const human = room.participants.find(p => p.id === participantId);
      expect(human?.name).toBe('Sammy M.');
      expect(human?.isBot).toBe(false);
      expect(human?.score).toBe(0);
    });

    it('initializes match state upon start', () => {
      arenaService.joinRoom(testRoomId, 'Sammy M.', '🎓');
      const started = arenaService.startMatch(testRoomId);
      expect(started.status).toBe('question_active');
      expect(started.currentQuestionIndex).toBe(0);
      expect(started.participants.every(p => p.score === 0)).toBe(true);
    });
  });

  describe('Answer Evaluation & Scoring Dynamics', () => {
    it('awards points with speed bonus for correct answer', () => {
      const { participantId } = arenaService.joinRoom(testRoomId, 'Sammy M.', '🎓');
      arenaService.startMatch(testRoomId);

      // Question 1: 'opt-2' (Mitochondria) is correct
      // Fast answer: 2000ms out of 15000ms
      const result = arenaService.submitAnswer(testRoomId, participantId, 'opt-2', 2000);
      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBeGreaterThan(500); // 500 base + speed bonus
      expect(result.newScore).toBe(result.pointsEarned);
    });

    it('awards zero points and resets streak for incorrect answer', () => {
      const { participantId } = arenaService.joinRoom(testRoomId, 'Sammy M.', '🎓');
      arenaService.startMatch(testRoomId);

      // 'opt-1' is incorrect
      const result = arenaService.submitAnswer(testRoomId, participantId, 'opt-1', 4000);
      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(result.newScore).toBe(0);
    });

    it('simulates bot participant answers with valid scores', () => {
      arenaService.startMatch(testRoomId);
      const bots = arenaService.simulateBotAnswers(testRoomId);
      expect(bots.length).toBeGreaterThan(0);
      expect(bots.every(b => b.isBot)).toBe(true);
    });
  });

  describe('Match Progression & Concluding Podium', () => {
    it('advances between question rounds up to game over', () => {
      arenaService.startMatch(testRoomId);
      arenaService.endQuestionRound(testRoomId);
      let room = arenaService.getRoom(testRoomId);
      expect(room?.status).toBe('round_review');

      // Advance
      room = arenaService.advanceNext(testRoomId);
      expect(room.currentQuestionIndex).toBe(1);
      expect(room.status).toBe('question_active');
    });

    it('concludes tournament and awards XP to human player based on rank', () => {
      const { participantId } = arenaService.joinRoom(testRoomId, 'Champion Sammy', '👑');
      arenaService.startMatch(testRoomId);

      // Give human a high score
      arenaService.submitAnswer(testRoomId, participantId, 'opt-2', 500);

      const finish = arenaService.finishMatch(testRoomId, participantId);
      expect(finish.room.status).toBe('game_over');
      expect(finish.leaderboard.length).toBeGreaterThan(0);
      expect(finish.winner).toBeDefined();
      expect(finish.xpAwarded).toBeGreaterThan(0);
      expect(finish.coinsAwarded).toBeGreaterThan(0);
    });
  });
});
