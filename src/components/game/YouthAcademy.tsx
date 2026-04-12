'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { YouthPlayer, YouthCategory, YouthLeagueStanding, PlayerAttributes, Position } from '@/lib/game/types';
import { getPotentialRange, getPotentialStars } from '@/lib/game/youthAcademy';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Users, Trophy, TrendingUp, ArrowUp,
  ChevronRight, ChevronDown, Star, Target, Dumbbell,
  Filter, ArrowUpRight, Zap, Shield, Swords, Wind,
  BarChart3, Table, Award, Baby, Crown,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============================================================
// Helper components and utilities
// ============================================================

const POSITION_GROUPS: Record<string, { positions: Position[]; icon: React.ReactNode; color: string }> = {
  Goalkeeper: { positions: ['GK'], icon: <Shield className="h-3.5 w-3.5" />, color: 'text-amber-400' },
  Defence: { positions: ['CB', 'LB', 'RB'], icon: <Shield className="h-3.5 w-3.5" />, color: 'text-blue-400' },
  Midfield: { positions: ['CDM', 'CM', 'CAM'], icon: <Zap className="h-3.5 w-3.5" />, color: 'text-emerald-400' },
  Attack: { positions: ['LW', 'RW', 'ST'], icon: <Swords className="h-3.5 w-3.5" />, color: 'text-red-400' },
};

const ATTR_LABELS: Record<keyof PlayerAttributes, { label: string; short: string; icon: React.ReactNode }> = {
  pace: { label: 'Pace', short: 'PAC', icon: <Wind className="h-3 w-3" /> },
  shooting: { label: 'Shooting', short: 'SHO', icon: <Target className="h-3 w-3" /> },
  passing: { label: 'Passing', short: 'PAS', icon: <TrendingUp className="h-3 w-3" /> },
  dribbling: { label: 'Dribbling', short: 'DRI', icon: <Dumbbell className="h-3 w-3" /> },
  defending: { label: 'Defending', short: 'DEF', icon: <Shield className="h-3 w-3" /> },
  physical: { label: 'Physical', short: 'PHY', icon: <BarChart3 className="h-3 w-3" /> },
};

function getAttrColor(value: number): string {
  if (value >= 70) return 'bg-emerald-500';
  if (value >= 55) return 'bg-lime-500';
  if (value >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function getOverallColor(ovr: number): string {
  if (ovr >= 70) return 'text-emerald-400';
  if (ovr >= 60) return 'text-lime-400';
  if (ovr >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function getPromotionBadge(status: YouthPlayer['promotionStatus']): { label: string; color: string; bg: string } {
  switch (status) {
    case 'ready': return { label: 'Ready', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' };
    case 'overdue': return { label: 'Overdue', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' };
    default: return { label: 'Developing', color: 'text-[#8b949e]', bg: 'bg-slate-500/15 border-slate-500/30' };
  }
}

// ============================================================
// Youth Player Card
// ============================================================

function YouthPlayerCard({
  player,
  onPromote,
  onSetFocus,
  expanded,
  onToggle,
}: {
  player: YouthPlayer;
  onPromote: (target: 'u21' | 'first_team') => void;
  onSetFocus: (focus: keyof PlayerAttributes) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const potentialInfo = getPotentialRange(player.potential);
  const promoBadge = getPromotionBadge(player.promotionStatus);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-[#161b22]  border border-[#30363d] rounded-lg overflow-hidden"
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#21262d] transition-colors"
        onClick={onToggle}
      >
        {/* Overall */}
        <div className={`text-lg font-bold ${getOverallColor(player.overall)} min-w-[32px] text-center`}>
          {player.overall}
        </div>

        {/* Position badge */}
        <div className="text-xs font-semibold text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
          {player.position}
        </div>

        {/* Name & potential */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{player.name}</div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] ${potentialInfo.color}`}>{potentialInfo.label}</span>
            {player.traits.includes('wonderkid') && (
              <span className="text-[10px] text-amber-400 font-semibold">⭐ Wonderkid</span>
            )}
          </div>
        </div>

        {/* Age */}
        <div className="text-xs text-[#8b949e]">
          Age {player.age}
        </div>

        {/* Promotion badge */}
        <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${promoBadge.bg} ${promoBadge.color}`}>
          {promoBadge.label}
        </div>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-[#8b949e]" />
        </motion.div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-[#30363d] space-y-3">
              {/* Attributes */}
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(player.attributes) as (keyof PlayerAttributes)[]).map((key) => {
                  const val = Math.round(player.attributes[key]);
                  const attrInfo = ATTR_LABELS[key];
                  const isFocus = player.trainingFocus === key;
                  return (
                    <div
                      key={key}
                      className={`relative flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer transition-colors ${
                        isFocus ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-[#21262d] hover:bg-[#21262d]'
                      }`}
                      onClick={() => onSetFocus(key)}
                    >
                      <span className="text-[#8b949e]">{attrInfo.icon}</span>
                      <span className="text-[10px] text-[#8b949e] w-6">{attrInfo.short}</span>
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getAttrColor(val)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                        />
                      </div>
                      <span className={`text-xs font-semibold min-w-[20px] text-right ${isFocus ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-emerald-400" />
                  <span className="text-[#8b949e]">Apps:</span>
                  <span className="text-white font-medium">{player.seasonStats.appearances}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-red-400" />
                  <span className="text-[#8b949e]">Goals:</span>
                  <span className="text-white font-medium">{player.seasonStats.goals}</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-400" />
                  <span className="text-[#8b949e]">Assists:</span>
                  <span className="text-white font-medium">{player.seasonStats.assists}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-400" />
                  <span className="text-[#8b949e]">Avg:</span>
                  <span className="text-white font-medium">{player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}</span>
                </div>
              </div>

              {/* Fitness & Morale bars */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#8b949e]">Fitness</span>
                    <span className="text-[10px] text-[#8b949e]">{player.fitness}%</span>
                  </div>
                  <Progress value={player.fitness} className="h-1.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#8b949e]">Morale</span>
                    <span className="text-[10px] text-[#8b949e]">{player.morale}%</span>
                  </div>
                  <Progress value={player.morale} className="h-1.5" />
                </div>
              </div>

              {/* Potential stars */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8b949e]">Potential:</span>
                <span className="text-sm">{getPotentialStars(player.potential)}</span>
                <span className={`text-[10px] ${potentialInfo.color}`}>({potentialInfo.label})</span>
              </div>

              {/* Training focus hint */}
              <div className="text-[10px] text-[#8b949e] italic">
                Tap an attribute to set training focus
              </div>

              {/* Promotion buttons */}
              <div className="flex gap-2">
                {player.category === 'u18' && player.promotionStatus !== 'developing' && (
                  <button
                    onClick={() => onPromote('u21')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    Promote to U21
                  </button>
                )}
                {player.promotionStatus !== 'developing' && (
                  <button
                    onClick={() => onPromote('first_team')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/25 transition-colors"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Promote to First Team
                  </button>
                )}
                {player.promotionStatus === 'developing' && (
                  <div className="flex-1 text-center text-[10px] text-[#484f58] py-1.5">
                    Still developing — keep training!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Youth League Table Component
// ============================================================

function YouthLeagueTableView({
  standings,
  clubId,
  title,
  emoji,
}: {
  standings: YouthLeagueStanding[];
  clubId: string;
  title: string;
  emoji: string;
}) {
  const sorted = useMemo(() =>
    [...standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aGD = a.goalsFor - a.goalsAgainst;
      const bGD = b.goalsFor - b.goalsAgainst;
      if (bGD !== aGD) return bGD - aGD;
      return b.goalsFor - a.goalsFor;
    }),
    [standings]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <h3 className="text-sm font-semibold text-[#c9d1d9]">{title}</h3>
      </div>
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#21262d] text-[#8b949e]">
              <th className="py-2 px-2 text-left w-6">#</th>
              <th className="py-2 px-2 text-left">Team</th>
              <th className="py-2 px-2 text-center w-8">P</th>
              <th className="py-2 px-2 text-center w-8">W</th>
              <th className="py-2 px-2 text-center w-8">D</th>
              <th className="py-2 px-2 text-center w-8">L</th>
              <th className="py-2 px-2 text-center w-10">GD</th>
              <th className="py-2 px-2 text-center w-10 font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, idx) => {
              const isPlayer = team.clubId === clubId;
              const gd = team.goalsFor - team.goalsAgainst;
              return (
                <tr
                  key={team.clubId}
                  className={`border-t border-[#30363d] ${isPlayer ? 'bg-emerald-500/10' : 'hover:bg-[#21262d]'}`}
                >
                  <td className={`py-1.5 px-2 ${idx < 3 ? 'text-emerald-400' : idx >= sorted.length - 3 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                    {idx + 1}
                  </td>
                  <td className={`py-1.5 px-2 font-medium ${isPlayer ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>
                    {team.clubName}
                  </td>
                  <td className="py-1.5 px-2 text-center text-[#8b949e]">{team.played}</td>
                  <td className="py-1.5 px-2 text-center text-[#8b949e]">{team.won}</td>
                  <td className="py-1.5 px-2 text-center text-[#8b949e]">{team.drawn}</td>
                  <td className="py-1.5 px-2 text-center text-[#8b949e]">{team.lost}</td>
                  <td className={`py-1.5 px-2 text-center ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                    {gd > 0 ? '+' : ''}{gd}
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold text-white">{team.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Main Youth Academy Component
// ============================================================

export default function YouthAcademy() {
  const gameState = useGameStore(s => s.gameState);
  const promoteYouthPlayer = useGameStore(s => s.promoteYouthPlayer);
  const setYouthTrainingFocus = useGameStore(s => s.setYouthTrainingFocus);
  const generateNewYouthIntake = useGameStore(s => s.generateNewYouthIntake);

  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('squad');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  if (!gameState) return null;

  const { currentClub } = gameState;
  const youthTeams = gameState.youthTeams ?? [];
  const youthLeagueTables = gameState.youthLeagueTables ?? [];
  const youthMatchResults = gameState.youthMatchResults ?? [];
  const u18Team = youthTeams.find(t => t.clubId === currentClub.id && t.category === 'u18');
  const u21Team = youthTeams.find(t => t.clubId === currentClub.id && t.category === 'u21');
  const u18Standings = youthLeagueTables.filter(s => s.category === 'u18');
  const u21Standings = youthLeagueTables.filter(s => s.category === 'u21');

  // Filter players
  const getFilteredPlayers = (players: YouthPlayer[]) => {
    if (positionFilter === 'all') return players;
    const groupPositions = POSITION_GROUPS[positionFilter]?.positions ?? [];
    return players.filter(p => groupPositions.includes(p.position));
  };

  const u18Players = getFilteredPlayers(u18Team?.players ?? []);
  const u21Players = getFilteredPlayers(u21Team?.players ?? []);

  // Stats summary
  const readyCount = [...(u18Team?.players ?? []), ...(u21Team?.players ?? [])]
    .filter(p => p.promotionStatus === 'ready').length;
  const wonderkidCount = [...(u18Team?.players ?? []), ...(u21Team?.players ?? [])]
    .filter(p => p.traits.includes('wonderkid')).length;
  const avgOverallU18 = u18Team?.players.length ?
    Math.round(u18Team.players.reduce((s, p) => s + p.overall, 0) / u18Team.players.length) : 0;
  const avgOverallU21 = u21Team?.players.length ?
    Math.round(u21Team.players.reduce((s, p) => s + p.overall, 0) / u21Team.players.length) : 0;

  // Recent youth match results for player's club
  const recentYouthResults = youthMatchResults
    .filter(r => r.homeClubId === currentClub.id || r.awayClubId === currentClub.id)
    .slice(-5)
    .reverse();

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#161b22] rounded-lg p-4 border border-[#30363d]"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Youth Academy</h1>
            <p className="text-xs text-[#8b949e]">{currentClub.name} • Youth Development: {currentClub.youthDevelopment}/100</p>
          </div>
          <button
            onClick={generateNewYouthIntake}
            className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-colors"
          >
            <Baby className="h-3.5 w-3.5 inline mr-1" />
            Scout
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-white">{u18Team?.players.length ?? 0}</div>
            <div className="text-[10px] text-[#8b949e]">U18 Players</div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-white">{u21Team?.players.length ?? 0}</div>
            <div className="text-[10px] text-[#8b949e]">U21 Players</div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-emerald-400">{readyCount}</div>
            <div className="text-[10px] text-[#8b949e]">Ready</div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-amber-400">{wonderkidCount}</div>
            <div className="text-[10px] text-[#8b949e]">Wonderkids</div>
          </div>
        </div>

        {/* Average overall */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-[#21262d] rounded-lg p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">U18 Avg OVR</div>
              <div className="text-xs text-[#8b949e]">{avgOverallU18}</div>
            </div>
          </div>
          <div className="bg-[#21262d] rounded-lg p-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Crown className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">U21 Avg OVR</div>
              <div className="text-xs text-[#8b949e]">{avgOverallU21}</div>
            </div>
          </div>
        </div>

        {/* Youth dev quality bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#8b949e]">Academy Quality</span>
            <span className="text-[10px] text-emerald-400">{currentClub.youthDevelopment}%</span>
          </div>
          <Progress value={currentClub.youthDevelopment} className="h-2" />
        </div>
      </motion.div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-[#161b22] border border-[#30363d]">
          <TabsTrigger value="squad" className="flex-1 text-xs">
            <Users className="h-3.5 w-3.5 mr-1" /> Squad
          </TabsTrigger>
          <TabsTrigger value="league" className="flex-1 text-xs">
            <Table className="h-3.5 w-3.5 mr-1" /> League
          </TabsTrigger>
          <TabsTrigger value="results" className="flex-1 text-xs">
            <Trophy className="h-3.5 w-3.5 mr-1" /> Results
          </TabsTrigger>
        </TabsList>

        {/* Squad Tab */}
        <TabsContent value="squad" className="space-y-3 mt-3">
          {/* Position filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setPositionFilter('all')}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                positionFilter === 'all' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              All
            </button>
            {Object.entries(POSITION_GROUPS).map(([group, config]) => (
              <button
                key={group}
                onClick={() => setPositionFilter(group)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  positionFilter === group ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                {config.icon} {group}
              </button>
            ))}
          </div>

          {/* U18 Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                U18 Squad
              </Badge>
              <span className="text-[10px] text-[#8b949e]">{u18Players.length} players</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {u18Players
                  .sort((a, b) => b.overall - a.overall)
                  .map(player => (
                    <YouthPlayerCard
                      key={player.id}
                      player={player}
                      onPromote={(target) => promoteYouthPlayer(player.id, target)}
                      onSetFocus={(focus) => setYouthTrainingFocus(player.id, focus)}
                      expanded={expandedPlayer === player.id}
                      onToggle={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                    />
                  ))}
              </AnimatePresence>
              {u18Players.length === 0 && (
                <div className="text-center py-6 text-[#484f58] text-xs">
                  No U18 players matching filter
                </div>
              )}
            </div>
          </div>

          {/* U21 Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                U21 Squad
              </Badge>
              <span className="text-[10px] text-[#8b949e]">{u21Players.length} players</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {u21Players
                  .sort((a, b) => b.overall - a.overall)
                  .map(player => (
                    <YouthPlayerCard
                      key={player.id}
                      player={player}
                      onPromote={(target) => promoteYouthPlayer(player.id, target)}
                      onSetFocus={(focus) => setYouthTrainingFocus(player.id, focus)}
                      expanded={expandedPlayer === player.id}
                      onToggle={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                    />
                  ))}
              </AnimatePresence>
              {u21Players.length === 0 && (
                <div className="text-center py-6 text-[#484f58] text-xs">
                  No U21 players matching filter
                </div>
              )}
            </div>
          </div>

          {/* Promotion Pipeline */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-[#c9d1d9]">Promotion Pipeline</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#21262d] rounded-lg p-2">
                <div className="text-xs text-blue-400 font-semibold">U18</div>
                <div className="text-[10px] text-[#8b949e]">Ages 14-17</div>
                <div className="text-[10px] text-[#8b949e] mt-1">→ U21</div>
              </div>
              <div className="bg-[#21262d] rounded-lg p-2">
                <div className="text-xs text-purple-400 font-semibold">U21</div>
                <div className="text-[10px] text-[#8b949e]">Ages 18-21</div>
                <div className="text-[10px] text-[#8b949e] mt-1">→ First Team</div>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                <div className="text-xs text-emerald-400 font-semibold">First Team</div>
                <div className="text-[10px] text-[#8b949e]">Senior Squad</div>
                <div className="text-[10px] text-emerald-400 mt-1">Active</div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* League Table Tab */}
        <TabsContent value="league" className="space-y-3 mt-3">
          {u18Standings.length > 0 && (
            <YouthLeagueTableView
              standings={u18Standings}
              clubId={currentClub.id}
              title="U18 League"
              emoji="👦"
            />
          )}
          {u21Standings.length > 0 && (
            <YouthLeagueTableView
              standings={u21Standings}
              clubId={currentClub.id}
              title="U21 League"
              emoji="🧑"
            />
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-3 mt-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-[#c9d1d9]">Recent Youth Results</span>
          </div>

          {recentYouthResults.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center">
              <Trophy className="h-8 w-8 text-[#30363d] mx-auto mb-2" />
              <p className="text-xs text-[#8b949e]">No youth matches played yet</p>
              <p className="text-[10px] text-[#484f58] mt-1">Results will appear as weeks advance</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentYouthResults.map((result, idx) => {
                const isHome = result.homeClubId === currentClub.id;
                const playerScore = isHome ? result.homeScore : result.awayScore;
                const opponentScore = isHome ? result.awayScore : result.homeScore;
                const resultColor = playerScore > opponentScore ? 'text-emerald-400' :
                  playerScore < opponentScore ? 'text-red-400' : 'text-amber-400';
                const resultLabel = playerScore > opponentScore ? 'W' :
                  playerScore < opponentScore ? 'L' : 'D';

                return (
                  <motion.div
                    key={`${result.fixtureId}-${idx}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      resultLabel === 'W' ? 'bg-emerald-500/15 text-emerald-400' :
                      resultLabel === 'L' ? 'bg-red-500/15 text-red-400' :
                      'bg-amber-500/15 text-amber-400'
                    }`}>
                      {resultLabel}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${resultColor}`}>{playerScore} - {opponentScore}</span>
                        <Badge variant="outline" className={`text-[10px] ${
                          result.category === 'u18' ? 'text-blue-400 border-blue-500/30' : 'text-purple-400 border-purple-500/30'
                        }`}>
                          {result.category.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-[#8b949e] border-slate-600/30">
                          {result.competition === 'youth_league' ? 'League' : 'Cup'}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-[#8b949e]">Week {result.week} • Season {result.season}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
