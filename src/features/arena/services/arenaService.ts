import { ArenaRoom, ArenaParticipant, ArenaQuestion } from '@/shared/types/gamification';
import { SAMPLE_ARENA_ROOMS } from '../data/sampleArenaData';
import { gamificationService } from '@/features/gamification/services/gamificationService';

export class ArenaService {
  private rooms: ArenaRoom[];

  constructor() {
    this.rooms = JSON.parse(JSON.stringify(SAMPLE_ARENA_ROOMS));
  }

  public getRooms(): ArenaRoom[] {
    return JSON.parse(JSON.stringify(this.rooms));
  }

  public getRoom(roomId: string): ArenaRoom | undefined {
    const room = this.rooms.find(r => r.id === roomId);
    return room ? JSON.parse(JSON.stringify(room)) : undefined;
  }

  /**
   * Joins a room as a participant
   */
  public joinRoom(roomId: string, name: string, avatarIcon: string = '👤'): {
    room: ArenaRoom;
    participantId: string;
  } {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) {
      throw new Error(`Room with ID "${roomId}" not found`);
    }

    const participantId = `user-${Date.now().toString(36)}`;
    const existingIndex = room.participants.findIndex(p => p.id.startsWith('user-'));

    const newParticipant: ArenaParticipant = {
      id: participantId,
      name,
      avatarIcon,
      isBot: false,
      score: 0,
      streak: 0,
    };

    if (existingIndex >= 0) {
      room.participants[existingIndex] = newParticipant;
    } else {
      room.participants.push(newParticipant);
    }

    return {
      room: JSON.parse(JSON.stringify(room)),
      participantId,
    };
  }

  /**
   * Starts match for a room
   */
  public startMatch(roomId: string): ArenaRoom {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    room.status = 'question_active';
    room.currentQuestionIndex = 0;
    room.participants.forEach(p => {
      p.score = 0;
      p.streak = 0;
      p.lastAnswerCorrect = undefined;
      p.lastAnswerTimeMs = undefined;
    });

    return JSON.parse(JSON.stringify(room));
  }

  /**
   * Submits player answer with speed bonus and streak multiplier
   */
  public submitAnswer(
    roomId: string,
    participantId: string,
    optionId: string,
    elapsedMs: number
  ): {
    isCorrect: boolean;
    pointsEarned: number;
    newScore: number;
    room: ArenaRoom;
  } {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const question: ArenaQuestion = room.questions[room.currentQuestionIndex];
    if (!question) throw new Error('Question not found');

    const participant = room.participants.find(p => p.id === participantId);
    if (!participant) throw new Error('Participant not in room');

    const selectedOption = question.options.find(o => o.id === optionId);
    const isCorrect = !!selectedOption?.isCorrect;

    let pointsEarned = 0;
    if (isCorrect) {
      const timeLimitMs = question.timeLimitSeconds * 1000;
      const speedRatio = Math.max(0, 1 - Math.min(elapsedMs, timeLimitMs) / timeLimitMs);
      const basePoints = 500;
      const speedBonus = Math.round(500 * speedRatio);
      
      participant.streak += 1;
      const multiplier = participant.streak >= 3 ? 1.3 : (participant.streak === 2 ? 1.15 : 1.0);
      pointsEarned = Math.round((basePoints + speedBonus) * multiplier);
      participant.score += pointsEarned;
    } else {
      participant.streak = 0;
    }

    participant.lastAnswerCorrect = isCorrect;
    participant.lastAnswerTimeMs = elapsedMs;

    return {
      isCorrect,
      pointsEarned,
      newScore: participant.score,
      room: JSON.parse(JSON.stringify(room)),
    };
  }

  /**
   * Simulates answers for all bot participants with variable latency and ~75% accuracy
   */
  public simulateBotAnswers(roomId: string): ArenaParticipant[] {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return [];

    const question = room.questions[room.currentQuestionIndex];
    if (!question) return [];

    room.participants.filter(p => p.isBot).forEach(bot => {
      // 75% probability of correct answer
      const isCorrect = Math.random() < 0.75;
      const latencyMs = Math.floor(1500 + Math.random() * 8000);
      const timeLimitMs = question.timeLimitSeconds * 1000;

      if (isCorrect) {
        const speedRatio = Math.max(0, 1 - latencyMs / timeLimitMs);
        bot.streak += 1;
        const multiplier = bot.streak >= 3 ? 1.25 : (bot.streak === 2 ? 1.1 : 1.0);
        const points = Math.round((500 + 500 * speedRatio) * multiplier);
        bot.score += points;
      } else {
        bot.streak = 0;
      }

      bot.lastAnswerCorrect = isCorrect;
      bot.lastAnswerTimeMs = latencyMs;
    });

    return JSON.parse(JSON.stringify(room.participants));
  }

  /**
   * Sets room to round review status
   */
  public endQuestionRound(roomId: string): ArenaRoom {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    room.status = 'round_review';
    return JSON.parse(JSON.stringify(room));
  }

  /**
   * Advances to next question or concludes the match
   */
  public advanceNext(roomId: string): ArenaRoom {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    if (room.currentQuestionIndex + 1 < room.questions.length) {
      room.currentQuestionIndex += 1;
      room.status = 'question_active';
    } else {
      room.status = 'game_over';
    }

    return JSON.parse(JSON.stringify(room));
  }

  /**
   * Concludes the match, ranks participants, and awards player XP/Coins
   */
  public finishMatch(roomId: string, humanParticipantId?: string): {
    room: ArenaRoom;
    leaderboard: ArenaParticipant[];
    winner: ArenaParticipant;
    humanRank?: number;
    xpAwarded: number;
    coinsAwarded: number;
  } {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    room.status = 'game_over';
    const leaderboard = [...room.participants].sort((a, b) => b.score - a.score);
    const winner = leaderboard[0];

    let humanRank: number | undefined;
    let xpAwarded = 0;
    let coinsAwarded = 0;

    if (humanParticipantId) {
      humanRank = leaderboard.findIndex(p => p.id === humanParticipantId) + 1;
      // Award XP based on rank
      if (humanRank === 1) {
        xpAwarded = 350;
        coinsAwarded = 100;
        // Check Arena Champ badge
        const profile = gamificationService.getProfile();
        if (!profile.unlockedBadgeIds.includes('arena_champ')) {
          profile.unlockedBadgeIds.push('arena_champ');
        }
      } else if (humanRank === 2) {
        xpAwarded = 250;
        coinsAwarded = 60;
      } else if (humanRank === 3) {
        xpAwarded = 180;
        coinsAwarded = 40;
      } else {
        xpAwarded = 100;
        coinsAwarded = 25;
      }

      gamificationService.awardXp(xpAwarded, `GlowArena Tournament (${room.title})`);
    }

    return {
      room: JSON.parse(JSON.stringify(room)),
      leaderboard,
      winner,
      humanRank,
      xpAwarded,
      coinsAwarded,
    };
  }

  /**
   * Resets room back to lobby
   */
  public resetRoom(roomId: string): ArenaRoom {
    const original = SAMPLE_ARENA_ROOMS.find(r => r.id === roomId);
    const room = this.rooms.find(r => r.id === roomId);
    if (room && original) {
      Object.assign(room, JSON.parse(JSON.stringify(original)));
    }
    return JSON.parse(JSON.stringify(room || original));
  }
}

export const arenaService = new ArenaService();
