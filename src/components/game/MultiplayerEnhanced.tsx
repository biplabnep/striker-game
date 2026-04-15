'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Globe, Swords, Trophy, Users, TrendingUp, Clock, Star,
  MessageSquare, Heart, Shield, Zap, Crown, Search, UserPlus,
  Activity, ChevronRight, Wifi, Circle, Send,
  Bell, Settings, BarChart3, Medal, Flag, Eye, Target,
  Lock, Timer, ArrowUpDown, Award, Plus, ChevronDown,
} from 'lucide-react';
import type { GameScreen } from '@/lib/game/types';

// ============================================================
// Design System Constants
// ============================================================
const PAGE_BG = '#0d1117';
const CARD_BG = '#161b22';
const INNER_BG = '#21262d';
const BORDER = '#30363d';
const PRIMARY_TEXT = '#e6edf3';
const SECONDARY_TEXT = '#c9d1d9';
const MUTED_TEXT = '#8b949e';
const DIM_TEXT = '#484f58';
const EMERALD = '#10B981';
const AMBER = '#F59E0B';
const BLUE = '#3B82F6';
const PURPLE = '#8B5CF6';
const RED = '#EF4444';
const CYAN = '#06B6D4';

// ============================================================
// Seeded Random Helper
// ============================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ============================================================
// Type Definitions
// ============================================================
type TabId = 'leagues' | 'matchmaking' | 'leaderboards' | 'social';

interface OnlineLeague {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  format: string;
  status: 'active' | 'registration' | 'full' | 'starting';
  region: string;
  season: number;
  prizePool: string;
  difficulty: string;
}

interface OpponentProfile {
  id: string;
  name: string;
  rating: number;
  formation: string;
  style: string;
  wins: number;
  losses: number;
  winRate: number;
  tier: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  rating: number;
  goals: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  isPlayer: boolean;
}

interface Friend {
  id: string;
  name: string;
  online: boolean;
  lastActive: string;
  status: 'online' | 'offline' | 'ingame' | 'away';
  rating: number;
  avatar: string;
}

interface ChatPreview {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface ActivityFeedItem {
  id: string;
  user: string;
  avatar: string;
  action: string;
  detail: string;
  time: string;
}

interface TournamentPreview {
  id: string;
  name: string;
  entryFee: string;
  prize: string;
  status: 'open' | 'in_progress' | 'upcoming';
  participants: number;
  maxParticipants: number;
  startsIn: string;
}

interface GuildMember {
  id: string;
  name: string;
  avatar: string;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  online: boolean;
}

interface DonutSegment {
  seg: { label: string; value: number; color: string };
  startAngle: number;
  endAngle: number;
  percentage: number;
}

type Point2D = [number, number];

// ============================================================
// Mock Data Generators
// ============================================================
const PLAYER_NAMES: string[] = [
  'Marcus Sterling', 'Carlos Vega', 'Lukas Müller', 'Antoine Dubois',
  'Kenji Tanaka', 'Rafael Santos', 'Erik Johansson', 'Omar Farouk',
  'Diego Morales', 'Patrick O\'Brien', 'Yusuf Demir', 'Alejandro Ruiz',
];

const AVATARS: string[] = [
  '🔥', '🐺', '⚡', '🦅', '🛡️', '💎', '🌌', '🌊',
  '🗡️', '👑', '🌠', '☄️',
];

function generateOnlineLeagues(): OnlineLeague[] {
  return [
    { id: 'l1', name: 'Premier Elite', players: 18, maxPlayers: 20, format: '5v5 Ranked', status: 'active', region: 'Europe', season: 4, prizePool: '€50,000', difficulty: 'Hard' },
    { id: 'l2', name: 'Champions Cup', players: 16, maxPlayers: 16, format: '4v4 Tournament', status: 'full', region: 'Global', season: 2, prizePool: '€100,000', difficulty: 'Elite' },
    { id: 'l3', name: 'Rising Stars', players: 7, maxPlayers: 20, format: '3v3 Casual', status: 'registration', region: 'S. America', season: 1, prizePool: '€10,000', difficulty: 'Easy' },
    { id: 'l4', name: 'Asian Masters', players: 12, maxPlayers: 16, format: '5v5 Ranked', status: 'starting', region: 'Asia', season: 3, prizePool: '€25,000', difficulty: 'Normal' },
  ];
}

function generateTournaments(): TournamentPreview[] {
  return [
    { id: 't1', name: 'Weekend Warrior Cup', entryFee: 'Free', prize: '5,000 Coins', status: 'open', participants: 28, maxParticipants: 32, startsIn: '2h' },
    { id: 't2', name: 'Diamond Invitational', entryFee: '2,500 Coins', prize: '€25,000', status: 'in_progress', participants: 16, maxParticipants: 16, startsIn: 'Live' },
    { id: 't3', name: 'Continental Clash', entryFee: '5,000 Coins', prize: '€75,000', status: 'upcoming', participants: 0, maxParticipants: 64, startsIn: '3d' },
  ];
}

function generateOpponents(): OpponentProfile[] {
  return [
    { id: 'o1', name: 'Carlos Vega', rating: 82, formation: '4-3-3', style: 'Attacking', wins: 145, losses: 58, winRate: 71, tier: 'Gold' },
    { id: 'o2', name: 'Lukas Müller', rating: 79, formation: '4-4-2', style: 'Balanced', wins: 120, losses: 72, winRate: 63, tier: 'Gold' },
    { id: 'o3', name: 'Kenji Tanaka', rating: 85, formation: '3-5-2', style: 'Possession', wins: 178, losses: 42, winRate: 81, tier: 'Diamond' },
  ];
}

function generateLeaderboard(playerName: string): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < 10; i++) {
    const isPlayer = i === 3;
    const seed = i * 23 + 7;
    const w = isPlayer ? 28 : Math.floor(seededRandom(seed + 2) * 30) + 10;
    const d = isPlayer ? 8 : Math.floor(seededRandom(seed + 3) * 12) + 2;
    const l = isPlayer ? 4 : Math.floor(seededRandom(seed + 4) * 15) + 2;
    const total = w + d + l;
    entries.push({
      rank: i + 1,
      name: isPlayer ? playerName : PLAYER_NAMES[i < 3 ? i : i + 1],
      rating: isPlayer ? 81 : Math.floor(seededRandom(seed) * 20) + 70,
      goals: isPlayer ? 34 : Math.floor(seededRandom(seed + 1) * 40) + 10,
      wins: w,
      draws: d,
      losses: l,
      winRate: Math.round((w / total) * 100),
      isPlayer,
    });
  }
  return entries.sort((a, b) => b.rating - a.rating).map((e, idx) => ({ ...e, rank: idx + 1 }));
}

function generateFriends(): Friend[] {
  return [
    { id: 'f1', name: 'Carlos Vega', online: true, lastActive: 'Now', status: 'online', rating: 82, avatar: '🐺' },
    { id: 'f2', name: 'Lukas Müller', online: true, lastActive: 'Now', status: 'ingame', rating: 79, avatar: '💎' },
    { id: 'f3', name: 'Kenji Tanaka', online: true, lastActive: '5m ago', status: 'online', rating: 85, avatar: '⚡' },
    { id: 'f4', name: 'Antoine Dubois', online: false, lastActive: '2h ago', status: 'offline', rating: 76, avatar: '🦅' },
    { id: 'f5', name: 'Rafael Santos', online: false, lastActive: '1d ago', status: 'away', rating: 74, avatar: '🛡️' },
    { id: 'f6', name: 'Erik Johansson', online: true, lastActive: 'Now', status: 'online', rating: 78, avatar: '🌊' },
  ];
}

function generateChatPreviews(): ChatPreview[] {
  return [
    { id: 'c1', name: 'Carlos Vega', avatar: '🐺', lastMessage: 'GG! That last goal was insane', time: '2m', unread: 3 },
    { id: 'c2', name: 'League Chat', avatar: '🏆', lastMessage: 'Season 5 registration is open!', time: '15m', unread: 12 },
    { id: 'c3', name: 'Kenji Tanaka', avatar: '⚡', lastMessage: 'Want to trade a CB?', time: '1h', unread: 0 },
  ];
}

function generateActivityFeed(): ActivityFeedItem[] {
  return [
    { id: 'a1', user: 'Carlos Vega', avatar: '🐺', action: 'won a match', detail: '3-1 vs Omar Farouk', time: '5m' },
    { id: 'a2', user: 'Kenji Tanaka', avatar: '⚡', action: 'reached Diamond', detail: 'Rank promotion', time: '12m' },
    { id: 'a3', user: 'League System', avatar: '📢', action: 'new tournament', detail: 'Weekend Cup starts Friday', time: '30m' },
    { id: 'a4', user: 'Lukas Müller', avatar: '💎', action: 'completed a trade', detail: 'Exchanged CAM for ST', time: '1h' },
    { id: 'a5', user: 'Erik Johansson', avatar: '🌊', action: 'earned achievement', detail: '100 Online Wins', time: '2h' },
  ];
}

function generateGuildMembers(): GuildMember[] {
  return [
    { id: 'g1', name: 'You', avatar: '🔥', role: 'leader', contribution: 2450, online: true },
    { id: 'g2', name: 'Kenji Tanaka', avatar: '⚡', role: 'officer', contribution: 1820, online: true },
    { id: 'g3', name: 'Erik Johansson', avatar: '🌊', role: 'officer', contribution: 1560, online: true },
    { id: 'g4', name: 'Carlos Vega', avatar: '🐺', role: 'member', contribution: 1340, online: true },
    { id: 'g5', name: 'Rafael Santos', avatar: '🛡️', role: 'member', contribution: 980, online: false },
    { id: 'g6', name: 'Diego Morales', avatar: '☄️', role: 'member', contribution: 720, online: false },
  ];
}

// ============================================================
// SVG Helper Functions
// ============================================================
function pointsToString(points: [number, number][]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

// ============================================================
// Donut Chart Builder (uses .reduce())
// ============================================================
function buildDonutSegments(
  data: { label: string; value: number; color: string }[],
): DonutSegment[] {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90;
  return data.reduce<DonutSegment[]>((acc, item) => {
    const percentage = item.value / total;
    const sweepAngle = percentage * 360;
    const seg: DonutSegment = {
      seg: { label: item.label, value: item.value, color: item.color },
      startAngle: currentAngle,
      endAngle: currentAngle + sweepAngle,
      percentage,
    };
    acc.push(seg);
    currentAngle += sweepAngle;
    return acc;
  }, []);
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start[0]} ${start[1]} A ${r} ${r} 0 ${largeArcFlag} 0 ${end[0]} ${end[1]}`;
}

// ============================================================
// Radar Chart Builder
// ============================================================
function buildRadarPoints(
  axes: string[],
  values: number[],
  cx: number,
  cy: number,
  maxR: number,
): Point2D[] {
  const angleStep = 360 / axes.length;
  return axes.map((_, i) => {
    const angle = -90 + i * angleStep;
    const r = (values[i] / 100) * maxR;
    return polarToCartesian(cx, cy, r, angle);
  });
}

// ============================================================
// SVG 1: Online League Activity Donut (Tab 1)
// ============================================================
function LeagueActivityDonut(): React.JSX.Element {
  const data = [
    { label: 'Active', value: 42, color: EMERALD },
    { label: 'Idle', value: 18, color: AMBER },
    { label: 'Full', value: 15, color: BLUE },
    { label: 'Starting', value: 8, color: PURPLE },
  ];
  const segments = buildDonutSegments(data);
  const cx = 100;
  const cy = 80;
  const r = 50;
  const innerR = 30;

  return (
    <svg viewBox="0 0 200 165" className="w-full max-w-[280px]">
      {segments.map((arc) => {
        const outerPath = describeArc(cx, cy, r, arc.startAngle, arc.endAngle);
        const innerPath = describeArc(cx, cy, innerR, arc.endAngle, arc.startAngle);
        const closeOuter = polarToCartesian(cx, cy, r, arc.startAngle);
        const closeInner = polarToCartesian(cx, cy, innerR, arc.startAngle);
        return (
          <path
            key={arc.seg.label}
            d={`${outerPath} L ${closeInner[0]} ${closeInner[1]} ${innerPath} Z`}
            fill={arc.seg.color}
            fillOpacity={0.75}
            stroke={PAGE_BG}
            strokeWidth={2}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={PRIMARY_TEXT} fontSize={16} fontWeight="bold">83</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={MUTED_TEXT} fontSize={10}>Leagues</text>
      {segments.map((arc, i) => (
        <React.Fragment key={`legend-${arc.seg.label}`}>
          <rect x={6} y={120 + i * 11} width={8} height={8} rx={1} fill={arc.seg.color} fillOpacity={0.8} />
          <text x={18} y={128 + i * 11} textAnchor="start" fill={MUTED_TEXT} fontSize={9}>{arc.seg.label}: {arc.seg.value}</text>
        </React.Fragment>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 2: Player Distribution Bars (Tab 1)
// ============================================================
function PlayerDistributionBars(): React.JSX.Element {
  const regions = [
    { label: 'Europe', value: 4200, color: BLUE },
    { label: 'S. America', value: 2800, color: EMERALD },
    { label: 'Asia', value: 1900, color: PURPLE },
    { label: 'Africa', value: 1100, color: AMBER },
    { label: 'N. America', value: 800, color: CYAN },
  ];
  const maxVal = Math.max(...regions.map(r => r.value));
  const barWidth = 28;
  const gap = 16;
  const chartHeight = 100;
  const startX = 30;
  const bottomY = 110;

  return (
    <svg viewBox="0 0 320 150" className="w-full max-w-[320px]">
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = bottomY - (pct / 100) * chartHeight;
        return (
          <React.Fragment key={`ylabel-${pct}`}>
            <text x={startX - 4} y={y + 3} textAnchor="end" fill={DIM_TEXT} fontSize={8}>{pct}%</text>
            <line x1={startX} y1={y} x2={startX + 5 * barWidth + 4 * gap} y2={y} stroke={BORDER} strokeWidth={0.5} />
          </React.Fragment>
        );
      })}
      {regions.map((region, i) => {
        const barH = (region.value / maxVal) * chartHeight;
        const x = startX + i * (barWidth + gap);
        const y = bottomY - barH;
        return (
          <React.Fragment key={region.label}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={2} fill={region.color} fillOpacity={0.75} />
            <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fill={SECONDARY_TEXT} fontSize={8} fontWeight="bold">{(region.value / 1000).toFixed(1)}k</text>
            <text x={x + barWidth / 2} y={bottomY + 14} textAnchor="middle" fill={MUTED_TEXT} fontSize={8}>{region.label}</text>
          </React.Fragment>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 3: League Match Results Timeline (Tab 1)
// ============================================================
function MatchResultsTimeline(): React.JSX.Element {
  const results: Array<{ result: 'W' | 'D' | 'L'; score: string; opponent: string }> = [
    { result: 'W', score: '3-1', opponent: 'vs Vega' },
    { result: 'W', score: '2-0', opponent: 'vs Farouk' },
    { result: 'D', score: '1-1', opponent: 'vs Müller' },
    { result: 'L', score: '0-2', opponent: 'vs Tanaka' },
    { result: 'W', score: '4-2', opponent: 'vs Dubois' },
    { result: 'D', score: '2-2', opponent: 'vs Santos' },
  ];
  const colorMap = { W: EMERALD, D: AMBER, L: RED };
  const dotR = 12;
  const spacing = 44;
  const startX = 36;
  const lineY = 45;

  return (
    <svg viewBox="0 0 300 100" className="w-full max-w-[300px]">
      <line x1={startX - 10} y1={lineY} x2={startX + (results.length - 1) * spacing + 10} y2={lineY} stroke={BORDER} strokeWidth={2} />
      {results.map((item, i) => {
        const x = startX + i * spacing;
        return (
          <React.Fragment key={`result-${i}`}>
            <circle cx={x} cy={lineY} r={dotR} fill={colorMap[item.result]} fillOpacity={0.2} stroke={colorMap[item.result]} strokeWidth={2} />
            <text x={x} y={lineY + 1} textAnchor="middle" fill={colorMap[item.result]} fontSize={9} fontWeight="bold">{item.result}</text>
            <text x={x} y={lineY + 24} textAnchor="middle" fill={MUTED_TEXT} fontSize={7}>{item.score}</text>
            <text x={x} y={lineY - 18} textAnchor="middle" fill={DIM_TEXT} fontSize={6}>GW{12 + i}</text>
            <text x={x} y={lineY + 34} textAnchor="middle" fill={DIM_TEXT} fontSize={6}>{item.opponent}</text>
          </React.Fragment>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 4: Matchmaking Queue Gauge (Tab 2)
// ============================================================
function MatchmakingQueueGauge(): React.JSX.Element {
  const position = 37;
  const cx = 100;
  const cy = 100;
  const r = 70;
  const startAngle = 180;
  const endAngle = 360;
  const valueAngle = startAngle + (position / 100) * (endAngle - startAngle);
  const bgPath = describeArc(cx, cy, r, startAngle, endAngle);
  const valuePath = describeArc(cx, cy, r, startAngle, valueAngle);

  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-[240px]">
      <path d={bgPath} fill="none" stroke={INNER_BG} strokeWidth={10} strokeLinecap="round" />
      <path d={valuePath} fill="none" stroke={CYAN} strokeWidth={10} strokeLinecap="round" />
      <text x={cx} y={cy - 10} textAnchor="middle" fill={PRIMARY_TEXT} fontSize={24} fontWeight="bold">{position}</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill={MUTED_TEXT} fontSize={10}>in queue</text>
      <text x={cx - 50} y={cy + 30} textAnchor="middle" fill={DIM_TEXT} fontSize={8}>0</text>
      <text x={cx + 50} y={cy + 30} textAnchor="middle" fill={DIM_TEXT} fontSize={8}>100</text>
    </svg>
  );
}

// ============================================================
// SVG 5: Opponent Skill Comparison Radar (Tab 2)
// ============================================================
function OpponentSkillRadar(): React.JSX.Element {
  const axes = ['Attack', 'Defense', 'Midfield', 'Pace', 'Physical'];
  const playerValues = [82, 68, 75, 80, 72];
  const opponentValues = [78, 85, 70, 72, 80];
  const cx = 120;
  const cy = 100;
  const maxR = 65;
  const playerPoints = buildRadarPoints(axes, playerValues, cx, cy, maxR);
  const opponentPoints = buildRadarPoints(axes, opponentValues, cx, cy, maxR);
  const gridPoints = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 240 200" className="w-full max-w-[280px]">
      {gridPoints.map((pct) => {
        const pts = buildRadarPoints(axes, [pct, pct, pct, pct, pct], cx, cy, maxR);
        return <polygon key={`grid-${pct}`} points={pointsToString(pts)} fill="none" stroke={BORDER} strokeWidth={0.5} />;
      })}
      {axes.map((_, i) => {
        const angle = -90 + i * (360 / axes.length);
        const edge = polarToCartesian(cx, cy, maxR, angle);
        return <line key={`axis-${i}`} x1={cx} y1={cy} x2={edge[0]} y2={edge[1]} stroke={BORDER} strokeWidth={0.5} />;
      })}
      <polygon points={pointsToString(playerPoints)} fill={EMERALD} fillOpacity={0.15} stroke={EMERALD} strokeWidth={2} />
      <polygon points={pointsToString(opponentPoints)} fill={RED} fillOpacity={0.15} stroke={RED} strokeWidth={2} />
      {axes.map((label, i) => {
        const angle = -90 + i * (360 / axes.length);
        const labelPos = polarToCartesian(cx, cy, maxR + 18, angle);
        return <text key={`label-${i}`} x={labelPos[0]} y={labelPos[1] + 3} textAnchor="middle" fill={MUTED_TEXT} fontSize={9}>{label}</text>;
      })}
      <circle cx={20} cy={185} r={4} fill={EMERALD} fillOpacity={0.6} />
      <text x={28} y={188} textAnchor="start" fill={MUTED_TEXT} fontSize={8}>You</text>
      <circle cx={65} cy={185} r={4} fill={RED} fillOpacity={0.6} />
      <text x={73} y={188} textAnchor="start" fill={MUTED_TEXT} fontSize={8}>Opponent</text>
    </svg>
  );
}

// ============================================================
// SVG 6: Win/Loss Distribution Donut (Tab 2)
// ============================================================
function WinLossDonut(): React.JSX.Element {
  const data = [
    { label: 'Win', value: 45, color: EMERALD },
    { label: 'Draw', value: 18, color: AMBER },
    { label: 'Loss', value: 15, color: RED },
  ];
  const segments = buildDonutSegments(data);
  const cx = 100;
  const cy = 80;
  const r = 50;
  const innerR = 30;

  return (
    <svg viewBox="0 0 200 165" className="w-full max-w-[240px]">
      {segments.map((arc) => {
        const outerPath = describeArc(cx, cy, r, arc.startAngle, arc.endAngle);
        const innerPath = describeArc(cx, cy, innerR, arc.endAngle, arc.startAngle);
        const closeOuter = polarToCartesian(cx, cy, r, arc.startAngle);
        const closeInner = polarToCartesian(cx, cy, innerR, arc.startAngle);
        return (
          <path
            key={arc.seg.label}
            d={`${outerPath} L ${closeInner[0]} ${closeInner[1]} ${innerPath} Z`}
            fill={arc.seg.color}
            fillOpacity={0.75}
            stroke={PAGE_BG}
            strokeWidth={2}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={PRIMARY_TEXT} fontSize={16} fontWeight="bold">{data[0].value}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={MUTED_TEXT} fontSize={10}>Wins</text>
      {segments.map((arc, i) => (
        <React.Fragment key={`legend-${arc.seg.label}`}>
          <rect x={6} y={120 + i * 12} width={8} height={8} rx={1} fill={arc.seg.color} fillOpacity={0.8} />
          <text x={18} y={128 + i * 12} textAnchor="start" fill={MUTED_TEXT} fontSize={9}>{arc.seg.label}: {arc.seg.value} ({Math.round(arc.percentage * 100)}%)</text>
        </React.Fragment>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 7: Ranking Progress Area Chart (Tab 3)
// ============================================================
function RankingProgressChart(): React.JSX.Element {
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const rankValues = [120, 95, 88, 72, 68, 55, 48, 42];
  const minRank = Math.min(...rankValues);
  const maxRank = Math.max(...rankValues);
  const chartLeft = 35;
  const chartRight = 230;
  const chartTop = 15;
  const chartBottom = 90;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  const dataPoints = rankValues.map((v, i) => {
    const x = chartLeft + (i / (weeks.length - 1)) * chartW;
    const y = chartTop + ((maxRank - v) / (maxRank - minRank)) * chartH;
    return [x, y] as [number, number];
  });

  const areaPoints: [number, number][] = [
    [dataPoints[0][0], chartBottom],
    ...dataPoints,
    [dataPoints[dataPoints.length - 1][0], chartBottom],
  ];

  return (
    <svg viewBox="0 0 260 110" className="w-full max-w-[300px]">
      {[0, 1, 2, 3, 4].map((i) => {
        const y = chartTop + (i / 4) * chartH;
        const val = Math.round(maxRank - (i / 4) * (maxRank - minRank));
        return (
          <React.Fragment key={`yl-${i}`}>
            <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke={BORDER} strokeWidth={0.5} />
            <text x={chartLeft - 4} y={y + 3} textAnchor="end" fill={DIM_TEXT} fontSize={8}>{val}</text>
          </React.Fragment>
        );
      })}
      <polygon points={pointsToString(areaPoints)} fill={EMERALD} fillOpacity={0.12} />
      <polyline points={pointsToString(dataPoints)} fill="none" stroke={EMERALD} strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map((pt, i) => (
        <React.Fragment key={`dp-${i}`}>
          <circle cx={pt[0]} cy={pt[1]} r={3} fill={EMERALD} stroke={PAGE_BG} strokeWidth={1} />
          {i % 2 === 0 || i === dataPoints.length - 1 ? (
            <text x={pt[0]} y={pt[1] - 6} textAnchor="middle" fill={SECONDARY_TEXT} fontSize={7}>#{rankValues[i]}</text>
          ) : null}
        </React.Fragment>
      ))}
      {weeks.map((w, i) => {
        const x = chartLeft + (i / (weeks.length - 1)) * chartW;
        return <text key={w} x={x} y={chartBottom + 14} textAnchor="middle" fill={MUTED_TEXT} fontSize={8}>{w}</text>;
      })}
    </svg>
  );
}

// ============================================================
// SVG 8: Top Players Performance Bars (Tab 3)
// ============================================================
function TopPlayersPerformanceBars(): React.JSX.Element {
  const players = [
    { name: 'Sterling', goals: 28, rating: 8.4 },
    { name: 'Tanaka', goals: 24, rating: 8.1 },
    { name: 'Santos', goals: 22, rating: 7.9 },
    { name: 'Vega', goals: 20, rating: 7.8 },
    { name: 'Müller', goals: 18, rating: 7.6 },
    { name: 'Dubois', goals: 17, rating: 7.5 },
    { name: 'Farouk', goals: 15, rating: 7.3 },
    { name: 'Morales', goals: 14, rating: 7.2 },
  ];
  const maxGoals = Math.max(...players.map(p => p.goals));
  const barH = 12;
  const gap = 4;
  const labelW = 50;
  const chartLeft = labelW + 5;
  const chartRight = 200;
  const chartW = chartRight - chartLeft;

  return (
    <svg viewBox="0 0 240 150" className="w-full max-w-[280px]">
      {players.map((player, i) => {
        const y = 8 + i * (barH + gap);
        const barW = (player.goals / maxGoals) * chartW;
        const ratio = (player.goals / player.rating).toFixed(1);
        return (
          <React.Fragment key={player.name}>
            <text x={labelW - 2} y={y + barH / 2 + 3} textAnchor="end" fill={SECONDARY_TEXT} fontSize={8}>{player.name}</text>
            <rect x={chartLeft} y={y} width={barW} height={barH} rx={2} fill={BLUE} fillOpacity={0.7} />
            <text x={chartRight + 5} y={y + barH / 2 + 3} textAnchor="start" fill={MUTED_TEXT} fontSize={8}>{ratio}</text>
            <text x={chartLeft + barW - 4} y={y + barH / 2 + 3} textAnchor="end" fill={PRIMARY_TEXT} fontSize={7}>{player.goals}g</text>
          </React.Fragment>
        );
      })}
      <text x={chartRight + 5} y={8 + players.length * (barH + gap) + 5} textAnchor="start" fill={DIM_TEXT} fontSize={7}>Goals/Rating</text>
    </svg>
  );
}

// ============================================================
// SVG 9: Rating Distribution Histogram (Tab 3)
// ============================================================
function RatingDistributionHistogram(): React.JSX.Element {
  const bins = [
    { label: '60-65', count: 8, color: RED },
    { label: '65-70', count: 22, color: AMBER },
    { label: '70-75', count: 45, color: CYAN },
    { label: '75-80', count: 68, color: BLUE },
    { label: '80-85', count: 35, color: PURPLE },
    { label: '85+', count: 12, color: EMERALD },
  ];
  const maxCount = Math.max(...bins.map(b => b.count));
  const barW = 30;
  const gap = 8;
  const chartH = 80;
  const bottomY = 95;
  const startX = 28;

  return (
    <svg viewBox="0 0 260 120" className="w-full max-w-[300px]">
      {[0, 25, 50, 75].map((pct) => {
        const y = bottomY - (pct / 100) * chartH;
        const val = Math.round((pct / 100) * maxCount);
        return (
          <React.Fragment key={`yl-${pct}`}>
            <line x1={startX} y1={y} x2={startX + bins.length * barW + (bins.length - 1) * gap} y2={y} stroke={BORDER} strokeWidth={0.5} />
            <text x={startX - 4} y={y + 3} textAnchor="end" fill={DIM_TEXT} fontSize={8}>{val}</text>
          </React.Fragment>
        );
      })}
      {bins.map((bin, i) => {
        const barH = (bin.count / maxCount) * chartH;
        const x = startX + i * (barW + gap);
        const y = bottomY - barH;
        return (
          <React.Fragment key={bin.label}>
            <rect x={x} y={y} width={barW} height={barH} rx={2} fill={bin.color} fillOpacity={0.7} />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill={SECONDARY_TEXT} fontSize={8}>{bin.count}</text>
            <text x={x + barW / 2} y={bottomY + 12} textAnchor="middle" fill={MUTED_TEXT} fontSize={8}>{bin.label}</text>
          </React.Fragment>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 10: Social Activity Radar (Tab 4)
// ============================================================
function SocialActivityRadar(): React.JSX.Element {
  const axes = ['Active', 'Friendly', 'Competitive', 'Helpful', 'Popular'];
  const values = [85, 72, 90, 65, 78];
  const cx = 120;
  const cy = 100;
  const maxR = 65;
  const dataPoints = buildRadarPoints(axes, values, cx, cy, maxR);
  const gridLevels = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 240 200" className="w-full max-w-[280px]">
      {gridLevels.map((pct) => {
        const pts = buildRadarPoints(axes, [pct, pct, pct, pct, pct], cx, cy, maxR);
        return <polygon key={`grid-${pct}`} points={pointsToString(pts)} fill="none" stroke={BORDER} strokeWidth={0.5} />;
      })}
      {axes.map((_, i) => {
        const angle = -90 + i * (360 / axes.length);
        const edge = polarToCartesian(cx, cy, maxR, angle);
        return <line key={`axis-${i}`} x1={cx} y1={cy} x2={edge[0]} y2={edge[1]} stroke={BORDER} strokeWidth={0.5} />;
      })}
      <polygon points={pointsToString(dataPoints)} fill={PURPLE} fillOpacity={0.2} stroke={PURPLE} strokeWidth={2} />
      {dataPoints.map((pt, i) => (
        <circle key={`dot-${i}`} cx={pt[0]} cy={pt[1]} r={3} fill={PURPLE} />
      ))}
      {axes.map((label, i) => {
        const angle = -90 + i * (360 / axes.length);
        const pos = polarToCartesian(cx, cy, maxR + 18, angle);
        return (
          <React.Fragment key={`lbl-${i}`}>
            <text x={pos[0]} y={pos[1] + 3} textAnchor="middle" fill={MUTED_TEXT} fontSize={9}>{label}</text>
            <text x={pos[0]} y={pos[1] + 13} textAnchor="middle" fill={SECONDARY_TEXT} fontSize={8}>{values[i]}</text>
          </React.Fragment>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 11: Online Friends Trend Line (Tab 4)
// ============================================================
function OnlineFriendsTrendLine(): React.JSX.Element {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const friendCounts = [3, 2, 4, 3, 5, 6, 4];
  const maxVal = Math.max(...friendCounts);
  const chartLeft = 35;
  const chartRight = 210;
  const chartTop = 15;
  const chartBottom = 80;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  const dataPoints = friendCounts.map((v, i) => {
    const x = chartLeft + (i / (days.length - 1)) * chartW;
    const y = chartTop + ((maxVal - v) / maxVal) * chartH;
    return [x, y] as [number, number];
  });

  return (
    <svg viewBox="0 0 240 105" className="w-full max-w-[280px]">
      {[0, 2, 4, 6].map((val) => {
        const y = chartTop + ((maxVal - val) / maxVal) * chartH;
        return (
          <React.Fragment key={`yl-${val}`}>
            <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke={BORDER} strokeWidth={0.5} />
            <text x={chartLeft - 4} y={y + 3} textAnchor="end" fill={DIM_TEXT} fontSize={8}>{val}</text>
          </React.Fragment>
        );
      })}
      <polyline points={pointsToString(dataPoints)} fill="none" stroke={CYAN} strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map((pt, i) => (
        <React.Fragment key={`fd-${i}`}>
          <circle cx={pt[0]} cy={pt[1]} r={3} fill={CYAN} stroke={PAGE_BG} strokeWidth={1} />
          <text x={pt[0]} y={pt[1] - 6} textAnchor="middle" fill={SECONDARY_TEXT} fontSize={7}>{friendCounts[i]}</text>
        </React.Fragment>
      ))}
      {days.map((d, i) => {
        const x = chartLeft + (i / (days.length - 1)) * chartW;
        return <text key={d} x={x} y={chartBottom + 14} textAnchor="middle" fill={MUTED_TEXT} fontSize={8}>{d}</text>;
      })}
    </svg>
  );
}

// ============================================================
// SVG 12: Community Engagement Donut (Tab 4)
// ============================================================
function CommunityEngagementDonut(): React.JSX.Element {
  const data = [
    { label: 'Forums', value: 35, color: BLUE },
    { label: 'Chat', value: 28, color: EMERALD },
    { label: 'Trades', value: 22, color: AMBER },
    { label: 'Challenges', value: 15, color: PURPLE },
  ];
  const segments = buildDonutSegments(data);
  const cx = 100;
  const cy = 80;
  const r = 50;
  const innerR = 30;

  return (
    <svg viewBox="0 0 200 165" className="w-full max-w-[240px]">
      {segments.map((arc) => {
        const outerPath = describeArc(cx, cy, r, arc.startAngle, arc.endAngle);
        const innerPath = describeArc(cx, cy, innerR, arc.endAngle, arc.startAngle);
        const closeOuter = polarToCartesian(cx, cy, r, arc.startAngle);
        const closeInner = polarToCartesian(cx, cy, innerR, arc.startAngle);
        return (
          <path
            key={arc.seg.label}
            d={`${outerPath} L ${closeInner[0]} ${closeInner[1]} ${innerPath} Z`}
            fill={arc.seg.color}
            fillOpacity={0.75}
            stroke={PAGE_BG}
            strokeWidth={2}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={PRIMARY_TEXT} fontSize={16} fontWeight="bold">100</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={MUTED_TEXT} fontSize={10}>Active</text>
      {segments.map((arc, i) => (
        <React.Fragment key={`legend-${arc.seg.label}`}>
          <rect x={6} y={120 + i * 11} width={8} height={8} rx={1} fill={arc.seg.color} fillOpacity={0.8} />
          <text x={18} y={128 + i * 11} textAnchor="start" fill={MUTED_TEXT} fontSize={9}>{arc.seg.label}: {arc.seg.value}%</text>
        </React.Fragment>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 13: Form Sparkline (Tab 2 - Match History)
// ============================================================
function FormSparkline(): React.JSX.Element {
  const ratings = [6.2, 7.8, 8.1, 5.4, 7.5, 8.9, 7.2, 6.8, 8.4, 7.6];
  const minVal = Math.min(...ratings);
  const maxVal = Math.max(...ratings);
  const chartLeft = 5;
  const chartRight = 155;
  const chartTop = 10;
  const chartBottom = 50;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  const dataPoints = ratings.map((v, i) => {
    const x = chartLeft + (i / (ratings.length - 1)) * chartW;
    const y = chartTop + ((maxVal - v) / (maxVal - minVal)) * chartH;
    return [x, y] as [number, number];
  });

  return (
    <svg viewBox="0 0 160 60" className="w-full max-w-[160px]">
      <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke={BORDER} strokeWidth={0.5} />
      <polyline points={pointsToString(dataPoints)} fill="none" stroke={EMERALD} strokeWidth={1.5} strokeLinejoin="round" />
      {dataPoints.map((pt, i) => (
        <circle key={`sp-${i}`} cx={pt[0]} cy={pt[1]} r={2} fill={EMERALD} />
      ))}
    </svg>
  );
}

// ============================================================
// Sub-Component: League Card (Tab 1)
// ============================================================
function LeagueCard({ league }: { league: OnlineLeague }): React.JSX.Element {
  const statusStyles: Record<string, { bg: string; color: string }> = {
    active: { bg: `${EMERALD}20`, color: EMERALD },
    registration: { bg: `${AMBER}20`, color: AMBER },
    full: { bg: `${BLUE}20`, color: BLUE },
    starting: { bg: `${PURPLE}20`, color: PURPLE },
  };
  const style = statusStyles[league.status] ?? statusStyles.active;
  const fillPct = (league.players / league.maxPlayers) * 100;

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>{league.name}</span>
        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold" style={{ backgroundColor: style.bg, color: style.color }}>{league.status}</span>
      </div>
      <div className="flex items-center gap-2 text-[10px]" style={{ color: MUTED_TEXT }}>
        <Users className="h-3 w-3" />
        <span>{league.players}/{league.maxPlayers}</span>
        <span style={{ color: DIM_TEXT }}>|</span>
        <span>{league.format}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[10px]" style={{ color: MUTED_TEXT }}>
        <Globe className="h-3 w-3" />
        <span>{league.region}</span>
        <span style={{ color: DIM_TEXT }}>•</span>
        <span>S{league.season}</span>
        <span style={{ color: DIM_TEXT }}>•</span>
        <Trophy className="h-3 w-3" style={{ color: AMBER }} />
        <span>{league.prizePool}</span>
      </div>
      <div className="mt-2">
        <div className="w-full h-1 rounded-sm" style={{ backgroundColor: INNER_BG }}>
          <div className="h-full rounded-sm" style={{ width: `${fillPct}%`, backgroundColor: style.color }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[8px]" style={{ color: DIM_TEXT }}>{league.difficulty}</span>
          <span className="text-[8px]" style={{ color: DIM_TEXT }}>{Math.round(fillPct)}% full</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-Component: Tournament Card (Tab 1)
// ============================================================
function TournamentCard({ tournament }: { tournament: TournamentPreview }): React.JSX.Element {
  const statusColors: Record<string, string> = {
    open: EMERALD,
    in_progress: CYAN,
    upcoming: AMBER,
  };
  const statusLabels: Record<string, string> = {
    open: 'Open',
    in_progress: 'Live',
    upcoming: 'Upcoming',
  };
  const color = statusColors[tournament.status] ?? MUTED_TEXT;

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: PRIMARY_TEXT }}>{tournament.name}</span>
        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold" style={{ backgroundColor: `${color}20`, color }}>{statusLabels[tournament.status]}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px]">
        <div>
          <span className="block" style={{ color: DIM_TEXT }}>Entry</span>
          <span className="font-semibold" style={{ color: SECONDARY_TEXT }}>{tournament.entryFee}</span>
        </div>
        <div>
          <span className="block" style={{ color: DIM_TEXT }}>Prize</span>
          <span className="font-semibold" style={{ color: AMBER }}>{tournament.prize}</span>
        </div>
        <div className="flex-1 text-right">
          <span className="block" style={{ color: DIM_TEXT }}>Starts</span>
          <span className="font-semibold" style={{ color: color }}>{tournament.startsIn}</span>
        </div>
      </div>
      {tournament.status !== 'upcoming' && (
        <div className="mt-2">
          <div className="w-full h-1 rounded-sm" style={{ backgroundColor: INNER_BG }}>
            <div className="h-full rounded-sm" style={{ width: `${(tournament.participants / tournament.maxParticipants) * 100}%`, backgroundColor: color }} />
          </div>
          <span className="text-[8px] block mt-1 text-right" style={{ color: DIM_TEXT }}>{tournament.participants}/{tournament.maxParticipants} players</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-Component: Opponent Detail Card (Tab 2)
// ============================================================
function OpponentDetailCard({ opp }: { opp: OpponentProfile }): React.JSX.Element {
  const tierColors: Record<string, string> = {
    Gold: AMBER,
    Diamond: CYAN,
    Silver: '#C0C0C0',
    Bronze: '#CD7F32',
  };
  const tierColor = tierColors[opp.tier] ?? MUTED_TEXT;

  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: INNER_BG }}>
            <UserPlus className="h-5 w-5" style={{ color: BLUE }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: PRIMARY_TEXT }}>{opp.name}</span>
              <span className="text-[8px] px-1 py-0.5 rounded-sm font-bold" style={{ backgroundColor: `${tierColor}20`, color: tierColor }}>{opp.tier}</span>
            </div>
            <span className="text-[10px]" style={{ color: MUTED_TEXT }}>{opp.formation} • {opp.style}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-base font-bold block" style={{ color: AMBER }}>{opp.rating}</span>
          <span className="text-[9px]" style={{ color: MUTED_TEXT }}>OVR</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 pt-2 border-t" style={{ borderColor: `${BORDER}50` }}>
        <div className="flex items-center gap-1 text-[10px]">
          <TrendingUp className="h-3 w-3" style={{ color: EMERALD }} />
          <span style={{ color: EMERALD }}>{opp.wins}W</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <TrendingUp className="h-3 w-3" style={{ color: RED }} />
          <span style={{ color: RED }}>{opp.losses}L</span>
        </div>
        <div className="flex-1" />
        <span className="text-[10px] font-semibold" style={{ color: SECONDARY_TEXT }}>{opp.winRate}% WR</span>
      </div>
    </div>
  );
}

// ============================================================
// Sub-Component: Guild Member Row (Tab 4)
// ============================================================
function GuildMemberRow({ member, isPlayer }: { member: GuildMember; isPlayer: boolean }): React.JSX.Element {
  const roleStyles: Record<string, { bg: string; color: string }> = {
    leader: { bg: `${AMBER}20`, color: AMBER },
    officer: { bg: `${PURPLE}20`, color: PURPLE },
    member: { bg: `${INNER_BG}`, color: MUTED_TEXT },
  };
  const roleStyle = roleStyles[member.role] ?? roleStyles.member;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0" style={{ borderColor: `${BORDER}50`, backgroundColor: isPlayer ? `${EMERALD}08` : 'transparent' }}>
      <span className="text-sm">{member.avatar}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium truncate" style={{ color: isPlayer ? EMERALD : PRIMARY_TEXT }}>{member.name}</span>
          <span className="text-[8px] px-1 py-0.5 rounded-sm font-bold" style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}>{member.role}</span>
          {!member.online && <Circle className="h-2 w-2" style={{ color: DIM_TEXT, fill: DIM_TEXT }} />}
        </div>
      </div>
      <span className="text-[10px] font-medium" style={{ color: AMBER }}>{member.contribution.toLocaleString()}</span>
    </div>
  );
}

// ============================================================
// Tab Content: Online Leagues
// ============================================================
function TabOnlineLeagues(): React.JSX.Element {
  const leagues = generateOnlineLeagues();
  const tournaments = generateTournaments();

  const standings = [
    { pos: 1, name: 'Kenji Tanaka', logo: '⚡', pts: 38, played: 16, gd: '+18' },
    { pos: 2, name: 'You', logo: '🔥', pts: 34, played: 16, gd: '+12' },
    { pos: 3, name: 'Carlos Vega', logo: '🐺', pts: 30, played: 16, gd: '+8' },
    { pos: 4, name: 'Lukas Müller', logo: '💎', pts: 28, played: 16, gd: '+5' },
    { pos: 5, name: 'Rafael Santos', logo: '🛡️', pts: 24, played: 16, gd: '-2' },
    { pos: 6, name: 'Antoine Dubois', logo: '🦅', pts: 22, played: 16, gd: '-4' },
    { pos: 7, name: 'Erik Johansson', logo: '🌊', pts: 18, played: 16, gd: '-8' },
    { pos: 8, name: 'Omar Farouk', logo: '🗡️', pts: 15, played: 16, gd: '-12' },
  ];

  const leagueStats = [
    { label: 'Total Leagues', value: '83', color: BLUE },
    { label: 'Active Matches', value: '142', color: EMERALD },
    { label: 'Online Now', value: '4,832', color: CYAN },
    { label: 'Your Leagues', value: '2', color: AMBER },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        {leagueStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-2 flex flex-col items-center gap-0.5" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
            <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</span>
            <span className="text-[8px] text-center" style={{ color: DIM_TEXT }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* League Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" style={{ color: BLUE }} />
            <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Available Leagues</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-md px-2" style={{ color: BLUE }}>
            <Plus className="h-3 w-3 mr-1" />
            Create
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {leagues.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>
      </div>

      {/* Recent League Results */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: EMERALD }} />
            <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Recent League Results</span>
          </div>
          <span className="text-[9px]" style={{ color: DIM_TEXT }}>GW 14-16</span>
        </div>
        {[
          { home: 'You', away: 'Santos', score: '3-1', result: 'W' },
          { home: 'Vega', away: 'You', score: '1-2', result: 'W' },
          { home: 'You', away: 'Tanaka', score: '0-1', result: 'L' },
          { home: 'Müller', away: 'You', score: '2-2', result: 'D' },
        ].map((match, i) => {
          const resColor = match.result === 'W' ? EMERALD : match.result === 'L' ? RED : AMBER;
          return (
            <div key={`lr-${i}`} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0" style={{ borderColor: `${BORDER}50` }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${resColor}20`, color: resColor }}>{match.result}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px]" style={{ color: PRIMARY_TEXT }}>{match.home}</span>
                <span className="text-[10px]" style={{ color: DIM_TEXT }}> vs </span>
                <span className="text-[11px]" style={{ color: SECONDARY_TEXT }}>{match.away}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: PRIMARY_TEXT }}>{match.score}</span>
            </div>
          );
        })}
      </div>

      {/* Tournaments */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4" style={{ color: AMBER }} />
          <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Tournaments</span>
        </div>
        {tournaments.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>

      {/* Mini Standings */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" style={{ color: AMBER }} />
            <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Premier Elite Standings</span>
          </div>
          <span className="text-[9px]" style={{ color: DIM_TEXT }}>Season 4 • GW 16</span>
        </div>
        <div className="px-3 py-1 grid grid-cols-6 text-[8px] font-semibold uppercase" style={{ color: DIM_TEXT, backgroundColor: PAGE_BG }}>
          <span className="col-span-1">#</span>
          <span className="col-span-2">Team</span>
          <span className="col-span-1 text-center">P</span>
          <span className="col-span-1 text-center">GD</span>
          <span className="col-span-1 text-center">Pts</span>
        </div>
        {standings.map((row) => (
          <div key={row.pos} className="grid grid-cols-6 items-center px-3 py-2 border-b last:border-b-0" style={{ borderColor: `${BORDER}50`, backgroundColor: row.name === 'You' ? `${EMERALD}08` : 'transparent' }}>
            <span className="col-span-1 text-[11px] font-bold" style={{ color: row.pos <= 3 ? AMBER : MUTED_TEXT }}>{row.pos}</span>
            <div className="col-span-2 flex items-center gap-1.5">
              <span className="text-sm">{row.logo}</span>
              <span className="text-[11px] font-medium truncate" style={{ color: row.name === 'You' ? EMERALD : SECONDARY_TEXT }}>{row.name}</span>
            </div>
            <span className="col-span-1 text-center text-[10px]" style={{ color: MUTED_TEXT }}>{row.played}</span>
            <span className="col-span-1 text-center text-[10px]" style={{ color: row.gd.startsWith('+') ? EMERALD : RED }}>{row.gd}</span>
            <span className="col-span-1 text-center text-[11px] font-bold" style={{ color: PRIMARY_TEXT }}>{row.pts}</span>
          </div>
        ))}
      </div>

      {/* SVG Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>LEAGUE ACTIVITY</span>
          <LeagueActivityDonut />
        </div>
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>PLAYER DISTRIBUTION</span>
          <PlayerDistributionBars />
        </div>
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>MATCH RESULTS</span>
          <MatchResultsTimeline />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Tab Content: Matchmaking
// ============================================================
function TabMatchmaking(): React.JSX.Element {
  const opponents = generateOpponents();
  const matchHistory: Array<{ opponent: string; result: string; score: string; rating: string; date: string }> = [
    { opponent: 'Carlos Vega', result: 'W', score: '3-1', rating: '+8', date: 'Today' },
    { opponent: 'Omar Farouk', result: 'W', score: '2-0', rating: '+5', date: 'Today' },
    { opponent: 'Kenji Tanaka', result: 'L', score: '1-3', rating: '-6', date: 'Yesterday' },
    { opponent: 'Lukas Müller', result: 'D', score: '2-2', rating: '+1', date: 'Yesterday' },
    { opponent: 'Antoine Dubois', result: 'W', score: '4-1', rating: '+10', date: '2d ago' },
  ];
  const resultColors: Record<string, string> = { W: EMERALD, D: AMBER, L: RED };

  const mmStats = [
    { label: 'Current Streak', value: '2W', color: EMERALD },
    { label: 'Best Streak', value: '8W', color: AMBER },
    { label: 'Avg Rating', value: '7.4', color: BLUE },
    { label: 'Total Matches', value: '203', color: PURPLE },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Quick Match */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: CARD_BG, borderColor: `${CYAN}40` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5" style={{ color: CYAN }} />
            <span className="text-sm font-semibold" style={{ color: PRIMARY_TEXT }}>Quick Match</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md" style={{ borderColor: `${EMERALD}40`, color: EMERALD }}>
            <Circle className="h-2 w-2 mr-1" style={{ fill: EMERALD, color: EMERALD }} />
            1,247 in queue
          </Badge>
        </div>
        <Button className="w-full rounded-lg font-semibold text-sm h-11" style={{ backgroundColor: CYAN, color: PAGE_BG }}>
          <Zap className="h-4 w-4 mr-2" />
          Find Match
        </Button>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" style={{ color: MUTED_TEXT }} />
            <span className="text-[10px]" style={{ color: MUTED_TEXT }}>Wait: ~45s</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" style={{ color: MUTED_TEXT }} />
            <span className="text-[10px]" style={{ color: MUTED_TEXT }}>Rating: 78-84</span>
          </div>
        </div>
      </div>

      {/* MM Stats */}
      <div className="grid grid-cols-4 gap-2">
        {mmStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-2 flex flex-col items-center gap-0.5" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
            <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</span>
            <span className="text-[8px] text-center" style={{ color: DIM_TEXT }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Rank Tier Progress */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Rank Progression</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold" style={{ backgroundColor: `${AMBER}20`, color: AMBER }}>Gold III</span>
        </div>
        <div className="w-full h-2 rounded-sm mb-2" style={{ backgroundColor: INNER_BG }}>
          <div className="h-full rounded-sm" style={{ width: '72%', backgroundColor: AMBER }} />
        </div>
        <div className="flex items-center justify-between text-[9px]" style={{ color: DIM_TEXT }}>
          <span>Gold III (81)</span>
          <span>Platinum I (85)</span>
        </div>
        <div className="flex items-center gap-3 mt-2 pt-2 border-t" style={{ borderColor: `${BORDER}50` }}>
          <div className="flex-1">
            <span className="text-[9px] block" style={{ color: DIM_TEXT }}>Points to next tier</span>
            <span className="text-[11px] font-semibold" style={{ color: AMBER }}>320 / 450</span>
          </div>
          <div className="flex-1 text-right">
            <span className="text-[9px] block" style={{ color: DIM_TEXT }}>Season high</span>
            <span className="text-[11px] font-semibold" style={{ color: PRIMARY_TEXT }}>84</span>
          </div>
        </div>
      </div>

      {/* Opponent Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" style={{ color: AMBER }} />
            <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Suggested Opponents</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-md px-2" style={{ color: MUTED_TEXT }}>
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
        {opponents.map((opp) => (
          <OpponentDetailCard key={opp.id} opp={opp} />
        ))}
      </div>

      {/* Match History */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: BLUE }} />
            <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Match History</span>
          </div>
          <span className="text-[9px]" style={{ color: DIM_TEXT }}>Last 5</span>
        </div>
        {matchHistory.map((match, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0" style={{ borderColor: `${BORDER}50` }}>
            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${resultColors[match.result]}20`, color: resultColors[match.result] }}>{match.result}</span>
            <span className="text-[11px] flex-1" style={{ color: SECONDARY_TEXT }}>{match.opponent}</span>
            <span className="text-[11px] font-semibold" style={{ color: PRIMARY_TEXT }}>{match.score}</span>
            <span className="text-[10px] font-medium w-8 text-right" style={{ color: match.result === 'L' ? RED : EMERALD }}>{match.rating}</span>
            <span className="text-[9px] w-12 text-right" style={{ color: DIM_TEXT }}>{match.date}</span>
          </div>
        ))}
        <div className="px-3 py-2">
          <span className="text-[9px] font-semibold block mb-1" style={{ color: DIM_TEXT }}>RATING TREND</span>
          <FormSparkline />
        </div>
      </div>

      {/* SVG Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>QUEUE POSITION</span>
          <MatchmakingQueueGauge />
        </div>
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>SKILL COMPARE</span>
          <OpponentSkillRadar />
        </div>
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>WIN/LOSS</span>
          <WinLossDonut />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Tab Content: Leaderboards
// ============================================================
function TabLeaderboards(playerName: string): React.JSX.Element {
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const entries = generateLeaderboard(playerName);

  const filters: Array<{ id: 'weekly' | 'monthly' | 'alltime'; label: string }> = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'alltime', label: 'All-Time' },
  ];

  const playerEntry = entries.find(e => e.isPlayer);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex gap-1.5">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setTimeFilter(f.id)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors"
            style={{
              backgroundColor: timeFilter === f.id ? `${EMERALD}15` : CARD_BG,
              borderColor: timeFilter === f.id ? `${EMERALD}50` : BORDER,
              color: timeFilter === f.id ? EMERALD : MUTED_TEXT,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Player Rank Card */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: CARD_BG, borderColor: `${EMERALD}40` }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${AMBER}15` }}>
            <Crown className="h-6 w-6" style={{ color: AMBER }} />
          </div>
          <div className="flex-1">
            <span className="text-xs font-semibold block" style={{ color: EMERALD }}>Your Global Rank</span>
            <span className="text-2xl font-bold" style={{ color: PRIMARY_TEXT }}>#{playerEntry?.rank ?? 4}</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px]" style={{ color: MUTED_TEXT }}>Rating: {playerEntry?.rating ?? 81}</span>
              <span className="text-[10px]" style={{ color: EMERALD }}>↑ 3 this week</span>
              <span className="text-[10px]" style={{ color: AMBER }}>Top 1.2%</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Medal className="h-6 w-6" style={{ color: AMBER }} />
            <span className="text-[9px] font-bold" style={{ color: AMBER }}>Gold</span>
          </div>
        </div>
      </div>

      {/* Top Scorers Highlight */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4" style={{ color: AMBER }} />
          <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Season Top Scorers</span>
        </div>
        <div className="space-y-2">
          {[
            { rank: 1, name: 'Kenji Tanaka', avatar: '⚡', goals: 28, assists: 12, rating: 8.6 },
            { rank: 2, name: 'Marcus Sterling', avatar: '🔥', goals: 24, assists: 10, rating: 8.4 },
            { rank: 3, name: 'Carlos Vega', avatar: '🐺', goals: 22, assists: 15, rating: 8.2 },
          ].map((scorer) => (
            <div key={scorer.rank} className="flex items-center gap-2">
              <span className="text-[10px] font-bold w-4 text-center" style={{ color: AMBER }}>{scorer.rank}</span>
              <span className="text-sm">{scorer.avatar}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium truncate block" style={{ color: PRIMARY_TEXT }}>{scorer.name}</span>
                <span className="text-[9px]" style={{ color: DIM_TEXT }}>{scorer.goals}G / {scorer.assists}A</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" style={{ color: AMBER }} />
                <span className="text-[11px] font-bold" style={{ color: AMBER }}>{scorer.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="grid grid-cols-11 gap-1 px-3 py-2 text-[8px] font-semibold uppercase" style={{ color: DIM_TEXT, backgroundColor: PAGE_BG }}>
          <span className="col-span-1">#</span>
          <span className="col-span-3">Player</span>
          <span className="col-span-2 text-center">Rating</span>
          <span className="col-span-1 text-center">G</span>
          <span className="col-span-1 text-center">W</span>
          <span className="col-span-1 text-center">D</span>
          <span className="col-span-1 text-center">L</span>
          <span className="col-span-1 text-center">WR%</span>
        </div>
        {entries.map((entry) => {
          const rankColor = entry.rank === 1 ? AMBER : entry.rank === 2 ? '#C0C0C0' : entry.rank === 3 ? '#CD7F32' : MUTED_TEXT;
          return (
            <div
              key={entry.rank}
              className="grid grid-cols-11 gap-1 px-3 py-2.5 items-center border-b last:border-b-0"
              style={{
                borderColor: `${BORDER}50`,
                backgroundColor: entry.isPlayer ? `${EMERALD}08` : 'transparent',
              }}
            >
              <span className="col-span-1 text-[11px] font-bold" style={{ color: rankColor }}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
              </span>
              <span className="col-span-3 text-[11px] font-semibold truncate" style={{ color: entry.isPlayer ? EMERALD : PRIMARY_TEXT }}>
                {entry.name}
              </span>
              <span className="col-span-2 text-center text-[11px] font-bold" style={{ color: AMBER }}>{entry.rating}</span>
              <span className="col-span-1 text-center text-[10px]" style={{ color: MUTED_TEXT }}>{entry.goals}</span>
              <span className="col-span-1 text-center text-[10px]" style={{ color: EMERALD }}>{entry.wins}</span>
              <span className="col-span-1 text-center text-[10px]" style={{ color: AMBER }}>{entry.draws}</span>
              <span className="col-span-1 text-center text-[10px]" style={{ color: RED }}>{entry.losses}</span>
              <span className="col-span-1 text-center text-[10px] font-semibold" style={{ color: SECONDARY_TEXT }}>{entry.winRate}%</span>
            </div>
          );
        })}
      </div>

      {/* SVG Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>RANK TREND</span>
          <RankingProgressChart />
        </div>
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>TOP PERFORMERS</span>
          <TopPlayersPerformanceBars />
        </div>
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>RATING DIST.</span>
          <RatingDistributionHistogram />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Tab Content: Social Hub
// ============================================================
function TabSocialHub(playerName: string): React.JSX.Element {
  const friends = generateFriends();
  const chats = generateChatPreviews();
  const feed = generateActivityFeed();
  const guildMembers = generateGuildMembers();

  const statusIcons: Record<string, React.JSX.Element> = {
    online: <Circle className="h-2 w-2" style={{ color: EMERALD, fill: EMERALD }} />,
    offline: <Circle className="h-2 w-2" style={{ color: DIM_TEXT, fill: DIM_TEXT }} />,
    ingame: <Swords className="h-2.5 w-2.5" style={{ color: AMBER }} />,
    away: <Clock className="h-2.5 w-2.5" style={{ color: AMBER }} />,
  };

  const unreadCount = chats.reduce((sum, c) => sum + c.unread, 0);
  const onlineFriends = friends.filter(f => f.online).length;

  const guildStats = [
    { label: 'Level', value: '12', color: PURPLE },
    { label: 'Members', value: '24/30', color: BLUE },
    { label: 'Rank', value: '#156', color: AMBER },
    { label: 'XP', value: '8,450', color: EMERALD },
  ];

  const guildAchievements = [
    { name: 'League Champions', icon: '🏆', unlocked: true },
    { name: '100 Guild Wins', icon: '⚔️', unlocked: true },
    { name: 'Top 200 Global', icon: '🌟', unlocked: true },
    { name: 'Perfect Season', icon: '💎', unlocked: false },
  ];

  const guildTrophies = [
    { name: 'Season 3 Cup', season: 3 },
    { name: 'Weekly Tournament #12', season: 4 },
    { name: 'Friendly Shield', season: 4 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Friend List */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: BLUE }} />
            <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Friends</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${EMERALD}15`, color: EMERALD }}>
              {onlineFriends} online
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-md px-2" style={{ color: BLUE }}>
              <Search className="h-3 w-3 mr-1" />
              Find
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-md px-2" style={{ color: BLUE }}>
              <UserPlus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </div>
        {friends.map((friend) => (
          <div key={friend.id} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0" style={{ borderColor: `${BORDER}50` }}>
            {statusIcons[friend.status]}
            <span className="text-sm">{friend.avatar}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-medium block truncate" style={{ color: PRIMARY_TEXT }}>{friend.name}</span>
              <span className="text-[9px]" style={{ color: DIM_TEXT }}>{friend.lastActive}{friend.status === 'ingame' ? ' • In match' : ''}</span>
            </div>
            <span className="text-[10px] font-semibold" style={{ color: AMBER }}>{friend.rating}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-md" style={{ color: MUTED_TEXT }}>
              <MessageSquare className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Chat Previews */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" style={{ color: PURPLE }} />
            <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Messages</span>
            {unreadCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold" style={{ backgroundColor: `${RED}15`, color: RED }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-md px-2" style={{ color: PURPLE }}>
            <Send className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
        {chats.map((chat) => (
          <div key={chat.id} className="rounded-lg border p-3" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{chat.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold" style={{ color: PRIMARY_TEXT }}>{chat.name}</span>
                  <span className="text-[9px]" style={{ color: DIM_TEXT }}>{chat.time}</span>
                </div>
                <span className="text-[10px] block truncate" style={{ color: MUTED_TEXT }}>{chat.lastMessage}</span>
              </div>
              {chat.unread > 0 && (
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: RED, color: PAGE_BG }}>
                  {chat.unread}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Guild/Club Info */}
      <div className="rounded-lg border p-4" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: PURPLE }} />
            <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Elite Strikers FC</span>
          </div>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md" style={{ borderColor: `${PURPLE}40`, color: PURPLE }}>
            Lv.12
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {guildStats.map((stat) => (
            <div key={stat.label} className="rounded-md p-2 text-center" style={{ backgroundColor: INNER_BG }}>
              <span className="text-sm font-bold block" style={{ color: stat.color }}>{stat.value}</span>
              <span className="text-[8px]" style={{ color: DIM_TEXT }}>{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="space-y-0">
          <span className="text-[9px] font-semibold block px-3 py-1" style={{ color: DIM_TEXT }}>TOP CONTRIBUTORS</span>
          {guildMembers.slice(0, 4).map((member) => (
            <GuildMemberRow key={member.id} member={member} isPlayer={member.name === 'You'} />
          ))}
        </div>
        {/* Guild Achievements */}
        <div className="mt-2 pt-2 border-t" style={{ borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block px-3 py-1" style={{ color: DIM_TEXT }}>ACHIEVEMENTS</span>
          <div className="grid grid-cols-2 gap-2 px-3 pb-2">
            {guildAchievements.map((ach) => (
              <div key={ach.name} className="flex items-center gap-1.5 rounded-md p-1.5" style={{ backgroundColor: INNER_BG, opacity: ach.unlocked ? 1 : 0.5 }}>
                <span className="text-sm">{ach.icon}</span>
                <span className="text-[9px] font-medium truncate" style={{ color: ach.unlocked ? AMBER : DIM_TEXT }}>{ach.name}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Guild Trophies */}
        <div className="mt-1 pt-2 border-t" style={{ borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block px-3 py-1" style={{ color: DIM_TEXT }}>TROPHY CABINET ({guildTrophies.length})</span>
          <div className="flex gap-3 px-3 pb-2">
            {guildTrophies.map((trophy) => (
              <div key={trophy.name} className="flex flex-col items-center gap-0.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${AMBER}15` }}>
                  <Trophy className="h-4 w-4" style={{ color: AMBER }} />
                </div>
                <span className="text-[7px] text-center" style={{ color: DIM_TEXT }}>{trophy.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" style={{ color: AMBER }} />
            <span className="text-xs font-semibold" style={{ color: SECONDARY_TEXT }}>Activity Feed</span>
          </div>
          <span className="text-[9px]" style={{ color: DIM_TEXT }}>Last 2h</span>
        </div>
        {feed.map((item) => (
          <div key={item.id} className="flex items-start gap-2 px-3 py-2 border-b last:border-b-0" style={{ borderColor: `${BORDER}50` }}>
            <span className="text-sm flex-shrink-0 mt-0.5">{item.avatar}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[11px]">
                <span className="font-semibold" style={{ color: PRIMARY_TEXT }}>{item.user}</span>
                <span style={{ color: MUTED_TEXT }}> {item.action} </span>
                <span style={{ color: DIM_TEXT }}>— {item.detail}</span>
              </span>
            </div>
            <span className="text-[9px] flex-shrink-0" style={{ color: DIM_TEXT }}>{item.time}</span>
          </div>
        ))}
      </div>

      {/* SVG Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>SOCIAL PROFILE</span>
          <SocialActivityRadar />
        </div>
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>FRIENDS ONLINE</span>
          <OnlineFriendsTrendLine />
        </div>
        <div className="rounded-lg border p-2" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
          <span className="text-[9px] font-semibold block mb-1" style={{ color: MUTED_TEXT }}>ENGAGEMENT</span>
          <CommunityEngagementDonut />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Tab Header Component
// ============================================================
function TabHeader({ playerName, activeTab, setActiveTab }: { playerName: string; activeTab: TabId; setActiveTab: (t: TabId) => void }): React.JSX.Element {
  const tabs: Array<{ id: TabId; label: string; icon: React.JSX.Element }> = [
    { id: 'leagues', label: 'Leagues', icon: <Globe className="h-3.5 w-3.5" /> },
    { id: 'matchmaking', label: 'Matchmaking', icon: <Swords className="h-3.5 w-3.5" /> },
    { id: 'leaderboards', label: 'Ranks', icon: <Trophy className="h-3.5 w-3.5" /> },
    { id: 'social', label: 'Social', icon: <Heart className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5" style={{ color: CYAN }} />
          <h1 className="text-lg font-bold" style={{ color: PRIMARY_TEXT }}>Multiplayer Hub</h1>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md" style={{ borderColor: `${EMERALD}40`, color: EMERALD }}>
          <Circle className="h-2 w-2 mr-1" style={{ fill: EMERALD, color: EMERALD }} />
          4,832 Online
        </Badge>
      </div>

      {/* Player Info */}
      <div className="rounded-lg border p-3" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${BLUE}15` }}>
            <Star className="h-5 w-5" style={{ color: BLUE }} />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold block" style={{ color: PRIMARY_TEXT }}>{playerName}</span>
            <span className="text-[10px]" style={{ color: MUTED_TEXT }}>Rating: 81 • Gold Tier • 40 matches</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] block" style={{ color: DIM_TEXT }}>Global Rank</span>
            <span className="text-sm font-bold" style={{ color: AMBER }}>#42</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Wins', value: '28', icon: <TrendingUp className="h-3.5 w-3.5" style={{ color: EMERALD }} /> },
          { label: 'Draws', value: '8', icon: <Target className="h-3.5 w-3.5" style={{ color: AMBER }} /> },
          { label: 'Losses', value: '4', icon: <Shield className="h-3.5 w-3.5" style={{ color: RED }} /> },
          { label: 'Win Rate', value: '70%', icon: <BarChart3 className="h-3.5 w-3.5" style={{ color: BLUE }} /> },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-2 flex flex-col items-center gap-1" style={{ backgroundColor: CARD_BG, borderColor: BORDER }}>
            {stat.icon}
            <span className="text-sm font-bold" style={{ color: PRIMARY_TEXT }}>{stat.value}</span>
            <span className="text-[9px]" style={{ color: DIM_TEXT }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-medium border flex-1 justify-center transition-colors"
            style={{
              backgroundColor: activeTab === tab.id ? `${CYAN}15` : CARD_BG,
              borderColor: activeTab === tab.id ? `${CYAN}50` : BORDER,
              color: activeTab === tab.id ? CYAN : MUTED_TEXT,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function MultiplayerEnhanced(): React.JSX.Element {
  const { gameState, setScreen } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabId>('leagues');

  const playerName = gameState?.player?.name ?? 'Player';

  function handleBack(): void {
    setScreen('dashboard' as GameScreen);
  }

  const tabContent = (() => {
    switch (activeTab) {
      case 'leagues': return <TabOnlineLeagues />;
      case 'matchmaking': return <TabMatchmaking />;
      case 'leaderboards': return TabLeaderboards(playerName);
      case 'social': return TabSocialHub(playerName);
    }
  })();

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      {/* Top Nav */}
      <div className="sticky top-0 z-10 border-b px-4 py-3" style={{ backgroundColor: `${PAGE_BG}E6`, borderColor: BORDER }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0 rounded-lg" style={{ color: MUTED_TEXT }}>
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" style={{ color: CYAN }} />
            <span className="text-sm font-semibold" style={{ color: PRIMARY_TEXT }}>Multiplayer Enhanced</span>
          </div>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" style={{ color: MUTED_TEXT }}>
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" style={{ color: MUTED_TEXT }}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-8">
        <TabHeader playerName={playerName} activeTab={activeTab} setActiveTab={setActiveTab} />
        {tabContent}
      </div>
    </div>
  );
}
