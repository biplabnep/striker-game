'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PlayerAttributes, Position } from '@/lib/game/types';
import { getAttributeCategory, getPositionCategory, getPositionColor } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, TrendingUp, Footprints, Crosshair, Target,
  Zap, Shield, Dumbbell, Users, BarChart3, ClipboardList,
  ChevronRight, Crown, AlertTriangle, Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// -----------------------------------------------------------
// Attribute metadata
// -----------------------------------------------------------
const ATTR_META: Record<keyof PlayerAttributes, { label: string; icon: React.ReactNode; short: string }> = {
  pace:      { label: 'Pace',      icon: <Footprints className="h-3.5 w-3.5" />, short: 'PAC' },
  shooting:  { label: 'Shooting',  icon: <Crosshair className="h-3.5 w-3.5" />,  short: 'SHO' },
  passing:   { label: 'Passing',   icon: <Target className="h-3.5 w-3.5" />,    short: 'PAS' },
  dribbling: { label: 'Dribbling', icon: <Zap className="h-3.5 w-3.5" />,       short: 'DRI' },
  defending: { label: 'Defending', icon: <Shield className="h-3.5 w-3.5" />,    short: 'DEF' },
  physical:  { label: 'Physical',  icon: <Dumbbell className="h-3.5 w-3.5" />,  short: 'PHY' },
};

const ATTR_KEYS: (keyof PlayerAttributes)[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

// -----------------------------------------------------------
// Position weights for distributing growth
// -----------------------------------------------------------
const POS_WEIGHTS: Record<string, Record<keyof PlayerAttributes, number>> = {
  attack:     { pace: 0.20, shooting: 0.35, passing: 0.10, dribbling: 0.20, defending: 0.02, physical: 0.13 },
  midfield:   { pace: 0.10, shooting: 0.12, passing: 0.30, dribbling: 0.20, defending: 0.13, physical: 0.15 },
  defence:    { pace: 0.12, shooting: 0.02, passing: 0.10, dribbling: 0.05, defending: 0.40, physical: 0.31 },
  goalkeeping:{ pace: 0.05, shooting: 0.00, passing: 0.10, dribbling: 0.00, defending: 0.15, physical: 0.20 },
};

// -----------------------------------------------------------
// League average baselines per position
// -----------------------------------------------------------
const LEAGUE_AVG: Record<string, Record<keyof PlayerAttributes, number>> = {
  attack:     { pace: 72, shooting: 70, passing: 62, dribbling: 68, defending: 35, physical: 65 },
  midfield:   { pace: 65, shooting: 60, passing: 70, dribbling: 66, defending: 58, physical: 68 },
  defence:    { pace: 62, shooting: 40, passing: 58, dribbling: 50, defending: 72, physical: 74 },
  goalkeeping:{ pace: 45, shooting: 20, passing: 50, dribbling: 30, defending: 40, physical: 70 },
};

const LEAGUE_STD_DEV = 12;

// -----------------------------------------------------------
// NPC teammate generation (seeded pseudo-random from club name)
// -----------------------------------------------------------
interface NPCTeammate {
  name: string;
  position: Position;
  age: number;
  overall: number;
  attributes: PlayerAttributes;
}

const NPC_FIRST = ['Liam', 'Marcus', 'Ravi', 'Yuki', 'Erik', 'Davi', 'Kwame', 'Mateo', 'Lucas', 'Omar'];
const NPC_LAST = ['Chen', 'Okafor', 'Tanaka', 'Lindqvist', 'Almeida', 'Diallo', 'Rossi', 'Petrov', 'Park', 'Fernandez'];
const NPC_POSITIONS: Position[] = ['ST', 'CAM', 'CM', 'CDM', 'CB', 'LW', 'RW', 'LB', 'RB', 'GK'];

function seedHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateNPCTeammates(clubName: string, clubQuality: number, count: number = 5): NPCTeammate[] {
  const seed = seedHash(clubName);
  const teammates: NPCTeammate[] = [];

  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 7) % NPC_FIRST.length;
    const name = `${NPC_FIRST[idx]} ${NPC_LAST[(seed + i * 13) % NPC_LAST.length]}`;
    const pos = NPC_POSITIONS[(seed + i * 3) % NPC_POSITIONS.length];
    const cat = getPositionCategory(pos);
    const baseQuality = Math.max(35, Math.min(90, clubQuality + ((seed + i * 17) % 20) - 10));
    const age = 18 + ((seed + i * 11) % 16);

    const baselines = LEAGUE_AVG[cat];
    const attrs: PlayerAttributes = {
      pace:      Math.max(30, Math.min(95, baselines.pace      + (((seed + i * 23) % 30) - 15))),
      shooting:  Math.max(20, Math.min(95, baselines.shooting  + (((seed + i * 29) % 30) - 15))),
      passing:   Math.max(25, Math.min(95, baselines.passing   + (((seed + i * 31) % 30) - 15))),
      dribbling: Math.max(25, Math.min(95, baselines.dribbling + (((seed + i * 37) % 30) - 15))),
      defending: Math.max(20, Math.min(95, baselines.defending + (((seed + i * 41) % 30) - 15))),
      physical:  Math.max(30, Math.min(95, baselines.physical  + (((seed + i * 43) % 30) - 15))),
    };

    const overall = Math.round(
      (attrs.pace + attrs.shooting + attrs.passing + attrs.dribbling + attrs.defending + attrs.physical) / 6
    );

    teammates.push({ name, position: pos, age, overall, attributes: attrs });
  }

  return teammates;
}

// -----------------------------------------------------------
// Tab definitions
// -----------------------------------------------------------
type TabId = 'potential' | 'teammate' | 'league' | 'development';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'potential',   label: 'vs Potential', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'teammate',    label: 'vs Teammate',  icon: <Users className="h-4 w-4" /> },
  { id: 'league',      label: 'League Avg',   icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'development', label: 'Train Plan',   icon: <ClipboardList className="h-4 w-4" /> },
];

// -----------------------------------------------------------
// Helper: estimate potential attributes
// -----------------------------------------------------------
function estimatePotentialAttrs(
  attrs: PlayerAttributes,
  overall: number,
  potential: number,
  position: string
): PlayerAttributes {
  const growthRoom = Math.max(0, potential - overall);
  const weights = POS_WEIGHTS[getPositionCategory(position)] ?? POS_WEIGHTS.attack;

  const result = { ...attrs };
  for (const key of ATTR_KEYS) {
    const growth = Math.round(growthRoom * (weights[key] ?? 0.1) * (0.8 + 0.4 * 0.5));
    result[key] = Math.min(99, attrs[key] + growth);
  }
  return result;
}

// -----------------------------------------------------------
// Main Component
// -----------------------------------------------------------
export default function PlayerComparison() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const [activeTab, setActiveTab] = useState<TabId>('potential');
  const [selectedTeammate, setSelectedTeammate] = useState<string | null>(null);

  // Derived data
  const potentialAttrs = useMemo(() => {
    if (!gameState) return null;
    const { player } = gameState;
    return estimatePotentialAttrs(player.attributes, player.overall, player.potential, player.position);
  }, [gameState]);

  const teammates = useMemo(() => {
    if (!gameState) return [];
    return generateNPCTeammates(gameState.currentClub.name, gameState.currentClub.quality);
  }, [gameState]);

  const chosenTeammate = useMemo(
    () => teammates.find(t => t.name === selectedTeammate) ?? teammates[0] ?? null,
    [teammates, selectedTeammate]
  );

  // League comparison with percentile calculation
  const leagueComparison = useMemo(() => {
    if (!gameState) return null;
    const cat = getPositionCategory(gameState.player.position);
    const avg = LEAGUE_AVG[cat];

    return ATTR_KEYS.map(key => {
      const val = gameState.player.attributes[key];
      const mean = avg[key];
      // Approximate percentile using normal distribution
      const z = (val - mean) / LEAGUE_STD_DEV;
      const percentile = Math.max(1, Math.min(99, Math.round(50 + z * 20)));
      const diff = val - mean;
      return { key, val, mean, percentile, diff };
    });
  }, [gameState]);

  // Development plan
  const developmentPlan = useMemo(() => {
    if (!gameState) return [];
    const { player } = gameState;
    const cat = getPositionCategory(player.position);
    const weights = POS_WEIGHTS[cat] ?? POS_WEIGHTS.attack;
    const avg = LEAGUE_AVG[cat];
    const growthRoom = Math.max(0, player.potential - player.overall);

    return ATTR_KEYS
      .map(key => {
        const val = player.attributes[key];
        const target = Math.min(99, val + Math.round(growthRoom * (weights[key] ?? 0.1)));
        const gap = target - val;
        const priority = weights[key] ?? 0.1;
        // Weakness score: low value + high positional weight
        const weakness = (99 - val) * priority + (avg[key] - val) * 0.5;
        const weeksEstimate = gap > 0 ? Math.max(1, Math.ceil(gap / 0.8)) : 0;
        return {
          key,
          label: ATTR_META[key].label,
          short: ATTR_META[key].short,
          icon: ATTR_META[key].icon,
          current: val,
          target,
          gap,
          priority,
          weakness,
          weeksEstimate,
          positionWeight: weights[key] ?? 0.1,
        };
      })
      .sort((a, b) => b.weakness - a.weakness);
  }, [gameState]);

  // Auto-select first teammate
  // (chosenTeammate already falls back to teammates[0] when selectedTeammate is null)

  if (!gameState) return null;

  const { player, currentClub } = gameState;
  const growthRoom = Math.max(0, player.potential - player.overall);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('dashboard')}
          className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#8b949e]" />
        </button>
        <h2 className="text-lg font-bold text-[#c9d1d9]">Player Comparison</h2>
      </div>

      {/* Player Summary Card */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#21262d] flex items-center justify-center">
                <span className="text-lg font-black text-emerald-400">{player.overall}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{player.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs font-bold px-1.5" style={{ color: getPositionColor(player.position), borderColor: getPositionColor(player.position) }}>
                    {player.position}
                  </Badge>
                  <span className="text-xs text-[#8b949e]">Age {player.age}</span>
                  <span className="text-xs text-[#8b949e]">{currentClub.name}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-[#8b949e]">POT</div>
                <div className="text-lg font-bold text-emerald-400">{player.potential}</div>
                <div className="text-[10px] text-emerald-400/70">+{growthRoom} room</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
        <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* ─── Tab 1: Self vs Potential ─── */}
          {activeTab === 'potential' && potentialAttrs && (
            <div className="space-y-3">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" /> Current vs Potential
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Overall comparison */}
                  <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                    <div className="text-center">
                      <div className="text-[10px] text-[#8b949e]">Current</div>
                      <div className="text-2xl font-black text-[#c9d1d9]">{player.overall}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-px flex-1 w-12 bg-[#30363d]" />
                      <ChevronRight className="h-4 w-4 text-emerald-400 my-1" />
                      <div className="h-px flex-1 w-12 bg-[#30363d]" />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-[#8b949e]">Potential</div>
                      <div className="text-2xl font-black text-emerald-400">{player.potential}</div>
                    </div>
                  </div>

                  {/* Attribute bars */}
                  {ATTR_KEYS.map((key, i) => {
                    const current = player.attributes[key];
                    const potential = potentialAttrs[key];
                    const gap = potential - current;
                    const meta = ATTR_META[key];
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {meta.icon}
                            <span className="text-xs text-[#c9d1d9] font-medium">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-[#c9d1d9]">{current}</span>
                            <span className="text-[#8b949e]">→</span>
                            <span className="text-emerald-400 font-bold">{potential}</span>
                            {gap > 0 && <span className="text-emerald-400/60 text-[10px]">+{gap}</span>}
                          </div>
                        </div>
                        <div className="flex h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-slate-500 rounded-l-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${current}%` }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                          />
                          {gap > 0 && (
                            <motion.div
                              className="h-full bg-emerald-500/40 rounded-r-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${gap}%` }}
                              transition={{ delay: 0.3 + i * 0.05, duration: 0.2 }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Position Suitability */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                    <Target className="h-3.5 w-3.5" /> Position Suitability
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(['ST', 'LW', 'RW', 'CAM', 'CM', 'CF'] as string[]).map(pos => {
                      const cat = getPositionCategory(pos);
                      const weights = POS_WEIGHTS[cat] ?? POS_WEIGHTS.attack;
                      let score = 0;
                      for (const key of ATTR_KEYS) {
                        score += player.attributes[key] * (weights[key] ?? 0.1);
                      }
                      const maxScore = 99 * ATTR_KEYS.reduce((s, k) => s + (weights[k] ?? 0.1), 0);
                      const suitability = Math.round((score / maxScore) * 100);
                      const isPrimary = pos === player.position;
                      return (
                        <div
                          key={pos}
                          className={`rounded-lg p-2 flex items-center justify-between ${
                            isPrimary ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[#21262d]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isPrimary && <Crown className="h-3 w-3 text-emerald-400" />}
                            <span className={`text-xs font-bold ${isPrimary ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                              {pos}
                            </span>
                          </div>
                          <span className={`text-xs font-mono font-bold ${isPrimary ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                            {suitibility}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Tab 2: Compare with Teammate ─── */}
          {activeTab === 'teammate' && (
            <div className="space-y-3">
              {/* Teammate selector */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-3">
                  <div className="text-[10px] text-[#8b949e] font-medium mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Select Teammate
                  </div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                    {teammates.map(tm => (
                      <button
                        key={tm.name}
                        onClick={() => setSelectedTeammate(tm.name)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                          chosenTeammate?.name === tm.name
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'hover:bg-[#21262d] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold px-1.5" style={{ color: getPositionColor(tm.position), borderColor: getPositionColor(tm.position) }}>
                            {tm.position}
                          </Badge>
                          <div className="text-left">
                            <div className={`text-xs font-medium ${chosenTeammate?.name === tm.name ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                              {tm.name}
                            </div>
                            <div className="text-[10px] text-[#8b949e]">Age {tm.age}</div>
                          </div>
                        </div>
                        <span className={`text-sm font-bold font-mono ${chosenTeammate?.name === tm.name ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                          {tm.overall}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comparison */}
              {chosenTeammate && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5" /> {player.name} vs {chosenTeammate.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {/* OVR comparison */}
                    <div className="flex items-center justify-between bg-[#21262d] rounded-lg p-3">
                      <div className="text-center">
                        <div className="text-[10px] text-[#8b949e]">{player.name.split(' ')[0]}</div>
                        <div className={`text-xl font-black ${player.overall >= chosenTeammate.overall ? 'text-emerald-400' : 'text-red-400'}`}>
                          {player.overall}
                        </div>
                      </div>
                      <div className="text-xs text-[#8b949e] font-medium">OVR</div>
                      <div className="text-center">
                        <div className="text-[10px] text-[#8b949e]">{chosenTeammate.name.split(' ')[0]}</div>
                        <div className={`text-xl font-black ${chosenTeammate.overall >= player.overall ? 'text-emerald-400' : 'text-red-400'}`}>
                          {chosenTeammate.overall}
                        </div>
                      </div>
                    </div>

                    {/* Attribute side-by-side bars */}
                    {ATTR_KEYS.map((key, i) => {
                      const pVal = player.attributes[key];
                      const tVal = chosenTeammate.attributes[key];
                      const diff = pVal - tVal;
                      const meta = ATTR_META[key];
                      const color = diff > 0 ? 'emerald' : diff < 0 ? 'red' : 'slate';
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {meta.icon}
                              <span className="text-xs text-[#c9d1d9]">{meta.label}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className={color === 'emerald' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : 'text-[#c9d1d9]'}>
                                {pVal}
                              </span>
                              <span className="text-[#484f58]">vs</span>
                              <span className={color === 'red' ? 'text-emerald-400' : color === 'emerald' ? 'text-red-400' : 'text-[#c9d1d9]'}>
                                {tVal}
                              </span>
                              {diff !== 0 && (
                                <span className={`text-[10px] font-bold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {diff > 0 ? '+' : ''}{diff}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 h-2">
                            <div className="flex-1 bg-[#21262d] rounded-full overflow-hidden flex justify-end">
                              <motion.div
                                className={`h-full rounded-full ${diff >= 0 ? 'bg-emerald-500/60' : 'bg-slate-600/60'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pVal}%` }}
                                transition={{ delay: i * 0.05, duration: 0.2 }}
                              />
                            </div>
                            <div className="flex-1 bg-[#21262d] rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${diff <= 0 ? 'bg-emerald-500/60' : 'bg-slate-600/60'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${tVal}%` }}
                                transition={{ delay: i * 0.05 + 0.1, duration: 0.2 }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Summary */}
                    {(() => {
                      const wins = ATTR_KEYS.filter(k => player.attributes[k] > chosenTeammate.attributes[k]).length;
                      const losses = ATTR_KEYS.filter(k => player.attributes[k] < chosenTeammate.attributes[k]).length;
                      const draws = 6 - wins - losses;
                      return (
                        <div className={`rounded-lg p-3 text-center ${
                          wins > losses ? 'bg-emerald-500/10 border border-emerald-500/30' :
                          wins < losses ? 'bg-red-500/10 border border-red-500/30' :
                          'bg-[#21262d]'
                        }`}>
                          <div className="text-xs font-bold text-[#c9d1d9]">
                            {wins > losses ? (
                              <span className="text-emerald-400">You win {wins}-{losses}!</span>
                            ) : wins < losses ? (
                              <span className="text-red-400">{chosenTeammate.name.split(' ')[0]} wins {losses}-{wins}</span>
                            ) : (
                              <span className="text-[#8b949e]">Dead even! {wins} each</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#8b949e] mt-1">
                            {wins} better · {draws} equal · {losses} worse
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ─── Tab 3: League Average ─── */}
          {activeTab === 'league' && leagueComparison && (
            <div className="space-y-3">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5" /> vs {player.position} League Average
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {/* Overall percentile */}
                  {(() => {
                    const cat = getPositionCategory(player.position);
                    const avgAttrs = LEAGUE_AVG[cat];
                    const avgOvr = Math.round(ATTR_KEYS.reduce((s, k) => s + avgAttrs[k], 0) / 6);
                    const diff = player.overall - avgOvr;
                    const z = diff / LEAGUE_STD_DEV;
                    const percentile = Math.max(1, Math.min(99, Math.round(50 + z * 20)));
                    return (
                      <div className="bg-[#21262d] rounded-lg p-3 text-center">
                        <div className="text-[10px] text-[#8b949e] mb-1">Overall Percentile</div>
                        <div className={`text-3xl font-black ${percentile >= 75 ? 'text-emerald-400' : percentile >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          Top {100 - percentile}%
                        </div>
                        <div className="text-xs text-[#8b949e] mt-1">
                          Your OVR {player.overall} vs League Avg {avgOvr}
                          <span className={`ml-1 font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ({diff >= 0 ? '+' : ''}{diff})
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Per-attribute percentile */}
                  {leagueComparison.map((item, i) => {
                    const { key, val, mean, percentile, diff } = item;
                    const meta = ATTR_META[key];
                    const color = diff >= 8 ? 'emerald' : diff >= 0 ? 'amber' : 'red';
                    const percentileLabel =
                      percentile >= 90 ? 'Elite' :
                      percentile >= 75 ? 'Very Good' :
                      percentile >= 50 ? 'Above Average' :
                      percentile >= 25 ? 'Below Average' : 'Weak';
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {meta.icon}
                            <span className="text-xs text-[#c9d1d9]">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className="text-[9px] font-bold border-0 px-1.5"
                              style={{
                                backgroundColor: color === 'emerald' ? 'rgba(16,185,129,0.15)' : color === 'amber' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                color: color === 'emerald' ? '#34d399' : color === 'amber' ? '#fbbf24' : '#f87171',
                              }}
                            >
                              Top {100 - percentile}%
                            </Badge>
                            <span className="text-xs font-mono text-[#8b949e]">{percentileLabel}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden relative">
                            {/* League average marker */}
                            <div
                              className="absolute top-0 h-full w-0.5 bg-[#8b949e]/40 z-10"
                              style={{ left: `${mean}%` }}
                            />
                            <motion.div
                              className={`h-full rounded-full ${color === 'emerald' ? 'bg-emerald-500/60' : color === 'amber' ? 'bg-amber-500/60' : 'bg-red-500/60'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ delay: i * 0.05, duration: 0.2 }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#484f58]">
                          <span>{val} (you)</span>
                          <span>{mean} (avg)</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Tab 4: Development Plan ─── */}
          {activeTab === 'development' && developmentPlan.length > 0 && (
            <div className="space-y-3">
              {/* Priority Summary */}
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" /> Training Priority
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center gap-2 mb-3 bg-[#21262d] rounded-lg p-3">
                    <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs text-[#c9d1d9] font-medium">
                        Focus on <span className="text-amber-400 font-bold">{developmentPlan[0].label}</span> first
                      </div>
                      <div className="text-[10px] text-[#8b949e]">
                        Your biggest weakness relative to your position demands
                      </div>
                    </div>
                  </div>

                  {/* Priority list */}
                  <div className="space-y-2">
                    {developmentPlan.map((item, i) => {
                      const isTop = i === 0;
                      const barColor = isTop ? 'bg-amber-500/60' : item.gap > 3 ? 'bg-emerald-500/40' : 'bg-slate-600/40';
                      return (
                        <motion.div
                          key={item.key}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.15 }}
                          className={`rounded-lg p-3 ${isTop ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-[#21262d]'}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-black w-5 h-5 rounded-md flex items-center justify-center ${
                              isTop ? 'bg-amber-500/20 text-amber-400' : 'bg-[#0d1117] text-[#484f58]'
                            }`}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                {item.icon}
                                <span className={`text-xs font-bold ${isTop ? 'text-amber-400' : 'text-[#c9d1d9]'}`}>
                                  {item.label}
                                </span>
                                {isTop && <Badge className="text-[8px] font-bold border-0 bg-amber-500/20 text-amber-400 px-1">TOP</Badge>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-mono text-[#c9d1d9]">
                                {item.current} <span className="text-[#484f58]">→</span>{' '}
                                <span className="text-emerald-400 font-bold">{item.target}</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress bar showing current vs target */}
                          <div className="h-1.5 bg-[#0d1117] rounded-full overflow-hidden mb-1.5">
                            <div className="flex h-full">
                              <motion.div
                                className={`h-full rounded-l-full ${barColor}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${item.current}%` }}
                                transition={{ delay: 0.2 + i * 0.05, duration: 0.2 }}
                              />
                              {item.gap > 0 && (
                                <motion.div
                                  className="h-full bg-emerald-500/20 rounded-r-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.gap}%` }}
                                  transition={{ delay: 0.4 + i * 0.05, duration: 0.2 }}
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[#484f58]">
                              Pos weight: {Math.round(item.positionWeight * 100)}% · Gap: +{item.gap}
                            </span>
                            {item.weeksEstimate > 0 ? (
                              <span className="text-[#8b949e]">
                                ~{item.weeksEstimate} weeks to reach target
                              </span>
                            ) : (
                              <span className="text-emerald-400/60">At ceiling</span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Weekly training recommendation */}
                  <div className="mt-3 pt-3 border-t border-[#30363d]">
                    <div className="text-[10px] text-[#8b949e] mb-2">Recommended Weekly Schedule</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#21262d] rounded-lg p-2 text-center">
                        <Dumbbell className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1" />
                        <div className="text-[10px] font-bold text-[#c9d1d9]">2x Focus</div>
                        <div className="text-[9px] text-[#8b949e]">{developmentPlan[0].label}</div>
                      </div>
                      <div className="bg-[#21262d] rounded-lg p-2 text-center">
                        <Shield className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" />
                        <div className="text-[10px] font-bold text-[#c9d1d9]">1x Balance</div>
                        <div className="text-[9px] text-[#8b949e]">{developmentPlan[1]?.label ?? 'Recovery'}</div>
                      </div>
                      <div className="bg-[#21262d] rounded-lg p-2 text-center">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-400 mx-auto mb-1" />
                        <div className="text-[10px] font-bold text-[#c9d1d9]">1x Physical</div>
                        <div className="text-[9px] text-[#8b949e]">Fitness</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
