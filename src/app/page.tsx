'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameScreen } from '@/lib/game/types';

// Direct imports — Turbopack dynamic imports cause 503 on chunk compilation
// Screen routing via React key prop (unmount/remount on switch, no AnimatePresence)
import MainMenu from '@/components/game/MainMenu';
import CareerSetup from '@/components/game/CareerSetup';
import Dashboard from '@/components/game/Dashboard';
import MatchDay from '@/components/game/MatchDay';
import TrainingPanel from '@/components/game/TrainingPanel';
import TransferHub from '@/components/game/TransferHub';
import CareerHub from '@/components/game/CareerHub';
import AnalyticsPanel from '@/components/game/AnalyticsPanel';
import SocialFeed from '@/components/game/SocialFeed';
import EventsPanel from '@/components/game/EventsPanel';
import SaveLoad from '@/components/game/SaveLoad';
import BottomNav from '@/components/game/BottomNav';
import LeagueTable from '@/components/game/LeagueTable';
import SettingsPanel from '@/components/game/SettingsPanel';
import PlayerProfile from '@/components/game/PlayerProfile';
import SeasonObjectivesPanel from '@/components/game/SeasonObjectivesPanel';
import CupBracket from '@/components/game/CupBracket';
import YouthAcademy from '@/components/game/YouthAcademy';
import RelationshipsPanel from '@/components/game/RelationshipsPanel';
import ContinentalPanel from '@/components/game/ContinentalPanel';
import InternationalPanel from '@/components/game/InternationalPanel';
import MoralePanel from '@/components/game/MoralePanel';
import InjuryReport from '@/components/game/InjuryReport';
import PWAInstallPrompt from '@/components/game/PWAInstallPromptFixed';
import SkillChallenges from '@/components/game/SkillChallenges';
import ManagerOffice from '@/components/game/ManagerOffice';
import PlayerAgentHub from '@/components/game/PlayerAgentHub';
import DailyRoutineHub from '@/components/game/DailyRoutineHub';
import CareerStatistics from '@/components/game/CareerStatistics';
import TacticalBriefing from '@/components/game/TacticalBriefing';
import PlayerOfTheMonth from '@/components/game/PlayerOfTheMonth';
import PostMatchAnalysis from '@/components/game/PostMatchAnalysis';
import PlayerComparison from '@/components/game/PlayerComparison';
import TransferNegotiation from '@/components/game/TransferNegotiation';
import FanEngagement from '@/components/game/FanEngagement';
import WorldFootballNews from '@/components/game/WorldFootballNews';
import HallOfFame from '@/components/game/HallOfFame';
import PlayerTraitsPanel from '@/components/game/PlayerTraitsEnhanced';
import MatchHighlights from '@/components/game/MatchHighlights';
import MatchHighlightsEnhanced from '@/components/game/MatchHighlightsEnhanced';
import PreMatchScoutReport from '@/components/game/PreMatchScoutReport';
import DreamTransfer from '@/components/game/DreamTransfer';
import MatchStatsComparison from '@/components/game/MatchStatsComparison';
import CareerMilestones from '@/components/game/CareerMilestones';
import PressConferenceEnhanced from '@/components/game/PressConferenceEnhanced';
import AchievementsSystem from '@/components/game/AchievementsSystem';
import CareerJournal from '@/components/game/CareerJournal';
import TeamSelection from '@/components/game/TeamSelection';
import SeasonAwards from '@/components/game/SeasonAwards';
import RivalSystem from '@/components/game/RivalSystem';
import TacticalSubstitutions from '@/components/game/TacticalSubstitutions';
import PotentialJourney from '@/components/game/PotentialJourney';
import MatchDayLive from '@/components/game/MatchDayLive';
import DynamicDifficultyPanel from '@/components/game/DynamicDifficultyPanel';
import CareerLegacyProfile from '@/components/game/CareerLegacyProfile';
import PreSeasonTrainingCamp from '@/components/game/PreSeasonTrainingCamp';
import KitCustomization from '@/components/game/KitCustomization';
import TransferMarket from '@/components/game/TransferMarket';
import PersonalFinances from '@/components/game/PersonalFinances';
import CareerRetirement from '@/components/game/CareerRetirement';
import TacticalFormationBoard from '@/components/game/TacticalFormationBoard';
import SquadRotationPlanner from '@/components/game/SquadRotationPlanner';
import FacilitiesUpgrades from '@/components/game/FacilitiesUpgrades';
import MediaInterview from '@/components/game/MediaInterview';
import LoanSystem from '@/components/game/LoanSystem';
import JerseyNumber from '@/components/game/JerseyNumber';
import SponsorSystem from '@/components/game/SponsorSystem';
import TrophyCabinet from '@/components/game/TrophyCabinet';
import DynamicCareerEvents from '@/components/game/DynamicCareerEvents';
import BadgeCollection from '@/components/game/BadgeCollection';
import StadiumBuilder from '@/components/game/StadiumBuilder';
import CareerStatsDeepDive from '@/components/game/CareerStatsDeepDive';
import CoachCareerMode from '@/components/game/CoachCareerMode';
import FantasyDraft from '@/components/game/FantasyDraft';
import InternationalTournament from '@/components/game/InternationalTournament';
import MatchEngineSimulation from '@/components/game/MatchEngineSimulation';
import CareerModeSelector from '@/components/game/CareerModeSelector';
import TrainingDrillMiniGames from '@/components/game/TrainingDrillMiniGames';
import SeasonReviewDocumentary from '@/components/game/SeasonReviewDocumentary';
import InGameStore from '@/components/game/InGameStore';
import ScoutingNetwork from '@/components/game/ScoutingNetwork';
import BoardRoom from '@/components/game/BoardRoom';
import YouthDevelopment from '@/components/game/YouthDevelopment';
import SocialMediaFeed from '@/components/game/SocialMediaFeed';
import CreateAClub from '@/components/game/CreateAClub';
import DailyRewards from '@/components/game/DailyRewards';
import AchievementShowcase from '@/components/game/AchievementShowcase';
import MultiplayerLeague from '@/components/game/MultiplayerLeague';
import PlayerCareerTimeline from '@/components/game/PlayerCareerTimeline';
import ErrorBoundary from '@/components/game/ErrorBoundary';

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
  international: InternationalPanel,
  morale: MoralePanel,
  injury_report: InjuryReport,
  skill_challenges: SkillChallenges,
  manager_office: ManagerOffice,
  player_agent_hub: PlayerAgentHub,
  daily_routine_hub: DailyRoutineHub,
  career_statistics: CareerStatistics,
  tactical_briefing: TacticalBriefing,
  player_of_the_month: PlayerOfTheMonth,
  post_match_analysis: PostMatchAnalysis,
  player_comparison: PlayerComparison,
  transfer_negotiation: TransferNegotiation,
  fan_engagement: FanEngagement,
  world_football_news: WorldFootballNews,
  hall_of_fame: HallOfFame,
  player_traits: PlayerTraitsPanel,
  dream_transfer: DreamTransfer,
  match_highlights: MatchHighlights,
  match_highlights_enhanced: MatchHighlightsEnhanced,
  pre_match_scout: PreMatchScoutReport,
  match_stats_comparison: MatchStatsComparison,
  career_milestones: CareerMilestones,
  press_conference: PressConferenceEnhanced,
  achievements_system: AchievementsSystem,
  team_selection: TeamSelection,
  career_journal: CareerJournal,
  season_awards: SeasonAwards,
  rival_system: RivalSystem,
  tactical_substitutions: TacticalSubstitutions,
  potential_journey: PotentialJourney,
  match_day_live: MatchDayLive,
  dynamic_difficulty: DynamicDifficultyPanel,
  career_legacy_profile: CareerLegacyProfile,
  pre_season_camp: PreSeasonTrainingCamp,
  kit_customization: KitCustomization,
  transfer_market: TransferMarket,
  personal_finances: PersonalFinances,
  tactical_formation_board: TacticalFormationBoard,
  career_retirement: CareerRetirement,
  squad_rotation: SquadRotationPlanner,
  facilities_upgrades: FacilitiesUpgrades,
  loan_system: LoanSystem,
  media_interview: MediaInterview,
  jersey_number: JerseyNumber,
  sponsor_system: SponsorSystem,
  trophy_cabinet: TrophyCabinet,
  career_events: DynamicCareerEvents,
  badge_collection: BadgeCollection,
  stadium_builder: StadiumBuilder,
  career_stats_deep_dive: CareerStatsDeepDive,
  coach_career: CoachCareerMode,
  fantasy_draft: FantasyDraft,
  international_tournament: InternationalTournament,
  career_mode_selector: CareerModeSelector,
  match_engine_simulation: MatchEngineSimulation,
  training_drill_mini_games: TrainingDrillMiniGames,
  season_review_documentary: SeasonReviewDocumentary,
  in_game_store: InGameStore,
  scouting_network: ScoutingNetwork,
  youth_development: YouthDevelopment,
  board_room: BoardRoom,
  social_media_feed: SocialMediaFeed,
  create_a_club: CreateAClub,
  daily_rewards: DailyRewards,
  achievement_showcase: AchievementShowcase,
  multiplayer_league: MultiplayerLeague,
  player_career_timeline: PlayerCareerTimeline,
};

const gameScreens: GameScreen[] = [
  'dashboard', 'match_day', 'training', 'transfers', 'career_hub', 'analytics',
  'social', 'events', 'season_stats', 'agent_hub', 'settings', 'league_table',
  'player_profile', 'season_objectives', 'cup_bracket', 'youth_academy',
  'relationships', 'continental', 'international', 'morale', 'injury_report',
  'skill_challenges', 'manager_office', 'player_agent_hub', 'daily_routine_hub',
  'career_statistics', 'tactical_briefing', 'player_of_the_month',
  'post_match_analysis', 'player_comparison', 'transfer_negotiation',
  'fan_engagement', 'world_football_news', 'hall_of_fame', 'player_traits', 'match_highlights', 'match_highlights_enhanced',
  'pre_match_scout', 'dream_transfer',
  'match_stats_comparison',
  'career_milestones',
  'press_conference',
  'achievements_system',
  'team_selection',
  'career_journal',
  'season_awards',
  'rival_system',
  'tactical_substitutions',
  'potential_journey',
  'match_day_live',
  'dynamic_difficulty',
  'career_legacy_profile',
  'pre_season_camp',
  'kit_customization',
  'transfer_market',
  'personal_finances',
  'tactical_formation_board',
  'career_retirement',
  'squad_rotation',
  'facilities_upgrades',
  'loan_system',
  'media_interview',
  'jersey_number',
  'sponsor_system',
  'trophy_cabinet',
  'career_events',
  'badge_collection',
  'stadium_builder',
  'career_stats_deep_dive',
  'coach_career',
  'fantasy_draft',
  'international_tournament',
  'career_mode_selector',
  'match_engine_simulation',
  'training_drill_mini_games',
  'season_review_documentary',
  'in_game_store',
  'scouting_network',
  'youth_development',
  'board_room',
  'social_media_feed',
  'create_a_club',
  'daily_rewards',
  'achievement_showcase',
  'multiplayer_league',
  'player_career_timeline',
];

export default function Home() {
  const screen = useGameStore(state => state.screen);
  const gameState = useGameStore(state => state.gameState);
  const isProcessing = useGameStore(state => state.isProcessing);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const ScreenComponent = screenComponents[screen] || MainMenu;
  const isGameScreen = gameScreens.includes(screen);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9]">
      <main className="flex-1 overflow-y-auto pb-20">
        {/* key forces unmount/remount on screen change — no AnimatePresence needed */}
        <ErrorBoundary key={screen}>
          <ScreenComponent />
        </ErrorBoundary>
      </main>
      {isGameScreen && gameState && <BottomNav />}
      <PWAInstallPrompt />
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#8b949e]">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
