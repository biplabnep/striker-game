'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, Wind, Snowflake, CloudFog,
  Thermometer, CloudLightning, Shield, Zap,
  AlertTriangle, ArrowUp, ArrowDown,
  CalendarDays, Gauge, Eye, Flame,
  TrendingUp, BarChart3, Compass, PieChart,
  Droplets, SunDim, Eye as EyeIcon, Gauge as GaugeIcon,
  Activity, Target, CircleDot,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/store/gameStore';

// ============================================================
// Types
// ============================================================
type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'snowy' | 'foggy' | 'hot' | 'stormy';

interface WeatherEffect {
  stat: string;
  modifier: number;
  label: string;
}

interface WeatherDefinition {
  type: WeatherType;
  name: string;
  icon: React.ReactNode;
  emoji: string;
  description: string;
  conditionSummary: string;
  iconBg: string;
  iconColor: string;
  effects: WeatherEffect[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  windRange: [number, number];
}

interface WeatherSystemProps {
  season: number;
  week: number;
}

interface PreparationChoice {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  effects: WeatherEffect[];
  fatigueCost: number;
  energySaved: number;
}

interface ForecastDay {
  week: number;
  weather: WeatherDefinition;
  temperature: number;
  windSpeed: number;
}

interface TempTrendData {
  labels: string[];
  values: number[];
}

interface PrecipData {
  labels: string[];
  values: number[];
}

interface WindDirData {
  direction: string;
  speed: number;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface HumidityData {
  labels: string[];
  values: number[];
}

interface PressureData {
  labels: string[];
  values: number[];
  high: number;
  low: number;
}

interface RadarAxis {
  label: string;
  match: number;
  avg: number;
}

interface RadarData {
  axes: RadarAxis[];
}

interface SvgDataSet {
  tempTrend: TempTrendData;
  precipBars: PrecipData;
  windDir: WindDirData;
  donutSegments: DonutSegment[];
  humidity24h: HumidityData;
  uvIndex: number;
  visibility: number;
  pressureTrend: PressureData;
  pitchGrid: number[][];
  seasonRadar: RadarData;
  impactValue: number;
}

// ============================================================
// Mulberry32 PRNG (deterministic)
// ============================================================
function mulberry32(seed: number): () => number {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return () => {
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    return ((t >>> 0) / 4294967296);
  };
}

// ============================================================
// Weather Definitions (enhanced with emoji, conditionSummary, windRange)
// ============================================================
const WEATHER_DEFINITIONS: WeatherDefinition[] = [
  {
    type: 'sunny',
    name: 'Sunny',
    emoji: '\u2600\uFE0F',
    icon: <Sun className="w-8 h-8" />,
    description: 'Clear skies. Perfect conditions for football. No weather effects on player performance.',
    conditionSummary: 'Ideal conditions for attacking play',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    effects: [],
    severity: 'none',
    windRange: [5, 15],
  },
  {
    type: 'cloudy',
    name: 'Cloudy',
    emoji: '\u2601\uFE0F',
    icon: <Cloud className="w-8 h-8" />,
    description: 'Overcast skies but dry conditions. Standard match environment with no additional effects.',
    conditionSummary: 'Neutral conditions \u2014 play your normal game',
    iconBg: 'bg-slate-400/15',
    iconColor: 'text-slate-400',
    effects: [],
    severity: 'none',
    windRange: [8, 20],
  },
  {
    type: 'rainy',
    name: 'Rainy',
    emoji: '\uD83C\uDF27\uFE0F',
    icon: <CloudRain className="w-8 h-8" />,
    description: 'Wet pitch surface. The ball moves faster on the ground and passing becomes more difficult.',
    conditionSummary: 'Difficult conditions for passing',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    effects: [
      { stat: 'passing', modifier: -5, label: 'Passing Accuracy' },
      { stat: 'fatigue', modifier: 10, label: 'Fatigue Rate' },
    ],
    severity: 'mild',
    windRange: [15, 30],
  },
  {
    type: 'windy',
    name: 'Windy',
    emoji: '\uD83D\uDCA8',
    icon: <Wind className="w-8 h-8" />,
    description: 'Strong gusts across the pitch. Long-range shooting and aerial balls are significantly affected.',
    conditionSummary: 'Difficult conditions for long balls and shooting',
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
    effects: [
      { stat: 'shooting', modifier: -5, label: 'Shooting Accuracy' },
    ],
    severity: 'mild',
    windRange: [30, 55],
  },
  {
    type: 'snowy',
    name: 'Snowy',
    emoji: '\u2744\uFE0F',
    icon: <Snowflake className="w-8 h-8" />,
    description: 'Heavy snowfall blankets the pitch. Players struggle with footing and energy drains faster in the cold.',
    conditionSummary: 'Very difficult conditions \u2014 pace and stamina affected',
    iconBg: 'bg-cyan-400/15',
    iconColor: 'text-cyan-300',
    effects: [
      { stat: 'pace', modifier: -10, label: 'Pace' },
      { stat: 'fatigue', modifier: 15, label: 'Fatigue Rate' },
    ],
    severity: 'moderate',
    windRange: [10, 25],
  },
  {
    type: 'foggy',
    name: 'Foggy',
    emoji: '\uD83C\uDF2B\uFE0F',
    icon: <CloudFog className="w-8 h-8" />,
    description: 'Thick fog reduces visibility across the pitch. Players struggle to find teammates and passing accuracy suffers.',
    conditionSummary: 'Difficult conditions for passing and vision',
    iconBg: 'bg-gray-400/15',
    iconColor: 'text-gray-400',
    effects: [
      { stat: 'passing', modifier: -10, label: 'Passing Accuracy' },
    ],
    severity: 'moderate',
    windRange: [3, 12],
  },
  {
    type: 'hot',
    name: 'Hot',
    emoji: '\uD83C\uDF21\uFE0F',
    icon: <Thermometer className="w-8 h-8" />,
    description: 'Scorching temperatures sap player energy. Physical exertion takes a heavier toll in the heat.',
    conditionSummary: 'Difficult conditions \u2014 stamina heavily tested',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    effects: [
      { stat: 'fatigue', modifier: 10, label: 'Fatigue Rate' },
      { stat: 'physical', modifier: -5, label: 'Physical' },
    ],
    severity: 'mild',
    windRange: [5, 18],
  },
  {
    type: 'stormy',
    name: 'Stormy',
    emoji: '\u26C8\uFE0F',
    icon: <CloudLightning className="w-8 h-8" />,
    description: 'Severe thunderstorm with heavy rain and lightning. Extreme conditions that challenge every aspect of play.',
    conditionSummary: 'Extreme conditions \u2014 all stats penalised',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    effects: [
      { stat: 'pace', modifier: -10, label: 'Pace' },
      { stat: 'shooting', modifier: -10, label: 'Shooting' },
      { stat: 'passing', modifier: -10, label: 'Passing' },
      { stat: 'physical', modifier: -10, label: 'Physical' },
      { stat: 'fatigue', modifier: 20, label: 'Fatigue Rate' },
    ],
    severity: 'severe',
    windRange: [50, 80],
  },
];

// ============================================================
// Weather weight distribution
// ============================================================
const WEATHER_WEIGHTS: { type: WeatherType; weight: number }[] = [
  { type: 'sunny', weight: 25 },
  { type: 'cloudy', weight: 25 },
  { type: 'rainy', weight: 15 },
  { type: 'windy', weight: 12 },
  { type: 'snowy', weight: 5 },
  { type: 'foggy', weight: 6 },
  { type: 'hot', weight: 7 },
  { type: 'stormy', weight: 5 },
];

// ============================================================
// Season-based temperature ranges (Celsius)
// ============================================================
function getSeasonContext(season: number): { label: string; tempBase: number; tempRange: number } {
  const seasonPhase = season % 4;
  switch (seasonPhase) {
    case 0: return { label: 'Summer', tempBase: 24, tempRange: 8 };
    case 1: return { label: 'Autumn', tempBase: 14, tempRange: 8 };
    case 2: return { label: 'Winter', tempBase: 4, tempRange: 6 };
    case 3: return { label: 'Spring', tempBase: 12, tempRange: 8 };
    default: return { label: 'Autumn', tempBase: 14, tempRange: 8 };
  }
}

// ============================================================
// Generate weather for a given season/week (enhanced with wind)
// ============================================================
function generateWeather(season: number, week: number): {
  weather: WeatherDefinition;
  temperature: number;
  windSpeed: number;
} {
  const seed = season * 100 + week;
  const rng = mulberry32(seed);

  const totalWeight = WEATHER_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  let roll = rng() * totalWeight;
  let selectedType: WeatherType = 'sunny';

  for (const w of WEATHER_WEIGHTS) {
    roll -= w.weight;
    if (roll <= 0) {
      selectedType = w.type;
      break;
    }
  }

  const weather = WEATHER_DEFINITIONS.find(w => w.type === selectedType)!;

  const seasonCtx = getSeasonContext(season);
  const weatherTempOffset: Record<WeatherType, number> = {
    sunny: 3, cloudy: -1, rainy: -3, windy: -2,
    snowy: -12, foggy: -2, hot: 12, stormy: -4,
  };

  const tempBase = seasonCtx.tempBase + weatherTempOffset[selectedType];
  const tempVariation = (rng() - 0.5) * seasonCtx.tempRange;
  const temperature = Math.round(tempBase + tempVariation);

  const [windMin, windMax] = weather.windRange;
  const windSpeed = Math.round(windMin + rng() * (windMax - windMin));

  return { weather, temperature, windSpeed };
}

// ============================================================
// Severity config
// ============================================================
function getSeverityConfig(severity: WeatherDefinition['severity']): {
  label: string;
  className: string;
} {
  switch (severity) {
    case 'none':
      return { label: 'CLEAR', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' };
    case 'mild':
      return { label: 'MILD', className: 'bg-amber-500/15 text-amber-400 border-amber-500/25' };
    case 'moderate':
      return { label: 'MODERATE', className: 'bg-orange-500/15 text-orange-400 border-orange-500/25' };
    case 'severe':
      return { label: 'SEVERE', className: 'bg-red-500/15 text-red-400 border-red-500/25' };
  }
}

// ============================================================
// Severity-based card border and header
// ============================================================
function getSeverityBorder(severity: WeatherDefinition['severity']): string {
  switch (severity) {
    case 'none': return 'border-emerald-500/25';
    case 'mild': return 'border-amber-500/25';
    case 'moderate': return 'border-orange-500/25';
    case 'severe': return 'border-red-500/25';
  }
}

function getSeverityHeaderBg(severity: WeatherDefinition['severity']): string {
  switch (severity) {
    case 'none': return 'bg-emerald-500/8';
    case 'mild': return 'bg-amber-500/8';
    case 'moderate': return 'bg-orange-500/8';
    case 'severe': return 'bg-red-500/8';
  }
}

// ============================================================
// Effect colors
// ============================================================
function getEffectColor(modifier: number): string {
  if (modifier < 0) return 'text-red-400';
  if (modifier > 0) return 'text-amber-400';
  return 'text-[#8b949e]';
}

function getEffectBg(modifier: number): string {
  if (modifier < 0) return 'bg-red-500/8 border-red-500/15';
  if (modifier > 0) return 'bg-amber-500/8 border-amber-500/15';
  return 'bg-[#21262d] border-[#30363d]';
}

// ============================================================
// Wind speed descriptor
// ============================================================
function getWindLabel(speed: number): { label: string; color: string } {
  if (speed <= 10) return { label: 'Calm', color: 'text-emerald-400' };
  if (speed <= 20) return { label: 'Light breeze', color: 'text-emerald-400' };
  if (speed <= 35) return { label: 'Moderate', color: 'text-amber-400' };
  if (speed <= 55) return { label: 'Strong', color: 'text-orange-400' };
  return { label: 'Gale force', color: 'text-red-400' };
}

// ============================================================
// Temperature color
// ============================================================
function getTempColor(temp: number): string {
  if (temp >= 30) return 'text-red-400';
  if (temp >= 25) return 'text-orange-400';
  if (temp >= 15) return 'text-amber-400';
  if (temp >= 5) return 'text-sky-400';
  return 'text-cyan-400';
}

// ============================================================
// Preparation choices generator
// ============================================================
function getPreparationChoices(weather: WeatherDefinition): PreparationChoice[] {
  if (weather.severity === 'none') {
    return [
      {
        id: 'standard',
        label: 'Standard Approach',
        description: 'Play your normal game \u2014 conditions are ideal.',
        icon: <Shield className="w-4 h-4 text-emerald-400" />,
        effects: [],
        fatigueCost: 0,
        energySaved: 0,
      },
    ];
  }

  const mitigatedEffects: WeatherEffect[] = weather.effects
    .filter(e => e.stat !== 'fatigue')
    .map(e => ({
      stat: e.stat,
      modifier: Math.round(e.modifier / 2),
      label: e.label,
    }));

  return [
    {
      id: 'standard',
      label: 'Standard Approach',
      description: 'No special preparation. Accept full weather effects.',
      icon: <Shield className="w-4 h-4 text-slate-400" />,
      effects: [],
      fatigueCost: 0,
      energySaved: 0,
    },
    {
      id: 'adapt',
      label: 'Adapt to Conditions',
      description: 'Adjust tactics to counter the weather. Halves weather penalties but costs extra energy.',
      icon: <Eye className="w-4 h-4 text-sky-400" />,
      effects: mitigatedEffects,
      fatigueCost: 8,
      energySaved: 0,
    },
    {
      id: 'ignore',
      label: 'Push Through',
      description: 'Ignore weather and play aggressively. Slight penalty but preserves energy.',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      effects: weather.effects
        .filter(e => e.stat !== 'fatigue')
        .map(e => ({
          stat: e.stat,
          modifier: Math.round(e.modifier * 1.3),
          label: e.label,
        })),
      fatigueCost: -5,
      energySaved: 5,
    },
  ];
}

// ============================================================
// Match Engine Modifiers (visual bars for UI)
// ============================================================
const MATCH_ENGINE_EFFECTS: Record<WeatherType, { stat: string; modifier: number; label: string }[]> = {
  sunny:  [],
  cloudy: [],
  rainy:  [
    { stat: 'pace', modifier: -10, label: 'Pace' },
    { stat: 'shooting', modifier: -15, label: 'Shooting' },
    { stat: 'passing', modifier: -10, label: 'Passing' },
  ],
  windy: [
    { stat: 'shooting', modifier: -10, label: 'Shooting' },
    { stat: 'passing', modifier: -15, label: 'Passing' },
  ],
  snowy: [
    { stat: 'pace', modifier: -20, label: 'Pace' },
    { stat: 'shooting', modifier: -15, label: 'Shooting' },
    { stat: 'physical', modifier: -10, label: 'Physical' },
  ],
  hot: [
    { stat: 'pace', modifier: -10, label: 'Pace' },
    { stat: 'physical', modifier: -15, label: 'Physical' },
    { stat: 'fatigue', modifier: 20, label: 'Fatigue Rate' },
  ],
  stormy: [
    { stat: 'pace', modifier: -15, label: 'Pace' },
    { stat: 'shooting', modifier: -20, label: 'Shooting' },
    { stat: 'passing', modifier: -15, label: 'Passing' },
    { stat: 'physical', modifier: -10, label: 'Physical' },
    { stat: 'fatigue', modifier: 20, label: 'Fatigue Rate' },
  ],
  foggy: [
    { stat: 'passing', modifier: -10, label: 'Passing' },
    { stat: 'shooting', modifier: -5, label: 'Shooting' },
  ],
};

// ============================================================
// SVG: 1. TemperatureTrendChart
// ============================================================
function TemperatureTrendChart({ data }: { data: TempTrendData }): React.JSX.Element {
  const cw = 300;
  const ch = 130;
  const cl = 35;
  const cr = 285;
  const ct = 12;
  const cb = 105;
  const chartW = cr - cl;
  const chartH = cb - ct;
  const minVal = data.values.reduce((m, v) => Math.min(m, v), Infinity);
  const maxVal = data.values.reduce((m, v) => Math.max(m, v), -Infinity);
  const range = maxVal - minVal || 1;

  const pts = data.values.map((v, i) => ({
    x: cl + (i / (data.values.length - 1)) * chartW,
    y: cb - ((v - minVal) / range) * chartH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${cb} L ${pts[0].x},${cb} Z`;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-3.5 h-3.5 text-[#f0883e]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">7-Day Temperature</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {/* Grid lines */}
        {Array.from({ length: 4 }, (_, i) => {
          const gy = ct + (i / 3) * chartH;
          return (
            <line
              key={i}
              x1={cl}
              y1={gy}
              x2={cr}
              y2={gy}
              stroke="#21262d"
              strokeWidth={1}
            />
          );
        })}
        {/* Y-axis labels */}
        {Array.from({ length: 4 }, (_, i) => {
          const val = Math.round(maxVal - (i / 3) * range);
          const gy = ct + (i / 3) * chartH;
          return (
            <text
              key={i}
              x={cl - 4}
              y={gy + 3}
              fill="#484f58"
              fontSize={8}
              textAnchor="end"
            >
              {val}&deg;
            </text>
          );
        })}
        {/* Area fill */}
        <path d={areaPath} fill="#f0883e" opacity={0.12} />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#f0883e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="#0d1117"
            stroke="#f0883e"
            strokeWidth={1.5}
          />
        ))}
        {/* X-axis labels */}
        {data.labels.map((label, i) => (
          <text
            key={i}
            x={cl + (i / (data.labels.length - 1)) * chartW}
            y={cb + 16}
            fill="#484f58"
            fontSize={8}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// SVG: 2. PrecipitationBars
// ============================================================
function PrecipitationBars({ data }: { data: PrecipData }): React.JSX.Element {
  const cw = 300;
  const ch = 170;
  const barH = 12;
  const gap = 16;
  const startY = 14;
  const labelW = 30;
  const valW = 40;
  const maxVal = Math.max(...data.values, 1);
  const barAreaW = cw - labelW - valW - 20;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 className="w-3.5 h-3.5 text-[#58a6ff]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Weekly Rainfall (mm)</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {data.labels.map((label, i) => {
          const y = startY + i * (barH + gap);
          const val = data.values[i];
          const barW = Math.max(2, (val / maxVal) * barAreaW);
          const intensity = Math.min(1, val / maxVal);
          const r = Math.round(88 * (1 - intensity) + 88 * intensity);
          const g = Math.round(166 * (1 - intensity) + 100 * intensity);
          const b = Math.round(255 * (1 - intensity) + 255 * intensity);
          const color = `rgb(${r},${g},${b})`;

          return (
            <g key={i}>
              <text x={labelW - 4} y={y + barH / 2 + 3} fill="#8b949e" fontSize={9} textAnchor="end">
                {label}
              </text>
              {/* Background bar */}
              <rect x={labelW} y={y} width={barAreaW} height={barH} rx={3} fill="#21262d" />
              {/* Value bar */}
              <rect x={labelW} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.8} />
              {/* Value text */}
              <text x={labelW + barAreaW + 6} y={y + barH / 2 + 3} fill="#c9d1d9" fontSize={9}>
                {val.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG: 3. WindDirectionCompass
// ============================================================
function WindDirectionCompass({ data }: { data: WindDirData }): React.JSX.Element {
  const cw = 200;
  const ch = 200;
  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 55;

  const dirAngles: Record<string, number> = {
    N: -90, NE: -45, E: 0, SE: 45, S: 90, SW: 135, W: 180, NW: -135,
  };

  const dirLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const mainDirs = ['N', 'E', 'S', 'W'];

  const angle = (dirAngles[data.direction] ?? 0) * Math.PI / 180;
  const endX = cx + innerR * Math.cos(angle);
  const endY = cy + innerR * Math.sin(angle);

  const headLen = 12;
  const headW = 5;
  const leftX = endX - headLen * Math.cos(angle) + headW * Math.sin(angle);
  const leftY = endY - headLen * Math.sin(angle) - headW * Math.cos(angle);
  const rightX = endX - headLen * Math.cos(angle) - headW * Math.sin(angle);
  const rightY = endY - headLen * Math.sin(angle) + headW * Math.cos(angle);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Compass className="w-3.5 h-3.5 text-[#3fb950]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Wind Direction</span>
        <span className="ml-auto text-[10px] text-[#c9d1d9] font-bold">{data.speed} km/h {data.direction}</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {/* Outer circle */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#21262d" strokeWidth={1.5} />
        {/* Inner circle */}
        <circle cx={cx} cy={cy} r={innerR - 5} fill="none" stroke="#21262d" strokeWidth={0.5} />
        {/* Cross lines */}
        <line x1={cx} y1={cy - outerR} x2={cx} y2={cy + outerR} stroke="#21262d" strokeWidth={0.5} />
        <line x1={cx - outerR} y1={cy} x2={cx + outerR} y2={cy} stroke="#21262d" strokeWidth={0.5} />
        {/* Direction labels */}
        {dirLabels.map((dir, i) => {
          const a = (i * 45 - 90) * Math.PI / 180;
          const lx = cx + (outerR + 12) * Math.cos(a);
          const ly = cy + (outerR + 12) * Math.sin(a);
          const isMain = mainDirs.includes(dir);
          return (
            <text
              key={i}
              x={lx}
              y={ly + 3}
              fill={isMain ? '#c9d1d9' : '#484f58'}
              fontSize={isMain ? 10 : 7}
              fontWeight={isMain ? 'bold' : 'normal'}
              textAnchor="middle"
            >
              {dir}
            </text>
          );
        })}
        {/* Arrow shaft */}
        <line x1={cx} y1={cy} x2={endX} y2={endY} stroke="#3fb950" strokeWidth={2} strokeLinecap="round" />
        {/* Arrowhead */}
        <polygon points={`${endX},${endY} ${leftX},${leftY} ${rightX},${rightY}`} fill="#3fb950" />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={4} fill="#0d1117" stroke="#3fb950" strokeWidth={1.5} />
      </svg>
    </div>
  );
}

// ============================================================
// SVG: 4. WeatherDistributionDonut
// ============================================================
function WeatherDistributionDonut({ segments }: { segments: DonutSegment[] }): React.JSX.Element {
  const cw = 240;
  const ch = 140;
  const cx = 80;
  const cy = 70;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const total = segments.reduce((s, seg) => s + seg.value, 0);

  const segData = segments.reduce((acc, seg) => {
    const prevTotal = acc.length > 0 ? acc[acc.length - 1].cumEnd : 0;
    const dashLen = (seg.value / total) * circumference;
    const dashOffset = circumference / 4 - prevTotal;
    return [
      ...acc,
      {
        label: seg.label,
        color: seg.color,
        value: seg.value,
        pct: Math.round((seg.value / total) * 100),
        dashArray: `${dashLen} ${circumference - dashLen}`,
        dashOffset,
        cumEnd: prevTotal + dashLen,
      },
    ];
  }, [] as { label: string; color: string; value: number; pct: number; dashArray: string; dashOffset: number; cumEnd: number }[]);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <PieChart className="w-3.5 h-3.5 text-[#d2a8ff]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Weather Distribution</span>
      </div>
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${cx * 2} ${cy * 2}`} className="w-auto h-auto" style={{ width: 140, height: 140 }}>
          {segData.map((seg, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={12}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              opacity={0.85}
            />
          ))}
          <text x={cx} y={cy - 2} fill="#c9d1d9" fontSize={14} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
            {total}%
          </text>
          <text x={cx} y={cy + 14} fill="#484f58" fontSize={8} textAnchor="middle">
            total
          </text>
        </svg>
        <div className="flex flex-col gap-1.5">
          {segData.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
              <span className="text-[10px] text-[#8b949e] w-12">{seg.label}</span>
              <span className="text-[10px] text-[#c9d1d9] font-bold">{seg.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SVG: 5. HumidityAreaChart
// ============================================================
function HumidityAreaChart({ data }: { data: HumidityData }): React.JSX.Element {
  const cw = 300;
  const ch = 120;
  const cl = 30;
  const cr = 290;
  const ct = 10;
  const cb = 95;
  const chartW = cr - cl;
  const chartH = cb - ct;

  const pts = data.values.map((v, i) => ({
    x: cl + (i / (data.values.length - 1)) * chartW,
    y: cb - ((v - 20) / 80) * chartH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${cb} L ${pts[0].x},${cb} Z`;

  const xLabelIndices = [0, 6, 12, 18, 23];

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Droplets className="w-3.5 h-3.5 text-[#79c0ff]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">24h Humidity (%)</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {/* Grid */}
        {Array.from({ length: 5 }, (_, i) => {
          const gy = ct + (i / 4) * chartH;
          return <line key={i} x1={cl} y1={gy} x2={cr} y2={gy} stroke="#21262d" strokeWidth={0.5} />;
        })}
        {/* Area fill */}
        <path d={areaPath} fill="#79c0ff" opacity={0.1} />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#79c0ff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* X labels */}
        {xLabelIndices.map((idx) => (
          <text key={idx} x={pts[idx].x} y={cb + 14} fill="#484f58" fontSize={7} textAnchor="middle">
            {data.labels[idx]}
          </text>
        ))}
        {/* Y labels */}
        {Array.from({ length: 5 }, (_, i) => {
          const val = 100 - i * 20;
          const gy = ct + (i / 4) * chartH;
          return (
            <text key={i} x={cl - 4} y={gy + 3} fill="#484f58" fontSize={7} textAnchor="end">
              {val}%
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// SVG: 6. UVIndexGauge
// ============================================================
function UVIndexGauge({ value }: { value: number }): React.JSX.Element {
  const cw = 220;
  const ch = 130;
  const cx = 110;
  const cy = 95;
  const r = 75;

  const zones = [
    { start: 0, end: 2, color: '#3fb950', label: 'Low' },
    { start: 2, end: 5, color: '#ffa657', label: 'Moderate' },
    { start: 5, end: 7, color: '#f0883e', label: 'High' },
    { start: 7, end: 10, color: '#f85149', label: 'Very High' },
    { start: 10, end: 11.5, color: '#d2a8ff', label: 'Extreme' },
  ];

  const uvAngle = (v: number) => Math.PI * (1 - v / 11.5);

  const zoneArcs = zones.map((zone) => {
    const aStart = uvAngle(zone.start);
    const aEnd = uvAngle(zone.end);
    const x1 = cx + r * Math.cos(aStart);
    const y1 = cy - r * Math.sin(aStart);
    const x2 = cx + r * Math.cos(aEnd);
    const y2 = cy - r * Math.sin(aEnd);
    return { ...zone, x1, y1, x2, y2 };
  });

  const needleAngle = uvAngle(Math.min(value, 11.5));
  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  const uvLabel = value <= 2 ? 'Low' : value <= 5 ? 'Moderate' : value <= 7 ? 'High' : value <= 10 ? 'Very High' : 'Extreme';
  const uvColor = value <= 2 ? '#3fb950' : value <= 5 ? '#ffa657' : value <= 7 ? '#f0883e' : value <= 10 ? '#f85149' : '#d2a8ff';

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <SunDim className="w-3.5 h-3.5 text-[#ffa657]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">UV Index</span>
        <span className="ml-auto text-[10px] font-bold" style={{ color: uvColor }}>{uvLabel}</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {/* Background arc */}
        <path
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          fill="none"
          stroke="#21262d"
          strokeWidth={10}
          strokeLinecap="butt"
        />
        {/* Zone arcs */}
        {zoneArcs.map((arc, i) => (
          <path
            key={i}
            d={`M ${arc.x1},${arc.y1} A ${r},${r} 0 0,1 ${arc.x2},${arc.y2}`}
            fill="none"
            stroke={arc.color}
            strokeWidth={10}
            strokeLinecap="butt"
            opacity={0.7}
          />
        ))}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#c9d1d9" strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="#0d1117" stroke="#c9d1d9" strokeWidth={1.5} />
        {/* Value */}
        <text x={cx} y={cy + 22} fill="#c9d1d9" fontSize={18} fontWeight="bold" textAnchor="middle">
          {value}
        </text>
        <text x={cx} y={cy + 34} fill="#484f58" fontSize={8} textAnchor="middle">
          of 11+
        </text>
        {/* Scale labels */}
        <text x={cx - r - 2} y={cy + 14} fill="#484f58" fontSize={7} textAnchor="middle">0</text>
        <text x={cx + r + 2} y={cy + 14} fill="#484f58" fontSize={7} textAnchor="middle">11+</text>
      </svg>
    </div>
  );
}

// ============================================================
// SVG: 7. VisibilityRangeBar
// ============================================================
function VisibilityRangeBar({ value }: { value: number }): React.JSX.Element {
  const cw = 300;
  const ch = 80;
  const barX = 10;
  const barY = 25;
  const barW = 280;
  const barH = 14;
  const maxVis = 20;

  const zones = [
    { start: 0, end: 2, label: 'Fog', color: '#f85149' },
    { start: 2, end: 5, label: 'Poor', color: '#f0883e' },
    { start: 5, end: 10, label: 'Moderate', color: '#ffa657' },
    { start: 10, end: 20, label: 'Good', color: '#3fb950' },
  ];

  const markerX = barX + (Math.min(value, maxVis) / maxVis) * barW;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <EyeIcon className="w-3.5 h-3.5 text-[#58a6ff]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Visibility</span>
        <span className="ml-auto text-[11px] text-[#c9d1d9] font-bold">{value.toFixed(1)} km</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {/* Zone backgrounds */}
        {zones.map((zone, i) => {
          const zx = barX + (zone.start / maxVis) * barW;
          const zw = ((zone.end - zone.start) / maxVis) * barW;
          return (
            <rect key={i} x={zx} y={barY} width={zw} height={barH} fill={zone.color} opacity={0.2} />
          );
        })}
        {/* Bar border */}
        <rect x={barX} y={barY} width={barW} height={barH} rx={3} fill="none" stroke="#30363d" strokeWidth={1} />
        {/* Zone dividers */}
        {zones.slice(1).map((zone, i) => {
          const zx = barX + (zone.start / maxVis) * barW;
          return <line key={i} x1={zx} y1={barY} x2={zx} y2={barY + barH} stroke="#30363d" strokeWidth={0.5} />;
        })}
        {/* Marker */}
        <line x1={markerX} y1={barY - 4} x2={markerX} y2={barY + barH + 4} stroke="#c9d1d9" strokeWidth={2} strokeLinecap="round" />
        <circle cx={markerX} cy={barY - 4} r={2.5} fill="#c9d1d9" />
        {/* Zone labels */}
        {zones.map((zone, i) => {
          const zx = barX + ((zone.start + zone.end) / 2 / maxVis) * barW;
          return (
            <text key={i} x={zx} y={barY + barH + 14} fill={zone.color} fontSize={8} textAnchor="middle">
              {zone.label}
            </text>
          );
        })}
        {/* Scale labels */}
        <text x={barX} y={barY - 6} fill="#484f58" fontSize={7} textAnchor="start">0</text>
        <text x={barX + barW} y={barY - 6} fill="#484f58" fontSize={7} textAnchor="end">20km</text>
      </svg>
    </div>
  );
}

// ============================================================
// SVG: 8. PressureTrendChart
// ============================================================
function PressureTrendChart({ data }: { data: PressureData }): React.JSX.Element {
  const cw = 300;
  const ch = 130;
  const cl = 35;
  const cr = 285;
  const ct = 12;
  const cb = 105;
  const chartW = cr - cl;
  const chartH = cb - ct;
  const minP = data.low - 5;
  const maxP = data.high + 5;
  const range = maxP - minP;

  const pts = data.values.map((v, i) => ({
    x: cl + (i / (data.values.length - 1)) * chartW,
    y: cb - ((v - minP) / range) * chartH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  const highY = cb - ((data.high - minP) / range) * chartH;
  const lowY = cb - ((data.low - minP) / range) * chartH;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <GaugeIcon className="w-3.5 h-3.5 text-[#d2a8ff]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Pressure (hPa) — 7 Day</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {/* Grid lines */}
        {Array.from({ length: 4 }, (_, i) => {
          const gy = ct + (i / 3) * chartH;
          return <line key={i} x1={cl} y1={gy} x2={cr} y2={gy} stroke="#21262d" strokeWidth={0.5} />;
        })}
        {/* High threshold */}
        <line x1={cl} y1={highY} x2={cr} y2={highY} stroke="#3fb950" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
        <text x={cr + 2} y={highY + 3} fill="#3fb950" fontSize={7} opacity={0.6}>High</text>
        {/* Low threshold */}
        <line x1={cl} y1={lowY} x2={cr} y2={lowY} stroke="#f85149" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
        <text x={cr + 2} y={lowY + 3} fill="#f85149" fontSize={7} opacity={0.6}>Low</text>
        {/* Y labels */}
        {Array.from({ length: 4 }, (_, i) => {
          const val = Math.round(maxP - (i / 3) * range);
          const gy = ct + (i / 3) * chartH;
          return (
            <text key={i} x={cl - 4} y={gy + 3} fill="#484f58" fontSize={7} textAnchor="end">
              {val}
            </text>
          );
        })}
        {/* Line */}
        <path d={linePath} fill="none" stroke="#d2a8ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="#0d1117" stroke="#d2a8ff" strokeWidth={1.5} />
          </g>
        ))}
        {/* X labels */}
        {data.labels.map((label, i) => (
          <text key={i} x={cl + (i / (data.labels.length - 1)) * chartW} y={cb + 16} fill="#484f58" fontSize={8} textAnchor="middle">
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// SVG: 9. PitchConditionHeatmap
// ============================================================
function PitchConditionHeatmap({ grid }: { grid: number[][] }): React.JSX.Element {
  const cw = 280;
  const ch = 170;
  const cols = grid[0]?.length ?? 3;
  const rows = grid.length;
  const cellW = 38;
  const cellH = 32;
  const gap = 4;
  const startX = 40;
  const startY = 10;

  const zoneColors: Record<number, { fill: string; label: string }> = {
    0: { fill: '#3fb950', label: 'Dry' },
    1: { fill: '#58a6ff', label: 'Damp' },
    2: { fill: '#f85149', label: 'Waterlogged' },
  };

  const zoneRows = ['Top', 'Mid Top', 'Center', 'Mid Bot', 'Bottom'];
  const zoneCols = ['Left', 'Center', 'Right'];

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Activity className="w-3.5 h-3.5 text-[#3fb950]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Pitch Condition Map</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {/* Pitch outline */}
        <rect
          x={startX - 3}
          y={startY - 3}
          width={cols * (cellW + gap) - gap + 6}
          height={rows * (cellH + gap) - gap + 6}
          rx={4}
          fill="none"
          stroke="#30363d"
          strokeWidth={1}
        />
        {/* Cells */}
        {grid.map((row, ri) =>
          row.map((val, ci) => (
            <rect
              key={`${ri}-${ci}`}
              x={startX + ci * (cellW + gap)}
              y={startY + ri * (cellH + gap)}
              width={cellW}
              height={cellH}
              rx={3}
              fill={zoneColors[val]?.fill ?? '#21262d'}
              opacity={0.35}
              stroke="#21262d"
              strokeWidth={0.5}
            />
          ))
        )}
        {/* Row labels */}
        {zoneRows.map((label, i) => (
          <text key={i} x={startX - 6} y={startY + i * (cellH + gap) + cellH / 2 + 3} fill="#8b949e" fontSize={7} textAnchor="end">
            {label}
          </text>
        ))}
        {/* Column labels */}
        {zoneCols.map((label, i) => (
          <text key={i} x={startX + i * (cellW + gap) + cellW / 2} y={startY + rows * (cellH + gap) + 10} fill="#8b949e" fontSize={7} textAnchor="middle">
            {label}
          </text>
        ))}
        {/* Legend */}
        {Object.entries(zoneColors).map(([key, info], i) => (
          <g key={i}>
            <rect x={startX + i * 80} y={startY + rows * (cellH + gap) + 18} width={10} height={10} rx={2} fill={info.fill} opacity={0.5} />
            <text x={startX + i * 80 + 14} y={startY + rows * (cellH + gap) + 27} fill="#8b949e" fontSize={7}>
              {info.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ============================================================
// SVG: 10. SeasonWeatherRadar
// ============================================================
function SeasonWeatherRadar({ data }: { data: RadarData }): React.JSX.Element {
  const cw = 240;
  const ch = 210;
  const cx = 120;
  const cy = 105;
  const maxR = 80;
  const levels = [0.33, 0.66, 1];

  const hexPoints = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60 - 90) * Math.PI / 180;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');

  const dataPoly = (values: number[]) =>
    values.map((v, i) => {
      const angle = (i * 60 - 90) * Math.PI / 180;
      const r = (v / 100) * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');

  const matchVals = data.axes.map(a => a.match);
  const avgVals = data.axes.map(a => a.avg);

  const labelPositions = data.axes.map((_, i) => {
    const angle = (i * 60 - 90) * Math.PI / 180;
    return {
      x: cx + (maxR + 18) * Math.cos(angle),
      y: cy + (maxR + 18) * Math.sin(angle),
    };
  });

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Target className="w-3.5 h-3.5 text-[#58a6ff]" />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Season Weather Radar</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {/* Grid hexagons */}
        {levels.map((level, i) => (
          <polygon
            key={i}
            points={hexPoints(maxR * level)}
            fill="none"
            stroke="#21262d"
            strokeWidth={0.5}
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: 6 }, (_, i) => {
          const angle = (i * 60 - 90) * Math.PI / 180;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + maxR * Math.cos(angle)}
              y2={cy + maxR * Math.sin(angle)}
              stroke="#21262d"
              strokeWidth={0.5}
            />
          );
        })}
        {/* Avg polygon */}
        <polygon
          points={dataPoly(avgVals)}
          fill="#8b949e"
          opacity={0.08}
          stroke="#8b949e"
          strokeWidth={1}
          strokeDasharray="3 2"
        />
        {/* Match polygon */}
        <polygon
          points={dataPoly(matchVals)}
          fill="#58a6ff"
          opacity={0.15}
          stroke="#58a6ff"
          strokeWidth={1.5}
        />
        {/* Data points - match */}
        {matchVals.map((v, i) => {
          const angle = (i * 60 - 90) * Math.PI / 180;
          const r = (v / 100) * maxR;
          return (
            <circle
              key={i}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r={2.5}
              fill="#58a6ff"
              stroke="#0d1117"
              strokeWidth={1}
            />
          );
        })}
        {/* Axis labels */}
        {data.axes.map((axis, i) => (
          <text
            key={i}
            x={labelPositions[i].x}
            y={labelPositions[i].y + 3}
            fill="#c9d1d9"
            fontSize={8}
            fontWeight="bold"
            textAnchor="middle"
          >
            {axis.label}
          </text>
        ))}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="#30363d" />
        {/* Legend */}
        <circle cx={cw - 80} cy={ch - 14} r={4} fill="#58a6ff" opacity={0.5} />
        <text x={cw - 73} y={ch - 11} fill="#8b949e" fontSize={7}>Match</text>
        <line x1={cw - 40} y1={ch - 14} x2={cw - 32} y2={ch - 14} stroke="#8b949e" strokeWidth={1} strokeDasharray="2 1" />
        <text x={cw - 28} y={ch - 11} fill="#8b949e" fontSize={7}>Avg</text>
      </svg>
    </div>
  );
}

// ============================================================
// SVG: 11. WeatherImpactRing
// ============================================================
function WeatherImpactRing({ value }: { value: number }): React.JSX.Element {
  const cw = 170;
  const ch = 170;
  const cx = 85;
  const cy = 85;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeW = 10;

  const pct = Math.min(100, Math.max(0, value));
  const dashLen = (pct / 100) * circumference;
  const dashOffset = circumference / 4 - 0;

  const ringColor = pct <= 20 ? '#3fb950' : pct <= 40 ? '#ffa657' : pct <= 60 ? '#f0883e' : pct <= 80 ? '#f85149' : '#d2a8ff';
  const impactLabel = pct <= 20 ? 'Minimal' : pct <= 40 ? 'Low' : pct <= 60 ? 'Moderate' : pct <= 80 ? 'High' : 'Severe';

  const outerTrack = `${circumference} 0`;
  const progressTrack = `${dashLen} ${circumference - dashLen}`;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <CircleDot className="w-3.5 h-3.5" style={{ color: ringColor }} />
        <span className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-wider">Weather Impact</span>
      </div>
      <svg viewBox={`0 0 ${cw} ${ch}`} className="w-full h-auto">
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#21262d"
          strokeWidth={strokeW}
          strokeDasharray={outerTrack}
          strokeDashoffset={-circumference / 4}
          strokeLinecap="butt"
        />
        {/* Progress ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeW}
          strokeDasharray={progressTrack}
          strokeDashoffset={dashOffset}
          strokeLinecap="butt"
          opacity={0.85}
        />
        {/* Inner fill */}
        <circle cx={cx} cy={cy} r={radius - strokeW / 2 - 2} fill="#0d1117" opacity={0.5} />
        {/* Value text */}
        <text x={cx} y={cy - 6} fill={ringColor} fontSize={24} fontWeight="bold" textAnchor="middle">
          {pct}
        </text>
        <text x={cx} y={cy + 10} fill="#8b949e" fontSize={9} textAnchor="middle">
          {impactLabel}
        </text>
        <text x={cx} y={cy + 22} fill="#484f58" fontSize={7} textAnchor="middle">
          impact score
        </text>
      </svg>
    </div>
  );
}

// ============================================================
// Tab definitions
// ============================================================
const ANALYTICS_TABS = [
  { label: 'Overview', icon: TrendingUp },
  { label: 'Atmosphere', icon: Droplets },
  { label: 'Match Day', icon: Activity },
  { label: 'Impact', icon: Target },
];

// ============================================================
// Component
// ============================================================
export default function WeatherSystem({ season, week }: WeatherSystemProps) {
  const gameState = useGameStore(state => state.gameState);
  const setWeatherPreparation = useGameStore(state => state.setWeatherPreparation);
  const weatherPreparation = gameState?.weatherPreparation ?? 'standard';

  // Sync local state with store
  const [selectedPreparation, setSelectedPreparation] = useState<string>(weatherPreparation);
  const [analyticsTab, setAnalyticsTab] = useState(0);

  // Keep local state in sync with store
  const storedPrep = gameState?.weatherPreparation ?? 'standard';
  if (selectedPreparation !== storedPrep && storedPrep !== 'standard') {
    setSelectedPreparation(storedPrep);
  }

  // --- Current weather data ---
  const currentWeather = useMemo(
    () => generateWeather(season, week),
    [season, week],
  );

  const { weather, temperature, windSpeed } = currentWeather;
  const seasonCtx = getSeasonContext(season);
  const severity = getSeverityConfig(weather.severity);
  const windInfo = getWindLabel(windSpeed);
  const tempColor = getTempColor(temperature);

  // --- Preparation choices ---
  const preparationChoices = useMemo(
    () => getPreparationChoices(weather),
    [weather],
  );

  // --- Forecast (next 3 match weeks) ---
  const forecast = useMemo((): ForecastDay[] => {
    const days: ForecastDay[] = [];
    for (let offset = 1; offset <= 3; offset++) {
      const futureWeek = week + offset;
      const { weather: fw, temperature: ft, windSpeed: fws } = generateWeather(season, futureWeek);
      days.push({ week: futureWeek, weather: fw, temperature: ft, windSpeed: fws });
    }
    return days;
  }, [season, week]);

  // --- Post-match weather impact ---
  const lastMatchImpact = useMemo(() => {
    if (!gameState?.recentResults || gameState.recentResults.length === 0) return null;
    const lastMatch = gameState.recentResults[0];
    if (lastMatch.season !== season || lastMatch.week !== week) return null;

    const { weather: matchWeather } = generateWeather(season, week);
    if (matchWeather.severity === 'none') return null;

    const impacts: { label: string; modifier: number; stat: string }[] = matchWeather.effects.map(e => ({
      label: e.label,
      modifier: e.modifier,
      stat: e.stat,
    }));

    return {
      weatherName: matchWeather.name,
      weatherEmoji: matchWeather.emoji,
      severity: matchWeather.severity,
      impacts,
      playerRating: lastMatch.playerRating,
      playerGoals: lastMatch.playerGoals,
      playerAssists: lastMatch.playerAssists,
    };
  }, [gameState, season, week]);

  // --- Selected preparation details ---
  const selectedChoice = useMemo(
    () => preparationChoices.find(c => c.id === selectedPreparation) ?? preparationChoices[0],
    [preparationChoices, selectedPreparation],
  );

  // --- SVG Analytics Data (deterministic from season/week) ---
  const svgData = useMemo((): SvgDataSet => {
    const rng = mulberry32(season * 1000 + week);
    const ctx = getSeasonContext(season);

    // 1. Temperature trend (7 days)
    const tempTrend: TempTrendData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: Array.from({ length: 7 }, (_, i) => {
        const offset = Math.sin(i * 0.8) * 4 + (rng() - 0.5) * 6;
        return Math.round(temperature + offset);
      }),
    };

    // 2. Precipitation (7 days)
    const rainBase = weather.type === 'rainy' ? 8 : weather.type === 'stormy' ? 15 : weather.type === 'snowy' ? 5 : weather.type === 'cloudy' ? 2 : 0.5;
    const precipBars: PrecipData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: Array.from({ length: 7 }, () => Math.max(0, Math.round((rainBase + (rng() - 0.3) * 10) * 10) / 10)),
    };

    // 3. Wind direction
    const dirLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const windDir: WindDirData = {
      direction: dirLabels[Math.floor(rng() * 8)],
      speed: windSpeed,
    };

    // 4. Weather distribution donut (group weights into 5 categories via .reduce())
    const categoryColors: Record<string, string> = {
      Sunny: '#ffa657',
      Cloudy: '#8b949e',
      Rainy: '#58a6ff',
      Windy: '#79c0ff',
      Snowy: '#d2a8ff',
    };
    const donutSegments = WEATHER_WEIGHTS.reduce<DonutSegment[]>((acc, w) => {
      const category = w.type === 'sunny' || w.type === 'hot' ? 'Sunny'
        : w.type === 'cloudy' ? 'Cloudy'
        : w.type === 'rainy' || w.type === 'stormy' ? 'Rainy'
        : w.type === 'windy' ? 'Windy'
        : 'Snowy';
      const existing = acc.find(s => s.label === category);
      if (existing) {
        existing.value += w.weight;
      } else {
        acc.push({ label: category, value: w.weight, color: categoryColors[category] });
      }
      return acc;
    }, []);

    // 5. Humidity (24 hours)
    const humidityBase = weather.type === 'rainy' ? 85 : weather.type === 'foggy' ? 90 : weather.type === 'snowy' ? 80 : weather.type === 'sunny' ? 45 : 60;
    const humidity24h: HumidityData = {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      values: Array.from({ length: 24 }, (_, i) => {
        const nightDip = Math.sin((i - 6) * Math.PI / 12) * 10;
        return Math.min(100, Math.max(20, Math.round(humidityBase + nightDip + (rng() - 0.5) * 15)));
      }),
    };

    // 6. UV Index
    const uvBase = weather.type === 'sunny' ? 8 : weather.type === 'hot' ? 10 : weather.type === 'cloudy' ? 3 : weather.type === 'foggy' ? 1 : 2;
    const uvIndex = Math.min(11, Math.max(0, Math.round(uvBase + (rng() - 0.5) * 3)));

    // 7. Visibility
    const visBase = weather.type === 'foggy' ? 0.5 : weather.type === 'rainy' ? 5 : weather.type === 'stormy' ? 2 : weather.type === 'snowy' ? 3 : 15;
    const visibility = Math.max(0.1, Math.round((visBase + rng() * 5) * 10) / 10);

    // 8. Pressure trend (7 days)
    const pressureBase = weather.type === 'stormy' ? 995 : weather.type === 'rainy' ? 1005 : 1015;
    const pressureTrend: PressureData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: Array.from({ length: 7 }, (_, i) => Math.round(pressureBase + Math.sin(i * 0.9) * 8 + (rng() - 0.5) * 6)),
      high: 1020,
      low: 995,
    };

    // 9. Pitch condition (5x3 grid)
    const pitchGrid = Array.from({ length: 5 }, () =>
      Array.from({ length: 3 }, () => {
        const roll = rng();
        if (weather.type === 'rainy' || weather.type === 'stormy') return roll < 0.15 ? 0 : roll < 0.5 ? 1 : 2;
        if (weather.type === 'snowy') return roll < 0.25 ? 0 : roll < 0.65 ? 1 : 2;
        return roll < 0.75 ? 0 : roll < 0.92 ? 1 : 2;
      })
    );

    // 10. Season radar (6 axes)
    const seasonRadar: RadarData = {
      axes: [
        { label: 'Temp', match: Math.round(Math.min(100, Math.max(0, ((temperature + 10) / 50) * 100))), avg: Math.round(((ctx.tempBase + 10) / 50) * 100) },
        { label: 'Wind', match: Math.round(Math.min(100, (windSpeed / 80) * 100)), avg: 30 },
        { label: 'Rain', match: Math.round(rainBase > 5 ? 70 + rng() * 30 : 20 + rng() * 30), avg: 35 },
        { label: 'Humidity', match: Math.round(humidityBase), avg: 55 },
        { label: 'UV', match: Math.round((uvIndex / 11) * 100), avg: 40 },
        { label: 'Pressure', match: Math.round(Math.min(100, ((pressureBase - 980) / 40) * 100)), avg: 60 },
      ],
    };

    // 11. Weather impact ring
    const impactBase = weather.severity === 'none' ? 5 : weather.severity === 'mild' ? 25 : weather.severity === 'moderate' ? 50 : 75;
    const effectSum = weather.effects.reduce((s, e) => s + Math.abs(e.modifier), 0);
    const impactValue = Math.min(100, Math.max(0, Math.round(impactBase + effectSum * 1.5 + rng() * 10)));

    return {
      tempTrend, precipBars, windDir, donutSegments, humidity24h, uvIndex,
      visibility, pressureTrend, pitchGrid, seasonRadar, impactValue,
    };
  }, [season, week, weather, temperature, windSpeed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.25 }}
      className="space-y-3"
    >
      {/* =============================================
          MAIN WEATHER CARD
      ============================================= */}
      <Card className={`bg-[#161b22] border-[#30363d] overflow-hidden ${getSeverityBorder(weather.severity)}`}>
        {/* Severity color strip */}
        <div className={`px-4 py-1.5 ${getSeverityHeaderBg(weather.severity)}`} />

        <CardHeader className="pb-2 pt-2 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              {weather.icon}
              <span>Match Conditions</span>
            </span>
            <Badge
              variant="outline"
              className={`text-[8px] px-1.5 py-0 h-4 font-bold border ${severity.className}`}
            >
              {severity.label}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">
          {/* Weather icon + emoji + name + temp + wind */}
          <div className="flex items-center gap-4">
            {/* Large weather icon */}
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${weather.iconBg}`}>
              <span className={weather.iconColor}>{weather.icon}</span>
            </div>

            {/* Weather details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{weather.emoji}</span>
                <p className="text-lg font-bold text-white leading-tight">{weather.name}</p>
              </div>

              {/* Temperature */}
              <div className="flex items-center gap-2 mt-1">
                <Thermometer className={`w-3.5 h-3.5 ${tempColor}`} />
                <span className={`text-sm font-bold ${tempColor}`}>
                  {temperature}&deg;C
                </span>
                <span className="text-[10px] text-[#484f58]">&bull; {seasonCtx.label}</span>
              </div>

              {/* Wind speed */}
              <div className="flex items-center gap-2 mt-0.5">
                <Wind className="w-3 h-3 text-[#8b949e]" />
                <span className="text-[11px] text-[#8b949e]">
                  <span className={windInfo.color}>{windSpeed} km/h</span>
                  <span className="text-[10px] text-[#484f58] ml-1">({windInfo.label})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Condition summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.2 }}
            className="bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
              <p className={`text-[11px] font-medium ${
                weather.severity === 'none' ? 'text-emerald-400/80' :
                weather.severity === 'mild' ? 'text-amber-400/80' :
                weather.severity === 'moderate' ? 'text-orange-400/80' :
                'text-red-400/80'
              }`}>
                {weather.conditionSummary}
              </p>
            </div>
          </motion.div>

          {/* Description */}
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            {weather.description}
          </p>

          {/* Effect Cards */}
          {weather.effects.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.2 }}
            >
              <p className="text-[10px] text-[#484f58] font-semibold mb-2 tracking-wider uppercase">
                Gameplay Effects
              </p>
              <div className="grid grid-cols-2 gap-2">
                {weather.effects.map((effect, i) => (
                  <motion.div
                    key={effect.stat}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.2 }}
                    className={`rounded-lg border px-3 py-2 ${getEffectBg(effect.modifier)}`}
                  >
                    <p className="text-[9px] text-[#8b949e] mb-0.5">{effect.label}</p>
                    <p className={`text-sm font-bold ${getEffectColor(effect.modifier)}`}>
                      {effect.modifier > 0 ? '+' : ''}{effect.modifier}%
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* No effects note for clear weather */}
          {weather.effects.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.2 }}
              className="bg-emerald-500/8 border border-emerald-500/15 rounded-lg px-3 py-2.5"
            >
              <p className="text-[11px] text-emerald-400/80 text-center">
                No weather penalties. Ideal match conditions.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* =============================================
          MATCH IMPACT — Engine Modifier Bars
      ============================================= */}
      {(() => {
        const engineEffects = MATCH_ENGINE_EFFECTS[weather.type];
        if (!engineEffects || engineEffects.length === 0) return null;

        const prep = selectedPreparation as 'standard' | 'adapt' | 'ignore';
        const mitigationFactor = prep === 'adapt' ? 0.5 : prep === 'ignore' ? 1.3 : 1.0;

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.2 }}
          >
            <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Match Impact</span>
                  {prep === 'adapt' && (
                    <span className="ml-auto text-[8px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                      ADAPTED -50%
                    </span>
                  )}
                  {prep === 'ignore' && (
                    <span className="ml-auto text-[8px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      PUSHING +30%
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <p className="text-[10px] text-[#484f58]">
                  How {weather.name.toLowerCase()} conditions affect your next match stats
                </p>
                <div className="space-y-2.5">
                  {engineEffects.map((eff, i) => {
                    const effectiveMod = Math.round(eff.modifier * mitigationFactor);
                    const isNegative = effectiveMod < 0;
                    const barColor = isNegative ? 'bg-red-500' : 'bg-emerald-400';
                    const textColor = isNegative ? 'text-red-400' : 'text-emerald-400';
                    const barWidth = Math.min(Math.abs(effectiveMod), 100);
                    const isPenalty = eff.stat === 'fatigue';

                    return (
                      <motion.div
                        key={eff.stat}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.55 + i * 0.05, duration: 0.2 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {isPenalty ? (
                              <Flame className="w-3 h-3 text-amber-400" />
                            ) : isNegative ? (
                              <ArrowDown className="w-3 h-3 text-red-400" />
                            ) : (
                              <ArrowUp className="w-3 h-3 text-emerald-400" />
                            )}
                            <span className="text-[11px] text-[#c9d1d9] font-medium">{eff.label}</span>
                          </div>
                          <span className={`text-[11px] font-bold ${textColor}`}>
                            {effectiveMod > 0 ? '+' : ''}{effectiveMod}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#21262d] rounded-sm overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ delay: 0.6 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
                            className={`h-full rounded-sm ${barColor}`}
                            style={{ opacity: 0.7 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* =============================================
          PRE-MATCH WEATHER PREPARATION
      ============================================= */}
      {preparationChoices.length > 1 && (
        <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Weather Preparation</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-2">
            <p className="text-[10px] text-[#484f58] mb-2">
              Choose how to approach these conditions before the match.
            </p>

            {preparationChoices.map((choice) => {
              const isSelected = selectedPreparation === choice.id;
              return (
                <motion.button
                  key={choice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.15 }}
                  onClick={() => {
                    setSelectedPreparation(choice.id);
                    setWeatherPreparation(choice.id as 'standard' | 'adapt' | 'ignore');
                  }}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                    isSelected
                      ? 'border-emerald-500/40 bg-emerald-500/8'
                      : 'border-[#30363d] bg-[#21262d] hover:border-[#484f58]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={isSelected ? 'opacity-100' : 'opacity-50'}>{choice.icon}</span>
                    <span className={`text-[12px] font-bold ${isSelected ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                      {choice.label}
                    </span>
                    {isSelected && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-auto text-[8px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded"
                      >
                        SELECTED
                      </motion.span>
                    )}
                  </div>

                  <p className="text-[10px] text-[#8b949e] mt-1 ml-6">
                    {choice.description}
                  </p>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="mt-2 ml-6 space-y-1"
                      >
                        {choice.effects.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {choice.effects.map((eff) => (
                              <span
                                key={eff.stat}
                                className="text-[9px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded"
                              >
                                {eff.label} {eff.modifier > 0 ? '+' : ''}{eff.modifier}%
                              </span>
                            ))}
                          </div>
                        )}

                        {choice.fatigueCost > 0 && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span className="text-[9px] text-amber-400">
                              +{choice.fatigueCost}% fatigue cost
                            </span>
                          </div>
                        )}
                        {choice.energySaved > 0 && (
                          <div className="flex items-center gap-1">
                            <ArrowUp className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] text-emerald-400">
                              {choice.energySaved}% energy saved
                            </span>
                          </div>
                        )}
                        {choice.fatigueCost === 0 && choice.energySaved === 0 && choice.effects.length === 0 && (
                          <span className="text-[9px] text-[#8b949e]">
                            No modifiers &mdash; full weather effects apply.
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* =============================================
          POST-MATCH WEATHER IMPACT SUMMARY
      ============================================= */}
      <AnimatePresence>
        {lastMatchImpact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.55, duration: 0.25 }}
          >
            <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>Weather Impact Report</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{lastMatchImpact.weatherEmoji}</span>
                    <div>
                      <p className="text-[11px] font-bold text-[#c9d1d9]">
                        {lastMatchImpact.weatherName} conditions
                      </p>
                      <p className="text-[9px] text-[#484f58]">
                        {lastMatchImpact.severity === 'mild' ? 'Mild' :
                         lastMatchImpact.severity === 'moderate' ? 'Moderate' : 'Severe'} effects on your match
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#c9d1d9]">
                      {lastMatchImpact.playerRating.toFixed(1)}
                    </p>
                    <p className="text-[9px] text-[#484f58]">Match Rating</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-[#484f58] font-semibold tracking-wider uppercase">
                    How weather affected you
                  </p>
                  {lastMatchImpact.impacts.map((impact) => {
                    const expectedRating = 7.0;
                    const weatherPenalty = Math.abs(impact.modifier) / 100;
                    const approxImpact = (weatherPenalty * expectedRating).toFixed(1);
                    return (
                      <div
                        key={impact.stat}
                        className="flex items-center justify-between bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowDown className="w-3 h-3 text-red-400" />
                          <span className="text-[11px] text-[#c9d1d9]">
                            {impact.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-red-400">
                          -{impact.modifier}% (~{approxImpact} rating)
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  {lastMatchImpact.playerGoals > 0 && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      {lastMatchImpact.playerGoals} goal{lastMatchImpact.playerGoals !== 1 ? 's' : ''}
                    </span>
                  )}
                  {lastMatchImpact.playerAssists > 0 && (
                    <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded">
                      {lastMatchImpact.playerAssists} assist{lastMatchImpact.playerAssists !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="text-[9px] text-[#484f58] ml-auto">
                    Despite {lastMatchImpact.weatherName.toLowerCase()} conditions
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =============================================
          WEATHER FORECAST (next 3 match weeks)
      ============================================= */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>3-Week Forecast</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {forecast.map((day, i) => {
              const daySeverity = getSeverityConfig(day.weather.severity);
              const dayTempColor = getTempColor(day.temperature);
              return (
                <motion.div
                  key={day.week}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.2 }}
                  className="flex items-center gap-3 bg-[#21262d] border border-[#30363d] rounded-lg px-3 py-2"
                >
                  <div className="shrink-0 w-12">
                    <p className="text-[9px] text-[#484f58] font-semibold uppercase">
                      {i === 0 ? 'Next' : `Wk ${day.week}`}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span className="text-base">{day.weather.emoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-[#c9d1d9] truncate">
                      {day.weather.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Thermometer className={`w-2.5 h-2.5 ${dayTempColor}`} />
                      <span className={`text-[9px] ${dayTempColor}`}>{day.temperature}&deg;C</span>
                      <Wind className="w-2.5 h-2.5 text-[#484f58]" />
                      <span className="text-[9px] text-[#484f58]">{day.windSpeed} km/h</span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[7px] px-1 py-0 h-3.5 font-bold border shrink-0 ${daySeverity.className}`}
                  >
                    {daySeverity.label}
                  </Badge>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.2 }}
            className="mt-2"
          >
            <p className="text-[9px] text-[#484f58] text-center">
              Use forecasts to plan training and tactical preparation.
            </p>
          </motion.div>
        </CardContent>
      </Card>

      {/* =============================================
          WEATHER ANALYTICS — Tabbed SVG Visualizations
      ============================================= */}
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        {/* Tab Bar */}
        <div className="bg-[#0d1117] border-b border-[#30363d] px-2 pt-2">
          <div className="flex gap-1">
            {ANALYTICS_TABS.map((tab, i) => {
              const TabIcon = tab.icon;
              const isActive = analyticsTab === i;
              return (
                <button
                  key={i}
                  onClick={() => setAnalyticsTab(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-t-md transition-colors border-b-2 ${
                    isActive
                      ? 'text-emerald-400 border-emerald-400 bg-[#161b22]'
                      : 'text-[#484f58] border-transparent hover:text-[#8b949e]'
                  }`}
                >
                  <TabIcon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <CardContent className="px-4 pb-4 pt-3">
          <AnimatePresence mode="wait">
            {/* Tab 0: Overview — Temperature, Precipitation, Wind */}
            {analyticsTab === 0 && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <TemperatureTrendChart data={svgData.tempTrend} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PrecipitationBars data={svgData.precipBars} />
                  <WindDirectionCompass data={svgData.windDir} />
                </div>
              </motion.div>
            )}

            {/* Tab 1: Atmosphere — Donut, Humidity, UV */}
            {analyticsTab === 1 && (
              <motion.div
                key="tab-atmosphere"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <WeatherDistributionDonut segments={svgData.donutSegments} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <HumidityAreaChart data={svgData.humidity24h} />
                  <UVIndexGauge value={svgData.uvIndex} />
                </div>
              </motion.div>
            )}

            {/* Tab 2: Match Day — Visibility, Pressure, Pitch */}
            {analyticsTab === 2 && (
              <motion.div
                key="tab-matchday"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <VisibilityRangeBar value={svgData.visibility} />
                <PressureTrendChart data={svgData.pressureTrend} />
                <PitchConditionHeatmap grid={svgData.pitchGrid} />
              </motion.div>
            )}

            {/* Tab 3: Impact — Radar, Impact Ring */}
            {analyticsTab === 3 && (
              <motion.div
                key="tab-impact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SeasonWeatherRadar data={svgData.seasonRadar} />
                  <div className="flex items-start justify-center">
                    <WeatherImpactRing value={svgData.impactValue} />
                  </div>
                </div>
                {/* Impact summary cards */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {svgData.seasonRadar.axes.map((axis, i) => {
                    const diff = axis.match - axis.avg;
                    const diffColor = diff > 10 ? 'text-red-400' : diff < -10 ? 'text-emerald-400' : 'text-[#8b949e]';
                    const diffIcon = diff > 10 ? ArrowUp : diff < -10 ? ArrowDown : null;
                    return (
                      <div
                        key={i}
                        className="bg-[#21262d] border border-[#30363d] rounded-lg px-2 py-2 text-center"
                      >
                        <p className="text-[8px] text-[#484f58] uppercase tracking-wider">{axis.label}</p>
                        <p className="text-[12px] font-bold text-[#c9d1d9] mt-0.5">{axis.match}</p>
                        <p className={`text-[8px] ${diffColor} flex items-center justify-center gap-0.5 mt-0.5`}>
                          {diffIcon && React.createElement(diffIcon, { className: 'w-2.5 h-2.5' })}
                          {diff > 0 ? '+' : ''}{diff} vs avg
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
