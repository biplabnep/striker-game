// ============================================================
// Elite Striker - Social Media & Narrative Engine
// Generates social media posts, manages storylines,
// and tracks public sentiment throughout the player's career
// ============================================================

import {
  Player,
  Club,
  MatchResult,
  SocialPost,
  Storyline,
} from './types';

let postIdCounter = 0;
let storylineIdCounter = 0;

function generatePostId(): string {
  return `post_${Date.now()}_${postIdCounter++}`;
}

function generateStorylineId(): string {
  return `story_${Date.now()}_${storylineIdCounter++}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// Social Post Templates
// ============================================================

interface PostTemplate {
  source: string;
  type: SocialPost['type'];
  sentimentRange: [number, number];
  engagementRange: [number, number];
  templates: string[];
}

const FAN_REACTIONS_POSITIVE: PostTemplate = {
  source: 'Fans',
  type: 'fan',
  sentimentRange: [40, 90],
  engagementRange: [30, 80],
  templates: [
    '{player} is absolutely world class! What a performance! 🔥',
    'I\'ve never seen a player like {player} at this club. Truly special.',
    '{player} for Ballon d\'Or? I\'m not even joking anymore.',
    'The way {player} reads the game is just different. Genius.',
    'We are SO lucky to have {player}. Don\'t take this for granted, people.',
    '{player} carrying the whole team on their back. Respect.',
  ],
};

const FAN_REACTIONS_NEGATIVE: PostTemplate = {
  source: 'Fans',
  type: 'fan',
  sentimentRange: [-80, -20],
  engagementRange: [40, 90],
  templates: [
    '{player} was absolutely shocking today. Embarrassing.',
    'I\'ve had enough of {player}. Time to sell in January.',
    'How is {player} still starting? There are academy kids who\'d do better.',
    '{player} doesn\'t care about the club. Just collecting wages.',
    'Worst performance I\'ve seen in years. {player} needs to be dropped.',
    'If {player} wants to leave, let them. We don\'t need this attitude.',
  ],
};

const FAN_REACTIONS_NEUTRAL: PostTemplate = {
  source: 'Fans',
  type: 'fan',
  sentimentRange: [-20, 20],
  engagementRange: [15, 40],
  templates: [
    'Decent game from {player}. Nothing special but did the job.',
    '{player} was okay today. Room for improvement though.',
    'Average performance from {player}. We need more.',
    'Not {player}\'s best day, but not the worst either.',
  ],
};

const MEDIA_REACTIONS_POSITIVE: PostTemplate = {
  source: 'Sports Daily',
  type: 'media',
  sentimentRange: [20, 70],
  engagementRange: [50, 90],
  templates: [
    'BREAKING: {player} delivers another masterclass as {club} secure victory',
    'Analysis: How {player} has become the most important player at {club}',
    '{player} continues to justify their price tag with yet another standout performance',
    'EXCLUSIVE: Sources close to {player} say they\'re loving life at {club}',
    'The transformation of {player} this season has been remarkable',
  ],
};

const MEDIA_REACTIONS_NEGATIVE: PostTemplate = {
  source: 'Sports Daily',
  type: 'media',
  sentimentRange: [-70, -10],
  engagementRange: [50, 85],
  templates: [
    'UNDER PRESSURE: {player}\'s form raises serious questions about their future',
    'Is it time for {club} to move on from {player}?',
    '{player} anonymous again as {club} struggle',
    'Sources: {player} frustrated with lack of opportunities at {club}',
    'The decline of {player} - what went wrong?',
  ],
};

const PUNDIT_REACTIONS: PostTemplate = {
  source: 'Pundit',
  type: 'pundit',
  sentimentRange: [-60, 60],
  engagementRange: [40, 80],
  templates: [
    'I\'ve been saying it for weeks - {player} is the real deal. Tonight proved me right.',
    '{player} has to take responsibility. That performance wasn\'t good enough for this level.',
    'People underestimate {player}\'s intelligence on the pitch. It\'s world class.',
    'For me, {player} needs to be more consistent. Talent is there, but talent isn\'t enough.',
    '{player} is going right to the top. Mark my words.',
    'I\'m not convinced by {player}. Good player, but not great. Not yet.',
  ],
};

const OFFICIAL_POSTS: PostTemplate = {
  source: 'Club Official',
  type: 'official',
  sentimentRange: [30, 80],
  engagementRange: [50, 95],
  templates: [
    '🏆 Congratulations to {player} on an outstanding performance tonight! Well deserved.',
    'Delighted to announce {player} has been voted Player of the Month! 👏',
    '{player} signs a new contract! An important part of our project. 💪',
    'Great to see {player} back in training after injury. Nearly there! 💪',
    'We\'re thrilled with {player}\'s development this season. The best is yet to come.',
  ],
};

const AGENT_POSTS: PostTemplate = {
  source: 'Agent',
  type: 'agent',
  sentimentRange: [-30, 60],
  engagementRange: [30, 70],
  templates: [
    'My client {player} is focused on giving 100% for the club. Nothing else to say.',
    'The love {player} has for the fans is genuine. Don\'t believe everything you read.',
    '{player}\'s market value speaks for itself. Clubs are taking notice.',
    'Negotiations are ongoing. {player} deserves to be valued appropriately.',
  ],
};

// ============================================================
// Post-Match Media
// ============================================================

export function processMediaReaction(
  player: Player,
  matchResult: MatchResult
): SocialPost[] {
  const posts: SocialPost[] = [];
  const { playerRating, homeScore, awayScore } = matchResult;
  const club = matchResult.homeClub;

  // Determine the tone of coverage based on performance
  const isGoodPerformance = playerRating >= 7.0;
  const isGreatPerformance = playerRating >= 8.0;
  const isPoorPerformance = playerRating < 5.5;
  const isTerriblePerformance = playerRating < 4.0;
  const teamWon = homeScore > awayScore;
  const teamLost = homeScore < awayScore;
  const teamDrew = homeScore === awayScore;

  // Fan reaction (1-2 posts)
  if (isGreatPerformance) {
    posts.push(generateFromTemplate(FAN_REACTIONS_POSITIVE, player, club));
    if (Math.random() < 0.5) {
      posts.push(generateFromTemplate(FAN_REACTIONS_POSITIVE, player, club));
    }
  } else if (isPoorPerformance) {
    posts.push(generateFromTemplate(FAN_REACTIONS_NEGATIVE, player, club));
    if (isTerriblePerformance && Math.random() < 0.6) {
      posts.push(generateFromTemplate(FAN_REACTIONS_NEGATIVE, player, club));
    }
  } else {
    if (Math.random() < 0.5) {
      posts.push(generateFromTemplate(FAN_REACTIONS_NEUTRAL, player, club));
    }
  }

  // Media reaction (1 post for regular matches, 2 for big ones)
  if (isGreatPerformance || isTerriblePerformance) {
    posts.push(generateFromTemplate(
      isGoodPerformance ? MEDIA_REACTIONS_POSITIVE : MEDIA_REACTIONS_NEGATIVE,
      player, club
    ));
  } else if (Math.random() < 0.4) {
    posts.push(generateFromTemplate(
      isGoodPerformance ? MEDIA_REACTIONS_POSITIVE : MEDIA_REACTIONS_NEGATIVE,
      player, club
    ));
  }

  // Pundit reaction (occasional)
  if (Math.random() < 0.3 || isGreatPerformance) {
    posts.push(generateFromTemplate(PUNDIT_REACTIONS, player, club));
  }

  // Official posts for special occasions
  if (isGreatPerformance && teamWon) {
    if (Math.random() < 0.5) {
      posts.push(generateFromTemplate(OFFICIAL_POSTS, player, club));
    }
  }

  // Set week and season from match result
  for (const post of posts) {
    post.week = matchResult.week;
    post.season = matchResult.season;
  }

  return posts;
}

// ============================================================
// Generate Social Post
// ============================================================

export function generateSocialPost(
  player: Player,
  event: string,
  context: string
): SocialPost {
  const template = context.toLowerCase();

  let postTemplate: PostTemplate;
  let content: string;

  switch (event) {
    case 'goal':
      postTemplate = FAN_REACTIONS_POSITIVE;
      content = pickRandom([
        `GOAAAL! ${player.name} does it again! What a strike! 🔥`,
        `${player.name} with the goal! The stadium erupts!`,
        `That's why ${player.name} is the best! Clinical finish!`,
      ]);
      break;
    case 'assist':
      postTemplate = FAN_REACTIONS_POSITIVE;
      content = pickRandom([
        `What a pass from ${player.name}! Vision like no other!`,
        `${player.name} with the assist - brilliant playmaking!`,
      ]);
      break;
    case 'transfer_rumor':
      postTemplate = MEDIA_REACTIONS_POSITIVE;
      content = pickRandom([
        `BREAKING: ${player.name} linked with shock move! Sources confirm interest from top clubs.`,
        `Will ${player.name} stay or go? The transfer saga continues...`,
        `${player.name} to leave? Agent spotted at rival club's training ground.`,
      ]);
      break;
    case 'injury':
      postTemplate = FAN_REACTIONS_NEGATIVE;
      content = pickRandom([
        `Devastating news about ${player.name}. Get well soon! ❤️`,
        `${player.name} injured again. This is becoming a real concern.`,
        `How long will ${player.name} be out? The club needs them.`,
      ]);
      break;
    case 'contract':
      postTemplate = OFFICIAL_POSTS;
      content = pickRandom([
        `${player.name} commits their future to the club! Great news! ✍️`,
        `New deal for ${player.name} - the project continues! 💪`,
      ]);
      break;
    default:
      postTemplate = FAN_REACTIONS_NEUTRAL;
      content = `${player.name} update: ${context}`;
  }

  // Override the template with our custom content
  const sentiment = randInt(postTemplate.sentimentRange[0], postTemplate.sentimentRange[1]);
  const engagement = randInt(postTemplate.engagementRange[0], postTemplate.engagementRange[1]);

  return {
    id: generatePostId(),
    source: postTemplate.source,
    content,
    sentiment,
    engagement,
    week: 0,
    season: 0,
    type: postTemplate.type,
  };
}

// ============================================================
// Storyline Management
// ============================================================

interface StorylineTemplate {
  title: string;
  description: string;
  totalPhases: number;
  tags: string[];
  conditions?: (player: Player, club: Club) => boolean;
  weight: number;
}

const STORYLINE_TEMPLATES: StorylineTemplate[] = [
  {
    title: 'The Golden Boot Chase',
    description: '{player} is in the running for the league\'s top scorer. Every goal counts in this thrilling race.',
    totalPhases: 5,
    tags: ['goals', 'competition', 'personal'],
    conditions: (p) => p.position === 'ST' && p.seasonStats.goals >= 5,
    weight: 6,
  },
  {
    title: 'Contract Standoff',
    description: 'Negotiations between {player} and the club have stalled. The tension is building.',
    totalPhases: 4,
    tags: ['contract', 'negotiation', 'finance'],
    conditions: (p) => p.contract.yearsRemaining <= 2 && p.overall >= 70,
    weight: 5,
  },
  {
    title: 'Rise of the Wonderkid',
    description: 'The media can\'t stop talking about {player}. Is the pressure getting too much for such a young talent?',
    totalPhases: 4,
    tags: ['youth', 'pressure', 'media'],
    conditions: (p) => p.age <= 21 && p.overall >= 75,
    weight: 7,
  },
  {
    title: 'The Return from Injury',
    description: '{player} is fighting to get back to their best after a serious injury. The road to recovery is long.',
    totalPhases: 3,
    tags: ['injury', 'recovery', 'resilience'],
    conditions: (p) => p.injuryHistory.length > 0,
    weight: 5,
  },
  {
    title: 'Captain Controversy',
    description: 'With the captain\'s armband up for grabs, {player} is in contention. But so is a club veteran.',
    totalPhases: 3,
    tags: ['leadership', 'politics', 'dressing_room'],
    conditions: (p) => p.age >= 26 && p.overall >= 78 && p.reputation >= 50,
    weight: 4,
  },
  {
    title: 'Local Hero',
    description: '{player} has become a cult hero among the fans. Their connection with the supporters is special.',
    totalPhases: 3,
    tags: ['fans', 'loyalty', 'community'],
    conditions: (p) => p.morale >= 70 && p.reputation >= 40,
    weight: 5,
  },
  {
    title: 'Derby Day Drama',
    description: 'The biggest match of the season is approaching, and all eyes are on {player}.',
    totalPhases: 3,
    tags: ['rivalry', 'pressure', 'big_match'],
    weight: 6,
  },
  {
    title: 'Out of Form',
    description: '{player} hasn\'t been at their best lately. Critics are circling, and confidence is low.',
    totalPhases: 4,
    tags: ['form', 'criticism', 'pressure'],
    conditions: (p) => p.form < 5.5,
    weight: 5,
  },
  {
    title: 'Title Race',
    description: 'The title is on the line, and {player} is at the center of it. Every match is a final.',
    totalPhases: 5,
    tags: ['title', 'competition', 'pressure'],
    conditions: (p) => p.overall >= 75,
    weight: 4,
  },
  {
    title: 'International Recognition',
    description: '{player}\'s performances have caught the eye of the national team coach. A call-up could be coming.',
    totalPhases: 3,
    tags: ['international', 'national_team', 'pride'],
    conditions: (p) => p.overall >= 72 && p.reputation >= 45,
    weight: 5,
  },
];

export function generateNewStoryline(
  player: Player,
  club: Club
): Storyline | null {
  // Probability of a new storyline: ~8% per week
  if (Math.random() > 0.08) return null;

  const eligible = STORYLINE_TEMPLATES.filter(
    (t) => !t.conditions || t.conditions(player, club)
  );

  if (eligible.length === 0) return null;

  // Weighted selection
  const totalWeight = eligible.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  let selected: StorylineTemplate | null = null;

  for (const template of eligible) {
    roll -= template.weight;
    if (roll <= 0) {
      selected = template;
      break;
    }
  }

  if (!selected) {
    selected = eligible[eligible.length - 1];
  }

  // Replace placeholders
  const title = selected.title.replace('{player}', player.name);
  const description = selected.description.replace('{player}', player.name);

  return {
    id: generateStorylineId(),
    title,
    description,
    startDate: Date.now(),
    startWeek: 0,
    startSeason: 0,
    currentPhase: 1,
    totalPhases: selected.totalPhases,
    sentiment: 0,
    status: 'active',
    tags: selected.tags,
  };
}

export function updateStorylines(
  storylines: Storyline[],
  player: Player,
  week: number
): Storyline[] {
  const updated: Storyline[] = [];

  for (const storyline of storylines) {
    if (storyline.status !== 'active') {
      updated.push(storyline);
      continue;
    }

    const updatedStoryline = { ...storyline };

    // Progress storyline based on events
    // Each storyline has a chance to advance each week
    if (Math.random() < 0.2) {
      updatedStoryline.currentPhase = Math.min(
        updatedStoryline.currentPhase + 1,
        updatedStoryline.totalPhases
      );
    }

    // Update sentiment based on player form and morale
    const sentimentShift = (player.form - 5.5) * 2 + (player.morale - 50) / 20;
    updatedStoryline.sentiment = clamp(
      Math.round(updatedStoryline.sentiment + sentimentShift),
      -100,
      100
    );

    // Resolve storyline if at final phase
    if (updatedStoryline.currentPhase >= updatedStoryline.totalPhases) {
      updatedStoryline.status = Math.random() < 0.3 ? 'dormant' : 'resolved';
    }

    updated.push(updatedStoryline);
  }

  return updated;
}

// ============================================================
// Public Sentiment Calculation
// ============================================================

export function calculatePublicSentiment(
  socialFeed: SocialPost[],
  storylines: Storyline[]
): number {
  // Weight recent posts more heavily
  const recentPosts = socialFeed.slice(-20);
  const activeStorylines = storylines.filter((s) => s.status === 'active');

  let sentimentSum = 0;
  let totalWeight = 0;

  // Social post sentiment (weighted by engagement)
  for (let i = 0; i < recentPosts.length; i++) {
    const post = recentPosts[i];
    const recencyWeight = 1 + (i / recentPosts.length); // more recent = higher weight
    const engagementWeight = post.engagement / 50;

    // Source credibility weights
    const sourceWeight = post.type === 'official' ? 1.5 :
                         post.type === 'media' ? 1.2 :
                         post.type === 'pundit' ? 1.0 :
                         post.type === 'agent' ? 0.8 : 0.6;

    sentimentSum += post.sentiment * recencyWeight * engagementWeight * sourceWeight;
    totalWeight += recencyWeight * engagementWeight * sourceWeight;
  }

  // Storyline sentiment (active storylines influence perception)
  for (const storyline of activeStorylines) {
    const storylineWeight = 2.0; // storylines are significant
    sentimentSum += storyline.sentiment * storylineWeight;
    totalWeight += storylineWeight;
  }

  if (totalWeight === 0) return 0;

  const rawSentiment = sentimentSum / totalWeight;

  return clamp(Math.round(rawSentiment), -100, 100);
}

// ============================================================
// Helper Functions
// ============================================================

function generateFromTemplate(
  template: PostTemplate,
  player: Player,
  club: Club
): SocialPost {
  const content = pickRandom(template.templates)
    .replace('{player}', player.name)
    .replace('{club}', club.name);

  return {
    id: generatePostId(),
    source: template.source,
    content,
    sentiment: randInt(template.sentimentRange[0], template.sentimentRange[1]),
    engagement: randInt(template.engagementRange[0], template.engagementRange[1]),
    week: 0,
    season: 0,
    type: template.type,
  };
}
