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
  Check,
  X,
  Award,
  Flame,
  Home,
  Plane,
  Zap,
  CircleDot,
  MapPin,
  Users,
  Medal,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
// Helper: caps milestone
// -----------------------------------------------------------
function getCapsMilestone(caps: number): { label: string; color: string; bgColor: string; icon: string } | null {
  if (caps >= 100) return { label: 'Diamond', color: 'text-cyan-300', bgColor: 'bg-cyan-500/15', icon: '💎' };
  if (caps >= 50) return { label: 'Gold', color: 'text-yellow-400', bgColor: 'bg-yellow-500/15', icon: '🥇' };
  if (caps >= 25) return { label: 'Silver', color: 'text-[#c9d1d9]', bgColor: 'bg-[#c9d1d9]/15', icon: '🥈' };
  if (caps >= 10) return { label: 'Bronze', color: 'text-amber-600', bgColor: 'bg-amber-600/15', icon: '🥉' };
  return null;
}

function getNextMilestone(caps: number): { target: number; label: string } | null {
  if (caps >= 100) return null;
  if (caps >= 50) return { target: 100, label: 'Diamond' };
  if (caps >= 25) return { target: 50, label: 'Gold' };
  if (caps >= 10) return { target: 25, label: 'Silver' };
  return { target: 10, label: 'Bronze' };
}

// -----------------------------------------------------------
// Deterministic FIFA ranking from nation name
// -----------------------------------------------------------
function getFifaRanking(nationName: string): number {
  let hash = 0;
  for (let i = 0; i < nationName.length; i++) {
    hash = ((hash << 5) - hash) + nationName.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 200) + 1;
}

// -----------------------------------------------------------
// Deterministic squad status
// -----------------------------------------------------------
function getSquadStatus(caps: number, age: number, calledUp: boolean): { label: string; color: string; bgColor: string } {
  if (age > 36 || caps === 0) return { label: 'Not Called Up', color: 'text-[#8b949e]', bgColor: 'bg-[#21262d]' };
  if (caps > 80 && age > 33) return { label: 'Retired', color: 'text-[#8b949e]', bgColor: 'bg-[#21262d]' };
  if (calledUp) return { label: 'Active Squad', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15' };
  if (caps > 0) return { label: 'Not Called Up', color: 'text-amber-400', bgColor: 'bg-amber-500/15' };
  return { label: 'Not Called Up', color: 'text-[#8b949e]', bgColor: 'bg-[#21262d]' };
}

// -----------------------------------------------------------
// Deterministic tournament honors from career data
// -----------------------------------------------------------
interface TournamentHonor {
  name: string;
  year: number;
  result: 'Winner' | 'Runner-Up' | 'Semi-Final' | 'Group Stage';
}

function generateTournamentHonors(caps: number, goals: number, nationName: string, callUpFixtures: InternationalFixture[]): TournamentHonor[] {
  if (caps < 5) return [];
  const honors: TournamentHonor[] = [];
  let hash = 0;
  for (let i = 0; i < nationName.length; i++) {
    hash = ((hash << 5) - hash) + nationName.charCodeAt(i);
    hash |= 0;
  }

  const tournaments = [
    { name: 'World Cup', years: [2022, 2026, 2030] },
    { name: 'EURO', years: [2020, 2024, 2028] },
    { name: 'Nations League', years: [2023, 2025, 2027] },
    { name: 'Confederations Cup', years: [2021, 2025] },
  ];

  const results: TournamentHonor['result'][] = ['Winner', 'Runner-Up', 'Semi-Final', 'Group Stage'];
  const seededResults = caps > 50 ? [0, 0, 1, 2] : caps > 25 ? [0, 1, 2, 2] : [2, 3, 3, 3];

  const numTournaments = Math.min(Math.floor(caps / 8) + (goals > 5 ? 1 : 0), tournaments.length);
  for (let i = 0; i < numTournaments; i++) {
    const t = tournaments[i % tournaments.length];
    const yearIdx = Math.abs((hash + i * 17) % t.years.length);
    const resultIdx = seededResults[i % seededResults.length];
    honors.push({
      name: t.name,
      year: t.years[yearIdx],
      result: results[resultIdx],
    });
  }

  return honors;
}

// -----------------------------------------------------------
// Mini SVG progress ring
// -----------------------------------------------------------
function MiniProgressRing({ value, max, color, size = 40, strokeWidth = 3 }: { value: number; max: number; color: string; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#30363d"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

// -----------------------------------------------------------
// Fixture card component (enhanced)
// -----------------------------------------------------------
function FixtureCard({ fixture, isPlayerNation }: { fixture: InternationalFixture; isPlayerNation: (n: string) => boolean }) {
  const playerSide = isPlayerNation(fixture.homeNation) ? 'home' : isPlayerNation(fixture.awayNation) ? 'away' : null;
  const playerWon = fixture.played && playerSide
    ? (playerSide === 'home' ? (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0) : (fixture.awayScore ?? 0) > (fixture.homeScore ?? 0))
    : null;
  const isDraw = fixture.played && fixture.homeScore === fixture.awayScore;
  const [expanded, setExpanded] = useState(false);

  // Generate plausible match events for the timeline
  const matchEvents = useMemo(() => {
    if (!fixture.played || !fixture.playerCalledUp) return [];
    const events: { minute: number; type: 'goal' | 'sub' | 'card'; description: string }[] = [];
    const homeGoals = fixture.homeScore ?? 0;
    const awayGoals = fixture.awayScore ?? 0;
    const totalGoals = homeGoals + awayGoals;

    const goalMinutes: number[] = [];
    for (let i = 0; i < totalGoals; i++) {
      goalMinutes.push(5 + Math.floor(Math.abs(hashCode(fixture.id + 'g' + i)) % 86));
    }
    goalMinutes.sort((a, b) => a - b);
    goalMinutes.forEach((min, idx) => {
      const isHome = idx < homeGoals;
      events.push({
        minute: min,
        type: 'goal',
        description: `⚽ ${isHome ? fixture.homeNation : fixture.awayNation} goal (${min}')`,
      });
    });

    if (!fixture.playerStarted && fixture.playerMinutes && fixture.playerMinutes > 0) {
      events.push({
        minute: 90 - (fixture.playerMinutes ?? 0),
        type: 'sub',
        description: `🔄 Subbed on (${90 - (fixture.playerMinutes ?? 0)}')`,
      });
    }

    return events.sort((a, b) => a.minute - b.minute);
  }, [fixture]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border border-[#30363d] rounded-lg p-4 bg-[#161b22] ${
        fixture.playerCalledUp ? 'ring-1 ring-emerald-500/30' : ''
      }`}
    >
      {/* Match type badge + week + venue indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getMatchTypeBg(fixture.matchType)} ${getMatchTypeColor(fixture.matchType)} border-0 text-xs`}>
            {getMatchTypeLabel(fixture.matchType)}
          </Badge>
          {playerSide && !fixture.played && (
            <Badge className={`${playerSide === 'home' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400'} border-0 text-[10px] flex items-center gap-1`}>
              {playerSide === 'home' ? <Home className="h-3 w-3" /> : <Plane className="h-3 w-3" />}
              {playerSide === 'home' ? 'Home' : 'Away'}
            </Badge>
          )}
        </div>
        <span className="text-xs text-[#8b949e] flex items-center gap-1">
          <Clock className="h-3 w-3" />
          S{fixture.season} W{fixture.week}
        </span>
      </div>

      {/* Score line with vs badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{fixture.homeFlag}</span>
          <span className={`text-sm font-medium ${isPlayerNation(fixture.homeNation) ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
            {fixture.homeNation}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3">
          {fixture.played ? (
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${playerWon ? 'text-emerald-400' : isDraw ? 'text-amber-400' : playerWon === false ? 'text-red-400' : 'text-[#c9d1d9]'}`}>
                {fixture.homeScore}
              </span>
              <span className="text-[10px] text-[#484f58] font-medium">-</span>
              <span className={`text-lg font-bold ${playerWon ? 'text-emerald-400' : isDraw ? 'text-amber-400' : playerWon === false ? 'text-red-400' : 'text-[#c9d1d9]'}`}>
                {fixture.awayScore}
              </span>
            </div>
          ) : (
            <Badge className="bg-[#21262d] text-[#8b949e] border border-[#30363d] text-[10px] px-2">
              vs
            </Badge>
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

          {matchEvents.length > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-2 text-[10px] text-[#8b949e] hover:text-[#c9d1d9] transition-colors flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              {expanded ? 'Hide events' : 'Show events'}
            </button>
          )}

          {expanded && matchEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 pl-3 border-l-2 border-[#30363d] space-y-1.5"
            >
              {matchEvents.map((evt, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-sm bg-[#484f58] mt-1 flex-shrink-0" />
                  <span className="text-[10px] text-[#8b949e]">
                    <span className="text-[#c9d1d9] font-medium">{evt.minute}&apos;</span>{' '}
                    {evt.description}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {!fixture.playerCalledUp && fixture.played && (
        <div className="mt-3 pt-3 border-t border-[#30363d]">
          <span className="text-[10px] text-[#8b949e]">Not called up for this match</span>
        </div>
      )}
    </motion.div>
  );
}

// -----------------------------------------------------------
// Simple hash for deterministic pseudo-random
// -----------------------------------------------------------
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

// -----------------------------------------------------------
// SVG Horizontal Bar Chart for Career Stats
// -----------------------------------------------------------
function CareerStatsBarChart({ caps, goals, assists }: { caps: number; goals: number; assists: number }) {
  const playerPosition = 'CM'; // fallback
  const isGK = false;

  const stats = [
    { label: 'Appearances', value: caps, color: '#c9d1d9', avg: 35 },
    { label: 'Goals', value: goals, color: '#34d399', avg: 3 },
    { label: 'Assists', value: assists, color: '#22d3ee', avg: 5 },
  ];

  if (isGK) {
    stats.push({ label: 'Clean Sheets', value: Math.floor(goals * 0.3), color: '#f59e0b', avg: 2 });
  }

  const maxVal = Math.max(...stats.map(s => s.value), 1);

  return (
    <div className="space-y-3">
      {stats.map((stat) => {
        const barWidth = maxVal > 0 ? Math.max((stat.value / maxVal) * 100, 2) : 0;
        const avgWidth = maxVal > 0 ? Math.max((stat.avg / maxVal) * 100, 2) : 0;
        return (
          <div key={stat.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8b949e] font-medium">{stat.label}</span>
              <span className="text-xs font-bold" style={{ color: stat.color }}>{stat.value}</span>
            </div>
            <div className="relative">
              {/* Average comparison line */}
              <div
                className="absolute top-0 h-2 rounded-sm bg-[#21262d] border border-[#30363d] border-dashed"
                style={{ width: `${avgWidth}%` }}
              />
              {/* Player bar */}
              <div className="relative h-2 rounded-sm overflow-hidden bg-[#21262d]">
                <motion.div
                  className="h-full rounded-sm"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7 }}
                  style={{ width: `${barWidth}%`, backgroundColor: stat.color }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-1 rounded-sm border border-dashed border-[#484f58]" />
              <span className="text-[9px] text-[#484f58]">Avg international: {stat.avg}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------
// Tournament Honor Result Badge
// -----------------------------------------------------------
function HonorResultBadge({ result }: { result: TournamentHonor['result'] }) {
  const config = {
    'Winner': { icon: '🏆', color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
    'Runner-Up': { icon: '🥈', color: 'text-[#c9d1d9]', bg: 'bg-[#c9d1d9]/10', border: 'border-[#c9d1d9]/20' },
    'Semi-Final': { icon: '🏅', color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20' },
    'Group Stage': { icon: '📋', color: 'text-[#8b949e]', bg: 'bg-[#21262d]', border: 'border-[#30363d]' },
  };
  const c = config[result];
  return (
    <Badge className={`${c.bg} ${c.color} ${c.border} text-[10px] rounded-md px-2 h-5 flex items-center gap-1`}>
      <span>{c.icon}</span>
      {result}
    </Badge>
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

  // Eligibility requirements count (out of 4)
  const eligibilityCount = useMemo(() => {
    if (!gameState) return 0;
    const p = gameState.player;
    let count = 0;
    if (p.reputation >= 60) count++;
    if (p.form >= 5.5) count++;
    if (p.age >= 17 && p.age <= 36) count++;
    if (p.injuryWeeks === 0) count++;
    return count;
  }, [gameState]);

  // Call-up streak
  const callUpStreak = useMemo(() => {
    if (callUpFixtures.length === 0) return 0;
    let streak = 0;
    const sorted = [...callUpFixtures].sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season;
      return b.week - a.week;
    });
    for (const f of sorted) {
      if (f.playerCalledUp) streak++;
      else break;
    }
    return streak;
  }, [callUpFixtures]);

  // Win rate
  const winRate = useMemo(() => {
    const playerPlayed = playedFixtures.filter(f => f.playerCalledUp);
    if (playerPlayed.length === 0) return null;
    let wins = 0;
    for (const f of playerPlayed) {
      const homeWon = (f.homeScore ?? 0) > (f.awayScore ?? 0);
      const awayWon = (f.awayScore ?? 0) > (f.homeScore ?? 0);
      if (isPlayerNation(f.homeNation) && homeWon) wins++;
      else if (isPlayerNation(f.awayNation) && awayWon) wins++;
    }
    return Math.round((wins / playerPlayed.length) * 100);
  }, [playedFixtures, isPlayerNation]);

  // Last 5 results
  const last5Results = useMemo(() => {
    const playerPlayed = playedFixtures.filter(f => f.playerCalledUp);
    const sorted = [...playerPlayed].sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season;
      return b.week - a.week;
    });
    return sorted.slice(0, 5).map(f => {
      const homeWon = (f.homeScore ?? 0) > (f.awayScore ?? 0);
      const awayWon = (f.awayScore ?? 0) > (f.homeScore ?? 0);
      const isPlayerHome = isPlayerNation(f.homeNation);
      const playerWon = isPlayerHome ? homeWon : awayWon;
      const isDraw = f.homeScore === f.awayScore;
      if (isDraw) return 'D' as const;
      return playerWon ? 'W' as const : 'L' as const;
    });
  }, [playedFixtures, isPlayerNation]);

  // Career milestones for timeline
  const careerTimeline = useMemo(() => {
    const milestones: { season: number; week: number; label: string; icon: 'debut' | 'goal' | 'assist' | 'cap' }[] = [];
    const sorted = [...callUpFixtures].sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.week - b.week;
    });

    if (sorted.length > 0) {
      const debut = sorted[0];
      milestones.push({ season: debut.season, week: debut.week, label: 'International debut', icon: 'debut' });
    }

    const firstGoal = sorted.find(f => (f.playerGoals ?? 0) > 0);
    if (firstGoal) {
      milestones.push({ season: firstGoal.season, week: firstGoal.week, label: 'First international goal', icon: 'goal' });
    }

    const firstAssist = sorted.find(f => (f.playerAssists ?? 0) > 0);
    if (firstAssist) {
      milestones.push({ season: firstAssist.season, week: firstAssist.week, label: 'First international assist', icon: 'assist' });
    }

    const capMilestones = [
      { capNum: 10, label: '10th cap — Bronze milestone' },
      { capNum: 25, label: '25th cap — Silver milestone' },
      { capNum: 50, label: '50th cap — Gold milestone' },
      { capNum: 100, label: '100th cap — Diamond milestone' },
    ];
    for (const cm of capMilestones) {
      if (sorted.length >= cm.capNum) {
        const capFixture = sorted[cm.capNum - 1];
        milestones.push({ season: capFixture.season, week: capFixture.week, label: cm.label, icon: 'cap' });
      }
    }

    milestones.sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.week - b.week;
    });

    return milestones;
  }, [callUpFixtures]);

  // Tournament honors
  const tournamentHonors = useMemo(() => {
    if (!gameState) return [];
    const ic = gameState.internationalCareer;
    return generateTournamentHonors(ic.caps, ic.goals, nationInfo.name, callUpFixtures);
  }, [gameState, nationInfo.name, callUpFixtures]);

  // FIFA ranking
  const fifaRanking = useMemo(() => getFifaRanking(nationInfo.name), [nationInfo.name]);

  // Squad status
  const squadStatus = useMemo(() => {
    if (!gameState) return getSquadStatus(0, 0, false);
    const ic = gameState.internationalCareer;
    return getSquadStatus(ic.caps, gameState.player.age, gameState.internationalCalledUp);
  }, [gameState, nationInfo.name]);

  // Venue names (deterministic)
  const venueMap: Record<string, string> = {
    'England': 'Wembley Stadium, London',
    'France': 'Stade de France, Paris',
    'Germany': 'Allianz Arena, Munich',
    'Spain': 'Santiago Bernabéu, Madrid',
    'Brazil': 'Maracanã, Rio de Janeiro',
    'Argentina': 'Estadio Monumental, Buenos Aires',
    'Italy': 'San Siro, Milan',
    'Portugal': 'Estádio da Luz, Lisbon',
    'Netherlands': 'Johan Cruyff Arena, Amsterdam',
    'Belgium': 'King Baudouin Stadium, Brussels',
    'Croatia': 'Poljud Stadium, Split',
    'Uruguay': 'Centenario, Montevideo',
    'Colombia': 'Metropolitano, Barranquilla',
  };

  if (!gameState) return null;

  const { player, currentWeek, currentClub } = gameState;
  const internationalCareer = gameState.internationalCareer ?? { caps: 0, goals: 0, assists: 0, averageRating: 0, tournaments: [], lastCallUpSeason: 0, lastCallUpWeek: 0 };
  const internationalCalledUp = gameState.internationalCalledUp ?? false;
  const internationalOnBreak = gameState.internationalOnBreak ?? false;

  const milestone = getCapsMilestone(internationalCareer.caps);
  const nextMilestone = getNextMilestone(internationalCareer.caps);

  const eligibilityBorderColor = eligibilityCount === 4 ? 'border-emerald-500/40' : eligibilityCount === 3 ? 'border-amber-500/40' : 'border-[#30363d]';
  const eligibilitySummaryColor = eligibilityCount === 4 ? 'text-emerald-400' : eligibilityCount === 3 ? 'text-amber-400' : 'text-red-400';

  const winRateColor = winRate === null ? 'text-[#484f58]' : winRate > 50 ? 'text-emerald-400' : winRate > 30 ? 'text-amber-400' : 'text-red-400';
  const winRateRingColor = winRate === null ? '#484f58' : winRate > 50 ? '#34d399' : winRate > 30 ? '#fbbf24' : '#f87171';

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20 space-y-4">
      {/* ===== Header ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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

      {/* ===== 1. National Team Card (Enhanced) ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
      >
        {/* Top row: flag + info + badges */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {internationalCalledUp && (
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-emerald-400"
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
              )}
              <span className="text-[40px] block p-1 leading-none">{nationInfo.flag}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#c9d1d9]">{nationInfo.name}</h2>
              {/* FIFA Ranking + Status Badge */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Medal className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] text-[#8b949e]">FIFA Rank</span>
                  <span className="text-xs font-bold text-amber-400">#{fifaRanking}</span>
                </div>
              </div>
              {/* Caps + Goals + Status */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge className="bg-[#21262d] text-[#c9d1d9] border-0 text-[10px]">
                  <Users className="h-3 w-3 mr-1" />
                  {internationalCareer.caps} caps
                </Badge>
                <Badge className="bg-[#21262d] text-emerald-400 border-0 text-[10px]">
                  <Target className="h-3 w-3 mr-1" />
                  {internationalCareer.goals} goals
                </Badge>
                <Badge className={`${squadStatus.bgColor} ${squadStatus.color} border-0 text-[10px]`}>
                  {squadStatus.label}
                </Badge>
              </div>
              {/* Milestone + Streak */}
              <div className="flex items-center gap-2 mt-1">
                {milestone && (
                  <Badge className={`${milestone.bgColor} ${milestone.color} border-0 text-[10px]`}>
                    <Award className="h-3 w-3 mr-1" />
                    {milestone.icon} {milestone.label}
                  </Badge>
                )}
                {callUpStreak > 1 && (
                  <Badge className="bg-orange-500/15 text-orange-400 border-0 text-[10px]">
                    <Flame className="h-3 w-3 mr-1" />
                    {callUpStreak} streak
                  </Badge>
                )}
                {nextMilestone && (
                  <span className="text-[10px] text-[#484f58]">
                    {internationalCareer.caps}/{nextMilestone.target} to {nextMilestone.label}
                  </span>
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

        {/* Quick stats with SVG progress rings */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#21262d] rounded-lg p-2 text-center relative">
            <div className="flex justify-center mb-1">
              <div className="relative">
                <MiniProgressRing value={internationalCareer.caps} max={100} color="#c9d1d9" size={36} strokeWidth={2.5} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#c9d1d9]">
                  {internationalCareer.caps}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-[#8b949e]">Caps</div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center relative">
            <div className="flex justify-center mb-1">
              <div className="relative">
                <MiniProgressRing value={internationalCareer.goals} max={Math.max(internationalCareer.goals, 10)} color="#34d399" size={36} strokeWidth={2.5} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-emerald-400">
                  {internationalCareer.goals}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-[#8b949e]">Goals</div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center relative">
            <div className="flex justify-center mb-1">
              <div className="relative">
                <MiniProgressRing value={internationalCareer.assists} max={Math.max(internationalCareer.assists, 10)} color="#22d3ee" size={36} strokeWidth={2.5} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-cyan-400">
                  {internationalCareer.assists}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-[#8b949e]">Assists</div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center relative">
            <div className="flex justify-center mb-1">
              <div className="relative">
                <MiniProgressRing value={winRate ?? 0} max={100} color={winRateRingColor} size={36} strokeWidth={2.5} />
                <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${winRateColor}`}>
                  {winRate !== null ? `${winRate}%` : '—'}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-[#8b949e]">Win Rate</div>
          </div>
        </div>

        {/* Last 5 results */}
        {last5Results.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#30363d]">
            <span className="text-[10px] text-[#484f58] block mb-2">Last 5 Results</span>
            <div className="flex gap-1.5">
              {last5Results.map((r, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold ${
                    r === 'W'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : r === 'D'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  {r}
                </div>
              ))}
              {last5Results.length < 5 && (
                Array.from({ length: 5 - last5Results.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-8 h-8 rounded-md bg-[#21262d] border border-[#30363d]" />
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ===== 2. International Career Stats (SVG Bar Chart) ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
      >
        <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#8b949e]" />
          Career Statistics
        </h3>
        <CareerStatsBarChart
          caps={internationalCareer.caps}
          goals={internationalCareer.goals}
          assists={internationalCareer.assists}
        />
        <div className="mt-3 pt-3 border-t border-[#30363d] grid grid-cols-2 gap-2">
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
      </motion.div>

      {/* ===== 4. International Honors Section ===== */}
      {tournamentHonors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
        >
          <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-400" />
            International Honors
          </h3>
          <div className="space-y-2">
            {tournamentHonors.map((honor, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-[#21262d] rounded-lg p-3 border border-[#30363d]"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {honor.result === 'Winner' ? '🏆' : honor.result === 'Runner-Up' ? '🥈' : honor.result === 'Semi-Final' ? '🏅' : '📋'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#c9d1d9]">{honor.name}</p>
                    <p className="text-[10px] text-[#8b949e]">{honor.year}</p>
                  </div>
                </div>
                <HonorResultBadge result={honor.result} />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ===== 3. Upcoming Fixtures Timeline ===== */}
      {upcomingFixtures.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
        >
          <h3 className="text-sm font-semibold text-[#c9d1d9] mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            Upcoming Fixtures
            <Badge className="ml-auto bg-emerald-500/15 text-emerald-300 border-emerald-500/30 border-0 text-[10px] h-5">
              {upcomingFixtures.length}
            </Badge>
          </h3>

          {/* Vertical timeline */}
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#30363d]" />
            <div className="space-y-3">
              {upcomingFixtures.map((fixture, idx) => {
                const isHome = isPlayerNation(fixture.homeNation);
                const opponent = isHome ? fixture.awayNation : fixture.homeNation;
                const opponentFlag = isHome ? fixture.awayFlag : fixture.homeFlag;
                const venue = venueMap[nationInfo.name] || 'National Stadium';
                const matchTypeLabel = getMatchTypeLabel(fixture.matchType);

                return (
                  <div key={fixture.id} className="relative flex items-start gap-3">
                    {/* Timeline node */}
                    <div className="absolute -left-6 top-1 w-[15px] h-[15px] rounded-md border flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${getMatchTypeColor(fixture.matchType)}15`, borderColor: `${getMatchTypeColor(fixture.matchType)}30` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-sm bg-current" />
                    </div>

                    {/* Card */}
                    <div className="flex-1 min-w-0 bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                      {/* Competition badge */}
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`${getMatchTypeBg(fixture.matchType)} ${getMatchTypeColor(fixture.matchType)} border-0 text-[10px]`}>
                          {matchTypeLabel}
                        </Badge>
                        <Badge className={`${isHome ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400'} border-0 text-[10px] flex items-center gap-1`}>
                          {isHome ? <Home className="h-3 w-3" /> : <Plane className="h-3 w-3" />}
                          {isHome ? 'Home' : 'Away'}
                        </Badge>
                      </div>
                      {/* Opponent */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{opponentFlag}</span>
                        <span className="text-sm font-medium text-[#c9d1d9]">vs {opponent}</span>
                      </div>
                      {/* Date / Venue */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#8b949e]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          S{fixture.season} W{fixture.week}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {venue}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== Call-up Eligibility ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`border rounded-lg bg-[#161b22] p-4 ${eligibilityBorderColor}`}
      >
        <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Swords className="h-4 w-4 text-[#8b949e]" />
          Call-up Eligibility
          <span className={`text-[10px] font-medium ml-auto ${eligibilitySummaryColor}`}>
            {eligibilityCount}/4 requirements
          </span>
        </h3>

        <div className="mb-3">
          <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className={`h-full rounded-sm transition-all duration-500 ${
                eligibilityCount === 4 ? 'bg-emerald-400' : eligibilityCount === 3 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${(eligibilityCount / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {player.reputation >= 60 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-red-400" />}
              <span className="text-xs text-[#8b949e]">Reputation (min 60)</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={Math.min(player.reputation, 100)} className="w-20 h-1.5" />
              <span className={`text-xs font-medium ${player.reputation >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{player.reputation}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {player.form >= 5.5 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-red-400" />}
              <span className="text-xs text-[#8b949e]">Form (min 5.5)</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={Math.min(player.form * 10, 100)} className="w-20 h-1.5" />
              <span className={`text-xs font-medium ${player.form >= 5.5 ? 'text-emerald-400' : 'text-red-400'}`}>{player.form.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {player.age >= 17 && player.age <= 36 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-red-400" />}
              <span className="text-xs text-[#8b949e]">Age (17–36)</span>
            </div>
            <span className={`text-xs font-medium ${player.age >= 17 && player.age <= 36 ? 'text-emerald-400' : 'text-red-400'}`}>{player.age}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {player.injuryWeeks === 0 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-red-400" />}
              <span className="text-xs text-[#8b949e]">Injury-free</span>
            </div>
            <span className={`text-xs font-medium ${player.injuryWeeks === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {player.injuryWeeks === 0 ? 'Fit' : `Out ${player.injuryWeeks}w`}
            </span>
          </div>
        </div>

        {canBeCalledUp ? (
          <div className="mt-3 pt-3 border-t border-[#30363d] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Eligible for national team selection</span>
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-[#30363d] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-amber-400">Meet all requirements to be eligible</span>
          </div>
        )}
      </motion.div>

      {/* ===== Next International Break ===== */}
      {nextBreakWeeks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
        >
          <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#8b949e]" />
            Next International Break
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8b949e]">Week {nextBreakWeeks[0]}</span>
            <span className="text-[10px] text-[#8b949e]">(in {nextBreakWeeks[0] - currentWeek} weeks)</span>
          </div>
        </motion.div>
      )}

      {/* ===== Fixtures Tabs ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="w-full bg-[#21262d] border border-[#30363d] rounded-lg h-9 p-0.5">
            <TabsTrigger value="recent" className="flex-1 text-[10px] data-[state=active]:bg-[#161b22] data-[state=active]:text-emerald-400 rounded-md h-8">
              Recent ({playedFixtures.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1 text-[10px] data-[state=active]:bg-[#161b22] data-[state=active]:text-emerald-400 rounded-md h-8">
              Upcoming ({upcomingFixtures.length})
            </TabsTrigger>
            <TabsTrigger value="callups" className="flex-1 text-[10px] data-[state=active]:bg-[#161b22] data-[state=active]:text-emerald-400 rounded-md h-8">
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

      {/* ===== International Career Timeline ===== */}
      {careerTimeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="border border-[#30363d] rounded-lg bg-[#161b22] p-4"
        >
          <h3 className="text-sm font-semibold text-[#c9d1d9] mb-4 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-[#8b949e]" />
            Career Timeline
          </h3>

          <div className="relative pl-6">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[#30363d]" />

            <div className="space-y-4">
              {careerTimeline.map((milestone, idx) => {
                const iconMap = {
                  debut: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', color: 'text-emerald-400', icon: <Flag className="h-3 w-3" /> },
                  goal: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', color: 'text-yellow-400', icon: <Target className="h-3 w-3" /> },
                  assist: { bg: 'bg-cyan-500/15', border: 'border-cyan-500/40', color: 'text-cyan-400', icon: <TrendingUp className="h-3 w-3" /> },
                  cap: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', color: 'text-amber-400', icon: <Award className="h-3 w-3" /> },
                };
                const style = iconMap[milestone.icon];

                return (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div className={`absolute -left-6 top-0.5 w-[15px] h-[15px] rounded-md ${style.bg} border ${style.border} flex items-center justify-center`}>
                      <div className={style.color}>{style.icon}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#c9d1d9] font-medium">{milestone.label}</p>
                      <p className="text-[10px] text-[#484f58] mt-0.5">
                        Season {milestone.season}, Week {milestone.week}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
