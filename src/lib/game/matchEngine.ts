// ============================================================
// Elite Striker - Match Simulation Engine
// Core match simulation logic with realistic scorelines,
// player contributions, and dynamic match events
// ============================================================

import {
  Club,
  Player,
  Position,
  MatchResult,
  MatchEvent,
  MatchState,
  MatchEventType,
  PlayerAttributes,
  WeatherCondition,
} from './types';

// --- Seeded random for reproducibility ---
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

let _rng = Math.random;

export function setMatchRng(seed?: number): void {
  _rng = seed !== undefined ? createRng(seed) : Math.random;
}

function rng(): number {
  return _rng();
}

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// --- Position weight maps for attribute importance ---
const POSITION_ATTRIBUTE_WEIGHTS: Record<Position, Partial<Record<keyof PlayerAttributes, number>>> = {
  GK:  { physical: 0.3, passing: 0.15, defending: 0.35, pace: 0.1, dribbling: 0.05, shooting: 0.05 },
  CB:  { defending: 0.35, physical: 0.3, pace: 0.15, passing: 0.1, dribbling: 0.05, shooting: 0.05 },
  LB:  { pace: 0.25, defending: 0.25, physical: 0.2, passing: 0.15, dribbling: 0.1, shooting: 0.05 },
  RB:  { pace: 0.25, defending: 0.25, physical: 0.2, passing: 0.15, dribbling: 0.1, shooting: 0.05 },
  CDM: { defending: 0.3, passing: 0.25, physical: 0.25, pace: 0.1, dribbling: 0.05, shooting: 0.05 },
  CM:  { passing: 0.3, dribbling: 0.2, physical: 0.2, defending: 0.1, shooting: 0.1, pace: 0.1 },
  CAM: { passing: 0.3, dribbling: 0.25, shooting: 0.2, pace: 0.1, physical: 0.1, defending: 0.05 },
  LW:  { pace: 0.25, dribbling: 0.25, shooting: 0.2, passing: 0.15, physical: 0.1, defending: 0.05 },
  RW:  { pace: 0.25, dribbling: 0.25, shooting: 0.2, passing: 0.15, physical: 0.1, defending: 0.05 },
  LM:  { pace: 0.2, passing: 0.25, dribbling: 0.2, shooting: 0.1, physical: 0.15, defending: 0.1 },
  RM:  { pace: 0.2, passing: 0.25, dribbling: 0.2, shooting: 0.1, physical: 0.15, defending: 0.1 },
  CF:  { shooting: 0.3, passing: 0.2, dribbling: 0.2, pace: 0.1, physical: 0.1, defending: 0.1 },
  ST:  { shooting: 0.35, pace: 0.2, dribbling: 0.2, physical: 0.15, passing: 0.05, defending: 0.05 },
};

// --- Player's contribution weight by position ---
const POSITION_GOAL_PROB: Record<Position, number> = {
  GK: 0.0, CB: 0.03, LB: 0.04, RB: 0.04,
  CDM: 0.05, CM: 0.1, CAM: 0.15, LM: 0.12, RM: 0.12, LW: 0.18, RW: 0.18, CF: 0.25, ST: 0.3,
};

const POSITION_ASSIST_PROB: Record<Position, number> = {
  GK: 0.0, CB: 0.03, LB: 0.06, RB: 0.06,
  CDM: 0.08, CM: 0.15, CAM: 0.2, LM: 0.15, RM: 0.15, LW: 0.15, RW: 0.15, CF: 0.1, ST: 0.08,
};

const POSITION_CLEAN_SHEET_PROB: Record<Position, number> = {
  GK: 0.4, CB: 0.35, LB: 0.3, RB: 0.3,
  CDM: 0.2, CM: 0.1, CAM: 0.05, LM: 0.08, RM: 0.08, LW: 0.02, RW: 0.02, CF: 0.01, ST: 0.01,
};

// --- Squad Selection ---
export function determineSquadSelection(
  player: Player,
  club: Club
): { starts: boolean; position: Position; minutesLikely: number } {
  const { overall, fitness, form, squadStatus, position } = player;

  // Fitness check - injured players don't play
  if (player.injuryWeeks > 0) {
    return { starts: false, position, minutesLikely: 0 };
  }

  // Base probability of starting from squad status
  const statusStartProb: Record<string, number> = {
    starter: 0.85,
    rotation: 0.45,
    bench: 0.15,
    prospect: 0.08,
    loan: 0.0,
    transfer_listed: 0.1,
  };

  let startProb = statusStartProb[squadStatus] ?? 0.2;

  // Fitness modifier - below 70 fitness significantly reduces starting chance
  const fitnessMod = fitness >= 85 ? 1.1 : fitness >= 70 ? 1.0 : fitness >= 50 ? 0.7 : 0.3;
  startProb *= fitnessMod;

  // Form modifier
  const formMod = form >= 7.5 ? 1.15 : form >= 6.0 ? 1.0 : form >= 4.5 ? 0.85 : 0.65;
  startProb *= formMod;

  // Quality relative to club - if player is much better than team average, more likely to start
  const qualityDiff = overall - club.quality;
  if (qualityDiff > 10) startProb *= 1.2;
  else if (qualityDiff > 5) startProb *= 1.1;
  else if (qualityDiff < -10) startProb *= 0.6;
  else if (qualityDiff < -5) startProb *= 0.8;

  // Determine if starting
  const starts = rng() < clamp(startProb, 0, 1);

  // Minutes likely based on starting and various factors
  let minutesLikely = 0;
  if (starts) {
    minutesLikely = 90;
    // Fitness affects minutes
    if (fitness < 70) minutesLikely -= randInt(15, 30);
    else if (fitness < 80) minutesLikely -= randInt(5, 15);

    // Form affects substitution likelihood
    if (form < 5.0) minutesLikely -= randInt(10, 25);

    minutesLikely = Math.max(45, minutesLikely);
  } else {
    // Coming off the bench
    minutesLikely = randInt(5, 30);
    // Better players get more bench minutes
    if (overall > club.quality + 5) minutesLikely = randInt(15, 45);
  }

  return {
    starts,
    position,
    minutesLikely: clamp(minutesLikely, 0, 90),
  };
}

// --- Calculate club quality for match simulation ---
function clubMatchQuality(club: Club): number {
  // Base quality with some random variance per match
  return club.quality + (rng() - 0.5) * 10;
}

// ============================================================
// Weather stat modifier definitions for match engine
// ============================================================
const WEATHER_ENGINE_MODIFIERS: Record<string, { stat: keyof PlayerAttributes | 'fatigue'; modifier: number }[]> = {
  sunny:  [],
  cloudy: [],
  rainy:  [
    { stat: 'pace', modifier: -10 },
    { stat: 'shooting', modifier: -15 },
    { stat: 'passing', modifier: -10 },
  ],
  windy: [
    { stat: 'shooting', modifier: -10 },
    { stat: 'passing', modifier: -15 },
  ],
  snowy: [
    { stat: 'pace', modifier: -20 },
    { stat: 'shooting', modifier: -15 },
    { stat: 'physical', modifier: -10 },
  ],
  hot: [
    { stat: 'pace', modifier: -10 },
    { stat: 'physical', modifier: -15 },
    { stat: 'fatigue', modifier: 20 },
  ],
  stormy: [
    { stat: 'pace', modifier: -15 },
    { stat: 'shooting', modifier: -20 },
    { stat: 'passing', modifier: -15 },
    { stat: 'physical', modifier: -10 },
    { stat: 'fatigue', modifier: 20 },
  ],
  foggy: [
    { stat: 'passing', modifier: -10 },
    { stat: 'shooting', modifier: -5 },
  ],
};

// ============================================================
// Weather commentary templates
// ============================================================
const WEATHER_COMMENTARY: Record<string, string[]> = {
  rainy: [
    'Heavy rain is making conditions difficult for both sides!',
    'The pitch is waterlogged and passes are sticking in the mud.',
    'Players are struggling for grip on the slick surface.',
  ],
  windy: [
    'Strong winds are playing havoc with aerial balls and long passes!',
    'The ball is swerving unpredictably in these gusty conditions.',
    'Both teams are struggling to adapt to the blustery wind.',
  ],
  snowy: [
    'Snow blankets the pitch making every touch treacherous.',
    'Players are finding it hard to keep their footing in the snow.',
    'The cold conditions are draining energy from both squads.',
  ],
  hot: [
    'The scorching heat is taking its toll on the players.',
    'Tempers are fraying as exhaustion sets in under the blazing sun.',
    'Players are taking extra hydration breaks in these extreme temperatures.',
  ],
  stormy: [
    'Thunder rumbles overhead as lightning illuminates the sky!',
    'Extreme conditions are making this a real test of character.',
    'The storm is worsening and both teams are being pushed to their limits.',
  ],
  foggy: [
    'Thick fog is reducing visibility across the entire pitch.',
    'Players can barely see the far touchline in this dense fog.',
    'Long passes are becoming a lottery in these murky conditions.',
  ],
};

// ============================================================
// Apply weather modifiers to player attributes
// ============================================================
function applyWeatherToPlayer(
  player: Player,
  weather: WeatherCondition | null,
  preparation: 'standard' | 'adapt' | 'ignore' = 'standard'
): { modifiedPlayer: Player; effectiveModifiers: { stat: string; modifier: number }[] } {
  if (!weather || !WEATHER_ENGINE_MODIFIERS[weather.type]) {
    return { modifiedPlayer: player, effectiveModifiers: [] };
  }

  const rawModifiers = WEATHER_ENGINE_MODIFIERS[weather.type];
  const effectiveModifiers: { stat: string; modifier: number }[] = [];

  // Apply mitigation based on preparation choice
  let mitigationFactor = 1.0;
  if (preparation === 'adapt') mitigationFactor = 0.5;   // 50% mitigation
  else if (preparation === 'ignore') mitigationFactor = 1.3; // 30% worse

  const modifiedAttrs = { ...player.attributes };
  let modifiedFitness = player.fitness;

  for (const mod of rawModifiers) {
    const effectiveMod = Math.round(mod.modifier * mitigationFactor);
    effectiveModifiers.push({ stat: mod.stat, modifier: effectiveMod });

    if (mod.stat === 'fatigue') {
      // Fatigue is handled separately as a fitness penalty
      modifiedFitness = Math.max(0, modifiedFitness - effectiveMod * 0.5);
    } else {
      // Apply as a multiplier to the relevant attribute
      const attr = mod.stat as keyof PlayerAttributes;
      const currentValue = modifiedAttrs[attr] ?? 0;
      const modified = Math.max(1, Math.round(currentValue * (1 + effectiveMod / 100)));
      modifiedAttrs[attr] = modified;
    }
  }

  return {
    modifiedPlayer: {
      ...player,
      attributes: modifiedAttrs,
      fitness: Math.max(0, Math.min(100, modifiedFitness)),
    },
    effectiveModifiers,
  };
}

// --- Calculate player match contribution ---
function playerContribution(player: Player): number {
  if (player.injuryWeeks > 0) return 0;

  const weights = POSITION_ATTRIBUTE_WEIGHTS[player.position];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [attr, weight] of Object.entries(weights)) {
    const w = weight as number;
    weightedSum += (player.attributes[attr as keyof PlayerAttributes] ?? 0) * w;
    totalWeight += w;
  }

  const baseContribution = totalWeight > 0 ? weightedSum / totalWeight : player.overall;

  // Fitness modifier
  const fitnessMod = player.fitness >= 85 ? 1.05 : player.fitness >= 70 ? 1.0 : player.fitness >= 50 ? 0.9 : 0.7;

  // Form modifier
  const formMod = player.form >= 7.5 ? 1.1 : player.form >= 6.0 ? 1.0 : player.form >= 4.5 ? 0.92 : 0.8;

  // Morale modifier
  const moraleMod = player.morale >= 75 ? 1.05 : player.morale >= 50 ? 1.0 : 0.92;

  return baseContribution * fitnessMod * formMod * moraleMod;
}

// --- Determine match tempo and style ---
function determineMatchTempo(homeStyle: Club['style'], awayStyle: Club['style']): {
  goalRate: number;
  cardRate: number;
  injuryRate: number;
  chanceRate: number;
} {
  // More attacking = more goals
  const attackingFactor = (homeStyle.attacking + awayStyle.attacking) / 200;
  // More pressing = more cards and injuries
  const pressingFactor = (homeStyle.pressing + awayStyle.pressing) / 200;
  // More defensive = fewer goals
  const defensiveFactor = (homeStyle.defensive + awayStyle.defensive) / 200;

  const goalRate = 0.02 + attackingFactor * 0.015 - defensiveFactor * 0.008;
  const cardRate = 0.008 + pressingFactor * 0.008;
  const injuryRate = 0.002 + pressingFactor * 0.003;
  const chanceRate = 0.04 + attackingFactor * 0.02;

  return { goalRate, cardRate, injuryRate, chanceRate };
}

// --- Simulate a single minute ---
export function simulateMatchMinute(
  homeClub: Club,
  awayClub: Club,
  player: Player,
  minute: number,
  state: MatchState,
  weather?: WeatherCondition | null
): MatchEvent[] {
  const events: MatchEvent[] = [];
  const tempo = determineMatchTempo(homeClub.style, awayClub.style);

  // Weather affects overall match tempo
  const weatherType = weather?.type;
  const isSevereWeather = weatherType === 'stormy' || weatherType === 'snowy' || weatherType === 'hot';
  const weatherTempoMod = isSevereWeather ? 0.85 : (weatherType === 'rainy' || weatherType === 'windy') ? 0.92 : 1.0;

  // Weather commentary at random intervals
  if (weather && weatherType && weatherType !== 'sunny' && weatherType !== 'cloudy' && WEATHER_COMMENTARY[weatherType]) {
    const commentaries = WEATHER_COMMENTARY[weatherType];
    if (rng() < 0.015 && commentaries.length > 0) {
      events.push({
        minute,
        type: 'weather' as MatchEventType,
        team: 'neutral',
        detail: commentaries[Math.floor(rng() * commentaries.length)],
      });
    }
  }

  // Home advantage
  const homeAdvantage = 1.1;

  // Quality differential influences momentum
  const homeQuality = clubMatchQuality(homeClub) * homeAdvantage + state.homeMomentum * 0.3;
  const awayQuality = clubMatchQuality(awayClub) + state.awayMomentum * 0.3;

  const totalQuality = homeQuality + awayQuality;
  const homeProb = homeQuality / totalQuality;
  const awayProb = awayQuality / totalQuality;

  // Momentum shifts - more likely after goals or late in halves
  if (minute === 45 || minute === 90) {
    // End of half - slight momentum reset
    state.homeMomentum *= 0.5;
    state.awayMomentum *= 0.5;
  }

  // Random momentum fluctuation
  if (rng() < 0.05) {
    const shift = (rng() - 0.5) * 4;
    if (rng() < homeProb) {
      state.homeMomentum = clamp(state.homeMomentum + shift, -5, 10);
    } else {
      state.awayMomentum = clamp(state.awayMomentum + shift, -5, 10);
    }
  }

  // --- Goal probability per minute (modified by weather) ---
  const goalProb = tempo.goalRate * weatherTempoMod * (1 + (state.homeMomentum + state.awayMomentum) * 0.03);

  if (rng() < goalProb) {
    const isHome = rng() < homeProb;
    const team: 'home' | 'away' = isHome ? 'home' : 'away';

    // Is the player involved?
    const playerTeam = state.playerTeam;
    const playerContributionValue = playerContribution(player);
    const playerGoalProb = POSITION_GOAL_PROB[player.position] *
      (playerContributionValue / 100) *
      (player.fitness / 100);

    const isPlayerGoal = team === playerTeam && rng() < playerGoalProb;

    if (isPlayerGoal && state.playerInvolved) {
      state[team === 'home' ? 'homeScore' : 'awayScore']++;
      state.playerHasGoal = true;
      state[team === 'home' ? 'homeMomentum' : 'awayMomentum'] += 2;

      events.push({
        minute,
        type: 'goal',
        team,
        playerName: player.name,
        playerId: player.id,
        detail: `Goal by ${player.name}!`,
      });

      // Assist check
      if (rng() < 0.6) {
        const assistProb = POSITION_ASSIST_PROB[player.position] * (playerContribution(player) / 100);
        if (rng() > assistProb) {
          state.playerHasAssist = true;
          events.push({
            minute,
            type: 'assist',
            team,
            playerName: player.name,
            playerId: player.id,
            detail: `Assist by ${player.name}`,
          });
        }
      }
    } else {
      // NPC goal
      state[team === 'home' ? 'homeScore' : 'awayScore']++;
      state[team === 'home' ? 'homeMomentum' : 'awayMomentum'] += 2;

      const goalScorers = ['Silva', 'Martinez', 'Johnson', 'Müller', 'Santos', 'Kim', 'Okafor', 'Petrov'];
      const scorer = goalScorers[randInt(0, goalScorers.length - 1)];

      events.push({
        minute,
        type: 'goal',
        team,
        playerName: scorer,
        detail: `Goal by ${scorer}!`,
      });
    }
  }

  // --- Chance probability ---
  if (rng() < tempo.chanceRate && events.length === 0) {
    const isHome = rng() < homeProb;
    const team: 'home' | 'away' = isHome ? 'home' : 'away';

    // Is it the player's chance?
    const playerChanceProb = POSITION_GOAL_PROB[player.position] * (playerContribution(player) / 100) * 0.3;

    if (team === state.playerTeam && rng() < playerChanceProb && state.playerInvolved) {
      events.push({
        minute,
        type: rng() < 0.3 ? 'save' : 'chance',
        team,
        playerName: player.name,
        playerId: player.id,
        detail: rng() < 0.3 ? `Shot saved from ${player.name}` : `Chance for ${player.name}`,
      });
    } else {
      events.push({
        minute,
        type: rng() < 0.4 ? 'save' : 'chance',
        team,
        detail: rng() < 0.4 ? 'Brilliant save by the keeper!' : 'Great chance goes wide!',
      });
    }
  }

  // --- Card probability ---
  if (rng() < tempo.cardRate) {
    const isHome = rng() < homeProb;
    const team: 'home' | 'away' = isHome ? 'home' : 'away';

    const cardType: MatchEventType = rng() < 0.92 ? 'yellow_card' : 'red_card';

    // Player involvement in cards - midfielders/defenders more likely
    const playerCardProb = (player.position === 'CDM' || player.position === 'CB' || player.position === 'CM')
      ? 0.15
      : 0.05;

    if (team === state.playerTeam && rng() < playerCardProb && state.playerInvolved) {
      events.push({
        minute,
        type: cardType,
        team,
        playerName: player.name,
        playerId: player.id,
        detail: cardType === 'yellow_card'
          ? `Yellow card for ${player.name}`
          : `Red card for ${player.name}!`,
      });
    } else {
      const cardPlayers = ['Fernandes', 'Kone', 'Weber', 'Tanaka', 'Diallo'];
      events.push({
        minute,
        type: cardType,
        team,
        playerName: cardPlayers[randInt(0, cardPlayers.length - 1)],
        detail: cardType === 'yellow_card' ? 'Yellow card shown' : 'Red card! Player sent off!',
      });
    }
  }

  // --- Injury probability ---
  if (rng() < tempo.injuryRate) {
    const isHome = rng() < homeProb;
    const team: 'home' | 'away' = isHome ? 'home' : 'away';

    // Player injury risk - increases with low fitness
    const playerInjuryRisk = (100 - player.fitness) / 500;

    if (team === state.playerTeam && rng() < playerInjuryRisk && state.playerInvolved) {
      events.push({
        minute,
        type: 'injury',
        team,
        playerName: player.name,
        playerId: player.id,
        detail: `${player.name} is down injured!`,
      });
    } else {
      events.push({
        minute,
        type: 'injury',
        team,
        detail: 'Player receives treatment',
      });
    }
  }

  // --- Substitution events (around 60-75 min) ---
  if (minute >= 60 && minute <= 75 && rng() < 0.03) {
    const team: 'home' | 'away' = rng() < homeProb ? 'home' : 'away';
    events.push({
      minute,
      type: 'substitution',
      team,
      detail: 'Tactical substitution',
    });
  }

  // --- Penalty events (rare) ---
  if (rng() < 0.002) {
    const team: 'home' | 'away' = rng() < homeProb ? 'home' : 'away';
    events.push({
      minute,
      type: 'penalty_won',
      team,
      detail: 'Penalty awarded!',
    });

    // 75% chance of scoring the penalty
    if (rng() < 0.75) {
      state[team === 'home' ? 'homeScore' : 'awayScore']++;
      state[team === 'home' ? 'homeMomentum' : 'awayMomentum'] += 3;

      events.push({
        minute,
        type: 'goal',
        team,
        detail: 'Goal from the penalty spot!',
      });
    } else {
      events.push({
        minute,
        type: 'penalty_missed',
        team,
        detail: 'Penalty saved!',
      });
    }
  }

  return events;
}

// --- Calculate player match rating ---
export function calculatePlayerMatchRating(
  player: Player,
  events: MatchEvent[],
  minutesPlayed: number,
  playerTeam: 'home' | 'away' = 'home'
): number {
  if (minutesPlayed === 0) return 0;

  // Base rating from 5.5 to 6.5 depending on overall quality
  let rating = 5.0 + (player.overall / 100) * 1.5;

  // Minutes played factor - full match gets slight boost
  const minutesFactor = minutesPlayed >= 75 ? 1.0 : minutesPlayed >= 45 ? 0.95 : 0.85;
  rating *= minutesFactor;

  // Player-specific events
  const playerEvents = events.filter(
    (e) => e.playerId === player.id
  );

  for (const event of playerEvents) {
    switch (event.type) {
      case 'goal':
        // Goals are worth more for forwards, less for defenders
        if (player.position === 'ST' || player.position === 'LW' || player.position === 'RW') {
          rating += 1.2;
        } else if (player.position === 'CAM' || player.position === 'CM') {
          rating += 1.0;
        } else {
          rating += 0.8;
        }
        break;
      case 'assist':
        rating += 0.6;
        break;
      case 'yellow_card':
        rating -= 0.3;
        break;
      case 'red_card':
        rating -= 1.5;
        break;
      case 'second_yellow':
        rating -= 1.2;
        break;
      case 'chance':
        rating += 0.15;
        break;
      case 'save':
        if (player.position === 'GK') rating += 0.5;
        else rating += 0.1;
        break;
      case 'injury':
        rating -= 0.2;
        break;
      case 'penalty_missed':
        rating -= 0.5;
        break;
    }
  }

  // Clean sheet bonus for defenders and GK
  const opponentTeam = playerTeam === 'home' ? 'away' : 'home';
  const opponentGoals = events.filter(
    (e) => e.type === 'goal' && e.team === opponentTeam
  ).length;

  if (opponentGoals === 0 && POSITION_CLEAN_SHEET_PROB[player.position] > 0.1) {
    rating += 0.3;
  }

  // Team result modifier
  const teamGoals = events.filter(e => e.type === 'goal' && e.team === playerTeam).length;
  const otherGoals = events.filter(e => e.type === 'goal' && e.team === opponentTeam).length;
  const goalDiff = teamGoals - otherGoals;

  if (goalDiff > 2) rating += 0.2;
  else if (goalDiff > 0) rating += 0.1;
  else if (goalDiff < -2) rating -= 0.2;
  else if (goalDiff < 0) rating -= 0.1;

  // Small random variance for realism
  rating += (rng() - 0.5) * 0.4;

  return clamp(Math.round(rating * 10) / 10, 1.0, 10.0);
}

// --- Simulate full match ---
export function simulateMatch(
  homeClub: Club,
  awayClub: Club,
  player: Player,
  competition: string,
  playerTeam: 'home' | 'away' = 'home',
  weather?: WeatherCondition | null,
  weatherPreparation: 'standard' | 'adapt' | 'ignore' = 'standard'
): MatchResult {
  // Determine squad selection based on which team the player is on
  const playerClub = playerTeam === 'home' ? homeClub : awayClub;

  // Apply weather modifiers to player
  const { modifiedPlayer: weatherPlayer } = applyWeatherToPlayer(player, weather ?? null, weatherPreparation);

  const selection = determineSquadSelection(weatherPlayer, playerClub);

  // Initialize match state
  const state: MatchState = {
    homeScore: 0,
    awayScore: 0,
    homeMomentum: 0,
    awayMomentum: 0,
    events: [],
    playerInvolved: selection.starts,
    playerHasGoal: false,
    playerHasAssist: false,
    playerTeam,
  };

  // Simulate each minute
  const allEvents: MatchEvent[] = [];

  for (let minute = 1; minute <= 90; minute++) {
    // Check if player comes on as sub
    if (!selection.starts && !state.playerInvolved) {
      const subMinute = 90 - selection.minutesLikely;
      if (minute >= subMinute && rng() < 0.3) {
        state.playerInvolved = true;
        allEvents.push({
          minute,
          type: 'substitution',
          team: playerTeam,
          playerName: player.name,
          playerId: player.id,
          detail: `${player.name} comes on as substitute`,
        });
      }
    }

    // If player is starting but low fitness, might get subbed off
    if (selection.starts && state.playerInvolved && player.fitness < 70 && minute >= 60) {
      if (rng() < 0.05) {
        state.playerInvolved = false;
        allEvents.push({
          minute,
          type: 'substitution',
          team: playerTeam,
          playerName: player.name,
          playerId: player.id,
          detail: `${player.name} is taken off`,
        });
      }
    }

    const minuteEvents = simulateMatchMinute(homeClub, awayClub, weatherPlayer, minute, state, weather ?? null);
    allEvents.push(...minuteEvents);
  }

  // Calculate player minutes
  let playerMinutes = 0;
  if (selection.starts) {
    const subOff = allEvents.find(
      (e) => e.type === 'substitution' && e.playerId === player.id && e.detail?.includes('taken off')
    );
    playerMinutes = subOff ? subOff.minute : 90;
  } else {
    const subOn = allEvents.find(
      (e) => e.type === 'substitution' && e.playerId === player.id && e.detail?.includes('comes on')
    );
    playerMinutes = subOn ? 90 - subOn.minute : 0;
  }

  // Calculate player rating
  const playerRating = calculatePlayerMatchRating(weatherPlayer, allEvents, playerMinutes, playerTeam);

  // Injury check after match
  const injuryEvent = allEvents.find(
    (e) => e.type === 'injury' && e.playerId === player.id
  );

  // Add post-match events for injuries
  if (injuryEvent) {
    // Injury will be processed by the progression engine
    allEvents.push({
      minute: 91,
      type: 'injury',
      team: playerTeam,
      playerName: player.name,
      playerId: player.id,
      detail: `${player.name} will need medical assessment after the match`,
    });
  }

  // Count player goals and assists from events
  const playerGoals = allEvents.filter(
    (e) => e.type === 'goal' && e.playerId === player.id
  ).length;
  const playerAssists = allEvents.filter(
    (e) => e.type === 'assist' && e.playerId === player.id
  ).length;

  return {
    homeClub,
    awayClub,
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    events: allEvents,
    playerRating,
    playerMinutesPlayed: playerMinutes,
    playerStarted: selection.starts,
    playerGoals,
    playerAssists,
    competition,
    week: 0, // will be set by caller
    season: 0, // will be set by caller
  };
}

// --- Helper: get realistic scoreline probability ---
export function getScorelineProbability(
  homeQuality: number,
  awayQuality: number
): { homeGoals: number; awayGoals: number; probability: number }[] {
  const diff = homeQuality - awayQuality;
  const results: { homeGoals: number; awayGoals: number; probability: number }[] = [];

  const scorelines = [
    [0, 0], [1, 0], [0, 1], [1, 1], [2, 0], [0, 2],
    [2, 1], [1, 2], [2, 2], [3, 0], [0, 3], [3, 1],
    [1, 3], [3, 2], [2, 3], [4, 0], [0, 4], [4, 1],
    [1, 4], [3, 3], [4, 2], [2, 4], [5, 0], [0, 5],
  ];

  for (const [h, a] of scorelines) {
    // Base probability from Poisson-like distribution
    let prob = Math.exp(-2.5) * Math.pow(2.5, h) / factorial(h) *
               Math.exp(-1.8) * Math.pow(1.8, a) / factorial(a);

    // Adjust for quality differential
    const goalDiff = h - a;
    if (diff > 10 && goalDiff > 0) prob *= 1.5;
    else if (diff > 5 && goalDiff > 0) prob *= 1.25;
    else if (diff < -10 && goalDiff < 0) prob *= 1.5;
    else if (diff < -5 && goalDiff < 0) prob *= 1.25;

    results.push({ homeGoals: h, awayGoals: a, probability: prob });
  }

  // Normalize
  const total = results.reduce((sum, r) => sum + r.probability, 0);
  for (const r of results) {
    r.probability /= total;
  }

  return results.sort((a, b) => b.probability - a.probability);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
