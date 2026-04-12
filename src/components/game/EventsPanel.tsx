'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { EventType, GameEvent, EventEffects } from '@/lib/game/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

const eventColors: Record<EventType, string> = {
  TRANSFER_RUMOR: '#10b981',
  MEDIA_INTERVIEW: '#3b82f6',
  PERSONAL_LIFE: '#f59e0b',
  TEAM_CONFLICT: '#ef4444',
  MENTORSHIP: '#8b5cf6',
  SPONSORSHIP: '#06b6d4',
};

const eventLabels: Record<EventType, string> = {
  TRANSFER_RUMOR: 'Transfer',
  MEDIA_INTERVIEW: 'Media',
  PERSONAL_LIFE: 'Personal',
  TEAM_CONFLICT: 'Team',
  MENTORSHIP: 'Mentorship',
  SPONSORSHIP: 'Sponsor',
};

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

const importanceConfig = {
  high: {
    label: 'High',
    color: 'text-red-400',
    bg: 'bg-red-500/15 border-red-500/30',
    dot: 'bg-red-500',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    color: 'text-[#8b949e]',
    bg: 'bg-slate-500/15 border-slate-500/30',
    dot: 'bg-slate-500',
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
// Consequence Tooltip Component
// ============================================================

function ConsequencePreview({ effects }: { effects: EventEffects }) {
  const consequences = getConsequences(effects);

  if (consequences.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold  text-[#8b949e] mb-1">
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
// Event Timeline Component (Resolved Events)
// ============================================================

function EventTimeline({
  resolvedEvents,
}: {
  resolvedEvents: GameEvent[];
}) {
  if (resolvedEvents.length === 0) return null;

  const displayed = resolvedEvents.slice(0, 10);

  return (
    <Card className="bg-[#161b22]  border-[#30363d] overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs text-[#8b949e]  flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          Decision History
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="relative ml-3">
          {/* Vertical line */}
          <div className="absolute left-0 top-1 bottom-1 w-px bg-[#30363d]" />

          <div className="space-y-0">
            {displayed.map((event, index) => {
              const color = eventColors[event.type];
              const isLast = index === displayed.length - 1;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.06, duration: 0.2 }}
                  className={`relative pl-6 ${isLast ? '' : 'pb-4'}`}
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute left-0 top-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-slate-900"
                    style={{ backgroundColor: color }}
                  />

                  {/* Event card */}
                  <div className="bg-[#21262d] rounded-lg p-3 border border-[#30363d]">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="p-1 rounded"
                        style={{
                          backgroundColor: `${color}15`,
                          color: color,
                        }}
                      >
                        {eventIcons[event.type] &&
                          (() => {
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
                      <span className="text-xs font-semibold text-[#c9d1d9] truncate flex-1">
                        {event.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] border-[#30363d]/60 text-[#8b949e] shrink-0"
                        style={{ color: color, borderColor: `${color}40` }}
                      >
                        {eventLabels[event.type]}
                      </Badge>
                    </div>

                    {/* Show chosen choice */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span className="text-[11px] text-[#8b949e] truncate">
                        Decision made
                      </span>
                    </div>

                    {/* Week/Season label */}
                    <div className="text-[10px] text-[#484f58] mt-1">
                      S{event.season} W{event.week}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main EventsPanel Component
// ============================================================

export default function EventsPanel() {
  const gameState = useGameStore(state => state.gameState);
  const resolveEvent = useGameStore(state => state.resolveEvent);
  const [activeFilter, setActiveFilter] = useState<EventFilter>('ALL');

  const filteredEvents = useMemo(() => {
    if (!gameState) return [];
    if (activeFilter === 'ALL') return gameState.activeEvents;
    return gameState.activeEvents.filter(e => e.type === activeFilter);
  }, [gameState, activeFilter]);

  const filterCounts = useMemo(() => {
    if (!gameState) return {} as Record<EventFilter, number>;
    const counts: Record<string, number> = { ALL: gameState.activeEvents.length };
    for (const event of gameState.activeEvents) {
      counts[event.type] = (counts[event.type] ?? 0) + 1;
    }
    return counts as Record<EventFilter, number>;
  }, [gameState]);

  if (!gameState) return null;

  const { activeEvents, resolvedEvents } = gameState;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-4 max-w-lg mx-auto space-y-4 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            Events
            {activeEvents.length > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                {activeEvents.length}
              </Badge>
            )}
          </h2>
        </motion.div>

        {/* Filter Tabs */}
        {activeEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <Tabs
              value={activeFilter}
              onValueChange={v => setActiveFilter(v as EventFilter)}
            >
              <TabsList className="bg-[#161b22] h-8 p-0.5 w-full overflow-x-auto">
                {filterOptions.map(f => {
                  const count = filterCounts[f.value] ?? 0;
                  if (f.value !== 'ALL' && count === 0) return null;
                  return (
                    <TabsTrigger
                      key={f.value}
                      value={f.value}
                      className="h-7 text-[11px] px-2 gap-1 data-[state=active]:bg-[#21262d] data-[state=active]:text-emerald-400"
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

        {/* Active Events */}
        {activeEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-[#161b22]/50 border-[#30363d] overflow-hidden">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-lg bg-[#21262d]">
                    <Inbox className="h-10 w-10 text-[#484f58]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#8b949e]">
                      No pending events
                    </p>
                    <p className="text-xs text-[#484f58] mt-1 max-w-[220px] mx-auto">
                      Events will appear as you progress through your career. Keep playing to trigger new storylines!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="bg-[#161b22]/50 border-[#30363d]">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Filter className="h-6 w-6 text-[#484f58]" />
                  <p className="text-sm text-[#8b949e]">
                    No events matching this filter
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, eventIndex) => {
                const importance = getEventImportance(event);
                const impConfig = importanceConfig[importance];
                const color = eventColors[event.type];

                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      delay: eventIndex * 0.06,
                      duration: 0.2,
                      layout: { duration: 0.2 },
                    }}
                  >
                    <Card className="bg-[#161b22]/90  border-[#30363d] overflow-hidden">
                      {/* Gradient left border */}
                      <div className="flex">
                        <div
                          className="w-1 shrink-0"
                          style={{
                            background: `linear-gradient(to bottom, ${color}, ${color}60)`,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <CardContent className="p-4">
                            {/* Header Row */}
                            <div className="flex items-start gap-3 mb-3">
                              <div
                                className="p-2 rounded-lg shrink-0"
                                style={{
                                  backgroundColor: `${color}15`,
                                  color: color,
                                }}
                              >
                                {eventIcons[event.type]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] border-[#30363d]/60 capitalize shrink-0"
                                    style={{ color: color, borderColor: `${color}40` }}
                                  >
                                    {eventLabels[event.type]}
                                  </Badge>
                                  {/* Importance Badge */}
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] border shrink-0 ${impConfig.bg} ${impConfig.color}`}
                                  >
                                    {importance === 'high' && (
                                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                    )}
                                    {impConfig.label}
                                  </Badge>
                                  {/* Pulsing dot for high priority */}
                                  {importance === 'high' && (
                                    <span className="relative flex h-2 w-2 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-bold text-sm text-[#c9d1d9] leading-tight">
                                  {event.title}
                                </h3>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-[#c9d1d9] mb-4 leading-relaxed">
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
                                        className="w-full text-left p-3 rounded-lg bg-[#21262d] border border-[#30363d] hover:bg-[#2d333b] hover:border-[#444c56] transition-colors group relative overflow-hidden"
                                        whileHover={{ opacity: 0.9 }}
                                      >
                                        {/* Hover glow effect */}
                                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="relative flex items-center justify-between">
                                          <span className="text-sm font-semibold text-[#c9d1d9] group-hover:text-emerald-300 transition-colors">
                                            {choice.label}
                                          </span>
                                          <ArrowRight className="h-4 w-4 text-[#484f58] group-hover:text-emerald-400 transition-all group-hover:translate-x-0.5" />
                                        </div>
                                        <p className="text-xs text-[#8b949e] mt-1 relative group-hover:text-[#8b949e] transition-colors">
                                          {choice.description}
                                        </p>

                                        {/* Inline mini effects badges */}
                                        {consequences.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2 relative">
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

        {/* Event Timeline for Resolved Events */}
        <EventTimeline resolvedEvents={resolvedEvents} />
      </div>
    </TooltipProvider>
  );
}
