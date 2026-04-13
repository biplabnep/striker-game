'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { NATIONALITIES } from '@/lib/game/playerData';
import {
  getClubById,
  getLeagueById,
  getSeasonMatchdays,
  getClubsByLeague,
} from '@/lib/game/clubsData';
import {
  Calendar,
  Target,
  Users,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Home,
  Plane,
  Swords,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Fixture, SeasonObjective } from '@/lib/game/types';

interface SeasonPreviewProps {
  open: boolean;
  onClose: () => void;
}

// --- Helper functions ---

function getFormTrendLabel(ratings: number[]): {
  label: string;
  color: string;
  icon: typeof TrendingUp;
} {
  if (ratings.length < 2) {
    return { label: 'New season', color: 'text-[#8b949e]', icon: Minus };
  }
  const firstHalf = ratings.slice(0, Math.floor(ratings.length / 2));
  const secondHalf = ratings.slice(Math.floor(ratings.length / 2));
  const firstAvg =
    firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;
  if (diff > 0.3) {
    return { label: 'Improving', color: 'text-emerald-400', icon: TrendingUp };
  }
  if (diff < -0.3) {
    return { label: 'Declining', color: 'text-red-400', icon: TrendingDown };
  }
  return { label: 'Stable', color: 'text-amber-400', icon: Minus };
}

function getRatingColor(rating: number): string {
  if (rating >= 7.5) return '#22c55e';
  if (rating >= 6.0) return '#f59e0b';
  return '#ef4444';
}

function getObjectiveStatusColor(status: SeasonObjective['status']): string {
  switch (status) {
    case 'completed':
      return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/8';
    case 'in_progress':
      return 'text-amber-400 border-amber-500/20 bg-amber-500/8';
    case 'failed':
      return 'text-red-400 border-red-500/20 bg-red-500/8';
  }
}

// --- Main Component ---

export default function SeasonPreview({ open, onClose }: SeasonPreviewProps) {
  const gameState = useGameStore((s) => s.gameState);

  const {
    player,
    currentClub,
    currentSeason,
    currentWeek,
    year,
    recentResults,
    upcomingFixtures,
    seasonObjectives,
    availableClubs,
  } = gameState!;

  // ---- Computed values ----

  const leagueInfo = useMemo(
    () => getLeagueById(currentClub.league),
    [currentClub.league],
  );

  const teamCount = useMemo(() => {
    const league = leagueInfo;
    if (!league) return 20;
    return league.teamCount;
  }, [leagueInfo]);

  const totalMatchdays = useMemo(
    () => getSeasonMatchdays(currentClub.league),
    [currentClub.league],
  );

  // Year range for season header
  const yearRange = useMemo(() => {
    return `${year}/${String(year + 1).slice(2)}`;
  }, [year]);

  // Nationality flag
  const nationInfo = useMemo(
    () => NATIONALITIES.find((n) => n.name === player.nationality),
    [player.nationality],
  );

  // Key rivals: randomly pick 3-4 clubs from same league, excluding current club
  const keyRivals = useMemo(() => {
    const leagueClubs = getClubsByLeague(currentClub.league).filter(
      (c) => c.id !== currentClub.id,
    );
    // Sort by reputation descending and pick top rivals
    const sorted = [...leagueClubs].sort((a, b) => b.reputation - a.reputation);
    // Pick 3-4, using a seeded approach based on season number for consistency
    const count = 3 + (currentSeason % 2); // alternating 3 or 4
    const startIdx = (currentSeason * 2) % Math.max(1, sorted.length);
    const rivals: { name: string; shortName: string; logo: string; reputation: number }[] = [];
    for (let i = 0; i < count && i < sorted.length; i++) {
      const idx = (startIdx + i) % sorted.length;
      rivals.push({
        name: sorted[idx].name,
        shortName: sorted[idx].shortName,
        logo: sorted[idx].logo,
        reputation: sorted[idx].reputation,
      });
    }
    return rivals;
  }, [currentClub.id, currentClub.league, currentSeason]);

  // Current form trend from previous season
  const formTrend = useMemo(() => {
    if (!recentResults || recentResults.length === 0) return null;
    // Take last 5 match ratings (most recent first in array)
    const ratings = recentResults.slice(0, 5).map((r) => r.playerRating);
    return {
      ratings,
      ...getFormTrendLabel(ratings),
    };
  }, [recentResults]);

  // Current season objectives
  const currentObjectives = useMemo(() => {
    if (!seasonObjectives || seasonObjectives.length === 0) return null;
    const current = seasonObjectives.find((s) => s.season === currentSeason);
    if (!current || !current.objectives || current.objectives.length === 0) return null;
    return {
      objectives: current.objectives.slice(0, 4),
      boardExpectation: current.boardExpectation,
    };
  }, [seasonObjectives, currentSeason]);

  // First 5 fixtures of the season (matchday 1-5)
  const earlyFixtures = useMemo(() => {
    if (!upcomingFixtures) return [];
    const allFixtures = [...upcomingFixtures];
    // Sort by matchday
    allFixtures.sort((a, b) => a.matchday - b.matchday);
    return allFixtures
      .filter(
        (f) =>
          f.matchday >= 1 &&
          f.matchday <= 5 &&
          (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id) &&
          f.competition === 'league',
      )
      .slice(0, 5);
  }, [upcomingFixtures, currentClub.id]);

  // Potential room to grow
  const growthRoom = useMemo(() => {
    return Math.max(0, player.potential - player.overall);
  }, [player.overall, player.potential]);

  // Board expectation label
  const boardLabel = useMemo(() => {
    if (!currentObjectives?.boardExpectation) return null;
    const map: Record<string, { label: string; color: string }> = {
      title_challenge: { label: 'Title Challenge', color: 'text-amber-400' },
      top_four: { label: 'Top 4 Finish', color: 'text-emerald-400' },
      mid_table: { label: 'Mid-Table Safety', color: 'text-[#c9d1d9]' },
      survival: { label: 'Survival', color: 'text-red-400' },
    };
    return map[currentObjectives.boardExpectation] ?? null;
  }, [currentObjectives]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative z-10 w-full max-w-lg mx-4 mb-4 sm:mb-0 max-h-[90vh] overflow-y-auto rounded-xl border border-[#30363d] bg-[#0d1117] pb-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            {/* ===== Season Header ===== */}
            <div className="p-4 border-b border-[#30363d]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Season Preview
                    </span>
                    <Badge className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0">
                      New
                    </Badge>
                  </div>
                  <h2 className="text-xl font-black text-[#c9d1d9] mt-1">
                    Season {currentSeason}
                  </h2>
                  <p className="text-xs text-[#8b949e] mt-0.5">{yearRange}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{currentClub.logo}</span>
                    <span className="text-sm font-semibold text-[#c9d1d9]">
                      {currentClub.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-1">
                    {nationInfo?.flag} {player.name} &bull;{' '}
                    <span className="capitalize">{player.position}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ===== League Overview ===== */}
            <div className="p-4 border-b border-[#30363d]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-[#c9d1d9]">
                  League Overview
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-2.5 text-center">
                  <div className="text-lg font-black text-[#c9d1d9]">
                    {leagueInfo?.emoji}
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">
                    {leagueInfo?.name}
                  </p>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-2.5 text-center">
                  <div className="text-lg font-black text-emerald-400">
                    {teamCount}
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Teams</p>
                </div>
                <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-2.5 text-center">
                  <div className="text-lg font-black text-emerald-400">
                    {totalMatchdays}
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">Matchdays</p>
                </div>
              </div>

              {/* Key Rivals */}
              <div>
                <p className="text-[10px] text-[#8b949e] font-medium mb-1.5 uppercase tracking-wider">
                  Key Rivals
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keyRivals.map((rival, i) => (
                    <motion.div
                      key={rival.shortName}
                      className="flex items-center gap-1.5 bg-[#161b22] border border-[#21262d] rounded-md px-2 py-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                    >
                      <span className="text-xs">{rival.logo}</span>
                      <span className="text-[11px] font-semibold text-[#c9d1d9]">
                        {rival.shortName}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== Pre-Season Assessment ===== */}
            <div className="p-4 border-b border-[#30363d]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-[#c9d1d9]">
                  Pre-Season Assessment
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Overall Rating */}
                <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e] font-medium">
                      Overall
                    </span>
                    <span className="text-lg font-black text-[#c9d1d9]">
                      {player.overall}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">
                      +{growthRoom} to POT {player.potential}
                    </span>
                  </div>
                </div>

                {/* Form Trend */}
                <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#8b949e] font-medium">
                      Form Trend
                    </span>
                    {formTrend && (
                      <formTrend.icon
                        className={`h-3.5 w-3.5 ${formTrend.color}`}
                      />
                    )}
                  </div>
                  {formTrend ? (
                    <div className="flex items-center gap-1 mt-1.5">
                      {formTrend.ratings.map((r, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <div
                            className="w-3 rounded-sm"
                            style={{
                              height: `${Math.max(4, ((r - 3) / 7) * 20)}px`,
                              backgroundColor: getRatingColor(r),
                            }}
                          />
                          <span className="text-[7px] text-[#484f58]">
                            {r.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#8b949e] mt-1">
                      No previous data
                    </p>
                  )}
                </div>
              </div>

              {/* Season Objectives */}
              {currentObjectives && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider">
                      Season Objectives
                    </p>
                    {boardLabel && (
                      <span className={`text-[10px] font-bold ${boardLabel.color}`}>
                        {boardLabel.label}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {currentObjectives.objectives.map((obj, i) => (
                      <motion.div
                        key={obj.id}
                        className="flex items-center justify-between bg-[#161b22] border border-[#21262d] rounded-md px-2.5 py-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.04 }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs shrink-0">{obj.icon}</span>
                          <span className="text-[11px] text-[#c9d1d9] truncate">
                            {obj.title}
                          </span>
                        </div>
                        <Badge
                          className={`text-[9px] font-bold px-1.5 py-0 shrink-0 ${getObjectiveStatusColor(obj.status)}`}
                          variant="outline"
                        >
                          {obj.status === 'in_progress'
                            ? '0%'
                            : obj.status === 'completed'
                              ? 'Done'
                              : 'Failed'}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ===== Fixture Highlights ===== */}
            <div className="p-4 border-b border-[#30363d]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
                  <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-[#c9d1d9]">
                  Opening Fixtures
                </h3>
              </div>

              {earlyFixtures.length > 0 ? (
                <div className="space-y-1.5">
                  {earlyFixtures.map((fixture, i) => {
                    const isHomeGame =
                      fixture.homeClubId === currentClub.id;
                    const opponentId = isHomeGame
                      ? fixture.awayClubId
                      : fixture.homeClubId;
                    const opponent = getClubById(opponentId);

                    return (
                      <motion.div
                        key={fixture.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 border ${
                          isHomeGame
                            ? 'bg-emerald-500/8 border-emerald-500/15'
                            : 'bg-[#161b22] border-[#21262d]'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 + i * 0.05 }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center ${
                              isHomeGame
                                ? 'bg-emerald-500/15'
                                : 'bg-[#21262d]'
                            }`}
                          >
                            {isHomeGame ? (
                              <Home className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Plane className="h-3 w-3 text-[#8b949e]" />
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-[#c9d1d9]">
                              {isHomeGame ? 'vs' : '@'}{' '}
                              {opponent?.shortName ?? 'TBD'}
                            </p>
                            <p className="text-[9px] text-[#8b949e]">
                              Matchday {fixture.matchday}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`text-[9px] font-bold px-1.5 py-0 ${
                              isHomeGame
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
                            }`}
                          >
                            {isHomeGame ? 'HOME' : 'AWAY'}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <p className="text-xs text-[#8b949e]">
                    No fixtures available yet
                  </p>
                </div>
              )}
            </div>

            {/* ===== Ready to Begin Button ===== */}
            <div className="p-4">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                Ready to Begin
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-center text-[10px] text-[#484f58] mt-2">
                Week {currentWeek} &bull; {totalMatchdays} matchdays ahead
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
