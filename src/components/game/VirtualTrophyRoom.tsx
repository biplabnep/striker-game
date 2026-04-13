'use client';

// ============================================================
// Virtual Trophy Room — Immersive career achievements display
// An expanded trophy room experience with 4 tabs, SVG visuals,
// deterministic data from game state, and award ceremony simulation.
// ============================================================

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Star,
  Lock,
  Eye,
  Crown,
  Target,
  Calendar,
  Flame,
  Shield,
  Swords,
  TrendingUp,
  Users,
  Sparkles,
  Gem,
  ChevronRight,
  Heart,
  Clock,
  Zap,
  BarChart3,
  Skull,
  GemIcon,
  CircleDot,
} from 'lucide-react';

// ============================================================
// Seeded Random Helpers
// Deterministic data generation from game state values
// ============================================================

/** Simple seeded PRNG (mulberry32) */
function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derive a numeric seed from multiple game state values */
function deriveSeed(values: number[]): number {
  return values.reduce((acc, v, i) => acc + (v * (i + 1) * 17) | 0, 0);
}

/** Pick a deterministic item from an array */
function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Seeded integer within [min, max] inclusive */
function seededInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// ============================================================
// Type Definitions
// ============================================================

type TrophyRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
type HallOfFameStatus = 'Locked' | 'Eligible' | 'Inducted';

interface TrophySlot {
  id: string;
  name: string;
  competition: string;
  seasonWon: number | null;
  description: string;
  rarity: TrophyRarity;
  unlocked: boolean;
  winningGoals?: number;
  winningAssists?: number;
  winningRating?: number;
}

interface MedalSlot {
  id: string;
  name: string;
  category: string;
  season: number | null;
  description: string;
  points: number;
  unlocked: boolean;
  medalType: 'gold' | 'silver' | 'bronze';
}

interface RecordEntry {
  label: string;
  current: number;
  target: number;
  icon: React.ReactNode;
  unit: string;
}

interface MilestoneEntry {
  label: string;
  achievedAt: number | null;
  season: number | null;
  icon: React.ReactNode;
}

interface AwardNomination {
  id: string;
  name: string;
  category: string;
  description: string;
  nominated: boolean;
  accepted: boolean;
}

interface LegendComparison {
  name: string;
  trophyCount: number;
  era: string;
  icon: string;
}

interface CareerHighlight {
  id: string;
  title: string;
  description: string;
  season: number | null;
  icon: React.ReactNode;
}

// ============================================================
// Trophy Definitions (8 trophies)
// ============================================================

const TROPHY_DEFINITIONS: Omit<TrophySlot, 'seasonWon' | 'unlocked' | 'winningGoals' | 'winningAssists' | 'winningRating'>[] = [
  {
    id: 'league_title',
    name: 'League Title',
    competition: 'Domestic League',
    description: 'Champions of the domestic league, finishing top of the table with the most points accumulated over the full season.',
    rarity: 'Legendary',
  },
  {
    id: 'champions_league',
    name: 'Champions League',
    competition: 'European Competition',
    description: 'The pinnacle of European club football. Overcome the best teams across the continent in group stages and knockout rounds.',
    rarity: 'Legendary',
  },
  {
    id: 'domestic_cup',
    name: 'Domestic Cup',
    competition: 'National Cup Competition',
    description: 'Lift the national cup trophy by navigating through a single-elimination tournament against domestic rivals.',
    rarity: 'Epic',
  },
  {
    id: 'super_cup',
    name: 'Super Cup',
    competition: 'Season Opener',
    description: 'The traditional curtain-raiser contested by the league champions and the cup winners at the start of the season.',
    rarity: 'Epic',
  },
  {
    id: 'club_world_cup',
    name: 'Club World Cup',
    competition: 'Intercontinental Competition',
    description: 'Represent your confederation on the global stage against champions from every corner of the footballing world.',
    rarity: 'Legendary',
  },
  {
    id: 'golden_boot',
    name: 'Golden Boot',
    competition: 'Individual League Award',
    description: 'Finish as the outright top scorer in the league, outscoring every other player across the entire campaign.',
    rarity: 'Rare',
  },
  {
    id: 'ballon_dor',
    name: 'Ballon d\'Or',
    competition: 'Individual World Award',
    description: 'Recognised as the best player in the world by an international panel of journalists, captains, and coaches.',
    rarity: 'Legendary',
  },
  {
    id: 'player_of_year',
    name: 'Player of the Year',
    competition: 'Individual Season Award',
    description: 'Voted the best performing player of the domestic season based on consistent excellence and match-winning displays.',
    rarity: 'Epic',
  },
];

// ============================================================
// Medal Definitions (12 medals)
// ============================================================

const MEDAL_DEFINITIONS: Omit<MedalSlot, 'season' | 'unlocked'>[] = [
  { id: 'league_winner_gold', name: 'League Champion', category: 'League', description: 'Gold medal awarded to every player of the title-winning squad.', points: 10, medalType: 'gold' },
  { id: 'league_runner_silver', name: 'League Runner-Up', category: 'League', description: 'Silver medal for finishing as runners-up in the league.', points: 6, medalType: 'silver' },
  { id: 'cl_winner_gold', name: 'Champions League Winner', category: 'Continental', description: 'Gold medal for conquering Europe\'s premier club competition.', points: 15, medalType: 'gold' },
  { id: 'cl_finalist_silver', name: 'Champions League Finalist', category: 'Continental', description: 'Silver medal for reaching the continental final.', points: 9, medalType: 'silver' },
  { id: 'cup_winner_gold', name: 'Cup Champion', category: 'Domestic Cup', description: 'Gold medal for lifting the domestic cup.', points: 8, medalType: 'gold' },
  { id: 'intl_caps_bronze', name: 'International Caps', category: 'International', description: 'Bronze medal awarded after 10 international appearances for your country.', points: 5, medalType: 'bronze' },
  { id: 'intl_goals_silver', name: 'International Goalscorer', category: 'International', description: 'Silver medal for scoring 5+ goals at international level.', points: 7, medalType: 'silver' },
  { id: 'top_scorer_gold', name: 'League Top Scorer', category: 'Individual', description: 'Gold medal for finishing as the league\'s highest goalscorer.', points: 12, medalType: 'gold' },
  { id: 'best_player_gold', name: 'Season Best Player', category: 'Individual', description: 'Gold medal awarded to the season\'s most outstanding individual performer.', points: 11, medalType: 'gold' },
  { id: 'assists_silver', name: 'Assist Leader', category: 'Individual', description: 'Silver medal for providing the most assists in the league season.', points: 8, medalType: 'silver' },
  { id: 'clean_sheet_bronze', name: 'Clean Sheet Record', category: 'Individual', description: 'Bronze medal for keeping 10+ clean sheets in a single season.', points: 5, medalType: 'bronze' },
  { id: 'fair_play_bronze', name: 'Fair Play Award', category: 'Individual', description: 'Bronze medal for exemplary conduct with zero red cards all season.', points: 4, medalType: 'bronze' },
];

// ============================================================
// Rarity Colors
// ============================================================

const RARITY_STYLES: Record<TrophyRarity, { border: string; bg: string; text: string; badge: string }> = {
  Common: { border: 'border-[#30363d]', bg: 'bg-[#21262d]', text: 'text-[#8b949e]', badge: 'bg-[#30363d] text-[#8b949e]' },
  Rare: { border: 'border-sky-500/30', bg: 'bg-sky-500/10', text: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300' },
  Epic: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  Legendary: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' },
};

// ============================================================
// SVG Trophy Icons — Different shapes for each trophy type
// ============================================================

function LeagueTitleIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M14 6H34V22C34 30 28 36 24 38C20 36 14 30 14 22V6Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
      <path d="M14 10H9C9 10 7 17 11 22H14" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M34 10H39C39 10 41 17 37 22H34" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="21" y="38" width="6" height="3" rx="1" fill="#A16207" />
      <rect x="17" y="41" width="14" height="3" rx="1" fill="#854D0E" />
      <path d="M17 6H31" stroke="#FDE047" strokeWidth="1" opacity="0.5" />
      <circle cx="24" cy="18" r="4" fill="#FDE047" opacity="0.3" />
      <path d="M22 16L24 20L26 16" stroke="#FDE047" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

function ChampionsLeagueIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M24 4L10 12V28C10 36 16 42 24 44C32 42 38 36 38 28V12L24 4Z" fill="#1E3A5F" stroke="#2563EB" strokeWidth="1.5" />
      <path d="M24 10L16 16V26C16 30 19 34 24 36C29 34 32 30 32 26V16L24 10Z" fill="#2563EB" opacity="0.3" />
      <path d="M24 14L14 20V30C14 36 18 40 24 42C30 40 34 36 34 30V20L24 14Z" fill="none" stroke="#60A5FA" strokeWidth="0.8" />
      <polygon points="24,16 26,22 32,22 27,26 29,32 24,28 19,32 21,26 16,22 22,22" fill="#FDE047" opacity="0.8" />
    </svg>
  );
}

function DomesticCupIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <ellipse cx="24" cy="12" rx="12" ry="4" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.5" />
      <path d="M12 12V28C12 32 17 36 24 38C31 36 36 32 36 28V12" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.5" />
      <path d="M12 18H36" stroke="#FCA5A5" strokeWidth="0.5" opacity="0.4" />
      <path d="M12 24H36" stroke="#FCA5A5" strokeWidth="0.5" opacity="0.4" />
      <rect x="21" y="38" width="6" height="3" rx="1" fill="#991B1B" />
      <rect x="18" y="41" width="12" height="3" rx="1" fill="#7F1D1D" />
    </svg>
  );
}

function SuperCupIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="16" y="6" width="16" height="22" rx="2" fill="#7C3AED" stroke="#6D28D9" strokeWidth="1.5" />
      <rect x="19" y="10" width="10" height="14" rx="1" fill="#8B5CF6" opacity="0.4" />
      <circle cx="24" cy="17" r="3" fill="#C4B5FD" opacity="0.5" />
      <rect x="21" y="28" width="6" height="3" rx="1" fill="#5B21B6" />
      <rect x="17" y="31" width="14" height="3" rx="1" fill="#4C1D95" />
      <path d="M10 16L16 20L10 24" stroke="#7C3AED" strokeWidth="1" opacity="0.3" />
      <path d="M38 16L32 20L38 24" stroke="#7C3AED" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

function ClubWorldCupIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="18" r="14" fill="#B45309" stroke="#92400E" strokeWidth="1.5" />
      <circle cx="24" cy="18" r="9" fill="#D97706" opacity="0.5" />
      <circle cx="24" cy="18" r="4" fill="#FDE047" opacity="0.6" />
      <path d="M24 4V8" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M38 10L35 13" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 10L13 13" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="20" y="32" width="8" height="3" rx="1" fill="#78350F" />
      <rect x="16" y="35" width="16" height="3" rx="1" fill="#451A03" />
    </svg>
  );
}

function GoldenBootIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M18 8C18 8 12 14 12 22C12 30 18 38 22 42" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 8C22 8 16 14 16 22C16 28 20 34 22 38" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M26 8H34V18C34 22 30 26 26 26V8Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
      <path d="M26 12H32" stroke="#FDE047" strokeWidth="0.8" opacity="0.4" />
      <circle cx="24" cy="10" r="2" fill="#FDE047" opacity="0.5" />
      <rect x="16" y="42" width="16" height="3" rx="1" fill="#92400E" />
    </svg>
  );
}

function BallonDorIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="18" r="13" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
      <circle cx="24" cy="18" r="8" fill="#FDE047" opacity="0.4" />
      <path d="M24 10L26 16H32L27 20L29 26L24 22L19 26L21 20L16 16H22L24 10Z" fill="#FEF08A" opacity="0.6" />
      <path d="M24 31V38" stroke="#CA8A04" strokeWidth="1.5" />
      <rect x="18" y="38" width="12" height="4" rx="1" fill="#A16207" />
      <rect x="16" y="42" width="16" height="2" rx="1" fill="#854D0E" />
    </svg>
  );
}

function PlayerOfYearIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M15 8H33V24C33 32 28 38 24 40C20 38 15 32 15 24V8Z" fill="#10B981" stroke="#059669" strokeWidth="1.5" />
      <path d="M15 12H11C11 12 9 18 13 22H15" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M33 12H37C37 12 39 18 35 22H33" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="21" y="40" width="6" height="3" rx="1" fill="#047857" />
      <rect x="17" y="43" width="14" height="2" rx="1" fill="#065F46" />
      <path d="M20 8H28" stroke="#6EE7B7" strokeWidth="1" opacity="0.4" />
      <circle cx="24" cy="20" r="5" fill="#6EE7B7" opacity="0.2" />
      <path d="M22 18L24 22L26 18" stroke="#6EE7B7" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

function LockedTrophyIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M15 8H33V24C33 32 28 38 24 40C20 38 15 32 15 24V8Z" fill="#21262d" stroke="#30363d" strokeWidth="1.5" />
      <path d="M15 12H11C11 12 9 18 13 22H15" stroke="#30363d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M33 12H37C37 12 39 18 35 22H33" stroke="#30363d" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="21" y="40" width="6" height="3" rx="1" fill="#30363d" />
      <rect x="17" y="43" width="14" height="2" rx="1" fill="#21262d" />
      <rect x="20" y="14" width="8" height="7" rx="1" fill="none" stroke="#484f58" strokeWidth="1" />
      <path d="M21 14V11C21 9 22.5 7 24 7C25.5 7 27 9 27 11V14" stroke="#484f58" strokeWidth="1" />
    </svg>
  );
}

/** Map trophy ID to its SVG icon component */
function getTrophySvgIcon(trophyId: string, unlocked: boolean, size = 40): React.ReactNode {
  if (!unlocked) return <LockedTrophyIcon size={size} />;
  switch (trophyId) {
    case 'league_title': return <LeagueTitleIcon size={size} />;
    case 'champions_league': return <ChampionsLeagueIcon size={size} />;
    case 'domestic_cup': return <DomesticCupIcon size={size} />;
    case 'super_cup': return <SuperCupIcon size={size} />;
    case 'club_world_cup': return <ClubWorldCupIcon size={size} />;
    case 'golden_boot': return <GoldenBootIcon size={size} />;
    case 'ballon_dor': return <BallonDorIcon size={size} />;
    case 'player_of_year': return <PlayerOfYearIcon size={size} />;
    default: return <LockedTrophyIcon size={size} />;
  }
}

// ============================================================
// SVG Medal Icon with Ribbon
// ============================================================

function MedalSvgIcon({ size = 32, color = '#EAB308' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M10 2L16 8L22 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 2H20L22 8L16 11L10 8L12 2Z" fill={color} opacity="0.5" />
      <circle cx="16" cy="20" r="10" fill={color} opacity="0.7" />
      <circle cx="16" cy="20" r="7" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="16" cy="20" r="3" fill={color} opacity="0.2" />
    </svg>
  );
}

function LockedMedalIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M10 2L16 8L22 2" stroke="#30363d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 2H20L22 8L16 11L10 8L12 2Z" fill="#30363d" opacity="0.5" />
      <circle cx="16" cy="20" r="10" fill="#21262d" stroke="#30363d" strokeWidth="1" />
      <Lock className="text-[#484f58]" x={12} y={16} width={8} height={8} />
    </svg>
  );
}

function getMedalColor(type: 'gold' | 'silver' | 'bronze'): string {
  switch (type) {
    case 'gold': return '#EAB308';
    case 'silver': return '#9CA3AF';
    case 'bronze': return '#D97706';
  }
}

// ============================================================
// Display Shelf SVG — 3 featured trophies on a wooden shelf
// ============================================================

function DisplayShelf({ trophies }: { trophies: { icon: React.ReactNode; name: string }[] }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-[#c9d1d9]">Featured Trophies</h3>
      </div>
      <div className="relative">
        {/* Shelf surface */}
        <svg viewBox="0 0 320 120" className="w-full" fill="none">
          {/* Shelf wood */}
          <rect x="10" y="88" width="300" height="12" rx="2" fill="#78350F" />
          <rect x="10" y="88" width="300" height="3" rx="1" fill="#92400E" />
          {/* Shelf brackets */}
          <path d="M30 100L30 115L15 115" stroke="#5C2D0E" strokeWidth="2" strokeLinecap="round" />
          <path d="M290 100L290 115L305 115" stroke="#5C2D0E" strokeWidth="2" strokeLinecap="round" />
          {/* Shelf shadow */}
          <rect x="12" y="100" width="296" height="4" rx="1" fill="#451A03" opacity="0.4" />
        </svg>
        {/* Trophy slots on top of shelf */}
        <div className="absolute top-0 left-0 right-0 flex items-end justify-around px-8" style={{ height: 88 }}>
          {trophies.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-14 flex items-center justify-center">
                {t.icon}
              </div>
              <span className="text-[8px] text-[#8b949e] text-center leading-tight max-w-[80px]">{t.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
      {trophies.length === 0 && (
        <p className="text-center text-xs text-[#484f58] mt-2">Win trophies to display them on your shelf</p>
      )}
    </div>
  );
}

// ============================================================
// Animation Variants (opacity only)
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

export default function VirtualTrophyRoom() {
  const gameState = useGameStore((s) => s.gameState);
  const [activeTab, setActiveTab] = useState<'trophies' | 'medals' | 'records' | 'ceremony'>('trophies');
  const [selectedTrophy, setSelectedTrophy] = useState<string | null>(null);
  const [acceptedAwards, setAcceptedAwards] = useState<Set<string>>(new Set());

  // ============================================================
  // Derive all data deterministically from game state
  // ============================================================

  const data = useMemo(() => {
    if (!gameState) return null;

    const { player, currentClub, currentSeason, currentWeek, seasons, recentResults } = gameState;
    const { careerStats, seasonStats } = player;
    const { internationalCareer } = gameState;
    const { achievements } = gameState;

    // Seed from multiple game state values
    const seed = deriveSeed([
      player.age,
      currentSeason,
      careerStats.totalGoals,
      careerStats.totalAssists,
      careerStats.totalAppearances,
      player.overall,
      player.reputation,
    ]);
    const rng = createSeededRandom(seed);

    // --- Determine unlocked trophies based on career stats ---
    const trophySlots: TrophySlot[] = TROPHY_DEFINITIONS.map((def) => {
      // Deterministic unlock: use career stats and seasons
      let unlocked = false;
      let seasonWon: number | null = null;

      if (def.id === 'league_title' && careerStats.trophies.length >= 1) {
        unlocked = true;
        seasonWon = careerStats.trophies[0]?.season ?? currentSeason;
      } else if (def.id === 'champions_league' && careerStats.trophies.length >= 3) {
        unlocked = true;
        seasonWon = careerStats.trophies[2]?.season ?? currentSeason;
      } else if (def.id === 'domestic_cup' && careerStats.trophies.length >= 2) {
        unlocked = true;
        seasonWon = careerStats.trophies[1]?.season ?? currentSeason;
      } else if (def.id === 'super_cup' && careerStats.trophies.length >= 4) {
        unlocked = true;
        seasonWon = careerStats.trophies[3]?.season ?? null;
      } else if (def.id === 'club_world_cup' && player.reputation >= 90) {
        unlocked = true;
        seasonWon = Math.max(1, currentSeason - 1);
      } else if (def.id === 'golden_boot' && careerStats.totalGoals >= 25) {
        unlocked = true;
        seasonWon = seasons.find((s) => s.playerStats.goals >= 20)?.number ?? null;
      } else if (def.id === 'ballon_dor' && player.overall >= 92 && careerStats.totalGoals >= 30) {
        unlocked = true;
        seasonWon = Math.max(1, currentSeason - 2);
      } else if (def.id === 'player_of_year' && player.overall >= 85 && careerStats.totalAppearances >= 50) {
        unlocked = true;
        seasonWon = seasons.find((s) => s.playerStats.averageRating >= 7.5)?.number ?? null;
      }

      // Generate winning season stats deterministically
      const winningGoals = unlocked ? seededInt(careerStats.totalGoals - 10, careerStats.totalGoals + 5, rng) : undefined;
      const winningAssists = unlocked ? seededInt(careerStats.totalAssists - 5, careerStats.totalAssists + 3, rng) : undefined;
      const winningRating = unlocked ? +(6.5 + rng() * 2.5).toFixed(1) : undefined;

      return {
        ...def,
        seasonWon,
        unlocked,
        winningGoals: Math.max(0, winningGoals ?? 0),
        winningAssists: Math.max(0, winningAssists ?? 0),
        winningRating: Math.max(6.0, winningRating ?? 6.0),
      };
    });

    // --- Determine unlocked medals ---
    const medalSlots: MedalSlot[] = MEDAL_DEFINITIONS.map((def) => {
      let unlocked = false;
      let season: number | null = null;

      switch (def.id) {
        case 'league_winner_gold':
          unlocked = careerStats.trophies.length >= 1;
          season = careerStats.trophies[0]?.season ?? null;
          break;
        case 'league_runner_silver':
          unlocked = careerStats.totalAppearances >= 30 && player.reputation >= 40;
          season = seasons.length >= 2 ? seasons[1]?.number : null;
          break;
        case 'cl_winner_gold':
          unlocked = careerStats.trophies.length >= 3;
          season = careerStats.trophies[2]?.season ?? null;
          break;
        case 'cl_finalist_silver':
          unlocked = careerStats.trophies.length >= 2;
          season = careerStats.trophies[1]?.season ?? null;
          break;
        case 'cup_winner_gold':
          unlocked = careerStats.trophies.length >= 2;
          season = careerStats.trophies[1]?.season ?? null;
          break;
        case 'intl_caps_bronze':
          unlocked = internationalCareer.caps >= 10;
          season = currentSeason;
          break;
        case 'intl_goals_silver':
          unlocked = internationalCareer.goals >= 5;
          season = currentSeason;
          break;
        case 'top_scorer_gold':
          unlocked = careerStats.totalGoals >= 25;
          season = seasons.find((s) => s.playerStats.goals >= 20)?.number ?? null;
          break;
        case 'best_player_gold':
          unlocked = player.overall >= 85 && careerStats.totalAppearances >= 40;
          season = seasons.find((s) => s.playerStats.averageRating >= 7.8)?.number ?? null;
          break;
        case 'assists_silver':
          unlocked = careerStats.totalAssists >= 15;
          season = seasons.find((s) => s.playerStats.assists >= 10)?.number ?? null;
          break;
        case 'clean_sheet_bronze':
          unlocked = careerStats.totalCleanSheets >= 10;
          season = currentSeason;
          break;
        case 'fair_play_bronze':
          unlocked = careerStats.totalAppearances >= 20 && seasonStats.redCards === 0;
          season = currentSeason;
          break;
      }

      return { ...def, season, unlocked };
    });

    // --- Records ---
    const isGK = player.position === 'GK';
    const records: RecordEntry[] = [
      {
        label: 'Career Goals',
        current: careerStats.totalGoals,
        target: isGK ? 5 : 200,
        icon: <Target className="h-4 w-4 text-emerald-400" />,
        unit: 'goals',
      },
      {
        label: 'Career Assists',
        current: careerStats.totalAssists,
        target: isGK ? 10 : 100,
        icon: <Zap className="h-4 w-4 text-sky-400" />,
        unit: 'assists',
      },
      {
        label: 'Clean Sheets',
        current: careerStats.totalCleanSheets,
        target: isGK ? 100 : 20,
        icon: <Shield className="h-4 w-4 text-amber-400" />,
        unit: 'sheets',
      },
      {
        label: 'Appearances',
        current: careerStats.totalAppearances,
        target: 500,
        icon: <Users className="h-4 w-4 text-purple-400" />,
        unit: 'apps',
      },
      {
        label: 'Hat-tricks',
        current: Math.floor(careerStats.totalGoals / 12),
        target: isGK ? 1 : 15,
        icon: <Flame className="h-4 w-4 text-red-400" />,
        unit: 'hat-tricks',
      },
      {
        label: 'Win Rate',
        current: recentResults.length > 0
          ? Math.round((recentResults.filter((r) => {
              const isHome = r.homeClub.id === currentClub.id;
              return isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
            }).length / recentResults.length) * 100)
          : 0,
        target: 70,
        icon: <TrendingUp className="h-4 w-4 text-emerald-400" />,
        unit: '%',
      },
    ];

    // --- Milestones timeline ---
    const milestoneThresholds = [
      { label: 'First Appearance', threshold: 1, type: 'appearances', icon: <Calendar className="h-4 w-4 text-[#8b949e]" /> },
      { label: 'First Goal', threshold: 1, type: 'goals', icon: <Target className="h-4 w-4 text-emerald-400" /> },
      { label: '10 Goals', threshold: 10, type: 'goals', icon: <Flame className="h-4 w-4 text-red-400" /> },
      { label: '50 Goals', threshold: 50, type: 'goals', icon: <Flame className="h-4 w-4 text-amber-400" /> },
      { label: '100 Goals', threshold: 100, type: 'goals', icon: <Sparkles className="h-4 w-4 text-yellow-400" /> },
      { label: '50 Appearances', threshold: 50, type: 'appearances', icon: <Users className="h-4 w-4 text-purple-400" /> },
      { label: '100 Appearances', threshold: 100, type: 'appearances', icon: <Users className="h-4 w-4 text-sky-400" /> },
      { label: '25 Assists', threshold: 25, type: 'assists', icon: <Zap className="h-4 w-4 text-emerald-400" /> },
    ];

    const milestones: MilestoneEntry[] = milestoneThresholds.map((m) => {
      let currentVal = 0;
      if (m.type === 'goals') currentVal = careerStats.totalGoals;
      else if (m.type === 'appearances') currentVal = careerStats.totalAppearances;
      else if (m.type === 'assists') currentVal = careerStats.totalAssists;

      const achieved = currentVal >= m.threshold;
      return {
        label: m.label,
        achievedAt: achieved ? m.threshold : null,
        season: achieved ? seededInt(1, currentSeason, rng) : null,
        icon: m.icon,
      };
    });

    // --- Season progression chart data (last 5 seasons) ---
    const chartSeasons = seasons.slice(-5);
    const seasonProgression = chartSeasons.map((s) => ({
      season: s.number,
      goals: s.playerStats.goals,
      assists: s.playerStats.assists,
      rating: s.playerStats.averageRating,
      appearances: s.playerStats.appearances,
    }));

    // If less than 5 seasons, generate deterministic placeholder data
    while (seasonProgression.length < 5) {
      const sNum = seasonProgression.length + 1;
      seasonProgression.push({
        season: sNum,
        goals: seededInt(0, 5, rng),
        assists: seededInt(0, 3, rng),
        rating: +(5.5 + rng() * 2).toFixed(1),
        appearances: seededInt(5, 20, rng),
      });
    }

    // --- Club legends comparison ---
    const clubLegends: LegendComparison[] = [
      { name: 'Club Legend A', trophyCount: seededInt(5, 15, rng), era: '1990-2005', icon: '⚽' },
      { name: 'Club Legend B', trophyCount: seededInt(3, 12, rng), era: '2005-2020', icon: '🏆' },
      { name: 'Club Legend C', trophyCount: seededInt(2, 10, rng), era: '1975-1990', icon: '🌟' },
    ];

    // --- Award ceremony nominations ---
    const awardNominations: AwardNomination[] = [
      {
        id: 'best_striker',
        name: 'Best Striker',
        category: 'Position Award',
        description: player.position === 'ST' || player.position === 'CF'
          ? `Recognition as the most lethal striker in the league. ${player.name} has been a consistent threat with ${careerStats.totalGoals} career goals.`
          : 'Awarded to the league\'s most prolific goalscorer this season.',
        nominated: player.position === 'ST' || player.position === 'CF' || player.position === 'LW' || player.position === 'RW',
        accepted: false,
      },
      {
        id: 'best_midfielder',
        name: 'Best Midfielder',
        category: 'Position Award',
        description: `Honoring the league's most creative and influential midfielder. ${player.name} has contributed ${careerStats.totalAssists} assists in their career.`,
        nominated: ['CM', 'CAM', 'CDM', 'LM', 'RM'].includes(player.position),
        accepted: false,
      },
      {
        id: 'best_defender',
        name: 'Best Defender',
        category: 'Position Award',
        description: 'Awarded to the defender with the most consistent performances, cleanest defensive record, and leadership on the pitch.',
        nominated: ['CB', 'LB', 'RB'].includes(player.position),
        accepted: false,
      },
      {
        id: 'fan_favorite',
        name: 'Fan Favorite',
        category: 'Special Award',
        description: `A special award voted by the fans. ${player.name} has earned the love and admiration of supporters through ${careerStats.totalAppearances} appearances.`,
        nominated: player.reputation >= 50,
        accepted: false,
      },
      {
        id: 'legend_status',
        name: 'Legend Status',
        category: 'Hall of Fame',
        description: `The ultimate recognition for a career of sustained excellence. ${player.name} would join an elite group of club legends with ${careerStats.trophies.length} trophies.`,
        nominated: careerStats.seasonsPlayed >= 8 && careerStats.trophies.length >= 5,
        accepted: false,
      },
    ];

    // --- Hall of Fame status ---
    let hofStatus: HallOfFameStatus = 'Locked';
    if (careerStats.seasonsPlayed >= 10 && careerStats.trophies.length >= 5 && player.reputation >= 80) {
      hofStatus = 'Inducted';
    } else if (careerStats.seasonsPlayed >= 5 && careerStats.trophies.length >= 2) {
      hofStatus = 'Eligible';
    }

    // --- Career legacy score (0-100) ---
    const trophyScore = Math.min((careerStats.trophies.length / 15) * 30, 30);
    const recordScore = Math.min((careerStats.totalGoals / 200) * 15 + (careerStats.totalAssists / 100) * 10, 25);
    const longevityScore = Math.min((careerStats.seasonsPlayed / 15) * 20, 20);
    const impactScore = Math.min((player.reputation / 100) * 15, 15);
    const cultureScore = Math.min((achievements.filter((a) => a.unlocked).length / 12) * 10, 10);
    const legacyScore = Math.round(trophyScore + recordScore + longevityScore + impactScore + cultureScore);

    // --- Prestige level ---
    let prestigeLevel = 'Rising Star';
    let prestigeColor = 'text-emerald-400';
    if (legacyScore >= 80) { prestigeLevel = 'Living Legend'; prestigeColor = 'text-yellow-400'; }
    else if (legacyScore >= 60) { prestigeLevel = 'World Class'; prestigeColor = 'text-purple-400'; }
    else if (legacyScore >= 40) { prestigeLevel = 'Established'; prestigeColor = 'text-sky-400'; }
    else if (legacyScore >= 20) { prestigeLevel = 'Promising'; prestigeColor = 'text-emerald-400'; }

    // --- Career highlights ---
    const highlights: CareerHighlight[] = [
      {
        id: 'first_goal',
        title: 'First Professional Goal',
        description: 'Scored your first ever competitive goal, a moment that every player remembers forever.',
        season: seasons.find((s) => s.playerStats.goals > 0)?.number ?? null,
        icon: <Target className="h-4 w-4 text-emerald-400" />,
      },
      {
        id: 'first_trophy',
        title: 'First Career Trophy',
        description: `Won your first piece of silverware, ${careerStats.trophies[0]?.name ?? 'a domestic title'}, cementing your place in history.`,
        season: careerStats.trophies[0]?.season ?? null,
        icon: <Trophy className="h-4 w-4 text-yellow-400" />,
      },
      {
        id: 'debut',
        title: 'Professional Debut',
        description: `Made your professional debut for ${currentClub.name}, stepping onto the pitch for the first time in a competitive match.`,
        season: 1,
        icon: <Calendar className="h-4 w-4 text-sky-400" />,
      },
      {
        id: 'century',
        title: 'Century of Appearances',
        description: `Reached 100 career appearances, a testament to consistency, durability, and professional dedication.`,
        season: careerStats.totalAppearances >= 100 ? seededInt(3, currentSeason, rng) : null,
        icon: <Award className="h-4 w-4 text-purple-400" />,
      },
    ];

    // --- Total medal points ---
    const totalMedalPoints = medalSlots.filter((m) => m.unlocked).reduce((sum, m) => sum + m.points, 0);

    // --- Featured trophies for shelf (up to 3 unlocked) ---
    const featuredTrophies = trophySlots
      .filter((t) => t.unlocked)
      .slice(0, 3)
      .map((t) => ({
        icon: getTrophySvgIcon(t.id, true, 36),
        name: t.name,
      }));

    return {
      playerName: player.name,
      clubName: currentClub.name,
      clubLogo: currentClub.logo,
      currentSeason,
      currentWeek,
      age: player.age,
      position: player.position,
      overall: player.overall,
      reputation: player.reputation,
      seasonsPlayed: careerStats.seasonsPlayed,
      totalGoals: careerStats.totalGoals,
      totalAssists: careerStats.totalAssists,
      totalAppearances: careerStats.totalAppearances,
      totalCleanSheets: careerStats.totalCleanSheets,
      totalTrophies: careerStats.trophies.length,
      trophySlots,
      medalSlots,
      records,
      milestones,
      seasonProgression,
      clubLegends,
      awardNominations,
      hofStatus,
      legacyScore,
      trophyScore,
      recordScore,
      longevityScore,
      impactScore,
      cultureScore,
      prestigeLevel,
      prestigeColor,
      highlights,
      totalMedalPoints,
      featuredTrophies,
    };
  }, [gameState]);

  // ============================================================
  // Early return if no game state
  // ============================================================

  if (!gameState || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-[#484f58]">
          <Trophy className="h-12 w-12" />
          <p className="text-sm">Start a career to view your Virtual Trophy Room</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // Computed display values
  // ============================================================

  const unlockedTrophyCount = data.trophySlots.filter((t) => t.unlocked).length;
  const unlockedMedalCount = data.medalSlots.filter((m) => m.unlocked).length;
  const selectedTrophyData = data.trophySlots.find((t) => t.id === selectedTrophy);

  // ============================================================
  // Tab configuration
  // ============================================================

  const tabs = [
    { id: 'trophies' as const, label: 'Trophies', icon: <Trophy className="h-4 w-4" />, count: unlockedTrophyCount },
    { id: 'medals' as const, label: 'Medals', icon: <Medal className="h-4 w-4" />, count: unlockedMedalCount },
    { id: 'records' as const, label: 'Records', icon: <BarChart3 className="h-4 w-4" />, count: null },
    { id: 'ceremony' as const, label: 'Ceremony', icon: <Award className="h-4 w-4" />, count: null },
  ];

  // ============================================================
  // Render: Trophy Room Ambiance Header
  // ============================================================

  const AmbianceHeader = (
    <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            <h1 className="text-base font-bold text-[#c9d1d9]">Virtual Trophy Room</h1>
          </div>
          <span className={`text-xs font-semibold ${data.prestigeColor}`}>{data.prestigeLevel}</span>
        </div>
        <p className="text-xs text-[#8b949e] mb-3">
          {data.playerName} — {data.clubName} — Season {data.currentSeason}
        </p>
        {/* Prestige progress bar */}
        <div className="h-2 bg-[#0d1117] rounded-md border border-[#21262d] overflow-hidden">
          <motion.div
            className="h-full rounded-md bg-emerald-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="h-full rounded-md bg-emerald-500" style={{ width: `${data.legacyScore}%` }} />
          </motion.div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-[#484f58]">Career Legacy</span>
          <span className="text-[9px] text-emerald-400 font-medium">{data.legacyScore}/100</span>
        </div>
      </div>
    </motion.section>
  );

  // ============================================================
  // Render: Achievement Highlights (4 career moments)
  // ============================================================

  const AchievementHighlights = (
    <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-[#c9d1d9]">Career Highlights</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {data.highlights.map((h, idx) => (
            <motion.div
              key={h.id}
              variants={fadeItem}
              initial="hidden"
              animate="visible"
              custom={idx}
              className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                {h.icon}
                <span className="text-[10px] font-semibold text-[#c9d1d9] leading-tight">{h.title}</span>
              </div>
              <p className="text-[9px] text-[#8b949e] leading-snug">{h.description}</p>
              {h.season && (
                <p className="text-[8px] text-[#484f58] mt-1">Season {h.season}</p>
              )}
              {!h.season && (
                <p className="text-[8px] text-[#30363d] mt-1 italic">Not yet achieved</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );

  // ============================================================
  // Render: Display Shelf
  // ============================================================

  const ShelfSection = (
    <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
      <DisplayShelf trophies={data.featuredTrophies} />
    </motion.section>
  );

  // ============================================================
  // Render: Comparison (your haul vs 3 club legends)
  // ============================================================

  const ComparisonSection = (
    <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Swords className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-[#c9d1d9]">Trophy Haul Comparison</h3>
        </div>
        <div className="space-y-2.5">
          {/* Player row */}
          <div className="flex items-center gap-3">
            <div className="w-16 text-right">
              <span className="text-xs font-bold text-emerald-400">{data.playerName.split(' ').pop()}</span>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-[#0d1117] rounded-md border border-[#21262d] overflow-hidden">
                <div className="h-full bg-emerald-500/70 rounded-md" style={{ width: `${Math.min((data.totalTrophies / 20) * 100, 100)}%` }} />
              </div>
            </div>
            <span className="text-xs font-bold text-[#c9d1d9] w-8 text-right">{data.totalTrophies}</span>
          </div>
          {/* Legend rows */}
          {data.clubLegends.map((legend) => (
            <div key={legend.name} className="flex items-center gap-3">
              <div className="w-16 text-right">
                <span className="text-[10px] text-[#8b949e]">{legend.name}</span>
              </div>
              <div className="flex-1">
                <div className="h-3 bg-[#0d1117] rounded-md border border-[#21262d] overflow-hidden">
                  <div className="h-full bg-[#30363d]/70 rounded-md" style={{ width: `${Math.min((legend.trophyCount / 20) * 100, 100)}%` }} />
                </div>
              </div>
              <span className="text-[10px] text-[#8b949e] w-8 text-right">{legend.trophyCount}</span>
            </div>
          ))}
        </div>
        <p className="text-[8px] text-[#484f58] mt-2">Total career trophies won</p>
      </div>
    </motion.section>
  );

  // ============================================================
  // Tab 1: Trophy Cabinet
  // ============================================================

  const TrophyCabinetTab = (
    <motion.div variants={fadeContainer} initial="hidden" animate="visible" className="space-y-4">
      {/* Trophy count progress */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-semibold text-[#c9d1d9]">Collection Progress</span>
            </div>
            <span className="text-xs text-[#8b949e]">{unlockedTrophyCount} / {data.trophySlots.length}</span>
          </div>
          <div className="h-3 bg-[#0d1117] rounded-md border border-[#21262d] overflow-hidden">
            <motion.div className="h-full rounded-md bg-yellow-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="h-full rounded-md bg-yellow-500" style={{ width: `${(unlockedTrophyCount / data.trophySlots.length) * 100}%` }} />
            </motion.div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-[#484f58]">Complete your trophy collection</span>
            <span className="text-[8px] text-yellow-400">{Math.round((unlockedTrophyCount / data.trophySlots.length) * 100)}%</span>
          </div>
        </div>
      </motion.section>

      {/* Trophy grid */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="grid grid-cols-2 gap-2">
          {data.trophySlots.map((trophy, idx) => {
            const style = RARITY_STYLES[trophy.rarity];
            const isSelected = selectedTrophy === trophy.id;
            return (
              <motion.div
                key={trophy.id}
                variants={fadeItem}
                initial="hidden"
                animate="visible"
                custom={idx}
                onClick={() => setSelectedTrophy(isSelected ? null : trophy.id)}
                className={`relative border rounded-lg p-3 cursor-pointer transition-colors ${
                  trophy.unlocked
                    ? `${style.border} ${style.bg}`
                    : 'border-[#21262d] bg-[#0d1117] opacity-50'
                } ${isSelected ? 'ring-1 ring-emerald-500/50' : ''}`}
              >
                {/* Rarity badge */}
                <span className={`absolute top-1.5 right-1.5 text-[7px] font-bold uppercase px-1.5 py-px rounded-sm ${trophy.unlocked ? style.badge : 'bg-[#21262d] text-[#484f58]'}`}>
                  {trophy.rarity}
                </span>

                {/* Trophy SVG icon */}
                <div className="flex justify-center mb-2 mt-1">
                  {getTrophySvgIcon(trophy.id, trophy.unlocked, 44)}
                </div>

                {/* Trophy info */}
                <p className={`text-[11px] font-semibold text-center leading-tight ${trophy.unlocked ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                  {trophy.name}
                </p>
                <p className={`text-[9px] text-center mt-0.5 ${trophy.unlocked ? 'text-[#8b949e]' : 'text-[#30363d]'}`}>
                  {trophy.competition}
                </p>
                {trophy.unlocked && trophy.seasonWon && (
                  <p className="text-[8px] text-emerald-400 text-center mt-0.5">
                    Won Season {trophy.seasonWon}
                  </p>
                )}
                {!trophy.unlocked && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Lock className="h-3 w-3 text-[#30363d]" />
                    <span className="text-[8px] text-[#30363d]">Locked</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Trophy detail panel */}
      {selectedTrophyData && (
        <motion.section
          variants={fadeSection}
          initial="hidden"
          animate="visible"
          className="bg-[#161b22] border border-emerald-500/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-[#c9d1d9]">Trophy Inspection</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getTrophySvgIcon(selectedTrophyData.id, selectedTrophyData.unlocked, 56)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[#c9d1d9]">{selectedTrophyData.name}</h4>
              <p className="text-[10px] text-[#8b949e] mt-0.5">{selectedTrophyData.competition}</p>
              <span className={`inline-block text-[8px] font-bold uppercase px-1.5 py-px rounded-sm mt-1 ${RARITY_STYLES[selectedTrophyData.rarity].badge}`}>
                {selectedTrophyData.rarity}
              </span>
              <p className="text-[10px] text-[#8b949e] mt-2 leading-relaxed">{selectedTrophyData.description}</p>

              {selectedTrophyData.unlocked && (
                <div className="mt-3 pt-3 border-t border-[#21262d]">
                  <p className="text-[9px] text-emerald-400 font-semibold mb-1.5">
                    Winning Season Stats — Season {selectedTrophyData.seasonWon}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#0d1117] rounded-md p-2 text-center border border-[#21262d]">
                      <span className="text-xs font-bold text-[#c9d1d9]">{selectedTrophyData.winningGoals}</span>
                      <p className="text-[8px] text-[#484f58]">Goals</p>
                    </div>
                    <div className="bg-[#0d1117] rounded-md p-2 text-center border border-[#21262d]">
                      <span className="text-xs font-bold text-[#c9d1d9]">{selectedTrophyData.winningAssists}</span>
                      <p className="text-[8px] text-[#484f58]">Assists</p>
                    </div>
                    <div className="bg-[#0d1117] rounded-md p-2 text-center border border-[#21262d]">
                      <span className="text-xs font-bold text-[#c9d1d9]">{selectedTrophyData.winningRating}</span>
                      <p className="text-[8px] text-[#484f58]">Avg Rating</p>
                    </div>
                  </div>
                </div>
              )}

              {!selectedTrophyData.unlocked && (
                <p className="text-[9px] text-[#484f58] mt-2 italic">
                  This trophy has not been won yet. Continue performing at the highest level to unlock it.
                </p>
              )}
            </div>
          </div>
        </motion.section>
      )}
    </motion.div>
  );

  // ============================================================
  // Tab 2: Medal Collection
  // ============================================================

  const MedalCollectionTab = (
    <motion.div variants={fadeContainer} initial="hidden" animate="visible" className="space-y-4">
      {/* Medal points summary */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Medal className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-[#c9d1d9]">Medal Points</span>
            </div>
            <span className="text-lg font-bold text-purple-400">{data.totalMedalPoints}</span>
          </div>
          <p className="text-[9px] text-[#8b949e]">
            Each medal contributes points based on its significance. Collect all 12 medals to maximise your score.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[9px] text-[#484f58]">{unlockedMedalCount}/12 collected</span>
            <div className="flex-1 h-1.5 bg-[#0d1117] rounded-md border border-[#21262d] overflow-hidden">
              <div className="h-full bg-purple-500 rounded-md" style={{ width: `${(unlockedMedalCount / 12) * 100}%` }} />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Medal category: League */}
      {(['League', 'Continental', 'Domestic Cup', 'International', 'Individual'] as const).map((category) => {
        const categoryMedals = data.medalSlots.filter((m) => m.category === category);
        if (categoryMedals.length === 0) return null;
        return (
          <motion.section key={category} variants={fadeSection} initial="hidden" animate="visible">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gem className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-[#c9d1d9]">{category} Medals</span>
                <span className="text-[9px] text-[#484f58] ml-auto">
                  {categoryMedals.filter((m) => m.unlocked).length}/{categoryMedals.length}
                </span>
              </div>
              <div className="space-y-2">
                {categoryMedals.map((medal, idx) => (
                  <motion.div
                    key={medal.id}
                    variants={fadeItem}
                    initial="hidden"
                    animate="visible"
                    custom={idx}
                    className={`flex items-center gap-3 border rounded-lg p-2.5 ${
                      medal.unlocked
                        ? 'border-[#30363d] bg-[#0d1117]'
                        : 'border-[#21262d] bg-[#0d1117] opacity-40'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {medal.unlocked ? (
                        <MedalSvgIcon size={30} color={getMedalColor(medal.medalType)} />
                      ) : (
                        <LockedMedalIcon size={30} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-[10px] font-semibold truncate ${medal.unlocked ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                          {medal.name}
                        </p>
                        <span className={`text-[7px] font-bold uppercase px-1.5 py-px rounded-sm flex-shrink-0 ${
                          medal.medalType === 'gold'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : medal.medalType === 'silver'
                            ? 'bg-slate-500/20 text-slate-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {medal.medalType}
                        </span>
                      </div>
                      <p className="text-[8px] text-[#8b949e] mt-0.5 truncate">{medal.description}</p>
                      {medal.unlocked && medal.season && (
                        <p className="text-[8px] text-emerald-400 mt-0.5">Season {medal.season} • +{medal.points} pts</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`text-xs font-bold ${medal.unlocked ? 'text-[#c9d1d9]' : 'text-[#30363d]'}`}>
                        {medal.points}
                      </span>
                      <p className="text-[7px] text-[#484f58]">pts</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );

  // ============================================================
  // Tab 3: Personal Records
  // ============================================================

  const RecordsTab = (
    <motion.div variants={fadeContainer} initial="hidden" animate="visible" className="space-y-4">
      {/* Records with progress bars */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Personal Records</h3>
          </div>
          <div className="space-y-3">
            {data.records.map((record, idx) => {
              const progress = Math.min((record.current / record.target) * 100, 100);
              const isComplete = record.current >= record.target;
              return (
                <motion.div key={record.label} variants={fadeItem} initial="hidden" animate="visible" custom={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {record.icon}
                      <span className="text-[10px] font-medium text-[#c9d1d9]">{record.label}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${isComplete ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                      {record.current} / {record.target} {record.unit}
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#0d1117] rounded-md border border-[#21262d] overflow-hidden">
                    <motion.div
                      className="h-full rounded-md"
                      style={{ backgroundColor: isComplete ? '#10B981' : '#30363d' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                    >
                      <div className="h-full rounded-md" style={{ width: `${progress}%`, backgroundColor: isComplete ? '#10B981' : '#30363d' }} />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Record milestones timeline */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Milestone Timeline</h3>
          </div>
          <div className="relative ml-3">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-[#30363d]" />
            <div className="space-y-3">
              {data.milestones.map((m, idx) => (
                <motion.div
                  key={m.label}
                  variants={fadeItem}
                  initial="hidden"
                  animate="visible"
                  custom={idx}
                  className="relative pl-5"
                >
                  <div className={`absolute left-0 top-1 w-2 h-2 rounded-sm border-2 ${
                    m.achievedAt !== null ? 'border-emerald-500 bg-emerald-500' : 'border-[#30363d] bg-[#0d1117]'
                  } -translate-x-[3.5px]`} />
                  <div className="flex items-center gap-2">
                    {m.icon}
                    <span className={`text-[10px] font-medium ${m.achievedAt !== null ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                      {m.label}
                    </span>
                    {m.achievedAt !== null && m.season && (
                      <span className="text-[8px] text-emerald-400 ml-auto">Season {m.season}</span>
                    )}
                    {m.achievedAt === null && (
                      <Lock className="h-3 w-3 text-[#30363d] ml-auto" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* All-time club records comparison */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">All-Time Club Records</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Goals', player: data.totalGoals, clubRecord: 215 },
              { label: 'Assists', player: data.totalAssists, clubRecord: 128 },
              { label: 'Appearances', player: data.totalAppearances, clubRecord: 612 },
            ].map((item) => {
              const playerPct = Math.min((item.player / item.clubRecord) * 100, 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#8b949e]">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-emerald-400">{item.player}</span>
                      <span className="text-[8px] text-[#484f58]">/ {item.clubRecord}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#0d1117] rounded-md border border-[#21262d] overflow-hidden">
                    <div className="h-full bg-emerald-500/60 rounded-md" style={{ width: `${playerPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[8px] text-[#484f58] mt-2">Compare your career stats against all-time club greats</p>
        </div>
      </motion.section>

      {/* League records comparison */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">League Records</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Goals in a Season', player: data.records[0].current, leagueRecord: 38 },
              { label: 'Assists in a Season', player: data.records[1].current, leagueRecord: 20 },
              { label: 'Most Hat-tricks', player: data.records[4].current, leagueRecord: 12 },
            ].map((item) => {
              const pct = Math.min((item.player / item.leagueRecord) * 100, 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-[#8b949e]">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-sky-400">{item.player}</span>
                      <span className="text-[8px] text-[#484f58]">/ {item.leagueRecord}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-[#0d1117] rounded-md border border-[#21262d] overflow-hidden">
                    <div className="h-full bg-sky-500/60 rounded-md" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[8px] text-[#484f58] mt-2">Compare against all-time league records</p>
        </div>
      </motion.section>

      {/* Season-by-season progression SVG bar chart (5 seasons) */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Season Progression</h3>
          </div>
          <div className="flex items-end gap-2 justify-between" style={{ height: 120 }}>
            {data.seasonProgression.map((s, idx) => {
              const maxGoals = Math.max(...data.seasonProgression.map((sp) => sp.goals), 1);
              const barHeight = Math.max(4, (s.goals / maxGoals) * 100);
              return (
                <motion.div
                  key={s.season}
                  variants={fadeItem}
                  initial="hidden"
                  animate="visible"
                  custom={idx}
                  className="flex flex-col items-center gap-1 flex-1"
                >
                  <span className="text-[8px] text-emerald-400 font-bold">{s.goals}</span>
                  <div className="w-full flex flex-col items-center" style={{ height: 80 }}>
                    <div
                      className="w-full max-w-[32px] bg-emerald-500/60 rounded-t-md"
                      style={{ height: barHeight, marginTop: 'auto' }}
                    />
                  </div>
                  <span className="text-[8px] text-[#484f58]">S{s.season}</span>
                </motion.div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-emerald-500/60 rounded-sm" />
              <span className="text-[8px] text-[#8b949e]">Goals</span>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );

  // ============================================================
  // Tab 4: Award Ceremony
  // ============================================================

  const CeremonyTab = (
    <motion.div variants={fadeContainer} initial="hidden" animate="visible" className="space-y-4">
      {/* Hall of Fame Induction */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className={`border rounded-lg p-4 ${
          data.hofStatus === 'Inducted'
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : data.hofStatus === 'Eligible'
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-[#161b22] border-[#30363d]'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Crown className={`h-5 w-5 ${data.hofStatus === 'Inducted' ? 'text-yellow-400' : data.hofStatus === 'Eligible' ? 'text-emerald-400' : 'text-[#484f58]'}`} />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Hall of Fame</h3>
            <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-sm ${
              data.hofStatus === 'Inducted'
                ? 'bg-yellow-500/20 text-yellow-300'
                : data.hofStatus === 'Eligible'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-[#21262d] text-[#484f58]'
            }`}>
              {data.hofStatus}
            </span>
          </div>
          <p className="text-[10px] text-[#8b949e] leading-relaxed">
            {data.hofStatus === 'Inducted'
              ? `Congratulations! ${data.playerName} has been inducted into the Hall of Fame. A career of extraordinary achievement and lasting impact on the game.`
              : data.hofStatus === 'Eligible'
              ? `${data.playerName} is now eligible for Hall of Fame induction. Continue to build a legacy that will be remembered for generations.`
              : `${data.playerName} needs to achieve more in their career before becoming eligible for Hall of Fame consideration. Keep pushing forward.`
            }
          </p>
          {data.hofStatus === 'Inducted' && (
            <div className="mt-3 pt-3 border-t border-yellow-500/20">
              <p className="text-[9px] text-yellow-400 font-medium">
                Requirements met: {data.seasonsPlayed}+ seasons played, {data.totalTrophies}+ trophies won, reputation {data.reputation}+
              </p>
            </div>
          )}
          {data.hofStatus === 'Locked' && (
            <div className="mt-3 pt-3 border-t border-[#21262d]">
              <p className="text-[9px] text-[#484f58]">
                Requires: 10+ seasons, 5+ trophies, 80+ reputation
              </p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Award nominations */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Award Nominations</h3>
          </div>
          <div className="space-y-2">
            {data.awardNominations.map((award, idx) => {
              const isAccepted = acceptedAwards.has(award.id);
              return (
                <motion.div
                  key={award.id}
                  variants={fadeItem}
                  initial="hidden"
                  animate="visible"
                  custom={idx}
                  className={`border rounded-lg p-3 ${
                    award.nominated
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-[#21262d] bg-[#0d1117] opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {award.nominated ? (
                        <div className="w-8 h-8 bg-yellow-500/15 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                          <Award className="h-4 w-4 text-yellow-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-[#21262d] border border-[#30363d] rounded-lg flex items-center justify-center">
                          <Lock className="h-4 w-4 text-[#484f58]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold ${award.nominated ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                          {award.name}
                        </span>
                        <span className="text-[7px] text-[#484f58] uppercase">{award.category}</span>
                      </div>
                      <p className="text-[9px] text-[#8b949e] mt-1 leading-relaxed">{award.description}</p>

                      {/* Accept Award button */}
                      {award.nominated && !isAccepted && (
                        <button
                          onClick={() => setAcceptedAwards((prev) => new Set(prev).add(award.id))}
                          className="mt-2 px-3 py-1.5 bg-yellow-500/15 border border-yellow-500/30 rounded-md text-[10px] font-semibold text-yellow-300 hover:bg-yellow-500/25 transition-colors"
                        >
                          Accept Award
                        </button>
                      )}
                      {isAccepted && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2 flex items-center gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                          <span className="text-[10px] text-yellow-400 font-semibold">Award Accepted</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Speech preview (auto-generated) */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Acceptance Speech Preview</h3>
          </div>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <p className="text-[10px] text-[#c9d1d9] leading-relaxed italic">
              &quot;I stand here today humbled by this incredible honour. From my very first day at {data.clubName},
              I dreamed of moments like this. To my teammates — you made every training session, every match,
              every sacrifice worthwhile. To the fans who believed in me through the tough times, this trophy
              belongs to you as much as it does to me. With {data.totalGoals} goals, {data.totalAssists} assists,
              and {data.totalAppearances} appearances over {data.seasonsPlayed} seasons, I have given everything
              to this beautiful game. This is not the end — it is just another chapter in the story of {data.playerName}.&quot;
            </p>
          </div>
          <p className="text-[8px] text-[#484f58] mt-2">Auto-generated from your career statistics and achievements</p>
        </div>
      </motion.section>

      {/* Career Legacy Score Breakdown */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Career Legacy Score</h3>
            </div>
            <span className="text-xl font-bold text-emerald-400">{data.legacyScore}</span>
          </div>
          <p className="text-[9px] text-[#8b949e] mb-3">Your legacy score is calculated from five pillars of a footballing career.</p>

          {/* Legacy breakdown bars */}
          <div className="space-y-2.5">
            {[
              { label: 'Trophies', score: data.trophyScore, max: 30, weight: '30%', color: '#EAB308' },
              { label: 'Records', score: data.recordScore, max: 25, weight: '25%', color: '#3B82F6' },
              { label: 'Longevity', score: data.longevityScore, max: 20, weight: '20%', color: '#A855F7' },
              { label: 'Impact', score: data.impactScore, max: 15, weight: '15%', color: '#F97316' },
              { label: 'Culture', score: data.cultureScore, max: 10, weight: '10%', color: '#EC4899' },
            ].map((pillar) => {
              const pct = (pillar.score / pillar.max) * 100;
              return (
                <div key={pillar.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#c9d1d9]">{pillar.label}</span>
                      <span className="text-[7px] text-[#484f58]">({pillar.weight})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#c9d1d9]">{Math.round(pillar.score)}/{pillar.max}</span>
                  </div>
                  <div className="h-2.5 bg-[#0d1117] rounded-md border border-[#21262d] overflow-hidden">
                    <div className="h-full rounded-md" style={{ width: `${pct}%`, backgroundColor: pillar.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Retirement Legacy Preview */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Skull className="h-4 w-4 text-[#8b949e]" />
            <h3 className="text-sm font-semibold text-[#c9d1d9]">Retirement Legacy Preview</h3>
          </div>
          <p className="text-[10px] text-[#8b949e] mb-3 leading-relaxed">
            If {data.playerName} were to retire today, here is how history would remember their career:
          </p>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
            <p className="text-[10px] text-[#c9d1d9] leading-relaxed">
              {data.legacyScore >= 80
                ? `${data.playerName} will be remembered as one of the all-time greats. With ${data.totalTrophies} trophies, ${data.totalGoals} goals, and ${data.totalAppearances} appearances over ${data.seasonsPlayed} seasons, the name ${data.playerName.split(' ').pop()} will echo through the corridors of ${data.clubName} for eternity. A true living legend whose legacy transcends the sport.`
                : data.legacyScore >= 50
                ? `${data.playerName} carved out a distinguished career in professional football. Amassing ${data.totalTrophies} trophies, ${data.totalGoals} goals, and ${data.totalAppearances} appearances, they will be fondly remembered by the supporters of ${data.clubName} as a reliable and committed professional who always gave their best.`
                : `${data.playerName} showed promise during their time at ${data.clubName}. While the career statistics of ${data.totalGoals} goals and ${data.totalAppearances} appearances tell a story still being written, every great journey begins with a single step. The potential for a memorable legacy remains very much alive.`
              }
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { icon: <Trophy className="h-3.5 w-3.5 text-yellow-400" />, value: data.totalTrophies, label: 'Trophies' },
              { icon: <Target className="h-3.5 w-3.5 text-emerald-400" />, value: data.totalGoals, label: 'Goals' },
              { icon: <Zap className="h-3.5 w-3.5 text-sky-400" />, value: data.totalAssists, label: 'Assists' },
              { icon: <Users className="h-3.5 w-3.5 text-purple-400" />, value: data.totalAppearances, label: 'Apps' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0d1117] border border-[#21262d] rounded-md p-2 text-center">
                <div className="flex justify-center text-[#8b949e] mb-1">{stat.icon}</div>
                <span className="text-sm font-bold text-[#c9d1d9]">{stat.value}</span>
                <p className="text-[7px] text-[#484f58] uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );

  // ============================================================
  // Main Render
  // ============================================================

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-8">
      {/* Trophy Room Ambiance Header */}
      {AmbianceHeader}

      {/* Achievement Highlights */}
      {AchievementHighlights}

      {/* Display Shelf */}
      {ShelfSection}

      {/* Comparison Section */}
      {ComparisonSection}

      {/* Tab Navigation */}
      <motion.section variants={fadeSection} initial="hidden" animate="visible" className="mb-4">
        <div className="flex bg-[#161b22] border border-[#30363d] rounded-lg p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTrophy(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-[10px] font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] border border-transparent'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[8px] px-1 py-px rounded-sm ${
                  activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#21262d] text-[#484f58]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Tab Content */}
      {activeTab === 'trophies' && TrophyCabinetTab}
      {activeTab === 'medals' && MedalCollectionTab}
      {activeTab === 'records' && RecordsTab}
      {activeTab === 'ceremony' && CeremonyTab}

      {/* Footer attribution */}
      <motion.div
        variants={fadeSection}
        initial="hidden"
        animate="visible"
        className="mt-6 text-center"
      >
        <p className="text-[8px] text-[#30363d]">
          Virtual Trophy Room — Career achievements and silverware
        </p>
      </motion.div>
    </div>
  );
}
