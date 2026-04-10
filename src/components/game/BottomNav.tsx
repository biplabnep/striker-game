'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/lib/game/types';
import { Home, Swords, Trophy, BarChart3, Menu, Table, Dumbbell, ArrowRightLeft, Award, MessageSquare, Bell, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  screen: GameScreen;
  icon: React.ReactNode;
  label: string;
}

const mainNavItems: NavItem[] = [
  { screen: 'dashboard', icon: <Home className="h-5 w-5" />, label: 'Home' },
  { screen: 'match_day', icon: <Swords className="h-5 w-5" />, label: 'Match' },
  { screen: 'league_table', icon: <Table className="h-5 w-5" />, label: 'Table' },
  { screen: 'analytics', icon: <BarChart3 className="h-5 w-5" />, label: 'Stats' },
];

const moreItems: NavItem[] = [
  { screen: 'training', icon: <Dumbbell className="h-5 w-5" />, label: 'Training' },
  { screen: 'transfers', icon: <ArrowRightLeft className="h-5 w-5" />, label: 'Transfers' },
  { screen: 'career_hub', icon: <Award className="h-5 w-5" />, label: 'Career Hub' },
  { screen: 'social', icon: <MessageSquare className="h-5 w-5" />, label: 'Social Feed' },
  { screen: 'events', icon: <Bell className="h-5 w-5" />, label: 'Events' },
  { screen: 'settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
];

const moreScreenSet = new Set(moreItems.map(i => i.screen));

export default function BottomNav() {
  const screen = useGameStore(state => state.screen);
  const setScreen = useGameStore(state => state.setScreen);
  const activeEvents = useGameStore(state => state.gameState?.activeEvents ?? []);
  const unreadNotifications = useGameStore(state => state.notifications.filter(n => !n.read).length);

  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreScreenSet.has(screen);
  const totalBadges = activeEvents.length + unreadNotifications;

  const handleMoreClick = () => {
    setMoreOpen(prev => !prev);
  };

  const handleScreenSelect = (target: GameScreen) => {
    setScreen(target);
    setMoreOpen(false);
  };

  return (
    <>
      {/* More Panel Overlay */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2"
            >
              <div className="max-w-lg mx-auto bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <span className="text-sm font-semibold text-slate-300">More Options</span>
                  <button onClick={() => setMoreOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1 p-3">
                  {moreItems.map(item => {
                    const isActive = screen === item.screen;
                    const hasBadge = item.screen === 'events' && activeEvents.length > 0;
                    return (
                      <button
                        key={item.screen}
                        onClick={() => handleScreenSelect(item.screen)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div className="relative">
                          {item.icon}
                          {hasBadge && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <span className="text-[10px] font-medium">{item.label}</span>
                        {isActive && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-400 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/50 safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-around px-1 py-1.5">
            {mainNavItems.map(item => {
              const isActive = screen === item.screen && !moreOpen;
              return (
                <button
                  key={item.screen}
                  onClick={() => handleScreenSelect(item.screen)}
                  className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[52px] transition-all group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavGlow"
                      className="absolute inset-0 bg-emerald-500/10 rounded-xl"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`relative transition-all duration-200 ${isActive ? 'text-emerald-400 scale-105' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] mt-0.5 font-medium transition-all ${isActive ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}

            {/* More Button */}
            <button
              onClick={handleMoreClick}
              className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[52px] transition-all group"
            >
              {(isMoreActive || moreOpen) && (
                <motion.div
                  layoutId="bottomNavGlowMore"
                  className="absolute inset-0 bg-emerald-500/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`relative transition-all duration-200 ${(isMoreActive || moreOpen) ? 'text-emerald-400 scale-105' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {moreOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                {totalBadges > 0 && !moreOpen && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {totalBadges > 9 ? '9+' : totalBadges}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium transition-all ${(isMoreActive || moreOpen) ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                More
              </span>
              {(isMoreActive || moreOpen) && (
                <motion.div
                  layoutId="bottomNavIndicatorMore"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
