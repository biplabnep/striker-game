'use client';

import { useGameStore } from '@/store/gameStore';
import { getClubById } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, ArrowDown, Minus } from 'lucide-react';

export default function LeagueTable() {
  const gameState = useGameStore(state => state.gameState);

  if (!gameState) return null;

  const { leagueTable, currentClub, currentSeason } = gameState;

  const getPositionIndicator = (pos: number) => {
    if (pos <= 4) return { color: '#10b981', label: 'UCL', icon: <Trophy className="h-3 w-3" /> };
    if (pos <= 6) return { color: '#3b82f6', label: 'UEL', icon: <TrendingUp className="h-3 w-3" /> };
    if (pos >= leagueTable.length - 2) return { color: '#ef4444', label: 'REL', icon: <ArrowDown className="h-3 w-3" /> };
    return { color: '#94a3b8', label: '', icon: <Minus className="h-3 w-3" /> };
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">League Table</h2>
        <Badge variant="outline" className="border-slate-700 text-slate-400">
          Season {currentSeason}
        </Badge>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] px-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-500">Champions League</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-slate-500">Europa League</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-slate-500">Relegation</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-slate-900 rounded-t-xl border border-slate-800 border-b-0">
        <div className="grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_3.5rem_3rem] gap-1 px-3 py-2 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          <span>#</span>
          <span>Club</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">L</span>
          <span className="text-center">GD</span>
          <span className="text-center">Pts</span>
        </div>
      </div>

      {/* Table Body */}
      <div className="bg-slate-900/80 rounded-b-xl border border-slate-800 border-t-0 overflow-hidden">
        {leagueTable.map((entry, idx) => {
          const pos = idx + 1;
          const club = getClubById(entry.clubId);
          const isPlayer = entry.clubId === currentClub.id;
          const indicator = getPositionIndicator(pos);
          const gd = entry.goalsFor - entry.goalsAgainst;

          return (
            <div
              key={entry.clubId}
              className={`grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_3.5rem_3rem] gap-1 px-3 py-2.5 items-center text-sm transition-colors ${
                isPlayer
                  ? 'bg-emerald-900/20 border-l-2 border-emerald-500'
                  : 'border-l-2 border-transparent hover:bg-slate-800/50'
              } ${idx < leagueTable.length - 1 ? 'border-b border-slate-800/50' : ''}`}
            >
              {/* Position */}
              <div className="flex items-center gap-0.5">
                <span className={`text-xs font-bold ${isPlayer ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {pos}
                </span>
              </div>

              {/* Club Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm flex-shrink-0">{club?.logo || '⚽'}</span>
                <span className={`truncate text-xs font-medium ${isPlayer ? 'text-emerald-300' : 'text-slate-300'}`}>
                  {entry.clubName}
                </span>
                {pos <= 6 || pos >= leagueTable.length - 2 ? (
                  <span className="flex-shrink-0" style={{ color: indicator.color }}>
                    {indicator.icon}
                  </span>
                ) : null}
              </div>

              {/* Played */}
              <span className="text-center text-xs text-slate-400">{entry.played}</span>

              {/* Won */}
              <span className="text-center text-xs text-slate-300">{entry.won}</span>

              {/* Drawn */}
              <span className="text-center text-xs text-slate-400">{entry.drawn}</span>

              {/* Lost */}
              <span className="text-center text-xs text-slate-400">{entry.lost}</span>

              {/* Goal Difference */}
              <span className={`text-center text-xs font-medium ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                {gd > 0 ? '+' : ''}{gd}
              </span>

              {/* Points */}
              <span className={`text-center text-xs font-bold ${isPlayer ? 'text-emerald-300' : 'text-white'}`}>
                {entry.points}
              </span>
            </div>
          );
        })}
      </div>

      {/* Your Position Summary */}
      {(() => {
        const playerPos = leagueTable.findIndex(e => e.clubId === currentClub.id) + 1;
        const playerEntry = leagueTable.find(e => e.clubId === currentClub.id);
        if (!playerEntry) return null;
        const indicator = getPositionIndicator(playerPos);
        return (
          <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{currentClub.logo}</span>
                  <div>
                    <p className="font-bold text-sm">{currentClub.name}</p>
                    <p className="text-xs text-slate-400">
                      {playerPos}{playerPos === 1 ? 'st' : playerPos === 2 ? 'nd' : playerPos === 3 ? 'rd' : 'th'} in the league
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-400">{playerEntry.points}</p>
                  <p className="text-[10px] text-slate-500">points</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-700 text-center">
                <div>
                  <p className="text-sm font-bold text-slate-200">{playerEntry.played}</p>
                  <p className="text-[10px] text-slate-500">Played</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-400">{playerEntry.won}</p>
                  <p className="text-[10px] text-slate-500">Won</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-400">{playerEntry.drawn}</p>
                  <p className="text-[10px] text-slate-500">Drawn</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-400">{playerEntry.lost}</p>
                  <p className="text-[10px] text-slate-500">Lost</p>
                </div>
                <div>
                  <p className={`text-sm font-bold ${playerEntry.goalsFor - playerEntry.goalsAgainst > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {playerEntry.goalsFor - playerEntry.goalsAgainst > 0 ? '+' : ''}{playerEntry.goalsFor - playerEntry.goalsAgainst}
                  </p>
                  <p className="text-[10px] text-slate-500">GD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
