'use client';

import { useSyncExternalStore, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import {
  Play,
  Save,
  Trophy,
  MapPin,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasSaveSlots } from '@/services/persistenceService';

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
// Floating background element data
// -----------------------------------------------------------
const FLOATING_ITEMS = [
  { emoji: '\u26BD', top: '8%', left: '10%', size: 'text-5xl' },
  { emoji: '\uD83C\uDFC6', top: '15%', right: '12%', size: 'text-4xl' },
  { emoji: '\u2B50', bottom: '18%', left: '15%', size: 'text-3xl' },
  { emoji: '\uD83C\uDFC5', bottom: '12%', right: '10%', size: 'text-4xl' },
];

// -----------------------------------------------------------
// Feature highlight cards data
// -----------------------------------------------------------
const FEATURES = [
  { icon: MapPin, label: '96 Real Clubs', sublabel: 'Across Europe' },
  { icon: Trophy, label: '5 Top Leagues', sublabel: 'PL, La Liga & more' },
  { icon: LayoutGrid, label: '60+ Screens', sublabel: 'Deep simulation' },
] as const;

export default function MainMenu() {
  const setScreen = useGameStore((state) => state.setScreen);
  const showContinueButtons = useHasSaveData();

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#0d1117]">
      {/* ---- Animated Background Layer ---- */}

      {/* Subtle dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #c9d1d9 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Floating emoji silhouettes */}
      {FLOATING_ITEMS.map((item, i) => (
        <motion.span
          key={i}
          className={`absolute ${item.size} select-none pointer-events-none`}
          style={{
            top: item.top,
            bottom: item.bottom,
            left: item.left,
            right: item.right,
          }}
          animate={{ opacity: [0.03, 0.09, 0.03] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'easeInOut',
          }}
          aria-hidden
        >
          {item.emoji}
        </motion.span>
      ))}

      {/* ---- Main Content ---- */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          {/* Animated trophy icon */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Trophy className="h-10 w-10 text-emerald-400" />
          </motion.div>

          {/* Title */}
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-4xl md:text-5xl font-black tracking-[0.15em] text-[#c9d1d9]">
              ELITE{' '}
              <span className="text-emerald-400">STRIKER</span>
            </h1>
            {/* Emerald accent underline bar */}
            <div className="h-0.5 w-28 rounded-sm bg-emerald-500 opacity-70" />
          </div>

          {/* Subtitle */}
          <p className="text-slate-400 text-sm tracking-[0.2em] uppercase font-medium">
            Football Career Simulator
          </p>
        </motion.div>

        {/* Feature Highlights Row */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.35 }}
              className="flex flex-col items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg p-3"
            >
              <feature.icon className="h-5 w-5 text-emerald-400" />
              <span className="text-[#c9d1d9] text-xs font-semibold leading-tight text-center">
                {feature.label}
              </span>
              <span className="text-[#484f58] text-[10px] leading-tight text-center">
                {feature.sublabel}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.35 }}
          className="flex flex-col gap-3 w-full mt-2"
        >
          {/* Enhanced New Career Button */}
          <motion.div
            animate={{ opacity: [1, 0.8, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Button
              onClick={handleNewCareer}
              className="h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors w-full"
            >
              <Play className="mr-2 h-5 w-5" />
              New Career
              <ArrowRight className="ml-auto h-5 w-5" />
            </Button>
          </motion.div>

          {/* Continue / Load buttons (if saved game exists) */}
          {showContinueButtons && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.3 }}
              className="flex flex-col gap-2"
            >
              <Button
                onClick={handleContinue}
                className="h-12 text-base font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                Continue Career
              </Button>

              <Button
                onClick={handleLoadGame}
                variant="outline"
                className="h-12 text-base font-medium border-[#30363d] text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9] rounded-lg w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                Load Game
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.3 }}
          className="mt-8 flex flex-col items-center gap-1.5"
        >
          <p className="text-slate-600 text-xs font-mono">v1.0</p>
          <p className="text-[#30363d] text-[10px]">
            Built with Next.js
          </p>
        </motion.div>
      </div>
    </div>
  );
}
