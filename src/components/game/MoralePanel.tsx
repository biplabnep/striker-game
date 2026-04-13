'use client';

import { useMemo, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { PlayerMindset, MoraleFactor } from '@/lib/game/types';
import {
  Heart, Brain, Zap, Shield, TrendingUp, TrendingDown,
  Minus, Activity, Smile, Meh, Frown, Flame, Target,
  Sword, Scale, ShieldCheck, ArrowUp, ArrowDown,
  Bed, Users, Mic, AlertTriangle, Sparkles, Trophy,
  Ban, Clock, Star, Info,
} from 'lucide-react';

// ============================================================
// Mindset Configuration
// ============================================================

const MINDSET_CONFIG: Record<PlayerMindset, {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  effects: { label: string; value: string; positive: boolean }[];
}> = {
  aggressive: {
    label: 'Aggressive',
    description: 'Play with intensity and take risks. Higher ceiling, lower floor.',
    icon: <Sword className="h-5 w-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    effects: [
      { label: 'Goal Threat', value: '+15%', positive: true },
      { label: 'Rating Volatility', value: '+20%', positive: false },
      { label: 'Injury Risk', value: '+5%', positive: false },
      { label: 'Teammate Link-up', value: '-5%', positive: false },
    ],
  },
  balanced: {
    label: 'Balanced',
    description: 'Steady and reliable. Consistent performances, no extreme swings.',
    icon: <Scale className="h-5 w-5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    effects: [
      { label: 'Consistency', value: 'Standard', positive: true },
      { label: 'Rating Volatility', value: 'Normal', positive: true },
      { label: 'Team Play', value: 'Standard', positive: true },
      { label: 'Risk', value: 'None', positive: true },
    ],
  },
  conservative: {
    label: 'Conservative',
    description: 'Play it safe. Lower risk, more team contribution, steady ratings.',
    icon: <ShieldCheck className="h-5 w-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    effects: [
      { label: 'Team Play', value: '+10%', positive: true },
      { label: 'Rating Floor', value: '+0.3', positive: true },
      { label: 'Goal Threat', value: '-10%', positive: false },
      { label: 'Injury Risk', value: '-5%', positive: true },
    ],
  },
};

// ============================================================
// Morale Configuration
// ============================================================

const MORALE_THRESHOLDS = [
  { min: 80, max: 100, label: 'World-Class', color: '#fbbf24', strokeClass: 'text-amber-400', bgClass: 'bg-amber-400' },
  { min: 60, max: 79, label: 'Excellent', color: '#34d399', strokeClass: 'text-emerald-400', bgClass: 'bg-emerald-400' },
  { min: 30, max: 59, label: 'Moderate', color: '#fbbf24', strokeClass: 'text-amber-400', bgClass: 'bg-amber-400' },
  { min: 0, max: 29, label: 'Low', color: '#f87171', strokeClass: 'text-red-400', bgClass: 'bg-red-400' },
] as const;

function getMoraleLevel(morale: number): { label: string; icon: React.ReactNode; color: string } {
  if (morale >= 80) return { label: 'World-Class', icon: <Smile className="h-5 w-5" />, color: 'text-amber-400' };
  if (morale >= 60) return { label: 'Excellent', icon: <Smile className="h-5 w-5" />, color: 'text-emerald-400' };
  if (morale >= 30) return { label: 'Moderate', icon: <Meh className="h-5 w-5" />, color: 'text-amber-400' };
  return { label: 'Low', icon: <Frown className="h-5 w-5" />, color: 'text-red-400' };
}

function getMoraleGaugeColor(morale: number): string {
  if (morale >= 80) return '#fbbf24'; // gold
  if (morale >= 60) return '#34d399'; // emerald
  if (morale >= 30) return '#fbbf24'; // amber
  return '#f87171'; // red
}

function getMoraleBarColor(morale: number): string {
  if (morale >= 80) return 'bg-amber-500';
  if (morale >= 60) return 'bg-emerald-500';
  if (morale >= 30) return 'bg-amber-500';
  return 'bg-red-500';
}

function getFactorCategoryIcon(category: MoraleFactor['category']): React.ReactNode {
  switch (category) {
    case 'match': return <Target className="h-3.5 w-3.5" />;
    case 'personal': return <Heart className="h-3.5 w-3.5" />;
    case 'team': return <Shield className="h-3.5 w-3.5" />;
    case 'contract': return <Activity className="h-3.5 w-3.5" />;
    case 'social': return <Brain className="h-3.5 w-3.5" />;
  }
}

function getFactorCategoryLabel(category: MoraleFactor['category']): string {
  switch (category) {
    case 'match': return 'Match';
    case 'personal': return 'Personal';
    case 'team': return 'Team';
    case 'contract': return 'Contract';
    case 'social': return 'Social';
  }
}

// ============================================================
// Morale Actions Configuration
// ============================================================

interface MoraleAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  effect: string;
  cost: string;
  color: string;
  borderColor: string;
  disabled?: boolean;
  disabledReason?: string;
}

// ============================================================
// Computed Morale Factors (derived from game state)
// ============================================================

function computeMoraleFactors(gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>): MoraleFactor[] {
  const factors: MoraleFactor[] = [];
  const { player, currentClub, recentResults, currentWeek, currentSeason } = gameState;

  // Recent match results
  const last5 = recentResults.slice(0, 5);
  const wins = last5.filter(r => {
    const isHome = r.homeClub.id === currentClub.id;
    return isHome ? r.homeScore > r.awayScore : r.awayScore > r.homeScore;
  }).length;
  const losses = last5.filter(r => {
    const isHome = r.homeClub.id === currentClub.id;
    return isHome ? r.homeScore < r.awayScore : r.awayScore < r.homeScore;
  }).length;

  if (wins >= 3) {
    factors.push({ id: 'win_streak', label: 'Winning Run', impact: 15, category: 'match' });
  } else if (wins >= 2) {
    factors.push({ id: 'good_form', label: 'Good Recent Form', impact: 8, category: 'match' });
  }
  if (losses >= 3) {
    factors.push({ id: 'losing_streak', label: 'Losing Streak', impact: -20, category: 'match' });
  } else if (losses >= 2) {
    factors.push({ id: 'poor_form', label: 'Poor Recent Results', impact: -8, category: 'match' });
  }

  // Player personal performance
  const lastRating = last5[0]?.playerRating ?? 0;
  if (lastRating >= 8.0) {
    factors.push({ id: 'great_perf', label: 'Outstanding Performance', impact: 12, category: 'personal' });
  } else if (lastRating >= 7.0) {
    factors.push({ id: 'good_perf', label: 'Solid Performance', impact: 5, category: 'personal' });
  } else if (lastRating > 0 && lastRating < 5.5) {
    factors.push({ id: 'bad_perf', label: 'Poor Performance', impact: -10, category: 'personal' });
  }

  // Form
  if (player.form >= 8.0) {
    factors.push({ id: 'great_form', label: 'Excellent Form', impact: 10, category: 'personal' });
  } else if (player.form < 5.0) {
    factors.push({ id: 'bad_form', label: 'Struggling for Form', impact: -12, category: 'personal' });
  }

  // Injury
  if (player.injuryWeeks > 0) {
    factors.push({ id: 'injured', label: `Injured (${player.injuryWeeks}w out)`, impact: -15, category: 'personal' });
  }

  // Squad status
  if (player.squadStatus === 'starter') {
    factors.push({ id: 'starting', label: 'Starting XI', impact: 8, category: 'team' });
  } else if (player.squadStatus === 'bench') {
    factors.push({ id: 'benched', label: 'On the Bench', impact: -8, category: 'team' });
  } else if (player.squadStatus === 'prospect') {
    factors.push({ id: 'prospect', label: 'Academy Prospect', impact: -3, category: 'team' });
  }

  // Contract
  if (player.contract.yearsRemaining <= 1) {
    factors.push({ id: 'expiring', label: 'Contract Expiring Soon', impact: -5, category: 'contract' });
  }

  // Fitness
  if (player.fitness < 40) {
    factors.push({ id: 'low_fitness', label: 'Running on Empty', impact: -8, category: 'personal' });
  }

  // Reputation milestone
  if (player.reputation >= 80) {
    factors.push({ id: 'star_status', label: 'Star Status', impact: 5, category: 'social' });
  }

  return factors;
}

// ============================================================
// Generate synthetic morale history for sparkline
// ============================================================

function generateMoraleHistory(currentMorale: number): number[] {
  const history: number[] = [];
  let val = currentMorale - 15 + Math.random() * 10;
  for (let i = 0; i < 9; i++) {
    val = Math.max(5, Math.min(95, val + (Math.random() - 0.45) * 12));
    history.push(Math.round(val));
  }
  history.push(currentMorale);
  return history;
}

// ============================================================
// SVG Arc Gauge Component
// ============================================================

function MoraleGauge({ morale }: { morale: number }) {
  const radius = 70;
  const strokeWidth = 10;
  const cx = 90;
  const cy = 90;
  const startAngle = 135;
  const endAngle = 405;
  const totalArc = endAngle - startAngle;
  const filledArc = (morale / 100) * totalArc;

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  const startPt = polarToCartesian(startAngle);
  const endPt = polarToCartesian(endAngle);
  const filledEndPt = polarToCartesian(startAngle + filledArc);

  const bgPath = `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 1 1 ${endPt.x} ${endPt.y}`;
  const fgPath = morale > 0
    ? `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${filledArc > 180 ? 1 : 0} 1 ${filledEndPt.x} ${filledEndPt.y}`
    : '';

  const gaugeColor = getMoraleGaugeColor(morale);
  const level = getMoraleLevel(morale);

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="block">
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="#21262d"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc - animated via framer-motion */}
        <motion.path
          d={fgPath}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        {/* Center text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[#c9d1d9]"
          fontSize="28"
          fontWeight="bold"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {morale}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[#8b949e]"
          fontSize="11"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          MORALE
        </text>
      </svg>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={level.color}>{level.icon}</span>
        <span className={`text-sm font-semibold ${level.color}`}>{level.label}</span>
      </div>
    </div>
  );
}

// ============================================================
// Morale History Sparkline Component
// ============================================================

function MoraleSparkline({ history }: { history: number[] }) {
  const width = 280;
  const height = 60;
  const padding = { top: 6, right: 6, bottom: 6, left: 6 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minVal = 0;
  const maxVal = 100;

  const points = history.map((val, i) => ({
    x: padding.left + (i / (history.length - 1)) * chartW,
    y: padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const lastVal = history[history.length - 1];
  const dotColor = getMoraleGaugeColor(lastVal);

  // Area fill
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block w-full">
      {/* Grid lines */}
      {[25, 50, 75].map(v => {
        const y = padding.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
        return (
          <line
            key={v}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="#21262d"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}
      {/* Area fill */}
      <motion.path
        d={areaPath}
        fill={dotColor}
        fillOpacity={0.08}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      {/* Line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={dotColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
      {/* Dots */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 3.5 : 2}
          fill={i === points.length - 1 ? dotColor : '#30363d'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: 0.35 + i * 0.04 }}
        />
      ))}
      {/* Current value label */}
      <text
        x={points[points.length - 1].x}
        y={points[points.length - 1].y - 10}
        textAnchor="middle"
        className="fill-[#c9d1d9]"
        fontSize="9"
        fontWeight="600"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {lastVal}
      </text>
      {/* X-axis labels */}
      <text x={points[0].x} y={height - 0} textAnchor="middle" className="fill-[#484f58]" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">-10w</text>
      <text x={points[points.length - 1].x} y={height - 0} textAnchor="middle" className="fill-[#484f58]" fontSize="8" fontFamily="ui-sans-serif, system-ui, sans-serif">Now</text>
    </svg>
  );
}

// ============================================================
// Status Effects Component
// ============================================================

function StatusEffects({ morale }: { morale: number }) {
  const effects: { label: string; description: string; icon: React.ReactNode; active: boolean; color: string; borderColor: string }[] = [
    {
      label: 'Confidence Boost',
      description: '+1 to match rating',
      icon: <Sparkles className="h-4 w-4" />,
      active: morale > 80,
      color: morale > 80 ? 'text-amber-400' : 'text-[#484f58]',
      borderColor: morale > 80 ? 'border-amber-500/30' : 'border-[#21262d]',
    },
    {
      label: 'Lack of Confidence',
      description: '-1 to match rating',
      icon: <AlertTriangle className="h-4 w-4" />,
      active: morale <= 30 && morale > 0,
      color: morale <= 30 && morale > 0 ? 'text-red-400' : 'text-[#484f58]',
      borderColor: morale <= 30 && morale > 0 ? 'border-red-500/30' : 'border-[#21262d]',
    },
    {
      label: 'Depression Risk',
      description: 'Training effectiveness reduced',
      icon: <Ban className="h-4 w-4" />,
      active: morale <= 15,
      color: morale <= 15 ? 'text-red-500' : 'text-[#484f58]',
      borderColor: morale <= 15 ? 'border-red-500/40' : 'border-[#21262d]',
    },
  ];

  return (
    <div className="space-y-2">
      {effects.map((effect, i) => (
        <motion.div
          key={effect.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 + i * 0.05 }}
          className={`flex items-center gap-3 p-2.5 rounded-lg border ${effect.borderColor} ${effect.active ? 'bg-[#21262d]' : 'bg-[#0d1117]/50'}`}
        >
          <span className={effect.color}>{effect.icon}</span>
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-medium ${effect.color}`}>{effect.label}</div>
            <div className="text-[10px] text-[#484f58]">{effect.description}</div>
          </div>
          <Badge className={`${effect.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#21262d] text-[#484f58]'} border-0 text-[9px] shrink-0`}>
            {effect.active ? 'Active' : 'Inactive'}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function MoralePanel() {
  const gameState = useGameStore(s => s.gameState);
  const setMindset = useGameStore(s => s.setMindset);
  const [actionsUsed, setActionsUsed] = useState<Record<string, number>>({});

  const moraleFactors = useMemo(() => {
    if (!gameState) return [];
    return computeMoraleFactors(gameState);
  }, [gameState]);

  const moraleHistory = useMemo(() => {
    if (!gameState) return [];
    return generateMoraleHistory(gameState.player.morale);
  }, [gameState]);

  const player = gameState?.player;
  const currentClub = gameState?.currentClub;
  const mindset = gameState?.mindset ?? 'balanced';
  const playerFitness = player?.fitness ?? 100;

  const totalImpact = useMemo(
    () => moraleFactors.reduce((sum, f) => sum + f.impact, 0),
    [moraleFactors]
  );

  const sortedFactors = useMemo(
    () => [...moraleFactors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
    [moraleFactors]
  );

  const handleAction = useCallback((action: MoraleAction) => {
    if (action.disabled) return;
    setActionsUsed(prev => ({ ...prev, [action.id]: (prev[action.id] ?? 0) + 1 }));
  }, []);

  // Morale actions
  const moraleActions: MoraleAction[] = useMemo(() => [
    {
      id: 'rest',
      label: 'Rest Day',
      description: 'Take a personal day to recharge mentally',
      icon: <Bed className="h-4 w-4" />,
      effect: '+3 Morale',
      cost: '-5 Fitness',
      color: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      disabled: playerFitness < 15,
      disabledReason: playerFitness < 15 ? 'Fitness too low' : undefined,
    },
    {
      id: 'bonding',
      label: 'Team Bonding',
      description: 'Organise a team activity to build chemistry',
      icon: <Users className="h-4 w-4" />,
      effect: '+2 Morale',
      cost: 'Once per week',
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      disabled: (actionsUsed['bonding'] ?? 0) > 0,
      disabledReason: 'Already used this week',
    },
    {
      id: 'media',
      label: 'Media Appearance',
      description: 'Give an interview to boost your public profile',
      icon: <Mic className="h-4 w-4" />,
      effect: '+2 Reputation',
      cost: 'Risk: morale -5 on bad answer',
      color: 'text-purple-400',
      borderColor: 'border-purple-500/30',
    },
  ], [playerFitness, actionsUsed]);

  if (!gameState) return null;

  const moraleLevel = getMoraleLevel(player.morale);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-20 space-y-4">
      {/* ── Section 1: Header + Morale Gauge ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center">
            <Heart className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#c9d1d9]">Morale & Mindset</h1>
            <p className="text-xs text-[#8b949e]">{currentClub.name} &bull; Season {gameState.currentSeason}</p>
          </div>
          <Badge className={`${moraleLevel.color} bg-[#21262d] border-0 text-[10px]`}>
            {moraleLevel.label}
          </Badge>
        </div>

        {/* Circular Arc Gauge */}
        <div className="flex justify-center py-2">
          <MoraleGauge morale={player.morale} />
        </div>

        {/* Linear bar (compact) */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#8b949e]">Morale Level</span>
            <span className="text-sm font-bold text-[#c9d1d9]">{player.morale}%</span>
          </div>
          <div className="h-2.5 bg-[#21262d] rounded-md overflow-hidden">
            <motion.div
              className={`h-full rounded-md ${getMoraleBarColor(player.morale)}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{ width: `${player.morale}%` }}
            />
          </div>
        </div>

        {/* Net Impact Indicator */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-[#8b949e]">Net morale influence this week</span>
          <div className={`flex items-center gap-1 text-xs font-medium ${
            totalImpact > 0 ? 'text-emerald-400' : totalImpact < 0 ? 'text-red-400' : 'text-[#8b949e]'
          }`}>
            {totalImpact > 0 ? <ArrowUp className="h-3 w-3" /> : totalImpact < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {totalImpact > 0 ? '+' : ''}{totalImpact}
          </div>
        </div>
      </motion.div>

      {/* ── Section 2: Status Effects ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#8b949e]" />
          Status Effects
        </h2>
        <StatusEffects morale={player.morale} />
      </motion.div>

      {/* ── Section 3: Morale History Sparkline ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#8b949e]" />
          Morale Trend
          <span className="text-[10px] text-[#484f58] font-normal ml-auto">Last 10 weeks</span>
        </h2>
        <MoraleSparkline history={moraleHistory} />
        <div className="flex items-center justify-between mt-2 text-[10px] text-[#484f58]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-red-400" /> Low</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-amber-400" /> Moderate</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-400" /> High</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-amber-400" /> Elite</span>
          </div>
        </div>
      </motion.div>

      {/* ── Section 4: Morale Factors Breakdown (sorted) ── */}
      {sortedFactors.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        >
          <h2 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-[#8b949e]" />
            Morale Factors
            <span className="text-[10px] text-[#484f58] font-normal ml-auto">Sorted by impact</span>
          </h2>
          <div className="space-y-2">
            {sortedFactors.map((factor, i) => {
              const isPositive = factor.impact > 0;
              return (
                <motion.div
                  key={factor.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18 + i * 0.04 }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${
                    isPositive
                      ? 'bg-emerald-500/5 border-emerald-500/10'
                      : 'bg-red-500/5 border-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                      {getFactorCategoryIcon(factor.category)}
                    </span>
                    <span className="text-xs text-[#c9d1d9] truncate">{factor.label}</span>
                    <Badge className="bg-[#21262d] text-[#8b949e] border-0 text-[9px] shrink-0">
                      {getFactorCategoryLabel(factor.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isPositive ? (
                      <ArrowUp className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-400" />
                    )}
                    <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{factor.impact}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Section 5: Morale Actions ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-[#8b949e]" />
          Boost Morale
        </h2>
        <div className="space-y-2">
          {moraleActions.map((action, i) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.23 + i * 0.05 }}
            >
              <button
                onClick={() => handleAction(action)}
                disabled={action.disabled}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  action.disabled
                    ? 'bg-[#0d1117]/50 border-[#21262d] opacity-50 cursor-not-allowed'
                    : `bg-[#21262d] ${action.borderColor} hover:bg-[#2d333b]`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${action.disabled ? 'bg-[#161b22]' : 'bg-[#0d1117]'} flex items-center justify-center ${action.color}`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${action.disabled ? 'text-[#484f58]' : 'text-[#c9d1d9]'}`}>
                        {action.label}
                      </span>
                      {action.disabled && action.disabledReason && (
                        <Badge className="bg-[#21262d] text-[#484f58] border-0 text-[9px]">
                          {action.disabledReason}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">{action.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#30363d]/50">
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <Star className="h-3 w-3" /> {action.effect}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
                    <Clock className="h-3 w-3" /> {action.cost}
                  </span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Section 6: Mindset Selection ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#8b949e]" />
          Match Mindset
        </h2>
        <p className="text-xs text-[#8b949e] mb-3">
          Choose your approach for upcoming matches. This affects your performance style.
        </p>

        <div className="space-y-2">
          {(Object.keys(MINDSET_CONFIG) as PlayerMindset[]).map((m) => {
            const config = MINDSET_CONFIG[m];
            const isSelected = mindset === m;
            return (
              <button
                key={m}
                onClick={() => setMindset(m)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? `${config.bgColor} ${config.borderColor}`
                    : 'bg-[#21262d] border-[#30363d] hover:bg-[#2d333b]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${isSelected ? config.bgColor : 'bg-[#0d1117]'} flex items-center justify-center ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isSelected ? config.color : 'text-[#c9d1d9]'}`}>
                        {config.label}
                      </span>
                      {isSelected && (
                        <Badge className={`${config.bgColor} ${config.color} border-0 text-[10px]`}>
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">{config.description}</p>
                  </div>
                </div>

                {/* Effects */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="mt-2 pt-2 border-t border-[#30363d]/50"
                  >
                    <div className="grid grid-cols-2 gap-1.5">
                      {config.effects.map((effect, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8b949e]">{effect.label}</span>
                          <span className={effect.positive ? 'text-emerald-400' : 'text-red-400'}>
                            {effect.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Section 7: How Morale Works ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#8b949e]" />
          How Morale Works
        </h3>
        <div className="space-y-2 text-xs text-[#8b949e]">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">+</span>
            <span>Win matches and perform well to boost morale</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 mt-0.5">+</span>
            <span>Starting XI role and good form lift your spirits</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400 mt-0.5">-</span>
            <span>Losses, injuries, and bench roles decrease morale</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">*</span>
            <span>Low morale affects match rating (-0.5 at &lt;30)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">*</span>
            <span>High morale boosts match rating (+0.3 at &gt;80)</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
