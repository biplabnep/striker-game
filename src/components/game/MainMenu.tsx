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
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="flex flex-col items-center gap-2"
        >
          <div className="text-6xl mb-2">⚽</div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">
            ELITE STRIKER
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">Football Career Simulation</p>
        </motion.div>

        {/* Menu Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col gap-3 w-full mt-4"
        >
          <Button
            onClick={() => setScreen('career_setup')}
            className="h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-xl shadow-lg shadow-emerald-900/50 transition-all hover:scale-[1.02]"
          >
            <Play className="mr-2 h-5 w-5" />
            New Career
          </Button>

          {hasSaveSlots() && (
            <Button
              onClick={() => setScreen('save_load')}
              variant="outline"
              className="h-14 text-lg font-semibold border-slate-600 text-slate-200 hover:bg-slate-800 rounded-xl"
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
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Trophy className="h-3 w-3" />
            <span>Rise from Academy to Elite</span>
          </div>
          <p className="text-slate-600 text-xs">v1.0.0</p>
        </motion.div>
      </div>
    </div>
  );
}
