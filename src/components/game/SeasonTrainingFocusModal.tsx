'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { FOCUS_AREA_ATTRIBUTES, calculateFocusBonusMultiplier } from '@/lib/game/progressionEngine';
import { SeasonTrainingFocusArea, PlayerAttributes } from '@/lib/game/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sword, Shield, Zap, Dumbbell, Brain, Check, X } from 'lucide-react';

// Focus area configuration with icons and colors
const FOCUS_AREAS: {
  area: SeasonTrainingFocusArea;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  description: string;
}[] = [
  {
    area: 'attacking',
    label: 'Attacking',
    icon: <Sword className="h-5 w-5" />,
    accentColor: 'red',
    accentBg: 'bg-red-500/8',
    accentBorder: 'border-red-500/25',
    accentText: 'text-red-400',
    description: 'Focus: Shooting, Dribbling',
  },
  {
    area: 'defensive',
    label: 'Defensive',
    icon: <Shield className="h-5 w-5" />,
    accentColor: 'blue',
    accentBg: 'bg-blue-500/8',
    accentBorder: 'border-blue-500/25',
    accentText: 'text-blue-400',
    description: 'Focus: Defending',
  },
  {
    area: 'physical',
    label: 'Physical',
    icon: <Zap className="h-5 w-5" />,
    accentColor: 'amber',
    accentBg: 'bg-amber-500/8',
    accentBorder: 'border-amber-500/25',
    accentText: 'text-amber-400',
    description: 'Focus: Pace, Physical',
  },
  {
    area: 'technical',
    label: 'Technical',
    icon: <Dumbbell className="h-5 w-5" />,
    accentColor: 'emerald',
    accentBg: 'bg-emerald-500/8',
    accentBorder: 'border-emerald-500/25',
    accentText: 'text-emerald-400',
    description: 'Focus: Passing, Dribbling, Shooting',
  },
  {
    area: 'tactical',
    label: 'Tactical',
    icon: <Brain className="h-5 w-5" />,
    accentColor: 'violet',
    accentBg: 'bg-violet-500/8',
    accentBorder: 'border-violet-500/25',
    accentText: 'text-violet-400',
    description: 'Focus: Passing, Defending',
  },
];

interface SeasonTrainingFocusModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SeasonTrainingFocusModal({ open, onClose }: SeasonTrainingFocusModalProps) {
  const gameState = useGameStore(state => state.gameState);
  const setSeasonTrainingFocus = useGameStore(state => state.setSeasonTrainingFocus);

  const [selected, setSelected] = useState<SeasonTrainingFocusArea | null>(null);

  // Calculate bonus multiplier preview for each area
  const bonusMultipliers = useMemo(() => {
    if (!gameState) return {} as Record<SeasonTrainingFocusArea, number>;
    const result = {} as Record<SeasonTrainingFocusArea, number>;
    for (const area of Object.keys(FOCUS_AREA_ATTRIBUTES) as SeasonTrainingFocusArea[]) {
      result[area] = calculateFocusBonusMultiplier(
        gameState.player,
        gameState.player.seasonStats
      );
    }
    return result;
  }, [gameState]);

  const handleConfirm = () => {
    if (!selected) return;
    setSeasonTrainingFocus(selected);
    onClose();
  };

  if (!gameState) return null;

  const { player } = gameState;
  const attributes = player.attributes;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0d1117] border border-[#30363d] rounded-lg shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[#21262d] transition-colors z-10"
            >
              <X className="h-4 w-4 text-[#8b949e]" />
            </button>

            {/* Header */}
            <div className="p-5 pb-3">
              <h2 className="text-lg font-bold text-[#c9d1d9]">
                Set Your Season Training Focus
              </h2>
              <p className="text-sm text-[#8b949e] mt-1.5 leading-relaxed">
                Choose your training focus for the season. Focused attributes get{' '}
                <span className="text-emerald-400 font-semibold">1.5x-2.0x</span>{' '}
                growth bonus based on your age, gametime, form, and potential.
              </p>
            </div>

            {/* Focus Area Cards */}
            <div className="px-5 pb-3 space-y-2.5">
              {FOCUS_AREAS.map((focus, index) => {
                const focusAttrs = FOCUS_AREA_ATTRIBUTES[focus.area];
                const isSelected = selected === focus.area;
                const bonus = bonusMultipliers[focus.area] ?? 1.5;

                return (
                  <motion.button
                    key={focus.area}
                    onClick={() => setSelected(focus.area)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#161b22] border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-[#161b22] border-[#30363d] hover:border-[#484f58]'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${focus.accentBg} ${focus.accentText}`}>
                        {focus.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#c9d1d9]">
                            {focus.label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-400">
                              {bonus.toFixed(2)}x
                            </span>
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              >
                                <Check className="h-4 w-4 text-emerald-400" />
                              </motion.div>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-[#8b949e] mt-0.5">{focus.description}</p>

                        {/* Attribute values */}
                        <div className="flex items-center gap-3 mt-2">
                          {focusAttrs.map(attr => (
                            <div key={attr} className="flex items-center gap-1">
                              <span className="text-[10px] text-[#8b949e] capitalize">{attr}</span>
                              <span className={`text-xs font-bold ${focus.accentText}`}>
                                {attributes[attr as keyof PlayerAttributes]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Confirm Button */}
            <div className="p-5 pt-3">
              <Button
                onClick={handleConfirm}
                disabled={!selected}
                className={`w-full h-11 font-semibold rounded-lg transition-all duration-150 ${
                  selected
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-[#21262d] text-[#484f58] cursor-not-allowed'
                }`}
              >
                {selected ? `Confirm ${FOCUS_AREAS.find(f => f.area === selected)?.label} Focus` : 'Select a Focus Area'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
