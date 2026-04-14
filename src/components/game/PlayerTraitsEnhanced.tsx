'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  PlayerTrait,
  TraitDefinition,
} from '@/lib/game/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Dumbbell,
  Wrench,
  Users,
  CheckCircle2,
  Lock,
  TrendingUp,
  Star,
  Zap,
  Flame,
  Target,
  Heart,
  Shield,
  Activity,
  Crown,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Sword,
  Lightbulb,
  Handshake,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';

// ============================================================
// Personality Trait Categories
// ============================================================

type PersonalityCategory = 'mental' | 'physical' | 'technical' | 'social';

interface PersonalityTrait {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: PersonalityCategory;
  level: number; // 1-5
  maxLevel: number;
  effect: string;
  matchImpact: string;
  moraleImpact: string;
  trainingImpact: string;
}

interface CategoryConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const CATEGORY_CONFIG: Record<PersonalityCategory, CategoryConfig> = {
  mental: {
    label: 'Mental',
    icon: <Brain className="h-4 w-4" />,
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.10)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  physical: {
    label: 'Physical',
    icon: <Dumbbell className="h-4 w-4" />,
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.25)',
  },
  technical: {
    label: 'Technical',
    icon: <Wrench className="h-4 w-4" />,
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  social: {
    label: 'Social',
    icon: <Users className="h-4 w-4" />,
    color: '#a855f7',
    bgColor: 'rgba(168,85,247,0.10)',
    borderColor: 'rgba(168,85,247,0.25)',
  },
};

// ============================================================
// Trait data derived from player traits + personality model
// ============================================================

function generatePersonalityTraits(player: {
  traits: PlayerTrait[];
  overall: number;
  morale: number;
  form: number;
  age: number;
  reputation: number;
  attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number };
  careerStats: { totalGoals: number; totalAssists: number; totalAppearances: number };
}): PersonalityTrait[] {
  const traitSet = new Set(player.traits);

  const traits: PersonalityTrait[] = [];

  // ---- MENTAL ----
  const leaderLevel = traitSet.has('leader') ? 5 : traitSet.has('big_game_player') ? 4 : player.reputation > 50 ? 3 : player.careerStats.totalAppearances > 30 ? 2 : 1;
  traits.push({
    id: 'leader',
    name: 'Leadership',
    description: 'Ability to inspire and organize teammates on and off the pitch.',
    icon: <Crown className="h-4 w-4" />,
    category: 'mental',
    level: leaderLevel,
    maxLevel: 5,
    effect: `+${leaderLevel * 2}% team cohesion`,
    matchImpact: `+${leaderLevel * 0.1} match rating when captain`,
    moraleImpact: `+${leaderLevel * 3}% team morale recovery`,
    trainingImpact: `${leaderLevel > 3 ? 'Boosts squad training efficiency' : 'No training effect'}`,
  });

  const flairLevel = traitSet.has('playmaker') ? 5 : traitSet.has('technical') ? 4 : player.overall > 75 ? 3 : player.attributes.dribbling > 60 ? 2 : 1;
  traits.push({
    id: 'flair',
    name: 'Flair',
    description: 'Creativity and ability to produce moments of magic.',
    icon: <Lightbulb className="h-4 w-4" />,
    category: 'mental',
    level: flairLevel,
    maxLevel: 5,
    effect: `+${flairLevel * 2}% chance of key passes`,
    matchImpact: `+${flairLevel * 0.15} rating in attacking positions`,
    moraleImpact: 'Neutral',
    trainingImpact: `+${flairLevel}% creative training bonus`,
  });

  const composureLevel = traitSet.has('cool_under_pressure') ? 5 : traitSet.has('consistent') ? 4 : player.form > 7 ? 3 : player.form > 6 ? 2 : 1;
  traits.push({
    id: 'composure',
    name: 'Composure',
    description: 'Stays calm under pressure, especially in high-stakes moments.',
    icon: <Target className="h-4 w-4" />,
    category: 'mental',
    level: composureLevel,
    maxLevel: 5,
    effect: composureLevel > 3 ? '-20% card risk' : `-${composureLevel * 5}% card risk`,
    matchImpact: `+${composureLevel * 0.12} rating in final 15 mins`,
    moraleImpact: `+${composureLevel * 2}% morale stability`,
    trainingImpact: 'Neutral',
  });

  const determinationLevel = traitSet.has('never_give_up') ? 5 : traitSet.has('big_game_player') ? 4 : player.careerStats.totalAppearances > 50 ? 3 : player.careerStats.totalAppearances > 20 ? 2 : 1;
  traits.push({
    id: 'determination',
    name: 'Work Rate',
    description: 'Relentless work ethic and commitment to every match.',
    icon: <Flame className="h-4 w-4" />,
    category: 'mental',
    level: determinationLevel,
    maxLevel: 5,
    effect: `+${determinationLevel * 3}% stamina retention`,
    matchImpact: `+${determinationLevel * 0.1} rating when trailing`,
    moraleImpact: `+${determinationLevel * 4}% morale recovery after loss`,
    trainingImpact: `+${determinationLevel * 2}% training gain`,
  });

  const bigGameLevel = traitSet.has('big_game_player') ? 5 : player.overall > 80 ? 3 : player.reputation > 40 ? 2 : 1;
  traits.push({
    id: 'big_game',
    name: 'Big Game Mentality',
    description: 'Elevates performance when the stakes are highest.',
    icon: <Trophy className="h-4 w-4" />,
    category: 'mental',
    level: bigGameLevel,
    maxLevel: 5,
    effect: `+${bigGameLevel * 3}% rating in important matches`,
    matchImpact: `+${bigGameLevel * 0.2} vs top-5 opponents`,
    moraleImpact: 'Neutral',
    trainingImpact: 'Neutral',
  });

  // ---- PHYSICAL ----
  const speedLevel = traitSet.has('speed_demon') ? 5 : traitSet.has('speedster') ? 4 : player.attributes.pace > 80 ? 3 : player.attributes.pace > 60 ? 2 : 1;
  traits.push({
    id: 'speed',
    name: 'Pace',
    description: 'Explosive speed over short and long distances.',
    icon: <Zap className="h-4 w-4" />,
    category: 'physical',
    level: speedLevel,
    maxLevel: 5,
    effect: `+${speedLevel * 4}% sprint success rate`,
    matchImpact: `+${speedLevel * 0.1} rating on counter-attacks`,
    moraleImpact: 'Neutral',
    trainingImpact: `+${speedLevel}% pace training gain`,
  });

  const staminaLevel = traitSet.has('marathon_runner') ? 5 : traitSet.has('iron_man') ? 4 : player.attributes.physical > 75 ? 3 : player.attributes.physical > 55 ? 2 : 1;
  traits.push({
    id: 'stamina',
    name: 'Endurance',
    description: 'Maintains high performance levels throughout 90+ minutes.',
    icon: <Activity className="h-4 w-4" />,
    category: 'physical',
    level: staminaLevel,
    maxLevel: 5,
    effect: `+${staminaLevel * 5}% fitness retention at 80th min`,
    matchImpact: `-${staminaLevel * 3}% fatigue penalty`,
    moraleImpact: 'Neutral',
    trainingImpact: `+${staminaLevel}% recovery between sessions`,
  });

  const strengthLevel = traitSet.has('tank') ? 5 : traitSet.has('iron_wall') ? 4 : player.attributes.physical > 80 ? 3 : player.attributes.physical > 65 ? 2 : 1;
  traits.push({
    id: 'strength',
    name: 'Strength',
    description: 'Physical dominance in aerial duels and challenges.',
    icon: <Shield className="h-4 w-4" />,
    category: 'physical',
    level: strengthLevel,
    maxLevel: 5,
    effect: `+${strengthLevel * 5}% duel win rate`,
    matchImpact: `+${strengthLevel * 0.1} rating in physical battles`,
    moraleImpact: 'Neutral',
    trainingImpact: `+${strengthLevel}% physical training gain`,
  });

  const durabilityLevel = traitSet.has('iron_man') ? 5 : traitSet.has('quick_recovery') ? 4 : !traitSet.has('injury_prone') ? 2 : 1;
  traits.push({
    id: 'durability',
    name: 'Durability',
    description: 'Resilience to injuries and quick recovery times.',
    icon: <Heart className="h-4 w-4" />,
    category: 'physical',
    level: durabilityLevel,
    maxLevel: 5,
    effect: durabilityLevel > 3 ? '-30% injury duration' : `-${durabilityLevel * 10}% injury risk`,
    matchImpact: 'Neutral',
    moraleImpact: `+${durabilityLevel * 2}% confidence when fit`,
    trainingImpact: `+${durabilityLevel}% training availability`,
  });

  // ---- TECHNICAL ----
  const finishingLevel = traitSet.has('clinical_finisher') ? 5 : traitSet.has('poacher') ? 4 : player.attributes.shooting > 80 ? 3 : player.attributes.shooting > 60 ? 2 : 1;
  traits.push({
    id: 'finishing',
    name: 'Finishing',
    description: 'Clinical ability to convert chances into goals.',
    icon: <Target className="h-4 w-4" />,
    category: 'technical',
    level: finishingLevel,
    maxLevel: 5,
    effect: `+${finishingLevel * 3}% goal conversion`,
    matchImpact: `+${finishingLevel * 0.15} rating when shooting`,
    moraleImpact: `+${finishingLevel * 2}% confidence after scoring`,
    trainingImpact: `+${finishingLevel}% shooting training gain`,
  });

  const passingLevel = traitSet.has('playmaker') ? 5 : traitSet.has('technical') ? 4 : player.attributes.passing > 80 ? 3 : player.attributes.passing > 60 ? 2 : 1;
  traits.push({
    id: 'passing',
    name: 'Passing',
    description: 'Range and accuracy of passing in all situations.',
    icon: <Handshake className="h-4 w-4" />,
    category: 'technical',
    level: passingLevel,
    maxLevel: 5,
    effect: `+${passingLevel * 3}% pass completion`,
    matchImpact: `+${passingLevel * 0.1} rating as playmaker`,
    moraleImpact: 'Neutral',
    trainingImpact: `+${passingLevel}% passing training gain`,
  });

  const dribblingLevel = traitSet.has('technical') ? 5 : traitSet.has('speed_demon') ? 3 : player.attributes.dribbling > 80 ? 4 : player.attributes.dribbling > 60 ? 2 : 1;
  traits.push({
    id: 'dribbling',
    name: 'Ball Control',
    description: 'Close control and dribbling in tight spaces.',
    icon: <Wrench className="h-4 w-4" />,
    category: 'technical',
    level: dribblingLevel,
    maxLevel: 5,
    effect: `+${dribblingLevel * 4}% successful dribbles`,
    matchImpact: `+${dribblingLevel * 0.1} rating in 1v1 situations`,
    moraleImpact: 'Neutral',
    trainingImpact: `+${dribblingLevel}% dribbling training gain`,
  });

  const defendingLevel = traitSet.has('iron_wall') ? 5 : player.attributes.defending > 75 ? 3 : player.attributes.defending > 55 ? 2 : 1;
  traits.push({
    id: 'defending_tech',
    name: 'Defensive Technique',
    description: 'Tackling, interception, and positional awareness.',
    icon: <Sword className="h-4 w-4" />,
    category: 'technical',
    level: defendingLevel,
    maxLevel: 5,
    effect: `+${defendingLevel * 3}% tackle success`,
    matchImpact: `+${defendingLevel * 0.1} rating when defending`,
    moraleImpact: 'Neutral',
    trainingImpact: `+${defendingLevel}% defending training gain`,
  });

  // ---- SOCIAL ----
  const teamPlayerLevel = traitSet.has('leader') ? 5 : traitSet.has('fan_favorite') ? 4 : player.careerStats.totalAppearances > 40 ? 3 : player.careerStats.totalAssists > 15 ? 2 : 1;
  traits.push({
    id: 'team_player',
    name: 'Team Player',
    description: 'Selfless play that elevates the entire squad.',
    icon: <Users className="h-4 w-4" />,
    category: 'social',
    level: teamPlayerLevel,
    maxLevel: 5,
    effect: `+${teamPlayerLevel * 2}% team cohesion`,
    matchImpact: `+${teamPlayerLevel * 0.08} rating alongside high-chemistry teammates`,
    moraleImpact: `+${teamPlayerLevel * 3}% squad morale`,
    trainingImpact: 'Neutral',
  });

  const mediaLevel = traitSet.has('media_darling') ? 5 : traitSet.has('fan_favorite') ? 4 : player.reputation > 60 ? 3 : player.reputation > 35 ? 2 : 1;
  traits.push({
    id: 'media',
    name: 'Media Presence',
    description: 'How well the player handles media and public attention.',
    icon: <MessageCircle className="h-4 w-4" />,
    category: 'social',
    level: mediaLevel,
    maxLevel: 5,
    effect: `+${mediaLevel * 3}% sponsor interest`,
    matchImpact: 'Neutral',
    moraleImpact: mediaLevel > 3 ? '+5% morale from positive press' : 'Neutral',
    trainingImpact: 'Neutral',
  });

  const fanFavLevel = traitSet.has('fan_favorite') ? 5 : traitSet.has('club_legend') ? 4 : player.reputation > 45 ? 3 : player.careerStats.totalGoals > 20 ? 2 : 1;
  traits.push({
    id: 'fan_favorite',
    name: 'Fan Connection',
    description: "Bond with supporters and ability to be a crowd favorite.",
    icon: <Heart className="h-4 w-4" />,
    category: 'social',
    level: fanFavLevel,
    maxLevel: 5,
    effect: `+${fanFavLevel * 2}% reputation gains`,
    matchImpact: `+${fanFavLevel * 0.1} home advantage boost`,
    moraleImpact: `+${fanFavLevel * 3}% morale at home`,
    trainingImpact: 'Neutral',
  });

  const mentorLevel = traitSet.has('leader') ? 4 : traitSet.has('quick_learner') ? 3 : player.age > 25 && player.careerStats.totalAppearances > 100 ? 3 : player.age > 22 ? 2 : 1;
  traits.push({
    id: 'mentor',
    name: 'Mentorship',
    description: 'Ability to guide and develop younger teammates.',
    icon: <Star className="h-4 w-4" />,
    category: 'social',
    level: mentorLevel,
    maxLevel: 5,
    effect: `+${mentorLevel * 2}% youth development speed`,
    matchImpact: 'Neutral',
    moraleImpact: `+${mentorLevel * 2}% team atmosphere`,
    trainingImpact: `+${mentorLevel}% youth training bonus`,
  });

  const consistencyLevel = traitSet.has('consistent') ? 5 : traitSet.has('quick_learner') ? 3 : player.form > 7 ? 4 : player.form > 6 ? 2 : 1;
  traits.push({
    id: 'consistency',
    name: 'Consistency',
    description: 'Reliable performances week after week.',
    icon: <TrendingUp className="h-4 w-4" />,
    category: 'social',
    level: consistencyLevel,
    maxLevel: 5,
    effect: `+${consistencyLevel * 2}% minimum rating floor`,
    matchImpact: `±${consistencyLevel < 3 ? '15' : consistencyLevel < 4 ? '8' : '3'}% rating variance`,
    moraleImpact: `+${consistencyLevel * 2}% morale stability`,
    trainingImpact: `+${consistencyLevel}% training consistency`,
  });

  return traits;
}

// ============================================================
// Level bar component
// ============================================================

function LevelBar({ level, maxLevel, color }: { level: number; maxLevel: number; color: string }) {
  const percentage = (level / maxLevel) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#21262d] rounded-md overflow-hidden">
        <motion.div
          className="h-full rounded-md"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-bold min-w-[28px] text-right" style={{ color }}>
        {level}/{maxLevel}
      </span>
    </div>
  );
}

// ============================================================
// Trait detail card
// ============================================================

function TraitDetail({ trait, config }: { trait: PersonalityTrait; config: CategoryConfig }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-start gap-2.5">
            {/* Icon */}
            <div
              className="w-9 h-9 flex items-center justify-center rounded-lg border shrink-0"
              style={{
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
                color: config.color,
              }}
            >
              {trait.icon}
            </div>

            {/* Name + description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#c9d1d9]">{trait.name}</span>
                {trait.level >= 4 && (
                  <Badge className="h-4 px-1 text-[9px] rounded-md border" style={{ backgroundColor: config.bgColor, color: config.color, borderColor: config.borderColor }}>
                    Elite
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-[#8b949e] mt-0.5 leading-relaxed line-clamp-2">
                {trait.description}
              </p>
              <LevelBar level={trait.level} maxLevel={trait.maxLevel} color={config.color} />
            </div>
          </div>

          {/* Effect summary */}
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#30363d]/60">
            <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
            <span className="text-[11px] font-medium text-emerald-400">{trait.effect}</span>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-[10px] text-[#484f58] hover:text-[#8b949e] transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <span>{expanded ? 'Less' : 'Impact details'}</span>
          </button>

          {/* Expanded impact breakdown */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              className="mt-2 pt-2 border-t border-[#30363d]/60 space-y-2"
            >
              <ImpactRow
                label="Match Rating"
                value={trait.matchImpact}
                icon={<Target className="h-3 w-3" />}
                positive={!trait.matchImpact.includes('-')}
              />
              <ImpactRow
                label="Morale Effect"
                value={trait.moraleImpact}
                icon={<Heart className="h-3 w-3" />}
                positive={!trait.moraleImpact.includes('-')}
              />
              <ImpactRow
                label="Training"
                value={trait.trainingImpact}
                icon={<Dumbbell className="h-3 w-3" />}
                positive={!trait.trainingImpact.includes('-')}
              />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ImpactRow({ label, value, icon, positive }: { label: string; value: string; icon: React.ReactNode; positive: boolean }) {
  const isNeutral = value === 'Neutral';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#484f58]">{icon}</span>
      <span className="text-[10px] text-[#484f58] w-20 shrink-0">{label}</span>
      <span className={`text-[11px] font-medium ${isNeutral ? 'text-[#484f58]' : positive ? 'text-emerald-400' : 'text-red-400'}`}>
        {value}
      </span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PlayerTraitsEnhanced() {
  const gameState = useGameStore((state) => state.gameState);
  const [activeCategory, setActiveCategory] = useState<PersonalityCategory | 'all'>('all');

  const personalityTraits = useMemo(() => {
    if (!gameState?.player) return [];
    return generatePersonalityTraits(gameState.player);
  }, [gameState]);

  const filteredTraits = useMemo(() => {
    if (activeCategory === 'all') return personalityTraits;
    return personalityTraits.filter(t => t.category === activeCategory);
  }, [personalityTraits, activeCategory]);

  const categoryStats = useMemo(() => {
    const stats: Record<PersonalityCategory, { avg: number; count: number }> = {
      mental: { avg: 0, count: 0 },
      physical: { avg: 0, count: 0 },
      technical: { avg: 0, count: 0 },
      social: { avg: 0, count: 0 },
    };
    for (const trait of personalityTraits) {
      stats[trait.category].avg += trait.level;
      stats[trait.category].count++;
    }
    for (const cat of Object.keys(stats) as PersonalityCategory[]) {
      if (stats[cat].count > 0) {
        stats[cat].avg = Math.round((stats[cat].avg / stats[cat].count) * 10) / 10;
      }
    }
    return stats;
  }, [personalityTraits]);

  const overallScore = useMemo(() => {
    if (personalityTraits.length === 0) return 0;
    const total = personalityTraits.reduce((sum, t) => sum + t.level, 0);
    const max = personalityTraits.reduce((sum, t) => sum + t.maxLevel, 0);
    return Math.round((total / max) * 100);
  }, [personalityTraits]);

  const traitsGroupedByCategory = useMemo(() => {
    const groups: { category: PersonalityCategory; traits: PersonalityTrait[] }[] = [];
    for (const cat of ['mental', 'physical', 'technical', 'social'] as PersonalityCategory[]) {
      const catTraits = filteredTraits.filter(t => t.category === cat);
      if (catTraits.length > 0) {
        groups.push({ category: cat, traits: catTraits });
      }
    }
    return groups;
  }, [filteredTraits]);

  if (!gameState) return null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#c9d1d9]">Player Traits</h1>
              <p className="text-[11px] text-[#8b949e]">Personality profile & gameplay impact</p>
            </div>
          </div>
          <Badge className="h-6 px-2 text-xs font-semibold rounded-md border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
            {overallScore}%
          </Badge>
        </div>

        {/* Category overview cards */}
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(CATEGORY_CONFIG) as [PersonalityCategory, CategoryConfig][]).map(([cat, config]) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                activeCategory === cat
                  ? ''
                  : 'hover:bg-[#21262d]'
              }`}
              style={{
                backgroundColor: activeCategory === cat ? config.bgColor : '#161b22',
                borderColor: activeCategory === cat ? config.borderColor : '#30363d',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span style={{ color: config.color }}>{config.icon}</span>
                <span className="text-xs font-semibold" style={{ color: config.color }}>
                  {config.label}
                </span>
              </div>
              <p className="text-lg font-bold text-[#c9d1d9]">
                {categoryStats[cat].avg}
                <span className="text-[10px] text-[#484f58] font-normal ml-1">avg</span>
              </p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* All tab button */}
      {activeCategory !== 'all' && (
        <button
          onClick={() => setActiveCategory('all')}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
        >
          Show all categories
        </button>
      )}

      {/* Trait list by category */}
      {traitsGroupedByCategory.map((group, groupIdx) => {
        const config = CATEGORY_CONFIG[group.category];
        return (
          <div key={group.category} className="space-y-2">
            {activeCategory === 'all' && (
              <div className="flex items-center gap-2 px-1">
                <span style={{ color: config.color }}>{config.icon}</span>
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="text-[10px] text-[#484f58]">{group.traits.length} traits</span>
              </div>
            )}
            {group.traits.map((trait, idx) => (
              <TraitDetail
                key={trait.id}
                trait={trait}
                config={config}
              />
            ))}
          </div>
        );
      })}

      {/* How traits affect gameplay info card */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">
              How Traits Work
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Target className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-[#c9d1d9]">Match Rating</p>
                <p className="text-[10px] text-[#8b949e] leading-relaxed">
                  Traits modify your match rating based on context — big games, home advantage, position, and form.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Heart className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-[#c9d1d9]">Morale</p>
                <p className="text-[10px] text-[#8b949e] leading-relaxed">
                  Social and mental traits affect how quickly you recover morale after setbacks.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Dumbbell className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-[#c9d1d9]">Training</p>
                <p className="text-[10px] text-[#8b949e] leading-relaxed">
                  Technical and physical traits boost training efficiency for specific attributes.
                </p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[#484f58] mt-2.5 leading-relaxed">
            Trait levels are calculated from your gameplay traits, attributes, career stats, and reputation. Unlock more traits through career milestones to increase your personality ratings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
