'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Trophy, CheckCircle2, XCircle, Clock, TrendingUp, Award, Flag, Star,
  Shield, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Minus, ThumbsUp, ThumbsDown,
  AlertTriangle, Meh, Sparkles, Users,
  Flame, Zap, Activity, DollarSign, TrendingDown,
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
// Helper: Get objective progress (0-100)
// ============================================================
function getObjectiveProgress(obj: SeasonObjective): number {
  if (obj.status === 'completed') return 100;
  if (obj.status === 'failed') return 0;
  if (obj.title === 'League Position') {
    return Math.min(100, ((20 - obj.current) / Math.max(1, 20 - obj.target)) * 100);
  }
  return Math.min(100, (obj.current / Math.max(1, obj.target)) * 100);
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
// NEW: Objective Progress Radar
// ============================================================
function ObjectiveProgressRadar({
  axes,
  overallPct,
}: {
  axes: { label: string; progress: number }[];
  overallPct: number;
}) {
  const cx = 110;
  const cy = 110;
  const maxR = 70;
  const labelR = 90;
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const getHexPoint = (axisIdx: number, radius: number) => {
    const angle = (axisIdx * 60 - 90) * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const gridPolygons = gridLevels.map((level) => {
    const r = level * maxR;
    return axes.map((_, i) => {
      const p = getHexPoint(i, r);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
  });

  const dataPolygon = axes.map((axis, i) => {
    const r = Math.max(0, (axis.progress / 100)) * maxR;
    const p = getHexPoint(i, r);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  const axisLines = axes.map((_, i) => {
    const p = getHexPoint(i, maxR);
    return { x1: cx, y1: cy, x2: p.x.toFixed(1), y2: p.y.toFixed(1) };
  });

  const dataPoints = axes.map((axis, i) => {
    const r = Math.max(0, (axis.progress / 100)) * maxR;
    const p = getHexPoint(i, r);
    return { cx: p.x.toFixed(1), cy: p.y.toFixed(1), progress: axis.progress };
  });

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-[#c9d1d9]">Objective Progress Radar</span>
        </div>
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 220 220" className="w-full max-w-[220px]">
            {/* Grid hexagons */}
            {gridPolygons.map((points, idx) => (
              <polygon
                key={`grid-${idx}`}
                points={points}
                fill="none"
                stroke="#30363d"
                strokeWidth="0.5"
              />
            ))}
            {/* Axis lines */}
            {axisLines.map((line, i) => (
              <line
                key={`axis-${i}`}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke="#30363d"
                strokeWidth="0.5"
              />
            ))}
            {/* Data fill */}
            <polygon
              points={dataPolygon}
              fill="rgba(52, 211, 153, 0.15)"
              stroke="#34d399"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Data dots */}
            {dataPoints.map((pt, i) => (
              <circle
                key={`dot-${i}`}
                cx={pt.cx} cy={pt.cy}
                r="3"
                fill="#34d399"
              />
            ))}
            {/* Axis labels */}
            {axes.map((axis, i) => {
              const p = getHexPoint(i, labelR);
              const anchor = i === 0 || i === 3 ? 'middle' : i < 3 ? 'start' : 'end';
              const dy = i === 0 ? -6 : i === 3 ? 10 : 4;
              return (
                <text
                  key={`lbl-${i}`}
                  x={p.x.toFixed(1)} y={p.y.toFixed(1)}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill="#8b949e"
                  fontSize="9"
                  dy={dy}
                >
                  {axis.label}
                </text>
              );
            })}
            {/* Center percentage */}
            <text
              x={cx} y={cy - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#c9d1d9"
              fontSize="16"
              fontWeight="bold"
            >
              {overallPct}%
            </text>
            <text
              x={cx} y={cy + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#8b949e"
              fontSize="8"
            >
              overall
            </text>
          </svg>
          {/* Axis legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
            {axes.map((axis) => (
              <div key={axis.label} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-sm ${
                  axis.progress >= 80 ? 'bg-emerald-500' : axis.progress >= 40 ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span className="text-[9px] text-[#8b949e]">{axis.label}</span>
                <span className="text-[9px] text-[#c9d1d9] font-medium">{Math.round(axis.progress)}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// NEW: Deadline Countdown Cards
// ============================================================
function DeadlineCountdownCards({
  items,
}: {
  items: {
    id: string;
    title: string;
    icon: string;
    timeProgressPct: number;
    objectiveProgressPct: number;
    paceLabel: string;
    paceColor: string;
    riskLevel: string;
    riskColor: string;
    requiredRate: string;
    projectedWeek: number;
    remainingWeeks: number;
  }[];
}) {
  if (items.length === 0) return null;

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-[#c9d1d9]">Deadline Countdown</span>
        </div>
        <div className="space-y-2.5 max-h-96 overflow-y-auto">
          {items.map((item) => {
            const ringR = 22;
            const ringC = 2 * Math.PI * ringR;
            return (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]">
                {/* Circular progress ring */}
                <svg viewBox="0 0 52 52" className="w-12 h-12 flex-shrink-0">
                  <circle
                    cx="26" cy="26" r={ringR}
                    fill="none"
                    stroke="#21262d"
                    strokeWidth="3"
                  />
                  <circle
                    cx="26" cy="26" r={ringR}
                    fill="none"
                    stroke={item.objectiveProgressPct >= 80 ? '#34d399' : item.objectiveProgressPct >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={ringC}
                    strokeDashoffset={ringC * (1 - Math.max(0, item.timeProgressPct) / 100)}
                    transform="rotate(-90 26 26)"
                  />
                  <text
                    x="26" y="24"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#c9d1d9"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {item.objectiveProgressPct}%
                  </text>
                  <text
                    x="26" y="34"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#8b949e"
                    fontSize="6"
                  >
                    done
                  </text>
                </svg>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs font-semibold text-[#c9d1d9] truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${item.paceColor}`}>
                      {item.paceLabel}
                    </span>
                    <span className={`text-[9px] font-medium ${item.riskColor}`}>
                      Risk: {item.riskLevel}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8b949e]">
                    {item.requiredRate}/wk needed · Proj. Wk {item.projectedWeek} · {item.remainingWeeks} left
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// NEW: Reward Breakdown Panel
// ============================================================
function RewardBreakdownPanel({
  data,
}: {
  data: {
    categories: { key: string; label: string; color: string; completed: number; inProgress: number; failed: number }[];
    guaranteed: number;
    atRisk: number;
    lost: number;
    deductions: number;
    net: number;
  };
}) {
  const totalAll = data.categories.reduce((s, c) => s + c.completed + c.inProgress + c.failed, 0);
  const barSegments = useMemo(() => {
    if (totalAll === 0) return [];
    let offset = 0;
    return data.categories
      .filter(c => c.completed + c.inProgress + c.failed > 0)
      .map(c => {
        const total = c.completed + c.inProgress + c.failed;
        const width = (total / totalAll) * 100;
        const seg = { ...c, x: offset, width };
        offset += width;
        return seg;
      });
  }, [data.categories, totalAll]);

  const guaranteedWidth = totalAll > 0 ? (data.guaranteed / totalAll) * 100 : 0;
  const atRiskWidth = totalAll > 0 ? (data.atRisk / totalAll) * 100 : 0;
  const lostWidth = totalAll > 0 ? (data.lost / totalAll) * 100 : 0;

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-[#c9d1d9]">Reward Breakdown</span>
        </div>

        {/* Stacked bar by category */}
        <div className="mb-3">
          <div className="text-[10px] text-[#8b949e] mb-1.5">Potential Bonus Pool</div>
          <div className="flex h-5 rounded-md overflow-hidden bg-[#21262d]">
            {barSegments.map((seg) => (
              <div
                key={seg.key}
                className="h-full"
                style={{
                  width: `${seg.width}%`,
                  backgroundColor: seg.color,
                  opacity: 0.8,
                }}
                title={`${seg.label}: €${((seg.completed + seg.inProgress + seg.failed) / 1000).toFixed(0)}K`}
              />
            ))}
          </div>
          {/* Category legend */}
          <div className="flex gap-3 mt-1.5">
            {data.categories.map((cat) => (
              <div key={cat.key} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: cat.color }} />
                <span className="text-[9px] text-[#8b949e]">{cat.label}</span>
                <span className="text-[9px] text-[#c9d1d9]">€{((cat.completed + cat.inProgress + cat.failed) / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>

        {/* Guaranteed vs At Risk vs Lost */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
            <div className="text-sm font-bold text-emerald-400">€{(data.guaranteed / 1000).toFixed(0)}K</div>
            <div className="text-[9px] text-emerald-400/70">Guaranteed</div>
          </div>
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-center">
            <div className="text-sm font-bold text-amber-400">€{(data.atRisk / 1000).toFixed(0)}K</div>
            <div className="text-[9px] text-amber-400/70">At Risk</div>
          </div>
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-2 text-center">
            <div className="text-sm font-bold text-red-400">€{(data.lost / 1000).toFixed(0)}K</div>
            <div className="text-[9px] text-red-400/70">Lost</div>
          </div>
        </div>

        {/* Deductions */}
        {data.guaranteed > 0 && (
          <div className="rounded-md bg-[#21262d] p-2.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-[#8b949e]">Gross Earnings</span>
              <span className="text-[10px] font-semibold text-[#c9d1d9]">€{(data.guaranteed / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-red-400/70">Tax & Agent Fees (15%)</span>
              <span className="text-[10px] font-medium text-red-400">-€{(data.deductions / 1000).toFixed(0)}K</span>
            </div>
            <div className="border-t border-[#30363d] pt-1 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold text-[#c9d1d9]">Net Take-Home</span>
                <span className="text-xs font-bold text-emerald-400">€{(data.net / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// NEW: Objective Timeline History
// ============================================================
function ObjectiveTimelineHistory({
  entries,
  currentWeek,
}: {
  entries: {
    week: number;
    completed: number;
    bonus: number;
    phase: string;
    achievement: string;
    status: 'past' | 'current' | 'future';
  }[];
  currentWeek: number;
}) {
  const phaseLabels = useMemo(() => {
    const phases: { label: string; startWeek: number; endWeek: number }[] = [
      { label: 'Early Season', startWeek: 1, endWeek: 12 },
      { label: 'Mid-Season', startWeek: 13, endWeek: 26 },
      { label: 'Run-In', startWeek: 27, endWeek: 38 },
    ];
    return phases;
  }, []);

  const currentPhase = phaseLabels.find(p => currentWeek >= p.startWeek && currentWeek <= p.endWeek);

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-[#c9d1d9]">Season Timeline</span>
        </div>

        {/* Phase labels */}
        <div className="flex gap-1.5 mb-4">
          {phaseLabels.map((phase) => {
            const isActive = currentPhase?.label === phase.label;
            return (
              <div
                key={phase.label}
                className={`flex-1 text-center py-1 rounded-md text-[9px] font-medium ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
                }`}
              >
                Wk {phase.startWeek}-{phase.endWeek} · {phase.label}
              </div>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[#30363d]" />

          <div className="space-y-0">
            {entries.map((entry) => {
              const isPast = entry.status === 'past';
              const isCurrent = entry.status === 'current';
              const isFuture = entry.status === 'future';

              return (
                <div key={entry.week} className="relative flex gap-3 pb-3 last:pb-0">
                  {/* Dot */}
                  <div className="relative z-10 mt-1 flex-shrink-0">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 ${
                        isCurrent
                          ? 'bg-emerald-500 border-emerald-400'
                          : isPast
                            ? 'bg-emerald-500/30 border-emerald-500/60'
                            : 'bg-[#21262d] border-[#484f58]'
                      }`}
                    />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold ${
                        isCurrent ? 'text-emerald-400' : isPast ? 'text-[#c9d1d9]' : 'text-[#484f58]'
                      }`}>
                        Week {entry.week}
                      </span>
                      {isCurrent && (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">NOW</span>
                      )}
                      <span className="text-[9px] text-[#8b949e]">· {entry.phase}</span>
                    </div>
                    {!isFuture && (
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-[#8b949e]">
                          {entry.completed} objective{entry.completed !== 1 ? 's' : ''} completed
                        </span>
                        {entry.bonus > 0 && (
                          <span className="text-emerald-400/80">€{(entry.bonus / 1000).toFixed(0)}K earned</span>
                        )}
                      </div>
                    )}
                    {entry.achievement && (
                      <div className="text-[10px] text-amber-400/70 mt-0.5">
                        <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                        {entry.achievement}
                      </div>
                    )}
                    {isFuture && (
                      <div className="text-[10px] text-[#484f58]">
                        {entry.completed} projected
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// NEW: Motivation & Tips
// ============================================================
function MotivationTips({
  phase,
  intensity,
  tips,
}: {
  phase: string;
  intensity: number;
  tips: string[];
}) {
  const intensityColors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-[#c9d1d9]">Coach&apos;s Advice</span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
            {phase}
          </span>
        </div>

        {/* Fire intensity meter */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#8b949e] flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              Momentum
            </span>
            <span className={`text-[10px] font-bold ${intensity >= 4 ? 'text-emerald-400' : intensity >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
              {intensity >= 4 ? 'On Fire' : intensity >= 2 ? 'Building' : 'Warming Up'}
            </span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-2.5 flex-1 rounded-sm transition-colors"
                style={{
                  backgroundColor: i < intensity
                    ? intensityColors[i]
                    : '#21262d',
                }}
              />
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="space-y-1.5">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <span className="text-[11px] text-[#8b949e] leading-relaxed">{tip}</span>
            </div>
          ))}
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

  // --- NEW: Radar data ---
  const radarAxes = useMemo(() => {
    if (!currentObjectives) return { axes: [] as { label: string; progress: number }[], overallPct: 0 };
    const objectives = currentObjectives.objectives;

    const getProgress = (title: string): number => {
      const obj = objectives.find(o => o.title === title);
      return obj ? getObjectiveProgress(obj) : 0;
    };

    const axes = [
      { label: 'Goals', progress: getProgress('Goal Target') || getProgress('Goal Contributions') },
      { label: 'Assists', progress: getProgress('Goal Contributions') },
      { label: 'Apps', progress: getProgress('Appearances') },
      { label: 'Rating', progress: getProgress('Performance Rating') },
      { label: 'Position', progress: getProgress('League Position') },
      { label: 'CS', progress: getProgress('Clean Sheet Target') },
    ];

    const overallPct = Math.round(axes.reduce((s, a) => s + a.progress, 0) / Math.max(1, axes.length));

    return { axes, overallPct };
  }, [currentObjectives]);

  // --- NEW: Deadline countdown data ---
  const deadlineItems = useMemo(() => {
    if (!currentObjectives) return [];
    return currentObjectives.objectives
      .filter(o => o.status === 'in_progress')
      .map(obj => {
        const progress = getObjectiveProgress(obj);
        const seasonElapsed = currentWeek / totalMatchdays;
        const paceRatio = seasonElapsed > 0 ? (progress / 100) / seasonElapsed : 0;

        let paceLabel: string;
        let paceColor: string;
        if (paceRatio >= 1.1) {
          paceLabel = 'Ahead';
          paceColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
        } else if (paceRatio >= 0.8) {
          paceLabel = 'On Track';
          paceColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
        } else {
          paceLabel = 'Behind';
          paceColor = 'text-red-400 bg-red-500/15 border-red-500/30';
        }

        const remainingWeeks = Math.max(1, totalMatchdays - currentWeek);
        const needed = obj.title === 'League Position'
          ? Math.max(0, obj.current - obj.target)
          : Math.max(0, obj.target - obj.current);
        const requiredRate = needed / remainingWeeks;
        const currentRate = currentWeek > 0 ? obj.current / currentWeek : 0;
        const projectedWeek = currentRate > 0
          ? Math.min(totalMatchdays, currentWeek + Math.ceil(needed / currentRate))
          : totalMatchdays;

        let riskLevel: string;
        let riskColor: string;
        if (paceRatio >= 1.0) {
          riskLevel = 'Low';
          riskColor = 'text-emerald-400';
        } else if (paceRatio >= 0.6) {
          riskLevel = 'Medium';
          riskColor = 'text-amber-400';
        } else {
          riskLevel = 'High';
          riskColor = 'text-red-400';
        }

        return {
          id: obj.id,
          title: obj.title,
          icon: obj.icon,
          timeProgressPct: Math.round(seasonElapsed * 100),
          objectiveProgressPct: Math.round(progress),
          paceLabel,
          paceColor,
          riskLevel,
          riskColor,
          requiredRate: requiredRate.toFixed(1),
          projectedWeek,
          remainingWeeks,
        };
      });
  }, [currentObjectives, currentWeek, totalMatchdays]);

  // --- NEW: Reward breakdown data ---
  const rewardData = useMemo(() => {
    if (!currentObjectives) return {
      categories: [] as { key: string; label: string; color: string; completed: number; inProgress: number; failed: number }[],
      guaranteed: 0, atRisk: 0, lost: 0, deductions: 0, net: 0,
    };
    const objectives = currentObjectives.objectives;

    const categories = [
      {
        key: 'board',
        label: 'Board',
        color: '#f59e0b',
        completed: objectives.filter(o => o.category === 'board' && o.status === 'completed').reduce((s, o) => s + o.reward, 0),
        inProgress: objectives.filter(o => o.category === 'board' && o.status === 'in_progress').reduce((s, o) => s + o.reward, 0),
        failed: objectives.filter(o => o.category === 'board' && o.status === 'failed').reduce((s, o) => s + o.reward, 0),
      },
      {
        key: 'personal',
        label: 'Personal',
        color: '#34d399',
        completed: objectives.filter(o => o.category === 'personal' && o.status === 'completed').reduce((s, o) => s + o.reward, 0),
        inProgress: objectives.filter(o => o.category === 'personal' && o.status === 'in_progress').reduce((s, o) => s + o.reward, 0),
        failed: objectives.filter(o => o.category === 'personal' && o.status === 'failed').reduce((s, o) => s + o.reward, 0),
      },
      {
        key: 'bonus',
        label: 'Bonus',
        color: '#a78bfa',
        completed: objectives.filter(o => o.category === 'bonus' && o.status === 'completed').reduce((s, o) => s + o.reward, 0),
        inProgress: objectives.filter(o => o.category === 'bonus' && o.status === 'in_progress').reduce((s, o) => s + o.reward, 0),
        failed: objectives.filter(o => o.category === 'bonus' && o.status === 'failed').reduce((s, o) => s + o.reward, 0),
      },
    ];

    const guaranteed = categories.reduce((s, c) => s + c.completed, 0);
    const atRisk = categories.reduce((s, c) => s + c.inProgress, 0);
    const lost = categories.reduce((s, c) => s + c.failed, 0);
    const deductions = Math.round(guaranteed * 0.15);
    const net = guaranteed - deductions;

    return { categories, guaranteed, atRisk, lost, deductions, net };
  }, [currentObjectives]);

  // --- NEW: Timeline data ---
  const timelineEntries = useMemo(() => {
    if (!currentObjectives) return [];
    const milestones = [5, 10, 15, 20, 25, 30, 38];

    return milestones.map(week => {
      const isPast = week < currentWeek;
      const isCurrent = week === currentWeek;
      const isFuture = week > currentWeek;

      let completedAtPoint = 0;
      let bonusAtPoint = 0;
      let achievement = '';

      if (isPast) {
        const fraction = currentWeek > 0 ? week / currentWeek : 0;
        completedAtPoint = Math.round(completedCount * fraction);
        bonusAtPoint = Math.round(totalBonus * fraction);
        if (completedAtPoint >= totalCount * 0.75) achievement = 'Strong form — season highlights';
        else if (completedAtPoint >= Math.ceil(totalCount * 0.5)) achievement = 'Building momentum';
        else if (completedAtPoint >= 1) achievement = 'First objectives completed';
        else achievement = 'Season underway';
      } else if (isCurrent) {
        completedAtPoint = completedCount;
        bonusAtPoint = totalBonus;
        if (completedCount === totalCount) achievement = 'All objectives met!';
        else if (completedCount >= Math.ceil(totalCount * 0.6)) achievement = 'On track for a strong finish';
        else achievement = 'Work in progress';
      } else {
        const pace = currentWeek > 0 ? completedCount / currentWeek : 0;
        completedAtPoint = Math.min(totalCount, Math.round(pace * week));
        bonusAtPoint = 0;
      }

      const phase = week <= 12 ? 'Early Season' : week <= 26 ? 'Mid-Season' : 'Run-In';

      return {
        week,
        completed: completedAtPoint,
        bonus: bonusAtPoint,
        phase,
        achievement,
        status: (isFuture ? 'future' : isCurrent ? 'current' : 'past') as 'past' | 'current' | 'future',
      };
    });
  }, [currentObjectives, currentWeek, completedCount, totalBonus, totalCount]);

  // --- NEW: Motivation data ---
  const motivationInfo = useMemo(() => {
    const phase = currentWeek <= 12 ? 'Early Season' : currentWeek <= 26 ? 'Mid-Season' : 'Run-In';
    const seasonFraction = currentWeek / totalMatchdays;
    const momentum = seasonFraction > 0 ? completionPct / (seasonFraction * 100) : 0;
    const intensity = Math.min(5, Math.max(0, Math.round(momentum * 5 / 1.5)));

    let tips: string[];
    if (completionPct >= 80) {
      tips = [
        'Outstanding form — keep this momentum through the final weeks',
        'Focus on consistency to maintain your elite standards',
        'You could exceed every target with continued discipline',
      ];
    } else if (completionPct >= 50) {
      tips = [
        'Solid progress so far — maintain your current training intensity',
        'Prioritize the objectives closest to completion for quick wins',
        'Matchday focus is key — every appearance counts now',
      ];
    } else if (completionPct >= 25) {
      tips = [
        'There\'s still time — focus on your most achievable targets first',
        'Increase training frequency to accelerate your development',
        'Set weekly mini-goals to build confidence step by step',
      ];
    } else {
      tips = [
        'Every great career has setbacks — resilience is what defines champions',
        'Focus on one objective at a time for maximum impact',
        'Consider adjusting your mindset for upcoming fixtures',
      ];
    }

    if (phase === 'Run-In' && completionPct < 50) {
      tips[0] = 'The run-in is where legends are made — time to step up';
    }

    return { phase, intensity, tips };
  }, [completionPct, currentWeek, totalMatchdays]);

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

      {/* ============================================================ */}
      {/* NEW SECTION 1: Objective Progress Radar                     */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4"
      >
        <ObjectiveProgressRadar
          axes={radarAxes.axes}
          overallPct={radarAxes.overallPct}
        />
      </motion.div>

      {/* ============================================================ */}
      {/* NEW SECTION 2: Deadline Countdown Cards                       */}
      {/* ============================================================ */}
      {deadlineItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <DeadlineCountdownCards items={deadlineItems} />
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* NEW SECTION 3: Reward Breakdown Panel                        */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4"
      >
        <RewardBreakdownPanel data={rewardData} />
      </motion.div>

      {/* ============================================================ */}
      {/* NEW SECTION 4: Objective Timeline History                     */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="mt-4"
      >
        <ObjectiveTimelineHistory
          entries={timelineEntries}
          currentWeek={currentWeek}
        />
      </motion.div>

      {/* ============================================================ */}
      {/* NEW SECTION 5: Motivation & Tips                              */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4"
      >
        <MotivationTips
          phase={motivationInfo.phase}
          intensity={motivationInfo.intensity}
          tips={motivationInfo.tips}
        />
      </motion.div>
    </div>
  );
}
