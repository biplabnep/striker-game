'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Heart,
  Shield,
  Swords,
  Star,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  UserCheck,
  Crown,
  Flame,
  ChevronDown,
  ChevronUp,
  Handshake,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Relationship,
  RelationshipType,
  RelationshipLevel,
  TeamDynamics,
} from '@/lib/game/types';
import {
  getRelationshipLevel,
  getAffinityColor,
  getAffinityBarColor,
  getAtmosphereLabel,
} from '@/lib/game/relationshipsEngine';

// --- Helper: Relationship type icon ---
function getRelTypeIcon(type: RelationshipType) {
  switch (type) {
    case 'teammate':
      return <Users className="h-4 w-4" />;
    case 'coach':
      return <Shield className="h-4 w-4" />;
    case 'rival':
      return <Swords className="h-4 w-4" />;
    case 'mentor':
      return <Star className="h-4 w-4" />;
    case 'agent':
      return <Handshake className="h-4 w-4" />;
    case 'media':
      return <MessageCircle className="h-4 w-4" />;
    case 'fan_favorite':
      return <Heart className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
}

// --- Helper: Relationship type label ---
function getRelTypeLabel(type: RelationshipType): string {
  switch (type) {
    case 'teammate': return 'Teammate';
    case 'coach': return 'Coach';
    case 'rival': return 'Rival';
    case 'mentor': return 'Mentor';
    case 'agent': return 'Agent';
    case 'media': return 'Media';
    case 'fan_favorite': return 'Fan Favourite';
    default: return type;
  }
}

// --- Helper: Relationship type badge color ---
function getRelTypeBadgeColor(type: RelationshipType): string {
  switch (type) {
    case 'teammate': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
    case 'coach': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    case 'rival': return 'bg-red-500/15 text-red-400 border-red-500/20';
    case 'mentor': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
    case 'agent': return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
    case 'media': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20';
    case 'fan_favorite': return 'bg-pink-500/15 text-pink-400 border-pink-500/20';
    default: return 'bg-slate-500/15 text-[#8b949e] border-slate-500/20';
  }
}

// --- Helper: Relationship level badge color ---
function getLevelBadgeStyle(level: RelationshipLevel): string {
  switch (level) {
    case 'legendary': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'close': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'friendly': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'neutral': return 'bg-slate-500/20 text-[#c9d1d9] border-slate-500/30';
    case 'cold': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'hostile': return 'bg-red-500/20 text-red-300 border-red-500/30';
    default: return 'bg-slate-500/20 text-[#c9d1d9] border-slate-500/30';
  }
}

// --- Helper: Position badge color ---
function getPositionColor(position: string): string {
  if (['ST', 'LW', 'RW'].includes(position)) return 'bg-red-500/15 text-red-400';
  if (['CAM', 'CM', 'CDM'].includes(position)) return 'bg-green-500/15 text-green-400';
  if (['CB', 'LB', 'RB'].includes(position)) return 'bg-blue-500/15 text-blue-400';
  if (position === 'GK') return 'bg-amber-500/15 text-amber-400';
  return 'bg-slate-500/15 text-[#8b949e]';
}

// --- Helper: Trait badge style ---
function getTraitStyle(trait: string): string {
  switch (trait) {
    case 'supportive': return 'bg-emerald-500/15 text-emerald-400';
    case 'competitive': return 'bg-red-500/15 text-red-400';
    case 'jealous': return 'bg-orange-500/15 text-orange-400';
    case 'loyal': return 'bg-blue-500/15 text-blue-400';
    case 'ambitious': return 'bg-amber-500/15 text-amber-400';
    case 'relaxed': return 'bg-cyan-500/15 text-cyan-400';
    default: return 'bg-slate-500/15 text-[#8b949e]';
  }
}

// --- Sub-component: Team Dynamics Card ---
function TeamDynamicsCard({ dynamics }: { dynamics: TeamDynamics }) {
  const atmosphere = getAtmosphereLabel(dynamics.dressingRoomAtmosphere);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg bg-[#161b22]  border border-[#30363d] p-4 mb-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-emerald-500/15">
          <Users className="h-5 w-5 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Team Dynamics</h2>
      </div>

      {/* Atmosphere Badge */}
      <div className="mb-4">
        <span className="text-xs text-[#8b949e] mb-1.5 block">Dressing Room Atmosphere</span>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${atmosphere.color}`}>
          <span>{atmosphere.icon}</span>
          <span>{atmosphere.label}</span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {/* Morale */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#8b949e] flex items-center gap-1">
              <Heart className="h-3 w-3" /> Team Morale
            </span>
            <span className={`text-xs font-semibold ${dynamics.morale >= 70 ? 'text-emerald-400' : dynamics.morale >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {dynamics.morale}%
            </span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dynamics.morale}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                dynamics.morale >= 70 ? 'bg-emerald-500' : dynamics.morale >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Cohesion */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#8b949e] flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Cohesion
            </span>
            <span className={`text-xs font-semibold ${dynamics.cohesion >= 70 ? 'text-emerald-400' : dynamics.cohesion >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {dynamics.cohesion}%
            </span>
          </div>
          <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dynamics.cohesion}%` }}
              transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
              className={`h-full rounded-full ${
                dynamics.cohesion >= 70 ? 'bg-emerald-500' : dynamics.cohesion >= 40 ? 'bg-amber-500' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Influence + Captain */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-[#21262d] rounded-lg p-3 text-center">
            <Flame className="h-4 w-4 text-orange-400 mx-auto mb-1" />
            <span className="text-lg font-bold text-white">{dynamics.playerInfluence}</span>
            <span className="block text-[10px] text-[#8b949e] mt-0.5">Influence</span>
          </div>
          <div className="bg-[#21262d] rounded-lg p-3 text-center">
            <Crown className="h-4 w-4 text-amber-400 mx-auto mb-1" />
            <span className="text-lg font-bold text-white">{dynamics.captainRating}</span>
            <span className="block text-[10px] text-[#8b949e] mt-0.5">Leadership</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Sub-component: Relationship Card ---
function RelationshipCard({
  rel,
  index,
  onPromote,
}: {
  rel: Relationship;
  index: number;
  onPromote: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={`rounded-lg border ${
        rel.isCurrent
          ? 'bg-[#161b22] border-[#30363d]'
          : 'bg-[#161b22]/40 border-[#30363d] opacity-60'
      }  overflow-hidden`}
    >
      {/* Main row */}
      <div
        className="p-3 cursor-pointer hover:bg-[#21262d] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {/* Type icon */}
          <div className={`p-2 rounded-lg ${getRelTypeBadgeColor(rel.type)} border shrink-0`}>
            {getRelTypeIcon(rel.type)}
          </div>

          {/* Name & details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm truncate">{rel.name}</span>
              {rel.position && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getPositionColor(rel.position)}`}>
                  {rel.position}
                </span>
              )}
              {!rel.isCurrent && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-700/50 text-[#8b949e]">
                  Former
                </span>
              )}
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getRelTypeBadgeColor(rel.type)}`}>
                {getRelTypeLabel(rel.type)}
              </Badge>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getLevelBadgeStyle(rel.level)}`}>
                {rel.level}
              </Badge>
              {rel.trait && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getTraitStyle(rel.trait)}`}>
                  {rel.trait}
                </Badge>
              )}
            </div>
          </div>

          {/* Affinity */}
          <div className="flex flex-col items-end shrink-0">
            <span className={`text-sm font-bold ${getAffinityColor(rel.affinity)}`}>
              {rel.affinity}
            </span>
            <div className="w-16 h-1.5 bg-[#21262d] rounded-full overflow-hidden mt-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rel.affinity}%` }}
                transition={{ duration: 0.2, ease: 'easeOut', delay: 0.2 }}
                className={`h-full rounded-full ${getAffinityBarColor(rel.affinity)}`}
              />
            </div>
          </div>

          {/* Expand icon */}
          <div className="shrink-0 text-[#8b949e]">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-[#30363d]">
              {/* Full affinity bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#8b949e]">Affinity</span>
                  <span className={`text-xs font-semibold ${getAffinityColor(rel.affinity)}`}>
                    {rel.affinity}/100
                  </span>
                </div>
                <Progress value={rel.affinity} className="h-2" />
              </div>

              {/* History */}
              {rel.history.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-[#8b949e] mb-1.5 block">Key Moments</span>
                  <div className="space-y-1">
                    {rel.history.slice().reverse().map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                        <span className="text-[#c9d1d9]">{entry}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promote button */}
              {rel.isCurrent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPromote(rel.id);
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  Spend Time Together (+5)
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Main Component ---
export default function RelationshipsPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const promoteRelationshipLevel = useGameStore((s) => s.promoteRelationshipLevel);

  const [filter, setFilter] = useState<string>('all');

  const relationships = useMemo(
    () => gameState?.relationships ?? [],
    [gameState?.relationships]
  );

  const teamDynamics = useMemo(
    () => gameState?.teamDynamics,
    [gameState?.teamDynamics]
  );

  const filteredRelationships = useMemo(() => {
    if (filter === 'all') return relationships;
    if (filter === 'current') return relationships.filter((r) => r.isCurrent);
    return relationships.filter((r) => r.type === filter);
  }, [relationships, filter]);

  // Count by type
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: relationships.length, current: relationships.filter((r) => r.isCurrent).length };
    for (const r of relationships) {
      c[r.type] = (c[r.type] ?? 0) + 1;
    }
    return c;
  }, [relationships]);

  if (!gameState || !teamDynamics) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center text-[#8b949e]">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No team data available</p>
      </div>
    );
  }

  const filterTabs = [
    { value: 'all', label: 'All' },
    { value: 'current', label: 'Current' },
    { value: 'teammate', label: 'Mates' },
    { value: 'coach', label: 'Coach' },
    { value: 'rival', label: 'Rival' },
    { value: 'mentor', label: 'Mentor' },
  ].filter((tab) => {
    if (tab.value === 'all' || tab.value === 'current') return true;
    return (counts[tab.value] ?? 0) > 0;
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 mb-4"
      >
        <div className="p-2 rounded-lg bg-emerald-500/15">
          <Users className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Team & Relationships</h1>
          <p className="text-xs text-[#8b949e]">
            {gameState.currentClub.name} &middot; S{gameState.currentSeason} W{gameState.currentWeek}
          </p>
        </div>
      </motion.div>

      {/* Team Dynamics Card */}
      <TeamDynamicsCard dynamics={teamDynamics} />

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-[#161b22] border border-[#30363d] w-full h-auto p-1 flex-wrap gap-1">
            {filterTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400"
              >
                {tab.label}
                {counts[tab.value] !== undefined && (
                  <span className="ml-1 text-[10px] opacity-60">({counts[tab.value]})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Relationships List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredRelationships.length > 0 ? (
            filteredRelationships.map((rel, i) => (
              <RelationshipCard
                key={rel.id}
                rel={rel}
                index={i}
                onPromote={promoteRelationshipLevel}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Users className="h-12 w-12 mx-auto mb-3 text-[#484f58]" />
              <p className="text-[#8b949e] text-sm">No relationships found</p>
              <p className="text-[#8b949e] text-xs mt-1">Try a different filter</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
