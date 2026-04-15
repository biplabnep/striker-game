'use client';

import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { EventType, GameEvent, EventEffects } from '@/lib/game/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Bell,
  ArrowRight,
  MessageSquare,
  DollarSign,
  Users,
  Shield,
  Handshake,
  Clock,
  AlertTriangle,
  Heart,
  Star,
  Dumbbell,
  TrendingUp,
  CheckCircle2,
  Filter,
  Inbox,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Minus,
  Calendar,
  Zap,
  Trophy,
  User,
  MessageCircle,
  Award,
  CalendarDays,
} from 'lucide-react';

// ============================================================
// Constants & Configs
// ============================================================

// Category system for enhanced filter tabs
type EventCategoryTab = 'all' | 'match' | 'transfer' | 'personal' | 'social' | 'club' | 'injury' | 'achievement';

const categoryTabConfig: Record<EventCategoryTab, {
  label: string;
  icon: React.ReactNode;
  color: string;
  hex: string;
}> = {
  all: { label: 'All', icon: <Filter className="h-3.5 w-3.5" />, color: 'text-[#8b949e]', hex: '#8b949e' },
  match: { label: 'Match', icon: <Trophy className="h-3.5 w-3.5" />, color: 'text-emerald-400', hex: '#34d399' },
  transfer: { label: 'Transfer', icon: <ArrowLeftRight className="h-3.5 w-3.5" />, color: 'text-amber-400', hex: '#fbbf24' },
  personal: { label: 'Personal', icon: <User className="h-3.5 w-3.5" />, color: 'text-sky-400', hex: '#38bdf8' },
  social: { label: 'Social', icon: <MessageCircle className="h-3.5 w-3.5" />, color: 'text-purple-400', hex: '#c084fc' },
  club: { label: 'Club', icon: <Shield className="h-3.5 w-3.5" />, color: 'text-cyan-400', hex: '#22d3ee' },
  injury: { label: 'Injury', icon: <Heart className="h-3.5 w-3.5" />, color: 'text-red-400', hex: '#f87171' },
  achievement: { label: 'Achievement', icon: <Award className="h-3.5 w-3.5" />, color: 'text-amber-400', hex: '#fbbf24' },
};

// Map existing EventType to new categories
function getEventCategoryTab(type: EventType): EventCategoryTab {
  switch (type) {
    case 'MEDIA_INTERVIEW': return 'match';
    case 'TRANSFER_RUMOR': return 'transfer';
    case 'PERSONAL_LIFE': return 'personal';
    case 'TEAM_CONFLICT': return 'club';
    case 'MENTORSHIP': return 'achievement';
    case 'SPONSORSHIP': return 'achievement';
    default: return 'all';
  }
}

// Category-specific icons for event cards
function getEventCategoryIcon(type: EventType): React.ReactNode {
  switch (type) {
    case 'MEDIA_INTERVIEW': return <Trophy className="h-4 w-4" />;
    case 'TRANSFER_RUMOR': return <ArrowLeftRight className="h-4 w-4" />;
    case 'PERSONAL_LIFE': return <User className="h-4 w-4" />;
    case 'TEAM_CONFLICT': return <Shield className="h-4 w-4" />;
    case 'MENTORSHIP': return <Award className="h-4 w-4" />;
    case 'SPONSORSHIP': return <Award className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
}

// Category hex colors for timeline nodes
function getEventCategoryHex(type: EventType): string {
  switch (type) {
    case 'MEDIA_INTERVIEW': return '#34d399'; // emerald
    case 'TRANSFER_RUMOR': return '#fbbf24'; // amber
    case 'PERSONAL_LIFE': return '#38bdf8'; // sky
    case 'TEAM_CONFLICT': return '#22d3ee'; // cyan
    case 'MENTORSHIP': return '#fbbf24'; // amber (achievement)
    case 'SPONSORSHIP': return '#fbbf24'; // amber (achievement)
    default: return '#8b949e';
  }
}

function getEventCategoryBg(type: EventType): string {
  switch (type) {
    case 'MEDIA_INTERVIEW': return 'bg-emerald-500/15';
    case 'TRANSFER_RUMOR': return 'bg-amber-500/15';
    case 'PERSONAL_LIFE': return 'bg-sky-500/15';
    case 'TEAM_CONFLICT': return 'bg-cyan-500/15';
    case 'MENTORSHIP': return 'bg-amber-500/15';
    case 'SPONSORSHIP': return 'bg-amber-500/15';
    default: return 'bg-[#21262d]';
  }
}

function getEventCategoryColor(type: EventType): string {
  switch (type) {
    case 'MEDIA_INTERVIEW': return 'text-emerald-400';
    case 'TRANSFER_RUMOR': return 'text-amber-400';
    case 'PERSONAL_LIFE': return 'text-sky-400';
    case 'TEAM_CONFLICT': return 'text-cyan-400';
    case 'MENTORSHIP': return 'text-amber-400';
    case 'SPONSORSHIP': return 'text-amber-400';
    default: return 'text-[#8b949e]';
  }
}

const eventLabels: Record<EventType, string> = {
  TRANSFER_RUMOR: 'Transfer',
  MEDIA_INTERVIEW: 'Match',
  PERSONAL_LIFE: 'Personal',
  TEAM_CONFLICT: 'Club',
  MENTORSHIP: 'Achievement',
  SPONSORSHIP: 'Achievement',
};

// ============================================================
// Impact & Expiry Helpers
// ============================================================

type EventImpact = 'positive' | 'negative' | 'neutral';

function getEventOverallImpact(event: GameEvent): EventImpact {
  let bestPositive = 0;
  let worstNegative = 0;
  for (const choice of event.choices) {
    const e = choice.effects;
    const vals = [e.morale ?? 0, e.fitness ?? 0, e.form ?? 0, e.reputation ?? 0, e.marketValue ?? 0];
    const pos = vals.filter(v => v > 0).reduce((s, v) => s + v, 0);
    const neg = vals.filter(v => v < 0).reduce((s, v) => s + v, 0);
    if (pos > bestPositive) bestPositive = pos;
    if (neg < worstNegative) worstNegative = neg;
  }
  if (bestPositive > Math.abs(worstNegative)) return 'positive';
  if (worstNegative < -bestPositive) return 'negative';
  if (bestPositive === 0 && worstNegative === 0) return 'neutral';
  return 'neutral';
}

function formatExpiry(event: GameEvent, currentWeek: number): string | null {
  if (!event.expires) return null;
  const elapsed = currentWeek - event.week;
  const remaining = Math.max(0, 3 - elapsed);
  if (remaining <= 0) return 'Expiring soon';
  if (remaining === 1) return 'Expires in 1 week';
  return `Expires in ${remaining} weeks`;
}

function formatRelativeTime(event: GameEvent, currentWeek: number): string {
  const diff = currentWeek - event.week;
  if (diff === 0) return 'This week';
  if (diff === 1) return '1w ago';
  return `${diff}w ago`;
}

// ============================================================
// Helper Functions
// ============================================================

function getEventImportance(event: GameEvent): 'high' | 'medium' | 'low' {
  let maxImpact = 0;
  for (const choice of event.choices) {
    const effects = choice.effects;
    const values = [
      effects.morale ?? 0,
      effects.fitness ?? 0,
      effects.form ?? 0,
      effects.reputation ?? 0,
    ];
    const maxChoice = Math.max(...values.map(Math.abs));
    if (maxChoice > maxImpact) maxImpact = maxChoice;
  }
  if (maxImpact >= 10) return 'high';
  if (maxImpact >= 5) return 'medium';
  return 'low';
}

const importanceOrder = { high: 0, medium: 1, low: 2 };

const importanceConfig = {
  high: {
    label: 'Urgent',
    color: 'text-red-400',
    bg: 'bg-red-500/15 border-red-500/30',
    dot: 'bg-red-500',
    bar: 'bg-red-500',
    borderLeft: 'border-l-red-500',
    cardScale: 'p-4',
    opacity: 1,
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    borderLeft: 'border-l-amber-500',
    cardScale: 'p-3',
    opacity: 0.85,
  },
  low: {
    label: 'Low',
    color: 'text-[#8b949e]',
    bg: 'bg-slate-500/15 border-slate-500/30',
    dot: 'bg-slate-500',
    bar: 'bg-slate-600',
    borderLeft: 'border-l-[#30363d]',
    cardScale: 'p-3',
    opacity: 0.65,
  },
};

interface ConsequenceItem {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function getConsequences(effects: EventEffects): ConsequenceItem[] {
  const items: ConsequenceItem[] = [];
  if (effects.morale !== undefined && effects.morale !== 0) {
    items.push({
      icon: <Heart className="h-3.5 w-3.5" />,
      label: 'Morale',
      value: effects.morale,
    });
  }
  if (effects.form !== undefined && effects.form !== 0) {
    items.push({
      icon: <Star className="h-3.5 w-3.5" />,
      label: 'Form',
      value: effects.form,
    });
  }
  if (effects.fitness !== undefined && effects.fitness !== 0) {
    items.push({
      icon: <Dumbbell className="h-3.5 w-3.5" />,
      label: 'Fitness',
      value: effects.fitness,
    });
  }
  if (effects.reputation !== undefined && effects.reputation !== 0) {
    items.push({
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      label: 'Reputation',
      value: effects.reputation,
    });
  }
  return items;
}

// ============================================================
// Impact Indicator Component
// ============================================================

function ImpactIndicator({ impact }: { impact: EventImpact }) {
  if (impact === 'positive') {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400">
        <ArrowUp className="h-3 w-3" />
        <span className="text-[10px] font-semibold">Positive</span>
      </span>
    );
  }
  if (impact === 'negative') {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-400">
        <ArrowDown className="h-3 w-3" />
        <span className="text-[10px] font-semibold">Risky</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[#8b949e]">
      <Minus className="h-3 w-3" />
      <span className="text-[10px] font-semibold">Neutral</span>
    </span>
  );
}

// ============================================================
// Consequence Tooltip Component
// ============================================================

function ConsequencePreview({ effects }: { effects: EventEffects }) {
  const consequences = getConsequences(effects);

  if (consequences.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-[#8b949e] mb-1">
        Consequences
      </div>
      {consequences.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={c.value > 0 ? 'text-emerald-400' : 'text-red-400'}>
            {c.icon}
          </span>
          <span className="text-xs text-[#c9d1d9]">{c.label}</span>
          <span
            className={`text-xs font-bold ml-auto ${
              c.value > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {c.value > 0 ? '+' : ''}
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Timeline Event Card Component
// ============================================================

function TimelineEventCard({
  event,
  eventIndex,
  currentWeek,
  onResolve,
  isLast,
}: {
  event: GameEvent;
  eventIndex: number;
  currentWeek: number;
  onResolve: (eventId: string, choiceId: string) => void;
  isLast: boolean;
}) {
  const importance = getEventImportance(event);
  const impConfig = importanceConfig[importance];
  const catHex = getEventCategoryHex(event.type);
  const catBg = getEventCategoryBg(event.type);
  const catColor = getEventCategoryColor(event.type);
  const catIcon = getEventCategoryIcon(event.type);
  const impact = getEventOverallImpact(event);
  const expiry = formatExpiry(event, currentWeek);
  const relativeTime = formatRelativeTime(event, currentWeek);

  return (
    <motion.div
      key={event.id}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: impConfig.opacity }}
      exit={{ opacity: 0 }}
      transition={{
        delay: eventIndex * 0.06,
        duration: 0.2,
        layout: { duration: 0.2 },
      }}
      className="flex gap-3"
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center shrink-0 w-8">
        {/* Circular node colored by category */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: eventIndex * 0.06 + 0.1 }}
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 z-10"
          style={{ backgroundColor: `${catHex}20` }}
        >
          <span style={{ color: catHex }}>
            {catIcon}
          </span>
        </motion.div>
        {/* Vertical line */}
        {!isLast && (
          <div className="w-px flex-1 bg-[#21262d] min-h-[12px]" />
        )}
      </div>

      {/* Relative time label + event card */}
      <div className="flex-1 min-w-0 pb-4">
        {/* Relative time */}
        <span className="text-[10px] text-[#484f58] block mb-1.5">{relativeTime}</span>

        {/* Event card with importance left border */}
        <div className={`rounded-lg border border-[#30363d] bg-[#161b22] border-l-[3px] ${impConfig.borderLeft} overflow-hidden hover:border-[#444c56] transition-colors`}>
          <div className={impConfig.cardScale}>
            {/* Header Row */}
            <div className="flex items-start gap-3 mb-3">
              {/* Category icon */}
              <div
                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${catHex}15`, color: catHex }}
              >
                {catIcon}
              </div>
              <div className="flex-1 min-w-0">
                {/* Badges row */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 border capitalize shrink-0"
                    style={{ color: catHex, borderColor: `${catHex}40`, backgroundColor: `${catHex}10` }}
                  >
                    {eventLabels[event.type]}
                  </Badge>
                  {/* Importance Badge */}
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 border shrink-0 ${impConfig.bg} ${impConfig.color}`}
                  >
                    {importance === 'high' && (
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    )}
                    {impConfig.label}
                  </Badge>
                  {/* Impact indicator */}
                  <ImpactIndicator impact={impact} />
                  {/* Pulsing dot for active events */}
                  <span className="relative flex h-2 w-2 shrink-0 ml-auto">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-sm h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                {/* Title */}
                <h3 className="font-bold text-sm text-[#e6edf3] leading-snug">
                  {event.title}
                </h3>
                {/* Meta row: expiry */}
                {expiry && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-amber-500/70" />
                    <span className="text-[10px] text-amber-500/80 font-medium">
                      {expiry}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section divider */}
            <div className="h-px bg-[#30363d] mb-3" />

            {/* Description */}
            <p className="text-sm text-[#8b949e] mb-4 leading-relaxed">
              {event.description}
            </p>

            {/* Choices */}
            <div className="space-y-2">
              {event.choices.map((choice, choiceIndex) => {
                const consequences = getConsequences(choice.effects as EventEffects);

                return (
                  <Tooltip key={choice.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        onClick={() => onResolve(event.id, choice.id)}
                        className="w-full text-left p-3 rounded-lg bg-[#0d1117] border border-[#30363d] hover:bg-[#21262d] hover:border-[#444c56] transition-colors group relative overflow-hidden"
                        whileHover={{ opacity: 0.85 }}
                      >
                        {/* Category accent glow on hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: `${catHex}08` }}
                        />

                        <div className="relative flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#c9d1d9] group-hover:text-[#e6edf3] transition-colors">
                            {choice.label}
                          </span>
                          <ArrowRight className="h-4 w-4 text-[#484f58] group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <p className="text-xs text-[#8b949e] mt-1 relative transition-colors">
                          {choice.description}
                        </p>

                        {/* Inline mini effects badges */}
                        {consequences.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2.5 relative">
                            {consequences.map((c, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                                  c.value > 0
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {c.icon}
                                {c.value > 0 ? '+' : ''}
                                {c.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      align="center"
                      className="bg-[#21262d] border border-[#30363d] text-[#c9d1d9] px-3 py-2.5 rounded-lg shadow-sm max-w-[200px]"
                      sideOffset={8}
                    >
                      <ConsequencePreview effects={choice.effects as EventEffects} />
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Resolved Event Card Component (timeline style)
// ============================================================

function ResolvedTimelineCard({
  event,
  index,
  currentWeek,
  isLast,
}: {
  event: GameEvent;
  index: number;
  currentWeek: number;
  isLast: boolean;
}) {
  const catHex = getEventCategoryHex(event.type);
  const catIcon = getEventCategoryIcon(event.type);
  const relativeTime = formatRelativeTime(event, currentWeek);

  return (
    <motion.div
      key={event.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="flex gap-3"
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center shrink-0 w-8">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 z-10 bg-[#161b22] border border-[#30363d]"
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-[#21262d] min-h-[8px]" />
        )}
      </div>

      {/* Event card */}
      <div className="flex-1 min-w-0 pb-3">
        <span className="text-[10px] text-[#484f58] block mb-1">{relativeTime}</span>
        <div className="p-2.5 rounded-lg border border-[#30363d] bg-[#161b22]/60">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${catHex}15`, color: catHex }}
            >
              <span className="h-3 w-3">{catIcon}</span>
            </div>
            <span className="text-xs font-semibold text-[#8b949e] truncate flex-1">
              {event.title}
            </span>
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 border-[#30363d]/50 text-[#484f58] shrink-0"
              style={{ color: catHex, borderColor: `${catHex}30` }}
            >
              {eventLabels[event.type]}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Empty State Component
// ============================================================

function FilterEmptyState({ categoryName }: { categoryName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-10 px-6 text-center"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
          <Filter className="h-6 w-6 text-[#30363d]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#8b949e]">
            No events in this category
          </p>
          <p className="text-xs text-[#484f58] mt-1">
            No {categoryName.toLowerCase()} events found. Try a different filter.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main EventsPanel Component
// ============================================================

export default function EventsPanel() {
  const gameState = useGameStore(state => state.gameState);
  const resolveEvent = useGameStore(state => state.resolveEvent);
  const [activeCategoryTab, setActiveCategoryTab] = useState<EventCategoryTab>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  // Priority-sorted active events
  const sortedActiveEvents = useMemo(() => {
    if (!gameState) return [];
    return [...gameState.activeEvents].sort((a, b) => {
      const impA = importanceOrder[getEventImportance(a)];
      const impB = importanceOrder[getEventImportance(b)];
      if (impA !== impB) return impA - impB;
      return 0;
    });
  }, [gameState]);

  // Count events per category
  const categoryCounts = useMemo(() => {
    if (!gameState) return {} as Record<EventCategoryTab, number>;
    const counts: Record<string, number> = { all: gameState.activeEvents.length };
    for (const event of gameState.activeEvents) {
      const cat = getEventCategoryTab(event.type);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts as Record<EventCategoryTab, number>;
  }, [gameState]);

  // Filter active events by category tab
  const filteredActiveEvents = useMemo(() => {
    if (activeCategoryTab === 'all') return sortedActiveEvents;
    return sortedActiveEvents.filter(e => getEventCategoryTab(e.type) === activeCategoryTab);
  }, [sortedActiveEvents, activeCategoryTab]);

  // Filter resolved events by category tab
  const filteredResolvedEvents = useMemo(() => {
    if (!gameState) return [];
    if (activeCategoryTab === 'all') return gameState.resolvedEvents;
    return gameState.resolvedEvents.filter(e => getEventCategoryTab(e.type) === activeCategoryTab);
  }, [gameState, activeCategoryTab]);

  const handleResolve = useCallback((eventId: string, choiceId: string) => {
    resolveEvent(eventId, choiceId);
  }, [resolveEvent]);

  // Category tab items (only show tabs with events)
  const visibleTabs = useMemo(() => {
    return (Object.keys(categoryTabConfig) as EventCategoryTab[]).filter(
      tab => tab === 'all' || (categoryCounts[tab] ?? 0) > 0
    );
  }, [categoryCounts]);

  if (!gameState) return null;

  const { activeEvents, resolvedEvents, currentWeek } = gameState;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-xl font-bold flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Bell className="h-4 w-4 text-amber-400" />
            </div>
            Events
          </h2>
        </motion.div>

        {/* Active / Resolved Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.04 }}
          className="flex gap-1.5 bg-[#0d1117] border border-[#30363d] p-1 rounded-lg"
        >
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-[#21262d] text-[#e6edf3]'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {activeEvents.length > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-sm bg-emerald-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-sm h-2 w-2 bg-emerald-500" />
            </span>
            Active
            <span className="text-[10px] text-[#8b949e]">({activeEvents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'resolved'
                ? 'bg-[#21262d] text-[#e6edf3]'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Resolved
            <span className="text-[10px] text-[#8b949e]">({resolvedEvents.length})</span>
          </button>
        </motion.div>

        {/* ===== ACTIVE TAB ===== */}
        {activeTab === 'active' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="active-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Category Filter Tabs (pill-style) */}
              {activeEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.06 }}
                  className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
                >
                  {visibleTabs.map(tab => {
                    const config = categoryTabConfig[tab];
                    const count = categoryCounts[tab] ?? 0;
                    const isActive = activeCategoryTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveCategoryTab(tab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border shrink-0 ${
                          isActive
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#0d1117] border-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#30363d]'
                        }`}
                      >
                        {config.icon}
                        <span>{config.label}</span>
                        <span className={`text-[9px] ${isActive ? 'text-emerald-400/70' : 'text-[#484f58]'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {/* Empty State: No active events at all */}
              {activeEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
                    <CardContent className="py-10 px-6 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
                            <Inbox className="h-10 w-10 text-[#30363d]" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
                            <Sparkles className="h-2.5 w-2.5 text-[#484f58]" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-[#c9d1d9]">
                            No pending events
                          </p>
                          <p className="text-xs text-[#8b949e] leading-relaxed max-w-[240px] mx-auto">
                            Your inbox is clear. Advance the week to trigger new events and storylines.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#484f58]">
                          <Calendar className="h-3 w-3" />
                          <span>Advance the week to continue</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : filteredActiveEvents.length === 0 ? (
                /* Empty State: No events matching filter */
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardContent className="py-6 px-6">
                    <FilterEmptyState categoryName={categoryTabConfig[activeCategoryTab].label} />
                  </CardContent>
                </Card>
              ) : (
                /* Timeline Events */
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  {/* Urgency section divider */}
                  {filteredActiveEvents.some(e => getEventImportance(e) === 'high') && (
                    <div className="flex items-center gap-2 pt-1 pb-2 px-8">
                      <Zap className="h-3 w-3 text-red-400" />
                      <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                        Urgent
                      </span>
                      <div className="flex-1 h-px bg-red-500/20" />
                    </div>
                  )}

                  <AnimatePresence mode="popLayout">
                    {filteredActiveEvents.map((event, eventIndex) => (
                      <TimelineEventCard
                        key={event.id}
                        event={event}
                        eventIndex={eventIndex}
                        currentWeek={currentWeek}
                        onResolve={handleResolve}
                        isLast={eventIndex === filteredActiveEvents.length - 1}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ===== RESOLVED TAB ===== */}
        {activeTab === 'resolved' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="resolved-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Category Filter for resolved too */}
              {resolvedEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.06 }}
                  className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
                >
                  {visibleTabs.map(tab => {
                    const config = categoryTabConfig[tab];
                    const isActive = activeCategoryTab === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveCategoryTab(tab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border shrink-0 ${
                          isActive
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#0d1117] border-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#30363d]'
                        }`}
                      >
                        {config.icon}
                        <span>{config.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {resolvedEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
                    <CardContent className="py-10 px-6 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
                          <Clock className="h-10 w-10 text-[#30363d]" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-sm font-semibold text-[#c9d1d9]">
                            No resolved events yet
                          </p>
                          <p className="text-xs text-[#8b949e] leading-relaxed max-w-[240px] mx-auto">
                            Your decisions and their outcomes will appear here as you resolve events.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : filteredResolvedEvents.length === 0 ? (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardContent className="py-6 px-6">
                    <FilterEmptyState categoryName={categoryTabConfig[activeCategoryTab].label} />
                  </CardContent>
                </Card>
              ) : (
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-8 py-2">
                    <Clock className="h-3 w-3 text-[#8b949e]" />
                    <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">
                      Decision History
                    </span>
                    <div className="flex-1 h-px bg-[#30363d]" />
                    <span className="text-[10px] text-[#484f58]">
                      {filteredResolvedEvents.length} total
                    </span>
                  </div>

                  {filteredResolvedEvents.slice(0, 20).map((event, index) => (
                    <ResolvedTimelineCard
                      key={event.id}
                      event={event}
                      index={index}
                      currentWeek={currentWeek}
                      isLast={index === Math.min(filteredResolvedEvents.length, 20) - 1}
                    />
                  ))}

                  {filteredResolvedEvents.length > 20 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-[10px] text-[#484f58] pt-2"
                    >
                      Showing 20 of {filteredResolvedEvents.length} resolved events
                    </motion.p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </TooltipProvider>
  );
}
