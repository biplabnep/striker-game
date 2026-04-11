'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trophy, CheckCircle2, XCircle, Clock, TrendingUp, Award, Flag, Star, Shield } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SeasonObjectivesSet, SeasonObjective, ObjectiveCategory } from '@/lib/game/types';
import {
  getBoardExpectationLabel,
  getBoardExpectationColor,
  getBoardExpectationBg,
  calculateObjectiveBonus,
} from '@/lib/game/objectivesEngine';

// ============================================================
// Objective Card Sub-Component
// ============================================================
function ObjectiveCard({ objective, index }: { objective: SeasonObjective; index: number }) {
  const progress = Math.min(100, objective.title === 'League Position'
    ? ((20 - objective.current) / (20 - objective.target)) * 100
    : (objective.current / objective.target) * 100
  );

  const isCompleted = objective.status === 'completed';
  const isFailed = objective.status === 'failed';

  const categoryConfig: Record<ObjectiveCategory, { color: string; bg: string; border: string; label: string }> = {
    board: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Board' },
    personal: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Personal' },
    bonus: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Bonus' },
  };

  const config = categoryConfig[objective.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`relative rounded-lg border ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : isFailed ? 'border-red-500/20 bg-red-500/5' : 'border-[#30363d] bg-[#161b22]/60'} p-3 transition-all hover:border-slate-600/50`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center text-lg`}>
          {objective.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
              {config.label}
            </span>
            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {isFailed && <XCircle className="w-3.5 h-3.5 text-red-400" />}
          </div>
          <h4 className="text-sm font-semibold text-[#c9d1d9] truncate">{objective.title}</h4>
          <p className="text-[11px] text-[#8b949e] mt-0.5">{objective.description}</p>

          {/* Progress Bar */}
          {!isCompleted && !isFailed && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-[#8b949e] mb-1">
                <span>
                  {objective.title === 'League Position'
                    ? `Current: ${objective.current}${getOrdinal(objective.current)}`
                    : objective.title === 'Performance Rating'
                      ? `Current: ${(objective.current / 10).toFixed(1)}`
                      : `${objective.current} / ${objective.target}`}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    progress >= 80 ? 'bg-emerald-500' : progress >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, progress)}%` }}
                  transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
                />
              </div>
            </div>
          )}

          {/* Reward */}
          <div className="flex items-center gap-1 mt-1.5">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-amber-400/80">
              Bonus: €{(objective.reward / 1000).toFixed(0)}K
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function SeasonObjectivesPanel() {
  const gameState = useGameStore((s) => s.gameState);

  const currentObjectives = useMemo(() => {
    if (!gameState) return null;
    const objectives = gameState.seasonObjectives ?? [];
    return objectives.find(o => o.season === gameState.currentSeason) ?? null;
  }, [gameState]);

  const completedCount = useMemo(() => {
    if (!currentObjectives) return 0;
    return currentObjectives.objectives.filter(o => o.status === 'completed').length;
  }, [currentObjectives]);

  const totalBonus = useMemo(() => {
    if (!currentObjectives) return 0;
    return calculateObjectiveBonus(currentObjectives);
  }, [currentObjectives]);

  const failedCount = useMemo(() => {
    if (!currentObjectives) return 0;
    return currentObjectives.objectives.filter(o => o.status === 'failed').length;
  }, [currentObjectives]);

  const boardObjectives = useMemo(() => {
    if (!currentObjectives) return [];
    return currentObjectives.objectives.filter(o => o.category === 'board');
  }, [currentObjectives]);

  const personalObjectives = useMemo(() => {
    if (!currentObjectives) return [];
    return currentObjectives.objectives.filter(o => o.category === 'personal');
  }, [currentObjectives]);

  const bonusObjectives = useMemo(() => {
    if (!currentObjectives) return [];
    return currentObjectives.objectives.filter(o => o.category === 'bonus');
  }, [currentObjectives]);

  if (!gameState || !currentObjectives) {
    return (
      <div className="px-4 py-6 text-center">
        <Target className="w-10 h-10 text-[#484f58] mx-auto mb-2" />
        <p className="text-sm text-[#8b949e]">No objectives set for this season</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-20 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h2 className="text-xl font-bold text-[#c9d1d9] flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Season Objectives
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">Season {currentObjectives.season}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg border ${getBoardExpectationBg(currentObjectives.boardExpectation)}`}>
          <span className={`text-xs font-semibold ${getBoardExpectationColor(currentObjectives.boardExpectation)}`}>
            {getBoardExpectationLabel(currentObjectives.boardExpectation)}
          </span>
        </div>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-4"
      >
        <Card className="bg-[#161b22] border-[#30363d] ">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
                <div className="text-[10px] text-[#8b949e] mt-0.5">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#c9d1d9]">
                  {currentObjectives.objectives.filter(o => o.status === 'in_progress').length}
                </div>
                <div className="text-[10px] text-[#8b949e] mt-0.5">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">€{totalBonus > 0 ? `${(totalBonus / 1000).toFixed(0)}K` : '0'}</div>
                <div className="text-[10px] text-[#8b949e] mt-0.5">Bonus Earned</div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-[#8b949e] mb-1">
                <span>Overall Progress</span>
                <span>{completedCount} / {currentObjectives.objectives.length}</span>
              </div>
              <Progress
                value={(completedCount / currentObjectives.objectives.length) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Board Objectives */}
      {boardObjectives.length > 0 && (
        <ObjectiveSection
          title="Board Expectations"
          icon={<Flag className="w-4 h-4 text-amber-400" />}
          objectives={boardObjectives}
          startIndex={0}
        />
      )}

      {/* Personal Objectives */}
      {personalObjectives.length > 0 && (
        <ObjectiveSection
          title="Personal Targets"
          icon={<Star className="w-4 h-4 text-emerald-400" />}
          objectives={personalObjectives}
          startIndex={boardObjectives.length}
        />
      )}

      {/* Bonus Objectives */}
      {bonusObjectives.length > 0 && (
        <ObjectiveSection
          title="Bonus Goals"
          icon={<Award className="w-4 h-4 text-purple-400" />}
          objectives={bonusObjectives}
          startIndex={boardObjectives.length + personalObjectives.length}
        />
      )}

      {/* Failed Objectives Summary */}
      {failedCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5"
        >
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">{failedCount} Failed</span>
          </div>
          <p className="text-[11px] text-red-400/70">Some objectives were not met. Keep pushing next season!</p>
        </motion.div>
      )}
    </div>
  );
}

// ============================================================
// Objective Section Sub-Component
// ============================================================
function ObjectiveSection({
  title,
  icon,
  objectives,
  startIndex,
}: {
  title: string;
  icon: React.ReactNode;
  objectives: SeasonObjective[];
  startIndex: number;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-[#c9d1d9]">{title}</h3>
      </div>
      <div className="space-y-2">
        {objectives.map((obj, i) => (
          <ObjectiveCard key={obj.id} objective={obj} index={startIndex + i} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Helper: Ordinal suffix
// ============================================================
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
