// ============================================================
// Elite Striker - Legacy Engine
// Handles retirement, legacy tracking, and Hall of Fame
// ============================================================

import { generateId } from './gameUtils';

export type RetirementReason = 'age' | 'injury' | 'personal' | 'forced';
export type LegacyTier = 'legend' | 'icon' | 'star' | 'notable' | 'forgotten';
export type CareerHighlightType = 'trophy' | 'record' | 'milestone' | 'award' | 'memorable_match';

export interface CareerHighlight {
  id: string;
  type: CareerHighlightType;
  title: string;
  description: string;
  season: number;
  week?: number;
  icon: string;
  stats?: Record<string, number | string>;
}

export interface CareerStat {
  label: string;
  value: number | string;
  category: 'appearance' | 'goal' | 'trophy' | 'award' | 'record';
}

export interface RetiredPlayer {
  id: string;
  name: string;
  position: string;
  nationality: string;
  retiredAt: string; // ISO date
  age: number;
  reason: RetirementReason;
  
  // Career Summary
  totalSeasons: number;
  totalAppearances: number;
  totalGoals: number;
  totalAssists: number;
  totalTrophies: number;
  totalAwards: number;
  
  // Club History
  clubsPlayed: Array<{
    clubName: string;
    seasons: number;
    appearances: number;
    goals: number;
    trophies: number;
  }>;
  
  // International Career
  internationalCaps: number;
  internationalGoals: number;
  internationalTrophies: number;
  
  // Records & Achievements
  careerHighlights: CareerHighlight[];
  recordsHeld: string[];
  
  // Legacy
  legacyTier: LegacyTier;
  legacyScore: number; // 0-100
  hallOfFameInducted: boolean;
  retiredJerseyNumber?: number;
  statueUnlocked?: boolean;
  
  // Post-Retirement
  coachingLicense?: boolean;
  punditryOffers?: number;
  ambassadorRole?: boolean;
}

export interface HallOfFameEntry {
  id: string;
  playerId: string;
  playerName: string;
  position: string;
  inductionYear: number;
  legacyTier: LegacyTier;
  legacyScore: number;
  portrait?: string;
  plaque: string;
  careerStats: CareerStat[];
  highlights: CareerHighlight[];
}

export interface RetirementPackage {
  farewellMatch: boolean;
  testimonial: boolean;
  pensionPlan: boolean;
  coachingOffer: boolean;
  ambassadorRole: boolean;
  mediaDeals: number;
}

// ============================================================
// Legacy Calculation Functions
// ============================================================

export function calculateLegacyScore(
  totalSeasons: number,
  totalAppearances: number,
  totalGoals: number,
  totalTrophies: number,
  totalAwards: number,
  internationalCaps: number,
  recordsCount: number
): number {
  let score = 0;
  
  // Longevity (max 15 points)
  score += Math.min(totalSeasons * 1.5, 15);
  
  // Appearances (max 20 points)
  score += Math.min(totalAppearances / 30, 20);
  
  // Goals (max 20 points)
  score += Math.min(totalGoals / 15, 20);
  
  // Trophies (max 25 points)
  score += Math.min(totalTrophies * 2.5, 25);
  
  // Awards (max 10 points)
  score += Math.min(totalAwards * 2, 10);
  
  // International career (max 5 points)
  score += Math.min(internationalCaps / 20, 5);
  
  // Records (max 5 points)
  score += Math.min(recordsCount * 1.5, 5);
  
  return Math.min(Math.round(score), 100);
}

export function determineLegacyTier(legacyScore: number): LegacyTier {
  if (legacyScore >= 90) return 'legend';
  if (legacyScore >= 75) return 'icon';
  if (legacyScore >= 60) return 'star';
  if (legacyScore >= 40) return 'notable';
  return 'forgotten';
}

export function generateRetirementPackage(
  legacyTier: LegacyTier,
  totalSeasons: number,
  popularity: number // 0-100
): RetirementPackage {
  const isHighProfile = legacyTier === 'legend' || legacyTier === 'icon';
  const hasLongCareer = totalSeasons >= 10;
  const isPopular = popularity >= 70;
  
  return {
    farewellMatch: isHighProfile || hasLongCareer,
    testimonial: isHighProfile && isPopular,
    pensionPlan: hasLongCareer || isHighProfile,
    coachingOffer: totalSeasons >= 8,
    ambassadorRole: isHighProfile || isPopular,
    mediaDeals: isPopular ? Math.floor(popularity / 20) : 0,
  };
}

// ============================================================
// Career Highlight Generation
// ============================================================

export function generateCareerHighlights(
  seasons: Array<{
    season: number;
    trophies: string[];
    awards: string[];
    goals: number;
    appearances: number;
    bestMoment?: string;
  }>,
  records: string[]
): CareerHighlight[] {
  const highlights: CareerHighlight[] = [];
  
  seasons.forEach(season => {
    // Trophy wins
    season.trophies.forEach(trophy => {
      highlights.push({
        id: generateId(),
        type: 'trophy',
        title: trophy,
        description: `Won ${trophy} in Season ${season.season}`,
        season: season.season,
        icon: '🏆',
      });
    });
    
    // Individual awards
    season.awards.forEach(award => {
      highlights.push({
        id: generateId(),
        type: 'award',
        title: award,
        description: `Received ${award} in Season ${season.season}`,
        season: season.season,
        icon: '🎖️',
      });
    });
    
    // Goal milestones
    if (season.goals >= 30) {
      highlights.push({
        id: generateId(),
        type: 'milestone',
        title: `${season.goals} Goal Season`,
        description: `Scored ${season.goals} goals in Season ${season.season}`,
        season: season.season,
        icon: '⚽',
        stats: { goals: season.goals },
      });
    }
    
    // Memorable moments
    if (season.bestMoment) {
      highlights.push({
        id: generateId(),
        type: 'memorable_match',
        title: 'Memorable Moment',
        description: season.bestMoment,
        season: season.season,
        icon: '⭐',
      });
    }
  });
  
  // Records
  records.forEach(record => {
    highlights.push({
      id: generateId(),
      type: 'record',
      title: 'Record Holder',
      description: record,
      season: 0,
      icon: '📊',
    });
  });
  
  return highlights.sort((a, b) => b.season - a.season);
}

// ============================================================
// Hall of Fame Functions
// ============================================================

export function createHallOfFameEntry(
  player: RetiredPlayer,
  inductionYear: number
): HallOfFameEntry {
  const plaque = generatePlaqueText(player);
  
  const careerStats: CareerStat[] = [
    { label: 'Total Seasons', value: player.totalSeasons, category: 'appearance' },
    { label: 'Total Appearances', value: player.totalAppearances, category: 'appearance' },
    { label: 'Total Goals', value: player.totalGoals, category: 'goal' },
    { label: 'Total Assists', value: player.totalAssists, category: 'goal' },
    { label: 'Trophies Won', value: player.totalTrophies, category: 'trophy' },
    { label: 'Individual Awards', value: player.totalAwards, category: 'award' },
    { label: 'International Caps', value: player.internationalCaps, category: 'appearance' },
    { label: 'International Goals', value: player.internationalGoals, category: 'goal' },
  ];
  
  return {
    id: generateId(),
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    inductionYear,
    legacyTier: player.legacyTier,
    legacyScore: player.legacyScore,
    plaque,
    careerStats,
    highlights: player.careerHighlights,
  };
}

function generatePlaqueText(player: RetiredPlayer): string {
  const tierText = {
    legend: 'A true legend of the game',
    icon: 'An iconic figure in football history',
    star: 'A shining star who illuminated the pitch',
    notable: 'A notable contributor to the beautiful game',
    forgotten: 'Remembered for their dedication',
  };
  
  return `${tierText[player.legacyTier]}.\n\n` +
    `${player.name} graced our leagues for ${player.totalSeasons} seasons, ` +
    `scoring ${player.totalGoals} goals in ${player.totalAppearances} appearances.\n\n` +
    `With ${player.totalTrophies} trophies and a legacy score of ${player.legacyScore}/100, ` +
    `their contribution to football will never be forgotten.`;
}

// ============================================================
// Retirement Decision Helper
// ============================================================

export interface RetirementFactors {
  age: number;
  injuryCount: number;
  currentForm: number; // 0-100
  morale: number; // 0-100
  familyPressure: number; // 0-100
  offersReceived: number;
  legacyScore: number;
}

export function evaluateRetirementReadiness(factors: RetirementFactors): {
  ready: boolean;
  readinessScore: number;
  recommendation: string;
  factors: string[];
} {
  let score = 0;
  const factorList: string[] = [];
  
  // Age factor (max 25 points)
  if (factors.age >= 35) {
    score += 25;
    factorList.push('Age is a significant factor');
  } else if (factors.age >= 32) {
    score += 15;
    factorList.push('Approaching typical retirement age');
  } else if (factors.age >= 30) {
    score += 5;
    factorList.push('Still in prime years');
  }
  
  // Injury concerns (max 20 points)
  if (factors.injuryCount >= 5) {
    score += 20;
    factorList.push('Multiple injuries affecting career');
  } else if (factors.injuryCount >= 3) {
    score += 12;
    factorList.push('Injury history is concerning');
  }
  
  // Current form (max 15 points)
  if (factors.currentForm < 50) {
    score += 15;
    factorList.push('Current form has declined');
  } else if (factors.currentForm < 65) {
    score += 8;
    factorList.push('Form is inconsistent');
  }
  
  // Morale (max 15 points)
  if (factors.morale < 40) {
    score += 15;
    factorList.push('Low morale suggests burnout');
  } else if (factors.morale < 60) {
    score += 7;
    factorList.push('Morale could be better');
  }
  
  // Family pressure (max 10 points)
  if (factors.familyPressure >= 70) {
    score += 10;
    factorList.push('Strong family pressure to retire');
  } else if (factors.familyPressure >= 50) {
    score += 5;
    factorList.push('Some family concerns');
  }
  
  // Offers (negative - more offers means less ready)
  if (factors.offersReceived === 0) {
    score += 10;
    factorList.push('No active offers received');
  } else if (factors.offersReceived <= 2) {
    score += 3;
    factorList.push('Limited interest from clubs');
  }
  
  // Legacy consideration (if already achieved a lot, more ready)
  if (factors.legacyScore >= 80) {
    score += 5;
    factorList.push('Strong legacy already established');
  }
  
  const readinessScore = Math.min(score, 100);
  const ready = readinessScore >= 60;
  
  let recommendation = '';
  if (readinessScore >= 80) {
    recommendation = 'Strong candidate for retirement. Consider hanging up your boots.';
  } else if (readinessScore >= 60) {
    recommendation = 'Retirement is worth considering. Evaluate your options carefully.';
  } else if (readinessScore >= 40) {
    recommendation = 'You still have some years left. Plan for the future.';
  } else {
    recommendation = 'Focus on your career. Retirement is not urgent.';
  }
  
  return {
    ready,
    readinessScore,
    recommendation,
    factors: factorList,
  };
}

// ============================================================
// Post-Retirement Career Paths
// ============================================================

export type PostRetirementPath = 'coach' | 'pundit' | 'ambassador' | 'business' | 'retired_life';

export interface PostRetirementOutcome {
  path: PostRetirementPath;
  title: string;
  description: string;
  income: number; // annual
  satisfaction: number; // 0-100
  unlocks: string[];
}

export function determinePostRetirementPath(
  legacyTier: LegacyTier,
  coachingLicense: boolean,
  mediaDeals: number,
  ambassadorRole: boolean,
  personality: 'charismatic' | 'tactical' | 'business' | 'private'
): PostRetirementOutcome {
  // Determine most likely path based on attributes
  if (coachingLicense && (personality === 'tactical' || legacyTier === 'legend')) {
    return {
      path: 'coach',
      title: 'Football Coach/Manager',
      description: 'Transition into coaching, passing on your knowledge to the next generation.',
      income: coachingLicense ? 150000 : 80000,
      satisfaction: 85,
      unlocks: ['Coaching Badge', 'Training Ground Access', 'Youth Development Program'],
    };
  }
  
  if (mediaDeals > 0 || personality === 'charismatic') {
    return {
      path: 'pundit',
      title: 'TV Pundit/Commentator',
      description: 'Share your insights with fans through media appearances.',
      income: mediaDeals * 50000,
      satisfaction: 75,
      unlocks: ['Media Pass', 'Studio Access', 'Podcast Deal'],
    };
  }
  
  if (ambassadorRole || legacyTier === 'icon') {
    return {
      path: 'ambassador',
      title: 'Club Ambassador',
      description: 'Represent your former club at events and in community programs.',
      income: 100000,
      satisfaction: 80,
      unlocks: ['VIP Status', 'Community Programs', 'Charity Foundation'],
    };
  }
  
  if (personality === 'business') {
    return {
      path: 'business',
      title: 'Business Entrepreneur',
      description: 'Invest in businesses and build your empire outside of football.',
      income: 200000,
      satisfaction: 70,
      unlocks: ['Business Network', 'Investment Portfolio', 'Brand Deals'],
    };
  }
  
  return {
    path: 'retired_life',
    title: 'Peaceful Retirement',
    description: 'Enjoy a quiet life away from the spotlight with your family.',
    income: 50000,
    satisfaction: 90,
    unlocks: ['Family Time', 'Hobbies', 'Travel Opportunities'],
  };
}
