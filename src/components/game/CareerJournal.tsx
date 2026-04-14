'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import {
  BookOpen, Search, Swords, Dumbbell, ArrowRightLeft, Heart,
  Trophy, TrendingUp, Calendar, Star, Activity, Award,
  ChevronRight, BarChart3, Filter, Cloud, Shield, Flag, ClipboardList,
} from 'lucide-react';
import type { MatchResult, TrainingSession, Injury, Achievement, GameEvent, SeasonAward } from '@/lib/game/types';

// ─── Types ───────────────────────────────────────────────────

type JournalCategory = 'match' | 'training' | 'transfer' | 'personal' | 'milestone';
type MoodValue = 'positive' | 'neutral' | 'negative';

interface JournalEntry {
  id: string;
  season: number;
  week: number;
  category: JournalCategory;
  icon: string;
  label: string;
  title: string;
  description: string;
  mood: MoodValue;
  stats?: { label: string; value: string | number }[];
}

type FilterTab = 'all' | JournalCategory;

// ─── Category Config ─────────────────────────────────────────

const CATEGORY_CONFIG: Record<JournalCategory, { icon: React.ReactNode; label: string; borderColor: string; bgTint: string; textColor: string }> = {
  match: {
    icon: <Swords className="h-3.5 w-3.5" />,
    label: 'Match',
    borderColor: 'border-l-emerald-500',
    bgTint: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
  },
  training: {
    icon: <Dumbbell className="h-3.5 w-3.5" />,
    label: 'Training',
    borderColor: 'border-l-sky-500',
    bgTint: 'bg-sky-500/10',
    textColor: 'text-sky-400',
  },
  transfer: {
    icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
    label: 'Transfer',
    borderColor: 'border-l-amber-500',
    bgTint: 'bg-amber-500/10',
    textColor: 'text-amber-400',
  },
  personal: {
    icon: <Heart className="h-3.5 w-3.5" />,
    label: 'Personal',
    borderColor: 'border-l-violet-500',
    bgTint: 'bg-violet-500/10',
    textColor: 'text-violet-400',
  },
  milestone: {
    icon: <Trophy className="h-3.5 w-3.5" />,
    label: 'Milestone',
    borderColor: 'border-l-yellow-500',
    bgTint: 'bg-yellow-500/10',
    textColor: 'text-yellow-400',
  },
};

const MOOD_EMOJI: Record<MoodValue, string> = {
  positive: '\u{1F60A}',
  neutral: '\u{1F610}',
  negative: '\u{1F61E}',
};

const MOOD_COLOR: Record<MoodValue, string> = {
  positive: 'bg-emerald-500',
  neutral: 'bg-amber-500',
  negative: 'bg-red-500',
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'match', label: 'Matches' },
  { key: 'training', label: 'Training' },
  { key: 'transfer', label: 'Transfers' },
  { key: 'personal', label: 'Personal' },
  { key: 'milestone', label: 'Milestones' },
];

// ─── Word Cloud Data ─────────────────────────────────────────

const WORD_CLOUD_DATA = [
  { word: 'Goal', frequency: 14, sentiment: 'positive' as const },
  { word: 'Assist', frequency: 12, sentiment: 'positive' as const },
  { word: 'Win', frequency: 11, sentiment: 'positive' as const },
  { word: 'Training', frequency: 9, sentiment: 'neutral' as const },
  { word: 'Clean Sheet', frequency: 8, sentiment: 'positive' as const },
  { word: 'Derby', frequency: 7, sentiment: 'neutral' as const },
  { word: 'Loss', frequency: 7, sentiment: 'negative' as const },
  { word: 'Comeback', frequency: 6, sentiment: 'positive' as const },
  { word: 'Injury', frequency: 6, sentiment: 'negative' as const },
  { word: 'Final', frequency: 5, sentiment: 'neutral' as const },
  { word: 'Substitution', frequency: 5, sentiment: 'neutral' as const },
  { word: 'Hat-trick', frequency: 5, sentiment: 'positive' as const },
  { word: 'MVP', frequency: 4, sentiment: 'positive' as const },
  { word: 'Transfer', frequency: 4, sentiment: 'neutral' as const },
  { word: 'Set Piece', frequency: 4, sentiment: 'neutral' as const },
  { word: 'Red Card', frequency: 3, sentiment: 'negative' as const },
  { word: 'Debut', frequency: 3, sentiment: 'positive' as const },
  { word: 'Contract', frequency: 3, sentiment: 'neutral' as const },
  { word: 'Press Conference', frequency: 3, sentiment: 'neutral' as const },
  { word: 'Missed Penalty', frequency: 3, sentiment: 'negative' as const },
  { word: 'Captain', frequency: 3, sentiment: 'positive' as const },
  { word: 'Relegation', frequency: 2, sentiment: 'negative' as const },
  { word: 'Suspension', frequency: 2, sentiment: 'negative' as const },
  { word: 'Own Goal', frequency: 1, sentiment: 'negative' as const },
];

// ─── Mood Tracker Data ───────────────────────────────────────

const MOOD_TRACKER_DATA = {
  weeklyMoods: [
    { day: 'Mon', mood: 'excellent' as const },
    { day: 'Tue', mood: 'good' as const },
    { day: 'Wed', mood: 'good' as const },
    { day: 'Thu', mood: 'okay' as const },
    { day: 'Fri', mood: 'good' as const },
    { day: 'Sat', mood: 'excellent' as const },
    { day: 'Sun', mood: 'good' as const },
  ],
  weeklyAverage: 4.1,
  monthlyDistribution: [
    { level: 'Excellent', count: 8, color: '#10b981' },
    { level: 'Good', count: 12, color: '#0ea5e9' },
    { level: 'Okay', count: 5, color: '#f59e0b' },
    { level: 'Bad', count: 3, color: '#f97316' },
    { level: 'Terrible', count: 2, color: '#ef4444' },
  ],
  influences: [
    { factor: 'Form', impact: 0.7, direction: 'up' as const },
    { factor: 'Morale', impact: 0.85, direction: 'up' as const },
    { factor: 'Personal Life', impact: 0.4, direction: 'down' as const },
  ],
};

// ─── Journal Templates Data ──────────────────────────────────

const JOURNAL_TEMPLATES = [
  {
    id: 'match-recap',
    name: 'Match Day Recap',
    description: 'Recap goals, assists, rating, and key moments',
    icon: Swords,
    templateText: 'Match Day Recap\n\nOpponent: ...\nResult: ...\nMy Rating: .../10\nKey Moments: ...\nWhat went well: ...\nWhat to improve: ...',
  },
  {
    id: 'training-summary',
    name: 'Training Summary',
    description: 'Log session type, intensity, and progress',
    icon: Dumbbell,
    templateText: 'Training Summary\n\nType: ...\nIntensity: .../100\nFocus Area: ...\nProgress: ...\nGoals for next session: ...',
  },
  {
    id: 'personal-reflection',
    name: 'Personal Reflection',
    description: 'Reflect on personal growth and mindset',
    icon: Heart,
    templateText: 'Personal Reflection\n\nCurrent mindset: ...\nProudest moment this week: ...\nBiggest challenge: ...\nWhat I learned: ...\nFocus for next week: ...',
  },
  {
    id: 'goal-celebration',
    name: 'Goal Celebration',
    description: 'Document that special goal moment',
    icon: Star,
    templateText: 'Goal Celebration\n\nCompetition: ...\nOpponent: ...\nMinute: ...\nType of goal: ...\nHow it felt: ...\nDedication: ...',
  },
  {
    id: 'transfer-rumor',
    name: 'Transfer Rumor',
    description: 'Note transfer speculation and feelings',
    icon: ArrowRightLeft,
    templateText: 'Transfer Rumor\n\nLinked Club: ...\nSource: ...\nMy thoughts: ...\nAgent update: ...\nDecision: ...',
  },
  {
    id: 'injury-update',
    name: 'Injury Update',
    description: 'Track injury recovery and rehab progress',
    icon: Activity,
    templateText: 'Injury Update\n\nInjury: ...\nSeverity: ...\nWeeks out: ...\nRehab progress: ...\nTarget return: ...\nHow I feel: ...',
  },
];

// ─── Career Milestones Data ──────────────────────────────────

const CAREER_MILESTONES = [
  {
    id: 'first-goal',
    title: 'First Goal',
    season: 1,
    week: 3,
    description: 'Scored the first competitive goal of the career. A moment that will be remembered forever.',
    icon: 'star' as const,
    journalEntries: 3,
  },
  {
    id: '100th-appearance',
    title: '100th Appearance',
    season: 3,
    week: 12,
    description: 'Reached a century of appearances. Consistency and dedication personified.',
    icon: 'shield' as const,
    journalEntries: 8,
  },
  {
    id: 'first-hat-trick',
    title: 'First Hat-trick',
    season: 2,
    week: 28,
    description: 'Scored three goals in a single match. An unforgettable night under the floodlights.',
    icon: 'trophy' as const,
    journalEntries: 5,
  },
  {
    id: 'captains-armband',
    title: "Captain's Armband",
    season: 4,
    week: 1,
    description: 'Given the captaincy for the first time. A proud leadership moment in the career.',
    icon: 'flag' as const,
    journalEntries: 4,
  },
];

// ─── Journal Statistics Data ─────────────────────────────────

const JOURNAL_STATISTICS = {
  totalEntries: 147,
  avgWordsPerEntry: 68,
  longestStreak: 23,
  mostCommonTopics: [
    { topic: 'Match Day', count: 52, color: '#10b981' },
    { topic: 'Training', count: 34, color: '#0ea5e9' },
    { topic: 'Personal', count: 28, color: '#a78bfa' },
    { topic: 'Transfer', count: 19, color: '#f59e0b' },
    { topic: 'Injury', count: 14, color: '#ef4444' },
  ],
  consistencyScore: 78,
  entriesPerSeason: [
    { season: 'S1', count: 24 },
    { season: 'S2', count: 41 },
    { season: 'S3', count: 38 },
    { season: 'S4', count: 44 },
  ],
};

// ─── Entry Generation ────────────────────────────────────────

function isDefenderPosition(pos: string): boolean {
  return ['GK', 'CB', 'LB', 'RB'].includes(pos);
}

function generateMatchEntries(results: MatchResult[], playerClubId: string): JournalEntry[] {
  const entries: JournalEntry[] = [];

  for (const r of results) {
    const isHome = r.homeClub.id === playerClubId;
    const playerScore = isHome ? r.homeScore : r.awayScore;
    const oppScore = isHome ? r.awayScore : r.homeScore;
    const opponent = isHome ? r.awayClub : r.homeClub;
    const resultStr = playerScore > oppScore ? 'Won' : playerScore < oppScore ? 'Lost' : 'Drew';

    // Determine mood
    let mood: MoodValue = 'neutral';
    if (playerScore > oppScore) mood = 'positive';
    else if (playerScore < oppScore) mood = 'negative';
    if (r.playerRating >= 8.0) mood = 'positive';
    if (r.playerRating <= 4.0) mood = 'negative';

    // Main match entry
    const stats: { label: string; value: string | number }[] = [];
    if (r.playerMinutesPlayed > 0) {
      stats.push({ label: 'Rating', value: r.playerRating.toFixed(1) });
      if (r.playerGoals > 0) stats.push({ label: 'Goals', value: r.playerGoals });
      if (r.playerAssists > 0) stats.push({ label: 'Assists', value: r.playerAssists });
    }

    let description = `${r.competition} action. ${playerClubId ? '' : ''}`;
    if (r.playerMinutesPlayed === 0) {
      description = `An unused substitute as the team ${resultStr.toLowerCase()} against ${opponent.name}. The final score was ${r.homeScore}-${r.awayScore}.`;
    } else if (r.playerStarted) {
      description = `Started the match and played ${r.playerMinutesPlayed} minutes. The team ${resultStr.toLowerCase()} ${r.homeScore}-${r.awayScore} against ${opponent.name}.`;
    } else {
      description = `Came on as a substitute in the ${r.playerMinutesPlayed}' and the team ${resultStr.toLowerCase()} ${r.homeScore}-${r.awayScore} against ${opponent.name}.`;
    }

    let title = `Match Day: ${r.homeClub.shortName} ${r.homeScore}-${r.awayScore} ${r.awayClub.shortName}`;
    if (r.playerMinutesPlayed === 0) {
      title = `Unused Sub: ${r.homeClub.shortName} ${r.homeScore}-${r.awayScore} ${r.awayClub.shortName}`;
    }

    entries.push({
      id: `match-${r.season}-${r.week}`,
      season: r.season,
      week: r.week,
      category: 'match',
      icon: Swords.displayName ?? 'Swords',
      label: 'Match',
      title,
      description,
      mood,
      stats: stats.length > 0 ? stats : undefined,
    });

    // Goal entries
    if (r.playerGoals > 0) {
      const goalMood: MoodValue = r.playerGoals >= 3 ? 'positive' : r.playerGoals >= 2 ? 'positive' : 'positive';
      let goalTitle = 'Found the net!';
      let goalDesc = '';
      if (r.playerGoals >= 3) {
        goalTitle = 'Hat-trick hero!';
        goalDesc = `Scored a stunning hat-trick (${r.playerGoals} goals) against ${opponent.name}. A performance to remember!`;
      } else if (r.playerGoals === 2) {
        goalTitle = 'Brace!';
        goalDesc = `Scored twice against ${opponent.name}. Great attacking display in the ${r.homeScore}-${r.awayScore} match.`;
      } else {
        goalDesc = `Got on the scoresheet against ${opponent.name} in the ${r.homeScore}-${r.awayScore} result.`;
      }
      entries.push({
        id: `goal-${r.season}-${r.week}`,
        season: r.season,
        week: r.week,
        category: 'match',
        icon: 'Goal',
        label: 'Goal',
        title: goalTitle,
        description: goalDesc,
        mood: goalMood,
        stats: [{ label: 'Goals', value: r.playerGoals }],
      });
    }

    // Assist entries
    if (r.playerAssists > 0) {
      let assistTitle = 'Set up a teammate';
      let assistDesc = '';
      if (r.playerAssists >= 2) {
        assistTitle = 'Double assist!';
        assistDesc = `Provided ${r.playerAssists} assists in the match against ${opponent.name}. Excellent playmaking.`;
      } else {
        assistDesc = `Played a key role in setting up a goal against ${opponent.name}.`;
      }
      entries.push({
        id: `assist-${r.season}-${r.week}`,
        season: r.season,
        week: r.week,
        category: 'match',
        icon: 'Assist',
        label: 'Assist',
        title: assistTitle,
        description: assistDesc,
        mood: 'positive',
        stats: [{ label: 'Assists', value: r.playerAssists }],
      });
    }

    // Clean sheet for defenders
    const playerConceded = isHome ? r.awayScore : r.homeScore;
    if (r.playerMinutesPlayed > 0 && playerConceded === 0 && playerScore > oppScore) {
      entries.push({
        id: `cs-${r.season}-${r.week}`,
        season: r.season,
        week: r.week,
        category: 'match',
        icon: 'Shield',
        label: 'Clean Sheet',
        title: 'Kept a clean sheet',
        description: `Solid defensive performance against ${opponent.name}. The backline held firm to secure a shutout.`,
        mood: 'positive',
        stats: [{ label: 'Conceded', value: 0 }],
      });
    }

    // Red card
    const redCardEvent = r.events.find(
      e => (e.type === 'red_card' || e.type === 'second_yellow') && e.playerId !== undefined
    );
    if (redCardEvent && r.playerMinutesPlayed < 90 && r.playerMinutesPlayed > 0) {
      entries.push({
        id: `red-${r.season}-${r.week}`,
        season: r.season,
        week: r.week,
        category: 'personal',
        icon: 'Card',
        label: 'Discipline',
        title: 'Sent off',
        description: `Received a red card in the match against ${opponent.name}. Will face a suspension as a result.`,
        mood: 'negative',
      });
    }
  }

  return entries;
}

function generateTrainingEntries(trainingHistory: TrainingSession[], focus: string | null): JournalEntry[] {
  const entries: JournalEntry[] = [];

  // Generate from training sessions (most recent first, up to 20)
  const recent = trainingHistory.slice(-20).reverse();
  const focusLabels: Record<string, string> = {
    attacking: 'Attacking',
    defensive: 'Defensive',
    physical: 'Physical',
    technical: 'Technical',
    tactical: 'Tactical',
    recovery: 'Recovery',
  };

  for (const t of recent) {
    const intensityLabel = t.intensity >= 80 ? 'high-intensity' : t.intensity >= 50 ? 'moderate' : 'light';
    const mood: MoodValue = t.intensity >= 80 ? (Math.random() > 0.3 ? 'positive' : 'neutral') : 'neutral';
    const focusLabel = focusLabels[t.type] ?? t.type;

    entries.push({
      id: `training-${t.completedAt}`,
      season: 0,
      week: 0,
      category: 'training',
      icon: 'Dumbbell',
      label: 'Training',
      title: `${focusLabel} session completed`,
      description: `Finished a ${intensityLabel} ${focusLabel.toLowerCase()} training session. ${t.focusAttribute ? `Focused on ${t.focusAttribute}.` : 'General training.'}`,
      mood,
      stats: [{ label: 'Intensity', value: `${t.intensity}%` }],
    });
  }

  // Training focus commitment entry
  if (focus) {
    const focusLabel = focusLabels[focus] ?? focus;
    entries.push({
      id: 'training-focus',
      season: 0,
      week: 0,
      category: 'training',
      icon: 'Target',
      label: 'Training Focus',
      title: `Committed to ${focusLabel} training`,
      description: `Set ${focusLabel.toLowerCase()} as the primary training focus for the season. This will shape weekly development priorities.`,
      mood: 'positive',
    });
  }

  return entries;
}

function generateInjuryEntries(injuries: Injury[]): JournalEntry[] {
  return injuries.map(inj => {
    const severityLabel: Record<string, string> = {
      minor: 'minor',
      moderate: 'moderate',
      severe: 'severe',
      career_threatening: 'career-threatening',
    };
    const mood: MoodValue = inj.type === 'minor' ? 'neutral' : inj.type === 'moderate' ? 'negative' : 'negative';

    return {
      id: `injury-${inj.id}`,
      season: inj.seasonSustained,
      week: inj.weekSustained,
      category: 'personal',
      icon: 'Bandage',
      label: 'Injury',
      title: 'Picked up an injury',
      description: `Sustained a ${severityLabel[inj.type]} ${inj.name}. Expected to be out for approximately ${inj.weeksOut} weeks. Focus on recovery and rehabilitation.`,
      mood,
      stats: [{ label: 'Weeks Out', value: inj.weeksOut }],
    };
  });
}

function generateMilestoneEntries(
  achievements: Achievement[],
  seasonAwards: SeasonAward[],
  careerStats: { totalGoals: number; totalAssists: number; totalAppearances: number; totalCleanSheets: number; trophies: { name: string; season: number }[] },
  seasons: { number: number; playerStats: { goals: number; assists: number; appearances: number; averageRating: number; cleanSheets: number; yellowCards: number; redCards: number; manOfTheMatch: number }; achievements: string[] }[],
): JournalEntry[] {
  const entries: JournalEntry[] = [];

  // Unlocked achievements
  for (const a of achievements.filter(a => a.unlocked)) {
    entries.push({
      id: `achievement-${a.id}`,
      season: a.unlockedSeason ?? 1,
      week: 1,
      category: 'milestone',
      icon: 'Medal',
      label: 'Achievement',
      title: `Recognized for excellence`,
      description: `Unlocked the achievement "${a.name}": ${a.description}. A proud moment in the career.`,
      mood: 'positive',
    });
  }

  // Season awards
  for (const award of seasonAwards) {
    entries.push({
      id: `award-${award.id}`,
      season: award.season,
      week: award.month ?? 38,
      category: 'milestone',
      icon: 'Award',
      label: 'Award',
      title: award.name,
      description: `Won "${award.name}" — ${award.stats}. ${award.isPlayer ? 'A personal accolade to cherish.' : `Honored at ${award.winnerClub}.`}`,
      mood: 'positive',
    });
  }

  // Career milestones from stats
  const milestoneChecks: { threshold: number; label: string; stat: number; title: string; desc: string }[] = [];

  if (careerStats.totalAppearances >= 100) {
    milestoneChecks.push({
      threshold: 100,
      label: 'appearances',
      stat: careerStats.totalAppearances,
      title: 'Century of appearances',
      desc: `Reached ${careerStats.totalAppearances} career appearances. A testament to consistency and durability.`,
    });
  } else if (careerStats.totalAppearances >= 50) {
    milestoneChecks.push({
      threshold: 50,
      label: 'appearances',
      stat: careerStats.totalAppearances,
      title: '50 appearances reached',
      desc: `Reached ${careerStats.totalAppearances} career appearances. Building a solid career foundation.`,
    });
  } else if (careerStats.totalAppearances >= 1) {
    milestoneChecks.push({
      threshold: 1,
      label: 'appearances',
      stat: careerStats.totalAppearances,
      title: 'First appearance',
      desc: `Made the first career appearance. The journey of a thousand miles begins with a single step.`,
    });
  }

  if (careerStats.totalGoals >= 50) {
    milestoneChecks.push({
      threshold: 50,
      label: 'goals',
      stat: careerStats.totalGoals,
      title: 'Half-century of goals',
      desc: `Scored ${careerStats.totalGoals} career goals. An impressive goalscoring record.`,
    });
  } else if (careerStats.totalGoals >= 25) {
    milestoneChecks.push({
      threshold: 25,
      label: 'goals',
      stat: careerStats.totalGoals,
      title: '25 career goals',
      desc: `Reached ${careerStats.totalGoals} career goals. Consistently finding the back of the net.`,
    });
  } else if (careerStats.totalGoals >= 10) {
    milestoneChecks.push({
      threshold: 10,
      label: 'goals',
      stat: careerStats.totalGoals,
      title: 'Double-digit goals',
      desc: `Reached ${careerStats.totalGoals} career goals. The goals are starting to flow.`,
    });
  } else if (careerStats.totalGoals >= 1) {
    milestoneChecks.push({
      threshold: 1,
      label: 'goals',
      stat: careerStats.totalGoals,
      title: 'First goal scored',
      desc: `Scored the first career goal. A moment that will never be forgotten.`,
    });
  }

  if (careerStats.totalAssists >= 50) {
    milestoneChecks.push({
      threshold: 50,
      label: 'assists',
      stat: careerStats.totalAssists,
      title: '50 career assists',
      desc: `Provided ${careerStats.totalAssists} career assists. A true playmaker.`,
    });
  } else if (careerStats.totalAssists >= 1) {
    milestoneChecks.push({
      threshold: 1,
      label: 'assists',
      stat: careerStats.totalAssists,
      title: 'First assist',
      desc: `Registered the first career assist. The vision is paying off.`,
    });
  }

  if (careerStats.trophies.length >= 1) {
    for (const trophy of careerStats.trophies) {
      milestoneChecks.push({
        threshold: 1,
        label: `trophy-${trophy.season}`,
        stat: 1,
        title: `Trophy: ${trophy.name}`,
        desc: `Won the ${trophy.name} in season ${trophy.season}. Silverware in the cabinet!`,
      });
    }
  }

  for (const mc of milestoneChecks) {
    entries.push({
      id: `stat-milestone-${mc.label}`,
      season: 1,
      week: 1,
      category: 'milestone',
      icon: 'Trophy',
      label: 'Milestone',
      title: mc.title,
      description: mc.desc,
      mood: 'positive',
      stats: [{ label: mc.label, value: mc.stat }],
    });
  }

  // Season in review entries
  for (const s of seasons) {
    const ps = s.playerStats;
    entries.push({
      id: `season-review-${s.number}`,
      season: s.number,
      week: 38,
      category: 'milestone',
      icon: 'Calendar',
      label: 'Season Review',
      title: `Season ${s.number} in Review`,
      description: `Completed season ${s.number} with ${ps.goals} goals, ${ps.assists} assists, and ${ps.appearances} appearances. Average rating: ${ps.averageRating > 0 ? ps.averageRating.toFixed(1) : 'N/A'}.`,
      mood: ps.averageRating >= 7.0 ? 'positive' : ps.averageRating >= 5.5 ? 'neutral' : 'negative',
      stats: [
        { label: 'G', value: ps.goals },
        { label: 'A', value: ps.assists },
        { label: 'App', value: ps.appearances },
      ],
    });
  }

  return entries;
}

function generatePersonalEntries(resolvedEvents: GameEvent[]): JournalEntry[] {
  return resolvedEvents.map(ev => {
    const mood: MoodValue = ev.type === 'TEAM_CONFLICT' || ev.type === 'MEDIA_INTERVIEW' ? 'neutral' : 'neutral';
    return {
      id: `event-${ev.id}`,
      season: ev.season,
      week: ev.week,
      category: 'personal',
      icon: 'MessageSquare',
      label: 'Life Event',
      title: ev.title,
      description: ev.description,
      mood,
    };
  });
}

function generateTransferEntry(currentClubName: string, currentSeason: number, careerStats: { totalAppearances: number }): JournalEntry[] {
  const entries: JournalEntry[] = [];

  // Joining a new club (first season / first appearance)
  if (careerStats.totalAppearances <= 1) {
    entries.push({
      id: 'transfer-join',
      season: currentSeason,
      week: 1,
      category: 'transfer',
      icon: 'ArrowRightLeft',
      label: 'Transfer',
      title: 'New chapter begins',
      description: `Signed for ${currentClubName}. A fresh start and an opportunity to prove worth at the new club. Ready to give everything on the pitch.`,
      mood: 'positive',
    });
  }

  return entries;
}

function generateContractEntry(playerContract: { yearsRemaining: number; weeklyWage: number }, currentSeason: number): JournalEntry[] {
  const entries: JournalEntry[] = [];

  if (playerContract.yearsRemaining >= 1) {
    entries.push({
      id: 'contract-signed',
      season: currentSeason,
      week: 1,
      category: 'transfer',
      icon: 'FileText',
      label: 'Contract',
      title: 'Signed a new deal',
      description: `Put pen to paper on a contract with ${playerContract.yearsRemaining} years remaining. The commitment shows the club's faith in future potential.`,
      mood: 'positive',
      stats: [{ label: 'Years', value: playerContract.yearsRemaining }],
    });
  }

  return entries;
}

// ─── Mood Helpers ────────────────────────────────────────────

function moodToNumeric(mood: MoodValue): number {
  return mood === 'positive' ? 1 : mood === 'neutral' ? 0 : -1;
}

function numericToColor(val: number): string {
  if (val >= 0.5) return 'bg-emerald-500';
  if (val <= -0.5) return 'bg-red-500';
  return 'bg-amber-500';
}

// ─── Component ───────────────────────────────────────────────

export default function CareerJournal() {
  const gameState = useGameStore(state => state.gameState);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Generate all entries
  const allEntries = useMemo<JournalEntry[]>(() => {
    if (!gameState) return [];

    const {
      recentResults,
      trainingHistory,
      seasonTrainingFocus,
      injuries,
      achievements,
      seasonAwards,
      player,
      currentClub,
      currentSeason,
      seasons,
      resolvedEvents,
    } = gameState;

    const entries: JournalEntry[] = [];

    // Transfer & contract
    entries.push(...generateTransferEntry(currentClub.name, currentSeason, player.careerStats));
    entries.push(...generateContractEntry(player.contract, currentSeason));

    // Match entries
    entries.push(...generateMatchEntries(recentResults, currentClub.id));

    // Training entries
    entries.push(...generateTrainingEntries(trainingHistory, seasonTrainingFocus?.area ?? null));

    // Injury entries
    entries.push(...generateInjuryEntries(injuries));

    // Personal events
    entries.push(...generatePersonalEntries(resolvedEvents));

    // Milestones & achievements
    entries.push(...generateMilestoneEntries(achievements, seasonAwards, player.careerStats, seasons));

    // Sort: newest first (by season desc, week desc, then by category priority)
    const catOrder: Record<JournalCategory, number> = {
      match: 0,
      personal: 1,
      training: 2,
      transfer: 3,
      milestone: 4,
    };

    entries.sort((a, b) => {
      if (a.season !== b.season) return b.season - a.season;
      if (a.week !== b.week) return b.week - a.week;
      return catOrder[a.category] - catOrder[b.category];
    });

    return entries;
  }, [gameState]);

  // Filter and search
  const filteredEntries = useMemo(() => {
    let filtered = allEntries;
    if (activeFilter !== 'all') {
      filtered = filtered.filter(e => e.category === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.label.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allEntries, activeFilter, searchQuery]);

  // Stats
  const journalStats = useMemo(() => {
    const total = allEntries.length;
    const thisSeasonEntries = allEntries.filter(e => {
      if (!gameState) return false;
      return e.season === gameState.currentSeason || e.season === 0;
    }).length;

    // Most common category
    const catCounts: Record<string, number> = {};
    for (const e of allEntries) {
      catCounts[e.category] = (catCounts[e.category] ?? 0) + 1;
    }
    let mostCommonCat = 'none';
    let mostCommonCount = 0;
    for (const [cat, count] of Object.entries(catCounts)) {
      if (count > mostCommonCount) {
        mostCommonCount = count;
        mostCommonCat = cat;
      }
    }

    // Longest streak without negative entry
    let longestStreak = 0;
    let currentStreak = 0;
    for (const e of allEntries) {
      if (e.mood !== 'negative') {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      total,
      thisSeasonEntries,
      mostCommonCategory: mostCommonCat === 'none' ? 'N/A' : CATEGORY_CONFIG[mostCommonCat as JournalCategory]?.label ?? 'N/A',
      longestStreak,
    };
  }, [allEntries, gameState]);

  // Mood chart data (last 20 entries)
  const moodChartData = useMemo(() => {
    return allEntries.slice(0, 20).map(e => ({
      id: e.id,
      mood: e.mood,
      numeric: moodToNumeric(e.mood),
      label: e.title,
    })).reverse(); // oldest first for left-to-right chart
  }, [allEntries]);

  if (!gameState) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8b949e] text-sm">No career data available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-24">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-6 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#c9d1d9]">Career Journal</h1>
            <p className="text-xs text-[#8b949e]">
              {journalStats.total} entries recorded
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Card ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">
          Journal Stats
        </p>
        <div className="grid grid-cols-4 gap-2">
          <StatsBox label="Total" value={journalStats.total} />
          <StatsBox label="This Season" value={journalStats.thisSeasonEntries} />
          <StatsBox label="Streak" value={journalStats.longestStreak} />
          <StatsBox label="Top Category" value={journalStats.mostCommonCategory} isText />
        </div>
      </motion.div>

      {/* ─── Mood Tracker ─── */}
      {moodChartData.length >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#8b949e]" />
              <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
                Mood Trajectory
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                <span className="text-[8px] text-[#484f58]">Good</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amber-500" />
                <span className="text-[8px] text-[#484f58]">OK</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-red-500" />
                <span className="text-[8px] text-[#484f58]">Bad</span>
              </span>
            </div>
          </div>

          {/* Mood chart SVG */}
          <div className="w-full h-20 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="border-b border-dashed border-[#21262d]" />
              <div className="border-b border-dashed border-[#21262d]" />
              <div className="border-b border-dashed border-[#21262d]" />
            </div>

            <svg className="w-full h-full" viewBox={`0 0 ${moodChartData.length * 30 - 10} 80`} preserveAspectRatio="none">
              {/* Connection lines */}
              <polyline
                fill="none"
                stroke="#30363d"
                strokeWidth="1.5"
                points={moodChartData.map((d, i) => {
                  const x = i * 30 + 5;
                  const y = 40 - d.numeric * 30;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {/* Dots */}
              {moodChartData.map((d, i) => {
                const x = i * 30 + 5;
                const y = 40 - d.numeric * 30;
                const color = d.mood === 'positive' ? '#10b981' : d.mood === 'negative' ? '#ef4444' : '#f59e0b';
                return (
                  <circle
                    key={d.id}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={color}
                    stroke="#0d1117"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>
        </motion.div>
      )}

      {/* ─── Search ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="mb-3"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#484f58]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search journal entries..."
            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-8 py-2.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
            >
              <span className="text-xs">&times;</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ─── Filter Tabs ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex gap-1.5 mb-4 overflow-x-auto pb-1"
      >
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors
              ${activeFilter === tab.key
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-[#484f58] hover:text-[#c9d1d9]'
              }
            `}
          >
            {tab.key !== 'all' && (
              <span className={activeFilter === tab.key ? 'text-emerald-400' : 'text-[#484f58]'}>
                {CATEGORY_CONFIG[tab.key as JournalCategory]?.icon}
              </span>
            )}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ─── Timeline ─── */}
      <div className="relative">
        {/* Vertical line */}
        {filteredEntries.length > 0 && (
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[#21262d]" />
        )}

        <AnimatePresence mode="popLayout">
          {filteredEntries.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-[#484f58]"
            >
              <BookOpen className="h-8 w-8 mb-3 text-[#30363d]" />
              <p className="text-sm font-medium">No entries found</p>
              <p className="text-xs mt-1">
                {searchQuery ? 'Try a different search term' : 'Start playing to fill your journal'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry, idx) => (
                <JournalEntryCard key={entry.id} entry={entry} index={idx} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ─── NEW SECTIONS: Word Cloud · Mood · Templates · Milestones · Stats ─── */}
      {/* ═══════════════════════════════════════════════════════════ */}

      {/* ─── Season Word Cloud ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Cloud className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Season Keywords
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {WORD_CLOUD_DATA.map((kw) => {
            const sizeClass =
              kw.frequency >= 12 ? 'text-xl font-bold' :
              kw.frequency >= 8 ? 'text-lg font-semibold' :
              kw.frequency >= 5 ? 'text-base font-medium' :
              kw.frequency >= 3 ? 'text-sm font-medium' :
              'text-xs';
            const colorClass =
              kw.sentiment === 'positive' ? 'text-emerald-400' :
              kw.sentiment === 'negative' ? 'text-red-400' :
              'text-slate-400';
            return (
              <span
                key={kw.word}
                className={`${sizeClass} ${colorClass} px-1.5 py-0.5 bg-[#0d1117] border border-[#21262d] rounded-md inline-block leading-none cursor-default hover:border-[#484f58] transition-colors`}
              >
                {kw.word}
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[#21262d]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" />
            <span className="text-[9px] text-[#484f58]">Positive</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-slate-400" />
            <span className="text-[9px] text-[#484f58]">Neutral</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-red-500" />
            <span className="text-[9px] text-[#484f58]">Negative</span>
          </span>
        </div>
      </motion.div>

      {/* ─── Enhanced Mood Tracker ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Mood Tracker
          </p>
        </div>

        {/* 7-day mood strip */}
        <div className="flex items-center justify-between mb-4 px-1">
          {MOOD_TRACKER_DATA.weeklyMoods.map((d) => {
            const colorMap: Record<string, string> = {
              excellent: 'bg-emerald-500',
              good: 'bg-sky-500',
              okay: 'bg-amber-500',
              bad: 'bg-orange-500',
              terrible: 'bg-red-500',
            };
            return (
              <div key={d.day} className="flex flex-col items-center gap-1.5">
                <span className={`w-5 h-5 rounded-md ${colorMap[d.mood]} border border-[#0d1117]`} />
                <span className="text-[9px] text-[#484f58]">{d.day}</span>
              </div>
            );
          })}
        </div>

        {/* Weekly average mood score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#8b949e]">Weekly Average Mood</span>
            <span className="text-xs font-semibold text-emerald-400">
              {MOOD_TRACKER_DATA.weeklyAverage.toFixed(1)}/5
            </span>
          </div>
          <div className="w-full h-2 bg-[#0d1117] border border-[#21262d] rounded-md overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-md"
              style={{ width: `${(MOOD_TRACKER_DATA.weeklyAverage / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Monthly mood distribution bar chart */}
        <div className="mb-4">
          <span className="text-[10px] text-[#484f58] uppercase tracking-wide font-medium">
            Monthly Distribution
          </span>
          <div className="mt-2 space-y-1.5">
            {MOOD_TRACKER_DATA.monthlyDistribution.map((d) => (
              <div key={d.level} className="flex items-center gap-2">
                <span className="text-[9px] text-[#8b949e] w-14 text-right">{d.level}</span>
                <div className="flex-1 h-3 bg-[#0d1117] border border-[#21262d] rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm"
                    style={{ width: `${(d.count / 12) * 100}%`, backgroundColor: d.color }}
                  />
                </div>
                <span className="text-[9px] text-[#484f58] w-4 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mood influences */}
        <div className="pt-3 border-t border-[#21262d]">
          <span className="text-[10px] text-[#484f58] uppercase tracking-wide font-medium">
            Mood Influences
          </span>
          <div className="mt-2 space-y-2">
            {MOOD_TRACKER_DATA.influences.map((inf) => (
              <div key={inf.factor} className="flex items-center justify-between">
                <span className="text-[10px] text-[#8b949e]">{inf.factor}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-[#0d1117] border border-[#21262d] rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${inf.impact * 100}%`,
                        backgroundColor: inf.direction === 'up' ? '#10b981' : '#ef4444',
                      }}
                    />
                  </div>
                  <span
                    className={`text-[9px] font-medium w-8 text-right ${
                      inf.direction === 'up' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {inf.direction === 'up' ? '+' : '-'}{(inf.impact * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Journal Entry Templates ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Quick Templates
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {JOURNAL_TEMPLATES.map((tmpl) => (
            <TemplateCard
              key={tmpl.id}
              template={tmpl}
              isSelected={selectedTemplate === tmpl.id}
              onSelect={() => setSelectedTemplate(selectedTemplate === tmpl.id ? null : tmpl.id)}
            />
          ))}
        </div>
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 bg-[#161b22] border border-[#30363d] rounded-lg p-3"
            >
              <p className="text-[10px] text-[#484f58] uppercase tracking-wide font-medium mb-2">
                Template Preview — {JOURNAL_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
              </p>
              <pre className="text-xs text-[#8b949e] whitespace-pre-wrap font-mono bg-[#0d1117] border border-[#21262d] rounded-md p-3 leading-relaxed">
                {JOURNAL_TEMPLATES.find((t) => t.id === selectedTemplate)?.templateText}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Career Milestones in Journal ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-[#8b949e]" />
            <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
              Career Milestones
            </p>
          </div>
          <button className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5">
            View All <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2">
          {CAREER_MILESTONES.map((ms) => (
            <MilestoneCard key={ms.id} milestone={ms} />
          ))}
        </div>
      </motion.div>

      {/* ─── Journal Statistics ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.45 }}
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-3.5 w-3.5 text-[#8b949e]" />
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest">
            Journal Statistics
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatsBox label="Total Entries" value={JOURNAL_STATISTICS.totalEntries} />
          <StatsBox label="Avg Words" value={JOURNAL_STATISTICS.avgWordsPerEntry} />
          <StatsBox label="Best Streak" value={JOURNAL_STATISTICS.longestStreak} />
        </div>

        {/* Most common topics bar chart */}
        <div className="mb-4">
          <span className="text-[10px] text-[#484f58] uppercase tracking-wide font-medium">
            Most Common Topics
          </span>
          <div className="mt-2 space-y-1.5">
            {JOURNAL_STATISTICS.mostCommonTopics.map((t) => (
              <div key={t.topic} className="flex items-center gap-2">
                <span className="text-[9px] text-[#8b949e] w-16 text-right">{t.topic}</span>
                <div className="flex-1 h-2.5 bg-[#0d1117] border border-[#21262d] rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm"
                    style={{ width: `${(t.count / 52) * 100}%`, backgroundColor: t.color }}
                  />
                </div>
                <span className="text-[9px] text-[#484f58] w-4 text-right">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Journal Consistency score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#8b949e]">Journal Consistency</span>
            <span className="text-xs font-semibold text-emerald-400">
              {JOURNAL_STATISTICS.consistencyScore}/100
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#0d1117] border border-[#21262d] rounded-md overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-md"
              style={{ width: `${JOURNAL_STATISTICS.consistencyScore}%` }}
            />
          </div>
        </div>

        {/* Entries per season SVG bar chart */}
        <div>
          <span className="text-[10px] text-[#484f58] uppercase tracking-wide font-medium">
            Entries per Season
          </span>
          <div className="mt-2">
            <svg viewBox="0 0 200 60" className="w-full h-auto">
              {JOURNAL_STATISTICS.entriesPerSeason.map((s, i) => {
                const barHeight = (s.count / 50) * 45;
                const x = i * 50 + 10;
                return (
                  <g key={s.season}>
                    <rect
                      x={x}
                      y={50 - barHeight}
                      width={30}
                      height={barHeight}
                      rx={3}
                      fill="#10b981"
                      opacity={0.7}
                    />
                    <text
                      x={x + 15}
                      y={48 - barHeight}
                      textAnchor="middle"
                      fill="#8b949e"
                      fontSize="8"
                    >
                      {s.count}
                    </text>
                    <text
                      x={x + 15}
                      y={58}
                      textAnchor="middle"
                      fill="#484f58"
                      fontSize="8"
                    >
                      {s.season}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────

function StatsBox({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-2.5 flex flex-col items-center gap-1">
      <span className={isText ? 'text-[10px] font-bold text-emerald-400 text-center leading-tight' : 'text-lg font-bold text-[#c9d1d9]'}>
        {value}
      </span>
      <span className="text-[9px] text-[#484f58] uppercase tracking-wide">{label}</span>
    </div>
  );
}

function JournalEntryCard({ entry, index }: { entry: JournalEntry; index: number }) {
  const catConfig = CATEGORY_CONFIG[entry.category];
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      className={`relative pl-10 pr-3 py-3 bg-[#161b22] border ${catConfig.borderColor} border-l-2 rounded-lg overflow-hidden`}
    >
      {/* Timeline dot */}
      <div className={`absolute left-[15px] top-4 w-[9px] h-[9px] rounded-sm border-2 border-[#0d1117] ${MOOD_COLOR[entry.mood]}`} />

      {/* Date badge */}
      <div className="flex items-center gap-2 mb-1.5">
        {entry.season > 0 && (
          <span className="text-[9px] font-semibold text-[#484f58] bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#21262d]">
            S{entry.season} W{entry.week}
          </span>
        )}
        <span className={`flex items-center gap-1 text-[9px] font-medium ${catConfig.textColor} ${catConfig.bgTint} px-1.5 py-0.5 rounded`}>
          {catConfig.icon}
          {catConfig.label}
        </span>
        <span className="text-xs ml-auto">{MOOD_EMOJI[entry.mood]}</span>
      </div>

      {/* Title */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full text-left flex items-start justify-between gap-2"
      >
        <h3 className="text-sm font-semibold text-[#c9d1d9] leading-tight">{entry.title}</h3>
        <ChevronRight className={`h-4 w-4 text-[#484f58] flex-shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Stats row (always visible if present) */}
      {entry.stats && entry.stats.length > 0 && (
        <div className="flex items-center gap-3 mt-2">
          {entry.stats.map((s, si) => (
            <span key={si} className="text-[10px] text-[#8b949e]">
              <span className="font-semibold text-[#c9d1d9]">{s.value}</span> {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Expanded description */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-xs text-[#8b949e] mt-2 leading-relaxed">
              {entry.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Template Card Sub-Component ─────────────────────────────

function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    templateText: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const IconComponent = template.icon;
  return (
    <button
      onClick={onSelect}
      className={`bg-[#161b22] border rounded-lg p-3 text-left transition-colors ${
        isSelected
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-[#30363d] hover:border-[#484f58]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <IconComponent className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-[#c9d1d9]">{template.name}</span>
      </div>
      <p className="text-[10px] text-[#8b949e] leading-relaxed mb-2">{template.description}</p>
      <span className="text-[9px] text-emerald-400 font-medium">Use Template</span>
    </button>
  );
}

// ─── Milestone Card Sub-Component ─────────────────────────────

function MilestoneCard({
  milestone,
}: {
  milestone: {
    id: string;
    title: string;
    season: number;
    week: number;
    description: string;
    icon: 'star' | 'shield' | 'trophy' | 'flag';
    journalEntries: number;
  };
}) {
  const iconMap: Record<string, React.ReactNode> = {
    star: <Star className="h-4 w-4 text-yellow-400" />,
    shield: <Shield className="h-4 w-4 text-sky-400" />,
    trophy: <Trophy className="h-4 w-4 text-amber-400" />,
    flag: <Flag className="h-4 w-4 text-emerald-400" />,
  };
  return (
    <div className="flex items-start gap-3 bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
      <div className="w-8 h-8 bg-[#161b22] border border-[#30363d] rounded-lg flex items-center justify-center flex-shrink-0">
        {iconMap[milestone.icon] ?? <Star className="h-4 w-4 text-yellow-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-xs font-semibold text-[#c9d1d9]">{milestone.title}</h4>
          <span className="text-[9px] text-[#484f58] bg-[#161b22] px-1.5 py-0.5 rounded border border-[#21262d]">
            S{milestone.season} W{milestone.week}
          </span>
        </div>
        <p className="text-[10px] text-[#8b949e] leading-relaxed">{milestone.description}</p>
        <span className="text-[9px] text-[#484f58] mt-1 inline-block">
          {milestone.journalEntries} linked entries
        </span>
      </div>
    </div>
  );
}
