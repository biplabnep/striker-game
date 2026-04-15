'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Heart,
  Shield,
  Swords,
  Star,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  UserCheck,
  Crown,
  Flame,
  ChevronDown,
  ChevronUp,
  Handshake,
  Clock,
  Minus,
  Zap,
  Award,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Relationship,
  RelationshipType,
  RelationshipLevel,
  TeamDynamics,
} from '@/lib/game/types';
import {
  getRelationshipLevel,
  getAffinityColor,
  getAffinityBarColor,
  getAtmosphereLabel,
} from '@/lib/game/relationshipsEngine';

// ============================================================
// Helper: Relationship type icon
// ============================================================
function getRelTypeIcon(type: RelationshipType) {
  switch (type) {
    case 'teammate':
      return <Users className="h-4 w-4" />;
    case 'coach':
      return <Shield className="h-4 w-4" />;
    case 'rival':
      return <Swords className="h-4 w-4" />;
    case 'mentor':
      return <Star className="h-4 w-4" />;
    case 'agent':
      return <Handshake className="h-4 w-4" />;
    case 'media':
      return <MessageCircle className="h-4 w-4" />;
    case 'fan_favorite':
      return <Heart className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
}

// ============================================================
// Helper: Relationship type label
// ============================================================
function getRelTypeLabel(type: RelationshipType): string {
  switch (type) {
    case 'teammate': return 'Teammate';
    case 'coach': return 'Coach';
    case 'rival': return 'Rival';
    case 'mentor': return 'Mentor';
    case 'agent': return 'Agent';
    case 'media': return 'Media';
    case 'fan_favorite': return 'Fan Favourite';
    default: return type;
  }
}

// ============================================================
// Helper: Relationship type badge color
// ============================================================
function getRelTypeBadgeColor(type: RelationshipType): string {
  switch (type) {
    case 'teammate': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
    case 'coach': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    case 'rival': return 'bg-red-500/15 text-red-400 border-red-500/20';
    case 'mentor': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
    case 'agent': return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
    case 'media': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20';
    case 'fan_favorite': return 'bg-pink-500/15 text-pink-400 border-pink-500/20';
    default: return 'bg-slate-500/15 text-[#8b949e] border-slate-500/20';
  }
}

// ============================================================
// Helper: Relationship type border color (left stripe)
// ============================================================
function getRelTypeBorderColor(type: RelationshipType): string {
  switch (type) {
    case 'teammate': return 'border-l-blue-500';
    case 'coach': return 'border-l-emerald-500';
    case 'rival': return 'border-l-red-500';
    case 'mentor': return 'border-l-amber-500';
    case 'agent': return 'border-l-purple-500';
    case 'media': return 'border-l-cyan-500';
    case 'fan_favorite': return 'border-l-pink-500';
    default: return 'border-l-slate-500';
  }
}

// ============================================================
// Helper: Relationship type dot color
// ============================================================
function getRelTypeDotColor(type: RelationshipType): string {
  switch (type) {
    case 'teammate': return 'bg-blue-500';
    case 'coach': return 'bg-emerald-500';
    case 'rival': return 'bg-red-500';
    case 'mentor': return 'bg-amber-500';
    case 'agent': return 'bg-purple-500';
    case 'media': return 'bg-cyan-500';
    case 'fan_favorite': return 'bg-pink-500';
    default: return 'bg-slate-500';
  }
}

// ============================================================
// Helper: Relationship type avatar background color
// ============================================================
function getRelTypeAvatarBg(type: RelationshipType): string {
  switch (type) {
    case 'teammate': return 'bg-blue-500/20';
    case 'coach': return 'bg-emerald-500/20';
    case 'rival': return 'bg-red-500/20';
    case 'mentor': return 'bg-amber-500/20';
    case 'agent': return 'bg-purple-500/20';
    case 'media': return 'bg-cyan-500/20';
    case 'fan_favorite': return 'bg-pink-500/20';
    default: return 'bg-slate-500/20';
  }
}

// ============================================================
// Helper: Relationship type avatar text color
// ============================================================
function getRelTypeAvatarText(type: RelationshipType): string {
  switch (type) {
    case 'teammate': return 'text-blue-400';
    case 'coach': return 'text-emerald-400';
    case 'rival': return 'text-red-400';
    case 'mentor': return 'text-amber-400';
    case 'agent': return 'text-purple-400';
    case 'media': return 'text-cyan-400';
    case 'fan_favorite': return 'text-pink-400';
    default: return 'text-slate-400';
  }
}

// ============================================================
// Helper: Relationship level badge color
// ============================================================
function getLevelBadgeStyle(level: RelationshipLevel): string {
  switch (level) {
    case 'legendary': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'close': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'friendly': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'neutral': return 'bg-slate-500/20 text-[#c9d1d9] border-slate-500/30';
    case 'cold': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'hostile': return 'bg-red-500/20 text-red-300 border-red-500/30';
    default: return 'bg-slate-500/20 text-[#c9d1d9] border-slate-500/30';
  }
}

// ============================================================
// Helper: Position badge color
// ============================================================
function getPositionColor(position: string): string {
  if (['ST', 'LW', 'RW'].includes(position)) return 'bg-red-500/15 text-red-400';
  if (['CAM', 'CM', 'CDM'].includes(position)) return 'bg-green-500/15 text-green-400';
  if (['CB', 'LB', 'RB'].includes(position)) return 'bg-blue-500/15 text-blue-400';
  if (position === 'GK') return 'bg-amber-500/15 text-amber-400';
  return 'bg-slate-500/15 text-[#8b949e]';
}

// ============================================================
// Helper: Trait badge style
// ============================================================
function getTraitStyle(trait: string): string {
  switch (trait) {
    case 'supportive': return 'bg-emerald-500/15 text-emerald-400';
    case 'competitive': return 'bg-red-500/15 text-red-400';
    case 'jealous': return 'bg-orange-500/15 text-orange-400';
    case 'loyal': return 'bg-blue-500/15 text-blue-400';
    case 'ambitious': return 'bg-amber-500/15 text-amber-400';
    case 'relaxed': return 'bg-cyan-500/15 text-cyan-400';
    default: return 'bg-slate-500/15 text-[#8b949e]';
  }
}

// ============================================================
// Helper: Get initials from a name
// ============================================================
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ============================================================
// Helper: Simulate "last interaction" time from history
// ============================================================
function getLastInteractionTime(history: string[], currentWeek: number): string {
  if (history.length === 0) return 'Never';
  const historyCount = history.length;
  // Use history length and a simple formula to simulate realistic time gaps
  const daysAgo = Math.max(1, Math.min(historyCount * 3, 30));
  if (daysAgo <= 1) return 'Today';
  if (daysAgo < 7) return `${daysAgo}d ago`;
  if (daysAgo < 14) return '1w ago';
  if (daysAgo < 21) return '2w ago';
  return `${Math.round(daysAgo / 7)}w ago`;
}

// ============================================================
// Helper: Derive relationship trend from history
// ============================================================
function getRelationshipTrend(
  history: string[]
): { direction: 'up' | 'down' | 'neutral'; value: number } {
  if (history.length < 2) return { direction: 'neutral', value: 0 };

  // Analyze last few history entries for sentiment
  const recentEntries = history.slice(-3);
  let positiveCount = 0;
  let negativeCount = 0;

  const positiveKeywords = [
    'celebrated', 'praised', 'helped', 'together', 'acknowledged',
    'advice', 'invited', 'improvement', 'Appointed', 'under their wing',
    'Joined', 'outperformed', 'goals', 'Outstanding', 'coffee',
    'career advice', 'experience', 'wing',
  ];
  const negativeKeywords = [
    'argument', 'heated', 'criticized', 'disagreed', 'snide',
    'disappointment', 'poor', 'red card', 'Competing', 'competitive',
  ];

  for (const entry of recentEntries) {
    const lower = entry.toLowerCase();
    const hasPositive = positiveKeywords.some((k) => lower.includes(k.toLowerCase()));
    const hasNegative = negativeKeywords.some((k) => lower.includes(k.toLowerCase()));
    if (hasPositive && !hasNegative) positiveCount++;
    else if (hasNegative && !hasPositive) negativeCount++;
  }

  if (positiveCount > negativeCount) return { direction: 'up', value: positiveCount };
  if (negativeCount > positiveCount) return { direction: 'down', value: negativeCount };
  return { direction: 'neutral', value: 0 };
}

// ============================================================
// Helper: Trait compatibility between player and NPC
// ============================================================
function getTraitCompatibility(
  npcTrait: string | undefined,
  relationshipType: RelationshipType
): { label: string; positive: boolean } | null {
  if (!npcTrait) return null;

  // Positive combos
  const positiveCombos: Array<{ trait: string; type: RelationshipType; label: string }> = [
    { trait: 'supportive', type: 'teammate', label: 'Great synergy' },
    { trait: 'supportive', type: 'coach', label: 'Trust building' },
    { trait: 'supportive', type: 'mentor', label: 'Natural fit' },
    { trait: 'loyal', type: 'teammate', label: 'Reliable ally' },
    { trait: 'ambitious', type: 'mentor', label: 'Driven duo' },
    { trait: 'relaxed', type: 'teammate', label: 'Easy going' },
    { trait: 'competitive', type: 'rival', label: 'Mutual fire' },
  ];

  // Negative combos
  const negativeCombos: Array<{ trait: string; type: RelationshipType; label: string }> = [
    { trait: 'jealous', type: 'teammate', label: 'Tension risk' },
    { trait: 'competitive', type: 'teammate', label: 'Clash potential' },
    { trait: 'jealous', type: 'coach', label: 'Bias risk' },
  ];

  const posMatch = positiveCombos.find((c) => c.trait === npcTrait && c.type === relationshipType);
  if (posMatch) return { label: posMatch.label, positive: true };

  const negMatch = negativeCombos.find((c) => c.trait === npcTrait && c.type === relationshipType);
  if (negMatch) return { label: negMatch.label, positive: false };

  return null;
}

// ============================================================
// Helper: Team mood face SVG based on morale
// ============================================================
function TeamMoodIndicator({ morale }: { morale: number }) {
  const mood = morale >= 70 ? 'happy' : morale >= 40 ? 'neutral' : 'sad';
  const bgClass = morale >= 70 ? 'bg-emerald-500/15' : morale >= 40 ? 'bg-amber-500/15' : 'bg-red-500/15';
  const textColor = morale >= 70 ? 'text-emerald-400' : morale >= 40 ? 'text-amber-400' : 'text-red-400';
  const label = morale >= 70 ? 'Happy' : morale >= 40 ? 'Steady' : 'Struggling';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${bgClass}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Face circle */}
        <circle cx="16" cy="16" r="14" stroke={mood === 'happy' ? '#34d399' : mood === 'neutral' ? '#fbbf24' : '#f87171'} strokeWidth="2" fill="none" />
        {/* Left eye */}
        <circle cx="11" cy="13" r="1.5" fill={mood === 'happy' ? '#34d399' : mood === 'neutral' ? '#fbbf24' : '#f87171'} />
        {/* Right eye */}
        <circle cx="21" cy="13" r="1.5" fill={mood === 'happy' ? '#34d399' : mood === 'neutral' ? '#fbbf24' : '#f87171'} />
        {/* Mouth */}
        {mood === 'happy' && (
          <path d="M10 19 Q16 25 22 19" stroke="#34d399" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
        {mood === 'neutral' && (
          <path d="M11 20 L21 20" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
        )}
        {mood === 'sad' && (
          <path d="M10 23 Q16 17 22 23" stroke="#f87171" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
      </svg>
      <div>
        <div className={`text-sm font-semibold ${textColor}`}>{label}</div>
        <div className="text-[10px] text-[#8b949e]">Team Mood</div>
      </div>
    </div>
  );
}

// ============================================================
// Helper: SVG Hexagonal Radar Chart
// ============================================================
function RadarChart({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const size = 180;
  const center = size / 2;
  const maxRadius = 70;
  const axes = 6;
  const angleStep = (2 * Math.PI) / axes;
  const startAngle = -Math.PI / 2; // Start from top

  // Generate hexagon points for the background grid
  const getHexPoints = (radius: number) => {
    const pts: string[] = [];
    for (let i = 0; i < axes; i++) {
      const angle = startAngle + i * angleStep;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  };

  // Generate data polygon points
  const dataPoints: string[] = [];
  for (let i = 0; i < axes; i++) {
    const angle = startAngle + i * angleStep;
    const val = Math.max(0, Math.min(100, values[i] ?? 0));
    const r = (val / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    dataPoints.push(`${x},${y}`);
  }

  // Label positions (slightly further out than max radius)
  const labelPositions = labels.map((label, i) => {
    const angle = startAngle + i * angleStep;
    const r = maxRadius + 16;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    // Text anchor based on position
    let anchor: 'start' | 'middle' | 'end' = 'middle';
    if (x < center - 5) anchor = 'end';
    else if (x > center + 5) anchor = 'start';
    return { x, y, label, anchor };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      {/* Grid hexagons (25%, 50%, 75%, 100%) */}
      {[0.25, 0.5, 0.75, 1].map((scale, idx) => (
        <polygon
          key={idx}
          points={getHexPoints(maxRadius * scale)}
          fill="none"
          stroke={idx === 3 ? '#30363d' : '#21262d'}
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {Array.from({ length: axes }).map((_, i) => {
        const angle = startAngle + i * angleStep;
        const x = center + maxRadius * Math.cos(angle);
        const y = center + maxRadius * Math.sin(angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#30363d"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <motion.polygon
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        points={dataPoints.join(' ')}
        fill="rgba(52, 211, 153, 0.15)"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {Array.from({ length: axes }).map((_, i) => {
        const angle = startAngle + i * angleStep;
        const val = Math.max(0, Math.min(100, values[i] ?? 0));
        const r = (val / 100) * maxRadius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="#34d399"
            stroke="#0d1117"
            strokeWidth="1"
          />
        );
      })}

      {/* Labels */}
      {labelPositions.map((lp, i) => (
        <text
          key={i}
          x={lp.x}
          y={lp.y}
          textAnchor={lp.anchor}
          dominantBaseline="middle"
          className="text-[9px] fill-[#8b949e]"
        >
          {lp.label}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// Sub-component: Team Dynamics Card (ENHANCED)
// ============================================================
function TeamDynamicsCard({ dynamics, squadSize }: { dynamics: TeamDynamics; squadSize: number }) {
  const atmosphere = getAtmosphereLabel(dynamics.dressingRoomAtmosphere);

  // Derive communication and trust from morale + cohesion
  const communication = Math.round((dynamics.cohesion * 0.6 + dynamics.morale * 0.4));
  const trust = Math.round((dynamics.cohesion * 0.5 + dynamics.morale * 0.3 + dynamics.playerInfluence * 0.2));

  const radarValues = [
    dynamics.morale,
    dynamics.cohesion,
    dynamics.playerInfluence,
    dynamics.captainRating,
    communication,
    trust,
  ];

  const radarLabels = ['Morale', 'Cohesion', 'Influence', 'Leadership', 'Comm.', 'Trust'];

  // Average age: derive a plausible value from the dynamics
  const avgAge = Math.round(24 + (dynamics.cohesion / 100) * 4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg bg-[#161b22] border border-[#30363d] p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15">
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Team Dynamics</h2>
        </div>
        <TeamMoodIndicator morale={dynamics.morale} />
      </div>

      {/* Atmosphere Badge */}
      <div className="mb-4">
        <span className="text-xs text-[#8b949e] mb-1.5 block">Dressing Room Atmosphere</span>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${atmosphere.color}`}>
          <span>{atmosphere.icon}</span>
          <span>{atmosphere.label}</span>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="mb-4">
        <span className="text-xs text-[#8b949e] mb-2 block text-center">Team Chemistry Profile</span>
        <RadarChart values={radarValues} labels={radarLabels} />
      </div>

      {/* Squad Stats Row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
          <Users className="h-3.5 w-3.5 text-blue-400 mx-auto mb-1" />
          <span className="text-sm font-bold text-white">{squadSize}</span>
          <span className="block text-[10px] text-[#8b949e]">Squad Size</span>
        </div>
        <div className="bg-[#21262d] rounded-lg p-2.5 text-center">
          <Clock className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1" />
          <span className="text-sm font-bold text-white">{avgAge}</span>
          <span className="block text-[10px] text-[#8b949e]">Average Age</span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {/* Morale */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#8b949e] flex items-center gap-1">
              <Heart className="h-3 w-3" /> Team Morale
            </span>
            <span className={`text-xs font-semibold ${dynamics.morale >= 70 ? 'text-emerald-400' : dynamics.morale >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {dynamics.morale}%
            </span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dynamics.morale}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`h-full rounded-lg ${
                dynamics.morale >= 70 ? 'bg-emerald-500' : dynamics.morale >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Cohesion */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#8b949e] flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Cohesion
            </span>
            <span className={`text-xs font-semibold ${dynamics.cohesion >= 70 ? 'text-emerald-400' : dynamics.cohesion >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {dynamics.cohesion}%
            </span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dynamics.cohesion}%` }}
              transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
              className={`h-full rounded-lg ${
                dynamics.cohesion >= 70 ? 'bg-emerald-500' : dynamics.cohesion >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Influence + Captain */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-[#21262d] rounded-lg p-3 text-center">
            <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
            <span className="text-lg font-bold text-white">{dynamics.playerInfluence}</span>
            <span className="block text-[10px] text-[#8b949e] mt-0.5">Influence</span>
          </div>
          <div className="bg-[#21262d] rounded-lg p-3 text-center">
            <Crown className="h-4 w-4 text-amber-400 mx-auto mb-1" />
            <span className="text-lg font-bold text-white">{dynamics.captainRating}</span>
            <span className="block text-[10px] text-[#8b949e] mt-0.5">Leadership</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Sub-component: Relationship Trend Badge
// ============================================================
function TrendBadge({ trend }: { trend: { direction: 'up' | 'down' | 'neutral'; value: number } }) {
  if (trend.direction === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-400">
        <TrendingUp className="h-3 w-3" />+{trend.value}
      </span>
    );
  }
  if (trend.direction === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-400">
        <TrendingDown className="h-3 w-3" />-{trend.value}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#8b949e]">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

// ============================================================
// Sub-component: Trait Compatibility Badge
// ============================================================
function TraitCompatBadge({
  npcTrait,
  relType,
}: {
  npcTrait: string | undefined;
  relType: RelationshipType;
}) {
  const compat = getTraitCompatibility(npcTrait, relType);
  if (!compat) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded ${
        compat.positive
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
          : 'bg-red-500/10 text-red-400 border border-red-500/15'
      }`}
    >
      {compat.positive ? <Sparkles className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
      {compat.label}
    </span>
  );
}

// ============================================================
// Sub-component: Relationship Card (ENHANCED)
// ============================================================
function RelationshipCard({
  rel,
  index,
  currentWeek,
  onPromote,
}: {
  rel: Relationship;
  index: number;
  currentWeek: number;
  onPromote: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const trend = getRelationshipTrend(rel.history);
  const lastTime = getLastInteractionTime(rel.history, currentWeek);
  const borderClass = getRelTypeBorderColor(rel.type);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={`rounded-lg border-l-2 ${borderClass} border-r border-t border-b ${
        rel.isCurrent
          ? 'bg-[#161b22] border-[#30363d]'
          : 'bg-[#161b22]/40 border-[#30363d] opacity-60'
      }  overflow-hidden`}
    >
      {/* Main row */}
      <div
        className="p-3 cursor-pointer hover:bg-[#21262d] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Type icon */}
          <div className={`p-2 rounded-lg ${getRelTypeBadgeColor(rel.type)} border shrink-0`}>
            {getRelTypeIcon(rel.type)}
          </div>

          {/* Name & details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm truncate">{rel.name}</span>
              {rel.position && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getPositionColor(rel.position)}`}>
                  {rel.position}
                </span>
              )}
              {!rel.isCurrent && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-700/50 text-[#8b949e]">
                  Former
                </span>
              )}
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getRelTypeBadgeColor(rel.type)}`}>
                {getRelTypeLabel(rel.type)}
              </Badge>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getLevelBadgeStyle(rel.level)}`}>
                {rel.level}
              </Badge>
              {rel.trait && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getTraitStyle(rel.trait)}`}>
                  {rel.trait}
                </Badge>
              )}
              <TraitCompatBadge npcTrait={rel.trait} relType={rel.type} />
            </div>

            {/* Last interaction + trend */}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-[#484f58] flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {lastTime}
              </span>
              <TrendBadge trend={trend} />
            </div>
          </div>

          {/* Affinity */}
          <div className="flex flex-col items-end shrink-0">
            <span className={`text-sm font-bold ${getAffinityColor(rel.affinity)}`}>
              {rel.affinity}
            </span>
            <div className="w-16 h-1.5 bg-[#21262d] rounded-lg overflow-hidden mt-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rel.affinity}%` }}
                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.2 }}
                className={`h-full rounded-lg ${getAffinityBarColor(rel.affinity)}`}
              />
            </div>
          </div>

          {/* Expand icon */}
          <div className="shrink-0 text-[#8b949e]">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-[#30363d]">
              {/* Full affinity bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#8b949e]">Affinity</span>
                  <span className={`text-xs font-semibold ${getAffinityColor(rel.affinity)}`}>
                    {rel.affinity}/100
                  </span>
                </div>
                <Progress value={rel.affinity} className="h-2" />
              </div>

              {/* History */}
              {rel.history.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-[#8b949e] mb-1.5 block">Key Moments</span>
                  <div className="space-y-1">
                    {rel.history.slice().reverse().map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                        <span className="text-[#c9d1d9]">{entry}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promote button */}
              {rel.isCurrent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPromote(rel.id);
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Spend Time Together (+5)
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Sub-component: Key Relationship Featured Card
// ============================================================
function KeyRelationshipCard({
  rel,
  rank,
  onPromote,
}: {
  rel: Relationship;
  rank: number;
  onPromote: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: rank * 0.1 }}
      className="rounded-lg bg-[#161b22] border border-[#30363d] p-3 relative"
    >
      {/* Rank badge */}
      <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
        <span className="text-[10px] font-bold text-emerald-400">#{rank + 1}</span>
      </div>

      <div className="flex items-center gap-3 mt-1">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-lg ${getRelTypeAvatarBg(rel.type)} flex items-center justify-center shrink-0 border border-[#30363d]`}>
          <span className={`text-sm font-bold ${getRelTypeAvatarText(rel.type)}`}>
            {getInitials(rel.name)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-white text-sm block truncate">{rel.name}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getRelTypeBadgeColor(rel.type)}`}>
              {getRelTypeLabel(rel.type)}
            </Badge>
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getLevelBadgeStyle(rel.level)}`}>
              {rel.level}
            </Badge>
          </div>
        </div>

        {/* Affinity */}
        <div className="text-right shrink-0">
          <span className={`text-lg font-bold ${getAffinityColor(rel.affinity)}`}>
            {rel.affinity}
          </span>
          <div className="w-14 h-1.5 bg-[#21262d] rounded-lg overflow-hidden mt-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rel.affinity}%` }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 + rank * 0.1 }}
              className={`h-full rounded-lg ${getAffinityBarColor(rel.affinity)}`}
            />
          </div>
        </div>
      </div>

      {/* Spend Time button */}
      {rel.isCurrent && (
        <button
          onClick={() => onPromote(rel.id)}
          className="mt-2.5 w-full py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <Zap className="h-3 w-3" />
          Spend Time
        </button>
      )}
    </motion.div>
  );
}

// ============================================================
// Sub-component: Relationship Tips
// ============================================================
function RelationshipTips({ relationships }: { relationships: Relationship[] }) {
  const currentRels = relationships.filter((r) => r.isCurrent);
  const tips: Array<{ text: string; icon: string; color: string }> = [];

  // Find rivalries
  const rivalries = currentRels.filter((r) => r.type === 'rival' && r.affinity < 40);
  if (rivalries.length > 0) {
    tips.push({
      text: `Your rivalry with ${rivalries[0].name} could motivate better performances on the pitch.`,
      icon: '🔥',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/15',
    });
  }

  // Find strong coach bonds
  const coach = currentRels.find((r) => r.type === 'coach' && r.affinity >= 70);
  if (coach) {
    tips.push({
      text: `Your bond with ${coach.name} is strengthening — expect more starts and tactical trust.`,
      icon: '⭐',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
    });
  }

  // Find supportive teammates
  const supportive = currentRels.filter((r) => r.type === 'teammate' && r.trait === 'supportive' && r.affinity >= 60);
  if (supportive.length > 0) {
    tips.push({
      text: `${supportive.length} supportive teammate${supportive.length > 1 ? 's' : ''} boosting your confidence — great chemistry building.`,
      icon: '🤝',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/15',
    });
  }

  // Find mentor relationship
  const mentor = currentRels.find((r) => r.type === 'mentor');
  if (mentor && mentor.affinity >= 65) {
    tips.push({
      text: `${mentor.name}'s mentorship is paying off — your development is accelerating.`,
      icon: '📈',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
    });
  }

  // Check for hostile relationships
  const hostile = currentRels.filter((r) => r.affinity < 20);
  if (hostile.length > 0) {
    tips.push({
      text: `${hostile.length} relationship${hostile.length > 1 ? 's' : ''} at breaking point. Consider spending time to repair.`,
      icon: '⚠️',
      color: 'text-red-400 bg-red-500/10 border-red-500/15',
    });
  }

  // Check for legendary bonds
  const legendary = currentRels.filter((r) => r.level === 'legendary');
  if (legendary.length > 0) {
    tips.push({
      text: `Legendary bond${legendary.length > 1 ? 's' : ''} with ${legendary.map((r) => r.name).join(', ')} — these connections define your career!`,
      icon: '🏆',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/15',
    });
  }

  // No tips
  if (tips.length === 0) {
    tips.push({
      text: 'Keep building your relationships — they shape your career trajectory.',
      icon: '💡',
      color: 'text-[#8b949e] bg-[#21262d] border-[#30363d]',
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="rounded-lg bg-[#161b22] border border-[#30363d] p-4 mb-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-amber-500/15">
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
        <h2 className="text-sm font-bold text-white">Relationship Tips</h2>
      </div>

      <div className="space-y-2">
        {tips.slice(0, 4).map((tip, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${tip.color}`}
          >
            <span className="shrink-0 text-sm">{tip.icon}</span>
            <p className="text-[11px] leading-relaxed">{tip.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function RelationshipsPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const promoteRelationshipLevel = useGameStore((s) => s.promoteRelationshipLevel);

  const [filter, setFilter] = useState<string>('all');

  const relationships = useMemo(
    () => gameState?.relationships ?? [],
    [gameState?.relationships]
  );

  const teamDynamics = useMemo(
    () => gameState?.teamDynamics,
    [gameState?.teamDynamics]
  );

  const currentWeek = gameState?.currentWeek ?? 1;

  const filteredRelationships = useMemo(() => {
    if (filter === 'all') return relationships;
    if (filter === 'current') return relationships.filter((r) => r.isCurrent);
    return relationships.filter((r) => r.type === filter);
  }, [relationships, filter]);

  // Count by type
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: relationships.length, current: relationships.filter((r) => r.isCurrent).length };
    for (const r of relationships) {
      c[r.type] = (c[r.type] ?? 0) + 1;
    }
    return c;
  }, [relationships]);

  // Current relationships for squad size
  const currentRelationships = useMemo(
    () => relationships.filter((r) => r.isCurrent),
    [relationships]
  );

  // Key relationships: top 3 strongest among current
  const keyRelationships = useMemo(() => {
    return [...currentRelationships]
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, 3);
  }, [currentRelationships]);

  // Strongest bond & biggest rivalry
  const strongestBond = useMemo(() => {
    return currentRelationships.length > 0
      ? [...currentRelationships].sort((a, b) => b.affinity - a.affinity)[0]
      : null;
  }, [currentRelationships]);

  const biggestRivalry = useMemo(() => {
    const rivals = currentRelationships.filter((r) => r.type === 'rival');
    return rivals.length > 0
      ? [...rivals].sort((a, b) => a.affinity - b.affinity)[0]
      : null;
  }, [currentRelationships]);

  // Relationship type summary for the colored dots bar
  const typeSummary = useMemo(() => {
    const typeList: RelationshipType[] = ['teammate', 'coach', 'rival', 'mentor', 'agent', 'media', 'fan_favorite'];
    return typeList
      .filter((t) => (counts[t] ?? 0) > 0)
      .map((t) => ({ type: t, count: counts[t] ?? 0 }));
  }, [counts]);

  if (!gameState || !teamDynamics) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center text-[#8b949e]">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No team data available</p>
      </div>
    );
  }

  // ================================================================
  // SVG 1: Relationship Network Diagram
  // ================================================================
  const renderRelationshipNetwork = (): React.JSX.Element => {
    const svgSize = 280;
    const cx = svgSize / 2;
    const cy = svgSize / 2;
    const r = 100;
    const nodeNames = ['You', 'Martinez', 'Silva', 'Chen', 'Okafor', 'Kowalski', 'Park', 'Dubois'];
    const nodeColors = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#22d3ee', '#f87171'];
    const connections = [
      { from: 0, to: 1, strength: 5 }, { from: 0, to: 2, strength: 3 },
      { from: 0, to: 3, strength: 4 }, { from: 0, to: 4, strength: 2 },
      { from: 1, to: 2, strength: 3 }, { from: 3, to: 5, strength: 4 },
      { from: 4, to: 6, strength: 3 }, { from: 5, to: 7, strength: 2 },
      { from: 0, to: 5, strength: 1 }, { from: 2, to: 7, strength: 2 },
    ];

    const buildConnectionLines = () => {
      return connections.map((c) => {
        const a1 = (-Math.PI / 2) + (c.from / 8) * 2 * Math.PI;
        const a2 = (-Math.PI / 2) + (c.to / 8) * 2 * Math.PI;
        return {
          x1: cx + r * Math.cos(a1), y1: cy + r * Math.sin(a1),
          x2: cx + r * Math.cos(a2), y2: cy + r * Math.sin(a2),
          w: c.strength,
        };
      });
    };
    const connLines = buildConnectionLines();

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-sky-400" /> Relationship Network
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full max-w-[280px] mx-auto" fill="none">
            {connLines.map((ln, i) => (
              <line key={i} x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2}
                stroke="#30363d" strokeWidth={ln.w} opacity={0.6} />
            ))}
            {nodeNames.map((name, i) => {
              const angle = (-Math.PI / 2) + (i / 8) * 2 * Math.PI;
              const nx = cx + r * Math.cos(angle);
              const ny = cy + r * Math.sin(angle);
              return (
                <g key={i}>
                  <circle cx={nx} cy={ny} r="16" fill="#0d1117" stroke={nodeColors[i]} strokeWidth="2" />
                  <text x={nx} y={ny} textAnchor="middle" dominantBaseline="middle" className="text-[7px] fill-[#c9d1d9]">{name.slice(0, 3)}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 2: Team Chemistry Hex Radar
  // ================================================================
  const renderTeamChemistryHexRadar = (): React.JSX.Element => {
    const svgSize = 220;
    const c = svgSize / 2;
    const maxR = 80;
    const axes = 6;
    const step = (2 * Math.PI) / axes;
    const start = -Math.PI / 2;
    const chemValues = [teamDynamics.morale, teamDynamics.cohesion, teamDynamics.playerInfluence, teamDynamics.captainRating,
      Math.round(teamDynamics.cohesion * 0.6 + teamDynamics.morale * 0.4),
      Math.round(teamDynamics.cohesion * 0.5 + teamDynamics.morale * 0.3 + teamDynamics.playerInfluence * 0.2)];
    const chemLabels = ['Comm.', 'Trust', 'Leader.', 'Unity', 'Morale', 'Respect'];

    const buildHexPts = (radius: number): string => {
      const pts: string[] = [];
      for (let i = 0; i < axes; i++) {
        const a = start + i * step;
        pts.push(`${c + radius * Math.cos(a)},${c + radius * Math.sin(a)}`);
      }
      return pts.join(' ');
    };

    const buildDataPts = (): string => {
      const pts: string[] = [];
      for (let i = 0; i < axes; i++) {
        const a = start + i * step;
        const v = Math.max(0, Math.min(100, chemValues[i] ?? 0));
        const dr = (v / 100) * maxR;
        pts.push(`${c + dr * Math.cos(a)},${c + dr * Math.sin(a)}`);
      }
      return pts.join(' ');
    };
    const dataStr = buildDataPts();

    const labelData = chemLabels.map((lbl, i) => {
      const a = start + i * step;
      const lr = maxR + 18;
      const lx = c + lr * Math.cos(a);
      const ly = c + lr * Math.sin(a);
      let anchor: 'start' | 'middle' | 'end' = 'middle';
      if (lx < c - 5) anchor = 'end';
      else if (lx > c + 5) anchor = 'start';
      return { lx, ly, lbl, anchor };
    });

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-emerald-400" /> Team Chemistry Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full max-w-[220px]" fill="none">
            {[0.25, 0.5, 0.75, 1].map((s, i) => (
              <polygon key={i} points={buildHexPts(maxR * s)} fill="none" stroke={i === 3 ? '#30363d' : '#21262d'} strokeWidth="1" />
            ))}
            {Array.from({ length: axes }).map((_, i) => {
              const a = start + i * step;
              return (
                <line key={i} x1={c} y1={c} x2={c + maxR * Math.cos(a)} y2={c + maxR * Math.sin(a)} stroke="#30363d" strokeWidth="1" />
              );
            })}
            <polygon points={dataStr} fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
            {Array.from({ length: axes }).map((_, i) => {
              const a = start + i * step;
              const v = Math.max(0, Math.min(100, chemValues[i] ?? 0));
              const dr = (v / 100) * maxR;
              return (
                <circle key={i} cx={c + dr * Math.cos(a)} cy={c + dr * Math.sin(a)} r="3" fill="#38bdf8" stroke="#0d1117" strokeWidth="1" />
              );
            })}
            {labelData.map((ld, i) => (
              <text key={i} x={ld.lx} y={ld.ly} textAnchor={ld.anchor} dominantBaseline="middle" className="text-[8px] fill-[#8b949e]">{ld.lbl}</text>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 3: Relationship Strength Donut
  // ================================================================
  const renderRelationshipStrengthDonut = (): React.JSX.Element => {
    const segments = currentRelationships.reduce((acc, rel) => {
      if (rel.affinity >= 75) acc.strong++;
      else if (rel.affinity >= 50) acc.good++;
      else if (rel.affinity >= 25) acc.average++;
      else acc.poor++;
      return acc;
    }, { strong: 0, good: 0, average: 0, poor: 0 } as unknown as { strong: number; good: number; average: number; poor: number });

    const total = currentRelationships.length || 1;
    const data = [
      { label: 'Strong', value: segments.strong, color: '#34d399' },
      { label: 'Good', value: segments.good, color: '#38bdf8' },
      { label: 'Average', value: segments.average, color: '#fbbf24' },
      { label: 'Poor', value: segments.poor, color: '#f87171' },
    ];

    const svgSize = 180;
    const c = svgSize / 2;
    const outerR = 70;
    const innerR = 45;

    const buildArcPts = (startAngle: number, endAngle: number, radius: number): string => {
      const x1 = c + radius * Math.cos(startAngle);
      const y1 = c + radius * Math.sin(startAngle);
      const x2 = c + radius * Math.cos(endAngle);
      const y2 = c + radius * Math.sin(endAngle);
      return `${x1},${y1} ${x2},${y2}`;
    };

    const arcs = data.reduce<Array<{ label: string; value: number; color: string; start: number; end: number; pct: number; sweep: number }>>((acc, seg) => {
      const lastEnd = acc.length > 0 ? acc[acc.length - 1].end : -Math.PI / 2;
      const pct = seg.value / total;
      const sweep = pct * 2 * Math.PI;
      acc.push({ ...seg, start: lastEnd, end: lastEnd + sweep, pct, sweep });
      return acc;
    }, []);

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 text-pink-400" /> Relationship Strength
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full max-w-[180px] mx-auto" fill="none">
            <circle cx={c} cy={c} r={outerR} fill="none" stroke="#21262d" strokeWidth={outerR - innerR} />
            {arcs.filter((a) => a.value > 0).map((arc, i) => {
              const outerPts = buildArcPts(arc.start, arc.end, outerR);
              const innerPts = buildArcPts(arc.end, arc.start, innerR);
              return (
                <motion.path
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.85 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  d={`M${outerPts} A${outerR},${outerR} 0 ${arc.sweep > Math.PI ? 1 : 0} 1 ${buildArcPts(arc.start, arc.end, outerR).split(' ')[1]} L${innerPts.split(' ')[0]} A${innerR},${innerR} 0 ${arc.sweep > Math.PI ? 1 : 0} 0 ${innerPts.split(' ')[1]} Z`}
                  fill={arc.color}
                />
              );
            })}
            <circle cx={c} cy={c} r={innerR - 2} fill="#161b22" />
            <text x={c} y={c - 4} textAnchor="middle" className="text-lg font-bold fill-white">{total}</text>
            <text x={c} y={c + 10} textAnchor="middle" className="text-[8px] fill-[#8b949e]">Total</text>
          </svg>
          <div className="flex justify-center gap-3 mt-2">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-[9px] text-[#8b949e]">{d.label} ({d.value})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 4: Friendship Groups Clusters
  // ================================================================
  const renderFriendshipClusters = (): React.JSX.Element => {
    const svgSize = 280;
    const groups = [
      { name: 'Defenders', color: '#38bdf8', members: ['Martinez', 'Silva', 'Kowalski'], cx: 70, cy: 80 },
      { name: 'Midfield', color: '#34d399', members: ['Chen', 'Park', 'Okafor', 'Dubois'], cx: 210, cy: 80 },
      { name: 'Attackers', color: '#f472b6', members: ['You', 'Nakamura', 'Fernandez'], cx: 140, cy: 200 },
    ];

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-purple-400" /> Friendship Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full max-w-[280px] mx-auto" fill="none">
            {groups.map((g, gi) => {
              const positions = g.members.map((_, mi) => {
                const a = (mi / g.members.length) * 2 * Math.PI - Math.PI / 2;
                const sr = 25;
                return { x: g.cx + sr * Math.cos(a), y: g.cy + sr * Math.sin(a) };
              });
              return (
                <g key={gi}>
                  <circle cx={g.cx} cy={g.cy} r="40" fill="none" stroke={g.color} strokeWidth="1" opacity={0.3} strokeDasharray="4 2" />
                  {positions.map((p, pi) => (
                    <g key={pi}>
                      <circle cx={p.x} cy={p.y} r="14" fill="#0d1117" stroke={g.color} strokeWidth="1.5" />
                      <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="text-[6px] fill-[#c9d1d9]">{g.members[pi].slice(0, 3)}</text>
                    </g>
                  ))}
                  {positions.map((p, pi) => {
                    const next = positions[(pi + 1) % positions.length];
                    return <line key={`l${pi}`} x1={p.x} y1={p.y} x2={next.x} y2={next.y} stroke={g.color} strokeWidth="1" opacity={0.3} />;
                  })}
                  <text x={g.cx} y={g.cy + 50} textAnchor="middle" className="text-[8px]" fill={g.color}>{g.name}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 5: Team Dynamics Gauge
  // ================================================================
  const renderTeamDynamicsGauge = (): React.JSX.Element => {
    const score = Math.round((teamDynamics.morale + teamDynamics.cohesion + teamDynamics.playerInfluence + teamDynamics.captainRating) / 4);
    const svgW = 240;
    const svgH = 140;
    const cx = svgW / 2;
    const cy = svgH - 20;
    const gaugeR = 80;
    const startA = Math.PI;
    const endA = 2 * Math.PI;
    const scoreA = startA + (score / 100) * Math.PI;

    const buildArcPath = (s: number, e: number, radius: number): string => {
      const x1 = cx + radius * Math.cos(s);
      const y1 = cy + radius * Math.sin(s);
      const x2 = cx + radius * Math.cos(e);
      const y2 = cy + radius * Math.sin(e);
      return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
    };

    const gaugeColor = score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : '#f87171';

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-orange-400" /> Team Dynamics Score
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[240px]" fill="none">
            <path d={buildArcPath(startA, endA, gaugeR)} stroke="#21262d" strokeWidth="12" strokeLinecap="round" />
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              d={buildArcPath(startA, scoreA, gaugeR)}
              stroke={gaugeColor}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <text x={cx} y={cy - 20} textAnchor="middle" className="text-2xl font-bold" fill={gaugeColor}>{score}</text>
            <text x={cx} y={cy - 4} textAnchor="middle" className="text-[9px] fill-[#8b949e]">/ 100</text>
            <text x={cx - gaugeR - 5} y={cy + 14} textAnchor="middle" className="text-[8px] fill-[#484f58]">0</text>
            <text x={cx + gaugeR + 5} y={cy + 14} textAnchor="middle" className="text-[8px] fill-[#484f58]">100</text>
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 6: Mentor-Mentee Tree
  // ================================================================
  const renderMentorMenteeTree = (): React.JSX.Element => {
    const svgW = 300;
    const svgH = 200;
    const mentors = currentRelationships.filter((r) => r.type === 'mentor' && r.isCurrent);
    const treeData = mentors.length >= 3
      ? mentors.slice(0, 3).map((m) => ({ name: m.name, initials: getInitials(m.name), affinity: m.affinity }))
      : [
          { name: 'Coach Rivera', initials: 'CR', affinity: 82 },
          { name: 'Capt. Silva', initials: 'CS', affinity: 71 },
          { name: 'VP Zhang', initials: 'VZ', affinity: 60 },
        ];

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-amber-400" /> Mentor-Mentee Tree
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[300px] mx-auto" fill="none">
            {/* Root: You */}
            <circle cx={svgW / 2} cy={30} r="18" fill="#0d1117" stroke="#34d399" strokeWidth="2" />
            <text x={svgW / 2} y={30} textAnchor="middle" dominantBaseline="middle" className="text-[8px] font-bold fill-[#34d399]">YOU</text>
            {/* Mentor nodes */}
            {treeData.map((m, i) => {
              const mx = 50 + i * 100;
              const my = 120;
              const affColor = m.affinity >= 70 ? '#34d399' : m.affinity >= 40 ? '#fbbf24' : '#f87171';
              return (
                <g key={i}>
                  <line x1={svgW / 2} y1={48} x2={mx} y2={my - 18} stroke="#30363d" strokeWidth="1.5" />
                  <circle cx={mx} cy={my} r="20" fill="#0d1117" stroke={affColor} strokeWidth="2" />
                  <text x={mx} y={my - 2} textAnchor="middle" dominantBaseline="middle" className="text-[8px] font-bold fill-[#c9d1d9]">{m.initials}</text>
                  <text x={mx} y={my + 8} textAnchor="middle" dominantBaseline="middle" className="text-[6px]" fill={affColor}>{m.affinity}</text>
                  <text x={mx} y={my + 30} textAnchor="middle" className="text-[7px] fill-[#8b949e]">{m.name}</text>
                </g>
              );
            })}
            {/* Connection label */}
            <text x={svgW / 2} y={80} textAnchor="middle" className="text-[7px] fill-[#484f58]">mentored by</text>
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 7: Rivalry Intensity Bars
  // ================================================================
  const renderRivalryIntensityBars = (): React.JSX.Element => {
    const rivals = currentRelationships.filter((r) => r.type === 'rival' && r.isCurrent);
    const rivalData = rivals.length >= 5
      ? rivals.slice(0, 5).map((r) => ({ name: r.name, intensity: 100 - r.affinity }))
      : [
          { name: 'M. Santos', intensity: 78 },
          { name: 'FC Dynamo', intensity: 65 },
          { name: 'J. Walker', intensity: 52 },
          { name: 'R. Braun', intensity: 40 },
          { name: 'Utd. Reserves', intensity: 28 },
        ];

    const svgW = 280;
    const svgH = 160;
    const barH = 16;
    const gap = 8;
    const startY = 20;
    const maxBarW = 170;
    const labelW = 70;

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <Swords className="h-3.5 w-3.5 text-red-400" /> Rivalry Intensity
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[280px] mx-auto" fill="none">
            {rivalData.map((r, i) => {
              const y = startY + i * (barH + gap);
              const barW = (r.intensity / 100) * maxBarW;
              const barColor = r.intensity >= 70 ? '#f87171' : r.intensity >= 45 ? '#fbbf24' : '#fb923c';
              return (
                <g key={i}>
                  <text x={labelW - 4} y={y + barH / 2 + 1} textAnchor="end" dominantBaseline="middle" className="text-[8px] fill-[#8b949e]">{r.name}</text>
                  <rect x={labelW} y={y} width={maxBarW} height={barH} rx="4" fill="#21262d" />
                  <motion.rect
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    x={labelW} y={y} width={barW} height={barH} rx="4" fill={barColor} opacity={0.8}
                  />
                  <text x={labelW + maxBarW + 8} y={y + barH / 2 + 1} textAnchor="start" dominantBaseline="middle" className="text-[8px] font-bold" fill={barColor}>{r.intensity}%</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 8: Social Standing Scatter
  // ================================================================
  const renderSocialStandingScatter = (): React.JSX.Element => {
    const svgW = 280;
    const svgH = 200;
    const pad = 30;
    const plotW = svgW - pad * 2;
    const plotH = svgH - pad * 2;

    const players = [
      { name: 'You', pop: 75, inf: 80, color: '#34d399' },
      { name: 'Martinez', pop: 60, inf: 55, color: '#60a5fa' },
      { name: 'Silva', pop: 85, inf: 70, color: '#f472b6' },
      { name: 'Chen', pop: 40, inf: 35, color: '#fbbf24' },
      { name: 'Okafor', pop: 55, inf: 65, color: '#a78bfa' },
      { name: 'Kowalski', pop: 30, inf: 20, color: '#fb923c' },
      { name: 'Park', pop: 70, inf: 50, color: '#22d3ee' },
      { name: 'Dubois', pop: 45, inf: 40, color: '#f87171' },
      { name: 'Nakamura', pop: 65, inf: 75, color: '#e879f9' },
      { name: 'Fernandez', pop: 50, inf: 60, color: '#4ade80' },
    ];

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <Crown className="h-3.5 w-3.5 text-amber-400" /> Social Standing
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[280px] mx-auto" fill="none">
            {/* Axes */}
            <line x1={pad} y1={svgH - pad} x2={svgW - pad} y2={svgH - pad} stroke="#30363d" strokeWidth="1" />
            <line x1={pad} y1={pad} x2={pad} y2={svgH - pad} stroke="#30363d" strokeWidth="1" />
            <text x={svgW / 2} y={svgH - 4} textAnchor="middle" className="text-[7px] fill-[#484f58]">Popularity →</text>
            <text x={8} y={svgH / 2} textAnchor="middle" className="text-[7px] fill-[#484f58]">Influence →</text>
            {players.map((p, i) => {
              const px = pad + (p.pop / 100) * plotW;
              const py = (svgH - pad) - (p.inf / 100) * plotH;
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r={p.name === 'You' ? 7 : 5} fill={p.color} opacity={0.8} />
                  <text x={px + (p.name === 'You' ? 10 : 8)} y={py - 3} textAnchor="start" className="text-[6px] fill-[#8b949e]">{p.name}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 9: Relationship Trend Area Chart
  // ================================================================
  const renderRelationshipTrendArea = (): React.JSX.Element => {
    const svgW = 280;
    const svgH = 140;
    const pad = { top: 15, right: 15, bottom: 25, left: 30 };
    const plotW = svgW - pad.left - pad.right;
    const plotH = svgH - pad.top - pad.bottom;

    const weekData = [45, 52, 48, 61, 58, 67, 72, 68];

    const buildAreaPath = (): string => {
      const points: string[] = [];
      for (let i = 0; i < weekData.length; i++) {
        const x = pad.left + (i / (weekData.length - 1)) * plotW;
        const y = pad.top + plotH - (weekData[i] / 100) * plotH;
        points.push(`${x},${y}`);
      }
      return points.join(' ');
    };
    const areaPoints = buildAreaPath();

    const buildLinePoints = (): string => {
      const points: string[] = [];
      for (let i = 0; i < weekData.length; i++) {
        const x = pad.left + (i / (weekData.length - 1)) * plotW;
        const y = pad.top + plotH - (weekData[i] / 100) * plotH;
        points.push(`${x},${y}`);
      }
      return points.join(' ');
    };
    const linePoints = buildLinePoints();

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Chemistry Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[280px] mx-auto" fill="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y = pad.top + plotH - (v / 100) * plotH;
              return (
                <g key={v}>
                  <line x1={pad.left} y1={y} x2={svgW - pad.right} y2={y} stroke="#21262d" strokeWidth="1" />
                  <text x={pad.left - 4} y={y + 3} textAnchor="end" className="text-[7px] fill-[#484f58]">{v}</text>
                </g>
              );
            })}
            {/* Area */}
            <motion.polygon
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 0.5 }}
              points={`${pad.left},${pad.top + plotH} ${areaPoints} ${pad.left + plotW},${pad.top + plotH}`}
              fill="#34d399"
            />
            {/* Line */}
            <motion.polyline
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              points={linePoints}
              stroke="#34d399"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
            />
            {/* Dots + week labels */}
            {weekData.map((v, i) => {
              const x = pad.left + (i / (weekData.length - 1)) * plotW;
              const y = pad.top + plotH - (v / 100) * plotH;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="3" fill="#34d399" stroke="#0d1117" strokeWidth="1" />
                  <text x={x} y={svgH - 4} textAnchor="middle" className="text-[7px] fill-[#484f58]">W{i + 1}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 10: Personality Compatibility Ring
  // ================================================================
  const renderPersonalityCompatibilityRing = (): React.JSX.Element => {
    const compatScore = strongestBond ? strongestBond.affinity : 65;
    const teammateName = strongestBond ? strongestBond.name : 'Teammate';
    const svgSize = 180;
    const cx = svgSize / 2;
    const cy = svgSize / 2;
    const ringR = 65;
    const ringW = 10;
    const ringColor = compatScore >= 70 ? '#34d399' : compatScore >= 40 ? '#fbbf24' : '#f87171';

    const buildRingArc = (score: number): string => {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (score / 100) * 2 * Math.PI;
      const x1 = cx + ringR * Math.cos(startAngle);
      const y1 = cy + ringR * Math.sin(startAngle);
      const x2 = cx + ringR * Math.cos(endAngle);
      const y2 = cy + ringR * Math.sin(endAngle);
      const largeArc = score > 50 ? 1 : 0;
      return `M ${x1} ${y1} A ${ringR} ${ringR} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <Handshake className="h-3.5 w-3.5 text-cyan-400" /> Compatibility Ring
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 flex justify-center">
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full max-w-[180px]" fill="none">
            <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="#21262d" strokeWidth={ringW} />
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              d={buildRingArc(compatScore)}
              stroke={ringColor}
              strokeWidth={ringW}
              strokeLinecap="round"
              fill="none"
            />
            <text x={cx} y={cy - 8} textAnchor="middle" className="text-xl font-bold" fill={ringColor}>{compatScore}%</text>
            <text x={cx} y={cy + 8} textAnchor="middle" className="text-[8px] fill-[#8b949e]">with {teammateName}</text>
            <text x={cx} y={cy + 22} textAnchor="middle" className="text-[7px] fill-[#484f58]">Best Match</text>
          </svg>
        </CardContent>
      </Card>
    );
  };

  // ================================================================
  // SVG 11: Squad Harmony Bars
  // ================================================================
  const renderSquadHarmonyBars = (): React.JSX.Element => {
    const squadGroups = [
      { name: 'Attackers', harmony: Math.round(teamDynamics.morale * 0.95), color: '#f87171' },
      { name: 'Midfielders', harmony: Math.round(teamDynamics.cohesion * 0.9 + 10), color: '#34d399' },
      { name: 'Defenders', harmony: Math.round(teamDynamics.captainRating * 0.88 + 12), color: '#38bdf8' },
      { name: 'Goalkeepers', harmony: Math.round(teamDynamics.playerInfluence * 0.7 + 20), color: '#fbbf24' },
      { name: 'Staff', harmony: Math.round(teamDynamics.morale * 0.75 + 15), color: '#a78bfa' },
      { name: 'Coaches', harmony: Math.round(teamDynamics.captainRating * 0.85 + 10), color: '#fb923c' },
    ];

    const svgW = 280;
    const svgH = 180;
    const barH = 14;
    const gap = 10;
    const startY = 15;
    const maxBarW = 160;
    const labelW = 72;

    return (
      <Card className="bg-[#161b22] border-[#30363d] mb-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-bold text-white flex items-center gap-2">
            <UserCheck className="h-3.5 w-3.5 text-green-400" /> Squad Harmony
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[280px] mx-auto" fill="none">
            {squadGroups.map((sg, i) => {
              const y = startY + i * (barH + gap);
              const barW = (Math.min(100, sg.harmony) / 100) * maxBarW;
              return (
                <g key={i}>
                  <text x={labelW - 4} y={y + barH / 2 + 1} textAnchor="end" dominantBaseline="middle" className="text-[8px] fill-[#8b949e]">{sg.name}</text>
                  <rect x={labelW} y={y} width={maxBarW} height={barH} rx="4" fill="#21262d" />
                  <motion.rect
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.85 }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    x={labelW} y={y} width={barW} height={barH} rx="4" fill={sg.color}
                  />
                  <text x={labelW + maxBarW + 8} y={y + barH / 2 + 1} textAnchor="start" dominantBaseline="middle" className="text-[8px] font-bold" fill={sg.color}>{Math.min(100, sg.harmony)}%</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'current', label: 'Current' },
    { value: 'teammate', label: 'Mates' },
    { value: 'coach', label: 'Coach' },
    { value: 'rival', label: 'Rival' },
    { value: 'mentor', label: 'Mentor' },
  ].filter((tab) => {
    if (tab.value === 'all' || tab.value === 'current') return true;
    return (counts[tab.value] ?? 0) > 0;
  });

  const squadSize = currentRelationships.filter((r) => r.type === 'teammate').length + 1;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 mb-4"
      >
        <div className="p-2 rounded-lg bg-emerald-500/15">
          <Users className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Team & Relationships</h1>
          <p className="text-xs text-[#8b949e]">
            {gameState.currentClub.name} &middot; S{gameState.currentSeason} W{gameState.currentWeek}
          </p>
        </div>
      </motion.div>

      {/* Team Dynamics Card (ENHANCED) */}
      <TeamDynamicsCard dynamics={teamDynamics} squadSize={squadSize} />

      {/* Key Relationships Section */}
      {keyRelationships.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/15">
              <Award className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Key Relationships</h2>
          </div>
          <div className="space-y-2">
            {keyRelationships.map((rel, i) => (
              <KeyRelationshipCard
                key={rel.id}
                rel={rel}
                rank={i}
                onPromote={promoteRelationshipLevel}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Relationship Summary Bar + Strongest/Rivalry Highlights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mb-4"
      >
        {/* Summary bar with colored dots */}
        <div className="flex items-center gap-2 mb-3 px-1">
          {typeSummary.map((item) => (
            <div key={item.type} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-sm ${getRelTypeDotColor(item.type)}`} />
              <span className="text-[10px] text-[#8b949e]">{item.count}</span>
            </div>
          ))}
          <span className="text-[10px] text-[#484f58] ml-auto">{relationships.length} total</span>
        </div>

        {/* Strongest Bond & Biggest Rivalry */}
        <div className="grid grid-cols-2 gap-2">
          {strongestBond && (
            <div className="rounded-lg bg-[#161b22] border border-emerald-500/20 p-2.5">
              <span className="text-[10px] text-emerald-400 font-medium block mb-1">Strongest Bond</span>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${getRelTypeAvatarBg(strongestBond.type)} flex items-center justify-center border border-[#30363d]`}>
                  <span className={`text-[10px] font-bold ${getRelTypeAvatarText(strongestBond.type)}`}>
                    {getInitials(strongestBond.name)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block truncate">{strongestBond.name}</span>
                  <span className={`text-[10px] font-bold ${getAffinityColor(strongestBond.affinity)}`}>
                    {strongestBond.affinity}
                  </span>
                </div>
              </div>
            </div>
          )}
          {biggestRivalry && (
            <div className="rounded-lg bg-[#161b22] border border-red-500/20 p-2.5">
              <span className="text-[10px] text-red-400 font-medium block mb-1">Biggest Rivalry</span>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg ${getRelTypeAvatarBg(biggestRivalry.type)} flex items-center justify-center border border-[#30363d]`}>
                  <span className={`text-[10px] font-bold ${getRelTypeAvatarText(biggestRivalry.type)}`}>
                    {getInitials(biggestRivalry.name)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white block truncate">{biggestRivalry.name}</span>
                  <span className={`text-[10px] font-bold ${getAffinityColor(biggestRivalry.affinity)}`}>
                    {biggestRivalry.affinity}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-[#161b22] border border-[#30363d] w-full h-auto p-1 flex-wrap gap-1">
            {filterTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
              >
                {tab.label}
                {counts[tab.value] !== undefined && (
                  <span className="ml-1 text-[10px] opacity-60">({counts[tab.value]})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Relationships List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredRelationships.length > 0 ? (
            filteredRelationships.map((rel, i) => (
              <RelationshipCard
                key={rel.id}
                rel={rel}
                index={i}
                currentWeek={currentWeek}
                onPromote={promoteRelationshipLevel}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Users className="h-12 w-12 mx-auto mb-3 text-[#484f58]" />
              <p className="text-[#8b949e] text-sm">No relationships found</p>
              <p className="text-[#8b949e] text-xs mt-1">Try a different filter</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SVG Data Visualizations */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        {renderRelationshipNetwork()}
        {renderTeamChemistryHexRadar()}
        {renderRelationshipStrengthDonut()}
        {renderFriendshipClusters()}
        {renderTeamDynamicsGauge()}
        {renderMentorMenteeTree()}
        {renderRivalryIntensityBars()}
        {renderSocialStandingScatter()}
        {renderRelationshipTrendArea()}
        {renderPersonalityCompatibilityRing()}
        {renderSquadHarmonyBars()}
      </div>

      {/* Relationship Tips Section */}
      <div className="mt-6">
        <RelationshipTips relationships={relationships} />
      </div>
    </div>
  );
}
