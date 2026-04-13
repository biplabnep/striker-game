'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  getOverallColor,
  getMatchRatingLabel,
  formatCurrency,
  getSquadStatusLabel,
} from '@/lib/game/gameUtils';
import { getClubById, getLeagueById } from '@/lib/game/clubsData';
import {
  SeasonPlayerStats,
  Achievement,
  PlayerAttributes,
  SquadStatus,
  LeagueStanding,
} from '@/lib/game/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Goal,
  Users,
  Shield,
  Star,
  Award,
  ArrowRight,
  Zap,
  Heart,
  Activity,
  Clock,
  ScrollText,
  Medal,
  Flame,
  Crown,
  Footprints,
  Wallet,
  BarChart3,
  Eye,
  BookOpen,
  ChevronUp,
  ChevronDown,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';

// ============================================================
// Props
// ============================================================

interface SeasonEndSummaryProps {
  onClose: () => void;
  onReviewSeason?: () => void;
  onViewFullStats?: () => void;
  seasonData: {
    seasonNumber: number;
    leaguePosition: number;
    totalTeams: number;
    playerStats: SeasonPlayerStats;
    achievements: Achievement[];
    previousOverall: number;
    currentOverall: number;
    previousMarketValue: number;
    currentMarketValue: number;
    previousWage?: number;
    bonusEarnings?: number;
    attributeChanges: Partial<PlayerAttributes>;
    previousAttributes?: Partial<PlayerAttributes>;
    contractYearsRemaining: number;
    squadStatus: SquadStatus;
    finalLeagueTable: LeagueStanding[];
    bestMatchRating?: number;
    mostGoalsInGame?: number;
    ovrProgression?: { week: number; ovr: number }[];
  };
}

// ============================================================
// Helpers
// ============================================================

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getZoneInfo(position: number, totalTeams: number): {
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
} {
  if (position === 1) return { label: 'Champions!', color: '#FFD700', bgColor: 'rgba(255,215,0,0.15)', emoji: '🏆' };
  if (position <= 4) return { label: 'Champions League', color: '#22C55E', bgColor: 'rgba(34,197,94,0.12)', emoji: '⭐' };
  if (position <= 6) return { label: 'Europa League', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.12)', emoji: '🟠' };
  if (position >= totalTeams - 2) return { label: 'Relegation', color: '#EF4444', bgColor: 'rgba(239,68,68,0.12)', emoji: '🔻' };
  return { label: 'Mid-Table', color: '#94A3B8', bgColor: 'rgba(148,163,184,0.08)', emoji: '📊' };
}

function getPositionExpectation(position: number, clubQuality: number): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  // Expected position based on club quality (higher quality = expect higher position)
  const expectedPos = Math.max(1, Math.round((100 - clubQuality) / 100 * 8 + 1));
  const diff = expectedPos - position;

  if (diff >= 3) return { label: 'Massively Overachieved', color: '#22C55E', icon: <TrendingUp className="h-4 w-4" /> };
  if (diff >= 1) return { label: 'Overachieved', color: '#10B981', icon: <TrendingUp className="h-4 w-4" /> };
  if (diff <= -3) return { label: 'Massively Underachieved', color: '#EF4444', icon: <TrendingDown className="h-4 w-4" /> };
  if (diff <= -1) return { label: 'Underachieved', color: '#F97316', icon: <TrendingDown className="h-4 w-4" /> };
  return { label: 'Met Expectations', color: '#F59E0B', icon: <Minus className="h-4 w-4" /> };
}

// ============================================================
// Season Grade System
// ============================================================

function getSeasonGrade(
  avgRating: number,
  goals: number,
  assists: number,
  appearances: number,
  leaguePosition: number
): { grade: string; color: string; bgColor: string } {
  // Weighted score: rating (50%), goals/assists contribution (30%), league position (20%)
  const ratingScore = Math.min(avgRating / 10, 1) * 50;
  const contributionScore = Math.min((goals + assists * 0.5) / 20, 1) * 30;
  const positionScore = Math.max(0, (20 - leaguePosition) / 19) * 20;
  const total = ratingScore + contributionScore + positionScore;

  if (total >= 85) return { grade: 'S', color: '#FBBF24', bgColor: 'rgba(251,191,36,0.15)' };
  if (total >= 72) return { grade: 'A', color: '#34D399', bgColor: 'rgba(52,211,153,0.15)' };
  if (total >= 58) return { grade: 'B', color: '#60A5FA', bgColor: 'rgba(96,165,250,0.15)' };
  if (total >= 42) return { grade: 'C', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.15)' };
  if (total >= 25) return { grade: 'D', color: '#F97316', bgColor: 'rgba(249,115,22,0.15)' };
  return { grade: 'F', color: '#EF4444', bgColor: 'rgba(239,68,68,0.15)' };
}

function formatWageDisplay(wage: number): string {
  if (wage >= 1000000) return `€${(wage / 1000000).toFixed(1)}M/w`;
  if (wage >= 1000) return `€${(wage / 1000).toFixed(0)}K/w`;
  return `€${wage}/w`;
}

// ============================================================
// Sub-Components
// ============================================================

function StatItem({
  label,
  value,
  icon,
  color = '#E2E8F0',
  sublabel,
  rating,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  sublabel?: string;
  /** Quality tier: 'good' | 'average' | 'poor' — drives bg tint */
  rating?: 'good' | 'average' | 'poor';
}) {
  const bgMap = {
    good: 'bg-emerald-900/15 border-emerald-800/20',
    average: 'bg-amber-900/10 border-amber-800/15',
    poor: 'bg-red-900/10 border-red-800/15',
  };
  return (
    <div className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border ${rating ? bgMap[rating] : 'bg-[#21262d] border-[#30363d]'}`}>
      {icon && <div className="text-[#8b949e]">{icon}</div>}
      <p className="text-xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wider">{label}</p>
      {sublabel && <p className="text-[9px] text-[#484f58]">{sublabel}</p>}
    </div>
  );
}

function AttributeChange({
  attr,
  change,
  beforeValue,
  afterValue,
  isBest,
}: {
  attr: string;
  change: number;
  beforeValue?: number;
  afterValue?: number;
  isBest?: boolean;
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const displayChange = isPositive ? `+${change.toFixed(1)}` : change.toFixed(1);
  const before = beforeValue ?? (afterValue !== undefined ? afterValue - change : undefined);
  const after = afterValue;
  const barMax = 99;

  return (
    <div className={`py-1.5 px-2.5 rounded-lg ${isBest ? 'bg-amber-900/20 border border-amber-700/30' : 'bg-[#21262d]'}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {isBest && <Star className="h-3 w-3 text-amber-400" />}
          <span className={`text-xs capitalize ${isBest ? 'text-amber-300 font-bold' : 'text-[#8b949e]'}`}>
            {attr}
          </span>
          {isBest && (
            <Badge className="text-[8px] px-1 py-0 bg-amber-800 text-amber-300 h-3.5">
              Best
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {before !== undefined && after !== undefined && (
            <span className="text-[10px] text-[#484f58]">
              {before.toFixed(0)} → {after.toFixed(0)}
            </span>
          )}
          {isPositive ? (
            <ChevronUp className="h-3.5 w-3.5 text-emerald-400" />
          ) : isNegative ? (
            <ChevronDown className="h-3.5 w-3.5 text-red-400" />
          ) : null}
          <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-[#8b949e]'}`}>
            {displayChange}
          </span>
        </div>
      </div>
      {before !== undefined && after !== undefined && (
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full rounded-l-full"
            style={{
              width: `${(before / barMax) * 100}%`,
              backgroundColor: '#475569',
            }}
          />
          <div
            className="h-full rounded-r-full"
            style={{
              width: `${Math.abs(after - before) / barMax * 100}%`,
              backgroundColor: isPositive ? '#34D399' : isNegative ? '#F87171' : '#475569',
              opacity: Math.abs(change) > 0 ? 1 : 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

function AwardBadge({
  emoji,
  title,
  description,
  earned,
  rarity,
}: {
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}) {
  const rarityColors = {
    common: 'border-slate-600 bg-[#21262d]',
    rare: 'border-blue-700/50 bg-blue-900/20',
    epic: 'border-purple-700/50 bg-purple-900/20',
    legendary: 'border-amber-600/50 bg-amber-900/20',
  };
  const rarityGlow = {
    common: '',
    rare: '',
    epic: 'shadow-purple-900/30',
    legendary: 'shadow-amber-900/30 shadow',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={`relative rounded-lg border p-3 text-center transition-all ${
        earned ? rarityColors[rarity] : 'border-[#30363d] bg-[#161b22]/50 opacity-40'
      } ${earned ? rarityGlow[rarity] : ''}`}
    >
      <div className="text-2xl mb-1">{earned ? emoji : '🔒'}</div>
      <p className={`text-xs font-bold ${earned ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>{title}</p>
      <p className="text-[9px] text-[#8b949e] mt-0.5">{description}</p>
      {earned && rarity === 'legendary' && (
        <div className="absolute -top-1 -right-1">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SeasonEndSummary({ onClose, onReviewSeason, onViewFullStats, seasonData }: SeasonEndSummaryProps) {
  const gameState = useGameStore((state) => state.gameState);

  if (!gameState) return null;

  const { player, currentClub } = gameState;
  const {
    seasonNumber,
    leaguePosition,
    totalTeams,
    playerStats,
    achievements,
    previousOverall,
    currentOverall,
    previousMarketValue,
    currentMarketValue,
    previousWage,
    bonusEarnings,
    attributeChanges,
    previousAttributes,
    contractYearsRemaining,
    squadStatus,
    finalLeagueTable,
    bestMatchRating,
    mostGoalsInGame,
    ovrProgression,
  } = seasonData;

  // Derived values
  const zone = getZoneInfo(leaguePosition, totalTeams);
  const expectation = getPositionExpectation(leaguePosition, currentClub.quality);
  const overallColor = getOverallColor(currentOverall);
  const overallChange = currentOverall - previousOverall;
  const marketValueChange = currentMarketValue - previousMarketValue;
  const leagueInfo = getLeagueById(currentClub.league);

  // Goals/assists per game
  const goalsPerGame = playerStats.appearances > 0 ? (playerStats.goals / playerStats.appearances).toFixed(2) : '0.00';
  const assistsPerGame = playerStats.appearances > 0 ? (playerStats.assists / playerStats.appearances).toFixed(2) : '0.00';

  // Player's league table entry for stat row
  const playerLeagueEntry = finalLeagueTable.find((e) => e.clubId === currentClub.id);

  // Season Grade
  const seasonGrade = getSeasonGrade(
    playerStats.averageRating,
    playerStats.goals,
    playerStats.assists,
    playerStats.appearances,
    leaguePosition
  );

  // Attribute changes analysis
  const attrChangeEntries = Object.entries(attributeChanges)
    .filter(([, v]) => v !== undefined && Math.abs(v) > 0.3)
    .sort(([, a], [, b]) => Math.abs(b as number) - Math.abs(a as number));

  const totalImprovement = attrChangeEntries.reduce((sum, [, v]) => sum + (v as number), 0);
  const bestImprovedAttr = attrChangeEntries.length > 0
    ? attrChangeEntries.reduce((best, [attr, v]) => (v as number) > (best.change) ? { attr, change: v as number } : best, { attr: '', change: 0 })
    : null;

  // OVR progression data for chart
  const ovrChartData = ovrProgression ?? [
    { week: 0, ovr: previousOverall },
    { week: Math.floor(playerStats.appearances / 3) || 1, ovr: Math.round((previousOverall + currentOverall) / 2) },
    { week: playerStats.appearances || 1, ovr: currentOverall },
  ];

  // Official season awards from game state
  const officialSeasonAwards = (gameState.seasonAwards ?? []).filter(
    (a) => a.season === seasonNumber && a.isPlayer
  );

  // Compute award badges based on season stats
  const seasonAwards: {
    emoji: string;
    title: string;
    description: string;
    earned: boolean;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }[] = [
    {
      emoji: '👟',
      title: 'Golden Boot Contender',
      description: '15+ goals in a season',
      earned: playerStats.goals >= 15,
      rarity: playerStats.goals >= 25 ? 'legendary' : playerStats.goals >= 20 ? 'epic' : 'rare',
    },
    {
      emoji: '🎯',
      title: 'Playmaker',
      description: '10+ assists in a season',
      earned: playerStats.assists >= 10,
      rarity: playerStats.assists >= 15 ? 'epic' : 'rare',
    },
    {
      emoji: '💪',
      title: 'Iron Man',
      description: '30+ appearances',
      earned: playerStats.appearances >= 30,
      rarity: 'common',
    },
    {
      emoji: '⭐',
      title: 'Consistent Performer',
      description: 'Avg rating 7.0+',
      earned: playerStats.averageRating >= 7.0,
      rarity: playerStats.averageRating >= 8.0 ? 'legendary' : playerStats.averageRating >= 7.5 ? 'epic' : 'rare',
    },
    {
      emoji: '🛡️',
      title: 'Defensive Wall',
      description: '5+ clean sheets',
      earned: playerStats.cleanSheets >= 5,
      rarity: playerStats.cleanSheets >= 10 ? 'epic' : 'rare',
    },
    {
      emoji: '👑',
      title: 'Man of the Match',
      description: '5+ MOTM awards',
      earned: playerStats.manOfTheMatch >= 5,
      rarity: playerStats.manOfTheMatch >= 10 ? 'legendary' : 'epic',
    },
    {
      emoji: '🔥',
      title: 'Hot Streak',
      description: '10+ goals & 5+ assists',
      earned: playerStats.goals >= 10 && playerStats.assists >= 5,
      rarity: 'rare',
    },
    {
      emoji: '🏅',
      title: 'Disciplined',
      description: '0 red cards',
      earned: playerStats.redCards === 0 && playerStats.appearances > 10,
      rarity: 'common',
    },
    {
      emoji: '🏆',
      title: 'Champion',
      description: 'Finished 1st in the league',
      earned: leaguePosition === 1,
      rarity: 'legendary',
    },
  ];

  // Filter achievements unlocked this season
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  // Mini league table: top 5 + player's club
  const playerClubIndex = finalLeagueTable.findIndex((e) => e.clubId === currentClub.id);
  const miniTable = finalLeagueTable.slice(0, 5);
  if (playerClubIndex >= 5 && playerClubIndex < finalLeagueTable.length) {
    const playerEntry = finalLeagueTable[playerClubIndex];
    if (!miniTable.find((e) => e.clubId === currentClub.id)) {
      miniTable.push(playerEntry);
    }
  }

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-lg max-h-[92vh] overflow-hidden shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================ */}
        {/* Season Hero Section — Enhanced */}
        {/* ============================================ */}
        <div className="relative px-5 pt-6 pb-4 text-center overflow-hidden">
          {/* Zone color accent bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: zone.color }}
          />

          {/* Trophy icon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.08 }}
            className="relative flex justify-center mb-3"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: zone.bgColor, border: `1.5px solid ${zone.color}40` }}
            >
              <Trophy className="h-7 w-7" style={{ color: zone.color }} />
            </div>
          </motion.div>

          {/* SEASON COMPLETE title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="text-lg font-black text-white uppercase tracking-[0.2em]"
          >
            Season Complete
          </motion.h1>

          {/* Season badge + league name */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.22 }}
            className="flex items-center justify-center gap-2 mt-2"
          >
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold text-white"
              style={{ backgroundColor: zone.color }}
            >
              Season {seasonNumber}
            </span>
            <span className="text-sm text-[#8b949e]">
              {leagueInfo ? `${leagueInfo.emoji} ${leagueInfo.name}` : 'League'}
            </span>
          </motion.div>

          {/* Position achieved — large text with ordinal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.3 }}
            className="mt-4 mb-1"
          >
            <p
              className="text-4xl font-black tracking-tight"
              style={{ color: zone.color }}
            >
              {getOrdinal(leaguePosition)}
            </p>
            <p className="text-sm text-[#8b949e] mt-0.5">
              {currentClub.name}
            </p>
          </motion.div>

          {/* Position zone indicator with colored bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.38 }}
            className="mt-2 mx-auto max-w-[220px]"
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: zone.bgColor, border: `1px solid ${zone.color}25` }}
            >
              <span className="text-base">{zone.emoji}</span>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: zone.color }}>
                  {zone.label}
                </p>
                <p className="text-[9px] text-[#8b949e]">
                  {zone.label === 'Champions!' ? 'League winner' : 'Qualification zone'}
                </p>
              </div>
              {/* Expectation indicator */}
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold"
                style={{ backgroundColor: `${expectation.color}18`, color: expectation.color }}
              >
                {expectation.icon}
                <span className="max-w-[60px] truncate">{expectation.label.split(' ').pop()}</span>
              </div>
            </div>
          </motion.div>

          {/* Season summary stat row */}
          {playerLeagueEntry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.45 }}
              className="flex items-center justify-center gap-4 mt-4"
            >
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-[#c9d1d9]">{playerLeagueEntry.points}</span>
                <span className="text-[9px] text-[#484f58] uppercase tracking-wider">Points</span>
              </div>
              <div className="w-px h-6 bg-[#30363d]" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-emerald-400">{playerLeagueEntry.won}</span>
                <span className="text-[9px] text-[#484f58] uppercase tracking-wider">Wins</span>
              </div>
              <div className="w-px h-6 bg-[#30363d]" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-amber-400">{playerLeagueEntry.drawn}</span>
                <span className="text-[9px] text-[#484f58] uppercase tracking-wider">Draws</span>
              </div>
              <div className="w-px h-6 bg-[#30363d]" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-red-400">{playerLeagueEntry.lost}</span>
                <span className="text-[9px] text-[#484f58] uppercase tracking-wider">Losses</span>
              </div>
              <div className="w-px h-6 bg-[#30363d]" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-black text-[#8b949e]">{playerLeagueEntry.played}</span>
                <span className="text-[9px] text-[#484f58] uppercase tracking-wider">Played</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* ============================================ */}
        {/* Scrollable Content */}
        {/* ============================================ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="overflow-y-auto max-h-[calc(92vh-200px)] px-4 pb-4 space-y-3"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#334155 transparent',
          }}
        >
          {/* ============================================ */}
          {/* League Finish Card */}
          {/* ============================================ */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  League Finish
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                {/* Position display */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center font-black text-xl"
                      style={{ backgroundColor: zone.bgColor, color: zone.color, border: `1px solid ${zone.color}30` }}
                    >
                      {getOrdinal(leaguePosition)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#c9d1d9]">
                        {zone.emoji} {zone.label}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5" style={{ color: expectation.color }}>
                        {expectation.icon}
                        <span className="text-xs font-medium">{expectation.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#8b949e]">Out of</p>
                    <p className="text-sm font-bold text-[#c9d1d9]">{totalTeams} teams</p>
                  </div>
                </div>

                {/* Mini League Table */}
                {miniTable.length > 0 && (
                  <div className="mt-2 rounded-lg border border-[#30363d] overflow-hidden">
                    <div className="bg-[#21262d] px-3 py-1.5 flex items-center text-[10px] text-[#8b949e] uppercase tracking-wider">
                      <span className="w-6">#</span>
                      <span className="flex-1">Club</span>
                      <span className="w-8 text-center">P</span>
                      <span className="w-8 text-center">W</span>
                      <span className="w-8 text-center">D</span>
                      <span className="w-8 text-center">L</span>
                      <span className="w-10 text-right">Pts</span>
                    </div>
                    {miniTable.map((entry, idx) => {
                      const isPlayerClub = entry.clubId === currentClub.id;
                      const clubData = getClubById(entry.clubId);
                      const pos = finalLeagueTable.findIndex((e) => e.clubId === entry.clubId) + 1;
                      const zoneInfo = getZoneInfo(pos, totalTeams);

                      return (
                        <div
                          key={entry.clubId}
                          className={`px-3 py-1.5 flex items-center text-xs border-t border-[#30363d] ${
                            isPlayerClub ? 'bg-emerald-900/15' : 'bg-transparent'
                          }`}
                        >
                          <span
                            className="w-6 font-bold"
                            style={{ color: pos <= 4 ? '#22C55E' : pos <= 6 ? '#F59E0B' : pos >= totalTeams - 2 ? '#EF4444' : '#94A3B8' }}
                          >
                            {pos}
                          </span>
                          <span className="flex-1 flex items-center gap-1.5">
                            <span className="text-sm">{clubData?.logo}</span>
                            <span className={`truncate ${isPlayerClub ? 'text-emerald-300 font-bold' : 'text-[#c9d1d9]'}`}>
                              {clubData?.shortName || entry.clubName.slice(0, 3)}
                            </span>
                            {isPlayerClub && (
                              <Badge className="text-[8px] px-1 py-0 bg-emerald-800 text-emerald-300 h-3.5">
                                YOU
                              </Badge>
                            )}
                          </span>
                          <span className="w-8 text-center text-[#8b949e]">{entry.played}</span>
                          <span className="w-8 text-center text-[#8b949e]">{entry.won}</span>
                          <span className="w-8 text-center text-[#8b949e]">{entry.drawn}</span>
                          <span className="w-8 text-center text-[#8b949e]">{entry.lost}</span>
                          <span className="w-10 text-right font-bold text-[#c9d1d9]">{entry.points}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Section Divider */}
          <div className="border-t border-[#30363d]/50" />

          {/* ============================================ */}
          {/* Player Performance Summary Card */}
          {/* ============================================ */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                    <ScrollText className="h-3.5 w-3.5" />
                    Player Performance
                  </CardTitle>
                  {/* Season Grade Badge */}
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                    style={{ backgroundColor: seasonGrade.bgColor }}
                  >
                    <span className="text-sm font-black" style={{ color: seasonGrade.color }}>
                      {seasonGrade.grade}
                    </span>
                    <span className="text-[9px] text-[#8b949e]">Grade</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                {/* OVR Rating Badge — current → potential */}
                <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black text-2xl"
                      style={{ backgroundColor: `${overallColor}18`, border: `1.5px solid ${overallColor}35`, color: overallColor }}
                    >
                      {currentOverall}
                    </div>
                    <div>
                      <p className="text-xs text-[#8b949e]">Overall Rating</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-[#8b949e]">{previousOverall}</span>
                        <ArrowRight className="h-3 w-3 text-[#484f58]" />
                        <span className="text-sm font-bold" style={{ color: overallColor }}>{currentOverall}</span>
                        <Badge
                          className={`text-[10px] px-1.5 ${
                            overallChange > 0
                              ? 'bg-emerald-800 text-emerald-300'
                              : overallChange < 0
                              ? 'bg-red-800 text-red-300'
                              : 'bg-slate-700 text-[#8b949e]'
                          }`}
                        >
                          {overallChange > 0 ? `+${overallChange}` : overallChange < 0 ? `${overallChange}` : '±0'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-[#484f58] uppercase tracking-wider">Potential</p>
                    <p className="text-lg font-black text-amber-400">{player.potential}</p>
                  </div>
                </div>

                {/* Stats Grid — 2x3 with color coding */}
                <div className="grid grid-cols-3 gap-2">
                  <StatItem
                    label="Apps"
                    value={playerStats.appearances}
                    icon={<Users className="h-3.5 w-3.5" />}
                    color={playerStats.appearances >= 25 ? '#10B981' : playerStats.appearances >= 15 ? '#F59E0B' : '#EF4444'}
                    sublabel={`${playerStats.starts} starts`}
                    rating={playerStats.appearances >= 25 ? 'good' : playerStats.appearances >= 15 ? 'average' : 'poor'}
                  />
                  <StatItem
                    label="Goals"
                    value={playerStats.goals}
                    icon={<Target className="h-3.5 w-3.5" />}
                    color={playerStats.goals >= 10 ? '#10B981' : playerStats.goals >= 5 ? '#F59E0B' : '#EF4444'}
                    rating={playerStats.goals >= 10 ? 'good' : playerStats.goals >= 5 ? 'average' : 'poor'}
                  />
                  <StatItem
                    label="Assists"
                    value={playerStats.assists}
                    icon={<Goal className="h-3.5 w-3.5" />}
                    color={playerStats.assists >= 8 ? '#10B981' : playerStats.assists >= 4 ? '#F59E0B' : '#EF4444'}
                    rating={playerStats.assists >= 8 ? 'good' : playerStats.assists >= 4 ? 'average' : 'poor'}
                  />
                  <StatItem
                    label="Avg Rating"
                    value={playerStats.averageRating > 0 ? playerStats.averageRating.toFixed(1) : '-'}
                    icon={<Star className="h-3.5 w-3.5" />}
                    color={
                      playerStats.averageRating >= 7.5
                        ? '#10B981'
                        : playerStats.averageRating >= 6.5
                        ? '#F59E0B'
                        : '#EF4444'
                    }
                    sublabel={playerStats.averageRating > 0 ? getMatchRatingLabel(playerStats.averageRating) : undefined}
                    rating={
                      playerStats.averageRating >= 7.5
                        ? 'good'
                        : playerStats.averageRating >= 6.5
                        ? 'average'
                        : 'poor'
                    }
                  />
                  <StatItem
                    label="Clean Sheets"
                    value={playerStats.cleanSheets}
                    icon={<Shield className="h-3.5 w-3.5" />}
                    color={playerStats.cleanSheets >= 5 ? '#10B981' : playerStats.cleanSheets >= 2 ? '#F59E0B' : '#EF4444'}
                    rating={playerStats.cleanSheets >= 5 ? 'good' : playerStats.cleanSheets >= 2 ? 'average' : 'poor'}
                  />
                  <StatItem
                    label="Man of the Match"
                    value={playerStats.manOfTheMatch}
                    icon={<Crown className="h-3.5 w-3.5" />}
                    color={playerStats.manOfTheMatch >= 5 ? '#10B981' : playerStats.manOfTheMatch >= 2 ? '#F59E0B' : '#EF4444'}
                    rating={playerStats.manOfTheMatch >= 5 ? 'good' : playerStats.manOfTheMatch >= 2 ? 'average' : 'poor'}
                  />
                </div>

                {/* Per-game breakdown */}
                <div className="bg-[#21262d] rounded-lg p-3 space-y-2 border border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Season Grade</span>
                    <div
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: seasonGrade.bgColor }}
                    >
                      <Sparkles className="h-3 w-3" style={{ color: seasonGrade.color }} />
                      <span className="text-xs font-black" style={{ color: seasonGrade.color }}>
                        Grade {seasonGrade.grade}
                      </span>
                    </div>
                  </div>

                  {/* Rating bar visual */}
                  {playerStats.averageRating > 0 && (
                    <div className="w-full h-2 bg-slate-700 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all"
                        style={{
                          width: `${(playerStats.averageRating / 10) * 100}%`,
                          backgroundColor:
                            playerStats.averageRating >= 7.5
                              ? '#10B981'
                              : playerStats.averageRating >= 6.5
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#8b949e]">
                      Goals/game: <span className="text-emerald-400 font-semibold">{goalsPerGame}</span>
                    </span>
                    <span className="text-[10px] text-[#8b949e]">
                      Assists/game: <span className="text-blue-400 font-semibold">{assistsPerGame}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ============================================ */}
          {/* Awards Section */}
          {/* ============================================ */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                  <Award className="h-3.5 w-3.5" />
                  Season Awards
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {/* Official Season Awards — mini cards */}
                {officialSeasonAwards.length > 0 ? (
                  <div className="mb-3 space-y-2">
                    <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <Trophy className="h-3 w-3" />
                      Official Awards Won
                    </p>
                    {officialSeasonAwards.map((award) => (
                      <div key={award.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-amber-700/25 bg-amber-900/10">
                        <span className="text-xl">{award.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-amber-300 truncate">{award.name}</p>
                          <p className="text-[9px] text-[#8b949e] mt-0.5">{award.stats}</p>
                        </div>
                        <BadgeCheck className="h-4 w-4 text-amber-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3 p-3 rounded-lg border border-[#30363d] bg-[#21262d] text-center">
                    <Trophy className="h-5 w-5 text-[#484f58] mx-auto mb-1" />
                    <p className="text-xs text-[#8b949e]">No official awards this season</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {seasonAwards.map((award) => (
                    <AwardBadge
                      key={award.title}
                      emoji={award.emoji}
                      title={award.title}
                      description={award.description}
                      earned={award.earned}
                      rarity={award.rarity}
                    />
                  ))}
                </div>

                {/* Unlocked achievements from the game */}
                {unlockedAchievements.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#30363d] space-y-1.5">
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold">
                      Achievements Unlocked
                    </p>
                    {unlockedAchievements.map((ach) => (
                      <div
                        key={ach.id}
                        className="flex items-center gap-2 bg-[#21262d] rounded-lg p-2"
                      >
                        <span className="text-lg">{ach.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#c9d1d9] truncate">{ach.name}</p>
                          <p className="text-[9px] text-[#8b949e] truncate">{ach.description}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[8px] shrink-0 ${
                            ach.rarity === 'legendary'
                              ? 'border-amber-600 text-amber-400'
                              : ach.rarity === 'epic'
                              ? 'border-purple-600 text-purple-400'
                              : ach.rarity === 'rare'
                              ? 'border-blue-600 text-blue-400'
                              : 'border-slate-600 text-[#8b949e]'
                          }`}
                        >
                          {ach.rarity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ============================================ */}
          {/* Progress Card */}
          {/* ============================================ */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                {/* Overall Rating Change */}
                <div className="bg-[#21262d] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#8b949e]">Overall Rating</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#8b949e]">{previousOverall}</span>
                      <ArrowRight className="h-3 w-3 text-[#484f58]" />
                      <span className="text-lg font-black" style={{ color: overallColor }}>
                        {currentOverall}
                      </span>
                      <Badge
                        className={`text-[10px] px-1.5 ${
                          overallChange > 0
                            ? 'bg-emerald-800 text-emerald-300'
                            : overallChange < 0
                            ? 'bg-red-800 text-red-300'
                            : 'bg-slate-700 text-[#8b949e]'
                        }`}
                      >
                        {overallChange > 0 ? `+${overallChange}` : overallChange < 0 ? `${overallChange}` : '±0'}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(currentOverall / 99) * 100}%`,
                        backgroundColor: overallColor,
                      }}
                    />
                  </div>
                </div>

                {/* Market Value Change */}
                <div className="bg-[#21262d] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Market Value</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#8b949e]">{formatCurrency(previousMarketValue, 'M')}</span>
                      <ArrowRight className="h-3 w-3 text-[#484f58]" />
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(currentMarketValue, 'M')}</span>
                      <Badge
                        className={`text-[10px] px-1.5 ${
                          marketValueChange > 0
                            ? 'bg-emerald-800 text-emerald-300'
                            : marketValueChange < 0
                            ? 'bg-red-800 text-red-300'
                            : 'bg-slate-700 text-[#8b949e]'
                        }`}
                      >
                        {marketValueChange > 0
                          ? `+${formatCurrency(marketValueChange, 'M')}`
                          : marketValueChange < 0
                          ? `${formatCurrency(marketValueChange, 'M')}`
                          : '±0'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Key Attribute Changes — split improved vs declined */}
                {attrChangeEntries.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold">
                        Attribute Changes
                      </p>
                      <div className="flex items-center gap-1.5">
                        {totalImprovement > 0 && (
                          <Badge className="text-[9px] px-1.5 bg-emerald-800 text-emerald-300">
                            +{totalImprovement.toFixed(1)} net
                          </Badge>
                        )}
                        {totalImprovement < 0 && (
                          <Badge className="text-[9px] px-1.5 bg-red-800 text-red-300">
                            {totalImprovement.toFixed(1)} net
                          </Badge>
                        )}
                        {totalImprovement === 0 && (
                          <Badge className="text-[9px] px-1.5 bg-slate-700 text-[#8b949e]">
                            ±0 net
                          </Badge>
                        )}
                      </div>
                    </div>
                    {(() => {
                      const improved = attrChangeEntries.filter(([, v]) => (v as number) > 0);
                      const declined = attrChangeEntries.filter(([, v]) => (v as number) < 0);
                      return (
                        <>
                          {improved.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[9px] text-emerald-500 uppercase tracking-widest font-bold flex items-center gap-1">
                                <ChevronUp className="h-3 w-3" />
                                Improved ({improved.length})
                              </p>
                              {improved.map(([attr, change]) => {
                                const attrKey = attr as keyof typeof player.attributes;
                                const afterVal = player.attributes[attrKey];
                                const beforeVal = previousAttributes?.[attrKey];
                                return (
                                  <AttributeChange
                                    key={attr}
                                    attr={attr}
                                    change={change as number}
                                    beforeValue={beforeVal}
                                    afterValue={afterVal}
                                    isBest={bestImprovedAttr?.attr === attr}
                                  />
                                );
                              })}
                            </div>
                          )}
                          {improved.length > 0 && declined.length > 0 && (
                            <div className="border-t border-[#30363d] my-1" />
                          )}
                          {declined.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-[9px] text-red-400 uppercase tracking-widest font-bold flex items-center gap-1">
                                <ChevronDown className="h-3 w-3" />
                                Declined ({declined.length})
                              </p>
                              {declined.map(([attr, change]) => {
                                const attrKey = attr as keyof typeof player.attributes;
                                const afterVal = player.attributes[attrKey];
                                const beforeVal = previousAttributes?.[attrKey];
                                return (
                                  <AttributeChange
                                    key={attr}
                                    attr={attr}
                                    change={change as number}
                                    beforeValue={beforeVal}
                                    afterValue={afterVal}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {attrChangeEntries.length === 0 && (
                  <div className="bg-[#21262d] rounded-lg p-3 text-center border border-[#30363d]">
                    <p className="text-xs text-[#8b949e]">No significant attribute changes this season</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Section Divider */}
          <div className="border-t border-[#30363d]/50" />

          {/* ============================================ */}
          {/* Financial Summary Card */}
          {/* ============================================ */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {/* Market Value — old → new with percentage */}
                <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#8b949e]" />
                      <span className="text-xs text-[#8b949e]">Market Value</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {marketValueChange > 0 && <ChevronUp className="h-3.5 w-3.5 text-emerald-400" />}
                      {marketValueChange < 0 && <ChevronDown className="h-3.5 w-3.5 text-red-400" />}
                      <span className={`text-sm font-bold ${
                        marketValueChange > 0 ? 'text-emerald-400' : marketValueChange < 0 ? 'text-red-400' : 'text-[#c9d1d9]'
                      }`}>
                        {formatCurrency(currentMarketValue, 'M')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-[#484f58]">{formatCurrency(previousMarketValue, 'M')}</span>
                    <ArrowRight className="h-2.5 w-2.5 text-[#484f58]" />
                    <span className="text-[10px] font-semibold" style={{
                      color: marketValueChange > 0 ? '#34D399' : marketValueChange < 0 ? '#F87171' : '#8b949e'
                    }}>
                      {formatCurrency(currentMarketValue, 'M')}
                    </span>
                    {previousMarketValue > 0 && marketValueChange !== 0 && (
                      <span className={`text-[9px] font-bold ml-auto ${
                        marketValueChange > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        ({marketValueChange > 0 ? '+' : ''}{((marketValueChange / previousMarketValue) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Wage Progression */}
                <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#8b949e]" />
                    <div>
                      <span className="text-xs text-[#8b949e]">Weekly Wage</span>
                      {previousWage !== undefined && previousWage !== player.contract.weeklyWage && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-[#484f58] line-through">
                            {formatWageDisplay(previousWage)}
                          </span>
                          <ChevronUp className="h-2.5 w-2.5 text-emerald-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#c9d1d9]">
                    {formatWageDisplay(player.contract.weeklyWage)}
                  </span>
                </div>

                {/* Contract — with visual timeline */}
                <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-[#8b949e]" />
                      <span className="text-xs text-[#8b949e]">Contract</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        contractYearsRemaining <= 1
                          ? 'border-red-600 text-red-400'
                          : contractYearsRemaining <= 2
                          ? 'border-amber-600 text-amber-400'
                          : 'border-emerald-600 text-emerald-400'
                      }`}
                    >
                      {contractYearsRemaining} year{contractYearsRemaining !== 1 ? 's' : ''} remaining
                    </Badge>
                  </div>
                  {/* Contract timeline visual */}
                  <div className="flex items-center gap-1 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const isActive = i < contractYearsRemaining;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={`h-1.5 w-full rounded-sm ${
                              isActive
                                ? contractYearsRemaining <= 1
                                  ? 'bg-red-500'
                                  : contractYearsRemaining <= 2
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                                : 'bg-[#30363d]'
                            }`}
                          />
                          <span className="text-[8px] text-[#484f58]">Y{i + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bonus Earnings */}
                {(bonusEarnings !== undefined && bonusEarnings > 0) && (
                  <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-[#8b949e]">Bonus Earnings</span>
                    </div>
                    <span className="text-sm font-bold text-amber-400">
                      +{formatCurrency(bonusEarnings, 'K')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Section Divider */}
          <div className="border-t border-[#30363d]/50" />

          {/* ============================================ */}
          {/* Career Impact Visualization */}
          {/* ============================================ */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Career Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                {/* SVG OVR Progression Chart */}
                <div className="bg-[#21262d] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#8b949e]">OVR Progression</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#484f58]">Potential: {player.potential}</span>
                    </div>
                  </div>
                  <svg viewBox="0 0 300 80" className="w-full h-20" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[40, 60, 80, 99].map((val) => {
                      const y = 80 - (val / 99) * 75;
                      return (
                        <line
                          key={val}
                          x1="0" y1={y} x2="300" y2={y}
                          stroke="#30363d" strokeWidth="0.5" strokeDasharray="4 4"
                        />
                      );
                    })}
                    {/* Potential line */}
                    <line
                      x1="0" y1={80 - (player.potential / 99) * 75}
                      x2="300" y2={80 - (player.potential / 99) * 75}
                      stroke="#F59E0B" strokeWidth="1" strokeDasharray="6 3" opacity="0.5"
                    />
                    {/* OVR line */}
                    {ovrChartData.length >= 2 && (() => {
                      const minWeek = Math.min(...ovrChartData.map(d => d.week));
                      const maxWeek = Math.max(...ovrChartData.map(d => d.week));
                      const weekRange = maxWeek - minWeek || 1;
                      const points = ovrChartData.map(d => {
                        const x = ((d.week - minWeek) / weekRange) * 280 + 10;
                        const y = 80 - (d.ovr / 99) * 75;
                        return `${x},${y}`;
                      }).join(' ');
                      return (
                        <g>
                          <polyline
                            points={points}
                            fill="none"
                            stroke={overallColor}
                            strokeWidth="2"
                            strokeLinejoin="round"
                          />
                          {/* Start point */}
                          <circle
                            cx={((ovrChartData[0].week - minWeek) / weekRange) * 280 + 10}
                            cy={80 - (ovrChartData[0].ovr / 99) * 75}
                            r="3"
                            fill="#8b949e"
                          />
                          {/* End point */}
                          {(() => {
                            const last = ovrChartData[ovrChartData.length - 1];
                            const lx = ((last.week - minWeek) / weekRange) * 280 + 10;
                            const ly = 80 - (last.ovr / 99) * 75;
                            return (
                              <circle cx={lx} cy={ly} r="4" fill={overallColor} />
                            );
                          })()}
                        </g>
                      );
                    })()}
                  </svg>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-[#484f58]">
                      Start: <span className="text-[#8b949e] font-semibold">{previousOverall}</span>
                    </span>
                    <span className="text-[9px] text-[#484f58]">
                      End: <span className="font-semibold" style={{ color: overallColor }}>{currentOverall}</span>
                    </span>
                  </div>
                </div>

                {/* Season Highlight Moments */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold">
                    Season Highlights
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {playerStats.goals > 0 && (
                      <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                        <Target className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                        <p className="text-sm font-bold text-[#c9d1d9]">{playerStats.goals}</p>
                        <p className="text-[9px] text-[#484f58]">Total Goals</p>
                      </div>
                    )}
                    {playerStats.assists > 0 && (
                      <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                        <Goal className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                        <p className="text-sm font-bold text-[#c9d1d9]">{playerStats.assists}</p>
                        <p className="text-[9px] text-[#484f58]">Total Assists</p>
                      </div>
                    )}
                    {bestMatchRating !== undefined && bestMatchRating > 0 && (
                      <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                        <Star className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                        <p className="text-sm font-bold text-[#c9d1d9]">{bestMatchRating.toFixed(1)}</p>
                        <p className="text-[9px] text-[#484f58]">Best Match</p>
                      </div>
                    )}
                    {mostGoalsInGame !== undefined && mostGoalsInGame > 0 && (
                      <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                        <Flame className="h-4 w-4 text-red-400 mx-auto mb-1" />
                        <p className="text-sm font-bold text-[#c9d1d9]">{mostGoalsInGame}</p>
                        <p className="text-[9px] text-[#484f58]">Goals in a Game</p>
                      </div>
                    )}
                    {playerStats.averageRating > 0 && (
                      <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                        <Crown className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                        <p className="text-sm font-bold text-[#c9d1d9]">{playerStats.averageRating.toFixed(1)}</p>
                        <p className="text-[9px] text-[#484f58]">Avg Rating</p>
                      </div>
                    )}
                    {playerStats.manOfTheMatch > 0 && (
                      <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                        <Medal className="h-4 w-4 text-amber-400 mx-auto mb-1" />
                        <p className="text-sm font-bold text-[#c9d1d9]">{playerStats.manOfTheMatch}</p>
                        <p className="text-[9px] text-[#484f58]">MOTM Awards</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ============================================ */}
          {/* Next Season Preview */}
          {/* ============================================ */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Next Season Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {/* Contract Status */}
                <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-[#8b949e]" />
                    <span className="text-xs text-[#8b949e]">Contract</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        contractYearsRemaining <= 1
                          ? 'border-red-600 text-red-400'
                          : contractYearsRemaining <= 2
                          ? 'border-amber-600 text-amber-400'
                          : 'border-emerald-600 text-emerald-400'
                      }`}
                    >
                      {contractYearsRemaining} year{contractYearsRemaining !== 1 ? 's' : ''} remaining
                    </Badge>
                  </div>
                </div>

                {/* Squad Status */}
                <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#8b949e]" />
                    <span className="text-xs text-[#8b949e]">Squad Status</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${
                      squadStatus === 'starter'
                        ? 'border-emerald-600 text-emerald-400'
                        : squadStatus === 'rotation'
                        ? 'border-blue-600 text-blue-400'
                        : squadStatus === 'bench'
                        ? 'border-amber-600 text-amber-400'
                        : squadStatus === 'prospect'
                        ? 'border-purple-600 text-purple-400'
                        : 'border-slate-600 text-[#8b949e]'
                    }`}
                  >
                    {getSquadStatusLabel(squadStatus)}
                  </Badge>
                </div>

                {/* Age */}
                <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#8b949e]" />
                    <span className="text-xs text-[#8b949e]">Age</span>
                  </div>
                  <span className="text-sm font-semibold text-[#c9d1d9]">{player.age} years old</span>
                </div>

                {/* Contract Warning */}
                {contractYearsRemaining <= 1 && (
                  <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-red-300">
                        {contractYearsRemaining === 0 ? 'Contract Expired!' : 'Contract Expiring!'}
                      </p>
                      <p className="text-xs text-red-400/70">
                        {contractYearsRemaining === 0
                          ? 'You need a new contract or transfer to continue playing.'
                          : 'Your contract runs out at the end of next season.'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Bottom spacer */}
          <div className="h-2" />
        </motion.div>

        {/* ============================================ */}
        {/* Footer - Action Buttons */}
        {/* ============================================ */}
        <div className="px-4 py-4 border-t border-[#30363d] bg-[#161b22] space-y-2.5">
          <Button
            onClick={onClose}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/40 transition-colors text-base"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Continue to Season {seasonNumber + 1}
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={onViewFullStats}
              disabled={!onViewFullStats}
              variant="outline"
              className="flex-1 h-10 border-[#30363d] bg-[#21262d] hover:bg-[#30363d] active:bg-[#3a414a] text-[#c9d1d9] hover:text-white text-xs font-medium rounded-lg transition-colors"
            >
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              Full Statistics
            </Button>
            <Button
              onClick={onReviewSeason}
              disabled={!onReviewSeason}
              variant="outline"
              className="flex-1 h-10 border-[#30363d] bg-[#21262d] hover:bg-[#30363d] active:bg-[#3a414a] text-[#c9d1d9] hover:text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Trophy className="mr-1.5 h-3.5 w-3.5" />
              View Awards
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
