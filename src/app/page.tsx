'use client';

import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/lib/game/types';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lazy load screen components
const MainMenu = dynamic(() => import('@/components/game/MainMenu'), { ssr: false });
const CareerSetup = dynamic(() => import('@/components/game/CareerSetup'), { ssr: false });
const Dashboard = dynamic(() => import('@/components/game/Dashboard'), { ssr: false });
const MatchDay = dynamic(() => import('@/components/game/MatchDay'), { ssr: false });
const TrainingPanel = dynamic(() => import('@/components/game/TrainingPanel'), { ssr: false });
const TransferHub = dynamic(() => import('@/components/game/TransferHub'), { ssr: false });
const CareerHub = dynamic(() => import('@/components/game/CareerHub'), { ssr: false });
const AnalyticsPanel = dynamic(() => import('@/components/game/AnalyticsPanel'), { ssr: false });
const SocialFeed = dynamic(() => import('@/components/game/SocialFeed'), { ssr: false });
const EventsPanel = dynamic(() => import('@/components/game/EventsPanel'), { ssr: false });
const SaveLoad = dynamic(() => import('@/components/game/SaveLoad'), { ssr: false });
const BottomNav = dynamic(() => import('@/components/game/BottomNav'), { ssr: false });
const LeagueTable = dynamic(() => import('@/components/game/LeagueTable'), { ssr: false });
const SettingsPanel = dynamic(() => import('@/components/game/SettingsPanel'), { ssr: false });
const PlayerProfile = dynamic(() => import('@/components/game/PlayerProfile'), { ssr: false });
const SeasonObjectivesPanel = dynamic(() => import('@/components/game/SeasonObjectivesPanel'), { ssr: false });
const CupBracket = dynamic(() => import('@/components/game/CupBracket'), { ssr: false });
const YouthAcademy = dynamic(() => import('@/components/game/YouthAcademy'), { ssr: false });
const RelationshipsPanel = dynamic(() => import('@/components/game/RelationshipsPanel'), { ssr: false });
const ContinentalPanel = dynamic(() => import('@/components/game/ContinentalPanel'), { ssr: false });

const screenComponents: Record<GameScreen, React.ComponentType> = {
  main_menu: MainMenu,
  career_setup: CareerSetup,
  dashboard: Dashboard,
  match_day: MatchDay,
  training: TrainingPanel,
  transfers: TransferHub,
  agent_hub: Dashboard,
  career_hub: CareerHub,
  analytics: AnalyticsPanel,
  season_stats: AnalyticsPanel,
  social: SocialFeed,
  events: EventsPanel,
  settings: SettingsPanel,
  save_load: SaveLoad,
  league_table: LeagueTable,
  player_profile: PlayerProfile,
  season_objectives: SeasonObjectivesPanel,
  cup_bracket: CupBracket,
  youth_academy: YouthAcademy,
  relationships: RelationshipsPanel,
  continental: ContinentalPanel,
};

const menuScreens: GameScreen[] = ['main_menu', 'career_setup', 'save_load'];
const gameScreens: GameScreen[] = ['dashboard', 'match_day', 'training', 'transfers', 'career_hub', 'analytics', 'social', 'events', 'season_stats', 'agent_hub', 'settings', 'league_table', 'player_profile', 'season_objectives', 'cup_bracket', 'youth_academy', 'relationships', 'continental'];

export default function Home() {
  const screen = useGameStore(state => state.screen);
  const gameState = useGameStore(state => state.gameState);
  const isProcessing = useGameStore(state => state.isProcessing);

  const ScreenComponent = screenComponents[screen] || MainMenu;
  const isGameScreen = gameScreens.includes(screen);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <ScreenComponent />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation for in-game screens */}
      {isGameScreen && gameState && <BottomNav />}

      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-300">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
