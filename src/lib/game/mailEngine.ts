// ============================================================
// Elite Striker - In-Game Mail Engine
// Handles mail generation, categorization, and processing
// ============================================================

import { generateId, randomBetween } from './gameUtils';

export type MailCategory = 'club' | 'agent' | 'media' | 'fan' | 'sponsor' | 'league' | 'personal';
export type MailPriority = 'low' | 'normal' | 'high' | 'urgent';
export type MailStatus = 'unread' | 'read' | 'archived' | 'deleted';

export interface MailAttachment {
  id: string;
  type: 'contract' | 'photo' | 'document' | 'trophy';
  name: string;
  data?: any;
}

export interface GameMail {
  id: string;
  from: string;
  fromRole: string; // e.g. "Manager", "Agent", "Fan Club President"
  subject: string;
  body: string;
  category: MailCategory;
  priority: MailPriority;
  status: MailStatus;
  week: number;
  season: number;
  timestamp: string;
  attachments: MailAttachment[];
  requiresResponse: boolean;
  responseOptions?: MailResponseOption[];
  expiresWeek?: number;
  relatedEntityId?: string; // clubId, playerId, etc.
}

export interface MailResponseOption {
  id: string;
  label: string;
  effects: {
    reputation?: number;
    morale?: number;
    relationshipChange?: number;
    marketValue?: number;
  };
}

export interface MailFolder {
  id: string;
  name: string;
  icon: string;
  mailIds: string[];
}

// ============================================================
// Mail Templates
// ============================================================

const MAIL_TEMPLATES: Record<MailCategory, Array<{
  subjects: string[];
  bodies: string[];
  fromRoles: string[];
}>> = {
  club: [
    {
      subjects: ['Training Schedule Update', 'Team Meeting Tomorrow', 'Match Day Instructions', 'Facility Maintenance Notice'],
      bodies: [
        'Dear {playerName},\n\nPlease be advised that the training schedule has been updated for this week. Report to the training ground at 9:00 AM.\n\nBest regards,\n{fromRole}',
        'Hi {playerName},\n\nThere will be a mandatory team meeting tomorrow at 2:00 PM in the conference room. Your attendance is required.\n\nRegards,\n{fromRole}',
      ],
      fromRoles: ['Manager', 'Assistant Coach', 'Club Secretary', 'Head of Operations'],
    },
  ],
  agent: [
    {
      subjects: ['Contract Renewal Discussion', 'Transfer Interest Received', 'Sponsorship Opportunity', 'Market Value Update'],
      bodies: [
        'Hello {playerName},\n\nI\'ve received interest from several clubs regarding your services. Let\'s discuss your options and potential contract improvements.\n\nBest,\n{fromRole}',
        'Dear {playerName},\n\nYour current market value has been reassessed. Given your recent performances, we should consider renegotiating your contract terms.\n\nRegards,\n{fromRole}',
      ],
      fromRoles: ['Agent', 'Personal Manager', 'Legal Advisor'],
    },
  ],
  media: [
    {
      subjects: ['Interview Request', 'Feature Article Opportunity', 'Press Conference Invitation', 'Documentary Participation'],
      bodies: [
        'Dear {playerName},\n\nWe would like to request an exclusive interview for our upcoming feature on rising stars in football. Please let us know your availability.\n\nSincerely,\n{fromRole}',
      ],
      fromRoles: ['Sports Journalist', 'TV Producer', 'Magazine Editor', 'Podcast Host'],
    },
  ],
  fan: [
    {
      subjects: ['Fan Club Membership', 'Autograph Request', 'Meet & Greet Invitation', 'Support Message'],
      bodies: [
        'Dear {playerName},\n\nI\'ve been following your career since day one. Your performances inspire me every week. Keep up the amazing work!\n\nYours faithfully,\nA devoted fan',
        'Hi {playerName},\n\nOur local fan club would be honored if you could attend our annual gathering. Your presence would mean the world to us.\n\nBest wishes,\n{fromRole}',
      ],
      fromRoles: ['Fan Club President', 'Youth Supporter', 'Season Ticket Holder', 'International Fan'],
    },
  ],
  sponsor: [
    {
      subjects: ['Campaign Launch Update', 'Performance Bonus Achieved', 'New Partnership Proposal', 'Marketing Event Invitation'],
      bodies: [
        'Dear {playerName},\n\nWe\'re pleased to inform you that your latest performance has triggered a bonus payment under our sponsorship agreement.\n\nBest regards,\n{fromRole}',
      ],
      fromRoles: ['Brand Manager', 'Marketing Director', 'Partnership Lead'],
    },
  ],
  league: [
    {
      subjects: ['Disciplinary Notice', 'Award Nomination', 'League Announcement', 'Fixture Change Notice'],
      bodies: [
        'Dear {playerName},\n\nThis is to inform you of an upcoming change to the fixture schedule. Please check the updated calendar.\n\nRegards,\nLeague Administration',
      ],
      fromRoles: ['League Official', 'Disciplinary Committee', 'Awards Panel'],
    },
  ],
  personal: [
    {
      subjects: ['Birthday Wishes', 'Congratulations', 'Personal Milestone', 'Family Message'],
      bodies: [
        'Happy Birthday {playerName}! Wishing you all the best on your special day.\n\nFrom your friends at the club.',
      ],
      fromRoles: ['Friend', 'Family Member', 'Former Teammate'],
    },
  ],
};

// ============================================================
// Mail Generation Functions
// ============================================================

export function generateRandomMail(
  playerName: string,
  week: number,
  season: number,
  category?: MailCategory
): GameMail {
  const selectedCategory = category || getRandomCategory();
  const templates = MAIL_TEMPLATES[selectedCategory];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const fromRole = template.fromRoles[Math.floor(Math.random() * template.fromRoles.length)];
  const subject = template.subjects[Math.floor(Math.random() * template.subjects.length)];
  const body = template.bodies[Math.floor(Math.random() * template.bodies.length)]
    .replace('{playerName}', playerName)
    .replace('{fromRole}', fromRole);

  const priority = Math.random() > 0.8 ? 'high' : Math.random() > 0.95 ? 'urgent' : 'normal';

  return {
    id: generateId(),
    from: `${fromRole}`,
    fromRole,
    subject,
    body,
    category: selectedCategory,
    priority,
    status: 'unread',
    week,
    season,
    timestamp: new Date().toISOString(),
    attachments: [],
    requiresResponse: Math.random() > 0.7,
    responseOptions: Math.random() > 0.7 ? generateResponseOptions(selectedCategory) : undefined,
    expiresWeek: priority === 'urgent' ? week + 1 : undefined,
  };
}

export function generateWeeklyMail(
  playerName: string,
  week: number,
  season: number,
  playerStats: { goals: number; assists: number; rating: number },
  clubPerformance: 'excellent' | 'good' | 'average' | 'poor'
): GameMail[] {
  const mails: GameMail[] = [];

  // Performance-based mail
  if (playerStats.rating >= 8.0) {
    mails.push({
      id: generateId(),
      from: 'Manager',
      fromRole: 'Manager',
      subject: 'Outstanding Performance!',
      body: `Dear ${playerName},\n\nYour performance this week was exceptional. The coaching staff is very impressed with your contribution. Keep it up!\n\nBest regards,\nManager`,
      category: 'club',
      priority: 'high',
      status: 'unread',
      week,
      season,
      timestamp: new Date().toISOString(),
      attachments: [],
      requiresResponse: false,
    });
  }

  // Club performance mail
  if (clubPerformance === 'excellent') {
    mails.push({
      id: generateId(),
      from: 'Club Chairman',
      fromRole: 'Chairman',
      subject: 'Great Team Performance',
      body: `Dear ${playerName},\n\nThe club is performing exceptionally well this season. Your contributions have been invaluable. The board appreciates your efforts.\n\nRegards,\nChairman`,
      category: 'club',
      priority: 'normal',
      status: 'unread',
      week,
      season,
      timestamp: new Date().toISOString(),
      attachments: [],
      requiresResponse: false,
    });
  }

  // Random additional mail
  if (Math.random() > 0.5) {
    mails.push(generateRandomMail(playerName, week, season));
  }

  return mails;
}

export function generatePostMatchMail(
  playerName: string,
  week: number,
  season: number,
  result: 'win' | 'draw' | 'loss',
  playerRating: number,
  scored: boolean
): GameMail | null {
  if (scored && playerRating >= 8.0) {
    return {
      id: generateId(),
      from: 'Fans Association',
      fromRole: 'Fan Club President',
      subject: 'What a Goal!',
      body: `Dear ${playerName},\n\nIncredible performance today! Your goal was the highlight of the match. The fans are singing your name!\n\nKeep shining!\nFan Club President`,
      category: 'fan',
      priority: 'normal',
      status: 'unread',
      week,
      season,
      timestamp: new Date().toISOString(),
      attachments: [],
      requiresResponse: false,
    };
  }

  if (result === 'loss' && playerRating < 5.0) {
    return {
      id: generateId(),
      from: 'Manager',
      fromRole: 'Manager',
      subject: 'Review Session',
      body: `Dear ${playerName},\n\nToday's result was disappointing. I'd like to review some aspects of your performance in our next training session. Let's work together to improve.\n\nSee you tomorrow,\nManager`,
      category: 'club',
      priority: 'high',
      status: 'unread',
      week,
      season,
      timestamp: new Date().toISOString(),
      attachments: [],
      requiresResponse: true,
      responseOptions: [
        {
          id: 'accept_review',
          label: 'Accept feedback graciously',
          effects: { reputation: 5, morale: 5 },
        },
        {
          id: 'defend_performance',
          label: 'Defend your performance',
          effects: { reputation: -5, morale: -5 },
        },
      ],
    };
  }

  return null;
}

// ============================================================
// Helper Functions
// ============================================================

function getRandomCategory(): MailCategory {
  const categories: MailCategory[] = ['club', 'agent', 'media', 'fan', 'sponsor', 'league', 'personal'];
  const weights = [0.25, 0.15, 0.1, 0.2, 0.1, 0.1, 0.1];
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < categories.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) return categories[i];
  }

  return 'club';
}

function generateResponseOptions(category: MailCategory): MailResponseOption[] {
  switch (category) {
    case 'agent':
      return [
        { id: 'discuss_terms', label: 'Schedule meeting to discuss terms', effects: { reputation: 5 } },
        { id: 'wait_offers', label: 'Wait for better offers', effects: { marketValue: 100000 } },
      ];
    case 'media':
      return [
        { id: 'accept_interview', label: 'Accept interview request', effects: { reputation: 10 } },
        { id: 'decline_politely', label: 'Decline politely', effects: { reputation: -2 } },
      ];
    case 'fan':
      return [
        { id: 'send_autograph', label: 'Send signed photo', effects: { reputation: 15, morale: 5 } },
        { id: 'ignore', label: 'No response', effects: {} },
      ];
    default:
      return [
        { id: 'acknowledge', label: 'Acknowledge receipt', effects: { reputation: 2 } },
        { id: 'archive', label: 'Archive without response', effects: {} },
      ];
  }
}

export function getMailCategoryIcon(category: MailCategory): string {
  const icons: Record<MailCategory, string> = {
    club: '🏟️',
    agent: '💼',
    media: '📰',
    fan: '❤️',
    sponsor: '🤝',
    league: '🏆',
    personal: '👤',
  };
  return icons[category];
}

export function getMailPriorityColor(priority: MailPriority): string {
  const colors: Record<MailPriority, string> = {
    low: '#6b7280',
    normal: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444',
  };
  return colors[priority];
}

export function filterMailsByCategory(mails: GameMail[], category: MailCategory): GameMail[] {
  return mails.filter(mail => mail.category === category);
}

export function getUnreadCount(mails: GameMail[]): number {
  return mails.filter(mail => mail.status === 'unread').length;
}

export function sortMailsByDate(mails: GameMail[]): GameMail[] {
  return [...mails].sort((a, b) => {
    const dateA = new Date(`${a.season}-W${a.week}`).getTime();
    const dateB = new Date(`${b.season}-W${b.week}`).getTime();
    return dateB - dateA;
  });
}
