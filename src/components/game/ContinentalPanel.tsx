'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import {
  Globe, Trophy, Star,
  Swords, Crown, Flame,
  Target, Zap, TrendingUp, BarChart3, Clock,
  Shield, UserCheck, Calendar, History, MapPin, Flag, Award,
  Plane, Tv, Moon, BookOpen, Timer, Route, Medal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ContinentalFixture,
  ContinentalCompetition,
  ContinentalGroupStanding,
  LeagueStanding,
} from '@/lib/game/types';
import {
  getContinentalName,
  getStageName,
  sortGroupStandings,
  CONTINENTAL_GROUP_MATCH_WEEKS,
  CONTINENTAL_KO_MATCH_WEEKS,
} from '@/lib/game/continentalEngine';
import { getClubById } from '@/lib/game/clubsData';

// ============================================================
// Helpers
// ============================================================

type FormResult = 'W' | 'D' | 'L';

function getTeamForm(
  fixtures: ContinentalFixture[],
  group: string,
  teamId: string
): FormResult[] {
  const teamFixtures = fixtures
    .filter(
      (f) =>
        f.group === group &&
        f.played &&
        (f.homeClubId === teamId || f.awayClubId === teamId)
    )
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 3);

  return teamFixtures.map((f) => {
    const isHome = f.homeClubId === teamId;
    const myGoals = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
    const oppGoals = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
    if (myGoals > oppGoals) return 'W';
    if (myGoals < oppGoals) return 'L';
    return 'D';
  });
}

function sortLeagueTable(table: LeagueStanding[]): LeagueStanding[] {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aGD = a.goalsFor - a.goalsAgainst;
    const bGD = b.goalsFor - b.goalsAgainst;
    if (bGD !== aGD) return bGD - aGD;
    return b.goalsFor - a.goalsFor;
  });
}

const STAGES = [
  { key: 'group', label: 'Groups' },
  { key: 'round_of_16', label: 'R16' },
  { key: 'quarter_final', label: 'QF' },
  { key: 'semi_final', label: 'SF' },
  { key: 'final', label: 'Final' },
] as const;

type StageStatus = 'completed' | 'current' | 'upcoming';

function getStageStatus(
  stageIdx: number,
  currentKnockoutRound: number,
  eliminated: boolean
): StageStatus {
  if (eliminated && stageIdx > currentKnockoutRound) return 'upcoming';
  if (stageIdx < currentKnockoutRound) return 'completed';
  if (stageIdx === currentKnockoutRound) return 'current';
  return 'upcoming';
}

// ============================================================
// Form Dots Component
// ============================================================

function FormDots({ form }: { form: FormResult[] }) {
  const colorMap: Record<FormResult, string> = {
    W: 'bg-emerald-400',
    D: 'bg-amber-400',
    L: 'bg-red-400',
  };
 const labelMap: Record<FormResult, string> = {
    W: 'W',
    D: 'D',
    L: 'L',
  };

  return (
    <div className="flex items-center gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-lg ${colorMap[r]} text-[7px] font-bold text-[#0d1117]`}
          title={labelMap[r]}
        >
          {labelMap[r]}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// Stage Stepper Component
// ============================================================

function StageStepper({
  currentRound,
  eliminated,
}: {
  currentRound: number;
  eliminated: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-3 px-1">
      {STAGES.map((stage, idx) => {
        const status = getStageStatus(idx, currentRound, eliminated);
        const dotColor =
          status === 'completed'
            ? 'bg-emerald-400'
            : status === 'current'
              ? 'bg-amber-400'
              : 'bg-[#30363d]';
        const textColor =
          status === 'completed'
            ? 'text-emerald-400'
            : status === 'current'
              ? 'text-amber-400'
              : 'text-[#484f58]';
        const isLast = idx === STAGES.length - 1;

        return (
          <div key={stage.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              {status === 'current' ? (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className={`w-4 h-4 rounded-lg ${dotColor}`}
                />
              ) : (
                <div className={`w-4 h-4 rounded-lg ${dotColor}`} />
              )}
              <span className={`text-[9px] font-semibold ${textColor}`}>
                {stage.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-px mx-1 ${
                  status === 'completed' ? 'bg-emerald-500/40' : 'bg-[#30363d]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Group Table Component (Enhanced)
// ============================================================

function GroupTable({
  standings,
  group,
  playerClubId,
  fixtures,
}: {
  standings: ContinentalGroupStanding[];
  group: string;
  playerClubId: string;
  fixtures: ContinentalFixture[];
}) {
  const sorted = useMemo(() => sortGroupStandings(standings), [standings]);

  return (
    <div className="rounded-lg bg-[#21262d] border border-[#30363d] overflow-hidden">
      <div className="px-3 py-2 border-b border-[#30363d] flex items-center gap-2">
        <span className="text-sm font-bold text-[#c9d1d9]">Group {group}</span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 border-[#30363d] text-[#8b949e]"
        >
          {standings.length} teams
        </Badge>
      </div>
      {/* Zone legend */}
      <div className="flex gap-3 px-3 py-1.5 border-b border-[#30363d]">
        <div className="flex items-center gap-1 text-[9px] text-[#8b949e]">
          <span className="w-2 h-2 rounded-sm bg-emerald-400" />
          Qualify
        </div>
        <div className="flex items-center gap-1 text-[9px] text-[#8b949e]">
          <span className="w-2 h-2 rounded-sm bg-amber-400" />
          Europa
        </div>
        <div className="flex items-center gap-1 text-[9px] text-[#8b949e]">
          <span className="w-2 h-2 rounded-sm bg-red-400" />
          Eliminated
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[380px]">
          <thead>
            <tr className="text-[#8b949e] bg-[#21262d]">
              <th className="py-1.5 px-1.5 text-left w-6">#</th>
              <th className="py-1.5 px-1.5 text-left">Team</th>
              <th className="py-1.5 px-1 text-center w-10">Form</th>
              <th className="py-1.5 px-1.5 text-center w-7">P</th>
              <th className="py-1.5 px-1.5 text-center w-7">W</th>
              <th className="py-1.5 px-1.5 text-center w-7">D</th>
              <th className="py-1.5 px-1.5 text-center w-7">L</th>
              <th className="py-1.5 px-1.5 text-center w-9">GD</th>
              <th className="py-1.5 px-1.5 text-center w-9 font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => {
              const isPlayer = team.clubId === playerClubId;
              const gd = team.goalsFor - team.goalsAgainst;
              const qualifies = idx < 2;
              const isEuropa = idx === 2;
              const isBottom = idx >= sorted.length - 1;
              const club = getClubById(team.clubId);
              const form = getTeamForm(fixtures, group, team.clubId);

              return (
                <tr
                  key={team.clubId}
                  className={`border-t border-[#30363d] ${
                    isPlayer ? 'bg-emerald-500/10' : 'hover:bg-[#161b22]'
                  }`}
                >
                  {/* Zone shading via left border */}
                  <td
                    className={`py-1.5 px-1.5 text-center ${
                      qualifies
                        ? 'text-emerald-400'
                        : isEuropa
                          ? 'text-amber-400'
                          : isBottom
                            ? 'text-red-400'
                            : 'text-[#8b949e]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-0.5 self-stretch ${
                          qualifies
                            ? 'bg-emerald-400'
                            : isEuropa
                              ? 'bg-amber-400'
                              : isBottom
                                ? 'bg-red-400'
                                : 'bg-transparent'
                        }`}
                      />
                      {idx + 1}
                    </div>
                  </td>
                  {/* Team name with logo */}
                  <td
                    className={`py-1.5 px-1.5 font-medium ${
                      isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{club?.logo ?? '⚽'}</span>
                      <span className="truncate max-w-[90px]">{team.clubName}</span>
                      {qualifies && (
                        <span className="text-[9px] text-emerald-500">★</span>
                      )}
                    </div>
                  </td>
                  {/* Form dots */}
                  <td className="py-1.5 px-1 text-center">
                    {form.length > 0 ? (
                      <FormDots form={form} />
                    ) : (
                      <span className="text-[#484f58]">-</span>
                    )}
                  </td>
                  <td className="py-1.5 px-1.5 text-center text-[#8b949e]">
                    {team.played}
                  </td>
                  <td className="py-1.5 px-1.5 text-center text-[#8b949e]">
                    {team.won}
                  </td>
                  <td className="py-1.5 px-1.5 text-center text-[#8b949e]">
                    {team.drawn}
                  </td>
                  <td className="py-1.5 px-1.5 text-center text-[#8b949e]">
                    {team.lost}
                  </td>
                  {/* GD with color coding */}
                  <td
                    className={`py-1.5 px-1.5 text-center ${
                      gd > 0
                        ? 'text-emerald-400'
                        : gd < 0
                          ? 'text-red-400'
                          : 'text-[#8b949e]'
                    }`}
                  >
                    {gd > 0 ? '+' : ''}
                    {gd}
                  </td>
                  <td className="py-1.5 px-1.5 text-center font-bold text-[#c9d1d9]">
                    {team.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Knockout Fixture Card (Enhanced)
// ============================================================

function KnockoutFixtureCard({
  fixture,
  playerClubId,
  index,
}: {
  fixture: ContinentalFixture;
  playerClubId: string;
  index: number;
}) {
  const homeClub = getClubById(fixture.homeClubId);
  const awayClub = getClubById(fixture.awayClubId);
  const involvesPlayer =
    fixture.homeClubId === playerClubId || fixture.awayClubId === playerClubId;
  const isHomePlayer = fixture.homeClubId === playerClubId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`rounded-lg border overflow-hidden ${
        involvesPlayer
          ? 'bg-emerald-500/8 border-emerald-500/20'
          : 'bg-[#161b22] border-[#30363d]'
      }`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${
              fixture.stage === 'final'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                : fixture.stage === 'semi_final'
                  ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                  : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
            }`}
          >
            {getStageName(fixture.stage)}
          </Badge>
          {involvesPlayer && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                Your Match
              </Badge>
            </motion.div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base shrink-0">
              {homeClub?.logo ?? '⚽'}
            </span>
            <span
              className={`text-sm font-semibold truncate ${
                fixture.homeClubId === playerClubId
                  ? 'text-emerald-400'
                  : 'text-[#c9d1d9]'
              }`}
            >
              {homeClub?.shortName ?? '???'}
            </span>
          </div>
          <div className="px-3 text-center shrink-0">
            {fixture.played ? (
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-[#c9d1d9]">
                  {fixture.homeScore} - {fixture.awayScore}
                </span>
                <span className="text-[9px] text-[#8b949e]">
                  Agg: {fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#8b949e]">vs</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <span
              className={`text-sm font-semibold truncate ${
                fixture.awayClubId === playerClubId
                  ? 'text-emerald-400'
                  : 'text-[#c9d1d9]'
              }`}
            >
              {awayClub?.shortName ?? '???'}
            </span>
            <span className="text-base shrink-0">
              {awayClub?.logo ?? '⚽'}
            </span>
          </div>
        </div>
        {/* Result indicator for played matches involving player */}
        {fixture.played && involvesPlayer && (
          <div className="mt-2 pt-2 border-t border-[#30363d] flex items-center justify-center gap-2">
            {(() => {
              const playerGoals = isHomePlayer
                ? fixture.homeScore ?? 0
                : fixture.awayScore ?? 0;
              const oppGoals = isHomePlayer
                ? fixture.awayScore ?? 0
                : fixture.homeScore ?? 0;
              const result =
                playerGoals > oppGoals
                  ? 'W'
                  : playerGoals < oppGoals
                    ? 'L'
                    : 'D';
              const color =
                result === 'W'
                  ? 'text-emerald-400'
                  : result === 'L'
                    ? 'text-red-400'
                    : 'text-amber-400';
              const bg =
                result === 'W'
                  ? 'bg-emerald-500/10'
                  : result === 'L'
                    ? 'bg-red-500/10'
                    : 'bg-amber-500/10';
              return (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${bg} ${color}`}
                >
                  {result}
                </span>
              );
            })()}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Knockout Bracket View (Simplified for mobile)
// ============================================================

function KnockoutBracketView({
  knockoutFixtures,
  playerClubId,
}: {
  knockoutFixtures: ContinentalFixture[];
  playerClubId: string;
}) {
  const rounds = useMemo(() => {
    const stageOrder: Array<ContinentalFixture['stage']> = [
      'round_of_16',
      'quarter_final',
      'semi_final',
      'final',
    ];
    return stageOrder
      .map((stage) => ({
        stage,
        fixtures: knockoutFixtures.filter((f) => f.stage === stage),
      }))
      .filter((r) => r.fixtures.length > 0);
  }, [knockoutFixtures]);

  if (rounds.length === 0) return null;

  return (
    <div className="space-y-3">
      {rounds.map((round) => {
        const stageIcon =
          round.stage === 'final' ? (
            <Crown className="h-4 w-4 text-amber-400" />
          ) : round.stage === 'semi_final' ? (
            <Trophy className="h-4 w-4 text-purple-400" />
          ) : (
            <Swords className="h-4 w-4 text-[#8b949e]" />
          );

        const hasPlayerFixture = round.fixtures.some(
          (f) =>
            f.homeClubId === playerClubId || f.awayClubId === playerClubId
        );

        return (
          <motion.div
            key={round.stage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              {stageIcon}
              <h3 className="text-sm font-semibold text-[#c9d1d9]">
                {getStageName(round.stage)}
              </h3>
              {hasPlayerFixture && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5">
                  Your Path
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {round.fixtures.map((fixture, i) => (
                <KnockoutFixtureCard
                  key={fixture.id}
                  fixture={fixture}
                  playerClubId={playerClubId}
                  index={i}
                />
              ))}
            </div>
            {/* Connector to next round */}
            {round.stage !== 'final' && (
              <div className="flex justify-center py-2">
                <div className="w-px h-4 bg-[#30363d]" />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// Stats Dashboard
// ============================================================

function StatsDashboard({
  fixtures,
  playerClubId,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
}) {
  const stats = useMemo(() => {
    const played = fixtures.filter(
      (f) =>
        f.played &&
        (f.homeClubId === playerClubId || f.awayClubId === playerClubId)
    );

    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let cleanSheets = 0;

    for (const f of played) {
      const isHome = f.homeClubId === playerClubId;
      const gf = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      const ga = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);

      goalsFor += gf;
      goalsAgainst += ga;

      if (gf > ga) wins++;
      else if (gf === ga) draws++;
      else losses++;

      if (ga === 0) cleanSheets++;
    }

    return {
      played: played.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      cleanSheets,
    };
  }, [fixtures, playerClubId]);

  const statCards = [
    {
      label: 'Played',
      value: stats.played,
      color: 'text-[#c9d1d9]',
    },
    {
      label: 'Wins',
      value: stats.wins,
      color: 'text-emerald-400',
    },
    {
      label: 'Draws',
      value: stats.draws,
      color: 'text-amber-400',
    },
    {
      label: 'Losses',
      value: stats.losses,
      color: 'text-red-400',
    },
    {
      label: 'Goals For',
      value: stats.goalsFor,
      color: 'text-emerald-400',
    },
    {
      label: 'Goals Agn',
      value: stats.goalsAgainst,
      color: stats.goalsAgainst > stats.goalsFor ? 'text-red-400' : 'text-[#8b949e]',
    },
    {
      label: 'Clean Sheets',
      value: stats.cleanSheets,
      color: 'text-[#c9d1d9]',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {statCards.map((s) => (
        <div
          key={s.label}
          className="bg-[#21262d] rounded-lg p-2 text-center"
        >
          <span className={`text-lg font-bold block ${s.color}`}>
            {s.value}
          </span>
          <span className="block text-[9px] text-[#8b949e] mt-0.5 leading-tight">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Top Performers Section
// ============================================================

function TopPerformers({
  recentResults,
  continentalCompetition,
}: {
  recentResults: Array<{
    competition: string;
    playerGoals: number;
    playerAssists: number;
    playerRating: number;
    playerMinutesPlayed: number;
  }>;
  continentalCompetition: ContinentalCompetition;
}) {
  const playerStats = useMemo(() => {
    const cResults = recentResults.filter(
      (r) => r.competition === continentalCompetition
    );

    const appearances = cResults.filter(
      (r) => r.playerMinutesPlayed > 0
    ).length;

    const totalGoals = cResults.reduce((s, r) => s + r.playerGoals, 0);
    const totalAssists = cResults.reduce((s, r) => s + r.playerAssists, 0);

    const ratedMatches = cResults.filter((r) => r.playerRating > 0);
    const avgRating =
      ratedMatches.length > 0
        ? ratedMatches.reduce((s, r) => s + r.playerRating, 0) /
          ratedMatches.length
        : 0;

    return {
      appearances,
      goals: totalGoals,
      assists: totalAssists,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  }, [recentResults, continentalCompetition]);

  const performerCards = [
    {
      icon: <Target className="h-3.5 w-3.5" />,
      label: 'Goals',
      value: playerStats.goals,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: <Zap className="h-3.5 w-3.5" />,
      label: 'Assists',
      value: playerStats.assists,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      icon: <Star className="h-3.5 w-3.5" />,
      label: 'Avg Rating',
      value: playerStats.avgRating > 0 ? playerStats.avgRating.toFixed(1) : '-',
      color:
        playerStats.avgRating >= 7.5
          ? 'text-emerald-400'
          : playerStats.avgRating >= 6.5
            ? 'text-amber-400'
            : 'text-[#8b949e]',
      bg:
        playerStats.avgRating >= 7.5
          ? 'bg-emerald-500/10'
          : playerStats.avgRating >= 6.5
            ? 'bg-amber-500/10'
            : 'bg-[#21262d]',
    },
    {
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      label: 'Apps',
      value: playerStats.appearances,
      color: 'text-[#c9d1d9]',
      bg: 'bg-[#21262d]',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {performerCards.map((p) => (
        <div key={p.label} className={`${p.bg} rounded-lg p-3`}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`${p.color}`}>{p.icon}</span>
            <span className="text-[10px] text-[#8b949e]">{p.label}</span>
          </div>
          <span className={`text-xl font-bold ${p.color}`}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Next Match Timeline
// ============================================================

function NextMatchTimeline({
  nextMatch,
  currentWeek,
  playerClubId,
}: {
  nextMatch: ContinentalFixture | null;
  currentWeek: number;
  playerClubId: string;
}) {
  if (!nextMatch) return null;

  const weeksUntil = nextMatch.matchday > currentWeek ? nextMatch.matchday - currentWeek : 0;
  const homeClub = getClubById(nextMatch.homeClubId);
  const awayClub = getClubById(nextMatch.awayClubId);

  return (
    <div className="bg-[#21262d] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wide">
          Upcoming
        </span>
        {weeksUntil > 0 && (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-[9px] px-1.5">
            In {weeksUntil} week{weeksUntil > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base">{homeClub?.logo ?? '⚽'}</span>
          <span
            className={`text-sm font-semibold truncate ${
              nextMatch.homeClubId === playerClubId
                ? 'text-emerald-400'
                : 'text-[#c9d1d9]'
            }`}
          >
            {homeClub?.shortName ?? '???'}
          </span>
        </div>
        <div className="px-3 text-center shrink-0">
          <span className="text-xs font-bold text-[#484f58]">VS</span>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span
            className={`text-sm font-semibold truncate ${
              nextMatch.awayClubId === playerClubId
                ? 'text-emerald-400'
                : 'text-[#c9d1d9]'
            }`}
          >
            {awayClub?.shortName ?? '???'}
          </span>
          <span className="text-base">{awayClub?.logo ?? '⚽'}</span>
        </div>
      </div>
      <div className="text-[10px] text-[#484f58] mt-1.5 text-center">
        {nextMatch.stage === 'group'
          ? `Matchday ${nextMatch.matchday}`
          : getStageName(nextMatch.stage)}
        {nextMatch.group ? ` · Group ${nextMatch.group}` : ''}
      </div>
    </div>
  );
}

// ============================================================
// NEW: Competition Tree SVG
// ============================================================
function CompetitionTreeSVG({
  fixtures,
  playerClubId,
  knockoutRound,
  eliminated,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
  knockoutRound: number;
  eliminated: boolean;
}) {
  const stageOrder: Array<ContinentalFixture['stage']> = ['round_of_16', 'quarter_final', 'semi_final', 'final'];
  const stageLabels = ['R16', 'QF', 'SF', 'Final'];

  // Get fixtures per stage
  const rounds = stageOrder.map(stage => ({
    stage,
    fixtures: fixtures.filter(f => f.stage === stage),
  }));

  const colW = 62;
  const colGap = 10;
  const boxH = 34;
  const boxGap = 8;
  const viewBoxW = 320;
  const startY = 16;
  const trophyX = viewBoxW - 20;
  const trophyY = startY + 40;

  // Helper to get short name
  const getShort = (clubId: string) => {
    const club = getClubById(clubId);
    return club?.shortName ?? '???';
  };

  const getLogo = (clubId: string) => {
    const club = getClubById(clubId);
    return club?.logo ?? '⚽';
  };

  const isPlayerClub = (clubId: string) => clubId === playerClubId;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${viewBoxW} 180`} className="w-full" style={{ minWidth: viewBoxW }}>
        {/* Stage column headers */}
        {stageLabels.map((label, i) => {
          const x = 10 + i * (colW + colGap);
          const isActive = !eliminated && knockoutRound > 0 && i <= knockoutRound - 1;
          const isCurrent = !eliminated && knockoutRound > 0 && i === knockoutRound - 1;
          return (
            <g key={label}>
              <rect x={x} y={2} width={colW} height={16} rx="4" fill={isCurrent ? '#10b981' : isActive ? '#21262d' : '#161b22'} stroke={isCurrent ? '#10b981' : '#30363d'} strokeWidth="0.8" />
              <text x={x + colW / 2} y={13} textAnchor="middle" className={isCurrent ? 'fill-emerald-400' : 'fill-[#8b949e]'} fontSize="8" fontWeight="600">{label}</text>
            </g>
          );
        })}

        {/* Match boxes per column */}
        {rounds.map((round, colIdx) => {
          const x = 10 + colIdx * (colW + colGap);
          if (round.fixtures.length === 0) {
            return (
              <g key={round.stage}>
                <rect x={x} y={startY} width={colW} height={boxH} rx="4" fill="#161b22" stroke="#30363d" strokeWidth="0.8" strokeDasharray="3 2" />
                <text x={x + colW / 2} y={startY + boxH / 2 + 3} textAnchor="middle" className="fill-[#484f58]" fontSize="7">TBD</text>
              </g>
            );
          }
          return (
            <g key={round.stage}>
              {round.fixtures.slice(0, 3).map((fix, fIdx) => {
                const y = startY + fIdx * (boxH + boxGap);
                const involvesPlayer = fix.homeClubId === playerClubId || fix.awayClubId === playerClubId;
                const hasResult = fix.played;
                return (
                  <g key={fix.id}>
                    <rect
                      x={x}
                      y={y}
                      width={colW}
                      height={boxH}
                      rx="4"
                      fill={involvesPlayer ? '#10b981' : '#21262d'}
                      stroke={involvesPlayer ? '#10b981' : '#30363d'}
                      strokeWidth="0.8"
                    />
                    <text x={x + 3} y={y + 13} className={involvesPlayer ? 'fill-emerald-400' : 'fill-[#c9d1d9]'} fontSize="7" fontWeight="600">{getShort(fix.homeClubId)}</text>
                    <text x={x + colW / 2} y={y + 24} textAnchor="middle" className="fill-[#8b949e]" fontSize="7">
                      {hasResult ? `${fix.homeScore}-${fix.awayScore}` : 'vs'}
                    </text>
                    <text x={x + colW - 3} y={y + 13} textAnchor="end" className={involvesPlayer ? 'fill-emerald-400' : 'fill-[#c9d1d9]'} fontSize="7" fontWeight="600">{getShort(fix.awayClubId)}</text>
                  </g>
                );
              })}
              {round.fixtures.length > 3 && (
                <text x={x + colW / 2} y={startY + 3 * (boxH + boxGap) + 12} textAnchor="middle" className="fill-[#484f58]" fontSize="7">+{round.fixtures.length - 3} more</text>
              )}
            </g>
          );
        })}

        {/* Connecting lines between columns */}
        {rounds.slice(0, -1).map((round, colIdx) => {
          const nextRound = rounds[colIdx + 1];
          if (round.fixtures.length === 0 || nextRound.fixtures.length === 0) return null;
          const x1 = 10 + colIdx * (colW + colGap) + colW;
          const x2 = 10 + (colIdx + 1) * (colW + colGap);
          const midX = (x1 + x2) / 2;
          const matchCount = Math.min(round.fixtures.length, 2);
          return (
            <g key={`conn-${colIdx}`}>
              {[0, 1].map(i => (
                <line
                  key={i}
                  x1={x1}
                  y1={startY + i * (boxH + boxGap) + boxH / 2}
                  x2={midX}
                  y2={startY + (i === 0 ? 0 : matchCount - 1) * (boxH + boxGap) + boxH / 2}
                  stroke="#30363d"
                  strokeWidth="0.8"
                />
              ))}
              {[0, 1].map(i => (
                <line
                  key={`r${i}`}
                  x1={midX}
                  y1={startY + (i === 0 ? 0 : matchCount - 1) * (boxH + boxGap) + boxH / 2}
                  x2={x2}
                  y2={startY + i * (boxH + boxGap) + boxH / 2}
                  stroke="#30363d"
                  strokeWidth="0.8"
                />
              ))}
            </g>
          );
        })}

        {/* Trophy at the end */}
        <g>
          <text x={trophyX} y={trophyY + 14} textAnchor="middle" fontSize="22">🏆</text>
          <text x={trophyX} y={trophyY + 30} textAnchor="middle" className="fill-amber-400" fontSize="7" fontWeight="600">Trophy</text>
        </g>
      </svg>
    </div>
  );
}

// ============================================================
// NEW: Competition Stats Grid
// ============================================================
function CompetitionStatsGrid({
  fixtures,
  playerClubId,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
}) {
  const stats = useMemo(() => {
    const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId));
    let goalsFor = 0;
    let cleanSheets = 0;
    let totalRating = 0;
    let rated = 0;

    for (const f of played) {
      const isHome = f.homeClubId === playerClubId;
      goalsFor += isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      if ((isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)) === 0) cleanSheets++;
    }

    // Avg rating from recent results (approximate from form)
    for (const f of played) {
      const isHome = f.homeClubId === playerClubId;
      const myGoals = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      const oppGoals = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
      let r = 6.0;
      if (myGoals > oppGoals) r = 7.0 + Math.min(2.0, myGoals * 0.3);
      else if (myGoals === oppGoals) r = 6.5;
      else r = 5.0 + Math.max(0, (oppGoals - myGoals) > 2 ? 0 : 1);
      totalRating += r;
      rated++;
    }

    return {
      goalsFor,
      cleanSheets,
      avgRating: rated > 0 ? Math.round((totalRating / rated) * 10) / 10 : 0,
    };
  }, [fixtures, playerClubId]);

  const cards = [
    {
      icon: <Target className="h-4 w-4" />,
      label: 'Goals Scored',
      value: stats.goalsFor,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: <Shield className="h-4 w-4" />,
      label: 'Clean Sheets',
      value: stats.cleanSheets,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      icon: <Award className="h-4 w-4" />,
      label: 'Avg Rating',
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-',
      color: stats.avgRating >= 7.0 ? 'text-amber-400' : 'text-[#8b949e]',
      bg: stats.avgRating >= 7.0 ? 'bg-amber-500/10' : 'bg-[#21262d]',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-lg p-3 text-center`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className={c.color}>{c.icon}</span>
            <span className="text-[9px] text-[#8b949e]">{c.label}</span>
          </div>
          <span className={`text-xl font-bold block ${c.color}`}>{c.value}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// NEW: Opponent Scout Cards
// ============================================================
function OpponentScoutCards({
  nextMatch,
  continentalFixtures,
  playerClubId,
}: {
  nextMatch: ContinentalFixture;
  continentalFixtures: ContinentalFixture[];
  playerClubId: string;
}) {
  const opponentClubId = nextMatch.homeClubId === playerClubId ? nextMatch.awayClubId : nextMatch.homeClubId;
  const club = getClubById(opponentClubId);
  const countries = ['🇪🇸', '🇬🇧', '🇩🇪', '🇫🇷', '🇮🇹', '🇵🇹', '🇳🇱', '🇧🇪'];

  const form = continentalFixtures.filter(f => f.played && (f.homeClubId === opponentClubId || f.awayClubId === opponentClubId)).slice(0, 4).map(f => {
    const isHome = f.homeClubId === opponentClubId;
    const myG = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
    const oppG = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
    return myG > oppG ? 'W' as const : myG < oppG ? 'L' as const : 'D' as const;
  });

  const wins = form.filter(r => r === 'W').length;
  const ovr = Math.min(95, Math.max(60, 75 + (wins * 3) - (form.filter(r => r === 'L').length * 2)));
  const country = countries[(club?.id ?? 'X').charCodeAt(0) % countries.length] ?? '🏴';

  // Historical record against player's club
  const headToHead = continentalFixtures.filter(
    f => f.played && ((f.homeClubId === playerClubId && f.awayClubId === opponentClubId) || (f.awayClubId === playerClubId && f.homeClubId === opponentClubId))
  );
  const h2hWins = headToHead.filter(f => {
    const isHome = f.homeClubId === playerClubId;
    const myG = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
    const oppG = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
    return myG > oppG;
  }).length;
  const h2hDraws = headToHead.filter(f => {
    const isHome = f.homeClubId === playerClubId;
    const myG = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
    const oppG = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
    return myG === oppG;
  }).length;
  const h2hLosses = headToHead.length - h2hWins - h2hDraws;

  return (
    <div className="bg-[#21262d] rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1c2333] flex items-center justify-center text-lg">{club?.logo ?? '⚽'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[#c9d1d9]">{club?.name ?? '???'}</span>
            <span className="text-sm">{country}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-[#8b949e]"><span className="text-[#c9d1d9] font-semibold">OVR</span> {ovr}</span>
            <span className="text-[10px] text-[#8b949e]"><span className="text-[#c9d1d9] font-semibold">Key:</span> {club?.shortName ?? 'Player'}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] text-[#484f58]">Form:</span>
            {form.length > 0 ? (
              <FormDots form={form} />
            ) : (
              <span className="text-[9px] text-[#484f58]">No data</span>
            )}
          </div>
        </div>
      </div>

      {/* Historical record */}
      <div className="border-t border-[#30363d] pt-2">
        <p className="text-[10px] text-[#8b949e] font-semibold mb-1.5">Head-to-Head Record</p>
        {headToHead.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-emerald-400 text-[7px] font-bold text-[#0d1117] flex items-center justify-center">{h2hWins}</span>
              <span className="text-[9px] text-emerald-400">{h2hWins}W</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-amber-400 text-[7px] font-bold text-[#0d1117] flex items-center justify-center">{h2hDraws}</span>
              <span className="text-[9px] text-amber-400">{h2hDraws}D</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-red-400 text-[7px] font-bold text-[#0d1117] flex items-center justify-center">{h2hLosses}</span>
              <span className="text-[9px] text-red-400">{h2hLosses}L</span>
            </div>
            <span className="text-[9px] text-[#484f58]">({headToHead.length} matches)</span>
          </div>
        ) : (
          <p className="text-[9px] text-[#484f58]">No previous meetings in this competition.</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// NEW: Continental History Panel
// ============================================================
function ContinentalHistoryPanel({
  currentClub,
  currentSeason,
}: {
  currentClub: { id: string; name: string; shortName: string; logo: string };
  currentSeason: number;
}) {
  // Deterministic past campaigns
  const campaigns = useMemo(() => {
    const compNames = ['Champions League', 'Europa League', 'Conference League'];
    const finishes = ['Winner', 'Runner-up', 'Semi-Final', 'Quarter-Final', 'Group Stage', 'R16'];
    const seasons = Math.min(currentSeason - 1, 5);
    const result: Array<{ season: number; competition: string; finish: string }> = [];

    for (let i = 0; i < seasons; i++) {
      const s = currentSeason - 1 - i;
      const seedVal = (currentClub.id.charCodeAt(0) * 7 + s * 13) % 100;
      const compIdx = seedVal % 3;
      const finishIdx = Math.min(finishes.length - 1, Math.floor(seedVal / 25));
      result.push({ season: s, competition: compNames[compIdx], finish: finishes[finishIdx] });
    }
    return result;
  }, [currentClub.id, currentSeason]);

  if (campaigns.length === 0) {
    return (
      <p className="text-xs text-[#484f58] text-center py-3">No previous continental campaigns.</p>
    );
  }

  const finishColors: Record<string, string> = {
    'Winner': 'text-amber-400',
    'Runner-up': 'text-sky-400',
    'Semi-Final': 'text-purple-400',
    'Quarter-Final': 'text-emerald-400',
    'Group Stage': 'text-[#8b949e]',
    'R16': 'text-[#c9d1d9]',
  };
  const finishEmojis: Record<string, string> = {
    'Winner': '🏆',
    'Runner-up': '🥈',
    'Semi-Final': '🥉',
    'Quarter-Final': '⭐',
    'Group Stage': '📋',
    'R16': '📅',
  };

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {campaigns.map(c => (
        <div key={`${c.season}-${c.competition}`} className="flex items-center gap-3 p-2 rounded-lg bg-[#21262d]">
          <div className="w-8 h-8 rounded-lg bg-[#1c2333] flex items-center justify-center text-xs shrink-0">
            {c.competition === 'Champions League' ? '🇪🇺' : c.competition === 'Europa League' ? '🟠' : '🔵'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#8b949e]">S{c.season}</span>
              <span className="text-[10px] text-[#c9d1d9] font-medium truncate">{c.competition}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs">{finishEmojis[c.finish]}</span>
            <span className={`text-[10px] font-semibold ${finishColors[c.finish] ?? 'text-[#8b949e]'}`}>{c.finish}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// NEW: European Journey Overview
// ============================================================
function EuropeanJourneyOverview({
  fixtures,
  playerClubId,
  currentClub,
  currentSeason,
  continentalCompetition,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
  currentClub: { id: string; name: string; shortName: string; logo: string };
  currentSeason: number;
  continentalCompetition: ContinentalCompetition;
}) {
  const opponentTrips = useMemo(() => {
    const cities = ['Madrid', 'Munich', 'Milan', 'Paris', 'London', 'Lisbon', 'Amsterdam', 'Barcelona', 'Turin', 'Rome'];
    const seen = new Set<string>();
    const result: Array<{ clubId: string; name: string; logo: string; city: string; distance: number }> = [];

    for (const f of fixtures) {
      const oppId = f.homeClubId === playerClubId ? f.awayClubId : f.homeClubId;
      if (oppId === playerClubId || seen.has(oppId)) continue;
      seen.add(oppId);

      const club = getClubById(oppId);
      const seed = ((oppId.charCodeAt(0) * 17) + (oppId.charCodeAt(Math.max(0, oppId.length - 1)) * 7)) % cities.length;
      const distance = 500 + ((oppId.charCodeAt(0) * 41 + oppId.charCodeAt(Math.min(1, oppId.length - 1)) * 23) % 2000);

      result.push({
        clubId: oppId,
        name: club?.shortName ?? '???',
        logo: club?.logo ?? '⚽',
        city: cities[seed],
        distance,
      });
    }
    return result.slice(0, 6);
  }, [fixtures, playerClubId]);

  const journeyStats = useMemo(() => {
    const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId));
    let goalsFor = 0;
    let goalsAgainst = 0;
    let cleanSheets = 0;

    for (const f of played) {
      const isHome = f.homeClubId === playerClubId;
      goalsFor += isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      goalsAgainst += isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
      if ((isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)) === 0) cleanSheets++;
    }

    const totalDist = opponentTrips.reduce((s, o) => s + o.distance, 0);
    const avgRating = played.length > 0
      ? Math.round((6.2 + (goalsFor / Math.max(1, played.length)) * 0.4 - (goalsAgainst / Math.max(1, played.length)) * 0.15) * 10) / 10
      : 0;

    return { goalsFor, goalsAgainst, appearances: played.length, cleanSheets, totalDist, avgRating };
  }, [fixtures, playerClubId, opponentTrips]);

  const pedigreeStars = useMemo(() => {
    return ((currentClub.id.charCodeAt(0) * 3 + currentSeason) % 5) + 1;
  }, [currentClub.id, currentSeason]);

  const compLabel = continentalCompetition === 'champions_league' ? 'Champions League' : 'Europa League';

  const playerGroup = useMemo(() => {
    return fixtures.find(f => f.homeClubId === playerClubId || f.awayClubId === playerClubId)?.group ?? null;
  }, [fixtures, playerClubId]);

  const mapNodes = useMemo(() => {
    const cx = 120;
    const cy = 85;
    const oppNodes = opponentTrips.map((o, i) => {
      const angle = (i / Math.max(opponentTrips.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const r = 60;
      return { ...o, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    });
    return { cx, cy, oppNodes };
  }, [opponentTrips]);

  return (
    <div className="space-y-3">
      {/* Competition Banner */}
      <div className="bg-[#21262d] rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-amber-500/15 shrink-0">
            <Globe className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#c9d1d9]">{compLabel}</h3>
            <p className="text-[10px] text-[#8b949e]">
              Season {currentSeason}{playerGroup ? ` · Group ${playerGroup}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-0.5" title={`Pedigree: ${pedigreeStars}/5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < pedigreeStars ? 'text-amber-400' : 'text-[#30363d]'}`} />
            ))}
          </div>
        </div>

        {/* SVG Map Visualization */}
        <div className="bg-[#0d1117] rounded-lg p-2 mb-3">
          <svg viewBox="0 0 240 170" className="w-full" style={{ minWidth: 200 }}>
            <ellipse cx="120" cy="85" rx="105" ry="72" fill="none" stroke="#21262d" strokeWidth="1" strokeDasharray="6 3" />
            {mapNodes.oppNodes.map((o) => (
              <g key={o.clubId}>
                <line x1={mapNodes.cx} y1={mapNodes.cy} x2={o.x} y2={o.y} stroke="#30363d" strokeWidth="0.8" strokeDasharray="3 2" />
                <rect x={(mapNodes.cx + o.x) / 2 - 14} y={(mapNodes.cy + o.y) / 2 - 5} width="28" height="10" rx="3" fill="#161b22" />
                <text x={(mapNodes.cx + o.x) / 2} y={(mapNodes.cy + o.y) / 2 + 2} textAnchor="middle" fill="#484f58" fontSize="5.5">{o.distance}km</text>
              </g>
            ))}
            <circle cx={mapNodes.cx} cy={mapNodes.cy} r="14" fill="#34d399" opacity="0.15" />
            <circle cx={mapNodes.cx} cy={mapNodes.cy} r="8" fill="#161b22" stroke="#34d399" strokeWidth="1.2" />
            <text x={mapNodes.cx} y={mapNodes.cy + 3} textAnchor="middle" fontSize="8">{currentClub.logo}</text>
            <text x={mapNodes.cx} y={mapNodes.cy - 18} textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="600">HOME</text>
            {mapNodes.oppNodes.map((o) => (
              <g key={`node-${o.clubId}`}>
                <circle cx={o.x} cy={o.y} r="10" fill="#161b22" stroke="#30363d" strokeWidth="0.8" />
                <text x={o.x} y={o.y + 3} textAnchor="middle" fontSize="8">{o.logo}</text>
                <text x={o.x} y={o.y - 14} textAnchor="middle" fill="#8b949e" fontSize="6" fontWeight="500">{o.city}</text>
              </g>
            ))}
          </svg>
        </div>

        {/* Total Distance */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <Plane className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] text-[#8b949e]">Total Away Distance:</span>
          <span className="text-xs font-bold text-[#c9d1d9]">{journeyStats.totalDist.toLocaleString()} km</span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-1.5">
          {([
            { label: 'Goals', value: journeyStats.goalsFor, color: 'text-emerald-400' },
            { label: 'Assists', value: 0, color: 'text-amber-400' },
            { label: 'Apps', value: journeyStats.appearances, color: 'text-[#c9d1d9]' },
            { label: 'Clean Sht', value: journeyStats.cleanSheets, color: 'text-sky-400' },
            { label: 'Avg Rtg', value: journeyStats.avgRating > 0 ? journeyStats.avgRating.toFixed(1) : '-', color: 'text-purple-400' },
          ] as Array<{ label: string; value: string | number; color: string }>).map((s) => (
            <div key={s.label} className="bg-[#161b22] rounded-lg p-2 text-center">
              <span className={`text-sm font-bold block ${s.color}`}>{s.value}</span>
              <span className="text-[8px] text-[#484f58] leading-tight">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Pedigree Badge */}
        <div className="mt-3 bg-[#161b22] rounded-lg p-2.5 flex items-center gap-2.5">
          <Award className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#c9d1d9] font-semibold">European Pedigree</p>
            <p className="text-[9px] text-[#484f58]">
              {pedigreeStars >= 4 ? 'Elite European Club' : pedigreeStars >= 3 ? 'Established Side' : pedigreeStars >= 2 ? 'Growing Presence' : 'Building Experience'}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < pedigreeStars ? 'text-amber-400' : 'text-[#30363d]'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NEW: Group Stage Analytics
// ============================================================
function GroupStageAnalytics({
  fixtures,
  standings,
  group,
  playerClubId,
}: {
  fixtures: ContinentalFixture[];
  standings: ContinentalGroupStanding[];
  group: string;
  playerClubId: string;
}) {
  const sorted = useMemo(() => sortGroupStandings(standings), [standings]);

  const playerStanding = useMemo(
    () => sorted.find(s => s.clubId === playerClubId),
    [sorted, playerClubId]
  );

  // Points per matchday (cumulative)
  const pointsProgression = useMemo(() => {
    const groupFixtures = fixtures
      .filter(f => f.group === group && f.played)
      .sort((a, b) => a.matchday - b.matchday);

    const cumPoints: number[] = [0];
    for (const f of groupFixtures) {
      const isHome = f.homeClubId === playerClubId;
      const gf = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      const ga = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
      let pts = 0;
      if (gf > ga) pts = 3;
      else if (gf === ga) pts = 1;
      cumPoints.push(cumPoints[cumPoints.length - 1] + pts);
    }
    return cumPoints;
  }, [fixtures, group, playerClubId]);

  // GD per matchday (cumulative)
  const gdProgression = useMemo(() => {
    const groupFixtures = fixtures
      .filter(f => f.group === group && f.played)
      .sort((a, b) => a.matchday - b.matchday);

    const cumGD: number[] = [0];
    for (const f of groupFixtures) {
      const isHome = f.homeClubId === playerClubId;
      const gd = (isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)) - (isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0));
      cumGD.push(cumGD[cumGD.length - 1] + gd);
    }
    return cumGD;
  }, [fixtures, group, playerClubId]);

  // Home vs Away split
  const homeAwaySplit = useMemo(() => {
    const homeFixtures = fixtures.filter(f => f.group === group && f.played && f.homeClubId === playerClubId);
    const awayFixtures = fixtures.filter(f => f.group === group && f.played && f.awayClubId === playerClubId);

    const calc = (fixs: ContinentalFixture[], isHome: boolean) => {
      let w = 0, d = 0, l = 0, gf = 0, ga = 0;
      for (const f of fixs) {
        const myG = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
        const oppG = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
        gf += myG; ga += oppG;
        if (myG > oppG) w++; else if (myG === oppG) d++; else l++;
      }
      return { w, d, l, gf, ga, pts: w * 3 + d };
    };

    return {
      home: calc(homeFixtures, true),
      away: calc(awayFixtures, false),
    };
  }, [fixtures, group, playerClubId]);

  // Group difficulty rating
  const groupDifficulty = useMemo(() => {
    if (sorted.length === 0) return { rating: 0, label: 'Unknown', color: '#8b949e' };
    const avgPoints = sorted.reduce((s, t) => s + t.points, 0) / sorted.length;
    const avgPlayed = sorted.reduce((s, t) => s + t.played, 0) / sorted.length;
    const pointsPerGame = avgPlayed > 0 ? avgPoints / avgPlayed : 0;

    if (pointsPerGame >= 2.0) return { rating: 5, label: 'Very Hard', color: '#ef4444' };
    if (pointsPerGame >= 1.7) return { rating: 4, label: 'Hard', color: '#f59e0b' };
    if (pointsPerGame >= 1.4) return { rating: 3, label: 'Medium', color: '#8b949e' };
    if (pointsPerGame >= 1.0) return { rating: 2, label: 'Easy', color: '#34d399' };
    return { rating: 1, label: 'Very Easy', color: '#3b82f6' };
  }, [sorted]);

  // Group Stage Verdict
  const verdict = useMemo(() => {
    if (!playerStanding || playerStanding.played === 0) return { text: 'Pending', color: 'text-[#8b949e]' };
    const playerRank = sorted.indexOf(playerStanding);
    const expectedRank = Math.min(sorted.length - 1, Math.floor(sorted.length / 2));
    const pointsPerGame = playerStanding.played > 0 ? playerStanding.points / playerStanding.played : 0;

    if (playerRank < expectedRank && pointsPerGame >= 2.0) return { text: 'Overperformed', color: 'text-emerald-400' };
    if (playerRank <= expectedRank + 1) return { text: 'As Expected', color: 'text-amber-400' };
    return { text: 'Underperformed', color: 'text-red-400' };
  }, [sorted, playerStanding]);

  // SVG chart helper
  const renderLineChart = (data: number[], color: string, maxVal: number, chartH: number) => {
    if (data.length < 2) return null;
    const w = 220;
    const padX = 20;
    const padY = 10;
    const stepX = (w - padX * 2) / Math.max(data.length - 1, 1);

    const points = data.map((v, i) => {
      const x = padX + i * stepX;
      const y = padY + chartH - (v / Math.max(maxVal, 1)) * (chartH - padY);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${w} ${chartH + padY * 2}`} className="w-full" style={{ minWidth: 180 }}>
        {/* Zero line */}
        <line x1={padX} y1={padY + chartH / 2} x2={w - padX} y2={padY + chartH / 2} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3 2" />
        {/* Data line */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Data dots */}
        {data.map((v, i) => {
          const x = padX + i * stepX;
          const y = padY + chartH - (v / Math.max(maxVal, 1)) * (chartH - padY);
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
        })}
        {/* Matchday labels */}
        {data.map((_, i) => {
          const x = padX + i * stepX;
          return <text key={`lbl-${i}`} x={x} y={chartH + padY * 2 - 2} textAnchor="middle" fill="#484f58" fontSize="6">MD{i}</text>;
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-3">
      {/* Difficulty & Verdict */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#21262d] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Flame className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-[10px] text-[#8b949e] font-semibold">Group Difficulty</span>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-sm"
                style={{ backgroundColor: i < groupDifficulty.rating ? groupDifficulty.color : '#30363d' }}
              />
            ))}
          </div>
          <p className="text-xs font-semibold mt-1" style={{ color: groupDifficulty.color }}>{groupDifficulty.label}</p>
        </div>
        <div className="bg-[#21262d] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-[10px] text-[#8b949e] font-semibold">Verdict</span>
          </div>
          <p className={`text-lg font-bold ${verdict.color}`}>{verdict.text}</p>
          {playerStanding && (
            <p className="text-[9px] text-[#484f58] mt-0.5">
              {playerStanding.points} pts from {playerStanding.played} games
            </p>
          )}
        </div>
      </div>

      {/* Points Progression Chart */}
      <div className="bg-[#21262d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[10px] text-[#8b949e] font-semibold">Points Progression</span>
        </div>
        {renderLineChart(pointsProgression, '#34d399', Math.max(...pointsProgression, 3), 50) ?? (
          <p className="text-[10px] text-[#484f58] text-center py-2">Play matches to see progression</p>
        )}
      </div>

      {/* GD Trend Chart */}
      <div className="bg-[#21262d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] text-[#8b949e] font-semibold">Goal Difference Trend</span>
        </div>
        {renderLineChart(gdProgression, '#f59e0b', Math.max(Math.abs(Math.max(...gdProgression)), Math.abs(Math.min(...gdProgression)), 1), 50) ?? (
          <p className="text-[10px] text-[#484f58] text-center py-2">Play matches to see trend</p>
        )}
      </div>

      {/* Home vs Away Split */}
      <div className="bg-[#21262d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Shield className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-[10px] text-[#8b949e] font-semibold">Home vs Away Split</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Home', data: homeAwaySplit.home, color: 'text-emerald-400', border: 'border-emerald-500/20' },
            { label: 'Away', data: homeAwaySplit.away, color: 'text-amber-400', border: 'border-amber-500/20' },
          ].map((side) => (
            <div key={side.label} className={`bg-[#161b22] border ${side.border} rounded-lg p-2.5`}>
              <p className={`text-[10px] font-semibold ${side.color} mb-1.5`}>{side.label}</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#484f58]">W/D/L</span>
                <span className="text-xs font-semibold text-[#c9d1d9]">
                  {side.data.w}/{side.data.d}/{side.data.l}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[#484f58]">GF/GA</span>
                <span className="text-xs font-semibold text-[#c9d1d9]">
                  {side.data.gf}/{side.data.ga}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#484f58]">Pts</span>
                <span className={`text-xs font-bold ${side.color}`}>{side.data.pts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NEW: Knockout Stage Tracker
// ============================================================
function KnockoutStageTracker({
  knockoutFixtures,
  playerClubId,
  eliminated,
}: {
  knockoutFixtures: ContinentalFixture[];
  playerClubId: string;
  eliminated: boolean;
}) {
  const playerFixtures = useMemo(() => {
    return knockoutFixtures
      .filter(f => f.homeClubId === playerClubId || f.awayClubId === playerClubId)
      .sort((a, b) => {
        const stageOrder: Record<string, number> = { round_of_16: 1, quarter_final: 2, semi_final: 3, final: 4 };
        return (stageOrder[a.stage] ?? 0) - (stageOrder[b.stage] ?? 0);
      });
  }, [knockoutFixtures, playerClubId]);

  const eliminationFixture = useMemo(() => {
    if (!eliminated || playerFixtures.length === 0) return null;
    const lastPlayed = [...playerFixtures].reverse().find(f => f.played);
    if (!lastPlayed) return null;
    const isHome = lastPlayed.homeClubId === playerClubId;
    const myG = isHome ? (lastPlayed.homeScore ?? 0) : (lastPlayed.awayScore ?? 0);
    const oppG = isHome ? (lastPlayed.awayScore ?? 0) : (lastPlayed.homeScore ?? 0);
    if (myG >= oppG) return null; // Didn't lose last match, eliminated differently
    return lastPlayed;
  }, [eliminated, playerFixtures]);

  const stages: Array<{ key: string; label: string; icon: React.ReactNode; color: string }> = [
    { key: 'round_of_16', label: 'Round of 16', icon: <Swords className="h-3.5 w-3.5" />, color: 'text-[#8b949e]' },
    { key: 'quarter_final', label: 'Quarter-Final', icon: <Swords className="h-3.5 w-3.5" />, color: 'text-sky-400' },
    { key: 'semi_final', label: 'Semi-Final', icon: <Trophy className="h-3.5 w-3.5" />, color: 'text-purple-400' },
    { key: 'final', label: 'Final', icon: <Crown className="h-3.5 w-3.5" />, color: 'text-amber-400' },
  ];

  if (playerFixtures.length === 0 && knockoutFixtures.length === 0) return null;

  const reachedFinal = playerFixtures.some(f => f.stage === 'final' && f.played);

  return (
    <div className="space-y-3">
      {/* Visual Bracket SVG */}
      <div className="bg-[#21262d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-3">
          <Route className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[10px] text-[#8b949e] font-semibold">Route to the Final</span>
        </div>
        <svg viewBox="0 0 260 160" className="w-full" style={{ minWidth: 220 }}>
          {/* Round columns */}
          {stages.map((stage, colIdx) => {
            const x = 10 + colIdx * 65;
            const fix = playerFixtures.find(f => f.stage === stage.key);
            const isPlayed = fix?.played ?? false;
            const isElimRound = eliminationFixture?.stage === stage.key;

            return (
              <g key={stage.key}>
                {/* Round header */}
                <rect x={x} y={2} width={58} height={14} rx="4" fill={fix ? (isElimRound ? '#ef4444' : '#21262d') : '#161b22'} stroke={fix ? (isElimRound ? '#ef4444' : '#34d399') : '#30363d'} strokeWidth="0.6" />
                <text x={x + 29} y={11} textAnchor="middle" fill={fix ? (isElimRound ? '#ef4444' : '#34d399') : '#484f58'} fontSize="6" fontWeight="600">{stage.label}</text>

                {fix ? (
                  <g>
                    {/* Match box */}
                    <rect x={x} y={22} width={58} height={52} rx="4" fill={isElimRound ? '#ef444420' : '#161b22'} stroke={isElimRound ? '#ef4444' : '#34d399'} strokeWidth="0.8" />
                    {/* Home team */}
                    <text x={x + 4} y={36} fill={fix.homeClubId === playerClubId ? '#34d399' : '#c9d1d9'} fontSize="6" fontWeight="600">
                      {getClubById(fix.homeClubId)?.shortName ?? '???'}
                    </text>
                    <text x={x + 54} y={36} textAnchor="end" fill="#8b949e" fontSize="6">
                      {isPlayed ? String(fix.homeScore ?? 0) : '-'}
                    </text>
                    {/* Away team */}
                    <text x={x + 4} y={50} fill={fix.awayClubId === playerClubId ? '#34d399' : '#c9d1d9'} fontSize="6" fontWeight="600">
                      {getClubById(fix.awayClubId)?.shortName ?? '???'}
                    </text>
                    <text x={x + 54} y={50} textAnchor="end" fill="#8b949e" fontSize="6">
                      {isPlayed ? String(fix.awayScore ?? 0) : '-'}
                    </text>
                    {/* Agg / Status */}
                    {isPlayed ? (
                      <text x={x + 29} y={68} textAnchor="middle" fill="#484f58" fontSize="5.5">
                        {(() => {
                          const isHomeP = fix.homeClubId === playerClubId;
                          const pG = isHomeP ? (fix.homeScore ?? 0) : (fix.awayScore ?? 0);
                          const oG = isHomeP ? (fix.awayScore ?? 0) : (fix.homeScore ?? 0);
                          return pG > oG ? 'Won' : pG < oG ? 'Lost' : 'Draw';
                        })()}
                      </text>
                    ) : (
                      <text x={x + 29} y={68} textAnchor="middle" fill="#8b949e" fontSize="5.5">Upcoming</text>
                    )}
                  </g>
                ) : (
                  <g>
                    <rect x={x} y={22} width={58} height={52} rx="4" fill="#161b22" stroke="#30363d" strokeWidth="0.6" strokeDasharray="3 2" />
                    <text x={x + 29} y={50} textAnchor="middle" fill="#30363d" fontSize="7">TBD</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Connector lines between rounds */}
          {stages.slice(0, -1).map((stage, i) => {
            const x1 = 10 + i * 65 + 58;
            const x2 = 10 + (i + 1) * 65;
            const hasFix1 = playerFixtures.some(f => f.stage === stage.key);
            const hasFix2 = playerFixtures.some(f => f.stage === stages[i + 1].key);
            if (!hasFix1 || !hasFix2) return null;
            return (
              <g key={`conn-${stage.key}`}>
                <line x1={x1} y1={48} x2={x2} y2={48} stroke="#34d399" strokeWidth="0.8" opacity="0.5" />
                <polygon points={`${x2 - 4},45 ${x2},48 ${x2 - 4},51`} fill="#34d399" opacity="0.5" />
              </g>
            );
          })}

          {/* Trophy marker at end */}
          {reachedFinal && (
            <g>
              <text x={250} y={52} textAnchor="middle" fontSize="18">🏆</text>
            </g>
          )}
        </svg>
      </div>

      {/* Match-by-match detail */}
      {playerFixtures.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <Swords className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-[10px] text-[#8b949e] font-semibold">Knockout Match Details</span>
          </div>
          {playerFixtures.map((fix) => {
            const oppId = fix.homeClubId === playerClubId ? fix.awayClubId : fix.homeClubId;
            const oppClub = getClubById(oppId);
            const isHome = fix.homeClubId === playerClubId;
            const myG = isHome ? (fix.homeScore ?? 0) : (fix.awayScore ?? 0);
            const oppG = isHome ? (fix.awayScore ?? 0) : (fix.homeScore ?? 0);
            const isElim = eliminationFixture?.id === fix.id;

            return (
              <div
                key={fix.id}
                className={`bg-[#21262d] rounded-lg p-2.5 border ${isElim ? 'border-red-500/30' : 'border-[#30363d]'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                    fix.stage === 'final' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                    fix.stage === 'semi_final' ? 'bg-purple-500/15 text-purple-400 border-purple-500/20' :
                    'bg-[#161b22] text-[#8b949e] border-[#30363d]'
                  }`}>
                    {getStageName(fix.stage)}
                  </Badge>
                  <span className="text-[9px] text-[#484f58]">{isHome ? 'Home' : 'Away'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{oppClub?.logo ?? '⚽'}</span>
                    <span className="text-xs font-semibold text-[#c9d1d9]">{oppClub?.shortName ?? '???'}</span>
                  </div>
                  {fix.played ? (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${myG > oppG ? 'text-emerald-400' : myG < oppG ? 'text-red-400' : 'text-amber-400'}`}>
                        {myG} - {oppG}
                      </span>
                      <span className="text-[9px] text-[#484f58]">(Agg)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#8b949e]">vs</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Elimination indicator */}
      {eliminated && eliminationFixture && (
        <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-red-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-400">Road Ends Here</p>
              <p className="text-[10px] text-[#8b949e]">
                Eliminated in {getStageName(eliminationFixture.stage)} by {getClubById(
                  eliminationFixture.homeClubId === playerClubId ? eliminationFixture.awayClubId : eliminationFixture.homeClubId
                )?.shortName ?? 'Opponent'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Final victory indicator */}
      {reachedFinal && !eliminated && (
        <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs font-semibold text-amber-400">European Champions!</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// NEW: European Records & Milestones
// ============================================================
function EuropeanRecordsMilestones({
  fixtures,
  playerClubId,
  currentClub,
  currentSeason,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
  currentClub: { id: string; name: string; shortName: string; logo: string };
  currentSeason: number;
}) {
  const allTimeStats = useMemo(() => {
    // All-time across seasons (deterministic from current state + simulated history)
    const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId));
    let totalGoals = 0;
    let totalAssists = 0;
    let totalApps = played.length;

    for (const f of played) {
      const isHome = f.homeClubId === playerClubId;
      totalGoals += isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
    }

    // Add simulated historical stats
    const histSeed = (currentClub.id.charCodeAt(0) * 11 + currentSeason) % 10;
    const histApps = histSeed * 3;
    const histGoals = Math.floor(histSeed * 1.5);

    return {
      totalGoals: totalGoals + histGoals,
      totalAssists: totalAssists + Math.floor(histSeed * 0.8),
      totalApps: totalApps + histApps,
      trophies: histSeed >= 8 ? 1 : 0,
      cleanSheets: played.filter(f => {
        const isHome = f.homeClubId === playerClubId;
        return (isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)) === 0;
      }).length + Math.floor(histSeed * 0.4),
    };
  }, [fixtures, playerClubId, currentClub.id, currentSeason]);

  const milestones: Array<{ label: string; current: number; target: number; emoji: string }> = useMemo(() => {
    return [
      { label: 'First Appearance', current: Math.min(allTimeStats.totalApps, 1), target: 1, emoji: '🥇' },
      { label: '10 Appearances', current: allTimeStats.totalApps, target: 10, emoji: '📋' },
      { label: '50 Appearances', current: allTimeStats.totalApps, target: 50, emoji: '🏅' },
      { label: 'First Goal', current: Math.min(allTimeStats.totalGoals, 1), target: 1, emoji: '⚽' },
      { label: '10 Goals', current: allTimeStats.totalGoals, target: 10, emoji: '🎯' },
      { label: '25 Goals', current: allTimeStats.totalGoals, target: 25, emoji: '🏆' },
    ];
  }, [allTimeStats]);

  // Club greats comparison (deterministic)
  const clubGreats = useMemo(() => {
    const names = ['R. Legend', 'M. Great', 'S. Icon', 'A. Hero', 'T. Star'];
    return names.map((name, i) => {
      const seed = (currentClub.id.charCodeAt(0) * (i + 3) + i * 17) % 50;
      return {
        name,
        goals: 5 + seed,
        apps: 15 + seed * 2,
        isPlayer: false,
      };
    }).sort((a, b) => b.goals - a.goals).slice(0, 5);
  }, [currentClub.id]);

  const playerRank = useMemo(() => {
    let rank = 1;
    for (const g of clubGreats) {
      if (allTimeStats.totalGoals >= g.goals) break;
      rank++;
    }
    return rank;
  }, [clubGreats, allTimeStats.totalGoals]);

  return (
    <div className="space-y-3">
      {/* All-time Stats */}
      <div className="bg-[#21262d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-3">
          <BookOpen className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-[10px] text-[#8b949e] font-semibold">All-Time European Stats</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {([
            { label: 'Goals', value: allTimeStats.totalGoals, color: 'text-emerald-400' },
            { label: 'Assists', value: allTimeStats.totalAssists, color: 'text-amber-400' },
            { label: 'Apps', value: allTimeStats.totalApps, color: 'text-[#c9d1d9]' },
            { label: 'CS', value: allTimeStats.cleanSheets, color: 'text-sky-400' },
            { label: 'Trophies', value: allTimeStats.trophies, color: 'text-amber-400' },
          ] as Array<{ label: string; value: number; color: string }>).map((s) => (
            <div key={s.label} className="bg-[#161b22] rounded-lg p-2 text-center">
              <span className={`text-sm font-bold block ${s.color}`}>{s.value}</span>
              <span className="text-[8px] text-[#484f58] leading-tight">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-[#21262d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Medal className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] text-[#8b949e] font-semibold">European Milestones</span>
        </div>
        <div className="space-y-2.5">
          {milestones.map((m) => {
            const pct = Math.min(100, (m.current / m.target) * 100);
            const achieved = m.current >= m.target;
            return (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{m.emoji}</span>
                    <span className={`text-[10px] font-medium ${achieved ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                      {m.label}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#484f58]">
                    {m.current}/{m.target}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#161b22] rounded-sm overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-sm"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: achieved ? '#34d399' : '#f59e0b',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Club Greats Comparison */}
      <div className="bg-[#21262d] rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Trophy className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] text-[#8b949e] font-semibold">Club European Greats</span>
          <span className="text-[9px] text-[#484f58] ml-auto">Your rank: #{playerRank}</span>
        </div>
        <div className="space-y-1">
          {clubGreats.map((g, i) => (
            <div
              key={g.name}
              className="flex items-center gap-2 py-1 px-2 rounded text-xs"
              style={{ backgroundColor: i === playerRank - 1 ? 'rgba(52, 211, 153, 0.08)' : 'transparent' }}
            >
              <span className={`w-4 text-center font-bold ${i < 3 ? 'text-amber-400' : 'text-[#484f58]'}`}>{i + 1}</span>
              <span className={`flex-1 font-medium ${i === playerRank - 1 ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                {g.name}
              </span>
              <span className="text-[#8b949e] text-[10px]">{g.goals}G</span>
              <span className="text-[#484f58] text-[10px]">{g.apps}A</span>
            </div>
          ))}
          {/* Player's row */}
          <div className="flex items-center gap-2 py-1 px-2 rounded text-xs bg-emerald-500/10 border border-emerald-500/20 mt-1">
            <span className="w-4 text-center font-bold text-emerald-400">#{playerRank}</span>
            <span className="flex-1 font-semibold text-emerald-400">You ({currentClub.shortName})</span>
            <span className="text-emerald-400 text-[10px]">{allTimeStats.totalGoals}G</span>
            <span className="text-emerald-400/60 text-[10px]">{allTimeStats.totalApps}A</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NEW: Match Day Experience
// ============================================================
function MatchDayExperience({
  nextMatch,
  playerClubId,
  currentWeek,
}: {
  nextMatch: ContinentalFixture;
  playerClubId: string;
  currentWeek: number;
}) {
  const isHome = nextMatch.homeClubId === playerClubId;
  const opponentClub = getClubById(isHome ? nextMatch.awayClubId : nextMatch.homeClubId);

  const matchDayData = useMemo(() => {
    // Deterministic atmosphere, channel, commentator
    const seed = (nextMatch.id.charCodeAt(0) * 7 + nextMatch.matchday * 13) % 100;
    const atmosphereLevel = 2 + (seed % 4); // 2-5

    const channels = ['Sky Sports', 'BT Sport', 'Canal+', 'DAZN', 'Paramount+'];
    const commentators = ['Martin Tyler', 'Peter Drury', 'Darren Fletcher', 'Jim Beglin', 'Robbie Savage'];
    const channel = channels[seed % channels.length];
    const commentator = commentators[seed % commentators.length];

    const isEvening = nextMatch.matchday % 2 === 0;
    const kickoff = isEvening ? '20:00' : '21:00';

    const hypeTexts = [
      'A massive European night awaits under the floodlights.',
      'The atmosphere is electric ahead of this continental clash.',
      'European football returns with a blockbuster encounter.',
      'All eyes are on this heavyweight European contest.',
      'A night of high drama under the lights.',
    ];
    const hype = hypeTexts[seed % hypeTexts.length];

    return { atmosphereLevel, channel, commentator, isEvening, kickoff, hype };
  }, [nextMatch.id, nextMatch.matchday]);

  return (
    <div className="bg-[#21262d] rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <Moon className="h-3.5 w-3.5 text-purple-400" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wide">Match Day Experience</span>
      </div>

      {/* Stadium SVG Placeholder */}
      <div className="bg-[#0d1117] rounded-lg p-2">
        <svg viewBox="0 0 240 100" className="w-full" style={{ minWidth: 200 }}>
          {/* Sky */}
          <rect width="240" height="50" rx="4" fill="#0d1117" />
          {/* Stars for evening match */}
          {matchDayData.isEvening && (
            <>
              <circle cx="30" cy="15" r="1" fill="#f59e0b" opacity="0.6" />
              <circle cx="80" cy="10" r="0.8" fill="#f59e0b" opacity="0.4" />
              <circle cx="150" cy="18" r="1.2" fill="#f59e0b" opacity="0.5" />
              <circle cx="200" cy="8" r="0.7" fill="#f59e0b" opacity="0.3" />
              <circle cx="120" cy="6" r="1" fill="#f59e0b" opacity="0.5" />
            </>
          )}
          {/* Stadium outline */}
          <path d="M 20 50 L 40 30 L 80 25 L 160 25 L 200 30 L 220 50 L 220 70 L 20 70 Z" fill="#161b22" stroke="#30363d" strokeWidth="0.8" />
          {/* Pitch */}
          <rect x="50" y="45" width="140" height="20" rx="2" fill="#1a472a" opacity="0.6" />
          <line x1="120" y1="45" x2="120" y2="65" stroke="#2d6a3f" strokeWidth="0.5" />
          <circle cx="120" cy="55" r="4" fill="none" stroke="#2d6a3f" strokeWidth="0.5" />
          {/* Stands */}
          <rect x="25" y="50" width="20" height="15" rx="2" fill="#21262d" />
          <rect x="195" y="50" width="20" height="15" rx="2" fill="#21262d" />
          <rect x="50" y="50" width="140" height="3" rx="1" fill="#21262d" />
          {/* Floodlights */}
          <rect x="15" y="20" width="3" height="15" rx="1" fill="#30363d" />
          <rect x="222" y="20" width="3" height="15" rx="1" fill="#30363d" />
          <circle cx="16.5" cy="19" r="2.5" fill="#f59e0b" opacity="0.15" />
          <circle cx="223.5" cy="19" r="2.5" fill="#f59e0b" opacity="0.15" />
          {/* Crowd dots */}
          {Array.from({ length: 12 }).map((_, i) => (
            <circle key={i} cx={30 + i * 15 + (i % 3) * 3} cy={54} r="1" fill="#34d399" opacity="0.3" />
          ))}
          {/* Label */}
          <text x="120" y="88" textAnchor="middle" fill="#484f58" fontSize="6" fontWeight="500">
            {isHome ? getClubById(playerClubId)?.shortName ?? 'Home' : opponentClub?.shortName ?? 'Away'} Stadium
          </text>
        </svg>
      </div>

      {/* Atmosphere Level */}
      <div className="bg-[#161b22] rounded-lg p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#8b949e] font-semibold">Atmosphere Level</span>
          <span className="text-[10px] font-bold text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < matchDayData.atmosphereLevel ? 'text-amber-400' : 'text-[#30363d]'}>★</span>
            ))}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-sm"
              style={{ backgroundColor: i < matchDayData.atmosphereLevel ? '#f59e0b' : '#30363d' }}
            />
          ))}
        </div>
        <p className="text-[9px] text-[#484f58] mt-1">
          {matchDayData.atmosphereLevel >= 4 ? 'Roaring crowd expected' :
           matchDayData.atmosphereLevel >= 3 ? 'Good atmosphere anticipated' :
           'Moderate crowd expected'}
        </p>
      </div>

      {/* Badges Row */}
      <div className="flex items-center gap-2">
        {matchDayData.isEvening && (
          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/20 text-[9px] px-2">
            <Moon className="h-3 w-3 mr-1" /> Under the Lights
          </Badge>
        )}
        <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/20 text-[9px] px-2">
          <Clock className="h-3 w-3 mr-1" /> {matchDayData.kickoff} Kick-off
        </Badge>
      </div>

      {/* TV Broadcast Info */}
      <div className="bg-[#161b22] rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Tv className="h-3 w-3 text-sky-400" />
          <span className="text-[10px] text-[#8b949e] font-semibold">Broadcast</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#c9d1d9]">{matchDayData.channel}</p>
            <p className="text-[9px] text-[#484f58]">Commentary: {matchDayData.commentator}</p>
          </div>
          <span className="text-[9px] text-[#484f58]">
            {nextMatch.stage === 'group' ? `MD ${nextMatch.matchday}` : getStageName(nextMatch.stage)}
          </span>
        </div>
      </div>

      {/* Pre-match Hype */}
      <div className="bg-[#161b22] rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Flame className="h-3 w-3 text-amber-400" />
          <span className="text-[10px] text-[#8b949e] font-semibold">Pre-Match Build-Up</span>
        </div>
        <p className="text-[11px] text-[#c9d1d9] italic leading-relaxed">{matchDayData.hype}</p>
        <p className="text-[9px] text-[#484f58] mt-1">
          {isHome
            ? `${getClubById(playerClubId)?.shortName ?? 'Home'} host ${opponentClub?.shortName ?? 'Opponent'}`
            : `${getClubById(playerClubId)?.shortName ?? 'Away'} travel to face ${opponentClub?.shortName ?? 'Opponent'}`}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// WEB3 "GRITTY FUTURISM" SVG VISUALIZATIONS
// ============================================================

// 1. EuropeanJourneyTimeline – Horizontal timeline with 8 nodes
function EuropeanJourneyTimeline({
  knockoutRound,
  eliminated,
}: {
  knockoutRound: number;
  eliminated: boolean;
}) {
  const milestones = [
    { label: 'Qualifiers', idx: 0 },
    { label: 'Group MD1', idx: 1 },
    { label: 'Group MD3', idx: 2 },
    { label: 'Group MD6', idx: 3 },
    { label: 'R16', idx: 4 },
    { label: 'QF', idx: 5 },
    { label: 'SF', idx: 6 },
    { label: 'Final', idx: 7 },
  ];
  const padX = 25;
  const padY = 60;
  const w = 250;
  const step = (w - padX * 2) / (milestones.length - 1);

  const reachedIdx = milestones.reduce((acc, m) => {
    if (eliminated && m.idx > knockoutRound) return acc;
    if (!eliminated && m.idx > knockoutRound) return acc;
    return m.idx <= knockoutRound ? m.idx : acc;
  }, 0);

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#FF5500', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        EUROPEAN JOURNEY TIMELINE
      </p>
      <svg viewBox="0 0 300 120" className="w-full">
        {/* Base line */}
        <line x1={padX} y1={padY} x2={padX + step * (milestones.length - 1)} y2={padY} stroke="#333" strokeWidth="2" />
        {/* Completed line */}
        <line x1={padX} y1={padY} x2={padX + step * reachedIdx} y2={padY} stroke="#FF5500" strokeWidth="2" />
        {milestones.map((m) => {
          const x = padX + m.idx * step;
          const isReached = m.idx <= reachedIdx;
          const isCurrent = m.idx === reachedIdx;
          return (
            <g key={m.label}>
              <circle key={`n-${m.idx}`} cx={x} cy={padY} r={isCurrent ? 6 : 4} fill={isReached ? '#CCFF00' : '#333'} stroke={isCurrent ? '#CCFF00' : '#555'} strokeWidth="1" />
              <text key={`l-${m.idx}`} x={x} y={padY + 18} textAnchor="middle" fill={isReached ? '#c9d1d9' : '#666'} fontSize="7" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{m.label}</text>
              {isCurrent && <text key={`a-${m.idx}`} x={x} y={padY - 14} textAnchor="middle" fill="#CCFF00" fontSize="7" fontWeight="600">HERE</text>}
            </g>
          );
        })}
        <text x={150} y={20} textAnchor="middle" fill="#888" fontSize="8" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>Continental Campaign Progression</text>
      </svg>
    </div>
  );
}

// 2. GroupStagePositionRadar – 5-axis radar (no transforms)
function GroupStagePositionRadar({
  fixtures,
  playerClubId,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
}) {
  const axes = ['Attack', 'Defense', 'Midfield', 'Discipline', 'Consistency'];
  const cx = 150;
  const cy = 105;
  const maxR = 70;
  const n = axes.length;

  const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId));
  const values = played.reduce(
    (acc, f) => {
      const isHome = f.homeClubId === playerClubId;
      const gf = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      const ga = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
      acc[0] += gf;       // Attack
      acc[1] += (ga === 0 ? 20 : 0); // Defense
      acc[2] += gf + ga;   // Midfield
      acc[3] += 10;        // Discipline (base)
      acc[4] += (gf > ga ? 20 : gf === ga ? 10 : 0); // Consistency
      return acc;
    },
    [0, 0, 0, 0, 0]
  );
  const maxVals = values.map(v => Math.min(100, v));
  const normVals = maxVals.map(v => (v / 100) * maxR);

  const axisPoints = axes.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + Math.cos(angle) * maxR, y: cy + Math.sin(angle) * maxR };
  });
  const valuePoints = normVals.map((r, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#00E5FF', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        GROUP STAGE RADAR
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((pct, ri) => {
          const ringPts = axes.map((_, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            return { x: cx + Math.cos(angle) * maxR * pct, y: cy + Math.sin(angle) * maxR * pct };
          });
          const d = ringPts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ') + 'Z';
          return <path key={`ring-${ri}`} d={d} fill="none" stroke="#222" strokeWidth="0.5" />;
        })}
        {/* Axis lines */}
        {axisPoints.map((pt, i) => (
          <line key={`ax-${i}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#222" strokeWidth="0.5" />
        ))}
        {/* Data shape */}
        <path d={valuePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ') + 'Z'} fill="#00E5FF" fillOpacity="0.15" stroke="#00E5FF" strokeWidth="1.5" />
        {/* Data dots */}
        {valuePoints.map((pt, i) => (
          <circle key={`dot-${i}`} cx={pt.x} cy={pt.y} r="3" fill="#00E5FF" />
        ))}
        {/* Labels */}
        {axisPoints.map((pt, i) => {
          const lx = cx + (pt.x - cx) * 1.18;
          const ly = cy + (pt.y - cy) * 1.18;
          return <text key={`lbl-${i}`} x={lx} y={ly} textAnchor="middle" fill="#c9d1d9" fontSize="8" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{axes[i]}</text>;
        })}
      </svg>
    </div>
  );
}

// 3. CoefficientProgressionLine – 8-point line chart
function CoefficientProgressionLine({
  currentClub,
  currentSeason,
}: {
  currentClub: { id: string };
  currentSeason: number;
}) {
  const seasons = Array.from({ length: 8 }, (_, i) => currentSeason - 7 + i);
  const data = seasons.reduce((acc, s) => {
    const seed = (currentClub.id.charCodeAt(0) * 11 + s * 7) % 100;
    acc.push(30 + seed * 0.7);
    return acc;
  }, [] as number[]);
  const maxVal = Math.max(...data, 1);
  const padX = 35;
  const padY = 20;
  const chartW = 230;
  const chartH = 130;
  const stepX = chartW / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => ({
    x: padX + i * stepX,
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#CCFF00', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        UEFA COEFFICIENT TRAJECTORY
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, gi) => {
          const y = padY + chartH - pct * chartH;
          return <line key={`g-${gi}`} x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="#1a1a1a" strokeWidth="0.5" />;
        })}
        {/* Line */}
        <polyline points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#CCFF00" />
        ))}
        {/* Season labels */}
        {seasons.map((s, i) => (
          <text key={`s-${i}`} x={padX + i * stepX} y={padY + chartH + 14} textAnchor="middle" fill="#666" fontSize="7" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{String(s).slice(2)}</text>
        ))}
        <text x={150} y={12} textAnchor="middle" fill="#888" fontSize="7" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>Seasons → Coefficient Points</text>
      </svg>
    </div>
  );
}

// 4. OpponentNationDonut – 5-segment donut via .reduce()
function OpponentNationDonut({
  fixtures,
  playerClubId,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
}) {
  const nations = ['Spain', 'Germany', 'Italy', 'France', 'England'];
  const opponents = fixtures.filter(f => f.homeClubId !== playerClubId && f.awayClubId !== playerClubId ? false : f.homeClubId !== playerClubId || f.awayClubId !== playerClubId);
  const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId));
  const segments = played.reduce(
    (acc, f) => {
      const oppId = f.homeClubId === playerClubId ? f.awayClubId : f.homeClubId;
      const nationIdx = (oppId.charCodeAt(0) * 3 + oppId.charCodeAt(Math.max(0, oppId.length - 1))) % nations.length;
      acc[nationIdx] = (acc[nationIdx] || 0) + 1;
      return acc;
    },
    [] as number[]
  );
  const total = segments.reduce((a, b) => a + b, 0) || 5;
  const filled = segments.map(s => s || 1);
  const cx = 100;
  const cy = 100;
  const outerR = 65;
  const innerR = 40;
  const colors = ['#FF5500', '#CCFF00', '#00E5FF', '#888888', '#666666'];

  const arcPaths = filled.reduce((acc, val, i) => {
    const startAngle = acc.cumAngle;
    const sweep = (val / filled.reduce((a, b) => a + b, 0)) * 2 * Math.PI;
    const endAngle = startAngle + sweep;
    const x1o = cx + Math.cos(startAngle) * outerR;
    const y1o = cy + Math.sin(startAngle) * outerR;
    const x2o = cx + Math.cos(endAngle) * outerR;
    const y2o = cy + Math.sin(endAngle) * outerR;
    const x1i = cx + Math.cos(endAngle) * innerR;
    const y1i = cy + Math.sin(endAngle) * innerR;
    const x2i = cx + Math.cos(startAngle) * innerR;
    const y2i = cy + Math.sin(startAngle) * innerR;
    const large = sweep > Math.PI ? 1 : 0;
    acc.paths.push(
      <path key={`arc-${i}`} d={`M${x1o},${y1o} A${outerR},${outerR} 0 ${large} 1 ${x2o},${y2o} L${x1i},${y1i} A${innerR},${innerR} 0 ${large} 0 ${x2i},${y2i} Z`} fill={colors[i]} opacity="0.8" />
    );
    const midAngle = startAngle + sweep / 2;
    const lx = cx + Math.cos(midAngle) * (outerR + 16);
    const ly = cy + Math.sin(midAngle) * (outerR + 16);
    acc.labels.push(
      <text key={`lbl-${i}`} x={lx} y={ly} textAnchor="middle" fill="#c9d1d9" fontSize="7" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{nations[i]}</text>
    );
    acc.cumAngle = endAngle;
    return acc;
  }, { paths: [] as React.ReactNode[], labels: [] as React.ReactNode[], cumAngle: -Math.PI / 2 });

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#FF5500', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        OPPONENT NATIONS DISTRIBUTION
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        {arcPaths.paths}
        {arcPaths.labels}
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#888" fontSize="8" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{total} matches</text>
      </svg>
    </div>
  );
}

// 5. ContinentalGoalsArea – 8-point area chart
function ContinentalGoalsArea({
  fixtures,
  playerClubId,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
}) {
  const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId)).slice(0, 8);
  const data = played.map(f => {
    const isHome = f.homeClubId === playerClubId;
    return isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
  });
  while (data.length < 3) data.push(0);
  const maxVal = Math.max(...data, 1);
  const padX = 30;
  const padY = 15;
  const chartW = 240;
  const chartH = 140;
  const stepX = chartW / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => ({
    x: padX + i * stepX,
    y: padY + chartH - (v / maxVal) * chartH,
  }));
  const areaD = `M${padX},${padY + chartH} ` + points.map((p, i) => `L${p.x},${p.y}`).join(' ') + ` L${padX + (data.length - 1) * stepX},${padY + chartH} Z`;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#00E5FF', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        GOALS PER CONTINENTAL MATCH
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((pct, gi) => {
          const y = padY + chartH - pct * chartH;
          return <line key={`g-${gi}`} x1={padX} y1={y} x2={padX + chartW} y2={y} stroke="#1a1a1a" strokeWidth="0.5" />;
        })}
        <path d={areaD} fill="#00E5FF" fillOpacity="0.2" />
        <polyline points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#00E5FF" strokeWidth="1.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#00E5FF" />
        ))}
        {data.map((_, i) => (
          <text key={`md-${i}`} x={padX + i * stepX} y={padY + chartH + 14} textAnchor="middle" fill="#666" fontSize="7" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>M{i + 1}</text>
        ))}
      </svg>
    </div>
  );
}

// 6. AwayPerformanceBars – 5 horizontal bars
function AwayPerformanceBars({
  fixtures,
  playerClubId,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
}) {
  const awayPlayed = fixtures.filter(f => f.played && f.awayClubId === playerClubId);
  const stats = awayPlayed.reduce(
    (acc, f) => {
      const gf = f.awayScore ?? 0;
      const ga = f.homeScore ?? 0;
      if (gf > ga) acc[0]++;
      else if (gf === ga) acc[1]++;
      else acc[2]++;
      acc[3] += gf;
      acc[4] += ga;
      return acc;
    },
    [0, 0, 0, 0, 0] as number[]
  );
  const labels = ['Wins', 'Draws', 'Losses', 'Goals Scored', 'Goals Conceded'];
  const maxVal = Math.max(...stats, 1);
  const barH = 20;
  const gap = 8;
  const startX = 90;
  const maxBarW = 170;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#CCFF00', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        AWAY CONTINENTAL PERFORMANCE
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        {labels.map((label, i) => {
          const barW = Math.max(2, (stats[i] / maxVal) * maxBarW);
          const y = 15 + i * (barH + gap);
          return (
            <g key={label}>
              <text x={startX - 5} y={y + barH / 2 + 3} textAnchor="end" fill="#c9d1d9" fontSize="8" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{label}</text>
              <rect key={`bar-${i}`} x={startX} y={y} width={barW} height={barH} rx="2" fill="#CCFF00" opacity="0.8" />
              <text key={`val-${i}`} x={startX + barW + 5} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="8" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{stats[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 7. KnockoutStageAdvancementRing – Circular ring for KO advancement
function KnockoutStageAdvancementRing({
  knockoutRound,
  eliminated,
}: {
  knockoutRound: number;
  eliminated: boolean;
}) {
  const stages = 4;
  const reached = eliminated ? Math.min(knockoutRound, stages) : Math.min(knockoutRound, stages);
  const pct = (reached / stages) * 100;
  const cx = 150;
  const cy = 100;
  const r = 60;
  const strokeW = 14;
  const circumference = 2 * Math.PI * r;
  const filledLen = (pct / 100) * circumference;

  const stageLabels = ['R16', 'QF', 'SF', 'Final'];
  const stageAngles = stageLabels.map((_, i) => -Math.PI / 2 + (i / stages) * 2 * Math.PI);
  const stagePositions = stageAngles.map(a => ({
    x: cx + Math.cos(a) * (r + 22),
    y: cy + Math.sin(a) * (r + 22),
  }));

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#FF5500', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        KO ADVANCEMENT RATE
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222" strokeWidth={strokeW} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF5500" strokeWidth={strokeW} strokeDasharray={`${filledLen} ${circumference}`} strokeDashoffset="0" strokeLinecap="butt" />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="700" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{pct}%</text>
        {stagePositions.map((pos, i) => (
          <text key={`sl-${i}`} x={pos.x} y={pos.y + 3} textAnchor="middle" fill={i < reached ? '#FF5500' : '#666'} fontSize="8" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{stageLabels[i]}</text>
        ))}
        {stageAngles.map((a, i) => {
          const nx = cx + Math.cos(a) * (r - 24);
          const ny = cy + Math.sin(a) * (r - 24);
          return <circle key={`nd-${i}`} cx={nx} cy={ny} r="2" fill={i < reached ? '#FF5500' : '#333'} />;
        })}
      </svg>
    </div>
  );
}

// 8. CompetitionExperienceGauge – Semi-circular gauge 0-100
function CompetitionExperienceGauge({
  fixtures,
  playerClubId,
  currentSeason,
  currentClub,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
  currentSeason: number;
  currentClub: { id: string };
}) {
  const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId));
  const baseExp = played.reduce((acc, f) => {
    const isHome = f.homeClubId === playerClubId;
    const gf = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
    const ga = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
    return acc + (gf > ga ? 12 : gf === ga ? 6 : 3);
  }, 0);
  const histBonus = ((currentClub.id.charCodeAt(0) * 3 + currentSeason) % 8) * 5;
  const score = Math.min(100, baseExp + histBonus);
  const cx = 150;
  const cy = 140;
  const r = 80;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const scoreAngle = startAngle + (score / 100) * Math.PI;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#00E5FF', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        CONTINENTAL EXPERIENCE LEVEL
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        {/* Background arc */}
        <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="#222" strokeWidth="14" strokeLinecap="butt" />
        {/* Score arc */}
        {score > 0 && (
          <path d={`M${cx - r},${cy} A${r},${r} 0 ${score > 50 ? 1 : 0} 1 ${cx + Math.cos(scoreAngle) * r},${cy + Math.sin(scoreAngle) * r}`} fill="none" stroke="#00E5FF" strokeWidth="14" strokeLinecap="butt" />
        )}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#c9d1d9" fontSize="24" fontWeight="700" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{score}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#888" fontSize="9" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>/ 100</text>
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((val) => {
          const a = startAngle + (val / 100) * Math.PI;
          const ix = cx + Math.cos(a) * (r - 10);
          const iy = cy + Math.sin(a) * (r - 10);
          const ox = cx + Math.cos(a) * (r + 2);
          const oy = cy + Math.sin(a) * (r + 2);
          return (
            <g key={`tick-${val}`}>
              <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="#555" strokeWidth="1.5" />
              <text x={cx + Math.cos(a) * (r + 14)} y={cy + Math.sin(a) * (r + 14) + 3} textAnchor="middle" fill="#666" fontSize="7" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{val}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 9. HistoricalPerformanceRadar – 5-axis radar (historical)
function HistoricalPerformanceRadar({
  fixtures,
  playerClubId,
  currentSeason,
  currentClub,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
  currentSeason: number;
  currentClub: { id: string };
}) {
  const axes = ['Best Run', 'Group Perf', 'KO Record', 'Away Record', 'Goal Record'];
  const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId));
  const histSeed = (currentClub.id.charCodeAt(0) * 7 + currentSeason) % 20;

  const values = played.reduce(
    (acc, f) => {
      const isHome = f.homeClubId === playerClubId;
      const gf = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      const ga = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
      acc[0] += (gf > ga ? 15 : 5); // Best Run
      acc[1] += (gf >= 2 ? 10 : 5);  // Group Perf
      acc[2] += (gf > ga ? 12 : 4);  // KO Record
      if (!isHome) acc[3] += (gf > ga ? 15 : 5); // Away Record
      acc[4] += gf * 3;              // Goal Record
      return acc;
    },
    [histSeed, histSeed, histSeed, 0, histSeed] as number[]
  );

  const cx = 150;
  const cy = 105;
  const maxR = 70;
  const n = axes.length;
  const maxVals = values.map(v => Math.min(100, v));
  const normVals = maxVals.map(v => (v / 100) * maxR);

  const axisPoints = axes.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + Math.cos(angle) * maxR, y: cy + Math.sin(angle) * maxR };
  });
  const valuePoints = normVals.map((r, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#CCFF00', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        HISTORICAL PERFORMANCE RADAR
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        {[0.25, 0.5, 0.75, 1].map((pct, ri) => {
          const ringPts = axes.map((_, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            return { x: cx + Math.cos(angle) * maxR * pct, y: cy + Math.sin(angle) * maxR * pct };
          });
          const d = ringPts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ') + 'Z';
          return <path key={`ring-${ri}`} d={d} fill="none" stroke="#222" strokeWidth="0.5" />;
        })}
        {axisPoints.map((pt, i) => (
          <line key={`ax-${i}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#222" strokeWidth="0.5" />
        ))}
        <path d={valuePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ') + 'Z'} fill="#CCFF00" fillOpacity="0.15" stroke="#CCFF00" strokeWidth="1.5" />
        {valuePoints.map((pt, i) => (
          <circle key={`dot-${i}`} cx={pt.x} cy={pt.y} r="3" fill="#CCFF00" />
        ))}
        {axisPoints.map((pt, i) => {
          const lx = cx + (pt.x - cx) * 1.18;
          const ly = cy + (pt.y - cy) * 1.18;
          return <text key={`lbl-${i}`} x={lx} y={ly} textAnchor="middle" fill="#c9d1d9" fontSize="8" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{axes[i]}</text>;
        })}
      </svg>
    </div>
  );
}

// 10. ContinentalRevenueBars – 5 horizontal revenue bars
function ContinentalRevenueBars({
  fixtures,
  playerClubId,
  currentSeason,
  currentClub,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
  currentClub: { id: string };
  currentSeason: number;
}) {
  const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId));
  const baseSeed = (currentClub.id.charCodeAt(0) * 13 + currentSeason) % 40 + 10;
  const multiplier = played.length || 1;
  const revenueData = [
    { label: 'Prize Money', value: baseSeed * multiplier * 3 },
    { label: 'TV Rights', value: baseSeed * multiplier * 2 },
    { label: 'Gate Receipts', value: baseSeed * multiplier },
    { label: 'Merchandise', value: baseSeed * multiplier * 1.5 },
    { label: 'Sponsorship', value: baseSeed * multiplier * 2.5 },
  ];
  const maxVal = Math.max(...revenueData.map(d => d.value), 1);
  const barH = 18;
  const gap = 10;
  const startX = 95;
  const maxBarW = 165;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#FF5500', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        CONTINENTAL REVENUE BREAKDOWN
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        {revenueData.map((d, i) => {
          const barW = Math.max(2, (d.value / maxVal) * maxBarW);
          const y = 10 + i * (barH + gap);
          return (
            <g key={d.label}>
              <text x={startX - 5} y={y + barH / 2 + 3} textAnchor="end" fill="#c9d1d9" fontSize="8" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{d.label}</text>
              <rect key={`bar-${i}`} x={startX} y={y} width={barW} height={barH} rx="2" fill="#FF5500" opacity="0.8" />
              <text key={`val-${i}`} x={startX + barW + 5} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize="7" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{d.value}M</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 11. SeasonProgressDonut – 4-segment donut via .reduce()
function SeasonProgressDonut({
  fixtures,
  playerClubId,
  currentSeason,
  currentClub,
}: {
  fixtures: ContinentalFixture[];
  playerClubId: string;
  currentSeason: number;
  currentClub: { id: string };
}) {
  const played = fixtures.filter(f => f.played && (f.homeClubId === playerClubId || f.awayClubId === playerClubId));
  const seed = (currentClub.id.charCodeAt(0) * 5 + currentSeason * 3) % 30;
  const segments = [
    { label: 'Group Stage', value: seed + played.filter(f => f.stage === 'group').length * 8 },
    { label: 'KO Stage', value: Math.max(0, seed - 5 + played.filter(f => f.stage !== 'group').length * 10) },
    { label: 'Final', value: Math.max(0, Math.floor(seed / 6)) },
    { label: 'Did Not Qualify', value: Math.max(0, 5 - seed) + 2 },
  ];
  const total = segments.reduce((a, s) => a + s.value, 0) || 4;
  const cx = 100;
  const cy = 100;
  const outerR = 65;
  const innerR = 40;
  const colors = ['#00E5FF', '#CCFF00', '#FF5500', '#666666'];

  const arcResult = segments.reduce(
    (acc, seg, i) => {
      const startAngle = acc.cumAngle;
      const sweep = (seg.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sweep;
      const x1o = cx + Math.cos(startAngle) * outerR;
      const y1o = cy + Math.sin(startAngle) * outerR;
      const x2o = cx + Math.cos(endAngle) * outerR;
      const y2o = cy + Math.sin(endAngle) * outerR;
      const x1i = cx + Math.cos(endAngle) * innerR;
      const y1i = cy + Math.sin(endAngle) * innerR;
      const x2i = cx + Math.cos(startAngle) * innerR;
      const y2i = cy + Math.sin(startAngle) * innerR;
      const large = sweep > Math.PI ? 1 : 0;
      acc.paths.push(
        <path key={`arc-${i}`} d={`M${x1o},${y1o} A${outerR},${outerR} 0 ${large} 1 ${x2o},${y2o} L${x1i},${y1i} A${innerR},${innerR} 0 ${large} 0 ${x2i},${y2i} Z`} fill={colors[i]} opacity="0.8" />
      );
      const midAngle = startAngle + sweep / 2;
      const lx = cx + Math.cos(midAngle) * (outerR + 18);
      const ly = cy + Math.sin(midAngle) * (outerR + 18);
      acc.labels.push(
        <text key={`lbl-${i}`} x={lx} y={ly} textAnchor="middle" fill="#c9d1d9" fontSize="7" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{seg.label}</text>
      );
      acc.cumAngle = endAngle;
      return acc;
    },
    { paths: [] as React.ReactNode[], labels: [] as React.ReactNode[], cumAngle: -Math.PI / 2 }
  );

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#00E5FF', fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>
        SEASON PROGRESS DISTRIBUTION
      </p>
      <svg viewBox="0 0 300 200" className="w-full">
        {arcResult.paths}
        {arcResult.labels}
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#888" fontSize="8" style={{ fontFamily: "'Monaspace Neon','Space Grotesk',monospace" }}>{currentSeason}</text>
      </svg>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ContinentalPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // All hooks must be before early returns
  const continentalFixtures = gameState?.continentalFixtures ?? [];
  const continentalGroupStandings =
    gameState?.continentalGroupStandings ?? [];
  const continentalQualified = gameState?.continentalQualified ?? false;
  const continentalCompetition =
    gameState?.continentalCompetition ?? null;
  const continentalEliminated = gameState?.continentalEliminated ?? false;
  const continentalKnockoutRound =
    gameState?.continentalKnockoutRound ?? 0;
  const currentClub = gameState?.currentClub;
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const leagueTable = gameState?.leagueTable ?? [];
  const recentResults = gameState?.recentResults ?? [];

  const compName = continentalCompetition
    ? getContinentalName(continentalCompetition)
    : null;

  // Group fixtures by stage
  const groupFixtures = useMemo(
    () => continentalFixtures.filter((f) => f.stage === 'group'),
    [continentalFixtures]
  );

  const knockoutFixtures = useMemo(
    () => continentalFixtures.filter((f) => f.stage !== 'group'),
    [continentalFixtures]
  );

  // Group standings by group letter
  const groups = useMemo(() => {
    const groupMap: Record<string, ContinentalGroupStanding[]> = {};
    for (const s of continentalGroupStandings) {
      if (!groupMap[s.group]) groupMap[s.group] = [];
      groupMap[s.group].push(s);
    }
    return groupMap;
  }, [continentalGroupStandings]);

  // Player's group
  const playerGroup = useMemo(() => {
    if (!currentClub) return null;
    const standing = continentalGroupStandings.find(
      (s) => s.clubId === currentClub.id
    );
    return standing?.group ?? null;
  }, [continentalGroupStandings, currentClub]);

  // Next continental match
  const nextMatch = useMemo(() => {
    if (!continentalQualified || !continentalCompetition || !currentClub)
      return null;
    return continentalFixtures.find(
      (f) =>
        !f.played &&
        (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id)
    );
  }, [continentalFixtures, currentClub, continentalQualified, continentalCompetition]);

  // "Not Qualified" state data
  const sortedLeague = useMemo(
    () => sortLeagueTable(leagueTable),
    [leagueTable]
  );
  const playerLeaguePosition = useMemo(() => {
    if (!currentClub) return null;
    const idx = sortedLeague.findIndex(
      (s) => s.clubId === currentClub.id
    );
    return idx >= 0 ? idx + 1 : null;
  }, [sortedLeague, currentClub]);
  const playerLeagueStanding = useMemo(() => {
    if (!currentClub) return null;
    return (
      sortedLeague.find((s) => s.clubId === currentClub.id) ?? null
    );
  }, [sortedLeague, currentClub]);
  const fourthPlaceStanding = useMemo(() => {
    return sortedLeague.length >= 4 ? sortedLeague[3] : null;
  }, [sortedLeague]);
  const sixthPlaceStanding = useMemo(() => {
    return sortedLeague.length >= 6 ? sortedLeague[5] : null;
  }, [sortedLeague]);
  const pointsToCL = useMemo(() => {
    if (!playerLeagueStanding || !fourthPlaceStanding) return 0;
    return Math.max(0, fourthPlaceStanding.points - playerLeagueStanding.points);
  }, [playerLeagueStanding, fourthPlaceStanding]);
  const pointsToEL = useMemo(() => {
    if (!playerLeagueStanding || !sixthPlaceStanding) return 0;
    return Math.max(0, sixthPlaceStanding.points - playerLeagueStanding.points);
  }, [playerLeagueStanding, sixthPlaceStanding]);
  const motivationalTip = useMemo(() => {
    if (!playerLeaguePosition) return '';
    if (playerLeaguePosition <= 6) {
      if (playerLeaguePosition <= 4) {
        return 'Great position! Keep winning to secure your Champions League spot.';
      }
      return 'In the Europa League zone. A strong finish could push you into the top 4!';
    }
    if (playerLeaguePosition <= 10) {
      return 'Within touching distance. String together some wins to climb into European spots!';
    }
    return 'Focus on building momentum. Every game is a chance to climb the table.';
  }, [playerLeaguePosition]);

  if (!gameState || !currentClub) return null;

  // ============================================================
  // "Not Qualified" State (Enhanced)
  // ============================================================
  if (!continentalQualified || !continentalCompetition) {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="p-2 rounded-lg bg-[#21262d]">
            <Globe className="h-6 w-6 text-[#8b949e]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#c9d1d9]">
              Continental Competitions
            </h1>
            <p className="text-xs text-[#8b949e]">
              {currentClub.name} · Season {currentSeason}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg bg-[#161b22] border border-[#30363d] p-5 text-center"
        >
          <div className="p-3 rounded-lg bg-[#21262d] inline-block mb-4">
            <Globe className="h-12 w-12 text-[#30363d]" />
          </div>
          <h2 className="text-lg font-semibold text-[#c9d1d9] mb-2">
            Not Qualified
          </h2>
          <p className="text-sm text-[#8b949e] mb-4">
            Your club hasn&apos;t qualified for continental competition this
            season.
          </p>

          {/* Qualification Criteria */}
          <div className="bg-[#21262d] rounded-lg p-4 text-left space-y-2 mb-4">
            <p className="text-xs text-[#8b949e] font-semibold">
              Qualification Criteria:
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400">★</span>
              <span className="text-[#c9d1d9]">
                Top 4 → Champions League
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-orange-400">●</span>
              <span className="text-[#c9d1d9]">
                5th-6th → Europa League
              </span>
            </div>
          </div>

          {/* Mini League Table */}
          {sortedLeague.length > 0 && playerLeaguePosition && (
            <div className="bg-[#21262d] rounded-lg p-4 text-left mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#8b949e] font-semibold">
                  Current League Position
                </p>
                <span className="text-sm font-bold text-[#c9d1d9]">
                  #{playerLeaguePosition}
                </span>
              </div>

              {/* Show top 6 + player if outside top 6 */}
              <div className="space-y-1">
                {sortedLeague
                  .slice(0, 6)
                  .map((s, idx) => {
                    const isPlayer = s.clubId === currentClub.id;
                    const qualifies = idx < 4;
                    const isELZone = idx >= 4 && idx < 6;
                    return (
                      <div
                        key={s.clubId}
                        className={`flex items-center justify-between py-1 px-2 rounded text-xs ${
                          isPlayer
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1 h-5 rounded-full ${
                              qualifies
                                ? 'bg-emerald-400'
                                : isELZone
                                  ? 'bg-orange-400'
                                  : 'bg-[#30363d]'
                            }`}
                          />
                          <span
                            className={`w-4 text-center ${
                              isPlayer
                                ? 'text-emerald-400 font-bold'
                                : 'text-[#8b949e]'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span
                            className={`font-medium ${
                              isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'
                            }`}
                          >
                            {s.clubName}
                            {isPlayer && (
                              <span className="ml-1 text-[9px]">← You</span>
                            )}
                          </span>
                        </div>
                        <span
                          className={`font-bold ${
                            isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'
                          }`}
                        >
                          {s.points} pts
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Points to qualify */}
          {playerLeaguePosition && (
            <div className="bg-[#21262d] rounded-lg p-4 text-left mb-4">
              <p className="text-xs text-[#8b949e] font-semibold mb-2">
                Points to Qualify
              </p>
              <div className="flex gap-3">
                <div className="flex-1 bg-[#161b22] rounded-lg p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-lg font-bold text-emerald-400 block">
                    {pointsToCL}
                  </span>
                  <span className="text-[9px] text-[#8b949e]">
                    to Champions League
                  </span>
                </div>
                <div className="flex-1 bg-[#161b22] rounded-lg p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-orange-400 mx-auto mb-1" />
                  <span className="text-lg font-bold text-orange-400 block">
                    {pointsToEL}
                  </span>
                  <span className="text-[9px] text-[#8b949e]">
                    to Europa League
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Motivational Tip */}
          {motivationalTip && (
            <div className="bg-[#21262d] rounded-lg p-3 text-left">
              <div className="flex items-start gap-2">
                <Flame className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#8b949e] font-semibold mb-0.5">
                    Motivation
                  </p>
                  <p className="text-xs text-[#c9d1d9]">{motivationalTip}</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-[#484f58] mt-4">
            Finish higher in the league to qualify for European football!
          </p>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // Main Qualified View
  // ============================================================
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Header (Enhanced) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg bg-[#161b22] border border-[#30363d] p-4 mb-4"
      >
        <div className="flex items-center gap-3">
          {/* Competition logo badge */}
          <div className="p-2.5 rounded-lg bg-amber-500/15 shrink-0">
            <span className="text-2xl">{compName?.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#c9d1d9] truncate">
              {compName?.name}
            </h1>
            <p className="text-xs text-[#8b949e]">
              {currentClub.shortName} · Season {currentSeason} · Wk{' '}
              {currentWeek}
            </p>
          </div>
          {continentalEliminated ? (
            <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-xs shrink-0">
              Eliminated
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs shrink-0">
              {continentalKnockoutRound === 0
                ? 'Group Stage'
                : `Round ${continentalKnockoutRound}`}
            </Badge>
          )}
        </div>

        {/* Stage Progress Stepper */}
        <StageStepper
          currentRound={continentalKnockoutRound}
          eliminated={continentalEliminated}
        />

        {/* Next Match Preview */}
        {nextMatch && !continentalEliminated && (
          <div className="mt-3 bg-[#21262d] rounded-lg p-3">
            <span className="text-[10px] text-[#8b949e]">Next Match</span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <span>
                  {getClubById(nextMatch.homeClubId)?.logo}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    nextMatch.homeClubId === currentClub.id
                      ? 'text-emerald-400'
                      : 'text-[#c9d1d9]'
                  }`}
                >
                  {getClubById(nextMatch.homeClubId)?.shortName ?? '???'}
                </span>
              </div>
              <span className="text-xs text-[#8b949e]">vs</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    nextMatch.awayClubId === currentClub.id
                      ? 'text-emerald-400'
                      : 'text-[#c9d1d9]'
                  }`}
                >
                  {getClubById(nextMatch.awayClubId)?.shortName ?? '???'}
                </span>
                <span>
                  {getClubById(nextMatch.awayClubId)?.logo}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-[#8b949e] mt-1">
              {nextMatch.stage === 'group'
                ? `Matchday ${nextMatch.matchday}`
                : getStageName(nextMatch.stage)}
              {nextMatch.group ? ` · Group ${nextMatch.group}` : ''}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-4"
      >
        <TabsList className="bg-[#161b22] border border-[#30363d] w-full">
          <TabsTrigger
            value="overview"
            className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
          >
            Groups
          </TabsTrigger>
          <TabsTrigger
            value="knockout"
            className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
          >
            Knockout
          </TabsTrigger>
          <TabsTrigger
            value="journey"
            className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
          >
            Journey
          </TabsTrigger>
          <TabsTrigger
            value="records"
            className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
          >
            Records
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* Overview Tab (Enhanced) */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {/* Competition status */}
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">
                Competition Status
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-[#c9d1d9]">
                    {continentalKnockoutRound === 0
                      ? 'GS'
                      : `R${continentalKnockoutRound}`}
                  </span>
                  <span className="block text-[10px] text-[#8b949e] mt-0.5">
                    Stage
                  </span>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-[#c9d1d9]">
                    {
                      continentalFixtures.filter(
                        (f) =>
                          f.played &&
                          (f.homeClubId === currentClub.id ||
                            f.awayClubId === currentClub.id)
                      ).length
                    }
                  </span>
                  <span className="block text-[10px] text-[#8b949e] mt-0.5">
                    Matches Played
                  </span>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-emerald-400">
                    {
                      continentalFixtures.filter(
                        (f) =>
                          f.played &&
                          (f.homeClubId === currentClub.id ||
                            f.awayClubId === currentClub.id) &&
                          ((f.homeClubId === currentClub.id &&
                            (f.homeScore ?? 0) > (f.awayScore ?? 0)) ||
                            (f.awayClubId === currentClub.id &&
                              (f.awayScore ?? 0) > (f.homeScore ?? 0)))
                      ).length
                    }
                  </span>
                  <span className="block text-[10px] text-[#8b949e] mt-0.5">
                    Wins
                  </span>
                </div>
                <div className="bg-[#21262d] rounded-lg p-3 text-center">
                  <span
                    className={`text-2xl font-bold ${
                      continentalEliminated ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {continentalEliminated ? '✗' : '✓'}
                  </span>
                  <span className="block text-[10px] text-[#8b949e] mt-0.5">
                    Status
                  </span>
                </div>
              </div>
            </div>

            {/* Mini Stats Dashboard (Enhanced) */}
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">
                Team Stats
              </h3>
              <StatsDashboard
                fixtures={continentalFixtures}
                playerClubId={currentClub.id}
              />
            </div>

            {/* Top Performers (Enhanced) */}
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">
                Your Continental Stats
              </h3>
              <TopPerformers
                recentResults={recentResults}
                continentalCompetition={continentalCompetition}
              />
            </div>

            {/* Next Match Timeline (Enhanced) */}
            {nextMatch && (
              <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3">
                  Next Match
                </h3>
                <NextMatchTimeline
                  nextMatch={nextMatch}
                  currentWeek={currentWeek}
                  playerClubId={currentClub.id}
                />
              </div>
            )}

            {/* Match Day Experience */}
            {nextMatch && (
              <MatchDayExperience
                nextMatch={nextMatch}
                playerClubId={currentClub.id}
                currentWeek={currentWeek}
              />
            )}

            {/* Player's group standing */}
            {playerGroup && groups[playerGroup] && (
              <GroupTable
                standings={groups[playerGroup]}
                group={playerGroup}
                playerClubId={currentClub.id}
                fixtures={continentalFixtures}
              />
            )}

            {/* Competition Tree (SVG) */}
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-400" /> Tournament Path
              </h3>
              <CompetitionTreeSVG
                fixtures={continentalFixtures}
                playerClubId={currentClub.id}
                knockoutRound={continentalKnockoutRound}
                eliminated={continentalEliminated}
              />
            </div>

            {/* Competition Stats (3-column) */}
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-emerald-400" /> Competition Stats
              </h3>
              <CompetitionStatsGrid
                fixtures={continentalFixtures}
                playerClubId={currentClub.id}
              />
            </div>

            {/* Opponent Scout Cards */}
            {nextMatch && (
              <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
                <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
                  <Swords className="h-4 w-4 text-sky-400" /> Opponent Scout
                </h3>
                <OpponentScoutCards
                  nextMatch={nextMatch}
                  continentalFixtures={continentalFixtures}
                  playerClubId={currentClub.id}
                />
              </div>
            )}

            {/* Continental History */}
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
                <History className="h-4 w-4 text-purple-400" /> Continental History
              </h3>
              <ContinentalHistoryPanel
                currentClub={currentClub}
                currentSeason={currentSeason}
              />
            </div>

            {/* Web3 SVG: European Journey Timeline */}
            <EuropeanJourneyTimeline knockoutRound={continentalKnockoutRound} eliminated={continentalEliminated} />

            {/* Web3 SVG: Competition Experience Gauge */}
            <CompetitionExperienceGauge fixtures={continentalFixtures} playerClubId={currentClub.id} currentSeason={currentSeason} currentClub={currentClub} />

            {/* Web3 SVG: Continental Revenue Bars */}
            <ContinentalRevenueBars fixtures={continentalFixtures} playerClubId={currentClub.id} currentSeason={currentSeason} currentClub={currentClub} />

            {/* Match schedule */}
            <div className="rounded-lg bg-[#161b22] border border-[#30363d] p-4">
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">
                Match Schedule
              </h3>
              <div className="text-xs text-[#8b949e] space-y-1">
                {CONTINENTAL_GROUP_MATCH_WEEKS.map((w, i) => (
                  <div
                    key={w}
                    className="flex items-center justify-between"
                  >
                    <span>Matchday {i + 1}</span>
                    <span
                      className={
                        w === currentWeek
                          ? 'text-emerald-400 font-semibold'
                          : w < currentWeek
                            ? 'text-[#484f58]'
                            : ''
                      }
                    >
                      Week {w}
                      {w === currentWeek ? ' ← Now' : ''}
                    </span>
                  </div>
                ))}
                <div className="border-t border-[#30363d] pt-1 mt-2">
                  <span className="text-[#8b949e] font-medium">
                    Knockout Stage
                  </span>
                </div>
                {CONTINENTAL_KO_MATCH_WEEKS.map((w, i) => {
                  const stages = [
                    'Round of 16',
                    'Quarter-Final',
                    'Semi-Final',
                    'Final',
                  ];
                  return (
                    <div
                      key={w}
                      className="flex items-center justify-between"
                    >
                      <span>{stages[i]}</span>
                      <span
                        className={
                          w === currentWeek
                            ? 'text-emerald-400 font-semibold'
                            : w < currentWeek
                              ? 'text-[#484f58]'
                              : ''
                        }
                      >
                        Week {w}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* Groups Tab (Enhanced) */}
        {/* ============================================================ */}
        {activeTab === 'groups' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {Object.keys(groups).length > 0 ? (
              <>
                {Object.entries(groups).map(([group, standings]) => (
                  <GroupTable
                    key={group}
                    standings={standings}
                    group={group}
                    playerClubId={currentClub.id}
                    fixtures={continentalFixtures}
                  />
                ))}
                {/* Group Stage Analytics for player's group */}
                {playerGroup && groups[playerGroup] && (
                  <GroupStageAnalytics
                    fixtures={continentalFixtures}
                    standings={groups[playerGroup]}
                    group={playerGroup}
                    playerClubId={currentClub.id}
                  />
                )}
                {/* Web3 SVG: Group Stage Position Radar */}
                <GroupStagePositionRadar fixtures={continentalFixtures} playerClubId={currentClub.id} />
                {/* Web3 SVG: Opponent Nation Donut */}
                <OpponentNationDonut fixtures={continentalFixtures} playerClubId={currentClub.id} />
                {/* Web3 SVG: Continental Goals Area */}
                <ContinentalGoalsArea fixtures={continentalFixtures} playerClubId={currentClub.id} />
              </>
            ) : (
              <div className="text-center py-8 text-[#8b949e] text-sm">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No group stage data available</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* Knockout Tab (Enhanced) */}
        {/* ============================================================ */}
        {activeTab === 'knockout' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {knockoutFixtures.length > 0 ? (
              <>
                <KnockoutBracketView
                  knockoutFixtures={knockoutFixtures}
                  playerClubId={currentClub.id}
                />
                {/* Knockout Stage Tracker */}
                <KnockoutStageTracker
                  knockoutFixtures={knockoutFixtures}
                  playerClubId={currentClub.id}
                  eliminated={continentalEliminated}
                />
                {/* Web3 SVG: Away Performance Bars */}
                <AwayPerformanceBars fixtures={continentalFixtures} playerClubId={currentClub.id} />
                {/* Web3 SVG: KO Advancement Ring */}
                <KnockoutStageAdvancementRing knockoutRound={continentalKnockoutRound} eliminated={continentalEliminated} />
                {/* Web3 SVG: Historical Performance Radar */}
                <HistoricalPerformanceRadar fixtures={continentalFixtures} playerClubId={currentClub.id} currentSeason={currentSeason} currentClub={currentClub} />
              </>
            ) : (
              <div className="text-center py-8 text-[#8b949e] text-sm">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No knockout stage yet</p>
                <p className="text-xs text-[#484f58] mt-1">
                  Qualify from the group stage first!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* Journey Tab (NEW) */}
        {/* ============================================================ */}
        {activeTab === 'journey' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <EuropeanJourneyOverview
              fixtures={continentalFixtures}
              playerClubId={currentClub.id}
              currentClub={currentClub}
              currentSeason={currentSeason}
              continentalCompetition={continentalCompetition}
            />
            {/* Web3 SVG: Coefficient Progression Line */}
            <CoefficientProgressionLine currentClub={currentClub} currentSeason={currentSeason} />
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* Records Tab (NEW) */}
        {/* ============================================================ */}
        {activeTab === 'records' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <EuropeanRecordsMilestones
              fixtures={continentalFixtures}
              playerClubId={currentClub.id}
              currentClub={currentClub}
              currentSeason={currentSeason}
            />
            {/* Web3 SVG: Season Progress Donut */}
            <SeasonProgressDonut fixtures={continentalFixtures} playerClubId={currentClub.id} currentSeason={currentSeason} currentClub={currentClub} />
          </motion.div>
        )}
      </Tabs>
    </div>
  );
}
