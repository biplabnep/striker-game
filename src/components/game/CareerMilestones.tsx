'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import type { MatchResult } from '@/lib/game/types';
import {
  Trophy, Target, Lock, CheckCircle2, Flame, Star, Clock,
  TrendingUp, Award, Zap, ChevronDown, ChevronRight,
  Crosshair, Shield, Calendar, Medal, CircleDot,
  Goal, Handshake, AlertTriangle, Frown, BarChart3,
  Activity, Globe, Swords, PieChart, Timer,
} from 'lucide-react';

// --- Types ---

interface MilestoneDef {
  id: string;
  name: string;
  description: string;
  threshold: number;
  category: string;
}

type MilestoneStatus = 'unlocked' | 'current' | 'locked';

interface MilestoneProgress {
  milestone: MilestoneDef;
  status: MilestoneStatus;
  current: number;
  achievedSeason?: number;
  achievedWeek?: number;
}

interface MilestoneCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  milestones: MilestoneDef[];
}

// --- Milestone Definitions ---

const GOALS_MILESTONES: MilestoneDef[] = [
  { id: 'goals_1', name: 'First Goal', description: 'Score your first career goal', threshold: 1, category: 'goals' },
  { id: 'goals_10', name: 'Double Digits', description: 'Reach 10 career goals', threshold: 10, category: 'goals' },
  { id: 'goals_25', name: 'Quarter Century', description: 'Reach 25 career goals', threshold: 25, category: 'goals' },
  { id: 'goals_50', name: 'Half Century', description: 'Reach 50 career goals', threshold: 50, category: 'goals' },
  { id: 'goals_100', name: 'Centurion', description: 'Reach 100 career goals', threshold: 100, category: 'goals' },
  { id: 'goals_250', name: 'Goal Machine', description: 'Reach 250 career goals', threshold: 250, category: 'goals' },
  { id: 'goals_500', name: 'Legendary Striker', description: 'Reach 500 career goals', threshold: 500, category: 'goals' },
];

const ASSISTS_MILESTONES: MilestoneDef[] = [
  { id: 'assists_1', name: 'First Assist', description: 'Register your first career assist', threshold: 1, category: 'assists' },
  { id: 'assists_10', name: 'Playmaker', description: 'Reach 10 career assists', threshold: 10, category: 'assists' },
  { id: 'assists_25', name: '25 Assists', description: 'Reach 25 career assists', threshold: 25, category: 'assists' },
  { id: 'assists_50', name: '50 Assists', description: 'Reach 50 career assists', threshold: 50, category: 'assists' },
  { id: 'assists_100', name: 'Century of Assists', description: 'Reach 100 career assists', threshold: 100, category: 'assists' },
];

const APPEARANCES_MILESTONES: MilestoneDef[] = [
  { id: 'apps_1', name: 'First Cap', description: 'Make your first career appearance', threshold: 1, category: 'appearances' },
  { id: 'apps_50', name: '50 Appearances', description: 'Reach 50 career appearances', threshold: 50, category: 'appearances' },
  { id: 'apps_100', name: 'Club Legend', description: 'Reach 100 career appearances', threshold: 100, category: 'appearances' },
  { id: 'apps_250', name: '250 Appearances', description: 'Reach 250 career appearances', threshold: 250, category: 'appearances' },
  { id: 'apps_500', name: 'Ever-Present', description: 'Reach 500 career appearances', threshold: 500, category: 'appearances' },
];

const TROPHIES_MILESTONES: MilestoneDef[] = [
  { id: 'trophies_1', name: 'First Trophy', description: 'Win your first career trophy', threshold: 1, category: 'trophies' },
  { id: 'trophies_5', name: 'Trophy Cabinet', description: 'Win 5 career trophies', threshold: 5, category: 'trophies' },
  { id: 'trophies_10', name: 'Decade of Silverware', description: 'Win 10 career trophies', threshold: 10, category: 'trophies' },
];

const MILESTONE_CATEGORIES: MilestoneCategory[] = [
  {
    id: 'goals',
    title: 'Goals Milestones',
    icon: <Crosshair className="h-4 w-4 text-emerald-400" />,
    milestones: GOALS_MILESTONES,
  },
  {
    id: 'assists',
    title: 'Assists Milestones',
    icon: <Handshake className="h-4 w-4 text-emerald-400" />,
    milestones: ASSISTS_MILESTONES,
  },
  {
    id: 'appearances',
    title: 'Appearances',
    icon: <Calendar className="h-4 w-4 text-emerald-400" />,
    milestones: APPEARANCES_MILESTONES,
  },
  {
    id: 'trophies',
    title: 'Trophies',
    icon: <Trophy className="h-4 w-4 text-emerald-400" />,
    milestones: TROPHIES_MILESTONES,
  },
];

// --- Helpers ---

function getMilestoneProgress(
  milestones: MilestoneDef[],
  current: number,
  achievedMap: Map<string, { season: number; week: number }>
): MilestoneProgress[] {
  return milestones.map(m => {
    const achieved = achievedMap.get(m.id);
    if (achieved) {
      return {
        milestone: m,
        status: 'unlocked' as const,
        current: m.threshold,
        achievedSeason: achieved.season,
        achievedWeek: achieved.week,
      };
    }
    if (current >= m.threshold) {
      return { milestone: m, status: 'unlocked' as const, current: m.threshold };
    }
    const prevMilestone = milestones
      .filter(mm => mm.threshold < m.threshold)
      .sort((a, b) => b.threshold - a.threshold)[0];
    const prevThreshold = prevMilestone?.threshold ?? 0;
    const nextIdx = milestones.indexOf(m);
    const prevAchieved = milestones
      .slice(0, nextIdx)
      .every(mm => achievedMap.has(mm.id) || current >= mm.threshold);
    const isCurrent = current >= prevThreshold && !prevAchieved || (current >= prevThreshold && (achievedMap.has(prevMilestone?.id ?? '') || current >= prevThreshold));

    // Current = the first milestone not yet achieved where all previous are achieved
    const allPrevDone = milestones
      .slice(0, nextIdx)
      .every(mm => current >= mm.threshold);
    const isCurrentMilestone = allPrevDone && current < m.threshold;

    return {
      milestone: m,
      status: isCurrentMilestone ? 'current' as const : 'locked' as const,
      current,
    };
  });
}

function buildPoints(pairs: [number, number][]): string {
  return pairs.reduce((acc, pair, i) => {
    return i === 0 ? `${pair[0]},${pair[1]}` : `${acc} ${pair[0]},${pair[1]}`;
  }, '');
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

// --- Component ---

export default function CareerMilestones() {
  const gameState = useGameStore(state => state.gameState);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['goals'])
  );

  if (!gameState) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8b949e] text-sm">No career data available.</p>
      </div>
    );
  }

  const { player, currentClub, currentSeason, seasons, recentResults } = gameState;
  const careerStats = player?.careerStats;
  const totalGoals = careerStats?.totalGoals ?? 0;
  const totalAssists = careerStats?.totalAssists ?? 0;
  const totalApps = careerStats?.totalAppearances ?? 0;
  const totalCleanSheets = careerStats?.totalCleanSheets ?? 0;
  const trophies = careerStats?.trophies ?? [];
  const seasonsPlayed = careerStats?.seasonsPlayed ?? seasons?.length ?? 0;

  // Compute rating milestones
  const allResults = recentResults ?? [];
  const ratings8Count = allResults.filter(r => r.playerRating >= 8.0).length;
  const ratings9Count = allResults.filter(r => r.playerRating >= 9.0).length;
  const ratings7Plus = allResults.filter(r => r.playerRating >= 7.0).length;
  const highestRating = allResults.length > 0
    ? Math.max(...allResults.map(r => r.playerRating))
    : 0;

  // Hat-tricks, red cards, best match stats
  const hatTricks = allResults.filter(r => r.playerGoals >= 3).length;
  const redCards = allResults.reduce(
    (sum, r) => sum + (r.events?.filter(e => e.type === 'red_card' || e.type === 'second_yellow').length ?? 0), 0
  );
  const mostGoalsInMatch = allResults.length > 0
    ? Math.max(...allResults.map(r => r.playerGoals), 0)
    : 0;

  // Total minutes played
  const totalMinutes = allResults.reduce((sum, r) => sum + (r.playerMinutesPlayed ?? 0), 0);

  // Goals per season (for records)
  const goalsPerSeason = (seasons ?? []).map(s => s.playerStats?.goals ?? 0);
  const mostGoalsSeason = goalsPerSeason.length > 0 ? Math.max(...goalsPerSeason) : 0;

  // Longest goal streak — using reduce instead of let accumulation
  const goalStreakResult = allResults.reduce(
    (acc, r) => {
      const cs = r.playerGoals > 0 ? acc.currentStreak + 1 : 0;
      return { longestGoalStreak: Math.max(acc.longestGoalStreak, cs), currentStreak: cs };
    },
    { longestGoalStreak: 0, currentStreak: 0 }
  );
  const longestGoalStreak = goalStreakResult.longestGoalStreak;

  // Longest winning streak — using reduce instead of let accumulation
  const winStreakResult = allResults.reduce(
    (acc, r) => {
      const isHome = r.homeClub.id === currentClub.id;
      const playerScore = isHome ? r.homeScore : r.awayScore;
      const oppScore = isHome ? r.awayScore : r.homeScore;
      const cs = playerScore > oppScore ? acc.currentWinStreak + 1 : 0;
      return { longestWinStreak: Math.max(acc.longestWinStreak, cs), currentWinStreak: cs };
    },
    { longestWinStreak: 0, currentWinStreak: 0 }
  );
  const longestWinStreak = winStreakResult.longestWinStreak;

  // Best moment
  const bestMatch = allResults.reduce(
    (best, r) => (!best || r.playerRating > best.playerRating) ? r : best,
    null as MatchResult | null
  );

  // Build achievement maps (approximate — use current totals since we don't have event timestamps)
  const achievedMap = (() => {
    const map = new Map<string, { season: number; week: number }>();
    if (totalGoals >= 1) map.set('goals_1', { season: seasons?.[0]?.number ?? 1, week: 1 });
    if (totalGoals >= 10) map.set('goals_10', { season: seasons?.[0]?.number ?? 1, week: 5 });
    if (totalGoals >= 25) map.set('goals_25', { season: seasons?.[1]?.number ?? 2, week: 10 });
    if (totalGoals >= 50) map.set('goals_50', { season: seasons?.[2]?.number ?? 3, week: 8 });
    if (totalGoals >= 100) map.set('goals_100', { season: seasons?.[3]?.number ?? 4, week: 12 });
    if (totalGoals >= 250) map.set('goals_250', { season: seasons?.[4]?.number ?? 5, week: 15 });
    if (totalGoals >= 500) map.set('goals_500', { season: seasons?.[5]?.number ?? 6, week: 10 });

    if (totalAssists >= 1) map.set('assists_1', { season: seasons?.[0]?.number ?? 1, week: 2 });
    if (totalAssists >= 10) map.set('assists_10', { season: seasons?.[0]?.number ?? 1, week: 8 });
    if (totalAssists >= 25) map.set('assists_25', { season: seasons?.[1]?.number ?? 2, week: 12 });
    if (totalAssists >= 50) map.set('assists_50', { season: seasons?.[2]?.number ?? 3, week: 10 });
    if (totalAssists >= 100) map.set('assists_100', { season: seasons?.[3]?.number ?? 4, week: 14 });

    if (totalApps >= 1) map.set('apps_1', { season: seasons?.[0]?.number ?? 1, week: 1 });
    if (totalApps >= 50) map.set('apps_50', { season: seasons?.[1]?.number ?? 2, week: 6 });
    if (totalApps >= 100) map.set('apps_100', { season: seasons?.[2]?.number ?? 3, week: 4 });
    if (totalApps >= 250) map.set('apps_250', { season: seasons?.[3]?.number ?? 4, week: 10 });
    if (totalApps >= 500) map.set('apps_500', { season: seasons?.[5]?.number ?? 6, week: 8 });

    if (trophies.length >= 1) map.set('trophies_1', { season: trophies[0]?.season ?? 1, week: 38 });
    if (trophies.length >= 5) map.set('trophies_5', { season: trophies[4]?.season ?? 3, week: 38 });
    if (trophies.length >= 10) map.set('trophies_10', { season: trophies[9]?.season ?? 5, week: 38 });

    return map;
  })();

  // Compute progress for each category
  const goalsProgress = getMilestoneProgress(GOALS_MILESTONES, totalGoals, achievedMap);
  const assistsProgress = getMilestoneProgress(ASSISTS_MILESTONES, totalAssists, achievedMap);
  const appsProgress = getMilestoneProgress(APPEARANCES_MILESTONES, totalApps, achievedMap);
  const trophiesProgress = getMilestoneProgress(TROPHIES_MILESTONES, trophies.length, achievedMap);

  const progressMap: Record<string, MilestoneProgress[]> = {
    goals: goalsProgress,
    assists: assistsProgress,
    appearances: appsProgress,
    trophies: trophiesProgress,
  };

  // Toggle category expansion
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Career timeline from seasons
  const timelineEvents = (seasons ?? []).map(s => ({
    season: s.number,
    year: s.year,
    position: s.leaguePosition,
    goals: s.playerStats?.goals ?? 0,
    assists: s.playerStats?.assists ?? 0,
    apps: s.playerStats?.appearances ?? 0,
    avgRating: s.playerStats?.averageRating ?? 0,
  }));

  const unlockedCount = Object.values(progressMap).flat().filter(p => p.status === 'unlocked').length;
  const totalMilestones = Object.values(progressMap).flat().length;

  // --- Data for SVG Visualizations ---

  // 1. Milestone Completion Ring data
  const completionRatio = totalMilestones > 0 ? unlockedCount / totalMilestones : 0;

  // 2. Category Donut data — via reduce
  const categoryDonutSegments = [
    { label: 'Goals', value: goalsProgress.filter(p => p.status === 'unlocked').length, color: '#10B981' },
    { label: 'Assists', value: assistsProgress.filter(p => p.status === 'unlocked').length, color: '#3B82F6' },
    { label: 'Appearances', value: appsProgress.filter(p => p.status === 'unlocked').length, color: '#F59E0B' },
    { label: 'Trophies', value: trophiesProgress.filter(p => p.status === 'unlocked').length, color: '#8B5CF6' },
    { label: 'Records', value: [ratings8Count > 0 ? 1 : 0, ratings9Count > 0 ? 1 : 0, hatTricks > 0 ? 1 : 0, mostGoalsSeason >= 10 ? 1 : 0].reduce((a, b) => a + b, 0), color: '#06B6D4' },
  ];
  const donutTotal = categoryDonutSegments.reduce((sum, seg) => sum + seg.value, 0) || 1;

  // 3. Goals trajectory — 8 seasons via reduce pattern
  const goalsTrajectoryData = (seasons ?? []).slice(-8).reduce(
    (acc, s) => [...acc, s.playerStats?.goals ?? 0],
    [] as number[]
  );

  // 4. Rarity distribution bars — via reduce from achievements
  const allAchievements = gameState.achievements ?? [];
  const rarityBars = ['common', 'rare', 'epic', 'legendary'].reduce(
    (acc, rarity) => {
      const count = allAchievements.filter(a => a.unlocked && a.rarity === rarity).length;
      const colorMap: Record<string, string> = { common: '#64748b', rare: '#3B82F6', epic: '#8B5CF6', legendary: '#F59E0B' };
      return [...acc, { label: rarity.charAt(0).toUpperCase() + rarity.slice(1), count, color: colorMap[rarity] }];
    },
    [] as { label: string; count: number; color: string }[]
  );

  // 5. Age vs Achievement scatter — 10 career phases
  const playerAge = player?.age ?? 18;
  const scatterData = Array.from({ length: 10 }, (_, i) => {
    const phaseAge = 16 + i * 2;
    const seasonOffset = phaseAge - playerAge + (seasons?.length ?? 0);
    const sIdx = Math.max(0, Math.min(seasonOffset, (seasons ?? []).length - 1));
    const seasonGoals = seasons?.[sIdx]?.playerStats?.goals ?? 0;
    const seasonApps = seasons?.[sIdx]?.playerStats?.appearances ?? 0;
    const achievementScore = Math.min(100, (seasonGoals * 4) + (seasonApps * 0.5) + (phaseAge > playerAge ? 0 : 10));
    return { x: phaseAge, y: Math.round(achievementScore), label: `${phaseAge}y` };
  });

  // 6. Career Momentum Gauge
  const recentFormSlice = allResults.slice(-5);
  const momentumScore = recentFormSlice.length > 0
    ? Math.round(recentFormSlice.reduce((sum, r) => sum + r.playerRating, 0) / recentFormSlice.length * 10)
    : 50;

  // 7. Milestone Timeline events — 8 key milestones
  const svgTimelineEvents = [
    { label: 'Debut', season: totalApps >= 1 ? (seasons?.[0]?.number ?? 1) : null, color: '#10B981' },
    { label: '1st Goal', season: totalGoals >= 1 ? (seasons?.[0]?.number ?? 1) : null, color: '#10B981' },
    { label: '10 Goals', season: totalGoals >= 10 ? (seasons?.[1]?.number ?? 2) : null, color: '#3B82F6' },
    { label: '50 Apps', season: totalApps >= 50 ? (seasons?.[1]?.number ?? 2) : null, color: '#F59E0B' },
    { label: '25 Goals', season: totalGoals >= 25 ? (seasons?.[2]?.number ?? 3) : null, color: '#10B981' },
    { label: '1st Trophy', season: trophies.length >= 1 ? (trophies[0]?.season ?? 3) : null, color: '#8B5CF6' },
    { label: '50 Goals', season: totalGoals >= 50 ? (seasons?.[3]?.number ?? 4) : null, color: '#10B981' },
    { label: '100 Caps', season: totalApps >= 100 ? (seasons?.[3]?.number ?? 4) : null, color: '#06B6D4' },
  ];

  // 8. Records vs Legends bars
  const recordsVsLegends = [
    { label: 'Career Goals', player: totalGoals, legend: 650, color: '#10B981' },
    { label: 'Career Assists', player: totalAssists, legend: 350, color: '#3B82F6' },
    { label: 'Appearances', player: totalApps, legend: 900, color: '#F59E0B' },
    { label: 'Trophies', player: trophies.length, legend: 35, color: '#8B5CF6' },
    { label: 'Intl. Caps', player: gameState.internationalCareer?.caps ?? 0, legend: 180, color: '#06B6D4' },
  ];

  // 9. International Caps Ring
  const intlCaps = gameState.internationalCareer?.caps ?? 0;
  const intlTarget = 100;

  // 10. Trophy Cabinet Radar — 5 axes via reduce
  const trophyRadarAxes = [
    { label: 'League', value: trophies.filter(t => t.name.toLowerCase().includes('league')).length },
    { label: 'Cup', value: trophies.filter(t => t.name.toLowerCase().includes('cup')).length },
    { label: 'Super Cup', value: trophies.filter(t => t.name.toLowerCase().includes('super')).length },
    { label: 'Continental', value: trophies.filter(t => t.name.toLowerCase().includes('champion') || t.name.toLowerCase().includes('european')).length },
    { label: 'International', value: trophies.filter(t => t.name.toLowerCase().includes('international') || t.name.toLowerCase().includes('world')).length },
  ].reduce(
    (acc, axis) => [...acc, { ...axis, value: Math.min(100, axis.value * 25) }],
    [] as { label: string; value: number }[]
  );

  // 11. Next Milestone Countdown
  const allCurrentProgress = [...goalsProgress, ...assistsProgress, ...appsProgress, ...trophiesProgress];
  const nextMilestone = allCurrentProgress.find(p => p.status === 'current');
  const nextCurrent = nextMilestone?.current ?? 0;
  const nextTarget = nextMilestone?.milestone.threshold ?? 1;
  const nextLabel = nextMilestone?.milestone.name ?? 'No next milestone';

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      {/* --- Header --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-6 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <Trophy className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#c9d1d9]">Career Milestones</h1>
            <p className="text-xs text-[#8b949e]">
              {unlockedCount}/{totalMilestones} milestones unlocked
            </p>
          </div>
        </div>
      </motion.div>

      {/* --- Career Summary Hero --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
          Career Summary
        </p>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <HeroStatCard
            icon={<Crosshair className="h-4 w-4 text-emerald-400" />}
            value={totalGoals}
            label="Goals"
            delay={0.06}
          />
          <HeroStatCard
            icon={<Handshake className="h-4 w-4 text-emerald-400" />}
            value={totalAssists}
            label="Assists"
            delay={0.1}
          />
          <HeroStatCard
            icon={<Calendar className="h-4 w-4 text-emerald-400" />}
            value={totalApps}
            label="Apps"
            delay={0.14}
          />
          <HeroStatCard
            icon={<Shield className="h-4 w-4 text-emerald-400" />}
            value={seasonsPlayed}
            label="Seasons"
            delay={0.18}
          />
        </div>

        {/* Best Moment */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
              Best Moment
            </span>
          </div>
          {bestMatch ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#c9d1d9]">
                  Rating {bestMatch.playerRating.toFixed(1)}
                </p>
                <p className="text-[11px] text-[#8b949e]">
                  {bestMatch.competition} — {bestMatch.playerGoals}G {bestMatch.playerAssists}A
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8b949e]">Season {bestMatch.season}</p>
                <p className="text-xs text-[#8b949e]">Week {bestMatch.week}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#484f58]">No matches played yet</p>
          )}
        </div>
      </motion.div>

      {/* --- SVG 1: Milestone Completion Ring --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Overall Completion
          </p>
        </div>
        <MilestoneCompletionRing completed={unlockedCount} total={totalMilestones} />
      </motion.div>

      {/* --- SVG 2: Milestone Category Donut --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Category Breakdown
          </p>
        </div>
        <MilestoneCategoryDonut segments={categoryDonutSegments} total={donutTotal} />
      </motion.div>

      {/* --- Career Timeline (existing) --- */}
      {timelineEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
        >
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
            Career Timeline
          </p>
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex gap-0 min-w-max">
              {timelineEvents.map((event, idx) => (
                <div key={event.season} className="flex items-stretch">
                  <div className="flex flex-col items-center min-w-[80px]">
                    <span className="text-[10px] font-semibold text-emerald-400 mb-1">
                      S{event.season}
                    </span>
                    <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center mb-1">
                      <span className="text-[10px] font-bold text-emerald-400">
                        {event.position > 0 ? `#${event.position}` : '—'}
                      </span>
                    </div>
                    <span className="text-[9px] text-[#8b949e]">
                      {event.goals}G {event.assists}A
                    </span>
                    <span className="text-[9px] text-[#484f58]">
                      {event.avgRating > 0 ? `${event.avgRating.toFixed(1)}` : ''}
                    </span>
                  </div>
                  {idx < timelineEvents.length - 1 && (
                    <div className="flex items-center mx-1 mt-4">
                      <div className="w-4 h-px bg-[#30363d]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* --- SVG 3: Career Goals Trajectory --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.14 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Goals Per Season
          </p>
        </div>
        <CareerGoalsTrajectory data={goalsTrajectoryData} />
      </motion.div>

      {/* --- SVG 4: Milestone Rarity Distribution Bars --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.16 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Medal className="h-3.5 w-3.5 text-amber-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Achievement Rarity
          </p>
        </div>
        <MilestoneRarityBars bars={rarityBars} />
      </motion.div>

      {/* --- SVG 5: Age vs Achievement Scatter --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.18 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Age vs Achievement
          </p>
        </div>
        <AgeVsAchievementScatter data={scatterData} />
      </motion.div>

      {/* --- SVG 6: Career Momentum Gauge --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Career Momentum
          </p>
        </div>
        <CareerMomentumGauge value={momentumScore} />
      </motion.div>

      {/* --- SVG 7: Milestone Timeline --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.22 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Key Milestones
          </p>
        </div>
        <MilestoneTimeline events={svgTimelineEvents} />
      </motion.div>

      {/* --- Ratings & Records Section --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.24 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
          Ratings &amp; Records
        </p>
        <div className="grid grid-cols-2 gap-2">
          <RecordCard
            icon={<Star className="h-3.5 w-3.5 text-amber-400" />}
            label="8.0+ Ratings"
            value={ratings8Count}
            unlocked={ratings8Count > 0}
            delay={0.25}
          />
          <RecordCard
            icon={<Flame className="h-3.5 w-3.5 text-red-400" />}
            label="9.0+ Ratings"
            value={ratings9Count}
            unlocked={ratings9Count > 0}
            delay={0.27}
          />
          <RecordCard
            icon={<BarChart3 className="h-3.5 w-3.5 text-emerald-400" />}
            label="Matches ≥7.0"
            value={ratings7Plus}
            unlocked={ratings7Plus > 0}
            delay={0.29}
          />
          <RecordCard
            icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
            label="Highest Rating"
            value={highestRating > 0 ? highestRating.toFixed(1) : 'N/A'}
            unlocked={highestRating >= 7.0}
            delay={0.31}
          />
          <RecordCard
            icon={<Target className="h-3.5 w-3.5 text-amber-400" />}
            label="Most Goals/Season"
            value={mostGoalsSeason}
            unlocked={mostGoalsSeason >= 10}
            delay={0.33}
          />
          <RecordCard
            icon={<Flame className="h-3.5 w-3.5 text-orange-400" />}
            label="Goal Streak"
            value={longestGoalStreak}
            unlocked={longestGoalStreak >= 3}
            delay={0.35}
          />
        </div>
      </motion.div>

      {/* --- Milestone Categories --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mb-4"
      >
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3 px-1">
          Milestone Tracker
        </p>
        <div className="space-y-2">
          {MILESTONE_CATEGORIES.map((category, catIdx) => {
            const isExpanded = expandedCategories.has(category.id);
            const progress = progressMap[category.id] ?? [];
            const unlocked = progress.filter(p => p.status === 'unlocked').length;
            const current = progress.find(p => p.status === 'current');

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.32 + catIdx * 0.04 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {category.icon}
                    <div>
                      <span className="text-sm font-semibold text-[#c9d1d9]">
                        {category.title}
                      </span>
                      <p className="text-[10px] text-[#8b949e]">
                        {unlocked}/{progress.length} unlocked
                        {current && (
                          <span className="text-amber-400 ml-1.5">
                            — Next: {current.milestone.name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#8b949e]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#8b949e]" />
                  )}
                </button>

                {/* Milestones List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-t border-[#30363d]"
                    >
                      <div className="p-2 space-y-1.5">
                        {progress.map((mp, idx) => (
                          <MilestoneCard
                            key={mp.milestone.id}
                            progress={mp}
                            delay={0.36 + idx * 0.03}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* --- SVG 8: Records vs Legends Bars --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.38 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Swords className="h-3.5 w-3.5 text-emerald-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            vs All-Time Legends
          </p>
        </div>
        <RecordsVsLegendsBars records={recordsVsLegends} />
      </motion.div>

      {/* --- Fun Stats Section --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
          Fun Stats
        </p>
        <div className="grid grid-cols-2 gap-2">
          <FunStatCard
            icon={<Clock className="h-3.5 w-3.5 text-[#8b949e]" />}
            label="Minutes Played"
            value={totalMinutes.toLocaleString()}
            delay={0.42}
          />
          <FunStatCard
            icon={<Shield className="h-3.5 w-3.5 text-[#8b949e]" />}
            label="Clean Sheets"
            value={totalCleanSheets}
            delay={0.44}
          />
          <FunStatCard
            icon={<Zap className="h-3.5 w-3.5 text-amber-400" />}
            label="Hat-Tricks"
            value={hatTricks}
            delay={0.46}
          />
          <FunStatCard
            icon={<AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
            label="Red Cards"
            value={redCards}
            delay={0.48}
          />
          <FunStatCard
            icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
            label="Win Streak (Best)"
            value={longestWinStreak}
            delay={0.5}
          />
          <FunStatCard
            icon={<Goal className="h-3.5 w-3.5 text-emerald-400" />}
            label="Goals in 1 Match"
            value={mostGoalsInMatch}
            delay={0.52}
          />
        </div>
      </motion.div>

      {/* --- SVG 9: International Caps Progress Ring --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.44 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-3.5 w-3.5 text-blue-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            International Caps
          </p>
        </div>
        <InternationalCapsRing caps={intlCaps} target={intlTarget} />
      </motion.div>

      {/* --- SVG 10: Trophy Cabinet Radar --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.46 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-3.5 w-3.5 text-purple-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Trophy Cabinet
          </p>
        </div>
        <TrophyCabinetRadar axes={trophyRadarAxes} />
      </motion.div>

      {/* --- SVG 11: Next Milestone Countdown Ring --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.48 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Timer className="h-3.5 w-3.5 text-amber-400" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Next Milestone
          </p>
        </div>
        <NextMilestoneCountdownRing current={nextCurrent} target={nextTarget} label={nextLabel} />
      </motion.div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.55 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Overall Progress
          </span>
          <span className="text-xs font-bold text-emerald-400">
            {totalMilestones > 0 ? Math.round((unlockedCount / totalMilestones) * 100) : 0}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#21262d] rounded-full overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${totalMilestones > 0 ? (unlockedCount / totalMilestones) * 100 : 0}%` }}
          />
        </div>
        <p className="text-[10px] text-[#8b949e] mt-1.5">
          {unlockedCount} of {totalMilestones} milestones achieved. Keep pushing!
        </p>
      </motion.div>
    </div>
  );
}

// ============================================================
// SVG Visualization Sub-Components
// ============================================================

function MilestoneCompletionRing({ completed, total }: { completed: number; total: number }) {
  const cx = 60;
  const cy = 60;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? completed / total : 0;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-24 h-24 flex-shrink-0">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#21262d"
          strokeWidth={8}
        />
        {/* Progress ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#10B981"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={22}
          fontWeight="bold"
          fill="#e6edf3"
        >
          {completed}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={10}
          fill="#8b949e"
        >
          /{total}
        </text>
      </svg>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[#c9d1d9]">
          {total > 0 ? Math.round(pct * 100) : 0}% Complete
        </p>
        <p className="text-[10px] text-[#8b949e]">
          {completed} of {total} milestones unlocked
        </p>
        <p className="text-[10px] text-[#484f58]">
          {total - completed > 0 ? `${total - completed} remaining` : 'All milestones unlocked!'}
        </p>
      </div>
    </div>
  );
}

function MilestoneCategoryDonut({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 50;

  const arcResult = segments.reduce(
    (acc, seg) => {
      if (seg.value <= 0 || total <= 0) return acc;
      const sliceAngle = (seg.value / total) * 360;
      const startAngle = acc.cumulativeAngle;
      const endAngle = acc.cumulativeAngle + sliceAngle;
      const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
      const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
      const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
      const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
      const largeArc = sliceAngle > 180 ? 1 : 0;
      const d = [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
        `L ${innerEnd.x} ${innerEnd.y}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
        'Z',
      ].join(' ');
      return {
        arcs: [...acc.arcs, { d, color: seg.color, label: seg.label, value: seg.value }],
        cumulativeAngle: endAngle,
      };
    },
    { arcs: [] as { d: string; color: string; label: string; value: number }[], cumulativeAngle: -90 }
  );
  const arcPaths = arcResult.arcs;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-32 h-32 flex-shrink-0">
        {arcPaths.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.color} fillOpacity={0.85} />
        ))}
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={18}
          fontWeight="bold"
          fill="#e6edf3"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={9}
          fill="#8b949e"
        >
          Total
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] text-[#c9d1d9]">{seg.label}</span>
            <span className="text-[10px] text-[#484f58] ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CareerGoalsTrajectory({ data }: { data: number[] }) {
  const w = 300;
  const h = 150;
  const pad = { top: 20, right: 15, bottom: 25, left: 35 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const maxGoals = Math.max(1, ...data);
  const xStep = data.length > 1 ? plotW / (data.length - 1) : plotW;

  const points = data.reduce(
    (acc, goals, i) => {
      const px = pad.left + i * xStep;
      const py = pad.top + plotH - (goals / maxGoals) * plotH;
      return [...acc, [px, py] as [number, number]];
    },
    [] as [number, number][]
  );

  const areaPoints = data.length > 0
    ? buildPoints([
        [pad.left, pad.top + plotH],
        ...points,
        [pad.left + (data.length - 1) * xStep, pad.top + plotH],
      ])
    : '';

  const linePoints = data.length > 0 ? buildPoints(points) : '';

  // Y-axis labels
  const yTicks = [0, Math.round(maxGoals / 2), maxGoals];
  const yTickLabels = yTicks.map(v => ({
    value: v,
    y: pad.top + plotH - (v / maxGoals) * plotH,
  }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Grid lines */}
      {yTickLabels.map((tick, i) => (
        <line
          key={i}
          x1={pad.left}
          y1={tick.y}
          x2={w - pad.right}
          y2={tick.y}
          stroke="#21262d"
          strokeWidth={1}
        />
      ))}
      {/* Y-axis labels */}
      {yTickLabels.map((tick, i) => (
        <text
          key={`y-${i}`}
          x={pad.left - 6}
          y={tick.y + 3}
          textAnchor={"end" as "start" | "middle" | "end"}
          fontSize={9}
          fill="#484f58"
        >
          {tick.value}
        </text>
      ))}
      {/* Area fill */}
      {areaPoints && (
        <polygon
          points={areaPoints}
          fill="#10B981"
          fillOpacity={0.15}
        />
      )}
      {/* Line */}
      {linePoints && (
        <polyline
          points={linePoints}
          fill="none"
          stroke="#10B981"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Data points */}
      {points.map((pt, i) => (
        <circle key={i} cx={pt[0]} cy={pt[1]} r={3} fill="#10B981" />
      ))}
      {/* X-axis season labels */}
      {data.map((_, i) => (
        <text
          key={`x-${i}`}
          x={pad.left + i * xStep}
          y={h - 4}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={8}
          fill="#484f58"
        >
          S{i + 1}
        </text>
      ))}
      {/* Title */}
      <text
        x={pad.left}
        y={12}
        textAnchor={"start" as "start" | "middle" | "end"}
        fontSize={9}
        fontWeight="bold"
        fill="#8b949e"
      >
        Goals
      </text>
    </svg>
  );
}

function MilestoneRarityBars({ bars }: { bars: { label: string; count: number; color: string }[] }) {
  const w = 280;
  const h = 120;
  const barH = 18;
  const gap = 8;
  const padLeft = 80;
  const padRight = 40;
  const plotW = w - padLeft - padRight;
  const maxCount = Math.max(1, ...bars.map(b => b.count));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {bars.map((bar, i) => {
        const y = i * (barH + gap);
        const barWidth = Math.max(2, (bar.count / maxCount) * plotW);
        return (
          <g key={i}>
            <text
              x={padLeft - 8}
              y={y + barH / 2 + 3}
              textAnchor={"end" as "start" | "middle" | "end"}
              fontSize={10}
              fill="#c9d1d9"
            >
              {bar.label}
            </text>
            {/* Background bar */}
            <rect
              x={padLeft}
              y={y}
              width={plotW}
              height={barH}
              rx={3}
              fill="#21262d"
            />
            {/* Value bar */}
            <rect
              x={padLeft}
              y={y}
              width={barWidth}
              height={barH}
              rx={3}
              fill={bar.color}
              fillOpacity={0.85}
            />
            {/* Count label */}
            <text
              x={padLeft + plotW + 6}
              y={y + barH / 2 + 3}
              textAnchor={"start" as "start" | "middle" | "end"}
              fontSize={10}
              fontWeight="bold"
              fill="#e6edf3"
            >
              {bar.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function AgeVsAchievementScatter({ data }: { data: { x: number; y: number; label: string }[] }) {
  const w = 300;
  const h = 200;
  const pad = { top: 20, right: 20, bottom: 30, left: 35 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const minX = 16;
  const maxX = 34;
  const maxY = 100;

  const toSvgX = (age: number) => pad.left + ((age - minX) / (maxX - minX)) * plotW;
  const toSvgY = (score: number) => pad.top + plotH - (score / maxY) * plotH;

  // Grid lines
  const yGridLines = [0, 25, 50, 75, 100];
  const xGridLines = [16, 20, 24, 28, 32];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Y grid */}
      {yGridLines.map((val, i) => (
        <line
          key={`yg-${i}`}
          x1={pad.left}
          y1={toSvgY(val)}
          x2={w - pad.right}
          y2={toSvgY(val)}
          stroke="#21262d"
          strokeWidth={1}
        />
      ))}
      {/* X grid */}
      {xGridLines.map((val, i) => (
        <line
          key={`xg-${i}`}
          x1={toSvgX(val)}
          y1={pad.top}
          x2={toSvgX(val)}
          y2={pad.top + plotH}
          stroke="#21262d"
          strokeWidth={1}
        />
      ))}
      {/* Y labels */}
      {yGridLines.map((val, i) => (
        <text
          key={`yl-${i}`}
          x={pad.left - 6}
          y={toSvgY(val) + 3}
          textAnchor={"end" as "start" | "middle" | "end"}
          fontSize={8}
          fill="#484f58"
        >
          {val}
        </text>
      ))}
      {/* X labels */}
      {xGridLines.map((val, i) => (
        <text
          key={`xl-${i}`}
          x={toSvgX(val)}
          y={h - 6}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={8}
          fill="#484f58"
        >
          {val}y
        </text>
      ))}
      {/* Data points */}
      {data.map((pt, i) => (
        <g key={i}>
          <circle
            cx={toSvgX(pt.x)}
            cy={toSvgY(pt.y)}
            r={4}
            fill="#10B981"
            fillOpacity={0.85}
          />
          <text
            x={toSvgX(pt.x)}
            y={toSvgY(pt.y) - 7}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={7}
            fill="#8b949e"
          >
            {pt.label}
          </text>
        </g>
      ))}
      {/* Axis labels */}
      <text
        x={w / 2}
        y={h - 1}
        textAnchor={"middle" as "start" | "middle" | "end"}
        fontSize={8}
        fill="#484f58"
      >
        Age
      </text>
      <text
        x={6}
        y={pad.top + plotH / 2}
        textAnchor={"middle" as "start" | "middle" | "end"}
        fontSize={8}
        fill="#484f58"
        transform={`rotate(-90 8 ${pad.top + plotH / 2})`}
      >
        Score
      </text>
    </svg>
  );
}

function CareerMomentumGauge({ value }: { value: number }) {
  const cx = 100;
  const cy = 95;
  const r = 70;
  const startAngle = 180;
  const endAngle = 0;
  const valueAngle = startAngle - (value / 100) * 180;
  const clampedValue = Math.max(0, Math.min(100, value));

  const bgColor = clampedValue >= 70 ? '#10B981' : clampedValue >= 40 ? '#F59E0B' : '#EF4444';

  const bgArc = describeArc(cx, cy, r, startAngle, endAngle);
  const valueArc = describeArc(cx, cy, r, startAngle, valueAngle);

  // Tick marks
  const ticks = [0, 25, 50, 75, 100].reduce(
    (acc, tickVal) => {
      const angle = 180 - (tickVal / 100) * 180;
      const inner = polarToCartesian(cx, cy, r - 12, angle);
      const outer = polarToCartesian(cx, cy, r - 4, angle);
      return [...acc, { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, labelX: polarToCartesian(cx, cy, r - 22, angle).x, labelY: polarToCartesian(cx, cy, r - 22, angle).y, tickVal }];
    },
    [] as { x1: number; y1: number; x2: number; y2: number; labelX: number; labelY: number; tickVal: number }[]
  );

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[280px]">
        {/* Background arc */}
        <path d={bgArc} fill="none" stroke="#21262d" strokeWidth={10} strokeLinecap="round" />
        {/* Value arc */}
        <path d={valueArc} fill="none" stroke={bgColor} strokeWidth={10} strokeLinecap="round" />
        {/* Ticks */}
        {ticks.map((tick, i) => (
          <g key={i}>
            <line x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="#484f58" strokeWidth={1.5} />
            <text
              x={tick.labelX}
              y={tick.labelY + 3}
              textAnchor={"middle" as "start" | "middle" | "end"}
              fontSize={8}
              fill="#484f58"
            >
              {tick.tickVal}
            </text>
          </g>
        ))}
        {/* Center value */}
        <text
          x={cx}
          y={cy - 5}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={26}
          fontWeight="bold"
          fill="#e6edf3"
        >
          {clampedValue}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={9}
          fill="#8b949e"
        >
          Momentum Score
        </text>
      </svg>
    </div>
  );
}

function MilestoneTimeline({ events }: { events: { label: string; season: number | null; color: string }[] }) {
  const w = 320;
  const h = 60;
  const padX = 20;
  const lineY = 30;
  const plotW = w - padX * 2;
  const spacing = plotW / (events.length - 1 || 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Horizontal line */}
      <line
        x1={padX}
        y1={lineY}
        x2={w - padX}
        y2={lineY}
        stroke="#21262d"
        strokeWidth={2}
      />
      {/* Events */}
      {events.map((evt, i) => {
        const x = padX + i * spacing;
        const isAchieved = evt.season !== null;
        return (
          <g key={i}>
            {/* Connector line */}
            {i < events.length - 1 && (
              <line
                x1={x}
                y1={lineY}
                x2={x + spacing}
                y2={lineY}
                stroke={isAchieved ? evt.color : '#21262d'}
                strokeWidth={2}
              />
            )}
            {/* Dot */}
            <circle
              cx={x}
              cy={lineY}
              r={isAchieved ? 5 : 4}
              fill={isAchieved ? evt.color : '#21262d'}
              stroke={isAchieved ? evt.color : '#30363d'}
              strokeWidth={1}
            />
            {/* Label above */}
            <text
              x={x}
              y={lineY - 10}
              textAnchor={"middle" as "start" | "middle" | "end"}
              fontSize={7}
              fontWeight="bold"
              fill={isAchieved ? '#c9d1d9' : '#30363d'}
            >
              {evt.label}
            </text>
            {/* Season below */}
            {isAchieved && (
              <text
                x={x}
                y={lineY + 18}
                textAnchor={"middle" as "start" | "middle" | "end"}
                fontSize={7}
                fill="#8b949e"
              >
                S{evt.season}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function RecordsVsLegendsBars({ records }: { records: { label: string; player: number; legend: number; color: string }[] }) {
  const w = 300;
  const h = 160;
  const padLeft = 95;
  const padRight = 45;
  const padTop = 5;
  const barH = 12;
  const gap = 16;
  const plotW = w - padLeft - padRight;
  const allMax = Math.max(1, ...records.map(r => Math.max(r.player, r.legend)));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Legend */}
      <rect x={w - padRight} y={0} width={8} height={8} fill="#10B981" rx={2} />
      <text x={w - padRight + 12} y={8} fontSize={8} fill="#8b949e">You</text>
      <rect x={w - padRight + 35} y={0} width={8} height={8} fill="#484f58" rx={2} />
      <text x={w - padRight + 47} y={8} fontSize={8} fill="#8b949e">Legend</text>
      {records.map((rec, i) => {
        const y = padTop + 16 + i * (barH * 2 + gap);
        const playerW = Math.max(2, (rec.player / allMax) * plotW);
        const legendW = Math.max(2, (rec.legend / allMax) * plotW);
        return (
          <g key={i}>
            <text
              x={padLeft - 8}
              y={y + barH + 2}
              textAnchor={"end" as "start" | "middle" | "end"}
              fontSize={9}
              fill="#c9d1d9"
            >
              {rec.label}
            </text>
            {/* Legend bar (background) */}
            <rect
              x={padLeft}
              y={y + barH + 3}
              width={legendW}
              height={barH - 2}
              rx={2}
              fill="#484f58"
              fillOpacity={0.5}
            />
            {/* Player bar */}
            <rect
              x={padLeft}
              y={y}
              width={playerW}
              height={barH}
              rx={2}
              fill={rec.color}
              fillOpacity={0.85}
            />
            {/* Player value */}
            <text
              x={padLeft + playerW + 4}
              y={y + barH - 1}
              textAnchor={"start" as "start" | "middle" | "end"}
              fontSize={8}
              fontWeight="bold"
              fill="#e6edf3"
            >
              {rec.player}
            </text>
            {/* Legend value */}
            <text
              x={padLeft + legendW + 4}
              y={y + barH * 2 + 1}
              textAnchor={"start" as "start" | "middle" | "end"}
              fontSize={8}
              fill="#484f58"
            >
              {rec.legend}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function InternationalCapsRing({ caps, target }: { caps: number; target: number }) {
  const cx = 60;
  const cy = 60;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, caps / target) : 0;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-24 h-24 flex-shrink-0">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#21262d"
          strokeWidth={8}
        />
        {/* Progress ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={22}
          fontWeight="bold"
          fill="#e6edf3"
        >
          {caps}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={10}
          fill="#8b949e"
        >
          /{target}
        </text>
      </svg>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[#c9d1d9]">
          {target > 0 ? Math.round(pct * 100) : 0}% to {target}-Cap Milestone
        </p>
        <p className="text-[10px] text-[#8b949e]">
          {caps} international appearances
        </p>
        <p className="text-[10px] text-[#484f58]">
          {caps >= target ? 'Century of caps achieved!' : `${target - caps} caps remaining`}
        </p>
      </div>
    </div>
  );
}

function TrophyCabinetRadar({ axes }: { axes: { label: string; value: number }[] }) {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;
  const startOffset = -Math.PI / 2;

  // Grid polygons at 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const gridPolygons = gridLevels.reduce(
    (acc, level) => {
      const pts = axes.reduce(
        (pairs, _, i) => {
          const angle = startOffset + i * angleStep;
          return [...pairs, [cx + r * level * Math.cos(angle), cy + r * level * Math.sin(angle)] as [number, number]];
        },
        [] as [number, number][]
      );
      return [...acc, { level, points: buildPoints(pts) }];
    },
    [] as { level: number; points: string }[]
  );

  // Data polygon
  const dataPoints = axes.reduce(
    (acc, axis, i) => {
      const angle = startOffset + i * angleStep;
      const val = Math.max(0, Math.min(1, axis.value / 100));
      return [...acc, [cx + r * val * Math.cos(angle), cy + r * val * Math.sin(angle)] as [number, number]];
    },
    [] as [number, number][]
  );

  // Axis endpoints and labels
  const axisEndpoints = axes.reduce(
    (acc, _, i) => {
      const angle = startOffset + i * angleStep;
      const endX = cx + r * Math.cos(angle);
      const endY = cy + r * Math.sin(angle);
      const labelX = cx + (r + 16) * Math.cos(angle);
      const labelY = cy + (r + 16) * Math.sin(angle);
      return [...acc, { endX, endY, labelX, labelY }];
    },
    [] as { endX: number; endY: number; labelX: number; labelY: number }[]
  );

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-40 h-40 flex-shrink-0">
        {/* Grid polygons */}
        {gridPolygons.map((grid, i) => (
          <polygon
            key={i}
            points={grid.points}
            fill="none"
            stroke="#21262d"
            strokeWidth={1}
          />
        ))}
        {/* Axis lines */}
        {axisEndpoints.map((ep, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={ep.endX}
            y2={ep.endY}
            stroke="#21262d"
            strokeWidth={1}
          />
        ))}
        {/* Data polygon */}
        <polygon
          points={buildPoints(dataPoints)}
          fill="#8B5CF6"
          fillOpacity={0.2}
          stroke="#8B5CF6"
          strokeWidth={2}
        />
        {/* Data points */}
        {dataPoints.map((pt, i) => (
          <circle key={i} cx={pt[0]} cy={pt[1]} r={3} fill="#8B5CF6" />
        ))}
        {/* Axis labels */}
        {axes.map((axis, i) => (
          <text
            key={i}
            x={axisEndpoints[i].labelX}
            y={axisEndpoints[i].labelY + 3}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={8}
            fontWeight="bold"
            fill="#c9d1d9"
          >
            {axis.label}
          </text>
        ))}
      </svg>
      <div className="flex flex-col gap-1.5">
        {axes.map((axis, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-purple-500 flex-shrink-0 rounded-sm" />
            <span className="text-[10px] text-[#c9d1d9]">{axis.label}</span>
            <span className="text-[10px] text-[#484f58] ml-auto">{axis.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextMilestoneCountdownRing({ current, target, label }: { current: number; target: number; label: string }) {
  const cx = 60;
  const cy = 60;
  const r = 45;
  const circumference = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  const dashOffset = circumference * (1 - pct);
  const remaining = Math.max(0, target - current);

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-24 h-24 flex-shrink-0">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#21262d"
          strokeWidth={8}
        />
        {/* Progress ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={18}
          fontWeight="bold"
          fill="#e6edf3"
        >
          {remaining}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor={"middle" as "start" | "middle" | "end"}
          fontSize={8}
          fill="#8b949e"
        >
          to go
        </text>
      </svg>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[#c9d1d9]">{label}</p>
        <p className="text-[10px] text-[#8b949e]">
          {current}/{target} ({target > 0 ? Math.round(pct * 100) : 0}%)
        </p>
        <p className="text-[10px] text-[#484f58]">
          {remaining > 0 ? `${remaining} more needed` : 'Milestone complete!'}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Existing Sub-Components
// ============================================================

function HeroStatCard({
  icon,
  value,
  label,
  delay,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay }}
      className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 flex flex-col items-center gap-1.5"
    >
      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <span className="text-lg font-bold text-[#c9d1d9]">{value}</span>
      <span className="text-[10px] text-[#8b949e]">{label}</span>
    </motion.div>
  );
}

function MilestoneCard({
  progress,
  delay,
}: {
  progress: MilestoneProgress;
  delay: number;
}) {
  const { milestone, status, current, achievedSeason, achievedWeek } = progress;

  const prevThreshold = getPrevThreshold(milestone);
  const progressPercent = status === 'unlocked'
    ? 100
    : status === 'current'
      ? Math.min(100, ((current - prevThreshold) / (milestone.threshold - prevThreshold)) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay }}
      className={`
        p-2.5 rounded-lg border
        ${status === 'unlocked'
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : status === 'current'
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-slate-800/50 border-[#21262d]'
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Status Icon */}
          <div className={`mt-0.5 flex-shrink-0 ${
            status === 'unlocked' ? 'text-emerald-400' :
            status === 'current' ? 'text-amber-400' : 'text-[#484f58]'
          }`}>
            {status === 'unlocked' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : status === 'current' ? (
              <Target className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold ${
                status === 'unlocked' ? 'text-emerald-300' :
                status === 'current' ? 'text-amber-300' : 'text-[#484f58]'
              }`}>
                {milestone.name}
              </span>
              {status === 'unlocked' && (
                <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  DONE
                </span>
              )}
              {status === 'current' && (
                <span className="text-[8px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                  NEXT
                </span>
              )}
            </div>
            <p className={`text-[10px] mt-0.5 ${
              status === 'locked' ? 'text-[#30363d]' : 'text-[#8b949e]'
            }`}>
              {milestone.description}
            </p>
          </div>
        </div>

        {/* Achieved Date */}
        <div className="text-right flex-shrink-0">
          {status === 'unlocked' && achievedSeason ? (
            <p className="text-[10px] text-[#8b949e]">
              S{achievedSeason} W{achievedWeek}
            </p>
          ) : status === 'current' ? (
            <p className="text-[10px] font-semibold text-amber-400">
              {current}/{milestone.threshold}
            </p>
          ) : (
            <p className="text-[10px] text-[#30363d]">
              {milestone.threshold}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar (for current milestone) */}
      {status === 'current' && (
        <div className="mt-2">
          <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.1 }}
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[9px] text-[#8b949e] mt-0.5 text-right">
            {progressPercent.toFixed(0)}%
          </p>
        </div>
      )}
    </motion.div>
  );
}

function RecordCard({
  icon,
  label,
  value,
  unlocked,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unlocked: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay }}
      className={`p-2.5 rounded-lg border ${
        unlocked
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-[#0d1117] border-[#21262d]'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-[#8b949e]">{label}</span>
      </div>
      <span className={`text-base font-bold ${
        unlocked ? 'text-[#c9d1d9]' : 'text-[#484f58]'
      }`}>
        {value}
      </span>
    </motion.div>
  );
}

function FunStatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay }}
      className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5"
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-[#8b949e]">{label}</span>
      </div>
      <span className="text-sm font-bold text-[#c9d1d9]">{value}</span>
    </motion.div>
  );
}

// --- Utilities ---

function getPrevThreshold(milestone: MilestoneDef): number {
  const allMilestones = [...GOALS_MILESTONES, ...ASSISTS_MILESTONES, ...APPEARANCES_MILESTONES, ...TROPHIES_MILESTONES]
    .filter(m => m.category === milestone.category)
    .sort((a, b) => a.threshold - b.threshold);

  const idx = allMilestones.findIndex(m => m.id === milestone.id);
  if (idx <= 0) return 0;
  return allMilestones[idx - 1].threshold;
}
