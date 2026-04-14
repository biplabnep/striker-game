'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  User, Edit3, CreditCard, ArrowLeftRight, BookOpen, Star,
  TrendingUp, Award, Palette, Share2, Download, RefreshCw,
  ChevronRight, Zap, Heart, Target, Clock, BarChart3, FileText,
} from 'lucide-react';
import type { Player, Club, CoreAttribute } from '@/lib/game/types';

// ============================================================
// Types & Interfaces
// ============================================================

interface BioField {
  nickname: string;
  preferredFoot: string;
  idol: string;
  playingStyle: string;
}

interface AttributeData {
  key: CoreAttribute;
  label: string;
  value: number;
  color: string;
}

interface TransferEntry {
  id: string;
  season: number;
  fromClub: string;
  toClub: string;
  fee: number;
  feeType: 'free' | 'loan' | 'undisclosed' | 'paid';
  description: string;
}

interface NarrativeChapter {
  id: string;
  title: string;
  text: string;
  season: number;
}

interface KeyMoment {
  id: string;
  date: string;
  description: string;
  icon: string;
}

interface HighlightCard {
  id: string;
  title: string;
  description: string;
  category: 'goal' | 'assist' | 'trophy' | 'record' | 'award' | 'match';
  season: number;
}

type CardTemplate = 'classic' | 'modern' | 'retro' | 'holographic';
type CardRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

// ============================================================
// Constants
// ============================================================

const ATTR_KEYS: CoreAttribute[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

const ATTR_LABELS: Record<CoreAttribute, string> = {
  pace: 'Speed',
  shooting: 'Shooting',
  passing: 'Passing',
  dribbling: 'Dribbling',
  defending: 'Defending',
  physical: 'Physical',
};

const ATTR_COLORS: Record<CoreAttribute, string> = {
  pace: '#22d3ee',
  shooting: '#f43f5e',
  passing: '#3b82f6',
  dribbling: '#a78bfa',
  defending: '#f59e0b',
  physical: '#22c55e',
};

const RADAR_ANGLES = [-90, -30, 30, 90, 150, 210];

const CAREER_PHASES = [
  { label: 'Youth', icon: '🌱', minAge: 8, maxAge: 14 },
  { label: 'Academy', icon: '📚', minAge: 14, maxAge: 17 },
  { label: 'Reserves', icon: '🔄', minAge: 17, maxAge: 19 },
  { label: 'First Team', icon: '⭐', minAge: 19, maxAge: 24 },
  { label: 'Star', icon: '👑', minAge: 24, maxAge: 99 },
];

const CARD_TEMPLATES: { id: CardTemplate; label: string; accent: string; border: string }[] = [
  { id: 'classic', label: 'Classic', accent: '#f59e0b', border: '#78350f' },
  { id: 'modern', label: 'Modern', accent: '#3b82f6', border: '#1e3a5f' },
  { id: 'retro', label: 'Retro', accent: '#ef4444', border: '#7f1d1d' },
  { id: 'holographic', label: 'Holographic', accent: '#a78bfa', border: '#4c1d95' },
];

const RARITY_CONFIG: Record<CardRarity, { label: string; color: string; glowColor: string }> = {
  common: { label: 'Common', color: '#8b949e', glowColor: '#30363d' },
  rare: { label: 'Rare', color: '#3b82f6', glowColor: '#1d4ed8' },
  epic: { label: 'Epic', color: '#a78bfa', glowColor: '#7c3aed' },
  legendary: { label: 'Legendary', color: '#f59e0b', glowColor: '#d97706' },
};

const HIGHLIGHT_CATEGORIES = [
  { id: 'goal' as const, label: 'Goals', color: '#22c55e' },
  { id: 'assist' as const, label: 'Assists', color: '#3b82f6' },
  { id: 'trophy' as const, label: 'Trophies', color: '#f59e0b' },
  { id: 'record' as const, label: 'Records', color: '#a78bfa' },
  { id: 'award' as const, label: 'Awards', color: '#f43f5e' },
];

const NARRATIVE_CATEGORIES = ['Goals', 'Assists', 'Trophies', 'Records', 'Awards'];

const TABS = [
  { icon: User, label: 'Bio Generator' },
  { icon: CreditCard, label: 'Card Designer' },
  { icon: ArrowLeftRight, label: 'Transfer History' },
  { icon: BookOpen, label: 'Career Narrative' },
];

// ============================================================
// Helpers
// ============================================================

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function getPolygonPoints(cx: number, cy: number, r: number, values: number[]): string {
  return values
    .map((v, i) => {
      const pt = polarToCartesian(cx, cy, (v / 100) * r, RADAR_ANGLES[i]);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

function getStatColor(value: number): string {
  if (value >= 70) return '#22c55e';
  if (value >= 50) return '#f59e0b';
  return '#ef4444';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatFee(fee: number, feeType: string): string {
  if (feeType === 'free') return 'Free';
  if (feeType === 'loan') return 'Loan';
  if (feeType === 'undisclosed') return 'Undisclosed';
  if (fee >= 1_000_000) return `€${(fee / 1_000_000).toFixed(1)}M`;
  if (fee >= 1_000) return `€${(fee / 1_000).toFixed(0)}K`;
  return `€${fee}`;
}

function getRarityFromOverall(overall: number): CardRarity {
  if (overall >= 88) return 'legendary';
  if (overall >= 78) return 'epic';
  if (overall >= 65) return 'rare';
  return 'common';
}

function describeDonutArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

// ============================================================
// Data generators
// ============================================================

function generateBioParagraphs(player: Player, club: Club, careerStats: { totalGoals: number; totalAssists: number; totalAppearances: number; trophies: { name: string }[] }): string[] {
  const position = player.position;
  const age = player.age;
  const overall = player.overall;
  const goals = careerStats.totalGoals;
  const assists = careerStats.totalAssists;
  const apps = careerStats.totalAppearances;
  const trophies = careerStats.trophies.length;

  const positionDescriptions: Record<string, string> = {
    ST: 'a clinical striker known for finding the back of the net',
    CF: 'a creative forward who links play between midfield and attack',
    LW: 'a electrifying winger who terrorizes defenders on the left flank',
    RW: 'a dynamic winger who provides width and cutting edge on the right',
    CAM: 'an orchestrator who pulls the strings in the final third',
    CM: 'a reliable midfielder who dictates the tempo of the game',
    CDM: 'a defensive shield who breaks up opposition attacks with precision',
    CB: 'a commanding centre-back who leads the defensive line with authority',
    LB: 'an attacking full-back who provides overlapping runs and defensive solidity',
    RB: 'an energetic right-back who combines defensive discipline with attacking thrust',
    LM: 'a versatile wide midfielder who contributes both defensively and offensively',
    RM: 'a hard-working wide midfielder who covers every blade of grass',
    GK: 'a shot-stopper who commands the penalty area with confidence',
  };

  const posDesc = positionDescriptions[position] ?? 'a versatile player who adapts to any tactical system';

  const paragraph1 = `${player.name} is ${posDesc}. At just ${age} years old, the ${player.nationality} talent has already made ${apps} professional appearances, establishing themselves as a key figure at ${club.name}. With an overall rating of ${overall}, they continue to develop and impress scouts across the footballing world.`;

  const paragraph2 = goals > 10
    ? `The numbers speak for themselves: ${goals} goals and ${assists} assists in their career so far demonstrate a consistent ability to influence matches. Their preferred foot is ${player.preferredFoot}, and they have developed a playing style that maximizes their technical attributes while maintaining physical dominance.`
    : `In the early stages of their career, ${player.name} has shown flashes of brilliance with ${goals} goals and ${assists} assists. The ${player.preferredFoot}-footed player is still finding their rhythm at the professional level but shows immense promise for the future.`;

  const paragraph3 = trophies > 0
    ? `Having already lifted ${trophies} trophy${trophies > 1 ? 's' : ''} during their career, ${player.name} is building a legacy that could cement their place among the greats. Their potential rating of ${player.potential} suggests the best is yet to come, and fans are excited to see how their story unfolds.`
    : `While the trophy cabinet remains empty for now, the trajectory is clear. With a potential rating of ${player.potential}, ${player.name} has the talent and determination to achieve greatness in the seasons ahead.`;

  return [paragraph1, paragraph2, paragraph3];
}

function generateTransferHistory(player: Player, club: Club): TransferEntry[] {
  const entries: TransferEntry[] = [
    { id: 't1', season: 1, fromClub: 'Local Youth FC', toClub: `${club.name} Academy`, fee: 0, feeType: 'free', description: 'Joined academy as a promising youth prospect' },
    { id: 't2', season: 3, fromClub: `${club.name} U18`, toClub: `${club.name} U21`, fee: 0, feeType: 'free', description: 'Promoted to U21 setup after impressive youth performances' },
    { id: 't3', season: 5, fromClub: `${club.name} U21`, toClub: `${club.name} Reserves`, fee: 0, feeType: 'free', description: 'Graduated to reserve team squad' },
    { id: 't4', season: 6, fromClub: `${club.name} Reserves`, toClub: club.name, fee: 0, feeType: 'free', description: 'First professional contract signed' },
    { id: 't5', season: 8, fromClub: club.name, toClub: 'FC Progress', fee: 2_500_000, feeType: 'paid', description: 'First professional transfer seeking regular first-team football' },
    { id: 't6', season: 10, fromClub: 'FC Progress', toClub: 'Atletico Vanguard', fee: 8_000_000, feeType: 'paid', description: 'Big money move after breakout season' },
    { id: 't7', season: 12, fromClub: 'Atletico Vanguard', toClub: 'Sporting Metro', fee: 0, feeType: 'loan', description: 'Loan spell for European experience' },
    { id: 't8', season: 13, fromClub: 'Sporting Metro', toClub: club.name, fee: 15_000_000, feeType: 'paid', description: 'Emotional return to boyhood club as established star' },
  ];

  return entries.filter((e) => e.season <= player.age - 13);
}

function generateNarrativeChapters(player: Player, club: Club): NarrativeChapter[] {
  return [
    {
      id: 'ch1',
      title: 'The Early Years',
      text: `Every legend has a beginning. ${player.name} was born in ${player.nationality} and showed exceptional talent from a young age. Scouted by ${club.name} at just ${Math.max(8, player.age - 10)} years old, they quickly rose through the youth ranks with performances that left coaches speechless.`,
      season: 1,
    },
    {
      id: 'ch2',
      title: 'Academy Breakthrough',
      text: `The academy years were transformative. Competing against older players daily forged the competitive edge that would define their career. By ${Math.max(14, player.age - 6)}, they were already being compared to established professionals.`,
      season: 3,
    },
    {
      id: 'ch3',
      title: 'Professional Debut',
      text: `The moment every young player dreams of arrived when ${player.name} made their first-team debut. The nerves were evident, but the quality shone through. A standing ovation from the home crowd confirmed that a star was born.`,
      season: 5,
    },
    {
      id: 'ch4',
      title: 'Rising Star',
      text: `Season after season, the improvements were remarkable. From rotation player to undisputed starter, ${player.name} became the heartbeat of the team. Scouts from Europe\'s elite clubs began circling, but the focus remained on development.`,
      season: 8,
    },
    {
      id: 'ch5',
      title: 'The Legacy Continues',
      text: `Now established as one of the finest players of their generation, ${player.name} continues to write their story. With an overall rating of ${player.overall} and potential of ${player.potential}, the chapters yet to be written could be the most glorious of all.`,
      season: Math.max(10, player.age - 3),
    },
  ];
}

function generateKeyMoments(player: Player, club: Club): KeyMoment[] {
  return [
    { id: 'km1', date: `Season 1`, description: 'Joined the academy and signed first youth contract', icon: '📝' },
    { id: 'km2', date: `Season 3`, description: 'Named U18 Player of the Year', icon: '🏆' },
    { id: 'km3', date: `Season 5`, description: 'Professional debut against league rivals', icon: '⚽' },
    { id: 'km4', date: `Season 6`, description: 'Scored first senior goal in cup competition', icon: '🥅' },
    { id: 'km5', date: `Season 8`, description: 'First international call-up received', icon: '🌍' },
    { id: 'km6', date: `Season 9`, description: 'Record-breaking transfer fee for the club', icon: '💰' },
    { id: 'km7', date: `Season 11`, description: 'Scored in continental competition debut', icon: '🌟' },
    { id: 'km8', date: `Season 13`, description: 'Named club captain at age ' + player.age, icon: '👑' },
  ];
}

function generateHighlights(player: Player): HighlightCard[] {
  return [
    { id: 'h1', title: 'First Hat-Trick', description: 'Scored three goals in a dominant cup performance', category: 'goal', season: 6 },
    { id: 'h2', title: 'Season Assist King', description: 'Led the league with 18 assists in a single season', category: 'assist', season: 9 },
    { id: 'h3', title: 'League Championship', description: 'Won the domestic league title with the club', category: 'trophy', season: 10 },
    { id: 'h4', title: 'Most Appearances', description: 'Became the youngest player to reach 200 appearances', category: 'record', season: 11 },
    { id: 'h5', title: 'Player of the Season', description: 'Won the prestigious seasonal player award unanimously', category: 'award', season: 12 },
    { id: 'h6', title: 'Champions League Final', description: 'Started in the biggest club match of the season', category: 'match', season: 13 },
  ];
}

// ============================================================
// SVG Sub-Components
// ============================================================

function AttributeHexRadar({ attributes }: { attributes: Record<CoreAttribute, number> }): React.JSX.Element {
  const cx = 130;
  const cy = 130;
  const radius = 100;

  const gridRings = [20, 40, 60, 80, 100].map(
    (v) => getPolygonPoints(cx, cy, radius, Array(6).fill(v))
  );

  const currentValues = ATTR_KEYS.map((k) => attributes[k] ?? 50);
  const currentPoints = getPolygonPoints(cx, cy, radius, currentValues);

  const axisEndpoints = RADAR_ANGLES.map((angle) => {
    const pt = polarToCartesian(cx, cy, radius, angle);
    return { x: pt.x, y: pt.y };
  });

  const labelPositions = RADAR_ANGLES.map((angle, i) => {
    const pt = polarToCartesian(cx, cy, radius + 20, angle);
    return { x: pt.x, y: pt.y, label: ATTR_LABELS[ATTR_KEYS[i]], value: currentValues[i], key: ATTR_KEYS[i] };
  });

  return (
    <svg viewBox="0 0 260 260" style={{ width: '100%', maxWidth: 260 }}>
      {/* Grid rings */}
      {gridRings.map((points, i) => (
        <polygon key={`ring-${i}`} points={points} fill="none" stroke="#30363d" strokeWidth="0.5" />
      ))}

      {/* Axis lines */}
      {axisEndpoints.map((pt, i) => (
        <line key={`axis-${i}`} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#30363d" strokeWidth="0.5" />
      ))}

      {/* Filled radar area */}
      <motion.polygon
        points={currentPoints}
        fill="rgba(34, 197, 94, 0.15)"
        stroke="#22c55e"
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />

      {/* Vertex dots */}
      {currentValues.map((val, i) => {
        const pt = polarToCartesian(cx, cy, (val / 100) * radius, RADAR_ANGLES[i]);
        return (
          <circle key={`dot-${i}`} cx={pt.x} cy={pt.y} r="4" fill={ATTR_COLORS[ATTR_KEYS[i]]} />
        );
      })}

      {/* Labels */}
      {labelPositions.map((lbl) => (
        <g key={`label-${lbl.key}`}>
          <text
            x={lbl.x}
            y={lbl.y - 4}
            textAnchor="middle"
            fill={ATTR_COLORS[lbl.key as CoreAttribute]}
            fontSize="11"
            fontWeight="700"
          >
            {lbl.value}
          </text>
          <text
            x={lbl.x}
            y={lbl.y + 10}
            textAnchor="middle"
            fill="#8b949e"
            fontSize="9"
            fontWeight="600"
          >
            {lbl.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function BioCompletenessRing({ completeness }: { completeness: number }): React.JSX.Element {
  const cx = 60;
  const cy = 60;
  const r = 50;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - completeness / 100);
  const color = completeness >= 80 ? '#22c55e' : completeness >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg viewBox="0 0 120 120" style={{ width: '100%', maxWidth: 120 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#21262d" strokeWidth="8" />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill="#c9d1d9"
        fontSize="22"
        fontWeight="800"
      >
        {completeness}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="#8b949e"
        fontSize="9"
        fontWeight="600"
      >
        COMPLETE
      </text>
    </svg>
  );
}

function CareerPhaseTimeline({ currentAge }: { currentAge: number }): React.JSX.Element {
  const totalWidth = 400;
  const phaseCount = CAREER_PHASES.length;
  const segWidth = totalWidth / phaseCount;

  const phases = CAREER_PHASES.map((phase, i) => {
    const isActive = currentAge >= phase.minAge && currentAge < phase.maxAge;
    const isPast = currentAge >= phase.maxAge;
    return { ...phase, isActive, isPast, index: i };
  });

  return (
    <svg viewBox={`0 0 ${totalWidth + 40} 80`} style={{ width: '100%', maxWidth: 440 }}>
      {phases.map((phase) => {
        const x = 20 + phase.index * segWidth;
        const fill = phase.isPast ? '#22c55e' : phase.isActive ? '#3b82f6' : '#21262d';
        return (
          <g key={`phase-${phase.label}`}>
            <rect x={x} y="20" width={segWidth - 4} height="24" rx="4" fill={fill} />
            <text
              x={x + (segWidth - 4) / 2}
              y="16"
              textAnchor="middle"
              fill={phase.isActive ? '#c9d1d9' : '#484f58'}
              fontSize="9"
              fontWeight="600"
            >
              {phase.icon} {phase.label}
            </text>
            <text
              x={x + (segWidth - 4) / 2}
              y="58"
              textAnchor="middle"
              fill={phase.isActive ? '#c9d1d9' : '#484f58'}
              fontSize="8"
            >
              {phase.minAge}-{phase.maxAge}
            </text>
            {phase.isActive && (
              <motion.circle
                cx={x + (segWidth - 4) / 2}
                cy="50"
                r="3"
                fill="#3b82f6"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function CardStatsBars({ attributes, position }: { attributes: Record<CoreAttribute, number>; position: string }): React.JSX.Element {
  const barWidth = 140;

  const entries = ATTR_KEYS.map((k) => ({
    key: k,
    label: ATTR_LABELS[k],
    value: attributes[k] ?? 50,
    color: ATTR_COLORS[k],
  }));

  return (
    <svg viewBox="0 0 200 150" style={{ width: '100%', maxWidth: 200 }}>
      {entries.map((entry, i) => {
        const y = 5 + i * 24;
        return (
          <g key={`bar-${entry.key}`}>
            <text x="0" y={y + 10} fill="#8b949e" fontSize="9" fontWeight="600">
              {entry.label.slice(0, 3).toUpperCase()}
            </text>
            <text x={barWidth + 50} y={y + 10} fill="#c9d1d9" fontSize="9" fontWeight="700" textAnchor="end">
              {entry.value}
            </text>
            <rect x="38" y={y + 2} width={barWidth} height="12" rx="3" fill="#21262d" />
            <motion.rect
              x="38"
              y={y + 2}
              width={(entry.value / 100) * barWidth}
              height="12"
              rx="3"
              fill={entry.color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function OverallRatingBadge({ overall, position }: { overall: number; position: string }): React.JSX.Element {
  const color = overall >= 85 ? '#22c55e' : overall >= 70 ? '#f59e0b' : overall >= 55 ? '#3b82f6' : '#8b949e';
  const cx = 50;
  const cy = 50;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - overall / 99);

  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', maxWidth: 100 }}>
      <circle cx={cx} cy={cy} r={r} fill="#0d1117" stroke={color} strokeWidth="3" />
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize="28" fontWeight="900">
        {overall}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#8b949e" fontSize="10" fontWeight="700">
        {position}
      </text>
    </svg>
  );
}

function SkillMovesStars({ rating, label }: { rating: number; label: string }): React.JSX.Element {
  const maxStars = 5;
  const starSize = 16;
  const gap = 4;

  return (
    <svg viewBox={`0 0 ${maxStars * (starSize + gap) + 20} 36`} style={{ width: '100%', maxWidth: 120 }}>
      <text x="0" y="10" fill="#8b949e" fontSize="8" fontWeight="600">
        {label}
      </text>
      {Array.from({ length: maxStars }, (_, i) => {
        const x = i * (starSize + gap);
        const filled = i < rating;
        return (
          <motion.g key={`star-${i}-${label}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08, duration: 0.2 }}>
            <polygon
              points={`${x + starSize / 2},14 ${x + starSize / 2 + 2},${x + starSize / 2 - 6} ${x + starSize + 3},${x + starSize / 2 + 1} ${x + starSize / 2 + 4},${x + starSize / 2 + 4} ${x + starSize / 2 + 1},${x + starSize / 2 + 6} ${x + starSize / 2 - 3},${x + starSize / 2 + 4}`}
              fill="none"
              stroke={filled ? '#f59e0b' : '#30363d'}
              strokeWidth="1"
              transform={`translate(0, -${x / 2})`}
            />
          </motion.g>
        );
      })}
      <text x="0" y="32" fill="#c9d1d9" fontSize="9" fontWeight="700">
        {rating}/{maxStars}
      </text>
    </svg>
  );
}

function CardRarityGlow({ rarity }: { rarity: CardRarity }): React.JSX.Element {
  const config = RARITY_CONFIG[rarity];
  const cx = 140;
  const cy = 200;
  const rx = 130;
  const ry = 190;

  return (
    <svg viewBox="0 0 280 400" style={{ width: '100%', maxWidth: 280, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={config.glowColor}
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
      />
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx + 6}
        ry={ry + 6}
        fill="none"
        stroke={config.glowColor}
        strokeWidth="1"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />
    </svg>
  );
}

function TransferFeeTimeline({ transfers }: { transfers: TransferEntry[] }): React.JSX.Element {
  const width = 280;
  const height = 160;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const paidTransfers = transfers.filter((t) => t.feeType === 'paid');
  const maxFee = paidTransfers.reduce((acc, t) => Math.max(acc, t.fee), 1);
  const maxSeason = transfers.reduce((acc, t) => Math.max(acc, t.season), 1);
  const minSeason = transfers.reduce((acc, t) => Math.min(acc, t.season), 1);

  const cumulativePoints: { x: number; y: number; season: number; total: number }[] = [];
  let runningTotal = 0;
  for (let s = minSeason; s <= maxSeason; s++) {
    const fee = paidTransfers.filter((t) => t.season === s).reduce((sum, t) => sum + t.fee, 0);
    runningTotal += fee;
    const x = padding.left + ((s - minSeason) / Math.max(1, maxSeason - minSeason)) * chartW;
    const y = padding.top + chartH - (runningTotal / maxFee) * chartH;
    cumulativePoints.push({ x, y, season: s, total: runningTotal });
  }

  const linePath = cumulativePoints.length > 1
    ? cumulativePoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')
    : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }}>
      {/* Axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartH} stroke="#30363d" strokeWidth="1" />
      <line x1={padding.left} y1={padding.top + chartH} x2={padding.left + chartW} y2={padding.top + chartH} stroke="#30363d" strokeWidth="1" />

      {/* Y axis label */}
      <text x="8" y={height / 2} fill="#8b949e" fontSize="8" fontWeight="600" transform={`rotate(-90 8 ${height / 2})`}>
        Cumulative Fee
      </text>

      {/* X axis label */}
      <text x={width / 2} y={height - 2} fill="#8b949e" fontSize="8" fontWeight="600" textAnchor="middle">
        Career Season
      </text>

      {/* Area fill */}
      {cumulativePoints.length > 1 && (
        <motion.path
          d={`${linePath} L ${cumulativePoints[cumulativePoints.length - 1].x} ${padding.top + chartH} L ${cumulativePoints[0].x} ${padding.top + chartH} Z`}
          fill="rgba(34, 197, 94, 0.1)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Line */}
      {linePath && (
        <motion.path
          d={linePath}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Data points */}
      {cumulativePoints.map((pt) => (
        <g key={`tp-${pt.season}`}>
          <circle cx={pt.x} cy={pt.y} r="3" fill="#22c55e" />
          <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="#8b949e" fontSize="7">
            {pt.season}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TransferTypeDonut({ transfers }: { transfers: TransferEntry[] }): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 70;

  const segments = transfers.reduce((acc, t) => {
    const existing = acc.find((s) => s.label === t.feeType);
    if (existing) {
      return acc.map((s) => s.label === t.feeType ? { ...s, value: s.value + 1 } : s);
    }
    const colors: Record<string, string> = { free: '#22c55e', loan: '#3b82f6', undisclosed: '#8b949e', paid: '#f59e0b' };
    return [...acc, { label: t.feeType, value: 1, color: colors[t.feeType] ?? '#484f58' }];
  }, [] as DonutSegment[]);

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const arcDescriptions = segments.reduce((acc, seg) => {
    const prevAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const sweep = (seg.value / total) * 360;
    const arc = describeDonutArc(cx, cy, r, prevAngle, prevAngle + sweep);
    return [...acc, { ...seg, arc, endAngle: prevAngle + sweep }];
  }, [] as (DonutSegment & { arc: string; endAngle: number })[]);

  return (
    <svg viewBox="0 0 200 220" style={{ width: '100%', maxWidth: 200 }}>
      {arcDescriptions.map((seg) => (
        <motion.path
          key={`donut-${seg.label}`}
          d={seg.arc}
          fill={seg.color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.3 }}
        />
      ))}

      {/* Center hole */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#161b22" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="18" fontWeight="800">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="600">
        TOTAL
      </text>

      {/* Legend */}
      {arcDescriptions.map((seg, i) => (
        <g key={`legend-${seg.label}`}>
          <rect x="10" y={170 + i * 12} width="8" height="8" rx="2" fill={seg.color} />
          <text x="22" y={178 + i * 12} fill="#8b949e" fontSize="8" fontWeight="600">
            {seg.label.charAt(0).toUpperCase() + seg.label.slice(1)} ({seg.value})
          </text>
        </g>
      ))}
    </svg>
  );
}

function MarketValueGraph({ player }: { player: Player }): React.JSX.Element {
  const width = 280;
  const height = 140;
  const padding = { top: 15, right: 15, bottom: 25, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const totalPoints = Math.max(3, player.careerStats.seasonsPlayed + 1);
  const currentValue = player.marketValue;

  const dataPoints = Array.from({ length: totalPoints }, (_, i) => {
    const progress = i / Math.max(1, totalPoints - 1);
    const factor = 0.1 + progress * 0.9;
    const variance = 1 + (Math.sin(i * 1.3) * 0.08);
    const value = currentValue * factor * variance;
    return {
      season: i + 1,
      value: i === totalPoints - 1 ? currentValue : Math.round(value),
    };
  });

  const maxValue = dataPoints.reduce((acc, d) => Math.max(acc, d.value), 1);

  const points = dataPoints.map((d, i) => {
    const x = padding.left + (i / Math.max(1, dataPoints.length - 1)) * chartW;
    const y = padding.top + chartH - (d.value / maxValue) * chartH;
    return { x, y, season: d.season, value: d.value };
  });

  const linePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }}>
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartH} stroke="#30363d" strokeWidth="1" />
      <line x1={padding.left} y1={padding.top + chartH} x2={padding.left + chartW} y2={padding.top + chartH} stroke="#30363d" strokeWidth="1" />

      <text x="5" y={height / 2} fill="#8b949e" fontSize="7" fontWeight="600" transform={`rotate(-90 5 ${height / 2})`}>
        Value (EUR)
      </text>
      <text x={width / 2} y={height - 2} fill="#8b949e" fontSize="7" fontWeight="600" textAnchor="middle">
        Season
      </text>

      <motion.path
        d={areaPath}
        fill="rgba(59, 130, 246, 0.1)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />

      {points.map((pt) => (
        <g key={`mv-${pt.season}`}>
          <circle cx={pt.x} cy={pt.y} r="2.5" fill="#3b82f6" />
        </g>
      ))}

      {/* Current value label */}
      {points.length > 0 && (
        <text x={points[points.length - 1].x} y={points[points.length - 1].y - 8} textAnchor="end" fill="#c9d1d9" fontSize="7" fontWeight="700">
          {currentValue >= 1_000_000 ? `€${(currentValue / 1_000_000).toFixed(1)}M` : `€${(currentValue / 1_000).toFixed(0)}K`}
        </text>
      )}
    </svg>
  );
}

function TransferProfitLossBar({ transfers }: { transfers: TransferEntry[] }): React.JSX.Element {
  const totalBought = transfers
    .filter((t) => t.feeType === 'paid' && t.description.includes('move'))
    .reduce((sum, t) => sum + t.fee, 0);
  const totalSold = transfers
    .filter((t) => t.feeType === 'paid' && !t.description.includes('move'))
    .reduce((sum, t) => sum + t.fee, 0);
  const profit = totalSold - totalBought;
  const maxVal = Math.max(totalBought, totalSold, Math.abs(profit), 1);

  const width = 280;
  const barH = 16;
  const barMaxW = width - 100;

  return (
    <svg viewBox={`0 0 ${width} 70`} style={{ width: '100%', maxWidth: 280 }}>
      <text x="0" y="10" fill="#8b949e" fontSize="8" fontWeight="600">
        Transfer Activity
      </text>

      <text x="0" y="30" fill="#c9d1d9" fontSize="8" fontWeight="600">
        Spent
      </text>
      <rect x="45" y="22" width={barMaxW} height={barH} rx="3" fill="#21262d" />
      <rect x="45" y="22" width={(totalBought / maxVal) * barMaxW} height={barH} rx="3" fill="#ef4444" />
      <text x={45 + (totalBought / maxVal) * barMaxW + 5} y={34} fill="#ef4444" fontSize="8" fontWeight="700">
        {totalBought >= 1_000_000 ? `€${(totalBought / 1_000_000).toFixed(1)}M` : totalBought > 0 ? `€${(totalBought / 1_000).toFixed(0)}K` : '€0'}
      </text>

      <text x="0" y="54" fill="#c9d1d9" fontSize="8" fontWeight="600">
        Rec'd
      </text>
      <rect x="45" y="46" width={barMaxW} height={barH} rx="3" fill="#21262d" />
      <rect x="45" y="46" width={(totalSold / maxVal) * barMaxW} height={barH} rx="3" fill="#22c55e" />
      <text x={45 + Math.max(10, (totalSold / maxVal) * barMaxW) + 5} y={58} fill="#22c55e" fontSize="8" fontWeight="700">
        {totalSold >= 1_000_000 ? `€${(totalSold / 1_000_000).toFixed(1)}M` : totalSold > 0 ? `€${(totalSold / 1_000).toFixed(0)}K` : '€0'}
      </text>
    </svg>
  );
}

function NarrativeProgressBar({ chapters }: { chapters: NarrativeChapter[] }): React.JSX.Element {
  const width = 280;
  const height = 40;
  const barH = 16;
  const barY = 4;
  const segW = width / chapters.length;
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#a78bfa', '#f43f5e'];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }}>
      {chapters.map((_, i) => (
        <g key={`nbar-${i}`}>
          <rect x={i * segW} y={barY} width={segW - 2} height={barH} rx="2" fill="#21262d" />
          <motion.rect
            x={i * segW}
            y={barY}
            width={segW - 2}
            height={barH}
            rx="2"
            fill={colors[i % colors.length]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ delay: i * 0.1, duration: 0.2 }}
          />
          <text
            x={i * segW + (segW - 2) / 2}
            y={barY + barH + 14}
            textAnchor="middle"
            fill="#8b949e"
            fontSize="7"
            fontWeight="600"
          >
            Ch. {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

function CareerArcChart({ player }: { player: Player }): React.JSX.Element {
  const width = 280;
  const height = 140;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const totalSeasons = Math.max(5, player.careerStats.seasonsPlayed + 2);
  const dataPoints = Array.from({ length: totalSeasons }, (_, i) => {
    const base = 5.0 + (player.form - 5) * 0.3;
    const growth = Math.min(2.0, i * 0.15);
    const variance = Math.sin(i * 0.8) * 0.4;
    return {
      season: i + 1,
      rating: Math.max(4.0, Math.min(10.0, base + growth + variance + (player.overall / 100))),
    };
  });

  const points = dataPoints.map((d, i) => {
    const x = padding.left + (i / Math.max(1, dataPoints.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.rating - 4) / 6) * chartH;
    return { x, y, season: d.season, rating: d.rating };
  });

  const linePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: 280 }}>
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartH} stroke="#30363d" strokeWidth="1" />
      <line x1={padding.left} y1={padding.top + chartH} x2={padding.left + chartW} y2={padding.top + chartH} stroke="#30363d" strokeWidth="1" />

      {/* Y-axis labels */}
      {[4, 6, 8, 10].map((v) => {
        const y = padding.top + chartH - ((v - 4) / 6) * chartH;
        return (
          <g key={`yaxis-${v}`}>
            <text x={padding.left - 4} y={y + 3} textAnchor="end" fill="#484f58" fontSize="7">
              {v}
            </text>
            <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="#21262d" strokeWidth="0.5" />
          </g>
        );
      })}

      <motion.path
        d={linePath}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />

      {points.map((pt) => (
        <g key={`arc-${pt.season}`}>
          <circle cx={pt.x} cy={pt.y} r="2" fill="#f59e0b" />
        </g>
      ))}
    </svg>
  );
}

function HighlightCategoryDonut({ highlights }: { highlights: HighlightCard[] }): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const r = 70;

  const segments = highlights.reduce((acc, h) => {
    const existing = acc.find((s) => s.label === h.category);
    if (existing) {
      return acc.map((s) => s.label === h.category ? { ...s, value: s.value + 1 } : s);
    }
    const catConfig = HIGHLIGHT_CATEGORIES.find((c) => c.id === h.category);
    return [...acc, { label: h.category, value: 1, color: catConfig?.color ?? '#484f58' }];
  }, [] as DonutSegment[]);

  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const arcDescriptions = segments.reduce((acc, seg) => {
    const prevAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const sweep = (seg.value / total) * 360;
    const arc = describeDonutArc(cx, cy, r, prevAngle, prevAngle + sweep);
    return [...acc, { ...seg, arc, endAngle: prevAngle + sweep }];
  }, [] as (DonutSegment & { arc: string; endAngle: number })[]);

  return (
    <svg viewBox="0 0 200 220" style={{ width: '100%', maxWidth: 200 }}>
      {arcDescriptions.map((seg) => (
        <motion.path
          key={`hdonut-${seg.label}`}
          d={seg.arc}
          fill={seg.color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.3 }}
        />
      ))}

      <circle cx={cx} cy={cy} r={r * 0.55} fill="#161b22" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="18" fontWeight="800">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#8b949e" fontSize="8" fontWeight="600">
        HIGHLIGHTS
      </text>

      {arcDescriptions.map((seg, i) => (
        <g key={`hlegend-${seg.label}`}>
          <rect x="10" y={170 + i * 12} width="8" height="8" rx="2" fill={seg.color} />
          <text x="22" y={178 + i * 12} fill="#8b949e" fontSize="8" fontWeight="600">
            {seg.label.charAt(0).toUpperCase() + seg.label.slice(1)} ({seg.value})
          </text>
        </g>
      ))}
    </svg>
  );
}

function StoryImpactGauge({ score }: { score: number }): React.JSX.Element {
  const cx = 100;
  const cy = 110;
  const r = 80;

  const startAngle = -180;
  const endAngle = 0;
  const valueAngle = startAngle + (score / 100) * (endAngle - startAngle);

  const arcPath = describeDonutArc(cx, cy, r, startAngle, endAngle);
  const valueArcPath = describeDonutArc(cx, cy, r, startAngle, valueAngle);

  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : score >= 25 ? '#3b82f6' : '#ef4444';
  const needlePt = polarToCartesian(cx, cy, r - 16, valueAngle);

  return (
    <svg viewBox="0 0 200 140" style={{ width: '100%', maxWidth: 200 }}>
      {/* Background arc */}
      <path d={arcPath} fill="none" stroke="#21262d" strokeWidth="12" />

      {/* Value arc */}
      <motion.path
        d={valueArcPath}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Needle dot */}
      <circle cx={needlePt.x} cy={needlePt.y} r="4" fill={color} />

      {/* Score text */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#c9d1d9" fontSize="28" fontWeight="900">
        {score}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b949e" fontSize="9" fontWeight="600">
        IMPACT SCORE
      </text>

      {/* Scale labels */}
      <text x={cx - r - 5} y={cy + 20} textAnchor="middle" fill="#484f58" fontSize="7">0</text>
      <text x={cx} y={cy - r + 10} textAnchor="middle" fill="#484f58" fontSize="7">50</text>
      <text x={cx + r + 5} y={cy + 20} textAnchor="middle" fill="#484f58" fontSize="7">100</text>
    </svg>
  );
}

// ============================================================
// Attribute Card Sub-Component
// ============================================================

function AttributeCard({ attrKey, value }: { attrKey: CoreAttribute; value: number }): React.JSX.Element {
  const color = ATTR_COLORS[attrKey];
  const label = ATTR_LABELS[attrKey];

  return (
    <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b949e] font-semibold">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-[#0d1117] rounded-lg overflow-hidden">
        <motion.div
          className="h-full rounded-lg"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Highlight Card Sub-Component
// ============================================================

function HighlightCardItem({ highlight }: { highlight: HighlightCard }): React.JSX.Element {
  const catConfig = HIGHLIGHT_CATEGORIES.find((c) => c.id === highlight.category);
  const color = catConfig?.color ?? '#8b949e';

  return (
    <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-xs font-bold text-[#c9d1d9]">{highlight.title}</span>
        <span className="text-[10px] text-[#484f58] ml-auto">S{highlight.season}</span>
      </div>
      <p className="text-[11px] text-[#8b949e] leading-relaxed">{highlight.description}</p>
    </div>
  );
}

// ============================================================
// Tab 1: Bio Generator
// ============================================================

function BioGeneratorTab({ player, club }: { player: Player; club: Club }): React.JSX.Element {
  const [bioFields, setBioFields] = useState<BioField>({
    nickname: '',
    preferredFoot: player.preferredFoot,
    idol: '',
    playingStyle: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const bioParagraphs = useMemo(() => generateBioParagraphs(player, club, player.careerStats), [player, club]);
  const completeness = useMemo(() => {
    let score = 25;
    if (bioFields.nickname.length > 0) score += 15;
    if (bioFields.idol.length > 0) score += 15;
    if (bioFields.playingStyle.length > 0) score += 20;
    if (player.careerStats.totalAppearances > 10) score += 10;
    if (player.careerStats.totalGoals > 5) score += 10;
    if (player.traits.length > 0) score += 5;
    return Math.min(100, score);
  }, [bioFields, player]);

  const avatarColor = useMemo(
    () => club.primaryColor ?? '#30363d',
    [club]
  );

  const handleFieldChange = useCallback((field: keyof BioField, value: string) => {
    setBioFields((prev) => ({ ...prev, [field]: value }));
  }, []);

  const attributes = useMemo(
    () =>
      ATTR_KEYS.reduce((acc, k) => {
        acc[k] = player.attributes[k] ?? 50;
        return acc;
      }, {} as Record<CoreAttribute, number>),
    [player]
  );

  return (
    <div className="space-y-4">
      {/* Player Avatar + Bio */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div
            className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-white font-black text-xl"
            style={{ backgroundColor: avatarColor }}
          >
            {getInitials(player.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-white truncate">{player.name}</h3>
            <p className="text-xs text-[#8b949e]">
              {player.position} | Age {player.age} | {club.name}
            </p>
            {bioFields.nickname && (
              <p className="text-xs text-emerald-400 mt-1 font-semibold">
                &quot;{bioFields.nickname}&quot;
              </p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
          >
            <Edit3 className="h-4 w-4 text-[#8b949e]" />
          </button>
        </div>

        {/* Biography text */}
        <div className="space-y-3">
          {bioParagraphs.map((paragraph, i) => (
            <p key={i} className="text-xs text-[#8b949e] leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Editable Fields */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3"
          >
            <h4 className="text-xs text-[#8b949e] font-semibold flex items-center gap-2">
              <Edit3 className="h-3.5 w-3.5" /> Edit Bio Fields
            </h4>

            <div>
              <label className="text-[10px] text-[#484f58] font-semibold uppercase tracking-wider block mb-1">
                Nickname
              </label>
              <input
                type="text"
                value={bioFields.nickname}
                onChange={(e) => handleFieldChange('nickname', e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Enter a nickname..."
              />
            </div>

            <div>
              <label className="text-[10px] text-[#484f58] font-semibold uppercase tracking-wider block mb-1">
                Preferred Foot
              </label>
              <select
                value={bioFields.preferredFoot}
                onChange={(e) => handleFieldChange('preferredFoot', e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="right">Right</option>
                <option value="left">Left</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#484f58] font-semibold uppercase tracking-wider block mb-1">
                Football Idol
              </label>
              <input
                type="text"
                value={bioFields.idol}
                onChange={(e) => handleFieldChange('idol', e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Who inspired you..."
              />
            </div>

            <div>
              <label className="text-[10px] text-[#484f58] font-semibold uppercase tracking-wider block mb-1">
                Playing Style
              </label>
              <input
                type="text"
                value={bioFields.playingStyle}
                onChange={(e) => handleFieldChange('playingStyle', e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Describe your style..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribute Cards */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" /> Player Attributes
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {ATTR_KEYS.map((k) => (
            <AttributeCard key={k} attrKey={k} value={player.attributes[k] ?? 50} />
          ))}
        </div>
      </div>

      {/* SVG Attribute Hex Radar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5" /> Attribute Radar
        </h4>
        <div className="flex justify-center">
          <AttributeHexRadar attributes={attributes} />
        </div>
      </div>

      {/* Bio Completeness Ring + Career Timeline */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col items-center">
          <h4 className="text-xs text-[#8b949e] font-semibold mb-3">Bio Completeness</h4>
          <BioCompletenessRing completeness={completeness} />
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
          <h4 className="text-xs text-[#8b949e] font-semibold mb-3">Career Phase</h4>
          <div className="overflow-x-auto">
            <CareerPhaseTimeline currentAge={player.age} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: Card Designer
// ============================================================

function CardDesignerTab({ player, club }: { player: Player; club: Club }): React.JSX.Element {
  const [template, setTemplate] = useState<CardTemplate>('modern');
  const [bgColor, setBgColor] = useState('#161b22');
  const rarity = getRarityFromOverall(player.overall);
  const templateConfig = CARD_TEMPLATES.find((t) => t.id === template);
  const rarityConfig = RARITY_CONFIG[rarity];

  const skillMoves = Math.min(5, Math.floor(player.overall / 18) + 1);
  const weakFoot = player.preferredFoot === 'both' ? 5 : Math.min(4, Math.floor(player.overall / 25) + 1);

  const attributes = useMemo(
    () =>
      ATTR_KEYS.reduce((acc, k) => {
        acc[k] = player.attributes[k] ?? 50;
        return acc;
      }, {} as Record<CoreAttribute, number>),
    [player]
  );

  return (
    <div className="space-y-4">
      {/* Card Preview */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <Palette className="h-3.5 w-3.5" /> Card Preview
        </h4>
        <div className="relative flex justify-center">
          <CardRarityGlow rarity={rarity} />
          <div
            className="relative w-[260px] rounded-xl border-2 overflow-hidden"
            style={{ backgroundColor: bgColor, borderColor: templateConfig?.border ?? '#30363d' }}
          >
            {/* Card Header */}
            <div className="p-4 pb-2 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: templateConfig?.accent ?? '#8b949e' }}>
                    {templateConfig?.label ?? 'Card'}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${rarityConfig.color}25`, color: rarityConfig.color }}>
                    {rarityConfig.label}
                  </span>
                </div>
                <h3 className="font-black text-lg text-white mt-1">{player.name}</h3>
                <p className="text-[10px] text-[#8b949e]">
                  {player.position} | {player.nationality}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black text-sm"
                  style={{ backgroundColor: club.primaryColor }}
                >
                  {getInitials(club.name)}
                </div>
                <span className="text-[8px] text-[#8b949e] mt-1">{club.shortName}</span>
              </div>
            </div>

            {/* Overall Badge */}
            <div className="px-4 py-2">
              <OverallRatingBadge overall={player.overall} position={player.position} />
            </div>

            {/* Stats Bars */}
            <div className="px-4 pb-2">
              <CardStatsBars attributes={attributes} position={player.position} />
            </div>

            {/* Skill Moves & Weak Foot */}
            <div className="px-4 pb-3 flex gap-4">
              <SkillMovesStars rating={skillMoves} label="SKILLS" />
              <SkillMovesStars rating={weakFoot} label="WEAK" />
            </div>

            {/* Card Footer */}
            <div className="px-4 py-2 border-t border-[#30363d] flex justify-between items-center">
              <span className="text-[9px] text-[#484f58]">POT {player.potential}</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" style={{ color: rarityConfig.color }} />
                <span className="text-[9px] font-bold" style={{ color: rarityConfig.color }}>{rarityConfig.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3">Card Template</h4>
        <div className="grid grid-cols-4 gap-2">
          {CARD_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`p-3 rounded-lg border text-center transition-colors ${
                template === t.id
                  ? 'border-emerald-500 bg-[#0d1117]'
                  : 'border-[#30363d] bg-[#21262d] hover:border-[#484f58]'
              }`}
            >
              <div className="w-4 h-4 rounded mx-auto mb-1" style={{ backgroundColor: t.accent }} />
              <span className="text-[10px] font-semibold text-[#c9d1d9]">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rarity Tier */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <Award className="h-3.5 w-3.5" /> Rarity Tier
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(RARITY_CONFIG) as CardRarity[]).map((r) => {
            const cfg = RARITY_CONFIG[r];
            const isActive = rarity === r;
            return (
              <div
                key={r}
                className={`p-3 rounded-lg border text-center ${
                  isActive ? 'border-current' : 'border-[#30363d] bg-[#21262d]'
                }`}
                style={isActive ? { borderColor: cfg.color } : undefined}
              >
                <span className="text-xs font-bold" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Background Color Picker */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3">Card Background</h4>
        <div className="grid grid-cols-6 gap-2">
          {['#161b22', '#1a1a2e', '#0d1b2a', '#1b2a1b', '#2a1b1b', '#2a2a1b', '#1b1b2a', '#1b2a2a'].map(
            (color) => (
              <button
                key={color}
                onClick={() => setBgColor(color)}
                className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                  bgColor === color ? 'border-emerald-500' : 'border-[#30363d]'
                }`}
                style={{ backgroundColor: color }}
              />
            )
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-2 bg-[#21262d] border border-[#30363d] rounded-lg py-3 text-sm text-[#c9d1d9] hover:bg-[#30363d] transition-colors">
          <Share2 className="h-4 w-4" /> Share Card
        </button>
        <button className="flex items-center justify-center gap-2 bg-[#21262d] border border-[#30363d] rounded-lg py-3 text-sm text-[#c9d1d9] hover:bg-[#30363d] transition-colors">
          <Download className="h-4 w-4" /> Download
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Tab 3: Transfer History
// ============================================================

function TransferHistoryTab({ player, club }: { player: Player; club: Club }): React.JSX.Element {
  const transfers = useMemo(() => generateTransferHistory(player, club), [player, club]);
  const hasTransfers = transfers.length > 0;

  return (
    <div className="space-y-4">
      {/* Transfer List */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer History
        </h4>
        {!hasTransfers ? (
          <div className="text-center py-6">
            <ArrowLeftRight className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
            <p className="text-sm text-[#484f58]">No transfers recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transfers.map((t, i) => {
              const feeColor =
                t.feeType === 'free'
                  ? '#22c55e'
                  : t.feeType === 'loan'
                    ? '#3b82f6'
                    : t.feeType === 'undisclosed'
                      ? '#8b949e'
                      : '#f59e0b';

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="bg-[#21262d] border border-[#30363d] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#484f58] font-bold">S{t.season}</span>
                      <ChevronRight className="h-3 w-3 text-[#30363d]" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${feeColor}20`, color: feeColor }}>
                      {t.feeType.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="text-[#8b949e] truncate">{t.fromClub}</span>
                    <ArrowLeftRight className="h-3 w-3 text-[#484f58] shrink-0" />
                    <span className="text-[#c9d1d9] font-semibold truncate">{t.toClub}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#484f58]">{t.description}</span>
                    <span className="text-xs font-bold" style={{ color: feeColor }}>
                      {formatFee(t.fee, t.feeType)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transfer Fee Timeline */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" /> Fee Timeline
        </h4>
        <TransferFeeTimeline transfers={transfers} />
      </div>

      {/* Transfer Type Donut */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" /> Transfer Types
        </h4>
        <div className="flex justify-center">
          <TransferTypeDonut transfers={transfers} />
        </div>
      </div>

      {/* Market Value Graph */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" /> Market Value
        </h4>
        <MarketValueGraph player={player} />
      </div>

      {/* Transfer Profit/Loss */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" /> Financial Overview
        </h4>
        <TransferProfitLossBar transfers={transfers} />
      </div>
    </div>
  );
}

// ============================================================
// Tab 4: Career Narrative
// ============================================================

function CareerNarrativeTab({ player, club }: { player: Player; club: Club }): React.JSX.Element {
  const chapters = useMemo(() => generateNarrativeChapters(player, club), [player, club]);
  const keyMoments = useMemo(() => generateKeyMoments(player, club), [player, club]);
  const highlights = useMemo(() => generateHighlights(player), [player]);

  const impactScore = useMemo(() => {
    const base = Math.min(100, player.overall);
    const goalBonus = Math.min(15, player.careerStats.totalGoals);
    const assistBonus = Math.min(10, player.careerStats.totalAssists);
    const trophyBonus = Math.min(15, player.careerStats.trophies.length * 5);
    const appBonus = Math.min(10, Math.floor(player.careerStats.totalAppearances / 20));
    return Math.min(100, base * 0.5 + goalBonus + assistBonus + trophyBonus + appBonus);
  }, [player]);

  return (
    <div className="space-y-4">
      {/* Career Narrative */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" /> Your Story
        </h4>
        <div className="space-y-3">
          {chapters.map((chapter, i) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="bg-[#21262d] border border-[#30363d] rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500 text-[10px] font-black text-white">
                  {i + 1}
                </span>
                <span className="text-xs font-bold text-[#c9d1d9]">{chapter.title}</span>
                <span className="text-[10px] text-[#484f58] ml-auto">Season {chapter.season}</span>
              </div>
              <p className="text-[11px] text-[#8b949e] leading-relaxed">{chapter.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Narrative Progress Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3">Chapter Progress</h4>
        <NarrativeProgressBar chapters={chapters} />
      </div>

      {/* Key Moments Timeline */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" /> Key Moments
        </h4>
        <div className="space-y-2">
          {keyMoments.map((moment, i) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="flex items-start gap-3 bg-[#21262d] border border-[#30363d] rounded-lg p-2.5"
            >
              <span className="text-lg shrink-0">{moment.icon}</span>
              <div className="min-w-0">
                <p className="text-[11px] text-[#c9d1d9] font-medium">{moment.description}</p>
                <p className="text-[10px] text-[#484f58] mt-0.5">{moment.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Career Highlights */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <Star className="h-3.5 w-3.5" /> Career Highlights
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {highlights.map((hl) => (
            <HighlightCardItem key={hl.id} highlight={hl} />
          ))}
        </div>
      </div>

      {/* Career Arc Chart */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" /> Performance Rating
        </h4>
        <CareerArcChart player={player} />
      </div>

      {/* Highlight Category Donut */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5" /> Highlight Categories
        </h4>
        <div className="flex justify-center">
          <HighlightCategoryDonut highlights={highlights} />
        </div>
      </div>

      {/* Story Impact Gauge */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h4 className="text-xs text-[#8b949e] font-semibold mb-3 flex items-center gap-2">
          <Heart className="h-3.5 w-3.5" /> Story Impact
        </h4>
        <div className="flex justify-center">
          <StoryImpactGauge score={Math.round(impactScore)} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function PlayerBioGenerator(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const gameState = useGameStore((state) => state.gameState);
  const setScreen = useGameStore((state) => state.setScreen);

  const player = (gameState?.player ?? {}) as Player;
  const club = (gameState?.currentClub ?? {}) as Club;

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const tabContent = useMemo((): React.JSX.Element => {
    switch (activeTab) {
      case 0:
        return <BioGeneratorTab key={`bio-${refreshKey}`} player={player} club={club} />;
      case 1:
        return <CardDesignerTab key={`card-${refreshKey}`} player={player} club={club} />;
      case 2:
        return <TransferHistoryTab key={`transfer-${refreshKey}`} player={player} club={club} />;
      case 3:
        return <CareerNarrativeTab key={`narrative-${refreshKey}`} player={player} club={club} />;
      default:
        return <BioGeneratorTab key={`bio-${refreshKey}`} player={player} club={club} />;
    }
  }, [activeTab, refreshKey, player, club]);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('dashboard')}
          className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
        >
          <User className="h-5 w-5 text-[#8b949e]" />
        </button>
        <h2 className="text-lg font-bold text-[#c9d1d9] flex-1">Player Bio Generator</h2>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-[#21262d] transition-colors"
          title="Regenerate"
        >
          <RefreshCw className="h-4 w-4 text-[#8b949e]" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-xl p-1">
        {TABS.map((tab, i) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === i;
          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
                isActive
                  ? 'bg-[#21262d] text-emerald-400'
                  : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tabContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
