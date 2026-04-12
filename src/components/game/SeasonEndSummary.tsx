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
} from 'lucide-react';

// ============================================================
// Props
// ============================================================

interface SeasonEndSummaryProps {
  onClose: () => void;
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
    attributeChanges: Partial<PlayerAttributes>;
    contractYearsRemaining: number;
    squadStatus: SquadStatus;
    finalLeagueTable: LeagueStanding[];
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
// Sub-Components
// ============================================================

function StatItem({
  label,
  value,
  icon,
  color = '#E2E8F0',
  sublabel,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  sublabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-2">
      {icon && <div className="text-[#8b949e]">{icon}</div>}
      <p className="text-xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] text-[#8b949e] uppercase tracking-wider">{label}</p>
      {sublabel && <p className="text-[9px] text-[#484f58]">{sublabel}</p>}
    </div>
  );
}

function AttributeChange({ attr, change }: { attr: string; change: number }) {
  const isPositive = change > 0;
  const displayChange = isPositive ? `+${change.toFixed(1)}` : change.toFixed(1);
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#21262d]">
      <span className="text-xs text-[#8b949e] capitalize">{attr}</span>
      <div className="flex items-center gap-1.5">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-emerald-400" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-400" />
        )}
        <span className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {displayChange}
        </span>
      </div>
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

export default function SeasonEndSummary({ onClose, seasonData }: SeasonEndSummaryProps) {
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
    attributeChanges,
    contractYearsRemaining,
    squadStatus,
    finalLeagueTable,
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

  // Attribute change entries
  const attrChangeEntries = Object.entries(attributeChanges)
    .filter(([, v]) => v !== undefined && Math.abs(v) > 0.3)
    .sort(([, a], [, b]) => Math.abs(b as number) - Math.abs(a as number));

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } },
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
        {/* Season Header with Trophy Animation */}
        {/* ============================================ */}
        <div className="relative px-5 pt-6 pb-4 text-center overflow-hidden">
          {/* Background glow effect */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at center, ${zone.color}40 0%, transparent 70%)`,
            }}
          />

          {/* Trophy animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.2 }}
            className="relative"
          >
            <motion.div
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-5xl mb-2"
            >
              🏆
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.3 }}
            className="text-2xl font-black text-white"
          >
            Season {seasonNumber} Complete!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: 0.5 }}
            className="text-sm text-[#8b949e] mt-1"
          >
            {leagueInfo ? `${leagueInfo.emoji} ${leagueInfo.name}` : 'League'} • {currentClub.name}
          </motion.p>
        </div>

        {/* ============================================ */}
        {/* Scrollable Content */}
        {/* ============================================ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="overflow-y-auto max-h-[calc(92vh-200px)] px-4 pb-4 space-y-4"
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

          {/* ============================================ */}
          {/* Player Stats Card */}
          {/* ============================================ */}
          <motion.div variants={itemVariants}>
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider flex items-center gap-2">
                  <ScrollText className="h-3.5 w-3.5" />
                  Season Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <StatItem
                    label="Appearances"
                    value={playerStats.appearances}
                    icon={<Users className="h-3 w-3" />}
                    color="#F59E0B"
                    sublabel={`${playerStats.starts} starts`}
                  />
                  <StatItem
                    label="Goals"
                    value={playerStats.goals}
                    icon={<Target className="h-3 w-3" />}
                    color="#10B981"
                  />
                  <StatItem
                    label="Assists"
                    value={playerStats.assists}
                    icon={<Goal className="h-3 w-3" />}
                    color="#3B82F6"
                  />
                  <StatItem
                    label="Clean Sheets"
                    value={playerStats.cleanSheets}
                    icon={<Shield className="h-3 w-3" />}
                    color="#8B5CF6"
                  />
                  <StatItem
                    label="Yellow Cards"
                    value={playerStats.yellowCards}
                    icon={<Activity className="h-3 w-3" />}
                    color="#F59E0B"
                  />
                  <StatItem
                    label="Red Cards"
                    value={playerStats.redCards}
                    icon={<Activity className="h-3 w-3" />}
                    color="#EF4444"
                  />
                </div>

                {/* Average Rating */}
                <div className="bg-[#21262d] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8b949e]">Average Rating</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xl font-black"
                        style={{
                          color:
                            playerStats.averageRating >= 7.5
                              ? '#10B981'
                              : playerStats.averageRating >= 6.5
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      >
                        {playerStats.averageRating > 0 ? playerStats.averageRating.toFixed(1) : '-'}
                      </span>
                      {playerStats.averageRating > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[9px]"
                          style={{
                            borderColor:
                              playerStats.averageRating >= 7.5
                                ? '#10B981'
                                : playerStats.averageRating >= 6.5
                                ? '#F59E0B'
                                : '#EF4444',
                            color:
                              playerStats.averageRating >= 7.5
                                ? '#10B981'
                                : playerStats.averageRating >= 6.5
                                ? '#F59E0B'
                                : '#EF4444',
                          }}
                        >
                          {getMatchRatingLabel(playerStats.averageRating)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Rating bar visual */}
                  {playerStats.averageRating > 0 && (
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
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

                  {playerStats.manOfTheMatch > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-[#30363d]">
                      <Crown className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] text-[#8b949e]">
                        <span className="text-amber-400 font-bold">{playerStats.manOfTheMatch}</span> Man of the Match
                      </span>
                    </div>
                  )}
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

                {/* Key Attribute Improvements */}
                {attrChangeEntries.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-wider font-semibold">
                      Key Attribute Changes
                    </p>
                    {attrChangeEntries.map(([attr, change]) => (
                      <AttributeChange key={attr} attr={attr} change={change as number} />
                    ))}
                  </div>
                )}

                {attrChangeEntries.length === 0 && (
                  <div className="bg-[#21262d] rounded-lg p-3 text-center">
                    <p className="text-xs text-[#8b949e]">No significant attribute changes this season</p>
                  </div>
                )}
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
        {/* Footer - Continue Button */}
        {/* ============================================ */}
        <div className="px-4 py-4 border-t border-[#30363d] bg-[#161b22]">
          <Button
            onClick={onClose}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow shadow-emerald-900/30 transition-all text-base"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Continue to Season {seasonNumber + 1}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
