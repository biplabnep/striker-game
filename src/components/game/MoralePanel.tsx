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
  Ban, Clock, Star, Info, Gift, Coffee, Skull,
  ThumbsUp, ThumbsDown, Eye, Timer, Crown,
  Flag, UserCheck, MessageCircle, FileText, Lightbulb,
  CircleDot, CheckCircle2, XCircle,
} from 'lucide-react';

// ============================================================
// Mindset Configuration (enhanced with effect descriptions)
// ============================================================

const MINDSET_CONFIG: Record<PlayerMindset, {
  label: string;
  description: string;
  effectDescription: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  borderLeftColor: string;
  effects: { label: string; value: string; positive: boolean }[];
}> = {
  aggressive: {
    label: 'Aggressive',
    description: 'Play with intensity and take risks. Higher ceiling, lower floor.',
    effectDescription: 'Higher risk/reward, more cards, more goals',
    icon: <Sword className="h-5 w-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    borderLeftColor: 'border-l-red-500',
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
    effectDescription: 'Consistent output, no extreme ups or downs',
    icon: <Scale className="h-5 w-5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    borderLeftColor: 'border-l-emerald-500',
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
    effectDescription: 'Safe play, better team integration, steady floor',
    icon: <ShieldCheck className="h-5 w-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    borderLeftColor: 'border-l-blue-500',
    effects: [
      { label: 'Team Play', value: '+10%', positive: true },
      { label: 'Rating Floor', value: '+0.3', positive: true },
      { label: 'Goal Threat', value: '-10%', positive: false },
      { label: 'Injury Risk', value: '-5%', positive: true },
    ],
  },
};

// ============================================================
// Enhanced 7-Tier Morale Level System
// ============================================================

function getMoraleLevel(morale: number): {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  message: string;
  tier: number;
} {
  if (morale >= 90) return { label: 'World-Class', icon: <Crown className="h-5 w-5" />, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/25', message: 'You\'re on fire! Peak confidence — ride this wave and chase greatness.', tier: 7 };
  if (morale >= 80) return { label: 'Excellent', icon: <Smile className="h-5 w-5" />, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/25', message: 'You\'re feeling great! High morale boosts your match performance.', tier: 6 };
  if (morale >= 65) return { label: 'Good', icon: <ThumbsUp className="h-5 w-5" />, color: 'text-emerald-300', bgColor: 'bg-emerald-500/5', borderColor: 'border-emerald-500/15', message: 'Solid morale. Keep performing well to maintain this level.', tier: 5 };
  if (morale >= 50) return { label: 'Average', icon: <Meh className="h-5 w-5" />, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/25', message: 'Steady mindset. Consistent performances will push you into green.', tier: 4 };
  if (morale >= 30) return { label: 'Low', icon: <ThumbsDown className="h-5 w-5" />, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/25', message: 'Morale is dropping. Consider training recovery or team activities.', tier: 3 };
  if (morale >= 15) return { label: 'Poor', icon: <Frown className="h-5 w-5" />, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/25', message: 'Morale is low. Consider rest or team bonding to recover.', tier: 2 };
  return { label: 'Terrible', icon: <Skull className="h-5 w-5" />, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/25', message: 'Morale is critical. Take urgent action — rest, talk to your agent.', tier: 1 };
}

function getMoraleGaugeColor(morale: number): string {
  if (morale >= 70) return '#34d399'; // emerald
  if (morale >= 50) return '#facc15'; // yellow
  if (morale >= 30) return '#fbbf24'; // amber
  return '#f87171'; // red
}

function getMoraleGaugeTrackSegmentColor(segmentIndex: number): string {
  // 4 segments: 0-25 (red), 25-50 (amber), 50-75 (yellow), 75-100 (emerald)
  switch (segmentIndex) {
    case 0: return '#f87171';
    case 1: return '#fbbf24';
    case 2: return '#facc15';
    case 3: return '#34d399';
    default: return '#30363d';
  }
}

function getMoraleBarColor(morale: number): string {
  if (morale >= 70) return 'bg-emerald-500';
  if (morale >= 50) return 'bg-yellow-500';
  if (morale >= 30) return 'bg-amber-500';
  return 'bg-red-500';
}

function getFactorCategoryConfig(category: MoraleFactor['category']): {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
} {
  switch (category) {
    case 'match': return { icon: <Target className="h-3.5 w-3.5" />, label: 'Match', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    case 'personal': return { icon: <Heart className="h-3.5 w-3.5" />, label: 'Personal', color: 'text-pink-400', bg: 'bg-pink-500/10' };
    case 'team': return { icon: <Shield className="h-3.5 w-3.5" />, label: 'Team', color: 'text-sky-400', bg: 'bg-sky-500/10' };
    case 'contract': return { icon: <FileText className="h-3.5 w-3.5" />, label: 'Contract', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    case 'social': return { icon: <Brain className="h-3.5 w-3.5" />, label: 'Social', color: 'text-purple-400', bg: 'bg-purple-500/10' };
  }
}

// ============================================================
// Morale Tips Generator
// ============================================================

function getMoraleTips(morale: number): { icon: React.ReactNode; text: string; priority: 'high' | 'medium' | 'low' }[] {
  if (morale >= 80) {
    return [
      { icon: <Zap className="h-3.5 w-3.5 text-amber-400" />, text: 'Great momentum! Push for a starting XI spot this week.', priority: 'high' },
      { icon: <Trophy className="h-3.5 w-3.5 text-emerald-400" />, text: 'High morale gives a match rating boost — make it count!', priority: 'high' },
      { icon: <Star className="h-3.5 w-3.5 text-yellow-400" />, text: 'Your form attracts scouts. Maintain performances for transfer interest.', priority: 'medium' },
    ];
  }
  if (morale >= 50) {
    return [
      { icon: <Scale className="h-3.5 w-3.5 text-yellow-400" />, text: 'Maintain consistency with regular training sessions.', priority: 'high' },
      { icon: <Users className="h-3.5 w-3.5 text-sky-400" />, text: 'Team bonding activities can give you a small boost.', priority: 'medium' },
      { icon: <Target className="h-3.5 w-3.5 text-emerald-400" />, text: 'A strong next performance can push you into the green zone.', priority: 'medium' },
    ];
  }
  if (morale >= 30) {
    return [
      { icon: <Bed className="h-3.5 w-3.5 text-blue-400" />, text: 'Consider a rest day to recharge mentally before the next match.', priority: 'high' },
      { icon: <MessageCircle className="h-3.5 w-3.5 text-purple-400" />, text: 'Talk to your agent — they might have advice to lift your spirits.', priority: 'medium' },
      { icon: <Coffee className="h-3.5 w-3.5 text-sky-400" />, text: 'Grab coffee with a teammate to build relationships and morale.', priority: 'medium' },
      { icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />, text: 'Avoid aggressive mindset — your confidence can\'t support risk-taking right now.', priority: 'low' },
    ];
  }
  return [
    { icon: <Skull className="h-3.5 w-3.5 text-red-400" />, text: 'Morale is critical! Take a rest day immediately.', priority: 'high' },
    { icon: <UserCheck className="h-3.5 w-3.5 text-emerald-400" />, text: 'Hire a personal trainer for a focused morale recovery session.', priority: 'high' },
    { icon: <Mic className="h-3.5 w-3.5 text-purple-400" />, text: 'A media appearance could boost reputation and confidence.', priority: 'medium' },
    { icon: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />, text: 'Match ratings are penalised at this level. Avoid playing if possible.', priority: 'high' },
  ];
}

// ============================================================
// Dressing Room Atmosphere Config
// ============================================================

function getAtmosphereConfig(atmosphere: string): {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
} {
  switch (atmosphere) {
    case 'excellent': return { label: 'Excellent', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> };
    case 'positive': return { label: 'Positive', color: 'text-green-400', bgColor: 'bg-green-500/15', icon: <ThumbsUp className="h-3.5 w-3.5 text-green-400" /> };
    case 'neutral': return { label: 'Neutral', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', icon: <Minus className="h-3.5 w-3.5 text-yellow-400" /> };
    case 'tense': return { label: 'Tense', color: 'text-orange-400', bgColor: 'bg-orange-500/10', icon: <AlertTriangle className="h-3.5 w-3.5 text-orange-400" /> };
    case 'toxic': return { label: 'Toxic', color: 'text-red-400', bgColor: 'bg-red-500/15', icon: <XCircle className="h-3.5 w-3.5 text-red-400" /> };
    default: return { label: 'Unknown', color: 'text-[#8b949e]', bgColor: 'bg-[#21262d]', icon: <Minus className="h-3.5 w-3.5 text-[#8b949e]" /> };
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
    factors.push({ id: 'expiring', label: 'Contract Expiring Soon', impact: -5, category: 'contract', expiresWeek: currentWeek + (38 - currentWeek) });
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
// Generate synthetic morale history for bar chart (5 checkpoints)
// ============================================================

function generateMoraleCheckpoints(currentMorale: number): { week: string; value: number }[] {
  const checkpoints: { week: string; value: number }[] = [];
  let val = currentMorale - 18 + Math.random() * 12;
  const labels = ['W-5', 'W-4', 'W-3', 'W-2', 'Now'];
  for (let i = 0; i < 4; i++) {
    val = Math.max(5, Math.min(95, val + (Math.random() - 0.45) * 14));
    checkpoints.push({ week: labels[i], value: Math.round(val) });
  }
  checkpoints.push({ week: labels[4], value: currentMorale });
  return checkpoints;
}

// ============================================================
// Enhanced SVG Semircular Gauge Component
// ============================================================

function MoraleGauge({ morale }: { morale: number }) {
  const radius = 80;
  const strokeWidth = 14;
  const cx = 100;
  const cy = 100;
  const startAngle = 135;
  const endAngle = 405;
  const totalArc = endAngle - startAngle;
  const segmentCount = 4;

  function polarToCartesian(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  const gaugeColor = getMoraleGaugeColor(morale);
  const level = getMoraleLevel(morale);

  // Build colored track segments (4 zones)
  const trackSegments: { d: string; color: string }[] = [];
  for (let i = 0; i < segmentCount; i++) {
    const segStartAngle = startAngle + (i / segmentCount) * totalArc;
    const segEndAngle = startAngle + ((i + 1) / segmentCount) * totalArc;
    const segStart = polarToCartesian(segStartAngle);
    const segEnd = polarToCartesian(segEndAngle);
    const segArc = segEndAngle - segStartAngle;
    trackSegments.push({
      d: `M ${segStart.x} ${segStart.y} A ${radius} ${radius} 0 1 1 ${segEnd.x} ${segEnd.y}`,
      color: getMoraleGaugeTrackSegmentColor(i),
    });
  }

  // Filled arc for current morale
  const filledArc = (morale / 100) * totalArc;
  const filledEndAngle = startAngle + filledArc;
  const startPt = polarToCartesian(startAngle);
  const filledEndPt = polarToCartesian(filledEndAngle);
  const fgPath = morale > 0
    ? `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${filledArc > 180 ? 1 : 0} 1 ${filledEndPt.x} ${filledEndPt.y}`
    : '';

  // Determine which segment the morale falls in for the glow
  const activeSegment = Math.min(3, Math.floor((morale / 100) * segmentCount));
  const segmentColor = getMoraleGaugeTrackSegmentColor(activeSegment);

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="130" viewBox="0 0 200 130" className="block">
        {/* Colored track segments (background) */}
        {trackSegments.map((seg, i) => (
          <path
            key={i}
            d={seg.d}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.2}
          />
        ))}
        {/* Active segment glow */}
        <motion.path
          d={trackSegments[activeSegment].d}
          fill="none"
          stroke={segmentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        />
        {/* Filled arc */}
        {morale > 0 && (
          <motion.path
            d={fgPath}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        )}
        {/* Zone boundary tick marks at 30, 50, 70 */}
        {[30, 50, 70].map(zone => {
          const zoneAngle = startAngle + (zone / 100) * totalArc;
          const innerR = radius + strokeWidth / 2 + 2;
          const outerR = radius + strokeWidth / 2 + 7;
          const rad = (zoneAngle * Math.PI) / 180;
          return (
            <line
              key={zone}
              x1={cx + innerR * Math.cos(rad)}
              y1={cy + innerR * Math.sin(rad)}
              x2={cx + outerR * Math.cos(rad)}
              y2={cy + outerR * Math.sin(rad)}
              stroke="#484f58"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
          );
        })}
        {/* Zone labels on the arc */}
        {[0, 30, 50, 70, 100].map(zone => {
          const labelAngle = startAngle + (zone / 100) * totalArc;
          const labelR = radius + strokeWidth / 2 + 16;
          const rad = (labelAngle * Math.PI) / 180;
          return (
            <text
              key={zone}
              x={cx + labelR * Math.cos(rad)}
              y={cy + labelR * Math.sin(rad)}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-[#484f58]"
              fontSize="9"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {zone}
            </text>
          );
        })}
        {/* Center morale number */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[#c9d1d9]"
          fontSize="36"
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
          fontSize="10"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          letterSpacing="2"
        >
          MORALE
        </text>
        {/* SVG filter for glow */}
        <defs>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      {/* Level label below gauge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-1.5 mt-1"
      >
        <span className={level.color}>{level.icon}</span>
        <span className={`text-sm font-bold ${level.color}`}>{level.label}</span>
      </motion.div>
    </div>
  );
}

// ============================================================
// Morale History Bar Chart Component (5 checkpoints)
// ============================================================

function MoraleBarChart({ checkpoints }: { checkpoints: { week: string; value: number }[] }) {
  const chartHeight = 100;
  const barWidth = 36;
  const gap = 12;
  const totalWidth = checkpoints.length * barWidth + (checkpoints.length - 1) * gap;
  const padding = 8;

  return (
    <div className="flex justify-center overflow-x-auto">
      <svg
        width={totalWidth + padding * 2}
        height={chartHeight + 30}
        viewBox={`0 0 ${totalWidth + padding * 2} ${chartHeight + 30}`}
        className="block"
      >
        {/* Zone background bands */}
        <rect x={padding} y={0} width={totalWidth} height={chartHeight * 0.30} fill="#34d399" opacity="0.04" />
        <rect x={padding} y={chartHeight * 0.30} width={totalWidth} height={chartHeight * 0.20} fill="#facc15" opacity="0.04" />
        <rect x={padding} y={chartHeight * 0.50} width={totalWidth} height={chartHeight * 0.20} fill="#fbbf24" opacity="0.04" />
        <rect x={padding} y={chartHeight * 0.70} width={totalWidth} height={chartHeight * 0.30} fill="#f87171" opacity="0.04" />

        {/* Grid lines */}
        {[30, 50, 70].map(v => {
          const y = chartHeight - (v / 100) * chartHeight;
          return (
            <line
              key={v}
              x1={padding}
              y1={y}
              x2={padding + totalWidth}
              y2={y}
              stroke="#21262d"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Bars */}
        {checkpoints.map((cp, i) => {
          const barH = Math.max(2, (cp.value / 100) * chartHeight);
          const x = padding + i * (barWidth + gap);
          const y = chartHeight - barH;
          const color = getMoraleGaugeColor(cp.value);
          const isLast = i === checkpoints.length - 1;

          return (
            <g key={i}>
              <motion.rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={color}
                opacity={isLast ? 0.9 : 0.55}
                initial={{ opacity: 0 }}
                animate={{ opacity: isLast ? 0.9 : 0.55 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
              />
              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="fill-[#c9d1d9]"
                fontSize="10"
                fontWeight="600"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                opacity={isLast ? 1 : 0.6}
              >
                {cp.value}
              </text>
              {/* Week label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 16}
                textAnchor="middle"
                className={isLast ? 'fill-[#c9d1d9]' : 'fill-[#484f58]'}
                fontSize="9"
                fontWeight={isLast ? '700' : '400'}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {cp.week}
              </text>
              {/* Current indicator */}
              {isLast && (
                <motion.circle
                  cx={x + barWidth / 2}
                  cy={chartHeight + 24}
                  r={2}
                  fill={color}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
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
// Progress Bar Sub-component
// ============================================================

function ProgressBar({ value, max = 100, colorClass, label, showValue = true }: {
  value: number;
  max?: number;
  colorClass: string;
  label: string;
  showValue?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b949e]">{label}</span>
        {showValue && (
          <span className="text-xs font-semibold text-[#c9d1d9]">{value}</span>
        )}
      </div>
      <div className="h-2 bg-[#21262d] rounded-md overflow-hidden">
        <motion.div
          className={`h-full rounded-md ${colorClass}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Team Dynamics Card Component
// ============================================================

function TeamDynamicsCard({ dynamics, currentWeek }: { dynamics: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>['teamDynamics']; currentWeek: number }) {
  if (!dynamics) return null;

  const atmosphere = getAtmosphereConfig(dynamics.dressingRoomAtmosphere);

  return (
    <div className="space-y-3">
      {/* Dressing Room Atmosphere Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b949e]">Dressing Room</span>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${atmosphere.bgColor}`}>
          {atmosphere.icon}
          <span className={`text-xs font-semibold ${atmosphere.color}`}>{atmosphere.label}</span>
        </div>
      </div>

      {/* Team Morale */}
      <ProgressBar
        value={dynamics.morale}
        colorClass={dynamics.morale >= 70 ? 'bg-emerald-500' : dynamics.morale >= 50 ? 'bg-yellow-500' : dynamics.morale >= 30 ? 'bg-amber-500' : 'bg-red-500'}
        label="Team Morale"
      />

      {/* Cohesion */}
      <ProgressBar
        value={dynamics.cohesion}
        colorClass={dynamics.cohesion >= 70 ? 'bg-emerald-500' : dynamics.cohesion >= 50 ? 'bg-yellow-500' : dynamics.cohesion >= 30 ? 'bg-amber-500' : 'bg-red-500'}
        label="Team Cohesion"
      />

      {/* Player Influence */}
      <ProgressBar
        value={dynamics.playerInfluence}
        colorClass={dynamics.playerInfluence >= 70 ? 'bg-emerald-500' : dynamics.playerInfluence >= 50 ? 'bg-yellow-500' : dynamics.playerInfluence >= 30 ? 'bg-amber-500' : 'bg-red-500'}
        label="Your Influence"
      />

      {/* Captain Rating */}
      <ProgressBar
        value={dynamics.captainRating}
        colorClass={dynamics.captainRating >= 70 ? 'bg-emerald-500' : dynamics.captainRating >= 50 ? 'bg-yellow-500' : dynamics.captainRating >= 30 ? 'bg-amber-500' : 'bg-red-500'}
        label="Leadership Rating"
      />
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

  const moraleCheckpoints = useMemo(() => {
    if (!gameState) return [];
    return generateMoraleCheckpoints(gameState.player.morale);
  }, [gameState]);

  const player = gameState?.player;
  const currentClub = gameState?.currentClub;
  const mindset = gameState?.mindset ?? 'balanced';
  const playerFitness = player?.fitness ?? 100;
  const teamDynamics = gameState?.teamDynamics;
  const currentWeek = gameState?.currentWeek ?? 1;

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

  // Morale tips
  const moraleTips = useMemo(() => {
    if (!player) return [];
    return getMoraleTips(player.morale);
  }, [player]);

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
    {
      id: 'trainer',
      label: 'Personal Trainer',
      description: 'Hire a specialist for a focused morale session',
      icon: <Gift className="h-4 w-4" />,
      effect: '+4 Morale, +1 Fitness',
      cost: '£2,000',
      color: 'text-amber-400',
      borderColor: 'border-amber-500/30',
    },
    {
      id: 'coffee',
      label: 'Coffee with Teammate',
      description: 'Build relationships off the pitch',
      icon: <Coffee className="h-4 w-4" />,
      effect: '+2 Morale',
      cost: 'Free',
      color: 'text-sky-400',
      borderColor: 'border-sky-500/30',
      disabled: (actionsUsed['coffee'] ?? 0) > 1,
      disabledReason: (actionsUsed['coffee'] ?? 0) > 1 ? 'Max 2 per week' : undefined,
    },
  ], [playerFitness, actionsUsed]);

  if (!gameState || !player || !currentClub) return null;

  const moraleLevel = getMoraleLevel(player.morale);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-20 space-y-4">
      {/* ══════════════════════════════════════════════════════
          Section 1: Header + Enhanced Morale Gauge
          ══════════════════════════════════════════════════════ */}
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

        {/* Enhanced Semircular Gauge */}
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

        {/* Color-Coded Status Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={`mt-3 p-3 rounded-lg border ${moraleLevel.bgColor} ${moraleLevel.borderColor}`}
        >
          <div className="flex items-start gap-2">
            <span className={moraleLevel.color}>{moraleLevel.icon}</span>
            <div>
              <span className={`text-xs font-semibold ${moraleLevel.color} block mb-0.5`}>
                {moraleLevel.label} — {player.morale}/100
              </span>
              <span className="text-[10px] text-[#8b949e]">{moraleLevel.message}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          Section 2: Status Effects
          ══════════════════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════════════════
          Section 3: Morale History Bar Chart (5 checkpoints)
          ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#8b949e]" />
          Morale Trend
          <span className="text-[10px] text-[#484f58] font-normal ml-auto">Last 5 checkpoints</span>
        </h2>
        <MoraleBarChart checkpoints={moraleCheckpoints} />
        <div className="flex items-center justify-between mt-2 text-[10px] text-[#484f58]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-red-400" /> Low (0-29)</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-amber-400" /> Med (30-49)</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-yellow-400" /> Avg (50-69)</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-400" /> High (70+)</span>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          Section 4: Morale Factors Grid (enhanced cards)
          ══════════════════════════════════════════════════════ */}
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
          <div className="grid grid-cols-1 gap-2">
            {sortedFactors.map((factor, i) => {
              const isPositive = factor.impact > 0;
              const catConfig = getFactorCategoryConfig(factor.category);
              const hasExpiry = factor.expiresWeek && factor.expiresWeek > currentWeek;
              const weeksLeft = hasExpiry && factor.expiresWeek ? factor.expiresWeek - currentWeek : 0;

              return (
                <motion.div
                  key={factor.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18 + i * 0.04 }}
                  className={`p-3 rounded-lg border ${
                    isPositive
                      ? 'bg-emerald-500/5 border-emerald-500/10'
                      : 'bg-red-500/5 border-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Category icon */}
                    <div className={`w-7 h-7 rounded-md ${catConfig.bg} flex items-center justify-center ${catConfig.color} shrink-0`}>
                      {catConfig.icon}
                    </div>
                    {/* Label & category badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#c9d1d9] truncate">{factor.label}</span>
                        <Badge className={`${catConfig.bg} ${catConfig.color} border-0 text-[9px] shrink-0`}>
                          {catConfig.label}
                        </Badge>
                      </div>
                    </div>
                    {/* Impact value */}
                    <div className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md ${
                      isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {isPositive ? (
                        <ArrowUp className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-red-400" />
                      )}
                      <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{factor.impact}
                      </span>
                    </div>
                  </div>
                  {/* Description & expiry */}
                  <div className="flex items-center justify-between mt-1.5 pl-[38px]">
                    <span className="text-[10px] text-[#484f58]">
                      {isPositive ? 'Boosts morale' : 'Drains morale'} by {Math.abs(factor.impact)} points
                    </span>
                    {hasExpiry && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <Timer className="h-3 w-3" />
                        {weeksLeft}w left
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          Section 5: Team Dynamics Card
          ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h2 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-[#8b949e]" />
          Team Dynamics
          <span className="text-[10px] text-[#484f58] font-normal ml-auto">Squad environment</span>
        </h2>
        {teamDynamics && <TeamDynamicsCard dynamics={teamDynamics} currentWeek={currentWeek} />}
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          Section 6: Morale Tips
          ══════════════════════════════════════════════════════ */}
      {moraleTips.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
        >
          <h2 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            Morale Tips
            <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[9px] ml-auto">
              {moraleLevel.label}
            </Badge>
          </h2>
          <div className="space-y-2">
            {moraleTips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${
                  tip.priority === 'high'
                    ? 'bg-amber-500/5 border-amber-500/10'
                    : tip.priority === 'medium'
                    ? 'bg-[#21262d] border-[#30363d]/50'
                    : 'bg-[#0d1117]/50 border-[#21262d]'
                }`}
              >
                <div className="mt-0.5 shrink-0">{tip.icon}</div>
                <span className="text-xs text-[#c9d1d9] leading-relaxed">{tip.text}</span>
                {tip.priority === 'high' && (
                  <Badge className="bg-red-500/10 text-red-400 border-0 text-[8px] shrink-0 mt-0.5">
                    Urgent
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          Section 7: Boost Morale Actions
          ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
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
              transition={{ delay: 0.28 + i * 0.05 }}
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

      {/* ══════════════════════════════════════════════════════
          Section 8: Enhanced Mindset Selection
          ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
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
                className={`w-full text-left p-3 rounded-lg border border-l-[3px] transition-colors ${
                  isSelected
                    ? `${config.bgColor} ${config.borderColor} ${config.borderLeftColor}`
                    : 'bg-[#21262d] border-[#30363d] border-l-[#30363d] hover:bg-[#2d333b]'
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
                    {/* Effect description line */}
                    <p className={`text-[10px] mt-1 ${isSelected ? config.color : 'text-[#484f58]'}`}>
                      {config.effectDescription}
                    </p>
                  </div>
                </div>

                {/* Effects grid */}
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

      {/* ══════════════════════════════════════════════════════
          Section 9: How Morale Works
          ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4"
      >
        <h3 className="text-sm font-semibold text-[#c9d1d9] mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#8b949e]" />
          How Morale Works
        </h3>
        <div className="space-y-2 text-xs text-[#8b949e]">
          {/* 7-tier breakdown */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-sm bg-amber-400" />
            <span className="text-amber-400 font-medium">World-Class (90+):</span>
            <span>+0.5 match rating boost</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-sm bg-emerald-400" />
            <span className="text-emerald-400 font-medium">Excellent (80-89):</span>
            <span>+0.3 match rating boost</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-sm bg-emerald-300" />
            <span className="text-emerald-300 font-medium">Good (65-79):</span>
            <span>+0.1 match rating boost</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-sm bg-yellow-400" />
            <span className="text-yellow-400 font-medium">Average (50-64):</span>
            <span>No rating modifier</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-sm bg-amber-400" />
            <span className="text-amber-400 font-medium">Low (30-49):</span>
            <span>-0.3 match rating penalty</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-2 h-2 rounded-sm bg-orange-400" />
            <span className="text-orange-400 font-medium">Poor (15-29):</span>
            <span>-0.5 match rating penalty</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-2 rounded-sm bg-red-400" />
            <span className="text-red-400 font-medium">Terrible (0-14):</span>
            <span>-0.8 match rating penalty</span>
          </div>
          <div className="border-t border-[#30363d] pt-2 space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5 shrink-0">+</span>
              <span>Win matches, perform well, and start games to boost morale</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5 shrink-0">-</span>
              <span>Losses, injuries, bench roles, and expiring contracts decrease morale</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sky-400 mt-0.5 shrink-0">*</span>
              <span>Use morale actions wisely — some have limited uses per week</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
