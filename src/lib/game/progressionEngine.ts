// ============================================================
// Elite Striker - Player Progression Engine
// Handles player development, aging, training effects,
// and season-over-season progression
// ============================================================

import {
  Player,
  PlayerAttributes,
  SquadStatus,
  TrainingSession,
  SeasonPlayerStats,
  Club,
  Position,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// --- Age-based growth multipliers ---
function getAgeGrowthMultiplier(age: number): { physical: number; technical: number; mental: number } {
  if (age <= 16) return { physical: 1.5, technical: 1.8, mental: 1.6 };
  if (age <= 19) return { physical: 1.4, technical: 1.6, mental: 1.5 };
  if (age <= 21) return { physical: 1.2, technical: 1.3, mental: 1.3 };
  if (age <= 23) return { physical: 1.0, technical: 1.1, mental: 1.2 };
  if (age <= 26) return { physical: 0.8, technical: 0.9, mental: 1.0 };
  if (age <= 29) return { physical: 0.5, technical: 0.7, mental: 0.9 };
  if (age <= 31) return { physical: 0.1, technical: 0.4, mental: 0.6 };
  if (age <= 33) return { physical: -0.3, technical: 0.1, mental: 0.3 };
  if (age <= 35) return { physical: -0.6, technical: -0.2, mental: 0.1 };
  if (age <= 37) return { physical: -0.9, technical: -0.5, mental: -0.2 };
  return { physical: -1.2, technical: -0.8, mental: -0.4 };
}

// Attribute classification for growth purposes
const PHYSICAL_ATTRS: (keyof PlayerAttributes)[] = ['pace', 'physical'];
const TECHNICAL_ATTRS: (keyof PlayerAttributes)[] = ['shooting', 'passing', 'dribbling'];
const MENTAL_DEFENSIVE_ATTRS: (keyof PlayerAttributes)[] = ['defending'];

function getAttrCategory(attr: keyof PlayerAttributes): 'physical' | 'technical' | 'mental' {
  if (PHYSICAL_ATTRS.includes(attr)) return 'physical';
  if (TECHNICAL_ATTRS.includes(attr)) return 'technical';
  return 'mental';
}

// --- Apply Weekly Progression ---
export function applyWeeklyProgression(
  player: Player,
  trainingSessions: TrainingSession[]
): Partial<Player> {
  const updates: Partial<Player> = {};
  const attrUpdates: Partial<PlayerAttributes> = {};
  const ageMultipliers = getAgeGrowthMultiplier(player.age);

  // Process training sessions
  for (const session of trainingSessions) {
    const intensityFactor = session.intensity / 100;

    switch (session.type) {
      case 'attacking':
        applyTrainingBoost(attrUpdates, 'shooting', 0.15 * intensityFactor, ageMultipliers);
        applyTrainingBoost(attrUpdates, 'dribbling', 0.08 * intensityFactor, ageMultipliers);
        break;
      case 'defensive':
        applyTrainingBoost(attrUpdates, 'defending', 0.15 * intensityFactor, ageMultipliers);
        applyTrainingBoost(attrUpdates, 'passing', 0.05 * intensityFactor, ageMultipliers);
        break;
      case 'physical':
        applyTrainingBoost(attrUpdates, 'pace', 0.12 * intensityFactor, ageMultipliers);
        applyTrainingBoost(attrUpdates, 'physical', 0.12 * intensityFactor, ageMultipliers);
        break;
      case 'technical':
        applyTrainingBoost(attrUpdates, 'dribbling', 0.1 * intensityFactor, ageMultipliers);
        applyTrainingBoost(attrUpdates, 'passing', 0.1 * intensityFactor, ageMultipliers);
        applyTrainingBoost(attrUpdates, 'shooting', 0.05 * intensityFactor, ageMultipliers);
        break;
      case 'tactical':
        applyTrainingBoost(attrUpdates, 'passing', 0.08 * intensityFactor, ageMultipliers);
        applyTrainingBoost(attrUpdates, 'defending', 0.05 * intensityFactor, ageMultipliers);
        break;
      case 'recovery':
        // Recovery doesn't boost attributes but affects fitness
        break;
    }

    // Focused training on specific attribute
    if (session.focusAttribute) {
      applyTrainingBoost(attrUpdates, session.focusAttribute, 0.2 * intensityFactor, ageMultipliers);
    }
  }

  // Natural growth based on age (even without training)
  const naturalGrowthRate = player.age <= 21 ? 0.05 : player.age <= 26 ? 0.02 : 0;
  for (const attr of Object.keys(ageMultipliers) as (keyof PlayerAttributes)[]) {
    if (!attrUpdates[attr]) attrUpdates[attr] = 0;
    const category = getAttrCategory(attr);
    const multiplier = ageMultipliers[category];
    attrUpdates[attr]! += naturalGrowthRate * multiplier;
  }

  // Apply attribute updates (rounded to 1 decimal)
  if (Object.keys(attrUpdates).length > 0) {
    const newAttrs = { ...player.attributes };
    for (const [key, value] of Object.entries(attrUpdates)) {
      if (value !== undefined) {
        newAttrs[key as keyof PlayerAttributes] = clamp(
          Math.round((newAttrs[key as keyof PlayerAttributes] + value) * 10) / 10,
          1,
          99
        );
      }
    }
    updates.attributes = newAttrs;

    // Recalculate overall
    updates.overall = calculateOverall(newAttrs, player.position);
  }

  // Fitness regeneration
  const recoveryTraining = trainingSessions.filter(t => t.type === 'recovery');
  const baseFitnessRegen = 8;
  const recoveryBonus = recoveryTraining.length * 5;
  const currentFitness = player.fitness;

  // Fitness regenerates more slowly if already high
  const fitnessDiminishing = currentFitness > 85 ? 0.5 : currentFitness > 70 ? 0.8 : 1.0;

  updates.fitness = clamp(
    Math.round(currentFitness + (baseFitnessRegen + recoveryBonus) * fitnessDiminishing),
    0,
    100
  );

  // Morale drift toward neutral (55)
  const moraleDrift = (55 - player.morale) * 0.05;
  updates.morale = clamp(
    Math.round(player.morale + moraleDrift),
    0,
    100
  );

  // Injury recovery
  if (player.injuryWeeks > 0) {
    updates.injuryWeeks = player.injuryWeeks - 1;
    // Fitness doesn't regen as fast while injured
    updates.fitness = clamp(
      Math.round(player.fitness + 3),
      0,
      100
    );
  }

  return updates;
}

function applyTrainingBoost(
  attrUpdates: Partial<PlayerAttributes>,
  attr: keyof PlayerAttributes,
  baseAmount: number,
  ageMultipliers: { physical: number; technical: number; mental: number }
): void {
  if (!attrUpdates[attr]) attrUpdates[attr] = 0;
  const category = getAttrCategory(attr);
  const multiplier = ageMultipliers[category];

  // If multiplier is negative (decline age), training can still slow the decline
  if (multiplier >= 0) {
    attrUpdates[attr]! += baseAmount * multiplier;
  } else {
    // Training reduces decline but doesn't reverse it at old age
    attrUpdates[attr]! += baseAmount * 0.3 + multiplier * 0.1;
  }
}

// --- Calculate Overall Rating ---
export function calculateOverall(attributes: PlayerAttributes, position: Position): number {
  const weights: Record<Position, Record<keyof PlayerAttributes, number>> = {
    GK:  { pace: 0.1, shooting: 0.02, passing: 0.1, dribbling: 0.03, defending: 0.4, physical: 0.35 },
    CB:  { pace: 0.12, shooting: 0.03, passing: 0.1, dribbling: 0.05, defending: 0.4, physical: 0.3 },
    LB:  { pace: 0.22, shooting: 0.04, passing: 0.15, dribbling: 0.1, defending: 0.29, physical: 0.2 },
    RB:  { pace: 0.22, shooting: 0.04, passing: 0.15, dribbling: 0.1, defending: 0.29, physical: 0.2 },
    CDM: { pace: 0.08, shooting: 0.05, passing: 0.25, dribbling: 0.07, defending: 0.35, physical: 0.2 },
    CM:  { pace: 0.1, shooting: 0.1, passing: 0.3, dribbling: 0.15, defending: 0.15, physical: 0.2 },
    CAM: { pace: 0.1, shooting: 0.2, passing: 0.28, dribbling: 0.22, defending: 0.05, physical: 0.15 },
    LW:  { pace: 0.25, shooting: 0.2, passing: 0.12, dribbling: 0.23, defending: 0.03, physical: 0.17 },
    RW:  { pace: 0.25, shooting: 0.2, passing: 0.12, dribbling: 0.23, defending: 0.03, physical: 0.17 },
    ST:  { pace: 0.18, shooting: 0.35, passing: 0.07, dribbling: 0.2, defending: 0.02, physical: 0.18 },
  };

  const posWeights = weights[position];
  let overall = 0;
  for (const [attr, weight] of Object.entries(posWeights)) {
    overall += attributes[attr as keyof PlayerAttributes] * weight;
  }

  return clamp(Math.round(overall), 1, 99);
}

// --- Apply Season Progression ---
export function applySeasonProgression(
  player: Player,
  seasonStats: SeasonPlayerStats
): Partial<Player> {
  const updates: Partial<Player> = {};
  const attrUpdates: Partial<PlayerAttributes> = {};
  const ageMultipliers = getAgeGrowthMultiplier(player.age);

  // Match experience bonus - more appearances = more growth
  const experienceBonus = Math.min(seasonStats.appearances / 30, 1.0); // cap at 30 appearances
  const ratingBonus = seasonStats.averageRating >= 7.0 ? 1.3 : seasonStats.averageRating >= 6.0 ? 1.0 : 0.7;

  // Position-specific season growth
  const seasonGrowthBase = 0.5 * experienceBonus * ratingBonus;

  if (['ST', 'LW', 'RW'].includes(player.position)) {
    attrUpdates.shooting = seasonGrowthBase * 1.2 * ageMultipliers.technical;
    attrUpdates.dribbling = seasonGrowthBase * 0.8 * ageMultipliers.technical;
    attrUpdates.pace = seasonGrowthBase * 0.5 * ageMultipliers.physical;
  } else if (['CAM', 'CM'].includes(player.position)) {
    attrUpdates.passing = seasonGrowthBase * 1.2 * ageMultipliers.technical;
    attrUpdates.dribbling = seasonGrowthBase * 0.8 * ageMultipliers.technical;
    attrUpdates.shooting = seasonGrowthBase * 0.5 * ageMultipliers.technical;
  } else if (['CDM', 'CB'].includes(player.position)) {
    attrUpdates.defending = seasonGrowthBase * 1.2 * ageMultipliers.mental;
    attrUpdates.physical = seasonGrowthBase * 0.8 * ageMultipliers.physical;
    attrUpdates.passing = seasonGrowthBase * 0.5 * ageMultipliers.technical;
  } else if (['LB', 'RB'].includes(player.position)) {
    attrUpdates.pace = seasonGrowthBase * 0.8 * ageMultipliers.physical;
    attrUpdates.defending = seasonGrowthBase * 1.0 * ageMultipliers.mental;
    attrUpdates.passing = seasonGrowthBase * 0.6 * ageMultipliers.technical;
  } else if (player.position === 'GK') {
    attrUpdates.defending = seasonGrowthBase * 1.0 * ageMultipliers.mental;
    attrUpdates.physical = seasonGrowthBase * 0.8 * ageMultipliers.physical;
    attrUpdates.passing = seasonGrowthBase * 0.4 * ageMultipliers.technical;
  }

  // Apply age decline
  const decline = calculateAgeDecline(player.age, player.attributes);
  for (const [key, value] of Object.entries(decline)) {
    if (value !== undefined) {
      if (!attrUpdates[key as keyof PlayerAttributes]) attrUpdates[key as keyof PlayerAttributes] = 0;
      attrUpdates[key as keyof PlayerAttributes]! += value;
    }
  }

  // Apply attribute updates
  const newAttrs = { ...player.attributes };
  for (const [key, value] of Object.entries(attrUpdates)) {
    if (value !== undefined) {
      newAttrs[key as keyof PlayerAttributes] = clamp(
        Math.round((newAttrs[key as keyof PlayerAttributes] + value) * 10) / 10,
        1,
        99
      );
    }
  }
  updates.attributes = newAttrs;
  updates.overall = calculateOverall(newAttrs, player.position);

  // Potential growth - young players' potential can increase
  const potentialGrowth = calculatePotentialGrowth(player);
  if (potentialGrowth > 0) {
    updates.potential = clamp(player.potential + potentialGrowth, player.overall, 99);
  }

  // Market value update based on season performance
  const valueMultiplier = seasonStats.averageRating >= 7.5 ? 1.3 :
                          seasonStats.averageRating >= 6.5 ? 1.1 :
                          seasonStats.averageRating >= 5.5 ? 1.0 : 0.85;
  updates.marketValue = Math.round(player.marketValue * valueMultiplier);

  // Age affects market value significantly
  if (player.age >= 30) updates.marketValue = Math.round(updates.marketValue * 0.85);
  else if (player.age >= 33) updates.marketValue = Math.round(updates.marketValue * 0.7);

  // Contract year - decrease if expiring
  if (player.contract.yearsRemaining <= 1) {
    updates.marketValue = Math.round((updates.marketValue ?? player.marketValue) * 0.8);
  }

  return updates;
}

// --- Calculate Age Decline ---
export function calculateAgeDecline(
  age: number,
  attributes: PlayerAttributes
): Partial<PlayerAttributes> {
  const decline: Partial<PlayerAttributes> = {};

  if (age < 30) return decline;

  // Decline accelerates with age
  const declineRates: Record<number, { physical: number; technical: number; mental: number }> = {
    30: { physical: 1.5, technical: 0.3, mental: 0 },
    31: { physical: 2.0, technical: 0.5, mental: 0 },
    32: { physical: 2.5, technical: 0.8, mental: 0.1 },
    33: { physical: 3.5, technical: 1.2, mental: 0.3 },
    34: { physical: 4.5, technical: 1.8, mental: 0.5 },
    35: { physical: 5.5, technical: 2.5, mental: 0.8 },
    36: { physical: 7.0, technical: 3.5, mental: 1.2 },
    37: { physical: 8.5, technical: 4.5, mental: 1.8 },
  };

  const rates = declineRates[age] || { physical: 10, technical: 6, mental: 3 };

  // Physical attributes decline fastest
  decline.pace = -rates.physical;
  decline.physical = -rates.physical * 0.8;

  // Technical attributes decline slower
  decline.shooting = -rates.technical * 0.7;
  decline.passing = -rates.technical * 0.5;
  decline.dribbling = -rates.technical * 0.6;

  // Defending/mental decline slowest
  decline.defending = -rates.mental * 0.8;

  return decline;
}

// --- Calculate Potential Growth ---
export function calculatePotentialGrowth(player: Player): number {
  // Young players with high potential room can still grow their potential
  const potentialRoom = player.potential - player.overall;

  if (player.age <= 18) {
    // Wonderkids can see potential increase
    if (potentialRoom >= 15) return Math.random() < 0.3 ? randInt(1, 3) : 0;
    if (potentialRoom >= 10) return Math.random() < 0.2 ? randInt(1, 2) : 0;
    return 0;
  }

  if (player.age <= 21) {
    if (potentialRoom >= 15) return Math.random() < 0.2 ? randInt(1, 2) : 0;
    if (potentialRoom >= 10) return Math.random() < 0.15 ? 1 : 0;
    return 0;
  }

  if (player.age <= 24) {
    if (potentialRoom >= 15) return Math.random() < 0.1 ? 1 : 0;
    return 0;
  }

  // After 25, potential generally doesn't increase
  // But "late bloomer" trait can override
  if (player.traits.includes('late_bloomer') && player.age <= 28) {
    return Math.random() < 0.15 ? 1 : 0;
  }

  return 0;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Determine Squad Status Update ---
export function determineSquadStatusUpdate(
  player: Player,
  club: Club
): Player['squadStatus'] {
  const qualityDiff = player.overall - club.quality;

  // Injured players maintain their status but can't play
  if (player.injuryWeeks > 4) {
    return player.squadStatus; // maintain current status
  }

  // Based on quality relative to team
  if (qualityDiff >= 12) return 'starter';
  if (qualityDiff >= 5) return Math.random() < 0.7 ? 'starter' : 'rotation';
  if (qualityDiff >= 0) return Math.random() < 0.4 ? 'starter' : Math.random() < 0.6 ? 'rotation' : 'bench';
  if (qualityDiff >= -5) return Math.random() < 0.2 ? 'rotation' : Math.random() < 0.5 ? 'bench' : 'prospect';
  if (qualityDiff >= -10) return Math.random() < 0.3 ? 'bench' : 'prospect';

  // Much worse than team - consider loan or transfer
  if (player.age <= 21) return Math.random() < 0.6 ? 'loan' : 'prospect';
  return Math.random() < 0.4 ? 'transfer_listed' : 'bench';
}

// --- Update Form ---
export function updateForm(player: Player, recentRatings: number[]): number {
  // Form is rolling average of last 5 match ratings
  const relevantRatings = recentRatings.slice(-5);

  if (relevantRatings.length === 0) return player.form;

  const average = relevantRatings.reduce((sum, r) => sum + r, 0) / relevantRatings.length;

  // Weight recent matches more heavily
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < relevantRatings.length; i++) {
    const weight = 1 + i * 0.2; // most recent = highest weight
    weightedSum += relevantRatings[i] * weight;
    totalWeight += weight;
  }

  const weightedAvg = weightedSum / totalWeight;

  // Smooth transition - don't jump too much
  const currentForm = player.form;
  const newForm = currentForm * 0.3 + weightedAvg * 0.7;

  return clamp(Math.round(newForm * 10) / 10, 1.0, 10.0);
}

// --- Apply Injury Recovery ---
export function applyInjuryRecovery(
  player: Player,
  weeksOut: number
): Partial<Player> {
  const updates: Partial<Player> = {};

  // Fitness takes a hit based on injury length
  const fitnessLoss = Math.min(weeksOut * 3, 40);
  updates.fitness = clamp(player.fitness - fitnessLoss + weeksOut * 2, 20, 100);

  // Morale dip from injury
  updates.morale = clamp(player.morale - Math.min(weeksOut * 2, 20), 10, 100);

  // Form deterioration from inactivity
  if (weeksOut >= 4) {
    updates.form = clamp(player.form - 1.0, 1.0, 10.0);
  } else if (weeksOut >= 2) {
    updates.form = clamp(player.form - 0.5, 1.0, 10.0);
  }

  // Injury prone trait increases future risk (tracked via injuryHistory)
  // Physical attributes may take a small hit for serious injuries
  if (weeksOut >= 8) {
    const newAttrs = { ...player.attributes };
    newAttrs.pace = clamp(newAttrs.pace - 1, 1, 99);
    newAttrs.physical = clamp(newAttrs.physical - 0.5, 1, 99);
    updates.attributes = newAttrs;
    updates.overall = calculateOverall(newAttrs, player.position);
  }

  return updates;
}

// --- Calculate Birthday Effects ---
export function calculateBirthdayEffects(
  player: Player,
  newAge: number
): Partial<Player> {
  const updates: Partial<Player> = {};

  // Market value adjustments based on age milestones
  if (newAge === 24) {
    // Peak value age - slight boost
    updates.marketValue = Math.round(player.marketValue * 1.05);
  } else if (newAge === 30) {
    // Significant value drop at 30
    updates.marketValue = Math.round(player.marketValue * 0.85);
  } else if (newAge === 33) {
    // Another drop
    updates.marketValue = Math.round(player.marketValue * 0.7);
  }

  // Age-related attribute changes are handled by calculateAgeDecline
  // But we add the one-time age-up effects here
  const decline = calculateAgeDecline(newAge, player.attributes);
  if (Object.values(decline).some(v => v !== undefined && v < 0)) {
    const newAttrs = { ...player.attributes };
    for (const [key, value] of Object.entries(decline)) {
      if (value !== undefined) {
        newAttrs[key as keyof PlayerAttributes] = clamp(
          Math.round((newAttrs[key as keyof PlayerAttributes] + value) * 10) / 10,
          1,
          99
        );
      }
    }
    updates.attributes = newAttrs;
    updates.overall = calculateOverall(newAttrs, player.position);
  }

  // Young player potential boost on birthday
  if (newAge <= 19) {
    const potentialGrowth = Math.random() < 0.25 ? randInt(1, 2) : 0;
    if (potentialGrowth > 0) {
      updates.potential = clamp(player.potential + potentialGrowth, player.overall + 1, 99);
    }
  }

  // Squad status reconsideration at certain ages
  if (newAge === 19 || newAge === 21) {
    // Check if should move from prospect to more active status
    if (player.squadStatus === 'prospect' && player.overall >= 65) {
      updates.squadStatus = 'rotation';
    }
  }

  // Reputation changes with age
  if (newAge <= 23 && player.overall >= 80) {
    // Young high-rated players gain reputation fast
    updates.reputation = clamp(player.reputation + 3, 0, 100);
  } else if (newAge >= 35) {
    // Veteran status - reputation might actually increase even as skills decline
    updates.reputation = clamp(player.reputation + 1, 0, 100);
  }

  return updates;
}
