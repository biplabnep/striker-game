'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShieldAlert, Star, BarChart3, TrendingUp,
  Zap, Target, Shield, Users, Award, Clock, AlertTriangle,
  ChevronRight, Eye, Scale
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface RefereeData {
  id: number;
  name: string;
  rating: number;
  strictness: 'lenient' | 'balanced' | 'strict' | 'harsh';
  matchCount: number;
  nationality: string;
  flag: string;
  specialization: string;
}

interface CardIncidentData {
  id: number;
  match: string;
  minute: number;
  cardType: 'yellow' | 'secondYellow' | 'red';
  reason: string;
  opponent: string;
  matchday: string;
}

interface VARIncidentData {
  id: number;
  match: string;
  minute: number;
  decisionType: 'goal' | 'redCard' | 'penalty' | 'other';
  originalDecision: string;
  varDecision: string;
  overturned: boolean;
  matchday: string;
}

interface DisciplineFactor {
  name: string;
  score: number;
  icon: React.JSX.Element;
  colorClass: string;
}

interface DonutSegment {
  path: string;
  color: string;
  label: string;
  value: number;
  percentage: number;
}

interface FairPlayTeam {
  name: string;
  points: number;
  isPlayer: boolean;
}

// ============================================================
// SVG Helper Functions (outside component)
// ============================================================

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function buildDonutSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

function buildDonutSegments(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  items: { color: string; label: string; value: number }[]
): DonutSegment[] {
  const totalVal = items.reduce((s, it) => s + it.value, 0);
  return items.reduce<DonutSegment[]>(
    (segAcc, item) => {
      const prevAngle = segAcc.length > 0
        ? segAcc.reduce((a, s) => a + s.percentage, 0)
        : 0;
      const pct = totalVal > 0 ? (item.value / totalVal) * 100 : 0;
      const angle = (pct / 100) * 360;
      const path = buildDonutSegmentPath(cx, cy, outerR, innerR, prevAngle, prevAngle + angle);
      return [...segAcc, { path, color: item.color, label: item.label, value: item.value, percentage: pct }];
    },
    []
  );
}

function buildPolygonPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number
): string {
  return Array.from({ length: sides }, (_, idx) => {
    const angle = (2 * Math.PI * idx) / sides - Math.PI / 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    return `${px},${py}`;
  }).join(' ');
}

function buildRadarDataPoints(
  cx: number,
  cy: number,
  maxR: number,
  values: number[],
  sides: number
): string {
  return values.map((val, idx) => {
    const angle = (2 * Math.PI * idx) / sides - Math.PI / 2;
    const r = maxR * (val / 100);
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    return `${px},${py}`;
  }).join(' ');
}

function buildPolylinePoints(
  dataPoints: { x: number; y: number }[]
): string {
  return dataPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');
}

function buildSemiArcPath(
  cx: number,
  cy: number,
  r: number,
  fraction: number
): string {
  const startAngle = Math.PI;
  const endAngle = Math.PI + fraction * Math.PI;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = fraction > 0.5 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function buildAreaPolygonPoints(
  dataPoints: { x: number; y: number }[],
  baseY: number
): string {
  const linePoints = dataPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');
  const closingPoints = `${dataPoints[dataPoints.length - 1].x},${baseY} ${dataPoints[0].x},${baseY}`;
  return `${linePoints} ${closingPoints}`;
}

// ============================================================
// Main Component
// ============================================================

export default function RefereeSystemEnhanced() {
  // ---- ALL HOOKS BEFORE CONDITIONAL RETURNS ----
  const gameState = useGameStore((state) => state.gameState);
  const setScreen = useGameStore((state) => state.setScreen);
  const playerData = gameState?.player ?? null;
  const playerName = playerData?.name ?? 'Your Player';

  const [activeTab, setActiveTab] = useState('referees');
  const [refereeSearch, setRefereeSearch] = useState('');
  const [strictnessFilter, setStrictnessFilter] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const handleSearch = useCallback((value: string) => {
    setRefereeSearch(value);
  }, []);

  const handleBack = useCallback(() => {
    setScreen('dashboard' as unknown as 'dashboard');
  }, [setScreen]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, []);

  // ---- STATIC DATA ----

  const referees: RefereeData[] = [
    { id: 1, name: 'Michael Oliver', rating: 8.4, strictness: 'balanced', matchCount: 342, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', specialization: 'VAR Specialist' },
    { id: 2, name: 'Martin Atkinson', rating: 7.6, strictness: 'lenient', matchCount: 456, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', specialization: 'Derby Matches' },
    { id: 3, name: 'Anthony Taylor', rating: 7.8, strictness: 'balanced', matchCount: 289, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', specialization: 'European Cups' },
    { id: 4, name: 'Craig Pawson', rating: 7.9, strictness: 'strict', matchCount: 198, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', specialization: 'High Intensity' },
    { id: 5, name: 'Paul Tierney', rating: 8.1, strictness: 'balanced', matchCount: 267, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', specialization: 'Set Pieces' },
    { id: 6, name: 'Andre Marriner', rating: 7.2, strictness: 'harsh', matchCount: 512, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', specialization: 'Physical Games' },
    { id: 7, name: 'Chris Kavanagh', rating: 8.5, strictness: 'strict', matchCount: 145, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', specialization: 'Tactical Fouls' },
    { id: 8, name: 'Kevin Friend', rating: 7.4, strictness: 'lenient', matchCount: 378, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', specialization: 'Youth Development' },
  ];

  const cardIncidents: CardIncidentData[] = [
    { id: 1, match: 'vs Arsenal', minute: 34, cardType: 'yellow', reason: 'Tactical foul on counter-attack', opponent: 'Arsenal', matchday: 'MD 14' },
    { id: 2, match: 'vs Chelsea', minute: 67, cardType: 'yellow', reason: 'Dissent towards referee', opponent: 'Chelsea', matchday: 'MD 18' },
    { id: 3, match: 'vs Liverpool', minute: 12, cardType: 'yellow', reason: 'Reckless tackle from behind', opponent: 'Liverpool', matchday: 'MD 8' },
    { id: 4, match: 'vs Man City', minute: 89, cardType: 'yellow', reason: 'Time wasting on restart', opponent: 'Man City', matchday: 'MD 22' },
    { id: 5, match: 'vs Tottenham', minute: 45, cardType: 'secondYellow', reason: 'Deliberate handball (2nd booking)', opponent: 'Tottenham', matchday: 'MD 26' },
    { id: 6, match: 'vs Newcastle', minute: 78, cardType: 'red', reason: 'Serious foul play (straight red)', opponent: 'Newcastle', matchday: 'MD 11' },
  ];

  const varIncidents: VARIncidentData[] = [
    { id: 1, match: 'vs Arsenal', minute: 55, decisionType: 'goal', originalDecision: 'Goal awarded', varDecision: 'Offside — Goal disallowed', overturned: true, matchday: 'MD 14' },
    { id: 2, match: 'vs Chelsea', minute: 72, decisionType: 'penalty', originalDecision: 'No penalty', varDecision: 'Penalty awarded for foul', overturned: true, matchday: 'MD 18' },
    { id: 3, match: 'vs Liverpool', minute: 23, decisionType: 'redCard', originalDecision: 'Yellow card only', varDecision: 'Upgraded to red card', overturned: true, matchday: 'MD 8' },
    { id: 4, match: 'vs Man City', minute: 88, decisionType: 'goal', originalDecision: 'Goal disallowed (offside)', varDecision: 'Goal stands — onside', overturned: true, matchday: 'MD 22' },
    { id: 5, match: 'vs Tottenham', minute: 41, decisionType: 'other', originalDecision: 'Free kick given', varDecision: 'Free kick stands — no VAR change', overturned: false, matchday: 'MD 26' },
    { id: 6, match: 'vs Newcastle', minute: 60, decisionType: 'penalty', originalDecision: 'Penalty awarded', varDecision: 'No penalty — simulation detected', overturned: true, matchday: 'MD 11' },
    { id: 7, match: 'vs West Ham', minute: 35, decisionType: 'redCard', originalDecision: 'Red card shown', varDecision: 'Red card stands', overturned: false, matchday: 'MD 5' },
    { id: 8, match: 'vs Leicester', minute: 50, decisionType: 'penalty', originalDecision: 'No penalty', varDecision: 'Penalty awarded (handball)', overturned: true, matchday: 'MD 20' },
  ];

  const disciplineFactors: DisciplineFactor[] = [
    { name: 'Aggression', score: 62, icon: <Zap className="h-4 w-4" />, colorClass: 'text-red-400' },
    { name: 'Fair Play', score: 85, icon: <Shield className="h-4 w-4" />, colorClass: 'text-emerald-400' },
    { name: 'Professionalism', score: 90, icon: <Award className="h-4 w-4" />, colorClass: 'text-blue-400' },
    { name: 'Simulation', score: 25, icon: <AlertTriangle className="h-4 w-4" />, colorClass: 'text-amber-400' },
    { name: 'Dissent', score: 45, icon: <Scale className="h-4 w-4" />, colorClass: 'text-orange-400' },
  ];

  const fairPlayTeams: FairPlayTeam[] = [
    { name: 'Brighton', points: 98, isPlayer: false },
    { name: 'Liverpool', points: 95, isPlayer: false },
    { name: 'Arsenal', points: 93, isPlayer: false },
    { name: playerName, points: 91, isPlayer: true },
    { name: 'Man City', points: 88, isPlayer: false },
  ];

  const monthlyCardData = [
    { month: 'Aug', count: 2 },
    { month: 'Sep', count: 1 },
    { month: 'Oct', count: 3 },
    { month: 'Nov', count: 2 },
    { month: 'Dec', count: 1 },
    { month: 'Jan', count: 3 },
  ];

  const foulsPerCardData = [
    { range: '0-5', count: 1, label: '0–5 fouls' },
    { range: '6-10', count: 2, label: '6–10 fouls' },
    { range: '11-15', count: 1, label: '11–15 fouls' },
    { range: '16-20', count: 1, label: '16–20 fouls' },
    { range: '20+', count: 1, label: '20+ fouls' },
  ];

  const disciplineTrendData = [
    { month: 'Aug', score: 72 },
    { month: 'Sep', score: 74 },
    { month: 'Oct', score: 71 },
    { month: 'Nov', score: 76 },
    { month: 'Dec', score: 79 },
    { month: 'Jan', score: 78 },
  ];

  const strictnessColors: Record<string, string> = {
    lenient: 'text-emerald-400',
    balanced: 'text-blue-400',
    strict: 'text-amber-400',
    harsh: 'text-red-400',
  };

  const strictnessBadgeBg: Record<string, string> = {
    lenient: 'bg-emerald-400/15 border-emerald-400/30',
    balanced: 'bg-blue-400/15 border-blue-400/30',
    strict: 'bg-amber-400/15 border-amber-400/30',
    harsh: 'bg-red-400/15 border-red-400/30',
  };

  // ---- COMPUTED VALUES (using .reduce()) ----

  const filteredReferees = referees.filter((ref) => {
    const matchesSearch =
      refereeSearch.trim() === '' ||
      ref.name.toLowerCase().includes(refereeSearch.toLowerCase()) ||
      ref.nationality.toLowerCase().includes(refereeSearch.toLowerCase());
    const matchesFilter =
      strictnessFilter === 'all' || ref.strictness === strictnessFilter;
    return matchesSearch && matchesFilter;
  });

  const strictnessDistribution = referees.reduce<Record<string, number>>(
      (distAcc, ref) => {
        const key = ref.strictness;
        return { ...distAcc, [key]: (distAcc[key] ?? 0) + 1 };
      },
      { lenient: 0, balanced: 0, strict: 0, harsh: 0 }
    );

  const cardTypeDistribution = cardIncidents.reduce<Record<string, number>>(
      (cardAcc, inc) => {
        const key = inc.cardType;
        return { ...cardAcc, [key]: (cardAcc[key] ?? 0) + 1 };
      },
      { yellow: 0, secondYellow: 0, red: 0 }
    );

  const varDecisionDistribution = varIncidents.reduce<Record<string, number>>(
      (varAcc, inc) => {
        const key = inc.decisionType;
        return { ...varAcc, [key]: (varAcc[key] ?? 0) + 1 };
      },
      { goal: 0, redCard: 0, penalty: 0, other: 0 }
    );

  const varOverturnRate = (() => {
    const total = varIncidents.length;
    const overturned = varIncidents.reduce(
      (ovAcc, inc) => ovAcc + (inc.overturned ? 1 : 0),
      0
    );
    return total > 0 ? Math.round((overturned / total) * 100) : 0;
  })();

  const totalYellowCards = cardIncidents.reduce(
      (yAcc, inc) => yAcc + (inc.cardType === 'yellow' ? 1 : 0),
      0
    );

  const totalRedCards = cardIncidents.reduce(
      (rAcc, inc) => rAcc + (inc.cardType !== 'yellow' ? 1 : 0),
      0
    );

  const totalCards = cardIncidents.reduce((tAcc) => tAcc + 1, 0);

  const averageRefereeRating = (() => {
    const sum = referees.reduce((sAcc, ref) => sAcc + ref.rating, 0);
    return referees.length > 0 ? (sum / referees.length).toFixed(1) : '0.0';
  })();

  const sortedRefereesByRating = [...referees].sort((a, b) => b.rating - a.rating);

  const overallDisciplineScore = 78;

  // ============================================================
  // TAB 1: Referee Database — SVG Sub-components
  // ============================================================

  function refereeStrictnessDonut(): React.JSX.Element {
    const items = [
      { color: 'stroke-emerald-400', label: 'Lenient', value: strictnessDistribution.lenient },
      { color: 'stroke-blue-400', label: 'Balanced', value: strictnessDistribution.balanced },
      { color: 'stroke-amber-400', label: 'Strict', value: strictnessDistribution.strict },
      { color: 'stroke-red-400', label: 'Harsh', value: strictnessDistribution.harsh },
    ];
    const segments = buildDonutSegments(80, 80, 60, 35, items);
    const totalReferees = referees.length;
    const labelPositions = [
      { x: 80, y: 12, label: 'Lenient' },
      { x: 80, y: 148, label: 'Harsh' },
    ];

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            Strictness Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 160 160" className="w-full max-w-[200px] mx-auto">
            <circle cx="80" cy="80" r="60" fill="none" className="stroke-slate-700" strokeWidth="25" />
            <circle cx="80" cy="80" r="35" fill="none" className="stroke-slate-800" strokeWidth="1" />
            {segments.map((seg, i) => (
              <path key={i} d={seg.path} fill="none" className={seg.color} strokeWidth="25" />
            ))}
            <text x="80" y="76" textAnchor="middle" fill="currentColor" className="text-slate-200" fontSize="14" fontWeight="bold">
              {totalReferees}
            </text>
            <text x="80" y="90" textAnchor="middle" fill="currentColor" className="text-slate-500" fontSize="10">
              Referees
            </text>
          </svg>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm bg-current ${item.color.replace('stroke-', 'text-')}`} />
                <span className="text-[10px] text-slate-400">
                  {item.label} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function refereeRatingBars(): React.JSX.Element {
    const maxRating = 10;
    const barWidth = 160;

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-yellow-400" />
            Referee Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 220 200" className="w-full">
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const y = i * 28 + 8;
              return (
                <line
                  key={`grid-${i}`}
                  x1="52" y1={y} x2="210" y2={y}
                  stroke="currentColor"
                  className="text-slate-700"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.2"
                />
              );
            })}
            {sortedRefereesByRating.map((ref, i) => {
              const yPos = i * 28 + 8;
              const barLength = (ref.rating / maxRating) * barWidth;
              const ratingColor = ref.rating >= 8.2 ? 'text-emerald-400' : ref.rating >= 7.5 ? 'text-blue-400' : 'text-amber-400';
              return (
                <g key={ref.id}>
                  <text x="50" y={yPos + 4} textAnchor="end" fill="currentColor" className="text-slate-400" fontSize="9">
                    {ref.name.split(' ').pop()}
                  </text>
                  <rect x="54" y={yPos - 4} width={barWidth} height="12" fill="currentColor" className="text-slate-800" rx="2" />
                  <rect x="54" y={yPos - 4} width={barLength} height="12" fill="currentColor" className={ratingColor} rx="2" opacity="0.8" />
                  <text x={54 + barLength + 4} y={yPos + 4} fill="currentColor" className={ratingColor} fontSize="9" fontWeight="bold">
                    {ref.rating}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function refereeMatchScatter(): React.JSX.Element {
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = 220;
    const chartH = 160;
    const xMin = 100;
    const xMax = 550;
    const yMin = 7.0;
    const yMax = 9.0;
    const mapX = (val: number) => padding.left + ((val - xMin) / (xMax - xMin)) * (chartW - padding.left - padding.right);
    const mapY = (val: number) => padding.top + ((yMax - val) / (yMax - yMin)) * (chartH - padding.top - padding.bottom);

    const gridLines = [7.0, 7.5, 8.0, 8.5, 9.0];

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
            Match Experience vs Rating
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 240 190" className="w-full">
            {gridLines.map((val, i) => {
              const yy = mapY(val);
              return (
                <line
                  key={`ygrid-${i}`}
                  x1={padding.left} y1={yy} x2={chartW - padding.right} y2={yy}
                  stroke="currentColor"
                  className="text-slate-700"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.2"
                />
              );
            })}
            {gridLines.map((val, i) => {
              const yy = mapY(val);
              return (
                <text key={`ylabel-${i}`} x={padding.left - 4} y={yy + 3} textAnchor="end" fill="currentColor" className="text-slate-500" fontSize="8">
                  {val.toFixed(1)}
                </text>
              );
            })}
            <line
              x1={padding.left} y1={chartH - padding.bottom}
              x2={chartW - padding.right} y2={chartH - padding.bottom}
              stroke="currentColor" className="text-slate-600" strokeWidth="1"
            />
            <text x={chartW / 2} y={chartH - 4} textAnchor="middle" fill="currentColor" className="text-slate-500" fontSize="8">
              Matches
            </text>
            {referees.map((ref) => {
              const dotX = mapX(ref.matchCount);
              const dotY = mapY(ref.rating);
              const dotColor = ref.rating >= 8.2 ? 'text-emerald-400' : ref.rating >= 7.5 ? 'text-blue-400' : 'text-amber-400';
              return (
                <circle key={ref.id} cx={dotX} cy={dotY} r="4" fill="currentColor" className={dotColor} opacity="0.85">
                  <title>{ref.name}: {ref.matchCount} matches, {ref.rating} rating</title>
                </circle>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function refereeDatabaseTab(): React.JSX.Element {
    const filterOptions = ['all', 'lenient', 'balanced', 'strict', 'harsh'];

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={refereeSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search referees..."
              className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 pl-9 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
            <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {filterOptions.map((opt) => (
              <Button
                key={opt}
                variant={strictnessFilter === opt ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStrictnessFilter(opt)}
                className={
                  strictnessFilter === opt
                    ? 'bg-blue-600 text-white text-xs capitalize'
                    : 'border-slate-600 text-slate-400 text-xs capitalize hover:text-slate-200'
                }
              >
                {opt === 'all' ? 'All' : opt}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Referees</span>
              </div>
              <span className="text-2xl font-bold text-slate-100">{referees.length}</span>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Avg Rating</span>
              </div>
              <span className="text-2xl font-bold text-slate-100">{averageRefereeRating}</span>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Matches</span>
              </div>
              <span className="text-2xl font-bold text-slate-100">
                {referees.reduce((mAcc, r) => mAcc + r.matchCount, 0).toLocaleString()}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Most Common</span>
              </div>
              <span className="text-lg font-bold text-blue-400 capitalize">
                {Object.entries(strictnessDistribution).reduce(
                  (bestEntry, [key, val]) => val > bestEntry.val ? { key, val } : bestEntry,
                  { key: 'balanced', val: 0 } as unknown as { key: string; val: number }
                ).key}
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredReferees.map((ref) => (
            <motion.div
              key={ref.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: ref.id * 0.05 }}
            >
              <Card className="bg-slate-800/30 border-slate-700 hover:border-slate-500 transition-colors">
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{ref.flag}</div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{ref.name}</h4>
                        <p className="text-[10px] text-slate-400">{ref.nationality} · {ref.specialization}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-400">{ref.rating}</div>
                      <div className="text-[9px] text-slate-500">Rating</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${strictnessBadgeBg[ref.strictness]} ${strictnessColors[ref.strictness]}`}
                    >
                      {ref.strictness}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      <Clock className="inline h-3 w-3 mr-0.5" />
                      {ref.matchCount} matches
                    </span>
                  </div>
                  <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-emerald-400 h-1.5 rounded-full"
                      style={{ width: `${(ref.rating / 10) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filteredReferees.length === 0 && (
            <div className="col-span-2 flex flex-col items-center py-8 text-slate-500">
              <ShieldAlert className="h-8 w-8 mb-2" />
              <span className="text-sm">No referees match your search</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {refereeStrictnessDonut()}
          {refereeRatingBars()}
          {refereeMatchScatter()}
        </div>
      </div>
    );
  }

  // ============================================================
  // TAB 2: Card History — SVG Sub-components
  // ============================================================

  function cardTypeDonut(): React.JSX.Element {
    const items = [
      { color: 'stroke-yellow-400', label: 'Yellow', value: cardTypeDistribution.yellow },
      { color: 'stroke-orange-400', label: '2nd Yellow', value: cardTypeDistribution.secondYellow },
      { color: 'stroke-red-500', label: 'Red', value: cardTypeDistribution.red },
    ];
    const segments = buildDonutSegments(80, 80, 60, 35, items);

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />
            Card Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 160 160" className="w-full max-w-[200px] mx-auto">
            <circle cx="80" cy="80" r="60" fill="none" className="stroke-slate-700" strokeWidth="25" />
            {segments.map((seg, i) => (
              <path key={i} d={seg.path} fill="none" className={seg.color} strokeWidth="25" />
            ))}
            <text x="80" y="76" textAnchor="middle" fill="currentColor" className="text-slate-200" fontSize="14" fontWeight="bold">
              {totalCards}
            </text>
            <text x="80" y="90" textAnchor="middle" fill="currentColor" className="text-slate-500" fontSize="10">
              Total Cards
            </text>
          </svg>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm bg-current ${item.color.replace('stroke-', 'text-')}`} />
                <span className="text-[10px] text-slate-400">{item.label} ({item.value})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function cardTrendArea(): React.JSX.Element {
    const padding = { top: 20, right: 15, bottom: 30, left: 30 };
    const chartW = 220;
    const chartH = 160;
    const maxCount = 4;
    const mapXPos = (idx: number) => padding.left + (idx / (monthlyCardData.length - 1)) * (chartW - padding.left - padding.right);
    const mapYPos = (val: number) => padding.top + ((maxCount - val) / maxCount) * (chartH - padding.top - padding.bottom);
    const baseY = chartH - padding.bottom;

    const dataPoints = monthlyCardData.map((d, idx) => ({
      x: mapXPos(idx),
      y: mapYPos(d.count),
    }));
    const linePoints = buildPolylinePoints(dataPoints);
    const areaPoints = buildAreaPolygonPoints(dataPoints, baseY);

    const yGridValues = [0, 1, 2, 3, 4];

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            Cards per Month
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 220 190" className="w-full">
            {yGridValues.map((val, i) => {
              const yy = mapYPos(val);
              return (
                <g key={`y-${i}`}>
                  <line
                    x1={padding.left} y1={yy} x2={chartW - padding.right} y2={yy}
                    stroke="currentColor" className="text-slate-700" strokeWidth="1"
                    strokeDasharray="3 3" opacity="0.2"
                  />
                  <text x={padding.left - 4} y={yy + 3} textAnchor="end" fill="currentColor" className="text-slate-500" fontSize="9">
                    {val}
                  </text>
                </g>
              );
            })}
            <polygon points={areaPoints} fill="currentColor" className="text-yellow-400" opacity="0.15" />
            <polyline points={linePoints} fill="none" className="stroke-yellow-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {dataPoints.map((pt, i) => (
              <g key={`dp-${i}`}>
                <circle cx={pt.x} cy={pt.y} r="3.5" fill="currentColor" className="text-yellow-400" />
                <text x={pt.x} y={pt.y - 7} textAnchor="middle" fill="currentColor" className="text-slate-300" fontSize="9" fontWeight="bold">
                  {monthlyCardData[i].count}
                </text>
                <text x={pt.x} y={baseY + 14} textAnchor="middle" fill="currentColor" className="text-slate-500" fontSize="8">
                  {monthlyCardData[i].month}
                </text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function foulsPerCardBars(): React.JSX.Element {
    const maxFoulCount = 3;
    const barMaxWidth = 130;

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-red-400" />
            Fouls Leading to Cards
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 200 150" className="w-full">
            {foulsPerCardData.map((item, i) => {
              const yPos = i * 26 + 12;
              const barLen = (item.count / maxFoulCount) * barMaxWidth;
              const barColor = item.count >= 2 ? 'text-amber-400' : 'text-blue-400';
              return (
                <g key={item.range}>
                  <text x="58" y={yPos + 4} textAnchor="end" fill="currentColor" className="text-slate-400" fontSize="9">
                    {item.label}
                  </text>
                  <rect x="62" y={yPos - 5} width={barMaxWidth} height="14" fill="currentColor" className="text-slate-800" rx="2" />
                  <rect x="62" y={yPos - 5} width={barLen} height="14" fill="currentColor" className={barColor} rx="2" opacity="0.8" />
                  <text x={62 + barLen + 4} y={yPos + 4} fill="currentColor" className={barColor} fontSize="9" fontWeight="bold">
                    {item.count}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function cardHistoryTab(): React.JSX.Element {
    const cardsUntilSuspension = 5 - totalCards;
    const suspensionRisk = totalCards >= 5 ? 'high' : totalCards >= 3 ? 'medium' : 'low';
    const riskColor = suspensionRisk === 'high' ? 'text-red-400 bg-red-400/15 border-red-400/30' : suspensionRisk === 'medium' ? 'text-amber-400 bg-amber-400/15 border-amber-400/30' : 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30';
    const riskLabel = suspensionRisk === 'high' ? 'Suspended' : suspensionRisk === 'medium' ? 'Caution' : 'Safe';

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-yellow-400/15 mb-1">
                <span className="text-sm font-bold text-yellow-400">{totalYellowCards}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Yellow Cards</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-500/15 mb-1">
                <span className="text-sm font-bold text-red-400">{totalRedCards}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Red Cards</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-400/15 mb-1">
                <span className="text-sm font-bold text-blue-400">{totalCards}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Total Cards</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <Badge variant="outline" className={`text-[10px] ${riskColor}`}>
                {riskLabel}
              </Badge>
              <p className="text-[10px] text-slate-400 mt-1">
                {suspensionRisk === 'high' ? 'Suspended next match' : `${Math.max(0, cardsUntilSuspension)} cards until ban`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-orange-400" />
              Card Accumulation Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={`slot-${i}`}
                  className={`w-8 h-8 rounded-md border-2 flex items-center justify-center text-xs font-bold ${
                    i < totalCards
                      ? i < totalYellowCards
                        ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400'
                        : 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-slate-800 border-slate-600 text-slate-600'
                  }`}
                >
                  {i < totalCards ? (
                    i < totalYellowCards ? 'Y' : 'R'
                  ) : (
                    '–'
                  )}
                </div>
              )).map((el, idx) => (
                <div key={`wrap-${idx}`} className="flex items-center gap-2">
                  {el}
                  {idx < 4 && (
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {totalCards}/5 cards — 5th card triggers a one-match suspension
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              Card Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {cardIncidents.map((inc) => {
                const cardColor = inc.cardType === 'yellow'
                  ? 'bg-yellow-400 border-yellow-500'
                  : inc.cardType === 'secondYellow'
                  ? 'bg-orange-400 border-orange-500'
                  : 'bg-red-500 border-red-600';
                const cardLabel = inc.cardType === 'yellow' ? 'YC' : inc.cardType === 'secondYellow' ? '2YC' : 'RC';
                return (
                  <motion.div
                    key={inc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: inc.id * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50"
                  >
                    <div className={`w-8 h-8 rounded-sm ${cardColor} flex items-center justify-center text-[10px] font-bold text-black`}>
                      {cardLabel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{inc.match}</div>
                      <div className="text-[10px] text-slate-400">{inc.reason}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium text-slate-300">{inc.matchday}</div>
                      <div className="text-[10px] text-slate-500">{inc.minute}&apos;</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cardTypeDonut()}
          {cardTrendArea()}
          {foulsPerCardBars()}
        </div>
      </div>
    );
  }

  // ============================================================
  // TAB 3: VAR Analysis — SVG Sub-components
  // ============================================================

  function varDecisionDonut(): React.JSX.Element {
    const items = [
      { color: 'stroke-emerald-400', label: 'Goal', value: varDecisionDistribution.goal },
      { color: 'stroke-red-500', label: 'Red Card', value: varDecisionDistribution.redCard },
      { color: 'stroke-purple-400', label: 'Penalty', value: varDecisionDistribution.penalty },
      { color: 'stroke-slate-400', label: 'Other', value: varDecisionDistribution.other },
    ];
    const segments = buildDonutSegments(80, 80, 60, 35, items);

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-purple-400" />
            VAR Decision Types
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 160 160" className="w-full max-w-[200px] mx-auto">
            <circle cx="80" cy="80" r="60" fill="none" className="stroke-slate-700" strokeWidth="25" />
            {segments.map((seg, i) => (
              <path key={i} d={seg.path} fill="none" className={seg.color} strokeWidth="25" />
            ))}
            <text x="80" y="76" textAnchor="middle" fill="currentColor" className="text-slate-200" fontSize="14" fontWeight="bold">
              {varIncidents.length}
            </text>
            <text x="80" y="90" textAnchor="middle" fill="currentColor" className="text-slate-500" fontSize="10">
              Reviews
            </text>
          </svg>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-sm bg-current ${item.color.replace('stroke-', 'text-')}`} />
                <span className="text-[10px] text-slate-400">{item.label} ({item.value})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function varOverturnGauge(): React.JSX.Element {
    const fraction = varOverturnRate / 100;
    const cx = 80;
    const cy = 85;
    const r = 55;
    const bgArcPath = buildSemiArcPath(cx, cy, r, 1.0);
    const fillArcPath = buildSemiArcPath(cx, cy, r, fraction);
    const endPt = polarToCartesian(cx, cy, r, (fraction * 180) + 180);

    const gaugeColor = varOverturnRate >= 70 ? 'stroke-red-400' : varOverturnRate >= 40 ? 'stroke-amber-400' : 'stroke-emerald-400';

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Scale className="h-3.5 w-3.5 text-amber-400" />
            VAR Overturn Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 160 120" className="w-full max-w-[200px] mx-auto">
            <path d={bgArcPath} fill="none" className="stroke-slate-700" strokeWidth="12" strokeLinecap="round" />
            <path d={fillArcPath} fill="none" className={gaugeColor} strokeWidth="12" strokeLinecap="round" />
            <circle cx={endPt.x} cy={endPt.y} r="4" fill="currentColor" className={gaugeColor.replace('stroke-', 'text-')} />
            <text x={cx} y={cy - 8} textAnchor="middle" fill="currentColor" className="text-slate-100" fontSize="22" fontWeight="bold">
              {varOverturnRate}%
            </text>
            <text x={cx} y={cy + 6} textAnchor="middle" fill="currentColor" className="text-slate-500" fontSize="9">
              Overturned
            </text>
            <text x="15" y={cy + 22} textAnchor="middle" fill="currentColor" className="text-slate-600" fontSize="8">
              0%
            </text>
            <text x={cx} y="8" textAnchor="middle" fill="currentColor" className="text-slate-600" fontSize="8">
              50%
            </text>
            <text x={145} y={cy + 22} textAnchor="middle" fill="currentColor" className="text-slate-600" fontSize="8">
              100%
            </text>
          </svg>
        </CardContent>
      </Card>
    );
  }

  function varIncidentTimeline(): React.JSX.Element {
    const typeColors: Record<string, string> = {
      goal: 'text-emerald-400',
      redCard: 'text-red-400',
      penalty: 'text-purple-400',
      other: 'text-slate-400',
    };
    const startX = 20;
    const endX = 220;
    const lineY = 50;
    const stepX = (endX - startX) / (varIncidents.length - 1);

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            VAR Incident Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 240 90" className="w-full">
            <line
              x1={startX} y1={lineY} x2={endX} y2={lineY}
              stroke="currentColor" className="text-slate-600" strokeWidth="2"
            />
            {varIncidents.map((inc, i) => {
              const dotX = startX + i * stepX;
              const dotY = lineY;
              const isAbove = i % 2 === 0;
              const textY = isAbove ? dotY - 14 : dotY + 18;
              const decisionLabel = inc.decisionType === 'goal' ? 'Goal' : inc.decisionType === 'redCard' ? 'Red' : inc.decisionType === 'penalty' ? 'Pen' : 'Other';
              return (
                <g key={inc.id}>
                  <line
                    x1={dotX} y1={dotY - 6} x2={dotX} y2={isAbove ? dotY - 10 : dotY + 10}
                    stroke="currentColor" className="text-slate-600" strokeWidth="1"
                  />
                  <circle cx={dotX} cy={dotY} r="5" fill="currentColor" className={typeColors[inc.decisionType]} opacity="0.9" />
                  <circle cx={dotX} cy={dotY} r="2.5" fill="currentColor" className="text-slate-900" />
                  <text
                    x={dotX}
                    y={isAbove ? textY : textY + 6}
                    textAnchor="middle"
                    fill="currentColor"
                    className={typeColors[inc.decisionType]}
                    fontSize="7"
                    fontWeight="bold"
                  >
                    {decisionLabel}
                  </text>
                  <text
                    x={dotX}
                    y={isAbove ? textY - 9 : textY + 14}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-slate-500"
                    fontSize="6"
                  >
                    {inc.matchday.replace('MD ', 'MD')}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {Object.entries(typeColors).map(([key, cls], i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-sm bg-current ${cls}`} />
                <span className="text-[10px] text-slate-400 capitalize">{key === 'redCard' ? 'Red Card' : key === 'other' ? 'Other' : key}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  function varAnalysisTab(): React.JSX.Element {
    const totalOverturned = varIncidents.reduce(
      (ovSum, inc) => ovSum + (inc.overturned ? 1 : 0),
      0
    );
    const totalNotOverturned = varIncidents.length - totalOverturned;
    const overturnedByType = Object.entries(varDecisionDistribution).reduce<
      Record<string, { total: number; overturned: number }>
    >(
      (typeAcc, [key]) => {
        const total = varIncidents.filter((inc) => inc.decisionType === key).length;
        const overturned = varIncidents.filter(
          (inc) => inc.decisionType === key && inc.overturned
        ).length;
        return { ...typeAcc, [key]: { total, overturned } };
      },
      {}
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <span className="text-2xl font-bold text-slate-100">{varIncidents.length}</span>
              <p className="text-[10px] text-slate-400 mt-1">Total Reviews</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <span className="text-2xl font-bold text-red-400">{totalOverturned}</span>
              <p className="text-[10px] text-slate-400 mt-1">Overturned</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <span className="text-2xl font-bold text-emerald-400">{totalNotOverturned}</span>
              <p className="text-[10px] text-slate-400 mt-1">Upheld</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <span className="text-2xl font-bold text-amber-400">{varOverturnRate}%</span>
              <p className="text-[10px] text-slate-400 mt-1">Overturn Rate</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
              Decision Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {Object.entries(overturnedByType).map(([key, data]) => {
                const typeLabel = key === 'goal' ? 'Goal / No Goal' : key === 'redCard' ? 'Red Card Review' : key === 'penalty' ? 'Penalty Decision' : 'Other Review';
                const typeColor = key === 'goal' ? 'text-emerald-400 bg-emerald-400/15' : key === 'redCard' ? 'text-red-400 bg-red-400/15' : key === 'penalty' ? 'text-purple-400 bg-purple-400/15' : 'text-slate-400 bg-slate-400/15';
                const pct = data.total > 0 ? Math.round((data.overturned / data.total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${typeColor} border-current/20`}>
                      {typeLabel}
                    </Badge>
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${key === 'goal' ? 'bg-emerald-400' : key === 'redCard' ? 'bg-red-400' : key === 'penalty' ? 'bg-purple-400' : 'bg-slate-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-300 shrink-0 w-20 text-right">
                      {data.overturned}/{data.total} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-blue-400" />
              VAR Intervention Log
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {varIncidents.map((inc, i) => {
                const decisionColor = inc.decisionType === 'goal' ? 'text-emerald-400' : inc.decisionType === 'redCard' ? 'text-red-400' : inc.decisionType === 'penalty' ? 'text-purple-400' : 'text-slate-400';
                return (
                  <motion.div
                    key={inc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50"
                  >
                    <div className="flex flex-col items-center gap-0.5 mt-0.5">
                      <Eye className="h-4 w-4 text-blue-400" />
                      <span className="text-[8px] text-slate-500">{inc.minute}&apos;</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${decisionColor} uppercase`}>
                          {inc.decisionType === 'goal' ? 'Goal Review' : inc.decisionType === 'redCard' ? 'Red Card Review' : inc.decisionType === 'penalty' ? 'Penalty Review' : 'Other Review'}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${inc.overturned ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'}`}
                        >
                          {inc.overturned ? 'Overturned' : 'Upheld'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{inc.varDecision}</p>
                      <p className="text-[10px] text-slate-500">{inc.match} · {inc.matchday}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {varDecisionDonut()}
          {varOverturnGauge()}
          {varIncidentTimeline()}
        </div>
      </div>
    );
  }

  // ============================================================
  // TAB 4: Discipline Tracker — SVG Sub-components
  // ============================================================

  function disciplineRadar(): React.JSX.Element {
    const cx = 100;
    const cy = 95;
    const maxR = 70;
    const sides = 5;

    const gridLevels = [20, 40, 60, 80, 100];
    const factorLabels = disciplineFactors.map((f) => f.name);
    const factorValues = disciplineFactors.map((f) => f.score);

    const radarGridPoints = (level: number) => buildPolygonPoints(cx, cy, maxR * (level / 100), sides);
    const radarDataPointsStr = buildRadarDataPoints(cx, cy, maxR, factorValues, sides);

    const labelCoords = factorLabels.map((_, i) => {
      const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
      const lx = cx + (maxR + 16) * Math.cos(angle);
      const ly = cy + (maxR + 16) * Math.sin(angle);
      return { x: lx, y: ly };
    });

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-cyan-400" />
            Discipline Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto">
            {gridLevels.map((level) => {
              const pts = radarGridPoints(level);
              return (
                <polygon
                  key={`grid-${level}`}
                  points={pts}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-700"
                  strokeWidth="1"
                  opacity="0.3"
                />
              );
            })}
            {factorLabels.map((_, i) => {
              const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
              const ax = cx + maxR * Math.cos(angle);
              const ay = cy + maxR * Math.sin(angle);
              return (
                <line
                  key={`axis-${i}`}
                  x1={cx} y1={cy} x2={ax} y2={ay}
                  stroke="currentColor"
                  className="text-slate-700"
                  strokeWidth="1"
                  opacity="0.2"
                />
              );
            })}
            <polygon
              points={radarDataPointsStr}
              fill="currentColor"
              className="text-cyan-400"
              opacity="0.15"
            />
            <polygon
              points={radarDataPointsStr}
              fill="none"
              className="stroke-cyan-400"
              strokeWidth="2"
            />
            {factorValues.map((val, i) => {
              const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
              const px = cx + maxR * (val / 100) * Math.cos(angle);
              const py = cy + maxR * (val / 100) * Math.sin(angle);
              return (
                <circle
                  key={`dot-${i}`}
                  cx={px} cy={py} r="3"
                  fill="currentColor"
                  className="text-cyan-400"
                />
              );
            })}
            {labelCoords.map((lc, i) => (
              <text
                key={`lbl-${i}`}
                x={lc.x} y={lc.y}
                textAnchor="middle"
                fill="currentColor"
                className="text-slate-400"
                fontSize="8"
                fontWeight="bold"
              >
                {factorLabels[i]}
              </text>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function disciplineTrendLine(): React.JSX.Element {
    const padding = { top: 20, right: 15, bottom: 30, left: 30 };
    const chartW = 220;
    const chartH = 160;
    const minScore = 60;
    const maxScore = 100;
    const mapXTrend = (idx: number) => padding.left + (idx / (disciplineTrendData.length - 1)) * (chartW - padding.left - padding.right);
    const mapYTrend = (val: number) => padding.top + ((maxScore - val) / (maxScore - minScore)) * (chartH - padding.top - padding.bottom);

    const trendPoints = disciplineTrendData.map((d, idx) => ({
      x: mapXTrend(idx),
      y: mapYTrend(d.score),
    }));
    const trendLineStr = buildPolylinePoints(trendPoints);

    const yGridScores = [60, 70, 80, 90, 100];

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Discipline Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 220 190" className="w-full">
            {yGridScores.map((val, i) => {
              const yy = mapYTrend(val);
              return (
                <g key={`ytg-${i}`}>
                  <line
                    x1={padding.left} y1={yy} x2={chartW - padding.right} y2={yy}
                    stroke="currentColor" className="text-slate-700" strokeWidth="1"
                    strokeDasharray="3 3" opacity="0.2"
                  />
                  <text x={padding.left - 4} y={yy + 3} textAnchor="end" fill="currentColor" className="text-slate-500" fontSize="9">
                    {val}
                  </text>
                </g>
              );
            })}
            <polyline
              points={trendLineStr}
              fill="none"
              className="stroke-emerald-400"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {trendPoints.map((pt, i) => (
              <g key={`tp-${i}`}>
                <circle cx={pt.x} cy={pt.y} r="3.5" fill="currentColor" className="text-emerald-400" />
                <text x={pt.x} y={pt.y - 7} textAnchor="middle" fill="currentColor" className="text-slate-300" fontSize="9" fontWeight="bold">
                  {disciplineTrendData[i].score}
                </text>
                <text x={pt.x} y={chartH - padding.bottom + 14} textAnchor="middle" fill="currentColor" className="text-slate-500" fontSize="8">
                  {disciplineTrendData[i].month}
                </text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function fairPlayPositionBars(): React.JSX.Element {
    const maxPoints = 100;
    const barMaxWidth = 120;
    const playerIdx = fairPlayTeams.findIndex((t) => t.isPlayer);

    return (
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Award className="h-3.5 w-3.5 text-yellow-400" />
            Fair Play League (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <svg viewBox="0 0 220 140" className="w-full">
            {fairPlayTeams.map((team, i) => {
              const yPos = i * 24 + 14;
              const barLen = (team.points / maxPoints) * barMaxWidth;
              const isPlayerTeam = team.isPlayer;
              const barColor = isPlayerTeam ? 'text-cyan-400' : i === 0 ? 'text-yellow-400' : 'text-slate-400';
              return (
                <g key={team.name}>
                  <text x="10" y={yPos + 3} fill="currentColor" className={isPlayerTeam ? 'text-cyan-300 font-bold' : 'text-slate-400'} fontSize="9">
                    {i + 1}. {team.name.length > 10 ? team.name.substring(0, 10) + '.' : team.name}
                  </text>
                  <rect x="70" y={yPos - 6} width={barMaxWidth} height="14" fill="currentColor" className="text-slate-800" rx="2" />
                  <rect x="70" y={yPos - 6} width={barLen} height="14" fill="currentColor" className={barColor} rx="2" opacity={isPlayerTeam ? 1 : 0.6} />
                  <text x={70 + barLen + 4} y={yPos + 3} fill="currentColor" className={barColor} fontSize="9" fontWeight="bold">
                    {team.points}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function disciplineTrackerTab(): React.JSX.Element {
    const leagueAvgScore = 72;
    const scoreDiff = overallDisciplineScore - leagueAvgScore;
    const scoreDiffLabel = scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;
    const scoreDiffColor = scoreDiff > 0 ? 'text-emerald-400' : scoreDiff < 0 ? 'text-red-400' : 'text-slate-400';

    const suggestions = [
      { title: 'Reduce Dissent', detail: 'Controversial calls are increasing dissent scores. Focus on composure after decisions.', priority: 'high' },
      { title: 'Lower Aggression', detail: 'Tackle intensity remains above league average. Work on timing and standing tackles.', priority: 'medium' },
      { title: 'Maintain Fair Play', detail: 'Excellent fair play record — one of the best in the league. Keep it up.', priority: 'low' },
    ];

    const priorityColors: Record<string, string> = {
      high: 'text-red-400 bg-red-400/15 border-red-400/30',
      medium: 'text-amber-400 bg-amber-400/15 border-amber-400/30',
      low: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30',
    };

    return (
      <div className="space-y-4">
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="pt-6 pb-6 px-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                <svg viewBox="0 0 120 120" className="w-28 h-28">
                  <circle cx="60" cy="60" r="50" fill="none" className="stroke-slate-700" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    className={overallDisciplineScore >= 80 ? 'stroke-emerald-400' : overallDisciplineScore >= 60 ? 'stroke-amber-400' : 'stroke-red-400'}
                    strokeWidth="8"
                    strokeDasharray={`${(overallDisciplineScore / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                  <text x="60" y="56" textAnchor="middle" fill="currentColor" className="text-slate-100" fontSize="26" fontWeight="bold">
                    {overallDisciplineScore}
                  </text>
                  <text x="60" y="72" textAnchor="middle" fill="currentColor" className="text-slate-500" fontSize="10">
                    / 100
                  </text>
                </svg>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold text-slate-100">Discipline Score</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {playerName}&apos;s overall discipline rating
                </p>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <span className="text-xs text-slate-500">vs League Avg ({leagueAvgScore}):</span>
                  <span className={`text-sm font-bold ${scoreDiffColor}`}>{scoreDiffLabel}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {disciplineFactors.map((factor) => (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: disciplineFactors.indexOf(factor) * 0.05 }}
            >
              <Card className="bg-slate-800/30 border-slate-700">
                <CardContent className="pt-4 pb-4 px-3 text-center">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${factor.colorClass.replace('text-', 'bg-').replace('-400', '-400/15')} mb-1`}>
                    {factor.icon}
                  </div>
                  <div className={`text-lg font-bold ${factor.colorClass}`}>{factor.score}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{factor.name}</p>
                  <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${factor.colorClass.replace('text-', 'bg-')}`}
                      style={{ width: `${factor.score}%`, opacity: 0.7 }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
              Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {suggestions.map((sug, i) => (
                <motion.div
                  key={`sug-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.06 }}
                  className="flex items-start gap-3 p-2 rounded-lg bg-slate-800/50"
                >
                  <Badge variant="outline" className={`text-[9px] shrink-0 mt-0.5 ${priorityColors[sug.priority]}`}>
                    {sug.priority.toUpperCase()}
                  </Badge>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{sug.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sug.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              Season Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <span className="text-xl font-bold text-slate-100">{totalYellowCards}</span>
                <p className="text-[10px] text-slate-400">Yellow Cards</p>
                <p className="text-[9px] text-amber-400">League avg: 3.2</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-slate-100">{totalRedCards}</span>
                <p className="text-[10px] text-slate-400">Red Cards</p>
                <p className="text-[9px] text-emerald-400">League avg: 0.4</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-slate-100">4th</span>
                <p className="text-[10px] text-slate-400">Fair Play Pos.</p>
                <p className="text-[9px] text-cyan-400">91 points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {disciplineRadar()}
          {disciplineTrendLine()}
          {fairPlayPositionBars()}
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RETURN
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100" ref={scrollRef}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-slate-400 hover:text-slate-200 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <h1 className="text-base font-bold text-slate-100">Referee System</h1>
          </div>
          <span className="text-[10px] text-slate-500 ml-auto hidden sm:block">
            Enhanced Analysis for {playerName}
          </span>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-1 mb-4">
            <TabsTrigger
              value="referees"
              className="flex-1 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              <Users className="h-3.5 w-3.5 mr-1" />
              Referees
            </TabsTrigger>
            <TabsTrigger
              value="cards"
              className="flex-1 text-xs data-[state=active]:bg-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Cards
            </TabsTrigger>
            <TabsTrigger
              value="var"
              className="flex-1 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              VAR
            </TabsTrigger>
            <TabsTrigger
              value="discipline"
              className="flex-1 text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              <Shield className="h-3.5 w-3.5 mr-1" />
              Discipline
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="referees" className="mt-0">
                {refereeDatabaseTab()}
              </TabsContent>
              <TabsContent value="cards" className="mt-0">
                {cardHistoryTab()}
              </TabsContent>
              <TabsContent value="var" className="mt-0">
                {varAnalysisTab()}
              </TabsContent>
              <TabsContent value="discipline" className="mt-0">
                {disciplineTrackerTab()}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
