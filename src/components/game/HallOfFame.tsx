'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { GameState, MatchResult, Trophy, SeasonAward } from '@/lib/game/types';
import { motion } from 'framer-motion';
import {
  Trophy as TrophyIcon,
  Award,
  Target,
  Star,
  Flame,
  Crown,
  Medal,
  Calendar,
  Zap,
  TrendingUp,
  ArrowUp,
  Lock,
  CheckCircle2,
  Shield,
  Swords,
  Footprints,
  Gem,
  Diamond,
  User,
  MapPin,
  ArrowRight,
  Heart,
  MessageCircle,
  Music,
  Users,
  BookOpen,
  Timer,
  Sparkles,
  BarChart3,
} from 'lucide-react';

// ── Animation Constants ─────────────────────────────────────
const SEC_DELAY = 0.05;
const ITEM_DELAY = 0.03;
const BASE_ANIM = { duration: 0.18, ease: 'easeOut' as const };

// ── Helpers ─────────────────────────────────────────────────
function getRatingColor(rating: number): string {
  if (rating >= 7.5) return '#22c55e';
  if (rating >= 6.0) return '#f59e0b';
  return '#ef4444';
}

function formatValue(n: number): string {
  if (n >= 1_000_000_000) return `€${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toFixed(0)}`;
}

function ordinal(n: number): string {
  if (n <= 0) return '-';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function countryToFlag(nationality: string): string {
  const map: Record<string, string> = {
    England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Spain: '🇪🇸', France: '🇫🇷', Germany: '🇩🇪',
    Italy: '🇮🇹', Brazil: '🇧🇷', Argentina: '🇦🇷', Portugal: '🇵🇹',
    Netherlands: '🇳🇱', Belgium: '🇧🇪', Croatia: '🇭🇷', Uruguay: '🇺🇾',
    Colombia: '🇨🇴', Chile: '🇨🇱', Mexico: '🇲🇽', USA: '🇺🇸',
    Japan: '🇯🇵', South_Korea: '🇰🇷', Australia: '🇦🇺', Nigeria: '🇳🇬',
    Senegal: '🇸🇳', Ghana: '🇬🇭', Morocco: '🇲🇦', Egypt: '🇪🇬',
    Canada: '🇨🇦', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Poland: '🇵🇱', Sweden: '🇸🇪',
    Denmark: '🇩🇰', Norway: '🇳🇴', Switzerland: '🇨🇭', Austria: '🇦🇹',
    Serbia: '🇷🇸', Turkey: '🇹🇷', Russia: '🇷🇺', Ukraine: '🇺🇦',
  };
  return map[nationality] ?? '🏳️';
}

function getPositionColor(pos: string): string {
  if (pos === 'GK') return '#f59e0b';
  if (['CB', 'LB', 'RB'].includes(pos)) return '#3b82f6';
  if (['CDM', 'CM'].includes(pos)) return '#22c55e';
  if (['CAM', 'LW', 'RW', 'LM', 'RM'].includes(pos)) return '#ef4444';
  if (['ST', 'CF'].includes(pos)) return '#f97316';
  return '#8b949e';
}

function getOvrColor(ovr: number): string {
  if (ovr >= 85) return '#22c55e';
  if (ovr >= 75) return '#4ade80';
  if (ovr >= 65) return '#f59e0b';
  if (ovr >= 55) return '#fb923c';
  return '#ef4444';
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ── Sub-Components ──────────────────────────────────────────
function RecordCard({
  icon,
  value,
  label,
  color = 'text-emerald-400',
  delay = 0,
  miniChart,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
  delay?: number;
  miniChart?: React.ReactNode;
}) {
  return (
    <motion.div
      className="bg-[#161b22] rounded-lg p-3 border border-[#30363d] flex flex-col items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...BASE_ANIM, delay }}
    >
      <span className={color}>{icon}</span>
      <span className={`text-lg font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-[#8b949e] text-center leading-tight">{label}</span>
      {miniChart}
    </motion.div>
  );
}

function SectionHeader({
  title,
  icon,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      className="flex items-center gap-2 mb-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...BASE_ANIM, delay }}
    >
      <span className="text-emerald-400">{icon}</span>
      <h2 className="text-sm font-bold text-[#c9d1d9]">{title}</h2>
    </motion.div>
  );
}

function MiniBarChart({
  current,
  average,
  delay = 0,
}: {
  current: number;
  average: number;
  delay?: number;
}) {
  const maxVal = Math.max(current, average, 1);
  const currentPct = maxVal > 0 ? (current / maxVal) * 100 : 0;
  const avgPct = maxVal > 0 ? (average / maxVal) * 100 : 0;
  const isAbove = current >= average;
  const barColor = isAbove ? '#22c55e' : '#ef4444';

  return (
    <div className="w-full mt-1 space-y-0.5">
      <div className="flex items-center gap-1">
        <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
          <motion.div
            className="h-full rounded-sm"
            style={{ backgroundColor: barColor }}
            initial={{ opacity: 0, width: '0%' }}
            animate={{ opacity: 1, width: `${currentPct}%` }}
            transition={{ ...BASE_ANIM, width: { duration: 0.35 }, delay }}
          />
        </div>
        <span className="text-[8px] tabular-nums" style={{ color: barColor }}>
          {current}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
          <motion.div
            className="h-full rounded-sm bg-[#8b949e]"
            initial={{ opacity: 0, width: '0%' }}
            animate={{ opacity: 0.5, width: `${avgPct}%` }}
            transition={{ ...BASE_ANIM, width: { duration: 0.35 }, delay: delay + 0.05 }}
          />
        </div>
        <span className="text-[8px] text-[#8b949e] tabular-nums">{average.toFixed(1)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[7px] text-[#484f58]">Now</span>
        <span className="text-[7px] text-[#484f58]">Avg/season</span>
      </div>
    </div>
  );
}

// ── Milestone Definition ────────────────────────────────────
interface Milestone {
  id: string;
  label: string;
  achieved: boolean;
  season?: number;
  week?: number;
  icon: React.ReactNode;
}

// ── All-Time Best Definition ────────────────────────────────
interface AllTimeBest {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}

// ── Legend Tier Definition ──────────────────────────────────
interface LegendTier {
  name: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const LEGEND_TIERS: LegendTier[] = [
  { name: 'Bronze', min: 0, max: 100, color: '#cd7f32', bgColor: 'rgba(205,127,50,0.15)', icon: <Medal className="h-5 w-5" /> },
  { name: 'Silver', min: 100, max: 300, color: '#c0c0c0', bgColor: 'rgba(192,192,192,0.15)', icon: <Shield className="h-5 w-5" /> },
  { name: 'Gold', min: 300, max: 500, color: '#ffd700', bgColor: 'rgba(255,215,0,0.15)', icon: <TrophyIcon className="h-5 w-5" /> },
  { name: 'Diamond', min: 500, max: 800, color: '#60a5fa', bgColor: 'rgba(96,165,250,0.15)', icon: <Diamond className="h-5 w-5" /> },
  { name: 'Legend', min: 800, max: 10000, color: '#34d399', bgColor: 'rgba(52,211,153,0.15)', icon: <Crown className="h-5 w-5" /> },
];

// ── Hall of Fame Inductee ────────────────────────────────
interface HofInductee {
  name: string;
  nationality: string;
  flag: string;
  position: string;
  yearsActive: string;
  highlights: string[];
  trophyCount: number;
  inductionYear: number;
  tier: 'Legend' | 'Icon' | 'Great';
}

// ── Club Record ──────────────────────────────────────────
interface ClubRecord {
  label: string;
  holder: string;
  value: string;
  playerValue: number;
  recordValue: number;
  playerRank: number;
  icon: React.ReactNode;
}

// ── Legacy Category ──────────────────────────────────────
interface LegacyCategory {
  name: string;
  score: number;
  percentage: number;
}

// ── Moment of Glory ──────────────────────────────────────
interface MomentOfGlory {
  title: string;
  date: string;
  description: string;
  matchContext: string;
  impact: number;
  color: string;
}

// ── Fan Tribute ──────────────────────────────────────────
interface FanTributeData {
  messages: string[];
  approvalRating: number;
  chant: string;
  followers: string;
}

// ── Main Component ──────────────────────────────────────────
export default function HallOfFame() {
  const gameState = useGameStore((s) => s.gameState);

  const computed = useMemo(() => {
    if (!gameState) return null;
    const { player, seasons, recentResults, currentSeason, seasonAwards } =
      gameState;

    // ── Hero Section Data ──────────────────────────────────
    const careerSpan = `Season ${seasons.length > 0 ? seasons[0].number : 1} → Season ${currentSeason}`;
    const careerValue = player.marketValue;

    // ── Career Records (from seasons + recentResults) ──────
    const totalGoals = player.careerStats.totalGoals;
    const totalAssists = player.careerStats.totalAssists;
    const totalAppearances = player.careerStats.totalAppearances;
    const totalSeasons = player.careerStats.seasonsPlayed || currentSeason;

    // Ratings
    const playedResults = recentResults.filter((r) => r.playerRating > 0);
    const bestRating =
      playedResults.length > 0
        ? Math.max(...playedResults.map((r) => r.playerRating))
        : 0;
    const worstRating =
      playedResults.length > 0
        ? Math.min(...playedResults.map((r) => r.playerRating))
        : 0;

    // Current season stats for comparison
    const currentSeasonGoals = player.seasonStats.goals;
    const currentSeasonAssists = player.seasonStats.assists;
    const goalAvgPerSeason = totalSeasons > 0 ? totalGoals / Math.max(totalSeasons, 1) : 0;
    const assistAvgPerSeason = totalSeasons > 0 ? totalAssists / Math.max(totalSeasons, 1) : 0;

    // Highest scoring season
    const allSeasonGoalData = seasons.map((s) => ({
      season: s.number,
      goals: s.playerStats.goals,
      clubName: s.playerStats.goals > 0 ? '' : '',
    }));
    const highestScoringSeason =
      allSeasonGoalData.length > 0
        ? allSeasonGoalData.reduce(
            (best, s) => (s.goals > best.goals ? s : best),
            allSeasonGoalData[0]
          )
        : { season: currentSeason, goals: currentSeasonGoals };

    // Most appearances season
    const allSeasonAppData = seasons.map((s) => ({
      season: s.number,
      apps: s.playerStats.appearances,
    }));
    const mostAppsSeason =
      allSeasonAppData.length > 0
        ? allSeasonAppData.reduce(
            (best, s) => (s.apps > best.apps ? s : best),
            allSeasonAppData[0]
          )
        : { season: currentSeason, apps: player.seasonStats.appearances };

    // Longest win streak
    let longestWinStreak = 0;
    let currentWinStreak = 0;
    for (const r of [...recentResults].reverse()) {
      const isHome = r.homeClub.name === gameState.currentClub.name;
      const won = isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
      if (won) {
        currentWinStreak++;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
      } else {
        currentWinStreak = 0;
      }
    }

    // Longest scoreless streak
    let longestScorelessStreak = 0;
    let currentScorelessStreak = 0;
    for (const r of [...recentResults].reverse()) {
      if (r.playerGoals === 0 && r.playerMinutesPlayed > 0) {
        currentScorelessStreak++;
        longestScorelessStreak = Math.max(
          longestScorelessStreak,
          currentScorelessStreak
        );
      } else if (r.playerGoals > 0) {
        currentScorelessStreak = 0;
      }
    }

    // Total trophies and clean sheets
    const trophies: Trophy[] = player.careerStats.trophies ?? [];
    const cleanSheets = player.careerStats.totalCleanSheets;

    // ── Season-by-Season Table ────────────────────────────
    const currentPos =
      gameState.leagueTable.findIndex(
        (e) => e.clubId === gameState.currentClub.id
      ) + 1;

    const allSeasonRows = [
      ...seasons.map((s) => ({
        number: s.number,
        club: gameState.currentClub.name,
        clubLogo: gameState.currentClub.logo,
        apps: s.playerStats.appearances,
        goals: s.playerStats.goals,
        assists: s.playerStats.assists,
        avgRating: s.playerStats.averageRating,
        leaguePosition: s.leaguePosition,
      })),
      {
        number: currentSeason,
        club: gameState.currentClub.name,
        clubLogo: gameState.currentClub.logo,
        apps: player.seasonStats.appearances,
        goals: player.seasonStats.goals,
        assists: player.seasonStats.assists,
        avgRating: player.seasonStats.averageRating,
        leaguePosition: currentPos || 0,
      },
    ];

    // Best season = most goals with decent rating
    const bestSeasonIdx = allSeasonRows.reduce(
      (bestIdx, row, i) =>
        row.goals > allSeasonRows[bestIdx].goals ? i : bestIdx,
      0
    );

    // ── Trophy Cabinet ────────────────────────────────────
    const playerTrophies = trophies;

    // ── Achievement Progress ──────────────────────────────
    const achievements = gameState.achievements;
    const unlockedCount = achievements.filter((a) => a.unlocked).length;
    const totalCount = achievements.length;
    const recentUnlocked = achievements
      .filter((a) => a.unlocked)
      .slice(-3)
      .reverse();
    const remainingCount = totalCount - unlockedCount;

    // ── Legend Score ───────────────────────────────────────
    const intlCareer = gameState.internationalCareer;
    const intlCaps = intlCareer.caps;
    const legendScore = Math.min(1000,
      totalGoals * 10 +
      totalAssists * 7 +
      trophies.length * 50 +
      unlockedCount * 20 +
      totalSeasons * 30 +
      intlCaps * 15
    );
    const currentTier = LEGEND_TIERS.reduce(
      (tier, t) => legendScore >= t.min ? t : tier,
      LEGEND_TIERS[0]
    );
    const nextTierIdx = LEGEND_TIERS.findIndex((t) => t.name === currentTier.name) + 1;
    const nextTier = nextTierIdx < LEGEND_TIERS.length ? LEGEND_TIERS[nextTierIdx] : null;
    const pointsToNext = nextTier ? nextTier.min - legendScore : 0;

    // ── Career Journey (clubs from season rows) ───────────
    const clubJourney: { clubName: string; clubLogo: string; fromSeason: number; toSeason: number; isCurrent: boolean }[] = [];
    const seenClubs = new Set<string>();
    const sortedRows = [...allSeasonRows].sort((a, b) => a.number - b.number);
    for (const row of sortedRows) {
      const key = `${row.club}-${row.clubLogo}`;
      if (!seenClubs.has(key)) {
        seenClubs.add(key);
        const clubRows = sortedRows.filter(r => r.club === row.club && r.clubLogo === row.clubLogo);
        clubJourney.push({
          clubName: row.club,
          clubLogo: row.clubLogo,
          fromSeason: clubRows[0].number,
          toSeason: clubRows[clubRows.length - 1].number,
          isCurrent: row.club === gameState.currentClub.name && row.clubLogo === gameState.currentClub.logo,
        });
      }
    }

    // ── Career Milestones ─────────────────────────────────
    const milestones: Milestone[] = [];

    // First goal
    const firstGoalMatch = recentResults.find(
      (r) => r.playerGoals > 0
    );
    const firstGoalFromSeasons = seasons.find(
      (s) => s.playerStats.goals > 0
    );
    milestones.push({
      id: 'first_goal',
      label: 'First Career Goal',
      achieved: !!(firstGoalMatch || firstGoalFromSeasons || player.careerStats.totalGoals > 0),
      season: firstGoalMatch?.season ?? firstGoalFromSeasons?.number,
      week: firstGoalMatch?.week,
      icon: <Target className="h-3.5 w-3.5" />,
    });

    // First hat-trick (3+ goals in a match)
    const firstHatTrick = recentResults.find(
      (r) => r.playerGoals >= 3
    );
    milestones.push({
      id: 'hat_trick',
      label: 'First Hat-trick',
      achieved: !!firstHatTrick,
      season: firstHatTrick?.season,
      week: firstHatTrick?.week,
      icon: <Flame className="h-3.5 w-3.5" />,
    });

    // First 10-goal season
    const firstTenGoalSeason = allSeasonRows.find((s) => s.goals >= 10);
    milestones.push({
      id: 'ten_goal_season',
      label: 'First 10-Goal Season',
      achieved: !!firstTenGoalSeason,
      season: firstTenGoalSeason?.number,
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    });

    // First trophy
    const firstTrophy = trophies.length > 0 ? trophies[0] : null;
    milestones.push({
      id: 'first_trophy',
      label: 'First Trophy',
      achieved: !!firstTrophy,
      season: firstTrophy?.season,
      icon: <TrophyIcon className="h-3.5 w-3.5" />,
    });

    // First international call-up
    const hasBeenCalledUp = intlCareer.lastCallUpSeason > 0;
    milestones.push({
      id: 'international',
      label: 'First International Call-up',
      achieved: hasBeenCalledUp,
      season: hasBeenCalledUp ? intlCareer.lastCallUpSeason : undefined,
      week: hasBeenCalledUp ? intlCareer.lastCallUpWeek : undefined,
      icon: <Shield className="h-3.5 w-3.5" />,
    });

    // 50th appearance
    milestones.push({
      id: 'fifty_apps',
      label: '50th Appearance',
      achieved: totalAppearances >= 50,
      icon: <Calendar className="h-3.5 w-3.5" />,
    });

    // 100th appearance
    milestones.push({
      id: 'hundred_apps',
      label: '100th Appearance',
      achieved: totalAppearances >= 100,
      icon: <Crown className="h-3.5 w-3.5" />,
    });

    // ── All-Time Bests ────────────────────────────────────
    const allTimeBests: AllTimeBest[] = [];

    // Best Match (highest rating)
    if (playedResults.length > 0) {
      const bestMatch = playedResults.reduce((best, r) =>
        r.playerRating > best.playerRating ? r : best
      );
      allTimeBests.push({
        label: 'Best Match Rating',
        value: bestMatch.playerRating.toFixed(1),
        detail: `vs ${bestMatch.awayClub.shortName} · ${bestMatch.competition} · ${bestMatch.homeScore}-${bestMatch.awayScore}`,
        icon: <Star className="h-3.5 w-3.5" />,
      });
    }

    // Biggest Win (largest goal difference for player's team)
    const wins = recentResults.filter((r) => {
      const isHome = r.homeClub.name === gameState.currentClub.name;
      return isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
    });
    if (wins.length > 0) {
      const biggestWin = wins.reduce((best, r) => {
        const gd = Math.abs(r.homeScore - r.awayScore);
        const bestGd = Math.abs(best.homeScore - best.awayScore);
        return gd > bestGd ? r : best;
      });
      allTimeBests.push({
        label: 'Biggest Win',
        value: `${biggestWin.homeScore}-${biggestWin.awayScore}`,
        detail: `vs ${biggestWin.awayClub.name === gameState.currentClub.name ? biggestWin.homeClub.shortName : biggestWin.awayClub.shortName} · ${biggestWin.competition}`,
        icon: <ArrowUp className="h-3.5 w-3.5" />,
      });
    }

    // Most Goals in a Match
    const mostGoalsMatch = recentResults.length > 0
      ? recentResults.reduce((best, r) =>
          r.playerGoals > best.playerGoals ? r : best
        )
      : null;
    if (mostGoalsMatch && mostGoalsMatch.playerGoals > 0) {
      allTimeBests.push({
        label: 'Most Goals in a Match',
        value: `${mostGoalsMatch.playerGoals} goal${mostGoalsMatch.playerGoals > 1 ? 's' : ''}`,
        detail: `vs ${mostGoalsMatch.awayClub.shortName} · ${mostGoalsMatch.competition} · Season ${mostGoalsMatch.season}`,
        icon: <Zap className="h-3.5 w-3.5" />,
      });
    }

    // Most Assists in a Match
    const mostAssistsMatch = recentResults.length > 0
      ? recentResults.reduce((best, r) =>
          r.playerAssists > best.playerAssists ? r : best
        )
      : null;
    if (mostAssistsMatch && mostAssistsMatch.playerAssists > 0) {
      allTimeBests.push({
        label: 'Most Assists in a Match',
        value: `${mostAssistsMatch.playerAssists} assist${mostAssistsMatch.playerAssists > 1 ? 's' : ''}`,
        detail: `vs ${mostAssistsMatch.awayClub.shortName} · ${mostAssistsMatch.competition} · Season ${mostAssistsMatch.season}`,
        icon: <Swords className="h-3.5 w-3.5" />,
      });
    }

    // Longest Goal Streak
    let longestGoalStreak = 0;
    let currentGoalStreak = 0;
    for (const r of [...recentResults].reverse()) {
      if (r.playerGoals > 0) {
        currentGoalStreak++;
        longestGoalStreak = Math.max(longestGoalStreak, currentGoalStreak);
      } else {
        currentGoalStreak = 0;
      }
    }
    allTimeBests.push({
      label: 'Longest Goal Streak',
      value: `${longestGoalStreak} match${longestGoalStreak !== 1 ? 'es' : ''}`,
      detail:
        longestGoalStreak > 0
          ? 'Consecutive games scored'
          : 'No streak recorded',
      icon: <Footprints className="h-3.5 w-3.5" />,
    });

    // ── Hall of Fame Inductees ───────────────────────────
    const clubSeed = simpleHash(gameState.currentClub.name);
    const hofFirstNames: string[] = ['Marco', 'Carlos', 'Ahmed', 'James', 'Yuki', 'Luca', 'Omar', 'Patrick'];
    const hofLastNames: string[] = ['Rossi', 'Silva', 'Al-Farsi', 'Williams', 'Tanaka', 'Bianchi', 'Hassan', "O'Brien"];
    const hofNationalities: string[] = ['Italy', 'Brazil', 'Saudi Arabia', 'England', 'Japan', 'Italy', 'Egypt', 'Ireland'];
    const hofPositions: string[] = ['ST', 'CM', 'CB', 'LW', 'GK', 'CAM', 'RB', 'CDM'];
    const hofTiers: ('Legend' | 'Icon' | 'Great')[] = ['Legend', 'Icon', 'Icon', 'Great', 'Great', 'Great', 'Icon', 'Great'];
    const hofHighlights: string[][] = [
      ['All-time top scorer: 247 goals', 'Won 5 league titles', '3x Player of the Year'],
      ['Record 189 assists in 312 apps', 'Only player with 300+ appearances', 'Club captain for 8 seasons'],
      ['Defensive rock: 400+ clean sheets', 'Never received a red card', 'UCL Final MVP'],
      ['Fastest player in club history', 'Scored in 10 consecutive matches', 'Fan favorite for 12 seasons'],
      ['Most appearances: 450 games', 'Mr. Reliable in every role', 'Scored the derby winner twice'],
      ['Creative genius: 200+ assists', 'Set piece specialist', 'Scored 45-yard goal vs rivals'],
      ['Most trophies won: 12 total', 'Won the domestic double 3 times', 'Club ambassador after retiring'],
      ['Academy graduate turned legend', 'One-club man for 15 years', 'Scored on debut vs top opposition'],
    ];

    const hofInductees: HofInductee[] = [];
    for (let idx = 0; idx < 8; idx++) {
      const s = clubSeed + idx * 137;
      const startYear = 1990 + (s * 3) % 25;
      const endYear = startYear + 8 + (s * 2) % 12;
      hofInductees.push({
        name: `${hofFirstNames[s % hofFirstNames.length]} ${hofLastNames[(s + 7) % hofLastNames.length]}`,
        nationality: hofNationalities[(s + 3) % hofNationalities.length],
        flag: countryToFlag(hofNationalities[(s + 3) % hofNationalities.length]),
        position: hofPositions[(s + 11) % hofPositions.length],
        yearsActive: `${startYear}-${endYear}`,
        highlights: hofHighlights[idx],
        trophyCount: 1 + (s * 5) % 14,
        inductionYear: endYear + 2 + s % 5,
        tier: hofTiers[idx],
      });
    }

    // ── All-Time Records Board ───────────────────────────
    const recordHolders: string[] = ['Marco Rossi', 'Carlos Silva', 'Ahmed Al-Farsi', 'James Williams', 'Yuki Tanaka', 'Luca Bianchi', 'Omar Hassan', "Patrick O'Brien", 'Dimitri Petrov', 'Rafael Santos', 'Erik Lindberg', 'Samuel Okonkwo'];
    const allTimeRecords: ClubRecord[] = [
      { label: 'Most Goals', holder: recordHolders[0], value: `${150 + clubSeed % 100}`, playerValue: totalGoals, recordValue: 150 + clubSeed % 100, playerRank: totalGoals >= 150 + clubSeed % 100 ? 1 : totalGoals > 0 ? Math.max(2, Math.round((150 + clubSeed % 100) / Math.max(1, totalGoals))) : 0, icon: <Target className="h-3.5 w-3.5" /> },
      { label: 'Most Assists', holder: recordHolders[1], value: `${120 + (clubSeed + 1) % 80}`, playerValue: totalAssists, recordValue: 120 + (clubSeed + 1) % 80, playerRank: totalAssists >= 120 + (clubSeed + 1) % 80 ? 1 : totalAssists > 0 ? Math.max(2, Math.round((120 + (clubSeed + 1) % 80) / Math.max(1, totalAssists))) : 0, icon: <Swords className="h-3.5 w-3.5" /> },
      { label: 'Most Appearances', holder: recordHolders[2], value: `${400 + (clubSeed + 2) % 100}`, playerValue: totalAppearances, recordValue: 400 + (clubSeed + 2) % 100, playerRank: totalAppearances >= 400 + (clubSeed + 2) % 100 ? 1 : totalAppearances > 0 ? Math.max(2, Math.round((400 + (clubSeed + 2) % 100) / Math.max(1, totalAppearances))) : 0, icon: <Calendar className="h-3.5 w-3.5" /> },
      { label: 'Most Trophies', holder: recordHolders[3], value: `${12 + (clubSeed + 3) % 8}`, playerValue: trophies.length, recordValue: 12 + (clubSeed + 3) % 8, playerRank: trophies.length >= 12 + (clubSeed + 3) % 8 ? 1 : Math.max(2, (12 + (clubSeed + 3) % 8) - trophies.length + 1), icon: <TrophyIcon className="h-3.5 w-3.5" /> },
      { label: 'Highest Avg Rating', holder: recordHolders[4], value: `${(8.0 + (clubSeed + 4) % 15 / 100).toFixed(2)}`, playerValue: bestRating, recordValue: 8.0 + (clubSeed + 4) % 15 / 100, playerRank: bestRating >= 8.0 ? 1 : bestRating > 0 ? Math.max(2, Math.round(8.0 / Math.max(0.1, bestRating) * 3)) : 0, icon: <Star className="h-3.5 w-3.5" /> },
      { label: 'Most MotM Awards', holder: recordHolders[5], value: `${35 + (clubSeed + 5) % 20}`, playerValue: 0, recordValue: 35 + (clubSeed + 5) % 20, playerRank: 0, icon: <Flame className="h-3.5 w-3.5" /> },
      { label: 'Longest Unbeaten', holder: recordHolders[6], value: `${18 + (clubSeed + 6) % 15} matches`, playerValue: longestWinStreak, recordValue: 18 + (clubSeed + 6) % 15, playerRank: longestWinStreak > 0 ? Math.max(2, Math.round((18 + (clubSeed + 6) % 15) / Math.max(1, longestWinStreak))) : 0, icon: <Shield className="h-3.5 w-3.5" /> },
      { label: 'Most Clean Sheets', holder: recordHolders[7], value: `${80 + (clubSeed + 7) % 60}`, playerValue: cleanSheets, recordValue: 80 + (clubSeed + 7) % 60, playerRank: cleanSheets > 0 ? (cleanSheets >= 80 + (clubSeed + 7) % 60 ? 1 : Math.max(2, Math.round((80 + (clubSeed + 7) % 60) / Math.max(1, cleanSheets)))) : 0, icon: <Medal className="h-3.5 w-3.5" /> },
      { label: 'Youngest Debut', holder: recordHolders[8], value: `${16 + (clubSeed + 8) % 3}y`, playerValue: 0, recordValue: 16 + (clubSeed + 8) % 3, playerRank: 0, icon: <User className="h-3.5 w-3.5" /> },
      { label: 'Oldest Appearance', holder: recordHolders[9], value: `${38 + (clubSeed + 9) % 4}y`, playerValue: 0, recordValue: 38 + (clubSeed + 9) % 4, playerRank: 0, icon: <Timer className="h-3.5 w-3.5" /> },
      { label: 'Most Red Cards', holder: recordHolders[10], value: `${10 + (clubSeed + 10) % 8}`, playerValue: 0, recordValue: 10 + (clubSeed + 10) % 8, playerRank: 0, icon: <Lock className="h-3.5 w-3.5" /> },
      { label: 'Fastest Hat-Trick', holder: recordHolders[11], value: `${8 + (clubSeed + 11) % 10} min`, playerValue: 0, recordValue: 8 + (clubSeed + 11) % 10, playerRank: 0, icon: <Zap className="h-3.5 w-3.5" /> },
    ];

    // ── Career Legacy Score ──────────────────────────────
    const goalLegacy = Math.min(100, totalGoals * 2);
    const playLegacy = Math.min(100, totalAssists * 2.5);
    const leadLegacy = Math.min(100, totalAppearances * 0.25 + trophies.length * 10);
    const tropLegacy = Math.min(100, trophies.length * 12);
    const intlLegacy = Math.min(100, intlCaps * 5);
    const loyaltyLegacy = Math.min(100, totalSeasons * 8);
    const legacyCategories: LegacyCategory[] = [
      { name: 'Goalscoring Legacy', score: goalLegacy, percentage: goalLegacy },
      { name: 'Playmaking Legacy', score: playLegacy, percentage: playLegacy },
      { name: 'Leadership Legacy', score: Math.min(100, leadLegacy), percentage: Math.min(100, leadLegacy) },
      { name: 'Trophy Legacy', score: tropLegacy, percentage: tropLegacy },
      { name: 'International Legacy', score: intlLegacy, percentage: intlLegacy },
      { name: 'Club Loyalty Legacy', score: loyaltyLegacy, percentage: loyaltyLegacy },
    ];
    const legacyOverall = Math.round(goalLegacy * 0.25 + playLegacy * 0.2 + leadLegacy * 0.15 + tropLegacy * 0.2 + intlLegacy * 0.1 + loyaltyLegacy * 0.1);
    let legacyTier: string;
    let legacyTierColor: string;
    if (legacyOverall >= 80) { legacyTier = 'Club Legend'; legacyTierColor = '#34d399'; }
    else if (legacyOverall >= 60) { legacyTier = 'Fan Favorite'; legacyTierColor = '#f59e0b'; }
    else if (legacyOverall >= 40) { legacyTier = 'Cult Hero'; legacyTierColor = '#a78bfa'; }
    else if (legacyOverall >= 20) { legacyTier = 'Squad Player'; legacyTierColor = '#3b82f6'; }
    else { legacyTier = 'Newcomer'; legacyTierColor = '#8b949e'; }

    // ── Career Moments of Glory ──────────────────────────
    const momentsOfGlory: MomentOfGlory[] = [
      { title: 'Debut Goal', date: `Season 1, Week 3`, description: totalGoals > 0 ? `${player.name} announced their arrival with a clinical finish on debut.` : `The debut match that started it all for ${player.name}.`, matchContext: `${gameState.currentClub.name} vs League Rivals`, impact: totalGoals > 0 ? 4 : 3, color: '#34d399' },
      { title: 'First Trophy Lift', date: trophies.length > 0 ? `Season ${Math.min(currentSeason, 3)}` : '—', description: trophies.length > 0 ? 'The moment silverware was lifted for the first time.' : 'Trophy glory still awaits in the future.', matchContext: trophies.length > 0 ? 'Domestic Cup Final' : '—', impact: trophies.length > 0 ? 5 : 1, color: '#f59e0b' },
      { title: 'Record-Breaking Night', date: totalGoals >= 50 ? `Season ${Math.min(currentSeason, 5)}` : '—', description: totalGoals >= 50 ? `${player.name} shattered expectations with a historic performance.` : 'Records are waiting to be broken.', matchContext: totalGoals >= 50 ? 'Championship Decider' : '—', impact: totalGoals >= 50 ? 5 : 1, color: '#ef4444' },
      { title: 'Derby Day Hero', date: `Season ${1 + currentSeason % 4}`, description: totalGoals > 0 ? `${player.name} wrote their name into derby folklore.` : 'Every great player needs a derby moment.', matchContext: 'City Derby', impact: totalGoals > 10 ? 4 : 2, color: '#3b82f6' },
      { title: 'European Night', date: `Season ${2 + currentSeason % 3}`, description: bestRating >= 7.0 ? 'A masterclass under the European floodlights.' : 'European stages await the next chapter.', matchContext: bestRating >= 7.0 ? 'Continental Quarter-Final' : '—', impact: bestRating >= 7.0 ? 5 : 2, color: '#a78bfa' },
      { title: 'Final Whistle', date: `Season ${currentSeason}`, description: `The current chapter continues. ${player.name} has ${totalGoals} goals and ${trophies.length} trophies so far.`, matchContext: 'Career in progress', impact: Math.min(5, Math.max(1, Math.floor(totalGoals / 20))), color: '#8b949e' },
    ];

    // ── Fan Tribute ──────────────────────────────────────
    const fanHash = simpleHash(player.name + gameState.currentClub.name);
    const fanMessages: string[] = [
      `${player.name} is the heartbeat of this team. Every match, every tackle, every goal. Pure passion!`,
      `I've supported ${gameState.currentClub.name} for 30 years and ${player.name} is among the best I've seen wear the shirt.`,
      `When ${player.name} gets the ball, you can feel the electricity in the stadium. Special player.`,
      `My kids' first hero is ${player.name}. That says everything about the impact on and off the pitch.`,
      `${player.name} doesn't just play for ${gameState.currentClub.name} — they ARE ${gameState.currentClub.name}. A true legend in the making.`,
    ];
    const fanApprovalRating = Math.min(100, Math.max(15, Math.round(legendScore / 10 + totalGoals / 2 + trophies.length * 5)));
    const fanFollowersRaw = Math.max(1000, totalGoals * 12500 + trophies.length * 250000 + legendScore * 5000);
    const fanFollowersStr = fanFollowersRaw >= 1_000_000 ? `${(fanFollowersRaw / 1_000_000).toFixed(1)}M` : fanFollowersRaw >= 1000 ? `${(fanFollowersRaw / 1000).toFixed(0)}K` : `${fanFollowersRaw}`;
    const fanChant = `Oh, ${player.name}, ${player.name}\nRunning down the wing for ${gameState.currentClub.name}\nGoals and glory, heart and soul\nYou're the one who makes us whole!`;
    const fanTribute: FanTributeData = {
      messages: fanMessages.slice(0, 4 + fanHash % 2),
      approvalRating: fanApprovalRating,
      chant: fanChant,
      followers: fanFollowersStr,
    };

    return {
      // Hero
      careerSpan,
      careerValue,
      // Records
      totalGoals,
      totalAssists,
      totalAppearances,
      totalSeasons,
      bestRating,
      worstRating,
      highestScoringSeason,
      mostAppsSeason,
      longestWinStreak,
      longestScorelessStreak,
      trophies,
      cleanSheets,
      currentSeasonGoals,
      currentSeasonAssists,
      goalAvgPerSeason,
      assistAvgPerSeason,
      // Season table
      allSeasonRows,
      bestSeasonIdx,
      // Trophies
      playerTrophies,
      // Achievements
      unlockedCount,
      totalCount,
      recentUnlocked,
      remainingCount,
      // Legend
      legendScore,
      currentTier,
      nextTier,
      pointsToNext,
      intlCaps,
      hasBeenCalledUp,
      // Journey
      clubJourney,
      // Milestones
      milestones,
      // All-time bests
      allTimeBests,
      // Awards
      seasonAwards,
      // Hall of Fame
      hofInductees,
      allTimeRecords,
      legacyOverall,
      legacyCategories,
      legacyTier,
      legacyTierColor,
      momentsOfGlory,
      fanTribute,
    };
  }, [gameState]);

  if (!gameState || !computed) return null;

  const {
    player,
    currentSeason,
    currentClub,
  } = gameState;
  const {
    careerSpan,
    careerValue,
    totalGoals,
    totalAssists,
    totalAppearances,
    totalSeasons,
    bestRating,
    worstRating,
    highestScoringSeason,
    mostAppsSeason,
    longestWinStreak,
    longestScorelessStreak,
    trophies,
    cleanSheets,
    currentSeasonGoals,
    currentSeasonAssists,
    goalAvgPerSeason,
    assistAvgPerSeason,
    allSeasonRows,
    bestSeasonIdx,
    playerTrophies,
    unlockedCount,
    totalCount,
    recentUnlocked,
    remainingCount,
    legendScore,
    currentTier,
    nextTier,
    pointsToNext,
    intlCaps,
    hasBeenCalledUp,
    clubJourney,
    milestones,
    allTimeBests,
    seasonAwards,
    hofInductees,
    allTimeRecords,
    legacyOverall,
    legacyCategories,
    legacyTier,
    legacyTierColor,
    momentsOfGlory,
    fanTribute,
  } = computed;

  const flag = countryToFlag(player.nationality);
  const posColor = getPositionColor(player.position);
  const ovr = player.overall;
  const ovrColor = getOvrColor(ovr);
  const ovrPct = Math.max(0, Math.min(100, ((ovr - 40) / 60) * 100));
  const ovrCircumference = 2 * Math.PI * 32;
  const ovrDashoffset = ovrCircumference - (ovrPct / 100) * ovrCircumference;

  // Club initials from logo emoji
  const clubInitials = currentClub.shortName.slice(0, 3).toUpperCase();
  const clubPrimary = currentClub.primaryColor || '#30363d';

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-6">

        {/* ═══════════════════ 1. ENHANCED HERO CARD ═══════════════════ */}
        <motion.div
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={BASE_ANIM}
        >
          <div className="flex items-start gap-4">
            {/* OVR Badge + Club Logo Column */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              {/* OVR Badge with SVG ring */}
              <div className="relative" style={{ width: 72, height: 72 }}>
                <svg width="72" height="72" viewBox="0 0 72 72" className="absolute inset-0">
                  {/* Background circle */}
                  <circle
                    cx="36" cy="36" r="32"
                    fill="none"
                    stroke="#21262d"
                    strokeWidth="4"
                  />
                  {/* Progress arc */}
                  <motion.circle
                    cx="36" cy="36" r="32"
                    fill="none"
                    stroke={posColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={ovrCircumference}
                    initial={{ opacity: 0, strokeDashoffset: ovrCircumference }}
                    animate={{ opacity: 1, strokeDashoffset: ovrDashoffset }}
                    transition={{ ...BASE_ANIM, strokeDashoffset: { duration: 0.5 } }}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-medium text-[#8b949e]">OVR</span>
                  <span className="text-xl font-black tabular-nums" style={{ color: ovrColor }}>
                    {ovr}
                  </span>
                </div>
              </div>

              {/* Club Logo placeholder */}
              <div
                className="w-9 h-9 flex items-center justify-center border border-[#30363d] text-[10px] font-bold text-white"
                style={{ backgroundColor: clubPrimary, borderRadius: 6 }}
              >
                {clubInitials}
              </div>
            </div>

            {/* Info Column */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Name + YOU badge */}
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#c9d1d9] truncate">
                  {player.name}
                </h1>
                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" style={{ borderRadius: 4 }}>
                  YOU
                </span>
              </div>

              {/* Flag + Position Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base">{flag}</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 text-white"
                  style={{ backgroundColor: posColor, borderRadius: 4 }}
                >
                  {player.position}
                </span>
                <span className="text-[10px] text-[#8b949e]">
                  {player.nationality}
                </span>
              </div>

              {/* Badges row: Career Span + Market Value */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-1 bg-[#21262d] border border-[#30363d] text-[#8b949e]" style={{ borderRadius: 4 }}>
                  <Calendar className="h-2.5 w-2.5" />
                  {careerSpan}
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-1 bg-[#21262d] border border-[#30363d] text-amber-400 font-bold" style={{ borderRadius: 4 }}>
                  <Gem className="h-2.5 w-2.5" />
                  {formatValue(careerValue)}
                </span>
              </div>

              {/* International Caps Badge */}
              {hasBeenCalledUp && (
                <motion.div
                  className="inline-flex items-center gap-1.5 text-[9px] px-2 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...BASE_ANIM, delay: 0.1 }}
                  style={{ borderRadius: 4 }}
                >
                  <Shield className="h-2.5 w-2.5" />
                  {intlCaps} Cap{intlCaps !== 1 ? 's' : ''}
                  {gameState.internationalCareer.goals > 0 && ` · ${gameState.internationalCareer.goals}G`}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════ 2. LEGEND STATUS CARD ═══════════════════ */}
        <section>
          <SectionHeader
            title="Legend Status"
            icon={<Crown className="h-4 w-4" />}
            delay={SEC_DELAY}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY + ITEM_DELAY }}
          >
            {/* Tier Badge + Score */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: currentTier.bgColor, borderRadius: 8 }}
              >
                <span style={{ color: currentTier.color }}>{currentTier.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#c9d1d9]">{currentTier.name}</span>
                  <span className="text-[10px] text-[#8b949e]">Tier</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tabular-nums" style={{ color: currentTier.color }}>
                    {legendScore}
                  </span>
                  <span className="text-[10px] text-[#8b949e]">/ 1000 pts</span>
                </div>
              </div>
            </div>

            {/* Tier Progress Bar */}
            <div className="space-y-1">
              {/* Tier segments visual */}
              <div className="flex gap-0.5 h-2">
                {LEGEND_TIERS.map((tier) => {
                  const segmentPct = tier.max === 10000
                    ? Math.max(0, Math.min(100, ((Math.min(legendScore, 1000) - tier.min) / (Math.min(1000, tier.max) - tier.min)) * 100))
                    : Math.max(0, Math.min(100, ((Math.min(legendScore, tier.max) - tier.min) / (tier.max - tier.min)) * 100));
                  const isReached = legendScore >= tier.min;
                  return (
                    <motion.div
                      key={tier.name}
                      className="flex-1 overflow-hidden rounded-sm"
                      style={{ backgroundColor: '#21262d' }}
                    >
                      <motion.div
                        className="h-full rounded-sm"
                        style={{ backgroundColor: isReached ? tier.color : '#21262d' }}
                        initial={{ opacity: 0, width: '0%' }}
                        animate={{ opacity: isReached ? 0.7 : 0, width: `${isReached ? 100 : 0}%` }}
                        transition={{ ...BASE_ANIM, width: { duration: 0.4 } }}
                      />
                    </motion.div>
                  );
                })}
              </div>
              {/* Tier labels */}
              <div className="flex justify-between">
                {LEGEND_TIERS.map((tier) => {
                  const isActive = currentTier.name === tier.name;
                  return (
                    <span
                      key={tier.name}
                      className="text-[7px] font-medium"
                      style={{ color: isActive ? tier.color : '#484f58' }}
                    >
                      {tier.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Next Tier Info */}
            {nextTier && (
              <div className="flex items-center justify-between p-2 bg-[#21262d] border border-[#30363d]" style={{ borderRadius: 6 }}>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-[#8b949e]" />
                  <span className="text-[10px] text-[#8b949e]">
                    Next: <span className="font-bold" style={{ color: nextTier.color }}>{nextTier.name}</span>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#c9d1d9] tabular-nums">
                  {pointsToNext} pts needed
                </span>
              </div>
            )}

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#30363d]">
              {[
                { label: 'Goals', pts: totalGoals * 10, max: totalGoals },
                { label: 'Assists', pts: totalAssists * 7, max: totalAssists },
                { label: 'Trophies', pts: trophies.length * 50, max: trophies.length },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-[9px] text-[#484f58]">{item.label}</p>
                  <p className="text-xs font-bold text-[#c9d1d9] tabular-nums">{item.pts}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════ 3. CAREER RECORDS GRID ═══════════════════ */}
        <section>
          <SectionHeader
            title="Career Records"
            icon={<Award className="h-4 w-4" />}
            delay={SEC_DELAY * 2}
          />
          <div className="grid grid-cols-2 gap-3">
            <RecordCard
              icon={<Target className="h-4 w-4" />}
              value={totalGoals}
              label="Total Goals"
              color="text-emerald-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY}
              miniChart={totalGoals > 0 ? (
                <MiniBarChart
                  current={currentSeasonGoals}
                  average={goalAvgPerSeason}
                  delay={SEC_DELAY * 2 + ITEM_DELAY + 0.15}
                />
              ) : undefined}
            />
            <RecordCard
              icon={<Swords className="h-4 w-4" />}
              value={totalAssists}
              label="Total Assists"
              color="text-cyan-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 2}
              miniChart={totalAssists > 0 ? (
                <MiniBarChart
                  current={currentSeasonAssists}
                  average={assistAvgPerSeason}
                  delay={SEC_DELAY * 2 + ITEM_DELAY * 2 + 0.15}
                />
              ) : undefined}
            />
            <RecordCard
              icon={<Calendar className="h-4 w-4" />}
              value={totalAppearances}
              label="Total Appearances"
              color="text-sky-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 3}
            />
            <RecordCard
              icon={<Shield className="h-4 w-4" />}
              value={totalSeasons}
              label="Total Seasons"
              color="text-violet-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 4}
            />
            <RecordCard
              icon={<Star className="h-4 w-4" />}
              value={bestRating > 0 ? bestRating.toFixed(1) : '-'}
              label="Best Rating"
              color="text-emerald-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 5}
            />
            <RecordCard
              icon={<TrendingUp className="h-4 w-4" />}
              value={worstRating > 0 ? worstRating.toFixed(1) : '-'}
              label="Worst Rating"
              color="text-red-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 6}
            />
            <RecordCard
              icon={<Flame className="h-4 w-4" />}
              value={`${highestScoringSeason.goals}`}
              label={`Best Season Goals (S${highestScoringSeason.season})`}
              color="text-orange-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 7}
            />
            <RecordCard
              icon={<Footprints className="h-4 w-4" />}
              value={`${mostAppsSeason.apps}`}
              label={`Most Apps Season (S${mostAppsSeason.season})`}
              color="text-blue-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 8}
            />
            <RecordCard
              icon={<ArrowUp className="h-4 w-4" />}
              value={longestWinStreak}
              label="Longest Win Streak"
              color="text-green-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 9}
            />
            <RecordCard
              icon={<Lock className="h-4 w-4" />}
              value={longestScorelessStreak}
              label="Longest Scoreless Run"
              color="text-red-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 10}
            />
            <RecordCard
              icon={<TrophyIcon className="h-4 w-4" />}
              value={trophies.length}
              label="Total Trophies"
              color="text-amber-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 11}
            />
            <RecordCard
              icon={<Medal className="h-4 w-4" />}
              value={cleanSheets}
              label="Clean Sheets"
              color="text-teal-400"
              delay={SEC_DELAY * 2 + ITEM_DELAY * 12}
            />
          </div>
        </section>

        {/* ═══════════════════ 4. SEASON-BY-SEASON TABLE ═══════════════════ */}
        <section>
          <SectionHeader
            title="Season-by-Season"
            icon={<Calendar className="h-4 w-4" />}
            delay={SEC_DELAY * 3}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 3 + ITEM_DELAY }}
          >
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-[#161b22] z-10">
                  <tr className="text-[#8b949e] border-b border-[#30363d]">
                    <th className="py-2 text-left pl-3 font-medium">#</th>
                    <th className="py-2 text-left font-medium">Club</th>
                    <th className="py-2 text-center font-medium">Apps</th>
                    <th className="py-2 text-center font-medium">G</th>
                    <th className="py-2 text-center font-medium">A</th>
                    <th className="py-2 text-center font-medium">Avg</th>
                    <th className="py-2 text-right pr-3 font-medium">Pos</th>
                  </tr>
                </thead>
                <tbody>
                  {allSeasonRows.map((row, i) => {
                    const isBest = i === bestSeasonIdx && row.goals > 0;
                    const ratingColor = getRatingColor(row.avgRating);
                    return (
                      <motion.tr
                        key={row.number}
                        className={`border-b border-[#30363d]/50 last:border-0 text-[#c9d1d9] ${
                          isBest ? 'border-l-2 border-l-emerald-500' : ''
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          ...BASE_ANIM,
                          delay: SEC_DELAY * 3 + ITEM_DELAY * 2 + i * ITEM_DELAY,
                        }}
                      >
                        <td className="py-2 pl-3 font-semibold tabular-nums">
                          {row.number}
                        </td>
                        <td className="py-2 truncate max-w-[80px]">
                          {row.club}
                        </td>
                        <td className="py-2 text-center tabular-nums">
                          {row.apps}
                        </td>
                        <td className="py-2 text-center tabular-nums text-emerald-400 font-semibold">
                          {row.goals}
                        </td>
                        <td className="py-2 text-center tabular-nums text-cyan-400">
                          {row.assists}
                        </td>
                        <td className="py-2 text-center">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold tabular-nums"
                            style={{
                              backgroundColor:
                                ratingColor === '#22c55e'
                                  ? 'rgba(34,197,94,0.15)'
                                  : ratingColor === '#f59e0b'
                                    ? 'rgba(245,158,11,0.15)'
                                    : 'rgba(239,68,68,0.15)',
                              color: ratingColor,
                            }}
                          >
                            {row.avgRating > 0 ? row.avgRating.toFixed(1) : '-'}
                          </span>
                        </td>
                        <td className="py-2 text-right pr-3 tabular-nums">
                          {ordinal(row.leaguePosition)}
                        </td>
                      </motion.tr>
                    );
                  })}
                  {allSeasonRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-6 text-center text-[#484f58] text-xs"
                      >
                        No season data yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════ 5. TROPHY CABINET ═══════════════════ */}
        <section>
          <SectionHeader
            title="Trophy Cabinet"
            icon={<TrophyIcon className="h-4 w-4" />}
            delay={SEC_DELAY * 4}
          />

          {/* Player Trophies */}
          {playerTrophies.length > 0 ? (
            <motion.div
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                ...BASE_ANIM,
                delay: SEC_DELAY * 4 + ITEM_DELAY,
              }}
            >
              {playerTrophies.map((t, i) => (
                <motion.div
                  key={`${t.name}-${t.season}`}
                  className="flex items-center gap-3 p-2.5 bg-[#21262d] rounded-lg border border-[#30363d]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    ...BASE_ANIM,
                    delay: SEC_DELAY * 4 + ITEM_DELAY * 2 + i * ITEM_DELAY,
                  }}
                >
                  <span className="text-amber-400">
                    <TrophyIcon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#c9d1d9] font-medium truncate">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-[#8b949e]">
                      Season {t.season}
                    </p>
                  </div>
                  <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                ...BASE_ANIM,
                delay: SEC_DELAY * 4 + ITEM_DELAY,
              }}
            >
              <TrophyIcon className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
              <p className="text-xs text-[#484f58]">No trophies yet</p>
              <p className="text-[10px] text-[#30363d] mt-1">
                Win competitions to add trophies here
              </p>
            </motion.div>
          )}

          {/* Season Awards */}
          {seasonAwards.length > 0 && (
            <div>
              <SectionHeader
                title="Season Awards"
                icon={<Medal className="h-3.5 w-3.5" />}
                delay={SEC_DELAY * 4 + ITEM_DELAY * 2}
              />
              <motion.div
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  ...BASE_ANIM,
                  delay: SEC_DELAY * 4 + ITEM_DELAY * 3,
                }}
              >
                {seasonAwards.map((award: SeasonAward, i: number) => {
                  const isPlayer = award.isPlayer;
                  return (
                    <motion.div
                      key={award.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                        isPlayer
                          ? 'bg-emerald-500/5 border-emerald-500/30'
                          : 'bg-[#21262d] border-[#30363d]'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        ...BASE_ANIM,
                        delay:
                          SEC_DELAY * 4 +
                          ITEM_DELAY * 4 +
                          i * ITEM_DELAY,
                      }}
                    >
                      <span
                        className={`${
                          isPlayer ? 'text-emerald-400' : 'text-[#8b949e]'
                        }`}
                      >
                        <Award className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium truncate ${
                            isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'
                          }`}
                        >
                          {award.name}
                        </p>
                        <p className="text-[10px] text-[#8b949e]">
                          Winner: {award.winner} · {award.stats}
                        </p>
                        <p className="text-[9px] text-[#484f58]">
                          {award.winnerClub} · Season {award.season}
                        </p>
                      </div>
                      {isPlayer && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          )}
        </section>

        {/* ═══════════════════ 6. CAREER JOURNEY TIMELINE ═══════════════════ */}
        <section>
          <SectionHeader
            title="Career Journey"
            icon={<MapPin className="h-4 w-4" />}
            delay={SEC_DELAY * 5}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 5 + ITEM_DELAY }}
          >
            {clubJourney.length <= 1 ? (
              <div className="text-center py-4">
                <User className="h-6 w-6 text-[#30363d] mx-auto mb-2" />
                <p className="text-xs text-[#484f58]">No transfers yet</p>
                <p className="text-[10px] text-[#30363d] mt-1">
                  Currently at {currentClub.name}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex items-center gap-0 min-w-max">
                  {clubJourney.map((club, i) => (
                    <motion.div
                      key={`${club.clubName}-${club.fromSeason}`}
                      className="flex items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        ...BASE_ANIM,
                        delay: SEC_DELAY * 5 + ITEM_DELAY * 2 + i * ITEM_DELAY,
                      }}
                    >
                      {/* Club Box */}
                      <div
                        className={`flex flex-col items-center gap-1.5 px-3 py-2 border ${
                          club.isCurrent
                            ? 'border-emerald-500 bg-emerald-500/5'
                            : 'border-[#30363d] bg-[#21262d]'
                        }`}
                        style={{ borderRadius: 6, minWidth: 72 }}
                      >
                        {/* Club Initials */}
                        <div
                          className="w-10 h-10 flex items-center justify-center text-xs font-bold text-white border border-white/10"
                          style={{ backgroundColor: currentClub.primaryColor, borderRadius: 6 }}
                        >
                          {club.clubName.slice(0, 3).toUpperCase()}
                        </div>
                        <span className="text-[9px] text-[#c9d1d9] font-medium text-center truncate max-w-[64px]">
                          {club.clubName}
                        </span>
                        <span className="text-[8px] text-[#8b949e] tabular-nums">
                          S{club.fromSeason}
                          {club.toSeason !== club.fromSeason ? `-S${club.toSeason}` : ''}
                        </span>
                        {club.isCurrent && (
                          <span className="text-[7px] font-bold text-emerald-400">Current</span>
                        )}
                      </div>

                      {/* Connector: dotted line + arrow */}
                      {i < clubJourney.length - 1 && (
                        <div className="flex flex-col items-center px-1.5">
                          <div className="w-8 border-t border-dashed border-[#30363d]" />
                          <ArrowRight className="h-2.5 w-2.5 text-[#484f58] -mt-1.5" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </section>

        {/* ═══════════════════ 7. ACHIEVEMENT PROGRESS ═══════════════════ */}
        <section>
          <SectionHeader
            title="Achievements"
            icon={<Zap className="h-4 w-4" />}
            delay={SEC_DELAY * 6}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 6 + ITEM_DELAY }}
          >
            {/* Progress header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#c9d1d9]">
                {unlockedCount}{' '}
                <span className="text-[#8b949e] font-normal">/</span>{' '}
                {totalCount} Unlocked
              </span>
              <span className="text-[10px] text-[#8b949e]">
                {remainingCount} remaining
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-[#21262d] rounded-sm overflow-hidden">
              <motion.div
                className="h-full rounded-sm bg-emerald-500"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%`,
                }}
                transition={{
                  ...BASE_ANIM,
                  width: { ...BASE_ANIM, duration: 0.4 },
                }}
              />
            </div>

            {/* Percentage */}
            <p className="text-[10px] text-[#8b949e] text-center">
              {totalCount > 0
                ? Math.round((unlockedCount / totalCount) * 100)
                : 0}
              % complete
            </p>

            {/* Recent 3 unlocked */}
            {recentUnlocked.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#30363d]">
                <p className="text-[10px] text-[#8b949e] font-medium">
                  Recently Unlocked
                </p>
                {recentUnlocked.map((ach, i) => (
                  <motion.div
                    key={ach.id}
                    className="flex items-center gap-2.5 p-2 bg-[#21262d] rounded-md border border-[#30363d]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      ...BASE_ANIM,
                      delay: SEC_DELAY * 6 + ITEM_DELAY * 2 + i * ITEM_DELAY,
                    }}
                  >
                    <span className="text-base">{ach.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#c9d1d9] font-medium truncate">
                        {ach.name}
                      </p>
                      <p className="text-[9px] text-[#8b949e] truncate">
                        {ach.description}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        ach.rarity === 'legendary'
                          ? 'bg-amber-500/15 text-amber-400'
                          : ach.rarity === 'epic'
                            ? 'bg-purple-500/15 text-purple-400'
                            : ach.rarity === 'rare'
                              ? 'bg-cyan-500/15 text-cyan-400'
                              : 'bg-[#30363d] text-[#8b949e]'
                      }`}
                    >
                      {ach.rarity}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}

            {remainingCount > 0 && (
              <p className="text-[10px] text-[#484f58] text-center pt-1">
                {remainingCount} more to unlock
              </p>
            )}
          </motion.div>
        </section>

        {/* ═══════════════════ 8. CAREER MILESTONES TIMELINE ═══════════════════ */}
        <section>
          <SectionHeader
            title="Career Milestones"
            icon={<Crown className="h-4 w-4" />}
            delay={SEC_DELAY * 7}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 7 + ITEM_DELAY }}
          >
            <div className="relative space-y-0">
              {/* Vertical timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#30363d]" />

              {milestones.map((ms, i) => (
                <motion.div
                  key={ms.id}
                  className="relative flex items-start gap-3 py-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    ...BASE_ANIM,
                    delay:
                      SEC_DELAY * 7 + ITEM_DELAY * 2 + i * ITEM_DELAY,
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 w-[22px] h-[22px] border-2 flex items-center justify-center shrink-0 ${
                      ms.achieved
                        ? 'bg-emerald-500/15 border-emerald-500'
                        : 'bg-[#21262d] border-[#30363d]'
                    }`}
                    style={{ borderRadius: '50%' }}
                  >
                    <span
                      className={
                        ms.achieved ? 'text-emerald-400' : 'text-[#484f58]'
                      }
                    >
                      {ms.achieved ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                    </span>
                  </div>

                  {/* Milestone content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          ms.achieved
                            ? 'text-emerald-400'
                            : 'text-[#484f58]'
                        }
                      >
                        {ms.icon}
                      </span>
                      <p
                        className={`text-xs font-medium ${
                          ms.achieved
                            ? 'text-[#c9d1d9]'
                            : 'text-[#484f58]'
                        }`}
                      >
                        {ms.label}
                      </p>
                    </div>
                    {ms.achieved && ms.season && (
                      <p className="text-[10px] text-[#8b949e] mt-0.5 ml-[26px]">
                        Season {ms.season}
                        {ms.week ? `, Week ${ms.week}` : ''}
                      </p>
                    )}
                    {!ms.achieved && (
                      <p className="text-[9px] text-[#30363d] mt-0.5 ml-[26px]">
                        Not yet achieved
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════ 9. ALL-TIME BESTS ═══════════════════ */}
        <section>
          <SectionHeader
            title="All-Time Bests"
            icon={<Star className="h-4 w-4" />}
            delay={SEC_DELAY * 8}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 8 + ITEM_DELAY }}
          >
            {allTimeBests.length > 0 ? (
              allTimeBests.map((best, i) => (
                <motion.div
                  key={best.label}
                  className="flex items-start gap-3 p-3 bg-[#21262d] rounded-lg border border-[#30363d] border-l-2 border-l-emerald-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    ...BASE_ANIM,
                    delay:
                      SEC_DELAY * 8 + ITEM_DELAY * 2 + i * ITEM_DELAY,
                  }}
                >
                  <span className="text-emerald-400 mt-0.5 shrink-0">
                    {best.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#8b949e] font-medium">
                      {best.label}
                    </p>
                    <p className="text-sm font-bold text-[#c9d1d9] tabular-nums">
                      {best.value}
                    </p>
                    <p className="text-[9px] text-[#484f58] mt-0.5 truncate">
                      {best.detail}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-xs text-[#484f58] text-center py-4">
                Play matches to see your all-time bests
              </p>
            )}
          </motion.div>
        </section>

        {/* ═══════════════════ 10. HALL OF FAME INDUCTEE GALLERY ═══════════════════ */}
        <section>
          <SectionHeader
            title="Hall of Fame Gallery"
            icon={<BookOpen className="h-4 w-4" />}
            delay={SEC_DELAY * 9}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 9 + ITEM_DELAY }}
          >
            <div className="overflow-x-auto pb-2 -mx-1 px-1">
              <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
                {hofInductees.map((inductee, i) => {
                  const tierClr = inductee.tier === 'Legend' ? '#34d399' : inductee.tier === 'Icon' ? '#f59e0b' : '#3b82f6';
                  const tierBg = inductee.tier === 'Legend' ? 'rgba(52,211,153,0.1)' : inductee.tier === 'Icon' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)';
                  const pClr = getPositionColor(inductee.position);
                  return (
                    <motion.div
                      key={inductee.name}
                      className="w-44 shrink-0 border rounded-lg p-3 space-y-2"
                      style={{ backgroundColor: '#21262d', borderColor: tierClr }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ...BASE_ANIM, delay: SEC_DELAY * 9 + ITEM_DELAY * 2 + i * ITEM_DELAY }}
                    >
                      <div className="flex items-start justify-between">
                        <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
                          <circle cx="20" cy="14" r="7" fill="#30363d" />
                          <path d="M8 44 C8 34 14 30 20 30 C26 30 32 34 32 44" fill="#30363d" />
                        </svg>
                        <span className="text-[7px] font-bold px-1.5 py-0.5" style={{ color: tierClr, backgroundColor: tierBg, borderRadius: 4 }}>
                          {inductee.tier}
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#c9d1d9] truncate">{inductee.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px]">{inductee.flag}</span>
                          <span className="text-[8px] px-1 py-0.5 text-white font-bold" style={{ backgroundColor: pClr, borderRadius: 3 }}>
                            {inductee.position}
                          </span>
                        </div>
                      </div>
                      <p className="text-[8px] text-[#8b949e] tabular-nums">{inductee.yearsActive}</p>
                      <ul className="space-y-0.5">
                        {inductee.highlights.map((h, hi) => (
                          <li key={hi} className="text-[7px] text-[#8b949e] flex items-start gap-1">
                            <span className="text-[5px] mt-0.5" style={{ color: tierClr }}>&#9679;</span>
                            <span className="leading-tight">{h}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between pt-1 border-t border-[#30363d]">
                        <div className="flex items-center gap-1">
                          <TrophyIcon className="h-2.5 w-2.5 text-amber-400" />
                          <span className="text-[8px] text-amber-400 font-bold tabular-nums">{inductee.trophyCount}</span>
                        </div>
                        <span className="text-[7px] text-[#484f58] tabular-nums">Ind. {inductee.inductionYear}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            {legacyOverall >= 60 && (
              <div className="mt-3 p-2 border rounded-lg flex items-center gap-2" style={{ borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.05)' }}>
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-400">Your Journey</p>
                  <p className="text-[8px] text-[#8b949e]">You&apos;re on track to join these legends!</p>
                </div>
              </div>
            )}
          </motion.div>
        </section>

        {/* ═══════════════════ 11. ALL-TIME RECORDS BOARD ═══════════════════ */}
        <section>
          <SectionHeader
            title="All-Time Records Board"
            icon={<BarChart3 className="h-4 w-4" />}
            delay={SEC_DELAY * 10}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 10 + ITEM_DELAY }}
          >
            <div className="grid grid-cols-1 gap-2">
              {allTimeRecords.map((rec, i) => {
                const progressPct = rec.recordValue > 0 ? Math.min(100, (rec.playerValue / rec.recordValue) * 100) : 0;
                const isRecordHolder = rec.playerRank === 1;
                const isClose = rec.playerRank > 0 && rec.playerRank <= 3;
                return (
                  <motion.div
                    key={rec.label}
                    className="flex items-center gap-3 p-2.5 rounded-lg border"
                    style={{
                      backgroundColor: isRecordHolder ? 'rgba(52,211,153,0.05)' : '#21262d',
                      borderColor: isRecordHolder ? '#34d399' : '#30363d',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...BASE_ANIM, delay: SEC_DELAY * 10 + ITEM_DELAY * 2 + i * ITEM_DELAY * 0.5 }}
                  >
                    <span className="text-emerald-400 shrink-0">{rec.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-[#c9d1d9]">{rec.label}</p>
                        {isRecordHolder && (
                          <span className="text-[7px] font-bold px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400" style={{ borderRadius: 3 }}>
                            RECORD HOLDER
                          </span>
                        )}
                        {isClose && !isRecordHolder && (
                          <span className="text-[7px] font-bold px-1.5 py-0.5 bg-amber-500/15 text-amber-400" style={{ borderRadius: 3 }}>
                            CLOSE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                          <motion.div
                            className="h-full rounded-sm"
                            style={{ backgroundColor: isRecordHolder ? '#34d399' : isClose ? '#f59e0b' : '#3b82f6' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, width: `${progressPct}%` }}
                            transition={{ ...BASE_ANIM, width: { duration: 0.4 }, delay: SEC_DELAY * 10 + ITEM_DELAY * 3 + i * ITEM_DELAY * 0.5 }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[8px] text-[#8b949e]">{rec.holder} &middot; {rec.value}</span>
                        <span className="text-[8px] font-bold tabular-nums" style={{ color: rec.playerRank > 0 ? (isRecordHolder ? '#34d399' : '#f59e0b') : '#484f58' }}>
                          {rec.playerRank > 0 ? `You: #${rec.playerRank}` : 'You: ---'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════ 12. CAREER LEGACY SCORE ═══════════════════ */}
        <section>
          <SectionHeader
            title="Career Legacy Score"
            icon={<Crown className="h-4 w-4" />}
            delay={SEC_DELAY * 11}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 11 + ITEM_DELAY }}
          >
            {/* Legacy Gauge */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#21262d" strokeWidth="6" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={legacyTierColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    initial={{ opacity: 0, strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ opacity: 1, strokeDashoffset: 2 * Math.PI * 42 - (legacyOverall / 100) * 2 * Math.PI * 42 }}
                    transition={{ ...BASE_ANIM, strokeDashoffset: { duration: 0.6 }, delay: SEC_DELAY * 11 + ITEM_DELAY * 2 }}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black tabular-nums" style={{ color: legacyTierColor }}>{legacyOverall}</span>
                  <span className="text-[7px] text-[#8b949e]">/ 100</span>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-xs font-bold px-2 py-0.5 inline-block" style={{ color: legacyTierColor, backgroundColor: legacyTierColor.replace(')', ',0.12)'), borderRadius: 4 }}>
                  {legacyTier}
                </span>
                <p className="text-[10px] text-[#8b949e] mt-1">Your career legacy is shaped by goals, assists, trophies, and loyalty.</p>
              </div>
            </div>

            {/* Legacy Categories */}
            <div className="space-y-2 pt-2 border-t border-[#30363d]">
              {legacyCategories.map((cat, i) => {
                const catColors = ['#34d399', '#3b82f6', '#f59e0b', '#ef4444', '#a78bfa', '#8b949e'];
                const catColor = catColors[i] || '#8b949e';
                return (
                  <motion.div
                    key={cat.name}
                    className="space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...BASE_ANIM, delay: SEC_DELAY * 11 + ITEM_DELAY * 3 + i * ITEM_DELAY }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[#c9d1d9]">{cat.name}</span>
                      <span className="text-[9px] font-bold tabular-nums" style={{ color: catColor }}>{Math.round(cat.percentage)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                      <motion.div
                        className="h-full rounded-sm"
                        style={{ backgroundColor: catColor }}
                        initial={{ opacity: 0, width: '0%' }}
                        animate={{ opacity: 1, width: `${cat.percentage}%` }}
                        transition={{ ...BASE_ANIM, width: { duration: 0.4 }, delay: SEC_DELAY * 11 + ITEM_DELAY * 4 + i * ITEM_DELAY }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════ 13. CAREER MOMENTS OF GLORY ═══════════════════ */}
        <section>
          <SectionHeader
            title="Career Moments of Glory"
            icon={<Flame className="h-4 w-4" />}
            delay={SEC_DELAY * 12}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 12 + ITEM_DELAY }}
          >
            <div className="relative space-y-0">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#30363d]" />
              {momentsOfGlory.map((moment, i) => (
                <motion.div
                  key={moment.title}
                  className="relative flex items-start gap-3 py-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...BASE_ANIM, delay: SEC_DELAY * 12 + ITEM_DELAY * 2 + i * ITEM_DELAY }}
                >
                  <div
                    className="relative z-10 w-[22px] h-[22px] border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: moment.color, borderRadius: '50%', backgroundColor: moment.color.replace(')', ',0.15)') }}
                  >
                    <Star className="h-3 w-3" style={{ color: moment.color }} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-bold text-[#c9d1d9]">{moment.title}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: moment.impact }).map((_, hi) => (
                          <Heart key={hi} className="h-2.5 w-2.5" style={{ color: moment.color }} fill={moment.color} />
                        ))}
                        {Array.from({ length: 5 - moment.impact }).map((_, hi) => (
                          <Heart key={hi} className="h-2.5 w-2.5" style={{ color: '#30363d' }} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[9px] text-[#8b949e]">
                      <span className="text-[#484f58]">{moment.date}</span>
                      {moment.matchContext !== '—' && (
                        <span> &middot; {moment.matchContext}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-[#c9d1d9] leading-snug">{moment.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════ 14. FAN TRIBUTE SECTION ═══════════════════ */}
        <section>
          <SectionHeader
            title="Fan Tribute"
            icon={<Users className="h-4 w-4" />}
            delay={SEC_DELAY * 13}
          />
          <motion.div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...BASE_ANIM, delay: SEC_DELAY * 13 + ITEM_DELAY }}
          >
            {/* Fan Approval Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-3.5 w-3.5 text-red-400" fill="#ef4444" />
                  <span className="text-[11px] font-bold text-[#c9d1d9]">Fan Approval</span>
                </div>
                <span className="text-[11px] font-bold tabular-nums text-red-400">{fanTribute.approvalRating}%</span>
              </div>
              <div className="h-3 bg-[#21262d] rounded-sm overflow-hidden">
                <motion.div
                  className="h-full rounded-sm bg-red-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, width: `${fanTribute.approvalRating}%` }}
                  transition={{ ...BASE_ANIM, width: { duration: 0.5 }, delay: SEC_DELAY * 13 + ITEM_DELAY * 2 }}
                />
              </div>
            </div>

            {/* Social Followers */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#21262d] border border-[#30363d]">
              <Users className="h-4 w-4 text-sky-400" />
              <div>
                <p className="text-[10px] text-[#8b949e]">Social Media Followers</p>
                <p className="text-sm font-bold text-sky-400 tabular-nums">{fanTribute.followers}</p>
              </div>
            </div>

            {/* Fan Messages */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 text-[#8b949e]" />
                <p className="text-[10px] font-medium text-[#8b949e]">Fan Messages</p>
              </div>
              {fanTribute.messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className="p-2.5 rounded-lg bg-[#21262d] border border-[#30363d]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ...BASE_ANIM, delay: SEC_DELAY * 13 + ITEM_DELAY * 3 + i * ITEM_DELAY }}
                >
                  <p className="text-[10px] text-[#c9d1d9] italic leading-relaxed">&ldquo;{msg}&rdquo;</p>
                </motion.div>
              ))}
            </div>

            {/* Chant */}
            <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d] space-y-1">
              <div className="flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-[10px] font-medium text-amber-400">The Chant</p>
              </div>
              <p className="text-[10px] text-[#c9d1d9] leading-relaxed whitespace-pre-line font-medium">
                {fanTribute.chant}
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
