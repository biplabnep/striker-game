'use client';

import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  GraduationCap, Star, TrendingUp, ArrowUpRight, ArrowDownRight,
  Users, Trophy, Calendar, MapPin, Eye, Plus, ChevronRight,
  ChevronDown, Shield, Swords, Target, Dumbbell, Brain,
  Heart, Activity, Search, BookOpen, Award, UserCircle,
  Flame, Clock, BarChart3, Zap, Globe, Flag, ChevronUp,
} from 'lucide-react';

// ============================================================
// Interfaces
// ============================================================

interface PersonalityTrait {
  name: string;
  rating: number; // 1-5
  icon: React.ReactNode;
}

interface LoanedPlayer {
  id: string;
  name: string;
  position: string;
  age: number;
  club: string;
  league: string;
  appearances: number;
  goals: number;
  assists: number;
  avgRating: number;
}

interface TrainingProgram {
  id: string;
  name: string;
  focus: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  assignedCount: number;
  duration: string;
  affectedAttributes: { name: string; progress: number; value: number }[];
}

interface YouthTournament {
  id: string;
  name: string;
  startDate: string;
  category: string;
  format: string;
  groupInfo: string;
  status: 'upcoming' | 'active' | 'completed';
  roundReached?: string;
}

interface AcademyGraduate {
  name: string;
  position: string;
  currentClub: string;
  careerApps: number;
  careerGoals: number;
  yearsAtClub: number;
  nationality: string;
}

interface ScoutingTarget {
  id: string;
  name: string;
  age: number;
  position: string;
  nationality: string;
  flagEmoji: string;
  club: string;
  estimatedOvr: number;
  estimatedPot: number;
  report: string;
  region: string;
}

interface PromotionCandidate {
  id: string;
  name: string;
  age: number;
  position: string;
  overall: number;
  potential: number;
  readiness: 'ready_now' | 'needs_time' | 'loan_recommended';
  reasoning: string;
}

// ============================================================
// Mock Data Generators (seeded from game state)
// ============================================================

function generatePersonalityTraits(seed: string): PersonalityTrait[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const r = (offset: number) => 1 + (Math.abs(hash + offset) % 5);
  return [
    { name: 'Determination', rating: r(0), icon: <Flame className="h-3.5 w-3.5" /> },
    { name: 'Flair', rating: r(42), icon: <Star className="h-3.5 w-3.5" /> },
    { name: 'Leadership', rating: r(97), icon: <Shield className="h-3.5 w-3.5" /> },
    { name: 'Professionalism', rating: r(213), icon: <BookOpen className="h-3.5 w-3.5" /> },
  ];
}

function generateLoanedPlayers(youthTeams: { players: { id: string; name: string; position: string; age: number }[] }[]): LoanedPlayer[] {
  const loanClubs = ['Bristol City', 'Preston North End', 'Derby County', 'Swansea City'];
  const loanLeagues = ['Championship', 'League One', 'Championship', 'Championship'];
  return youthTeams.flatMap(t => t.players).slice(0, 4).map((p, i) => ({
    id: `loan-${p.id}`,
    name: p.name,
    position: p.position,
    age: p.age,
    club: loanClubs[i % loanClubs.length],
    league: loanLeagues[i % loanLeagues.length],
    appearances: 8 + (i * 5),
    goals: i === 0 ? 3 : i === 2 ? 1 : 0,
    assists: i === 1 ? 4 : i === 3 ? 2 : 1,
    avgRating: +(6.4 + i * 0.3).toFixed(1),
  }));
}

function generateTrainingPrograms(): TrainingProgram[] {
  return [
    {
      id: 'tech',
      name: 'Technical Skills',
      focus: 'Passing, Dribbling, Shooting',
      description: 'Individual ball work focusing on close control, passing accuracy, and finishing under pressure.',
      icon: <Target className="h-5 w-5" />,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      assignedCount: 5,
      duration: '8 weeks',
      affectedAttributes: [
        { name: 'Passing', progress: 72, value: 72 },
        { name: 'Dribbling', progress: 65, value: 65 },
        { name: 'Shooting', progress: 58, value: 58 },
      ],
    },
    {
      id: 'phys',
      name: 'Physical Development',
      focus: 'Pace, Strength, Stamina',
      description: 'Athletic conditioning programs designed for youth players to build strength and endurance safely.',
      icon: <Dumbbell className="h-5 w-5" />,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      assignedCount: 4,
      duration: '10 weeks',
      affectedAttributes: [
        { name: 'Pace', progress: 68, value: 68 },
        { name: 'Strength', progress: 55, value: 55 },
        { name: 'Stamina', progress: 74, value: 74 },
      ],
    },
    {
      id: 'tact',
      name: 'Tactical Education',
      focus: 'Positioning, Decision-making, Vision',
      description: 'Classroom and on-pitch tactical sessions covering formations, game intelligence, and positioning.',
      icon: <Brain className="h-5 w-5" />,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      assignedCount: 3,
      duration: '6 weeks',
      affectedAttributes: [
        { name: 'Positioning', progress: 61, value: 61 },
        { name: 'Decisions', progress: 57, value: 57 },
        { name: 'Vision', progress: 63, value: 63 },
      ],
    },
    {
      id: 'mental',
      name: 'Mental Fortitude',
      focus: 'Composure, Concentration, Work Rate',
      description: 'Sports psychology workshops and resilience training to build mental toughness in young players.',
      icon: <Heart className="h-5 w-5" />,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      assignedCount: 6,
      duration: '12 weeks',
      affectedAttributes: [
        { name: 'Composure', progress: 59, value: 59 },
        { name: 'Concentration', progress: 66, value: 66 },
        { name: 'Work Rate', progress: 78, value: 78 },
      ],
    },
  ];
}

function generateTournaments(season: number): YouthTournament[] {
  return [
    {
      id: 'u18-pl',
      name: 'U18 Premier League',
      startDate: `Season ${season}, Week 3`,
      category: 'U18',
      format: 'Round-robin + Knockout',
      groupInfo: 'Group A - 6 teams',
      status: 'active',
    },
    {
      id: 'youth-cup',
      name: 'FA Youth Cup',
      startDate: `Season ${season}, Week 6`,
      category: 'U18',
      format: 'Single-elimination',
      groupInfo: 'Round of 32',
      status: 'active',
      roundReached: 'Quarter-Finals',
    },
    {
      id: 'dallas-cup',
      name: 'Dallas Cup',
      startDate: `Season ${season + 1}, Week 10`,
      category: 'U17',
      format: 'Group + Knockout',
      groupInfo: 'Invitational - 12 teams',
      status: 'upcoming',
    },
    {
      id: 'u21-pl',
      name: 'U21 Premier League 2',
      startDate: `Season ${season}, Week 2`,
      category: 'U21',
      format: 'Round-robin',
      groupInfo: 'Division 1 - 12 teams',
      status: 'active',
    },
  ];
}

function generateGraduates(): AcademyGraduate[] {
  return [
    { name: 'Marcus Albright', position: 'CM', currentClub: 'Aston Villa', careerApps: 187, careerGoals: 24, yearsAtClub: 4, nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Tomás Herrera', position: 'ST', currentClub: 'Real Betis', careerApps: 142, careerGoals: 58, yearsAtClub: 3, nationality: '🇪🇸' },
    { name: 'Kwame Asante', position: 'LB', currentClub: 'Wolverhampton', careerApps: 98, careerGoals: 5, yearsAtClub: 5, nationality: '🇬🇭' },
    { name: 'Liam O\'Connor', position: 'CB', currentClub: 'Brighton', careerApps: 215, careerGoals: 11, yearsAtClub: 6, nationality: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { name: 'Riku Tanaka', position: 'RW', currentClub: 'FC Utrecht', careerApps: 76, careerGoals: 19, yearsAtClub: 2, nationality: '🇯🇵' },
  ];
}

function generateScoutingTargets(): ScoutingTarget[] {
  return [
    {
      id: 'st-1', name: 'Ander Etxeberria', age: 15, position: 'CAM',
      nationality: 'Spain', flagEmoji: '🇪🇸', club: 'Real Sociedad B',
      estimatedOvr: 62, estimatedPot: 88,
      report: 'Exceptional vision and close control. Reads the game 2-3 passes ahead. Needs physical development.',
      region: 'Southern Europe',
    },
    {
      id: 'st-2', name: 'Jean-Paul Mbeki', age: 16, position: 'ST',
      nationality: 'France', flagEmoji: '🇫🇷', club: 'Paris FC U17',
      estimatedOvr: 58, estimatedPot: 86,
      report: 'Explosive pace and natural finisher. Strong in the air for his age. Raw but coachable.',
      region: 'Western Europe',
    },
    {
      id: 'st-3', name: 'Carlos Mendes', age: 14, position: 'CDM',
      nationality: 'Brazil', flagEmoji: '🇧🇷', club: 'Fluminense Youth',
      estimatedOvr: 55, estimatedPot: 90,
      report: 'Outstanding ball-winning ability and composure in possession. Potential world-class anchor.',
      region: 'South America',
    },
    {
      id: 'st-4', name: 'Yuki Ishikawa', age: 17, position: 'LW',
      nationality: 'Japan', flagEmoji: '🇯🇵', club: 'Kashima Antlers Youth',
      estimatedOvr: 64, estimatedPot: 84,
      report: 'Quick feet and excellent dribbling in tight spaces. Good crosser. Needs to add end product.',
      region: 'East Asia',
    },
  ];
}

function generatePromotionCandidates(players: { id: string; name: string; age: number; position: string; overall: number; potential: number }[]): PromotionCandidate[] {
  return players.slice(0, 3).map((p, i) => {
    const gap = p.potential - p.overall;
    const readiness: PromotionCandidate['readiness'] =
      gap <= 5 && p.age >= 19 ? 'ready_now' :
      gap <= 10 && p.age >= 18 ? 'needs_time' : 'loan_recommended';
    const reasonings: Record<PromotionCandidate['readiness'], string> = {
      ready_now: `${p.overall} OVR meets the first-team threshold of 68. ${p.position} position has a need in the squad. At age ${p.age}, he is ready for the step up.`,
      needs_time: `Needs approximately 6 more months of development to close the ${gap}-point gap. ${p.overall} OVR is close but lacks match maturity at age ${p.age}.`,
      loan_recommended: `A loan move would provide invaluable first-team experience. ${gap}-point potential gap requires regular competitive football at a lower level.`,
    };
    return {
      id: p.id,
      name: p.name,
      age: p.age,
      position: p.position,
      overall: p.overall,
      potential: p.potential,
      readiness,
      reasoning: reasonings[readiness],
    };
  });
}

// ============================================================
// Color Helpers
// ============================================================

function getOvrColor(ovr: number): string {
  if (ovr >= 75) return 'text-emerald-400';
  if (ovr >= 65) return 'text-lime-400';
  if (ovr >= 55) return 'text-amber-400';
  return 'text-red-400';
}

function getPotColor(pot: number): string {
  if (pot >= 90) return 'text-amber-400';
  if (pot >= 80) return 'text-emerald-400';
  if (pot >= 70) return 'text-lime-400';
  return 'text-[#8b949e]';
}

function getAttrBarColor(value: number): string {
  if (value >= 75) return 'bg-emerald-500';
  if (value >= 60) return 'bg-lime-500';
  if (value >= 45) return 'bg-amber-500';
  return 'bg-red-500';
}

function getFormDot(form: string): string {
  if (form === 'W') return 'bg-emerald-400';
  if (form === 'D') return 'bg-amber-400';
  return 'bg-red-400';
}

function getReadinessBadge(readiness: PromotionCandidate['readiness']): { label: string; bg: string; text: string } {
  switch (readiness) {
    case 'ready_now':
      return { label: 'Ready Now', bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400' };
    case 'needs_time':
      return { label: 'Needs 6 Months', bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400' };
    case 'loan_recommended':
      return { label: 'Loan Recommended', bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400' };
  }
}

// ============================================================
// SVG: Growth Trajectory Line Chart
// ============================================================

function GrowthTrajectoryChart({
  overall,
  potential,
  age,
}: {
  overall: number;
  potential: number;
  age: number;
}) {
  const startAge = 16;
  const endAge = 23;
  const width = 280;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const ageRange = endAge - startAge;
  const minOvr = Math.min(overall, 45) - 5;
  const maxOvr = Math.max(potential, 80) + 5;
  const ovrRange = maxOvr - minOvr;

  const toX = (a: number) => padding.left + ((a - startAge) / ageRange) * chartW;
  const toY = (o: number) => padding.top + chartH - ((o - minOvr) / ovrRange) * chartH;

  // Generate historical data points (simulated)
  const historicalPoints: { age: number; ovr: number }[] = [];
  const baseOvr = overall - (age - startAge) * 2.5;
  for (let a = startAge; a <= age; a++) {
    const growth = (a - startAge) * 2.5;
    const noise = Math.sin(a * 3.7) * 1.5;
    historicalPoints.push({ age: a, ovr: Math.max(35, Math.round(baseOvr + growth + noise)) });
  }
  historicalPoints.push({ age, ovr: overall });

  // Projected future
  const projectedPoints: { age: number; ovr: number }[] = [];
  const remaining = potential - overall;
  const yearsToPeak = Math.max(1, 23 - age);
  for (let a = age + 1; a <= endAge; a++) {
    const yearsOut = a - age;
    const progress = yearsOut / yearsToPeak;
    const proj = Math.round(overall + remaining * Math.min(1, progress * 0.85 + 0.15 * progress));
    projectedPoints.push({ age: a, ovr: Math.min(potential, proj) });
  }

  const histPath = historicalPoints.map(p => `${toX(p.age)},${toY(p.ovr)}`).join(' ');
  const projPath = [historicalPoints[historicalPoints.length - 1], ...projectedPoints]
    .map(p => `${toX(p.age)},${toY(p.ovr)}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line
          key={pct}
          x1={padding.left}
          y1={padding.top + chartH * (1 - pct)}
          x2={padding.left + chartW}
          y2={padding.top + chartH * (1 - pct)}
          stroke="#30363d"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}
      {/* Y-axis labels */}
      {[0, 0.5, 1].map(pct => (
        <text
          key={pct}
          x={padding.left - 4}
          y={padding.top + chartH * (1 - pct) + 3}
          textAnchor="end"
          className="fill-[#484f58]"
          fontSize={7}
        >
          {Math.round(minOvr + ovrRange * pct)}
        </text>
      ))}
      {/* X-axis labels */}
      {Array.from({ length: ageRange + 1 }, (_, i) => startAge + i).map(a => (
        <text
          key={a}
          x={toX(a)}
          y={height - 4}
          textAnchor="middle"
          className={`fill-[#484f58] ${a <= age ? 'fill-[#8b949e]' : ''}`}
          fontSize={7}
        >
          {a}
        </text>
      ))}
      {/* Potential line (dashed) */}
      <line
        x1={toX(startAge)}
        y1={toY(potential)}
        x2={toX(endAge)}
        y2={toY(potential)}
        stroke="#f59e0b"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.5}
      />
      <text
        x={toX(endAge) - 2}
        y={toY(potential) - 5}
        textAnchor="end"
        className="fill-amber-400"
        fontSize={7}
        fontWeight={600}
      >
        POT {potential}
      </text>
      {/* Historical line */}
      <polyline points={histPath} fill="none" stroke="#34d399" strokeWidth={2} strokeLinejoin="round" />
      {/* Projected line (dashed) */}
      <polyline points={projPath} fill="none" stroke="#34d399" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.6} />
      {/* Current dot */}
      <circle cx={toX(age)} cy={toY(overall)} r={4} fill="#34d399" stroke="#0d1117" strokeWidth={2} />
      {/* Historical dots */}
      {historicalPoints.slice(0, -1).map(p => (
        <circle key={`h-${p.age}`} cx={toX(p.age)} cy={toY(p.ovr)} r={2} fill="#34d399" opacity={0.6} />
      ))}
      {/* Projected dots */}
      {projectedPoints.map(p => (
        <circle key={`p-${p.age}`} cx={toX(p.age)} cy={toY(p.ovr)} r={2} fill="#34d399" opacity={0.3} />
      ))}
    </svg>
  );
}

// ============================================================
// SVG: Mini Radar Chart (6 axes)
// ============================================================

function RadarChart({
  current,
  comparison,
  labels,
}: {
  current: number[];
  comparison?: number[];
  labels: string[];
}) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 55;
  const n = labels.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const toPoint = (i: number, val: number) => {
    const angle = startAngle + i * angleStep;
    return {
      x: cx + r * (val / 100) * Math.cos(angle),
      y: cy + r * (val / 100) * Math.sin(angle),
    };
  };

  const currentPoints = current.map((v, i) => toPoint(i, v));
  const comparisonPoints = comparison?.map((v, i) => toPoint(i, v));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid rings */}
      {[0.33, 0.66, 1.0].map(level => (
        <polygon
          key={level}
          points={Array.from({ length: n }, (_, i) => {
            const angle = startAngle + i * angleStep;
            return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="#30363d"
          strokeWidth={0.5}
          opacity={0.4}
        />
      ))}
      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const angle = startAngle + i * angleStep;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="#30363d"
            strokeWidth={0.5}
            opacity={0.3}
          />
        );
      })}
      {/* Comparison polygon (if provided) */}
      {comparisonPoints && (
        <polygon
          points={comparisonPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(139, 92, 246, 0.1)"
          stroke="#a78bfa"
          strokeWidth={1}
          strokeDasharray="3 2"
          opacity={0.6}
        />
      )}
      {/* Current polygon */}
      <polygon
        points={currentPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(52, 211, 153, 0.12)"
        stroke="#34d399"
        strokeWidth={1.5}
      />
      {/* Current dots + labels */}
      {currentPoints.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={3} fill="#34d399" stroke="#064e3b" strokeWidth={0.5} />
          <text
            x={cx + (r + 12) * Math.cos(startAngle + i * angleStep)}
            y={cy + (r + 12) * Math.sin(startAngle + i * angleStep) + 3}
            textAnchor="middle"
            className="fill-[#8b949e]"
            fontSize={7}
            fontWeight={600}
          >
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG: Tournament Mini Bracket
// ============================================================

function TournamentBracket() {
  const teams = ['Our Club', 'Arsenal', 'Chelsea', 'Man City', 'Liverpool', 'Tottenham', 'Everton', 'West Ham'];
  const results = [
    [2, 1], [3, 0], [1, 2], [0, 1],
  ];
  const semiResults = [
    [2, 1], [1, 3],
  ];

  return (
    <svg width={280} height={140} viewBox="0 0 280 140" className="w-full">
      {/* QF - Left side */}
      {[0, 2].map((ri) => (
        <g key={`qf-${ri}`}>
          <text x={10} y={18 + ri * 56} className="fill-[#c9d1d9]" fontSize={7} fontWeight={600}>{teams[ri * 2]}</text>
          <text x={10} y={28 + ri * 56} className="fill-[#8b949e]" fontSize={7}>{results[ri]?.[0] ?? ''}</text>
          <text x={50} y={18 + ri * 56} className="fill-[#c9d1d9]" fontSize={7}>{teams[ri * 2 + 1]}</text>
          <text x={50} y={28 + ri * 56} className="fill-[#8b949e]" fontSize={7}>{results[ri]?.[1] ?? ''}</text>
          {/* Connector */}
          <line x1={72} y1={23 + ri * 56} x2={90} y2={23 + ri * 56} stroke="#30363d" strokeWidth={0.5} />
        </g>
      ))}
      {/* QF - Right side */}
      {[1, 3].map((ri) => (
        <g key={`qf-r-${ri}`}>
          <text x={120} y={18 + ri * 56} className="fill-[#c9d1d9]" fontSize={7} fontWeight={600}>{teams[ri * 2]}</text>
          <text x={120} y={28 + ri * 56} className="fill-[#8b949e]" fontSize={7}>{results[ri]?.[0] ?? ''}</text>
          <text x={160} y={18 + ri * 56} className="fill-[#c9d1d9]" fontSize={7}>{teams[ri * 2 + 1]}</text>
          <text x={160} y={28 + ri * 56} className="fill-[#8b949e]" fontSize={7}>{results[ri]?.[1] ?? ''}</text>
          <line x1={182} y1={23 + ri * 56} x2={200} y2={23 + ri * 56} stroke="#30363d" strokeWidth={0.5} />
        </g>
      ))}
      {/* SF Left */}
      <line x1={90} y1={23} x2={90} y2={79} stroke="#30363d" strokeWidth={0.5} />
      <line x1={90} y1={51} x2={110} y2={51} stroke="#30363d" strokeWidth={0.5} />
      <text x={115} y={49} className="fill-emerald-400" fontSize={7} fontWeight={600}>Our Club</text>
      <text x={115} y={57} className="fill-[#8b949e]" fontSize={7}>2</text>
      <text x={155} y={49} className="fill-[#c9d1d9]" fontSize={7}>Chelsea</text>
      <text x={155} y={57} className="fill-[#8b949e]" fontSize={7}>1</text>
      {/* SF Right */}
      <line x1={200} y1={23} x2={200} y2={79} stroke="#30363d" strokeWidth={0.5} />
      <line x1={200} y1={51} x2={210} y2={51} stroke="#30363d" strokeWidth={0.5} />
      <text x={215} y={49} className="fill-[#c9d1d9]" fontSize={7}>Liverpool</text>
      <text x={215} y={57} className="fill-[#8b949e]" fontSize={7}>1</text>
      <text x={250} y={49} className="fill-emerald-400" fontSize={7} fontWeight={600}>Man City</text>
      <text x={250} y={57} className="fill-[#8b949e]" fontSize={7}>3</text>
      {/* Final connector */}
      <line x1={175} y1={51} x2={175} y2={110} stroke="#30363d" strokeWidth={0.5} />
      <line x1={175} y1={110} x2={190} y2={110} stroke="#30363d" strokeWidth={0.5} />
      <rect x={190} y={100} width={80} height={20} rx={3} fill="#161b22" stroke="#30363d" strokeWidth={0.5} />
      <text x={230} y={113} textAnchor="middle" className="fill-amber-400" fontSize={8} fontWeight={700}>FINAL</text>
    </svg>
  );
}

// ============================================================
// Section Components
// ============================================================

// 1. Youth Academy Header
function AcademyHeader({
  academyRating,
  youthBudget,
  totalYouth,
  promotedThisSeason,
  firstTeamGrads,
  coachName,
  coachQuality,
}: {
  academyRating: number;
  youthBudget: number;
  totalYouth: number;
  promotedThisSeason: number;
  firstTeamGrads: number;
  coachName: string;
  coachQuality: number;
}) {
  const stars = Math.min(5, Math.max(1, Math.round(academyRating / 20)));
  const levelLabel = academyRating >= 90 ? 'Elite' : academyRating >= 75 ? 'Excellent' : academyRating >= 55 ? 'Good' : academyRating >= 35 ? 'Average' : 'Developing';
  const levelColor = academyRating >= 90 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' :
    academyRating >= 75 ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' :
    academyRating >= 55 ? 'text-blue-400 bg-blue-500/15 border-blue-500/30' :
    'text-[#8b949e] bg-slate-500/15 border-slate-500/30';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold text-white">Youth Development</h1>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${levelColor}`}>
          {levelLabel}
        </span>
      </div>

      {/* Academy Rating Stars */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#8b949e] font-medium uppercase tracking-wider">Academy Rating</span>
          <span className={`text-xl font-black ${getOvrColor(academyRating)}`}>{academyRating}<span className="text-xs text-[#8b949e] font-normal">/100</span></span>
        </div>
        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-[#30363d]'}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Youth Budget</span>
          <span className="text-emerald-400 font-semibold">€{(youthBudget / 1000000).toFixed(1)}M</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Youth Players', value: totalYouth, icon: <Users className="h-4 w-4 text-blue-400" />, bg: 'bg-blue-500/10' },
          { label: 'Promoted This Season', value: promotedThisSeason, icon: <ArrowUpRight className="h-4 w-4 text-emerald-400" />, bg: 'bg-emerald-500/10' },
          { label: 'Grads in First Team', value: firstTeamGrads, icon: <Award className="h-4 w-4 text-amber-400" />, bg: 'bg-amber-500/10' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-lg border border-[#30363d] ${stat.bg} p-3`}>
            <div className="flex items-center gap-1 mb-1">{stat.icon}</div>
            <div className="text-lg font-bold text-white">{stat.value}</div>
            <div className="text-[9px] text-[#8b949e] leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Youth Coach */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#21262d] border border-[#30363d] rounded-lg flex items-center justify-center">
            <UserCircle className="h-4 w-4 text-[#8b949e]" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#c9d1d9]">{coachName}</div>
            <div className="text-[10px] text-[#8b949e]">Head of Youth Development</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-bold ${getOvrColor(coachQuality)}`}>{coachQuality}</div>
          <div className="text-[9px] text-[#8b949e]">Coach Quality</div>
        </div>
      </div>
    </motion.div>
  );
}

// 2. Youth Squad Overview
type SortOption = 'ovr' | 'pot' | 'age' | 'position' | 'growth';

function YouthSquadOverview({
  u18Players,
  u21Players,
  loanedPlayers,
  onViewProfile,
}: {
  u18Players: { id: string; name: string; age: number; position: string; nationality: string; overall: number; potential: number; form: string[]; keyStat: string; growthRate: number }[];
  u21Players: { id: string; name: string; age: number; position: string; nationality: string; overall: number; potential: number; form: string[]; keyStat: string; growthRate: number }[];
  loanedPlayers: LoanedPlayer[];
  onViewProfile: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState('u18');
  const [sortBy, setSortBy] = useState<SortOption>('ovr');

  const sortFn = (a: typeof u18Players[0], b: typeof u18Players[0]): number => {
    switch (sortBy) {
      case 'ovr': return b.overall - a.overall;
      case 'pot': return b.potential - a.potential;
      case 'age': return a.age - b.age;
      case 'position': return a.position.localeCompare(b.position);
      case 'growth': return b.growthRate - a.growthRate;
    }
  };

  const currentPlayers = activeTab === 'u18' ? [...u18Players].sort(sortFn) :
    activeTab === 'u21' ? [...u21Players].sort(sortFn) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      className="space-y-3"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-[#161b22] border border-[#30363d] rounded-lg">
            <TabsTrigger value="u18" className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 rounded-md">
              U18 Squad ({u18Players.length})
            </TabsTrigger>
            <TabsTrigger value="u21" className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 rounded-md">
              U21 Squad ({u21Players.length})
            </TabsTrigger>
            <TabsTrigger value="loaned" className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 rounded-md">
              Loaned Out ({loanedPlayers.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="u18" className="space-y-2 mt-3">
          <SquadSortBar sortBy={sortBy} onSort={setSortBy} />
          <SquadTable players={currentPlayers} onViewProfile={onViewProfile} />
        </TabsContent>

        <TabsContent value="u21" className="space-y-2 mt-3">
          <SquadSortBar sortBy={sortBy} onSort={setSortBy} />
          <SquadTable players={currentPlayers} onViewProfile={onViewProfile} />
        </TabsContent>

        <TabsContent value="loaned" className="space-y-2 mt-3">
          {loanedPlayers.map(lp => (
            <div key={lp.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{lp.name}</div>
                <div className="flex items-center gap-2 text-[10px] text-[#8b949e] mt-0.5">
                  <span>{lp.position}</span>
                  <span>•</span>
                  <span>Age {lp.age}</span>
                  <span>•</span>
                  <span>{lp.club}</span>
                </div>
                <div className="text-[9px] text-[#484f58] mt-0.5">{lp.league}</div>
              </div>
              <div className="flex gap-3 text-center shrink-0 ml-2">
                <div>
                  <div className="text-sm font-bold text-[#c9d1d9]">{lp.appearances}</div>
                  <div className="text-[8px] text-[#484f58]">Apps</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-400">{lp.goals}</div>
                  <div className="text-[8px] text-[#484f58]">Goals</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-400">{lp.assists}</div>
                  <div className="text-[8px] text-[#484f58]">Ast</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-400">{lp.avgRating}</div>
                  <div className="text-[8px] text-[#484f58]">Rtg</div>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function SquadSortBar({ sortBy, onSort }: { sortBy: SortOption; onSort: (s: SortOption) => void }) {
  const options: { value: SortOption; label: string }[] = [
    { value: 'ovr', label: 'OVR' },
    { value: 'pot', label: 'POT' },
    { value: 'age', label: 'Age' },
    { value: 'position', label: 'Pos' },
    { value: 'growth', label: 'Growth' },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      <span className="text-[10px] text-[#484f58] shrink-0">Sort:</span>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onSort(opt.value)}
          className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors shrink-0 ${
            sortBy === opt.value
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-semibold'
              : 'border-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#30363d]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SquadTable({
  players,
  onViewProfile,
}: {
  players: { id: string; name: string; age: number; position: string; nationality: string; overall: number; potential: number; form: string[]; keyStat: string; growthRate: number }[];
  onViewProfile: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {players.map((p) => (
        <div
          key={p.id}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center gap-3"
        >
          {/* Position badge */}
          <div className="shrink-0 w-10 h-10 bg-[#21262d] border border-[#30363d] rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold text-[#c9d1d9]">{p.position}</span>
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-white truncate">{p.name}</span>
              <span className="text-sm">{p.nationality}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-[#8b949e]">Age {p.age}</span>
              <span className="text-[10px] text-[#484f58]">•</span>
              <span className="text-[10px] text-[#8b949e]">{p.keyStat}</span>
            </div>
            {/* Form indicators (last 5) */}
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[8px] text-[#484f58] mr-0.5">Form:</span>
              {p.form.map((f, fi) => (
                <div key={fi} className={`w-3.5 h-3.5 rounded-sm ${getFormDot(f)} flex items-center justify-center`}>
                  <span className="text-[6px] font-bold text-[#0d1117]">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth trend */}
          <div className="flex items-center gap-0.5 shrink-0">
            {p.growthRate > 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
            )}
            <span className={`text-[10px] font-semibold ${p.growthRate > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {p.growthRate > 0 ? '+' : ''}{p.growthRate}
            </span>
          </div>

          {/* OVR / POT */}
          <div className="flex flex-col items-end shrink-0">
            <span className={`text-sm font-black ${getOvrColor(p.overall)}`}>{p.overall}</span>
            <span className={`text-[10px] font-semibold ${getPotColor(p.potential)}`}>{p.potential} POT</span>
          </div>

          {/* View Profile */}
          <button
            onClick={() => onViewProfile(p.id)}
            className="shrink-0 w-8 h-8 bg-[#21262d] border border-[#30363d] rounded-lg flex items-center justify-center hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-[#8b949e]" />
          </button>
        </div>
      ))}
    </div>
  );
}

// 3. Youth Player Profile
function YouthPlayerProfile({
  player,
}: {
  player: {
    id: string;
    name: string;
    age: number;
    position: string;
    nationality: string;
    overall: number;
    potential: number;
    academyYears: number;
    attributes: { name: string; category: string; value: number }[];
    personalityTraits: PersonalityTrait[];
    likelihood: 'High' | 'Medium' | 'Low';
    likelihoodReason: string;
    comparisonStats: number[];
    comparisonName: string;
    trainingRecommendation: string;
    weakAreas: string[];
  };
}) {
  const [showComparison, setShowComparison] = useState(false);
  const radarLabels = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <div className="flex items-center gap-3">
          {/* Photo placeholder */}
          <div className="w-16 h-16 bg-[#21262d] border border-[#30363d] rounded-xl flex items-center justify-center shrink-0">
            <UserCircle className="h-10 w-10 text-[#30363d]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white truncate">{player.name}</h2>
              <span className="text-base">{player.nationality}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Badge className="bg-[#21262d] border-[#30363d] text-[#c9d1d9] text-xs">{player.position}</Badge>
              <span className="text-[10px] text-[#8b949e]">Age {player.age}</span>
              <span className="text-[10px] text-[#8b949e]">Academy: {player.academyYears} yrs</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-2xl font-black ${getOvrColor(player.overall)}`}>{player.overall}</span>
              <ArrowUpRight className="h-4 w-4 text-[#484f58]" />
              <span className={`text-lg font-bold ${getPotColor(player.potential)}`}>{player.potential}</span>
              <span className="text-[10px] text-[#484f58]">POT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attribute Breakdown */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Attributes</h3>
        {['Technical', 'Mental', 'Physical', 'Defending', 'Attacking', 'Goalkeeping'].map(category => {
          const catAttrs = player.attributes.filter(a => a.category === category);
          if (catAttrs.length === 0) return null;
          return (
            <div key={category}>
              <div className="text-[10px] text-[#484f58] font-semibold uppercase mb-1.5">{category}</div>
              <div className="space-y-1">
                {catAttrs.map(attr => (
                  <div key={attr.name} className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8b949e] w-20 shrink-0">{attr.name}</span>
                    <div className="flex-1 h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                      <motion.div
                        className={`h-full rounded-lg ${getAttrBarColor(attr.value)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${attr.value}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold w-6 text-right ${getOvrColor(attr.value)}`}>{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Growth Trajectory */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Growth Trajectory</h3>
        <GrowthTrajectoryChart overall={player.overall} potential={player.potential} age={player.age} />
        <div className="flex items-center gap-3 mt-2 justify-center">
          <span className="flex items-center gap-1 text-[9px] text-emerald-400">
            <span className="w-3 h-0.5 bg-emerald-400 rounded inline-block" /> Actual
          </span>
          <span className="flex items-center gap-1 text-[9px] text-emerald-400 opacity-60">
            <span className="w-3 h-0.5 bg-emerald-400 rounded inline-block" style={{ borderStyle: 'dashed' }} /> Projected
          </span>
          <span className="flex items-center gap-1 text-[9px] text-amber-400 opacity-60">
            <span className="w-3 h-0.5 bg-amber-400 rounded inline-block" style={{ borderStyle: 'dashed' }} /> Potential
          </span>
        </div>
      </div>

      {/* Potential Analysis */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Potential Analysis</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
            player.likelihood === 'High' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
            player.likelihood === 'Medium' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
            'bg-red-500/15 border-red-500/30 text-red-400'
          }`}>
            {player.likelihood} Chance
          </span>
          <span className="text-[10px] text-[#8b949e]">of reaching {player.potential} potential</span>
        </div>
        <p className="text-[10px] text-[#8b949e] leading-relaxed">{player.likelihoodReason}</p>
      </div>

      {/* Radar Comparison */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Comparison</h3>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-[10px] text-emerald-400 flex items-center gap-0.5 hover:text-emerald-300 transition-colors"
          >
            {showComparison ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            vs {player.comparisonName}
          </button>
        </div>
        <RadarChart
          current={player.attributes.slice(0, 6).map(a => a.value)}
          comparison={showComparison ? player.comparisonStats : undefined}
          labels={radarLabels}
        />
        {showComparison && (
          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1 text-[9px] text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-sm inline-block" /> {player.name}
            </span>
            <span className="flex items-center gap-1 text-[9px] text-purple-400">
              <span className="w-2 h-2 bg-purple-400 rounded-sm inline-block" /> {player.comparisonName}
            </span>
          </div>
        )}
      </div>

      {/* Personality Traits */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Personality Traits</h3>
        <div className="grid grid-cols-2 gap-2">
          {player.personalityTraits.map(trait => (
            <div key={trait.name} className="flex items-center gap-2 bg-[#21262d] rounded-lg p-2.5">
              <div className="text-emerald-400 shrink-0">{trait.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-[#c9d1d9] font-medium">{trait.name}</div>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-sm ${i < trait.rating ? 'bg-emerald-400' : 'bg-[#30363d]'}`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#c9d1d9]">{trait.rating}/5</span>
            </div>
          ))}
        </div>
      </div>

      {/* Training Recommendation */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Training Focus</h3>
        </div>
        <p className="text-[10px] text-[#c9d1d9] leading-relaxed">{player.trainingRecommendation}</p>
        <div className="flex flex-wrap gap-1">
          {player.weakAreas.map(area => (
            <span key={area} className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-md">
              {area}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// 4. Youth Training Programs
function YouthTrainingPrograms() {
  const programs = useMemo(() => generateTrainingPrograms(), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-blue-400" />
          Training Programs
        </h2>
        <button className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors">
          <Plus className="h-3 w-3" />
          Create Custom
        </button>
      </div>

      {programs.map(prog => (
        <div key={prog.id} className={`bg-[#161b22] border ${prog.borderColor} rounded-xl p-4 space-y-3`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`${prog.color}`}>{prog.icon}</div>
              <div>
                <h3 className="text-sm font-semibold text-white">{prog.name}</h3>
                <p className="text-[10px] text-[#8b949e]">{prog.focus}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-[#8b949e]">{prog.assignedCount} assigned</div>
              <div className="text-[9px] text-[#484f58]">{prog.duration}</div>
            </div>
          </div>

          <p className="text-[10px] text-[#8b949e] leading-relaxed">{prog.description}</p>

          <div className="space-y-1.5">
            {prog.affectedAttributes.map(attr => (
              <div key={attr.name} className="flex items-center gap-2">
                <span className="text-[10px] text-[#8b949e] w-16 shrink-0">{attr.name}</span>
                <div className="flex-1 h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                  <motion.div
                    className={`h-full rounded-lg ${getAttrBarColor(attr.progress)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${attr.progress}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-[#c9d1d9] w-6 text-right">{attr.value}</span>
              </div>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
            <Plus className="h-3 w-3" />
            Assign Player
          </button>
        </div>
      ))}
    </motion.div>
  );
}

// 5. Youth Tournament Schedule
function YouthTournamentSchedule({ season }: { season: number }) {
  const tournaments = useMemo(() => generateTournaments(season), [season]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.15 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-[#c9d1d9]">Youth Tournaments</h2>
      </div>

      {tournaments.map(t => (
        <div key={t.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{t.name}</h3>
            <Badge className={`text-[9px] px-1.5 py-0.5 rounded-md border ${
              t.status === 'active' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
              t.status === 'upcoming' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
              'bg-[#21262d] border-[#30363d] text-[#8b949e]'
            }`}>
              {t.status === 'active' ? 'Active' : t.status === 'upcoming' ? 'Upcoming' : 'Completed'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-[#8b949e]">
              <Calendar className="h-3 w-3" />
              <span>{t.startDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#8b949e]">
              <Globe className="h-3 w-3" />
              <span>{t.category}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#8b949e]">
              <BarChart3 className="h-3 w-3" />
              <span>{t.format}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#8b949e]">
              <MapPin className="h-3 w-3" />
              <span>{t.groupInfo}</span>
            </div>
          </div>
          {t.roundReached && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
              <Trophy className="h-3 w-3" />
              <span>Currently: {t.roundReached}</span>
            </div>
          )}
        </div>
      ))}

      {/* Active Tournament Bracket */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">FA Youth Cup - Bracket</h3>
        <TournamentBracket />
      </div>

      {/* Tournament History */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">Recent Tournament History</h3>
        {[
          { name: 'FA Youth Cup', result: 'Semi-Final', w: 5, d: 1, l: 1, gf: 14, ga: 5 },
          { name: 'U18 Premier League', result: '2nd Place', w: 18, d: 4, l: 4, gf: 52, ga: 22 },
          { name: 'U21 Premier League 2', result: '4th Place', w: 14, d: 6, l: 6, gf: 40, ga: 28 },
        ].map(hist => (
          <div key={hist.name} className="flex items-center justify-between bg-[#21262d] rounded-lg p-2.5">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-[#c9d1d9]">{hist.name}</div>
              <div className="text-[9px] text-[#8b949e] mt-0.5">
                {hist.w}W {hist.d}D {hist.l}L • {hist.gf}GF {hist.ga}GA
              </div>
            </div>
            <Badge className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 ml-2">
              {hist.result}
            </Badge>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// 6. Promotion & Integration
function PromotionIntegration({
  candidates,
  graduates,
  successRate,
}: {
  candidates: PromotionCandidate[];
  graduates: AcademyGraduate[];
  successRate: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = candidates.find(c => c.id === selectedId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.2 }}
      className="space-y-4"
    >
      {/* Promote Panel */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-[#c9d1d9]">Promote to First Team</h2>
        </div>

        {/* Player selector */}
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="w-full bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#c9d1d9] focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">Select a player to assess...</option>
          {candidates.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.position}, {c.age}yo, {c.overall} OVR)
            </option>
          ))}
        </select>

        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 border-t border-[#30363d] pt-3"
          >
            {/* Readiness Assessment */}
            <div className="space-y-2">
              <h4 className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Readiness Assessment</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#21262d] rounded-lg p-2 text-center">
                  <div className={`text-sm font-bold ${getOvrColor(selected.overall)}`}>{selected.overall}</div>
                  <div className="text-[8px] text-[#484f58]">OVR (min 68)</div>
                </div>
                <div className="bg-[#21262d] rounded-lg p-2 text-center">
                  <div className={`text-sm font-bold ${selected.age >= 19 ? 'text-emerald-400' : 'text-amber-400'}`}>{selected.age}</div>
                  <div className="text-[8px] text-[#484f58]">Age (ideal 19+)</div>
                </div>
                <div className="bg-[#21262d] rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-blue-400">{selected.potential - selected.overall}</div>
                  <div className="text-[8px] text-[#484f58]">Gap to POT</div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className={`rounded-lg border p-3 ${getReadinessBadge(selected.readiness).bg}`}>
              <div className="flex items-center gap-2 mb-1">
                {selected.readiness === 'ready_now' && <Zap className="h-4 w-4 text-emerald-400" />}
                {selected.readiness === 'needs_time' && <Clock className="h-4 w-4 text-amber-400" />}
                {selected.readiness === 'loan_recommended' && <Globe className="h-4 w-4 text-blue-400" />}
                <span className={`text-xs font-bold ${getReadinessBadge(selected.readiness).text}`}>
                  {getReadinessBadge(selected.readiness).label}
                </span>
              </div>
              <p className="text-[10px] text-[#8b949e] leading-relaxed">{selected.reasoning}</p>
            </div>

            {selected.readiness === 'ready_now' && (
              <button className="w-full flex items-center justify-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-500/30 transition-colors">
                <ArrowUpRight className="h-4 w-4" />
                Promote {selected.name}
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Notable Graduates */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#c9d1d9] flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            Notable Graduates
          </h2>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
            {successRate}% success rate
          </span>
        </div>

        {graduates.map(grad => (
          <div key={grad.name} className="flex items-center gap-3 bg-[#21262d] rounded-lg p-2.5">
            <div className="shrink-0 w-9 h-9 bg-[#30363d] rounded-lg flex items-center justify-center text-base">
              {grad.nationality}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{grad.name}</div>
              <div className="text-[9px] text-[#8b949e]">{grad.position} • {grad.yearsAtClub} yrs at academy</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-medium text-[#c9d1d9]">{grad.currentClub}</div>
              <div className="text-[9px] text-[#8b949e]">{grad.careerApps} apps, {grad.careerGoals} goals</div>
            </div>
          </div>
        ))}

        <div className="border-t border-[#30363d] pt-2">
          <p className="text-[9px] text-[#484f58] text-center">
            {successRate}% of academy graduates have made 50+ first-team appearances
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// 7. Scouting Network Integration
function ScoutingNetwork() {
  const targets = useMemo(() => generateScoutingTargets(), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.25 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-[#c9d1d9]">Scouting Network</h2>
      </div>

      {/* Scout Regions */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
        <h3 className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider mb-2">Assigned Scout Regions</h3>
        <div className="flex flex-wrap gap-1.5">
          {['Southern Europe', 'Western Europe', 'South America', 'East Asia', 'Africa'].map(region => (
            <span key={region} className="text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
              <Globe className="h-2.5 w-2.5" />
              {region}
            </span>
          ))}
        </div>
      </div>

      {/* Scouting Targets */}
      {targets.map(target => (
        <div key={target.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{target.flagEmoji}</span>
              <div>
                <h3 className="text-sm font-semibold text-white">{target.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-[#8b949e]">
                  <span>{target.age}yo</span>
                  <span>•</span>
                  <span className="font-medium">{target.position}</span>
                  <span>•</span>
                  <span>{target.club}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-sm font-black ${getOvrColor(target.estimatedOvr)}`}>{target.estimatedOvr}</span>
              <ArrowUpRight className="h-3 w-3 text-[#484f58]" />
              <span className={`text-sm font-bold ${getPotColor(target.estimatedPot)}`}>{target.estimatedPot}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] text-[#484f58]">
            <MapPin className="h-2.5 w-2.5" />
            <span>{target.region}</span>
            <span>•</span>
            <span>{target.nationality}</span>
          </div>

          <p className="text-[10px] text-[#8b949e] leading-relaxed bg-[#21262d] rounded-lg p-2">
            <span className="text-[#484f58] font-semibold">Scout Report: </span>{target.report}
          </p>

          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">
              <Flag className="h-3 w-3" />
              Approach
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors">
              <Eye className="h-3 w-3" />
              Add to Watchlist
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function YouthDevelopment() {
  const gameState = useGameStore(s => s.gameState);
  const setScreen = useGameStore(s => s.setScreen);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const allData = useMemo(() => {
    if (!gameState) return null;

    const youthTeams = gameState.youthTeams ?? [];
    const u18Team = youthTeams.find(t => t.clubId === gameState.currentClub.id && t.category === 'u18');
    const u21Team = youthTeams.find(t => t.clubId === gameState.currentClub.id && t.category === 'u21');
    const allPlayers = [...(u18Team?.players ?? []), ...(u21Team?.players ?? [])];

    const formOptions = ['W', 'D', 'L'];
    const nationalities = ['🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇪🇸', '🇧🇷', '🇫🇷', '🇳🇬', '🇯🇵', '🇩🇪', '🇦🇷'];
    const keyStatMap: Record<string, string[]> = {
      GK: ['Reflexes', 'Handling'],
      CB: ['Heading', 'Tackling'],
      LB: ['Crossing', 'Stamina'],
      RB: ['Crossing', 'Pace'],
      CDM: ['Passing', 'Tackling'],
      CM: ['Passing', 'Vision'],
      CAM: ['Creativity', 'Passing'],
      LW: ['Dribbling', 'Pace'],
      RW: ['Dribbling', 'Pace'],
      ST: ['Finishing', 'Composure'],
      CF: ['Finishing', 'Strength'],
      LM: ['Crossing', 'Stamina'],
      RM: ['Crossing', 'Pace'],
    };

    const squadPlayers = allPlayers.map((p, i) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      position: p.position,
      nationality: nationalities[i % nationalities.length],
      overall: p.overall,
      potential: p.potential,
      form: Array.from({ length: 5 }, (_, fi) => formOptions[(i + fi * 3) % 3]),
      keyStat: (keyStatMap[p.position] ?? ['Pace', 'Shooting'])[i % 2],
      growthRate: p.potential - p.overall,
    }));

    const loaned = generateLoanedPlayers(youthTeams.map(t => ({ players: t.players.map(p => ({ id: p.id, name: p.name, position: p.position, age: p.age })) })));
    const promotions = generatePromotionCandidates(allPlayers.map(p => ({ id: p.id, name: p.name, age: p.age, position: p.position, overall: p.overall, potential: p.potential })));

    const profilePlayers = allPlayers.map((p, i) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      position: p.position,
      nationality: nationalities[i % nationalities.length],
      overall: p.overall,
      potential: p.potential,
      academyYears: gameState.currentSeason - (p.joinedSeason ?? 1) + 1,
      attributes: [
        { name: 'Passing', category: 'Technical', value: p.attributes.passing },
        { name: 'Dribbling', category: 'Technical', value: p.attributes.dribbling },
        { name: 'Shooting', category: 'Technical', value: p.attributes.shooting },
        { name: 'Composure', category: 'Mental', value: Math.min(99, p.attributes.physical + 5) },
        { name: 'Concentration', category: 'Mental', value: Math.min(99, p.attributes.defending + 8) },
        { name: 'Work Rate', category: 'Mental', value: Math.min(99, p.attributes.physical + 3) },
        { name: 'Pace', category: 'Physical', value: p.attributes.pace },
        { name: 'Strength', category: 'Physical', value: Math.min(99, p.attributes.physical) },
        { name: 'Stamina', category: 'Physical', value: Math.min(99, p.attributes.pace - 5) },
        { name: 'Tackling', category: 'Defending', value: p.attributes.defending },
        { name: 'Marking', category: 'Defending', value: Math.min(99, p.attributes.defending - 3) },
        { name: 'Finishing', category: 'Attacking', value: p.attributes.shooting },
        { name: 'Crossing', category: 'Attacking', value: Math.min(99, p.attributes.passing - 5) },
        { name: 'Diving', category: 'Goalkeeping', value: p.attributes.diving ?? 0 },
        { name: 'Handling', category: 'Goalkeeping', value: p.attributes.handling ?? 0 },
        { name: 'Reflexes', category: 'Goalkeeping', value: p.attributes.reflexes ?? 0 },
      ],
      personalityTraits: generatePersonalityTraits(p.id),
      likelihood: (p.potential - p.overall <= 8 ? 'High' : p.potential - p.overall <= 15 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
      likelihoodReason: p.potential - p.overall <= 8
        ? `The gap between current OVR and potential is only ${p.potential - p.overall} points. Consistent training and game time should see ${p.name} reach his ceiling within 12-18 months.`
        : p.potential - p.overall <= 15
        ? `${p.name} has significant room to grow. With the right training program and regular competitive minutes, there is a moderate chance of reaching ${p.potential} potential.`
        : `The ${p.potential - p.overall}-point gap to potential is substantial. Will require exceptional development conditions and regular first-team football to approach the ceiling.`,
      comparisonStats: [78, 72, 75, 70, 65, 73],
      comparisonName: 'First-Team Starter',
      trainingRecommendation: `Based on current attributes, ${p.name} should focus on improving ${p.attributes.passing < p.attributes.shooting ? 'Passing' : 'Shooting'} and ${p.attributes.pace < p.attributes.physical ? 'Pace' : 'Physical Strength'}. These are the primary areas limiting overall development.`,
      weakAreas: [
        ...(p.attributes.pace < 60 ? ['Pace'] : []),
        ...(p.attributes.defending < 60 ? ['Defending'] : []),
        ...(p.attributes.shooting < 60 ? ['Shooting'] : []),
        ...(p.attributes.passing < 60 ? ['Passing'] : []),
      ].slice(0, 3),
    }));

    return {
      academyRating: gameState.currentClub.youthDevelopment,
      youthBudget: Math.round(gameState.currentClub.budget * 0.08),
      totalYouth: allPlayers.length,
      promotedThisSeason: allPlayers.filter(p => p.promotionStatus === 'ready' || p.promotionStatus === 'overdue').length,
      firstTeamGrads: 3,
      coachName: 'David Richardson',
      coachQuality: 78,
      u18Players: squadPlayers.filter(p => allPlayers.find(ap => ap.id === p.id)?.category === 'u18'),
      u21Players: squadPlayers.filter(p => allPlayers.find(ap => ap.id === p.id)?.category === 'u21'),
      loanedPlayers: loaned,
      profilePlayers,
      promotionCandidates: promotions,
      season: gameState.currentSeason,
      successRate: 73,
    };
  }, [gameState]);

  if (!gameState || !allData) return null;

  const selectedProfile = selectedPlayerId
    ? allData.profilePlayers.find(p => p.id === selectedPlayerId)
    : null;

  if (selectedProfile) {
    return (
      <div className="max-w-lg mx-auto px-3 py-4 space-y-1">
        <button
          onClick={() => setSelectedPlayerId(null)}
          className="flex items-center gap-1 text-xs text-[#8b949e] hover:text-[#c9d1d9] transition-colors mb-2"
        >
          <ChevronRight className="h-3 w-3 rotate-180" />
          Back to Squad
        </button>
        <YouthPlayerProfile player={selectedProfile} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-3 py-4 space-y-5">
      {/* 1. Academy Header */}
      <AcademyHeader
        academyRating={allData.academyRating}
        youthBudget={allData.youthBudget}
        totalYouth={allData.totalYouth}
        promotedThisSeason={allData.promotedThisSeason}
        firstTeamGrads={allData.firstTeamGrads}
        coachName={allData.coachName}
        coachQuality={allData.coachQuality}
      />

      {/* 2. Youth Squad Overview */}
      <YouthSquadOverview
        u18Players={allData.u18Players}
        u21Players={allData.u21Players}
        loanedPlayers={allData.loanedPlayers}
        onViewProfile={setSelectedPlayerId}
      />

      {/* 3. Training Programs */}
      <YouthTrainingPrograms />

      {/* 4. Tournament Schedule */}
      <YouthTournamentSchedule season={allData.season} />

      {/* 5. Promotion & Integration */}
      <PromotionIntegration
        candidates={allData.promotionCandidates}
        graduates={generateGraduates()}
        successRate={allData.successRate}
      />

      {/* 6. Scouting Network */}
      <ScoutingNetwork />
    </div>
  );
}
