'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  TrendingUp,
  Eye,
  BarChart3,
  Search,
  Filter,
  Star,
  ArrowRight,
  Users,
  DollarSign,
} from 'lucide-react';

// ============================================================
// Animation constant — opacity-only transitions
// ============================================================
const ANIM = { duration: 0.18, ease: 'easeOut' as const };

// ============================================================
// Web3 Design Tokens
// ============================================================
const TOKENS = {
  electricOrange: '#FF5500',
  neonLime: '#CCFF00',
  cyanBlue: '#00E5FF',
  mutedGray: '#666',
  bg: '#0d1117',
  card: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  muted: '#8b949e',
  dark: '#21262d',
} as const;

// ============================================================
// Seeded random for deterministic data generation
// ============================================================
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ============================================================
// Helper: format price in millions
// ============================================================
function formatPrice(millions: number): string {
  if (millions >= 1) {
    return `€${millions.toFixed(1)}M`;
  }
  return `€${Math.round(millions * 1000)}K`;
}

// ============================================================
// Helper: get position category
// ============================================================
function getPositionCategory(pos: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  if (pos === 'GK') return 'GK';
  if (['CB', 'LB', 'RB'].includes(pos)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID';
  return 'FWD';
}

// ============================================================
// Helper: compute polygon points for radar charts
// ============================================================
function computeHexPoints(cx: number, cy: number, r: number, n: number): string {
  const coords = Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  });
  const joined = coords.join(' ');
  return joined;
}

// ============================================================
// Helper: describe SVG arc path
// ============================================================
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// ============================================================
// Helper: polyline points from data array
// ============================================================
function computePolylinePoints(
  data: number[],
  w: number,
  h: number,
  padY: number
): string {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = padY + h - 2 * padY - ((v - min) / range) * (h - 2 * padY);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return coords.join(' ');
}

// ============================================================
// Types for transfer targets
// ============================================================
interface TransferTarget {
  id: string;
  name: string;
  position: string;
  age: number;
  overall: number;
  clubName: string;
  askingPrice: number;
  interestLevel: number;
  nationality: string;
}

// ============================================================
// Types for market analytics
// ============================================================
interface MarketTrend {
  week: string;
  activity: number;
  avgFee: number;
}

// ============================================================
// Types for transfer history
// ============================================================
interface TransferRecord {
  playerName: string;
  fromClub: string;
  toClub: string;
  fee: number;
  status: 'completed' | 'pending' | 'failed';
}

// ============================================================
// Types for scout reports
// ============================================================
interface ScoutPlayer {
  name: string;
  position: string;
  age: number;
  currentRating: number;
  potentialRating: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  confidence: number;
  recommendation: string;
}

// ============================================================
// Generate transfer targets deterministically
// ============================================================
function generateTargets(season: number, week: number): TransferTarget[] {
  const seed = season * 1000 + week * 7 + 99;
  const rng = seededRandom(seed);

  const names = [
    'Marcus Rashford', 'Frenkie de Jong', 'Victor Osimhen', 'Lamine Yamal',
    'Declan Rice', 'Jamal Musiala', 'Bukayo Saka', 'Federico Chiesa',
    'Aurelien Tchouameni', 'Rafael Leao', 'Martin Odegaard', 'Pedri Gonzalez',
  ];
  const positions = ['ST', 'CM', 'CAM', 'LW', 'RW', 'CDM', 'CB', 'RB', 'GK', 'CF', 'LB', 'ST'];
  const clubs = [
    'Manchester United', 'Barcelona', 'Napoli', 'FC Barcelona', 'Arsenal',
    'Bayern Munich', 'Arsenal', 'Juventus', 'Real Madrid', 'AC Milan',
    'Arsenal', 'FC Barcelona',
  ];
  const nationalities = [
    'England', 'Netherlands', 'Nigeria', 'Spain', 'England', 'Germany',
    'England', 'Italy', 'France', 'Portugal', 'Norway', 'Spain',
  ];

  const targets: TransferTarget[] = [];
  for (let i = 0; i < 6; i++) {
    const age = 18 + Math.floor(rng() * 16);
    const overall = 65 + Math.floor(rng() * 25);
    const basePrice = (overall * overall) / 100;
    const ageFactor = age < 24 ? 1.3 : age < 28 ? 1.0 : 0.6;
    const askingPrice = Math.round(basePrice * ageFactor * 10) / 10;
    const interestLevel = Math.floor(rng() * 100);

    targets.push({
      id: `target_${i}`,
      name: names[i],
      position: positions[i],
      age,
      overall,
      clubName: clubs[i],
      askingPrice,
      interestLevel,
      nationality: nationalities[i],
    });
  }
  return targets;
}

// ============================================================
// Generate market trends deterministically
// ============================================================
function generateMarketTrends(season: number, week: number): MarketTrend[] {
  const seed = season * 500 + week * 3 + 42;
  const rng = seededRandom(seed);

  const weekLabels = [
    'Week 1', 'Week 2', 'Week 3', 'Week 4',
    'Week 5', 'Week 6', 'Week 7', 'Week 8',
  ];
  const trends: MarketTrend[] = [];
  let baseActivity = 15 + Math.floor(rng() * 20);
  let baseFee = 20 + Math.floor(rng() * 30);

  for (let i = 0; i < 8; i++) {
    baseActivity += Math.floor(rng() * 10) - 4;
    baseActivity = Math.max(5, Math.min(60, baseActivity));
    baseFee += Math.floor(rng() * 8) - 3;
    baseFee = Math.max(10, Math.min(80, baseFee));
    trends.push({
      week: weekLabels[i],
      activity: baseActivity,
      avgFee: baseFee,
    });
  }
  return trends;
}

// ============================================================
// Generate transfer history deterministically
// ============================================================
function generateTransferHistory(season: number, week: number): TransferRecord[] {
  const seed = season * 300 + week * 5 + 77;
  const rng = seededRandom(seed);

  const playerNames = [
    'Dušan Vlahović', 'Vinicius Jr', 'Jude Bellingham', 'Florian Wirtz',
    'Khvicha Kvaratskhelia', 'Sandro Tonali', 'Rodrygo Goes', 'Gabriel Martinelli',
  ];
  const clubNames = [
    'Juventus', 'Real Madrid', 'Real Madrid', 'Leverkusen', 'Napoli',
    'Newcastle', 'Real Madrid', 'Arsenal',
  ];
  const statuses: Array<'completed' | 'pending' | 'failed'> = ['completed', 'completed', 'completed', 'pending', 'failed'];

  const records: TransferRecord[] = [];
  for (let i = 0; i < 5; i++) {
    const fromIdx = i;
    let toIdx = (i + 2) % clubNames.length;
    const fee = 5 + Math.floor(rng() * 80);
    records.push({
      playerName: playerNames[i],
      fromClub: clubNames[fromIdx],
      toClub: clubNames[toIdx],
      fee,
      status: statuses[i],
    });
  }
  return records;
}

// ============================================================
// Generate scout reports deterministically
// ============================================================
function generateScoutReports(season: number, week: number): ScoutPlayer[] {
  const seed = season * 800 + week * 11 + 123;
  const rng = seededRandom(seed);

  const scoutNames = [
    'Alejandro Garnacho', 'Warren Zaïre-Emery', 'Lamine Yamal',
    'Mathys Tel', 'Arda Güler', 'Pau Cubarsí',
  ];
  const scoutPositions = ['LW', 'CM', 'RW', 'ST', 'CAM', 'CB'];
  const recommendations = [
    'Must sign immediately — generational talent',
    'Strong potential, worth monitoring for 6 months',
    'Ready for first-team football, recommend loan',
    'High ceiling but raw, develop in academy',
    'Elite passer, ideal for possession system',
    'Defensive rock, excellent reading of play',
  ];

  const players: ScoutPlayer[] = [];
  for (let i = 0; i < 6; i++) {
    const age = 17 + Math.floor(rng() * 5);
    const baseRating = 68 + Math.floor(rng() * 15);
    const potentialGap = 8 + Math.floor(rng() * 12);
    const confidence = 40 + Math.floor(rng() * 55);

    players.push({
      name: scoutNames[i],
      position: scoutPositions[i],
      age,
      currentRating: baseRating,
      potentialRating: Math.min(99, baseRating + potentialGap),
      pac: 60 + Math.floor(rng() * 35),
      sho: 55 + Math.floor(rng() * 40),
      pas: 60 + Math.floor(rng() * 35),
      dri: 60 + Math.floor(rng() * 35),
      def: 40 + Math.floor(rng() * 45),
      confidence,
      recommendation: recommendations[i],
    });
  }
  return players;
}

// ============================================================
// SVG 1: TargetPositionDonut — 4-segment donut (GK/DEF/MID/FWD)
// ============================================================
function TargetPositionDonut({ targets }: { targets: TransferTarget[] }) {
  const segments = ['GK', 'DEF', 'MID', 'FWD'];
  const colors = [TOKENS.electricOrange, TOKENS.cyanBlue, TOKENS.neonLime, TOKENS.mutedGray];

  // Use .reduce() to accumulate segment counts
  const counts = targets.reduce<Record<string, number>>((acc, t) => {
    const cat = getPositionCategory(t.position);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const total = targets.length || 1;
  const cx = 100;
  const cy = 100;
  const r = 60;
  const ir = 38;

  // Compute cumulative end angles with reduce
  const cumAngles = segments.reduce<number[]>((acc, seg, i) => {
    const prev = i === 0 ? -Math.PI / 2 : acc[i - 1];
    const sliceAngle = ((counts[seg] || 0) / total) * Math.PI * 2;
    acc.push(prev + sliceAngle);
    return acc;
  }, []);

  // Build donut segment paths with reduce
  const paths = segments.reduce<
    Array<{ d: string; color: string; label: string; count: number }>
  >((acc, seg, i) => {
    const count = counts[seg] || 0;
    if (count === 0) return acc;
    const startAngle = i === 0 ? -Math.PI / 2 : cumAngles[i - 1];
    const endAngle = cumAngles[i];
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const osX = cx + r * Math.cos(startAngle);
    const osY = cy + r * Math.sin(startAngle);
    const oeX = cx + r * Math.cos(endAngle);
    const oeY = cy + r * Math.sin(endAngle);
    const isX = cx + ir * Math.cos(endAngle);
    const isY = cy + ir * Math.sin(endAngle);
    const ieX = cx + ir * Math.cos(startAngle);
    const ieY = cy + ir * Math.sin(startAngle);

    const d = `M ${osX.toFixed(1)} ${osY.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${oeX.toFixed(1)} ${oeY.toFixed(1)} L ${isX.toFixed(1)} ${isY.toFixed(1)} A ${ir} ${ir} 0 ${largeArc} 0 ${ieX.toFixed(1)} ${ieY.toFixed(1)} Z`;
    return [...acc, { d, color: colors[i], label: seg, count }];
  }, []);

  return (
    <svg viewBox="0 0 200 200" className="w-full">
      {paths.map((seg, i) => (
        <path key={i} d={seg.d} fill={seg.color} opacity={0.8} />
      ))}
      <circle cx={cx} cy={cy} r={ir - 2} fill={TOKENS.card} />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={TOKENS.text} fontSize="18" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={TOKENS.muted} fontSize="9">
        targets
      </text>
      {paths.map((seg, i) => {
        const midAngle =
          segments.reduce<number[]>((angles, _, idx) => {
            const prev = idx === 0 ? -Math.PI / 2 : angles[idx - 1];
            const slice = ((counts[segments[idx]] || 0) / total) * Math.PI * 2;
            angles.push(prev + slice);
            return angles;
          }, [])[i] -
          ((counts[segments[i]] || 0) / total) * Math.PI;
        const lx = cx + (r + 18) * Math.cos(midAngle);
        const ly = cy + (r + 18) * Math.sin(midAngle);
        return (
          <g key={`leg-${i}`}>
            <circle cx={lx - 8} cy={ly} r={3} fill={seg.color} />
            <text x={lx - 3} y={ly + 3} textAnchor="start" fill={TOKENS.muted} fontSize="9">
              {seg.label} ({seg.count})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 2: TargetOVRBars — 6 horizontal bars showing OVR
// ============================================================
function TargetOVRBars({ targets }: { targets: TransferTarget[] }) {
  const barH = 14;
  const gap = 8;
  const labelW = 70;
  const barMaxW = 110;
  const svgW = labelW + barMaxW + 30;
  const svgH = targets.length * (barH + gap) + 20;

  const maxOvr = 99;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
      {targets.map((t, i) => {
        const y = i * (barH + gap) + 10;
        const barW = Math.max(2, (t.overall / maxOvr) * barMaxW);
        const displayName = t.name.split(' ').pop() || t.name;
        return (
          <g key={i}>
            <text
              x={labelW - 4}
              y={y + barH / 2 + 4}
              textAnchor="end"
              fill={TOKENS.text}
              fontSize="9"
            >
              {displayName}
            </text>
            <rect
              x={labelW}
              y={y}
              width={barMaxW}
              height={barH}
              rx={3}
              fill={TOKENS.dark}
            />
            <rect
              x={labelW}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={TOKENS.neonLime}
              opacity={0.85}
            />
            <text
              x={labelW + barW + 4}
              y={y + barH / 2 + 4}
              fill={TOKENS.text}
              fontSize="10"
              fontWeight="bold"
            >
              {t.overall}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 3: BudgetUtilizationRing — circular ring
// ============================================================
function BudgetUtilizationRing({
  shortlistTotal,
  budget,
}: {
  shortlistTotal: number;
  budget: number;
}) {
  const cx = 100;
  const cy = 110;
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const pct = budget > 0 ? Math.min(100, (shortlistTotal / budget) * 100) : 0;
  const filled = (pct / 100) * circumference;

  return (
    <svg viewBox="0 0 200 210" className="w-full">
      <text
        x={cx}
        y={22}
        textAnchor="middle"
        fill={TOKENS.muted}
        fontSize="10"
        fontWeight="bold"
      >
        BUDGET UTILIZATION
      </text>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={TOKENS.dark}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={TOKENS.electricOrange}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="butt"
        opacity={0.85}
      />
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill={TOKENS.text}
        fontSize="28"
        fontWeight="bold"
      >
        {Math.round(pct)}%
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill={TOKENS.muted}
        fontSize="9"
      >
        utilized
      </text>
      <text
        x={cx}
        y={cy + 26}
        textAnchor="middle"
        fill={TOKENS.muted}
        fontSize="8"
      >
        {formatPrice(shortlistTotal)} / {formatPrice(budget)}
      </text>
    </svg>
  );
}

// ============================================================
// SVG 4: MarketTrendAreaChart — 8-point area chart
// ============================================================
function MarketTrendAreaChart({ trends }: { trends: MarketTrend[] }) {
  const data = trends.map((t) => t.activity);
  const w = 280;
  const h = 80;
  const padY = 8;

  const linePoints = computePolylinePoints(data, w, h, padY);
  const areaPoints = `0,${h} ${linePoints} ${w},${h}`;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full">
      <polygon points={areaPoints} fill={TOKENS.cyanBlue} opacity={0.1} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={TOKENS.cyanBlue}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = padY + h - 2 * padY - ((v - minVal) / range) * (h - 2 * padY);
        return (
          <g key={i}>
            <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill={TOKENS.cyanBlue} />
            <text
              x={x.toFixed(1)}
              y={h + 14}
              textAnchor="middle"
              fill={TOKENS.muted}
              fontSize="7"
            >
              W{i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 5: PriceTierDonut — 4-segment donut (<5M/5-20M/20-50M/50M+)
// ============================================================
function PriceTierDonut({ targets }: { targets: TransferTarget[] }) {
  const tierLabels = ['< €5M', '€5-20M', '€20-50M', '€50M+'];
  const tierColors = [TOKENS.neonLime, TOKENS.cyanBlue, TOKENS.electricOrange, TOKENS.mutedGray];

  // Use .reduce() to accumulate counts for each tier
  const counts = targets.reduce<[number, number, number, number]>(
    (acc, t) => {
      if (t.askingPrice < 5) acc[0]++;
      else if (t.askingPrice < 20) acc[1]++;
      else if (t.askingPrice < 50) acc[2]++;
      else acc[3]++;
      return acc;
    },
    [0, 0, 0, 0]
  );

  const total = counts.reduce((s, c) => s + c, 0) || 1;
  const cx = 100;
  const cy = 100;
  const r = 60;
  const ir = 38;

  // Cumulative end angles via reduce
  const cumAngles = counts.reduce<number[]>((acc, count, i) => {
    const prev = i === 0 ? -Math.PI / 2 : acc[i - 1];
    const sliceAngle = (count / total) * Math.PI * 2;
    acc.push(prev + sliceAngle);
    return acc;
  }, []);

  // Build segment paths via reduce
  const paths = counts.reduce<
    Array<{ d: string; color: string; label: string; count: number }>
  >((acc, count, i) => {
    if (count === 0) return acc;
    const startAngle = i === 0 ? -Math.PI / 2 : cumAngles[i - 1];
    const endAngle = cumAngles[i];
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const osX = cx + r * Math.cos(startAngle);
    const osY = cy + r * Math.sin(startAngle);
    const oeX = cx + r * Math.cos(endAngle);
    const oeY = cy + r * Math.sin(endAngle);
    const isX = cx + ir * Math.cos(endAngle);
    const isY = cy + ir * Math.sin(endAngle);
    const ieX = cx + ir * Math.cos(startAngle);
    const ieY = cy + ir * Math.sin(startAngle);

    const d = `M ${osX.toFixed(1)} ${osY.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${oeX.toFixed(1)} ${oeY.toFixed(1)} L ${isX.toFixed(1)} ${isY.toFixed(1)} A ${ir} ${ir} 0 ${largeArc} 0 ${ieX.toFixed(1)} ${ieY.toFixed(1)} Z`;
    return [...acc, { d, color: tierColors[i], label: tierLabels[i], count }];
  }, []);

  return (
    <svg viewBox="0 0 200 200" className="w-full">
      {paths.map((seg, i) => (
        <path key={i} d={seg.d} fill={seg.color} opacity={0.8} />
      ))}
      <circle cx={cx} cy={cy} r={ir - 2} fill={TOKENS.card} />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={TOKENS.text} fontSize="16" fontWeight="bold">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={TOKENS.muted} fontSize="8">
        by price tier
      </text>
      {paths.map((seg, i) => (
        <g key={`leg-${i}`}>
          <rect x={10} y={180 - (paths.length - i) * 16} width={8} height={8} rx={1} fill={seg.color} />
          <text x={22} y={188 - (paths.length - i) * 16} fill={TOKENS.muted} fontSize="8">
            {seg.label} ({seg.count})
          </text>
        </g>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 6: PositionDemandRadar — 5-axis radar (GK/DEF/MID/FWD/CF)
// ============================================================
function PositionDemandRadar({ targets }: { targets: TransferTarget[] }) {
  const axes = ['GK', 'DEF', 'MID', 'FWD', 'CF'];
  const n = axes.length;
  const cx = 110;
  const cy = 110;
  const maxR = 75;

  // Use reduce to count demand by category
  const demandCounts = targets.reduce<Record<string, number>>((acc, t) => {
    const cat = getPositionCategory(t.position);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(demandCounts), 1);
  const values = axes.map((a) => ((demandCounts[a] || 0) / maxCount) * 100);

  // Grid polygons
  const gridHexes = [0.25, 0.5, 0.75, 1.0].map((scale) =>
    computeHexPoints(cx, cy, maxR * scale, n)
  );

  // Data polygon
  const dataCoords = values.map((val, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + maxR * (val / 100) * Math.cos(angle),
      y: cy + maxR * (val / 100) * Math.sin(angle),
    };
  });
  const dataPointsStr = dataCoords
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ');

  // Label positions
  const labelCoords = Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + (maxR + 18) * Math.cos(angle),
      y: cy + (maxR + 18) * Math.sin(angle),
    };
  });

  return (
    <svg viewBox="0 0 220 230" className="w-full">
      <text x={cx} y={18} textAnchor="middle" fill={TOKENS.muted} fontSize="10" fontWeight="bold">
        POSITION DEMAND
      </text>
      {gridHexes.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke={TOKENS.border} strokeWidth="1" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const endX = cx + maxR * Math.cos(angle);
        const endY = cy + maxR * Math.sin(angle);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={endX}
            y2={endY}
            stroke={TOKENS.border}
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={dataPointsStr}
        fill="rgba(255,85,0,0.15)"
        stroke={TOKENS.electricOrange}
        strokeWidth="2"
      />
      {dataCoords.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="4" fill={TOKENS.electricOrange} />
      ))}
      {axes.map((label, i) => (
        <text
          key={i}
          x={labelCoords[i].x}
          y={labelCoords[i].y + 4}
          textAnchor="middle"
          fill={TOKENS.muted}
          fontSize="10"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 7: TransferFeeBars — 5 horizontal bars of recent fees
// ============================================================
function TransferFeeBars({ records }: { records: TransferRecord[] }) {
  const barH = 16;
  const gap = 10;
  const labelW = 80;
  const barMaxW = 120;
  const svgW = labelW + barMaxW + 30;
  const svgH = records.length * (barH + gap) + 20;

  const maxFee = Math.max(...records.map((r) => r.fee), 1);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
      {records.map((rec, i) => {
        const y = i * (barH + gap) + 10;
        const barW = Math.max(2, (rec.fee / maxFee) * barMaxW);
        const shortName = rec.playerName.split(' ').pop() || rec.playerName;
        return (
          <g key={i}>
            <text
              x={labelW - 4}
              y={y + barH / 2 + 4}
              textAnchor="end"
              fill={TOKENS.text}
              fontSize="9"
            >
              {shortName}
            </text>
            <rect x={labelW} y={y} width={barMaxW} height={barH} rx={3} fill={TOKENS.dark} />
            <rect
              x={labelW}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={TOKENS.neonLime}
              opacity={0.85}
            />
            <text
              x={labelW + barW + 4}
              y={y + barH / 2 + 4}
              fill={TOKENS.text}
              fontSize="9"
              fontWeight="bold"
            >
              €{rec.fee}M
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 8: TransferSuccessGauge — semi-circular gauge (0-100)
// ============================================================
function TransferSuccessGauge({ successRate }: { successRate: number }) {
  const cx = 120;
  const cy = 130;
  const radius = 80;
  const strokeWidth = 16;

  const bgPath = describeArc(cx, cy, radius, Math.PI, 2 * Math.PI);
  const filledAngle = Math.PI + (successRate / 100) * Math.PI;
  const valueEndX = cx + radius * Math.cos(filledAngle);
  const valueEndY = cy + radius * Math.sin(filledAngle);
  const valuePath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${valueEndX.toFixed(1)} ${valueEndY.toFixed(1)}`;

  // Needle
  const needleAngle = Math.PI + (successRate / 100) * Math.PI;
  const needleLen = radius - 20;
  const needleX = cx + needleLen * Math.cos(needleAngle);
  const needleY = cy + needleLen * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 240 170" className="w-full">
      <text
        x={cx}
        y={20}
        textAnchor="middle"
        fill={TOKENS.muted}
        fontSize="10"
        fontWeight="bold"
      >
        SUCCESS RATE
      </text>
      <path d={bgPath} fill="none" stroke={TOKENS.dark} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path
        d={valuePath}
        fill="none"
        stroke={TOKENS.cyanBlue}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.85}
      />
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke={TOKENS.text}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="6" fill={TOKENS.bg} stroke={TOKENS.text} strokeWidth="2" />
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fill={TOKENS.text}
        fontSize="24"
        fontWeight="bold"
      >
        {successRate}%
      </text>
      <text x={cx - radius} y={cy + 14} textAnchor="middle" fill={TOKENS.muted} fontSize="9">
        0
      </text>
      <text x={cx + radius} y={cy + 14} textAnchor="middle" fill={TOKENS.muted} fontSize="9">
        100
      </text>
    </svg>
  );
}

// ============================================================
// SVG 9: SeasonSpendingLine — 8-point line chart
// ============================================================
function SeasonSpendingLine({ spending }: { spending: number[] }) {
  const w = 280;
  const h = 80;
  const padY = 8;
  const linePoints = computePolylinePoints(spending, w, h, padY);

  const minVal = Math.min(...spending);
  const maxVal = Math.max(...spending);
  const range = maxVal - minVal || 1;

  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full">
      <polyline
        points={linePoints}
        fill="none"
        stroke={TOKENS.electricOrange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {spending.map((v, i) => {
        const x = (i / (spending.length - 1)) * w;
        const y = padY + h - 2 * padY - ((v - minVal) / range) * (h - 2 * padY);
        return (
          <g key={i}>
            <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill={TOKENS.electricOrange} />
            <text
              x={x.toFixed(1)}
              y={(y - 6).toFixed(1)}
              textAnchor="middle"
              fill={TOKENS.muted}
              fontSize="7"
            >
              €{v}M
            </text>
            <text
              x={x.toFixed(1)}
              y={h + 14}
              textAnchor="middle"
              fill={TOKENS.muted}
              fontSize="7"
            >
              S{i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 10: ScoutRatingRadar — 5-axis radar (PAC/SHO/PAS/DRI/DEF)
// ============================================================
function ScoutRatingRadar({ player }: { player: ScoutPlayer }) {
  const axes = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF'];
  const values = [player.pac, player.sho, player.pas, player.dri, player.def];
  const n = axes.length;
  const cx = 110;
  const cy = 110;
  const maxR = 75;

  const gridHexes = [0.25, 0.5, 0.75, 1.0].map((scale) =>
    computeHexPoints(cx, cy, maxR * scale, n)
  );

  const dataCoords = values.map((val, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + maxR * (val / 99) * Math.cos(angle),
      y: cy + maxR * (val / 99) * Math.sin(angle),
    };
  });
  const dataPointsStr = dataCoords
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ');

  const labelCoords = Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + (maxR + 18) * Math.cos(angle),
      y: cy + (maxR + 18) * Math.sin(angle),
    };
  });

  return (
    <svg viewBox="0 0 220 230" className="w-full">
      <text x={cx} y={18} textAnchor="middle" fill={TOKENS.muted} fontSize="10" fontWeight="bold">
        {player.name}
      </text>
      {gridHexes.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke={TOKENS.border} strokeWidth="1" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const endX = cx + maxR * Math.cos(angle);
        const endY = cy + maxR * Math.sin(angle);
        return (
          <line key={i} x1={cx} y1={cy} x2={endX} y2={endY} stroke={TOKENS.border} strokeWidth="1" />
        );
      })}
      <polygon
        points={dataPointsStr}
        fill="rgba(204,255,0,0.12)"
        stroke={TOKENS.neonLime}
        strokeWidth="2"
      />
      {dataCoords.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r="4" fill={TOKENS.neonLime} />
          <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill={TOKENS.text} fontSize="9" fontWeight="bold">
            {values[i]}
          </text>
        </g>
      ))}
      {axes.map((label, i) => (
        <text
          key={i}
          x={labelCoords[i].x}
          y={labelCoords[i].y + 4}
          textAnchor="middle"
          fill={TOKENS.muted}
          fontSize="10"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// SVG 11: PotentialVsCurrentBars — butterfly comparison for 5 players
// ============================================================
function PotentialVsCurrentBars({ players }: { players: ScoutPlayer[] }) {
  const barH = 10;
  const gap = 6;
  const groupGap = 14;
  const labelW = 60;
  const barMaxW = 80;
  const midX = labelW + barMaxW + 10;
  const svgW = labelW + barMaxW * 2 + 20;
  const svgH = players.length * (barH * 2 + groupGap) + 30;

  const displayPlayers = players.slice(0, 5);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
      <text
        x={svgW / 2}
        y={16}
        textAnchor="middle"
        fill={TOKENS.muted}
        fontSize="9"
        fontWeight="bold"
      >
        POTENTIAL vs CURRENT
      </text>
      {/* Legend */}
      <rect x={labelW} y={svgH - 10} width={8} height={6} rx={1} fill={TOKENS.cyanBlue} opacity={0.7} />
      <text x={labelW + 12} y={svgH - 4} fill={TOKENS.muted} fontSize="7">Current</text>
      <rect x={midX + 10} y={svgH - 10} width={8} height={6} rx={1} fill={TOKENS.electricOrange} opacity={0.7} />
      <text x={midX + 22} y={svgH - 4} fill={TOKENS.muted} fontSize="7">Potential</text>
      {displayPlayers.map((p, i) => {
        const baseY = 22 + i * (barH * 2 + groupGap);
        const currentW = Math.max(2, (p.currentRating / 99) * barMaxW);
        const potentialW = Math.max(2, (p.potentialRating / 99) * barMaxW);
        const shortName = p.name.split(' ').pop() || p.name;
        return (
          <g key={i}>
            <text
              x={labelW - 4}
              y={baseY + barH + 6}
              textAnchor="end"
              fill={TOKENS.text}
              fontSize="8"
            >
              {shortName}
            </text>
            {/* Current bar (left) */}
            <rect
              x={labelW}
              y={baseY}
              width={barMaxW}
              height={barH}
              rx={2}
              fill={TOKENS.dark}
            />
            <rect
              x={labelW}
              y={baseY}
              width={currentW}
              height={barH}
              rx={2}
              fill={TOKENS.cyanBlue}
              opacity={0.7}
            />
            <text
              x={labelW + currentW + 3}
              y={baseY + barH - 1}
              fill={TOKENS.text}
              fontSize="7"
            >
              {p.currentRating}
            </text>
            {/* Potential bar (right) */}
            <rect
              x={midX + 10}
              y={baseY + barH + 2}
              width={barMaxW}
              height={barH}
              rx={2}
              fill={TOKENS.dark}
            />
            <rect
              x={midX + 10}
              y={baseY + barH + 2}
              width={potentialW}
              height={barH}
              rx={2}
              fill={TOKENS.electricOrange}
              opacity={0.7}
            />
            <text
              x={midX + 10 + potentialW + 3}
              y={baseY + barH * 2 + 1}
              fill={TOKENS.text}
              fontSize="7"
            >
              {p.potentialRating}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// SVG 12: ScoutingConfidenceGauge — semi-circular gauge (0-100)
// ============================================================
function ScoutingConfidenceGauge({ confidence }: { confidence: number }) {
  const cx = 120;
  const cy = 130;
  const radius = 80;
  const strokeWidth = 16;

  const bgPath = describeArc(cx, cy, radius, Math.PI, 2 * Math.PI);
  const filledAngle = Math.PI + (confidence / 100) * Math.PI;
  const valueEndX = cx + radius * Math.cos(filledAngle);
  const valueEndY = cy + radius * Math.sin(filledAngle);
  const valuePath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${valueEndX.toFixed(1)} ${valueEndY.toFixed(1)}`;

  // Needle
  const needleAngle = Math.PI + (confidence / 100) * Math.PI;
  const needleLen = radius - 20;
  const needleX = cx + needleLen * Math.cos(needleAngle);
  const needleY = cy + needleLen * Math.sin(needleAngle);

  return (
    <svg viewBox="0 0 240 170" className="w-full">
      <text
        x={cx}
        y={20}
        textAnchor="middle"
        fill={TOKENS.muted}
        fontSize="10"
        fontWeight="bold"
      >
        SCOUT CONFIDENCE
      </text>
      <path d={bgPath} fill="none" stroke={TOKENS.dark} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path
        d={valuePath}
        fill="none"
        stroke={TOKENS.neonLime}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.85}
      />
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke={TOKENS.text}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="6" fill={TOKENS.bg} stroke={TOKENS.text} strokeWidth="2" />
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fill={TOKENS.text}
        fontSize="24"
        fontWeight="bold"
      >
        {confidence}%
      </text>
      <text x={cx - radius} y={cy + 14} textAnchor="middle" fill={TOKENS.muted} fontSize="9">
        0
      </text>
      <text x={cx + radius} y={cy + 14} textAnchor="middle" fill={TOKENS.muted} fontSize="9">
        100
      </text>
      {/* Quality zones */}
      {[
        { label: 'Low', start: 0, end: 33, color: TOKENS.electricOrange },
        { label: 'Med', start: 33, end: 66, color: TOKENS.cyanBlue },
        { label: 'High', start: 66, end: 100, color: TOKENS.neonLime },
      ].map((zone) => {
        const midAngle = Math.PI + ((zone.start + zone.end) / 2 / 100) * Math.PI;
        const lx = cx + (radius + 16) * Math.cos(midAngle);
        const ly = cy + (radius + 16) * Math.sin(midAngle);
        return (
          <text
            key={zone.label}
            x={lx}
            y={ly + 3}
            textAnchor="middle"
            fill={zone.color}
            fontSize="7"
            opacity={0.8}
          >
            {zone.label}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// Helper: get interest level color
// ============================================================
function getInterestColor(level: number): string {
  if (level >= 66) return TOKENS.electricOrange;
  if (level >= 33) return TOKENS.cyanBlue;
  return TOKENS.muted;
}

// ============================================================
// Helper: get interest level label
// ============================================================
function getInterestLabel(level: number): string {
  if (level >= 66) return 'High';
  if (level >= 33) return 'Medium';
  return 'Low';
}

// ============================================================
// Helper: get OVR color class
// ============================================================
function getOvrColor(ovr: number): string {
  if (ovr >= 85) return TOKENS.neonLime;
  if (ovr >= 75) return TOKENS.cyanBlue;
  if (ovr >= 65) return TOKENS.electricOrange;
  return TOKENS.muted;
}

// ============================================================
// Helper: get position badge style
// ============================================================
function getPositionBadgeStyle(pos: string): React.CSSProperties {
  const cat = getPositionCategory(pos);
  switch (cat) {
    case 'GK':
      return { backgroundColor: 'rgba(255,85,0,0.15)', color: TOKENS.electricOrange, border: '1px solid rgba(255,85,0,0.3)' };
    case 'DEF':
      return { backgroundColor: 'rgba(0,229,255,0.15)', color: TOKENS.cyanBlue, border: '1px solid rgba(0,229,255,0.3)' };
    case 'MID':
      return { backgroundColor: 'rgba(204,255,0,0.15)', color: TOKENS.neonLime, border: '1px solid rgba(204,255,0,0.3)' };
    case 'FWD':
      return { backgroundColor: 'rgba(255,85,0,0.15)', color: TOKENS.electricOrange, border: '1px solid rgba(255,85,0,0.3)' };
    default:
      return { backgroundColor: 'rgba(102,102,102,0.15)', color: TOKENS.muted, border: '1px solid rgba(102,102,102,0.3)' };
  }
}

// ============================================================
// Helper: get status color
// ============================================================
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return TOKENS.neonLime;
    case 'pending':
      return TOKENS.cyanBlue;
    case 'failed':
      return TOKENS.electricOrange;
    default:
      return TOKENS.muted;
  }
}

// ============================================================
// Main Component: TransferMarketEnhanced
// ============================================================
export default function TransferMarketEnhanced() {
  const gameState = useGameStore((state) => state.gameState);
  const [activeTab, setActiveTab] = useState<string>('targets');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('ovr');
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());

  if (!gameState) {
    return null;
  }

  const clubName = gameState.currentClub.name;
  const season = gameState.currentSeason;
  const week = gameState.currentWeek;
  const budget = gameState.currentClub.budget || 50_000_000;
  const budgetInM = budget / 1_000_000;

  // ==========================================================
  // Generate deterministic data
  // ==========================================================
  const targets = useMemo(
    () => generateTargets(season, week),
    [season, week]
  );

  const marketTrends = useMemo(
    () => generateMarketTrends(season, week),
    [season, week]
  );

  const transferHistory = useMemo(
    () => generateTransferHistory(season, week),
    [season, week]
  );

  const scoutReports = useMemo(
    () => generateScoutReports(season, week),
    [season, week]
  );

  // ==========================================================
  // Computed values
  // ==========================================================
  const shortlistedTargets = useMemo(
    () => targets.filter((t) => shortlist.has(t.id)),
    [targets, shortlist]
  );

  const shortlistTotal = useMemo(
    () => shortlistedTargets.reduce((sum, t) => sum + t.askingPrice, 0),
    [shortlistedTargets]
  );

  // Filter and sort targets
  const filteredTargets = useMemo(() => {
    let result = [...targets];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.clubName.toLowerCase().includes(q) ||
          t.position.toLowerCase().includes(q)
      );
    }
    if (positionFilter !== 'All') {
      result = result.filter((t) => {
        const cat = getPositionCategory(t.position);
        return cat === positionFilter;
      });
    }
    switch (sortBy) {
      case 'ovr':
        result.sort((a, b) => b.overall - a.overall);
        break;
      case 'price':
        result.sort((a, b) => b.askingPrice - a.askingPrice);
        break;
      case 'age':
        result.sort((a, b) => a.age - b.age);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return result;
  }, [targets, searchQuery, positionFilter, sortBy]);

  // Market analytics computed values
  const avgMarketFee = useMemo(() => {
    if (marketTrends.length === 0) return 0;
    const total = marketTrends.reduce((sum, t) => sum + t.avgFee, 0);
    return Math.round((total / marketTrends.length) * 10) / 10;
  }, [marketTrends]);

  const totalMarketActivity = useMemo(() => {
    return marketTrends.reduce((sum, t) => sum + t.activity, 0);
  }, [marketTrends]);

  const peakActivity = useMemo(() => {
    return Math.max(...marketTrends.map((t) => t.activity), 0);
  }, [marketTrends]);

  // Transfer history computed values
  const completedTransfers = useMemo(
    () => transferHistory.filter((r) => r.status === 'completed'),
    [transferHistory]
  );

  const totalSpent = useMemo(
    () => completedTransfers.reduce((sum, r) => sum + r.fee, 0),
    [completedTransfers]
  );

  const successCount = completedTransfers.length;
  const totalCount = transferHistory.length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  // Season spending data (simulated across 8 seasons)
  const seasonSpending = useMemo(() => {
    const seed = season * 200 + 55;
    const rng = seededRandom(seed);
    return Array.from({ length: 8 }, () => 10 + Math.floor(rng() * 70));
  }, [season]);

  // Scout reports computed values
  const topScoutPlayer = useMemo(
    () => scoutReports.reduce((best, p) => (p.potentialRating > best.potentialRating ? p : best), scoutReports[0]),
    [scoutReports]
  );

  const avgConfidence = useMemo(() => {
    if (scoutReports.length === 0) return 0;
    const total = scoutReports.reduce((sum, p) => sum + p.confidence, 0);
    return Math.round(total / scoutReports.length);
  }, [scoutReports]);

  // ==========================================================
  // Handlers
  // ==========================================================
  const toggleShortlist = (id: string) => {
    setShortlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // ==========================================================
  // Render: Header
  // ==========================================================
  const renderHeader = () => (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b"
      style={{ borderColor: TOKENS.border, background: TOKENS.card }}
    >
      <ShoppingBag size={20} style={{ color: TOKENS.electricOrange }} />
      <div className="flex-1 min-w-0">
        <h2
          className="text-sm font-bold truncate"
          style={{ color: TOKENS.text }}
        >
          Transfer Market Enhanced
        </h2>
        <p className="text-xs truncate" style={{ color: TOKENS.muted }}>
          {clubName} — Season {season}, Week {week}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold" style={{ color: TOKENS.neonLime }}>
          {formatPrice(budgetInM)}
        </p>
        <p className="text-xs" style={{ color: TOKENS.muted }}>
          Budget
        </p>
      </div>
    </div>
  );

  // ==========================================================
  // Render: Summary Stats Row
  // ==========================================================
  const renderSummaryStats = () => {
    const stats = [
      { label: 'Targets', value: targets.length.toString(), icon: <Eye size={14} />, color: TOKENS.cyanBlue },
      { label: 'Shortlisted', value: shortlist.size.toString(), icon: <Star size={14} />, color: TOKENS.neonLime },
      { label: 'Avg Price', value: formatPrice(avgMarketFee), icon: <DollarSign size={14} />, color: TOKENS.electricOrange },
      { label: 'Activity', value: totalMarketActivity.toString(), icon: <TrendingUp size={14} />, color: TOKENS.muted },
    ];
    return (
      <div className="grid grid-cols-4 gap-2 p-3">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...ANIM, delay: i * 0.04 }}
            className="rounded-lg p-2 text-center"
            style={{ background: TOKENS.dark, border: `1px solid ${TOKENS.border}` }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-xs" style={{ color: TOKENS.muted }}>
                {stat.label}
              </span>
            </div>
            <p className="text-sm font-bold" style={{ color: TOKENS.text }}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>
    );
  };

  // ==========================================================
  // Render: Target Card
  // ==========================================================
  const renderTargetCard = (target: TransferTarget, index: number) => {
    const isShortlisted = shortlist.has(target.id);
    const ovrColor = getOvrColor(target.overall);
    const interestColor = getInterestColor(target.interestLevel);
    const interestLabel = getInterestLabel(target.interestLevel);
    const badgeStyle = getPositionBadgeStyle(target.position);

    return (
      <motion.div
        key={target.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...ANIM, delay: index * 0.04 }}
        className="rounded-lg p-3 flex flex-col gap-2"
        style={{
          background: TOKENS.card,
          border: `1px solid ${isShortlisted ? TOKENS.electricOrange : TOKENS.border}`,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: TOKENS.text }}>
              {target.name}
            </p>
            <p className="text-xs truncate" style={{ color: TOKENS.muted }}>
              {target.clubName}
            </p>
          </div>
          <div
            className="text-center ml-2"
            style={{
              background: `rgba(${ovrColor === TOKENS.neonLime ? '204,255,0' : ovrColor === TOKENS.cyanBlue ? '0,229,255' : ovrColor === TOKENS.electricOrange ? '255,85,0' : '102,102,102'},0.15)`,
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            <p className="text-sm font-bold" style={{ color: ovrColor }}>
              {target.overall}
            </p>
            <p className="text-xs" style={{ color: TOKENS.muted }}>
              OVR
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs px-2 py-0.5 rounded-sm font-medium"
            style={badgeStyle}
          >
            {target.position}
          </span>
          <span className="text-xs" style={{ color: TOKENS.muted }}>
            {target.age}yr
          </span>
          <span className="text-xs" style={{ color: TOKENS.muted }}>
            {target.nationality}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: TOKENS.muted }}>
              Asking Price
            </p>
            <p className="text-sm font-bold" style={{ color: TOKENS.neonLime }}>
              {formatPrice(target.askingPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: TOKENS.muted }}>
              Interest
            </p>
            <div className="flex items-center gap-1">
              <div
                className="rounded-sm"
                style={{
                  width: '40px',
                  height: '6px',
                  background: TOKENS.dark,
                }}
              >
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${target.interestLevel}%`,
                    background: interestColor,
                    opacity: 0.8,
                  }}
                />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: interestColor }}
              >
                {interestLabel}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => toggleShortlist(target.id)}
          className="text-xs px-3 py-1.5 rounded-sm font-medium w-full"
          style={{
            background: isShortlisted ? 'rgba(255,85,0,0.15)' : TOKENS.dark,
            color: isShortlisted ? TOKENS.electricOrange : TOKENS.muted,
            border: `1px solid ${isShortlisted ? 'rgba(255,85,0,0.3)' : TOKENS.border}`,
          }}
        >
          {isShortlisted ? '★ Shortlisted' : '+ Add to Shortlist'}
        </button>
      </motion.div>
    );
  };

  // ==========================================================
  // Render: Filters Bar
  // ==========================================================
  const renderFiltersBar = () => (
    <div
      className="flex items-center gap-2 p-3 flex-wrap"
      style={{ background: TOKENS.bg }}
    >
      <div
        className="flex items-center gap-2 rounded-sm px-2 py-1.5 flex-1 min-w-[120px]"
        style={{ background: TOKENS.dark, border: `1px solid ${TOKENS.border}` }}
      >
        <Search size={14} style={{ color: TOKENS.muted }} />
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent outline-none text-xs flex-1"
          style={{ color: TOKENS.text }}
        />
      </div>
      <div className="flex items-center gap-1">
        <Filter size={14} style={{ color: TOKENS.muted }} />
        {['All', 'GK', 'DEF', 'MID', 'FWD'].map((filter) => (
          <button
            key={filter}
            onClick={() => setPositionFilter(filter)}
            className="text-xs px-2 py-1 rounded-sm"
            style={{
              background:
                positionFilter === filter
                  ? 'rgba(255,85,0,0.15)'
                  : TOKENS.dark,
              color:
                positionFilter === filter
                  ? TOKENS.electricOrange
                  : TOKENS.muted,
              border: `1px solid ${
                positionFilter === filter
                  ? 'rgba(255,85,0,0.3)'
                  : TOKENS.border
              }`,
            }}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <BarChart3 size={14} style={{ color: TOKENS.muted }} />
        {[
          { label: 'OVR', value: 'ovr' },
          { label: 'Price', value: 'price' },
          { label: 'Age', value: 'age' },
          { label: 'Name', value: 'name' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className="text-xs px-2 py-1 rounded-sm"
            style={{
              background:
                sortBy === opt.value
                  ? 'rgba(0,229,255,0.15)'
                  : TOKENS.dark,
              color:
                sortBy === opt.value
                  ? TOKENS.cyanBlue
                  : TOKENS.muted,
              border: `1px solid ${
                sortBy === opt.value
                  ? 'rgba(0,229,255,0.3)'
                  : TOKENS.border
              }`,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ==========================================================
  // Tab 1: Transfer Targets
  // ==========================================================
  const renderTargetsTab = () => (
    <div className="flex flex-col gap-3">
      {renderFiltersBar()}
      {renderSummaryStats()}

      {/* Player Cards Grid */}
      <div className="grid grid-cols-2 gap-2 p-3 pt-0">
        {filteredTargets.map((target, i) => renderTargetCard(target, i))}
      </div>

      {filteredTargets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-xs" style={{ color: TOKENS.muted }}>
            No targets found matching your filters
          </p>
        </div>
      )}

      {/* SVG Section: Position Donut & OVR Bars */}
      <div className="grid grid-cols-2 gap-2 p-3 pt-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={ANIM}
          className="rounded-lg p-3"
          style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
            Position Distribution
          </p>
          <TargetPositionDonut targets={targets} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={ANIM}
          className="rounded-lg p-3"
          style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
            Target OVR Ratings
          </p>
          <TargetOVRBars targets={targets} />
        </motion.div>
      </div>

      {/* SVG Section: Budget Utilization Ring */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={ANIM}
        className="mx-3 rounded-lg p-3"
        style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
          Budget Utilization — Shortlist ({shortlist.size} players)
        </p>
        <div className="flex justify-center">
          <div style={{ maxWidth: '200px', width: '100%' }}>
            <BudgetUtilizationRing shortlistTotal={shortlistTotal} budget={budgetInM} />
          </div>
        </div>
      </motion.div>
    </div>
  );

  // ==========================================================
  // Tab 2: Market Analytics
  // ==========================================================
  const renderAnalyticsTab = () => {
    const priceSummary = [
      { label: 'Avg Fee', value: formatPrice(avgMarketFee), color: TOKENS.cyanBlue },
      { label: 'Peak Activity', value: `${peakActivity} transfers`, color: TOKENS.neonLime },
      { label: 'Total Volume', value: `${totalMarketActivity} transfers`, color: TOKENS.electricOrange },
      { label: 'Weeks Tracked', value: `${marketTrends.length}`, color: TOKENS.muted },
    ];

    // Market movement indicators
    const movements = [
      { label: 'Strikers', trend: 'up', change: '+12%', value: 'High Demand' },
      { label: 'Midfielders', trend: 'stable', change: '+3%', value: 'Moderate' },
      { label: 'Defenders', trend: 'down', change: '-5%', value: 'Low Demand' },
      { label: 'Goalkeepers', trend: 'up', change: '+8%', value: 'Moderate' },
    ];

    return (
      <div className="flex flex-col gap-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 p-3">
          {priceSummary.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...ANIM, delay: i * 0.04 }}
              className="rounded-lg p-2 text-center"
              style={{ background: TOKENS.dark, border: `1px solid ${TOKENS.border}` }}
            >
              <p className="text-xs" style={{ color: TOKENS.muted }}>
                {stat.label}
              </p>
              <p className="text-sm font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Market Movement Table */}
        <div
          className="mx-3 rounded-lg overflow-hidden"
          style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
        >
          <div
            className="px-3 py-2 border-b"
            style={{ borderColor: TOKENS.border }}
          >
            <p className="text-xs font-semibold" style={{ color: TOKENS.text }}>
              Market Movement by Position
            </p>
          </div>
          {movements.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2"
              style={{
                borderBottom: i < movements.length - 1 ? `1px solid ${TOKENS.border}` : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: TOKENS.text }}>
                  {m.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp
                  size={12}
                  style={{
                    color:
                      m.trend === 'up'
                        ? TOKENS.neonLime
                        : m.trend === 'down'
                        ? TOKENS.electricOrange
                        : TOKENS.cyanBlue,
                  }}
                />
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      m.trend === 'up'
                        ? TOKENS.neonLime
                        : m.trend === 'down'
                        ? TOKENS.electricOrange
                        : TOKENS.cyanBlue,
                  }}
                >
                  {m.change}
                </span>
                <Badge
                  className="text-xs rounded-sm"
                  style={{
                    background: TOKENS.dark,
                    color: TOKENS.muted,
                    border: `1px solid ${TOKENS.border}`,
                  }}
                >
                  {m.value}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* SVG: Market Trend Area Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={ANIM}
          className="mx-3 rounded-lg p-3"
          style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
            Market Activity Trend — 8 Weeks
          </p>
          <MarketTrendAreaChart trends={marketTrends} />
        </motion.div>

        {/* SVG Row: Price Tier Donut & Position Demand Radar */}
        <div className="grid grid-cols-2 gap-2 p-3 pt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={ANIM}
            className="rounded-lg p-3"
            style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
              Price Tier Distribution
            </p>
            <PriceTierDonut targets={targets} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={ANIM}
            className="rounded-lg p-3"
            style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
              Position Demand
            </p>
            <PositionDemandRadar targets={targets} />
          </motion.div>
        </div>
      </div>
    );
  };

  // ==========================================================
  // Tab 3: Transfer History
  // ==========================================================
  const renderHistoryTab = () => {
    const historyStats = [
      { label: 'Completed', value: `${successCount}`, color: TOKENS.neonLime },
      { label: 'Total Spent', value: formatPrice(totalSpent), color: TOKENS.cyanBlue },
      { label: 'Success Rate', value: `${successRate}%`, color: TOKENS.electricOrange },
      { label: 'Avg Fee', value: successCount > 0 ? formatPrice(totalSpent / successCount) : '€0', color: TOKENS.muted },
    ];

    return (
      <div className="flex flex-col gap-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 p-3">
          {historyStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...ANIM, delay: i * 0.04 }}
              className="rounded-lg p-2 text-center"
              style={{ background: TOKENS.dark, border: `1px solid ${TOKENS.border}` }}
            >
              <p className="text-xs" style={{ color: TOKENS.muted }}>
                {stat.label}
              </p>
              <p className="text-sm font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Recent Transfers Table */}
        <div
          className="mx-3 rounded-lg overflow-hidden"
          style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
        >
          <div
            className="px-3 py-2 border-b flex items-center justify-between"
            style={{ borderColor: TOKENS.border }}
          >
            <p className="text-xs font-semibold" style={{ color: TOKENS.text }}>
              Recent Transfers
            </p>
            <span className="text-xs" style={{ color: TOKENS.muted }}>
              {transferHistory.length} records
            </span>
          </div>
          {transferHistory.map((rec, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2"
              style={{
                borderBottom:
                  i < transferHistory.length - 1
                    ? `1px solid ${TOKENS.border}`
                    : 'none',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: TOKENS.text }}>
                  {rec.playerName}
                </p>
                <p className="text-xs truncate" style={{ color: TOKENS.muted }}>
                  {rec.fromClub} <ArrowRight size={10} className="inline" /> {rec.toClub}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold" style={{ color: TOKENS.neonLime }}>
                  €{rec.fee}M
                </p>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-sm"
                  style={{
                    background:
                      rec.status === 'completed'
                        ? 'rgba(204,255,0,0.12)'
                        : rec.status === 'pending'
                        ? 'rgba(0,229,255,0.12)'
                        : 'rgba(255,85,0,0.12)',
                    color: getStatusColor(rec.status),
                  }}
                >
                  {rec.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* SVG: Transfer Fee Bars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={ANIM}
          className="mx-3 rounded-lg p-3"
          style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
            Transfer Fees Comparison
          </p>
          <TransferFeeBars records={transferHistory} />
        </motion.div>

        {/* SVG Row: Success Gauge & Spending Line */}
        <div className="grid grid-cols-2 gap-2 p-3 pt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={ANIM}
            className="rounded-lg p-3"
            style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
              Transfer Success Rate
            </p>
            <TransferSuccessGauge successRate={successRate} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={ANIM}
            className="rounded-lg p-3"
            style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
              Season Spending Trend
            </p>
            <SeasonSpendingLine spending={seasonSpending} />
          </motion.div>
        </div>
      </div>
    );
  };

  // ==========================================================
  // Tab 4: Scout Reports
  // ==========================================================
  const renderScoutTab = () => {
    const scoutStats = [
      { label: 'Scouted', value: `${scoutReports.length}`, color: TOKENS.cyanBlue },
      { label: 'Avg Confidence', value: `${avgConfidence}%`, color: TOKENS.neonLime },
      { label: 'Top Potential', value: topScoutPlayer ? `${topScoutPlayer.potentialRating}` : '-', color: TOKENS.electricOrange },
      { label: 'Avg Age', value: scoutReports.length > 0 ? `${Math.round(scoutReports.reduce((s, p) => s + p.age, 0) / scoutReports.length)}` : '-', color: TOKENS.muted },
    ];

    return (
      <div className="flex flex-col gap-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 p-3">
          {scoutStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...ANIM, delay: i * 0.04 }}
              className="rounded-lg p-2 text-center"
              style={{ background: TOKENS.dark, border: `1px solid ${TOKENS.border}` }}
            >
              <p className="text-xs" style={{ color: TOKENS.muted }}>
                {stat.label}
              </p>
              <p className="text-sm font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Scout Reports List */}
        <div
          className="mx-3 rounded-lg overflow-hidden"
          style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
        >
          <div
            className="px-3 py-2 border-b flex items-center justify-between"
            style={{ borderColor: TOKENS.border }}
          >
            <p className="text-xs font-semibold" style={{ color: TOKENS.text }}>
              Scouted Players
            </p>
            <Users size={14} style={{ color: TOKENS.muted }} />
          </div>
          {scoutReports.map((sp, i) => {
            const potColor =
              sp.potentialRating >= 88
                ? TOKENS.neonLime
                : sp.potentialRating >= 80
                ? TOKENS.cyanBlue
                : TOKENS.electricOrange;
            return (
              <div
                key={i}
                className="px-3 py-2"
                style={{
                  borderBottom:
                    i < scoutReports.length - 1
                      ? `1px solid ${TOKENS.border}`
                      : 'none',
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-xs font-bold" style={{ color: TOKENS.text }}>
                      {sp.name}
                    </p>
                    <p className="text-xs" style={{ color: TOKENS.muted }}>
                      {sp.position} · {sp.age}yr · {sp.currentRating} OVR
                    </p>
                  </div>
                  <div
                    className="text-right px-2 py-0.5 rounded-sm"
                    style={{
                      background: `rgba(${potColor === TOKENS.neonLime ? '204,255,0' : potColor === TOKENS.cyanBlue ? '0,229,255' : '255,85,0'},0.12)`,
                    }}
                  >
                    <p className="text-xs" style={{ color: TOKENS.muted }}>
                      POT
                    </p>
                    <p className="text-sm font-bold" style={{ color: potColor }}>
                      {sp.potentialRating}
                    </p>
                  </div>
                </div>
                <p className="text-xs mb-1" style={{ color: TOKENS.muted }}>
                  {sp.recommendation}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: TOKENS.muted }}>
                    Confidence:
                  </span>
                  <div
                    className="rounded-sm"
                    style={{
                      width: '50px',
                      height: '5px',
                      background: TOKENS.dark,
                    }}
                  >
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${sp.confidence}%`,
                        background:
                          sp.confidence >= 70
                            ? TOKENS.neonLime
                            : sp.confidence >= 50
                            ? TOKENS.cyanBlue
                            : TOKENS.electricOrange,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: TOKENS.muted }}>
                    {sp.confidence}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* SVG: Scout Rating Radar */}
        {topScoutPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={ANIM}
            className="mx-3 rounded-lg p-3"
            style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
              Top Scouted Player — Attribute Radar
            </p>
            <div className="flex justify-center">
              <div style={{ maxWidth: '220px', width: '100%' }}>
                <ScoutRatingRadar player={topScoutPlayer} />
              </div>
            </div>
          </motion.div>
        )}

        {/* SVG Row: Potential vs Current & Confidence Gauge */}
        <div className="grid grid-cols-2 gap-2 p-3 pt-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={ANIM}
            className="rounded-lg p-3"
            style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
              Potential vs Current
            </p>
            <PotentialVsCurrentBars players={scoutReports} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={ANIM}
            className="rounded-lg p-3"
            style={{ background: TOKENS.card, border: `1px solid ${TOKENS.border}` }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: TOKENS.text }}>
              Overall Scout Confidence
            </p>
            <ScoutingConfidenceGauge confidence={avgConfidence} />
          </motion.div>
        </div>
      </div>
    );
  };

  // ==========================================================
  // Main Render
  // ==========================================================
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: TOKENS.bg }}
    >
      {renderHeader()}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList
          className="flex mx-3 mt-3 rounded-lg overflow-x-auto"
          style={{ background: TOKENS.dark, border: `1px solid ${TOKENS.border}` }}
        >
          <TabsTrigger
            value="targets"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-sm data-[state=active]:shadow-none"
            style={{
              color: activeTab === 'targets' ? TOKENS.electricOrange : TOKENS.muted,
              background: activeTab === 'targets' ? 'rgba(255,85,0,0.1)' : 'transparent',
            }}
          >
            <Eye size={14} />
            Targets
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-sm data-[state=active]:shadow-none"
            style={{
              color: activeTab === 'analytics' ? TOKENS.cyanBlue : TOKENS.muted,
              background: activeTab === 'analytics' ? 'rgba(0,229,255,0.1)' : 'transparent',
            }}
          >
            <BarChart3 size={14} />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-sm data-[state=active]:shadow-none"
            style={{
              color: activeTab === 'history' ? TOKENS.neonLime : TOKENS.muted,
              background: activeTab === 'history' ? 'rgba(204,255,0,0.1)' : 'transparent',
            }}
          >
            <TrendingUp size={14} />
            History
          </TabsTrigger>
          <TabsTrigger
            value="scouts"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-sm data-[state=active]:shadow-none"
            style={{
              color: activeTab === 'scouts' ? TOKENS.electricOrange : TOKENS.muted,
              background: activeTab === 'scouts' ? 'rgba(255,85,0,0.1)' : 'transparent',
            }}
          >
            <Users size={14} />
            Scouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="targets" className="flex-1 overflow-y-auto">
          {renderTargetsTab()}
        </TabsContent>
        <TabsContent value="analytics" className="flex-1 overflow-y-auto">
          {renderAnalyticsTab()}
        </TabsContent>
        <TabsContent value="history" className="flex-1 overflow-y-auto">
          {renderHistoryTab()}
        </TabsContent>
        <TabsContent value="scouts" className="flex-1 overflow-y-auto">
          {renderScoutTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
