'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Types & Interfaces
// ============================================================

type CareerEventCategory = 'personal' | 'professional' | 'social' | 'medical' | 'financial';
type CareerEventSentiment = 'positive' | 'neutral' | 'negative';
type EventOutcome = 'positive' | 'negative' | 'mixed';

interface CareerEventChoice {
  id: string;
  label: string;
  description: string;
  reputation: number;
  morale: number;
  financial: number;
  fitness: number;
}

interface CareerEvent {
  id: string;
  title: string;
  description: string;
  category: CareerEventCategory;
  sentiment: CareerEventSentiment;
  daysRemaining: number;
  actionRequired: boolean;
  choices: CareerEventChoice[];
}

interface ResolvedCareerEvent {
  id: string;
  title: string;
  category: CareerEventCategory;
  sentiment: CareerEventSentiment;
  choiceMade: string;
  reputation: number;
  morale: number;
  financial: number;
  fitness: number;
  outcome: EventOutcome;
  timestamp: string;
}

interface CategoryProbability {
  category: CareerEventCategory;
  probability: number;
  label: string;
  color: string;
  bg: string;
  iconPath: string;
}

// ============================================================
// Category Configuration
// ============================================================

const categoryConfig: Record<CareerEventCategory, {
  label: string;
  color: string;
  bg: string;
  border: string;
  iconColor: string;
  svgIcon: React.ReactNode;
}> = {
  personal: {
    label: 'Personal',
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    iconColor: '#fb7185',
    svgIcon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
  },
  professional: {
    label: 'Professional',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    iconColor: '#38bdf8',
    svgIcon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        <rect width="20" height="14" x="2" y="6" rx="2" />
      </svg>
    ),
  },
  social: {
    label: 'Social',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    iconColor: '#c084fc',
    svgIcon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  medical: {
    label: 'Medical',
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    iconColor: '#f87171',
    svgIcon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2Z" />
      </svg>
    ),
  },
  financial: {
    label: 'Financial',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    iconColor: '#34d399',
    svgIcon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
};

// ============================================================
// Seeded Random for Deterministic Event Generation
// ============================================================

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ============================================================
// Event Template Definitions
// ============================================================

interface EventTemplate {
  title: string;
  description: string;
  category: CareerEventCategory;
  sentiment: CareerEventSentiment;
  actionRequired: boolean;
  choices: CareerEventChoice[];
  weight: number;
}

const eventTemplates: EventTemplate[] = [
  // Personal Events
  {
    title: 'Family Celebration',
    description: 'Your family wants to throw a surprise party for your recent milestone. They\'ve been planning it for weeks and want you to be there. It might conflict with recovery sessions, but family comes first.',
    category: 'personal',
    sentiment: 'positive',
    actionRequired: true,
    weight: 8,
    choices: [
      { id: 'attend', label: 'Attend the party', description: 'Go and enjoy quality time with your family.', reputation: 0, morale: 8, financial: -500, fitness: -2 },
      { id: 'skip', label: 'Focus on training', description: 'Stay committed to your recovery schedule.', reputation: -2, morale: -5, financial: 0, fitness: 3 },
    ],
  },
  {
    title: 'Relationship Milestone',
    description: 'Your partner has been incredibly supportive through your career. They\'ve suggested taking the next step in your relationship, but the timing coincides with an important upcoming match.',
    category: 'personal',
    sentiment: 'positive',
    actionRequired: true,
    weight: 6,
    choices: [
      { id: 'commit', label: 'Prioritize the relationship', description: 'This could strengthen your emotional foundation.', reputation: 2, morale: 10, financial: -2000, fitness: -1 },
      { id: 'delay', label: 'Ask for more time', description: 'Focus on football first, relationships later.', reputation: -3, morale: -4, financial: 0, fitness: 0 },
    ],
  },
  // Professional Events
  {
    title: 'Contract Extension Offer',
    description: 'The club has tabled a contract extension with improved terms. Your agent says it\'s a fair deal, but other clubs have shown interest. You need to decide quickly before the window shifts.',
    category: 'professional',
    sentiment: 'positive',
    actionRequired: true,
    weight: 10,
    choices: [
      { id: 'sign', label: 'Sign the extension', description: 'Commit your future to the current club.', reputation: 5, morale: 6, financial: 5000, fitness: 0 },
      { id: 'negotiate', label: 'Negotiate better terms', description: 'Push for more wages and bonuses.', reputation: 1, morale: 2, financial: 8000, fitness: 0 },
      { id: 'wait', label: 'Explore other options', description: 'Keep your options open for now.', reputation: -2, morale: -3, financial: 0, fitness: 0 },
    ],
  },
  {
    title: 'Transfer Interest',
    description: 'A top-tier club from a bigger league has submitted an official inquiry about your availability. Their scouts have been watching your recent performances closely.',
    category: 'professional',
    sentiment: 'neutral',
    actionRequired: true,
    weight: 9,
    choices: [
      { id: 'interested', label: 'Express interest', description: 'Open negotiations with the interested club.', reputation: 3, morale: 5, financial: 0, fitness: -2 },
      { id: 'loyal', label: 'Stay loyal', description: 'Reaffirm your commitment to the current club.', reputation: 6, morale: 3, financial: 2000, fitness: 0 },
    ],
  },
  {
    title: 'Award Nomination',
    description: 'You\'ve been nominated for Young Player of the Season! The ceremony is next week and your presence is expected. It\'s a huge honor that could boost your public profile.',
    category: 'professional',
    sentiment: 'positive',
    actionRequired: false,
    weight: 7,
    choices: [
      { id: 'accept', label: 'Attend the ceremony', description: 'Enjoy the recognition and network with peers.', reputation: 8, morale: 6, financial: 0, fitness: -1 },
    ],
  },
  // Social Events
  {
    title: 'Viral Social Media Moment',
    description: 'A video of your latest goal celebration has gone viral with over 2 million views. Brands are reaching out for potential partnerships, but some critics say you\'re too focused on your image.',
    category: 'social',
    sentiment: 'positive',
    actionRequired: true,
    weight: 8,
    choices: [
      { id: 'embrace', label: 'Embrace the fame', description: 'Capitalize on the attention for sponsorship deals.', reputation: 5, morale: 4, financial: 3000, fitness: -1 },
      { id: 'humble', label: 'Stay grounded', description: 'Downplay the hype and focus on football.', reputation: 3, morale: 2, financial: -500, fitness: 1 },
    ],
  },
  {
    title: 'Fan Recognition',
    description: 'A supporters\' group has started a campaign celebrating your contributions to the team. They\'ve organized a tribute at the next home match and want you involved.',
    category: 'social',
    sentiment: 'positive',
    actionRequired: false,
    weight: 6,
    choices: [
      { id: 'thank', label: 'Thank the fans', description: 'Publicly acknowledge their support.', reputation: 4, morale: 7, financial: 0, fitness: 0 },
    ],
  },
  {
    title: 'Media Controversy',
    description: 'A tabloid has published a misleading story about your nightlife habits. The story has gained traction online and the club\'s PR team wants a response within 24 hours.',
    category: 'social',
    sentiment: 'negative',
    actionRequired: true,
    weight: 7,
    choices: [
      { id: 'deny', label: 'Issue a strong denial', description: 'Fight back against the false claims publicly.', reputation: 2, morale: -3, financial: -1000, fitness: 0 },
      { id: 'ignore', label: 'Ignore the noise', description: 'Let your performances on the pitch speak.', reputation: -2, morale: -5, financial: 0, fitness: 1 },
      { id: 'apologize', label: 'Apologize preemptively', description: 'Diffuse the situation even if the claims are exaggerated.', reputation: 0, morale: -8, financial: 0, fitness: 0 },
    ],
  },
  // Medical Events
  {
    title: 'Minor Injury Scare',
    description: 'You felt a sharp pain in your hamstring during training. The medical team says it\'s likely nothing serious but recommends rest. Missing training could affect your match fitness.',
    category: 'medical',
    sentiment: 'negative',
    actionRequired: true,
    weight: 9,
    choices: [
      { id: 'rest', label: 'Rest and recover', description: 'Follow medical advice and take it easy.', reputation: 0, morale: -3, financial: 0, fitness: 8 },
      { id: 'play', label: 'Push through', description: 'Insist on continuing training.', reputation: 2, morale: 2, financial: 0, fitness: -10 },
      { id: 'light', label: 'Light training only', description: 'Compromise with modified sessions.', reputation: 1, morale: -1, financial: 0, fitness: 3 },
    ],
  },
  {
    title: 'Fitness Assessment',
    description: 'The coaching staff wants you to undergo a comprehensive fitness assessment. Results could influence your selection for upcoming matches and determine your training regimen.',
    category: 'medical',
    sentiment: 'neutral',
    actionRequired: false,
    weight: 5,
    choices: [
      { id: 'full', label: 'Full assessment', description: 'Get a complete evaluation done.', reputation: 2, morale: 1, financial: 0, fitness: 5 },
    ],
  },
  // Financial Events
  {
    title: 'Sponsorship Deal',
    description: 'A major sportswear brand has offered you a sponsorship deal worth a significant amount. The contract includes promotional obligations that will take time away from rest days.',
    category: 'financial',
    sentiment: 'positive',
    actionRequired: true,
    weight: 8,
    choices: [
      { id: 'accept', label: 'Accept the deal', description: 'Sign the sponsorship contract for extra income.', reputation: 3, morale: 3, financial: 10000, fitness: -3 },
      { id: 'reject', label: 'Decline politely', description: 'Focus solely on football without distractions.', reputation: 1, morale: 0, financial: 0, fitness: 2 },
      { id: 'negotiate_sponsor', label: 'Negotiate terms', description: 'Ask for fewer obligations with similar pay.', reputation: 2, morale: 2, financial: 7000, fitness: -1 },
    ],
  },
  {
    title: 'Financial Advisor Meeting',
    description: 'Your financial advisor has scheduled a review of your investment portfolio. Some investments have performed well while others need rebalancing. Proper management could secure your post-career future.',
    category: 'financial',
    sentiment: 'neutral',
    actionRequired: false,
    weight: 4,
    choices: [
      { id: 'invest', label: 'Follow advisor recommendations', description: 'Rebalance your portfolio for long-term growth.', reputation: 0, morale: 2, financial: 4000, fitness: 0 },
    ],
  },
  {
    title: 'Charity Opportunity',
    description: 'A local children\'s hospital has invited you to visit and spend time with young patients. It\'s a meaningful cause that could inspire the community and improve your public image.',
    category: 'personal',
    sentiment: 'positive',
    actionRequired: false,
    weight: 5,
    choices: [
      { id: 'visit', label: 'Make the visit', description: 'Spend a day bringing joy to the children.', reputation: 6, morale: 5, financial: -500, fitness: -1 },
    ],
  },
];

// ============================================================
// Event Generation
// ============================================================

function generateEvents(seed: number, week: number, reputation: number): CareerEvent[] {
  const rand = seededRandom(seed * 7 + week * 13 + reputation);
  const events: CareerEvent[] = [];
  const usedIndices = new Set<number>();

  // Select 3-5 events based on seed
  const eventCount = 3 + Math.floor(rand() * 3); // 3-5

  for (let i = 0; i < eventCount && events.length < 5; i++) {
    // Weighted selection
    let totalWeight = 0;
    const available = eventTemplates
      .map((t, idx) => ({ ...t, idx }))
      .filter(t => !usedIndices.has(t.idx));
    for (const t of available) totalWeight += t.weight;

    let roll = rand() * totalWeight;
    let selected: EventTemplate | null = null;
    let selectedIdx = -1;

    for (const t of available) {
      roll -= t.weight;
      if (roll <= 0) {
        selected = t;
        selectedIdx = t.idx;
        break;
      }
    }

    if (!selected) {
      selected = available[0];
      selectedIdx = available[0].idx;
    }

    if (!selected || usedIndices.has(selectedIdx)) continue;
    usedIndices.add(selectedIdx);

    events.push({
      id: `evt-${seed}-${week}-${i}`,
      title: selected.title,
      description: selected.description,
      category: selected.category,
      sentiment: selected.sentiment,
      daysRemaining: 1 + Math.floor(rand() * 6),
      actionRequired: selected.actionRequired,
      choices: selected.choices,
    });
  }

  return events;
}

// ============================================================
// Probability Data
// ============================================================

const categoryProbabilities: CategoryProbability[] = [
  { category: 'personal', probability: 30, label: 'Personal', color: '#fb7185', bg: 'bg-rose-500', iconPath: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z' },
  { category: 'professional', probability: 25, label: 'Professional', color: '#38bdf8', bg: 'bg-sky-500', iconPath: 'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16 M22 6H2 M2 10h20 M2 14h20 M2 18h20' },
  { category: 'social', probability: 20, label: 'Social', color: '#c084fc', bg: 'bg-purple-500', iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  { category: 'medical', probability: 15, label: 'Medical', color: '#f87171', bg: 'bg-red-500', iconPath: 'M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2Z' },
  { category: 'financial', probability: 10, label: 'Financial', color: '#34d399', bg: 'bg-emerald-500', iconPath: 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
];

// ============================================================
// SVG Donut Chart Component
// ============================================================

function DonutChart({ data }: { data: CategoryProbability[] }) {
  const size = 120;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = data.reduce<Array<{ probability: number; label: string; color: string; segLength: number; offset: number }>>((acc, item) => {
    const length = (item.probability / 100) * circumference;
    const gap = 3;
    const segLength = Math.max(0, length - gap);
    const offset = acc.reduce((sum, s) => sum + (s.probability / 100) * circumference, 0);
    return [...acc, { ...item, segLength, offset, color: item.color }];
  }, []);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.segLength} ${circumference - seg.segLength}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="butt"
            opacity={0.85}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold text-[#c9d1d9]">100%</span>
        <span className="text-[9px] text-[#484f58]">total</span>
      </div>
    </div>
  );
}

// ============================================================
// Sentiment Icon (inline SVG)
// ============================================================

function SentimentIcon({ sentiment }: { sentiment: CareerEventSentiment }) {
  if (sentiment === 'positive') {
    return (
      <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V12L14 14" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }
  if (sentiment === 'negative') {
    return (
      <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 5 6 6-6 6" />
        <path d="M4 11H21" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}

// ============================================================
// Event Card Component
// ============================================================

function EventCard({
  event,
  index,
  onSelect,
}: {
  event: CareerEvent;
  index: number;
  onSelect: (event: CareerEvent) => void;
}) {
  const config = categoryConfig[event.category];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.2 }}
      className={`rounded-lg border bg-[#161b22] overflow-hidden ${
        event.actionRequired
          ? `border-l-[3px] ${config.border}`
          : 'border-[#30363d]'
      }`}
    >
      <button
        onClick={() => onSelect(event)}
        className="w-full text-left p-3"
      >
        {/* Top Row: Icon, Title, Badges */}
        <div className="flex items-start gap-2.5">
          {/* Category icon */}
          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}
            style={{ color: config.iconColor }}
          >
            {config.svgIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <SentimentIcon sentiment={event.sentiment} />
              <h3 className="text-sm font-semibold text-[#e6edf3] truncate">{event.title}</h3>
            </div>
            {/* Category badge + action required */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[9px] font-medium px-1.5 py-px rounded-md ${config.bg} ${config.color} border ${config.border}`}>
                {config.label}
              </span>
              {event.actionRequired && (
                <span className="text-[9px] font-semibold px-1.5 py-px rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  Action
                </span>
              )}
              <span className="ml-auto text-[9px] text-[#484f58] flex items-center gap-0.5">
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {event.daysRemaining}d left
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#8b949e] mt-2 leading-relaxed line-clamp-2">
          {event.description}
        </p>
      </button>
    </motion.div>
  );
}

// ============================================================
// Event Decision Modal Component
// ============================================================

function EventDecisionModal({
  event,
  onChoose,
  onClose,
}: {
  event: CareerEvent;
  onChoose: (eventId: string, choiceId: string) => void;
  onClose: () => void;
}) {
  const config = categoryConfig[event.category];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.15 }}
        className="relative w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className={`px-4 pt-4 pb-3 border-b border-[#30363d] ${config.bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ color: config.iconColor }}>
              {config.svgIcon}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-medium px-1.5 py-px rounded-md border ${config.bg} ${config.color} ${config.border}`}>
                {config.label}
              </span>
              <SentimentIcon sentiment={event.sentiment} />
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-[#8b949e] hover:text-[#c9d1d9] transition-colors p-0.5"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <h2 className="text-base font-bold text-[#e6edf3]">{event.title}</h2>
        </div>

        {/* Narrative */}
        <div className="px-4 py-3">
          <p className="text-sm text-[#8b949e] leading-relaxed">{event.description}</p>
        </div>

        {/* Choices */}
        <div className="px-4 pb-4 space-y-2">
          <div className="text-[10px] font-semibold text-[#484f58] uppercase tracking-wider mb-2">Choose your response</div>
          {event.choices.map((choice) => (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              whileHover={{ opacity: 0.85 }}
              onClick={() => onChoose(event.id, choice.id)}
              className="w-full text-left p-3 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#444c56] transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-[#c9d1d9] group-hover:text-[#e6edf3] transition-colors">
                  {choice.label}
                </span>
                <svg className="h-4 w-4 text-[#484f58] group-hover:text-emerald-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <p className="text-xs text-[#8b949e] mb-2">{choice.description}</p>
              {/* Consequence preview badges */}
              <div className="flex flex-wrap gap-1">
                {choice.reputation !== 0 && (
                  <span className={`text-[10px] font-medium px-1.5 py-px rounded-md ${choice.reputation > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {choice.reputation > 0 ? '+' : ''}{choice.reputation} Rep
                  </span>
                )}
                {choice.morale !== 0 && (
                  <span className={`text-[10px] font-medium px-1.5 py-px rounded-md ${choice.morale > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {choice.morale > 0 ? '+' : ''}{choice.morale} Morale
                  </span>
                )}
                {choice.financial !== 0 && (
                  <span className={`text-[10px] font-medium px-1.5 py-px rounded-md ${choice.financial > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {choice.financial > 0 ? '+' : ''}${choice.financial.toLocaleString()}
                  </span>
                )}
                {choice.fitness !== 0 && (
                  <span className={`text-[10px] font-medium px-1.5 py-px rounded-md ${choice.fitness > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {choice.fitness > 0 ? '+' : ''}{choice.fitness} Fit
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Outcome Badge Component
// ============================================================

function OutcomeBadge({ outcome }: { outcome: EventOutcome }) {
  const cfg = {
    positive: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', label: 'Positive' },
    negative: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', label: 'Negative' },
    mixed: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', label: 'Mixed' },
  };
  const c = cfg[outcome];
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-px rounded-md border ${c.bg} ${c.color} ${c.border}`}>
      {c.label}
    </span>
  );
}

// ============================================================
// Event History Component
// ============================================================

function EventHistory({ events }: { events: ResolvedCareerEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-6 text-center">
        <svg className="h-8 w-8 text-[#30363d] mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <p className="text-xs text-[#484f58]">No resolved events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {events.map((ev, i) => {
        const config = categoryConfig[ev.category];
        return (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04, duration: 0.15 }}
            className="flex items-start gap-2 p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d]"
          >
            <div className={`w-6 h-6 rounded-md ${config.bg} flex items-center justify-center shrink-0`}
              style={{ color: config.iconColor }}
            >
              <span className="h-3 w-3">{config.svgIcon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#c9d1d9] truncate">{ev.title}</span>
                <OutcomeBadge outcome={ev.outcome} />
              </div>
              <div className="text-[10px] text-[#484f58] mt-0.5">
                Chose: {ev.choiceMade} &middot; {ev.timestamp}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {ev.reputation !== 0 && (
                  <span className={`text-[9px] ${ev.reputation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Rep {ev.reputation > 0 ? '+' : ''}{ev.reputation}
                  </span>
                )}
                {ev.morale !== 0 && (
                  <span className={`text-[9px] ${ev.morale > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Morale {ev.morale > 0 ? '+' : ''}{ev.morale}
                  </span>
                )}
                {ev.financial !== 0 && (
                  <span className={`text-[9px] ${ev.financial > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${ev.financial > 0 ? '+' : ''}{ev.financial.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// Stats Impact Card Component
// ============================================================

function ImpactStatsCard({ events }: { events: ResolvedCareerEvent[] }) {
  const totals = useMemo(() => {
    let reputation = 0;
    let morale = 0;
    let financial = 0;
    for (const ev of events) {
      reputation += ev.reputation;
      morale += ev.morale;
      financial += ev.financial;
    }
    const net = reputation + morale + (financial > 0 ? Math.min(financial / 1000, 10) : Math.max(financial / 1000, -10));
    return { reputation, morale, financial, net: Math.round(net) };
  }, [events]);

  const stats = [
    {
      label: 'Reputation',
      value: totals.reputation,
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h20" />
          <path d="M5 20V10l7-7 7 7v10" />
          <path d="M9 20v-6h6v6" />
        </svg>
      ),
    },
    {
      label: 'Morale',
      value: totals.morale,
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      ),
    },
    {
      label: 'Financial',
      value: totals.financial,
      isCurrency: true,
      icon: (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <span className="text-xs font-semibold text-[#c9d1d9]">Cumulative Impact</span>
      </div>

      <div className="space-y-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#8b949e]">
              {stat.icon}
              <span className="text-xs">{stat.label}</span>
            </div>
            <span className={`text-xs font-bold ${stat.value > 0 ? 'text-emerald-400' : stat.value < 0 ? 'text-red-400' : 'text-[#484f58]'}`}>
              {stat.isCurrency
                ? `${stat.value > 0 ? '+' : ''}$${stat.value.toLocaleString()}`
                : `${stat.value > 0 ? '+' : ''}${stat.value}`
              }
            </span>
          </div>
        ))}
      </div>

      <div className="h-px bg-[#30363d]" />

      {/* Net Career Impact */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#8b949e]">Net Career Impact</span>
        <span className={`text-sm font-bold ${
          totals.net > 5 ? 'text-emerald-400' : totals.net < -5 ? 'text-red-400' : 'text-amber-400'
        }`}>
          {totals.net > 0 ? '+' : ''}{totals.net}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Probability Engine Section
// ============================================================

function ProbabilityEngine({ seed }: { seed: number }) {
  const nextEventDays = 1 + (seed * 3 + 7) % 5;

  return (
    <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h20" />
          <path d="M5 20V10l7-7 7 7v10" />
          <path d="M9 20v-6h6v6" />
        </svg>
        <span className="text-xs font-semibold text-[#c9d1d9]">Event Probability</span>
      </div>

      <div className="flex items-center gap-4">
        <DonutChart data={categoryProbabilities} />
        <div className="space-y-1.5 flex-1">
          {categoryProbabilities.map((cat) => (
            <div key={cat.category} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-[11px] text-[#8b949e] flex-1">{cat.label}</span>
              <span className="text-[11px] font-semibold text-[#c9d1d9]">{cat.probability}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#30363d]" />

      <div className="flex items-center gap-2">
        <svg className="h-3.5 w-3.5 text-[#484f58]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-[11px] text-[#484f58]">Next event likely in:</span>
        <span className="text-[11px] font-bold text-amber-400 ml-auto">{nextEventDays} days</span>
      </div>
    </div>
  );
}

// ============================================================
// Category Legend Bar
// ============================================================

function CategoryLegend() {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {(Object.keys(categoryConfig) as CareerEventCategory[]).map((cat) => {
        const cfg = categoryConfig[cat];
        return (
          <div
            key={cat}
            className={`flex items-center gap-1 px-2 py-1 rounded-md ${cfg.bg} border ${cfg.border} shrink-0`}
          >
            <span className="h-3 w-3" style={{ color: cfg.iconColor }}>{cfg.svgIcon}</span>
            <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Tab Component
// ============================================================

type TabKey = 'active' | 'history' | 'probability' | 'impact';

function TabBar({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'active', label: 'Active Events' },
    { key: 'history', label: 'History' },
    { key: 'probability', label: 'Probability' },
    { key: 'impact', label: 'Impact' },
  ];

  return (
    <div className="flex gap-1 bg-[#0d1117] border border-[#30363d] p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 text-center py-1.5 px-2 rounded-md text-[11px] font-medium transition-colors ${
            active === tab.key
              ? 'bg-[#21262d] text-[#e6edf3]'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Main DynamicCareerEvents Component
// ============================================================

export default function DynamicCareerEvents() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [selectedEvent, setSelectedEvent] = useState<CareerEvent | null>(null);
  const [resolvedEvents, setResolvedEvents] = useState<ResolvedCareerEvent[]>([]);
  const [activeEvents, setActiveEvents] = useState<CareerEvent[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Generate deterministic events based on game state
  useEffect(() => {
    if (!gameState) return;
    const seed = (gameState.currentSeason * 17 + gameState.currentWeek * 31 + (gameState.player?.reputation ?? 0)) | 0;
    const events = generateEvents(seed, gameState.currentWeek, gameState.player?.reputation ?? 50);
    setActiveEvents(events);
  }, [gameState]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Determine outcome from stat changes
  const determineOutcome = useCallback((reputation: number, morale: number, financial: number): EventOutcome => {
    const positiveCount = [reputation, morale, financial].filter(v => v > 0).length;
    const negativeCount = [reputation, morale, financial].filter(v => v < 0).length;
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'mixed';
  }, []);

  // Handle event choice
  const handleChoice = useCallback((eventId: string, choiceId: string) => {
    const event = activeEvents.find(e => e.id === eventId);
    if (!event) return;
    const choice = event.choices.find(c => c.id === choiceId);
    if (!choice) return;

    const outcome = determineOutcome(choice.reputation, choice.morale, choice.financial);

    const resolved: ResolvedCareerEvent = {
      id: eventId,
      title: event.title,
      category: event.category,
      sentiment: event.sentiment,
      choiceMade: choice.label,
      reputation: choice.reputation,
      morale: choice.morale,
      financial: choice.financial,
      fitness: choice.fitness,
      outcome,
      timestamp: `S${gameState?.currentSeason ?? 1} W${gameState?.currentWeek ?? 1}`,
    };

    setResolvedEvents(prev => [resolved, ...prev]);
    setActiveEvents(prev => prev.filter(e => e.id !== eventId));
    setSelectedEvent(null);
  }, [activeEvents, gameState, determineOutcome]);

  // Active tab with events count
  const activeActionRequired = activeEvents.filter(e => e.actionRequired).length;

  if (!gameState) return null;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-xl font-bold flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </div>
          Career Events
        </h2>
        {activeActionRequired > 0 && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {activeActionRequired} action{activeActionRequired > 1 ? 's' : ''} required
          </span>
        )}
      </motion.div>

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.04 }}
      >
        <TabBar active={activeTab} onChange={setActiveTab} />
      </motion.div>

      {/* Category Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.06 }}
      >
        <CategoryLegend />
      </motion.div>

      {/* Active Events Tab */}
      {activeTab === 'active' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {activeEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-center"
              >
                <div className="w-14 h-14 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center mx-auto mb-3">
                  <svg className="h-7 w-7 text-[#30363d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#8b949e]">All events resolved</p>
                <p className="text-xs text-[#484f58] mt-1">Advance the week to trigger new career events.</p>
              </motion.div>
            ) : (
              <>
                {/* Active count */}
                <div className="flex items-center gap-2 text-[10px] text-[#484f58]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-sm h-2 w-2 bg-emerald-500" />
                  </span>
                  {activeEvents.length} active event{activeEvents.length > 1 ? 's' : ''}
                  {activeActionRequired > 0 && (
                    <span className="text-amber-400">&middot; {activeActionRequired} need{activeActionRequired > 1 ? '' : 's'} action</span>
                  )}
                </div>

                <AnimatePresence>
                  {activeEvents.map((event, i) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={i}
                      onSelect={setSelectedEvent}
                    />
                  ))}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <EventHistory events={resolvedEvents} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Probability Tab */}
      {activeTab === 'probability' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="probability"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ProbabilityEngine seed={gameState.currentWeek + gameState.currentSeason * 7} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Impact Tab */}
      {activeTab === 'impact' && (
        <AnimatePresence mode="wait">
          <motion.div
            key="impact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ImpactStatsCard events={resolvedEvents} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Event Decision Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDecisionModal
            event={selectedEvent}
            onChoose={handleChoice}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
