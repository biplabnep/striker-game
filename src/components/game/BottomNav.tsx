'use client';

import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/lib/game/types';
import { Home, Swords, Trophy, BarChart3, Settings, Table } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem {
  screen: GameScreen;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { screen: 'dashboard', icon: <Home className="h-6 w-6" />, label: 'Home' },
  { screen: 'match_day', icon: <Swords className="h-6 w-6" />, label: 'Match' },
  { screen: 'league_table', icon: <Table className="h-6 w-6" />, label: 'Table' },
  { screen: 'analytics', icon: <BarChart3 className="h-6 w-6" />, label: 'Stats' },
  { screen: 'settings', icon: <Settings className="h-6 w-6" />, label: 'More' },
];

export default function BottomNav() {
  const screen = useGameStore(state => state.screen);
  const setScreen = useGameStore(state => state.setScreen);
  const activeEvents = useGameStore(state => state.gameState?.activeEvents ?? []);
  const unreadNotifications = useGameStore(state => state.notifications.filter(n => !n.read).length);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/50 safe-area-bottom">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map(item => {
            const isActive = screen === item.screen;
            const hasNotification = (item.screen === 'settings' && (activeEvents.length > 0 || unreadNotifications > 0));
            const notificationCount = item.screen === 'settings' ? (unreadNotifications + activeEvents.length) : 0;

            return (
              <button
                key={item.screen}
                onClick={() => setScreen(item.screen)}
                className="relative flex flex-col items-center justify-center py-2 px-4 min-w-[56px] transition-all group"
              >
                {/* Active background glow */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavGlow"
                    className="absolute inset-0 bg-emerald-500/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <div className={`relative transition-all duration-200 ${isActive ? 'text-emerald-400 scale-105' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                  {hasNotification && notificationCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium transition-all ${isActive ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
