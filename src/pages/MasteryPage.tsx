import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  User, 
  Award, 
  Flame, 
  ShieldCheck, 
  Swords, 
  Compass 
} from 'lucide-react';
import { MasteryTreeView } from '@/features/gamification/components/MasteryTreeView';
import { StreakCounterWidget } from '@/features/gamification/components/StreakCounterWidget';
import { AvatarCustomizerModal } from '@/features/gamification/components/AvatarCustomizerModal';
import { gamificationService } from '@/features/gamification/services/gamificationService';
import { StudentGamificationProfile } from '@/shared/types/gamification';
import { Link } from 'react-router-dom';

const MasteryPage = () => {
  const [profile, setProfile] = useState<StudentGamificationProfile>(() => gamificationService.getProfile());
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const badges = gamificationService.getBadges();

  const handleProfileUpdated = (updated: StudentGamificationProfile) => {
    setProfile(updated);
  };

  const progression = gamificationService.calculateLevelProgression(profile.xp);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-grow container-custom pt-24 pb-12 space-y-8">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-white/30 backdrop-blur-sm">
                  {profile.avatar.equippedTitle || 'Junior Scholar'}
                </Badge>
                <Badge className="bg-amber-400 text-amber-950 font-bold border-none">
                  House {profile.house}
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {profile.name}&apos;s Mastery Constellation
              </h1>
              <p className="text-blue-100 text-sm max-w-xl">
                Master core curriculum standards, maintain daily study streaks, unlock badges, and customize your scholar avatar.
              </p>
            </div>

            {/* Level & XP Gauge */}
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 w-full md:w-72 space-y-3 shrink-0">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-amber-300" />
                  Level {profile.level}
                </span>
                <span className="text-amber-300 font-extrabold">{profile.xp} XP</span>
              </div>

              <Progress value={progression.progressPercentage} className="h-2.5 bg-white/20" />

              <div className="flex justify-between items-center text-xs text-blue-200">
                <span>{progression.progressPercentage}% to Level {profile.level + 1}</span>
                <span>{progression.nextLevelXp} XP</span>
              </div>

              <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {profile.glowCoins} Coins
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs font-bold bg-white text-indigo-900 hover:bg-white/90"
                  onClick={() => setIsAvatarModalOpen(true)}
                >
                  <User className="w-3.5 h-3.5 mr-1" />
                  Wardrobe
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links & Streak Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StreakCounterWidget onProfileUpdated={handleProfileUpdated} />
          </div>

          {/* GlowArena Invitation Card */}
          <Card className="border shadow-sm bg-gradient-to-br from-red-500/10 via-amber-500/5 to-card flex flex-col justify-between">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-red-500/15 text-red-600">
                  <Swords className="w-6 h-6" />
                </span>
                <Badge className="bg-red-600 text-white text-xs">Live Arena</Badge>
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">GlowArena Championship</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Speed-quiz battle against classmates and automated challengers. Win XP and medals!
                </p>
              </div>
              <Link to="/arena" className="block pt-2">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-9 text-xs">
                  Enter Multiplayer Arena
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Core Subject Mastery Tree Visualizer */}
        <div className="pt-4">
          <MasteryTreeView onNodePracticed={() => setProfile(gamificationService.getProfile())} />
        </div>

        {/* Achievement Badges Trophy Case */}
        <div className="space-y-4 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Academic Honors & Badge Showcase
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Earn badges by completing assessment milestones, maintaining streaks, and helping peers.
              </p>
            </div>
            <Badge variant="outline" className="font-bold">
              {profile.unlockedBadgeIds.length} / {badges.length} Unlocked
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {badges.map(b => {
              const isUnlocked = profile.unlockedBadgeIds.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all ${
                    isUnlocked
                      ? 'bg-amber-500/10 border-amber-300 text-foreground shadow-sm'
                      : 'bg-muted/30 border-border/60 opacity-60'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 bg-card border shadow-inner">
                    {isUnlocked ? (
                      b.category === 'streak' ? '🔥' : b.category === 'arena' ? '🏆' : b.category === 'academic' ? '🎯' : '🤝'
                    ) : (
                      '🔒'
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs truncate max-w-[120px]">{b.title}</h5>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-amber-600">
                    +{b.xpBonus} XP
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />

      {/* Avatar Modal */}
      <AvatarCustomizerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

export default MasteryPage;
