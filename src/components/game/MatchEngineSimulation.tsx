'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Trophy, Clock, Shield, ChevronDown, Play, Pause,
  SkipForward, Star, Zap, Target, BarChart3, Users,
  ArrowLeft, TrendingUp, Activity, Eye
} from 'lucide-react';

// ============================================================
// Types & Interfaces
// ============================================================

type MatchPhase = 'pre_match' | 'first_half' | 'half_time' | 'second_half' | 'full_time' | 'extra_time' | 'penalties';
type Mentality = 'defensive' | 'cautious' | 'balanced' | 'attacking' | 'all_out_attack';
type PlayerRole = 'attacker' | 'support' | 'defensive';
type CompetitionType = 'league' | 'cup' | 'continental' | 'international';

interface CommentaryEvent {
  minute: number;
  icon: string;
  description: string;
  playerName: string;
  type: 'goal' | 'card' | 'substitution' | 'injury' | 'general' | 'var' | 'save' | 'shot';
}

interface TacticalSettings {
  formation: string;
  mentality: Mentality;
  pressHigh: boolean;
  counterAttack: boolean;
  longBalls: boolean;
}

interface PlayerPerfData {
  name: string;
  position: string;
  rating: number;
  goals: number;
  assists: number;
  passes: number;
  tackles: number;
  interceptions: number;
  distanceCovered: number;
  team: 'home' | 'away';
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
  '5-3-2': [
    { pos: 'GK', x: 0.5, y: 0.92 }, { pos: 'LWB', x: 0.08, y: 0.65 }, { pos: 'CB', x: 0.28, y: 0.77 },
    { pos: 'CB', x: 0.5, y: 0.8 }, { pos: 'CB', x: 0.72, y: 0.77 }, { pos: 'RWB', x: 0.92, y: 0.65 },
    { pos: 'CM', x: 0.3, y: 0.48 }, { pos: 'CM', x: 0.5, y: 0.45 }, { pos: 'CM', x: 0.7, y: 0.48 },
    { pos: 'ST', x: 0.38, y: 0.2 }, { pos: 'ST', x: 0.62, y: 0.2 },
  ],
};

const FORMATION_OPTIONS: string[] = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2'];

const MENTALITY_OPTIONS: { value: Mentality; label: string }[] = [
  { value: 'defensive', label: 'Defensive' },
  { value: 'cautious', label: 'Cautious' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'attacking', label: 'Attacking' },
  { value: 'all_out_attack', label: 'All Out Attack' },
];

const PLAYER_NAMES = [
  'James Williams', 'Marcus Silva', 'Oliver Martinez', 'Ethan Brown',
  'Lucas Johnson', 'Daniel Garcia', 'Harry Muller', 'Jack Davis',
  'Mohamed Wilson', 'Rafael Taylor', 'Pedro Anderson', 'Carlos Thomas',
  'Liam Rodriguez', 'Noah Robinson', 'Owen Clark', 'Mason Lewis',
  'Ryan Walker', 'Alex Hall', 'Theo Young', 'Kai King',
  'Ben Wright', 'Sam Lopez', 'Max Hill', 'Leo Scott',
  'Finn Adams', 'Ryan Baker', 'Nelson Carter', 'Joe Phillips',
  'Archie Evans', 'Oscar Turner', 'Logan Parker', 'Elijah Collins',
];

const EVENT_ICONS: Record<CommentaryEvent['type'], string> = {
  goal: '\u26BD',
  card: '\uD83D\uDFE8',
  substitution: '\uD83D\uDD04',
  injury: '\u26A0\uFE0F',
  general: '\uD83D\uDCFA',
  var: '\uD83D\uDCF1',
  save: '\uD83E\uDD11',
  shot: '\uD83C\uDFAF',
};

// ============================================================
// Seeded Random
// ============================================================

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ============================================================
// Commentary Text Generators
// ============================================================

const GOAL_TEXTS: string[] = [
  '{name} finds the back of the net with a superb strike!',
  'GOAL! {name} scores — the crowd erupts!',
  'Clinical finish from {name}! A great goal.',
  '{name} makes no mistake and puts the ball in the corner!',
  'And it is a goal! {name} with a brilliant finish!',
];

const CARD_TEXTS: string[] = [
  'Yellow card for {name}. The referee has had enough.',
  '{name} goes into the book for a reckless challenge.',
  'The referee shows a yellow to {name} for persistent fouling.',
];

const SUB_TEXTS: string[] = [
  '{name} is coming off, replaced by a teammate.',
  'Tactical substitution for the team. {name} leaves the pitch.',
  '{name} makes way for a fresh pair of legs.',
];

const INJURY_TEXTS: string[] = [
  '{name} is down receiving treatment from the medical staff.',
  'Concerns for {name} — looks like a painful knock.',
  'Brief stoppage as {name} gets attention from the physio.',
];

const SAVE_TEXTS: string[] = [
  'What a save by the goalkeeper! Denies {name} with a superb stop!',
  'Brilliant reflex save keeps the ball out!',
  'The keeper is equal to it — fingertip save from {name}\'s attempt!',
];

const SHOT_TEXTS: string[] = [
  '{name} fires wide from distance.',
  'The shot from {name} goes just over the bar.',
  '{name} tries their luck but it drifts wide of the post.',
];

const VAR_TEXTS: string[] = [
  'VAR review in progress. Checking a possible foul in the build-up.',
  'The referee is reviewing the incident at the monitor.',
  'VAR check complete. The original decision stands.',
];

const GENERAL_TEXTS: string[] = [
  'Both teams are settling into the match now.',
  'Good tempo to the game — both sides looking to attack.',
  'The atmosphere inside the stadium is electric tonight.',
  'A well-contested midfield battle developing here.',
  'Patient build-up play as the team looks for an opening.',
  'The home fans are making themselves heard.',
  'Neat passing in midfield but no penetration yet.',
  'The away side are growing into this match.',
];

function getEventText(type: CommentaryEvent['type'], playerName: string): string {
  const pools: Record<CommentaryEvent['type'], string[]> = {
    goal: GOAL_TEXTS,
    card: CARD_TEXTS,
    substitution: SUB_TEXTS,
    injury: INJURY_TEXTS,
    save: SAVE_TEXTS,
    shot: SHOT_TEXTS,
    var: VAR_TEXTS,
    general: GENERAL_TEXTS,
  };
  const templates = pools[type];
  const template = templates[Math.abs(hashStr(playerName + type)) % templates.length];
  return template.replace('{name}', playerName);
}

function hashStr(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return hash;
}

// ============================================================
// Generate Match Data (Deterministic)
// ============================================================

function generateMatchData(seed: number, homeQuality: number, awayQuality: number): {
  events: CommentaryEvent[];
  stats: MatchStats;
  shots: ShotLocation[];
  momentum: MomentumPoint[];
  players: PlayerPerfData[];
} {
  const rng = seededRandom(seed);
  const events: CommentaryEvent[] = [];
  const shots: ShotLocation[] = [];
  const momentum: MomentumPoint[] = [{ minute: 0, value: 0 }];
  const qDiff = homeQuality - awayQuality;

  // Determine total goals
  const homeExpected = Math.max(0.3, 1.4 + qDiff * 0.025);
  const awayExpected = Math.max(0.3, 1.1 - qDiff * 0.025);

  function poisson(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do { k++; p *= rng(); } while (p > L);
    return k - 1;
  }

  const homeGoals = poisson(homeExpected);
  const awayGoals = poisson(awayExpected);
  let hGoals = 0;
  let aGoals = 0;

  // Distribute goals across 90 minutes
  const goalMinutes: { minute: number; team: 'home' | 'away' }[] = [];
  for (let i = 0; i < homeGoals; i++) {
    goalMinutes.push({ minute: Math.floor(rng() * 90) + 1, team: 'home' });
  }
  for (let i = 0; i < awayGoals; i++) {
    goalMinutes.push({ minute: Math.floor(rng() * 90) + 1, team: 'away' });
  }
  goalMinutes.sort((a, b) => a.minute - b.minute);

  // Generate cards
  const yellowCount = Math.floor(rng() * 5) + 1;
  const redCount = rng() < 0.15 ? 1 : 0;
  const cardMinutes: { minute: number; team: 'home' | 'away' }[] = [];
  for (let i = 0; i < yellowCount; i++) {
    cardMinutes.push({ minute: Math.floor(rng() * 88) + 1, team: rng() < 0.55 ? 'home' : 'away' });
  }
  if (redCount > 0) {
    cardMinutes.push({ minute: Math.floor(rng() * 30) + 60, team: rng() < 0.5 ? 'home' : 'away' });
  }
  cardMinutes.sort((a, b) => a.minute - b.minute);

  // Generate substitutions
  const subCount = Math.floor(rng() * 5) + 3;
  const subMinutes: { minute: number; team: 'home' | 'away' }[] = [];
  for (let i = 0; i < subCount; i++) {
    subMinutes.push({ minute: Math.floor(rng() * 30) + 58, team: rng() < 0.5 ? 'home' : 'away' });
  }
  subMinutes.sort((a, b) => a.minute - b.minute);

  // Merge all timed events
  interface TimedEvent {
    minute: number;
    kind: 'goal' | 'card' | 'red' | 'sub' | 'shot' | 'save' | 'injury' | 'var' | 'general';
    team: 'home' | 'away';
  }
  const allTimed: TimedEvent[] = [];

  goalMinutes.forEach(g => allTimed.push({ minute: g.minute, kind: 'goal', team: g.team }));
  cardMinutes.forEach(c => allTimed.push({ minute: c.minute, kind: 'card', team: c.team }));
  subMinutes.forEach(s => allTimed.push({ minute: s.minute, kind: 'sub', team: s.team }));

  // Add shot events (8-15 per team)
  const homeShotsCount = Math.floor(rng() * 8) + 6;
  const awayShotsCount = Math.floor(rng() * 8) + 5;
  for (let i = 0; i < homeShotsCount; i++) {
    const onTarget = rng() < 0.35;
    const existingGoals = goalMinutes.filter(g => g.team === 'home').map(g => g.minute);
    const shotMin = Math.floor(rng() * 90) + 1;
    if (!existingGoals.includes(shotMin)) {
      allTimed.push({ minute: shotMin, kind: onTarget ? 'save' : 'shot', team: 'home' });
    }
  }
  for (let i = 0; i < awayShotsCount; i++) {
    const onTarget = rng() < 0.35;
    const existingGoals = goalMinutes.filter(g => g.team === 'away').map(g => g.minute);
    const shotMin = Math.floor(rng() * 90) + 1;
    if (!existingGoals.includes(shotMin)) {
      allTimed.push({ minute: shotMin, kind: onTarget ? 'save' : 'shot', team: 'away' });
    }
  }

  // Add injuries
  if (rng() < 0.4) {
    allTimed.push({ minute: Math.floor(rng() * 70) + 10, kind: 'injury', team: rng() < 0.5 ? 'home' : 'away' });
  }

  // Add VAR
  if (rng() < 0.3) {
    allTimed.push({ minute: Math.floor(rng() * 40) + 20, kind: 'var', team: rng() < 0.5 ? 'home' : 'away' });
  }

  // Add general commentary at regular intervals
  for (let m = 5; m <= 85; m += 10) {
    allTimed.push({ minute: m, kind: 'general', team: 'home' });
  }

  // Add half-time event
  allTimed.push({ minute: 45, kind: 'general', team: 'home' });

  // Sort by minute
  allTimed.sort((a, b) => a.minute - b.minute);

  // Build commentary events
  for (const te of allTimed) {
    const pName = PLAYER_NAMES[Math.floor(rng() * PLAYER_NAMES.length)];
    const cEvent: CommentaryEvent = {
      minute: te.minute,
      playerName: pName,
      description: '',
      icon: '',
      type: 'general',
    };

    switch (te.kind) {
      case 'goal': {
        const scorer = PLAYER_NAMES[Math.floor(rng() * PLAYER_NAMES.length)];
        cEvent.icon = EVENT_ICONS.goal;
        cEvent.playerName = scorer;
        cEvent.description = getEventText('goal', scorer);
        cEvent.type = 'goal';
        if (te.team === 'home') hGoals++;
        else aGoals++;
        // Add shot location for goal
        shots.push({
          x: 0.3 + rng() * 0.4,
          y: te.team === 'home' ? 0.15 + rng() * 0.15 : 0.75 + rng() * 0.15,
          team: te.team,
          outcome: 'goal',
          minute: te.minute,
        });
        break;
      }
      case 'card': {
        cEvent.icon = '\uD83D\uDFE8';
        cEvent.description = getEventText('card', pName);
        cEvent.type = 'card';
        break;
      }
      case 'red': {
        cEvent.icon = '\uD83D\uDFE5';
        cEvent.description = `Red card for ${pName}! The referee has no choice but to send them off.`;
        cEvent.type = 'card';
        break;
      }
      case 'sub': {
        cEvent.icon = EVENT_ICONS.substitution;
        cEvent.description = getEventText('substitution', pName);
        cEvent.type = 'substitution';
        break;
      }
      case 'shot': {
        cEvent.icon = EVENT_ICONS.shot;
        cEvent.description = getEventText('shot', pName);
        cEvent.type = 'shot';
        shots.push({
          x: 0.1 + rng() * 0.8,
          y: te.team === 'home' ? 0.2 + rng() * 0.3 : 0.5 + rng() * 0.3,
          team: te.team,
          outcome: 'miss',
          minute: te.minute,
        });
        break;
      }
      case 'save': {
        cEvent.icon = EVENT_ICONS.save;
        cEvent.description = getEventText('save', pName);
        cEvent.type = 'save';
        shots.push({
          x: 0.25 + rng() * 0.5,
          y: te.team === 'home' ? 0.15 + rng() * 0.1 : 0.75 + rng() * 0.1,
          team: te.team,
          outcome: 'save',
          minute: te.minute,
        });
        break;
      }
      case 'injury': {
        cEvent.icon = EVENT_ICONS.injury;
        cEvent.description = getEventText('injury', pName);
        cEvent.type = 'injury';
        break;
      }
      case 'var': {
        cEvent.icon = EVENT_ICONS.var;
        cEvent.description = getEventText('var', '');
        cEvent.playerName = '';
        cEvent.type = 'general';
        break;
      }
      case 'general': {
        if (te.minute === 45) {
          cEvent.icon = '\u23F8\uFE0F';
          cEvent.description = 'The referee blows for half-time. An intriguing first half comes to a close.';
          cEvent.playerName = '';
        } else {
          cEvent.icon = EVENT_ICONS.general;
          cEvent.description = GENERAL_TEXTS[Math.floor(rng() * GENERAL_TEXTS.length)];
          cEvent.playerName = '';
        }
        cEvent.type = 'general';
        break;
      }
    }
    events.push(cEvent);
  }

  // Generate momentum data (every 3 minutes)
  let momentumValue = 0;
  for (let m = 3; m <= 90; m += 3) {
    const drift = (rng() - 0.5) * 15 + qDiff * 0.08;
    momentumValue = Math.max(-50, Math.min(50, momentumValue + drift));
    // Goal boosts
    const goalAtMin = goalMinutes.find(g => g.minute >= m - 3 && g.minute <= m);
    if (goalAtMin) {
      momentumValue += goalAtMin.team === 'home' ? 15 : -15;
      momentumValue = Math.max(-50, Math.min(50, momentumValue));
    }
    momentum.push({ minute: m, value: momentumValue });
  }

  // Generate stats
  const hPoss = Math.round(50 + qDiff * 0.4 + (rng() - 0.5) * 10);
  const hPasses = Math.floor(350 + homeQuality * 4 + rng() * 50);
  const aPasses = Math.floor(320 + awayQuality * 4 + rng() * 50);

  const stats: MatchStats = {
    homePossession: Math.max(30, Math.min(70, hPoss)),
    awayPossession: 0,
    homeShots: homeShotsCount + homeGoals,
    awayShots: awayShotsCount + awayGoals,
    homeShotsOnTarget: Math.floor((homeShotsCount + homeGoals) * 0.4),
    awayShotsOnTarget: Math.floor((awayShotsCount + awayGoals) * 0.38),
    homePasses: hPasses,
    awayPasses: aPasses,
    homePassAccuracy: Math.floor(75 + rng() * 15),
    awayPassAccuracy: Math.floor(72 + rng() * 15),
    homeCorners: Math.floor(rng() * 5) + 2,
    awayCorners: Math.floor(rng() * 5) + 1,
    homeFouls: Math.floor(rng() * 6) + 5,
    awayFouls: Math.floor(rng() * 6) + 4,
    homeYellowCards: yellowCount,
    awayYellowCards: 0,
    homeRedCards: redCount > 0 && cardMinutes[cardMinutes.length - 1]?.team === 'home' ? 1 : 0,
    awayRedCards: 0,
    homeOffsides: Math.floor(rng() * 4),
    awayOffsides: Math.floor(rng() * 3),
    homeTackles: Math.floor(rng() * 12) + 10,
    awayTackles: Math.floor(rng() * 12) + 9,
  };
  stats.awayPossession = 100 - stats.homePossession;
  stats.awayYellowCards = yellowCount - Math.floor(yellowCount * (0.55 + rng() * 0.1));
  stats.awayRedCards = redCount - stats.homeRedCards;

  // Generate player performances
  const players: PlayerPerfData[] = [];
  const positions = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'RW', 'ST'];
  for (let i = 0; i < 11; i++) {
    const isHome = i < 6;
    players.push({
      name: PLAYER_NAMES[i],
      position: positions[i],
      rating: parseFloat((5.5 + rng() * 3 + (rng() < 0.15 ? 1 : 0)).toFixed(1)),
      goals: 0,
      assists: 0,
      passes: Math.floor(rng() * 40) + 15,
      tackles: Math.floor(rng() * 6),
      interceptions: Math.floor(rng() * 4),
      distanceCovered: parseFloat((rng() * 5 + 7).toFixed(1)),
      team: isHome ? 'home' : 'away',
    });
  }
  // Update goal scorers
  players.sort((a, b) => b.rating - a.rating);
  for (const ge of events.filter(e => e.type === 'goal')) {
    const scorer = players.find(p => p.name === ge.playerName);
    if (scorer) {
      scorer.goals++;
      scorer.rating = Math.min(10, scorer.rating + 0.8);
    }
  }

  return { events, stats, shots, momentum, players };
}

// ============================================================
// SVG Sub-Components
// ============================================================

function MiniPitchSVG({ formation }: { formation: string }) {
  const positions = FORMATIONS[formation] || FORMATIONS['4-3-3'];
  const w = 200;
  const h = 150;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '150px' }}>
      <rect x="0" y="0" width={w} height={h} fill="#0d1117" rx="4" />
      <rect x="0" y="0" width={w} height={h} fill="none" stroke="#21262d" strokeWidth="1" rx="4" />
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#21262d" strokeWidth="0.5" />
      <circle cx={w / 2} cy={h / 2} r="15" fill="none" stroke="#21262d" strokeWidth="0.5" />
      <rect x="50" y="0" width={w - 100} height="25" fill="none" stroke="#21262d" strokeWidth="0.5" rx="2" />
      <rect x="65" y="0" width={w - 130} height="12" fill="none" stroke="#21262d" strokeWidth="0.4" rx="1" />
      <rect x="50" y={h - 25} width={w - 100} height="25" fill="none" stroke="#21262d" strokeWidth="0.5" rx="2" />
      <rect x="65" y={h - 12} width={w - 130} height="12" fill="none" stroke="#21262d" strokeWidth="0.4" rx="1" />
      {positions.map((p, i) => (
        <g key={i}>
          <circle cx={p.x * w} cy={p.y * h} r="4" fill="#34d399" opacity="0.8" />
          <text x={p.x * w} y={p.y * h + 10} textAnchor="middle" fill="#8b949e" fontSize="6" fontFamily="monospace">{p.pos}</text>
        </g>
      ))}
    </svg>
  );
}

function PassAccuracyDonut({ accuracy, color, label }: { accuracy: number; color: string; label: string }) {
  const size = 80;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (accuracy / 100) * circumference;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-16 h-16">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#21262d" strokeWidth="5" />
      <circle
        cx={cx} cy={cy} r={radius} fill="none" stroke={color}
        strokeWidth="5" strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round" opacity="0.8"
      />
      <text x={cx} y={cy - 2} textAnchor="middle" fill="#c9d1d9" fontSize="14" fontFamily="monospace" fontWeight="bold">
        {accuracy}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="6" fontFamily="monospace">
        {label}
      </text>
    </svg>
  );
}

function ShotMapSVG({ shots }: { shots: ShotLocation[] }) {
  const w = 220;
  const h = 140;

  const outcomeColor: Record<string, string> = {
    goal: '#34d399',
    save: '#f59e0b',
    miss: '#ef4444',
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '140px' }}>
      <rect x="0" y="0" width={w} height={h} fill="#0d1117" rx="4" />
      <rect x="0" y="0" width={w} height={h} fill="none" stroke="#21262d" strokeWidth="0.8" rx="4" />
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#21262d" strokeWidth="0.4" />
      <circle cx={w / 2} cy={h / 2} r="12" fill="none" stroke="#21262d" strokeWidth="0.4" />
      {/* Home goal (top) */}
      <rect x="70" y="0" width={w - 140} height="18" fill="none" stroke="#34d399" strokeWidth="0.4" rx="1" />
      {/* Away goal (bottom) */}
      <rect x="70" y={h - 18} width={w - 140} height="18" fill="none" stroke="#ef4444" strokeWidth="0.4" rx="1" />
      <text x="10" y={h / 2 - 3} fill="#8b949e" fontSize="5" fontFamily="monospace">HOME</text>
      <text x="10" y={h / 2 + 6} fill="#8b949e" fontSize="5" fontFamily="monospace">AWAY</text>
      {shots.map((s, i) => (
        <g key={`shot-${i}`}>
          <circle cx={s.x * w} cy={s.y * h} r={s.outcome === 'goal' ? 5 : 3} fill={outcomeColor[s.outcome]} opacity="0.8" />
          {s.outcome === 'goal' && (
            <circle cx={s.x * w} cy={s.y * h} r="8" fill="none" stroke={outcomeColor.goal} strokeWidth="0.6" opacity="0.4" />
          )}
        </g>
      ))}
      {/* Legend */}
      <circle cx={w - 55} cy="10" r="3" fill={outcomeColor.goal} />
      <text x={w - 48} y="13" fill="#8b949e" fontSize="5" fontFamily="monospace">Goal</text>
      <circle cx={w - 55} cy="20" r="3" fill={outcomeColor.save} />
      <text x={w - 48} y="23" fill="#8b949e" fontSize="5" fontFamily="monospace">Save</text>
      <circle cx={w - 55} cy="30" r="3" fill={outcomeColor.miss} />
      <text x={w - 48} y="33" fill="#8b949e" fontSize="5" fontFamily="monospace">Miss</text>
    </svg>
  );
}

function HeatMapSVG({ coverage }: { coverage: number[][] }) {
  const w = 120;
  const h = 80;
  const cols = 6;
  const rows = 4;
  const cellW = w / cols;
  const cellH = h / rows;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '80px' }}>
      {coverage.map((row, r) =>
        row.map((val, c) => {
          const opacity = Math.max(0.1, Math.min(1, val / 10));
          return (
            <rect
              key={`hm-${r}-${c}`}
              x={c * cellW} y={r * cellH} width={cellW} height={cellH}
              fill="#34d399" opacity={opacity} rx="2"
            />
          );
        })
      )}
    </svg>
  );
}

function SparklineSVG({ data, color }: { data: number[]; color: string }) {
  const w = 120;
  const h = 30;
  const padX = 4;
  const padY = 4;
  const trackW = w - padX * 2;
  const trackH = h - padY * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * trackW,
    y: padY + trackH - ((v - min) / range) * trackH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '30px' }}>
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} opacity="0.6" />
      ))}
    </svg>
  );
}

function MomentumTimelineSVG({ momentum, events }: { momentum: MomentumPoint[]; events: CommentaryEvent[] }) {
  const w = 340;
  const h = 80;
  const padX = 15;
  const padY = 10;
  const trackW = w - padX * 2;
  const trackH = h - padY * 2;
  const midY = padY + trackH / 2;

  const points = momentum.map((d, i) => ({
    x: padX + (d.minute / 90) * trackW,
    y: midY - (d.value / 50) * (trackH / 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${midY} L${points[0].x},${midY} Z`;

  const goalEvents = events.filter(e => e.type === 'goal');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '80px' }}>
      <rect x="0" y="0" width={w} height={h} rx="6" fill="#0d1117" />
      {/* Center line */}
      <line x1={padX} y1={midY} x2={padX + trackW} y2={midY} stroke="#21262d" strokeWidth="0.5" strokeDasharray="2,2" />
      {/* Half-time marker */}
      <line x1={padX + trackW / 2} y1={padY} x2={padX + trackW / 2} y2={padY + trackH} stroke="#30363d" strokeWidth="0.6" strokeDasharray="3,2" />
      <text x={padX + trackW / 2} y={h - 1} textAnchor="middle" fill="#484f58" fontSize="5" fontFamily="monospace">HT</text>
      {/* Area fill */}
      <path d={areaPath} fill="#34d399" opacity="0.1" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#34d399" strokeWidth="1.2" opacity="0.7" />
      {/* Goal markers */}
      {goalEvents.map((ge, i) => {
        const gx = padX + (ge.minute / 90) * trackW;
        return (
          <g key={`goal-marker-${i}`}>
            <line x1={gx} y1={padY} x2={gx} y2={padY + trackH} stroke="#34d399" strokeWidth="0.8" opacity="0.5" />
            <text x={gx} y={padY - 2} textAnchor="middle" fill="#34d399" fontSize="6" fontFamily="monospace">{ge.minute}&apos;</text>
          </g>
        );
      })}
      {/* Minute labels */}
      <text x={padX} y={h - 1} fill="#484f58" fontSize="5" fontFamily="monospace">0&apos;</text>
      <text x={padX + trackW} y={h - 1} textAnchor="end" fill="#484f58" fontSize="5" fontFamily="monospace">90&apos;</text>
      {/* Team labels */}
      <text x={padX + 1} y={padY + 5} fill="#34d399" fontSize="4.5" fontFamily="monospace" opacity="0.5">HOME</text>
      <text x={padX + 1} y={padY + trackH - 1} fill="#ef4444" fontSize="4.5" fontFamily="monospace" opacity="0.5">AWAY</text>
    </svg>
  );
}

// ============================================================
// Stat Comparison Bar Component
// ============================================================

function StatComparisonBar({ homeVal, awayVal, label, isPercentage }: { homeVal: number; awayVal: number; label: string; isPercentage?: boolean }) {
  const total = homeVal + awayVal;
  const homePct = total > 0 ? (homeVal / total) * 100 : 50;
  const homeDisplay = isPercentage ? `${homeVal}%` : String(homeVal);
  const awayDisplay = isPercentage ? `${awayVal}%` : String(awayVal);

  return (
    <div className="flex items-center gap-2 text-xs py-1">
      <span className="w-10 text-right font-mono font-bold text-[#c9d1d9]">{homeDisplay}</span>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="flex h-2 rounded-sm overflow-hidden bg-[#21262d]">
          <div className="bg-[#34d399] rounded-l-sm transition-all duration-500" style={{ width: `${homePct}%`, opacity: 0.8 }} />
          <div className="bg-[#ef4444] rounded-r-sm transition-all duration-500" style={{ width: `${100 - homePct}%`, opacity: 0.8 }} />
        </div>
        <span className="text-[8px] text-[#8b949e] text-center font-medium uppercase tracking-wider">{label}</span>
      </div>
      <span className="w-10 text-left font-mono font-bold text-[#c9d1d9]">{awayDisplay}</span>
    </div>
  );
}

// ============================================================
// Rating Stars Component
// ============================================================

function RatingStars({ rating }: { rating: number }) {
  const stars = 5;
  const filled = Math.round(rating / 2);
  const starEls: React.ReactNode[] = [];
  for (let i = 0; i < stars; i++) {
    starEls.push(
      <Star
        key={i}
        className={`h-4 w-4 ${i < filled ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}`}
      />
    );
  }
  return <div className="flex gap-0.5">{starEls}</div>;
}

// ============================================================
// Main Component
// ============================================================

export default function MatchEngineSimulation() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  // Local UI state
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [phase, setPhase] = useState<MatchPhase>('pre_match');
  const [tactics, setTactics] = useState<TacticalSettings>({
    formation: '4-3-3',
    mentality: 'balanced',
    pressHigh: false,
    counterAttack: false,
    longBalls: false,
  });
  const [selectedPlayerIdx, setSelectedPlayerIdx] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState('commentary');

  // Derive seed from game state
  const seed = useMemo(() => {
    if (!gameState) return 42;
    return (gameState.player.overall * 137 + gameState.currentClub.quality * 53 + gameState.currentWeek * 7 + gameState.currentSeason * 31) | 0;
  }, [gameState]);

  // Generate all match data deterministically
  const matchData = useMemo(() => {
    if (!gameState) return null;
    const hQ = gameState.currentClub.quality;
    const aQ = Math.max(30, hQ + Math.floor((seed % 20) - 10));
    return generateMatchData(seed, hQ, aQ);
  }, [gameState, seed]);

  // Match scores
  const homeScore = useMemo(() => {
    if (!matchData) return 0;
    return matchData.events.filter(e => e.type === 'goal').length;
  }, [matchData]);

  const scores = useMemo(() => {
    if (!matchData) return { home: 0, away: 0 };
    let h = 0;
    let a = 0;
    for (const ev of matchData.events) {
      if (ev.type === 'goal') {
        const goalIdx = matchData.events.indexOf(ev);
        const goalMinute = ev.minute;
        // Alternate goals between home and away based on event order
        if (goalIdx % 2 === 0) h++;
        else a++;
      }
    }
    return { home: h, away: a };
  }, [matchData]);

  // Visible commentary based on current minute
  const visibleEvents = useMemo(() => {
    if (!matchData) return [];
    if (phase === 'pre_match') return [];
    return matchData.events.filter(e => e.minute <= currentMinute);
  }, [matchData, currentMinute, phase]);

  // Simulate match timer
  useEffect(() => {
    if (!isSimulating || currentMinute >= 90) {
      if (currentMinute >= 90) {
        setIsSimulating(false);
        setPhase('full_time');
      }
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
          return 90;
        }
        return next;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isSimulating, currentMinute, phase]);

  // Resume from half time after 2 seconds
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

  const handleTacticalChange = useCallback(() => {
    setShowConfirmation(false);
    // In a real game, this would send tactical changes to the match engine
  }, []);

  const handleContinue = useCallback(() => setScreen('dashboard'), [setScreen]);

  // Generate player heat map coverage
  const playerHeatMap = useMemo(() => {
    const coverage: number[][] = [];
    for (let r = 0; r < 4; r++) {
      const row: number[] = [];
      for (let c = 0; c < 6; c++) {
        row.push(Math.floor(Math.random() * 8) + 1);
      }
      coverage.push(row);
    }
    return coverage;
  }, []);

  // Player rating segments (15-min intervals)
  const ratingTimeline = useMemo(() => {
    return [6.2, 6.8, 7.1, 7.5, 8.0, 7.8];
  }, []);

  // Top 5 players from both teams
  const topPlayers = useMemo(() => {
    if (!matchData) return [];
    return [...matchData.players].sort((a, b) => b.rating - a.rating).slice(0, 10);
  }, [matchData]);

  // MOTM
  const motm = useMemo(() => {
    if (topPlayers.length === 0) return null;
    return topPlayers[0];
  }, [topPlayers]);

  // Competition badge
  const competition: CompetitionType = useMemo(() => {
    const idx = Math.abs(seed % 4);
    const types: CompetitionType[] = ['league', 'cup', 'continental', 'international'];
    return types[idx];
  }, [seed]);

  const competitionLabel: Record<CompetitionType, string> = {
    league: 'League',
    cup: 'Cup',
    continental: 'Continental',
    international: 'International',
  };

  const competitionIcon: Record<CompetitionType, string> = {
    league: '\uD83D\uDCDF',
    cup: '\uD83C\uDFC6',
    continental: '\uD83C\uDF0E',
    international: '\uD83C\uDFDB\uFE0F',
  };

  const phaseLabel: Record<MatchPhase, string> = {
    pre_match: 'Pre-Match',
    first_half: '1st Half',
    half_time: 'Half Time',
    second_half: '2nd Half',
    full_time: 'Full Time',
    extra_time: 'Extra Time',
    penalties: 'Penalties',
  };

  // Guard: no game state
  if (!gameState || !matchData) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8b949e] text-sm">No active career found.</p>
          <button
            onClick={() => setScreen('main_menu')}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-500 transition-colors"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  const homeClub = gameState.currentClub;
  const awayClubName = `FC ${['United', 'City', 'Wanderers', 'Rovers', 'Athletic', 'Dynamo', 'Rangers', 'Town'][Math.abs(seed % 8)]}`;

  // ============================================================
  // Render: Match Header Bar
  // ============================================================
  const renderMatchHeader = () => (
    <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3">
      {/* Competition badge */}
      <div className="flex items-center justify-center mb-2">
        <Badge className="bg-[#21262d] text-[#8b949e] border-[#30363d] text-[10px] px-2 py-0.5">
          {competitionIcon[competition]} {competitionLabel[competition]}
        </Badge>
        <Badge className="bg-[#21262d] text-[#8b949e] border-[#30363d] text-[10px] px-2 py-0.5 ml-1.5">
          {phaseLabel[phase]}
        </Badge>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between">
        {/* Home team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl">{homeClub.logo}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#c9d1d9] truncate">{homeClub.shortName || homeClub.name}</p>
            <p className="text-[10px] text-[#8b949e]">Home</p>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 px-4">
          <motion.span
            key={`home-${scores.home}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-black text-[#c9d1d9] tabular-nums"
          >
            {phase === 'pre_match' ? '-' : scores.home}
          </motion.span>
          <span className="text-lg text-[#484f58] font-bold">:</span>
          <motion.span
            key={`away-${scores.away}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-black text-[#c9d1d9] tabular-nums"
          >
            {phase === 'pre_match' ? '-' : scores.away}
          </motion.span>
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
          <span className="text-xl">{'\uD83D\uDEE1\uFE0F'}</span>
          <div className="min-w-0 text-right">
            <p className="text-sm font-bold text-[#c9d1d9] truncate">{awayClubName}</p>
            <p className="text-[10px] text-[#8b949e]">Away</p>
          </div>
        </div>
      </div>

      {/* Match clock & controls */}
      <div className="flex items-center justify-center gap-3 mt-2">
        {phase !== 'pre_match' && phase !== 'full_time' ? (
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="text-lg font-mono font-bold text-emerald-400">{currentMinute}&apos;</span>
            <button
              onClick={handlePauseResume}
              className="p-1.5 bg-[#21262d] rounded-lg hover:bg-[#30363d] transition-colors border border-[#30363d]"
            >
              {isSimulating ? <Pause className="h-4 w-4 text-[#c9d1d9]" /> : <Play className="h-4 w-4 text-[#c9d1d9]" />}
            </button>
            <button
              onClick={handleSkipToEnd}
              className="p-1.5 bg-[#21262d] rounded-lg hover:bg-[#30363d] transition-colors border border-[#30363d]"
            >
              <SkipForward className="h-4 w-4 text-[#c9d1d9]" />
            </button>
          </div>
        ) : phase === 'pre_match' ? (
          <button
            onClick={handleStartMatch}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-colors"
          >
            <Play className="h-4 w-4" />
            Kick Off
          </button>
        ) : null}
      </div>
    </div>
  );

  // ============================================================
  // Render: Live Commentary Feed
  // ============================================================
  const renderCommentaryFeed = () => {
    const typeColorMap: Record<CommentaryEvent['type'], string> = {
      goal: 'border-l-emerald-400 bg-emerald-500/5',
      card: 'border-l-amber-400 bg-amber-500/5',
      substitution: 'border-l-sky-400 bg-sky-500/5',
      injury: 'border-l-orange-400 bg-orange-500/5',
      general: 'border-l-[#30363d] bg-[#0d1117]',
      var: 'border-l-purple-400 bg-purple-500/5',
      save: 'border-l-amber-400 bg-amber-500/5',
      shot: 'border-l-[#30363d] bg-[#0d1117]',
    };

    const iconColorMap: Record<CommentaryEvent['type'], string> = {
      goal: 'text-emerald-400',
      card: 'text-amber-400',
      substitution: 'text-sky-400',
      injury: 'text-orange-400',
      general: 'text-[#8b949e]',
      var: 'text-purple-400',
      save: 'text-amber-400',
      shot: 'text-[#8b949e]',
    };

    return (
      <div className="flex flex-col gap-1.5 p-3">
        {visibleEvents.length === 0 ? (
          <div className="text-center py-8 text-[#484f58]">
            <Eye className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Match commentary will appear here</p>
          </div>
        ) : (
          visibleEvents.map((ev, i) => (
            <motion.div
              key={`comm-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`border-l-2 ${typeColorMap[ev.type]} rounded-r-lg px-3 py-2`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm shrink-0 mt-0.5">{ev.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
                      {ev.minute}&apos;
                    </span>
                    {ev.playerName && (
                      <span className={`text-[11px] font-bold ${iconColorMap[ev.type]}`}>
                        {ev.playerName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#c9d1d9] mt-0.5 leading-relaxed">{ev.description}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    );
  };

  // ============================================================
  // Render: Tactical Adjustment Panel
  // ============================================================
  const renderTacticalPanel = () => (
    <div className="p-3 space-y-3">
      {/* Formation selector */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
        <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2 block">
          Formation
        </label>
        <div className="relative">
          <select
            value={tactics.formation}
            onChange={(e) => setTactics(prev => ({ ...prev, formation: e.target.value }))}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#c9d1d9] appearance-none focus:outline-none focus:border-emerald-500/50"
          >
            {FORMATION_OPTIONS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e] pointer-events-none" />
        </div>
      </div>

      {/* Mentality */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
        <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2 block">
          Mentality
        </label>
        <div className="flex gap-1">
          {MENTALITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTactics(prev => ({ ...prev, mentality: opt.value }))}
              className={`flex-1 px-1.5 py-2 text-[9px] font-bold rounded-lg border transition-colors ${
                tactics.mentality === opt.value
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-[#484f58]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tactical toggles */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
        <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2 block">
          Instructions
        </label>
        <div className="space-y-2">
          {([
            { key: 'pressHigh' as const, label: 'Press High', icon: <Target className="h-3.5 w-3.5" /> },
            { key: 'counterAttack' as const, label: 'Counter Attack', icon: <Zap className="h-3.5 w-3.5" /> },
            { key: 'longBalls' as const, label: 'Long Balls', icon: <Activity className="h-3.5 w-3.5" /> },
          ]).map(item => (
            <button
              key={item.key}
              onClick={() => setTactics(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                tactics[item.key]
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-[#484f58]'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <div className={`w-8 h-4 rounded-lg flex items-center transition-colors ${
                tactics[item.key] ? 'bg-emerald-500 justify-end' : 'bg-[#30363d] justify-start'
              }`}>
                <div className="w-3 h-3 rounded-md bg-white mx-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Player role change */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
        <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2 block">
          Player Role
        </label>
        <div className="flex gap-1.5">
          {(['attacker', 'support', 'defensive'] as PlayerRole[]).map(role => (
            <button
              key={role}
              onClick={() => {}}
              className="flex-1 px-2 py-1.5 text-[10px] font-bold rounded-lg border bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:border-[#484f58] transition-colors capitalize"
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Mini formation pitch */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
        <MiniPitchSVG formation={tactics.formation} />
      </div>

      {/* Make change button */}
      {phase !== 'full_time' && phase !== 'pre_match' && (
        <div>
          {showConfirmation ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex gap-2">
              <button
                onClick={handleTacticalChange}
                className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 text-xs font-bold bg-[#21262d] text-[#8b949e] rounded-lg hover:bg-[#30363d] transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmation(true)}
              className="w-full py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors"
            >
              Make Change
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ============================================================
  // Render: Match Statistics Panel
  // ============================================================
  const renderStatsPanel = () => {
    const stats = matchData.stats;
    return (
      <div className="p-3 space-y-4">
        {/* Stat bars */}
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3 space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Home</span>
            <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider">Statistics</span>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Away</span>
          </div>

          <StatComparisonBar homeVal={stats.homePossession} awayVal={stats.awayPossession} label="Possession" isPercentage />
          <StatComparisonBar homeVal={stats.homeShots} awayVal={stats.awayShots} label="Shots" />
          <StatComparisonBar homeVal={stats.homeShotsOnTarget} awayVal={stats.awayShotsOnTarget} label="On Target" />
          <StatComparisonBar homeVal={stats.homePasses} awayVal={stats.awayPasses} label="Passes" />
          <StatComparisonBar homeVal={stats.homePassAccuracy} awayVal={stats.awayPassAccuracy} label="Pass Acc." isPercentage />
          <StatComparisonBar homeVal={stats.homeCorners} awayVal={stats.awayCorners} label="Corners" />
          <StatComparisonBar homeVal={stats.homeFouls} awayVal={stats.awayFouls} label="Fouls" />
          <StatComparisonBar homeVal={stats.homeYellowCards} awayVal={stats.awayYellowCards} label="Yellow Cards" />
          <StatComparisonBar homeVal={stats.homeRedCards} awayVal={stats.awayRedCards} label="Red Cards" />
          <StatComparisonBar homeVal={stats.homeOffsides} awayVal={stats.awayOffsides} label="Offsides" />
          <StatComparisonBar homeVal={stats.homeTackles} awayVal={stats.awayTackles} label="Tackles" />
        </div>

        {/* Pass Accuracy Donuts */}
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
          <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-3">Pass Accuracy</p>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <PassAccuracyDonut accuracy={stats.homePassAccuracy} color="#34d399" label="HOME" />
              <p className="text-[10px] text-emerald-400 mt-1 font-bold">{stats.homePasses} passes</p>
            </div>
            <div className="text-center">
              <PassAccuracyDonut accuracy={stats.awayPassAccuracy} color="#ef4444" label="AWAY" />
              <p className="text-[10px] text-red-400 mt-1 font-bold">{stats.awayPasses} passes</p>
            </div>
          </div>
        </div>

        {/* Shot Map */}
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
          <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">Shot Map</p>
          <ShotMapSVG shots={matchData.shots} />
        </div>
      </div>
    );
  };

  // ============================================================
  // Render: Player Performance Cards
  // ============================================================
  const renderPlayerPerformance = () => (
    <div className="p-3">
      <Tabs defaultValue="your" className="w-full">
        <TabsList className="bg-[#161b22] border border-[#30363d] w-full rounded-lg h-9">
          <TabsTrigger value="your" className="text-[10px] font-bold rounded-md h-7 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Your Performance
          </TabsTrigger>
          <TabsTrigger value="key" className="text-[10px] font-bold rounded-md h-7 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Key Players
          </TabsTrigger>
          <TabsTrigger value="squad" className="text-[10px] font-bold rounded-md h-7 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400">
            Full Squad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="your" className="mt-3 space-y-3">
          {/* Rating display */}
          <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4 text-center">
            <p className="text-4xl font-black text-emerald-400 tabular-nums">7.8</p>
            <div className="flex justify-center mt-2">
              <RatingStars rating={7.8} />
            </div>
            <p className="text-xs text-[#8b949e] mt-1">{gameState.player.name}</p>
            <p className="text-[10px] text-[#484f58]">{gameState.player.position}</p>
          </div>

          {/* Key stats grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Goals', value: '1', icon: '\u26BD' },
              { label: 'Assists', value: '0', icon: '\uD83E\uDDEA' },
              { label: 'Passes', value: '42', icon: '\uD83E\uDDEA' },
              { label: 'Tackles', value: '3', icon: '\uD83D\uDEE1\uFE0F' },
              { label: 'Interceptions', value: '2', icon: '\uD83D\uDC41\uFE0F' },
              { label: 'Distance', value: '9.8km', icon: '\uD83D\uDEB6' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#161b22] rounded-lg border border-[#30363d] p-2 text-center">
                <span className="text-lg">{stat.icon}</span>
                <p className="text-sm font-bold text-[#c9d1d9] mt-0.5">{stat.value}</p>
                <p className="text-[8px] text-[#8b949e] uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Heat Map */}
          <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
            <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">Position Coverage</p>
            <HeatMapSVG coverage={playerHeatMap} />
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-[#484f58]">Less</span>
              <span className="text-[8px] text-[#484f58]">More</span>
            </div>
          </div>

          {/* Rating Timeline */}
          <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
            <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">Rating Timeline</p>
            <SparklineSVG data={ratingTimeline} color="#34d399" />
            <div className="flex justify-between mt-1">
              <span className="text-[8px] text-[#484f58]">0&apos;</span>
              <span className="text-[8px] text-[#484f58]">15&apos;</span>
              <span className="text-[8px] text-[#484f58]">30&apos;</span>
              <span className="text-[8px] text-[#484f58]">45&apos;</span>
              <span className="text-[8px] text-[#484f58]">60&apos;</span>
              <span className="text-[8px] text-[#484f58]">75&apos;</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="key" className="mt-3 space-y-1.5">
          {topPlayers.map((p, i) => {
            const ratingColor = p.rating >= 8
              ? 'text-emerald-400 bg-emerald-500/15'
              : p.rating >= 7
                ? 'text-sky-400 bg-sky-500/15'
                : p.rating >= 6
                  ? 'text-[#c9d1d9] bg-[#21262d]'
                  : 'text-orange-400 bg-orange-500/15';
            const teamColor = p.team === 'home' ? 'text-emerald-400' : 'text-red-400';
            return (
              <div key={i} className="bg-[#161b22] rounded-lg border border-[#30363d] p-2.5 flex items-center gap-2.5">
                <span className="text-sm font-bold text-[#484f58] w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#c9d1d9] truncate">{p.name}</p>
                  <div className="flex items-center gap-2 text-[9px] text-[#8b949e]">
                    <span className={teamColor}>{p.team.toUpperCase()}</span>
                    <span>{p.position}</span>
                    {p.goals > 0 && <span className="text-emerald-400">{'\u26BD'} {p.goals}</span>}
                    {p.assists > 0 && <span className="text-sky-400">{p.assists} ast</span>}
                  </div>
                </div>
                <div className={`rounded-lg px-2 py-1 ${ratingColor}`}>
                  <span className="text-xs font-black">{p.rating.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="squad" className="mt-3">
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {matchData.players.map((p, i) => {
              const ratingColor = p.rating >= 8
                ? 'text-emerald-400 bg-emerald-500/15'
                : p.rating >= 7
                  ? 'text-sky-400 bg-sky-500/15'
                  : p.rating >= 6
                    ? 'text-[#c9d1d9] bg-[#21262d]'
                    : 'text-orange-400 bg-orange-500/15';
              return (
                <div key={i} className="bg-[#161b22] rounded-lg border border-[#30363d] p-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#21262d] flex items-center justify-center text-[9px] font-bold text-[#8b949e]">
                    {p.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#c9d1d9] truncate">{p.name}</p>
                  </div>
                  <div className={`rounded-md px-1.5 py-0.5 ${ratingColor}`}>
                    <span className="text-[10px] font-black">{p.rating.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // ============================================================
  // Render: Match Timeline Visualization
  // ============================================================
  const renderMatchTimeline = () => (
    <div className="p-3 space-y-3">
      {/* Momentum area chart */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
        <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">Momentum</p>
        <MomentumTimelineSVG momentum={matchData.momentum} events={matchData.events} />
      </div>

      {/* Horizontal 90-minute timeline with event markers */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
        <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-3">Match Timeline</p>
        <svg viewBox="0 0 340 100" className="w-full" style={{ height: '100px' }}>
          {/* Timeline track */}
          <line x1="15" y1="50" x2="325" y2="50" stroke="#21262d" strokeWidth="2" strokeLinecap="round" />
          {/* Progress fill */}
          <line x1="15" y1="50" x2={15 + (currentMinute / 90) * 310} y2="50" stroke="#34d399" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          {/* Half-time divider */}
          <line x1={15 + 155} y1="35" x2={15 + 155} y2="65" stroke="#484f58" strokeWidth="1" strokeDasharray="3,2" />
          {/* Minute markers */}
          {[0, 15, 30, 45, 60, 75, 90].map(min => {
            const x = 15 + (min / 90) * 310;
            return (
              <g key={`min-${min}`}>
                <line x1={x} y1="47" x2={x} y2="53" stroke="#484f58" strokeWidth="0.5" />
                <text x={x} y="68" textAnchor="middle" fill="#484f58" fontSize="5" fontFamily="monospace">{min}&apos;</text>
              </g>
            );
          })}
          {/* Event markers */}
          {matchData.events.map((ev, i) => {
            if (ev.type === 'general') return null;
            const x = 15 + (ev.minute / 90) * 310;
            const isGoal = ev.type === 'goal';
            const color = ev.type === 'goal' ? '#34d399'
              : ev.type === 'card' ? '#f59e0b'
                : ev.type === 'substitution' ? '#3b82f6'
                  : '#8b949e';
            const yOffset = ev.type === 'goal' ? -12 : (i % 2 === 0 ? -8 : 8);
            return (
              <g key={`tl-${i}`}>
                <line x1={x} y1="50" x2={x} y2={50 + yOffset} stroke={color} strokeWidth="0.5" opacity="0.4" />
                <circle cx={x} cy={50 + yOffset} r={isGoal ? 4 : 2.5} fill={color} opacity="0.9" />
                {isGoal && (
                  <circle cx={x} cy={50 + yOffset} r="6" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
                )}
              </g>
            );
          })}
          {/* Current position indicator */}
          {phase !== 'pre_match' && phase !== 'full_time' && (
            <circle cx={15 + (currentMinute / 90) * 310} cy="50" r="3" fill="white" opacity="0.9" />
          )}
        </svg>
      </div>

      {/* Goal summary */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
        <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">Goal Summary</p>
        {matchData.events.filter(e => e.type === 'goal').map((ge, i) => (
          <div key={`gs-${i}`} className="flex items-center gap-2 py-1.5 border-b border-[#21262d] last:border-0">
            <span className="text-[10px] font-mono font-bold text-[#8b949e] w-8">{ge.minute}&apos;</span>
            <span className="text-sm">{'\u26BD'}</span>
            <span className="text-xs text-[#c9d1d9] font-medium">{ge.playerName}</span>
            <Badge className={`ml-auto text-[9px] px-1.5 py-0 ${i % 2 === 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'} border`} variant="outline">
              {i % 2 === 0 ? 'HOME' : 'AWAY'}
            </Badge>
          </div>
        ))}
        {matchData.events.filter(e => e.type === 'goal').length === 0 && (
          <p className="text-xs text-[#484f58] text-center py-2">No goals in this match</p>
        )}
      </div>
    </div>
  );

  // ============================================================
  // Render: Post-Match Summary
  // ============================================================
  const renderPostMatchSummary = () => {
    if (phase !== 'full_time') return null;

    const resultText = scores.home > scores.away
      ? 'Home Win'
      : scores.home < scores.away
        ? 'Away Win'
        : 'Draw';

    const resultColor = scores.home > scores.away
      ? 'text-emerald-400'
      : scores.home < scores.away
        ? 'text-red-400'
        : 'text-amber-400';

    const managerQuotes: string[] = [
      "We gave it everything today. The lads showed real character and determination.",
      "I'm proud of the performance. We created chances and deserved the result.",
      "It wasn't our best day but we battled hard and got something from the game.",
      "The tactical changes at half-time made a difference. We were much better after the break.",
      "A solid team performance. Everyone contributed and we got the three points we needed.",
    ];
    const quoteIdx = Math.abs(seed % managerQuotes.length);

    return (
      <div className="p-3 space-y-3">
        {/* Result */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#161b22] rounded-xl border border-emerald-500/20 p-4 text-center"
        >
          <p className={`text-lg font-black ${resultColor}`}>{resultText}</p>
          <p className="text-3xl font-black text-[#c9d1d9] tabular-nums mt-1">
            {scores.home} - {scores.away}
          </p>
          <p className="text-xs text-[#8b949e] mt-1">
            {homeClub.shortName || homeClub.name} vs {awayClubName}
          </p>
        </motion.div>

        {/* Man of the Match */}
        {motm && (
          <div className="bg-[#161b22] rounded-xl border border-amber-500/20 p-4">
            <div className="flex items-center gap-1 mb-3">
              <Trophy className="h-4 w-4 text-amber-400" />
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Man of the Match</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#c9d1d9]">{motm.name}</p>
                <p className="text-[10px] text-[#8b949e]">{motm.position} &middot; {motm.team === 'home' ? (homeClub.shortName || 'Home') : 'Away'}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[#8b949e]">
                  {motm.goals > 0 && <span className="text-emerald-400">{'\u26BD'} {motm.goals} goals</span>}
                  <span>Rating: <span className="text-amber-400 font-bold">{motm.rating.toFixed(1)}</span></span>
                </div>
              </div>
              <div className="text-2xl font-black text-amber-400 tabular-nums">{motm.rating.toFixed(1)}</div>
            </div>
          </div>
        )}

        {/* Team ratings comparison */}
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
          <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-3">Team Ratings</p>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-400 tabular-nums">6.9</p>
              <p className="text-[10px] text-[#8b949e]">{homeClub.shortName || 'Home'}</p>
            </div>
            <div className="text-[#30363d] text-lg font-bold">vs</div>
            <div className="text-center">
              <p className="text-2xl font-black text-red-400 tabular-nums">6.5</p>
              <p className="text-[10px] text-[#8b949e]">Away</p>
            </div>
          </div>
        </div>

        {/* Manager reaction */}
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-3">
          <p className="text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">Manager Reaction</p>
          <p className="text-xs text-[#c9d1d9] italic leading-relaxed">
            &ldquo;{managerQuotes[quoteIdx]}&rdquo;
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleContinue}
            className="flex-1 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors"
          >
            Continue
          </button>
          <button
            onClick={() => setScreen('post_match_analysis')}
            className="flex-1 py-2.5 text-sm font-bold bg-[#21262d] text-[#c9d1d9] rounded-xl border border-[#30363d] hover:bg-[#30363d] transition-colors"
          >
            View Full Analysis
          </button>
        </div>
      </div>
    );
  };

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <div className="min-h-screen bg-[#0d1117]">
      {renderMatchHeader()}

      {/* Tab navigation */}
      <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d]">
        <div className="flex overflow-x-auto">
          {[
            { key: 'commentary', label: 'Commentary' },
            { key: 'tactics', label: 'Tactics' },
            { key: 'stats', label: 'Stats' },
            { key: 'players', label: 'Players' },
            { key: 'timeline', label: 'Timeline' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="pb-6">
        {phase === 'full_time' ? (
          renderPostMatchSummary()
        ) : (
          <div>
            {activeTab === 'commentary' && renderCommentaryFeed()}
            {activeTab === 'tactics' && renderTacticalPanel()}
            {activeTab === 'stats' && renderStatsPanel()}
            {activeTab === 'players' && renderPlayerPerformance()}
            {activeTab === 'timeline' && renderMatchTimeline()}
          </div>
        )}
      </div>

      {/* Pre-match info */}
      {phase === 'pre_match' && (
        <div className="p-3">
          <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-4 text-center">
            <Shield className="h-10 w-10 text-emerald-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-[#c9d1d9]">Match Engine Simulation</p>
            <p className="text-xs text-[#8b949e] mt-1">
              {homeClub.name} vs {awayClubName}
            </p>
            <p className="text-[10px] text-[#484f58] mt-1">
              Season {gameState.currentSeason}, Week {gameState.currentWeek}
            </p>
            <p className="text-[10px] text-[#484f58] mt-0.5">
              {competitionIcon[competition]} {competitionLabel[competition]}
            </p>
          </div>

          {/* Quick match info */}
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-2 text-center">
              <p className="text-sm font-bold text-[#c9d1d9]">{homeClub.formation || '4-3-3'}</p>
              <p className="text-[8px] text-[#8b949e] uppercase">Formation</p>
            </div>
            <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-2 text-center">
              <p className="text-sm font-bold text-emerald-400">Home</p>
              <p className="text-[8px] text-[#8b949e] uppercase">Venue</p>
            </div>
            <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-2 text-center">
              <p className="text-sm font-bold text-[#c9d1d9]">{homeClub.quality}</p>
              <p className="text-[8px] text-[#8b949e] uppercase">Team Q</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
