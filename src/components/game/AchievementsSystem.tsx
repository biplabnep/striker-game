'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  Target, Trophy, Star, Sparkles, Lock, CheckCircle2,
  ChevronDown, ChevronRight,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

type AchievementCategory = 'scoring' | 'career' | 'individual' | 'special';

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  xpReward: number;
}

interface ComputedAchievement extends AchievementDef {
  unlocked: boolean;
  progress: number;       // 0–100
  currentLabel: string;   // e.g. "7/10 goals"
  unlockedSeason?: number;
}

// ============================================================
// Achievement Definitions
// ============================================================

const SCORING: AchievementDef[] = [
  { id: 'first_goal',      name: 'First Goal',   description: 'Score your first career goal',             category: 'scoring',   xpReward: 50 },
  { id: 'hat_trick',       name: 'Hat Trick',     description: 'Score 3+ goals in a single match',        category: 'scoring',   xpReward: 200 },
  { id: '10_goals',        name: '10 Goals',      description: 'Score 10 career goals',                  category: 'scoring',   xpReward: 150 },
  { id: '50_goals',        name: '50 Goals',      description: 'Score 50 career goals',                  category: 'scoring',   xpReward: 500 },
  { id: '100_goals',       name: '100 Goals',     description: 'Score 100 career goals',                 category: 'scoring',   xpReward: 1500 },
  { id: 'golden_boot',     name: 'Golden Boot',   description: 'Finish a season as top scorer',           category: 'scoring',   xpReward: 1000 },
];

const CAREER: AchievementDef[] = [
  { id: 'first_cap',       name: 'First Cap',       description: 'Make your debut appearance',            category: 'career',   xpReward: 50 },
  { id: '50_apps',         name: '50 Appearances',  description: 'Reach 50 career appearances',           category: 'career',   xpReward: 300 },
  { id: '100_apps',        name: '100 Appearances', description: 'Reach 100 career appearances',          category: 'career',   xpReward: 800 },
  { id: 'club_legend',     name: 'Club Legend',     description: 'Stay at one club for 5+ seasons',       category: 'career',   xpReward: 1200 },
  { id: 'league_champion', name: 'League Champion', description: 'Win the league title',                  category: 'career',   xpReward: 2000 },
  { id: 'cup_winner',      name: 'Cup Winner',      description: 'Win a cup competition',                 category: 'career',   xpReward: 1500 },
];

const INDIVIDUAL: AchievementDef[] = [
  { id: 'man_of_match',  name: 'Man of the Match', description: 'Get a 9.0+ rating in a match',          category: 'individual', xpReward: 200 },
  { id: 'season_mvp',   name: 'Season MVP',        description: 'Average 8.0+ rating over a season',     category: 'individual', xpReward: 1000 },
  { id: 'perfect_ten',  name: 'Perfect Ten',       description: 'Get a 10.0 rating',                     category: 'individual', xpReward: 3000 },
  { id: 'assist_king',  name: 'Assist King',       description: 'Get 15+ assists in a season',           category: 'individual', xpReward: 800 },
  { id: 'iron_man',     name: 'Iron Man',          description: 'Play 35+ league games in a season',     category: 'individual', xpReward: 600 },
];

const SPECIAL: AchievementDef[] = [
  { id: 'world_cup_callup', name: 'World Cup Call-up',  description: 'Get called up to national team',       category: 'special', xpReward: 1500 },
  { id: 'transfer_record',  name: 'Transfer Record',    description: 'Complete a transfer',                  category: 'special', xpReward: 1000 },
  { id: 'fan_favorite',     name: 'Fan Favorite',       description: 'Reach 90+ fan approval',               category: 'special', xpReward: 500 },
  { id: 'derby_hero',       name: 'Derby Hero',         description: 'Score in a derby match',                category: 'special', xpReward: 750 },
  { id: 'underdog_story',   name: 'Underdog Story',     description: 'Win a match against a team 20+ OVR higher', category: 'special', xpReward: 2000 },
];

const ALL_DEFINITIONS: AchievementDef[] = [...SCORING, ...CAREER, ...INDIVIDUAL, ...SPECIAL];

// ============================================================
// Category config for tabs
// ============================================================

interface CategoryConfig {
  id: AchievementCategory;
  label: string;
  icon: React.ReactNode;
  definitions: AchievementDef[];
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'scoring',   label: 'Scoring',   icon: <Target className="h-4 w-4" />,   definitions: SCORING },
  { id: 'career',    label: 'Career',    icon: <Trophy className="h-4 w-4" />,   definitions: CAREER },
  { id: 'individual', label: 'Individual', icon: <Star className="h-4 w-4" />,   definitions: INDIVIDUAL },
  { id: 'special',   label: 'Special',   icon: <Sparkles className="h-4 w-4" />, definitions: SPECIAL },
];

// ============================================================
// Progress ring SVG
// ============================================================

function ProgressRing({ percent, size = 80, strokeWidth = 6 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="flex-shrink-0" aria-hidden="true">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#21262d"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#10b981"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function AchievementsSystem() {
  const gameState = useGameStore(state => state.gameState);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  // Compute achievements from actual game state
  const computed = useMemo<ComputedAchievement[]>(() => {
    if (!gameState) return ALL_DEFINITIONS.map(d => ({ ...d, unlocked: false, progress: 0, currentLabel: '0' }));

    const { player, recentResults, seasons } = gameState;
    const cs = player?.careerStats;
    const totalGoals = cs?.totalGoals ?? 0;
    const totalApps = cs?.totalAppearances ?? 0;
    const trophies = cs?.trophies ?? [];
    const completedSeasons = seasons ?? [];

    // Helper: check if any match has playerGoals >= 3
    const hasHatTrick = (recentResults ?? []).some(r => r.playerGoals >= 3);

    // Helper: highest single-match rating
    const allRatings = (recentResults ?? []).map(r => r.playerRating);
    const maxRating = allRatings.length > 0 ? Math.max(...allRatings) : 0;

    // Helper: season MVP — any completed season with avg 8.0+
    const hasSeasonMVP = completedSeasons.some(s => (s.playerStats?.averageRating ?? 0) >= 8.0);

    // Helper: 15+ assists in a single season
    const hasAssistKing = completedSeasons.some(s => (s.playerStats?.assists ?? 0) >= 15);

    // Helper: 35+ appearances in a season
    const hasIronMan = completedSeasons.some(s => (s.playerStats?.appearances ?? 0) >= 35);

    // Helper: 9.0+ rating in a match
    const hasManOfMatch = allRatings.some(r => r >= 9.0);

    // Helper: golden boot — season with most goals === top scorer (approximate: we check if there's a top_scorer award for the player)
    const hasGoldenBoot = trophies.some(t => t.name.toLowerCase().includes('golden boot') || t.name.toLowerCase().includes('top scorer'));

    // Helper: league champion
    const hasLeagueChampion = trophies.some(t => t.name.toLowerCase().includes('league') || t.name.toLowerCase().includes('champion'));

    // Helper: cup winner
    const hasCupWinner = trophies.some(t => t.name.toLowerCase().includes('cup') && !t.name.toLowerCase().includes('golden'));

    // Helper: national team call-up
    const hasWorldCupCallup = (gameState.internationalCareer?.caps ?? 0) > 0;

    // Helper: transfer completed (check if player has been at more than 1 club or if any trophies mention transfer)
    // We approximate: if seasons span different clubs, or if there are any transfer offers accepted
    const hasTransfer = (gameState.internationalCareer?.lastCallUpSeason ?? 0) > 0
      || completedSeasons.length > 1; // simplified heuristic

    // Helper: fan approval 90+ (use reputation as proxy)
    const fanApproval = player?.reputation ?? 0;
    const hasFanFavorite = fanApproval >= 90;

    // Helper: derby hero — scored in a match where both clubs share the same league/city
    // Since we can't detect derries perfectly, use the match events
    const hasDerbyHero = (recentResults ?? []).some(r => {
      // A derby is when the home and away clubs are in the same league
      return r.homeClub.league === r.awayClub.league && r.playerGoals > 0;
    });

    // Helper: underdog story — won against team 20+ quality higher
    const hasUnderdogStory = (recentResults ?? []).some(r => {
      const isHome = r.homeClub.id === gameState.currentClub.id;
      const playerClub = isHome ? r.homeClub : r.awayClub;
      const opponent = isHome ? r.awayClub : r.homeClub;
      const playerScore = isHome ? r.homeScore : r.awayScore;
      const oppScore = isHome ? r.awayScore : r.homeScore;
      return playerScore > oppScore && (opponent.quality - playerClub.quality) >= 20;
    });

    // Helper: club legend — 5+ seasons at one club
    const hasClubLegend = completedSeasons.length >= 5;

    // Helper: build a ComputedAchievement from a definition
    const mk = (
      def: AchievementDef, unlocked: boolean,
      current: number, target: number,
      unlockedSeason?: number,
    ): ComputedAchievement => ({
      ...def,
      unlocked,
      progress: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
      currentLabel: `${current}/${target}`,
      unlockedSeason,
    });

    // Build the computed list
    const computeOne = (def: AchievementDef): ComputedAchievement => {
      switch (def.id) {
        case 'first_goal':
          return mk(def, totalGoals >= 1, totalGoals, 1, totalGoals >= 1 ? completedSeasons[0]?.number : undefined);
        case 'hat_trick':
          return mk(def, hasHatTrick, 0, 1, hasHatTrick ? completedSeasons[0]?.number : undefined);
        case '10_goals':
          return mk(def, totalGoals >= 10, totalGoals, 10, totalGoals >= 10 ? completedSeasons[0]?.number : undefined);
        case '50_goals':
          return mk(def, totalGoals >= 50, totalGoals, 50, totalGoals >= 50 ? completedSeasons[1]?.number : undefined);
        case '100_goals':
          return mk(def, totalGoals >= 100, totalGoals, 100, totalGoals >= 100 ? completedSeasons[2]?.number : undefined);
        case 'golden_boot':
          return mk(def, hasGoldenBoot, hasGoldenBoot ? 1 : 0, 1);
        case 'first_cap':
          return mk(def, totalApps >= 1, totalApps, 1, totalApps >= 1 ? completedSeasons[0]?.number : undefined);
        case '50_apps':
          return mk(def, totalApps >= 50, totalApps, 50, totalApps >= 50 ? completedSeasons[1]?.number : undefined);
        case '100_apps':
          return mk(def, totalApps >= 100, totalApps, 100, totalApps >= 100 ? completedSeasons[2]?.number : undefined);
        case 'club_legend':
          return mk(def, hasClubLegend, completedSeasons.length, 5);
        case 'league_champion':
          return mk(def, hasLeagueChampion, trophies.filter(t => t.name.toLowerCase().includes('league') || t.name.toLowerCase().includes('champion')).length, 1);
        case 'cup_winner':
          return mk(def, hasCupWinner, trophies.filter(t => t.name.toLowerCase().includes('cup') && !t.name.toLowerCase().includes('golden')).length, 1);
        case 'man_of_match':
          return mk(def, hasManOfMatch, allRatings.filter(r => r >= 9.0).length, 1);
        case 'season_mvp':
          return mk(def, hasSeasonMVP, completedSeasons.filter(s => (s.playerStats?.averageRating ?? 0) >= 8.0).length, 1);
        case 'perfect_ten':
          return mk(def, maxRating >= 10.0, maxRating, 10);
        case 'assist_king':
          return mk(def, hasAssistKing, Math.max(...completedSeasons.map(s => s.playerStats?.assists ?? 0), 0), 15);
        case 'iron_man':
          return mk(def, hasIronMan, Math.max(...completedSeasons.map(s => s.playerStats?.appearances ?? 0), 0), 35);
        case 'world_cup_callup':
          return mk(def, hasWorldCupCallup, gameState.internationalCareer?.caps ?? 0, 1);
        case 'transfer_record':
          return mk(def, hasTransfer, completedSeasons.length > 1 ? 1 : 0, 1);
        case 'fan_favorite':
          return mk(def, hasFanFavorite, fanApproval, 90);
        case 'derby_hero':
          return mk(def, hasDerbyHero, hasDerbyHero ? 1 : 0, 1);
        case 'underdog_story':
          return mk(def, hasUnderdogStory, hasUnderdogStory ? 1 : 0, 1);
        default:
          return mk(def, false, 0, 1);
      }
    };

    return ALL_DEFINITIONS.map(computeOne);
  }, [gameState]);

  // Filtered list for active category
  const filtered = activeCategory === 'all'
    ? computed
    : computed.filter(a => a.category === activeCategory);

  const totalUnlocked = computed.filter(a => a.unlocked).length;
  const totalCount = computed.length;
  const overallPercent = totalCount > 0 ? Math.round((totalUnlocked / totalCount) * 100) : 0;

  // Count per category
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of computed) {
      counts[a.category] = (counts[a.category] ?? 0) + (a.unlocked ? 1 : 0);
    }
    return counts;
  }, [computed]);

  if (!gameState) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8b949e] text-sm">No career data available.</p>
      </div>
    );
  }

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
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#c9d1d9]">Achievements</h1>
            <p className="text-xs text-[#8b949e]">
              {totalUnlocked}/{totalCount} Unlocked
            </p>
          </div>
        </div>
      </motion.div>

      {/* --- Overall Completion Card --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <ProgressRing percent={overallPercent} size={72} strokeWidth={6} />
            <span className="absolute text-sm font-bold text-emerald-400">
              {overallPercent}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">
              Overall Completion
            </p>
            <div className="w-full h-2.5 bg-[#21262d] rounded-sm overflow-hidden mb-2">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="h-full bg-emerald-500 rounded-sm"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-[#8b949e]">
              {totalUnlocked} of {totalCount} achievements unlocked
            </p>
          </div>
        </div>
      </motion.div>

      {/* --- Category Tabs --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none"
      >
        {/* All tab */}
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
            activeCategory === 'all'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          All
          <span className="text-[10px] opacity-70">{totalUnlocked}/{totalCount}</span>
        </button>

        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
              activeCategory === cat.id
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {cat.icon}
            {cat.label}
            <span className="text-[10px] opacity-70">
              {catCounts[cat.id] ?? 0}/{cat.definitions.length}
            </span>
          </button>
        ))}
      </motion.div>

      {/* --- Achievement Cards --- */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {filtered.map((achievement, idx) => (
              <AchievementCard key={achievement.id} achievement={achievement} delay={idx * 0.03} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-[#484f58]">
          <Lock className="h-8 w-8 mb-2" />
          <span className="text-xs">No achievements in this category yet.</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Achievement Card
// ============================================================

function AchievementCard({ achievement, delay }: { achievement: ComputedAchievement; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const { unlocked, progress, currentLabel, unlockedSeason, xpReward, name, description, category } = achievement;

  const catConfig = CATEGORIES.find(c => c.id === category);
  const CatIcon = catConfig?.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay }}
      className={`rounded-lg border overflow-hidden ${
        unlocked
          ? 'bg-emerald-500/5 border-emerald-500/30'
          : 'bg-[#161b22] border-[#30363d]'
      }`}
    >
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
          unlocked
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-[#21262d] border-[#30363d] text-[#484f58]'
        }`}>
          {unlocked ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold truncate ${
              unlocked ? 'text-emerald-300' : 'text-[#8b949e]'
            }`}>
              {name}
            </span>
            {unlocked && (
              <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                UNLOCKED
              </span>
            )}
          </div>
          <p className={`text-[11px] mt-0.5 truncate ${
            unlocked ? 'text-[#8b949e]' : 'text-[#484f58]'
          }`}>
            {description}
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-medium ${
            unlocked ? 'text-emerald-400' : 'text-[#484f58]'
          }`}>
            +{xpReward} XP
          </span>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[#484f58]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#484f58]" />
          )}
        </div>
      </button>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="border-t border-[#30363d] px-3 py-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${
                unlocked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#21262d] text-[#484f58]'
              }`}>
                {CatIcon}
              </div>
              <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
                {catConfig?.label ?? category}
              </span>
            </div>

            {/* Progress */}
            {unlocked ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-emerald-300 font-medium">
                  Completed{unlockedSeason ? ` — Season ${unlockedSeason}` : ''}
                </span>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#8b949e]">Progress</span>
                  <span className="text-[10px] text-[#8b949e]">{currentLabel}</span>
                </div>
                <div className="w-full h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`h-full rounded-sm ${
                      progress > 0 ? 'bg-amber-400' : 'bg-[#30363d]'
                    }`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Reward */}
            <div className="mt-2 pt-2 border-t border-[#30363d]/50">
              <span className="text-[10px] text-[#484f58]">Reward: </span>
              <span className="text-[10px] font-semibold text-emerald-400">+{xpReward} XP</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
