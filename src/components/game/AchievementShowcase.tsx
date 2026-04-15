'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Target, Lock, CheckCircle2, Star, Clock,
  TrendingUp, Zap, Award, Shield, Users, Globe,
  ChevronRight, Crown, Gift, Flame, BarChart3,
  Calendar, Sparkles, Medal, Eye,
} from 'lucide-react';

// ============================================================
// Color Palette
// ============================================================
const COLORS = {
  bg: '#0d1117',
  card: '#161b22',
  border: '#21262d',
  borderLight: '#30363d',
  muted: '#484f58',
  textSecondary: '#8b949e',
  textPrimary: '#c9d1d9',
  emerald: '#34d399',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#a78bfa',
};

// ============================================================
// Achievement Category Types
// ============================================================
type AchievementCategoryKey = 'goalscorer' | 'playmaker' | 'defender' | 'career' | 'social' | 'special';

interface ShowcaseAchievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: AchievementCategoryKey;
  target: number;
  statKey: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface ComputedShowcaseAchievement extends ShowcaseAchievement {
  current: number;
  unlocked: boolean;
  progress: number;
  remaining: number;
  percentage: number;
}

// ============================================================
// Achievement Definitions
// ============================================================
const GOALSCORER_ACHIEVEMENTS: ShowcaseAchievement[] = [
  { id: 'gs_first_goal', name: 'First Goal', description: 'Score your first career goal', icon: <Target className="h-4 w-4" />, category: 'goalscorer', target: 1, statKey: 'goals', points: 10, tier: 'bronze' },
  { id: 'gs_10_goals', name: 'Teen Sensation', description: 'Score 10 career goals', icon: <Flame className="h-4 w-4" />, category: 'goalscorer', target: 10, statKey: 'goals', points: 25, tier: 'bronze' },
  { id: 'gs_50_goals', name: 'Goal Machine', description: 'Score 50 career goals', icon: <Zap className="h-4 w-4" />, category: 'goalscorer', target: 50, statKey: 'goals', points: 75, tier: 'silver' },
  { id: 'gs_100_goals', name: 'Century Club', description: 'Score 100 career goals', icon: <Star className="h-4 w-4" />, category: 'goalscorer', target: 100, statKey: 'goals', points: 150, tier: 'gold' },
  { id: 'gs_500_goals', name: 'Goal Legend', description: 'Score 500 career goals', icon: <Crown className="h-4 w-4" />, category: 'goalscorer', target: 500, statKey: 'goals', points: 500, tier: 'platinum' },
  { id: 'gs_golden_boot', name: 'Golden Boot', description: 'Finish as top scorer in a season', icon: <Trophy className="h-4 w-4" />, category: 'goalscorer', target: 1, statKey: 'goldenBoots', points: 100, tier: 'gold' },
  { id: 'gs_hat_trick', name: 'Hat-Trick Master', description: 'Score 5 hat-tricks in your career', icon: <Flame className="h-4 w-4" />, category: 'goalscorer', target: 5, statKey: 'hatTricks', points: 80, tier: 'silver' },
  { id: 'gs_century_season', name: 'Elite Striker', description: 'Score 30+ goals in a single season', icon: <Target className="h-4 w-4" />, category: 'goalscorer', target: 1, statKey: 'thirtyGoalSeasons', points: 200, tier: 'platinum' },
];

const PLAYMAKER_ACHIEVEMENTS: ShowcaseAchievement[] = [
  { id: 'pm_first_assist', name: 'First Assist', description: 'Record your first career assist', icon: <Users className="h-4 w-4" />, category: 'playmaker', target: 1, statKey: 'assists', points: 10, tier: 'bronze' },
  { id: 'pm_50_assists', name: 'Creative Spark', description: 'Record 50 career assists', icon: <Sparkles className="h-4 w-4" />, category: 'playmaker', target: 50, statKey: 'assists', points: 60, tier: 'silver' },
  { id: 'pm_100_assists', name: 'Assist Machine', description: 'Record 100 career assists', icon: <Zap className="h-4 w-4" />, category: 'playmaker', target: 100, statKey: 'assists', points: 130, tier: 'gold' },
  { id: 'pm_key_pass_king', name: 'Key Pass King', description: 'Record 20+ assists in a season', icon: <Target className="h-4 w-4" />, category: 'playmaker', target: 1, statKey: 'twentyAssistSeasons', points: 90, tier: 'silver' },
  { id: 'pm_creative_genius', name: 'Creative Genius', description: 'Average 7.0+ rating as a playmaker', icon: <Star className="h-4 w-4" />, category: 'playmaker', target: 1, statKey: 'creativeGenius', points: 120, tier: 'gold' },
  { id: 'pm_assist_machine', name: 'Century of Assists', description: 'Provide assists in 50 different matches', icon: <Users className="h-4 w-4" />, category: 'playmaker', target: 50, statKey: 'matchesWithAssist', points: 100, tier: 'gold' },
];

const DEFENDER_ACHIEVEMENTS: ShowcaseAchievement[] = [
  { id: 'df_clean_sheet', name: 'Clean Sheet', description: 'Keep your first clean sheet', icon: <Shield className="h-4 w-4" />, category: 'defender', target: 1, statKey: 'cleanSheets', points: 10, tier: 'bronze' },
  { id: 'df_50_clean_sheets', name: 'Defensive Wall', description: 'Keep 50 career clean sheets', icon: <Shield className="h-4 w-4" />, category: 'defender', target: 50, statKey: 'cleanSheets', points: 70, tier: 'silver' },
  { id: 'df_tackle_machine', name: 'Tackle Machine', description: 'Win 500+ tackles in your career', icon: <Zap className="h-4 w-4" />, category: 'defender', target: 500, statKey: 'tackles', points: 80, tier: 'silver' },
  { id: 'df_wall', name: 'The Wall', description: 'Keep 15+ clean sheets in a season', icon: <Award className="h-4 w-4" />, category: 'defender', target: 1, statKey: 'fifteenCSSeasons', points: 90, tier: 'silver' },
  { id: 'df_iron_man', name: 'Iron Man', description: 'Play 40+ matches without injury', icon: <Medal className="h-4 w-4" />, category: 'defender', target: 1, statKey: 'ironManSeason', points: 110, tier: 'gold' },
  { id: 'df_defensive_rock', name: 'Defensive Rock', description: 'Keep 100 career clean sheets', icon: <Crown className="h-4 w-4" />, category: 'defender', target: 100, statKey: 'cleanSheets', points: 160, tier: 'platinum' },
];

const CAREER_ACHIEVEMENTS: ShowcaseAchievement[] = [
  { id: 'cr_first_appearance', name: 'First Appearance', description: 'Make your professional debut', icon: <Calendar className="h-4 w-4" />, category: 'career', target: 1, statKey: 'appearances', points: 10, tier: 'bronze' },
  { id: 'cr_100_apps', name: 'Centurion', description: 'Make 100 career appearances', icon: <Star className="h-4 w-4" />, category: 'career', target: 100, statKey: 'appearances', points: 60, tier: 'silver' },
  { id: 'cr_500_apps', name: 'Veteran', description: 'Make 500 career appearances', icon: <Medal className="h-4 w-4" />, category: 'career', target: 500, statKey: 'appearances', points: 200, tier: 'platinum' },
  { id: 'cr_trophy_winner', name: 'Trophy Winner', description: 'Win your first trophy', icon: <Trophy className="h-4 w-4" />, category: 'career', target: 1, statKey: 'trophies', points: 50, tier: 'silver' },
  { id: 'cr_5_trophies', name: 'Silverware Collector', description: 'Win 5 career trophies', icon: <Award className="h-4 w-4" />, category: 'career', target: 5, statKey: 'trophies', points: 120, tier: 'gold' },
  { id: 'cr_10_trophies', name: 'Trophy Legend', description: 'Win 10 career trophies', icon: <Crown className="h-4 w-4" />, category: 'career', target: 10, statKey: 'trophies', points: 300, tier: 'platinum' },
];

const SOCIAL_ACHIEVEMENTS: ShowcaseAchievement[] = [
  { id: 'sc_1k_followers', name: 'Rising Star', description: 'Reach 1,000 followers', icon: <Users className="h-4 w-4" />, category: 'social', target: 1, statKey: 'kFollowers', points: 20, tier: 'bronze' },
  { id: 'sc_5k_followers', name: 'Fan Favorite', description: 'Reach 5,000 followers', icon: <Star className="h-4 w-4" />, category: 'social', target: 1, statKey: 'fiveKFollowers', points: 50, tier: 'silver' },
  { id: 'sc_viral_post', name: 'Viral Moment', description: 'Have a social post go viral', icon: <Sparkles className="h-4 w-4" />, category: 'social', target: 1, statKey: 'viralPosts', points: 40, tier: 'bronze' },
  { id: 'sc_fan_favorite', name: 'Supporters Delight', description: 'Reach 80+ reputation', icon: <Flame className="h-4 w-4" />, category: 'social', target: 1, statKey: 'fanFavRep', points: 70, tier: 'silver' },
  { id: 'sc_community_hero', name: 'Community Hero', description: 'Complete 10 community events', icon: <Globe className="h-4 w-4" />, category: 'social', target: 10, statKey: 'communityEvents', points: 60, tier: 'silver' },
];

const SPECIAL_ACHIEVEMENTS: ShowcaseAchievement[] = [
  { id: 'sp_league_winner', name: 'League Winner', description: 'Win the league title', icon: <Trophy className="h-4 w-4" />, category: 'special', target: 1, statKey: 'leagueTitles', points: 150, tier: 'gold' },
  { id: 'sp_european', name: 'European Champion', description: 'Win a European competition', icon: <Globe className="h-4 w-4" />, category: 'special', target: 1, statKey: 'europeanTrophies', points: 250, tier: 'platinum' },
  { id: 'sp_international_cap', name: 'International Cap', description: 'Earn your first international cap', icon: <Shield className="h-4 w-4" />, category: 'special', target: 1, statKey: 'intCaps', points: 80, tier: 'gold' },
  { id: 'sp_world_cup', name: 'World Cup Winner', description: 'Win the FIFA World Cup', icon: <Crown className="h-4 w-4" />, category: 'special', target: 1, statKey: 'worldCup', points: 500, tier: 'platinum' },
  { id: 'sp_ballon_dor', name: "Ballon d'Or", description: 'Win the Ballon d\'Or award', icon: <Star className="h-4 w-4" />, category: 'special', target: 1, statKey: 'ballonDor', points: 500, tier: 'platinum' },
  { id: 'sp_club_legend', name: 'Club Legend', description: 'Play 10+ seasons at one club', icon: <Award className="h-4 w-4" />, category: 'special', target: 1, statKey: 'clubLegend', points: 200, tier: 'platinum' },
];

const ALL_ACHIEVEMENTS: ShowcaseAchievement[] = [
  ...GOALSCORER_ACHIEVEMENTS,
  ...PLAYMAKER_ACHIEVEMENTS,
  ...DEFENDER_ACHIEVEMENTS,
  ...CAREER_ACHIEVEMENTS,
  ...SOCIAL_ACHIEVEMENTS,
  ...SPECIAL_ACHIEVEMENTS,
];

// ============================================================
// Category Config
// ============================================================
interface CategoryConfig {
  key: AchievementCategoryKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  achievements: ShowcaseAchievement[];
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'goalscorer', label: 'Goalscorer', icon: <Target className="h-4 w-4" />, color: COLORS.red, achievements: GOALSCORER_ACHIEVEMENTS },
  { key: 'playmaker', label: 'Playmaker', icon: <Users className="h-4 w-4" />, color: COLORS.blue, achievements: PLAYMAKER_ACHIEVEMENTS },
  { key: 'defender', label: 'Defender', icon: <Shield className="h-4 w-4" />, color: COLORS.amber, achievements: DEFENDER_ACHIEVEMENTS },
  { key: 'career', label: 'Career', icon: <Trophy className="h-4 w-4" />, color: COLORS.emerald, achievements: CAREER_ACHIEVEMENTS },
  { key: 'social', label: 'Social', icon: <Users className="h-4 w-4" />, color: COLORS.purple, achievements: SOCIAL_ACHIEVEMENTS },
  { key: 'special', label: 'Special', icon: <Crown className="h-4 w-4" />, color: '#e5e7eb', achievements: SPECIAL_ACHIEVEMENTS },
];

// ============================================================
// Tier Config
// ============================================================
const TIER_CONFIG: Record<string, { color: string; bgColor: string; label: string; pointsMultiplier: number }> = {
  bronze: { color: '#cd7f32', bgColor: 'rgba(205,127,50,0.15)', label: 'Bronze', pointsMultiplier: 1 },
  silver: { color: '#c0c0c0', bgColor: 'rgba(192,192,192,0.15)', label: 'Silver', pointsMultiplier: 2 },
  gold: { color: '#ffd700', bgColor: 'rgba(255,215,0,0.15)', label: 'Gold', pointsMultiplier: 3 },
  platinum: { color: '#e5e4e2', bgColor: 'rgba(229,228,226,0.15)', label: 'Platinum', pointsMultiplier: 5 },
};

// ============================================================
// Rewards Definitions
// ============================================================
interface RewardItem {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'border' | 'frame' | 'title' | 'celebration';
  requiredPoints: number;
  description: string;
  svgPreview: React.ReactNode;
}

const REWARD_ITEMS: RewardItem[] = [
  // Bronze Profile Borders
  { id: 'r_b_bronze_1', name: 'Emerald Edge', tier: 'bronze', category: 'border', requiredPoints: 10, description: 'Subtle emerald glow border', svgPreview: <EmeraldBorderSVG /> },
  { id: 'r_b_bronze_2', name: 'Iron Frame', tier: 'bronze', category: 'border', requiredPoints: 25, description: 'Sturdy iron border', svgPreview: <IronBorderSVG /> },
  { id: 'r_b_bronze_3', name: 'Copper Ring', tier: 'bronze', category: 'border', requiredPoints: 40, description: 'Warm copper frame', svgPreview: <CopperBorderSVG /> },
  { id: 'r_b_bronze_4', name: 'Steel Outline', tier: 'bronze', category: 'border', requiredPoints: 60, description: 'Clean steel border', svgPreview: <SteelBorderSVG /> },
  // Silver Avatar Frames
  { id: 'r_f_silver_1', name: 'Crystal Frame', tier: 'silver', category: 'frame', requiredPoints: 80, description: 'Crystalline avatar frame', svgPreview: <CrystalFrameSVG /> },
  { id: 'r_f_silver_2', name: 'Silver Crest', tier: 'silver', category: 'frame', requiredPoints: 100, description: 'Silver shield frame', svgPreview: <SilverCrestSVG /> },
  { id: 'r_f_silver_3', name: 'Lunar Ring', tier: 'silver', category: 'frame', requiredPoints: 130, description: 'Moon-inspired frame', svgPreview: <LunarRingSVG /> },
  { id: 'r_f_silver_4', name: 'Frost Edge', tier: 'silver', category: 'frame', requiredPoints: 160, description: 'Ice blue frost frame', svgPreview: <FrostEdgeSVG /> },
  // Gold Title Badges
  { id: 'r_t_gold_1', name: 'Star Performer', tier: 'gold', category: 'title', requiredPoints: 200, description: 'Star badge title', svgPreview: <StarBadgeSVG /> },
  { id: 'r_t_gold_2', name: 'Golden Warrior', tier: 'gold', category: 'title', requiredPoints: 250, description: 'Warrior title badge', svgPreview: <WarriorBadgeSVG /> },
  { id: 'r_t_gold_3', name: 'Champion Heart', tier: 'gold', category: 'title', requiredPoints: 300, description: 'Champion title badge', svgPreview: <ChampionBadgeSVG /> },
  { id: 'r_t_gold_4', name: 'Elite Mindset', tier: 'gold', category: 'title', requiredPoints: 350, description: 'Elite title badge', svgPreview: <EliteBadgeSVG /> },
  // Platinum Celebrations
  { id: 'r_c_plat_1', name: 'Fireworks Dance', tier: 'platinum', category: 'celebration', requiredPoints: 400, description: 'Explosive celebration', svgPreview: <FireworksSVG /> },
  { id: 'r_c_plat_2', name: 'Lightning Strike', tier: 'platinum', category: 'celebration', requiredPoints: 450, description: 'Electric celebration', svgPreview: <LightningSVG /> },
  { id: 'r_c_plat_3', name: 'Royal Wave', tier: 'platinum', category: 'celebration', requiredPoints: 500, description: 'Royal celebration', svgPreview: <RoyalWaveSVG /> },
  { id: 'r_c_plat_4', name: 'Galaxy Burst', tier: 'platinum', category: 'celebration', requiredPoints: 600, description: 'Cosmic celebration', svgPreview: <GalaxyBurstSVG /> },
];

// ============================================================
// SVG Preview Components for Rewards
// ============================================================
function EmeraldBorderSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="44" height="44" rx="8" stroke="#34d399" strokeWidth="3" fill="none" />
      <rect x="6" y="6" width="36" height="36" rx="6" stroke="#34d399" strokeWidth="1" opacity="0.4" fill="none" />
      <circle cx="24" cy="24" r="8" stroke="#34d399" strokeWidth="1" opacity="0.3" fill="none" />
    </svg>
  );
}

function IronBorderSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="44" height="44" rx="6" stroke="#6b7280" strokeWidth="3" fill="none" />
      <rect x="7" y="7" width="34" height="34" rx="4" stroke="#6b7280" strokeWidth="1" opacity="0.3" fill="none" />
      <line x1="12" y1="2" x2="12" y2="10" stroke="#6b7280" strokeWidth="2" opacity="0.5" />
      <line x1="36" y1="2" x2="36" y2="10" stroke="#6b7280" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

function CopperBorderSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="42" height="42" rx="10" stroke="#cd7f32" strokeWidth="2.5" fill="none" />
      <rect x="7" y="7" width="34" height="34" rx="7" stroke="#cd7f32" strokeWidth="1" opacity="0.35" fill="none" />
      <circle cx="24" cy="24" r="6" fill="#cd7f32" opacity="0.15" />
    </svg>
  );
}

function SteelBorderSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="44" height="44" rx="4" stroke="#9ca3af" strokeWidth="2.5" fill="none" />
      <rect x="5" y="5" width="38" height="38" rx="3" stroke="#9ca3af" strokeWidth="0.5" opacity="0.4" fill="none" />
      <circle cx="24" cy="24" r="10" stroke="#9ca3af" strokeWidth="0.5" opacity="0.3" fill="none" />
    </svg>
  );
}

function CrystalFrameSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="24,4 42,16 42,32 24,44 6,32 6,16" stroke="#a5b4fc" strokeWidth="2" fill="none" />
      <polygon points="24,10 36,18 36,30 24,38 12,30 12,18" stroke="#a5b4fc" strokeWidth="1" opacity="0.4" fill="none" />
      <circle cx="24" cy="24" r="5" fill="#a5b4fc" opacity="0.2" />
    </svg>
  );
}

function SilverCrestSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L36 12V28L24 44L12 28V12L24 4Z" stroke="#c0c0c0" strokeWidth="2" fill="none" />
      <path d="M24 10L32 16V26L24 38L16 26V16L24 10Z" stroke="#c0c0c0" strokeWidth="1" opacity="0.3" fill="none" />
      <path d="M24 18L28 21V27L24 32L20 27V21L24 18Z" fill="#c0c0c0" opacity="0.15" />
    </svg>
  );
}

function LunarRingSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="15" stroke="#e2e8f0" strokeWidth="1" opacity="0.3" fill="none" />
      <circle cx="18" cy="20" r="8" fill="#e2e8f0" opacity="0.15" />
      <circle cx="30" cy="28" r="4" fill="#e2e8f0" opacity="0.1" />
    </svg>
  );
}

function FrostEdgeSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="19" stroke="#93c5fd" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="14" stroke="#93c5fd" strokeWidth="1" opacity="0.3" fill="none" />
      <line x1="24" y1="5" x2="24" y2="43" stroke="#93c5fd" strokeWidth="0.5" opacity="0.2" />
      <line x1="5" y1="24" x2="43" y2="24" stroke="#93c5fd" strokeWidth="0.5" opacity="0.2" />
    </svg>
  );
}

function StarBadgeSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" stroke="#fbbf24" strokeWidth="2" fill="none" />
      <polygon points="24,10 28,20 38,20 30,26 33,36 24,30 15,36 18,26 10,20 20,20" fill="#fbbf24" opacity="0.3" stroke="#fbbf24" strokeWidth="1" />
    </svg>
  );
}

function WarriorBadgeSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" stroke="#f59e0b" strokeWidth="2" fill="none" />
      <path d="M24 8L30 18H18L24 8Z" fill="#f59e0b" opacity="0.25" />
      <rect x="20" y="20" width="8" height="14" rx="1" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" strokeWidth="1" />
      <path d="M24 34L28 40H20L24 34Z" fill="#f59e0b" opacity="0.25" />
    </svg>
  );
}

function ChampionBadgeSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
      <path d="M16 20L24 16L32 20V30L24 34L16 30V20Z" fill="#fbbf24" opacity="0.2" stroke="#fbbf24" strokeWidth="1" />
      <text x="24" y="27" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">C</text>
    </svg>
  );
}

function EliteBadgeSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" stroke="#d4d4d8" strokeWidth="2" fill="none" />
      <circle cx="24" cy="24" r="12" stroke="#d4d4d8" strokeWidth="1" opacity="0.3" fill="none" />
      <path d="M20 18L24 22L28 18" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="22" x2="24" y2="30" stroke="#d4d4d8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FireworksSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="3" fill="#ef4444" opacity="0.6" />
      <line x1="24" y1="21" x2="24" y2="12" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="27" x2="24" y2="36" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="24" x2="12" y2="24" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="24" x2="36" y2="24" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="22" x2="15" y2="15" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" />
      <line x1="26" y1="26" x2="33" y2="33" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function LightningSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M26 6L16 22H22L18 42L34 20H26L30 6H26Z" fill="#fbbf24" opacity="0.4" stroke="#fbbf24" strokeWidth="1.5" />
    </svg>
  );
}

function RoyalWaveSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 32V20C8 12 16 8 24 8C32 8 40 12 40 20V32" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="14" r="4" fill="#fbbf24" opacity="0.3" stroke="#fbbf24" strokeWidth="1" />
      <path d="M16 30C16 30 20 26 24 30C28 34 32 30 32 30" stroke="#fbbf24" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
      <path d="M14 36C14 36 19 32 24 36C29 40 34 36 34 36" stroke="#fbbf24" strokeWidth="0.5" opacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

function GalaxyBurstSVG() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="6" fill="#a78bfa" opacity="0.3" stroke="#a78bfa" strokeWidth="1" />
      <circle cx="14" cy="14" r="2" fill="#fbbf24" opacity="0.4" />
      <circle cx="34" cy="12" r="1.5" fill="#34d399" opacity="0.4" />
      <circle cx="38" cy="30" r="2.5" fill="#3b82f6" opacity="0.3" />
      <circle cx="10" cy="32" r="1.5" fill="#ef4444" opacity="0.3" />
      <circle cx="32" cy="38" r="1" fill="#fbbf24" opacity="0.5" />
      <line x1="24" y1="18" x2="14" y2="14" stroke="#a78bfa" strokeWidth="0.5" opacity="0.3" />
      <line x1="24" y1="18" x2="34" y2="12" stroke="#a78bfa" strokeWidth="0.5" opacity="0.3" />
      <line x1="30" y1="24" x2="38" y2="30" stroke="#a78bfa" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

// ============================================================
// Animation variants (opacity only — no transforms)
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
    transition: { delay: 0.08, duration: 0.35 },
  },
};

// ============================================================
// SVG Circular Gauge Component
// ============================================================
function CircularGauge({ percent, size = 72, strokeWidth = 5, color = COLORS.emerald }: { percent: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="flex-shrink-0" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={COLORS.border}
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// ============================================================
// Hunter Tier Badge
// ============================================================
function getHunterTier(totalPoints: number): { tier: string; color: string; bgColor: string; icon: string; threshold: number } {
  if (totalPoints >= 600) return { tier: 'Platinum', color: '#e5e4e2', bgColor: 'rgba(229,228,226,0.15)', icon: '💎', threshold: 600 };
  if (totalPoints >= 300) return { tier: 'Gold', color: '#ffd700', bgColor: 'rgba(255,215,0,0.15)', icon: '👑', threshold: 300 };
  if (totalPoints >= 100) return { tier: 'Silver', color: '#c0c0c0', bgColor: 'rgba(192,192,192,0.15)', icon: '🥈', threshold: 100 };
  if (totalPoints >= 30) return { tier: 'Bronze', color: '#cd7f32', bgColor: 'rgba(205,127,50,0.15)', icon: '🥉', threshold: 30 };
  return { tier: 'Rookie', color: COLORS.muted, bgColor: 'rgba(72,79,88,0.15)', icon: '🌱', threshold: 0 };
}

// ============================================================
// Main Component
// ============================================================
export default function AchievementShowcase() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategoryKey>('goalscorer');

  // ============================================================
  // Compute Achievement Stats from Game State
  // ============================================================
  const computedAchievements = useMemo<ComputedShowcaseAchievement[]>(() => {
    if (!gameState) return ALL_ACHIEVEMENTS.map(a => ({
      ...a, current: 0, unlocked: false, progress: 0, remaining: a.target, percentage: 0,
    }));

    const { player } = gameState;
    const cs = player.careerStats;
    const seasons = gameState.seasons;
    const recentResults = gameState.recentResults;

    const totalGoals = cs.totalGoals;
    const totalAssists = cs.totalAssists;
    const totalCleanSheets = cs.totalCleanSheets;
    const totalAppearances = cs.totalAppearances;
    const totalTrophies = cs.trophies.length;
    const reputation = player.reputation;

    // Derived stats
    const hatTricks = recentResults.filter(r => r.playerGoals >= 3).length;
    const thirtyGoalSeasons = seasons.filter(s => (s.playerStats?.goals ?? 0) >= 30).length;
    const twentyAssistSeasons = seasons.filter(s => (s.playerStats?.assists ?? 0) >= 20).length;
    const fifteenCSSeasons = seasons.filter(s => (s.playerStats?.cleanSheets ?? 0) >= 15).length;
    const matchesWithAssist = recentResults.filter(r => r.playerAssists > 0).length;
    const goldenBoots = cs.trophies.filter(t => t.name.toLowerCase().includes('golden boot') || t.name.toLowerCase().includes('top scorer')).length;
    const leagueTitles = cs.trophies.filter(t => t.name.toLowerCase().includes('league') || t.name.toLowerCase().includes('champion')).length;
    const europeanTrophies = cs.trophies.filter(t => t.name.toLowerCase().includes('champions') || t.name.toLowerCase().includes('europa')).length;
    const internationalCaps = gameState.internationalCareer?.caps ?? 0;
    const maxSeasonRating = seasons.length > 0 ? Math.max(...seasons.map(s => s.playerStats?.averageRating ?? 0)) : 0;

    // Build stat map
    const statMap: Record<string, number> = {
      goals: totalGoals,
      assists: totalAssists,
      cleanSheets: totalCleanSheets,
      appearances: totalAppearances,
      trophies: totalTrophies,
      hatTricks,
      thirtyGoalSeasons,
      twentyAssistSeasons,
      fifteenCSSeasons,
      matchesWithAssist,
      goldenBoots,
      creativeGenius: maxSeasonRating >= 7.0 ? 1 : 0,
      tackles: Math.floor(totalAppearances * 3.5),
      ironManSeason: seasons.filter(s => (s.playerStats?.appearances ?? 0) >= 40).length > 0 ? 1 : 0,
      kFollowers: reputation >= 30 ? 1 : 0,
      fiveKFollowers: reputation >= 70 ? 1 : 0,
      viralPosts: gameState.socialFeed.filter(s => s.engagement >= 90).length,
      fanFavRep: reputation >= 80 ? 1 : 0,
      communityEvents: Math.floor(seasons.length * 1.5),
      leagueTitles,
      europeanTrophies,
      intCaps: internationalCaps,
      worldCup: cs.trophies.filter(t => t.name.toLowerCase().includes('world cup')).length,
      ballonDor: cs.trophies.filter(t => t.name.toLowerCase().includes('ballon')).length,
      clubLegend: seasons.length >= 10 ? 1 : 0,
    };

    return ALL_ACHIEVEMENTS.map(a => {
      const current = statMap[a.statKey] ?? 0;
      const unlocked = current >= a.target;
      const progress = a.target > 0 ? Math.min(current, a.target) : 0;
      const remaining = Math.max(0, a.target - current);
      const percentage = a.target > 0 ? Math.min(100, Math.round((current / a.target) * 100)) : 0;
      return { ...a, current, unlocked, progress, remaining, percentage };
    });
  }, [gameState]);

  // ============================================================
  // Computed Summary Stats
  // ============================================================
  const summary = useMemo(() => {
    const total = computedAchievements.length;
    const unlocked = computedAchievements.filter(a => a.unlocked).length;
    const inProgress = computedAchievements.filter(a => !a.unlocked && a.current > 0).length;
    const locked = computedAchievements.filter(a => !a.unlocked && a.current === 0).length;
    const totalPoints = computedAchievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
    const maxPoints = ALL_ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0);
    const overallPercent = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    const hunterTier = getHunterTier(totalPoints);

    return { total, unlocked, inProgress, locked, totalPoints, maxPoints, overallPercent, hunterTier };
  }, [computedAchievements]);

  // ============================================================
  // "Almost There" — top 5 closest to completion
  // ============================================================
  const almostThere = useMemo(() => {
    return computedAchievements
      .filter(a => !a.unlocked && a.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }, [computedAchievements]);

  // ============================================================
  // "Quick Wins" — 3 achievements closest by absolute remaining
  // ============================================================
  const quickWins = useMemo(() => {
    return computedAchievements
      .filter(a => !a.unlocked && a.remaining > 0 && a.remaining <= 20)
      .sort((a, b) => a.remaining - b.remaining)
      .slice(0, 3);
  }, [computedAchievements]);

  // ============================================================
  // Rewards grouped by tier
  // ============================================================
  const rewardsByTier = useMemo(() => {
    const tiers: ('bronze' | 'silver' | 'gold' | 'platinum')[] = ['bronze', 'silver', 'gold', 'platinum'];
    const tierLabels: Record<string, string> = { bronze: 'Profile Borders', silver: 'Avatar Frames', gold: 'Title Badges', platinum: 'Celebrations' };
    const tierIcons: Record<string, React.ReactNode> = {
      bronze: <Star className="h-3.5 w-3.5" />,
      silver: <Eye className="h-3.5 w-3.5" />,
      gold: <Award className="h-3.5 w-3.5" />,
      platinum: <Sparkles className="h-3.5 w-3.5" />,
    };

    return tiers.map(tier => ({
      tier,
      label: tierLabels[tier],
      icon: tierIcons[tier],
      rewards: REWARD_ITEMS.filter(r => r.tier === tier),
    }));
  }, []);

  // ============================================================
  // Statistics — achievements per season (deterministic)
  // ============================================================
  const seasonStats = useMemo(() => {
    if (!gameState) return [];
    const seasons = gameState.seasons;
    return seasons.map((s, idx) => ({
      season: s.number,
      unlocked: Math.max(1, Math.floor((s.playerStats?.goals ?? 0) / 5) + (s.playerStats?.assists ?? 0 > 10 ? 2 : 0) + (s.achievements?.length ?? 0)),
    }));
  }, [gameState]);

  // ============================================================
  // Achievement rarity distribution (deterministic)
  // ============================================================
  const rarityDistribution = useMemo(() => {
    const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    for (const a of ALL_ACHIEVEMENTS) {
      tierCounts[a.tier]++;
    }
    return [
      { tier: 'Bronze', count: tierCounts.bronze, globalRate: 72, color: '#cd7f32' },
      { tier: 'Silver', count: tierCounts.silver, globalRate: 45, color: '#c0c0c0' },
      { tier: 'Gold', count: tierCounts.gold, globalRate: 18, color: '#ffd700' },
      { tier: 'Platinum', count: tierCounts.platinum, globalRate: 4, color: '#e5e4e2' },
    ];
  }, []);

  // ============================================================
  // Most difficult achievement
  // ============================================================
  const mostDifficult = useMemo(() => {
    const specialUnlocked = computedAchievements.filter(a => a.category === 'special' && a.unlocked).length;
    const hardest = computedAchievements
      .filter(a => a.tier === 'platinum')
      .sort((a, b) => a.percentage - b.percentage)[0];
    return hardest ?? computedAchievements[0];
  }, [computedAchievements]);

  // ============================================================
  // Comparison vs average player
  // ============================================================
  const avgComparison = useMemo(() => {
    const avgUnlocked = Math.floor(summary.total * 0.35);
    const diff = summary.unlocked - avgUnlocked;
    return { avgUnlocked, diff };
  }, [summary]);

  // ============================================================
  // Timeline data — sorted unlocked achievements
  // ============================================================
  const timelineEntries = useMemo(() => {
    const unlocked = computedAchievements.filter(a => a.unlocked);
    const categoryOrder: AchievementCategoryKey[] = ['goalscorer', 'playmaker', 'defender', 'career', 'social', 'special'];
    return unlocked.sort((a, b) => {
      const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (catDiff !== 0) return catDiff;
      return b.points - a.points;
    });
  }, [computedAchievements]);

  // ============================================================
  // Category-specific filtered achievements
  // ============================================================
  const categoryAchievements = useMemo(() => {
    return computedAchievements.filter(a => a.category === selectedCategory);
  }, [computedAchievements, selectedCategory]);

  const categoryUnlocked = categoryAchievements.filter(a => a.unlocked).length;

  if (!gameState) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8b949e] text-sm">No career data available.</p>
      </div>
    );
  }

  // ============================================================
  // Render: Achievement Overview Header
  // ============================================================
  const renderOverviewHeader = () => (
    <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 border border-emerald-500/20 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <Trophy className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#c9d1d9]">Achievement Showcase</h1>
            <p className="text-xs text-[#8b949e]">Track your milestones and unlock rewards</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Total', value: summary.total, color: COLORS.textPrimary },
            { label: 'Unlocked', value: summary.unlocked, color: COLORS.emerald },
            { label: 'In Progress', value: summary.inProgress, color: COLORS.amber },
            { label: 'Locked', value: summary.locked, color: COLORS.muted },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center py-2 px-1 bg-[#0d1117] border border-[#21262d] rounded-lg">
              <span className="text-base font-bold leading-none" style={{ color: stat.color }}>{stat.value}</span>
              <span className="text-[9px] text-[#484f58] font-medium uppercase mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Circular Gauge + Points + Rank */}
        <div className="flex items-center gap-4 p-3 bg-[#0d1117] border border-[#21262d] rounded-lg">
          <div className="relative flex items-center justify-center flex-shrink-0">
            <CircularGauge percent={summary.overallPercent} size={64} strokeWidth={5} />
            <span className="absolute text-xs font-bold text-emerald-400">{summary.overallPercent}%</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Overall Completion</span>
            </div>
            <div className="w-full h-2 bg-[#21262d] rounded-sm overflow-hidden mb-2">
              <motion.div
                className="h-full bg-emerald-500 rounded-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
                style={{ width: `${summary.overallPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#484f58]">Points</span>
                <p className="text-sm font-bold text-[#c9d1d9]">{summary.totalPoints} <span className="text-[10px] text-[#484f58] font-normal">/ {summary.maxPoints}</span></p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{ backgroundColor: summary.hunterTier.bgColor, border: `1px solid ${summary.hunterTier.color}33` }}>
                <span className="text-sm">{summary.hunterTier.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: summary.hunterTier.color }}>
                  {summary.hunterTier.tier}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );

  // ============================================================
  // Render: Achievement Categories
  // ============================================================
  const renderCategories = () => (
    <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Achievement Categories</h2>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.key;
            const catUnlocked = computedAchievements.filter(a => a.category === cat.key && a.unlocked).length;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border flex-shrink-0 ${
                  isActive
                    ? 'border-emerald-500/30 text-emerald-400'
                    : 'bg-[#0d1117] border-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
                style={isActive ? { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)', color: COLORS.emerald } : undefined}
              >
                {cat.icon}
                {cat.label}
                <span className="text-[9px] opacity-60">{catUnlocked}/{cat.achievements.length}</span>
              </button>
            );
          })}
        </div>

        {/* Achievement Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {categoryAchievements.map((ach, idx) => (
              <motion.div
                key={ach.id}
                variants={fadeItem}
                initial="hidden"
                animate="visible"
                custom={idx}
                className={`border rounded-lg overflow-hidden ${
                  ach.unlocked
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-[#0d1117] border-[#21262d]'
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    ach.unlocked
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-[#21262d] border-[#30363d] text-[#484f58]'
                  }`}>
                    {ach.unlocked ? <CheckCircle2 className="h-5 w-5" /> : ach.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${ach.unlocked ? 'text-emerald-300' : 'text-[#8b949e]'}`}>
                        {ach.name}
                      </span>
                      <span
                        className="text-[7px] font-bold uppercase px-1.5 py-px rounded-sm flex-shrink-0"
                        style={{ color: TIER_CONFIG[ach.tier].color, backgroundColor: TIER_CONFIG[ach.tier].bgColor }}
                      >
                        {TIER_CONFIG[ach.tier].label}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 truncate ${ach.unlocked ? 'text-[#8b949e]' : 'text-[#484f58]'}`}>
                      {ach.description}
                    </p>
                  </div>

                  {/* Progress / Points */}
                  <div className="flex flex-col items-end flex-shrink-0 gap-1">
                    <span className="text-[10px] font-semibold" style={{ color: TIER_CONFIG[ach.tier].color }}>
                      +{ach.points} pts
                    </span>
                    {ach.unlocked ? (
                      <span className="text-[9px] text-emerald-400 font-medium">DONE</span>
                    ) : (
                      <span className="text-[9px] text-[#484f58]">{ach.progress}/{ach.target}</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {!ach.unlocked && ach.percentage > 0 && (
                  <div className="px-3 pb-3">
                    <div className="w-full h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                      <motion.div
                        className="h-full rounded-sm"
                        style={{ backgroundColor: COLORS.amber, width: `${ach.percentage}%` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );

  // ============================================================
  // Render: Achievement Progress Tracker
  // ============================================================
  const renderProgressTracker = () => (
    <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Progress Tracker</h2>
        </div>

        {/* Almost There */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">Almost There</p>
          {almostThere.length > 0 ? (
            <div className="space-y-2">
              {almostThere.map((ach, idx) => (
                <motion.div
                  key={ach.id}
                  variants={fadeItem}
                  initial="hidden"
                  animate="visible"
                  custom={idx}
                  className="flex items-center gap-3 p-2.5 bg-[#0d1117] border border-[#21262d] rounded-lg"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {ach.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#c9d1d9] truncate">{ach.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-sm" style={{ width: `${ach.percentage}%` }} />
                      </div>
                      <span className="text-[9px] text-amber-400 font-medium flex-shrink-0">{ach.percentage}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] text-[#484f58]">{ach.remaining} left</p>
                    <p className="text-[9px] text-amber-400">+{ach.points} pts</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-[#484f58]">Start progressing achievements to see them here.</p>
            </div>
          )}
        </div>

        {/* Quick Wins */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="h-3 w-3 text-emerald-400" />
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Quick Wins</p>
          </div>
          {quickWins.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {quickWins.map((ach, idx) => (
                <motion.div
                  key={ach.id}
                  variants={fadeItem}
                  initial="hidden"
                  animate="visible"
                  custom={idx}
                  className="flex items-center gap-3 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-300 truncate">{ach.name}</p>
                    <p className="text-[9px] text-[#8b949e]">{ach.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-bold text-emerald-400">{ach.remaining} away</p>
                    <p className="text-[9px] text-[#484f58]">+{ach.points} pts</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-[#484f58]">Keep playing to unlock quick achievements!</p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );

  // ============================================================
  // Render: Achievement Rewards Gallery
  // ============================================================
  const renderRewardsGallery = () => (
    <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Rewards Gallery</h2>
          <span className="text-[10px] text-[#484f58] ml-auto">{summary.totalPoints} pts earned</span>
        </div>

        <div className="space-y-4">
          {rewardsByTier.map(group => (
            <div key={group.tier}>
              <div className="flex items-center gap-1.5 mb-2">
                {group.icon}
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: TIER_CONFIG[group.tier].color }}
                >
                  {TIER_CONFIG[group.tier].label} — {group.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {group.rewards.map(reward => {
                  const isUnlocked = summary.totalPoints >= reward.requiredPoints;
                  return (
                    <motion.div
                      key={reward.id}
                      variants={fadeItem}
                      initial="hidden"
                      animate="visible"
                      custom={REWARD_ITEMS.indexOf(reward)}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-lg ${
                        isUnlocked
                          ? 'border-emerald-500/20'
                          : 'border-[#21262d] opacity-50'
                      }`}
                      style={isUnlocked ? { backgroundColor: 'rgba(52,211,153,0.05)' } : { backgroundColor: COLORS.bg }}
                    >
                      <div className="flex items-center justify-center w-10 h-10">
                        {reward.svgPreview}
                      </div>
                      <div className="text-center">
                        <p className={`text-[10px] font-semibold leading-tight ${isUnlocked ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                          {reward.name}
                        </p>
                        <p className="text-[8px] text-[#484f58] mt-0.5">{reward.requiredPoints} pts required</p>
                      </div>
                      {isUnlocked ? (
                        <span className="text-[7px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-px rounded-sm uppercase">Unlocked</span>
                      ) : (
                        <span className="text-[7px] font-bold text-[#484f58] bg-[#21262d] px-1.5 py-px rounded-sm uppercase flex items-center gap-0.5">
                          <Lock className="h-2 w-2" /> Locked
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );

  // ============================================================
  // Render: Achievement Statistics
  // ============================================================
  const renderStatistics = () => {
    const maxSeasonUnlocked = seasonStats.length > 0 ? Math.max(...seasonStats.map(s => s.unlocked), 1) : 1;

    return (
      <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-[#c9d1d9]">Achievement Statistics</h2>
          </div>

          {/* Per-Season Bar Chart */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">Achievements per Season</p>
            {seasonStats.length > 0 ? (
              <div className="flex items-end gap-1.5 h-24 bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
                {seasonStats.slice(-8).map((s, idx) => {
                  const barHeight = Math.max(4, (s.unlocked / maxSeasonUnlocked) * 100);
                  return (
                    <div key={s.season} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[8px] text-[#8b949e] font-medium">{s.unlocked}</span>
                      <div className="w-full flex items-end" style={{ height: '60px' }}>
                        <motion.div
                          className="w-full rounded-sm"
                          style={{ backgroundColor: COLORS.emerald, height: `${barHeight}%` }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                        />
                      </div>
                      <span className="text-[7px] text-[#484f58]">S{s.season}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center bg-[#0d1117] border border-[#21262d] rounded-lg">
                <p className="text-[10px] text-[#484f58]">Season data will appear here</p>
              </div>
            )}
          </div>

          {/* Rarity Distribution */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">Achievement Rarity</p>
            <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
              {rarityDistribution.map(r => (
                <div key={r.tier} className="flex items-center gap-3 mb-2 last:mb-0">
                  <span className="text-[9px] font-semibold w-12 text-right" style={{ color: r.color }}>{r.tier}</span>
                  <div className="flex-1 h-3 bg-[#21262d] rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full rounded-sm"
                      style={{ backgroundColor: r.color, width: `${r.globalRate}%` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-[9px] text-[#8b949e] w-10 text-right">{r.globalRate}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Most Difficult */}
          {mostDifficult && (
            <div className="mb-4 p-3 bg-[#0d1117] border border-[#21262d] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Most Difficult</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/20">
                  {mostDifficult.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#c9d1d9]">{mostDifficult.name}</p>
                  <p className="text-[9px] text-[#8b949e]">{mostDifficult.description}</p>
                </div>
                <span
                  className="text-[7px] font-bold uppercase px-1.5 py-px rounded-sm"
                  style={{ color: TIER_CONFIG[mostDifficult.tier].color, backgroundColor: TIER_CONFIG[mostDifficult.tier].bgColor }}
                >
                  {TIER_CONFIG[mostDifficult.tier].label}
                </span>
              </div>
              <p className="text-[9px] text-[#484f58] mt-2">Global unlock rate: 4% — Rare among all players</p>
            </div>
          )}

          {/* Comparison vs Average */}
          <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">vs Average Player</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-lg font-bold text-[#c9d1d9]">{summary.unlocked}</p>
                <p className="text-[9px] text-[#8b949e]">You</p>
              </div>
              <div className="flex-1 mx-4">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-2 bg-[#21262d] rounded-sm overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-sm" style={{ width: `${Math.min(100, (summary.unlocked / Math.max(avgComparison.avgUnlocked, 1)) * 50)}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold ${avgComparison.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {avgComparison.diff >= 0 ? '+' : ''}{avgComparison.diff}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#484f58]">{avgComparison.avgUnlocked}</p>
                <p className="text-[9px] text-[#484f58]">Average</p>
              </div>
            </div>
            <p className={`text-[9px] mt-2 text-center ${avgComparison.diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {avgComparison.diff >= 0
                ? `You're ${avgComparison.diff} achievements ahead of the average player!`
                : `You're ${Math.abs(avgComparison.diff)} achievements behind the average player.`
              }
            </p>
          </div>
        </div>
      </motion.section>
    );
  };

  // ============================================================
  // Render: Achievement Timeline
  // ============================================================
  const renderTimeline = () => {
    const milestones = [10, 25, 50];
    const categoryColors: Record<AchievementCategoryKey, string> = {
      goalscorer: COLORS.red,
      playmaker: COLORS.blue,
      defender: COLORS.amber,
      career: COLORS.emerald,
      social: COLORS.purple,
      special: '#e5e7eb',
    };

    return (
      <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-[#c9d1d9]">Achievement Timeline</h2>
            <span className="text-[10px] text-[#484f58] ml-auto">{timelineEntries.length} unlocked</span>
          </div>

          {timelineEntries.length > 0 ? (
            <div className="relative ml-3">
              {/* Vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-[#30363d]" />

              <div className="space-y-3">
                {timelineEntries.map((entry, idx) => {
                  const isMilestone = milestones.includes(idx + 1);
                  const catColor = categoryColors[entry.category] ?? COLORS.muted;

                  return (
                    <motion.div
                      key={entry.id}
                      variants={fadeItem}
                      initial="hidden"
                      animate="visible"
                      custom={idx}
                      className="relative pl-5"
                    >
                      {/* Dot */}
                      <div
                        className="absolute left-0 top-2.5 w-2 h-2 rounded-sm"
                        style={{ backgroundColor: catColor, border: `1px solid ${catColor}` }}
                      />

                      <div
                        className={`border rounded-lg p-3 ${
                          isMilestone ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[#21262d] bg-[#0d1117]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs" style={{ backgroundColor: `${catColor}22`, color: catColor }}>
                              {entry.icon}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#c9d1d9]">{entry.name}</p>
                              <p className="text-[8px] text-[#484f58]">{entry.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] font-bold" style={{ color: TIER_CONFIG[entry.tier].color }}>+{entry.points} pts</span>
                            <span className="text-[8px] text-[#484f58] capitalize">{entry.category}</span>
                          </div>
                        </div>

                        {/* Milestone marker */}
                        {isMilestone && (
                          <div className="mt-2 pt-2 border-t border-emerald-500/20">
                            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                              Milestone: {idx + 1} Achievements Unlocked
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
              <p className="text-xs text-[#484f58]">Your achievement timeline will appear here.</p>
              <p className="text-[10px] text-[#30363d] mt-1">Unlock achievements to build your legacy timeline.</p>
            </div>
          )}
        </div>
      </motion.section>
    );
  };

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      {/* Overview Header — always visible */}
      {renderOverviewHeader()}

      {/* Tab Navigation */}
      <motion.div
        variants={fadeSection}
        initial="hidden"
        animate="visible"
        className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none"
      >
        {[
          { key: 'overview', label: 'Categories', icon: <Target className="h-3.5 w-3.5" /> },
          { key: 'progress', label: 'Progress', icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { key: 'rewards', label: 'Rewards', icon: <Gift className="h-3.5 w-3.5" /> },
          { key: 'statistics', label: 'Stats', icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { key: 'timeline', label: 'Timeline', icon: <Clock className="h-3.5 w-3.5" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border flex-shrink-0 ${
              activeTab === tab.key
                ? 'text-emerald-400 border-emerald-500/30'
                : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
            style={activeTab === tab.key ? { backgroundColor: 'rgba(52,211,153,0.1)' } : undefined}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderCategories()}
          {activeTab === 'progress' && renderProgressTracker()}
          {activeTab === 'rewards' && renderRewardsGallery()}
          {activeTab === 'statistics' && renderStatistics()}
          {activeTab === 'timeline' && renderTimeline()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
