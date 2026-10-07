import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Shield, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { gamificationService } from '../services/gamificationService';
import { StudentGamificationProfile } from '@/shared/types/gamification';

interface StreakCounterWidgetProps {
  onProfileUpdated?: (profile: StudentGamificationProfile) => void;
  className?: string;
}

export const StreakCounterWidget: React.FC<StreakCounterWidgetProps> = ({
  onProfileUpdated,
  className = '',
}) => {
  const [profile, setProfile] = useState<StudentGamificationProfile>(() => gamificationService.getProfile());
  const [message, setMessage] = useState<string | null>(null);

  const handleRecordPractice = () => {
    const res = gamificationService.recordDailyActivity(undefined, 60);
    const updated = gamificationService.getProfile();
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
    setMessage(
      res.freezeConsumed
        ? 'Streak freeze saved your progress! Daily activity recorded.'
        : `Daily streak continued! Current streak: ${res.streakDays} days.`
    );
    setTimeout(() => setMessage(null), 3500);
  };

  const handleBuyFreeze = () => {
    const res = gamificationService.purchaseStreakFreeze(100);
    const updated = gamificationService.getProfile();
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);
    setMessage(res.message);
    setTimeout(() => setMessage(null), 3500);
  };

  // Generate 7-day timeline (last 6 days + today)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = i === 6;
    const record = profile.streakHistory.find(r => r.date === dateStr);
    return {
      dateStr,
      dayLabel,
      isToday,
      completed: !!record?.completed,
    };
  });

  return (
    <Card className={`border shadow-sm bg-gradient-to-br from-amber-500/5 to-orange-500/10 ${className}`}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-full bg-orange-500/10 text-orange-500">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold flex items-center space-x-2">
              <span>{profile.streakDays} Day Streak</span>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                Active
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Study daily to protect your flame</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{profile.glowCoins} Coins</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Weekly Day Rings */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map(d => (
            <div
              key={d.dateStr}
              className={`p-2 rounded-lg border flex flex-col items-center transition-all ${
                d.completed
                  ? 'bg-orange-500/20 border-orange-300 text-orange-700 font-bold'
                  : d.isToday
                  ? 'bg-blue-500/10 border-blue-300 text-blue-700'
                  : 'bg-muted/40 border-border text-muted-foreground'
              }`}
            >
              <span className="text-[10px] uppercase font-semibold">{d.dayLabel}</span>
              {d.completed ? (
                <CheckCircle2 className="w-4 h-4 text-orange-600 mt-1" />
              ) : (
                <Clock className="w-4 h-4 text-muted-foreground mt-1 opacity-50" />
              )}
            </div>
          ))}
        </div>

        {/* Freeze info & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>
              Freezes available: <strong>{profile.streakFreezesAvailable}/3</strong>
            </span>
            {profile.streakFreezesAvailable < 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-blue-600 hover:text-blue-700 p-1"
                onClick={handleBuyFreeze}
              >
                + Buy (100 coins)
              </Button>
            )}
          </div>

          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium w-full sm:w-auto"
            onClick={handleRecordPractice}
          >
            Record Study Session (+50 XP)
          </Button>
        </div>

        {message && (
          <div className="text-xs p-2 rounded bg-amber-100 text-amber-900 border border-amber-300 animate-fadeIn text-center font-medium">
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
