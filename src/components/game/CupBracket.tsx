'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getClubById, CUP_NAMES, CUP_MATCH_WEEKS } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, XCircle, Crown, Swords, ChevronRight, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Fixture } from '@/lib/game/types';

// Round name helper
function getRoundName(round: number, totalRounds: number): string {
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  return `Round ${round}`;
}

export default function CupBracket() {
  const gameState = useGameStore(state => state.gameState);

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

    // Calculate which round is currently active
    const nextCupWeekIdx = CUP_MATCH_WEEKS.findIndex(w => w >= currentWeek);
    const isCupWeek = CUP_MATCH_WEEKS.includes(currentWeek);

    // Count remaining teams in current round
    const currentRoundFixtures = cupFixtures.filter(f => f.matchday === cupRound);
    const currentRoundPlayed = currentRoundFixtures.filter(f => f.played);
    const remainingTeams = currentRoundFixtures.length > 0
      ? currentRoundFixtures.length * 2
      : 0;

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
      nextCupWeekIdx,
      currentWeek,
      remainingTeams,
      currentRoundPlayed: currentRoundPlayed.length,
      currentRoundTotal: currentRoundFixtures.length,
      eliminatedRound: cupEliminated ? cupRound - 1 : null,
    };
  }, [gameState]);

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

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
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

            {/* Progress bar */}
            {!isCupWinner && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] ">
                  <span>Progress</span>
                  <span>Round {Math.min(cupRound, maxRound)} of {maxRound}</span>
                </div>
                <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(Math.min(cupRound - 1, maxRound) / maxRound) * 100}%` }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Cup Winner Celebration */}
      {isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
        >
          <Card className="bg-[#161b22] border-amber-500/40 overflow-hidden">
            <CardContent className="p-6 text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
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

      {/* Eliminated Message */}
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

      {/* Next Cup Match */}
      {playerNextCupMatch && nextCupOpponent && !cupEliminated && !isCupWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-[#161b22] border-amber-900/20 overflow-hidden">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] ">
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

      {/* Bracket Rounds */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
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
                  const allPlayed = roundData.fixtures.every(f => f.played);

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
                            <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">
                              CURRENT
                            </span>
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

                              <span className="text-[#484f58] mx-1.5 text-[9px]">vs</span>

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

                              {fixture.played && (
                                <Badge className="ml-2 bg-slate-700/50 text-[#8b949e] text-[8px] px-1 py-0 h-4">
                                  Done
                                </Badge>
                              )}

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

      {/* Cup Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-[#161b22]/50 border-[#30363d]">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-amber-400">
                  {gameState.recentResults.filter(r => r.competition === 'cup').length}
                </p>
                <p className="text-[10px] text-[#8b949e]">Cup Matches</p>
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-400">
                  {gameState.player.careerStats?.trophies?.filter(t =>
                    Object.values(CUP_NAMES).some(cn => cn.name === t.name)
                  ).length ?? 0}
                </p>
                <p className="text-[10px] text-[#8b949e]">Cup Trophies</p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#30363d]">
              <p className="text-[10px] text-[#484f58] text-center">
                Cup matches occur every 4 weeks (Weeks {CUP_MATCH_WEEKS.slice(0, 4).join(', ')}...)
                • Single elimination knockout format
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
