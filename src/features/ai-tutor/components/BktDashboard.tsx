import React, { useState } from 'react';
import {
  TrendingUp,
  Brain,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BktEngine, DEFAULT_BKT_PARAMETERS } from '../services/bktEngine';
import { BktSkillState } from '../types/aiTutor';

const INITIAL_SKILLS: BktSkillState[] = [
  BktEngine.createSkill('skill-frac-add', 'Adding Fractions with Unlike Denominators', 'Mathematics', {
    priorMastery: 0.35,
    probabilityOfLearn: 0.18,
    probabilityOfGuess: 0.22,
    probabilityOfSlip: 0.08,
  }),
  BktEngine.createSkill('skill-sci-photo', 'Light Reactions & Calvin Cycle', 'Integrated Science', {
    priorMastery: 0.55,
    probabilityOfLearn: 0.15,
    probabilityOfGuess: 0.20,
    probabilityOfSlip: 0.10,
  }),
  BktEngine.createSkill('skill-eng-thesis', 'Formulating Persuasive Thesis Statements', 'English Language Arts', {
    priorMastery: 0.72,
    probabilityOfLearn: 0.12,
    probabilityOfGuess: 0.25,
    probabilityOfSlip: 0.09,
  }),
  BktEngine.createSkill('skill-math-slope', 'Calculating Line Gradients & Intercepts', 'Mathematics', {
    priorMastery: 0.28,
    probabilityOfLearn: 0.20,
    probabilityOfGuess: 0.20,
    probabilityOfSlip: 0.10,
  }),
];

export const BktDashboard: React.FC = () => {
  const [skills, setSkills] = useState<BktSkillState[]>(INITIAL_SKILLS);
  const [selectedSkillId, setSelectedSkillId] = useState<string>(INITIAL_SKILLS[0].skillId);

  const selectedSkill = skills.find(s => s.skillId === selectedSkillId) || skills[0];

  const handleSimulateAnswer = (isCorrect: boolean) => {
    setSkills(prev =>
      prev.map(s => {
        if (s.skillId === selectedSkill.skillId) {
          return BktEngine.updateMastery(s, isCorrect);
        }
        return s;
      })
    );
  };

  const handleResetSkill = () => {
    setSkills(prev =>
      prev.map(s => {
        if (s.skillId === selectedSkill.skillId) {
          return BktEngine.createSkill(s.skillId, s.skillName, s.subject, {
            priorMastery: s.priorMastery,
            probabilityOfLearn: s.probabilityOfLearn,
            probabilityOfGuess: s.probabilityOfGuess,
            probabilityOfSlip: s.probabilityOfSlip,
          });
        }
        return s;
      })
    );
  };

  const curriculumStats = BktEngine.calculateCurriculumIndex(skills);

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase">Avg Curriculum Mastery</span>
            <h4 className="text-xl font-bold text-gray-900">
              {Math.round(curriculumStats.averageMastery * 100)}%
            </h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase">Mastered Competencies</span>
            <h4 className="text-xl font-bold text-emerald-700">
              {curriculumStats.masteredCount} / {skills.length}
            </h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase">Proficient Micro-Skills</span>
            <h4 className="text-xl font-bold text-blue-700">
              {curriculumStats.proficientCount} skills
            </h4>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase">Developing / Novice</span>
            <h4 className="text-xl font-bold text-amber-700">
              {curriculumStats.developingCount + curriculumStats.noviceCount} skills
            </h4>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Skill Selector & Progress Bars */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
            Tracked Curriculum Micro-Skills
          </h3>

          <div className="space-y-2.5">
            {skills.map(skill => {
              const isSelected = skill.skillId === selectedSkill.skillId;
              const pct = Math.round(skill.currentMastery * 100);

              const badgeColor =
                skill.masteryLevel === 'Mastered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : skill.masteryLevel === 'Proficient'
                  ? 'bg-blue-100 text-blue-800'
                  : skill.masteryLevel === 'Developing'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800';

              return (
                <div
                  key={skill.skillId}
                  onClick={() => setSelectedSkillId(skill.skillId)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-white shadow-md ring-1 ring-purple-600'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400 font-medium">{skill.subject}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                      {skill.masteryLevel}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{skill.skillName}</h4>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>P(L_t) Probability</span>
                      <span className="font-bold text-purple-700">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Interactive Simulation & Mathematical Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs text-purple-700 font-bold uppercase tracking-wider">
                  {selectedSkill.subject} Micro-Skill
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">{selectedSkill.skillName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Adaptive assessment engine calibrated for Grades 4–9
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSkill}
                className="text-xs text-gray-500"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            </div>

            {/* Live Master Probability Gauge */}
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium">Posterior Mastery Probability</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-extrabold text-purple-900">
                    {Math.round(selectedSkill.currentMastery * 100)}%
                  </span>
                  <span className="text-xs font-semibold text-purple-700">
                    (Level: {selectedSkill.masteryLevel})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-500 font-medium">Recommended Difficulty</span>
                <div className="mt-0.5">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedSkill.recommendedDifficulty === 'Easy'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedSkill.recommendedDifficulty === 'Medium'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedSkill.recommendedDifficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulation Controller */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Simulate Student Practice Response
              </label>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleSimulateAnswer(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 shadow-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Correct Response (+Mastery)
                </Button>
                <Button
                  onClick={() => handleSimulateAnswer(false)}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 shadow-sm"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Incorrect Response (-Slip Penalty)
                </Button>
              </div>
            </div>

            {/* BKT Parameter Matrix */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100 text-center">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">P(L_0) Prior</p>
                <p className="text-sm font-bold text-gray-800">{selectedSkill.priorMastery}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">P(T) Learning</p>
                <p className="text-sm font-bold text-gray-800">{selectedSkill.probabilityOfLearn}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">P(G) Guess</p>
                <p className="text-sm font-bold text-gray-800">{selectedSkill.probabilityOfGuess}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">P(S) Slip</p>
                <p className="text-sm font-bold text-gray-800">{selectedSkill.probabilityOfSlip}</p>
              </div>
            </div>

            {/* Observation History Feed */}
            {selectedSkill.history.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Observation Trace ({selectedSkill.history.length} responses)
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedSkill.history.map((h, idx) => (
                    <span
                      key={idx}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        h.isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {h.isCorrect ? '✓' : '✗'} #{idx + 1} ({Math.round(h.updatedMastery * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BktDashboard;
