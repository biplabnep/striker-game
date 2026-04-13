'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, Wind, Snowflake, CloudFog,
  Thermometer, CloudLightning,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================================
// Types
// ============================================================
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'snowy' | 'foggy' | 'hot' | 'stormy';

interface WeatherEffect {
  stat: string;
  modifier: number; // negative = penalty, positive = bonus
  label: string;
}

interface WeatherDefinition {
  type: WeatherType;
  name: string;
  icon: React.ReactNode;
  description: string;
  iconBg: string;
  iconColor: string;
  effects: WeatherEffect[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
}

interface WeatherSystemProps {
  season: number;
  week: number;
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
// Weather Definitions
// ============================================================
const WEATHER_DEFINITIONS: WeatherDefinition[] = [
  {
    type: 'sunny',
    name: 'Sunny',
    icon: <Sun className="w-6 h-6" />,
    description: 'Clear skies. Perfect conditions for football. No weather effects on player performance.',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    effects: [],
    severity: 'none',
  },
  {
    type: 'cloudy',
    name: 'Cloudy',
    icon: <Cloud className="w-6 h-6" />,
    description: 'Overcast skies but dry conditions. Standard match environment with no additional effects.',
    iconBg: 'bg-slate-400/15',
    iconColor: 'text-slate-400',
    effects: [],
    severity: 'none',
  },
  {
    type: 'rainy',
    name: 'Rainy',
    icon: <CloudRain className="w-6 h-6" />,
    description: 'Wet pitch surface. The ball moves faster on the ground and passing becomes more difficult.',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    effects: [
      { stat: 'passing', modifier: -5, label: 'Passing Accuracy' },
      { stat: 'fatigue', modifier: 10, label: 'Fatigue Rate' },
    ],
    severity: 'mild',
  },
  {
    type: 'windy',
    name: 'Windy',
    icon: <Wind className="w-6 h-6" />,
    description: 'Strong gusts across the pitch. Long-range shooting and aerial balls are significantly affected.',
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
    effects: [
      { stat: 'shooting', modifier: -5, label: 'Shooting Accuracy' },
    ],
    severity: 'mild',
  },
  {
    type: 'snowy',
    name: 'Snowy',
    icon: <Snowflake className="w-6 h-6" />,
    description: 'Heavy snowfall blankets the pitch. Players struggle with footing and energy drains faster in the cold.',
    iconBg: 'bg-cyan-400/15',
    iconColor: 'text-cyan-300',
    effects: [
      { stat: 'pace', modifier: -10, label: 'Pace' },
      { stat: 'fatigue', modifier: 15, label: 'Fatigue Rate' },
    ],
    severity: 'moderate',
  },
  {
    type: 'foggy',
    name: 'Foggy',
    icon: <CloudFog className="w-6 h-6" />,
    description: 'Thick fog reduces visibility across the pitch. Players struggle to find teammates and passing accuracy suffers.',
    iconBg: 'bg-gray-400/15',
    iconColor: 'text-gray-400',
    effects: [
      { stat: 'passing', modifier: -10, label: 'Passing Accuracy' },
    ],
    severity: 'moderate',
  },
  {
    type: 'hot',
    name: 'Hot',
    icon: <Thermometer className="w-6 h-6" />,
    description: 'Scorching temperatures sap player energy. Physical exertion takes a heavier toll in the heat.',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    effects: [
      { stat: 'fatigue', modifier: 10, label: 'Fatigue Rate' },
      { stat: 'physical', modifier: -5, label: 'Physical' },
    ],
    severity: 'mild',
  },
  {
    type: 'stormy',
    name: 'Stormy',
    icon: <CloudLightning className="w-6 h-6" />,
    description: 'Severe thunderstorm with heavy rain and lightning. Extreme conditions that challenge every aspect of play.',
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
  },
];

// ============================================================
// Weather weight distribution (sunny/cloudy are most common)
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
  // Seasonal cycle based on season number (mod 4 for variety)
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
// Generate weather for a given season/week
// ============================================================
function generateWeather(season: number, week: number): {
  weather: WeatherDefinition;
  temperature: number;
} {
  const seed = season * 100 + week;
  const rng = mulberry32(seed);

  // Weighted random selection
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

  // Temperature adjusted by weather type and season
  const seasonCtx = getSeasonContext(season);
  const weatherTempOffset: Record<WeatherType, number> = {
    sunny: 3,
    cloudy: -1,
    rainy: -3,
    windy: -2,
    snowy: -12,
    foggy: -2,
    hot: 12,
    stormy: -4,
  };

  const tempBase = seasonCtx.tempBase + weatherTempOffset[selectedType];
  const tempVariation = (rng() - 0.5) * seasonCtx.tempRange;
  const temperature = Math.round(tempBase + tempVariation);

  return { weather, temperature };
}

// ============================================================
// Severity badge config
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
// Effect modifier display color
// ============================================================
function getEffectColor(modifier: number): string {
  if (modifier > 0) return 'text-red-400';
  if (modifier < 0) return 'text-red-400';
  return 'text-[#8b949e]';
}

function getEffectBg(modifier: number): string {
  if (modifier > 0) return 'bg-red-500/8 border-red-500/15';
  if (modifier < 0) return 'bg-red-500/8 border-red-500/15';
  return 'bg-[#21262d] border-[#30363d]';
}

// ============================================================
// Component
// ============================================================
export default function WeatherSystem({ season, week }: WeatherSystemProps) {
  const { weather, temperature } = useMemo(
    () => generateWeather(season, week),
    [season, week],
  );

  const seasonCtx = getSeasonContext(season);
  const severity = getSeverityConfig(weather.severity);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.25 }}
    >
      <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
        <CardHeader className="pb-2 pt-3 px-4">
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
          {/* Weather & Temperature Row */}
          <div className="flex items-center gap-4">
            {/* Weather icon in colored circle */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${weather.iconBg}`}>
              <span className={weather.iconColor}>{weather.icon}</span>
            </div>

            {/* Weather name & temp */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white leading-tight">{weather.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Thermometer className={`w-3.5 h-3.5 ${temperature > 25 ? 'text-red-400' : temperature < 5 ? 'text-cyan-400' : 'text-amber-400'}`} />
                <span className={`text-sm font-bold ${temperature > 25 ? 'text-red-400' : temperature < 5 ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {temperature}°C
                </span>
                <span className="text-[10px] text-[#484f58]">• {seasonCtx.label}</span>
              </div>
            </div>
          </div>

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
    </motion.div>
  );
}
