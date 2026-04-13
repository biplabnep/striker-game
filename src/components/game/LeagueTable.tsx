'use client';

import { useGameStore } from '@/store/gameStore';
import { getClubById, getLeagueById, getSeasonMatchdays } from '@/lib/game/clubsData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, ArrowDown, Minus, ChevronUp, ChevronDown,
  Target, Shield, Swords, BarChart3, Activity, Crown,
  Star, Users, Crosshair
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Synthetic player name pools ─────────────────────────────────────────────
const FIRST_NAMES = [
  'Marcus', 'Lucas', 'Erik', 'Mateo', 'Youssef', 'Liam', 'Noah', 'Adrian',
  'Felix', 'Leo', 'Oscar', 'Rafael', 'Sergio', 'Andreas', 'Kevin', 'Jules',
  'Victor', 'Hugo', 'Theo', 'Alejandro', 'Julian', 'Ivan', 'Emil', 'Daniel',
  'Nicolas', 'Patrick', 'Roberto', 'Antonio', 'Fabian', 'Stefan', 'Pierre',
  'Carlos', 'Diego', 'Romain', 'Bastian', 'Maximilian', 'Tobias', 'Nils', 'Henrik',
];
const LAST_NAMES = [
  'Müller', 'Silva', 'Hernandez', 'Dubois', 'Rossi', 'Berg', 'Kim', 'Tanaka',
  'Petrov', 'Larsen', 'Costa', 'Fernandez', 'Jensen', 'Novak', 'Volkov',
  'Ibrahim', 'Park', 'Ali', 'Weber', 'Svensson', 'Torres', 'Mora', 'Blanc',
  'Schultz', 'Moreno', 'Andersen', 'Roux', 'Kowalski', 'Santos', 'Lindberg',
  'Garcia', 'Lopez', 'Martinez', 'Hoffmann', 'Eriksson', 'Bailey', 'Reid',
  'Morrison', 'Fletcher', 'Nguyen', 'Patel', 'Chen', 'Wagner', 'Schmidt',
];

// Deterministic name from clubId
function playerNameForClub(clubId: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < clubId.length; i++) hash = ((hash << 5) - hash + clubId.charCodeAt(i)) | 0;
  hash = Math.abs(hash + index * 31);
  const fn = FIRST_NAMES[hash % FIRST_NAMES.length];
  const ln = LAST_NAMES[(hash * 7 + index * 13) % LAST_NAMES.length];
  return `${fn} ${ln}`;
}

// ─── Type for tab ────────────────────────────────────────────────────────────
type TabKey = 'table' | 'scorers' | 'assists';

// ─── Tiny form result dot ────────────────────────────────────────────────────
function FormDot({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = {
    W: 'bg-emerald-400',
    D: 'bg-amber-400',
    L: 'bg-red-400',
  };
  return <div className={`w-2 h-2 rounded-full ${colors[result]}`} title={result} />;
}

// ─── Position change indicator ───────────────────────────────────────────────
function PositionChange({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === current) {
    return <span className="text-[#484f58] text-[9px]">—</span>;
  }
  const diff = previous - current;
  if (diff > 0) {
    return (
      <div className="flex items-center text-emerald-400">
        <ChevronUp className="w-3 h-3" />
        <span className="text-[9px] font-bold">{diff}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center text-red-400">
      <ChevronDown className="w-3 h-3" />
      <span className="text-[9px] font-bold">{Math.abs(diff)}</span>
    </div>
  );
}

// ─── Zone border color helper ────────────────────────────────────────────────
function zoneBorderClass(pos: number, totalTeams: number, isPlayer: boolean): string {
  if (isPlayer) return 'border-l-2 border-l-emerald-500 bg-emerald-500/5';
  if (pos <= 4) return 'border-l-2 border-l-emerald-500/30';
  if (pos <= 6) return 'border-l-2 border-l-blue-500/30';
  if (pos >= totalTeams - 2) return 'border-l-2 border-l-red-500/30';
  return 'border-l-2 border-l-transparent';
}

// ─── Position rank icon (crown/star) ─────────────────────────────────────────
function PositionRankIcon({ pos }: { pos: number }) {
  if (pos === 1) return <Crown className="w-3 h-3 text-yellow-400" />;
  if (pos <= 3) return <Star className="w-3 h-3 text-emerald-400" />;
  return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LeagueTable() {
  const gameState = useGameStore(state => state.gameState);
  const [activeTab, setActiveTab] = useState<TabKey>('table');
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  const leagueInfo = useMemo(() => {
    if (!gameState) return null;
    return getLeagueById(gameState.currentClub.league);
  }, [gameState]);

  // Derive form from recent results per club
  const clubForm = useMemo(() => {
    if (!gameState) return new Map<string, ('W' | 'D' | 'L')[]>();
    const formMap = new Map<string, ('W' | 'D' | 'L')[]>();

    const results = gameState.recentResults.slice(0, 5);
    for (const result of results) {
      const homeResult: 'W' | 'D' | 'L' =
        result.homeScore > result.awayScore ? 'W' : result.homeScore === result.awayScore ? 'D' : 'L';
      const awayResult: 'W' | 'D' | 'L' =
        result.awayScore > result.homeScore ? 'W' : result.homeScore === result.awayScore ? 'D' : 'L';

      const homeForm = formMap.get(result.homeClub.id) || [];
      homeForm.unshift(homeResult);
      formMap.set(result.homeClub.id, homeForm.slice(0, 5));

      const awayForm = formMap.get(result.awayClub.id) || [];
      awayForm.unshift(awayResult);
      formMap.set(result.awayClub.id, awayForm.slice(0, 5));
    }

    // Placeholder form for clubs not in recent results
    for (const entry of gameState.leagueTable) {
      if (!formMap.has(entry.clubId)) {
        if (entry.played === 0) {
          formMap.set(entry.clubId, []);
        } else {
          const winRate = entry.won / Math.max(1, entry.played);
          const form: ('W' | 'D' | 'L')[] = [];
          for (let i = 0; i < 5; i++) {
            const r = Math.random();
            if (r < winRate) form.push('W');
            else if (r < winRate + entry.drawn / Math.max(1, entry.played)) form.push('D');
            else form.push('L');
          }
          formMap.set(entry.clubId, form);
        }
      }
    }

    return formMap;
  }, [gameState]);

  // Previous positions (simulate from form changes)
  const previousPositions = useMemo(() => {
    if (!gameState) return new Map<string, number>();
    const posMap = new Map<string, number>();
    const sorted = [...gameState.leagueTable].sort((a, b) => {
      const ptsDiff = b.points - a.points;
      if (ptsDiff !== 0) return ptsDiff;
      return b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst);
    });
    for (let i = 0; i < sorted.length; i++) {
      const variation = Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : -1) : 0;
      posMap.set(sorted[i].clubId, Math.max(1, i + 1 + variation));
    }
    return posMap;
  }, [gameState]);

  // ─── Synthetic top scorers ─────────────────────────────────────────────────
  const topScorers = useMemo(() => {
    if (!gameState) return [];
    const totalTeams = gameState.leagueTable.length;
    const scorers: { rank: number; name: string; clubId: string; clubName: string; goals: number; assists: number }[] = [];

    for (let i = 0; i < totalTeams; i++) {
      const entry = gameState.leagueTable[i];
      const club = getClubById(entry.clubId);
      if (!entry.played) continue;

      // Top scorer gets ~35% of club goals, 2nd gets ~20%, 3rd gets ~12%
      const distribution = [0.35, 0.20, 0.12];
      for (let p = 0; p < distribution.length; p++) {
        const goals = Math.round(entry.goalsFor * distribution[p]);
        if (goals < 1) continue;
        const assists = Math.round(goals * (0.1 + Math.random() * 0.25));
        scorers.push({
          name: playerNameForClub(entry.clubId, p),
          clubId: entry.clubId,
          clubName: club?.shortName || entry.clubName,
          goals,
          assists,
        });
      }
    }

    // Insert player if they have goals
    const playerGoals = gameState.player.seasonStats.goals;
    const playerAssists = gameState.player.seasonStats.assists;
    if (playerGoals > 0) {
      scorers.push({
        name: gameState.player.name,
        clubId: gameState.currentClub.id,
        clubName: gameState.currentClub.shortName,
        goals: playerGoals,
        assists: playerAssists,
      });
    }

    return scorers
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
      .slice(0, 10)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, [gameState]);

  // ─── Synthetic top assists ─────────────────────────────────────────────────
  const topAssists = useMemo(() => {
    if (!gameState) return [];
    const totalTeams = gameState.leagueTable.length;
    const assisters: { rank: number; name: string; clubId: string; clubName: string; goals: number; assists: number }[] = [];

    for (let i = 0; i < totalTeams; i++) {
      const entry = gameState.leagueTable[i];
      const club = getClubById(entry.clubId);
      if (!entry.played) continue;

      const distribution = [0.30, 0.18, 0.10];
      for (let p = 0; p < distribution.length; p++) {
        const assists = Math.round(entry.goalsFor * distribution[p]);
        if (assists < 1) continue;
        const goals = Math.round(assists * (0.05 + Math.random() * 0.2));
        assisters.push({
          name: playerNameForClub(entry.clubId, p + 10),
          clubId: entry.clubId,
          clubName: club?.shortName || entry.clubName,
          goals,
          assists,
        });
      }
    }

    const playerGoals = gameState.player.seasonStats.goals;
    const playerAssists = gameState.player.seasonStats.assists;
    if (playerAssists > 0) {
      assisters.push({
        name: gameState.player.name,
        clubId: gameState.currentClub.id,
        clubName: gameState.currentClub.shortName,
        goals: playerGoals,
        assists: playerAssists,
      });
    }

    return assisters
      .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
      .slice(0, 10)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, [gameState]);

  if (!gameState) return null;

  const { leagueTable, currentClub, currentSeason } = gameState;
  const totalTeams = leagueTable.length;
  const totalMatches = Math.max(0, ...leagueTable.map(e => e.played)) * totalTeams / 2;

  const getFormLabel = (clubId: string, played: number): { text: string; color: string } => {
    const form = clubForm.get(clubId) || [];
    if (form.length === 0 || played === 0) return { text: 'No matches', color: 'text-[#484f58]' };
    const pts = form.reduce((sum, r) => sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0);
    if (pts >= 12) return { text: 'Excellent', color: 'text-emerald-400' };
    if (pts >= 8) return { text: 'Good', color: 'text-emerald-300' };
    if (pts >= 5) return { text: 'Average', color: 'text-amber-400' };
    if (pts >= 2) return { text: 'Poor', color: 'text-red-300' };
    return { text: 'Awful', color: 'text-red-500' };
  };

  const maxPoints = Math.max(...leagueTable.map(e => e.points), 1);

  // ─── Tab config ────────────────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'table', label: 'League Table', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: 'scorers', label: 'Top Scorers', icon: <Crosshair className="w-3.5 h-3.5" /> },
    { key: 'assists', label: 'Top Assists', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-[#0d1117] min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-[#161b22] border border-[#30363d] overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 bg-emerald-500" />

          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-[#c9d1d9] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                {leagueInfo?.name || 'League Table'}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Season badge */}
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5 font-semibold">
                Season {currentSeason}
              </Badge>
              {/* Week indicator */}
              <Badge variant="outline" className="border-[#30363d] text-[#8b949e] text-[10px] px-2 py-0.5">
                Week {gameState.currentWeek}/{getSeasonMatchdays(gameState.currentClub.league)}
              </Badge>
              {/* Total matches */}
              <Badge variant="outline" className="border-[#30363d] text-[#8b949e] text-[10px] px-2 py-0.5">
                {Math.round(totalMatches)} matches played
              </Badge>
            </div>
          </div>

          {/* ─── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex border-t border-[#30363d]">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                  activeTab === tab.key
                    ? 'text-emerald-400 border-b-2 border-b-emerald-500 bg-emerald-500/5'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Tab Content ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'table' && (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <LeagueTableTab
                leagueTable={leagueTable}
                currentClubId={currentClub.id}
                totalTeams={totalTeams}
                clubForm={clubForm}
                previousPositions={previousPositions}
                expandedClub={expandedClub}
                setExpandedClub={setExpandedClub}
                maxPoints={maxPoints}
                getFormLabel={getFormLabel}
              />
            </motion.div>
          )}

          {activeTab === 'scorers' && (
            <motion.div
              key="scorers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <StatsLeaderboard
                data={topScorers}
                column="goals"
                columnLabel="Goals"
                icon={<Crosshair className="w-4 h-4 text-emerald-400" />}
                title="Top Scorers"
                currentClubId={currentClub.id}
                playerName={gameState.player.name}
              />
            </motion.div>
          )}

          {activeTab === 'assists' && (
            <motion.div
              key="assists"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <StatsLeaderboard
                data={topAssists}
                column="assists"
                columnLabel="Assists"
                icon={<Users className="w-4 h-4 text-blue-400" />}
                title="Top Assists"
                currentClubId={currentClub.id}
                playerName={gameState.player.name}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Your Position Summary Card ──────────────────────────────────── */}
        {(() => {
          const playerPos = leagueTable.findIndex(e => e.clubId === currentClub.id) + 1;
          const playerEntry = leagueTable.find(e => e.clubId === currentClub.id);
          if (!playerEntry) return null;
          const indicator = getPositionIndicator(playerPos, totalTeams);
          const playerForm = clubForm.get(currentClub.id) || [];
          const formInfo = getFormLabel(currentClub.id, playerEntry.played);
          const gd = playerEntry.goalsFor - playerEntry.goalsAgainst;

          const pointsToUCL = playerPos > 4 ? (leagueTable[3]?.points ?? 0) - playerEntry.points + 1 : 0;
          const pointsFromRel = playerPos >= totalTeams - 2 ? playerEntry.points - (leagueTable[totalTeams - 3]?.points ?? 0) : 0;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Card className="bg-[#161b22] border-[#30363d] overflow-hidden">
                <div className="h-1 bg-emerald-500" />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{currentClub.logo}</span>
                      <div>
                        <p className="font-bold text-sm text-[#c9d1d9]">{currentClub.name}</p>
                        <p className="text-xs text-[#8b949e] flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">
                            {playerPos}{playerPos === 1 ? 'st' : playerPos === 2 ? 'nd' : playerPos === 3 ? 'rd' : 'th'}
                          </span>
                          in the league
                          <span style={{ color: indicator.color }}>• {indicator.label || 'Mid-table'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-emerald-400">{playerEntry.points}</p>
                      <p className="text-[10px] text-[#8b949e]">points</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { value: playerEntry.played, label: 'Played', color: 'text-[#c9d1d9]' },
                      { value: playerEntry.won, label: 'Won', color: 'text-emerald-400' },
                      { value: playerEntry.drawn, label: 'Drawn', color: 'text-amber-400' },
                      { value: playerEntry.lost, label: 'Lost', color: 'text-red-400' },
                      { value: `${gd > 0 ? '+' : ''}${gd}`, label: 'GD', color: gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]' },
                    ].map((stat, i) => (
                      <div key={i}>
                        <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-[#8b949e]">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Form and Zone Info */}
                  <div className="mt-3 pt-3 border-t border-[#30363d] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#8b949e] font-medium">Recent Form</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {playerForm.length > 0 ? playerForm.map((r, i) => (
                            <FormDot key={i} result={r} />
                          )) : (
                            <span className="text-[10px] text-[#484f58]">No matches yet</span>
                          )}
                        </div>
                        <span className="text-[9px] text-[#484f58]">
                          {playerForm.join('')}
                        </span>
                        <span className={`text-[10px] font-bold ${formInfo.color}`}>{formInfo.text}</span>
                      </div>
                    </div>

                    {playerPos > 4 && pointsToUCL > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e] font-medium flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5 text-emerald-400" />
                          To UCL
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">{pointsToUCL} pts needed</span>
                      </div>
                    )}

                    {playerPos >= totalTeams - 2 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e] font-medium flex items-center gap-1">
                          <ArrowDown className="w-2.5 h-2.5 text-red-400" />
                          From Safety
                        </span>
                        <span className="text-[10px] text-red-400 font-bold">{pointsFromRel} pts clear</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e]">Win Rate</span>
                        <span className="text-[10px] text-[#c9d1d9] font-semibold">
                          {playerEntry.played > 0 ? Math.round((playerEntry.won / playerEntry.played) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#8b949e]">Goals/Game</span>
                        <span className="text-[10px] text-[#c9d1d9] font-semibold">
                          {playerEntry.played > 0 ? (playerEntry.goalsFor / playerEntry.played).toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

        {/* ─── Best Attack / Best Defence ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <p className="text-[9px] text-[#8b949e] font-semibold mb-2 flex items-center gap-1">
                <Swords className="w-3 h-3 text-emerald-400" />
                Best Attack
              </p>
              {(() => {
                const best = [...leagueTable].sort((a, b) => b.goalsFor - a.goalsFor)[0];
                const bestClub = getClubById(best.clubId);
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bestClub?.logo}</span>
                    <div>
                      <p className="text-xs font-semibold text-[#c9d1d9]">{bestClub?.shortName}</p>
                      <p className="text-lg font-black text-emerald-400">{best.goalsFor}</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-3">
              <p className="text-[9px] text-[#8b949e] font-semibold mb-2 flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-400" />
                Best Defence
              </p>
              {(() => {
                const best = [...leagueTable].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
                const bestClub = getClubById(best.clubId);
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{bestClub?.logo}</span>
                    <div>
                      <p className="text-xs font-semibold text-[#c9d1d9]">{bestClub?.shortName}</p>
                      <p className="text-lg font-black text-blue-400">{best.goalsAgainst}</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── League Table Tab ────────────────────────────────────────────────────────
function LeagueTableTab({
  leagueTable,
  currentClubId,
  totalTeams,
  clubForm,
  previousPositions,
  expandedClub,
  setExpandedClub,
  maxPoints,
  getFormLabel,
}: {
  leagueTable: { clubId: string; clubName: string; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; points: number }[];
  currentClubId: string;
  totalTeams: number;
  clubForm: Map<string, ('W' | 'D' | 'L')[]>;
  previousPositions: Map<string, number>;
  expandedClub: string | null;
  setExpandedClub: (id: string | null) => void;
  maxPoints: number;
  getFormLabel: (clubId: string, played: number) => { text: string; color: string };
}) {
  return (
    <div>
      {/* Zone Legend */}
      <div className="flex items-center gap-4 text-[10px] px-1 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[#8b949e]">Champions League</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[#8b949e]">Europa League</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[#8b949e]">Relegation</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-[#161b22] rounded-t-lg border border-[#30363d] border-b-0">
        <div className="grid grid-cols-[1.5rem_1.75rem_1fr_3rem_3rem_3.5rem_3.5rem] gap-0.5 px-2.5 py-2 text-[9px] text-[#8b949e] font-semibold uppercase tracking-wide items-center">
          <span className="text-center">↕</span>
          <span>#</span>
          <span>Club</span>
          <span className="text-center">P</span>
          <span className="text-center">GD</span>
          <span className="text-center">Pts</span>
          <span className="text-center">Form</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-[#161b22] rounded-b-lg border border-[#30363d] border-t-0 overflow-hidden">
        {leagueTable.map((entry, idx) => {
          const pos = idx + 1;
          const club = getClubById(entry.clubId);
          const isPlayer = entry.clubId === currentClubId;
          const gd = entry.goalsFor - entry.goalsAgainst;
          const form = clubForm.get(entry.clubId) || [];
          const formInfo = getFormLabel(entry.clubId, entry.played);
          const prevPos = previousPositions.get(entry.clubId);
          const isExpanded = expandedClub === entry.clubId;

          return (
            <motion.div
              key={entry.clubId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: idx * 0.02 }}
            >
              <div
                onClick={() => setExpandedClub(isExpanded ? null : entry.clubId)}
                className={`grid grid-cols-[1.5rem_1.75rem_1fr_3rem_3rem_3.5rem_3.5rem] gap-0.5 px-2.5 py-2 items-center text-sm transition-colors cursor-pointer ${zoneBorderClass(pos, totalTeams, isPlayer)} ${
                  !isPlayer ? 'hover:bg-[#21262d]' : ''
                } ${idx < leagueTable.length - 1 ? 'border-b border-[#30363d]' : ''}`}
              >
                {/* Position change */}
                <PositionChange current={pos} previous={prevPos} />

                {/* Position + rank icon */}
                <div className="flex items-center gap-0.5">
                  <PositionRankIcon pos={pos} />
                  <span className={`text-xs font-bold ${isPlayer ? 'text-emerald-400' : pos <= 4 ? 'text-emerald-300' : pos <= 6 ? 'text-blue-300' : pos >= totalTeams - 2 ? 'text-red-300' : 'text-[#8b949e]'}`}>
                    {pos}
                  </span>
                </div>

                {/* Club Name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm flex-shrink-0">{club?.logo || '⚽'}</span>
                  <span className={`truncate text-xs font-medium ${isPlayer ? 'text-emerald-300' : 'text-[#c9d1d9]'}`}>
                    {club?.shortName || entry.clubName}
                  </span>
                  {isPlayer && (
                    <Badge className="text-[7px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold flex-shrink-0">
                      YOU
                    </Badge>
                  )}
                </div>

                {/* Played */}
                <span className="text-center text-[11px] text-[#8b949e]">{entry.played}</span>

                {/* Goal Difference */}
                <span className={`text-center text-[11px] font-medium ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]'}`}>
                  {gd > 0 ? '+' : ''}{gd}
                </span>

                {/* Points */}
                <span className={`text-center text-[11px] font-bold ${isPlayer ? 'text-emerald-300' : 'text-white'}`}>
                  {entry.points}
                </span>

                {/* Form dots + string */}
                <div className="flex items-center justify-center gap-1">
                  {form.length > 0 ? (
                    <>
                      <div className="flex items-center gap-0.5">
                        {form.map((r, i) => (
                          <FormDot key={i} result={r} />
                        ))}
                      </div>
                      <span className="text-[8px] text-[#484f58] font-mono">{form.join('')}</span>
                    </>
                  ) : (
                    <span className="text-[9px] text-[#484f58]">—</span>
                  )}
                </div>
              </div>

              {/* Expanded Detail Row */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={`px-3 py-3 ${isPlayer ? 'bg-emerald-500/5' : 'bg-[#21262d]'} border-b border-[#30363d]`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{club?.logo}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#c9d1d9]">{entry.clubName}</p>
                          <p className="text-[10px] text-[#8b949e] flex items-center gap-1">
                            <span className={formInfo.color}>{formInfo.text} form</span>
                            <span>•</span>
                            <span>{form.reduce((sum, r) => sum + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0)} pts from last {form.length || 5}</span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {[
                          { value: entry.played, label: 'P', color: 'text-[#c9d1d9]' },
                          { value: entry.won, label: 'W', color: 'text-emerald-400' },
                          { value: entry.drawn, label: 'D', color: 'text-amber-400' },
                          { value: entry.lost, label: 'L', color: 'text-red-400' },
                          { value: entry.goalsFor, label: 'GF', color: 'text-[#c9d1d9]' },
                          { value: entry.goalsAgainst, label: 'GA', color: 'text-[#8b949e]' },
                          { value: `${gd > 0 ? '+' : ''}${gd}`, label: 'GD', color: gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-[#8b949e]' },
                        ].map((stat, i) => (
                          <div key={i} className="bg-[#0d1117] rounded-md py-1.5 px-0.5">
                            <p className={`text-xs font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-[8px] text-[#484f58]">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Points progress bar */}
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-[#8b949e]">Points Progress</span>
                          <span className="text-[9px] text-[#8b949e] font-semibold">{entry.points} / {Math.round(maxPoints * 1.1)}</span>
                        </div>
                        <div className="h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isPlayer ? 'bg-emerald-500' : 'bg-slate-500'}`}
                            style={{ width: `${Math.min(100, (entry.points / Math.max(maxPoints * 1.1, 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="text-[#8b949e]">Win Rate</span>
                        <span className="text-[#c9d1d9] font-semibold">
                          {entry.played > 0 ? Math.round((entry.won / entry.played) * 100) : 0}%
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-[#8b949e]">Goals / Game</span>
                        <span className="text-[#c9d1d9] font-semibold">
                          {entry.played > 0 ? (entry.goalsFor / entry.played).toFixed(1) : '0.0'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats Leaderboard (Top Scorers / Top Assists) ──────────────────────────
function StatsLeaderboard({
  data,
  column,
  columnLabel,
  icon,
  title,
  currentClubId,
  playerName,
}: {
  data: { rank: number; name: string; clubId: string; clubName: string; goals: number; assists: number }[];
  column: 'goals' | 'assists';
  columnLabel: string;
  icon: React.ReactNode;
  title: string;
  currentClubId: string;
  playerName: string;
}) {
  const secondaryColumn = column === 'goals' ? 'assists' : 'goals';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[#30363d] flex items-center gap-2">
        {icon}
        <span className="text-sm font-bold text-[#c9d1d9]">{title}</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2rem_1fr_4rem_3rem] gap-0.5 px-3 py-2 text-[9px] text-[#8b949e] font-semibold uppercase tracking-wide items-center border-b border-[#30363d]">
        <span className="text-center">#</span>
        <span>Player</span>
        <span className="text-center">Club</span>
        <div className="flex gap-1 justify-center">
          <span className="text-center w-7">{column === 'goals' ? 'G' : 'A'}</span>
          <span className="text-center w-7">{column === 'goals' ? 'A' : 'G'}</span>
        </div>
      </div>

      {/* Rows */}
      {data.length === 0 ? (
        <div className="px-3 py-8 text-center">
          <p className="text-xs text-[#484f58]">No data yet</p>
          <p className="text-[10px] text-[#484f58] mt-1">Stats will appear as the season progresses</p>
        </div>
      ) : (
        data.map((entry, idx) => {
          const isPlayer = entry.name === playerName;
          return (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12, delay: idx * 0.03 }}
              className={`grid grid-cols-[2rem_1fr_4rem_3rem] gap-0.5 px-3 py-2.5 items-center text-sm transition-colors ${
                isPlayer
                  ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                  : 'border-l-2 border-l-transparent hover:bg-[#21262d]'
              } ${idx < data.length - 1 ? 'border-b border-[#30363d]/50' : ''}`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center">
                {entry.rank <= 3 ? (
                  <span className="text-xs font-black text-amber-400">{entry.rank}</span>
                ) : (
                  <span className="text-xs font-medium text-[#8b949e]">{entry.rank}</span>
                )}
              </div>

              {/* Player name */}
              <div className="min-w-0 flex items-center gap-1.5">
                <span className={`truncate text-xs font-medium ${isPlayer ? 'text-emerald-300' : 'text-[#c9d1d9]'}`}>
                  {entry.name}
                </span>
                {isPlayer && (
                  <Badge className="text-[7px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold flex-shrink-0">
                    YOU
                  </Badge>
                )}
              </div>

              {/* Club */}
              <span className="text-center text-[10px] text-[#8b949e] truncate">{entry.clubName}</span>

              {/* Goals + Assists */}
              <div className="flex gap-1 justify-center">
                <span className={`text-center text-[11px] font-bold w-7 ${
                  column === 'goals'
                    ? (entry.goals > 0 ? 'text-emerald-400' : 'text-[#484f58]')
                    : (entry.assists > 0 ? 'text-blue-400' : 'text-[#484f58]')
                }`}>
                  {column === 'goals' ? entry.goals : entry.assists}
                </span>
                <span className="text-center text-[11px] w-7 text-[#8b949e]">
                  {column === 'goals' ? entry.assists : entry.goals}
                </span>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// ─── Position indicator helper (used in summary card) ────────────────────────
function getPositionIndicator(pos: number, totalTeams: number) {
  if (pos <= 4) return { color: '#10b981', label: 'UCL' };
  if (pos <= 6) return { color: '#3b82f6', label: 'UEL' };
  if (pos >= totalTeams - 2) return { color: '#ef4444', label: 'REL' };
  return { color: '#94a3b8', label: '' };
}
