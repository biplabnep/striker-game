'use client';

import { useGameStore } from '@/store/gameStore';
import { getClubById, getLeagueById, getSeasonMatchdays } from '@/lib/game/clubsData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, ArrowDown, Minus, ChevronUp, ChevronDown,
  Target, Shield, Swords, BarChart3, Activity, Crown,
  Star, Users, Crosshair
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Synthetic player name pools ─────────────────────────────────────────────
const FIRST_NAMES = [
  'Marcus', 'Lucas', 'Erik', 'Mateo', 'Youssef', 'Liam', 'Noah', 'Adrian',
  'Felix', 'Leo', 'Oscar', 'Rafael', 'Sergio', 'Andreas', 'Kevin', 'Jules',
  'Victor', 'Hugo', 'Theo', 'Alejandro', 'Julian', 'Ivan', 'Emil', 'Daniel',
  'Nicolas', 'Patrick', 'Roberto', 'Antonio', 'Fabian', 'Stefan', 'Pierre',
  'Carlos', 'Diego', 'Romain', 'Bastian', 'Maximilian', 'Tobias', 'Nils', 'Henrik',
];
const LAST_NAMES = [
  'Müller', 'Silva', 'Hernandez', 'Dubois', 'Rossi', 'Berg', 'Kim', 'Tanaka',
  'Petrov', 'Larsen', 'Costa', 'Fernandez', 'Jensen', 'Novak', 'Volkov',
  'Ibrahim', 'Park', 'Ali', 'Weber', 'Svensson', 'Torres', 'Mora', 'Blanc',
  'Schultz', 'Moreno', 'Andersen', 'Roux', 'Kowalski', 'Santos', 'Lindberg',
  'Garcia', 'Lopez', 'Martinez', 'Hoffmann', 'Eriksson', 'Bailey', 'Reid',
  'Morrison', 'Fletcher', 'Nguyen', 'Patel', 'Chen', 'Wagner', 'Schmidt',
];

// Deterministic name from clubId
function playerNameForClub(clubId: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < clubId.length; i++) hash = ((hash << 5) - hash + clubId.charCodeAt(i)) | 0;
  hash = Math.abs(hash + index * 31);
  const fn = FIRST_NAMES[hash % FIRST_NAMES.length];
  const ln = LAST_NAMES[(hash * 7 + index * 13) % LAST_NAMES.length];
  return `${fn} ${ln}`;
}

// ─── Type for tab ────────────────────────────────────────────────────────────
type TabKey = 'table' | 'scorers' | 'assists';

// ─── Tiny form result dot ────────────────────────────────────────────────────
function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = {
    W: 'bg-emerald-400',
    D: 'bg-amber-400',
    L: 'bg-red-400',
  };
  return <div className={`w-2 h-2 rounded-sm ${colors[result]}`} title={result} />;
}

// ─── Position change indicator ───────────────────────────────────────────────
function PositionChange({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === current) {
    return <span className="text-[#484f58] text-[9px]">—</span>;
  }
  const diff = previous - current;
  if (diff > 0) {
    return (
      <div className="flex items-center text-emerald-400">
        <ChevronUp className="w-3 h-3" />
        <span className="text-[9px] font-bold">{diff}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center text-red-400">
      <ChevronDown className="w-3 h-3" />
      <span className="text-[9px] font-bold">{Math.abs(diff)}</span>
    </div>
  );
}

// ─── Zone border color helper ────────────────────────────────────────────────
function zoneBorderClass(pos: number, totalTeams: number, isPlayer: boolean): string {
  if (isPlayer) return 'border-l-[3px] border-l-emerald-500 bg-emerald-500/5';
  if (pos <= 4) return 'border-l-[3px] border-l-emerald-500';
  if (pos <= 6) return 'border-l-[3px] border-l-amber-500';
  if (pos >= totalTeams - 2) return 'border-l-[3px] border-l-red-500';
  return 'border-l-[3px] border-l-transparent';
}

// ─── Position rank icon (crown/star) ─────────────────────────────────────────
function PositionRankIcon({ pos }: { pos: number }) {
  if (pos === 1) return <Crown className="w-3 h-3 text-yellow-400" />;
  if (pos <= 3) return <Star className="w-3 h-3 text-emerald-400" />;
  return null;
}

// ─── SVG Helper Functions ───────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegmentPath(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number): string {
  if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99;
  if (endAngle <= startAngle) return '';
  const os = polarToCartesian(cx, cy, outerR, startAngle);
  const oe = polarToCartesian(cx, cy, outerR, endAngle);
  const ie = polarToCartesian(cx, cy, innerR, endAngle);
  const is_ = polarToCartesian(cx, cy, innerR, startAngle);
  const la = endAngle - startAngle > 180 ? 1 : 0;
  return `M${os.x},${os.y} A${outerR},${outerR} 0 ${la} 1 ${oe.x},${oe.y} L${ie.x},${ie.y} A${innerR},${innerR} 0 ${la} 0 ${is_.x},${is_.y}z`;
}

function buildLinePathD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.reduce((acc, pt, i) => acc + (i === 0 ? `M${pt.x},${pt.y}` : `L${pt.x},${pt.y}`), '');
}

function buildAreaPathD(points: { x: number; y: number }[], baseY: number): string {
  if (points.length === 0) return '';
  const linePart = buildLinePathD(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${linePart} L${last.x},${baseY} L${first.x},${baseY}z`;
}

function arcPathD(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  if (endAngle <= startAngle) return '';
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const la = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M${s.x},${s.y} A${r},${r} 0 ${la} 1 ${e.x},${e.y}`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LeagueTable() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<TabKey>('table');
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  const leagueInfo = useMemo(() => {
    if (!gameState) return null;
    return getLeagueById(gameState.currentClub.league);
  }, [gameState]);

  // Derive form from recent results per club
  const clubForm = useMemo(() => {
    if (!gameState) return new Map<string, ('W' | 'D' | 'L')[]>();
    const formMap = new Map<string, ('W' | 'D' | 'L')[]>();

    const results = gameState.recentResults.slice(0, 5);
    for (const result of results) {
      const homeResult: 'W' | 'D' | 'L' =
        result.homeScore > result.awayScore ? 'W' : result.homeScore === result.awayScore ? 'D' : 'L';
      const awayResult: 'W' | 'D' | 'L' =
        result.awayScore > result.homeScore ? 'W' : result.homeScore === result.awayScore ? 'D' : 'L';

      const homeForm = formMap.get(result.homeClub.id) || [];
      homeForm.unshift(homeResult);
      formMap.set(result.homeClub.id, homeForm.slice(0, 5));

      const awayForm = formMap.get(result.awayClub.id) || [];
      awayForm.unshift(awayResult);
      formMap.set(result.awayClub.id, awayForm.slice(0, 5));
    }

    // Placeholder form for clubs not in recent results
    for (const entry of gameState.leagueTable) {
      if (!formMap.has(entry.clubId)) {
        if (entry.played === 0) {
          formMap.set(entry.clubId, []);
        } else {
          const winRate = entry.won / Math.max(1, entry.played);
          const form: ('W' | 'D' | 'L')[] = [];
          for (let i = 0; i < 5; i++) {
            const r = Math.random();
            if (r < winRate) form.push('W');
            else if (r < winRate + entry.drawn / Math.max(1, entry.played)) form.push('D');
            else form.push('L');
          }
          formMap.set(entry.clubId, form);
        }
      }
    }

    return formMap;
  }, [gameState]);

  // Previous positions (simulate from form changes)
  const previousPositions = useMemo(() => {
    if (!gameState) return new Map<string, number>();
    const posMap = new Map<string, number>();
    const sorted = [...gameState.leagueTable].sort((a, b) => {
      const ptsDiff = b.points - a.points;
      if (ptsDiff !== 0) return ptsDiff;
      return b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst);
    });
    for (let i = 0; i < sorted.length; i++) {
      const variation = Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : -1) : 0;
      posMap.set(sorted[i].clubId, Math.max(1, i + 1 + variation));
    }
    return posMap;
  }, [gameState]);

  // ─── Synthetic top scorers ─────────────────────────────────────────────────
  const topScorers = useMemo(() => {
    if (!gameState) return [];
    const totalTeams = gameState.leagueTable.length;
    const scorers: { rank: number; name: string; clubId: string; clubName: string; goals: number; assists: number }[] = [];

    for (let i = 0; i < totalTeams; i++) {
      const entry = gameState.leagueTable[i];
      const club = getClubById(entry.clubId);
      if (!entry.played) continue;

      // Top scorer gets ~35% of club goals, 2nd gets ~20%, 3rd gets ~12%
      const distribution = [0.35, 0.20, 0.12];
      for (let p = 0; p < distribution.length; p++) {
        const goals = Math.round(entry.goalsFor * distribution[p]);
        if (goals < 1) continue;
        const assists = Math.round(goals * (0.1 + Math.random() * 0.25));
        scorers.push({
          rank: 0,
          name: playerNameForClub(entry.clubId, p),
          clubId: entry.clubId,
          clubName: club?.shortName || entry.clubName,
          goals,
          assists,
        });
      }
    }

    // Insert player if they have goals
    const playerGoals = gameState.player.seasonStats.goals;
    const playerAssists = gameState.player.seasonStats.assists;
    if (playerGoals > 0) {
      scorers.push({
        rank: 0,
        name: gameState.player.name,
        clubId: gameState.currentClub.id,
        clubName: gameState.currentClub.shortName,
        goals: playerGoals,
        assists: playerAssists,
      });
    }

    return scorers
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, 10)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, [gameState]);

  // ─── Synthetic top assists ─────────────────────────────────────────────────
  const topAssists = useMemo(() => {
    if (!gameState) return [];
    const totalTeams = gameState.leagueTable.length;
    const assisters: { rank: number; name: string; clubId: string; clubName: string; goals: number; assists: number }[] = [];

    for (let i = 0; i < totalTeams; i++) {
      const entry = gameState.leagueTable[i];
      const club = getClubById(entry.clubId);
      if (!entry.played) continue;

      const distribution = [0.30, 0.18, 0.10];
      for (let p = 0; p < distribution.length; p++) {
        const assists = Math.round(entry.goalsFor * distribution[p]);
        if (assists < 1) continue;
        const goals = Math.round(assists * (0.05 + Math.random() * 0.2));
        assisters.push({
          rank: 0,
          name: playerNameForClub(entry.clubId, p + 10),
          clubId: entry.clubId,
          clubName: club?.shortName || entry.clubName,
          goals,
          assists,
        });
      }
    }

    const playerGoals = gameState.player.seasonStats.goals;
    const playerAssists = gameState.player.seasonStats.assists;
    if (playerAssists > 0) {
      assisters.push({
        rank: 0,
        name: gameState.player.name,
        clubId: gameState.currentClub.id,
        clubName: gameState.currentClub.shortName,
        goals: playerGoals,
        assists: playerAssists,
      });
    }

    return assisters
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
      .slice(0, 10)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, [gameState]);

  // ─── SVG Data Memos ─────────────────────────────────────────────────────
  const pointsBuckets = useMemo(() => {
    const table = gameState?.leagueTable ?? [];
    const bucketSize = 5;
    const maxPts = table.reduce((m, e) => Math.max(m, e.points), 0);
    const numBuckets = Math.max(1, Math.ceil((maxPts + bucketSize) / bucketSize));
    const buckets = table.reduce<number[]>((acc, e) => {
      const b = Math.min(Math.floor(e.points / bucketSize), numBuckets - 1);
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    }, new Array(numBuckets).fill(0) as number[]);
    const maxCount = buckets.reduce((m, c) => Math.max(m, c), 1);
    return { buckets, bucketSize, numBuckets, maxCount };
  }, [gameState]);

  const goalsScatterData = useMemo(() => {
    const table = gameState?.leagueTable ?? [];
    const playerClubId = gameState?.currentClub.id ?? '';
    const teams = table.map(e => ({
      clubId: e.clubId,
      clubName: e.clubName,
      gf: e.goalsFor,
      ga: e.goalsAgainst,
      isPlayer: e.clubId === playerClubId,
      gfPerGame: e.played > 0 ? e.goalsFor / e.played : 0,
      gaPerGame: e.played > 0 ? e.goalsAgainst / e.played : 0,
    }));
    const maxGF = teams.reduce((m, d) => Math.max(m, d.gf), 1);
    const maxGA = teams.reduce((m, d) => Math.max(m, d.ga), 1);
    const maxGFPG = teams.reduce((m, d) => Math.max(m, d.gfPerGame), 0.5);
    const maxGAPG = teams.reduce((m, d) => Math.max(m, d.gaPerGame), 0.5);
    return { teams, maxGF, maxGA, maxGFPG, maxGAPG };
  }, [gameState]);

  const aggregateWDL = useMemo(() => {
    const table = gameState?.leagueTable ?? [];
    return table.reduce((acc, e) => ({
      w: acc.w + e.won,
      d: acc.d + e.drawn,
      l: acc.l + e.lost,
      total: acc.total + e.played,
    }), { w: 0, d: 0, l: 0, total: 0 });
  }, [gameState]);

  const top5Trend = useMemo(() => {
    const table = gameState?.leagueTable ?? [];
    const sorted = [...table].sort((a, b) => b.points - a.points).slice(0, 5);
    const teamColors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];
    const teams = sorted.map((team, i) => {
      const pts = team.points;
      const weeklyData = Array.from({ length: 7 }, (_, w) =>
        Math.max(0, Math.round(pts * ((w + 1) / 7) + Math.sin(i * 2.3 + w * 1.1) * 3))
      );
      return { clubId: team.clubId, clubName: team.clubName, points: pts, weeklyData, color: teamColors[i] };
    });
    const maxWeeklyPts = teams.reduce((m, t) =>
      t.weeklyData.reduce((tm, v) => Math.max(tm, v), m), 1);
    const teamsWithPaths = teams.map(t => ({
      ...t,
      pathPoints: t.weeklyData.map((v, w) => ({
        x: 35 + w * (245 / 6),
        y: 140 - (v / maxWeeklyPts) * 120,
      })),
    }));
    return { teams: teamsWithPaths, maxWeeklyPts };
  }, [gameState]);

  const gdRangeData = useMemo(() => {
    const table = gameState?.leagueTable ?? [];
    const playerClubId = gameState?.currentClub.id ?? '';
    const totalTeams = table.length;
    const sorted = [...table].sort((a, b) => b.points - a.points);
    const gds = sorted.map(e => ({
      clubId: e.clubId,
      clubName: e.clubName,
      gd: e.goalsFor - e.goalsAgainst,
      isPlayer: e.clubId === playerClubId,
    }));
    const minGD = gds.reduce((m, e) => Math.min(m, e.gd), 0);
    const maxGD = gds.reduce((m, e) => Math.max(m, e.gd), 0);
    const playerGD = gds.find(e => e.isPlayer)?.gd ?? 0;
    const uclGD = (sorted[3]?.goalsFor ?? 0) - (sorted[3]?.goalsAgainst ?? 0);
    const uelGD = (sorted[5]?.goalsFor ?? 0) - (sorted[5]?.goalsAgainst ?? 0);
    const relGD = (sorted[totalTeams - 3]?.goalsFor ?? 0) - (sorted[totalTeams - 3]?.goalsAgainst ?? 0);
    const range = maxGD - minGD || 1;
    const gdToX = (gd: number) => 20 + ((gd - minGD) / range) * 160;
    return { gds, minGD, maxGD, playerGD, uclGD, uelGD, relGD, totalTeams, gdToX };
  }, [gameState]);

  const competitivenessScore = useMemo(() => {
    const table = gameState?.leagueTable ?? [];
    if (table.length < 2) return 50;
    const pts = table.map(e => e.points);
    const mean = pts.reduce((s, p) => s + p, 0) / pts.length;
    const variance = pts.reduce((s, p) => s + (p - mean) ** 2, 0) / pts.length;
    const stdDev = Math.sqrt(variance);
    return Math.min(100, Math.max(0, Math.round((stdDev / 30) * 100)));
  }, [gameState]);

  const seasonProgressData = useMemo(() => {
    if (!gameState) return { currentWeek: 0, totalMatchdays: 38 };
    const total = getSeasonMatchdays(gameState.currentClub.league);
    return { currentWeek: gameState.currentWeek, totalMatchdays: total };
  }, [gameState]);

  const formHeatmapData = useMemo(() => {
    const table = gameState?.leagueTable ?? [];
    const playerClubId = gameState?.currentClub.id ?? '';
    const sorted = [...table].sort((a, b) => b.points - a.points).slice(0, 5);
    return sorted.map(e => ({
      clubId: e.clubId,
      clubName: e.clubName,
      isPlayer: e.clubId === playerClubId,
      form: clubForm.get(e.clubId) || [],
    }));
  }, [gameState, clubForm]);

  const avgGoalsTrend = useMemo(() => {
    const table = gameState?.leagueTable ?? [];
    if (table.length === 0) return { data: [] as number[], maxVal: 1, points: [] as { x: number; y: number }[] };
    const totalPlayed = table.reduce((s, e) => s + e.played, 0);
    const totalGF = table.reduce((s, e) => s + e.goalsFor, 0);
    const baseAvg = totalPlayed > 0 ? totalGF / Math.max(1, totalPlayed / 2) : 1.5;
    const data = Array.from({ length: 7 }, (_, i) =>
      Math.max(0.5, +(baseAvg * (0.7 + (i / 6) * 0.6) + Math.sin(i * 1.5) * 0.3).toFixed(1))
    );
    const maxVal = data.reduce((m, v) => Math.max(m, v), 1);
    const points = data.map((v, i) => ({
      x: 20 + i * (260 / 6),
      y: 95 - (v / maxVal) * 75,
    }));
    return { data, maxVal, points };
  }, [gameState]);

  const positionVolatilityData = useMemo(() => {
    const table = gameState?.leagueTable ?? [];
    const playerClubId = gameState?.currentClub.id ?? '';
    const sorted = [...table].sort((a, b) => b.points - a.points);
    const teams = sorted.slice(0, 8).map((e, i) => {
      const currentPos = i + 1;
      const prevPos = previousPositions.get(e.clubId) ?? currentPos;
      return {
        clubId: e.clubId,
        clubName: e.clubName,
        volatility: Math.abs(currentPos - prevPos),
        currentPos,
        isPlayer: e.clubId === playerClubId,
      };
    });
    const maxVol = teams.reduce((m, t) => Math.max(m, t.volatility), 1);
    return { teams, maxVol };
  }, [gameState, previousPositions]);

  if (!gameState) return null;

  const { leagueTable, currentClub, currentSeason } = gameState;
  const totalTeams = leagueTable.length;
  const totalMatches = Math.max(0, ...leagueTable.map(e => e.played)) * totalTeams / 2;

  const getFormLabel = (clubId: string, played: number): { text: string; color: string } => {
    const form = clubForm.get(clubId) || [];
    if (form.length === 0 || played === 0) return { text: 'No matches', color: 'text-[#484f58]' };
    const pts = form.reduce((sum, r) => sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
    if (pts >= 12) return { text: 'Excellent', color: 'text-emerald-400' };
    if (pts >= 8) return { text: 'Good', color: 'text-emerald-300' };
    if (pts >= 5) return { text: 'Average', color: 'text-amber-400' };
    if (pts >= 2) return { text: 'Poor', color: 'text-red-300' };
    return { text: 'Awful', color: 'text-red-500' };
  };

  const maxPoints = Math.max(...leagueTable.map(e => e.points), 1);

  // SVG rendering consts (safe after guard since gameState is non-null)
  const donutSegments = (() => {
    const total = aggregateWDL.w + aggregateWDL.d + aggregateWDL.l;
    if (total === 0) return null;
    const wAngle = (aggregateWDL.w / total) * 360;
    const dAngle = (aggregateWDL.d / total) * 360;
    return { wAngle, dAngle, total };
  })();

  const seasonProgress = seasonProgressData.totalMatchdays > 0
    ? seasonProgressData.currentWeek / seasonProgressData.totalMatchdays
    : 0;

  // ─── Tab config ────────────────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'table', label: 'League Table', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: 'scorers', label: 'Top Scorers', icon: <Crosshair className="w-3.5 h-3.5" /> },
    { key: 'assists', label: 'Top Assists', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-[#161b22] border border-[#30363d] overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 bg-emerald-500" />

          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#c9d1d9] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                {leagueInfo?.name || 'League Table'}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Season badge */}
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5 font-semibold">
                Season {currentSeason}
              </Badge>
              {/* Week indicator */}
              <Badge variant="outline" className="border-[#30363d] text-[#8b949e] text-[10px] px-2 py-0.5">
                Week {gameState.currentWeek}/{getSeasonMatchdays(gameState.currentClub.league)}
              </Badge>
              {/* Total matches */}
              <Badge variant="outline" className="border-[#30363d] text-[#8b949e] text-[10px] px-2 py-0.5">
                {Math.round(totalMatches)} matches played
              </Badge>
            </div>
          </div>

          {/* ─── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex border-t border-[#30363d]">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'text-emerald-400'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50'
                }`}
              >
                {activeTab === tab.key && <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-emerald-500" />}
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Tab Content ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'table' && (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <LeagueTableTab
                leagueTable={leagueTable}
                currentClubId={currentClub.id}
                totalTeams={totalTeams}
                clubForm={clubForm}
                previousPositions={previousPositions}
                expandedClub={expandedClub}
                setExpandedClub={setExpandedClub}
                maxPoints={maxPoints}
                getFormLabel={getFormLabel}
              />
            </motion.div>
          )}

          {activeTab === 'scorers' && (
            <motion.div
              key="scorers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <StatsLeaderboard
                data={topScorers}
                column="goals"
                columnLabel="Goals"
                icon={<Crosshair className="w-4 h-4 text-emerald-400" />}
                title="Top Scorers"
                currentClubId={currentClub.id}
                playerName={gameState.player.name}
              />
            </motion.div>
          )}

          {activeTab === 'assists' && (
            <motion.div
              key="assists"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <StatsLeaderboard
                data={topAssists}
                column="assists"
                columnLabel="Assists"
                icon={<Users className="w-4 h-4 text-blue-400" />}
                title="Top Assists"
                currentClubId={currentClub.id}
                playerName={gameState.player.name}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Your Position Summary Card ──────────────────────────────────── */}
        {(() => {
          const playerPos = leagueTable.findIndex(e => e.clubId === currentClub.id) + 1;
          const playerEntry = leagueTable.find(e => e.clubId === currentClub.id);
          if (!playerEntry) return null;
          const indicator = getPositionIndicator(playerPos, totalTeams);
          const playerForm = clubForm.get(currentClub.id) || [];
          const formInfo = getFormLabel(currentClub.id, playerEntry.played);
          const gd = playerEntry.goalsFor - playerEntry.goalsAgainst;

          const pointsToUCL = playerPos > 4 ? (leagueTable[3]?.points ?? 0) - playerEntry.points + 1 : 0;
          const pointsFromRel = playerPos >= totalTeams - 2 ? playerEntry.points - (leagueTable[totalTeams - 3]?.points ?? 0) : 0;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
                <div className="h-1 bg-emerald-500" />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{currentClub.logo}</span>
                      <div>
                        <p className="font-bold text-sm text-[#c9d1d9]">{currentClub.name}</p>
                        <p className="text-xs text-[#8b949e] flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">
                            {playerPos}{playerPos === 1 ? 'st' : playerPos === 2 ? 'nd' : playerPos === 3 ? 'rd' : 'th'}
                          </span>
                          in the league
                          <span style={{ color: indicator.color }}>• {indicator.label || 'Mid-table'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-emerald-400">{playerEntry.points}</p>
                      <p className="text-[10px] text-[#8b949e]">points</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { value: playerEntry.played, label: 'Played', color: 'text-[#c9d1d9]' },
                      { value: playerEntry.won, label: 'Won', color: 'text-emerald-400' },
                      { value: playerEntry.drawn, label: 'Drawn', color: 'text-amber-400' },
                      { value: playerEntry.lost, label: 'Lost', color: 'text-red-400' },
                      { value: `${gd > 0 ? '+' : ''}${gd}`, label: 'GD', color: gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]' },
                    ].map((stat, i) => (
                      <div key={i}>
                        <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-[#8b949e]">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Form and Zone Info */}
                  <div className="mt-3 pt-3 border-t border-[#30363d] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">Recent Form</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {playerForm.length > 0 ? playerForm.map((r, i) => (
                            <FormDot key={i} result={r} />
                          )) : (
                            <span className="text-[10px] text-[#484f58]">No matches yet</span>
                          )}
                        </div>
                        <span className="text-[9px] text-[#484f58]">
                          {playerForm.join('')}
                        </span>
                        <span className={`text-[10px] font-bold ${formInfo.color}`}>{formInfo.text}</span>
                      </div>
                    </div>

                    {playerPos > 4 && pointsToUCL > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e] font-medium flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5 text-emerald-400" />
                          To UCL
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">{pointsToUCL} pts needed</span>
                      </div>
                    )}

                    {playerPos >= totalTeams - 2 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e] font-medium flex items-center gap-1">
                          <ArrowDown className="w-2.5 h-2.5 text-red-400" />
                          From Safety
                        </span>
                        <span className="text-[10px] text-red-400 font-bold">{pointsFromRel} pts clear</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e]">Win Rate</span>
                        <span className="text-[10px] text-[#c9d1d9] font-semibold">
                          {playerEntry.played > 0 ? Math.round((playerEntry.won / playerEntry.played) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e]">Goals/Game</span>
                        <span className="text-[10px] text-[#c9d1d9] font-semibold">
                          {playerEntry.played > 0 ? (playerEntry.goalsFor / playerEntry.played).toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

        {/* ─── League Analytics ───────────────────────────────────────────────── */}
        <div className="bg-[#161b22] border border-[#30363d] p-3">
          <p className="text-xs font-bold text-[#c9d1d9] flex items-center gap-2 mb-0.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            League Analytics
          </p>
          <p className="text-[10px] text-[#484f58]">Visual breakdown of season performance data</p>
        </div>

        {/* SVG 1: Points Distribution Histogram */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              Points Distribution
            </p>
            <svg viewBox="0 0 300 120" className="w-full" role="img" aria-label="Points distribution histogram">
              <line x1="30" y1="10" x2="30" y2="95" stroke="#30363d" strokeWidth="0.5" />
              <line x1="30" y1="95" x2="290" y2="95" stroke="#30363d" strokeWidth="0.5" />
              {pointsBuckets.buckets.map((count, i) => {
                const h = (count / pointsBuckets.maxCount) * 75;
                const bw = Math.max(2, (250 / pointsBuckets.numBuckets) - 3);
                const x = 33 + i * (250 / pointsBuckets.numBuckets);
                return <rect key={i} x={x} y={95 - h} width={bw} height={h} fill="#10b981" fillOpacity="0.8" rx="1" />;
              })}
              {pointsBuckets.buckets.map((_, i) => {
                const step = Math.max(1, Math.floor(pointsBuckets.numBuckets / 5));
                if (i % step !== 0 && i !== pointsBuckets.numBuckets - 1) return null;
                const x = 33 + i * (250 / pointsBuckets.numBuckets) + (250 / pointsBuckets.numBuckets) / 2;
                return <text key={i} x={x} y="110" textAnchor="middle" fill="#8b949e" fontSize="7">{i * pointsBuckets.bucketSize}</text>;
              })}
            </svg>
          </CardContent>
        </Card>

        {/* SVG 2: Goals Scored vs Conceded Scatter */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2 flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-400" />
              Goals Scored vs Conceded
            </p>
            <svg viewBox="0 0 300 180" className="w-full" role="img" aria-label="Goals scored versus conceded scatter plot">
              <line x1="35" y1="10" x2="35" y2="155" stroke="#30363d" strokeWidth="0.5" />
              <line x1="35" y1="155" x2="290" y2="155" stroke="#30363d" strokeWidth="0.5" />
              <text x="20" y="10" textAnchor="end" fill="#484f58" fontSize="6">GA</text>
              <text x="290" y="168" textAnchor="end" fill="#484f58" fontSize="6">GF</text>
              {goalsScatterData.teams.map((team, i) => {
                const x = 40 + (team.gf / goalsScatterData.maxGF) * 245;
                const y = 150 - (team.ga / goalsScatterData.maxGA) * 135;
                return <circle key={i} cx={x} cy={y} r={team.isPlayer ? 5 : 3} fill={team.isPlayer ? '#10b981' : '#8b949e'} fillOpacity={team.isPlayer ? 1 : 0.6} />;
              })}
              <text x="155" y="175" textAnchor="middle" fill="#10b981" fontSize="7">Your team highlighted</text>
            </svg>
          </CardContent>
        </Card>

        {/* SVG 3 + SVG 7: Donut & Gauge in 2-col grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* SVG 3: Win/Draw/Loss Donut */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">Win / Draw / Loss</p>
              <svg viewBox="0 0 140 140" className="w-full" role="img" aria-label="Aggregate win draw loss donut">
                {donutSegments ? (
                  <>
                    <path d={donutSegmentPath(70, 70, 38, 55, 0, donutSegments.wAngle)} fill="#10b981" />
                    <path d={donutSegmentPath(70, 70, 38, 55, donutSegments.wAngle, donutSegments.wAngle + donutSegments.dAngle)} fill="#f59e0b" />
                    <path d={donutSegmentPath(70, 70, 38, 55, donutSegments.wAngle + donutSegments.dAngle, 360)} fill="#ef4444" />
                    <text x="70" y="66" textAnchor="middle" fill="#c9d1d9" fontSize="14" fontWeight="bold">{donutSegments.total}</text>
                    <text x="70" y="80" textAnchor="middle" fill="#8b949e" fontSize="7">matches</text>
                  </>
                ) : (
                  <text x="70" y="75" textAnchor="middle" fill="#484f58" fontSize="10">No data</text>
                )}
                <g>
                  <circle cx="18" cy="120" r="4" fill="#10b981" />
                  <text x="26" y="123" fill="#8b949e" fontSize="7">{aggregateWDL.w}W</text>
                  <circle cx="60" cy="120" r="4" fill="#f59e0b" />
                  <text x="68" y="123" fill="#8b949e" fontSize="7">{aggregateWDL.d}D</text>
                  <circle cx="102" cy="120" r="4" fill="#ef4444" />
                  <text x="110" y="123" fill="#8b949e" fontSize="7">{aggregateWDL.l}L</text>
                </g>
              </svg>
            </CardContent>
          </Card>

          {/* SVG 7: League Competitiveness Gauge */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">Competitiveness</p>
              <svg viewBox="0 0 200 130" className="w-full" role="img" aria-label="League competitiveness gauge">
                <path d={arcPathD(100, 90, 60, 270, 450)} fill="none" stroke="#21262d" strokeWidth="10" strokeLinecap="round" />
                {competitivenessScore > 0 && (
                  <path d={arcPathD(100, 90, 60, 270, 270 + (competitivenessScore / 100) * 180)} fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round" />
                )}
                <text x="100" y="82" textAnchor="middle" fill="#c9d1d9" fontSize="22" fontWeight="bold">{competitivenessScore}</text>
                <text x="100" y="98" textAnchor="middle" fill="#8b949e" fontSize="7">of 100</text>
                <text x="30" y="115" textAnchor="middle" fill="#484f58" fontSize="6">Balanced</text>
                <text x="170" y="115" textAnchor="middle" fill="#484f58" fontSize="6">Dominant</text>
              </svg>
            </CardContent>
          </Card>
        </div>

        {/* SVG 8 + SVG 5: Season Ring & GD Range in 2-col grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* SVG 8: Season Progress Ring */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">Season Progress</p>
              <svg viewBox="0 0 140 140" className="w-full" role="img" aria-label="Season progress ring">
                <circle cx="70" cy="65" r="48" fill="none" stroke="#21262d" strokeWidth="8" />
                {seasonProgress > 0 && (
                  <path d={arcPathD(70, 65, 48, 0, seasonProgress * 360)} fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" />
                )}
                <text x="70" y="62" textAnchor="middle" fill="#c9d1d9" fontSize="18" fontWeight="bold">{Math.round(seasonProgress * 100)}%</text>
                <text x="70" y="76" textAnchor="middle" fill="#8b949e" fontSize="7">Wk {seasonProgressData.currentWeek}/{seasonProgressData.totalMatchdays}</text>
              </svg>
            </CardContent>
          </Card>

          {/* SVG 5: Goal Difference Range Bar */}
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2">GD Range</p>
              <svg viewBox="0 0 200 90" className="w-full" role="img" aria-label="Goal difference range bar">
                <text x="100" y="12" textAnchor="middle" fill="#8b949e" fontSize="7">{gdRangeData.minGD} to +{gdRangeData.maxGD}</text>
                <rect x="20" y="30" width="160" height="10" fill="#21262d" rx="3" />
                <line x1={gdRangeData.gdToX(gdRangeData.uclGD)} y1="25" x2={gdRangeData.gdToX(gdRangeData.uclGD)} y2="45" stroke="#10b981" strokeWidth="1.5" />
                <text x={gdRangeData.gdToX(gdRangeData.uclGD)} y="22" textAnchor="middle" fill="#10b981" fontSize="5">UCL</text>
                <line x1={gdRangeData.gdToX(gdRangeData.uelGD)} y1="25" x2={gdRangeData.gdToX(gdRangeData.uelGD)} y2="45" stroke="#3b82f6" strokeWidth="1.5" />
                <text x={gdRangeData.gdToX(gdRangeData.uelGD)} y="22" textAnchor="middle" fill="#3b82f6" fontSize="5">UEL</text>
                <line x1={gdRangeData.gdToX(gdRangeData.relGD)} y1="25" x2={gdRangeData.gdToX(gdRangeData.relGD)} y2="45" stroke="#ef4444" strokeWidth="1.5" />
                <text x={gdRangeData.gdToX(gdRangeData.relGD)} y="22" textAnchor="middle" fill="#ef4444" fontSize="5">REL</text>
                <circle cx={gdRangeData.gdToX(gdRangeData.playerGD)} cy="35" r="5" fill="#10b981" />
                <text x="100" y="60" textAnchor="middle" fill="#c9d1d9" fontSize="8" fontWeight="bold">Your GD: {gdRangeData.playerGD > 0 ? '+' : ''}{gdRangeData.playerGD}</text>
                <text x="100" y="75" textAnchor="middle" fill="#484f58" fontSize="6">UCL/UEL/REL zone markers</text>
              </svg>
            </CardContent>
          </Card>
        </div>

        {/* SVG 4: Top 5 Points Trend Line */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              Top 5 Points Trend
            </p>
            <svg viewBox="0 0 300 160" className="w-full" role="img" aria-label="Top 5 teams points trend line">
              <line x1="35" y1="10" x2="35" y2="145" stroke="#30363d" strokeWidth="0.5" />
              <line x1="35" y1="145" x2="280" y2="145" stroke="#30363d" strokeWidth="0.5" />
              {top5Trend.teams.map((team, i) => (
                <path key={i} d={buildLinePathD(team.pathPoints)} fill="none" stroke={team.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {top5Trend.teams.map((team, i) => {
                const last = team.pathPoints[team.pathPoints.length - 1];
                return (
                  <g key={`lbl-${i}`}>
                    <circle cx={last.x} cy={last.y} r="3" fill={team.color} />
                    <text x={last.x + 5} y={last.y + 3} fill={team.color} fontSize="6">{team.clubName.slice(0, 6)}</text>
                  </g>
                );
              })}
              {['GW1', 'GW3', 'GW5', 'GW7'].map((label, i) => (
                <text key={label} x={35 + i * 2 * (245 / 6)} y="158" textAnchor="middle" fill="#484f58" fontSize="6">{label}</text>
              ))}
            </svg>
          </CardContent>
        </Card>

        {/* SVG 6: Attack vs Defence Scatter */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2 flex items-center gap-1">
              <Swords className="w-3 h-3 text-emerald-400" />
              Attack vs Defence Per Game
            </p>
            <svg viewBox="0 0 300 180" className="w-full" role="img" aria-label="Attack versus defence per game scatter plot">
              <line x1="35" y1="10" x2="35" y2="155" stroke="#30363d" strokeWidth="0.5" />
              <line x1="35" y1="155" x2="290" y2="155" stroke="#30363d" strokeWidth="0.5" />
              <text x="20" y="10" textAnchor="end" fill="#484f58" fontSize="6">GA/G</text>
              <text x="290" y="168" textAnchor="end" fill="#484f58" fontSize="6">GF/G</text>
              {goalsScatterData.teams.map((team, i) => {
                const x = 40 + (team.gfPerGame / goalsScatterData.maxGFPG) * 245;
                const y = 150 - (team.gaPerGame / goalsScatterData.maxGAPG) * 135;
                return <circle key={i} cx={x} cy={y} r={team.isPlayer ? 5 : 3} fill={team.isPlayer ? '#10b981' : '#8b949e'} fillOpacity={team.isPlayer ? 1 : 0.6} />;
              })}
              <text x="155" y="175" textAnchor="middle" fill="#10b981" fontSize="7">Your team highlighted</text>
            </svg>
          </CardContent>
        </Card>

        {/* SVG 9: Form Heatmap */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              Form Heatmap (Top 5)
            </p>
            <svg viewBox="0 0 300 130" className="w-full" role="img" aria-label="Top 5 teams form heatmap">
              {['GW-5', 'GW-4', 'GW-3', 'GW-2', 'GW-1'].map((label, i) => (
                <text key={i} x={110 + i * 36} y="15" textAnchor="middle" fill="#8b949e" fontSize="7">{label}</text>
              ))}
              {formHeatmapData.map((team, row) => {
                const colors: Record<string, string> = { W: '#10b981', D: '#f59e0b', L: '#ef4444' };
                const y = 22 + row * 20;
                return (
                  <g key={team.clubId}>
                    <text x="5" y={y + 12} fill={team.isPlayer ? '#10b981' : '#8b949e'} fontSize="8" fontWeight={team.isPlayer ? 'bold' : 'normal'}>
                      {team.clubName.slice(0, 12)}
                    </text>
                    {team.form.map((result, col) => (
                      <rect key={col} x={110 + col * 36} y={y} width="32" height="16" fill={colors[result] || '#21262d'} fillOpacity="0.8" rx="2" />
                    ))}
                    {team.form.length === 0 && (
                      <text x={110} y={y + 12} fill="#484f58" fontSize="7">No matches</text>
                    )}
                  </g>
                );
              })}
              <g>
                <circle cx="40" cy="128" r="3" fill="#10b981" />
                <text x="46" y="131" fill="#8b949e" fontSize="6">W</text>
                <circle cx="65" cy="128" r="3" fill="#f59e0b" />
                <text x="71" y="131" fill="#8b949e" fontSize="6">D</text>
                <circle cx="90" cy="128" r="3" fill="#ef4444" />
                <text x="96" y="131" fill="#8b949e" fontSize="6">L</text>
              </g>
            </svg>
          </CardContent>
        </Card>

        {/* SVG 10: Avg Goals Per Game Trend */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              Avg Goals Per Game Trend
            </p>
            <svg viewBox="0 0 300 120" className="w-full" role="img" aria-label="Average goals per game trend area chart">
              <line x1="20" y1="10" x2="20" y2="95" stroke="#30363d" strokeWidth="0.5" />
              <line x1="20" y1="95" x2="280" y2="95" stroke="#30363d" strokeWidth="0.5" />
              {avgGoalsTrend.points.length > 0 && (
                <>
                  <path d={buildAreaPathD(avgGoalsTrend.points, 95)} fill="#10b981" fillOpacity="0.12" />
                  <path d={buildLinePathD(avgGoalsTrend.points)} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {avgGoalsTrend.points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="3" fill="#10b981" />
                      <text x={p.x} y={p.y - 6} textAnchor="middle" fill="#8b949e" fontSize="6">{avgGoalsTrend.data[i]}</text>
                    </g>
                  ))}
                </>
              )}
              {['W1', 'W3', 'W5', 'W7'].map((label, i) => (
                <text key={label} x={20 + i * 2 * (260 / 6)} y="112" textAnchor="middle" fill="#484f58" fontSize="6">{label}</text>
              ))}
            </svg>
          </CardContent>
        </Card>

        {/* SVG 11: Position Volatility Bars */}
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2 flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-emerald-400" />
              Position Volatility (Top 8)
            </p>
            <svg viewBox="0 0 300 180" className="w-full" role="img" aria-label="Position volatility horizontal bars">
              {positionVolatilityData.teams.map((team, i) => {
                const barW = Math.max(2, (team.volatility / positionVolatilityData.maxVol) * 180);
                const y = 12 + i * 20;
                return (
                  <g key={team.clubId}>
                    <text x="75" y={y + 10} textAnchor="end" fill={team.isPlayer ? '#10b981' : '#8b949e'} fontSize="7" fontWeight={team.isPlayer ? 'bold' : 'normal'}>
                      {team.clubName.slice(0, 10)}
                    </text>
                    <rect x="80" y={y} width={barW} height="14" fill={team.isPlayer ? '#10b981' : '#3b82f6'} fillOpacity={team.isPlayer ? 0.9 : 0.6} rx="2" />
                    <text x={85 + barW} y={y + 11} fill="#c9d1d9" fontSize="7">{team.volatility}</text>
                    <text x="270" y={y + 11} fill="#484f58" fontSize="6">P{team.currentPos}</text>
                  </g>
                );
              })}
              <text x="150" y="175" textAnchor="middle" fill="#484f58" fontSize="6">Position change magnitude</text>
            </svg>
          </CardContent>
        </Card>

        {/* ─── Best Attack / Best Defence ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2 flex items-center gap-1">
                <Swords className="w-3 h-3 text-emerald-400" />
                Best Attack
              </p>
              {(() => {
                const best = [...leagueTable].sort((a, b) => b.goalsFor - a.goalsFor)[0];
                const bestClub = getClubById(best.clubId);
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bestClub?.logo}</span>
                    <div>
                      <p className="text-xs font-semibold text-[#c9d1d9]">{bestClub?.shortName}</p>
                      <p className="text-lg font-black text-emerald-400">{best.goalsFor}</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-2 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                Best Defence
              </p>
              {(() => {
                const best = [...leagueTable].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
                const bestClub = getClubById(best.clubId);
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bestClub?.logo}</span>
                    <div>
                      <p className="text-xs font-semibold text-[#c9d1d9]">{bestClub?.shortName}</p>
                      <p className="text-lg font-black text-emerald-400">{best.goalsAgainst}</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── League Table Tab ────────────────────────────────────────────────────────
function LeagueTableTab({
  leagueTable,
  currentClubId,
  totalTeams,
  clubForm,
  previousPositions,
  expandedClub,
  setExpandedClub,
  maxPoints,
  getFormLabel,
}: {
  leagueTable: { clubId: string; clubName: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; points: number }[];
  currentClubId: string;
  totalTeams: number;
  clubForm: Map<string, ('W' | 'D' | 'L')[]>;
  previousPositions: Map<string, number>;
  expandedClub: string | null;
  setExpandedClub: (id: string | null) => void;
  maxPoints: number;
  getFormLabel: (clubId: string, played: number) => { text: string; color: string };
}) {
  return (
    <div>
      {/* Zone Legend */}
      <div className="flex items-center gap-4 text-[10px] px-1 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[#8b949e]">Champions League</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[#8b949e]">Europa League</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[#8b949e]">Relegation</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-[#161b22] rounded-t-lg border border-[#30363d] border-b-0">
        <div className="grid grid-cols-[1.5rem_1.75rem_1.2fr_3rem_3rem_3.5rem_3.5rem] gap-0.5 px-2.5 py-2 text-[10px] font-semibold text-[#484f58] uppercase tracking-widest items-center">
          <span className="text-center">↕</span>
          <span>#</span>
          <span>Club</span>
          <span className="text-center">P</span>
          <span className="text-center">GD</span>
          <span className="text-center">Pts</span>
          <span className="text-center">Form</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-[#161b22] rounded-b-lg border border-[#30363d] border-t-0 overflow-hidden">
        {leagueTable.map((entry, idx) => {
          const pos = idx + 1;
          const club = getClubById(entry.clubId);
          const isPlayer = entry.clubId === currentClubId;
          const gd = entry.goalsFor - entry.goalsAgainst;
          const form = clubForm.get(entry.clubId) || [];
          const formInfo = getFormLabel(entry.clubId, entry.played);
          const prevPos = previousPositions.get(entry.clubId);
          const isExpanded = expandedClub === entry.clubId;

          return (
            <motion.div
              key={entry.clubId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: idx * 0.02 }}
            >
              <div
                onClick={() => setExpandedClub(isExpanded ? null : entry.clubId)}
                className={`grid grid-cols-[1.5rem_1.75rem_1.2fr_3rem_3rem_3.5rem_3.5rem] gap-0.5 px-2.5 py-2 items-center text-sm transition-colors duration-150 cursor-pointer ${zoneBorderClass(pos, totalTeams, isPlayer)} ${
                  !isPlayer ? 'hover:bg-[#21262d]' : 'bg-emerald-500/5'
                } ${idx < leagueTable.length - 1 ? 'border-b border-[#30363d]/50' : ''}`}
              >
                {/* Position change */}
                <PositionChange current={pos} previous={prevPos} />

                {/* Position + rank icon */}
                <div className="flex items-center gap-0.5">
                  <PositionRankIcon pos={pos} />
                  <span className={`text-[11px] font-bold tabular-nums ${isPlayer ? 'text-emerald-400' : pos <= 4 ? 'text-emerald-300' : pos <= 6 ? 'text-amber-400' : pos >= totalTeams - 2 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                    {pos}
                  </span>
                </div>

                {/* Club Name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm flex-shrink-0">{club?.logo || '⚽'}</span>
                  <span className={`truncate text-xs font-medium ${isPlayer ? 'text-emerald-300' : 'text-[#c9d1d9]'}`}>
                    {club?.shortName || entry.clubName}
                  </span>
                  {isPlayer && (
                    <Badge className="text-[7px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold flex-shrink-0">
                      YOU
                    </Badge>
                  )}
                </div>

                {/* Played */}
                <span className="text-center text-[11px] text-[#8b949e]">{entry.played}</span>

                {/* Goal Difference */}
                <span className={`text-center text-[11px] font-medium ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                  {gd > 0 ? '+' : ''}{gd}
                </span>

                {/* Points */}
                <span className={`text-center text-[11px] font-bold ${isPlayer ? 'text-emerald-300' : 'text-white'}`}>
                  {entry.points}
                </span>

                {/* Form dots + string */}
                <div className="flex items-center justify-center gap-1">
                  {form.length > 0 ? (
                    <>
                      <div className="flex items-center gap-1">
                        {form.map((r, i) => (
                          <FormDot key={i} result={r} />
                        ))}
                      </div>
                      <span className="text-[8px] text-[#484f58] font-mono">{form.join('')}</span>
                    </>
                  ) : (
                    <span className="text-[9px] text-[#484f58]">—</span>
                  )}
                </div>
              </div>

              {/* Expanded Detail Row */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={`px-3 py-3 ${isPlayer ? 'bg-emerald-500/5' : 'bg-[#21262d]'} border-b border-[#30363d]`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{club?.logo}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#c9d1d9]">{entry.clubName}</p>
                          <p className="text-[10px] text-[#8b949e] flex items-center gap-1">
                            <span className={formInfo.color}>{formInfo.text} form</span>
                            <span>•</span>
                            <span>{form.reduce((sum, r) => sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0)} pts from last {form.length || 5}</span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {[
                          { value: entry.played, label: 'P', color: 'text-[#c9d1d9]' },
                          { value: entry.won, label: 'W', color: 'text-emerald-400' },
                          { value: entry.drawn, label: 'D', color: 'text-amber-400' },
                          { value: entry.lost, label: 'L', color: 'text-red-400' },
                          { value: entry.goalsFor, label: 'GF', color: 'text-[#c9d1d9]' },
                          { value: entry.goalsAgainst, label: 'GA', color: 'text-[#8b949e]' },
                          { value: `${gd > 0 ? '+' : ''}${gd}`, label: 'GD', color: gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-[#0d1117] rounded-md py-1.5 px-0.5">
                            <p className={`text-xs font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-[8px] text-[#484f58]">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Points progress bar */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-[#8b949e]">Points Progress</span>
                          <span className="text-[9px] text-[#8b949e] font-semibold">{entry.points} / {Math.round(maxPoints * 1.1)}</span>
                        </div>
                        <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isPlayer ? 'bg-emerald-500' : 'bg-slate-500'}`}
                            style={{ width: `${Math.min(100, (entry.points / Math.max(maxPoints * 1.1, 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="text-[#8b949e]">Win Rate</span>
                        <span className="text-[#c9d1d9] font-semibold">
                          {entry.played > 0 ? Math.round((entry.won / entry.played) * 100) : 0}%
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-[#8b949e]">Goals / Game</span>
                        <span className="text-[#c9d1d9] font-semibold">
                          {entry.played > 0 ? (entry.goalsFor / entry.played).toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats Leaderboard (Top Scorers / Top Assists) ──────────────────────────
function StatsLeaderboard({
  data,
  column,
  columnLabel,
  icon,
  title,
  currentClubId,
  playerName,
}: {
  data: { rank: number; name: string; clubId: string; clubName: string; goals: number; assists: number }[];
  column: 'goals' | 'assists';
  columnLabel: string;
  icon: React.ReactNode;
  title: string;
  currentClubId: string;
  playerName: string;
}) {
  const secondaryColumn = column === 'goals' ? 'assists' : 'goals';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[#30363d] flex items-center gap-2">
        {icon}
        <span className="text-sm font-bold text-[#c9d1d9]">{title}</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2rem_1fr_4rem_3rem] gap-0.5 px-3 py-2 text-[9px] text-[#8b949e] font-semibold uppercase tracking-wide items-center border-b border-[#30363d]">
        <span className="text-center">#</span>
        <span>Player</span>
        <span className="text-center">Club</span>
        <div className="flex gap-1 justify-center">
          <span className="text-center w-7">{column === 'goals' ? 'G' : 'A'}</span>
          <span className="text-center w-7">{column === 'goals' ? 'A' : 'G'}</span>
        </div>
      </div>

      {/* Rows */}
      {data.length === 0 ? (
        <div className="px-3 py-8 text-center">
          <p className="text-xs text-[#484f58]">No data yet</p>
          <p className="text-[10px] text-[#484f58] mt-1">Stats will appear as the season progresses</p>
        </div>
      ) : (
        data.map((entry, idx) => {
          const isPlayer = entry.name === playerName;
          return (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12, delay: idx * 0.03 }}
              className={`grid grid-cols-[2rem_1fr_4rem_3rem] gap-0.5 px-3 py-2.5 items-center text-sm transition-colors ${
                isPlayer
                  ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                  : 'border-l-2 border-l-transparent hover:bg-[#21262d]'
              } ${idx < data.length - 1 ? 'border-b border-[#30363d]/50' : ''}`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center">
                {entry.rank <= 3 ? (
                  <span className="text-xs font-black text-amber-400">{entry.rank}</span>
                ) : (
                  <span className="text-xs font-medium text-[#8b949e]">{entry.rank}</span>
                )}
              </div>

              {/* Player name */}
              <div className="min-w-0 flex items-center gap-1.5">
                <span className={`truncate text-xs font-medium ${isPlayer ? 'text-emerald-300' : 'text-[#c9d1d9]'}`}>
                  {entry.name}
                </span>
                {isPlayer && (
                  <Badge className="text-[7px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold flex-shrink-0">
                    YOU
                  </Badge>
                )}
              </div>

              {/* Club */}
              <span className="text-center text-[10px] text-[#8b949e] truncate">{entry.clubName}</span>

              {/* Goals + Assists */}
              <div className="flex gap-1 justify-center">
                <span className={`text-center text-[11px] font-bold w-7 ${
                  column === 'goals'
                    ? (entry.goals > 0 ? 'text-emerald-400' : 'text-[#484f58]')
                    : (entry.assists > 0 ? 'text-blue-400' : 'text-[#484f58]')
                }`}>
                  {column === 'goals' ? entry.goals : entry.assists}
                </span>
                <span className="text-center text-[11px] w-7 text-[#8b949e]">
                  {column === 'goals' ? entry.assists : entry.goals}
                </span>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// ─── Position indicator helper (used in summary card) ────────────────────────
function getPositionIndicator(pos: number, totalTeams: number) {
  if (pos <= 4) return { color: '#10b981', label: 'UCL' };
  if (pos <= 6) return { color: '#3b82f6', label: 'UEL' };
  if (pos >= totalTeams - 2) return { color: '#ef4444', label: 'REL' };
  return { color: '#94a3b8', label: '' };
}
