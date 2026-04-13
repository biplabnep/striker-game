'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  Trophy, Target, Lock, CheckCircle2, Flame, Star, Clock,
  TrendingUp, Award, Zap, ChevronDown, ChevronRight,
  Crosshair, Shield, Calendar, Medal, CircleDot,
  Goal, Handshake, AlertTriangle, Frown, BarChart3,
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

  // Longest goal streak (consecutive matches with at least 1 goal)
  let longestGoalStreak = 0;
  let currentStreak = 0;
  for (const r of allResults) {
    if (r.playerGoals > 0) {
      currentStreak++;
      longestGoalStreak = Math.max(longestGoalStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Longest winning streak
  let longestWinStreak = 0;
  let currentWinStreak = 0;
  for (const r of allResults) {
    const playerTeam = r.playerTeam ?? 'home';
    const playerScore = playerTeam === 'home' ? r.homeScore : r.awayScore;
    const oppScore = playerTeam === 'home' ? r.awayScore : r.homeScore;
    if (playerScore > oppScore) {
      currentWinStreak++;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else {
      currentWinStreak = 0;
    }
  }

  // Best moment
  const bestMatch = allResults.reduce(
    (best, r) => (!best || r.playerRating > best.playerRating) ? r : best,
    null as MatchResult | null
  );

  // Build achievement maps (approximate — use current totals since we don't have event timestamps)
  const achievedMap = (() => {
    const map = new Map<string, { season: number; week: number }>();
    // We approximate: if total >= threshold, mark as achieved in earliest season found
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

      {/* --- Career Timeline --- */}
      {timelineEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
        >
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
            Career Timeline
          </p>
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex gap-0 min-w-max">
              {timelineEvents.map((event, idx) => (
                <div key={event.season} className="flex items-stretch">
                  {/* Node */}
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
                  {/* Connector Line */}
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

      {/* --- Ratings & Records Section --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
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
            delay={0.16}
          />
          <RecordCard
            icon={<Flame className="h-3.5 w-3.5 text-red-400" />}
            label="9.0+ Ratings"
            value={ratings9Count}
            unlocked={ratings9Count > 0}
            delay={0.18}
          />
          <RecordCard
            icon={<BarChart3 className="h-3.5 w-3.5 text-emerald-400" />}
            label="Matches ≥7.0"
            value={ratings7Plus}
            unlocked={ratings7Plus > 0}
            delay={0.2}
          />
          <RecordCard
            icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
            label="Highest Rating"
            value={highestRating > 0 ? highestRating.toFixed(1) : 'N/A'}
            unlocked={highestRating >= 7.0}
            delay={0.22}
          />
          <RecordCard
            icon={<Target className="h-3.5 w-3.5 text-amber-400" />}
            label="Most Goals/Season"
            value={mostGoalsSeason}
            unlocked={mostGoalsSeason >= 10}
            delay={0.24}
          />
          <RecordCard
            icon={<Flame className="h-3.5 w-3.5 text-orange-400" />}
            label="Goal Streak"
            value={longestGoalStreak}
            unlocked={longestGoalStreak >= 3}
            delay={0.26}
          />
        </div>
      </motion.div>

      {/* --- Milestone Categories --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
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
                transition={{ duration: 0.2, delay: 0.22 + catIdx * 0.04 }}
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
                            delay={0.24 + idx * 0.03}
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

// --- Sub-Components ---

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
