import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Check, Lock, Shield, User, Award } from 'lucide-react';
import { gamificationService } from '../services/gamificationService';
import { 
  StudentGamificationProfile, 
  AvatarItem, 
  AvatarItemType, 
  StudentAvatarConfig 
} from '@/shared/types/gamification';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: StudentGamificationProfile) => void;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<StudentGamificationProfile>(() => gamificationService.getProfile());
  const [items, setItems] = useState<AvatarItem[]>(() => gamificationService.getAvatarItems());
  const [activeTab, setActiveTab] = useState<AvatarItemType>('hat');
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentAvatar: StudentAvatarConfig = profile.avatar;

  const handleUnlockAndEquip = (item: AvatarItem) => {
    if (item.unlocked) {
      // Already unlocked, simply equip
      let updates: Partial<StudentAvatarConfig> = {};
      if (item.type === 'hat') updates = { equippedHat: item.id };
      if (item.type === 'outfit') updates = { equippedOutfit: item.id };
      if (item.type === 'aura') updates = { equippedAura: item.id };
      if (item.type === 'title') updates = { equippedTitle: item.name };

      const updated = gamificationService.equipAvatar(updates);
      setProfile(updated);
      setItems(gamificationService.getAvatarItems());
      if (onProfileUpdated) onProfileUpdated(updated);
      setFeedback(`Equipped ${item.name}!`);
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    // Attempt purchase
    const res = gamificationService.unlockAvatarItem(item.id);
    if (!res.success) {
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    // Auto-equip upon unlock
    let updates: Partial<StudentAvatarConfig> = {};
    if (item.type === 'hat') updates = { equippedHat: item.id };
    if (item.type === 'outfit') updates = { equippedOutfit: item.id };
    if (item.type === 'aura') updates = { equippedAura: item.id };
    if (item.type === 'title') updates = { equippedTitle: item.name };

    const updated = gamificationService.equipAvatar(updates);
    setProfile(updated);
    setItems(gamificationService.getAvatarItems());
    if (onProfileUpdated) onProfileUpdated(updated);
    setFeedback(`Unlocked and equipped ${item.name}!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const getEquippedItem = (type: AvatarItemType) => {
    if (type === 'hat') return items.find(i => i.id === currentAvatar.equippedHat);
    if (type === 'outfit') return items.find(i => i.id === currentAvatar.equippedOutfit);
    if (type === 'aura') return items.find(i => i.id === currentAvatar.equippedAura);
    if (type === 'title') return items.find(i => i.name === currentAvatar.equippedTitle);
    return undefined;
  };

  const filteredItems = items.filter(i => i.type === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <User className="w-5 h-5 text-education-primary" />
                Student Avatar Studio & Wardrobe
              </DialogTitle>
              <DialogDescription className="text-xs">
                Customize your academic identity. All items are earned through study milestones.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 font-bold text-amber-600 bg-amber-500/10 border border-amber-200">
                <Sparkles className="w-4 h-4 mr-1 text-amber-500" />
                {profile.glowCoins} Coins
              </Badge>
              <Badge variant="outline" className="font-bold">
                Level {profile.level}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Avatar Live Display (1/3 width) */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-amber-500/10 border border-border text-center">
            {/* Aura ring container */}
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl flex flex-col items-center justify-center bg-card relative overflow-hidden">
                {/* Aura indicator */}
                <span className="absolute top-1 text-2xl animate-pulse">
                  {getEquippedItem('aura')?.preview || '✨'}
                </span>

                {/* Hat */}
                <span className="text-3xl -mb-1 z-10">
                  {getEquippedItem('hat')?.preview || '🎓'}
                </span>

                {/* Face */}
                <div 
                  className="w-12 h-10 rounded-full flex items-center justify-center -mt-1 shadow-inner"
                  style={{ backgroundColor: currentAvatar.skinColor }}
                >
                  <span className="text-xs">😊</span>
                </div>

                {/* Outfit */}
                <span className="text-2xl -mt-1 z-10">
                  {getEquippedItem('outfit')?.preview || '🥋'}
                </span>
              </div>
            </div>

            <h4 className="font-bold text-base text-foreground">{profile.name}</h4>
            <Badge className="bg-education-primary text-white text-xs mt-1">
              {currentAvatar.equippedTitle || 'Junior Scholar'}
            </Badge>

            <div className="w-full mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>House:</span>
                <strong className="text-foreground">{profile.house}</strong>
              </div>
              <div className="flex justify-between">
                <span>House Points:</span>
                <strong className="text-foreground">+{profile.housePoints}</strong>
              </div>
            </div>
          </div>

          {/* Wardrobe Item Browser (2/3 width) */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-4 w-full bg-muted p-1 rounded-xl">
              {(['hat', 'outfit', 'aura', 'title'] as AvatarItemType[]).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}s
                </button>
              ))}
            </div>

            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {items.filter(i => i.type === activeTab).map(item => {
                  const isEquipped =
                    (item.type === 'hat' && currentAvatar.equippedHat === item.id) ||
                    (item.type === 'outfit' && currentAvatar.equippedOutfit === item.id) ||
                    (item.type === 'aura' && currentAvatar.equippedAura === item.id) ||
                    (item.type === 'title' && currentAvatar.equippedTitle === item.name);

                  const canAfford = profile.glowCoins >= item.coinCost;
                  const levelSatisfied = profile.level >= item.requiredLevel;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                        isEquipped
                          ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500'
                          : item.unlocked
                          ? 'border-border bg-card hover:border-blue-300'
                          : 'border-border/60 bg-muted/30 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl">{item.preview}</span>
                          {isEquipped ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] py-0">Equipped</Badge>
                          ) : item.unlocked ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                              Unlocked
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Lv {item.requiredLevel}
                            </Badge>
                          )}
                        </div>

                        <h5 className="font-bold text-xs text-foreground line-clamp-1">{item.name}</h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.coinCost === 0 ? 'Starter Free' : `${item.coinCost} Glow Coins`}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t">
                        {isEquipped ? (
                          <Button disabled size="sm" variant="ghost" className="w-full h-7 text-xs font-medium">
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Active
                          </Button>
                        ) : item.unlocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7 text-xs hover:bg-blue-50 text-blue-600"
                            onClick={() => handleUnlockAndEquip(item)}
                          >
                            Equip
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!levelSatisfied || !canAfford}
                            className={`w-full h-7 text-xs ${
                              levelSatisfied && canAfford
                                ? 'bg-amber-600 hover:bg-amber-700 text-white font-medium'
                                : 'bg-muted text-muted-foreground'
                            }`}
                            onClick={() => handleUnlockAndEquip(item)}
                          >
                            {!levelSatisfied
                              ? `Unlock at Lv ${item.requiredLevel}`
                              : !canAfford
                              ? 'Need More Coins'
                              : `Buy (${item.coinCost} Coins)`}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>



            {feedback && (
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-200 text-blue-800 text-xs font-semibold text-center animate-fadeIn">
                {feedback}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
