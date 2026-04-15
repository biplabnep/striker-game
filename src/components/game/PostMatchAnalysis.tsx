'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getMatchRatingLabel } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  MapPin,
  Calendar,
  Trophy,
  Target,
  Zap,
  Shield,
  Heart,
  Clock,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  MessageSquare,
  Star,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { MatchEvent, MatchEventType } from '@/lib/game/types';

// -----------------------------------------------------------
// Web3 Design Token Constants
// -----------------------------------------------------------
const W3 = {
  bg: '#000000',
  card: '#0a0a0a',
  panel: '#111111',
  elevated: '#1a1a1a',
  accent: '#FF5500',
  lime: '#CCFF00',
  cyan: '#00E5FF',
  border: '#222222',
  dim: '#666666',
  mid: '#999999',
  bright: '#e8e8e8',
} as const;

// -----------------------------------------------------------
// Rating color helpers
// -----------------------------------------------------------
function getRatingColor(rating: number): string {
  if (rating >= 8.0) return '#22c55e';
  if (rating >= 7.0) return '#10b981';
  if (rating >= 6.0) return '#f59e0b';
  if (rating >= 5.0) return '#f97316';
  return '#ef4444';
}

function getRatingBg(rating: number): string {
  if (rating >= 8.0) return 'bg-emerald-500/15 border-emerald-500/30';
  if (rating >= 7.0) return 'bg-emerald-600/10 border-emerald-600/25';
  if (rating >= 6.0) return 'bg-amber-500/10 border-amber-500/25';
  if (rating >= 5.0) return 'bg-orange-500/10 border-orange-500/25';
  return 'bg-red-500/10 border-red-500/25';
}

function getRatingTextClass(rating: number): string {
  if (rating >= 8.0) return 'text-emerald-400';
  if (rating >= 7.0) return 'text-emerald-500';
  if (rating >= 6.0) return 'text-amber-400';
  if (rating >= 5.0) return 'text-orange-400';
  return 'text-red-400';
}

// -----------------------------------------------------------
// Event icon & color mapping (reuse from MatchDay patterns)
// -----------------------------------------------------------
function getEventIcon(type: MatchEventType): string {
  switch (type) {
    case 'goal': return '\u26BD';
    case 'own_goal': return '\u26BD';
    case 'assist': return '\uD83C\uDDE1\uFE0F';
    case 'yellow_card': return '\uD83D\uDFE8';
    case 'red_card': return '\uD83D\uDFE5';
    case 'second_yellow': return '\uD83D\uDFE8\uD83D\uDFE5';
    case 'substitution': return '\uD83D\uDD04';
    case 'injury': return '\uD83C\uDFE5';
    default: return '\uD83D\uDCCC';
  }
}

function getEventColor(type: MatchEventType): string {
  switch (type) {
    case 'goal': return 'text-emerald-400';
    case 'own_goal': return 'text-red-400';
    case 'assist': return 'text-sky-400';
    case 'yellow_card': return 'text-yellow-400';
    case 'red_card': return 'text-red-500';
    case 'second_yellow': return 'text-orange-400';
    case 'substitution': return 'text-cyan-400';
    case 'injury': return 'text-rose-400';
    default: return 'text-[#8b949e]';
  }
}

function getEventBg(type: MatchEventType): string {
  switch (type) {
    case 'goal': return 'bg-emerald-500/10 border-emerald-500/30';
    case 'own_goal': return 'bg-red-500/10 border-red-500/30';
    case 'assist': return 'bg-sky-500/10 border-sky-500/30';
    case 'yellow_card': return 'bg-yellow-500/10 border-yellow-500/30';
    case 'red_card': return 'bg-red-500/15 border-red-500/40';
    case 'second_yellow': return 'bg-orange-500/10 border-orange-500/30';
    case 'substitution': return 'bg-cyan-500/10 border-cyan-500/30';
    case 'injury': return 'bg-rose-500/10 border-rose-500/30';
    default: return 'bg-slate-500/10 border-slate-500/30';
  }
}

function getEventLabel(type: MatchEventType): string {
  switch (type) {
    case 'goal': return 'Goal';
    case 'own_goal': return 'Own Goal';
    case 'assist': return 'Assist';
    case 'yellow_card': return 'Yellow Card';
    case 'red_card': return 'Red Card';
    case 'second_yellow': return '2nd Yellow';
    case 'substitution': return 'Substitution';
    case 'injury': return 'Injury';
    default: return type;
  }
}

// -----------------------------------------------------------
// Performance breakdown calculator
// -----------------------------------------------------------
interface PerformanceBreakdown {
  attacking: number;   // 0-100
  creative: number;    // 0-100
  defensive: number;   // 0-100
  stamina: number;     // 0-100
}

function calculatePerformanceBreakdown(
  goals: number,
  assists: number,
  minutesPlayed: number,
  events: MatchEvent[],
  playerRating: number
): PerformanceBreakdown {
  // Attacking: based on goals and chance events
  const chanceEvents = events.filter(
    e => e.type === 'chance' || e.type === 'penalty_won'
  );
  const attacking = Math.min(100, goals * 25 + chanceEvents.length * 10 + Math.max(0, playerRating - 5) * 3);

  // Creative: based on assists, key passes, corners
  const creativeEvents = events.filter(
    e => e.type === 'assist' || e.type === 'corner' || e.type === 'free_kick'
  );
  const creative = Math.min(100, assists * 30 + creativeEvents.length * 8 + Math.max(0, playerRating - 5) * 3);

  // Defensive: based on tackles/interceptions (simulated from rating)
  const defensiveEvents = events.filter(
    e => e.type === 'save' || e.type === 'injury'
  );
  const defensive = Math.min(100, defensiveEvents.length * 5 + Math.max(0, playerRating - 4) * 5 + 15);

  // Stamina: based on minutes played percentage
  const staminaPct = Math.min(100, (minutesPlayed / 90) * 100);

  return {
    attacking: Math.max(5, attacking),
    creative: Math.max(5, creative),
    defensive: Math.max(5, defensive),
    stamina: Math.max(5, staminaPct),
  };
}

// -----------------------------------------------------------
// Coach feedback generator
// -----------------------------------------------------------
interface CoachFeedback {
  level: 'excellent' | 'good' | 'average' | 'poor';
  title: string;
  message: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function generateCoachFeedback(
  rating: number,
  goals: number,
  assists: number,
  minutes: number
): CoachFeedback {
  if (rating >= 8.0) {
    const exceptional = rating >= 8.5;
    const goalMention = goals > 0
      ? goals >= 2 ? `Scoring ${goals} goal${goals > 1 ? 's' : ''} was outstanding. ` : `Getting on the scoresheet was key. `
      : '';
    const assistMention = assists > 0
      ? `Your ${assists} assist${assists > 1 ? 's were' : ' was'} crucial. ` : '';
    return {
      level: 'excellent',
      title: exceptional ? 'Phenomenal Display' : 'Outstanding Performance',
      message: `The manager is thrilled with your contribution. ${goalMention}${assistMention}Your rating of ${rating.toFixed(1)} reflects a near-perfect performance. Keep this up and bigger things will come.`,
      icon: <Star className="w-5 h-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    };
  }

  if (rating >= 7.0) {
    const goalMention = goals > 0 ? `Your goal${goals > 1 ? 's' : ''} made the difference. ` : '';
    const assistMention = assists > 0 ? `Great vision on the assist. ` : '';
    return {
      level: 'good',
      title: 'Strong Showing',
      message: `A solid performance from you today. ${goalMention}${assistMention}The coaching staff noted your work rate and positioning. You're showing real consistency.`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-600/10 border-emerald-600/25',
    };
  }

  if (rating >= 6.0) {
    const concerns: string[] = [];
    if (minutes < 60) concerns.push('you were subbed early');
    if (goals === 0 && assists === 0) concerns.push('no direct goal contributions');
    if (rating < 6.5) concerns.push('a below-average rating');

    const concernText = concerns.length > 0
      ? `The staff noted ${concerns.join(' and ')}. `
      : '';
    return {
      level: 'average',
      title: 'Room for Improvement',
      message: `An okay performance, but we know you can do better. ${concernText}Focus on your positioning and decision-making in training this week. You have the quality.`,
      icon: <Minus className="w-5 h-5" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/25',
    };
  }

  const harshNotes: string[] = [];
  if (minutes === 0) harshNotes.push('You didn\'t see any game time');
  else if (minutes < 30) harshNotes.push('Very limited minutes on the pitch');
  if (rating < 5.0) harshNotes.push('This was a difficult match for you');

  return {
    level: 'poor',
    title: 'Tough Day',
    message: `Not your best performance. ${harshNotes.join('. ')}. Every player has these days — what matters is how you respond. Hit the training ground with purpose this week.`,
    icon: <TrendingDown className="w-5 h-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/25',
  };
}

// -----------------------------------------------------------
// Stat bar component
// -----------------------------------------------------------
function StatBar({
  label,
  value,
  icon,
  color,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="space-y-1.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={color}>{icon}</span>
          <span className="text-xs text-[#c9d1d9] font-medium">{label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums text-[#c9d1d9]">{value}%</span>
      </div>
      <div className="h-2.5 bg-[#21262d] rounded-lg overflow-hidden">
        <motion.div
          className="h-full rounded-lg"
          style={{ backgroundColor: color === 'text-emerald-400' ? '#10b981' : color === 'text-sky-400' ? '#38bdf8' : color === 'text-amber-400' ? '#f59e0b' : '#f87171' }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.1, duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------
// Mini bar chart for rating history
// -----------------------------------------------------------
function MiniRatingBar({ rating, index }: { rating: number; index: number }) {
  const height = ((rating - 3) / (11 - 3)) * 100;
  const color = getRatingColor(rating);
  const delay = 0.4 + index * 0.06;

  return (
    <motion.div
      className="flex-1 flex flex-col items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
    >
      <span className="text-[8px] tabular-nums text-[#8b949e]">
        {rating.toFixed(1)}
      </span>
      <motion.div
        className="w-full rounded-t-sm"
        style={{ backgroundColor: color }}
        initial={{ height: 0 }}
        animate={{ height: `${Math.max(height, 8)}%` }}
        transition={{ delay: delay + 0.05, duration: 0.3, ease: 'easeOut' }}
      />
      <span className="text-[8px] text-[#484f58]">
        {index === 0 ? 'Now' : `-${index}`}
      </span>
    </motion.div>
  );
}

// ===========================================================
// SVG HELPER FUNCTIONS
// ===========================================================

/** Convert angle (0=12 o'clock, clockwise) to SVG cartesian point */
function polarToXY(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = angleDeg * Math.PI / 180;
  return {
    x: cx + r * Math.sin(rad),
    y: cy - r * Math.cos(rad),
  };
}

/** Build an SVG arc path for a donut segment */
function donutSegmentPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startDeg: number, endDeg: number
): string {
  const outerStart = polarToXY(cx, cy, outerR, startDeg);
  const outerEnd = polarToXY(cx, cy, outerR, endDeg);
  const innerEnd = polarToXY(cx, cy, innerR, endDeg);
  const innerStart = polarToXY(cx, cy, innerR, startDeg);
  const largeArc = (endDeg - startDeg > 180) ? 1 : 0;
  return [
    `M ${outerStart.x.toFixed(1)} ${outerStart.y.toFixed(1)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x.toFixed(1)} ${outerEnd.y.toFixed(1)}`,
    `L ${innerEnd.x.toFixed(1)} ${innerEnd.y.toFixed(1)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x.toFixed(1)} ${innerStart.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

/** Compute polygon points string for radar charts */
function computeRadarPoints(cx: number, cy: number, r: number, values: number[]): string {
  return values.reduce((acc, val, i) => {
    const angle = (i / values.length) * 360 - 90;
    const pt = polarToXY(cx, cy, r * (val / 100), angle + 90);
    const pair = `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    return i === 0 ? pair : `${acc} ${pair}`;
  }, '');
}

/** Get impact score for an event type (for scatter plot) */
function getEventImpact(type: MatchEventType): number {
  switch (type) {
    case 'goal': return 10;
    case 'own_goal': return 8;
    case 'red_card': return 9;
    case 'second_yellow': return 8;
    case 'save': return 7;
    case 'assist': return 7;
    case 'penalty_missed': return 6;
    case 'injury': return 5;
    case 'chance': return 5;
    case 'yellow_card': return 4;
    case 'substitution': return 3;
    default: return 2;
  }
}

/** Build a semi-circular gauge arc path (left to right through top) */
function gaugeArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  if (Math.abs(endAngle - startAngle) < 0.5) return '';
  const start = polarToXY(cx, cy, r, startAngle - 90);
  const end = polarToXY(cx, cy, r, endAngle - 90);
  const largeArc = (endAngle - startAngle > 180) ? 1 : 0;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

// ===========================================================
// SVG COMPONENT 1: Match Rating Gauge
// ===========================================================
function MatchRatingGauge({ rating }: { rating: number }): React.JSX.Element {
  const cx = 80;
  const cy = 85;
  const r = 56;
  const gaugeColor = rating >= 8 ? W3.lime : rating >= 7 ? '#22c55e' : rating >= 6 ? W3.accent : '#ef4444';
  const bgPath = gaugeArcPath(cx, cy, r, 0, 180);
  const ratingAngle = Math.min(180, Math.max(2, (rating / 10) * 180));
  const ratingPath = gaugeArcPath(cx, cy, r, 0, ratingAngle);

  return (
    <svg viewBox="0 0 160 110" className="w-full max-w-[200px] mx-auto">
      <path d={bgPath} fill="none" stroke={W3.border} strokeWidth="10" strokeLinecap="round" />
      {ratingPath && (
        <path d={ratingPath} fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" />
      )}
      {/* Needle indicator */}
      {rating > 0 && (() => {
        const needleAngle = (rating / 10) * 180;
        const needlePt = polarToXY(cx, cy - 18, r * 0.68, needleAngle - 90);
        const needleBase = polarToXY(cx, cy - 18, 4, needleAngle - 90);
        return (
          <circle cx={needlePt.x.toFixed(1)} cy={needlePt.y.toFixed(1)} r="4" fill={W3.bright} />
        );
      })()}
      <text x={cx} y={cy - 10} textAnchor="middle"  fontFamily="monospace" fontSize="28" fontWeight="bold" fill={W3.bright}>
        {rating.toFixed(1)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle"  fontFamily="monospace" fontSize="9" fill={W3.mid}>
        MATCH RATING
      </text>
      <text x={14} y={cy + 22} textAnchor="start"  fontFamily="monospace" fontSize="8" fill={W3.dim}>
        0
      </text>
      <text x={146} y={cy + 22} textAnchor="end"  fontFamily="monospace" fontSize="8" fill={W3.dim}>
        10
      </text>
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 2: Performance Pentagon Radar
// ===========================================================
function PerformancePentagonRadar({
  performance,
  playerRating,
}: {
  performance: PerformanceBreakdown;
  playerRating: number;
}): React.JSX.Element {
  const cx = 80;
  const cy = 80;
  const r = 52;
  const decision = Math.min(100, Math.max(5, Math.round(playerRating * 8 + 10 + (performance.attacking > 40 ? 10 : 0))));
  const values = [performance.attacking, performance.creative, performance.defensive, performance.stamina, decision];
  const labels = ['ATK', 'CRE', 'DEF', 'STA', 'DEC'];

  // Grid rings at 25%, 50%, 75%, 100%
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  // Compute axis lines and labels
  const axisEndpoints = values.reduce((acc, _v, i) => {
    const pt = polarToXY(cx, cy, r, i * 72 - 90);
    const labelPt = polarToXY(cx, cy, r + 14, i * 72 - 90);
    return [...acc, { endpoint: pt, labelPt, label: labels[i] }];
  }, [] as { endpoint: { x: number; y: number }; labelPt: { x: number; y: number }; label: string }[]);

  const dataPoints = computeRadarPoints(cx, cy, r, values);
  const gridPointsList = gridRings.map(s => computeRadarPoints(cx, cy, r * s, [100, 100, 100, 100, 100]));

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[200px] mx-auto">
      {/* Grid polygons */}
      {gridPointsList.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke={W3.border} strokeWidth="0.5" />
      ))}
      {/* Axis lines */}
      {axisEndpoints.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={a.endpoint.x} y2={a.endpoint.y} stroke={W3.border} strokeWidth="0.5" />
      ))}
      {/* Data polygon */}
      <polygon points={dataPoints} fill={`${W3.lime}20`} stroke={W3.lime} strokeWidth="1.5" />
      {/* Data dots */}
      {values.map((v, i) => {
        const pt = polarToXY(cx, cy, r * (v / 100), i * 72 - 90);
        return <circle key={i} cx={pt.x} cy={pt.y} r="3" fill={W3.lime} />;
      })}
      {/* Labels */}
      {axisEndpoints.map((a, i) => (
        <text key={i} x={a.labelPt.x} y={a.labelPt.y} textAnchor="middle"  fontFamily="monospace" fontSize="8" fill={W3.mid}>
          {a.label}
        </text>
      ))}
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 3: Shot Distribution Donut
// ===========================================================
function ShotDistributionDonut({ events, playerRating }: { events: MatchEvent[]; playerRating: number }): React.JSX.Element {
  const raw = events.reduce((acc, e) => {
    if (e.type === 'goal') return { ...acc, onTarget: acc.onTarget + 1 };
    if (e.type === 'chance') return { ...acc, offTarget: acc.offTarget + 1 };
    if (e.type === 'save') return { ...acc, saved: acc.saved + 1 };
    return acc;
  }, { onTarget: 0, offTarget: 0, blocked: 0, saved: 0 });

  const totalRaw = raw.onTarget + raw.offTarget + raw.blocked + raw.saved;
  const boost = totalRaw < 4 ? Math.max(2, Math.round(playerRating * 1.2)) : 0;
  const shots = {
    onTarget: raw.onTarget + boost + Math.max(0, Math.round(playerRating / 3)),
    offTarget: raw.offTarget + boost + 1,
    blocked: raw.blocked + Math.max(0, boost - 1),
    saved: raw.saved + Math.max(0, boost - 2),
  };
  const total = shots.onTarget + shots.offTarget + shots.blocked + shots.saved;

  const cx = 80;
  const cy = 70;
  const outerR = 48;
  const innerR = 30;
  const segments = [
    { label: 'On Target', value: shots.onTarget, color: W3.lime },
    { label: 'Off Target', value: shots.offTarget, color: W3.accent },
    { label: 'Blocked', value: shots.blocked, color: W3.cyan },
    { label: 'Saved', value: shots.saved, color: W3.dim },
  ];

  const paths = segments.reduce((acc, seg) => {
    if (seg.value === 0) return acc;
    const startDeg = acc.cumDeg;
    const spanDeg = (seg.value / total) * 360;
    const path = donutSegmentPath(cx, cy, outerR, innerR, startDeg, startDeg + spanDeg);
    return { items: [...acc.items, { path, color: seg.color, label: seg.label, value: seg.value }], cumDeg: startDeg + spanDeg };
  }, { items: [] as { path: string; color: string; label: string; value: number }[], cumDeg: 0 }).items;

  const legendItems = segments.map(s => ({
    ...s,
    pct: total > 0 ? Math.round((s.value / total) * 100) : 0,
  }));

  return (
    <svg viewBox="0 0 160 130" className="w-full max-w-[200px] mx-auto">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke={W3.border} strokeWidth={outerR - innerR} />
      {/* Segments */}
      {paths.map((p, i) => (
        <path key={i} d={p.path} fill={p.color} />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 2} textAnchor="middle"  fontFamily="monospace" fontSize="16" fontWeight="bold" fill={W3.bright}>
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"  fontFamily="monospace" fontSize="7" fill={W3.mid}>
        SHOTS
      </text>
      {/* Legend */}
      {legendItems.map((item, i) => {
        const lx = i < 2 ? 8 : 84;
        const ly = 108 + (i % 2) * 14;
        return (
          <g key={i}>
            <rect x={lx} y={ly - 6} width="8" height="8" rx="2" fill={item.color} />
            <text x={lx + 12} y={ly + 1} textAnchor="start"  fontFamily="monospace" fontSize="8" fill={W3.mid}>
              {item.label} {item.pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 4: Passing Accuracy Bars
// ===========================================================
function PassingAccuracyBars({ playerRating }: { playerRating: number }): React.JSX.Element {
  const bars = [
    { label: 'Short', value: Math.min(95, Math.max(60, Math.round(playerRating * 8.2 + 17))) },
    { label: 'Medium', value: Math.min(92, Math.max(50, Math.round(playerRating * 7 + 22))) },
    { label: 'Long', value: Math.min(78, Math.max(35, Math.round(playerRating * 5.5 + 22))) },
    { label: 'Cross', value: Math.min(70, Math.max(28, Math.round(playerRating * 4.8 + 18))) },
  ];

  const barHeight = 14;
  const gap = 16;
  const startY = 16;
  const maxBarWidth = 90;
  const labelWidth = 48;

  return (
    <svg viewBox="0 0 160 100" className="w-full max-w-[200px] mx-auto">
      {bars.map((bar, i) => {
        const y = startY + i * gap;
        const barW = (bar.value / 100) * maxBarWidth;
        const barColor = bar.value >= 80 ? W3.lime : bar.value >= 60 ? W3.cyan : bar.value >= 45 ? W3.accent : '#ef4444';
        return (
          <g key={i}>
            <text x={labelWidth - 4} y={y + barHeight - 3} textAnchor="end"  fontFamily="monospace" fontSize="9" fill={W3.mid}>
              {bar.label}
            </text>
            {/* Background bar */}
            <rect x={labelWidth} y={y} width={maxBarWidth} height={barHeight} rx="3" fill={W3.border} />
            {/* Value bar */}
            <rect x={labelWidth} y={y} width={barW} height={barHeight} rx="3" fill={barColor} opacity="0.85" />
            {/* Percentage */}
            <text x={labelWidth + maxBarWidth + 4} y={y + barHeight - 3} textAnchor="start"  fontFamily="monospace" fontSize="8" fontWeight="bold" fill={barColor}>
              {bar.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 5: Match Events Timeline (SVG horizontal)
// ===========================================================
function MatchEventsTimelineSVG({ events }: { events: MatchEvent[] }): React.JSX.Element {
  const significantTypes: MatchEventType[] = ['goal', 'own_goal', 'red_card', 'yellow_card', 'second_yellow', 'assist', 'substitution', 'injury', 'save', 'penalty_missed'];
  const filtered = events
    .filter(e => significantTypes.includes(e.type))
    .sort((a, b) => a.minute - b.minute);

  const padX = 12;
  const lineY = 30;
  const lineStartX = padX;
  const lineEndX = 148;
  const lineWidth = lineEndX - lineStartX;

  const dotColorMap: Record<string, string> = {
    goal: W3.lime,
    own_goal: '#ef4444',
    red_card: '#ef4444',
    second_yellow: W3.accent,
    yellow_card: '#f59e0b',
    assist: W3.cyan,
    substitution: W3.mid,
    injury: '#ef4444',
    save: W3.cyan,
    penalty_missed: W3.accent,
  };

  const topEvents = filtered.filter((_e, i) => i % 2 === 0);
  const bottomEvents = filtered.filter((_e, i) => i % 2 === 1);

  return (
    <svg viewBox="0 0 160 65" className="w-full max-w-[200px] mx-auto">
      {/* Timeline line */}
      <line x1={lineStartX} y1={lineY} x2={lineEndX} y2={lineY} stroke={W3.border} strokeWidth="1.5" />
      {/* Half markers */}
      <text x={lineStartX} y={lineY - 6} textAnchor="start"  fontFamily="monospace" fontSize="7" fill={W3.dim}>0&apos;</text>
      <text x={lineEndX} y={lineY - 6} textAnchor="end"  fontFamily="monospace" fontSize="7" fill={W3.dim}>90&apos;</text>
      <line x1={lineStartX + lineWidth / 2} y1={lineY - 3} x2={lineStartX + lineWidth / 2} y2={lineY + 3} stroke={W3.dim} strokeWidth="0.5" />
      <text x={lineStartX + lineWidth / 2} y={lineY - 6} textAnchor="middle"  fontFamily="monospace" fontSize="7" fill={W3.dim}>45&apos;</text>
      {/* Top event dots */}
      {topEvents.map((e, i) => {
        const x = lineStartX + (e.minute / 90) * lineWidth;
        const color = dotColorMap[e.type] ?? W3.dim;
        return (
          <g key={`t-${e.minute}-${e.type}-${i}`}>
            <line x1={x} y1={lineY - 3} x2={x} y2={lineY - 12} stroke={color} strokeWidth="0.5" />
            <circle cx={x} cy={lineY - 14} r="3.5" fill={color} />
            <text x={x} y={lineY - 20} textAnchor="middle"  fontFamily="monospace" fontSize="6" fill={color}>
              {e.minute}&apos;
            </text>
          </g>
        );
      })}
      {/* Bottom event dots */}
      {bottomEvents.map((e, i) => {
        const x = lineStartX + (e.minute / 90) * lineWidth;
        const color = dotColorMap[e.type] ?? W3.dim;
        return (
          <g key={`b-${e.minute}-${e.type}-${i}`}>
            <line x1={x} y1={lineY + 3} x2={x} y2={lineY + 12} stroke={color} strokeWidth="0.5" />
            <circle cx={x} cy={lineY + 14} r="3.5" fill={color} />
            <text x={x} y={lineY + 26} textAnchor="middle"  fontFamily="monospace" fontSize="6" fill={color}>
              {e.minute}&apos;
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 6: Player Comparison Bar (Butterfly)
// ===========================================================
function PlayerComparisonBar({
  goals,
  assists,
  rating,
  minutes,
  playerRating,
}: {
  goals: number;
  assists: number;
  rating: number;
  minutes: number;
  playerRating: number;
}): React.JSX.Element {
  const opponentBase = Math.max(0.3, (10 - playerRating) * 0.08 + 0.35);
  const categories = [
    {
      label: 'GOALS',
      player: Math.min(1, goals * 0.35 + 0.05),
      opponent: Math.min(1, opponentBase * 0.6 + (goals > 0 ? 0.15 : 0.05)),
    },
    {
      label: 'ASSISTS',
      player: Math.min(1, assists * 0.4 + 0.08),
      opponent: Math.min(1, opponentBase * 0.55 + (assists > 0 ? 0.12 : 0.06)),
    },
    {
      label: 'RATING',
      player: Math.min(1, rating / 10),
      opponent: Math.min(1, (6.5 - Math.abs(playerRating - 6.5) * 0.1) / 10),
    },
    {
      label: 'MINS',
      player: Math.min(1, minutes / 90),
      opponent: Math.min(1, Math.max(0.05, 0.72 + playerRating * 0.005)),
    },
  ].map(c => ({
    ...c,
    opponent: Math.max(0.05, c.opponent),
  }));

  const centerX = 80;
  const maxBarW = 55;
  const barH = 12;
  const gap = 20;
  const startY = 12;

  return (
    <svg viewBox="0 0 160 110" className="w-full max-w-[200px] mx-auto">
      {/* Center divider */}
      <line x1={centerX} y1={0} x2={centerX} y2={startY + categories.length * gap} stroke={W3.border} strokeWidth="0.5" />
      {/* Headers */}
      <text x={centerX - 6} y={8} textAnchor="end"  fontFamily="monospace" fontSize="7" fill={W3.cyan}>YOU</text>
      <text x={centerX + 6} y={8} textAnchor="start"  fontFamily="monospace" fontSize="7" fill={W3.dim}>OPP</text>
      {categories.map((cat, i) => {
        const y = startY + i * gap;
        const playerW = cat.player * maxBarW;
        const oppW = cat.opponent * maxBarW;
        return (
          <g key={i}>
            <text x={centerX} y={y + barH + 3} textAnchor="middle"  fontFamily="monospace" fontSize="7" fontWeight="bold" fill={W3.mid}>
              {cat.label}
            </text>
            {/* Player bar (right from center) */}
            <rect x={centerX + 2} y={y} width={playerW} height={barH} rx="2" fill={W3.cyan} opacity="0.8" />
            {/* Opponent bar (left from center) */}
            <rect x={centerX - 2 - oppW} y={y} width={oppW} height={barH} rx="2" fill={W3.dim} opacity="0.5" />
          </g>
        );
      })}
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 7: Possession Split Ring
// ===========================================================
function PossessionSplitRing({
  isHome,
  homeScore,
  awayScore,
  playerRating,
}: {
  isHome: boolean;
  homeScore: number;
  awayScore: number;
  playerRating: number;
}): React.JSX.Element {
  const rawPossession = 50 + (homeScore - awayScore) * 2.5 + (playerRating - 6.5) * 1.2;
  const homePoss = Math.min(65, Math.max(38, Math.round(rawPossession)));
  const awayPoss = 100 - homePoss;
  const playerPoss = isHome ? homePoss : awayPoss;
  const oppPoss = isHome ? awayPoss : homePoss;

  const cx = 80;
  const cy = 72;
  const outerR = 46;
  const innerR = 28;

  const playerSpan = (playerPoss / 100) * 360;
  const oppSpan = (oppPoss / 100) * 360;

  const playerPath = donutSegmentPath(cx, cy, outerR, innerR, 0, playerSpan);
  const oppPath = donutSegmentPath(cx, cy, outerR, innerR, playerSpan, 360);

  return (
    <svg viewBox="0 0 160 130" className="w-full max-w-[200px] mx-auto">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke={W3.border} strokeWidth={outerR - innerR} />
      {/* Player segment */}
      <path d={playerPath} fill={W3.cyan} />
      {/* Opponent segment */}
      <path d={oppPath} fill={W3.dim} opacity="0.6" />
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle"  fontFamily="monospace" fontSize="18" fontWeight="bold" fill={W3.bright}>
        {playerPoss}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"  fontFamily="monospace" fontSize="7" fill={W3.mid}>
        POSSESSION
      </text>
      {/* Legend */}
      <g>
        <rect x={32} y={118} width="8" height="8" rx="2" fill={W3.cyan} />
        <text x={44} y={125} textAnchor="start"  fontFamily="monospace" fontSize="8" fill={W3.mid}>
          YOU {playerPoss}%
        </text>
        <rect x={96} y={118} width="8" height="8" rx="2" fill={W3.dim} />
        <text x={108} y={125} textAnchor="start"  fontFamily="monospace" fontSize="8" fill={W3.mid}>
          OPP {oppPoss}%
        </text>
      </g>
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 8: Key Moments Scatter
// ===========================================================
function KeyMomentsScatter({ events }: { events: MatchEvent[] }): React.JSX.Element {
  const scatterTypes: MatchEventType[] = ['goal', 'own_goal', 'red_card', 'yellow_card', 'second_yellow', 'assist', 'substitution', 'injury', 'save', 'penalty_missed', 'chance'];
  const points = events
    .filter(e => scatterTypes.includes(e.type))
    .reduce((acc, e) => {
      const impact = getEventImpact(e.type);
      return [...acc, { minute: e.minute, impact, type: e.type }];
    }, [] as { minute: number; impact: number; type: MatchEventType }[]);

  const colorMap: Record<string, string> = {
    goal: W3.lime,
    own_goal: '#ef4444',
    red_card: '#ef4444',
    second_yellow: W3.accent,
    yellow_card: '#f59e0b',
    assist: W3.cyan,
    substitution: W3.mid,
    injury: '#ef4444',
    save: W3.cyan,
    penalty_missed: W3.accent,
    chance: W3.accent,
  };

  const padX = 20;
  const padTop = 10;
  const padBottom = 20;
  const chartW = 120;
  const chartH = 80;

  const mapX = (min: number) => padX + (min / 90) * chartW;
  const mapY = (imp: number) => padTop + chartH - (imp / 10) * chartH;

  return (
    <svg viewBox="0 0 160 115" className="w-full max-w-[200px] mx-auto">
      {/* Axes */}
      <line x1={padX} y1={padTop} x2={padX} y2={padTop + chartH} stroke={W3.border} strokeWidth="1" />
      <line x1={padX} y1={padTop + chartH} x2={padX + chartW} y2={padTop + chartH} stroke={W3.border} strokeWidth="1" />
      {/* Axis labels */}
      <text x={padX + chartW / 2} y={padTop + chartH + 14} textAnchor="middle"  fontFamily="monospace" fontSize="7" fill={W3.dim}>
        MINUTE
      </text>
      {/* Vertical IMPACT label using individual characters */}
      {['I', 'M', 'P'].map((ch, ci) => (
        <text key={`imp-${ci}`} x={6} y={padTop + 20 + ci * 9} textAnchor="middle" fontFamily="monospace" fontSize="6" fill={W3.dim}>
          {ch}
        </text>
      ))}
      {/* Grid lines */}
      {[2, 4, 6, 8, 10].map(v => {
        const y = mapY(v);
        return <line key={v} x1={padX} y1={y} x2={padX + chartW} y2={y} stroke={W3.border} strokeWidth="0.3" strokeDasharray="2 3" />;
      })}
      {/* Scatter dots */}
      {points.map((pt, i) => {
        const color = colorMap[pt.type] ?? W3.dim;
        const r = pt.impact >= 8 ? 5 : pt.impact >= 6 ? 4 : 3;
        return (
          <circle
            key={`${pt.minute}-${pt.type}-${i}`}
            cx={mapX(pt.minute)}
            cy={mapY(pt.impact)}
            r={r}
            fill={color}
            opacity="0.85"
          />
        );
      })}
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 9: Formation Contribution Bars
// ===========================================================
function FormationContributionBars({
  performance,
  playerRating,
  goals,
  assists,
}: {
  performance: PerformanceBreakdown;
  playerRating: number;
  goals: number;
  assists: number;
}): React.JSX.Element {
  const bars = [
    { label: 'DEF', value: Math.min(100, Math.max(5, Math.round(performance.defensive * 0.85 + playerRating * 1.2))) },
    { label: 'MID', value: Math.min(100, Math.max(5, Math.round((performance.creative + performance.stamina) * 0.35 + 20 + playerRating * 0.8))) },
    { label: 'ATK', value: Math.min(100, Math.max(5, Math.round(performance.attacking * 0.9 + goals * 8 + playerRating * 0.5))) },
    { label: 'SET', value: Math.min(100, Math.max(5, Math.round(goals * 18 + assists * 12 + playerRating * 1.5 + 8))) },
    { label: 'TRN', value: Math.min(100, Math.max(5, Math.round(performance.stamina * 0.5 + performance.creative * 0.25 + playerRating * 0.8 + 12))) },
  ];

  const barH = 11;
  const gap = 15;
  const startY = 14;
  const labelW = 28;
  const maxBarW = 90;

  return (
    <svg viewBox="0 0 160 105" className="w-full max-w-[200px] mx-auto">
      {bars.map((bar, i) => {
        const y = startY + i * gap;
        const barW = (bar.value / 100) * maxBarW;
        const color = bar.value >= 75 ? W3.lime : bar.value >= 50 ? W3.cyan : bar.value >= 30 ? W3.accent : '#ef4444';
        return (
          <g key={i}>
            <text x={labelW - 2} y={y + barH - 2} textAnchor="end"  fontFamily="monospace" fontSize="8" fontWeight="bold" fill={W3.mid}>
              {bar.label}
            </text>
            <rect x={labelW} y={y} width={maxBarW} height={barH} rx="2" fill={W3.border} />
            <rect x={labelW} y={y} width={barW} height={barH} rx="2" fill={color} opacity="0.85" />
            <text x={labelW + maxBarW + 3} y={y + barH - 2} textAnchor="start"  fontFamily="monospace" fontSize="7" fontWeight="bold" fill={color}>
              {bar.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 10: Fitness Impact Area Chart
// ===========================================================
function FitnessImpactAreaChart({
  fitness,
  minutes,
  playerRating,
}: {
  fitness: number;
  minutes: number;
  playerRating: number;
}): React.JSX.Element {
  const decayRate = Math.max(0.5, (1 - playerRating / 12) * 1.8);
  const dataPoints = [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
    const periodFitness = fitness - i * decayRate * (minutes / 90);
    return Math.max(15, Math.min(100, Math.round(periodFitness)));
  });

  const padX = 18;
  const padTop = 8;
  const padBottom = 18;
  const chartW = 124;
  const chartH = 65;
  const stepX = chartW / (dataPoints.length - 1);

  const mapX = (i: number) => padX + i * stepX;
  const mapY = (v: number) => padTop + chartH - (v / 100) * chartH;

  const linePoints = dataPoints.map((v, i) => `${mapX(i).toFixed(1)},${mapY(v).toFixed(1)}`).join(' ');
  const areaPath = [
    `M ${mapX(0).toFixed(1)} ${mapY(dataPoints[0]).toFixed(1)}`,
    ...dataPoints.slice(1).map((v, i) => `L ${mapX(i + 1).toFixed(1)} ${mapY(v).toFixed(1)}`),
    `L ${mapX(dataPoints.length - 1).toFixed(1)} ${(padTop + chartH).toFixed(1)}`,
    `L ${mapX(0).toFixed(1)} ${(padTop + chartH).toFixed(1)}`,
    'Z',
  ].join(' ');

  const dotCoords = dataPoints.map((v, i) => ({ x: mapX(i), y: mapY(v), value: v }));

  return (
    <svg viewBox="0 0 160 100" className="w-full max-w-[200px] mx-auto">
      {/* Axes */}
      <line x1={padX} y1={padTop} x2={padX} y2={padTop + chartH} stroke={W3.border} strokeWidth="0.5" />
      <line x1={padX} y1={padTop + chartH} x2={padX + chartW} y2={padTop + chartH} stroke={W3.border} strokeWidth="0.5" />
      {/* Grid lines */}
      {[25, 50, 75].map(v => {
        const y = mapY(v);
        return <line key={v} x1={padX} y1={y} x2={padX + chartW} y2={y} stroke={W3.border} strokeWidth="0.3" strokeDasharray="2 3" />;
      })}
      {/* Area fill */}
      <path d={areaPath} fill={`${W3.cyan}15`} stroke="none" />
      {/* Line */}
      <polyline points={linePoints} fill="none" stroke={W3.cyan} strokeWidth="1.5" />
      {/* Dots */}
      {dotCoords.map((pt, i) => (
        <circle key={i} cx={pt.x.toFixed(1)} cy={pt.y.toFixed(1)} r="2.5" fill={W3.cyan} />
      ))}
      {/* X-axis labels */}
      {dataPoints.map((_v, i) => (
        <text key={i} x={mapX(i)} y={padTop + chartH + 12} textAnchor="middle"  fontFamily="monospace" fontSize="6" fill={W3.dim}>
          {i * 11}&apos;
        </text>
      ))}
      {/* Title */}
      <text x={80} y={padTop + chartH + 24} textAnchor="middle"  fontFamily="monospace" fontSize="7" fill={W3.mid}>
        MATCH FITNESS TRAJECTORY
      </text>
    </svg>
  );
}

// ===========================================================
// SVG COMPONENT 11: Team Performance Hex Radar
// ===========================================================
function TeamPerformanceHexRadar({
  performance,
  playerRating,
  homeScore,
  awayScore,
  events,
}: {
  performance: PerformanceBreakdown;
  playerRating: number;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
}): React.JSX.Element {
  const opponentConceded = homeScore + awayScore > 3 ? 25 : homeScore + awayScore > 1 ? 40 : 55;
  const playerCards = events.filter(e => e.type === 'yellow_card' || e.type === 'red_card' || e.type === 'second_yellow').length;
  const teamValues = [
    Math.min(95, Math.max(15, Math.round(performance.attacking * 0.45 + playerRating * 2 + homeScore * 5 + 15))),
    Math.min(95, Math.max(15, Math.round(performance.defensive * 0.5 + opponentConceded + 15))),
    Math.min(95, Math.max(15, Math.round((performance.creative + performance.stamina) * 0.3 + playerRating * 1.5 + 20))),
    Math.min(95, Math.max(15, Math.round(performance.creative * 0.55 + playerRating * 1.8 + 15))),
    Math.min(95, Math.max(15, Math.round(performance.stamina * 0.45 + playerRating * 2 + 20))),
    Math.min(95, Math.max(15, Math.round(70 - playerCards * 15 + playerRating * 0.5))),
  ];

  const opponentBase = 55 - Math.abs(playerRating - 6.5) * 2;
  const opponentValues = teamValues.map((v, i) => Math.min(90, Math.max(20, Math.round(opponentBase + (v - 55) * -0.4 + (i % 2 === 0 ? 1 : -1) * 0.5 + (i * 1.3 - 2)))));

  const cx = 80;
  const cy = 80;
  const r = 50;
  const labels = ['ATK', 'DEF', 'MID', 'CRE', 'PRS', 'DIS'];

  const gridRings = [0.33, 0.66, 1.0];

  const axisEndpoints = labels.reduce((acc, _label, i) => {
    const pt = polarToXY(cx, cy, r, i * 60 - 90);
    const labelPt = polarToXY(cx, cy, r + 14, i * 60 - 90);
    return [...acc, { endpoint: pt, labelPt, label: labels[i] }];
  }, [] as { endpoint: { x: number; y: number }; labelPt: { x: number; y: number }; label: string }[]);

  const teamPoints = computeRadarPoints(cx, cy, r, teamValues);
  const oppPoints = computeRadarPoints(cx, cy, r, opponentValues);
  const gridPointsList = gridRings.map(s => computeRadarPoints(cx, cy, r * s, [100, 100, 100, 100, 100, 100]));

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[200px] mx-auto">
      {/* Grid polygons */}
      {gridPointsList.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke={W3.border} strokeWidth="0.5" />
      ))}
      {/* Axis lines */}
      {axisEndpoints.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={a.endpoint.x} y2={a.endpoint.y} stroke={W3.border} strokeWidth="0.5" />
      ))}
      {/* Opponent polygon */}
      <polygon points={oppPoints} fill="none" stroke={W3.dim} strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      {/* Team polygon */}
      <polygon points={teamPoints} fill={`${W3.accent}18`} stroke={W3.accent} strokeWidth="1.5" />
      {/* Team dots */}
      {teamValues.map((v, i) => {
        const pt = polarToXY(cx, cy, r * (v / 100), i * 60 - 90);
        return <circle key={`t-${i}`} cx={pt.x} cy={pt.y} r="2.5" fill={W3.accent} />;
      })}
      {/* Labels */}
      {axisEndpoints.map((a, i) => (
        <text key={`l-${i}`} x={a.labelPt.x} y={a.labelPt.y} textAnchor="middle"  fontFamily="monospace" fontSize="8" fill={W3.mid}>
          {a.label}
        </text>
      ))}
      {/* Legend */}
      <line x1={30} y1={148} x2={46} y2={148} stroke={W3.accent} strokeWidth="1.5" />
      <text x={50} y={151} textAnchor="start"  fontFamily="monospace" fontSize="7" fill={W3.mid}>TEAM</text>
      <line x1={90} y1={148} x2={106} y2={148} stroke={W3.dim} strokeWidth="1" strokeDasharray="3 2" />
      <text x={110} y={151} textAnchor="start"  fontFamily="monospace" fontSize="7" fill={W3.dim}>OPP</text>
    </svg>
  );
}

// -----------------------------------------------------------
// Main Component
// -----------------------------------------------------------
export default function PostMatchAnalysis() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const match = gameState?.recentResults?.[0] ?? null;

  // Derived data (computed before early return)
  const performance = useMemo(() => {
    if (!match) return null;
    return calculatePerformanceBreakdown(
      match.playerGoals,
      match.playerAssists,
      match.playerMinutesPlayed,
      match.events,
      match.playerRating
    );
  }, [match]);

  const coachFeedback = useMemo(() => {
    if (!match) return null;
    return generateCoachFeedback(
      match.playerRating,
      match.playerGoals,
      match.playerAssists,
      match.playerMinutesPlayed
    );
  }, [match]);

  const last5Ratings = useMemo(() => {
    if (!gameState) return [];
    return gameState.recentResults.slice(0, 5).map(r => r.playerRating).filter(r => r > 0);
  }, [gameState]);

  const significantEvents = useMemo(() => {
    if (!match) return [];
    return match.events
      .filter(e => ['goal', 'own_goal', 'assist', 'yellow_card', 'red_card', 'second_yellow', 'substitution', 'injury', 'chance', 'save', 'penalty_won', 'penalty_missed', 'corner', 'free_kick'].includes(e.type))
      .sort((a, b) => a.minute - b.minute);
  }, [match]);

  const ratingTrend = useMemo(() => {
    if (last5Ratings.length < 3) return null;
    const recent = last5Ratings.slice(0, 2);
    const older = last5Ratings.slice(2);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    if (recentAvg - olderAvg > 0.3) return 'up' as const;
    if (olderAvg - recentAvg > 0.3) return 'down' as const;
    return 'stable' as const;
  }, [last5Ratings]);

  // ---- Empty State ----
  if (!gameState) return null;

  if (!match) {
    return (
      <div className="p-4 max-w-lg mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-[#484f58] mx-auto mb-4" />
              <h2 className="text-lg font-bold text-[#c9d1d9] mb-2">No Match Analysis</h2>
              <p className="text-sm text-[#8b949e] mb-6">
                Play a match to see your post-match analysis with detailed performance breakdowns and coaching feedback.
              </p>
              <Button
                onClick={() => setScreen('match_day')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Play a Match
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ---- Match Data ----
  const isPlayerHome = match.homeClub.id === gameState.currentClub.id;
  const playerClub = isPlayerHome ? match.homeClub : match.awayClub;
  const opponentClub = isPlayerHome ? match.awayClub : match.homeClub;
  const playerScore = isPlayerHome ? match.homeScore : match.awayScore;
  const opponentScore = isPlayerHome ? match.awayScore : match.homeScore;

  const won = playerScore > opponentScore;
  const drew = playerScore === opponentScore;
  const resultLabel = won ? 'VICTORY' : drew ? 'DRAW' : 'DEFEAT';
  const resultColor = won ? 'text-emerald-400' : drew ? 'text-amber-400' : 'text-red-400';
  const resultBg = won ? 'bg-emerald-500' : drew ? 'bg-amber-500' : 'bg-red-500';
  const resultEmoji = won ? '\uD83C\uDFC6' : drew ? '\uD83E\uDD1D' : '\uD83D\uDCAA';

  const competitionLabel = match.competition === 'league'
    ? 'League Match'
    : match.competition.charAt(0).toUpperCase() + match.competition.slice(1).replace('_', ' ');

  // ---- Data for SVG visualizations (plain variables, no useMemo) ----
  const playerFitness = gameState.player?.fitness ?? 75;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-400" />
          Post-Match Analysis
        </h2>
        <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
          Week {match.week} &middot; S{match.season}
        </Badge>
      </motion.div>

      {/* ============================================= */}
      {/* 1. Match Overview Card */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.2 }}
      >
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
          <div className={`h-1.5 ${resultBg}`} />
          <CardContent className="p-5">
            {/* Result label */}
            <div className="text-center mb-4">
              <p className={`text-sm font-bold tracking-wider ${resultColor}`}>
                {resultEmoji} {resultLabel}
              </p>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-5 mb-4">
              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {playerClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-semibold text-center leading-tight">
                  {playerClub.shortName || playerClub.name.slice(0, 3)}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    isPlayerHome
                      ? 'border-sky-500/30 text-sky-400'
                      : 'border-rose-500/30 text-rose-400'
                  }`}
                >
                  {isPlayerHome ? 'HOME' : 'AWAY'}
                </Badge>
              </div>

              <div className="flex flex-col items-center gap-1 min-w-[80px]">
                <div className="text-4xl font-black text-white tracking-wider">
                  {playerScore} <span className="text-[#484f58]">-</span> {opponentScore}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[#21262d] border border-[#30363d]">
                  {opponentClub.logo}
                </div>
                <span className="text-xs text-[#c9d1d9] font-semibold text-center leading-tight">
                  {opponentClub.shortName || opponentClub.name.slice(0, 3)}
                </span>
                <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
                  OPPONENT
                </Badge>
              </div>
            </div>

            {/* Competition & Date info */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-[#8b949e]">
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span>{competitionLabel}</span>
              </div>
              <span className="text-[#30363d]">&bull;</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Season {match.season}, Week {match.week}</span>
              </div>
              <span className="text-[#30363d]">&bull;</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{isPlayerHome ? 'Home' : 'Away'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* 2. Player Performance */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              Your Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-5">
              {/* Rating circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center ${getRatingBg(match.playerRating)}`}
                >
                  <span
                    className="text-3xl font-black tabular-nums leading-none"
                    style={{ color: getRatingColor(match.playerRating) }}
                  >
                    {match.playerRating.toFixed(1)}
                  </span>
                  <span className={`text-[8px] font-semibold mt-0.5 ${getRatingTextClass(match.playerRating)}`}>
                    {getMatchRatingLabel(match.playerRating)}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-[#8b949e]">Goals</span>
                  </div>
                  <span className={`text-sm font-bold ${match.playerGoals > 0 ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                    {match.playerGoals}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs text-[#8b949e]">Assists</span>
                  </div>
                  <span className={`text-sm font-bold ${match.playerAssists > 0 ? 'text-sky-400' : 'text-[#c9d1d9]'}`}>
                    {match.playerAssists}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#21262d] rounded-lg px-3 py-2 border border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8b949e]" />
                    <span className="text-xs text-[#8b949e]">Minutes</span>
                  </div>
                  <span className={`text-sm font-bold ${match.playerMinutesPlayed >= 90 ? 'text-emerald-400' : match.playerMinutesPlayed > 0 ? 'text-amber-400' : 'text-[#484f58]'}`}>
                    {match.playerMinutesPlayed}&apos;
                  </span>
                </div>
              </div>
            </div>

            {/* Sub status */}
            {!match.playerStarted && match.playerMinutesPlayed > 0 && (
              <div className="mt-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
                <p className="text-[10px] text-cyan-400 font-medium">
                  Subbed on in the {match.playerMinutesPlayed <= 45 ? '1st' : '2nd'} half
                </p>
              </div>
            )}
            {match.playerMinutesPlayed === 0 && (
              <div className="mt-3 bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2">
                <p className="text-[10px] text-[#8b949e] font-medium">
                  Unused substitute
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* 3. Performance Breakdown */}
      {/* ============================================= */}
      {performance && match.playerMinutesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-emerald-400" />
                Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <StatBar
                label="Attacking"
                value={performance.attacking}
                icon={<Target className="w-3.5 h-3.5 text-emerald-400" />}
                color="text-emerald-400"
                delay={0.2}
              />
              <StatBar
                label="Creative"
                value={performance.creative}
                icon={<Zap className="w-3.5 h-3.5 text-sky-400" />}
                color="text-sky-400"
                delay={0.25}
              />
              <StatBar
                label="Defensive"
                value={performance.defensive}
                icon={<Shield className="w-3.5 h-3.5 text-amber-400" />}
                color="text-amber-400"
                delay={0.3}
              />
              <StatBar
                label="Stamina"
                value={performance.stamina}
                icon={<Heart className="w-3.5 h-3.5 text-rose-400" />}
                color="text-rose-400"
                delay={0.35}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* 4. Match Events Timeline */}
      {/* ============================================= */}
      {significantEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Match Events Timeline
                </CardTitle>
                <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
                  {significantEvents.length} events
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {significantEvents.map((event, i) => {
                  const isPlayerEvent = event.playerId === gameState.player.id;
                  const isGoalEvent = event.type === 'goal' || event.type === 'own_goal';
                  const icon = getEventIcon(event.type);
                  const colorClass = getEventColor(event.type);
                  const bgClass = getEventBg(event.type);
                  const label = getEventLabel(event.type);
                  const isLast = i === significantEvents.length - 1;
                  const teamLabel = event.team === 'home' ? match.homeClub.shortName : event.team === 'away' ? match.awayClub.shortName : '';

                  return (
                    <motion.div
                      key={`${event.minute}-${event.type}-${i}`}
                      className="flex gap-3 relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 + i * 0.04, duration: 0.15 }}
                    >
                      <div className="flex flex-col items-center w-10 shrink-0">
                        <span className="text-[10px] font-mono text-[#8b949e] font-bold">
                          {event.minute}&apos;
                        </span>
                        <div className="flex-1 flex flex-col items-center mt-1">
                          <div
                            className={`w-2.5 h-2.5 rounded-sm shrink-0 z-10 ${
                              isGoalEvent ? 'bg-emerald-400' : isPlayerEvent ? 'bg-amber-400' : 'bg-[#484f58]'
                            }`}
                          />
                          {!isLast && <div className="w-px flex-1 bg-[#30363d] mt-0.5" />}
                        </div>
                      </div>
                      <div
                        className={`flex-1 mb-2 ml-1 rounded-lg border px-3 py-2 ${bgClass} ${
                          isPlayerEvent ? 'ring-1 ring-amber-400/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm leading-none">{icon}</span>
                          <span className={`text-[11px] font-semibold ${colorClass}`}>{label}</span>
                          {isPlayerEvent && (
                            <Badge className="text-[8px] px-1 py-0 h-3.5 bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold">
                              YOU
                            </Badge>
                          )}
                          {isGoalEvent && (
                            <Badge className="text-[8px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold">
                              {match.homeScore} - {match.awayScore}
                            </Badge>
                          )}
                        </div>
                        {(event.playerName || event.detail) && (
                          <p className="text-[10px] text-[#c9d1d9] mt-0.5 leading-snug">
                            {event.playerName && (
                              <span className="text-[#c9d1d9] font-medium">{event.playerName}</span>
                            )}
                            {event.playerName && event.detail && (
                              <span className="text-[#8b949e]"> &mdash; </span>
                            )}
                            {event.detail && (
                              <span className="text-[#8b949e]">{event.detail}</span>
                            )}
                          </p>
                        )}
                        {teamLabel && !event.playerName && (
                          <p className="text-[9px] text-[#8b949e] mt-0.5">{teamLabel}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* 5. Rating History */}
      {/* ============================================= */}
      {last5Ratings.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.2 }}
        >
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3 text-emerald-400" />
                  Rating History
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  {ratingTrend === 'up' && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">
                      <TrendingUp className="w-2.5 h-2.5 mr-1" />
                      Improving
                    </Badge>
                  )}
                  {ratingTrend === 'down' && (
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px]">
                      <TrendingDown className="w-2.5 h-2.5 mr-1" />
                      Declining
                    </Badge>
                  )}
                  {ratingTrend === 'stable' && (
                    <Badge className="bg-slate-500/15 text-[#8b949e] border-slate-500/25 text-[10px]">
                      <Minus className="w-2.5 h-2.5 mr-1" />
                      Stable
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Mini bar chart */}
              <div className="flex items-end gap-1.5 h-24 mb-2">
                {last5Ratings.map((rating, i) => (
                  <MiniRatingBar key={i} rating={rating} index={i} />
                ))}
              </div>

              {/* Best/Worst summary */}
              {last5Ratings.length >= 2 && (
                <div className="flex gap-3 justify-center pt-2 border-t border-[#30363d]">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-[#8b949e]">Best:</span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: getRatingColor(Math.max(...last5Ratings)) }}
                    >
                      {Math.max(...last5Ratings).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    <span className="text-[10px] text-[#8b949e]">Worst:</span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: getRatingColor(Math.min(...last5Ratings)) }}
                    >
                      {Math.min(...last5Ratings).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3 text-[#8b949e]" />
                    <span className="text-[10px] text-[#8b949e]">Avg:</span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: getRatingColor(last5Ratings.reduce((a, b) => a + b, 0) / last5Ratings.length) }}
                    >
                      {(last5Ratings.reduce((a, b) => a + b, 0) / last5Ratings.length).toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* 6. Coach Feedback */}
      {/* ============================================= */}
      {coachFeedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
        >
          <Card className={`border ${coachFeedback.bgColor}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${coachFeedback.color} bg-[#21262d]`}>
                  {coachFeedback.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className={`w-3.5 h-3.5 ${coachFeedback.color}`} />
                    <span className={`text-xs font-bold ${coachFeedback.color}`}>
                      Coach&apos;s Feedback
                    </span>
                    <Badge
                      className={`text-[8px] px-1.5 py-0 h-4 border-0 font-bold ${
                        coachFeedback.level === 'excellent'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : coachFeedback.level === 'good'
                          ? 'bg-emerald-600/15 text-emerald-500'
                          : coachFeedback.level === 'average'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {coachFeedback.level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className={`text-sm font-bold ${coachFeedback.color} mb-1`}>
                    {coachFeedback.title}
                  </p>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    {coachFeedback.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================================= */}
      {/* NEW SVG VISUALIZATIONS */}
      {/* ============================================================= */}

      {/* ============================================= */}
      {/* SVG 1: Match Rating Gauge */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38, duration: 0.3 }}
      >
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
              <Activity className="w-3 h-3" style={{ color: W3.accent }} />
              Match Rating Gauge
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <MatchRatingGauge rating={match.playerRating} />
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* SVG 2: Performance Pentagon Radar */}
      {/* ============================================= */}
      {performance && match.playerMinutesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42, duration: 0.3 }}
        >
          <Card className="bg-[#0a0a0a] border-[#222222]">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
                <Target className="w-3 h-3" style={{ color: W3.lime }} />
                Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <PerformancePentagonRadar performance={performance} playerRating={match.playerRating} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* SVG 3: Shot Distribution Donut */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.46, duration: 0.3 }}
      >
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
              <Target className="w-3 h-3" style={{ color: W3.accent }} />
              Shot Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <ShotDistributionDonut events={match.events} playerRating={match.playerRating} />
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* SVG 4: Passing Accuracy Bars */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.50, duration: 0.3 }}
      >
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
              <Zap className="w-3 h-3" style={{ color: W3.cyan }} />
              Passing Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <PassingAccuracyBars playerRating={match.playerRating} />
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* SVG 5: Match Events Timeline (SVG) */}
      {/* ============================================= */}
      {significantEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.54, duration: 0.3 }}
        >
          <Card className="bg-[#0a0a0a] border-[#222222]">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
                <Clock className="w-3 h-3" style={{ color: W3.lime }} />
                Match Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <MatchEventsTimelineSVG events={match.events} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* SVG 6: Player Comparison Bar */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.58, duration: 0.3 }}
      >
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3" style={{ color: W3.cyan }} />
              Player Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <PlayerComparisonBar
              goals={match.playerGoals}
              assists={match.playerAssists}
              rating={match.playerRating}
              minutes={match.playerMinutesPlayed}
              playerRating={match.playerRating}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* SVG 7: Possession Split Ring */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.62, duration: 0.3 }}
      >
        <Card className="bg-[#0a0a0a] border-[#222222]">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
              <Activity className="w-3 h-3" style={{ color: W3.cyan }} />
              Possession Split
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <PossessionSplitRing
              isHome={isPlayerHome}
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              playerRating={match.playerRating}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================= */}
      {/* SVG 8: Key Moments Scatter */}
      {/* ============================================= */}
      {significantEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.66, duration: 0.3 }}
        >
          <Card className="bg-[#0a0a0a] border-[#222222]">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
                <Star className="w-3 h-3" style={{ color: W3.lime }} />
                Key Moments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <KeyMomentsScatter events={match.events} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* SVG 9: Formation Contribution Bars */}
      {/* ============================================= */}
      {performance && match.playerMinutesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.70, duration: 0.3 }}
        >
          <Card className="bg-[#0a0a0a] border-[#222222]">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
                <Shield className="w-3 h-3" style={{ color: W3.accent }} />
                Formation Contribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <FormationContributionBars
                performance={performance}
                playerRating={match.playerRating}
                goals={match.playerGoals}
                assists={match.playerAssists}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* SVG 10: Fitness Impact Area Chart */}
      {/* ============================================= */}
      {match.playerMinutesPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.74, duration: 0.3 }}
        >
          <Card className="bg-[#0a0a0a] border-[#222222]">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
                <Heart className="w-3 h-3" style={{ color: W3.cyan }} />
                Fitness Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <FitnessImpactAreaChart
                fitness={playerFitness}
                minutes={match.playerMinutesPlayed}
                playerRating={match.playerRating}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* SVG 11: Team Performance Hex Radar */}
      {/* ============================================= */}
      {performance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.78, duration: 0.3 }}
        >
          <Card className="bg-[#0a0a0a] border-[#222222]">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-[#999999] font-semibold flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3" style={{ color: W3.accent }} />
                Team Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <TeamPerformanceHexRadar
                performance={performance}
                playerRating={match.playerRating}
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                events={match.events}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ============================================= */}
      {/* Action Buttons */}
      {/* ============================================= */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.2 }}
        className="space-y-2"
      >
        <Button
          onClick={() => setScreen('dashboard')}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue to Dashboard
        </Button>
        <Button
          onClick={() => setScreen('analytics')}
          variant="outline"
          className="w-full h-10 border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] rounded-lg text-xs flex items-center justify-center gap-2"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          View Full Analytics
        </Button>
      </motion.div>
    </div>
  );
}
