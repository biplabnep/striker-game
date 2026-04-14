'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  Mic, TrendingUp, TrendingDown, Newspaper,
  Heart, Flame, ArrowLeft, Shield, Star, Users,
  MessageSquare, Share2, Award, AlertTriangle,
  ChevronRight, Volume2, ThumbsUp, Zap,
  Camera, Eye, Crown, Handshake, Target, Send,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
type ResponseStyle = 'confident' | 'humble' | 'aggressive' | 'diplomatic';
type ConferenceType = 'post_match' | 'pre_match' | 'transfer_rumor';
type ConferencePhase = 'pre_conference' | 'questions' | 'consequence' | 'summary';
type MediaReaction = 'positive' | 'neutral' | 'negative' | 'controversial';

interface Journalist {
  name: string;
  outlet: string;
  initials: string;
  color: string;
}

interface PressQuestion {
  id: string;
  text: string;
  category: 'performance' | 'transfer' | 'team' | 'personal' | 'controversial';
  journalist: Journalist;
  answers: {
    style: ResponseStyle;
    text: string;
    effects: {
      mediaReputation: number;
      fanApproval: number;
      managerTrust: number;
      teamMorale: number;
      personalBrand: number;
    };
  }[];
}

interface AnswerRecord {
  questionId: string;
  style: ResponseStyle;
  text: string;
  journalist: Journalist;
  questionText: string;
  effects: {
    mediaReputation: number;
    fanApproval: number;
    managerTrust: number;
    teamMorale: number;
    personalBrand: number;
  };
}

// ============================================================
// Journalist Database
// ============================================================
const JOURNALISTS: Journalist[] = [
  { name: 'James Richardson', outlet: 'Sky Sports', initials: 'JR', color: '#ef4444' },
  { name: 'Marina Granovskaia', outlet: 'BBC Sport', initials: 'MG', color: '#3b82f6' },
  { name: 'Carlos Rodriguez', outlet: 'Marca', initials: 'CR', color: '#f59e0b' },
  { name: 'Sophie Taylor', outlet: 'The Athletic', initials: 'ST', color: '#10b981' },
  { name: 'Luigi Bianchi', outlet: 'Gazzetta dello Sport', initials: 'LB', color: '#6366f1' },
  { name: 'Emma Saunders', outlet: 'ESPN FC', initials: 'ES', color: '#ec4899' },
  { name: 'Hans Mueller', outlet: 'Kicker', initials: 'HM', color: '#8b5cf6' },
  { name: 'Patrice Dupont', outlet: 'L\'Equipe', initials: 'PD', color: '#06b6d4' },
  { name: 'Ahmed Hassan', outlet: 'BeIN Sports', initials: 'AH', color: '#f97316' },
  { name: 'Lisa Chen', outlet: 'Guardian Football', initials: 'LC', color: '#14b8a6' },
  { name: 'Tom Hopkins', outlet: 'TalkSport', initials: 'TH', color: '#e11d48' },
  { name: 'Isabella Santos', outlet: 'ESPN Brasil', initials: 'IS', color: '#22c55e' },
];

// ============================================================
// Response Style Config
// ============================================================
const STYLE_CONFIG: Record<ResponseStyle, {
  label: string;
  icon: React.ReactNode;
  borderColor: string;
  bgColor: string;
  textColor: string;
  description: string;
}> = {
  confident: {
    label: 'Confident',
    icon: <Crown className="w-4 h-4" />,
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    textColor: 'text-emerald-400',
    description: 'Boosts confidence & manager trust',
  },
  humble: {
    label: 'Humble',
    icon: <Heart className="w-4 h-4" />,
    borderColor: 'border-sky-500/40',
    bgColor: 'bg-sky-500/10 hover:bg-sky-500/20',
    textColor: 'text-sky-400',
    description: 'Boosts team morale & fan approval',
  },
  aggressive: {
    label: 'Aggressive',
    icon: <Flame className="w-4 h-4" />,
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    textColor: 'text-amber-400',
    description: 'Boosts brand but risks reputation',
  },
  diplomatic: {
    label: 'Diplomatic',
    icon: <Shield className="w-4 h-4" />,
    borderColor: 'border-violet-500/40',
    bgColor: 'bg-violet-500/10 hover:bg-violet-500/20',
    textColor: 'text-violet-400',
    description: 'Safe, balanced response',
  },
};

// ============================================================
// Question Bank (20+ questions)
// ============================================================
function makeQuestion(
  id: string,
  text: string,
  category: PressQuestion['category'],
  answers: PressQuestion['answers']
): PressQuestion {
  const journalist = JOURNALISTS[Math.floor(Math.random() * JOURNALISTS.length)];
  return { id, text, category, journalist, answers };
}

const QUESTION_BANK: Omit<PressQuestion, 'id' | 'journalist'>[] = [
  // --- Performance (5) ---
  {
    text: "You've been in incredible form recently. What's been the secret behind your performances?",
    category: 'performance',
    answers: [
      { style: 'confident', text: "Hard work and belief. I know what I'm capable of and I'm proving it every week.", effects: { mediaReputation: 5, fanApproval: 2, managerTrust: 4, teamMorale: 2, personalBrand: 3 } },
      { style: 'humble', text: "It's all about the team. My teammates create the opportunities, I just finish them.", effects: { mediaReputation: 2, fanApproval: 6, managerTrust: 3, teamMorale: 5, personalBrand: 1 } },
      { style: 'aggressive', text: "I'm the best player in this league right now and the stats prove it. Simple as that.", effects: { mediaReputation: 4, fanApproval: -2, managerTrust: -1, teamMorale: -2, personalBrand: 8 } },
      { style: 'diplomatic', text: "A combination of good training, great coaching, and a supportive environment. It all comes together.", effects: { mediaReputation: 3, fanApproval: 3, managerTrust: 3, teamMorale: 3, personalBrand: 1 } },
    ],
  },
  {
    text: "Your match rating today was exceptional. Did you feel you were at your best?",
    category: 'performance',
    answers: [
      { style: 'confident', text: "Absolutely. When I'm in the zone, there's no stopping me. That's the level I expect of myself.", effects: { mediaReputation: 4, fanApproval: 2, managerTrust: 3, teamMorale: 1, personalBrand: 4 } },
      { style: 'humble', text: "I'm never fully satisfied. There's always room to improve and I'll keep working at it.", effects: { mediaReputation: 2, fanApproval: 5, managerTrust: 4, teamMorale: 3, personalBrand: 1 } },
      { style: 'aggressive', text: "I was head and shoulders above everyone on the pitch. The rest need to catch up.", effects: { mediaReputation: 3, fanApproval: -3, managerTrust: -2, teamMorale: -3, personalBrand: 7 } },
      { style: 'diplomatic', text: "I'm happy with my contribution to the team result. Individual performances are secondary.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 5, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "The fans have been chanting your name. How does that support feel?",
    category: 'performance',
    answers: [
      { style: 'confident', text: "It's fantastic. The fans deserve to see great performances and that's what I deliver.", effects: { mediaReputation: 3, fanApproval: 4, managerTrust: 2, teamMorale: 2, personalBrand: 3 } },
      { style: 'humble', text: "It means everything. I play for the badge, the fans, and the club. They motivate me.", effects: { mediaReputation: 2, fanApproval: 7, managerTrust: 3, teamMorale: 4, personalBrand: 1 } },
      { style: 'aggressive', text: "Of course they chant my name — I'm the star of this team. They know who delivers.", effects: { mediaReputation: 3, fanApproval: 0, managerTrust: -3, teamMorale: -4, personalBrand: 6 } },
      { style: 'diplomatic', text: "The supporters have been amazing all season. Their energy fuels us every single match.", effects: { mediaReputation: 1, fanApproval: 5, managerTrust: 3, teamMorale: 4, personalBrand: 1 } },
    ],
  },
  {
    text: "You missed a key chance in the first half. What happened there?",
    category: 'performance',
    answers: [
      { style: 'confident', text: "One chance doesn't define me. I bounced back and showed my character in the second half.", effects: { mediaReputation: 3, fanApproval: 1, managerTrust: 3, teamMorale: 2, personalBrand: 2 } },
      { style: 'humble', text: "I hold my hands up — I should have done better. It's a learning experience.", effects: { mediaReputation: 4, fanApproval: 5, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
      { style: 'aggressive', text: "The pass was behind me. If the delivery was better, it would have been a goal. That's on the midfield.", effects: { mediaReputation: 2, fanApproval: -4, managerTrust: -4, teamMorale: -5, personalBrand: 4 } },
      { style: 'diplomatic', text: "These things happen in football. The important thing is the team got the result.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "You've already surpassed last season's goal tally. How do you explain this improvement?",
    category: 'performance',
    answers: [
      { style: 'confident', text: "I've evolved as a player. I'm smarter, fitter, and more ruthless in front of goal.", effects: { mediaReputation: 5, fanApproval: 3, managerTrust: 3, teamMorale: 2, personalBrand: 4 } },
      { style: 'humble', text: "The system suits me well this season. The manager and staff deserve huge credit.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 6, teamMorale: 3, personalBrand: 0 } },
      { style: 'aggressive', text: "Last year I was held back. Now I'm playing with freedom and showing my real quality.", effects: { mediaReputation: 4, fanApproval: -1, managerTrust: -3, teamMorale: -2, personalBrand: 7 } },
      { style: 'diplomatic', text: "Experience, better preparation, and understanding my role within the team setup.", effects: { mediaReputation: 3, fanApproval: 3, managerTrust: 4, teamMorale: 3, personalBrand: 1 } },
    ],
  },

  // --- Transfer (4) ---
  {
    text: "There are strong rumors linking you with a move away this summer. What's your response?",
    category: 'transfer',
    answers: [
      { style: 'confident', text: "I'm focused on this club. But I won't hide — I want to play at the highest level possible.", effects: { mediaReputation: 4, fanApproval: -1, managerTrust: -1, teamMorale: 0, personalBrand: 5 } },
      { style: 'humble', text: "I'm happy here. The club, fans, and teammates have been nothing but good to me.", effects: { mediaReputation: 2, fanApproval: 7, managerTrust: 5, teamMorale: 4, personalBrand: -1 } },
      { style: 'aggressive', text: "I'm too good for this level. I deserve to be playing Champions League football.", effects: { mediaReputation: 5, fanApproval: -6, managerTrust: -5, teamMorale: -5, personalBrand: 9 } },
      { style: 'diplomatic', text: "My agent handles transfer matters. I'm fully committed to giving my best for this club.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 4, teamMorale: 2, personalBrand: 1 } },
    ],
  },
  {
    text: "Would you consider a move to [top rival club] if they came calling?",
    category: 'transfer',
    answers: [
      { style: 'confident', text: "I respect every top club. But right now, my focus is 100% on succeeding here.", effects: { mediaReputation: 3, fanApproval: 0, managerTrust: 2, teamMorale: 1, personalBrand: 3 } },
      { style: 'humble', text: "I'd never join a rival. My loyalty to this club and these fans is genuine.", effects: { mediaReputation: 3, fanApproval: 8, managerTrust: 6, teamMorale: 5, personalBrand: -1 } },
      { style: 'aggressive', text: "In football, you never say never. A player's career is short — you have to make the right decisions.", effects: { mediaReputation: 4, fanApproval: -5, managerTrust: -4, teamMorale: -4, personalBrand: 7 } },
      { style: 'diplomatic', text: "I don't discuss hypothetical situations. I'm under contract and happy here.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 5, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "Reports suggest you've had meetings with a foreign club. Can you confirm?",
    category: 'transfer',
    answers: [
      { style: 'confident', text: "My agent meets with many clubs regularly. That's standard in football. I trust his judgment.", effects: { mediaReputation: 3, fanApproval: -2, managerTrust: 0, teamMorale: -1, personalBrand: 4 } },
      { style: 'humble', text: "I haven't met with anyone. I'm entirely focused on finishing the season strongly.", effects: { mediaReputation: 3, fanApproval: 6, managerTrust: 5, teamMorale: 4, personalBrand: -1 } },
      { style: 'aggressive', text: "So what if I did? Every ambitious player explores their options. I don't owe anyone an explanation.", effects: { mediaReputation: 4, fanApproval: -7, managerTrust: -5, teamMorale: -6, personalBrand: 8 } },
      { style: 'diplomatic', text: "There's nothing to confirm. I'm professionally represented and leave those matters to my agent.", effects: { mediaReputation: 2, fanApproval: 2, managerTrust: 3, teamMorale: 1, personalBrand: 1 } },
    ],
  },
  {
    text: "What would it take for you to sign a new contract here?",
    category: 'transfer',
    answers: [
      { style: 'confident', text: "A project that matches my ambition. I want to compete for trophies and play at the highest level.", effects: { mediaReputation: 4, fanApproval: 1, managerTrust: 2, teamMorale: 1, personalBrand: 4 } },
      { style: 'humble', text: "I've always said I'm open to extending. I love the club and want to stay long-term.", effects: { mediaReputation: 2, fanApproval: 7, managerTrust: 6, teamMorale: 4, personalBrand: -1 } },
      { style: 'aggressive', text: "Money talks. Show me the right deal and we can discuss.", effects: { mediaReputation: 3, fanApproval: -5, managerTrust: -2, teamMorale: -3, personalBrand: 6 } },
      { style: 'diplomatic', text: "Contract talks are private between my representatives and the club. They'll find the right time.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 4, teamMorale: 2, personalBrand: 0 } },
    ],
  },

  // --- Team (5) ---
  {
    text: "How would you describe your relationship with the manager?",
    category: 'team',
    answers: [
      { style: 'confident', text: "We have a great understanding. He trusts me and I deliver for him on the pitch.", effects: { mediaReputation: 3, fanApproval: 2, managerTrust: 6, teamMorale: 2, personalBrand: 2 } },
      { style: 'humble', text: "I owe a lot to the manager. He's helped develop my game and I'm grateful for every opportunity.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 7, teamMorale: 4, personalBrand: 0 } },
      { style: 'aggressive', text: "Let's just say we have different ideas about how the team should play. But I'm the professional.", effects: { mediaReputation: 4, fanApproval: -2, managerTrust: -6, teamMorale: -2, personalBrand: 5 } },
      { style: 'diplomatic', text: "We have a professional working relationship built on mutual respect and clear communication.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "Some of your teammates have been criticized recently. Do you think the criticism is fair?",
    category: 'team',
    answers: [
      { style: 'confident', text: "We win and lose as a team. The criticism affects everyone and we need to respond together.", effects: { mediaReputation: 2, fanApproval: 2, managerTrust: 3, teamMorale: 3, personalBrand: 1 } },
      { style: 'humble', text: "Every player goes through tough periods. We support each other in the dressing room.", effects: { mediaReputation: 2, fanApproval: 5, managerTrust: 4, teamMorale: 6, personalBrand: 0 } },
      { style: 'aggressive', text: "Some players need to look at themselves. The standards at this club are high and some aren't meeting them.", effects: { mediaReputation: 3, fanApproval: -3, managerTrust: -2, teamMorale: -7, personalBrand: 5 } },
      { style: 'diplomatic', text: "I prefer not to single out individuals. The coaching staff address these things internally.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 5, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "Who's the most underrated player in the squad?",
    category: 'team',
    answers: [
      { style: 'confident', text: "Honestly, I think several of us deserve more recognition. But the results speak for themselves.", effects: { mediaReputation: 2, fanApproval: 2, managerTrust: 3, teamMorale: 4, personalBrand: 1 } },
      { style: 'humble', text: "So many of the lads do the unseen work. Without them, I wouldn't get any of the headlines.", effects: { mediaReputation: 2, fanApproval: 6, managerTrust: 4, teamMorale: 7, personalBrand: 0 } },
      { style: 'aggressive', text: "I'd say me. People still don't realize just how good I am compared to the rest.", effects: { mediaReputation: 3, fanApproval: -4, managerTrust: -3, teamMorale: -3, personalBrand: 8 } },
      { style: 'diplomatic', text: "Every player in the squad has qualities they bring. It's a collective effort.", effects: { mediaReputation: 1, fanApproval: 4, managerTrust: 4, teamMorale: 5, personalBrand: 0 } },
    ],
  },
  {
    text: "Is there enough quality in the squad to achieve the season's objectives?",
    category: 'team',
    answers: [
      { style: 'confident', text: "Absolutely. We have the talent and the mentality. Now we need to show it consistently.", effects: { mediaReputation: 3, fanApproval: 2, managerTrust: 4, teamMorale: 4, personalBrand: 2 } },
      { style: 'humble', text: "We believe in ourselves but respect the opposition. Every game is a challenge.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 4, teamMorale: 4, personalBrand: 0 } },
      { style: 'aggressive', text: "We need reinforcements. The squad depth isn't where it needs to be at this level.", effects: { mediaReputation: 3, fanApproval: 0, managerTrust: -4, teamMorale: -4, personalBrand: 4 } },
      { style: 'diplomatic', text: "The manager and recruitment team make those decisions. As players, we focus on executing the game plan.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 5, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "There seems to be tension in the dressing room. Can you address that?",
    category: 'team',
    answers: [
      { style: 'confident', text: "Every winning team has competitive tension. It's what drives us to be better.", effects: { mediaReputation: 3, fanApproval: 1, managerTrust: 3, teamMorale: 1, personalBrand: 2 } },
      { style: 'humble', text: "We're like a family. Sometimes families disagree, but we always come together for matchday.", effects: { mediaReputation: 2, fanApproval: 5, managerTrust: 4, teamMorale: 5, personalBrand: 0 } },
      { style: 'aggressive', text: "There's no tension. That's media fabrication. Don't believe everything you read.", effects: { mediaReputation: 4, fanApproval: -1, managerTrust: -1, teamMorale: 0, personalBrand: 3 } },
      { style: 'diplomatic', text: "I won't discuss internal matters publicly. What happens in the dressing room stays there.", effects: { mediaReputation: 2, fanApproval: 2, managerTrust: 6, teamMorale: 2, personalBrand: 0 } },
    ],
  },

  // --- Personal (4) ---
  {
    text: "What are your personal ambitions for the rest of the season?",
    category: 'personal',
    answers: [
      { style: 'confident', text: "I want to win the Golden Boot and lead this team to silverware. Nothing less.", effects: { mediaReputation: 5, fanApproval: 2, managerTrust: 3, teamMorale: 2, personalBrand: 5 } },
      { style: 'humble', text: "I just want to keep improving and help the team in any way I can.", effects: { mediaReputation: 2, fanApproval: 5, managerTrust: 4, teamMorale: 4, personalBrand: 0 } },
      { style: 'aggressive', text: "Individual awards, team trophies, and a big-money move. That's the plan.", effects: { mediaReputation: 4, fanApproval: -2, managerTrust: -2, teamMorale: -1, personalBrand: 8 } },
      { style: 'diplomatic', text: "My priority is team success. Individual accolades are a byproduct of that.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 5, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "How do you handle the pressure of being one of the club's star players?",
    category: 'personal',
    answers: [
      { style: 'confident', text: "Pressure is a privilege. I thrive on it. The bigger the moment, the better I perform.", effects: { mediaReputation: 5, fanApproval: 3, managerTrust: 4, teamMorale: 2, personalBrand: 4 } },
      { style: 'humble', text: "I try not to think about it too much. I just focus on training hard and playing my game.", effects: { mediaReputation: 2, fanApproval: 5, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
      { style: 'aggressive', text: "What pressure? I'm the best player here — the pressure is on everyone else to keep up.", effects: { mediaReputation: 4, fanApproval: -3, managerTrust: -3, teamMorale: -4, personalBrand: 7 } },
      { style: 'diplomatic', text: "It's part of the job. I have good support from family, teammates, and staff.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "Who was your footballing idol growing up?",
    category: 'personal',
    answers: [
      { style: 'confident', text: "I watched the greats and studied their movements. I've taken elements from several legends.", effects: { mediaReputation: 3, fanApproval: 3, managerTrust: 2, teamMorale: 2, personalBrand: 3 } },
      { style: 'humble', text: "My dad was my biggest inspiration. He drove me to training in all weather and never missed a game.", effects: { mediaReputation: 3, fanApproval: 7, managerTrust: 3, teamMorale: 3, personalBrand: 1 } },
      { style: 'aggressive', text: "I don't model myself after anyone. I'm creating my own legacy and my own style.", effects: { mediaReputation: 4, fanApproval: 0, managerTrust: 0, teamMorale: 0, personalBrand: 6 } },
      { style: 'diplomatic', text: "Many players inspired me at different stages of my development. I'm grateful for all the influences.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 3, teamMorale: 2, personalBrand: 1 } },
    ],
  },
  {
    text: "Do you see yourself finishing your career at this club?",
    category: 'personal',
    answers: [
      { style: 'confident', text: "Never say never, but I'm focused on the present. The future will take care of itself.", effects: { mediaReputation: 3, fanApproval: 2, managerTrust: 3, teamMorale: 2, personalBrand: 2 } },
      { style: 'humble', text: "This club gave me my chance. I'd love nothing more than to be remembered as a club legend.", effects: { mediaReputation: 3, fanApproval: 8, managerTrust: 6, teamMorale: 5, personalBrand: 0 } },
      { style: 'aggressive', text: "That depends on whether the club matches my ambition. I won't settle for mediocrity.", effects: { mediaReputation: 4, fanApproval: -4, managerTrust: -4, teamMorale: -3, personalBrand: 6 } },
      { style: 'diplomatic', text: "Football is unpredictable. I'm happy now and that's what matters most.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
    ],
  },

  // --- Controversial (5) ---
  {
    text: "The referee made some questionable decisions today. Your thoughts?",
    category: 'controversial',
    answers: [
      { style: 'confident', text: "We have to be better than the refereeing decisions. Top teams overcome those moments.", effects: { mediaReputation: 3, fanApproval: 1, managerTrust: 4, teamMorale: 2, personalBrand: 1 } },
      { style: 'humble', text: "I don't like commenting on referees. They have a difficult job and I respect that.", effects: { mediaReputation: 3, fanApproval: 4, managerTrust: 5, teamMorale: 2, personalBrand: 0 } },
      { style: 'aggressive', text: "It was an absolute disgrace. VAR is ruining football and someone needs to say it.", effects: { mediaReputation: 5, fanApproval: 3, managerTrust: -5, teamMorale: -1, personalBrand: 7 } },
      { style: 'diplomatic', text: "There were moments both ways. I'd rather focus on what we can control — our own performance.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 5, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "Your rival's star player criticized your team in an interview. How do you respond?",
    category: 'controversial',
    answers: [
      { style: 'confident', text: "Talk is cheap. We'll settle it on the pitch. The result will speak for itself.", effects: { mediaReputation: 4, fanApproval: 3, managerTrust: 4, teamMorale: 3, personalBrand: 3 } },
      { style: 'humble', text: "Everyone is entitled to their opinion. I prefer to let my football do the talking.", effects: { mediaReputation: 2, fanApproval: 5, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
      { style: 'aggressive', text: "He should worry about his own form before commenting on us. We've got the points to prove who's better.", effects: { mediaReputation: 5, fanApproval: 2, managerTrust: -1, teamMorale: 2, personalBrand: 8 } },
      { style: 'diplomatic', text: "I won't engage in a war of words. Respect between competitors is important.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 5, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "You were seen arguing with a teammate during the match. What happened?",
    category: 'controversial',
    answers: [
      { style: 'confident', text: "Passion. We both want to win and sometimes emotions run high. It's resolved immediately.", effects: { mediaReputation: 3, fanApproval: 1, managerTrust: 3, teamMorale: 1, personalBrand: 2 } },
      { style: 'humble', text: "It was a misunderstanding. We're brothers on and off the pitch. Nothing to worry about.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 4, teamMorale: 5, personalBrand: 0 } },
      { style: 'aggressive', text: "Sometimes players need to be told. I'm not going to sugarcoat it when someone isn't performing.", effects: { mediaReputation: 4, fanApproval: -4, managerTrust: -3, teamMorale: -6, personalBrand: 6 } },
      { style: 'diplomatic', text: "We had a tactical discussion. That's completely normal during a match. No issue at all.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
    ],
  },
  {
    text: "A tabloid published a story about your personal life. Any comment?",
    category: 'controversial',
    answers: [
      { style: 'confident', text: "I'm aware of it. It's nonsense and my focus is entirely on football, as it always is.", effects: { mediaReputation: 3, fanApproval: 2, managerTrust: 3, teamMorale: 1, personalBrand: 2 } },
      { style: 'humble', text: "I ask that my private life is respected. I'll never let off-field matters affect my performances.", effects: { mediaReputation: 3, fanApproval: 5, managerTrust: 4, teamMorale: 2, personalBrand: 0 } },
      { style: 'aggressive', text: "The press has no decency. They'll print anything for clicks. It's pathetic.", effects: { mediaReputation: 4, fanApproval: 1, managerTrust: -2, teamMorale: 0, personalBrand: 7 } },
      { style: 'diplomatic', text: "I don't engage with tabloid stories. My representatives are handling it appropriately.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 4, teamMorale: 2, personalBrand: 0 } },
    ],
  },
  {
    text: "Some pundits say this team is overachieving. Do you agree?",
    category: 'controversial',
    answers: [
      { style: 'confident', text: "We're not overachieving — we're exactly where we deserve to be. This team has real quality.", effects: { mediaReputation: 4, fanApproval: 3, managerTrust: 4, teamMorale: 4, personalBrand: 2 } },
      { style: 'humble', text: "We respect all opinions. We'll keep working hard and let our results answer the critics.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
      { style: 'aggressive', text: "The pundits don't know what they're talking about. They sit in studios while we do the hard work.", effects: { mediaReputation: 5, fanApproval: 2, managerTrust: -1, teamMorale: 1, personalBrand: 7 } },
      { style: 'diplomatic', text: "Everyone is entitled to their opinion. We use that as motivation to keep improving.", effects: { mediaReputation: 2, fanApproval: 3, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
    ],
  },

  // --- Extra fillers (3 more for depth) ---
  {
    text: "What message would you send to the young fans watching at home?",
    category: 'personal',
    answers: [
      { style: 'confident', text: "Dream big, work hard, and never let anyone tell you it's not possible.", effects: { mediaReputation: 3, fanApproval: 6, managerTrust: 3, teamMorale: 2, personalBrand: 3 } },
      { style: 'humble', text: "Stay grounded, listen to your coaches, and enjoy every moment of the journey.", effects: { mediaReputation: 2, fanApproval: 8, managerTrust: 4, teamMorale: 3, personalBrand: 1 } },
      { style: 'aggressive', text: "Be ruthless. In football and in life, only the strongest survive.", effects: { mediaReputation: 3, fanApproval: 0, managerTrust: -1, teamMorale: 0, personalBrand: 6 } },
      { style: 'diplomatic', text: "Follow your passion, stay disciplined, and believe in yourself.", effects: { mediaReputation: 2, fanApproval: 6, managerTrust: 4, teamMorale: 2, personalBrand: 1 } },
    ],
  },
  {
    text: "How important is the support of your family during your career?",
    category: 'personal',
    answers: [
      { style: 'confident', text: "They're my foundation. Without their sacrifices, none of this would be possible.", effects: { mediaReputation: 3, fanApproval: 5, managerTrust: 2, teamMorale: 2, personalBrand: 2 } },
      { style: 'humble', text: "Everything. My family keeps me grounded and reminds me what truly matters.", effects: { mediaReputation: 2, fanApproval: 7, managerTrust: 3, teamMorale: 3, personalBrand: 1 } },
      { style: 'aggressive', text: "Football is my life. Family understands that and they know the sacrifices required.", effects: { mediaReputation: 3, fanApproval: -1, managerTrust: 0, teamMorale: 0, personalBrand: 5 } },
      { style: 'diplomatic', text: "Family support is invaluable in this profession. I'm very fortunate in that regard.", effects: { mediaReputation: 2, fanApproval: 5, managerTrust: 3, teamMorale: 2, personalBrand: 0 } },
    ],
  },
  {
    text: "The stadium atmosphere today was electric. Does it affect your performance?",
    category: 'performance',
    answers: [
      { style: 'confident', text: "It lifts me. When the crowd is behind you, you feel invincible.", effects: { mediaReputation: 3, fanApproval: 4, managerTrust: 2, teamMorale: 3, personalBrand: 2 } },
      { style: 'humble', text: "The fans are the 12th player. We feel their energy and it pushes us forward.", effects: { mediaReputation: 2, fanApproval: 7, managerTrust: 3, teamMorale: 5, personalBrand: 0 } },
      { style: 'aggressive', text: "I play the same whether there's one fan or 80,000. The crowd doesn't dictate my level.", effects: { mediaReputation: 3, fanApproval: -1, managerTrust: -1, teamMorale: -1, personalBrand: 6 } },
      { style: 'diplomatic', text: "A great atmosphere enhances the occasion but we stay focused on our game plan.", effects: { mediaReputation: 2, fanApproval: 4, managerTrust: 4, teamMorale: 3, personalBrand: 0 } },
    ],
  },
];

// ============================================================
// Helpers
// ============================================================
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickRandomQuestions(count: number, seed: number): PressQuestion[] {
  const rng = seededRandom(seed);
  const shuffled = [...QUESTION_BANK].sort(() => rng() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  return selected.map((q, i) => ({
    ...q,
    id: `pc-${seed}-${i}`,
    journalist: JOURNALISTS[Math.floor(rng() * JOURNALISTS.length)],
  }));
}

function computeMediaReaction(answers: AnswerRecord[]): MediaReaction {
  if (answers.length === 0) return 'neutral';
  const aggressiveCount = answers.filter(a => a.style === 'aggressive').length;
  const humbleCount = answers.filter(a => a.style === 'humble').length;
  const confidentCount = answers.filter(a => a.style === 'confident').length;
  const totalEffects = answers.reduce((sum, a) => {
    return sum + a.effects.mediaReputation + a.effects.fanApproval + a.effects.managerTrust;
  }, 0);

  if (aggressiveCount >= 3) return 'controversial';
  if (totalEffects < -5) return 'negative';
  if (totalEffects > 15 || confidentCount >= 3) return 'positive';
  if (humbleCount >= 3) return 'positive';
  return 'neutral';
}

function generateHeadline(answers: AnswerRecord[], playerName: string): string {
  const lastName = playerName.split(' ').pop() || playerName;
  const reaction = computeMediaReaction(answers);
  const aggressiveCount = answers.filter(a => a.style === 'aggressive').length;
  const humbleCount = answers.filter(a => a.style === 'humble').length;
  const confidentCount = answers.filter(a => a.style === 'confident').length;

  const positiveHeadlines = [
    `${lastName.toUpperCase()}'S INSPIRING WORDS WIN OVER THE PRESS`,
    `STAR ${lastName} HUMBLES MEDIA WITH CLASSY INTERVIEW`,
    `FANS RALLY BEHIND ${lastName.toUpperCase()} AFTER HEARTFELT PRESS CONFERENCE`,
    `${lastName.toUpperCase()} SHOWS CHAMPION MENTALITY IN PRESS ROOM`,
  ];

  const negativeHeadlines = [
    `${lastName.toUpperCase()} DIVIDES OPINION WITH POOR PRESS CONFERENCE`,
    `TENSION MOUNTS AFTER ${lastName}'S SUBDUED MEDIA APPEARANCE`,
    `PRESS ROOM AWKWARDNESS: ${lastName.toUpperCase()} UNDER FIRE`,
  ];

  const controversialHeadlines = [
    `${lastName.toUpperCase()}'S BOLD CLAIMS SHOCK FOOTBALL WORLD`,
    `WAR OF WORDS: ${lastName.toUpperCase()} LAYS INTO CRITICS`,
    `${lastName.toUpperCase()} SPARKS FUROR WITH CANDID COMMENTS`,
    `EXCLUSIVE: ${lastName.toUpperCase()} LEAVES REPORTERS STUNNED`,
    `"I'M THE BEST" — ${lastName.toUpperCase()}'S EXPLOSIVE PRESS CONFERENCE`,
  ];

  const neutralHeadlines = [
    `${lastName.toUpperCase()} ADDRESSES THE MEDIA AHEAD OF BIG WEEK`,
    `STAR SPEAKS: ${lastName.toUpperCase()} AT THE PRESS CONFERENCE`,
    `${lastName.toUpperCase()}'S MIDWEEK MEDIA AVAILABILITY`,
    `PRESS CONFERENCE: ${lastName.toUpperCase()} TACKLES THE BIG QUESTIONS`,
  ];

  let pool: string[];
  if (reaction === 'controversial') pool = controversialHeadlines;
  else if (reaction === 'positive') pool = positiveHeadlines;
  else if (reaction === 'negative') pool = negativeHeadlines;
  else pool = neutralHeadlines;

  return pool[Math.floor(Math.random() * pool.length)];
}

function computeSocialBuzz(answers: AnswerRecord[]): number {
  let buzz = 30;
  for (const a of answers) {
    if (a.style === 'aggressive') buzz += 18;
    else if (a.style === 'confident') buzz += 10;
    else if (a.style === 'humble') buzz += 5;
    buzz += a.effects.personalBrand;
  }
  return Math.min(100, Math.max(0, buzz));
}

function computeTotalEffects(answers: AnswerRecord[]) {
  const totals = { mediaReputation: 0, fanApproval: 0, managerTrust: 0, teamMorale: 0, personalBrand: 0 };
  for (const a of answers) {
    for (const key of Object.keys(totals) as (keyof typeof totals)[]) {
      totals[key] += a.effects[key];
    }
  }
  return totals;
}

// ============================================================
// Determine match context for pre-conference screen
// ============================================================
function getMatchContext(gameState: NonNullable<ReturnType<typeof useGameStore.getState>['gameState']>) {
  const lastMatch = gameState.recentResults[0];
  const clubId = gameState.currentClub.id;
  const opponent = lastMatch
    ? (lastMatch.homeClub.id === clubId ? lastMatch.awayClub : lastMatch.homeClub)
    : null;

  let resultLabel = 'No recent match';
  let resultColor = 'text-[#8b949e]';
  if (lastMatch) {
    const isHome = lastMatch.homeClub.id === clubId;
    const myScore = isHome ? lastMatch.homeScore : lastMatch.awayScore;
    const theirScore = isHome ? lastMatch.awayScore : lastMatch.homeScore;
    if (myScore > theirScore) { resultLabel = 'Win'; resultColor = 'text-emerald-400'; }
    else if (myScore < theirScore) { resultLabel = 'Loss'; resultColor = 'text-red-400'; }
    else { resultLabel = 'Draw'; resultColor = 'text-amber-400'; }
  }

  const nextFixture = gameState.upcomingFixtures.find(f => !f.played);
  const nextOpponent = nextFixture
    ? (nextFixture.homeClubId === clubId
        ? gameState.availableClubs.find(c => c.id === nextFixture.awayClubId)
        : gameState.availableClubs.find(c => c.id === nextFixture.homeClubId))
    : null;

  return {
    lastMatch,
    opponent,
    resultLabel,
    resultColor,
    scoreLine: lastMatch ? `${lastMatch.homeScore} - ${lastMatch.awayScore}` : '—',
    playerRating: lastMatch?.playerRating ?? 0,
    playerGoals: lastMatch?.playerGoals ?? 0,
    playerAssists: lastMatch?.playerAssists ?? 0,
    nextOpponent,
    conferenceType: lastMatch ? 'post_match' as ConferenceType : 'pre_match' as ConferenceType,
  };
}

// ============================================================
// Main Component
// ============================================================
export default function PressConferenceEnhanced() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);
  const player = gameState?.player;
  const currentClub = gameState?.currentClub;

  const [phase, setPhase] = useState<ConferencePhase>('pre_conference');
  const [questions, setQuestions] = useState<PressQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerRecord | null>(null);
  const [showQuestion, setShowQuestion] = useState(true);
  const [sharedOnSocial, setSharedOnSocial] = useState(false);
  const [journalistCount] = useState(() => 15 + Math.floor(Math.random() * 20));

  const matchContext = useMemo(() => {
    if (!gameState) return null;
    return getMatchContext(gameState);
  }, [gameState]);

  const conferenceType = (matchContext?.conferenceType ?? 'pre_match') as ConferenceType;

  const conferenceTypeLabel: Record<ConferenceType, string> = {
    post_match: 'Post-Match',
    pre_match: 'Pre-Match',
    transfer_rumor: 'Transfer Rumor',
  };

  const conferenceTypeIcon: Record<ConferenceType, string> = {
    post_match: '📰',
    pre_match: '🎙️',
    transfer_rumor: '💰',
  };

  // Generate questions when entering conference
  const startConference = useCallback(() => {
    const seed = Date.now();
    const count = 3 + Math.floor(Math.random() * 3); // 3-5
    setQuestions(pickRandomQuestions(count, seed));
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowQuestion(true);
    setPhase('questions');
  }, []);

  const currentQuestion = questions[currentIdx] ?? null;

  const handleAnswer = useCallback((style: ResponseStyle) => {
    if (!currentQuestion) return;
    const answer = currentQuestion.answers.find(a => a.style === style);
    if (!answer) return;

    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      style,
      text: answer.text,
      journalist: currentQuestion.journalist,
      questionText: currentQuestion.text,
      effects: { ...answer.effects },
    };

    setAnswers(prev => [...prev, record]);
    setSelectedAnswer(record);
    setShowQuestion(false);

    const isLast = currentIdx >= questions.length - 1;
    setTimeout(() => {
      setSelectedAnswer(null);
      if (isLast) {
        setPhase('summary');
      } else {
        setCurrentIdx(prev => prev + 1);
        setShowQuestion(true);
      }
    }, 1800);
  }, [currentQuestion, currentIdx, questions.length]);

  const handleApplyEffects = useCallback(() => {
    const gs = useGameStore.getState().gameState;
    if (!gs) return;

    const totals = computeTotalEffects(answers);
    const newMorale = Math.max(0, Math.min(100, gs.player.morale + totals.teamMorale));
    const newReputation = Math.max(0, Math.min(100, gs.player.reputation + totals.mediaReputation));

    useGameStore.setState({
      gameState: {
        ...gs,
        player: {
          ...gs.player,
          morale: newMorale,
          reputation: newReputation,
        },
      },
    });

    setScreen('dashboard');
  }, [answers, setScreen]);

  // Computed values
  const mediaReaction = useMemo(() => computeMediaReaction(answers), [answers]);
  const headline = useMemo(() => generateHeadline(answers, player?.name ?? 'Player'), [answers, player?.name]);
  const socialBuzz = useMemo(() => computeSocialBuzz(answers), [answers]);
  const totalEffects = useMemo(() => computeTotalEffects(answers), [answers]);

  if (!gameState || !player || !currentClub) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <p className="text-[#8b949e] text-sm">No active career found.</p>
      </div>
    );
  }

  const reactionConfig: Record<MediaReaction, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    positive: { label: 'Positive', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15', icon: <ThumbsUp className="w-5 h-5 text-emerald-400" /> },
    neutral: { label: 'Neutral', color: 'text-[#8b949e]', bgColor: 'bg-[#21262d]', icon: <MessageSquare className="w-5 h-5 text-[#8b949e]" /> },
    negative: { label: 'Negative', color: 'text-red-400', bgColor: 'bg-red-500/15', icon: <AlertTriangle className="w-5 h-5 text-red-400" /> },
    controversial: { label: 'Controversial', color: 'text-amber-400', bgColor: 'bg-amber-500/15', icon: <Flame className="w-5 h-5 text-amber-400" /> },
  };

  return (
    <div className="min-h-screen bg-[#0d1117] pb-24">
      <div className="max-w-lg mx-auto">
        {/* ======== PRE-CONFERENCE SCREEN ======== */}
        <AnimatePresence mode="wait">
          {phase === 'pre_conference' && (
            <motion.div
              key="pre-conference"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-4"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setScreen('dashboard')}
                  className="w-9 h-9 flex items-center justify-center border border-[#30363d] text-[#8b949e] hover:text-white hover:border-slate-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-white">Press Conference</h1>
                  <p className="text-xs text-[#8b949e]">Media Center</p>
                </div>
              </div>

              {/* Conference Type Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-[#161b22] border border-[#30363d] p-4 mb-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{conferenceTypeIcon[conferenceType]}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{conferenceTypeLabel[conferenceType]} Conference</p>
                      <p className="text-[10px] text-[#8b949e]">Season {gameState.currentSeason}, Week {gameState.currentWeek}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                  <Users className="w-3.5 h-3.5" />
                  <span>{journalistCount} journalists in attendance</span>
                </div>
              </motion.div>

              {/* Match Context Card */}
              {matchContext && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#161b22] border border-[#30363d] p-4 mb-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Match Context</span>
                  </div>

                  {matchContext.lastMatch ? (
                    <div className="space-y-3">
                      {/* Result */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{currentClub.logo}</span>
                          <span className="text-sm font-semibold text-white">{currentClub.shortName}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-lg font-black text-white">{matchContext.scoreLine}</span>
                          <p className={`text-[10px] font-bold ${matchContext.resultColor}`}>{matchContext.resultLabel}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#c9d1d9]">{matchContext.opponent?.shortName}</span>
                          <span className="text-xl">{matchContext.opponent?.logo}</span>
                        </div>
                      </div>

                      {/* Player Performance */}
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#30363d]">
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{matchContext.playerRating > 0 ? matchContext.playerRating.toFixed(1) : '—'}</p>
                          <p className="text-[9px] text-[#8b949e] uppercase tracking-wider">Rating</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{matchContext.playerGoals}</p>
                          <p className="text-[9px] text-[#8b949e] uppercase tracking-wider">Goals</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{matchContext.playerAssists}</p>
                          <p className="text-[9px] text-[#8b949e] uppercase tracking-wider">Assists</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-sm text-[#8b949e]">No recent match data available</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Player Info Card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-[#161b22] border border-[#30363d] p-4 mb-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 flex items-center justify-center text-sm font-bold text-white border border-[#30363d]"
                    style={{ backgroundColor: currentClub.primaryColor + '30', borderColor: currentClub.primaryColor + '50' }}
                  >
                    {player.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{player.name}</p>
                    <p className="text-[10px] text-[#8b949e]">{player.position} — {currentClub.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{player.overall}</p>
                    <p className="text-[9px] text-[#8b949e]">OVR</p>
                  </div>
                </div>
              </motion.div>

              {/* Current Stats Preview */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-[#161b22] border border-[#30363d] p-4 mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-[#8b949e]" />
                  <span className="text-xs font-semibold text-[#8b949e]">Current Stats</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-base font-bold text-amber-400">{player.reputation}</p>
                    <p className="text-[9px] text-[#8b949e] uppercase tracking-wider">Reputation</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-rose-400">{player.morale}</p>
                    <p className="text-[9px] text-[#8b949e] uppercase tracking-wider">Morale</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-violet-400">{player.form.toFixed(1)}</p>
                    <p className="text-[9px] text-[#8b949e] uppercase tracking-wider">Form</p>
                  </div>
                </div>
              </motion.div>

              {/* Enter Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={startConference}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  Enter Press Conference
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ======== QUESTIONS PHASE ======== */}
          {phase === 'questions' && currentQuestion && (
            <motion.div
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                    {conferenceTypeLabel[conferenceType]}
                  </span>
                </div>
                <span className="text-[10px] text-[#8b949e]">
                  Question {currentIdx + 1} of {questions.length}
                </span>
              </div>

              {/* Progress Dots */}
              <div className="flex gap-2 mb-5 justify-center">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 transition-all duration-300 ${
                      i < currentIdx
                        ? 'bg-emerald-400'
                        : i === currentIdx
                        ? 'bg-amber-400'
                        : 'bg-[#30363d]'
                    }`}
                    style={{ borderRadius: '50%' }}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {showQuestion && (
                  <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Journalist Card */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 flex items-center justify-center text-xs font-bold text-white border border-[#30363d]"
                        style={{ backgroundColor: currentQuestion.journalist.color + '30', borderColor: currentQuestion.journalist.color + '60' }}
                      >
                        {currentQuestion.journalist.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#c9d1d9]">{currentQuestion.journalist.name}</p>
                        <p className="text-[10px] text-[#8b949e]">{currentQuestion.journalist.outlet}</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-[9px] px-2 py-0.5 border border-[#30363d] text-[#8b949e] bg-[#161b22] uppercase tracking-wider">
                          {currentQuestion.category}
                        </span>
                      </div>
                    </div>

                    {/* Question Bubble */}
                    <div className="bg-[#161b22] border border-[#30363d] border-l-4 border-l-emerald-500 p-4 mb-5">
                      <p className="text-sm text-[#c9d1d9] leading-relaxed italic">
                        &ldquo;{currentQuestion.text}&rdquo;
                      </p>
                    </div>

                    {/* Response Options */}
                    <div className="space-y-2.5">
                      {currentQuestion.answers.map((answer) => {
                        const config = STYLE_CONFIG[answer.style];
                        return (
                          <button
                            key={answer.style}
                            onClick={() => handleAnswer(answer.style)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${config.borderColor} ${config.bgColor}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`shrink-0 w-8 h-8 flex items-center justify-center border ${config.borderColor} ${config.bgColor} ${config.textColor}`}>
                                {config.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-bold ${config.textColor}`}>{config.label}</span>
                                </div>
                                <p className="text-xs text-[#c9d1d9] leading-relaxed mb-2">
                                  {answer.text}
                                </p>
                                {/* Effect Indicators */}
                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                  {answer.effects.mediaReputation !== 0 && (
                                    <span className={`text-[9px] font-medium flex items-center gap-0.5 ${answer.effects.mediaReputation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {answer.effects.mediaReputation > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                      Media {answer.effects.mediaReputation > 0 ? '+' : ''}{answer.effects.mediaReputation}
                                    </span>
                                  )}
                                  {answer.effects.fanApproval !== 0 && (
                                    <span className={`text-[9px] font-medium flex items-center gap-0.5 ${answer.effects.fanApproval > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {answer.effects.fanApproval > 0 ? <Heart className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                      Fans {answer.effects.fanApproval > 0 ? '+' : ''}{answer.effects.fanApproval}
                                    </span>
                                  )}
                                  {answer.effects.managerTrust !== 0 && (
                                    <span className={`text-[9px] font-medium flex items-center gap-0.5 ${answer.effects.managerTrust > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {answer.effects.managerTrust > 0 ? <Handshake className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                      Manager {answer.effects.managerTrust > 0 ? '+' : ''}{answer.effects.managerTrust}
                                    </span>
                                  )}
                                  {answer.effects.personalBrand !== 0 && (
                                    <span className={`text-[9px] font-medium flex items-center gap-0.5 ${answer.effects.personalBrand > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {answer.effects.personalBrand > 0 ? <Star className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                      Brand {answer.effects.personalBrand > 0 ? '+' : ''}{answer.effects.personalBrand}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Consequence Display */}
                {!showQuestion && selectedAnswer && (
                  <motion.div
                    key={`consequence-${currentIdx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="py-8"
                  >
                    {/* Selected Response */}
                    <div className="bg-[#161b22] border border-[#30363d] p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckMark />
                        <span className="text-xs font-bold text-emerald-400">Your Response</span>
                      </div>
                      <p className="text-sm text-[#c9d1d9] leading-relaxed italic">
                        &ldquo;{selectedAnswer.text}&rdquo;
                      </p>
                    </div>

                    {/* Effects */}
                    <div className="bg-[#161b22] border border-[#30363d] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400">Immediate Impact</span>
                      </div>
                      <div className="space-y-2">
                        <EffectRow label="Media Reputation" value={selectedAnswer.effects.mediaReputation} />
                        <EffectRow label="Fan Approval" value={selectedAnswer.effects.fanApproval} />
                        <EffectRow label="Manager Trust" value={selectedAnswer.effects.managerTrust} />
                        <EffectRow label="Team Morale" value={selectedAnswer.effects.teamMorale} />
                        <EffectRow label="Personal Brand" value={selectedAnswer.effects.personalBrand} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ======== SUMMARY PHASE ======== */}
          {phase === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-4"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-5">
                <Newspaper className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Conference Summary</h2>
              </div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-[#161b22] border border-[#30363d] border-l-4 border-l-amber-500 p-4 mb-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span className="text-[9px] font-bold text-[#8b949e] uppercase tracking-wider">Trending Headline</span>
                </div>
                <p className="text-sm font-bold text-white leading-snug">{headline}</p>
              </motion.div>

              {/* Media Reaction */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-[#161b22] border border-[#30363d] p-4 mb-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-[#8b949e]" />
                  <span className="text-xs font-semibold text-[#8b949e]">Media Reaction</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {reactionConfig[mediaReaction].icon}
                    <span className={`text-sm font-bold ${reactionConfig[mediaReaction].color}`}>
                      {reactionConfig[mediaReaction].label}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-1 font-bold ${reactionConfig[mediaReaction].bgColor} ${reactionConfig[mediaReaction].color} border border-[#30363d]`}>
                    {mediaReaction.toUpperCase()}
                  </span>
                </div>
              </motion.div>

              {/* Social Media Buzz */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-[#161b22] border border-[#30363d] p-4 mb-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-semibold text-[#8b949e]">Social Media Buzz</span>
                  </div>
                  <span className={`text-sm font-bold ${
                    socialBuzz >= 70 ? 'text-amber-400' : socialBuzz >= 40 ? 'text-sky-400' : 'text-[#8b949e]'
                  }`}>
                    {socialBuzz}%
                  </span>
                </div>
                {/* Buzz Bar */}
                <div className="w-full h-2 bg-[#0d1117] border border-[#30363d] overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${socialBuzz}%`,
                      backgroundColor: socialBuzz >= 70 ? '#f59e0b' : socialBuzz >= 40 ? '#0ea5e9' : '#4b5563',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-[#484f58]">Low</span>
                  <span className="text-[9px] text-[#484f58]">Viral</span>
                </div>
              </motion.div>

              {/* Stats Affected */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-[#161b22] border border-[#30363d] p-4 mb-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">Stats Affected</span>
                </div>
                <div className="space-y-3">
                  <SummaryStatRow
                    label="Media Reputation"
                    current={player.reputation}
                    change={totalEffects.mediaReputation}
                    icon={<Newspaper className="w-3.5 h-3.5 text-amber-400" />}
                  />
                  <SummaryStatRow
                    label="Fan Approval"
                    current={80}
                    change={totalEffects.fanApproval}
                    icon={<Heart className="w-3.5 h-3.5 text-rose-400" />}
                  />
                  <SummaryStatRow
                    label="Manager Trust"
                    current={75}
                    change={totalEffects.managerTrust}
                    icon={<Handshake className="w-3.5 h-3.5 text-violet-400" />}
                  />
                  <SummaryStatRow
                    label="Team Morale"
                    current={player.morale}
                    change={totalEffects.teamMorale}
                    icon={<Users className="w-3.5 h-3.5 text-sky-400" />}
                  />
                </div>
              </motion.div>

              {/* Answer Breakdown */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-[#161b22] border border-[#30363d] p-4 mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-[#8b949e]" />
                  <span className="text-xs font-semibold text-[#8b949e]">Response Breakdown</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {answers.map((a, i) => {
                    const cfg = STYLE_CONFIG[a.style];
                    return (
                      <div key={i} className="flex items-center gap-2 py-1.5">
                        <div
                          className="w-5 h-5 flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: a.journalist.color + '50' }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold ${cfg.textColor}`}>{cfg.label}</span>
                            <span className="text-[9px] text-[#484f58]">—</span>
                            <span className="text-[9px] text-[#8b949e] truncate">{a.journalist.outlet}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {a.effects.mediaReputation !== 0 && (
                            <span className={`text-[8px] font-medium ${a.effects.mediaReputation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {a.effects.mediaReputation > 0 ? '+' : ''}{a.effects.mediaReputation}
                            </span>
                          )}
                          {a.effects.fanApproval !== 0 && (
                            <span className={`text-[8px] font-medium ${a.effects.fanApproval > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {a.effects.fanApproval > 0 ? '+' : ''}{a.effects.fanApproval}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Share Button (cosmetic) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-3"
              >
                <button
                  onClick={() => setSharedOnSocial(true)}
                  disabled={sharedOnSocial}
                  className={`w-full h-10 border flex items-center justify-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
                    sharedOnSocial
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:border-sky-500/40 hover:text-sky-400'
                  }`}
                >
                  {sharedOnSocial ? (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      Shared on Social Media
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share on Social Media
                    </>
                  )}
                </button>
              </motion.div>

              {/* Apply Effects Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  onClick={handleApplyEffects}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  Continue to Dashboard
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================
function CheckMark() {
  return (
    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function EffectRow({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#8b949e]">{label}</span>
      <span className={`text-xs font-bold ${isZero ? 'text-[#484f58]' : isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isZero ? '—' : `${isPositive ? '+' : ''}${value}`}
      </span>
    </div>
  );
}

function SummaryStatRow({
  label,
  current,
  change,
  icon,
}: {
  label: string;
  current: number;
  change: number;
  icon: React.ReactNode;
}) {
  const newValue = Math.max(0, Math.min(100, current + change));
  const isPositive = change > 0;
  const isZero = change === 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-[#8b949e]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#484f58]">{current}</span>
        {!isZero && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{change}
          </span>
        )}
        <span className="text-sm font-bold text-white">{newValue}</span>
      </div>
    </div>
  );
}
