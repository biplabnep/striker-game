'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/lib/game/types';
import { Home, Swords, Trophy, BarChart3, Menu, Table, Dumbbell, ArrowRightLeft, Award, MessageSquare, Bell, Settings, X, UserCircle, Target, Globe, GraduationCap, Users, Flag, Heart, Activity, Briefcase, ScrollText, ClipboardList, Calendar, UserRound, Star, FileText, GitCompareArrows, Handshake, HeartHandshake, Newspaper, Crown, Shield, Zap, UsersRound, Film, Search, Clock, Mic, Sparkles, BookOpen, Crosshair, Route, Radio, Gauge, Tent, Shirt, Store, Wallet, LayoutGrid, Hourglass, Building2, RotateCcw, Gem, CalendarClock, Compass, Cpu, Gamepad2, Clapperboard, ShoppingBag, Binoculars, Landmark, Baby, Palette, MessageCircle, Gift, Stethoscope, Mail, UserCog, ShieldAlert, CloudSun, AlarmClock, FileSignature, Music, Warehouse, Syringe, IdCard, Brain, Share2, Plane, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  screen: GameScreen;
  icon: React.ReactNode;
  label: string;
}

interface NavCategory {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const mainNavItems: NavItem[] = [
  { screen: 'dashboard', icon: <Home className="h-5 w-5" />, label: 'Home' },
  { screen: 'match_day', icon: <Swords className="h-5 w-5" />, label: 'Match' },
  { screen: 'league_table', icon: <Table className="h-5 w-5" />, label: 'Table' },
  { screen: 'analytics', icon: <BarChart3 className="h-5 w-5" />, label: 'Stats' },
];

const moreCategories: NavCategory[] = [
  {
    title: 'Playing',
    icon: <Swords className="h-4 w-4" />,
    items: [
      { screen: 'training', icon: <Dumbbell className="h-5 w-5" />, label: 'Training' },
      { screen: 'tactical_briefing', icon: <ClipboardList className="h-5 w-5" />, label: 'Briefing' },
      { screen: 'player_profile', icon: <UserCircle className="h-5 w-5" />, label: 'Profile' },
      { screen: 'player_comparison', icon: <GitCompareArrows className="h-5 w-5" />, label: 'Compare' },
      { screen: 'skill_challenges', icon: <Target className="h-5 w-5" />, label: 'Challenges' },
      { screen: 'player_of_the_month', icon: <Star className="h-5 w-5" />, label: 'PotM' },
      { screen: 'player_traits', icon: <Zap className="h-5 w-5" />, label: 'Traits' },
      { screen: 'dream_transfer', icon: <Star className="h-5 w-5" />, label: 'Dream' },
      { screen: 'match_highlights', icon: <Film className="h-5 w-5" />, label: 'Highlights' },
      { screen: 'match_highlights_enhanced', icon: <Zap className="h-5 w-5" />, label: 'Enhanced' },
      { screen: 'pre_match_scout', icon: <Search className="h-5 w-5" />, label: 'Scout' },
      { screen: 'team_selection', icon: <Users className="h-5 w-5" />, label: 'Lineup' },
      { screen: 'tactical_formation_board', icon: <LayoutGrid className="h-5 w-5" />, label: 'Board' },
      { screen: 'match_stats_comparison', icon: <BarChart3 className="h-5 w-5" />, label: 'Match Stats' },
      { screen: 'match_day_live', icon: <Radio className="h-5 w-5" />, label: 'Live Match' },
      { screen: 'dynamic_difficulty', icon: <Gauge className="h-5 w-5" />, label: 'Difficulty' },
      { screen: 'pre_season_camp', icon: <Tent className="h-5 w-5" />, label: 'Pre-Season' },
      { screen: 'kit_customization', icon: <Shirt className="h-5 w-5" />, label: 'Kit' },
      { screen: 'squad_rotation', icon: <RotateCcw className="h-5 w-5" />, label: 'Rotation' },
      { screen: 'match_engine_simulation', icon: <Cpu className="h-5 w-5" />, label: 'Engine' },
      { screen: 'training_drill_mini_games', icon: <Gamepad2 className="h-5 w-5" />, label: 'Mini Games' },
      { screen: 'daily_rewards', icon: <Gift className="h-5 w-5" />, label: 'Rewards' },
      { screen: 'tactical_set_pieces', icon: <Crosshair className="h-5 w-5" />, label: 'Set Pieces' },
      { screen: 'match_weather_effects', icon: <CloudSun className="h-5 w-5" />, label: 'Weather' },
      { screen: 'set_piece_trainer', icon: <Target className="h-5 w-5" />, label: 'SP Trainer' },
      { screen: 'player_bio_generator', icon: <IdCard className="h-5 w-5" />, label: 'Bio Gen' },
    ],
  },
  {
    title: 'Career',
    icon: <Briefcase className="h-4 w-4" />,
    items: [
      { screen: 'transfers', icon: <ArrowRightLeft className="h-5 w-5" />, label: 'Transfers' },
      { screen: 'transfer_market', icon: <Store className="h-5 w-5" />, label: 'Market' },
      { screen: 'personal_finances', icon: <Wallet className="h-5 w-5" />, label: 'Finances' },
      { screen: 'transfer_negotiation', icon: <Handshake className="h-5 w-5" />, label: 'Negotiate' },
      { screen: 'career_hub', icon: <Award className="h-5 w-5" />, label: 'Career Hub' },
      { screen: 'career_statistics', icon: <ScrollText className="h-5 w-5" />, label: 'Statistics' },
      { screen: 'hall_of_fame', icon: <Crown className="h-5 w-5" />, label: 'Hall of Fame' },
      { screen: 'manager_office', icon: <Briefcase className="h-5 w-5" />, label: 'Manager' },
      { screen: 'player_agent_hub', icon: <UserRound className="h-5 w-5" />, label: 'Agent' },
      { screen: 'career_milestones', icon: <Trophy className="h-5 w-5" />, label: 'Milestones' },
      { screen: 'achievements_system', icon: <Award className="h-5 w-5" />, label: 'Achievements' },
      { screen: 'achievement_showcase', icon: <Award className="h-5 w-5" />, label: 'Showcase' },
      { screen: 'career_journal', icon: <BookOpen className="h-5 w-5" />, label: 'Journal' },
      { screen: 'season_awards', icon: <Sparkles className="h-5 w-5" />, label: 'Awards' },
      { screen: 'potential_journey', icon: <Route className="h-5 w-5" />, label: 'Journey' },
      { screen: 'career_legacy_profile', icon: <Crown className="h-5 w-5" />, label: 'Legacy' },
      { screen: 'career_retirement', icon: <Hourglass className="h-5 w-5" />, label: 'Retirement' },
      { screen: 'facilities_upgrades', icon: <Building2 className="h-5 w-5" />, label: 'Facilities' },
      { screen: 'loan_system', icon: <ArrowRightLeft className="h-5 w-5" />, label: 'Loans' },
      { screen: 'loan_system_enhanced', icon: <ArrowRightLeft className="h-5 w-5" />, label: 'Loans+' },
      { screen: 'jersey_number', icon: <Shirt className="h-5 w-5" />, label: 'Jersey' },
      { screen: 'sponsor_system', icon: <Gem className="h-5 w-5" />, label: 'Sponsors' },
      { screen: 'trophy_cabinet', icon: <Trophy className="h-5 w-5" />, label: 'Trophies' },
      { screen: 'career_events', icon: <CalendarClock className="h-5 w-5" />, label: 'Events' },
      { screen: 'badge_collection', icon: <Award className="h-5 w-5" />, label: 'Badges' },
      { screen: 'career_stats_deep_dive', icon: <BarChart3 className="h-5 w-5" />, label: 'Deep Dive' },
      { screen: 'player_career_timeline', icon: <Route className="h-5 w-5" />, label: 'Timeline' },
      { screen: 'career_mode_selector', icon: <Compass className="h-5 w-5" />, label: 'Mode Select' },
      { screen: 'coach_career', icon: <GraduationCap className="h-5 w-5" />, label: 'Coach' },
      { screen: 'manager_career', icon: <UserCog className="h-5 w-5" />, label: 'Mgr Career' },
      { screen: 'fantasy_draft', icon: <UsersRound className="h-5 w-5" />, label: 'Draft' },
      { screen: 'season_review_documentary', icon: <Clapperboard className="h-5 w-5" />, label: 'Season Review' },
      { screen: 'match_replay_viewer', icon: <Film className="h-5 w-5" />, label: 'Match Replay' },
      { screen: 'referee_system_enhanced', icon: <ShieldAlert className="h-5 w-5" />, label: 'Referee+' },
      { screen: 'create_a_club', icon: <Palette className="h-5 w-5" />, label: 'Create Club' },
      { screen: 'multiplayer_league', icon: <Swords className="h-5 w-5" />, label: 'MP League' },
      { screen: 'transfer_deadline_day', icon: <AlarmClock className="h-5 w-5" />, label: 'Deadline' },
      { screen: 'player_agent_contract', icon: <FileSignature className="h-5 w-5" />, label: 'Agent Deal' },
      { screen: 'fan_chants', icon: <Music className="h-5 w-5" />, label: 'Fan Chants' },
      { screen: 'virtual_trophy_room', icon: <Warehouse className="h-5 w-5" />, label: 'Trophy Room' },
      { screen: 'virtual_trophy_tour', icon: <Gem className="h-5 w-5" />, label: 'Trophy Tour' },
      { screen: 'coach_career_path', icon: <GraduationCap className="h-5 w-5" />, label: 'Coach Path' },
      { screen: 'pre_season_tour', icon: <Plane className="h-5 w-5" />, label: 'Pre-Season Tour' },
      { screen: 'player_agent_hub_enhanced', icon: <Briefcase className="h-5 w-5" />, label: 'Agent Hub+' },
      { screen: 'international_expansion', icon: <Globe className="h-5 w-5" />, label: 'International' },
      { screen: 'player_comparison_enhanced', icon: <GitCompareArrows className="h-5 w-5" />, label: 'Compare+' },
      { screen: 'dream_transfer_enhanced', icon: <Sparkles className="h-5 w-5" />, label: 'Dream Transfer+' },
      { screen: 'multiplayer_enhanced', icon: <Gamepad2 className="h-5 w-5" />, label: 'Multiplayer+' },
      { screen: 'season_review_enhanced', icon: <FileSignature className="h-5 w-5" />, label: 'Season Review+' },
      { screen: 'fantasy_draft_enhanced', icon: <UsersRound className="h-5 w-5" />, label: 'Fantasy Draft+' },
      { screen: 'hall_of_fame_enhanced', icon: <Landmark className="h-5 w-5" />, label: 'Hall of Fame+' },
      { screen: 'media_interaction', icon: <Mic className="h-5 w-5" />, label: 'Media Center' },
      { screen: 'legend_status', icon: <Crown className="h-5 w-5" />, label: 'Legend Status' },
      { screen: 'tactical_board_enhanced', icon: <Compass className="h-5 w-5" />, label: 'Tactical+' },
      { screen: 'scouting_network_enhanced', icon: <Search className="h-5 w-5" />, label: 'Scouting+' },
      { screen: 'coach_career_enhanced', icon: <GraduationCap className="h-5 w-5" />, label: 'Coach+' },
      { screen: 'season_training_enhanced', icon: <Dumbbell className="h-5 w-5" />, label: 'Season Train+' },
      { screen: 'weather_enhanced', icon: <CloudSun className="h-5 w-5" />, label: 'Weather+' },
      { screen: 'draft_system_enhanced', icon: <UsersRound className="h-5 w-5" />, label: 'Draft+' },
      { screen: 'career_journal_enhanced', icon: <Brain className="h-5 w-5" />, label: 'Journal+' },
      { screen: 'career_legacy_profile_enhanced', icon: <Crown className="h-5 w-5" />, label: 'Legacy+' },
    ],
  },
  {
    title: 'Club',
    icon: <Shield className="h-4 w-4" />,
    items: [
      { screen: 'youth_academy', icon: <GraduationCap className="h-5 w-5" />, label: 'Academy' },
      { screen: 'youth_academy_deep_dive', icon: <Baby className="h-5 w-5" />, label: 'Youth Deep' },
      { screen: 'relationships', icon: <Users className="h-5 w-5" />, label: 'Team' },
      { screen: 'daily_routine_hub', icon: <Calendar className="h-5 w-5" />, label: 'Routine' },
      { screen: 'season_objectives', icon: <Target className="h-5 w-5" />, label: 'Objectives' },
      { screen: 'fan_engagement', icon: <HeartHandshake className="h-5 w-5" />, label: 'Fans' },
      { screen: 'rival_system', icon: <Crosshair className="h-5 w-5" />, label: 'Rivals' },
      { screen: 'stadium_builder', icon: <Building2 className="h-5 w-5" />, label: 'Stadium' },
      { screen: 'stadium_atmosphere', icon: <Volume2 className="h-5 w-5" />, label: 'Atmosphere' },
      { screen: 'scouting_network', icon: <Binoculars className="h-5 w-5" />, label: 'Scouting' },
      { screen: 'youth_development', icon: <Baby className="h-5 w-5" />, label: 'Youth Dev' },
      { screen: 'board_room', icon: <Landmark className="h-5 w-5" />, label: 'Board Room' },
      { screen: 'in_game_store', icon: <ShoppingBag className="h-5 w-5" />, label: 'Store' },
    ],
  },
  {
    title: 'Competitions',
    icon: <Trophy className="h-4 w-4" />,
    items: [
      { screen: 'cup_bracket', icon: <Trophy className="h-5 w-5" />, label: 'Cup' },
      { screen: 'continental', icon: <Globe className="h-5 w-5" />, label: 'Europe' },
      { screen: 'international', icon: <Flag className="h-5 w-5" />, label: 'National' },
      { screen: 'international_tournament', icon: <Globe className="h-5 w-5" />, label: 'Tournament' },
      { screen: 'referee_system', icon: <ShieldAlert className="h-5 w-5" />, label: 'Referees' },
    ],
  },
  {
    title: 'Media & Info',
    icon: <Newspaper className="h-4 w-4" />,
    items: [
      { screen: 'social', icon: <MessageSquare className="h-5 w-5" />, label: 'Social Feed' },
      { screen: 'events', icon: <Bell className="h-5 w-5" />, label: 'Events' },
      { screen: 'world_football_news', icon: <Newspaper className="h-5 w-5" />, label: 'News' },
      { screen: 'post_match_analysis', icon: <FileText className="h-5 w-5" />, label: 'Analysis' },
      { screen: 'press_conference', icon: <Mic className="h-5 w-5" />, label: 'Press Conf' },
      { screen: 'media_interview', icon: <Mic className="h-5 w-5" />, label: 'Interview' },
      { screen: 'social_media_feed', icon: <MessageCircle className="h-5 w-5" />, label: 'Social Hub' },
      { screen: 'press_scrum', icon: <Newspaper className="h-5 w-5" />, label: 'Press Scrum' },
      { screen: 'in_game_mail', icon: <Mail className="h-5 w-5" />, label: 'Mail' },
      { screen: 'social_media_hub', icon: <Share2 className="h-5 w-5" />, label: 'Media Hub' },
    ],
  },
  {
    title: 'Wellbeing',
    icon: <Heart className="h-4 w-4" />,
    items: [
      { screen: 'morale', icon: <Heart className="h-5 w-5" />, label: 'Morale' },
      { screen: 'injury_report', icon: <Activity className="h-5 w-5" />, label: 'Injuries' },
      { screen: 'injury_recovery', icon: <Stethoscope className="h-5 w-5" />, label: 'Recovery' },
      { screen: 'injury_simulator', icon: <Syringe className="h-5 w-5" />, label: 'Simulator' },
      { screen: 'player_psychology', icon: <Brain className="h-5 w-5" />, label: 'Psychology' },
    ],
  },
  {
    title: 'System',
    icon: <Settings className="h-4 w-4" />,
    items: [
      { screen: 'settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
    ],
  },
];

const quickAccessScreens: NavItem[] = [
  { screen: 'training', icon: <Dumbbell className="h-5 w-5" />, label: 'Training' },
  { screen: 'transfers', icon: <ArrowRightLeft className="h-5 w-5" />, label: 'Transfers' },
  { screen: 'career_hub', icon: <Award className="h-5 w-5" />, label: 'Career Hub' },
  { screen: 'player_profile', icon: <UserCircle className="h-5 w-5" />, label: 'Profile' },
];

const allMoreItems = moreCategories.flatMap(c => c.items);
const moreScreenSet = new Set(allMoreItems.map(i => i.screen));

// Build a lookup map for quick access to item details by screen
const itemByScreen = new Map(allMoreItems.map(i => [i.screen, i]));

export default function BottomNav() {
  const screen = useGameStore(state => state.screen);
  const setScreen = useGameStore(state => state.setScreen);
  const activeEvents = useGameStore(state => state.gameState?.activeEvents ?? []);
  const unreadNotifications = useGameStore(state => state.notifications.filter(n => !n.read).length);

  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentScreens, setRecentScreens] = useState<GameScreen[]>([]);

  const isMoreActive = moreScreenSet.has(screen);
  const totalBadges = activeEvents.length + unreadNotifications;

  const handleMoreClick = () => {
    setMoreOpen(prev => !prev);
    if (moreOpen) setSearchQuery('');
  };

  const handleScreenSelect = (target: GameScreen) => {
    setScreen(target);
    setMoreOpen(false);
    setSearchQuery('');
    // Track recently accessed screens (last 3, no duplicates)
    setRecentScreens(prev => {
      const recent = prev.filter(s => s !== target);
      recent.unshift(target);
      return recent.slice(0, 3);
    });
  };

  // Get recent items for the "Recent" section
  const recentItems = recentScreens
    .map(s => itemByScreen.get(s))
    .filter(Boolean) as NavItem[];

  // Filter categories and their items based on search query
  const filteredCategories = searchQuery.trim()
    ? moreCategories
        .map(cat => ({
          ...cat,
          items: cat.items.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter(cat => cat.items.length > 0)
    : moreCategories;

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
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => { setMoreOpen(false); setSearchQuery(''); }}
            />
            {/* Panel - positioned above PWA install banner at bottom-20 */}
            <div
              className="fixed bottom-16 left-0 right-0 z-40 px-2 pb-1"
            >
              <div className="max-w-lg mx-auto bg-[#161b22] rounded-lg border border-[#30363d] shadow-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
                  <span className="text-sm font-semibold text-[#c9d1d9]">More Options</span>
                  <button
                    onClick={() => { setMoreOpen(false); setSearchQuery(''); }}
                    className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="px-3 pt-3 pb-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search screens..."
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="max-h-[60vh] overflow-y-auto overscroll-contain px-2 pb-2">
                  {/* Quick Access Row — only shown when not searching */}
                  {!searchQuery.trim() && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.12, delay: 0.02 }}
                    >
                      <div className="flex items-center gap-1.5 px-2 pt-1 pb-1.5">
                        <Sparkles className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] font-semibold tracking-wide uppercase text-emerald-400">Quick Access</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 mb-2">
                        {quickAccessScreens.map(item => {
                          const isActive = screen === item.screen;
                          return (
                            <button
                              key={`quick-${item.screen}`}
                              onClick={() => handleScreenSelect(item.screen)}
                              className={`relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border transition-all ${
                                isActive
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'text-[#8b949e] bg-[#0d1117] border-[#21262d] hover:border-emerald-500/20 hover:text-[#c9d1d9]'
                              }`}
                            >
                              {item.icon}
                              <span className="text-[10px] font-medium leading-tight text-center truncate w-full">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Recent Section — only show when not searching */}
                  {!searchQuery.trim() && recentItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.12, delay: 0.05 }}
                    >
                      {/* Recent Header */}
                      <div className="flex items-center gap-1.5 px-2 pt-1 pb-1.5">
                        <Clock className="h-3 w-3 text-[#8b949e]" />
                        <span className="text-[10px] font-semibold tracking-wide uppercase text-[#8b949e]">Recent</span>
                      </div>
                      {/* Recent Items Grid */}
                      <div className="grid grid-cols-3 gap-1 mb-2 bg-[#0d1117] rounded-lg p-1.5">
                        {recentItems.map(item => {
                          const isActive = screen === item.screen;
                          const hasBadge = item.screen === 'events' && activeEvents.length > 0;
                          return (
                            <button
                              key={`recent-${item.screen}`}
                              onClick={() => handleScreenSelect(item.screen)}
                              className={`relative flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${
                                isActive
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                              }`}
                            >
                              <div className="relative">
                                {item.icon}
                                {hasBadge && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                              </div>
                              <span className="text-[10px] font-medium leading-tight text-center truncate w-full">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Category Sections */}
                  <div className="space-y-1.5">
                    {filteredCategories.map((category, catIndex) => (
                      <motion.div
                        key={category.title}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.1, delay: catIndex * 0.03 }}
                      >
                        {/* Category Divider (non-interactive) */}
                        <div className="flex items-center gap-2 px-2 pt-2 pb-1">
                          <span className="text-[#8b949e]">{category.icon}</span>
                          <span className="text-[10px] font-semibold tracking-wide uppercase text-[#8b949e]">{category.title}</span>
                          <span className="text-[8px] font-medium text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded-sm">{category.items.length}</span>
                          <div className="flex-1 h-px bg-[#30363d]/50" />
                        </div>

                        {/* Items Grid */}
                        <div className="grid grid-cols-4 gap-1">
                          {category.items.map(item => {
                            const isActive = screen === item.screen;
                            const hasBadge = item.screen === 'events' && activeEvents.length > 0;
                            return (
                              <button
                                key={item.screen}
                                onClick={() => handleScreenSelect(item.screen)}
                                className={`relative flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg transition-all ${
                                  isActive
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                                }`}
                              >
                                {isActive && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
                                )}
                                <div className="relative">
                                  {item.icon}
                                  {hasBadge && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                                  )}
                                </div>
                                <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                                {isActive && (
                                  <span className="absolute -top-0.5 right-0 text-[6px] font-bold uppercase text-emerald-400 bg-emerald-500/15 px-1 py-px rounded-sm">Current</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* No Results */}
                  {searchQuery.trim() && filteredCategories.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-8 text-[#484f58]"
                    >
                      <Search className="h-8 w-8 mb-2 text-[#30363d]" />
                      <span className="text-xs">No screens match "{searchQuery}"</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
        {/* Emerald glow line above nav */}
        <div className="h-px bg-emerald-500/10" />
        <div className="bg-[#0d1117] border-t border-[#30363d]">
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
                  <span className={`text-[10px] mt-0.5 font-medium transition-all ${isActive ? 'text-emerald-400 [text-shadow:0_0_8px_rgba(16,185,129,0.4)]' : 'text-[#484f58] group-hover:text-[#8b949e]'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-400 rounded-full"
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
              <span className={`text-[10px] mt-0.5 font-medium transition-all ${(isMoreActive || moreOpen) ? 'text-emerald-400 [text-shadow:0_0_8px_rgba(16,185,129,0.4)]' : 'text-[#484f58] group-hover:text-[#8b949e]'}`}>
                More
              </span>
              {(isMoreActive || moreOpen) && (
                <motion.div
                  layoutId="bottomNavIndicatorMore"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
        </div>
      </nav>
    </>
  );
}
