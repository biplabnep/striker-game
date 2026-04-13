'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, Wind, Snowflake, CloudFog,
  Thermometer, CloudLightning, Shield, Zap,
  AlertTriangle, ArrowUp, ArrowDown,
  CalendarDays, Gauge, Eye, Flame,
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
  windRange: [number, number]; // km/h min, max
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

  // Wind speed within the weather type's range
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

  // Build mitigation effects based on weather effects
  const mitigatedEffects: WeatherEffect[] = weather.effects
    .filter(e => e.stat !== 'fatigue')
    .map(e => ({
      stat: e.stat,
      modifier: Math.round(e.modifier / 2), // halve the penalty
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
          modifier: Math.round(e.modifier * 1.3), // 30% worse
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
// Component
// ============================================================
export default function WeatherSystem({ season, week }: WeatherSystemProps) {
  const gameState = useGameStore(state => state.gameState);
  const setWeatherPreparation = useGameStore(state => state.setWeatherPreparation);
  const weatherPreparation = gameState?.weatherPreparation ?? 'standard';

  // Sync local state with store
  const [selectedPreparation, setSelectedPreparation] = useState<string>(weatherPreparation);

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

        // Calculate effective modifiers based on preparation
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

                  {/* Show effects of this choice when selected */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="mt-2 ml-6 space-y-1"
                      >
                        {/* Mitigation effect badges */}
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

                        {/* Fatigue cost */}
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
                {/* Match rating + weather */}
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

                {/* Impact breakdown */}
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

                {/* Stats summary */}
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
                  {/* Week label */}
                  <div className="shrink-0 w-12">
                    <p className="text-[9px] text-[#484f58] font-semibold uppercase">
                      {i === 0 ? 'Next' : `Wk ${day.week}`}
                    </p>
                  </div>

                  {/* Weather emoji */}
                  <div className="shrink-0">
                    <span className="text-base">{day.weather.emoji}</span>
                  </div>

                  {/* Weather name + details */}
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

                  {/* Severity badge */}
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
    </motion.div>
  );
}
