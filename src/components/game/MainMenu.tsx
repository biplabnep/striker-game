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
