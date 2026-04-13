'use client';

import React, { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { CoreAttribute, PlayerAttributes, SeasonPlayerStats } from '@/lib/game/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Target,
  Handshake,
  Star,
  Trophy,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Flame,
  Award,
  Zap,
  Clock,
  Shield,
  Crown,
  Hash,
  Footprints,
  Wind,
  Swords,
  Users,
  CircleDot,
  GitCompareArrows,
  ChevronLeft,
  ChevronRight,
  Medal,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────
const ANIM = { duration: 0.18, ease: 'easeOut' as const };

const ATTR_KEYS: CoreAttribute[] = [
  'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical',
];

const ATTR_LABELS: Record<CoreAttribute, string> = {
  pace: 'Pace', shooting: 'Shooting', passing: 'Passing',
  dribbling: 'Dribbling', defending: 'Defending', physical: 'Physical',
};

const CLUB_EMOJIS = ['⚽', '🏟️', '🦁', '🦅', '🐺', '🐂', ' ⚜️', '🌟', '💫', '🔥'];

const RATING_BUCKETS = [
  { label: '1-3', min: 1, max: 3, color: '#ef4444', tier: 'Disastrous' },
  { label: '3-5', min: 3, max: 5, color: '#f97316', tier: 'Poor' },
  { label: '5-6', min: 5, max: 6, color: '#f59e0b', tier: 'Below Avg' },
  { label: '6-7', min: 6, max: 7, color: '#eab308', tier: 'Average' },
  { label: '7-8', min: 7, max: 8, color: '#22c55e', tier: 'Good' },
  { label: '8-10', min: 8, max: 10, color: '#10b981', tier: 'Excellent' },
];

// ── Helpers ────────────────────────────────────────────────
function getRatingColor(rating: number): string {
  if (rating >= 7.5) return '#22c55e';
  if (rating >= 6.0) return '#f59e0b';
  return '#ef4444';
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// Deterministic season data generation from player age / attributes
function generateHistoricalSeasons(
  playerAge: number,
  currentAttrs: PlayerAttributes,
  currentOverall: number,
  currentSeasonStats: SeasonPlayerStats,
  completedSeasons: { number: number; playerStats: SeasonPlayerStats; leaguePosition: number }[],
  baseYear: number,
): {
  number: number;
  year: number;
  clubName: string;
  clubLogo: string;
  leaguePosition: number;
  stats: SeasonPlayerStats & {
    bestRating: number;
    worstRating: number;
    consistencyScore: number;
    subAppearances: number;
    goalsPer90: number;
    assistsPer90: number;
  };
}[] {
  const rng = seededRandom(playerAge * 1000 + currentOverall);
  type EnrichedSeason = (typeof completedSeasons)[number] & { year: number; clubName: string; clubLogo: string };
  const seasons: EnrichedSeason[] = [];

  for (let i = 0; i < completedSeasons.length; i++) {
    const s = completedSeasons[i];
    seasons.push({
      number: s.number,
      playerStats: s.playerStats,
      leaguePosition: s.leaguePosition,
      year: baseYear + s.number - 1,
      clubName: ['Academy FC', 'City Rangers', 'United FC', 'Athletic', 'Sporting'][i % 5],
      clubLogo: CLUB_EMOJIS[i % CLUB_EMOJIS.length],
    });
  }

  // If no completed seasons, generate plausible history from age
  if (completedSeasons.length === 0) {
    const seniorAge = Math.max(16, playerAge - 2);
    const seasonsCount = Math.max(0, playerAge - seniorAge);
    for (let i = 0; i < Math.min(seasonsCount, 8); i++) {
      const seasonNum = i + 1;
      const seasonAge = seniorAge + i;
      const potentialFactor = Math.min(1, seasonAge / 24);
      const apps = Math.round(10 + rng() * 25 * potentialFactor);
      const mins = apps * (45 + Math.round(rng() * 45));
      const goals = Math.round(rng() * 8 * potentialFactor);
      const assists = Math.round(rng() * 6 * potentialFactor);
      const avgRating = parseFloat((4.5 + rng() * 3.5 * potentialFactor).toFixed(1));
      seasons.push({
        number: seasonNum,
        playerStats: {
          appearances: apps,
          starts: Math.round(apps * (0.5 + rng() * 0.5)),
          minutesPlayed: mins,
          goals,
          assists,
          cleanSheets: Math.round(rng() * 3),
          yellowCards: Math.round(rng() * 5),
          redCards: rng() > 0.85 ? 1 : 0,
          averageRating: avgRating,
          manOfTheMatch: Math.round(rng() * 3 * potentialFactor),
          injuries: Math.round(rng() * 3),
        },
        leaguePosition: Math.max(1, Math.round(1 + rng() * 15)),
        year: baseYear + seasonNum - 1,
        clubName: ['Academy FC', 'City Rangers', 'United FC', 'Athletic', 'Sporting'][i % 5],
        clubLogo: CLUB_EMOJIS[i % CLUB_EMOJIS.length],
      });
    }
  }

  // Build enriched season data
  return seasons.map((s) => {
    const stats = 'playerStats' in s ? s.playerStats : s;
    const minsPlayed = stats.minutesPlayed || stats.appearances * 80;
    const bestRating = parseFloat((stats.averageRating + 1 + rng() * 1.5).toFixed(1));
    const worstRating = parseFloat((stats.averageRating - 1 - rng() * 1.5).toFixed(1));
    const subAppearances = stats.appearances - (stats.starts || Math.round(stats.appearances * 0.7));
    const ninetyMins = Math.max(1, minsPlayed / 90);
    return {
      number: s.number,
      year: s.year,
      clubName: s.clubName,
      clubLogo: s.clubLogo,
      leaguePosition: s.leaguePosition,
      stats: {
        ...stats,
        bestRating,
        worstRating,
        consistencyScore: Math.max(0, Math.min(100, Math.round(100 - standardDeviation(
          Array.from({ length: stats.appearances || 5 }, () => stats.averageRating + (rng() - 0.5) * 2)
        ) * 25))),
        subAppearances: Math.max(0, subAppearances),
        goalsPer90: parseFloat((stats.goals / ninetyMins).toFixed(2)),
        assistsPer90: parseFloat((stats.assists / ninetyMins).toFixed(2)),
      },
    };
  });
}

// ── Sub-components ─────────────────────────────────────────

function SectionCard({ title, icon, children, delay = 0 }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      className="bg-[#161b22] border border-[#30363d] rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...ANIM, delay }}
    >
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-[#30363d]">
        <span className="text-emerald-400">{icon}</span>
        <span className="text-xs text-[#c9d1d9] font-semibold">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

function MiniStatGrid({ stats }: { stats: { label: string; value: string | number; color?: string; trend?: number[] }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="bg-[#21262d] rounded-md p-2.5 border border-[#30363d] flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...ANIM, delay: 0.02 * i }}
        >
          <span className="text-[9px] text-[#8b949e] text-center leading-tight">{s.label}</span>
          <span className={`text-sm font-bold tabular-nums ${s.color || 'text-[#c9d1d9]'}`}>{s.value}</span>
          {s.trend && s.trend.length >= 2 && (
            <MiniSparkline values={s.trend} color={s.color || '#10b981'} />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function MiniSparkline({ values, color = '#10b981' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const w = 60;
  const h = 16;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="block">
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function CircularProgressRing({ value, max, size = 36, strokeWidth = 3, color = '#10b981' }: {
  value: number; max: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(1, value / max) : 0;
  const offset = circumference * (1 - progress);
  return (
    <svg width={size} height={size} className="block -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#21262d" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function CareerStatsDeepDive() {
  const gameState = useGameStore((s) => s.gameState);
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState<number | null>(null);
  const [compareSeasons, setCompareSeasons] = useState<[number | null, number | null]>([null, null]);
  const [trendTab, setTrendTab] = useState<'goals' | 'rating' | 'minutes'>('goals');

  const data = useMemo(() => {
    if (!gameState) return null;
    const { player, seasons, recentResults, currentSeason, year, currentClub } = gameState;
    const career = player.careerStats;
    const season = player.seasonStats;

    const totalApps = career.totalAppearances || season.appearances;
    const totalGoals = career.totalGoals || season.goals;
    const totalAssists = career.totalAssists || season.assists;
    const trophies = career.trophies ?? [];
    const yearsPlayed = player.age - 14 || 1;

    // Historical season data
    const enrichedSeasons = generateHistoricalSeasons(
      player.age, player.attributes, player.overall, season,
      seasons.map(s => ({ number: s.number, playerStats: s.playerStats, leaguePosition: s.leaguePosition })),
      year,
    );

    // Current season
    const currentPos = gameState.leagueTable.findIndex(e => e.clubId === currentClub.id) + 1;
    const currentEnriched = {
      number: currentSeason,
      year: year,
      clubName: currentClub.name,
      clubLogo: currentClub.logo,
      leaguePosition: currentPos || 0,
      stats: {
        ...season,
        bestRating: parseFloat((season.averageRating + 1.2).toFixed(1)),
        worstRating: parseFloat((season.averageRating - 1.2).toFixed(1)),
        consistencyScore: Math.max(0, Math.min(100, Math.round(100 - standardDeviation(
          recentResults.map(r => r.playerRating).filter(r => r > 0).slice(0, 20)
        ) * 25))),
        subAppearances: Math.max(0, season.appearances - season.starts),
        goalsPer90: season.minutesPlayed > 0 ? parseFloat((season.goals / (season.minutesPlayed / 90)).toFixed(2)) : 0,
        assistsPer90: season.minutesPlayed > 0 ? parseFloat((season.assists / (season.minutesPlayed / 90)).toFixed(2)) : 0,
      },
    };

    const allSeasons = [...enrichedSeasons, currentEnriched];

    // All match ratings from recent results and season data
    const allRatings = recentResults.map(r => r.playerRating).filter(r => r > 0);
    const bestAvgRating = allSeasons.length > 0
      ? Math.max(...allSeasons.map(s => s.stats.averageRating))
      : 0;
    const bestSeasonIdx = allSeasons.findIndex(s => s.stats.averageRating === bestAvgRating);

    // Career records
    const mostGoalsSeason = allSeasons.length > 0
      ? allSeasons.reduce((best, s) => s.stats.goals > best.stats.goals ? s : best, allSeasons[0])
      : null;
    const mostAssistsSeason = allSeasons.length > 0
      ? allSeasons.reduce((best, s) => s.stats.assists > best.stats.assists ? s : best, allSeasons[0])
      : null;
    const highestRatingSeason = allSeasons.length > 0
      ? allSeasons.reduce((best, s) => s.stats.bestRating > best.stats.bestRating ? s : best, allSeasons[0])
      : null;
    const mostMotmSeason = allSeasons.length > 0
      ? allSeasons.reduce((best, s) => s.stats.manOfTheMatch > best.stats.manOfTheMatch ? s : best, allSeasons[0])
      : null;

    // Unbeaten streak (rating >= 6.0 in consecutive results)
    let maxUnbeaten = 0, currentUnbeaten = 0;
    for (const r of [...recentResults].reverse()) {
      if (r.playerRating >= 6.0) { currentUnbeaten++; maxUnbeaten = Math.max(maxUnbeaten, currentUnbeaten); }
      else currentUnbeaten = 0;
    }

    // Consecutive starts from recentResults
    let maxConsecStarts = 0, consecStarts = 0;
    for (const r of [...recentResults].reverse()) {
      if (r.playerStarted) { consecStarts++; maxConsecStarts = Math.max(maxConsecStarts, consecStarts); }
      else consecStarts = 0;
    }

    // Best scoring run
    let maxScoringRun = 0, scoringRun = 0;
    for (const r of [...recentResults].reverse()) {
      if (r.playerGoals > 0) { scoringRun++; maxScoringRun = Math.max(maxScoringRun, scoringRun); }
      else scoringRun = 0;
    }

    // Attribute development: Debut, Mid-Career, Current
    const debutAttrs: Record<CoreAttribute, number> = {
      pace: Math.max(30, player.attributes.pace - 10 - Math.round(player.age * 0.3)),
      shooting: Math.max(25, player.attributes.shooting - 12 - Math.round(player.age * 0.2)),
      passing: Math.max(28, player.attributes.passing - 10 - Math.round(player.age * 0.25)),
      dribbling: Math.max(26, player.attributes.dribbling - 11 - Math.round(player.age * 0.2)),
      defending: Math.max(20, player.attributes.defending - 8 - Math.round(player.age * 0.15)),
      physical: Math.max(30, player.attributes.physical - 9 - Math.round(player.age * 0.2)),
    };
    const midCareerAttrs: Record<CoreAttribute, number> = ATTR_KEYS.reduce((acc, k) => {
      acc[k] = Math.round((debutAttrs[k] + player.attributes[k]) / 2);
      return acc;
    }, {} as Record<CoreAttribute, number>);
    const currentAttrs: Record<CoreAttribute, number> = ATTR_KEYS.reduce((acc, k) => {
      acc[k] = player.attributes[k];
      return acc;
    }, {} as Record<CoreAttribute, number>);

    // Performance distribution
    const distCounts = RATING_BUCKETS.map(b =>
      allRatings.filter(r => r >= b.min && r < b.max).length
    );
    const maxDistCount = Math.max(...distCounts, 1);

    // Most common rating
    const ratingMode = allRatings.length > 0
      ? allRatings.sort((a, b) => a - b)[Math.floor(allRatings.length / 2)]
      : 0;

    // Best 10% threshold
    const sortedRatings = [...allRatings].sort((a, b) => a - b);
    const top10Idx = Math.max(0, Math.floor(sortedRatings.length * 0.9));
    const best10Pct = sortedRatings.length > 0 ? sortedRatings[top10Idx] : 0;

    // Milestones for progress rings
    const milestones = [
      { current: totalApps, next: totalApps < 50 ? 50 : totalApps < 100 ? 100 : totalApps < 250 ? 250 : totalApps < 500 ? 500 : 1000, label: 'Apps', color: '#38bdf8' },
      { current: totalGoals, next: totalGoals < 10 ? 10 : totalGoals < 25 ? 25 : totalGoals < 50 ? 50 : totalGoals < 100 ? 100 : 200, label: 'Goals', color: '#22c55e' },
      { current: totalAssists, next: totalAssists < 10 ? 10 : totalAssists < 25 ? 25 : totalAssists < 50 ? 50 : totalAssists < 100 ? 100 : 200, label: 'Assists', color: '#06b6d4' },
      { current: trophies.length, next: trophies.length < 1 ? 1 : trophies.length < 3 ? 3 : trophies.length < 5 ? 5 : 10, label: 'Trophies', color: '#f59e0b' },
      { current: yearsPlayed, next: yearsPlayed < 3 ? 3 : yearsPlayed < 5 ? 5 : yearsPlayed < 10 ? 10 : 15, label: 'Years', color: '#a855f7' },
    ];

    // Season comparison verdicts
    function getComparisonVerdict(s1: typeof currentEnriched, s2: typeof currentEnriched): string {
      const gDiff = s2.stats.goals - s1.stats.goals;
      const aDiff = s2.stats.assists - s1.stats.assists;
      const rDiff = s2.stats.averageRating - s1.stats.averageRating;
      if (gDiff > 3 && aDiff > 2) return `Season ${s2.number} was your peak attacking season`;
      if (rDiff > 0.5) return `Season ${s2.number} was your most consistent season`;
      if (gDiff > 5) return `Season ${s2.number} was your best goal-scoring season`;
      if (s2.stats.manOfTheMatch > s1.stats.manOfTheMatch + 2) return `Season ${s2.number} had more match-winning performances`;
      if (gDiff < -3 && rDiff < -0.3) return `Season ${s1.number} was the better overall season`;
      return 'Both seasons were closely matched';
    }

    return {
      player, allSeasons, bestSeasonIdx,
      totalApps, totalGoals, totalAssists, trophies, yearsPlayed,
      milestones, bestAvgRating,
      mostGoalsSeason, mostAssistsSeason, highestRatingSeason, mostMotmSeason,
      maxUnbeaten, maxConsecStarts, maxScoringRun,
      debutAttrs, midCareerAttrs, currentAttrs,
      distCounts, maxDistCount, ratingMode, best10Pct, allRatings,
      getComparisonVerdict,
    };
  }, [gameState]);

  if (!gameState || !data) return null;
  const {
    player, allSeasons, bestSeasonIdx,
    totalApps, totalGoals, totalAssists, trophies, yearsPlayed,
    milestones, bestAvgRating,
    mostGoalsSeason, mostAssistsSeason, highestRatingSeason, mostMotmSeason,
    maxUnbeaten, maxConsecStarts, maxScoringRun,
    debutAttrs, midCareerAttrs, currentAttrs,
    distCounts, maxDistCount, ratingMode, best10Pct, allRatings,
    getComparisonVerdict,
  } = data;

  const selectedSeason = selectedSeasonIdx !== null ? allSeasons[selectedSeasonIdx] : null;

  // ── Per-season stat grid items ──
  const selectedStats = selectedSeason ? [
    { label: 'Appearances', value: selectedSeason.stats.appearances, color: 'text-sky-400', trend: allSeasons.map(s => s.stats.appearances) },
    { label: 'Starts', value: selectedSeason.stats.starts, color: 'text-sky-300', trend: allSeasons.map(s => s.stats.starts) },
    { label: 'Sub Apps', value: selectedSeason.stats.subAppearances, color: 'text-[#8b949e]', trend: undefined },
    { label: 'Minutes', value: selectedSeason.stats.minutesPlayed, color: 'text-blue-400', trend: allSeasons.map(s => s.stats.minutesPlayed) },
    { label: 'Goals', value: selectedSeason.stats.goals, color: 'text-emerald-400', trend: allSeasons.map(s => s.stats.goals) },
    { label: 'Assists', value: selectedSeason.stats.assists, color: 'text-cyan-400', trend: allSeasons.map(s => s.stats.assists) },
    { label: 'G/90', value: selectedSeason.stats.goalsPer90, color: 'text-emerald-300', trend: undefined },
    { label: 'A/90', value: selectedSeason.stats.assistsPer90, color: 'text-cyan-300', trend: undefined },
    { label: 'Clean Sheets', value: selectedSeason.stats.cleanSheets, color: 'text-teal-400', trend: allSeasons.map(s => s.stats.cleanSheets) },
    { label: 'Yellow Cards', value: selectedSeason.stats.yellowCards, color: 'text-amber-400', trend: undefined },
    { label: 'Red Cards', value: selectedSeason.stats.redCards, color: 'text-red-400', trend: undefined },
    { label: 'Man of Match', value: selectedSeason.stats.manOfTheMatch, color: 'text-purple-400', trend: allSeasons.map(s => s.stats.manOfTheMatch) },
    { label: 'Avg Rating', value: selectedSeason.stats.averageRating.toFixed(1), color: getRatingColor(selectedSeason.stats.averageRating) ? 'text-emerald-400' : 'text-amber-400', trend: allSeasons.map(s => s.stats.averageRating) },
    { label: 'Best Rating', value: selectedSeason.stats.bestRating.toFixed(1), color: 'text-emerald-300', trend: undefined },
    { label: 'Worst Rating', value: selectedSeason.stats.worstRating.toFixed(1), color: 'text-red-400', trend: undefined },
    { label: 'Consistency', value: `${selectedSeason.stats.consistencyScore}%`, color: selectedSeason.stats.consistencyScore >= 70 ? 'text-emerald-400' : 'text-amber-400', trend: undefined },
  ] : [];

  // ── SVG Chart helpers ──
  const chartW = 320;
  const chartH = 160;
  const chartPad = { top: 10, right: 10, bottom: 24, left: 36 };
  const plotW = chartW - chartPad.left - chartPad.right;
  const plotH = chartH - chartPad.top - chartPad.bottom;

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* ══════════════════ HEADER ══════════════════ */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={ANIM}
        >
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-[#c9d1d9]">Career Deep Dive</h1>
          <Badge variant="outline" className="ml-auto text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            S{allSeasons[allSeasons.length - 1]?.number ?? 1}
          </Badge>
        </motion.div>

        {/* ══════════════════ 7. CAREER SUMMARY STATS BAR ══════════════════ */}
        <motion.div
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...ANIM, delay: 0.02 }}
        >
          <div className="flex items-center justify-between gap-2">
            {milestones.map((m, i) => (
              <div key={m.label} className="flex flex-col items-center gap-1 flex-1">
                <div className="relative">
                  <CircularProgressRing
                    value={m.current}
                    max={m.next}
                    size={36}
                    strokeWidth={3}
                    color={m.color}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#c9d1d9]">
                    {m.current >= 1000 ? `${(m.current / 1000).toFixed(0)}k` : m.current}
                  </span>
                </div>
                <span className="text-[9px] text-[#8b949e] text-center leading-tight">{m.label}</span>
                <span className="text-[8px] text-[#484f58] tabular-nums">→{m.next}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full bg-[#161b22] border border-[#30363d] h-10 p-1 overflow-x-auto">
            <TabsTrigger value="overview" className="flex-1 text-[10px] sm:text-xs">Overview</TabsTrigger>
            <TabsTrigger value="trends" className="flex-1 text-[10px] sm:text-xs">Trends</TabsTrigger>
            <TabsTrigger value="records" className="flex-1 text-[10px] sm:text-xs">Records</TabsTrigger>
            <TabsTrigger value="attributes" className="flex-1 text-[10px] sm:text-xs">Attrs</TabsTrigger>
            <TabsTrigger value="distribution" className="flex-1 text-[10px] sm:text-xs">Rating</TabsTrigger>
            <TabsTrigger value="compare" className="flex-1 text-[10px] sm:text-xs">Compare</TabsTrigger>
          </TabsList>

          {/* ══════════════════ TAB: OVERVIEW ══════════════════ */}
          <TabsContent value="overview" className="space-y-4 mt-3">

            {/* 1. SEASON OVERVIEW CARDS */}
            <SectionCard title="Season Overview" icon={<Calendar className="h-3.5 w-3.5" />} delay={0.04}>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                {allSeasons.map((s, i) => {
                  const isBest = i === bestSeasonIdx;
                  const isSelected = i === selectedSeasonIdx;
                  return (
                    <motion.button
                      key={s.number}
                      onClick={() => setSelectedSeasonIdx(isSelected ? null : i)}
                      className={`shrink-0 w-36 snap-start rounded-lg p-3 border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : isBest
                            ? 'border-amber-500/30 bg-amber-500/5'
                            : 'border-[#30363d] bg-[#21262d] hover:border-[#484f58]'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.04 + i * 0.03 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-[#c9d1d9]">S{s.number} &middot; {s.year}</span>
                        {isBest && <Star className="h-3 w-3 text-amber-400" />}
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-base">{s.clubLogo}</span>
                        <span className="text-[10px] text-[#8b949e] truncate max-w-[80px]">{s.clubName}</span>
                      </div>
                      {s.leaguePosition > 0 && (
                        <Badge variant="outline" className="text-[9px] text-[#8b949e] border-[#30363d] mb-2">
                          {ordinal(s.leaguePosition)}
                        </Badge>
                      )}
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-sky-400">{s.stats.appearances} <span className="text-[#484f58]">app</span></span>
                        <span className="text-emerald-400">{s.stats.goals} <span className="text-[#484f58]">G</span></span>
                        <span className="text-cyan-400">{s.stats.assists} <span className="text-[#484f58]">A</span></span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[9px] text-[#8b949e]">Avg:</span>
                        <span
                          className="text-[10px] font-bold tabular-nums"
                          style={{ color: getRatingColor(s.stats.averageRating) }}
                        >
                          {s.stats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </SectionCard>

            {/* 2. PER-SEASON STAT GRID */}
            {selectedSeason && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={ANIM}
              >
                <SectionCard title={`Season ${selectedSeason.number} Detail`} icon={<Target className="h-3.5 w-3.5" />} delay={0.06}>
                  <div className="mb-2 flex items-center gap-2 text-[10px] text-[#8b949e]">
                    <span>{selectedSeason.clubLogo}</span>
                    <span>{selectedSeason.clubName}</span>
                    <span>&middot;</span>
                    <span>{selectedSeason.year}</span>
                  </div>
                  <MiniStatGrid stats={selectedStats} />
                </SectionCard>
              </motion.div>
            )}

            {!selectedSeason && (
              <motion.div
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={ANIM}
              >
                <CircleDot className="h-6 w-6 text-[#484f58] mx-auto mb-2" />
                <p className="text-xs text-[#8b949e]">Tap a season card above to view detailed stats</p>
              </motion.div>
            )}
          </TabsContent>

          {/* ══════════════════ TAB: TRENDS ══════════════════ */}
          <TabsContent value="trends" className="space-y-4 mt-3">

            {/* 3. SEASON TREND CHARTS */}
            <SectionCard title="Season Trends" icon={<TrendingUp className="h-3.5 w-3.5" />} delay={0.04}>
              {/* Tab switcher */}
              <div className="flex gap-1 mb-3">
                {([
                  { key: 'goals', label: 'Goals & Assists' },
                  { key: 'rating', label: 'Avg Rating' },
                  { key: 'minutes', label: 'Minutes' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTrendTab(t.key)}
                    className={`flex-1 text-[10px] py-1.5 rounded-md border transition-all ${
                      trendTab === t.key
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-full" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                    <line
                      key={pct}
                      x1={chartPad.left}
                      y1={chartPad.top + plotH * (1 - pct)}
                      x2={chartW - chartPad.right}
                      y2={chartPad.top + plotH * (1 - pct)}
                      stroke="#30363d"
                      strokeWidth={0.5}
                    />
                  ))}

                  {/* Y-axis labels */}
                  {(() => {
                    if (trendTab === 'goals') {
                      const goalVals = allSeasons.map(s => s.stats.goals);
                      const assistVals = allSeasons.map(s => s.stats.assists);
                      const maxG = Math.max(1, ...goalVals, ...assistVals);
                      return [0, maxG / 2, maxG].map((v, i) => (
                        <text key={i} x={chartPad.left - 4} y={chartPad.top + plotH * (1 - i / 2) + 3} textAnchor="end" fill="#8b949e" fontSize={8}>
                          {v.toFixed(0)}
                        </text>
                      ));
                    }
                    if (trendTab === 'rating') {
                      return [3, 5, 7, 9].map(v => {
                        const pct = (v - 3) / 6;
                        return (
                          <text key={v} x={chartPad.left - 4} y={chartPad.top + plotH * (1 - pct) + 3} textAnchor="end" fill="#8b949e" fontSize={8}>
                            {v}
                          </text>
                        );
                      });
                    }
                    // minutes
                    const maxM = Math.max(...allSeasons.map(s => s.stats.minutesPlayed), 100);
                    return [0, maxM / 2, maxM].map((v, i) => (
                      <text key={i} x={chartPad.left - 4} y={chartPad.top + plotH * (1 - i / 2) + 3} textAnchor="end" fill="#8b949e" fontSize={8}>
                        {v.toFixed(0)}
                      </text>
                    ));
                  })()}

                  {/* X-axis labels */}
                  {allSeasons.map((s, i) => {
                    const x = allSeasons.length > 1
                      ? chartPad.left + (i / (allSeasons.length - 1)) * plotW
                      : chartPad.left;
                    return (
                      <text key={i} x={x} y={chartH - 4} textAnchor="middle" fill="#8b949e" fontSize={8}>
                        S{s.number}
                      </text>
                    );
                  })}

                  {/* CHART: Goals & Assists */}
                  {trendTab === 'goals' && (() => {
                    const goalVals = allSeasons.map(s => s.stats.goals);
                    const assistVals = allSeasons.map(s => s.stats.assists);
                    const maxG = Math.max(1, ...goalVals, ...assistVals);
                    const goalPts = allSeasons.map((s, i) => {
                      const x = allSeasons.length > 1 ? chartPad.left + (i / (allSeasons.length - 1)) * plotW : chartPad.left;
                      const y = chartPad.top + plotH * (1 - s.stats.goals / maxG);
                      return `${x},${y}`;
                    }).join(' ');
                    const assistPts = allSeasons.map((s, i) => {
                      const x = allSeasons.length > 1 ? chartPad.left + (i / (allSeasons.length - 1)) * plotW : chartPad.left;
                      const y = chartPad.top + plotH * (1 - s.stats.assists / maxG);
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <>
                        <polyline fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={goalPts} />
                        <polyline fill="none" stroke="#06b6d4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={assistPts} />
                        {allSeasons.map((s, i) => {
                          const x = allSeasons.length > 1 ? chartPad.left + (i / (allSeasons.length - 1)) * plotW : chartPad.left;
                          return (
                            <React.Fragment key={`pts${i}`}>
                              <circle cx={x} cy={chartPad.top + plotH * (1 - s.stats.goals / maxG)} r={3} fill="#22c55e" />
                              <circle cx={x} cy={chartPad.top + plotH * (1 - s.stats.assists / maxG)} r={3} fill="#06b6d4" />
                            </React.Fragment>
                          );
                        })}
                        {/* Legend */}
                        <circle cx={chartW - chartPad.right - 80} cy={chartPad.top} r={3} fill="#22c55e" />
                        <text x={chartW - chartPad.right - 74} y={chartPad.top + 3} fill="#8b949e" fontSize={8}>Goals</text>
                        <circle cx={chartW - chartPad.right - 30} cy={chartPad.top} r={3} fill="#06b6d4" />
                        <text x={chartW - chartPad.right - 24} y={chartPad.top + 3} fill="#8b949e" fontSize={8}>Assists</text>
                      </>
                    );
                  })()}

                  {/* CHART: Average Rating */}
                  {trendTab === 'rating' && (() => {
                    const minR = 3;
                    const maxR = 9;
                    const range = maxR - minR;
                    // Area fill segments colored by threshold
                    const areaPoints = allSeasons.map((s, i) => {
                      const x = allSeasons.length > 1 ? chartPad.left + (i / (allSeasons.length - 1)) * plotW : chartPad.left;
                      const y = chartPad.top + plotH * (1 - (s.stats.averageRating - minR) / range);
                      return `${x},${y}`;
                    }).join(' ');
                    const baselineY = chartPad.top + plotH;
                    const firstX = chartPad.left;
                    const lastX = allSeasons.length > 1 ? chartW - chartPad.right : chartPad.left;
                    return (
                      <>
                        {/* Area fill */}
                        <polygon
                          fill="rgba(16,185,129,0.1)"
                          points={`${firstX},${baselineY} ${areaPoints} ${lastX},${baselineY}`}
                        />
                        <polyline fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={areaPoints} />
                        {allSeasons.map((s, i) => {
                          const x = allSeasons.length > 1 ? chartPad.left + (i / (allSeasons.length - 1)) * plotW : chartPad.left;
                          const y = chartPad.top + plotH * (1 - (s.stats.averageRating - minR) / range);
                          const color = s.stats.averageRating >= 7 ? '#22c55e' : s.stats.averageRating >= 5 ? '#f59e0b' : '#ef4444';
                          return <circle key={i} cx={x} cy={y} r={3.5} fill={color} />;
                        })}
                        {/* Threshold lines */}
                        {[7, 5].map(th => {
                          const y = chartPad.top + plotH * (1 - (th - minR) / range);
                          return (
                            <line key={th} x1={chartPad.left} y1={y} x2={chartW - chartPad.right} y2={y} stroke={th === 7 ? '#22c55e' : '#f59e0b'} strokeWidth={0.5} strokeDasharray="4 2" />
                          );
                        })}
                        {/* Threshold labels */}
                        <text x={chartW - chartPad.right + 2} y={chartPad.top + plotH * (1 - (7 - minR) / range) + 3} fill="#22c55e" fontSize={7}>7.0</text>
                        <text x={chartW - chartPad.right + 2} y={chartPad.top + plotH * (1 - (5 - minR) / range) + 3} fill="#f59e0b" fontSize={7}>5.0</text>
                      </>
                    );
                  })()}

                  {/* CHART: Minutes Played (Bar Chart) */}
                  {trendTab === 'minutes' && (() => {
                    const maxM = Math.max(...allSeasons.map(s => s.stats.minutesPlayed), 100);
                    const barW = allSeasons.length > 1 ? Math.max(8, plotW / allSeasons.length - 6) : plotW / 2;
                    return allSeasons.map((s, i) => {
                      const x = allSeasons.length > 1
                        ? chartPad.left + (i / (allSeasons.length - 1)) * plotW - barW / 2
                        : chartPad.left;
                      const barH = Math.max(2, (s.stats.minutesPlayed / maxM) * plotH);
                      const y = chartPad.top + plotH - barH;
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={y}
                          width={barW}
                          height={barH}
                          rx={2}
                          fill={s.stats.minutesPlayed >= 2000 ? '#22c55e' : s.stats.minutesPlayed >= 1000 ? '#f59e0b' : '#ef4444'}
                          opacity={0.8}
                        />
                      );
                    });
                  })()}
                </svg>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ══════════════════ TAB: RECORDS ══════════════════ */}
          <TabsContent value="records" className="space-y-4 mt-3">

            {/* 4. CAREER RECORDS PANEL */}
            <SectionCard title="Career Records" icon={<Award className="h-3.5 w-3.5" />} delay={0.04}>
              <div className="grid grid-cols-2 gap-2">
                <RecordCard
                  icon={<Target className="h-4 w-4 text-emerald-400" />}
                  title="Most Goals in a Season"
                  value={mostGoalsSeason ? `${mostGoalsSeason.stats.goals}` : '0'}
                  sub={mostGoalsSeason ? `Season ${mostGoalsSeason.number}` : '-'}
                  delay={0.05}
                />
                <RecordCard
                  icon={<Handshake className="h-4 w-4 text-cyan-400" />}
                  title="Most Assists in a Season"
                  value={mostAssistsSeason ? `${mostAssistsSeason.stats.assists}` : '0'}
                  sub={mostAssistsSeason ? `Season ${mostAssistsSeason.number}` : '-'}
                  delay={0.06}
                />
                <RecordCard
                  icon={<Star className="h-4 w-4 text-amber-400" />}
                  title="Highest Avg Rating"
                  value={highestRatingSeason ? highestRatingSeason.stats.bestRating.toFixed(1) : '-'}
                  sub={highestRatingSeason ? `Season ${highestRatingSeason.number}` : '-'}
                  delay={0.07}
                />
                <RecordCard
                  icon={<Shield className="h-4 w-4 text-teal-400" />}
                  title="Longest Unbeaten Run"
                  value={`${maxUnbeaten}`}
                  sub="consecutive matches ≥6.0"
                  delay={0.08}
                />
                <RecordCard
                  icon={<Award className="h-4 w-4 text-purple-400" />}
                  title="Most MotM Awards"
                  value={mostMotmSeason ? `${mostMotmSeason.stats.manOfTheMatch}` : '0'}
                  sub={mostMotmSeason ? `Season ${mostMotmSeason.number}` : '-'}
                  delay={0.09}
                />
                <RecordCard
                  icon={<Users className="h-4 w-4 text-sky-400" />}
                  title="Most Consec. Starts"
                  value={`${maxConsecStarts}`}
                  sub="games in a row"
                  delay={0.1}
                />
                <RecordCard
                  icon={<Flame className="h-4 w-4 text-orange-400" />}
                  title="Best Scoring Run"
                  value={`${maxScoringRun}`}
                  sub="consecutive goals"
                  delay={0.11}
                />
                <RecordCard
                  icon={<Trophy className="h-4 w-4 text-amber-400" />}
                  title="Career Milestones"
                  value={`${trophies.length}`}
                  sub="trophies won"
                  delay={0.12}
                />
              </div>
            </SectionCard>

            {/* Career total milestones tracker */}
            <SectionCard title="Milestone Tracker" icon={<Crown className="h-3.5 w-3.5" />} delay={0.14}>
              <div className="space-y-2.5">
                {[
                  { label: '100 Appearances', current: totalApps, target: 100, icon: <Hash className="h-3 w-3 text-sky-400" /> },
                  { label: '50 Goals', current: totalGoals, target: 50, icon: <Target className="h-3 w-3 text-emerald-400" /> },
                  { label: '50 Assists', current: totalAssists, target: 50, icon: <Handshake className="h-3 w-3 text-cyan-400" /> },
                  { label: '10 Trophies', current: trophies.length, target: 10, icon: <Trophy className="h-3 w-3 text-amber-400" /> },
                  { label: '5000 Minutes', current: allSeasons.reduce((s, se) => s + se.stats.minutesPlayed, 0), target: 5000, icon: <Clock className="h-3 w-3 text-purple-400" /> },
                ].map((m, i) => {
                  const pct = Math.min(100, (m.current / m.target) * 100);
                  return (
                    <motion.div
                      key={m.label}
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.15 + i * 0.02 }}
                    >
                      {m.icon}
                      <span className="text-[10px] text-[#8b949e] w-28 shrink-0">{m.label}</span>
                      <div className="flex-1 h-2.5 bg-[#21262d] rounded-sm overflow-hidden">
                        <motion.div
                          className="h-full rounded-sm bg-emerald-500"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, width: `${pct}%` }}
                          transition={{ ...ANIM, width: { ...ANIM, duration: 0.3 } }}
                        />
                      </div>
                      <span className="text-[10px] text-[#c9d1d9] tabular-nums w-14 text-right">
                        {m.current}/{m.target}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </SectionCard>
          </TabsContent>

          {/* ══════════════════ TAB: ATTRIBUTES ══════════════════ */}
          <TabsContent value="attributes" className="space-y-4 mt-3">

            {/* 5. ATTRIBUTE DEVELOPMENT CHART */}
            <SectionCard title="Attribute Development" icon={<TrendingUp className="h-3.5 w-3.5" />} delay={0.04}>
              <div className="overflow-x-auto">
                <svg viewBox="0 0 320 220" className="w-full max-w-full" preserveAspectRatio="xMidYMid meet">
                  {/* Grid */}
                  {[0, 25, 50, 75, 100].map(v => {
                    const x = 60 + (v / 100) * 240;
                    return (
                      <g key={v}>
                        <line x1={x} y1={20} x2={x} y2={190} stroke="#30363d" strokeWidth={0.5} />
                        <text x={x} y={205} textAnchor="middle" fill="#8b949e" fontSize={8}>{v}</text>
                      </g>
                    );
                  })}

                  {/* Y-axis labels */}
                  {ATTR_KEYS.map((attr, i) => {
                    const y = 30 + i * 26;
                    return <text key={attr} x={55} y={y + 4} textAnchor="end" fill="#c9d1d9" fontSize={9}>{ATTR_LABELS[attr]}</text>;
                  })}

                  {/* Grouped bars: Debut, Mid-Career, Current */}
                  {ATTR_KEYS.map((attr, i) => {
                    const y = 22 + i * 26;
                    const barH = 14;
                    const barW = 240;
                    const val = (v: number) => 60 + (v / 100) * barW;

                    const debutW = val(debutAttrs[attr]) - 60;
                    const midW = val(midCareerAttrs[attr]) - 60;
                    const curW = val(currentAttrs[attr]) - 60;

                    return (
                      <g key={attr}>
                        {/* Debut */}
                        <rect x={60} y={y} width={debutW} height={barH / 3 - 1} rx={1} fill="#6366f1" opacity={0.7} />
                        {/* Mid-Career */}
                        <rect x={60} y={y + barH / 3} width={midW} height={barH / 3 - 1} rx={1} fill="#f59e0b" opacity={0.7} />
                        {/* Current */}
                        <rect x={60} y={y + (barH / 3) * 2} width={curW} height={barH / 3 - 1} rx={1} fill="#22c55e" opacity={0.8} />
                        {/* Values */}
                        <text x={val(debutAttrs[attr]) + 3} y={y + barH / 6 + 2} fill="#6366f1" fontSize={7}>{debutAttrs[attr]}</text>
                        <text x={val(midCareerAttrs[attr]) + 3} y={y + barH / 2 + 2} fill="#f59e0b" fontSize={7}>{midCareerAttrs[attr]}</text>
                        <text x={val(currentAttrs[attr]) + 3} y={y + barH * 5 / 6 + 2} fill="#22c55e" fontSize={7}>{currentAttrs[attr]}</text>
                      </g>
                    );
                  })}

                  {/* Legend */}
                  <rect x={80} y={0} width={8} height={6} rx={1} fill="#6366f1" opacity={0.7} />
                  <text x={91} y={6} fill="#8b949e" fontSize={7}>Debut</text>
                  <rect x={130} y={0} width={8} height={6} rx={1} fill="#f59e0b" opacity={0.7} />
                  <text x={141} y={6} fill="#8b949e" fontSize={7}>Mid-Career</text>
                  <rect x={200} y={0} width={8} height={6} rx={1} fill="#22c55e" opacity={0.8} />
                  <text x={211} y={6} fill="#8b949e" fontSize={7}>Current</text>
                </svg>
              </div>
            </SectionCard>

            {/* Current attributes summary */}
            <SectionCard title="Current Attribute Summary" icon={<Zap className="h-3.5 w-3.5" />} delay={0.06}>
              <div className="space-y-2">
                {ATTR_KEYS.map((attr, i) => {
                  const current = player.attributes[attr];
                  const diff = current - debutAttrs[attr];
                  return (
                    <motion.div
                      key={attr}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.07 + i * 0.02 }}
                    >
                      <span className="text-[10px] text-[#8b949e] w-20">{ATTR_LABELS[attr]}</span>
                      <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
                        <motion.div
                          className="h-full rounded-sm"
                          style={{ backgroundColor: current >= 80 ? '#22c55e' : current >= 60 ? '#f59e0b' : '#ef4444' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, width: `${current}%` }}
                          transition={{ ...ANIM, width: { ...ANIM, duration: 0.3 } }}
                        />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-[#c9d1d9] w-6 text-right">{current}</span>
                      <span className={`text-[9px] font-bold tabular-nums w-8 text-right ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-[#484f58]'}`}>
                        {diff > 0 ? `+${diff}` : `${diff}`}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </SectionCard>
          </TabsContent>

          {/* ══════════════════ TAB: DISTRIBUTION ══════════════════ */}
          <TabsContent value="distribution" className="space-y-4 mt-3">

            {/* 6. PERFORMANCE DISTRIBUTION */}
            <SectionCard title="Performance Distribution" icon={<BarChart3 className="h-3.5 w-3.5" />} delay={0.04}>
              {allRatings.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <svg viewBox="0 0 300 150" className="w-full max-w-full" preserveAspectRatio="xMidYMid meet">
                      {/* Grid */}
                      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                        <line
                          key={pct}
                          x1={40}
                          y1={10 + 110 * (1 - pct)}
                          x2={290}
                          y2={10 + 110 * (1 - pct)}
                          stroke="#30363d"
                          strokeWidth={0.5}
                        />
                      ))}

                      {/* Y-axis labels */}
                      {[0, Math.ceil(maxDistCount / 2), maxDistCount].map((v, i) => (
                        <text key={i} x={36} y={10 + 110 * (1 - i / 2) + 3} textAnchor="end" fill="#8b949e" fontSize={7}>
                          {v}
                        </text>
                      ))}

                      {/* Bars */}
                      {RATING_BUCKETS.map((b, i) => {
                        const barW = 200 / RATING_BUCKETS.length - 8;
                        const x = 50 + i * (200 / RATING_BUCKETS.length) + 4;
                        const barH = Math.max(2, (distCounts[i] / maxDistCount) * 110);
                        const y = 120 - barH;
                        return (
                          <g key={b.label}>
                            <rect x={x} y={y} width={barW} height={barH} rx={2} fill={b.color} opacity={0.75} />
                            <text x={x + barW / 2} y={y - 3} textAnchor="middle" fill="#c9d1d9" fontSize={8} fontWeight="bold">
                              {distCounts[i]}
                            </text>
                            <text x={x + barW / 2} y={140} textAnchor="middle" fill="#8b949e" fontSize={7}>
                              {b.label}
                            </text>
                          </g>
                        );
                      })}

                      {/* X-axis label */}
                      <text x={150} y={150} textAnchor="middle" fill="#484f58" fontSize={7}>Match Rating Range</text>
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {RATING_BUCKETS.map(b => (
                      <div key={b.label} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: b.color }} />
                        <span className="text-[9px] text-[#8b949e]">{b.tier} ({b.label})</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary stats */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-[#21262d] rounded-md p-2.5 border border-[#30363d] text-center">
                      <span className="text-[9px] text-[#8b949e]">Most Common Rating</span>
                      <p className="text-sm font-bold text-[#c9d1d9] tabular-nums">{ratingMode > 0 ? ratingMode.toFixed(1) : '-'}</p>
                    </div>
                    <div className="bg-[#21262d] rounded-md p-2.5 border border-[#30363d] text-center">
                      <span className="text-[9px] text-[#8b949e]">Best 10%</span>
                      <p className="text-sm font-bold text-emerald-400 tabular-nums">{best10Pct > 0 ? `${best10Pct.toFixed(1)}+` : '-'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-6 w-6 text-[#484f58] mx-auto mb-2" />
                  <p className="text-xs text-[#8b949e]">Play matches to see your performance distribution</p>
                </div>
              )}
            </SectionCard>
          </TabsContent>

          {/* ══════════════════ TAB: COMPARE ══════════════════ */}
          <TabsContent value="compare" className="space-y-4 mt-3">

            {/* 8. SEASON COMPARISON TOOL */}
            <SectionCard title="Season Comparison" icon={<GitCompareArrows className="h-3.5 w-3.5" />} delay={0.04}>
              {/* Season selectors */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[9px] text-[#8b949e] mb-1 block">Season A</label>
                  <select
                    value={compareSeasons[0] ?? ''}
                    onChange={(e) => setCompareSeasons([e.target.value ? Number(e.target.value) : null, compareSeasons[1]])}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Select...</option>
                    {allSeasons.map(s => (
                      <option key={s.number} value={s.number}>Season {s.number} ({s.year})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#8b949e] mb-1 block">Season B</label>
                  <select
                    value={compareSeasons[1] ?? ''}
                    onChange={(e) => setCompareSeasons([compareSeasons[0], e.target.value ? Number(e.target.value) : null])}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1.5 text-xs text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Select...</option>
                    {allSeasons.map(s => (
                      <option key={s.number} value={s.number}>Season {s.number} ({s.year})</option>
                    ))}
                  </select>
                </div>
              </div>

              {compareSeasons[0] !== null && compareSeasons[1] !== null ? (() => {
                const sA = allSeasons.find(s => s.number === compareSeasons[0]);
                const sB = allSeasons.find(s => s.number === compareSeasons[1]);
                if (!sA || !sB) return null;

                const verdict = getComparisonVerdict(sA, sB);

                const compareItems = [
                  { label: 'Club', vA: sA.clubName, vB: sB.clubName },
                  { label: 'League Pos', vA: sA.leaguePosition > 0 ? ordinal(sA.leaguePosition) : '-', vB: sB.leaguePosition > 0 ? ordinal(sB.leaguePosition) : '-', numeric: true, nA: sA.leaguePosition, nB: sB.leaguePosition },
                  { label: 'Appearances', vA: sA.stats.appearances, vB: sB.stats.appearances, numeric: true, nA: sA.stats.appearances, nB: sB.stats.appearances },
                  { label: 'Starts', vA: sA.stats.starts, vB: sB.stats.starts, numeric: true, nA: sA.stats.starts, nB: sB.stats.starts },
                  { label: 'Minutes', vA: sA.stats.minutesPlayed, vB: sB.stats.minutesPlayed, numeric: true, nA: sA.stats.minutesPlayed, nB: sB.stats.minutesPlayed },
                  { label: 'Goals', vA: sA.stats.goals, vB: sB.stats.goals, numeric: true, nA: sA.stats.goals, nB: sB.stats.goals },
                  { label: 'Assists', vA: sA.stats.assists, vB: sB.stats.assists, numeric: true, nA: sA.stats.assists, nB: sB.stats.assists },
                  { label: 'G/90', vA: sA.stats.goalsPer90, vB: sB.stats.goalsPer90, numeric: true, nA: sA.stats.goalsPer90, nB: sB.stats.goalsPer90 },
                  { label: 'A/90', vA: sA.stats.assistsPer90, vB: sB.stats.assistsPer90, numeric: true, nA: sA.stats.assistsPer90, nB: sB.stats.assistsPer90 },
                  { label: 'Avg Rating', vA: sA.stats.averageRating.toFixed(1), vB: sB.stats.averageRating.toFixed(1), numeric: true, nA: sA.stats.averageRating, nB: sB.stats.averageRating },
                  { label: 'Yellow Cards', vA: sA.stats.yellowCards, vB: sB.stats.yellowCards, numeric: true, nA: sA.stats.yellowCards, nB: sB.stats.yellowCards, invertColor: true },
                  { label: 'Red Cards', vA: sA.stats.redCards, vB: sB.stats.redCards, numeric: true, nA: sA.stats.redCards, nB: sB.stats.redCards, invertColor: true },
                  { label: 'Man of Match', vA: sA.stats.manOfTheMatch, vB: sB.stats.manOfTheMatch, numeric: true, nA: sA.stats.manOfTheMatch, nB: sB.stats.manOfTheMatch },
                  { label: 'Clean Sheets', vA: sA.stats.cleanSheets, vB: sB.stats.cleanSheets, numeric: true, nA: sA.stats.cleanSheets, nB: sB.stats.cleanSheets },
                  { label: 'Consistency', vA: `${sA.stats.consistencyScore}%`, vB: `${sB.stats.consistencyScore}%`, numeric: true, nA: sA.stats.consistencyScore, nB: sB.stats.consistencyScore },
                ];

                return (
                  <>
                    {/* Comparison table */}
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="text-[#8b949e] border-b border-[#30363d]">
                            <th className="py-1.5 text-left pl-1">Stat</th>
                            <th className="py-1.5 text-center">S{sA.number}</th>
                            <th className="py-1.5 text-center w-8"></th>
                            <th className="py-1.5 text-center">S{sB.number}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compareItems.map((item, i) => {
                            const isNumeric = item.numeric && item.nA !== undefined && item.nB !== undefined;
                            const diff = isNumeric ? item.nB! - item.nA! : 0;
                            const invert = 'invertColor' in item && item.invertColor;
                            let indicator: React.ReactNode = <Minus className="h-3 w-3 text-[#484f58] inline" />;
                            if (isNumeric && diff > 0) {
                              indicator = invert
                                ? <TrendingDown className="h-3 w-3 text-red-400 inline" />
                                : <TrendingUp className="h-3 w-3 text-emerald-400 inline" />;
                            } else if (isNumeric && diff < 0) {
                              indicator = invert
                                ? <TrendingUp className="h-3 w-3 text-emerald-400 inline" />
                                : <TrendingDown className="h-3 w-3 text-red-400 inline" />;
                            }
                            return (
                              <motion.tr
                                key={item.label}
                                className="border-b border-[#30363d]/50 last:border-0 text-[#c9d1d9]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ ...ANIM, delay: 0.05 + i * 0.02 }}
                              >
                                <td className="py-1.5 pl-1 text-[#8b949e]">{item.label}</td>
                                <td className={`py-1.5 text-center tabular-nums font-medium ${isNumeric && diff < 0 && !invert ? 'text-emerald-400' : isNumeric && diff > 0 && invert ? 'text-emerald-400' : ''}`}>
                                  {String(item.vA)}
                                </td>
                                <td className="py-1.5 text-center">{indicator}</td>
                                <td className={`py-1.5 text-center tabular-nums font-medium ${isNumeric && diff > 0 && !invert ? 'text-emerald-400' : isNumeric && diff < 0 && invert ? 'text-emerald-400' : ''}`}>
                                  {String(item.vB)}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Verdict */}
                    <motion.div
                      className="mt-3 bg-[#21262d] rounded-md p-3 border border-[#30363d]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...ANIM, delay: 0.3 }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Crown className="h-3 w-3 text-amber-400" />
                        <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">Verdict</span>
                      </div>
                      <p className="text-xs text-[#c9d1d9]">{verdict}</p>
                    </motion.div>
                  </>
                );
              })() : (
                <div className="text-center py-6">
                  <GitCompareArrows className="h-6 w-6 text-[#484f58] mx-auto mb-2" />
                  <p className="text-xs text-[#8b949e]">Select two seasons above to compare them side by side</p>
                </div>
              )}
            </SectionCard>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

// ── Record Card ────────────────────────────────────────────
function RecordCard({ icon, title, value, sub, delay = 0 }: {
  icon: React.ReactNode; title: string; value: string; sub: string; delay?: number;
}) {
  return (
    <motion.div
      className="bg-[#21262d] rounded-lg p-3 border border-[#30363d] flex flex-col items-center gap-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...ANIM, delay }}
    >
      {icon}
      <span className="text-lg font-bold text-[#c9d1d9] tabular-nums">{value}</span>
      <span className="text-[9px] text-[#8b949e] text-center leading-tight">{title}</span>
      <span className="text-[8px] text-[#484f58]">{sub}</span>
    </motion.div>
  );
}
