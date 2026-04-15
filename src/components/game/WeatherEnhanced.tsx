'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

/* ============================================================
   Seeded PRNG — Mulberry32
   ============================================================ */
function mulberry32(seed: number): () => number {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return () => {
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    return (t >>> 0) / 4294967296;
  };
}

/* ============================================================
   Types
   ============================================================ */
type TabKey = 'forecast' | 'impact' | 'history' | 'preparation';

interface WeatherConditionCard {
  key: string;
  name: string;
  icon: string;
  description: string;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
}

interface StatModifier {
  stat: string;
  modifier: number;
}

interface ImpactEntry {
  label: string;
  value: number;
}

interface RadarPoint {
  label: string;
  value: number;
}

interface GearItem {
  name: string;
  readiness: number;
}

interface ScatterPoint {
  temp: number;
  goals: number;
}

interface TimelineMonth {
  month: string;
  weather: string;
  color: string;
}

interface HistoricalMatch {
  id: string;
  opponent: string;
  weather: string;
  result: 'W' | 'D' | 'L';
  goalsFor: number;
  goalsAgainst: number;
  rating: number;
}

interface TrainingSession {
  id: string;
  name: string;
  type: string;
  weatherFocus: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High' | 'Very High';
  effectiveness: number;
  completed: boolean;
}

interface TacticalTip {
  id: string;
  category: string;
  title: string;
  description: string;
  weatherTypes: string[];
}

interface SeasonWeatherStat {
  season: number;
  totalMatches: number;
  winsInBadWeather: number;
  goalsInBadWeather: number;
  avgRating: number;
  worstCondition: string;
  bestCondition: string;
}

/* ============================================================
   Constants — weather condition cards
   ============================================================ */
const WEATHER_CARDS: WeatherConditionCard[] = [
  { key: 'sunny', name: 'Sunny', icon: '☀️', description: 'Clear skies, ideal for attacking football. No stat penalties.', severity: 'none' },
  { key: 'rain', name: 'Rain', icon: '🌧️', description: 'Wet pitch, slippery ball. Passing and shooting accuracy drop.', severity: 'mild' },
  { key: 'wind', name: 'Wind', icon: '💨', description: 'Strong gusts affect long balls, crosses, and shooting.', severity: 'mild' },
  { key: 'snow', name: 'Snow', icon: '❄️', description: 'Heavy snow reduces pace and footing. Stamina drains faster.', severity: 'moderate' },
  { key: 'fog', name: 'Fog', icon: '🌫️', description: 'Low visibility hampers passing range and spatial awareness.', severity: 'moderate' },
  { key: 'storm', name: 'Storm', icon: '⛈️', description: 'Extreme conditions penalize every attribute. Consider tactical changes.', severity: 'severe' },
];

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: 'forecast', label: 'Forecast' },
  { key: 'impact', label: 'Impact' },
  { key: 'history', label: 'History' },
  { key: 'preparation', label: 'Prep' },
];

const PERFORMANCE_STATS: string[] = ['Pace', 'Shooting', 'Passing', 'Defending', 'Physical', 'Mental'];

const RADAR_AXES: string[] = ['Win%', 'Goals', 'Clean Sheets', 'xG', 'Rating'];

const WEATHER_CONDITIONS_HISTORY: string[] = ['Sunny', 'Rain', 'Wind', 'Snow', 'Fog'];

const GEAR_ITEMS: GearItem[] = [
  { name: 'Boots', readiness: 82 },
  { name: 'Gloves', readiness: 65 },
  { name: 'Warm Gear', readiness: 70 },
  { name: 'Wet Gear', readiness: 58 },
  { name: 'Eye Protection', readiness: 45 },
];

const TRAINING_RADAR_AXES: string[] = ['Sprint', 'Agility', 'Ball Control', 'Strength', 'Endurance'];

const MONTH_NAMES: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WIND_DIRECTIONS: string[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const PITCH_CONDITIONS: string[] = [
  'Excellent', 'Good', 'Damp', 'Wet', 'Frozen', 'Muddy', 'Waterlogged',
];

const OPPONENT_NAMES: string[] = [
  'Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man United',
  'Tottenham', 'Newcastle', 'Aston Villa', 'Brighton', 'West Ham',
  'Crystal Palace', 'Wolves', 'Leicester', 'Everton', 'Fulham',
];

const TACTICAL_TIPS: TacticalTip[] = [
  {
    id: 'tip-1',
    category: 'Passing',
    title: 'Shorten Passes in Rain',
    description: 'Keep passes under 15 meters. Wet surfaces cause the ball to skid unpredictably. Focus on one-touch passing in tight spaces to maintain possession.',
    weatherTypes: ['Rain', 'Storm'],
  },
  {
    id: 'tip-2',
    category: 'Shooting',
    title: 'Low Driven Shots in Wind',
    description: 'Keep shots below knee height. High balls get caught by crosswinds. Aim for corners with pace rather than placement.',
    weatherTypes: ['Wind', 'Storm'],
  },
  {
    id: 'tip-3',
    category: 'Pace',
    title: 'Controlled Acceleration on Snow',
    description: 'Avoid sudden changes of direction. Use shorter strides and keep your center of gravity low. Build up speed gradually rather than explosive bursts.',
    weatherTypes: ['Snow'],
  },
  {
    id: 'tip-4',
    category: 'Vision',
    title: 'Vocal Communication in Fog',
    description: 'Rely more on verbal cues from teammates. Maintain closer distances between players. Use the touchline as a visual reference point.',
    weatherTypes: ['Fog'],
  },
  {
    id: 'tip-5',
    category: 'Fitness',
    title: 'Pacing in Extreme Heat',
    description: 'Reduce sprint frequency by 20%. Stay in shaded areas during stoppages. Hydrate at every opportunity. Conserve energy for the final 20 minutes.',
    weatherTypes: ['Storm', 'Snow'],
  },
  {
    id: 'tip-6',
    category: 'Defending',
    title: 'Set Piece Awareness',
    description: 'Wind dramatically affects set piece trajectories. Defenders should account for ball drift. Goalkeepers must adjust positioning for wind-assisted shots.',
    weatherTypes: ['Wind', 'Storm', 'Rain'],
  },
];

const RECOVERY_PROTOCOLS: { name: string; duration: string; description: string; weatherCondition: string }[] = [
  {
    name: 'Cold Water Immersion',
    duration: '10 min',
    description: 'Ice bath after matches in extreme heat to reduce inflammation and speed muscle recovery.',
    weatherCondition: 'Hot',
  },
  {
    name: 'Active Warm-Down',
    duration: '15 min',
    description: 'Light jogging and stretching after cold-weather matches to prevent muscle stiffness and joint pain.',
    weatherCondition: 'Snow',
  },
  {
    name: 'Hydration Protocol',
    duration: 'Ongoing',
    description: 'Electrolyte-rich fluids before, during, and after matches in rainy or humid conditions.',
    weatherCondition: 'Rain',
  },
  {
    name: 'Breathing Exercises',
    duration: '5 min',
    description: 'Controlled breathing techniques to maintain composure during high-stress weather conditions.',
    weatherCondition: 'Storm',
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  none: '#CCFF00',
  mild: '#FF5500',
  moderate: '#FF5500',
  severe: '#ff3333',
};

/* ============================================================
   SVG 1: Temperature Trend Ring
   ============================================================ */
function TemperatureTrendRing({ current, seasonal }: { current: number; seasonal: number }) {
  const cx = 80;
  const cy = 80;
  const r = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * r;
  const normalizedCurrent = Math.max(0, Math.min(100, ((current + 10) / 60) * 100));
  const normalizedSeasonal = Math.max(0, Math.min(100, ((seasonal + 10) / 60) * 100));
  const currentArc = (normalizedCurrent / 100) * circumference;
  const seasonalArc = (normalizedSeasonal / 100) * circumference;

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Temp Trend Ring</p>
      <svg viewBox="0 0 160 160" className="w-full max-w-[160px] mx-auto">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222222" strokeWidth={strokeWidth} />
        {/* Seasonal average ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#333333"
          strokeWidth={strokeWidth}
          strokeDasharray={`${seasonalArc} ${circumference - seasonalArc}`}
          strokeLinecap="round"
          opacity={0.6}
          strokeDashoffset={circumference * 0.25}
        />
        {/* Current temp ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#FF5500"
          strokeWidth={strokeWidth}
          strokeDasharray={`${currentArc} ${circumference - currentArc}`}
          strokeLinecap="round"
          strokeDashoffset={circumference * 0.25}
        />
        {/* Center text */}
        <text x={cx} y={cy - 6} fill="#e8e8e8" fontSize={22} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
          {current}°C
        </text>
        <text x={cx} y={cy + 14} fill="#666666" fontSize={9} textAnchor="middle">
          Season Avg: {seasonal}°C
        </text>
        {/* Legend */}
        <line x1={10} y1={145} x2={22} y2={145} stroke="#FF5500" strokeWidth={3} strokeLinecap="round" />
        <text x={26} y={148} fill="#999999" fontSize={8}>Current</text>
        <line x1={80} y1={145} x2={92} y2={145} stroke="#333333" strokeWidth={3} strokeLinecap="round" />
        <text x={96} y={148} fill="#999999" fontSize={8}>Average</text>
      </svg>
    </div>
  );
}

/* ============================================================
   SVG 2: Weather Distribution Donut
   ============================================================ */
function WeatherDistributionDonut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const cx = 70;
  const cy = 70;
  const r = 48;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const cumulative = segments.reduce<number[]>((acc, seg, i) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(prev);
    return acc;
  }, []);

  const arcData = segments.map((seg, i) => {
    const dashLen = (seg.value / total) * circumference;
    const offset = circumference * 0.25 - cumulative[i];
    return { ...seg, pct: Math.round((seg.value / total) * 100), dashLen, offset };
  });

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Weather Distribution</p>
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 140 140" className="w-auto" style={{ width: 120, height: 120 }}>
          {arcData.map((arc, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={10}
              strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
              opacity={0.85}
            />
          ))}
          <text x={cx} y={cy - 2} fill="#e8e8e8" fontSize={16} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
            {total}
          </text>
          <text x={cx} y={cy + 13} fill="#666666" fontSize={8} textAnchor="middle">
            matches
          </text>
        </svg>
        <div className="flex flex-col gap-1.5">
          {arcData.map((arc, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: arc.color }} />
              <span className="text-[10px] text-text-mid w-12">{arc.label}</span>
              <span className="text-[10px] text-text-bright font-bold">{arc.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SVG 3: Wind Direction Rose
   ============================================================ */
function WindDirectionRose({ windDir, windSpeed }: { windDir: string; windSpeed: number }) {
  const cx = 100;
  const cy = 100;
  const outerR = 72;
  const midR = 45;
  const innerR = 18;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const dirAngles: Record<string, number> = {
    N: -90, NE: -45, E: 0, SE: 45, S: 90, SW: 135, W: 180, NW: -135,
  };

  const angle = ((dirAngles[windDir] ?? 0) * Math.PI) / 180;
  const endX = cx + midR * Math.cos(angle);
  const endY = cy + midR * Math.sin(angle);

  const headLen = 10;
  const headW = 5;
  const leftX = endX - headLen * Math.cos(angle) + headW * Math.sin(angle);
  const leftY = endY - headLen * Math.sin(angle) - headW * Math.cos(angle);
  const rightX = endX - headLen * Math.cos(angle) - headW * Math.sin(angle);
  const rightY = endY - headLen * Math.sin(angle) + headW * Math.cos(angle);

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Wind Rose</p>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        {/* Outer circle */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#222222" strokeWidth={1.5} />
        {/* Mid circle */}
        <circle cx={cx} cy={cy} r={midR} fill="none" stroke="#1a1a1a" strokeWidth={1} />
        {/* Inner circle */}
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#1a1a1a" strokeWidth={1} />
        {/* Cross lines */}
        <line x1={cx} y1={cy - outerR} x2={cx} y2={cy + outerR} stroke="#1a1a1a" strokeWidth={0.5} />
        <line x1={cx - outerR} y1={cy} x2={cx + outerR} y2={cy} stroke="#1a1a1a" strokeWidth={0.5} />
        {/* Diagonal lines */}
        <line x1={cx - outerR * 0.707} y1={cy - outerR * 0.707} x2={cx + outerR * 0.707} y2={cy + outerR * 0.707} stroke="#1a1a1a" strokeWidth={0.5} />
        <line x1={cx + outerR * 0.707} y1={cy - outerR * 0.707} x2={cx - outerR * 0.707} y2={cy + outerR * 0.707} stroke="#1a1a1a" strokeWidth={0.5} />
        {/* Direction labels */}
        {directions.map((dir, i) => {
          const a = ((i * 45 - 90) * Math.PI) / 180;
          const lx = cx + (outerR + 12) * Math.cos(a);
          const ly = cy + (outerR + 12) * Math.sin(a);
          const isMain = dir.length === 1;
          return (
            <text
              key={dir}
              x={lx} y={ly + 3}
              fill={isMain ? '#e8e8e8' : '#666666'}
              fontSize={isMain ? 10 : 7}
              fontWeight={isMain ? 'bold' : 'normal'}
              textAnchor="middle"
            >
              {dir}
            </text>
          );
        })}
        {/* Tick marks */}
        {directions.map((dir) => {
          const a = ((dirAngles[dir] ?? 0) * Math.PI) / 180;
          const x1 = cx + (outerR - 4) * Math.cos(a);
          const y1 = cy + (outerR - 4) * Math.sin(a);
          const x2 = cx + outerR * Math.cos(a);
          const y2 = cy + outerR * Math.sin(a);
          return <line key={dir} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333333" strokeWidth={1.5} />;
        })}
        {/* Wind arrow */}
        <line x1={cx} y1={cy} x2={endX} y2={endY} stroke="#00E5FF" strokeWidth={2.5} strokeLinecap="round" />
        <polygon points={`${endX},${endY} ${leftX},${leftY} ${rightX},${rightY}`} fill="#00E5FF" />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="#000000" stroke="#00E5FF" strokeWidth={1.5} />
        {/* Speed label */}
        <text x={cx} y={cy + outerR + 28} fill="#00E5FF" fontSize={11} fontWeight="bold" textAnchor="middle">
          {windSpeed} km/h {windDir}
        </text>
      </svg>
    </div>
  );
}

/* ============================================================
   SVG 4: Performance Impact Bars
   ============================================================ */
function PerformanceImpactBars({ modifiers }: { modifiers: { stat: string; modifier: number }[] }) {
  const barHeight = 10;
  const gap = 22;
  const startY = 8;
  const labelWidth = 70;
  const valueWidth = 40;
  const barAreaWidth = 160;
  const maxAbs = Math.max(20, ...modifiers.map((m) => Math.abs(m.modifier)));

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Performance Impact</p>
      <svg viewBox="0 0 280 200" className="w-full">
        {modifiers.map((m, i) => {
          const y = startY + i * gap;
          const isNegative = m.modifier < 0;
          const barWidth = Math.max(2, (Math.abs(m.modifier) / maxAbs) * barAreaWidth);
          const color = isNegative ? '#FF5500' : '#CCFF00';

          return (
            <g key={m.stat}>
              {/* Label */}
              <text x={labelWidth - 4} y={y + barHeight / 2 + 3} fill="#999999" fontSize={9} textAnchor="end">
                {m.stat}
              </text>
              {/* Background bar */}
              <rect x={labelWidth} y={y} width={barAreaWidth} height={barHeight} rx={3} fill="#1a1a1a" />
              {/* Value bar */}
              <rect x={labelWidth} y={y} width={barWidth} height={barHeight} rx={3} fill={color} opacity={0.8} />
              {/* Modifier text */}
              <text
                x={labelWidth + barAreaWidth + 6}
                y={y + barHeight / 2 + 3}
                fill={isNegative ? '#FF5500' : '#CCFF00'}
                fontSize={9}
                fontWeight="bold"
              >
                {m.modifier > 0 ? '+' : ''}{m.modifier}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   SVG 5: Weather vs Results Radar
   ============================================================ */
function WeatherVsResultsRadar({ axes }: { axes: RadarPoint[] }) {
  const cx = 100;
  const cy = 100;
  const maxR = 70;
  const count = axes.length;
  const angleStep = (2 * Math.PI) / count;

  /* Grid polygons */
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const pointStr = axes
    .map((a, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (a.value / 100) * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(' ');

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Weather vs Results</p>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        {/* Grid polygons */}
        {gridLevels.map((level, li) => {
          const pts = axes
            .map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = maxR * level;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            })
            .join(' ');
          return <polygon key={li} points={pts} fill="none" stroke="#1a1a1a" strokeWidth={0.5} />;
        })}
        {/* Axis lines */}
        {axes.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={cx + maxR * Math.cos(angle)}
              y2={cy + maxR * Math.sin(angle)}
              stroke="#1a1a1a" strokeWidth={0.5}
            />
          );
        })}
        {/* Data polygon */}
        <polygon points={pointStr} fill="#CCFF00" opacity={0.12} stroke="#CCFF00" strokeWidth={1.5} />
        {/* Data points */}
        {axes.map((a, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const r = (a.value / 100) * maxR;
          return (
            <circle
              key={i}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r={3}
              fill="#000000"
              stroke="#CCFF00"
              strokeWidth={1.5}
            />
          );
        })}
        {/* Labels */}
        {axes.map((a, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const lx = cx + (maxR + 16) * Math.cos(angle);
          const ly = cy + (maxR + 16) * Math.sin(angle);
          return (
            <text key={i} x={lx} y={ly + 3} fill="#999999" fontSize={8} textAnchor="middle">
              {a.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   SVG 6: Tactical Adjustment Gauge
   ============================================================ */
function TacticalAdjustmentGauge({ value }: { value: number }) {
  const cx = 110;
  const cy = 90;
  const r = 72;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalAngle = endAngle - startAngle + 2 * Math.PI;

  const valueAngle = startAngle + (value / 100) * totalAngle;
  const needleLen = r - 8;
  const nx = cx + needleLen * Math.cos(valueAngle);
  const ny = cy - needleLen * Math.sin(valueAngle);

  const arcPath = (startA: number, endA: number) => {
    const x1 = cx + r * Math.cos(startA);
    const y1 = cy - r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA);
    const y2 = cy - r * Math.sin(endA);
    const largeArc = endA - startA > Math.PI ? 1 : 0;
    return `M ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2}`;
  };

  /* Zones */
  const zones = [
    { start: 0, end: 30, color: '#CCFF00', label: 'Low' },
    { start: 30, end: 60, color: '#FF5500', label: 'Medium' },
    { start: 60, end: 100, color: '#ff3333', label: 'High' },
  ];

  const zonePaths = zones.map((zone) => {
    const zStart = startAngle + (zone.start / 100) * totalAngle;
    const zEnd = startAngle + (zone.end / 100) * totalAngle;
    return { ...zone, path: arcPath(zStart, zEnd) };
  });

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Tactical Adjustment</p>
      <svg viewBox="0 0 220 130" className="w-full max-w-[200px] mx-auto">
        {/* Background arc */}
        <path d={arcPath(startAngle, startAngle + totalAngle)} fill="none" stroke="#1a1a1a" strokeWidth={10} strokeLinecap="round" />
        {/* Zone arcs */}
        {zonePaths.map((zone, i) => (
          <path
            key={i}
            d={zone.path}
            fill="none"
            stroke={zone.color}
            strokeWidth={10}
            strokeLinecap="butt"
            opacity={0.35}
          />
        ))}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#00E5FF" strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="#000000" stroke="#00E5FF" strokeWidth={1.5} />
        {/* Value text */}
        <text x={cx} y={cy + 20} fill="#00E5FF" fontSize={20} fontWeight="bold" textAnchor="middle">
          {value}%
        </text>
        <text x={cx} y={cy + 32} fill="#666666" fontSize={8} textAnchor="middle">
          adjustment needed
        </text>
        {/* Scale labels */}
        <text x={cx - r - 2} y={cy + 16} fill="#666666" fontSize={7} textAnchor="middle">0</text>
        <text x={cx + r + 2} y={cy + 16} fill="#666666" fontSize={7} textAnchor="middle">100</text>
      </svg>
    </div>
  );
}

/* ============================================================
   SVG 7: Weather Win Rate Bars
   ============================================================ */
function WeatherWinRateBars({ data }: { data: { condition: string; winRate: number; matches: number }[] }) {
  const barHeight = 12;
  const gap = 28;
  const startY = 10;
  const labelWidth = 44;
  const valueWidth = 50;
  const barAreaWidth = 150;

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Win Rate by Condition</p>
      <svg viewBox="0 0 280 200" className="w-full">
        {data.map((d, i) => {
          const y = startY + i * gap;
          const barWidth = Math.max(2, (d.winRate / 100) * barAreaWidth);
          const isHigh = d.winRate >= 60;
          const color = isHigh ? '#CCFF00' : d.winRate >= 40 ? '#FF5500' : '#ff3333';

          return (
            <g key={d.condition}>
              <text x={labelWidth - 4} y={y + barHeight / 2 + 3} fill="#999999" fontSize={9} textAnchor="end">
                {d.condition}
              </text>
              <rect x={labelWidth} y={y} width={barAreaWidth} height={barHeight} rx={3} fill="#1a1a1a" />
              <rect x={labelWidth} y={y} width={barWidth} height={barHeight} rx={3} fill={color} opacity={0.8} />
              <text x={labelWidth + barAreaWidth + 6} y={y + barHeight / 2 + 3} fill="#e8e8e8" fontSize={9} fontWeight="bold">
                {d.winRate}% ({d.matches})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   SVG 8: Seasonal Weather Timeline
   ============================================================ */
function SeasonalWeatherTimeline({ months }: { months: TimelineMonth[] }) {
  const startX = 20;
  const endX = 280;
  const lineY = 80;
  const dotR = 7;

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Seasonal Weather Timeline</p>
      <svg viewBox="0 0 300 120" className="w-full">
        {/* Timeline line */}
        <line x1={startX} y1={lineY} x2={endX} y2={lineY} stroke="#222222" strokeWidth={2} />
        {/* Month dots and labels */}
        {months.map((m, i) => {
          const x = startX + (i / (months.length - 1)) * (endX - startX);
          return (
            <g key={m.month}>
              {/* Vertical tick */}
              <line x1={x} y1={lineY - 3} x2={x} y2={lineY + 3} stroke="#333333" strokeWidth={1} />
              {/* Dot */}
              <circle cx={x} cy={lineY} r={dotR} fill={m.color} opacity={0.8} />
              {/* Month label */}
              <text x={x} y={lineY + 20} fill="#666666" fontSize={8} textAnchor="middle">
                {m.month}
              </text>
              {/* Weather icon label */}
              <text x={x} y={lineY - 16} fill="#999999" fontSize={9} textAnchor="middle">
                {m.weather}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 px-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#CCFF00' }} />
          <span className="text-[9px] text-text-dim">Sunny</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#00E5FF' }} />
          <span className="text-[9px] text-text-dim">Rain</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#FF5500' }} />
          <span className="text-[9px] text-text-dim">Wind</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#666666' }} />
          <span className="text-[9px] text-text-dim">Snow</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#999999' }} />
          <span className="text-[9px] text-text-dim">Fog</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SVG 9: Goals Per Condition Scatter
   ============================================================ */
function GoalsPerConditionScatter({ points }: { points: ScatterPoint[] }) {
  const padL = 35;
  const padR = 15;
  const padT = 15;
  const padB = 30;
  const chartW = 220;
  const chartH = 120;
  const cw = padL + chartW + padR;
  const ch = padT + chartH + padB;

  const minTemp = -5;
  const maxTemp = 40;
  const maxGoals = Math.max(5, ...points.map((p) => p.goals)) + 1;

  const toX = (temp: number) => padL + ((temp - minTemp) / (maxTemp - minTemp)) * chartW;
  const toY = (goals: number) => padT + chartH - (goals / maxGoals) * chartH;

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Goals vs Temperature</p>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full">
        {/* Grid */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = padT + (i / 4) * chartH;
          return <line key={`gh-${i}`} x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#1a1a1a" strokeWidth={0.5} />;
        })}
        {Array.from({ length: 6 }, (_, i) => {
          const x = padL + (i / 5) * chartW;
          return <line key={`gv-${i}`} x1={x} y1={padT} x2={x} y2={padT + chartH} stroke="#1a1a1a" strokeWidth={0.5} />;
        })}
        {/* Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#222222" strokeWidth={1} />
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#222222" strokeWidth={1} />
        {/* Y labels */}
        {Array.from({ length: 5 }, (_, i) => {
          const val = Math.round(maxGoals - (i / 4) * maxGoals);
          const y = padT + (i / 4) * chartH;
          return (
            <text key={`yl-${i}`} x={padL - 4} y={y + 3} fill="#666666" fontSize={7} textAnchor="end">
              {val}
            </text>
          );
        })}
        {/* X labels */}
        {Array.from({ length: 6 }, (_, i) => {
          const val = Math.round(minTemp + (i / 5) * (maxTemp - minTemp));
          const x = padL + (i / 5) * chartW;
          return (
            <text key={`xl-${i}`} x={x} y={padT + chartH + 16} fill="#666666" fontSize={7} textAnchor="middle">
              {val}°C
            </text>
          );
        })}
        {/* Scatter dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(p.temp)}
            cy={toY(p.goals)}
            r={4}
            fill="#00E5FF"
            opacity={0.75}
          />
        ))}
        {/* Axis titles */}
        <text x={padL + chartW / 2} y={ch - 2} fill="#666666" fontSize={7} textAnchor="middle">
          Temperature (°C)
        </text>
        <text x={6} y={padT + chartH / 2} fill="#666666" fontSize={7} textAnchor="middle" dominantBaseline="central">
          Goals
        </text>
      </svg>
    </div>
  );
}

/* ============================================================
   SVG 10: Adaptation Progress Ring
   ============================================================ */
function AdaptationProgressRing({ level }: { level: number }) {
  const cx = 80;
  const cy = 80;
  const r = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * r;
  const arcLen = (level / 100) * circumference;

  const label = level >= 80 ? 'Excellent' : level >= 60 ? 'Good' : level >= 40 ? 'Moderate' : 'Needs Work';
  const labelColor = level >= 80 ? '#CCFF00' : level >= 60 ? '#00E5FF' : level >= 40 ? '#FF5500' : '#ff3333';

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Adaptation Level</p>
      <svg viewBox="0 0 160 160" className="w-full max-w-[150px] mx-auto">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222222" strokeWidth={strokeWidth} />
        {/* Progress ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#CCFF00"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLen} ${circumference - arcLen}`}
          strokeLinecap="round"
          strokeDashoffset={circumference * 0.25}
        />
        {/* Center text */}
        <text x={cx} y={cy - 6} fill="#e8e8e8" fontSize={26} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
          {level}
        </text>
        <text x={cx} y={cy + 14} fill={labelColor} fontSize={9} fontWeight="bold" textAnchor="middle">
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ============================================================
   SVG 11: Gear Readiness Bars
   ============================================================ */
function GearReadinessBars({ gear }: { gear: GearItem[] }) {
  const barHeight = 12;
  const gap = 28;
  const startY = 10;
  const labelWidth = 90;
  const valueWidth = 40;
  const barAreaWidth = 120;

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Gear Readiness</p>
      <svg viewBox="0 0 280 200" className="w-full">
        {gear.map((g, i) => {
          const y = startY + i * gap;
          const barWidth = Math.max(2, (g.readiness / 100) * barAreaWidth);
          const color = g.readiness >= 75 ? '#CCFF00' : g.readiness >= 50 ? '#FF5500' : '#ff3333';

          return (
            <g key={g.name}>
              <text x={labelWidth - 4} y={y + barHeight / 2 + 3} fill="#999999" fontSize={9} textAnchor="end">
                {g.name}
              </text>
              <rect x={labelWidth} y={y} width={barAreaWidth} height={barHeight} rx={3} fill="#1a1a1a" />
              <rect x={labelWidth} y={y} width={barWidth} height={barHeight} rx={3} fill={color} opacity={0.8} />
              <text x={labelWidth + barAreaWidth + 6} y={y + barHeight / 2 + 3} fill="#e8e8e8" fontSize={9} fontWeight="bold">
                {g.readiness}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   SVG 12: Training Effectiveness Radar
   ============================================================ */
function TrainingEffectivenessRadar({ axes }: { axes: RadarPoint[] }) {
  const cx = 100;
  const cy = 100;
  const maxR = 70;
  const count = axes.length;
  const angleStep = (2 * Math.PI) / count;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const pointStr = axes
    .map((a, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (a.value / 100) * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(' ');

  return (
    <div className="bg-surface-2 border border-border-web3 p-4">
      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">Training Effectiveness</p>
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        {/* Grid */}
        {gridLevels.map((level, li) => {
          const pts = axes
            .map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const r = maxR * level;
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            })
            .join(' ');
          return <polygon key={li} points={pts} fill="none" stroke="#1a1a1a" strokeWidth={0.5} />;
        })}
        {/* Axis lines */}
        {axes.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={cx + maxR * Math.cos(angle)}
              y2={cy + maxR * Math.sin(angle)}
              stroke="#1a1a1a" strokeWidth={0.5}
            />
          );
        })}
        {/* Data polygon */}
        <polygon points={pointStr} fill="#00E5FF" opacity={0.12} stroke="#00E5FF" strokeWidth={1.5} />
        {/* Data points */}
        {axes.map((a, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const r = (a.value / 100) * maxR;
          return (
            <circle
              key={i}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r={3}
              fill="#000000"
              stroke="#00E5FF"
              strokeWidth={1.5}
            />
          );
        })}
        {/* Labels */}
        {axes.map((a, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const lx = cx + (maxR + 18) * Math.cos(angle);
          const ly = cy + (maxR + 18) * Math.sin(angle);
          return (
            <g key={i}>
              <text x={lx} y={ly + 3} fill="#999999" fontSize={8} textAnchor="middle">
                {a.label}
              </text>
              <text x={lx} y={ly + 13} fill="#00E5FF" fontSize={8} fontWeight="bold" textAnchor="middle">
                {a.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   Helper: Get temperature display color
   ============================================================ */
function getTempDisplayColor(temp: number): string {
  if (temp >= 30) return 'text-electric-orange';
  if (temp >= 20) return 'text-neon-lime';
  if (temp >= 10) return 'text-cyan-accent';
  if (temp >= 0) return 'text-text-bright';
  return 'text-[#999999]';
}

function getPitchDisplayColor(cond: string): string {
  switch (cond) {
    case 'Excellent': return 'text-neon-lime';
    case 'Good': return 'text-neon-lime';
    case 'Damp': return 'text-cyan-accent';
    case 'Wet': return 'text-electric-orange';
    case 'Frozen': return 'text-text-bright';
    case 'Muddy': return 'text-electric-orange';
    case 'Waterlogged': return 'text-[#ff3333]';
    default: return 'text-text-mid';
  }
}

function getHumidityDisplayColor(h: number): string {
  if (h >= 85) return 'text-[#ff3333]';
  if (h >= 70) return 'text-electric-orange';
  if (h >= 55) return 'text-cyan-accent';
  return 'text-neon-lime';
}

function getWindDisplayColor(speed: number): string {
  if (speed >= 60) return 'text-[#ff3333]';
  if (speed >= 40) return 'text-electric-orange';
  if (speed >= 20) return 'text-cyan-accent';
  return 'text-neon-lime';
}

function getWindDescriptor(speed: number): string {
  if (speed >= 60) return 'Gale Force';
  if (speed >= 40) return 'Strong';
  if (speed >= 20) return 'Moderate';
  if (speed >= 10) return 'Light Breeze';
  return 'Calm';
}

/* ============================================================
   Tab 1: Forecast Content
   ============================================================ */
function ForecastTab({ season, week }: { season: number; week: number }) {
  const rng = mulberry32(season * 1000 + week * 7);

  const currentTemp = Math.round(rng() * 35 - 5);
  const seasonalAvg = Math.round(rng() * 20 + 5);
  const windSpeed = Math.round(rng() * 65 + 5);
  const humidity = Math.round(rng() * 55 + 30);
  const windDir = WIND_DIRECTIONS[Math.floor(rng() * WIND_DIRECTIONS.length)];
  const pitchCondition = PITCH_CONDITIONS[Math.floor(rng() * PITCH_CONDITIONS.length)];
  const visibility = Math.round(rng() * 18 + 2);
  const pressure = Math.round(rng() * 40 + 990);

  const donutSegments = WEATHER_CARDS.map((w) => ({
    label: w.name,
    value: Math.round(rng() * 30 + 5),
    color: ['#CCFF00', '#00E5FF', '#FF5500', '#666666', '#999999', '#FF5500'][WEATHER_CARDS.indexOf(w)] ?? '#666666',
  }));

  const weeklyForecast = Array.from({ length: 7 }, (_, i) => {
    const dayRng = mulberry32(season * 1000 + week * 7 + i + 100);
    const dayTemp = Math.round(dayRng() * 30 - 5);
    const dayWeather = WEATHER_CARDS[Math.floor(dayRng() * WEATHER_CARDS.length)];
    return {
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      temp: dayTemp,
      weather: dayWeather,
      wind: Math.round(dayRng() * 50 + 5),
    };
  });

  return (
    <div className="space-y-3">
      {/* Current conditions summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-2 border border-border-web3 p-3 text-center">
          <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Temperature</p>
          <p className={`text-xl font-bold ${getTempDisplayColor(currentTemp)}`}>{currentTemp}°C</p>
        </div>
        <div className="bg-surface-2 border border-border-web3 p-3 text-center">
          <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Wind</p>
          <p className="text-xl font-bold text-cyan-accent">{windSpeed}<span className="text-[10px] text-text-dim ml-0.5">km/h</span></p>
        </div>
        <div className="bg-surface-2 border border-border-web3 p-3 text-center">
          <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Humidity</p>
          <p className={`text-xl font-bold ${getHumidityDisplayColor(humidity)}`}>{humidity}%</p>
        </div>
      </div>

      {/* Pitch condition and wind */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Pitch Condition</p>
            <p className={`text-sm font-bold ${getPitchDisplayColor(pitchCondition)}`}>{pitchCondition}</p>
          </div>
          <div>
            <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Wind</p>
            <p className={`text-sm font-bold ${getWindDisplayColor(windSpeed)}`}>
              {windSpeed} km/h {windDir} ({getWindDescriptor(windSpeed)})
            </p>
          </div>
          <div>
            <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Visibility</p>
            <p className="text-sm font-bold text-text-bright">{visibility} km</p>
          </div>
          <div>
            <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Pressure</p>
            <p className="text-sm font-bold text-text-bright">{pressure} hPa</p>
          </div>
        </div>
      </div>

      {/* 7-day mini forecast */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-3">7-Day Forecast</p>
        <div className="grid grid-cols-7 gap-1">
          {weeklyForecast.map((day) => (
            <div key={day.day} className="bg-surface-3 p-2 text-center">
              <p className="text-[8px] text-text-dim uppercase mb-1">{day.day}</p>
              <span className="text-sm block mb-1">{day.weather.icon}</span>
              <p className={`text-[11px] font-bold ${getTempDisplayColor(day.temp)}`}>{day.temp}°</p>
              <p className="text-[8px] text-text-dim mt-0.5">{day.wind} km/h</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weather condition cards */}
      <div className="grid grid-cols-2 gap-2">
        {WEATHER_CARDS.map((wc) => {
          const severityBadge = wc.severity === 'none'
            ? 'bg-[#1a2e1a] text-neon-lime'
            : wc.severity === 'mild'
              ? 'bg-[#2e2a1a] text-electric-orange'
              : wc.severity === 'moderate'
                ? 'bg-[#2e1a1a] text-electric-orange'
                : 'bg-[#2e1a1a] text-[#ff3333]';

          return (
            <div
              key={wc.key}
              className="bg-surface-2 border border-border-web3 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{wc.icon}</span>
                <span className="text-xs font-bold text-text-bright">{wc.name}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 ${severityBadge}`}>
                  {wc.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed">{wc.description}</p>
            </div>
          );
        })}
      </div>

      {/* SVG 1: Temperature Trend Ring */}
      <TemperatureTrendRing current={currentTemp} seasonal={seasonalAvg} />

      {/* SVG 2: Weather Distribution Donut */}
      <WeatherDistributionDonut segments={donutSegments} />

      {/* SVG 3: Wind Direction Rose */}
      <WindDirectionRose windDir={windDir} windSpeed={windSpeed} />
    </div>
  );
}

/* ============================================================
   Tab 2: Impact Content
   ============================================================ */
function ImpactTab({ season, week }: { season: number; week: number }) {
  const rng = mulberry32(season * 2000 + week * 13);

  const currentWeatherIndex = Math.floor(rng() * WEATHER_CARDS.length);
  const currentWeather = WEATHER_CARDS[currentWeatherIndex];

  const modifiers: StatModifier[] = PERFORMANCE_STATS.map((stat) => {
    const baseMod = stat === 'Mental' ? -2 : stat === 'Physical' ? -5 : stat === 'Shooting' ? -10 : -8;
    const variance = Math.round((rng() - 0.5) * 14);
    return { stat, modifier: baseMod + variance };
  });

  const radarAxes: RadarPoint[] = RADAR_AXES.map((label) => ({
    label,
    value: Math.round(30 + rng() * 50),
  }));

  const tacticalAdjustment = Math.round(20 + rng() * 65);

  const impactCards = WEATHER_CARDS.map((wc) => {
    const impacts: { label: string; value: string; negative: boolean }[] = [];
    if (wc.severity !== 'none') {
      const paceMod = Math.round(rng() * 15 + 3);
      const passMod = Math.round(rng() * 12 + 2);
      impacts.push({ label: 'Pace', value: `-${paceMod}%`, negative: true });
      impacts.push({ label: 'Passing', value: `-${passMod}%`, negative: true });
      impacts.push({ label: 'Shooting', value: `-${Math.round(rng() * 10 + 2)}%`, negative: true });
      if (wc.severity === 'moderate' || wc.severity === 'severe') {
        impacts.push({ label: 'Physical', value: `-${Math.round(rng() * 12 + 3)}%`, negative: true });
        impacts.push({ label: 'Mental', value: `-${Math.round(rng() * 8 + 1)}%`, negative: true });
      }
      if (wc.severity === 'severe') {
        const fatigueMod = Math.round(rng() * 15 + 10);
        impacts.push({ label: 'Fatigue', value: `+${fatigueMod}%`, negative: true });
      }
    } else {
      impacts.push({ label: 'All Stats', value: 'Normal', negative: false });
      impacts.push({ label: 'Morale', value: '+5%', negative: false });
    }
    return { card: wc, impacts };
  });

  const teamTacticImpact = {
    possessionChange: Math.round((rng() - 0.5) * 20),
    pressingIntensity: Math.round(rng() * -15 - 5),
    crossingAccuracy: Math.round(rng() * -20 - 5),
    setPieceSuccess: Math.round((rng() - 0.5) * 16),
    counterAttackThreat: Math.round(rng() * -12 - 3),
    longBallAccuracy: Math.round(rng() * -25 - 5),
  };

  return (
    <div className="space-y-3">
      {/* Current weather impact header */}
      <div className="bg-surface-2 border border-border-web3 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{currentWeather.icon}</span>
          <div>
            <p className="text-sm font-bold text-text-bright">{currentWeather.name} Impact</p>
            <p className="text-[10px] text-text-dim">How {currentWeather.name.toLowerCase()} conditions affect your game</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-3 p-2 text-center">
            <p className="text-[9px] text-text-dim uppercase">Overall</p>
            <p className="text-sm font-bold text-electric-orange">
              -{Math.round(rng() * 10 + 3)}%
            </p>
          </div>
          <div className="bg-surface-3 p-2 text-center">
            <p className="text-[9px] text-text-dim uppercase">Risk Level</p>
            <p className="text-sm font-bold text-electric-orange">
              {currentWeather.severity === 'none' ? 'Low' : currentWeather.severity === 'mild' ? 'Medium' : 'High'}
            </p>
          </div>
          <div className="bg-surface-3 p-2 text-center">
            <p className="text-[9px] text-text-dim uppercase">Adjustment</p>
            <p className="text-sm font-bold text-cyan-accent">
              {tacticalAdjustment}%
            </p>
          </div>
        </div>
      </div>

      {/* Impact cards per weather type */}
      <div className="grid grid-cols-2 gap-2">
        {impactCards.map(({ card, impacts }) => (
          <div key={card.key} className="bg-surface-2 border border-border-web3 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{card.icon}</span>
              <span className="text-xs font-bold text-text-bright">{card.name}</span>
            </div>
            <div className="space-y-1">
              {impacts.map((imp) => (
                <div key={imp.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-text-dim">{imp.label}</span>
                  <span className={`text-[10px] font-bold ${imp.negative ? 'text-electric-orange' : 'text-neon-lime'}`}>
                    {imp.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SVG 4: Performance Impact Bars */}
      <PerformanceImpactBars modifiers={modifiers} />

      {/* SVG 5: Weather vs Results Radar */}
      <WeatherVsResultsRadar axes={radarAxes} />

      {/* SVG 6: Tactical Adjustment Gauge */}
      <TacticalAdjustmentGauge value={tacticalAdjustment} />

      {/* Team tactical impact panel */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <p className="text-xs font-bold text-text-bright mb-3">Team Tactical Impact</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(teamTacticImpact).map(([key, val]) => {
            const displayLabel = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (s) => s.toUpperCase());
            const isPositive = val > 0;
            return (
              <div key={key} className="bg-surface-3 p-2.5 flex items-center justify-between">
                <span className="text-[10px] text-text-dim">{displayLabel}</span>
                <span className={`text-[11px] font-bold ${isPositive ? 'text-neon-lime' : 'text-electric-orange'}`}>
                  {isPositive ? '+' : ''}{val}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tactical tips section */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <p className="text-xs font-bold text-text-bright mb-3">Tactical Tips</p>
        <div className="space-y-2">
          {TACTICAL_TIPS.filter((tip) =>
            tip.weatherTypes.some((wt) =>
              wt.toLowerCase().includes(currentWeather.name.toLowerCase()) ||
              currentWeather.name.toLowerCase().includes(wt.toLowerCase())
            )
          ).slice(0, 3).map((tip) => (
            <div key={tip.id} className="bg-surface-3 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 bg-[#1a1a2e] text-cyan-accent`}>
                  {tip.category}
                </span>
                <span className="text-[11px] font-bold text-text-bright">{tip.title}</span>
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed">{tip.description}</p>
              <div className="flex gap-1 mt-2">
                {tip.weatherTypes.map((wt) => (
                  <span key={wt} className="text-[8px] px-1.5 py-0.5 bg-[#1a1a1a] text-text-mid border border-border-web3">
                    {wt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Tab 3: History Content
   ============================================================ */
function HistoryTab({ season, week }: { season: number; week: number }) {
  const rng = mulberry32(season * 3000 + week * 19);

  const winRateData = WEATHER_CONDITIONS_HISTORY.map((condition) => ({
    condition,
    winRate: Math.round(25 + rng() * 45),
    matches: Math.round(rng() * 30 + 5),
  }));

  const weatherIcons: Record<string, string> = {
    Sunny: '#CCFF00',
    Rain: '#00E5FF',
    Wind: '#FF5500',
    Snow: '#666666',
    Fog: '#999999',
  };

  const timelineMonths: TimelineMonth[] = MONTH_NAMES.map((month) => {
    const weathers = ['Sunny', 'Rain', 'Wind', 'Snow', 'Fog'];
    const w = weathers[Math.floor(rng() * weathers.length)];
    return { month, weather: w, color: weatherIcons[w] ?? '#666666' };
  });

  const scatterPoints: ScatterPoint[] = Array.from({ length: 10 }, () => ({
    temp: Math.round(rng() * 40 - 5),
    goals: Math.round(rng() * 5),
  }));

  const historyCards = WEATHER_CONDITIONS_HISTORY.map((condition) => {
    const played = Math.round(rng() * 25 + 5);
    const won = Math.round(played * (0.25 + rng() * 0.45));
    const drawn = Math.round((played - won) * (0.2 + rng() * 0.3));
    const lost = Math.max(0, played - won - drawn);
    const goalsFor = Math.round(played * (0.8 + rng() * 1.5));
    const goalsAgainst = Math.round(played * (0.6 + rng() * 1.2));
    const avgRating = Math.round((5.0 + rng() * 3.0) * 10) / 10;
    const cleanSheets = Math.round(played * (0.1 + rng() * 0.25));
    return { condition, played, won, drawn, lost, goalsFor, goalsAgainst, avgRating, cleanSheets };
  });

  const overallWinRate = Math.round(
    historyCards.reduce((sum, h) => sum + h.won, 0) /
    Math.max(1, historyCards.reduce((sum, h) => sum + h.played, 0)) * 100
  );

  const recentMatches: HistoricalMatch[] = Array.from({ length: 8 }, (_, i) => {
    const mRng = mulberry32(season * 3000 + week * 19 + i * 7);
    const weatherType = WEATHER_CONDITIONS_HISTORY[Math.floor(mRng() * WEATHER_CONDITIONS_HISTORY.length)];
    const resultRoll = mRng();
    const result: 'W' | 'D' | 'L' = resultRoll > 0.55 ? 'W' : resultRoll > 0.3 ? 'D' : 'L';
    return {
      id: `match-${i}`,
      opponent: OPPONENT_NAMES[Math.floor(mRng() * OPPONENT_NAMES.length)],
      weather: weatherType,
      result,
      goalsFor: Math.round(mRng() * 4),
      goalsAgainst: Math.round(mRng() * 3),
      rating: Math.round((5.0 + mRng() * 4.0) * 10) / 10,
    };
  });

  const seasonStats: SeasonWeatherStat[] = Array.from({ length: 3 }, (_, i) => {
    const sRng = mulberry32(season * 3000 + i * 31);
    const total = Math.round(sRng() * 15 + 10);
    return {
      season: season - i,
      totalMatches: total,
      winsInBadWeather: Math.round(total * (0.2 + sRng() * 0.35)),
      goalsInBadWeather: Math.round(total * (0.6 + sRng() * 1.2)),
      avgRating: Math.round((5.5 + sRng() * 2.5) * 10) / 10,
      worstCondition: WEATHER_CONDITIONS_HISTORY[Math.floor(sRng() * WEATHER_CONDITIONS_HISTORY.length)],
      bestCondition: WEATHER_CONDITIONS_HISTORY[Math.floor(sRng() * WEATHER_CONDITIONS_HISTORY.length)],
    };
  });

  return (
    <div className="space-y-3">
      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-2 border border-border-web3 p-3 text-center">
          <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Total Matches</p>
          <p className="text-xl font-bold text-text-bright">
            {historyCards.reduce((s, h) => s + h.played, 0)}
          </p>
        </div>
        <div className="bg-surface-2 border border-border-web3 p-3 text-center">
          <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Overall Win%</p>
          <p className="text-xl font-bold text-neon-lime">{overallWinRate}%</p>
        </div>
        <div className="bg-surface-2 border border-border-web3 p-3 text-center">
          <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Total Goals</p>
          <p className="text-xl font-bold text-cyan-accent">
            {historyCards.reduce((s, h) => s + h.goalsFor, 0)}
          </p>
        </div>
      </div>

      {/* Recent matches list */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <p className="text-xs font-bold text-text-bright mb-3">Recent Matches by Weather</p>
        <div className="space-y-1.5">
          {recentMatches.map((m) => {
            const resultColor = m.result === 'W' ? 'text-neon-lime' : m.result === 'D' ? 'text-text-mid' : 'text-electric-orange';
            const resultBg = m.result === 'W' ? 'bg-[#1a2e1a]' : m.result === 'D' ? 'bg-[#1a1a2e]' : 'bg-[#2e1a1a]';
            return (
              <div key={m.id} className={`${resultBg} p-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold w-5 ${resultColor}`}>{m.result}</span>
                  <div>
                    <p className="text-[10px] font-bold text-text-bright">{m.opponent}</p>
                    <p className="text-[9px] text-text-dim">{m.weather}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-text-bright">{m.goalsFor}-{m.goalsAgainst}</p>
                  <p className="text-[9px] text-text-dim">{m.rating}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History cards per condition */}
      <div className="space-y-2">
        {historyCards.map((h) => (
          <div key={h.condition} className="bg-surface-2 border border-border-web3 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-text-bright">{h.condition}</p>
              <p className="text-[10px] text-text-dim">{h.played} matches</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <p className="text-sm font-bold text-neon-lime">{h.won}</p>
                <p className="text-[8px] text-text-dim uppercase">Won</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-text-mid">{h.drawn}</p>
                <p className="text-[8px] text-text-dim uppercase">Drawn</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-electric-orange">{h.lost}</p>
                <p className="text-[8px] text-text-dim uppercase">Lost</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-text-bright">{h.goalsFor}:{h.goalsAgainst}</p>
                <p className="text-[8px] text-text-dim uppercase">Goals</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-web3">
              <span className="text-[9px] text-text-dim">Avg Rating</span>
              <span className={`text-[10px] font-bold ${h.avgRating >= 7.0 ? 'text-neon-lime' : h.avgRating >= 6.0 ? 'text-cyan-accent' : 'text-electric-orange'}`}>
                {h.avgRating}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-text-dim">Clean Sheets</span>
              <span className="text-[10px] font-bold text-text-bright">{h.cleanSheets}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Season comparison table */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <p className="text-xs font-bold text-text-bright mb-3">Season Weather Comparison</p>
        <div className="space-y-2">
          {seasonStats.map((s) => (
            <div key={s.season} className="bg-surface-3 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-text-bright">Season {s.season}</p>
                <p className="text-[9px] text-text-dim">{s.totalMatches} matches</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] text-text-dim">Bad Weather Wins</p>
                  <p className="text-[11px] font-bold text-neon-lime">{s.winsInBadWeather}</p>
                </div>
                <div>
                  <p className="text-[9px] text-text-dim">Bad Weather Goals</p>
                  <p className="text-[11px] font-bold text-cyan-accent">{s.goalsInBadWeather}</p>
                </div>
                <div>
                  <p className="text-[9px] text-text-dim">Avg Rating</p>
                  <p className="text-[11px] font-bold text-text-bright">{s.avgRating}</p>
                </div>
                <div>
                  <p className="text-[9px] text-text-dim">Best Condition</p>
                  <p className="text-[11px] font-bold text-neon-lime">{s.bestCondition}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SVG 7: Weather Win Rate Bars */}
      <WeatherWinRateBars data={winRateData} />

      {/* SVG 8: Seasonal Weather Timeline */}
      <SeasonalWeatherTimeline months={timelineMonths} />

      {/* SVG 9: Goals Per Condition Scatter */}
      <GoalsPerConditionScatter points={scatterPoints} />
    </div>
  );
}

/* ============================================================
   Tab 4: Preparation Content
   ============================================================ */
function PreparationTab({ season, week }: { season: number; week: number }) {
  const rng = mulberry32(season * 4000 + week * 23);

  const adaptationLevel = Math.round(30 + rng() * 55);

  const gearItems: GearItem[] = GEAR_ITEMS.map((g) => ({
    ...g,
    readiness: Math.round(30 + rng() * 60),
  }));

  const trainingRadar: RadarPoint[] = TRAINING_RADAR_AXES.map((label) => ({
    label,
    value: Math.round(30 + rng() * 55),
  }));

  const overallGearScore = Math.round(gearItems.reduce((s, g) => s + g.readiness, 0) / gearItems.length);
  const overallTrainingScore = Math.round(trainingRadar.reduce((s, t) => s + t.value, 0) / trainingRadar.length);
  const adaptationGrade = adaptationLevel >= 80 ? 'A' : adaptationLevel >= 65 ? 'B' : adaptationLevel >= 50 ? 'C' : adaptationLevel >= 35 ? 'D' : 'F';
  const gradeColor = adaptationLevel >= 80 ? 'text-neon-lime' : adaptationLevel >= 65 ? 'text-cyan-accent' : adaptationLevel >= 50 ? 'text-electric-orange' : 'text-[#ff3333]';

  const trainingSessions: TrainingSession[] = [
    {
      id: 'ts-1',
      name: 'Sprint Drills in Rain',
      type: 'Speed',
      weatherFocus: 'Rain',
      duration: '30 min',
      intensity: 'High',
      effectiveness: Math.round(50 + rng() * 40),
      completed: rng() > 0.4,
    },
    {
      id: 'ts-2',
      name: 'Ball Control in Wind',
      type: 'Technical',
      weatherFocus: 'Wind',
      duration: '45 min',
      intensity: 'Medium',
      effectiveness: Math.round(45 + rng() * 40),
      completed: rng() > 0.5,
    },
    {
      id: 'ts-3',
      name: 'Cold Weather Endurance',
      type: 'Fitness',
      weatherFocus: 'Snow',
      duration: '60 min',
      intensity: 'High',
      effectiveness: Math.round(40 + rng() * 45),
      completed: rng() > 0.6,
    },
    {
      id: 'ts-4',
      name: 'Visibility Passing Drills',
      type: 'Technical',
      weatherFocus: 'Fog',
      duration: '40 min',
      intensity: 'Medium',
      effectiveness: Math.round(55 + rng() * 35),
      completed: rng() > 0.3,
    },
    {
      id: 'ts-5',
      name: 'Agility on Snow',
      type: 'Agility',
      weatherFocus: 'Snow',
      duration: '35 min',
      intensity: 'High',
      effectiveness: Math.round(35 + rng() * 45),
      completed: rng() > 0.7,
    },
    {
      id: 'ts-6',
      name: 'Storm Simulation Match',
      type: 'Match Sim',
      weatherFocus: 'Storm',
      duration: '90 min',
      intensity: 'Very High',
      effectiveness: Math.round(50 + rng() * 40),
      completed: rng() > 0.8,
    },
    {
      id: 'ts-7',
      name: 'Wet Surface Shooting',
      type: 'Attacking',
      weatherFocus: 'Rain',
      duration: '30 min',
      intensity: 'Medium',
      effectiveness: Math.round(55 + rng() * 35),
      completed: rng() > 0.4,
    },
    {
      id: 'ts-8',
      name: 'Crosswind Crossing',
      type: 'Technical',
      weatherFocus: 'Wind',
      duration: '25 min',
      intensity: 'High',
      effectiveness: Math.round(40 + rng() * 40),
      completed: rng() > 0.5,
    },
  ];

  const completedCount = trainingSessions.filter((s) => s.completed).length;
  const avgEffectiveness = Math.round(
    trainingSessions.reduce((s, t) => s + t.effectiveness, 0) / trainingSessions.length
  );

  const gearRecommendations = [
    { item: 'FG Boots', condition: 'Dry/Sunny', status: 'Ready', ready: true },
    { item: 'SG Boots', condition: 'Wet/Rain', status: 'Ready', ready: true },
    { item: 'Thermal Base Layer', condition: 'Cold/Snow', status: 'Partial', ready: false },
    { item: 'Grip Gloves', condition: 'Wet/Cold', status: 'Needed', ready: false },
    { item: 'Anti-Fog Visor', condition: 'Fog', status: 'Needed', ready: false },
    { item: 'Thermal Headband', condition: 'Snow/Cold', status: 'Ready', ready: true },
    { item: 'Waterproof Jacket', condition: 'Rain/Storm', status: 'Partial', ready: false },
  ];

  return (
    <div className="space-y-3">
      {/* Adaptation overview with grade */}
      <div className="bg-surface-2 border border-border-web3 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] text-text-dim uppercase tracking-wider mb-0.5">Weather Adaptation</p>
            <p className="text-2xl font-bold text-text-bright">{adaptationLevel}%</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-text-dim uppercase tracking-wider mb-0.5">Grade</p>
            <p className={`text-2xl font-bold ${gradeColor}`}>{adaptationGrade}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-3 p-2 text-center">
            <p className="text-[9px] text-text-dim uppercase tracking-wider mb-0.5">Gear Score</p>
            <p className="text-sm font-bold text-electric-orange">{overallGearScore}%</p>
          </div>
          <div className="bg-surface-3 p-2 text-center">
            <p className="text-[9px] text-text-dim uppercase tracking-wider mb-0.5">Training</p>
            <p className="text-sm font-bold text-cyan-accent">{overallTrainingScore}</p>
          </div>
          <div className="bg-surface-3 p-2 text-center">
            <p className="text-[9px] text-text-dim uppercase tracking-wider mb-0.5">Sessions</p>
            <p className="text-sm font-bold text-neon-lime">{completedCount}/{trainingSessions.length}</p>
          </div>
        </div>
      </div>

      {/* Training progress bar */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-text-bright">Training Progress</p>
          <p className="text-[10px] text-text-dim">Avg Effectiveness: {avgEffectiveness}%</p>
        </div>
        <div className="w-full bg-surface-3 h-2 mb-3">
          <div
            className="h-2 bg-neon-lime"
            style={{ width: `${(completedCount / trainingSessions.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-neon-lime" />
            <span className="text-[9px] text-text-dim">Completed ({completedCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-surface-3" />
            <span className="text-[9px] text-text-dim">Remaining ({trainingSessions.length - completedCount})</span>
          </div>
        </div>
      </div>

      {/* Training sessions list */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <p className="text-xs font-bold text-text-bright mb-3">Weather Training Sessions</p>
        <div className="space-y-2">
          {trainingSessions.map((session) => {
            const intensityColor = session.intensity === 'Very High'
              ? 'text-[#ff3333]'
              : session.intensity === 'High'
                ? 'text-electric-orange'
                : 'text-cyan-accent';
            const statusBadge = session.completed
              ? 'bg-[#1a2e1a] text-neon-lime'
              : 'bg-[#1a1a1a] text-text-dim';

            return (
              <div key={session.id} className={`bg-surface-3 p-3 ${session.completed ? 'border-l-2 border-l-neon-lime' : 'border-l-2 border-l-border-web3'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 ${statusBadge}`}>
                      {session.completed ? 'DONE' : 'TODO'}
                    </span>
                    <p className="text-[11px] font-bold text-text-bright">{session.name}</p>
                  </div>
                  <span className={`text-[9px] font-bold ${intensityColor}`}>{session.intensity}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-text-dim">{session.type}</span>
                    <span className="text-[9px] text-text-dim">{session.duration}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#1a1a2e] text-cyan-accent">{session.weatherFocus}</span>
                  </div>
                  <span className="text-[10px] font-bold text-neon-lime">{session.effectiveness}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gear recommendations */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <p className="text-xs font-bold text-text-bright mb-3">Gear Recommendations</p>
        <div className="space-y-2">
          {gearRecommendations.map((gear) => (
            <div key={gear.item} className="flex items-center justify-between bg-surface-3 p-2.5">
              <div>
                <p className="text-[11px] font-bold text-text-bright">{gear.item}</p>
                <p className="text-[9px] text-text-dim">{gear.condition}</p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 ${
                gear.ready ? 'bg-[#1a2e1a] text-neon-lime' : gear.status === 'Partial' ? 'bg-[#2e2a1a] text-electric-orange' : 'bg-[#2e1a1a] text-electric-orange'
              }`}>
                {gear.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery protocols */}
      <div className="bg-surface-2 border border-border-web3 p-3">
        <p className="text-xs font-bold text-text-bright mb-3">Recovery Protocols</p>
        <div className="space-y-2">
          {RECOVERY_PROTOCOLS.map((protocol) => (
            <div key={protocol.name} className="bg-surface-3 p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-text-bright">{protocol.name}</p>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#1a1a2e] text-cyan-accent">{protocol.duration}</span>
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed">{protocol.description}</p>
              <p className="text-[9px] text-text-mid mt-1.5">Best for: {protocol.weatherCondition}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SVG 10: Adaptation Progress Ring */}
      <AdaptationProgressRing level={adaptationLevel} />

      {/* SVG 11: Gear Readiness Bars */}
      <GearReadinessBars gear={gearItems} />

      {/* SVG 12: Training Effectiveness Radar */}
      <TrainingEffectivenessRadar axes={trainingRadar} />
    </div>
  );
}

/* ============================================================
   Main Component: WeatherEnhanced
   ============================================================ */
export default function WeatherEnhanced() {
  const [tab, setTab] = useState<TabKey>('forecast');

  const gameState = useGameStore((s) => s.gameState);
  const currentSeason = gameState?.currentSeason ?? 1;
  const currentWeek = gameState?.currentWeek ?? 1;
  const clubName = gameState?.currentClub.name ?? 'Unknown Club';
  const weatherPreparation = gameState?.weatherPreparation ?? 'standard';

  const prepLabel = weatherPreparation === 'adapt'
    ? 'Adapting'
    : weatherPreparation === 'ignore'
      ? 'Pushing Through'
      : 'Standard';

  const prepColor = weatherPreparation === 'adapt'
    ? 'text-cyan-accent'
    : weatherPreparation === 'ignore'
      ? 'text-electric-orange'
      : 'text-neon-lime';

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3"
      >
        <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border-web3 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-text-bright font-grotesk">Weather Center</h1>
          <p className="text-[10px] text-text-dim">
            Season {currentSeason} &middot; Week {currentWeek} &middot; {clubName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-text-dim uppercase tracking-wider">Prep Mode</p>
          <p className={`text-[11px] font-bold ${prepColor}`}>{prepLabel}</p>
        </div>
      </motion.div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-2 border border-border-web3 p-3 text-center">
          <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Condition</p>
          <p className="text-sm font-bold text-text-bright">
            {gameState?.currentWeather?.name ?? 'Clear'}
          </p>
        </div>
        <div className="bg-surface-2 border border-border-web3 p-3 text-center">
          <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Severity</p>
          <p className="text-sm font-bold" style={{ color: SEVERITY_COLORS[gameState?.currentWeather?.severity ?? 'none'] ?? '#666666' }}>
            {(gameState?.currentWeather?.severity ?? 'none').toUpperCase()}
          </p>
        </div>
        <div className="bg-surface-2 border border-border-web3 p-3 text-center">
          <p className="text-[9px] text-text-dim uppercase tracking-wider mb-1">Modifiers</p>
          <p className="text-sm font-bold text-electric-orange">
            {(gameState?.currentWeather?.modifiers ?? []).length}
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-[#0d1117] p-1 border border-border-web3">
        {TAB_CONFIG.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-2 text-[10px] font-medium transition-colors rounded-lg ${
              tab === t.key
                ? 'bg-surface-2 text-cyan-accent'
                : 'text-text-mid hover:text-text-bright'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {tab === 'forecast' && (
          <ForecastTab season={currentSeason} week={currentWeek} />
        )}
        {tab === 'impact' && (
          <ImpactTab season={currentSeason} week={currentWeek} />
        )}
        {tab === 'history' && (
          <HistoryTab season={currentSeason} week={currentWeek} />
        )}
        {tab === 'preparation' && (
          <PreparationTab season={currentSeason} week={currentWeek} />
        )}
      </motion.div>
    </div>
  );
}
