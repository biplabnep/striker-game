'use client';

import { useSyncExternalStore, useCallback, useMemo, useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import {
  Play,
  Save,
  Trophy,
  MapPin,
  LayoutGrid,
  ArrowRight,
  Zap,
  Shield,
  Code2,
  Gamepad2,
  Clock,
  Star,
  Target,
  Compass,
  Tv,
  Bell,
  Sparkles,
  Calendar,
  BarChart3,
  Eye,
  Flame,
  BookOpen,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { hasSaveSlots, getSaveSlots } from '@/services/persistenceService';

// -----------------------------------------------------------
// Check if any save data exists (localStorage external store)
// -----------------------------------------------------------
function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): boolean {
  try {
    return hasSaveSlots() || !!localStorage.getItem('elite-striker-store');
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

function useHasSaveData(): boolean {
  return useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);
}

// -----------------------------------------------------------
// Scrolling club ticker data — real club names
// -----------------------------------------------------------
const CLUB_TICKER = [
  'Arsenal', 'FC Barcelona', 'Real Madrid', 'Bayern Munich', 'PSG',
  'Juventus', 'Inter Milan', 'AC Milan', 'Liverpool', 'Man City',
  'Man United', 'Chelsea', 'Dortmund', 'Atletico Madrid', 'Napoli',
  'Tottenham', 'Roma', 'Leverkusen', 'Marseille', 'Lyon',
  'AS Monaco', 'Nice', 'Frankfurt', 'Stuttgart', 'Aston Villa',
  'Newcastle', 'Brighton', 'West Ham', 'Lazio', 'Atalanta',
  'Sevilla', 'Valencia', 'Real Sociedad', 'Fiorentina', 'Bologna',
  'RB Leipzig', 'Wolfsburg', 'Freiburg', 'Lille', 'Lens',
  'Rennes', 'Strasbourg', 'Torino', 'Villarreal', 'Bilbao',
  'Real Betis', 'Nottingham Forest', 'Brentford', 'Fulham', 'Everton',
  'Celtic', 'Rangers', 'Ajax', 'Benfica', 'Porto',
];

const TICKER_SEPARATOR = '\u2022';

// Duplicate for seamless loop
const TICKER_ITEMS = [...CLUB_TICKER, ...CLUB_TICKER];

// -----------------------------------------------------------
// Feature highlight cards data
// -----------------------------------------------------------
const FEATURES = [
  { icon: MapPin, value: '96', label: 'Real Clubs', sublabel: 'Across Europe' },
  { icon: Trophy, value: '5', label: 'Top Leagues', sublabel: 'PL, La Liga & more' },
  { icon: LayoutGrid, value: '60+', label: 'Screens', sublabel: 'Deep simulation' },
] as const;

// -----------------------------------------------------------
// Position cards data — "Pick Your Path"
// -----------------------------------------------------------
const POSITIONS = [
  {
    icon: Target,
    name: 'Striker',
    description: 'Score goals, lead the attack, become a legend',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'group-hover:border-emerald-500/40',
  },
  {
    icon: Compass,
    name: 'Midfielder',
    description: 'Dictate play, create chances, control the tempo',
    accent: 'text-sky-400',
    accentBg: 'bg-sky-500/10',
    accentBorder: 'group-hover:border-sky-500/40',
  },
  {
    icon: Shield,
    name: 'Defender',
    description: 'Shut down attacks, command the back line',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'group-hover:border-amber-500/40',
  },
] as const;

// -----------------------------------------------------------
// Season stats data — "Last Season Highlights"
// -----------------------------------------------------------
const SEASON_STATS = [
  { label: 'Goals', value: 12, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  { label: 'Assists', value: 8, color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
  { label: 'Appearances', value: 34, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { label: 'Rating', value: 7.2, color: 'text-purple-400', bgColor: 'bg-purple-500/10', isFloat: true },
] as const;

// -----------------------------------------------------------
// Animated counter hook — opacity-only display
// -----------------------------------------------------------
function useAnimatedCounter(target: number, duration: number = 1200, isFloat: boolean = false): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startVal = 0;

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = startVal + (target - startVal) * eased;
      setCurrent(isFloat ? Math.round(next * 10) / 10 : Math.round(next));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    // Delay start slightly for stagger effect
    const timer = setTimeout(() => requestAnimationFrame(tick), 200);
    return () => clearTimeout(timer);
  }, [target, duration, isFloat]);

  return current;
}

// -----------------------------------------------------------
// Tech badges for version section
// -----------------------------------------------------------
const TECH_BADGES = [
  { icon: Code2, label: 'Next.js 16' },
  { icon: Gamepad2, label: 'TypeScript' },
  { icon: Shield, label: 'Zustand' },
  { icon: Zap, label: 'Framer Motion' },
] as const;

// -----------------------------------------------------------
// Featured Match of the Day data
// -----------------------------------------------------------
const FEATURED_MATCH = {
  homeTeam: 'FC Barcelona',
  awayTeam: 'Real Madrid',
  league: 'La Liga',
  importance: 'Match of the Week',
  stars: 5,
  date: 'Sat, 18:00',
  h2h: 'W2 D1 L2',
  combinedGoals: 14,
} as const;

// -----------------------------------------------------------
// Player Spotlight data
// -----------------------------------------------------------
const FEATURED_PLAYERS = [
  {
    name: 'Kylian Mbappé',
    club: 'Real Madrid',
    position: 'ST',
    overall: 91,
    form: ['W', 'W', 'D', 'W', 'L'] as const,
    keyStat: '12 Goals this season',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    name: 'Erling Haaland',
    club: 'Man City',
    position: 'ST',
    overall: 90,
    form: ['W', 'L', 'W', 'W', 'W'] as const,
    keyStat: '89% Pass Accuracy',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
  },
  {
    name: 'Jude Bellingham',
    club: 'Real Madrid',
    position: 'CAM',
    overall: 88,
    form: ['D', 'W', 'W', 'L', 'W'] as const,
    keyStat: '7 Assists this season',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
] as const;

// -----------------------------------------------------------
// Weekly Challenges data
// -----------------------------------------------------------
const WEEKLY_CHALLENGES = [
  {
    name: 'Score 3 Goals in One Match',
    description: 'Find the net three times in a single match to prove your striker instincts.',
    reward: '500 XP',
    timeRemaining: '2d 14h',
    progress: 1,
    maxProgress: 3,
    difficulty: 'Medium' as const,
  },
  {
    name: 'Complete 5 Training Sessions',
    description: 'Dedicate yourself to improvement by finishing five training sessions this week.',
    reward: '300 XP',
    timeRemaining: '5d 8h',
    progress: 3,
    maxProgress: 5,
    difficulty: 'Easy' as const,
  },
  {
    name: 'Win a Match Without Conceding',
    description: 'Keep a clean sheet while securing victory — the ultimate defensive showcase.',
    reward: '750 XP',
    timeRemaining: '1d 22h',
    progress: 0,
    maxProgress: 1,
    difficulty: 'Hard' as const,
  },
] as const;

const DIFFICULTY_COLORS = {
  Easy: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Medium: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Hard: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
} as const;

// -----------------------------------------------------------
// Version update & community stats
// -----------------------------------------------------------
const VERSION_UPDATE = {
  version: 'v3.5',
  title: 'The Big Leap Update',
  features: [
    'New Injury Recovery Hub — monitor and speed up healing',
    'In-Game Mail System — receive offers and news',
    'Dream Transfer Radar — track your dream moves',
    'Enhanced Match Engine — smarter AI decisions',
  ],
} as const;

const COMMUNITY_STATS = [
  { label: 'Active Players', value: '12,847', icon: Users },
  { label: 'Matches Played', value: '342,591', icon: Trophy },
  { label: 'Community Goals', value: '1,204', icon: Target },
] as const;

// -----------------------------------------------------------
// Recent save slot info type
// -----------------------------------------------------------
interface RecentSaveInfo {
  playerName: string;
  club: string;
  overall: number;
  season: number;
}

function getRecentSaveInfo(): RecentSaveInfo | null {
  try {
    const slots = getSaveSlots();
    if (slots.length === 0) return null;
    const latest = slots[0];
    return {
      playerName: latest.gameState.player.name,
      club: latest.gameState.currentClub.name,
      overall: latest.gameState.player.overall,
      season: latest.gameState.currentSeason,
    };
  } catch {
    return null;
  }
}

// -----------------------------------------------------------
// Football pitch SVG background pattern
// -----------------------------------------------------------
const PITCH_SVG = encodeURIComponent(`
  <svg width="400" height="260" xmlns="http://www.w3.org/2000/svg" fill="none">
    <!-- Pitch outline -->
    <rect x="20" y="20" width="360" height="220" stroke="%23c9d1d9" stroke-width="1.5"/>
    <!-- Center line -->
    <line x1="20" y1="130" x2="380" y2="130" stroke="%23c9d1d9" stroke-width="1"/>
    <!-- Center circle -->
    <circle cx="200" cy="130" r="45" stroke="%23c9d1d9" stroke-width="1"/>
    <!-- Center dot -->
    <circle cx="200" cy="130" r="3" fill="%23c9d1d9"/>
    <!-- Left penalty box -->
    <rect x="20" y="45" width="60" height="170" stroke="%23c9d1d9" stroke-width="1"/>
    <!-- Left small box -->
    <rect x="20" y="85" width="25" height="90" stroke="%23c9d1d9" stroke-width="1"/>
    <!-- Right penalty box -->
    <rect x="320" y="45" width="60" height="170" stroke="%23c9d1d9" stroke-width="1"/>
    <!-- Right small box -->
    <rect x="355" y="85" width="25" height="90" stroke="%23c9d1d9" stroke-width="1"/>
    <!-- Penalty spots -->
    <circle cx="70" cy="130" r="2" fill="%23c9d1d9"/>
    <circle cx="330" cy="130" r="2" fill="%23c9d1d9"/>
    <!-- Corner arcs -->
    <path d="M20 28 A8 8 0 0 1 28 20" stroke="%23c9d1d9" stroke-width="1"/>
    <path d="M380 28 A8 8 0 0 0 372 20" stroke="%23c9d1d9" stroke-width="1"/>
    <path d="M20 232 A8 8 0 0 0 28 240" stroke="%23c9d1d9" stroke-width="1"/>
    <path d="M380 232 A8 8 0 0 1 372 240" stroke="%23c9d1d9" stroke-width="1"/>
  </svg>
`);

// -----------------------------------------------------------
// Ticker sub-component
// -----------------------------------------------------------
function ClubTicker() {
  return (
    <div className="w-full overflow-hidden border-t border-b border-[#30363d] bg-[#161b22] py-3">
      <div className="flex animate-ticker whitespace-nowrap">
        {TICKER_ITEMS.map((club, i) => (
          <span
            key={`${club}-${i}`}
            className="text-[#8b949e] text-xs font-medium tracking-wide mx-4 flex items-center gap-4 shrink-0"
          >
            {club}
            <span className="text-[#30363d]">{TICKER_SEPARATOR}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// Player silhouette SVG component
// -----------------------------------------------------------
function PlayerSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="30" cy="12" r="7" />
      <path d="M30 19 L30 58" />
      <path d="M30 28 L16 42" />
      <path d="M30 28 L44 42" />
      <path d="M30 58 L19 82" />
      <path d="M30 58 L41 82" />
      <path d="M19 82 L15 88" />
      <path d="M41 82 L45 88" />
    </svg>
  );
}

// -----------------------------------------------------------
// Main Menu Component
// -----------------------------------------------------------
export default function MainMenu() {
  const setScreen = useGameStore((state) => state.setScreen);
  const showContinueButtons = useHasSaveData();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const recentSave = useMemo(() => {
    if (!showContinueButtons) return null;
    return getRecentSaveInfo();
  }, [showContinueButtons]);

  // Animated stat counters
  const goals = useAnimatedCounter(SEASON_STATS[0].value, 1400);
  const assists = useAnimatedCounter(SEASON_STATS[1].value, 1400);
  const apps = useAnimatedCounter(SEASON_STATS[2].value, 1400);
  const rating = useAnimatedCounter(SEASON_STATS[3].value, 1400, true);

  const counterValues = useMemo(() => [goals, assists, apps, rating], [goals, assists, apps, rating]);

  const handleNewCareer = useCallback(() => {
    setScreen('career_setup');
  }, [setScreen]);

  const handleContinue = useCallback(() => {
    setScreen('save_load');
  }, [setScreen]);

  const handleLoadGame = useCallback(() => {
    setScreen('save_load');
  }, [setScreen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      {/* ---- Background: football pitch pattern ---- */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,${PITCH_SVG}")`,
          backgroundSize: '400px 260px',
          backgroundPosition: 'center center',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* ---- Scrolling Club Ticker ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      >
        <ClubTicker />
      </motion.div>

      {/* ---- Main Content ---- */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8 relative z-10">
        <div className="flex flex-col items-center gap-7 w-full max-w-lg mx-auto">
          {/* ---- Title Section ---- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Trophy icon with pulse */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center justify-center"
            >
              <div className="relative">
                <Trophy className="h-12 w-12 text-emerald-400" />
                <div className="absolute -inset-2 border border-emerald-500/20 rounded-lg" />
              </div>
            </motion.div>

            {/* Title block */}
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-5xl md:text-6xl font-black tracking-[0.18em] text-[#c9d1d9] text-center leading-none">
                ELITE{' '}
                <span className="text-emerald-400">STRIKER</span>
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-px w-10 bg-[#30363d]" />
                <div className="h-0.5 w-8 bg-emerald-500" />
                <Star className="h-3 w-3 text-emerald-500" />
                <div className="h-0.5 w-8 bg-emerald-500" />
                <div className="h-px w-10 bg-[#30363d]" />
              </div>
              <p className="text-[#8b949e] text-sm tracking-[0.25em] uppercase font-medium">
                Football Career Simulator
              </p>
            </div>
          </motion.div>

          {/* ---- Feature Stats Cards ---- */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: mounted ? 1 : 0 }}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center gap-1.5 bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#484f58] transition-colors"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-emerald-500/10 mb-1">
                  <feature.icon className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-[#c9d1d9] text-2xl font-black leading-none">
                  {feature.value}
                </span>
                <span className="text-[#c9d1d9] text-xs font-semibold leading-tight text-center">
                  {feature.label}
                </span>
                <span className="text-[#484f58] text-[10px] leading-tight text-center">
                  {feature.sublabel}
                </span>
              </motion.div>
            ))}
          </div>

          {/* ---- Pick Your Path — Position Cards ---- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 0.55, duration: 0.45 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-[#21262d]" />
              <span className="text-[#484f58] text-[11px] font-semibold tracking-widest uppercase">
                Pick Your Path
              </span>
              <div className="h-px flex-1 bg-[#21262d]" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {POSITIONS.map((pos, i) => (
                <motion.div
                  key={pos.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: mounted ? 1 : 0 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.35 }}
                  className={`group flex flex-col items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-3.5 transition-colors cursor-default ${pos.accentBorder}`}
                >
                  <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${pos.accentBg}`}>
                    <pos.icon className={`h-4 w-4 ${pos.accent}`} />
                  </div>
                  <span className="text-[#c9d1d9] text-xs font-bold leading-tight text-center">
                    {pos.name}
                  </span>
                  <span className="text-[#484f58] text-[10px] leading-snug text-center">
                    {pos.description}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ---- Last Season Highlights ---- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 0.8, duration: 0.45 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-[#21262d]" />
              <span className="text-[#484f58] text-[11px] font-semibold tracking-widest uppercase">
                Last Season Highlights
              </span>
              <div className="h-px flex-1 bg-[#21262d]" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SEASON_STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: mounted ? 1 : 0 }}
                  transition={{ delay: 0.85 + i * 0.08, duration: 0.35 }}
                  className="flex flex-col items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-3"
                >
                  <div className={`flex items-center justify-center h-7 w-7 rounded-lg ${stat.bgColor}`}>
                    <span className="text-[10px] font-bold">{stat.label.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <span className={`${stat.color} text-xl font-black leading-none tabular-nums`}>
                    {'isFloat' in stat && stat.isFloat ? counterValues[i].toFixed(1) : counterValues[i]}
                  </span>
                  <span className="text-[#484f58] text-[10px] font-medium text-center">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ---- Primary Action Buttons ---- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            className="flex flex-col gap-3 w-full"
          >
            {/* New Career Button — with emerald glow dot */}
            <motion.button
              onClick={handleNewCareer}
              animate={{ opacity: [1, 0.85, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="group relative h-14 w-full flex items-center justify-center gap-2.5 rounded-lg bg-emerald-600 text-white text-lg font-bold transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117]"
            >
              <div className="relative flex items-center">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -inset-1.5 rounded-md bg-emerald-400/30"
                />
                <Play className="h-5 w-5 relative" />
              </div>
              <span>New Career</span>
              <ArrowRight className="h-5 w-5 ml-auto transition-all group-hover:translate-x-1" />
            </motion.button>

            {/* Continue / Load buttons */}
            {showContinueButtons && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: mounted ? 1 : 0 }}
                transition={{ delay: 1.15, duration: 0.35 }}
                className="flex flex-col gap-2.5"
              >
                {/* Continue Career — with pulsing dot + save preview */}
                <button
                  onClick={handleContinue}
                  className="group h-12 w-full flex items-center justify-between gap-2 rounded-lg bg-[#161b22] border border-[#30363d] text-[#c9d1d9] text-sm font-semibold transition-colors hover:bg-[#21262d] hover:border-[#484f58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117] px-4"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Pulsing save indicator dot */}
                    <div className="relative flex items-center justify-center h-8 w-8 rounded-md bg-emerald-500/10 shrink-0">
                      <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute h-2 w-2 rounded-sm bg-emerald-400"
                      />
                      <Play className="h-4 w-4 text-emerald-400 relative" />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span>Continue Career</span>
                        <motion.span
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="inline-block h-1.5 w-1.5 rounded-sm bg-emerald-400"
                        />
                      </div>
                      {recentSave && (
                        <span className="text-[#8b949e] text-[11px] font-normal">
                          {recentSave.playerName} — {recentSave.club} — S{recentSave.season}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#484f58] transition-colors group-hover:text-emerald-400" />
                </button>

                {/* Load Game */}
                <Button
                  onClick={handleLoadGame}
                  variant="outline"
                  className="h-11 text-sm font-medium border-[#30363d] text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] hover:border-[#484f58] rounded-lg w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Load Game
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* ---- Separator ---- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 1.25, duration: 0.3 }}
            className="w-full flex items-center gap-3 px-2"
          >
            <div className="flex-1 h-px bg-[#21262d]" />
            <Clock className="h-3 w-3 text-[#30363d]" />
            <div className="flex-1 h-px bg-[#21262d]" />
          </motion.div>

          {/* ---- Version Info & Tech Badges ---- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 1.35, duration: 0.4 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            {/* Version label */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[#c9d1d9] text-sm font-semibold tracking-wide">
                Elite Striker <span className="text-emerald-400">v1.0</span>
              </p>
              <p className="text-[#484f58] text-[11px] tracking-wide">
                The definitive football career experience
              </p>
            </div>

            {/* Passion & year */}
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-[#30363d] text-[10px] tracking-wider">
                Made with passion for football fans
              </p>
              <p className="text-[#21262d] text-[10px] tracking-wider font-medium">
                &copy; 2026
              </p>
            </div>

            {/* Tech badges row */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {TECH_BADGES.map((badge) => (
                <Badge
                  key={badge.label}
                  variant="outline"
                  className="border-[#21262d] text-[#484f58] text-[10px] gap-1 px-2 py-0.5 hover:border-[#30363d] hover:text-[#8b949e] transition-colors"
                >
                  <badge.icon className="h-2.5 w-2.5" />
                  {badge.label}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ================================================================ */}
        {/* ---- Extended Content Sections ---- */}
        {/* ================================================================ */}
        <div className="w-full max-w-4xl mx-auto px-5 pb-8 flex flex-col gap-8 mt-4">

          {/* ======== Featured Match of the Day ======== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 1.55, duration: 0.5 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-[#21262d]" />
              <span className="text-[#484f58] text-[11px] font-semibold tracking-widest uppercase">
                Featured Match
              </span>
              <div className="h-px flex-1 bg-[#21262d]" />
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
              {/* Match importance badge */}
              <div className="flex items-center gap-1.5 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-400 text-[11px] font-semibold tracking-wide uppercase">
                  {FEATURED_MATCH.importance}
                </span>
                <div className="flex gap-0.5 ml-1">
                  {Array.from({ length: FEATURED_MATCH.stars }).map((_, i) => (
                    <Star key={i} className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>

              {/* Team matchup */}
              <div className="flex items-center justify-between gap-4 mb-5">
                {/* Home team */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="text-3xl" role="img">⚽</span>
                  </div>
                  <span className="text-[#c9d1d9] text-sm font-bold text-center">
                    {FEATURED_MATCH.homeTeam}
                  </span>
                </div>

                {/* VS divider */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <span className="text-[#484f58] text-[10px] font-semibold tracking-widest uppercase">
                    {FEATURED_MATCH.league}
                  </span>
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#0d1117] border border-[#30363d]">
                    <span className="text-emerald-400 text-sm font-black tracking-wider">VS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#484f58]" />
                    <span className="text-[#8b949e] text-[11px] font-medium">{FEATURED_MATCH.date}</span>
                  </div>
                </div>

                {/* Away team */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-3xl" role="img">⚽</span>
                  </div>
                  <span className="text-[#c9d1d9] text-sm font-bold text-center">
                    {FEATURED_MATCH.awayTeam}
                  </span>
                </div>
              </div>

              {/* Quick stats preview */}
              <div className="flex items-center gap-4 mb-4 py-3 px-4 bg-[#0d1117] rounded-lg">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span className="text-[#8b949e] text-[11px] font-medium">Last 5 H2H:</span>
                  <span className="text-[#c9d1d9] text-[11px] font-semibold">{FEATURED_MATCH.h2h}</span>
                </div>
                <div className="h-3 w-px bg-[#30363d]" />
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-[#8b949e]" />
                  <span className="text-[#8b949e] text-[11px] font-medium">Combined Goals:</span>
                  <span className="text-emerald-400 text-[11px] font-bold">{FEATURED_MATCH.combinedGoals}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5">
                <button className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors">
                  <Tv className="h-3.5 w-3.5" />
                  Watch Live
                </button>
                <button className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-xs font-semibold hover:border-[#484f58] transition-colors">
                  <Bell className="h-3.5 w-3.5" />
                  Set Reminder
                </button>
              </div>
            </div>
          </motion.div>

          {/* ======== Player Spotlight Carousel ======== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 1.65, duration: 0.5 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-[#21262d]" />
              <span className="text-[#484f58] text-[11px] font-semibold tracking-widest uppercase">
                Player Spotlight
              </span>
              <div className="h-px flex-1 bg-[#21262d]" />
            </div>

            {/* Scrollable cards */}
            <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1">
              {FEATURED_PLAYERS.map((player, i) => (
                <motion.div
                  key={player.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: mounted ? 1 : 0 }}
                  transition={{ delay: 1.7 + i * 0.1, duration: 0.4 }}
                  className={`shrink-0 w-56 snap-start bg-[#161b22] border rounded-lg p-4 flex flex-col items-center gap-3 ${player.borderColor}`}
                >
                  {/* Player silhouette */}
                  <div className={`flex items-center justify-center h-20 w-20 rounded-lg ${player.bgColor}`}>
                    <PlayerSilhouette className={`h-14 w-14 ${player.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col items-center gap-1 text-center w-full">
                    <span className="text-[#c9d1d9] text-sm font-bold leading-tight">{player.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#8b949e] text-[11px]">{player.club}</span>
                      <span className="text-[#30363d]">·</span>
                      <span className={`text-[11px] font-semibold ${player.color}`}>{player.position}</span>
                    </div>
                  </div>

                  {/* OVR badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[#c9d1d9] text-2xl font-black tabular-nums">{player.overall}</span>
                    <span className="text-[#484f58] text-[10px] font-semibold">OVR</span>
                  </div>

                  {/* Form dots */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#484f58] text-[10px] font-semibold mr-0.5">Form</span>
                    {player.form.map((result, j) => (
                      <span
                        key={j}
                        className={`h-4 w-4 rounded flex items-center justify-center text-[9px] font-bold ${
                          result === 'W'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : result === 'D'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>

                  {/* Key stat */}
                  <div className="text-center py-2 px-3 bg-[#0d1117] rounded-lg w-full">
                    <span className="text-[#8b949e] text-[11px]">{player.keyStat}</span>
                  </div>

                  {/* View Profile button */}
                  <button className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg border border-[#30363d] text-[#c9d1d9] text-[11px] font-semibold hover:border-[#484f58] transition-colors">
                    <Eye className="h-3 w-3" />
                    View Profile
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Dot indicators + scroll hint */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-[#30363d] text-[10px] select-none">←</span>
              {FEATURED_PLAYERS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-sm ${
                    i === 0 ? 'bg-emerald-500' : 'bg-[#30363d]'
                  }`}
                />
              ))}
              <span className="text-[#30363d] text-[10px] select-none">→</span>
            </div>
          </motion.div>

          {/* ======== Weekly Challenges Banner ======== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-[#21262d]" />
              <span className="text-[#484f58] text-[11px] font-semibold tracking-widest uppercase flex items-center gap-1.5">
                <Flame className="h-3 w-3" />
                Weekly Challenges
              </span>
              <div className="h-px flex-1 bg-[#21262d]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WEEKLY_CHALLENGES.map((challenge, i) => {
                const diff = DIFFICULTY_COLORS[challenge.difficulty];
                const progressPct = Math.round((challenge.progress / challenge.maxProgress) * 100);
                return (
                  <motion.div
                    key={challenge.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: mounted ? 1 : 0 }}
                    transition={{ delay: 1.85 + i * 0.08, duration: 0.4 }}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col gap-3"
                  >
                    {/* Header: difficulty badge + time */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded border ${diff.text} ${diff.bg} ${diff.border}`}
                      >
                        {challenge.difficulty}
                      </span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#484f58]" />
                        <span className="text-[#484f58] text-[10px] font-medium">{challenge.timeRemaining}</span>
                      </div>
                    </div>

                    {/* Title & description */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[#c9d1d9] text-xs font-bold leading-tight">{challenge.name}</span>
                      <span className="text-[#8b949e] text-[10px] leading-relaxed">{challenge.description}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#484f58] text-[10px] font-medium">Progress</span>
                        <span className="text-[#8b949e] text-[10px] font-semibold tabular-nums">
                          {challenge.progress}/{challenge.maxProgress}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0d1117] rounded overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded transition-opacity duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Reward */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-amber-400 text-[11px] font-bold">{challenge.reward}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* View All link */}
            <button className="mt-3 flex items-center justify-center gap-1.5 mx-auto text-[#8b949e] text-[11px] font-semibold hover:text-emerald-400 transition-colors">
              View All Challenges
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>

          {/* ======== Version Update & News Ticker ======== */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: mounted ? 1 : 0 }}
            transition={{ delay: 2.0, duration: 0.5 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-[#21262d]" />
              <span className="text-[#484f58] text-[11px] font-semibold tracking-widest uppercase">
                What&apos;s New
              </span>
              <div className="h-px flex-1 bg-[#21262d]" />
            </div>

            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
              {/* Version header */}
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span className="text-[#c9d1d9] text-sm font-bold">{VERSION_UPDATE.title}</span>
                <span className="text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {VERSION_UPDATE.version}
                </span>
              </div>

              {/* Feature bullets */}
              <ul className="flex flex-col gap-2 mb-4">
                {VERSION_UPDATE.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 text-[10px] mt-1 shrink-0">▸</span>
                    <span className="text-[#8b949e] text-[12px] leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Read Full Patch Notes button */}
              <button className="h-9 flex items-center gap-1.5 px-4 rounded-lg border border-[#30363d] text-[#c9d1d9] text-[11px] font-semibold hover:border-emerald-500/40 hover:text-emerald-400 transition-colors mb-4">
                Read Full Patch Notes
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              {/* Community stats */}
              <div className="border-t border-[#30363d] pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-3.5 w-3.5 text-[#484f58]" />
                  <span className="text-[#484f58] text-[10px] font-semibold tracking-widest uppercase">
                    Community
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {COMMUNITY_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex flex-col items-center gap-1 py-2 px-3 bg-[#0d1117] rounded-lg"
                    >
                      <stat.icon className="h-3.5 w-3.5 text-[#8b949e]" />
                      <span className="text-[#c9d1d9] text-sm font-bold tabular-nums">{stat.value}</span>
                      <span className="text-[#484f58] text-[10px] font-medium text-center">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
        {/* ---- End Extended Content Sections ---- */}
      </main>

      {/* ---- Bottom Ticker ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 1 : 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <ClubTicker />
      </motion.div>
    </div>
  );
}
