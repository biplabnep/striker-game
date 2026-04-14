'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Volume2, Users, Music, Sun, CloudRain,
  Wind, Thermometer, Star, BarChart3, Activity, Zap,
  Heart, Trophy, Flag, Shield, Sparkles, Clock,
  TrendingUp, Award, Target, ChevronRight, Gauge
} from 'lucide-react';

// ============================================================
// SVG Helper Functions — extracted to avoid .map().join() in JSX
// ============================================================

/** Build a hex polygon points string for radar charts */
function buildHexPoints(cx: number, cy: number, radius: number, sides: number): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

/** Build data polygon points for radar charts from values */
function buildRadarDataPoints(
  cx: number, cy: number, maxRadius: number, sides: number, values: number[]
): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    const r = (values[i] / 100) * maxRadius;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

/** Build an arc path for semi-circular gauge */
function buildSemiArcPath(
  cx: number, cy: number, radius: number, startAngle: number, endAngle: number
): string {
  const start = { x: cx + radius * Math.cos(startAngle), y: cy + radius * Math.sin(startAngle) };
  const end = { x: cx + radius * Math.cos(endAngle), y: cy + radius * Math.sin(endAngle) };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Build area chart path string */
function buildAreaPath(points: { x: number; y: number }[], baseY: number): string {
  if (points.length === 0) return '';
  const lineParts = points.map(p => `${p.x},${p.y}`).join(' ');
  return `M ${lineParts} L ${points[points.length - 1].x},${baseY} L ${points[0].x},${baseY} Z`;
}

/** Build line chart path string */
function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
}

/** Build donut arc path for a single segment */
function buildDonutArc(
  cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number
): string {
  const outerStart = { x: cx + outerR * Math.cos(startAngle), y: cy + outerR * Math.sin(startAngle) };
  const outerEnd = { x: cx + outerR * Math.cos(endAngle), y: cy + outerR * Math.sin(endAngle) };
  const innerStart = { x: cx + innerR * Math.cos(endAngle), y: cy + innerR * Math.sin(endAngle) };
  const innerEnd = { x: cx + innerR * Math.cos(startAngle), y: cy + innerR * Math.sin(startAngle) };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

// ============================================================
// Data Constants
// ============================================================

const ATMOSPHERE_CATEGORIES = [
  { name: 'Noise Level', icon: Volume2, color: '#ef4444', value: 88 },
  { name: 'Crowd Density', icon: Users, color: '#3b82f6', value: 82 },
  { name: 'Singing Chants', icon: Music, color: '#f59e0b', value: 79 },
  { name: 'Tifo Display', icon: Flag, color: '#a855f7', value: 91 },
  { name: 'Pyro Effects', icon: Sparkles, color: '#f97316', value: 85 },
  { name: 'Family Zone', icon: Heart, color: '#ec4899', value: 72 },
];

const MATCH_DAY_TYPES = [
  { name: 'League', multiplier: 1.0, icon: Shield },
  { name: 'Cup', multiplier: 1.15, icon: Trophy },
  { name: 'Derby', multiplier: 1.3, icon: Zap },
  { name: 'European', multiplier: 1.4, icon: Star },
];

const RECENT_RATINGS = [
  { opponent: 'Arsenal', competition: 'League', rating: 92 },
  { opponent: 'Chelsea', competition: 'Cup', rating: 88 },
  { opponent: 'Liverpool', competition: 'Derby', rating: 95 },
  { opponent: 'Bayern', competition: 'European', rating: 97 },
  { opponent: 'Everton', competition: 'League', rating: 78 },
];

const FAN_GROUPS = [
  { name: 'Ultras', members: 4500, section: 'Curva Nord', color: '#ef4444', energy: 96, description: 'The heart of the atmosphere. Coordinated chants, pyrotechnics, and relentless support for 90 minutes.' },
  { name: 'Supporters Club', members: 12000, section: 'Main Stand', color: '#3b82f6', energy: 78, description: 'The backbone of the fanbase. Consistent attendance, community events, and passionate singing.' },
  { name: 'Family Stand', members: 8000, section: 'East Stand', color: '#10b981', energy: 55, description: 'Family-friendly atmosphere with younger fans learning the traditions. Clapping and flag waving.' },
  { name: 'Away Fans', members: 3000, section: 'South Corner', color: '#f59e0b', energy: 82, description: 'Visiting supporters bringing their own songs and spirit. Always vocal despite being outnumbered.' },
  { name: 'VIP', members: 500, section: 'West Suite', color: '#a855f7', energy: 35, description: 'Premium experience holders. More reserved but crucial for club revenue and corporate partnerships.' },
];

const CHANT_LIBRARY = [
  { name: 'Glory Glory', lyrics: 'Glory, Glory Man United!', popularity: 95, occasion: 'Goal celebration' },
  { name: 'The Walk On', lyrics: 'You\'ll Never Walk Alone!', popularity: 98, occasion: 'Pre-match anthem' },
  { name: 'Allez Allez', lyrics: 'Allez, allez, allez! We love you!', popularity: 82, occasion: 'Chant' },
  { name: 'Marching On', lyrics: 'We are the champions, my friend!', popularity: 76, occasion: 'Victory' },
  { name: 'Blue Moon', lyrics: 'Blue Moon, you saw me standing alone!', popularity: 71, occasion: 'Pre-match' },
  { name: 'Hey Jude', lyrics: 'Na na na na na na na, na na na na, Hey Jude!', popularity: 88, occasion: 'Anytime' },
  { name: 'Super Eagles', lyrics: 'Fly high, fly high, we\'ll never die!', popularity: 65, occasion: 'Second half' },
  { name: 'Seven Nation Army', lyrics: 'Ohhh, ohhh, oh-oh-ohhh!', popularity: 91, occasion: 'Anytime' },
];

const TIFO_GALLERY = [
  { title: 'The Great Wall', description: 'A massive mosaic covering the entire Curva, depicting the club crest formed by 15,000 coloured cards held by fans in perfect synchronization.', match: 'vs Bayern Munich, Champions League Quarter-Final', rating: 98 },
  { title: 'Player Silhouettes', description: 'Giant black silhouette flags of the starting XI displayed along the entire main stand, with smoke effects in team colours.', match: 'vs Arsenal, League Derby', rating: 94 },
  { title: 'The Banner Drop', description: 'A 40-meter banner reading "Until Death Do Us Part" unfurled from the top tier just before kickoff, with coordinated drum beats.', match: 'vs Chelsea, Cup Semi-Final', rating: 96 },
  { title: 'Fireworks Display', description: 'Choreographed pyrotechnic display with flares, smoke bombs, and sparklers creating a sea of colour across three stands simultaneously.', match: 'vs Barcelona, Champions League Group Stage', rating: 99 },
];

const WEATHER_EFFECTS = [
  { type: 'Rain', icon: CloudRain, attendance: -8, atmosphere: +12, pitch: 'Slick surface', color: '#3b82f6', description: 'Heavy rain creates an intense atmosphere but reduces family attendance. Players benefit from a faster pitch.' },
  { type: 'Wind', icon: Wind, attendance: -5, atmosphere: -3, pitch: 'Variable conditions', color: '#06b6d4', description: 'Strong winds affect long balls and set pieces. High ball game becomes unpredictable. Flags and banners struggle to stay up.' },
  { type: 'Snow', icon: Thermometer, attendance: -15, atmosphere: +18, pitch: 'Slow & heavy', color: '#e2e8f0', description: 'Snowfall creates a magical spectacle. Reduced attendance but those who brave the cold sing louder. Pitch becomes slower.' },
  { type: 'Heat', icon: Sun, attendance: -3, atmosphere: -5, pitch: 'Dry & fast', color: '#f59e0b', description: 'High temperatures drain player energy faster. Afternoon matches suffer most. Evening kickoffs preferred during summer.' },
];

const PITCH_CONDITIONS = [
  { name: 'Grass Quality', value: 92, color: '#10b981', status: 'Excellent' },
  { name: 'Drainage', value: 85, color: '#3b82f6', status: 'Good' },
  { name: 'Pitch Flatness', value: 88, color: '#a855f7', status: 'Very Good' },
  { name: 'Line Markings', value: 95, color: '#f59e0b', status: 'Perfect' },
];

const MATCH_TIMINGS = [
  { name: 'Afternoon', time: '15:00', avgAttendance: 42500, preference: 62, color: '#f59e0b' },
  { name: 'Evening', time: '19:45', avgAttendance: 48200, preference: 88, color: '#a855f7' },
  { name: 'Night', time: '21:00', avgAttendance: 45800, preference: 76, color: '#3b82f6' },
];

const HOME_ADVANTAGE_FACTORS = [
  { name: 'Crowd Support', value: 88, color: '#ef4444', description: 'Home fans create an intimidating wall of noise that unsettles visiting players and referees.' },
  { name: 'Familiarity', value: 82, color: '#3b82f6', description: 'Players know every inch of their home pitch, including bounce, slope, and wind patterns.' },
  { name: 'Pitch Condition', value: 75, color: '#10b981', description: 'Groundsman prepares the pitch to suit home team\'s playing style and preferences.' },
  { name: 'Travel Fatigue', value: 70, color: '#f59e0b', description: 'Away teams face travel disruption, unfamiliar hotels, and disrupted routines.' },
  { name: 'Referee Bias', value: 45, color: '#a855f7', description: 'Subconscious home bias in refereeing decisions, especially for 50/50 calls and added time.' },
  { name: 'Tactical Comfort', value: 78, color: '#06b6d4', description: 'Home team sets up in their preferred formation without adapting to unfamiliar surroundings.' },
];

const HOME_AWAY_SEASONS = [
  { season: '2023/24', homeWins: 16, awayWins: 8, homeDraws: 5, awayDraws: 7, homeLoss: 2, awayLoss: 8 },
  { season: '2022/23', homeWins: 14, awayWins: 7, homeDraws: 6, awayDraws: 6, homeLoss: 3, awayLoss: 10 },
  { season: '2021/22', homeWins: 18, awayWins: 9, homeDraws: 4, awayDraws: 5, homeLoss: 1, awayLoss: 9 },
];

const SCATTER_DATA = [
  { attendance: 48500, goals: 3, result: 'W' },
  { attendance: 46200, goals: 2, result: 'W' },
  { attendance: 51000, goals: 4, result: 'W' },
  { attendance: 38900, goals: 1, result: 'D' },
  { attendance: 44100, goals: 2, result: 'W' },
  { attendance: 49800, goals: 3, result: 'W' },
  { attendance: 35200, goals: 0, result: 'L' },
  { attendance: 47500, goals: 2, result: 'D' },
  { attendance: 50200, goals: 5, result: 'W' },
  { attendance: 42000, goals: 1, result: 'L' },
];

// ============================================================
// Seeded PRNG helpers
// ============================================================
function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function seededRand(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sr(playerName: string, week: number, key: string): number {
  const seed = hashStr(`${playerName}-w${week}-${key}`);
  return seededRand(seed)();
}

function srInt(playerName: string, week: number, key: string, min: number, max: number): number {
  return Math.floor(sr(playerName, week, key) * (max - min + 1)) + min;
}

// ============================================================
// Main Component
// ============================================================
export default function StadiumAtmosphere(): React.JSX.Element {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const playerData = gameState?.player ?? null;
  const currentClub = gameState?.currentClub ?? ({} as any);
  const playerName = playerData?.name ?? 'Your Player';
  const teamName = currentClub?.name ?? 'Your Club';

  const [activeTab, setActiveTab] = useState('crowd');
  const [selectedMatchType, setSelectedMatchType] = useState('League');
  const week = gameState?.currentWeek ?? 1;

  // ============================================
  // Computed data — ALL hooks before conditional returns
  // ============================================

  const atmosphereScore = useMemo(() => {
    const base = 75 + Math.round(sr(playerName, week, 'atmo') * 20);
    return Math.min(100, Math.max(40, base));
  }, [playerName, week]);

  const adjustedCategories = useMemo(() => {
    const matchType = MATCH_DAY_TYPES.find(m => m.name === selectedMatchType) ?? MATCH_DAY_TYPES[0];
    return ATMOSPHERE_CATEGORIES.map(cat => ({
      ...cat,
      value: Math.min(100, Math.round(cat.value * matchType.multiplier * (0.9 + sr(playerName, week, `cat-${cat.name}`) * 0.2))),
    }));
  }, [selectedMatchType, playerName, week]);

  const recentAtmosphereData = useMemo(() => {
    return RECENT_RATINGS.map((r, i) => ({
      ...r,
      adjustedRating: Math.min(100, Math.max(40, Math.round(r.rating * (0.85 + sr(playerName, week, `recent-${i}`) * 0.3)))),
    }));
  }, [playerName, week]);

  const atmosphereTrend = useMemo(() => {
    const labels = ['Match 1', 'Match 2', 'Match 3', 'Match 4', 'Match 5', 'Match 6', 'Match 7', 'Match 8'];
    return labels.map((label, i) => ({
      label,
      value: Math.max(50, Math.min(100, atmosphereScore + srInt(playerName, week, `trend-${i}`, -15, 15))),
    }));
  }, [atmosphereScore, playerName, week]);

  const fanGroupDistribution = useMemo(() => {
    const total = FAN_GROUPS.reduce((sum, g) => sum + g.members, 0);
    return FAN_GROUPS.map(g => ({
      ...g,
      percentage: Math.round((g.members / total) * 100),
    }));
  }, []);

  const topChants = useMemo(() => {
    return [...CHANT_LIBRARY].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
  }, []);

  const fanDemographics = useMemo(() => {
    return [
      { name: 'Youth (0-18)', percentage: 18, count: 4500, color: '#3b82f6' },
      { name: 'Adult (19-45)', percentage: 48, count: 12000, color: '#10b981' },
      { name: 'Family (46-60)', percentage: 24, count: 6000, color: '#f59e0b' },
      { name: 'Senior (60+)', percentage: 10, count: 2500, color: '#a855f7' },
    ];
  }, []);

  const engagementScore = useMemo(() => {
    return Math.round(60 + sr(playerName, week, 'engage') * 35);
  }, [playerName, week]);

  const weatherRadarData = useMemo(() => {
    return [
      { name: 'Rain', value: 65 + srInt(playerName, week, 'wr', 0, 20), color: '#3b82f6' },
      { name: 'Wind', value: 45 + srInt(playerName, week, 'ww', 0, 25), color: '#06b6d4' },
      { name: 'Snow', value: 30 + srInt(playerName, week, 'ws', 0, 35), color: '#e2e8f0' },
      { name: 'Heat', value: 50 + srInt(playerName, week, 'wh', 0, 20), color: '#f59e0b' },
      { name: 'Fog', value: 25 + srInt(playerName, week, 'wf', 0, 30), color: '#8b949e' },
    ];
  }, [playerName, week]);

  const capacityData = useMemo(() => {
    const maxCapacity = 52000;
    const currentAttendance = Math.round(maxCapacity * (0.78 + sr(playerName, week, 'cap') * 0.15));
    return {
      current: currentAttendance,
      max: maxCapacity,
      percentage: Math.round((currentAttendance / maxCapacity) * 100),
    };
  }, [playerName, week]);

  const homeWinRate = useMemo(() => {
    return 60 + srInt(playerName, week, 'hwr', 0, 15);
  }, [playerName, week]);

  const historicalTrend = useMemo(() => {
    return [
      { season: '2021/22', value: 71 },
      { season: '2022/23', value: 67 },
      { season: '2023/24', value: homeWinRate },
    ];
  }, [homeWinRate]);

  // ============================================
  // Sub-components (camelCase, called as {fnName()})
  // ============================================

  const renderAtmosphereHeader = useCallback(() => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-20 h-20 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/30 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Activity className="h-5 w-5 text-emerald-400 mb-0.5" />
            <span className="text-2xl font-bold text-emerald-400">{atmosphereScore}</span>
            <span className="text-[9px] text-emerald-400/70">/100</span>
          </motion.div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#c9d1d9] mb-1">Overall Atmosphere</h3>
            <p className="text-xs text-[#8b949e] mb-2">
              {atmosphereScore >= 90 ? 'Electric atmosphere tonight!' : atmosphereScore >= 75 ? 'Great atmosphere expected' : atmosphereScore >= 60 ? 'Average atmosphere' : 'Quiet night anticipated'}
            </p>
            <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
              <motion.div
                className="h-full rounded-lg bg-emerald-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, width: `${atmosphereScore}%` }}
                transition={{ duration: 0.5 }}
                style={{ width: `${atmosphereScore}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [atmosphereScore]);

  const renderCategoryCards = useCallback(() => (
    <div className="grid grid-cols-3 gap-2">
      {adjustedCategories.map((cat, i) => (
        <motion.div
          key={cat.name}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 + i * 0.04 }}
        >
          <cat.icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: cat.color }} />
          <p className="text-[10px] text-[#8b949e] mb-1">{cat.name}</p>
          <p className="text-lg font-bold" style={{ color: cat.color }}>{cat.value}</p>
        </motion.div>
      ))}
    </div>
  ), [adjustedCategories]);

  const renderMatchDaySelector = useCallback(() => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
          <Shield className="h-3 w-3 text-amber-400" /> Match Day Type
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex gap-2">
          {MATCH_DAY_TYPES.map(mt => {
            const isActive = selectedMatchType === mt.name;
            return (
              <Button
                key={mt.name}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 text-xs h-9 ${isActive ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'}`}
                onClick={() => setSelectedMatchType(mt.name)}
              >
                <mt.icon className="h-3 w-3 mr-1" />
                {mt.name}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  ), [selectedMatchType, setSelectedMatchType]);

  const renderRecentRatings = useCallback(() => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
          <TrendingUp className="h-3 w-3 text-emerald-400" /> Recent Atmosphere Ratings
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {recentAtmosphereData.map((item, i) => {
          const barColor = item.adjustedRating >= 90 ? '#10b981' : item.adjustedRating >= 75 ? '#3b82f6' : item.adjustedRating >= 60 ? '#f59e0b' : '#ef4444';
          return (
            <motion.div
              key={i}
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#c9d1d9] truncate">{item.opponent}</span>
                    <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d] text-[#8b949e]">{item.competition}</Badge>
                  </div>
                  <span className="text-xs font-bold ml-2" style={{ color: barColor }}>{item.adjustedRating}</span>
                </div>
                <div className="h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                  <motion.div
                    className="h-full rounded-lg"
                    style={{ backgroundColor: barColor }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, width: `${item.adjustedRating}%` }}
                    transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  ), [recentAtmosphereData]);

  // ----- SVG: Atmosphere Hex Radar (6-axis) -----
  const renderHexRadar = useCallback(() => {
    const cx = 150;
    const cy = 115;
    const maxR = 80;
    const sides = 6;
    const labels = ['Noise', 'Density', 'Singing', 'Tifo', 'Pyro', 'Family'];
    const values = adjustedCategories.map(c => c.value);
    const gridPoints50 = buildHexPoints(cx, cy, maxR * 0.5, sides);
    const gridPoints100 = buildHexPoints(cx, cy, maxR, sides);
    const dataPoints = buildRadarDataPoints(cx, cy, maxR, sides, values);

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Activity className="h-3 w-3 text-emerald-400" /> Atmosphere Hex Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 230" className="w-full max-w-[320px]">
            {/* Grid hexagons */}
            <polygon points={gridPoints50} fill="none" stroke="#334155" strokeWidth={0.5} opacity={0.3} />
            <polygon points={gridPoints100} fill="none" stroke="#334155" strokeWidth={0.5} opacity={0.5} />
            {/* Axis lines */}
            {Array.from({ length: sides }, (_, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
              const ex = cx + maxR * Math.cos(angle);
              const ey = cy + maxR * Math.sin(angle);
              return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#334155" strokeWidth={0.5} opacity={0.2} />;
            })}
            {/* Data polygon */}
            <motion.polygon
              points={dataPoints}
              fill="rgba(16,185,129,0.15)"
              stroke="#10b981"
              strokeWidth={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
            {/* Data points + labels */}
            {values.map((val, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
              const dx = cx + (val / 100) * maxR * Math.cos(angle);
              const dy = cy + (val / 100) * maxR * Math.sin(angle);
              const lx = cx + (maxR + 18) * Math.cos(angle);
              const ly = cy + (maxR + 18) * Math.sin(angle);
              return (
                <g key={i}>
                  <motion.circle cx={dx} cy={dy} r={3} fill="#10b981" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.06 }} />
                  <text x={lx} y={ly} textAnchor="middle" className="fill-slate-400" fontSize={11} fontWeight={600}>{labels[i]}</text>
                  <text x={lx} y={ly + 13} textAnchor="middle" fill={adjustedCategories[i].color} fontSize={12} fontWeight={700}>{val}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }, [adjustedCategories]);

  // ----- SVG: Crowd Noise Level Gauge (Semi-circular, 0-120 dB) -----
  const renderNoiseGauge = useCallback(() => {
    const cx = 150;
    const cy = 160;
    const radius = 100;
    const needleValue = Math.min(120, Math.round(65 + sr(playerName, week, 'noise') * 45));
    const needleAngle = Math.PI + (needleValue / 120) * Math.PI;
    const needleLen = radius - 15;
    const needleX = cx + needleLen * Math.cos(needleAngle);
    const needleY = cy + needleLen * Math.sin(needleAngle);
    const zones = [
      { start: Math.PI, end: Math.PI + Math.PI * 0.25, color: '#10b981', label: 'Quiet' },
      { start: Math.PI + Math.PI * 0.25, end: Math.PI + Math.PI * 0.5, color: '#3b82f6', label: 'Moderate' },
      { start: Math.PI + Math.PI * 0.5, end: Math.PI + Math.PI * 0.75, color: '#f59e0b', label: 'Loud' },
      { start: Math.PI + Math.PI * 0.75, end: Math.PI * 2, color: '#ef4444', label: 'Deafening' },
    ];

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Volume2 className="h-3 w-3 text-red-400" /> Crowd Noise Level
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 210" className="w-full max-w-[320px]">
            {/* Background arc */}
            <path d={buildSemiArcPath(cx, cy, radius, Math.PI, Math.PI * 2)} fill="none" stroke="#21262d" strokeWidth={16} strokeLinecap="round" />
            {/* Zone arcs */}
            {zones.map((zone, i) => (
              <motion.path
                key={zone.label}
                d={buildSemiArcPath(cx, cy, radius, zone.start, zone.end)}
                fill="none"
                stroke={zone.color}
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              />
            ))}
            {/* Zone labels */}
            <text x={cx - 80} y={cy + 25} textAnchor="middle" className="fill-slate-500" fontSize={9}>Quiet</text>
            <text x={cx - 37} y={cy + 25} textAnchor="middle" className="fill-slate-500" fontSize={9}>Moderate</text>
            <text x={cx + 37} y={cy + 25} textAnchor="middle" className="fill-slate-500" fontSize={9}>Loud</text>
            <text x={cx + 80} y={cy + 25} textAnchor="middle" className="fill-slate-500" fontSize={9}>Deafening</text>
            {/* Needle */}
            <motion.line
              x1={cx} y1={cy} x2={needleX} y2={needleY}
              stroke="#ef4444"
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            />
            <circle cx={cx} cy={cy} r={5} fill="#ef4444" />
            {/* dB value */}
            <text x={cx} y={cy + 45} textAnchor="middle" fill="#ef4444" fontSize={22} fontWeight={800}>{needleValue}</text>
            <text x={cx} y={cy + 60} textAnchor="middle" className="fill-slate-500" fontSize={11}>dB</text>
          </svg>
        </CardContent>
      </Card>
    );
  }, [playerName, week]);

  // ----- SVG: Atmosphere Trend Area Chart -----
  const renderTrendChart = useCallback(() => {
    const chartLeft = 40;
    const chartRight = 280;
    const chartTop = 20;
    const chartBottom = 160;
    const chartW = chartRight - chartLeft;
    const chartH = chartBottom - chartTop;
    const minVal = 40;
    const maxVal = 100;
    const range = maxVal - minVal;

    const points = atmosphereTrend.map((d, i) => ({
      x: chartLeft + (i / (atmosphereTrend.length - 1)) * chartW,
      y: chartBottom - ((d.value - minVal) / range) * chartH,
    }));

    const areaPath = buildAreaPath(points, chartBottom);
    const linePath = buildLinePath(points);

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-amber-400" /> Atmosphere Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 200" className="w-full max-w-[320px]">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
              const y = chartBottom - frac * chartH;
              const val = Math.round(minVal + frac * range);
              return (
                <g key={i}>
                  <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke="#334155" strokeWidth={0.5} opacity={0.2} strokeDasharray="4 3" />
                  <text x={chartLeft - 5} y={y + 4} textAnchor="end" className="fill-slate-500" fontSize={9}>{val}</text>
                </g>
              );
            })}
            {/* Area fill */}
            <motion.path
              d={areaPath}
              fill="rgba(16,185,129,0.12)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            {/* Line */}
            <motion.path
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            {/* Dots + labels */}
            {points.map((pt, i) => (
              <g key={i}>
                <motion.circle cx={pt.x} cy={pt.y} r={3.5} fill="#10b981" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.06 }} />
                <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="#10b981" fontSize={9} fontWeight={600}>{atmosphereTrend[i].value}</text>
                <text x={pt.x} y={chartBottom + 14} textAnchor="middle" className="fill-slate-500" fontSize={8}>{i + 1}</text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }, [atmosphereTrend]);

  // ===== TAB 2: Fan Culture Sub-components =====

  const renderFanGroupCards = useCallback(() => (
    <div className="space-y-2">
      {FAN_GROUPS.map((group, i) => (
        <motion.div
          key={group.name}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 + i * 0.05 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${group.color}20` }}>
              <Users className="h-4 w-4" style={{ color: group.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#c9d1d9]">{group.name}</span>
                <span className="text-[10px] text-[#8b949e]">{group.section}</span>
              </div>
              <p className="text-[10px] text-[#8b949e] mt-0.5 leading-relaxed">{group.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px]" style={{ color: group.color }}>{group.members.toLocaleString()} members</span>
                <div className="flex-1 h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                  <motion.div
                    className="h-full rounded-lg"
                    style={{ backgroundColor: group.color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, width: `${group.energy}%` }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                  />
                </div>
                <span className="text-[10px] font-bold" style={{ color: group.color }}>{group.energy}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  ), []);

  const renderChantLibrary = useCallback(() => (
    <div className="space-y-2">
      {CHANT_LIBRARY.map((chant, i) => (
        <motion.div
          key={chant.name}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 + i * 0.04 }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Music className="h-3 w-3 text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-[#c9d1d9]">{chant.name}</span>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d] text-[#8b949e]">{chant.occasion}</Badge>
              </div>
              <p className="text-[11px] text-[#8b949e] italic leading-relaxed">&ldquo;{chant.lyrics}&rdquo;</p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-sm font-bold text-emerald-400">{chant.popularity}%</span>
              <span className="text-[8px] text-[#484f58]">popularity</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  ), []);

  const renderTifoGallery = useCallback(() => (
    <div className="grid grid-cols-2 gap-2">
      {TIFO_GALLERY.map((tifo, i) => (
        <motion.div
          key={tifo.title}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 + i * 0.06 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Flag className="h-3.5 w-3.5 text-purple-400" />
            <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[9px]">{tifo.rating}/100</Badge>
          </div>
          <h4 className="text-xs font-semibold text-[#c9d1d9] mb-1">{tifo.title}</h4>
          <p className="text-[10px] text-[#8b949e] leading-relaxed">{tifo.description.slice(0, 100)}...</p>
          <p className="text-[9px] text-[#484f58] mt-1.5">{tifo.match}</p>
        </motion.div>
      ))}
    </div>
  ), []);

  const renderEngagementScore = useCallback(() => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-purple-500/15 border-2 border-purple-500/30 flex flex-col items-center justify-center">
            <Heart className="h-4 w-4 text-purple-400 mb-0.5" />
            <span className="text-xl font-bold text-purple-400">{engagementScore}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#c9d1d9] mb-1">Fan Engagement Score</h3>
            <p className="text-xs text-[#8b949e]">
              {engagementScore >= 85 ? 'Outstanding engagement!' : engagementScore >= 70 ? 'Strong fan connection' : 'Room to grow fan bond'}
            </p>
            <div className="h-1.5 bg-[#21262d] rounded-lg overflow-hidden mt-2">
              <motion.div className="h-full rounded-lg bg-purple-500" initial={{ opacity: 0 }} animate={{ opacity: 1, width: `${engagementScore}%` }} transition={{ duration: 0.5 }} style={{ width: `${engagementScore}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [engagementScore]);

  // ----- SVG: Fan Group Distribution Donut -----
  const renderFanDonut = useCallback(() => {
    const cx = 150;
    const cy = 100;
    const outerR = 75;
    const innerR = 45;
    const gap = 0.03;
    let currentAngle = -Math.PI / 2;
    const total = FAN_GROUPS.reduce((sum, g) => sum + g.members, 0);

    const segments = FAN_GROUPS.map(group => {
      const pct = group.members / total;
      const arcSpan = pct * 2 * Math.PI - gap;
      const startA = currentAngle + gap / 2;
      const endA = currentAngle + arcSpan + gap / 2;
      const midA = startA + arcSpan / 2;
      currentAngle += pct * 2 * Math.PI;
      return {
        ...group,
        percentage: Math.round(pct * 100),
        path: buildDonutArc(cx, cy, outerR, innerR, startA, endA),
        labelX: cx + (outerR + 16) * Math.cos(midA),
        labelY: cy + (outerR + 16) * Math.sin(midA),
      };
    });

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Users className="h-3 w-3 text-sky-400" /> Fan Group Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 210" className="w-full max-w-[320px]">
            {segments.map((seg, i) => (
              <g key={seg.name}>
                <motion.path
                  d={seg.path}
                  fill={seg.color}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                />
                <text x={seg.labelX} y={seg.labelY} textAnchor="middle" className="fill-slate-300" fontSize={10} fontWeight={600}>{seg.percentage}%</text>
              </g>
            ))}
            {/* Center label */}
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-300" fontSize={13} fontWeight={700}>{total.toLocaleString()}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-500" fontSize={9}>Total Fans</text>
            {/* Legend */}
            {segments.map((seg, i) => (
              <g key={`leg-${seg.name}`}>
                <rect x={10} y={155 + i * 14} width={8} height={8} rx={1} fill={seg.color} opacity={0.8} />
                <text x={22} y={163 + i * 14} className="fill-slate-400" fontSize={9}>{seg.name}</text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>
    );
  }, []);

  // ----- SVG: Chant Popularity Bars -----
  const renderChantBars = useCallback(() => {
    const barH = 22;
    const gap = 8;
    const labelW = 110;
    const barMaxW = 150;
    const startY = 15;

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Music className="h-3 w-3 text-amber-400" /> Most Popular Chants
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 190" className="w-full max-w-[320px]">
            {topChants.map((chant, i) => {
              const y = startY + i * (barH + gap);
              const barW = (chant.popularity / 100) * barMaxW;
              const barColor = chant.popularity >= 90 ? '#10b981' : chant.popularity >= 75 ? '#3b82f6' : '#f59e0b';
              return (
                <g key={chant.name}>
                  <text x={labelW - 5} y={y + barH / 2 + 4} textAnchor="end" className="fill-slate-300" fontSize={11} fontWeight={500}>{chant.name}</text>
                  <motion.rect
                    x={labelW}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={3}
                    fill={barColor}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.75 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                  />
                  <text x={labelW + barW + 5} y={y + barH / 2 + 4} fill={barColor} fontSize={11} fontWeight={700}>{chant.popularity}%</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }, [topChants]);

  // ----- SVG: Fan Demographics Bars -----
  const renderDemographicsBars = useCallback(() => {
    const barH = 24;
    const gap = 10;
    const labelW = 105;
    const barMaxW = 140;
    const startY = 15;

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <BarChart3 className="h-3 w-3 text-purple-400" /> Fan Demographics
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 180" className="w-full max-w-[320px]">
            {fanDemographics.map((demo, i) => {
              const y = startY + i * (barH + gap);
              const barW = (demo.percentage / 100) * barMaxW;
              return (
                <g key={demo.name}>
                  <text x={labelW - 5} y={y + barH / 2 + 4} textAnchor="end" className="fill-slate-300" fontSize={10} fontWeight={500}>{demo.name}</text>
                  <motion.rect
                    x={labelW}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={3}
                    fill={demo.color}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.75 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                  />
                  <text x={labelW + barW + 5} y={y + barH / 2 + 1} fill={demo.color} fontSize={10} fontWeight={700}>{demo.percentage}%</text>
                  <text x={labelW + barW + 5} y={y + barH / 2 + 12} className="fill-slate-500" fontSize={8}>{demo.count.toLocaleString()}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }, [fanDemographics]);

  // ===== TAB 3: Stadium Effects Sub-components =====

  const renderWeatherCards = useCallback(() => (
    <div className="grid grid-cols-2 gap-2">
      {WEATHER_EFFECTS.map((weather, i) => (
        <motion.div
          key={weather.type}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 + i * 0.05 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <weather.icon className="h-4 w-4" style={{ color: weather.color }} />
            <span className="text-xs font-semibold text-[#c9d1d9]">{weather.type}</span>
          </div>
          <p className="text-[10px] text-[#8b949e] leading-relaxed mb-2">{weather.description}</p>
          <div className="flex gap-3">
            <div>
              <span className="text-[9px] text-[#484f58]">Attendance</span>
              <p className="text-xs font-bold text-red-400">{weather.attendance}%</p>
            </div>
            <div>
              <span className="text-[9px] text-[#484f58]">Atmosphere</span>
              <p className="text-xs font-bold text-emerald-400">+{weather.atmosphere}%</p>
            </div>
          </div>
          <p className="text-[9px] text-[#484f58] mt-1.5">Pitch: {weather.pitch}</p>
        </motion.div>
      ))}
    </div>
  ), []);

  const renderPitchConditions = useCallback(() => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
          <Activity className="h-3 w-3 text-emerald-400" /> Pitch Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {PITCH_CONDITIONS.map((cond, i) => (
          <motion.div
            key={cond.name}
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#c9d1d9]">{cond.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-[#30363d]" style={{ color: cond.color }}>{cond.status}</Badge>
                  <span className="text-xs font-bold" style={{ color: cond.color }}>{cond.value}</span>
                </div>
              </div>
              <div className="h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
                <motion.div className="h-full rounded-lg" style={{ backgroundColor: cond.color }} initial={{ opacity: 0 }} animate={{ opacity: 1, width: `${cond.value}%` }} transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }} />
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  ), []);

  const renderCapacityCard = () => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
          <Gauge className="h-3 w-3 text-sky-400" /> Stadium Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex justify-center">
        <svg viewBox="0 0 200 200" className="w-40 h-40">
          <circle cx={100} cy={100} r={80} fill="none" stroke="#21262d" strokeWidth={14} />
          <motion.circle
            cx={100} cy={100} r={80} fill="none" stroke="#3b82f6" strokeWidth={14}
            strokeDasharray={`${(capacityData.percentage / 100) * 2 * Math.PI * 80} ${2 * Math.PI * 80}`}
            strokeDashoffset={(2 * Math.PI * 80) / 4}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.6 }}
          />
          <text x={100} y={92} textAnchor="middle" fill="#3b82f6" fontSize={28} fontWeight={800}>{capacityData.percentage}%</text>
          <text x={100} y={110} textAnchor="middle" className="fill-slate-400" fontSize={10}>Utilization</text>
          <text x={100} y={128} textAnchor="middle" className="fill-slate-500" fontSize={10}>{capacityData.current.toLocaleString()} / {capacityData.max.toLocaleString()}</text>
        </svg>
      </CardContent>
    </Card>
  );

  const renderMatchTiming = useCallback(() => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
          <Clock className="h-3 w-3 text-amber-400" /> Match Timing Preference
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {MATCH_TIMINGS.map((timing, i) => (
          <motion.div
            key={timing.name}
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
          >
            <div className="w-10 text-center">
              <p className="text-xs font-bold" style={{ color: timing.color }}>{timing.time}</p>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#c9d1d9]">{timing.name}</span>
                <span className="text-[10px] font-bold" style={{ color: timing.color }}>{timing.preference}%</span>
              </div>
              <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
                <motion.div className="h-full rounded-lg" style={{ backgroundColor: timing.color }} initial={{ opacity: 0 }} animate={{ opacity: 0.75, width: `${timing.preference}%` }} transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }} />
              </div>
              <p className="text-[9px] text-[#484f58] mt-1">Avg attendance: {timing.avgAttendance.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  ), []);

  // ----- SVG: Weather Impact Radar (5-axis) -----
  const renderWeatherRadar = useCallback(() => {
    const cx = 150;
    const cy = 110;
    const maxR = 75;
    const sides = 5;
    const values = weatherRadarData.map(w => Math.min(100, w.value));
    const gridPoints50 = buildHexPoints(cx, cy, maxR * 0.5, sides);
    const gridPoints100 = buildHexPoints(cx, cy, maxR, sides);
    const dataPoints = buildRadarDataPoints(cx, cy, maxR, sides, values);

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <CloudRain className="h-3 w-3 text-sky-400" /> Weather Impact Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 220" className="w-full max-w-[320px]">
            <polygon points={gridPoints50} fill="none" stroke="#334155" strokeWidth={0.5} opacity={0.3} />
            <polygon points={gridPoints100} fill="none" stroke="#334155" strokeWidth={0.5} opacity={0.5} />
            {Array.from({ length: sides }, (_, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
              const ex = cx + maxR * Math.cos(angle);
              const ey = cy + maxR * Math.sin(angle);
              return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#334155" strokeWidth={0.5} opacity={0.2} />;
            })}
            <motion.polygon points={dataPoints} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />
            {values.map((val, i) => {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
              const dx = cx + (val / 100) * maxR * Math.cos(angle);
              const dy = cy + (val / 100) * maxR * Math.sin(angle);
              const lx = cx + (maxR + 20) * Math.cos(angle);
              const ly = cy + (maxR + 20) * Math.sin(angle);
              return (
                <g key={i}>
                  <motion.circle cx={dx} cy={dy} r={3} fill="#3b82f6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.06 }} />
                  <text x={lx} y={ly} textAnchor="middle" className="fill-slate-400" fontSize={10} fontWeight={600}>{weatherRadarData[i].name}</text>
                  <text x={lx} y={ly + 13} textAnchor="middle" fill={weatherRadarData[i].color} fontSize={11} fontWeight={700}>{val}%</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }, [weatherRadarData]);

  // ----- SVG: Capacity Utilization Ring -----
  const renderCapacityRing = () => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
          <Gauge className="h-3 w-3 text-emerald-400" /> Capacity Utilization Ring
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3 flex justify-center">
        <svg viewBox="0 0 300 200" className="w-full max-w-[320px]">
          {/* Background ring */}
          <circle cx={150} cy={100} r={70} fill="none" stroke="#21262d" strokeWidth={18} />
          {/* Foreground ring */}
          <motion.circle
            cx={150} cy={100} r={70} fill="none" stroke="#10b981" strokeWidth={18}
            strokeDasharray={`${(capacityData.percentage / 100) * 2 * Math.PI * 70} ${2 * Math.PI * 70}`}
            strokeDashoffset={(2 * Math.PI * 70) / 4}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.6 }}
          />
          {/* Center text */}
          <text x={150} y={90} textAnchor="middle" fill="#10b981" fontSize={32} fontWeight={800}>{capacityData.percentage}%</text>
          <text x={150} y={108} textAnchor="middle" className="fill-slate-400" fontSize={11}>Filled</text>
          <text x={150} y={125} textAnchor="middle" className="fill-slate-500" fontSize={10}>{capacityData.current.toLocaleString()} seats</text>
          {/* Max label */}
          <text x={150} y={185} textAnchor="middle" className="fill-slate-500" fontSize={10}>Max: {capacityData.max.toLocaleString()}</text>
        </svg>
      </CardContent>
    </Card>
  );

  // ----- SVG: Match Timing Preference Bars -----
  const renderTimingBars = useCallback(() => {
    const barH = 28;
    const gap = 14;
    const labelW = 85;
    const barMaxW = 155;
    const startY = 20;

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Clock className="h-3 w-3 text-purple-400" /> Timing & Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 170" className="w-full max-w-[320px]">
            {MATCH_TIMINGS.map((timing, i) => {
              const y = startY + i * (barH + gap);
              const barW = (timing.preference / 100) * barMaxW;
              return (
                <g key={timing.name}>
                  <text x={labelW - 5} y={y + barH / 2 + 1} textAnchor="end" className="fill-slate-300" fontSize={11} fontWeight={500}>{timing.name}</text>
                  <motion.rect x={labelW} y={y} width={barW} height={barH} rx={3} fill={timing.color} initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.2 + i * 0.1 }} />
                  <text x={labelW + barW + 5} y={y + barH / 2 - 2} fill={timing.color} fontSize={11} fontWeight={700}>{timing.preference}%</text>
                  <text x={labelW + barW + 5} y={y + barH / 2 + 10} className="fill-slate-500" fontSize={9}>{timing.avgAttendance.toLocaleString()}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }, []);

  // ===== TAB 4: Home Advantage Sub-components =====

  const renderHomeWinCard = useCallback(() => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-20 h-20 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/30 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Trophy className="h-5 w-5 text-emerald-400 mb-0.5" />
            <span className="text-2xl font-bold text-emerald-400">{homeWinRate}%</span>
          </motion.div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#c9d1d9] mb-1">Home Win Rate</h3>
            <p className="text-xs text-[#8b949e] mb-2">
              {homeWinRate >= 70 ? 'Fortress! One of the best home records.' : homeWinRate >= 60 ? 'Strong home advantage. Tough place to visit.' : 'Decent home form. Room for improvement.'}
            </p>
            <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
              <motion.div className="h-full rounded-lg bg-emerald-500" initial={{ opacity: 0 }} animate={{ opacity: 1, width: `${homeWinRate}%` }} transition={{ duration: 0.5 }} style={{ width: `${homeWinRate}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [homeWinRate]);

  const renderAdvantageFactors = useCallback(() => (
    <div className="grid grid-cols-2 gap-2">
      {HOME_ADVANTAGE_FACTORS.map((factor, i) => (
        <motion.div
          key={factor.name}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 + i * 0.04 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-lg" style={{ backgroundColor: factor.color }} />
            <span className="text-xs font-semibold text-[#c9d1d9]">{factor.name}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-lg font-bold" style={{ color: factor.color }}>{factor.value}</span>
            <span className="text-[9px] text-[#484f58]">/100</span>
          </div>
          <div className="h-1.5 bg-[#21262d] rounded-lg overflow-hidden">
            <motion.div className="h-full rounded-lg" style={{ backgroundColor: factor.color }} initial={{ opacity: 0 }} animate={{ opacity: 0.75, width: `${factor.value}%` }} transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }} />
          </div>
        </motion.div>
      ))}
    </div>
  ), []);

  const renderSeasonComparison = useCallback(() => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
          <BarChart3 className="h-3 w-3 text-sky-400" /> Season Home vs Away
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex gap-4 justify-center mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-[10px] text-[#8b949e]">Home Wins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-[10px] text-[#8b949e]">Away Wins</span>
          </div>
        </div>
        <div className="space-y-4">
          {HOME_AWAY_SEASONS.map((season, i) => {
            const homeTotal = season.homeWins + season.homeDraws + season.homeLoss;
            const awayTotal = season.awayWins + season.awayDraws + season.awayLoss;
            const homePct = homeTotal > 0 ? Math.round((season.homeWins / homeTotal) * 100) : 0;
            const awayPct = awayTotal > 0 ? Math.round((season.awayWins / awayTotal) * 100) : 0;
            return (
              <motion.div key={season.season} className="space-y-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.08 }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#c9d1d9]">{season.season}</span>
                  <span className="text-[10px] text-[#8b949e]">W{season.homeWins} D{season.homeDraws} L{season.homeLoss}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[9px] text-emerald-400 w-10">H {homePct}%</span>
                  <div className="flex-1 h-3 bg-[#21262d] rounded-lg overflow-hidden">
                    <motion.div className="h-full rounded-lg bg-emerald-500" initial={{ opacity: 0 }} animate={{ opacity: 0.7, width: `${homePct}%` }} transition={{ duration: 0.3, delay: 0.15 + i * 0.08 }} />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[9px] text-red-400 w-10">A {awayPct}%</span>
                  <div className="flex-1 h-3 bg-[#21262d] rounded-lg overflow-hidden">
                    <motion.div className="h-full rounded-lg bg-red-400" initial={{ opacity: 0 }} animate={{ opacity: 0.7, width: `${awayPct}%` }} transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  ), []);

  const renderHistoricalTrend = useCallback(() => (
    <Card className="bg-[#161b22] border border-[#30363d]">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
          <TrendingUp className="h-3 w-3 text-amber-400" /> Historical Home Advantage
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {historicalTrend.map((item, i) => (
          <motion.div key={item.season} className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.08 }}>
            <span className="text-xs text-[#c9d1d9] w-16">{item.season}</span>
            <div className="flex-1 h-3 bg-[#21262d] rounded-lg overflow-hidden">
              <motion.div className="h-full rounded-lg bg-amber-500" initial={{ opacity: 0 }} animate={{ opacity: 0.7, width: `${item.value}%` }} transition={{ duration: 0.3, delay: 0.15 + i * 0.08 }} />
            </div>
            <span className="text-xs font-bold text-amber-400 w-10 text-right">{item.value}%</span>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  ), [historicalTrend]);

  // ----- SVG: Home vs Away Win Rate Bars (Grouped) -----
  const renderHomeAwayBars = useCallback(() => {
    const chartLeft = 55;
    const chartRight = 280;
    const chartTop = 25;
    const chartBottom = 160;
    const groupW = (chartRight - chartLeft) / HOME_AWAY_SEASONS.length;
    const barW = 22;
    const maxWins = 20;

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <BarChart3 className="h-3 w-3 text-emerald-400" /> Home vs Away Win Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 200" className="w-full max-w-[320px]">
            {/* Grid lines */}
            {[0, 5, 10, 15, 20].map(val => {
              const y = chartBottom - (val / maxWins) * (chartBottom - chartTop);
              return (
                <g key={val}>
                  <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke="#334155" strokeWidth={0.5} opacity={0.2} strokeDasharray="4 3" />
                  <text x={chartLeft - 5} y={y + 4} textAnchor="end" className="fill-slate-500" fontSize={9}>{val}</text>
                </g>
              );
            })}
            {/* Bars */}
            {HOME_AWAY_SEASONS.map((season, i) => {
              const groupX = chartLeft + i * groupW + groupW / 2;
              const homeH = (season.homeWins / maxWins) * (chartBottom - chartTop);
              const awayH = (season.awayWins / maxWins) * (chartBottom - chartTop);
              return (
                <g key={season.season}>
                  <motion.rect x={groupX - barW - 2} y={chartBottom - homeH} width={barW} height={homeH} rx={3} fill="#10b981" initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} transition={{ delay: 0.2 + i * 0.1 }} />
                  <motion.rect x={groupX + 2} y={chartBottom - awayH} width={barW} height={awayH} rx={3} fill="#ef4444" initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} transition={{ delay: 0.3 + i * 0.1 }} />
                  <text x={groupX - barW / 2 - 2} y={chartBottom - homeH - 4} textAnchor="middle" fill="#10b981" fontSize={10} fontWeight={700}>{season.homeWins}</text>
                  <text x={groupX + barW / 2 + 2} y={chartBottom - awayH - 4} textAnchor="middle" fill="#ef4444" fontSize={10} fontWeight={700}>{season.awayWins}</text>
                  <text x={groupX} y={chartBottom + 14} textAnchor="middle" className="fill-slate-400" fontSize={9}>{season.season.slice(2)}</text>
                </g>
              );
            })}
            {/* Legend */}
            <rect x={100} y={182} width={10} height={8} rx={1} fill="#10b981" opacity={0.75} />
            <text x={114} y={190} className="fill-slate-400" fontSize={9}>Home</text>
            <rect x={155} y={182} width={10} height={8} rx={1} fill="#ef4444" opacity={0.75} />
            <text x={169} y={190} className="fill-slate-400" fontSize={9}>Away</text>
          </svg>
        </CardContent>
      </Card>
    );
  }, []);

  // ----- SVG: Home Advantage Factor Bars (6 horizontal) -----
  const renderFactorBars = useCallback(() => {
    const barH = 20;
    const gap = 10;
    const labelW = 120;
    const barMaxW = 135;
    const startY = 15;

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Target className="h-3 w-3 text-purple-400" /> Factor Contribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 200" className="w-full max-w-[320px]">
            {HOME_ADVANTAGE_FACTORS.map((factor, i) => {
              const y = startY + i * (barH + gap);
              const barW = (factor.value / 100) * barMaxW;
              return (
                <g key={factor.name}>
                  <text x={labelW - 5} y={y + barH / 2 + 4} textAnchor="end" className="fill-slate-300" fontSize={10} fontWeight={500}>{factor.name}</text>
                  <motion.rect x={labelW} y={y} width={barW} height={barH} rx={3} fill={factor.color} initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.2 + i * 0.06 }} />
                  <text x={labelW + barW + 5} y={y + barH / 2 + 4} fill={factor.color} fontSize={10} fontWeight={700}>{factor.value}</text>
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>
    );
  }, []);

  // ----- SVG: Attendance vs Results Scatter -----
  const renderScatterPlot = useCallback(() => {
    const chartLeft = 50;
    const chartRight = 280;
    const chartTop = 25;
    const chartBottom = 155;
    const chartW = chartRight - chartLeft;
    const chartH = chartBottom - chartTop;
    const minAtt = 34000;
    const maxAtt = 52000;
    const maxGoals = 6;
    const attRange = maxAtt - minAtt;

    const resultColors: Record<string, string> = { W: '#10b981', D: '#f59e0b', L: '#ef4444' };

    return (
      <Card className="bg-[#161b22] border border-[#30363d]">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-2">
            <Activity className="h-3 w-3 text-sky-400" /> Attendance vs Goals Scored
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3 flex justify-center">
          <svg viewBox="0 0 300 195" className="w-full max-w-[320px]">
            {/* Grid */}
            {[0, 1, 2, 3, 4, 5, 6].map(g => {
              const y = chartBottom - (g / maxGoals) * chartH;
              return (
                <g key={g}>
                  <line x1={chartLeft} y1={y} x2={chartRight} y2={y} stroke="#334155" strokeWidth={0.5} opacity={0.2} strokeDasharray="4 3" />
                  <text x={chartLeft - 5} y={y + 4} textAnchor="end" className="fill-slate-500" fontSize={9}>{g}</text>
                </g>
              );
            })}
            {/* Axes labels */}
            <text x={chartLeft - 5} y={chartBottom + 14} textAnchor="end" className="fill-slate-500" fontSize={8}>Attendance</text>
            <text x={chartRight + 5} y={chartTop + 4} textAnchor="start" className="fill-slate-500" fontSize={8}>Goals</text>
            {/* Scatter dots */}
            {SCATTER_DATA.map((match, i) => {
              const x = chartLeft + ((match.attendance - minAtt) / attRange) * chartW;
              const y = chartBottom - (match.goals / maxGoals) * chartH;
              return (
                <g key={i}>
                  <motion.circle cx={x} cy={y} r={6} fill={resultColors[match.result]} initial={{ opacity: 0 }} animate={{ opacity: 0.75 }} transition={{ delay: 0.2 + i * 0.05 }} />
                  <text x={x} y={y - 9} textAnchor="middle" fill={resultColors[match.result]} fontSize={8} fontWeight={600}>{match.result}</text>
                </g>
              );
            })}
            {/* Legend */}
            <circle cx={90} cy={178} r={4} fill="#10b981" opacity={0.75} />
            <text x={98} y={181} className="fill-slate-400" fontSize={9}>Win</text>
            <circle cx={140} cy={178} r={4} fill="#f59e0b" opacity={0.75} />
            <text x={148} y={181} className="fill-slate-400" fontSize={9}>Draw</text>
            <circle cx={190} cy={178} r={4} fill="#ef4444" opacity={0.75} />
            <text x={198} y={181} className="fill-slate-400" fontSize={9}>Loss</text>
          </svg>
        </CardContent>
      </Card>
    );
  }, []);

  // ============================================
  // Tab Content Renderers
  // ============================================

  const renderCrowdTab = useCallback(() => (
    <div className="space-y-4">
      {renderAtmosphereHeader()}
      {renderCategoryCards()}
      {renderMatchDaySelector()}
      {renderHexRadar()}
      {renderNoiseGauge()}
      {renderTrendChart()}
      {renderRecentRatings()}
    </div>
  ), [renderAtmosphereHeader, renderCategoryCards, renderMatchDaySelector, renderHexRadar, renderNoiseGauge, renderTrendChart, renderRecentRatings]);

  const renderFanCultureTab = useCallback(() => (
    <div className="space-y-4">
      {renderFanGroupCards()}
      {renderEngagementScore()}
      {renderFanDonut()}
      {renderChantLibrary()}
      {renderChantBars()}
      {renderTifoGallery()}
      {renderDemographicsBars()}
    </div>
  ), [renderFanGroupCards, renderEngagementScore, renderFanDonut, renderChantLibrary, renderChantBars, renderTifoGallery, renderDemographicsBars]);

  const renderStadiumEffectsTab = useCallback(() => (
    <div className="space-y-4">
      {renderWeatherCards()}
      {renderWeatherRadar()}
      {renderPitchConditions()}
      {renderCapacityCard()}
      {renderCapacityRing()}
      {renderMatchTiming()}
      {renderTimingBars()}
    </div>
  ), [renderWeatherCards, renderWeatherRadar, renderPitchConditions, renderCapacityCard, renderCapacityRing, renderMatchTiming, renderTimingBars]);

  const renderHomeAdvantageTab = useCallback(() => (
    <div className="space-y-4">
      {renderHomeWinCard()}
      {renderAdvantageFactors()}
      {renderSeasonComparison()}
      {renderHomeAwayBars()}
      {renderFactorBars()}
      {renderHistoricalTrend()}
      {renderScatterPlot()}
    </div>
  ), [renderHomeWinCard, renderAdvantageFactors, renderSeasonComparison, renderHomeAwayBars, renderFactorBars, renderHistoricalTrend, renderScatterPlot]);

  // ============================================
  // Main Render
  // ============================================
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] h-8 w-8 p-0" onClick={() => setScreen('dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#c9d1d9]">Stadium Atmosphere</h1>
              <p className="text-[10px] text-[#8b949e]">{teamName} - Match Day Experience</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[10px]">
            <Activity className="h-2.5 w-2.5 mr-1" /> Live
          </Badge>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#161b22] border border-[#30363d] w-full grid grid-cols-4 h-9 rounded-lg p-0.5">
            <TabsTrigger value="crowd" className="text-[10px] px-1 py-1.5 rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-[#8b949e]">
              <Volume2 className="h-3 w-3 mr-0.5" /> Crowd
            </TabsTrigger>
            <TabsTrigger value="culture" className="text-[10px] px-1 py-1.5 rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-[#8b949e]">
              <Music className="h-3 w-3 mr-0.5" /> Culture
            </TabsTrigger>
            <TabsTrigger value="effects" className="text-[10px] px-1 py-1.5 rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-[#8b949e]">
              <CloudRain className="h-3 w-3 mr-0.5" /> Effects
            </TabsTrigger>
            <TabsTrigger value="home" className="text-[10px] px-1 py-1.5 rounded-md data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=inactive]:text-[#8b949e]">
              <Shield className="h-3 w-3 mr-0.5" /> Home
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {activeTab === 'crowd' && (
              <TabsContent value="crowd" forceMount={true}>
                <motion.div key="crowd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {renderCrowdTab()}
                </motion.div>
              </TabsContent>
            )}
            {activeTab === 'culture' && (
              <TabsContent value="culture" forceMount={true}>
                <motion.div key="culture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {renderFanCultureTab()}
                </motion.div>
              </TabsContent>
            )}
            {activeTab === 'effects' && (
              <TabsContent value="effects" forceMount={true}>
                <motion.div key="effects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {renderStadiumEffectsTab()}
                </motion.div>
              </TabsContent>
            )}
            {activeTab === 'home' && (
              <TabsContent value="home" forceMount={true}>
                <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {renderHomeAdvantageTab()}
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
