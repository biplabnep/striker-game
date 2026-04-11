'use client';

import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { Play, Save, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasSaveSlots } from '@/services/persistenceService';

export default function MainMenu() {
  const setScreen = useGameStore(state => state.setScreen);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0d1117]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="text-6xl mb-2">⚽</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-emerald-400">
            ELITE STRIKER
          </h1>
          <p className="text-[#8b949e] text-sm tracking-widest uppercase">Football Career Simulation</p>
        </motion.div>

        {/* Menu Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.15 }}
          className="flex flex-col gap-3 w-full mt-4"
        >
          <Button
            onClick={() => setScreen('career_setup')}
            className="h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            <Play className="mr-2 h-5 w-5" />
            New Career
          </Button>

          {hasSaveSlots() && (
            <Button
              onClick={() => setScreen('save_load')}
              variant="outline"
              className="h-14 text-lg font-semibold border-slate-600 text-[#c9d1d9] hover:bg-[#21262d] rounded-lg"
            >
              <Save className="mr-2 h-5 w-5" />
              Continue Career
            </Button>
          )}
        </motion.div>

        {/* Stats / Credits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.15 }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-2 text-[#8b949e] text-xs">
            <Trophy className="h-3 w-3" />
            <span>Rise from Academy to Elite</span>
          </div>
          <p className="text-[#484f58] text-xs">v1.0.0</p>
        </motion.div>
      </div>
    </div>
  );
}
