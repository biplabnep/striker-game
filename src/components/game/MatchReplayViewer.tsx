'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Play, Pause, SkipForward, SkipBack,
  Target, Clock, Users, MapPin, Zap, TrendingUp,
  BarChart3, Activity, Award, Eye, RotateCcw,
  ChevronRight, Star, Flag, Shield
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────
interface MatchEventItem {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'shot_on_target' | 'shot_blocked' | 'corner' | 'foul';
  team: 'home' | 'away';
  playerName: string;
  detail: string;
}

interface FormationPlayer {
  name: string;
  number: number;
  x: number;
  y: number;
  rating: number;
}

interface TacticalChange {
  minute: number;
  team: 'home' | 'away';
  playerOut: string;
  playerIn: string;
  formationShift: string;
}

interface PlayerPerformance {
  id: string;
  name: string;
  team: 'home' | 'away';
  position: string;
  rating: number;
  passes: number;
  tackles: number;
  shots: number;
  distance: number;
  isMotm: boolean;
}

interface MatchStats {
  label: string;
  home: number;
  away: number;
}

// ─── SVG Helper: Extract points to avoid .map().join() inline ─
function buildPolygonPoints(coords: [number, number][]): string {
  return coords.map(([cx, cy]) => `${cx},${cy}`).join(' ');
}

function buildPolylinePoints(coords: [number, number][]): string {
  return coords.map(([cx, cy]) => `${cx},${cy}`).join(' ');
}

// ─── Color helpers ─────────────────────────────────────────────
function getEventColor(type: MatchEventItem['type']): string {
  const colorMap: Record<string, string> = {
    goal: 'text-emerald-400',
    yellow_card: 'text-yellow-400',
    red_card: 'text-red-500',
    substitution: 'text-cyan-400',
    shot_on_target: 'text-sky-400',
    shot_blocked: 'text-amber-400',
    corner: 'text-purple-400',
    foul: 'text-orange-400',
  };
  return colorMap[type] ?? 'text-[#8b949e]';
}

function getEventBg(type: MatchEventItem['type']): string {
  const bgMap: Record<string, string> = {
    goal: 'bg-emerald-500/10 border-emerald-500/30',
    yellow_card: 'bg-yellow-500/10 border-yellow-500/30',
    red_card: 'bg-red-500/10 border-red-500/30',
    substitution: 'bg-cyan-500/10 border-cyan-500/30',
    shot_on_target: 'bg-sky-500/10 border-sky-500/30',
    shot_blocked: 'bg-amber-500/10 border-amber-500/30',
    corner: 'bg-purple-500/10 border-purple-500/30',
    foul: 'bg-orange-500/10 border-orange-500/30',
  };
  return bgMap[type] ?? 'bg-slate-500/10 border-slate-500/30';
}

function getEventIcon(type: MatchEventItem['type']): string {
  const iconMap: Record<string, string> = {
    goal: '\u26BD',
    yellow_card: '\uD83D\uDFE8',
    red_card: '\uD83D\uDFE5',
    substitution: '\uD83D\uDD04',
    shot_on_target: '\uD83C\uDFAF',
    shot_blocked: '\uD83D\uDEAB',
    corner: '\uD83D\uDEA9',
    foul: '\u26A0',
  };
  return iconMap[type] ?? '\uD83D\uDCCC';
}

function getRatingColor(rating: number): string {
  if (rating >= 8.0) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  if (rating >= 7.0) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (rating >= 6.0) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
  return 'bg-red-500/20 text-red-300 border-red-500/40';
}

// ─── Mock Data ─────────────────────────────────────────────────
const MOCK_MATCH_EVENTS: MatchEventItem[] = [
  { id: 'e1', minute: 5, type: 'shot_on_target', team: 'home', playerName: 'Marcus Wright', detail: 'Saved by goalkeeper' },
  { id: 'e2', minute: 12, type: 'corner', team: 'home', playerName: 'James Cooper', detail: 'Swinging corner from the left' },
  { id: 'e3', minute: 18, type: 'goal', team: 'home', playerName: 'Marcus Wright', detail: 'Header from the corner! 1-0' },
  { id: 'e4', minute: 24, type: 'foul', team: 'away', playerName: 'Diego Santos', detail: 'Late challenge on the wing' },
  { id: 'e5', minute: 31, type: 'yellow_card', team: 'away', playerName: 'Diego Santos', detail: 'Booked for persistent fouling' },
  { id: 'e6', minute: 37, type: 'shot_blocked', team: 'away', playerName: 'Leo Müller', detail: 'Deflected wide' },
  { id: 'e7', minute: 42, type: 'goal', team: 'away', playerName: 'Leo Müller', detail: 'Brilliant curling effort! 1-1' },
  { id: 'e8', minute: 46, type: 'substitution', team: 'home', playerName: 'James Cooper', detail: 'Replaced by Kai Chen' },
  { id: 'e9', minute: 55, type: 'shot_on_target', team: 'home', playerName: 'Marcus Wright', detail: 'Narrowly wide of the post' },
  { id: 'e10', minute: 63, type: 'goal', team: 'home', playerName: 'Kai Chen', detail: 'Superb solo run and finish! 2-1' },
  { id: 'e11', minute: 71, type: 'substitution', team: 'away', playerName: 'Pierre Dubois', detail: 'Replaced by Tomás Silva' },
  { id: 'e12', minute: 78, type: 'red_card', team: 'away', playerName: 'Rafa Navarro', detail: 'Second yellow for a reckless tackle' },
  { id: 'e13', minute: 84, type: 'corner', team: 'home', playerName: 'Alex Turner', detail: 'Last-gasp attacking corner' },
  { id: 'e14', minute: 88, type: 'goal', team: 'home', playerName: 'Alex Turner', detail: 'Power header from the corner! 3-1' },
  { id: 'e15', minute: 90, type: 'shot_blocked', team: 'away', playerName: 'Tomás Silva', detail: 'Final effort blocked' },
];

const MOCK_HOME_FORMATION: FormationPlayer[] = [
  { name: 'Ben Hall', number: 1, x: 150, y: 170, rating: 7.2 },
  { name: 'Sam Park', number: 2, x: 40, y: 140, rating: 6.8 },
  { name: 'Dan Brooks', number: 5, x: 80, y: 170, rating: 7.0 },
  { name: 'Liam Cole', number: 4, x: 80, y: 200, rating: 7.1 },
  { name: 'Alex Turner', number: 3, x: 40, y: 230, rating: 7.8 },
  { name: 'James Cooper', number: 8, x: 100, y: 130, rating: 6.5 },
  { name: 'Nico Grant', number: 6, x: 120, y: 170, rating: 7.3 },
  { name: 'Kai Chen', number: 10, x: 100, y: 210, rating: 8.2 },
  { name: 'Ryan Fox', number: 7, x: 50, y: 120, rating: 7.0 },
  { name: 'Marcus Wright', number: 9, x: 150, y: 120, rating: 8.5 },
  { name: 'Jay Wilson', number: 11, x: 50, y: 250, rating: 6.9 },
];

const MOCK_AWAY_FORMATION: FormationPlayer[] = [
  { name: 'André Costa', number: 1, x: 150, y: 30, rating: 6.4 },
  { name: 'Rafa Navarro', number: 2, x: 40, y: 0, rating: 5.2 },
  { name: 'Hugo Blanc', number: 5, x: 80, y: 30, rating: 6.8 },
  { name: 'Diego Santos', number: 4, x: 80, y: 60, rating: 5.6 },
  { name: 'Luis Ferri', number: 3, x: 40, y: 90, rating: 6.5 },
  { name: 'Leo Müller', number: 10, x: 150, y: 10, rating: 7.9 },
  { name: 'Enzo Vidal', number: 6, x: 100, y: 30, rating: 6.7 },
  { name: 'Pierre Dubois', number: 8, x: 100, y: 60, rating: 6.3 },
  { name: 'Toni Reyes', number: 7, x: 50, y: 10, rating: 6.2 },
  { name: 'Mateo Cruz', number: 9, x: 150, y: 50, rating: 6.0 },
  { name: 'Pablo Ruiz', number: 11, x: 50, y: 90, rating: 6.4 },
];

const MOCK_TACTICAL_CHANGES: TacticalChange[] = [
  { minute: 46, team: 'home', playerOut: 'James Cooper', playerIn: 'Kai Chen', formationShift: '4-4-2 → 4-3-3' },
  { minute: 71, team: 'away', playerOut: 'Pierre Dubois', playerIn: 'Tomás Silva', formationShift: '4-3-3 → 4-4-2' },
  { minute: 78, team: 'away', playerOut: 'Rafa Navarro (Red Card)', playerIn: 'Defensive reshuffle', formationShift: '4-4-2 → 4-3-2' },
];

const MOCK_PLAYER_PERFORMANCES: PlayerPerformance[] = [
  { id: 'p1', name: 'Marcus Wright', team: 'home', position: 'ST', rating: 8.5, passes: 28, tackles: 1, shots: 4, distance: 10.2, isMotm: true },
  { id: 'p2', name: 'Kai Chen', team: 'home', position: 'AM', rating: 8.2, passes: 35, tackles: 2, shots: 3, distance: 11.5, isMotm: false },
  { id: 'p3', name: 'Leo Müller', team: 'away', position: 'CAM', rating: 7.9, passes: 42, tackles: 0, shots: 3, distance: 10.8, isMotm: false },
  { id: 'p4', name: 'Alex Turner', team: 'home', position: 'LB', rating: 7.8, passes: 45, tackles: 5, shots: 1, distance: 11.1, isMotm: false },
  { id: 'p5', name: 'Nico Grant', team: 'home', position: 'CM', rating: 7.3, passes: 52, tackles: 4, shots: 0, distance: 11.8, isMotm: false },
  { id: 'p6', name: 'Hugo Blanc', team: 'away', position: 'CB', rating: 7.0, passes: 38, tackles: 6, shots: 0, distance: 9.8, isMotm: false },
  { id: 'p7', name: 'Enzo Vidal', team: 'away', position: 'CDM', rating: 6.8, passes: 40, tackles: 5, shots: 1, distance: 10.5, isMotm: false },
  { id: 'p8', name: 'Dan Brooks', team: 'home', position: 'CB', rating: 7.1, passes: 33, tackles: 7, shots: 0, distance: 9.6, isMotm: false },
];

const MOCK_MATCH_STATS: MatchStats[] = [
  { label: 'Possession', home: 56, away: 44 },
  { label: 'Shots', home: 14, away: 8 },
  { label: 'Passes', home: 487, away: 376 },
  { label: 'Corners', home: 7, away: 3 },
  { label: 'Fouls', home: 10, away: 16 },
  { label: 'Offsides', home: 2, away: 4 },
];

const HOME_TEAM_NAME = 'Metro United';
const AWAY_TEAM_NAME = 'Atletico Sol';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function MatchReplayViewer(): React.JSX.Element {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  // Null-safe access
  const playerData = gameState?.player ?? null;
  const currentClub = gameState?.currentClub ?? ({} as Record<string, unknown>);
  const currentWeek = gameState?.currentWeek ?? 1;
  const playerName = playerData?.name ?? 'Your Player';
  const teamName = (currentClub?.name as string) ?? 'Your Club';

  // ─── ALL hooks BEFORE conditional returns ────────────────────
  const [activeTab, setActiveTab] = useState('timeline');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMinute, setPlaybackMinute] = useState(0);
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredEvents = useMemo(() => {
    return MOCK_MATCH_EVENTS.filter(ev => ev.minute <= playbackMinute);
  }, [playbackMinute]);

  const eventDistribution = useMemo(() => {
    return MOCK_MATCH_EVENTS.reduce<Record<string, number>>((acc, ev) => {
      const key = ev.type;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleSkipForward = useCallback(() => {
    setPlaybackMinute(prev => Math.min(90, prev + 10));
  }, []);

  const handleSkipBack = useCallback(() => {
    setPlaybackMinute(prev => Math.max(0, prev - 10));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setPlaybackMinute(0);
  }, []);

  // Playback timer
  useEffect(() => {
    if (isPlaying && playbackMinute < 90) {
      playbackRef.current = setInterval(() => {
        setPlaybackMinute(prev => {
          if (prev >= 90) {
            setIsPlaying(false);
            return 90;
          }
          return prev + 1;
        });
      }, 80);
    }
    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
        playbackRef.current = null;
      }
    };
  }, [isPlaying, playbackMinute]);

  // ─── Conditional return (after ALL hooks) ────────────────────
  if (!gameState) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-8 text-center"
        >
          <Activity className="w-10 h-10 text-[#484f58] mx-auto mb-3" />
          <p className="text-sm text-[#8b949e]">Loading match data...</p>
        </motion.div>
      </div>
    );
  }

  // ─── Sub-components (camelCase, called as {fnName()}) ───────

  function renderScoreHeader(): React.JSX.Element {
    return (
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <div className="h-1.5 bg-emerald-500" />
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl bg-emerald-500/15 border border-emerald-500/30">
                <Badge className="text-lg border-0 bg-transparent font-black text-emerald-400">MU</Badge>
              </div>
              <span className="text-[11px] text-[#c9d1d9] font-semibold leading-tight text-center">
                {HOME_TEAM_NAME}
              </span>
            </div>
            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-3xl font-black text-white tracking-wider">
                3 <span className="text-[#484f58]">-</span> 1
              </span>
              <Badge variant="outline" className="text-[9px] mt-1 border-[#30363d] text-[#8b949e]">
                League Match
              </Badge>
            </div>
            <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl bg-sky-500/15 border border-sky-500/30">
                <Badge className="text-lg border-0 bg-transparent font-black text-sky-400">AS</Badge>
              </div>
              <span className="text-[11px] text-[#c9d1d9] font-semibold leading-tight text-center">
                {AWAY_TEAM_NAME}
              </span>
            </div>
          </div>
          {/* Playback Controls */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipBack}
              className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={handlePlayPause}
              className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipForward}
              className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
            <div className="flex-1 mx-2">
              <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-sm transition-all duration-200"
                  style={{ width: `${(playbackMinute / 90) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] text-[#8b949e] font-mono font-bold w-8 text-right">
              {playbackMinute}&apos;
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderMomentumChart(): React.JSX.Element {
    const momentumData: [number, number][] = [
      [0, 0], [5, 15], [10, 22], [15, 35], [20, 42], [25, 38],
      [30, 30], [35, 25], [40, 18], [45, 10], [50, 20], [55, 30],
      [60, 40], [65, 50], [70, 58], [75, 65], [80, 72], [85, 80], [90, 85],
    ];
    const width = 300;
    const height = 160;
    const padding = 30;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const midY = padding + chartH / 2;

    const homeLinePoints = buildPolylinePoints(
      momentumData.map(([min, val]) => [
        padding + (min / 90) * chartW,
        midY - (val / 100) * (chartH / 2),
      ])
    );
    const awayLinePoints = buildPolylinePoints(
      momentumData.map(([min, val]) => [
        padding + (min / 90) * chartW,
        midY + (val / 100) * (chartH / 2),
      ])
    );
    const homeAreaPoints = buildPolygonPoints([
      ...(momentumData.map(([min, val]) => [
        padding + (min / 90) * chartW,
        midY - (val / 100) * (chartH / 2),
      ]) as [number, number][]),
      [padding + chartW, midY],
      [padding, midY],
    ]);
    const awayAreaPoints = buildPolygonPoints([
      ...(momentumData.map(([min, val]) => [
        padding + (min / 90) * chartW,
        midY + (val / 100) * (chartH / 2),
      ]) as [number, number][]),
      [padding + chartW, midY],
      [padding, midY],
    ]);

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Match Momentum
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
            {/* Grid lines */}
            {[0, 15, 30, 45, 60, 75, 90].map((min) => {
              const gx = padding + (min / 90) * chartW;
              return (
                <line
                  key={`grid-${min}`}
                  x1={gx} y1={padding} x2={gx} y2={height - padding}
                  stroke="#30363d" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4"
                />
              );
            })}
            {/* Mid line */}
            <line x1={padding} y1={midY} x2={width - padding} y2={midY} stroke="#484f58" strokeWidth="1" />
            {/* Home area */}
            <polygon points={homeAreaPoints} fill="#10b981" fillOpacity="0.15" stroke="none" />
            {/* Away area */}
            <polygon points={awayAreaPoints} fill="#38bdf8" fillOpacity="0.15" stroke="none" />
            {/* Home line */}
            <polyline points={homeLinePoints} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
            {/* Away line */}
            <polyline points={awayLinePoints} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
            {/* Labels */}
            <text x={padding - 5} y={padding + 4} textAnchor="end" fill="#10b981" fontSize="9" fontWeight="bold">HOME</text>
            <text x={padding - 5} y={height - padding - 2} textAnchor="end" fill="#38bdf8" fontSize="9" fontWeight="bold">AWAY</text>
            {/* Minute labels */}
            {[0, 45, 90].map((min) => {
              const lx = padding + (min / 90) * chartW;
              return (
                <text key={`ml-${min}`} x={lx} y={height - padding + 14} textAnchor="middle" fill="#484f58" fontSize="8">{min}&apos;</text>
              );
            })}
          </svg>
          <div className="flex items-center justify-center gap-4 mt-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-emerald-500 rounded-sm" />
              <span className="text-[9px] text-[#8b949e]">{HOME_TEAM_NAME}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-sky-500 rounded-sm" />
              <span className="text-[9px] text-[#8b949e]">{AWAY_TEAM_NAME}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderEventDonut(): React.JSX.Element {
    const categoryMap: Record<string, string> = {
      goal: 'Goals',
      shot_on_target: 'Shots',
      shot_blocked: 'Shots',
      yellow_card: 'Cards',
      red_card: 'Cards',
      substitution: 'Subs',
      corner: 'Corners',
      foul: 'Fouls',
    };
    const colorMap: Record<string, string> = {
      Goals: '#10b981',
      Shots: '#38bdf8',
      Cards: '#f59e0b',
      Subs: '#a78bfa',
    };
    const aggregated = Object.entries(eventDistribution).reduce<Record<string, number>>(
      (res, [key, val]) => {
        const cat = categoryMap[key] ?? 'Other';
        res[cat] = (res[cat] ?? 0) + val;
        return res;
      },
      {}
    );
    const total = Object.values(aggregated).reduce((sum, v) => sum + v, 0);
    const categories = Object.entries(aggregated).filter(([k]) => ['Goals', 'Shots', 'Cards', 'Subs'].includes(k));
    const cx = 100;
    const cy = 100;
    const r = 60;
    const innerR = 38;

    const segments = categories.map(([label, count], idx) => {
      const startAngle = idx === 0 ? -90 : (() => {
        const prevSlices = categories.slice(0, idx);
        const prevSum = prevSlices.reduce((s, [, v]) => s + v, 0);
        return -90 + (prevSum / total) * 360;
      })();
      const sliceAngle = (count / total) * 360;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = ((startAngle + sliceAngle) * Math.PI) / 180;
      const outerStart = [cx + r * Math.cos(startRad), cy + r * Math.sin(startRad)];
      const outerEnd = [cx + r * Math.cos(endRad), cy + r * Math.sin(endRad)];
      const innerStart = [cx + innerR * Math.cos(startRad), cy + innerR * Math.sin(startRad)];
      const innerEnd = [cx + innerR * Math.cos(endRad), cy + innerR * Math.sin(endRad)];
      const largeArc = sliceAngle > 180 ? 1 : 0;
      const pts = buildPolygonPoints([
        outerStart as [number, number],
        outerEnd as [number, number],
        innerEnd as [number, number],
        innerStart as [number, number],
      ]);

      return { label, count, color: colorMap[label] ?? '#484f58', pts };
    });

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3 text-sky-400" />
            Event Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 200 200" className="w-32 h-32">
              {segments.map((seg) => (
                <polygon
                  key={seg.label}
                  points={seg.pts}
                  fill={seg.color}
                  fillOpacity="0.8"
                  stroke="#161b22"
                  strokeWidth="2"
                />
              ))}
              <text x={cx} y={cy - 4} textAnchor="middle" fill="#c9d1d9" fontSize="16" fontWeight="bold">{total}</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fill="#8b949e" fontSize="9">events</text>
            </svg>
            <div className="space-y-2 flex-1">
              {segments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-[10px] text-[#c9d1d9] flex-1">{seg.label}</span>
                  <span className="text-[10px] text-[#8b949e] font-bold">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderKeyMomentTimeline(): React.JSX.Element {
    const keyMoments = [
      { minute: 18, label: '1st Goal', color: '#10b981' },
      { minute: 31, label: 'Yellow Card', color: '#f59e0b' },
      { minute: 42, label: 'Equalizer', color: '#38bdf8' },
      { minute: 46, label: 'Substitution', color: '#a78bfa' },
      { minute: 63, label: '2nd Goal', color: '#10b981' },
      { minute: 71, label: 'Substitution', color: '#a78bfa' },
      { minute: 78, label: 'Red Card', color: '#ef4444' },
      { minute: 84, label: 'Corner', color: '#c084fc' },
      { minute: 88, label: '3rd Goal', color: '#10b981' },
      { minute: 90, label: 'Final Whistle', color: '#c9d1d9' },
    ];
    const width = 300;
    const height = 70;
    const padding = 20;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" />
            Key Moments
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
            <line x1={padding} y1={35} x2={width - padding} y2={35} stroke="#30363d" strokeWidth="1" />
            {keyMoments.map((km, i) => {
              const kx = padding + (km.minute / 90) * (width - padding * 2);
              return (
                <g key={i}>
                  <circle cx={kx} cy={35} r={i === keyMoments.length - 1 ? 5 : 4} fill={km.color} stroke="#161b22" strokeWidth="1.5" />
                  <text x={kx} y={22} textAnchor="middle" fill="#8b949e" fontSize="7">{km.minute}&apos;</text>
                  <text x={kx} y={55} textAnchor="middle" fill={km.color} fontSize="6" fontWeight="bold">{km.label}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function renderEventTimeline(): React.JSX.Element {
    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              Match Events
            </CardTitle>
            <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e]">
              {filteredEvents.length} events
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="max-h-72 overflow-y-auto pr-1 space-y-1">
            {filteredEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02, duration: 0.15 }}
                className="flex gap-2.5"
              >
                <div className="flex flex-col items-center w-9 shrink-0">
                  <span className="text-[10px] font-mono text-[#8b949e] font-bold">{event.minute}&apos;</span>
                  <div className="flex-1 flex flex-col items-center mt-1">
                    <div className={`w-2 h-2 rounded-sm shrink-0 ${
                      event.type === 'goal' ? 'bg-emerald-400' :
                      event.type === 'red_card' ? 'bg-red-500' :
                      event.type === 'yellow_card' ? 'bg-yellow-400' :
                      'bg-[#484f58]'
                    }`} />
                    {i < filteredEvents.length - 1 && <div className="w-px flex-1 bg-[#30363d] mt-0.5" />}
                  </div>
                </div>
                <div className={`flex-1 rounded-md border px-2.5 py-1.5 ${getEventBg(event.type)}`}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm leading-none">{getEventIcon(event.type)}</span>
                    <span className={`text-[10px] font-bold ${getEventColor(event.type)}`}>
                      {event.type.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3 ${
                      event.team === 'home' ? 'border-emerald-500/30 text-emerald-400' : 'border-sky-500/30 text-sky-400'
                    }`}>
                      {event.team === 'home' ? HOME_TEAM_NAME : AWAY_TEAM_NAME}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[#c9d1d9] mt-0.5 leading-snug">
                    <span className="font-medium">{event.playerName}</span>
                    <span className="text-[#8b949e]"> &mdash; {event.detail}</span>
                  </p>
                </div>
              </motion.div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-center py-6">
                <Eye className="w-8 h-8 text-[#484f58] mx-auto mb-2" />
                <p className="text-[11px] text-[#8b949e]">Press play to watch the match unfold</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── TAB 2: Tactical Analysis ────────────────────────────────

  function renderFormationDisplay(): React.JSX.Element {
    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Users className="w-3 h-3 text-sky-400" />
            Formations
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Home Formation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-emerald-400 font-bold">{HOME_TEAM_NAME}</span>
                <Badge className="text-[8px] px-1.5 py-0 h-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold">4-4-2</Badge>
              </div>
              <svg viewBox="0 0 200 270" className="w-full border border-[#30363d] rounded-lg bg-[#1a3a1a]">
                {/* Pitch markings */}
                <line x1={0} y1={135} x2={200} y2={135} stroke="#2d5a2d" strokeWidth="0.5" strokeDasharray="4,4" />
                <circle cx={100} cy={135} r={25} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
                <rect x={75} y={115} width={50} height={40} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
                <rect x={50} y={225} width={100} height={35} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
                <rect x={50} y={10} width={100} height={35} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
                {/* Players */}
                {MOCK_HOME_FORMATION.map((player) => (
                  <g key={player.number}>
                    <circle cx={player.x} cy={player.y} r={8} fill="#10b981" fillOpacity="0.85" stroke="#064e3b" strokeWidth="1" />
                    <text x={player.x} y={player.y + 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">{player.number}</text>
                    <text x={player.x} y={player.y + 17} textAnchor="middle" fill="#8b949e" fontSize="5">{player.name.split(' ').pop()}</text>
                  </g>
                ))}
              </svg>
            </div>
            {/* Away Formation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-sky-400 font-bold">{AWAY_TEAM_NAME}</span>
                <Badge className="text-[8px] px-1.5 py-0 h-4 bg-sky-500/20 text-sky-300 border-sky-500/30 font-bold">4-3-3</Badge>
              </div>
              <svg viewBox="0 0 200 270" className="w-full border border-[#30363d] rounded-lg bg-[#1a3a1a]">
                <line x1={0} y1={135} x2={200} y2={135} stroke="#2d5a2d" strokeWidth="0.5" strokeDasharray="4,4" />
                <circle cx={100} cy={135} r={25} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
                <rect x={75} y={115} width={50} height={40} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
                <rect x={50} y={225} width={100} height={35} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
                <rect x={50} y={10} width={100} height={35} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
                {MOCK_AWAY_FORMATION.map((player) => (
                  <g key={player.number}>
                    <circle cx={player.x} cy={player.y} r={8} fill="#38bdf8" fillOpacity="0.85" stroke="#0c4a6e" strokeWidth="1" />
                    <text x={player.x} y={player.y + 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">{player.number}</text>
                    <text x={player.x} y={player.y + 17} textAnchor="middle" fill="#8b949e" fontSize="5">{player.name.split(' ').pop()}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderTacticalChanges(): React.JSX.Element {
    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            Tactical Changes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {MOCK_TACTICAL_CHANGES.map((change, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.2 }}
              className="flex items-start gap-3 bg-[#21262d] rounded-lg p-2.5 border border-[#30363d]"
            >
              <div className="flex flex-col items-center w-10 shrink-0">
                <span className="text-[10px] font-mono text-[#8b949e] font-bold">{change.minute}&apos;</span>
                <div className={`w-2 h-2 rounded-sm mt-1 ${change.team === 'home' ? 'bg-emerald-400' : 'bg-sky-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3 ${
                    change.team === 'home' ? 'border-emerald-500/30 text-emerald-400' : 'border-sky-500/30 text-sky-400'
                  }`}>
                    {change.team === 'home' ? HOME_TEAM_NAME : AWAY_TEAM_NAME}
                  </Badge>
                  <span className="text-[10px] text-cyan-400 font-bold">{change.formationShift}</span>
                </div>
                <p className="text-[10px] text-[#c9d1d9]">
                  <span className="text-red-400 line-through">{change.playerOut}</span>
                  <ChevronRight className="w-2.5 h-2.5 inline text-[#8b949e] mx-1" />
                  <span className="text-emerald-400">{change.playerIn}</span>
                </p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    );
  }

  function renderFormationComparisonBars(): React.JSX.Element {
    const comparisons = [
      { label: 'Attacking Width', home: 72, away: 65 },
      { label: 'Defensive Depth', home: 45, away: 55 },
      { label: 'Pressing', home: 78, away: 60 },
      { label: 'Possession', home: 68, away: 58 },
      { label: 'Tempo', home: 62, away: 70 },
    ];
    const width = 300;
    const height = 150;
    const barH = 16;
    const padding = 10;
    const labelW = 90;
    const barStartX = labelW + 5;
    const barArea = width - barStartX - padding;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3 text-purple-400" />
            Formation Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
            {comparisons.map((comp, i) => {
              const y = padding + i * (barH + 10);
              const midX = barStartX + barArea / 2;
              const homeW = (comp.home / 100) * (barArea / 2);
              const awayW = (comp.away / 100) * (barArea / 2);
              return (
                <g key={i}>
                  <text x={labelW - 2} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="9">{comp.label}</text>
                  {/* Home bar (extends left from center) */}
                  <rect x={midX - homeW} y={y} width={homeW} height={barH} fill="#10b981" fillOpacity="0.8" rx="3" />
                  {/* Away bar (extends right from center) */}
                  <rect x={midX} y={y} width={awayW} height={barH} fill="#38bdf8" fillOpacity="0.8" rx="3" />
                  {/* Center line */}
                  <line x1={midX} y1={y} x2={midX} y2={y + barH} stroke="#484f58" strokeWidth="1" />
                  {/* Values */}
                  <text x={midX - homeW - 3} y={y + barH / 2 + 3} textAnchor="end" fill="#10b981" fontSize="8" fontWeight="bold">{comp.home}</text>
                  <text x={midX + awayW + 3} y={y + barH / 2 + 3} textAnchor="start" fill="#38bdf8" fontSize="8" fontWeight="bold">{comp.away}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function renderPassingNetwork(): React.JSX.Element {
    const homeNodes: [number, number, string][] = [
      [100, 170, 'GK'], [40, 140, 'RB'], [80, 170, 'CB1'], [80, 200, 'CB2'], [40, 230, 'LB'],
      [100, 130, 'CM1'], [120, 170, 'CDM'], [100, 210, 'CM2'],
    ];
    const awayNodes: [number, number, string][] = [
      [100, 30, 'GK'], [40, 0, 'RB'], [80, 30, 'CB1'], [80, 60, 'CB2'], [40, 90, 'LB'],
      [150, 10, 'CAM'], [100, 30, 'CDM'], [100, 60, 'CM'],
    ];
    const homeConnections: [number, number][] = [
      [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 5], [2, 6], [3, 6], [3, 7], [4, 7], [5, 6], [6, 7],
    ];
    const awayConnections: [number, number][] = [
      [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6], [3, 7], [4, 7], [5, 6], [6, 7],
    ];

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            Passing Network
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <span className="text-[9px] text-emerald-400 font-bold">{HOME_TEAM_NAME}</span>
              <svg viewBox="0 0 200 200" className="w-full mt-1">
                {homeConnections.map(([a, b], idx) => (
                  <line
                    key={`hc-${idx}`}
                    x1={homeNodes[a][0]} y1={homeNodes[a][1]}
                    x2={homeNodes[b][0]} y2={homeNodes[b][1]}
                    stroke="#10b981" strokeWidth="1" opacity="0.3"
                  />
                ))}
                {homeNodes.map(([nx, ny, label], idx) => (
                  <g key={`hn-${idx}`}>
                    <circle cx={nx} cy={ny} r={10} fill="#10b981" fillOpacity="0.8" stroke="#064e3b" strokeWidth="1" />
                    <text x={nx} y={ny + 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">{label}</text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-sky-400 font-bold">{AWAY_TEAM_NAME}</span>
              <svg viewBox="0 0 200 200" className="w-full mt-1">
                {awayConnections.map(([a, b], idx) => (
                  <line
                    key={`ac-${idx}`}
                    x1={awayNodes[a][0]} y1={awayNodes[a][1]}
                    x2={awayNodes[b][0]} y2={awayNodes[b][1]}
                    stroke="#38bdf8" strokeWidth="1" opacity="0.3"
                  />
                ))}
                {awayNodes.map(([nx, ny, label], idx) => (
                  <g key={`an-${idx}`}>
                    <circle cx={nx} cy={ny} r={10} fill="#38bdf8" fillOpacity="0.8" stroke="#0c4a6e" strokeWidth="1" />
                    <text x={nx} y={ny + 3} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">{label}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderTacticalShiftTimeline(): React.JSX.Element {
    const shiftData: [number, number, number][] = [
      [0, 45, 60], [15, 55, 55], [30, 50, 50], [45, 40, 65],
      [60, 50, 45], [75, 55, 35], [90, 60, 30],
    ];
    const width = 300;
    const height = 120;
    const padding = 30;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const homeLine = buildPolylinePoints(
      shiftData.map(([min, home, _away]) => [
        padding + (min / 90) * chartW,
        padding + chartH - (home / 100) * chartH,
      ])
    );
    const awayLine = buildPolylinePoints(
      shiftData.map(([min, _home, away]) => [
        padding + (min / 90) * chartW,
        padding + chartH - (away / 100) * chartH,
      ])
    );
    const homeArea = buildPolygonPoints([
      ...(shiftData.map(([min, home, _away]) => [
        padding + (min / 90) * chartW,
        padding + chartH - (home / 100) * chartH,
      ]) as [number, number][]),
      [padding + chartW, padding + chartH],
      [padding, padding + chartH],
    ]);
    const awayArea = buildPolygonPoints([
      ...(shiftData.map(([min, _home, away]) => [
        padding + (min / 90) * chartW,
        padding + chartH - (away / 100) * chartH,
      ]) as [number, number][]),
      [padding + chartW, padding + chartH],
      [padding, padding + chartH],
    ]);

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Flag className="w-3 h-3 text-red-400" />
            Aggressiveness Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
            {[0, 15, 30, 45, 60, 75, 90].map((min) => {
              const gx = padding + (min / 90) * chartW;
              return (
                <line key={`sg-${min}`} x1={gx} y1={padding} x2={gx} y2={height - padding} stroke="#30363d" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />
              );
            })}
            <polygon points={homeArea} fill="#10b981" fillOpacity="0.12" stroke="none" />
            <polygon points={awayArea} fill="#38bdf8" fillOpacity="0.12" stroke="none" />
            <polyline points={homeLine} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
            <polyline points={awayLine} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
            {/* Key event markers */}
            {shiftData.map(([min], i) => {
              const mx = padding + (min / 90) * chartW;
              return (
                <circle key={`sd-${i}`} cx={mx} cy={padding + chartH} r={2} fill="#484f58" />
              );
            })}
            <text x={width - padding} y={height - padding + 14} textAnchor="end" fill="#484f58" fontSize="8">90&apos;</text>
            <text x={padding} y={height - padding + 14} textAnchor="start" fill="#484f58" fontSize="8">0&apos;</text>
          </svg>
          <div className="flex items-center justify-center gap-4 mt-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-emerald-500 rounded-sm" />
              <span className="text-[9px] text-[#8b949e]">{HOME_TEAM_NAME}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-sky-500 rounded-sm" />
              <span className="text-[9px] text-[#8b949e]">{AWAY_TEAM_NAME}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── TAB 3: Player Performance ───────────────────────────────

  function renderPlayerCards(): React.JSX.Element {
    const sortedPlayers = [...MOCK_PLAYER_PERFORMANCES].sort((a, b) => b.rating - a.rating);

    return (
      <div className="space-y-2">
        {/* MOTM Highlight */}
        {sortedPlayers.filter(p => p.isMotm).map((player) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-amber-500/5 border-amber-500/30 overflow-hidden">
              <div className="h-1 bg-amber-500" />
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${getRatingColor(player.rating)}`}>
                    <span className="text-lg font-black">{player.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">Man of the Match</span>
                    </div>
                    <p className="text-sm font-bold text-[#c9d1d9] mt-0.5">{player.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3 ${
                        player.team === 'home' ? 'border-emerald-500/30 text-emerald-400' : 'border-sky-500/30 text-sky-400'
                      }`}>
                        {player.team === 'home' ? HOME_TEAM_NAME : AWAY_TEAM_NAME}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-[#30363d] text-[#8b949e]">{player.position}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    { label: 'Passes', value: player.passes, icon: <Target className="w-2.5 h-2.5 text-emerald-400" /> },
                    { label: 'Tackles', value: player.tackles, icon: <Shield className="w-2.5 h-2.5 text-sky-400" /> },
                    { label: 'Shots', value: player.shots, icon: <Zap className="w-2.5 h-2.5 text-amber-400" /> },
                    { label: 'Distance', value: `${player.distance}km`, icon: <Activity className="w-2.5 h-2.5 text-purple-400" /> },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#21262d] rounded-lg p-1.5 text-center">
                      <div className="flex items-center justify-center gap-0.5 mb-0.5">{stat.icon}</div>
                      <span className="text-[10px] font-bold text-[#c9d1d9]">{stat.value}</span>
                      <p className="text-[7px] text-[#484f58]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Other Players */}
        {sortedPlayers.filter(p => !p.isMotm).map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (i + 1) * 0.05, duration: 0.2 }}
          >
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getRatingColor(player.rating)}`}>
                    <span className="text-sm font-black">{player.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#c9d1d9]">{player.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3 ${
                        player.team === 'home' ? 'border-emerald-500/30 text-emerald-400' : 'border-sky-500/30 text-sky-400'
                      }`}>
                        {player.team === 'home' ? HOME_TEAM_NAME : AWAY_TEAM_NAME}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 border-[#30363d] text-[#8b949e]">{player.position}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { label: 'Passes', value: player.passes },
                    { label: 'Tackles', value: player.tackles },
                    { label: 'Shots', value: player.shots },
                    { label: 'Dist.', value: `${player.distance}km` },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <span className="text-[10px] font-bold text-[#c9d1d9]">{stat.value}</span>
                      <p className="text-[7px] text-[#484f58]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  }

  function renderRatingComparisonBars(): React.JSX.Element {
    const top5 = [...MOCK_PLAYER_PERFORMANCES].sort((a, b) => b.rating - a.rating).slice(0, 5);
    const width = 300;
    const height = 140;
    const padding = 10;
    const labelW = 80;
    const barArea = width - labelW - padding - 40;
    const barH = 14;
    const gap = 12;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Star className="w-3 h-3 text-amber-400" />
            Rating Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
            {top5.map((player, i) => {
              const y = padding + i * (barH + gap);
              const barW = ((player.rating - 5) / 5) * barArea;
              const barColor = player.team === 'home' ? '#10b981' : '#38bdf8';
              return (
                <g key={player.id}>
                  <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill="#c9d1d9" fontSize="9" fontWeight="bold">{player.name.split(' ').pop()}</text>
                  <rect x={labelW} y={y} width={barW} height={barH} fill={barColor} fillOpacity="0.8" rx="3" />
                  <text x={labelW + barW + 4} y={y + barH / 2 + 3} textAnchor="start" fill={barColor} fontSize="9" fontWeight="bold">{player.rating.toFixed(1)}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  function renderDistanceScatter(): React.JSX.Element {
    const width = 300;
    const height = 180;
    const padding = 35;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const minDist = 9;
    const maxDist = 12.5;
    const minRating = 5;
    const maxRating = 9;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-purple-400" />
            Distance vs Rating
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
            {/* Grid */}
            {[9.5, 10, 10.5, 11, 11.5, 12].map((dist) => {
              const gx = padding + ((dist - minDist) / (maxDist - minDist)) * chartW;
              return (
                <line key={`dg-${dist}`} x1={gx} y1={padding} x2={gx} y2={height - padding} stroke="#30363d" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.3" />
              );
            })}
            {[6, 7, 8, 9].map((rating) => {
              const gy = padding + chartH - ((rating - minRating) / (maxRating - minRating)) * chartH;
              return (
                <line key={`rg-${rating}`} x1={padding} y1={gy} x2={width - padding} y2={gy} stroke="#30363d" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.3" />
              );
            })}
            {/* Axis labels */}
            <text x={width / 2} y={height - 4} textAnchor="middle" fill="#8b949e" fontSize="8">Distance (km)</text>
            <text x={8} y={height / 2} textAnchor="middle" fill="#8b949e" fontSize="8" transform={`rotate(-90, 8, ${height / 2})`}>Rating</text>
            {[9.5, 10.5, 11.5].map((dist) => {
              const lx = padding + ((dist - minDist) / (maxDist - minDist)) * chartW;
              return <text key={`dl-${dist}`} x={lx} y={height - padding + 12} textAnchor="middle" fill="#484f58" fontSize="7">{dist}</text>;
            })}
            {[6, 7, 8].map((rating) => {
              const ly = padding + chartH - ((rating - minRating) / (maxRating - minRating)) * chartH;
              return <text key={`rl-${rating}`} x={padding - 5} y={ly + 3} textAnchor="end" fill="#484f58" fontSize="7">{rating}</text>;
            })}
            {/* Dots */}
            {MOCK_PLAYER_PERFORMANCES.map((player) => {
              const px = padding + ((player.distance - minDist) / (maxDist - minDist)) * chartW;
              const py = padding + chartH - ((player.rating - minRating) / (maxRating - minRating)) * chartH;
              const dotColor = player.team === 'home' ? '#10b981' : '#38bdf8';
              return (
                <circle
                  key={player.id}
                  cx={px} cy={py} r={player.isMotm ? 7 : 5}
                  fill={dotColor} fillOpacity="0.85"
                  stroke={player.isMotm ? '#f59e0b' : '#161b22'}
                  strokeWidth={player.isMotm ? 2 : 1}
                />
              );
            })}
          </svg>
          <div className="flex items-center justify-center gap-4 mt-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-emerald-500" />
              <span className="text-[9px] text-[#8b949e]">{HOME_TEAM_NAME}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-sky-500" />
              <span className="text-[9px] text-[#8b949e]">{AWAY_TEAM_NAME}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-amber-400" />
              <span className="text-[9px] text-[#8b949e]">MOTM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderPerformanceHexRadar(): React.JSX.Element {
    const motmPlayer = MOCK_PLAYER_PERFORMANCES.find(p => p.isMotm);
    const categories = ['Passing', 'Shooting', 'Defending', 'Physical', 'Pace', 'Creativity'];
    const values = motmPlayer ? [85, 78, 45, 72, 68, 82] : [70, 65, 50, 60, 55, 65];
    const cx = 150;
    const cy = 110;
    const maxR = 80;
    const n = categories.length;

    const outerPoints = categories.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle)] as [number, number];
    });
    const valuePoints = categories.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (values[i] / 100) * maxR;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as [number, number];
    });

    const outerShape = buildPolygonPoints(outerPoints);
    const valueShape = buildPolygonPoints(valuePoints);

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Award className="w-3 h-3 text-amber-400" />
            MOTM Performance: {motmPlayer?.name ?? 'N/A'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox="0 0 300 220" className="w-full">
            {/* Grid rings */}
            {[20, 40, 60, 80, 100].map((pct) => {
              const ringR = (pct / 100) * maxR;
              const ringPoints = buildPolygonPoints(
                categories.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
                  return [cx + ringR * Math.cos(angle), cy + ringR * Math.sin(angle)] as [number, number];
                })
              );
              return (
                <polygon key={`ring-${pct}`} points={ringPoints} fill="none" stroke="#30363d" strokeWidth="0.5" opacity="0.3" />
              );
            })}
            {/* Axis lines */}
            {outerPoints.map(([px, py], i) => (
              <line key={`axis-${i}`} x1={cx} y1={cy} x2={px} y2={py} stroke="#30363d" strokeWidth="0.5" opacity="0.3" />
            ))}
            {/* Value polygon */}
            <polygon points={valueShape} fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="2" />
            {/* Value dots */}
            {valuePoints.map(([px, py], i) => (
              <circle key={`vd-${i}`} cx={px} cy={py} r={3} fill="#f59e0b" stroke="#161b22" strokeWidth="1" />
            ))}
            {/* Labels */}
            {categories.map((label, i) => {
              const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
              const lx = cx + (maxR + 16) * Math.cos(angle);
              const ly = cy + (maxR + 16) * Math.sin(angle);
              return (
                <text key={`label-${i}`} x={lx} y={ly + 3} textAnchor="middle" fill="#c9d1d9" fontSize="9" fontWeight="bold">{label}</text>
              );
            })}
            {/* Values */}
            {categories.map((_, i) => {
              const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
              const lx = cx + (maxR + 28) * Math.cos(angle);
              const ly = cy + (maxR + 28) * Math.sin(angle);
              return (
                <text key={`val-${i}`} x={lx} y={ly + 3} textAnchor="middle" fill="#f59e0b" fontSize="8">{values[i]}</text>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }

  // ─── TAB 4: Statistics & Heatmap ─────────────────────────────

  function renderStatsGrid(): React.JSX.Element {
    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3 text-emerald-400" />
              Match Statistics
            </CardTitle>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-emerald-400 font-bold">{HOME_TEAM_NAME}</span>
            <span className="text-[9px] text-sky-400 font-bold">{AWAY_TEAM_NAME}</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {MOCK_MATCH_STATS.map((stat) => {
            const total = stat.home + stat.away;
            const homePct = total > 0 ? Math.round((stat.home / total) * 100) : 50;
            return (
              <div key={stat.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#c9d1d9] font-bold w-10 text-right">{stat.home}</span>
                  <span className="text-[#8b949e] text-center flex-1">{stat.label}</span>
                  <span className="text-[#c9d1d9] font-bold w-10 text-left">{stat.away}</span>
                </div>
                <div className="flex h-1.5 gap-0.5">
                  <div className="bg-emerald-500/80 rounded-sm overflow-hidden" style={{ width: `${homePct}%` }} />
                  <div className="bg-sky-500/60 rounded-sm overflow-hidden" style={{ width: `${100 - homePct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  function renderPossessionPie(): React.JSX.Element {
    const homePoss = 56;
    const awayPoss = 44;
    const cx = 100;
    const cy = 100;
    const r = 70;
    const homeAngle = (homePoss / 100) * 360;
    const homeStartRad = (-90 * Math.PI) / 180;
    const homeEndRad = (((-90 + homeAngle) * Math.PI) / 180);
    const largeArc = homeAngle > 180 ? 1 : 0;
    const homeArc = buildPolylinePoints([
      [cx, cy],
      [cx + r * Math.cos(homeStartRad), cy + r * Math.sin(homeStartRad)],
      [cx + r * Math.cos(homeEndRad), cy + r * Math.sin(homeEndRad)],
      [cx, cy],
    ]);
    const awayStartRad = homeEndRad;
    const awayEndRad = ((-90 + 360) * Math.PI) / 180;
    const awayArc = buildPolylinePoints([
      [cx, cy],
      [cx + r * Math.cos(awayStartRad), cy + r * Math.sin(awayStartRad)],
      [cx + r * Math.cos(awayEndRad), cy + r * Math.sin(awayEndRad)],
      [cx, cy],
    ]);

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            Possession
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 200 200" className="w-28 h-28">
              <polygon points={homeArc} fill="#10b981" fillOpacity="0.8" stroke="#161b22" strokeWidth="2" />
              <polygon points={awayArc} fill="#38bdf8" fillOpacity="0.8" stroke="#161b22" strokeWidth="2" />
              <text x={cx - 15} y={cy + 5} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{homePoss}%</text>
            </svg>
            <div className="space-y-3 flex-1">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-[10px] text-[#c9d1d9] font-semibold">{HOME_TEAM_NAME}</span>
                </div>
                <span className="text-lg font-black text-emerald-400">{homePoss}%</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                  <span className="text-[10px] text-[#c9d1d9] font-semibold">{AWAY_TEAM_NAME}</span>
                </div>
                <span className="text-lg font-black text-sky-400">{awayPoss}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderShotMap(): React.JSX.Element {
    const homeShots: [number, number, string, boolean][] = [
      [70, 80, '#10b981', true], [90, 60, '#10b981', false],
      [55, 50, '#10b981', true], [80, 40, '#10b981', false],
      [65, 70, '#10b981', true], [95, 55, '#10b981', false],
      [60, 90, '#10b981', true], [85, 35, '#10b981', false],
      [75, 45, '#10b981', false], [50, 65, '#10b981', false],
      [100, 100, '#10b981', true], [40, 55, '#10b981', false],
      [110, 85, '#10b981', true], [45, 75, '#10b981', false],
    ];
    const awayShots: [number, number, string, boolean][] = [
      [60, 120, '#38bdf8', true], [80, 140, '#38bdf8', false],
      [55, 110, '#38bdf8', false], [90, 130, '#38bdf8', true],
      [70, 145, '#38bdf8', false], [100, 125, '#38bdf8', false],
      [65, 135, '#38bdf8', false], [85, 115, '#38bdf8', true],
    ];

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Target className="w-3 h-3 text-sky-400" />
            Shot Map
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <svg viewBox="0 0 160 200" className="w-full">
            {/* Pitch */}
            <rect x={10} y={10} width={140} height={180} fill="#1a3a1a" stroke="#2d5a2d" strokeWidth="1" rx="4" />
            <rect x={30} y={10} width={100} height={30} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
            <rect x={55} y={10} width={50} height={15} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
            <rect x={30} y={160} width={100} height={30} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
            <rect x={55} y={175} width={50} height={15} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
            <line x1={10} y1={100} x2={150} y2={100} stroke="#2d5a2d" strokeWidth="0.5" strokeDasharray="4,4" />
            <circle cx={80} cy={100} r={20} fill="none" stroke="#2d5a2d" strokeWidth="0.5" />
            {/* Home shots */}
            {homeShots.map(([sx, sy, color, onTarget], i) => (
              <g key={`hs-${i}`}>
                <circle cx={sx} cy={sy} r={onTarget ? 5 : 4} fill={color} fillOpacity="0.7" stroke={onTarget ? '#ffffff' : color} strokeWidth={onTarget ? 1.5 : 0.5} />
              </g>
            ))}
            {/* Away shots */}
            {awayShots.map(([sx, sy, color, onTarget], i) => (
              <g key={`as-${i}`}>
                <circle cx={sx} cy={sy} r={onTarget ? 5 : 4} fill={color} fillOpacity="0.7" stroke={onTarget ? '#ffffff' : color} strokeWidth={onTarget ? 1.5 : 0.5} />
              </g>
            ))}
          </svg>
          <div className="flex items-center justify-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-emerald-500" />
              <span className="text-[9px] text-[#8b949e]">{HOME_TEAM_NAME} (14 shots)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-sky-500" />
              <span className="text-[9px] text-[#8b949e]">{AWAY_TEAM_NAME} (8 shots)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderShotAccuracyBars(): React.JSX.Element {
    const width = 300;
    const height = 130;
    const padding = 10;
    const labelW = 70;
    const barArea = width - labelW - padding - 35;
    const barH = 12;
    const gap = 16;
    const maxVal = 14;
    const categories = ['Shots', 'On Target', 'Blocked'];
    const homeVals = [14, 6, 3];
    const awayVals = [8, 4, 2];

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <Target className="w-3 h-3 text-emerald-400" />
            Shot Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
            {categories.map((cat, i) => {
              const y = padding + i * (barH * 2 + gap);
              const homeW = (homeVals[i] / maxVal) * barArea;
              const awayW = (awayVals[i] / maxVal) * barArea;
              return (
                <g key={cat}>
                  <text x={labelW - 4} y={y + barH + 4} textAnchor="end" fill="#8b949e" fontSize="9">{cat}</text>
                  <rect x={labelW} y={y} width={homeW} height={barH} fill="#10b981" fillOpacity="0.8" rx="2" />
                  <text x={labelW + homeW + 3} y={y + barH - 1} textAnchor="start" fill="#10b981" fontSize="8" fontWeight="bold">{homeVals[i]}</text>
                  <rect x={labelW} y={y + barH + 2} width={awayW} height={barH} fill="#38bdf8" fillOpacity="0.8" rx="2" />
                  <text x={labelW + awayW + 3} y={y + barH * 2 + 1} textAnchor="start" fill="#38bdf8" fontSize="8" fontWeight="bold">{awayVals[i]}</text>
                </g>
              );
            })}
            {/* Legend */}
            <rect x={width - 75} y={padding} width={8} height={8} fill="#10b981" rx="1" />
            <text x={width - 63} y={padding + 7} fill="#8b949e" fontSize="7">{HOME_TEAM_NAME}</text>
            <rect x={width - 75} y={padding + 12} width={8} height={8} fill="#38bdf8" rx="1" />
            <text x={width - 63} y={padding + 19} fill="#8b949e" fontSize="7">{AWAY_TEAM_NAME}</text>
          </svg>
        </CardContent>
      </Card>
    );
  }

  function renderPossessionTrend(): React.JSX.Element {
    const periods = ['0-15&apos;', '16-30&apos;', '31-45&apos;', '46-60&apos;', '61-75&apos;', '76-90&apos;'];
    const homePoss = [52, 58, 48, 54, 62, 60];
    const awayPoss = [48, 42, 52, 46, 38, 40];
    const width = 300;
    const height = 140;
    const padding = 30;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const homeArea = buildPolygonPoints([
      ...(homePoss.map((v, i) => [
        padding + (i / (homePoss.length - 1)) * chartW,
        padding + chartH - (v / 100) * chartH,
      ]) as [number, number][]),
      [padding + chartW, padding + chartH],
      [padding, padding + chartH],
    ]);
    const awayArea = buildPolygonPoints([
      ...(awayPoss.map((v, i) => [
        padding + (i / (awayPoss.length - 1)) * chartW,
        padding + chartH - (v / 100) * chartH,
      ]) as [number, number][]),
      [padding + chartW, padding + chartH],
      [padding, padding + chartH],
    ]);
    const homeLine = buildPolylinePoints(
      homePoss.map((v, i) => [
        padding + (i / (homePoss.length - 1)) * chartW,
        padding + chartH - (v / 100) * chartH,
      ])
    );
    const awayLine = buildPolylinePoints(
      awayPoss.map((v, i) => [
        padding + (i / (awayPoss.length - 1)) * chartW,
        padding + chartH - (v / 100) * chartH,
      ])
    );

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Possession Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
            {[0, 25, 50, 75, 100].map((pct) => {
              const gy = padding + chartH - (pct / 100) * chartH;
              return (
                <line key={`pg-${pct}`} x1={padding} y1={gy} x2={width - padding} y2={gy} stroke="#30363d" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.3" />
              );
            })}
            <polygon points={homeArea} fill="#10b981" fillOpacity="0.12" stroke="none" />
            <polygon points={awayArea} fill="#38bdf8" fillOpacity="0.12" stroke="none" />
            <polyline points={homeLine} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
            <polyline points={awayLine} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
            {/* Data points */}
            {homePoss.map((v, i) => {
              const px = padding + (i / (homePoss.length - 1)) * chartW;
              const py = padding + chartH - (v / 100) * chartH;
              return <circle key={`hp-${i}`} cx={px} cy={py} r={3} fill="#10b981" stroke="#161b22" strokeWidth="1" />;
            })}
            {awayPoss.map((v, i) => {
              const px = padding + (i / (awayPoss.length - 1)) * chartW;
              const py = padding + chartH - (v / 100) * chartH;
              return <circle key={`ap-${i}`} cx={px} cy={py} r={3} fill="#38bdf8" stroke="#161b22" strokeWidth="1" />;
            })}
            {/* X labels */}
            {periods.map((label, i) => {
              const lx = padding + (i / (periods.length - 1)) * chartW;
              return (
                <text key={`pl-${i}`} x={lx} y={height - padding + 14} textAnchor="middle" fill="#484f58" fontSize="7" dangerouslySetInnerHTML={{ __html: label }} />
              );
            })}
            {/* Y labels */}
            {[0, 50, 100].map((pct) => {
              const ly = padding + chartH - (pct / 100) * chartH;
              return <text key={`pyl-${pct}`} x={padding - 5} y={ly + 3} textAnchor="end" fill="#484f58" fontSize="7">{pct}%</text>;
            })}
          </svg>
          <div className="flex items-center justify-center gap-4 mt-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-emerald-500 rounded-sm" />
              <span className="text-[9px] text-[#8b949e]">{HOME_TEAM_NAME}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-sky-500 rounded-sm" />
              <span className="text-[9px] text-[#8b949e]">{AWAY_TEAM_NAME}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderButterflyChart(): React.JSX.Element {
    const stats = [
      { label: 'Possession', home: 56, away: 44, max: 100 },
      { label: 'Shots', home: 14, away: 8, max: 20 },
      { label: 'Passes', home: 487, away: 376, max: 600 },
      { label: 'Corners', home: 7, away: 3, max: 12 },
      { label: 'Fouls', home: 10, away: 16, max: 20 },
      { label: 'Offsides', home: 2, away: 4, max: 8 },
    ];
    const width = 300;
    const height = 160;
    const padding = 10;
    const labelW = 65;
    const barArea = width - labelW - padding * 2;
    const barH = 14;
    const gap = 10;
    const midX = labelW + barArea / 2;

    return (
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3 text-purple-400" />
            Stats Butterfly
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
            {stats.map((stat, i) => {
              const y = padding + i * (barH + gap);
              const homeW = (stat.home / stat.max) * (barArea / 2);
              const awayW = (stat.away / stat.max) * (barArea / 2);
              const displayHome = stat.label === 'Possession' ? `${stat.home}%` : String(stat.home);
              const displayAway = stat.label === 'Possession' ? `${stat.away}%` : String(stat.away);
              return (
                <g key={stat.label}>
                  <text x={labelW - 4} y={y + barH / 2 + 3} textAnchor="end" fill="#8b949e" fontSize="9">{stat.label}</text>
                  {/* Home bar (extends left from center) */}
                  <rect x={midX - homeW} y={y} width={homeW} height={barH} fill="#10b981" fillOpacity="0.8" rx="3" />
                  <text x={midX - homeW - 3} y={y + barH / 2 + 3} textAnchor="end" fill="#10b981" fontSize="8" fontWeight="bold">{displayHome}</text>
                  {/* Center divider */}
                  <line x1={midX} y1={y} x2={midX} y2={y + barH} stroke="#484f58" strokeWidth="1" />
                  {/* Away bar (extends right from center) */}
                  <rect x={midX} y={y} width={awayW} height={barH} fill="#38bdf8" fillOpacity="0.8" rx="3" />
                  <text x={midX + awayW + 3} y={y + barH / 2 + 3} textAnchor="start" fill="#38bdf8" fontSize="8" fontWeight="bold">{displayAway}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }



  // ═════════════════════════════════════════════════════════════
  // MAIN RETURN
  // ═════════════════════════════════════════════════════════════
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setScreen('dashboard')}
          className="h-8 w-8 p-0 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold text-[#c9d1d9] flex items-center gap-2">
          <Eye className="w-5 h-5 text-emerald-400" />
          Match Replay
        </h1>
        <Badge variant="outline" className="text-[9px] border-[#30363d] text-[#8b949e] ml-auto">
          Week {currentWeek}
        </Badge>
      </motion.div>

      {/* Score Header */}
      {renderScoreHeader()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-1 h-auto">
          <TabsTrigger
            value="timeline"
            className="flex-1 py-2 px-1 rounded-md text-[10px] font-semibold data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-[#8b949e] h-auto"
          >
            <Clock className="w-3 h-3 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger
            value="tactical"
            className="flex-1 py-2 px-1 rounded-md text-[10px] font-semibold data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-[#8b949e] h-auto"
          >
            <Users className="w-3 h-3 mr-1" />
            Tactical
          </TabsTrigger>
          <TabsTrigger
            value="players"
            className="flex-1 py-2 px-1 rounded-md text-[10px] font-semibold data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-[#8b949e] h-auto"
          >
            <Star className="w-3 h-3 mr-1" />
            Players
          </TabsTrigger>
          <TabsTrigger
            value="statistics"
            className="flex-1 py-2 px-1 rounded-md text-[10px] font-semibold data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-[#8b949e] h-auto"
          >
            <BarChart3 className="w-3 h-3 mr-1" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Match Timeline ──────────────────────────── */}
        <TabsContent value="timeline">
          <AnimatePresence mode="wait">
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {renderMomentumChart()}
              {renderEventDonut()}
              {renderKeyMomentTimeline()}
              {renderEventTimeline()}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── TAB 2: Tactical Analysis ───────────────────────── */}
        <TabsContent value="tactical">
          <AnimatePresence mode="wait">
            <motion.div
              key="tactical"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {renderFormationDisplay()}
              {renderTacticalChanges()}
              {renderFormationComparisonBars()}
              {renderPassingNetwork()}
              {renderTacticalShiftTimeline()}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── TAB 3: Player Performance ─────────────────────── */}
        <TabsContent value="players">
          <AnimatePresence mode="wait">
            <motion.div
              key="players"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {renderRatingComparisonBars()}
              {renderDistanceScatter()}
              {renderPerformanceHexRadar()}
              {renderPlayerCards()}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ─── TAB 4: Statistics & Heatmap ───────────────────── */}
        <TabsContent value="statistics">
          <AnimatePresence mode="wait">
            <motion.div
              key="statistics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {renderStatsGrid()}
              {renderPossessionPie()}
              {renderShotMap()}
              {renderShotAccuracyBars()}
              {renderPossessionTrend()}
              {renderButterflyChart()}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Footer actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.2 }}
        className="space-y-2"
      >
        <Button
          onClick={() => setScreen('post_match_analysis')}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
        >
          <ChevronRight className="w-4 h-4" />
          View Full Analysis
        </Button>
        <Button
          onClick={() => setScreen('dashboard')}
          variant="outline"
          className="w-full h-10 border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] rounded-lg text-xs flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
