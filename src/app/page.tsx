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
import ContractNegotiationEnhanced from '@/components/game/ContractNegotiationEnhanced';
import PlayerPsychologyEnhanced from '@/components/game/PlayerPsychologyEnhanced';
import TransferDeadlineDayEnhanced from '@/components/game/TransferDeadlineDayEnhanced';
import SquadRotationEnhanced from '@/components/game/SquadRotationEnhanced';
import MediaInterviewEnhanced from '@/components/game/MediaInterviewEnhanced';
import SponsorSystemEnhanced from '@/components/game/SponsorSystemEnhanced';
import CareerEventsEnhanced from '@/components/game/CareerEventsEnhanced';
import TrainingGroundEnhanced from '@/components/game/TrainingGroundEnhanced';
import YouthAcademyEnhanced from '@/components/game/YouthAcademyEnhanced';
import PersonalFinancesEnhanced from '@/components/game/PersonalFinancesEnhanced';
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
import InGameMail from '@/components/game/InGameMail';
import InjuryRecovery from '@/components/game/InjuryRecovery';
import ManagerCareer from '@/components/game/ManagerCareer';
import MultiplayerLeague from '@/components/game/MultiplayerLeague';
import PlayerCareerTimeline from '@/components/game/PlayerCareerTimeline';
import TacticalSetPieces from '@/components/game/TacticalSetPieces';
import MatchWeatherEffects from '@/components/game/MatchWeatherEffects';
import RefereeSystem from '@/components/game/RefereeSystem';
import TransferDeadlineDay from '@/components/game/TransferDeadlineDay';
import PlayerAgentContract from '@/components/game/PlayerAgentContract';
import FanChants from '@/components/game/FanChants';
import VirtualTrophyRoom from '@/components/game/VirtualTrophyRoom';
import ErrorBoundary from '@/components/game/ErrorBoundary';
import PressScrum from '@/components/game/PressScrum';
import InjurySimulator from '@/components/game/InjurySimulator';
import PlayerBioGenerator from '@/components/game/PlayerBioGenerator';
import SetPieceTrainer from '@/components/game/SetPieceTrainer';
import PlayerPsychology from '@/components/game/PlayerPsychology';
import SocialMediaHub from '@/components/game/SocialMediaHub';
import VirtualTrophyTour from '@/components/game/VirtualTrophyTour';
import CoachCareer from '@/components/game/CoachCareer';
import MatchReplayViewer from '@/components/game/MatchReplayViewer';
import PreSeasonTour from '@/components/game/PreSeasonTour';
import StadiumAtmosphere from '@/components/game/StadiumAtmosphere';
import PlayerAgentHubEnhanced from '@/components/game/PlayerAgentHubEnhanced';
import InternationalExpansion from '@/components/game/InternationalExpansion';
import YouthAcademyDeepDive from '@/components/game/YouthAcademyDeepDive';
import PlayerComparisonEnhanced from '@/components/game/PlayerComparisonEnhanced';
import RefereeSystemEnhanced from '@/components/game/RefereeSystemEnhanced';
import DreamTransferEnhanced from '@/components/game/DreamTransferEnhanced';
import LoanSystemEnhanced from '@/components/game/LoanSystemEnhanced';
import SeasonReviewEnhanced from '@/components/game/SeasonReviewEnhanced';
import MultiplayerEnhanced from '@/components/game/MultiplayerEnhanced';
import FantasyDraftEnhanced from '@/components/game/FantasyDraftEnhanced';
import HallOfFameEnhanced from '@/components/game/HallOfFameEnhanced';
import MediaInteraction from '@/components/game/MediaInteraction';
import LegendStatus from '@/components/game/LegendStatus';
import TacticalBoardEnhanced from '@/components/game/TacticalBoardEnhanced';
import ScoutingNetworkEnhanced from '@/components/game/ScoutingNetworkEnhanced';
import CoachCareerEnhanced from '@/components/game/CoachCareerEnhanced';
import SeasonTrainingEnhanced from '@/components/game/SeasonTrainingEnhanced';
import WeatherEnhanced from '@/components/game/WeatherEnhanced';
import DraftSystemEnhanced from '@/components/game/DraftSystemEnhanced';
import CareerJournalEnhanced from '@/components/game/CareerJournalEnhanced';
import CareerLegacyProfileEnhanced from '@/components/game/CareerLegacyProfileEnhanced';
import InjuryRecoveryEnhanced from '@/components/game/InjuryRecoveryEnhanced';
import SkillChallengesEnhanced from '@/components/game/SkillChallengesEnhanced';
import DailyRoutineEnhanced from '@/components/game/DailyRoutineEnhanced';
import SetPieceTrainerEnhanced from '@/components/game/SetPieceTrainerEnhanced';
import TransferMarketEnhanced from '@/components/game/TransferMarketEnhanced';
import MatchEngineSimulationEnhanced from '@/components/game/MatchEngineSimulationEnhanced';

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
  in_game_mail: InGameMail,
  multiplayer_league: MultiplayerLeague,
  player_career_timeline: PlayerCareerTimeline,
  injury_recovery: InjuryRecovery,
  manager_career: ManagerCareer,
  tactical_set_pieces: TacticalSetPieces,
  referee_system: RefereeSystem,
  match_weather_effects: MatchWeatherEffects,
  transfer_deadline_day: TransferDeadlineDay,
  player_agent_contract: PlayerAgentContract,
  fan_chants: FanChants,
  virtual_trophy_room: VirtualTrophyRoom,
  press_scrum: PressScrum,
  injury_simulator: InjurySimulator,
  player_bio_generator: PlayerBioGenerator,
  set_piece_trainer: SetPieceTrainer,
  player_psychology: PlayerPsychology,
  social_media_hub: SocialMediaHub,
  virtual_trophy_tour: VirtualTrophyTour,
  coach_career_path: CoachCareer,
  match_replay_viewer: MatchReplayViewer,
  pre_season_tour: PreSeasonTour,
  stadium_atmosphere: StadiumAtmosphere,
  player_agent_hub_enhanced: PlayerAgentHubEnhanced,
  international_expansion: InternationalExpansion,
  youth_academy_deep_dive: YouthAcademyDeepDive,
  player_comparison_enhanced: PlayerComparisonEnhanced,
  referee_system_enhanced: RefereeSystemEnhanced,
  dream_transfer_enhanced: DreamTransferEnhanced,
  loan_system_enhanced: LoanSystemEnhanced,
  season_review_enhanced: SeasonReviewEnhanced,
  multiplayer_enhanced: MultiplayerEnhanced,
  fantasy_draft_enhanced: FantasyDraftEnhanced,
  hall_of_fame_enhanced: HallOfFameEnhanced,
  media_interaction: MediaInteraction,
  legend_status: LegendStatus,
  tactical_board_enhanced: TacticalBoardEnhanced,
  scouting_network_enhanced: ScoutingNetworkEnhanced,
  coach_career_enhanced: CoachCareerEnhanced,
  season_training_enhanced: SeasonTrainingEnhanced,
  weather_enhanced: WeatherEnhanced,
  draft_system_enhanced: DraftSystemEnhanced,
  career_journal_enhanced: CareerJournalEnhanced,
  career_legacy_profile_enhanced: CareerLegacyProfileEnhanced,
  injury_recovery_enhanced: InjuryRecoveryEnhanced,
  skill_challenges_enhanced: SkillChallengesEnhanced,
  daily_routine_enhanced: DailyRoutineEnhanced,
  set_piece_trainer_enhanced: SetPieceTrainerEnhanced,
  transfer_market_enhanced: TransferMarketEnhanced,
  match_engine_simulation_enhanced: MatchEngineSimulationEnhanced,
  contract_negotiation_enhanced: ContractNegotiationEnhanced,
  player_psychology_enhanced: PlayerPsychologyEnhanced,
  transfer_deadline_day_enhanced: TransferDeadlineDayEnhanced,
  squad_rotation_enhanced: SquadRotationEnhanced,
  media_interview_enhanced: MediaInterviewEnhanced,
  sponsor_system_enhanced: SponsorSystemEnhanced,
  career_events_enhanced: CareerEventsEnhanced,
  training_ground_enhanced: TrainingGroundEnhanced,
  youth_academy_enhanced: YouthAcademyEnhanced,
  personal_finances_enhanced: PersonalFinancesEnhanced,
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
  'in_game_mail',
  'player_career_timeline',
  'injury_recovery',
  'manager_career',
  'tactical_set_pieces',
  'referee_system',
  'match_weather_effects',
  'transfer_deadline_day',
  'player_agent_contract',
  'fan_chants',
  'virtual_trophy_room',
  'press_scrum',
  'injury_simulator',
  'player_bio_generator',
  'set_piece_trainer',
  'player_psychology',
  'social_media_hub',
  'virtual_trophy_tour',
  'coach_career_path',
  'match_replay_viewer',
  'pre_season_tour',
  'stadium_atmosphere',
  'player_agent_hub_enhanced',
  'international_expansion',
  'youth_academy_deep_dive',
  'player_comparison_enhanced',
  'referee_system_enhanced',
  'dream_transfer_enhanced',
  'loan_system_enhanced',
  'season_review_enhanced',
  'multiplayer_enhanced',
  'fantasy_draft_enhanced',
  'hall_of_fame_enhanced',
  'media_interaction',
  'legend_status',
  'tactical_board_enhanced',
  'scouting_network_enhanced',
  'coach_career_enhanced',
  'season_training_enhanced',
  'weather_enhanced',
  'draft_system_enhanced',
  'career_journal_enhanced',
  'career_legacy_profile_enhanced',
  'injury_recovery_enhanced',
  'skill_challenges_enhanced',
  'daily_routine_enhanced',
  'set_piece_trainer_enhanced',
  'transfer_market_enhanced',
  'match_engine_simulation_enhanced',
  'contract_negotiation_enhanced',
  'player_psychology_enhanced',
  'transfer_deadline_day_enhanced',
  'squad_rotation_enhanced',
  'media_interview_enhanced',
  'sponsor_system_enhanced',
  'career_events_enhanced',
  'training_ground_enhanced',
  'youth_academy_enhanced',
  'personal_finances_enhanced',
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
