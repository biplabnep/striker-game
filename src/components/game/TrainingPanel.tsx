'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { TrainingType, PlayerAttributes, SeasonTrainingFocusArea, CoreAttribute } from '@/lib/game/types';
import { FOCUS_AREA_ATTRIBUTES } from '@/lib/game/progressionEngine';
import SeasonTrainingFocusModal from './SeasonTrainingFocusModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dumbbell, Sword, Shield, Zap, Brain, Heart,
  AlertTriangle, Flame,
  Activity, BarChart3, History,
  Star, Target, Check, TrendingUp,
} from 'lucide-react';

// ============================================================
// Training type definitions
// ============================================================
const trainingTypes: {
  type: TrainingType;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  focusAttrs: (keyof PlayerAttributes)[];
  expectedGainRange: [number, number];
  shortLabel: string;
  intensityLevel: 1 | 2 | 3; // 1=low, 2=medium, 3=high difficulty
  fatigueImpact: number; // fatigue cost at medium intensity
}[] = [
  {
    type: 'attacking',
    icon: <Sword className="h-4 w-4" />,
    label: 'Attacking',
    description: 'Shooting & dribbling drills',
    color: '#ef4444',
    focusAttrs: ['shooting', 'dribbling'],
    expectedGainRange: [1, 3],
    shortLabel: 'SHO +2, DRI +1',
    intensityLevel: 3,
    fatigueImpact: 15,
  },
  {
    type: 'defensive',
    icon: <Shield className="h-4 w-4" />,
    label: 'Defensive',
    description: 'Tackling & positioning',
    color: '#3b82f6',
    focusAttrs: ['defending'],
    expectedGainRange: [1, 3],
    shortLabel: 'DEF +2',
    intensityLevel: 2,
    fatigueImpact: 12,
  },
  {
    type: 'physical',
    icon: <Zap className="h-4 w-4" />,
    label: 'Physical',
    description: 'Sprint & conditioning',
    color: '#f59e0b',
    focusAttrs: ['pace', 'physical'],
    expectedGainRange: [1, 3],
    shortLabel: 'PAC +1, PHY +2',
    intensityLevel: 3,
    fatigueImpact: 18,
  },
  {
    type: 'technical',
    icon: <Dumbbell className="h-4 w-4" />,
    label: 'Technical',
    description: 'Passing & first touch',
    color: '#10b981',
    focusAttrs: ['passing', 'dribbling'],
    expectedGainRange: [1, 3],
    shortLabel: 'PAS +2, DRI +1',
    intensityLevel: 2,
    fatigueImpact: 10,
  },
  {
    type: 'tactical',
    icon: <Brain className="h-4 w-4" />,
    label: 'Tactical',
    description: 'Match analysis & positioning',
    color: '#8b5cf6',
    focusAttrs: ['passing', 'defending'],
    expectedGainRange: [1, 2],
    shortLabel: 'PAS +1, DEF +1',
    intensityLevel: 1,
    fatigueImpact: 6,
  },
  {
    type: 'recovery',
    icon: <Heart className="h-4 w-4" />,
    label: 'Recovery',
    description: 'Rest & regeneration',
    color: '#ec4899',
    focusAttrs: [],
    expectedGainRange: [0, 0],
    shortLabel: 'Rest',
    intensityLevel: 1,
    fatigueImpact: -10,
  },
];

// ============================================================
// Intensity definitions
// ============================================================
const intensities: {
  value: number;
  label: string;
  color: string;
  fatigueCost: number;
  gainMultiplier: number;
}[] = [
  { value: 30, label: 'Low', color: '#10b981', fatigueCost: 5, gainMultiplier: 1.0 },
  { value: 60, label: 'Medium', color: '#f59e0b', fatigueCost: 12, gainMultiplier: 1.5 },
  { value: 90, label: 'High', color: '#ef4444', fatigueCost: 22, gainMultiplier: 2.0 },
];

const attrLabels: Record<CoreAttribute, string> = {
  pace: 'Pace',
  shooting: 'SHO',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physical: 'PHY',
};

const attrFullLabels: Record<CoreAttribute, string> = {
  pace: 'Pace',
  shooting: 'Shooting',
  passing: 'Passing',
  dribbling: 'Dribbling',
  defending: 'Defending',
  physical: 'Physical',
};

const attrIcons: Record<CoreAttribute, React.ReactNode> = {
  pace: <Zap className="h-3 w-3" />,
  shooting: <Sword className="h-3 w-3" />,
  passing: <Brain className="h-3 w-3" />,
  dribbling: <Dumbbell className="h-3 w-3" />,
  defending: <Shield className="h-3 w-3" />,
  physical: <Flame className="h-3 w-3" />,
};

// ============================================================
// Radar chart helper
// ============================================================
const coreAttrKeys: CoreAttribute[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

function getIntensityBarColor(level: 1 | 2 | 3): string {
  switch (level) {
    case 1: return '#10b981';
    case 2: return '#f59e0b';
    case 3: return '#ef4444';
  }
}

function getIntensityBarLabel(level: 1 | 2 | 3): string {
  switch (level) {
    case 1: return 'Easy';
    case 2: return 'Medium';
    case 3: return 'Hard';
  }
}

function buildRadarPoints(attrs: PlayerAttributes | Record<string, number>, cx: number, cy: number, r: number): string {
  const n = coreAttrKeys.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // Start from top
  return coreAttrKeys
    .map((key, i) => {
      const angle = startAngle + i * angleStep;
      const val = (attrs[key] ?? 0) / 100;
      const x = cx + r * val * Math.cos(angle);
      const y = cy + r * val * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function buildRadarLabels(cx: number, cy: number, r: number): { x: number; y: number; label: string; key: CoreAttribute }[] {
  const n = coreAttrKeys.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;
  return coreAttrKeys.map((key, i) => {
    const angle = startAngle + i * angleStep;
    const labelR = r + 14;
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
      label: attrLabels[key],
      key,
    };
  });
}

// ============================================================
// Main Component
// ============================================================
export default function TrainingPanel() {
  const gameState = useGameStore(state => state.gameState);
  const scheduleTraining = useGameStore(state => state.scheduleTraining);
  const scheduledTraining = useGameStore(state => state.scheduledTraining);

  const [selectedType, setSelectedType] = useState<TrainingType | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState(30);
  const [focusAttr, setFocusAttr] = useState<keyof PlayerAttributes | undefined>(undefined);
  const [showFocusModal, setShowFocusModal] = useState(false);

  // ============================================================
  // Derived state
  // ============================================================
  const selectedTrainingConfig = useMemo(
    () => trainingTypes.find(t => t.type === selectedType) ?? null,
    [selectedType]
  );

  const selectedIntensityConfig = useMemo(
    () => intensities.find(i => i.value === selectedIntensity) ?? intensities[0],
    [selectedIntensity]
  );

  const fatigueRisk = useMemo(() => {
    if (!gameState) return 'none';
    const fitness = gameState.player.fitness;
    if (fitness < 40) return 'critical';
    if (fitness < 60) return 'warning';
    return 'none';
  }, [gameState]);

  const isIntenseDisabled = useMemo(
    () => fatigueRisk === 'critical' && selectedIntensity === 90,
    [fatigueRisk, selectedIntensity]
  );

  const seasonFocusAttrs = useMemo(() => {
    if (!gameState?.seasonTrainingFocus) return new Set<keyof PlayerAttributes>();
    return new Set(gameState.seasonTrainingFocus.focusAttributes);
  }, [gameState]);

  const seasonFocusAreaLabel = useMemo(() => {
    if (!gameState?.seasonTrainingFocus) return '';
    const area = gameState.seasonTrainingFocus.area;
    const labels: Record<SeasonTrainingFocusArea, string> = {
      attacking: 'Attacking',
      defensive: 'Defensive',
      physical: 'Physical',
      technical: 'Technical',
      tactical: 'Tactical',
    };
    return labels[area];
  }, [gameState]);

  const seasonFocusAttrNames = useMemo(() => {
    if (!gameState?.seasonTrainingFocus) return '';
    return gameState.seasonTrainingFocus.focusAttributes
      .map(attr => attrFullLabels[attr])
      .join(' & ');
  }, [gameState]);

  const recentTrainingHistory = useMemo(() => {
    if (!gameState) return [];
    return gameState.trainingHistory.slice(-5).reverse();
  }, [gameState]);

  const weeklyProgress = useMemo(() => {
    if (!gameState) return [];
    const used = 3 - gameState.trainingAvailable;
    return Array.from({ length: 3 }, (_, i) => i < used);
  }, [gameState]);

  // Compute attribute deltas from training history this season
  const seasonAttrDeltas = useMemo(() => {
    if (!gameState) return new Map<keyof PlayerAttributes, number>();
    const deltas = new Map<keyof PlayerAttributes, number>();
    const currentSeason = gameState.currentSeason;
    for (const session of gameState.trainingHistory) {
      // Count focusAttribute occurrences from this season's training
      if (session.focusAttribute) {
        const current = deltas.get(session.focusAttribute) ?? 0;
        deltas.set(session.focusAttribute, current + 1);
      }
    }
    return deltas;
  }, [gameState]);

  // Recommended training type based on season focus
  const recommendedTrainingType = useMemo((): TrainingType | null => {
    if (!gameState?.seasonTrainingFocus) return null;
    return gameState.seasonTrainingFocus.area;
  }, [gameState]);

  // Compute simulated gains for history sessions
  const historyGains = useMemo(() => {
    if (!gameState) return new Map<number, { total: number; attrs: string[]; quality: 'good' | 'average' | 'none' }>();
    const map = new Map<number, { total: number; attrs: string[]; quality: 'good' | 'average' | 'none' }>();
    for (const session of gameState.trainingHistory) {
      const conf = trainingTypes.find(t => t.type === session.type);
      if (!conf) continue;
      const intConf = intensities.find(i => i.value === session.intensity) ?? intensities[0];
      let total = 0;
      const attrs: string[] = [];
      for (const attr of conf.focusAttrs) {
        const [minB, maxB] = conf.expectedGainRange;
        const isFocused = session.focusAttribute === attr;
        const boost = isFocused ? 1.5 : 1.0;
        const maxGain = Math.round(maxB * intConf.gainMultiplier * boost);
        if (maxGain > 0) {
          total += maxGain;
          attrs.push(attrLabels[attr as CoreAttribute]);
        }
      }
      let quality: 'good' | 'average' | 'none' = 'none';
      if (total >= 4) quality = 'good';
      else if (total >= 2) quality = 'average';
      map.set(session.completedAt, { total, attrs, quality });
    }
    return map;
  }, [gameState]);

  // Auto-schedule training when type, intensity, or focus attribute changes
  useEffect(() => {
    if (!selectedType || !gameState) return;
    if (gameState.trainingAvailable <= 0) return;
    if (isIntenseDisabled) return;
    scheduleTraining({
      type: selectedType,
      intensity: selectedIntensity,
      focusAttribute: focusAttr,
      completedAt: Date.now(),
    });
  }, [selectedType, selectedIntensity, focusAttr, gameState, scheduleTraining, isIntenseDisabled]);

  // Expected gains for selected training type
  const expectedGains = useMemo(() => {
    if (!selectedTrainingConfig || !gameState) return null;
    const gains: Partial<Record<keyof PlayerAttributes, { min: number; max: number }>> = {};
    const mult = selectedIntensityConfig.gainMultiplier;

    for (const attr of selectedTrainingConfig.focusAttrs) {
      const [minBase, maxBase] = selectedTrainingConfig.expectedGainRange;
      const isFocused = focusAttr === attr;
      const boost = isFocused ? 1.5 : 1.0;
      gains[attr] = {
        min: Math.round(minBase * mult * boost * 10) / 10,
        max: Math.round(maxBase * mult * boost * 10) / 10,
      };
    }
    return gains;
  }, [selectedTrainingConfig, selectedIntensityConfig, focusAttr, gameState]);

  // ============================================================
  // SVG Visualization Derived Data
  // ============================================================

  // Training type distribution counts (for donut chart)
  const trainingTypeDistribution = useMemo(() => {
    if (!gameState) return { attacking: 0, defensive: 0, physical: 0, technical: 0, tactical: 0 };
    return gameState.trainingHistory.reduce<Record<string, number>>((acc, session) => {
      const t = session.type;
      if (t !== 'recovery') {
        acc[t] = (acc[t] ?? 0) + 1;
      }
      return acc;
    }, { attacking: 0, defensive: 0, physical: 0, technical: 0, tactical: 0 });
  }, [gameState]);

  // Intensity distribution counts (for bar chart)
  const intensityDistribution = useMemo(() => {
    if (!gameState) return { low: 0, medium: 0, high: 0 };
    return gameState.trainingHistory.reduce<Record<string, number>>((acc, session) => {
      if (session.intensity <= 30) acc.low = (acc.low ?? 0) + 1;
      else if (session.intensity <= 60) acc.medium = (acc.medium ?? 0) + 1;
      else acc.high = (acc.high ?? 0) + 1;
      return acc;
    }, { low: 0, medium: 0, high: 0 });
  }, [gameState]);

  // Recent 5 session gain totals (for trend line)
  const recentGainTotals = useMemo(() => {
    if (!gameState) return [0, 0, 0, 0, 0];
    return gameState.trainingHistory.slice(-5).map(session => {
      const conf = trainingTypes.find(t => t.type === session.type);
      if (!conf) return 0;
      const intConf = intensities.find(i => i.value === session.intensity) ?? intensities[0];
      return conf.focusAttrs.reduce((sum, attr) => {
        const [, maxB] = conf.expectedGainRange;
        const boost = session.focusAttribute === attr ? 1.5 : 1.0;
        return sum + Math.round(maxB * intConf.gainMultiplier * boost);
      }, 0);
    });
  }, [gameState]);

  // Simulated 8-week attribute development data
  const simulatedDevelopment = useMemo(() => {
    if (!gameState) return coreAttrKeys.map(() => Array.from({ length: 8 }, (_, i) => 50));
    return coreAttrKeys.map(key => {
      const base = gameState.player.attributes[key] ?? 50;
      return Array.from({ length: 8 }, (_, i) => {
        const progress = i / 7;
        return Math.min(99, base - 6 + progress * 12);
      });
    });
  }, [gameState]);

  // Simulated 8-week recovery data
  const simulatedRecovery = useMemo(() => {
    if (!gameState) return Array.from({ length: 8 }, (_, i) => 50 + i * 5);
    const currentFitness = gameState.player.fitness;
    return Array.from({ length: 8 }, (_, i) => {
      const recovery = Math.min(100, currentFitness - 20 + i * 12);
      return Math.max(20, recovery);
    });
  }, [gameState]);

  // Training efficiency per area (for efficiency radar)
  const trainingEfficiency = useMemo(() => {
    const areaKeys = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;
    if (!gameState) return areaKeys.map(() => 30);
    return areaKeys.map(key => {
      const relevantSessions = gameState.trainingHistory.filter(s => {
        const conf = trainingTypes.find(t => t.type === s.type);
        return conf && conf.focusAttrs.includes(key);
      });
      if (relevantSessions.length === 0) return 25;
      const avgGain = relevantSessions.reduce((sum, s) => {
        const conf = trainingTypes.find(t => t.type === s.type);
        if (!conf) return sum;
        const intConf = intensities.find(i => i.value === s.intensity) ?? intensities[0];
        const [, maxB] = conf.expectedGainRange;
        const boost = s.focusAttribute === key ? 1.5 : 1.0;
        return sum + maxB * intConf.gainMultiplier * boost;
      }, 0) / relevantSessions.length;
      return Math.min(100, Math.round((avgGain / 6) * 100));
    });
  }, [gameState]);

  // Weekly training calendar heatmap data (4 weeks x 7 days)
  const calendarHeatmap = useMemo(() => {
    if (!gameState) return Array.from({ length: 28 }, () => 0);
    const data = Array.from({ length: 28 }, () => 0);
    gameState.trainingHistory.slice(-28).forEach((session, i) => {
      if (i < 28) {
        data[27 - i] = session.intensity;
      }
    });
    return data;
  }, [gameState]);

  // Expected gains per attribute for selected training (for bars)
  const expectedGainsByAttr = useMemo(() => {
    if (!selectedTrainingConfig || !gameState) return coreAttrKeys.map(() => 0);
    return coreAttrKeys.map(key => {
      const gain = expectedGains?.[key];
      if (!gain) return 0;
      return gain.max;
    });
  }, [selectedTrainingConfig, expectedGains, gameState]);

  if (!gameState) return null;

  const { player, trainingAvailable } = gameState;

  // ============================================================
  // Handlers
  // ============================================================
  const handleTypeSelect = (type: TrainingType) => {
    setSelectedType(type);
    const config = trainingTypes.find(t => t.type === type);
    if (config && config.focusAttrs.length > 0) {
      setFocusAttr(config.focusAttrs[0]);
    } else {
      setFocusAttr(undefined);
    }
  };

  // ============================================================
  // Render helpers
  // ============================================================
  const getAttrBarColor = (value: number) => {
    if (value >= 75) return '#10b981';
    if (value >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-4 max-w-lg mx-auto space-y-3">

      {/* Season Training Focus Banner — with colored type icon */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          {gameState.seasonTrainingFocus ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {/* Colored type icon matching focus area */}
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${trainingTypes.find(t => t.type === gameState.seasonTrainingFocus!.area)?.color ?? '#10b981'}18`,
                    color: trainingTypes.find(t => t.type === gameState.seasonTrainingFocus!.area)?.color ?? '#10b981',
                  }}
                >
                  {trainingTypes.find(t => t.type === gameState.seasonTrainingFocus!.area)?.icon ?? <Target className="h-3.5 w-3.5" />}
                </div>
                <span className="text-sm font-semibold text-[#c9d1d9]">
                  Season Focus: {seasonFocusAreaLabel}
                </span>
                <Badge className="h-5 px-1.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-md">
                  {gameState.seasonTrainingFocus.bonusMultiplier}x
                </Badge>
              </div>
              <p className="text-xs text-[#8b949e]">
                Bonus applied to {seasonFocusAttrNames}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {gameState.seasonTrainingFocus.focusAttributes.map(attr => (
                  <div
                    key={attr}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <Star className="h-2.5 w-2.5 text-emerald-400 fill-emerald-400" />
                    <span className="text-[11px] font-medium text-emerald-300">{attrFullLabels[attr]}</span>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFocusModal(true)}
                  className="h-6 text-[11px] ml-auto border-[#30363d] text-[#8b949e] hover:text-emerald-400 hover:border-emerald-500/40 rounded-md px-2"
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping opacity-75" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-300 font-medium">
                  No focus set — Select one below
                </p>
                <p className="text-xs text-[#8b949e]">
                  Set focus to get 1.5x–2.0x growth bonus
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFocusModal(true)}
                className="h-7 text-xs border-emerald-600/40 text-emerald-400 hover:bg-emerald-600/10 rounded-md"
              >
                Set Focus
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section Divider */}
      <div className="border-t border-[#21262d]" />

      {/* Header with session count & progress dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-[#c9d1d9]">Training</h2>
        </div>
        {/* Quick Train button */}
        {recommendedTrainingType && trainingAvailable > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleTypeSelect(recommendedTrainingType)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
          >
            <Zap className="h-3 w-3" />
            Quick Train
          </motion.button>
        )}
      </div>

      {/* Weekly Training Load — dots + fatigue level */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#8b949e] uppercase tracking-wide font-medium">Weekly Training Load</span>
            <span className="text-[11px] font-semibold" style={{ color: player.fitness > 60 ? '#10b981' : player.fitness > 30 ? '#f59e0b' : '#ef4444' }}>
              {3 - trainingAvailable}/3 Sessions
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Visual session dots */}
            <div className="flex items-center gap-1.5">
              {weeklyProgress.map((used, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.06 }}
                  className={`w-2.5 h-2.5 rounded-full border ${
                    used
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-transparent border-[#30363d]'
                  }`}
                />
              ))}
            </div>
            {/* Fitness level color indicator */}
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: player.fitness > 60 ? '#10b981' : player.fitness > 30 ? '#f59e0b' : '#ef4444' }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: player.fitness > 60 ? '#10b981' : player.fitness > 30 ? '#f59e0b' : '#ef4444' }}
              >
                Fitness {player.fitness}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fatigue Warning */}
      <AnimatePresence>
        {fatigueRisk !== 'none' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Card
              className={`border ${
                fatigueRisk === 'critical'
                  ? 'bg-[#161b22] border-red-600/60'
                  : 'bg-[#161b22] border-amber-600/60'
              }`}
            >
              <CardContent className="p-3 flex items-center gap-2.5">
                <AlertTriangle
                  className={`h-4 w-4 shrink-0 ${
                    fatigueRisk === 'critical' ? 'text-red-400' : 'text-amber-400'
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      fatigueRisk === 'critical' ? 'text-red-300' : 'text-amber-300'
                    }`}
                  >
                    {fatigueRisk === 'critical'
                      ? 'Extremely Low Fitness'
                      : 'Low Fitness Warning'}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      fatigueRisk === 'critical' ? 'text-red-400/70' : 'text-amber-400/70'
                    }`}
                  >
                    {fatigueRisk === 'critical'
                      ? `Fitness at ${player.fitness}%. Intense training disabled.`
                      : `Fitness at ${player.fitness}%. Increased injury risk.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fitness Bar */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Heart className="h-3.5 w-3.5 text-pink-400" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Fitness</span>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: getAttrBarColor(player.fitness) }}
            >
              {player.fitness}%
            </span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
            <motion.div
              className="h-full rounded-md"
              initial={{ width: 0 }}
              animate={{ width: `${player.fitness}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ backgroundColor: getAttrBarColor(player.fitness) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Divider */}
      <div className="border-t border-[#21262d]" />

      {/* Training Type Selection — enhanced cards with intensity indicators */}
      <div className="space-y-1.5">
        {trainingTypes.map((t, idx) => {
          const isSelected = selectedType === t.type;
          const isSeasonFocusType = gameState.seasonTrainingFocus?.area === t.type;
          const isRecommended = recommendedTrainingType === t.type;
          return (
            <motion.div
              key={t.type}
              onClick={() => handleTypeSelect(t.type)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTypeSelect(t.type); } }}
              className={`relative flex flex-col w-full text-left rounded-md overflow-hidden cursor-pointer transition-opacity ${
                isSelected
                  ? 'bg-[#21262d]'
                  : 'bg-[#161b22] hover:opacity-90'
              }`}
              style={{
                borderLeft: isSelected ? `3px solid ${t.color}` : '3px solid transparent',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: idx * 0.03 }}
            >
              {/* 2px colored bar at top — colored by training type */}
              <div
                className="h-0.5 w-full"
                style={{ backgroundColor: `${t.color}20` }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${t.intensityLevel * 33.33}%`,
                    backgroundColor: t.color,
                    opacity: isSelected ? 1 : 0.6,
                  }}
                />
              </div>

              <div className="flex items-center gap-3 p-2.5 flex-1 min-w-0">
                {/* Icon with colored circle */}
                <div
                  className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
                  style={{
                    backgroundColor: `${t.color}18`,
                    color: isSelected ? t.color : '#8b949e',
                  }}
                >
                  {t.icon}
                </div>

                {/* Label + description + badges */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium ${isSelected ? 'text-[#c9d1d9]' : 'text-[#8b949e]'}`}>
                      {t.label}
                    </span>
                    {/* Recommended badge */}
                    {isRecommended && t.focusAttrs.length > 0 && (
                      <Badge className="h-4 px-1.5 text-[8px] font-bold bg-emerald-500/15 text-emerald-300 border-emerald-500/30 rounded-md">
                        ★ REC
                      </Badge>
                    )}
                    {/* Recovery badge */}
                    {t.type === 'recovery' && (
                      <Badge className="h-4 px-1.5 text-[8px] font-bold bg-pink-500/15 text-pink-300 border-pink-500/30 rounded-md">
                        REST
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-[#484f58] truncate">{t.description}</p>
                </div>

                {/* Stats on right — gain pills + fatigue */}
                <div className="shrink-0 text-right space-y-1">
                  {t.focusAttrs.length > 0 ? (
                    <>
                      {/* Expected gains as pill badges */}
                      <div className="flex flex-col items-end gap-0.5">
                        {t.focusAttrs.map(attr => (
                          <span
                            key={attr}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border"
                            style={{
                              backgroundColor: isSelected ? `${t.color}12` : '#21262d',
                              color: isSelected ? t.color : '#484f58',
                              borderColor: isSelected ? `${t.color}25` : '#30363d',
                            }}
                          >
                            +{t.expectedGainRange[0]}-{t.expectedGainRange[1]} {attrLabels[attr]}
                          </span>
                        ))}
                      </div>
                      {/* Fatigue cost pill */}
                      <div className="flex items-center gap-0.5 justify-end">
                        <Heart className="h-2.5 w-2.5" style={{ color: t.fatigueImpact > 0 ? '#f59e0b99' : '#10b98199' }} />
                        <span
                          className="text-[9px] font-medium"
                          style={{ color: t.fatigueImpact > 0 ? '#f59e0b99' : '#10b98199' }}
                        >
                          Fatigue: {t.fatigueImpact > 0 ? `-${t.fatigueImpact}%` : `+${Math.abs(t.fatigueImpact)}%`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-[11px] text-pink-400/60">Rest</span>
                  )}
                </div>
              </div>

              {/* Focus attribute pills — merged into type card when selected */}
              {isSelected && t.focusAttrs.length > 0 && (
                <div className="flex items-center gap-1 px-2.5 pb-2">
                  {t.focusAttrs.map(attr => {
                    const isSeasonFocus = seasonFocusAttrs.has(attr);
                    const isFocus = focusAttr === attr;
                    return (
                      <motion.button
                        key={attr}
                        onClick={(e) => { e.stopPropagation(); setFocusAttr(attr); }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          isFocus
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isSeasonFocus
                            ? 'bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20'
                            : 'bg-[#30363d] text-[#8b949e] border border-transparent hover:text-[#c9d1d9]'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.1 }}
                      >
                        {isFocus && <Star className="h-2.5 w-2.5 inline mr-0.5 text-emerald-400 fill-emerald-400" />}
                        {attrLabels[attr]}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Intensity Selector — horizontal segmented control */}
      <AnimatePresence>
        {selectedType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Intensity</span>
                </div>

                {/* Segmented control */}
                <div className="relative flex bg-[#21262d] rounded-md p-0.5">
                  {/* Subtle tone bar background */}
                  <div className="absolute inset-0.5 rounded-md overflow-hidden bg-[#30363d]/30" />

                  {intensities.map(i => {
                    const isSelected = selectedIntensity === i.value;
                    const isDisabled = i.value === 90 && fatigueRisk === 'critical';
                    return (
                      <motion.button
                        key={i.value}
                        onClick={() => !isDisabled && setSelectedIntensity(i.value)}
                        disabled={isDisabled}
                        className={`relative z-10 flex-1 py-2 text-center rounded-md transition-colors ${
                          isSelected
                            ? 'bg-[#161b22] shadow-sm'
                            : isDisabled
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-[#161b22]/50'
                        }`}
                        transition={{ duration: 0.1 }}
                      >
                        <p className="text-sm font-semibold" style={{ color: isDisabled ? '#484f58' : isSelected ? i.color : '#8b949e' }}>
                          {i.label}
                        </p>
                        <p className="text-[11px] font-bold mt-0.5" style={{ color: isSelected ? '#c9d1d9' : '#484f58' }}>
                          x{i.gainMultiplier}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Intensity detail row */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#8b949e]">Fatigue cost</span>
                    <Badge
                      className="h-4 px-1 text-[9px] rounded-md border-0"
                      style={{
                        backgroundColor: `${selectedIntensityConfig.color}15`,
                        color: selectedIntensityConfig.color,
                      }}
                    >
                      -{selectedIntensityConfig.fatigueCost}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#8b949e]">Gain</span>
                    <span className="text-sm font-bold text-emerald-400">
                      x{selectedIntensityConfig.gainMultiplier}
                    </span>
                  </div>
                </div>

                {/* Fatigue warning */}
                {player.fitness - selectedIntensityConfig.fatigueCost < 30 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    <span className="text-[11px] text-red-400">
                      Will leave you very fatigued
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Training Status Indicator — enhanced detailed card */}
      {scheduledTraining && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Card className="bg-[#161b22] border-emerald-700/40 relative overflow-hidden">
            {/* Subtle pulse border animation */}
            <motion.div
              className="absolute inset-0 border-2 border-emerald-500/20 rounded-md"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <CardContent className="p-3 relative">
              <div className="flex items-start gap-3">
                {/* Training type icon */}
                <div
                  className="p-1.5 rounded-md shrink-0"
                  style={{
                    backgroundColor: `${trainingTypes.find(t => t.type === scheduledTraining.type)?.color ?? '#10b981'}15`,
                    color: trainingTypes.find(t => t.type === scheduledTraining.type)?.color ?? '#10b981',
                  }}
                >
                  {trainingTypes.find(t => t.type === scheduledTraining.type)?.icon ?? <Check className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-emerald-300">Training Set</p>
                    <motion.span
                      className="text-[10px] text-emerald-500/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      Applied on advance
                    </motion.span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {/* Training type label */}
                    <span className="text-xs text-[#c9d1d9]">
                      {trainingTypes.find(t => t.type === scheduledTraining.type)?.label}
                    </span>

                    {/* Intensity badge */}
                    <Badge
                      className="h-4 px-1.5 text-[9px] rounded-md border-0 font-medium"
                      style={{
                        backgroundColor: `${selectedIntensityConfig.color}15`,
                        color: selectedIntensityConfig.color,
                      }}
                    >
                      {intensities.find(i => i.value === scheduledTraining.intensity)?.label}
                    </Badge>

                    {/* Focus attribute with star */}
                    {scheduledTraining.focusAttribute && (
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                        <span className="text-[11px] text-emerald-300">
                          {attrFullLabels[scheduledTraining.focusAttribute]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Estimated gains preview */}
                  {expectedGains && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <TrendingUp className="h-3 w-3 text-emerald-500/60" />
                      <span className="text-[11px] text-emerald-400/70">
                        Est. gains: {Object.entries(expectedGains).map(([attr, gain]) =>
                          `${attrLabels[attr as keyof PlayerAttributes].toUpperCase()} +${gain?.min}-${gain?.max}`
                        ).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* No training available message */}
      {!scheduledTraining && trainingAvailable <= 0 && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-amber-300">No sessions remaining. Advance the week to refresh.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attribute Radar Chart */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Attribute Radar</span>
            </div>
            {selectedTrainingConfig && selectedTrainingConfig.focusAttrs.length > 0 && (
              <Badge className="h-4 px-1.5 text-[8px] font-medium border-0 rounded-md"
                style={{
                  backgroundColor: `${selectedTrainingConfig.color}15`,
                  color: selectedTrainingConfig.color,
                }}
              >
                {selectedTrainingConfig.label}
              </Badge>
            )}
          </div>
          <div className="flex justify-center">
            <svg width="180" height="180" viewBox="0 0 180 180">
              {/* Grid hexagons */}
              {[25, 50, 75, 100].map(val => {
                const fakeAttrs: Record<string, number> = {};
                coreAttrKeys.forEach(k => { fakeAttrs[k] = val; });
                return (
                  <polygon
                    key={val}
                    points={buildRadarPoints(fakeAttrs, 90, 90, 70)}
                    fill="none"
                    stroke="#30363d"
                    strokeWidth={val === 100 ? 1 : 0.5}
                    opacity={val === 100 ? 0.8 : 0.4}
                  />
                );
              })}
              {/* Axis lines */}
              {coreAttrKeys.map((_, i) => {
                const angle = -Math.PI / 2 + i * (2 * Math.PI / 6);
                return (
                  <line
                    key={i}
                    x1={90} y1={90}
                    x2={90 + 70 * Math.cos(angle)}
                    y2={90 + 70 * Math.sin(angle)}
                    stroke="#30363d"
                    strokeWidth={0.5}
                    opacity={0.4}
                  />
                );
              })}
              {/* Potential gain area (shown when training selected) */}
              {selectedTrainingConfig && selectedTrainingConfig.focusAttrs.length > 0 && (() => {
                const potentialAttrs: Record<string, number> = {};
                coreAttrKeys.forEach(k => {
                  const isTrained = selectedTrainingConfig.focusAttrs.includes(k);
                  potentialAttrs[k] = isTrained
                    ? Math.min(100, (player.attributes[k] ?? 0) + (expectedGains?.[k]?.max ?? 0))
                    : (player.attributes[k] ?? 0);
                });
                return (
                  <polygon
                    points={buildRadarPoints(potentialAttrs, 90, 90, 70)}
                    fill={`${selectedTrainingConfig.color}15`}
                    stroke={selectedTrainingConfig.color}
                    strokeWidth={1}
                    opacity={0.5}
                  />
                );
              })()}
              {/* Current attribute polygon */}
              <motion.polygon
                points={buildRadarPoints(player.attributes, 90, 90, 70)}
                fill="#10b98115"
                stroke="#10b981"
                strokeWidth={1.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              />
              {/* Attribute dots on vertices */}
              {coreAttrKeys.map((key, i) => {
                const angle = -Math.PI / 2 + i * (2 * Math.PI / 6);
                const val = (player.attributes[key] ?? 0) / 100;
                const isTrained = selectedTrainingConfig?.focusAttrs.includes(key);
                return (
                  <circle
                    key={key}
                    cx={90 + 70 * val * Math.cos(angle)}
                    cy={90 + 70 * val * Math.sin(angle)}
                    r={isTrained ? 3.5 : 2.5}
                    fill={isTrained ? (selectedTrainingConfig?.color ?? '#10b981') : '#10b981'}
                    opacity={isTrained ? 1 : 0.7}
                  />
                );
              })}
              {/* Labels */}
              {buildRadarLabels(90, 90, 70).map(l => (
                <text
                  key={l.key}
                  x={l.x}
                  y={l.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[8px] font-bold"
                  fill={selectedTrainingConfig?.focusAttrs.includes(l.key) ? (selectedTrainingConfig.color ?? '#8b949e') : '#8b949e'}
                  opacity={selectedTrainingConfig?.focusAttrs.includes(l.key) ? 1 : 0.6}
                >
                  {l.label}
                </text>
              ))}
              {/* Center attribute value for highlighted */}
              {selectedTrainingConfig && selectedTrainingConfig.focusAttrs.length > 0 && (
                <text
                  x={90} y={90}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[8px] font-bold"
                  fill="#c9d1d9"
                  opacity={0.5}
                >
                  {Math.round(coreAttrKeys.reduce((sum, k) => sum + (player.attributes[k] ?? 0), 0) / 6)}
                </text>
              )}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Attribute Preview — shown when a type is selected */}
      <AnimatePresence mode="wait">
        {selectedTrainingConfig && (
          <motion.div
            key={selectedTrainingConfig.type}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">
                    Preview — {selectedTrainingConfig.label}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {(Object.keys(attrLabels) as (keyof PlayerAttributes)[]).map(attr => {
                    const isFocused = selectedTrainingConfig.focusAttrs.includes(attr);
                    const gain = expectedGains?.[attr];
                    const currentValue = player.attributes[attr];
                    const isFocusAttr = focusAttr === attr;
                    const isSeasonFocus = seasonFocusAttrs.has(attr);

                    return (
                      <div key={attr} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{ color: isFocused ? selectedTrainingConfig.color : '#484f58' }}
                            >
                              {attrIcons[attr]}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                isFocused ? 'text-[#c9d1d9]' : 'text-[#8b949e]'
                              }`}
                            >
                              {attrFullLabels[attr]}
                            </span>
                            {isSeasonFocus && (
                              <Badge className="h-3.5 px-1 text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded">
                                FOCUS
                              </Badge>
                            )}
                            {isFocusAttr && !isSeasonFocus && (
                              <Badge className="h-3.5 px-1 text-[8px] bg-emerald-600/20 text-emerald-300 border-emerald-600/30 rounded">
                                FOCUS
                              </Badge>
                            )}
                            {isFocused && !isFocusAttr && !isSeasonFocus && (
                              <Badge className="h-3.5 px-1 text-[8px] bg-[#30363d] text-[#8b949e] border-[#30363d] rounded">
                                TRAINED
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#c9d1d9]">
                              {currentValue}
                            </span>
                            {gain && (
                              <motion.span
                                className="text-[11px] font-semibold text-emerald-400"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.15, delay: 0.05 }}
                              >
                                +{gain.min}–{gain.max}
                              </motion.span>
                            )}
                          </div>
                        </div>

                        {/* Attribute bar */}
                        <div className={`relative h-2 bg-[#21262d] rounded-md overflow-hidden ${
                          isSeasonFocus ? 'ring-1 ring-emerald-500/20' : ''
                        }`}>
                          <motion.div
                            className="absolute h-full rounded-md"
                            style={{
                              backgroundColor: isSeasonFocus
                                ? '#10b98160'
                                : isFocused
                                ? `${selectedTrainingConfig.color}50`
                                : '#30363d',
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${currentValue}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                          {gain && (
                            <motion.div
                              className="absolute h-full rounded-md"
                              style={{
                                backgroundColor: isFocusAttr || isSeasonFocus
                                  ? '#10b981'
                                  : `${selectedTrainingConfig.color}`,
                                opacity: isFocusAttr || isSeasonFocus ? 0.6 : 0.3,
                              }}
                              initial={{ left: `${currentValue}%`, width: 0 }}
                              animate={{
                                left: `${currentValue}%`,
                                width: `${gain.max}%`,
                              }}
                              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Divider */}
      <div className="border-t border-[#21262d]" />

      {/* Training History — last 3 sessions with gains */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2.5">
            <History className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Recent Training</span>
            {recentTrainingHistory.length > 0 && (
              <span className="text-[10px] text-[#484f58] ml-auto">Last {Math.min(recentTrainingHistory.length, 3)} sessions</span>
            )}
          </div>
          {recentTrainingHistory.length > 0 ? (
            <div className="space-y-1.5">
              {recentTrainingHistory.slice(0, 3).map((session, idx) => {
                const config = trainingTypes.find(t => t.type === session.type);
                const intensityConf = intensities.find(i => i.value === session.intensity);
                const gains = historyGains.get(session.completedAt);
                const timeAgo = session.completedAt
                  ? getTimeAgo(session.completedAt)
                  : 'Unknown';
                const qualityColor = gains?.quality === 'good'
                  ? '#10b981'
                  : gains?.quality === 'average'
                  ? '#f59e0b'
                  : '#484f58';

                return (
                  <motion.div
                    key={`${session.completedAt}-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: idx * 0.04 }}
                    className="flex items-center gap-2.5 p-2 rounded-md bg-[#21262d] border border-[#30363d]"
                  >
                    {/* Type icon with checkmark for completion */}
                    <div className="relative shrink-0">
                      <div
                        className="p-1 rounded-md"
                        style={{
                          backgroundColor: config ? `${config.color}15` : '#21262d',
                          color: config?.color ?? '#64748b',
                        }}
                      >
                        {config?.icon ?? <Dumbbell className="h-3.5 w-3.5" />}
                      </div>
                      {/* Completion checkmark overlay */}
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: idx * 0.04 + 0.1 }}
                      >
                        <Check className="h-1.5 w-1.5 text-white" />
                      </motion.div>
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-[#c9d1d9]">
                          {config?.label ?? session.type}
                        </span>
                        <Badge
                          className="h-3.5 px-1 text-[8px] border-0 rounded"
                          style={{
                            backgroundColor: intensityConf
                              ? `${intensityConf.color}15`
                              : '#21262d',
                            color: intensityConf?.color ?? '#64748b',
                          }}
                        >
                          {intensityConf?.label ?? `${session.intensity}%`}
                        </Badge>
                        {/* Quality indicator */}
                        {gains && gains.quality !== 'none' && (
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: qualityColor }}
                          />
                        )}
                      </div>
                      {/* Attribute gains row */}
                      {gains && gains.attrs.length > 0 ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          {gains.attrs.map((attr, aIdx) => (
                            <span
                              key={aIdx}
                              className="px-1 py-px rounded text-[8px] font-medium"
                              style={{
                                backgroundColor: config ? `${config.color}12` : '#21262d',
                                color: qualityColor,
                              }}
                            >
                              +{attr}
                            </span>
                          ))}
                          {session.focusAttribute && (
                            <span className="text-[8px] text-emerald-400/50">
                              ★ {attrLabels[session.focusAttribute]}
                            </span>
                          )}
                        </div>
                      ) : session.focusAttribute ? (
                        <span className="text-[10px] text-emerald-400/60">
                          {attrFullLabels[session.focusAttribute]}
                        </span>
                      ) : null}
                    </div>
                    {/* Time ago */}
                    <span className="text-[10px] text-[#484f58] shrink-0">
                      {timeAgo}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center">
                <History className="h-4 w-4 text-[#484f58]" />
              </div>
              <p className="text-xs text-[#484f58]">No training sessions yet</p>
              <p className="text-[10px] text-[#30363d]">Select a training type above to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Attributes Overview — with delta indicators */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Attributes</span>
          </div>
          <div className="space-y-2">
            {(Object.keys(attrLabels) as (keyof PlayerAttributes)[]).map((attr, idx) => {
              const isSeasonFocus = seasonFocusAttrs.has(attr);
              const delta = seasonAttrDeltas.get(attr);
              return (
                <div key={attr} className="flex items-center gap-2.5">
                  <span
                    style={{ color: isSeasonFocus ? '#10b981' : getAttrBarColor(player.attributes[attr] ?? 0) }}
                  >
                    {attrIcons[attr]}
                  </span>
                  <span className={`text-xs w-12 ${isSeasonFocus ? 'text-emerald-300 font-medium' : 'text-[#8b949e]'}`}>
                    {attrFullLabels[attr]}
                  </span>
                  <div className={`flex-1 h-1.5 bg-[#21262d] rounded-md overflow-hidden ${
                    isSeasonFocus ? 'ring-1 ring-emerald-500/20' : ''
                  }`}>
                    <motion.div
                      className="h-full rounded-md"
                      initial={{ width: 0 }}
                      animate={{ width: `${player.attributes[attr] ?? 0}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.04 }}
                      style={{ backgroundColor: isSeasonFocus ? '#10b981' : getAttrBarColor(player.attributes[attr] ?? 0) }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {isSeasonFocus && (
                      <Star className="h-2.5 w-2.5 text-emerald-400 fill-emerald-400" />
                    )}
                    {/* Delta indicator from training history */}
                    {delta != null && delta > 0 && (
                      <motion.span
                        className="text-[10px] font-semibold text-emerald-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        +{delta}
                      </motion.span>
                    )}
                    <span className="text-xs font-bold w-6 text-right text-[#c9d1d9]">
                      {player.attributes[attr]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* =========================================
          SVG Data Visualizations Section
          ========================================= */}
      <div className="border-t border-[#21262d]" />

      {/* =========================================
          Section 1: SVG Training Load Ring
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FF5500]/30 border border-[#FF5500]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Training Load Ring</h3>
          </div>
          <span className="text-[9px] font-bold text-[#FF5500]">
            {3 - trainingAvailable}/3 sessions
          </span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const cx = 160;
            const cy = 60;
            const r = 40;
            const sessionsUsed = 3 - trainingAvailable;
            const fraction = sessionsUsed / 3;
            const circumference = 2 * Math.PI * r;
            const filledLength = circumference * fraction;
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + 2 * Math.PI * fraction;
            const largeArc = fraction > 0.5 ? 1 : 0;
            const ex = cx + r * Math.cos(endAngle);
            const ey = cy + r * Math.sin(endAngle);
            const sx = cx + r * Math.cos(startAngle);
            const sy = cy + r * Math.sin(startAngle);
            return (
              <>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth="8" />
                {sessionsUsed > 0 && (
                  <path
                    d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
                    fill="none"
                    stroke="#FF5500"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                )}
                <text x={cx} y={cy - 6} textAnchor="middle" fill="#c9d1d9" className="text-lg font-bold" style={{ fontSize: '18px' }}>{sessionsUsed}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" className="text-[9px]">of 3 used</text>
                {[0, 1, 2].map(i => {
                  const angle = startAngle + (2 * Math.PI * i) / 3;
                  const dx = cx + (r + 14) * Math.cos(angle);
                  const dy = cy + (r + 14) * Math.sin(angle);
                  const isUsed = i < sessionsUsed;
                  return (
                    <circle
                      key={i}
                      cx={dx}
                      cy={dy}
                      r="4"
                      fill={isUsed ? '#FF5500' : '#21262d'}
                      stroke={isUsed ? '#FF5500' : '#30363d'}
                      strokeWidth="1"
                      opacity={isUsed ? 1 : 0.5}
                    />
                  );
                })}
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 2: SVG Training Type Distribution Donut
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#00E5FF]/30 border border-[#00E5FF]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Training Type Distribution</h3>
          </div>
          <span className="text-[9px] font-bold text-[#00E5FF]">
            {gameState.trainingHistory.length} total
          </span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const cx = 80;
            const cy = 60;
            const outerR = 40;
            const innerR = 24;
            const dist = trainingTypeDistribution;
            const total = dist.attacking + dist.defensive + dist.physical + dist.technical + dist.tactical;
            const segments = [
              { key: 'attacking', count: dist.attacking, color: '#FF5500' },
              { key: 'defensive', count: dist.defensive, color: '#00E5FF' },
              { key: 'physical', count: dist.physical, color: '#CCFF00' },
              { key: 'technical', count: dist.technical, color: '#FF5500' },
              { key: 'tactical', count: dist.tactical, color: '#666666' },
            ];
            if (total === 0) {
              return (
                <>
                  <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#21262d" strokeWidth="16" />
                  <text x={cx} y={cy + 4} textAnchor="middle" fill="#484f58" className="text-[9px]">No data</text>
                </>
              );
            }
            let currentAngle = -Math.PI / 2;
            return (
              <>
                <circle cx={cx} cy={cy} r={innerR} fill="#161b22" />
                {segments.map((seg, i) => {
                  if (seg.count === 0) return <g key={seg.key} />;
                  const fraction = seg.count / total;
                  const sweepAngle = fraction * 2 * Math.PI;
                  const endAngle = currentAngle + sweepAngle;
                  const largeArc = sweepAngle > Math.PI ? 1 : 0;
                  const outerStart = { x: cx + outerR * Math.cos(currentAngle), y: cy + outerR * Math.sin(currentAngle) };
                  const outerEnd = { x: cx + outerR * Math.cos(endAngle), y: cy + outerR * Math.sin(endAngle) };
                  const innerStart = { x: cx + innerR * Math.cos(endAngle), y: cy + innerR * Math.sin(endAngle) };
                  const innerEnd = { x: cx + innerR * Math.cos(currentAngle), y: cy + innerR * Math.sin(currentAngle) };
                  const pathData = [
                    `M ${outerStart.x} ${outerStart.y}`,
                    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
                    `L ${innerStart.x} ${innerStart.y}`,
                    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
                    'Z',
                  ].join(' ');
                  const nextAngle = endAngle;
                  currentAngle = nextAngle;
                  return (
                    <g key={seg.key}>
                      <path d={pathData} fill={seg.color} opacity={0.8} />
                      {fraction > 0.08 && (() => {
                        const midAngle = currentAngle - sweepAngle / 2;
                        const labelR = (outerR + innerR) / 2;
                        const lx = cx + labelR * Math.cos(midAngle);
                        const ly = cy + labelR * Math.sin(midAngle);
                        return (
                          <text x={lx} y={ly + 3} textAnchor="middle" fill="#000" className="text-[7px] font-bold" opacity={0.8}>
                            {Math.round(fraction * 100)}%
                          </text>
                        );
                      })()}
                    </g>
                  );
                })}
                <text x={cx} y={cy + 4} textAnchor="middle" fill="#c9d1d9" className="text-[10px] font-bold">{total}</text>
                {segments.map((seg, i) => (
                  <g key={`legend-${seg.key}`}>
                    <rect x={170} y={10 + i * 20} width="10" height="10" rx="2" fill={seg.color} opacity={0.8} />
                    <text x={186} y={19 + i * 20} fill="#8b949e" className="text-[9px]">
                      {seg.key.charAt(0).toUpperCase() + seg.key.slice(1)} ({seg.count})
                    </text>
                  </g>
                ))}
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 3: SVG Attribute Development Area Chart
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#00E5FF]/30 border border-[#00E5FF]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Attribute Development</h3>
          </div>
          <span className="text-[9px] font-bold text-[#00E5FF]">8-week projection</span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const chartLeft = 30;
            const chartRight = 310;
            const chartTop = 10;
            const chartBottom = 95;
            const chartWidth = chartRight - chartLeft;
            const chartHeight = chartBottom - chartTop;
            const attrColors = ['#00E5FF', '#00E5FF80', '#00E5FF60', '#00E5FF40', '#00E5FF30', '#00E5FF20'];
            return (
              <>
                {[0, 25, 50, 75, 100].map((val, i) => {
                  const y = chartBottom - (val / 100) * chartHeight;
                  return (
                    <g key={`grid-${val}`}>
                      <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke="#21262d" strokeWidth="0.5" />
                      <text x={chartLeft - 4} y={y + 3} textAnchor="end" fill="#484f58" className="text-[7px]">{val}</text>
                    </g>
                  );
                })}
                {simulatedDevelopment.map((attrData, attrIdx) => {
                  const areaPoints = attrData.map((val, weekIdx) => {
                    const x = chartLeft + (weekIdx / 7) * chartWidth;
                    const y = chartBottom - (val / 100) * chartHeight;
                    return `${x},${y}`;
                  }).join(' ');
                  const baseLine = `${chartLeft},${chartBottom} ${chartLeft},${chartBottom - (attrData[0] / 100) * chartHeight} ${areaPoints} ${chartRight},${chartBottom}`;
                  return (
                    <polygon
                      key={`area-${attrIdx}`}
                      points={baseLine}
                      fill={attrColors[attrIdx]}
                      stroke={attrIdx === 0 ? '#00E5FF' : 'none'}
                      strokeWidth={attrIdx === 0 ? 1.5 : 0}
                      opacity={0.7}
                    />
                  );
                })}
                {Array.from({ length: 8 }, (_, i) => {
                  const x = chartLeft + (i / 7) * chartWidth;
                  return (
                    <text key={`week-${i}`} x={x} y={chartBottom + 12} textAnchor="middle" fill="#484f58" className="text-[7px]">
                      W{i + 1}
                    </text>
                  );
                })}
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 4: SVG Fatigue vs Fitness Gauge
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#CCFF00]/30 border border-[#CCFF00]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Fatigue vs Fitness Gauge</h3>
          </div>
          <span className="text-[9px] font-bold text-[#CCFF00]">{player.fitness}% fit</span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const cx = 160;
            const cy = 90;
            const r = 60;
            const fitness = player.fitness;
            const fatigue = 100 - fitness;
            const fitnessAngle = -Math.PI + (fitness / 100) * Math.PI;
            const fatigueAngle = -Math.PI + (fatigue / 100) * Math.PI;
            const buildArcPath = (startA: number, endA: number) => {
              const x1 = cx + r * Math.cos(startA);
              const y1 = cy + r * Math.sin(startA);
              const x2 = cx + r * Math.cos(endA);
              const y2 = cy + r * Math.sin(endA);
              const largeArc = Math.abs(endA - startA) > Math.PI ? 1 : 0;
              return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
            };
            return (
              <>
                {/* Background arc */}
                <path d={buildArcPath(-Math.PI, 0)} fill="none" stroke="#21262d" strokeWidth="10" />
                {/* Fitness arc (green line) */}
                <path
                  d={buildArcPath(-Math.PI, fitnessAngle)}
                  fill="none"
                  stroke="#CCFF00"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity={0.9}
                />
                {/* Fatigue arc (red line, from right to left) */}
                <path
                  d={buildArcPath(0, -fatigueAngle)}
                  fill="none"
                  stroke="#FF5500"
                  strokeWidth="6"
                  strokeLinecap="round"
                  opacity={0.9}
                />
                {/* Center value */}
                <text x={cx} y={cy - 10} textAnchor="middle" fill="#c9d1d9" className="text-lg font-bold" style={{ fontSize: '16px' }}>{fitness}%</text>
                <text x={cx} y={cy + 4} textAnchor="middle" fill="#8b949e" className="text-[8px]">Fitness</text>
                {/* Tick marks */}
                {[0, 25, 50, 75, 100].map(val => {
                  const angle = -Math.PI + (val / 100) * Math.PI;
                  const x1 = cx + (r + 4) * Math.cos(angle);
                  const y1 = cy + (r + 4) * Math.sin(angle);
                  return (
                    <text key={val} x={x1} y={y1 + 3} textAnchor="middle" fill="#484f58" className="text-[6px]">{val}</text>
                  );
                })}
                {/* Legend */}
                <circle cx={40} cy={15} r="4" fill="#CCFF00" opacity={0.9} />
                <text x={50} y={18} fill="#8b949e" className="text-[8px]">Fitness {fitness}%</text>
                <circle cx={170} cy={15} r="4" fill="#FF5500" opacity={0.9} />
                <text x={180} y={18} fill="#8b949e" className="text-[8px]">Fatigue {fatigue}%</text>
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 5: SVG Season Focus Progress Ring
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#CCFF00]/30 border border-[#CCFF00]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Season Focus Progress</h3>
          </div>
          <span className="text-[9px] font-bold text-[#CCFF00]">
            {gameState.seasonTrainingFocus?.bonusMultiplier ?? 1.0}x bonus
          </span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const cx = 80;
            const cy = 60;
            const r = 40;
            const currentMultiplier = gameState.seasonTrainingFocus?.bonusMultiplier ?? 1.0;
            const maxMultiplier = 2.0;
            const fraction = currentMultiplier / maxMultiplier;
            const circumference = 2 * Math.PI * r;
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + 2 * Math.PI * fraction;
            const largeArc = fraction > 0.5 ? 1 : 0;
            const sx = cx + r * Math.cos(startAngle);
            const sy = cy + r * Math.sin(startAngle);
            const ex = cx + r * Math.cos(endAngle);
            const ey = cy + r * Math.sin(endAngle);
            return (
              <>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth="8" />
                <path
                  d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
                  fill="none"
                  stroke="#CCFF00"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity={0.85}
                />
                <text x={cx} y={cy - 6} textAnchor="middle" fill="#CCFF00" className="text-base font-bold" style={{ fontSize: '16px' }}>
                  {currentMultiplier}x
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" className="text-[8px]">
                  of {maxMultiplier}x max
                </text>
                {/* Side info */}
                <text x={170} y={30} fill="#c9d1d9" className="text-[10px] font-bold">Focus Area</text>
                <text x={170} y={46} fill="#8b949e" className="text-[9px]">
                  {gameState.seasonTrainingFocus
                    ? seasonFocusAreaLabel
                    : 'None set'}
                </text>
                <text x={170} y={70} fill="#c9d1d9" className="text-[10px] font-bold">Progress</text>
                <text x={170} y={86} fill="#8b949e" className="text-[9px]">{Math.round(fraction * 100)}% to max</text>
                {/* Tick marks around ring */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                  const angle = startAngle + 2 * Math.PI * frac;
                  const x1 = cx + (r - 12) * Math.cos(angle);
                  const y1 = cy + (r - 12) * Math.sin(angle);
                  const x2 = cx + (r - 8) * Math.cos(angle);
                  const y2 = cy + (r - 8) * Math.sin(angle);
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#484f58" strokeWidth="1" />;
                })}
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 6: SVG Training Intensity Distribution Bars
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#00E5FF]/30 border border-[#00E5FF]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Intensity Distribution</h3>
          </div>
          <span className="text-[9px] font-bold text-[#00E5FF]">
            {intensityDistribution.low + intensityDistribution.medium + intensityDistribution.high} sessions
          </span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const bars = [
              { label: 'Low', count: intensityDistribution.low, color: '#00E5FF' },
              { label: 'Medium', count: intensityDistribution.medium, color: '#CCFF00' },
              { label: 'High', count: intensityDistribution.high, color: '#FF5500' },
            ];
            const maxCount = Math.max(...bars.map(b => b.count), 1);
            const barHeight = 24;
            const barGap = 8;
            const startY = 14;
            const barMaxWidth = 220;
            const labelWidth = 55;
            return (
              <>
                {bars.map((bar, i) => {
                  const y = startY + i * (barHeight + barGap);
                  const barWidth = (bar.count / maxCount) * barMaxWidth;
                  return (
                    <g key={bar.label}>
                      <text x={labelWidth - 4} y={y + barHeight / 2 + 3} textAnchor="end" fill="#8b949e" className="text-[9px]">
                        {bar.label}
                      </text>
                      <rect
                        x={labelWidth}
                        y={y}
                        width={barMaxWidth}
                        height={barHeight}
                        rx="4"
                        fill="#21262d"
                      />
                      <rect
                        x={labelWidth}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        fill={bar.color}
                        opacity={0.8}
                      />
                      <text
                        x={labelWidth + barWidth + 8}
                        y={y + barHeight / 2 + 3}
                        fill="#c9d1d9"
                        className="text-[9px] font-bold"
                      >
                        {bar.count}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 7: SVG Recovery Timeline
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#CCFF00]/30 border border-[#CCFF00]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Recovery Timeline</h3>
          </div>
          <span className="text-[9px] font-bold text-[#CCFF00]">8-week outlook</span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const chartLeft = 30;
            const chartRight = 300;
            const chartTop = 10;
            const chartBottom = 90;
            const chartWidth = chartRight - chartLeft;
            const chartHeight = chartBottom - chartTop;
            const data = simulatedRecovery;
            const linePoints = data.map((val, i) => {
              const x = chartLeft + (i / 7) * chartWidth;
              const y = chartBottom - (val / 100) * chartHeight;
              return `${x},${y}`;
            }).join(' ');
            const areaPoints = `${chartLeft},${chartBottom} ${linePoints} ${chartRight},${chartBottom}`;
            return (
              <>
                {[0, 25, 50, 75, 100].map(val => {
                  const y = chartBottom - (val / 100) * chartHeight;
                  return (
                    <g key={`rec-grid-${val}`}>
                      <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke="#21262d" strokeWidth="0.5" />
                      <text x={chartLeft - 4} y={y + 3} textAnchor="end" fill="#484f58" className="text-[7px]">{val}</text>
                    </g>
                  );
                })}
                <polygon points={areaPoints} fill="#CCFF00" opacity={0.15} />
                <polyline points={linePoints} fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((val, i) => {
                  const x = chartLeft + (i / 7) * chartWidth;
                  const y = chartBottom - (val / 100) * chartHeight;
                  return (
                    <g key={`rec-point-${i}`}>
                      <circle cx={x} cy={y} r="3" fill="#161b22" stroke="#CCFF00" strokeWidth="1.5" />
                      {i === data.length - 1 && (
                        <text x={x + 6} y={y + 3} fill="#CCFF00" className="text-[8px] font-bold">{Math.round(val)}%</text>
                      )}
                    </g>
                  );
                })}
                {Array.from({ length: 8 }, (_, i) => {
                  const x = chartLeft + (i / 7) * chartWidth;
                  return (
                    <text key={`rec-w-${i}`} x={x} y={chartBottom + 14} textAnchor="middle" fill="#484f58" className="text-[7px]">
                      W{i + 1}
                    </text>
                  );
                })}
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 8: SVG Training Efficiency Radar
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#00E5FF]/30 border border-[#00E5FF]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Training Efficiency Radar</h3>
          </div>
          <span className="text-[9px] font-bold text-[#00E5FF]">5-axis</span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const cx = 80;
            const cy = 60;
            const r = 40;
            const labels = ['Speed', 'Power', 'Technique', 'Stamina', 'Tactics'];
            const n = 5;
            const angleStep = (2 * Math.PI) / n;
            const startAngle = -Math.PI / 2;
            const buildPentagonPoints = (val: number) => {
              return Array.from({ length: n }, (_, i) => {
                const angle = startAngle + i * angleStep;
                const frac = val / 100;
                return `${cx + r * frac * Math.cos(angle)},${cy + r * frac * Math.sin(angle)}`;
              }).join(' ');
            };
            return (
              <>
                {[25, 50, 75, 100].map(val => (
                  <polygon
                    key={`eff-grid-${val}`}
                    points={buildPentagonPoints(val)}
                    fill="none"
                    stroke="#21262d"
                    strokeWidth={val === 100 ? 1 : 0.5}
                    opacity={val === 100 ? 0.8 : 0.3}
                  />
                ))}
                {Array.from({ length: n }, (_, i) => {
                  const angle = startAngle + i * angleStep;
                  return (
                    <line
                      key={`eff-axis-${i}`}
                      x1={cx} y1={cy}
                      x2={cx + r * Math.cos(angle)}
                      y2={cy + r * Math.sin(angle)}
                      stroke="#21262d"
                      strokeWidth="0.5"
                      opacity={0.3}
                    />
                  );
                })}
                <polygon
                  points={trainingEfficiency.map((val, i) => {
                    const angle = startAngle + i * angleStep;
                    const frac = val / 100;
                    return `${cx + r * frac * Math.cos(angle)},${cy + r * frac * Math.sin(angle)}`;
                  }).join(' ')}
                  fill="#00E5FF"
                  opacity={0.15}
                  stroke="#00E5FF"
                  strokeWidth="1.5"
                />
                {trainingEfficiency.map((val, i) => {
                  const angle = startAngle + i * angleStep;
                  const frac = val / 100;
                  const px = cx + r * frac * Math.cos(angle);
                  const py = cy + r * frac * Math.sin(angle);
                  return (
                    <circle key={`eff-dot-${i}`} cx={px} cy={py} r="3" fill="#00E5FF" opacity={0.9} />
                  );
                })}
                {labels.map((label, i) => {
                  const angle = startAngle + i * angleStep;
                  const lx = cx + (r + 14) * Math.cos(angle);
                  const ly = cy + (r + 14) * Math.sin(angle);
                  return (
                    <text
                      key={`eff-label-${i}`}
                      x={lx}
                      y={ly + 3}
                      textAnchor="middle"
                      fill="#8b949e"
                      className="text-[7px] font-bold"
                    >
                      {label}
                    </text>
                  );
                })}
                {/* Legend */}
                {trainingEfficiency.slice(0, 5).map((val, i) => (
                  <g key={`eff-legend-${i}`}>
                    <text x={185} y={18 + i * 18} fill="#8b949e" className="text-[8px]">
                      {labels[i]}: <tspan fill="#00E5FF" fontWeight="bold">{val}%</tspan>
                    </text>
                  </g>
                ))}
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 9: SVG Weekly Training Calendar Heatmap
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FF5500]/30 border border-[#FF5500]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Training Calendar</h3>
          </div>
          <span className="text-[9px] font-bold text-[#FF5500]">4 weeks</span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            const cellSize = 16;
            const cellGap = 3;
            const startX = 35;
            const startY = 18;
            const getHeatColor = (intensity: number) => {
              if (intensity >= 60) return '#FF5500';
              if (intensity >= 30) return '#CCFF00';
              if (intensity > 0) return '#00E5FF';
              return '#21262d';
            };
            return (
              <>
                {days.map((day, d) => (
                  <text
                    key={`day-${d}`}
                    x={startX + d * (cellSize + cellGap) + cellSize / 2}
                    y={startY - 4}
                    textAnchor="middle"
                    fill="#484f58"
                    className="text-[7px] font-bold"
                  >
                    {day}
                  </text>
                ))}
                {Array.from({ length: 4 }, (_, w) => (
                  <text
                    key={`week-label-${w}`}
                    x={startX - 6}
                    y={startY + w * (cellSize + cellGap) + cellSize / 2 + 3}
                    textAnchor="end"
                    fill="#484f58"
                    className="text-[7px]"
                  >
                    W{w + 1}
                  </text>
                ))}
                {calendarHeatmap.map((intensity, idx) => {
                  const week = Math.floor(idx / 7);
                  const day = idx % 7;
                  const x = startX + day * (cellSize + cellGap);
                  const y = startY + week * (cellSize + cellGap);
                  return (
                    <rect
                      key={`cell-${idx}`}
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      rx="3"
                      fill={getHeatColor(intensity)}
                      opacity={intensity > 0 ? 0.8 : 0.4}
                    />
                  );
                })}
                {/* Legend */}
                <rect x={210} y={20} width="10" height="10" rx="2" fill="#21262d" />
                <text x={224} y={28} fill="#484f58" className="text-[7px]">Rest</text>
                <rect x={210} y={36} width="10" height="10" rx="2" fill="#00E5FF" opacity={0.8} />
                <text x={224} y={44} fill="#484f58" className="text-[7px]">Low</text>
                <rect x={210} y={52} width="10" height="10" rx="2" fill="#CCFF00" opacity={0.8} />
                <text x={224} y={60} fill="#484f58" className="text-[7px]">Medium</text>
                <rect x={210} y={68} width="10" height="10" rx="2" fill="#FF5500" opacity={0.8} />
                <text x={224} y={76} fill="#484f58" className="text-[7px]">High</text>
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 10: SVG Expected Gains Preview Bars
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#CCFF00]/30 border border-[#CCFF00]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#CCFF00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Expected Gains Preview</h3>
          </div>
          <span className="text-[9px] font-bold text-[#CCFF00]">
            {selectedTrainingConfig ? selectedTrainingConfig.label : 'None'}
          </span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const attrs = coreAttrKeys;
            const barHeight = 12;
            const barGap = 6;
            const startY = 8;
            const labelWidth = 38;
            const barMaxWidth = 200;
            const maxGain = Math.max(...expectedGainsByAttr, 1);
            return (
              <>
                {attrs.map((key, i) => {
                  const y = startY + i * (barHeight + barGap);
                  const gain = expectedGainsByAttr[i];
                  const barWidth = (gain / 6) * barMaxWidth;
                  const isTrained = selectedTrainingConfig?.focusAttrs.includes(key);
                  return (
                    <g key={`gain-${key}`}>
                      <text
                        x={labelWidth - 4}
                        y={y + barHeight / 2 + 3}
                        textAnchor="end"
                        fill={isTrained ? '#CCFF00' : '#484f58'}
                        className="text-[9px] font-bold"
                      >
                        {attrLabels[key]}
                      </text>
                      <rect
                        x={labelWidth}
                        y={y}
                        width={barMaxWidth}
                        height={barHeight}
                        rx="3"
                        fill="#21262d"
                      />
                      {gain > 0 && (
                        <rect
                          x={labelWidth}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="3"
                          fill="#CCFF00"
                          opacity={0.8}
                        />
                      )}
                      {gain > 0 && (
                        <text
                          x={labelWidth + barWidth + 6}
                          y={y + barHeight / 2 + 3}
                          fill="#CCFF00"
                          className="text-[8px] font-bold"
                        >
                          +{gain}
                        </text>
                      )}
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* =========================================
          Section 11: SVG Training History Trend Line
          ========================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FF5500]/30 border border-[#FF5500]/30 flex items-center justify-center">
              <svg className="h-3 w-3 text-[#FF5500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              </svg>
            </div>
            <h3 className="text-xs font-bold text-[#c9d1d9]">Training History Trend</h3>
          </div>
          <span className="text-[9px] font-bold text-[#FF5500]">
            Last {recentGainTotals.length} sessions
          </span>
        </div>
        <svg viewBox="0 0 320 120" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          {(() => {
            const chartLeft = 40;
            const chartRight = 295;
            const chartTop = 15;
            const chartBottom = 90;
            const chartWidth = chartRight - chartLeft;
            const chartHeight = chartBottom - chartTop;
            const data = recentGainTotals;
            const maxVal = Math.max(...data, 1);
            const linePoints = data.map((val, i) => {
              const x = chartLeft + (i / Math.max(data.length - 1, 1)) * chartWidth;
              const y = chartBottom - (val / maxVal) * chartHeight;
              return `${x},${y}`;
            }).join(' ');
            const areaPoints = `${chartLeft},${chartBottom} ${linePoints} ${chartRight},${chartBottom}`;
            return (
              <>
                {[0, 1, 2, 3, 4, 5, 6].map(val => {
                  const y = chartBottom - (val / maxVal) * chartHeight;
                  return (
                    <g key={`trend-grid-${val}`}>
                      <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke="#21262d" strokeWidth="0.5" />
                      <text x={chartLeft - 4} y={y + 3} textAnchor="end" fill="#484f58" className="text-[7px]">{val}</text>
                    </g>
                  );
                })}
                <polygon points={areaPoints} fill="#FF5500" opacity={0.12} />
                <polyline points={linePoints} fill="none" stroke="#FF5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((val, i) => {
                  const x = chartLeft + (i / Math.max(data.length - 1, 1)) * chartWidth;
                  const y = chartBottom - (val / maxVal) * chartHeight;
                  return (
                    <g key={`trend-pt-${i}`}>
                      <circle cx={x} cy={y} r="3.5" fill="#161b22" stroke="#FF5500" strokeWidth="1.5" />
                      <text x={x} y={y - 6} textAnchor="middle" fill="#FF5500" className="text-[7px] font-bold">
                        {val}
                      </text>
                    </g>
                  );
                })}
                {data.map((_, i) => {
                  const x = chartLeft + (i / Math.max(data.length - 1, 1)) * chartWidth;
                  return (
                    <text key={`trend-label-${i}`} x={x} y={chartBottom + 14} textAnchor="middle" fill="#484f58" className="text-[7px]">
                      S{i + 1}
                    </text>
                  );
                })}
                {/* Summary */}
                {data.length > 0 && (
                  <>
                    <text x={chartLeft} y={110} fill="#8b949e" className="text-[7px]">
                      Avg: <tspan fill="#FF5500" fontWeight="bold">{(data.reduce((a, b) => a + b, 0) / data.length).toFixed(1)}</tspan>
                    </text>
                    <text x={chartLeft + 80} y={110} fill="#8b949e" className="text-[7px]">
                      Peak: <tspan fill="#FF5500" fontWeight="bold">{Math.max(...data)}</tspan>
                    </text>
                  </>
                )}
              </>
            );
          })()}
        </svg>
      </motion.div>

      {/* Season Training Focus Modal */}
      <SeasonTrainingFocusModal
        open={showFocusModal}
        onClose={() => setShowFocusModal(false)}
      />
    </div>
  );
}

// ============================================================
// Time ago utility
// ============================================================
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
