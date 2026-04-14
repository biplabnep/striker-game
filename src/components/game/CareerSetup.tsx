'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Position, POSITION_GROUPS } from '@/lib/game/types';
import { NATIONALITIES, POSITIONS, POSITION_WEIGHTS, generatePlayerName } from '@/lib/game/playerData';
import { ENRICHED_CLUBS, LEAGUES } from '@/lib/game/clubsData';
import { getOverallColor } from '@/lib/game/gameUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Target,
  Shield,
  Rocket,
  Dices,
  Search,
  Check,
  ChevronDown,
  Star,
  Zap,
  Swords,
  Timer,
  TrendingDown,
} from 'lucide-react';

// -----------------------------------------------------------
// Position descriptions & key attributes for detail cards
// -----------------------------------------------------------
const POSITION_DETAILS: Record<
  Position,
  { description: string; keyAttrs: { label: string; value: string }[] }
> = {
  GK: {
    description: 'Command the penalty area, make crucial saves, and organize your defense.',
    keyAttrs: [
      { label: 'Reflexes', value: '92' },
      { label: 'Handling', value: '87' },
      { label: 'Positioning', value: '85' },
    ],
  },
  CB: {
    description: 'Anchor the backline with strong tackling, aerial dominance, and positioning.',
    keyAttrs: [
      { label: 'Defending', value: '88' },
      { label: 'Physical', value: '84' },
      { label: 'Heading', value: '82' },
    ],
  },
  LB: {
    description: 'Patrol the left flank, overlap in attack, and track back defensively.',
    keyAttrs: [
      { label: 'Pace', value: '82' },
      { label: 'Defending', value: '78' },
      { label: 'Crossing', value: '74' },
    ],
  },
  RB: {
    description: 'Patrol the right flank, overlap in attack, and track back defensively.',
    keyAttrs: [
      { label: 'Pace', value: '82' },
      { label: 'Defending', value: '78' },
      { label: 'Crossing', value: '74' },
    ],
  },
  CDM: {
    description: 'Shield the defense, break up opposition play, and distribute efficiently.',
    keyAttrs: [
      { label: 'Defending', value: '84' },
      { label: 'Passing', value: '80' },
      { label: 'Physical', value: '82' },
    ],
  },
  CM: {
    description: 'Control the tempo of the game with passing, vision, and work rate.',
    keyAttrs: [
      { label: 'Passing', value: '84' },
      { label: 'Dribbling', value: '78' },
      { label: 'Stamina', value: '80' },
    ],
  },
  CAM: {
    description: 'Unlock defenses with creativity, through balls, and close-range finishing.',
    keyAttrs: [
      { label: 'Passing', value: '86' },
      { label: 'Dribbling', value: '84' },
      { label: 'Vision', value: '88' },
    ],
  },
  LW: {
    description: 'Beat defenders with pace and skill, deliver crosses, and cut inside to shoot.',
    keyAttrs: [
      { label: 'Pace', value: '88' },
      { label: 'Dribbling', value: '86' },
      { label: 'Crossing', value: '78' },
    ],
  },
  RW: {
    description: 'Beat defenders with pace and skill, deliver crosses, and cut inside to shoot.',
    keyAttrs: [
      { label: 'Pace', value: '88' },
      { label: 'Dribbling', value: '86' },
      { label: 'Crossing', value: '78' },
    ],
  },
  LM: {
    description: 'Control the left channel with pace, crossing ability, and two-way stamina.',
    keyAttrs: [
      { label: 'Pace', value: '80' },
      { label: 'Passing', value: '78' },
      { label: 'Crossing', value: '82' },
    ],
  },
  RM: {
    description: 'Hug the right touchline, deliver crosses, and support both defense and attack.',
    keyAttrs: [
      { label: 'Pace', value: '80' },
      { label: 'Passing', value: '78' },
      { label: 'Crossing', value: '82' },
    ],
  },
  CF: {
    description: 'Operate between midfield and attack, creating chances with vision and technique.',
    keyAttrs: [
      { label: 'Passing', value: '85' },
      { label: 'Dribbling', value: '83' },
      { label: 'Shooting', value: '80' },
    ],
  },
  ST: {
    description: 'Lead the attack, find space in the box, and finish clinical chances.',
    keyAttrs: [
      { label: 'Shooting', value: '88' },
      { label: 'Pace', value: '82' },
      { label: 'Finishing', value: '86' },
    ],
  },
};

// -----------------------------------------------------------
// Group icons mapping
// -----------------------------------------------------------
const GROUP_ICONS: Record<string, React.ReactNode> = {
  Goalkeeper: <Timer className="h-3.5 w-3.5" />,
  Defence: <Shield className="h-3.5 w-3.5" />,
  Midfield: <Target className="h-3.5 w-3.5" />,
  Attack: <Zap className="h-3.5 w-3.5" />,
};

// -----------------------------------------------------------
// Difficulty configuration
// -----------------------------------------------------------
const DIFFICULTY_CONFIG = {
  easy: {
    icon: <Star className="h-6 w-6" />,
    color: 'emerald',
    borderActive: 'border-emerald-500',
    bgActive: 'bg-emerald-600/15',
    textActive: 'text-emerald-300',
    description: 'Higher potential, favorable outcomes, relaxed board expectations.',
    badge: 'Recommended for beginners',
  },
  normal: {
    icon: <Swords className="h-6 w-6" />,
    color: 'amber',
    borderActive: 'border-amber-500',
    bgActive: 'bg-amber-600/15',
    textActive: 'text-amber-300',
    description: 'Balanced experience with realistic progression and standard challenges.',
    badge: 'The authentic experience',
  },
  hard: {
    icon: <TrendingDown className="h-6 w-6" />,
    color: 'red',
    borderActive: 'border-red-500',
    bgActive: 'bg-red-600/15',
    textActive: 'text-red-300',
    description: 'Lower potential, tougher opposition, demanding board expectations.',
    badge: 'For experienced players',
  },
} as const;

// -----------------------------------------------------------
// Step definitions
// -----------------------------------------------------------
const STEPS = [
  { label: 'Profile', icon: <span className="text-sm leading-none">⚽</span> },
  { label: 'Position', icon: <Target className="h-4 w-4" /> },
  { label: 'Club', icon: <Shield className="h-4 w-4" /> },
  { label: 'Start', icon: <Rocket className="h-4 w-4" /> },
];

// ============================================================
// SVG Geometry Helpers (pure functions, no state dependencies)
// ============================================================
function hexPoints(cx: number, cy: number, maxR: number, values: number[]): string {
  const n = values.length;
  return values.map((val, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = maxR * (val / 100);
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

function donutSegPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startDeg: number, endDeg: number,
): string {
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
  const os = toRad(startDeg);
  const oe = toRad(endDeg);
  const osx = cx + outerR * Math.cos(os);
  const osy = cy + outerR * Math.sin(os);
  const oex = cx + outerR * Math.cos(oe);
  const oey = cy + outerR * Math.sin(oe);
  const iex = cx + innerR * Math.cos(oe);
  const iey = cy + innerR * Math.sin(oe);
  const isx = cx + innerR * Math.cos(os);
  const isy = cy + innerR * Math.sin(os);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return [
    `M ${osx.toFixed(1)} ${osy.toFixed(1)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oex.toFixed(1)} ${oey.toFixed(1)}`,
    `L ${iex.toFixed(1)} ${iey.toFixed(1)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${isx.toFixed(1)} ${isy.toFixed(1)}`,
    'Z',
  ].join(' ');
}

function polarToXY(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function areaPolyPts(xArr: number[], yArr: number[], baseY: number): string {
  const top = xArr.map((x, i) => `${x.toFixed(1)},${yArr[i].toFixed(1)}`);
  const bot = xArr.slice().reverse().map(x => `${x.toFixed(1)},${baseY.toFixed(1)}`);
  return [...top, ...bot].join(' ');
}

function linePolyPts(xArr: number[], yArr: number[]): string {
  return xArr.map((x, i) => `${x.toFixed(1)},${yArr[i].toFixed(1)}`).join(' ');
}

// ============================================================
// Static SVG Data Constants
// ============================================================
const POSITION_POPULARITY = [12, 28, 32, 45, 18, 22];
const POSITION_RADAR_LABELS = ['GK', 'DEF', 'MID', 'FWD', 'CF', 'CAM'];
const ATTR_RADAR_LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
const ATTR_KEYS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;

const REGION_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899'];

const nationalityRegionMap: Array<{ region: string; names: string[] }> = [
  { region: 'Europe', names: ['England','Spain','Italy','Germany','France','Portugal','Netherlands','Belgium','Croatia','Scotland','Wales','Ireland','Poland','Serbia','Turkey','Sweden','Norway','Denmark','Switzerland','Austria','Czech Republic','Ukraine'] },
  { region: 'S. America', names: ['Brazil','Argentina','Uruguay','Colombia','Chile','Ecuador'] },
  { region: 'Africa', names: ['Morocco','Nigeria','Senegal','Ghana','Cameroon','Ivory Coast'] },
  { region: 'Asia', names: ['South Korea','Japan'] },
  { region: 'Other', names: ['Mexico','USA','Australia','Canada'] },
];

const natDistribution = nationalityRegionMap.map((rg, ri) => ({
  region: rg.region,
  count: rg.names.reduce((sum, nm) => sum + (NATIONALITIES.some(n => n.name === nm) ? 1 : 0), 0),
  color: REGION_COLORS[ri] ?? '#484f58',
}));

const natTotal = natDistribution.reduce((sum, d) => sum + d.count, 0);

const OVR_DISTRIBUTION = [
  { range: '40-49', pct: 8 },
  { range: '50-59', pct: 22 },
  { range: '60-69', pct: 38 },
  { range: '70-79', pct: 24 },
  { range: '80+', pct: 8 },
];

const HEIGHT_DISTRIBUTION = [
  { range: '<165', pct: 5 },
  { range: '165-170', pct: 12 },
  { range: '170-175', pct: 28 },
  { range: '175-180', pct: 30 },
  { range: '180-185', pct: 18 },
  { range: '185+', pct: 7 },
];

const FOOT_SPLIT = [
  { label: 'Left', pct: 25, color: '#0ea5e9' },
  { label: 'Right', pct: 60, color: '#10b981' },
  { label: 'Both', pct: 15, color: '#f59e0b' },
];

const CAREER_PROJECTIONS: Record<string, number[]> = {
  easy: [45,50,56,62,68,74,78,82,85,87,88,88,87,86,85,83,81,79,77,75,73,72],
  normal: [42,46,52,57,63,68,72,76,79,81,82,82,81,80,78,76,73,70,68,66,64,62],
  hard: [38,42,47,52,57,61,65,69,72,74,75,75,74,72,70,67,64,61,58,55,53,51],
};

const BUDGET_ALLOCATION: Record<string, Array<{ label: string; pct: number; color: string }>> = {
  easy: [
    { label: 'Wages', pct: 50, color: '#10b981' },
    { label: 'Transfers', pct: 35, color: '#0ea5e9' },
    { label: 'Bonus', pct: 15, color: '#f59e0b' },
  ],
  normal: [
    { label: 'Wages', pct: 55, color: '#10b981' },
    { label: 'Transfers', pct: 30, color: '#0ea5e9' },
    { label: 'Bonus', pct: 15, color: '#f59e0b' },
  ],
  hard: [
    { label: 'Wages', pct: 60, color: '#ef4444' },
    { label: 'Transfers', pct: 25, color: '#f59e0b' },
    { label: 'Bonus', pct: 15, color: '#8b5cf6' },
  ],
};

const CLUB_METRICS = [
  { label: 'Squad', key: 'squadQuality' as const },
  { label: 'Facility', key: 'facilities' as const },
  { label: 'Finance', key: 'finances' as const },
  { label: 'Repute', key: 'reputation' as const },
  { label: 'Youth', key: 'youthDevelopment' as const },
];

const DIFFICULTY_GAUGE_POS: Record<string, number> = { easy: 300, normal: 0, hard: 60 };

// ============================================================
// CareerSetup Component
// ============================================================
export default function CareerSetup() {
  const setScreen = useGameStore(state => state.setScreen);
  const startNewCareer = useGameStore(state => state.startNewCareer);

  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('England');
  const [position, setPosition] = useState<Position>('ST');
  const [clubId, setClubId] = useState('arsenal');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  // Step tracking
  const [activeStep, setActiveStep] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Search filters
  const [nationalitySearch, setNationalitySearch] = useState('');
  const [clubSearch, setClubSearch] = useState('');

  // Collapsible leagues
  const selectedClubLeague = useMemo(
    () => ENRICHED_CLUBS.find(club => club.id === clubId)?.league,
    [clubId],
  );
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set([selectedClubLeague || 'premier_league']),
  );

  const toggleLeague = (leagueId: string) => {
    setExpandedLeagues(prev => {
      const next = new Set(prev);
      if (next.has(leagueId)) next.delete(leagueId);
      else next.add(leagueId);
      return next;
    });
  };

  // Random name generator
  const handleRandomName = useCallback(() => {
    const { firstName, lastName } = generatePlayerName(nationality);
    setName(`${firstName} ${lastName}`);
  }, [nationality]);

  // Filtered nationalities
  const filteredNationalities = useMemo(() => {
    if (!nationalitySearch.trim()) return NATIONALITIES;
    const q = nationalitySearch.toLowerCase();
    return NATIONALITIES.filter(n => n.name.toLowerCase().includes(q));
  }, [nationalitySearch]);

  // Currently selected nationality flag
  const selectedNationality = NATIONALITIES.find(n => n.name === nationality);

  // Filtered clubs per league
  const filteredClubsByLeague = useMemo(() => {
    const q = clubSearch.toLowerCase().trim();
    return LEAGUES.map(league => {
      const leagueClubs = ENRICHED_CLUBS.filter(club => club.league === league.id);
      const clubs = q ? leagueClubs.filter(club => club.name.toLowerCase().includes(q)) : leagueClubs;
      return { league, clubs };
    }).filter(entry => entry.clubs.length > 0 || !q);
  }, [clubSearch]);

  const handleStart = () => {
    startNewCareer({ name, nationality, position, clubId, difficulty });
  };

  const selectedClub = ENRICHED_CLUBS.find(c => c.id === clubId);

  // Auto-advance step based on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) setActiveStep(idx);
          }
        });
      },
      { threshold: 0.4 },
    );

    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Scroll to section when clicking a step
  const scrollToStep = (stepIndex: number) => {
    const ref = sectionRefs.current[stepIndex];
    if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ============================================================
  // SVG Render Functions (camelCase, called as {fnName()})
  // ============================================================

  const renderPositionRadar = (): React.JSX.Element => {
    const cx = 100, cy = 100, r = 65, sides = 6;
    const gridLevels = [33, 66, 100];
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Position Popularity</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 200" className="w-full" fill="none">
            {gridLevels.map((lvl, gi) => (
              <polygon
                key={gi}
                points={hexPoints(cx, cy, r * lvl / 100, Array(sides).fill(lvl))}
                stroke="#30363d"
                strokeWidth={0.5}
              />
            ))}
            {POSITION_RADAR_LABELS.map((_, ai) => {
              const angle = (Math.PI * 2 * ai) / sides - Math.PI / 2;
              const ex = cx + r * Math.cos(angle);
              const ey = cy + r * Math.sin(angle);
              return <line key={ai} x1={cx} y1={cy} x2={ex.toFixed(1)} y2={ey.toFixed(1)} stroke="#30363d" strokeWidth={0.5} />;
            })}
            <polygon
              points={hexPoints(cx, cy, r, POSITION_POPULARITY)}
              stroke="#10b981"
              strokeWidth={2}
              fill="#10b981"
              fillOpacity={0.15}
            />
            {POSITION_POPULARITY.map((val, vi) => {
              const angle = (Math.PI * 2 * vi) / sides - Math.PI / 2;
              const px = cx + r * (val / 100) * Math.cos(angle);
              const py = cy + r * (val / 100) * Math.sin(angle);
              return <circle key={vi} cx={px.toFixed(1)} cy={py.toFixed(1)} r={3} fill="#10b981" />;
            })}
            {POSITION_RADAR_LABELS.map((lbl, li) => {
              const angle = (Math.PI * 2 * li) / sides - Math.PI / 2;
              const lx = cx + (r + 14) * Math.cos(angle);
              const ly = cy + (r + 14) * Math.sin(angle);
              return (
                <text key={li} x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize={9}>
                  {lbl}
                </text>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderNationalityDonut = (): React.JSX.Element => {
    const cx = 100, cy = 100, outerR = 70, innerR = 45;
    const segs = natDistribution.map(d => ({
      ...d,
      deg: (d.count / natTotal) * 360,
    }));
    const cumDegs = segs.reduce<number[]>((acc, sg) => {
      acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + sg.deg);
      return acc;
    }, []);
    const arcs = segs.map((sg, idx) => ({
      ...sg,
      startDeg: idx === 0 ? 0 : cumDegs[idx - 1],
      endDeg: cumDegs[idx],
    }));
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Nationality Regions</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 200" className="w-full" fill="none">
            {arcs.map((arc, ai) => (
              <path key={ai} d={donutSegPath(cx, cy, outerR, innerR, arc.startDeg, arc.endDeg)} fill={arc.color} fillOpacity={0.8} />
            ))}
            <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill="#c9d1d9" fontSize={16} fontWeight="bold">{natTotal}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central" fill="#484f58" fontSize={8}>nations</text>
          </svg>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
            {arcs.map((arc, ai) => (
              <div key={ai} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: arc.color }} />
                <span className="text-[9px] text-[#8b949e]">{arc.region} {Math.round(arc.deg)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDifficultyGauge = (): React.JSX.Element => {
    const cx = 100, cy = 105, r = 65;
    const zones = [
      { start: 270, end: 330, color: '#10b981', label: 'Easy' },
      { start: 330, end: 30, color: '#f59e0b', label: 'Normal' },
      { start: 30, end: 90, color: '#ef4444', label: 'Hard' },
    ];
    const indicatorDeg = DIFFICULTY_GAUGE_POS[difficulty] ?? 0;
    const ip = polarToXY(cx, cy, r, indicatorDeg);
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Difficulty Gauge</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 140" className="w-full" fill="none">
            {zones.map((zone, zi) => (
              <path
                key={zi}
                d={donutSegPath(cx, cy, r, r - 12, zone.start, zone.end)}
                fill={zone.color}
                fillOpacity={difficulty === zone.label.toLowerCase() ? 0.9 : 0.25}
              />
            ))}
            <circle cx={ip.x.toFixed(1)} cy={ip.y.toFixed(1)} r={5} fill="#c9d1d9" />
            <circle cx={ip.x.toFixed(1)} cy={ip.y.toFixed(1)} r={2.5} fill="#0d1117" />
            <text x={cx} y={cy - 14} textAnchor="middle" dominantBaseline="central" fill="#c9d1d9" fontSize={13} fontWeight="bold">{difficulty.toUpperCase()}</text>
            <text x={30} y={cy + 12} textAnchor="middle" dominantBaseline="central" fill="#10b981" fontSize={8}>Easy</text>
            <text x={cx} y={cy - r - 6} textAnchor="middle" dominantBaseline="central" fill="#f59e0b" fontSize={8}>Normal</text>
            <text x={170} y={cy + 12} textAnchor="middle" dominantBaseline="central" fill="#ef4444" fontSize={8}>Hard</text>
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderAttributeRadar = (): React.JSX.Element => {
    const cx = 100, cy = 100, r = 65, sides = 6;
    const weights = ATTR_KEYS.map(k => POSITION_WEIGHTS[position][k] ?? 0);
    const maxW = 0.40;
    const values = weights.map(w => Math.round((w / maxW) * 100));
    const gridLevels = [33, 66, 100];
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Attribute Preview — {position}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 200" className="w-full" fill="none">
            {gridLevels.map((lvl, gi) => (
              <polygon
                key={gi}
                points={hexPoints(cx, cy, r * lvl / 100, Array(sides).fill(lvl))}
                stroke="#30363d"
                strokeWidth={0.5}
              />
            ))}
            {ATTR_RADAR_LABELS.map((_, ai) => {
              const angle = (Math.PI * 2 * ai) / sides - Math.PI / 2;
              const ex = cx + r * Math.cos(angle);
              const ey = cy + r * Math.sin(angle);
              return <line key={ai} x1={cx} y1={cy} x2={ex.toFixed(1)} y2={ey.toFixed(1)} stroke="#30363d" strokeWidth={0.5} />;
            })}
            <polygon
              points={hexPoints(cx, cy, r, values)}
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="#0ea5e9"
              fillOpacity={0.15}
            />
            {values.map((val, vi) => {
              const angle = (Math.PI * 2 * vi) / sides - Math.PI / 2;
              const px = cx + r * (val / 100) * Math.cos(angle);
              const py = cy + r * (val / 100) * Math.sin(angle);
              return <circle key={vi} cx={px.toFixed(1)} cy={py.toFixed(1)} r={3} fill="#0ea5e9" />;
            })}
            {ATTR_RADAR_LABELS.map((lbl, li) => {
              const angle = (Math.PI * 2 * li) / sides - Math.PI / 2;
              const lx = cx + (r + 14) * Math.cos(angle);
              const ly = cy + (r + 14) * Math.sin(angle);
              return (
                <text key={li} x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize={9}>
                  {lbl}
                </text>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderOvrDistribution = (): React.JSX.Element => {
    const barH = 16, gap = 6, labelW = 42, maxPct = 38;
    const barMaxW = 120;
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Starting OVR Distribution</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 130" className="w-full" fill="none">
            {OVR_DISTRIBUTION.map((d, di) => {
              const y = di * (barH + gap);
              const bw = (d.pct / maxPct) * barMaxW;
              return (
                <g key={di}>
                  <text x={labelW - 4} y={y + barH / 2} textAnchor="end" dominantBaseline="central" fill="#8b949e" fontSize={9}>{d.range}</text>
                  <rect x={labelW} y={y} width={barMaxW} height={barH} rx={3} fill="#21262d" />
                  <rect x={labelW} y={y} width={bw.toFixed(1)} height={barH} rx={3} fill="#10b981" fillOpacity={0.8} />
                  <text x={labelW + bw + 5} y={y + barH / 2} dominantBaseline="central" fill="#c9d1d9" fontSize={8}>{d.pct}%</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderClubComparison = (): React.JSX.Element => {
    const league = selectedClubLeague ?? 'premier_league';
    const leagueClubs = ENRICHED_CLUBS.filter(club => club.league === league);
    const lc = leagueClubs.length > 0 ? leagueClubs.length : 1;
    const avgVals = CLUB_METRICS.reduce<Record<string, number>>((acc, m) => {
      const total = leagueClubs.reduce((sum, club) => sum + (club[m.key] ?? 70), 0);
      acc[m.key] = total / lc;
      return acc;
    }, {});

    const barH = 14, gap = 8, labelW = 44, maxVal = 100;
    const barMaxW = 100;
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Club vs League Average</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 140" className="w-full" fill="none">
            {CLUB_METRICS.map((m, mi) => {
              const y = mi * (barH + gap);
              const clubVal = selectedClub ? selectedClub[m.key] ?? 70 : 70;
              const avgVal = avgVals[m.key] ?? 70;
              const clubW = (clubVal / maxVal) * barMaxW;
              const avgW = (avgVal / maxVal) * barMaxW;
              return (
                <g key={mi}>
                  <text x={labelW - 4} y={y + barH / 2} textAnchor="end" dominantBaseline="central" fill="#8b949e" fontSize={8}>{m.label}</text>
                  <rect x={labelW} y={y + 1} width={avgW.toFixed(1)} height={barH - 2} rx={2} fill="#484f58" fillOpacity={0.3} />
                  <rect x={labelW} y={y + 1} width={clubW.toFixed(1)} height={barH - 2} rx={2} fill="#0ea5e9" fillOpacity={0.8} />
                  <text x={labelW + Math.max(clubW, avgW) + 4} y={y + barH / 2} dominantBaseline="central" fill="#c9d1d9" fontSize={7}>{clubVal}</text>
                </g>
              );
            })}
            <rect x={labelW + barMaxW + 16} y={4} width={8} height={8} rx={1} fill="#0ea5e9" fillOpacity={0.8} />
            <text x={labelW + barMaxW + 28} y={10} dominantBaseline="central" fill="#8b949e" fontSize={7}>Club</text>
            <rect x={labelW + barMaxW + 16} y={16} width={8} height={8} rx={1} fill="#484f58" fillOpacity={0.5} />
            <text x={labelW + barMaxW + 28} y={22} dominantBaseline="central" fill="#8b949e" fontSize={7}>Avg</text>
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderCareerProjection = (): React.JSX.Element => {
    const data = CAREER_PROJECTIONS[difficulty] ?? CAREER_PROJECTIONS.normal;
    const ages = data.map((_, i) => 14 + i);
    const xPad = 14, yPad = 10;
    const plotW = 172, plotH = 80;
    const baseY = yPad + plotH;
    const xPts = ages.map(a => xPad + ((a - 14) / 21) * plotW);
    const yPts = data.map(ovr => yPad + ((90 - ovr) / 55) * plotH);

    const difficultyColors: Record<string, string> = { easy: '#10b981', normal: '#f59e0b', hard: '#ef4444' };
    const lineColor = difficultyColors[difficulty] ?? '#f59e0b';

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Career OVR Projection</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 120" className="w-full" fill="none">
            {[40, 60, 80].map((ovr, gi) => {
              const gy = yPad + ((90 - ovr) / 55) * plotH;
              return (
                <g key={gi}>
                  <line x1={xPad} y1={gy.toFixed(1)} x2={xPad + plotW} y2={gy.toFixed(1)} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3,3" />
                  <text x={xPad - 3} y={gy.toFixed(1)} textAnchor="end" dominantBaseline="central" fill="#484f58" fontSize={7}>{ovr}</text>
                </g>
              );
            })}
            <line x1={xPad} y1={baseY} x2={xPad + plotW} y2={baseY} stroke="#30363d" strokeWidth={0.5} />
            <text x={xPad} y={baseY + 10} textAnchor="middle" dominantBaseline="central" fill="#484f58" fontSize={7}>14</text>
            <text x={xPad + plotW} y={baseY + 10} textAnchor="middle" dominantBaseline="central" fill="#484f58" fontSize={7}>35</text>
            <polygon points={areaPolyPts(xPts, yPts, baseY)} fill={lineColor} fillOpacity={0.1} />
            <polyline points={linePolyPts(xPts, yPts)} stroke={lineColor} strokeWidth={2} fill="none" />
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderBudgetDonut = (): React.JSX.Element => {
    const alloc = BUDGET_ALLOCATION[difficulty] ?? BUDGET_ALLOCATION.normal;
    const cx = 100, cy = 100, outerR = 65, innerR = 40;
    const allocDegs = alloc.reduce<number[]>((acc, sg) => {
      acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + sg.pct * 3.6);
      return acc;
    }, []);
    const arcs = alloc.map((sg, idx) => ({
      ...sg,
      startDeg: idx === 0 ? 0 : allocDegs[idx - 1],
      endDeg: allocDegs[idx],
    }));
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 200" className="w-full" fill="none">
            {arcs.map((arc, ai) => (
              <path key={ai} d={donutSegPath(cx, cy, outerR, innerR, arc.startDeg, arc.endDeg)} fill={arc.color} fillOpacity={0.8} />
            ))}
            <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" fill="#c9d1d9" fontSize={11} fontWeight="bold">£{difficulty === 'easy' ? '50m' : difficulty === 'normal' ? '30m' : '15m'}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="central" fill="#484f58" fontSize={7}>total budget</text>
          </svg>
          <div className="flex gap-3 mt-2 justify-center">
            {arcs.map((arc, ai) => (
              <div key={ai} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: arc.color }} />
                <span className="text-[9px] text-[#8b949e]">{arc.label} {arc.pct}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderHeightDistribution = (): React.JSX.Element => {
    const barW = 22, gap = 6, baseY = 100, topY = 12, maxPct = 30;
    const chartH = baseY - topY;
    const totalW = HEIGHT_DISTRIBUTION.length * barW + (HEIGHT_DISTRIBUTION.length - 1) * gap;
    const offsetX = (200 - totalW) / 2;
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Player Height Distribution (cm)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 130" className="w-full" fill="none">
            {[10, 20, 30].map((pct, gi) => {
              const gy = baseY - (pct / maxPct) * chartH;
              return (
                <g key={gi}>
                  <line x1={offsetX} y1={gy.toFixed(1)} x2={offsetX + totalW} y2={gy.toFixed(1)} stroke="#30363d" strokeWidth={0.5} strokeDasharray="3,3" />
                  <text x={offsetX - 3} y={gy.toFixed(1)} textAnchor="end" dominantBaseline="central" fill="#484f58" fontSize={7}>{pct}%</text>
                </g>
              );
            })}
            <line x1={offsetX} y1={baseY} x2={offsetX + totalW} y2={baseY} stroke="#30363d" strokeWidth={0.5} />
            {HEIGHT_DISTRIBUTION.map((d, di) => {
              const x = offsetX + di * (barW + gap);
              const bh = (d.pct / maxPct) * chartH;
              const y = baseY - bh;
              return (
                <g key={di}>
                  <rect x={x} y={y.toFixed(1)} width={barW} height={bh.toFixed(1)} rx={2} fill="#8b5cf6" fillOpacity={0.7} />
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" dominantBaseline="central" fill="#c9d1d9" fontSize={7}>{d.pct}%</text>
                  <text x={x + barW / 2} y={baseY + 10} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize={7}>{d.range}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderFootSplit = (): React.JSX.Element => {
    const barH = 20, barW = 150, labelW = 34;
    const offsetX = (200 - labelW - barW) / 2 + labelW;
    const cumPcts = FOOT_SPLIT.reduce<number[]>((acc, seg) => {
      acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + seg.pct);
      return acc;
    }, []);
    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Preferred Foot Split</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 70" className="w-full" fill="none">
            <rect x={offsetX} y={8} width={barW} height={barH} rx={4} fill="#21262d" />
            {FOOT_SPLIT.map((seg, si) => {
              const sw = (seg.pct / 100) * barW;
              const sx = offsetX + (si === 0 ? 0 : cumPcts[si - 1]) / 100 * barW;
              return (
                <g key={si}>
                  <rect x={sx.toFixed(1)} y={8} width={sw.toFixed(1)} height={barH} rx={si === 0 ? 4 : si === FOOT_SPLIT.length - 1 ? 4 : 0} fill={seg.color} fillOpacity={0.8} />
                  <text x={sx + sw / 2} y={18} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={8} fontWeight="bold">{seg.pct}%</text>
                </g>
              );
            })}
            {FOOT_SPLIT.map((seg, si) => {
              const mid = FOOT_SPLIT.slice(0, si).reduce((s, f) => s + f.pct, 0) + seg.pct / 2;
              return (
                <text key={si} x={offsetX + (mid / 100) * barW} y={42} textAnchor="middle" dominantBaseline="central" fill="#8b949e" fontSize={8}>
                  {seg.label}
                </text>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderCompletionRing = (): React.JSX.Element => {
    const checks = [
      name.trim().length > 0,
      nationality !== 'England',
      position !== 'ST',
      clubId !== 'arsenal',
    ];
    const completed = checks.reduce((sum, v) => sum + (v ? 1 : 0), 0);
    const pct = (completed / checks.length) * 100;
    const cx = 100, cy = 100, r = 42;
    const circumference = 2 * Math.PI * r;
    const dashOffset = circumference * (1 - pct / 100);
    const ringColor = pct === 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

    return (
      <Card className="bg-[#161b22] border-[#30363d] py-0 gap-0">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Setup Completion</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 200 200" className="w-full" fill="none">
            <circle cx={cx} cy={cy} r={r} stroke="#21262d" strokeWidth={8} />
            <circle
              cx={cx} cy={cy} r={r}
              stroke={ringColor}
              strokeWidth={8}
              strokeDasharray={circumference.toFixed(1)}
              strokeDashoffset={dashOffset.toFixed(1)}
              strokeLinecap="round"
              fill="none"
            />
            <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="central" fill="#c9d1d9" fontSize={20} fontWeight="bold">{Math.round(pct)}%</text>
            <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="central" fill="#484f58" fontSize={8}>complete</text>
          </svg>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {[
              { label: 'Name', done: checks[0] },
              { label: 'Nationality', done: checks[1] },
              { label: 'Position', done: checks[2] },
              { label: 'Club', done: checks[3] },
            ].map((item, ci) => (
              <div key={ci} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-sm ${item.done ? 'bg-emerald-500' : 'bg-[#30363d]'}`} />
                <span className={`text-[9px] ${item.done ? 'text-emerald-400' : 'text-[#484f58]'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================
  // JSX Return
  // ============================================================
  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Subtle dot grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='1' fill='%23c9d1d9'/%3E%3C/svg%3E")`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-8">
        {/* ---- Sticky Header ---- */}
        <div className="sticky top-0 z-20 bg-[#0d1117]/95 pt-4 pb-3">
          {/* Back + Title */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScreen('main_menu')}
              className="text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-[#c9d1d9]">New Career</h1>
              <div className="h-0.5 w-16 rounded-sm bg-emerald-500 opacity-70" />
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => {
              const isCompleted = i < activeStep;
              const isCurrent = i === activeStep;
              return (
                <div key={step.label} className="flex items-center flex-1">
                  <button
                    onClick={() => scrollToStep(i)}
                    className="flex flex-col items-center gap-1 flex-1 min-w-0"
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                            : 'bg-[#161b22] border-[#30363d] text-[#484f58]'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium truncate ${
                        isCurrent ? 'text-emerald-400' : 'text-[#484f58]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1 min-w-[8px]">
                      <div
                        className={`h-full rounded-sm transition-colors ${
                          i < activeStep ? 'bg-emerald-500' : 'bg-[#30363d]'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ---- Step 1: Profile ---- */}
        <div ref={el => { sectionRefs.current[0] = el; }} className="mt-4 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
              Player Name
            </h2>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Leave blank for random name"
                className="flex-1 h-12 text-base bg-[#21262d] border-[#30363d] text-[#c9d1d9] placeholder:text-[#484f58] focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
              />
              <Button
                onClick={handleRandomName}
                variant="outline"
                className="h-12 w-12 p-0 border-[#30363d] bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-emerald-400 hover:border-emerald-500/50 rounded-lg shrink-0"
                title="Random name"
              >
                <Dices className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Nationality */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            {/* Selected nationality display */}
            {selectedNationality && (
              <div className="flex items-center gap-3 mb-3 p-3 bg-[#21262d] rounded-lg">
                <span className="text-3xl">{selectedNationality.flag}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#c9d1d9]">
                    {selectedNationality.name}
                  </span>
                  <span className="text-[10px] text-[#484f58]">Selected nationality</span>
                </div>
              </div>
            )}

            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
              Nationality
            </h2>

            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#484f58]" />
              <Input
                value={nationalitySearch}
                onChange={e => setNationalitySearch(e.target.value)}
                placeholder="Search nationality..."
                className="pl-9 h-9 text-sm bg-[#21262d] border-[#30363d] text-[#c9d1d9] placeholder:text-[#484f58] focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
              />
            </div>

            {/* Nationality grid */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {filteredNationalities.map(n => (
                <button
                  key={n.name}
                  onClick={() => setNationality(n.name)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                    nationality === n.name
                      ? 'bg-emerald-600/15 border border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-[#484f58]'
                  }`}
                >
                  <span className="text-lg shrink-0">{n.flag}</span>
                  <span
                    className={`truncate ${
                      nationality === n.name ? 'text-emerald-300 font-medium' : 'text-[#c9d1d9]'
                    }`}
                  >
                    {n.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ---- Step 2: Position ---- */}
        <div ref={el => { sectionRefs.current[1] = el; }} className="mt-6 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-4">
              Position
            </h2>

            {Object.entries(POSITION_GROUPS).map(([group, posList]) => (
              <div key={group} className="mb-4 last:mb-0">
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#484f58]">{GROUP_ICONS[group]}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#484f58]">
                    {group}
                  </span>
                </div>

                {/* Position buttons */}
                <div className="flex flex-wrap gap-2">
                  {posList.map(pos => {
                    const isSelected = position === pos;
                    const details = POSITION_DETAILS[pos];
                    const posInfo = POSITIONS[pos];
                    return (
                      <div key={pos} className="w-full">
                        <button
                          onClick={() => setPosition(pos)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-colors ${
                            isSelected
                              ? 'bg-emerald-600/15 border border-emerald-500 ring-1 ring-emerald-500/30'
                              : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-[#484f58]'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600/30 text-emerald-300'
                                : 'bg-[#30363d] text-[#8b949e]'
                            }`}
                          >
                            {pos}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? 'text-emerald-300' : 'text-[#c9d1d9]'
                              }`}
                            >
                              {posInfo.fullName}
                            </span>
                            <p className="text-[10px] text-[#484f58] truncate">
                              {details.description}
                            </p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                        </button>

                        {/* Expanded detail card */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-2 ml-4 pl-4 border-l-2 border-emerald-500/40"
                            >
                              <div className="bg-[#0d1117] rounded-lg p-3">
                                <p className="text-xs text-[#8b949e] mb-2">{details.description}</p>
                                <div className="flex gap-2">
                                  {details.keyAttrs.map(attr => (
                                    <div
                                      key={attr.label}
                                      className="flex flex-col items-center bg-[#161b22] border border-[#30363d] rounded-md px-3 py-1.5"
                                    >
                                      <span className="text-[10px] text-[#484f58]">
                                        {attr.label}
                                      </span>
                                      <span className="text-sm font-bold text-emerald-400">
                                        {attr.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ---- Step 3: Club ---- */}
        <div ref={el => { sectionRefs.current[2] = el; }} className="mt-6 space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
              Starting Club
            </h2>

            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#484f58]" />
              <Input
                value={clubSearch}
                onChange={e => setClubSearch(e.target.value)}
                placeholder="Search clubs..."
                className="pl-9 h-9 text-sm bg-[#21262d] border-[#30363d] text-[#c9d1d9] placeholder:text-[#484f58] focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              {filteredClubsByLeague.map(({ league, clubs }) => {
                const isExpanded = expandedLeagues.has(league.id);
                const isSelected = selectedClubLeague === league.id;
                return (
                  <div key={league.id} className="rounded-lg overflow-hidden">
                    {/* League header */}
                    <button
                      onClick={() => toggleLeague(league.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? 'bg-emerald-900/20 border border-emerald-500/30'
                          : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{league.emoji}</span>
                        <span className="font-medium text-[#c9d1d9]">{league.name}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-[#30363d] text-[#484f58]"
                        >
                          {clubs.length}
                        </Badge>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-[#484f58] transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Club list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="grid grid-cols-2 gap-1.5 mt-1.5"
                        >
                          {clubs.map(club => {
                            const isClubSelected = clubId === club.id;
                            return (
                              <div key={club.id} className="w-full">
                                <button
                                  onClick={() => setClubId(club.id)}
                                  className={`flex items-center gap-2 p-2 rounded-lg text-left w-full transition-colors ${
                                    isClubSelected
                                      ? 'bg-emerald-600/15 border border-emerald-500 ring-1 ring-emerald-500/30'
                                      : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] hover:border-[#484f58]'
                                  }`}
                                >
                                  <span className="text-lg shrink-0">{club.logo}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[#c9d1d9] truncate">
                                      {club.shortName}
                                    </p>
                                    <span
                                      className="text-[10px] font-bold"
                                      style={{ color: getOverallColor(club.squadQuality) }}
                                    >
                                      {club.squadQuality}
                                    </span>
                                  </div>
                                </button>

                                {/* Expanded club detail */}
                                <AnimatePresence>
                                  {isClubSelected && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="mt-1.5 ml-2 pl-3 border-l-2 border-emerald-500/40 col-span-2"
                                    >
                                      <div className="bg-[#0d1117] rounded-lg p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xl">{club.logo}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#c9d1d9]">
                                              {club.name}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-xs text-[#484f58]">
                                                {league.emoji} {league.name}
                                              </span>
                                              <span className="text-[#30363d]">·</span>
                                              <span
                                                className="text-xs font-bold"
                                                style={{
                                                  color: getOverallColor(club.squadQuality),
                                                }}
                                              >
                                                OVR {club.squadQuality}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          {[
                                            {
                                              label: 'Formation',
                                              value: club.formation,
                                            },
                                            {
                                              label: 'Style',
                                              value: club.tacticalStyle,
                                            },
                                            {
                                              label: 'Youth',
                                              value: `${club.youthDevelopment}`,
                                            },
                                          ].map(stat => (
                                            <div
                                              key={stat.label}
                                              className="flex flex-col items-center bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1.5"
                                            >
                                              <span className="text-[9px] text-[#484f58] uppercase">
                                                {stat.label}
                                              </span>
                                              <span className="text-xs font-semibold text-[#c9d1d9]">
                                                {stat.value}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ---- Step 4: Difficulty + Launch ---- */}
        <div ref={el => { sectionRefs.current[3] = el; }} className="mt-6 space-y-4">
          {/* Difficulty */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">
              Difficulty
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'normal', 'hard'] as const).map(d => {
                const config = DIFFICULTY_CONFIG[d];
                const isSelected = difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors text-center ${
                      isSelected
                        ? `${config.bgActive} border ${config.borderActive} ring-1 ${config.borderActive}/30`
                        : 'bg-[#21262d] border border-[#30363d] hover:bg-[#30363d] text-[#8b949e]'
                    }`}
                  >
                    <span className={isSelected ? 'text-emerald-400' : 'text-[#484f58]'}>
                      {config.icon}
                    </span>
                    <span
                      className={`text-sm font-semibold capitalize ${
                        isSelected ? config.textActive : ''
                      }`}
                    >
                      {d}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${
                        isSelected
                          ? `${config.borderActive} ${config.textActive} border-opacity-50`
                          : 'border-[#30363d] text-[#484f58]'
                      }`}
                    >
                      {config.badge}
                    </Badge>
                    <p className="text-[9px] text-[#484f58] leading-relaxed hidden sm:block">
                      {config.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Preview card */}
          {selectedClub && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 bg-[#21262d] rounded-lg border border-[#30363d]">
                  <span className="text-3xl">{selectedClub.logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-[#c9d1d9]">
                    {name || 'Random Name'}
                  </p>
                  <p className="text-[#8b949e] text-sm">
                    {selectedNationality?.flag} {nationality} · {position} ·{' '}
                    {selectedClub.name}
                  </p>
                  <p className="text-[#484f58] text-xs mt-0.5">
                    Academy Prospect · Age 14
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#484f58] shrink-0" />
              </div>
            </motion.div>
          )}

          {/* Start Career Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <Button
              onClick={handleStart}
              className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              Start Career
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* ---- Career Analytics: 11 SVG Visualizations ---- */}
        <div className="mt-8 space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#484f58] mb-1">Career Analytics</h2>

          {renderPositionRadar()}
          {renderNationalityDonut()}
          {renderDifficultyGauge()}
          {renderAttributeRadar()}
          {renderOvrDistribution()}
          {renderClubComparison()}
          {renderCareerProjection()}
          {renderBudgetDonut()}
          {renderHeightDistribution()}
          {renderFootSplit()}
          {renderCompletionRing()}
        </div>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}
