'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Trophy, Star, ChevronDown, ChevronUp, Shield,
  Swords, Crown, Flame, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ContinentalFixture,
  ContinentalCompetition,
  ContinentalGroupStanding,
} from '@/lib/game/types';
import {
  getContinentalName,
  getStageName,
  sortGroupStandings,
  CONTINENTAL_GROUP_MATCH_WEEKS,
  CONTINENTAL_KO_MATCH_WEEKS,
} from '@/lib/game/continentalEngine';
import { getClubById } from '@/lib/game/clubsData';

// --- Helper: Group standings table ---
function GroupTable({
  standings,
  group,
  playerClubId,
}: {
  standings: ContinentalGroupStanding[];
  group: string;
  playerClubId: string;
}) {
  const sorted = useMemo(() => sortGroupStandings(standings), [standings]);

  return (
    <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700/30 flex items-center gap-2">
        <span className="text-sm font-bold text-white">Group {group}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-400">
          {standings.length} teams
        </Badge>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 bg-slate-800/30">
            <th className="py-1.5 px-2 text-left">#</th>
            <th className="py-1.5 px-2 text-left">Team</th>
            <th className="py-1.5 px-2 text-center w-8">P</th>
            <th className="py-1.5 px-2 text-center w-8">W</th>
            <th className="py-1.5 px-2 text-center w-8">D</th>
            <th className="py-1.5 px-2 text-center w-8">L</th>
            <th className="py-1.5 px-2 text-center w-10">GD</th>
            <th className="py-1.5 px-2 text-center w-10 font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, idx) => {
            const isPlayer = team.clubId === playerClubId;
            const gd = team.goalsFor - team.goalsAgainst;
            const qualifies = idx < 2;
            return (
              <tr
                key={team.clubId}
                className={`border-t border-slate-700/20 ${
                  isPlayer ? 'bg-emerald-500/10' : 'hover:bg-slate-800/20'
                }`}
              >
                <td className={`py-1.5 px-2 ${qualifies ? 'text-emerald-400' : idx >= sorted.length - 1 ? 'text-red-400' : 'text-slate-500'}`}>
                  {idx + 1}
                </td>
                <td className={`py-1.5 px-2 font-medium ${isPlayer ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {team.clubName}
                  {qualifies && <span className="ml-1 text-[9px] text-emerald-500">⭐</span>}
                </td>
                <td className="py-1.5 px-2 text-center text-slate-400">{team.played}</td>
                <td className="py-1.5 px-2 text-center text-slate-400">{team.won}</td>
                <td className="py-1.5 px-2 text-center text-slate-400">{team.drawn}</td>
                <td className="py-1.5 px-2 text-center text-slate-400">{team.lost}</td>
                <td className={`py-1.5 px-2 text-center ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {gd > 0 ? '+' : ''}{gd}
                </td>
                <td className="py-1.5 px-2 text-center font-bold text-white">{team.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Helper: Knockout fixture card ---
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
  const involvesPlayer = fixture.homeClubId === playerClubId || fixture.awayClubId === playerClubId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`rounded-xl border backdrop-blur-sm overflow-hidden ${
        involvesPlayer
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : 'bg-slate-900/60 border-slate-800/40'
      }`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
            fixture.stage === 'final' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
            fixture.stage === 'semi_final' ? 'bg-purple-500/15 text-purple-400 border-purple-500/20' :
            'bg-slate-500/15 text-slate-400 border-slate-500/20'
          }`}>
            {getStageName(fixture.stage)}
          </Badge>
          {involvesPlayer && (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[10px]">
              Your Match
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-base">{homeClub?.logo ?? '⚽'}</span>
            <span className={`text-sm font-semibold ${fixture.homeClubId === playerClubId ? 'text-emerald-400' : 'text-slate-300'}`}>
              {homeClub?.shortName ?? '???'}
            </span>
          </div>
          <div className="px-3 text-center">
            {fixture.played ? (
              <span className="text-lg font-bold text-white">
                {fixture.homeScore} - {fixture.awayScore}
              </span>
            ) : (
              <span className="text-xs text-slate-500">vs</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className={`text-sm font-semibold ${fixture.awayClubId === playerClubId ? 'text-emerald-400' : 'text-slate-300'}`}>
              {awayClub?.shortName ?? '???'}
            </span>
            <span className="text-base">{awayClub?.logo ?? '⚽'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Component ---
export default function ContinentalPanel() {
  const gameState = useGameStore(s => s.gameState);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // All hooks must be before early returns
  const continentalFixtures = gameState?.continentalFixtures ?? [];
  const continentalGroupStandings = gameState?.continentalGroupStandings ?? [];
  const continentalQualified = gameState?.continentalQualified ?? false;
  const continentalCompetition = gameState?.continentalCompetition ?? null;
  const continentalEliminated = gameState?.continentalEliminated ?? false;
  const continentalKnockoutRound = gameState?.continentalKnockoutRound ?? 0;
  const currentClub = gameState?.currentClub;
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;

  const compName = continentalCompetition ? getContinentalName(continentalCompetition) : null;

  // Group fixtures by stage
  const groupFixtures = useMemo(() =>
    continentalFixtures.filter(f => f.stage === 'group'),
    [continentalFixtures]
  );

  const knockoutFixtures = useMemo(() =>
    continentalFixtures.filter(f => f.stage !== 'group'),
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
    const standing = continentalGroupStandings.find(s => s.clubId === currentClub.id);
    return standing?.group ?? null;
  }, [continentalGroupStandings, currentClub]);

  // Next continental match
  const nextMatch = useMemo(() => {
    if (!continentalQualified || !continentalCompetition || !currentClub) return null;
    return continentalFixtures.find(
      f => !f.played && (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id)
    );
  }, [continentalFixtures, currentClub, continentalQualified, continentalCompetition]);

  if (!gameState || !currentClub) return null;
  if (!continentalQualified || !continentalCompetition) {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="p-2 rounded-xl bg-slate-500/15">
            <Globe className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Continental Competitions</h1>
            <p className="text-xs text-slate-400">
              {currentClub.name} • Season {currentSeason}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-800/60 p-8 text-center"
        >
          <Globe className="h-16 w-16 mx-auto mb-4 text-slate-700" />
          <h2 className="text-lg font-semibold text-slate-300 mb-2">Not Qualified</h2>
          <p className="text-sm text-slate-500 mb-4">
            Your club hasn&apos;t qualified for continental competition this season.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs text-slate-400 font-semibold">Qualification Criteria:</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400">⭐</span>
              <span className="text-slate-300">Top 4 → Champions League</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-orange-400">🟠</span>
              <span className="text-slate-300">5th-6th → Europa League</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-4">
            Finish higher in the league to qualify for European football!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/30 border border-slate-800/60 p-4 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15">
            <Globe className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">
              {compName?.emoji} {compName?.name}
            </h1>
            <p className="text-xs text-slate-400">
              {currentClub.shortName} • Season {currentSeason} • Week {currentWeek}
            </p>
          </div>
          {continentalEliminated ? (
            <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-xs">
              Eliminated
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">
              {continentalKnockoutRound === 0 ? 'Group Stage' : `Round ${continentalKnockoutRound}`}
            </Badge>
          )}
        </div>

        {/* Next Match Preview */}
        {nextMatch && !continentalEliminated && (
          <div className="mt-3 bg-slate-800/40 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Next Match</span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <span>{getClubById(nextMatch.homeClubId)?.logo}</span>
                <span className={`text-sm font-semibold ${nextMatch.homeClubId === currentClub.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {getClubById(nextMatch.homeClubId)?.shortName ?? '???'}
                </span>
              </div>
              <span className="text-xs text-slate-500">vs</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${nextMatch.awayClubId === currentClub.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {getClubById(nextMatch.awayClubId)?.shortName ?? '???'}
                </span>
                <span>{getClubById(nextMatch.awayClubId)?.logo}</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {nextMatch.stage === 'group' ? `Matchday ${nextMatch.matchday}` : getStageName(nextMatch.stage)}
              {nextMatch.group ? ` • Group ${nextMatch.group}` : ''}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="bg-slate-900/80 border border-slate-800/60 w-full">
          <TabsTrigger value="overview" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Overview
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Groups
          </TabsTrigger>
          <TabsTrigger value="knockout" className="flex-1 text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Knockout
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Competition status */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800/60 p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Competition Status</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-white">
                    {continentalKnockoutRound === 0 ? 'GS' : `R${continentalKnockoutRound}`}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Stage</span>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-white">
                    {continentalFixtures.filter(f => f.played && (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id)).length}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Matches Played</span>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <span className="text-2xl font-bold text-emerald-400">
                    {continentalFixtures.filter(f =>
                      f.played && (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id) &&
                      ((f.homeClubId === currentClub.id && (f.homeScore ?? 0) > (f.awayScore ?? 0)) ||
                       (f.awayClubId === currentClub.id && (f.awayScore ?? 0) > (f.homeScore ?? 0)))
                    ).length}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Wins</span>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <span className={`text-2xl font-bold ${continentalEliminated ? 'text-red-400' : 'text-emerald-400'}`}>
                    {continentalEliminated ? '❌' : '✓'}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Status</span>
                </div>
              </div>
            </div>

            {/* Player's group standing */}
            {playerGroup && groups[playerGroup] && (
              <GroupTable
                standings={groups[playerGroup]}
                group={playerGroup}
                playerClubId={currentClub.id}
              />
            )}

            {/* Match schedule */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-800/60 p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Match Schedule</h3>
              <div className="text-xs text-slate-500 space-y-1">
                {CONTINENTAL_GROUP_MATCH_WEEKS.map((w, i) => (
                  <div key={w} className="flex items-center justify-between">
                    <span>Matchday {i + 1}</span>
                    <span className={w === currentWeek ? 'text-emerald-400 font-semibold' : w < currentWeek ? 'text-slate-600' : ''}>
                      Week {w}
                      {w === currentWeek ? ' ← Now' : ''}
                    </span>
                  </div>
                ))}
                <div className="border-t border-slate-800/50 pt-1 mt-2">
                  <span className="text-slate-400 font-medium">Knockout Stage</span>
                </div>
                {CONTINENTAL_KO_MATCH_WEEKS.map((w, i) => {
                  const stages = ['Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];
                  return (
                    <div key={w} className="flex items-center justify-between">
                      <span>{stages[i]}</span>
                      <span className={w === currentWeek ? 'text-emerald-400 font-semibold' : w < currentWeek ? 'text-slate-600' : ''}>
                        Week {w}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {Object.keys(groups).length > 0 ? (
              Object.entries(groups).map(([group, standings]) => (
                <GroupTable
                  key={group}
                  standings={standings}
                  group={group}
                  playerClubId={currentClub.id}
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No group stage data available</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Knockout Tab */}
        {activeTab === 'knockout' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {knockoutFixtures.length > 0 ? (
              <>
                {/* Group by stage */}
                {(['round_of_16', 'quarter_final', 'semi_final', 'final'] as const).map(stage => {
                  const stageFixtures = knockoutFixtures.filter(f => f.stage === stage);
                  if (stageFixtures.length === 0) return null;
                  return (
                    <div key={stage}>
                      <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                        {stage === 'final' ? <Crown className="h-4 w-4 text-amber-400" /> :
                         stage === 'semi_final' ? <Trophy className="h-4 w-4 text-purple-400" /> :
                         <Swords className="h-4 w-4 text-slate-400" />}
                        {getStageName(stage)}
                      </h3>
                      <div className="space-y-2">
                        {stageFixtures.map((fixture, i) => (
                          <KnockoutFixtureCard
                            key={fixture.id}
                            fixture={fixture}
                            playerClubId={currentClub.id}
                            index={i}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No knockout stage yet</p>
                <p className="text-xs text-slate-600 mt-1">Qualify from the group stage first!</p>
              </div>
            )}
          </motion.div>
        )}
      </Tabs>
    </div>
  );
}
