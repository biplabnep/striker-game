'use client';

import React, { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  User,
  TrendingUp,
  TrendingDown,
  Heart,
  MessageSquare,
  ArrowRightLeft,
  AlertTriangle,
  ThumbsUp,
  Brain,
  Gift,
  ThumbsDown,
  Clock,
  Star,
  Shield,
  Activity,
  Target,
  Briefcase,
  Award,
  ChevronRight,
  X,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Position } from '@/lib/game/types';

// ============================================================
// Types
// ============================================================

interface MeetingEntry {
  id: string;
  type: 'praise' | 'tactics' | 'gift' | 'complain' | 'playing_time' | 'position_change' | 'transfer' | 'private_chat';
  summary: string;
  week: number;
  relationshipChange: number;
}

type RelationshipLabel = 'Poor' | 'Fair' | 'Good' | 'Excellent';

interface DonutSegmentDef {
  label: string;
  value: number;
  color: string;
}

interface ConfidenceBarItem {
  label: string;
  value: number;
  color: string;
}

interface RadarAxis {
  label: string;
  value: number;
}

interface TimelineMilestone {
  label: string;
  week: number;
  active: boolean;
}

interface ScatterPoint {
  name: string;
  approval: number;
  performance: number;
}

// ============================================================
// Constants
// ============================================================

const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

const FEEDBACK_PERFORMANCE = [
  'Your recent form has been excellent. Keep up the good work!',
  'Solid performances lately. The gaffer is pleased with your effort.',
  'Inconsistent form recently. Training harder will help turn it around.',
  'Struggling to make an impact. We need to see more from you in sessions.',
  'Outstanding displays! You are pushing for a starting spot.',
  'Room for improvement. Focus on your decision-making in the final third.',
  'The staff are monitoring your progress closely. Show us what you can do.',
  'Your work rate has been commendable. Keep pushing your limits.',
];

const FEEDBACK_TRAINING = [
  'Training attendance and effort have been top-notch this week.',
  'You could apply yourself more in training sessions.',
  'Consistent training ethic noted. It shows in match performance.',
  'Missed a session this week. Make sure to communicate with staff.',
  'Excellent attitude in drills. The coaches are impressed.',
  'Training intensity needs to improve. The manager has noticed.',
  'Great focus in technical drills. Your touch is improving.',
  'Physical conditioning is on track. Keep up the gym work.',
];

const FEEDBACK_SQUAD_ROLE = [
  'You are an integral part of the first-team setup.',
  'Currently rotating with other players. Prove yourself in training.',
  'The academy path is the right one for your development right now.',
  'You are pushing for more minutes. A strong performance could change things.',
  'Your current role suits your development stage.',
  'The manager sees potential but wants patience from you.',
  'You are on the fringes. Time to step up in training.',
  'A key member of the squad. The team relies on you.',
];

const RESPONSES_PLAYING_TIME = [
  'I understand your ambition. Show me in training and you will get your chance.',
  'We have a balanced rotation. Your time will come, stay patient.',
  'I am monitoring everyone. Perform well when you get the opportunity.',
  'The team comes first. When the moment is right, I will look to you.',
  'Your desire is noted. Prove it on the training ground.',
  'I appreciate the hunger. Keep working hard and the minutes will follow.',
];

const RESPONSES_POSITION_CHANGE = [
  'I will consider it. Let us see how you adapt in training first.',
  'Interesting idea. We will trial you there in the next session.',
  'I have my reasons for playing you there. Trust the process.',
  'We are short in that area actually. It could work.',
  'Not right now, but I will keep it in mind for the future.',
  'I think your current position suits you best, but we can experiment.',
];

const RESPONSES_TRANSFER = [
  'I am not looking to sell you. You are part of my plans.',
  'We will see what offers come in. No promises.',
  'Focus on your football here. Everything else is noise.',
  'If the right offer comes in, we will discuss it. For now, train hard.',
  'I need you here. The squad needs depth and you provide that.',
  'I understand frustration, but leaving is not the answer right now.',
];

const PRIVATE_CHAT_RESPONSES = [
  'Remember: consistency beats talent when talent is not consistent.',
  'Focus on what you can control. Your effort and attitude.',
  'Watch the veterans in training. There is always something to learn.',
  'Recovery is as important as training. Do not neglect rest.',
  'Set small goals each week. They add up over a season.',
  'The fans appreciate effort more than skill. Always give 100%.',
  'Stay humble. The moment you think you have made it, you start declining.',
  'Your career is a marathon, not a sprint. Trust the journey.',
  'Communication on the pitch is key. Talk to your teammates more.',
  'Study your opponents. Preparation is half the battle.',
  'Do not let social media dictate your mood. Stay focused.',
  'A good professional is reliable in every session, not just the big ones.',
];

const MEETING_HISTORY_ICONS: Record<string, React.ReactNode> = {
  praise: <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />,
  tactics: <Brain className="h-3.5 w-3.5 text-blue-400" />,
  gift: <Gift className="h-3.5 w-3.5 text-purple-400" />,
  complain: <ThumbsDown className="h-3.5 w-3.5 text-red-400" />,
  playing_time: <Clock className="h-3.5 w-3.5 text-amber-400" />,
  position_change: <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-400" />,
  transfer: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
  private_chat: <MessageSquare className="h-3.5 w-3.5 text-[#8b949e]" />,
};

// ============================================================
// Helpers
// ============================================================

function getRelationshipLabel(value: number): RelationshipLabel {
  if (value >= 75) return 'Excellent';
  if (value >= 50) return 'Good';
  if (value >= 25) return 'Fair';
  return 'Poor';
}

function getRelationshipColor(value: number): string {
  if (value >= 75) return '#22c55e';
  if (value >= 50) return '#3b82f6';
  if (value >= 25) return '#f59e0b';
  return '#ef4444';
}

function getRelationshipBg(value: number): string {
  if (value >= 75) return 'bg-emerald-500/10 border-emerald-500/20';
  if (value >= 50) return 'bg-blue-500/10 border-blue-500/20';
  if (value >= 25) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function seededChoice<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

// ============================================================
// SVG Helper Functions (extracted per constraint #12)
// ============================================================

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function gaugeArcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const sweep = endDeg - startDeg;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function donutSegmentPath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startDeg);
  const outerEnd = polarToCartesian(cx, cy, outerR, endDeg);
  const innerStart = polarToCartesian(cx, cy, innerR, startDeg);
  const innerEnd = polarToCartesian(cx, cy, innerR, endDeg);
  const sweep = endDeg - startDeg;
  const largeArc = sweep > 180 ? 1 : 0;
  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function hexPointsString(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

function radarDataPointsString(cx: number, cy: number, maxR: number, values: number[]): string {
  return Array.from({ length: values.length }, (_, i) => {
    const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
    const r = (values[i] / 100) * maxR;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

function trendLinePointsString(data: number[], xOff: number, yOff: number, w: number, h: number): string {
  return Array.from({ length: data.length }, (_, i) => {
    const x = xOff + (i / Math.max(1, data.length - 1)) * w;
    const y = yOff + h - (data[i] / 100) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function areaPointsString(data: number[], xOff: number, yOff: number, w: number, h: number): string {
  const line = Array.from({ length: data.length }, (_, i) => {
    const x = xOff + (i / Math.max(1, data.length - 1)) * w;
    const y = yOff + h - (data[i] / 100) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastX = (xOff + w).toFixed(1);
  const firstX = xOff.toFixed(1);
  const baseY = (yOff + h).toFixed(1);
  return `${line} ${lastX},${baseY} ${firstX},${baseY}`;
}

// ============================================================
// SVG Visualization Components
// ============================================================

function ManagerRatingGauge({ rating }: { rating: number }): React.JSX.Element {
  const clamped = Math.min(100, Math.max(0, rating));
  const color = clamped >= 75 ? '#10B981' : clamped >= 50 ? '#3B82F6' : clamped >= 25 ? '#F59E0B' : '#EF4444';
  const endAngle = 180 + (clamped / 100) * 180;
  const bgPath = gaugeArcPath(100, 95, 75, 180, 360);
  const fgPath = clamped > 0 ? gaugeArcPath(100, 95, 75, 180, endAngle) : '';

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-amber-400" />
          Manager Rating
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <svg viewBox="0 0 200 110" className="w-full">
          <path d={bgPath} fill="none" stroke="#21262d" strokeWidth={12} strokeLinecap="round" />
          {fgPath && (
            <path d={fgPath} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" />
          )}
          <text
            x={100}
            y={85}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={28}
            fontWeight={700}
            fill="#e6edf3"
          >
            {clamped}
          </text>
          <text
            x={100}
            y={102}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={10}
            fill="#8b949e"
          >
            out of 100
          </text>
          <text
            x={30}
            y={95}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={9}
            fill="#484f58"
          >
            0
          </text>
          <text
            x={170}
            y={95}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={9}
            fill="#484f58"
          >
            100
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}

function SquadSatisfactionDonut({ segments }: { segments: DonutSegmentDef[] }): React.JSX.Element {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const segmentsWithAngles = segments.reduce<
    Array<{ seg: DonutSegmentDef; startAngle: number; endAngle: number }>
  >((acc, seg) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const sweep = total > 0 ? (seg.value / total) * 360 : 0;
    acc.push({ seg: { ...seg }, startAngle: prevEnd, endAngle: prevEnd + sweep });
    return acc;
  }, []);

  const average = Math.round(
    segments.reduce((sum, s, i) => sum + s.value * (i === 0 ? 100 : i === 1 ? 75 : i === 2 ? 50 : 25), 0) / Math.max(1, total)
  );

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-red-400" />
          Squad Satisfaction
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <svg viewBox="0 0 200 210" className="w-full">
          {segmentsWithAngles.map((arc, i) => (
            <path
              key={i}
              d={donutSegmentPath(100, 95, 70, 42, arc.startAngle, arc.endAngle)}
              fill={arc.seg.color}
              fillOpacity={0.85}
              stroke="#161b22"
              strokeWidth={2}
            />
          ))}
          <text
            x={100}
            y={92}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={18}
            fontWeight={700}
            fill="#e6edf3"
          >
            {average}%
          </text>
          <text
            x={100}
            y={106}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={9}
            fill="#8b949e"
          >
            avg score
          </text>
          {segments.map((seg, i) => (
            <React.Fragment key={i}>
              <rect x={24} y={128 + i * 18} width={8} height={8} fill={seg.color} rx={2} />
              <text
                x={38}
                y={136 + i * 18}
                textAnchor={"start" as "start" | "middle" | "end"}
                fontSize={9}
                fill="#c9d1d9"
              >
                {seg.label}
              </text>
              <text
                x={175}
                y={136 + i * 18}
                textAnchor={"end" as "start" | "middle" | "end"}
                fontSize={9}
                fontWeight={600}
                fill="#e6edf3"
              >
                {seg.value}
              </text>
            </React.Fragment>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}

function BoardConfidenceBars({ data }: { data: ConfidenceBarItem[] }): React.JSX.Element {
  const barWidth = 110;
  const barHeight = 14;
  const startY = 16;
  const gap = 24;

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-blue-400" />
          Board Confidence
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <svg viewBox="0 0 200 148" className="w-full">
          {data.map((item, i) => {
            const y = startY + i * gap;
            const fillWidth = (item.value / 100) * barWidth;
            return (
              <React.Fragment key={i}>
                <text
                  x={0}
                  y={y + 11}
                  textAnchor={"start" as "start" | "middle" | "end"}
                  fontSize={10}
                  fill="#c9d1d9"
                >
                  {item.label}
                </text>
                <rect
                  x={72}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#21262d"
                  rx={3}
                />
                <rect
                  x={72}
                  y={y}
                  width={fillWidth}
                  height={barHeight}
                  fill={item.color}
                  rx={3}
                  fillOpacity={0.85}
                />
                <text
                  x={190}
                  y={y + 11}
                  textAnchor={"end" as "start" | "middle" | "end"}
                  fontSize={10}
                  fontWeight={600}
                  fill="#e6edf3"
                >
                  {item.value}
                </text>
              </React.Fragment>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

function SeasonObjectivesProgressRing({ completed, total }: { completed: number; total: number }): React.JSX.Element {
  const pct = total > 0 ? completed / total : 0;
  const circumference = 2 * Math.PI * 60;
  const dashOffset = circumference * (1 - pct);
  const displayPct = Math.round(pct * 100);

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-emerald-400" />
          Objectives Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex justify-center">
        <svg viewBox="0 0 160 160" className="w-40">
          <circle
            cx={80}
            cy={80}
            r={60}
            fill="none"
            stroke="#21262d"
            strokeWidth={10}
          />
          <circle
            cx={80}
            cy={80}
            r={60}
            fill="none"
            stroke="#10B981"
            strokeWidth={10}
            strokeDasharray={circumference.toFixed(2)}
            strokeDashoffset={dashOffset.toFixed(2)}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
          <text
            x={80}
            y={76}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={24}
            fontWeight={700}
            fill="#e6edf3"
          >
            {displayPct}%
          </text>
          <text
            x={80}
            y={94}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={10}
            fill="#8b949e"
          >
            {completed}/{total} done
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}

function TransferBudgetUtilization({ spent, remaining, earmarked }: { spent: number; remaining: number; earmarked: number }): React.JSX.Element {
  const total = spent + remaining + earmarked;
  const spentPct = total > 0 ? (spent / total) * 100 : 0;
  const earmarkedPct = total > 0 ? (earmarked / total) * 100 : 0;
  const barY = 30;
  const barH = 22;
  const barX = 10;
  const barW = 180;

  function fmtMillions(val: number): string {
    if (val >= 1000000) return `\u20AC${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `\u20AC${(val / 1000).toFixed(0)}K`;
    return `\u20AC${val}`;
  }

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
          Transfer Budget
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <svg viewBox="0 0 200 100" className="w-full">
          <rect x={barX} y={barY} width={barW} height={barH} fill="#21262d" rx={4} />
          <rect
            x={barX}
            y={barY}
            width={(spentPct / 100) * barW}
            height={barH}
            fill="#EF4444"
            rx={4}
            fillOpacity={0.85}
          />
          <rect
            x={barX + (spentPct / 100) * barW}
            y={barY}
            width={(earmarkedPct / 100) * barW}
            height={barH}
            fill="#F59E0B"
            fillOpacity={0.85}
          />
          <text
            x={barX + barW / 2}
            y={barY + barH / 2 + 4}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={9}
            fontWeight={600}
            fill="#e6edf3"
          >
            {fmtMillions(total)}
          </text>
          {[
            { label: 'Spent', value: fmtMillions(spent), color: '#EF4444', yOff: 66 },
            { label: 'Earmarked', value: fmtMillions(earmarked), color: '#F59E0B', yOff: 80 },
            { label: 'Remaining', value: fmtMillions(remaining), color: '#10B981', yOff: 94 },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <rect x={14} y={item.yOff - 7} width={8} height={8} fill={item.color} rx={1} />
              <text
                x={28}
                y={item.yOff}
                textAnchor={"start" as "start" | "middle" | "end"}
                fontSize={9}
                fill="#c9d1d9"
              >
                {item.label}: {item.value}
              </text>
            </React.Fragment>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}

function ManagerWinRateTrend({ data }: { data: number[] }): React.JSX.Element {
  const chartX = 30;
  const chartY = 8;
  const chartW = 150;
  const chartH = 80;

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-blue-400" />
          Win Rate Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <svg viewBox="0 0 200 120" className="w-full">
          {[0, 25, 50, 75, 100].map((val, i) => {
            const y = chartY + chartH - (val / 100) * chartH;
            return (
              <React.Fragment key={i}>
                <line
                  x1={chartX}
                  y1={y}
                  x2={chartX + chartW}
                  y2={y}
                  stroke="#21262d"
                  strokeWidth={1}
                />
                <text
                  x={chartX - 4}
                  y={y + 3}
                  textAnchor={"end" as "start" | "middle" | "end"}
                  fontSize={8}
                  fill="#484f58"
                >
                  {val}
                </text>
              </React.Fragment>
            );
          })}
          <polygon
            points={areaPointsString(data, chartX, chartY, chartW, chartH)}
            fill="#3B82F6"
            fillOpacity={0.12}
          />
          <polyline
            points={trendLinePointsString(data, chartX, chartY, chartW, chartH)}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {data.map((val, i) => {
            const x = chartX + (i / Math.max(1, data.length - 1)) * chartW;
            const y = chartY + chartH - (val / 100) * chartH;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3.5}
                fill="#3B82F6"
                stroke="#161b22"
                strokeWidth={1.5}
              />
            );
          })}
          {data.map((val, i) => {
            const x = chartX + (i / Math.max(1, data.length - 1)) * chartW;
            return (
              <text
                key={i}
                x={x}
                y={chartY + chartH + 14}
                textAnchor={"middle" as "start" | "middle" | "end"}
                fontSize={8}
                fill="#484f58"
              >
                {i + 1}
              </text>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

function TeamMoraleHexRadar({ axes }: { axes: RadarAxis[] }): React.JSX.Element {
  const cx = 100;
  const cy = 100;
  const maxR = 70;
  const levels = [0.33, 0.66, 1.0];
  const values = axes.map(a => a.value);

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-purple-400" />
          Team Morale Radar
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <svg viewBox="0 0 200 200" className="w-full">
          {levels.map((lvl, i) => (
            <polygon
              key={i}
              points={hexPointsString(cx, cy, maxR * lvl)}
              fill="none"
              stroke="#21262d"
              strokeWidth={1}
            />
          ))}
          {axes.map((_, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const ex = cx + maxR * Math.cos(angle);
            const ey = cy + maxR * Math.sin(angle);
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={ex}
                y2={ey}
                stroke="#21262d"
                strokeWidth={1}
              />
            );
          })}
          <polygon
            points={radarDataPointsString(cx, cy, maxR, values)}
            fill="#8B5CF6"
            fillOpacity={0.2}
            stroke="#8B5CF6"
            strokeWidth={2}
          />
          {axes.map((axis, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const lx = cx + (maxR + 14) * Math.cos(angle);
            const ly = cy + (maxR + 14) * Math.sin(angle);
            const anchor = Math.abs(lx - cx) < 5
              ? "middle" as "start" | "middle" | "end"
              : lx > cx
                ? "start" as "start" | "middle" | "end"
                : "end" as "start" | "middle" | "end";
            return (
              <text
                key={i}
                x={lx}
                y={ly + 3}
                textAnchor={anchor}
                fontSize={9}
                fill="#c9d1d9"
              >
                {axis.label}
              </text>
            );
          })}
          {axes.map((axis, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const r = (axis.value / 100) * maxR;
            return (
              <circle
                key={i}
                cx={cx + r * Math.cos(angle)}
                cy={cy + r * Math.sin(angle)}
                r={3}
                fill="#8B5CF6"
                stroke="#161b22"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

function ContractStatusTimeline({ milestones }: { milestones: TimelineMilestone[] }): React.JSX.Element {
  const lineY = 28;
  const startX = 16;
  const endX = 184;
  const span = endX - startX;

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          Contract Milestones
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <svg viewBox="0 0 200 80" className="w-full">
          <line x1={startX} y1={lineY} x2={endX} y2={lineY} stroke="#21262d" strokeWidth={2} strokeLinecap="round" />
          {milestones.map((ms, i) => {
            const x = startX + (i / Math.max(1, milestones.length - 1)) * span;
            const isActive = ms.active;
            return (
              <React.Fragment key={i}>
                <circle
                  cx={x}
                  cy={lineY}
                  r={isActive ? 5 : 4}
                  fill={isActive ? '#10B981' : '#30363d'}
                  stroke={isActive ? '#10B981' : '#484f58'}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text
                  x={x}
                  y={lineY + 16}
                  textAnchor={"middle" as "start" | "middle" | "end"}
                  fontSize={8}
                  fontWeight={isActive ? 600 : 400}
                  fill={isActive ? '#c9d1d9' : '#484f58'}
                >
                  {ms.label}
                </text>
                <text
                  x={x}
                  y={lineY + 27}
                  textAnchor={"middle" as "start" | "middle" | "end"}
                  fontSize={7}
                  fill="#484f58"
                >
                  Wk {ms.week}
                </text>
              </React.Fragment>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

function PressConferenceImpactBars({ data }: { data: ConfidenceBarItem[] }): React.JSX.Element {
  const barWidth = 100;
  const barHeight = 14;
  const startY = 16;
  const gap = 24;

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
          Press Conference Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <svg viewBox="0 0 200 118" className="w-full">
          {data.map((item, i) => {
            const y = startY + i * gap;
            const fillWidth = (item.value / 100) * barWidth;
            return (
              <React.Fragment key={i}>
                <text
                  x={0}
                  y={y + 11}
                  textAnchor={"start" as "start" | "middle" | "end"}
                  fontSize={10}
                  fill="#c9d1d9"
                >
                  {item.label}
                </text>
                <rect
                  x={80}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#21262d"
                  rx={3}
                />
                <rect
                  x={80}
                  y={y}
                  width={fillWidth}
                  height={barHeight}
                  fill={item.color}
                  rx={3}
                  fillOpacity={0.85}
                />
                <text
                  x={186}
                  y={y + 11}
                  textAnchor={"start" as "start" | "middle" | "end"}
                  fontSize={10}
                  fontWeight={600}
                  fill="#e6edf3"
                >
                  {item.value}
                </text>
              </React.Fragment>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

function BoardRelationshipScatter({ members }: { members: ScatterPoint[] }): React.JSX.Element {
  const plotX = 32;
  const plotY = 8;
  const plotW = 156;
  const plotH = 140;

  function toSvgX(val: number): number {
    return plotX + (val / 100) * plotW;
  }
  function toSvgY(val: number): number {
    return plotY + plotH - (val / 100) * plotH;
  }

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-emerald-400" />
          Board Relationship
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <svg viewBox="0 0 200 200" className="w-full">
          {[0, 25, 50, 75, 100].map((val, i) => (
            <React.Fragment key={i}>
              <line
                x1={plotX}
                y1={toSvgY(val)}
                x2={plotX + plotW}
                y2={toSvgY(val)}
                stroke="#21262d"
                strokeWidth={1}
              />
              <line
                x1={toSvgX(val)}
                y1={plotY}
                x2={toSvgX(val)}
                y2={plotY + plotH}
                stroke="#21262d"
                strokeWidth={1}
              />
              <text
                x={plotX - 4}
                y={toSvgY(val) + 3}
                textAnchor={"end" as "start" | "middle" | "end"}
                fontSize={7}
                fill="#484f58"
              >
                {val}
              </text>
            </React.Fragment>
          ))}
          <rect
            x={plotX}
            y={plotY}
            width={plotW}
            height={plotH}
            fill="none"
            stroke="#30363d"
            strokeWidth={1}
          />
          <text
            x={plotX + plotW / 2}
            y={plotY + plotH + 16}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={9}
            fill="#8b949e"
          >
            Approval
          </text>
          <text
            x={10}
            y={plotY + plotH / 2}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={9}
            fill="#8b949e"
            transform={`rotate(-90 10 ${plotY + plotH / 2})`}
          >
            Performance
          </text>
          {members.map((m, i) => (
            <circle
              key={i}
              cx={toSvgX(m.approval)}
              cy={toSvgY(m.performance)}
              r={5}
              fill="#3B82F6"
              fillOpacity={0.75}
              stroke="#161b22"
              strokeWidth={1}
            />
          ))}
          {members.slice(0, 4).map((m, i) => (
            <text
              key={i}
              x={toSvgX(m.approval)}
              y={toSvgY(m.performance) - 8}
              textAnchor={"middle" as "start" | "middle" | "end"}
              fontSize={7}
              fill="#8b949e"
            >
              {m.name.split(' ')[0]}
            </text>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}

function SeasonProgressRing({ current, total }: { current: number; total: number }): React.JSX.Element {
  const pct = total > 0 ? current / total : 0;
  const circumference = 2 * Math.PI * 60;
  const dashOffset = circumference * (1 - pct);
  const displayPct = Math.round(pct * 100);

  return (
    <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-amber-400" />
          Season Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex justify-center">
        <svg viewBox="0 0 160 160" className="w-40">
          <circle
            cx={80}
            cy={80}
            r={60}
            fill="none"
            stroke="#21262d"
            strokeWidth={10}
          />
          <circle
            cx={80}
            cy={80}
            r={60}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={10}
            strokeDasharray={circumference.toFixed(2)}
            strokeDashoffset={dashOffset.toFixed(2)}
            strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
          <text
            x={80}
            y={72}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={22}
            fontWeight={700}
            fill="#e6edf3"
          >
            {current}
          </text>
          <text
            x={80}
            y={90}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={10}
            fill="#8b949e"
          >
            of {total} weeks
          </text>
          <text
            x={80}
            y={104}
            textAnchor={"middle" as "start" | "middle" | "end"}
            fontSize={10}
            fontWeight={600}
            fill="#F59E0B"
          >
            {displayPct}%
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ManagerOffice() {
  const gameState = useGameStore(state => state.gameState);
  const [relationship, setRelationship] = useState(50);
  const [meetingHistory, setMeetingHistory] = useState<MeetingEntry[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'positive' | 'negative' | 'neutral' } | null>(null);
  const [showTransferWarning, setShowTransferWarning] = useState(false);
  const [showPositionSelect, setShowPositionSelect] = useState(false);
  const [showPrivateChat, setShowPrivateChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [requestResponse, setRequestResponse] = useState<string | null>(null);

  const player = gameState?.player;
  const club = gameState?.currentClub;
  const currentWeek = gameState?.currentWeek ?? 1;
  const currentSeason = gameState?.currentSeason ?? 1;

  const managerName = 'Coach Thomas';

  const showToast = useCallback((message: string, type: 'positive' | 'negative' | 'neutral' = 'neutral') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const addMeetingEntry = useCallback((type: MeetingEntry['type'], summary: string, change: number) => {
    const entry: MeetingEntry = {
      id: `${type}-${Date.now()}`,
      type,
      summary,
      week: currentWeek,
      relationshipChange: change,
    };
    setMeetingHistory(prev => [entry, ...prev].slice(0, 5));
    setRelationship(prev => Math.max(0, Math.min(100, prev + change)));
  }, [currentWeek]);

  const handlePraise = useCallback(() => {
    addMeetingEntry('praise', 'You praised the manager', 5);
    showToast('Relationship +5', 'positive');
  }, [addMeetingEntry, showToast]);

  const handleDiscussTactics = useCallback(() => {
    addMeetingEntry('tactics', 'Discussed tactical approach', 2);
    showToast('Relationship +2', 'positive');
  }, [addMeetingEntry, showToast]);

  const handleGift = useCallback(() => {
    addMeetingEntry('gift', 'Gave a small gift to the manager', 3);
    showToast('Relationship +3', 'positive');
  }, [addMeetingEntry, showToast]);

  const handleComplain = useCallback(() => {
    addMeetingEntry('complain', 'Expressed frustration to the manager', -5);
    showToast('Relationship -5', 'negative');
  }, [addMeetingEntry, showToast]);

  const handleRequestPlayingTime = useCallback(() => {
    const response = seededChoice(RESPONSES_PLAYING_TIME, currentWeek + currentSeason * 17);
    setRequestResponse(response);
    addMeetingEntry('playing_time', 'Requested more playing time', 1);
    showToast('Relationship +1', 'neutral');
  }, [currentWeek, currentSeason, addMeetingEntry, showToast]);

  const handleRequestPositionChange = useCallback(() => {
    setShowPositionSelect(true);
  }, []);

  const handlePositionConfirm = useCallback((position: Position) => {
    const response = seededChoice(RESPONSES_POSITION_CHANGE, currentWeek + currentSeason * 23 + position.length);
    setRequestResponse(response);
    setShowPositionSelect(false);
    addMeetingEntry('position_change', `Requested position change to ${position}`, 0);
    showToast('Relationship unchanged', 'neutral');
  }, [currentWeek, currentSeason, addMeetingEntry, showToast]);

  const handleRequestTransfer = useCallback(() => {
    setShowTransferWarning(true);
  }, []);

  const handleTransferConfirm = useCallback(() => {
    const response = seededChoice(RESPONSES_TRANSFER, currentWeek + currentSeason * 31);
    setRequestResponse(response);
    setShowTransferWarning(false);
    addMeetingEntry('transfer', 'Requested a transfer', -3);
    showToast('Relationship -3', 'negative');
  }, [currentWeek, currentSeason, addMeetingEntry, showToast]);

  const handlePrivateChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const response = seededChoice(PRIVATE_CHAT_RESPONSES, currentWeek + chatInput.length * 7 + currentSeason * 13);
    setRequestResponse(response);
    setChatInput('');
    setShowPrivateChat(false);
    addMeetingEntry('private_chat', 'Had a private chat with the manager', 1);
    showToast('Relationship +1', 'positive');
  }, [chatInput, currentWeek, currentSeason, addMeetingEntry, showToast]);

  // Feedback generation using seeded random
  const performanceFeedback = seededChoice(FEEDBACK_PERFORMANCE, currentWeek + currentSeason * 3);
  const trainingFeedback = seededChoice(FEEDBACK_TRAINING, currentWeek + currentSeason * 7);
  const squadRoleFeedback = seededChoice(FEEDBACK_SQUAD_ROLE, currentWeek + currentSeason * 11);

  // Feedback rating based on player stats
  const form = player?.form ?? 6;
  const morale = player?.morale ?? 70;
  const overall = player?.overall ?? 50;
  const squadStatus = player?.squadStatus ?? 'prospect';

  const performanceRating = form >= 7.5 ? 'Excellent' : form >= 6 ? 'Good' : form >= 4 ? 'Needs Work' : 'Critical';
  const performanceColor = form >= 7.5 ? 'text-emerald-400' : form >= 6 ? 'text-amber-400' : 'text-red-400';
  const performanceBg = form >= 7.5 ? 'bg-emerald-500/10 border-emerald-500/20' : form >= 6 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  const trainingRating = morale >= 70 ? 'Strong' : morale >= 50 ? 'Average' : 'Low';
  const trainingColor = morale >= 70 ? 'text-emerald-400' : morale >= 50 ? 'text-amber-400' : 'text-red-400';
  const trainingBg = morale >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : morale >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  const squadRoleLabel = squadStatus === 'starter' ? 'Starter' : squadStatus === 'rotation' || squadStatus === 'bench' ? 'Sub' : 'Academy';
  const squadRoleColor = squadStatus === 'starter' ? 'text-emerald-400' : squadStatus === 'rotation' || squadStatus === 'bench' ? 'text-amber-400' : 'text-[#8b949e]';
  const squadRoleBg = squadStatus === 'starter' ? 'bg-emerald-500/10 border-emerald-500/20' : squadStatus === 'rotation' || squadStatus === 'bench' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#21262d] border-[#30363d]';

  // ============================================================
  // SVG Data Derivation (deterministic, no Math.random in render)
  // ============================================================
  const recentResults = gameState?.recentResults ?? [];
  const clubId = club?.id ?? '';
  const seasonObjectives = gameState?.seasonObjectives ?? [];
  const teamDynamics = gameState?.teamDynamics ?? { morale: 50, cohesion: 50, dressingRoomAtmosphere: 'neutral' as const, playerInfluence: 50, captainRating: 50 };
  const relationships = gameState?.relationships ?? [];
  const budget = club?.budget ?? 50000000;

  // 1. Manager Rating
  const managerRating = Math.min(100, Math.max(0, relationship));

  // 2. Squad Satisfaction (4 segments via reduce-safe map)
  const squadSatisfactionSegments: DonutSegmentDef[] = [
    { label: 'Very Satisfied', value: Math.max(1, Math.round((teamDynamics.morale ?? 50) * 0.3 + (morale * 0.2))), color: '#10B981' },
    { label: 'Satisfied', value: Math.max(1, Math.round((teamDynamics.cohesion ?? 50) * 0.3 + 10)), color: '#3B82F6' },
    { label: 'Neutral', value: Math.max(1, Math.round(30 - (morale * 0.1))), color: '#F59E0B' },
    { label: 'Unhappy', value: Math.max(1, Math.round(20 + (100 - morale) * 0.1)), color: '#EF4444' },
  ];

  // 3. Board Confidence
  const boardConfidenceData: ConfidenceBarItem[] = [
    { label: 'Tactics', value: Math.min(100, Math.round(relationship * 0.7 + overall * 0.3)), color: '#3B82F6' },
    { label: 'Transfers', value: Math.min(100, Math.round(relationship * 0.6 + 20)), color: '#8B5CF6' },
    { label: 'Youth', value: Math.min(100, Math.round((club?.youthDevelopment ?? 50) + 10)), color: '#10B981' },
    { label: 'Finances', value: Math.min(100, Math.round((club?.finances ?? 50) + 5)), color: '#F59E0B' },
    { label: 'Comms', value: Math.min(100, Math.round(relationship * 0.8 + 10)), color: '#64748b' },
  ];

  // 4. Season Objectives Progress (via reduce)
  const objectiveStats = seasonObjectives.reduce(
    (acc, set) => set.objectives.reduce(
      (inner, obj) => ({
        completed: inner.completed + (obj.status === 'completed' ? 1 : 0),
        total: inner.total + 1,
      }),
      acc
    ),
    { completed: 0, total: 0 }
  );

  // 5. Transfer Budget
  const budgetSpent = Math.round(budget * 0.35 + currentWeek * 100000);
  const budgetEarmarked = Math.round(budget * 0.2);
  const budgetRemaining = Math.max(0, budget - budgetSpent - budgetEarmarked);

  // 6. Win Rate Trend (8 data points)
  const rawWinRates = recentResults.slice(-8).map(r => {
    const isHome = r.homeClub.id === clubId;
    const scored = isHome ? r.homeScore : r.awayScore;
    const conceded = isHome ? r.awayScore : r.homeScore;
    return scored > conceded ? 100 : scored === conceded ? 50 : 0;
  });
  const winRateTrendData = Array.from({ length: 8 }, (_, i) => rawWinRates[i] ?? Math.round((form * 10 + i * 5) % 100));

  // 7. Team Morale Radar
  const moraleRadarAxes: RadarAxis[] = [
    { label: 'Confidence', value: Math.min(100, Math.round(morale * 0.8 + overall * 0.2)) },
    { label: 'Motivation', value: Math.min(100, Math.round((teamDynamics.morale ?? 50) * 0.7 + 20)) },
    { label: 'Unity', value: Math.min(100, Math.round((teamDynamics.cohesion ?? 50) * 0.8 + 15)) },
    { label: 'Discipline', value: Math.min(100, Math.round((player?.seasonStats?.yellowCards ?? 0) > 3 ? 40 : 70 + (currentSeason * 5) % 30)) },
    { label: 'Focus', value: Math.min(100, Math.round(form * 10 + 10)) },
    { label: 'Spirit', value: Math.min(100, Math.round((teamDynamics.morale ?? 50) * 0.6 + (teamDynamics.cohesion ?? 50) * 0.3 + 10)) },
  ];

  // 8. Contract Timeline
  const contractMilestones: TimelineMilestone[] = [
    { label: 'Signed', week: 1, active: true },
    { label: 'Review', week: 6, active: currentWeek >= 6 },
    { label: 'Mid-term', week: 13, active: currentWeek >= 13 },
    { label: 'Negotiate', week: 28, active: currentWeek >= 28 },
    { label: 'Deadline', week: 34, active: currentWeek >= 34 },
    { label: 'Expiry', week: 38, active: false },
  ];

  // 9. Press Conference Impact
  const pressImpactData: ConfidenceBarItem[] = [
    { label: 'Pre-match', value: Math.min(100, Math.round(relationship * 0.5 + 30 + (currentWeek % 10))), color: '#3B82F6' },
    { label: 'Post-match', value: Math.min(100, Math.round(form * 8 + 20 + (currentSeason * 7) % 20)), color: '#10B981' },
    { label: 'Transfer Q&A', value: Math.min(100, Math.round(40 + (currentWeek * 3) % 30)), color: '#8B5CF6' },
    { label: 'Season Rev', value: Math.min(100, Math.round(overall * 0.5 + 20)), color: '#F59E0B' },
  ];

  // 10. Board Relationship Scatter (from relationships, padded deterministically)
  const coachRels = relationships.filter(r => r.type === 'coach');
  const boardScatterData: ScatterPoint[] = Array.from({ length: 8 }, (_, i) => {
    const rel = coachRels[i];
    return {
      name: rel?.name ?? `Director ${i + 1}`,
      approval: rel?.affinity ?? (30 + i * 9 + currentSeason * 3) % 100,
      performance: rel ? (rel.affinity + 10 + i * 5) % 100 : (25 + i * 10 + currentWeek) % 100,
    };
  });

  // 11. Season Progress
  const seasonProgressCurrent = Math.min(38, Math.max(1, currentWeek));

  if (!gameState || !player) return null;

  const relLabel = getRelationshipLabel(relationship);
  const relColor = getRelationshipColor(relationship);

  return (
    <div className="p-4 max-w-lg mx-auto pb-20 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-[#c9d1d9]">Manager&apos;s Office</h1>
        <p className="text-xs text-[#8b949e]">Build your relationship with the coaching staff</p>
      </div>

      {/* Toast feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border text-sm font-semibold shadow ${
              toast.type === 'positive'
                ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-400'
                : toast.type === 'negative'
                ? 'bg-red-900/90 border-red-500/30 text-red-400'
                : 'bg-[#21262d] border-[#30363d] text-[#c9d1d9]'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manager Profile Card */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0 border border-[#30363d]">
              <User className="h-7 w-7 text-[#8b949e]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base text-[#c9d1d9]">{managerName}</h2>
              <p className="text-xs text-[#8b949e] mt-0.5">Age 52 &bull; English</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                  4-3-3
                </Badge>
                <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
                  <Activity className="h-2.5 w-2.5 mr-0.5" />
                  Attacking
                </Badge>
                <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e]">
                  Balanced
                </Badge>
              </div>
            </div>
          </div>

          {/* Manager stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-2 rounded-lg bg-[#21262d]">
              <p className="text-lg font-bold text-[#c9d1d9]">12</p>
              <p className="text-[10px] text-[#8b949e]">Years Managed</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#21262d]">
              <p className="text-lg font-bold text-amber-400">3</p>
              <p className="text-[10px] text-[#8b949e]">Trophies Won</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#21262d]">
              <p className="text-lg font-bold text-emerald-400">58%</p>
              <p className="text-[10px] text-[#8b949e]">Win Rate</p>
            </div>
          </div>

          {/* Relationship Meter */}
          <div className="mt-4 pt-3 border-t border-[#30363d]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#8b949e] flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Relationship
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: relColor }}>{relLabel}</span>
                <span className="text-xs font-bold" style={{ color: relColor }}>{relationship}</span>
              </div>
            </div>
            <div className="h-2.5 bg-[#21262d] rounded-md overflow-hidden">
              <motion.div
                className="h-full rounded-md"
                style={{ backgroundColor: relColor }}
                initial={{ width: 0 }}
                animate={{ width: `${relationship}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================
          SVG Visualization: Manager Rating Gauge
          ============================================================ */}
      <ManagerRatingGauge rating={managerRating} />

      {/* SVG Visualization: Squad Satisfaction + Board Confidence (2-col) */}
      <div className="grid grid-cols-2 gap-2">
        <SquadSatisfactionDonut segments={squadSatisfactionSegments} />
        <BoardConfidenceBars data={boardConfidenceData} />
      </div>

      {/* Weekly Feedback Section */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-1">Weekly Feedback</h3>
        <div className="space-y-2">
          {/* Performance */}
          <Card className={`bg-[#161b22] border overflow-hidden ${performanceBg}`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                  <TrendingUp className={`h-4 w-4 ${performanceColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#c9d1d9]">Performance</h4>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 ${performanceBg} ${performanceColor} border`}>
                      {performanceRating}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">{performanceFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training */}
          <Card className={`bg-[#161b22] border overflow-hidden ${trainingBg}`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                  <Target className={`h-4 w-4 ${trainingColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#c9d1d9]">Training</h4>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 ${trainingBg} ${trainingColor} border`}>
                      {trainingRating}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">{trainingFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Squad Role */}
          <Card className={`bg-[#161b22] border overflow-hidden ${squadRoleBg}`}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                  <Briefcase className={`h-4 w-4 ${squadRoleColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#c9d1d9]">Squad Role</h4>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 ${squadRoleBg} ${squadRoleColor} border`}>
                      {squadRoleLabel}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">{squadRoleFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================================
          SVG Visualizations: Objectives + Season Progress (2-col)
          ============================================================ */}
      <div className="grid grid-cols-2 gap-2">
        <SeasonObjectivesProgressRing completed={objectiveStats.completed} total={objectiveStats.total} />
        <SeasonProgressRing current={seasonProgressCurrent} total={38} />
      </div>

      {/* SVG Visualization: Transfer Budget */}
      <TransferBudgetUtilization spent={budgetSpent} remaining={budgetRemaining} earmarked={budgetEarmarked} />

      {/* SVG Visualization: Win Rate Trend */}
      <ManagerWinRateTrend data={winRateTrendData} />

      {/* SVG Visualization: Team Morale Radar */}
      <TeamMoraleHexRadar axes={moraleRadarAxes} />

      {/* ============================================================
          SVG Visualizations: Contract Timeline + Press Conference (2-col)
          ============================================================ */}
      <div className="grid grid-cols-2 gap-2">
        <ContractStatusTimeline milestones={contractMilestones} />
        <PressConferenceImpactBars data={pressImpactData} />
      </div>

      {/* SVG Visualization: Board Relationship Scatter */}
      <BoardRelationshipScatter members={boardScatterData} />

      {/* Manager Response Dialog */}
      <AnimatePresence>
        {requestResponse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setRequestResponse(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-[#8b949e]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#8b949e] mb-1">{managerName} says:</p>
                  <p className="text-sm text-[#c9d1d9] leading-relaxed">&ldquo;{requestResponse}&rdquo;</p>
                </div>
              </div>
              <Button
                onClick={() => setRequestResponse(null)}
                className="w-full mt-4 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg"
              >
                Dismiss
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Position Change Modal */}
      <AnimatePresence>
        {showPositionSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPositionSelect(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#c9d1d9]">Request Position Change</h3>
                <button onClick={() => setShowPositionSelect(false)} className="text-[#8b949e] hover:text-[#c9d1d9]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[#8b949e] mb-3">Select your preferred position:</p>
              <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    onClick={() => handlePositionConfirm(pos)}
                    className="p-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#c9d1d9] transition-colors border border-[#30363d]"
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Warning Modal */}
      <AnimatePresence>
        {showTransferWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTransferWarning(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-sm font-semibold text-[#c9d1d9]">Request Transfer</h3>
              </div>
              <p className="text-xs text-[#8b949e] leading-relaxed mb-4">
                Are you sure? Requesting a transfer will negatively impact your relationship with the manager. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowTransferWarning(false)}
                  variant="outline"
                  className="flex-1 border-[#30363d] text-[#8b949e] hover:bg-[#21262d] rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg"
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Private Chat Modal */}
      <AnimatePresence>
        {showPrivateChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrivateChat(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#c9d1d9]">Private Chat</h3>
                <button onClick={() => setShowPrivateChat(false)} className="text-[#8b949e] hover:text-[#c9d1d9]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[#8b949e] mb-3">Talk to the manager about anything on your mind:</p>
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type your message..."
                className="bg-[#21262d] border-[#30363d] text-[#c9d1d9] text-sm rounded-lg"
                onKeyDown={e => e.key === 'Enter' && handlePrivateChat()}
              />
              <Button
                onClick={handlePrivateChat}
                disabled={!chatInput.trim()}
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Send Message
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Make a Request Section */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-1">Make a Request</h3>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            icon={<Clock className="h-4 w-4 text-amber-400" />}
            label="More Playing Time"
            onClick={handleRequestPlayingTime}
          />
          <ActionButton
            icon={<ArrowRightLeft className="h-4 w-4 text-cyan-400" />}
            label="Position Change"
            onClick={handleRequestPositionChange}
          />
          <ActionButton
            icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
            label="Request Transfer"
            onClick={handleRequestTransfer}
          />
          <ActionButton
            icon={<MessageSquare className="h-4 w-4 text-[#8b949e]" />}
            label="Private Chat"
            onClick={() => setShowPrivateChat(true)}
          />
        </div>
      </div>

      {/* Relationship Actions */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-1">Relationship Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <RelationshipButton
            icon={<ThumbsUp className="h-4 w-4 text-emerald-400" />}
            label="Praise Manager"
            sublabel="+5"
            positive
            onClick={handlePraise}
          />
          <RelationshipButton
            icon={<Brain className="h-4 w-4 text-blue-400" />}
            label="Discuss Tactics"
            sublabel="+2"
            positive
            onClick={handleDiscussTactics}
          />
          <RelationshipButton
            icon={<Gift className="h-4 w-4 text-purple-400" />}
            label="Gift (Cosmetic)"
            sublabel="+3"
            positive
            onClick={handleGift}
          />
          <RelationshipButton
            icon={<ThumbsDown className="h-4 w-4 text-red-400" />}
            label="Complain"
            sublabel="-5"
            onClick={handleComplain}
          />
        </div>
      </div>

      {/* Meeting History */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2 px-1">Recent Interactions</h3>
        {meetingHistory.length === 0 ? (
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
              <p className="text-xs text-[#8b949e]">No interactions yet. Start building your relationship!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {meetingHistory.map(entry => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#161b22] border border-[#30363d]"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
                    {MEETING_HISTORY_ICONS[entry.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#c9d1d9] truncate">{entry.summary}</p>
                    <p className="text-[10px] text-[#8b949e]">Week {entry.week}</p>
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      entry.relationshipChange > 0
                        ? 'text-emerald-400'
                        : entry.relationshipChange < 0
                        ? 'text-red-400'
                        : 'text-[#8b949e]'
                    }`}
                  >
                    {entry.relationshipChange > 0 ? `+${entry.relationshipChange}` : entry.relationshipChange}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="bg-[#161b22] border-[#30363d] cursor-pointer hover:bg-[#1c2128] transition-colors overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-xs font-medium text-[#c9d1d9] leading-tight">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function RelationshipButton({
  icon,
  label,
  sublabel,
  positive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  positive?: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`bg-[#161b22] border cursor-pointer hover:bg-[#1c2128] transition-colors overflow-hidden ${
        positive ? 'border-emerald-500/20' : 'border-red-500/20'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#c9d1d9] leading-tight">{label}</p>
            <p
              className={`text-[10px] font-bold mt-0.5 ${
                positive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {sublabel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
