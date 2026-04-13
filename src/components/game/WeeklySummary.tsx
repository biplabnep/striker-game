'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/lib/game/gameUtils';
import {
  X, Trophy, Swords, Dumbbell, Bell, TrendingUp, TrendingDown,
  Minus, Zap, ArrowUp, ArrowDown, BarChart3, Activity, Heart,
  Target, Star, Medal, Calendar, Wallet, Coins, Lightbulb, ArrowRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WeeklySummaryProps {
  onClose: () => void;
}

// Helper: get stat color class based on value thresholds
function getStatBarColor(value: number, thresholds: [number, number]): string {
  const [good, ok] = thresholds;
  if (value >= good) return 'bg-emerald-500';
  if (value >= ok) return 'bg-amber-500';
  return 'bg-red-500';
}

// Helper: get stat accent border color
function getStatAccentColor(value: number, thresholds: [number, number]): string {
  const [good, ok] = thresholds;
  if (value >= good) return 'border-l-emerald-500';
  if (value >= ok) return 'border-l-amber-500';
  return 'border-l-red-500';
}

// Helper: get league position ordinal suffix
function getOrdinalSuffix(pos: number): string {
  if (pos === 1) return 'st';
  if (pos === 2) return 'nd';
  if (pos === 3) return 'rd';
  return 'th';
}

// Helper: format league position with ordinal
function formatPosition(pos: number): string {
  return `${pos}${getOrdinalSuffix(pos)}`;
}

// Performance Ring SVG Component
function PerformanceRing({ score, size = 120, strokeWidth = 8 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const bgPath = `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius}`;

  const pct = Math.min(100, Math.max(0, score)) / 100;
  const angle = pct * 360;
  const endRad = ((angle - 90) * Math.PI) / 180;
  const endX = cx + radius * Math.cos(endRad);
  const endY = cy + radius * Math.sin(endRad);
  const largeArc = angle > 180 ? 1 : 0;
  const fgPath = angle > 0
    ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`
    : '';

  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : score >= 25 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <path d={bgPath} fill="none" stroke="#21262d" strokeWidth={strokeWidth} />
        {fgPath && (
          <motion.path
            d={fgPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          />
        )}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle" dominantBaseline="central"
          className="fill-white" fontSize="22" fontWeight="bold"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {score}
        </text>
        <text
          x={cx} y={cy + 14}
          textAnchor="middle" dominantBaseline="central"
          className="fill-[#8b949e]" fontSize="9"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          WEEK SCORE
        </text>
      </svg>
      <span className="text-[10px] font-semibold" style={{ color }}>
        {score >= 75 ? 'Excellent Week' : score >= 50 ? 'Good Week' : score >= 25 ? 'Average Week' : 'Tough Week'}
      </span>
    </div>
  );
}

export default function WeeklySummary({ onClose }: WeeklySummaryProps) {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const notifications = useGameStore(state => state.notifications);

  // ── All useMemo hooks before early return ──

  const computed = useMemo(() => {
    if (!gameState) return null;

    const { player, currentClub, recentResults, currentWeek, currentSeason, leagueTable, trainingHistory } = gameState;

    // Latest match result
    const latestMatch = recentResults.length > 0 ? recentResults[0] : null;

    // Previous match result for week-over-week comparison
    const previousMatch = recentResults.length > 1 ? recentResults[1] : null;

    // Match outcome
    const playerWon = latestMatch
      ? (latestMatch.homeClub.id === currentClub.id && latestMatch.homeScore > latestMatch.awayScore) ||
        (latestMatch.awayClub.id === currentClub.id && latestMatch.awayScore > latestMatch.homeScore)
      : false;
    const playerDrew = latestMatch ? latestMatch.homeScore === latestMatch.awayScore : false;
    const playerLost = latestMatch ? !playerWon && !playerDrew : false;

    // W/D/L result label
    const resultLabel = playerWon ? 'W' : playerDrew ? 'D' : 'L';
    const resultColor = playerWon
      ? 'bg-emerald-500 text-white'
      : playerDrew
        ? 'bg-amber-500 text-white'
        : 'bg-red-500 text-white';

    // Week-over-week trend indicators for Form, Morale, Fitness
    // Compare current match rating vs previous match rating
    const formDelta = latestMatch && previousMatch
      ? +(latestMatch.playerRating - previousMatch.playerRating).toFixed(1)
      : null;

    // Morale and fitness don't have previous values stored directly,
    // so we infer from match context (did we win/lose, minutes played)
    const moraleDelta = latestMatch
      ? playerWon ? 2 : playerDrew ? 0 : -1
      : null;
    const fitnessDelta = latestMatch
      ? -(Math.min(latestMatch.playerMinutesPlayed, 90) / 30) // approximate fatigue
      : null;

    // League position context
    const clubStanding = leagueTable.find(s => s.clubId === currentClub.id);
    const currentPosition = clubStanding ? leagueTable.indexOf(clubStanding) + 1 : null;
    const topPoints = leagueTable.length > 0 ? Math.max(...leagueTable.map(s => s.points)) : 0;
    const pointsOffLead = clubStanding ? (topPoints - clubStanding.points) : 0;

    // Previous league position from seasons history
    let previousPosition: number | null = null;
    if (gameState.seasons.length > 0) {
      const prevSeason = gameState.seasons[gameState.seasons.length - 1];
      if (prevSeason && prevSeason.number === currentSeason) {
        // Same season - no prev season position to compare
        previousPosition = null;
      }
    }

    // League name from club
    const leagueName = currentClub.league || 'League';

    // Training sessions from this week (use last 2 entries as recent)
    const recentTraining = trainingHistory.slice(-2);

    // Training gains summary - show the last training session details
    const lastTraining = recentTraining.length > 0 ? recentTraining[recentTraining.length - 1] : null;

    // Training type labels and icons
    const trainingTypeLabels: Record<string, string> = {
      attacking: 'Attacking',
      defensive: 'Defensive',
      physical: 'Physical',
      technical: 'Technical',
      tactical: 'Tactical',
      recovery: 'Recovery',
    };

    const trainingTypeIcons: Record<string, string> = {
      attacking: '⚽',
      defensive: '🛡️',
      physical: '💪',
      technical: '🧠',
      tactical: '📋',
      recovery: '🩹',
    };

    // Intensity labels
    const intensityLabel = lastTraining
      ? lastTraining.intensity >= 90 ? 'High' : lastTraining.intensity >= 60 ? 'Medium' : 'Low'
      : null;

    const intensityColor = lastTraining
      ? lastTraining.intensity >= 90 ? 'text-red-400' : lastTraining.intensity >= 60 ? 'text-amber-400' : 'text-emerald-400'
      : null;

    // Week notifications
    const weekNotifications = notifications.slice(0, 5);

    // Form icon based on current form
    const formIcon = player.form >= 7 ? 'trending-up' : player.form >= 5 ? 'minus' : 'trending-down';

    // Performance Score (0-100)
    const performanceScore = latestMatch
      ? Math.round(Math.min(100,
          (latestMatch.playerRating / 10) * 40 +
          (player.form / 10) * 30 +
          (player.fitness / 100) * 15 +
          Math.min(15, (latestMatch.playerGoals * 3 + latestMatch.playerAssists * 2))
        ))
      : Math.round(Math.min(100, (player.form / 10) * 40 + (player.fitness / 100) * 30 + 20));

    // Attribute changes from training
    const attributeChanges: { attribute: string; change: number }[] = [];
    if (lastTraining && lastTraining.focusAttribute) {
      const baseGain = 0.5 + (lastTraining.intensity / 100) * 1.0;
      attributeChanges.push({ attribute: lastTraining.focusAttribute, change: +baseGain.toFixed(1) });
    }
    if (latestMatch && latestMatch.playerMinutesPlayed > 60 && latestMatch.playerRating >= 7.5) {
      const matchGain = +((latestMatch.playerRating - 7.0) * 0.5).toFixed(1);
      if (matchGain > 0) {
        attributeChanges.push({ attribute: 'Composure', change: matchGain });
      }
    }

    // Financial summary
    const weeklyWage = ((player.contract as any)?.weeklyWage ?? 15000) / 1000;
    const matchBonus = latestMatch
      ? ((playerWon ? 5000 : playerDrew ? 2000 : 0) + (latestMatch.playerGoals * 2500) + (latestMatch.playerAssists * 1500)) / 1000
      : 0;
    const weeklyExpenses = 1.8;

    // Week highlights
    const weekHighlights: { icon: string; label: string; value: string; colorClass: string }[] = [];
    if (latestMatch) {
      weekHighlights.push({
        icon: playerWon ? '\u{1F3C6}' : playerDrew ? '\u{1F91D}' : '\u{1F624}',
        label: 'Match Result',
        value: `${resultLabel} ${latestMatch.homeScore}-${latestMatch.awayScore}`,
        colorClass: playerWon ? 'border-emerald-500/20 bg-emerald-500/5' : playerDrew ? 'border-amber-500/20 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5',
      });
    }
    if (lastTraining) {
      weekHighlights.push({
        icon: trainingTypeIcons[lastTraining.type] || '\u{1F3CB}',
        label: 'Training',
        value: `${trainingTypeLabels[lastTraining.type] || lastTraining.type} (${intensityLabel})`,
        colorClass: 'border-sky-500/20 bg-sky-500/5',
      });
    }
    if (attributeChanges.length > 0) {
      weekHighlights.push({
        icon: '\u{1F4C8}',
        label: 'Attributes',
        value: `+${attributeChanges.length} improvement${attributeChanges.length > 1 ? 's' : ''}`,
        colorClass: 'border-emerald-500/20 bg-emerald-500/5',
      });
    }
    weekHighlights.push({
      icon: '\u{1F4B0}',
      label: 'Income',
      value: formatCurrency(weeklyWage + matchBonus, 'K'),
      colorClass: 'border-sky-500/20 bg-sky-500/5',
    });

    return {
      player, currentClub, latestMatch, previousMatch,
      playerWon, playerDrew, playerLost,
      resultLabel, resultColor,
      formDelta, moraleDelta, fitnessDelta,
      currentPosition, topPoints, pointsOffLead,
      previousPosition, leagueName,
      recentTraining, lastTraining,
      trainingTypeLabels, trainingTypeIcons,
      intensityLabel, intensityColor,
      weekNotifications, formIcon,
      currentWeek, currentSeason,
      recentResults,
      performanceScore, attributeChanges, weeklyWage, matchBonus, weeklyExpenses, weekHighlights,
    };
  }, [gameState, notifications]);

  if (!gameState || !computed) return null;

  const {
    player, currentClub, latestMatch,
    playerWon, playerDrew, playerLost,
    resultLabel, resultColor,
    formDelta, moraleDelta, fitnessDelta,
    currentPosition, pointsOffLead, leagueName,
    lastTraining, trainingTypeLabels, trainingTypeIcons,
    intensityLabel, intensityColor,
    formIcon,
    currentWeek, currentSeason,
    performanceScore, attributeChanges, weeklyWage, matchBonus, weeklyExpenses, weekHighlights,
  } = computed;

  // Trend indicator component
  const TrendIndicator = ({ delta, format = (d: number) => (d > 0 ? `+${d}` : `${d}`) }: {
    delta: number | null;
    format?: (d: number) => string;
  }) => {
    if (delta === null) return null;
    if (delta > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
          <ArrowUp className="h-3 w-3" />
          {format(delta)}
        </span>
      );
    }
    if (delta < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-red-400 text-xs font-semibold">
          <ArrowDown className="h-3 w-3" />
          {format(delta)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-slate-500 text-xs">
        <Minus className="h-3 w-3" />
        0
      </span>
    );
  };

  // Mini progress bar component
  const MiniProgressBar = ({ value, max = 100, thresholds }: { value: number; max?: number; thresholds: [number, number] }) => {
    const pct = Math.min(100, (value / max) * 100);
    return (
      <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
        <div
          className={`h-full rounded-sm ${getStatBarColor(value, thresholds)} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-md max-h-[85vh] overflow-hidden shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#30363d] bg-[#161b22]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <div className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/25 rounded-md">
                    <span className="text-xs font-bold text-emerald-400">WK {currentWeek}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Weekly Report</h2>
                  <p className="text-xs text-[#8b949e]">Season {currentSeason}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-5 space-y-4">

            {/* ── Performance Score + Week Highlights ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="flex gap-4 items-start"
            >
              <PerformanceRing score={performanceScore} size={110} strokeWidth={7} />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-[#8b949e] font-semibold">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Week Highlights</span>
                </div>
                {weekHighlights.map((h, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border ${h.colorClass}`}
                  >
                    <span className="text-sm shrink-0">{h.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-[#8b949e] block">{h.label}</span>
                      <span className="text-xs font-medium text-[#c9d1d9] truncate block">{h.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Match Result Card ── */}
            {latestMatch ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                  <Swords className="h-3.5 w-3.5" />
                  <span>Match Result</span>
                </div>
                <div className={`rounded-lg border-l-4 p-4 ${
                  playerWon
                    ? 'bg-emerald-950/30 border-l-emerald-500 border border-emerald-800/30'
                    : playerDrew
                      ? 'bg-amber-950/30 border-l-amber-500 border border-amber-800/30'
                      : 'bg-red-950/30 border-l-red-500 border border-red-800/30'
                }`}>
                  {/* W/D/L badge + competition */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${resultColor}`}>
                      {resultLabel}
                    </span>
                    {latestMatch.competition && (
                      <span className="text-[10px] text-[#8b949e]">{latestMatch.competition}</span>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg shrink-0">{latestMatch.homeClub.logo}</span>
                      <span className="text-sm font-semibold text-[#c9d1d9] truncate">
                        {latestMatch.homeClub.shortName || latestMatch.homeClub.name.slice(0, 3)}
                      </span>
                    </div>
                    <div className="text-xl font-black text-white px-3 shrink-0">
                      {latestMatch.homeScore} - {latestMatch.awayScore}
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-semibold text-[#c9d1d9] truncate">
                        {latestMatch.awayClub.shortName || latestMatch.awayClub.name.slice(0, 3)}
                      </span>
                      <span className="text-lg shrink-0">{latestMatch.awayClub.logo}</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-center gap-6 pt-2 border-t border-[#30363d]">
                    <div className="text-center">
                      <div
                        className="text-2xl font-black"
                        style={{
                          color: latestMatch.playerRating >= 7
                            ? '#10b981'
                            : latestMatch.playerRating >= 6
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {latestMatch.playerRating.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-[#8b949e]">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-400">{latestMatch.playerGoals}</div>
                      <div className="text-[10px] text-[#8b949e]">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">{latestMatch.playerAssists}</div>
                      <div className="text-[10px] text-[#8b949e]">Assists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#c9d1d9]">
                        {latestMatch.playerMinutesPlayed}&apos;
                      </div>
                      <div className="text-[10px] text-[#8b949e]">Mins</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-3 p-3 bg-[#21262d] rounded-lg border-l-4 border-l-slate-600"
              >
                <Swords className="h-5 w-5 text-[#484f58]" />
                <div>
                  <p className="text-sm text-[#8b949e]">No match this week</p>
                  <p className="text-xs text-[#484f58]">Training and rest week</p>
                </div>
              </motion.div>
            )}

            {/* ── League Position Context ── */}
            {currentPosition !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`rounded-lg p-3 border-l-4 ${getStatAccentColor(
                  currentPosition <= 3 ? 10 - currentPosition : 0,
                  [7, 5]
                )} bg-[#21262d]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Medal className={`h-4 w-4 ${
                      currentPosition === 1
                        ? 'text-amber-400'
                        : currentPosition <= 4
                          ? 'text-emerald-400'
                          : currentPosition <= 8
                            ? 'text-blue-400'
                            : 'text-slate-400'
                    }`} />
                    <span className="text-sm text-[#c9d1d9]">
                      {currentPosition === 1
                        ? `You're ${formatPosition(currentPosition)} in ${leagueName}!`
                        : `${formatPosition(currentPosition)} in ${leagueName}`}
                    </span>
                  </div>
                  {currentPosition !== 1 && (
                    <span className="text-xs text-[#8b949e]">
                      {pointsOffLead === 0
                        ? 'Level on points'
                        : `${pointsOffLead} pt${pointsOffLead !== 1 ? 's' : ''} off the lead`}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Player Status with Trend Indicators ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                <Zap className="h-3.5 w-3.5" />
                <span>Player Status</span>
              </div>
              <div className="space-y-2">
                {/* Form */}
                <div className={`bg-[#21262d] rounded-lg p-3 border-l-4 ${getStatAccentColor(player.form, [7, 5])}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {formIcon === 'trending-up' ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : formIcon === 'trending-down' ? (
                        <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Minus className="h-3.5 w-3.5 text-amber-400" />
                      )}
                      <span className="text-xs text-[#8b949e]">Form</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#c9d1d9]">{player.form.toFixed(1)}</span>
                      <TrendIndicator delta={formDelta} format={(d) => (d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1))} />
                    </div>
                  </div>
                  <MiniProgressBar value={player.form} max={10} thresholds={[7, 5]} />
                </div>

                {/* Morale */}
                <div className={`bg-[#21262d] rounded-lg p-3 border-l-4 ${getStatAccentColor(player.morale, [70, 40])}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs text-[#8b949e]">Morale</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-400">{player.morale}</span>
                      <TrendIndicator delta={moraleDelta} />
                    </div>
                  </div>
                  <MiniProgressBar value={player.morale} max={100} thresholds={[70, 40]} />
                </div>

                {/* Fitness */}
                <div className={`bg-[#21262d] rounded-lg p-3 border-l-4 ${getStatAccentColor(player.fitness, [70, 40])}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs text-[#8b949e]">Fitness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-400">{player.fitness}</span>
                      <TrendIndicator delta={fitnessDelta} format={(d) => (d > 0 ? `+${d.toFixed(0)}` : d.toFixed(0))} />
                    </div>
                  </div>
                  <MiniProgressBar value={player.fitness} max={100} thresholds={[70, 40]} />
                </div>
              </div>

              {/* Injury Status */}
              {player.injuryWeeks > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-950/30 border border-red-800/30 rounded-lg p-3 border-l-4 border-l-red-500 flex items-center gap-3"
                >
                  <span className="text-xl">🏥</span>
                  <div>
                    <p className="text-sm font-semibold text-red-300">Injured!</p>
                    <p className="text-xs text-red-400/70">
                      {player.injuryWeeks} week{player.injuryWeeks > 1 ? 's' : ''} remaining until recovery
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* ── Training Summary ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                <Dumbbell className="h-3.5 w-3.5" />
                <span>Training</span>
              </div>

              {lastTraining ? (
                <div className="bg-[#21262d] rounded-lg p-3 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {trainingTypeIcons[lastTraining.type] || '🏋️'}
                      </span>
                      <span className="text-sm font-semibold text-[#c9d1d9]">
                        {trainingTypeLabels[lastTraining.type] || lastTraining.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {intensityLabel && (
                        <span className={`text-xs font-semibold ${intensityColor}`}>
                          {intensityLabel} ({lastTraining.intensity}%)
                        </span>
                      )}
                    </div>
                  </div>
                  {lastTraining.focusAttribute && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs text-[#8b949e]">
                        Focus: <span className="text-emerald-400 font-medium">{lastTraining.focusAttribute}</span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-[#8b949e]">
                    <span>Training completed this week</span>
                    <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-[10px] px-1.5">
                      ✓ Done
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="bg-[#21262d] rounded-lg p-3 border-l-4 border-l-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-[#484f58]" />
                      <span className="text-sm text-[#8b949e]">No training completed</span>
                    </div>
                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                      {gameState.trainingAvailable} left
                    </Badge>
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Attribute Changes This Week ── */}
            {attributeChanges.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Attribute Changes</span>
                </div>
                <div className="space-y-1.5">
                  {attributeChanges.map((ac, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2.5 border border-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-sm text-[#c9d1d9]">{ac.attribute}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-400">+{ac.change}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Financial Summary ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.27 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                <Wallet className="h-3.5 w-3.5" />
                <span>Financial Summary</span>
              </div>
              <div className="bg-[#21262d] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-3.5 w-3.5 text-sky-400" />
                    <span className="text-xs text-[#8b949e]">Weekly Wage</span>
                  </div>
                  <span className="text-sm font-bold text-sky-400">{formatCurrency(weeklyWage, 'K')}</span>
                </div>
                <div className="h-px bg-[#30363d]" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs text-[#8b949e]">Match Bonus</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(matchBonus, 'K')}</span>
                </div>
                <div className="h-px bg-[#30363d]" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-xs text-[#8b949e]">Expenses</span>
                  </div>
                  <span className="text-sm font-bold text-red-400">-{formatCurrency(weeklyExpenses, 'K')}</span>
                </div>
                <div className="h-px bg-[#30363d]" />
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs font-semibold text-[#c9d1d9]">Net Income</span>
                  <span className={`text-sm font-bold ${weeklyWage + matchBonus - weeklyExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(weeklyWage + matchBonus - weeklyExpenses, 'K')}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Active Events ── */}
            {gameState.activeEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                  <Bell className="h-3.5 w-3.5" />
                  <span>Pending Events</span>
                  <Badge variant="outline" className="border-amber-700 text-amber-400 text-[10px] px-1.5">
                    {gameState.activeEvents.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {gameState.activeEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="bg-amber-950/20 border border-amber-800/20 rounded-lg p-3 border-l-4 border-l-amber-500"
                    >
                      <p className="text-sm font-semibold text-amber-300">{event.title}</p>
                      <p className="text-xs text-[#8b949e] mt-0.5 line-clamp-2">{event.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Market Value ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-[#21262d] rounded-lg p-3 flex items-center justify-between border-l-4 border-l-emerald-500"
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-[#8b949e]">Market Value</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                {formatCurrency(player.marketValue, 'M')}
              </span>
            </motion.div>

            {/* ── Next Week Preview ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-[#8b949e] font-semibold">
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Next Week Preview</span>
              </div>
              <div className="bg-[#21262d] rounded-lg p-3 space-y-2.5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Swords className="h-3.5 w-3.5 text-sky-400" />
                    <span className="text-xs text-[#8b949e]">Upcoming Match</span>
                  </div>
                  <p className="text-sm text-[#c9d1d9] font-medium pl-5">
                    {currentClub.shortName || currentClub.name} vs TBD — Week {currentWeek + 1}
                  </p>
                </div>
                <div className="h-px bg-[#30363d]" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs text-[#8b949e]">Training Recommendation</span>
                  </div>
                  <p className="text-sm text-[#c9d1d9] pl-5">
                    {player.fitness < 50
                      ? 'Focus on recovery sessions to rebuild fitness'
                      : player.form < 6
                        ? 'Technical drills recommended to improve form'
                        : 'High-intensity tactical training available'
                    }
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Quick Action Buttons ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex gap-2"
            >
              <Button
                onClick={() => {
                  onClose();
                  setScreen('training');
                }}
                className="flex-1 h-10 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-sm gap-1.5"
              >
                <Dumbbell className="h-3.5 w-3.5" />
                Train Now
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  setScreen('analytics');
                }}
                className="flex-1 h-10 border-slate-700 text-[#c9d1d9] hover:bg-slate-800 hover:text-white font-semibold rounded-lg text-sm gap-1.5"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                View Stats
              </Button>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[#30363d] bg-[#161b22]">
            <Button
              onClick={onClose}
              className="w-full h-11 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg"
            >
              Continue
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
