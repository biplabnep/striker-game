'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Route, Trophy, Star, Target, Zap, Calendar,
  TrendingUp, Award, Flame, ChevronRight, ArrowRight,
  Lock, CheckCircle2, Shield, Flag, Crown, Globe,
  Medal, Crosshair, User, Activity, BarChart3,
  Clock, CircleDot, Footprints, Gift, Swords,
} from 'lucide-react';

// ── Animation Helpers ─────────────────────────────────────────
const ANIM = { duration: 0.2, ease: 'easeOut' as const };
const D = 0.04;

// ── Color Palette ─────────────────────────────────────────────
const C = {
  bg: '#0d1117',
  card: '#161b22',
  elevated: '#21262d',
  border: '#30363d',
  muted: '#8b949e',
  dim: '#484f58',
  emerald: '#34d399',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  violet: '#a78bfa',
  text: '#c9d1d9',
} as const;

// ── League Color Mapping ──────────────────────────────────────
const LEAGUE_COLORS: Record<string, string> = {
  premier_league: C.blue,
  la_liga: C.amber,
  serie_a: '#22c55e',
  bundesliga: C.red,
  ligue_1: '#1e3a5f',
};

function leagueColor(leagueId: string): string {
  return LEAGUE_COLORS[leagueId] ?? C.dim;
}

// ── Career Phase Helper ───────────────────────────────────────
type CareerPhase = 'Youth' | 'Breakthrough' | 'Peak' | 'Veteran' | 'Legend';

function getCareerPhase(
  age: number,
  overall: number,
  seasons: number,
  trophies: number,
  totalGoals: number
): CareerPhase {
  if (age <= 17) return 'Youth';
  if (age <= 21 && overall < 75) return 'Breakthrough';
  if (age <= 21 && overall >= 75) return 'Peak';
  if (overall >= 88 && trophies >= 5) return 'Legend';
  if (age >= 33) return 'Veteran';
  if (seasons >= 5 && overall >= 80) return 'Peak';
  if (totalGoals >= 100) return 'Peak';
  return 'Breakthrough';
}

function phaseColor(phase: CareerPhase): string {
  switch (phase) {
    case 'Youth': return '#60a5fa';
    case 'Breakthrough': return C.amber;
    case 'Peak': return C.emerald;
    case 'Veteran': return C.violet;
    case 'Legend': return '#fbbf24';
  }
}

function phaseIcon(phase: CareerPhase): string {
  switch (phase) {
    case 'Youth': return '🌱';
    case 'Breakthrough': return '⚡';
    case 'Peak': return '🔥';
    case 'Veteran': return '🛡️';
    case 'Legend': return '👑';
  }
}

// ── Achievement Definitions ───────────────────────────────────
interface TimelineAchievement {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  unlockCondition: string;
  checkFn: (ctx: AchievementContext) => boolean;
}

interface AchievementContext {
  totalGoals: number;
  totalAssists: number;
  totalAppearances: number;
  trophies: number;
  internationalCaps: number;
  highestRating: number;
  age: number;
  overall: number;
  seasons: number;
}

const CAREER_ACHIEVEMENTS: TimelineAchievement[] = [
  {
    id: 'first_goal',
    name: 'First Goal',
    icon: <Crosshair className="h-4 w-4" />,
    description: 'Scored your first professional goal',
    unlockCondition: 'Score 1 goal',
    checkFn: (c) => c.totalGoals >= 1,
  },
  {
    id: 'first_assist',
    name: 'First Assist',
    icon: <ArrowRight className="h-4 w-4" />,
    description: 'Registered your first career assist',
    unlockCondition: 'Record 1 assist',
    checkFn: (c) => c.totalAssists >= 1,
  },
  {
    id: 'first_trophy',
    name: 'First Trophy',
    icon: <Trophy className="h-4 w-4" />,
    description: 'Won your first piece of silverware',
    unlockCondition: 'Win 1 trophy',
    checkFn: (c) => c.trophies >= 1,
  },
  {
    id: 'century_goals',
    name: '100 Goals',
    icon: <Target className="h-4 w-4" />,
    description: 'Reached the century mark in goals',
    unlockCondition: 'Score 100 goals',
    checkFn: (c) => c.totalGoals >= 100,
  },
  {
    id: 'five_hundred_apps',
    name: '500 Appearances',
    icon: <Calendar className="h-4 w-4" />,
    description: 'A true ever-present professional',
    unlockCondition: 'Make 500 appearances',
    checkFn: (c) => c.totalAppearances >= 500,
  },
  {
    id: 'intl_debut',
    name: 'International Debut',
    icon: <Flag className="h-4 w-4" />,
    description: 'Represented your country for the first time',
    unlockCondition: 'Earn 1 international cap',
    checkFn: (c) => c.internationalCaps >= 1,
  },
  {
    id: 'golden_boot',
    name: 'Golden Boot',
    icon: <Footprints className="h-4 w-4" />,
    description: 'Finished as the league\'s top scorer',
    unlockCondition: 'Win league Golden Boot',
    checkFn: () => false,
  },
  {
    id: 'ballon_dor',
    name: 'Ballon d\'Or',
    icon: <Award className="h-4 w-4" />,
    description: 'Awarded the Ballon d\'Or trophy',
    unlockCondition: 'Win Ballon d\'Or',
    checkFn: () => false,
  },
];

// ── Legend Comparison Data ────────────────────────────────────
interface LegendComparison {
  name: string;
  flag: string;
  goalsPerSeason: number;
  assistsPerSeason: number;
  trophies: number;
  caps: number;
}

const LEGENDS: LegendComparison[] = [
  { name: 'Lionel Messi', flag: '🇦🇷', goalsPerSeason: 28, assistsPerSeason: 14, trophies: 35, caps: 180 },
  { name: 'Cristiano Ronaldo', flag: '🇵🇹', goalsPerSeason: 30, assistsPerSeason: 8, trophies: 30, caps: 200 },
  { name: 'Thierry Henry', flag: '🇫🇷', goalsPerSeason: 22, assistsPerSeason: 10, trophies: 15, caps: 120 },
  { name: 'Robert Lewandowski', flag: '🇵🇱', goalsPerSeason: 32, assistsPerSeason: 6, trophies: 20, caps: 130 },
  { name: 'Erling Haaland', flag: '🇳🇴', goalsPerSeason: 35, assistsPerSeason: 5, trophies: 8, caps: 30 },
];

// ── Highlight Moment Definitions ──────────────────────────────
interface CareerMoment {
  id: string;
  name: string;
  description: string;
  season: number;
  milestone: boolean;
  icon: React.ReactNode;
}

// ── Season Highlight Generator (deterministic) ───────────────
function getSeasonHighlight(
  seasonNum: number,
  goals: number,
  assists: number,
  avgRating: number,
  position: number
): string {
  if (goals >= 25) return 'A sensational scoring season. One of the best campaigns of the decade.';
  if (goals >= 15 && assists >= 10) return 'A brilliant all-round season contributing both goals and assists.';
  if (avgRating >= 8.0) return 'Consistently outstanding performances made this a season to remember.';
  if (position <= 3) return 'Part of a title-challenging side. The team reached new heights.';
  if (goals === 0 && seasonNum === 1) return 'A season of adaptation and learning at the new club.';
  if (goals >= 10) return 'A solid campaign with important contributions to the team.';
  return 'A steady season building experience and developing skills.';
}

function getSeasonBadge(
  seasonNum: number,
  goals: number,
  assists: number,
  avgRating: number,
  allSeasons: { goals: number; avgRating: number }[]
): string | null {
  if (allSeasons.length < 2) return null;
  const maxGoals = Math.max(...allSeasons.map(s => s.goals));
  const minRating = Math.min(...allSeasons.filter(s => s.avgRating > 0).map(s => s.avgRating));
  if (goals === maxGoals && maxGoals > 0) return 'Best Season';
  if (avgRating === minRating && minRating < 6.0) return 'Worst Season';
  if (seasonNum <= 2 && goals >= 10) return 'Breakthrough Season';
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export default function PlayerCareerTimeline() {
  const gameState = useGameStore((s) => s.gameState);
  const [activeSection, setActiveSection] = useState<string>('seasons');

  // ── Computed Data ────────────────────────────────────────────
  const data = useMemo(() => {
    if (!gameState) return null;

    const { player, currentClub, currentSeason, seasons, recentResults, achievements, internationalCareer, year } = gameState;

    // Career totals
    const career = player.careerStats;
    const totalGoals = career.totalGoals;
    const totalAssists = career.totalAssists;
    const totalApps = career.totalAppearances;
    const totalTrophies = career.trophies?.length ?? 0;
    const intlCaps = internationalCareer.caps;
    const seasonsPlayed = career.seasonsPlayed || seasons.length;

    // Career phase
    const phase = getCareerPhase(player.age, player.overall, seasonsPlayed, totalTrophies, totalGoals);

    // Current season data
    const currentSeasonStats = player.seasonStats;

    // Build seasons timeline
    const seasonTimeline = [
      ...seasons.map((s) => ({
        number: s.number,
        year: s.year,
        leaguePosition: s.leaguePosition,
        stats: s.playerStats,
        trophies: career.trophies?.filter((t) => t.season === s.number) ?? [],
        achievements: s.achievements ?? [],
        isCurrent: false,
      })),
      {
        number: currentSeason,
        year: year,
        leaguePosition: gameState.leagueTable.findIndex((e) => e.clubId === currentClub.id) + 1,
        stats: currentSeasonStats,
        trophies: [],
        achievements: achievements.filter((a) => a.unlocked && a.unlockedSeason === currentSeason).map((a) => a.name),
        isCurrent: true,
      },
    ];

    // Career path (clubs visited) — in this game we track current club
    // Since transfers modify currentClub, we reconstruct from trophy/season data
    const clubPath = [
      {
        name: currentClub.name,
        logo: currentClub.logo,
        league: currentClub.league,
        startYear: year - seasonsPlayed + 1,
        endYear: null as number | null,
        isCurrent: true,
        fee: 0,
      },
    ];

    // Highest match rating
    const playedMatches = recentResults.filter((r) => r.playerRating > 0);
    const highestRating = playedMatches.length > 0
      ? Math.max(...playedMatches.map((r) => r.playerRating))
      : 0;

    // Hat-tricks
    const hatTrickMatches = recentResults.filter((r) => r.playerGoals >= 3);
    const bestMatch = playedMatches.length > 0
      ? playedMatches.reduce((b, r) => (r.playerRating > b.playerRating ? r : b))
      : null;

    // Achievement context
    const achCtx: AchievementContext = {
      totalGoals,
      totalAssists,
      totalAppearances: totalApps,
      trophies: totalTrophies,
      internationalCaps: intlCaps,
      highestRating,
      age: player.age,
      overall: player.overall,
      seasons: seasonsPlayed,
    };

    const unlockedAchievements = CAREER_ACHIEVEMENTS.filter((a) => a.checkFn(achCtx));
    const lockedAchievements = CAREER_ACHIEVEMENTS.filter((a) => !a.checkFn(achCtx));

    // Chart data: goals per season, assists per season, avg rating per season
    const chartData = seasonTimeline.map((s) => ({
      season: s.number,
      goals: s.stats.goals,
      assists: s.stats.assists,
      avgRating: s.stats.averageRating,
    }));

    // Best season (most goals)
    const bestSeasonIdx = chartData.reduce(
      (bestIdx, s, i) => (s.goals > chartData[bestIdx].goals ? i : bestIdx),
      0
    );

    // Career moments (deterministic)
    const moments: CareerMoment[] = [];

    // Debut
    if (totalApps >= 1) {
      moments.push({
        id: 'debut',
        name: 'Professional Debut',
        description: `Made your first appearance for ${currentClub.name}`,
        season: 1,
        milestone: true,
        icon: <CircleDot className="h-5 w-5" />,
      });
    }

    // First goal
    const firstGoalMatch = recentResults.find((r) => r.playerGoals > 0);
    if (firstGoalMatch) {
      moments.push({
        id: 'first_goal',
        name: 'First Goal',
        description: `Scored your first career goal vs ${firstGoalMatch.awayClub.name}`,
        season: firstGoalMatch.season,
        milestone: true,
        icon: <Crosshair className="h-5 w-5" />,
      });
    }

    // First trophy
    const firstTrophy = career.trophies?.[0];
    if (firstTrophy) {
      moments.push({
        id: 'first_trophy',
        name: 'First Trophy',
        description: `Won the ${firstTrophy.name}`,
        season: firstTrophy.season,
        milestone: true,
        icon: <Trophy className="h-5 w-5" />,
      });
    }

    // Record appearance
    if (totalApps >= 100) {
      moments.push({
        id: 'record_apps',
        name: 'Century of Appearances',
        description: 'Reached 100 professional appearances',
        season: Math.min(seasonsPlayed, 10),
        milestone: true,
        icon: <Calendar className="h-5 w-5" />,
      });
    }

    // Best rating
    if (bestMatch && bestMatch.playerRating >= 8.5) {
      moments.push({
        id: 'best_rating',
        name: 'World-Class Performance',
        description: `Rated ${bestMatch.playerRating.toFixed(1)} — career best`,
        season: bestMatch.season,
        milestone: true,
        icon: <Star className="h-5 w-5" />,
      });
    }

    // Hat-trick
    if (hatTrickMatches.length > 0) {
      const ht = hatTrickMatches[0];
      moments.push({
        id: 'hat_trick',
        name: 'First Hat-Trick',
        description: `Scored 3 goals in a single match (Season ${ht.season})`,
        season: ht.season,
        milestone: true,
        icon: <Flame className="h-5 w-5" />,
      });
    }

    // International debut
    if (intlCaps >= 1) {
      moments.push({
        id: 'intl_debut',
        name: 'International Debut',
        description: `First cap for ${player.nationality}`,
        season: Math.min(seasonsPlayed, 8),
        milestone: true,
        icon: <Flag className="h-5 w-5" />,
      });
    }

    // 100 goals
    if (totalGoals >= 100) {
      moments.push({
        id: '100_goals',
        name: 'Century of Goals',
        description: 'Joined the elite 100-goal club',
        season: Math.min(seasonsPlayed, 15),
        milestone: true,
        icon: <Target className="h-5 w-5" />,
      });
    }

    // Contract signing (mock from current contract)
    moments.push({
      id: 'contract',
      name: 'Contract Signing',
      description: `${player.contract.yearsRemaining} years remaining at ${currentClub.name}`,
      season: 1,
      milestone: false,
      icon: <Shield className="h-5 w-5" />,
    });

    // Award ceremony
    if (unlockedAchievements.length >= 3) {
      moments.push({
        id: 'award',
        name: 'Award Ceremony',
        description: `Recognized for ${unlockedAchievements.length} career achievements`,
        season: Math.min(seasonsPlayed, 5),
        milestone: false,
        icon: <Award className="h-5 w-5" />,
      });
    }

    // Legend comparison
    const goalsPerSeason = seasonsPlayed > 0 ? totalGoals / seasonsPlayed : 0;
    const assistsPerSeason = seasonsPlayed > 0 ? totalAssists / seasonsPlayed : 0;

    let closestLegend = LEGENDS[0];
    let closestDistance = Infinity;
    for (const legend of LEGENDS) {
      const dist = Math.abs(legend.goalsPerSeason - goalsPerSeason) +
        Math.abs(legend.assistsPerSeason - assistsPerSeason);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestLegend = legend;
      }
    }

    // Legacy projection
    const projectedRetirementAge = Math.min(38, player.age + (38 - player.age > 0 ? Math.floor((player.fitness / 10)) : 0));
    const projectedSeasonsLeft = Math.max(0, projectedRetirementAge - player.age);
    const projectedTotalGoals = totalGoals + Math.round(goalsPerSeason * projectedSeasonsLeft * 0.8);
    const projectedTotalTrophies = totalTrophies + Math.round(projectedSeasonsLeft * 0.3);

    let legendStatus = 'Club Icon';
    if (projectedTotalGoals >= 200 && projectedTotalTrophies >= 10) legendStatus = 'Global Superstar';
    else if (projectedTotalTrophies >= 8 && intlCaps >= 50) legendStatus = 'National Hero';
    else if (projectedTotalGoals >= 150) legendStatus = 'League Legend';

    // Career span text
    const startYear = year - seasonsPlayed + 1;
    const endYearText = player.age >= 35 ? `${startYear + seasonsPlayed - 1}` : 'Present';

    return {
      player,
      currentClub,
      currentSeason,
      year,
      phase,
      totalGoals,
      totalAssists,
      totalApps,
      totalTrophies,
      intlCaps,
      seasonsPlayed,
      highestRating,
      seasonTimeline,
      clubPath,
      chartData,
      bestSeasonIdx,
      moments,
      unlockedAchievements,
      lockedAchievements,
      closestLegend,
      goalsPerSeason,
      assistsPerSeason,
      projectedRetirementAge,
      projectedSeasonsLeft,
      projectedTotalGoals,
      projectedTotalTrophies,
      legendStatus,
      startYear,
      endYearText,
      achCtx,
    };
  }, [gameState]);

  // ── Loading State ────────────────────────────────────────────
  if (!gameState || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8b949e] text-sm">No career data available.</p>
      </div>
    );
  }

  const {
    player, currentClub, phase,
    totalGoals, totalAssists, totalApps, totalTrophies,
    seasonTimeline, clubPath, chartData, bestSeasonIdx,
    moments, unlockedAchievements, lockedAchievements,
    closestLegend, goalsPerSeason, assistsPerSeason,
    projectedRetirementAge, projectedSeasonsLeft,
    projectedTotalGoals, projectedTotalTrophies, legendStatus,
    startYear, endYearText,
  } = data;

  // ── Section Navigation ───────────────────────────────────────
  const sections = [
    { id: 'seasons', label: 'Seasons', icon: <Calendar className="h-3.5 w-3.5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="h-3.5 w-3.5" /> },
    { id: 'charts', label: 'Charts', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'highlights', label: 'Highlights', icon: <Star className="h-3.5 w-3.5" /> },
    { id: 'legacy', label: 'Legacy', icon: <Crown className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      {/* ════════════════════════════════════════════════════════
          SECTION 1: CAREER TIMELINE HEADER
          ════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-6 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <Route className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#c9d1d9]">My Career</h1>
            <p className="text-xs text-[#8b949e]">
              {startYear} - {endYearText} · {data.seasonsPlayed} season{data.seasonsPlayed !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Career Phase Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
            style={{
              backgroundColor: phaseColor(phase) + '15',
              borderColor: phaseColor(phase) + '40',
            }}
          >
            <span className="text-sm">{phaseIcon(phase)}</span>
            <span className="text-[10px] font-bold" style={{ color: phaseColor(phase) }}>
              {phase}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Summary Badges Row ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: D * 2 }}
        className="grid grid-cols-4 gap-2 mb-4"
      >
        <SummaryBadge
          icon={<Crosshair className="h-3.5 w-3.5" />}
          value={totalGoals}
          label="Goals"
          color={C.emerald}
          delay={D * 2}
        />
        <SummaryBadge
          icon={<ArrowRight className="h-3.5 w-3.5" />}
          value={totalAssists}
          label="Assists"
          color={C.blue}
          delay={D * 3}
        />
        <SummaryBadge
          icon={<Trophy className="h-3.5 w-3.5" />}
          value={totalTrophies}
          label="Trophies"
          color={C.amber}
          delay={D * 4}
        />
        <SummaryBadge
          icon={<Shield className="h-3.5 w-3.5" />}
          value={data.seasonsPlayed}
          label="Seasons"
          color={C.violet}
          delay={D * 5}
        />
      </motion.div>

      {/* ════════════════════════════════════════════════════════
          SECTION 2: VISUAL CAREER PATH
          ════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: D * 6 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Route className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Career Path
          </span>
        </div>

        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex items-center gap-0 min-w-max">
            {clubPath.map((club, idx) => {
              const lc = leagueColor(club.league);
              return (
                <React.Fragment key={club.name}>
                  {/* Club Node */}
                  <div className="flex flex-col items-center min-w-[100px] relative">
                    {/* Current club pulsing indicator */}
                    {club.isCurrent && (
                      <motion.div
                        className="absolute -inset-2 rounded-lg border-2"
                        style={{ borderColor: C.emerald }}
                        animate={{ opacity: [0.6, 0.15, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    {/* Club badge */}
                    <div
                      className="relative w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: lc + '20',
                        borderColor: lc,
                      }}
                    >
                      {club.logo}
                    </div>
                    {/* Club info */}
                    <p className="text-[11px] font-bold text-[#c9d1d9] mt-1.5 text-center max-w-[90px] truncate">
                      {club.name}
                    </p>
                    <p className="text-[9px] text-[#8b949e]">
                      {club.startYear}{club.endYear ? ` - ${club.endYear}` : ' - Now'}
                    </p>
                    {/* League badge */}
                    <div
                      className="mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
                      style={{ backgroundColor: lc }}
                    >
                      {club.league.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    {club.isCurrent && (
                      <span className="mt-1 text-[8px] font-bold text-emerald-400">CURRENT</span>
                    )}
                  </div>

                  {/* Transfer Arrow */}
                  {idx < clubPath.length - 1 && (
                    <div className="flex items-center mx-2">
                      <div className="w-6 h-px bg-[#30363d]" />
                      <ArrowRight className="h-3 w-3 text-[#8b949e] -ml-0.5" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Section Tab Navigation ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: D * 7 }}
        className="flex items-center gap-1 mb-4 bg-[#161b22] border border-[#30363d] rounded-lg p-1"
      >
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-[10px] font-semibold transition-all ${
              activeSection === s.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-[#8b949e] hover:text-[#c9d1d9] border border-transparent'
            }`}
          >
            {s.icon}
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ════════════════════════════════════════════════════════
          SECTION 3: SEASON-BY-SEASON TIMELINE
          ════════════════════════════════════════════════════════ */}
      {activeSection === 'seasons' && (
        <div className="space-y-3">
          {seasonTimeline.map((season, idx) => {
            const allGoals = seasonTimeline.map((s) => s.stats.goals);
            const allRatings = seasonTimeline.filter((s) => s.stats.averageRating > 0).map((s) => s.stats.averageRating);
            const badge = getSeasonBadge(
              season.number,
              season.stats.goals,
              season.stats.assists,
              season.stats.averageRating,
              allGoals.map((g, i) => ({ goals: g, avgRating: allRatings[i] ?? 0 }))
            );
            const highlight = getSeasonHighlight(
              season.number,
              season.stats.goals,
              season.stats.assists,
              season.stats.averageRating,
              season.leaguePosition
            );

            return (
              <SeasonTimelineEntry
                key={season.number}
                season={season.number}
                year={season.year}
                clubLogo={currentClub.logo}
                clubName={currentClub.name}
                leaguePosition={season.leaguePosition}
                stats={season.stats}
                trophies={season.trophies}
                seasonBadge={badge}
                highlight={highlight}
                isCurrent={season.isCurrent}
                isLast={idx === seasonTimeline.length - 1}
                delay={D * 8 + idx * D}
              />
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 4: CAREER ACHIEVEMENTS MAP
          ════════════════════════════════════════════════════════ */}
      {activeSection === 'achievements' && (
        <div className="space-y-4">
          {/* Achievement Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: D * 8 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
                Achievement Progress
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {unlockedAchievements.length}/{CAREER_ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="w-full h-2 bg-[#21262d] rounded-sm overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: D * 9 }}
                style={{
                  width: `${CAREER_ACHIEVEMENTS.length > 0
                    ? (unlockedAchievements.length / CAREER_ACHIEVEMENTS.length) * 100
                    : 0
                  }%`,
                }}
              />
            </div>
          </motion.div>

          {/* Density Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: D * 10 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
              Achievement Density
            </span>
            <div className="flex items-end gap-1 mt-3 h-16">
              {seasonTimeline.map((s) => {
                const achCount = s.achievements.length + (s.trophies.length > 0 ? s.trophies.length * 2 : 0);
                const barHeight = Math.max(4, Math.min(64, achCount * 12));
                return (
                  <div key={s.number} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        backgroundColor: s.isCurrent ? C.emerald : C.blue,
                        height: `${barHeight}px`,
                        opacity: s.isCurrent ? 1 : 0.6,
                      }}
                    />
                    <span className="text-[8px] text-[#484f58]">S{s.number}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* SVG Vertical Timeline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: D * 11 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
              Achievement Timeline
            </span>

            <svg width="100%" viewBox="0 0 300 40 * CAREER_ACHIEVEMENTS.length" className="mt-3">
              {/* Central line */}
              <line x1="20" y1="0" x2="20" y2={40 * CAREER_ACHIEVEMENTS.length} stroke={C.border} strokeWidth="2" />

              {CAREER_ACHIEVEMENTS.map((ach, idx) => {
                const isUnlocked = unlockedAchievements.some((u) => u.id === ach.id);
                const yPos = idx * 40 + 20;
                return (
                  <g key={ach.id}>
                    {/* Node */}
                    <circle
                      cx="20"
                      cy={yPos}
                      r="6"
                      fill={isUnlocked ? C.emerald : C.elevated}
                      stroke={isUnlocked ? C.emerald : C.border}
                      strokeWidth="2"
                    />
                    {/* Check icon for unlocked */}
                    {isUnlocked && (
                      <path
                        d={`M${15},${yPos} l3,3 l6,-6`}
                        fill="none"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {/* Connection line */}
                    <line x1="28" y1={yPos} x2="40" y2={yPos} stroke={isUnlocked ? C.emerald : C.border} strokeWidth="1" />
                    {/* Achievement name */}
                    <text x="46" y={yPos - 4} fill={isUnlocked ? C.text : C.dim} fontSize="9" fontWeight="bold">
                      {ach.name}
                    </text>
                    {/* Description */}
                    <text x="46" y={yPos + 8} fill={isUnlocked ? C.muted : C.dim} fontSize="7">
                      {isUnlocked ? ach.description : ach.unlockCondition}
                    </text>
                    {/* Lock icon for locked */}
                    {!isUnlocked && (
                      <text x="280" y={yPos + 4} fill={C.dim} fontSize="10" textAnchor="end">
                        🔒
                      </text>
                    )}
                    {/* Star for unlocked */}
                    {isUnlocked && (
                      <text x="280" y={yPos + 4} fill={C.amber} fontSize="10" textAnchor="end">
                        ⭐
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </motion.div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 5: CAREER STATISTICS JOURNEY (SVG Charts)
          ════════════════════════════════════════════════════════ */}
      {activeSection === 'charts' && (
        <div className="space-y-4">
          {/* Combined Line Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: D * 8 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
                Stats Progression
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: C.emerald }} />
                  <span className="text-[8px] text-[#8b949e]">Goals</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: C.blue }} />
                  <span className="text-[8px] text-[#8b949e]">Assists</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: C.amber }} />
                  <span className="text-[8px] text-[#8b949e]">Rating</span>
                </div>
              </div>
            </div>

            {chartData.length > 0 ? (
              <CombinedStatsChart data={chartData} bestSeasonIdx={bestSeasonIdx} />
            ) : (
              <div className="flex items-center justify-center h-40 text-[#8b949e] text-xs">
                Play some matches to see your stats progression
              </div>
            )}
          </motion.div>

          {/* Goals Per Season Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: D * 10 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
              Goals & Assists Per Season
            </span>
            {chartData.length > 0 ? (
              <GoalsAssistsBarChart data={chartData} />
            ) : (
              <div className="flex items-center justify-center h-32 text-[#8b949e] text-xs">
                No data yet
              </div>
            )}
          </motion.div>

          {/* Average Rating Chart */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: D * 12 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
              Average Rating Per Season
            </span>
            {chartData.length > 0 ? (
              <RatingLineChart data={chartData} />
            ) : (
              <div className="flex items-center justify-center h-32 text-[#8b949e] text-xs">
                No data yet
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 6: CAREER HIGHLIGHTS REEL
          ════════════════════════════════════════════════════════ */}
      {activeSection === 'highlights' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: D * 8 }}
        >
          {moments.length > 0 ? (
            <div className="space-y-2">
              {moments.map((moment, idx) => (
                <HighlightMomentCard
                  key={moment.id}
                  moment={moment}
                  delay={D * 9 + idx * D}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center">
              <Star className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
              <p className="text-sm text-[#8b949e]">No career moments yet</p>
              <p className="text-[10px] text-[#484f58] mt-1">
                Play matches and achieve milestones to fill your timeline
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 7: LEGACY PROJECTION
          ════════════════════════════════════════════════════════ */}
      {activeSection === 'legacy' && (
        <div className="space-y-4">
          {/* Career End Projection */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: D * 8 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
                Where Will You End Up?
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-center">
                <p className="text-[9px] text-[#8b949e] mb-1">Projected Retirement Age</p>
                <p className="text-lg font-bold text-[#c9d1d9]">{projectedRetirementAge}</p>
              </div>
              <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-center">
                <p className="text-[9px] text-[#8b949e] mb-1">Seasons Remaining</p>
                <p className="text-lg font-bold text-[#c9d1d9]">{projectedSeasonsLeft}</p>
              </div>
              <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-center">
                <p className="text-[9px] text-[#8b949e] mb-1">Projected Career Goals</p>
                <p className="text-lg font-bold text-emerald-400">{projectedTotalGoals}</p>
              </div>
              <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-center">
                <p className="text-[9px] text-[#8b949e] mb-1">Projected Trophies</p>
                <p className="text-lg font-bold text-amber-400">{projectedTotalTrophies}</p>
              </div>
            </div>

            {/* Legend Status */}
            <div
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{
                backgroundColor: C.amber + '10',
                borderColor: C.amber + '30',
              }}
            >
              <span className="text-2xl">👑</span>
              <div>
                <p className="text-[10px] text-[#8b949e]">Projected Status</p>
                <p className="text-sm font-bold text-amber-400">{legendStatus}</p>
              </div>
            </div>
          </motion.div>

          {/* Legend Similarity Comparison */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: D * 10 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
                Career Comparison
              </span>
            </div>

            <p className="text-xs text-[#c9d1d9] mb-3">
              Your career is most similar to{' '}
              <span className="font-bold text-emerald-400">{closestLegend.flag} {closestLegend.name}</span>
            </p>

            {/* Comparison Bar Chart */}
            <LegendComparisonChart
              playerName={player.name}
              legend={closestLegend}
              playerGoalsPerSeason={goalsPerSeason}
              playerAssistsPerSeason={assistsPerSeason}
              playerTrophies={totalTrophies}
              playerCaps={data.intlCaps}
              playerSeasons={data.seasonsPlayed}
            />
          </motion.div>

          {/* Career Journey Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: D * 12 }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
          >
            <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
              Career Summary
            </span>
            <div className="mt-3 space-y-2">
              <SummaryRow
                label="Current Club"
                value={`${currentClub.logo} ${currentClub.name}`}
                delay={D * 13}
              />
              <SummaryRow
                label="Position"
                value={player.position}
                delay={D * 14}
              />
              <SummaryRow
                label="Overall Rating"
                value={`${player.overall}`}
                delay={D * 15}
              />
              <SummaryRow
                label="Goals / Assists"
                value={`${totalGoals} / ${totalAssists}`}
                delay={D * 16}
              />
              <SummaryRow
                label="International Caps"
                value={`${data.intlCaps}`}
                delay={D * 17}
              />
              <SummaryRow
                label="Achievements Unlocked"
                value={`${unlockedAchievements.length} / ${CAREER_ACHIEVEMENTS.length}`}
                delay={D * 18}
              />
              <SummaryRow
                label="Highest Match Rating"
                value={data.highestRating > 0 ? data.highestRating.toFixed(1) : 'N/A'}
                delay={D * 19}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

// ── Summary Badge ─────────────────────────────────────────────
function SummaryBadge({
  icon,
  value,
  label,
  color,
  delay,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex flex-col items-center gap-1"
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-base font-bold tabular-nums text-[#c9d1d9]">{value}</span>
      <span className="text-[9px] text-[#8b949e]">{label}</span>
    </motion.div>
  );
}

// ── Season Timeline Entry ─────────────────────────────────────
function SeasonTimelineEntry({
  season,
  year,
  clubLogo,
  clubName,
  leaguePosition,
  stats,
  trophies,
  seasonBadge,
  highlight,
  isCurrent,
  isLast,
  delay,
}: {
  season: number;
  year: number;
  clubLogo: string;
  clubName: string;
  leaguePosition: number;
  stats: { appearances: number; goals: number; assists: number; averageRating: number; manOfTheMatch: number };
  trophies: { name: string; season: number }[];
  seasonBadge: string | null;
  highlight: string;
  isCurrent: boolean;
  isLast: boolean;
  delay: number;
}) {
  const badgeColor = seasonBadge === 'Best Season'
    ? C.amber
    : seasonBadge === 'Breakthrough Season'
      ? C.emerald
      : seasonBadge === 'Worst Season'
        ? C.red
        : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
    >
      {/* Season Header */}
      <div className="flex items-center gap-3 mb-2.5">
        {/* Timeline dot */}
        <div className="relative flex flex-col items-center">
          <div
            className="w-3 h-3 rounded-sm border-2"
            style={{
              borderColor: isCurrent ? C.emerald : C.border,
              backgroundColor: isCurrent ? C.emerald : 'transparent',
            }}
          />
          {!isLast && (
            <div className="w-px flex-1 min-h-[8px] bg-[#30363d]" />
          )}
        </div>

        {/* Season info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#c9d1d9]">Season {season}</span>
            <span className="text-[9px] text-[#8b949e]">({year})</span>
            {isCurrent && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                CURRENT
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm">{clubLogo}</span>
            <span className="text-[10px] text-[#8b949e]">{clubName}</span>
            {leaguePosition > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 bg-[#21262d] border border-[#30363d] rounded-sm text-[#8b949e] font-bold">
                #{leaguePosition}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <StatPill label="Apps" value={stats.appearances} color={C.blue} />
        <StatPill label="Goals" value={stats.goals} color={C.emerald} />
        <StatPill label="Assists" value={stats.assists} color={C.blue} />
        <StatPill
          label="Avg"
          value={stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
          color={stats.averageRating >= 7.0 ? C.emerald : stats.averageRating >= 6.0 ? C.amber : C.red}
        />
      </div>

      {/* Trophies */}
      {trophies.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {trophies.map((trophy, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-sm text-amber-400 font-bold"
            >
              🏆 {trophy.name}
            </span>
          ))}
        </div>
      )}

      {/* Season Badge */}
      {seasonBadge && badgeColor && (
        <div
          className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-sm font-bold mb-2"
          style={{
            backgroundColor: badgeColor + '15',
            color: badgeColor,
            border: `1px solid ${badgeColor}40`,
          }}
        >
          {seasonBadge === 'Best Season' && <Star className="h-3 w-3" />}
          {seasonBadge === 'Breakthrough Season' && <Zap className="h-3 w-3" />}
          {seasonBadge === 'Worst Season' && <Activity className="h-3 w-3" />}
          {seasonBadge}
        </div>
      )}

      {/* Highlight Text */}
      <p className="text-[10px] text-[#8b949e] leading-relaxed">{highlight}</p>
    </motion.div>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────
function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center py-1.5 px-1 bg-[#0d1117] rounded-lg border border-[#21262d]">
      <span className="text-xs font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
      <span className="text-[8px] text-[#484f58] mt-0.5">{label}</span>
    </div>
  );
}

// ── Highlight Moment Card ─────────────────────────────────────
function HighlightMomentCard({
  moment,
  delay,
}: {
  moment: CareerMoment;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay }}
      className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-start gap-3"
    >
      {/* SVG Placeholder */}
      <div className="w-12 h-12 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#30363d" strokeWidth="1" />
          <circle cx="16" cy="16" r="8" fill="none" stroke="#484f58" strokeWidth="1" />
          <line x1="16" y1="2" x2="16" y2="30" stroke="#30363d" strokeWidth="0.5" />
          <line x1="2" y1="16" x2="30" y2="16" stroke="#30363d" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#c9d1d9]">{moment.name}</span>
          {moment.milestone && (
            <span className="text-[7px] px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold rounded-sm">
              MILESTONE
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#8b949e] mt-0.5 truncate">{moment.description}</p>
        <p className="text-[9px] text-[#484f58] mt-0.5">Season {moment.season}</p>
      </div>

      {/* Icon */}
      <div className="text-emerald-400 shrink-0 mt-0.5">{moment.icon}</div>
    </motion.div>
  );
}

// ── Combined Stats Chart (SVG) ────────────────────────────────
function CombinedStatsChart({
  data,
  bestSeasonIdx,
}: {
  data: { season: number; goals: number; assists: number; avgRating: number }[];
  bestSeasonIdx: number;
}) {
  if (data.length === 0) return null;

  const W = 320;
  const H = 160;
  const pad = { top: 15, right: 40, bottom: 25, left: 35 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const maxGoalsAssists = Math.max(5, ...data.map((d) => Math.max(d.goals, d.assists)));
  const minRating = 4;
  const maxRating = 10;

  // Left Y-axis: Goals/Assists (0 to maxGoalsAssists)
  const toYLeft = (val: number) => pad.top + plotH - (val / maxGoalsAssists) * plotH;
  // Right Y-axis: Rating (4 to 10)
  const toYRight = (val: number) => pad.top + plotH - ((val - minRating) / (maxRating - minRating)) * plotH;

  const toX = (i: number) => pad.left + (i / Math.max(1, data.length - 1)) * plotW;

  const goalsPoints = data.map((d, i) => `${toX(i)},${toYLeft(d.goals)}`).join(' ');
  const assistsPoints = data.map((d, i) => `${toX(i)},${toYLeft(d.assists)}`).join(' ');
  const ratingPoints = data.map((d, i) => `${toX(i)},${toYRight(d.avgRating)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = pad.top + plotH * (1 - frac);
        return (
          <line
            key={`grid-${frac}`}
            x1={pad.left} y1={y} x2={W - pad.right} y2={y}
            stroke="#21262d" strokeWidth="0.5" strokeDasharray="3,3"
          />
        );
      })}

      {/* Left Y-axis labels (Goals/Assists) */}
      {[0, maxGoalsAssists / 2, maxGoalsAssists].map((val) => (
        <text key={`yl-${val}`} x={pad.left - 4} y={toYLeft(val) + 3} textAnchor="end" fill="#484f58" fontSize="7">
          {Math.round(val)}
        </text>
      ))}

      {/* Right Y-axis labels (Rating) */}
      {[minRating, 7, maxRating].map((val) => (
        <text key={`yr-${val}`} x={W - pad.right + 4} y={toYRight(val) + 3} textAnchor="start" fill="#484f58" fontSize="7">
          {val}
        </text>
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text key={`xl-${i}`} x={toX(i)} y={H - 5} textAnchor="middle" fill="#484f58" fontSize="7">
          S{d.season}
        </text>
      ))}

      {/* Best season highlight */}
      {data.length > 1 && (
        <rect
          x={toX(bestSeasonIdx) - plotW / data.length / 2}
          y={pad.top}
          width={plotW / data.length}
          height={plotH}
          fill={C.amber}
          opacity={0.08}
          rx={4}
        />
      )}

      {/* Goals line */}
      {data.length > 1 && (
        <polyline points={goalsPoints} fill="none" stroke={C.emerald} strokeWidth="2" strokeLinejoin="round" />
      )}
      {/* Assists line */}
      {data.length > 1 && (
        <polyline points={assistsPoints} fill="none" stroke={C.blue} strokeWidth="2" strokeLinejoin="round" />
      )}
      {/* Rating line (dashed) */}
      {data.length > 1 && (
        <polyline points={ratingPoints} fill="none" stroke={C.amber} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4,3" />
      )}

      {/* Data points */}
      {data.map((d, i) => {
        const x = toX(i);
        return (
          <g key={`pts-${i}`}>
            <circle cx={x} cy={toYLeft(d.goals)} r="3" fill={C.emerald} />
            <circle cx={x} cy={toYLeft(d.assists)} r="3" fill={C.blue} />
            {d.avgRating > 0 && (
              <circle cx={x} cy={toYRight(d.avgRating)} r="2.5" fill={C.amber} />
            )}
          </g>
        );
      })}

      {/* Trend line for goals (dotted) */}
      {data.length >= 3 && (() => {
        const recentGoals = data.slice(-3);
        const avg = recentGoals.reduce((s, d) => s + d.goals, 0) / recentGoals.length;
        const trendY = toYLeft(avg);
        return (
          <line
            x1={pad.left} y1={trendY} x2={W - pad.right} y2={trendY}
            stroke={C.emerald} strokeWidth="1" strokeDasharray="2,4" opacity={0.4}
          />
        );
      })()}
    </svg>
  );
}

// ── Goals & Assists Bar Chart ─────────────────────────────────
function GoalsAssistsBarChart({
  data,
}: {
  data: { season: number; goals: number; assists: number; avgRating: number }[];
}) {
  if (data.length === 0) return null;

  const W = 320;
  const H = 120;
  const pad = { top: 10, right: 10, bottom: 25, left: 30 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const maxVal = Math.max(5, ...data.map((d) => Math.max(d.goals, d.assists)));
  const barGroupWidth = plotW / data.length;
  const barWidth = Math.min(12, barGroupWidth * 0.3);
  const gap = 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-3">
      {/* Grid lines */}
      {[0, 0.5, 1].map((frac) => {
        const y = pad.top + plotH * (1 - frac);
        return (
          <g key={`gbar-${frac}`}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={pad.left - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">
              {Math.round(maxVal * frac)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const groupX = pad.left + i * barGroupWidth + barGroupWidth / 2;
        const goalsH = (d.goals / maxVal) * plotH;
        const assistsH = (d.assists / maxVal) * plotH;

        return (
          <g key={`bars-${i}`}>
            {/* Goals bar */}
            <rect
              x={groupX - barWidth - gap / 2}
              y={pad.top + plotH - goalsH}
              width={barWidth}
              height={Math.max(0, goalsH)}
              fill={C.emerald}
              rx={2}
              opacity={0.8}
            />
            {/* Assists bar */}
            <rect
              x={groupX + gap / 2}
              y={pad.top + plotH - assistsH}
              width={barWidth}
              height={Math.max(0, assistsH)}
              fill={C.blue}
              rx={2}
              opacity={0.8}
            />
            {/* Label */}
            <text x={groupX} y={H - 5} textAnchor="middle" fill="#484f58" fontSize="7">
              S{d.season}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Rating Line Chart ─────────────────────────────────────────
function RatingLineChart({
  data,
}: {
  data: { season: number; goals: number; assists: number; avgRating: number }[];
}) {
  if (data.length === 0) return null;

  const filteredData = data.filter((d) => d.avgRating > 0);
  if (filteredData.length === 0) return null;

  const W = 320;
  const H = 100;
  const pad = { top: 10, right: 10, bottom: 25, left: 30 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const minR = 4;
  const maxR = 10;
  const toY = (val: number) => pad.top + plotH - ((val - minR) / (maxR - minR)) * plotH;
  const toX = (i: number) => pad.left + (i / Math.max(1, filteredData.length - 1)) * plotW;

  const points = filteredData.map((d, i) => `${toX(i)},${toY(d.avgRating)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-3">
      {/* Grid lines */}
      {[5, 6, 7, 8, 9].map((val) => {
        const y = toY(val);
        return (
          <g key={`rgrid-${val}`}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#21262d" strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={pad.left - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">
              {val}
            </text>
          </g>
        );
      })}

      {/* Rating area fill */}
      {filteredData.length > 1 && (
        <polygon
          points={`${pad.left},${pad.top + plotH} ${points} ${pad.left + plotW},${pad.top + plotH}`}
          fill={C.amber}
          opacity={0.08}
        />
      )}

      {/* Line */}
      {filteredData.length > 1 && (
        <polyline points={points} fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />
      )}

      {/* Points */}
      {filteredData.map((d, i) => (
        <g key={`rpt-${i}`}>
          <circle cx={toX(i)} cy={toY(d.avgRating)} r="3" fill={C.amber} />
          <text x={toX(i)} y={toY(d.avgRating) - 6} textAnchor="middle" fill={C.amber} fontSize="7" fontWeight="bold">
            {d.avgRating.toFixed(1)}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {filteredData.map((d, i) => (
        <text key={`rxl-${i}`} x={toX(i)} y={H - 5} textAnchor="middle" fill="#484f58" fontSize="7">
          S{d.season}
        </text>
      ))}
    </svg>
  );
}

// ── Legend Comparison Chart ────────────────────────────────────
function LegendComparisonChart({
  playerName,
  legend,
  playerGoalsPerSeason,
  playerAssistsPerSeason,
  playerTrophies,
  playerCaps,
  playerSeasons,
}: {
  playerName: string;
  legend: LegendComparison;
  playerGoalsPerSeason: number;
  playerAssistsPerSeason: number;
  playerTrophies: number;
  playerCaps: number;
  playerSeasons: number;
}) {
  const metrics = [
    { label: 'Goals/Season', player: playerGoalsPerSeason, legend: legend.goalsPerSeason, color: C.emerald },
    { label: 'Assists/Season', player: playerAssistsPerSeason, legend: legend.assistsPerSeason, color: C.blue },
    { label: 'Trophies', player: playerTrophies, legend: legend.trophies, color: C.amber },
    { label: 'Int. Caps', player: playerCaps, legend: legend.caps, color: C.violet },
  ];

  return (
    <div className="space-y-3">
      {/* Player vs Legend header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-emerald-400">{playerName}</span>
        <span className="text-[10px] font-bold text-[#8b949e]">{legend.flag} {legend.name}</span>
      </div>

      {/* Bar comparisons */}
      {metrics.map((m) => {
        const maxVal = Math.max(m.player, m.legend, 1);
        const playerPct = (m.player / maxVal) * 100;
        const legendPct = (m.legend / maxVal) * 100;

        return (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#8b949e]">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-emerald-400 tabular-nums">{m.player.toFixed(1)}</span>
                <span className="text-[9px] text-[#484f58]">vs</span>
                <span className="text-[9px] font-bold text-[#8b949e] tabular-nums">{m.legend}</span>
              </div>
            </div>
            {/* Player bar */}
            <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
              <motion.div
                className="h-full rounded-sm"
                style={{ backgroundColor: m.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {/* Legend bar (thinner, below) */}
            <div className="h-1 bg-[#21262d] rounded-sm overflow-hidden">
              <motion.div
                className="h-full rounded-sm bg-[#484f58]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Summary Row ───────────────────────────────────────────────
function SummaryRow({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1, delay }}
      className="flex items-center justify-between py-1.5 border-b border-[#21262d] last:border-0"
    >
      <span className="text-[10px] text-[#8b949e]">{label}</span>
      <span className="text-[10px] font-bold text-[#c9d1d9] tabular-nums">{value}</span>
    </motion.div>
  );
}
