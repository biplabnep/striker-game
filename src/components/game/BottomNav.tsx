'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/lib/game/types';
import { Home, Swords, Trophy, BarChart3, Menu, Table, Dumbbell, ArrowRightLeft, Award, MessageSquare, Bell, Settings, X, UserCircle, Target, Globe, GraduationCap, Users, Flag, Heart, Activity, Briefcase, ScrollText, ClipboardList, Calendar, UserRound, Star, FileText, GitCompareArrows, Handshake, HeartHandshake, Newspaper, Crown } from 'lucide-react';
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
  { screen: 'youth_academy', icon: <GraduationCap className="h-5 w-5" />, label: 'Academy' },
  { screen: 'relationships', icon: <Users className="h-5 w-5" />, label: 'Team' },
  { screen: 'player_profile', icon: <UserCircle className="h-5 w-5" />, label: 'Profile' },
  { screen: 'training', icon: <Dumbbell className="h-5 w-5" />, label: 'Training' },
  { screen: 'transfers', icon: <ArrowRightLeft className="h-5 w-5" />, label: 'Transfers' },
  { screen: 'transfer_negotiation', icon: <Handshake className="h-5 w-5" />, label: 'Negotiate' },
  { screen: 'career_hub', icon: <Award className="h-5 w-5" />, label: 'Career Hub' },
  { screen: 'cup_bracket', icon: <Trophy className="h-5 w-5" />, label: 'Cup' },
  { screen: 'continental', icon: <Globe className="h-5 w-5" />, label: 'Europe' },
  { screen: 'international', icon: <Flag className="h-5 w-5" />, label: 'National' },
  { screen: 'morale', icon: <Heart className="h-5 w-5" />, label: 'Morale' },
  { screen: 'injury_report', icon: <Activity className="h-5 w-5" />, label: 'Injuries' },
  { screen: 'social', icon: <MessageSquare className="h-5 w-5" />, label: 'Social Feed' },
  { screen: 'season_objectives', icon: <Target className="h-5 w-5" />, label: 'Objectives' },
  { screen: 'events', icon: <Bell className="h-5 w-5" />, label: 'Events' },
  { screen: 'skill_challenges', icon: <Target className="h-5 w-5" />, label: 'Challenges' },
  { screen: 'manager_office', icon: <Briefcase className="h-5 w-5" />, label: 'Manager' },
  { screen: 'player_agent_hub', icon: <UserRound className="h-5 w-5" />, label: 'Agent' },
  { screen: 'daily_routine_hub', icon: <Calendar className="h-5 w-5" />, label: 'Routine' },
  { screen: 'career_statistics', icon: <ScrollText className="h-5 w-5" />, label: 'Statistics' },
  { screen: 'tactical_briefing', icon: <ClipboardList className="h-5 w-5" />, label: 'Briefing' },
  { screen: 'player_of_the_month', icon: <Star className="h-5 w-5" />, label: 'PotM' },
  { screen: 'post_match_analysis', icon: <FileText className="h-5 w-5" />, label: 'Analysis' },
  { screen: 'player_comparison', icon: <GitCompareArrows className="h-5 w-5" />, label: 'Compare' },
  { screen: 'settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  { screen: 'fan_engagement', icon: <HeartHandshake className="h-5 w-5" />, label: 'Fans' },
  { screen: 'world_football_news', icon: <Newspaper className="h-5 w-5" />, label: 'News' },
  { screen: 'hall_of_fame', icon: <Crown className="h-5 w-5" />, label: 'Hall of Fame' },
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setMoreOpen(false)}
            />
            <div
              className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 max-h-[65vh] overflow-y-auto"
            >
              <div className="max-w-lg mx-auto bg-[#161b22] rounded-lg border border-[#30363d] shadow overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
                  <span className="text-sm font-semibold text-[#c9d1d9]">More Options</span>
                  <button onClick={() => setMoreOpen(false)} className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1 p-3 pb-4">
                  {moreItems.map(item => {
                    const isActive = screen === item.screen;
                    const hasBadge = item.screen === 'events' && activeEvents.length > 0;
                    return (
                      <button
                        key={item.screen}
                        onClick={() => handleScreenSelect(item.screen)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117] border-t border-[#30363d] safe-area-bottom">
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
                      className="absolute inset-0 bg-emerald-500/10 rounded-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`relative transition-all duration-200 ${isActive ? 'text-emerald-400' : 'text-[#8b949e] group-hover:text-[#c9d1d9]'}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] mt-0.5 font-medium transition-all ${isActive ? 'text-emerald-400' : 'text-[#484f58] group-hover:text-[#8b949e]'}`}>
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
                  className="absolute inset-0 bg-emerald-500/10 rounded-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`relative transition-all duration-200 ${(isMoreActive || moreOpen) ? 'text-emerald-400' : 'text-[#8b949e] group-hover:text-[#c9d1d9]'}`}>
                {moreOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                {totalBadges > 0 && !moreOpen && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {totalBadges > 9 ? '9+' : totalBadges}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium transition-all ${(isMoreActive || moreOpen) ? 'text-emerald-400' : 'text-[#484f58] group-hover:text-[#8b949e]'}`}>
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
