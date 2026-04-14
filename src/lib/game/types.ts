// ============================================================
// Elite Striker - Core Game Type Definitions (Unified)
// ============================================================

// --- Positions ---
export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'LM' | 'RM' | 'ST' | 'CF';

export const POSITION_GROUPS: Record<string, Position[]> = {
  Goalkeeper: ['GK'],
  Defence: ['CB', 'LB', 'RB'],
  Midfield: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  Attack: ['LW', 'RW', 'ST', 'CF'],
};

// --- Core attribute helpers (6 outfield attributes, excluding optional GK ones) ---
export type CoreAttribute = 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';
export type CoreAttributes = Pick<PlayerAttributes, CoreAttribute>;

// --- Player Attributes (0-100 scale) ---
export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  // GK-specific attributes
  diving?: number;
  handling?: number;
  positioning?: number;
  reflexes?: number;
}

// --- Playing Style ---
export interface PlayingStyle {
  attacking: number;   // 0-100
  possession: number;  // 0-100
  pressing: number;    // 0-100
  defensive: number;   // 0-100
}

// --- Club ---
export interface Club {
  id: string;
  name: string;
  shortName: string;
  league: string;
  country: string;
  tier: number;          // 1-5
  reputation: number;    // 0-100
  quality: number;       // 0-100 average team strength
  budget: number;        // transfer budget in euros
  wageBudget: number;    // weekly wage budget
  squadSize: number;
  facilities: number;    // 0-100
  finances: number;      // 0-100
  tacticalStyle: string; // 'attacking'|'defensive'|'counter-attack'|'possession'
  formation: string;     // e.g. '4-3-3'
  squadQuality: number;  // 0-100
  youthDevelopment: number; // 0-100
  style: PlayingStyle;
  needsPositions: Position[];
  logo: string;          // emoji
  primaryColor: string;
  secondaryColor: string;
}

// --- Squad Status ---
export type SquadStatus = 'starter' | 'rotation' | 'bench' | 'prospect' | 'loan' | 'transfer_listed';

// --- Contract ---
export interface Contract {
  weeklyWage: number;
  releaseClause?: number;
  yearsRemaining: number;
  signingBonus?: number;
  performanceBonuses?: {
    goalsBonus?: number;
    assistBonus?: number;
    cleanSheetBonus?: number;
  };
}

// --- Injury ---
export interface InjuryRecord {
  type: string;
  weekOccured: number;
  seasonOccured: number;
  weeksOut: number;
}

// --- Enhanced Injury System ---
export type InjuryType = 'minor' | 'moderate' | 'severe' | 'concussion' | 'career_threatening';
export type InjuryCategory = 'muscle' | 'ligament' | 'bone' | 'concussion' | 'illness';

export interface Injury {
  id: string;
  type: InjuryType;
  category: InjuryCategory;
  name: string; // e.g. "Hamstring Strain", "ACL Tear", "Ankle Sprain"
  weekSustained: number;
  seasonSustained: number;
  weeksOut: number; // total weeks to recover
  weeksRemaining: number;
  matchMissed: boolean;
}

// --- Player Trait ---
export type PlayerTrait =
  // Attacking
  | 'clinical_finisher' | 'speed_demon' | 'free_kick_specialist'
  // Defending
  | 'iron_wall' | 'leadership'
  // Mental
  | 'big_game_player' | 'never_give_up' | 'cool_under_pressure'
  // Physical
  | 'iron_man' | 'marathon_runner' | 'quick_recovery'
  // Special
  | 'fan_favorite' | 'media_darling' | 'club_legend'
  // Legacy traits
  | 'speedster' | 'poacher' | 'playmaker' | 'tank' | 'aerial'
  | 'technical' | 'leader' | 'injury_prone' | 'late_bloomer'
  | 'wonderkid' | 'consistent' | 'volatile'
  | 'quick_learner';

// --- Trait Category ---
export type TraitCategory = 'attacking' | 'defending' | 'mental' | 'physical' | 'special';

// --- Trait Rarity ---
export type TraitRarity = 'common' | 'rare' | 'epic' | 'legendary';

// --- Trait Definition (metadata for display & gameplay) ---
export interface TraitDefinition {
  id: PlayerTrait;
  name: string;
  description: string;
  icon: string;
  category: TraitCategory;
  rarity: TraitRarity;
  effect: string;
  effectDetails: {
    type: string;
    value: number;
  };
  toggleable: boolean;
  unlockRequirement: {
    type: 'goals' | 'appearances' | 'overall' | 'age' | 'position' | 'reputation' | 'matches_rated_7' | 'seasons_at_club' | 'clean_sheets' | 'injury_count' | 'free_kick_goals' | 'penalty_goals';
    value: number;
    label: string;
  };
}

// --- Season Stats ---
export interface SeasonPlayerStats {
  appearances: number;
  starts: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  averageRating: number;
  manOfTheMatch: number;
  injuries: number;
}

export interface CareerPlayerStats {
  totalAppearances: number;
  totalGoals: number;
  totalAssists: number;
  totalCleanSheets: number;
  trophies: Trophy[];
  seasonsPlayed: number;
}

export interface Trophy {
  name: string;
  season: number;
}

// --- Player ---
export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  position: Position;
  secondaryPositions: Position[];
  attributes: PlayerAttributes;
  overall: number;
  potential: number;
  fitness: number;       // 0-100
  morale: number;        // 0-100
  form: number;          // 0-10 rolling avg
  reputation: number;    // 0-100
  marketValue: number;   // in euros
  squadStatus: SquadStatus;
  contract: Contract;
  injuryWeeks: number;   // 0 = fit
  injuryHistory: InjuryRecord[];
  seasonStats: SeasonPlayerStats;
  careerStats: CareerPlayerStats;
  traits: PlayerTrait[];
  agentQuality: number;  // 0-100
  preferredFoot: 'left' | 'right' | 'both';
}

// --- Match Types ---
export interface MatchResult {
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  playerRating: number;
  playerMinutesPlayed: number;
  playerStarted: boolean;
  playerGoals: number;
  playerAssists: number;
  competition: string;
  week: number;
  season: number;
}

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  team: 'home' | 'away' | 'neutral';
  playerName?: string;
  playerId?: string;
  detail?: string;
}

export type MatchEventType =
  | 'goal' | 'own_goal' | 'assist' | 'yellow_card' | 'red_card'
  | 'second_yellow' | 'substitution' | 'injury' | 'chance'
  | 'save' | 'penalty_won' | 'penalty_missed' | 'corner' | 'free_kick'
  | 'weather';

export interface MatchState {
  homeScore: number;
  awayScore: number;
  homeMomentum: number;
  awayMomentum: number;
  events: MatchEvent[];
  playerInvolved: boolean;
  playerHasGoal: boolean;
  playerHasAssist: boolean;
  playerTeam: 'home' | 'away';
}

// --- Fixture ---
export interface Fixture {
  id: string;
  homeClubId: string;
  awayClubId: string;
  date: string;
  matchday: number;
  competition: 'league' | 'cup' | 'continental' | 'friendly';
  season: number;
  played: boolean;
}

// --- League ---
export interface LeagueStanding {
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

// --- Training ---
export interface TrainingSession {
  type: TrainingType;
  intensity: number;        // 0-100
  focusAttribute?: keyof PlayerAttributes;
  completedAt: number;
}

export type TrainingType = 'attacking' | 'defensive' | 'physical' | 'technical' | 'tactical' | 'recovery';

// --- Random Events ---
export type EventType =
  | 'TRANSFER_RUMOR' | 'MEDIA_INTERVIEW' | 'PERSONAL_LIFE'
  | 'TEAM_CONFLICT' | 'MENTORSHIP' | 'SPONSORSHIP';

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  choices: EventChoice[];
  week: number;
  season: number;
  expires: boolean;
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffects;
}

export interface EventEffects {
  morale?: number;
  reputation?: number;
  fitness?: number;
  marketValue?: number;
  attributes?: Partial<PlayerAttributes>;
  form?: number;
  injuryWeeks?: number;
  squadStatus?: SquadStatus;
  contract?: Partial<Contract>;
}

// --- Transfer ---
export interface TransferOffer {
  id: string;
  fromClub: Club;
  fee: number;
  contractOffer: Contract;
  squadRole: SquadStatus;
  transferWindow: 'summer' | 'winter';
  season: number;
  week: number;
}

export interface LoanOffer {
  id: string;
  fromClub: Club;
  durationWeeks: number;
  guaranteedMinutes: boolean;
  wageContribution: number;
  season: number;
  week: number;
}

// --- Social ---
export interface SocialPost {
  id: string;
  source: string;
  content: string;
  sentiment: number;   // -100 to 100
  engagement: number;  // 0-100
  week: number;
  season: number;
  type: 'fan' | 'media' | 'official' | 'agent' | 'pundit';
}

export interface Storyline {
  id: string;
  title: string;
  description: string;
  startDate: number;
  startWeek: number;
  startSeason: number;
  currentPhase: number;
  totalPhases: number;
  sentiment: number;  // -100 to 100
  status: 'active' | 'resolved' | 'dormant';
  tags: string[];
}

// --- Achievement ---
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedSeason?: number;
  category: 'career' | 'match' | 'training' | 'social' | 'transfer';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// --- Week Simulation ---
export interface WeekSimulation {
  week: number;
  season: number;
  matchResult: MatchResult | null;
  trainingCompleted: TrainingSession[];
  events: GameEvent[];
  transferOffers: TransferOffer[];
  loanOffers: LoanOffer[];
  socialPosts: SocialPost[];
  storylineUpdates: Storyline[];
  playerUpdates: Partial<Player>;
}

// --- Save Slot ---
export interface SaveSlot {
  id: string;
  name: string;
  gameState: GameState;
  savedAt: string;
  playTime: number;
}

// --- Game Notification ---
export interface GameNotification {
  id: string;
  type: 'match' | 'transfer' | 'event' | 'achievement' | 'social' | 'contract' | 'training' | 'career';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionRequired: boolean;
}

// --- Youth Academy ---
export type YouthCategory = 'u18' | 'u21';

export interface YouthPlayer {
  id: string;
  name: string;
  age: number;            // 14-18 for U18, 18-21 for U21
  nationality: string;
  position: Position;
  secondaryPositions: Position[];
  attributes: PlayerAttributes;
  overall: number;
  potential: number;       // hidden from player view, shown as range
  fitness: number;
  morale: number;
  form: number;
  category: YouthCategory;
  clubId: string;
  seasonStats: {
    appearances: number;
    goals: number;
    assists: number;
    averageRating: number;
    cleanSheets: number;
  };
  traits: PlayerTrait[];
  preferredFoot: 'left' | 'right' | 'both';
  joinedSeason: number;
  trainingFocus?: keyof PlayerAttributes;
  promotionStatus: 'developing' | 'ready' | 'overdue';
}

export interface YouthTeam {
  clubId: string;
  category: YouthCategory;
  players: YouthPlayer[];
}

export interface YouthLeagueStanding {
  clubId: string;
  clubName: string;
  category: YouthCategory;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface YouthFixture {
  id: string;
  homeClubId: string;
  awayClubId: string;
  matchday: number;
  competition: 'youth_league' | 'youth_cup';
  category: YouthCategory;
  season: number;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
}

export interface YouthMatchResult {
  fixtureId: string;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
  category: YouthCategory;
  competition: 'youth_league' | 'youth_cup';
  week: number;
  season: number;
  playerGoals?: number;
  playerAssists?: number;
  playerRating?: number;
  playerMinutesPlayed?: number;
}

export interface YouthCupRound {
  category: YouthCategory;
  round: number;
  fixtures: YouthFixture[];
}

// --- Relationships ---
export type RelationshipType = 'teammate' | 'coach' | 'rival' | 'mentor' | 'agent' | 'media' | 'fan_favorite';
export type RelationshipLevel = 'hostile' | 'cold' | 'neutral' | 'friendly' | 'close' | 'legendary';

export interface Relationship {
  id: string;
  name: string;
  type: RelationshipType;
  level: RelationshipLevel;
  affinity: number;        // 0-100
  history: string[];       // key moments
  clubId?: string;         // for teammate/coach relationships
  position?: Position;     // for teammate relationships
  trait?: string;          // personality trait
  isCurrent: boolean;      // still at same club?
}

export interface TeamDynamics {
  morale: number;           // 0-100 team morale
  cohesion: number;         // 0-100 how well team plays together
  dressingRoomAtmosphere: 'toxic' | 'tense' | 'neutral' | 'positive' | 'excellent';
  playerInfluence: number;  // 0-100 how influential the player is in the squad
  captainRating: number;    // 0-100 leadership rating
}

// --- Continental Competitions ---
export type ContinentalCompetition = 'champions_league' | 'europa_league';

export interface ContinentalFixture {
  id: string;
  homeClubId: string;
  awayClubId: string;
  competition: ContinentalCompetition;
  stage: 'group' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'final';
  group?: string; // A-H for group stage
  matchday: number; // 1-6 for group stage, round number for knockout
  season: number;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
}

export interface ContinentalGroupStanding {
  clubId: string;
  clubName: string;
  competition: ContinentalCompetition;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface ContinentalBracketRound {
  competition: ContinentalCompetition;
  stage: ContinentalFixture['stage'];
  fixtures: ContinentalFixture[];
}

// --- International Duty ---
export type InternationalMatchType = 'friendly' | 'qualifier' | 'tournament_group' | 'tournament_knockout' | 'tournament_final';

export interface InternationalFixture {
  id: string;
  homeNation: string;  // country name
  awayNation: string;
  matchType: InternationalMatchType;
  homeFlag: string;  // emoji flag
  awayFlag: string;
  week: number;
  season: number;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  playerCalledUp: boolean;
  playerStarted?: boolean;
  playerMinutes?: number;
  playerGoals?: number;
  playerAssists?: number;
  playerRating?: number;
}

export interface InternationalCareer {
  caps: number;  // total appearances
  goals: number;
  assists: number;
  averageRating: number;
  tournaments: string[];  // tournament names participated
  lastCallUpSeason: number;
  lastCallUpWeek: number;
}

// --- Game Screen Navigation ---
export type GameScreen =
  | 'main_menu' | 'career_setup' | 'dashboard' | 'match_day'
  | 'training' | 'transfers' | 'agent_hub' | 'career_hub'
  | 'analytics' | 'season_stats' | 'social' | 'events'
  | 'settings' | 'save_load' | 'league_table' | 'player_profile'
  | 'season_objectives' | 'cup_bracket' | 'youth_academy' | 'relationships' | 'continental' | 'international' | 'morale' | 'injury_report'
  | 'skill_challenges' | 'manager_office'
  | 'player_agent_hub' | 'daily_routine_hub' | 'career_statistics' | 'tactical_briefing'
  | 'player_of_the_month' | 'post_match_analysis' | 'player_comparison'
  | 'transfer_negotiation'
  | 'fan_engagement'
  | 'world_football_news'
  | 'hall_of_fame'
  | 'player_traits'
  | 'match_highlights'
  | 'match_highlights_enhanced'
  | 'pre_match_scout'
  | 'dream_transfer'
  | 'match_stats_comparison'
  | 'career_milestones'
  | 'press_conference'
  | 'achievements_system'
  | 'team_selection'
  | 'career_journal'
  | 'season_awards'
  | 'rival_system'
  | 'tactical_substitutions'
  | 'potential_journey'
  | 'match_day_live'
  | 'dynamic_difficulty'
  | 'career_legacy_profile'
  | 'pre_season_camp'
  | 'kit_customization'
  | 'transfer_market'
  | 'personal_finances'
  | 'tactical_formation_board'
  | 'career_retirement'
  | 'squad_rotation'
  | 'facilities_upgrades'
  | 'media_interview'
  | 'loan_system'
  | 'jersey_number'
  | 'sponsor_system'
  | 'trophy_cabinet'
  | 'career_events'
  | 'badge_collection'
  | 'stadium_builder'
  | 'career_stats_deep_dive'
  | 'coach_career'
  | 'fantasy_draft'
  | 'international_tournament'
  | 'multiplayer_league'
  | 'player_career_timeline'
  | 'career_mode_selector'
  | 'match_engine_simulation'
  | 'training_drill_mini_games'
  | 'season_review_documentary'
  | 'in_game_store'
  | 'scouting_network'
  | 'youth_development'
  | 'board_room'
  | 'social_media_feed'
  | 'create_a_club'
  | 'daily_rewards'
  | 'achievement_showcase'
  | 'injury_recovery'
  | 'in_game_mail'
  | 'manager_career'
  | 'tactical_set_pieces'
  | 'referee_system'
  | 'match_weather_effects'
  | 'transfer_deadline_day'
  | 'player_agent_contract'
  | 'fan_chants'
  | 'virtual_trophy_room'
  | 'press_scrum'
  | 'injury_simulator'
  | 'player_bio_generator'
  | 'set_piece_trainer';

// --- Player Mindset ---
export type PlayerMindset = 'aggressive' | 'balanced' | 'conservative';

export interface MoraleFactor {
  id: string;
  label: string;
  impact: number; // -100 to +100
  category: 'match' | 'personal' | 'team' | 'contract' | 'social';
  expiresWeek?: number;
}

// --- Player Team Level ---
export type PlayerTeamLevel = 'u18' | 'u21' | 'senior';

// --- Season Training Focus ---
export type SeasonTrainingFocusArea = 'attacking' | 'defensive' | 'physical' | 'technical' | 'tactical';

export interface SeasonTrainingFocus {
  area: SeasonTrainingFocusArea;
  focusAttributes: (keyof PlayerAttributes)[];  // attributes boosted by this focus
  bonusMultiplier: number;  // 1.5 to 2.0 based on age/potential
  setAtSeason: number;
}

// --- Season Objectives ---
export type ObjectiveCategory = 'board' | 'personal' | 'bonus';
export type ObjectiveStatus = 'in_progress' | 'completed' | 'failed';

export interface SeasonObjective {
  id: string;
  category: ObjectiveCategory;
  title: string;
  description: string;
  target: number;
  current: number;
  status: ObjectiveStatus;
  reward: number; // bonus wage multiplier or flat bonus
  icon: string;
  deadline: 'season_end' | 'half_season' | 'specific_week';
  deadlineWeek?: number;
}

export interface SeasonObjectivesSet {
  season: number;
  objectives: SeasonObjective[];
  boardExpectation: 'title_challenge' | 'top_four' | 'mid_table' | 'survival';
  bonusPaid: boolean;
}

export interface SeasonAward {
  id: string;
  name: string;
  category: 'player_of_year' | 'young_player' | 'top_scorer' | 'top_assist' | 'team_of_season' | 'player_of_month';
  season: number;
  month?: number; // for monthly awards
  winner: string; // player name or club name
  winnerClub: string;
  stats: string; // e.g., "25 goals" or "8.2 avg rating"
  icon: string;
  isPlayer: boolean;
}

// --- Weather System ---
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'snowy' | 'foggy' | 'hot' | 'stormy';

export interface WeatherStatModifier {
  stat: string;       // 'pace' | 'shooting' | 'passing' | 'physical' | 'fatigue'
  modifier: number;   // e.g. -15 = -15%
  label: string;      // e.g. 'Pace'
}

export interface WeatherCondition {
  type: WeatherType;
  name: string;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  modifiers: WeatherStatModifier[];
}

// --- Game State (Master State) ---
export interface GameState {
  player: Player;
  currentClub: Club;
  currentSeason: number;
  currentWeek: number;
  year: number;
  seasons: {
    number: number;
    year: number;
    leaguePosition: number;
    playerStats: SeasonPlayerStats;
    achievements: string[];
  }[];
  recentResults: MatchResult[];
  upcomingFixtures: Fixture[];
  leagueTable: LeagueStanding[];
  activeEvents: GameEvent[];
  resolvedEvents: GameEvent[];
  transferOffers: TransferOffer[];
  loanOffers: LoanOffer[];
  socialFeed: SocialPost[];
  storylines: Storyline[];
  achievements: Achievement[];
  trainingHistory: TrainingSession[];
  trainingAvailable: number;
  availableClubs: Club[];
  notifications: GameNotification[];
  seasonObjectives: SeasonObjectivesSet[];
  seasonAwards: SeasonAward[];
  cupFixtures: Fixture[];
  cupRound: number;
  cupEliminated: boolean;
  // Youth Academy
  youthTeams: YouthTeam[];
  youthLeagueTables: YouthLeagueStanding[];
  youthFixtures: YouthFixture[];
  youthCupFixtures: YouthFixture[];
  youthCupRound: number;
  youthCupEliminated: boolean;
  youthMatchResults: YouthMatchResult[];
  youthLeagueMatchWeek: number; // tracks current matchday for youth leagues
  // Relationships & Team Dynamics
  relationships: Relationship[];
  teamDynamics: TeamDynamics;
  // Continental Competitions
  continentalFixtures: ContinentalFixture[];
  continentalGroupStandings: ContinentalGroupStanding[];
  continentalQualified: boolean; // whether player's club qualified for continental
  continentalCompetition: ContinentalCompetition | null; // which competition qualified for
  continentalKnockoutRound: number; // current knockout round (0 = group stage)
  continentalEliminated: boolean;
  // International Duty
  internationalFixtures: InternationalFixture[];
  internationalCareer: InternationalCareer;
  internationalCalledUp: boolean;  // currently called up?
  internationalOnBreak: boolean;  // is there an international break this week?
  // Player Team Level
  playerTeamLevel: PlayerTeamLevel;
  // Season Training Focus
  seasonTrainingFocus: SeasonTrainingFocus | null;
  // Mindset & Morale
  mindset: PlayerMindset;
  moraleFactors: MoraleFactor[];
  // Injury System
  injuries: Injury[];
  currentInjury: Injury | null;
  // Weather System
  currentWeather: WeatherCondition | null;
  weatherPreparation: 'standard' | 'adapt' | 'ignore';
  retirementPending: boolean;
  retirementRiskPushed: boolean;
  gameMode: 'career';
  difficulty: 'easy' | 'normal' | 'hard';
  createdAt: string;
  lastSaved: string;
  playTime: number;
}
