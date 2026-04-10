// ============================================================
// Elite Striker - Game Utility Functions
// ============================================================

// -----------------------------------------------------------
// Unique ID generator
// -----------------------------------------------------------
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const extraPart = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${randomPart}-${extraPart}`;
}

// -----------------------------------------------------------
// Market value calculation (in millions €)
// Based on overall, age, potential, and reputation
// -----------------------------------------------------------
export function calculateMarketValue(
  overall: number,
  age: number,
  potential: number,
  reputation: number
): number {
  // Base value from overall (exponential scaling)
  const overallBase = Math.pow(overall / 20, 3);

  // Age modifier: peak value at 24-28
  let ageModifier: number;
  if (age <= 18) ageModifier = 0.3;
  else if (age <= 21) ageModifier = 0.6;
  else if (age <= 23) ageModifier = 0.8;
  else if (age <= 28) ageModifier = 1.0;
  else if (age <= 30) ageModifier = 0.85;
  else if (age <= 32) ageModifier = 0.65;
  else if (age <= 34) ageModifier = 0.4;
  else ageModifier = 0.2;

  // Potential premium: higher potential = higher value (especially for young players)
  const potentialGap = Math.max(0, potential - overall);
  const potentialPremium = 1 + (potentialGap / 100) * (age <= 24 ? 2.0 : age <= 28 ? 1.0 : 0.3);

  // Reputation modifier
  const reputationModifier = 0.5 + (reputation / 100) * 0.5;

  const rawValue = overallBase * ageModifier * potentialPremium * reputationModifier;

  // Round to 2 decimal places, minimum 0.1M
  return Math.max(0.1, Math.round(rawValue * 100) / 100);
}

// -----------------------------------------------------------
// Weekly wage calculation (in thousands €)
// Based on overall, club tier, and reputation
// -----------------------------------------------------------
export function calculateWage(
  overall: number,
  tier: number,
  reputation: number
): number {
  // Base wage from overall (exponential)
  const overallBase = Math.pow(overall / 25, 2.5);

  // Tier modifier: higher tier = more money
  const tierModifiers: Record<number, number> = {
    1: 2.0,
    2: 1.2,
    3: 0.7,
    4: 0.4,
    5: 0.2,
  };
  const tierModifier = tierModifiers[tier] ?? 0.3;

  // Reputation modifier
  const reputationModifier = 0.6 + (reputation / 100) * 0.4;

  const rawWage = overallBase * tierModifier * reputationModifier;

  // Round to 1 decimal place, minimum 0.5K
  return Math.max(0.5, Math.round(rawWage * 10) / 10);
}

// -----------------------------------------------------------
// Age group classification
// -----------------------------------------------------------
export function getAgeGroup(age: number): string {
  if (age <= 18) return 'youth';
  if (age <= 22) return 'young';
  if (age <= 29) return 'prime';
  if (age <= 33) return 'experienced';
  return 'veteran';
}

// -----------------------------------------------------------
// Attribute category label and color
// -----------------------------------------------------------
export function getAttributeCategory(value: number): { label: string; color: string } {
  if (value >= 90) return { label: 'World Class', color: '#FFD700' };
  if (value >= 80) return { label: 'Excellent', color: '#22C55E' };
  if (value >= 70) return { label: 'Good', color: '#3B82F6' };
  if (value >= 60) return { label: 'Average', color: '#F59E0B' };
  if (value >= 50) return { label: 'Below Average', color: '#F97316' };
  if (value >= 40) return { label: 'Poor', color: '#EF4444' };
  return { label: 'Very Poor', color: '#991B1B' };
}

// -----------------------------------------------------------
// Form label descriptions
// -----------------------------------------------------------
export function getFormLabel(form: number): string {
  if (form >= 90) return 'On Fire';
  if (form >= 80) return 'Excellent Form';
  if (form >= 70) return 'Good Form';
  if (form >= 60) return 'Decent Form';
  if (form >= 50) return 'Average Form';
  if (form >= 40) return 'Below Par';
  if (form >= 30) return 'Poor Form';
  if (form >= 20) return 'In a Slump';
  return 'Terrible Form';
}

// -----------------------------------------------------------
// Morale label descriptions
// -----------------------------------------------------------
export function getMoraleLabel(morale: number): string {
  if (morale >= 90) return 'Ecstatic';
  if (morale >= 80) return 'Very Happy';
  if (morale >= 70) return 'Happy';
  if (morale >= 60) return 'Satisfied';
  if (morale >= 50) return 'Content';
  if (morale >= 40) return 'Unhappy';
  if (morale >= 30) return 'Frustrated';
  if (morale >= 20) return 'Angry';
  return 'Devastated';
}

// -----------------------------------------------------------
// Format currency values
// -----------------------------------------------------------
export function formatCurrency(value: number, unit: 'M' | 'K'): string {
  if (unit === 'M') {
    if (value >= 100) return `€${value.toFixed(0)}M`;
    if (value >= 10) return `€${value.toFixed(1)}M`;
    return `€${value.toFixed(2)}M`;
  }
  // K unit (weekly wages)
  if (value >= 1000) return `€${(value / 1000).toFixed(1)}M/wk`;
  if (value >= 100) return `€${value.toFixed(0)}K/wk`;
  if (value >= 10) return `€${value.toFixed(1)}K/wk`;
  return `€${value.toFixed(2)}K/wk`;
}

// -----------------------------------------------------------
// Clamp a value between min and max
// -----------------------------------------------------------
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// -----------------------------------------------------------
// Random number between min and max (inclusive)
// -----------------------------------------------------------
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -----------------------------------------------------------
// Random float between min and max
// -----------------------------------------------------------
export function randomFloatBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// -----------------------------------------------------------
// Random choice from an array
// -----------------------------------------------------------
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// -----------------------------------------------------------
// Weighted random choice from an array
// Items with higher weights are more likely to be selected
// -----------------------------------------------------------
export function weightedRandomChoice<T>(items: T[], weights: number[]): T {
  if (items.length === 0) {
    throw new Error('Items array cannot be empty');
  }
  if (items.length !== weights.length) {
    throw new Error('Items and weights arrays must be the same length');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) {
    // Fallback to uniform random if all weights are 0
    return items[Math.floor(Math.random() * items.length)];
  }

  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  // Fallback (should not reach here)
  return items[items.length - 1];
}

// -----------------------------------------------------------
// Season week description
// -----------------------------------------------------------
export function getSeasonWeekDescription(week: number): string {
  if (week <= 4) return 'Pre-Season';
  if (week <= 10) return 'Early Season';
  if (week <= 20) return 'Mid Season';
  if (week <= 30) return 'Late Season';
  if (week <= 36) return 'Title Run-In';
  if (week <= 40) return 'Season Finale';
  return 'Off-Season';
}

// -----------------------------------------------------------
// Match rating description
// -----------------------------------------------------------
export function getMatchRatingLabel(rating: number): string {
  if (rating >= 9.0) return 'World Class';
  if (rating >= 8.5) return 'Outstanding';
  if (rating >= 8.0) return 'Excellent';
  if (rating >= 7.5) return 'Very Good';
  if (rating >= 7.0) return 'Good';
  if (rating >= 6.5) return 'Average';
  if (rating >= 6.0) return 'Below Average';
  if (rating >= 5.0) return 'Poor';
  return 'Terrible';
}

// -----------------------------------------------------------
// Position category grouping
// -----------------------------------------------------------
export function getPositionCategory(position: string): 'goalkeeping' | 'defence' | 'midfield' | 'attack' {
  if (position === 'GK') return 'goalkeeping';
  if (['CB', 'LB', 'RB'].includes(position)) return 'defence';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(position)) return 'midfield';
  return 'attack';
}

// -----------------------------------------------------------
// Get position color for UI
// -----------------------------------------------------------
export function getPositionColor(position: string): string {
  const category = getPositionCategory(position);
  switch (category) {
    case 'goalkeeping': return '#F59E0B'; // amber
    case 'defence': return '#3B82F6';     // blue
    case 'midfield': return '#22C55E';    // green
    case 'attack': return '#EF4444';      // red
  }
}

// -----------------------------------------------------------
// Overall rating color for UI
// -----------------------------------------------------------
export function getOverallColor(overall: number): string {
  if (overall >= 85) return '#22C55E'; // green - elite
  if (overall >= 75) return '#3B82F6'; // blue - great
  if (overall >= 65) return '#F59E0B'; // amber - good
  if (overall >= 55) return '#F97316'; // orange - average
  return '#EF4444';                     // red - poor
}

// -----------------------------------------------------------
// Injury risk description
// -----------------------------------------------------------
export function getInjuryRiskLabel(risk: number): string {
  if (risk >= 80) return 'Very High';
  if (risk >= 60) return 'High';
  if (risk >= 40) return 'Moderate';
  if (risk >= 20) return 'Low';
  return 'Very Low';
}

// -----------------------------------------------------------
// Squad status display
// -----------------------------------------------------------
export function getSquadStatusLabel(status: string): string {
  switch (status) {
    case 'starter': return 'Starter';
    case 'rotation': return 'Rotation';
    case 'bench': return 'Bench';
    case 'prospect': return 'Prospect';
    default: return status;
  }
}

// -----------------------------------------------------------
// Competition display name
// -----------------------------------------------------------
export function getCompetitionName(competition: string): string {
  switch (competition) {
    case 'league': return 'League';
    case 'cup': return 'Cup';
    case 'continental': return 'Champions League';
    case 'friendly': return 'Friendly';
    default: return competition;
  }
}
