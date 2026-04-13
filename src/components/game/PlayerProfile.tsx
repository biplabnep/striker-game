'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PlayerAttributes, CoreAttribute, MatchResult } from '@/lib/game/types';
import {
  getAttributeCategory,
  getOverallColor,
  getPositionColor,
  getPositionCategory,
  formatCurrency,
  getSquadStatusLabel,
} from '@/lib/game/gameUtils';
import { getSeasonMatchdays } from '@/lib/game/clubsData';
import { NATIONALITIES, PLAYER_TRAITS } from '@/lib/game/playerData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, Star, Trophy, Target,
  Footprints, Crosshair, Shield, Dumbbell, Zap,
  Award, Clock, Briefcase, DollarSign, ArrowUpRight, ArrowDownRight,
  MinusCircle, User, Goal, CircleDot, ShieldCheck, Calendar, Activity,
  Eye, Heart, Timer, HeartPulse, FileText, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// -----------------------------------------------------------
// Attribute key to label/icon mapping
// -----------------------------------------------------------
const ATTR_META: Record<CoreAttribute, { label: string; icon: React.ReactNode; shortLabel: string }> = {
  pace:      { label: 'Pace',      icon: <Footprints className="h-4 w-4" />,  shortLabel: 'PAC' },
  shooting:  { label: 'Shooting',  icon: <Crosshair className="h-4 w-4" />,   shortLabel: 'SHO' },
  passing:   { label: 'Passing',   icon: <Target className="h-4 w-4" />,      shortLabel: 'PAS' },
  dribbling: { label: 'Dribbling', icon: <Zap className="h-4 w-4" />,         shortLabel: 'DRI' },
  defending: { label: 'Defending', icon: <Shield className="h-4 w-4" />,      shortLabel: 'DEF' },
  physical:  { label: 'Physical',  icon: <Dumbbell className="h-4 w-4" />,    shortLabel: 'PHY' },
};

const ATTR_KEYS: CoreAttribute[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

// -----------------------------------------------------------
// Radar chart helpers
// -----------------------------------------------------------
const ANGLES = [-90, -30, 30, 90, 150, 210]; // degrees, starting from top

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function getPolygonPoints(cx: number, cy: number, r: number, values: number[]): string {
  return values
    .map((v, i) => {
      const pt = polarToCartesian(cx, cy, (v / 100) * r, ANGLES[i]);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

// -----------------------------------------------------------
// Squad status color
// -----------------------------------------------------------
function getSquadStatusColor(status: string): string {
  switch (status) {
    case 'starter': return '#22c55e';
    case 'rotation': return '#3b82f6';
    case 'bench': return '#f59e0b';
    case 'prospect': return '#a78bfa';
    case 'loan': return '#06b6d4';
    case 'transfer_listed': return '#ef4444';
    default: return '#94a3b8';
  }
}

// -----------------------------------------------------------
// Simulated position averages for comparison
// -----------------------------------------------------------
function getPositionAverages(position: string): Record<CoreAttribute, number> {
  const cat = getPositionCategory(position);
  switch (cat) {
    case 'attack':
      return { pace: 72, shooting: 70, passing: 62, dribbling: 68, defending: 35, physical: 65 };
    case 'midfield':
      return { pace: 65, shooting: 60, passing: 70, dribbling: 66, defending: 58, physical: 68 };
    case 'defence':
      return { pace: 62, shooting: 40, passing: 58, dribbling: 50, defending: 72, physical: 74 };
    case 'goalkeeping':
      return { pace: 45, shooting: 20, passing: 50, dribbling: 30, defending: 40, physical: 70 };
    default:
      return { pace: 60, shooting: 55, passing: 60, dribbling: 55, defending: 55, physical: 65 };
  }
}

// -----------------------------------------------------------
// Stat color coding: green (70+), amber (50-69), red (<50)
// -----------------------------------------------------------
function getStatColor(value: number): string {
  if (value >= 70) return '#22c55e';
  if (value >= 50) return '#f59e0b';
  return '#ef4444';
}

// -----------------------------------------------------------
// Form color: green (7+), amber (5-6), red (<5)
// -----------------------------------------------------------
function getFormColor(form: number): string {
  if (form >= 7) return '#22c55e';
  if (form >= 5) return '#f59e0b';
  return '#ef4444';
}

// -----------------------------------------------------------
// Club initials for logo placeholder
// -----------------------------------------------------------
function getClubInitials(name: string): string {
  return name.split(/[\s-]+/).map(w => w[0]).join('').toUpperCase().slice(0, 3);
}

// -----------------------------------------------------------
// Generate career milestones from game state
// -----------------------------------------------------------
interface Milestone {
  icon: React.ReactNode;
  label: string;
  description: string;
  season: number;
  week: number;
  unlocked: boolean;
}

function generateMilestones(gameState: ReturnType<typeof useGameStore.getState>['gameState']): Milestone[] {
  if (!gameState) return [];
  const { player, currentClub, seasons, recentResults, achievements } = gameState;
  const milestones: Milestone[] = [];

  // First match
  const firstMatch = [...recentResults].reverse().find(r => r.playerMinutesPlayed > 0);
  if (player.careerStats.totalAppearances > 0) {
    milestones.push({
      icon: <User className="h-4 w-4" />,
      label: 'First Match',
      description: 'Made your professional debut',
      season: firstMatch?.season ?? 1,
      week: firstMatch?.week ?? 1,
      unlocked: true,
    });
  }

  // First goal
  const firstGoal = [...recentResults].reverse().find(r => r.playerGoals > 0);
  if (player.careerStats.totalGoals > 0) {
    milestones.push({
      icon: <Goal className="h-4 w-4" />,
      label: 'First Goal',
      description: 'Scored your first professional goal',
      season: firstGoal?.season ?? 1,
      week: firstGoal?.week ?? 1,
      unlocked: true,
    });
  }

  // First assist
  const firstAssist = [...recentResults].reverse().find(r => r.playerAssists > 0);
  if (player.careerStats.totalAssists > 0) {
    milestones.push({
      icon: <CircleDot className="h-4 w-4" />,
      label: 'First Assist',
      description: 'Provided your first professional assist',
      season: firstAssist?.season ?? 1,
      week: firstAssist?.week ?? 1,
      unlocked: true,
    });
  }

  // First trophy
  if (player.careerStats.trophies.length > 0) {
    const firstTrophy = player.careerStats.trophies[0];
    milestones.push({
      icon: <Trophy className="h-4 w-4" />,
      label: 'First Trophy',
      description: `Won the ${firstTrophy.name}`,
      season: firstTrophy.season,
      week: getSeasonMatchdays(currentClub.league),
      unlocked: true,
    });
  }

  // Season completed
  for (const s of seasons) {
    milestones.push({
      icon: <Calendar className="h-4 w-4" />,
      label: `Season ${s.number} Complete`,
      description: `Finished ${s.leaguePosition}${getPositionSuffix(s.leaguePosition)} — ${s.playerStats.goals} goals, ${s.playerStats.assists} assists`,
      season: s.number,
      week: getSeasonMatchdays(currentClub.league),
      unlocked: true,
    });
  }

  // Achievements
  for (const a of achievements) {
    if (a.unlocked && a.unlockedSeason) {
      milestones.push({
        icon: <span className="text-sm">{a.icon}</span>,
        label: a.name,
        description: a.description,
        season: a.unlockedSeason,
        week: 1,
        unlocked: true,
      });
    }
  }

  // Potential milestones (not yet achieved)
  if (player.careerStats.totalAppearances === 0) {
    milestones.push({ icon: <User className="h-4 w-4" />, label: 'First Match', description: 'Make your professional debut', season: 0, week: 0, unlocked: false });
  }
  if (player.careerStats.totalGoals === 0) {
    milestones.push({ icon: <Goal className="h-4 w-4" />, label: 'First Goal', description: 'Score your first professional goal', season: 0, week: 0, unlocked: false });
  }
  if (player.careerStats.totalAssists === 0) {
    milestones.push({ icon: <CircleDot className="h-4 w-4" />, label: 'First Assist', description: 'Provide your first assist', season: 0, week: 0, unlocked: false });
  }
  if (player.careerStats.trophies.length === 0) {
    milestones.push({ icon: <Trophy className="h-4 w-4" />, label: 'First Trophy', description: 'Win your first trophy', season: 0, week: 0, unlocked: false });
  }

  // Sort: unlocked by season/week, then locked at the end
  milestones.sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    if (a.season !== b.season) return a.season - b.season;
    return a.week - b.week;
  });

  return milestones;
}

function getPositionSuffix(pos: number): string {
  if (pos === 1) return 'st';
  if (pos === 2) return 'nd';
  if (pos === 3) return 'rd';
  return 'th';
}

// -----------------------------------------------------------
// Simulate market value history (deterministic from game state)
// -----------------------------------------------------------
interface MarketValuePoint {
  season: number;
  value: number;
}

function simulateMarketValueHistory(
  currentValue: number,
  overall: number,
  seasonsPlayed: number,
  age: number,
  potential: number
): MarketValuePoint[] {
  const points: MarketValuePoint[] = [];
  const totalPoints = Math.max(1, seasonsPlayed + 1);

  // Build a plausible trajectory from low to current
  for (let i = 0; i <= totalPoints; i++) {
    const progress = i / totalPoints;
    // Start at ~20% of current value, grow with some variance
    const startFactor = 0.15 + (progress * 0.85);
    const value = currentValue * startFactor * (0.9 + progress * 0.1);
    points.push({ season: i + 1, value: Math.round(value * 100) / 100 });
  }

  // Last point is current
  points[points.length - 1].value = currentValue;
  return points;
}

// -----------------------------------------------------------
// Main Component
// -----------------------------------------------------------
export default function PlayerProfile() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  // Computed values
  const nationInfo = useMemo(() => {
    if (!gameState) return null;
    return NATIONALITIES.find(n => n.name === gameState.player.nationality);
  }, [gameState]);

  const overallColor = useMemo(() => {
    if (!gameState) return '#94a3b8';
    return getOverallColor(gameState.player.overall);
  }, [gameState]);

  const posColor = useMemo(() => {
    if (!gameState) return '#94a3b8';
    return getPositionColor(gameState.player.position);
  }, [gameState]);

  const milestones = useMemo(() => generateMilestones(gameState), [gameState]);

  const marketHistory = useMemo(() => {
    if (!gameState) return [];
    const { player } = gameState;
    return simulateMarketValueHistory(
      player.marketValue,
      player.overall,
      player.careerStats.seasonsPlayed,
      player.age,
      player.potential
    );
  }, [gameState]);

  // Season comparison data
  const seasonComparison = useMemo(() => {
    if (!gameState || gameState.seasons.length === 0) return null;
    const current = gameState.player.seasonStats;
    const prev = gameState.seasons[gameState.seasons.length - 1].playerStats;
    if (current.appearances < 1) return null;
    return { current, prev };
  }, [gameState]);

  // Form indicator (last 5 matches)
  const formIndicator = useMemo(() => {
    if (!gameState || gameState.recentResults.length === 0) return [];
    return gameState.recentResults.slice(0, 5).map(r => {
      const clubId = gameState.currentClub.id;
      const won = (r.homeClub.id === clubId && r.homeScore > r.awayScore) ||
                  (r.awayClub.id === clubId && r.awayScore > r.homeScore);
      const drew = r.homeScore === r.awayScore;
      return won ? 'W' : drew ? 'D' : 'L';
    });
  }, [gameState]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (!gameState) return { currentPoints: '', potentialPoints: '', gridRings: [] as string[], labels: [] as { x: number; y: number; label: string; value: number }[] };
    const { player } = gameState;
    const cx = 120, cy = 120, r = 95;
    const currentValues = ATTR_KEYS.map(k => player.attributes[k]);
    const potentialValues = ATTR_KEYS.map(k => Math.min(99, player.attributes[k] + Math.max(0, (player.potential - player.overall) * (Math.random() * 0.3 + 0.4))));

    // Grid rings at 25, 50, 75, 100
    const gridRings = [25, 50, 75, 100].map(v => getPolygonPoints(cx, cy, r, Array(6).fill(v)));

    const labels = ATTR_KEYS.map((k, i) => {
      const pt = polarToCartesian(cx, cy, r + 18, ANGLES[i]);
      return { x: pt.x, y: pt.y, label: ATTR_META[k].shortLabel, value: player.attributes[k] };
    });

    return {
      currentPoints: getPolygonPoints(cx, cy, r, currentValues),
      potentialPoints: getPolygonPoints(cx, cy, r, potentialValues),
      gridRings,
      labels,
    };
  }, [gameState]);

  // Minutes played percentage
  const minutesPct = useMemo(() => {
    if (!gameState) return 0;
    const totalPossible = gameState.player.seasonStats.appearances * 90;
    if (totalPossible === 0) return 0;
    return Math.round((gameState.player.seasonStats.minutesPlayed / totalPossible) * 100);
  }, [gameState]);

  // Form color
  const formColor = useMemo(() => {
    if (!gameState) return '#ef4444';
    return getFormColor(gameState.player.form);
  }, [gameState]);

  // Club initials
  const clubInitials = useMemo(() => {
    if (!gameState) return '';
    return getClubInitials(gameState.currentClub.name);
  }, [gameState]);

  // Career trend
  const careerTrend = useMemo<'improving' | 'declining' | 'stable'>(() => {
    if (!gameState || gameState.seasons.length < 1) return 'stable';
    const { player, seasons } = gameState;
    const prevSeason = seasons[seasons.length - 1];
    const currentAvg = player.seasonStats.averageRating;
    const prevAvg = prevSeason.playerStats.averageRating;
    if (currentAvg > prevAvg + 0.2) return 'improving';
    if (currentAvg < prevAvg - 0.2) return 'declining';
    return 'stable';
  }, [gameState]);

  // Position key attributes for radar highlighting
  const positionKeyAttrs = useMemo(() => {
    if (!gameState) return new Set<string>();
    const posKey = getPositionCategory(gameState.player.position);
    const weights: Record<string, Record<CoreAttribute, number>> = {
      attack: { pace: 0.2, shooting: 0.35, passing: 0.1, dribbling: 0.2, defending: 0.02, physical: 0.13 },
      midfield: { pace: 0.1, shooting: 0.12, passing: 0.3, dribbling: 0.2, defending: 0.13, physical: 0.15 },
      defence: { pace: 0.12, shooting: 0.02, passing: 0.1, dribbling: 0.05, defending: 0.4, physical: 0.31 },
      goalkeeping: { pace: 0.05, shooting: 0.0, passing: 0.1, dribbling: 0.0, defending: 0.15, physical: 0.2 },
    };
    const w = weights[posKey] || {};
    return new Set(ATTR_KEYS.filter(k => (w[k] ?? 0) > 0.15));
  }, [gameState]);

  // Career average rating
  const careerAvgRating = useMemo(() => {
    if (!gameState) return 0;
    const { player, seasons } = gameState;
    let total = 0;
    let count = 0;
    if (player.seasonStats.averageRating > 0 && player.seasonStats.appearances > 0) {
      total += player.seasonStats.averageRating;
      count++;
    }
    for (const s of seasons) {
      if (s.playerStats.averageRating > 0) {
        total += s.playerStats.averageRating;
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  }, [gameState]);

  if (!gameState) return null;

  const { player, currentClub, currentSeason, currentWeek, seasons } = gameState;
  const squadColor = getSquadStatusColor(player.squadStatus);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-6">
      {/* Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('dashboard')}
          className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#8b949e]" />
        </button>
        <h2 className="text-lg font-bold text-[#c9d1d9]">Player Profile</h2>
      </div>

      {/* ===== 1. PLAYER HEADER CARD ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden relative">
          {/* Background accent */}
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundColor: currentClub.primaryColor }} />

          <CardContent className="p-5 relative">
            {/* Top row: Club logo + Player info + YOU badge */}
            <div className="flex items-start gap-4">
              {/* Club logo placeholder */}
              <div
                className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-sm tracking-wider"
                style={{ backgroundColor: currentClub.primaryColor }}
              >
                {clubInitials}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-xl text-white truncate">{player.name}</h3>
                  <Badge className="text-[10px] font-black border-0 bg-white text-[#0d1117] px-2 py-0 tracking-wider">
                    YOU
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {nationInfo && <span className="text-lg leading-none">{nationInfo.flag}</span>}
                  <Badge
                    className="text-xs font-bold px-2.5 border-0 text-white"
                    style={{ backgroundColor: posColor }}
                  >
                    {player.position}
                  </Badge>
                  <span className="text-xs text-[#8b949e]">Age {player.age}</span>
                  <Badge
                    className="text-[10px] font-bold border-0 capitalize"
                    style={{ backgroundColor: `${squadColor}20`, color: squadColor }}
                  >
                    {getSquadStatusLabel(player.squadStatus)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-[#c9d1d9] font-medium">{currentClub.name}</span>
                  <span className="text-[#30363d]">|</span>
                  <span className="text-xs text-[#8b949e] capitalize">{player.preferredFoot} foot</span>
                </div>
              </div>
            </div>

            {/* Bottom row: OVR + Form + Potential */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {/* Overall Rating */}
              <div className="bg-[#0d1117] rounded-lg p-3 text-center border border-[#30363d]">
                <div className="relative inline-block">
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#21262d" strokeWidth="2.5" />
                    <motion.circle
                      cx="28" cy="28" r="24"
                      fill="none"
                      stroke={overallColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={2 * Math.PI * 24}
                      animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - player.overall / 99) }}
                      transition={{ duration: 0.2, ease: 'easeOut', delay: 0.3 }}
                      transform="rotate(-90 28 28)"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-black text-xl" style={{ color: overallColor }}>
                    {player.overall}
                  </span>
                </div>
                <p className="text-[10px] text-[#8b949e] mt-1 font-semibold tracking-wider">OVERALL</p>
              </div>

              {/* Form Indicator */}
              <div className="bg-[#0d1117] rounded-lg p-3 text-center border border-[#30363d]">
                <div className="flex items-center justify-center gap-2 h-[56px]">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: formColor }} />
                  <span className="font-black text-2xl" style={{ color: formColor }}>
                    {player.form > 0 ? player.form.toFixed(1) : '\u2014'}
                  </span>
                </div>
                <p className="text-[10px] text-[#8b949e] mt-1 font-semibold tracking-wider">FORM</p>
              </div>

              {/* Potential */}
              <div className="bg-[#0d1117] rounded-lg p-3 text-center border border-[#30363d]">
                <div className="flex items-center justify-center h-[56px]">
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-2xl text-[#8b949e]">{player.potential}</span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-400 mt-1 font-semibold tracking-wider">
                  +{player.potential - player.overall} POTENTIAL
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 2. ATTRIBUTE RADAR CHART ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Attribute Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex justify-center">
            <svg width="240" height="240" viewBox="0 0 240 240">
              {/* Grid rings */}
              {radarData.gridRings.map((points, i) => (
                <polygon
                  key={i}
                  points={points}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="0.5"
                />
              ))}

              {/* Axis lines */}
              {ANGLES.map((angle, i) => {
                const pt = polarToCartesian(120, 120, 95, angle);
                return (
                  <line
                    key={i}
                    x1="120" y1="120"
                    x2={pt.x} y2={pt.y}
                    stroke="#334155"
                    strokeWidth="0.5"
                  />
                );
              })}

              {/* Potential outline */}
              <motion.polygon
                points={radarData.potentialPoints}
                fill="none"
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="4 3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.8, duration: 0.2 }}
              />

              {/* Current attributes filled area */}
              <motion.polygon
                points={radarData.currentPoints}
                fill={`${overallColor}25`}
                stroke={overallColor}
                strokeWidth="2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.2, ease: 'easeOut' }}
                style={{ transformOrigin: '120px 120px' }}
              />

              {/* Vertex dots + labels */}
              {radarData.labels.map((lbl, i) => {
                const val = player.attributes[ATTR_KEYS[i]];
                const cat = getAttributeCategory(val);
                const isKey = positionKeyAttrs.has(ATTR_KEYS[i]);
                const dotR = isKey ? 5 : 3;
                const pt = polarToCartesian(120, 120, (val / 100) * 95, ANGLES[i]);
                return (
                  <g key={i}>
                    {/* Glow ring for position-key attributes */}
                    {isKey && (
                      <circle cx={pt.x} cy={pt.y} r="9" fill={`${overallColor}20`} />
                    )}
                    <motion.circle
                      cx={pt.x}
                      cy={pt.y}
                      fill={overallColor}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.2 }}
                    >
                      <animate attributeName="r" from="0" to={dotR} dur="0.2s" begin={`${0.6 + i * 0.08}s`} fill="freeze" />
                    </motion.circle>
                    <text
                      x={lbl.x}
                      y={lbl.y - 2}
                      textAnchor="middle"
                      fill={isKey ? overallColor : cat.color}
                      fontSize={isKey ? "11" : "10"}
                      fontWeight={isKey ? "900" : "bold"}
                    >
                      {lbl.value}
                    </text>
                    <text
                      x={lbl.x}
                      y={lbl.y + 10}
                      textAnchor="middle"
                      fill={isKey ? '#e2e8f0' : '#64748b'}
                      fontSize="8"
                      fontWeight={isKey ? "700" : "600"}
                    >
                      {lbl.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 3. DETAILED STATS GRID ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="space-y-3"
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
              <Dumbbell className="h-3.5 w-3.5" /> Player Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* Physical */}
            <div>
              <span className="text-[10px] text-[#484f58] font-semibold uppercase tracking-wider">Physical</span>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {[
                  { label: 'Pace', value: player.attributes.pace, Icon: Footprints },
                  { label: 'Fitness', value: player.fitness, Icon: Heart },
                  { label: 'Strength', value: player.attributes.physical, Icon: Dumbbell },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#21262d] rounded-lg p-2.5 text-center">
                    <stat.Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: getStatColor(stat.value) }} />
                    <p className="text-sm font-bold" style={{ color: getStatColor(stat.value) }}>{stat.value}</p>
                    <p className="text-[9px] text-[#8b949e]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical */}
            <div>
              <span className="text-[10px] text-[#484f58] font-semibold uppercase tracking-wider">Technical</span>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {[
                  { label: 'Shooting', value: player.attributes.shooting, Icon: Crosshair },
                  { label: 'Passing', value: player.attributes.passing, Icon: Target },
                  { label: 'Dribbling', value: player.attributes.dribbling, Icon: Zap },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#21262d] rounded-lg p-2.5 text-center">
                    <stat.Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: getStatColor(stat.value) }} />
                    <p className="text-sm font-bold" style={{ color: getStatColor(stat.value) }}>{stat.value}</p>
                    <p className="text-[9px] text-[#8b949e]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mental */}
            <div>
              <span className="text-[10px] text-[#484f58] font-semibold uppercase tracking-wider">Mental</span>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {[
                  { label: 'Vision', value: Math.round(player.attributes.passing * 0.6 + player.attributes.dribbling * 0.3 + player.overall * 0.1), Icon: Eye },
                  { label: 'Composure', value: Math.round(player.morale * 0.7 + Math.max(0, (100 - Math.abs(player.form - 7) * 10)) * 0.3), Icon: HeartPulse },
                  { label: 'Work Rate', value: Math.min(99, Math.round(player.form * 8 + player.morale * 0.15)), Icon: Timer },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#21262d] rounded-lg p-2.5 text-center">
                    <stat.Icon className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: getStatColor(stat.value) }} />
                    <p className="text-sm font-bold" style={{ color: getStatColor(stat.value) }}>{stat.value}</p>
                    <p className="text-[9px] text-[#8b949e]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== CAREER STATS ===== */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5" /> Career Stats
              {careerTrend === 'improving' && <TrendingUp className="h-3 w-3 text-emerald-400" />}
              {careerTrend === 'declining' && <TrendingDown className="h-3 w-3 text-red-400" />}
              {careerTrend === 'stable' && <Minus className="h-3 w-3 text-amber-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-[#c9d1d9]">{player.careerStats.totalAppearances}</p>
                <p className="text-[9px] text-[#8b949e]">Appearances</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-400">{player.careerStats.totalGoals}</p>
                <p className="text-[9px] text-[#8b949e]">Goals</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-blue-400">{player.careerStats.totalAssists}</p>
                <p className="text-[9px] text-[#8b949e]">Assists</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-cyan-400">{player.careerStats.totalCleanSheets}</p>
                <p className="text-[9px] text-[#8b949e]">Clean Sheets</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#0d1117] rounded-lg p-2 text-center border border-[#30363d]">
                <p className="text-sm font-bold text-amber-400">
                  {player.careerStats.totalAppearances > 0
                    ? (player.careerStats.totalGoals / player.careerStats.totalAppearances).toFixed(2)
                    : '—'}
                </p>
                <p className="text-[9px] text-[#8b949e]">Goals/Game</p>
              </div>
              <div className="bg-[#0d1117] rounded-lg p-2 text-center border border-[#30363d]">
                <p className="text-sm font-bold text-[#c9d1d9]">
                  {careerAvgRating > 0 ? careerAvgRating.toFixed(1) : '—'}
                </p>
                <p className="text-[9px] text-[#8b949e]">Avg Rating</p>
              </div>
              <div className="bg-[#0d1117] rounded-lg p-2 text-center border border-[#30363d]">
                <div className="flex items-center justify-center gap-1">
                  {careerTrend === 'improving' && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
                  {careerTrend === 'declining' && <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                  {careerTrend === 'stable' && <Minus className="h-3.5 w-3.5 text-amber-400" />}
                </div>
                <p className="text-[9px] text-[#8b949e]">
                  {careerTrend === 'improving' ? 'Rising' : careerTrend === 'declining' ? 'Falling' : 'Stable'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== PLAYER TRAITS ===== */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Player Traits
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {player.traits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {player.traits.map((traitId) => {
                  const trait = PLAYER_TRAITS.find(t => t.id === traitId);
                  if (!trait) return null;
                  const typeColor = trait.type === 'positive' ? '#22c55e' : trait.type === 'negative' ? '#ef4444' : '#94a3b8';
                  return (
                    <div
                      key={traitId}
                      className="flex items-center gap-1.5 bg-[#21262d] rounded-lg px-2.5 py-1.5 border border-[#30363d]"
                    >
                      <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: typeColor }} />
                      <span className="text-xs font-semibold text-[#c9d1d9]">{trait.name}</span>
                      <span className="text-[10px] text-[#8b949e]">— {trait.description}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-3">
                <Sparkles className="h-5 w-5 text-[#30363d] mx-auto mb-1" />
                <p className="text-xs text-[#484f58]">No traits yet — develop through training</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 4. SEASON PERFORMANCE SUMMARY ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.35 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" /> Season Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Form Indicator - Last 5 Matches */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#8b949e] ">Recent Form</span>
                <span className="text-[10px] text-[#484f58]">Last 5 matches</span>
              </div>
              <div className="flex items-center gap-1.5">
                {formIndicator.length > 0 ? formIndicator.map((result, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 300 }}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${
                      result === 'W' ? 'bg-emerald-600 text-white' :
                      result === 'D' ? 'bg-amber-600 text-white' :
                      'bg-red-600 text-white'
                    }`}
                  >
                    {result}
                  </motion.div>
                )) : (
                  <span className="text-xs text-[#484f58]">No matches yet</span>
                )}
              </div>
            </div>

            {/* Minutes played */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#8b949e]">Minutes Played</span>
                <span className="text-xs text-[#c9d1d9] font-semibold">
                  {player.seasonStats.minutesPlayed} min ({minutesPct}%)
                </span>
              </div>
              <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, minutesPct)}%` }}
                  transition={{ delay: 0.6, duration: 0.2 }}
                />
              </div>
            </div>

            {/* Season Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#21262d] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-emerald-400">{player.seasonStats.goals}</p>
                <p className="text-[9px] text-[#8b949e]">Goals</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-400">{player.seasonStats.assists}</p>
                <p className="text-[9px] text-[#8b949e]">Assists</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-amber-400">
                  {player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '—'}
                </p>
                <p className="text-[9px] text-[#8b949e]">Avg Rating</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-[#c9d1d9]">{player.seasonStats.appearances}</p>
                <p className="text-[9px] text-[#8b949e]">Apps</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-cyan-400">{player.seasonStats.cleanSheets}</p>
                <p className="text-[9px] text-[#8b949e]">Clean Sheets</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-rose-400">{player.seasonStats.yellowCards + player.seasonStats.redCards}</p>
                <p className="text-[9px] text-[#8b949e]">Cards</p>
              </div>
            </div>

            {/* Season Comparison Mini Radar */}
            {seasonComparison && (
              <div className="mt-4 pt-3 border-t border-[#30363d]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[#8b949e] ">This Season vs Last Season</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Current
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-[#8b949e]">
                      <span className="w-2 h-2 rounded-full bg-slate-500" /> Previous
                    </span>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ComparisonRadar
                    current={seasonComparison.current}
                    prev={seasonComparison.prev}
                    maxGoals={Math.max(seasonComparison.current.goals, seasonComparison.prev.goals, 10)}
                    maxAssists={Math.max(seasonComparison.current.assists, seasonComparison.prev.assists, 5)}
                    maxRating={10}
                    maxApps={gameState ? getSeasonMatchdays(gameState.currentClub.league) : 38}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 5. CAREER MILESTONES TIMELINE ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.45 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
              <Award className="h-3.5 w-3.5" /> Career Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="max-h-72 overflow-y-auto custom-scrollbar pr-1">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700" />

                {milestones.slice(0, 12).map((ms, i) => (
                  <motion.div
                    key={`${ms.label}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.2 }}
                    className="relative flex items-start gap-3 pb-4 last:pb-0"
                  >
                    {/* Timeline dot */}
                    <div className={`relative z-10 shrink-0 w-8 h-8 rounded-2xl flex items-center justify-center ${
                      ms.unlocked ? 'bg-[#21262d] border-2 border-emerald-500/50' : 'bg-[#21262d] border-2 border-[#30363d]'
                    }`}>
                      <span className={ms.unlocked ? 'text-emerald-400' : 'text-[#484f58]'}>
                        {ms.icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${ms.unlocked ? 'text-[#c9d1d9]' : 'text-[#484f58]'}`}>
                          {ms.label}
                        </span>
                        {ms.unlocked && ms.season > 0 && (
                          <Badge variant="outline" className="text-[8px] border-[#30363d] text-[#8b949e] px-1 py-0">
                            S{ms.season}
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${ms.unlocked ? 'text-[#8b949e]' : 'text-[#30363d]'}`}>
                        {ms.description}
                      </p>
                    </div>

                    {/* Lock icon for unachieved */}
                    {!ms.unlocked && (
                      <span className="text-[#30363d] text-xs shrink-0 pt-1">🔒</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 6. CONTRACT & FINANCIAL INFO ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.55 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Contract & Finance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-sm font-bold text-emerald-400">
                  {formatCurrency(player.contract.weeklyWage, 'K')}
                </p>
                <p className="text-[9px] text-[#8b949e]">Weekly Wage</p>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
                <p className="text-sm font-bold text-[#c9d1d9]">
                  {formatCurrency(player.marketValue, 'M')}
                </p>
                <p className="text-[9px] text-[#8b949e]">Market Value</p>
              </div>
            </div>

            {/* Contract Timeline */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#8b949e]">Contract: {player.contract.yearsRemaining} year{player.contract.yearsRemaining !== 1 ? 's' : ''} remaining</span>
                {player.contract.yearsRemaining <= 1 && (
                  <Badge className="text-[9px] font-bold border-0 bg-red-500/20 text-red-400">
                    Expiring Soon
                  </Badge>
                )}
              </div>
              <div className="relative h-3 bg-[#21262d] rounded-sm overflow-hidden">
                <motion.div
                  className="h-full rounded-sm bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (player.contract.yearsRemaining / 5) * 100)}%` }}
                  transition={{ delay: 0.6, duration: 0.2 }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-[#484f58]">Now</span>
                <span className="text-[9px] text-[#484f58]">+5 years</span>
              </div>
            </div>

            {/* Release clause */}
            {player.contract.releaseClause && player.contract.releaseClause > 0 && (
              <div className="mt-3 pt-3 border-t border-[#30363d] flex items-center justify-between">
                <span className="text-[10px] text-[#8b949e]">Release Clause</span>
                <span className="text-xs font-bold text-amber-400">{formatCurrency(player.contract.releaseClause, 'M')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== 7. MARKET VALUE HISTORY ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.55 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" /> Market Value
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Current Value + Trend */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-black text-emerald-400">
                {formatCurrency(player.marketValue, 'M')}
              </span>
              {marketHistory.length >= 2 && (() => {
                const prev = marketHistory[marketHistory.length - 2].value;
                const curr = marketHistory[marketHistory.length - 1].value;
                const diff = curr - prev;
                const pctChange = prev > 0 ? ((diff / prev) * 100).toFixed(1) : '0';
                if (diff > 0) {
                  return (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs font-bold">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />+{pctChange}%
                    </Badge>
                  );
                } else if (diff < 0) {
                  return (
                    <Badge className="bg-red-500/20 text-red-400 border-0 text-xs font-bold">
                      <ArrowDownRight className="h-3 w-3 mr-0.5" />{pctChange}%
                    </Badge>
                  );
                }
                return (
                  <Badge className="bg-slate-500/20 text-[#8b949e] border-0 text-xs font-bold">
                    <MinusCircle className="h-3 w-3 mr-0.5" />Stable
                  </Badge>
                );
              })()}
            </div>

            {/* Simple bar chart for market value history */}
            {marketHistory.length > 1 && (
              <div className="space-y-1.5">
                {marketHistory.map((pt, i) => {
                  const maxVal = Math.max(...marketHistory.map(p => p.value));
                  const barWidth = maxVal > 0 ? (pt.value / maxVal) * 100 : 0;
                  const isLast = i === marketHistory.length - 1;
                  return (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.2 }}
                    >
                      <span className="text-[9px] text-[#8b949e] w-8 text-right shrink-0">S{pt.season}</span>
                      <div className="flex-1 h-4 bg-[#21262d] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: isLast
                              ? '#059669'
                              : '#334155',
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: 0.7 + i * 0.08, duration: 0.2, ease: 'easeOut' }}
                        />
                      </div>
                      <span className={`text-[10px] font-semibold w-16 text-right shrink-0 ${isLast ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                        {formatCurrency(pt.value, 'M')}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Comparison to similar players (simulated) */}
            <div className="mt-4 pt-3 border-t border-[#30363d]">
              <span className="text-[10px] text-[#8b949e] ">Similar Players Market</span>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#8b949e]">Your Value</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(player.marketValue, 'M')}</span>
                  </div>
                  <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (player.marketValue / Math.max(player.marketValue * 1.5, 10)) * 100)}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#8b949e]">Position Average</span>
                    <span className="text-[#8b949e] font-bold">{formatCurrency(player.marketValue * 0.75, 'M')}</span>
                  </div>
                  <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div className="h-full bg-slate-600 rounded-full" style={{ width: `${Math.min(100, (player.marketValue * 0.75 / Math.max(player.marketValue * 1.5, 10)) * 100)}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#8b949e]">Top 10% {player.position}</span>
                    <span className="text-amber-400 font-bold">{formatCurrency(player.marketValue * 2.5, 'M')}</span>
                  </div>
                  <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: `${Math.min(100, (player.marketValue * 2.5 / Math.max(player.marketValue * 1.5, 10)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer spacer */}
      <div className="h-4" />
    </div>
  );
}

// -----------------------------------------------------------
// Comparison Radar (Season vs Season) Sub-component
// -----------------------------------------------------------
function ComparisonRadar({
  current,
  prev,
  maxGoals,
  maxAssists,
  maxRating,
  maxApps,
}: {
  current: { goals: number; assists: number; averageRating: number; appearances: number; cleanSheets: number };
  prev: { goals: number; assists: number; averageRating: number; appearances: number; cleanSheets: number };
  maxGoals: number;
  maxAssists: number;
  maxRating: number;
  maxApps: number;
}) {
  const metrics = [
    { label: 'Goals', curr: current.goals, prevVal: prev.goals, max: Math.max(maxGoals, 1) },
    { label: 'Assists', curr: current.assists, prevVal: prev.assists, max: Math.max(maxAssists, 1) },
    { label: 'Rating', curr: current.averageRating, prevVal: prev.averageRating, max: maxRating },
    { label: 'Apps', curr: current.appearances, prevVal: prev.appearances, max: maxApps },
    { label: 'ClnSht', curr: current.cleanSheets, prevVal: prev.cleanSheets, max: Math.max(current.cleanSheets + 5, prev.cleanSheets + 5, 10) },
  ];

  const cx = 100, cy = 100, r = 80;
  const angles = metrics.map((_, i) => -90 + (360 / metrics.length) * i);

  const currentValues = metrics.map(m => Math.min(100, (m.curr / m.max) * 100));
  const prevValues = metrics.map(m => Math.min(100, (m.prevVal / m.max) * 100));

  const currentPoints = currentValues.map((v, i) => {
    const pt = polarToCartesian(cx, cy, (v / 100) * r, angles[i]);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const prevPoints = prevValues.map((v, i) => {
    const pt = polarToCartesian(cx, cy, (v / 100) * r, angles[i]);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const labels = metrics.map((m, i) => {
    const pt = polarToCartesian(cx, cy, r + 16, angles[i]);
    return { x: pt.x, y: pt.y, label: m.label };
  });

  // Grid
  const gridRing = [50, 100].map(v => {
    return currentValues.map((_, i) => {
      const pt = polarToCartesian(cx, cy, (v / 100) * r, angles[i]);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  });

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      {/* Grid */}
      {gridRing.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#1e293b" strokeWidth="0.5" />
      ))}
      {angles.map((angle, i) => {
        const pt = polarToCartesian(cx, cy, r, angle);
        return <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#1e293b" strokeWidth="0.5" />;
      })}

      {/* Previous season */}
      <polygon points={prevPoints} fill="#64748b15" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />

      {/* Current season */}
      <polygon points={currentPoints} fill="#22c55e20" stroke="#22c55e" strokeWidth="1.5" />

      {/* Labels */}
      {labels.map((lbl, i) => (
        <text key={i} x={lbl.x} y={lbl.y + 4} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="600">
          {lbl.label}
        </text>
      ))}
    </svg>
  );
}
