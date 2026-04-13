'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getClubById, CUP_NAMES, CUP_MATCH_WEEKS } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, XCircle, Crown, Swords, ChevronRight, Calendar, Users,
  CheckCircle2, Target, BarChart3, TrendingUp, MapPin, MinusCircle,
  Eye, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Fixture, MatchResult } from '@/lib/game/types';

// Round name helper
function getRoundName(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  return `Round ${round}`;
}

// Match result type for timeline
interface CupRunMatch {
  round: number;
  roundName: string;
  opponent: string;
  opponentLogo: string;
  playerScore: number;
  opponentScore: number;
  result: 'W' | 'D' | 'L';
  isHome: boolean;
  playerGoals: number;
  playerAssists: number;
}

export default function CupBracket() {
  const gameState = useGameStore(state => state.gameState);

  // ─── Core cup info (existing, enhanced) ─────────────────────────────
  const cupInfo = useMemo(() => {
    if (!gameState) return null;

    const { cupFixtures, cupRound, cupEliminated, currentClub, currentWeek } = gameState;
    const cupData = CUP_NAMES[currentClub.league];
    if (!cupData) return null;

    // Calculate total rounds from fixtures
    const maxRound = cupFixtures.length > 0
      ? Math.max(...cupFixtures.map(f => f.matchday))
      : 1;

    // Group fixtures by round
    const rounds: { round: number; name: string; fixtures: Fixture[]; week: number }[] = [];
    for (let r = 1; r <= maxRound; r++) {
      const roundFixtures = cupFixtures.filter(f => f.matchday === r);
      const cupWeekIdx = r - 1;
      const week = cupWeekIdx < CUP_MATCH_WEEKS.length ? CUP_MATCH_WEEKS[cupWeekIdx] : r * 4;
      rounds.push({
        round: r,
        name: getRoundName(r, maxRound),
        fixtures: roundFixtures,
        week,
      });
    }

    // Find player's next cup match
    const playerNextCupMatch = cupFixtures.find(
      f => f.matchday === cupRound && !f.played &&
           (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id)
    );

    const nextCupOpponent = playerNextCupMatch
      ? getClubById(playerNextCupMatch.homeClubId === currentClub.id
          ? playerNextCupMatch.awayClubId
          : playerNextCupMatch.homeClubId)
      : null;

    // Check if player won the cup
    const isCupWinner = !cupEliminated && cupRound > maxRound;

    // Check if this is a cup week
    const isCupWeek = CUP_MATCH_WEEKS.includes(currentWeek);

    // Count remaining teams in current round
    const currentRoundFixtures = cupFixtures.filter(f => f.matchday === cupRound);
    const currentRoundPlayed = currentRoundFixtures.filter(f => f.played);

    return {
      cupName: cupData.name,
      cupEmoji: cupData.emoji,
      cupRound,
      maxRound,
      cupEliminated,
      isCupWinner,
      rounds,
      playerNextCupMatch,
      nextCupOpponent,
      isCupWeek,
      currentWeek,
      remainingTeams: currentRoundFixtures.length > 0 ? currentRoundFixtures.length * 2 : 0,
      currentRoundPlayed: currentRoundPlayed.length,
      currentRoundTotal: currentRoundFixtures.length,
      eliminatedRound: cupEliminated ? cupRound - 1 : null,
    };
  }, [gameState]);

  // ─── Cup run timeline — player's cup journey matches ────────────────
  const cupRunTimeline = useMemo((): CupRunMatch[] => {
    if (!gameState) return [];

    const playerClubId = gameState.currentClub.id;
    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');

    return cupResults.map(result => {
      const isHome = result.homeClub.id === playerClubId;
      const opponent = isHome ? result.awayClub : result.homeClub;
      const playerScore = isHome ? result.homeScore : result.awayScore;
      const opponentScore = isHome ? result.awayScore : result.homeScore;

      let resultType: 'W' | 'D' | 'L';
      if (playerScore > opponentScore) resultType = 'W';
      else if (playerScore < opponentScore) resultType = 'L';
      else resultType = 'D';

      // Determine round from week
      const roundIdx = CUP_MATCH_WEEKS.findIndex(w => w === result.week);
      const round = roundIdx >= 0 ? roundIdx + 1 : 1;
      const maxRound = gameState.cupFixtures.length > 0
        ? Math.max(...gameState.cupFixtures.map(f => f.matchday))
        : 1;

      return {
        round,
        roundName: getRoundName(round, maxRound),
        opponent: opponent.shortName,
        opponentLogo: opponent.logo,
        playerScore,
        opponentScore,
        result: resultType,
        isHome,
        playerGoals: result.playerGoals,
        playerAssists: result.playerAssists,
      };
    });
  }, [gameState]);

  // ─── Cup match score lookup (for non-player fixture scores) ─────────
  const cupMatchScoreLookup = useMemo(() => {
    if (!gameState) return new Map<string, { homeScore: number; awayScore: number }>();

    const lookup = new Map<string, { homeScore: number; awayScore: number }>();
    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');

    for (const result of cupResults) {
      const key = `${result.homeClub.id}-${result.awayClub.id}`;
      lookup.set(key, {
        homeScore: result.homeScore,
        awayScore: result.awayScore,
      });
    }
    return lookup;
  }, [gameState]);

  // ─── Opponent scout data ─────────────────────────────────────────────
  const opponentScout = useMemo(() => {
    if (!cupInfo?.nextCupOpponent || !gameState) return null;

    const opponent = cupInfo.nextCupOpponent;
    const standing = gameState.leagueTable.find(s => s.clubId === opponent.id);

    // Get opponent's season form from league standing
    const formDots: ('W' | 'D' | 'L')[] = [];
    if (standing) {
      // Derive approximate recent form from W/D/L record
      const total = standing.won + standing.drawn + standing.lost;
      const wRatio = total > 0 ? standing.won / total : 0;
      const dRatio = total > 0 ? standing.drawn / total : 0;
      // Generate a plausible form sequence
      for (let i = 0; i < 5; i++) {
        const r = Math.random();
        if (r < wRatio) formDots.push('W');
        else if (r < wRatio + dRatio) formDots.push('D');
        else formDots.push('L');
      }
    }

    const avgGoalsScored = standing && standing.played > 0
      ? (standing.goalsFor / standing.played).toFixed(1)
      : '-';
    const avgGoalsConceded = standing && standing.played > 0
      ? (standing.goalsAgainst / standing.played).toFixed(1)
      : '-';

    return {
      club: opponent,
      position: standing ? standing.played > 0 ? standing.played : null : null,
      leaguePosition: standing
        ? gameState.leagueTable.findIndex(s => s.clubId === opponent.id) + 1
        : null,
      totalTeams: gameState.leagueTable.length,
      formDots,
      avgGoalsScored,
      avgGoalsConceded,
    };
  }, [cupInfo?.nextCupOpponent, gameState]);

  // ─── Cup statistics ──────────────────────────────────────────────────
  const cupStatistics = useMemo(() => {
    if (!gameState) return null;

    const cupResults = gameState.recentResults.filter(r => r.competition === 'cup');
    const cupGoals = cupResults.reduce((sum, r) => sum + r.playerGoals, 0);
    const cupAppearances = cupResults.length;
    const wins = cupResults.filter(r => {
      const isHome = r.homeClub.id === gameState.currentClub.id;
      const playerScore = isHome ? r.homeScore : r.awayScore;
      const opponentScore = isHome ? r.awayScore : r.homeScore;
      return playerScore > opponentScore;
    }).length;
    const winRate = cupAppearances > 0 ? Math.round((wins / cupAppearances) * 100) : 0;

    // Best run: find the furthest round the player reached in any season
    const playerClubId = gameState.currentClub.id;
    const playerCupFixtures = gameState.cupFixtures.filter(
      f => f.homeClubId === playerClubId || f.awayClubId === playerClubId
    );
    const maxRound = gameState.cupFixtures.length > 0
      ? Math.max(...gameState.cupFixtures.map(f => f.matchday))
      : 1;

    let bestRunRound = 0;
    for (const fixture of playerCupFixtures) {
      if (fixture.matchday > bestRunRound) bestRunRound = fixture.matchday;
    }

    // Check if player was in the last fixture they played
    const lastPlayedPlayerFixture = [...playerCupFixtures]
      .filter(f => f.played)
      .sort((a, b) => b.matchday - a.matchday)[0];

    const bestRun = lastPlayedPlayerFixture
      ? getRoundName(lastPlayedPlayerFixture.matchday, maxRound)
      : 'None yet';

    const losses = cupResults.filter(r => {
      const isHome = r.homeClub.id === gameState.currentClub.id;
      const playerScore = isHome ? r.homeScore : r.awayScore;
      const opponentScore = isHome ? r.awayScore : r.homeScore;
      return playerScore < opponentScore;
    }).length;
    const draws = cupAppearances - wins - losses;

    return {
      cupGoals,
      cupAppearances,
      wins,
      draws,
      losses,
      winRate,
      bestRun,
      cupAssists: cupResults.reduce((sum, r) => sum + r.playerAssists, 0),
    };
  }, [gameState]);

  // ─── Early return ────────────────────────────────────────────────────
  if (!cupInfo || !gameState) return null;

  const { cupName, cupEmoji, cupRound, maxRound, cupEliminated, isCupWinner, rounds,
          playerNextCupMatch, nextCupOpponent, isCupWeek, currentWeek } = cupInfo;

  // Find the round where player was eliminated
  const eliminatedRoundNum = cupEliminated
    ? gameState.cupFixtures.filter(f =>
        f.played &&
        (f.homeClubId === gameState.currentClub.id || f.awayClubId === gameState.currentClub.id)
      ).length
    : 0;

  // ─── Render helpers ──────────────────────────────────────────────────
  const getResultColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'text-emerald-400';
      case 'D': return 'text-amber-400';
      case 'L': return 'text-red-400';
    }
  };

  const getResultBg = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'D': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'L': return 'bg-red-500/15 text-red-400 border-red-500/30';
    }
  };

  const getFormDotColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-emerald-400';
      case 'D': return 'bg-amber-400';
      case 'L': return 'bg-red-400';
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="bg-[#161b22] border-amber-900/30 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundColor: '#d97706'
          }} />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-900/30 border border-amber-700/30 flex items-center justify-center text-2xl">
                  {cupEmoji}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-amber-100">{cupName}</h2>
                  <p className="text-xs text-[#8b949e]">Domestic Cup Competition</p>
                </div>
              </div>

              {/* Status Badge */}
              {isCupWinner ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <Badge className="bg-amber-500 text-black font-bold px-3 py-1 text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    WINNER!
                  </Badge>
                </motion.div>
              ) : cupEliminated ? (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-semibold px-3 py-1 text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  OUT
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold px-3 py-1 text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  ACTIVE
                </Badge>
              )}
            </div>

            {/* Round Progress Indicator */}
            {!isCupWinner && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                  <span>Progress</span>
                  <span className="font-medium">
                    {cupEliminated
                      ? `Eliminated in ${getRoundName(eliminatedRoundNum, maxRound)}`
                      : `Round ${Math.min(cupRound, maxRound)} of ${maxRound}`
                    }
                  </span>
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: maxRound }, (_, i) => {
                    const roundNum = i + 1;
                    const isCompleted = roundNum < cupRound;
                    const isCurrent = roundNum === cupRound && !cupEliminated;
                    const isReached = roundNum <= cupRound;

                    return (
                      <div key={roundNum} className="flex items-center gap-1.5 flex-1">
                        <div className="flex flex-col items-center gap-0.5 flex-1">
                          {/* Dot */}
                          <motion.div
                            className={`h-2.5 w-2.5 rounded-sm ${
                              isCompleted
                                ? 'bg-amber-400'
                                : isCurrent
                                ? 'bg-amber-400'
                                : 'bg-[#30363d]'
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{
                              opacity: isCompleted || isCurrent ? 1 : 0.4,
                            }}
                            transition={{ delay: i * 0.05 }}
                          />
                          {/* Current round pulse ring */}
                          {isCurrent && (
                            <motion.div
                              className="h-2.5 w-2.5 rounded-sm border border-amber-400/60 absolute"
                              animate={{ opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                          {/* Round label for key rounds */}
                          {(roundNum === 1 || roundNum === maxRound ||
                            roundNum === maxRound - 1 || roundNum === maxRound - 2 ||
                            isCurrent) && (
                            <span className={`text-[7px] leading-none mt-1 ${
                              isCurrent ? 'text-amber-300 font-semibold' : 'text-[#484f58]'
                            }`}>
                              {roundNum === 1 ? 'R1' :
                               roundNum === maxRound ? 'F' :
                               roundNum === maxRound - 1 ? 'SF' :
                               roundNum === maxRound - 2 ? 'QF' :
                               `R${roundNum}`}
                            </span>
                          )}
                        </div>
                        {/* Connector line */}
                        {roundNum < maxRound && (
                          <div className={`h-0.5 w-full rounded-sm ${
                            isCompleted ? 'bg-amber-400/60' : 'bg-[#30363d]/60'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Cup Winner Celebration ─────────────────────────────────── */}
      {isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
        >
          <Card className="bg-[#161b22] border-amber-500/40 overflow-hidden">
            <CardContent className="p-6 text-center">
              <motion.div
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-5xl mb-3"
              >
                🏆
              </motion.div>
              <h3 className="text-xl font-black text-amber-300 mb-1">Cup Winner!</h3>
              <p className="text-sm text-amber-200/70">
                You won the {cupName}! A historic achievement for {gameState.currentClub.name}!
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge className="bg-amber-500/30 text-amber-200 border-amber-500/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Trophy Added to Cabinet
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Eliminated Message ─────────────────────────────────────── */}
      {cupEliminated && !isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-red-950/20 border-red-900/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-300">
                    Eliminated in {getRoundName(eliminatedRoundNum, maxRound)}
                  </p>
                  <p className="text-xs text-red-400/70">
                    Your {cupName} run has ended this season
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Opponent Scout Card ────────────────────────────────────── */}
      {playerNextCupMatch && nextCupOpponent && !cupEliminated && !isCupWinner && opponentScout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-sky-400" />
                  Opponent Scout
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-amber-700/50 text-amber-400">
                  {getRoundName(cupRound, maxRound)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Opponent header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-xl">
                  {opponentScout.club.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#c9d1d9] truncate">
                    {opponentScout.club.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {opponentScout.leaguePosition && (
                      <span className="text-[10px] text-[#8b949e] flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {opponentScout.leaguePosition}{getOrdinalSuffix(opponentScout.leaguePosition)} in league
                      </span>
                    )}
                    <span className="text-[10px] text-[#484f58]">
                      Quality: {opponentScout.club.quality}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* League Position */}
                {opponentScout.leaguePosition && (
                  <div className="bg-[#21262d] rounded-md p-2.5">
                    <p className="text-[9px] text-[#484f58] uppercase tracking-wider">League Pos</p>
                    <p className="text-base font-bold text-[#c9d1d9] mt-0.5">
                      {opponentScout.leaguePosition}
                      <span className="text-[10px] text-[#484f58] font-normal">
                        /{opponentScout.totalTeams}
                      </span>
                    </p>
                  </div>
                )}

                {/* Avg Goals Scored */}
                <div className="bg-[#21262d] rounded-md p-2.5">
                  <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Avg Scored</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {opponentScout.avgGoalsScored}
                    <span className="text-[9px] text-[#484f58] font-normal">/game</span>
                  </p>
                </div>

                {/* Avg Goals Conceded */}
                <div className="bg-[#21262d] rounded-md p-2.5">
                  <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Avg Conceded</p>
                  <p className="text-base font-bold text-red-400 mt-0.5 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {opponentScout.avgGoalsConceded}
                    <span className="text-[9px] text-[#484f58] font-normal">/game</span>
                  </p>
                </div>

                {/* Form */}
                <div className="bg-[#21262d] rounded-md p-2.5">
                  <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Season Form</p>
                  <div className="flex items-center gap-1 mt-1">
                    {opponentScout.formDots.slice(0, 5).map((dot, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-sm ${getFormDotColor(dot)}`}
                        title={dot === 'W' ? 'Win' : dot === 'D' ? 'Draw' : 'Loss'}
                      />
                    ))}
                    <span className="text-[9px] text-[#484f58] ml-1">est.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Next Cup Match ─────────────────────────────────────────── */}
      {playerNextCupMatch && nextCupOpponent && !cupEliminated && !isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-[#161b22] border-amber-900/20 overflow-hidden">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e]">
                  Next Cup Match
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-amber-700/50 text-amber-400">
                  {getRoundName(cupRound, maxRound)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-2xl">
                    {playerNextCupMatch.homeClubId === gameState.currentClub.id
                      ? gameState.currentClub.logo
                      : nextCupOpponent.logo}
                  </div>
                  <span className="text-xs font-semibold text-[#c9d1d9] truncate max-w-[72px] text-center">
                    {playerNextCupMatch.homeClubId === gameState.currentClub.id
                      ? gameState.currentClub.shortName
                      : nextCupOpponent.shortName}
                  </span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center mx-2">
                  <motion.div
                    className="text-sm font-black text-amber-400/80"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    VS
                  </motion.div>
                  <div className="w-px h-4 bg-[#30363d] mt-1" />
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center text-2xl">
                    {playerNextCupMatch.awayClubId === gameState.currentClub.id
                      ? gameState.currentClub.logo
                      : nextCupOpponent.logo}
                  </div>
                  <span className="text-xs font-semibold text-[#c9d1d9] truncate max-w-[72px] text-center">
                    {playerNextCupMatch.awayClubId === gameState.currentClub.id
                      ? gameState.currentClub.shortName
                      : nextCupOpponent.shortName}
                  </span>
                </div>
              </div>

              {/* Week info */}
              <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-[#30363d]">
                <Calendar className="h-3 w-3 text-amber-500/60" />
                <span className="text-[10px] text-[#8b949e]">
                  Week {CUP_MATCH_WEEKS[cupRound - 1] ?? cupRound * 4} • {isCupWeek ? 'This week!' : 'Upcoming'}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Cup Run Timeline ───────────────────────────────────────── */}
      {cupRunTimeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <Flame className="h-3 w-3 text-amber-500" />
                Your Cup Run
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-[13px] top-2 bottom-2 w-px bg-[#30363d]" />

                <div className="space-y-0">
                  {cupRunTimeline.map((match, idx) => {
                    const isLast = idx === cupRunTimeline.length - 1;
                    const isWinner = match.result === 'W';

                    return (
                      <motion.div
                        key={`${match.round}-${match.opponent}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.18 + idx * 0.06 }}
                        className="relative flex items-start gap-3 py-2.5"
                      >
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 mt-0.5">
                          {isWinner ? (
                            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                          ) : match.result === 'D' ? (
                            <MinusCircle className="h-7 w-7 text-amber-400" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-400" />
                          )}
                        </div>

                        {/* Match card */}
                        <div className={`flex-1 rounded-lg border p-2.5 min-w-0 ${
                          isWinner
                            ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                            : match.result === 'D'
                            ? 'bg-amber-500/[0.06] border-amber-500/20'
                            : 'bg-red-500/[0.06] border-red-500/20'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[#8b949e] font-medium">
                              {match.roundName}
                            </span>
                            <Badge className={`text-[8px] px-1.5 py-0 h-4 border font-bold ${getResultBg(match.result)}`}>
                              {match.result}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm">{match.opponentLogo}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-[#c9d1d9] font-medium truncate">
                                {match.isHome ? 'vs' : '@'} {match.opponent}
                              </p>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${getResultColor(match.result)}`}>
                              {match.playerScore} - {match.opponentScore}
                            </span>
                          </div>

                          {/* Player contribution */}
                          {(match.playerGoals > 0 || match.playerAssists > 0) && (
                            <div className="flex items-center gap-2 mt-1.5">
                              {match.playerGoals > 0 && (
                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-sm font-medium">
                                  ⚽ {match.playerGoals}
                                </span>
                              )}
                              {match.playerAssists > 0 && (
                                <span className="text-[9px] bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded-sm font-medium">
                                  🎯 {match.playerAssists}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Progression indicator */}
                          {isWinner && !isLast && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500/60" />
                              <span className="text-[8px] text-emerald-500/60">Advanced</span>
                            </div>
                          )}
                          {!isWinner && !isLast && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <XCircle className="h-2.5 w-2.5 text-red-500/40" />
                              <span className="text-[8px] text-red-500/40">
                                {match.result === 'D' ? 'Eliminated (away goals / pens)' : 'Eliminated'}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Bracket Rounds (enhanced with scores) ──────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
              <Swords className="h-3.5 w-3.5 text-amber-500" />
              Tournament Bracket
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {rounds.map((roundData, idx) => {
                  const isCurrentRound = roundData.round === cupRound;
                  const isPastRound = roundData.round < cupRound;

                  // Check if player was in this round
                  const playerInRound = roundData.fixtures.find(
                    f => f.homeClubId === gameState.currentClub.id ||
                         f.awayClubId === gameState.currentClub.id
                  );

                  return (
                    <motion.div
                      key={roundData.round}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.06, duration: 0.2 }}
                      className={`rounded-lg border p-3 ${
                        isCurrentRound
                          ? 'bg-amber-500/10 border-amber-600/30'
                          : isPastRound
                          ? 'bg-[#21262d] border-[#30363d]'
                          : 'bg-[#21262d]/10 border-[#30363d]'
                      }`}
                    >
                      {/* Round header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-300">
                            {roundData.name}
                          </span>
                          {isCurrentRound && !cupEliminated && (
                            <motion.span
                              className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold"
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              CURRENT
                            </motion.span>
                          )}
                          {isPastRound && playerInRound && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-semibold">
                              PLAYED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#8b949e]">
                          <Users className="h-2.5 w-2.5" />
                          <span>{roundData.fixtures.length * 2} teams</span>
                        </div>
                      </div>

                      {/* Fixture list for this round */}
                      <div className="space-y-1.5">
                        {roundData.fixtures.map(fixture => {
                          const homeClub = getClubById(fixture.homeClubId);
                          const awayClub = getClubById(fixture.awayClubId);
                          if (!homeClub || !awayClub) return null;

                          const isPlayerMatch =
                            fixture.homeClubId === gameState.currentClub.id ||
                            fixture.awayClubId === gameState.currentClub.id;

                          // Look up actual score for completed non-player fixtures
                          const scoreKey = `${fixture.homeClubId}-${fixture.awayClubId}`;
                          const scoreData = fixture.played ? cupMatchScoreLookup.get(scoreKey) : null;

                          // Also try reverse key for cases where team order might differ
                          const reverseKey = `${fixture.awayClubId}-${fixture.homeClubId}`;
                          const reverseScoreData = !scoreData && fixture.played
                            ? cupMatchScoreLookup.get(reverseKey)
                            : null;

                          const finalScore = scoreData || (reverseScoreData ? {
                            homeScore: reverseScoreData.awayScore,
                            awayScore: reverseScoreData.homeScore,
                          } : null);

                          return (
                            <div
                              key={fixture.id}
                              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] ${
                                isPlayerMatch
                                  ? 'bg-amber-500/10 border border-amber-500/20'
                                  : fixture.played
                                  ? 'bg-[#21262d]'
                                  : 'bg-[#21262d]'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <span className="text-sm">{homeClub.logo}</span>
                                <span className={`truncate ${
                                  isPlayerMatch && fixture.homeClubId === gameState.currentClub.id
                                    ? 'text-amber-200 font-semibold'
                                    : 'text-[#c9d1d9]'
                                }`}>
                                  {homeClub.shortName}
                                </span>
                              </div>

                              {/* Score display */}
                              {fixture.played && finalScore ? (
                                <span className="text-[#8b949e] mx-2 text-[10px] font-bold tabular-nums bg-[#161b22] px-1.5 py-0.5 rounded-sm border border-[#30363d]">
                                  {finalScore.homeScore} - {finalScore.awayScore}
                                </span>
                              ) : fixture.played ? (
                                <Badge className="ml-2 bg-slate-700/50 text-[#8b949e] text-[8px] px-1 py-0 h-4">
                                  Done
                                </Badge>
                              ) : (
                                <span className="text-[#484f58] mx-2 text-[9px]">vs</span>
                              )}

                              <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                                <span className={`truncate text-right ${
                                  isPlayerMatch && fixture.awayClubId === gameState.currentClub.id
                                    ? 'text-amber-200 font-semibold'
                                    : 'text-[#c9d1d9]'
                                }`}>
                                  {awayClub.shortName}
                                </span>
                                <span className="text-sm">{awayClub.logo}</span>
                              </div>

                              {isPlayerMatch && !fixture.played && (
                                <ChevronRight className="h-3 w-3 text-amber-400 ml-1" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Cup Statistics ─────────────────────────────────────────── */}
      {cupStatistics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
        >
          <Card className="bg-[#161b22]/50 border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-amber-500" />
                Cup Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Main stats grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-amber-400 tabular-nums">
                    {cupStatistics.cupGoals}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Cup Goals</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-sky-400 tabular-nums">
                    {cupStatistics.cupAppearances}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Cup Appearances</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-400 tabular-nums">
                    {cupStatistics.winRate}%
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Win Rate</p>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-purple-400 tabular-nums">
                    {cupStatistics.cupAssists}
                  </p>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Cup Assists</p>
                </div>
              </div>

              {/* Best run */}
              <div className="bg-[#21262d] rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#8b949e]">Best Run (This Season)</p>
                  <p className="text-sm font-bold text-amber-300">{cupStatistics.bestRun}</p>
                </div>
              </div>

              {/* Win/Draw/Loss breakdown */}
              {cupStatistics.cupAppearances > 0 && (
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-[#30363d]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-emerald-400" />
                    <span className="text-[10px] text-[#8b949e]">
                      W {cupStatistics.wins}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-amber-400" />
                    <span className="text-[10px] text-[#8b949e]">
                      D {cupStatistics.draws}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-red-400" />
                    <span className="text-[10px] text-[#8b949e]">
                      L {cupStatistics.losses}
                    </span>
                  </div>
                </div>
              )}

              {/* Career trophies */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-[#30363d]">
                <div>
                  <p className="text-lg font-bold text-emerald-400">
                    {gameState.player.careerStats?.trophies?.filter(t =>
                      Object.values(CUP_NAMES).some(cn => cn.name === t.name)
                    ).length ?? 0}
                  </p>
                  <p className="text-[10px] text-[#8b949e]">Career Cup Trophies</p>
                </div>
              </div>

              {/* Cup info footnote */}
              <div className="mt-3 pt-2 border-t border-[#30363d]">
                <p className="text-[10px] text-[#484f58] text-center">
                  Cup matches occur every 4 weeks (Weeks {CUP_MATCH_WEEKS.slice(0, 4).join(', ')}...)
                  • Single elimination knockout format
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ─── Utility: ordinal suffix ────────────────────────────────────────────
function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
