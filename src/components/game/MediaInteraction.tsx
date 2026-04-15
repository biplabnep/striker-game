'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  Mic, Newspaper, Share2, Star, MessageCircle, TrendingUp,
  ArrowLeft, Eye, ThumbsUp, AlertTriangle, CheckCircle,
  XCircle, Clock, Award, DollarSign, Radio, Tv,
  ChevronRight, Sparkles, Users, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// ============================================================
// Seeded random helpers — deterministic from season/week
// ============================================================
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededRange(seed: number, min: number, max: number): number {
  return min + seededRandom(seed) * (max - min);
}

function seededInt(seed: number, min: number, max: number): number {
  return Math.floor(seededRange(seed, min, max + 1));
}

// ============================================================
// Formatting helpers
// ============================================================
function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function fmtCurrency(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m >= 10 ? `€${m.toFixed(1)}M` : `€${m.toFixed(2)}M`;
  }
  if (value >= 1_000) return `€${(value / 1_000).toFixed(1)}K`;
  return `€${value.toFixed(0)}`;
}

// ============================================================
// Type definitions
// ============================================================
type TabId = 'press_conferences' | 'social_media' | 'interview_requests' | 'public_image';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.JSX.Element;
}

interface PressConference {
  id: string;
  title: string;
  type: 'pre_match' | 'post_match' | 'midweek';
  status: 'upcoming' | 'completed';
  mood: number;
  impact: {
    reputation: number;
    morale: number;
    fanSupport: number;
    mediaRelation: number;
  };
  response: string;
  week: number;
}

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  type: 'photo' | 'video' | 'text';
}

interface InterviewRequest {
  id: string;
  outlet: string;
  type: 'tv' | 'radio' | 'newspaper' | 'online';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'accepted' | 'declined';
  topic: string;
  reach: number;
}

interface EndorsementCategory {
  id: string;
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================================
// Data generators
// ============================================================
function generatePressConferences(
  seed: number,
  playerName: string,
  clubName: string,
  recentResultsCount: number,
  playerRating: number
): PressConference[] {
  return [
    {
      id: `pc-${seed}-0`,
      title: `Pre-Match: ${clubName} vs Derby Rivals`,
      type: 'pre_match',
      status: 'upcoming',
      mood: seededRange(seed + 10, 40, 85),
      impact: { reputation: 0, morale: 0, fanSupport: 0, mediaRelation: 0 },
      response: '',
      week: seededInt(seed + 11, 1, 38),
    },
    {
      id: `pc-${seed}-1`,
      title: 'Midweek Training Update',
      type: 'midweek',
      status: recentResultsCount > 2 ? 'completed' : 'upcoming',
      mood: seededRange(seed + 12, 50, 90),
      impact: {
        reputation: seededInt(seed + 13, -3, 8),
        morale: seededInt(seed + 14, -5, 10),
        fanSupport: seededInt(seed + 15, -2, 5),
        mediaRelation: seededInt(seed + 16, -3, 7),
      },
      response: playerRating >= 7
        ? 'Feeling confident about the direction we are heading. The squad is united and working hard.'
        : 'We need to keep working and improving. Every training session matters at this level.',
      week: seededInt(seed + 17, 1, 38),
    },
    {
      id: `pc-${seed}-2`,
      title: `Post-Match: ${clubName} Victory`,
      type: 'post_match',
      status: 'completed',
      mood: seededRange(seed + 18, 55, 95),
      impact: {
        reputation: seededInt(seed + 19, 2, 12),
        morale: seededInt(seed + 20, 3, 10),
        fanSupport: seededInt(seed + 21, 1, 8),
        mediaRelation: seededInt(seed + 22, 0, 6),
      },
      response: `Incredible performance from the whole team. ${playerName} delivered when it mattered most.`,
      week: seededInt(seed + 23, 1, 38),
    },
    {
      id: `pc-${seed}-3`,
      title: 'Season Outlook Presser',
      type: 'midweek',
      status: 'completed',
      mood: seededRange(seed + 24, 45, 80),
      impact: {
        reputation: seededInt(seed + 25, -2, 5),
        morale: seededInt(seed + 26, -3, 4),
        fanSupport: seededInt(seed + 27, -1, 3),
        mediaRelation: seededInt(seed + 28, -2, 4),
      },
      response: 'Every season presents new challenges. We are focused on our goals and taking it one match at a time.',
      week: seededInt(seed + 29, 1, 38),
    },
    {
      id: `pc-${seed}-4`,
      title: 'European Ambitions Discussion',
      type: 'midweek',
      status: 'completed',
      mood: seededRange(seed + 30, 50, 85),
      impact: {
        reputation: seededInt(seed + 31, 1, 8),
        morale: seededInt(seed + 32, 2, 6),
        fanSupport: seededInt(seed + 33, 0, 5),
        mediaRelation: seededInt(seed + 34, 1, 7),
      },
      response: 'Competing at the highest level is what every player dreams of. We are pushing for it.',
      week: seededInt(seed + 35, 1, 38),
    },
  ];
}

function generateSocialPosts(
  seed: number,
  playerName: string,
  clubName: string
): SocialPost[] {
  return [
    {
      id: `sp-${seed}-0`,
      platform: 'Instagram',
      content: `Match day ready! Big game today for ${clubName}. Let us get the three points! #MatchDay #COYS`,
      likes: seededInt(seed + 40, 5000, 50000),
      comments: seededInt(seed + 41, 200, 2000),
      shares: seededInt(seed + 42, 100, 1500),
      timestamp: '2h ago',
      type: 'photo',
    },
    {
      id: `sp-${seed}-1`,
      platform: 'Twitter',
      content: `Grateful for all the support this season. ${clubName} fans are the best in the world. Thank you for everything.`,
      likes: seededInt(seed + 43, 8000, 80000),
      comments: seededInt(seed + 44, 500, 4000),
      shares: seededInt(seed + 45, 200, 3000),
      timestamp: '6h ago',
      type: 'text',
    },
    {
      id: `sp-${seed}-2`,
      platform: 'TikTok',
      content: `Training ground skills challenge with the lads! Who won? Watch to find out.`,
      likes: seededInt(seed + 46, 20000, 200000),
      comments: seededInt(seed + 47, 1000, 8000),
      shares: seededInt(seed + 48, 500, 5000),
      timestamp: '1d ago',
      type: 'video',
    },
    {
      id: `sp-${seed}-3`,
      platform: 'Instagram',
      content: `Recovery day. Ice bath, massage, and good nutrition. Taking care of the body is non-negotiable.`,
      likes: seededInt(seed + 49, 3000, 25000),
      comments: seededInt(seed + 50, 100, 800),
      shares: seededInt(seed + 51, 50, 500),
      timestamp: '2d ago',
      type: 'photo',
    },
    {
      id: `sp-${seed}-4`,
      platform: 'Twitter',
      content: `Congratulations to the team on a hard-fought draw. We keep building.`,
      likes: seededInt(seed + 52, 4000, 30000),
      comments: seededInt(seed + 53, 150, 1200),
      shares: seededInt(seed + 54, 80, 800),
      timestamp: '3d ago',
      type: 'text',
    },
  ];
}

function generateInterviewRequests(
  seed: number,
  playerName: string,
  reputation: number
): InterviewRequest[] {
  return [
    {
      id: `ir-${seed}-0`,
      outlet: 'Sky Sports',
      type: 'tv',
      priority: reputation >= 70 ? 'high' : 'medium',
      status: 'pending',
      topic: 'Season performance review and future ambitions',
      reach: seededInt(seed + 60, 500000, 2000000),
    },
    {
      id: `ir-${seed}-1`,
      outlet: 'BBC Sport',
      type: 'tv',
      priority: reputation >= 60 ? 'high' : 'medium',
      status: 'accepted',
      topic: 'Exclusive profile: life on and off the pitch',
      reach: seededInt(seed + 61, 800000, 3000000),
    },
    {
      id: `ir-${seed}-2`,
      outlet: 'The Athletic',
      type: 'online',
      priority: reputation >= 50 ? 'medium' : 'low',
      status: 'pending',
      topic: 'Tactical analysis and playing style deep dive',
      reach: seededInt(seed + 62, 200000, 800000),
    },
    {
      id: `ir-${seed}-3`,
      outlet: 'TalkSport Radio',
      type: 'radio',
      priority: 'medium',
      status: 'declined',
      topic: 'Transfer rumors and contract situation',
      reach: seededInt(seed + 63, 300000, 1000000),
    },
    {
      id: `ir-${seed}-4`,
      outlet: 'ESPN FC',
      type: 'online',
      priority: reputation >= 75 ? 'critical' : 'high',
      status: 'pending',
      topic: 'International career and World Cup prospects',
      reach: seededInt(seed + 64, 1000000, 5000000),
    },
    {
      id: `ir-${seed}-5`,
      outlet: 'Marca',
      type: 'newspaper',
      priority: reputation >= 80 ? 'critical' : 'medium',
      status: 'pending',
      topic: 'European transfer interest exclusive',
      reach: seededInt(seed + 65, 600000, 2500000),
    },
  ];
}

// ============================================================
// SVG Helper: Build points string from coordinate array
// ============================================================
function buildPoints(coords: Array<{ x: number; y: number }>): string {
  return coords.map((c) => `${c.x},${c.y}`).join(' ');
}

// ============================================================
// SVG 1: Press Conference Impact Bars (4 bars)
// ============================================================
function PressConferenceImpactBars({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}): React.JSX.Element {
  const maxVal = 15;
  const width = 300;
  const height = 160;
  const padX = 80;
  const barH = 20;
  const gap = 12;
  const chartW = width - padX - 50;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 300 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {data.map((d, i) => {
        const y = 8 + i * (barH + gap);
        const clampedVal = Math.max(d.value, -maxVal);
        const barWidth = (Math.abs(clampedVal) / maxVal) * chartW;
        const isPositive = d.value >= 0;
        return (
          <g key={i}>
            <text
              x={padX - 6}
              y={y + barH / 2 + 4}
              textAnchor={"end" as const}
              fill="#8b949e"
              fontSize="10"
              fontFamily="sans-serif"
            >
              {d.label}
            </text>
            <rect
              x={padX}
              y={y}
              width={chartW}
              height={barH}
              fill="#21262d"
              rx="3"
            />
            <rect
              x={padX}
              y={y}
              width={barWidth}
              height={barH}
              fill={isPositive ? d.color : '#ef4444'}
              rx="3"
            />
            <text
              x={padX + barWidth + 6}
              y={y + barH / 2 + 4}
              textAnchor={"start" as const}
              fill={isPositive ? '#c9d1d9' : '#ef4444'}
              fontSize="10"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {isPositive ? `+${d.value}` : d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 2: Media Mood Gauge (semi-circular)
// ============================================================
function MediaMoodGauge({
  value,
  label,
}: {
  value: number;
  label: string;
}): React.JSX.Element {
  const width = 240;
  const height = 150;
  const cx = width / 2;
  const cy = height - 20;
  const radius = 80;
  const strokeWidth = 14;

  const pct = Math.min(value / 100, 1);
  const circumference = Math.PI * radius;
  const filled = circumference * pct;

  const color =
    value >= 70 ? '#10b981' : value >= 45 ? '#f59e0b' : '#ef4444';

  const moodLabel =
    value >= 80 ? 'Excellent' : value >= 60 ? 'Positive' : value >= 40 ? 'Neutral' : value >= 20 ? 'Poor' : 'Hostile';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 240 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="#21262d"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
      />
      <text
        x={cx}
        y={cy - 14}
        textAnchor={"middle" as const}
        fill="#c9d1d9"
        fontSize="28"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {value}
      </text>
      <text
        x={cx}
        y={cy + 4}
        textAnchor={"middle" as const}
        fill={color}
        fontSize="11"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {moodLabel}
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor={"middle" as const}
        fill="#8b949e"
        fontSize="9"
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

// ============================================================
// SVG 3: Response History Timeline (6 dots)
// ============================================================
function ResponseHistoryTimeline({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}): React.JSX.Element {
  const width = 300;
  const height = 80;
  const padX = 30;
  const padY = 30;
  const chartW = width - padX * 2;
  const maxVal = 10;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 300 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1={padX}
        y1={padY}
        x2={width - padX}
        y2={padY}
        stroke="#30363d"
        strokeWidth="2"
      />
      {data.map((v, i) => {
        const x = padX + (i / (data.length - 1)) * chartW;
        const intensity = v / maxVal;
        const fillColor =
          intensity >= 0.7 ? '#10b981' : intensity >= 0.4 ? '#f59e0b' : '#ef4444';
        const r = 6 + intensity * 6;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={padY}
              r={r}
              fill={fillColor}
              fillOpacity={0.2 + intensity * 0.4}
            />
            <circle cx={x} cy={padY} r={4} fill={fillColor} />
            <text
              x={x}
              y={padY + 20}
              textAnchor={"middle" as const}
              fill="#484f58"
              fontSize="8"
              fontFamily="sans-serif"
            >
              {labels[i]}
            </text>
            <text
              x={x}
              y={padY - r - 6}
              textAnchor={"middle" as const}
              fill="#c9d1d9"
              fontSize="9"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {v.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 4: Follower Growth Area Chart (7 days)
// ============================================================
function FollowerGrowthAreaChart({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}): React.JSX.Element {
  const maxVal = Math.max(...data, 1);
  const width = 300;
  const height = 160;
  const padX = 40;
  const padY = 12;
  const chartW = width - padX - 15;
  const chartH = height - padY * 2 - 18;

  const points = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  const areaPath =
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 300 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1={padX}
        y1={padY}
        x2={padX}
        y2={padY + chartH}
        stroke="#21262d"
        strokeWidth="0.5"
      />
      <line
        x1={padX}
        y1={padY + chartH}
        x2={width - 15}
        y2={padY + chartH}
        stroke="#21262d"
        strokeWidth="0.5"
      />
      <text
        x={padX - 4}
        y={padY + 4}
        textAnchor={"end" as const}
        fill="#484f58"
        fontSize="8"
        fontFamily="sans-serif"
      >
        {fmtNumber(maxVal)}
      </text>
      <text
        x={padX - 4}
        y={padY + chartH + 2}
        textAnchor={"end" as const}
        fill="#484f58"
        fontSize="8"
        fontFamily="sans-serif"
      >
        0
      </text>
      <path d={areaPath} fill="#3b82f6" fillOpacity="0.12" />
      <path
        d={linePath}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="#0d1117"
          stroke="#3b82f6"
          strokeWidth="2"
        />
      ))}
      {labels.map((label, i) => {
        const x = padX + (i / (labels.length - 1)) * chartW;
        return (
          <text
            key={i}
            x={x}
            y={height - 4}
            textAnchor={"middle" as const}
            fill="#484f58"
            fontSize="8"
            fontFamily="sans-serif"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 5: Engagement Rate Radar (5-axis)
// ============================================================
function EngagementRateRadar({
  axes,
}: {
  axes: { label: string; value: number }[];
}): React.JSX.Element {
  const size = 240;
  const center = size / 2;
  const maxR = 80;
  const count = axes.length;

  const getPoint = (index: number, r: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const bgLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = axes.map((ax, i) =>
    getPoint(i, (ax.value / 100) * maxR)
  );
  const dataPath =
    dataPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', maxWidth: 240 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {bgLevels.map((level, li) => {
        const pts = Array.from({ length: count }, (_, i) =>
          getPoint(i, maxR * level)
        );
        const path =
          pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') +
          ' Z';
        return (
          <path
            key={li}
            d={path}
            fill="none"
            stroke="#21262d"
            strokeWidth="0.5"
          />
        );
      })}
      {axes.map((_, i) => {
        const p = getPoint(i, maxR);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#21262d"
            strokeWidth="0.5"
          />
        );
      })}
      <path d={dataPath} fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
      ))}
      {axes.map((ax, i) => {
        const labelP = getPoint(i, maxR + 16);
        return (
          <text
            key={i}
            x={labelP.x}
            y={labelP.y}
            textAnchor={"middle" as const}
            fill="#8b949e"
            fontSize="9"
            fontFamily="sans-serif"
          >
            {ax.label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 6: Platform Distribution Donut (4 segments via .reduce())
// ============================================================
function PlatformDistributionDonut({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}): React.JSX.Element {
  const size = 240;
  const center = size / 2;
  const radius = 70;
  const strokeWidth = 24;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  const arcs = segments.reduce<
    Array<{
      seg: { label: string; value: number; color: string };
      startPct: number;
      endPct: number;
      arcLength: number;
      offset: number;
      circumference: number;
    }>
  >((result, seg) => {
    const pct = seg.value / total;
    const circumference = 2 * Math.PI * radius;
    const gap = 4;
    const arcLength = circumference * pct - gap;
    const cumulative = result.reduce((sum, r) => sum + (r.endPct - r.startPct), 0);
    const offset = circumference * cumulative - circumference * 0.25;
    return [
      ...result,
      { seg, startPct: cumulative, endPct: cumulative + pct, arcLength, offset, circumference },
    ];
  }, []);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', maxWidth: 240 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={arc.seg.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.arcLength} ${arc.circumference - arc.arcLength}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="round"
        />
      ))}
      <text
        x={center}
        y={center - 4}
        textAnchor={"middle" as const}
        fill="#c9d1d9"
        fontSize="16"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {fmtNumber(total)}
      </text>
      <text
        x={center}
        y={center + 12}
        textAnchor={"middle" as const}
        fill="#8b949e"
        fontSize="9"
        fontFamily="sans-serif"
      >
        Total Followers
      </text>
      {arcs.map((arc, i) => {
        const angle = ((arc.startPct + arc.endPct) / 2) * Math.PI * 2 - Math.PI / 2;
        const labelR = radius + strokeWidth / 2 + 14;
        const lx = center + labelR * Math.cos(angle);
        const ly = center + labelR * Math.sin(angle);
        const pctVal = Math.round(((arc.endPct - arc.startPct) * 100));
        return (
          <text
            key={`label-${i}`}
            x={lx}
            y={ly}
            textAnchor={"middle" as const}
            fill={arc.seg.color}
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {arc.seg.label} {pctVal}%
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 7: Request Priority Bars (5 bars)
// ============================================================
function RequestPriorityBars({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}): React.JSX.Element {
  const maxVal = 100;
  const width = 300;
  const height = 160;
  const padX = 80;
  const barH = 18;
  const gap = 10;
  const chartW = width - padX - 55;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 300 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {data.map((d, i) => {
        const y = 6 + i * (barH + gap);
        const barWidth = (d.value / maxVal) * chartW;
        return (
          <g key={i}>
            <text
              x={padX - 6}
              y={y + barH / 2 + 4}
              textAnchor={"end" as const}
              fill="#8b949e"
              fontSize="9"
              fontFamily="sans-serif"
            >
              {d.label}
            </text>
            <rect
              x={padX}
              y={y}
              width={chartW}
              height={barH}
              fill="#21262d"
              rx="3"
            />
            <rect
              x={padX}
              y={y}
              width={barWidth}
              height={barH}
              fill={d.color}
              rx="3"
            />
            <text
              x={padX + barWidth + 6}
              y={y + barH / 2 + 4}
              textAnchor={"start" as const}
              fill="#c9d1d9"
              fontSize="9"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 8: Response Rate Ring
// ============================================================
function ResponseRateRing({
  rate,
  accepted,
  declined,
}: {
  rate: number;
  accepted: number;
  declined: number;
}): React.JSX.Element {
  const size = 240;
  const strokeWidth = 16;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;
  const center = size / 2;

  const declinedOffset = circumference - (declined / (accepted + declined || 1)) * circumference;
  const acceptedLen = (accepted / (accepted + declined || 1)) * circumference;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', maxWidth: 240 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#21262d"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#10b981"
        strokeWidth={strokeWidth}
        strokeDasharray={`${acceptedLen} ${circumference - acceptedLen}`}
        strokeDashoffset={-circumference * 0.25}
        strokeLinecap="round"
      />
      <circle
        cx={center}
        cy={center}
        r={radius + strokeWidth + 4}
        fill="none"
        stroke="#21262d"
        strokeWidth={6}
      />
      <circle
        cx={center}
        cy={center}
        r={radius + strokeWidth + 4}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={6}
        strokeDasharray={`${(rate / 100) * 2 * Math.PI * (radius + strokeWidth + 4)} ${2 * Math.PI * (radius + strokeWidth + 4)}`}
        strokeDashoffset={-(2 * Math.PI * (radius + strokeWidth + 4)) * 0.25}
        strokeLinecap="round"
      />
      <text
        x={center}
        y={center - 6}
        textAnchor={"middle" as const}
        fill="#c9d1d9"
        fontSize="24"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {rate}%
      </text>
      <text
        x={center}
        y={center + 12}
        textAnchor={"middle" as const}
        fill="#3b82f6"
        fontSize="10"
        fontFamily="sans-serif"
      >
        Response Rate
      </text>
      <text
        x={center}
        y={center + 26}
        textAnchor={"middle" as const}
        fill="#8b949e"
        fontSize="9"
        fontFamily="sans-serif"
      >
        {accepted} accepted / {declined} declined
      </text>
    </svg>
  );
}

// ============================================================
// SVG 9: Media Outlet Rating Bars (6 outlets)
// ============================================================
function MediaOutletRatingBars({
  data,
}: {
  data: { label: string; rating: number; color: string }[];
}): React.JSX.Element {
  const maxVal = 10;
  const width = 300;
  const height = 180;
  const padX = 80;
  const barH = 16;
  const gap = 12;
  const chartW = width - padX - 55;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 300 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {data.map((d, i) => {
        const y = 6 + i * (barH + gap);
        const barWidth = (d.rating / maxVal) * chartW;
        return (
          <g key={i}>
            <text
              x={padX - 6}
              y={y + barH / 2 + 4}
              textAnchor={"end" as const}
              fill="#8b949e"
              fontSize="9"
              fontFamily="sans-serif"
            >
              {d.label}
            </text>
            <rect
              x={padX}
              y={y}
              width={chartW}
              height={barH}
              fill="#21262d"
              rx="3"
            />
            <rect
              x={padX}
              y={y}
              width={barWidth}
              height={barH}
              fill={d.color}
              rx="3"
            />
            <text
              x={padX + barWidth + 6}
              y={y + barH / 2 + 4}
              textAnchor={"start" as const}
              fill="#c9d1d9"
              fontSize="9"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {d.rating.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 10: Public Image Hex Radar (6-axis)
// ============================================================
function PublicImageHexRadar({
  axes,
}: {
  axes: { label: string; value: number }[];
}): React.JSX.Element {
  const size = 240;
  const center = size / 2;
  const maxR = 80;
  const count = axes.length;

  const getPoint = (index: number, r: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const bgLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = axes.map((ax, i) =>
    getPoint(i, (ax.value / 100) * maxR)
  );
  const dataPath =
    dataPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ') + ' Z';

  const outerPts = Array.from({ length: count }, (_, i) => getPoint(i, maxR));
  const outerPolyPoints = buildPoints(outerPts);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: '100%', maxWidth: 240 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {bgLevels.map((level, li) => {
        const pts = Array.from({ length: count }, (_, i) =>
          getPoint(i, maxR * level)
        );
        const polyPoints = buildPoints(pts);
        return (
          <polygon
            key={li}
            points={polyPoints}
            fill="none"
            stroke="#21262d"
            strokeWidth="0.5"
          />
        );
      })}
      <polygon
        points={outerPolyPoints}
        fill="none"
        stroke="#30363d"
        strokeWidth="1"
      />
      {axes.map((_, i) => {
        const p = getPoint(i, maxR);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#21262d"
            strokeWidth="0.5"
          />
        );
      })}
      <path d={dataPath} fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f59e0b" />
      ))}
      {axes.map((ax, i) => {
        const labelP = getPoint(i, maxR + 18);
        return (
          <text
            key={i}
            x={labelP.x}
            y={labelP.y}
            textAnchor={"middle" as const}
            fill="#8b949e"
            fontSize="9"
            fontFamily="sans-serif"
          >
            {ax.label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 11: Perception Trend Line (8 weeks)
// ============================================================
function PerceptionTrendLine({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}): React.JSX.Element {
  const maxVal = 100;
  const width = 300;
  const height = 160;
  const padX = 36;
  const padY = 12;
  const chartW = width - padX - 15;
  const chartH = height - padY * 2 - 18;

  const points = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 300 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1={padX}
        y1={padY}
        x2={padX}
        y2={padY + chartH}
        stroke="#21262d"
        strokeWidth="0.5"
      />
      <line
        x1={padX}
        y1={padY + chartH}
        x2={width - 15}
        y2={padY + chartH}
        stroke="#21262d"
        strokeWidth="0.5"
      />
      {[
        { y: padY, label: '100' },
        { y: padY + chartH / 2, label: '50' },
        { y: padY + chartH, label: '0' },
      ].map((tick, i) => (
        <text
          key={i}
          x={padX - 4}
          y={tick.y + 3}
          textAnchor={"end" as const}
          fill="#484f58"
          fontSize="8"
          fontFamily="sans-serif"
        >
          {tick.label}
        </text>
      ))}
      <path
        d={linePath}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="#0d1117"
          stroke="#f59e0b"
          strokeWidth="2"
        />
      ))}
      {labels.map((label, i) => {
        const x = padX + (i / (labels.length - 1)) * chartW;
        return (
          <text
            key={i}
            x={x}
            y={height - 4}
            textAnchor={"middle" as const}
            fill="#484f58"
            fontSize="7"
            fontFamily="sans-serif"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 12: Endorsement Value Bars (5 categories)
// ============================================================
function EndorsementValueBars({
  data,
}: {
  data: { label: string; value: number; trend: 'up' | 'down' | 'stable'; color: string }[];
}): React.JSX.Element {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const width = 300;
  const height = 160;
  const padX = 80;
  const barH = 18;
  const gap = 10;
  const chartW = width - padX - 60;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: 300 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {data.map((d, i) => {
        const y = 6 + i * (barH + gap);
        const barWidth = (d.value / maxVal) * chartW;
        const trendIcon =
          d.trend === 'up' ? '▲' : d.trend === 'down' ? '▼' : '●';
        const trendColor =
          d.trend === 'up' ? '#10b981' : d.trend === 'down' ? '#ef4444' : '#8b949e';
        return (
          <g key={i}>
            <text
              x={padX - 6}
              y={y + barH / 2 + 4}
              textAnchor={"end" as const}
              fill="#8b949e"
              fontSize="9"
              fontFamily="sans-serif"
            >
              {d.label}
            </text>
            <rect
              x={padX}
              y={y}
              width={chartW}
              height={barH}
              fill="#21262d"
              rx="3"
            />
            <rect
              x={padX}
              y={y}
              width={barWidth}
              height={barH}
              fill={d.color}
              rx="3"
            />
            <text
              x={padX + barWidth + 6}
              y={y + barH / 2 + 4}
              textAnchor={"start" as const}
              fill="#c9d1d9"
              fontSize="9"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {fmtCurrency(d.value)}
            </text>
            <text
              x={padX + chartW + 46}
              y={y + barH / 2 + 4}
              textAnchor={"start" as const}
              fill={trendColor}
              fontSize="10"
              fontFamily="sans-serif"
            >
              {trendIcon}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// Tab definitions
// ============================================================
const TABS: TabDef[] = [
  { id: 'press_conferences', label: 'Press Conferences', icon: <Mic className="h-4 w-4" /> },
  { id: 'social_media', label: 'Social Media', icon: <Share2 className="h-4 w-4" /> },
  { id: 'interview_requests', label: 'Interviews', icon: <Newspaper className="h-4 w-4" /> },
  { id: 'public_image', label: 'Public Image', icon: <Star className="h-4 w-4" /> },
];

// ============================================================
// Priority color helper
// ============================================================
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#3b82f6';
    case 'low': return '#8b949e';
    default: return '#484f58';
  }
}

function getPriorityBg(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'medium': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'low': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }
}

// ============================================================
// Main Component
// ============================================================
export default function MediaInteraction(): React.JSX.Element {
  const gameState = useGameStore((state) => state.gameState);
  const setScreen = useGameStore((state) => state.setScreen);

  const [activeTab, setActiveTab] = useState<TabId>('press_conferences');
  const [selectedConference, setSelectedConference] = useState<string | null>(null);

  // ---- Derived data (plain assignments, no useMemo) ----
  const playerName = gameState?.player?.name ?? 'Unknown';
  const clubName = gameState?.currentClub?.name ?? 'Unknown Club';
  const reputation = gameState?.player?.reputation ?? 50;
  const overall = gameState?.player?.overall ?? 60;
  const morale = gameState?.player?.morale ?? 65;
  const form = gameState?.player?.form ?? 6.0;
  const recentResults = gameState?.recentResults ?? [];
  const season = gameState?.currentSeason ?? 1;
  const week = gameState?.currentWeek ?? 1;
  const careerGoals = gameState?.player?.careerStats?.totalGoals ?? 0;
  const seasonGoals = gameState?.player?.seasonStats?.goals ?? 0;
  const seasonAssists = gameState?.player?.seasonStats?.assists ?? 0;
  const appearances = gameState?.player?.seasonStats?.appearances ?? 0;
  const avgRating = gameState?.player?.seasonStats?.averageRating ?? 0;
  const agentQuality = gameState?.player?.agentQuality ?? 30;
  const traits = gameState?.player?.traits ?? [];
  const socialFeed = gameState?.socialFeed ?? [];

  const seed = season * 100 + week;

  if (!gameState) {
    return <></>;
  }

  // ---- Generate synthesized data ----
  const pressConferences = generatePressConferences(seed, playerName, clubName, recentResults.length, form);
  const socialPosts = generateSocialPosts(seed, playerName, clubName);
  const interviewRequests = generateInterviewRequests(seed, playerName, reputation);

  // ---- Press Conference Tab Data ----
  const completedConferences = pressConferences.filter((pc) => pc.status === 'completed');
  const avgMood = completedConferences.length > 0
    ? Math.round(completedConferences.reduce((sum, pc) => sum + pc.mood, 0) / completedConferences.length)
    : 50;
  const avgImpact = completedConferences.length > 0
    ? {
        reputation: Math.round(completedConferences.reduce((s, pc) => s + pc.impact.reputation, 0) / completedConferences.length),
        morale: Math.round(completedConferences.reduce((s, pc) => s + pc.impact.morale, 0) / completedConferences.length),
        fanSupport: Math.round(completedConferences.reduce((s, pc) => s + pc.impact.fanSupport, 0) / completedConferences.length),
        mediaRelation: Math.round(completedConferences.reduce((s, pc) => s + pc.impact.mediaRelation, 0) / completedConferences.length),
      }
    : { reputation: 0, morale: 0, fanSupport: 0, mediaRelation: 0 };

  const impactBarsData = [
    { label: 'Reputation', value: avgImpact.reputation, color: '#f59e0b' },
    { label: 'Morale', value: avgImpact.morale, color: '#10b981' },
    { label: 'Fan Support', value: avgImpact.fanSupport, color: '#3b82f6' },
    { label: 'Media Relation', value: avgImpact.mediaRelation, color: '#8b5cf6' },
  ];

  const responseTimelineData = completedConferences.map((pc) =>
    pc.mood > 70 ? 8.5 + seededRandom(seed + pc.mood) * 1.5 : pc.mood > 40 ? 5.0 + seededRandom(seed + pc.mood + 1) * 3.5 : 2.0 + seededRandom(seed + pc.mood + 2) * 3.0
  );
  while (responseTimelineData.length < 6) {
    responseTimelineData.push(seededRange(seed + responseTimelineData.length * 7, 3, 9));
  }
  const timelineLabels = ['PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6'];

  // ---- Social Media Tab Data ----
  const followerGrowthData = Array.from({ length: 7 }, (_, i) =>
    seededInt(seed + 70 + i * 3, 1000, 15000) * (1 + reputation / 80)
  );
  const followerLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const engagementAxes = [
    { label: 'Likes', value: Math.min(100, 30 + reputation * 0.7) },
    { label: 'Comments', value: Math.min(100, 20 + reputation * 0.5 + form * 3) },
    { label: 'Shares', value: Math.min(100, 15 + reputation * 0.4) },
    { label: 'Reach', value: Math.min(100, 25 + reputation * 0.6) },
    { label: 'Virality', value: Math.min(100, 10 + reputation * 0.3 + seasonGoals * 2) },
  ];

  const platformSegments = [
    { label: 'Instagram', value: seededInt(seed + 80, 30, 45), color: '#E1306C' },
    { label: 'Twitter', value: seededInt(seed + 81, 20, 35), color: '#1DA1F2' },
    { label: 'TikTok', value: seededInt(seed + 82, 15, 30), color: '#00F2EA' },
    { label: 'YouTube', value: seededInt(seed + 83, 5, 20), color: '#FF0000' },
  ];

  // ---- Interview Requests Tab Data ----
  const pendingRequests = interviewRequests.filter((ir) => ir.status === 'pending');
  const acceptedCount = interviewRequests.filter((ir) => ir.status === 'accepted').length;
  const declinedCount = interviewRequests.filter((ir) => ir.status === 'declined').length;
  const totalRequests = interviewRequests.length;
  const responseRate = totalRequests > 0 ? Math.round(((acceptedCount + declinedCount) / totalRequests) * 100) : 0;

  const priorityBarsData = [
    { label: 'Critical', value: interviewRequests.filter((ir) => ir.priority === 'critical').length * 20, color: '#ef4444' },
    { label: 'High', value: interviewRequests.filter((ir) => ir.priority === 'high').length * 20, color: '#f59e0b' },
    { label: 'Medium', value: interviewRequests.filter((ir) => ir.priority === 'medium').length * 20, color: '#3b82f6' },
    { label: 'Low', value: interviewRequests.filter((ir) => ir.priority === 'low').length * 20, color: '#8b949e' },
    { label: 'Total', value: Math.min(totalRequests * 15, 100), color: '#6366f1' },
  ];

  const outletRatings = [
    { label: 'Sky Sports', rating: seededRange(seed + 90, 5, 10), color: '#ef4444' },
    { label: 'BBC Sport', rating: seededRange(seed + 91, 5, 10), color: '#8b949e' },
    { label: 'The Athletic', rating: seededRange(seed + 92, 4, 9), color: '#f59e0b' },
    { label: 'ESPN FC', rating: seededRange(seed + 93, 4, 9), color: '#ef4444' },
    { label: 'TalkSport', rating: seededRange(seed + 94, 3, 8), color: '#3b82f6' },
    { label: 'Marca', rating: seededRange(seed + 95, 3, 8), color: '#f59e0b' },
  ];

  // ---- Public Image Tab Data ----
  const imageScore = Math.min(100, Math.round(
    reputation * 0.35 +
    morale * 0.2 +
    Math.min(form * 10, 100) * 0.15 +
    avgRating * 10 * 0.15 +
    (traits.includes('media_darling') ? 15 : 0) +
    (traits.includes('fan_favorite') ? 10 : 0) +
    agentQuality * 0.1
  ));

  const publicImageAxes = [
    { label: 'Charisma', value: Math.min(100, 30 + morale * 0.4 + (traits.includes('media_darling') ? 20 : 0)) },
    { label: 'Sportsmanship', value: Math.min(100, 40 + (gameState.player.seasonStats.redCards ?? 0) > 0 ? -20 : 10) },
    { label: 'Fan Appeal', value: Math.min(100, 25 + reputation * 0.5 + (traits.includes('fan_favorite') ? 20 : 0)) },
    { label: 'Marketability', value: Math.min(100, 20 + reputation * 0.6 + agentQuality * 0.2) },
    { label: 'Leadership', value: Math.min(100, 15 + overall * 0.3 + (traits.includes('leadership') ? 20 : 0)) },
    { label: 'Consistency', value: Math.min(100, form * 10 + appearances * 0.5) },
  ];

  const perceptionTrendData = Array.from({ length: 8 }, (_, i) =>
    Math.max(20, Math.min(95, imageScore + seededRange(seed + 100 + i * 5, -20, 20)))
  );
  const weekLabels = Array.from({ length: 8 }, (_, i) => `W${week - 7 + i}`);

  const endorsementData: Array<{ label: string; value: number; trend: 'up' | 'down' | 'stable'; color: string }> = [
    {
      label: 'Sportswear',
      value: Math.round((reputation >= 70 ? 3000000 : reputation >= 40 ? 1200000 : 300000) * seededRange(seed + 110, 0.8, 1.5)),
      trend: reputation > 50 ? 'up' : 'stable',
      color: '#10b981',
    },
    {
      label: 'Tech & Gaming',
      value: Math.round((reputation >= 60 ? 1500000 : 500000) * seededRange(seed + 111, 0.7, 1.3)),
      trend: form > 7 ? 'up' : 'down',
      color: '#3b82f6',
    },
    {
      label: 'Lifestyle',
      value: Math.round((reputation >= 75 ? 2000000 : 600000) * seededRange(seed + 112, 0.6, 1.4)),
      trend: reputation > 65 ? 'up' : 'stable',
      color: '#f59e0b',
    },
    {
      label: 'Food & Drink',
      value: Math.round((reputation >= 50 ? 800000 : 200000) * seededRange(seed + 113, 0.7, 1.2)),
      trend: 'stable',
      color: '#8b5cf6',
    },
    {
      label: 'Finance',
      value: Math.round((reputation >= 80 ? 5000000 : 1000000) * seededRange(seed + 114, 0.5, 1.5)),
      trend: overall > 80 ? 'up' : 'stable',
      color: '#6366f1',
    },
  ];

  // ---- Render tab content ----
  const renderTabContent = (): React.JSX.Element => {
    switch (activeTab) {
      // ============================================================
      // TAB 1: Press Conferences
      // ============================================================
      case 'press_conferences':
        return (
          <motion.div
            key="press"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Media Mood Gauge */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-400" />
                  Current Media Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <MediaMoodGauge value={avgMood} label="Media Sentiment" />
                  <div className="mt-3 flex gap-4 text-xs text-[#8b949e]">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      Positive ({completedConferences.filter((pc) => pc.mood >= 70).length})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                      Neutral ({completedConferences.filter((pc) => pc.mood >= 40 && pc.mood < 70).length})
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                      Negative ({completedConferences.filter((pc) => pc.mood < 40).length})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Press Conference Impact Bars */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Average Press Conference Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PressConferenceImpactBars data={impactBarsData} />
                <p className="text-xs text-[#484f58] mt-2">
                  Average impact across {completedConferences.length} completed press conferences
                </p>
              </CardContent>
            </Card>

            {/* Response History Timeline */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  Response History Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponseHistoryTimeline data={responseTimelineData} labels={timelineLabels} />
                <p className="text-xs text-[#484f58] mt-2">
                  Response quality rating per conference (0-10 scale)
                </p>
              </CardContent>
            </Card>

            {/* Upcoming Conferences */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <Mic className="h-4 w-4 text-emerald-400" />
                  {pendingPressConferences.length > 0 ? `Upcoming Conferences (${pendingPressConferences.length})` : 'Conference Schedule'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pressConferences.map((pc) => (
                  <div
                    key={pc.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedConference === pc.id
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-[#30363d] bg-[#21262d] hover:border-[#484f58]'
                    }`}
                    onClick={() => setSelectedConference(selectedConference === pc.id ? null : pc.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#c9d1d9] font-medium truncate">{pc.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={`text-[10px] ${
                              pc.type === 'pre_match'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : pc.type === 'post_match'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            } border`}
                          >
                            {pc.type.replace('_', ' ')}
                          </Badge>
                          <Badge
                            className={`text-[10px] ${
                              pc.status === 'upcoming'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                            } border`}
                          >
                            {pc.status}
                          </Badge>
                          <span className="text-[10px] text-[#484f58]">Week {pc.week}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#484f58] flex-shrink-0" />
                    </div>
                    {selectedConference === pc.id && pc.status === 'completed' && pc.response && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 pt-2 border-t border-[#30363d]"
                      >
                        <p className="text-xs text-[#8b949e] mb-1">Your response:</p>
                        <p className="text-sm text-[#c9d1d9] italic">&ldquo;{pc.response}&rdquo;</p>
                        <div className="flex gap-3 mt-2">
                          {pc.impact.reputation !== 0 && (
                            <span className={`text-xs ${pc.impact.reputation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              Rep {pc.impact.reputation > 0 ? '+' : ''}{pc.impact.reputation}
                            </span>
                          )}
                          {pc.impact.morale !== 0 && (
                            <span className={`text-xs ${pc.impact.morale > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              Morale {pc.impact.morale > 0 ? '+' : ''}{pc.impact.morale}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                    {selectedConference === pc.id && pc.status === 'upcoming' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 pt-2 border-t border-[#30363d]"
                      >
                        <p className="text-xs text-[#8b949e]">
                          Prepare your statements. Media mood is currently {Math.round(pc.mood)}/100.
                        </p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );

      // ============================================================
      // TAB 2: Social Media
      // ============================================================
      case 'social_media':
        return (
          <motion.div
            key="social"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Follower Stats Summary */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-3">
                  <p className="text-[10px] text-[#484f58] uppercase tracking-wide">Total Followers</p>
                  <p className="text-xl font-bold text-[#c9d1d9] mt-1">
                    {fmtNumber(Math.round((reputation * 12000 + seasonGoals * 5000 + careerGoals * 2000) * seededRange(seed + 120, 0.8, 1.5)))}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">+{seededInt(seed + 121, 3, 15)}% this month</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-3">
                  <p className="text-[10px] text-[#484f58] uppercase tracking-wide">Engagement Rate</p>
                  <p className="text-xl font-bold text-[#c9d1d9] mt-1">
                    {seededRange(seed + 122, 2, 12).toFixed(1)}%
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {seededRange(seed + 123, 0, 1) > 0.5 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400">Above average</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                        <span className="text-xs text-amber-400">Room to grow</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Follower Growth Area Chart */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Follower Growth (This Week)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FollowerGrowthAreaChart data={followerGrowthData} labels={followerLabels} />
              </CardContent>
            </Card>

            {/* Engagement Rate Radar + Platform Donut */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#c9d1d9] text-xs">Engagement Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <EngagementRateRadar axes={engagementAxes} />
                </CardContent>
              </Card>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#c9d1d9] text-xs">Platform Split</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlatformDistributionDonut segments={platformSegments} />
                </CardContent>
              </Card>
            </div>

            {/* Post History */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  Recent Posts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {socialPosts.map((post) => (
                  <div key={post.id} className="p-3 rounded-lg border border-[#30363d] bg-[#21262d]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px] bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          {post.platform}
                        </Badge>
                        <Badge className="text-[10px] bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          {post.type}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-[#484f58]">{post.timestamp}</span>
                    </div>
                    <p className="text-sm text-[#c9d1d9] line-clamp-2">{post.content}</p>
                    <div className="flex gap-4 mt-2 text-[#8b949e]">
                      <span className="flex items-center gap-1 text-xs">
                        <ThumbsUp className="h-3 w-3" /> {fmtNumber(post.likes)}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <MessageCircle className="h-3 w-3" /> {fmtNumber(post.comments)}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Share2 className="h-3 w-3" /> {fmtNumber(post.shares)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );

      // ============================================================
      // TAB 3: Interview Requests
      // ============================================================
      case 'interview_requests':
        return (
          <motion.div
            key="interviews"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-[#484f58] uppercase tracking-wide">Pending</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">{pendingRequests.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-[#484f58] uppercase tracking-wide">Accepted</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{acceptedCount}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-[#484f58] uppercase tracking-wide">Declined</p>
                  <p className="text-xl font-bold text-red-400 mt-1">{declinedCount}</p>
                </CardContent>
              </Card>
            </div>

            {/* Request Priority Bars */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-emerald-400" />
                  Request Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RequestPriorityBars data={priorityBarsData} />
              </CardContent>
            </Card>

            {/* Response Rate Ring + Media Outlet Ratings */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#c9d1d9] text-xs">Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponseRateRing rate={responseRate} accepted={acceptedCount} declined={declinedCount} />
                </CardContent>
              </Card>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#c9d1d9] text-xs">Outlet Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <MediaOutletRatingBars data={outletRatings} />
                </CardContent>
              </Card>
            </div>

            {/* Pending Interview Requests */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-emerald-400" />
                  Interview Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {interviewRequests.map((ir) => {
                  const typeIcon =
                    ir.type === 'tv' ? <Tv className="h-3 w-3" /> :
                    ir.type === 'radio' ? <Radio className="h-3 w-3" /> :
                    <Newspaper className="h-3 w-3" />;
                  return (
                    <div
                      key={ir.id}
                      className="p-3 rounded-lg border border-[#30363d] bg-[#21262d]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {typeIcon}
                          <span className="text-sm text-[#c9d1d9] font-medium">{ir.outlet}</span>
                          <Badge className={`text-[10px] border ${getPriorityBg(ir.priority)}`}>
                            {ir.priority}
                          </Badge>
                        </div>
                        {ir.status === 'pending' ? (
                          <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pending
                          </Badge>
                        ) : ir.status === 'accepted' ? (
                          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Accepted
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Declined
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#8b949e] mt-1">{ir.topic}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-[#484f58] flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {fmtNumber(ir.reach)} reach
                        </span>
                        {ir.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-3"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] border-[#484f58] text-[#8b949e] hover:text-red-400 hover:border-red-500/30 px-3"
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        );

      // ============================================================
      // TAB 4: Public Image
      // ============================================================
      case 'public_image':
        return (
          <motion.div
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Overall Public Image Score */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#484f58] uppercase tracking-wide">Public Image Score</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-4xl font-bold text-[#c9d1d9]">{imageScore}</p>
                      <span className="text-sm text-[#8b949e]">/100</span>
                    </div>
                    <p className="text-xs text-[#8b949e] mt-1">
                      {imageScore >= 80 ? 'World-class public figure' :
                       imageScore >= 60 ? 'Well-regarded professional' :
                       imageScore >= 40 ? 'Developing reputation' :
                       'Needs improvement'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Award className="h-8 w-8 text-amber-400 mx-auto" />
                    <p className="text-[10px] text-[#484f58] mt-1">
                      {imageScore >= 75 ? 'Elite Tier' :
                       imageScore >= 50 ? 'Professional' :
                       'Developing'}
                    </p>
                  </div>
                </div>
                <Separator className="bg-[#30363d] my-3" />
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-[10px] text-[#484f58]">Reputation</p>
                    <p className="text-sm font-bold text-[#c9d1d9]">{reputation}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-[#484f58]">Morale</p>
                    <p className="text-sm font-bold text-[#c9d1d9]">{morale}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-[#484f58]">Form</p>
                    <p className="text-sm font-bold text-[#c9d1d9]">{form.toFixed(1)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-[#484f58]">Overall</p>
                    <p className="text-sm font-bold text-[#c9d1d9]">{overall}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Image Hex Radar + Perception Trend */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#c9d1d9] text-xs">Image Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <PublicImageHexRadar axes={publicImageAxes} />
                </CardContent>
              </Card>
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#c9d1d9] text-xs">Perception Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <PerceptionTrendLine data={perceptionTrendData} labels={weekLabels} />
                </CardContent>
              </Card>
            </div>

            {/* Endorsement Value Bars */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  Endorsement Value by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EndorsementValueBars data={endorsementData} />
                <p className="text-xs text-[#484f58] mt-2">
                  Total estimated endorsement value:{' '}
                  <span className="text-emerald-400 font-medium">
                    {fmtCurrency(endorsementData.reduce((sum, d) => sum + d.value, 0))}
                  </span>{' '}
                  per year
                </p>
              </CardContent>
            </Card>

            {/* Perception Breakdown Cards */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Perception Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {publicImageAxes.map((axis) => (
                  <div key={axis.label} className="flex items-center gap-3">
                    <span className="text-xs text-[#8b949e] w-24 flex-shrink-0">{axis.label}</span>
                    <div className="flex-1 h-2 rounded bg-[#21262d]">
                      <div
                        className="h-2 rounded bg-amber-500"
                        style={{ width: `${axis.value}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#c9d1d9] w-8 text-right">{Math.round(axis.value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Active Traits Impact */}
            {traits.length > 0 && (
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#c9d1d9] text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Trait Impact on Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {traits.map((trait) => (
                      <Badge
                        key={trait}
                        className={`text-xs border ${
                          trait === 'media_darling'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : trait === 'fan_favorite'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : trait === 'leadership'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}
                      >
                        {trait.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                  {traits.includes('media_darling') && (
                    <p className="text-xs text-amber-400 mt-2">
                      Media Darling: +15 public image bonus from excellent media relations
                    </p>
                  )}
                  {traits.includes('fan_favorite') && (
                    <p className="text-xs text-emerald-400 mt-1">
                      Fan Favorite: +10 public image bonus from strong fan connection
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        );
    }
  };

  const pendingPressConferences = pressConferences.filter((pc) => pc.status === 'upcoming');

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen('dashboard')}
            className="text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-[#c9d1d9] truncate">Media Center</h1>
            <p className="text-[10px] text-[#484f58]">{playerName} — {clubName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Rep {reputation}
            </Badge>
            <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
              S{season} W{week}
            </Badge>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex px-4 gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-lg mx-auto pb-24">
        {renderTabContent()}
      </div>
    </div>
  );
}
