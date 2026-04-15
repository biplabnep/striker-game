'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  Users,
  Calendar,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  Shield,
  Activity,
  Target,
  Clock,
  Zap,
  ChevronRight,
  TrendingUp,
  Timer,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/store/gameStore';
import { Position } from '@/lib/game/types';

// ============================================================
// Design Tokens
// ============================================================

const BG = '#0d1117';
const CARD = '#161b22';
const TEXT = '#c9d1d9';
const SECONDARY = '#8b949e';
const BORDER = '#30363d';
const ACCENT_ORANGE = '#FF5500';
const ACCENT_LIME = '#CCFF00';
const ACCENT_CYAN = '#00E5FF';
const ACCENT_GRAY = '#666666';

// ============================================================
// Animation variants (opacity-only, no transforms)
// ============================================================

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const staggerChild = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

// ============================================================
// Seeded Random
// ============================================================

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function hashString(str: string): number {
  return str
    .split('')
    .reduce((h, ch) => ((h << 5) - h + ch.charCodeAt(0)) | 0, 0);
}

// ============================================================
// Types & Interfaces
// ============================================================

interface SquadPlayer {
  id: string;
  name: string;
  position: Position;
  ovr: number;
  fitness: number;
  form: number;
  consecutiveGames: number;
  injuryHistoryCount: number;
  isStarter: boolean;
  isUser: boolean;
  minutesPlayed: number[];
}

interface RotationSuggestion {
  id: string;
  restPlayer: SquadPlayer;
  bringInPlayer: SquadPlayer;
  reason: string;
  impact: number;
}

interface UpcomingFixture {
  competition: 'league' | 'cup' | 'continental';
  opponent: string;
  difficulty: 'easy' | 'medium' | 'hard';
  weekOffset: number;
}

// ============================================================
// Constants
// ============================================================

const FIRST_NAMES = [
  'Marcus', 'James', 'Oliver', 'Carlos', 'Luis', 'Serge', 'Antonio',
  'Thiago', 'Mohamed', 'Kevin', 'Virgil', 'Bruno', 'Paul', 'Raheem',
  'Jadon', 'Phil', 'Bukayo', 'Declan', 'Jude', 'Florian', 'Gabriel',
  'Rafael', 'Pierre', 'Ousmane', 'Robert', 'Achraf', 'Federico',
  'Milan', 'Ederson', 'Alisson', 'Manuel', 'Keylor', 'Hugo',
  'Aymeric', 'Ruben', 'Ibrahima', 'Nathan', 'Levi', 'Aaron',
  'Martin', 'Trent', 'Reece', 'Ben', 'John', 'Kyle', 'Kieran',
];

const LAST_NAMES = [
  'Rashford', 'Walker', 'Smith', 'Silva', 'Diaz', 'Gnabry', 'Rudiger',
  'Henderson', 'Salah', 'De Bruyne', 'Van Dijk', 'Fernandes', 'Pogba',
  'Sterling', 'Sancho', 'Foden', 'Saka', 'Rice', 'Bellingham', 'Wirtz',
  'Jesus', 'Leao', 'Emery', 'Dembele', 'Lewandowski', 'Hakimi', 'Chiesa',
  'Martinez', 'Neuer', 'Navas', 'Lloris',
  'Laporte', 'Dias', 'Konate', 'Ake', 'Colwill', 'Cresswell',
  'Odegaard', 'Alexander-Arnold', 'James', 'White', 'Stones',
];

const SQUAD_POSITIONS: Position[] = [
  'GK', 'GK',
  'CB', 'CB', 'CB', 'LB', 'RB',
  'CDM', 'CM', 'CM', 'CAM',
  'LW', 'RW', 'ST', 'ST', 'CF',
  'CM', 'CB', 'RB', 'LM', 'ST',
];

const COMPETITION_ICONS: Record<string, { icon: string; label: string }> = {
  league: { icon: '🏟️', label: 'League' },
  cup: { icon: '🏆', label: 'Cup' },
  continental: { icon: '🌍', label: 'Europe' },
};

// ============================================================
// Helper functions
// ============================================================

function getPositionGroup(pos: Position): string {
  switch (pos) {
    case 'GK': return 'GK';
    case 'CB': case 'LB': case 'RB': return 'DEF';
    case 'CDM': case 'CM': case 'CAM': case 'LM': case 'RM': return 'MID';
    case 'LW': case 'RW': case 'ST': case 'CF': return 'ATT';
    default: return 'MID';
  }
}

function generateSquad(
  clubName: string,
  userName: string,
  userPosition: Position,
  userOvr: number,
  season: number,
  week: number,
): SquadPlayer[] {
  const baseSeed = Math.abs(hashString(clubName + userName + season.toString() + week.toString()));
  const rng = seededRandom(baseSeed);
  const players: SquadPlayer[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < SQUAD_POSITIONS.length; i++) {
    const pos = SQUAD_POSITIONS[i];
    let name = '';
    let isUser = false;

    if (i === 0 && userPosition === 'GK') {
      name = userName;
      isUser = true;
    } else {
      const userSlotIdx = SQUAD_POSITIONS.findIndex((p) => p === userPosition);
      if (i === (userSlotIdx === -1 ? 2 : userSlotIdx + 1)) {
        name = userName;
        isUser = true;
      } else {
        let firstName = '';
        let lastName = '';
        do {
          firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
          lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
        } while (usedNames.has(`${firstName} ${lastName}`));
        usedNames.add(`${firstName} ${lastName}`);
        name = `${firstName} ${lastName}`;
      }
    }

    const isBenchSlot = i >= 14;
    const ovrBase = isBenchSlot ? userOvr - 8 : userOvr;
    const ovr = Math.max(50, Math.min(95, Math.round(ovrBase + (rng() - 0.5) * (isBenchSlot ? 16 : 20))));
    const fitnessBase = 85 - (i * 3.2) + (rng() * 40 - 20);
    const fitness = Math.max(35, Math.min(99, Math.round(fitnessBase + (season - 1) * 2 + week * 0.5)));
    const form = Math.max(3, Math.min(9, Math.round(6 + (rng() - 0.5) * 6)));
    const consecutiveGames = Math.max(1, Math.min(8, Math.round(fitness < 70 ? 3 + rng() * 5 : 1 + rng() * 3)));
    const injuryHistoryCount = Math.max(0, Math.min(5, Math.round((1 - fitness / 100) * 4 + rng() * 2)));

    const minutesArr: number[] = [];
    for (let m = 0; m < 8; m++) {
      minutesArr.push(Math.max(0, Math.min(90, Math.round(
        (isBenchSlot ? rng() * 30 + 10 : rng() * 40 + 50) + (rng() - 0.5) * 20
      ))));
    }

    players.push({
      id: isUser ? 'user' : `squad-${i}`,
      name,
      position: pos,
      ovr,
      fitness,
      form,
      consecutiveGames,
      injuryHistoryCount,
      isStarter: !isBenchSlot && fitness >= 55,
      isUser,
      minutesPlayed: minutesArr,
    });
  }

  const scored = players.map((p) => ({
    ...p,
    score: p.fitness * 0.5 + p.form * 5 + p.ovr * 0.1,
  }));
  scored.sort((a, b) => b.score - a.score);
  const starterIds = new Set(scored.slice(0, 11).map((p) => p.id));

  return players.map((p) => ({
    ...p,
    isStarter: starterIds.has(p.id),
  }));
}

function generateSuggestions(squad: SquadPlayer[]): RotationSuggestion[] {
  const starters = squad.filter((p) => p.isStarter).sort((a, b) => a.fitness - b.fitness);
  const bench = squad.filter((p) => !p.isStarter && !p.isUser).sort((a, b) => b.fitness - a.fitness);
  const suggestions: RotationSuggestion[] = [];

  if (starters.length > 0 && bench.length > 0) {
    const tiredStarter = starters[0];
    if (tiredStarter.fitness < 75) {
      const positionGroup = getPositionGroup(tiredStarter.position);
      const replacement = bench.find((b) => getPositionGroup(b.position) === positionGroup) || bench[0];
      suggestions.push({
        id: 'sug-1',
        restPlayer: tiredStarter,
        bringInPlayer: replacement,
        reason: `${tiredStarter.name} has ${tiredStarter.fitness}% fitness after ${tiredStarter.consecutiveGames} consecutive games.`,
        impact: Math.round((replacement.fitness - tiredStarter.fitness) * 0.6 + (replacement.ovr - tiredStarter.ovr) * 0.4),
      });
    }
  }

  const highGames = starters.filter((s) => s.consecutiveGames >= 5 && s.fitness < 70);
  if (highGames.length > 0 && bench.length > 0) {
    const risky = highGames[0];
    const positionGroup = getPositionGroup(risky.position);
    const replacement = bench.find((b) => getPositionGroup(b.position) === positionGroup && b.fitness > 75) || bench[0];
    if (replacement && !suggestions.some((s) => s.restPlayer.id === risky.id)) {
      suggestions.push({
        id: 'sug-2',
        restPlayer: risky,
        bringInPlayer: replacement,
        reason: `${risky.name} has played ${risky.consecutiveGames} games in a row — high injury risk.`,
        impact: Math.round((replacement.fitness - risky.fitness) * 0.5 + 5),
      });
    }
  }

  if (starters.length > 2 && bench.length > 0) {
    const midFitStarter = starters[Math.min(2, starters.length - 1)];
    if (midFitStarter && midFitStarter.fitness < 80 && !suggestions.some((s) => s.restPlayer.id === midFitStarter.id)) {
      const freshBench = bench.find((b) => b.fitness >= 80);
      if (freshBench) {
        suggestions.push({
          id: 'sug-3',
          restPlayer: midFitStarter,
          bringInPlayer: freshBench,
          reason: `Rotate ${midFitStarter.name} to keep squad fresh for upcoming fixtures.`,
          impact: Math.round((freshBench.fitness - midFitStarter.fitness) * 0.4 + (freshBench.form - midFitStarter.form) * 2),
        });
      }
    }
  }

  return suggestions;
}

function generateFixtures(seed: number): UpcomingFixture[] {
  const rng = seededRandom(seed);
  const opponents = ['City', 'Arsenal', 'Chelsea', 'Liverpool', 'Spurs', 'United', 'Newcastle', 'Villa'];
  const competitions: ('league' | 'cup' | 'continental')[] = ['league', 'cup', 'league', 'continental', 'league', 'cup', 'league', 'continental'];
  const fixtures: UpcomingFixture[] = [];

  for (let i = 0; i < 8; i++) {
    const diffVal = rng();
    const difficulty: 'easy' | 'medium' | 'hard' = diffVal < 0.33 ? 'easy' : diffVal < 0.66 ? 'medium' : 'hard';
    fixtures.push({
      competition: competitions[i],
      opponent: opponents[i % opponents.length],
      difficulty,
      weekOffset: i + 1,
    });
  }
  return fixtures;
}

// ============================================================
// SVG 1: PositionCoverageRadar (5-axis radar, #FF5500)
// ============================================================

function PositionCoverageRadar({ data }: { data: number[] }) {
  const labels = ['GK', 'DEF', 'MID', 'ATT', 'Utility'];
  const cx = 100;
  const cy = 100;
  const maxR = 80;
  const n = 5;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const polygonPoints = data.map((val, i) => {
    const angle = startAngle + i * angleStep;
    const r = (val / 100) * maxR;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 200 }}>
      {gridRings.map((ring, idx) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const angle = startAngle + i * angleStep;
          const r = ring * maxR;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={idx} points={pts} fill="none" stroke={BORDER} strokeWidth="0.5" />;
      })}
      {labels.map((label, i) => {
        const angle = startAngle + i * angleStep;
        const lx = cx + (maxR + 14) * Math.cos(angle);
        const ly = cy + (maxR + 14) * Math.sin(angle);
        return (
          <g key={label}>
            <line x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke={BORDER} strokeWidth="0.5" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={SECONDARY} fontSize="9" fontWeight="600">{label}</text>
          </g>
        );
      })}
      <polygon points={polygonPoints} fill={`${ACCENT_ORANGE}20`} stroke={ACCENT_ORANGE} strokeWidth="1.5" />
      {data.map((val, i) => {
        const angle = startAngle + i * angleStep;
        const r = (val / 100) * maxR;
        return (
          <circle key={`dot-${i}`} cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r="3" fill={ACCENT_ORANGE} />
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 2: FitnessDistributionDonut (4-seg, via .reduce())
// ============================================================

function FitnessDistributionDonut({ fitnessData }: { fitnessData: number[] }) {
  const segments = fitnessData.reduce(
    (acc, f) => {
      if (f >= 80) acc[0]++;
      else if (f >= 60) acc[1]++;
      else if (f >= 40) acc[2]++;
      else acc[3]++;
      return acc;
    },
    [0, 0, 0, 0] as number[],
  );
  const labels = ['Fresh', 'Good', 'Fatigued', 'Exhausted'];
  const colors = [ACCENT_LIME, ACCENT_CYAN, ACCENT_ORANGE, ACCENT_GRAY];
  const total = segments.reduce((a, b) => a + b, 0);
  const cx = 100;
  const cy = 100;
  const r = 60;
  const innerR = 36;

  const arcPaths = segments.reduce<{ paths: { d: string; color: string; label: string; count: number }[]; startAngle: number }>(
    (acc, seg, i) => {
      if (seg === 0) return acc;
      const sliceAngle = (seg / total) * 2 * Math.PI;
      const endAngle = acc.startAngle + sliceAngle;
      const x1 = cx + r * Math.cos(acc.startAngle);
      const y1 = cy + r * Math.sin(acc.startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(acc.startAngle);
      const iy2 = cy + innerR * Math.sin(acc.startAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
      return {
        paths: [...acc.paths, { d, color: colors[i], label: labels[i], count: seg }],
        startAngle: endAngle,
      };
    },
    { paths: [], startAngle: -Math.PI / 2 },
  );

  const avgFitness = total > 0 ? Math.round(fitnessData.reduce((a, b) => a + b, 0) / fitnessData.length) : 0;

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 200 }}>
      {arcPaths.paths.map((arc, idx) => (
        <path key={idx} d={arc.d} fill={arc.color} opacity="0.85" />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={TEXT} fontSize="20" fontWeight="700">{avgFitness}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={SECONDARY} fontSize="9">avg fitness</text>
      {arcPaths.paths.map((arc, idx) => (
        <text key={`label-${idx}`} x={cx} y={cy + r + 14 + idx * 12} textAnchor="middle" fill={arc.color} fontSize="8" fontWeight="600">
          {arc.label}: {arc.count}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 3: OverallSquadRatingGauge (semi-circular, #CCFF00)
// ============================================================

function OverallSquadRatingGauge({ rating }: { rating: number }) {
  const cx = 100;
  const cy = 110;
  const r = 70;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalAngle = Math.PI;
  const clampedRating = Math.max(0, Math.min(100, rating));
  const valueAngle = startAngle - (clampedRating / 100) * totalAngle;

  const arcStartX = cx + r * Math.cos(startAngle);
  const arcStartY = cy + r * Math.sin(startAngle);
  const arcEndX = cx + r * Math.cos(endAngle);
  const arcEndY = cy + r * Math.sin(endAngle);
  const valueEndX = cx + r * Math.cos(valueAngle);
  const valueEndY = cy + r * Math.sin(valueAngle);
  const largeArc = clampedRating > 50 ? 1 : 0;

  const bgArc = `M ${arcStartX} ${arcStartY} A ${r} ${r} 0 1 1 ${arcEndX} ${arcEndY}`;
  const valueArc = `M ${arcStartX} ${arcStartY} A ${r} ${r} 0 ${largeArc} 1 ${valueEndX} ${valueEndY}`;

  const ratingLabel = clampedRating >= 80 ? 'Excellent' : clampedRating >= 65 ? 'Good' : clampedRating >= 50 ? 'Average' : 'Needs Work';

  return (
    <svg viewBox="0 0 200 140" className="w-full" style={{ maxHeight: 140 }}>
      <path d={bgArc} fill="none" stroke={BORDER} strokeWidth="10" strokeLinecap="round" />
      <path d={valueArc} fill="none" stroke={ACCENT_LIME} strokeWidth="10" strokeLinecap="round" />
      <circle cx={valueEndX} cy={valueEndY} r="4" fill={ACCENT_LIME} />
      <text x={cx} y={cy - 18} textAnchor="middle" fill={TEXT} fontSize="24" fontWeight="700">{clampedRating}</text>
      <text x={cx} y={cy - 4} textAnchor="middle" fill={SECONDARY} fontSize="8">SQUAD RATING</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill={ACCENT_LIME} fontSize="10" fontWeight="600">{ratingLabel}</text>
      <text x={cx - r + 10} y={cy + 8} textAnchor="start" fill={SECONDARY} fontSize="7">0</text>
      <text x={cx + r - 10} y={cy + 8} textAnchor="end" fill={SECONDARY} fontSize="7">100</text>
    </svg>
  );
}

// ============================================================
// SVG 4: RotationImpactBars (5 bars, #FF5500/#CCFF00/#00E5FF/#666/#FF5500)
// ============================================================

function RotationImpactBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const barWidth = 36;
  const gap = 8;
  const maxH = 100;
  const totalW = data.length * barWidth + (data.length - 1) * gap;
  const offsetX = (200 - totalW) / 2;

  return (
    <svg viewBox="0 0 200 150" className="w-full" style={{ maxHeight: 150 }}>
      {data.map((item, i) => {
        const x = offsetX + i * (barWidth + gap);
        const barH = (item.value / 100) * maxH;
        const y = 120 - barH;
        return (
          <g key={item.label}>
            <rect x={x} y={y} width={barWidth} height={barH} rx="3" fill={item.color} opacity="0.85" />
            <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fill={TEXT} fontSize="8" fontWeight="600">{item.value}%</text>
            <text x={x + barWidth / 2} y={140} textAnchor="middle" fill={SECONDARY} fontSize="6" fontWeight="500">
              {item.label.length > 8 ? item.label.slice(0, 7) + '..' : item.label}
            </text>
          </g>
        );
      })}
      <line x1={offsetX - 4} y1={120} x2={offsetX + totalW + 4} y2={120} stroke={BORDER} strokeWidth="0.5" />
    </svg>
  );
}

// ============================================================
// SVG 5: FixtureDifficultyArea (8-point area chart)
// ============================================================

function FixtureDifficultyArea({ fixtures }: { fixtures: UpcomingFixture[] }) {
  const w = 320;
  const h = 140;
  const padX = 30;
  const padY = 20;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;
  const stepX = plotW / (fixtures.length - 1 || 1);

  const diffVal = (d: 'easy' | 'medium' | 'hard') => d === 'easy' ? 20 : d === 'medium' ? 55 : 90;

  const points = fixtures.map((f, i) => ({
    x: padX + i * stepX,
    y: padY + plotH - (diffVal(f.difficulty) / 100) * plotH,
    fixture: f,
  }));

  const areaPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const closedArea = `${areaPath} L ${points[points.length - 1].x} ${padY + plotH} L ${points[0].x} ${padY + plotH} Z`;
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: h }}>
      {[20, 55, 90].map((val) => {
        const y = padY + plotH - (val / 100) * plotH;
        return (
          <g key={val}>
            <line x1={padX} y1={y} x2={padX + plotW} y2={y} stroke={BORDER} strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={padX - 4} y={y + 3} textAnchor="end" fill={SECONDARY} fontSize="7">{val === 20 ? 'Easy' : val === 55 ? 'Med' : 'Hard'}</text>
          </g>
        );
      })}
      <path d={closedArea} fill={`${ACCENT_CYAN}33`} />
      <path d={linePath} fill="none" stroke={ACCENT_CYAN} strokeWidth="1.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={ACCENT_CYAN} />
          <text x={p.x} y={padY + plotH + 12} textAnchor="middle" fill={SECONDARY} fontSize="6">{p.fixture.opponent.slice(0, 6)}</text>
          <text x={p.x} y={p.y - 8} textAnchor="middle" fill={p.fixture.difficulty === 'hard' ? ACCENT_ORANGE : p.fixture.difficulty === 'medium' ? '#f59e0b' : ACCENT_LIME} fontSize="6" fontWeight="600">
            {p.fixture.competition === 'league' ? '🏟' : p.fixture.competition === 'cup' ? '🏆' : '🌍'}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 6: RestPriorityDonut (4-seg, via .reduce())
// ============================================================

function RestPriorityDonut({ squad }: { squad: SquadPlayer[] }) {
  const segments = squad.reduce(
    (acc, p) => {
      if (p.fitness < 45) acc[0]++;
      else if (p.fitness < 65) acc[1]++;
      else if (p.fitness < 80) acc[2]++;
      else acc[3]++;
      return acc;
    },
    [0, 0, 0, 0] as number[],
  );
  const labels = ['High', 'Medium', 'Low', 'None'];
  const colors = [ACCENT_ORANGE, ACCENT_LIME, ACCENT_CYAN, ACCENT_GRAY];
  const total = segments.reduce((a, b) => a + b, 0);
  const cx = 100;
  const cy = 100;
  const r = 60;
  const innerR = 36;

  const arcPaths = segments.reduce<{ paths: { d: string; color: string; label: string; count: number }[]; startAngle: number }>(
    (acc, seg, i) => {
      if (seg === 0) return acc;
      const sliceAngle = (seg / total) * 2 * Math.PI;
      const endAngle = acc.startAngle + sliceAngle;
      const x1 = cx + r * Math.cos(acc.startAngle);
      const y1 = cy + r * Math.sin(acc.startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(acc.startAngle);
      const iy2 = cy + innerR * Math.sin(acc.startAngle);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;
      const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
      return {
        paths: [...acc.paths, { d, color: colors[i], label: labels[i], count: seg }],
        startAngle: endAngle,
      };
    },
    { paths: [], startAngle: -Math.PI / 2 },
  );

  const highCount = segments[0];

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 200 }}>
      {arcPaths.paths.map((arc, idx) => (
        <path key={idx} d={arc.d} fill={arc.color} opacity="0.85" />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={highCount > 3 ? ACCENT_ORANGE : TEXT} fontSize="18" fontWeight="700">{highCount}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={SECONDARY} fontSize="8">need rest</text>
      {arcPaths.paths.map((arc, idx) => (
        <g key={`legend-${idx}`}>
          <rect x={10} y={148 + idx * 13} width="8" height="8" rx="2" fill={arc.color} />
          <text x={22} y={156 + idx * 13} fill={SECONDARY} fontSize="8">{arc.label}: {arc.count}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 7: MinutesPlayedLine (8-point line chart, #CCFF00)
// ============================================================

function MinutesPlayedLine({ players }: { players: { name: string; minutes: number[] }[] }) {
  const w = 320;
  const h = 160;
  const padX = 35;
  const padY = 20;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;
  const stepX = plotW / 7;

  const lineColors = [ACCENT_LIME, ACCENT_CYAN, ACCENT_ORANGE, '#a855f7', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: h }}>
      {[0, 30, 60, 90].map((val) => {
        const y = padY + plotH - (val / 90) * plotH;
        return (
          <g key={val}>
            <line x1={padX} y1={y} x2={padX + plotW} y2={y} stroke={BORDER} strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={padX - 4} y={y + 3} textAnchor="end" fill={SECONDARY} fontSize="7">{val}'</text>
          </g>
        );
      })}
      {Array.from({ length: 8 }, (_, wi) => (
        <text key={`week-${wi}`} x={padX + wi * stepX} y={padY + plotH + 14} textAnchor="middle" fill={SECONDARY} fontSize="7">W{wi + 1}</text>
      ))}
      {players.slice(0, 8).map((player, pi) => {
        const linePath = player.minutes.map((m, mi) => `${mi === 0 ? 'M' : 'L'} ${padX + mi * stepX} ${padY + plotH - (m / 90) * plotH}`).join(' ');
        return (
          <g key={player.name}>
            <path d={linePath} fill="none" stroke={lineColors[pi % lineColors.length]} strokeWidth="1.2" opacity="0.8" />
            {player.minutes.map((m, mi) => (
              <circle key={mi} cx={padX + mi * stepX} cy={padY + plotH - (m / 90) * plotH} r="2" fill={lineColors[pi % lineColors.length]} />
            ))}
          </g>
        );
      })}
      {players.slice(0, 5).map((player, pi) => (
        <g key={`legend-${player.name}`}>
          <line x1={padX + plotW - 80} y1={padY + 4 + pi * 10} x2={padX + plotW - 66} y2={padY + 4 + pi * 10} stroke={lineColors[pi]} strokeWidth="1.5" />
          <text x={padX + plotW - 62} y={padY + 7 + pi * 10} fill={SECONDARY} fontSize="6">
            {player.name.length > 10 ? player.name.slice(0, 9) + '..' : player.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 8: WorkloadRadar (5-axis: Starters/Subs/Unused/Youth/Loaned, #FF5500)
// ============================================================

function WorkloadRadar({ data }: { data: number[] }) {
  const labels = ['Starters', 'Subs', 'Unused', 'Youth', 'Loaned'];
  const cx = 100;
  const cy = 100;
  const maxR = 75;
  const n = 5;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const polygonPoints = data.map((val, i) => {
    const angle = startAngle + i * angleStep;
    const r = (val / 100) * maxR;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 200 }}>
      {gridRings.map((ring, idx) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const angle = startAngle + i * angleStep;
          const r = ring * maxR;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={idx} points={pts} fill="none" stroke={BORDER} strokeWidth="0.5" />;
      })}
      {labels.map((label, i) => {
        const angle = startAngle + i * angleStep;
        const lx = cx + (maxR + 16) * Math.cos(angle);
        const ly = cy + (maxR + 16) * Math.sin(angle);
        return (
          <g key={label}>
            <line x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke={BORDER} strokeWidth="0.5" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={SECONDARY} fontSize="8" fontWeight="500">{label}</text>
          </g>
        );
      })}
      <polygon points={polygonPoints} fill={`${ACCENT_ORANGE}20`} stroke={ACCENT_ORANGE} strokeWidth="1.5" />
      {data.map((val, i) => {
        const angle = startAngle + i * angleStep;
        const r = (val / 100) * maxR;
        return (
          <circle key={`dot-${i}`} cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r="3" fill={ACCENT_ORANGE} />
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 9: FatigueRiskBars (5 bars: GK/DEF/MID/ATT/Star, #00E5FF/#CCFF00/#FF5500/#666/#FF5500)
// ============================================================

function FatigueRiskBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const barH = 16;
  const gap = 8;
  const maxBarW = 140;
  const labelW = 40;
  const startY = 15;

  return (
    <svg viewBox="0 0 220 130" className="w-full" style={{ maxHeight: 130 }}>
      {data.map((item, i) => {
        const y = startY + i * (barH + gap);
        const barW = (item.value / 100) * maxBarW;
        return (
          <g key={item.label}>
            <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill={SECONDARY} fontSize="9" fontWeight="600">{item.label}</text>
            <rect x={labelW} y={y} width={maxBarW} height={barH} rx="3" fill={`${BORDER}`} />
            <rect x={labelW} y={y} width={barW} height={barH} rx="3" fill={item.color} opacity="0.85" />
            <text x={labelW + barW + 6} y={y + barH / 2 + 3} fill={TEXT} fontSize="8" fontWeight="700">{item.value}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 10: FormationFlexibilityRadar (5-axis, #CCFF00)
// ============================================================

function FormationFlexibilityRadar({ data }: { data: number[] }) {
  const labels = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '4-5-1'];
  const cx = 100;
  const cy = 100;
  const maxR = 75;
  const n = 5;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const polygonPoints = data.map((val, i) => {
    const angle = startAngle + i * angleStep;
    const r = (val / 100) * maxR;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 200 }}>
      {gridRings.map((ring, idx) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const angle = startAngle + i * angleStep;
          const r = ring * maxR;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={idx} points={pts} fill="none" stroke={BORDER} strokeWidth="0.5" />;
      })}
      {labels.map((label, i) => {
        const angle = startAngle + i * angleStep;
        const lx = cx + (maxR + 18) * Math.cos(angle);
        const ly = cy + (maxR + 18) * Math.sin(angle);
        return (
          <g key={label}>
            <line x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke={BORDER} strokeWidth="0.5" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={SECONDARY} fontSize="8" fontWeight="600">{label}</text>
          </g>
        );
      })}
      <polygon points={polygonPoints} fill={`${ACCENT_LIME}20`} stroke={ACCENT_LIME} strokeWidth="1.5" />
      {data.map((val, i) => {
        const angle = startAngle + i * angleStep;
        const r = (val / 100) * maxR;
        return (
          <circle key={`dot-${i}`} cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r="3" fill={ACCENT_LIME} />
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 11: RotationSuccessRateRing (circular ring, #00E5FF)
// ============================================================

function RotationSuccessRateRing({ rate }: { rate: number }) {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const sw = 10;
  const clampedRate = Math.max(0, Math.min(100, rate));
  const circumference = 2 * Math.PI * r;
  const dashLength = (clampedRate / 100) * circumference;
  const gapLength = circumference - dashLength;
  const quarterOffset = circumference / 4;

  return (
    <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: 200 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={sw} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={ACCENT_CYAN}
        strokeWidth={sw}
        strokeDasharray={`${dashLength} ${gapLength}`}
        strokeDashoffset={`${quarterOffset}`}
        strokeLinecap="round"
      />
      <text x={cx} y={cy - 10} textAnchor="middle" fill={TEXT} fontSize="26" fontWeight="700">{clampedRate}%</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill={SECONDARY} fontSize="8">WIN RATE</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill={ACCENT_CYAN} fontSize="8" fontWeight="600">WHEN ROTATING</text>
    </svg>
  );
}

// ============================================================
// SVG 12: KeyMatchupTimeline (8-node horizontal, #FF5500)
// ============================================================

function KeyMatchupTimeline({ fixtures }: { fixtures: UpcomingFixture[] }) {
  const w = 360;
  const h = 90;
  const padX = 30;
  const padY = 30;
  const usableW = w - padX * 2;
  const stepX = usableW / (fixtures.length - 1 || 1);
  const lineY = padY;

  const diffColor = (d: 'easy' | 'medium' | 'hard') => d === 'hard' ? ACCENT_ORANGE : d === 'medium' ? '#f59e0b' : ACCENT_LIME;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: h }}>
      <line x1={padX} y1={lineY} x2={padX + usableW} y2={lineY} stroke={BORDER} strokeWidth="1.5" />
      {fixtures.map((f, i) => {
        const x = padX + i * stepX;
        const c = diffColor(f.difficulty);
        return (
          <g key={i}>
            <circle cx={x} cy={lineY} r="6" fill={BG} stroke={c} strokeWidth="2" />
            <circle cx={x} cy={lineY} r="2.5" fill={c} />
            <text x={x} y={lineY - 12} textAnchor="middle" fill={SECONDARY} fontSize="6" fontWeight="500">
              {f.competition === 'league' ? '🏟️' : f.competition === 'cup' ? '🏆' : '🌍'}
            </text>
            <text x={x} y={lineY + 18} textAnchor="middle" fill={TEXT} fontSize="7" fontWeight="600">{f.opponent}</text>
            <text x={x} y={lineY + 30} textAnchor="middle" fill={c} fontSize="6">{f.difficulty.toUpperCase()}</text>
            <text x={x} y={lineY + 40} textAnchor="middle" fill={SECONDARY} fontSize="5">W{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ color: SECONDARY }} className="text-xs font-semibold uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

function InfoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border p-4 ${className}`}
      style={{ backgroundColor: CARD, borderColor: BORDER, borderRadius: 8 }}
    >
      {children}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center p-2" style={{ backgroundColor: BG, borderRadius: 8 }}>
      <span style={{ color: SECONDARY }} className="text-[9px] uppercase mb-0.5">{label}</span>
      <span style={{ color }} className="text-sm font-bold">{value}</span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SquadRotationEnhanced() {
  const gameState = useGameStore((s) => s.gameState);
  const [activeTab, setActiveTab] = useState('overview');

  const clubName = gameState?.currentClub.name ?? 'FC Elite';
  const playerName = gameState?.player.name ?? 'Player';
  const playerPosition = gameState?.player.position ?? 'CM';
  const playerOvr = gameState?.player.overall ?? 75;
  const season = gameState?.currentSeason ?? 1;
  const week = gameState?.currentWeek ?? 1;

  // Generate all data as plain const (no useMemo)
  const squad = gameState
    ? generateSquad(clubName, playerName, playerPosition, playerOvr, season, week)
    : generateSquad('FC Elite', 'Player', 'CM', 75, 1, 1);

  const sortedByFitness = [...squad].sort((a, b) => a.fitness - b.fitness);
  const starters = sortedByFitness.filter((p) => p.isStarter);
  const rotationPlayers = sortedByFitness.filter((p) => !p.isStarter);
  const atRiskPlayers = squad.filter((p) => p.fitness < 60);
  const suggestions = generateSuggestions(squad);
  const fixtures = generateFixtures(Math.abs(hashString(clubName + season.toString() + week.toString())));

  // Computed SVG data via .reduce() and IIFE
  const positionCounts = squad.reduce(
    (acc, p) => {
      const g = getPositionGroup(p.position);
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const positionCoverageData = [
    Math.min(100, ((positionCounts['GK'] || 0) / 2) * 100),
    Math.min(100, ((positionCounts['DEF'] || 0) / 5) * 100),
    Math.min(100, ((positionCounts['MID'] || 0) / 5) * 100),
    Math.min(100, ((positionCounts['ATT'] || 0) / 5) * 100),
    Math.min(100, (squad.filter((p) => p.ovr >= 70).length / squad.length) * 100),
  ];

  const fitnessValues = squad.map((p) => p.fitness);
  const avgSquadRating = Math.round(squad.reduce((a, p) => a + p.ovr, 0) / squad.length);

  const rotationImpactData = [
    { label: 'GK Rotation', value: Math.round(seededRandom(101)() * 30 + 60), color: ACCENT_ORANGE },
    { label: 'DEF Shuffle', value: Math.round(seededRandom(102)() * 30 + 55), color: ACCENT_LIME },
    { label: 'MID Refresh', value: Math.round(seededRandom(103)() * 35 + 50), color: ACCENT_CYAN },
    { label: 'ATT Rotation', value: Math.round(seededRandom(104)() * 25 + 45), color: ACCENT_GRAY },
    { label: 'Full Cycle', value: Math.round(seededRandom(105)() * 40 + 40), color: ACCENT_ORANGE },
  ];

  const minutesData = starters.slice(0, 8).map((p) => ({
    name: p.name.split(' ').pop() || p.name,
    minutes: p.minutesPlayed,
  }));

  const workloadData = [
    Math.min(100, (starters.length / 11) * 100),
    Math.min(100, (rotationPlayers.length / 9) * 100),
    Math.min(100, squad.filter((p) => p.fitness < 50).length * 20),
    Math.min(100, seededRandom(201)() * 40 + 20),
    Math.min(100, seededRandom(202)() * 25 + 10),
  ];

  const fatigueByGroup = ['GK', 'DEF', 'MID', 'ATT', 'Star'].map((group) => {
    const relevant = group === 'Star'
      ? squad.filter((p) => p.ovr >= 82)
      : squad.filter((p) => getPositionGroup(p.position) === group);
    const avgFatigue = relevant.length > 0
      ? Math.round(relevant.reduce((a, p) => a + p.fitness, 0) / relevant.length)
      : 0;
    return {
      label: group,
      value: 100 - avgFatigue,
      color: group === 'GK' ? ACCENT_CYAN : group === 'DEF' ? ACCENT_LIME : group === 'MID' ? ACCENT_ORANGE : group === 'ATT' ? ACCENT_GRAY : ACCENT_ORANGE,
    };
  });

  const formationData = [85, 72, 60, 78, 55].map((v) => Math.round(v + seededRandom(301)() * 20 - 10));

  const successRate = Math.round(seededRandom(401)() * 30 + 50);

  // No game state early return (after all hooks above)
  if (!gameState) {
    return (
      <div style={{ backgroundColor: BG }} className="min-h-screen">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="p-8 text-center border" style={{ backgroundColor: CARD, borderColor: BORDER, borderRadius: 8 }}>
            <RotateCcw className="mx-auto mb-3" style={{ color: SECONDARY, width: 40, height: 40, opacity: 0.4 }} />
            <h2 className="text-lg font-semibold text-white mb-2">No Career Data</h2>
            <p style={{ color: SECONDARY }} className="text-sm">Start a career to view the enhanced squad rotation planner.</p>
          </div>
        </div>
      </div>
    );
  }

  // ---- TAB 1: SQUAD OVERVIEW ----
  const squadOverviewTab = (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      {/* SVG 1: Position Coverage Radar */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <Shield style={{ color: ACCENT_ORANGE }} className="w-4 h-4" />
            <SectionTitle>Position Coverage</SectionTitle>
          </div>
          <div className="flex justify-center">
            <div className="w-48">
              <PositionCoverageRadar data={positionCoverageData} />
            </div>
          </div>
          <div className="flex justify-around mt-3">
            {['GK', 'DEF', 'MID', 'ATT', 'Util'].map((label, i) => (
              <div key={label} className="text-center">
                <span style={{ color: ACCENT_ORANGE }} className="text-xs font-bold">{positionCoverageData[i]}%</span>
                <span style={{ color: SECONDARY }} className="block text-[8px]">{label}</span>
              </div>
            ))}
          </div>
        </InfoCard>
      </motion.div>

      {/* SVG 2: Fitness Distribution Donut */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <Activity style={{ color: ACCENT_CYAN }} className="w-4 h-4" />
            <SectionTitle>Fitness Distribution</SectionTitle>
            <Badge style={{ backgroundColor: `${ACCENT_CYAN}22`, color: ACCENT_CYAN, border: `1px solid ${ACCENT_CYAN}44` }} className="ml-auto text-[9px] px-1.5 py-0.5">
              {squad.length} players
            </Badge>
          </div>
          <div className="flex justify-center">
            <div className="w-48">
              <FitnessDistributionDonut fitnessData={fitnessValues} />
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* SVG 3: Overall Squad Rating Gauge */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp style={{ color: ACCENT_LIME }} className="w-4 h-4" />
            <SectionTitle>Squad Rating</SectionTitle>
          </div>
          <div className="flex justify-center">
            <div className="w-64">
              <OverallSquadRatingGauge rating={avgSquadRating} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <StatBadge label="Starters" value={starters.length} color={TEXT} />
            <StatBadge label="Rotation" value={rotationPlayers.length} color={ACCENT_LIME} />
            <StatBadge label="At Risk" value={atRiskPlayers.length} color={ACCENT_ORANGE} />
            <StatBadge label="Avg OVR" value={avgSquadRating} color={ACCENT_CYAN} />
          </div>
        </InfoCard>
      </motion.div>

      {/* Full Squad List */}
      <motion.div variants={staggerChild}>
        <InfoCard className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <Users style={{ color: SECONDARY }} className="w-4 h-4" />
            <SectionTitle>Full Squad List</SectionTitle>
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto overscroll-contain">
            {sortedByFitness.map((player) => {
              const fitnessColor = player.fitness >= 80 ? ACCENT_LIME : player.fitness >= 60 ? '#f59e0b' : ACCENT_ORANGE;
              const group = getPositionGroup(player.position);
              const groupColor = group === 'GK' ? '#f59e0b' : group === 'DEF' ? '#3b82f6' : group === 'MID' ? ACCENT_LIME : ACCENT_ORANGE;
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-2 border"
                  style={{
                    backgroundColor: player.isUser ? `${ACCENT_LIME}11` : `${BG}`,
                    borderColor: player.isUser ? `${ACCENT_LIME}44` : 'transparent',
                    borderRadius: 6,
                  }}
                >
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 border shrink-0"
                    style={{ backgroundColor: `${groupColor}22`, color: groupColor, borderColor: `${groupColor}44`, borderRadius: 4 }}
                  >
                    {player.position}
                  </span>
                  <span className="flex-1 min-w-0 text-[10px] font-semibold truncate" style={{ color: player.isUser ? ACCENT_LIME : TEXT }}>
                    {player.name}
                    {player.isUser && (
                      <span className="ml-1 text-[7px] px-1 py-0.5 font-bold" style={{ backgroundColor: `${ACCENT_LIME}22`, color: ACCENT_LIME, borderRadius: 3 }}>YOU</span>
                    )}
                  </span>
                  <span className="text-[9px] font-bold" style={{ color: TEXT }}>{player.ovr}</span>
                  <div className="w-12 h-1.5 overflow-hidden" style={{ backgroundColor: BORDER, borderRadius: 3 }}>
                    <div className="h-full" style={{ width: `${player.fitness}%`, backgroundColor: fitnessColor, borderRadius: 3 }} />
                  </div>
                  <span className="text-[8px] font-bold w-7 text-right" style={{ color: fitnessColor }}>{player.fitness}%</span>
                  <span className="text-[8px]" style={{ color: SECONDARY }}>F{player.form}</span>
                  {player.isStarter ? (
                    <Zap className="w-3 h-3 shrink-0" style={{ color: ACCENT_LIME }} />
                  ) : (
                    <Timer className="w-3 h-3 shrink-0" style={{ color: SECONDARY }} />
                  )}
                </div>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>
      {/* Starting XI Preview */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <Zap style={{ color: ACCENT_LIME }} className="w-4 h-4" />
            <SectionTitle>Starting XI Preview</SectionTitle>
            <Badge style={{ backgroundColor: `${ACCENT_LIME}22`, color: ACCENT_LIME, border: `1px solid ${ACCENT_LIME}44` }} className="ml-auto text-[9px] px-1.5 py-0.5">
              {starters.length} players
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {starters.slice(0, 11).map((player, idx) => {
              const fitnessColor = player.fitness >= 80 ? ACCENT_LIME : player.fitness >= 60 ? '#f59e0b' : ACCENT_ORANGE;
              const group = getPositionGroup(player.position);
              const groupColor = group === 'GK' ? '#f59e0b' : group === 'DEF' ? '#3b82f6' : group === 'MID' ? ACCENT_LIME : ACCENT_ORANGE;
              return (
                <div key={player.id} className="flex flex-col items-center p-2 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 6 }}>
                  <span className="text-[7px] font-bold px-1 py-0.5 border" style={{ backgroundColor: `${groupColor}22`, color: groupColor, borderColor: `${groupColor}44`, borderRadius: 3 }}>
                    {player.position}
                  </span>
                  <span className="text-[9px] font-semibold text-white mt-1 truncate w-full text-center">
                    {player.name.split(' ').pop()}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: fitnessColor }}>{player.ovr}</span>
                  <div className="w-full h-1 mt-1 overflow-hidden" style={{ backgroundColor: BORDER, borderRadius: 2 }}>
                    <div className="h-full" style={{ width: `${player.fitness}%`, backgroundColor: fitnessColor, borderRadius: 2 }} />
                  </div>
                  <span className="text-[7px] mt-0.5" style={{ color: SECONDARY }}>F{player.form} · {player.consecutiveGames}G</span>
                </div>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>

      {/* Squad Depth Summary */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <Shield style={{ color: ACCENT_CYAN }} className="w-4 h-4" />
            <SectionTitle>Squad Depth by Position</SectionTitle>
          </div>
          <div className="space-y-2">
            {['GK', 'DEF', 'MID', 'ATT'].map((group) => {
              const groupPlayers = squad.filter((p) => getPositionGroup(p.position) === group);
              const groupStarters = groupPlayers.filter((p) => p.isStarter).length;
              const avgOvr = groupPlayers.length > 0 ? Math.round(groupPlayers.reduce((a, p) => a + p.ovr, 0) / groupPlayers.length) : 0;
              const avgFit = groupPlayers.length > 0 ? Math.round(groupPlayers.reduce((a, p) => a + p.fitness, 0) / groupPlayers.length) : 0;
              const fitnessColor = avgFit >= 80 ? ACCENT_LIME : avgFit >= 60 ? '#f59e0b' : ACCENT_ORANGE;
              return (
                <div key={group} className="flex items-center gap-3 p-2.5 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
                  <span className="text-xs font-bold w-8 text-center" style={{ color: group === 'GK' ? '#f59e0b' : group === 'DEF' ? '#3b82f6' : group === 'MID' ? ACCENT_LIME : ACCENT_ORANGE }}>
                    {group}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px]" style={{ color: SECONDARY }}>{groupPlayers.length} players · {groupStarters} starters</span>
                      <span className="text-[10px] font-bold" style={{ color: fitnessColor }}>{avgFit}% avg fit</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: BORDER, borderRadius: 3 }}>
                      <div className="h-full" style={{ width: `${avgFit}%`, backgroundColor: fitnessColor, borderRadius: 3 }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: TEXT }}>{avgOvr}</span>
                </div>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>
    </motion.div>
  );

  // ---- TAB 2: ROTATION PLAN ----
  const rotationPlanTab = (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      {/* SVG 4: Rotation Impact Bars */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 style={{ color: ACCENT_ORANGE }} className="w-4 h-4" />
            <SectionTitle>Rotation Impact Analysis</SectionTitle>
          </div>
          <div className="flex justify-center">
            <div className="w-56">
              <RotationImpactBars data={rotationImpactData} />
            </div>
          </div>
          <p style={{ color: SECONDARY }} className="text-[10px] text-center mt-2">Projected impact when rotating each position group</p>
        </InfoCard>
      </motion.div>

      {/* SVG 5: Fixture Difficulty Area */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <Calendar style={{ color: ACCENT_CYAN }} className="w-4 h-4" />
            <SectionTitle>Upcoming Fixture Difficulty</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <FixtureDifficultyArea fixtures={fixtures} />
          </div>
        </InfoCard>
      </motion.div>

      {/* SVG 6: Rest Priority Donut */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle style={{ color: ACCENT_ORANGE }} className="w-4 h-4" />
            <SectionTitle>Rest Priority</SectionTitle>
          </div>
          <div className="flex justify-center">
            <div className="w-48">
              <RestPriorityDonut squad={squad} />
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Rotation Suggestions */}
      {suggestions.length > 0 && (
        <motion.div variants={staggerChild}>
          <InfoCard>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb style={{ color: ACCENT_LIME }} className="w-4 h-4" />
              <SectionTitle>Suggested Rotations</SectionTitle>
              <Badge style={{ backgroundColor: `${ACCENT_LIME}22`, color: ACCENT_LIME, border: `1px solid ${ACCENT_LIME}44` }} className="ml-auto text-[9px] px-1.5 py-0.5">
                {suggestions.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {suggestions.map((sug) => (
                <div key={sug.id} className="p-3 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: ACCENT_ORANGE }} className="text-[10px] font-bold">OUT:</span>
                    <span style={{ color: TEXT }} className="text-xs font-semibold">{sug.restPlayer.name}</span>
                    <ChevronRight style={{ color: SECONDARY }} className="w-3 h-3" />
                    <span style={{ color: ACCENT_LIME }} className="text-[10px] font-bold">IN:</span>
                    <span style={{ color: TEXT }} className="text-xs font-semibold">{sug.bringInPlayer.name}</span>
                  </div>
                  <p style={{ color: SECONDARY }} className="text-[10px] mb-2">{sug.reason}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px]" style={{ color: SECONDARY }}>Impact:</span>
                    <Badge
                      style={{
                        backgroundColor: sug.impact >= 10 ? `${ACCENT_LIME}22` : `${ACCENT_ORANGE}22`,
                        color: sug.impact >= 10 ? ACCENT_LIME : ACCENT_ORANGE,
                        border: `1px solid ${sug.impact >= 10 ? `${ACCENT_LIME}44` : `${ACCENT_ORANGE}44`}`,
                      }}
                      className="text-[9px] px-1.5 py-0.5"
                    >
                      {sug.impact > 0 ? `+${sug.impact}` : sug.impact} pts
                    </Badge>
                    <span style={{ color: SECONDARY }} className="text-[9px] ml-auto">
                      {sug.restPlayer.fitness}% → {sug.bringInPlayer.fitness}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>
        </motion.div>
      )}

      {/* Rotation Options Grid */}
      {rotationPlayers.length > 0 && (
        <motion.div variants={staggerChild}>
          <InfoCard className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Timer style={{ color: ACCENT_CYAN }} className="w-4 h-4" />
              <SectionTitle>Available Replacements</SectionTitle>
              <Badge style={{ backgroundColor: `${ACCENT_CYAN}22`, color: ACCENT_CYAN, border: `1px solid ${ACCENT_CYAN}44` }} className="ml-auto text-[9px] px-1.5 py-0.5">
                {rotationPlayers.length}
              </Badge>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto overscroll-contain">
              {rotationPlayers.map((player) => {
                const fitnessColor = player.fitness >= 80 ? ACCENT_LIME : player.fitness >= 60 ? '#f59e0b' : ACCENT_ORANGE;
                const group = getPositionGroup(player.position);
                const groupColor = group === 'GK' ? '#f59e0b' : group === 'DEF' ? '#3b82f6' : group === 'MID' ? ACCENT_LIME : ACCENT_ORANGE;
                const totalMins = player.minutesPlayed.reduce((a, b) => a + b, 0);
                return (
                  <div key={player.id} className="flex items-center gap-2 p-2 border" style={{ backgroundColor: `${BG}`, borderColor: 'transparent', borderRadius: 6 }}>
                    <span className="text-[8px] font-bold px-1 py-0.5 border" style={{ backgroundColor: `${groupColor}22`, color: groupColor, borderColor: `${groupColor}44`, borderRadius: 4 }}>
                      {player.position}
                    </span>
                    <span className="flex-1 min-w-0 text-[10px] font-semibold truncate" style={{ color: TEXT }}>{player.name}</span>
                    <span className="text-[9px] font-bold" style={{ color: TEXT }}>{player.ovr}</span>
                    <div className="w-10 h-1.5 overflow-hidden" style={{ backgroundColor: BORDER, borderRadius: 3 }}>
                      <div className="h-full" style={{ width: `${player.fitness}%`, backgroundColor: fitnessColor, borderRadius: 3 }} />
                    </div>
                    <span className="text-[8px] font-bold w-7 text-right" style={{ color: fitnessColor }}>{player.fitness}%</span>
                    <span className="text-[8px]" style={{ color: SECONDARY }}>{totalMins}'</span>
                  </div>
                );
              })}
            </div>
          </InfoCard>
        </motion.div>
      )}

      {/* Rotation Impact Summary */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp style={{ color: ACCENT_LIME }} className="w-4 h-4" />
            <SectionTitle>Rotation Impact Summary</SectionTitle>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatBadge label="Total Impact" value={`+${suggestions.reduce((a, s) => a + Math.max(0, s.impact), 0)} pts`} color={ACCENT_LIME} />
            <StatBadge label="Players to Rest" value={suggestions.length} color={ACCENT_ORANGE} />
            <StatBadge label="Avg Fitness Gain" value={suggestions.length > 0 ? `+${Math.round(suggestions.reduce((a, s) => a + (s.bringInPlayer.fitness - s.restPlayer.fitness), 0) / suggestions.length)}%` : '0%'} color={ACCENT_CYAN} />
          </div>
          <p style={{ color: SECONDARY }} className="text-[10px] mt-3 text-center">
            Apply all {suggestions.length} suggested rotation{suggestions.length !== 1 ? 's' : ''} for an estimated +{suggestions.reduce((a, s) => a + Math.max(0, s.impact), 0)} point impact on squad performance.
          </p>
        </InfoCard>
      </motion.div>

      {/* Upcoming Fixtures Strip */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <Calendar style={{ color: ACCENT_CYAN }} className="w-4 h-4" />
            <SectionTitle>8 Match Schedule</SectionTitle>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {fixtures.map((f, i) => {
              const comp = COMPETITION_ICONS[f.competition] || COMPETITION_ICONS.league;
              const diffBg = f.difficulty === 'hard' ? `${ACCENT_ORANGE}15` : f.difficulty === 'medium' ? '#f59e0b15' : `${ACCENT_LIME}15`;
              const diffBorder = f.difficulty === 'hard' ? `${ACCENT_ORANGE}33` : f.difficulty === 'medium' ? '#f59e0b33' : `${ACCENT_LIME}33`;
              const diffText = f.difficulty === 'hard' ? ACCENT_ORANGE : f.difficulty === 'medium' ? '#f59e0b' : ACCENT_LIME;
              return (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 p-2.5 border" style={{ backgroundColor: diffBg, borderColor: diffBorder, borderRadius: 8, minWidth: 70 }}>
                  <span className="text-sm">{comp.icon}</span>
                  <span style={{ color: SECONDARY }} className="text-[8px]">{comp.label}</span>
                  <span className="text-[10px] font-bold text-white text-center">{f.opponent}</span>
                  <span className="text-[8px] font-bold uppercase" style={{ color: diffText }}>{f.difficulty}</span>
                  <span style={{ color: SECONDARY }} className="text-[8px]">W{week + f.weekOffset}</span>
                </div>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>
    </motion.div>
  );

  // ---- TAB 3: WORKLOAD ----
  const workloadTab = (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      {/* SVG 7: Minutes Played Line */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <Clock style={{ color: ACCENT_LIME }} className="w-4 h-4" />
            <SectionTitle>Minutes Played (Last 8 Matches)</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <MinutesPlayedLine players={minutesData} />
          </div>
          <p style={{ color: SECONDARY }} className="text-[10px] text-center mt-2">Tracking minutes for top 8 starters</p>
        </InfoCard>
      </motion.div>

      {/* SVG 8: Workload Radar */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 style={{ color: ACCENT_ORANGE }} className="w-4 h-4" />
            <SectionTitle>Workload Distribution</SectionTitle>
          </div>
          <div className="flex justify-center">
            <div className="w-48">
              <WorkloadRadar data={workloadData} />
            </div>
          </div>
          <div className="flex justify-around mt-2">
            {['Starters', 'Subs', 'Unused', 'Youth', 'Loaned'].map((label, i) => (
              <div key={label} className="text-center">
                <span style={{ color: ACCENT_ORANGE }} className="text-[10px] font-bold">{workloadData[i]}%</span>
                <span style={{ color: SECONDARY }} className="block text-[8px]">{label}</span>
              </div>
            ))}
          </div>
        </InfoCard>
      </motion.div>

      {/* SVG 9: Fatigue Risk Bars */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle style={{ color: ACCENT_CYAN }} className="w-4 h-4" />
            <SectionTitle>Fatigue Risk by Position</SectionTitle>
          </div>
          <div className="flex justify-center">
            <div className="w-56">
              <FatigueRiskBars data={fatigueByGroup} />
            </div>
          </div>
          <p style={{ color: SECONDARY }} className="text-[10px] text-center mt-2">Higher values indicate greater fatigue risk</p>
        </InfoCard>
      </motion.div>

      {/* Average Minutes per Position */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 style={{ color: ACCENT_LIME }} className="w-4 h-4" />
            <SectionTitle>Average Minutes by Position</SectionTitle>
          </div>
          <div className="space-y-2">
            {['GK', 'DEF', 'MID', 'ATT'].map((group) => {
              const groupPlayers = squad.filter((p) => getPositionGroup(p.position) === group);
              const avgMins = groupPlayers.length > 0
                ? Math.round(groupPlayers.reduce((a, p) => a + p.minutesPlayed.reduce((m, t) => m + t, 0) / p.minutesPlayed.length, 0) / groupPlayers.length)
                : 0;
              const maxMins = 90;
              const pct = Math.min(100, (avgMins / maxMins) * 100);
              const barColor = pct >= 80 ? ACCENT_ORANGE : pct >= 60 ? '#f59e0b' : ACCENT_LIME;
              return (
                <div key={group} className="flex items-center gap-3 p-2 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
                  <span className="text-[9px] font-bold w-8 text-center" style={{ color: group === 'GK' ? '#f59e0b' : group === 'DEF' ? '#3b82f6' : group === 'MID' ? ACCENT_LIME : ACCENT_ORANGE }}>
                    {group}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden" style={{ backgroundColor: BORDER, borderRadius: 4 }}>
                      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: barColor, borderRadius: 4 }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: barColor }}>{avgMins}'</span>
                  <span className="text-[8px]" style={{ color: SECONDARY }}>/90</span>
                </div>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>

      {/* Fitness Trend Summary */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <Activity style={{ color: ACCENT_CYAN }} className="w-4 h-4" />
            <SectionTitle>Fitness Summary</SectionTitle>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
              <span className="text-[9px] uppercase" style={{ color: SECONDARY }}>Best Fitness</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold" style={{ color: ACCENT_LIME }}>
                  {squad.length > 0 ? Math.max(...squad.map((p) => p.fitness)) : 0}%
                </span>
                <span className="text-[10px]" style={{ color: TEXT }}>{squad.filter((p) => p.fitness === Math.max(...squad.map((pp) => pp.fitness)))[0]?.name.split(' ').pop()}</span>
              </div>
            </div>
            <div className="p-3 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
              <span className="text-[9px] uppercase" style={{ color: SECONDARY }}>Worst Fitness</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold" style={{ color: ACCENT_ORANGE }}>
                  {squad.length > 0 ? Math.min(...squad.map((p) => p.fitness)) : 0}%
                </span>
                <span className="text-[10px]" style={{ color: TEXT }}>{squad.filter((p) => p.fitness === Math.min(...squad.map((pp) => pp.fitness)))[0]?.name.split(' ').pop()}</span>
              </div>
            </div>
            <div className="p-3 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
              <span className="text-[9px] uppercase" style={{ color: SECONDARY }}>Highest Workload</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                  {(() => {
                    const topWorker = [...squad].sort((a, b) => b.minutesPlayed.reduce((x, y) => x + y, 0) - a.minutesPlayed.reduce((x, y) => x + y, 0))[0];
                    return topWorker ? topWorker.minutesPlayed.reduce((x, y) => x + y, 0) : 0;
                  })()}'
                </span>
                <span className="text-[10px]" style={{ color: TEXT }}>
                  {(() => {
                    const topWorker = [...squad].sort((a, b) => b.minutesPlayed.reduce((x, y) => x + y, 0) - a.minutesPlayed.reduce((x, y) => x + y, 0))[0];
                    return topWorker?.name.split(' ').pop();
                  })()}
                </span>
              </div>
            </div>
            <div className="p-3 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
              <span className="text-[9px] uppercase" style={{ color: SECONDARY }}>Lowest Workload</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold" style={{ color: ACCENT_CYAN }}>
                  {(() => {
                    const lowWorker = [...squad].sort((a, b) => a.minutesPlayed.reduce((x, y) => x + y, 0) - b.minutesPlayed.reduce((x, y) => x + y, 0))[0];
                    return lowWorker ? lowWorker.minutesPlayed.reduce((x, y) => x + y, 0) : 0;
                  })()}'
                </span>
                <span className="text-[10px]" style={{ color: TEXT }}>
                  {(() => {
                    const lowWorker = [...squad].sort((a, b) => a.minutesPlayed.reduce((x, y) => x + y, 0) - b.minutesPlayed.reduce((x, y) => x + y, 0))[0];
                    return lowWorker?.name.split(' ').pop();
                  })()}
                </span>
              </div>
            </div>
          </div>
        </InfoCard>
      </motion.div>

      {/* Workload Detail Cards */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <Activity style={{ color: SECONDARY }} className="w-4 h-4" />
            <SectionTitle>Top Workload Players</SectionTitle>
          </div>
          <div className="space-y-2">
            {squad
              .filter((p) => p.consecutiveGames >= 4)
              .sort((a, b) => b.consecutiveGames - a.consecutiveGames)
              .slice(0, 5)
              .map((player) => {
                const totalMins = player.minutesPlayed.reduce((a, b) => a + b, 0);
                const fitnessColor = player.fitness >= 80 ? ACCENT_LIME : player.fitness >= 60 ? '#f59e0b' : ACCENT_ORANGE;
                return (
                  <div key={player.id} className="flex items-center gap-3 p-2.5 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 border" style={{ backgroundColor: `${ACCENT_ORANGE}22`, color: ACCENT_ORANGE, borderColor: `${ACCENT_ORANGE}33`, borderRadius: 4 }}>
                      {player.position}
                    </span>
                    <span className="flex-1 min-w-0 text-[11px] font-semibold truncate" style={{ color: player.isUser ? ACCENT_LIME : TEXT }}>
                      {player.name}
                    </span>
                    <div className="text-right">
                      <div className="text-[9px]" style={{ color: SECONDARY }}>{player.consecutiveGames} games</div>
                      <div className="text-[9px]" style={{ color: SECONDARY }}>{totalMins} mins</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold" style={{ color: fitnessColor }}>{player.fitness}%</span>
                    </div>
                    {player.fitness < 60 && (
                      <Badge style={{ backgroundColor: `${ACCENT_ORANGE}22`, color: ACCENT_ORANGE, border: `1px solid ${ACCENT_ORANGE}44` }} className="text-[8px] px-1 py-0.5">
                        RISK
                      </Badge>
                    )}
                  </div>
                );
              })}
          </div>
        </InfoCard>
      </motion.div>
    </motion.div>
  );

  // ---- TAB 4: STRATEGY ----
  const strategyTab = (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      {/* SVG 10: Formation Flexibility Radar */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <Shield style={{ color: ACCENT_LIME }} className="w-4 h-4" />
            <SectionTitle>Formation Flexibility</SectionTitle>
          </div>
          <div className="flex justify-center">
            <div className="w-48">
              <FormationFlexibilityRadar data={formationData} />
            </div>
          </div>
          <div className="flex justify-around mt-2">
            {['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '4-5-1'].map((label, i) => (
              <div key={label} className="text-center">
                <span style={{ color: ACCENT_LIME }} className="text-[10px] font-bold">{formationData[i]}%</span>
                <span style={{ color: SECONDARY }} className="block text-[8px]">{label}</span>
              </div>
            ))}
          </div>
        </InfoCard>
      </motion.div>

      {/* SVG 11: Rotation Success Rate Ring */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <Target style={{ color: ACCENT_CYAN }} className="w-4 h-4" />
            <SectionTitle>Rotation Win Rate</SectionTitle>
          </div>
          <div className="flex justify-center">
            <div className="w-48">
              <RotationSuccessRateRing rate={successRate} />
            </div>
          </div>
          <p style={{ color: SECONDARY }} className="text-[10px] text-center mt-2">
            {successRate >= 60 ? 'Strong results when rotating squad — keep it up!' : 'Mixed results — consider strategic rotation timing.'}
          </p>
        </InfoCard>
      </motion.div>

      {/* SVG 12: Key Matchup Timeline */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-2">
            <Clock style={{ color: ACCENT_ORANGE }} className="w-4 h-4" />
            <SectionTitle>Key Matchup Timeline</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <KeyMatchupTimeline fixtures={fixtures} />
          </div>
        </InfoCard>
      </motion.div>

      {/* Strategy Recommendations */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb style={{ color: ACCENT_LIME }} className="w-4 h-4" />
            <SectionTitle>Strategy Recommendations</SectionTitle>
          </div>
          <div className="space-y-2">
            {(() => {
              const hardFixtures = fixtures.filter((f) => f.difficulty === 'hard');
              const easyFixtures = fixtures.filter((f) => f.difficulty === 'easy');
              const strategies = [
                {
                  title: 'Heavy Rotation Window',
                  desc: easyFixtures.length > 0
                    ? `Rotate heavily vs ${easyFixtures.map((f) => f.opponent).join(', ')}. Use bench players to rest starters.`
                    : 'No easy fixtures coming up — rotate conservatively.',
                  icon: '🔄',
                  color: ACCENT_LIME,
                },
                {
                  title: 'Strongest XI Required',
                  desc: hardFixtures.length > 0
                    ? `Field your best team vs ${hardFixtures.map((f) => f.opponent).join(', ')}. Avoid unnecessary changes.`
                    : 'No difficult fixtures in the near term.',
                  icon: '⚡',
                  color: ACCENT_ORANGE,
                },
                {
                  title: 'Fitness Management',
                  desc: atRiskPlayers.length > 0
                    ? `${atRiskPlayers.length} players need immediate rest. Prioritize recovery training this week.`
                    : 'All players at acceptable fitness levels. Maintain current training load.',
                  icon: '💪',
                  color: ACCENT_CYAN,
                },
                {
                  title: 'Tactical Flexibility',
                  desc: formationData[0] > 75
                    ? 'Squad depth supports formation changes. Consider 4-3-3 or 4-2-3-1 based on opponent.'
                    : 'Limited flexibility — focus on one primary formation.',
                  icon: '📋',
                  color: '#a855f7',
                },
              ];
              return strategies.map((strat) => (
                <div key={strat.title} className="flex items-start gap-3 p-3 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
                  <span className="text-base shrink-0 mt-0.5">{strat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold" style={{ color: strat.color }}>{strat.title}</span>
                    <p style={{ color: SECONDARY }} className="text-[10px] mt-0.5">{strat.desc}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </InfoCard>
      </motion.div>

      {/* Season Rotation Summary */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <Target style={{ color: ACCENT_LIME }} className="w-4 h-4" />
            <SectionTitle>Season Rotation Summary</SectionTitle>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatBadge label="Rotations Made" value={Math.round(season * 2.5 + week * 0.3)} color={ACCENT_LIME} />
            <StatBadge label="Avg Rotation" value={`${Math.round(2.5 + seededRandom(501)() * 2)} players`} color={ACCENT_CYAN} />
            <StatBadge label="Avg Result" value={successRate >= 55 ? 'W' : successRate >= 40 ? 'D' : 'L'} color={successRate >= 55 ? ACCENT_LIME : successRate >= 40 ? '#f59e0b' : ACCENT_ORANGE} />
          </div>
          <div className="space-y-2 mt-3">
            {['Conservative', 'Moderate', 'Aggressive'].map((style, idx) => {
              const recommendation = style === 'Conservative' ? 'Rotate only fatigued players' : style === 'Moderate' ? 'Rotate 2-3 players per match' : 'Rotate 4+ players frequently';
              const risk = style === 'Conservative' ? 'Low' : style === 'Moderate' ? 'Medium' : 'High';
              const riskColor = style === 'Conservative' ? ACCENT_LIME : style === 'Moderate' ? '#f59e0b' : ACCENT_ORANGE;
              return (
                <div key={style} className="flex items-center gap-3 p-2.5 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
                  <span className="text-xs font-bold w-24" style={{ color: TEXT }}>{style}</span>
                  <span className="flex-1 text-[10px]" style={{ color: SECONDARY }}>{recommendation}</span>
                  <Badge style={{ backgroundColor: `${riskColor}22`, color: riskColor, border: `1px solid ${riskColor}44` }} className="text-[8px] px-1.5 py-0.5">
                    {risk} risk
                  </Badge>
                </div>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>

      {/* Opponent Analysis */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle style={{ color: ACCENT_ORANGE }} className="w-4 h-4" />
            <SectionTitle>Opponent Analysis</SectionTitle>
          </div>
          <div className="space-y-2">
            {fixtures.slice(0, 4).map((f, i) => {
              const comp = COMPETITION_ICONS[f.competition] || COMPETITION_ICONS.league;
              const diffBg = f.difficulty === 'hard' ? `${ACCENT_ORANGE}15` : f.difficulty === 'medium' ? '#f59e0b15' : `${ACCENT_LIME}15`;
              const diffBorder = f.difficulty === 'hard' ? `${ACCENT_ORANGE}33` : f.difficulty === 'medium' ? '#f59e0b33' : `${ACCENT_LIME}33`;
              const diffText = f.difficulty === 'hard' ? ACCENT_ORANGE : f.difficulty === 'medium' ? '#f59e0b' : ACCENT_LIME;
              const rotationAdvice = f.difficulty === 'hard' ? 'Field strongest XI' : f.difficulty === 'medium' ? 'Rotate 1-2 players' : 'Heavy rotation OK';
              return (
                <div key={i} className="flex items-center gap-3 p-3 border" style={{ backgroundColor: diffBg, borderColor: diffBorder, borderRadius: 8 }}>
                  <div className="flex flex-col items-center gap-0.5 w-10">
                    <span className="text-lg">{comp.icon}</span>
                    <span style={{ color: SECONDARY }} className="text-[7px]">W{week + f.weekOffset}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">vs {f.opponent}</span>
                      <Badge style={{ backgroundColor: `${diffText}22`, color: diffText, border: `1px solid ${diffText}44` }} className="text-[7px] px-1 py-0.5">
                        {f.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                    <p style={{ color: SECONDARY }} className="text-[10px] mt-0.5">{rotationAdvice}</p>
                  </div>
                  <ChevronRight style={{ color: SECONDARY }} className="w-3 h-3" />
                </div>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>

      {/* Formation Detail Cards */}
      <motion.div variants={staggerChild}>
        <InfoCard>
          <div className="flex items-center gap-2 mb-3">
            <Shield style={{ color: SECONDARY }} className="w-4 h-4" />
            <SectionTitle>Formation Readiness</SectionTitle>
          </div>
          <div className="space-y-2">
            {['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '4-5-1'].map((formation, i) => {
              const readiness = formationData[i];
              const color = readiness >= 75 ? ACCENT_LIME : readiness >= 55 ? '#f59e0b' : ACCENT_ORANGE;
              const label = readiness >= 75 ? 'Ready' : readiness >= 55 ? 'Partial' : 'Weak';
              return (
                <div key={formation} className="flex items-center gap-3 p-2.5 border" style={{ backgroundColor: `${BG}`, borderColor: BORDER, borderRadius: 8 }}>
                  <span className="text-sm font-bold w-14" style={{ color: TEXT }}>{formation}</span>
                  <div className="flex-1 h-2 overflow-hidden" style={{ backgroundColor: BORDER, borderRadius: 4 }}>
                    <div className="h-full" style={{ width: `${readiness}%`, backgroundColor: color, borderRadius: 4 }} />
                  </div>
                  <span className="text-[9px] font-bold w-7 text-right" style={{ color }}>{readiness}%</span>
                  <Badge style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }} className="text-[8px] px-1.5 py-0.5">
                    {label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </InfoCard>
      </motion.div>
    </motion.div>
  );

  return (
    <div style={{ backgroundColor: BG }} className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-24">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-2"
        >
          <RotateCcw style={{ color: ACCENT_LIME }} className="w-5 h-5" />
          <h1 className="text-lg font-bold text-white tracking-tight">Squad Rotation</h1>
          <Badge style={{ backgroundColor: `${ACCENT_LIME}22`, color: ACCENT_LIME, border: `1px solid ${ACCENT_LIME}44` }} className="text-[9px] px-1.5 py-0.5 ml-1">
            ENHANCED
          </Badge>
          <span style={{ color: SECONDARY }} className="text-[10px] ml-auto">{clubName} — S{season} W{week}</span>
        </motion.div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full p-0.5" style={{ backgroundColor: '#21262d', height: 36, borderRadius: 8 }}>
            <TabsTrigger
              value="overview"
              className="flex-1 text-[10px] font-semibold"
              style={{
                color: activeTab === 'overview' ? ACCENT_LIME : SECONDARY,
                backgroundColor: activeTab === 'overview' ? '#30363d' : 'transparent',
                borderRadius: 6,
                height: 30,
              }}
            >
              <Users className="w-3 h-3 mr-1" style={{ color: activeTab === 'overview' ? ACCENT_LIME : SECONDARY }} />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="rotation"
              className="flex-1 text-[10px] font-semibold"
              style={{
                color: activeTab === 'rotation' ? ACCENT_ORANGE : SECONDARY,
                backgroundColor: activeTab === 'rotation' ? '#30363d' : 'transparent',
                borderRadius: 6,
                height: 30,
              }}
            >
              <RotateCcw className="w-3 h-3 mr-1" style={{ color: activeTab === 'rotation' ? ACCENT_ORANGE : SECONDARY }} />
              Rotation
            </TabsTrigger>
            <TabsTrigger
              value="workload"
              className="flex-1 text-[10px] font-semibold"
              style={{
                color: activeTab === 'workload' ? ACCENT_CYAN : SECONDARY,
                backgroundColor: activeTab === 'workload' ? '#30363d' : 'transparent',
                borderRadius: 6,
                height: 30,
              }}
            >
              <Activity className="w-3 h-3 mr-1" style={{ color: activeTab === 'workload' ? ACCENT_CYAN : SECONDARY }} />
              Workload
            </TabsTrigger>
            <TabsTrigger
              value="strategy"
              className="flex-1 text-[10px] font-semibold"
              style={{
                color: activeTab === 'strategy' ? '#a855f7' : SECONDARY,
                backgroundColor: activeTab === 'strategy' ? '#30363d' : 'transparent',
                borderRadius: 6,
                height: 30,
              }}
            >
              <Lightbulb className="w-3 h-3 mr-1" style={{ color: activeTab === 'strategy' ? '#a855f7' : SECONDARY }} />
              Strategy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{squadOverviewTab}</TabsContent>
          <TabsContent value="rotation">{rotationPlanTab}</TabsContent>
          <TabsContent value="workload">{workloadTab}</TabsContent>
          <TabsContent value="strategy">{strategyTab}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
