'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Search, Eye, ChevronRight, Award, AlertTriangle,
  Clock, Users, BarChart3, Square, Diamond, Circle, Play,
  Triangle, Activity, TrendingUp, Star, Flag, Gavel,
  MonitorPlay, AlertOctagon, CheckCircle2, XCircle,
  BookOpen, Info, ArrowUpRight, ArrowDownRight, Minus,
  Zap, Target, ShieldCheck, Layers, Hash, Timer, ListChecks
} from 'lucide-react';

// ============================================================
// Types & Interfaces
// ============================================================

interface RefereeProfile {
  id: string;
  name: string;
  country: string;
  flag: string;
  experience: number;
  matchCount: number;
  rating: number;
  cardTendency: 'Strict' | 'Moderate' | 'Lenient';
  specialization: string;
  avgCardsPerGame: number;
  avgFoulsPerGame: number;
  penaltyFrequency: number;
  varUsageRate: number;
  tendencies: {
    cardFrequency: number;
    foulThreshold: number;
    advantagePlay: number;
    varReviews: number;
    bookingSpeed: number;
    injuryTime: number;
  };
  cardMagnetPositions: { position: string; percentage: number }[];
  controversyRating: number;
  recentMatches: { opponent: string; yellowCards: number; redCards: number; date: string }[];
}

interface VARIncident {
  id: string;
  incident: string;
  originalDecision: string;
  varDecision: string;
  overturned: boolean;
  minute: number;
  type: 'Goal/No Goal' | 'Penalty/No Penalty' | 'Red Card Review' | 'Offside' | 'Handball' | 'Foul Review';
  matchDay: string;
}

interface FairPlayClub {
  name: string;
  yellowCards: number;
  redCards: number;
  fouls: number;
  fairPlayPoints: number;
  isPlayerClub?: boolean;
  hasAward?: boolean;
}

interface DisciplineRecord {
  yellowCards: { date: string; match: string; reason: string }[];
  redCards: { date: string; match: string; reason: string }[];
  yellowCount: number;
  redCount: number;
  suspensionStatus: string;
  cardsUntilSuspension: number;
}

interface MatchIncident {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'substitution' | 'var_review';
  team: 'home' | 'away' | 'neutral';
  player?: string;
  detail?: string;
}

interface RefereeLeagueStat {
  name: string;
  cardsPerGame: number;
  varInterventionRate: number;
  foulsPerGame: number;
  rating: number;
}

// ============================================================
// Mock Data
// ============================================================

const refereeDatabase: RefereeProfile[] = [
  {
    id: 'r1', name: 'Felix Brych', country: 'Germany', flag: '🇩🇪',
    experience: 18, matchCount: 342, rating: 87, cardTendency: 'Strict',
    specialization: 'VAR Specialist', avgCardsPerGame: 4.8, avgFoulsPerGame: 23.5,
    penaltyFrequency: 3.2, varUsageRate: 0.42,
    tendencies: { cardFrequency: 82, foulThreshold: 30, advantagePlay: 35, varReviews: 78, bookingSpeed: 70, injuryTime: 55 },
    cardMagnetPositions: [
      { position: 'CB', percentage: 28 }, { position: 'CDM', percentage: 22 },
      { position: 'CM', percentage: 18 }, { position: 'ST', percentage: 15 },
      { position: 'RB', percentage: 10 }, { position: 'LW', percentage: 7 }
    ],
    controversyRating: 12,
    recentMatches: [
      { opponent: 'Arsenal vs Chelsea', yellowCards: 5, redCards: 1, date: 'Mar 8' },
      { opponent: 'Liverpool vs City', yellowCards: 7, redCards: 0, date: 'Feb 22' },
      { opponent: 'Bayern vs Dortmund', yellowCards: 6, redCards: 1, date: 'Feb 10' },
      { opponent: 'Real vs Barca', yellowCards: 4, redCards: 0, date: 'Jan 28' },
      { opponent: 'PSG vs Lyon', yellowCards: 3, redCards: 1, date: 'Jan 15' }
    ]
  },
  {
    id: 'r2', name: 'Anthony Taylor', country: 'England', flag: '🇬🇧',
    experience: 14, matchCount: 298, rating: 79, cardTendency: 'Moderate',
    specialization: 'High-Intensity Matches', avgCardsPerGame: 3.6, avgFoulsPerGame: 21.0,
    penaltyFrequency: 2.8, varUsageRate: 0.35,
    tendencies: { cardFrequency: 58, foulThreshold: 50, advantagePlay: 60, varReviews: 55, bookingSpeed: 52, injuryTime: 65 },
    cardMagnetPositions: [
      { position: 'CM', percentage: 25 }, { position: 'CB', percentage: 24 },
      { position: 'CDM', percentage: 20 }, { position: 'ST', percentage: 16 },
      { position: 'LB', percentage: 9 }, { position: 'RW', percentage: 6 }
    ],
    controversyRating: 18,
    recentMatches: [
      { opponent: 'Man Utd vs Spurs', yellowCards: 4, redCards: 0, date: 'Mar 5' },
      { opponent: 'Leicester vs Everton', yellowCards: 3, redCards: 0, date: 'Feb 19' },
      { opponent: 'Wolves vs Southampton', yellowCards: 5, redCards: 1, date: 'Feb 5' },
      { opponent: 'Newcastle vs Brighton', yellowCards: 3, redCards: 0, date: 'Jan 21' },
      { opponent: 'West Ham vs Palace', yellowCards: 4, redCards: 0, date: 'Jan 10' }
    ]
  },
  {
    id: 'r3', name: 'Clement Turpin', country: 'France', flag: '🇫🇷',
    experience: 15, matchCount: 310, rating: 81, cardTendency: 'Moderate',
    specialization: 'European Competitions', avgCardsPerGame: 3.9, avgFoulsPerGame: 22.1,
    penaltyFrequency: 3.0, varUsageRate: 0.38,
    tendencies: { cardFrequency: 62, foulThreshold: 48, advantagePlay: 55, varReviews: 60, bookingSpeed: 58, injuryTime: 60 },
    cardMagnetPositions: [
      { position: 'CB', percentage: 26 }, { position: 'CM', percentage: 22 },
      { position: 'CDM', percentage: 19 }, { position: 'ST', percentage: 17 },
      { position: 'LB', percentage: 10 }, { position: 'CAM', percentage: 6 }
    ],
    controversyRating: 15,
    recentMatches: [
      { opponent: 'PSG vs Marseille', yellowCards: 5, redCards: 0, date: 'Mar 3' },
      { opponent: 'Lyon vs Monaco', yellowCards: 4, redCards: 1, date: 'Feb 18' },
      { opponent: 'Juventus vs Napoli', yellowCards: 6, redCards: 0, date: 'Feb 4' },
      { opponent: 'Inter vs Milan', yellowCards: 4, redCards: 0, date: 'Jan 20' },
      { opponent: 'Arsenal vs Liverpool', yellowCards: 3, redCards: 0, date: 'Jan 8' }
    ]
  },
  {
    id: 'r4', name: 'Daniele Orsato', country: 'Italy', flag: '🇮🇹',
    experience: 20, matchCount: 380, rating: 85, cardTendency: 'Strict',
    specialization: 'Champions League', avgCardsPerGame: 5.1, avgFoulsPerGame: 25.0,
    penaltyFrequency: 3.5, varUsageRate: 0.45,
    tendencies: { cardFrequency: 88, foulThreshold: 25, advantagePlay: 30, varReviews: 80, bookingSpeed: 75, injuryTime: 50 },
    cardMagnetPositions: [
      { position: 'CB', percentage: 30 }, { position: 'CDM', percentage: 24 },
      { position: 'CM', percentage: 17 }, { position: 'ST', percentage: 14 },
      { position: 'RB', percentage: 8 }, { position: 'GK', percentage: 7 }
    ],
    controversyRating: 10,
    recentMatches: [
      { opponent: 'Real vs Atletico', yellowCards: 6, redCards: 1, date: 'Mar 6' },
      { opponent: 'Barca vs Sevilla', yellowCards: 5, redCards: 0, date: 'Feb 20' },
      { opponent: 'Inter vs Roma', yellowCards: 7, redCards: 2, date: 'Feb 3' },
      { opponent: 'Bayern vs Leipzig', yellowCards: 4, redCards: 0, date: 'Jan 18' },
      { opponent: 'Dortmund vs Leverkusen', yellowCards: 5, redCards: 1, date: 'Jan 5' }
    ]
  },
  {
    id: 'r5', name: 'Szymon Marciniak', country: 'Poland', flag: '🇵🇱',
    experience: 12, matchCount: 245, rating: 83, cardTendency: 'Moderate',
    specialization: 'Finals Expert', avgCardsPerGame: 4.0, avgFoulsPerGame: 22.8,
    penaltyFrequency: 3.1, varUsageRate: 0.40,
    tendencies: { cardFrequency: 65, foulThreshold: 45, advantagePlay: 58, varReviews: 62, bookingSpeed: 55, injuryTime: 58 },
    cardMagnetPositions: [
      { position: 'CM', percentage: 24 }, { position: 'CB', percentage: 23 },
      { position: 'CDM', percentage: 20 }, { position: 'ST', percentage: 16 },
      { position: 'LB', percentage: 10 }, { position: 'CAM', percentage: 7 }
    ],
    controversyRating: 11,
    recentMatches: [
      { opponent: 'Lech vs Legia', yellowCards: 4, redCards: 0, date: 'Mar 4' },
      { opponent: 'Ajax vs PSV', yellowCards: 5, redCards: 1, date: 'Feb 17' },
      { opponent: 'Benfica vs Porto', yellowCards: 6, redCards: 0, date: 'Feb 2' },
      { opponent: 'Napoli vs Fiorentina', yellowCards: 3, redCards: 0, date: 'Jan 19' },
      { opponent: 'Atletico vs Sociedad', yellowCards: 4, redCards: 0, date: 'Jan 6' }
    ]
  },
  {
    id: 'r6', name: 'Danny Makkelie', country: 'Netherlands', flag: '🇳🇱',
    experience: 10, matchCount: 198, rating: 76, cardTendency: 'Lenient',
    specialization: 'Youth Tournaments', avgCardsPerGame: 2.8, avgFoulsPerGame: 18.5,
    penaltyFrequency: 2.2, varUsageRate: 0.28,
    tendencies: { cardFrequency: 35, foulThreshold: 72, advantagePlay: 78, varReviews: 40, bookingSpeed: 38, injuryTime: 70 },
    cardMagnetPositions: [
      { position: 'CB', percentage: 22 }, { position: 'CDM', percentage: 20 },
      { position: 'CM', percentage: 18 }, { position: 'ST', percentage: 18 },
      { position: 'RB', percentage: 12 }, { position: 'LW', percentage: 10 }
    ],
    controversyRating: 22,
    recentMatches: [
      { opponent: 'Ajax vs Feyenoord', yellowCards: 3, redCards: 0, date: 'Mar 2' },
      { opponent: 'PSV vs Twente', yellowCards: 2, redCards: 0, date: 'Feb 16' },
      { opponent: 'Bremen vs Frankfurt', yellowCards: 3, redCards: 0, date: 'Feb 1' },
      { opponent: 'Lyon vs Lille', yellowCards: 2, redCards: 0, date: 'Jan 17' },
      { opponent: 'Betis vs Villarreal', yellowCards: 3, redCards: 0, date: 'Jan 4' }
    ]
  },
  {
    id: 'r7', name: 'Fernando Rapallini', country: 'Argentina', flag: '🇦🇷',
    experience: 13, matchCount: 260, rating: 78, cardTendency: 'Strict',
    specialization: 'South American Finals', avgCardsPerGame: 4.5, avgFoulsPerGame: 24.0,
    penaltyFrequency: 3.3, varUsageRate: 0.36,
    tendencies: { cardFrequency: 75, foulThreshold: 35, advantagePlay: 42, varReviews: 58, bookingSpeed: 68, injuryTime: 52 },
    cardMagnetPositions: [
      { position: 'CB', percentage: 27 }, { position: 'CDM', percentage: 23 },
      { position: 'CM', percentage: 19 }, { position: 'ST', percentage: 14 },
      { position: 'RB', percentage: 11 }, { position: 'LM', percentage: 6 }
    ],
    controversyRating: 16,
    recentMatches: [
      { opponent: 'River vs Boca', yellowCards: 6, redCards: 1, date: 'Mar 7' },
      { opponent: 'Palmeiras vs Flamengo', yellowCards: 5, redCards: 0, date: 'Feb 21' },
      { opponent: 'Estudiantes vs Racing', yellowCards: 4, redCards: 1, date: 'Feb 6' },
      { opponent: 'Atletico Mineiro vs Sao Paulo', yellowCards: 3, redCards: 0, date: 'Jan 22' },
      { opponent: 'Cruz Azul vs America', yellowCards: 5, redCards: 1, date: 'Jan 9' }
    ]
  },
  {
    id: 'r8', name: 'Mateu Lahoz', country: 'Spain', flag: '🇪🇸',
    experience: 16, matchCount: 320, rating: 74, cardTendency: 'Strict',
    specialization: 'La Liga Derby Specialist', avgCardsPerGame: 5.5, avgFoulsPerGame: 26.2,
    penaltyFrequency: 3.8, varUsageRate: 0.48,
    tendencies: { cardFrequency: 90, foulThreshold: 22, advantagePlay: 28, varReviews: 85, bookingSpeed: 80, injuryTime: 62 },
    cardMagnetPositions: [
      { position: 'CB', percentage: 29 }, { position: 'CDM', percentage: 25 },
      { position: 'CM', percentage: 20 }, { position: 'ST', percentage: 13 },
      { position: 'GK', percentage: 8 }, { position: 'RB', percentage: 5 }
    ],
    controversyRating: 25,
    recentMatches: [
      { opponent: 'Real vs Barca', yellowCards: 8, redCards: 2, date: 'Mar 9' },
      { opponent: 'Atletico vs Sevilla', yellowCards: 6, redCards: 1, date: 'Feb 23' },
      { opponent: 'Valencia vs Villarreal', yellowCards: 5, redCards: 0, date: 'Feb 8' },
      { opponent: 'Betis vs Real', yellowCards: 7, redCards: 1, date: 'Jan 25' },
      { opponent: 'Sociedad vs Athletic', yellowCards: 4, redCards: 0, date: 'Jan 12' }
    ]
  },
  {
    id: 'r9', name: 'Ovidiu Hațegan', country: 'Romania', flag: '🇷🇴',
    experience: 11, matchCount: 210, rating: 77, cardTendency: 'Moderate',
    specialization: 'Cup Matches', avgCardsPerGame: 3.8, avgFoulsPerGame: 21.5,
    penaltyFrequency: 2.9, varUsageRate: 0.34,
    tendencies: { cardFrequency: 60, foulThreshold: 48, advantagePlay: 55, varReviews: 52, bookingSpeed: 50, injuryTime: 60 },
    cardMagnetPositions: [
      { position: 'CM', percentage: 25 }, { position: 'CB', percentage: 22 },
      { position: 'CDM', percentage: 21 }, { position: 'ST', percentage: 16 },
      { position: 'LB', percentage: 9 }, { position: 'RM', percentage: 7 }
    ],
    controversyRating: 19,
    recentMatches: [
      { opponent: 'FCSB vs CFR Cluj', yellowCards: 4, redCards: 0, date: 'Mar 1' },
      { opponent: 'Dinamo vs Rapid', yellowCards: 5, redCards: 1, date: 'Feb 15' },
      { opponent: 'Shakhtar vs Dynamo', yellowCards: 4, redCards: 0, date: 'Jan 30' },
      { opponent: 'Slavia vs Sparta', yellowCards: 3, redCards: 0, date: 'Jan 16' },
      { opponent: 'Club Brugge vs Gent', yellowCards: 3, redCards: 0, date: 'Jan 3' }
    ]
  },
  {
    id: 'r10', name: 'Björn Kuipers', country: 'Netherlands', flag: '🇳🇱',
    experience: 17, matchCount: 335, rating: 82, cardTendency: 'Moderate',
    specialization: 'Europa League', avgCardsPerGame: 3.5, avgFoulsPerGame: 20.2,
    penaltyFrequency: 2.7, varUsageRate: 0.32,
    tendencies: { cardFrequency: 55, foulThreshold: 55, advantagePlay: 65, varReviews: 50, bookingSpeed: 48, injuryTime: 68 },
    cardMagnetPositions: [
      { position: 'CM', percentage: 23 }, { position: 'CB', percentage: 22 },
      { position: 'CDM', percentage: 19 }, { position: 'ST', percentage: 18 },
      { position: 'LB', percentage: 10 }, { position: 'RW', percentage: 8 }
    ],
    controversyRating: 14,
    recentMatches: [
      { opponent: 'Arsenal vs Slavia', yellowCards: 3, redCards: 0, date: 'Mar 8' },
      { opponent: 'Villarreal vs Dinamo', yellowCards: 4, redCards: 0, date: 'Feb 22' },
      { opponent: 'Roma vs Ajax', yellowCards: 4, redCards: 0, date: 'Feb 7' },
      { opponent: 'Molde vs PSV', yellowCards: 2, redCards: 0, date: 'Jan 24' },
      { opponent: ' Leicester vs Braga', yellowCards: 3, redCards: 0, date: 'Jan 11' }
    ]
  },
  {
    id: 'r11', name: 'Sandro Schärer', country: 'Switzerland', flag: '🇨🇭',
    experience: 8, matchCount: 150, rating: 73, cardTendency: 'Lenient',
    specialization: 'Friendly Internationals', avgCardsPerGame: 2.5, avgFoulsPerGame: 17.0,
    penaltyFrequency: 2.0, varUsageRate: 0.22,
    tendencies: { cardFrequency: 30, foulThreshold: 78, advantagePlay: 82, varReviews: 35, bookingSpeed: 32, injuryTime: 75 },
    cardMagnetPositions: [
      { position: 'CB', percentage: 20 }, { position: 'CM', percentage: 20 },
      { position: 'CDM', percentage: 18 }, { position: 'ST', percentage: 20 },
      { position: 'RB', percentage: 12 }, { position: 'CAM', percentage: 10 }
    ],
    controversyRating: 24,
    recentMatches: [
      { opponent: 'Basel vs Zurich', yellowCards: 2, redCards: 0, date: 'Mar 3' },
      { opponent: 'Young Boys vs Servette', yellowCards: 3, redCards: 0, date: 'Feb 17' },
      { opponent: 'Leverkusen vs Wolfsburg', yellowCards: 2, redCards: 0, date: 'Feb 1' },
      { opponent: 'Austria vs Switzerland', yellowCards: 2, redCards: 0, date: 'Jan 18' },
      { opponent: 'Lille vs Nice', yellowCards: 3, redCards: 0, date: 'Jan 5' }
    ]
  },
  {
    id: 'r12', name: 'Wilmar Roldan', country: 'Colombia', flag: '🇨🇴',
    experience: 14, matchCount: 270, rating: 75, cardTendency: 'Moderate',
    specialization: 'Copa Libertadores', avgCardsPerGame: 4.2, avgFoulsPerGame: 23.0,
    penaltyFrequency: 3.0, varUsageRate: 0.38,
    tendencies: { cardFrequency: 68, foulThreshold: 42, advantagePlay: 48, varReviews: 56, bookingSpeed: 62, injuryTime: 55 },
    cardMagnetPositions: [
      { position: 'CB', percentage: 26 }, { position: 'CDM', percentage: 22 },
      { position: 'CM', percentage: 19 }, { position: 'ST', percentage: 15 },
      { position: 'RB', percentage: 10 }, { position: 'LM', percentage: 8 }
    ],
    controversyRating: 20,
    recentMatches: [
      { opponent: 'Atletico Nacional vs Millonarios', yellowCards: 5, redCards: 1, date: 'Mar 5' },
      { opponent: 'Fluminense vs Palmeiras', yellowCards: 4, redCards: 0, date: 'Feb 19' },
      { opponent: 'Once Caldas vs Junior', yellowCards: 4, redCards: 1, date: 'Feb 4' },
      { opponent: 'Gremio vs Internacional', yellowCards: 5, redCards: 0, date: 'Jan 21' },
      { opponent: 'America vs Cali', yellowCards: 3, redCards: 0, date: 'Jan 8' }
    ]
  }
];

const varIncidents: VARIncident[] = [
  {
    id: 'v1', incident: 'Goal - Close-range header', originalDecision: 'Goal Awarded',
    varDecision: 'Goal Stands', overturned: false, minute: 34,
    type: 'Goal/No Goal', matchDay: 'MD 28 — Arsenal vs Liverpool'
  },
  {
    id: 'v2', incident: 'Penalty claim - Tackle in box', originalDecision: 'No Penalty',
    varDecision: 'Penalty Awarded', overturned: true, minute: 62,
    type: 'Penalty/No Penalty', matchDay: 'MD 27 — Chelsea vs Man Utd'
  },
  {
    id: 'v3', incident: 'Potential red card - Last man foul', originalDecision: 'Yellow Card',
    varDecision: 'Red Card (Second Yellow)', overturned: true, minute: 78,
    type: 'Red Card Review', matchDay: 'MD 26 — Tottenham vs Newcastle'
  },
  {
    id: 'v4', incident: 'Offside check on goal', originalDecision: 'Goal Awarded',
    varDecision: 'Offside — Goal Disallowed', overturned: true, minute: 45,
    type: 'Offside', matchDay: 'MD 28 — Man City vs Everton'
  },
  {
    id: 'v5', incident: 'Handball in penalty area', originalDecision: 'No Foul',
    varDecision: 'No Handball — Play On', overturned: false, minute: 55,
    type: 'Handball', matchDay: 'MD 27 — Leicester vs Wolves'
  },
  {
    id: 'v6', incident: 'Reckless challenge - Two-footed lunge', originalDecision: 'Yellow Card',
    varDecision: 'Straight Red Card', overturned: true, minute: 71,
    type: 'Foul Review', matchDay: 'MD 28 — Brighton vs Southampton'
  }
];

const fairPlayTable: FairPlayClub[] = [
  { name: 'Brighton', yellowCards: 32, redCards: 1, fouls: 285, fairPlayPoints: 98, hasAward: true },
  { name: 'Liverpool', yellowCards: 35, redCards: 1, fouls: 310, fairPlayPoints: 96 },
  { name: 'Arsenal', yellowCards: 38, redCards: 2, fouls: 320, fairPlayPoints: 93 },
  { name: 'Your Club', yellowCards: 40, redCards: 1, fouls: 335, fairPlayPoints: 91, isPlayerClub: true },
  { name: 'Man City', yellowCards: 42, redCards: 2, fouls: 340, fairPlayPoints: 88 },
  { name: 'Chelsea', yellowCards: 45, redCards: 3, fouls: 360, fairPlayPoints: 84 },
  { name: 'Tottenham', yellowCards: 48, redCards: 2, fouls: 370, fairPlayPoints: 81 },
  { name: 'Newcastle', yellowCards: 50, redCards: 3, fouls: 390, fairPlayPoints: 77 },
  { name: 'Man Utd', yellowCards: 52, redCards: 4, fouls: 405, fairPlayPoints: 73 },
  { name: 'Wolves', yellowCards: 55, redCards: 4, fouls: 420, fairPlayPoints: 69 },
];

const matchIncidents: MatchIncident[] = [
  { minute: 12, type: 'foul', team: 'home', player: 'B. Fernandes', detail: 'Late tackle' },
  { minute: 18, type: 'yellow_card', team: 'home', player: 'B. Fernandes', detail: 'Reckless challenge' },
  { minute: 23, type: 'goal', team: 'away', player: 'M. Salah', detail: 'Counter-attack finish' },
  { minute: 31, type: 'foul', team: 'away', player: 'V. van Dijk', detail: 'Holding' },
  { minute: 38, type: 'substitution', team: 'home', player: 'A. Martial → M. Rashford', detail: 'Tactical' },
  { minute: 44, type: 'goal', team: 'home', player: 'B. Fernandes', detail: 'Free-kick' },
  { minute: 52, type: 'var_review', team: 'neutral', detail: 'Offside check on goal' },
  { minute: 55, type: 'yellow_card', team: 'away', player: 'A. Robertson', detail: 'Professional foul' },
  { minute: 63, type: 'foul', team: 'home', player: 'L. Shaw', detail: 'Tripping' },
  { minute: 67, type: 'substitution', team: 'away', player: 'D. Jota → D. Nunez', detail: 'Fatigue' },
  { minute: 71, type: 'red_card', team: 'home', player: 'C. Casemiro', detail: 'Second yellow - violent conduct' },
  { minute: 78, type: 'goal', team: 'away', player: 'M. Salah', detail: 'Header from corner' },
  { minute: 83, type: 'var_review', team: 'neutral', detail: 'Possible handball in box' },
  { minute: 85, type: 'foul', team: 'away', player: 'T. Alexander-Arnold', detail: 'Blocking' },
  { minute: 89, type: 'yellow_card', team: 'away', player: 'T. Alexander-Arnold', detail: 'Time wasting' },
  { minute: 90, type: 'substitution', team: 'home', player: 'J. Garnacho → A. Garnacho', detail: 'Fresh legs' },
];

const disciplineRecord: DisciplineRecord = {
  yellowCards: [
    { date: 'Mar 8', match: 'vs Arsenal', reason: 'Reckless tackle' },
    { date: 'Feb 19', match: 'vs Wolves', reason: 'Dissent' },
    { date: 'Jan 28', match: 'vs Brighton', reason: 'Persistent fouling' },
  ],
  redCards: [
    { date: 'Feb 5', match: 'vs Tottenham', reason: 'Second yellow card' },
  ],
  yellowCount: 3,
  redCount: 1,
  suspensionStatus: 'clean',
  cardsUntilSuspension: 2,
};

const refereeLeagueStats: RefereeLeagueStat[] = [
  { name: 'Mateu Lahoz', cardsPerGame: 5.5, varInterventionRate: 0.48, foulsPerGame: 26.2, rating: 74 },
  { name: 'Daniele Orsato', cardsPerGame: 5.1, varInterventionRate: 0.45, foulsPerGame: 25.0, rating: 85 },
  { name: 'Felix Brych', cardsPerGame: 4.8, varInterventionRate: 0.42, foulsPerGame: 23.5, rating: 87 },
  { name: 'Fernando Rapallini', cardsPerGame: 4.5, varInterventionRate: 0.36, foulsPerGame: 24.0, rating: 78 },
  { name: 'Wilmar Roldan', cardsPerGame: 4.2, varInterventionRate: 0.38, foulsPerGame: 23.0, rating: 75 },
  { name: 'Szymon Marciniak', cardsPerGame: 4.0, varInterventionRate: 0.40, foulsPerGame: 22.8, rating: 83 },
  { name: 'Clement Turpin', cardsPerGame: 3.9, varInterventionRate: 0.38, foulsPerGame: 22.1, rating: 81 },
  { name: 'Anthony Taylor', cardsPerGame: 3.6, varInterventionRate: 0.35, foulsPerGame: 21.0, rating: 79 },
  { name: 'Björn Kuipers', cardsPerGame: 3.5, varInterventionRate: 0.32, foulsPerGame: 20.2, rating: 82 },
  { name: 'Ovidiu Hațegan', cardsPerGame: 3.8, varInterventionRate: 0.34, foulsPerGame: 21.5, rating: 77 },
  { name: 'Danny Makkelie', cardsPerGame: 2.8, varInterventionRate: 0.28, foulsPerGame: 18.5, rating: 76 },
  { name: 'Sandro Schärer', cardsPerGame: 2.5, varInterventionRate: 0.22, foulsPerGame: 17.0, rating: 73 },
];

const nextMatchReferee = refereeDatabase[0];
const assistantReferees = [
  { role: 'AR1', name: 'Christian Gittelmann', flag: '🇩🇪' },
  { role: 'AR2', name: 'Mark Borsch', flag: '🇩🇪' },
  { role: 'Fourth Official', name: 'Bastian Dankert', flag: '🇩🇪' },
];
const varReferee = { name: 'Wolfgang Stark', flag: '🇩🇪', status: 'Active' };

// ============================================================
// Helper Components
// ============================================================

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-emerald-400">{icon}</span>
      <h3 className="text-sm font-semibold text-[#c9d1d9]">{title}</h3>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#161b22] border border-[#30363d] rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}

function StatLabel({ label, value, color = 'text-[#c9d1d9]' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-[#8b949e] leading-tight text-center">{label}</span>
    </div>
  );
}

function TendencyBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percentage = Math.min((value / max) * 100, 100);
  const barColor = value >= 75 ? 'bg-red-500' : value >= 50 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b949e]">{label}</span>
        <span className="text-xs font-semibold text-[#c9d1d9]">{value}</span>
      </div>
      <div className="w-full h-2 bg-[#0d1117] rounded-sm overflow-hidden">
        <div className={`h-full ${barColor} rounded-sm transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function getRatingColor(rating: number): string {
  if (rating >= 85) return 'text-emerald-400';
  if (rating >= 75) return 'text-emerald-500';
  if (rating >= 65) return 'text-amber-500';
  return 'text-red-500';
}

function getRatingBg(rating: number): string {
  if (rating >= 85) return 'bg-emerald-500';
  if (rating >= 75) return 'bg-emerald-600';
  if (rating >= 65) return 'bg-amber-500';
  return 'bg-red-500';
}

function getTendencyColor(tendency: string): string {
  if (tendency === 'Strict') return 'text-red-400 bg-red-500/15';
  if (tendency === 'Moderate') return 'text-amber-400 bg-amber-500/15';
  return 'text-emerald-400 bg-emerald-500/15';
}

// ============================================================
// Main Component
// ============================================================

export default function RefereeSystem() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedReferee, setSelectedReferee] = useState<RefereeProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tendencyFilter, setTendencyFilter] = useState<'all' | 'Strict' | 'Moderate' | 'Lenient'>('all');

  // Filter referee database
  const filteredReferees = useMemo(() => {
    return refereeDatabase.filter(r => {
      const matchesSearch = searchQuery.trim() === '' ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.country.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTendency = tendencyFilter === 'all' || r.cardTendency === tendencyFilter;
      return matchesSearch && matchesTendency;
    });
  }, [searchQuery, tendencyFilter]);

  const tabs = [
    { label: 'Next Match', icon: <Eye className="h-4 w-4" /> },
    { label: 'Referee DB', icon: <Users className="h-4 w-4" /> },
    { label: 'Tendencies', icon: <Target className="h-4 w-4" /> },
    { label: 'Discipline', icon: <AlertTriangle className="h-4 w-4" /> },
    { label: 'VAR', icon: <MonitorPlay className="h-4 w-4" /> },
    { label: 'Fair Play', icon: <ShieldCheck className="h-4 w-4" /> },
    { label: 'Timeline', icon: <Clock className="h-4 w-4" /> },
    { label: 'Deep Dive', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  // VAR stats
  const overturnedCount = varIncidents.filter(v => v.overturned).length;
  const totalVarIncidents = varIncidents.length;
  const avgReviewTime = 1.8;

  // Discipline calculations
  const playerLeagueAvgYellow = 3.2;
  const playerLeagueAvgRed = 0.4;

  // Match incident breakdown
  const incidentBreakdown = useMemo(() => {
    const counts: Record<string, number> = { goal: 0, yellow_card: 0, red_card: 0, foul: 0, substitution: 0, var_review: 0 };
    matchIncidents.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return counts;
  }, []);

  // Referee league stats calculations
  const mostCardHappy = refereeLeagueStats.reduce((a, b) => a.cardsPerGame > b.cardsPerGame ? a : b);
  const mostLenient = refereeLeagueStats.reduce((a, b) => a.cardsPerGame < b.cardsPerGame ? a : b);
  const highestVarRate = refereeLeagueStats.reduce((a, b) => a.varInterventionRate > b.varInterventionRate ? a : b);
  const avgFoulsAllReferees = (refereeLeagueStats.reduce((s, r) => s + r.foulsPerGame, 0) / refereeLeagueStats.length).toFixed(1);
  const refereeOfSeason = refereeLeagueStats.reduce((a, b) => a.rating > b.rating ? a : b);

  // ============================================================
  // Section 1: Match Official Overview
  // ============================================================
  const renderMatchOfficialOverview = () => (
    <div className="space-y-3">
      {/* Main Referee Card */}
      <Card>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nextMatchReferee.flag}</span>
            <div>
              <h4 className="text-base font-semibold text-[#c9d1d9]">{nextMatchReferee.name}</h4>
              <p className="text-xs text-[#8b949e]">{nextMatchReferee.country}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-lg font-bold ${getRatingColor(nextMatchReferee.rating)}`}>
              {nextMatchReferee.rating}
            </span>
            <span className="text-[10px] text-[#8b949e]">Rating</span>
          </div>
        </div>

        {/* Rating Bar */}
        <div className="w-full h-1.5 bg-[#0d1117] rounded-sm overflow-hidden mb-4">
          <div className={`h-full ${getRatingBg(nextMatchReferee.rating)} rounded-sm`}
            style={{ width: `${nextMatchReferee.rating}%` }} />
        </div>

        {/* Experience & Match Count */}
        <div className="flex gap-6 mb-4">
          <div>
            <span className="text-sm font-semibold text-emerald-400">{nextMatchReferee.experience}</span>
            <span className="text-xs text-[#8b949e] ml-1">years exp.</span>
          </div>
          <div>
            <span className="text-sm font-semibold text-emerald-400">{nextMatchReferee.matchCount}</span>
            <span className="text-xs text-[#8b949e] ml-1">matches</span>
          </div>
          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${getTendencyColor(nextMatchReferee.cardTendency)}`}>
              {nextMatchReferee.cardTendency}
            </span>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <span className="text-sm font-bold text-amber-400">{nextMatchReferee.avgCardsPerGame}</span>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Avg Cards</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <span className="text-sm font-bold text-[#c9d1d9]">{nextMatchReferee.avgFoulsPerGame}</span>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Avg Fouls</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <span className="text-sm font-bold text-red-400">{nextMatchReferee.penaltyFrequency}</span>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Pen Freq</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <span className="text-sm font-bold text-emerald-400">{(nextMatchReferee.varUsageRate * 100).toFixed(0)}%</span>
            <p className="text-[10px] text-[#8b949e] mt-0.5">VAR Rate</p>
          </div>
        </div>
      </Card>

      {/* Assistant Referees */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-3.5 w-3.5 text-[#8b949e]" />
          <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-wide">Match Officials</span>
        </div>
        <div className="space-y-2">
          {assistantReferees.map(ar => (
            <div key={ar.role} className="flex items-center justify-between py-1.5 border-b border-[#30363d]/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-emerald-400 w-20">{ar.role}</span>
                <span className="text-sm text-[#c9d1d9]">{ar.name}</span>
              </div>
              <span className="text-lg">{ar.flag}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-400 w-20">VAR</span>
              <span className="text-sm text-[#c9d1d9]">{varReferee.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-sm">
                {varReferee.status}
              </span>
              <span className="text-lg">{varReferee.flag}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // ============================================================
  // Section 2: Referee Profile Database
  // ============================================================
  const renderRefereeDatabase = () => (
    <div className="space-y-3">
      {/* Search & Filter */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-3.5 w-3.5 text-[#8b949e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search referee by name or country..."
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'Strict', 'Moderate', 'Lenient'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTendencyFilter(f)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-sm transition-colors ${
                tendencyFilter === f
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9]'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </Card>

      {/* Referee Cards Grid */}
      <div className="space-y-2">
        {filteredReferees.map(ref => (
          <Card
            key={ref.id}
            className="cursor-pointer hover:border-emerald-500/30 transition-colors"
          >
            <div
              className="flex items-center justify-between"
              onClick={() => setSelectedReferee(ref)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ref.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[#c9d1d9]">{ref.name}</h4>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${getTendencyColor(ref.cardTendency)}`}>
                      {ref.cardTendency}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8b949e] mt-0.5">
                    {ref.country} · {ref.experience}yr · {ref.matchCount} matches
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className={`text-sm font-bold ${getRatingColor(ref.rating)}`}>{ref.rating}</span>
                  <span className="text-[9px] text-[#8b949e]">{ref.specialization}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#484f58]" />
              </div>
            </div>
          </Card>
        ))}
        {filteredReferees.length === 0 && (
          <div className="flex flex-col items-center py-8 text-[#484f58]">
            <Search className="h-8 w-8 mb-2" />
            <span className="text-xs">No referees found</span>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================
  // Section 3: Referee Tendency Analysis
  // ============================================================
  const renderTendencyAnalysis = () => {
    const ref = selectedReferee || nextMatchReferee;
    return (
      <div className="space-y-3">
        {!selectedReferee && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-emerald-400">Showing next match referee. Select a referee from the database for detailed analysis.</span>
          </div>
        )}

        {/* Referee Header */}
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{ref.flag}</span>
            <div>
              <h4 className="text-base font-semibold text-[#c9d1d9]">{ref.name}</h4>
              <p className="text-xs text-[#8b949e]">{ref.country} · {ref.specialization}</p>
            </div>
            <div className="ml-auto">
              <span className={`text-lg font-bold ${getRatingColor(ref.rating)}`}>{ref.rating}</span>
            </div>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm ${getTendencyColor(ref.cardTendency)}`}>
            {ref.cardTendency} Tendency
          </span>
        </Card>

        {/* Tendency Bars */}
        <Card>
          <SectionTitle icon={<Target className="h-3.5 w-3.5" />} title="Referee Tendencies" />
          <div className="space-y-3">
            <TendencyBar label="Card Frequency" value={ref.tendencies.cardFrequency} />
            <TendencyBar label="Foul Threshold" value={ref.tendencies.foulThreshold} />
            <TendencyBar label="Advantage Play" value={ref.tendencies.advantagePlay} />
            <TendencyBar label="VAR Reviews" value={ref.tendencies.varReviews} />
            <TendencyBar label="Booking Speed" value={ref.tendencies.bookingSpeed} />
            <TendencyBar label="Injury Time" value={ref.tendencies.injuryTime} />
          </div>
        </Card>

        {/* Card Magnet Positions */}
        <Card>
          <SectionTitle icon={<AlertOctagon className="h-3.5 w-3.5" />} title="Card Magnet — Positions Carded Most" />
          <div className="space-y-2">
            {ref.cardMagnetPositions.map(pos => (
              <div key={pos.position} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#c9d1d9] w-8">{pos.position}</span>
                <div className="flex-1 h-2 bg-[#0d1117] rounded-sm overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-sm transition-all duration-500"
                    style={{ width: `${pos.percentage}%` }} />
                </div>
                <span className="text-[10px] text-amber-400 font-semibold w-10 text-right">{pos.percentage}%</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Historical Matches */}
        <Card>
          <SectionTitle icon={<BookOpen className="h-3.5 w-3.5" />} title="Last 5 Matches" />
          <div className="space-y-1.5">
            {ref.recentMatches.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#30363d]/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8b949e] w-10">{m.date}</span>
                  <span className="text-xs text-[#c9d1d9]">{m.opponent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[10px]">
                    <span className="inline-block w-2.5 h-2.5 bg-amber-400 rounded-sm" />
                    {m.yellowCards}
                  </span>
                  {m.redCards > 0 && (
                    <span className="flex items-center gap-1 text-[10px]">
                      <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-sm" />
                      {m.redCards}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Controversy Rating */}
        <Card>
          <SectionTitle icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Controversy Rating" />
          <div className="flex items-center gap-3">
            <div className="w-full h-3 bg-[#0d1117] rounded-sm overflow-hidden">
              <div className={`h-full rounded-sm transition-all duration-500 ${
                ref.controversyRating >= 20 ? 'bg-red-500' : ref.controversyRating >= 10 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
                style={{ width: `${ref.controversyRating * 3}%` }} />
            </div>
            <span className={`text-sm font-bold ${
              ref.controversyRating >= 20 ? 'text-red-400' : ref.controversyRating >= 10 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {ref.controversyRating}%
            </span>
          </div>
          <p className="text-[10px] text-[#8b949e] mt-2">
            {ref.controversyRating <= 10
              ? 'Rarely overturned. One of the most reliable officials.'
              : ref.controversyRating <= 20
                ? 'Occasionally overturned. Decisions are mostly sound.'
                : 'Frequently overturned. Expect VAR interventions.'}
          </p>
        </Card>
      </div>
    );
  };

  // ============================================================
  // Section 4: Discipline Tracker
  // ============================================================
  const renderDisciplineTracker = () => {
    const yellowDates = disciplineRecord.yellowCards.map(c => c.date);
    const redDates = disciplineRecord.redCards.map(c => c.date);

    return (
      <div className="space-y-3">
        {/* Summary */}
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d1117] rounded-md p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="inline-block w-3 h-3 bg-amber-400 rounded-sm" />
                <span className="text-xl font-bold text-amber-400">{disciplineRecord.yellowCount}</span>
              </div>
              <span className="text-xs text-[#8b949e]">Yellow Cards</span>
            </div>
            <div className="bg-[#0d1117] rounded-md p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-sm" />
                <span className="text-xl font-bold text-red-400">{disciplineRecord.redCount}</span>
              </div>
              <span className="text-xs text-[#8b949e]">Red Cards</span>
            </div>
          </div>
        </Card>

        {/* Suspension Status */}
        <Card>
          <SectionTitle icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Suspension Status" />
          {disciplineRecord.suspensionStatus === 'clean' ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs text-emerald-400 font-medium">No Active Suspension</p>
                <p className="text-[10px] text-[#8b949e]">
                  {disciplineRecord.cardsUntilSuspension} more yellow card(s) until 1-match ban
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              <XCircle className="h-4 w-4 text-red-400 shrink-0" />
              <div>
                <p className="text-xs text-red-400 font-medium">Suspension Active</p>
                <p className="text-[10px] text-[#8b949e]">1 match ban — next match missed</p>
              </div>
            </div>
          )}
        </Card>

        {/* Cards with Dates */}
        <Card>
          <SectionTitle icon={<Square className="h-3.5 w-3.5" />} title="Yellow Card Bookings" />
          <div className="space-y-1.5">
            {disciplineRecord.yellowCards.map((card, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#30363d]/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-amber-400 rounded-sm" />
                  <span className="text-xs text-[#c9d1d9]">{card.match}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8b949e]">{card.reason}</span>
                  <span className="text-[10px] text-[#8b949e]">{card.date}</span>
                </div>
              </div>
            ))}
            {disciplineRecord.yellowCards.length === 0 && (
              <p className="text-xs text-[#484f58] py-2">No yellow cards this season</p>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={<Square className="h-3.5 w-3.5" />} title="Red Cards" />
          <div className="space-y-1.5">
            {disciplineRecord.redCards.map((card, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#30363d]/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-sm" />
                  <span className="text-xs text-[#c9d1d9]">{card.match}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#8b949e]">{card.reason}</span>
                  <span className="text-[10px] text-[#8b949e]">{card.date}</span>
                </div>
              </div>
            ))}
            {disciplineRecord.redCards.length === 0 && (
              <p className="text-xs text-[#484f58] py-2">No red cards this season</p>
            )}
          </div>
        </Card>

        {/* Cards Timeline */}
        <Card>
          <SectionTitle icon={<Timer className="h-3.5 w-3.5" />} title="Cards Timeline (Last 10 Matches)" />
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {['MD 19', 'MD 20', 'MD 21', 'MD 22', 'MD 23', 'MD 24', 'MD 25', 'MD 26', 'MD 27', 'MD 28'].map((md, i) => {
              const isYellow = yellowDates.length > 0;
              const isRed = redDates.length > 0;
              let type: 'clean' | 'yellow' | 'red' = 'clean';
              if (i === 3 && isYellow) type = 'yellow';
              if (i === 5 && isRed) type = 'red';
              if (i === 6 && isYellow) type = 'yellow';
              if (i === 8 && isYellow) type = 'yellow';

              return (
                <div key={md} className="flex flex-col items-center gap-1 min-w-[36px]">
                  <span className={`inline-block w-4 h-4 rounded-sm border border-[#30363d] ${
                    type === 'yellow' ? 'bg-amber-400' : type === 'red' ? 'bg-red-500' : 'bg-[#0d1117]'
                  }`} />
                  <span className="text-[9px] text-[#8b949e]">{md}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <span className="inline-block w-2.5 h-2.5 bg-amber-400 rounded-sm" /> Yellow
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-sm" /> Red
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <span className="inline-block w-2.5 h-2.5 bg-[#0d1117] border border-[#30363d] rounded-sm" /> Clean
            </span>
          </div>
        </Card>

        {/* League Comparison */}
        <Card>
          <SectionTitle icon={<BarChart3 className="h-3.5 w-3.5" />} title="Your Cards vs League Average" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8b949e]">Yellow Cards</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#c9d1d9]">
                  You: <span className="font-bold text-amber-400">{disciplineRecord.yellowCount}</span>
                </span>
                <span className="text-xs text-[#8b949e]">
                  Avg: <span className="font-medium">{playerLeagueAvgYellow}</span>
                </span>
                <span className="text-xs text-[#8b949e]">
                  {disciplineRecord.yellowCount > playerLeagueAvgYellow ? (
                    <ArrowUpRight className="h-3 w-3 text-red-400 inline" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-emerald-400 inline" />
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8b949e]">Red Cards</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#c9d1d9]">
                  You: <span className="font-bold text-red-400">{disciplineRecord.redCount}</span>
                </span>
                <span className="text-xs text-[#8b949e]">
                  Avg: <span className="font-medium">{playerLeagueAvgRed}</span>
                </span>
                <span className="text-xs text-[#8b949e]">
                  {disciplineRecord.redCount > playerLeagueAvgRed ? (
                    <ArrowUpRight className="h-3 w-3 text-red-400 inline" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-emerald-400 inline" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Disciplinary Hearing */}
        {disciplineRecord.yellowCount >= 2 && (
          <Card className="border-amber-500/30">
            <SectionTitle icon={<Gavel className="h-3.5 w-3.5 text-amber-400" />} title="Disciplinary Hearing" />
            <div className="bg-amber-500/10 rounded-md p-3 space-y-2">
              <p className="text-xs text-amber-400 font-medium">
                Approaching Suspension Threshold
              </p>
              <p className="text-[10px] text-[#8b949e]">
                You have accumulated {disciplineRecord.yellowCount} yellow cards this season.
                Accumulating {disciplineRecord.yellowCount + disciplineRecord.cardsUntilSuspension} yellow cards
                will result in an automatic 1-match suspension.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-[#0d1117] rounded-sm overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-sm" style={{ width: `${(disciplineRecord.yellowCount / (disciplineRecord.yellowCount + disciplineRecord.cardsUntilSuspension)) * 100}%` }} />
                </div>
                <span className="text-[10px] text-amber-400 font-semibold">{disciplineRecord.cardsUntilSuspension} left</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // ============================================================
  // Section 5: VAR Decision Center
  // ============================================================
  const renderVARCenter = () => (
    <div className="space-y-3">
      {/* VAR Summary */}
      <Card>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0d1117] rounded-md p-2.5 text-center">
            <span className="text-lg font-bold text-emerald-400">{overturnedCount}/{totalVarIncidents}</span>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Overturned</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2.5 text-center">
            <span className="text-lg font-bold text-amber-400">{avgReviewTime}m</span>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Avg Review</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2.5 text-center">
            <span className="text-lg font-bold text-[#c9d1d9]">{totalVarIncidents}</span>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Total Reviews</p>
          </div>
        </div>
        <p className="text-[10px] text-[#8b949e] mt-2 text-center">
          VAR overturned {overturnedCount} of {totalVarIncidents} decisions this season ({((overturnedCount / totalVarIncidents) * 100).toFixed(0)}%)
        </p>
      </Card>

      {/* VAR Incidents */}
      <div className="space-y-2">
        {varIncidents.map(incident => (
          <Card key={incident.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                    incident.type === 'Goal/No Goal' ? 'bg-emerald-500/15 text-emerald-400' :
                    incident.type === 'Penalty/No Penalty' ? 'bg-amber-500/15 text-amber-400' :
                    incident.type === 'Red Card Review' ? 'bg-red-500/15 text-red-400' :
                    incident.type === 'Offside' ? 'bg-blue-500/15 text-blue-400' :
                    incident.type === 'Handball' ? 'bg-purple-500/15 text-purple-400' :
                    'bg-orange-500/15 text-orange-400'
                  }`}>
                    {incident.type}
                  </span>
                  <span className="text-[10px] text-[#8b949e]">{incident.matchDay}</span>
                </div>
                <p className="text-xs text-[#c9d1d9] font-medium">{incident.incident}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#8b949e]">
                    Original: <span className="text-[#c9d1d9]">{incident.originalDecision}</span>
                  </span>
                  <span className="text-[10px] text-[#484f58]">→</span>
                  <span className={`text-[10px] font-medium ${
                    incident.overturned ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {incident.varDecision}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                  incident.overturned ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                }`}>
                  {incident.overturned ? 'Overturned' : 'Stands'}
                </span>
                <span className="text-[10px] text-[#8b949e]">{incident.minute}&apos;</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-sm hover:bg-emerald-500/20 transition-colors">
                Challenge
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* VAR Review Stats */}
      <Card>
        <SectionTitle icon={<Timer className="h-3.5 w-3.5" />} title="VAR Review Duration Stats" />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Average Review Time</span>
            <span className="text-sm font-bold text-amber-400">{avgReviewTime} min</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Longest Review</span>
            <span className="text-sm font-bold text-red-400">3.2 min</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Shortest Review</span>
            <span className="text-sm font-bold text-emerald-400">0.5 min</span>
          </div>
        </div>
      </Card>
    </div>
  );

  // ============================================================
  // Section 6: Fair Play Table
  // ============================================================
  const renderFairPlayTable = () => (
    <div className="space-y-3">
      {/* Fair Play Award Card */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/15 rounded-lg flex items-center justify-center">
            <Award className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#c9d1d9]">Fair Play Award Leader</h4>
            <p className="text-xs text-emerald-400">
              {fairPlayTable[0].name} — {fairPlayTable[0].fairPlayPoints} points
            </p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#30363d]">
          <SectionTitle icon={<ShieldCheck className="h-3.5 w-3.5" />} title="Club Fair Play Rankings" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0d1117] text-[10px] text-[#8b949e] uppercase tracking-wide">
                <th className="text-left py-2 px-4 font-medium">#</th>
                <th className="text-left py-2 px-2 font-medium">Club</th>
                <th className="text-center py-2 px-2 font-medium">YC</th>
                <th className="text-center py-2 px-2 font-medium">RC</th>
                <th className="text-center py-2 px-2 font-medium">Fouls</th>
                <th className="text-center py-2 px-4 font-medium">FP Pts</th>
              </tr>
            </thead>
            <tbody>
              {fairPlayTable.map((club, i) => (
                <tr key={club.name} className={`border-t border-[#30363d]/50 ${
                  club.isPlayerClub ? 'bg-emerald-500/10' : 'hover:bg-[#0d1117]/50'
                } transition-colors`}>
                  <td className="py-2.5 px-4">
                    <span className="text-xs text-[#8b949e]">{i + 1}</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1.5">
                      {club.hasAward && <Award className="h-3 w-3 text-emerald-400 shrink-0" />}
                      <span className={`text-xs font-medium ${club.isPlayerClub ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                        {club.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-xs text-amber-400">{club.yellowCards}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-xs text-red-400">{club.redCards}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-xs text-[#8b949e]">{club.fouls}</span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`text-xs font-bold ${club.isPlayerClub ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                      {club.fairPlayPoints}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Fair Play Points Calculation */}
      <Card>
        <SectionTitle icon={<Info className="h-3.5 w-3.5" />} title="Fair Play Points Calculation" />
        <div className="space-y-2 text-[10px] text-[#8b949e]">
          <div className="flex items-center justify-between py-1 border-b border-[#30363d]/50">
            <span>Starting Points</span>
            <span className="text-[#c9d1d9] font-medium">100</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#30363d]/50">
            <span>Per Yellow Card</span>
            <span className="text-red-400 font-medium">-1 pt</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#30363d]/50">
            <span>Per Red Card (direct)</span>
            <span className="text-red-400 font-medium">-3 pts</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#30363d]/50">
            <span>Per 10 Fouls</span>
            <span className="text-red-400 font-medium">-1 pt</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Disciplinary Bonus (no reds)</span>
            <span className="text-emerald-400 font-medium">+5 pts</span>
          </div>
        </div>
      </Card>
    </div>
  );

  // ============================================================
  // Section 7: Match Incident Timeline
  // ============================================================
  const renderMatchIncidentTimeline = () => (
    <div className="space-y-3">
      {/* Match Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-[#8b949e]">MAN UTD</p>
            <p className="text-lg font-bold text-[#c9d1d9]">2</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#8b949e] uppercase tracking-wide">Matchday 28</span>
            <span className="text-xs text-[#c9d1d9] mt-0.5">Old Trafford</span>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#8b949e]">LIVERPOOL</p>
            <p className="text-lg font-bold text-[#c9d1d9]">2</p>
          </div>
        </div>
      </Card>

      {/* Visual Timeline */}
      <Card>
        <SectionTitle icon={<Clock className="h-3.5 w-3.5" />} title="Match Incident Timeline" />
        <div className="relative">
          {/* Timeline axis */}
          <div className="relative h-16 mb-4">
            {/* Base line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#30363d]" />
            {/* Half line */}
            <div className="absolute top-1/2 left-1/2 h-4 bg-[#30363d] w-px" />

            {/* Incident markers */}
            {matchIncidents.map((incident, i) => {
              const leftPos = `${(incident.minute / 90) * 100}%`;
              const isTop = incident.team === 'home';
              const yOffset = isTop ? '-4' : '4';

              return (
                <div
                  key={i}
                  className="absolute"
                  style={{ left: leftPos }}
                >
                  <div className="flex flex-col items-center" style={{ marginTop: `${yOffset}px` }}>
                    {incident.type === 'goal' && (
                      <Circle className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                    )}
                    {incident.type === 'yellow_card' && (
                      <Square className="h-3 w-3 text-amber-400 fill-amber-400" />
                    )}
                    {incident.type === 'red_card' && (
                      <Square className="h-3 w-3 text-red-500 fill-red-500" />
                    )}
                    {incident.type === 'foul' && (
                      <span className="w-1.5 h-1.5 bg-[#8b949e] rounded-sm" />
                    )}
                    {incident.type === 'substitution' && (
                      <Triangle className="h-3 w-3 text-blue-400 fill-blue-400" />
                    )}
                    {incident.type === 'var_review' && (
                      <Diamond className="h-3 w-3 text-purple-400 fill-purple-400" />
                    )}
                    <span className="text-[8px] text-[#484f58] mt-0.5">{incident.minute}&apos;</span>
                  </div>
                </div>
              );
            })}

            {/* Minute labels */}
            <div className="flex justify-between mt-0.5">
              <span className="text-[8px] text-[#484f58]">0&apos;</span>
              <span className="text-[8px] text-[#484f58]">45&apos;</span>
              <span className="text-[8px] text-[#484f58]">90&apos;</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <Circle className="h-2.5 w-2.5 text-emerald-400 fill-emerald-400" /> Goal
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <Square className="h-2.5 w-2.5 text-amber-400 fill-amber-400" /> Yellow
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <Square className="h-2.5 w-2.5 text-red-500 fill-red-500" /> Red
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <span className="w-1.5 h-1.5 bg-[#8b949e] rounded-sm" /> Foul
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <Triangle className="h-2.5 w-2.5 text-blue-400 fill-blue-400" /> Sub
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <Diamond className="h-2.5 w-2.5 text-purple-400 fill-purple-400" /> VAR
            </span>
          </div>
        </div>
      </Card>

      {/* Incident List */}
      <Card>
        <SectionTitle icon={<ListChecks className="h-3.5 w-3.5" />} title="Incident Log" />
        <div className="space-y-1.5">
          {matchIncidents.map((incident, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#30363d]/50 last:border-0">
              <span className="text-[10px] text-[#8b949e] w-8 text-right shrink-0">{incident.minute}&apos;</span>
              {incident.type === 'goal' && <Circle className="h-3 w-3 text-emerald-400 fill-emerald-400 shrink-0" />}
              {incident.type === 'yellow_card' && <Square className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
              {incident.type === 'red_card' && <Square className="h-3 w-3 text-red-500 fill-red-500 shrink-0" />}
              {incident.type === 'foul' && <span className="w-1.5 h-1.5 bg-[#8b949e] rounded-sm shrink-0" />}
              {incident.type === 'substitution' && <Triangle className="h-3 w-3 text-blue-400 fill-blue-400 shrink-0" />}
              {incident.type === 'var_review' && <Diamond className="h-3 w-3 text-purple-400 fill-purple-400 shrink-0" />}
              <span className={`text-[10px] px-1 py-0.5 rounded-sm shrink-0 ${
                incident.team === 'home' ? 'bg-blue-500/10 text-blue-400' :
                incident.team === 'away' ? 'bg-red-500/10 text-red-400' :
                'bg-purple-500/10 text-purple-400'
              }`}>
                {incident.team === 'home' ? 'HOME' : incident.team === 'away' ? 'AWAY' : 'VAR'}
              </span>
              <span className="text-xs text-[#c9d1d9] truncate">{incident.player}{incident.detail ? ` — ${incident.detail}` : ''}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Incident Type Breakdown */}
      <Card>
        <SectionTitle icon={<Layers className="h-3.5 w-3.5" />} title="Incident Type Breakdown" />
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Circle className="h-3 w-3 text-emerald-400 fill-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">{incidentBreakdown.goal}</span>
            </div>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Goals</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Square className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-amber-400">{incidentBreakdown.yellow_card}</span>
            </div>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Yellow Cards</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Square className="h-3 w-3 text-red-500 fill-red-500" />
              <span className="text-sm font-bold text-red-400">{incidentBreakdown.red_card}</span>
            </div>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Red Cards</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-[#8b949e] rounded-sm" />
              <span className="text-sm font-bold text-[#8b949e]">{incidentBreakdown.foul}</span>
            </div>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Fouls</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Triangle className="h-3 w-3 text-blue-400 fill-blue-400" />
              <span className="text-sm font-bold text-blue-400">{incidentBreakdown.substitution}</span>
            </div>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Subs</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <Diamond className="h-3 w-3 text-purple-400 fill-purple-400" />
              <span className="text-sm font-bold text-purple-400">{incidentBreakdown.var_review}</span>
            </div>
            <p className="text-[10px] text-[#8b949e] mt-0.5">VAR Reviews</p>
          </div>
        </div>
      </Card>
    </div>
  );

  // ============================================================
  // Section 8: Referee Stats Deep Dive
  // ============================================================
  const renderRefereeStatsDeepDive = () => (
    <div className="space-y-3">
      {/* Key Stats */}
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0d1117] rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertOctagon className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[10px] text-[#8b949e]">Most Card-Happy</span>
            </div>
            <p className="text-sm font-semibold text-[#c9d1d9]">{mostCardHappy.name}</p>
            <p className="text-xs text-red-400">{mostCardHappy.cardsPerGame} cards/game</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-[#8b949e]">Most Lenient</span>
            </div>
            <p className="text-sm font-semibold text-[#c9d1d9]">{mostLenient.name}</p>
            <p className="text-xs text-emerald-400">{mostLenient.cardsPerGame} cards/game</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <MonitorPlay className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[10px] text-[#8b949e]">Highest VAR Rate</span>
            </div>
            <p className="text-sm font-semibold text-[#c9d1d9]">{highestVarRate.name}</p>
            <p className="text-xs text-purple-400">{(highestVarRate.varInterventionRate * 100).toFixed(0)}% intervention</p>
          </div>
          <div className="bg-[#0d1117] rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] text-[#8b949e]">League Avg Fouls</span>
            </div>
            <p className="text-sm font-semibold text-[#c9d1d9]">{avgFoulsAllReferees}</p>
            <p className="text-xs text-amber-400">fouls/game (all refs)</p>
          </div>
        </div>
      </Card>

      {/* Referee Performance Trend - SVG Chart */}
      <Card>
        <SectionTitle icon={<TrendingUp className="h-3.5 w-3.5" />} title="Referee Performance Trend" />
        <div className="relative">
          <svg viewBox="0 0 340 140" className="w-full" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5].map(i => (
              <line
                key={`grid-${i}`}
                x1="40" y1={`${10 + i * 25}`} x2="330" y2={`${10 + i * 25}`}
                stroke="#30363d" strokeWidth="0.5" strokeDasharray="3,3"
              />
            ))}
            {/* Y-axis labels */}
            {[100, 80, 60, 40, 20, 0].map((val, i) => (
              <text key={`yl-${i}`} x="35" y={`${14 + i * 25}`} textAnchor="end" fill="#8b949e" fontSize="8">
                {val}
              </text>
            ))}
            {/* X-axis labels */}
            {['MD 20', 'MD 22', 'MD 24', 'MD 26', 'MD 28'].map((label, i) => (
              <text key={`xl-${i}`} x={`${60 + i * 67}`} y="138" textAnchor="middle" fill="#8b949e" fontSize="8">
                {label}
              </text>
            ))}
            {/* Performance line - Felix Brych */}
            {(() => {
              const points = [85, 88, 84, 87, 86];
              const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${60 + i * 67} ${10 + (100 - p) * 1.3}`).join(' ');
              return (
                <g>
                  <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" />
                  {points.map((p, i) => (
                    <circle key={`p-${i}`} cx={`${60 + i * 67}`} cy={`${10 + (100 - p) * 1.3}`} r="3" fill="#10b981" />
                  ))}
                </g>
              );
            })()}
            {/* Performance line - Anthony Taylor */}
            {(() => {
              const points = [78, 76, 80, 79, 81];
              const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${60 + i * 67} ${10 + (100 - p) * 1.3}`).join(' ');
              return (
                <g>
                  <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,3" />
                  {points.map((p, i) => (
                    <circle key={`p2-${i}`} cx={`${60 + i * 67}`} cy={`${10 + (100 - p) * 1.3}`} r="2.5" fill="#f59e0b" />
                  ))}
                </g>
              );
            })()}
          </svg>
          {/* Chart Legend */}
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <span className="w-4 h-0.5 bg-emerald-500" /> F. Brych
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#8b949e]">
              <span className="w-4 h-0.5 bg-amber-500" style={{ borderTop: '1px dashed #f59e0b', height: 0 }} /> A. Taylor
            </span>
          </div>
        </div>
      </Card>

      {/* Referee of the Season */}
      <Card className="border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500/15 rounded-lg flex items-center justify-center">
            <Star className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#c9d1d9]">Referee of the Season</h4>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-emerald-500/15 text-emerald-400">
                Current Nominee
              </span>
            </div>
            <p className="text-xs text-[#c9d1d9] mt-0.5">{refereeOfSeason.name}</p>
            <p className="text-[10px] text-[#8b949e]">
              Rating: {refereeOfSeason.rating} · {refereeOfSeason.cardsPerGame} cards/game · {(refereeOfSeason.varInterventionRate * 100).toFixed(0)}% VAR rate
            </p>
          </div>
        </div>
        <p className="text-[10px] text-[#8b949e] mt-3">
          Nominated for consistent decision-making and low controversy rate across {refereeLeagueStats.length} league referees this season.
        </p>
      </Card>

      {/* Full League Referee Stats Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[#30363d]">
          <SectionTitle icon={<Hash className="h-3.5 w-3.5" />} title="League Referee Statistics" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0d1117] text-[10px] text-[#8b949e] uppercase tracking-wide">
                <th className="text-left py-2 px-4 font-medium">Referee</th>
                <th className="text-center py-2 px-2 font-medium">Rating</th>
                <th className="text-center py-2 px-2 font-medium">Cards/G</th>
                <th className="text-center py-2 px-2 font-medium">Fouls/G</th>
                <th className="text-center py-2 px-4 font-medium">VAR%</th>
              </tr>
            </thead>
            <tbody>
              {refereeLeagueStats
                .sort((a, b) => b.rating - a.rating)
                .map(ref => {
                  const dbRef = refereeDatabase.find(r => r.name === ref.name);
                  return (
                    <tr key={ref.name} className="border-t border-[#30363d]/50 hover:bg-[#0d1117]/50 transition-colors">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {dbRef && <span className="text-sm">{dbRef.flag}</span>}
                          <span className="text-xs text-[#c9d1d9]">{ref.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`text-xs font-bold ${getRatingColor(ref.rating)}`}>{ref.rating}</span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs text-amber-400">{ref.cardsPerGame}</span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="text-xs text-[#8b949e]">{ref.foulsPerGame}</span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <span className="text-xs text-purple-400">{(ref.varInterventionRate * 100).toFixed(0)}%</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // ============================================================
  // Main Render
  // ============================================================

  const renderActiveSection = () => {
    switch (activeTab) {
      case 0: return renderMatchOfficialOverview();
      case 1: return renderRefereeDatabase();
      case 2: return renderTendencyAnalysis();
      case 3: return renderDisciplineTracker();
      case 4: return renderVARCenter();
      case 5: return renderFairPlayTable();
      case 6: return renderMatchIncidentTimeline();
      case 7: return renderRefereeStatsDeepDive();
      default: return renderMatchOfficialOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] pb-4">
      {/* Header */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="h-5 w-5 text-emerald-400" />
          <h1 className="text-base font-bold text-[#c9d1d9]">Referee System</h1>
        </div>

        {/* Tab Scroll */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                activeTab === i
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-[#8b949e] border border-transparent hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pt-3 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {renderActiveSection()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
