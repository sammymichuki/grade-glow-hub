import React, { useState, useEffect } from 'react';
import { Quiz, QuestionSubmission } from '@/shared/types/assessment';
import { AssessmentService } from '../services/assessmentService';
import { QuestionEvaluation } from '../lib/quizEvaluator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Clock, AlertCircle, RotateCcw, ArrowRight, ArrowLeft, Flag } from 'lucide-react';
import { toast } from 'sonner';

interface QuizRunnerProps {
  quiz: Quiz;
  studentId?: string;
  onComplete?: (score: number, passed: boolean) => void;
  onExit?: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  quiz,
  studentId = 'student-guest',
  onComplete,
  onExit,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionSubmission>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(
    (quiz.timeLimitMinutes || 10) * 60
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    questionEvaluations: QuestionEvaluation[];
  } | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (isSubmitted || timeRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          toast.warning("Time is up! Your answers have been submitted automatically.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeRemainingSeconds]);

  const currentQuestion = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round(((currentIdx + 1) / totalQuestions) * 100);

  // Option selection handlers
  const handleSingleChoiceSelect = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionIds: [optionId],
      },
    }));
  };

  const handleMultipleChoiceToggle = (optionId: string) => {
    const existing = answers[currentQuestion.id]?.selectedOptionIds || [];
    const updated = existing.includes(optionId)
      ? existing.filter((id) => id !== optionId)
      : [...existing, optionId];

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionIds: updated,
      },
    }));
  };

  const handleShortAnswerChange = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionIds: [],
        textAnswer: val,
      },
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmit = () => {
    const submissionResult = AssessmentService.submitQuiz(quiz, studentId, answers);
    if (submissionResult) {
      setResult({
        score: submissionResult.attempt.score,
        maxScore: submissionResult.attempt.maxScore,
        percentage: submissionResult.attempt.percentage,
        passed: submissionResult.attempt.passed,
        questionEvaluations: submissionResult.questionEvaluations,
      });
      setIsSubmitted(true);
      onComplete?.(submissionResult.attempt.percentage, submissionResult.attempt.passed);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setFlaggedQuestions({});
    setCurrentIdx(0);
    setIsSubmitted(false);
    setResult(null);
    setTimeRemainingSeconds((quiz.timeLimitMinutes || 10) * 60);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RESULTS SCREEN ---
  if (isSubmitted && result) {
    return (
      <Card className="w-full max-w-3xl mx-auto shadow-md">
        <CardHeader className="text-center pb-4 border-b">
          <div className="flex justify-center mb-2">
            {result.passed ? (
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {result.passed ? 'Quiz Passed! Congratulations 🎉' : 'Needs Practice! Keep Trying 💪'}
          </CardTitle>
          <p className="text-gray-500">{quiz.title}</p>
          <div className="flex justify-center items-center gap-4 mt-3">
            <Badge variant={result.passed ? 'default' : 'destructive'} className="text-base px-3 py-1">
              Score: {result.score} / {result.maxScore} ({result.percentage}%)
            </Badge>
            <span className="text-sm text-gray-500">Passing Grade: {quiz.passingScorePercent}%</span>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <h3 className="font-semibold text-lg">Question Review & Explanations:</h3>
          {quiz.questions.map((q, idx) => {
            const evaluation = result.questionEvaluations.find((e) => e.questionId === q.id);
            const userSub = answers[q.id];
            const isCorrect = evaluation?.isCorrect;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-lg border ${
                  isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-gray-900">
                    {idx + 1}. {q.prompt}
                  </span>
                  <Badge variant={isCorrect ? 'default' : 'destructive'}>
                    {evaluation?.pointsEarned || 0} / {q.points} pts
                  </Badge>
                </div>

                {/* Question Option Review */}
                <div className="space-y-1 text-sm pl-2 mt-2">
                  {q.type === 'short_answer' ? (
                    <p className="text-gray-700">
                      Your answer:{' '}
                      <span className="font-mono font-medium">{userSub?.textAnswer || '(blank)'}</span>
                    </p>
                  ) : (
                    q.options.map((opt) => {
                      const isSelected = userSub?.selectedOptionIds?.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 p-1.5 rounded ${
                            opt.isCorrect
                              ? 'text-green-800 font-semibold bg-green-100/60'
                              : isSelected
                              ? 'text-red-700 line-through bg-red-100/60'
                              : 'text-gray-600'
                          }`}
                        >
                          <span>{opt.isCorrect ? '✓' : isSelected ? '✕' : '•'}</span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {evaluation?.feedback && (
                  <p className="mt-2 text-xs text-gray-600 italic bg-white/70 p-2 rounded border">
                    💡 Explanation: {evaluation.feedback}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={handleRestart} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Retake Quiz
          </Button>
          {onExit && (
            <Button onClick={onExit} className="gap-2">
              Back to Course <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // --- ACTIVE QUIZ RUNNER ---
  return (
    <Card className="w-full max-w-3xl mx-auto shadow-md">
      {/* Quiz Header & Timer */}
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-wider text-education-primary font-semibold">
              Checkpoint Assessment
            </span>
            <CardTitle className="text-xl font-bold">{quiz.title}</CardTitle>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-sm font-semibold border ${
              timeRemainingSeconds < 60
                ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeRemainingSeconds)}</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              Question {currentIdx + 1} of {totalQuestions}
            </span>
            <div className="flex items-center gap-3">
              {Object.values(flaggedQuestions).filter(Boolean).length > 0 && (
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <Flag className="w-3 h-3 fill-amber-500" />
                  {Object.values(flaggedQuestions).filter(Boolean).length} flagged
                </span>
              )}
              <span>{answeredCount} of {totalQuestions} answered</span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>

      {/* Question Content */}
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 leading-snug">
            {currentQuestion.prompt}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant={flaggedQuestions[currentQuestion.id] ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`gap-1.5 text-xs h-8 px-2.5 ${
                flaggedQuestions[currentQuestion.id]
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
              title="Flag question for review"
            >
              <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentQuestion.id] ? 'fill-current' : ''}`} />
              {flaggedQuestions[currentQuestion.id] ? 'Flagged' : 'Flag'}
            </Button>
            <Badge variant="outline" className="shrink-0">
              {currentQuestion.points} pts
            </Badge>
          </div>
        </div>

        {/* Render question based on type */}
        <div className="space-y-3 mt-4">
          {currentQuestion.type === 'single_choice' &&
            currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id]?.selectedOptionIds?.includes(option.id);
              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => handleSingleChoiceSelect(option.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-education-primary bg-education-primary/10 text-education-primary font-medium'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span>{option.text}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-education-primary bg-education-primary' : 'border-gray-400'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}

          {currentQuestion.type === 'multiple_choice' &&
            currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id]?.selectedOptionIds?.includes(option.id);
              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => handleMultipleChoiceToggle(option.id)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-education-primary bg-education-primary/10 text-education-primary font-medium'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <span>{option.text}</span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected ? 'border-education-primary bg-education-primary text-white' : 'border-gray-400'
                    }`}
                  >
                    {isSelected && <span className="text-xs">✓</span>}
                  </div>
                </button>
              );
            })}

          {currentQuestion.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id]?.selectedOptionIds?.includes(opt.id);
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="lg"
                    className="h-16 text-base font-semibold"
                    onClick={() => handleSingleChoiceSelect(opt.id)}
                  >
                    {opt.text}
                  </Button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'short_answer' && (
            <div className="space-y-2">
              <Input
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id]?.textAnswer || ''}
                onChange={(e) => handleShortAnswerChange(e.target.value)}
                className="text-base py-3"
              />
              <p className="text-xs text-gray-500">Answers are not case sensitive.</p>
            </div>
          )}
        </div>

        {/* Quick jump question numbers */}
        <div className="flex items-center gap-2 justify-center mt-8 pt-4 border-t flex-wrap">
          {quiz.questions.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isFlagged = !!flaggedQuestions[q.id];
            const isCurrent = idx === currentIdx;

            return (
              <div key={q.id} className="relative">
                <button
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'ring-2 ring-education-primary bg-education-primary text-white'
                      : isAnswered
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
                {isFlagged && (
                  <span
                    aria-label={`Question ${idx + 1} flagged for review`}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white ring-1 ring-amber-400"
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Navigation Footer */}
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </Button>

        {currentIdx < totalQuestions - 1 ? (
          <Button
            onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
            className="gap-1.5"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
          >
            Submit Quiz
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
