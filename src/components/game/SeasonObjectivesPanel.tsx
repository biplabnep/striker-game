'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Trophy, CheckCircle2, XCircle, Clock, TrendingUp, Award, Flag, Star,
  Shield, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Minus, ThumbsUp, ThumbsDown,
  AlertTriangle, Meh, Sparkles, Users,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SeasonObjectivesSet, SeasonObjective, ObjectiveCategory } from '@/lib/game/types';
import {
  getBoardExpectationLabel,
  getBoardExpectationColor,
  getBoardExpectationBg,
  calculateObjectiveBonus,
} from '@/lib/game/objectivesEngine';

// ============================================================
// Category Tab Config
// ============================================================
type TabFilter = 'all' | 'board' | 'personal' | 'bonus';

const TAB_CONFIG: { key: TabFilter; label: string; icon: typeof Flag }[] = [
  { key: 'all', label: 'All', icon: Target },
  { key: 'board', label: 'Board', icon: Flag },
  { key: 'personal', label: 'Personal', icon: Star },
  { key: 'bonus', label: 'Bonus', icon: Award },
];

const CATEGORY_CONFIG: Record<ObjectiveCategory, { color: string; bg: string; border: string; label: string }> = {
  board: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Board' },
  personal: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Personal' },
  bonus: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Bonus' },
};

// ============================================================
// Board Satisfaction
// ============================================================
interface BoardSatisfaction {
  label: string;
  icon: typeof ThumbsUp;
  color: string;
  bg: string;
  barColor: string;
  message: string;
}

function getBoardSatisfaction(completionPct: number): BoardSatisfaction {
  if (completionPct >= 80) {
    return {
      label: 'Satisfied',
      icon: ThumbsUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      barColor: 'bg-emerald-500',
      message: 'The board is pleased with your progress',
    };
  }
  if (completionPct >= 50) {
    return {
      label: 'Neutral',
      icon: Meh,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      barColor: 'bg-amber-500',
      message: 'The board expects more from you',
    };
  }
  if (completionPct >= 25) {
    return {
      label: 'Concerned',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      barColor: 'bg-orange-500',
      message: 'The board is growing concerned',
    };
  }
  return {
    label: 'Displeased',
    icon: ThumbsDown,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    barColor: 'bg-red-500',
    message: 'The board is very unhappy with your performance',
  };
}

// ============================================================
// Helper: Ordinal suffix
// ============================================================
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ============================================================
// Helper: Get objective stat key from title
// ============================================================
function getObjectiveStatInfo(
  objective: SeasonObjective,
  totalMatchdays: number,
  currentWeek: number,
  seasonStats: { appearances: number; goals: number; assists: number; cleanSheets: number; averageRating: number }
): { needed: number; remaining: number; avgPerWeek: string; currentDisplay: string; unit: string } | null {
  const remaining = Math.max(0, totalMatchdays - currentWeek);
  const isInverse = objective.title === 'League Position';

  if (objective.status !== 'in_progress') return null;

  let currentVal = objective.current;
  let targetVal = objective.target;
  let unit = '';

  switch (objective.title) {
    case 'League Position': {
      unit = 'positions';
      return {
        needed: Math.max(0, currentVal - targetVal),
        remaining,
        avgPerWeek: remaining > 0 ? (currentVal - targetVal) / remaining > 0
          ? `Move up ${(currentVal - targetVal) / remaining > 1 ? Math.ceil((currentVal - targetVal) / remaining) : 1} place${remaining > 0 ? '/wk' : ''}`
          : 'On track'
          : 'On track',
        currentDisplay: `Current: ${currentVal}${getOrdinal(currentVal)}`,
        unit,
      };
    }
    case 'Minimum Wins': {
      unit = 'wins';
      return {
        needed: Math.max(0, targetVal - currentVal),
        remaining,
        avgPerWeek: remaining > 0
          ? `${Math.ceil(Math.max(0, targetVal - currentVal) / remaining)} wins/wk needed`
          : '',
        currentDisplay: `Current: ${currentVal} wins`,
        unit,
      };
    }
    case 'Goal Target': {
      unit = 'goals';
      return {
        needed: Math.max(0, targetVal - currentVal),
        remaining,
        avgPerWeek: remaining > 0
          ? `${(Math.max(0, targetVal - currentVal) / remaining).toFixed(1)} goals/wk needed`
          : '',
        currentDisplay: `Current: ${currentVal}/${targetVal} goals from ${seasonStats.appearances} appearances`,
        unit,
      };
    }
    case 'Goal Contributions': {
      unit = 'contributions';
      return {
        needed: Math.max(0, targetVal - currentVal),
        remaining,
        avgPerWeek: remaining > 0
          ? `${(Math.max(0, targetVal - currentVal) / remaining).toFixed(1)} g+a/wk needed`
          : '',
        currentDisplay: `Current: ${currentVal}/${targetVal} (G+A) from ${seasonStats.appearances} apps`,
        unit,
      };
    }
    case 'Clean Sheet Target': {
      unit = 'clean sheets';
      return {
        needed: Math.max(0, targetVal - currentVal),
        remaining,
        avgPerWeek: remaining > 0
          ? `${(Math.max(0, targetVal - currentVal) / remaining).toFixed(1)} CS/wk needed`
          : '',
        currentDisplay: `Current: ${currentVal}/${targetVal} clean sheets`,
        unit,
      };
    }
    case 'Appearances': {
      unit = 'appearances';
      return {
        needed: Math.max(0, targetVal - currentVal),
        remaining,
        avgPerWeek: remaining > 0
          ? `Play in ${Math.ceil(Math.max(0, targetVal - currentVal) / remaining * 2)}/2 remaining matches`
          : '',
        currentDisplay: `Current: ${currentVal}/${targetVal} appearances`,
        unit,
      };
    }
    case 'Performance Rating': {
      unit = 'rating';
      return {
        needed: 0,
        remaining,
        avgPerWeek: (currentVal / 10) >= targetVal / 10
          ? 'On track'
          : `Need ${(targetVal / 10).toFixed(1)} avg — currently ${(currentVal / 10).toFixed(1)}`,
        currentDisplay: `Current: ${(currentVal / 10).toFixed(1)} avg rating`,
        unit,
      };
    }
    case 'Fan Favorite': {
      unit = 'reputation';
      return {
        needed: Math.max(0, targetVal - currentVal),
        remaining,
        avgPerWeek: remaining > 0
          ? `Need ${Math.max(0, targetVal - currentVal)} more reputation points`
          : '',
        currentDisplay: `Current: ${currentVal}/80 reputation`,
        unit,
      };
    }
    default:
      return null;
  }
}

// ============================================================
// Helper: Get weekly contributions for timeline
// ============================================================
function getWeeklyContributions(
  objective: SeasonObjective,
  recentResults: { week: number; season: number; playerGoals: number; playerAssists: number; playerMinutesPlayed: number; playerStarted: boolean; playerRating: number }[],
  currentSeason: number,
): { week: number; value: number; label: string }[] {
  const seasonResults = recentResults
    .filter(r => r.season === currentSeason)
    .sort((a, b) => a.week - b.week)
    .slice(-8); // last 8 weeks

  return seasonResults.map(r => {
    let value = 0;
    let label = '';
    switch (objective.title) {
      case 'Goal Target':
        value = r.playerGoals;
        label = value > 0 ? `${value} goal${value > 1 ? 's' : ''}` : '—';
        break;
      case 'Goal Contributions':
        value = r.playerGoals + r.playerAssists;
        label = value > 0 ? `${value} g+a` : '—';
        break;
      case 'Appearances':
        value = r.playerMinutesPlayed > 0 ? 1 : 0;
        label = r.playerStarted ? 'Started' : r.playerMinutesPlayed > 0 ? 'Sub' : 'DNP';
        break;
      case 'Performance Rating':
        value = r.playerMinutesPlayed > 0 ? r.playerRating : 0;
        label = r.playerMinutesPlayed > 0 ? `${r.playerRating.toFixed(1)}` : 'DNP';
        break;
      default:
        value = 0;
        label = '—';
    }
    return { week: r.week, value, label };
  });
}

// ============================================================
// Objective Card Sub-Component (Expandable)
// ============================================================
function ObjectiveCard({
  objective,
  index,
  totalMatchdays,
  currentWeek,
  seasonStats,
  recentResults,
  currentSeason,
}: {
  objective: SeasonObjective;
  index: number;
  totalMatchdays: number;
  currentWeek: number;
  seasonStats: { appearances: number; goals: number; assists: number; cleanSheets: number; averageRating: number };
  recentResults: { week: number; season: number; playerGoals: number; playerAssists: number; playerMinutesPlayed: number; playerStarted: boolean; playerRating: number }[];
  currentSeason: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const progress = Math.min(100, objective.title === 'League Position'
    ? ((20 - objective.current) / Math.max(1, 20 - objective.target)) * 100
    : (objective.current / objective.target) * 100
  );

  const isCompleted = objective.status === 'completed';
  const isFailed = objective.status === 'failed';
  const config = CATEGORY_CONFIG[objective.category];

  const statInfo = useMemo(
    () => getObjectiveStatInfo(objective, totalMatchdays, currentWeek, seasonStats),
    [objective, totalMatchdays, currentWeek, seasonStats]
  );

  const weeklyContributions = useMemo(
    () => getWeeklyContributions(objective, recentResults, currentSeason),
    [objective, recentResults, currentSeason]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className={`relative rounded-lg border ${
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : isFailed
            ? 'border-red-500/20 bg-red-500/5'
            : 'border-[#30363d] bg-[#161b22]/60'
      } transition-all`}
    >
      {/* Main Card — clickable to expand */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-3 cursor-pointer"
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
              {isCompleted && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  COMPLETED
                </span>
              )}
              {isFailed && <XCircle className="w-3.5 h-3.5 text-red-400" />}
            </div>
            <h4 className="text-sm font-semibold text-[#c9d1d9] truncate">{objective.title}</h4>
            <p className="text-[11px] text-[#8b949e] mt-0.5">{objective.description}</p>

            {/* Progress Bar — not shown when completed or failed */}
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
                    transition={{ duration: 0.2, delay: index * 0.05 + 0.2 }}
                  />
                </div>
              </div>
            )}

            {/* Reward — prominent for completed */}
            {isCompleted ? (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">
                  €{(objective.reward / 1000).toFixed(0)}K Earned
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-1.5">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] text-amber-400/80">
                  Bonus: €{(objective.reward / 1000).toFixed(0)}K
                </span>
              </div>
            )}
          </div>

          {/* Expand/Collapse Chevron */}
          {(!isCompleted && !isFailed) && (
            <div className="flex-shrink-0 mt-1">
              {expanded
                ? <ChevronUp className="w-4 h-4 text-[#8b949e]" />
                : <ChevronDown className="w-4 h-4 text-[#8b949e]" />
              }
            </div>
          )}
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && !isCompleted && !isFailed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-3"
          >
            <div className="border-t border-[#30363d] pt-2.5 mt-1">
              {/* Breakdown */}
              {statInfo && (
                <div className="mb-2.5">
                  <div className="text-[10px] font-semibold text-[#c9d1d9] uppercase tracking-wider mb-1.5">
                    Breakdown
                  </div>
                  <div className="text-[11px] text-[#8b949e]">
                    {statInfo.currentDisplay}
                  </div>
                  {statInfo.needed > 0 && statInfo.remaining > 0 && (
                    <div className="text-[11px] text-[#8b949e] mt-0.5">
                      Need {statInfo.needed} more {statInfo.unit} in {statInfo.remaining} remaining week{statInfo.remaining !== 1 ? 's' : ''}
                    </div>
                  )}
                  {statInfo.avgPerWeek && (
                    <div className="text-[11px] text-amber-400/80 mt-0.5">
                      → {statInfo.avgPerWeek}
                    </div>
                  )}
                </div>
              )}

              {/* Weekly Timeline */}
              {weeklyContributions.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-[#c9d1d9] uppercase tracking-wider mb-1.5">
                    Recent Weeks
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {weeklyContributions.map((wc) => (
                      <div
                        key={wc.week}
                        className="flex-shrink-0 w-14 rounded-md bg-[#21262d] p-1.5 text-center"
                      >
                        <div className="text-[9px] text-[#8b949e]">Wk {wc.week}</div>
                        <div className={`text-[11px] font-semibold mt-0.5 ${
                          wc.value > 0
                            ? 'text-emerald-400'
                            : wc.value === 0 && wc.label !== '—'
                              ? 'text-[#8b949e]'
                              : 'text-[#484f58]'
                        }`}>
                          {wc.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Board Satisfaction Meter
// ============================================================
function BoardSatisfactionMeter({ completionPct }: { completionPct: number }) {
  const satisfaction = getBoardSatisfaction(completionPct);
  const SatisfactionIcon = satisfaction.icon;

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${satisfaction.bg} flex items-center justify-center`}>
              <SatisfactionIcon className={`w-4 h-4 ${satisfaction.color}`} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#c9d1d9]">Board Rating</div>
              <div className={`text-[11px] font-medium ${satisfaction.color}`}>{satisfaction.label}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-[#c9d1d9]">{Math.round(completionPct)}%</div>
            <div className="text-[10px] text-[#8b949e]">on track</div>
          </div>
        </div>
        <div className="h-2 bg-[#21262d] rounded-full overflow-hidden mb-2">
          <motion.div
            className={`h-full rounded-full ${satisfaction.barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, completionPct)}%` }}
            transition={{ duration: 0.4, delay: 0.1 }}
          />
        </div>
        <p className="text-[11px] text-[#8b949e] italic">{satisfaction.message}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Season Comparison
// ============================================================
function SeasonComparison({
  prevCompleted,
  prevTotal,
  currentCompleted,
  currentTotal,
}: {
  prevCompleted: number;
  prevTotal: number;
  currentCompleted: number;
  currentTotal: number;
}) {
  const diff = currentCompleted - prevCompleted;
  const prevPct = prevTotal > 0 ? (prevCompleted / prevTotal) * 100 : 0;
  const currPct = currentTotal > 0 ? (currentCompleted / currentTotal) * 100 : 0;

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-[#8b949e]" />
          <span className="text-[11px] font-semibold text-[#c9d1d9]">Season Comparison</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-[10px] text-[#8b949e] mb-0.5">Last Season</div>
            <div className="text-sm font-bold text-[#c9d1d9]">
              {prevCompleted}/{prevTotal}
              <span className="text-[10px] text-[#8b949e] ml-0.5">({Math.round(prevPct)}%)</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            {diff > 0 ? (
              <ArrowUp className="w-4 h-4 text-emerald-400" />
            ) : diff < 0 ? (
              <ArrowDown className="w-4 h-4 text-red-400" />
            ) : (
              <Minus className="w-4 h-4 text-[#8b949e]" />
            )}
            <span className={`text-[10px] font-medium ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
              {diff > 0 ? `+${diff}` : diff === 0 ? 'Same' : `${diff}`}
            </span>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-[#8b949e] mb-0.5">This Season</div>
            <div className="text-sm font-bold text-emerald-400">
              {currentCompleted}/{currentTotal}
              <span className="text-[10px] text-emerald-400/70 ml-0.5">({Math.round(currPct)}%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function SeasonObjectivesPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  // --- Computed values (all before early return) ---

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

  const inProgressCount = useMemo(() => {
    if (!currentObjectives) return 0;
    return currentObjectives.objectives.filter(o => o.status === 'in_progress').length;
  }, [currentObjectives]);

  const boardCount = useMemo(() => {
    if (!currentObjectives) return 0;
    return currentObjectives.objectives.filter(o => o.category === 'board').length;
  }, [currentObjectives]);

  const personalCount = useMemo(() => {
    if (!currentObjectives) return 0;
    return currentObjectives.objectives.filter(o => o.category === 'personal').length;
  }, [currentObjectives]);

  const bonusCount = useMemo(() => {
    if (!currentObjectives) return 0;
    return currentObjectives.objectives.filter(o => o.category === 'bonus').length;
  }, [currentObjectives]);

  const totalCount = useMemo(() => {
    return boardCount + personalCount + bonusCount;
  }, [boardCount, personalCount, bonusCount]);

  const filteredObjectives = useMemo(() => {
    if (!currentObjectives) return [];
    if (activeTab === 'all') return currentObjectives.objectives;
    return currentObjectives.objectives.filter(o => o.category === activeTab);
  }, [currentObjectives, activeTab]);

  // Completion percentage based on progress (not just completed count)
  const completionPct = useMemo(() => {
    if (!currentObjectives || currentObjectives.objectives.length === 0) return 0;
    let totalPct = 0;
    currentObjectives.objectives.forEach(obj => {
      if (obj.status === 'completed') {
        totalPct += 100;
      } else if (obj.status === 'in_progress') {
        const pct = obj.title === 'League Position'
          ? ((20 - obj.current) / Math.max(1, 20 - obj.target)) * 100
          : (obj.current / obj.target) * 100;
        totalPct += Math.min(100, pct);
      }
      // failed contributes 0
    });
    return totalPct / currentObjectives.objectives.length;
  }, [currentObjectives]);

  const totalMatchdays = useMemo(() => {
    if (!gameState) return 38;
    const teamCount = gameState.leagueTable?.length ?? 20;
    return (teamCount - 1) * 2;
  }, [gameState]);

  const currentWeek = useMemo(() => {
    return gameState?.currentWeek ?? 1;
  }, [gameState]);

  const seasonStats = useMemo(() => ({
    appearances: gameState?.player?.seasonStats?.appearances ?? 0,
    goals: gameState?.player?.seasonStats?.goals ?? 0,
    assists: gameState?.player?.seasonStats?.assists ?? 0,
    cleanSheets: gameState?.player?.seasonStats?.cleanSheets ?? 0,
    averageRating: gameState?.player?.seasonStats?.averageRating ?? 0,
  }), [gameState]);

  // Season comparison data
  const previousSeason = useMemo(() => {
    if (!gameState || !currentObjectives) return null;
    const prevSeasonNum = currentObjectives.season - 1;
    return gameState.seasons.find(s => s.number === prevSeasonNum) ?? null;
  }, [gameState, currentObjectives]);

  const prevSeasonObjectives = useMemo(() => {
    if (!gameState || !currentObjectives) return null;
    const prevSeasonNum = currentObjectives.season - 1;
    const objSets = gameState.seasonObjectives ?? [];
    return objSets.find(o => o.season === prevSeasonNum) ?? null;
  }, [gameState, currentObjectives]);

  const prevCompletedCount = useMemo(() => {
    if (!prevSeasonObjectives) return 0;
    return prevSeasonObjectives.objectives.filter(o => o.status === 'completed').length;
  }, [prevSeasonObjectives]);

  // Recent results for weekly timeline
  const recentResults = useMemo(() => {
    if (!gameState) return [];
    return gameState.recentResults ?? [];
  }, [gameState]);

  const currentSeason = useMemo(() => {
    return gameState?.currentSeason ?? 1;
  }, [gameState]);

  // Tab counts map
  const tabCounts = useMemo(() => ({
    all: totalCount,
    board: boardCount,
    personal: personalCount,
    bonus: bonusCount,
  }), [totalCount, boardCount, personalCount, bonusCount]);

  // --- Early return ---
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h2 className="text-xl font-bold text-[#c9d1d9] flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Season Objectives
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">Season {currentObjectives.season} • Week {currentWeek}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg border ${getBoardExpectationBg(currentObjectives.boardExpectation)}`}>
          <span className={`text-xs font-semibold ${getBoardExpectationColor(currentObjectives.boardExpectation)}`}>
            {getBoardExpectationLabel(currentObjectives.boardExpectation)}
          </span>
        </div>
      </motion.div>

      {/* Board Satisfaction Meter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="mb-4"
      >
        <BoardSatisfactionMeter completionPct={completionPct} />
      </motion.div>

      {/* Season Comparison */}
      {prevSeasonObjectives && prevSeasonObjectives.objectives.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <SeasonComparison
            prevCompleted={prevCompletedCount}
            prevTotal={prevSeasonObjectives.objectives.length}
            currentCompleted={completedCount}
            currentTotal={currentObjectives.objectives.length}
          />
        </motion.div>
      )}

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-4"
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
                <div className="text-[10px] text-[#8b949e] mt-0.5">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#c9d1d9]">{inProgressCount}</div>
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

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-1.5 mb-4 overflow-x-auto"
      >
        {TAB_CONFIG.map((tab) => {
          const TabIcon = tab.icon;
          const count = tabCounts[tab.key];
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] hover:border-slate-600/50'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`text-[10px] px-1 py-0.5 rounded ${
                isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#21262d] text-[#8b949e]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Filtered Objectives */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-2"
        >
          {filteredObjectives.map((obj, i) => (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              index={i}
              totalMatchdays={totalMatchdays}
              currentWeek={currentWeek}
              seasonStats={seasonStats}
              recentResults={recentResults}
              currentSeason={currentSeason}
            />
          ))}
          {filteredObjectives.length === 0 && (
            <div className="text-center py-6">
              <Target className="w-8 h-8 text-[#484f58] mx-auto mb-1.5" />
              <p className="text-xs text-[#8b949e]">No objectives in this category</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

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
