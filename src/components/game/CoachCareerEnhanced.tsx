'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

/* ============================================================
   Seeded Deterministic Helpers
   ============================================================ */

function seededRandom(seed: number): number {
  const val = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return val - Math.floor(val);
}

function nameHash(name: string): number {
  return name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function seededInt(seed: number, min: number, max: number): number {
  return Math.round(min + seededRandom(seed) * (max - min));
}

/* ============================================================
   SVG Geometry Helpers
   ============================================================ */

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegment(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number
): string {
  const span = endDeg - startDeg;
  if (span >= 359.5) {
    const os = polarToCartesian(cx, cy, outerR, 0);
    const ms = polarToCartesian(cx, cy, outerR, 180);
    const is2 = polarToCartesian(cx, cy, innerR, 0);
    const ms2 = polarToCartesian(cx, cy, innerR, 180);
    return [
      `M ${os.x.toFixed(1)} ${os.y.toFixed(1)}`,
      `A ${outerR} ${outerR} 1 1 ${ms.x.toFixed(1)} ${ms.y.toFixed(1)}`,
      `A ${outerR} ${outerR} 1 1 ${os.x.toFixed(1)} ${os.y.toFixed(1)}`,
      `M ${is2.x.toFixed(1)} ${is2.y.toFixed(1)}`,
      `A ${innerR} ${innerR} 1 0 ${ms2.x.toFixed(1)} ${ms2.y.toFixed(1)}`,
      `A ${innerR} ${innerR} 1 0 ${is2.x.toFixed(1)} ${is2.y.toFixed(1)}`,
      'Z',
    ].join(' ');
  }
  if (span <= 0.5) {
    return '';
  }
  const os = polarToCartesian(cx, cy, outerR, startDeg);
  const oe = polarToCartesian(cx, cy, outerR, endDeg);
  const ie = polarToCartesian(cx, cy, innerR, endDeg);
  const ist = polarToCartesian(cx, cy, innerR, startDeg);
  const large = span > 180 ? 1 : 0;
  return [
    `M ${os.x.toFixed(1)} ${os.y.toFixed(1)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x.toFixed(1)} ${oe.y.toFixed(1)}`,
    `L ${ie.x.toFixed(1)} ${ie.y.toFixed(1)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ist.x.toFixed(1)} ${ist.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

function radarPolygon(
  cx: number,
  cy: number,
  r: number,
  values: number[],
  max: number
): string {
  const n = values.length;
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const v = (values[i] ?? 0) / max;
    return `${(cx + v * r * Math.cos(angle)).toFixed(1)},${(cy + v * r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

function radarGridPolygons(
  cx: number,
  cy: number,
  r: number,
  sides: number,
  rings: number
): string[] {
  return Array.from({ length: rings }, (_, ring) => {
    const cr = (r * (ring + 1)) / rings;
    return Array.from({ length: sides }, (_, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      return `${(cx + cr * Math.cos(angle)).toFixed(1)},${(cy + cr * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');
  });
}

function ringDasharray(
  r: number,
  value: number,
  max: number
): string {
  const circumference = 2 * Math.PI * r;
  const gap = 10;
  const usable = circumference - gap;
  const dashLen = usable * Math.min(value / max, 1);
  return `${dashLen.toFixed(1)} ${circumference.toFixed(1)}`;
}

function semiArcFg(
  cx: number,
  cy: number,
  r: number,
  value: number,
  max: number
): string {
  const ratio = Math.min(value / max, 1);
  const endAngle = Math.PI + ratio * Math.PI;
  const sx = cx + r * Math.cos(Math.PI);
  const sy = cy + r * Math.sin(Math.PI);
  const ex = cx + r * Math.cos(endAngle);
  const ey = cy + r * Math.sin(endAngle);
  const large = ratio > 0.5 ? 1 : 0;
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

function semiArcBg(cx: number, cy: number, r: number): string {
  const sx = cx + r * Math.cos(Math.PI);
  const sy = cy + r * Math.sin(Math.PI);
  const ex = cx + r * Math.cos(0);
  const ey = cy + r * Math.sin(0);
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

function areaChartPaths(
  dataX: number[],
  dataY: number[],
  plotX: number,
  plotY: number,
  plotW: number,
  plotH: number,
  maxVal: number
): { area: string; line: string } {
  if (dataX.length === 0) return { area: '', line: '' };
  const safeMax = Math.max(maxVal, 1);
  const points = dataX.map((x, i) => {
    const px = plotX + (x / Math.max(dataX[dataX.length - 1], 1)) * plotW;
    const py = plotY + plotH - (dataY[i] / safeMax) * plotH;
    return { px, py };
  });
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`)
    .join(' ');
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].px.toFixed(1)} ${(plotY + plotH).toFixed(1)}` +
    ` L ${points[0].px.toFixed(1)} ${(plotY + plotH).toFixed(1)} Z`;
  return { area: areaPath, line: linePath };
}

/* ============================================================
   Types
   ============================================================ */

type TabId = 'overview' | 'tactics' | 'development' | 'legacy';

interface TabDef {
  key: TabId;
  label: string;
}

interface WDLRecord {
  w: number;
  d: number;
  l: number;
}

interface SegmentDef {
  label: string;
  value: number;
  color: string;
}

interface BarDef {
  label: string;
  value: number;
  max: number;
  color: string;
}

interface YouthProspect {
  name: string;
  age: number;
  position: string;
  overall: number;
  potential: number;
}

interface MilestoneDef {
  season: number;
  title: string;
  detail: string;
  achieved: boolean;
}

/* ============================================================
   Constants
   ============================================================ */

const TABS: TabDef[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'tactics', label: 'Tactics' },
  { key: 'development', label: 'Develop' },
  { key: 'legacy', label: 'Legacy' },
];

const TACTICAL_AXES = ['Attack', 'Defense', 'Press', 'Tempo', 'Width'];

const FORMATION_LIST = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2'];

const DEV_CATS = [
  'Technical',
  'Physical',
  'Tactical',
  'Mental',
  'Set Pieces',
];

const AGE_BUCKET_DEFS = [
  { label: 'Under-21', min: 16, max: 20 },
  { label: '21-25', min: 21, max: 25 },
  { label: '26-30', min: 26, max: 30 },
  { label: 'Over-30', min: 31, max: 38 },
];

const TROPHY_AXES = [
  'League',
  'Cup',
  'Super Cup',
  'Continental',
  'Intl',
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const AGE_COLORS = ['#FF5500', '#00E5FF', '#CCFF00', '#666666'];

const TACTICAL_STYLE_MAP: Record<string, string> = {
  attacking: 'Attacking',
  defensive: 'Defensive',
  'counter-attack': 'Counter-Attack',
  possession: 'Possession',
  balanced: 'Balanced',
};

const PRESSING_BANDS = [
  { min: 0, max: 30, label: 'Low' },
  { min: 30, max: 60, label: 'Medium' },
  { min: 60, max: 80, label: 'High' },
  { min: 80, max: 101, label: 'Intense' },
];

const FORM_BANDS = [
  { min: 8, max: 11, label: 'Excellent', color: '#CCFF00' },
  { min: 7, max: 8, label: 'Good', color: '#00E5FF' },
  { min: 5, max: 7, label: 'Average', color: '#999999' },
  { min: 3, max: 5, label: 'Poor', color: '#FF5500' },
  { min: 0, max: 3, label: 'Terrible', color: '#ff3333' },
];

/* ============================================================
   Main Component
   ============================================================ */

export default function CoachCareerEnhanced() {
  const [tab, setTab] = useState<TabId>('overview');
  const gameState = useGameStore((s) => s.gameState);

  /* ---- Null-safe extraction ---- */
  const playerName = gameState?.player.name ?? 'Unknown';
  const playerAge = gameState?.player.age ?? 20;
  const playerOverall = gameState?.player.overall ?? 65;
  const playerReputation = gameState?.player.reputation ?? 10;
  const playerForm = gameState?.player.form ?? 6.0;
  const currentClubName = gameState?.currentClub.name ?? 'No Club';
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const recentResults = gameState?.recentResults ?? [];
  const tacticalStyle = gameState?.currentClub.tacticalStyle ?? 'balanced';
  const currentFormation = gameState?.currentClub.formation ?? '4-3-3';
  const pressingValue = gameState?.currentClub.style.pressing ?? 50;
  const attackingValue = gameState?.currentClub.style.attacking ?? 50;
  const totalAppearances = gameState?.player.careerStats.totalAppearances ?? 0;
  const trophies = gameState?.player.careerStats.trophies ?? [];
  const seasonsPlayed = gameState?.player.careerStats.seasonsPlayed ?? 0;
  const youthTeams = gameState?.youthTeams ?? [];
  const trainingHistory = gameState?.trainingHistory ?? [];
  const clubReputation = gameState?.currentClub.reputation ?? 50;
  const squadQuality = gameState?.currentClub.quality ?? 50;
  const seasons = gameState?.seasons ?? [];

  /* ---- Seed ---- */
  const baseSeed = nameHash(playerName) + currentSeason * 7 + currentWeek;

  /* ============================================================
     Overview Data
     ============================================================ */

  const coachRating = Math.min(
    Math.round(
      playerOverall * 0.3 +
        playerReputation * 0.4 +
        seasonsPlayed * 2 +
        trophies.length * 5 +
        seededRandom(baseSeed) * 10
    ),
    100
  );

  const recentTen: Array<'W' | 'D' | 'L'> =
    recentResults.length > 0
      ? recentResults.slice(0, 10).map((r) => {
          const isHome = r.homeClub.id === gameState?.currentClub.id;
          const own = isHome ? r.homeScore : r.awayScore;
          const opp = isHome ? r.awayScore : r.homeScore;
          if (own > opp) return 'W';
          if (own < opp) return 'L';
          return 'D';
        })
      : Array.from({ length: 10 }, (_, i) => {
          const s = seededRandom(baseSeed + i * 13);
          if (s > 0.55) return 'W' as const;
          if (s > 0.25) return 'D' as const;
          return 'L' as const;
        });

  const wdlRecord: WDLRecord = recentTen.reduce<WDLRecord>(
    (acc, r) => {
      if (r === 'W') return { ...acc, w: acc.w + 1 };
      if (r === 'L') return { ...acc, l: acc.l + 1 };
      return { ...acc, d: acc.d + 1 };
    },
    { w: 0, d: 0, l: 0 }
  );

  const winRate =
    recentTen.length > 0
      ? Math.round((wdlRecord.w / recentTen.length) * 100)
      : 0;

  const formBand =
    FORM_BANDS.find((b) => playerForm >= b.min && playerForm < b.max) ??
    FORM_BANDS[FORM_BANDS.length - 1];

  const tacticalLabel = TACTICAL_STYLE_MAP[tacticalStyle] ?? 'Balanced';
  const yearsInRole = Math.max(seasonsPlayed, 1);

  /* ============================================================
     Tactics Data
     ============================================================ */

  const tacticalRadar = [
    Math.min(Math.round(attackingValue * 0.6 + seededRandom(baseSeed + 1) * 40), 100),
    Math.min(Math.round(100 - attackingValue * 0.5 + seededRandom(baseSeed + 2) * 30), 100),
    Math.min(Math.round(pressingValue * 0.7 + seededRandom(baseSeed + 3) * 30), 100),
    Math.min(Math.round(attackingValue * 0.5 + pressingValue * 0.3 + seededRandom(baseSeed + 4) * 20), 100),
    Math.min(Math.round(100 - pressingValue * 0.3 + seededRandom(baseSeed + 5) * 40), 100),
  ];

  const formationBars: BarDef[] = FORMATION_LIST.map((f, i) => ({
    label: f,
    value: Math.round(
      (f === currentFormation ? 30 : 10) +
        seededRandom(baseSeed + i * 17) * 50 +
        squadQuality * 0.2
    ),
    max: 100,
    color: '#FF5500',
  }));

  const pressingIntensity = Math.min(
    Math.round(pressingValue * 0.8 + seededRandom(baseSeed + 6) * 20),
    100
  );

  const pressingBand =
    PRESSING_BANDS.find((b) => pressingIntensity >= b.min && pressingIntensity < b.max) ??
    PRESSING_BANDS[PRESSING_BANDS.length - 1];

  const tempoLabel =
    attackingValue >= 70
      ? 'Fast'
      : attackingValue >= 40
        ? 'Moderate'
        : 'Slow';

  const widthLabel =
    tacticalRadar[4] >= 70
      ? 'Wide'
      : tacticalRadar[4] >= 40
        ? 'Balanced'
        : 'Narrow';

  /* ============================================================
     Development Data
     ============================================================ */

  const youthCount = youthTeams.reduce(
    (acc, t) => acc + t.players.length,
    0
  );

  const youthProgressY = MONTH_LABELS.map((_, i) =>
    Math.round(
      58 +
        youthCount * 0.4 +
        seededRandom(baseSeed + i * 11 + 100) * 22 +
        i * 2.5
    )
  );

  const devCatBars: BarDef[] = DEV_CATS.map((cat, i) => ({
    label: cat,
    value: Math.round(
      35 +
        trainingHistory.length * 0.6 +
        seededRandom(baseSeed + i * 23 + 200) * 45
    ),
    max: 100,
    color: '#CCFF00',
  }));

  const squadAges = Array.from({ length: 25 }, (_, i) =>
    seededInt(baseSeed + i * 7 + 300, 17, 36)
  );

  const ageSegments: SegmentDef[] = AGE_BUCKET_DEFS.map((seg, idx) => ({
    label: seg.label,
    value: squadAges.reduce(
      (acc, age) => acc + (age >= seg.min && age <= seg.max ? 1 : 0),
      0
    ),
    color: AGE_COLORS[idx] ?? '#666666',
  }));

  const allYouth: YouthProspect[] = youthTeams.reduce<YouthProspect[]>(
    (acc, team) => [
      ...acc,
      ...team.players.slice(0, 6).map((p) => ({
        name: p.name,
        age: p.age,
        position: p.position,
        overall: p.overall,
        potential: p.potential,
      })),
    ],
    []
  );

  const topYouth = allYouth
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 4);

  /* ============================================================
     Legacy Data
     ============================================================ */

  const trophyCount = trophies.length;
  const leagueTrophies = trophies.filter((t) =>
    t.name.toLowerCase().includes('league')
  ).length;
  const cupTrophies = trophies.filter((t) =>
    t.name.toLowerCase().includes('cup')
  ).length;

  const trophyRadar = [
    Math.min(Math.round(leagueTrophies * 25 + seededRandom(baseSeed + 50) * 30), 100),
    Math.min(Math.round(cupTrophies * 30 + seededRandom(baseSeed + 51) * 30), 100),
    Math.min(Math.round(trophyCount * 12 + seededRandom(baseSeed + 52) * 20), 100),
    Math.min(Math.round((gameState?.continentalQualified ? 40 : 0) + seededRandom(baseSeed + 53) * 25), 100),
    Math.min(Math.round((gameState?.internationalCareer.caps ?? 0) * 5 + seededRandom(baseSeed + 54) * 15), 100),
  ];

  const careerTrajectoryY = Array.from({ length: 8 }, (_, i) =>
    Math.round(
      30 +
        clubReputation * 0.3 +
        seededRandom(baseSeed + i * 19 + 400) * 40 +
        i * 4
    )
  );

  const legacyScore = Math.min(
    Math.round(
      trophyCount * 8 +
        playerReputation * 0.5 +
        seasonsPlayed * 3 +
        totalAppearances * 0.05 +
        seededRandom(baseSeed + 99) * 10
    ),
    100
  );

  const milestones: MilestoneDef[] = [
    {
      season: 1,
      title: 'Career Started',
      detail: `Joined ${currentClubName} as a player`,
      achieved: seasonsPlayed >= 1,
    },
    {
      season: Math.min(3, seasonsPlayed),
      title: 'First Trophy',
      detail: trophyCount > 0 ? `Won ${trophies[0]?.name ?? 'a trophy'}` : 'No trophies yet',
      achieved: trophyCount > 0,
    },
    {
      season: Math.min(5, seasonsPlayed),
      title: 'Club Legend',
      detail: `Recognized after ${Math.min(seasonsPlayed, 5)} seasons`,
      achieved: playerReputation >= 60,
    },
    {
      season: Math.min(8, seasonsPlayed),
      title: 'Hall of Fame',
      detail: `Career legacy score: ${legacyScore}`,
      achieved: legacyScore >= 75,
    },
  ];

  /* ---- Null guard ---- */
  if (!gameState) {
    return <></>;
  }

  /* ============================================================
     SVG Computations
     ============================================================ */

  /* SVG 1: Coach Rating Ring */
  const ratingDash = ringDasharray(52, coachRating, 100);

  /* SVG 2: W/D/L Donut */
  const wdlTotal = Math.max(wdlRecord.w + wdlRecord.d + wdlRecord.l, 1);
  const wdlSegments: Array<{
    start: number;
    end: number;
    color: string;
  }> = [];
  {
    const gap = 2;
    const usable = 360 - gap * 3;
    const wSpan = (wdlRecord.w / wdlTotal) * usable;
    const dSpan = (wdlRecord.d / wdlTotal) * usable;
    const lSpan = (wdlRecord.l / wdlTotal) * usable;
    const wStart = 0;
    const wEnd = wStart + wSpan;
    const dStart = wEnd + gap;
    const dEnd = dStart + dSpan;
    const lStart = dEnd + gap;
    const lEnd = lStart + lSpan;
    wdlSegments.push(
      { start: wStart, end: wEnd, color: '#CCFF00' },
      { start: dStart, end: dEnd, color: '#666666' },
      { start: lStart, end: lEnd, color: '#FF5500' }
    );
  }

  /* SVG 4: Tactical Radar */
  const tacRadarPts = radarPolygon(80, 80, 55, tacticalRadar, 100);
  const tacGrid = radarGridPolygons(80, 80, 55, 5, 4);

  /* SVG 6: Pressing Gauge */
  const pressFgPath = semiArcFg(100, 90, 60, pressingIntensity, 100);
  const pressBgPath = semiArcBg(100, 90, 60);

  /* SVG 7: Youth Area Chart */
  const youthX = MONTH_LABELS.map((_, i) => i);
  const youthChart = areaChartPaths(
    youthX,
    youthProgressY,
    40,
    10,
    240,
    90,
    100
  );

  /* SVG 9: Age Donut */
  const ageTotal = Math.max(
    ageSegments.reduce((s, seg) => s + seg.value, 0),
    1
  );
  const ageDonutSegs: Array<{
    start: number;
    end: number;
    color: string;
  }> = [];
  {
    const gap = 3;
    const usable = 360 - gap * 4;
    let cursor = 0;
    for (const seg of ageSegments) {
      const span = (seg.value / ageTotal) * usable;
      ageDonutSegs.push({
        start: cursor,
        end: cursor + span,
        color: seg.color,
      });
      cursor += span + gap;
    }
  }

  /* SVG 10: Trophy Radar */
  const trophRadarPts = radarPolygon(80, 80, 55, trophyRadar, 100);
  const trophGrid = radarGridPolygons(80, 80, 55, 5, 4);

  /* SVG 11: Career Trajectory */
  const careerX = Array.from({ length: 8 }, (_, i) => i);
  const careerChart = areaChartPaths(
    careerX,
    careerTrajectoryY,
    40,
    10,
    240,
    90,
    100
  );

  /* SVG 12: Legacy Ring */
  const legacyDash = ringDasharray(52, legacyScore, 100);

  /* ============================================================
     Render Helpers
     ============================================================ */

  const svgSectionHeader = (
    title: string,
    metric: string,
    color: string,
    iconPath: string
  ) => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{
            backgroundColor: `${color}30`,
            border: `1px solid ${color}50`,
          }}
        >
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={iconPath} />
          </svg>
        </div>
        <h3 className="text-xs font-bold text-text-bright">{title}</h3>
      </div>
      <span className="text-[9px] font-bold" style={{ color }}>
        {metric}
      </span>
    </div>
  );

  /* ============================================================
     Tab: Overview
     ============================================================ */

  const renderOverview = () => (
    <div className="space-y-3">
      {/* Coach Profile Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-electric-orange/20 border border-electric-orange/40 flex items-center justify-center">
            <span className="text-lg font-bold text-electric-orange font-grotesk">
              {playerName.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-text-bright">{playerName}</h2>
            <p className="text-[10px] text-text-mid">{currentClubName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-electric-orange/15 text-electric-orange font-medium">
                {tacticalLabel}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-neon-lime/15 text-neon-lime font-medium">
                {formBand.label} Form
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Rating', value: String(coachRating), color: 'text-electric-orange' },
          { label: 'Win Rate', value: `${winRate}%`, color: 'text-neon-lime' },
          { label: 'Matches', value: String(totalAppearances), color: 'text-cyan-accent' },
          { label: 'Trophies', value: String(trophyCount), color: 'text-electric-orange' },
          { label: 'Seasons', value: String(yearsInRole), color: 'text-neon-lime' },
          {
            label: 'Form',
            value: playerForm.toFixed(1),
            color: formBand.color === '#CCFF00' ? 'text-neon-lime' : formBand.color === '#00E5FF' ? 'text-cyan-accent' : 'text-electric-orange',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-2 border border-border-web3 rounded-lg p-3 text-center"
          >
            <p className={`text-base font-bold font-grotesk ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-[9px] text-text-dim mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* SVG 1: Coach Rating Ring */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Coach Rating',
          `OVR ${coachRating}`,
          '#FF5500',
          'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
        )}
        <svg
          viewBox="0 0 160 160"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background ring */}
          <circle
            cx="80"
            cy="80"
            r="52"
            fill="none"
            stroke="#222222"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="80"
            cy="80"
            r="52"
            fill="none"
            stroke="#FF5500"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={ratingDash}
            strokeDashoffset="-5"
            transform="rotate(-90 80 80)"
          />
          {/* Center text */}
          <text
            x="80"
            y="75"
            textAnchor="middle"
            fill="#e8e8e8"
            fontSize="28"
            fontWeight="bold"
            fontFamily="var(--font-space-grotesk), sans-serif"
          >
            {coachRating}
          </text>
          <text
            x="80"
            y="95"
            textAnchor="middle"
            fill="#666666"
            fontSize="10"
          >
            Overall
          </text>
          {/* Decorative tick marks */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
            const x1 = 80 + 46 * Math.cos(angle);
            const y1 = 80 + 46 * Math.sin(angle);
            const x2 = 80 + 43 * Math.cos(angle);
            const y2 = 80 + 43 * Math.sin(angle);
            return (
              <line
                key={`tick_${i}`}
                x1={x1.toFixed(1)}
                y1={y1.toFixed(1)}
                x2={x2.toFixed(1)}
                y2={y2.toFixed(1)}
                stroke="#333333"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </motion.div>

      {/* SVG 2: Win/Draw/Loss Donut */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Win / Draw / Loss',
          `${wdlRecord.w}W ${wdlRecord.d}D ${wdlRecord.l}L`,
          '#CCFF00',
          'M22 12h-4l-3 9L9 3l-3 9H2'
        )}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background ring */}
          <circle
            cx="100"
            cy="100"
            r="55"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="16"
          />
          {/* Donut segments */}
          {wdlSegments.map((seg, i) => (
            <path
              key={`wdl_${i}`}
              d={donutSegment(100, 100, 63, 47, seg.start, seg.end)}
              fill={seg.color}
              fillOpacity="0.85"
            />
          ))}
          {/* Center text */}
          <text
            x="100"
            y="93"
            textAnchor="middle"
            fill="#e8e8e8"
            fontSize="22"
            fontWeight="bold"
            fontFamily="var(--font-space-grotesk), sans-serif"
          >
            {recentTen.length}
          </text>
          <text
            x="100"
            y="110"
            textAnchor="middle"
            fill="#666666"
            fontSize="9"
          >
            Recent Matches
          </text>
          {/* Legend */}
          {[
            { label: 'Win', color: '#CCFF00', val: wdlRecord.w },
            { label: 'Draw', color: '#666666', val: wdlRecord.d },
            { label: 'Loss', color: '#FF5500', val: wdlRecord.l },
          ].map((item) => (
            <g key={`legend_${item.label}`}>
              <rect
                x={item.label === 'Win' ? 55 : item.label === 'Draw' ? 85 : 118}
                y="175"
                width="8"
                height="8"
                rx="2"
                fill={item.color}
              />
              <text
                x={item.label === 'Win' ? 67 : item.label === 'Draw' ? 97 : 130}
                y="183"
                fill="#999999"
                fontSize="9"
              >
                {item.label} {item.val}
              </text>
            </g>
          ))}
        </svg>
      </motion.div>

      {/* SVG 3: Season Results Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Season Results Timeline',
          `Last ${recentTen.length}`,
          '#00E5FF',
          'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z'
        )}
        <svg
          viewBox="0 0 320 100"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Timeline line */}
          <line
            x1="20"
            y1="40"
            x2="300"
            y2="40"
            stroke="#222222"
            strokeWidth="2"
          />
          {/* Result dots */}
          {recentTen.map((result, i) => {
            const x = 20 + (i * 280) / (recentTen.length - 1 || 1);
            const dotColor =
              result === 'W'
                ? '#CCFF00'
                : result === 'D'
                  ? '#666666'
                  : '#FF5500';
            return (
              <g key={`timeline_${i}`}>
                <circle
                  cx={x.toFixed(1)}
                  cy="40"
                  r="8"
                  fill={dotColor}
                  fillOpacity="0.2"
                />
                <circle
                  cx={x.toFixed(1)}
                  cy="40"
                  r="4"
                  fill={dotColor}
                />
                <text
                  x={x.toFixed(1)}
                  y="25"
                  textAnchor="middle"
                  fill={dotColor}
                  fontSize="9"
                  fontWeight="bold"
                >
                  {result}
                </text>
                <text
                  x={x.toFixed(1)}
                  y="62"
                  textAnchor="middle"
                  fill="#666666"
                  fontSize="8"
                >
                  GW{i + 1}
                </text>
              </g>
            );
          })}
          {/* Summary bar below */}
          {recentTen.length > 0 && (
            <g>
              <rect x="20" y="78" width="280" height="8" rx="2" fill="#1a1a1a" />
              <rect
                x="20"
                y="78"
                width={((wdlRecord.w / recentTen.length) * 280).toFixed(1)}
                height="8"
                rx="2"
                fill="#CCFF00"
                fillOpacity="0.6"
              />
              <rect
                x={(20 + (wdlRecord.w / recentTen.length) * 280).toFixed(1)}
                y="78"
                width={((wdlRecord.d / recentTen.length) * 280).toFixed(1)}
                height="8"
                fill="#666666"
                fillOpacity="0.4"
              />
            </g>
          )}
        </svg>
      </motion.div>

      {/* Manager Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        <h3 className="text-xs font-bold text-text-bright mb-3">
          Manager Summary
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Tactical Style', value: tacticalLabel },
            { label: 'Preferred Formation', value: currentFormation },
            { label: 'Pressing Level', value: pressingBand.label },
            { label: 'Tempo', value: tempoLabel },
            { label: 'Attacking Width', value: widthLabel },
            { label: 'Current Form', value: `${playerForm.toFixed(1)} / 10.0` },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-1.5 border-b border-border-web3 last:border-0"
            >
              <span className="text-[10px] text-text-dim">{row.label}</span>
              <span className="text-[10px] font-medium text-text-bright">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  /* ============================================================
     Tab: Tactics
     ============================================================ */

  const renderTactics = () => (
    <div className="space-y-3">
      {/* Tactical Identity Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        <h3 className="text-xs font-bold text-text-bright mb-3">
          Tactical Identity
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Formation', value: currentFormation, color: '#FF5500' },
            { label: 'Style', value: tacticalLabel, color: '#00E5FF' },
            { label: 'Pressing', value: pressingBand.label, color: '#CCFF00' },
            { label: 'Tempo', value: tempoLabel, color: '#FF5500' },
            { label: 'Width', value: widthLabel, color: '#00E5FF' },
            { label: 'Flexibility', value: `${Math.round(tacticalRadar.reduce((s, v) => s + v, 0) / 5)}`, color: '#CCFF00' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-surface-3 rounded-lg p-3"
            >
              <p className="text-[9px] text-text-dim">{item.label}</p>
              <p
                className="text-sm font-bold font-grotesk mt-0.5"
                style={{ color: item.color }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SVG 4: Tactical Flexibility Radar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Tactical Flexibility',
          `${Math.round(tacticalRadar.reduce((s, v) => s + v, 0) / 5)}/100`,
          '#00E5FF',
          'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
        )}
        <svg
          viewBox="0 0 160 160"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid polygons */}
          {tacGrid.map((pts, i) => (
            <polygon
              key={`tac_grid_${i}`}
              points={pts}
              fill="none"
              stroke="#222222"
              strokeWidth="1"
            />
          ))}
          {/* Axis lines */}
          {Array.from({ length: 5 }, (_, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = 80 + 55 * Math.cos(angle);
            const y = 80 + 55 * Math.sin(angle);
            return (
              <line
                key={`tac_axis_${i}`}
                x1="80"
                y1="80"
                x2={x.toFixed(1)}
                y2={y.toFixed(1)}
                stroke="#1a1a1a"
                strokeWidth="1"
              />
            );
          })}
          {/* Data polygon */}
          <polygon
            points={tacRadarPts}
            fill="#00E5FF"
            fillOpacity="0.15"
            stroke="#00E5FF"
            strokeWidth="2"
          />
          {/* Data points */}
          {tacticalRadar.map((val, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const r = (val / 100) * 55;
            const x = 80 + r * Math.cos(angle);
            const y = 80 + r * Math.sin(angle);
            return (
              <g key={`tac_pt_${i}`}>
                <circle
                  cx={x.toFixed(1)}
                  cy={y.toFixed(1)}
                  r="4"
                  fill="#00E5FF"
                  fillOpacity="0.3"
                />
                <circle
                  cx={x.toFixed(1)}
                  cy={y.toFixed(1)}
                  r="2"
                  fill="#00E5FF"
                />
              </g>
            );
          })}
          {/* Labels */}
          {TACTICAL_AXES.map((label, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const lx = 80 + 70 * Math.cos(angle);
            const ly = 80 + 70 * Math.sin(angle);
            return (
              <text
                key={`tac_lbl_${i}`}
                x={lx.toFixed(1)}
                y={ly.toFixed(1)}
                fill="#999999"
                fontSize="9"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </motion.div>

      {/* SVG 5: Formation Effectiveness Bars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Formation Effectiveness',
          `${currentFormation} Primary`,
          '#FF5500',
          'M4 6h16M4 12h16M4 18h16'
        )}
        <svg
          viewBox="0 0 320 160"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {formationBars.map((bar, i) => {
            const y = 10 + i * 38;
            const barW = (bar.value / bar.max) * 220;
            return (
              <g key={`form_bar_${i}`}>
                <text
                  x="0"
                  y={y + 10}
                  fill="#e8e8e8"
                  fontSize="10"
                  fontWeight="500"
                >
                  {bar.label}
                </text>
                <text
                  x="320"
                  y={y + 10}
                  fill="#666666"
                  fontSize="9"
                  textAnchor="end"
                >
                  {bar.value}%
                </text>
                {/* Background bar */}
                <rect
                  x="70"
                  y={y + 16}
                  width="220"
                  height="10"
                  rx="2"
                  fill="#1a1a1a"
                />
                {/* Value bar */}
                <rect
                  x="70"
                  y={y + 16}
                  width={barW.toFixed(1)}
                  height="10"
                  rx="2"
                  fill="#FF5500"
                  fillOpacity="0.75"
                />
                {/* Primary indicator */}
                {bar.label === currentFormation && (
                  <text
                    x={Math.max(70 + barW - 5, 78)}
                    y={y + 24}
                    fill="#000000"
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    PRIMARY
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* SVG 6: Pressing Intensity Gauge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Pressing Intensity',
          `${pressingIntensity}% - ${pressingBand.label}`,
          '#CCFF00',
          'M13 10V3L4 14h7v7l9-11h-7z'
        )}
        <svg
          viewBox="0 0 200 120"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background arc */}
          <path
            d={pressBgPath}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Foreground arc */}
          <path
            d={pressFgPath}
            fill="none"
            stroke="#CCFF00"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Center value */}
          <text
            x="100"
            y="85"
            textAnchor="middle"
            fill="#e8e8e8"
            fontSize="22"
            fontWeight="bold"
            fontFamily="var(--font-space-grotesk), sans-serif"
          >
            {pressingIntensity}
          </text>
          <text
            x="100"
            y="102"
            textAnchor="middle"
            fill="#666666"
            fontSize="9"
          >
            {pressingBand.label}
          </text>
          {/* Scale labels */}
          <text x="35" y="108" textAnchor="middle" fill="#666666" fontSize="8">
            Low
          </text>
          <text x="100" y="18" textAnchor="middle" fill="#666666" fontSize="8">
            Medium
          </text>
          <text x="165" y="108" textAnchor="middle" fill="#666666" fontSize="8">
            Intense
          </text>
          {/* Tick marks */}
          {Array.from({ length: 5 }, (_, i) => {
            const angle = Math.PI + (i / 4) * Math.PI;
            const x1 = 100 + 66 * Math.cos(angle);
            const y1 = 90 + 66 * Math.sin(angle);
            const x2 = 100 + 70 * Math.cos(angle);
            const y2 = 90 + 70 * Math.sin(angle);
            return (
              <line
                key={`press_tick_${i}`}
                x1={x1.toFixed(1)}
                y1={y1.toFixed(1)}
                x2={x2.toFixed(1)}
                y2={y2.toFixed(1)}
                stroke="#333333"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Tactical Philosophy Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        <h3 className="text-xs font-bold text-text-bright mb-3">
          Tactical Principles
        </h3>
        <div className="space-y-2">
          {[
            {
              title: 'Build-Up Play',
              desc: 'Patient ball retention from the back with progressive passing through midfield lines',
              level: Math.round(attackingValue * 0.6 + 20),
              color: '#FF5500',
            },
            {
              title: 'Defensive Shape',
              desc: 'Compact mid-block with organized pressing triggers and quick transition defense',
              level: Math.round(100 - attackingValue * 0.4 + 10),
              color: '#00E5FF',
            },
            {
              title: 'Attacking Movement',
              desc: 'Dynamic off-ball runs creating space and overloading key areas in the final third',
              level: Math.round(attackingValue * 0.5 + pressingValue * 0.3),
              color: '#CCFF00',
            },
            {
              title: 'Set Piece Strategy',
              desc: 'Structured routines for both attacking and defensive set pieces with designated roles',
              level: seededInt(baseSeed + 77, 40, 90),
              color: '#FF5500',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border-b border-border-web3 last:border-0 pb-2 last:pb-0"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-text-bright">
                  {item.title}
                </span>
                <span
                  className="text-[9px] font-bold font-grotesk"
                  style={{ color: item.color }}
                >
                  {item.level}
                </span>
              </div>
              <p className="text-[9px] text-text-dim leading-relaxed mb-1.5">
                {item.desc}
              </p>
              <div className="w-full h-1 bg-surface-3 rounded-sm">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${item.level}%`,
                    backgroundColor: item.color,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  /* ============================================================
     Tab: Development
     ============================================================ */

  const renderDevelopment = () => (
    <div className="space-y-3">
      {/* Youth Academy Overview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        <h3 className="text-xs font-bold text-text-bright mb-3">
          Youth Academy
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: 'Youth Players',
              value: String(youthCount),
              color: '#00E5FF',
            },
            {
              label: 'Training Sessions',
              value: String(trainingHistory.length),
              color: '#CCFF00',
            },
            {
              label: 'Avg Development',
              value: `${Math.round(devCatBars.reduce((s, b) => s + b.value, 0) / devCatBars.length)}%`,
              color: '#FF5500',
            },
            {
              label: 'Promoted',
              value: String(seededInt(baseSeed + 88, 0, youthCount)),
              color: '#00E5FF',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-surface-3 rounded-lg p-3 text-center"
            >
              <p
                className="text-base font-bold font-grotesk"
                style={{ color: item.color }}
              >
                {item.value}
              </p>
              <p className="text-[9px] text-text-dim mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Youth Prospects */}
      {topYouth.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="bg-surface-2 border border-border-web3 rounded-lg p-4"
        >
          <h3 className="text-xs font-bold text-text-bright mb-3">
            Top Youth Prospects
          </h3>
          <div className="space-y-2">
            {topYouth.map((prospect) => (
              <div
                key={prospect.name}
                className="flex items-center gap-3 p-2 bg-surface-3 rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-accent/15 border border-cyan-accent/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-cyan-accent font-grotesk">
                    {prospect.overall}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-text-bright truncate">
                    {prospect.name}
                  </p>
                  <p className="text-[9px] text-text-dim">
                    Age {prospect.age} · {prospect.position} · POT {prospect.potential}
                  </p>
                </div>
                <div className="w-16 h-1.5 bg-surface-1 rounded-sm">
                  <div
                    className="h-full rounded-sm bg-cyan-accent"
                    style={{
                      width: `${((prospect.overall / (prospect.potential || 80)) * 100).toFixed(0)}%`,
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* SVG 7: Youth Progress Area Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Youth OVR Growth',
          `+${youthProgressY.length > 0 ? Math.max(youthProgressY[youthProgressY.length - 1] - youthProgressY[0], 0) : 0} OVR`,
          '#00E5FF',
          'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
        )}
        <svg
          viewBox="0 0 320 130"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid lines */}
          {Array.from({ length: 5 }, (_, i) => {
            const y = 10 + i * 22.5;
            return (
              <line
                key={`youth_grid_${i}`}
                x1="40"
                y1={y.toFixed(1)}
                x2="280"
                y2={y.toFixed(1)}
                stroke="#1a1a1a"
                strokeWidth="1"
              />
            );
          })}
          {/* Area fill */}
          <path
            d={youthChart.area}
            fill="#00E5FF"
            fillOpacity="0.1"
          />
          {/* Line */}
          <path
            d={youthChart.line}
            fill="none"
            stroke="#00E5FF"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Data points */}
          {youthProgressY.map((val, i) => {
            const px = 40 + (i / Math.max(youthProgressY.length - 1, 1)) * 240;
            const py = 100 - (val / 100) * 90;
            return (
              <g key={`youth_pt_${i}`}>
                <circle
                  cx={px.toFixed(1)}
                  cy={py.toFixed(1)}
                  r="5"
                  fill="#00E5FF"
                  fillOpacity="0.2"
                />
                <circle
                  cx={px.toFixed(1)}
                  cy={py.toFixed(1)}
                  r="2.5"
                  fill="#00E5FF"
                />
                <text
                  x={px.toFixed(1)}
                  y={(py - 8).toFixed(1)}
                  textAnchor="middle"
                  fill="#999999"
                  fontSize="8"
                  fontWeight="500"
                >
                  {val}
                </text>
              </g>
            );
          })}
          {/* X-axis labels */}
          {MONTH_LABELS.map((m, i) => {
            const x = 40 + (i / Math.max(MONTH_LABELS.length - 1, 1)) * 240;
            return (
              <text
                key={`youth_x_${i}`}
                x={x.toFixed(1)}
                y="118"
                textAnchor="middle"
                fill="#666666"
                fontSize="8"
              >
                {m}
              </text>
            );
          })}
          {/* Y-axis labels */}
          {['100', '75', '50', '25', '0'].map((label, i) => {
            const y = 10 + i * 22.5;
            return (
              <text
                key={`youth_y_${i}`}
                x="35"
                y={(y + 3).toFixed(1)}
                textAnchor="end"
                fill="#666666"
                fontSize="7"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </motion.div>

      {/* SVG 8: Development Category Bars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Development Focus',
          `${Math.round(devCatBars.reduce((s, b) => s + b.value, 0) / devCatBars.length)}% Avg`,
          '#CCFF00',
          'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
        )}
        <svg
          viewBox="0 0 320 170"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {devCatBars.map((bar, i) => {
            const y = 5 + i * 33;
            const barW = (bar.value / bar.max) * 220;
            return (
              <g key={`dev_bar_${i}`}>
                <text
                  x="0"
                  y={y + 10}
                  fill="#e8e8e8"
                  fontSize="10"
                  fontWeight="500"
                >
                  {bar.label}
                </text>
                <text
                  x="320"
                  y={y + 10}
                  fill="#666666"
                  fontSize="9"
                  textAnchor="end"
                >
                  {bar.value}%
                </text>
                <rect
                  x="80"
                  y={y + 16}
                  width="220"
                  height="10"
                  rx="2"
                  fill="#1a1a1a"
                />
                <rect
                  x="80"
                  y={y + 16}
                  width={barW.toFixed(1)}
                  height="10"
                  rx="2"
                  fill="#CCFF00"
                  fillOpacity="0.7"
                />
                {/* Value marker */}
                {bar.value > 15 && (
                  <text
                    x={Math.max(80 + barW - 5, 90)}
                    y={y + 24}
                    fill="#000000"
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {bar.value}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </motion.div>

      {/* Training Methods */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        <h3 className="text-xs font-bold text-text-bright mb-3">
          Training Methods
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              name: 'Technical Drills',
              desc: 'Ball control, passing accuracy, first touch',
              intensity: seededInt(baseSeed + 101, 50, 95),
              color: '#CCFF00',
            },
            {
              name: 'Physical Conditioning',
              desc: 'Strength, stamina, speed, agility work',
              intensity: seededInt(baseSeed + 102, 40, 90),
              color: '#FF5500',
            },
            {
              name: 'Tactical Sessions',
              desc: 'Positioning, shape, set-piece routines',
              intensity: seededInt(baseSeed + 103, 45, 85),
              color: '#00E5FF',
            },
            {
              name: 'Match Simulation',
              desc: 'Small-sided games, 11v11 practice matches',
              intensity: seededInt(baseSeed + 104, 55, 95),
              color: '#CCFF00',
            },
          ].map((method) => (
            <div
              key={method.name}
              className="bg-surface-3 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-text-bright">
                  {method.name}
                </span>
                <span
                  className="text-[9px] font-bold font-grotesk"
                  style={{ color: method.color }}
                >
                  {method.intensity}%
                </span>
              </div>
              <p className="text-[8px] text-text-dim mb-2">{method.desc}</p>
              <div className="w-full h-1 bg-surface-1 rounded-sm">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${method.intensity}%`,
                    backgroundColor: method.color,
                    opacity: 0.6,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SVG 9: Squad Age Distribution Donut */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.24 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Squad Age Distribution',
          `${squadAges.length} Players`,
          '#FF5500',
          'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z'
        )}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background ring */}
          <circle
            cx="100"
            cy="100"
            r="55"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="18"
          />
          {/* Age segments */}
          {ageDonutSegs.map((seg, i) => (
            <path
              key={`age_seg_${i}`}
              d={donutSegment(100, 100, 64, 46, seg.start, seg.end)}
              fill={seg.color}
              fillOpacity="0.8"
            />
          ))}
          {/* Center */}
          <text
            x="100"
            y="93"
            textAnchor="middle"
            fill="#e8e8e8"
            fontSize="20"
            fontWeight="bold"
            fontFamily="var(--font-space-grotesk), sans-serif"
          >
            {squadAges.length}
          </text>
          <text
            x="100"
            y="110"
            textAnchor="middle"
            fill="#666666"
            fontSize="9"
          >
            Total Players
          </text>
          {/* Legend */}
          {ageSegments.map((seg, i) => (
            <g key={`age_leg_${i}`}>
              <rect
                x={30 + i * 40}
                y="180"
                width="8"
                height="8"
                rx="2"
                fill={seg.color}
              />
              <text
                x={41 + i * 40}
                y="188"
                fill="#999999"
                fontSize="8"
              >
                {seg.label} ({seg.value})
              </text>
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  );

  /* ============================================================
     Tab: Legacy
     ============================================================ */

  const renderLegacy = () => (
    <div className="space-y-3">
      {/* Career Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        <h3 className="text-xs font-bold text-text-bright mb-3">
          Career Summary
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Trophies', value: String(trophyCount), color: '#FF5500' },
            { label: 'Seasons', value: String(seasonsPlayed), color: '#CCFF00' },
            { label: 'Matches', value: String(totalAppearances), color: '#00E5FF' },
            { label: 'Reputation', value: String(playerReputation), color: '#FF5500' },
            { label: 'Legacy', value: String(legacyScore), color: '#00E5FF' },
            {
              label: 'League Pos',
              value: seasons.length > 0
                ? `#${seasons[seasons.length - 1]?.leaguePosition ?? '-'}`
                : '-',
              color: '#CCFF00',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-3 rounded-lg p-3 text-center"
            >
              <p
                className="text-base font-bold font-grotesk"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="text-[9px] text-text-dim mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SVG 10: Trophy Cabinet Radar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Trophy Cabinet',
          `${trophyCount} Total`,
          '#FF5500',
          'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
        )}
        <svg
          viewBox="0 0 160 160"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid */}
          {trophGrid.map((pts, i) => (
            <polygon
              key={`troph_grid_${i}`}
              points={pts}
              fill="none"
              stroke="#222222"
              strokeWidth="1"
            />
          ))}
          {/* Axes */}
          {Array.from({ length: 5 }, (_, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = 80 + 55 * Math.cos(angle);
            const y = 80 + 55 * Math.sin(angle);
            return (
              <line
                key={`troph_axis_${i}`}
                x1="80"
                y1="80"
                x2={x.toFixed(1)}
                y2={y.toFixed(1)}
                stroke="#1a1a1a"
                strokeWidth="1"
              />
            );
          })}
          {/* Data */}
          <polygon
            points={trophRadarPts}
            fill="#FF5500"
            fillOpacity="0.15"
            stroke="#FF5500"
            strokeWidth="2"
          />
          {trophyRadar.map((val, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const r = (val / 100) * 55;
            const x = 80 + r * Math.cos(angle);
            const y = 80 + r * Math.sin(angle);
            return (
              <g key={`troph_pt_${i}`}>
                <circle
                  cx={x.toFixed(1)}
                  cy={y.toFixed(1)}
                  r="4"
                  fill="#FF5500"
                  fillOpacity="0.3"
                />
                <circle
                  cx={x.toFixed(1)}
                  cy={y.toFixed(1)}
                  r="2"
                  fill="#FF5500"
                />
              </g>
            );
          })}
          {/* Labels */}
          {TROPHY_AXES.map((label, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const lx = 80 + 70 * Math.cos(angle);
            const ly = 80 + 70 * Math.sin(angle);
            return (
              <text
                key={`troph_lbl_${i}`}
                x={lx.toFixed(1)}
                y={ly.toFixed(1)}
                fill="#999999"
                fontSize="9"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </motion.div>

      {/* Trophies List */}
      {trophies.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.13 }}
          className="bg-surface-2 border border-border-web3 rounded-lg p-4"
        >
          <h3 className="text-xs font-bold text-text-bright mb-3">
            Trophy Collection
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {trophies.slice(0, 8).map((trophy, i) => (
              <div
                key={`trophy_${i}`}
                className="flex items-center gap-2 p-2 bg-surface-3 rounded-lg"
              >
                <div className="w-6 h-6 rounded-md bg-electric-orange/15 border border-electric-orange/30 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-electric-orange"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M5 3h14l-1 8H6L5 3zm0 0l-2 2m16-2l2 2M7 11v6a2 2 0 002 2h6a2 2 0 002-2v-6M9 21h6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-text-bright truncate">
                    {trophy.name}
                  </p>
                  <p className="text-[9px] text-text-dim">
                    Season {trophy.season}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* SVG 11: Career Trajectory Line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Career Trajectory',
          `${seasonsPlayed} Seasons Tracked`,
          '#CCFF00',
          'M3 17l6-6 4 4 8-8'
        )}
        <svg
          viewBox="0 0 320 130"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid */}
          {Array.from({ length: 5 }, (_, i) => {
            const y = 10 + i * 22.5;
            return (
              <line
                key={`career_grid_${i}`}
                x1="40"
                y1={y.toFixed(1)}
                x2="280"
                y2={y.toFixed(1)}
                stroke="#1a1a1a"
                strokeWidth="1"
              />
            );
          })}
          {/* Area under line */}
          <path
            d={careerChart.area}
            fill="#CCFF00"
            fillOpacity="0.08"
          />
          {/* Line */}
          <path
            d={careerChart.line}
            fill="none"
            stroke="#CCFF00"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Data points */}
          {careerTrajectoryY.map((val, i) => {
            const px = 40 + (i / Math.max(careerTrajectoryY.length - 1, 1)) * 240;
            const py = 100 - (val / 100) * 90;
            return (
              <g key={`career_pt_${i}`}>
                <circle
                  cx={px.toFixed(1)}
                  cy={py.toFixed(1)}
                  r="5"
                  fill="#CCFF00"
                  fillOpacity="0.2"
                />
                <circle
                  cx={px.toFixed(1)}
                  cy={py.toFixed(1)}
                  r="2.5"
                  fill="#CCFF00"
                />
                <text
                  x={px.toFixed(1)}
                  y={(py - 8).toFixed(1)}
                  textAnchor="middle"
                  fill="#999999"
                  fontSize="7"
                  fontWeight="500"
                >
                  {val}
                </text>
              </g>
            );
          })}
          {/* X-axis labels */}
          {Array.from({ length: 8 }, (_, i) => {
            const x = 40 + (i / 7) * 240;
            return (
              <text
                key={`career_x_${i}`}
                x={x.toFixed(1)}
                y="118"
                textAnchor="middle"
                fill="#666666"
                fontSize="8"
              >
                S{i + 1}
              </text>
            );
          })}
          {/* Y-axis labels */}
          {['100', '75', '50', '25', '0'].map((label, i) => {
            const y = 10 + i * 22.5;
            return (
              <text
                key={`career_y_${i}`}
                x="35"
                y={(y + 3).toFixed(1)}
                textAnchor="end"
                fill="#666666"
                fontSize="7"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </motion.div>

      {/* Key Milestones */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        <h3 className="text-xs font-bold text-text-bright mb-3">
          Key Milestones
        </h3>
        <div className="space-y-2">
          {milestones.map((ms) => (
            <div
              key={ms.title}
              className="flex items-start gap-3 p-2 bg-surface-3 rounded-lg"
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center mt-0.5"
                style={{
                  backgroundColor: ms.achieved
                    ? 'rgba(204, 255, 0, 0.15)'
                    : 'rgba(102, 102, 102, 0.15)',
                  border: `1px solid ${ms.achieved ? 'rgba(204, 255, 0, 0.4)' : '#333333'}`,
                }}
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={ms.achieved ? '#CCFF00' : '#666666'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ms.achieved ? (
                    <path d="M20 6L9 17l-5-5" />
                  ) : (
                    <circle cx="12" cy="12" r="10" />
                  )}
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-text-bright">
                    {ms.title}
                  </span>
                  <span className="text-[8px] text-text-dim">
                    Season {ms.season}
                  </span>
                </div>
                <p className="text-[9px] text-text-dim mt-0.5">{ms.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SVG 12: Manager Legacy Score Ring */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.24 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        {svgSectionHeader(
          'Manager Legacy Score',
          `${legacyScore}/100`,
          '#00E5FF',
          'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        )}
        <svg
          viewBox="0 0 160 160"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background ring */}
          <circle
            cx="80"
            cy="80"
            r="52"
            fill="none"
            stroke="#222222"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="80"
            cy="80"
            r="52"
            fill="none"
            stroke="#00E5FF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={legacyDash}
            strokeDashoffset="-5"
            transform="rotate(-90 80 80)"
          />
          {/* Center text */}
          <text
            x="80"
            y="75"
            textAnchor="middle"
            fill="#e8e8e8"
            fontSize="28"
            fontWeight="bold"
            fontFamily="var(--font-space-grotesk), sans-serif"
          >
            {legacyScore}
          </text>
          <text
            x="80"
            y="95"
            textAnchor="middle"
            fill="#666666"
            fontSize="9"
          >
            Legacy Score
          </text>
          {/* Tick marks */}
          {Array.from({ length: 20 }, (_, i) => {
            const angle = (Math.PI * 2 * i) / 20 - Math.PI / 2;
            const isMajor = i % 5 === 0;
            const r1 = isMajor ? 43 : 45;
            const r2 = 48;
            const x1 = 80 + r1 * Math.cos(angle);
            const y1 = 80 + r1 * Math.sin(angle);
            const x2 = 80 + r2 * Math.cos(angle);
            const y2 = 80 + r2 * Math.sin(angle);
            return (
              <line
                key={`legacy_tick_${i}`}
                x1={x1.toFixed(1)}
                y1={y1.toFixed(1)}
                x2={x2.toFixed(1)}
                y2={y2.toFixed(1)}
                stroke={isMajor ? '#444444' : '#2a2a2a'}
                strokeWidth={isMajor ? '2' : '1'}
              />
            );
          })}
          {/* Status label */}
          <text
            x="80"
            y="120"
            textAnchor="middle"
            fill={legacyScore >= 75 ? '#CCFF00' : legacyScore >= 50 ? '#00E5FF' : '#999999'}
            fontSize="9"
            fontWeight="bold"
          >
            {legacyScore >= 90
              ? 'Legendary'
              : legacyScore >= 75
                ? 'Excellent'
                : legacyScore >= 50
                  ? 'Established'
                  : legacyScore >= 25
                    ? 'Developing'
                    : 'Starting Out'}
          </text>
        </svg>
      </motion.div>

      {/* Career Records */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="bg-surface-2 border border-border-web3 rounded-lg p-4"
      >
        <h3 className="text-xs font-bold text-text-bright mb-3">
          Career Records
        </h3>
        <div className="space-y-2">
          {[
            {
              label: 'Highest Rating',
              value: `${Math.max(Math.round(playerOverall + seededRandom(baseSeed + 200) * 10 - 5), playerOverall)}`,
              color: '#FF5500',
            },
            {
              label: 'Best Season',
              value: `Season ${seededInt(baseSeed + 201, 1, Math.max(seasonsPlayed, 2))}`,
              color: '#CCFF00',
            },
            {
              label: 'Longest Win Streak',
              value: `${seededInt(baseSeed + 202, 3, 12)} matches`,
              color: '#00E5FF',
            },
            {
              label: 'Most Goals Season',
              value: `${seededInt(baseSeed + 203, 5, 30)} goals`,
              color: '#FF5500',
            },
            {
              label: 'Clean Sheets',
              value: `${seededInt(baseSeed + 204, 2, 20)} total`,
              color: '#CCFF00',
            },
          ].map((record) => (
            <div
              key={record.label}
              className="flex items-center justify-between py-1.5 border-b border-border-web3 last:border-0"
            >
              <span className="text-[10px] text-text-dim">{record.label}</span>
              <span
                className="text-[10px] font-bold font-grotesk"
                style={{ color: record.color }}
              >
                {record.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  /* ============================================================
     Main Layout
     ============================================================ */

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border-web3 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-electric-orange"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-bright">
            Coach Career
          </h1>
          <p className="text-[10px] text-text-dim">
            Season {currentSeason} · {currentClubName}
          </p>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#0d1117] rounded-lg p-1 border border-border-web3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-2 text-[10px] font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-surface-2 text-electric-orange'
                : 'text-text-mid hover:text-text-bright'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && renderOverview()}
      {tab === 'tactics' && renderTactics()}
      {tab === 'development' && renderDevelopment()}
      {tab === 'legacy' && renderLegacy()}
    </div>
  );
}
