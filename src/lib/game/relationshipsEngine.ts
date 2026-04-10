// ============================================================
// Elite Striker - Relationships Engine
// Manages player relationships, team dynamics, and interactions
// ============================================================

import {
  Relationship,
  RelationshipType,
  RelationshipLevel,
  TeamDynamics,
  Club,
  Player,
  MatchResult,
  Position,
} from './types';
import { generateId, randomBetween, clamp } from './gameUtils';
import { generatePlayerName } from './playerData';

// --- Personality traits for NPCs ---
const PERSONALITY_TRAITS = [
  'supportive',
  'competitive',
  'jealous',
  'loyal',
  'ambitious',
  'relaxed',
] as const;

type PersonalityTrait = (typeof PERSONALITY_TRAITS)[number];

// --- Name pools by country for teammate generation ---
const COUNTRY_NAME_MAP: Record<string, string[]> = {
  England: ['England'],
  Spain: ['Spain'],
  Italy: ['Italy'],
  Germany: ['Germany'],
  France: ['France'],
};

// --- Helper: Generate a teammate name based on club country ---
export function generateTeammateName(clubCountry: string): string {
  const nationality =
    COUNTRY_NAME_MAP[clubCountry]?.[Math.floor(Math.random() * COUNTRY_NAME_MAP[clubCountry].length)] ??
    clubCountry;
  // Use the existing player name generator
  const { firstName, lastName } = generatePlayerName(nationality);
  return `${firstName} ${lastName}`;
}

// --- Helper: Map affinity (0-100) to RelationshipLevel ---
export function getRelationshipLevel(affinity: number): RelationshipLevel {
  if (affinity >= 90) return 'legendary';
  if (affinity >= 75) return 'close';
  if (affinity >= 55) return 'friendly';
  if (affinity >= 35) return 'neutral';
  if (affinity >= 15) return 'cold';
  return 'hostile';
}

// --- Helper: Color for affinity display ---
export function getAffinityColor(affinity: number): string {
  if (affinity >= 85) return 'text-amber-400';
  if (affinity >= 70) return 'text-emerald-400';
  if (affinity >= 50) return 'text-slate-300';
  if (affinity >= 25) return 'text-orange-400';
  return 'text-red-400';
}

// --- Helper: Affinity bar background color ---
export function getAffinityBarColor(affinity: number): string {
  if (affinity >= 85) return 'bg-amber-500';
  if (affinity >= 70) return 'bg-emerald-500';
  if (affinity >= 50) return 'bg-slate-500';
  if (affinity >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

// --- Helper: Atmosphere label for UI ---
export function getAtmosphereLabel(
  atmosphere: string
): { label: string; color: string; icon: string } {
  switch (atmosphere) {
    case 'toxic':
      return { label: 'Toxic', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: '☠️' };
    case 'tense':
      return { label: 'Tense', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: '⚡' };
    case 'neutral':
      return { label: 'Neutral', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: '😐' };
    case 'positive':
      return { label: 'Positive', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: '✨' };
    case 'excellent':
      return { label: 'Excellent', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: '🌟' };
    default:
      return { label: 'Neutral', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: '😐' };
  }
}

// --- Helper: Random position for teammates (excluding GK mostly) ---
function randomTeammatePosition(): Position {
  const positions: Position[] = ['CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
  return positions[Math.floor(Math.random() * positions.length)];
}

// --- Helper: Random personality trait ---
function randomTrait(): PersonalityTrait {
  return PERSONALITY_TRAITS[Math.floor(Math.random() * PERSONALITY_TRAITS.length)];
}

// --- Generate initial relationships for a new career ---
export function generateInitialRelationships(
  club: Club,
  player: Player
): Relationship[] {
  const relationships: Relationship[] = [];

  // 1. Always a coach
  const coachAffinity = Math.round(randomBetween(60, 80) + (club.reputation > 70 ? 5 : 0));
  relationships.push({
    id: generateId(),
    name: `Coach ${generateTeammateName(club.country).split(' ').pop()}`,
    type: 'coach',
    level: getRelationshipLevel(coachAffinity),
    affinity: clamp(coachAffinity, 0, 100),
    history: ['Appointed as head coach'],
    clubId: club.id,
    trait: Math.random() < 0.5 ? 'ambitious' : 'supportive',
    isCurrent: true,
  });

  // 2. One mentor (senior player)
  const mentorAffinity = Math.round(randomBetween(50, 70));
  relationships.push({
    id: generateId(),
    name: generateTeammateName(club.country),
    type: 'mentor',
    level: getRelationshipLevel(mentorAffinity),
    affinity: clamp(mentorAffinity, 0, 100),
    history: ['Took you under their wing'],
    clubId: club.id,
    position: player.position === 'ST' ? 'ST' : 'CAM',
    trait: 'supportive',
    isCurrent: true,
  });

  // 3. 3-5 teammates
  const teammateCount = Math.round(randomBetween(3, 5));
  for (let i = 0; i < teammateCount; i++) {
    const affinity = Math.round(randomBetween(30, 60));
    const trait = randomTrait();
    relationships.push({
      id: generateId(),
      name: generateTeammateName(club.country),
      type: 'teammate',
      level: getRelationshipLevel(affinity),
      affinity: clamp(affinity, 0, 100),
      history: ['Joined the squad'],
      clubId: club.id,
      position: randomTeammatePosition(),
      trait,
      isCurrent: true,
    });
  }

  // 4. One rival (competition for position)
  const rivalAffinity = Math.round(randomBetween(20, 40));
  relationships.push({
    id: generateId(),
    name: generateTeammateName(club.country),
    type: 'rival',
    level: getRelationshipLevel(rivalAffinity),
    affinity: clamp(rivalAffinity, 0, 100),
    history: ['Competing for the same position'],
    clubId: club.id,
    position: player.position,
    trait: 'competitive',
    isCurrent: true,
  });

  return relationships;
}

// --- Update relationships after a match ---
export function updateRelationshipsAfterMatch(
  relationships: Relationship[],
  player: Player,
  matchResult: MatchResult,
  currentClubId: string
): Relationship[] {
  let updated = relationships.map((r) => ({ ...r, history: [...r.history] }));

  const isTeamWin =
    (matchResult.homeClub.id === currentClubId && matchResult.homeScore > matchResult.awayScore) ||
    (matchResult.awayClub.id === currentClubId && matchResult.awayScore > matchResult.homeScore);

  const isTeamLoss3Plus =
    (matchResult.homeClub.id === currentClubId && matchResult.awayScore - matchResult.homeScore >= 3) ||
    (matchResult.awayClub.id === currentClubId && matchResult.homeScore - matchResult.awayScore >= 3);

  for (const rel of updated) {
    if (!rel.isCurrent) continue;
    let delta = 0;
    let historyEntry = '';

    // Player scored 2+ goals
    if (matchResult.playerGoals >= 2) {
      if (rel.type === 'teammate') delta += 3;
      if (rel.type === 'coach') delta += 5;
      if (rel.type === 'mentor') delta += 2;
      if (rel.type === 'rival') delta -= 2;
      historyEntry = `Scored ${matchResult.playerGoals} goals in match`;
    }

    // Player got red card
    const redCard = matchResult.events.find(
      (e) =>
        (e.type === 'red_card' || e.type === 'second_yellow') &&
        e.playerId === player.id
    );
    if (redCard) {
      if (rel.type === 'coach') delta -= 5;
      if (rel.type === 'teammate' && rel.trait === 'supportive') delta -= 1;
      else if (rel.type === 'teammate') delta -= 3;
      if (rel.type === 'rival') delta += 2;
      historyEntry = historyEntry || 'Received a red card';
    }

    // Player rating > 8.0
    if (matchResult.playerRating > 8.0) {
      if (rel.type === 'coach') delta += 3;
      if (rel.type === 'mentor') delta += 2;
      if (rel.type === 'rival') delta -= 1;
      if (!historyEntry) historyEntry = 'Outstanding match performance';
    }

    // Player rating < 5.0
    if (matchResult.playerRating < 5.0 && matchResult.playerMinutesPlayed > 0) {
      if (rel.type === 'coach') delta -= 3;
      if (rel.type === 'rival') delta += 2;
      if (!historyEntry) historyEntry = 'Poor match performance';
    }

    // Team wins
    if (isTeamWin) {
      if (rel.type === 'teammate') delta += 2;
      if (rel.type === 'coach') delta += 1;
      if (rel.type === 'mentor') delta += 1;
    }

    // Team loses by 3+
    if (isTeamLoss3Plus) {
      if (rel.type === 'teammate') delta -= 2;
      if (rel.type === 'coach') delta -= 1;
    }

    // Apply delta
    if (delta !== 0) {
      rel.affinity = clamp(rel.affinity + delta, 0, 100);
      rel.level = getRelationshipLevel(rel.affinity);
      if (historyEntry) {
        rel.history.push(historyEntry);
        // Keep history to last 10 entries
        if (rel.history.length > 10) rel.history = rel.history.slice(-10);
      }
    }
  }

  return updated;
}

// --- Weekly relationship drift and random events ---
export function updateRelationshipsWeekly(
  relationships: Relationship[],
  player: Player,
  teamDynamics: TeamDynamics
): { relationships: Relationship[]; teamDynamics: TeamDynamics } {
  let updated = relationships.map((r) => ({ ...r, history: [...r.history] }));
  let dynamics = { ...teamDynamics };

  // Weekly drift for current relationships
  for (const rel of updated) {
    if (!rel.isCurrent) continue;

    // Small random drift based on personality
    const drift = Math.round(randomBetween(-2, 2));

    // Personality-based modifiers
    let personalityDrift = 0;
    if (rel.trait === 'supportive') personalityDrift = Math.random() < 0.3 ? 1 : 0;
    if (rel.trait === 'competitive') personalityDrift = Math.random() < 0.2 ? -1 : 0;
    if (rel.trait === 'jealous' && player.overall > 75) personalityDrift = Math.random() < 0.3 ? -2 : 0;
    if (rel.trait === 'loyal') personalityDrift = Math.random() < 0.2 ? 1 : 0;

    const totalDrift = drift + personalityDrift;
    if (totalDrift !== 0) {
      rel.affinity = clamp(rel.affinity + totalDrift, 0, 100);
      rel.level = getRelationshipLevel(rel.affinity);
    }

    // Random weekly event (5% chance per relationship)
    if (Math.random() < 0.05) {
      const events = getRandomRelationshipEvent(rel, player);
      if (events) {
        rel.affinity = clamp(rel.affinity + events.affinityChange, 0, 100);
        rel.level = getRelationshipLevel(rel.affinity);
        rel.history.push(events.description);
        if (rel.history.length > 10) rel.history = rel.history.slice(-10);
      }
    }
  }

  // Update team dynamics
  dynamics = calculateTeamDynamics(updated, player, { id: dynamics.morale.toString() } as Club);

  // Morale drift toward cohesion
  if (dynamics.cohesion > dynamics.morale) {
    dynamics.morale = clamp(dynamics.morale + 1, 0, 100);
  } else if (dynamics.cohesion < dynamics.morale - 10) {
    dynamics.morale = clamp(dynamics.morale - 1, 0, 100);
  }

  return { relationships: updated, teamDynamics: dynamics };
}

// --- Random relationship events ---
interface RelationshipEvent {
  description: string;
  affinityChange: number;
}

function getRandomRelationshipEvent(
  rel: Relationship,
  player: Player
): RelationshipEvent | null {
  const events: RelationshipEvent[] = [];

  switch (rel.type) {
    case 'teammate':
      events.push(
        { description: 'Had a coffee together after training', affinityChange: 2 },
        { description: 'Disagreed over training tactics', affinityChange: -3 },
        { description: 'Celebrated a goal together', affinityChange: 3 },
        { description: 'Got into a heated argument', affinityChange: -5 },
        { description: 'Helped them with a personal issue', affinityChange: 4 }
      );
      break;
    case 'coach':
      events.push(
        { description: 'Praised your work ethic in training', affinityChange: 3 },
        { description: 'Criticized your attitude', affinityChange: -4 },
        { description: 'Had a private tactical discussion', affinityChange: 2 },
        { description: 'Called you into the office for a talk', affinityChange: -2 }
      );
      break;
    case 'rival':
      events.push(
        { description: 'Outperformed you in training drills', affinityChange: -3 },
        { description: 'You outperformed them in training', affinityChange: 2 },
        { description: 'Made a snide comment in the locker room', affinityChange: -4 },
        { description: 'Acknowledged your improvement', affinityChange: 3 }
      );
      break;
    case 'mentor':
      events.push(
        { description: 'Gave you career advice', affinityChange: 3 },
        { description: 'Invited you to train together', affinityChange: 2 },
        { description: 'Shared their experience from big matches', affinityChange: 2 },
        { description: 'Expressed disappointment in your focus', affinityChange: -3 }
      );
      break;
    default:
      return null;
  }

  return events[Math.floor(Math.random() * events.length)] ?? null;
}

// --- Generate new relationships on transfer ---
export function generateNewRelationshipsOnTransfer(
  relationships: Relationship[],
  newClub: Club,
  player: Player
): Relationship[] {
  // Mark all current club relationships as not current
  const updated = relationships.map((r) => ({
    ...r,
    isCurrent: r.clubId === newClub.id ? r.isCurrent : false,
  }));

  // Generate new relationships for the new club
  const newRelationships = generateInitialRelationships(newClub, player);

  // Keep old relationships but mark as former
  return [
    ...updated.map((r) => ({
      ...r,
      isCurrent: r.clubId === newClub.id,
    })),
    ...newRelationships,
  ];
}

// --- Calculate team dynamics from relationships ---
export function calculateTeamDynamics(
  relationships: Relationship[],
  player: Player,
  club: Club
): TeamDynamics {
  const currentRels = relationships.filter((r) => r.isCurrent);
  const teammates = currentRels.filter((r) => r.type === 'teammate');
  const coach = currentRels.find((r) => r.type === 'coach');
  const mentor = currentRels.find((r) => r.type === 'mentor');

  // Morale: average affinity of all current relationships
  const allAffinities = currentRels.map((r) => r.affinity);
  const avgAffinity =
    allAffinities.length > 0
      ? allAffinities.reduce((sum, a) => sum + a, 0) / allAffinities.length
      : 50;
  const morale = Math.round(clamp(avgAffinity, 0, 100));

  // Cohesion: based on teammate relationships + coach affinity
  const teammateAffinities = teammates.map((r) => r.affinity);
  const teammateAvg =
    teammateAffinities.length > 0
      ? teammateAffinities.reduce((sum, a) => sum + a, 0) / teammateAffinities.length
      : 50;
  const coachBonus = coach ? (coach.affinity > 60 ? 10 : coach.affinity < 30 ? -10 : 0) : 0;
  const cohesion = Math.round(clamp(teammateAvg + coachBonus, 0, 100));

  // Dressing room atmosphere
  let dressingRoomAtmosphere: TeamDynamics['dressingRoomAtmosphere'] = 'neutral';
  if (morale >= 80 && cohesion >= 75) dressingRoomAtmosphere = 'excellent';
  else if (morale >= 65 && cohesion >= 60) dressingRoomAtmosphere = 'positive';
  else if (morale >= 45 && cohesion >= 40) dressingRoomAtmosphere = 'neutral';
  else if (morale >= 25) dressingRoomAtmosphere = 'tense';
  else dressingRoomAtmosphere = 'toxic';

  // Player influence: based on reputation + relationships
  const closeRelationships = currentRels.filter((r) => r.affinity >= 70).length;
  const influenceBase = player.reputation * 0.5 + closeRelationships * 5;
  const playerInfluence = Math.round(
    clamp(influenceBase + (mentor ? (mentor.affinity > 60 ? 10 : 0) : 0), 0, 100)
  );

  // Captain rating: based on influence + leadership traits + coach affinity
  const hasLeadership =
    player.traits.includes('leadership') || player.traits.includes('leader');
  const captainBase = playerInfluence * 0.6 + (hasLeadership ? 20 : 0) + (coach ? coach.affinity * 0.2 : 0);
  const captainRating = Math.round(clamp(captainBase, 0, 100));

  return {
    morale,
    cohesion,
    dressingRoomAtmosphere,
    playerInfluence,
    captainRating,
  };
}

// --- Default team dynamics for new games ---
export function getDefaultTeamDynamics(): TeamDynamics {
  return {
    morale: 65,
    cohesion: 55,
    dressingRoomAtmosphere: 'neutral',
    playerInfluence: 15,
    captainRating: 10,
  };
}
