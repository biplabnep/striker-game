'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/lib/game/gameUtils';
import {
  X, Trophy, Swords, Dumbbell, Bell, TrendingUp, TrendingDown,
  Minus, Zap, ArrowUp, ArrowDown, BarChart3, Activity, Heart,
  Target, Star, Medal
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
          <div className="relative px-5 py-4 border-b border-[#30363d] bg-[#161b22]">
            <div className="absolute inset-0 opacity-5 bg-emerald-600/20" />
            <div className="flex items-center justify-between relative">
              <div>
                <h2 className="text-lg font-bold text-white">Weekly Summary</h2>
                <p className="text-xs text-[#8b949e]">
                  Season {currentSeason} &bull; Week {currentWeek - 1} &rarr; {currentWeek}
                </p>
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
