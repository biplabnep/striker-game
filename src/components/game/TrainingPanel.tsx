'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { TrainingType, TrainingSession, PlayerAttributes } from '@/lib/game/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dumbbell, Sword, Shield, Zap, Brain, Heart,
  TrendingUp, Clock, AlertTriangle, Flame,
  ChevronRight, Activity, BarChart3, History,
} from 'lucide-react';

// ============================================================
// Training type definitions with gradient + icon config
// ============================================================
const trainingTypes: {
  type: TrainingType;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  gradient: string;
  focusAttrs: (keyof PlayerAttributes)[];
  expectedGainRange: [number, number];
}[] = [
  {
    type: 'attacking',
    icon: <Sword className="h-5 w-5" />,
    label: 'Attacking',
    description: 'Shooting & dribbling',
    color: '#ef4444',
    gradient: 'from-red-950/60 to-red-900/20',
    focusAttrs: ['shooting', 'dribbling'],
    expectedGainRange: [1, 3],
  },
  {
    type: 'defensive',
    icon: <Shield className="h-5 w-5" />,
    label: 'Defensive',
    description: 'Defending & positioning',
    color: '#3b82f6',
    gradient: 'from-blue-950/60 to-blue-900/20',
    focusAttrs: ['defending'],
    expectedGainRange: [1, 3],
  },
  {
    type: 'physical',
    icon: <Zap className="h-5 w-5" />,
    label: 'Physical',
    description: 'Pace & strength',
    color: '#f59e0b',
    gradient: 'from-amber-950/60 to-amber-900/20',
    focusAttrs: ['pace', 'physical'],
    expectedGainRange: [1, 3],
  },
  {
    type: 'technical',
    icon: <Dumbbell className="h-5 w-5" />,
    label: 'Technical',
    description: 'Passing & ball control',
    color: '#10b981',
    gradient: 'from-emerald-950/60 to-emerald-900/20',
    focusAttrs: ['passing', 'dribbling'],
    expectedGainRange: [1, 3],
  },
  {
    type: 'tactical',
    icon: <Brain className="h-5 w-5" />,
    label: 'Tactical',
    description: 'Game awareness',
    color: '#8b5cf6',
    gradient: 'from-violet-950/60 to-violet-900/20',
    focusAttrs: ['passing', 'defending'],
    expectedGainRange: [1, 2],
  },
  {
    type: 'recovery',
    icon: <Heart className="h-5 w-5" />,
    label: 'Recovery',
    description: 'Rest & recuperation',
    color: '#ec4899',
    gradient: 'from-pink-950/60 to-pink-900/20',
    focusAttrs: [],
    expectedGainRange: [0, 0],
  },
];

// ============================================================
// Intensity definitions with fatigue risk
// ============================================================
const intensities: {
  value: number;
  label: string;
  risk: 'low' | 'medium' | 'high';
  riskLabel: string;
  color: string;
  bgColor: string;
  fatigueCost: number;
  gainMultiplier: number;
}[] = [
  {
    value: 30,
    label: 'Low',
    risk: 'low',
    riskLabel: 'Safe',
    color: '#10b981',
    bgColor: 'bg-emerald-900/30',
    fatigueCost: 5,
    gainMultiplier: 0.6,
  },
  {
    value: 60,
    label: 'Medium',
    risk: 'medium',
    riskLabel: 'Moderate',
    color: '#f59e0b',
    bgColor: 'bg-amber-900/30',
    fatigueCost: 12,
    gainMultiplier: 1.0,
  },
  {
    value: 90,
    label: 'High',
    risk: 'high',
    riskLabel: 'Risky',
    color: '#ef4444',
    bgColor: 'bg-red-900/30',
    fatigueCost: 22,
    gainMultiplier: 1.5,
  },
];

const attrLabels: Record<keyof PlayerAttributes, string> = {
  pace: 'Pace',
  shooting: 'Shooting',
  passing: 'Passing',
  dribbling: 'Dribbling',
  defending: 'Defending',
  physical: 'Physical',
};

const attrIcons: Record<keyof PlayerAttributes, React.ReactNode> = {
  pace: <Zap className="h-3 w-3" />,
  shooting: <Sword className="h-3 w-3" />,
  passing: <Brain className="h-3 w-3" />,
  dribbling: <Dumbbell className="h-3 w-3" />,
  defending: <Shield className="h-3 w-3" />,
  physical: <Flame className="h-3 w-3" />,
};

// ============================================================
// Main Component
// ============================================================
export default function TrainingPanel() {
  const gameState = useGameStore(state => state.gameState);
  const scheduleTraining = useGameStore(state => state.scheduleTraining);
  const advanceWeek = useGameStore(state => state.advanceWeek);
  const scheduledTraining = useGameStore(state => state.scheduledTraining);

  const [selectedType, setSelectedType] = useState<TrainingType | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState(60);
  const [focusAttr, setFocusAttr] = useState<keyof PlayerAttributes | undefined>(undefined);

  // ============================================================
  // Derived state
  // ============================================================
  const selectedTrainingConfig = useMemo(
    () => trainingTypes.find(t => t.type === selectedType) ?? null,
    [selectedType]
  );

  const selectedIntensityConfig = useMemo(
    () => intensities.find(i => i.value === selectedIntensity) ?? intensities[1],
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

  const recentTrainingHistory = useMemo(() => {
    if (!gameState) return [];
    return gameState.trainingHistory.slice(-5).reverse();
  }, [gameState]);

  // Weekly training progress dots (3 sessions per cycle)
  const weeklyProgress = useMemo(() => {
    if (!gameState) return [];
    const used = 3 - gameState.trainingAvailable;
    return Array.from({ length: 3 }, (_, i) => i < used);
  }, [gameState]);

  // Expected gains for selected training type
  const expectedGains = useMemo(() => {
    if (!selectedTrainingConfig || !gameState) return null;
    const gains: Partial<Record<keyof PlayerAttributes, { min: number; max: number }>> = {};
    const mult = selectedIntensityConfig.gainMultiplier;

    for (const attr of selectedTrainingConfig.focusAttrs) {
      const [minBase, maxBase] = selectedTrainingConfig.expectedGainRange;
      // Focus attribute gets boosted
      const isFocused = focusAttr === attr;
      const boost = isFocused ? 1.5 : 1.0;
      gains[attr] = {
        min: Math.round(minBase * mult * boost * 10) / 10,
        max: Math.round(maxBase * mult * boost * 10) / 10,
      };
    }
    return gains;
  }, [selectedTrainingConfig, selectedIntensityConfig, focusAttr, gameState]);

  if (!gameState) return null;

  const { player, trainingAvailable, trainingHistory } = gameState;

  // ============================================================
  // Handlers
  // ============================================================
  const handleSchedule = () => {
    if (!selectedType) return;
    if (isIntenseDisabled) return;
    scheduleTraining({
      type: selectedType,
      intensity: selectedIntensity,
      focusAttribute: focusAttr,
      completedAt: Date.now(),
    });
  };

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

  const renderRiskIndicator = (risk: 'low' | 'medium' | 'high') => {
    const dots = risk === 'low' ? 1 : risk === 'medium' ? 2 : 3;
    const color = risk === 'low' ? '#10b981' : risk === 'medium' ? '#f59e0b' : '#ef4444';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: i <= dots ? color : '#334155',
            }}
          />
        ))}
      </div>
    );
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header with session count & progress dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <h2 className="text-xl font-bold">Training</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress dots for weekly training */}
          <div className="flex gap-1">
            {weeklyProgress.map((done, i) => (
              <motion.div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  done ? 'bg-emerald-400' : 'bg-slate-700'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
              />
            ))}
          </div>
          <Badge variant="outline" className="border-emerald-600 text-emerald-400">
            {trainingAvailable} session{trainingAvailable !== 1 ? 's' : ''} left
          </Badge>
        </div>
      </div>

      {/* Fatigue Warning */}
      <AnimatePresence>
        {fatigueRisk !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <Card
              className={`border-2 ${
                fatigueRisk === 'critical'
                  ? 'bg-red-950/40 border-red-600'
                  : 'bg-amber-950/40 border-amber-600'
              }`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <AlertTriangle
                  className={`h-5 w-5 shrink-0 ${
                    fatigueRisk === 'critical' ? 'text-red-400' : 'text-amber-400'
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      fatigueRisk === 'critical' ? 'text-red-300' : 'text-amber-300'
                    }`}
                  >
                    {fatigueRisk === 'critical'
                      ? 'Danger: Extremely Low Fitness!'
                      : 'Warning: Low Fitness'}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      fatigueRisk === 'critical' ? 'text-red-400/80' : 'text-amber-400/80'
                    }`}
                  >
                    {fatigueRisk === 'critical'
                      ? `Fitness at ${player.fitness}%. Intense training is disabled. Consider recovery training.`
                      : `Fitness at ${player.fitness}%. Training carries increased injury risk.`}
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Fitness</span>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: getAttrBarColor(player.fitness) }}
            >
              {player.fitness}%
            </span>
          </div>
          <div className="h-2.5 bg-[#21262d] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${player.fitness}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ backgroundColor: getAttrBarColor(player.fitness) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Training Type Selection - Cards with gradient backgrounds */}
      <div className="grid grid-cols-2 gap-2">
        {trainingTypes.map(t => {
          const isSelected = selectedType === t.type;
          return (
            <motion.button
              key={t.type}
              onClick={() => handleTypeSelect(t.type)}
              className={`relative flex items-center gap-3 p-3 rounded-lg text-left transition-all overflow-hidden ${
                isSelected
                  ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'hover:scale-[1.02]'
              }`}
              style={{
                background: isSelected
                  ? undefined
                  : `linear-gradient(135deg, ${t.color}15, transparent)`,
                backgroundColor: isSelected ? undefined : '#0f172a',
                borderColor: isSelected ? undefined : '#1e293b',
              }}
              whileTap={{ scale: 1 }}
            >
              {/* Gradient overlay on selected */}
              {isSelected && (
                <motion.div
                  className={`absolute inset-0 ${t.gradient.includes('emerald') ? 'bg-emerald-500/5' : 'bg-[#21262d]'}`}
                  layoutId="trainingGradient"
                  transition={{ duration: 0.3 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3 w-full">
                <div
                  className="p-1.5 rounded-lg"
                  style={{
                    backgroundColor: `${t.color}20`,
                    color: t.color,
                  }}
                >
                  {t.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#c9d1d9]">{t.label}</p>
                  <p className="text-[10px] text-[#8b949e] truncate">{t.description}</p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto"
                  >
                    <ChevronRight className="h-4 w-4 text-emerald-400" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Attribute Preview - shown when a type is selected */}
      <AnimatePresence mode="wait">
        {selectedTrainingConfig && (
          <motion.div
            key={selectedTrainingConfig.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Attribute Preview — {selectedTrainingConfig.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                {(Object.keys(attrLabels) as (keyof PlayerAttributes)[]).map(attr => {
                  const isFocused = selectedTrainingConfig.focusAttrs.includes(attr);
                  const gain = expectedGains?.[attr];
                  const currentValue = player.attributes[attr];
                  const isFocusAttr = focusAttr === attr;

                  return (
                    <div key={attr} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[#8b949e]"
                            style={{ color: isFocused ? selectedTrainingConfig.color : undefined }}
                          >
                            {attrIcons[attr]}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              isFocused ? 'text-[#c9d1d9]' : 'text-[#8b949e]'
                            }`}
                          >
                            {attrLabels[attr]}
                          </span>
                          {isFocusAttr && (
                            <Badge className="h-4 px-1 text-[9px] bg-emerald-600/30 text-emerald-300 border-emerald-700">
                              FOCUS
                            </Badge>
                          )}
                          {isFocused && !isFocusAttr && (
                            <Badge className="h-4 px-1 text-[9px] bg-slate-700/50 text-[#8b949e] border-slate-600">
                              TRAINED
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#c9d1d9]">
                            {currentValue}
                          </span>
                          {gain && (
                            <motion.span
                              className="text-xs font-semibold text-emerald-400"
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 }}
                            >
                              +{gain.min}-{gain.max}
                            </motion.span>
                          )}
                        </div>
                      </div>

                      {/* Attribute bar with current + gain preview */}
                      <div className="relative h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                        {/* Current value bar (slate) */}
                        <motion.div
                          className="absolute h-full rounded-full"
                          style={{
                            backgroundColor: isFocused
                              ? `${selectedTrainingConfig.color}60`
                              : '#475569',
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${currentValue}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                        {/* Gain preview bar (emerald overlay) */}
                        {gain && (
                          <motion.div
                            className="absolute h-full rounded-full"
                            style={{
                              backgroundColor: isFocusAttr
                                ? '#10b981'
                                : `${selectedTrainingConfig.color}`,
                              opacity: isFocusAttr ? 0.7 : 0.4,
                            }}
                            initial={{ left: `${currentValue}%`, width: 0 }}
                            animate={{
                              left: `${currentValue}%`,
                              width: `${gain.max}%`,
                            }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Training Intensity Selector */}
      <AnimatePresence>
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
                  <Flame className="h-3.5 w-3.5" />
                  Training Intensity
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-3 gap-2">
                  {intensities.map(i => {
                    const isSelected = selectedIntensity === i.value;
                    const isDisabled = i.value === 90 && fatigueRisk === 'critical';
                    return (
                      <motion.button
                        key={i.value}
                        onClick={() => !isDisabled && setSelectedIntensity(i.value)}
                        disabled={isDisabled}
                        className={`relative p-3 rounded-lg text-center transition-all overflow-hidden ${
                          isSelected
                            ? 'ring-2 ring-emerald-400'
                            : isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-[#21262d]'
                        } ${isSelected ? i.bgColor : 'bg-[#21262d] border border-[#30363d]'}`}
                        whileTap={!isDisabled ? { scale: 1 } : undefined}
                      >
                        <p className="text-sm font-semibold" style={{ color: isDisabled ? '#64748b' : i.color }}>
                          {i.label}
                        </p>
                        <p className="text-[10px] text-[#8b949e] mt-0.5">{i.value}% effort</p>
                        <div className="flex items-center justify-center gap-1 mt-1.5">
                          {renderRiskIndicator(i.risk)}
                          <span
                            className="text-[9px] ml-1"
                            style={{ color: isDisabled ? '#475569' : i.color }}
                          >
                            {i.riskLabel}
                          </span>
                        </div>
                        <p className="text-[9px] text-[#484f58] mt-1">
                          Fatigue: -{i.fatigueCost}%
                        </p>
                        <p className="text-[9px] text-emerald-500/80">
                          Gain: x{i.gainMultiplier}
                        </p>
                        {isDisabled && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/60">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Intensity effect preview */}
                {selectedTrainingConfig && selectedTrainingConfig.focusAttrs.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-[#21262d] border border-[#30363d]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#8b949e]">Estimated fatigue cost</span>
                      <span className="text-xs font-semibold" style={{ color: selectedIntensityConfig.color }}>
                        -{selectedIntensityConfig.fatigueCost}% fitness
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#8b949e]">Gain multiplier</span>
                      <span className="text-xs font-semibold text-emerald-400">
                        x{selectedIntensityConfig.gainMultiplier}
                      </span>
                    </div>
                    {player.fitness - selectedIntensityConfig.fatigueCost < 30 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                        <span className="text-[10px] text-red-400">
                          This will leave you very fatigued!
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Attribute Selector */}
      <AnimatePresence>
        {selectedType && selectedTrainingConfig && selectedTrainingConfig.focusAttrs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Focus Attribute
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(attrLabels) as (keyof PlayerAttributes)[]).map(attr => {
                    const isTrained = selectedTrainingConfig.focusAttrs.includes(attr);
                    return (
                      <motion.button
                        key={attr}
                        onClick={() => setFocusAttr(attr)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          focusAttr === attr
                            ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300'
                            : isTrained
                            ? 'bg-[#21262d] border border-slate-600 text-[#c9d1d9] hover:bg-slate-700'
                            : 'bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:bg-slate-700'
                        }`}
                        whileTap={{ scale: 1 }}
                      >
                        {attrIcons[attr]}
                        {attrLabels[attr]}
                        {isTrained && focusAttr !== attr && (
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#484f58] mt-2">
                  Focus attribute receives 1.5x gain bonus
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Button */}
      {scheduledTraining ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-emerald-900/20 border-emerald-800">
            <CardContent className="p-4 text-center">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              </motion.div>
              <p className="text-emerald-300 text-sm font-semibold">Training Scheduled!</p>
              <p className="text-emerald-400/70 text-xs mt-1">
                Will be applied when you advance the week
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Button
          onClick={handleSchedule}
          disabled={!selectedType || trainingAvailable <= 0 || isIntenseDisabled}
          className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 disabled:bg-[#21262d] disabled:text-[#484f58] rounded-lg font-semibold"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Schedule Training
        </Button>
      )}

      {/* Advance Week */}
      <Button
        onClick={() => advanceWeek()}
        variant="outline"
        className="w-full border-[#30363d] text-[#c9d1d9] rounded-lg hover:bg-[#21262d]"
      >
        <Clock className="mr-2 h-4 w-4" />
        Advance Week
      </Button>

      {/* Training History */}
      {recentTrainingHistory.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
              <History className="h-3.5 w-3.5" />
              Recent Training
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {recentTrainingHistory.map((session, idx) => {
                const config = trainingTypes.find(t => t.type === session.type);
                const intensityConf = intensities.find(i => i.value === session.intensity);
                const timeAgo = session.completedAt
                  ? getTimeAgo(session.completedAt)
                  : 'Unknown';

                return (
                  <motion.div
                    key={`${session.completedAt}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-[#21262d] border border-[#30363d]"
                  >
                    <div
                      className="p-1.5 rounded-md shrink-0"
                      style={{
                        backgroundColor: config ? `${config.color}20` : '#1e293b',
                        color: config?.color ?? '#64748b',
                      }}
                    >
                      {config?.icon ?? <Dumbbell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#c9d1d9]">
                          {config?.label ?? session.type}
                        </span>
                        <Badge
                          className="h-4 px-1 text-[9px]"
                          style={{
                            backgroundColor: intensityConf
                              ? `${intensityConf.color}20`
                              : '#1e293b',
                            color: intensityConf?.color ?? '#64748b',
                            borderColor: intensityConf
                              ? `${intensityConf.color}40`
                              : '#334155',
                          }}
                        >
                          {intensityConf?.label ?? `${session.intensity}%`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {session.focusAttribute && (
                          <span className="text-[10px] text-emerald-400/70">
                            Focus: {attrLabels[session.focusAttribute]}
                          </span>
                        )}
                        {session.type === 'recovery' && (
                          <span className="text-[10px] text-pink-400/70">
                            Recovery session
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#484f58] shrink-0">
                      {timeAgo}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Attributes Overview */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] uppercase flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Current Attributes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2.5">
          {(Object.keys(attrLabels) as (keyof PlayerAttributes)[]).map((attr, idx) => (
            <div key={attr} className="flex items-center gap-3">
              <span style={{ color: getAttrBarColor(player.attributes[attr]) }}>
                {attrIcons[attr]}
              </span>
              <span className="text-xs text-[#8b949e] w-14">{attrLabels[attr]}</span>
              <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${player.attributes[attr]}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 }}
                  style={{ backgroundColor: getAttrBarColor(player.attributes[attr]) }}
                />
              </div>
              <span className="text-xs font-bold w-8 text-right text-[#c9d1d9]">
                {player.attributes[attr]}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Utility: Human-readable time ago
// ============================================================
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
