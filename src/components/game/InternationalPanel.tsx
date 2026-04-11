'use client';

import { useGameStore } from '@/store/gameStore';
import { InternationalFixture, InternationalMatchType } from '@/lib/game/types';
import { getPlayerNationInfo, getMatchTypeLabel, getInternationalBreakWeeks, isInternationalBreakWeek } from '@/lib/game/internationalEngine';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Flag,
  Trophy,
  TrendingUp,
  Calendar,
  Star,
  Target,
  Clock,
  AlertCircle,
  CheckCircle2,
  Shield,
  Swords,
  Globe,
} from 'lucide-react';
import { useMemo } from 'react';

// -----------------------------------------------------------
// Helper: color for match type
// -----------------------------------------------------------
function getMatchTypeColor(type: InternationalMatchType): string {
  const colors: Record<InternationalMatchType, string> = {
    friendly: 'text-[#8b949e]',
    qualifier: 'text-amber-400',
    tournament_group: 'text-emerald-400',
    tournament_knockout: 'text-cyan-400',
    tournament_final: 'text-yellow-400',
  };
  return colors[type] ?? 'text-[#8b949e]';
}

function getMatchTypeBg(type: InternationalMatchType): string {
  const bgs: Record<InternationalMatchType, string> = {
    friendly: 'bg-[#21262d]',
    qualifier: 'bg-amber-500/15',
    tournament_group: 'bg-emerald-500/15',
    tournament_knockout: 'bg-cyan-500/15',
    tournament_final: 'bg-yellow-500/15',
  };
  return bgs[type] ?? 'bg-[#21262d]';
}

// -----------------------------------------------------------
// Helper: rating color
// -----------------------------------------------------------
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'text-emerald-400';
  if (rating >= 7.0) return 'text-green-400';
  if (rating >= 6.0) return 'text-amber-400';
  return 'text-red-400';
}

// -----------------------------------------------------------
// Fixture card component
// -----------------------------------------------------------
function FixtureCard({ fixture, isPlayerNation }: { fixture: InternationalFixture; isPlayerNation: (n: string) => boolean }) {
  const playerSide = isPlayerNation(fixture.homeNation) ? 'home' : 'away';
  const playerWon = fixture.played
    ? (playerSide === 'home' ? (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0) : (fixture.awayScore ?? 0) > (fixture.homeScore ?? 0))
    : null;
  const isDraw = fixture.played && fixture.homeScore === fixture.awayScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border border-[#30363d] rounded-lg p-4 bg-[#161b22] ${
        fixture.playerCalledUp ? 'ring-1 ring-emerald-500/30' : ''
      }`}
    >
      {/* Match type badge + week */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className={`${getMatchTypeBg(fixture.matchType)} ${getMatchTypeColor(fixture.matchType)} border-0 text-xs`}>
          {getMatchTypeLabel(fixture.matchType)}
        </Badge>
        <span className="text-xs text-[#8b949e] flex items-center gap-1">
          <Clock className="h-3 w-3" />
          S{fixture.season} W{fixture.week}
        </span>
      </div>

      {/* Score line */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{fixture.homeFlag}</span>
          <span className={`text-sm font-medium ${isPlayerNation(fixture.homeNation) ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
            {fixture.homeNation}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3">
          {fixture.played ? (
            <span className="text-base font-bold text-[#c9d1d9]">
              {fixture.homeScore} - {fixture.awayScore}
            </span>
          ) : (
            <span className="text-xs text-[#8b949e]">vs</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className={`text-sm font-medium ${isPlayerNation(fixture.awayNation) ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
            {fixture.awayNation}
          </span>
          <span className="text-lg">{fixture.awayFlag}</span>
        </div>
      </div>

      {/* Player stats if called up and played */}
      {fixture.playerCalledUp && fixture.played && (
        <div className="mt-3 pt-3 border-t border-[#30363d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {fixture.playerStarted ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">Started</Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px]">Sub</Badge>
              )}
              <span className="text-xs text-[#8b949e]">{fixture.playerMinutes}&apos;</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {fixture.playerGoals !== undefined && fixture.playerGoals > 0 && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Target className="h-3 w-3" /> {fixture.playerGoals}
                </span>
              )}
              {fixture.playerAssists !== undefined && fixture.playerAssists > 0 && (
                <span className="flex items-center gap-1 text-cyan-400">
                  <TrendingUp className="h-3 w-3" /> {fixture.playerAssists}
                </span>
              )}
              {fixture.playerRating !== undefined && (
                <span className={`font-bold ${getRatingColor(fixture.playerRating)}`}>
                  {fixture.playerRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          {/* Result indicator */}
          {playerWon !== null && (
            <div className="mt-2">
              {playerWon ? (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Win
                </span>
              ) : isDraw ? (
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Draw
                </span>
              ) : (
                <span className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Loss
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Not called up indicator */}
      {!fixture.playerCalledUp && fixture.played && (
        <div className="mt-3 pt-3 border-t border-[#30363d]">
          <span className="text-[10px] text-[#8b949e]">Not called up for this match</span>
        </div>
      )}
    </motion.div>
  );
}

// -----------------------------------------------------------
// Main InternationalPanel component
// -----------------------------------------------------------
export default function InternationalPanel() {
  const gameState = useGameStore(state => state.gameState);

  const nationInfo = useMemo(() => {
    if (!gameState) return { name: '', flag: '🏳️' };
    return getPlayerNationInfo(gameState.player.nationality);
  }, [gameState]);

  const isPlayerNation = useMemo(() => {
    return (nation: string) => nation === nationInfo.name;
  }, [nationInfo.name]);

  const playedFixtures = useMemo(() => {
    if (!gameState) return [];
    return (gameState.internationalFixtures ?? []).filter(f => f.played);
  }, [gameState]);

  const upcomingFixtures = useMemo(() => {
    if (!gameState) return [];
    return (gameState.internationalFixtures ?? []).filter(f => !f.played);
  }, [gameState]);

  const callUpFixtures = useMemo(() => {
    if (!gameState) return [];
    return (gameState.internationalFixtures ?? []).filter(f => f.playerCalledUp);
  }, [gameState]);

  const nextBreakWeeks = useMemo(() => {
    if (!gameState) return [];
    const breakWeeks = getInternationalBreakWeeks(gameState.currentClub.league);
    return breakWeeks.filter(w => w > gameState.currentWeek);
  }, [gameState]);

  const canBeCalledUp = useMemo(() => {
    if (!gameState) return false;
    const p = gameState.player;
    return p.reputation >= 60 && p.form >= 5.5 && p.age >= 17 && p.age <= 36;
  }, [gameState]);

  if (!gameState) return null;

  const { player, currentWeek, currentClub } = gameState;
  const internationalCareer = gameState.internationalCareer ?? { caps: 0, goals: 0, assists: 0, averageRating: 0, tournaments: [], lastCallUpSeason: 0, lastCallUpWeek: 0 };
  const internationalCalledUp = gameState.internationalCalledUp ?? false;
  const internationalOnBreak = gameState.internationalOnBreak ?? false;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 bg-[#21262d] rounded-lg border border-[#30363d]">
          <Flag className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#c9d1d9]">International Duty</h1>
          <p className="text-xs text-[#8b949e]">National team call-ups and matches</p>
        </div>
      </motion.div>

      {/* National Team Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nationInfo.flag}</span>
            <div>
              <h2 className="text-base font-bold text-[#c9d1d9]">{nationInfo.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#8b949e]">{internationalCareer.caps} caps</span>
                {internationalCalledUp && (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1 animate-pulse" />
                    Called Up
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            {internationalOnBreak ? (
              <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px]">
                <Globe className="h-3 w-3 mr-1" />
                Break Week
              </Badge>
            ) : (
              <span className="text-[10px] text-[#8b949e]">No break this week</span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-[#c9d1d9]">{internationalCareer.caps}</div>
            <div className="text-[10px] text-[#8b949e]">Caps</div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-emerald-400">{internationalCareer.goals}</div>
            <div className="text-[10px] text-[#8b949e]">Goals</div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-cyan-400">{internationalCareer.assists}</div>
            <div className="text-[10px] text-[#8b949e]">Assists</div>
          </div>
        </div>
      </motion.div>

      {/* Call-up Requirements / Status */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
      >
        <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Swords className="h-4 w-4 text-[#8b949e]" />
          Call-up Eligibility
        </h3>
        <div className="space-y-2">
          {/* Reputation requirement */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Reputation (min 60)</span>
            <div className="flex items-center gap-2">
              <Progress value={Math.min(player.reputation, 100)} className="w-20 h-1.5" />
              <span className={`text-xs font-medium ${player.reputation >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>
                {player.reputation}
              </span>
            </div>
          </div>
          {/* Form requirement */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Form (min 5.5)</span>
            <div className="flex items-center gap-2">
              <Progress value={Math.min(player.form * 10, 100)} className="w-20 h-1.5" />
              <span className={`text-xs font-medium ${player.form >= 5.5 ? 'text-emerald-400' : 'text-red-400'}`}>
                {player.form.toFixed(1)}
              </span>
            </div>
          </div>
          {/* Age requirement */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Age (17-36)</span>
            <span className={`text-xs font-medium ${player.age >= 17 && player.age <= 36 ? 'text-emerald-400' : 'text-red-400'}`}>
              {player.age}
            </span>
          </div>
          {/* Injury status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Injury-free</span>
            <span className={`text-xs font-medium ${player.injuryWeeks === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {player.injuryWeeks === 0 ? 'Fit' : `Out ${player.injuryWeeks}w`}
            </span>
          </div>
        </div>
        {canBeCalledUp ? (
          <div className="mt-3 pt-3 border-t border-[#30363d] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">Eligible for national team selection</span>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-[#30363d] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-amber-400">Meet all requirements to be eligible</span>
          </div>
        )}
      </motion.div>

      {/* International Career Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
      >
        <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#8b949e]" />
          International Career
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] text-[#8b949e]">Avg Rating</span>
            </div>
            <span className={`text-lg font-bold ${internationalCareer.averageRating > 0 ? getRatingColor(internationalCareer.averageRating) : 'text-[#8b949e]'}`}>
              {internationalCareer.averageRating > 0 ? internationalCareer.averageRating.toFixed(1) : '—'}
            </span>
          </div>
          <div className="bg-[#21262d] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-3 w-3 text-cyan-400" />
              <span className="text-[10px] text-[#8b949e]">Last Call-up</span>
            </div>
            <span className="text-sm font-bold text-[#c9d1d9]">
              {internationalCareer.lastCallUpSeason > 0
                ? `S${internationalCareer.lastCallUpSeason} W${internationalCareer.lastCallUpWeek}`
                : 'Never'}
            </span>
          </div>
        </div>

        {/* Tournaments */}
        {internationalCareer.tournaments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#30363d]">
            <span className="text-[10px] text-[#8b949e] mb-2 block">Tournaments</span>
            <div className="flex flex-wrap gap-1.5">
              {internationalCareer.tournaments.map((t, i) => (
                <Badge key={i} className="bg-amber-500/15 text-amber-400 border-0 text-[10px]">
                  <Trophy className="h-3 w-3 mr-1" />
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Next International Break */}
      {nextBreakWeeks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
        >
          <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#8b949e]" />
            Next International Break
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b949e]">Week {nextBreakWeeks[0]}</span>
            <span className="text-[10px] text-[#8b949e]">
              (in {nextBreakWeeks[0] - currentWeek} weeks)
            </span>
          </div>
        </motion.div>
      )}

      {/* Fixtures Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="w-full bg-[#21262d] border border-[#30363d] rounded-lg h-9 p-0.5">
            <TabsTrigger
              value="recent"
              className="flex-1 text-[10px] data-[state=active]:bg-[#161b22] data-[state=active]:text-emerald-400 rounded-md h-8"
            >
              Recent ({playedFixtures.length})
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="flex-1 text-[10px] data-[state=active]:bg-[#161b22] data-[state=active]:text-emerald-400 rounded-md h-8"
            >
              Upcoming ({upcomingFixtures.length})
            </TabsTrigger>
            <TabsTrigger
              value="callups"
              className="flex-1 text-[10px] data-[state=active]:bg-[#161b22] data-[state=active]:text-emerald-400 rounded-md h-8"
            >
              My Caps ({callUpFixtures.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-3 space-y-3">
            {playedFixtures.length === 0 ? (
              <div className="text-center py-8">
                <Flag className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                <p className="text-xs text-[#8b949e]">No international matches played yet</p>
                <p className="text-[10px] text-[#8b949e] mt-1">Keep improving to earn your first cap!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {playedFixtures.map(f => (
                  <FixtureCard key={f.id} fixture={f} isPlayerNation={isPlayerNation} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-3 space-y-3">
            {upcomingFixtures.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                <p className="text-xs text-[#8b949e]">No upcoming fixtures scheduled</p>
                <p className="text-[10px] text-[#8b949e] mt-1">Fixtures are generated during international breaks</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {upcomingFixtures.map(f => (
                  <FixtureCard key={f.id} fixture={f} isPlayerNation={isPlayerNation} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="callups" className="mt-3 space-y-3">
            {callUpFixtures.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
                <p className="text-xs text-[#8b949e]">No call-ups yet</p>
                <p className="text-[10px] text-[#8b949e] mt-1">
                  {canBeCalledUp
                    ? 'You\'re eligible! Wait for an international break.'
                    : 'Meet the requirements to be eligible for selection.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {callUpFixtures.map(f => (
                  <FixtureCard key={f.id} fixture={f} isPlayerNation={isPlayerNation} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
