'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudSun, Thermometer, Droplets, Wind, Eye, Snowflake, Flame, Zap, Shield, TrendingUp, TrendingDown, Users, Calendar, ChevronRight, AlertTriangle, Settings, Wrench, Star, Award, BarChart3, CloudRain, Sun, Cloud, CloudFog, CloudSnow, CloudLightning, ArrowRight } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { WeatherType, WeatherCondition } from '@/lib/game/types';

// ────────────────────────────────────────────────────────────
// Types & Constants
// ────────────────────────────────────────────────────────────

type SeverityLevel = 'ideal' | 'moderate' | 'extreme';

interface WeatherForecast {
  day: string;
  condition: WeatherType;
  temp: number;
  severity: SeverityLevel;
}

interface WeatherImpactData {
  type: WeatherType;
  name: string;
  icon: React.ReactNode;
  description: string;
  attributes: {
    stat: string;
    label: string;
    impact: number; // negative = penalty, positive = bonus
  }[];
  benefits: string;
  suffers: string;
}

interface TacticalAdjustment {
  id: string;
  name: string;
  description: string;
  applicableWeather: WeatherType[];
  impact: string;
  performanceChange: number;
}

interface PlayerWeatherData {
  id: string;
  name: string;
  position: string;
  suitability: number;
  keyStat: string;
  keyStatImpact: number;
  badge: string | null;
  playingStyle: 'technical' | 'physical' | 'aerial' | 'balanced' | 'speed';
}

interface HistoricalRecord {
  condition: WeatherType;
  label: string;
  icon: React.ReactNode;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface WeatherEvent {
  minute: number;
  description: string;
  tacticalRecommendation: string;
  substitutionSuggestion: string;
  impactLevel: 'low' | 'medium' | 'high';
}

interface StadiumFacility {
  name: string;
  currentValue: string;
  upgradeCost: string;
  mitigationPercent: number;
  icon: React.ReactNode;
}

const WEATHER_ICONS: Record<WeatherType, React.ReactNode> = {
  sunny: <Sun className="h-6 w-6 text-yellow-400" />,
  cloudy: <Cloud className="h-6 w-6 text-[#8b949e]" />,
  rainy: <CloudRain className="h-6 w-6 text-blue-400" />,
  windy: <Wind className="h-6 w-6 text-[#c9d1d9]" />,
  snowy: <CloudSnow className="h-6 w-6 text-blue-300" />,
  foggy: <CloudFog className="h-6 w-6 text-[#8b949e]" />,
  hot: <Flame className="h-6 w-6 text-orange-500" />,
  stormy: <CloudLightning className="h-6 w-6 text-yellow-300" />,
};

const WEATHER_SMALL_ICONS: Record<WeatherType, React.ReactNode> = {
  sunny: <Sun className="h-4 w-4 text-yellow-400" />,
  cloudy: <Cloud className="h-4 w-4 text-[#8b949e]" />,
  rainy: <CloudRain className="h-4 w-4 text-blue-400" />,
  windy: <Wind className="h-4 w-4 text-[#c9d1d9]" />,
  snowy: <CloudSnow className="h-4 w-4 text-blue-300" />,
  foggy: <CloudFog className="h-4 w-4 text-[#8b949e]" />,
  hot: <Flame className="h-4 w-4 text-orange-500" />,
  stormy: <CloudLightning className="h-4 w-4 text-yellow-300" />,
};

// ────────────────────────────────────────────────────────────
// Mock Data
// ────────────────────────────────────────────────────────────

const MOCK_FORECAST: WeatherForecast[] = [
  { day: 'Today', condition: 'rainy', temp: 14, severity: 'moderate' },
  { day: 'Wed', condition: 'cloudy', temp: 16, severity: 'ideal' },
  { day: 'Sat', condition: 'windy', temp: 12, severity: 'moderate' },
  { day: 'Tue', condition: 'sunny', temp: 24, severity: 'ideal' },
  { day: 'Fri', condition: 'snowy', temp: 2, severity: 'extreme' },
];

const WEATHER_IMPACTS: WeatherImpactData[] = [
  {
    type: 'sunny',
    name: 'Sunny / Hot',
    icon: <Sun className="h-6 w-6 text-yellow-400" />,
    description: 'Bright conditions with moderate heat. Players may tire faster under direct sunlight.',
    attributes: [
      { stat: 'stamina', label: 'Stamina Drain', impact: -12 },
      { stat: 'passing', label: 'Passing Accuracy', impact: -5 },
      { stat: 'shooting', label: 'Shooting Glare', impact: -8 },
      { stat: 'dribbling', label: 'Ball Control', impact: 3 },
    ],
    benefits: 'Technical players with close control who keep the ball on the ground',
    suffers: 'Heavily built players and those with lower stamina ratings',
  },
  {
    type: 'rainy',
    name: 'Rain',
    icon: <CloudRain className="h-6 w-6 text-blue-400" />,
    description: 'Persistent rainfall makes the pitch slippery and the ball faster on the surface.',
    attributes: [
      { stat: 'dribbling', label: 'Ball Control', impact: -15 },
      { stat: 'passing', label: 'Short Pass Speed', impact: 8 },
      { stat: 'shooting', label: 'Shooting Accuracy', impact: -10 },
      { stat: 'pace', label: 'Slip Risk', impact: -8 },
    ],
    benefits: 'Direct, physical players who thrive in chaotic conditions',
    suffers: 'Finesse players reliant on precise ball control and dribbling',
  },
  {
    type: 'snowy',
    name: 'Snow',
    icon: <CloudSnow className="h-6 w-6 text-blue-300" />,
    description: 'Heavy snowfall blankets the pitch, reducing visibility and making the surface treacherous.',
    attributes: [
      { stat: 'pace', label: 'Movement Speed', impact: -20 },
      { stat: 'passing', label: 'Pass Accuracy', impact: -12 },
      { stat: 'shooting', label: 'Ball Trajectory', impact: -15 },
      { stat: 'physical', label: 'Endurance', impact: -18 },
    ],
    benefits: 'Strong, resilient players who maintain focus in difficult conditions',
    suffers: 'Speed merchants and players who rely on quick footwork',
  },
  {
    type: 'windy',
    name: 'Wind',
    icon: <Wind className="h-6 w-6 text-[#c9d1d9]" />,
    description: 'Strong gusts affect the flight of the ball, making long passes and shots unpredictable.',
    attributes: [
      { stat: 'passing', label: 'Long Pass Accuracy', impact: -20 },
      { stat: 'shooting', label: 'Long Range Shots', impact: -18 },
      { stat: 'passing', label: 'Crosses', impact: -15 },
      { stat: 'passing', label: 'Set Pieces', impact: -10 },
    ],
    benefits: 'Tall players who can win aerial duels and play direct football',
    suffers: 'Playmakers who rely on long diagonal passes and set piece delivery',
  },
  {
    type: 'foggy',
    name: 'Fog',
    icon: <CloudFog className="h-6 w-6 text-[#8b949e]" />,
    description: 'Thick fog severely limits visibility across the pitch, reducing awareness.',
    attributes: [
      { stat: 'passing', label: 'Long Passes', impact: -18 },
      { stat: 'shooting', label: 'Shooting from Distance', impact: -15 },
      { stat: 'passing', label: 'Through Balls', impact: -12 },
      { stat: 'defending', label: 'Goalkeeper Positioning', impact: -10 },
    ],
    benefits: 'Teams that play short, possession-based football in central areas',
    suffers: 'Counter-attacking teams reliant on long balls and rapid transitions',
  },
  {
    type: 'hot',
    name: 'Extreme Heat',
    icon: <Flame className="h-6 w-6 text-orange-500" />,
    description: 'Dangerously high temperatures with high humidity. Heat exhaustion risk for all players.',
    attributes: [
      { stat: 'stamina', label: 'Stamina Drain', impact: -25 },
      { stat: 'pace', label: 'Sprint Speed', impact: -15 },
      { stat: 'shooting', label: 'Concentration', impact: -10 },
      { stat: 'physical', label: 'Injury Risk', impact: -20 },
    ],
    benefits: 'Players with high stamina, marathon runners, and well-conditioned athletes',
    suffers: 'Heavily built players and those returning from injury',
  },
];

const TACTICAL_ADJUSTMENTS: TacticalAdjustment[] = [
  {
    id: 'long_ball',
    name: 'Play Long Ball',
    description: 'Bypass midfield with direct balls over the top, using physical presence.',
    applicableWeather: ['windy', 'rainy', 'snowy'],
    impact: 'Beneficial in wind if playing with the wind; detrimental against it.',
    performanceChange: 8,
  },
  {
    id: 'ground_ball',
    name: 'Keep Ball on Ground',
    description: 'Play short passes along the floor to maintain control in difficult conditions.',
    applicableWeather: ['rainy', 'windy', 'foggy', 'snowy'],
    impact: 'Reduces turnover risk in wet/slippery conditions.',
    performanceChange: 12,
  },
  {
    id: 'high_press',
    name: 'High Press',
    description: 'Press opponents high up the pitch to force errors in difficult conditions.',
    applicableWeather: ['snowy', 'foggy', 'rainy'],
    impact: 'Cold conditions keep players active; pressing forces mistakes.',
    performanceChange: 6,
  },
];

const MOCK_PLAYERS: PlayerWeatherData[] = [
  {
    id: '1',
    name: 'Marcus Silva',
    position: 'CAM',
    suitability: 42,
    keyStat: 'Dribbling',
    keyStatImpact: -15,
    badge: null,
    playingStyle: 'technical',
  },
  {
    id: '2',
    name: 'James O\'Brien',
    position: 'CB',
    suitability: 88,
    keyStat: 'Physical',
    keyStatImpact: 5,
    badge: 'Rain Master',
    playingStyle: 'physical',
  },
  {
    id: '3',
    name: 'Kofi Asante',
    position: 'ST',
    suitability: 65,
    keyStat: 'Pace',
    keyStatImpact: -8,
    badge: null,
    playingStyle: 'speed',
  },
  {
    id: '4',
    name: 'Lars Bergström',
    position: 'CM',
    suitability: 91,
    keyStat: 'Passing',
    keyStatImpact: -3,
    badge: 'Cold Warrior',
    playingStyle: 'balanced',
  },
  {
    id: '5',
    name: 'Tomás Herrera',
    position: 'RB',
    suitability: 55,
    keyStat: 'Stamina',
    keyStatImpact: -12,
    badge: null,
    playingStyle: 'speed',
  },
  {
    id: '6',
    name: 'Riku Tanaka',
    position: 'GK',
    suitability: 73,
    keyStat: 'Positioning',
    keyStatImpact: -10,
    badge: 'Heat Resistant',
    playingStyle: 'balanced',
  },
];

const HISTORICAL_RECORDS: HistoricalRecord[] = [
  { condition: 'sunny', label: 'Sunny', icon: <Sun className="h-4 w-4 text-yellow-400" />, won: 8, drawn: 3, lost: 1, goalsFor: 24, goalsAgainst: 10 },
  { condition: 'rainy', label: 'Rainy', icon: <CloudRain className="h-4 w-4 text-blue-400" />, won: 5, drawn: 4, lost: 5, goalsFor: 18, goalsAgainst: 16 },
  { condition: 'windy', label: 'Windy', icon: <Wind className="h-4 w-4 text-[#c9d1d9]" />, won: 3, drawn: 2, lost: 4, goalsFor: 11, goalsAgainst: 14 },
  { condition: 'snowy', label: 'Snowy', icon: <CloudSnow className="h-4 w-4 text-blue-300" />, won: 1, drawn: 1, lost: 3, goalsFor: 4, goalsAgainst: 9 },
];

const WEATHER_EVENTS: WeatherEvent[] = [
  {
    minute: 35,
    description: 'Rain starts to fall steadily across the pitch.',
    tacticalRecommendation: 'Switch to ground passing and instruct forwards to stay central.',
    substitutionSuggestion: 'Consider bringing on a defensive midfielder for stability.',
    impactLevel: 'medium',
  },
  {
    minute: 60,
    description: 'Wind intensifies significantly, gusts reaching 40 km/h.',
    tacticalRecommendation: 'Avoid long balls; play short and retain possession in midfield.',
    substitutionSuggestion: 'Replace your winger with a more physical wide player.',
    impactLevel: 'high',
  },
  {
    minute: 75,
    description: 'Fog rolls in, reducing visibility to under 50 meters.',
    tacticalRecommendation: 'Pull defenders closer together and communicate constantly.',
    substitutionSuggestion: 'Bring on an experienced defender for aerial coverage.',
    impactLevel: 'high',
  },
];

const STADIUM_FACILITIES: StadiumFacility[] = [
  {
    name: 'Stadium Roof',
    currentValue: 'Open',
    upgradeCost: '€2.5M',
    mitigationPercent: 40,
    icon: <Shield className="h-5 w-5 text-emerald-400" />,
  },
  {
    name: 'Under-soil Heating',
    currentValue: 'Yes',
    upgradeCost: 'N/A',
    mitigationPercent: 25,
    icon: <Flame className="h-5 w-5 text-orange-400" />,
  },
  {
    name: 'Drainage System',
    currentValue: 'Good',
    upgradeCost: '€800K',
    mitigationPercent: 20,
    icon: <Droplets className="h-5 w-5 text-blue-400" />,
  },
  {
    name: 'Pitch Lighting',
    currentValue: 'Standard',
    upgradeCost: '€1.2M',
    mitigationPercent: 10,
    icon: <Sun className="h-5 w-5 text-yellow-400" />,
  },
];

// ────────────────────────────────────────────────────────────
// Sub-Components
// ────────────────────────────────────────────────────────────

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-[#c9d1d9]">{title}</h2>
        {subtitle && <p className="text-[10px] text-[#8b949e] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#161b22] border border-[#30363d] rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  const config = {
    ideal: { label: 'Ideal', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    moderate: { label: 'Moderate', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    extreme: { label: 'Extreme', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };
  const c = config[severity];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border rounded-md ${c.color}`}>
      {severity === 'extreme' && <AlertTriangle className="h-3 w-3" />}
      {c.label}
    </span>
  );
}

function ImpactBar({ value, label }: { value: number; label: string }) {
  const isNegative = value < 0;
  const barColor = isNegative ? 'bg-red-500' : 'bg-emerald-500';
  const textColor = isNegative ? 'text-red-400' : 'text-emerald-400';
  const absValue = Math.abs(value);
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[#8b949e] min-w-[100px]">{label}</span>
      <div className="flex-1 h-1.5 bg-[#0d1117] rounded-sm overflow-hidden">
        <motion.div
          className={`h-full ${barColor} rounded-sm`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, width: `${absValue}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className={`text-xs font-semibold min-w-[40px] text-right ${textColor}`}>
        {isNegative ? '' : '+'}{value}%
      </span>
    </div>
  );
}

function SuitabilityMeter({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-500' :
    score >= 60 ? 'bg-yellow-500' :
    score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor =
    score >= 80 ? 'text-emerald-400' :
    score >= 60 ? 'text-yellow-400' :
    score >= 40 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#0d1117] rounded-sm overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-sm`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className={`text-xs font-bold min-w-[28px] text-right ${textColor}`}>{score}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 1. Weather Overview Dashboard
// ────────────────────────────────────────────────────────────

function WeatherOverviewDashboard({
  currentWeather,
  forecast,
}: {
  currentWeather: { type: WeatherType; temp: number; humidity: number; windSpeed: number; windDirection: string; pitchCondition: string; severity: SeverityLevel };
  forecast: WeatherForecast[];
}) {
  const changeProbability = useMemo(() => {
    const probs: Record<string, number> = {
      sunny: 15, cloudy: 25, rainy: 45, windy: 35,
      snowy: 50, foggy: 30, hot: 10, stormy: 60,
    };
    return probs[currentWeather.type] ?? 20;
  }, [currentWeather.type]);

  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<CloudSun className="h-4 w-4 text-emerald-400" />}
        title="Weather Overview"
        subtitle="Current match day conditions"
      />

      {/* Main Weather Card */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 bg-[#0d1117] border border-[#30363d] rounded-lg">
              {WEATHER_ICONS[currentWeather.type]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#c9d1d9] capitalize">{currentWeather.type.replace('_', ' ')}</h3>
                <SeverityBadge severity={currentWeather.severity} />
              </div>
              <p className="text-xs text-[#8b949e] mt-1">Match Day Conditions</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-[10px] font-medium text-[#8b949e] uppercase">Temperature</span>
            </div>
            <span className="text-base font-bold text-[#c9d1d9]">{currentWeather.temp}°C</span>
          </div>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] font-medium text-[#8b949e] uppercase">Humidity</span>
            </div>
            <span className="text-base font-bold text-[#c9d1d9]">{currentWeather.humidity}%</span>
          </div>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="h-3.5 w-3.5 text-[#8b949e]" />
              <span className="text-[10px] font-medium text-[#8b949e] uppercase">Wind</span>
            </div>
            <span className="text-base font-bold text-[#c9d1d9]">{currentWeather.windSpeed} km/h {currentWeather.windDirection}</span>
          </div>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] font-medium text-[#8b949e] uppercase">Pitch</span>
            </div>
            <span className="text-base font-bold text-[#c9d1d9]">{currentWeather.pitchCondition}</span>
          </div>
        </div>

        {/* Weather Change Probability */}
        <div className="flex items-center justify-between bg-[#0d1117] border border-[#21262d] rounded-md p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-[#8b949e]">In-match weather change probability</span>
          </div>
          <span className={`text-sm font-bold ${changeProbability > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {changeProbability}%
          </span>
        </div>
      </Card>

      {/* 5-Day Forecast Strip */}
      <Card className="!p-3">
        <div className="flex items-center gap-1 mb-3">
          <Calendar className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] font-semibold uppercase text-[#8b949e] tracking-wide">5-Day Forecast</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {forecast.map((day, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-md border transition-colors ${
                i === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-[#0d1117] border-[#21262d]'
              }`}
            >
              <span className={`text-[10px] font-semibold ${i === 0 ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                {day.day}
              </span>
              {WEATHER_SMALL_ICONS[day.condition]}
              <span className="text-xs font-bold text-[#c9d1d9]">{day.temp}°</span>
              <SeverityBadge severity={day.severity} />
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// 2. Weather Impact Analysis
// ────────────────────────────────────────────────────────────

function WeatherImpactAnalysis({ activeWeather }: { activeWeather: WeatherType }) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<TrendingDown className="h-4 w-4 text-amber-400" />}
        title="Weather Impact Analysis"
        subtitle="How conditions affect player attributes"
      />

      <div className="space-y-2">
        {WEATHER_IMPACTS.map((impact) => {
          const isActive = impact.type === activeWeather;
          const isExpanded = expandedCard === impact.type;

          return (
            <motion.div
              key={impact.type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`transition-colors cursor-pointer`} onClick={() => setExpandedCard(isExpanded ? null : impact.type)}>
              <Card className={`!p-3 ${isActive ? 'border-emerald-500/40' : ''}`}>
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-md border ${
                      isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#0d1117] border-[#21262d]'
                    }`}>
                      {impact.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#c9d1d9]">{impact.name}</h4>
                        {isActive && (
                          <span className="px-1.5 py-px text-[8px] font-bold uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 rounded-sm">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#8b949e] mt-0.5 line-clamp-1">{impact.description}</p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ opacity: isExpanded ? 0.4 : 1 }}
                    className="text-[#8b949e]"
                  >
                    <ChevronRight className={`h-4 w-4 transition-all ${isExpanded ? 'rotate-90' : ''}`} />
                  </motion.div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 pt-3 border-t border-[#30363d]"
                    >
                      {/* Attribute Impacts */}
                      <div className="space-y-2 mb-3">
                        {impact.attributes.map((attr, idx) => (
                          <ImpactBar key={idx} value={attr.impact} label={attr.label} />
                        ))}
                      </div>

                      {/* Who Benefits / Suffers */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-md p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            <span className="text-[10px] font-semibold text-emerald-400 uppercase">Benefits</span>
                          </div>
                          <p className="text-[10px] text-[#8b949e] leading-relaxed">{impact.benefits}</p>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/15 rounded-md p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingDown className="h-3 w-3 text-red-400" />
                            <span className="text-[10px] font-semibold text-red-400 uppercase">Suffers</span>
                          </div>
                          <p className="text-[10px] text-[#8b949e] leading-relaxed">{impact.suffers}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// 3. Tactical Weather Adjustments
// ────────────────────────────────────────────────────────────

function TacticalWeatherAdjustments({ activeWeather }: { activeWeather: WeatherType }) {
  const [sleeveChoice, setSleeveChoice] = useState<'short' | 'long' | 'thermal'>('long');
  const [studChoice, setStudChoice] = useState<'soft' | 'medium' | 'firm' | 'artificial'>('soft');
  const [hydration, setHydration] = useState<'normal' | 'increased' | 'maximum'>('increased');
  const [activeTactics, setActiveTactics] = useState<Set<string>>(new Set());
  const [autoOptimized, setAutoOptimized] = useState(false);

  const sleeveOptions: { value: 'short' | 'long' | 'thermal'; label: string; icon: React.ReactNode }[] = [
    { value: 'short', label: 'Short Sleeves', icon: <Sun className="h-3.5 w-3.5" /> },
    { value: 'long', label: 'Long Sleeves', icon: <Shield className="h-3.5 w-3.5" /> },
    { value: 'thermal', label: 'Thermal Gear', icon: <Flame className="h-3.5 w-3.5" /> },
  ];

  const studOptions: { value: 'soft' | 'medium' | 'firm' | 'artificial'; label: string; icon: React.ReactNode }[] = [
    { value: 'soft', label: 'Soft Ground', icon: <Droplets className="h-3.5 w-3.5" /> },
    { value: 'medium', label: 'Medium', icon: <Cloud className="h-3.5 w-3.5" /> },
    { value: 'firm', label: 'Firm Ground', icon: <Sun className="h-3.5 w-3.5" /> },
    { value: 'artificial', label: 'Artificial', icon: <Zap className="h-3.5 w-3.5" /> },
  ];

  const hydrationOptions: { value: 'normal' | 'increased' | 'maximum'; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'increased', label: 'Increased' },
    { value: 'maximum', label: 'Maximum' },
  ];

  const handleAutoOptimize = () => {
    const newSleeve: Record<WeatherType, 'short' | 'long' | 'thermal'> = {
      sunny: 'short', cloudy: 'long', rainy: 'long', windy: 'long',
      snowy: 'thermal', foggy: 'long', hot: 'short', stormy: 'thermal',
    };
    const newStuds: Record<WeatherType, 'soft' | 'medium' | 'firm' | 'artificial'> = {
      sunny: 'firm', cloudy: 'firm', rainy: 'soft', windy: 'medium',
      snowy: 'soft', foggy: 'medium', hot: 'firm', stormy: 'soft',
    };
    const newHydration: Record<WeatherType, 'normal' | 'increased' | 'maximum'> = {
      sunny: 'increased', cloudy: 'normal', rainy: 'normal', windy: 'normal',
      snowy: 'increased', foggy: 'normal', hot: 'maximum', stormy: 'increased',
    };

    setSleeveChoice(newSleeve[activeWeather]);
    setStudChoice(newStuds[activeWeather]);
    setHydration(newHydration[activeWeather]);

    const applicable = TACTICAL_ADJUSTMENTS.filter(t => t.applicableWeather.includes(activeWeather));
    setActiveTactics(new Set(applicable.map(t => t.id)));
    setAutoOptimized(true);
    setTimeout(() => setAutoOptimized(false), 2000);
  };

  const toggleTactic = (id: string) => {
    setActiveTactics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<Settings className="h-4 w-4 text-blue-400" />}
        title="Tactical Weather Adjustments"
        subtitle="Pre-match preparation for current conditions"
      />

      <Card>
        {/* Auto-Optimize Button */}
        <button
          onClick={handleAutoOptimize}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-semibold transition-all mb-4 ${
            autoOptimized
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-[#0d1117] text-[#c9d1d9] border-[#30363d] hover:border-emerald-500/30 hover:text-emerald-400'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          {autoOptimized ? 'Settings Optimized!' : 'Auto-Optimize for Current Weather'}
        </button>

        {/* Kit Selection */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-[#c9d1d9] mb-2 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[#8b949e]" />
            Kit Selection
          </h4>
          <div className="grid grid-cols-3 gap-1.5">
            {sleeveOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSleeveChoice(opt.value)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md border text-[10px] font-medium transition-all ${
                  sleeveChoice === opt.value
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:border-[#30363d]'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stud Selection */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-[#c9d1d9] mb-2 flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-[#8b949e]" />
            Stud Type
          </h4>
          <div className="grid grid-cols-4 gap-1.5">
            {studOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStudChoice(opt.value)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-md border text-[10px] font-medium transition-all ${
                  studChoice === opt.value
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:border-[#30363d]'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hydration Strategy */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-[#c9d1d9] mb-2 flex items-center gap-2">
            <Droplets className="h-3.5 w-3.5 text-blue-400" />
            Hydration Strategy
          </h4>
          <div className="grid grid-cols-3 gap-1.5">
            {hydrationOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setHydration(opt.value)}
                className={`flex items-center justify-center py-2 px-2 rounded-md border text-[10px] font-medium transition-all ${
                  hydration === opt.value
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#21262d] hover:border-[#30363d]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Adjustments */}
        <div>
          <h4 className="text-xs font-semibold text-[#c9d1d9] mb-2 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
            Tactical Adjustments
          </h4>
          <div className="space-y-1.5">
            {TACTICAL_ADJUSTMENTS.map(tactic => {
              const isActive = activeTactics.has(tactic.id);
              const applicable = tactic.applicableWeather.includes(activeWeather);
              return (
                <button
                  key={tactic.id}
                  onClick={() => toggleTactic(tactic.id)}
                  className={`w-full text-left rounded-md border p-3 transition-all ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : applicable
                        ? 'bg-[#0d1117] border-[#21262d] hover:border-[#30363d]'
                        : 'bg-[#0d1117] border-[#21262d] opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${isActive ? 'text-amber-400' : 'text-[#c9d1d9]'}`}>
                      {tactic.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-emerald-400">+{tactic.performanceChange}%</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8b949e] line-clamp-1">{tactic.description}</p>
                  <p className="text-[10px] text-[#8b949e] mt-1 opacity-75 line-clamp-1">{tactic.impact}</p>
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// 4. Player Weather Suitability
// ────────────────────────────────────────────────────────────

function PlayerWeatherSuitability({ activeWeather }: { activeWeather: WeatherType }) {
  const sortedPlayers = useMemo(() => {
    return [...MOCK_PLAYERS].sort((a, b) => b.suitability - a.suitability);
  }, []);

  const recommendedXI = useMemo(() => {
    return sortedPlayers.filter(p => p.suitability >= 60).map(p => p.name);
  }, [sortedPlayers]);

  const badgeConfig: Record<string, { label: string; color: string }> = {
    'Rain Master': { label: 'Rain Master', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    'Cold Warrior': { label: 'Cold Warrior', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
    'Heat Resistant': { label: 'Heat Resistant', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  };

  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<Users className="h-4 w-4 text-emerald-400" />}
        title="Player Weather Suitability"
        subtitle="How your squad handles current conditions"
      />

      {/* Recommended XI */}
      <Card className="!p-3">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[10px] font-semibold uppercase text-emerald-400 tracking-wide">
            Recommended XI for Current Weather
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {recommendedXI.map((name, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md"
            >
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              {name}
            </span>
          ))}
          {recommendedXI.length < 11 && (
            <span className="inline-flex items-center px-2 py-1 text-[10px] text-[#8b949e]">
              +{11 - recommendedXI.length} more from squad
            </span>
          )}
        </div>
      </Card>

      {/* Player List */}
      <div className="space-y-1.5">
        {sortedPlayers.map((player, idx) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, delay: idx * 0.05 }}
          >
            <Card className="!p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-8 h-8 bg-[#0d1117] border border-[#21262d] rounded-md">
                  <span className="text-xs font-bold text-[#8b949e]">{player.position}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-[#c9d1d9] truncate">{player.name}</h4>
                    {player.badge && badgeConfig[player.badge] && (
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-px text-[8px] font-bold uppercase border rounded-sm whitespace-nowrap ${badgeConfig[player.badge].color}`}>
                        <Award className="h-2.5 w-2.5" />
                        {badgeConfig[player.badge].label}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8b949e]">
                    {player.playingStyle.charAt(0).toUpperCase() + player.playingStyle.slice(1)} style
                    <span className="mx-1">·</span>
                    Key stat: <span className={player.keyStatImpact < 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {player.keyStat} ({player.keyStatImpact > 0 ? '+' : ''}{player.keyStatImpact}%)
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8b949e] min-w-[70px]">Suitability</span>
                <SuitabilityMeter score={player.suitability} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// 5. Historical Weather Performance
// ────────────────────────────────────────────────────────────

function HistoricalWeatherPerformance() {
  const bestWeather = useMemo(() => {
    let best = HISTORICAL_RECORDS[0];
    for (const r of HISTORICAL_RECORDS) {
      const bestRate = (best.won / Math.max(best.won + best.drawn + best.lost, 1)) * 100;
      const rate = (r.won / Math.max(r.won + r.drawn + r.lost, 1)) * 100;
      if (rate > bestRate) best = r;
    }
    return best;
  }, []);

  const worstWeather = useMemo(() => {
    let worst = HISTORICAL_RECORDS[0];
    for (const r of HISTORICAL_RECORDS) {
      const worstRate = (worst.won / Math.max(worst.won + worst.drawn + worst.lost, 1)) * 100;
      const rate = (r.won / Math.max(r.won + r.drawn + r.lost, 1)) * 100;
      if (rate < worstRate) worst = r;
    }
    return worst;
  }, []);

  const maxGoalsFor = Math.max(...HISTORICAL_RECORDS.map(r => r.goalsFor));

  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<BarChart3 className="h-4 w-4 text-amber-400" />}
        title="Historical Weather Performance"
        subtitle="Season record in different conditions"
      />

      {/* Best / Worst Weather */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="!p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] font-semibold uppercase text-emerald-400 tracking-wide">Best Weather</span>
          </div>
          <div className="flex items-center gap-2">
            {bestWeather.icon}
            <span className="text-sm font-bold text-[#c9d1d9]">{bestWeather.label}</span>
          </div>
          <p className="text-[10px] text-[#8b949e] mt-1">
            {bestWeather.won}W {bestWeather.drawn}D {bestWeather.lost}L
          </p>
        </Card>
        <Card className="!p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="h-3 w-3 text-red-400" />
            <span className="text-[10px] font-semibold uppercase text-red-400 tracking-wide">Worst Weather</span>
          </div>
          <div className="flex items-center gap-2">
            {worstWeather.icon}
            <span className="text-sm font-bold text-[#c9d1d9]">{worstWeather.label}</span>
          </div>
          <p className="text-[10px] text-[#8b949e] mt-1">
            {worstWeather.won}W {worstWeather.drawn}D {worstWeather.lost}L
          </p>
        </Card>
      </div>

      {/* Per-Condition Records */}
      <div className="space-y-1.5">
        {HISTORICAL_RECORDS.map(record => {
          const total = record.won + record.drawn + record.lost;
          const winRate = total > 0 ? Math.round((record.won / total) * 100) : 0;
          const goalDiff = record.goalsFor - record.goalsAgainst;

          return (
            <Card key={record.condition} className="!p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-8 h-8 bg-[#0d1117] border border-[#21262d] rounded-md">
                  {record.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[#c9d1d9]">{record.label}</h4>
                    <span className="text-xs font-bold text-[#8b949e]">{winRate}% win rate</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-[#8b949e]">
                      <span className="text-emerald-400 font-semibold">{record.won}W</span>
                      {' '}
                      <span className="text-amber-400 font-semibold">{record.drawn}D</span>
                      {' '}
                      <span className="text-red-400 font-semibold">{record.lost}L</span>
                    </span>
                    <span className="text-[10px] text-[#8b949e]">
                      GF: <span className="text-[#c9d1d9] font-semibold">{record.goalsFor}</span>
                      {' · '}
                      GA: <span className="text-[#c9d1d9] font-semibold">{record.goalsAgainst}</span>
                      {' · '}
                      GD: <span className={goalDiff >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {goalDiff >= 0 ? '+' : ''}{goalDiff}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              {/* Win Rate Bar */}
              <div className="h-1.5 bg-[#0d1117] rounded-sm overflow-hidden flex">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, width: `${winRate}%` }}
                  transition={{ duration: 0.5 }}
                />
                <motion.div
                  className="h-full bg-amber-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, width: `${total > 0 ? (record.drawn / total) * 100 : 0}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
                <motion.div
                  className="h-full bg-red-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, width: `${total > 0 ? (record.lost / total) * 100 : 0}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* SVG Bar Chart — Goals Scored per Condition */}
      <Card className="!p-3">
        <div className="flex items-center gap-1.5 mb-3">
          <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-[10px] font-semibold uppercase text-[#8b949e] tracking-wide">Goals Scored per Condition</span>
        </div>
        <svg viewBox="0 0 320 100" className="w-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(v => (
            <line
              key={v}
              x1="50"
              y1={5 + (90 - v * 0.9)}
              x2="310"
              y2={5 + (90 - v * 0.9)}
              stroke="#21262d"
              strokeWidth="0.5"
            />
          ))}
          {HISTORICAL_RECORDS.map((record, i) => {
            const barWidth = 45;
            const gap = 12;
            const startX = 60 + i * (barWidth + gap);
            const barHeight = maxGoalsFor > 0 ? (record.goalsFor / maxGoalsFor) * 75 : 0;
            const barY = 95 - barHeight;

            return (
              <g key={record.condition}>
                {/* Bar */}
                <motion.rect
                  x={startX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill="#10b981"
                  rx="2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                />
                {/* Value label */}
                <text
                  x={startX + barWidth / 2}
                  y={barY - 4}
                  textAnchor="middle"
                  fill="#c9d1d9"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {record.goalsFor}
                </text>
                {/* Condition label */}
                <text
                  x={startX + barWidth / 2}
                  y={97}
                  textAnchor="middle"
                  fill="#8b949e"
                  fontSize="7"
                >
                  {record.label}
                </text>
              </g>
            );
          })}
        </svg>
      </Card>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// 6. Weather Events During Match
// ────────────────────────────────────────────────────────────

function WeatherEventsDuringMatch() {
  const [preparingSubs, setPreparingSubs] = useState(false);

  const impactLevelConfig = {
    low: { label: 'Low', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    medium: { label: 'Medium', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    high: { label: 'High', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };

  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
        title="Weather Events During Match"
        subtitle="Simulated in-match weather changes"
      />

      {/* Prepare Substitutions Button */}
      <button
        onClick={() => setPreparingSubs(true)}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-semibold transition-all ${
          preparingSubs
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-amber-500/30 hover:text-amber-400'
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        {preparingSubs ? 'Substitution Plan Ready' : 'Prepare Substitutions'}
      </button>

      <AnimatePresence>
        {preparingSubs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="!p-3 border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase text-amber-400 tracking-wide">
                  Substitution Plan
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-red-400 font-semibold">OFF:</span>
                  <span className="text-[#c9d1d9]">Marcus Silva (CAM)</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-400 font-semibold">ON:</span>
                  <span className="text-[#c9d1d9]">Lars Bergström (CM)</span>
                </div>
                <p className="text-[10px] text-[#8b949e] mt-1">Reason: Better suited for wet conditions, stronger aerial presence.</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weather Events */}
      <div className="space-y-1.5">
        {WEATHER_EVENTS.map((event, idx) => {
          const config = impactLevelConfig[event.impactLevel];
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.08 }}
            >
              <Card className="!p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#c9d1d9]">{event.minute}&apos;</span>
                    <span className="text-xs text-[#8b949e]">—</span>
                    <span className="text-xs font-medium text-[#c9d1d9]">{event.description}</span>
                  </div>
                  <span className={`px-1.5 py-px text-[8px] font-bold uppercase border rounded-sm ${config.color}`}>
                    {config.label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-[#8b949e]">
                      <span className="text-[#c9d1d9] font-medium">Tactical:</span> {event.tacticalRecommendation}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-[#8b949e]">
                      <span className="text-[#c9d1d9] font-medium">Substitution:</span> {event.substitutionSuggestion}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// 7. Stadium Weather Infrastructure
// ────────────────────────────────────────────────────────────

function StadiumWeatherInfrastructure() {
  const [pitchCondition] = useState<'Perfect' | 'Good' | 'Average' | 'Poor' | 'Terrible'>('Good');

  const pitchConditionConfig: Record<string, { value: number; color: string; textColor: string }> = {
    Perfect: { value: 95, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    Good: { value: 75, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    Average: { value: 50, color: 'bg-amber-500', textColor: 'text-amber-400' },
    Poor: { value: 30, color: 'bg-orange-500', textColor: 'text-orange-400' },
    Terrible: { value: 10, color: 'bg-red-500', textColor: 'text-red-400' },
  };

  const condConfig = pitchConditionConfig[pitchCondition];
  const totalMitigation = STADIUM_FACILITIES.reduce((sum, f) => sum + f.mitigationPercent, 0);

  return (
    <section className="space-y-3">
      <SectionTitle
        icon={<Shield className="h-4 w-4 text-emerald-400" />}
        title="Stadium Weather Infrastructure"
        subtitle="Facilities that mitigate weather effects"
      />

      <Card>
        {/* Pitch Condition Meter */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-[#c9d1d9]">Pitch Condition</h4>
            <span className={`text-xs font-bold ${condConfig.textColor}`}>{pitchCondition}</span>
          </div>
          <div className="h-2 bg-[#0d1117] rounded-sm overflow-hidden">
            <motion.div
              className={`h-full ${condConfig.color} rounded-sm`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, width: `${condConfig.value}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          {/* Condition Labels */}
          <div className="flex justify-between mt-1">
            {['Terrible', 'Poor', 'Average', 'Good', 'Perfect'].map(label => (
              <span
                key={label}
                className={`text-[8px] ${label === pitchCondition ? condConfig.textColor + ' font-semibold' : 'text-[#484f58]'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Total Mitigation */}
        <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/15 rounded-md p-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-[#c9d1d9] font-medium">Total Weather Mitigation</span>
          </div>
          <span className="text-sm font-bold text-emerald-400">-{totalMitigation}%</span>
        </div>

        {/* Facilities */}
        <div className="space-y-2 mb-4">
          {STADIUM_FACILITIES.map((facility, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 bg-[#0d1117] border border-[#21262d] rounded-md"
            >
              <div className="flex items-center gap-2.5">
                {facility.icon}
                <div>
                  <span className="text-xs font-medium text-[#c9d1d9]">{facility.name}</span>
                  <span className="text-[10px] text-[#8b949e] ml-2">({facility.currentValue})</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400">-{facility.mitigationPercent}%</span>
                <span className="text-[10px] text-[#8b949e]">{facility.upgradeCost}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade Button */}
        <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
          <Wrench className="h-3.5 w-3.5" />
          Upgrade Facilities
        </button>
      </Card>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// 8. SVG Weather Icon Component (detailed)
// ────────────────────────────────────────────────────────────

function WeatherIconSVG({ type, size = 48 }: { type: WeatherType; size?: number }) {
  switch (type) {
    case 'sunny':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="8" fill="#facc15" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 24 + Math.cos(rad) * 13;
            const y1 = 24 + Math.sin(rad) * 13;
            const x2 = 24 + Math.cos(rad) * 18;
            const y2 = 24 + Math.sin(rad) * 18;
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#facc15" strokeWidth="2" strokeLinecap="round" />;
          })}
        </svg>
      );
    case 'cloudy':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <path d="M14 32 C8 32 4 28 4 23 C4 18 8 14 14 14 C14 8 18 4 24 4 C30 4 34 8 35 14 C40 14 44 18 44 23 C44 28 40 32 35 32 Z" fill="#8b949e" />
        </svg>
      );
    case 'rainy':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <path d="M14 28 C8 28 4 24 4 19 C4 14 8 10 14 10 C14 4 18 0 24 0 C30 0 34 4 35 10 C40 10 44 14 44 19 C44 24 40 28 35 28 Z" fill="#8b949e" />
          <line x1="14" y1="32" x2="12" y2="40" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="32" x2="20" y2="42" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="32" x2="28" y2="38" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="36" x2="16" y2="44" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="34" x2="32" y2="42" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'snowy':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <path d="M14 28 C8 28 4 24 4 19 C4 14 8 10 14 10 C14 4 18 0 24 0 C30 0 34 4 35 10 C40 10 44 14 44 19 C44 24 40 28 35 28 Z" fill="#8b949e" />
          {[{ x: 12, y: 34 }, { x: 22, y: 36 }, { x: 32, y: 33 }, { x: 18, y: 42 }, { x: 28, y: 44 }, { x: 36, y: 40 }].map((pos, i) => (
            <circle key={i} cx={pos.x} cy={pos.y} r="2" fill="#93c5fd" />
          ))}
        </svg>
      );
    case 'windy':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <path d="M8 16 H28 C32 16 32 12 28 12" stroke="#c9d1d9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M8 24 H36 C40 24 40 20 36 20" stroke="#c9d1d9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M8 32 H24 C28 32 28 28 24 28" stroke="#c9d1d9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'foggy':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          {[{ y: 12, w: 36 }, { y: 20, w: 28 }, { y: 28, w: 32 }, { y: 36, w: 24 }].map((line, i) => (
            <line key={i} x1={(48 - line.w) / 2} y1={line.y} x2={(48 + line.w) / 2} y2={line.y} stroke="#8b949e" strokeWidth="3" strokeLinecap="round" opacity={0.4 + i * 0.15} />
          ))}
        </svg>
      );
    case 'hot':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="10" fill="#f97316" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 24 + Math.cos(rad) * 15;
            const y1 = 24 + Math.sin(rad) * 15;
            const x2 = 24 + Math.cos(rad) * 20;
            const y2 = 24 + Math.sin(rad) * 20;
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f97316" strokeWidth="2" strokeLinecap="round" />;
          })}
        </svg>
      );
    case 'stormy':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <path d="M14 24 C8 24 4 20 4 15 C4 10 8 6 14 6 C14 0 18 -4 24 -4 C30 -4 34 0 35 6 C40 6 44 10 44 15 C44 20 40 24 35 24 Z" fill="#6b7280" />
          <polygon points="22,26 18,36 24,34 20,46 32,32 25,34 28,26" fill="#facc15" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="8" fill="#8b949e" />
        </svg>
      );
  }
}

// ────────────────────────────────────────────────────────────
// 9. Weather Condition Selector (Tab Bar)
// ────────────────────────────────────────────────────────────

function WeatherSelector({
  active,
  onChange,
}: {
  active: WeatherType;
  onChange: (type: WeatherType) => void;
}) {
  const weatherOptions: { type: WeatherType; label: string }[] = [
    { type: 'sunny', label: 'Sunny' },
    { type: 'rainy', label: 'Rain' },
    { type: 'snowy', label: 'Snow' },
    { type: 'windy', label: 'Wind' },
    { type: 'foggy', label: 'Fog' },
    { type: 'hot', label: 'Heat' },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {weatherOptions.map(opt => (
        <button
          key={opt.type}
          onClick={() => onChange(opt.type)}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 ${
            active === opt.type
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-[#161b22] text-[#8b949e] border-[#21262d] hover:border-[#30363d] hover:text-[#c9d1d9]'
          }`}
        >
          {WEATHER_SMALL_ICONS[opt.type]}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 10. Detailed Weather Info Card (expanded stat breakdown)
// ────────────────────────────────────────────────────────────

function DetailedWeatherInfoCard({ weatherType }: { weatherType: WeatherType }) {
  const impactData = WEATHER_IMPACTS.find(w => w.type === weatherType);
  if (!impactData) return null;

  const totalNegImpact = impactData.attributes.reduce((sum, a) => sum + Math.abs(Math.min(a.impact, 0)), 0);
  const totalPosImpact = impactData.attributes.reduce((sum, a) => sum + Math.max(a.impact, 0), 0);
  const overallImpact = totalNegImpact > 0 ? Math.round(-totalNegImpact + totalPosImpact) : Math.round(totalPosImpact);

  return (
    <Card className="!p-3 border-emerald-500/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-12 h-12 bg-[#0d1117] border border-[#30363d] rounded-lg">
          <WeatherIconSVG type={weatherType} size={40} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#c9d1d9]">{impactData.name}</h3>
          <p className="text-[10px] text-[#8b949e] mt-0.5 line-clamp-2">{impactData.description}</p>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${overallImpact < -20 ? 'text-red-400' : overallImpact < -10 ? 'text-amber-400' : overallImpact < 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {overallImpact > 0 ? '+' : ''}{overallImpact}%
          </div>
          <span className="text-[8px] font-semibold uppercase text-[#8b949e]">Overall</span>
        </div>
      </div>

      {/* Attribute breakdown grid */}
      <div className="grid grid-cols-2 gap-2">
        {impactData.attributes.map((attr, idx) => (
          <div key={idx} className="bg-[#0d1117] border border-[#21262d] rounded-md p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-[#8b949e]">{attr.label}</span>
              <span className={`text-xs font-bold ${attr.impact < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {attr.impact > 0 ? '+' : ''}{attr.impact}%
              </span>
            </div>
            <div className="h-1 bg-[#161b22] rounded-sm overflow-hidden">
              <motion.div
                className={`h-full rounded-sm ${attr.impact < 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7, width: `${Math.abs(attr.impact) * 4}%` }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// 11. Weather Trend Mini Chart (SVG sparkline)
// ────────────────────────────────────────────────────────────

function WeatherTrendChart() {
  const data = [72, 65, 58, 70, 48, 62, 55, 80, 45, 68, 52, 74];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 280 + 10;
    const y = 40 - ((v - min) / range) * 30;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card className="!p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold uppercase text-[#8b949e] tracking-wide">Weather Performance Trend</span>
      </div>
      <svg viewBox="0 0 300 55" className="w-full">
        {/* Area fill */}
        <polygon
          points={`10,42 ${points} 290,42`}
          fill="#10b981"
          opacity="0.08"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Latest point */}
        <circle cx={290} cy={40 - ((data[data.length - 1] - min) / range) * 30} r="3" fill="#10b981" />
        {/* Labels */}
        <text x="10" y="52" fill="#8b949e" fontSize="7">Jan</text>
        <text x="145" y="52" fill="#8b949e" fontSize="7">Jun</text>
        <text x="280" y="52" fill="#8b949e" fontSize="7">Dec</text>
      </svg>
      <p className="text-[10px] text-[#8b949e] mt-1 text-center">Match rating in varying weather conditions across the season</p>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// 12. Match Preparation Summary
// ────────────────────────────────────────────────────────────

function MatchPreparationSummary({ activeWeather }: { activeWeather: WeatherType }) {
  const impactData = WEATHER_IMPACTS.find(w => w.type === activeWeather);

  const totalNegImpact = impactData
    ? impactData.attributes.reduce((sum, a) => sum + Math.abs(Math.min(a.impact, 0)), 0)
    : 0;
  const mitigationReduction = Math.min(totalNegImpact * 0.35, 25);
  const netImpact = Math.round(totalNegImpact - mitigationReduction);

  const readinessScore = Math.max(0, Math.min(100, 75 - netImpact + Math.round(mitigationReduction * 0.5)));

  const readinessColor =
    readinessScore >= 80 ? 'text-emerald-400' :
    readinessScore >= 60 ? 'text-amber-400' : 'text-red-400';
  const readinessBg =
    readinessScore >= 80 ? 'bg-emerald-500' :
    readinessScore >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Card className="!p-3 border-emerald-500/15">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-semibold text-[#c9d1d9]">Match Preparation Summary</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center py-2 px-1 bg-[#0d1117] border border-[#21262d] rounded-md">
          <div className={`text-lg font-bold ${readinessColor}`}>{readinessScore}</div>
          <span className="text-[8px] font-semibold uppercase text-[#8b949e]">Readiness</span>
        </div>
        <div className="text-center py-2 px-1 bg-[#0d1117] border border-[#21262d] rounded-md">
          <div className="text-lg font-bold text-red-400">-{netImpact}%</div>
          <span className="text-[8px] font-semibold uppercase text-[#8b949e]">Net Penalty</span>
        </div>
        <div className="text-center py-2 px-1 bg-[#0d1117] border border-[#21262d] rounded-md">
          <div className="text-lg font-bold text-emerald-400">-{Math.round(mitigationReduction)}%</div>
          <span className="text-[8px] font-semibold uppercase text-[#8b949e]">Mitigated</span>
        </div>
      </div>

      {/* Readiness bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#8b949e]">Overall Readiness</span>
          <span className={`text-[10px] font-bold ${readinessColor}`}>{readinessScore}/100</span>
        </div>
        <div className="h-2 bg-[#0d1117] rounded-sm overflow-hidden">
          <motion.div
            className={`h-full ${readinessBg} rounded-sm`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8, width: `${readinessScore}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* Advice */}
      {readinessScore < 60 && (
        <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/15 rounded-md p-2 mt-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-[#8b949e]">
            <span className="text-red-400 font-medium">Warning:</span> Your team is under-prepared for current conditions.
            Consider upgrading stadium drainage and selecting weather-suitable players.
          </p>
        </div>
      )}
      {readinessScore >= 80 && (
        <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-md p-2 mt-2">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-[#8b949e]">
            <span className="text-emerald-400 font-medium">Excellent:</span> Your team is well-prepared for current weather conditions.
            Maintain tactical discipline throughout the match.
          </p>
        </div>
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// 13. Weather Comparison Cards (Side by side stats)
// ────────────────────────────────────────────────────────────

function WeatherComparisonCards() {
  const bestRecord = HISTORICAL_RECORDS.reduce((best, r) => {
    const bestRate = (best.won / Math.max(best.won + best.drawn + best.lost, 1)) * 100;
    const rate = (r.won / Math.max(r.won + r.drawn + r.lost, 1)) * 100;
    return rate > bestRate ? r : best;
  });

  const worstRecord = HISTORICAL_RECORDS.reduce((worst, r) => {
    const worstRate = (worst.won / Math.max(worst.won + worst.drawn + worst.lost, 1)) * 100;
    const rate = (r.won / Math.max(r.won + r.drawn + worst.lost, 1)) * 100;
    return rate < worstRate ? r : worst;
  });

  const renderStatRow = (label: string, bestVal: number | string, worstVal: number | string, invert = false) => {
    const bestNum = typeof bestVal === 'number' ? bestVal : 0;
    const worstNum = typeof worstVal === 'number' ? worstVal : 0;
    const bestIsHigher = invert ? bestNum < worstNum : bestNum > worstNum;

    return (
      <div className="flex items-center justify-between py-1.5 border-b border-[#21262d] last:border-0">
        <span className="text-[10px] text-[#8b949e] w-20">{label}</span>
        <div className="flex-1 flex items-center justify-end gap-3">
          <span className={`text-xs font-bold min-w-[40px] text-right ${bestIsHigher ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
            {bestVal}
          </span>
          <span className="text-[10px] text-[#484f58]">vs</span>
          <span className={`text-xs font-bold min-w-[40px] text-right ${!bestIsHigher ? 'text-red-400' : 'text-[#c9d1d9]'}`}>
            {worstVal}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="!p-3">
      <div className="flex items-center gap-1.5 mb-3">
        <GitCompareArrows className="h-3.5 w-3.5 text-[#8b949e]" />
        <span className="text-[10px] font-semibold uppercase text-[#8b949e] tracking-wide">Best vs Worst Condition</span>
      </div>
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-1.5">
          {bestRecord.icon}
          <span className="text-xs font-semibold text-emerald-400">{bestRecord.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-red-400">{worstRecord.label}</span>
          {worstRecord.icon}
        </div>
      </div>
      <div className="bg-[#0d1117] border border-[#21262d] rounded-md px-3 py-1">
        {renderStatRow('Win Rate', `${Math.round((bestRecord.won / Math.max(bestRecord.won + bestRecord.drawn + bestRecord.lost, 1)) * 100)}%`, `${Math.round((worstRecord.won / Math.max(worstRecord.won + worstRecord.drawn + worstRecord.lost, 1)) * 100)}%`)}
        {renderStatRow('Goals For', bestRecord.goalsFor, worstRecord.goalsFor)}
        {renderStatRow('Goals Against', bestRecord.goalsAgainst, worstRecord.goalsAgainst, true)}
        {renderStatRow('Goal Diff', bestRecord.goalsFor - bestRecord.goalsAgainst, worstRecord.goalsFor - worstRecord.goalsAgainst)}
        {renderStatRow('Points/Match', ((bestRecord.won * 3 + bestRecord.drawn) / Math.max(bestRecord.won + bestRecord.drawn + bestRecord.lost, 1)).toFixed(1), ((worstRecord.won * 3 + worstRecord.drawn) / Math.max(worstRecord.won + worstRecord.drawn + worstRecord.lost, 1)).toFixed(1))}
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// 14. Weather Advisory Banner
// ────────────────────────────────────────────────────────────

function WeatherAdvisoryBanner({ weatherType }: { weatherType: WeatherType }) {
  const isExtreme = weatherType === 'hot' || weatherType === 'snowy' || weatherType === 'stormy';
  const isModerate = weatherType === 'rainy' || weatherType === 'windy' || weatherType === 'foggy';

  if (!isExtreme && !isModerate) return null;

  const messages: Partial<Record<WeatherType, string>> = {
    rainy: 'Wet conditions expected. Ground passing recommended. Ensure proper stud selection.',
    windy: 'Strong winds forecast. Avoid long balls and set pieces that rely on aerial accuracy.',
    snowy: 'Heavy snowfall warning. Player movement will be significantly reduced. Prepare for a physical battle.',
    foggy: 'Poor visibility expected. Short passing and communication will be critical.',
    hot: 'Extreme heat advisory. Hydration is critical. Consider more frequent substitutions.',
    stormy: 'Severe storm warning. Match may be at risk of abandonment. Monitor conditions closely.',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border p-3 flex items-start gap-2.5 ${
        isExtreme
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-amber-500/5 border-amber-500/20'
      }`}
    >
      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${isExtreme ? 'text-red-400' : 'text-amber-400'}`} />
      <div>
        <h4 className={`text-xs font-semibold mb-0.5 ${isExtreme ? 'text-red-400' : 'text-amber-400'}`}>
          {isExtreme ? 'Extreme Weather Advisory' : 'Weather Advisory'}
        </h4>
        <p className="text-[10px] text-[#8b949e] leading-relaxed">
          {messages[weatherType] ?? 'Check weather conditions before the match.'}
        </p>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// 15. Detailed Player Weather Breakdown
// ────────────────────────────────────────────────────────────

function DetailedPlayerWeatherBreakdown({ activeWeather }: { activeWeather: WeatherType }) {
  const selectedPlayers = MOCK_PLAYERS.slice(0, 3);

  const weatherMultipliers: Record<WeatherType, Record<string, number>> = {
    sunny: { technical: 0.9, physical: 0.85, aerial: 0.95, balanced: 0.95, speed: 0.88 },
    rainy: { technical: 0.7, physical: 1.1, aerial: 1.05, balanced: 0.95, speed: 0.85 },
    snowy: { technical: 0.75, physical: 1.05, aerial: 0.9, balanced: 0.9, speed: 0.7 },
    windy: { technical: 0.85, physical: 1.0, aerial: 1.15, balanced: 0.95, speed: 0.9 },
    foggy: { technical: 0.9, physical: 1.0, aerial: 0.85, balanced: 0.95, speed: 0.85 },
    hot: { technical: 0.8, physical: 0.7, aerial: 0.85, balanced: 0.8, speed: 0.75 },
    cloudy: { technical: 1.0, physical: 1.0, aerial: 1.0, balanced: 1.0, speed: 1.0 },
    stormy: { technical: 0.65, physical: 0.9, aerial: 0.8, balanced: 0.85, speed: 0.7 },
  };

  const multipliers = weatherMultipliers[activeWeather] ?? weatherMultipliers.cloudy;

  return (
    <Card className="!p-3">
      <div className="flex items-center gap-1.5 mb-3">
        <Users className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-[10px] font-semibold uppercase text-[#8b949e] tracking-wide">Key Player Weather Breakdown</span>
      </div>
      <div className="space-y-3">
        {selectedPlayers.map(player => {
          const multiplier = multipliers[player.playingStyle] ?? 1.0;
          const adjustedRating = Math.round(player.suitability * multiplier);
          const diff = adjustedRating - player.suitability;

          return (
            <div key={player.id} className="bg-[#0d1117] border border-[#21262d] rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-[#161b22] border border-[#30363d] rounded-sm">
                    <span className="text-[9px] font-bold text-[#8b949e]">{player.position}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#c9d1d9]">{player.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold ${diff < -10 ? 'text-red-400' : diff < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {diff > 0 ? '+' : ''}{diff}
                  </span>
                  <span className="text-[10px] text-[#8b949e] ml-1">({adjustedRating})</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[9px] text-[#484f58] uppercase">Style</span>
                  <p className="text-[10px] font-medium text-[#c9d1d9] capitalize">{player.playingStyle}</p>
                </div>
                <div>
                  <span className="text-[9px] text-[#484f58] uppercase">Multiplier</span>
                  <p className={`text-[10px] font-medium ${multiplier < 0.85 ? 'text-red-400' : multiplier < 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {multiplier.toFixed(2)}x
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-[#484f58] uppercase">Adjusted</span>
                  <p className="text-[10px] font-medium text-[#c9d1d9]">{adjustedRating}/100</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// 16. Weather Tips & Suggestions Panel
// ────────────────────────────────────────────────────────────

function WeatherTipsPanel({ weatherType }: { weatherType: WeatherType }) {
  const tips: Partial<Record<WeatherType, { tip: string; priority: 'high' | 'medium' | 'low' }[]>> = {
    sunny: [
      { tip: 'Start with high energy — fatigue sets in faster after 60 minutes.', priority: 'high' },
      { tip: 'Use quick, short passes to minimize time on the ball in the heat.', priority: 'medium' },
      { tip: 'Target opponents who show signs of exhaustion in the second half.', priority: 'low' },
    ],
    rainy: [
      { tip: 'Instruct players to keep the ball on the ground at all times.', priority: 'high' },
      { tip: 'Shoot from distance — wet pitches make the ball skid and deceive keepers.', priority: 'medium' },
      { tip: 'Use physical players in midfield to win loose balls from slips.', priority: 'medium' },
    ],
    snowy: [
      { tip: 'Patience is key — rushing leads to mistakes on a snowy surface.', priority: 'high' },
      { tip: 'Use tall, strong players who can handle the physical demands.', priority: 'high' },
      { tip: 'Substitute tiring players early — conditions drain energy fast.', priority: 'medium' },
    ],
    windy: [
      { tip: 'Play with the wind at your back in the first half if possible.', priority: 'high' },
      { tip: 'Avoid long crosses and set pieces — wind makes them unpredictable.', priority: 'high' },
      { tip: 'Keep the ball in central areas where wind has less effect.', priority: 'medium' },
    ],
    foggy: [
      { tip: 'Communicate constantly — visibility is severely reduced.', priority: 'high' },
      { tip: 'Pull defensive line closer together to cover blind spots.', priority: 'high' },
      { tip: 'Avoid long through balls that players cannot see coming.', priority: 'medium' },
    ],
    hot: [
      { tip: 'Maximum hydration breaks — this is non-negotiable in extreme heat.', priority: 'high' },
      { tip: 'Plan for 2-3 early substitutions to rotate tiring legs.', priority: 'high' },
      { tip: 'Slow the tempo down — conserve energy for crucial moments.', priority: 'medium' },
    ],
  };

  const currentTips = tips[weatherType] ?? [];

  const priorityConfig = {
    high: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400', label: 'HIGH' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400', label: 'MED' },
    low: { color: 'text-[#8b949e]', bg: 'bg-[#161b22] border-[#21262d]', dot: 'bg-[#8b949e]', label: 'LOW' },
  };

  return (
    <Card className="!p-3">
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-semibold uppercase text-[#8b949e] tracking-wide">Weather Tips</span>
      </div>
      <div className="space-y-1.5">
        {currentTips.map((tipData, idx) => {
          const config = priorityConfig[tipData.priority];
          return (
            <div key={idx} className={`flex items-start gap-2 p-2.5 rounded-md border ${config.bg}`}>
              <div className={`w-1.5 h-1.5 ${config.dot} rounded-full mt-1 shrink-0`} />
              <div className="flex-1">
                <p className="text-[10px] text-[#c9d1d9] leading-relaxed">{tipData.tip}</p>
                <span className={`text-[8px] font-bold uppercase ${config.color}`}>{config.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// GitCompareArrows import alias (re-using from lucide-react)
// ────────────────────────────────────────────────────────────

import { GitCompareArrows } from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export default function MatchWeatherEffects() {
  const gameState = useGameStore(state => state.gameState);
  const [activeWeather, setActiveWeather] = useState<WeatherType>('rainy');
  const [activeTab, setActiveTab] = useState<'overview' | 'impact' | 'tactics' | 'players' | 'history' | 'events' | 'stadium'>('overview');

  const currentWeatherData = useMemo(() => ({
    type: activeWeather,
    temp: activeWeather === 'hot' ? 38 : activeWeather === 'snowy' ? -2 : activeWeather === 'sunny' ? 26 : activeWeather === 'rainy' ? 14 : activeWeather === 'windy' ? 11 : activeWeather === 'foggy' ? 8 : 18,
    humidity: activeWeather === 'rainy' ? 92 : activeWeather === 'foggy' ? 98 : activeWeather === 'hot' ? 45 : activeWeather === 'snowy' ? 80 : 55,
    windSpeed: activeWeather === 'windy' ? 42 : activeWeather === 'stormy' ? 65 : activeWeather === 'snowy' ? 18 : activeWeather === 'rainy' ? 15 : 8,
    windDirection: activeWeather === 'windy' ? 'SW' : activeWeather === 'stormy' ? 'NW' : 'N',
    pitchCondition: activeWeather === 'rainy' ? 'Wet' : activeWeather === 'snowy' ? 'Frozen' : activeWeather === 'hot' ? 'Dry' : 'Good',
    severity: (activeWeather === 'hot' || activeWeather === 'snowy' ? 'extreme' : (activeWeather === 'rainy' || activeWeather === 'windy' || activeWeather === 'foggy' ? 'moderate' : 'ideal')) as SeverityLevel,
  }), [activeWeather]);

  const tabs: { id: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <CloudSun className="h-3.5 w-3.5" /> },
    { id: 'impact', label: 'Impact', icon: <TrendingDown className="h-3.5 w-3.5" /> },
    { id: 'tactics', label: 'Tactics', icon: <Settings className="h-3.5 w-3.5" /> },
    { id: 'players', label: 'Players', icon: <Users className="h-3.5 w-3.5" /> },
    { id: 'history', label: 'History', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'events', label: 'Events', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { id: 'stadium', label: 'Stadium', icon: <Shield className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#30363d]">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <CloudSun className="h-5 w-5 text-emerald-400" />
            <h1 className="text-base font-bold text-[#c9d1d9]">Match Weather Effects</h1>
          </div>

          {/* Weather Condition Selector */}
          <WeatherSelector active={activeWeather} onChange={setActiveWeather} />
        </div>

        {/* Tab Navigation */}
        <div className="max-w-lg mx-auto px-2">
          <div className="flex gap-0.5 overflow-x-auto pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 py-2 px-2.5 text-[10px] font-semibold whitespace-nowrap border-b-2 transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'text-emerald-400 border-emerald-400'
                    : 'text-[#8b949e] border-transparent hover:text-[#c9d1d9]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Weather Advisory Banner */}
        <WeatherAdvisoryBanner weatherType={activeWeather} />

        {/* Match Preparation Summary — shown on all tabs */}
        <MatchPreparationSummary activeWeather={activeWeather} />

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <WeatherOverviewDashboard
                currentWeather={currentWeatherData}
                forecast={MOCK_FORECAST}
              />
              <DetailedWeatherInfoCard weatherType={activeWeather} />
              <WeatherTrendChart />
            </motion.div>
          )}

          {activeTab === 'impact' && (
            <motion.div
              key="impact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <WeatherImpactAnalysis activeWeather={activeWeather} />
              <WeatherComparisonCards />
              <WeatherTipsPanel weatherType={activeWeather} />
            </motion.div>
          )}

          {activeTab === 'tactics' && (
            <motion.div
              key="tactics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <TacticalWeatherAdjustments activeWeather={activeWeather} />
              <DetailedPlayerWeatherBreakdown activeWeather={activeWeather} />
            </motion.div>
          )}

          {activeTab === 'players' && (
            <motion.div
              key="players"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <PlayerWeatherSuitability activeWeather={activeWeather} />
              <DetailedPlayerWeatherBreakdown activeWeather={activeWeather} />
              <WeatherTipsPanel weatherType={activeWeather} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <HistoricalWeatherPerformance />
              <WeatherComparisonCards />
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <WeatherEventsDuringMatch />
              <WeatherTipsPanel weatherType={activeWeather} />
            </motion.div>
          )}

          {activeTab === 'stadium' && (
            <motion.div
              key="stadium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <StadiumWeatherInfrastructure />
              <MatchPreparationSummary activeWeather={activeWeather} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
