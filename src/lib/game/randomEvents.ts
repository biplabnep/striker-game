// ============================================================
// Elite Striker - Random Events Engine
// Generates narrative events with choices that affect the
// player's career, including transfer rumors, media events,
// personal life, team conflicts, mentorship, and sponsorship
// ============================================================

import {
  Player,
  Club,
  EventType,
  GameEvent,
  EventChoice,
  EventEffects,
} from './types';

let eventIdCounter = 0;

function generateEventId(): string {
  return `evt_${Date.now()}_${eventIdCounter++}`;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================
// Event Definitions
// ============================================================

interface EventTemplate {
  type: EventType;
  title: string;
  description: string;
  choices: EventChoice[];
  conditions?: (player: Player, club: Club) => boolean;
  weight: number; // relative probability weight
}

const EVENT_TEMPLATES: EventTemplate[] = [
  // ==========================================
  // TRANSFER RUMOR EVENTS (7 variants)
  // ==========================================
  {
    type: 'TRANSFER_RUMOR',
    title: 'Big Club Circling',
    description: 'Reports emerge that a top European club has been scouting you extensively. Your agent confirms there\'s genuine interest, but your current club is reluctant to sell.',
    choices: [
      {
        id: 'push_for_move',
        label: 'Push for the move',
        description: 'Make it clear you want the transfer. Risk alienating your current club.',
        effects: { morale: -10, reputation: 5, marketValue: 500000 },
      },
      {
        id: 'stay_loyal',
        label: 'Stay loyal to your club',
        description: 'Publicly commit to your current club. Fans will love you for it.',
        effects: { morale: 10, reputation: 8 },
      },
      {
        id: 'let_agent_handle',
        label: 'Let your agent handle it quietly',
        description: 'Keep your head down and let negotiations happen behind the scenes.',
        effects: { morale: 0, reputation: 2, marketValue: 200000 },
      },
    ],
    conditions: (p) => p.overall >= 70 && p.reputation >= 40,
    weight: 8,
  },
  {
    type: 'TRANSFER_RUMOR',
    title: 'Overseas Interest',
    description: 'Your agent reports significant interest from clubs in a different league. A move abroad could be transformative for your career, but it means leaving everything familiar behind.',
    choices: [
      {
        id: 'embrace_adventure',
        label: 'Embrace the adventure',
        description: 'Express openness to a new challenge abroad.',
        effects: { morale: -5, reputation: 5, marketValue: 300000 },
      },
      {
        id: 'stay_home',
        label: 'Prefer to stay in familiar surroundings',
        description: 'Indicate you\'d prefer domestic opportunities.',
        effects: { morale: 5, reputation: 0 },
      },
    ],
    conditions: (p) => p.overall >= 65,
    weight: 6,
  },
  {
    type: 'TRANSFER_RUMOR',
    title: 'Rival Club Approach',
    description: 'Your club\'s fiercest rival has made enquiries about your availability. The fans would be furious, but the sporting project is compelling.',
    choices: [
      {
        id: 'consider_rival',
        label: 'Consider the offer seriously',
        description: 'It\'s just business. The rival offers better sporting prospects.',
        effects: { morale: -15, reputation: -10, marketValue: 400000 },
      },
      {
        id: 'reject_rival',
        label: 'Reject the approach outright',
        description: 'Some lines shouldn\'t be crossed. Stay faithful to your club.',
        effects: { morale: 15, reputation: 12 },
      },
    ],
    conditions: (p) => p.overall >= 68 && p.reputation >= 35,
    weight: 5,
  },
  {
    type: 'TRANSFER_RUMOR',
    title: 'Loan Opportunity',
    description: 'A club in a lower division wants to take you on loan for the rest of the season. It would guarantee playing time, but at a lower level.',
    choices: [
      {
        id: 'accept_loan',
        label: 'Accept the loan move',
        description: 'Regular football at a lower level is better than bench warming.',
        effects: { morale: 5, form: 0.5, squadStatus: 'loan' as any },
      },
      {
        id: 'fight_for_place',
        label: 'Stay and fight for your place',
        description: 'Prove you belong at this level.',
        effects: { morale: -5, reputation: 3 },
      },
    ],
    conditions: (p) => p.squadStatus === 'bench' || p.squadStatus === 'prospect',
    weight: 10,
  },
  {
    type: 'TRANSFER_RUMOR',
    title: 'Release Clause Activated',
    description: 'A wealthy club is prepared to trigger your release clause. Your club can\'t stop the move if you want it.',
    choices: [
      {
        id: 'accept_move',
        label: 'Accept the lucrative move',
        description: 'The money and project are too good to turn down.',
        effects: { morale: 5, reputation: 5, marketValue: 800000 },
      },
      {
        id: 'renegotiate',
        label: 'Use it as leverage to renegotiate',
        description: 'Stay, but get a better contract out of it.',
        effects: { morale: 10, reputation: -3, marketValue: 300000 },
      },
    ],
    conditions: (p) => p.contract.releaseClause !== undefined && p.overall >= 72,
    weight: 3,
  },
  {
    type: 'TRANSFER_RUMOR',
    title: 'Middle East Interest',
    description: 'Clubs from the Middle East are offering astronomical wages. It would be life-changing money, but many question the sporting merit.',
    choices: [
      {
        id: 'follow_money',
        label: 'Follow the money',
        description: 'Financial security for generations. Hard to argue with that.',
        effects: { morale: -10, reputation: -15, marketValue: -1000000 },
      },
      {
        id: 'prioritize_career',
        label: 'Prioritize your sporting career',
        description: 'There\'s more to football than money.',
        effects: { morale: 5, reputation: 10 },
      },
    ],
    conditions: (p) => p.age >= 27 && p.reputation >= 50,
    weight: 4,
  },
  {
    type: 'TRANSFER_RUMOR',
    title: 'MLS or New Challenge',
    description: 'As you approach the later stages of your career, offers from MLS and other emerging leagues start coming in. A new adventure or one last push at the top?',
    choices: [
      {
        id: 'new_adventure',
        label: 'Embrace a new adventure',
        description: 'A fresh start in a growing league could be exciting.',
        effects: { morale: 5, reputation: -5, marketValue: -500000 },
      },
      {
        id: 'one_last_push',
        label: 'One last push at the highest level',
        description: 'You still have something to prove in top-flight football.',
        effects: { morale: -5, reputation: 5, fitness: -5 },
      },
    ],
    conditions: (p) => p.age >= 32,
    weight: 5,
  },

  // ==========================================
  // MEDIA INTERVIEW EVENTS (6 variants)
  // ==========================================
  {
    type: 'MEDIA_INTERVIEW',
    title: 'Post-Match Press Conference',
    description: 'After a controversial match, journalists are pressing you for comments about the referee\'s decisions and your team\'s performance.',
    choices: [
      {
        id: 'speak_candidly',
        label: 'Speak your mind candidly',
        description: 'The fans deserve honesty. Call it like you see it.',
        effects: { morale: 5, reputation: -8 },
      },
      {
        id: 'diplomatic_response',
        label: 'Give a diplomatic response',
        description: 'No need to create headlines. Keep it professional.',
        effects: { morale: 0, reputation: 3 },
      },
      {
        id: 'walk_out',
        label: 'Walk out of the press conference',
        description: 'You\'re too frustrated to talk. Let your actions speak.',
        effects: { morale: -5, reputation: -5 },
      },
    ],
    weight: 7,
  },
  {
    type: 'MEDIA_INTERVIEW',
    title: 'TV Documentary Feature',
    description: 'A major broadcaster wants to do an in-depth documentary following your daily life. It would raise your profile significantly but invade your privacy.',
    choices: [
      {
        id: 'accept_documentary',
        label: 'Accept the documentary',
        description: 'Let the world see the real you. Great for your brand.',
        effects: { reputation: 10, morale: -5, marketValue: 300000 },
      },
      {
        id: 'decline_documentary',
        label: 'Politely decline',
        description: 'Keep your private life private. Focus on football.',
        effects: { reputation: -2, morale: 5 },
      },
    ],
    conditions: (p) => p.reputation >= 50,
    weight: 4,
  },
  {
    type: 'MEDIA_INTERVIEW',
    title: 'Controversial Quote',
    description: 'A newspaper has published a quote attributed to you that sounds critical of your teammates. You don\'t remember saying it, but the damage is done.',
    choices: [
      {
        id: 'deny_and_sue',
        label: 'Deny it and threaten legal action',
        description: 'Set the record straight. This is misrepresentation.',
        effects: { reputation: 5, morale: -3, marketValue: -100000 },
      },
      {
        id: 'apologize',
        label: 'Issue a public apology',
        description: 'Even if you didn\'t say it, apologize to smooth things over.',
        effects: { reputation: -3, morale: -5 },
      },
      {
        id: 'ignore_it',
        label: 'Ignore it and move on',
        description: 'The news cycle moves fast. This will blow over.',
        effects: { reputation: -5, morale: -2 },
      },
    ],
    weight: 5,
  },
  {
    type: 'MEDIA_INTERVIEW',
    title: 'Podcast Appearance',
    description: 'A popular football podcast invites you as a guest. It\'s informal and relaxed, but you never know what might slip out.',
    choices: [
      {
        id: 'go_on_podcast',
        label: 'Appear on the podcast',
        description: 'Show your personality. Fans love authenticity.',
        effects: { reputation: 5, morale: 5 },
      },
      {
        id: 'decline_podcast',
        label: 'Decline the invitation',
        description: 'Too risky. Stick to controlled media environments.',
        effects: { reputation: 0, morale: 0 },
      },
    ],
    conditions: (p) => p.reputation >= 30,
    weight: 5,
  },
  {
    type: 'MEDIA_INTERVIEW',
    title: 'Social Media Storm',
    description: 'An old social media post of yours has resurfaced and is causing controversy. The club\'s PR team is asking how you want to handle it.',
    choices: [
      {
        id: 'address_publicly',
        label: 'Address it publicly and apologize',
        description: 'Face it head-on. Own your past mistakes.',
        effects: { reputation: -8, morale: -10 },
      },
      {
        id: 'delete_and_move_on',
        label: 'Delete and move on silently',
        description: 'Don\'t give it more oxygen. Delete and hope it fades.',
        effects: { reputation: -5, morale: -5 },
      },
      {
        id: 'context_matters',
        label: 'Provide context and defend yourself',
        description: 'Explain the context. You won\'t be canceled without a fight.',
        effects: { reputation: -3, morale: -3 },
      },
    ],
    weight: 4,
  },
  {
    type: 'MEDIA_INTERVIEW',
    title: 'Award Nomination Interview',
    description: 'You\'ve been shortlisted for a prestigious individual award. The interview could sway voters, but you need to balance confidence with humility.',
    choices: [
      {
        id: 'confident',
        label: 'Express confidence you deserve it',
        description: 'Back yourself. You\'ve earned this recognition.',
        effects: { reputation: 5, morale: 8 },
      },
      {
        id: 'humble',
        label: 'Stay humble, credit the team',
        description: 'Individual awards are nice, but football is a team sport.',
        effects: { reputation: 8, morale: 5 },
      },
    ],
    conditions: (p) => p.overall >= 80 && p.form >= 7,
    weight: 3,
  },

  // ==========================================
  // PERSONAL LIFE EVENTS (6 variants)
  // ==========================================
  {
    type: 'PERSONAL_LIFE',
    title: 'Family Emergency',
    description: 'You receive news of a family emergency back home. You need to decide whether to take immediate leave or fulfill your club commitments first.',
    choices: [
      {
        id: 'family_first',
        label: 'Family comes first - leave immediately',
        description: 'Some things are bigger than football.',
        effects: { morale: -10, fitness: 5, reputation: 5 },
      },
      {
        id: 'fulfill_commitments',
        label: 'Fulfill commitments then go',
        description: 'The match is in two days. You\'ll leave right after.',
        effects: { morale: -15, reputation: -5 },
      },
    ],
    weight: 4,
  },
  {
    type: 'PERSONAL_LIFE',
    title: 'New Relationship in Spotlight',
    description: 'The tabloids have discovered your new relationship and won\'t leave you alone. The attention is affecting your daily routine.',
    choices: [
      {
        id: 'go_public',
        label: 'Go public on your own terms',
        description: 'Control the narrative. Share it yourself.',
        effects: { reputation: 3, morale: -5 },
      },
      {
        id: 'keep_private',
        label: 'Keep private and ignore the press',
        description: 'Your personal life is nobody\'s business.',
        effects: { reputation: 0, morale: -3 },
      },
    ],
    conditions: (p) => p.reputation >= 40,
    weight: 5,
  },
  {
    type: 'PERSONAL_LIFE',
    title: 'Investment Opportunity',
    description: 'A business contact offers you an investment opportunity that could set you up for life after football. But it requires significant capital upfront.',
    choices: [
      {
        id: 'invest_heavily',
        label: 'Invest a significant amount',
        description: 'High risk, high reward. Your financial future could be secured.',
        effects: { marketValue: -200000, morale: 5 },
      },
      {
        id: 'small_investment',
        label: 'Invest a smaller, safer amount',
        description: 'Dip your toe in. Don\'t overcommit.',
        effects: { marketValue: -50000, morale: 2 },
      },
      {
        id: 'decline_investment',
        label: 'Decline and focus on football',
        description: 'Your best investment is your career right now.',
        effects: { morale: 0, reputation: 2 },
      },
    ],
    weight: 4,
  },
  {
    type: 'PERSONAL_LIFE',
    title: 'Home Sickness',
    description: 'You\'ve been feeling increasingly homesick. The homesickness is starting to affect your training and performance.',
    choices: [
      {
        id: 'visit_home',
        label: 'Request permission to visit home',
        description: 'A short trip might refresh your mindset.',
        effects: { morale: 10, fitness: -5 },
      },
      {
        id: 'push_through',
        label: 'Push through it',
        description: 'Professionalism means handling adversity.',
        effects: { morale: -5, form: -0.3 },
      },
    ],
    conditions: (p) => p.morale < 50,
    weight: 5,
  },
  {
    type: 'PERSONAL_LIFE',
    title: 'Charity Foundation',
    description: 'You have the opportunity to start a charity foundation in your hometown. It would be incredibly rewarding but time-consuming.',
    choices: [
      {
        id: 'start_foundation',
        label: 'Start the foundation',
        description: 'Give back to your community. Football is a platform.',
        effects: { reputation: 12, morale: 8, fitness: -3 },
      },
      {
        id: 'donate_instead',
        label: 'Donate to existing charities instead',
        description: 'Make a difference without the administrative burden.',
        effects: { reputation: 5, morale: 3 },
      },
    ],
    conditions: (p) => p.reputation >= 45 && p.marketValue >= 5000000,
    weight: 3,
  },
  {
    type: 'PERSONAL_LIFE',
    title: 'Language Barrier',
    description: 'If you moved to a foreign country, the language barrier is becoming a real issue in your daily life and on the pitch.',
    choices: [
      {
        id: 'hire_tutor',
        label: 'Hire a language tutor',
        description: 'Commit to learning the language properly.',
        effects: { morale: 5, reputation: 3, fitness: -2 },
      },
      {
        id: 'rely_on_teammates',
        label: 'Rely on teammates for translation',
        description: 'You\'ll pick it up eventually. Focus on football.',
        effects: { morale: -3, form: -0.2 },
      },
    ],
    weight: 4,
  },

  // ==========================================
  // TEAM CONFLICT EVENTS (4 variants)
  // ==========================================
  {
    type: 'TEAM_CONFLICT',
    title: 'Tactical Disagreement',
    description: 'You strongly disagree with the manager\'s tactical setup for the upcoming match. Your role doesn\'t play to your strengths at all.',
    choices: [
      {
        id: 'voice_concern',
        label: 'Voice your concerns privately',
        description: 'A professional conversation might help the manager see your point.',
        effects: { morale: -5, reputation: 3, form: 0.3 },
      },
      {
        id: 'accept_role',
        label: 'Accept the role and adapt',
        description: 'The team comes first. Do your best in the system.',
        effects: { morale: -3, reputation: 5 },
      },
      {
        id: 'go_public',
        label: 'Express frustration publicly',
        description: 'The fans deserve to know you\'re being misused.',
        effects: { morale: 5, reputation: -12, squadStatus: 'bench' as any },
      },
    ],
    weight: 6,
  },
  {
    type: 'TEAM_CONFLICT',
    title: 'Coach\'s Public Criticism',
    description: 'The manager has publicly criticized your recent performances in a press conference. The comments were surprisingly harsh.',
    choices: [
      {
        id: 'respond_professionally',
        label: 'Respond professionally, prove them wrong',
        description: 'Let your performances do the talking.',
        effects: { morale: -8, form: 0.5, reputation: 5 },
      },
      {
        id: 'confront_manager',
        label: 'Confront the manager privately',
        description: 'Clear the air. This is unacceptable treatment.',
        effects: { morale: -5, reputation: -3 },
      },
      {
        id: 'demand_transfer',
        label: 'Demand a transfer',
        description: 'If this is how they treat you, you\'re out.',
        effects: { morale: 5, reputation: -8, squadStatus: 'transfer_listed' as any },
      },
    ],
    weight: 5,
  },
  {
    type: 'TEAM_CONFLICT',
    title: 'Training Ground Altercation',
    description: 'Tempers flare during a training session. A teammate makes a reckless challenge and you react. Other players have to separate you.',
    choices: [
      {
        id: 'apologize',
        label: 'Apologize and move on',
        description: 'You let your emotions get the better of you. Be the bigger person.',
        effects: { morale: -3, reputation: 3 },
      },
      {
        id: 'stand_ground',
        label: 'Stand your ground',
        description: 'The challenge was reckless. You had every right to be angry.',
        effects: { morale: 5, reputation: -5 },
      },
    ],
    weight: 4,
  },
  {
    type: 'TEAM_CONFLICT',
    title: 'Dressing Room Divide',
    description: 'The dressing room is split into factions. You\'re being pressured to take sides in a conflict between senior players and the manager.',
    choices: [
      {
        id: 'side_with_players',
        label: 'Side with the players',
        description: 'The players are the ones on the pitch. Unity matters.',
        effects: { morale: 5, reputation: -3 },
      },
      {
        id: 'side_with_manager',
        label: 'Support the manager',
        description: 'The manager\'s authority needs to be respected.',
        effects: { morale: -5, reputation: 5, squadStatus: 'rotation' as any },
      },
      {
        id: 'stay_neutral',
        label: 'Stay neutral and focus on football',
        description: 'Don\'t get dragged into politics. Just play.',
        effects: { morale: -3, reputation: 2 },
      },
    ],
    weight: 4,
  },

  // ==========================================
  // MENTORSHIP EVENTS (4 variants)
  // ==========================================
  {
    type: 'MENTORSHIP',
    title: 'Veteran Mentorship Offer',
    description: 'One of the club\'s most experienced players offers to mentor you. They\'ve seen your potential and want to help you reach the next level.',
    choices: [
      {
        id: 'accept_mentor',
        label: 'Accept the mentorship gratefully',
        description: 'Learn from someone who\'s been there and done it.',
        effects: { morale: 10, form: 0.5, attributes: { passing: 1, defending: 1 } },
      },
      {
        id: 'respectful_decline',
        label: 'Politely decline',
        description: 'You prefer to find your own way. No disrespect intended.',
        effects: { morale: -3, reputation: 2 },
      },
    ],
    conditions: (p) => p.age <= 24,
    weight: 7,
  },
  {
    type: 'MENTORSHIP',
    title: 'Academy Player Looks Up to You',
    description: 'A young academy player has been shadowing you in training. They\'ve asked for advice on making it as a professional.',
    choices: [
      {
        id: 'mentor_eagerly',
        label: 'Take them under your wing',
        description: 'Someone helped you once. Pay it forward.',
        effects: { morale: 8, reputation: 5, attributes: { passing: 0.5 } },
      },
      {
        id: 'give_quick_tips',
        label: 'Give some quick tips but keep distance',
        description: 'You\'re focused on your own career right now.',
        effects: { morale: 3, reputation: 2 },
      },
    ],
    conditions: (p) => p.age >= 24 && p.overall >= 70,
    weight: 6,
  },
  {
    type: 'MENTORSHIP',
    title: 'Retiring Legend\'s Advice',
    description: 'A club legend in their final season pulls you aside after training. They share wisdom about longevity in the game and avoiding the mistakes they made.',
    choices: [
      {
        id: 'listen_intently',
        label: 'Listen intently and take notes',
        description: 'This is invaluable advice from someone who\'s seen it all.',
        effects: { morale: 10, reputation: 3, attributes: { physical: 0.5, defending: 0.5 } },
      },
      {
        id: 'thank_and_move_on',
        label: 'Thank them but don\'t dwell on it',
        description: 'Nice gesture, but you have your own path to follow.',
        effects: { morale: 2, reputation: 1 },
      },
    ],
    conditions: (p) => p.age <= 28,
    weight: 4,
  },
  {
    type: 'MENTORSHIP',
    title: 'Leadership Responsibility',
    description: 'The manager has asked you to be part of the leadership group. It\'s a sign of respect but comes with extra responsibility.',
    choices: [
      {
        id: 'embrace_leadership',
        label: 'Embrace the leadership role',
        description: 'Step up. The team needs leaders.',
        effects: { morale: 8, reputation: 8, attributes: { physical: 0.5 } },
      },
      {
        id: 'focus_on_performance',
        label: 'Prefer to lead by performance only',
        description: 'Your football does the talking. Skip the politics.',
        effects: { morale: 0, reputation: 2 },
      },
    ],
    conditions: (p) => p.age >= 26 && p.overall >= 75,
    weight: 4,
  },

  // ==========================================
  // SPONSORSHIP EVENTS (4 variants)
  // ==========================================
  {
    type: 'SPONSORSHIP',
    title: 'Major Endorsement Deal',
    description: 'A global sportswear brand offers you a lucrative endorsement deal. It\'s great money but requires significant media commitments.',
    choices: [
      {
        id: 'sign_deal',
        label: 'Sign the deal',
        description: 'Financial security and brand building. No brainer.',
        effects: { marketValue: 500000, reputation: 8, morale: 5, fitness: -3 },
      },
      {
        id: 'negotiate_terms',
        label: 'Negotiate for fewer media commitments',
        description: 'Take the deal but protect your training time.',
        effects: { marketValue: 300000, reputation: 5, morale: 3 },
      },
      {
        id: 'decline_deal',
        label: 'Decline to focus purely on football',
        description: 'Endorsements are a distraction. Football first.',
        effects: { reputation: 3, morale: 5, fitness: 2 },
      },
    ],
    conditions: (p) => p.reputation >= 55,
    weight: 5,
  },
  {
    type: 'SPONSORSHIP',
    title: 'Charity Campaign',
    description: 'A well-known charity wants you as the face of their new campaign. It\'s unpaid work but would significantly boost your public image.',
    choices: [
      {
        id: 'join_campaign',
        label: 'Join the campaign enthusiastically',
        description: 'Use your platform for good. The exposure is a bonus.',
        effects: { reputation: 12, morale: 8, fitness: -2 },
      },
      {
        id: 'make_donation',
        label: 'Make a generous donation instead',
        description: 'Support the cause without the time commitment.',
        effects: { reputation: 5, morale: 3, marketValue: -100000 },
      },
    ],
    weight: 5,
  },
  {
    type: 'SPONSORSHIP',
    title: 'Controversial Sponsor',
    description: 'A company with a controversial reputation offers you a sponsorship deal worth more than your current wage. The money is tempting but the PR risk is real.',
    choices: [
      {
        id: 'take_money',
        label: 'Take the deal',
        description: 'Money talks. You can manage any PR fallout.',
        effects: { marketValue: 800000, reputation: -15, morale: 5 },
      },
      {
        id: 'reject_deal',
        label: 'Reject the deal on principle',
        description: 'Your reputation is worth more than any paycheck.',
        effects: { reputation: 10, morale: 5 },
      },
    ],
    conditions: (p) => p.reputation >= 40,
    weight: 3,
  },
  {
    type: 'SPONSORSHIP',
    title: 'Local Business Partnership',
    description: 'A beloved local business near the club wants to partner with you for a community initiative. It\'s small scale but heartwarming.',
    choices: [
      {
        id: 'partner_up',
        label: 'Partner with the local business',
        description: 'Connect with the community. These are your people.',
        effects: { reputation: 5, morale: 8 },
      },
      {
        id: 'decline_gracefully',
        label: 'Decline gracefully',
        description: 'Your schedule is packed. Maybe another time.',
        effects: { reputation: 0, morale: 0 },
      },
    ],
    weight: 4,
  },
];

// ============================================================
// Public API
// ============================================================

// --- Get available event types based on context ---
export function getEventPool(player: Player, club: Club): EventType[] {
  const availableTypes: EventType[] = [];

  const eligibleTemplates = EVENT_TEMPLATES.filter(
    (t) => !t.conditions || t.conditions(player, club)
  );

  const uniqueTypes = Array.from(new Set(eligibleTemplates.map((t) => t.type)));
  availableTypes.push(...uniqueTypes);

  return availableTypes;
}

// --- Generate a random event ---
export function generateRandomEvent(
  player: Player,
  club: Club,
  season: number,
  week: number
): GameEvent | null {
  // Base probability of an event occurring each week: ~15%
  // Modified by player's reputation (higher rep = more events)
  const baseProbability = 0.12 + (player.reputation / 100) * 0.08;

  if (Math.random() > baseProbability) return null;

  // Filter eligible events
  const eligibleEvents = EVENT_TEMPLATES.filter(
    (t) => !t.conditions || t.conditions(player, club)
  );

  if (eligibleEvents.length === 0) return null;

  // Weighted random selection
  const totalWeight = eligibleEvents.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  let selectedTemplate: EventTemplate | null = null;
  for (const template of eligibleEvents) {
    roll -= template.weight;
    if (roll <= 0) {
      selectedTemplate = template;
      break;
    }
  }

  if (!selectedTemplate) {
    selectedTemplate = eligibleEvents[eligibleEvents.length - 1];
  }

  return {
    id: generateEventId(),
    type: selectedTemplate.type,
    title: selectedTemplate.title,
    description: selectedTemplate.description,
    choices: selectedTemplate.choices.map((c) => ({
      ...c,
      id: c.id,
    })),
    week,
    season,
    expires: true,
  };
}

// --- Resolve an event choice ---
export function resolveEventChoice(
  event: GameEvent,
  choiceId: string,
  player: Player
): { updatedPlayer: Partial<Player>; narrative: string } {
  const choice = event.choices.find((c) => c.id === choiceId);

  if (!choice) {
    return {
      updatedPlayer: {},
      narrative: 'You chose not to act on this situation. Life moves on.',
    };
  }

  const effects = choice.effects;
  const updatedPlayer: Partial<Player> = {};

  // Apply morale effects
  if (effects.morale !== undefined) {
    updatedPlayer.morale = clampValue(player.morale + effects.morale, 0, 100);
  }

  // Apply reputation effects
  if (effects.reputation !== undefined) {
    updatedPlayer.reputation = clampValue(player.reputation + effects.reputation, 0, 100);
  }

  // Apply fitness effects
  if (effects.fitness !== undefined) {
    updatedPlayer.fitness = clampValue(player.fitness + effects.fitness, 0, 100);
  }

  // Apply market value effects
  if (effects.marketValue !== undefined) {
    updatedPlayer.marketValue = Math.max(0, player.marketValue + effects.marketValue);
  }

  // Apply form effects
  if (effects.form !== undefined) {
    updatedPlayer.form = clampValue(player.form + effects.form, 1, 10);
  }

  // Apply injury effects
  if (effects.injuryWeeks !== undefined) {
    updatedPlayer.injuryWeeks = Math.max(0, player.injuryWeeks + effects.injuryWeeks);
  }

  // Apply squad status effects
  if (effects.squadStatus !== undefined) {
    updatedPlayer.squadStatus = effects.squadStatus as any;
  }

  // Apply attribute effects
  if (effects.attributes) {
    const newAttrs = { ...player.attributes };
    for (const [key, value] of Object.entries(effects.attributes)) {
      if (value !== undefined) {
        newAttrs[key as keyof import('./types').PlayerAttributes] = clampValue(
          newAttrs[key as keyof import('./types').PlayerAttributes] + value,
          1,
          99
        );
      }
    }
    updatedPlayer.attributes = newAttrs;
  }

  // Generate narrative text based on the choice
  const narrative = generateNarrative(event, choice, player);

  return { updatedPlayer, narrative };
}

// --- Generate narrative text for a resolved event ---
function generateNarrative(
  event: GameEvent,
  choice: EventChoice,
  player: Player
): string {
  const narratives: Record<string, string[]> = {
    push_for_move: [
      `You made your intentions clear to the club. The fans are divided - some understand your ambition, others feel betrayed. Transfer talks are now inevitable.`,
      `Your public stance has accelerated negotiations. The club knows they can't keep an unhappy player, but they're driving a hard bargain on the fee.`,
    ],
    stay_loyal: [
      `"I'm committed to this club," you told the press. The fans erupted in appreciation. Your loyalty has earned you immense respect in the dressing room.`,
      `The club responded to your loyalty with warmth. The manager praised your commitment, and the fans sang your name at the next match.`,
    ],
    let_agent_handle: [
      `You kept quiet publicly while your agent worked the channels. Smart move - negotiations are progressing without burning any bridges.`,
    ],
    embrace_adventure: [
      `The prospect of a new league excites you. Your agent is exploring options, and the interest is mutual from several clubs abroad.`,
    ],
    stay_home: [
      `You've decided your future lies in domestic football. There's still plenty to achieve here before considering a move abroad.`,
    ],
    consider_rival: [
      `The rival club's project is tempting, but the backlash from fans has been immediate. Social media is ablaze with divided opinions.`,
      `Word leaked about the approach. The atmosphere at training has been tense, but you stand by your professional decision.`,
    ],
    reject_rival: [
      `"I would never join them," you declared. The fans couldn't be happier. Your status as a club legend grows stronger.`,
    ],
    accept_loan: [
      `The loan move has been finalized. A fresh start at a new club with guaranteed minutes could be exactly what you need.`,
    ],
    fight_for_place: [
      `You've doubled down on earning your spot. Extra training sessions and a determined attitude - you'll prove the manager wrong.`,
    ],
    speak_candidly: [
      `Your honest assessment made headlines. Some praised your courage, others called it unprofessional. The debate rages on.`,
    ],
    diplomatic_response: [
      `Your measured response was noted by the media. No controversy, no headlines - just a professional handling a professional situation.`,
    ],
    walk_out: [
      `The footage of you leaving the press conference went viral. It's become a talking point, but the focus should be on the pitch.`,
    ],
    accept_documentary: [
      `The camera crew has started following you. It's strange having cameras in every corner of your life, but the exposure is unprecedented.`,
    ],
    decline_documentary: [
      `You chose to keep your privacy. The broadcaster moved on to another player, and you can focus entirely on football.`,
    ],
    deny_and_sue: [
      `Your legal team has issued a strong denial and threatened action. The newspaper is now on the back foot.`,
    ],
    apologize: [
      `Your apology, even for something you don't remember saying, has calmed the situation. The dressing room appreciates the gesture.`,
    ],
    ignore_it: [
      `The story is fading but some people still bring it up. Sometimes ignoring things doesn't make them go away.`,
    ],
    family_first: [
      `You rushed home immediately. The club understood completely - family always comes first. You'll rejoin the team when things settle.`,
    ],
    fulfill_commitments: [
      `You played the match with a heavy heart. Your performance suffered, and some fans questioned your focus. Family matters can't wait.`,
    ],
    invest_heavily: [
      `You've committed significant capital to the venture. Only time will tell if it was a wise decision.`,
    ],
    small_investment: [
      `A cautious investment. Enough to have skin in the game without risking too much of your hard-earned money.`,
    ],
    decline_investment: [
      `You decided to keep your focus on the pitch. There will be plenty of time for business ventures after your playing career.`,
    ],
    voice_concern: [
      `The manager listened to your concerns. While they didn't change everything, they made some adjustments that suit you better.`,
    ],
    accept_role: [
      `You embraced the new role. The manager noticed your professionalism and it hasn't gone unnoticed by the fans either.`,
    ],
    go_public: [
      `Your comments created a media firestorm. The manager was furious, and you've found yourself on the bench as a result.`,
    ],
    accept_mentor: [
      `The veteran's guidance has been invaluable. Small tips about positioning and preparation are already making a difference in your game.`,
      `Working closely with an experienced pro has accelerated your development. Their wisdom about the game is rubbing off on you.`,
    ],
    mentor_eagerly: [
      `Taking the young player under your wing has been rewarding. They're improving rapidly, and the manager has noticed your leadership qualities.`,
    ],
    sign_deal: [
      `The endorsement deal is official. Your face is on billboards and your bank account is healthier, but the media commitments are relentless.`,
    ],
    negotiate_terms: [
      `You struck a balance - the deal is done with reduced media obligations. Smart business without compromising your football.`,
    ],
    decline_deal: [
      `You turned down the money to stay focused on football. Purists respect the decision, but your agent thinks you left money on the table.`,
    ],
    join_campaign: [
      `The charity campaign featuring you has been a massive success. Your face is associated with a great cause, and the public loves it.`,
    ],
    take_money: [
      `The deal is signed, but the backlash on social media has been swift. Some fans are questioning your judgment.`,
    ],
    reject_deal: [
      `Your principled stand has earned widespread respect. Sometimes saying no is more powerful than any paycheck.`,
    ],
    listen_intently: [
      `The veteran's words resonated deeply. You've started implementing their advice about recovery and game management. It's already making a difference.`,
    ],
    embrace_leadership: [
      `You've embraced the leadership role. The younger players look up to you, and the manager trusts you with more responsibility.`,
    ],
    partner_up: [
      `The community initiative has been a hit. Local fans love seeing you engaged with the neighborhood. It's given you a deeper connection to the club.`,
    ],
  };

  const choiceNarratives = narratives[choice.id];
  if (choiceNarratives && choiceNarratives.length > 0) {
    return choiceNarratives[Math.floor(Math.random() * choiceNarratives.length)];
  }

  // Default narrative
  return `You chose to "${choice.label}". ${choice.description} Time will tell how this decision impacts your career.`;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
