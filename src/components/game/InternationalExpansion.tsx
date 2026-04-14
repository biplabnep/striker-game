'use client';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Flag, Trophy, Users, Star, BarChart3,
  TrendingUp, Zap, Target, Heart, Shield, Clock, Award,
  ChevronRight, MapPin, Plane
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NationalTeamInfo {
  name: string;
  code: string;
  ranking: number;
  caps: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  motm: number;
  rating: number;
}

interface InternationalMatch {
  id: string;
  opponent: string;
  opponentCode: string;
  date: string;
  competition: string;
  home: boolean;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
  playerGoals: number;
  playerAssists: number;
  rating: number;
}

interface CallUpEntry {
  id: string;
  date: string;
  competition: string;
  matches: number;
  goals: number;
  notes: string;
}

interface TargetLeague {
  id: string;
  name: string;
  country: string;
  flag: string;
  money: number;
  competition: number;
  prestige: number;
  location: number;
  culture: number;
  interestLevel: 'high' | 'medium' | 'low';
  topClubs: string[];
}

interface ScoutingClub {
  id: string;
  name: string;
  league: string;
  country: string;
  interest: number;
  scoutFreq: string;
  budget: string;
  position: string;
}

interface BracketMatch {
  id: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  winner: string;
}

interface GroupMatch {
  id: string;
  opponent: string;
  scoreFor: number;
  scoreAgainst: number;
  result: 'W' | 'D' | 'L';
  playerGoals: number;
  playerAssists: number;
  rating: number;
}

interface InternationalRecord {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: string;
  achieved: boolean;
}

interface ContinentalEntry {
  id: string;
  name: string;
  year: number;
  result: string;
  matches: number;
  goals: number;
  assists: number;
}

interface DonutRawItem {
  label: string;
  value: number;
  color: string;
}

interface DonutSegment {
  path: string;
  label: string;
  value: number;
  color: string;
  endAngle: number;
}

/* ------------------------------------------------------------------ */
/*  Constants (NOT inside useMemo)                                     */
/* ------------------------------------------------------------------ */

const NATIONAL_TEAM: NationalTeamInfo = {
  name: 'Brazil',
  code: 'BRA',
  ranking: 5,
  caps: 15,
  goals: 3,
  assists: 5,
  cleanSheets: 7,
  motm: 2,
  rating: 7.4,
};

const CAPS_GOAL = 50;
const CAPS_PROGRESS = Math.min(NATIONAL_TEAM.caps / CAPS_GOAL, 1);

const INTERNATIONAL_MATCHES: InternationalMatch[] = [
  {
    id: 'im-1',
    opponent: 'Argentina',
    opponentCode: 'ARG',
    date: '2024-11-15',
    competition: 'World Cup Qualifiers',
    home: true,
    goalsFor: 2,
    goalsAgainst: 1,
    result: 'W',
    playerGoals: 1,
    playerAssists: 0,
    rating: 8.1,
  },
  {
    id: 'im-2',
    opponent: 'France',
    opponentCode: 'FRA',
    date: '2024-09-10',
    competition: 'International Friendly',
    home: false,
    goalsFor: 1,
    goalsAgainst: 1,
    result: 'D',
    playerGoals: 0,
    playerAssists: 1,
    rating: 7.0,
  },
  {
    id: 'im-3',
    opponent: 'Germany',
    opponentCode: 'DEU',
    date: '2024-06-20',
    competition: 'Copa America',
    home: true,
    goalsFor: 3,
    goalsAgainst: 0,
    result: 'W',
    playerGoals: 1,
    playerAssists: 1,
    rating: 8.7,
  },
  {
    id: 'im-4',
    opponent: 'Uruguay',
    opponentCode: 'URU',
    date: '2024-03-22',
    competition: 'World Cup Qualifiers',
    home: false,
    goalsFor: 0,
    goalsAgainst: 1,
    result: 'L',
    playerGoals: 0,
    playerAssists: 0,
    rating: 6.2,
  },
  {
    id: 'im-5',
    opponent: 'Colombia',
    opponentCode: 'COL',
    date: '2023-10-12',
    competition: 'Copa America',
    home: false,
    goalsFor: 2,
    goalsAgainst: 0,
    result: 'W',
    playerGoals: 1,
    playerAssists: 2,
    rating: 9.2,
  },
  {
    id: 'im-6',
    opponent: 'Portugal',
    opponentCode: 'POR',
    date: '2023-09-08',
    competition: 'Nations League',
    home: true,
    goalsFor: 1,
    goalsAgainst: 3,
    result: 'L',
    playerGoals: 0,
    playerAssists: 1,
    rating: 6.8,
  },
];

const CALL_UP_HISTORY: CallUpEntry[] = [
  {
    id: 'cu-1',
    date: '2024-11',
    competition: 'World Cup Qualifiers',
    matches: 2,
    goals: 1,
    notes: 'Started both matches as central midfielder',
  },
  {
    id: 'cu-2',
    date: '2024-09',
    competition: 'International Friendly',
    matches: 1,
    goals: 0,
    notes: 'Substitute appearance vs France',
  },
  {
    id: 'cu-3',
    date: '2024-06',
    competition: 'Copa America',
    matches: 4,
    goals: 2,
    notes: 'Key player in semi-final run',
  },
  {
    id: 'cu-4',
    date: '2024-03',
    competition: 'World Cup Qualifiers',
    matches: 2,
    goals: 0,
    notes: 'Solid defensive displays',
  },
  {
    id: 'cu-5',
    date: '2023-10',
    competition: 'Copa America Qualifiers',
    matches: 2,
    goals: 1,
    notes: 'Assist in crucial away win vs Colombia',
  },
  {
    id: 'cu-6',
    date: '2023-09',
    competition: 'Nations League',
    matches: 2,
    goals: 0,
    notes: 'Full debut for senior national team',
  },
];

const MATCH_RESULT_TREND = [7.2, 6.8, 9.2, 6.2, 8.7, 7.0, 8.1, 7.4];

const NATIONAL_PERFORMANCE = [
  { label: 'Goals', value: 3, max: 15 },
  { label: 'Assists', value: 5, max: 15 },
  { label: 'Clean Sheets', value: 7, max: 15 },
  { label: 'MOTM', value: 2, max: 15 },
  { label: 'Rating', value: 74, max: 100 },
];

const TARGET_LEAGUES: TargetLeague[] = [
  {
    id: 'tl-1',
    name: 'Premier League',
    country: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    money: 95,
    competition: 98,
    prestige: 96,
    location: 85,
    culture: 80,
    interestLevel: 'high',
    topClubs: ['Manchester City', 'Arsenal', 'Liverpool'],
  },
  {
    id: 'tl-2',
    name: 'La Liga',
    country: 'Spain',
    flag: '🇪🇸',
    money: 90,
    competition: 95,
    prestige: 97,
    location: 90,
    culture: 95,
    interestLevel: 'high',
    topClubs: ['Real Madrid', 'Barcelona', 'Atletico Madrid'],
  },
  {
    id: 'tl-3',
    name: 'Serie A',
    country: 'Italy',
    flag: '🇮🇹',
    money: 78,
    competition: 88,
    prestige: 90,
    location: 88,
    culture: 92,
    interestLevel: 'medium',
    topClubs: ['Inter Milan', 'AC Milan', 'Juventus'],
  },
  {
    id: 'tl-4',
    name: 'Bundesliga',
    country: 'Germany',
    flag: '🇩🇪',
    money: 82,
    competition: 85,
    prestige: 88,
    location: 86,
    culture: 82,
    interestLevel: 'medium',
    topClubs: ['Bayern Munich', 'Dortmund', 'Leipzig'],
  },
  {
    id: 'tl-5',
    name: 'Ligue 1',
    country: 'France',
    flag: '🇫🇷',
    money: 88,
    competition: 75,
    prestige: 80,
    location: 92,
    culture: 90,
    interestLevel: 'low',
    topClubs: ['PSG', 'Marseille', 'Monaco'],
  },
];

const SCOUTING_CLUBS: ScoutingClub[] = [
  {
    id: 'sc-1',
    name: 'Manchester City',
    league: 'Premier League',
    country: 'England',
    interest: 92,
    scoutFreq: 'Weekly',
    budget: '€85M',
    position: 'Central Midfield',
  },
  {
    id: 'sc-2',
    name: 'Real Madrid',
    league: 'La Liga',
    country: 'Spain',
    interest: 88,
    scoutFreq: 'Bi-weekly',
    budget: '€120M',
    position: 'Attacking Midfield',
  },
  {
    id: 'sc-3',
    name: 'Bayern Munich',
    league: 'Bundesliga',
    country: 'Germany',
    interest: 75,
    scoutFreq: 'Monthly',
    budget: '€70M',
    position: 'Central Midfield',
  },
  {
    id: 'sc-4',
    name: 'Paris Saint-Germain',
    league: 'Ligue 1',
    country: 'France',
    interest: 68,
    scoutFreq: 'Monthly',
    budget: '€95M',
    position: 'Winger',
  },
];

const TRANSFER_INTEREST_DATA = [
  { label: 'Man City', value: 92, color: '#3b82f6' },
  { label: 'Real Madrid', value: 88, color: '#ef4444' },
  { label: 'Bayern Munich', value: 75, color: '#eab308' },
  { label: 'PSG', value: 68, color: '#1e3a5f' },
  { label: 'Inter Milan', value: 62, color: '#16a34a' },
  { label: 'Arsenal', value: 85, color: '#dc2626' },
];

const MARKET_VALUE_COMPARISON = [
  { label: 'Premier League', value: 85 },
  { label: 'La Liga', value: 90 },
  { label: 'Serie A', value: 72 },
  { label: 'Bundesliga', value: 68 },
  { label: 'Ligue 1', value: 78 },
];

const BRACKET_MATCHES: BracketMatch[] = [
  { id: 'bm-1', home: 'Brazil', away: 'Chile', homeScore: 3, awayScore: 1, winner: 'Brazil' },
  { id: 'bm-2', home: 'Argentina', away: 'Mexico', homeScore: 2, awayScore: 0, winner: 'Argentina' },
  { id: 'bm-3', home: 'France', away: 'Poland', homeScore: 3, awayScore: 1, winner: 'France' },
  { id: 'bm-4', home: 'Germany', away: 'Japan', homeScore: 2, awayScore: 1, winner: 'Germany' },
  { id: 'bm-5', home: 'Spain', away: 'Morocco', homeScore: 1, awayScore: 0, winner: 'Spain' },
  { id: 'bm-6', home: 'Portugal', away: 'Switzerland', homeScore: 2, awayScore: 0, winner: 'Portugal' },
  { id: 'bm-7', home: 'England', away: 'Senegal', homeScore: 3, awayScore: 0, winner: 'England' },
  { id: 'bm-8', home: 'Netherlands', away: 'USA', homeScore: 2, awayScore: 1, winner: 'Netherlands' },
];

const GROUP_MATCHES: GroupMatch[] = [
  { id: 'gm-1', opponent: 'Serbia', scoreFor: 2, scoreAgainst: 1, result: 'W', playerGoals: 1, playerAssists: 0, rating: 7.8 },
  { id: 'gm-2', opponent: 'Switzerland', scoreFor: 3, scoreAgainst: 0, result: 'W', playerGoals: 0, playerAssists: 2, rating: 8.5 },
  { id: 'gm-3', opponent: 'Cameroon', scoreFor: 0, scoreAgainst: 1, result: 'L', playerGoals: 0, playerAssists: 0, rating: 6.5 },
  { id: 'gm-4', opponent: 'South Korea', scoreFor: 2, scoreAgainst: 1, result: 'W', playerGoals: 1, playerAssists: 1, rating: 8.2 },
];

const TOURNAMENT_PROGRESS = [
  { stage: 'Group Stage', date: 'Nov 24', completed: true },
  { stage: 'Round of 16', date: 'Dec 5', completed: true },
  { stage: 'Quarter-Final', date: 'Dec 9', completed: true },
  { stage: 'Semi-Final', date: 'Dec 13', completed: false },
  { stage: 'Final', date: 'Dec 18', completed: false },
];

const HEX_RADAR_DATA = [72, 65, 88, 58, 80, 74];

const TOURNAMENT_MATCH_PERF = [
  { match: 'vs SRB', goals: 1, shots: 3, passes: 42 },
  { match: 'vs SUI', goals: 0, shots: 2, passes: 56 },
  { match: 'vs CMR', goals: 0, shots: 1, passes: 38 },
  { match: 'vs KOR', goals: 1, shots: 4, passes: 51 },
];

const INTERNATIONAL_RECORDS: InternationalRecord[] = [
  { id: 'ir-1', title: 'Youngest Debut', value: '19y 4m', description: 'Youngest player to debut for the national team in 5 years', icon: 'Star', achieved: true },
  { id: 'ir-2', title: 'Fastest Goal', value: '23s', description: 'Fastest goal scored from kick-off in national team history', icon: 'Zap', achieved: true },
  { id: 'ir-3', title: 'Most Assists (Tournament)', value: '4', description: 'Most assists in a single Copa America campaign', icon: 'Target', achieved: true },
  { id: 'ir-4', title: 'Most MOTM Awards', value: '2', description: 'Most Man of the Match awards in debut season', icon: 'Award', achieved: true },
  { id: 'ir-5', title: 'Unbeaten Streak', value: '8 matches', description: 'Longest unbeaten run while in the starting XI', icon: 'Shield', achieved: false },
  { id: 'ir-6', title: 'Consecutive Starts', value: '12', description: 'Most consecutive starts for the national team', icon: 'Clock', achieved: false },
  { id: 'ir-7', title: 'Highest Match Rating', value: '9.2', description: 'Highest single-match rating in competitive fixture', icon: 'Trophy', achieved: true },
  { id: 'ir-8', title: 'Most Dribbles', value: '15', description: 'Most successful dribbles in a single international match', icon: 'Heart', achieved: false },
];

const CONTINENTAL_ENTRIES: ContinentalEntry[] = [
  { id: 'ce-1', name: 'FIFA World Cup', year: 2026, result: 'Quarter-Finals', matches: 5, goals: 3, assists: 4 },
  { id: 'ce-2', name: 'Copa America', year: 2024, result: 'Semi-Finals', matches: 6, goals: 2, assists: 5 },
  { id: 'ce-3', name: 'Confederations Cup', year: 2025, result: 'Group Stage', matches: 3, goals: 1, assists: 2 },
  { id: 'ce-4', name: 'Olympic Games', year: 2024, result: 'Gold Medal', matches: 6, goals: 2, assists: 3 },
  { id: 'ce-5', name: 'FIFA World Cup', year: 2030, result: 'TBD', matches: 0, goals: 0, assists: 0 },
];

const DONUT_RAW_DATA: DonutRawItem[] = [
  { label: 'World Cup', value: 5, color: '#eab308' },
  { label: 'Copa America', value: 3, color: '#22c55e' },
  { label: 'Confederations Cup', value: 1, color: '#3b82f6' },
  { label: 'Olympics', value: 2, color: '#ec4899' },
];

const GOALS_TREND = [0, 1, 0, 2, 1, 3];

const RANKING_HISTORY = [12, 10, 8, 11, 9, 7, 8, 6, 7, 5];

const NATIONAL_TEAM_COMPARISON = [
  { stat: 'Caps', current: 15, legend: 126 },
  { stat: 'Goals', current: 3, legend: 77 },
  { stat: 'Assists', current: 5, legend: 56 },
  { stat: 'Trophies', current: 1, legend: 2 },
  { stat: 'World Cups', current: 0, legend: 2 },
  { stat: 'Debut Age', current: 19, legend: 18 },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function InternationalExpansion() {
  /* ---- Store ---- */
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const playerData = gameState?.player ?? null;
  const currentClub = gameState?.currentClub ?? ({} as unknown as Record<string, unknown>);
  const playerName = playerData?.name ?? 'Your Player';
  const teamName = (currentClub.name as string) ?? 'Your Club';

  /* ---- All hooks BEFORE conditional returns ---- */
  const [activeTab, setActiveTab] = useState('national-team');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [activeBracket, setActiveBracket] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tabChangeTimeRef = useRef<number>(0);

  const handleBack = useCallback(() => {
    setScreen('dashboard');
  }, [setScreen]);

  const handleMatchSelect = useCallback((id: string) => {
    setSelectedMatch(prev => (prev === id ? null : id));
  }, []);

  const handleRecordToggle = useCallback((id: string) => {
    setExpandedRecord(prev => (prev === id ? null : id));
  }, []);

  const handleLeagueSelect = useCallback((id: string) => {
    setSelectedLeague(prev => (prev === id ? null : id));
  }, []);

  const handleBracketHover = useCallback((id: string | null) => {
    setActiveBracket(id);
  }, []);

  const totalDonutVal = DONUT_RAW_DATA.reduce(
    (runningSum, item) => runningSum + item.value,
    0,
  );

  const donutArcs = DONUT_RAW_DATA.reduce<DonutSegment[]>((segAcc, item) => {
      const prevAngle = segAcc.length > 0
        ? segAcc[segAcc.length - 1].endAngle
        : 0;
      const sweep = (item.value / totalDonutVal) * 360;
      const endA = prevAngle + sweep;
      const path = buildDonutSegmentPath(100, 100, 78, 52, prevAngle, endA);
      segAcc.push({
        path,
        label: item.label,
        value: item.value,
        color: item.color,
        endAngle: endA,
      });
      return segAcc;
    }, []);

  useEffect(() => {
    tabChangeTimeRef.current = Date.now();
  }, [activeTab]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = 0;
    }
  }, [activeTab]);

  /* ---- SVG Helper functions (extracted, never inline .map().join()) ---- */

  const buildAreaPoints = (
    data: number[],
    width: number,
    height: number,
    maxVal: number,
  ): string => {
    const stepX = width / (data.length - 1);
    const safeMax = maxVal || 1;
    return data.map((val, i) => {
      const x = i * stepX;
      const y = height - (val / safeMax) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const buildAreaFill = (
    data: number[],
    width: number,
    height: number,
    maxVal: number,
  ): string => {
    const stepX = width / (data.length - 1);
    const safeMax = maxVal || 1;
    const linePoints = data.map((val, i) => {
      const x = i * stepX;
      const y = height - (val / safeMax) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `${linePoints} ${width},${height} 0,${height}`;
  };

  const buildLinePoints = (
    data: number[],
    width: number,
    height: number,
    maxVal: number,
  ): string => {
    const stepX = width / (data.length - 1);
    const safeMax = maxVal || 1;
    return data.map((val, i) => {
      const x = i * stepX;
      const y = height - (val / safeMax) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angleDeg: number,
  ): { x: number; y: number } => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArcPath = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
  ): string => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  };

  const buildDonutSegmentPath = (
    cx: number,
    cy: number,
    outerR: number,
    innerR: number,
    startAngle: number,
    endAngle: number,
  ): string => {
    const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
    const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
    const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
    const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
      `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
      'Z',
    ].join(' ');
  };

  const buildRadarPoints = (
    values: number[],
    cx: number,
    cy: number,
    maxR: number,
    axisCount: number,
  ): string => {
    const step = 360 / axisCount;
    return values.map((val, i) => {
      const angle = step * i - 90;
      const r = (val / 100) * maxR;
      const pt = polarToCartesian(cx, cy, r, angle);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');
  };

  const buildGridPoints = (
    level: number,
    cx: number,
    cy: number,
    maxR: number,
    axisCount: number,
  ): string => {
    const r = (level / 100) * maxR;
    const step = 360 / axisCount;
    return Array.from({ length: axisCount }, (_, i) => {
      const angle = step * i - 90;
      const pt = polarToCartesian(cx, cy, r, angle);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');
  };

  /* ---- Animation variants (opacity only) ---- */
  const fadeVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  /* ---- Conditional return (AFTER all hooks) ---- */
  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        <p>Loading international data...</p>
      </div>
    );
  }

  /* ================================================================== */
  /*  SUB-COMPONENTS (camelCase, called as {fnName()})                   */
  /* ================================================================== */

  /* ---------- TAB 1: National Team Career ---------- */

  const renderNationalTeamCard = (): React.JSX.Element => {
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference * (1 - CAPS_PROGRESS);
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Flag className="w-5 h-5 text-yellow-500" />
            National Team Career
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg">
              <span className="text-3xl font-bold text-yellow-600">🇧🇷</span>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{NATIONAL_TEAM.name}</h3>
              <Badge variant="secondary" className="mt-1 text-xs bg-yellow-100 text-yellow-700 border-yellow-200">
                FIFA Rank #{NATIONAL_TEAM.ranking}
              </Badge>
              <p className="mt-1 text-sm text-slate-500">{playerName} • #{NATIONAL_TEAM.code}</p>
            </div>
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="w-28 h-28">
                <circle
                  cx="60" cy="60" r="54"
                  fill="none" stroke="#e2e8f0" strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none" stroke="#eab308" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-700"
                />
                <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#0f172a">
                  {NATIONAL_TEAM.caps}
                </text>
                <text x="60" y="70" textAnchor="middle" fontSize="10" fill="#64748b">
                  / {CAPS_GOAL} caps
                </text>
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Goals', val: NATIONAL_TEAM.goals, color: 'text-blue-600' },
              { label: 'Assists', val: NATIONAL_TEAM.assists, color: 'text-green-600' },
              { label: 'Clean Sheets', val: NATIONAL_TEAM.cleanSheets, color: 'text-purple-600' },
              { label: 'MOTM', val: NATIONAL_TEAM.motm, color: 'text-yellow-600' },
            ].map((item) => (
              <div key={item.label} className="text-center p-2 bg-slate-50 rounded-lg">
                <p className={`text-xl font-bold ${item.color}`}>{item.val}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMatchCards = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Globe className="w-5 h-5 text-blue-500" />
            International Matches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {INTERNATIONAL_MATCHES.map((match) => {
            const isSelected = selectedMatch === match.id;
            const resultColor = match.result === 'W'
              ? 'bg-green-100 text-green-700 border-green-200'
              : match.result === 'D'
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                : 'bg-red-100 text-red-700 border-red-200';
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleMatchSelect(match.id)}
                className="cursor-pointer border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={`${resultColor} text-xs font-bold border`} variant="outline">
                      {match.result}
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {match.home ? 'vs' : '@'} {match.opponent}
                      </p>
                      <p className="text-xs text-slate-500">{match.competition} • {match.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {match.goalsFor} - {match.goalsAgainst}
                      </p>
                      <p className="text-xs text-slate-500">
                        {match.playerGoals}G {match.playerAssists}A
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50'}`} />
                  </div>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-3 pt-3 border-t border-slate-100"
                    >
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 rounded p-2">
                          <p className="text-xs text-slate-500">Rating</p>
                          <p className="text-sm font-bold text-slate-900">{match.rating}</p>
                        </div>
                        <div className="bg-slate-50 rounded p-2">
                          <p className="text-xs text-slate-500">Goals</p>
                          <p className="text-sm font-bold text-blue-600">{match.playerGoals}</p>
                        </div>
                        <div className="bg-slate-50 rounded p-2">
                          <p className="text-xs text-slate-500">Assists</p>
                          <p className="text-sm font-bold text-green-600">{match.playerAssists}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const renderCallUpTimeline = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Clock className="w-5 h-5 text-indigo-500" />
            Call-Up History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
            {CALL_UP_HISTORY.map((entry, i) => (
              <div key={entry.id} className="relative flex items-start gap-4 pb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 border-2 border-indigo-400 flex items-center justify-center z-10 shrink-0">
                  <span className="text-xs font-bold text-indigo-700">{i + 1}</span>
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{entry.competition}</p>
                    <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-600">
                      {entry.date}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{entry.notes}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-blue-600 font-medium">{entry.matches} matches</span>
                    <span className="text-xs text-green-600 font-medium">{entry.goals} goals</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCapsProgressRing = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">International Caps Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <svg viewBox="0 0 200 160" className="w-full max-w-xs">
            {Array.from({ length: 5 }, (_, i) => {
              const pct = (i + 1) * 20;
              const r = 25 + i * 12;
              return (
                <circle
                  key={`grid-${i}`}
                  cx="100" cy="80" r={r}
                  fill="none" stroke="#e2e8f0" strokeWidth="0.5"
                  strokeDasharray="3,3" opacity={0.5}
                />
              );
            })}
            <circle
              cx="100" cy="80" r="85"
              fill="none" stroke="#3b82f6" strokeWidth="6"
              strokeDasharray={2 * Math.PI * 85}
              strokeDashoffset={2 * Math.PI * 85 * (1 - CAPS_PROGRESS)}
              strokeLinecap="round"
            />
            <text x="100" y="72" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#0f172a">
              {NATIONAL_TEAM.caps}
            </text>
            <text x="100" y="92" textAnchor="middle" fontSize="12" fill="#64748b">
              of {CAPS_GOAL} caps ({Math.round(CAPS_PROGRESS * 100)}%)
            </text>
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceBars = (): React.JSX.Element => {
    const barColors = ['#3b82f6', '#22c55e', '#a855f7', '#eab308', '#ef4444'];
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">National Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 300 160" className="w-full">
            {NATIONAL_PERFORMANCE.map((item, i) => {
              const barWidth = (item.value / item.max) * 200;
              const y = 10 + i * 28;
              return (
                <g key={item.label}>
                  <text x="0" y={y + 14} fontSize="12" fill="#334155" textAnchor="start">
                    {item.label}
                  </text>
                  <rect x="100" y={y} width={barWidth} height="16" fill={barColors[i]} rx="2" />
                  <rect x="100" y={y} width="200" height="16" fill="none" stroke="#e2e8f0" strokeWidth="0.5" rx="2" />
                  <text x={108 + barWidth} y={y + 13} fontSize="12" fontWeight="bold" fill="#0f172a">
                    {item.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderMatchResultTrend = (): React.JSX.Element => {
    const chartW = 280;
    const chartH = 120;
    const maxR = 10;
    const linePoints = buildLinePoints(MATCH_RESULT_TREND, chartW, chartH, maxR);
    const fillPoints = buildAreaFill(MATCH_RESULT_TREND, chartW, chartH, maxR);
    const matchLabels = ['ARG', 'FRA', 'DEU', 'URU', 'COL', 'POR', 'ARG', 'AVG'];
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Match Rating Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 300 160" className="w-full">
            <line x1="10" y1="10" x2="10" y2={chartH + 10} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
            {[0, 2.5, 5, 7.5, 10].map((val, gi) => {
              const gy = chartH + 10 - (val / maxR) * chartH;
              return (
                <g key={`grid-y-${gi}`}>
                  <line x1="10" y1={gy} x2={chartW + 10} y2={gy} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.2" />
                  <text x="2" y={gy + 4} fontSize="9" fill="#94a3b8" textAnchor="start">{val}</text>
                </g>
              );
            })}
            <polygon points={fillPoints} fill="#3b82f6" fillOpacity="0.1" transform={`translate(10,10)`} />
            <polyline points={linePoints} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform={`translate(10,10)`} />
            {MATCH_RESULT_TREND.map((val, di) => {
              const dx = (di / (MATCH_RESULT_TREND.length - 1)) * chartW;
              const dy = chartH - (val / maxR) * chartH;
              return (
                <g key={`dot-${di}`}>
                  <circle cx={dx + 10} cy={dy + 10} r="3" fill="#3b82f6" />
                  <text x={dx + 10} y={chartH + 26} textAnchor="middle" fontSize="8" fill="#94a3b8">
                    {matchLabels[di]}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  /* ---------- TAB 2: Global Transfer Interest ---------- */

  const renderLeagueAttractivenessRadar = (): React.JSX.Element => {
    const cx = 130;
    const cy = 120;
    const maxR = 90;
    const axisCount = 5;
    const axisLabels = ['Money', 'Competition', 'Prestige', 'Location', 'Culture'];
    const selectedIdx = TARGET_LEAGUES.findIndex(l => l.id === selectedLeague);
    const league = selectedIdx >= 0 ? TARGET_LEAGUES[selectedIdx] : TARGET_LEAGUES[0];
    const dataValues = [league.money, league.competition, league.prestige, league.location, league.culture];
    const dataPoints = buildRadarPoints(dataValues, cx, cy, maxR, axisCount);
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">League Attractiveness Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1 mb-2">
            {TARGET_LEAGUES.map((tl) => (
              <button
                key={tl.id}
                onClick={() => handleLeagueSelect(tl.id)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                  selectedLeague === tl.id
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {tl.name}
              </button>
            ))}
          </div>
          <svg viewBox="0 0 260 240" className="w-full max-w-sm mx-auto">
            {[25, 50, 75, 100].map((level) => {
              const gridPts = buildGridPoints(level, cx, cy, maxR, axisCount);
              return (
                <polygon
                  key={`radar-grid-${level}`}
                  points={gridPts}
                  fill="none" stroke="#e2e8f0" strokeWidth="0.5"
                />
              );
            })}
            {axisLabels.map((label, ai) => {
              const angle = (360 / axisCount) * ai - 90;
              const edge = polarToCartesian(cx, cy, maxR + 18, angle);
              return (
                <g key={`radar-axis-${ai}`}>
                  <line
                    x1={cx} y1={cy}
                    x2={polarToCartesian(cx, cy, maxR, angle).x}
                    y2={polarToCartesian(cx, cy, maxR, angle).y}
                    stroke="#cbd5e1" strokeWidth="0.5"
                  />
                  <text x={edge.x} y={edge.y + 4} textAnchor="middle" fontSize="12" fill="#475569">
                    {label}
                  </text>
                </g>
              );
            })}
            <polygon
              points={dataPoints}
              fill="#3b82f6" fillOpacity="0.2"
              stroke="#3b82f6" strokeWidth="2"
            />
            {dataValues.map((val, vi) => {
              const angle = (360 / axisCount) * vi - 90;
              const r = (val / 100) * maxR;
              const pt = polarToCartesian(cx, cy, r, angle);
              return (
                <circle key={`radar-dot-${vi}`} cx={pt.x} cy={pt.y} r="3" fill="#3b82f6" />
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderTransferInterestBars = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Transfer Interest</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 300 200" className="w-full">
            {TRANSFER_INTEREST_DATA.map((item, i) => {
              const barH = (item.value / 100) * 150;
              const x = 20 + i * 48;
              const y = 160 - barH;
              return (
                <g key={item.label}>
                  <rect x={x} y={y} width="32" height={barH} fill={item.color} rx="2" />
                  <text x={x + 16} y={y - 4} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0f172a">
                    {item.value}
                  </text>
                  <text x={x + 16} y={178} textAnchor="middle" fontSize="9" fill="#64748b">
                    {item.label.length > 8 ? item.label.slice(0, 7) + '..' : item.label}
                  </text>
                </g>
              );
            })}
            {[0, 25, 50, 75, 100].map((gv, gi) => {
              const gy = 160 - (gv / 100) * 150;
              return (
                <g key={`ti-grid-${gi}`}>
                  <line x1="10" y1={gy} x2="290" y2={gy} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.2" />
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderMarketValueBars = (): React.JSX.Element => {
    const maxVal = Math.max(...MARKET_VALUE_COMPARISON.map(m => m.value));
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Global Market Value (€M)</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 300 160" className="w-full">
            {MARKET_VALUE_COMPARISON.map((item, i) => {
              const barW = (item.value / maxVal) * 200;
              const y = 8 + i * 28;
              const barColor = i === 0 ? '#3b82f6' : i === 1 ? '#ef4444' : '#94a3b8';
              return (
                <g key={item.label}>
                  <text x="0" y={y + 14} fontSize="12" fill="#334155" textAnchor="start">
                    {item.label.length > 14 ? item.label.slice(0, 13) + '..' : item.label}
                  </text>
                  <rect x="110" y={y} width={barW} height="16" fill={barColor} rx="2" />
                  <rect x="110" y={y} width="200" height="16" fill="none" stroke="#e2e8f0" strokeWidth="0.5" rx="2" />
                  <text x={118 + barW} y={y + 13} fontSize="12" fontWeight="bold" fill="#0f172a">
                    €{item.value}M
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderTargetLeagueCards = (): React.JSX.Element => {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Target Leagues
        </h3>
        {TARGET_LEAGUES.map((league) => {
          const interestBadge = league.interestLevel === 'high'
            ? 'bg-green-100 text-green-700 border-green-200'
            : league.interestLevel === 'medium'
              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
              : 'bg-slate-100 text-slate-500 border-slate-200';
          return (
            <motion.div
              key={league.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-slate-200 rounded-lg p-3 bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{league.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{league.name}</p>
                    <p className="text-xs text-slate-500">{league.country}</p>
                  </div>
                </div>
                <Badge className={`${interestBadge} text-xs border`} variant="outline">
                  {league.interestLevel} interest
                </Badge>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {league.topClubs.map((club) => (
                  <Badge key={club} variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                    {club}
                  </Badge>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderScoutingClubs = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Plane className="w-5 h-5 text-indigo-500" />
            Clubs Scouting You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SCOUTING_CLUBS.map((club) => {
            const interestColor = club.interest >= 85
              ? 'text-green-600'
              : club.interest >= 70
                ? 'text-yellow-600'
                : 'text-slate-500';
            return (
              <div key={club.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{club.name}</p>
                    <p className="text-xs text-slate-500">{club.league} • {club.country}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${interestColor}`}>{club.interest}%</p>
                    <p className="text-xs text-slate-400">interest</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Scout Freq</p>
                    <p className="text-xs font-medium text-slate-700">{club.scoutFreq}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Budget</p>
                    <p className="text-xs font-medium text-slate-700">{club.budget}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Position</p>
                    <p className="text-xs font-medium text-slate-700">{club.position}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  /* ---------- TAB 3: World Cup Journey ---------- */

  const renderTournamentBracket = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Round of 16 Bracket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {BRACKET_MATCHES.map((match) => {
              const isBrazil = match.home === 'Brazil' || match.away === 'Brazil';
              const isHighlighted = activeBracket === match.id;
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onMouseEnter={() => handleBracketHover(match.id)}
                  onMouseLeave={() => handleBracketHover(null)}
                  className={`border rounded-lg p-3 transition-colors ${
                    isBrazil
                      ? 'border-yellow-300 bg-yellow-50'
                      : isHighlighted
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${match.home === match.winner ? 'text-slate-900' : 'text-slate-400'}`}>
                      {match.home}
                    </span>
                    <span className="text-sm font-bold text-slate-700">{match.homeScore}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-sm font-medium ${match.away === match.winner ? 'text-slate-900' : 'text-slate-400'}`}>
                      {match.away}
                    </span>
                    <span className="text-sm font-bold text-slate-700">{match.awayScore}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGroupStageMatches = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Target className="w-5 h-5 text-red-500" />
            Group Stage Matches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {GROUP_MATCHES.map((gm) => {
            const gmColor = gm.result === 'W'
              ? 'bg-green-50 border-green-200'
              : gm.result === 'D'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200';
            const gmBadge = gm.result === 'W'
              ? 'bg-green-100 text-green-700'
              : gm.result === 'D'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700';
            return (
              <div key={gm.id} className={`border rounded-lg p-3 ${gmColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Brazil {gm.scoreFor} - {gm.scoreAgainst} {gm.opponent}
                    </p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        <span className="font-medium text-blue-600">{gm.playerGoals}G</span>
                        {' '}
                        <span className="font-medium text-green-600">{gm.playerAssists}A</span>
                      </span>
                      <span className="text-xs text-slate-500">Rating: {gm.rating}</span>
                    </div>
                  </div>
                  <Badge className={`${gmBadge} text-xs font-bold`} variant="outline">
                    {gm.result}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const renderTournamentProgressTimeline = (): React.JSX.Element => {
    const dotSpacing = 50;
    const startX = 20;
    const lineY = 30;
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Tournament Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 280 80" className="w-full">
            <line
              x1={startX} y1={lineY} x2={startX + dotSpacing * 4} y2={lineY}
              stroke="#cbd5e1" strokeWidth="2"
            />
            {TOURNAMENT_PROGRESS.map((step, i) => {
              const cx = startX + i * dotSpacing;
              const fillColor = step.completed ? '#22c55e' : '#e2e8f0';
              const textColor = step.completed ? '#0f172a' : '#94a3b8';
              return (
                <g key={step.stage}>
                  <circle cx={cx} cy={lineY} r="8" fill={fillColor} />
                  {step.completed && (
                    <path d={`M${cx - 4},${lineY} L${cx - 1},${lineY + 3} L${cx + 5},${lineY - 3}`} fill="white" strokeWidth="1.5" stroke="white" />
                  )}
                  <text x={cx} y={lineY + 22} textAnchor="middle" fontSize="10" fontWeight="bold" fill={textColor}>
                    {step.stage.split(' ')[0]}
                  </text>
                  <text x={cx} y={lineY + 34} textAnchor="middle" fontSize="9" fill="#94a3b8">
                    {step.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderWorldCupHexRadar = (): React.JSX.Element => {
    const cx = 130;
    const cy = 120;
    const maxR = 85;
    const axisCount = 6;
    const hexLabels = ['Goals', 'Assists', 'Passes', 'Tackles', 'Distance', 'Rating'];
    const hexPoints = buildRadarPoints(HEX_RADAR_DATA, cx, cy, maxR, axisCount);
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">World Cup Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 260 240" className="w-full max-w-sm mx-auto">
            {[25, 50, 75, 100].map((level) => {
              const gridPts = buildGridPoints(level, cx, cy, maxR, axisCount);
              return (
                <polygon
                  key={`hex-grid-${level}`}
                  points={gridPts}
                  fill="none" stroke="#e2e8f0" strokeWidth="0.5"
                />
              );
            })}
            {hexLabels.map((label, ai) => {
              const angle = (360 / axisCount) * ai - 90;
              const edge = polarToCartesian(cx, cy, maxR + 18, angle);
              const axisEnd = polarToCartesian(cx, cy, maxR, angle);
              return (
                <g key={`hex-axis-${ai}`}>
                  <line x1={cx} y1={cy} x2={axisEnd.x} y2={axisEnd.y} stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x={edge.x} y={edge.y + 4} textAnchor="middle" fontSize="12" fill="#475569">
                    {label}
                  </text>
                </g>
              );
            })}
            <polygon
              points={hexPoints}
              fill="#eab308" fillOpacity="0.2"
              stroke="#eab308" strokeWidth="2"
            />
            {HEX_RADAR_DATA.map((val, vi) => {
              const angle = (360 / axisCount) * vi - 90;
              const r = (val / 100) * maxR;
              const pt = polarToCartesian(cx, cy, r, angle);
              return (
                <circle key={`hex-dot-${vi}`} cx={pt.x} cy={pt.y} r="3" fill="#eab308" />
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderMatchPerformanceBars = (): React.JSX.Element => {
    const maxGoal = Math.max(...TOURNAMENT_MATCH_PERF.map(m => m.goals));
    const maxShot = Math.max(...TOURNAMENT_MATCH_PERF.map(m => m.shots));
    const maxPass = Math.max(...TOURNAMENT_MATCH_PERF.map(m => m.passes));
    const barGroupWidth = 60;
    const startX = 40;
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Match Performance (Goals/Shots/Passes)</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 300 180" className="w-full">
            {[0, 25, 50, 75, 100].map((gv, gi) => {
              const gy = 150 - (gv / 100) * 120;
              return (
                <g key={`mp-grid-${gi}`}>
                  <line x1="35" y1={gy} x2="295" y2={gy} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.2" />
                </g>
              );
            })}
            {TOURNAMENT_MATCH_PERF.map((mp, mi) => {
              const gx = startX + mi * barGroupWidth;
              const goalH = maxGoal > 0 ? (mp.goals / maxShot) * 120 : 0;
              const shotH = maxShot > 0 ? (mp.shots / maxShot) * 120 : 0;
              const passH = maxPass > 0 ? (mp.passes / 60) * 120 : 0;
              return (
                <g key={mp.match}>
                  <rect x={gx} y={150 - goalH} width="14" height={goalH} fill="#3b82f6" rx="1" />
                  <rect x={gx + 16} y={150 - shotH} width="14" height={shotH} fill="#22c55e" rx="1" />
                  <rect x={gx + 32} y={150 - passH} width="14" height={passH} fill="#eab308" rx="1" />
                  <text x={gx + 23} y={168} textAnchor="middle" fontSize="9" fill="#64748b">
                    {mp.match}
                  </text>
                </g>
              );
            })}
            <rect x={startX + 40} y="6" width="10" height="10" fill="#3b82f6" rx="1" />
            <text x={startX + 55} y="14" fontSize="10" fill="#64748b">Goals</text>
            <rect x={startX + 90} y="6" width="10" height="10" fill="#22c55e" rx="1" />
            <text x={startX + 105} y="14" fontSize="10" fill="#64748b">Shots</text>
            <rect x={startX + 140} y="6" width="10" height="10" fill="#eab308" rx="1" />
            <text x={startX + 155} y="14" fontSize="10" fill="#64748b">Passes</text>
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderTournamentPlayerStats = (): React.JSX.Element => {
    const totalGoals = GROUP_MATCHES.reduce((tGoal, g) => tGoal + g.playerGoals, 0);
    const totalAssists = GROUP_MATCHES.reduce((tAssist, g) => tAssist + g.playerAssists, 0);
    const avgRating = GROUP_MATCHES.reduce((tRat, g) => tRat + g.rating, 0) / GROUP_MATCHES.length;
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Users className="w-5 h-5 text-green-500" />
            Your Tournament Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{totalGoals}</p>
              <p className="text-xs text-slate-500">Goals</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{totalAssists}</p>
              <p className="text-xs text-slate-500">Assists</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{GROUP_MATCHES.length}</p>
              <p className="text-xs text-slate-500">Matches</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{avgRating.toFixed(1)}</p>
              <p className="text-xs text-slate-500">Avg Rating</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ---------- TAB 4: International Records ---------- */

  const renderInternationalRecords = (): React.JSX.Element => {
    const iconMap: Record<string, React.JSX.Element> = {
      Star: <Star className="w-5 h-5 text-yellow-500" />,
      Zap: <Zap className="w-5 h-5 text-blue-500" />,
      Target: <Target className="w-5 h-5 text-red-500" />,
      Award: <Award className="w-5 h-5 text-purple-500" />,
      Shield: <Shield className="w-5 h-5 text-green-500" />,
      Clock: <Clock className="w-5 h-5 text-indigo-500" />,
      Trophy: <Trophy className="w-5 h-5 text-yellow-600" />,
      Heart: <Heart className="w-5 h-5 text-pink-500" />,
    };
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Award className="w-5 h-5 text-amber-500" />
            Career International Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {INTERNATIONAL_RECORDS.map((record) => {
            const isExpanded = expandedRecord === record.id;
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleRecordToggle(record.id)}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  record.achieved
                    ? 'border-green-200 bg-green-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                      {iconMap[record.icon]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{record.title}</p>
                      <p className="text-lg font-bold text-blue-600">{record.value}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border ${record.achieved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`} variant="outline">
                      {record.achieved ? 'Achieved' : 'In Progress'}
                    </Badge>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-40'}`} />
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 pt-2 border-t border-slate-200"
                    >
                      <p className="text-xs text-slate-600">{record.description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const renderContinentalEntries = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <Globe className="w-5 h-5 text-cyan-500" />
            Continental Competitions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CONTINENTAL_ENTRIES.map((entry) => {
            const isFuture = entry.result === 'TBD';
            return (
              <div
                key={entry.id}
                className={`border rounded-lg p-3 ${
                  isFuture ? 'border-dashed border-slate-300 bg-slate-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                    <p className="text-xs text-slate-500">{entry.year}</p>
                  </div>
                  <Badge
                    className={`text-xs border ${
                      isFuture
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : entry.result.includes('Gold')
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                    variant="outline"
                  >
                    {entry.result}
                  </Badge>
                </div>
                {!isFuture && (
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Matches</p>
                      <p className="text-sm font-bold text-slate-700">{entry.matches}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Goals</p>
                      <p className="text-sm font-bold text-blue-600">{entry.goals}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Assists</p>
                      <p className="text-sm font-bold text-green-600">{entry.assists}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const renderNationalTeamComparison = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-violet-500" />
            All-Time Comparison (You vs Legend)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 300 180" className="w-full">
            {[0, 30, 60, 90, 120].map((gv, gi) => {
              const gy = 150 - (gv / 120) * 120;
              return (
                <g key={`comp-grid-${gi}`}>
                  <line x1="55" y1={gy} x2="295" y2={gy} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.2" />
                  <text x="48" y={gy + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{gv}</text>
                </g>
              );
            })}
            {NATIONAL_TEAM_COMPARISON.map((item, ci) => {
              const y = 10 + ci * 26;
              const currentBarW = (item.current / 120) * 230;
              const legendBarW = (item.legend / 120) * 230;
              return (
                <g key={item.stat}>
                  <text x="0" y={y + 10} fontSize="11" fill="#334155" textAnchor="start">
                    {item.stat}
                  </text>
                  <rect x="60" y={y} width={legendBarW} height="8" fill="#94a3b8" rx="1" />
                  <rect x="60" y={y + 10} width={currentBarW} height="8" fill="#3b82f6" rx="1" />
                  <text x={65 + legendBarW} y={y + 8} fontSize="9" fill="#64748b">
                    {item.legend}
                  </text>
                  <text x={65 + currentBarW} y={y + 18} fontSize="9" fontWeight="bold" fill="#1e40af">
                    {item.current}
                  </text>
                </g>
              );
            })}
            <rect x="200" y="155" width="10" height="8" fill="#3b82f6" rx="1" />
            <text x="214" y="163" fontSize="10" fill="#64748b">{playerName}</text>
            <rect x="240" y="155" width="10" height="8" fill="#94a3b8" rx="1" />
            <text x="254" y="163" fontSize="10" fill="#64748b">Legend</text>
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderGoalsTrendLine = (): React.JSX.Element => {
    const chartW = 260;
    const chartH = 100;
    const maxG = Math.max(...GOALS_TREND, 1);
    const seasonLabels = ['20/21', '21/22', '22/23', '23/24', '24/25', '25/26'];
    const linePoints = buildLinePoints(GOALS_TREND, chartW, chartH, maxG);
    const fillPoints = buildAreaFill(GOALS_TREND, chartW, chartH, maxG);
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">International Goals Per Season</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 300 150" className="w-full">
            {[0, 1, 2, 3].map((gv, gi) => {
              const gy = chartH + 10 - (gv / maxG) * chartH;
              return (
                <g key={`gl-grid-${gi}`}>
                  <line x1="20" y1={gy} x2={chartW + 20} y2={gy} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.2" />
                  <text x="14" y={gy + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{gv}</text>
                </g>
              );
            })}
            <polygon points={fillPoints} fill="#22c55e" fillOpacity="0.1" transform="translate(20,10)" />
            <polyline points={linePoints} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(20,10)" />
            {GOALS_TREND.map((val, di) => {
              const dx = (di / (GOALS_TREND.length - 1)) * chartW;
              const dy = chartH - (val / maxG) * chartH;
              return (
                <g key={`gl-dot-${di}`}>
                  <circle cx={dx + 20} cy={dy + 10} r="4" fill="#22c55e" />
                  <text x={dx + 20} y={dy + 2} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">
                    {val}
                  </text>
                  <text x={dx + 20} y={chartH + 26} textAnchor="middle" fontSize="9" fill="#94a3b8">
                    {seasonLabels[di]}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  const renderContinentalDonut = (): React.JSX.Element => {
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Appearances by Competition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 200 200" className="w-36 h-36 shrink-0">
              {donutArcs.map((seg) => (
                <path key={seg.label} d={seg.path} fill={seg.color} stroke="white" strokeWidth="2" />
              ))}
              <text x="100" y="95" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#0f172a">
                {totalDonutVal}
              </text>
              <text x="100" y="112" textAnchor="middle" fontSize="11" fill="#64748b">
                appearances
              </text>
            </svg>
            <div className="space-y-2">
              {donutArcs.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-slate-600">{seg.label}</span>
                  <span className="text-xs font-bold text-slate-900">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRankingHistoryArea = (): React.JSX.Element => {
    const chartW = 260;
    const chartH = 100;
    const minR = 1;
    const maxR = 15;
    const range = maxR - minR;
    const yearLabels = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027'];
    const invertedData = RANKING_HISTORY.map(v => maxR - v + minR);
    const linePoints = buildLinePoints(invertedData, chartW, chartH, range);
    const fillPoints = buildAreaFill(invertedData, chartW, chartH, range);
    return (
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">National Team Ranking History</CardTitle>
        </CardHeader>
        <CardContent>
          <svg viewBox="0 0 300 150" className="w-full">
            {[1, 4, 8, 12, 15].map((rank, ri) => {
              const normalized = maxR - rank + minR;
              const gy = chartH + 10 - (normalized / range) * chartH;
              return (
                <g key={`rh-grid-${ri}`}>
                  <line x1="30" y1={gy} x2={chartW + 30} y2={gy} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.2" />
                  <text x="24" y={gy + 4} textAnchor="end" fontSize="9" fill="#94a3b8">#{rank}</text>
                </g>
              );
            })}
            <polygon points={fillPoints} fill="#8b5cf6" fillOpacity="0.1" transform="translate(30,10)" />
            <polyline points={linePoints} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(30,10)" />
            {RANKING_HISTORY.map((rank, ri) => {
              const dx = (ri / (RANKING_HISTORY.length - 1)) * chartW;
              const normalized = maxR - rank + minR;
              const dy = chartH - (normalized / range) * chartH;
              return (
                <g key={`rh-dot-${ri}`}>
                  <circle cx={dx + 30} cy={dy + 10} r="3" fill="#8b5cf6" />
                  <text x={dx + 30} y={dy + 2} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
                    #{rank}
                  </text>
                  <text x={dx + 30} y={chartH + 26} textAnchor="middle" fontSize="8" fill="#94a3b8">
                    {yearLabels[ri]}
                  </text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  };

  /* ================================================================== */
  /*  MAIN JSX RETURN                                                    */
  /* ================================================================== */

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 p-4 pb-24 overflow-y-auto max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="w-9 h-9 rounded-lg p-0 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">International Expansion</h1>
          <p className="text-xs text-slate-500">{playerName} • {teamName}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full bg-slate-100 rounded-lg p-1 h-auto">
          <TabsTrigger
            value="national-team"
            className="text-xs py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Flag className="w-3.5 h-3.5 mr-1" />
            Nat. Team
          </TabsTrigger>
          <TabsTrigger
            value="transfer-interest"
            className="text-xs py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Transfers
          </TabsTrigger>
          <TabsTrigger
            value="world-cup"
            className="text-xs py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 mr-1" />
            World Cup
          </TabsTrigger>
          <TabsTrigger
            value="records"
            className="text-xs py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
          >
            <Star className="w-3.5 h-3.5 mr-1" />
            Records
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: National Team Career */}
        <TabsContent value="national-team" className="mt-4 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="national-team"
              variants={fadeVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              {renderNationalTeamCard()}
              {renderMatchCards()}
              {renderCallUpTimeline()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderCapsProgressRing()}
                {renderPerformanceBars()}
              </div>
              {renderMatchResultTrend()}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Tab 2: Global Transfer Interest */}
        <TabsContent value="transfer-interest" className="mt-4 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="transfer-interest"
              variants={fadeVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              {renderTargetLeagueCards()}
              {renderScoutingClubs()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderLeagueAttractivenessRadar()}
                {renderTransferInterestBars()}
              </div>
              {renderMarketValueBars()}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Tab 3: World Cup Journey */}
        <TabsContent value="world-cup" className="mt-4 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="world-cup"
              variants={fadeVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              {renderTournamentBracket()}
              {renderGroupStageMatches()}
              {renderTournamentPlayerStats()}
              {renderTournamentProgressTimeline()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderWorldCupHexRadar()}
                {renderMatchPerformanceBars()}
              </div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Tab 4: International Records */}
        <TabsContent value="records" className="mt-4 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="records"
              variants={fadeVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              {renderInternationalRecords()}
              {renderContinentalEntries()}
              {renderNationalTeamComparison()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderGoalsTrendLine()}
                {renderContinentalDonut()}
              </div>
              {renderRankingHistoryArea()}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
