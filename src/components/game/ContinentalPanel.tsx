'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import {
  Globe, Trophy, Star,
  Swords, Crown, Flame,
  Target, Zap, TrendingUp, BarChart3, Clock,
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
          className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full ${colorMap[r]} text-[7px] font-bold text-[#0d1117]`}
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
                  className={`w-4 h-4 rounded-full ${dotColor}`}
                />
              ) : (
                <div className={`w-4 h-4 rounded-full ${dotColor}`} />
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
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Qualify
        </div>
        <div className="flex items-center gap-1 text-[9px] text-[#8b949e]">
          <span className="w-2 h-2 rounded-full bg-red-400" />
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

            {/* Player's group standing */}
            {playerGroup && groups[playerGroup] && (
              <GroupTable
                standings={groups[playerGroup]}
                group={playerGroup}
                playerClubId={currentClub.id}
                fixtures={continentalFixtures}
              />
            )}

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
              Object.entries(groups).map(([group, standings]) => (
                <GroupTable
                  key={group}
                  standings={standings}
                  group={group}
                  playerClubId={currentClub.id}
                  fixtures={continentalFixtures}
                />
              ))
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
              <KnockoutBracketView
                knockoutFixtures={knockoutFixtures}
                playerClubId={currentClub.id}
              />
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
      </Tabs>
    </div>
  );
}
