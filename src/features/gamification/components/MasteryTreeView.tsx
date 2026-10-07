import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lock, 
  CheckCircle, 
  Star, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  Compass, 
  Award,
  TrendingUp 
} from 'lucide-react';
import { MasterySubject, MasteryNode } from '@/shared/types/gamification';
import { gamificationService } from '../services/gamificationService';

interface MasteryTreeViewProps {
  onNodePracticed?: (node: MasteryNode) => void;
}

export const MasteryTreeView: React.FC<MasteryTreeViewProps> = ({ onNodePracticed }) => {
  const [subjects, setSubjects] = useState<MasterySubject[]>(() => gamificationService.getMasterySubjects());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [activeNode, setActiveNode] = useState<MasteryNode | null>(null);
  const [simulationScore, setSimulationScore] = useState<number>(90);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const handleSelectNode = (node: MasteryNode) => {
    setActiveNode(node);
    setSimulationScore(node.masteryScore > 0 ? node.masteryScore : 85);
    setFeedbackMessage(null);
  };

  const handleCompleteMastery = () => {
    if (!activeNode || !activeSubject) return;

    const res = gamificationService.updateNodeMastery(activeSubject.id, activeNode.id, simulationScore);
    const xpAwarded = Math.round((simulationScore / 100) * activeNode.xpReward);
    gamificationService.awardXp(xpAwarded, `Mastery: ${activeNode.title}`);

    // Refresh subjects
    const updatedSubjects = gamificationService.getMasterySubjects();
    setSubjects(updatedSubjects);

    // Update active node
    const updatedSubject = updatedSubjects.find(s => s.id === activeSubject.id);
    const updatedActiveNode = updatedSubject?.nodes.find(n => n.id === activeNode.id) || null;
    setActiveNode(updatedActiveNode);

    if (onNodePracticed && updatedActiveNode) {
      onNodePracticed(updatedActiveNode);
    }

    if (res.unlockedSuccessors.length > 0) {
      setFeedbackMessage(
        `Score saved (${simulationScore}%)! Awarded ${xpAwarded} XP. Unlocked ${res.unlockedSuccessors.length} new node(s): ${res.unlockedSuccessors.map(n => n.title).join(', ')}!`
      );
    } else {
      setFeedbackMessage(`Skill score updated to ${simulationScore}%. Awarded ${xpAwarded} XP!`);
    }
  };

  const calculateSubjectProgress = (subject: MasterySubject) => {
    if (!subject.nodes.length) return 0;
    const totalScore = subject.nodes.reduce((acc, n) => acc + n.masteryScore, 0);
    return Math.round(totalScore / subject.nodes.length);
  };

  return (
    <div className="space-y-6">
      {/* Subject Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {subjects.map(s => {
          const isSelected = s.id === activeSubject.id;
          const progress = calculateSubjectProgress(s);
          return (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSubjectId(s.id);
                setActiveNode(null);
                setFeedbackMessage(null);
              }}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2.5 transition-all ${
                isSelected
                  ? 'bg-education-primary text-white shadow-md'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{s.name}</span>
              <Badge variant="outline" className={`text-xs ml-1 ${isSelected ? 'border-white/40 text-white' : ''}`}>
                {progress}%
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Subject Header & Stats */}
      {activeSubject && (
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-purple-600/10 p-6 rounded-2xl border border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{activeSubject.name} Mastery Tree</h2>
                <Badge variant="secondary">{activeSubject.gradeLevel}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Visual syllabus constellation. Master foundational nodes to unlock advanced domains.
              </p>
            </div>
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Domain Mastery</span>
                <span>{calculateSubjectProgress(activeSubject)}%</span>
              </div>
              <Progress value={calculateSubjectProgress(activeSubject)} className="h-2.5" />
            </div>
          </div>
        </div>
      )}

      {/* Node Tree Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Constellation Nodes List (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {activeSubject?.nodes.map((node, index) => {
            const isSelected = activeNode?.id === node.id;
            const isLocked = node.status === 'locked';
            const isMastered = node.status === 'mastered';
            const isCompleted = node.status === 'completed';

            return (
              <div
                key={node.id}
                onClick={() => !isLocked && handleSelectNode(node)}
                className={`relative p-5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5 shadow-md'
                    : isLocked
                    ? 'border-border/60 bg-muted/30 opacity-70 cursor-not-allowed'
                    : 'border-border hover:border-blue-300 hover:shadow-sm bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    {/* Step order circle */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isMastered
                          ? 'bg-amber-500/20 text-amber-600 border border-amber-300'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-300'
                          : isLocked
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-blue-500/20 text-blue-600 border border-blue-300'
                      }`}
                    >
                      {isMastered ? (
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                      ) : isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : isLocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                        {node.title}
                        {isMastered && (
                          <Badge className="bg-amber-500 text-white text-[10px] py-0">Mastered</Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-emerald-600 text-white text-[10px] py-0">Completed</Badge>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {node.description}
                      </p>

                      {/* Prerequisites info */}
                      {node.prerequisites.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground">
                          <span className="font-semibold">Prerequisites:</span>
                          {node.prerequisites.map(pId => {
                            const pNode = activeSubject.nodes.find(n => n.id === pId);
                            return (
                              <Badge key={pId} variant="outline" className="text-[10px] px-1.5 py-0">
                                {pNode?.title || pId}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score & Reward badge */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+{node.xpReward} XP</span>
                    </div>
                    <div className="text-sm font-extrabold mt-1">
                      {isLocked ? (
                        <span className="text-xs text-muted-foreground">Locked</span>
                      ) : (
                        <span>{node.masteryScore}%</span>
                      )}
                    </div>
                  </div>
                </div>

                {!isLocked && (
                  <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Click to inspect & practice node</span>
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Node Detail & Practice Studio (1/3 width) */}
        <div>
          {activeNode ? (
            <Card className="border shadow-md sticky top-24">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Topic #{activeNode.order}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{activeNode.xpReward} XP</span>
                  </div>
                </div>
                <CardTitle className="text-lg font-bold mt-2">{activeNode.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{activeNode.description}</p>
              </CardHeader>

              <CardContent className="pt-4 space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Current Mastery Status</span>
                    <span className="capitalize">{activeNode.status.replace('_', ' ')}</span>
                  </div>
                  <Progress value={activeNode.masteryScore} className="h-2" />
                </div>

                {/* Practice Simulation Drawer */}
                <div className="p-3.5 bg-muted/40 rounded-xl border space-y-3">
                  <h5 className="text-xs font-bold flex items-center gap-1.5 uppercase text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Interactive Mastery Assessment
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Demonstrate competence on this curriculum node to raise mastery score and unlock advanced chapters.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex justify-between">
                      <span>Simulated Assessment Score</span>
                      <strong className="text-blue-600">{simulationScore}%</strong>
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      step="5"
                      value={simulationScore}
                      onChange={e => setSimulationScore(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <Button
                    onClick={handleCompleteMastery}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9"
                  >
                    Submit Practice Score & Earn XP
                  </Button>
                </div>

                {feedbackMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-300 text-emerald-800 text-xs font-medium animate-fadeIn">
                    {feedbackMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <h4 className="font-bold text-sm text-foreground">Select an Unlocked Node</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Click any available curriculum milestone on the left to inspect its prerequisites and practice.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
