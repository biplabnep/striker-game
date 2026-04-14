// ============================================================
// Elite Striker — Virtual Trophy Tour Component
// A 4-tab tour showcasing career trophies, achievements, records,
// and Hall of Fame comparison against football legends.
//
// Rules Compliance:
//   Rule 1:  All hooks BEFORE if (!gameState) guard
//   Rule 2:  Constants NOT wrapped in useMemo
//   Rule 3:  No let with cumulative assignment — uses .reduce()
//   Rule 4:  .map().join() extracted to helper functions
//   Rule 5:  Standard SVG attributes (strokeWidth, fillOpacity, etc.)
//   Rule 6:  React.JSX.Element return types
//   Rule 7:  All JSX arrays have key props
//   Rule 8:  No gradients, no backdrop-blur, no glassmorphism
//   Rule 9:  No rounded-full on elements >24px
//   Rule 10: Only opacity transitions (no y/scale/rotate)
//   Rule 11: Default export: export default function
//   Rule 12: 'use client' at top
// ============================================================

'use client';

import { useGameStore } from '@/store/gameStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import {
  Trophy, Star, Crown, Award, TrendingUp, Calendar, Target,
  Lock, Unlock, ChevronRight, Sparkles, Flame, Shield,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

/** Rarity tiers for trophy classification in the cabinet */
type TrophyRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

/** Achievement category groupings for gallery filtering */
type AchievementCategory = 'Attacking' | 'Defending' | 'Milestone' | 'Team';

/** Tab identifier for the four main tour sections */
type TabId = 'cabinet' | 'achievements' | 'records' | 'halloffame';

/** Activity intensity level for calendar grid cells */
type ActivityLevel = 0 | 1 | 2 | 3;

/** Individual trophy slot displayed in the cabinet grid */
interface TrophySlot {
  id: string;
  name: string;
  rarity: TrophyRarity;
  unlocked: boolean;
  yearWon: string;
  description: string;
  iconName: string;
}

/** Achievement card with progress tracking */
interface AchievementItem {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  progress: number;
  unlocked: boolean;
  iconName: string;
}

/** Personal best record entry */
interface PersonalRecord {
  id: string;
  label: string;
  value: string;
  iconName: string;
}

/** Career milestone event on the timeline */
interface CareerMilestoneItem {
  id: string;
  label: string;
  season: number;
  description: string;
  iconName: string;
}

interface LegendEntry {
  name: string;
  goals: number;
  assists: number;
  appearances: number;
  rating: number;
  trophies: number;
  cleanSheets: number;
}

interface HighlightCard {
  id: string;
  title: string;
  description: string;
  season: number;
  color: string;
}

interface SeasonComparison {
  season: number;
  goals: number;
  assists: number;
  rating: number;
}

/** Donut chart segment computed via reduce (avoids let accumulation) */
interface DonutSegment {
  path: string;
  color: string;
  rarity: TrophyRarity;
  count: number;
  endAngle: number;
}

/** Streak computation result from reduce */
interface StreakResult {
  longest: number;
  current: number;
}

/** Recent form data point for sparkline chart */
interface FormPoint {
  rating: number;
  goals: number;
  label: string;
}

/** Stat comparison item for the Hall of Fame breakdown */
interface StatComparisonItem {
  label: string;
  playerVal: number;
  legendAvg: number;
}

/** Career stat summary for the overview card */
interface CareerStatRow {
  label: string;
  value: string;
  iconName: string;
  color: string;
}

// ============================================================
// Constants
// ============================================================

const RARITY_CONFIG: Record<TrophyRarity, { color: string; bgColor: string; borderColor: string; textColor: string }> = {
  Common: { color: '#8b949e', bgColor: 'rgba(139,148,158,0.08)', borderColor: 'rgba(139,148,158,0.3)', textColor: 'text-[#8b949e]' },
  Rare: { color: '#3b82f6', bgColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.3)', textColor: 'text-blue-400' },
  Epic: { color: '#a855f7', bgColor: 'rgba(168,85,247,0.08)', borderColor: 'rgba(168,85,247,0.3)', textColor: 'text-purple-400' },
  Legendary: { color: '#fbbf24', bgColor: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.3)', textColor: 'text-amber-400' },
};

const LEGENDS: LegendEntry[] = [
  { name: 'Messi', goals: 820, assists: 370, appearances: 1040, rating: 94, trophies: 44, cleanSheets: 2 },
  { name: 'Ronaldo', goals: 850, assists: 260, appearances: 1090, rating: 93, trophies: 35, cleanSheets: 1 },
  { name: 'Zidane', goals: 158, assists: 105, appearances: 780, rating: 91, trophies: 18, cleanSheets: 0 },
  { name: 'R. Nazario', goals: 414, assists: 98, appearances: 580, rating: 92, trophies: 16, cleanSheets: 0 },
  { name: 'Cruyff', goals: 402, assists: 260, appearances: 720, rating: 93, trophies: 22, cleanSheets: 0 },
];

const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  Attacking: '#ef4444',
  Defending: '#3b82f6',
  Milestone: '#fbbf24',
  Team: '#10b981',
};

const ACTIVITY_LEVEL_COLORS: Record<ActivityLevel, string> = {
  0: '#161b22',
  1: '#0e4429',
  2: '#26a641',
  3: '#39d353',
};

const ALL_TIME_RECORDS: Record<string, number> = {
  'Most Goals in Season': 38,
  'Most Assists in Season': 20,
  'Longest Unbeaten': 26,
  'Highest Rating': 10.0,
  'Most Clean Sheets': 22,
  'Consecutive Goals': 11,
};

// ============================================================
// Animation Variants — opacity only per rule (no y/scale/rotate)
// ============================================================

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const fadeInItem = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.03, duration: 0.25 },
  }),
};

const fadeSwitch = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// ============================================================
// SVG Helper Functions
// All extracted to avoid .map().join() in JSX attributes (Rule 4)
// ============================================================

// ============================================================
// SVG Helper: Donut arc path between two angles
// Generates an SVG arc path string for donut segments
// ============================================================

function donutArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// ============================================================
// SVG Helper: Hexagonal radar data points string
// Converts normalized values (0-100) to polygon points
// ============================================================

function hexRadarPoints(cx: number, cy: number, r: number, values: number[]): string {
  return values.map((val, i) => {
    const angle = ((Math.PI * 2) / values.length) * i - Math.PI / 2;
    const dist = (val / 100) * r;
    const x = cx + dist * Math.cos(angle);
    const y = cy + dist * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

// ============================================================
// SVG Helper: Hexagonal radar grid polygon points
// Used for the background grid of radar charts
// ============================================================

function hexRadarGrid(cx: number, cy: number, r: number, sides: number): string {
  return Array.from({ length: sides }, (_, i) => {
    const angle = ((Math.PI * 2) / sides) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

// ============================================================
// SVG Helper: Area chart line points
// Converts data array to polyline points string
// ============================================================

function areaChartPoints(data: number[], w: number, h: number, padX: number, padY: number): string {
  const maxVal = Math.max(...data, 1);
  return data.map((val, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2);
    const y = h - padY - (val / maxVal) * (h - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

// ============================================================
// SVG Helper: Area chart filled polygon
// Line points + baseline to create filled area
// ============================================================

function areaChartFillPoints(data: number[], w: number, h: number, padX: number, padY: number): string {
  const maxVal = Math.max(...data, 1);
  const linePoints = data.map((val, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2);
    const y = h - padY - (val / maxVal) * (h - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lastX = padX + ((data.length - 1) / Math.max(data.length - 1, 1)) * (w - padX * 2);
  return `${linePoints.join(' ')} ${lastX.toFixed(1)},${(h - padY).toFixed(1)} ${padX.toFixed(1)},${(h - padY).toFixed(1)}`;
}

// ============================================================
// SVG Helper: Ring circumference for progress displays
// ============================================================

function ringCircumference(r: number): number {
  return 2 * Math.PI * r;
}

// ============================================================
// SVG Helper: Ring dash offset for progress arcs
// ============================================================

function ringDashOffset(r: number, pct: number): number {
  const c = 2 * Math.PI * r;
  return c - (pct / 100) * c;
}

// ============================================================
// SVG Helper: Recent form sparkline points
// Generates compact line chart for recent match ratings
// ============================================================

function formSparklinePoints(data: FormPoint[], w: number, h: number, padX: number, padY: number): string {
  const maxVal = Math.max(...data.map((d) => d.rating), 1);
  const minVal = Math.min(...data.map((d) => d.rating), 0);
  const range = Math.max(maxVal - minVal, 1);
  return data
    .map((d, i) => {
      const x = padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2);
      const y = h - padY - ((d.rating - minVal) / range) * (h - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

// ============================================================
// SVG Helper: Bar chart value computation
// Returns bar width scaled to max value
// ============================================================

function scaledBarWidth(value: number, max: number, maxBarW: number): number {
  if (max === 0) return 0;
  return Math.min(maxBarW, (value / max) * maxBarW);
}

// ============================================================
// SVG Helper: Compute radar axis endpoints
// Returns coordinate array for axis line endpoints
// ============================================================

function computeRadarAxes(cx: number, cy: number, r: number, count: number): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

// ============================================================
// SVG Helper: Compute radar label positions
// Offsets outward from the radar boundary for text placement
// ============================================================

function computeRadarLabels(cx: number, cy: number, r: number, count: number, offset: number): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((Math.PI * 2) / count) * i - Math.PI / 2;
    return { x: cx + (r + offset) * Math.cos(angle), y: cy + (r + offset) * Math.sin(angle) };
  });
}

// ============================================================
// SVG Helper: Compute trophy donut segments via reduce
// Avoids let with cumulative assignment (Rule 3)
// ============================================================

function computeTrophySegments(slots: TrophySlot[], rarities: TrophyRarity[], colors: string[], total: number): DonutSegment[] {
  const rarityCounts = slots.reduce<Partial<Record<TrophyRarity, number>>>((acc, slot) => {
    acc[slot.rarity] = (acc[slot.rarity] || 0) + 1;
    return acc;
  }, {});
  return rarities.reduce<DonutSegment[]>((acc, rarity, idx) => {
    const count = rarityCounts[rarity] || 0;
    const pct = total > 0 ? (count / total) * 360 : 0;
    if (pct === 0) return acc;
    const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    acc.push({
      path: donutArcPath(50, 50, 35, startAngle, startAngle + pct - 0.5),
      color: colors[idx], rarity, count, endAngle: startAngle + pct,
    });
    return acc;
  }, []);
}

// ============================================================
// SVG Helper: Compute longest unbeaten streak via reduce
// Avoids let with cumulative assignment (Rule 3)
// ============================================================

function computeUnbeatenStreak(
  results: Array<{ homeScore: number; awayScore: number; homeClub: { name: string } }>,
  clubName: string,
): StreakResult {
  return results.reduce<StreakResult>((acc, r) => {
    const isHome = r.homeClub?.name === clubName;
    const won = isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
    const drew = r.homeScore === r.awayScore;
    const nextCurrent = won || drew ? acc.current + 1 : 0;
    return { longest: Math.max(acc.longest, nextCurrent), current: nextCurrent };
  }, { longest: 0, current: 0 });
}

// ============================================================
// SVG Helper: Compute consecutive scoring games via reduce
// Avoids let with cumulative assignment (Rule 3)
// ============================================================

function computeConsecutiveGoals(results: Array<{ playerGoals: number }>): StreakResult {
  return results.reduce<StreakResult>((acc, r) => {
    const nextCurrent = r.playerGoals > 0 ? acc.current + 1 : 0;
    return { longest: Math.max(acc.longest, nextCurrent), current: nextCurrent };
  }, { longest: 0, current: 0 });
}

// ============================================================
// Icon Helper: Map icon name string to Lucide component
// Used for dynamic icon rendering from data-driven configs
// ============================================================

function getIconComponent(name: string, sizeClass: string = 'h-5 w-5'): React.JSX.Element {
  const map: Record<string, React.JSX.Element> = {
    Trophy: <Trophy className={sizeClass} />,
    Award: <Award className={sizeClass} />,
    Shield: <Shield className={sizeClass} />,
    Star: <Star className={sizeClass} />,
    Crown: <Crown className={sizeClass} />,
    Flame: <Flame className={sizeClass} />,
    Sparkles: <Sparkles className={sizeClass} />,
    Target: <Target className={sizeClass} />,
    TrendingUp: <TrendingUp className={sizeClass} />,
    Calendar: <Calendar className={sizeClass} />,
  };
  return map[name] ?? <Trophy className={sizeClass} />;
}

// ============================================================
// Main Component
// ============================================================

export default function VirtualTrophyTour() {
  const gameState = useGameStore((state) => state.gameState);
  const [activeTab, setActiveTab] = useState<TabId>('cabinet');

  // ALL hooks BEFORE conditional return
  const playerData = useMemo(() => {
    if (!gameState) return null;
    const { player, currentClub, currentSeason, year } = gameState;
    const cs = player.careerStats;
    const ss = player.seasonStats;
    const seasons = gameState.seasons ?? [];
    const recentResults = gameState.recentResults ?? [];

    const totalGoals = cs.totalGoals ?? 0;
    const totalAssists = cs.totalAssists ?? 0;
    const totalApps = cs.totalAppearances ?? 0;
    const totalCleanSheets = cs.totalCleanSheets ?? 0;
    const totalTrophies = (cs.trophies ?? []).length;
    const seasonsPlayed = cs.seasonsPlayed ?? seasons.length ?? 0;
    const intlCaps = gameState.internationalCareer?.caps ?? 0;

    const playedResults = recentResults.filter((r) => r.playerRating > 0);
    const bestRating = playedResults.length > 0
      ? Math.max(...playedResults.map((r) => r.playerRating))
      : ss.averageRating ?? 0;

    const goalsPerSeason = seasons.map((s) => s.playerStats?.goals ?? 0);
    const mostGoalsSeason = goalsPerSeason.length > 0 ? Math.max(...goalsPerSeason) : ss.goals ?? 0;
    const assistsPerSeason = seasons.map((s) => s.playerStats?.assists ?? 0);
    const mostAssistsSeason = assistsPerSeason.length > 0 ? Math.max(...assistsPerSeason) : ss.assists ?? 0;

    const { longest: longestUnbeaten } = computeUnbeatenStreak(recentResults, currentClub.name);
    const { longest: consecutiveGoals } = computeConsecutiveGoals(recentResults);
    const hatTrickMatches = recentResults.filter((r) => r.playerGoals >= 3);

    // Trophy slots: first 3 unlocked, rest locked
    const trophySlots: TrophySlot[] = [
      { id: 'league', name: 'League Title', rarity: 'Legendary', unlocked: true, yearWon: `${year - 1}`, description: 'Won the domestic league championship', iconName: 'Trophy' },
      { id: 'domestic_cup', name: 'Domestic Cup', rarity: 'Epic', unlocked: true, yearWon: `${year - 1}`, description: 'Lifted the national cup trophy in a thrilling final', iconName: 'Award' },
      { id: 'super_cup', name: 'Super Cup', rarity: 'Epic', unlocked: true, yearWon: `${year}`, description: 'Defeated cup holders in a dramatic super cup clash', iconName: 'Shield' },
      { id: 'golden_boot', name: 'Golden Boot', rarity: 'Rare', unlocked: mostGoalsSeason >= 15, yearWon: mostGoalsSeason >= 15 ? `${year}` : 'Locked', description: 'Top scorer in the league with 15+ goals in a single campaign', iconName: 'Flame' },
      { id: 'cl', name: 'Champions League', rarity: 'Legendary', unlocked: false, yearWon: 'Locked', description: "The ultimate prize — conquer Europe's premier club competition", iconName: 'Star' },
      { id: 'europa', name: 'Europa League', rarity: 'Epic', unlocked: false, yearWon: 'Locked', description: 'Win the secondary European competition for continental glory', iconName: 'Crown' },
      { id: 'best_player', name: 'Best Player', rarity: 'Legendary', unlocked: bestRating >= 9.0, yearWon: bestRating >= 9.0 ? `${year}` : 'Locked', description: 'Named the absolute best player in the entire league', iconName: 'Sparkles' },
      { id: 'potm', name: 'Player of Season', rarity: 'Rare', unlocked: bestRating >= 8.0, yearWon: bestRating >= 8.0 ? `${year}` : 'Locked', description: 'Selected in the team of the season for outstanding performances', iconName: 'Sparkles' },
    ];

    // Achievement items: 12 cards across 4 categories
    const achievementItems: AchievementItem[] = [
      { id: 'first_goal', name: 'First Goal', description: 'Score your first career goal in competitive action', category: 'Attacking', progress: totalGoals > 0 ? 100 : 0, unlocked: totalGoals > 0, iconName: 'Target' },
      { id: '50_goals', name: '50 Goals', description: 'Reach the milestone of 50 career goals', category: 'Attacking', progress: Math.min(100, (totalGoals / 50) * 100), unlocked: totalGoals >= 50, iconName: 'Flame' },
      { id: '100_goals', name: '100 Goals', description: 'Join the century club with 100 career goals', category: 'Attacking', progress: Math.min(100, (totalGoals / 100) * 100), unlocked: totalGoals >= 100, iconName: 'Trophy' },
      { id: 'first_assist', name: 'First Assist', description: 'Provide your first career assist for a teammate', category: 'Attacking', progress: totalAssists > 0 ? 100 : 0, unlocked: totalAssists > 0, iconName: 'TrendingUp' },
      { id: '50_assists', name: '50 Assists', description: 'Become a playmaker with 50 career assists', category: 'Attacking', progress: Math.min(100, (totalAssists / 50) * 100), unlocked: totalAssists >= 50, iconName: 'Award' },
      { id: 'hatrick', name: 'Hat-trick', description: 'Score 3 or more goals in a single competitive match', category: 'Attacking', progress: hatTrickMatches.length > 0 ? 100 : 0, unlocked: hatTrickMatches.length > 0, iconName: 'Sparkles' },
      { id: 'clean_sheet', name: 'Clean Sheet', description: 'Keep a clean sheet when the team concedes no goals', category: 'Defending', progress: totalCleanSheets > 0 ? 100 : 0, unlocked: totalCleanSheets > 0, iconName: 'Shield' },
      { id: '100_apps', name: '100 Appearances', description: 'Reach the century mark of 100 competitive appearances', category: 'Milestone', progress: Math.min(100, (totalApps / 100) * 100), unlocked: totalApps >= 100, iconName: 'Calendar' },
      { id: 'captain', name: 'Captain', description: 'Be named team captain by the manager', category: 'Team', progress: player.age >= 25 && totalApps >= 80 ? 100 : Math.min(100, (totalApps / 80) * 50), unlocked: player.age >= 25 && totalApps >= 80, iconName: 'Crown' },
      { id: 'league_winner', name: 'League Winner', description: 'Win the domestic league championship title', category: 'Team', progress: totalTrophies >= 1 ? 100 : 0, unlocked: totalTrophies >= 1, iconName: 'Trophy' },
      { id: 'euro_winner', name: 'European Winner', description: 'Lift a European competition trophy for your club', category: 'Team', progress: totalTrophies >= 3 ? 100 : 0, unlocked: totalTrophies >= 3, iconName: 'Star' },
      { id: 'national_team', name: 'National Team', description: 'Earn your first call-up to the national team squad', category: 'Team', progress: intlCaps > 0 ? 100 : 0, unlocked: intlCaps > 0, iconName: 'Shield' },
    ];

    const personalRecords: PersonalRecord[] = [
      { id: 'goals_season', label: 'Most Goals in Season', value: `${mostGoalsSeason}`, iconName: 'Target' },
      { id: 'assists_season', label: 'Most Assists in Season', value: `${mostAssistsSeason}`, iconName: 'TrendingUp' },
      { id: 'unbeaten', label: 'Longest Unbeaten', value: `${longestUnbeaten} matches`, iconName: 'Shield' },
      { id: 'best_rating', label: 'Highest Rating', value: bestRating > 0 ? bestRating.toFixed(1) : 'N/A', iconName: 'Star' },
      { id: 'clean_sheets', label: 'Most Clean Sheets', value: `${totalCleanSheets}`, iconName: 'Award' },
      { id: 'consecutive_goals', label: 'Consec. Scoring', value: `${consecutiveGoals} matches`, iconName: 'Flame' },
    ];

    const careerMilestones: CareerMilestoneItem[] = [
      { id: 'm1', label: 'Career Started', season: 1, description: `Signed for ${currentClub.name} youth academy`, iconName: 'Calendar' },
      { id: 'm2', label: 'First Professional Match', season: Math.min(seasonsPlayed, 1), description: 'Made competitive debut in front of fans', iconName: 'Target' },
      { id: 'm3', label: 'First Goal Scored', season: Math.min(seasonsPlayed, 2), description: 'Found the net for the very first time', iconName: 'Flame' },
      { id: 'm4', label: 'First Trophy Won', season: Math.min(seasonsPlayed, 3), description: 'Lifted first piece of silverware in a final', iconName: 'Trophy' },
      { id: 'm5', label: '50 Career Goals', season: Math.min(seasonsPlayed, 4), description: 'Reached the half century of career goals', iconName: 'Sparkles' },
      { id: 'm6', label: '100 Appearances', season: Math.min(seasonsPlayed, 5), description: 'Celebrated a century of club appearances', iconName: 'Calendar' },
      { id: 'm7', label: 'National Team Debut', season: Math.min(seasonsPlayed, 6), description: 'Earned first international cap for your country', iconName: 'Shield' },
      { id: 'm8', label: 'Club Captain', season: Math.min(seasonsPlayed, 7), description: 'Named captain of the team by the manager', iconName: 'Crown' },
      { id: 'm9', label: 'Fan Favourite', season: Math.min(seasonsPlayed, 8), description: 'Voted fan favourite of the season', iconName: 'Star' },
      { id: 'm10', label: 'Record Breaker', season: Math.min(seasonsPlayed, 9), description: 'Broke a long-standing club record', iconName: 'Award' },
    ];

    const seasonComparisons: SeasonComparison[] = [
      { season: Math.max(1, currentSeason - 2), goals: seasons[seasons.length - 3]?.playerStats?.goals ?? 0, assists: seasons[seasons.length - 3]?.playerStats?.assists ?? 0, rating: seasons[seasons.length - 3]?.playerStats?.averageRating ?? 0 },
      { season: Math.max(1, currentSeason - 1), goals: seasons[seasons.length - 2]?.playerStats?.goals ?? 0, assists: seasons[seasons.length - 2]?.playerStats?.assists ?? 0, rating: seasons[seasons.length - 2]?.playerStats?.averageRating ?? 0 },
      { season: currentSeason, goals: ss.goals ?? 0, assists: ss.assists ?? 0, rating: ss.averageRating ?? 0 },
    ];

    // ============================================================
    // Career Highlights — narrative career moments
    // Each highlight includes a title, description, season, and color
    // Rendered as colored accent cards with chevron navigation
    // ============================================================

    const highlights: HighlightCard[] = [
      { id: 'h1', title: 'Debut Day', description: `First appearance for ${currentClub.name}`, season: 1, color: '#10b981' },
      { id: 'h2', title: 'Breakthrough Season', description: 'Established as first-team regular', season: Math.min(seasonsPlayed, 2), color: '#3b82f6' },
      { id: 'h3', title: 'First Silverware', description: 'Lifted the first trophy', season: Math.min(seasonsPlayed, 3), color: '#fbbf24' },
      { id: 'h4', title: 'Hat-trick Hero', description: 'Scored three in a single match', season: Math.min(seasonsPlayed, 4), color: '#ef4444' },
      { id: 'h5', title: 'European Adventure', description: 'Continental competition debut', season: Math.min(seasonsPlayed, 5), color: '#a855f7' },
      { id: 'h6', title: 'International Call-up', description: 'Selected for national team', season: Math.min(seasonsPlayed, 6), color: '#06b6d4' },
      { id: 'h7', title: "Captain's Armband", description: 'Honoured with the captaincy', season: Math.min(seasonsPlayed, 7), color: '#f97316' },
      { id: 'h8', title: 'Record Breaker', description: `New best: ${mostGoalsSeason} goals in a season`, season: Math.min(seasonsPlayed, 8), color: '#ec4899' },
    ];

    // ============================================================
    // Career Arc Data — rating progression for area chart
    // Uses season history when available, synthetic data otherwise
    // Provides the Y-axis data for the Career Arc SVG
    // ============================================================

    const careerArcData = Array.from({ length: Math.max(seasonsPlayed, 8) }, (_, i) => {
      if (i < seasons.length) return seasons[i].playerStats?.averageRating ?? 60 + i * 2;
      return 60 + i * 2 + Math.min(totalGoals, 100) / 20;
    });

    // ============================================================
    // Player Legend Entry — for comparison radar and table
    // Maps player career stats to the LegendEntry format
    // Used alongside LEGENDS data for head-to-head comparison
    // ============================================================

    const playerLegend: LegendEntry = {
      name: player.name, goals: totalGoals, assists: totalAssists,
      appearances: totalApps, rating: player.overall, trophies: totalTrophies, cleanSheets: totalCleanSheets,
    };

    // ============================================================
    // Activity Calendar — 13 weeks x 7 days synthetic heatmap
    // Activity levels (0-3) determined by deterministic seed
    // Visualized as a GitHub-style contribution grid
    // ============================================================

    const activityCalendar: ActivityLevel[][] = Array.from({ length: 13 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const seed = (totalGoals * 7 + week * 13 + day * 3) % 10;
        if (seed >= 7) return 3 as ActivityLevel;
        if (seed >= 4) return 1 as ActivityLevel;
        return 0 as ActivityLevel;
      })
    );

    const currentValueMap: Record<string, number> = {
      'Most Goals in Season': mostGoalsSeason,
      'Most Assists in Season': mostAssistsSeason,
      'Longest Unbeaten': longestUnbeaten,
      'Highest Rating': bestRating,
      'Most Clean Sheets': totalCleanSheets,
      'Consecutive Goals': consecutiveGoals,
    };

    // Hall of Fame percentile
    const statKeys = ['goals', 'assists', 'appearances', 'rating', 'trophies', 'cleanSheets'] as const;
    const maxLegendValues = statKeys.reduce<Record<string, number>>((acc, key) => {
      acc[key] = Math.max(...LEGENDS.map((l) => l[key as keyof LegendEntry] as number));
      return acc;
    }, {});
    const percentileScores = statKeys.map((key) => {
      const playerVal = playerLegend[key as keyof LegendEntry] as number;
      const maxVal = maxLegendValues[key] ?? 1;
      return Math.min(100, (playerVal / maxVal) * 100);
    });
    const avgPercentile = percentileScores.length > 0
      ? percentileScores.reduce((sum, v) => sum + v, 0) / percentileScores.length
      : 0;

    // ============================================================
    // Recent Form — last 10 matches for sparkline
    // ============================================================

    const recentForm: FormPoint[] = playedResults.slice(-10).map((r, i) => ({
      rating: r.playerRating,
      goals: r.playerGoals ?? 0,
      label: `M${i + 1}`,
    }));
    if (recentForm.length === 0) {
      recentForm.push({ rating: ss.averageRating || 6.5, goals: ss.goals || 0, label: 'S1' });
    }

    // ============================================================
    // Career Stat Rows — for the summary overview card
    // ============================================================

    const careerStatRows: CareerStatRow[] = [
      { label: 'Goals per Game', value: totalApps > 0 ? (totalGoals / totalApps).toFixed(2) : '0.00', iconName: 'Target', color: 'text-emerald-400' },
      { label: 'Assists per Game', value: totalApps > 0 ? (totalAssists / totalApps).toFixed(2) : '0.00', iconName: 'TrendingUp', color: 'text-blue-400' },
      { label: 'Goal Contributions', value: `${totalGoals + totalAssists}`, iconName: 'Flame', color: 'text-red-400' },
      { label: 'Appearances', value: `${totalApps}`, iconName: 'Calendar', color: 'text-purple-400' },
      { label: 'Win Rate', value: `${Math.min(100, Math.round((totalGoals / Math.max(totalApps, 1)) * 30 + 40))}%`, iconName: 'Trophy', color: 'text-amber-400' },
      { label: 'Seasons Played', value: `${seasonsPlayed}`, iconName: 'Star', color: 'text-cyan-400' },
    ];

    // ============================================================
    // Stat Comparisons for Hall of Fame
    // ============================================================

    const statComparisons: StatComparisonItem[] = [
      { label: 'Goals', playerVal: playerLegend.goals, legendAvg: LEGENDS.reduce((s, l) => s + l.goals, 0) / LEGENDS.length },
      { label: 'Assists', playerVal: playerLegend.assists, legendAvg: LEGENDS.reduce((s, l) => s + l.assists, 0) / LEGENDS.length },
      { label: 'Appearances', playerVal: playerLegend.appearances, legendAvg: LEGENDS.reduce((s, l) => s + l.appearances, 0) / LEGENDS.length },
      { label: 'Overall Rating', playerVal: playerLegend.rating, legendAvg: LEGENDS.reduce((s, l) => s + l.rating, 0) / LEGENDS.length },
      { label: 'Trophies', playerVal: playerLegend.trophies, legendAvg: LEGENDS.reduce((s, l) => s + l.trophies, 0) / LEGENDS.length },
    ];

    return {
      playerName: player.name, clubName: currentClub.name, currentSeason, year,
      totalGoals, totalAssists, totalApps, totalCleanSheets, totalTrophies, seasonsPlayed,
      bestRating, mostGoalsSeason, mostAssistsSeason, longestUnbeaten, consecutiveGoals,
      trophySlots, achievementItems, personalRecords, careerMilestones,
      seasonComparisons, highlights, careerArcData, playerLegend, activityCalendar,
      currentValueMap, avgPercentile, recentForm, careerStatRows, statComparisons,
      unlockedAchievements: achievementItems.filter((a) => a.unlocked).length,
      totalAchievements: achievementItems.length,
      unlockedTrophies: trophySlots.filter((t) => t.unlocked).length,
      totalTrophySlots: trophySlots.length,
    };
  }, [gameState]);

  // Tab configuration (static constant, NOT useMemo per Rule 2)
  const tabConfig: Array<{ id: TabId; label: string; iconName: string }> = [
    { id: 'cabinet', label: 'Trophy Cabinet', iconName: 'Trophy' },
    { id: 'achievements', label: 'Achievements', iconName: 'Award' },
    { id: 'records', label: 'Records', iconName: 'TrendingUp' },
    { id: 'halloffame', label: 'Hall of Fame', iconName: 'Crown' },
  ];

  // ============================================================
  // Conditional return AFTER all hooks (Rule 1)
  // Shows a placeholder if no career is loaded
  // ============================================================

  if (!gameState || !playerData) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-[#484f58]">
          <Trophy className="h-12 w-12" />
          <p className="text-sm">Start a career to view your Virtual Trophy Tour</p>
        </div>
      </div>
    );
  }

  const { player } = gameState;

  // ============================================================
  // SUB-COMPONENT: Career Hero Summary
  // Displays player info, key stats, and best rating
  // ============================================================

  function careerHeroSummary(): React.JSX.Element {
    const heroStats = [
      { iconName: 'Trophy', value: playerData!.totalTrophies, label: 'Trophies', color: 'text-amber-400' },
      { iconName: 'Target', value: playerData!.totalGoals, label: 'Goals', color: 'text-emerald-400' },
      { iconName: 'TrendingUp', value: playerData!.totalAssists, label: 'Assists', color: 'text-blue-400' },
      { iconName: 'Calendar', value: playerData!.totalApps, label: 'Apps', color: 'text-purple-400' },
      { iconName: 'Shield', value: gameState!.internationalCareer?.caps ?? 0, label: 'Caps', color: 'text-red-400' },
    ];
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.3, delay: 0.08 }} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <Crown className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-[#c9d1d9]">{player.name}</h2>
            <p className="text-[10px] text-[#8b949e]">Season {playerData!.currentSeason} &mdash; {playerData!.clubName}</p>
            <p className="text-[9px] text-[#484f58]">{player.position} | OVR {player.overall} | Age {player.age}</p>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {heroStats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5 bg-[#0d1117] border border-[#21262d] rounded-md py-2 px-1">
              <span className={stat.color}>{getIconComponent(stat.iconName, 'h-3.5 w-3.5')}</span>
              <span className="text-sm font-bold text-[#c9d1d9] leading-none">{stat.value}</span>
              <span className="text-[7px] text-[#484f58] uppercase">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#21262d]">
          <Star className="h-3 w-3 text-amber-400" />
          <span className="text-[10px] text-[#8b949e]">Best Rating: </span>
          <span className="text-[10px] font-bold text-[#c9d1d9]">{playerData!.bestRating > 0 ? playerData!.bestRating.toFixed(1) : 'N/A'}</span>
          <span className="text-[10px] text-[#484f58] mx-2">|</span>
          <Shield className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] text-[#8b949e]">Clean Sheets: </span>
          <span className="text-[10px] font-bold text-[#c9d1d9]">{playerData!.totalCleanSheets}</span>
        </div>
      </motion.div>
    );
  }

  // ============================================================
  // SUB-COMPONENT: Career Summary Stats Card
  // Grid of detailed career statistics below the hero
  // ============================================================

  function careerSummaryStats(): React.JSX.Element {
    return (
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.12 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 mb-4"
      >
        <h3 className="text-[10px] font-bold text-[#8b949e] mb-2.5 flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          Career Summary
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {playerData!.careerStatRows.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 bg-[#0d1117] border border-[#21262d] rounded-md py-1.5 px-2"
            >
              <span className={stat.color}>
                {getIconComponent(stat.iconName, 'h-3 w-3')}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] text-[#484f58] uppercase leading-tight">{stat.label}</span>
                <span className="text-[11px] font-bold text-[#c9d1d9] leading-tight">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ============================================================
  // Sub-Components: SVG Visualization Components
  // Each SVG is a self-contained visualization used within tab renders
  // All SVG helpers are extracted to avoid .map().join() in JSX (Rule 4)
  // All use standard SVG attributes (strokeWidth, fillOpacity, etc.) (Rule 5)
  // ============================================================

  // ============================================================
  // SVG: Trophy Collection Progress Ring (Tab 1)
  // Shows fraction of trophies unlocked with animated arc
  // Uses ring dashoffset technique for circular progress
  // ============================================================

  function trophyProgressRing(): React.JSX.Element {
    const r = 40;
    const circ = ringCircumference(r);
    const pct = playerData!.totalTrophySlots > 0 ? (playerData!.unlockedTrophies / playerData!.totalTrophySlots) * 100 : 0;
    const offset = ringDashOffset(r, pct);
    return (
      <div className="flex flex-col items-center">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#21262d" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 50 50)" className="transition-all duration-700" />
          <text x="50" y="45" textAnchor="middle" fill="#c9d1d9" fontSize="18" fontWeight="bold">{playerData!.unlockedTrophies}</text>
          <text x="50" y="62" textAnchor="middle" fill="#8b949e" fontSize="9">/ {playerData!.totalTrophySlots}</text>
        </svg>
        <span className="text-[10px] text-[#8b949e] mt-1">Trophies Unlocked</span>
      </div>
    );
  }

  // ============================================================
  // SVG: Trophy Rarity Donut (Tab 1)
  // 4 segments computed via reduce (Rule 3: no let accumulation)
  // ============================================================

  function trophyRarityDonut(): React.JSX.Element {
    const rarities: TrophyRarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];
    const colors = ['#8b949e', '#3b82f6', '#a855f7', '#fbbf24'];
    const total = playerData!.totalTrophySlots;
    const segments = computeTrophySegments(playerData!.trophySlots, rarities, colors, total);
    const rarityCounts = playerData!.trophySlots.reduce<Partial<Record<TrophyRarity, number>>>((acc, slot) => {
      acc[slot.rarity] = (acc[slot.rarity] || 0) + 1;
      return acc;
    }, {});
    return (
      <div className="flex flex-col items-center">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full">
          {segments.map((seg) => (
            <path key={seg.rarity} d={seg.path} fill="none" stroke={seg.color} strokeWidth="10" strokeLinecap="round" opacity={0.8} />
          ))}
          <text x="50" y="47" textAnchor="middle" fill="#c9d1d9" fontSize="11" fontWeight="bold">Rarity</text>
          <text x="50" y="60" textAnchor="middle" fill="#8b949e" fontSize="8">Distribution</text>
        </svg>
        <div className="flex gap-2 mt-1 flex-wrap justify-center">
          {rarities.map((r, i) => (
            <span key={r} className="flex items-center gap-1 text-[8px] text-[#8b949e]">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: colors[i] }} />
              {r} ({rarityCounts[r] || 0})
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // SVG: Career Trophy Timeline (Tab 1)
  // Horizontal timeline with unlocked trophy markers
  // ============================================================

  function trophyTimeline(): React.JSX.Element {
    const unlocked = playerData!.trophySlots.filter((t) => t.unlocked);
    const tw = 320;
    const th = 70;
    const padX = 30;
    const cy = 35;
    return (
      <div>
        <svg width="100%" viewBox={`0 0 ${tw} ${th}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          <line x1={padX} y1={cy} x2={tw - padX} y2={cy} stroke="#21262d" strokeWidth="2" />
          {unlocked.length > 0 ? unlocked.map((trophy, idx) => {
            const x = padX + (idx / Math.max(unlocked.length - 1, 1)) * (tw - padX * 2);
            const rc = RARITY_CONFIG[trophy.rarity].color;
            return (
              <g key={trophy.id}>
                <circle cx={x} cy={cy} r="6" fill={rc} stroke="#0d1117" strokeWidth="2" />
                <circle cx={x} cy={cy} r="2" fill="#0d1117" />
                <text x={x} y={cy - 12} textAnchor="middle" fill={rc} fontSize="7" fontWeight="bold">{trophy.yearWon}</text>
                <text x={x} y={cy + 18} textAnchor="middle" fill="#8b949e" fontSize="6">{trophy.name}</text>
              </g>
            );
          }) : (
            <text x={tw / 2} y={cy + 4} textAnchor="middle" fill="#484f58" fontSize="9">No trophies yet</text>
          )}
        </svg>
      </div>
    );
  }

  // ============================================================
  // SVG: Achievement Completion Ring (Tab 2)
  // Circular progress showing overall achievement completion
  // ============================================================

  function achievementCompletionRing(): React.JSX.Element {
    const pct = playerData!.totalAchievements > 0 ? (playerData!.unlockedAchievements / playerData!.totalAchievements) * 100 : 0;
    const r = 38;
    const c = ringCircumference(r);
    const offset = ringDashOffset(r, pct);
    return (
      <div className="flex flex-col items-center">
        <svg width="96" height="96" viewBox="0 0 96 96" className="w-full">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#21262d" strokeWidth="7" />
          <circle cx="48" cy="48" r={r} fill="none" stroke="#a855f7" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 48 48)" className="transition-all duration-700" />
          <text x="48" y="43" textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="bold">{Math.round(pct)}%</text>
          <text x="48" y="58" textAnchor="middle" fill="#8b949e" fontSize="8">Complete</text>
        </svg>
        <span className="text-[10px] text-[#8b949e] mt-1">{playerData!.unlockedAchievements} / {playerData!.totalAchievements}</span>
      </div>
    );
  }

  // ============================================================
  // SVG: Achievement Category Bars (Tab 2)
  // Horizontal progress bars per category (Attacking/Defending/Milestone/Team)
  // ============================================================

  function achievementCategoryBars(): React.JSX.Element {
    const categories: AchievementCategory[] = ['Attacking', 'Defending', 'Milestone', 'Team'];
    const catData = categories.reduce<Array<{ category: AchievementCategory; unlocked: number; total: number }>>((acc, cat) => {
      const items = playerData!.achievementItems.filter((a) => a.category === cat);
      acc.push({ category: cat, unlocked: items.filter((a) => a.unlocked).length, total: items.length });
      return acc;
    }, []);
    const catColorList = [CATEGORY_COLORS.Attacking, CATEGORY_COLORS.Defending, CATEGORY_COLORS.Milestone, CATEGORY_COLORS.Team];
    return (
      <svg width="100%" viewBox="0 0 260 100" className="w-full" preserveAspectRatio="xMidYMid meet">
        {catData.map((d, i) => {
          const y = i * 22 + 8;
          const barW = d.total > 0 ? (d.unlocked / d.total) * 160 : 0;
          return (
            <g key={d.category}>
              <text x="0" y={y + 4} fill="#8b949e" fontSize="8">{d.category}</text>
              <rect x="70" y={y - 3} width="160" height="10" rx="2" fill="#21262d" />
              <rect x="70" y={y - 3} width={barW} height="10" rx="2" fill={catColorList[i]} opacity={0.8} className="transition-all duration-500" />
              <text x="236" y={y + 4} fill="#c9d1d9" fontSize="8">{d.unlocked}/{d.total}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ============================================================
  // SVG: Achievement Streak Calendar Grid (Tab 2)
  // 13-week x 7-day activity heatmap
  // ============================================================

  function achievementStreakCalendar(): React.JSX.Element {
    const cs = 14;
    const cp = 2;
    const totalW = 7 * (cs + cp) + 20;
    const totalH = 13 * (cs + cp) + 20;
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const lc = [ACTIVITY_LEVEL_COLORS[0], ACTIVITY_LEVEL_COLORS[1], ACTIVITY_LEVEL_COLORS[2], ACTIVITY_LEVEL_COLORS[3]];
    return (
      <svg width="100%" viewBox={`0 0 ${totalW} ${totalH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {dayLabels.map((day, d) => (
          <text key={`dh-${d}`} x={20 + d * (cs + cp) + cs / 2} y="12" textAnchor="middle" fill="#484f58" fontSize="7">{day}</text>
        ))}
        {playerData!.activityCalendar.map((week, w) =>
          week.map((level, d) => (
            <rect key={`c-${w}-${d}`} x={20 + d * (cs + cp)} y={18 + w * (cs + cp)} width={cs} height={cs} rx="2" fill={lc[level]} />
          ))
        )}
        <text x={totalW - 5} y="12" textAnchor="end" fill="#484f58" fontSize="6">Less</text>
        <text x={totalW - 5} y={totalH + 1} textAnchor="end" fill="#484f58" fontSize="6">More</text>
      </svg>
    );
  }

  // ============================================================
  // SVG: Personal Best Hex Radar (Tab 3)
  // 6-axis radar chart for personal bests
  // ============================================================

  function personalBestHexRadar(): React.JSX.Element {
    const cx = 100;
    const cy = 80;
    const maxR = 60;
    const ac = 6;
    const labels = ['Goals', 'Assists', 'Apps', 'Rating', 'CleanS.', 'Trophies'];
    const values = [
      Math.min(100, (playerData!.mostGoalsSeason / 38) * 100),
      Math.min(100, (playerData!.mostAssistsSeason / 20) * 100),
      Math.min(100, (playerData!.totalApps / 400) * 100),
      Math.min(100, (playerData!.bestRating / 10) * 100),
      Math.min(100, (playerData!.totalCleanSheets / 22) * 100),
      Math.min(100, (playerData!.totalTrophies / 10) * 100),
    ];
    const gridPointsList = [0.25, 0.5, 0.75, 1.0].map((level) => hexRadarGrid(cx, cy, maxR * level, ac));
    const dataPoints = hexRadarPoints(cx, cy, maxR, values);
    const axisEndpoints = computeRadarAxes(cx, cy, maxR, ac);
    const labelPositions = computeRadarLabels(cx, cy, maxR, ac, 16);
    return (
      <svg width="100%" viewBox="0 0 200 160" className="w-full" preserveAspectRatio="xMidYMid meet">
        {gridPointsList.map((gp, gi) => (
          <polygon key={`gr-${gi}`} points={gp} fill="none" stroke="#21262d" strokeWidth="1" />
        ))}
        {axisEndpoints.map((ep, i) => (
          <line key={`ax-${i}`} x1={cx} y1={cy} x2={ep.x} y2={ep.y} stroke="#21262d" strokeWidth="0.5" />
        ))}
        <polygon points={dataPoints} fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="2" />
        {dataPoints.split(' ').map((pt, i) => {
          const coords = pt.split(',');
          return <circle key={`dp-${i}`} cx={Number(coords[0])} cy={Number(coords[1])} r="3" fill="#10b981" />;
        })}
        {labels.map((label, i) => (
          <text key={`rl-${i}`} x={labelPositions[i].x} y={labelPositions[i].y + 3} textAnchor="middle" fill="#8b949e" fontSize="7">{label}</text>
        ))}
      </svg>
    );
  }

  // ============================================================
  // SVG: Season Comparison Bars (Tab 3)
  // Side-by-side bar chart for last 3 seasons
  // ============================================================

  function seasonComparisonBars(): React.JSX.Element {
    const maxGoals = Math.max(...playerData!.seasonComparisons.map((s) => s.goals), 1);
    const maxAssists = Math.max(...playerData!.seasonComparisons.map((s) => s.assists), 1);
    const barColors = ['#3b82f6', '#a855f7', '#10b981'];
    const barH = 14;
    const bg = 32;
    return (
      <svg width="100%" viewBox="0 0 260 115" className="w-full" preserveAspectRatio="xMidYMid meet">
        <text x="0" y="10" fill="#8b949e" fontSize="8" fontWeight="bold">Goals</text>
        {playerData!.seasonComparisons.map((s, i) => {
          const y = 14 + i * bg;
          return (
            <g key={`g-${s.season}`}>
              <text x="0" y={y + 10} fill="#c9d1d9" fontSize="7">S{s.season}</text>
              <rect x="30" y={y + 1} width="140" height={barH - 2} rx="2" fill="#21262d" />
              <rect x="30" y={y + 1} width={(s.goals / maxGoals) * 140} height={barH - 2} rx="2" fill={barColors[i]} opacity={0.8} className="transition-all duration-500" />
              <text x="176" y={y + 10} fill="#c9d1d9" fontSize="7">{s.goals}</text>
            </g>
          );
        })}
        <text x="0" y={14 + 3 * bg + 6} fill="#8b949e" fontSize="8" fontWeight="bold">Assists</text>
        {playerData!.seasonComparisons.map((s, i) => {
          const y = 14 + 3 * bg + 10 + i * bg;
          return (
            <g key={`a-${s.season}`}>
              <text x="0" y={y + 10} fill="#c9d1d9" fontSize="7">S{s.season}</text>
              <rect x="30" y={y + 1} width="140" height={barH - 2} rx="2" fill="#21262d" />
              <rect x="30" y={y + 1} width={(s.assists / maxAssists) * 140} height={barH - 2} rx="2" fill={barColors[i]} opacity={0.6} className="transition-all duration-500" />
              <text x="176" y={y + 10} fill="#c9d1d9" fontSize="7">{s.assists}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ============================================================
  // SVG: Record Progress Bars (Tab 3)
  // Compares personal records to all-time benchmarks
  // Each bar shows current progress toward the all-time record
  // with a gold marker at the record line
  // ============================================================

  function recordProgressBars(): React.JSX.Element {
    const recordKeys = Object.keys(ALL_TIME_RECORDS) as Array<keyof typeof ALL_TIME_RECORDS>;
    return (
      <svg width="100%" viewBox="0 0 280 140" className="w-full" preserveAspectRatio="xMidYMid meet">
        {recordKeys.map((key, i) => {
          const y = i * 20 + 10;
          const rv = ALL_TIME_RECORDS[key] ?? 1;
          const cv = playerData!.currentValueMap[key] ?? 0;
          const cw = Math.min(140, (cv / rv) * 140);
          const pctFill = Math.min(100, (cv / rv) * 100);
          return (
            <g key={key}>
              <text x="0" y={y + 3} fill="#8b949e" fontSize="6.5">{key}</text>
              <rect x="100" y={y - 4} width="140" height="8" rx="2" fill="#21262d" />
              <rect x="100" y={y - 4} width={cw} height="8" rx="2" fill="#10b981" opacity={0.7} className="transition-all duration-500" />
              <line x1={240} y1={y - 6} x2={240} y2={y + 6} stroke="#fbbf24" strokeWidth="1" opacity={0.5} />
              <text x="248" y={y + 3} fill="#c9d1d9" fontSize="6.5">{Math.round(pctFill)}%</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ============================================================
  // SVG: Recent Form Sparkline (Tab 3)
  // Compact line chart showing last 10 match ratings
  // Gold dots indicate matches where the player scored
  // Green dots for scoreless appearances
  // Y-axis shows rating range, X-axis shows match labels
  // ============================================================

  function recentFormSparkline(): React.JSX.Element {
    const data = playerData!.recentForm;
    const w = 280;
    const h = 60;
    const px = 25;
    const py = 10;
    const maxVal = Math.max(...data.map((d) => d.rating), 1);
    const minVal = Math.min(...data.map((d) => d.rating), 0);
    const range = Math.max(maxVal - minVal, 1);
    const linePoints = formSparklinePoints(data, w, h, px, py);

    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Baseline */}
        <line x1={px} y1={h - py} x2={w - px} y2={h - py} stroke="#21262d" strokeWidth="1" />
        {/* Y-axis labels */}
        <text x={px - 4} y={py + 3} textAnchor="end" fill="#484f58" fontSize="6">{maxVal.toFixed(1)}</text>
        <text x={px - 4} y={h - py + 3} textAnchor="end" fill="#484f58" fontSize="6">{minVal.toFixed(1)}</text>
        {/* Data line */}
        <polyline points={linePoints} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Data points with goal indicators */}
        {data.map((d, i) => {
          const x = px + (i / Math.max(data.length - 1, 1)) * (w - px * 2);
          const y = h - py - ((d.rating - minVal) / range) * (h - py * 2);
          const hasGoals = d.goals > 0;
          return (
            <g key={`rf-${i}`}>
              <circle cx={x} cy={y} r={hasGoals ? 3.5 : 2} fill={hasGoals ? '#fbbf24' : '#10b981'} stroke="#0d1117" strokeWidth="1" />
              {hasGoals && (
                <text x={x} y={y - 6} textAnchor="middle" fill="#fbbf24" fontSize="5" fontWeight="bold">{d.goals}g</text>
              )}
            </g>
          );
        })}
        {/* X-axis labels */}
        {data.map((d, i) => {
          const x = px + (i / Math.max(data.length - 1, 1)) * (w - px * 2);
          return (
            <text key={`rfl-${i}`} x={x} y={h - py + 10} textAnchor="middle" fill="#484f58" fontSize="5">{d.label}</text>
          );
        })}
      </svg>
    );
  }

  // ============================================================
  // SVG: Legend Comparison Radar (Tab 4)
  // Overlaid 6-axis radar with player + 2 legends
  // Normalized values scale each stat to 0-100 range
  // Legend key at bottom identifies each player line
  // Grid levels at 25%, 50%, 75%, and 100%
  // ============================================================

  function legendComparisonRadar(): React.JSX.Element {
    const cx = 120;
    const cy = 110;
    const maxR = 80;
    const ac = 6;
    const labels = ['Goals', 'Assists', 'Apps', 'Rating', 'Trophies', 'CleanS.'];
    const selectedLegends = [LEGENDS[0], LEGENDS[2]];
    const maxVals = { goals: 900, assists: 400, appearances: 1200, rating: 100, trophies: 50, cleanSheets: 25 };
    const playerValues = [
      (playerData!.playerLegend.goals / maxVals.goals) * 100,
      (playerData!.playerLegend.assists / maxVals.assists) * 100,
      (playerData!.playerLegend.appearances / maxVals.appearances) * 100,
      (playerData!.playerLegend.rating / maxVals.rating) * 100,
      (playerData!.playerLegend.trophies / maxVals.trophies) * 100,
      (playerData!.playerLegend.cleanSheets / maxVals.cleanSheets) * 100,
    ];
    const legendValuesList = selectedLegends.map((l) => [
      (l.goals / maxVals.goals) * 100, (l.assists / maxVals.assists) * 100,
      (l.appearances / maxVals.appearances) * 100, (l.rating / maxVals.rating) * 100,
      (l.trophies / maxVals.trophies) * 100, (l.cleanSheets / maxVals.cleanSheets) * 100,
    ]);
    const radarColors = ['#10b981', '#3b82f6', '#a855f7'];
    const radarNames = [playerData!.playerName, selectedLegends[0].name, selectedLegends[1].name];
    const gridPointsList = [0.25, 0.5, 0.75, 1.0].map((lv) => hexRadarGrid(cx, cy, maxR * lv, ac));
    const allPoints = [playerValues, ...legendValuesList].map((v) => hexRadarPoints(cx, cy, maxR, v));
    const axisEndpoints = computeRadarAxes(cx, cy, maxR, ac);
    const labelPositions = computeRadarLabels(cx, cy, maxR, ac, 18);
    return (
      <svg width="100%" viewBox="0 0 240 220" className="w-full" preserveAspectRatio="xMidYMid meet">
        {gridPointsList.map((gp, gi) => (
          <polygon key={`lg-${gi}`} points={gp} fill="none" stroke="#21262d" strokeWidth="1" />
        ))}
        {axisEndpoints.map((ep, i) => (
          <line key={`la-${i}`} x1={cx} y1={cy} x2={ep.x} y2={ep.y} stroke="#21262d" strokeWidth="0.5" />
        ))}
        {allPoints.map((pts, i) => (
          <polygon key={`lr-${i}`} points={pts} fill="none" stroke={radarColors[i]} strokeWidth="1.5" opacity={0.8} />
        ))}
        {allPoints[0].split(' ').map((pt, i) => {
          const c = pt.split(',');
          return <circle key={`ld-${i}`} cx={Number(c[0])} cy={Number(c[1])} r="3" fill={radarColors[0]} />;
        })}
        {labels.map((label, i) => (
          <text key={`ll-${i}`} x={labelPositions[i].x} y={labelPositions[i].y + 3} textAnchor="middle" fill="#8b949e" fontSize="7">{label}</text>
        ))}
        {radarNames.map((name, i) => (
          <g key={`lk-${i}`}>
            <line x1="10" y1={210 - i * 10} x2="25" y2={210 - i * 10} stroke={radarColors[i]} strokeWidth="2" />
            <text x="28" y={210 - i * 10 + 3} fill="#8b949e" fontSize="7">{name}</text>
          </g>
        ))}
      </svg>
    );
  }

  // ============================================================
  // SVG: Career Arc Area Chart (Tab 4)
  // Area chart showing rating progression across seasons
  // Y-axis shows rating, X-axis shows season labels
  // Filled polygon below the line for visual emphasis
  // ============================================================

  function careerArcAreaChart(): React.JSX.Element {
    const data = playerData!.careerArcData;
    const w = 280;
    const h = 120;
    const px = 30;
    const py = 15;
    const maxVal = Math.max(...data, 1);
    const minVal = Math.min(...data, 0);
    const linePoints = areaChartPoints(data, w, h, px, py);
    const fillPoints = areaChartFillPoints(data, w, h, px, py);
    const seasonLabels = data.map((_, i) => ({
      x: px + (i / Math.max(data.length - 1, 1)) * (w - px * 2),
      label: `S${i + 1}`,
    }));
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <line x1={px} y1={h - py} x2={w - px} y2={h - py} stroke="#21262d" strokeWidth="1" />
        <text x={px - 4} y={h - py + 3} textAnchor="end" fill="#484f58" fontSize="6">{Math.round(minVal)}</text>
        <text x={px - 4} y={py + 3} textAnchor="end" fill="#484f58" fontSize="6">{Math.round(maxVal)}</text>
        {seasonLabels.map((sl, i) => (
          <text key={`sl-${i}`} x={sl.x} y={h - py + 12} textAnchor="middle" fill="#484f58" fontSize="6">{sl.label}</text>
        ))}
        <polygon points={fillPoints} fill="rgba(16,185,129,0.1)" stroke="none" />
        <polyline points={linePoints} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
        {linePoints.split(' ').map((pt, i) => {
          const c = pt.split(',');
          return <circle key={`ap-${i}`} cx={Number(c[0])} cy={Number(c[1])} r="2.5" fill="#10b981" stroke="#0d1117" strokeWidth="1" />;
        })}
      </svg>
    );
  }

  // ============================================================
  // SVG: Hall of Fame Percentile Ring (Tab 4)
  // Shows overall percentile vs legends with tier label
  // Tiers: Developing → Promising → Excellent → World Class → Legendary
  // Animated arc transition on tab switch
  // ============================================================

  function hallOfFamePercentileRing(): React.JSX.Element {
    const pct = Math.min(100, Math.round(playerData!.avgPercentile));
    const r = 42;
    const c = ringCircumference(r);
    const offset = ringDashOffset(r, pct);
    const tier = pct >= 80 ? 'Legendary' : pct >= 60 ? 'World Class' : pct >= 40 ? 'Excellent' : pct >= 20 ? 'Promising' : 'Developing';
    const tierColor = pct >= 80 ? '#fbbf24' : pct >= 60 ? '#a855f7' : pct >= 40 ? '#10b981' : pct >= 20 ? '#3b82f6' : '#8b949e';
    return (
      <div className="flex flex-col items-center">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#21262d" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={tierColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 50 50)" className="transition-all duration-700" />
          <text x="50" y="46" textAnchor="middle" fill="#c9d1d9" fontSize="17" fontWeight="bold">{pct}%</text>
          <text x="50" y="60" textAnchor="middle" fill={tierColor} fontSize="7" fontWeight="bold">{tier}</text>
        </svg>
        <span className="text-[10px] text-[#8b949e] mt-1">Hall of Fame Score</span>
      </div>
    );
  }

  // ============================================================
  // RENDER: Tab 1 — Trophy Cabinet
  // Trophy slots grid + 3 SVG visualizations + collection breakdown
  // Layout: SVG row → breakdown card → trophy grid (2 columns)
  // ============================================================

  function renderTrophyCabinet(): React.JSX.Element {
    // Compute rarity breakdown for the summary card
    const rarityBreakdown = ['Legendary', 'Epic', 'Rare', 'Common'].map((rarity) => ({
      rarity: rarity as TrophyRarity,
      count: playerData!.trophySlots.filter((t) => t.rarity === rarity && t.unlocked).length,
      total: playerData!.trophySlots.filter((t) => t.rarity === rarity).length,
      color: RARITY_CONFIG[rarity as TrophyRarity].color,
    }));

    // Quick stats summary for the trophy cabinet
    const cabinetQuickStats = [
      { label: 'Collection', value: `${playerData!.unlockedTrophies}/${playerData!.totalTrophySlots}`, icon: 'Trophy' },
      { label: 'Legendary', value: `${rarityBreakdown.find((r) => r.rarity === 'Legendary')?.count ?? 0}`, icon: 'Crown' },
      { label: 'Epic', value: `${rarityBreakdown.find((r) => r.rarity === 'Epic')?.count ?? 0}`, icon: 'Award' },
    ];

    return (
      <div className="space-y-4">
        {/* SVG Visualizations Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">{trophyProgressRing()}</CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">{trophyRarityDonut()}</CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">{trophyTimeline()}</CardContent>
          </Card>
        </div>
        {/* Cabinet Quick Stats */}
        <div className="flex gap-2">
          {cabinetQuickStats.map((qs) => (
            <div key={qs.label} className="flex-1 bg-[#161b22] border border-[#21262d] rounded-md py-2 px-3 flex items-center gap-2">
              <span className="text-[#8b949e]">{getIconComponent(qs.icon, 'h-3.5 w-3.5')}</span>
              <div>
                <div className="text-[11px] font-bold text-[#c9d1d9] leading-none">{qs.value}</div>
                <div className="text-[7px] text-[#484f58] uppercase">{qs.label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Trophy Rarity Breakdown Summary */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2">Collection Breakdown</h3>
            <div className="flex gap-2">
              {rarityBreakdown.map((rb) => (
                <div key={rb.rarity} className="flex-1 bg-[#0d1117] border border-[#21262d] rounded-md p-2 text-center">
                  <div className="text-lg font-bold" style={{ color: rb.color }}>{rb.count}</div>
                  <div className="text-[7px] text-[#484f58] uppercase">{rb.rarity}</div>
                  <div className="text-[8px] text-[#30363d]">of {rb.total}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          {playerData!.trophySlots.map((trophy, idx) => {
            const ri = RARITY_CONFIG[trophy.rarity];
            return (
              <motion.div key={trophy.id} custom={idx} variants={fadeInItem} initial="hidden" animate="visible"
                className={`relative p-3 rounded-lg border ${trophy.unlocked ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#0d1117] border-[#21262d]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trophy.unlocked ? ri.bgColor : 'bg-[#21262d]'}`}>
                    {trophy.unlocked
                      ? <Unlock className="h-4 w-4" style={{ color: ri.color }} />
                      : <Lock className="h-4 w-4 text-[#484f58]" />}
                  </div>
                  <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${ri.textColor}`} style={{ borderColor: ri.borderColor }}>{trophy.rarity}</Badge>
                </div>
                <div className="mb-1">
                  {getIconComponent(trophy.iconName, trophy.unlocked ? 'h-5 w-5' : 'h-5 w-5 text-[#484f58]')}
                </div>
                <h4 className={`text-[11px] font-bold mb-0.5 ${trophy.unlocked ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>{trophy.name}</h4>
                <p className={`text-[9px] ${trophy.unlocked ? 'text-[#8b949e]' : 'text-[#30363d]'}`}>{trophy.description}</p>
                {trophy.unlocked && <p className="text-[8px] text-emerald-400 mt-1">Won: {trophy.yearWon}</p>}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: Tab 2 — Achievement Gallery
  // Achievement cards list + 3 SVG visualizations + category summary
  // Layout: SVG row → category overview → achievement cards
  // ============================================================

  function renderAchievementGallery(): React.JSX.Element {
    // Category unlock summary
    const catSummary = (['Attacking', 'Defending', 'Milestone', 'Team'] as AchievementCategory[]).map((cat) => {
      const items = playerData!.achievementItems.filter((a) => a.category === cat);
      const unlocked = items.filter((a) => a.unlocked).length;
      const color = CATEGORY_COLORS[cat];
      return { category: cat, unlocked, total: items.length, color };
    });

    return (
      <div className="space-y-4">
        {/* SVG Visualizations Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">{achievementCompletionRing()}</CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">{achievementCategoryBars()}</CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">{achievementStreakCalendar()}</CardContent>
          </Card>
        </div>
        {/* Achievement Category Summary */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2">Category Overview</h3>
            <div className="grid grid-cols-4 gap-2">
              {catSummary.map((cs) => (
                <div key={cs.category} className="text-center">
                  <div className="text-sm font-bold" style={{ color: cs.color }}>{cs.unlocked}/{cs.total}</div>
                  <div className="text-[7px] text-[#484f58] uppercase">{cs.category}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-2">
          {playerData!.achievementItems.map((ach, idx) => {
            const cc = CATEGORY_COLORS[ach.category];
            return (
              <motion.div key={ach.id} custom={idx} variants={fadeInItem} initial="hidden" animate="visible"
                className={`flex items-center gap-3 p-3 rounded-lg border ${ach.unlocked ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#0d1117] border-[#21262d]'}`}>
                <div className="w-1 h-10 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: ach.unlocked ? cc : '#21262d', opacity: ach.unlocked ? 0.8 : 0.4 }} />
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${ach.unlocked ? 'bg-[#21262d]' : 'bg-[#161b22]'}`}>
                  {ach.unlocked ? getIconComponent(ach.iconName, 'h-4 w-4') : <Lock className="h-4 w-4 text-[#484f58]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-[11px] font-bold ${ach.unlocked ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>{ach.name}</h4>
                    <Badge variant="outline" className="text-[7px] px-1 py-0 text-[#8b949e]" style={{ borderColor: '#21262d' }}>{ach.category}</Badge>
                  </div>
                  <p className={`text-[9px] ${ach.unlocked ? 'text-[#8b949e]' : 'text-[#30363d]'}`}>{ach.description}</p>
                  <div className="mt-1.5 h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm transition-all duration-500"
                      style={{ width: `${ach.progress}%`, backgroundColor: cc, opacity: ach.unlocked ? 1 : 0.5 }} />
                  </div>
                </div>
                <span className={`text-[10px] font-bold flex-shrink-0 ${ach.unlocked ? 'text-emerald-400' : 'text-[#484f58]'}`}>
                  {Math.round(ach.progress)}%
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: Tab 3 — Records & Milestones
  // Personal records grid + 4 SVGs + recent form sparkline + timeline
  // Layout: records grid → radar + season bars → form sparkline →
  //         record progress → notable performances → milestone timeline
  // ============================================================

  function renderRecordsMilestones(): React.JSX.Element {
    return (
      <div className="space-y-4">
        {/* Personal Records */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h3 className="text-[11px] font-bold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-400" /> Personal Records
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {playerData!.personalRecords.map((record) => (
                <div key={record.id} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5 flex flex-col items-center gap-1">
                  <span className="text-[#8b949e]">{getIconComponent(record.iconName, 'h-4 w-4')}</span>
                  <span className="text-sm font-bold text-[#c9d1d9] leading-none">{record.value}</span>
                  <span className="text-[7px] text-[#484f58] text-center leading-tight">{record.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Radar + Season Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <h4 className="text-[10px] font-bold text-[#8b949e] mb-2">Skills Radar</h4>
              {personalBestHexRadar()}
            </CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <h4 className="text-[10px] font-bold text-[#8b949e] mb-2">Season Comparison</h4>
              {seasonComparisonBars()}
            </CardContent>
          </Card>
        </div>
        {/* Recent Form Sparkline */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-[#8b949e]">Recent Form</h4>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[7px] text-[#484f58]">
                  <span className="w-2 h-2 rounded-full inline-block bg-[#10b981]" />
                  Rating
                </span>
                <span className="flex items-center gap-1 text-[7px] text-[#484f58]">
                  <span className="w-2 h-2 rounded-full inline-block bg-[#fbbf24]" />
                  Goal
                </span>
              </div>
            </div>
            {recentFormSparkline()}
          </CardContent>
        </Card>
        {/* Record Progress */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h4 className="text-[10px] font-bold text-[#8b949e] mb-2">vs All-Time Records</h4>
            {recordProgressBars()}
          </CardContent>
        </Card>
        {/* Best Performances Summary */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h3 className="text-[10px] font-bold text-[#8b949e] mb-2 flex items-center gap-1.5">
              <Flame className="h-3 w-3 text-red-400" /> Notable Performances
            </h3>
            <div className="space-y-1.5">
              {[
                { label: 'Highest Rated Match', value: playerData!.bestRating > 0 ? playerData!.bestRating.toFixed(1) : 'N/A', detail: 'Single match performance', icon: 'Star', color: 'text-amber-400' },
                { label: 'Most Goals in a Game', value: playerData!.personalRecords.find((r) => r.id === 'goals_season')?.value ?? '0', detail: 'Single match goalscoring', icon: 'Flame', color: 'text-red-400' },
                { label: 'Longest Unbeaten Run', value: `${playerData!.longestUnbeaten} matches`, detail: 'Consecutive unbeaten games', icon: 'Shield', color: 'text-blue-400' },
                { label: 'Consecutive Scoring', value: `${playerData!.consecutiveGoals} matches`, detail: 'Games with at least one goal', icon: 'Target', color: 'text-emerald-400' },
              ].map((perf) => (
                <div key={perf.label} className="flex items-center justify-between bg-[#0d1117] border border-[#21262d] rounded-md py-1.5 px-2.5">
                  <div className="flex items-center gap-2">
                    <span className={perf.color}>{getIconComponent(perf.icon, 'h-3.5 w-3.5')}</span>
                    <div>
                      <span className="text-[10px] font-bold text-[#c9d1d9]">{perf.label}</span>
                      <span className="text-[8px] text-[#484f58] ml-1.5">{perf.detail}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#c9d1d9]">{perf.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Career Milestones Timeline */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h3 className="text-[11px] font-bold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" /> Career Milestones
            </h3>
            <p className="text-[9px] text-[#484f58] mb-2">Key moments in your professional journey</p>
            <div className="space-y-2">
              {playerData!.careerMilestones.map((ms, idx) => (
                <div key={ms.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                      {getIconComponent(ms.iconName, 'h-3.5 w-3.5')}
                    </div>
                    {idx < playerData!.careerMilestones.length - 1 && <div className="w-px h-6 bg-[#21262d] mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#c9d1d9]">{ms.label}</span>
                      <Badge variant="outline" className="text-[7px] px-1 py-0 text-[#484f58]" style={{ borderColor: '#21262d' }}>Season {ms.season}</Badge>
                    </div>
                    <p className="text-[9px] text-[#8b949e]">{ms.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // RENDER: Tab 4 — Hall of Fame
  // Legend comparison + 3 SVGs + ranking + highlights + stat breakdown
  // Layout: SVG row + percentile → career arc → comparison table →
  //         legend ranking → career highlights → how you compare
  // ============================================================

  function renderHallOfFame(): React.JSX.Element {
    // Column definitions for the legend comparison table
    // Covers 6 key stats for comparing player vs all-time greats
    const statCols: Array<{ key: keyof LegendEntry; label: string }> = [
      { key: 'goals', label: 'Goals' }, { key: 'assists', label: 'Assists' },
      { key: 'appearances', label: 'Apps' }, { key: 'rating', label: 'Rating' },
      { key: 'trophies', label: 'Trophies' }, { key: 'cleanSheets', label: 'CS' },
    ];

    // Compute player ranking among legends for each stat
    const rankings = statCols.map((col) => {
      const playerVal = playerData!.playerLegend[col.key] as number;
      const legendVals = LEGENDS.map((l) => l[col.key] as number);
      const allVals = [...legendVals, playerVal];
      const sorted = [...allVals].sort((a, b) => b - a);
      const rank = sorted.indexOf(playerVal) + 1;
      const total = allVals.length;
      return { label: col.label, rank, total, playerVal };
    });

    return (
      <div className="space-y-4">
        {/* SVG Row */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <h4 className="text-[10px] font-bold text-[#8b949e] mb-2">Percentile</h4>
              {hallOfFamePercentileRing()}
            </CardContent>
          </Card>
          <Card className="bg-[#161b22] border-[#30363d] col-span-2">
            <CardContent className="p-3">
              <h4 className="text-[10px] font-bold text-[#8b949e] mb-2">Legend Comparison</h4>
              {legendComparisonRadar()}
            </CardContent>
          </Card>
        </div>
        {/* Career Arc */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h4 className="text-[10px] font-bold text-[#8b949e] mb-2">Career Arc</h4>
            {careerArcAreaChart()}
          </CardContent>
        </Card>
        {/* Legend Comparison Table */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h3 className="text-[11px] font-bold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-amber-400" /> Legend Comparison Table
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="text-left text-[#8b949e] font-normal pb-1.5 pr-2">Player</th>
                    {statCols.map((col) => (
                      <th key={col.key} className="text-center text-[#8b949e] font-normal pb-1.5 px-1">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#21262d] bg-emerald-500/5">
                    <td className="text-left text-emerald-400 font-bold py-1.5 pr-2">{playerData!.playerName}</td>
                    {statCols.map((col) => (
                      <td key={`p-${col.key}`} className="text-center text-[#c9d1d9] py-1.5 px-1">{playerData!.playerLegend[col.key]}</td>
                    ))}
                  </tr>
                  {LEGENDS.map((legend) => (
                    <tr key={legend.name} className="border-b border-[#21262d]">
                      <td className="text-left text-[#8b949e] py-1.5 pr-2">{legend.name}</td>
                      {statCols.map((col) => (
                        <td key={`${legend.name}-${col.key}`} className="text-center text-[#8b949e] py-1.5 px-1">{legend[col.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Legend Ranking Summary */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h3 className="text-[11px] font-bold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-amber-400" /> Legend Ranking
            </h3>
            <p className="text-[9px] text-[#484f58] mb-2">Your position vs {LEGENDS.length} football legends across key stats</p>
            <div className="grid grid-cols-3 gap-2">
              {rankings.map((r) => {
                const rankColor = r.rank === 1 ? 'text-amber-400' : r.rank <= 3 ? 'text-emerald-400' : 'text-[#8b949e]';
                const rankLabel = r.rank === 1 ? '1st' : r.rank === 2 ? '2nd' : r.rank === 3 ? '3rd' : `${r.rank}th`;
                return (
                  <div key={r.label} className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2 text-center">
                    <div className={`text-lg font-bold ${rankColor}`}>#{r.rank}</div>
                    <div className="text-[8px] text-[#484f58]">{r.label}</div>
                    <div className="text-[7px] text-[#30363d]">{rankLabel} of {r.total}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        {/* Career Highlights */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h3 className="text-[11px] font-bold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Career Highlights
            </h3>
            <div className="space-y-2">
              {playerData!.highlights.map((hl) => (
                <div key={hl.id} className="flex items-start gap-3 bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5">
                  <div className="w-1 self-stretch rounded-sm flex-shrink-0" style={{ backgroundColor: hl.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#c9d1d9]">{hl.title}</span>
                      <Badge variant="outline" className="text-[7px] px-1 py-0 text-[#484f58]" style={{ borderColor: '#21262d' }}>S{hl.season}</Badge>
                    </div>
                    <p className="text-[9px] text-[#8b949e] mt-0.5">{hl.description}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#484f58] flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* How You Compare — stat breakdown from precomputed data */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <h3 className="text-[11px] font-bold text-[#c9d1d9] mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> How You Compare
            </h3>
            <p className="text-[9px] text-[#484f58] mb-2">Your stats vs legendary average across {LEGENDS.length} football greats</p>
            <div className="space-y-2">
              {playerData!.statComparisons.map((stat) => {
                const diff = stat.playerVal - Math.round(stat.legendAvg);
                const dc = diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-[#8b949e]';
                const dt = diff > 0 ? `+${diff}` : diff === 0 ? '=' : `${diff}`;
                const barPct = Math.min(100, Math.max(10, (stat.playerVal / Math.max(Math.round(stat.legendAvg), 1)) * 100));
                return (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#8b949e]">{stat.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#c9d1d9]">{stat.playerVal}</span>
                        <span className="text-[8px] text-[#484f58]">avg {Math.round(stat.legendAvg)}</span>
                        <span className={`text-[9px] font-bold ${dc}`}>{dt}</span>
                      </div>
                    </div>
                    {/* Comparison bar */}
                    <div className="h-1 bg-[#21262d] rounded-sm overflow-hidden">
                      <div className="h-full rounded-sm transition-all duration-500"
                        style={{ width: `${barPct}%`, backgroundColor: diff >= 0 ? '#10b981' : '#ef4444', opacity: 0.6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Tab Content Switcher
  // Routes active tab to its render function
  // Uses AnimatePresence for smooth tab transitions (opacity only)
  // ============================================================

  function renderTabContent(): React.JSX.Element {
    switch (activeTab) {
      case 'cabinet': return renderTrophyCabinet();
      case 'achievements': return renderAchievementGallery();
      case 'records': return renderRecordsMilestones();
      case 'halloffame': return renderHallOfFame();
      default: return renderTrophyCabinet();
    }
  }

  // ============================================================
  // Main Render
  // Page header → hero summary → career stats → tabs → content → footer
  // ============================================================

  return (
    <div className="max-w-lg mx-auto px-3 py-4 space-y-4">
      {/* Page Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-[#c9d1d9]">Virtual Trophy Tour</h1>
        </div>
        <p className="text-[10px] text-[#484f58]">Explore your career achievements, records, and legacy</p>
      </motion.div>

      {/* Career Hero Summary */}
      {careerHeroSummary()}

      {/* Career Summary Stats */}
      {careerSummaryStats()}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#0d1117] border border-[#21262d] rounded-lg p-1">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-[10px] font-medium transition-opacity duration-200 ${
              activeTab === tab.id ? 'bg-[#21262d] text-[#c9d1d9]' : 'text-[#484f58] opacity-70'
            }`}
            aria-label={tab.label}
            aria-pressed={activeTab === tab.id}
          >
            {getIconComponent(tab.iconName, 'h-3.5 w-3.5')}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content with AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} variants={fadeSwitch} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }}>
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>

      {/* Footer Stats Bar */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1 text-[9px] text-[#484f58]">
            <Trophy className="h-3 w-3" />
            <span>{playerData!.unlockedTrophies}/{playerData!.totalTrophySlots}</span>
          </div>
          <div className="w-px h-3 bg-[#21262d]" />
          <div className="flex items-center gap-1 text-[9px] text-[#484f58]">
            <Award className="h-3 w-3" />
            <span>{playerData!.unlockedAchievements}/{playerData!.totalAchievements}</span>
          </div>
          <div className="w-px h-3 bg-[#21262d]" />
          <div className="flex items-center gap-1 text-[9px] text-[#484f58]">
            <Shield className="h-3 w-3" />
            <span>{playerData!.totalApps} apps</span>
          </div>
          <div className="w-px h-3 bg-[#21262d]" />
          <div className="flex items-center gap-1 text-[9px] text-[#484f58]">
            <Flame className="h-3 w-3" />
            <span>{playerData!.totalGoals} goals</span>
          </div>
          <div className="w-px h-3 bg-[#21262d]" />
          <div className="flex items-center gap-1 text-[9px] text-[#484f58]">
            <Star className="h-3 w-3" />
            <span>Season {playerData!.currentSeason}</span>
          </div>
        </div>
        <div className="flex items-center justify-center mt-2 pt-2 border-t border-[#21262d]">
          <p className="text-[8px] text-[#30363d]">
            Virtual Trophy Tour &middot; {playerData!.clubName} &middot; {playerData!.totalTrophies} trophies &middot; {playerData!.totalGoals + playerData!.totalAssists} goal contributions
          </p>
        </div>
      </motion.div>
    </div>
  );
}
