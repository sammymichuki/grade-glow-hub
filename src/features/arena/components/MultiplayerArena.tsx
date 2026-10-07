import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Swords, 
  Flame, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Users, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { ArenaRoom, ArenaParticipant, ArenaQuestion } from '@/shared/types/gamification';
import { arenaService } from '../services/arenaService';
import { gamificationService } from '@/features/gamification/services/gamificationService';

export const MultiplayerArena: React.FC = () => {
  const [rooms, setRooms] = useState<ArenaRoom[]>(() => arenaService.getRooms());
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [activeRoom, setActiveRoom] = useState<ArenaRoom | null>(() => arenaService.getRoom(selectedRoomId) || null);
  const [participantId, setParticipantId] = useState<string>('player-local');
  const [playerName, setPlayerName] = useState<string>(() => gamificationService.getProfile().name);

  // Question state
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{ isCorrect: boolean; points: number } | null>(null);
  const [finalSummary, setFinalSummary] = useState<{ winner: ArenaParticipant; humanRank?: number; xp: number; coins: number } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = arenaService.getRoom(roomId);
    setActiveRoom(room || null);
    setFinalSummary(null);
    setHasAnswered(false);
    setSelectedOptionId(null);
  };

  const handleJoinAndStart = () => {
    if (!selectedRoomId) return;

    // Join room
    const { room, participantId: pId } = arenaService.joinRoom(selectedRoomId, playerName, '🎓');
    setParticipantId(pId);

    // Start match
    const startedRoom = arenaService.startMatch(selectedRoomId);
    setActiveRoom(startedRoom);
    startQuestionTimer(startedRoom.questions[0]);
  };

  const startQuestionTimer = (question: ArenaQuestion) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(question.timeLimitSeconds);
    setHasAnswered(false);
    setSelectedOptionId(null);
    setLastSubmissionResult(null);
    questionStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeExpired = () => {
    if (!hasAnswered && activeRoom) {
      setHasAnswered(true);
      arenaService.simulateBotAnswers(activeRoom.id);
      const updated = arenaService.endQuestionRound(activeRoom.id);
      setActiveRoom(updated);
    }
  };

  const handleSubmitAnswer = (optionId: string) => {
    if (hasAnswered || !activeRoom) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setHasAnswered(true);
    setSelectedOptionId(optionId);
    const elapsedMs = Math.max(200, Date.now() - questionStartTimeRef.current);

    // Human answer
    const res = arenaService.submitAnswer(activeRoom.id, participantId, optionId, elapsedMs);
    setLastSubmissionResult({ isCorrect: res.isCorrect, points: res.pointsEarned });

    // Bot answers
    arenaService.simulateBotAnswers(activeRoom.id);

    // End round
    const updated = arenaService.endQuestionRound(activeRoom.id);
    setActiveRoom(updated);
  };

  const handleNextRound = () => {
    if (!activeRoom) return;

    if (activeRoom.currentQuestionIndex + 1 < activeRoom.questions.length) {
      const advanced = arenaService.advanceNext(activeRoom.id);
      setActiveRoom(advanced);
      startQuestionTimer(advanced.questions[advanced.currentQuestionIndex]);
    } else {
      // Conclude match
      const finish = arenaService.finishMatch(activeRoom.id, participantId);
      setActiveRoom(finish.room);
      setFinalSummary({
        winner: finish.winner,
        humanRank: finish.humanRank,
        xp: finish.xpAwarded,
        coins: finish.coinsAwarded,
      });
    }
  };

  const handleResetMatch = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!selectedRoomId) return;
    const reset = arenaService.resetRoom(selectedRoomId);
    setActiveRoom(reset);
    setFinalSummary(null);
    setHasAnswered(false);
    setSelectedOptionId(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentQuestion = activeRoom?.questions[activeRoom.currentQuestionIndex];
  const sortedParticipants = activeRoom ? [...activeRoom.participants].sort((a, b) => b.score - a.score) : [];

  return (
    <div className="space-y-6">
      {/* Arena Title & Mode Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Swords className="w-6 h-6 text-red-500" />
            GlowArena Multiplayer Championship
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Test your subject speed and accuracy against live academic peers across schools.
          </p>
        </div>

        {activeRoom?.status !== 'lobby' && (
          <Button variant="outline" size="sm" onClick={handleResetMatch} className="self-start sm:self-auto">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Exit to Lobby
          </Button>
        )}
      </div>

      {/* LOBBY VIEW */}
      {activeRoom?.status === 'lobby' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Room Selector (1/3 width) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              Available Arenas
            </h4>
            {rooms.map(r => (
              <div
                key={r.id}
                onClick={() => handleSelectRoom(r.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  r.id === selectedRoomId
                    ? 'border-red-500 bg-red-500/5 ring-1 ring-red-500 shadow-sm'
                    : 'border-border bg-card hover:border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">{r.grade}</Badge>
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {r.participants.length + 1} Challengers
                  </span>
                </div>
                <h5 className="font-bold text-sm text-foreground">{r.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">{r.subject} • {r.totalQuestions} Questions</p>
              </div>
            ))}
          </div>

          {/* Selected Room Stage & Start Action (2/3 width) */}
          <div className="md:col-span-2">
            <Card className="border shadow-md bg-gradient-to-br from-red-500/5 via-amber-500/5 to-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-red-600 text-white">{activeRoom.grade}</Badge>
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Max 350 XP Prize
                  </span>
                </div>
                <CardTitle className="text-xl font-bold mt-2">{activeRoom.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Fast answers grant up to 1,000 points per question. Streaks trigger 1.3x multipliers.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-500" />
                    Participants in Lobby ({activeRoom.participants.length + 1})
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Human Player */}
                    <div className="p-3 rounded-xl border-2 border-dashed border-blue-400 bg-blue-500/10 flex items-center gap-2.5">
                      <span className="text-2xl">🎓</span>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate text-foreground">{playerName} (You)</p>
                        <span className="text-[10px] text-blue-600 font-semibold">Challenger</span>
                      </div>
                    </div>

                    {/* Bot Participants */}
                    {activeRoom.participants.map(p => (
                      <div key={p.id} className="p-3 rounded-xl border bg-card flex items-center gap-2.5">
                        <span className="text-2xl">{p.avatarIcon}</span>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold truncate text-foreground">{p.name}</p>
                          <span className="text-[10px] text-muted-foreground">Ready</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    15s countdown per question • Live scoring & podium
                  </div>
                  <Button
                    onClick={handleJoinAndStart}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 h-10 shadow-md"
                  >
                    Enter Arena & Start Tournament
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* QUESTION ACTIVE & ROUND REVIEW VIEW */}
      {(activeRoom?.status === 'question_active' || activeRoom?.status === 'round_review') && currentQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Board (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border shadow-md">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-bold text-xs">
                    Question {activeRoom.currentQuestionIndex + 1} of {activeRoom.totalQuestions}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-500 animate-ping' : 'text-blue-500'}`} />
                    <span className={`text-sm font-extrabold ${timeLeft <= 5 ? 'text-red-600' : 'text-foreground'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                {/* Progress bar for timer */}
                <Progress 
                  value={(timeLeft / currentQuestion.timeLimitSeconds) * 100} 
                  className={`h-2 mt-2 ${timeLeft <= 5 ? 'bg-red-100' : ''}`} 
                />

                <CardTitle className="text-lg font-bold mt-4 leading-snug">
                  {currentQuestion.prompt}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map(option => {
                    const isSelected = selectedOptionId === option.id;
                    const isRoundReview = activeRoom.status === 'round_review';
                    const isCorrect = option.isCorrect;

                    let btnStyle = 'border-border bg-card hover:border-blue-400 hover:bg-blue-50/50';

                    if (isRoundReview) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-500/15 text-emerald-900 font-bold ring-2 ring-emerald-500';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'border-red-500 bg-red-500/15 text-red-900 line-through ring-2 ring-red-500';
                      } else {
                        btnStyle = 'border-border/60 bg-muted/40 opacity-60';
                      }
                    } else if (isSelected) {
                      btnStyle = 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-600';
                    }

                    return (
                      <button
                        key={option.id}
                        disabled={hasAnswered}
                        onClick={() => handleSubmitAnswer(option.id)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between text-sm ${btnStyle}`}
                      >
                        <span>{option.text}</span>
                        {isRoundReview && isCorrect && (
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 ml-2" />
                        )}
                        {isRoundReview && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Post-answer feedback & Round explanation */}
                {activeRoom.status === 'round_review' && (
                  <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wide text-blue-700">
                        Explanation & Solution
                      </span>
                      {lastSubmissionResult && (
                        <Badge className={lastSubmissionResult.isCorrect ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}>
                          {lastSubmissionResult.isCorrect ? `+${lastSubmissionResult.points} Pts` : '0 Pts'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}

                {/* Next Question Action */}
                {activeRoom.status === 'round_review' && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={handleNextRound}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-10"
                    >
                      <span>{activeRoom.currentQuestionIndex + 1 < activeRoom.totalQuestions ? 'Next Round' : 'View Final Podium'}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Ranking Board (1/3 width) */}
          <div>
            <Card className="border shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Live Match Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {sortedParticipants.map((p, idx) => {
                  const isHuman = p.id === participantId;
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isHuman
                          ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500 font-bold'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <span className="font-extrabold text-sm w-5 text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <span className="text-xl">{p.avatarIcon}</span>
                        <div className="truncate">
                          <p className="text-xs truncate">{p.name} {isHuman && '(You)'}</p>
                          {p.streak > 1 && (
                            <span className="text-[10px] text-orange-600 font-semibold flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                              {p.streak}x streak
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold">{p.score}</span>
                        <span className="text-[10px] text-muted-foreground block">pts</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* GAME OVER & PODIUM VIEW */}
      {activeRoom?.status === 'game_over' && finalSummary && (
        <Card className="border shadow-xl bg-gradient-to-b from-amber-500/10 via-card to-card text-center p-8">
          <CardContent className="space-y-6 max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-4xl shadow-inner">
              🏆
            </div>

            <div>
              <h3 className="text-2xl font-extrabold">Match Complete!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Winner: <strong className="text-foreground">{finalSummary.winner.name}</strong> with {finalSummary.winner.score} pts!
              </p>
            </div>

            {/* Human result badge */}
            <div className="p-4 rounded-2xl bg-muted/50 border space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🎖️</span>
                <span className="text-base font-bold">
                  You placed #{finalSummary.humanRank || 1} out of {sortedParticipants.length}
                </span>
              </div>
              <div className="flex justify-center gap-4 text-xs font-semibold pt-1">
                <Badge variant="secondary" className="px-3 py-1 text-amber-600 bg-amber-500/10">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  +{finalSummary.xp} XP Earned
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 text-orange-600 bg-orange-500/10">
                  +{finalSummary.coins} Glow Coins
                </Badge>
              </div>
            </div>

            {/* Podium list */}
            <div className="space-y-2 text-left">
              <h5 className="text-xs font-bold uppercase text-muted-foreground">Final Standings</h5>
              {sortedParticipants.map((p, idx) => (
                <div key={p.id} className="p-3 rounded-xl border flex items-center justify-between bg-card text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <strong className="text-sm">{p.score} pts</strong>
                </div>
              ))}
            </div>

            <Button
              onClick={handleResetMatch}
              className="w-full bg-education-primary hover:bg-education-primary/90 text-white font-bold h-11"
            >
              Play Again or Select New Arena
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
