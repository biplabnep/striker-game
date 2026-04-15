'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Play, Pause, SkipForward, Trophy, Clock, Shield, Target,
  Zap, BarChart3, Activity, TrendingUp, Eye, Users,
} from 'lucide-react';

// ============================================================
// Design Tokens
// ============================================================
const CLR = {
  orange: '#FF5500',
  lime: '#CCFF00',
  cyan: '#00E5FF',
  muted: '#666',
  bg: '#0d1117',
  card: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  mutedText: '#8b949e',
  dark: '#21262d',
};

const ANIM = { duration: 0.18, ease: 'easeOut' as const };

// ============================================================
// Types & Interfaces
// ============================================================
type MatchPhase = 'pre_match' | 'first_half' | 'half_time' | 'second_half' | 'full_time';
type EventType = 'goal' | 'card' | 'substitution' | 'injury' | 'general' | 'var' | 'save' | 'shot';

interface CommentaryEvent {
  minute: number;
  icon: string;
  description: string;
  playerName: string;
  type: EventType;
}

interface MatchStats {
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePasses: number;
  awayPasses: number;
  homePassAccuracy: number;
  awayPassAccuracy: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls: number;
  awayFouls: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  homeOffsides: number;
  awayOffsides: number;
  homeTackles: number;
  awayTackles: number;
}

interface ShotLocation {
  x: number;
  y: number;
  team: 'home' | 'away';
  outcome: 'goal' | 'save' | 'miss';
  minute: number;
}

interface MomentumPoint {
  minute: number;
  value: number;
}

interface PlayerPerfData {
  name: string;
  position: string;
  rating: number;
  goals: number;
  assists: number;
  passes: number;
  tackles: number;
  distanceCovered: number;
  team: 'home' | 'away';
}

// ============================================================
// Constants
// ============================================================
const FORMATIONS: Record<string, { pos: string; x: number; y: number }[]> = {
  '4-3-3': [
    { pos: 'GK', x: 0.5, y: 0.92 }, { pos: 'LB', x: 0.15, y: 0.74 }, { pos: 'CB', x: 0.37, y: 0.77 },
    { pos: 'CB', x: 0.63, y: 0.77 }, { pos: 'RB', x: 0.85, y: 0.74 }, { pos: 'CM', x: 0.25, y: 0.52 },
    { pos: 'CM', x: 0.5, y: 0.48 }, { pos: 'CM', x: 0.75, y: 0.52 }, { pos: 'LW', x: 0.15, y: 0.22 },
    { pos: 'ST', x: 0.5, y: 0.18 }, { pos: 'RW', x: 0.85, y: 0.22 },
  ],
  '4-4-2': [
    { pos: 'GK', x: 0.5, y: 0.92 }, { pos: 'LB', x: 0.15, y: 0.74 }, { pos: 'CB', x: 0.37, y: 0.77 },
    { pos: 'CB', x: 0.63, y: 0.77 }, { pos: 'RB', x: 0.85, y: 0.74 }, { pos: 'LM', x: 0.12, y: 0.5 },
    { pos: 'CM', x: 0.37, y: 0.52 }, { pos: 'CM', x: 0.63, y: 0.52 }, { pos: 'RM', x: 0.88, y: 0.5 },
    { pos: 'ST', x: 0.38, y: 0.2 }, { pos: 'ST', x: 0.62, y: 0.2 },
  ],
  '3-5-2': [
    { pos: 'GK', x: 0.5, y: 0.92 }, { pos: 'CB', x: 0.25, y: 0.77 }, { pos: 'CB', x: 0.5, y: 0.8 },
    { pos: 'CB', x: 0.75, y: 0.77 }, { pos: 'LM', x: 0.08, y: 0.5 }, { pos: 'CM', x: 0.32, y: 0.5 },
    { pos: 'CDM', x: 0.5, y: 0.6 }, { pos: 'CM', x: 0.68, y: 0.5 }, { pos: 'RM', x: 0.92, y: 0.5 },
    { pos: 'ST', x: 0.38, y: 0.2 }, { pos: 'ST', x: 0.62, y: 0.2 },
  ],
  '4-2-3-1': [
    { pos: 'GK', x: 0.5, y: 0.92 }, { pos: 'LB', x: 0.15, y: 0.74 }, { pos: 'CB', x: 0.37, y: 0.77 },
    { pos: 'CB', x: 0.63, y: 0.77 }, { pos: 'RB', x: 0.85, y: 0.74 }, { pos: 'CDM', x: 0.37, y: 0.56 },
    { pos: 'CDM', x: 0.63, y: 0.56 }, { pos: 'LW', x: 0.18, y: 0.35 }, { pos: 'CAM', x: 0.5, y: 0.38 },
    { pos: 'RW', x: 0.82, y: 0.35 }, { pos: 'ST', x: 0.5, y: 0.18 },
  ],
};

const PLAYER_NAMES = [
  'James Williams', 'Marcus Silva', 'Oliver Martinez', 'Ethan Brown',
  'Lucas Johnson', 'Daniel Garcia', 'Harry Muller', 'Jack Davis',
  'Mohamed Wilson', 'Rafael Taylor', 'Pedro Anderson', 'Carlos Thomas',
  'Liam Rodriguez', 'Noah Robinson', 'Owen Clark', 'Mason Lewis',
  'Ryan Walker', 'Alex Hall', 'Theo Young', 'Kai King',
  'Ben Wright', 'Sam Lopez', 'Max Hill', 'Leo Scott',
  'Finn Adams', 'Nelson Carter', 'Joe Phillips', 'Archie Evans',
  'Oscar Turner', 'Logan Parker', 'Elijah Collins', 'Ryan Baker',
];

const OPPONENT_NAMES = [
  'FC United', 'Dynamo City', 'Wanderers FC', 'Athletic Club',
  'Rovers Town', 'FC Rangers', 'Sporting Lua', 'Victoria FC',
];

const GOAL_TEXTS = [
  '{name} finds the back of the net with a superb strike!',
  'GOAL! {name} scores — the crowd erupts!',
  'Clinical finish from {name}! A great goal.',
  '{name} makes no mistake and puts the ball in the corner!',
  'And it is a goal! {name} with a brilliant finish!',
];

const CARD_TEXTS = [
  'Yellow card for {name}. The referee has had enough.',
  '{name} goes into the book for a reckless challenge.',
  'The referee shows a yellow to {name} for persistent fouling.',
];

const SUB_TEXTS = [
  '{name} is coming off, replaced by a teammate.',
  'Tactical substitution. {name} leaves the pitch.',
  '{name} makes way for a fresh pair of legs.',
];

const INJURY_TEXTS = [
  '{name} is down receiving treatment from the medical staff.',
  'Concerns for {name} — looks like a painful knock.',
  'Brief stoppage as {name} gets attention from the physio.',
];

const SAVE_TEXTS = [
  'What a save! The keeper denies {name} with a superb stop!',
  'Brilliant reflex save keeps the ball out!',
  'Fingertip save from {name}\'s attempt!',
];

const SHOT_TEXTS = [
  '{name} fires wide from distance.',
  'The shot from {name} goes just over the bar.',
  '{name} tries their luck but it drifts wide of the post.',
];

const GENERAL_TEXTS = [
  'Both teams are settling into the match now.',
  'Good tempo to the game — both sides looking to attack.',
  'The atmosphere inside the stadium is electric tonight.',
  'A well-contested midfield battle developing here.',
  'Patient build-up play as the team looks for an opening.',
  'The home fans are making themselves heard.',
  'Neat passing in midfield but no penetration yet.',
  'The away side are growing into this match.',
];

const EVENT_ICONS: Record<string, string> = {
  goal: '\u26BD',
  card: '\uD83D\uDFE8',
  substitution: '\uD83D\uDD04',
  injury: '\u26A0\uFE0F',
  general: '\uD83D\uDCFA',
  var: '\uD83D\uDCF1',
  save: '\uD83E\uDD11',
  shot: '\uD83C\uDFAF',
};

const TACTICAL_LABELS = ['Attack', 'Defense', 'Midfield', 'Pressing', 'Set Pieces', 'Discipline'];

const STAT_LABELS = ['Shots', 'Passes', 'Tackles', 'Fouls', 'Corners', 'Offsides', 'On Target', 'Yellow Cards'];

// ============================================================
// Seeded Random & Utility Functions
// ============================================================
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashStr(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return hash;
}

function getEventText(type: EventType, playerName: string): string {
  const poolMap: Record<string, string[]> = {
    goal: GOAL_TEXTS,
    card: CARD_TEXTS,
    substitution: SUB_TEXTS,
    injury: INJURY_TEXTS,
    save: SAVE_TEXTS,
    shot: SHOT_TEXTS,
    general: GENERAL_TEXTS,
    var: ['VAR review in progress. Checking a possible incident.', 'The referee is reviewing at the monitor.', 'VAR check complete. Original decision stands.'],
  };
  const pool = poolMap[type] || GENERAL_TEXTS;
  const template = pool[Math.abs(hashStr(playerName + type)) % pool.length];
  return template.replace('{name}', playerName);
}

// ============================================================
// Radar Chart Helper
// ============================================================
function computeRadarPolygon(cx: number, cy: number, radius: number, values: number[]): string {
  const n = values.length;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = start + i * step;
    const r = (values[i] / 100) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

function computeRadarAxisEnds(cx: number, cy: number, radius: number, count: number): { x: number; y: number }[] {
  const step = (2 * Math.PI) / count;
  const start = -Math.PI / 2;
  const ends: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = start + i * step;
    ends.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return ends;
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
}

// ============================================================
// Generate Match Data (Deterministic)
// ============================================================
function generateMatchData(
  seed: number,
  homeQuality: number,
  awayQuality: number
): {
  events: CommentaryEvent[];
  stats: MatchStats;
  shots: ShotLocation[];
  momentum: MomentumPoint[];
  players: PlayerPerfData[];
  homeScore: number;
  awayScore: number;
} {
  const rng = seededRandom(seed);
  const events: CommentaryEvent[] = [];
  const shots: ShotLocation[] = [];
  const momentum: MomentumPoint[] = [{ minute: 0, value: 0 }];
  const qDiff = homeQuality - awayQuality;

  const homeExpected = Math.max(0.3, 1.4 + qDiff * 0.025);
  const awayExpected = Math.max(0.3, 1.1 - qDiff * 0.025);

  function poisson(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do { k++; p *= rng(); } while (p > L);
    return k - 1;
  }

  const totalHomeGoals = poisson(homeExpected);
  const totalAwayGoals = poisson(awayExpected);
  let homeScore = 0;
  let awayScore = 0;

  interface TimedItem {
    minute: number;
    kind: 'goal' | 'card' | 'red' | 'sub' | 'shot' | 'save' | 'injury' | 'var' | 'general';
    team: 'home' | 'away';
  }

  const allItems: TimedItem[] = [];

  for (let i = 0; i < totalHomeGoals; i++) {
    allItems.push({ minute: Math.floor(rng() * 90) + 1, kind: 'goal', team: 'home' });
  }
  for (let i = 0; i < totalAwayGoals; i++) {
    allItems.push({ minute: Math.floor(rng() * 90) + 1, kind: 'goal', team: 'away' });
  }

  const yellowCount = Math.floor(rng() * 5) + 1;
  const redCount = rng() < 0.15 ? 1 : 0;
  for (let i = 0; i < yellowCount; i++) {
    allItems.push({ minute: Math.floor(rng() * 88) + 1, kind: 'card', team: rng() < 0.55 ? 'home' : 'away' });
  }
  if (redCount > 0) {
    allItems.push({ minute: Math.floor(rng() * 30) + 60, kind: 'red', team: rng() < 0.5 ? 'home' : 'away' });
  }

  const subCount = Math.floor(rng() * 5) + 3;
  for (let i = 0; i < subCount; i++) {
    allItems.push({ minute: Math.floor(rng() * 30) + 58, kind: 'sub', team: rng() < 0.5 ? 'home' : 'away' });
  }

  const homeShotsCount = Math.floor(rng() * 8) + 6;
  const awayShotsCount = Math.floor(rng() * 8) + 5;
  const goalMinutesHome = allItems.filter(g => g.kind === 'goal' && g.team === 'home').map(g => g.minute);
  const goalMinutesAway = allItems.filter(g => g.kind === 'goal' && g.team === 'away').map(g => g.minute);

  for (let i = 0; i < homeShotsCount; i++) {
    const onTarget = rng() < 0.35;
    const shotMin = Math.floor(rng() * 90) + 1;
    if (!goalMinutesHome.includes(shotMin)) {
      allItems.push({ minute: shotMin, kind: onTarget ? 'save' : 'shot', team: 'home' });
    }
  }
  for (let i = 0; i < awayShotsCount; i++) {
    const onTarget = rng() < 0.35;
    const shotMin = Math.floor(rng() * 90) + 1;
    if (!goalMinutesAway.includes(shotMin)) {
      allItems.push({ minute: shotMin, kind: onTarget ? 'save' : 'shot', team: 'away' });
    }
  }

  if (rng() < 0.4) {
    allItems.push({ minute: Math.floor(rng() * 70) + 10, kind: 'injury', team: rng() < 0.5 ? 'home' : 'away' });
  }
  if (rng() < 0.3) {
    allItems.push({ minute: Math.floor(rng() * 40) + 20, kind: 'var', team: 'home' });
  }
  for (let m = 5; m <= 85; m += 10) {
    allItems.push({ minute: m, kind: 'general', team: 'home' });
  }
  allItems.push({ minute: 45, kind: 'general', team: 'home' });

  allItems.sort((a, b) => a.minute - b.minute);

  for (const item of allItems) {
    const pName = PLAYER_NAMES[Math.floor(rng() * PLAYER_NAMES.length)];
    const ev: CommentaryEvent = { minute: item.minute, icon: '', description: '', playerName: pName, type: 'general' };

    switch (item.kind) {
      case 'goal': {
        const scorer = PLAYER_NAMES[Math.floor(rng() * PLAYER_NAMES.length)];
        ev.icon = EVENT_ICONS.goal;
        ev.playerName = scorer;
        ev.description = getEventText('goal', scorer);
        ev.type = 'goal';
        if (item.team === 'home') homeScore++;
        else awayScore++;
        shots.push({
          x: 0.3 + rng() * 0.4,
          y: item.team === 'home' ? 0.15 + rng() * 0.15 : 0.75 + rng() * 0.15,
          team: item.team, outcome: 'goal', minute: item.minute,
        });
        break;
      }
      case 'card': {
        ev.icon = '\uD83D\uDFE8';
        ev.description = getEventText('card', pName);
        ev.type = 'card';
        break;
      }
      case 'red': {
        ev.icon = '\uD83D\uDFE5';
        ev.description = `Red card for ${pName}! Sent off by the referee.`;
        ev.type = 'card';
        break;
      }
      case 'sub': {
        ev.icon = EVENT_ICONS.substitution;
        ev.description = getEventText('substitution', pName);
        ev.type = 'substitution';
        break;
      }
      case 'shot': {
        ev.icon = EVENT_ICONS.shot;
        ev.description = getEventText('shot', pName);
        ev.type = 'shot';
        shots.push({
          x: 0.1 + rng() * 0.8,
          y: item.team === 'home' ? 0.2 + rng() * 0.3 : 0.5 + rng() * 0.3,
          team: item.team, outcome: 'miss', minute: item.minute,
        });
        break;
      }
      case 'save': {
        ev.icon = EVENT_ICONS.save;
        ev.description = getEventText('save', pName);
        ev.type = 'save';
        shots.push({
          x: 0.25 + rng() * 0.5,
          y: item.team === 'home' ? 0.15 + rng() * 0.1 : 0.75 + rng() * 0.1,
          team: item.team, outcome: 'save', minute: item.minute,
        });
        break;
      }
      case 'injury': {
        ev.icon = EVENT_ICONS.injury;
        ev.description = getEventText('injury', pName);
        ev.type = 'injury';
        break;
      }
      case 'var': {
        ev.icon = EVENT_ICONS.var;
        ev.description = getEventText('var', '');
        ev.playerName = '';
        break;
      }
      case 'general': {
        if (item.minute === 45) {
          ev.icon = '\u23F8\uFE0F';
          ev.description = 'Half-time. An intriguing first half comes to a close.';
          ev.playerName = '';
        } else {
          ev.icon = EVENT_ICONS.general;
          ev.description = GENERAL_TEXTS[Math.floor(rng() * GENERAL_TEXTS.length)];
          ev.playerName = '';
        }
        break;
      }
    }
    events.push(ev);
  }

  let momentumValue = 0;
  const goalItems = allItems.filter(it => it.kind === 'goal');
  for (let m = 3; m <= 90; m += 3) {
    const drift = (rng() - 0.5) * 15 + qDiff * 0.08;
    momentumValue = Math.max(-50, Math.min(50, momentumValue + drift));
    const goalAtMin = goalItems.find(g => g.minute >= m - 3 && g.minute <= m);
    if (goalAtMin) {
      momentumValue += goalAtMin.team === 'home' ? 15 : -15;
      momentumValue = Math.max(-50, Math.min(50, momentumValue));
    }
    momentum.push({ minute: m, value: momentumValue });
  }

  const hPoss = Math.round(50 + qDiff * 0.4 + (rng() - 0.5) * 10);
  const hPasses = Math.floor(350 + homeQuality * 4 + rng() * 50);
  const aPasses = Math.floor(320 + awayQuality * 4 + rng() * 50);
  const stats: MatchStats = {
    homePossession: Math.max(30, Math.min(70, hPoss)),
    awayPossession: 0,
    homeShots: homeShotsCount + totalHomeGoals,
    awayShots: awayShotsCount + totalAwayGoals,
    homeShotsOnTarget: Math.floor((homeShotsCount + totalHomeGoals) * 0.4),
    awayShotsOnTarget: Math.floor((awayShotsCount + totalAwayGoals) * 0.38),
    homePasses: hPasses,
    awayPasses: aPasses,
    homePassAccuracy: Math.floor(75 + rng() * 15),
    awayPassAccuracy: Math.floor(72 + rng() * 15),
    homeCorners: Math.floor(rng() * 5) + 2,
    awayCorners: Math.floor(rng() * 5) + 1,
    homeFouls: Math.floor(rng() * 6) + 5,
    awayFouls: Math.floor(rng() * 6) + 4,
    homeYellowCards: yellowCount,
    awayYellowCards: Math.max(0, yellowCount - Math.floor(yellowCount * (0.55 + rng() * 0.1))),
    homeRedCards: redCount > 0 && rng() < 0.5 ? 1 : 0,
    awayRedCards: redCount > 0 ? 1 - (redCount > 0 && rng() < 0.5 ? 1 : 0) : 0,
    homeOffsides: Math.floor(rng() * 4),
    awayOffsides: Math.floor(rng() * 3),
    homeTackles: Math.floor(rng() * 12) + 10,
    awayTackles: Math.floor(rng() * 12) + 9,
  };
  stats.awayPossession = 100 - stats.homePossession;

  const players: PlayerPerfData[] = [];
  const positions = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'RW', 'ST'];
  for (let i = 0; i < 11; i++) {
    players.push({
      name: PLAYER_NAMES[i],
      position: positions[i],
      rating: parseFloat((5.5 + rng() * 3 + (rng() < 0.15 ? 1 : 0)).toFixed(1)),
      goals: 0,
      assists: 0,
      passes: Math.floor(rng() * 40) + 15,
      tackles: Math.floor(rng() * 6),
      distanceCovered: parseFloat((rng() * 5 + 7).toFixed(1)),
      team: i < 6 ? 'home' : 'away',
    });
  }
  players.sort((a, b) => b.rating - a.rating);
  for (const ge of events.filter(e => e.type === 'goal')) {
    const scorer = players.find(p => p.name === ge.playerName);
    if (scorer) {
      scorer.goals++;
      scorer.rating = Math.min(10, scorer.rating + 0.8);
    }
  }

  return { events, stats, shots, momentum, players, homeScore, awayScore };
}

// ============================================================
// SVG 1: FormationOverviewSVG
// ============================================================
function FormationOverviewSVG({ formation }: { formation: string }) {
  const positions = FORMATIONS[formation] || FORMATIONS['4-3-3'];
  const w = 240;
  const h = 170;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '170px' }}>
      <rect x="0" y="0" width={w} height={h} fill={CLR.bg} rx="4" />
      <rect x="0" y="0" width={w} height={h} fill="none" stroke={CLR.border} strokeWidth="1" rx="4" />
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={CLR.dark} strokeWidth="0.5" />
      <circle cx={w / 2} cy={h / 2} r="18" fill="none" stroke={CLR.dark} strokeWidth="0.5" />
      <rect x="60" y="0" width={w - 120} height="28" fill="none" stroke={CLR.dark} strokeWidth="0.5" rx="2" />
      <rect x="80" y="0" width={w - 160} height="14" fill="none" stroke={CLR.dark} strokeWidth="0.4" rx="1" />
      <rect x="60" y={h - 28} width={w - 120} height="28" fill="none" stroke={CLR.dark} strokeWidth="0.5" rx="2" />
      <rect x="80" y={h - 14} width={w - 160} height="14" fill="none" stroke={CLR.dark} strokeWidth="0.4" rx="1" />
      {positions.map((p, i) => (
        <g key={i}>
          <circle cx={p.x * w} cy={p.y * h} r="6" fill={CLR.lime} opacity="0.8" />
          <text x={p.x * w} y={p.y * h + 14} textAnchor="middle" fill={CLR.mutedText} fontSize="7" fontFamily="monospace">{p.pos}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 2: OpponentStrengthRadar
// ============================================================
function OpponentStrengthRadar({ values }: { values: number[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 70;
  const labels = ['ATK', 'DEF', 'MID', 'PAC', 'SET'];
  const axisEnds = computeRadarAxisEnds(cx, cy, radius, 5);
  const polygonPoints = computeRadarPolygon(cx, cy, radius, values);
  const grid50 = computeRadarPolygon(cx, cy, radius * 0.5, [100, 100, 100, 100, 100]);
  const grid75 = computeRadarPolygon(cx, cy, radius * 0.75, [100, 100, 100, 100, 100]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ height: '200px' }}>
      <polygon points={grid50} fill="none" stroke={CLR.dark} strokeWidth="0.5" />
      <polygon points={grid75} fill="none" stroke={CLR.dark} strokeWidth="0.5" />
      <polygon points={polygonPoints} fill={CLR.orange} opacity="0.15" stroke={CLR.orange} strokeWidth="1.5" />
      {axisEnds.map((end, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={CLR.dark} strokeWidth="0.5" />
          <text
            x={end.x + (end.x > cx ? 10 : -10)}
            y={end.y + (end.y > cy ? 14 : -6)}
            textAnchor={end.x > cx ? 'start' : 'end'}
            fill={CLR.mutedText}
            fontSize="8"
            fontFamily="monospace"
          >
            {labels[i]}
          </text>
        </g>
      ))}
      <text x={cx} y={cy + 4} textAnchor="middle" fill={CLR.orange} fontSize="8" fontFamily="monospace" fontWeight="bold">
        {Math.round(values.reduce((s, v) => s + v, 0) / values.length)}
      </text>
    </svg>
  );
}

// ============================================================
// SVG 3: TacticalMatchupBars
// ============================================================
function TacticalMatchupBars({ homeVals, awayVals }: { homeVals: number[]; awayVals: number[] }) {
  const w = 280;
  const h = 160;
  const barH = 14;
  const gap = 12;
  const midX = w / 2;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '160px' }}>
      {TACTICAL_LABELS.map((label, i) => {
        const y = 10 + i * (barH + gap);
        const homeW = (homeVals[i] / 100) * (midX - 40);
        const awayW = (awayVals[i] / 100) * (midX - 40);
        return (
          <g key={i}>
            <rect x={midX - homeW} y={y} width={homeW} height={barH} fill={CLR.lime} opacity="0.75" rx="2" />
            <rect x={midX} y={y} width={awayW} height={barH} fill={CLR.orange} opacity="0.75" rx="2" />
            <text x={midX - 4} y={y + barH - 3} textAnchor="end" fill={CLR.text} fontSize="7" fontFamily="monospace">{homeVals[i]}</text>
            <text x={midX + 4} y={y + barH - 3} textAnchor="start" fill={CLR.text} fontSize="7" fontFamily="monospace">{awayVals[i]}</text>
            <text x={w - 4} y={y + barH - 3} textAnchor="end" fill={CLR.mutedText} fontSize="7" fontFamily="monospace">{label}</text>
          </g>
        );
      })}
      <line x1={midX} y1="4" x2={midX} y2={h - 4} stroke={CLR.border} strokeWidth="0.5" strokeDasharray="3,2" />
    </svg>
  );
}

// ============================================================
// SVG 4: LiveMomentumAreaChart
// ============================================================
function LiveMomentumAreaChart({ momentum, currentMinute }: { momentum: MomentumPoint[]; currentMinute: number }) {
  const w = 320;
  const h = 90;
  const padX = 15;
  const padY = 10;
  const trackW = w - padX * 2;
  const trackH = h - padY * 2;
  const midY = padY + trackH / 2;

  const filtered = momentum.filter(p => p.minute <= currentMinute);
  if (filtered.length < 2) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '90px' }}>
        <rect x="0" y="0" width={w} height={h} fill={CLR.bg} rx="4" />
        <text x={w / 2} y={h / 2} textAnchor="middle" fill={CLR.mutedText} fontSize="9" fontFamily="monospace">Awaiting data...</text>
      </svg>
    );
  }

  const pts: string[] = [];
  for (let i = 0; i < filtered.length; i++) {
    const px = padX + (filtered[i].minute / 90) * trackW;
    const py = midY - (filtered[i].value / 50) * (trackH / 2);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  const linePath = pts.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(' ');
  const lastX = padX + (filtered[filtered.length - 1].minute / 90) * trackW;
  const firstX = padX + (filtered[0].minute / 90) * trackW;
  const areaPath = `${linePath} L${lastX.toFixed(1)},${midY} L${firstX.toFixed(1)},${midY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '90px' }}>
      <rect x="0" y="0" width={w} height={h} fill={CLR.bg} rx="4" />
      <line x1={padX} y1={midY} x2={padX + trackW} y2={midY} stroke={CLR.dark} strokeWidth="0.5" strokeDasharray="2,2" />
      <line x1={padX + trackW / 2} y1={padY} x2={padX + trackW / 2} y2={padY + trackH} stroke={CLR.border} strokeWidth="0.4" strokeDasharray="3,2" />
      <path d={areaPath} fill={CLR.cyan} opacity="0.1" />
      <path d={linePath} fill="none" stroke={CLR.cyan} strokeWidth="1.2" opacity="0.8" />
      <text x={padX} y={h - 2} fill={CLR.muted} fontSize="5" fontFamily="monospace">0&apos;</text>
      <text x={padX + trackW / 2} y={h - 2} textAnchor="middle" fill={CLR.muted} fontSize="5" fontFamily="monospace">HT</text>
      <text x={padX + trackW} y={h - 2} textAnchor="end" fill={CLR.muted} fontSize="5" fontFamily="monospace">90&apos;</text>
    </svg>
  );
}

// ============================================================
// SVG 5: PossessionComparisonBars
// ============================================================
function PossessionComparisonBars({ home, away }: { home: number; away: number }) {
  const w = 260;
  const h = 60;
  const barH = 22;
  const gap = 16;
  const midX = w / 2;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '60px' }}>
      <rect x={midX - (home / 100) * (midX - 50)} y="8" width={(home / 100) * (midX - 50)} height={barH} fill={CLR.lime} opacity="0.75" rx="3" />
      <rect x={midX} y="8" width={(away / 100) * (midX - 50)} height={barH} fill={CLR.orange} opacity="0.75" rx="3" />
      <text x={midX - 4} y="23" textAnchor="end" fill={CLR.text} fontSize="10" fontFamily="monospace" fontWeight="bold">{home}%</text>
      <text x={midX + 4} y="23" textAnchor="start" fill={CLR.text} fontSize="10" fontFamily="monospace" fontWeight="bold">{away}%</text>
      <line x1={midX} y1="4" x2={midX} y2={h - 4} stroke={CLR.border} strokeWidth="0.5" />
      <text x={30} y={h - 4} fill={CLR.mutedText} fontSize="6" fontFamily="monospace">HOME</text>
      <text x={w - 30} y={h - 4} textAnchor="end" fill={CLR.mutedText} fontSize="6" fontFamily="monospace">AWAY</text>
    </svg>
  );
}

// ============================================================
// SVG 6: ShotMapSVG
// ============================================================
function ShotMapEnhancedSVG({ shots }: { shots: ShotLocation[] }) {
  const w = 240;
  const h = 160;
  const outcomeColors: Record<string, string> = {
    goal: CLR.lime,
    save: CLR.cyan,
    miss: CLR.orange,
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '160px' }}>
      <rect x="0" y="0" width={w} height={h} fill={CLR.bg} rx="4" />
      <rect x="0" y="0" width={w} height={h} fill="none" stroke={CLR.border} strokeWidth="0.8" rx="4" />
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={CLR.dark} strokeWidth="0.4" />
      <circle cx={w / 2} cy={h / 2} r="14" fill="none" stroke={CLR.dark} strokeWidth="0.4" />
      <rect x="80" y="0" width={w - 160} height="20" fill="none" stroke={CLR.lime} strokeWidth="0.4" rx="1" />
      <rect x="80" y={h - 20} width={w - 160} height="20" fill="none" stroke={CLR.orange} strokeWidth="0.4" rx="1" />
      <text x="10" y={h / 2 - 3} fill={CLR.mutedText} fontSize="6" fontFamily="monospace">HOME</text>
      <text x="10" y={h / 2 + 7} fill={CLR.mutedText} fontSize="6" fontFamily="monospace">AWAY</text>
      {shots.map((s, i) => (
        <g key={`shot-${i}`}>
          <circle cx={s.x * w} cy={s.y * h} r={s.outcome === 'goal' ? 5 : 3} fill={outcomeColors[s.outcome]} opacity="0.8" />
          {s.outcome === 'goal' && (
            <circle cx={s.x * w} cy={s.y * h} r="8" fill="none" stroke={outcomeColors[s.outcome]} strokeWidth="0.6" opacity="0.4" />
          )}
        </g>
      ))}
      <circle cx={w - 55} cy="12" r="3" fill={outcomeColors.goal} />
      <text x={w - 48} y="15" fill={CLR.mutedText} fontSize="6" fontFamily="monospace">Goal</text>
      <circle cx={w - 55} cy="24" r="3" fill={outcomeColors.save} />
      <text x={w - 48} y="27" fill={CLR.mutedText} fontSize="6" fontFamily="monospace">Save</text>
      <circle cx={w - 55} cy="36" r="3" fill={outcomeColors.miss} />
      <text x={w - 48} y="39" fill={CLR.mutedText} fontSize="6" fontFamily="monospace">Miss</text>
    </svg>
  );
}

// ============================================================
// SVG 7: StatComparisonBars
// ============================================================
function StatComparisonBars({ homeVals, awayVals }: { homeVals: number[]; awayVals: number[] }) {
  const w = 300;
  const h = 200;
  const barH = 12;
  const gap = 10;
  const midX = w / 2;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '200px' }}>
      <line x1={midX} y1="4" x2={midX} y2={h - 4} stroke={CLR.border} strokeWidth="0.5" strokeDasharray="3,2" />
      {STAT_LABELS.map((label, i) => {
        const y = 6 + i * (barH + gap);
        const total = Math.max(homeVals[i] + awayVals[i], 1);
        const homePct = (homeVals[i] / total) * (midX - 60);
        const awayPct = (awayVals[i] / total) * (midX - 60);
        return (
          <g key={i}>
            <rect x={midX - homePct} y={y} width={homePct} height={barH} fill={CLR.lime} opacity="0.7" rx="2" />
            <rect x={midX} y={y} width={awayPct} height={barH} fill={CLR.cyan} opacity="0.7" rx="2" />
            <text x={midX - 4} y={y + barH - 2} textAnchor="end" fill={CLR.text} fontSize="7" fontFamily="monospace">{homeVals[i]}</text>
            <text x={midX + 4} y={y + barH - 2} textAnchor="start" fill={CLR.text} fontSize="7" fontFamily="monospace">{awayVals[i]}</text>
            <text x={w - 4} y={y + barH - 2} textAnchor="end" fill={CLR.mutedText} fontSize="7" fontFamily="monospace">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 8: PlayerRatingDistributionDonut
// ============================================================
function PlayerRatingDistributionDonut({ players }: { players: PlayerPerfData[] }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 55;
  const strokeWidth = 20;

  const segments = players.reduce((acc, p) => {
    if (p.rating >= 8) acc[0]++;
    else if (p.rating >= 7) acc[1]++;
    else if (p.rating >= 6) acc[2]++;
    else acc[3]++;
    return acc;
  }, [0, 0, 0, 0] as number[]);

  const total = segments.reduce((s, c) => s + c, 0);
  const colors = [CLR.lime, CLR.cyan, CLR.orange, CLR.muted];
  const labels = ['8+', '7-8', '6-7', '<6'];
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -Math.PI / 2;
  const arcs: { d: string; color: string }[] = [];

  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === 0) continue;
    const sweep = (segments[i] / total) * 2 * Math.PI;
    const endAngle = currentAngle + sweep;
    const d = arcPath(cx, cy, radius, currentAngle, endAngle);
    arcs.push({ d, color: colors[i] });
    currentAngle = endAngle;
  }

  const legendItems = segments.map((count, i) => ({ label: labels[i], count, color: colors[i] }));
  legendItems.sort((a, b) => b.count - a.count);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ height: '180px' }}>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={arc.color} opacity="0.7" />
      ))}
      <circle cx={cx} cy={cy} r={radius - strokeWidth} fill={CLR.bg} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={CLR.text} fontSize="14" fontFamily="monospace" fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={CLR.mutedText} fontSize="7" fontFamily="monospace">Players</text>
      {legendItems.map((item, i) => (
        <g key={i}>
          <circle cx={10} cy={size - 30 + i * 10} r="3" fill={item.color} />
          <text x={16} y={size - 27 + i * 10} fill={CLR.mutedText} fontSize="7" fontFamily="monospace">{item.label}: {item.count}</text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 9: MatchTimelineSVG
// ============================================================
function MatchTimelineSVG({ events }: { events: CommentaryEvent[] }) {
  const w = 320;
  const h = 70;
  const padX = 20;
  const trackW = w - padX * 2;
  const midY = h / 2;

  const keyEvents = events.filter(e => e.type === 'goal' || e.type === 'card' || e.type === 'substitution');
  const eventColors: Record<string, string> = {
    goal: CLR.lime,
    card: CLR.orange,
    substitution: CLR.cyan,
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '70px' }}>
      <rect x="0" y="0" width={w} height={h} fill={CLR.bg} rx="4" />
      <line x1={padX} y1={midY} x2={padX + trackW} y2={midY} stroke={CLR.border} strokeWidth="1.5" />
      <line x1={padX + trackW / 2} y1={midY - 6} x2={padX + trackW / 2} y2={midY + 6} stroke={CLR.muted} strokeWidth="1" />
      {keyEvents.map((ev, i) => {
        const ex = padX + (ev.minute / 90) * trackW;
        const color = eventColors[ev.type] || CLR.muted;
        return (
          <g key={i}>
            <circle cx={ex} cy={midY} r="4" fill={color} opacity="0.9" />
            <text x={ex} y={midY - 9} textAnchor="middle" fill={color} fontSize="6" fontFamily="monospace">{ev.minute}&apos;</text>
          </g>
        );
      })}
      <text x={padX} y={h - 4} fill={CLR.muted} fontSize="6" fontFamily="monospace">0&apos;</text>
      <text x={padX + trackW / 2} y={h - 4} textAnchor="middle" fill={CLR.muted} fontSize="6" fontFamily="monospace">HT</text>
      <text x={padX + trackW} y={h - 4} textAnchor="end" fill={CLR.muted} fontSize="6" fontFamily="monospace">90&apos;</text>
    </svg>
  );
}

// ============================================================
// SVG 10: SeasonFormLine
// ============================================================
function SeasonFormLine({ data }: { data: number[] }) {
  const w = 260;
  const h = 80;
  const padX = 10;
  const padY = 10;
  const trackW = w - padX * 2;
  const trackH = h - padY * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const px = padX + (i / (data.length - 1)) * trackW;
    const py = padY + trackH - ((data[i] - min) / range) * trackH;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  const linePath = pts.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '80px' }}>
      <rect x="0" y="0" width={w} height={h} fill={CLR.bg} rx="4" />
      <line x1={padX} y1={padY} x2={padX} y2={padY + trackH} stroke={CLR.dark} strokeWidth="0.3" />
      <line x1={padX} y1={padY + trackH} x2={padX + trackW} y2={padY + trackH} stroke={CLR.dark} strokeWidth="0.3" />
      <path d={linePath} fill="none" stroke={CLR.orange} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      {pts.map((p, i) => {
        const [px, py] = p.split(',');
        return (
          <g key={i}>
            <circle cx={parseFloat(px)} cy={parseFloat(py)} r="3" fill={CLR.orange} opacity="0.7" />
            <text x={parseFloat(px)} y={parseFloat(py) - 6} textAnchor="middle" fill={CLR.mutedText} fontSize="6" fontFamily="monospace">{data[i].toFixed(1)}</text>
          </g>
        );
      })}
      <text x={padX} y={h - 2} fill={CLR.muted} fontSize="5" fontFamily="monospace">Recent Matches</text>
    </svg>
  );
}

// ============================================================
// SVG 11: GoalsConcededAreaChart
// ============================================================
function GoalsConcededAreaChart({ data }: { data: number[] }) {
  const w = 260;
  const h = 80;
  const padX = 10;
  const padY = 10;
  const trackW = w - padX * 2;
  const trackH = h - padY * 2;

  const max = Math.max(...data, 1);

  const pts: string[] = [];
  for (let i = 0; i < data.length; i++) {
    const px = padX + (i / (data.length - 1)) * trackW;
    const py = padY + trackH - (data[i] / max) * trackH;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  const linePath = pts.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(' ');
  const firstPt = pts[0] || '10,10';
  const lastPt = pts[pts.length - 1] || '250,10';
  const areaPath = `${linePath} L${lastPt.split(',')[0]},${padY + trackH} L${firstPt.split(',')[0]},${padY + trackH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '80px' }}>
      <rect x="0" y="0" width={w} height={h} fill={CLR.bg} rx="4" />
      <path d={areaPath} fill={CLR.orange} opacity="0.15" />
      <path d={linePath} fill="none" stroke={CLR.orange} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      {pts.map((p, i) => {
        const [px, py] = p.split(',');
        return (
          <g key={i}>
            <circle cx={parseFloat(px)} cy={parseFloat(py)} r="2.5" fill={CLR.orange} opacity="0.7" />
            <text x={parseFloat(px)} y={parseFloat(py) - 5} textAnchor="middle" fill={CLR.mutedText} fontSize="6" fontFamily="monospace">{data[i]}</text>
          </g>
        );
      })}
      <text x={padX} y={h - 2} fill={CLR.muted} fontSize="5" fontFamily="monospace">Goals Conceded</text>
    </svg>
  );
}

// ============================================================
// SVG 12: OverallPerformanceRadar
// ============================================================
function OverallPerformanceRadar({ values }: { values: number[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 70;
  const labels = ['Attack', 'Defense', 'Consistency', 'Impact', 'Fitness'];
  const axisEnds = computeRadarAxisEnds(cx, cy, radius, 5);
  const polygonPoints = computeRadarPolygon(cx, cy, radius, values);
  const grid50 = computeRadarPolygon(cx, cy, radius * 0.5, [100, 100, 100, 100, 100]);
  const grid25 = computeRadarPolygon(cx, cy, radius * 0.25, [100, 100, 100, 100, 100]);
  const grid75 = computeRadarPolygon(cx, cy, radius * 0.75, [100, 100, 100, 100, 100]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ height: '200px' }}>
      <polygon points={grid25} fill="none" stroke={CLR.dark} strokeWidth="0.3" />
      <polygon points={grid50} fill="none" stroke={CLR.dark} strokeWidth="0.4" />
      <polygon points={grid75} fill="none" stroke={CLR.dark} strokeWidth="0.5" />
      <polygon points={polygonPoints} fill={CLR.lime} opacity="0.15" stroke={CLR.lime} strokeWidth="1.5" />
      {axisEnds.map((end, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={CLR.dark} strokeWidth="0.5" />
          <text
            x={end.x + (end.x > cx ? 10 : -10)}
            y={end.y + (end.y > cy ? 14 : -6)}
            textAnchor={end.x > cx ? 'start' : 'end'}
            fill={CLR.mutedText}
            fontSize="7"
            fontFamily="monospace"
          >
            {labels[i]}
          </text>
        </g>
      ))}
      <text x={cx} y={cy + 4} textAnchor="middle" fill={CLR.lime} fontSize="9" fontFamily="monospace" fontWeight="bold">
        {Math.round(values.reduce((s, v) => s + v, 0) / values.length)}
      </text>
    </svg>
  );
}

// ============================================================
// Stat Bar Component (for inline use)
// ============================================================
function StatRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs py-0.5">
      <span className="w-20 text-right text-[10px] font-medium text-[#8b949e] uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-2 rounded-sm overflow-hidden bg-[#21262d]">
        <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color, opacity: 0.8 }} />
      </div>
      <span className="w-8 text-left font-mono text-[11px] font-bold" style={{ color: CLR.text }}>{value}</span>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function MatchEngineSimulationEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  const [currentMinute, setCurrentMinute] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [phase, setPhase] = useState<MatchPhase>('pre_match');
  const [formation, setFormation] = useState('4-3-3');
  const [activeTab, setActiveTab] = useState('prematch');

  // Derive seed deterministically from game state
  const seed = (() => {
    if (!gameState) return 42;
    return ((gameState.player.overall * 137 + gameState.currentClub.quality * 53 + gameState.currentWeek * 7 + gameState.currentSeason * 31) | 0);
  })();

  const awayQuality = Math.max(30, (gameState?.currentClub.quality || 50) + Math.floor((seed % 20) - 10));
  const awayClubName = OPPONENT_NAMES[Math.abs(seed % OPPONENT_NAMES.length)];

  const matchData = (() => {
    if (!gameState) return null;
    return generateMatchData(seed, gameState.currentClub.quality, awayQuality);
  })();

  // Visible commentary filtered by current minute
  const visibleEvents = (() => {
    if (!matchData || phase === 'pre_match') return [];
    return matchData.events.filter(e => e.minute <= currentMinute);
  })();

  // Visible shots filtered by current minute
  const visibleShots = (() => {
    if (!matchData || phase === 'pre_match') return [];
    return matchData.shots.filter(s => s.minute <= currentMinute);
  })();

  // Live scores tracking
  const liveHomeScore = (() => {
    if (!matchData) return 0;
    return matchData.events.filter(e => e.type === 'goal' && e.minute <= currentMinute && matchData.events.indexOf(e) % 2 === 0).length;
  })();

  const liveAwayScore = (() => {
    if (!matchData) return 0;
    return matchData.events.filter(e => e.type === 'goal' && e.minute <= currentMinute && matchData.events.indexOf(e) % 2 !== 0).length;
  })();

  // Opponent radar values
  const opponentRadar = (() => {
    const rng = seededRandom(seed + 999);
    return [
      Math.floor(40 + awayQuality * 0.4 + rng() * 20),
      Math.floor(45 + awayQuality * 0.35 + rng() * 20),
      Math.floor(50 + awayQuality * 0.3 + rng() * 15),
      Math.floor(40 + rng() * 30),
      Math.floor(35 + rng() * 25),
    ];
  })();

  // Tactical matchup values
  const homeTactical = (() => {
    if (!gameState) return [70, 65, 75, 60, 55, 80];
    const q = gameState.currentClub.quality;
    const rng = seededRandom(seed + 77);
    return [
      Math.min(95, Math.floor(q * 0.6 + rng() * 20)),
      Math.min(95, Math.floor(q * 0.55 + rng() * 20)),
      Math.min(95, Math.floor(q * 0.65 + rng() * 15)),
      Math.min(95, Math.floor(50 + rng() * 30)),
      Math.min(95, Math.floor(q * 0.4 + rng() * 25)),
      Math.min(95, Math.floor(60 + rng() * 25)),
    ];
  })();

  const awayTactical = (() => {
    const rng = seededRandom(seed + 88);
    return [
      Math.min(95, Math.floor(awayQuality * 0.6 + rng() * 20)),
      Math.min(95, Math.floor(awayQuality * 0.55 + rng() * 20)),
      Math.min(95, Math.floor(awayQuality * 0.65 + rng() * 15)),
      Math.min(95, Math.floor(50 + rng() * 30)),
      Math.min(95, Math.floor(awayQuality * 0.4 + rng() * 25)),
      Math.min(95, Math.floor(60 + rng() * 25)),
    ];
  })();

  // Season form data (8 recent matches)
  const seasonForm = (() => {
    const rng = seededRandom(seed + 333);
    return Array.from({ length: 8 }, () => parseFloat((5 + rng() * 4).toFixed(1)));
  })();

  // Goals conceded data
  const goalsConceded = (() => {
    const rng = seededRandom(seed + 444);
    return Array.from({ length: 8 }, () => Math.floor(rng() * 4));
  })();

  // Overall performance radar values
  const perfRadar = (() => {
    if (!gameState) return [60, 60, 60, 60, 60];
    const p = gameState.player;
    const rng = seededRandom(seed + 555);
    return [
      Math.min(95, Math.floor(p.attributes?.shooting || 50) * 0.8 + rng() * 20),
      Math.min(95, Math.floor(p.attributes?.defending || 50) * 0.7 + rng() * 20),
      Math.min(95, Math.floor((p.form || 6) * 10 + rng() * 10)),
      Math.min(95, Math.floor((p.overall || 50) * 0.8 + rng() * 15)),
      Math.min(95, Math.floor((p.fitness || 70) * 0.9 + rng() * 10)),
    ];
  })();

  // Stats comparison arrays
  const statHomeVals = (() => {
    if (!matchData) return [0, 0, 0, 0, 0, 0, 0, 0];
    const s = matchData.stats;
    return [s.homeShots, s.homePasses, s.homeTackles, s.homeFouls, s.homeCorners, s.homeOffsides, s.homeShotsOnTarget, s.homeYellowCards];
  })();

  const statAwayVals = (() => {
    if (!matchData) return [0, 0, 0, 0, 0, 0, 0, 0];
    const s = matchData.stats;
    return [s.awayShots, s.awayPasses, s.awayTackles, s.awayFouls, s.awayCorners, s.awayOffsides, s.awayShotsOnTarget, s.awayYellowCards];
  })();

  // Simulation timer effect
  useEffect(() => {
    if (!isSimulating || currentMinute >= 90) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentMinute(prev => {
        const next = prev + 1;
        if (next >= 45 && prev < 45 && phase === 'first_half') {
          setPhase('half_time');
          return 45;
        }
        if (next >= 90) {
          // Schedule full-time state update via setTimeout (not synchronous in effect body)
          setTimeout(() => {
            setIsSimulating(false);
            setPhase('full_time');
          }, 0);
          return 90;
        }
        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isSimulating, currentMinute, phase]);

  // Resume from half-time
  useEffect(() => {
    if (phase === 'half_time' && isSimulating) {
      const timeout = setTimeout(() => {
        setPhase('second_half');
        setCurrentMinute(45);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [phase, isSimulating]);

  const handleStartMatch = useCallback(() => {
    setPhase('first_half');
    setCurrentMinute(0);
    setIsSimulating(true);
    setActiveTab('live');
  }, []);

  const handlePauseResume = useCallback(() => {
    if (phase === 'half_time') {
      setPhase('second_half');
      setCurrentMinute(45);
      setIsSimulating(true);
      return;
    }
    setIsSimulating(prev => !prev);
  }, [phase]);

  const handleSkipToEnd = useCallback(() => {
    setIsSimulating(false);
    setCurrentMinute(90);
    setPhase('full_time');
  }, []);

  // Guard: no game state
  if (!gameState || !matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CLR.bg }}>
        <div className="text-center">
          <p className="text-sm" style={{ color: CLR.mutedText }}>No active career found.</p>
          <button
            onClick={() => setScreen('main_menu')}
            className="mt-3 px-4 py-2 text-white text-sm rounded-lg transition-colors"
            style={{ backgroundColor: CLR.orange }}
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  const homeClub = gameState.currentClub;
  const phaseLabel: Record<MatchPhase, string> = {
    pre_match: 'Pre-Match',
    first_half: '1st Half',
    half_time: 'Half Time',
    second_half: '2nd Half',
    full_time: 'Full Time',
  };

  const finalHomeScore = phase === 'full_time' ? matchData.homeScore : liveHomeScore;
  const finalAwayScore = phase === 'full_time' ? matchData.awayScore : liveAwayScore;

  // ============================================================
  // Render: Header
  // ============================================================
  const renderHeader = () => (
    <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: CLR.card, borderBottom: `1px solid ${CLR.border}` }}>
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5" style={{ color: CLR.orange }} />
        <h1 className="text-sm font-bold" style={{ color: CLR.text }}>Match Engine Enhanced</h1>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="text-[10px] px-2 py-0.5" style={{ backgroundColor: CLR.dark, color: CLR.mutedText, border: `1px solid ${CLR.border}` }}>
          {phaseLabel[phase]}
        </Badge>
        {phase !== 'pre_match' && phase !== 'full_time' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePauseResume}
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: CLR.dark, border: `1px solid ${CLR.border}` }}
            >
              {isSimulating
                ? <Pause className="h-4 w-4" style={{ color: CLR.text }} />
                : <Play className="h-4 w-4" style={{ color: CLR.text }} />}
            </button>
            <button
              onClick={handleSkipToEnd}
              className="p-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: CLR.dark, border: `1px solid ${CLR.border}` }}
            >
              <SkipForward className="h-4 w-4" style={{ color: CLR.text }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================
  // Render: Score Bar
  // ============================================================
  const renderScoreBar = () => (
    <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: CLR.card, borderBottom: `1px solid ${CLR.border}` }}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg">{homeClub.logo}</span>
        <div className="min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: CLR.text }}>{homeClub.name}</p>
          <p className="text-[10px]" style={{ color: CLR.mutedText }}>Home</p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4">
        <motion.span
          key={`h-${finalHomeScore}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={ANIM}
          className="text-3xl font-black tabular-nums"
          style={{ color: CLR.text }}
        >
          {phase === 'pre_match' ? '-' : finalHomeScore}
        </motion.span>
        <span className="text-lg font-bold" style={{ color: CLR.muted }}>:</span>
        <motion.span
          key={`a-${finalAwayScore}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={ANIM}
          className="text-3xl font-black tabular-nums"
          style={{ color: CLR.text }}
        >
          {phase === 'pre_match' ? '-' : finalAwayScore}
        </motion.span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
        <Shield className="h-5 w-5" style={{ color: CLR.orange }} />
        <div className="min-w-0 text-right">
          <p className="text-xs font-bold truncate" style={{ color: CLR.text }}>{awayClubName}</p>
          <p className="text-[10px]" style={{ color: CLR.mutedText }}>Away</p>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // Render: Match Clock
  // ============================================================
  const renderClock = () => (
    <div className="px-4 py-2 flex items-center justify-center gap-2" style={{ backgroundColor: CLR.bg }}>
      <Clock className="h-4 w-4" style={{ color: CLR.cyan }} />
      <span className="text-base font-mono font-bold" style={{ color: CLR.cyan }}>{currentMinute}&apos;</span>
      {phase !== 'full_time' && phase !== 'pre_match' && (
        <span className="text-[10px] px-2 py-0.5 rounded-sm" style={{ backgroundColor: CLR.dark, color: CLR.mutedText }}>
          {isSimulating ? 'LIVE' : 'PAUSED'}
        </span>
      )}
    </div>
  );

  // ============================================================
  // Tab 1: Pre-Match Analysis
  // ============================================================
  const renderPreMatch = () => (
    <div className="space-y-3">
      {/* Formation Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={ANIM}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4" style={{ color: CLR.lime }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Formation Setup</h3>
        </div>
        <div className="flex gap-2 mb-2 flex-wrap">
          {Object.keys(FORMATIONS).map((f, i) => (
            <button
              key={i}
              onClick={() => setFormation(f)}
              className="px-3 py-1 text-xs font-mono rounded-lg transition-colors"
              style={{
                backgroundColor: formation === f ? CLR.orange : CLR.dark,
                color: formation === f ? '#fff' : CLR.mutedText,
                border: `1px solid ${formation === f ? CLR.orange : CLR.border}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <FormationOverviewSVG formation={formation} />
      </motion.div>

      {/* Opponent Analysis */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.05 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4" style={{ color: CLR.orange }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Opponent: {awayClubName}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-mono mb-1" style={{ color: CLR.mutedText }}>Quality Rating</p>
            <div className="flex items-center gap-2">
              <StatRow label="Overall" value={awayQuality} max={100} color={CLR.orange} />
            </div>
          </div>
          <div>
            <OpponentStrengthRadar values={opponentRadar} />
          </div>
        </div>
      </motion.div>

      {/* Tactical Matchup */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.1 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4" style={{ color: CLR.cyan }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Tactical Matchup</h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono" style={{ color: CLR.lime }}>{homeClub.name}</span>
          <span className="text-[10px]" style={{ color: CLR.muted }}>vs</span>
          <span className="text-[10px] font-mono" style={{ color: CLR.orange }}>{awayClubName}</span>
        </div>
        <TacticalMatchupBars homeVals={homeTactical} awayVals={awayTactical} />
      </motion.div>

      {/* Pre-match key stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.15 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4" style={{ color: CLR.lime }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Key Match Stats</h3>
        </div>
        <div className="space-y-1">
          <StatRow label="Club Quality" value={homeClub.quality} max={100} color={CLR.lime} />
          <StatRow label="Player OVR" value={gameState.player.overall} max={100} color={CLR.cyan} />
          <StatRow label="Fitness" value={gameState.player.fitness} max={100} color={CLR.lime} />
          <StatRow label="Morale" value={gameState.player.morale} max={100} color={CLR.orange} />
          <StatRow label="Form" value={Math.round(gameState.player.form * 10)} max={100} color={CLR.cyan} />
        </div>
      </motion.div>

      {/* Start Match Button */}
      {phase === 'pre_match' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleStartMatch}
          className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: CLR.orange, color: '#fff' }}
        >
          <Play className="h-4 w-4" />
          Kick Off
        </motion.button>
      )}
    </div>
  );

  // ============================================================
  // Tab 2: Live Simulation
  // ============================================================
  const renderLiveSim = () => (
    <div className="space-y-3">
      {renderClock()}

      {/* Scoreboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={ANIM}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" style={{ color: CLR.orange }} />
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Live Score</h3>
          </div>
          <Badge className="text-[10px] px-2 py-0.5" style={{ backgroundColor: isSimulating ? CLR.orange : CLR.dark, color: '#fff' }}>
            {phaseLabel[phase]}
          </Badge>
        </div>
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: CLR.lime }}>{homeClub.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              key={`live-h-${finalHomeScore}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={ANIM}
              className="text-4xl font-black tabular-nums"
              style={{ color: CLR.text }}
            >
              {finalHomeScore}
            </motion.span>
            <span className="text-xl font-bold" style={{ color: CLR.muted }}>-</span>
            <motion.span
              key={`live-a-${finalAwayScore}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={ANIM}
              className="text-4xl font-black tabular-nums"
              style={{ color: CLR.text }}
            >
              {finalAwayScore}
            </motion.span>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: CLR.orange }}>{awayClubName}</p>
          </div>
        </div>
        {/* Possession */}
        {phase !== 'pre_match' && (
          <PossessionComparisonBars home={matchData.stats.homePossession} away={matchData.stats.awayPossession} />
        )}
      </motion.div>

      {/* Momentum Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.05 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4" style={{ color: CLR.cyan }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Momentum</h3>
        </div>
        <LiveMomentumAreaChart momentum={matchData.momentum} currentMinute={currentMinute} />
      </motion.div>

      {/* Shot Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.1 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4" style={{ color: CLR.orange }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Shot Map</h3>
        </div>
        <ShotMapEnhancedSVG shots={visibleShots} />
      </motion.div>

      {/* Live Commentary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.15 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4" style={{ color: CLR.lime }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Live Commentary</h3>
        </div>
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: `${CLR.dark} transparent` }}>
          {visibleEvents.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: CLR.mutedText }}>Waiting for kick off...</p>
          )}
          {[...visibleEvents].reverse().slice(0, 20).map((ev, i) => (
            <motion.div
              key={`ev-${currentMinute}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={ANIM}
              className="flex items-start gap-2 p-2 rounded-sm"
              style={{ backgroundColor: ev.type === 'goal' ? `${CLR.orange}15` : CLR.dark }}
            >
              <span className="text-sm mt-0.5">{ev.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold" style={{ color: ev.type === 'goal' ? CLR.orange : CLR.mutedText }}>
                    {ev.minute}&apos;
                  </span>
                  {ev.playerName && (
                    <span className="text-[10px] font-bold" style={{ color: CLR.text }}>{ev.playerName}</span>
                  )}
                </div>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: CLR.mutedText }}>{ev.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Control buttons */}
      {phase !== 'pre_match' && phase !== 'full_time' && (
        <div className="flex gap-2">
          <button
            onClick={handlePauseResume}
            className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            style={{ backgroundColor: CLR.dark, color: CLR.text, border: `1px solid ${CLR.border}` }}
          >
            {isSimulating ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isSimulating ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleSkipToEnd}
            className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            style={{ backgroundColor: CLR.orange, color: '#fff' }}
          >
            <SkipForward className="h-3 w-3" />
            Skip to End
          </button>
        </div>
      )}

      {phase === 'full_time' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: `${CLR.orange}15`, border: `1px solid ${CLR.orange}` }}
        >
          <p className="text-sm font-bold" style={{ color: CLR.orange }}>Full Time</p>
          <p className="text-xs mt-1" style={{ color: CLR.text }}>
            {homeClub.name} {matchData.homeScore} - {matchData.awayScore} {awayClubName}
          </p>
          <button
            onClick={() => setActiveTab('postmatch')}
            className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{ backgroundColor: CLR.orange, color: '#fff' }}
          >
            View Full Stats
          </button>
        </motion.div>
      )}
    </div>
  );

  // ============================================================
  // Tab 3: Post-Match Stats
  // ============================================================
  const renderPostMatch = () => (
    <div className="space-y-3">
      {/* Result Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={ANIM}
        className="p-3 rounded-lg text-center"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <Trophy className="h-6 w-6 mx-auto mb-1" style={{ color: CLR.orange }} />
        <p className="text-lg font-black" style={{ color: CLR.text }}>
          {matchData.homeScore} - {matchData.awayScore}
        </p>
        <p className="text-xs" style={{ color: CLR.mutedText }}>
          {homeClub.name} vs {awayClubName}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge className="text-[10px] px-2 py-0.5" style={{ backgroundColor: CLR.dark, color: CLR.lime, border: `1px solid ${CLR.border}` }}>
            Matchweek {gameState.currentWeek}
          </Badge>
          <Badge className="text-[10px] px-2 py-0.5" style={{ backgroundColor: CLR.dark, color: CLR.mutedText, border: `1px solid ${CLR.border}` }}>
            Season {gameState.currentSeason}
          </Badge>
        </div>
      </motion.div>

      {/* Stat Comparison Bars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.05 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4" style={{ color: CLR.cyan }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Match Statistics</h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono" style={{ color: CLR.lime }}>{homeClub.name}</span>
          <span className="text-[10px]" style={{ color: CLR.muted }}>vs</span>
          <span className="text-[10px] font-mono" style={{ color: CLR.cyan }}>{awayClubName}</span>
        </div>
        <StatComparisonBars homeVals={statHomeVals} awayVals={statAwayVals} />
      </motion.div>

      {/* Player Ratings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.1 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4" style={{ color: CLR.lime }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Player Ratings</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <PlayerRatingDistributionDonut players={matchData.players} />
          </div>
          <div className="space-y-1">
            {[...matchData.players].sort((a, b) => b.rating - a.rating).slice(0, 6).map((p, i) => {
              const ratingColor = p.rating >= 8 ? CLR.lime : p.rating >= 7 ? CLR.cyan : p.rating >= 6 ? CLR.orange : CLR.muted;
              return (
                <div key={i} className="flex items-center justify-between py-1 px-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold truncate" style={{ color: CLR.text }}>{p.name}</p>
                    <p className="text-[8px]" style={{ color: CLR.mutedText }}>{p.position} &middot; {p.team === 'home' ? 'H' : 'A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.goals > 0 && <span className="text-[9px]" style={{ color: CLR.orange }}>{p.goals}G</span>}
                    <span className="text-xs font-mono font-bold" style={{ color: ratingColor }}>{p.rating.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Match Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.15 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4" style={{ color: CLR.orange }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Match Timeline</h3>
        </div>
        <MatchTimelineSVG events={matchData.events} />
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1">
            <circle cx="6" cy="6" r="4" fill={CLR.lime} />
            <span className="text-[9px]" style={{ color: CLR.mutedText }}>Goals</span>
          </div>
          <div className="flex items-center gap-1">
            <circle cx="6" cy="6" r="4" fill={CLR.orange} />
            <span className="text-[9px]" style={{ color: CLR.mutedText }}>Cards</span>
          </div>
          <div className="flex items-center gap-1">
            <circle cx="6" cy="6" r="4" fill={CLR.cyan} />
            <span className="text-[9px]" style={{ color: CLR.mutedText }}>Subs</span>
          </div>
        </div>
      </motion.div>

      {/* Key Events Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.2 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4" style={{ color: CLR.orange }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Key Events</h3>
        </div>
        <div className="space-y-1">
          {matchData.events.filter(e => e.type !== 'general').slice(0, 12).map((ev, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
              <span className="text-sm">{ev.icon}</span>
              <span className="text-[10px] font-mono font-bold w-6 text-right" style={{ color: CLR.mutedText }}>{ev.minute}&apos;</span>
              <p className="text-[10px] flex-1 min-w-0 truncate" style={{ color: CLR.text }}>
                {ev.playerName ? `${ev.playerName}: ` : ''}{ev.description}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Detailed Stat Numbers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.25 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4" style={{ color: CLR.cyan }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Detailed Numbers</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.lime }}>{matchData.stats.homePasses}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Home Passes</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.cyan }}>{matchData.stats.homePassAccuracy}%</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Pass Accuracy</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.orange }}>{matchData.stats.awayPasses}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Away Passes</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.lime }}>{matchData.stats.homeTackles}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Home Tackles</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.cyan }}>{matchData.stats.homeFouls + matchData.stats.awayFouls}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Total Fouls</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.orange }}>{matchData.stats.awayTackles}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Away Tackles</p>
          </div>
        </div>
      </motion.div>

      {/* Back to dashboard */}
      <button
        onClick={() => setScreen('dashboard')}
        className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        style={{ backgroundColor: CLR.dark, color: CLR.text, border: `1px solid ${CLR.border}` }}
      >
        Continue to Dashboard
      </button>
    </div>
  );

  // ============================================================
  // Tab 4: Match Analytics
  // ============================================================
  const renderAnalytics = () => (
    <div className="space-y-3">
      {/* Season Overview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={ANIM}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-4 w-4" style={{ color: CLR.lime }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Season Overview</h3>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.text }}>{gameState.currentSeason}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Season</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.lime }}>{gameState.currentWeek}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Week</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.cyan }}>{gameState.player.age}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Age</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.orange }}>{gameState.player.overall}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>OVR</p>
          </div>
        </div>
        <div className="space-y-1">
          <StatRow label="Appearances" value={gameState.player.seasonStats.appearances} max={50} color={CLR.lime} />
          <StatRow label="Goals" value={gameState.player.seasonStats.goals} max={30} color={CLR.orange} />
          <StatRow label="Assists" value={gameState.player.seasonStats.assists} max={20} color={CLR.cyan} />
          <StatRow label="Avg Rating" value={Math.round(gameState.player.seasonStats.averageRating * 10)} max={100} color={CLR.lime} />
        </div>
      </motion.div>

      {/* Season Form Line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.05 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4" style={{ color: CLR.orange }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Recent Form</h3>
        </div>
        <SeasonFormLine data={seasonForm} />
        <div className="flex justify-between mt-2">
          {seasonForm.map((val, i) => {
            const dotColor = val >= 7.5 ? CLR.lime : val >= 6.5 ? CLR.cyan : val >= 5.5 ? CLR.orange : CLR.muted;
            return (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: dotColor }} />
                <span className="text-[8px] font-mono" style={{ color: CLR.mutedText }}>{val.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Goals Conceded */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.1 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4" style={{ color: CLR.orange }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Goals Conceded Trend</h3>
        </div>
        <GoalsConcededAreaChart data={goalsConceded} />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px]" style={{ color: CLR.mutedText }}>Total: {goalsConceded.reduce((s, v) => s + v, 0)}</span>
          <span className="text-[10px]" style={{ color: CLR.mutedText }}>Avg: {(goalsConceded.reduce((s, v) => s + v, 0) / goalsConceded.length).toFixed(1)}/match</span>
        </div>
      </motion.div>

      {/* Overall Performance Radar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.15 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4" style={{ color: CLR.lime }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Overall Performance</h3>
        </div>
        <OverallPerformanceRadar values={perfRadar} />
      </motion.div>

      {/* Performance Breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.2 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4" style={{ color: CLR.cyan }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Attribute Breakdown</h3>
        </div>
        <div className="space-y-1">
          <StatRow label="Pace" value={gameState.player.attributes?.pace || 50} max={100} color={CLR.lime} />
          <StatRow label="Shooting" value={gameState.player.attributes?.shooting || 50} max={100} color={CLR.orange} />
          <StatRow label="Passing" value={gameState.player.attributes?.passing || 50} max={100} color={CLR.cyan} />
          <StatRow label="Dribbling" value={gameState.player.attributes?.dribbling || 50} max={100} color={CLR.lime} />
          <StatRow label="Defending" value={gameState.player.attributes?.defending || 50} max={100} color={CLR.orange} />
          <StatRow label="Physical" value={gameState.player.attributes?.physical || 50} max={100} color={CLR.cyan} />
        </div>
      </motion.div>

      {/* Career Highlights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.25 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-4 w-4" style={{ color: CLR.orange }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Career Highlights</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.lime }}>{gameState.player.careerStats.totalGoals}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Career Goals</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.cyan }}>{gameState.player.careerStats.totalAssists}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Career Assists</p>
          </div>
          <div className="text-center p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <p className="text-lg font-black font-mono" style={{ color: CLR.orange }}>{gameState.player.careerStats.totalAppearances}</p>
            <p className="text-[8px]" style={{ color: CLR.mutedText }}>Appearances</p>
          </div>
        </div>
        {gameState.player.careerStats.trophies.length > 0 && (
          <div className="mt-2 flex items-center gap-1 flex-wrap">
            <span className="text-[9px] font-bold mr-1" style={{ color: CLR.orange }}>Trophies:</span>
            {gameState.player.careerStats.trophies.map((t, i) => (
              <Badge key={i} className="text-[8px] px-1.5 py-0" style={{ backgroundColor: CLR.dark, color: CLR.lime, border: `1px solid ${CLR.border}` }}>
                {typeof t === 'string' ? t : JSON.stringify(t)}
              </Badge>
            ))}
          </div>
        )}
      </motion.div>

      {/* Form Trend Analysis */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: 0.3 }}
        className="p-3 rounded-lg"
        style={{ backgroundColor: CLR.card, border: `1px solid ${CLR.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4" style={{ color: CLR.cyan }} />
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: CLR.text }}>Form Analysis</h3>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <span className="text-[10px]" style={{ color: CLR.mutedText }}>Current Form</span>
            <span className="text-xs font-mono font-bold" style={{ color: seasonForm[seasonForm.length - 1] >= 7 ? CLR.lime : CLR.orange }}>
              {gameState.player.form.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <span className="text-[10px]" style={{ color: CLR.mutedText }}>Season Avg Rating</span>
            <span className="text-xs font-mono font-bold" style={{ color: CLR.text }}>
              {gameState.player.seasonStats.averageRating > 0 ? gameState.player.seasonStats.averageRating.toFixed(1) : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <span className="text-[10px]" style={{ color: CLR.mutedText }}>Man of the Match</span>
            <span className="text-xs font-mono font-bold" style={{ color: CLR.orange }}>
              {gameState.player.seasonStats.manOfTheMatch}x
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-sm" style={{ backgroundColor: CLR.dark }}>
            <span className="text-[10px]" style={{ color: CLR.mutedText }}>Clean Sheets</span>
            <span className="text-xs font-mono font-bold" style={{ color: CLR.cyan }}>
              {gameState.player.seasonStats.cleanSheets}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <div className="min-h-screen" style={{ backgroundColor: CLR.bg }}>
      {renderHeader()}
      {renderScoreBar()}
      {phase !== 'pre_match' && activeTab !== 'prematch' && renderClock()}

      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-3" style={{ backgroundColor: CLR.dark, border: `1px solid ${CLR.border}` }}>
            <TabsTrigger
              value="prematch"
              className="flex-1 text-[10px] font-bold uppercase tracking-wider data-[state=active]:shadow-none"
              style={{
                color: activeTab === 'prematch' ? CLR.orange : CLR.mutedText,
                backgroundColor: activeTab === 'prematch' ? CLR.card : 'transparent',
              }}
            >
              Pre-Match
            </TabsTrigger>
            <TabsTrigger
              value="live"
              className="flex-1 text-[10px] font-bold uppercase tracking-wider data-[state=active]:shadow-none"
              style={{
                color: activeTab === 'live' ? CLR.cyan : CLR.mutedText,
                backgroundColor: activeTab === 'live' ? CLR.card : 'transparent',
              }}
            >
              Live Sim
            </TabsTrigger>
            <TabsTrigger
              value="postmatch"
              className="flex-1 text-[10px] font-bold uppercase tracking-wider data-[state=active]:shadow-none"
              style={{
                color: activeTab === 'postmatch' ? CLR.lime : CLR.mutedText,
                backgroundColor: activeTab === 'postmatch' ? CLR.card : 'transparent',
              }}
            >
              Post-Match
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex-1 text-[10px] font-bold uppercase tracking-wider data-[state=active]:shadow-none"
              style={{
                color: activeTab === 'analytics' ? CLR.orange : CLR.mutedText,
                backgroundColor: activeTab === 'analytics' ? CLR.card : 'transparent',
              }}
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prematch">
            {renderPreMatch()}
          </TabsContent>

          <TabsContent value="live">
            {renderLiveSim()}
          </TabsContent>

          <TabsContent value="postmatch">
            {renderPostMatch()}
          </TabsContent>

          <TabsContent value="analytics">
            {renderAnalytics()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
