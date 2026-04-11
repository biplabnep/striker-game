'use client';

import { useGameStore } from '@/store/gameStore';
import { getClubById, getLeagueById, getSeasonMatchdays } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy, TrendingUp, ArrowDown, Minus, ChevronUp, ChevronDown,
  ArrowUpRight, ArrowDownRight, Activity, Shield, Swords, Target,
  BarChart3, Flame, Zap, Crown
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Form result dot component
function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = {
    W: 'bg-emerald-400',
    D: 'bg-amber-400',
    L: 'bg-red-400',
  };
  return (
    <div className={`w-4 h-4 rounded-full ${colors[result]} flex items-center justify-center`}>
      <span className="text-[7px] font-black text-white">
        {result}
      </span>
    </div>
  );
}

// Position change indicator
function PositionChange({ current, previous }: { current: number; previous?: number }) {
  if (!previous || previous === current) {
    return <span className="text-[#484f58] text-[9px]">—</span>;
  }
  const diff = previous - current;
  if (diff > 0) {
    return (
      <div className="flex items-center text-emerald-400">
        <ChevronUp className="w-3 h-3" />
        <span className="text-[9px] font-bold">{diff}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center text-red-400">
      <ChevronDown className="w-3 h-3" />
      <span className="text-[9px] font-bold">{Math.abs(diff)}</span>
    </div>
  );
}

type SortKey = 'points' | 'gd' | 'won' | 'goalsFor' | 'form';

export default function LeagueTable() {
  const gameState = useGameStore(state => state.gameState);
  const [sortBy, setSortBy] = useState<SortKey>('points');
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  const leagueInfo = useMemo(() => {
    if (!gameState) return null;
    return getLeagueById(gameState.currentClub.league);
  }, [gameState]);

  // Derive form from recent results per club
  const clubForm = useMemo(() => {
    if (!gameState) return new Map<string, ('W' | 'D' | 'L')[]>();
    const formMap = new Map<string, ('W' | 'D' | 'L')[]>();

    // Build form from recent results (last 5)
    const results = gameState.recentResults.slice(0, 5);
    for (const result of results) {
      // Home club result
      const homeResult: 'W' | 'D' | 'L' = result.homeScore > result.awayScore ? 'W' : result.homeScore === result.awayScore ? 'D' : 'L';
      const awayResult: 'W' | 'D' | 'L' = result.awayScore > result.homeScore ? 'W' : result.homeScore === result.awayScore ? 'D' : 'L';

      const homeForm = formMap.get(result.homeClub.id) || [];
      homeForm.unshift(homeResult);
      formMap.set(result.homeClub.id, homeForm.slice(0, 5));

      const awayForm = formMap.get(result.awayClub.id) || [];
      awayForm.unshift(awayResult);
      formMap.set(result.awayClub.id, awayForm.slice(0, 5));
    }

    // For clubs not in recent results, generate placeholder form based on league position
    for (const entry of gameState.leagueTable) {
      if (!formMap.has(entry.clubId)) {
        const winRate = entry.won / Math.max(1, entry.played);
        const form: ('W' | 'D' | 'L')[] = [];
        for (let i = 0; i < 5; i++) {
          const r = Math.random();
          if (r < winRate) form.push('W');
          else if (r < winRate + (entry.drawn / Math.max(1, entry.played))) form.push('D');
          else form.push('L');
        }
        formMap.set(entry.clubId, form);
      }
    }

    return formMap;
  }, [gameState]);

  // Previous positions (simulate from form changes)
  const previousPositions = useMemo(() => {
    if (!gameState) return new Map<string, number>();
    // Use league table order to simulate position changes
    const posMap = new Map<string, number>();
    // Sort by points then GD to get "previous" positions with small random variation
    const sorted = [...gameState.leagueTable].sort((a, b) => {
      const ptsDiff = b.points - a.points;
      if (ptsDiff !== 0) return ptsDiff;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
    for (let i = 0; i < sorted.length; i++) {
      // Add slight randomness to simulate movement
      const variation = Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : -1) : 0;
      posMap.set(sorted[i].clubId, Math.max(1, i + 1 + variation));
    }
    return posMap;
  }, [gameState]);

  if (!gameState) return null;

  const { leagueTable, currentClub, currentSeason, recentResults } = gameState;

  const getPositionIndicator = (pos: number) => {
    if (pos <= 4) return { color: '#10b981', label: 'UCL', icon: <Trophy className="h-3 w-3" /> };
    if (pos <= 6) return { color: '#3b82f6', label: 'UEL', icon: <TrendingUp className="h-3 w-3" /> };
    if (pos >= leagueTable.length - 2) return { color: '#ef4444', label: 'REL', icon: <ArrowDown className="h-3 w-3" /> };
    return { color: '#94a3b8', label: '', icon: <Minus className="h-3 w-3" /> };
  };

  const getFormPoints = (clubId: string): number => {
    const form = clubForm.get(clubId) || [];
    return form.reduce((sum, r) => sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
  };

  const getFormLabel = (clubId: string): { text: string; color: string } => {
    const pts = getFormPoints(clubId);
    if (pts >= 12) return { text: 'Excellent', color: 'text-emerald-400' };
    if (pts >= 8) return { text: 'Good', color: 'text-emerald-300' };
    if (pts >= 5) return { text: 'Average', color: 'text-amber-400' };
    if (pts >= 2) return { text: 'Poor', color: 'text-red-300' };
    return { text: 'Awful', color: 'text-red-500' };
  };

  const maxPoints = Math.max(...leagueTable.map(e => e.points), 1);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            League Table
          </h2>
          {leagueInfo && (
            <p className="text-[10px] text-[#8b949e] mt-0.5">
              {leagueInfo.emoji} {leagueInfo.name} • Season {currentSeason}
            </p>
          )}
        </div>
        <Badge variant="outline" className="border-[#30363d] text-[#8b949e] text-[10px]">
          Week {gameState.currentWeek}/{getSeasonMatchdays(gameState.currentClub.league)}
        </Badge>
      </div>

      {/* Zone Legend */}
      <div className="flex items-center gap-4 text-[10px] px-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[#8b949e]">Champions League</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[#8b949e]">Europa League</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[#8b949e]">Relegation</span>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { key: 'points' as SortKey, label: 'Points', icon: <Trophy className="w-3 h-3" /> },
          { key: 'gd' as SortKey, label: 'GD', icon: <Target className="w-3 h-3" /> },
          { key: 'won' as SortKey, label: 'Wins', icon: <Shield className="w-3 h-3" /> },
          { key: 'goalsFor' as SortKey, label: 'Goals', icon: <Swords className="w-3 h-3" /> },
          { key: 'form' as SortKey, label: 'Form', icon: <Activity className="w-3 h-3" /> },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
              sortBy === opt.key
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#21262d] text-[#8b949e] border border-[#30363d] hover:bg-slate-700/50'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="bg-[#161b22] rounded-t-xl border border-[#30363d] border-b-0">
        <div className="grid grid-cols-[1.5rem_2rem_1fr_3rem_3rem_3.5rem_3.5rem] gap-0.5 px-2.5 py-2 text-[9px] text-[#8b949e]  font-semibold items-center">
          <span className="text-center">↕</span>
          <span>#</span>
          <span>Club</span>
          <span className="text-center">P</span>
          <span className="text-center">GD</span>
          <span className="text-center">Pts</span>
          <span className="text-center">Form</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-[#161b22] rounded-b-xl border border-[#30363d] border-t-0 overflow-hidden">
        {leagueTable.map((entry, idx) => {
          const pos = idx + 1;
          const club = getClubById(entry.clubId);
          const isPlayer = entry.clubId === currentClub.id;
          const indicator = getPositionIndicator(pos);
          const gd = entry.goalsFor - entry.goalsAgainst;
          const form = clubForm.get(entry.clubId) || [];
          const formInfo = getFormLabel(entry.clubId);
          const prevPos = previousPositions.get(entry.clubId);
          const isExpanded = expandedClub === entry.clubId;

          return (
            <motion.div key={entry.clubId}>
              <div
                onClick={() => setExpandedClub(isExpanded ? null : entry.clubId)}
                className={`grid grid-cols-[1.5rem_2rem_1fr_3rem_3rem_3.5rem_3.5rem] gap-0.5 px-2.5 py-2 items-center text-sm transition-colors cursor-pointer ${
                  isPlayer
                    ? 'bg-emerald-900/20 border-l-2 border-emerald-500'
                    : 'border-l-2 border-transparent hover:bg-[#21262d]'
                } ${idx < leagueTable.length - 1 ? 'border-b border-[#30363d]' : ''}`}
              >
                {/* Position change */}
                <PositionChange current={pos} previous={prevPos} />

                {/* Position */}
                <div className="flex items-center">
                  <span className={`text-xs font-bold ${isPlayer ? 'text-emerald-400' : pos <= 4 ? 'text-emerald-300' : pos <= 6 ? 'text-blue-300' : pos >= leagueTable.length - 2 ? 'text-red-300' : 'text-[#8b949e]'}`}>
                    {pos}
                  </span>
                </div>

                {/* Club Name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm flex-shrink-0">{club?.logo || '⚽'}</span>
                  <span className={`truncate text-xs font-medium ${isPlayer ? 'text-emerald-300' : 'text-[#c9d1d9]'}`}>
                    {club?.shortName || entry.clubName}
                  </span>
                  {isPlayer && (
                    <Badge className="text-[7px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold">
                      YOU
                    </Badge>
                  )}
                </div>

                {/* Played */}
                <span className="text-center text-[11px] text-[#8b949e]">{entry.played}</span>

                {/* Goal Difference */}
                <span className={`text-center text-[11px] font-medium ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                  {gd > 0 ? '+' : ''}{gd}
                </span>

                {/* Points */}
                <span className={`text-center text-[11px] font-bold ${isPlayer ? 'text-emerald-300' : 'text-white'}`}>
                  {entry.points}
                </span>

                {/* Form dots */}
                <div className="flex items-center justify-center gap-0.5">
                  {form.length > 0 ? form.map((r, i) => (
                    <FormDot key={i} result={r} />
                  )) : (
                    <span className="text-[9px] text-[#484f58]">—</span>
                  )}
                </div>
              </div>

              {/* Expanded Detail Row */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={`px-3 py-3 ${isPlayer ? 'bg-emerald-950/20' : 'bg-[#21262d]'} border-b border-[#30363d]`}>
                      {/* Club header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{club?.logo}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#c9d1d9]">{entry.clubName}</p>
                          <p className="text-[10px] text-[#8b949e] flex items-center gap-1">
                            <span className={formInfo.color}>{formInfo.text} form</span>
                            <span>•</span>
                            <span>{getFormPoints(entry.clubId)} pts from last {form.length || 5}</span>
                          </p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {[
                          { value: entry.played, label: 'P', color: 'text-[#c9d1d9]' },
                          { value: entry.won, label: 'W', color: 'text-emerald-400' },
                          { value: entry.drawn, label: 'D', color: 'text-amber-400' },
                          { value: entry.lost, label: 'L', color: 'text-red-400' },
                          { value: entry.goalsFor, label: 'GF', color: 'text-[#c9d1d9]' },
                          { value: entry.goalsAgainst, label: 'GA', color: 'text-[#8b949e]' },
                          { value: `${gd > 0 ? '+' : ''}${gd}`, label: 'GD', color: gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-[#161b22]/60 rounded-md py-1.5 px-0.5">
                            <p className={`text-xs font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-[8px] text-[#484f58]">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Points progress bar */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-[#8b949e]">Points Progress</span>
                          <span className="text-[9px] text-[#8b949e] font-semibold">{entry.points} / {Math.round(maxPoints * 1.1)}</span>
                        </div>
                        <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isPlayer
                                ? 'bg-emerald-500'
                                : 'bg-slate-500'
                            }`}
                            style={{ width: `${Math.min(100, (entry.points / Math.max(maxPoints * 1.1, 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Win rate */}
                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="text-[#8b949e]">Win Rate</span>
                        <span className="text-[#c9d1d9] font-semibold">
                          {entry.played > 0 ? Math.round((entry.won / entry.played) * 100) : 0}%
                        </span>
                      </div>

                      {/* Avg goals per game */}
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-[#8b949e]">Goals / Game</span>
                        <span className="text-[#c9d1d9] font-semibold">
                          {entry.played > 0 ? (entry.goalsFor / entry.played).toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Your Position Summary Card */}
      {(() => {
        const playerPos = leagueTable.findIndex(e => e.clubId === currentClub.id) + 1;
        const playerEntry = leagueTable.find(e => e.clubId === currentClub.id);
        if (!playerEntry) return null;
        const indicator = getPositionIndicator(playerPos);
        const playerForm = clubForm.get(currentClub.id) || [];
        const formPts = getFormPoints(currentClub.id);
        const formInfo = getFormLabel(currentClub.id);
        const gd = playerEntry.goalsFor - playerEntry.goalsAgainst;

        // Points needed for next zone
        const pointsToUCL = playerPos > 4 ? (leagueTable[3]?.points ?? 0) - playerEntry.points + 1 : 0;
        const pointsFromRel = playerPos >= leagueTable.length - 2 ? playerEntry.points - (leagueTable[leagueTable.length - 3]?.points ?? 0) : 0;

        return (
          <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
            <div className="h-1 bg-emerald-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currentClub.logo}</span>
                  <div>
                    <p className="font-bold text-sm">{currentClub.name}</p>
                    <p className="text-xs text-[#8b949e] flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold">
                        {playerPos}{playerPos === 1 ? 'st' : playerPos === 2 ? 'nd' : playerPos === 3 ? 'rd' : 'th'}
                      </span>
                      in the league
                      <span style={{ color: indicator.color }}>• {indicator.label || 'Mid-table'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-400">{playerEntry.points}</p>
                  <p className="text-[10px] text-[#8b949e]">points</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-5 gap-2 text-center">
                <div>
                  <p className="text-sm font-bold text-[#c9d1d9]">{playerEntry.played}</p>
                  <p className="text-[10px] text-[#8b949e]">Played</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-400">{playerEntry.won}</p>
                  <p className="text-[10px] text-[#8b949e]">Won</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-400">{playerEntry.drawn}</p>
                  <p className="text-[10px] text-[#8b949e]">Drawn</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-400">{playerEntry.lost}</p>
                  <p className="text-[10px] text-[#8b949e]">Lost</p>
                </div>
                <div>
                  <p className={`text-sm font-bold ${gd > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {gd > 0 ? '+' : ''}{gd}
                  </p>
                  <p className="text-[10px] text-[#8b949e]">GD</p>
                </div>
              </div>

              {/* Form and Zone Info */}
              <div className="mt-3 pt-3 border-t border-[#30363d] space-y-2">
                {/* Current Form */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8b949e]  font-medium">Recent Form</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {playerForm.length > 0 ? playerForm.map((r, i) => (
                        <FormDot key={i} result={r} />
                      )) : (
                        <span className="text-[10px] text-[#484f58]">No matches yet</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold ${formInfo.color}`}>{formInfo.text}</span>
                  </div>
                </div>

                {/* Zone distance */}
                {playerPos > 4 && pointsToUCL > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e]  font-medium flex items-center gap-1">
                      <Trophy className="w-2.5 h-2.5 text-emerald-400" />
                      To UCL
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">{pointsToUCL} pts needed</span>
                  </div>
                )}

                {playerPos >= leagueTable.length - 2 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e]  font-medium flex items-center gap-1">
                      <ArrowDown className="w-2.5 h-2.5 text-red-400" />
                      From Safety
                    </span>
                    <span className="text-[10px] text-red-400 font-bold">{pointsFromRel} pts clear</span>
                  </div>
                )}

                {/* Win rate and goals per game */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e]">Win Rate</span>
                    <span className="text-[10px] text-[#c9d1d9] font-semibold">
                      {playerEntry.played > 0 ? Math.round((playerEntry.won / playerEntry.played) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e]">Goals/Game</span>
                    <span className="text-[10px] text-[#c9d1d9] font-semibold">
                      {playerEntry.played > 0 ? (playerEntry.goalsFor / playerEntry.played).toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Top Scorer & Form Leaders */}
      <div className="grid grid-cols-2 gap-3">
        {/* Best Attack */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <p className="text-[9px] text-[#8b949e]  font-semibold mb-2 flex items-center gap-1">
              <Swords className="w-3 h-3 text-emerald-400" />
              Best Attack
            </p>
            {(() => {
              const best = [...leagueTable].sort((a, b) => b.goalsFor - a.goalsFor)[0];
              const bestClub = getClubById(best.clubId);
              return (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{bestClub?.logo}</span>
                  <div>
                    <p className="text-xs font-semibold text-[#c9d1d9]">{bestClub?.shortName}</p>
                    <p className="text-lg font-black text-emerald-400">{best.goalsFor}</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Best Defence */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <p className="text-[9px] text-[#8b949e]  font-semibold mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-400" />
              Best Defence
            </p>
            {(() => {
              const best = [...leagueTable].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
              const bestClub = getClubById(best.clubId);
              return (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{bestClub?.logo}</span>
                  <div>
                    <p className="text-xs font-semibold text-[#c9d1d9]">{bestClub?.shortName}</p>
                    <p className="text-lg font-black text-blue-400">{best.goalsAgainst}</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
