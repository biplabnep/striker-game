'use client';

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Trophy, Lock, Medal, Star, Crown, Calendar, Target, Footprints, Flag, TrendingUp } from 'lucide-react';

// ============================================================
// Trophy Tier Definitions
// ============================================================

type TrophyTier = 'legendary' | 'epic' | 'rare' | 'common';
type TrophyCategory = 'league' | 'continental' | 'domestic_cup' | 'international' | 'individual';

interface TrophyDefinition {
  id: string;
  name: string;
  tier: TrophyTier;
  category: TrophyCategory;
  description: string;
}

const ALL_TROPHY_DEFINITIONS: TrophyDefinition[] = [
  // League
  { id: 'premier_league', name: 'Premier League Winner', tier: 'legendary', category: 'league', description: 'Top of the league table' },
  { id: 'la_liga', name: 'La Liga Winner', tier: 'legendary', category: 'league', description: 'Champions of Spain' },
  { id: 'bundesliga', name: 'Bundesliga Winner', tier: 'legendary', category: 'league', description: 'Champions of Germany' },
  { id: 'serie_a', name: 'Serie A Winner', tier: 'legendary', category: 'league', description: 'Champions of Italy' },
  { id: 'ligue_1', name: 'Ligue 1 Winner', tier: 'epic', category: 'league', description: 'Champions of France' },
  { id: 'eredivisie', name: 'Eredivisie Winner', tier: 'rare', category: 'league', description: 'Champions of Netherlands' },
  { id: 'primeira_liga', name: 'Primeira Liga Winner', tier: 'rare', category: 'league', description: 'Champions of Portugal' },
  // Continental
  { id: 'champions_league', name: 'Champions League', tier: 'legendary', category: 'continental', description: 'European champions' },
  { id: 'europa_league', name: 'Europa League', tier: 'epic', category: 'continental', description: 'Europa League champions' },
  { id: 'conference_league', name: 'Conference League', tier: 'rare', category: 'continental', description: 'Conference League champions' },
  { id: 'club_world_cup', name: 'Club World Cup', tier: 'legendary', category: 'continental', description: 'World champions' },
  { id: 'eu_super_cup', name: 'UEFA Super Cup', tier: 'epic', category: 'continental', description: 'European Super Cup' },
  // Domestic Cup
  { id: 'fa_cup', name: 'FA Cup Winner', tier: 'epic', category: 'domestic_cup', description: 'FA Cup champions' },
  { id: 'copa_del_rey', name: 'Copa del Rey', tier: 'epic', category: 'domestic_cup', description: 'Spanish Cup winners' },
  { id: 'dfb_pokal', name: 'DFB-Pokal', tier: 'epic', category: 'domestic_cup', description: 'German Cup winners' },
  { id: 'copa_italia', name: 'Coppa Italia', tier: 'epic', category: 'domestic_cup', description: 'Italian Cup winners' },
  { id: 'league_cup', name: 'League Cup', tier: 'rare', category: 'domestic_cup', description: 'League Cup winners' },
  { id: 'community_shield', name: 'Community Shield', tier: 'common', category: 'domestic_cup', description: 'Community Shield winners' },
  // International
  { id: 'world_cup', name: 'FIFA World Cup', tier: 'legendary', category: 'international', description: 'World Cup champions' },
  { id: 'euro', name: 'UEFA European Championship', tier: 'legendary', category: 'international', description: 'European champions' },
  { id: 'copa_america', name: 'Copa America', tier: 'legendary', category: 'international', description: 'South American champions' },
  { id: 'africa_cup', name: 'Africa Cup of Nations', tier: 'epic', category: 'international', description: 'African champions' },
  { id: 'nations_league', name: 'UEFA Nations League', tier: 'epic', category: 'international', description: 'Nations League winners' },
  { id: 'confed_cup', name: 'Confederations Cup', tier: 'rare', category: 'international', description: 'Confederations Cup winners' },
  // Individual
  { id: 'ballon_dor', name: 'Ballon d\'Or', tier: 'legendary', category: 'individual', description: 'Best player in the world' },
  { id: 'golden_boot', name: 'Golden Boot', tier: 'epic', category: 'individual', description: 'Top scorer in the league' },
  { id: 'player_of_year', name: 'Player of the Year', tier: 'epic', category: 'individual', description: 'Season player of the year' },
  { id: 'young_player', name: 'Young Player of the Year', tier: 'rare', category: 'individual', description: 'Best young player' },
  { id: 'best_midfielder', name: 'Best Midfielder', tier: 'rare', category: 'individual', description: 'Best midfielder award' },
  { id: 'playmaker_award', name: 'Playmaker Award', tier: 'rare', category: 'individual', description: 'Most assists in league' },
  { id: 'clean_sheet_gold', name: 'Golden Glove', tier: 'epic', category: 'individual', description: 'Most clean sheets' },
];

const TIER_COLORS: Record<TrophyTier, { border: string; bg: string; text: string; badge: string; glow: string }> = {
  legendary: {
    border: 'border-yellow-500/60',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300',
    glow: 'shadow-[0_0_12px_rgba(234,179,8,0.15)]',
  },
  epic: {
    border: 'border-purple-500/60',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300',
    glow: 'shadow-[0_0_10px_rgba(168,85,247,0.12)]',
  },
  rare: {
    border: 'border-blue-500/60',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
    glow: 'shadow-[0_0_8px_rgba(59,130,246,0.10)]',
  },
  common: {
    border: 'border-slate-500/40',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-300',
    glow: 'shadow-[0_0_6px_rgba(100,116,139,0.08)]',
  },
};

const CATEGORY_COLORS: Record<TrophyCategory, string> = {
  league: 'text-emerald-400',
  continental: 'text-blue-400',
  domestic_cup: 'text-orange-400',
  international: 'text-red-400',
  individual: 'text-yellow-400',
};

// ============================================================
// Legend comparison data (deterministic)
// ============================================================

interface LegendData {
  name: string;
  trophies: number;
  goals: number;
  assists: number;
  caps: number;
  era: string;
  flag: string;
}

const LEGEND_PLAYERS: LegendData[] = [
  { name: 'Cristiano Ronaldo', trophies: 35, goals: 850, assists: 260, caps: 206, era: '2002-2024', flag: '🇵🇹' },
  { name: 'Lionel Messi', trophies: 44, goals: 820, assists: 370, caps: 187, era: '2004-2024', flag: '🇦🇷' },
  { name: 'Zinedine Zidane', trophies: 18, goals: 158, assists: 105, caps: 108, era: '1988-2006', flag: '🇫🇷' },
];

// ============================================================
// Individual Award Definitions
// ============================================================

interface IndividualAward {
  id: string;
  name: string;
  tier: TrophyTier;
  description: string;
  requiredGoals?: number;
  requiredAssists?: number;
  requiredRating?: number;
}

const INDIVIDUAL_AWARDS: IndividualAward[] = [
  { id: 'poty', name: 'Player of the Year', tier: 'legendary', description: 'Best player of the season', requiredRating: 8.0 },
  { id: 'ypoty', name: 'Young Player of the Year', tier: 'epic', description: 'Best U-21 player', requiredRating: 7.5 },
  { id: 'golden_boot', name: 'Golden Boot', tier: 'epic', description: 'League top scorer', requiredGoals: 25 },
  { id: 'playmaker', name: 'Playmaker of the Year', tier: 'epic', description: 'Most assists in league', requiredAssists: 15 },
  { id: 'best_mid', name: 'Best Midfielder', tier: 'rare', description: 'Top-rated midfielder', requiredRating: 7.8 },
  { id: 'best_fw', name: 'Best Forward', tier: 'rare', description: 'Top-rated forward', requiredRating: 7.8 },
  { id: 'team_season', name: 'Team of the Season', tier: 'rare', description: 'Selected in TOTS', requiredRating: 7.5 },
  { id: 'potm_total', name: 'Player of the Month x3+', tier: 'epic', description: 'Won PotM at least 3 times' },
  { id: 'clean_sheet_gold', name: 'Golden Glove', tier: 'epic', description: 'Most clean sheets (GK)', requiredGoals: 0 },
  { id: 'fair_play', name: 'Fair Play Award', tier: 'common', description: 'Fewest cards' },
  { id: 'fan_fav', name: 'Fan Favorite', tier: 'common', description: 'Most loved by supporters' },
  { id: 'comeback_king', name: 'Comeback Player', tier: 'rare', description: 'Outstanding return from injury' },
];

// ============================================================
// SVG Trophy Icons
// ============================================================

function GoldTrophyIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8H36V20C36 28 29 34 24 36C19 34 12 28 12 20V8Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
      <path d="M12 12H8C8 12 6 18 10 22H12" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36 12H40C40 12 42 18 38 22H36" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="20" y="36" width="8" height="4" rx="1" fill="#B45309" />
      <rect x="16" y="40" width="16" height="3" rx="1" fill="#92400E" />
      <path d="M18 8H30" stroke="#FCD34D" strokeWidth="1" opacity="0.6" />
      <circle cx="24" cy="18" r="3" fill="#FCD34D" opacity="0.4" />
    </svg>
  );
}

function SilverTrophyIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8H36V20C36 28 29 34 24 36C19 34 12 28 12 20V8Z" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1.5" />
      <path d="M12 12H8C8 12 6 18 10 22H12" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36 12H40C40 12 42 18 38 22H36" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="20" y="36" width="8" height="4" rx="1" fill="#6B7280" />
      <rect x="16" y="40" width="16" height="3" rx="1" fill="#4B5563" />
      <path d="M18 8H30" stroke="#D1D5DB" strokeWidth="1" opacity="0.6" />
      <circle cx="24" cy="18" r="3" fill="#D1D5DB" opacity="0.4" />
    </svg>
  );
}

function BronzeTrophyIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8H36V20C36 28 29 34 24 36C19 34 12 28 12 20V8Z" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
      <path d="M12 12H8C8 12 6 18 10 22H12" fill="none" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36 12H40C40 12 42 18 38 22H36" fill="none" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="20" y="36" width="8" height="4" rx="1" fill="#78350F" />
      <rect x="16" y="40" width="16" height="3" rx="1" fill="#451A03" />
      <path d="M18 8H30" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />
      <circle cx="24" cy="18" r="3" fill="#F59E0B" opacity="0.35" />
    </svg>
  );
}

function StandardTrophyIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8H34V20C34 27 28 32 24 34C20 32 14 27 14 20V8Z" fill="#4B5563" stroke="#374151" strokeWidth="1.5" />
      <path d="M14 12H10C10 12 8 17 12 20H14" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M34 12H38C38 12 40 17 36 20H34" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="21" y="34" width="6" height="3" rx="1" fill="#374151" />
      <rect x="17" y="37" width="14" height="3" rx="1" fill="#1F2937" />
    </svg>
  );
}

function MedalIcon({ size = 28, color = '#F59E0B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="19" r="10" fill={color} opacity="0.8" />
      <circle cx="16" cy="19" r="7" fill="none" stroke={color} strokeWidth="1" opacity="0.4" />
      <path d="M10 3L16 9L22 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3H20L22 9L16 12L10 9L12 3Z" fill={color} opacity="0.5" />
      <circle cx="16" cy="19" r="3" fill={color} opacity="0.3" />
    </svg>
  );
}

function RibbonIcon({ size = 28, color = '#A855F7' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 4L18 4L20 10L16 12L12 10L14 4Z" fill={color} opacity="0.7" />
      <path d="M12 10L8 26L16 20L24 26L20 10" fill={color} opacity="0.5" />
      <path d="M8 26L6 30L12 26" fill={color} opacity="0.3" />
      <path d="M24 26L26 30L20 26" fill={color} opacity="0.3" />
      <circle cx="16" cy="9" r="2" fill="white" opacity="0.4" />
    </svg>
  );
}

function getTrophyIconForTier(tier: TrophyTier, size = 32) {
  switch (tier) {
    case 'legendary':
      return <GoldTrophyIcon size={size} />;
    case 'epic':
      return <SilverTrophyIcon size={size} />;
    case 'rare':
      return <BronzeTrophyIcon size={size} />;
    default:
      return <StandardTrophyIcon size={size} />;
  }
}

function getTierLabel(tier: TrophyTier): string {
  switch (tier) {
    case 'legendary': return 'Legendary';
    case 'epic': return 'Epic';
    case 'rare': return 'Rare';
    case 'common': return 'Common';
  }
}

// ============================================================
// Hall of Fame milestones
// ============================================================

interface HOFMilestone {
  label: string;
  threshold: number;
  icon: string;
}

const HOF_MILESTONES: HOFMilestone[] = [
  { label: 'Rookie', threshold: 0, icon: '🌱' },
  { label: 'Prospect', threshold: 5, icon: '⭐' },
  { label: 'Professional', threshold: 15, icon: '🏅' },
  { label: 'Star', threshold: 30, icon: '🌟' },
  { label: 'Legend', threshold: 50, icon: '👑' },
  { label: 'Hall of Fame', threshold: 75, icon: '🏆' },
];

function calculateAchievementScore(
  totalTrophies: number,
  totalGoals: number,
  totalAssists: number,
  totalAppearances: number,
  caps: number,
  seasonsPlayed: number,
  unlockedAchievements: number
): number {
  let score = 0;
  score += totalTrophies * 3;
  score += Math.min(totalGoals, 200) / 4;
  score += Math.min(totalAssists, 100) / 5;
  score += Math.min(totalAppearances, 500) / 20;
  score += caps * 0.5;
  score += seasonsPlayed * 2;
  score += unlockedAchievements * 1.5;
  return Math.round(score);
}

// ============================================================
// Animation variants (opacity only, no transforms)
// ============================================================

const fadeContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const fadeItem = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.04, duration: 0.3 },
  }),
};

const fadeSection = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.1, duration: 0.4 },
  },
};

// ============================================================
// Main Component
// ============================================================

export default function TrophyCabinet() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<'trophies' | 'awards' | 'timeline' | 'compare'>('trophies');

  const playerData = useMemo(() => {
    if (!gameState) return null;

    const { player, currentClub, currentSeason, currentWeek, year } = gameState;
    const { careerStats, seasonStats } = player;
    const { internationalCareer } = gameState;
    const { achievements } = gameState;
    const { seasonAwards } = gameState;
    const { seasons } = gameState;

    const earnedTrophyNames = new Set(careerStats.trophies.map(t => t.name.toLowerCase()));

    // Map earned trophies to definitions
    const earnedTrophies = careerStats.trophies.map(trophy => {
      const def = ALL_TROPHY_DEFINITIONS.find(
        d => d.name.toLowerCase() === trophy.name.toLowerCase()
      );
      return {
        name: trophy.name,
        season: trophy.season,
        club: currentClub.name,
        logo: currentClub.logo,
        tier: def?.tier ?? 'common',
        category: def?.category ?? 'league',
        description: def?.description ?? '',
      };
    });

    // Determine unlocked individual awards based on career stats
    const unlockedAwards: (IndividualAward & { season?: number; rating?: number })[] = [];

    // Check each season for award eligibility
    seasons.forEach(s => {
      if (s.playerStats.averageRating >= 8.0) {
        if (!unlockedAwards.find(a => a.id === 'poty')) {
          unlockedAwards.push({ ...INDIVIDUAL_AWARDS.find(a => a.id === 'poty')!, season: s.number, rating: s.playerStats.averageRating });
        }
      }
      if (s.playerStats.goals >= 25 && !unlockedAwards.find(a => a.id === 'golden_boot')) {
        unlockedAwards.push({ ...INDIVIDUAL_AWARDS.find(a => a.id === 'golden_boot')!, season: s.number, rating: s.playerStats.averageRating });
      }
      if (s.playerStats.assists >= 15 && !unlockedAwards.find(a => a.id === 'playmaker')) {
        unlockedAwards.push({ ...INDIVIDUAL_AWARDS.find(a => a.id === 'playmaker')!, season: s.number, rating: s.playerStats.averageRating });
      }
      if (s.playerStats.averageRating >= 7.5 && player.age <= 21 && !unlockedAwards.find(a => a.id === 'ypoty')) {
        unlockedAwards.push({ ...INDIVIDUAL_AWARDS.find(a => a.id === 'ypoty')!, season: s.number, rating: s.playerStats.averageRating });
      }
      if (s.playerStats.averageRating >= 7.5 && !unlockedAwards.find(a => a.id === 'team_season')) {
        unlockedAwards.push({ ...INDIVIDUAL_AWARDS.find(a => a.id === 'team_season')!, season: s.number, rating: s.playerStats.averageRating });
      }
    });

    // Add season awards that are player awards
    const playerSeasonAwards = seasonAwards.filter(a => a.isPlayer);

    // Calculate hall of fame score
    const unlockedAchievements = achievements.filter(a => a.unlocked).length;
    const hofScore = calculateAchievementScore(
      careerStats.trophies.length,
      careerStats.totalGoals,
      careerStats.totalAssists,
      careerStats.totalAppearances,
      internationalCareer.caps,
      careerStats.seasonsPlayed,
      unlockedAchievements
    );

    // Timeline data from trophies sorted by season
    const timelineData = [...earnedTrophies].sort((a, b) => a.season - b.season);

    // Player comparison data
    const playerComparison: LegendData = {
      name: player.name,
      trophies: careerStats.trophies.length,
      goals: careerStats.totalGoals,
      assists: careerStats.totalAssists,
      caps: internationalCareer.caps,
      era: `${year - player.age + 14}-${year}`,
      flag: player.nationality === 'English' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿' :
            player.nationality === 'Spanish' ? '🇪🇸' :
            player.nationality === 'French' ? '🇫🇷' :
            player.nationality === 'German' ? '🇩🇪' :
            player.nationality === 'Italian' ? '🇮🇹' :
            player.nationality === 'Portuguese' ? '🇵🇹' :
            player.nationality === 'Brazilian' ? '🇧🇷' :
            player.nationality === 'Argentine' ? '🇦🇷' : '⚽',
    };

    // Locked trophies (not yet earned)
    const lockedTrophies = ALL_TROPHY_DEFINITIONS.filter(
      d => !earnedTrophyNames.has(d.name.toLowerCase())
    );

    return {
      playerName: player.name,
      clubName: currentClub.name,
      clubLogo: currentClub.logo,
      clubPrimaryColor: currentClub.primaryColor,
      currentSeason,
      currentWeek,
      year,
      age: player.age,
      position: player.position,
      overall: player.overall,
      earnedTrophies,
      lockedTrophies,
      totalTrophies: careerStats.trophies.length,
      totalGoals: careerStats.totalGoals,
      totalAssists: careerStats.totalAssists,
      totalAppearances: careerStats.totalAppearances,
      totalCleanSheets: careerStats.totalCleanSheets,
      caps: internationalCareer.caps,
      internationalGoals: internationalCareer.goals,
      seasonsPlayed: careerStats.seasonsPlayed,
      unlockedAwards,
      playerSeasonAwards,
      hofScore,
      timelineData,
      playerComparison,
      unlockedAchievements,
    };
  }, [gameState]);

  if (!gameState || !playerData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-[#484f58]">
          <Trophy className="h-12 w-12" />
          <p className="text-sm">Start a career to view your Trophy Cabinet</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Career Honors Summary Bar
  // ============================================================
  const HonorsSummaryBar = (
    <motion.section
      variants={fadeSection}
      initial="hidden"
      animate="visible"
      className="mb-4"
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-4 w-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Career Honors</h2>
          <span className="text-[10px] text-[#484f58] ml-auto">Season {playerData.currentSeason}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { icon: <Trophy className="h-4 w-4 text-yellow-400" />, value: playerData.totalTrophies, label: 'Trophies' },
            { icon: <Target className="h-4 w-4 text-emerald-400" />, value: playerData.totalGoals, label: 'Goals' },
            { icon: <Footprints className="h-4 w-4 text-blue-400" />, value: playerData.totalAssists, label: 'Assists' },
            { icon: <Calendar className="h-4 w-4 text-orange-400" />, value: playerData.totalAppearances, label: 'Apps' },
            { icon: <Flag className="h-4 w-4 text-red-400" />, value: playerData.caps, label: 'Caps' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 bg-[#0d1117] rounded-lg py-2.5 px-1 border border-[#21262d]">
              <div className="text-[#8b949e]">{stat.icon}</div>
              <span className="text-base font-bold text-[#c9d1d9] leading-none">{stat.value}</span>
              <span className="text-[9px] text-[#484f58] font-medium uppercase">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );

  // ============================================================
  // Hall of Fame Meter
  // ============================================================
  const hofMaxScore = 100;
  const hofPercent = Math.min((playerData.hofScore / hofMaxScore) * 100, 100);
  const currentHofMilestone = [...HOF_MILESTONES].reverse().find(m => playerData.hofScore >= m.threshold) ?? HOF_MILESTONES[0];
  const nextHofMilestone = HOF_MILESTONES[HOF_MILESTONES.indexOf(currentHofMilestone) + 1] ?? null;
  const milestoneProgress = nextHofMilestone
    ? ((playerData.hofScore - currentHofMilestone.threshold) / (nextHofMilestone.threshold - currentHofMilestone.threshold)) * 100
    : 100;

  const HallOfFameSection = (
    <motion.section
      variants={fadeSection}
      initial="hidden"
      animate="visible"
      className="mb-4"
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-[#c9d1d9]">Hall of Fame Progress</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{currentHofMilestone.icon}</span>
            <span className="text-xs font-semibold text-[#c9d1d9]">{currentHofMilestone.label}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mb-2">
          <div className="h-3 bg-[#0d1117] rounded-sm border border-[#21262d] overflow-hidden">
            <motion.div
              className="h-full rounded-sm"
              style={{ backgroundColor: hofPercent >= 75 ? '#EAB308' : hofPercent >= 50 ? '#A855F7' : hofPercent >= 30 ? '#3B82F6' : '#10B981' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="h-full rounded-sm"
                style={{ width: `${hofPercent}%` }}
              />
            </motion.div>
          </div>

          {/* Milestone markers */}
          <div className="relative h-4 mt-1">
            {HOF_MILESTONES.map(m => {
              const pct = (m.threshold / hofMaxScore) * 100;
              return (
                <div
                  key={m.label}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${pct}%` }}
                >
                  <div className={`w-px h-2 ${playerData.hofScore >= m.threshold ? 'bg-yellow-400' : 'bg-[#30363d]'}`} />
                  <span className="text-[7px] mt-0.5 text-[#484f58] absolute -bottom-2 whitespace-nowrap" style={{ transform: 'translateX(-50%)' }}>{m.icon}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score + next milestone info */}
        <div className="flex items-center justify-between pt-3">
          <div>
            <span className="text-[10px] text-[#484f58]">Achievement Score</span>
            <p className="text-sm font-bold text-[#c9d1d9]">{playerData.hofScore} <span className="text-[10px] text-[#484f58] font-normal">/ {hofMaxScore}</span></p>
          </div>
          {nextHofMilestone && (
            <div className="text-right">
              <span className="text-[10px] text-[#484f58]">Next: {nextHofMilestone.icon} {nextHofMilestone.label}</span>
              <p className="text-xs text-[#8b949e]">{nextHofMilestone.threshold - playerData.hofScore} points away</p>
            </div>
          )}
          {!nextHofMilestone && (
            <div className="text-right">
              <span className="text-xs text-yellow-400 font-semibold">Max status reached!</span>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );

  // ============================================================
  // Trophy Showcase Grid
  // ============================================================
  const TrophyGridSection = (
    <motion.section
      variants={fadeSection}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-[#c9d1d9]">Trophy Cabinet</h2>
          </div>
          <span className="text-[10px] text-[#484f58]">{playerData.earnedTrophies.length} / {ALL_TROPHY_DEFINITIONS.length}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Earned trophies */}
          {playerData.earnedTrophies.map((trophy, idx) => {
            const tierStyle = TIER_COLORS[trophy.tier];
            return (
              <motion.div
                key={`earned-${trophy.name}-${idx}`}
                variants={fadeItem}
                initial="hidden"
                animate="visible"
                custom={idx}
                className={`relative border rounded-lg p-3 ${tierStyle.border} ${tierStyle.bg} ${tierStyle.glow} flex flex-col items-center gap-2`}
              >
                {/* Tier badge */}
                <span className={`absolute top-1.5 right-1.5 text-[7px] font-bold uppercase px-1.5 py-px rounded-sm ${tierStyle.badge}`}>
                  {getTierLabel(trophy.tier)}
                </span>
                {getTrophyIconForTier(trophy.tier, 28)}
                <div className="text-center">
                  <p className="text-[10px] font-semibold text-[#c9d1d9] leading-tight">{trophy.name}</p>
                  <p className="text-[8px] text-[#484f58] mt-0.5">Season {trophy.season}</p>
                  <p className="text-[8px] text-[#8b949e]">{trophy.club}</p>
                </div>
                <span className={`text-[8px] uppercase tracking-wide ${CATEGORY_COLORS[trophy.category]} font-medium`}>
                  {trophy.category.replace('_', ' ')}
                </span>
              </motion.div>
            );
          })}

          {/* Locked trophy slots (show up to 9) */}
          {playerData.lockedTrophies.slice(0, Math.max(9 - playerData.earnedTrophies.length, 3)).map((def, idx) => (
            <motion.div
              key={`locked-${def.id}`}
              variants={fadeItem}
              initial="hidden"
              animate="visible"
              custom={playerData.earnedTrophies.length + idx}
              className="relative border border-[#21262d] rounded-lg p-3 bg-[#0d1117] flex flex-col items-center gap-2 opacity-40"
            >
              <Lock className="h-5 w-5 text-[#30363d]" />
              <div className="text-center">
                <p className="text-[10px] font-medium text-[#484f58] leading-tight">{def.name}</p>
                <p className="text-[8px] text-[#30363d] mt-0.5">Not yet earned</p>
              </div>
              <span className="text-[7px] text-[#30363d] uppercase tracking-wide">
                {getTierLabel(def.tier)}
              </span>
            </motion.div>
          ))}
        </div>

        {playerData.earnedTrophies.length === 0 && (
          <div className="mt-4 text-center py-4">
            <Lock className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
            <p className="text-xs text-[#484f58]">No trophies yet. Win competitions to fill your cabinet!</p>
            <p className="text-[10px] text-[#30363d] mt-1">Trophies are awarded based on league positions and cup victories.</p>
          </div>
        )}
      </div>
    </motion.section>
  );

  // ============================================================
  // Individual Awards Section
  // ============================================================
  const AwardsSection = (
    <motion.section
      variants={fadeSection}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-[#c9d1d9]">Individual Awards</h2>
          </div>
          <span className="text-[10px] text-[#484f58]">{playerData.unlockedAwards.length} / {INDIVIDUAL_AWARDS.length}</span>
        </div>

        <div className="space-y-2">
          {playerData.unlockedAwards.map((award, idx) => {
            const tierStyle = TIER_COLORS[award.tier];
            return (
              <motion.div
                key={award.id}
                variants={fadeItem}
                initial="hidden"
                animate="visible"
                custom={idx}
                className={`flex items-center gap-3 border rounded-lg p-3 ${tierStyle.border} ${tierStyle.bg}`}
              >
                <div className="flex-shrink-0">
                  {award.tier === 'legendary' ? (
                    <MedalIcon size={32} color="#EAB308" />
                  ) : award.tier === 'epic' ? (
                    <MedalIcon size={32} color="#A855F7" />
                  ) : (
                    <RibbonIcon size={32} color="#3B82F6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-[#c9d1d9] truncate">{award.name}</p>
                    <span className={`text-[7px] font-bold uppercase px-1.5 py-px rounded-sm flex-shrink-0 ${tierStyle.badge}`}>
                      {getTierLabel(award.tier)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">{award.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {award.season && (
                      <span className="text-[9px] text-[#484f58]">Season {award.season}</span>
                    )}
                    {award.rating && (
                      <span className="text-[9px] text-emerald-400 font-medium">Rating: {award.rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {award.tier === 'legendary' ? (
                    <MedalIcon size={20} color="#EAB308" />
                  ) : (
                    <RibbonIcon size={20} color="#A855F7" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Locked awards preview */}
        {playerData.unlockedAwards.length < INDIVIDUAL_AWARDS.length && (
          <div className="mt-3 pt-3 border-t border-[#21262d]">
            <p className="text-[10px] text-[#484f58] font-semibold uppercase tracking-wide mb-2">Locked Awards</p>
            <div className="grid grid-cols-2 gap-1.5">
              {INDIVIDUAL_AWARDS.filter(a => !playerData.unlockedAwards.find(ua => ua.id === a.id)).slice(0, 6).map((award) => (
                <div key={award.id} className="flex items-center gap-2 py-1.5 px-2 bg-[#0d1117] rounded-md border border-[#21262d] opacity-40">
                  <Lock className="h-3 w-3 text-[#30363d] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-medium text-[#484f58] truncate">{award.name}</p>
                    <p className="text-[7px] text-[#30363d] truncate">{award.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {playerData.unlockedAwards.length === 0 && (
          <div className="text-center py-6">
            <Medal className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
            <p className="text-xs text-[#484f58]">No individual awards yet.</p>
            <p className="text-[10px] text-[#30363d] mt-1">Perform consistently well to win personal accolades.</p>
          </div>
        )}
      </div>

      {/* Season Awards from game state */}
      {playerData.playerSeasonAwards.length > 0 && (
        <motion.section
          variants={fadeSection}
          initial="hidden"
          animate="visible"
        >
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-yellow-400" />
              <h2 className="text-sm font-semibold text-[#c9d1d9]">Season Awards</h2>
            </div>
            <div className="space-y-2">
              {playerData.playerSeasonAwards.map((award, idx) => (
                <motion.div
                  key={award.id}
                  variants={fadeItem}
                  initial="hidden"
                  animate="visible"
                  custom={idx}
                  className="flex items-center gap-3 border border-[#21262d] rounded-lg p-3 bg-[#0d1117]"
                >
                  <span className="text-lg flex-shrink-0">{award.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#c9d1d9]">{award.name}</p>
                    <p className="text-[10px] text-[#8b949e]">{award.winnerClub} — Season {award.season}</p>
                    <p className="text-[9px] text-emerald-400 mt-0.5">{award.stats}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}
    </motion.section>
  );

  // ============================================================
  // Trophy Timeline
  // ============================================================
  const TimelineSection = (
    <motion.section
      variants={fadeSection}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Trophy Timeline</h2>
        </div>

        {playerData.timelineData.length > 0 ? (
          <div className="relative ml-4">
            {/* Vertical line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-[#30363d]" />

            <div className="space-y-4">
              {playerData.timelineData.map((entry, idx) => {
                const tierStyle = TIER_COLORS[entry.tier];
                return (
                  <motion.div
                    key={`timeline-${entry.name}-${entry.season}-${idx}`}
                    variants={fadeItem}
                    initial="hidden"
                    animate="visible"
                    custom={idx}
                    className="relative pl-6"
                  >
                    {/* Year marker dot */}
                    <div className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-sm border-2 ${tierStyle.border} bg-[#0d1117] -translate-x-[5px]`} />

                    <div className={`border rounded-lg p-3 ${tierStyle.border} ${tierStyle.bg}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getTrophyIconForTier(entry.tier, 20)}
                          <div>
                            <p className="text-xs font-semibold text-[#c9d1d9]">{entry.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-[#8b949e]">Season {entry.season}</span>
                              <span className="text-[8px] text-[#484f58]">•</span>
                              <span className="text-[9px] text-[#8b949e]">{entry.club}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`text-[7px] font-bold uppercase px-1.5 py-px rounded-sm flex-shrink-0 ${tierStyle.badge}`}>
                          {getTierLabel(entry.tier)}
                        </span>
                      </div>
                      <p className="text-[9px] text-[#484f58] mt-1">{entry.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
            <p className="text-xs text-[#484f58]">Your trophy timeline will appear here as you win competitions.</p>
          </div>
        )}
      </div>
    </motion.section>
  );

  // ============================================================
  // Comparison Section (horizontal bar chart)
  // ============================================================
  const comparisonData = [
    { ...playerData.playerComparison, isPlayer: true },
    ...LEGEND_PLAYERS.map(l => ({ ...l, isPlayer: false })),
  ];

  const maxTrophies = Math.max(...comparisonData.map(d => d.trophies), 1);
  const maxGoals = Math.max(...comparisonData.map(d => d.goals), 1);
  const maxAssists = Math.max(...comparisonData.map(d => d.assists), 1);

  const ComparisonSection = (
    <motion.section
      variants={fadeSection}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-4 w-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Legend Comparison</h2>
        </div>

        <div className="space-y-4">
          {/* Trophies comparison */}
          <div>
            <p className="text-[10px] text-[#484f58] uppercase tracking-wide font-semibold mb-2">Trophies</p>
            {comparisonData.map((p, idx) => (
              <motion.div
                key={`trophies-${p.name}`}
                variants={fadeItem}
                initial="hidden"
                animate="visible"
                custom={idx}
                className="flex items-center gap-2 mb-1.5"
              >
                <span className="text-sm w-5 text-center flex-shrink-0">{p.flag}</span>
                <span className={`text-[10px] w-24 truncate flex-shrink-0 ${p.isPlayer ? 'text-emerald-400 font-semibold' : 'text-[#8b949e]'}`}>
                  {p.name}
                </span>
                <div className="flex-1 h-3 bg-[#0d1117] rounded-sm border border-[#21262d] overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${p.isPlayer ? 'bg-emerald-500' : 'bg-[#30363d]'}`}
                    style={{ width: `${(p.trophies / maxTrophies) * 100}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold w-8 text-right flex-shrink-0 ${p.isPlayer ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                  {p.trophies}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Goals comparison */}
          <div>
            <p className="text-[10px] text-[#484f58] uppercase tracking-wide font-semibold mb-2">Goals</p>
            {comparisonData.map((p, idx) => (
              <motion.div
                key={`goals-${p.name}`}
                variants={fadeItem}
                initial="hidden"
                animate="visible"
                custom={idx + 4}
                className="flex items-center gap-2 mb-1.5"
              >
                <span className="text-sm w-5 text-center flex-shrink-0">{p.flag}</span>
                <span className={`text-[10px] w-24 truncate flex-shrink-0 ${p.isPlayer ? 'text-emerald-400 font-semibold' : 'text-[#8b949e]'}`}>
                  {p.name}
                </span>
                <div className="flex-1 h-3 bg-[#0d1117] rounded-sm border border-[#21262d] overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${p.isPlayer ? 'bg-blue-500' : 'bg-[#30363d]'}`}
                    style={{ width: `${(p.goals / maxGoals) * 100}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold w-8 text-right flex-shrink-0 ${p.isPlayer ? 'text-blue-400' : 'text-[#8b949e]'}`}>
                  {p.goals}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Assists comparison */}
          <div>
            <p className="text-[10px] text-[#484f58] uppercase tracking-wide font-semibold mb-2">Assists</p>
            {comparisonData.map((p, idx) => (
              <motion.div
                key={`assists-${p.name}`}
                variants={fadeItem}
                initial="hidden"
                animate="visible"
                custom={idx + 8}
                className="flex items-center gap-2 mb-1.5"
              >
                <span className="text-sm w-5 text-center flex-shrink-0">{p.flag}</span>
                <span className={`text-[10px] w-24 truncate flex-shrink-0 ${p.isPlayer ? 'text-emerald-400 font-semibold' : 'text-[#8b949e]'}`}>
                  {p.name}
                </span>
                <div className="flex-1 h-3 bg-[#0d1117] rounded-sm border border-[#21262d] overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${p.isPlayer ? 'bg-purple-500' : 'bg-[#30363d]'}`}
                    style={{ width: `${(p.assists / maxAssists) * 100}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold w-8 text-right flex-shrink-0 ${p.isPlayer ? 'text-purple-400' : 'text-[#8b949e]'}`}>
                  {p.assists}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Caps comparison */}
          <div>
            <p className="text-[10px] text-[#484f58] uppercase tracking-wide font-semibold mb-2">International Caps</p>
            {comparisonData.map((p, idx) => (
              <motion.div
                key={`caps-${p.name}`}
                variants={fadeItem}
                initial="hidden"
                animate="visible"
                custom={idx + 12}
                className="flex items-center gap-2 mb-1.5"
              >
                <span className="text-sm w-5 text-center flex-shrink-0">{p.flag}</span>
                <span className={`text-[10px] w-24 truncate flex-shrink-0 ${p.isPlayer ? 'text-emerald-400 font-semibold' : 'text-[#8b949e]'}`}>
                  {p.name}
                </span>
                <div className="flex-1 h-3 bg-[#0d1117] rounded-sm border border-[#21262d] overflow-hidden">
                  <div
                    className={`h-full rounded-sm ${p.isPlayer ? 'bg-red-500' : 'bg-[#30363d]'}`}
                    style={{ width: `${(p.caps / 250) * 100}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold w-8 text-right flex-shrink-0 ${p.isPlayer ? 'text-red-400' : 'text-[#8b949e]'}`}>
                  {p.caps}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#21262d]">
          <p className="text-[9px] text-[#484f58] text-center">Compare your career against football legends. Keep winning to climb the ranks!</p>
        </div>
      </div>
    </motion.section>
  );

  // ============================================================
  // Tab navigation
  // ============================================================
  const tabs = [
    { id: 'trophies' as const, label: 'Trophies', icon: <Trophy className="h-4 w-4" /> },
    { id: 'awards' as const, label: 'Awards', icon: <Medal className="h-4 w-4" /> },
    { id: 'timeline' as const, label: 'Timeline', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'compare' as const, label: 'Compare', icon: <Crown className="h-4 w-4" /> },
  ];

  return (
    <motion.div
      variants={fadeContainer}
      initial="hidden"
      animate="visible"
      className="max-w-lg mx-auto px-4 py-4"
    >
      {/* Header */}
      <motion.div
        variants={fadeSection}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-3 mb-4"
      >
        <div className="w-10 h-10 bg-yellow-500/15 border border-yellow-500/30 rounded-lg flex items-center justify-center">
          <Trophy className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#c9d1d9]">Trophy Cabinet</h1>
          <p className="text-[10px] text-[#484f58]">
            {playerData.playerName} — {playerData.clubLogo} {playerData.clubName}
          </p>
        </div>
      </motion.div>

      {/* Career Honors Summary */}
      {HonorsSummaryBar}

      {/* Hall of Fame Meter */}
      {HallOfFameSection}

      {/* Tab Navigation */}
      <motion.div
        variants={fadeSection}
        initial="hidden"
        animate="visible"
        className="flex gap-1 mb-4 bg-[#0d1117] border border-[#21262d] rounded-lg p-1"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-[10px] font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-[#484f58] hover:text-[#8b949e] border border-transparent'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <div>
        {activeTab === 'trophies' && TrophyGridSection}
        {activeTab === 'awards' && AwardsSection}
        {activeTab === 'timeline' && TimelineSection}
        {activeTab === 'compare' && ComparisonSection}
      </div>
    </motion.div>
  );
}
