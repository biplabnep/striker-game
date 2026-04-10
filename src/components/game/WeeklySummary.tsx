'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { formatCurrency } from '@/lib/game/gameUtils';
import { X, Trophy, Swords, Dumbbell, Bell, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WeeklySummaryProps {
  onClose: () => void;
}

export default function WeeklySummary({ onClose }: WeeklySummaryProps) {
  const gameState = useGameStore(state => state.gameState);
  const notifications = useGameStore(state => state.notifications);

  if (!gameState) return null;

  const { player, currentClub, recentResults, currentWeek, currentSeason } = gameState;

  // Get the latest match result (if any)
  const latestMatch = recentResults.length > 0 ? recentResults[0] : null;
  const playerWon = latestMatch
    ? (latestMatch.homeClub.id === currentClub.id && latestMatch.homeScore > latestMatch.awayScore) ||
      (latestMatch.awayClub.id === currentClub.id && latestMatch.awayScore > latestMatch.homeScore)
    : false;
  const playerDrew = latestMatch ? latestMatch.homeScore === latestMatch.awayScore : false;

  // Get recent notifications from this week
  const weekNotifications = notifications.slice(0, 5);

  // Form change indicator
  const formIcon = player.form >= 7 ? <TrendingUp className="h-4 w-4 text-emerald-400" /> :
                   player.form >= 5 ? <Minus className="h-4 w-4 text-amber-400" /> :
                   <TrendingDown className="h-4 w-4 text-red-400" />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-emerald-600/0 via-emerald-600/20 to-emerald-600/0" />
          <div className="flex items-center justify-between relative">
            <div>
              <h2 className="text-lg font-bold text-white">Weekly Summary</h2>
              <p className="text-xs text-slate-400">Season {currentSeason} • Week {currentWeek - 1} → {currentWeek}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-5 space-y-4">

          {/* Match Result */}
          {latestMatch ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                <Swords className="h-3.5 w-3.5" />
                <span>Match Result</span>
              </div>
              <div className={`rounded-xl p-4 ${
                playerWon ? 'bg-emerald-900/20 border border-emerald-800/30' :
                playerDrew ? 'bg-amber-900/20 border border-amber-800/30' :
                'bg-red-900/20 border border-red-800/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{latestMatch.homeClub.logo}</span>
                    <span className="text-sm font-semibold text-slate-200">{latestMatch.homeClub.shortName || latestMatch.homeClub.name.slice(0, 3)}</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {latestMatch.homeScore} - {latestMatch.awayScore}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{latestMatch.awayClub.shortName || latestMatch.awayClub.name.slice(0, 3)}</span>
                    <span className="text-lg">{latestMatch.awayClub.logo}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-700/50">
                  <div className="text-center">
                    <div className="text-2xl font-black" style={{ color: latestMatch.playerRating >= 7 ? '#10b981' : latestMatch.playerRating >= 6 ? '#f59e0b' : '#ef4444' }}>
                      {latestMatch.playerRating.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-slate-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-400">{latestMatch.playerGoals}</div>
                    <div className="text-[10px] text-slate-500">Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{latestMatch.playerAssists}</div>
                    <div className="text-[10px] text-slate-500">Assists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-300">{latestMatch.playerMinutesPlayed}&apos;</div>
                    <div className="text-[10px] text-slate-500">Mins</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
              <Swords className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-400">No match this week</p>
                <p className="text-xs text-slate-600">Training and rest week</p>
              </div>
            </div>
          )}

          {/* Player Status Changes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <Zap className="h-3.5 w-3.5" />
              <span>Player Status</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {formIcon}
                </div>
                <p className="text-lg font-bold text-slate-200">{player.form.toFixed(1)}</p>
                <p className="text-[10px] text-slate-500">Form</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-amber-400">{player.morale}</p>
                <p className="text-[10px] text-slate-500">Morale</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-blue-400">{player.fitness}</p>
                <p className="text-[10px] text-slate-500">Fitness</p>
              </div>
            </div>

            {/* Injury Status */}
            {player.injuryWeeks > 0 && (
              <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">🏥</span>
                <div>
                  <p className="text-sm font-semibold text-red-300">Injured!</p>
                  <p className="text-xs text-red-400/70">{player.injuryWeeks} week{player.injuryWeeks > 1 ? 's' : ''} remaining until recovery</p>
                </div>
              </div>
            )}
          </div>

          {/* Training Completed */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Training</span>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Sessions Available</span>
                <Badge variant="outline" className="border-emerald-700 text-emerald-400 text-xs">
                  {gameState.trainingAvailable} left
                </Badge>
              </div>
            </div>
          </div>

          {/* Active Events */}
          {gameState.activeEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                <Bell className="h-3.5 w-3.5" />
                <span>Pending Events</span>
              </div>
              <div className="space-y-2">
                {gameState.activeEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="bg-amber-900/15 border border-amber-800/20 rounded-xl p-3">
                    <p className="text-sm font-semibold text-amber-300">{event.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Value */}
          <div className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-slate-400">Market Value</span>
            </div>
            <span className="text-sm font-bold text-emerald-400">{formatCurrency(player.marketValue, 'M')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/80">
          <Button
            onClick={onClose}
            className="w-full h-11 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl"
          >
            Continue
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
