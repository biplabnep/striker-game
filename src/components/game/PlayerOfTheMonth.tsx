'use client';

import { useMemo, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Trophy, Star, Medal, TrendingUp, Calendar, Users, Crown,
  Target, Flame, ChevronRight, CheckCircle2, BarChart3,
  Clock, Award,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface MockPlayer {
  name: string;
  position: string;
  club: string;
  clubShortName: string;
  league: string;
  overall: number;
  goals: number;
  assists: number;
  avgRating: number;
  appearances: number;
  cleanSheets: number;
  keyStat: string;
}

interface MonthWinner {
  month: number;
  monthName: string;
  winner: MockPlayer | null;
  isPlayerWinner: boolean;
}

// ============================================================
// Constants
// ============================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const FIRST_NAMES = [
  'Marcus', 'Lucas', 'Kylian', 'Erling', 'Jude', 'Pedri', 'Gavi',
  'Jamal', 'Phil', 'Bukayo', 'Martin', 'Rodri', 'Declan', 'Bruno',
  'Mohamed', 'Vinicius', 'Federico', 'Lautaro', 'Khvicha', 'Florian',
  'Leroy', 'Serge', 'Dayot', 'William', 'Rafael', 'Ollie', 'Cole',
  'Alejandro', 'Julian', 'Dani', 'Mikel', 'Kevin', 'Bernardo',
  'Romelu', 'Alexander', 'Virgil', 'Ruben', 'Ibrahima', 'Theo',
];

const LAST_NAMES = [
  'Rashford', 'Havertz', 'Mbappe', 'Haaland', 'Bellingham', 'Gonzalez',
  'Lopez', 'Musiala', 'Foden', 'Saka', 'Odegaard', 'Hernandez',
  'Rice', 'Fernandes', 'Salah', 'Junior', 'Chiesa', 'Martinez',
  'Kvaratskhelia', 'Wirtz', 'Sane', 'Gnabry', 'Upamecano', 'Saliba',
  'Leao', 'Watkins', 'Palmer', 'Grimaldo', 'Alvarez', 'Olmo',
  'Merino', 'De Bruyne', 'Silva', 'Lukaku', 'Isak', 'Van Dijk',
  'Dias', 'Konate', 'Hernandez',
];

const POSITION_POOL = ['ST', 'CAM', 'CM', 'CDM', 'LW', 'RW', 'CB', 'GK', 'LB', 'RB'];

// ============================================================
// Helpers
// ============================================================

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getMonthFromWeek(week: number): number {
  if (week <= 4) return 7;
  if (week <= 8) return 8;
  if (week <= 12) return 9;
  if (week <= 16) return 10;
  if (week <= 20) return 11;
  if (week <= 24) return 12;
  if (week <= 28) return 1;
  if (week <= 32) return 2;
  if (week <= 36) return 3;
  if (week <= 38) return 4;
  return 5;
}

function getWeeksPerMonth(month: number): number {
  return 4;
}

function getRatingColor(rating: number): string {
  if (rating >= 7.5) return 'text-emerald-400';
  if (rating >= 6.0) return 'text-amber-400';
  return 'text-red-400';
}

function getRatingBg(rating: number): string {
  if (rating >= 7.5) return 'bg-emerald-500';
  if (rating >= 6.0) return 'bg-amber-500';
  return 'bg-red-500';
}

function getOvrColor(ovr: number): string {
  if (ovr >= 85) return 'text-emerald-400';
  if (ovr >= 75) return 'text-amber-400';
  if (ovr >= 65) return 'text-orange-400';
  return 'text-red-400';
}

function getOvrBg(ovr: number): string {
  if (ovr >= 85) return 'bg-emerald-500/20 border-emerald-500/40';
  if (ovr >= 75) return 'bg-amber-500/20 border-amber-500/40';
  if (ovr >= 65) return 'bg-orange-500/20 border-orange-500/40';
  return 'bg-red-500/20 border-red-500/40';
}

function getBadgeStyle(rank: number): { bg: string; border: string; text: string; label: string } {
  switch (rank) {
    case 1: return { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-400', label: '1st' };
    case 2: return { bg: 'bg-gray-400/15', border: 'border-gray-400/40', text: 'text-gray-300', label: '2nd' };
    case 3: return { bg: 'bg-amber-700/15', border: 'border-amber-700/40', text: 'text-amber-600', label: '3rd' };
    default: return { bg: 'bg-[#21262d]', border: 'border-[#30363d]', text: 'text-[#8b949e]', label: `${rank}th` };
  }
}

// ============================================================
// Mock Data Generation
// ============================================================

function generateLeaguePlayers(
  playerClubId: string,
  league: string,
  clubs: { id: string; name: string; shortName: string; quality: number }[],
  currentWeek: number,
  season: number,
  playerName: string,
  playerPos: string,
  playerStats: { goals: number; assists: number; averageRating: number; appearances: number; cleanSheets: number },
  playerOvr: number,
): MockPlayer[] {
  const rng = seededRandom(simpleHash(`${league}-${season}-${currentWeek}`));
  const players: MockPlayer[] = [];

  // Add the actual player first
  const playerKeyStat = playerStats.goals >= 5
    ? `${playerStats.goals} Goals`
    : playerStats.assists >= 3
      ? `${playerStats.assists} Assists`
      : `${playerStats.averageRating.toFixed(1)} Avg Rating`;

  players.push({
    name: playerName,
    position: playerPos,
    club: clubs.find(c => c.id === playerClubId)?.name ?? 'Unknown',
    clubShortName: clubs.find(c => c.id === playerClubId)?.shortName ?? 'UNK',
    league,
    overall: playerOvr,
    goals: playerStats.goals,
    assists: playerStats.assists,
    avgRating: playerStats.averageRating > 0 ? playerStats.averageRating : 6.0 + rng() * 1.5,
    appearances: playerStats.appearances,
    cleanSheets: playerStats.cleanSheets,
    keyStat: playerKeyStat,
  });

  // Generate NPC players from other clubs in the league
  const otherClubs = clubs.filter(c => c.id !== playerClubId);
  for (const club of otherClubs) {
    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const pos = POSITION_POOL[Math.floor(rng() * POSITION_POOL.length)];
    const qualityBonus = Math.floor(club.quality / 10);
    const baseOvr = 65 + qualityBonus + Math.floor(rng() * 10);
    const weekFactor = Math.min(currentWeek / 38, 1);

    const isGoalkeeper = pos === 'GK';
    const goals = isGoalkeeper ? 0 : Math.floor(rng() * 12 * weekFactor);
    const assists = Math.floor(rng() * 8 * weekFactor);
    const rating = (5.5 + rng() * 3.0) * (0.7 + 0.3 * weekFactor);
    const apps = Math.floor(rng() * Math.min(currentWeek, 20));
    const cs = isGoalkeeper ? Math.floor(rng() * 8 * weekFactor) : 0;

    const keyStat = goals >= 5
      ? `${goals} Goals`
      : assists >= 3
        ? `${assists} Assists`
        : isGoalkeeper && cs >= 3
          ? `${cs} Clean Sheets`
          : `${rating.toFixed(1)} Avg Rating`;

    players.push({
      name: `${firstName} ${lastName}`,
      position: pos,
      club: club.name,
      clubShortName: club.shortName,
      league,
      overall: Math.min(baseOvr, 94),
      goals,
      assists,
      avgRating: Math.round(rating * 10) / 10,
      appearances: apps,
      cleanSheets: cs,
      keyStat,
    });
  }

  return players;
}

// ============================================================
// Main Component
// ============================================================

export default function PlayerOfTheMonth() {
  const gameState = useGameStore(s => s.gameState);
  const [voteResult, setVoteResult] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  // All useMemo hooks before any early return
  const currentMonth = useMemo(() => {
    if (!gameState) return MONTH_NAMES[new Date().getMonth()];
    return MONTH_NAMES[getMonthFromWeek(gameState.currentWeek) - 1];
  }, [gameState]);

  const currentYear = useMemo(() => {
    if (!gameState) return new Date().getFullYear();
    const month = getMonthFromWeek(gameState.currentWeek);
    return month >= 7 ? gameState.year : gameState.year + 1;
  }, [gameState]);

  const leagueClubs = useMemo(() => {
    if (!gameState) return [];
    return gameState.availableClubs
      .filter(c => c.league === gameState.currentClub.league)
      .map(c => ({ id: c.id, name: c.name, shortName: c.shortName, quality: c.quality }));
  }, [gameState]);

  const allPlayers = useMemo(() => {
    if (!gameState) return [];
    const { player, currentClub, currentWeek, currentSeason } = gameState;
    const stats = player.seasonStats;
    return generateLeaguePlayers(
      currentClub.id,
      currentClub.league,
      leagueClubs,
      currentWeek,
      currentSeason,
      player.name,
      player.position,
      stats,
      player.overall,
    );
  }, [gameState, leagueClubs]);

  const nominees = useMemo(() => {
    return [...allPlayers]
      .sort((a, b) => b.avgRating - a.avgRating || b.goals - a.goals)
      .slice(0, 3);
  }, [allPlayers]);

  const currentWinner = useMemo(() => nominees[0] ?? null, [nominees]);

  const daysRemaining = useMemo(() => {
    if (!gameState) return 15;
    const month = getMonthFromWeek(gameState.currentWeek);
    const weeksInMonth = getWeeksPerMonth(month);
    const weekInMonth = ((gameState.currentWeek - 1) % 4) + 1;
    return Math.max(0, (weeksInMonth - weekInMonth) * 7);
  }, [gameState]);

  const monthProgress = useMemo(() => {
    if (!gameState) return 50;
    const weekInMonth = ((gameState.currentWeek - 1) % 4) + 1;
    return Math.min(100, (weekInMonth / 4) * 100);
  }, [gameState]);

  const seasonHistory = useMemo((): MonthWinner[] => {
    if (!gameState) return [];
    const currentWeek = gameState.currentWeek;
    const { player, currentClub, currentSeason } = gameState;
    const stats = player.seasonStats;

    const months: MonthWinner[] = [];
    // A season runs Aug-May (months 7,8,9,10,11,12,1,2,3,4)
    const seasonMonths = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4];

    for (const month of seasonMonths) {
      // Determine which weeks belong to this month
      const monthIndex = seasonMonths.indexOf(month);
      const startWeek = monthIndex * 4 + 1;
      const endWeek = startWeek + 3;

      const isFuture = startWeek > currentWeek;
      const hasEnoughData = currentWeek >= endWeek;

      if (isFuture) {
        months.push({
          month,
          monthName: MONTH_NAMES[month - 1],
          winner: null,
          isPlayerWinner: false,
        });
        continue;
      }

      if (!hasEnoughData) {
        // Current month or partial data
        months.push({
          month,
          monthName: MONTH_NAMES[month - 1],
          winner: null,
          isPlayerWinner: false,
        });
        continue;
      }

      // Generate a winner for completed months using deterministic seed
      const seed = simpleHash(`${currentSeason}-${month}-${currentClub.league}`);
      const rng = seededRandom(seed);
      const eligiblePlayers = allPlayers.filter(p => p.appearances > 0);
      if (eligiblePlayers.length > 0) {
        const sorted = [...eligiblePlayers].sort((a, b) => b.avgRating - a.avgRating);
        const top = sorted[Math.floor(rng() * Math.min(3, sorted.length))];
        months.push({
          month,
          monthName: MONTH_NAMES[month - 1],
          winner: top,
          isPlayerWinner: top.name === player.name,
        });
      } else {
        months.push({
          month,
          monthName: MONTH_NAMES[month - 1],
          winner: null,
          isPlayerWinner: false,
        });
      }
    }

    return months;
  }, [gameState, allPlayers]);

  const leaderboard = useMemo(() => {
    return [...allPlayers]
      .filter(p => p.appearances > 0)
      .sort((a, b) => b.avgRating - a.avgRating || b.goals - a.goals)
      .slice(0, 10);
  }, [allPlayers]);

  const isPlayerInNominees = useMemo(() => {
    if (!gameState) return false;
    return nominees.some(n => n.name === gameState.player.name);
  }, [nominees, gameState]);

  const handleVote = useCallback(() => {
    setVoting(true);
    setTimeout(() => {
      const results = ['Winner!', 'Runner-up!', '3rd Place!', 'Not this time...'];
      const weights = [0.15, 0.25, 0.3, 0.3];
      const roll = Math.random();
      let cumulative = 0;
      let result = results[3];
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (roll < cumulative) {
          result = results[i];
          break;
        }
      }
      setVoteResult(result);
      setVoting(false);
    }, 800);
  }, []);

  if (!gameState) return null;

  const { player, currentClub } = gameState;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-20 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#21262d] flex items-center justify-center">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#c9d1d9]">Player of the Month</h1>
            <p className="text-xs text-[#8b949e]">
              {currentClub.name} &bull; {currentMonth} {currentYear}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
            <Calendar className="h-3.5 w-3.5" />
            <span>Wk {gameState.currentWeek}</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="w-full bg-[#161b22] border border-[#30363d] h-10">
          <TabsTrigger
            value="current"
            className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400 text-[#8b949e]"
          >
            <Trophy className="h-3.5 w-3.5 mr-1" />
            Current
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400 text-[#8b949e]"
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="leaderboard"
            className="flex-1 text-xs data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400 text-[#8b949e]"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            Rankings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Current Winner */}
        <TabsContent value="current" className="space-y-4 mt-4">
          {/* Month Progress */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.05 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Voting Period
              </span>
              <span className="text-xs text-[#c9d1d9] font-medium">
                {daysRemaining} days remaining
              </span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
              <motion.div
                className="h-full bg-amber-500 rounded-md"
                initial={{ width: 0 }}
                animate={{ width: `${monthProgress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-[10px] text-[#8b949e] mt-1.5">
              {currentMonth} {currentYear} &mdash; Nominations close at month end
            </p>
          </motion.div>

          {/* Winner Card */}
          {currentWinner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.1 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
            >
              <div className="flex items-center gap-1.5 mb-3">
                <Crown className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-[#c9d1d9]">Current Leader</h2>
              </div>

              <div className="flex items-start gap-3">
                {/* OVR Badge */}
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center ${getOvrBg(currentWinner.overall)}`}>
                  <span className={`text-lg font-bold ${getOvrColor(currentWinner.overall)}`}>
                    {currentWinner.overall}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#c9d1d9] truncate">
                      {currentWinner.name}
                    </span>
                    {currentWinner.name === player.name && (
                      <span className="flex-shrink-0 text-[9px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded px-1.5 py-0.5">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#8b949e]">{currentWinner.position}</span>
                    <span className="text-[#30363d]">&bull;</span>
                    <span className="text-xs text-[#8b949e] truncate">{currentWinner.club}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className={`text-lg font-bold ${getRatingColor(currentWinner.avgRating)}`}>
                    {currentWinner.avgRating.toFixed(1)}
                  </span>
                  <p className="text-[10px] text-[#8b949e]">Avg Rating</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-[#30363d]">
                {[
                  { label: 'Goals', value: currentWinner.goals, icon: <Target className="h-3 w-3" /> },
                  { label: 'Assists', value: currentWinner.assists, icon: <TrendingUp className="h-3 w-3" /> },
                  { label: 'Rating', value: currentWinner.avgRating.toFixed(1), icon: <Star className="h-3 w-3" /> },
                  { label: 'Apps', value: currentWinner.appearances, icon: <Users className="h-3 w-3" /> },
                  { label: 'CS', value: currentWinner.cleanSheets, icon: <Medal className="h-3 w-3" /> },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="text-[#8b949e] mb-1">{stat.icon}</div>
                    <div className="text-sm font-bold text-[#c9d1d9]">{stat.value}</div>
                    <div className="text-[10px] text-[#484f58]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Nominees */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.15 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
              <Medal className="h-4 w-4 text-[#8b949e]" />
              Top 3 Nominees
            </h3>
            <div className="space-y-2">
              {nominees.map((nominee, index) => {
                const badge = getBadgeStyle(index + 1);
                return (
                  <div
                    key={`${nominee.name}-${index}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${badge.bg} ${badge.border}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${badge.text}`}>
                      {badge.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#c9d1d9] truncate">
                          {nominee.name}
                        </span>
                        {nominee.name === player.name && (
                          <span className="text-[9px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded px-1 py-0.5">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#8b949e]">
                        {nominee.position} &bull; {nominee.clubShortName}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-sm font-bold ${getRatingColor(nominee.avgRating)}`}>
                        {nominee.avgRating.toFixed(1)}
                      </span>
                      <p className="text-[10px] text-[#484f58]">{nominee.keyStat}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Vote Simulation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.2 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  Cast Your Vote
                </h3>
                <p className="text-[10px] text-[#8b949e] mt-0.5">
                  {isPlayerInNominees
                    ? 'You are among the nominees this month!'
                    : 'Cast a simulated fan vote for fun'}
                </p>
              </div>
              {isPlayerInNominees && (
                <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded px-2 py-0.5">
                  Nominated
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!voteResult ? (
                <motion.button
                  key="vote-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  onClick={handleVote}
                  disabled={voting}
                  className="w-full py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {voting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      Counting votes...
                    </span>
                  ) : (
                    'Simulate Vote'
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="vote-result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#21262d] border border-[#30363d]"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-[#c9d1d9] font-medium">{voteResult}</span>
                  </div>
                  <button
                    onClick={() => setVoteResult(null)}
                    className="text-[10px] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                  >
                    Vote Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </TabsContent>

        {/* Tab 2: Season History */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#8b949e]" />
                Season {gameState.currentSeason} Monthly Winners
              </h2>
              <span className="text-[10px] text-[#8b949e] bg-[#21262d] rounded px-2 py-0.5">
                {seasonHistory.filter(m => m.winner).length}/{seasonHistory.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {seasonHistory.map((entry, i) => (
                <motion.div
                  key={`${entry.month}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1, delay: i * 0.03 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    entry.winner
                      ? 'bg-[#21262d] border-[#30363d]'
                      : 'bg-[#0d1117] border-[#21262d]'
                  }`}
                >
                  <div className="w-10 text-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#c9d1d9]">
                      {entry.monthName.slice(0, 3)}
                    </span>
                  </div>

                  {entry.winner ? (
                    <>
                      <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                        <Trophy className="h-3 w-3 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#c9d1d9] truncate">
                            {entry.winner.name}
                          </span>
                          {entry.isPlayerWinner && (
                            <span className="text-[9px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded px-1 py-0.5">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8b949e]">
                          {entry.winner.clubShortName} &bull; OVR {entry.winner.overall}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-bold ${getRatingColor(entry.winner.avgRating)}`}>
                          {entry.winner.avgRating.toFixed(1)}
                        </span>
                        <p className="text-[10px] text-[#484f58]">{entry.winner.keyStat}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-[#484f58]">&mdash;</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-[#484f58]">
                          No winner yet
                        </span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[#30363d] flex-shrink-0" />
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.1 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              Your PotM Record
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-[#21262d]">
                <div className="text-lg font-bold text-emerald-400">
                  {seasonHistory.filter(m => m.isPlayerWinner).length}
                </div>
                <div className="text-[10px] text-[#8b949e]">Wins</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#21262d]">
                <div className="text-lg font-bold text-amber-400">
                  {nominees.length > 0 && nominees[0]?.name === player.name ? 1 : 0}
                </div>
                <div className="text-[10px] text-[#8b949e]">Nominated</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-[#21262d]">
                <div className="text-lg font-bold text-[#c9d1d9]">
                  {seasonHistory.filter(m => m.winner).length}
                </div>
                <div className="text-[10px] text-[#8b949e]">Awarded</div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Tab 3: Leaderboard */}
        <TabsContent value="leaderboard" className="space-y-4 mt-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#8b949e]" />
                Season Ratings Leaderboard
              </h2>
              <span className="text-[10px] text-[#8b949e] bg-[#21262d] rounded px-2 py-0.5">
                Top 10
              </span>
            </div>

            {leaderboard.length > 0 ? (
              <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-1 px-3 py-2 text-[10px] text-[#484f58] font-medium">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2 text-right">Rating</div>
                  <div className="col-span-1 text-right">G</div>
                  <div className="col-span-1 text-right">A</div>
                  <div className="col-span-2 text-right">Apps</div>
                  <div className="col-span-1 text-right">OVR</div>
                </div>

                {leaderboard.map((entry, i) => {
                  const badge = getBadgeStyle(i + 1);
                  const isPlayer = entry.name === player.name;
                  return (
                    <motion.div
                      key={`${entry.name}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1, delay: i * 0.02 }}
                      className={`grid grid-cols-12 gap-1 px-3 py-2.5 rounded-lg items-center transition-colors ${
                        isPlayer
                          ? 'bg-emerald-500/5 border border-emerald-500/20'
                          : i % 2 === 0
                            ? 'bg-[#0d1117]'
                            : 'bg-transparent'
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1">
                        {i < 3 ? (
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </div>
                        ) : (
                          <span className="text-xs text-[#484f58] pl-1">{i + 1}</span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="col-span-4 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium text-[#c9d1d9] truncate">
                            {entry.name}
                          </span>
                          {isPlayer && (
                            <span className="text-[8px] font-medium bg-emerald-500/15 text-emerald-400 rounded px-1 py-px flex-shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-[#484f58] truncate block">
                          {entry.clubShortName} &bull; {entry.position}
                        </span>
                      </div>

                      {/* Rating */}
                      <div className="col-span-2 text-right">
                        <span className={`text-xs font-bold ${getRatingColor(entry.avgRating)}`}>
                          {entry.avgRating.toFixed(1)}
                        </span>
                      </div>

                      {/* Goals */}
                      <div className="col-span-1 text-right">
                        <span className="text-xs text-[#8b949e]">{entry.goals}</span>
                      </div>

                      {/* Assists */}
                      <div className="col-span-1 text-right">
                        <span className="text-xs text-[#8b949e]">{entry.assists}</span>
                      </div>

                      {/* Appearances */}
                      <div className="col-span-2 text-right">
                        <span className="text-xs text-[#8b949e]">{entry.appearances}</span>
                      </div>

                      {/* OVR */}
                      <div className="col-span-1 text-right">
                        <span className={`text-[10px] font-medium ${getOvrColor(entry.overall)}`}>
                          {entry.overall}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Users className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                <p className="text-xs text-[#484f58]">No rating data available yet</p>
                <p className="text-[10px] text-[#30363d] mt-1">
                  Play matches to populate the leaderboard
                </p>
              </div>
            )}
          </motion.div>

          {/* Rating Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.1 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
          >
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-emerald-500" />
                <span className="text-[10px] text-[#8b949e]">&ge;7.5 Excellent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-amber-500" />
                <span className="text-[10px] text-[#8b949e]">&ge;6.0 Good</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-red-500" />
                <span className="text-[10px] text-[#8b949e]">&lt;6.0 Poor</span>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
