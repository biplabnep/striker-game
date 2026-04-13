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
}[] = [
  {
    type: 'attacking',
    icon: <Sword className="h-4 w-4" />,
    label: 'Attacking',
    description: 'Shooting & dribbling',
    color: '#ef4444',
    focusAttrs: ['shooting', 'dribbling'],
    expectedGainRange: [1, 3],
    shortLabel: 'SHO +2, DRI +1',
  },
  {
    type: 'defensive',
    icon: <Shield className="h-4 w-4" />,
    label: 'Defensive',
    description: 'Defending & positioning',
    color: '#3b82f6',
    focusAttrs: ['defending'],
    expectedGainRange: [1, 3],
    shortLabel: 'DEF +2',
  },
  {
    type: 'physical',
    icon: <Zap className="h-4 w-4" />,
    label: 'Physical',
    description: 'Pace & strength',
    color: '#f59e0b',
    focusAttrs: ['pace', 'physical'],
    expectedGainRange: [1, 3],
    shortLabel: 'PAC +1, PHY +2',
  },
  {
    type: 'technical',
    icon: <Dumbbell className="h-4 w-4" />,
    label: 'Technical',
    description: 'Passing & ball control',
    color: '#10b981',
    focusAttrs: ['passing', 'dribbling'],
    expectedGainRange: [1, 3],
    shortLabel: 'PAS +2, DRI +1',
  },
  {
    type: 'tactical',
    icon: <Brain className="h-4 w-4" />,
    label: 'Tactical',
    description: 'Game awareness',
    color: '#8b5cf6',
    focusAttrs: ['passing', 'defending'],
    expectedGainRange: [1, 2],
    shortLabel: 'PAS +1, DEF +1',
  },
  {
    type: 'recovery',
    icon: <Heart className="h-4 w-4" />,
    label: 'Recovery',
    description: 'Rest & recuperation',
    color: '#ec4899',
    focusAttrs: [],
    expectedGainRange: [0, 0],
    shortLabel: 'Rest',
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

      {/* Season Training Focus Banner */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardContent className="p-3">
          {gameState.seasonTrainingFocus ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold text-[#c9d1d9]">
                  {seasonFocusAreaLabel} Focus
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
                  No training focus set
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

      {/* Header with session count & progress dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-[#c9d1d9]">Training</h2>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            {weeklyProgress.map((done, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-md ${done ? 'bg-emerald-400' : 'bg-[#30363d]'}`}
              />
            ))}
          </div>
          <Badge variant="outline" className="border-[#30363d] text-[#8b949e] text-[11px] h-5">
            {trainingAvailable} left
          </Badge>
        </div>
      </div>

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

      {/* Training Type Selection — single column list with horizontal card layout */}
      <div className="space-y-1.5">
        {trainingTypes.map((t, idx) => {
          const isSelected = selectedType === t.type;
          const isSeasonFocusType = gameState.seasonTrainingFocus?.area === t.type;
          return (
            <motion.div
              key={t.type}
              onClick={() => handleTypeSelect(t.type)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTypeSelect(t.type); } }}
              className={`relative flex items-center w-full text-left rounded-md transition-all overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-[#21262d]'
                  : 'bg-[#161b22] hover:bg-[#1c2129]'
              }`}
              style={{
                borderLeft: isSelected ? `3px solid ${t.color}` : '3px solid transparent',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: idx * 0.03 }}
            >
              <div className="flex items-center gap-3 p-2.5 flex-1 min-w-0">
                {/* Icon */}
                <div
                  className="p-1.5 rounded-md shrink-0"
                  style={{
                    backgroundColor: `${t.color}15`,
                    color: isSelected ? t.color : '#8b949e',
                  }}
                >
                  {t.icon}
                </div>

                {/* Label + description */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-medium ${isSelected ? 'text-[#c9d1d9]' : 'text-[#8b949e]'}`}>
                      {t.label}
                    </span>
                    {/* Season focus dot indicator */}
                    {isSeasonFocusType && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Season Focus" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#484f58] truncate">{t.description}</p>
                </div>

                {/* Gain indicator on right */}
                <div className="shrink-0 text-right">
                  {t.focusAttrs.length > 0 ? (
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: isSelected ? t.color : '#484f58' }}
                    >
                      {t.shortLabel}
                    </span>
                  ) : (
                    <span className="text-[11px] text-pink-400/60">Rest</span>
                  )}
                </div>
              </div>

              {/* Focus attribute pills — merged into type card when selected */}
              {isSelected && t.focusAttrs.length > 0 && (
                <div className="flex items-center gap-1 pr-2.5">
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
                    <span className="text-[10px] text-emerald-500/50">Applied on advance</span>
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

      {/* Training History */}
      {recentTrainingHistory.length > 0 && (
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <History className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wide font-medium">Recent</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              {recentTrainingHistory.map((session, idx) => {
                const config = trainingTypes.find(t => t.type === session.type);
                const intensityConf = intensities.find(i => i.value === session.intensity);
                const timeAgo = session.completedAt
                  ? getTimeAgo(session.completedAt)
                  : 'Unknown';

                return (
                  <motion.div
                    key={`${session.completedAt}-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: idx * 0.04 }}
                    className="flex items-center gap-2.5 p-2 rounded-md bg-[#21262d] border border-[#30363d]"
                  >
                    <div
                      className="p-1 rounded-md shrink-0"
                      style={{
                        backgroundColor: config ? `${config.color}15` : '#21262d',
                        color: config?.color ?? '#64748b',
                      }}
                    >
                      {config?.icon ?? <Dumbbell className="h-3.5 w-3.5" />}
                    </div>
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
                      </div>
                      {session.focusAttribute && (
                        <span className="text-[10px] text-emerald-400/60">
                          {attrFullLabels[session.focusAttribute]}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#484f58] shrink-0">
                      {timeAgo}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
