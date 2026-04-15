'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  PlayerTrait,
  TraitCategory,
  TraitRarity,
  TraitDefinition,
} from '@/lib/game/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Zap,
  Shield,
  Heart,
  Star,
  Crown,
  Gem,
  Target,
  Swords,
  Brain,
  Activity,
  ScrollText,
  Info,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Trophy,
  Flame,
  TrendingUp,
} from 'lucide-react';

// ============================================================
// Constants
// ============================================================

const TOTAL_TRAITS = 24;

/** Legacy trait IDs for virtual "Legacy" filter tab */
const LEGACY_TRAIT_IDS: Set<PlayerTrait> = new Set([
  'speedster',
  'playmaker',
  'technical',
  'consistent',
  'volatile',
  'quick_learner',
]);

/** Trait rarity point values */
const RARITY_POINTS: Record<TraitRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 5,
};

/** Category color mapping */
const CATEGORY_COLORS: Record<string, string> = {
  attacking: '#ef4444',
  defending: '#3b82f6',
  mental: '#f59e0b',
  physical: '#10b981',
  special: '#8b5cf6',
  legacy: '#64748b',
};

/** Category icon mapping */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  attacking: <Swords className="h-3.5 w-3.5" />,
  defending: <Shield className="h-3.5 w-3.5" />,
  mental: <Brain className="h-3.5 w-3.5" />,
  physical: <Activity className="h-3.5 w-3.5" />,
  special: <Gem className="h-3.5 w-3.5" />,
  legacy: <ScrollText className="h-3.5 w-3.5" />,
};

/** Category display labels */
const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  attacking: 'Attacking',
  defending: 'Defending',
  mental: 'Mental',
  physical: 'Physical',
  special: 'Special',
  legacy: 'Legacy',
};

/** Rarity styling config */
const RARITY_CONFIG: Record<TraitRarity, { label: string; color: string; bgColor: string; borderColor: string }> = {
  common: {
    label: 'Common',
    color: '#8b949e',
    bgColor: 'rgba(139,148,158,0.10)',
    borderColor: 'rgba(139,148,158,0.25)',
  },
  rare: {
    label: 'Rare',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.10)',
    borderColor: 'rgba(59,130,246,0.25)',
  },
  epic: {
    label: 'Epic',
    color: '#a855f7',
    bgColor: 'rgba(168,85,247,0.10)',
    borderColor: 'rgba(168,85,247,0.25)',
  },
  legendary: {
    label: 'Legendary',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
};

/** Filter tab type (extends TraitCategory with 'all' and 'legacy') */
type FilterTab = 'all' | TraitCategory | 'legacy';

// ============================================================
// All Traits Data
// ============================================================

const ALL_TRAITS: TraitDefinition[] = [
  // ---- Attacking ----
  {
    id: 'clinical_finisher',
    name: 'Clinical Finisher',
    description: 'Converts more chances into goals. A composed finisher who rarely wastes opportunities.',
    icon: '🎯',
    category: 'attacking',
    rarity: 'rare',
    effect: '+8% goal conversion',
    effectDetails: { type: 'conversion', value: 8 },
    toggleable: false,
    unlockRequirement: { type: 'goals', value: 25, label: 'Score 25 career goals' },
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Blazing pace that terrifies defenders. Uses raw speed to create scoring opportunities.',
    icon: '⚡',
    category: 'attacking',
    rarity: 'common',
    effect: '+5 pace growth',
    effectDetails: { type: 'pace_growth', value: 5 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 20, label: 'Make 20 appearances' },
  },
  {
    id: 'free_kick_specialist',
    name: 'Free Kick Specialist',
    description: 'Deadly from set pieces. Has the technique to score from any distance.',
    icon: '⚽',
    category: 'attacking',
    rarity: 'epic',
    effect: '+1 free kick goal/season',
    effectDetails: { type: 'free_kick_goals', value: 1 },
    toggleable: true,
    unlockRequirement: { type: 'goals', value: 50, label: 'Score 50 career goals' },
  },
  {
    id: 'poacher',
    name: 'Poacher',
    description: 'Lurks in the box for tap-ins. Instinctive positioning in crowded penalty areas.',
    icon: '🔥',
    category: 'attacking',
    rarity: 'rare',
    effect: '+6% goals from rebounds',
    effectDetails: { type: 'rebound_goals', value: 6 },
    toggleable: false,
    unlockRequirement: { type: 'goals', value: 40, label: 'Score 40 career goals' },
  },
  {
    id: 'aerial',
    name: 'Aerial Threat',
    description: 'Dominates in the air. A threat at every corner and cross.',
    icon: '🦅',
    category: 'attacking',
    rarity: 'common',
    effect: '+10% aerial duel wins',
    effectDetails: { type: 'aerial_wins', value: 10 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 15, label: 'Make 15 appearances' },
  },

  // ---- Defending ----
  {
    id: 'iron_wall',
    name: 'Iron Wall',
    description: 'An immovable defensive presence. Makes the team harder to break down.',
    icon: '🧱',
    category: 'defending',
    rarity: 'rare',
    effect: '-15% goals conceded when on pitch',
    effectDetails: { type: 'goals_conceded', value: -15 },
    toggleable: false,
    unlockRequirement: { type: 'clean_sheets', value: 10, label: 'Keep 10 clean sheets' },
  },
  {
    id: 'tank',
    name: 'Tank',
    description: 'A physical specimen who wins battles through sheer strength and power.',
    icon: '💪',
    category: 'defending',
    rarity: 'common',
    effect: '+8 physical growth',
    effectDetails: { type: 'physical_growth', value: 8 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 30, label: 'Make 30 appearances' },
  },

  // ---- Mental ----
  {
    id: 'big_game_player',
    name: 'Big Game Player',
    description: 'Shines on the biggest stage. Elevates performance when it matters most.',
    icon: '👑',
    category: 'mental',
    rarity: 'epic',
    effect: '+15% rating in important matches',
    effectDetails: { type: 'big_game_rating', value: 15 },
    toggleable: false,
    unlockRequirement: { type: 'matches_rated_7', value: 15, label: 'Earn 15 match ratings of 7.0+' },
  },
  {
    id: 'never_give_up',
    name: 'Never Give Up',
    description: 'Relentless determination. Never stops working even when the team is losing.',
    icon: '💪',
    category: 'mental',
    rarity: 'common',
    effect: '+5 morale recovery',
    effectDetails: { type: 'morale_recovery', value: 5 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 10, label: 'Make 10 appearances' },
  },
  {
    id: 'cool_under_pressure',
    name: 'Cool Under Pressure',
    description: 'Composed in heated moments. Rarely loses discipline.',
    icon: '🧊',
    category: 'mental',
    rarity: 'rare',
    effect: '-20% card risk',
    effectDetails: { type: 'card_risk', value: -20 },
    toggleable: true,
    unlockRequirement: { type: 'appearances', value: 40, label: 'Make 40 appearances without a red card' },
  },
  {
    id: 'leader',
    name: 'Leader',
    description: 'Natural leadership qualities that inspire and organize teammates.',
    icon: '🏅',
    category: 'mental',
    rarity: 'epic',
    effect: '+5 team cohesion',
    effectDetails: { type: 'team_cohesion', value: 5 },
    toggleable: true,
    unlockRequirement: { type: 'seasons_at_club', value: 3, label: 'Spend 3 seasons at the same club' },
  },

  // ---- Physical ----
  {
    id: 'iron_man',
    name: 'Iron Man',
    description: 'Remarkable durability. Recovers from injuries faster than expected.',
    icon: '🛡️',
    category: 'physical',
    rarity: 'epic',
    effect: '-30% injury duration',
    effectDetails: { type: 'injury_duration', value: -30 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 60, label: 'Make 60 appearances' },
  },
  {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Superior fitness levels maintained throughout the full 90 minutes.',
    icon: '🏃',
    category: 'physical',
    rarity: 'common',
    effect: '+8 stamina/fitness retention',
    effectDetails: { type: 'stamina_retention', value: 8 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 25, label: 'Make 25 appearances' },
  },
  {
    id: 'quick_recovery',
    name: 'Quick Recovery',
    description: 'Bounces back quickly. Ready to play again sooner after exertion.',
    icon: '💚',
    category: 'physical',
    rarity: 'rare',
    effect: '+15% fitness recovery between matches',
    effectDetails: { type: 'fitness_recovery', value: 15 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 35, label: 'Make 35 appearances' },
  },
  {
    id: 'injury_prone',
    name: 'Injury Prone',
    description: 'Fragile body that is susceptible to muscle and ligament problems.',
    icon: '🩹',
    category: 'physical',
    rarity: 'common',
    effect: '+25% injury risk',
    effectDetails: { type: 'injury_risk', value: 25 },
    toggleable: false,
    unlockRequirement: { type: 'injury_count', value: 3, label: 'Suffer 3 injuries' },
  },

  // ---- Special ----
  {
    id: 'fan_favorite',
    name: 'Fan Favorite',
    description: "The supporters' darling. Every touch of the ball is cheered.",
    icon: '❤️',
    category: 'special',
    rarity: 'epic',
    effect: '+10% reputation gains',
    effectDetails: { type: 'reputation_gain', value: 10 },
    toggleable: false,
    unlockRequirement: { type: 'reputation', value: 50, label: 'Reach 50 reputation' },
  },
  {
    id: 'media_darling',
    name: 'Media Darling',
    description: 'Camera-friendly personality that attracts media attention and sponsors.',
    icon: '📸',
    category: 'special',
    rarity: 'rare',
    effect: '+10% social media engagement',
    effectDetails: { type: 'social_engagement', value: 10 },
    toggleable: false,
    unlockRequirement: { type: 'reputation', value: 35, label: 'Reach 35 reputation' },
  },
  {
    id: 'club_legend',
    name: 'Club Legend',
    description: "A future legend. The club's history will remember this name.",
    icon: '🏆',
    category: 'special',
    rarity: 'legendary',
    effect: '+20% market value growth',
    effectDetails: { type: 'market_value_growth', value: 20 },
    toggleable: false,
    unlockRequirement: { type: 'seasons_at_club', value: 8, label: 'Spend 8 seasons at the same club' },
  },
  {
    id: 'late_bloomer',
    name: 'Late Bloomer',
    description: 'Develops late but impressively. A late-career surge takes everyone by surprise.',
    icon: '🌸',
    category: 'special',
    rarity: 'rare',
    effect: '+3 OVR after age 26',
    effectDetails: { type: 'late_ova_boost', value: 3 },
    toggleable: false,
    unlockRequirement: { type: 'age', value: 26, label: 'Reach age 26' },
  },
  {
    id: 'wonderkid',
    name: 'Wonderkid',
    description: 'Extraordinary teenage talent. The world is watching this prodigy.',
    icon: '⭐',
    category: 'special',
    rarity: 'legendary',
    effect: '+2 OVR per season (age <20)',
    effectDetails: { type: 'wonderkid_growth', value: 2 },
    toggleable: false,
    unlockRequirement: { type: 'overall', value: 80, label: 'Reach 80 overall before age 20' },
  },

  // ---- Legacy / Utility (assigned to relevant categories) ----
  {
    id: 'speedster',
    name: 'Speedster',
    description: 'Pure speed merchant who relies on athleticism over technique.',
    icon: '💨',
    category: 'attacking',
    rarity: 'common',
    effect: '+5 pace, -3 defending',
    effectDetails: { type: 'pace_defending', value: 5 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 12, label: 'Make 12 appearances' },
  },
  {
    id: 'playmaker',
    name: 'Playmaker',
    description: 'Creative vision that unlocks defenses with incisive passes.',
    icon: '🎯',
    category: 'attacking',
    rarity: 'rare',
    effect: '+5 passing growth, +5 assist chance',
    effectDetails: { type: 'passing_assist', value: 5 },
    toggleable: false,
    unlockRequirement: { type: 'goals', value: 30, label: 'Score 30 career goals' },
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Clean technique on the ball. Touch, control, and skill in equal measure.',
    icon: '🪄',
    category: 'attacking',
    rarity: 'common',
    effect: '+4 all technical attributes',
    effectDetails: { type: 'technical_boost', value: 4 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 18, label: 'Make 18 appearances' },
  },
  {
    id: 'consistent',
    name: 'Consistent',
    description: 'Reliable week-in, week-out. Always contributes a solid performance.',
    icon: '📊',
    category: 'mental',
    rarity: 'rare',
    effect: '+3% rating floor (minimum 6.0)',
    effectDetails: { type: 'rating_floor', value: 3 },
    toggleable: true,
    unlockRequirement: { type: 'matches_rated_7', value: 10, label: 'Earn 10 match ratings of 7.0+' },
  },
  {
    id: 'volatile',
    name: 'Volatile',
    description: 'Unpredictable form. Can be brilliant one week and invisible the next.',
    icon: '🌪️',
    category: 'mental',
    rarity: 'common',
    effect: '+15% chance of very high/low rating',
    effectDetails: { type: 'rating_volatility', value: 15 },
    toggleable: false,
    unlockRequirement: { type: 'appearances', value: 8, label: 'Make 8 appearances' },
  },
  {
    id: 'quick_learner',
    name: 'Quick Learner',
    description: 'Absorbs coaching instructions rapidly. Maximizes every training session.',
    icon: '📚',
    category: 'mental',
    rarity: 'epic',
    effect: '+15% training effectiveness',
    effectDetails: { type: 'training_effectiveness', value: 15 },
    toggleable: false,
    unlockRequirement: { type: 'matches_rated_7', value: 20, label: 'Earn 20 match ratings of 7.0+' },
  },
];

// ============================================================
// Helper: Get the current value for a trait unlock requirement
// ============================================================
function getRequirementProgress(
  type: TraitDefinition['unlockRequirement']['type'],
  gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>
): { current: number; target: number } {
  const { player, recentResults, seasons } = gameState;

  switch (type) {
    case 'goals':
      return { current: player.careerStats.totalGoals, target: 0 };
    case 'appearances':
      return { current: player.careerStats.totalAppearances, target: 0 };
    case 'overall':
      return { current: player.overall, target: 0 };
    case 'age':
      return { current: player.age, target: 0 };
    case 'reputation':
      return { current: player.reputation, target: 0 };
    case 'matches_rated_7': {
      const count = recentResults.filter(
        (r) => r.playerMinutesPlayed > 0 && r.playerRating >= 7.0
      ).length;
      return { current: count, target: 0 };
    }
    case 'seasons_at_club':
      return { current: seasons.length, target: 0 };
    case 'clean_sheets':
      return { current: player.careerStats.totalCleanSheets, target: 0 };
    case 'injury_count':
      return { current: player.injuryHistory.length, target: 0 };
    case 'free_kick_goals':
      return { current: 0, target: 0 };
    case 'penalty_goals':
      return { current: 0, target: 0 };
    default:
      return { current: 0, target: 0 };
  }
}

// ============================================================
// Helper: Check if a trait is considered "legacy"
// ============================================================
function isLegacyTrait(traitId: PlayerTrait): boolean {
  return LEGACY_TRAIT_IDS.has(traitId);
}

// ============================================================
// Trait Category Filter Tabs
// ============================================================
const FILTER_TABS: FilterTab[] = [
  'all',
  'attacking',
  'defending',
  'mental',
  'physical',
  'special',
  'legacy',
];

// ============================================================
// Trait icon component (emoji wrapper)
// ============================================================
function TraitIcon({ icon, category, size = 'md' }: { icon: string; category: string; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-base' : 'h-10 w-10 text-lg';
  const color = CATEGORY_COLORS[category] ?? '#64748b';

  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-lg border shrink-0`}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
      }}
    >
      <span>{icon}</span>
    </div>
  );
}

// ============================================================
// Rarity badge component
// ============================================================
function RarityBadge({ rarity, showGem }: { rarity: TraitRarity; showGem?: boolean }) {
  const config = RARITY_CONFIG[rarity];

  return (
    <Badge
      className="h-5 px-1.5 text-[10px] font-semibold rounded-md border gap-1"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.borderColor,
      }}
    >
      {showGem && rarity === 'legendary' && <Gem className="h-2.5 w-2.5" />}
      {config.label}
    </Badge>
  );
}

// ============================================================
// Trait point badge
// ============================================================
function TraitPointBadge({ rarity }: { rarity: TraitRarity }) {
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
      style={{
        backgroundColor: RARITY_CONFIG[rarity].bgColor,
        color: RARITY_CONFIG[rarity].color,
      }}
    >
      {RARITY_POINTS[rarity]}pt
    </span>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function PlayerTraitsPanel() {
  const gameState = useGameStore((state) => state.gameState);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  // ============================================================
  // Computed: Player's unlocked traits
  // ============================================================
  const playerTraits = useMemo<Set<PlayerTrait>>(() => {
    if (!gameState?.player?.traits) return new Set();
    return new Set(gameState.player.traits);
  }, [gameState]);

  // ============================================================
  // Computed: Unlock status for all traits
  // ============================================================
  const traitUnlockStatus = useMemo(() => {
    if (!gameState) return new Map<PlayerTrait, boolean>();

    const status = new Map<PlayerTrait, boolean>();

    for (const trait of ALL_TRAITS) {
      if (playerTraits.has(trait.id)) {
        status.set(trait.id, true);
        continue;
      }

      const { current } = getRequirementProgress(trait.unlockRequirement.type, gameState);
      const meetsRequirement = current >= trait.unlockRequirement.value;
      status.set(trait.id, meetsRequirement);
    }

    return status;
  }, [gameState, playerTraits]);

  // ============================================================
  // Computed: Unlocked count and trait points
  // ============================================================
  const unlockedCount = useMemo(() => {
    let count = 0;
    let points = 0;
    for (const trait of ALL_TRAITS) {
      if (playerTraits.has(trait.id)) {
        count++;
        points += RARITY_POINTS[trait.rarity];
      }
    }
    return { count, points };
  }, [playerTraits]);

  // ============================================================
  // Computed: Active (equipped) traits for display
  // ============================================================
  const activeTraits = useMemo(() => {
    if (playerTraits.size === 0) return [];
    return ALL_TRAITS.filter((t) => playerTraits.has(t.id));
  }, [playerTraits]);

  // ============================================================
  // Computed: Filtered traits for catalog
  // ============================================================
  const filteredTraits = useMemo(() => {
    if (activeTab === 'all') return ALL_TRAITS;
    if (activeTab === 'legacy') {
      return ALL_TRAITS.filter((t) => LEGACY_TRAIT_IDS.has(t.id));
    }
    return ALL_TRAITS.filter((t) => t.category === activeTab);
  }, [activeTab]);

  // ============================================================
  // Computed: Traits grouped by category for filtered view
  // ============================================================
  const traitsByCategory = useMemo(() => {
    if (activeTab !== 'all') {
      return [{ category: activeTab, traits: filteredTraits }];
    }

    const groups: { category: TraitCategory | 'legacy'; traits: TraitDefinition[] }[] = [];
    const seenCategories = new Set<string>();

    for (const trait of ALL_TRAITS) {
      const cat = isLegacyTrait(trait.id) ? 'legacy' : trait.category;
      if (!seenCategories.has(cat)) {
        seenCategories.add(cat);
        groups.push({ category: cat as TraitCategory | 'legacy', traits: [] });
      }
      const group = groups.find((g) => g.category === cat);
      if (group) {
        group.traits.push(trait);
      }
    }

    return groups;
  }, [activeTab, filteredTraits]);

  // ============================================================
  // Computed: Requirements progress for progress bars
  // ============================================================
  const traitProgress = useMemo(() => {
    if (!gameState) return new Map<string, { current: number; target: number; percent: number }>();

    const progress = new Map<string, { current: number; target: number; percent: number }>();

    for (const trait of ALL_TRAITS) {
      if (playerTraits.has(trait.id)) {
        progress.set(trait.id, { current: trait.unlockRequirement.value, target: trait.unlockRequirement.value, percent: 100 });
        continue;
      }

      const { current } = getRequirementProgress(trait.unlockRequirement.type, gameState);
      const target = trait.unlockRequirement.value;
      const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : (current >= target ? 100 : 0);
      progress.set(trait.id, { current, target, percent });
    }

    return progress;
  }, [gameState, playerTraits]);

  // ============================================================
  // Early return if no game state
  // ============================================================
  if (!gameState) return null;

  const { player } = gameState;

  // ============================================================
  // Render: Rarity Legend
  // ============================================================
  const renderRarityLegend = () => (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Info className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">
            Trait Point System
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['common', 'rare', 'epic', 'legendary'] as TraitRarity[]).map((rarity) => {
            const config = RARITY_CONFIG[rarity];
            return (
              <div
                key={rarity}
                className="flex items-center gap-2 p-2 rounded-md border"
                style={{
                  backgroundColor: config.bgColor,
                  borderColor: config.borderColor,
                }}
              >
                <div
                  className="w-3 h-3 rounded-md shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold" style={{ color: config.color }}>
                    {config.label}
                  </p>
                  <p className="text-[10px] text-[#8b949e]">
                    {RARITY_POINTS[rarity]} point{RARITY_POINTS[rarity] > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-[#484f58] mt-2.5 leading-relaxed">
          Traits are unlocked through gameplay milestones. Higher rarity traits require more dedication but offer stronger effects.
        </p>
      </CardContent>
    </Card>
  );

  // ============================================================
  // Render: Single Trait Card
  // ============================================================
  const renderTraitCard = (trait: TraitDefinition, idx: number, categoryIdx: number) => {
    const isUnlocked = playerTraits.has(trait.id);
    const canUnlock = traitUnlockStatus.get(trait.id) ?? false;
    const isExpanded = expandedTrait === trait.id;
    const progress = traitProgress.get(trait.id);
    const category = isLegacyTrait(trait.id) ? 'legacy' : trait.category;
    const rarityConfig = RARITY_CONFIG[trait.rarity];

    return (
      <motion.div
        key={trait.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: categoryIdx * 0.05 + idx * 0.03 }}
      >
        <Card
          className={`bg-[#161b22] relative overflow-hidden transition-colors ${
            isUnlocked
              ? 'border-emerald-700/50'
              : canUnlock
              ? 'border-amber-600/30'
              : 'border-[#30363d]'
          }`}
        >
          <CardContent className="p-3">
            {/* Top row: Icon, Name, Rarity, Status */}
            <div className="flex items-start gap-2.5">
              {/* Category-colored icon */}
              <TraitIcon icon={trait.icon} category={category} size="sm" />

              {/* Name, description, badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-[#c9d1d9] truncate">
                    {trait.name}
                  </span>
                  <RarityBadge rarity={trait.rarity} showGem />
                  {trait.toggleable && isUnlocked && (
                    <Badge className="h-4 px-1 text-[9px] rounded-md bg-cyan-500/10 text-cyan-400 border-cyan-500/20 border">
                      Toggle
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-[#8b949e] mt-0.5 line-clamp-2 leading-relaxed">
                  {trait.description}
                </p>

                {/* Effect row */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-medium text-emerald-400">
                    {trait.effect}
                  </span>
                </div>
              </div>

              {/* Right side: Status indicator + points */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {isUnlocked ? (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400">
                      Equipped
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#21262d] border border-[#30363d]">
                    <Lock className="h-3 w-3 text-[#484f58]" />
                    <span className="text-[10px] font-medium text-[#484f58]">
                      {canUnlock ? 'Available' : 'Locked'}
                    </span>
                  </div>
                )}
                <TraitPointBadge rarity={trait.rarity} />
              </div>
            </div>

            {/* Progress bar for locked traits */}
            {!isUnlocked && progress && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#8b949e]">
                    {trait.unlockRequirement.label}
                  </span>
                  <span className="text-[10px] font-medium text-[#8b949e]">
                    {progress.current}/{progress.target}
                  </span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                  <motion.div
                    className="h-full rounded-md"
                    style={{
                      backgroundColor: canUnlock ? '#f59e0b' : '#30363d',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: categoryIdx * 0.05 + idx * 0.03 + 0.1 }}
                  />
                </div>
              </div>
            )}

            {/* Expand button for detailed info */}
            <button
              onClick={() => setExpandedTrait(isExpanded ? null : trait.id)}
              className="flex items-center gap-1 mt-2 text-[10px] text-[#484f58] hover:text-[#8b949e] transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  <span>Less detail</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  <span>More detail</span>
                </>
              )}
            </button>

            {/* Expanded detail section */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="mt-2 pt-2 border-t border-[#30363d]/60"
                >
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3 text-[#484f58]" />
                      <span className="text-[10px] text-[#484f58]">Category:</span>
                      <span className="text-[10px] font-medium text-[#8b949e] capitalize">
                        {isLegacyTrait(trait.id) ? 'Legacy' : trait.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3 w-3 text-[#484f58]" />
                      <span className="text-[10px] text-[#484f58]">Effect Type:</span>
                      <span className="text-[10px] font-medium text-[#8b949e]">
                        {trait.effectDetails.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-3 w-3 text-[#484f58]" />
                      <span className="text-[10px] text-[#484f58]">Effect Value:</span>
                      <span className="text-[10px] font-medium text-[#8b949e]">
                        {trait.effectDetails.value > 0 ? '+' : ''}{trait.effectDetails.value}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3 text-[#484f58]" />
                      <span className="text-[10px] text-[#484f58]">Toggleable:</span>
                      <span className="text-[10px] font-medium text-[#8b949e]">
                        {trait.toggleable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // ============================================================
  // Render: Active Traits Display
  // ============================================================
  const renderActiveTraits = () => {
    if (activeTraits.length === 0) {
      return (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d]">
                <EyeOff className="h-5 w-5 text-[#484f58]" />
              </div>
              <p className="text-sm text-[#8b949e]">No traits yet</p>
              <p className="text-[11px] text-[#484f58] max-w-[220px]">
                Unlock them through gameplay milestones! Score goals, make appearances, and build your reputation.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-[#161b22] border-emerald-700/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">
                Equipped Traits
              </span>
            </div>
            <Badge className="h-5 px-1.5 text-[10px] font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border-emerald-500/25 border">
              {activeTraits.length} active
            </Badge>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activeTraits.map((trait, idx) => {
              const category = isLegacyTrait(trait.id) ? 'legacy' : trait.category;

              return (
                <motion.div
                  key={trait.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: idx * 0.03 }}
                  className="flex items-center gap-2.5 p-2 rounded-md bg-emerald-500/5 border border-emerald-500/15"
                >
                  {/* Trait icon */}
                  <TraitIcon icon={trait.icon} category={category} size="sm" />

                  {/* Name + effect */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-emerald-300 truncate">
                        {trait.name}
                      </span>
                      <RarityBadge rarity={trait.rarity} />
                    </div>
                    <p className="text-[10px] text-emerald-400/70 mt-0.5">
                      {trait.effect}
                    </p>
                  </div>

                  {/* Toggle indicator */}
                  {trait.toggleable && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                      <Eye className="h-3 w-3 text-cyan-400" />
                      <span className="text-[9px] font-semibold text-cyan-400">ON</span>
                    </div>
                  )}

                  {/* Checkmark */}
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // Render: Category Filter Tabs
  // ============================================================
  const renderFilterTabs = () => (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {FILTER_TABS.map((tab) => {
        const isActive = activeTab === tab;
        const color = CATEGORY_COLORS[tab] ?? '#64748b';
        const count =
          tab === 'all'
            ? ALL_TRAITS.length
            : tab === 'legacy'
            ? ALL_TRAITS.filter((t) => LEGACY_TRAIT_IDS.has(t.id)).length
            : ALL_TRAITS.filter((t) => t.category === tab).length;

        return (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border whitespace-nowrap shrink-0 transition-colors"
            style={{
              backgroundColor: isActive ? `${color}15` : '#161b22',
              borderColor: isActive ? `${color}40` : '#30363d',
              color: isActive ? color : '#8b949e',
            }}
            whileTap={{ opacity: 0.8 }}
          >
            {CATEGORY_ICONS[tab]}
            <span className="text-[11px] font-medium">{CATEGORY_LABELS[tab]}</span>
            <span className="text-[9px] font-bold opacity-60">{count}</span>
          </motion.button>
        );
      })}
    </div>
  );

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* ---- Header ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#c9d1d9]">Player Traits</h1>
              <p className="text-[11px] text-[#8b949e]">
                Unique abilities that define your career
              </p>
            </div>
          </div>
          <Badge
            className="h-6 px-2 text-xs font-semibold rounded-md border"
            style={{
              backgroundColor: 'rgba(16,185,129,0.10)',
              color: '#10b981',
              borderColor: 'rgba(16,185,129,0.25)',
            }}
          >
            {unlockedCount.count}/{TOTAL_TRAITS} Unlocked
          </Badge>
        </div>

        {/* Stats row */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-[#484f58] uppercase tracking-wide">Traits</p>
                  <p className="text-lg font-bold text-[#c9d1d9]">{unlockedCount.count}</p>
                </div>
                <div className="w-px h-8 bg-[#30363d]" />
                <div>
                  <p className="text-[10px] text-[#484f58] uppercase tracking-wide">Points</p>
                  <p className="text-lg font-bold text-amber-400">
                    {unlockedCount.points}
                  </p>
                </div>
                <div className="w-px h-8 bg-[#30363d]" />
                <div>
                  <p className="text-[10px] text-[#484f58] uppercase tracking-wide">Remaining</p>
                  <p className="text-lg font-bold text-[#8b949e]">
                    {TOTAL_TRAITS - unlockedCount.count}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Trophy className="h-4 w-4 text-[#30363d] mb-0.5 ml-auto" />
                <p className="text-[10px] text-[#484f58]">of {TOTAL_TRAITS}</p>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="mt-2.5">
              <div className="h-1.5 bg-[#21262d] rounded-md overflow-hidden">
                <motion.div
                  className="h-full rounded-md bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(unlockedCount.count / TOTAL_TRAITS) * 100}%`,
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- Active Traits ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        {renderActiveTraits()}
      </motion.div>

      {/* ---- Trait Catalog ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-[#8b949e]" />
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Trait Catalog</h2>
        </div>

        {/* Filter tabs */}
        {renderFilterTabs()}

        {/* Trait cards grouped by category */}
        <div className="space-y-4">
          {traitsByCategory.map((group, categoryIdx) => {
            const groupColor = CATEGORY_COLORS[group.category] ?? '#64748b';
            const groupLabel = CATEGORY_LABELS[group.category] ?? group.category;
            const groupIcon = CATEGORY_ICONS[group.category] ?? <Star className="h-3.5 w-3.5" />;

            // Count unlocked in this group
            const groupUnlocked = group.traits.filter((t) =>
              playerTraits.has(t.id)
            ).length;

            return (
              <motion.div
                key={group.category}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: categoryIdx * 0.05 }}
                className="space-y-2"
              >
                {/* Category header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1 rounded-md"
                      style={{
                        backgroundColor: `${groupColor}15`,
                        color: groupColor,
                      }}
                    >
                      {groupIcon}
                    </div>
                    <span className="text-xs font-semibold text-[#c9d1d9]">
                      {groupLabel}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#484f58]">
                    {groupUnlocked}/{group.traits.length}
                  </span>
                </div>

                {/* Trait cards */}
                <div className="space-y-2">
                  {group.traits.map((trait, traitIdx) =>
                    renderTraitCard(trait, traitIdx, categoryIdx)
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ---- Rarity Legend ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      >
        {renderRarityLegend()}
      </motion.div>
    </div>
  );
}
