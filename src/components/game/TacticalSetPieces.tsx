'use client';

import { useState } from 'react';
import {
  ClipboardList,
  Target,
  Crosshair,
  Zap,
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  Play,
  Star,
  ChevronRight,
  Trophy,
  BarChart3,
  Award,
  Users,
  Timer,
  Dumbbell,
  CheckCircle2,
  XCircle,
  CircleDot,
  Flag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────────────────────────────────────

type SetPieceTab = 'corners' | 'free_kicks' | 'throw_ins' | 'penalties';

type Difficulty = 'Easy' | 'Medium' | 'Advanced';

type RiskLevel = 'Low' | 'Medium' | 'High';

type ExecutionResult = 'Goal' | 'Miss' | 'Saved' | 'Wide' | 'Post';

interface Routine {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  successRate: number;
  type: SetPieceTab;
  // SVG formation data (positions as percentages of pitch)
  playerPositions: PlayerPosition[];
  runPaths: RunPath[];
  ballPath: BallPath;
}

interface PlayerPosition {
  id: number;
  x: number;
  y: number;
  role: string;
}

interface RunPath {
  playerId: number;
  dx: number;
  dy: number;
}

interface BallPath {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  curve: number;
}

interface FreeKickRoutine {
  id: string;
  name: string;
  description: string;
  distanceRange: string;
  preferredAttribute: string;
  successProbability: number;
  playerPositions: PlayerPosition[];
  runPaths: RunPath[];
  ballPath: BallPath;
}

interface PenaltyStrategy {
  id: string;
  name: string;
  description: string;
  successRate: number;
  riskLevel: RiskLevel;
  bestAgainst: string;
}

interface ExecutionEntry {
  id: number;
  match: string;
  type: string;
  routine: string;
  result: ExecutionResult;
  minute: number;
}

interface TrainingDrill {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: Difficulty;
  reward: string;
  completedToday: boolean;
}

interface SetPieceStats {
  taken: number;
  goals: number;
  successPct: number;
  lastSeasonGoals: number;
}

interface PenaltyTakerStats {
  composure: number;
  penaltyAccuracy: number;
  power: number;
  placement: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Corner Kick Routines Data
// ─────────────────────────────────────────────────────────────────────────────

const cornerRoutines: Routine[] = [
  {
    id: 'corner-1',
    name: 'Near Post Flick-On',
    description:
      'Target man positions at the near post to flick the ball towards the center of the goal. A runner from the edge of the box times their movement to meet the deflection.',
    difficulty: 'Easy',
    successRate: 32,
    type: 'corners',
    playerPositions: [
      { id: 1, x: 8, y: 28, role: 'Taker' },
      { id: 2, x: 18, y: 30, role: 'Target Man' },
      { id: 3, x: 42, y: 20, role: 'Runner' },
      { id: 4, x: 48, y: 42, role: 'Runner' },
      { id: 5, x: 38, y: 38, role: 'Blocker' },
      { id: 6, x: 55, y: 55, role: 'Edge' },
      { id: 7, x: 72, y: 30, role: 'Far Post' },
      { id: 8, x: 25, y: 58, role: 'Guard' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 68, y: 48, role: 'Lurker' },
      { id: 11, x: 78, y: 25, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 3, dx: -12, dy: -10 },
      { playerId: 4, dx: -15, dy: -12 },
    ],
    ballPath: { startX: 8, startY: 28, endX: 20, endY: 30, curve: 5 },
  },
  {
    id: 'corner-2',
    name: 'Far Post Power',
    description:
      'Inswinging delivery aimed at the far post with two attackers attacking the space. One attacker peels off to the front post as a decoy while the real targets attack the far stick.',
    difficulty: 'Medium',
    successRate: 28,
    type: 'corners',
    playerPositions: [
      { id: 1, x: 8, y: 28, role: 'Taker' },
      { id: 2, x: 30, y: 30, role: 'Decoy' },
      { id: 3, x: 65, y: 25, role: 'Attacker 1' },
      { id: 4, x: 72, y: 30, role: 'Attacker 2' },
      { id: 5, x: 45, y: 35, role: 'Blocker' },
      { id: 6, x: 55, y: 55, role: 'Edge' },
      { id: 7, x: 40, y: 20, role: 'Near Post' },
      { id: 8, x: 25, y: 58, role: 'Guard' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 60, y: 45, role: 'Mid' },
      { id: 11, x: 80, y: 15, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 3, dx: -8, dy: 5 },
      { playerId: 4, dx: -10, dy: 3 },
    ],
    ballPath: { startX: 8, startY: 28, endX: 70, endY: 27, curve: -8 },
  },
  {
    id: 'corner-3',
    name: 'Short Corner Variation',
    description:
      'Short pass to a nearby teammate who then delivers the cross from a closer, more dangerous angle. Creates confusion in the defense and opens up new crossing angles.',
    difficulty: 'Easy',
    successRate: 25,
    type: 'corners',
    playerPositions: [
      { id: 1, x: 8, y: 28, role: 'Taker' },
      { id: 2, x: 15, y: 38, role: 'Short Pass' },
      { id: 3, x: 55, y: 30, role: 'Attacker' },
      { id: 4, x: 65, y: 22, role: 'Far Post' },
      { id: 5, x: 40, y: 30, role: 'Near Post' },
      { id: 6, x: 55, y: 55, role: 'Edge' },
      { id: 7, x: 30, y: 50, role: 'Mid' },
      { id: 8, x: 25, y: 58, role: 'Guard' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 70, y: 40, role: 'Lurker' },
      { id: 11, x: 45, y: 18, role: 'Runner' },
    ],
    runPaths: [
      { playerId: 3, dx: -10, dy: -5 },
      { playerId: 11, dx: 10, dy: 8 },
    ],
    ballPath: { startX: 8, startY: 28, endX: 15, endY: 38, curve: 0 },
  },
  {
    id: 'corner-4',
    name: 'Zonal Marking Overload',
    description:
      'Three players stack in a zone six yards from goal, creating a numerical overload. The corner is delivered into the packed zone where it becomes a 50/50 battle in our favor.',
    difficulty: 'Advanced',
    successRate: 35,
    type: 'corners',
    playerPositions: [
      { id: 1, x: 8, y: 28, role: 'Taker' },
      { id: 2, x: 40, y: 22, role: 'Zone 1' },
      { id: 3, x: 44, y: 28, role: 'Zone 2' },
      { id: 4, x: 40, y: 34, role: 'Zone 3' },
      { id: 5, x: 55, y: 55, role: 'Edge' },
      { id: 6, x: 30, y: 30, role: 'Near Post' },
      { id: 7, x: 65, y: 25, role: 'Far Post' },
      { id: 8, x: 25, y: 58, role: 'Guard' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 58, y: 48, role: 'Mid' },
      { id: 11, x: 75, y: 35, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 2, dx: -3, dy: -2 },
      { playerId: 3, dx: -3, dy: 2 },
      { playerId: 4, dx: -3, dy: 5 },
    ],
    ballPath: { startX: 8, startY: 28, endX: 42, endY: 28, curve: 6 },
  },
  {
    id: 'corner-5',
    name: 'The De Bruyne',
    description:
      'Low driven corner played at pace to the edge of the penalty area. A midfielder arrives late to meet the ball with a first-time shot or a controlled volley on goal.',
    difficulty: 'Advanced',
    successRate: 22,
    type: 'corners',
    playerPositions: [
      { id: 1, x: 8, y: 28, role: 'Taker' },
      { id: 2, x: 35, y: 50, role: 'Shooter' },
      { id: 3, x: 45, y: 30, role: 'Decoy' },
      { id: 4, x: 55, y: 25, role: 'Attacker' },
      { id: 5, x: 65, y: 30, role: 'Far Post' },
      { id: 6, x: 40, y: 60, role: 'Edge' },
      { id: 7, x: 30, y: 20, role: 'Near Post' },
      { id: 8, x: 25, y: 58, role: 'Guard' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 60, y: 50, role: 'Mid' },
      { id: 11, x: 72, y: 45, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 2, dx: 5, dy: -18 },
    ],
    ballPath: { startX: 8, startY: 28, endX: 38, endY: 50, curve: 0 },
  },
  {
    id: 'corner-6',
    name: 'Double Movement',
    description:
      'Near post run is a deliberate decoy to drag defenders. The actual target is the far post where two attackers make synchronized runs, one high and one low, creating a 2v1.',
    difficulty: 'Advanced',
    successRate: 30,
    type: 'corners',
    playerPositions: [
      { id: 1, x: 8, y: 28, role: 'Taker' },
      { id: 2, x: 28, y: 30, role: 'Decoy' },
      { id: 3, x: 60, y: 20, role: 'High Runner' },
      { id: 4, x: 58, y: 38, role: 'Low Runner' },
      { id: 5, x: 42, y: 32, role: 'Screen' },
      { id: 6, x: 55, y: 55, role: 'Edge' },
      { id: 7, x: 35, y: 22, role: 'Near Post' },
      { id: 8, x: 25, y: 58, role: 'Guard' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 45, y: 48, role: 'Mid' },
      { id: 11, x: 78, y: 28, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 2, dx: -8, dy: -5 },
      { playerId: 3, dx: -10, dy: 6 },
      { playerId: 4, dx: -12, dy: -5 },
    ],
    ballPath: { startX: 8, startY: 28, endX: 60, endY: 28, curve: -5 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Free Kick Routines Data
// ─────────────────────────────────────────────────────────────────────────────

const freeKickRoutines: FreeKickRoutine[] = [
  {
    id: 'fk-1',
    name: 'Direct Shot Power',
    description:
      'A powerful strike from 25 yards aimed at the top corner. Best with players who have high shot power and long-range shooting attributes.',
    distanceRange: '20-30 yards',
    preferredAttribute: 'Shot Power',
    successProbability: 18,
    playerPositions: [
      { id: 1, x: 45, y: 72, role: 'Shooter' },
      { id: 2, x: 40, y: 68, role: 'Wall' },
      { id: 3, x: 45, y: 68, role: 'Wall' },
      { id: 4, x: 50, y: 68, role: 'Wall' },
      { id: 5, x: 55, y: 55, role: 'Runner' },
      { id: 6, x: 35, y: 55, role: 'Runner' },
      { id: 7, x: 30, y: 35, role: 'Near Post' },
      { id: 8, x: 70, y: 35, role: 'Far Post' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 25, y: 45, role: 'Mid' },
      { id: 11, x: 75, y: 45, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 5, dx: -5, dy: -12 },
      { playerId: 6, dx: 5, dy: -10 },
    ],
    ballPath: { startX: 45, startY: 72, endX: 50, endY: 8, curve: 0 },
  },
  {
    id: 'fk-2',
    name: 'Over the Wall',
    description:
      'Top-spin technique to loft the ball over the defensive wall and dip it under the crossbar. Requires exceptional ball control and technique.',
    distanceRange: '18-25 yards',
    preferredAttribute: 'Ball Control',
    successProbability: 15,
    playerPositions: [
      { id: 1, x: 45, y: 70, role: 'Shooter' },
      { id: 2, x: 38, y: 65, role: 'Wall' },
      { id: 3, x: 43, y: 65, role: 'Wall' },
      { id: 4, x: 48, y: 65, role: 'Wall' },
      { id: 5, x: 53, y: 65, role: 'Wall' },
      { id: 6, x: 60, y: 50, role: 'Runner' },
      { id: 7, x: 35, y: 40, role: 'Near Post' },
      { id: 8, x: 65, y: 40, role: 'Far Post' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 30, y: 55, role: 'Mid' },
      { id: 11, x: 72, y: 55, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 6, dx: -8, dy: -10 },
    ],
    ballPath: { startX: 45, startY: 70, endX: 50, endY: 10, curve: 0 },
  },
  {
    id: 'fk-3',
    name: 'Around the Wall',
    description:
      'Curling shot that bends around the defensive wall into the far corner. Most effective from central positions with a right-footed player on the left side.',
    distanceRange: '20-28 yards',
    preferredAttribute: 'Curve',
    successProbability: 14,
    playerPositions: [
      { id: 1, x: 35, y: 72, role: 'Shooter' },
      { id: 2, x: 40, y: 67, role: 'Wall' },
      { id: 3, x: 45, y: 67, role: 'Wall' },
      { id: 4, x: 50, y: 67, role: 'Wall' },
      { id: 5, x: 55, y: 67, role: 'Wall' },
      { id: 6, x: 65, y: 45, role: 'Runner' },
      { id: 7, x: 30, y: 40, role: 'Near Post' },
      { id: 8, x: 70, y: 35, role: 'Far Post' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 25, y: 55, role: 'Mid' },
      { id: 11, x: 75, y: 50, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 6, dx: -10, dy: -8 },
    ],
    ballPath: { startX: 35, startY: 72, endX: 55, endY: 8, curve: 12 },
  },
  {
    id: 'fk-4',
    name: 'Free Kick Quick Pass',
    description:
      'Quick short pass to a runner who is already moving into space. Catches the defense off guard while they are still setting up the wall. Requires sharp awareness.',
    distanceRange: 'Any distance',
    preferredAttribute: 'Passing',
    successProbability: 20,
    playerPositions: [
      { id: 1, x: 42, y: 72, role: 'Taker' },
      { id: 2, x: 30, y: 60, role: 'Quick Runner' },
      { id: 3, x: 40, y: 67, role: 'Wall' },
      { id: 4, x: 45, y: 67, role: 'Wall' },
      { id: 5, x: 50, y: 67, role: 'Wall' },
      { id: 6, x: 55, y: 55, role: 'Edge' },
      { id: 7, x: 35, y: 35, role: 'Near Post' },
      { id: 8, x: 65, y: 35, role: 'Far Post' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 60, y: 45, role: 'Support' },
      { id: 11, x: 20, y: 45, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 2, dx: 8, dy: -15 },
      { playerId: 10, dx: -5, dy: -12 },
    ],
    ballPath: { startX: 42, startY: 72, endX: 35, endY: 50, curve: 0 },
  },
  {
    id: 'fk-5',
    name: 'Double Tap',
    description:
      'Lay-off to a second striker who hits a first-time shot. The two-man routine creates confusion as defenders react to the initial ball, leaving the shooter unmarked.',
    distanceRange: '20-25 yards',
    preferredAttribute: 'First Touch',
    successProbability: 22,
    playerPositions: [
      { id: 1, x: 42, y: 72, role: 'Lay-off' },
      { id: 2, x: 48, y: 65, role: 'Shooter' },
      { id: 3, x: 38, y: 67, role: 'Wall' },
      { id: 4, x: 43, y: 67, role: 'Wall' },
      { id: 5, x: 48, y: 67, role: 'Wall' },
      { id: 6, x: 53, y: 67, role: 'Wall' },
      { id: 7, x: 30, y: 40, role: 'Near Post' },
      { id: 8, x: 70, y: 40, role: 'Far Post' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 25, y: 50, role: 'Mid' },
      { id: 11, x: 75, y: 50, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 2, dx: 2, dy: -15 },
    ],
    ballPath: { startX: 42, startY: 72, endX: 48, endY: 55, curve: 0 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Throw-in Routines Data (reuse Routine type with generic data)
// ─────────────────────────────────────────────────────────────────────────────

const throwInRoutines: Routine[] = [
  {
    id: 'throw-1',
    name: 'Long Throw into Box',
    description:
      'A powerful long throw launched into the penalty area, creating panic and flick-on opportunities. Works best with a player who has a long throw trait.',
    difficulty: 'Medium',
    successRate: 20,
    type: 'throw_ins',
    playerPositions: [
      { id: 1, x: 5, y: 55, role: 'Thrower' },
      { id: 2, x: 35, y: 25, role: 'Target' },
      { id: 3, x: 50, y: 30, role: 'Near Post' },
      { id: 4, x: 60, y: 35, role: 'Attacker' },
      { id: 5, x: 45, y: 45, role: 'Edge' },
      { id: 6, x: 70, y: 25, role: 'Far Post' },
      { id: 7, x: 30, y: 55, role: 'Mid' },
      { id: 8, x: 55, y: 60, role: 'Wide' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 40, y: 65, role: 'Support' },
      { id: 11, x: 75, y: 50, role: 'Lurker' },
    ],
    runPaths: [
      { playerId: 2, dx: 5, dy: -8 },
      { playerId: 4, dx: -10, dy: -5 },
    ],
    ballPath: { startX: 5, startY: 55, endX: 38, endY: 25, curve: -3 },
  },
  {
    id: 'throw-2',
    name: 'Short Throw & Move',
    description:
      'Quick short throw to a nearby player who then plays a one-two or carries forward. Ideal for retaining possession and building attacks from wide areas.',
    difficulty: 'Easy',
    successRate: 15,
    type: 'throw_ins',
    playerPositions: [
      { id: 1, x: 5, y: 40, role: 'Thrower' },
      { id: 2, x: 15, y: 42, role: 'Receiver' },
      { id: 3, x: 30, y: 35, role: 'Runner' },
      { id: 4, x: 45, y: 30, role: 'Mid' },
      { id: 5, x: 55, y: 45, role: 'Mid' },
      { id: 6, x: 35, y: 55, role: 'Support' },
      { id: 7, x: 65, y: 30, role: 'Wide' },
      { id: 8, x: 20, y: 55, role: 'Back' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 50, y: 55, role: 'Mid' },
      { id: 11, x: 70, y: 50, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 3, dx: -5, dy: -8 },
    ],
    ballPath: { startX: 5, startY: 40, endX: 15, endY: 42, curve: 0 },
  },
  {
    id: 'throw-3',
    name: 'Flick-On Channel Run',
    description:
      'Long throw aimed at a tall player near the touchline who flicks it into the channel. A pacy winger makes a run behind the defense into the space created.',
    difficulty: 'Medium',
    successRate: 18,
    type: 'throw_ins',
    playerPositions: [
      { id: 1, x: 5, y: 35, role: 'Thrower' },
      { id: 2, x: 18, y: 32, role: 'Flick Target' },
      { id: 3, x: 25, y: 45, role: 'Winger' },
      { id: 4, x: 45, y: 30, role: 'Near Post' },
      { id: 5, x: 60, y: 35, role: 'Far Post' },
      { id: 6, x: 50, y: 55, role: 'Edge' },
      { id: 7, x: 35, y: 60, role: 'Support' },
      { id: 8, x: 30, y: 15, role: 'Near' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 70, y: 30, role: 'Wide' },
      { id: 11, x: 40, y: 70, role: 'Back' },
    ],
    runPaths: [
      { playerId: 3, dx: 25, dy: -18 },
    ],
    ballPath: { startX: 5, startY: 35, endX: 18, endY: 32, curve: 0 },
  },
  {
    id: 'throw-4',
    name: 'Dribble from Throw',
    description:
      'Throw-in taken quickly to a player who immediately dribbles infield, drawing defenders and creating passing lanes. Great for catching defenses unorganized.',
    difficulty: 'Easy',
    successRate: 12,
    type: 'throw_ins',
    playerPositions: [
      { id: 1, x: 5, y: 45, role: 'Thrower' },
      { id: 2, x: 12, y: 48, role: 'Dribbler' },
      { id: 3, x: 30, y: 38, role: 'Pass Option' },
      { id: 4, x: 25, y: 58, role: 'Pass Option' },
      { id: 5, x: 45, y: 30, role: 'Near Post' },
      { id: 6, x: 60, y: 40, role: 'Far Post' },
      { id: 7, x: 50, y: 55, role: 'Mid' },
      { id: 8, x: 35, y: 70, role: 'Back' },
      { id: 9, x: 50, y: 12, role: 'Keeper' },
      { id: 10, x: 55, y: 60, role: 'Mid' },
      { id: 11, x: 72, y: 45, role: 'Wide' },
    ],
    runPaths: [
      { playerId: 2, dx: 15, dy: -8 },
    ],
    ballPath: { startX: 5, startY: 45, endX: 12, endY: 48, curve: 0 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Penalty Strategies Data
// ─────────────────────────────────────────────────────────────────────────────

const penaltyStrategies: PenaltyStrategy[] = [
  {
    id: 'pen-1',
    name: 'Power & Placement',
    description:
      'A high-powered shot placed into either corner. The combination of pace and accuracy makes it nearly impossible to save, but poor placement risks missing the target entirely.',
    successRate: 78,
    riskLevel: 'Low',
    bestAgainst: 'Shot-stoppers who guess early',
  },
  {
    id: 'pen-2',
    name: 'Panenka',
    description:
      'A delicate chip down the center as the keeper dives to one side. High risk, high reward. If the keeper stays central, the penalty is almost certainly saved.',
    successRate: 55,
    riskLevel: 'High',
    bestAgainst: 'Keepers who always dive early',
  },
  {
    id: 'pen-3',
    name: 'Stutter Run-Up',
    description:
      'A hesitation in the run-up to disrupt the keeper\'s timing. The taker slows, then accelerates and shoots while the keeper is off-balance from anticipating the strike.',
    successRate: 72,
    riskLevel: 'Medium',
    bestAgainst: 'Keepers with slow reaction times',
  },
  {
    id: 'pen-4',
    name: 'Wait & See',
    description:
      'Delay the shot as long as possible to read the keeper\'s movement. Requires exceptional composure. Place the ball to the opposite side of the keeper\'s dive.',
    successRate: 82,
    riskLevel: 'Medium',
    bestAgainst: 'Aggressive, commit early keepers',
  },
];

const penaltyTakerStats: PenaltyTakerStats = {
  composure: 85,
  penaltyAccuracy: 78,
  power: 72,
  placement: 88,
};

const penaltyFormationPositions: PlayerPosition[] = [
  { id: 1, x: 50, y: 80, role: 'Taker' },
  { id: 2, x: 30, y: 30, role: 'Near Post' },
  { id: 3, x: 70, y: 30, role: 'Far Post' },
  { id: 4, x: 42, y: 45, role: 'Edge' },
  { id: 5, x: 58, y: 45, role: 'Edge' },
  { id: 6, x: 50, y: 12, role: 'Keeper' },
  { id: 7, x: 20, y: 50, role: 'Outside' },
  { id: 8, x: 80, y: 50, role: 'Outside' },
  { id: 9, x: 35, y: 65, role: 'D Zone' },
  { id: 10, x: 65, y: 65, role: 'D Zone' },
  { id: 11, x: 50, y: 60, role: 'Center' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Execution History Data
// ─────────────────────────────────────────────────────────────────────────────

const executionHistory: ExecutionEntry[] = [
  { id: 1, match: 'vs Arsenal (H)', type: 'Corner', routine: 'Far Post Power', result: 'Goal', minute: 34 },
  { id: 2, match: 'vs Chelsea (A)', type: 'Free Kick', routine: 'Around the Wall', result: 'Saved', minute: 67 },
  { id: 3, match: 'vs Liverpool (H)', type: 'Penalty', routine: 'Power & Placement', result: 'Goal', minute: 12 },
  { id: 4, match: 'vs Man City (A)', type: 'Corner', routine: 'Zonal Overload', result: 'Miss', minute: 52 },
  { id: 5, match: 'vs Tottenham (H)', type: 'Free Kick', routine: 'Over the Wall', result: 'Goal', minute: 78 },
  { id: 6, match: 'vs Newcastle (A)', type: 'Penalty', routine: 'Wait & See', result: 'Goal', minute: 45 },
  { id: 7, match: 'vs Aston Villa (H)', type: 'Corner', routine: 'Near Post Flick-On', result: 'Wide', minute: 23 },
  { id: 8, match: 'vs Brighton (A)', type: 'Free Kick', routine: 'Double Tap', result: 'Goal', minute: 89 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Training Drills Data
// ─────────────────────────────────────────────────────────────────────────────

const trainingDrills: TrainingDrill[] = [
  {
    id: 'drill-1',
    name: 'Corner Delivery Practice',
    description: 'Practice delivering corners with varying trajectories and speeds. Improves crossing accuracy and consistency.',
    duration: '15 min',
    difficulty: 'Easy',
    reward: '+3 Crossing',
    completedToday: false,
  },
  {
    id: 'drill-2',
    name: 'Free Kick Wall Clearance',
    description: 'Practice getting balls over and around defensive walls. Develops technique for set-piece shooting.',
    duration: '20 min',
    difficulty: 'Medium',
    reward: '+4 Free Kick',
    completedToday: true,
  },
  {
    id: 'drill-3',
    name: 'Penalty Composure',
    description: 'Simulated pressure penalties with crowd noise and keeper distractions. Builds mental strength.',
    duration: '10 min',
    difficulty: 'Medium',
    reward: '+5 Composure',
    completedToday: false,
  },
  {
    id: 'drill-4',
    name: 'Set Piece Timing',
    description: 'Practice movement coordination and timing for attacking set pieces. Improves team understanding.',
    duration: '25 min',
    difficulty: 'Advanced',
    reward: '+3 Teamwork',
    completedToday: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Statistics Data
// ─────────────────────────────────────────────────────────────────────────────

const setPieceStats: Record<string, SetPieceStats> = {
  corners: { taken: 42, goals: 8, successPct: 19, lastSeasonGoals: 6 },
  free_kicks: { taken: 28, goals: 5, successPct: 18, lastSeasonGoals: 3 },
  penalties: { taken: 12, goals: 10, successPct: 83, lastSeasonGoals: 8 },
  throw_ins: { taken: 35, goals: 2, successPct: 6, lastSeasonGoals: 1 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility / Helpers
// ─────────────────────────────────────────────────────────────────────────────

const difficultyColor = (d: Difficulty): string => {
  switch (d) {
    case 'Easy':
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    case 'Medium':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case 'Advanced':
      return 'text-red-400 border-red-500/30 bg-red-500/10';
    default:
      return 'text-[#8b949e] border-[#30363d] bg-[#161b22]';
  }
};

const riskColor = (r: RiskLevel): string => {
  switch (r) {
    case 'Low':
      return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    case 'Medium':
      return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    case 'High':
      return 'text-red-400 border-red-500/30 bg-red-500/10';
    default:
      return 'text-[#8b949e] border-[#30363d] bg-[#161b22]';
  }
};

const resultColor = (r: ExecutionResult): string => {
  switch (r) {
    case 'Goal':
      return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    case 'Miss':
      return 'text-red-400 bg-red-500/15 border-red-500/30';
    case 'Saved':
      return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    case 'Wide':
      return 'text-[#8b949e] bg-[#161b22] border-[#30363d]';
    case 'Post':
      return 'text-orange-400 bg-orange-500/15 border-orange-500/30';
    default:
      return 'text-[#8b949e] bg-[#161b22] border-[#30363d]';
  }
};

const resultIcon = (r: ExecutionResult): React.ReactNode => {
  switch (r) {
    case 'Goal':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case 'Miss':
      return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    case 'Saved':
      return <Shield className="h-3.5 w-3.5 text-amber-400" />;
    case 'Wide':
      return <XCircle className="h-3.5 w-3.5 text-[#8b949e]" />;
    case 'Post':
      return <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />;
    default:
      return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG Pitch Component
// ─────────────────────────────────────────────────────────────────────────────

interface PitchBoardProps {
  positions: PlayerPosition[];
  runPaths: RunPath[];
  ballPath: BallPath | null;
  showPenaltyBox?: boolean;
}

function TacticalPitchBoard({ positions, runPaths, ballPath, showPenaltyBox = true }: PitchBoardProps) {
  const pitchW = 400;
  const pitchH = 300;

  const px = (pct: number) => (pct / 100) * pitchW;
  const py = (pct: number) => (pct / 100) * pitchH;

  // Compute ball trajectory SVG path with optional curve
  const ballTrajectory = ballPath
    ? (() => {
        const sx = px(ballPath.startX);
        const sy = py(ballPath.startY);
        const ex = px(ballPath.endX);
        const ey = py(ballPath.endY);
        const midX = (sx + ex) / 2;
        const midY = (sy + ey) / 2;
        const cpx = midX + ballPath.curve * 2;
        const cpy = midY - 15;
        return `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`;
      })()
    : '';

  return (
    <div className="relative w-full bg-[#0a2e14] border border-[#30363d] rounded-lg overflow-hidden">
      <svg viewBox={`0 0 ${pitchW} ${pitchH}`} className="w-full" style={{ display: 'block' }}>
        {/* Pitch markings */}
        {/* Outline */}
        <rect x="0" y="0" width={pitchW} height={pitchH} fill="none" stroke="#2d6a3f" strokeWidth="2" />

        {/* Center line (bottom of half) */}
        <line x1="0" y1={pitchH} x2={pitchW} y2={pitchH} stroke="#2d6a3f" strokeWidth="2" />

        {/* Center circle arc */}
        <path
          d={`M ${pitchW / 2 - 60} ${pitchH} A 60 60 0 0 1 ${pitchW / 2 + 60} ${pitchH}`}
          fill="none"
          stroke="#2d6a3f"
          strokeWidth="2"
        />

        {showPenaltyBox && (
          <>
            {/* Penalty area */}
            <rect x="110" y="0" width="180" height="130" fill="none" stroke="#2d6a3f" strokeWidth="2" />

            {/* 6-yard box */}
            <rect x="155" y="0" width="90" height="50" fill="none" stroke="#2d6a3f" strokeWidth="2" />

            {/* Penalty spot */}
            <circle cx={pitchW / 2} cy="105" r="3" fill="#2d6a3f" />

            {/* Penalty arc */}
            <path
              d={`M ${pitchW / 2 - 35} 130 A 40 40 0 0 0 ${pitchW / 2 + 35} 130`}
              fill="none"
              stroke="#2d6a3f"
              strokeWidth="2"
            />
          </>
        )}

        {/* Goal */}
        <rect x="175" y="-8" width="50" height="10" fill="none" stroke="#ffffff" strokeWidth="2" rx="1" />
        <rect x="176" y="-7" width="48" height="8" fill="#ffffff" opacity="0.15" rx="1" />

        {/* Corner arc (top-left) */}
        <path d="M 0 8 A 8 8 0 0 1 8 0" fill="none" stroke="#2d6a3f" strokeWidth="2" />

        {/* Corner arc (top-right) */}
        <path d={`M ${pitchW} 8 A 8 8 0 0 0 ${pitchW - 8} 0`} fill="none" stroke="#2d6a3f" strokeWidth="2" />

        {/* Ball trajectory (dashed) */}
        {ballTrajectory && (
          <path
            d={ballTrajectory}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.8"
          />
        )}

        {/* Ball starting position */}
        {ballPath && (
          <circle cx={px(ballPath.startX)} cy={py(ballPath.startY)} r="5" fill="#fbbf24" opacity="0.9" />
        )}

        {/* Ball end position */}
        {ballPath && (
          <circle cx={px(ballPath.endX)} cy={py(ballPath.endY)} r="4" fill="#fbbf24" opacity="0.4" />
        )}

        {/* Run direction arrows */}
        {runPaths.map((rp) => {
          const player = positions.find((p) => p.id === rp.playerId);
          if (!player) return null;
          const startX = px(player.x);
          const startY = py(player.y);
          const endX = px(player.x + rp.dx);
          const endY = py(player.y + rp.dy);

          return (
            <g key={`run-${rp.playerId}`}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#10b981"
                strokeWidth="2"
                opacity="0.7"
              />
              {/* Arrowhead */}
              <polygon
                points={`${endX},${endY} ${endX - 6},${endY - 4} ${endX - 3},${endY + 5}`}
                fill="#10b981"
                opacity="0.7"
              />
            </g>
          );
        })}

        {/* Player position markers */}
        {positions.map((pos) => {
          const isKeeper = pos.role === 'Keeper';
          const cx = px(pos.x);
          const cy = py(pos.y);
          const r = isKeeper ? 10 : 12;

          return (
            <g key={pos.id}>
              {/* Shadow */}
              <circle cx={cx} cy={cy + 1} r={r} fill="#000000" opacity="0.3" />
              {/* Marker */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={isKeeper ? '#f59e0b' : '#10b981'}
                opacity="0.85"
                stroke="#0d1117"
                strokeWidth="1.5"
              />
              {/* Number */}
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {pos.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat Badge Component
// ─────────────────────────────────────────────────────────────────────────────

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}

function StatBadge({ icon, label, value, accent = false }: StatBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border ${
        accent
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-[#161b22] border-[#30363d]'
      }`}
    >
      <div className={`flex items-center gap-1 text-[10px] font-medium ${accent ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-lg font-bold ${accent ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function TacticalSetPieces() {
  const [activeTab, setActiveTab] = useState<SetPieceTab>('corners');
  const [selectedCorner, setSelectedCorner] = useState<string>('corner-1');
  const [selectedFreeKick, setSelectedFreeKick] = useState<string>('fk-1');
  const [selectedThrowIn, setSelectedThrowIn] = useState<string>('throw-1');
  const [selectedPenalty, setSelectedPenalty] = useState<string>('pen-1');
  const [drillsCompleted, setDrillsCompleted] = useState(1);
  const dailyDrillLimit = 3;

  // Derived state
  const currentCornerRoutine = cornerRoutines.find((r) => r.id === selectedCorner) ?? cornerRoutines[0];
  const currentFreeKickRoutine = freeKickRoutines.find((r) => r.id === selectedFreeKick) ?? freeKickRoutines[0];
  const currentThrowInRoutine = throwInRoutines.find((r) => r.id === selectedThrowIn) ?? throwInRoutines[0];
  const currentPenaltyStrategy = penaltyStrategies.find((p) => p.id === selectedPenalty) ?? penaltyStrategies[0];

  // Aggregate stats
  const totalRoutines = cornerRoutines.length + freeKickRoutines.length + throwInRoutines.length + penaltyStrategies.length;
  const totalGoalsScored = executionHistory.filter((e) => e.result === 'Goal').length;
  const totalRoutinesUsed = executionHistory.length;
  const overallSuccessRate = totalRoutinesUsed > 0 ? Math.round((totalGoalsScored / totalRoutinesUsed) * 100) : 0;

  // Most successful routine
  const routineResults: Record<string, { attempts: number; goals: number }> = {};
  executionHistory.forEach((e) => {
    if (!routineResults[e.routine]) routineResults[e.routine] = { attempts: 0, goals: 0 };
    routineResults[e.routine].attempts++;
    if (e.result === 'Goal') routineResults[e.routine].goals++;
  });
  const mostSuccessful = Object.entries(routineResults)
    .map(([name, data]) => ({ name, rate: Math.round((data.goals / data.attempts) * 100), goals: data.goals }))
    .sort((a, b) => b.rate - a.rate)[0];

  // Season set piece goal tally
  const seasonGoals = Object.values(setPieceStats).reduce((sum, s) => sum + s.goals, 0);
  const lastSeasonGoals = Object.values(setPieceStats).reduce((sum, s) => sum + s.lastSeasonGoals, 0);

  // Tab configuration
  const tabs: { key: SetPieceTab; label: string; count: number }[] = [
    { key: 'corners', label: 'Corner Kicks', count: cornerRoutines.length },
    { key: 'free_kicks', label: 'Free Kicks', count: freeKickRoutines.length },
    { key: 'throw_ins', label: 'Throw-ins', count: throwInRoutines.length },
    { key: 'penalties', label: 'Penalties', count: penaltyStrategies.length },
  ];

  const canStartDrill = drillsCompleted < dailyDrillLimit;

  const handleStartDrill = (drillId: string) => {
    if (!canStartDrill) return;
    setDrillsCompleted((prev) => prev + 1);
  };

  // ── Animation variants (opacity only, no transforms) ──
  const fadeVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  const fadeTransition = { duration: 0.2 };

  return (
    <div className="min-h-screen bg-[#0d1117] pb-6">
      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: Set Piece Overview Header
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 pt-4 pb-2">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            <ClipboardList className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#c9d1d9] leading-tight">Set Piece Tactics</h1>
            <p className="text-xs text-[#8b949e]">Manage routines, practice drills, and track performance</p>
          </div>
        </div>

        {/* Stat Badges */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <StatBadge
            icon={<Flag className="h-3 w-3" />}
            label="Routines"
            value={totalRoutines}
            accent
          />
          <StatBadge
            icon={<Target className="h-3 w-3" />}
            label="Goals"
            value={totalGoalsScored}
            accent
          />
          <StatBadge
            icon={<TrendingUp className="h-3 w-3" />}
            label="Success %"
            value={`${overallSuccessRate}%`}
          />
          <StatBadge
            icon={<BarChart3 className="h-3 w-3" />}
            label="Used"
            value={totalRoutinesUsed}
          />
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1 p-1 bg-[#161b22] rounded-lg border border-[#30363d]">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] mt-0.5 opacity-70">{tab.count} routines</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: Tactical Pitch Board
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mb-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Crosshair className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-[#c9d1d9]">Tactical Board</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#8b949e]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Player
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Keeper
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Ball
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-emerald-500" />
                Run
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`pitch-${activeTab}-${selectedCorner}-${selectedFreeKick}-${selectedThrowIn}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
            >
              {activeTab === 'corners' && (
                <TacticalPitchBoard
                  positions={currentCornerRoutine.playerPositions}
                  runPaths={currentCornerRoutine.runPaths}
                  ballPath={currentCornerRoutine.ballPath}
                />
              )}
              {activeTab === 'free_kicks' && (
                <TacticalPitchBoard
                  positions={currentFreeKickRoutine.playerPositions}
                  runPaths={currentFreeKickRoutine.runPaths}
                  ballPath={currentFreeKickRoutine.ballPath}
                />
              )}
              {activeTab === 'throw_ins' && (
                <TacticalPitchBoard
                  positions={currentThrowInRoutine.playerPositions}
                  runPaths={currentThrowInRoutine.runPaths}
                  ballPath={currentThrowInRoutine.ballPath}
                />
              )}
              {activeTab === 'penalties' && (
                <TacticalPitchBoard
                  positions={penaltyFormationPositions}
                  runPaths={[]}
                  ballPath={null}
                  showPenaltyBox={true}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Routine name displayed below pitch */}
          <div className="mt-2 text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={`pitch-label-${activeTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTransition}
                className="text-sm font-semibold text-emerald-400"
              >
                {activeTab === 'corners' && currentCornerRoutine.name}
                {activeTab === 'free_kicks' && currentFreeKickRoutine.name}
                {activeTab === 'throw_ins' && currentThrowInRoutine.name}
                {activeTab === 'penalties' && currentPenaltyStrategy.name}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3-6: Tab Content (Routines)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          {/* ─── CORNER KICKS ─── */}
          {activeTab === 'corners' && (
            <motion.div
              key="corners-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
              className="space-y-3"
            >
              <SectionHeader
                icon={<Target className="h-4 w-4 text-emerald-400" />}
                title="Corner Kick Routines"
                subtitle="Select a routine to see the tactical setup"
              />

              {cornerRoutines.map((routine) => {
                const isSelected = routine.id === selectedCorner;
                return (
                  <RoutineCard
                    key={routine.id}
                    id={routine.id}
                    name={routine.name}
                    description={routine.description}
                    difficulty={routine.difficulty}
                    successRate={routine.successRate}
                    isSelected={isSelected}
                    onClick={() => setSelectedCorner(routine.id)}
                  />
                );
              })}
            </motion.div>
          )}

          {/* ─── FREE KICKS ─── */}
          {activeTab === 'free_kicks' && (
            <motion.div
              key="freekicks-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
              className="space-y-3"
            >
              <SectionHeader
                icon={<Zap className="h-4 w-4 text-emerald-400" />}
                title="Free Kick Routines"
                subtitle="Shooting and passing routines from set pieces"
              />

              {freeKickRoutines.map((routine) => {
                const isSelected = routine.id === selectedFreeKick;
                return (
                  <FreeKickCard
                    key={routine.id}
                    id={routine.id}
                    name={routine.name}
                    description={routine.description}
                    distanceRange={routine.distanceRange}
                    preferredAttribute={routine.preferredAttribute}
                    successProbability={routine.successProbability}
                    isSelected={isSelected}
                    onClick={() => setSelectedFreeKick(routine.id)}
                  />
                );
              })}
            </motion.div>
          )}

          {/* ─── THROW-INS ─── */}
          {activeTab === 'throw_ins' && (
            <motion.div
              key="throwins-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
              className="space-y-3"
            >
              <SectionHeader
                icon={<Flag className="h-4 w-4 text-emerald-400" />}
                title="Throw-in Routines"
                subtitle="Restart play from the touchline"
              />

              {throwInRoutines.map((routine) => {
                const isSelected = routine.id === selectedThrowIn;
                return (
                  <RoutineCard
                    key={routine.id}
                    id={routine.id}
                    name={routine.name}
                    description={routine.description}
                    difficulty={routine.difficulty}
                    successRate={routine.successRate}
                    isSelected={isSelected}
                    onClick={() => setSelectedThrowIn(routine.id)}
                  />
                );
              })}
            </motion.div>
          )}

          {/* ─── PENALTIES ─── */}
          {activeTab === 'penalties' && (
            <motion.div
              key="penalties-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTransition}
              className="space-y-3"
            >
              <SectionHeader
                icon={<Crosshair className="h-4 w-4 text-emerald-400" />}
                title="Penalty Strategies"
                subtitle="From the spot — choose your approach"
              />

              {/* Penalty Taker Stats Panel */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Users className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span className="text-xs font-semibold text-[#c9d1d9]">Penalty Taker Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatBar label="Composure" value={penaltyTakerStats.composure} color="emerald" />
                  <StatBar label="Pen. Accuracy" value={penaltyTakerStats.penaltyAccuracy} color="emerald" />
                  <StatBar label="Power" value={penaltyTakerStats.power} color="amber" />
                  <StatBar label="Placement" value={penaltyTakerStats.placement} color="emerald" />
                </div>
              </div>

              {penaltyStrategies.map((strategy) => {
                const isSelected = strategy.id === selectedPenalty;
                return (
                  <PenaltyCard
                    key={strategy.id}
                    id={strategy.id}
                    name={strategy.name}
                    description={strategy.description}
                    successRate={strategy.successRate}
                    riskLevel={strategy.riskLevel}
                    bestAgainst={strategy.bestAgainst}
                    isSelected={isSelected}
                    onClick={() => setSelectedPenalty(strategy.id)}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6: Set Piece Execution History
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <SectionHeader
          icon={<Clock className="h-4 w-4 text-emerald-400" />}
          title="Execution History"
          subtitle={`Season tally: ${seasonGoals} goals from set pieces`}
        />

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
          {/* Most successful routine highlight */}
          {mostSuccessful && (
            <div className="px-3 py-2 bg-emerald-500/8 border-b border-emerald-500/15">
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                  Most Successful
                </span>
                <ChevronRight className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-300">{mostSuccessful.name}</span>
                <span className="text-[10px] text-[#8b949e] ml-auto">{mostSuccessful.rate}% success</span>
              </div>
            </div>
          )}

          {/* History entries */}
          <div className="divide-y divide-[#21262d]">
            {executionHistory.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: entry.id * 0.03 }}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                {/* Result indicator */}
                <div className="flex items-center justify-center w-7 h-7 rounded-md border">
                  {resultIcon(entry.result)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-[#c9d1d9] truncate">{entry.match}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#8b949e]">{entry.type}</span>
                    <span className="text-[10px] text-[#484f58]">&middot;</span>
                    <span className="text-[10px] text-[#8b949e] truncate">{entry.routine}</span>
                  </div>
                </div>

                {/* Result badge & minute */}
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${resultColor(entry.result)}`}
                  >
                    {entry.result}
                  </span>
                  <span className="text-[10px] text-[#484f58]">{entry.minute}&apos;</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Season comparison footer */}
          <div className="px-3 py-2 border-t border-[#21262d] bg-[#0d1117]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8b949e]">Season Goals vs Last Season</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400">{seasonGoals}</span>
                <span className="text-[10px] text-[#484f58]">vs</span>
                <span className="text-xs font-medium text-[#8b949e]">{lastSeasonGoals}</span>
                {seasonGoals > lastSeasonGoals && (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7: Training Drills
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <SectionHeader
            icon={<Dumbbell className="h-4 w-4 text-emerald-400" />}
            title="Training Drills"
            subtitle="Improve set piece skills"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[#30363d] bg-[#161b22]">
            <Timer className="h-3 w-3 text-[#8b949e]" />
            <span className="text-[10px] font-medium text-[#8b949e]">
              {drillsCompleted}/{dailyDrillLimit} today
            </span>
            {Array.from({ length: dailyDrillLimit }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < drillsCompleted ? 'bg-emerald-500' : 'bg-[#30363d]'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {trainingDrills.map((drill) => {
            const isCompleted = drill.completedToday || (!canStartDrill && !drill.completedToday);
            return (
              <div
                key={drill.id}
                className={`bg-[#161b22] border rounded-lg p-3 transition-colors ${
                  isCompleted ? 'border-[#21262d] opacity-60' : 'border-[#30363d]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                      <h3 className="text-xs font-semibold text-[#c9d1d9] truncate">
                        {drill.name}
                      </h3>
                    </div>
                    <p className="text-[10px] text-[#8b949e] mt-1 leading-relaxed">{drill.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 mb-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded border text-[#8b949e] border-[#30363d] bg-[#0d1117]">
                    {drill.duration}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${difficultyColor(drill.difficulty)}`}
                  >
                    {drill.difficulty}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">{drill.reward}</span>
                </div>

                <button
                  onClick={() => handleStartDrill(drill.id)}
                  disabled={isCompleted}
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
                    isCompleted
                      ? 'bg-[#21262d] border-[#30363d] text-[#484f58] cursor-not-allowed'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                  }`}
                >
                  <Play className="h-3 w-3" />
                  {isCompleted ? 'Completed' : 'Start Drill'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 8: Set Piece Statistics
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6 mb-4">
        <SectionHeader
          icon={<BarChart3 className="h-4 w-4 text-emerald-400" />}
          title="Set Piece Statistics"
          subtitle="Per-type breakdown and season comparison"
        />

        {/* Per-type stat cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { key: 'corners', label: 'Corner Kicks', icon: <Flag className="h-3.5 w-3.5" /> },
            { key: 'free_kicks', label: 'Free Kicks', icon: <Zap className="h-3.5 w-3.5" /> },
            { key: 'penalties', label: 'Penalties', icon: <CircleDot className="h-3.5 w-3.5" /> },
            { key: 'throw_ins', label: 'Throw-ins', icon: <Flag className="h-3.5 w-3.5" /> },
          ].map(({ key, label, icon }) => {
            const stats = setPieceStats[key];
            return (
              <motion.div
                key={key}
                initial={fadeVariant.hidden}
                animate={fadeVariant.visible}
                transition={{ duration: 0.2 }}
                className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-emerald-400">{icon}</span>
                  <span className="text-[11px] font-semibold text-[#c9d1d9]">{label}</span>
                </div>
                <div className="space-y-1.5">
                  <StatRow label="Taken" value={stats.taken.toString()} />
                  <StatRow label="Goals" value={stats.goals.toString()} highlight={stats.goals > 0} />
                  <StatRow label="Success" value={`${stats.successPct}%`} highlight={stats.successPct >= 15} />
                </div>
                {/* Season comparison bar */}
                <div className="mt-2 pt-2 border-t border-[#21262d]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-[#484f58]">Season vs Last</span>
                    <span className="text-[9px] text-[#8b949e]">
                      {stats.goals} / {stats.lastSeasonGoals}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-2 bg-[#0d1117] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-sm"
                        style={{ width: `${Math.min((stats.goals / Math.max(stats.goals, stats.lastSeasonGoals, 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex-1 h-2 bg-[#0d1117] rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-[#30363d] rounded-sm"
                        style={{
                          width: `${Math.min((stats.lastSeasonGoals / Math.max(stats.goals, stats.lastSeasonGoals, 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[8px] text-emerald-500">This season</span>
                    <span className="text-[8px] text-[#484f58]">Last</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dead Ball Specialist Badge */}
        <motion.div
          initial={fadeVariant.hidden}
          animate={fadeVariant.visible}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-[#c9d1d9]">Dead Ball Specialist</span>
          </div>

          {/* Specialist Rating Badge */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <div className="text-center">
                <span className="text-lg font-bold text-amber-400 leading-none">A-</span>
                <span className="block text-[8px] text-amber-500/70 mt-0.5">Rating</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs text-[#c9d1d9] font-medium">Your Player</p>
              <p className="text-[10px] text-[#8b949e] mt-0.5">
                Strong set-piece contributor with {overallSuccessRate}% success rate across all dead ball situations.
              </p>
            </div>
          </div>

          {/* Top Set Piece Taker Recommendation */}
          <div className="p-2.5 bg-[#0d1117] rounded-md border border-[#21262d]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Trophy className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
                Top Taker
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#c9d1d9]">M. Alvarez</p>
                <p className="text-[10px] text-[#8b949e]">Recommended for corners & direct free kicks</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-400">92</p>
                <p className="text-[9px] text-[#484f58]">DB Rating</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-[#c9d1d9] leading-tight">{title}</h2>
        {subtitle && <p className="text-[10px] text-[#8b949e] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

interface RoutineCardProps {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  successRate: number;
  isSelected: boolean;
  onClick: () => void;
}

function RoutineCard({ name, description, difficulty, successRate, isSelected, onClick }: RoutineCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`w-full text-left bg-[#161b22] border rounded-lg p-3 transition-colors ${
        isSelected
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-[#30363d] hover:border-[#484f58]'
      }`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <h3
          className={`text-xs font-semibold leading-tight ${
            isSelected ? 'text-emerald-400' : 'text-[#c9d1d9]'
          }`}
        >
          {name}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${difficultyColor(difficulty)}`}>
            {difficulty}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-[#8b949e] leading-relaxed mb-2">{description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#8b949e]">Success Rate:</span>
          <span className="text-[10px] font-bold text-emerald-400">{successRate}%</span>
        </div>
        <div className="flex items-center gap-0.5">
          <ChevronRight className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-400' : 'text-[#484f58]'}`} />
        </div>
      </div>
    </motion.button>
  );
}

interface FreeKickCardProps {
  id: string;
  name: string;
  description: string;
  distanceRange: string;
  preferredAttribute: string;
  successProbability: number;
  isSelected: boolean;
  onClick: () => void;
}

function FreeKickCard({
  name,
  description,
  distanceRange,
  preferredAttribute,
  successProbability,
  isSelected,
  onClick,
}: FreeKickCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`w-full text-left bg-[#161b22] border rounded-lg p-3 transition-colors ${
        isSelected
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-[#30363d] hover:border-[#484f58]'
      }`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <h3
          className={`text-xs font-semibold leading-tight ${
            isSelected ? 'text-emerald-400' : 'text-[#c9d1d9]'
          }`}
        >
          {name}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded border text-[#8b949e] border-[#30363d] bg-[#0d1117]">
            {distanceRange}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-[#8b949e] leading-relaxed mb-2">{description}</p>
      <div className="flex items-center gap-3">
        {/* Success probability bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-[#8b949e]">Success</span>
            <span className="text-[10px] font-bold text-emerald-400">{successProbability}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#0d1117] rounded-sm overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-sm transition-all"
              style={{ width: `${successProbability}%` }}
            />
          </div>
        </div>
        {/* Preferred attribute */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5">
          <Zap className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium">{preferredAttribute}</span>
        </div>
      </div>
    </motion.button>
  );
}

interface PenaltyCardProps {
  id: string;
  name: string;
  description: string;
  successRate: number;
  riskLevel: RiskLevel;
  bestAgainst: string;
  isSelected: boolean;
  onClick: () => void;
}

function PenaltyCard({
  name,
  description,
  successRate,
  riskLevel,
  bestAgainst,
  isSelected,
  onClick,
}: PenaltyCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`w-full text-left bg-[#161b22] border rounded-lg p-3 transition-colors ${
        isSelected
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-[#30363d] hover:border-[#484f58]'
      }`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <h3
          className={`text-xs font-semibold leading-tight ${
            isSelected ? 'text-emerald-400' : 'text-[#c9d1d9]'
          }`}
        >
          {name}
        </h3>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ml-2 ${riskColor(riskLevel)}`}>
          {riskLevel}
        </span>
      </div>
      <p className="text-[10px] text-[#8b949e] leading-relaxed mb-2">{description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#8b949e]">Success:</span>
            <span className="text-[10px] font-bold text-emerald-400">{successRate}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-[#8b949e]" />
          <span className="text-[10px] text-[#8b949e]">{bestAgainst}</span>
        </div>
      </div>
    </motion.button>
  );
}

interface StatBarProps {
  label: string;
  value: number;
  color: 'emerald' | 'amber';
}

function StatBar({ label, value, color }: StatBarProps) {
  const barColor = color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500';
  const textColor = color === 'emerald' ? 'text-emerald-400' : 'text-amber-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-[#8b949e]">{label}</span>
        <span className={`text-[10px] font-bold ${textColor}`}>{value}</span>
      </div>
      <div className="w-full h-1.5 bg-[#0d1117] rounded-sm overflow-hidden">
        <div className={`h-full ${barColor} rounded-sm`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatRow({ label, value, highlight = false }: StatRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[#8b949e]">{label}</span>
      <span
        className={`text-[10px] font-semibold ${
          highlight ? 'text-emerald-400' : 'text-[#c9d1d9]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
