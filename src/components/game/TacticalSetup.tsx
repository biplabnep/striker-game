'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Swords,
  Target,
  Zap,
  ArrowUp,
  Lock,
  Crosshair,
  Sparkles,
  Rocket,
  Timer,
  Brain,
  CheckCircle2,
  ChevronRight,
  Scale,
  Users,
  ClipboardCheck,
} from 'lucide-react';
import type { Position, PlayerAttributes } from '@/lib/game/types';
import { useGameStore } from '@/store/gameStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TacticalSetupProps {
  isOpen: boolean;
  onClose: () => void;
  playerPosition: Position;
  playerAttributes: PlayerAttributes;
}

interface FormationDef {
  id: string;
  name: string;
  description: string;
  positions: { x: number; y: number }[];
}

interface EffectTag {
  label: string;
  positive: boolean;
}

interface SelectOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  effects: EffectTag[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CARD_BG = 'bg-[#161b22]';
const BORDER = 'border-[#30363d]';
const TEXT_PRI = 'text-[#c9d1d9]';
const TEXT_SEC = 'text-[#8b949e]';

const FORMATIONS: FormationDef[] = [
  {
    id: '4-4-2',
    name: '4-4-2',
    description: 'Classic flat formation — solid in defence and attack',
    positions: [
      { x: 50, y: 88 }, { x: 15, y: 66 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 85, y: 66 },
      { x: 15, y: 44 }, { x: 37, y: 48 }, { x: 63, y: 48 }, { x: 85, y: 44 },
      { x: 38, y: 22 }, { x: 62, y: 22 },
    ],
  },
  {
    id: '4-3-3',
    name: '4-3-3',
    description: 'Wide attacking shape with wingers and a lone striker',
    positions: [
      { x: 50, y: 88 }, { x: 15, y: 66 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 85, y: 66 },
      { x: 30, y: 44 }, { x: 50, y: 40 }, { x: 70, y: 44 },
      { x: 18, y: 20 }, { x: 50, y: 16 }, { x: 82, y: 20 },
    ],
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    description: 'Three centre-backs with wingbacks supporting two strikers',
    positions: [
      { x: 50, y: 88 }, { x: 28, y: 68 }, { x: 50, y: 72 }, { x: 72, y: 68 },
      { x: 10, y: 46 }, { x: 30, y: 42 }, { x: 50, y: 40 }, { x: 70, y: 42 }, { x: 90, y: 46 },
      { x: 38, y: 20 }, { x: 62, y: 20 },
    ],
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    description: 'Double pivot shield with an attacking three behind a striker',
    positions: [
      { x: 50, y: 88 }, { x: 15, y: 66 }, { x: 37, y: 70 }, { x: 63, y: 70 }, { x: 85, y: 66 },
      { x: 38, y: 52 }, { x: 62, y: 52 },
      { x: 20, y: 34 }, { x: 50, y: 32 }, { x: 80, y: 34 },
      { x: 50, y: 16 },
    ],
  },
  {
    id: '5-3-2',
    name: '5-3-2',
    description: 'Solid defensive block with five at the back',
    positions: [
      { x: 50, y: 88 }, { x: 22, y: 68 }, { x: 50, y: 72 }, { x: 78, y: 68 },
      { x: 8, y: 60 }, { x: 92, y: 60 },
      { x: 30, y: 42 }, { x: 50, y: 40 }, { x: 70, y: 42 },
      { x: 38, y: 20 }, { x: 62, y: 20 },
    ],
  },
  {
    id: '3-4-3',
    name: '3-4-3',
    description: 'Three centre-backs, flat midfield, and a three-man attack',
    positions: [
      { x: 50, y: 88 }, { x: 28, y: 68 }, { x: 50, y: 72 }, { x: 72, y: 68 },
      { x: 15, y: 44 }, { x: 38, y: 46 }, { x: 62, y: 46 }, { x: 85, y: 44 },
      { x: 18, y: 20 }, { x: 50, y: 16 }, { x: 82, y: 20 },
    ],
  },
];

const PLAYING_STYLES: SelectOption[] = [
  {
    id: 'attacking',
    name: 'Attacking',
    description: 'Focus on goals and creativity',
    icon: <Swords className="w-4 h-4" />,
    effects: [
      { label: 'Shooting', positive: true },
      { label: 'Chance creation', positive: true },
      { label: 'Defending', positive: false },
    ],
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Well-rounded approach',
    icon: <Scale className="w-4 h-4" />,
    effects: [],
  },
  {
    id: 'defensive',
    name: 'Defensive',
    description: 'Solid and compact',
    icon: <Shield className="w-4 h-4" />,
    effects: [
      { label: 'Defending', positive: true },
      { label: 'Clean sheets', positive: true },
      { label: 'Attacking output', positive: false },
    ],
  },
];

const INSTRUCTIONS: SelectOption[] = [
  {
    id: 'get_forward',
    name: 'Get Forward',
    description: 'Push higher up the pitch',
    icon: <ArrowUp className="w-4 h-4" />,
    effects: [
      { label: 'Goals', positive: true },
      { label: 'Fatigue', positive: false },
    ],
  },
  {
    id: 'hold_position',
    name: 'Hold Position',
    description: 'Stay in your zone',
    icon: <Lock className="w-4 h-4" />,
    effects: [
      { label: 'Fatigue', positive: true },
      { label: 'Tactical discipline', positive: true },
    ],
  },
  {
    id: 'man_marking',
    name: 'Man Marking',
    description: 'Track specific opponent',
    icon: <Crosshair className="w-4 h-4" />,
    effects: [
      { label: 'Defending', positive: true },
      { label: 'Stamina', positive: false },
    ],
  },
  {
    id: 'free_role',
    name: 'Free Role',
    description: 'Roam across the pitch',
    icon: <Sparkles className="w-4 h-4" />,
    effects: [
      { label: 'Creativity', positive: true },
      { label: 'Positional discipline', positive: false },
    ],
  },
];

const MATCH_PLANS: SelectOption[] = [
  {
    id: 'early_pressure',
    name: 'Early Pressure',
    description: 'Attack from the start, may tire later',
    icon: <Rocket className="w-4 h-4" />,
    effects: [],
  },
  {
    id: 'grow_into_game',
    name: 'Grow Into Game',
    description: 'Start cautious, increase intensity in 2nd half',
    icon: <Timer className="w-4 h-4" />,
    effects: [],
  },
  {
    id: 'control_possession',
    name: 'Control Possession',
    description: 'Focus on passing and ball retention',
    icon: <Brain className="w-4 h-4" />,
    effects: [],
  },
  {
    id: 'counter_attack',
    name: 'Counter Attack',
    description: 'Absorb pressure, hit on the break',
    icon: <Zap className="w-4 h-4" />,
    effects: [],
  },
];

// ─── Opacity-only animation variants ─────────────────────────────────────────

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit: { opacity: 0 },
};

const staggerChild = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

// ─── SVG Pitch Diagram ───────────────────────────────────────────────────────

function PitchDiagram({
  positions,
  selected,
  small,
}: {
  positions: { x: number; y: number }[];
  selected: boolean;
  small?: boolean;
}) {
  const dotColor = selected ? '#10b981' : '#6b7280';
  const lineColor = '#2d6a4f';
  const fieldColor = '#1a472a';

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-auto ${small ? 'max-w-[90px]' : 'max-w-[110px]'}`}>
      {/* Pitch */}
      <rect x="2" y="2" width="96" height="96" rx="2" fill={fieldColor} />
      <rect x="2" y="2" width="96" height="96" rx="2" fill="none" stroke={lineColor} strokeWidth="0.8" />
      {/* Centre line & circle */}
      <line x1="2" y1="50" x2="98" y2="50" stroke={lineColor} strokeWidth="0.5" />
      <circle cx="50" cy="50" r="10" fill="none" stroke={lineColor} strokeWidth="0.5" />
      {/* Penalty areas */}
      <rect x="22" y="2" width="56" height="16" fill="none" stroke={lineColor} strokeWidth="0.5" />
      <rect x="22" y="82" width="56" height="16" fill="none" stroke={lineColor} strokeWidth="0.5" />
      {/* Goal areas */}
      <rect x="36" y="2" width="28" height="7" fill="none" stroke={lineColor} strokeWidth="0.4" />
      <rect x="36" y="91" width="28" height="7" fill="none" stroke={lineColor} strokeWidth="0.4" />
      {/* Player dots */}
      {positions.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === 0 ? 2.5 : 2}
          fill={dotColor}
          stroke={selected ? '#064e3b' : '#374151'}
          strokeWidth="0.6"
        />
      ))}
    </svg>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${TEXT_SEC} flex items-center gap-1.5 mb-2.5`}>
      {icon}
      {children}
    </h3>
  );
}

// ─── Effect Tags ─────────────────────────────────────────────────────────────

function EffectTags({ effects }: { effects: EffectTag[] }) {
  if (effects.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {effects.map((e, i) => (
        <span
          key={i}
          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
            e.positive
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-red-500/12 text-red-400 border border-red-500/20'
          }`}
        >
          {e.positive ? '↑' : '↓'} {e.label}
        </span>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TacticalSetup({
  isOpen,
  onClose,
  playerPosition,
  playerAttributes,
}: TacticalSetupProps) {
  const [formation, setFormation] = useState('4-4-2');
  const [playingStyle, setPlayingStyle] = useState('balanced');
  const [instruction, setInstruction] = useState('hold_position');
  const [matchPlan, setMatchPlan] = useState('control_possession');
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = useCallback(() => {
    const store = useGameStore.getState();
    const gs = store.gameState;
    if (gs) {
      const updatedPlayer = { ...gs.player, morale: Math.min(100, gs.player.morale + 1) };
      useGameStore.setState({ gameState: { ...gs, player: updatedPlayer } });
    }
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      onClose();
    }, 600);
  }, [onClose]);

  // Derived labels for summary
  const formationLabel = FORMATIONS.find(f => f.id === formation)?.name ?? formation;
  const styleLabel = PLAYING_STYLES.find(s => s.id === playingStyle)?.name ?? playingStyle;
  const instructionLabel = INSTRUCTIONS.find(i => i.id === instruction)?.name ?? instruction;
  const planLabel = MATCH_PLANS.find(m => m.id === matchPlan)?.name ?? matchPlan;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          />

          {/* Modal Content */}
          <motion.div
            className={`relative w-full max-w-lg ${CARD_BG} border ${BORDER} rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col z-10`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <motion.div
              className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0"
              variants={staggerChild}
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Tactical Setup</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Scrollable body */}
            <div className="px-4 pb-4 overflow-y-auto scrollbar-thin space-y-5">

              {/* ── Formation Selection ────────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<Users className="w-3.5 h-3.5" />}>Formation</SectionHeader>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATIONS.map(f => {
                    const isSelected = f.id === formation;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFormation(f.id)}
                        className={`rounded-lg border p-2 text-center transition-colors ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-500/10'
                            : `${BORDER} bg-[#21262d] hover:border-[#484f58]`
                        }`}
                      >
                        <PitchDiagram positions={f.positions} selected={isSelected} small />
                        <p className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-emerald-400' : TEXT_PRI}`}>
                          {f.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className={`text-[10px] ${TEXT_SEC} mt-1.5 leading-relaxed`}>
                  {FORMATIONS.find(f => f.id === formation)?.description}
                </p>
              </motion.div>

              {/* ── Playing Style ──────────────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<Target className="w-3.5 h-3.5" />}>Playing Style</SectionHeader>
                <div className="grid grid-cols-3 gap-2">
                  {PLAYING_STYLES.map(s => {
                    const isSelected = s.id === playingStyle;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setPlayingStyle(s.id)}
                        className={`rounded-lg border p-3 text-center transition-colors ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-500/10'
                            : `${BORDER} bg-[#21262d] hover:border-[#484f58]`
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#30363d] text-[#8b949e]'
                        }`}>
                          {s.icon}
                        </div>
                        <p className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-400' : TEXT_PRI}`}>
                          {s.name}
                        </p>
                        <p className={`text-[9px] ${TEXT_SEC} mt-0.5`}>{s.description}</p>
                        <EffectTags effects={s.effects} />
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Individual Instruction ─────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<Crosshair className="w-3.5 h-3.5" />}>Individual Instruction</SectionHeader>
                <p className={`text-[10px] ${TEXT_SEC} -mt-1.5 mb-2`}>
                  Your role as <span className="text-white font-semibold">{playerPosition}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {INSTRUCTIONS.map(inst => {
                    const isSelected = inst.id === instruction;
                    return (
                      <button
                        key={inst.id}
                        onClick={() => setInstruction(inst.id)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-500/10'
                            : `${BORDER} bg-[#21262d] hover:border-[#484f58]`
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#30363d] text-[#8b949e]'
                          }`}>
                            {inst.icon}
                          </div>
                          <p className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-400' : TEXT_PRI}`}>
                            {inst.name}
                          </p>
                        </div>
                        <p className={`text-[9px] ${TEXT_SEC} ml-9`}>{inst.description}</p>
                        <div className="ml-9">
                          <EffectTags effects={inst.effects} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Match Plan ─────────────────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<Timer className="w-3.5 h-3.5" />}>Match Plan</SectionHeader>
                <div className="grid grid-cols-2 gap-2">
                  {MATCH_PLANS.map(mp => {
                    const isSelected = mp.id === matchPlan;
                    return (
                      <button
                        key={mp.id}
                        onClick={() => setMatchPlan(mp.id)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-emerald-500/60 bg-emerald-500/10'
                            : `${BORDER} bg-[#21262d] hover:border-[#484f58]`
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#30363d] text-[#8b949e]'
                          }`}>
                            {mp.icon}
                          </div>
                          <p className={`text-[11px] font-semibold ${isSelected ? 'text-emerald-400' : TEXT_PRI}`}>
                            {mp.name}
                          </p>
                        </div>
                        <p className={`text-[9px] ${TEXT_SEC} ml-9`}>{mp.description}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Confirmation Summary ───────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionHeader icon={<CheckCircle2 className="w-3.5 h-3.5" />}>Summary</SectionHeader>
                <div className={`rounded-lg border ${BORDER} bg-[#21262d] p-3 space-y-2`}>
                  {[
                    { label: 'Formation', value: formationLabel },
                    { label: 'Style', value: styleLabel },
                    { label: 'Instruction', value: instructionLabel },
                    { label: 'Plan', value: planLabel },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className={`text-[10px] ${TEXT_SEC}`}>{row.label}</span>
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-[#30363d] pt-2 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="text-[9px] text-amber-400 font-medium">
                        Tactical preparation grants +1 morale
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Confirm Button ─────────────────────────────── */}
              <motion.div variants={staggerChild} className="pb-2">
                <button
                  onClick={handleConfirm}
                  disabled={confirmed}
                  className={`w-full h-12 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                    confirmed
                      ? 'bg-emerald-600/50 text-emerald-300 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {confirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Tactics Confirmed
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Confirm Tactics
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
