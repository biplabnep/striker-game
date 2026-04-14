'use client';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Star, BarChart3, TrendingUp,
  Zap, Target, Globe, Award, Clock, ChevronRight,
  Heart, Shield, Users, Flag
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DREAM_CLUBS = [
  {
    id: 'real-madrid',
    name: 'Real Madrid',
    league: 'La Liga',
    country: 'Spain',
    interest: 92,
    color: '#FFFFFF',
    bgColor: '#FEBE10',
    trophies: 98,
    money: 95,
    culture: 96,
    location: 88,
    competition: 99,
    wagePerWeek: 420000,
    signingBonus: 12000000,
    imageRights: 8000000,
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    league: 'La Liga',
    country: 'Spain',
    interest: 85,
    color: '#A50044',
    bgColor: '#004D98',
    trophies: 90,
    money: 82,
    culture: 94,
    location: 90,
    competition: 92,
    wagePerWeek: 380000,
    signingBonus: 10000000,
    imageRights: 7000000,
  },
  {
    id: 'bayern',
    name: 'Bayern Munich',
    league: 'Bundesliga',
    country: 'Germany',
    interest: 78,
    color: '#DC052D',
    bgColor: '#0066B2',
    trophies: 88,
    money: 90,
    culture: 85,
    location: 82,
    competition: 86,
    wagePerWeek: 350000,
    signingBonus: 9000000,
    imageRights: 5000000,
  },
  {
    id: 'man-city',
    name: 'Man City',
    league: 'Premier League',
    country: 'England',
    interest: 72,
    color: '#6CABDD',
    bgColor: '#1C2C5B',
    trophies: 75,
    money: 99,
    culture: 78,
    location: 85,
    competition: 90,
    wagePerWeek: 400000,
    signingBonus: 15000000,
    imageRights: 9000000,
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    league: 'Premier League',
    country: 'England',
    interest: 68,
    color: '#C8102E',
    bgColor: '#00B2A9',
    trophies: 72,
    money: 88,
    culture: 92,
    location: 84,
    competition: 85,
    wagePerWeek: 340000,
    signingBonus: 8000000,
    imageRights: 6000000,
  },
  {
    id: 'psg',
    name: 'PSG',
    league: 'Ligue 1',
    country: 'France',
    interest: 65,
    color: '#004170',
    bgColor: '#DA291C',
    trophies: 60,
    money: 97,
    culture: 70,
    location: 92,
    competition: 72,
    wagePerWeek: 450000,
    signingBonus: 18000000,
    imageRights: 10000000,
  },
] as const;

const TRANSFER_STEPS = [
  { id: 'scout', label: 'Scout', icon: 'eye', status: 'completed' as const, description: 'Clubs have been watching your performances' },
  { id: 'agent', label: 'Agent', icon: 'handshake', status: 'active' as const, description: 'Your agent is in contact with clubs' },
  { id: 'negotiate', label: 'Negotiate', icon: 'document', status: 'upcoming' as const, description: 'Contract terms to be discussed' },
  { id: 'medical', label: 'Medical', icon: 'heart-pulse', status: 'upcoming' as const, description: 'Medical examination required' },
  { id: 'sign', label: 'Sign', icon: 'pen-line', status: 'upcoming' as const, description: 'Finalize and sign the contract' },
] as const;

const NEGOTIATION_STRATEGIES = [
  { id: 'aggressive', label: 'Aggressive Push', score: 78, risk: 65, reward: 92, description: 'Push for maximum wage and bonuses upfront' },
  { id: 'balanced', label: 'Balanced Approach', score: 85, risk: 35, reward: 75, description: 'Fair terms for both sides with performance incentives' },
  { id: 'patient', label: 'Patient Strategy', score: 72, risk: 20, reward: 65, description: 'Wait for the best offer, leverage competition' },
] as const;

const FINANCIAL_CATEGORIES = [
  { id: 'wage', label: 'Weekly Wage', current: 180000, projected: 420000 },
  { id: 'bonus', label: 'Signing Bonus', current: 2000000, projected: 12000000 },
  { id: 'image', label: 'Image Rights', current: 1000000, projected: 8000000 },
  { id: 'agent', label: 'Agent Fees', current: 500000, projected: 2500000 },
  { id: 'total', label: 'Total Package', current: 3200000, projected: 24500000 },
] as const;

const CAREER_EARNINGS_DATA = [
  { season: 'Season 1', earnings: 8500000, projected: 22000000 },
  { season: 'Season 2', earnings: 9200000, projected: 24500000 },
  { season: 'Season 3', earnings: 10000000, projected: 26000000 },
  { season: 'Season 4', earnings: 10500000, projected: 27000000 },
  { season: 'Season 5', earnings: 10800000, projected: 27500000 },
] as const;

const TAX_COMPARISON = [
  { country: 'Spain', rate: 45, effective: 37 },
  { country: 'Germany', rate: 42, effective: 32 },
  { country: 'England', rate: 45, effective: 35 },
  { country: 'France', rate: 49, effective: 40 },
] as const;

const CAREER_IMPACT_METRICS = [
  { id: 'trophies', label: 'Trophy Chances', before: 35, after: 82, delta: '+47' },
  { id: 'exposure', label: 'Global Exposure', before: 45, after: 88, delta: '+43' },
  { id: 'national', label: 'National Team', before: 60, after: 78, delta: '+18' },
  { id: 'earnings', label: 'Career Earnings', before: 40, after: 92, delta: '+52' },
  { id: 'legacy', label: 'Legend Status', before: 25, after: 70, delta: '+45' },
] as const;

const TRANSFER_RISK_DATA = [
  { id: 'real', label: 'Real Madrid', risk: 25, reward: 95, color: '#FEBE10' },
  { id: 'barca', label: 'Barcelona', risk: 35, reward: 85, color: '#A50044' },
  { id: 'bayern', label: 'Bayern', risk: 20, reward: 80, color: '#DC052D' },
  { id: 'city', label: 'Man City', risk: 40, reward: 88, color: '#6CABDD' },
  { id: 'liverpool', label: 'Liverpool', risk: 30, reward: 82, color: '#C8102E' },
  { id: 'psg', label: 'PSG', risk: 50, reward: 78, color: '#004170' },
] as const;

const RADAR_AXES = ['Trophies', 'Money', 'Culture', 'Location', 'Competition'] as const;
type RadarAxis = typeof RADAR_AXES[number];

const CAREER_RADAR_AXES = ['Trophies', 'Money', 'Exposure', 'National', 'Legacy'] as const;
type CareerRadarAxis = typeof CAREER_RADAR_AXES[number];

// ---------------------------------------------------------------------------
// Helper: build SVG polygon points from data
// ---------------------------------------------------------------------------

function buildRadarPoints(
  values: number[],
  center: number,
  radius: number,
  count: number,
): string {
  const angleStep = (2 * Math.PI) / count;
  const startAngle = -Math.PI / 2;
  return values
    .map((val, idx) => {
      const angle = startAngle + idx * angleStep;
      const r = (val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');
}

function buildAreaPoints(
  dataPoints: { x: number; y: number }[],
  baseY: number,
): string {
  const linePart = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const closingPoint = `${dataPoints[dataPoints.length - 1].x},${baseY}`;
  const startBase = `${dataPoints[0].x},${baseY}`;
  return `${linePart} ${closingPoint} ${startBase}`;
}

function buildScatterPositions(
  items: readonly { risk: number; reward: number }[],
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number,
): string[] {
  return items.map((item) => {
    const cx = plotX + (item.risk / 100) * plotW;
    const cy = plotY + plotH - (item.reward / 100) * plotH;
    return `${cx},${cy}`;
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DreamTransferEnhanced(): React.JSX.Element {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const playerData = gameState?.player ?? null;
  const playerName = playerData?.name ?? 'Your Player';

  const [activeTab, setActiveTab] = useState<string>('clubs');
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [transferReadiness, setTransferReadiness] = useState<number>(67);
  const countdownRef = useRef<HTMLDivElement>(null);

  // ALL hooks before conditional returns
  const activeClubData = useMemo(() => {
    if (!selectedClub) return null;
    return DREAM_CLUBS.find((c) => c.id === selectedClub) ?? null;
  }, [selectedClub]);

  const topThreeClubs = useMemo(() => {
    return [...DREAM_CLUBS].sort((a, b) => b.interest - a.interest).slice(0, 3);
  }, []);

  const readinessScore = useMemo(() => {
    return Math.min(100, Math.max(0, transferReadiness));
  }, [transferReadiness]);

  const totalCurrentEarnings = useMemo(() => {
    return CAREER_EARNINGS_DATA.reduce(
      (acc, item) => acc + item.earnings,
      0,
    );
  }, []);

  const totalProjectedEarnings = useMemo(() => {
    return CAREER_EARNINGS_DATA.reduce(
      (acc, item) => acc + item.projected,
      0,
    );
  }, []);

  const handleBack = useCallback(() => {
    setScreen?.('dashboard');
  }, [setScreen]);

  const handleClubSelect = useCallback((clubId: string) => {
    setSelectedClub((prev) => (prev === clubId ? null : clubId));
  }, []);

  const handleReadinessChange = useCallback(() => {
    setTransferReadiness((prev) => Math.min(100, prev + 3));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTransferReadiness((prev) => {
        if (prev >= 98) return prev;
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ---- Sub-components (camelCase, called as {fnName()}) ----

  function dreamClubCard(club: typeof DREAM_CLUBS[number], idx: number): React.JSX.Element {
    const isSelected = selectedClub === club.id;
    const interestColor =
      club.interest >= 80 ? 'bg-emerald-500' : club.interest >= 70 ? 'bg-amber-500' : 'bg-slate-500';

    return (
      <motion.div
        key={club.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: idx * 0.08 }}
        onClick={() => handleClubSelect(club.id)}
        role="button"
        tabIndex={0}
        className={`relative border p-3 cursor-pointer transition-colors ${
          isSelected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: club.bgColor }}
          >
            {club.name.slice(0, 3).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800 truncate">{club.name}</p>
            <p className="text-xs text-slate-500">{club.league} · {club.country}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`inline-block w-2.5 h-2.5 ${interestColor}`} />
            <span className="text-xs font-medium text-slate-600">{club.interest}%</span>
          </div>
        </div>
        {isSelected && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 border-t border-slate-100 pt-2"
            >
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                <span>Trophies: {club.trophies}</span>
                <span>Budget: {club.money}</span>
                <span>Culture: {club.culture}</span>
                <span>Competition: {club.competition}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                £{(club.wagePerWeek / 1000).toFixed(0)}k/week · £{((club.signingBonus / 1000000).toFixed(1))}M bonus
              </p>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    );
  }

  function fitAnalysisCard(club: typeof DREAM_CLUBS[number], rank: number): React.JSX.Element {
    const fitScore = Math.round(
      (club.trophies + club.money + club.culture + club.location + club.competition) / 5,
    );
    const fitLabel = fitScore >= 90 ? 'Excellent Fit' : fitScore >= 80 ? 'Great Fit' : 'Good Fit';
    const fitBadge = fitScore >= 90 ? 'bg-emerald-100 text-emerald-700' : fitScore >= 80 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700';

    return (
      <Card key={club.id} className="border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 flex items-center justify-center bg-amber-100 text-amber-700 rounded text-xs font-bold">
              #{rank + 1}
            </span>
            <span className="font-semibold text-sm text-slate-800">{club.name}</span>
            <Badge className={`ml-auto text-xs ${fitBadge}`}>{fitLabel}</Badge>
          </div>
          <div className="space-y-1">
            {RADAR_AXES.map((axis) => {
              const value = club[axis.toLowerCase() as keyof typeof club] as unknown as number;
              return (
                <div key={axis} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-20">{axis}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-sm">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${value}%`,
                        backgroundColor: club.bgColor,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-6 text-right">{value}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-center">
            <span className="text-lg font-bold text-slate-800">{fitScore}</span>
            <span className="text-xs text-slate-500 ml-1">/ 100 Fit Score</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  function dreamClubAttractivenessRadar(): React.JSX.Element {
    const svgSize = 240;
    const center = svgSize / 2;
    const radius = 90;
    const club = activeClubData ?? topThreeClubs[0];
    const values = RADAR_AXES.map(
      (axis) => club[axis.toLowerCase() as keyof typeof club] as unknown as number,
    );
    const points = buildRadarPoints(values, center, radius, RADAR_AXES.length);

    const gridRings = [25, 50, 75, 100];
    const axisEndpoints = RADAR_AXES.map((_, idx) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / RADAR_AXES.length;
      return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
    });

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Dream Club Attractiveness Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full max-w-[240px] mx-auto">
            {gridRings.map((ring) => {
              const ringPoints = buildRadarPoints(
                Array(RADAR_AXES.length).fill(ring),
                center,
                radius,
                RADAR_AXES.length,
              );
              return (
                <polygon
                  key={`ring-${ring}`}
                  points={ringPoints}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={0.5}
                />
              );
            })}
            {axisEndpoints.map((ep, idx) => (
              <line
                key={`axis-${idx}`}
                x1={center}
                y1={center}
                x2={Number(ep.split(',')[0])}
                y2={Number(ep.split(',')[1])}
                stroke="#cbd5e1"
                strokeWidth={0.5}
              />
            ))}
            <polygon
              points={points}
              fill={`${club.bgColor}33`}
              stroke={club.bgColor}
              strokeWidth={1.5}
            />
            {values.map((val, idx) => {
              const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / RADAR_AXES.length;
              const r = (val / 100) * radius;
              const cx = center + r * Math.cos(angle);
              const cy = center + r * Math.sin(angle);
              const labelR = radius + 14;
              const lx = center + labelR * Math.cos(angle);
              const ly = center + labelR * Math.sin(angle);
              return (
                <g key={`data-${idx}`}>
                  <circle cx={cx} cy={cy} r={2.5} fill={club.bgColor} />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[7px] fill-slate-500"
                  >
                    {RADAR_AXES[idx]}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-center text-xs text-slate-500 mt-1">{club.name}</p>
        </CardContent>
      </Card>
    );
  }

  function clubInterestBars(): React.JSX.Element {
    const svgW = 320;
    const svgH = 200;
    const barH = 20;
    const gap = 10;
    const labelW = 80;
    const barMaxW = svgW - labelW - 40;

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Club Interest Level
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            {DREAM_CLUBS.map((club, idx) => {
              const y = idx * (barH + gap) + 10;
              const w = (club.interest / 100) * barMaxW;
              return (
                <g key={club.id}>
                  <text
                    x={0}
                    y={y + barH / 2 + 3}
                    className="text-[8px] fill-slate-600"
                  >
                    {club.name.length > 12 ? club.name.slice(0, 11) + '…' : club.name}
                  </text>
                  <rect
                    x={labelW}
                    y={y}
                    width={barMaxW}
                    height={barH}
                    rx={2}
                    fill="#f1f5f9"
                  />
                  <motion.rect
                    x={labelW}
                    y={y}
                    width={w}
                    height={barH}
                    rx={2}
                    fill={club.bgColor}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  />
                  <text
                    x={labelW + w + 5}
                    y={y + barH / 2 + 3}
                    className="text-[7px] fill-slate-600"
                  >
                    {club.interest}%
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function transferProbabilityRing(): React.JSX.Element {
    const svgSize = 200;
    const cx = svgSize / 2;
    const cy = svgSize / 2;
    const outerR = 75;
    const innerR = 55;
    const probability = activeClubData?.interest ?? topThreeClubs[0]?.interest ?? 70;
    const fillFraction = probability / 100;

    const circumference = 2 * Math.PI * ((outerR + innerR) / 2);
    const dashArray = `${fillFraction * circumference} ${circumference}`;

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Transfer Probability Ring
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 flex flex-col items-center">
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-40">
            <circle
              cx={cx}
              cy={cy}
              r={(outerR + innerR) / 2}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={outerR - innerR}
            />
            <circle
              cx={cx}
              cy={cy}
              r={(outerR + innerR) / 2}
              fill="none"
              stroke="#10b981"
              strokeWidth={outerR - innerR}
              strokeDasharray={dashArray}
              strokeLinecap="butt"
              strokeDashoffset={-circumference * 0.25}
            />
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              className="text-2xl font-bold fill-slate-800"
            >
              {probability}%
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              className="text-[8px] fill-slate-500"
            >
              probability
            </text>
          </svg>
          <p className="text-xs text-slate-500 mt-1">
            Based on {activeClubData?.name ?? topThreeClubs[0]?.name ?? 'top club'} interest
          </p>
        </CardContent>
      </Card>
    );
  }

  function transferPlanTimeline(): React.JSX.Element {
    const svgW = 360;
    const svgH = 90;
    const stepW = svgW / TRANSFER_STEPS.length;
    const lineY = 35;

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Transfer Plan Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            <line
              x1={stepW / 2}
              y1={lineY}
              x2={svgW - stepW / 2}
              y2={lineY}
              stroke="#e2e8f0"
              strokeWidth={2}
            />
            {TRANSFER_STEPS.map((step, idx) => {
              const cx = stepW / 2 + idx * stepW;
              const fillColor =
                step.status === 'completed'
                  ? '#10b981'
                  : step.status === 'active'
                    ? '#f59e0b'
                    : '#cbd5e1';
              return (
                <g key={step.id}>
                  <circle cx={cx} cy={lineY} r={10} fill={fillColor} />
                  <text
                    x={cx}
                    y={lineY + 3}
                    textAnchor="middle"
                    className="text-[7px] fill-white font-bold"
                  >
                    {idx + 1}
                  </text>
                  <text
                    x={cx}
                    y={lineY + 24}
                    textAnchor="middle"
                    className="text-[8px] fill-slate-700 font-medium"
                  >
                    {step.label}
                  </text>
                  <text
                    x={cx}
                    y={lineY + 35}
                    textAnchor="middle"
                    className="text-[6px] fill-slate-400"
                  >
                    {step.status}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function negotiationLeverageBars(): React.JSX.Element {
    const svgW = 300;
    const svgH = 150;
    const barH = 22;
    const gap = 16;
    const labelW = 100;
    const barMaxW = svgW - labelW - 50;

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Negotiation Leverage
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            {NEGOTIATION_STRATEGIES.map((strat, idx) => {
              const y = idx * (barH + gap) + 10;
              const w = (strat.score / 100) * barMaxW;
              return (
                <g key={strat.id}>
                  <text x={0} y={y + barH / 2 + 3} className="text-[8px] fill-slate-600">
                    {strat.label}
                  </text>
                  <rect x={labelW} y={y} width={barMaxW} height={barH} rx={2} fill="#f1f5f9" />
                  <motion.rect
                    x={labelW}
                    y={y}
                    width={w}
                    height={barH}
                    rx={2}
                    fill={idx === 1 ? '#3b82f6' : '#64748b'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.12 }}
                  />
                  <text
                    x={labelW + w + 5}
                    y={y + barH / 2 + 3}
                    className="text-[7px] fill-slate-600"
                  >
                    {strat.score}/100
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function transferReadinessGauge(): React.JSX.Element {
    const svgW = 260;
    const svgH = 160;
    const cx = svgW / 2;
    const cy = svgH - 20;
    const radius = 90;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const score = readinessScore;

    const arcPath = (start: number, end: number, r: number): string => {
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
    };

    const scoreAngle = startAngle + (score / 100) * Math.PI;
    const scoreArcEnd = cx + radius * Math.cos(scoreAngle);
    const scoreArcY = cy + radius * Math.sin(scoreAngle);
    const scoreArc = `M ${cx + radius * Math.cos(startAngle)} ${cy + radius * Math.sin(startAngle)} A ${radius} ${radius} 0 0 1 ${scoreArcEnd} ${scoreArcY}`;

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Transfer Readiness Gauge
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 flex flex-col items-center">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[260px]">
            <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke="#e2e8f0" strokeWidth={12} />
            <motion.path
              d={scoreArc}
              fill="none"
              stroke={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth={12}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
            <text x={cx} y={cy - 20} textAnchor="middle" className="text-2xl font-bold fill-slate-800">
              {score}
            </text>
            <text x={cx} y={cy - 6} textAnchor="middle" className="text-[8px] fill-slate-500">
              out of 100
            </text>
            <text x={cx - radius} y={cy + 14} textAnchor="middle" className="text-[7px] fill-slate-400">
              0
            </text>
            <text x={cx + radius} y={cy + 14} textAnchor="middle" className="text-[7px] fill-slate-400">
              100
            </text>
          </svg>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 text-xs"
            onClick={handleReadinessChange}
          >
            <Zap className="w-3 h-3 mr-1" />
            Boost Readiness
          </Button>
        </CardContent>
      </Card>
    );
  }

  function financialComparisonBars(): React.JSX.Element {
    const svgW = 320;
    const svgH = 220;
    const barH = 24;
    const gap = 18;
    const labelW = 90;
    const barMaxW = (svgW - labelW - 60) / 2;

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Financial Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center gap-4 mb-2 justify-center">
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <span className="w-3 h-3 bg-slate-300 inline-block" /> Current
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <span className="w-3 h-3 bg-emerald-500 inline-block" /> Projected
            </span>
          </div>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            {FINANCIAL_CATEGORIES.map((cat, idx) => {
              const y = idx * (barH + gap) + 5;
              const currentW = Math.min(barMaxW, (cat.current / cat.projected) * barMaxW);
              const projectedW = (cat.projected / cat.projected) * barMaxW;
              const projectedX = labelW + currentW + 4;
              return (
                <g key={cat.id}>
                  <text x={0} y={y + barH / 2 + 3} className="text-[8px] fill-slate-600">
                    {cat.label}
                  </text>
                  <rect
                    x={labelW}
                    y={y}
                    width={currentW}
                    height={barH}
                    rx={2}
                    fill="#94a3b8"
                  />
                  <rect
                    x={projectedX}
                    y={y}
                    width={projectedW - currentW - 4}
                    height={barH}
                    rx={2}
                    fill="#10b981"
                    opacity={0.85}
                  />
                  <text
                    x={labelW + projectedW + 4}
                    y={y + barH / 2 + 3}
                    className="text-[7px] fill-slate-500"
                  >
                    £{(cat.projected / 1000000).toFixed(1)}M
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function careerEarningsProjection(): React.JSX.Element {
    const svgW = 340;
    const svgH = 200;
    const padL = 45;
    const padR = 15;
    const padT = 15;
    const padB = 35;
    const chartW = svgW - padL - padR;
    const chartH = svgH - padT - padB;
    const maxVal = 30000000;
    const baseY = padT + chartH;
    const stepX = chartW / (CAREER_EARNINGS_DATA.length - 1);

    const currentPoints = CAREER_EARNINGS_DATA.map((item, idx) => ({
      x: padL + idx * stepX,
      y: padT + chartH - (item.earnings / maxVal) * chartH,
    }));

    const projectedPoints = CAREER_EARNINGS_DATA.map((item, idx) => ({
      x: padL + idx * stepX,
      y: padT + chartH - (item.projected / maxVal) * chartH,
    }));

    const currentArea = buildAreaPoints(currentPoints, baseY);
    const projectedArea = buildAreaPoints(projectedPoints, baseY);

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Career Earnings Projection
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center gap-4 mb-1 justify-center">
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <span className="w-3 h-3 bg-blue-400 inline-block opacity-70" /> Current Path
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <span className="w-3 h-3 bg-emerald-500 inline-block opacity-70" /> Dream Transfer
            </span>
          </div>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            <line x1={padL} y1={baseY} x2={padL + chartW} y2={baseY} stroke="#e2e8f0" strokeWidth={1} />
            {[0, 10, 20, 30].map((tick) => {
              const yTick = padT + chartH - (tick / 30) * chartH;
              return (
                <g key={`ytick-${tick}`}>
                  <line x1={padL} y1={yTick} x2={padL + chartW} y2={yTick} stroke="#f1f5f9" strokeWidth={0.5} />
                  <text x={padL - 4} y={yTick + 3} textAnchor="end" className="text-[6px] fill-slate-400">
                    £{tick}M
                  </text>
                </g>
              );
            })}
            <polygon points={currentArea} fill="#3b82f6" opacity={0.2} />
            <polygon points={projectedArea} fill="#10b981" opacity={0.2} />
            <polyline
              points={currentPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
            />
            <polyline
              points={projectedPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth={1.5}
            />
            {currentPoints.map((pt, idx) => (
              <circle key={`cp-${idx}`} cx={pt.x} cy={pt.y} r={2.5} fill="#3b82f6" />
            ))}
            {projectedPoints.map((pt, idx) => (
              <circle key={`pp-${idx}`} cx={pt.x} cy={pt.y} r={2.5} fill="#10b981" />
            ))}
            {CAREER_EARNINGS_DATA.map((item, idx) => (
              <text
                key={`label-${idx}`}
                x={padL + idx * stepX}
                y={baseY + 12}
                textAnchor="middle"
                className="text-[6px] fill-slate-500"
              >
                {item.season}
              </text>
            ))}
          </svg>
          <div className="flex justify-between mt-2 text-xs text-slate-600">
            <span>Total Current: <strong>£{(totalCurrentEarnings / 1000000).toFixed(1)}M</strong></span>
            <span>Total Projected: <strong>£{(totalProjectedEarnings / 1000000).toFixed(1)}M</strong></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  function taxComparisonBars(): React.JSX.Element {
    const svgW = 300;
    const svgH = 160;
    const barH = 22;
    const gap = 12;
    const labelW = 60;
    const barMaxW = svgW - labelW - 60;

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Tax Comparison by Country
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            {TAX_COMPARISON.map((tax, idx) => {
              const y = idx * (barH + gap * 1.5) + 10;
              const nominalW = (tax.rate / 55) * barMaxW;
              const effectiveW = (tax.effective / 55) * barMaxW;
              return (
                <g key={tax.country}>
                  <text x={0} y={y + 8} className="text-[8px] fill-slate-600">
                    {tax.country}
                  </text>
                  <rect
                    x={labelW}
                    y={y}
                    width={nominalW}
                    height={barH / 2 - 1}
                    rx={1}
                    fill="#94a3b8"
                    opacity={0.8}
                  />
                  <rect
                    x={labelW}
                    y={y + barH / 2 + 1}
                    width={effectiveW}
                    height={barH / 2 - 1}
                    rx={1}
                    fill="#64748b"
                  />
                  <text
                    x={labelW + nominalW + 4}
                    y={y + 7}
                    className="text-[6px] fill-slate-500"
                  >
                    {tax.rate}%
                  </text>
                  <text
                    x={labelW + effectiveW + 4}
                    y={y + barH / 2 + 8}
                    className="text-[6px] fill-slate-500"
                  >
                    eff. {tax.effective}%
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <span className="w-3 h-2 bg-slate-400 inline-block" /> Nominal
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <span className="w-3 h-2 bg-slate-600 inline-block" /> Effective
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  function careerImpactRadar(): React.JSX.Element {
    const svgSize = 240;
    const ctr = svgSize / 2;
    const rad = 85;
    const beforeValues = CAREER_IMPACT_METRICS.map((m) => m.before);
    const afterValues = CAREER_IMPACT_METRICS.map((m) => m.after);
    const beforePoints = buildRadarPoints(beforeValues, ctr, rad, CAREER_RADAR_AXES.length);
    const afterPoints = buildRadarPoints(afterValues, ctr, rad, CAREER_RADAR_AXES.length);

    const gridRings = [25, 50, 75, 100];

    const axisEndpoints = CAREER_RADAR_AXES.map((_, idx) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / CAREER_RADAR_AXES.length;
      return `${ctr + rad * Math.cos(angle)},${ctr + rad * Math.sin(angle)}`;
    });

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Career Impact Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center gap-4 mb-1 justify-center">
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <span className="w-3 h-3 bg-blue-300 inline-block opacity-70" /> Before
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <span className="w-3 h-3 bg-emerald-500 inline-block opacity-70" /> After
            </span>
          </div>
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full max-w-[240px] mx-auto">
            {gridRings.map((ring) => {
              const ringPts = buildRadarPoints(
                Array(CAREER_RADAR_AXES.length).fill(ring),
                ctr,
                rad,
                CAREER_RADAR_AXES.length,
              );
              return (
                <polygon
                  key={`cgrid-${ring}`}
                  points={ringPts}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={0.5}
                />
              );
            })}
            {axisEndpoints.map((ep, idx) => (
              <line
                key={`caxis-${idx}`}
                x1={ctr}
                y1={ctr}
                x2={Number(ep.split(',')[0])}
                y2={Number(ep.split(',')[1])}
                stroke="#cbd5e1"
                strokeWidth={0.5}
              />
            ))}
            <polygon
              points={beforePoints}
              fill="#3b82f6"
              fillOpacity={0.15}
              stroke="#3b82f6"
              strokeWidth={1}
            />
            <polygon
              points={afterPoints}
              fill="#10b981"
              fillOpacity={0.15}
              stroke="#10b981"
              strokeWidth={1.5}
            />
            {CAREER_RADAR_AXES.map((_, idx) => {
              const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / CAREER_RADAR_AXES.length;
              const labelR = rad + 14;
              const lx = ctr + labelR * Math.cos(angle);
              const ly = ctr + labelR * Math.sin(angle);
              return (
                <text
                  key={`clabel-${idx}`}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[7px] fill-slate-500"
                >
                  {CAREER_RADAR_AXES[idx]}
                </text>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function beforeAfterBars(): React.JSX.Element {
    const svgW = 320;
    const svgH = 210;
    const barH = 20;
    const gap = 20;
    const labelW = 85;
    const barMaxW = (svgW - labelW - 50) / 2;

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Before vs After Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            {CAREER_IMPACT_METRICS.map((metric, idx) => {
              const y = idx * (barH + gap) + 5;
              const beforeW = (metric.before / 100) * barMaxW;
              const afterW = (metric.after / 100) * barMaxW;
              return (
                <g key={metric.id}>
                  <text x={0} y={y + barH / 2 + 3} className="text-[8px] fill-slate-600">
                    {metric.label}
                  </text>
                  <rect
                    x={labelW}
                    y={y}
                    width={beforeW}
                    height={barH}
                    rx={2}
                    fill="#94a3b8"
                  />
                  <rect
                    x={labelW + barMaxW + 10}
                    y={y}
                    width={afterW}
                    height={barH}
                    rx={2}
                    fill="#10b981"
                  />
                  <text
                    x={labelW + beforeW + 3}
                    y={y + barH / 2 + 3}
                    className="text-[6px] fill-slate-500"
                  >
                    {metric.before}
                  </text>
                  <text
                    x={labelW + barMaxW + 10 + afterW + 3}
                    y={y + barH / 2 + 3}
                    className="text-[6px] fill-slate-500"
                  >
                    {metric.after}
                  </text>
                  <text
                    x={svgW - 20}
                    y={y + barH / 2 + 3}
                    className="text-[7px] fill-emerald-600 font-bold"
                  >
                    {metric.delta}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function transferRiskScatter(): React.JSX.Element {
    const svgW = 340;
    const svgH = 240;
    const padL = 40;
    const padR = 20;
    const padT = 20;
    const padB = 40;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;

    const positions = buildScatterPositions(TRANSFER_RISK_DATA, padL, padT, plotW, plotH);

    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Transfer Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
            <line
              x1={padL}
              y1={padT + plotH}
              x2={padL + plotW}
              y2={padT + plotH}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
            <line
              x1={padL}
              y1={padT}
              x2={padL}
              y2={padT + plotH}
              stroke="#cbd5e1"
              strokeWidth={1}
            />
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={`xt-${tick}`}>
                <line
                  x1={padL + (tick / 100) * plotW}
                  y1={padT + plotH}
                  x2={padL + (tick / 100) * plotW}
                  y2={padT + plotH + 4}
                  stroke="#94a3b8"
                  strokeWidth={0.5}
                />
                <text
                  x={padL + (tick / 100) * plotW}
                  y={padT + plotH + 14}
                  textAnchor="middle"
                  className="text-[6px] fill-slate-400"
                >
                  {tick}
                </text>
              </g>
            ))}
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={`yt-${tick}`}>
                <line
                  x1={padL - 4}
                  y1={padT + plotH - (tick / 100) * plotH}
                  x2={padL}
                  y2={padT + plotH - (tick / 100) * plotH}
                  stroke="#94a3b8"
                  strokeWidth={0.5}
                />
                <text
                  x={padL - 6}
                  y={padT + plotH - (tick / 100) * plotH + 3}
                  textAnchor="end"
                  className="text-[6px] fill-slate-400"
                >
                  {tick}
                </text>
              </g>
            ))}
            {TRANSFER_RISK_DATA.map((item, idx) => {
              const [cxStr, cyStr] = positions[idx].split(',');
              return (
                <g key={item.id}>
                  <circle
                    cx={Number(cxStr)}
                    cy={Number(cyStr)}
                    r={7}
                    fill={item.color}
                    opacity={0.85}
                  />
                  <text
                    x={Number(cxStr)}
                    y={Number(cyStr) + 2.5}
                    textAnchor="middle"
                    className="text-[5px] fill-white font-bold"
                  >
                    {item.label.length > 6 ? item.label.slice(0, 5) + '…' : item.label}
                  </text>
                </g>
              );
            })}
            <text
              x={padL + plotW / 2}
              y={svgH - 5}
              textAnchor="middle"
              className="text-[7px] fill-slate-500"
            >
              Risk →
            </text>
            <text
              x={8}
              y={padT + plotH / 2}
              textAnchor="middle"
              className="text-[7px] fill-slate-500"
              transform={`rotate(-90, 8, ${padT + plotH / 2})`}
            >
              Reward →
            </text>
          </svg>
        </CardContent>
      </Card>
    );
  }

  function tabDreamClubs(): React.JSX.Element {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DREAM_CLUBS.map((club, idx) => dreamClubCard(club, idx))}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Top 3 Fit Analysis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topThreeClubs.map((club, idx) => fitAnalysisCard(club, idx))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dreamClubAttractivenessRadar()}
          {clubInterestBars()}
          {transferProbabilityRing()}
        </div>
      </div>
    );
  }

  function tabTransferPlanning(): React.JSX.Element {
    const daysRemaining = 47;
    const hoursRemaining = daysRemaining * 24 + 12;
    const minutesRemaining = hoursRemaining * 60;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Transfer Window Closes In</span>
          </div>
          <Badge className="bg-amber-600 text-white text-xs">
            {daysRemaining}d {hoursRemaining % 24}h remaining
          </Badge>
        </div>

        <div ref={countdownRef}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white border border-slate-200 p-3">
              <p className="text-2xl font-bold text-slate-800">{daysRemaining}</p>
              <p className="text-xs text-slate-500">Days</p>
            </div>
            <div className="bg-white border border-slate-200 p-3">
              <p className="text-2xl font-bold text-slate-800">{hoursRemaining % 24}</p>
              <p className="text-xs text-slate-500">Hours</p>
            </div>
            <div className="bg-white border border-slate-200 p-3">
              <p className="text-2xl font-bold text-slate-800">{minutesRemaining % 60}</p>
              <p className="text-xs text-slate-500">Minutes</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            5-Step Transfer Plan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TRANSFER_STEPS.map((step, idx) => {
              const statusColor =
                step.status === 'completed'
                  ? 'border-emerald-300 bg-emerald-50'
                  : step.status === 'active'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-200 bg-white';
              return (
                <Card key={step.id} className={statusColor}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-sm text-xs font-bold text-white ${
                          step.status === 'completed'
                            ? 'bg-emerald-500'
                            : step.status === 'active'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-sm text-slate-800">{step.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            Negotiation Strategies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {NEGOTIATION_STRATEGIES.map((strat) => (
              <Card key={strat.id} className="border-slate-200">
                <CardContent className="p-3">
                  <h4 className="font-semibold text-sm text-slate-800 mb-1">{strat.label}</h4>
                  <p className="text-xs text-slate-500 mb-2">{strat.description}</p>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Risk: {strat.risk}%</span>
                    <span>Reward: {strat.reward}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {transferPlanTimeline()}
          {negotiationLeverageBars()}
          {transferReadinessGauge()}
        </div>
      </div>
    );
  }

  function tabFinancialImpact(): React.JSX.Element {
    const currentWage = (playerData as unknown as { contract?: { weeklyWage?: number } })?.contract?.weeklyWage ?? 180000;
    const projectedWage = activeClubData?.wagePerWeek ?? 420000;
    const signingBonus = activeClubData?.signingBonus ?? 12000000;
    const imageRights = activeClubData?.imageRights ?? 8000000;
    const agentFeeRate = 0.08;
    const agentFeeTotal = (signingBonus + imageRights) * agentFeeRate;
    const yearlyWageCurrent = currentWage * 52;
    const yearlyWageProjected = projectedWage * 52;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-slate-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Current Wage</p>
              <p className="text-lg font-bold text-slate-800">
                £{(currentWage / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-slate-400">per week</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-emerald-600 mb-1">Dream Club Wage</p>
              <p className="text-lg font-bold text-emerald-800">
                £{(projectedWage / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-emerald-500">per week</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Signing Bonus</p>
              <p className="text-lg font-bold text-slate-800">
                £{(signingBonus / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-slate-400">one-time</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Image Rights</p>
              <p className="text-lg font-bold text-slate-800">
                £{(imageRights / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-slate-400">per year</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Agent Fees Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Signing Bonus Commission ({(agentFeeRate * 100).toFixed(0)}%)</span>
                <span className="font-medium text-slate-700">£{((signingBonus * agentFeeRate) / 1000000).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Image Rights Commission ({(agentFeeRate * 100).toFixed(0)}%)</span>
                <span className="font-medium text-slate-700">£{((imageRights * agentFeeRate) / 1000000).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-100 pt-2">
                <span className="text-slate-700 font-semibold">Total Agent Fees</span>
                <span className="font-bold text-slate-800">£{(agentFeeTotal / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Yearly Wage Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Current Path</p>
                <p className="text-xl font-bold text-slate-700">
                  £{(yearlyWageCurrent / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 mb-1">Dream Transfer</p>
                <p className="text-xl font-bold text-emerald-700">
                  £{(yearlyWageProjected / 1000000).toFixed(2)}M
                </p>
              </div>
            </div>
            <div className="mt-2 h-3 bg-slate-100 rounded-sm overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-sm transition-all duration-500"
                style={{ width: `${Math.min(100, (yearlyWageProjected / (yearlyWageCurrent * 2.5)) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {financialComparisonBars()}
          {careerEarningsProjection()}
          {taxComparisonBars()}
        </div>
      </div>
    );
  }

  function tabCareerImpact(): React.JSX.Element {
    const nationalBoost = 18;
    const exposureBoost = 43;
    const trophyChange = 47;
    const legendProjection = 70;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-slate-200">
            <CardContent className="p-3 text-center">
              <Flag className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 mb-1">National Team Boost</p>
              <p className="text-lg font-bold text-blue-700">+{nationalBoost}%</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-3 text-center">
              <Globe className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 mb-1">Global Exposure</p>
              <p className="text-lg font-bold text-purple-700">+{exposureBoost}%</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-3 text-center">
              <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 mb-1">Trophy Probability</p>
              <p className="text-lg font-bold text-amber-700">+{trophyChange}%</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 mb-1">Legend Status</p>
              <p className="text-lg font-bold text-emerald-700">{legendProjection}/100</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">National Team Impact Analysis</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Playing at a top club increases your visibility to national selectors by {nationalBoost}%</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span>Higher competition level sharpens your match fitness for international duty</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Heart className="w-4 h-4 text-slate-400" />
                <span>Champions League experience is highly valued by national team coaches</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">International Exposure Boost</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-100 p-2">
                <p className="text-xs text-slate-500">Social Media Followers</p>
                <p className="text-sm font-bold text-slate-800">+2.4M projected</p>
              </div>
              <div className="bg-white border border-slate-100 p-2">
                <p className="text-xs text-slate-500">Brand Endorsements</p>
                <p className="text-sm font-bold text-slate-800">3-5 new deals</p>
              </div>
              <div className="bg-white border border-slate-100 p-2">
                <p className="text-xs text-slate-500">Global Fan Reach</p>
                <p className="text-sm font-bold text-slate-800">180+ countries</p>
              </div>
              <div className="bg-white border border-slate-100 p-2">
                <p className="text-xs text-slate-500">Media Appearances</p>
                <p className="text-sm font-bold text-slate-800">+40% increase</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Trophy Probability Change</h3>
            <div className="space-y-2">
              {[
                { trophy: 'Domestic League', before: 15, after: 55 },
                { trophy: 'Champions League', before: 5, after: 35 },
                { trophy: 'Domestic Cup', before: 20, after: 60 },
                { trophy: 'Super Cup', before: 8, after: 45 },
                { trophy: 'Club World Cup', before: 3, after: 30 },
              ].map((item, idx) => (
                <div key={`trophy-${idx}`} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-28">{item.trophy}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-sm relative">
                    <div
                      className="absolute left-0 top-0 h-full bg-slate-400 rounded-sm"
                      style={{ width: `${item.before}%` }}
                    />
                    <div
                      className="absolute left-0 top-0 h-full bg-emerald-500 rounded-sm"
                      style={{ width: `${item.after}%`, opacity: 0.7 }}
                    />
                  </div>
                  <span className="text-xs text-emerald-600 font-medium w-10 text-right">
                    +{item.after - item.before}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Legend Status Projection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Hall of Fame Probability</p>
                <div className="h-3 bg-slate-100 rounded-sm overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-sm" style={{ width: '65%' }} />
                </div>
                <p className="text-xs text-slate-600 mt-1">65% — Strong contender with dream club achievements</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Club Legend Status</p>
                <div className="h-3 bg-slate-100 rounded-sm overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-sm" style={{ width: '72%' }} />
                </div>
                <p className="text-xs text-slate-600 mt-1">72% — High if you stay 5+ seasons and win trophies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {careerImpactRadar()}
          {beforeAfterBars()}
          {transferRiskScatter()}
        </div>
      </div>
    );
  }

  // ---- Main render ----

  return (
    <div className="min-h-screen bg-slate-50 p-3 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Dream Transfer Enhanced
          </h1>
          <p className="text-xs text-slate-500">
            {playerName} — Your path to football glory
          </p>
        </div>
        <Badge variant="outline" className="border-amber-300 text-amber-700 text-xs">
          <Zap className="w-3 h-3 mr-1" />
          {readinessScore}% Ready
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="clubs" className="text-xs">
            <Star className="w-3 h-3 mr-1" />
            Dream Clubs
          </TabsTrigger>
          <TabsTrigger value="planning" className="text-xs">
            <Target className="w-3 h-3 mr-1" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="financial" className="text-xs">
            <BarChart3 className="w-3 h-3 mr-1" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="career" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Career
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
            <TabsContent value="clubs" className="mt-0">
              {tabDreamClubs()}
            </TabsContent>
            <TabsContent value="planning" className="mt-0">
              {tabTransferPlanning()}
            </TabsContent>
            <TabsContent value="financial" className="mt-0">
              {tabFinancialImpact()}
            </TabsContent>
            <TabsContent value="career" className="mt-0">
              {tabCareerImpact()}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
