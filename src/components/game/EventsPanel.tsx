'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { EventType, GameEvent, EventEffects } from '@/lib/game/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Minus,
  Calendar,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Constants & Configs
// ============================================================

const eventIcons: Record<EventType, React.ReactNode> = {
  TRANSFER_RUMOR: <DollarSign className="h-5 w-5" />,
  MEDIA_INTERVIEW: <MessageSquare className="h-5 w-5" />,
  PERSONAL_LIFE: <Users className="h-5 w-5" />,
  TEAM_CONFLICT: <Shield className="h-5 w-5" />,
  MENTORSHIP: <Handshake className="h-5 w-5" />,
  SPONSORSHIP: <DollarSign className="h-5 w-5" />,
};

// ============================================================
// Category System — visual distinction by event domain
// ============================================================

type EventCategory = 'career' | 'personal' | 'transfer' | 'training' | 'match';

const categoryConfig: Record<EventType, {
  category: EventCategory;
  accent: string;
  accentBg: string;
  accentBorder: string;
  hex: string;
}> = {
  MENTORSHIP:      { category: 'career',   accent: 'text-emerald-400', accentBg: 'bg-emerald-500/15', accentBorder: 'border-emerald-500/30', hex: '#10b981' },
  SPONSORSHIP:     { category: 'career',   accent: 'text-emerald-400', accentBg: 'bg-emerald-500/15', accentBorder: 'border-emerald-500/30', hex: '#10b981' },
  TEAM_CONFLICT:   { category: 'career',   accent: 'text-emerald-400', accentBg: 'bg-emerald-500/15', accentBorder: 'border-emerald-500/30', hex: '#10b981' },
  PERSONAL_LIFE:   { category: 'personal', accent: 'text-violet-400',  accentBg: 'bg-violet-500/15',  accentBorder: 'border-violet-500/30',  hex: '#8b5cf6' },
  TRANSFER_RUMOR:  { category: 'transfer', accent: 'text-amber-400',   accentBg: 'bg-amber-500/15',   accentBorder: 'border-amber-500/30',   hex: '#f59e0b' },
  MEDIA_INTERVIEW: { category: 'match',    accent: 'text-rose-400',    accentBg: 'bg-rose-500/15',    accentBorder: 'border-rose-500/30',    hex: '#f43f5e' },
};

const categoryLabels: Record<EventCategory, string> = {
  career: 'Career',
  personal: 'Personal',
  transfer: 'Transfer',
  training: 'Training',
  match: 'Match',
};

const eventColors: Record<EventType, string> = {
  TRANSFER_RUMOR: '#f59e0b',
  MEDIA_INTERVIEW: '#f43f5e',
  PERSONAL_LIFE: '#8b5cf6',
  TEAM_CONFLICT: '#10b981',
  MENTORSHIP: '#10b981',
  SPONSORSHIP: '#10b981',
};

const eventLabels: Record<EventType, string> = {
  TRANSFER_RUMOR: 'Transfer',
  MEDIA_INTERVIEW: 'Media',
  PERSONAL_LIFE: 'Personal',
  TEAM_CONFLICT: 'Team',
  MENTORSHIP: 'Mentorship',
  SPONSORSHIP: 'Sponsor',
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

type EventFilter = 'ALL' | EventType;

const filterOptions: { value: EventFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'ALL', label: 'All', icon: <Filter className="h-3.5 w-3.5" /> },
  { value: 'TRANSFER_RUMOR', label: 'Transfer', icon: <DollarSign className="h-3.5 w-3.5" /> },
  { value: 'MEDIA_INTERVIEW', label: 'Media', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { value: 'PERSONAL_LIFE', label: 'Personal', icon: <Users className="h-3.5 w-3.5" /> },
  { value: 'TEAM_CONFLICT', label: 'Team', icon: <Shield className="h-3.5 w-3.5" /> },
  { value: 'SPONSORSHIP', label: 'Sponsor', icon: <DollarSign className="h-3.5 w-3.5" /> },
];

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
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    color: 'text-[#8b949e]',
    bg: 'bg-slate-500/15 border-slate-500/30',
    dot: 'bg-slate-500',
    bar: 'bg-slate-600',
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
// Resolved Event Card Component
// ============================================================

function ResolvedEventCard({
  event,
  index,
}: {
  event: GameEvent;
  index: number;
}) {
  const cat = categoryConfig[event.type];
  const impact = getEventOverallImpact(event);

  return (
    <motion.div
      key={event.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="flex gap-3 p-3 rounded-lg border border-[#30363d] bg-[#161b22]/60"
    >
      {/* Category icon */}
      <div
        className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
        style={{
          backgroundColor: `${cat.hex}20`,
          color: cat.hex,
        }}
      >
        {(() => {
          const Icon = event.type === 'TRANSFER_RUMOR' || event.type === 'SPONSORSHIP'
            ? DollarSign
            : event.type === 'MEDIA_INTERVIEW'
            ? MessageSquare
            : event.type === 'PERSONAL_LIFE'
            ? Users
            : event.type === 'TEAM_CONFLICT'
            ? Shield
            : Handshake;
          return <Icon className="h-3.5 w-3.5" />;
        })()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold text-[#8b949e] truncate flex-1">
            {event.title}
          </span>
          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[9px] px-1 py-0 border-[#30363d]/50 text-[#484f58] shrink-0"
            style={{ color: cat.hex, borderColor: `${cat.hex}30` }}
          >
            {eventLabels[event.type]}
          </Badge>
          <span className="text-[10px] text-[#484f58]">
            S{event.season} W{event.week}
          </span>
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
  const [activeFilter, setActiveFilter] = useState<EventFilter>('ALL');
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

  const filteredEvents = useMemo(() => {
    if (!gameState) return [];
    if (activeFilter === 'ALL') return sortedActiveEvents;
    return sortedActiveEvents.filter(e => e.type === activeFilter);
  }, [gameState, activeFilter, sortedActiveEvents]);

  const filterCounts = useMemo(() => {
    if (!gameState) return {} as Record<EventFilter, number>;
    const counts: Record<string, number> = { ALL: gameState.activeEvents.length };
    for (const event of gameState.activeEvents) {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
    }
    return counts as Record<EventFilter, number>;
  }, [gameState]);

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
        >
          <Tabs
            value={activeTab}
            onValueChange={v => setActiveTab(v as 'active' | 'resolved')}
          >
            <TabsList className="bg-[#0d1117] h-9 p-0.5 w-full border border-[#30363d]">
              <TabsTrigger
                value="active"
                className="h-7.5 text-xs px-4 gap-1.5 data-[state=active]:bg-[#21262d] data-[state=active]:text-[#e6edf3] data-[state=active]:shadow-none font-medium"
              >
                <span className="relative flex h-2 w-2">
                  {activeEvents.length > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Active
                <span className="text-[10px] text-[#8b949e]">
                  ({activeEvents.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="resolved"
                className="h-7.5 text-xs px-4 gap-1.5 data-[state=active]:bg-[#21262d] data-[state=active]:text-[#e6edf3] data-[state=active]:shadow-none font-medium text-[#8b949e]"
              >
                <CheckCircle2 className="h-3 w-3" />
                Resolved
                <span className="text-[10px] text-[#8b949e]">
                  ({resolvedEvents.length})
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
              {/* Category Filter (only when events exist) */}
              {activeEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.06 }}
                  className="mb-3"
                >
                  <Tabs
                    value={activeFilter}
                    onValueChange={v => setActiveFilter(v as EventFilter)}
                  >
                    <TabsList className="bg-[#0d1117] h-7 p-0.5 w-full overflow-x-auto border border-[#21262d]">
                      {filterOptions.map(f => {
                        const count = filterCounts[f.value] ?? 0;
                        if (f.value !== 'ALL' && count === 0) return null;
                        return (
                          <TabsTrigger
                            key={f.value}
                            value={f.value}
                            className="h-6 text-[10px] px-2 gap-1 data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400 data-[state=active]:shadow-none"
                          >
                            {f.icon}
                            <span className="hidden sm:inline">{f.label}</span>
                            {count > 0 && (
                              <span className="text-[9px] opacity-60">{count}</span>
                            )}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </Tabs>
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
                        {/* Illustration area */}
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
              ) : filteredEvents.length === 0 ? (
                /* Empty State: No events matching filter */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card className="bg-[#161b22] border-[#30363d]">
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center">
                          <Filter className="h-5 w-5 text-[#484f58]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#8b949e]">
                            No events matching this filter
                          </p>
                          <p className="text-xs text-[#484f58] mt-1">
                            Try selecting a different category
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                /* Event Cards */
                <div className="space-y-3">
                  {/* Section divider for urgency */}
                  {filteredEvents.some(e => getEventImportance(e) === 'high') && (
                    <div className="flex items-center gap-2 pt-1 pb-1">
                      <Zap className="h-3 w-3 text-red-400" />
                      <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                        Urgent
                      </span>
                      <div className="flex-1 h-px bg-red-500/20" />
                    </div>
                  )}

                  <AnimatePresence mode="popLayout">
                    {filteredEvents.map((event, eventIndex) => {
                      const importance = getEventImportance(event);
                      const impConfig = importanceConfig[importance];
                      const color = eventColors[event.type];
                      const cat = categoryConfig[event.type];
                      const impact = getEventOverallImpact(event);
                      const expiry = formatExpiry(event, currentWeek);

                      return (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            delay: eventIndex * 0.05,
                            duration: 0.2,
                            layout: { duration: 0.2 },
                          }}
                        >
                          <Card className="bg-[#161b22] border border-[#30363d] overflow-hidden hover:border-[#444c56] transition-colors">
                            {/* Priority indicator bar + main content */}
                            <div className="flex">
                              {/* Priority bar */}
                              <div
                                className="w-1 shrink-0"
                                style={{ backgroundColor: impConfig.bar }}
                              />
                              <div className="flex-1 min-w-0">
                                <CardContent className="p-4">
                                  {/* Header Row */}
                                  <div className="flex items-start gap-3 mb-3">
                                    {/* Category icon with colored background */}
                                    <div
                                      className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                                      style={{
                                        backgroundColor: `${cat.hex}15`,
                                        color: cat.hex,
                                      }}
                                    >
                                      {eventIcons[event.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {/* Badges row */}
                                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] px-1.5 py-0 border capitalize shrink-0"
                                          style={{ color: cat.hex, borderColor: `${cat.hex}40`, backgroundColor: `${cat.hex}10` }}
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
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
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
                                              onClick={() => resolveEvent(event.id, choice.id)}
                                              className="w-full text-left p-3 rounded-lg bg-[#0d1117] border border-[#30363d] hover:bg-[#21262d] hover:border-[#444c56] transition-colors group relative overflow-hidden"
                                              whileHover={{ opacity: 0.85 }}
                                            >
                                              {/* Category accent glow on hover */}
                                              <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ backgroundColor: `${cat.hex}08` }}
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
                                </CardContent>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
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
              ) : (
                <div className="space-y-2">
                  {/* Section header */}
                  <div className="flex items-center gap-2 px-1 py-2">
                    <Clock className="h-3 w-3 text-[#8b949e]" />
                    <span className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider">
                      Decision History
                    </span>
                    <div className="flex-1 h-px bg-[#30363d]" />
                    <span className="text-[10px] text-[#484f58]">
                      {resolvedEvents.length} total
                    </span>
                  </div>

                  {resolvedEvents.slice(0, 15).map((event, index) => (
                    <ResolvedEventCard
                      key={event.id}
                      event={event}
                      index={index}
                    />
                  ))}

                  {resolvedEvents.length > 15 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-[10px] text-[#484f58] pt-2"
                    >
                      Showing 15 of {resolvedEvents.length} resolved events
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
