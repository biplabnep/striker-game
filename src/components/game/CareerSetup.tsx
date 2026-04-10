'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Position, POSITION_GROUPS } from '@/lib/game/types';
import { NATIONALITIES } from '@/lib/game/playerData';
import { ENRICHED_CLUBS, LEAGUES } from '@/lib/game/clubsData';
import { getOverallColor, getPositionColor } from '@/lib/game/gameUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const positions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

export default function CareerSetup() {
  const setScreen = useGameStore(state => state.setScreen);
  const startNewCareer = useGameStore(state => state.startNewCareer);

  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('England');
  const [position, setPosition] = useState<Position>('ST');
  const [clubId, setClubId] = useState('arsenal');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  // Collapsible leagues - expand the league of the selected club by default
  const selectedClubLeague = useMemo(() => ENRICHED_CLUBS.find(c => c.id === clubId)?.league, [clubId]);
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set([selectedClubLeague || 'premier_league']));

  const toggleLeague = (leagueId: string) => {
    setExpandedLeagues(prev => {
      const next = new Set(prev);
      if (next.has(leagueId)) next.delete(leagueId); else next.add(leagueId);
      return next;
    });
  };

  const handleStart = () => {
    startNewCareer({ name, nationality, position, clubId, difficulty });
  };

  const selectedClub = ENRICHED_CLUBS.find(c => c.id === clubId);

  return (
    <div className="min-h-screen p-4 pb-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setScreen('main_menu')} className="text-slate-400">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Career</h1>
      </div>

      {/* Name */}
      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Player Name</CardTitle></CardHeader>
        <CardContent>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Leave blank for random name"
            className="bg-slate-800 border-slate-700 text-white"
          />
        </CardContent>
      </Card>

      {/* Nationality */}
      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Nationality</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {NATIONALITIES.map(n => (
              <button
                key={n.name}
                onClick={() => setNationality(n.name)}
                className={`flex flex-col items-center p-2 rounded-lg text-xs transition-all ${
                  nationality === n.name
                    ? 'bg-emerald-600/30 border border-emerald-500'
                    : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className="text-lg">{n.flag}</span>
                <span className="text-slate-300 truncate w-full text-center">{n.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Position */}
      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Position</CardTitle></CardHeader>
        <CardContent>
          {Object.entries(POSITION_GROUPS).map(([group, posList]) => (
            <div key={group} className="mb-3">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">{group}</p>
              <div className="flex flex-wrap gap-2">
                {posList.map(pos => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                      position === pos
                        ? 'text-white shadow-lg'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    }`}
                    style={position === pos ? { backgroundColor: getPositionColor(pos) } : {}}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Club */}
      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Starting Club</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {LEAGUES.map(league => {
            const clubs = ENRICHED_CLUBS.filter(c => c.league === league.id);
            const isExpanded = expandedLeagues.has(league.id);
            const isSelected = selectedClubLeague === league.id;
            return (
              <div key={league.id} className="rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleLeague(league.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-all ${
                    isSelected ? 'bg-emerald-900/20' : 'bg-slate-800/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{league.emoji}</span>
                    <span className="font-medium text-slate-300">{league.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700 text-slate-500">
                      {clubs.length}
                    </Badge>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {clubs.map(club => (
                      <button
                        key={club.id}
                        onClick={() => setClubId(club.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all text-left ${
                          clubId === club.id
                            ? 'bg-emerald-600/20 border border-emerald-500'
                            : 'bg-slate-800 border border-slate-700/50 hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-base">{club.logo}</span>
                        <span className="text-slate-200 text-xs truncate">{club.name}</span>
                        <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 border-slate-600">
                          {club.squadQuality}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Difficulty */}
      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Difficulty</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'normal', 'hard'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`p-3 rounded-lg text-sm font-semibold capitalize transition-all ${
                  difficulty === d
                    ? d === 'easy' ? 'bg-green-600/30 border border-green-500 text-green-300'
                      : d === 'normal' ? 'bg-amber-600/30 border border-amber-500 text-amber-300'
                      : 'bg-red-600/30 border border-red-500 text-red-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {selectedClub && (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-4xl">{selectedClub.logo}</div>
            <div className="flex-1">
              <p className="font-bold text-lg">{name || 'Random Name'}</p>
              <p className="text-slate-400 text-sm">{nationality} • {position} • {selectedClub.name}</p>
              <p className="text-slate-500 text-xs">Academy Prospect • Age 14</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </CardContent>
        </Card>
      )}

      {/* Start Button */}
      <Button
        onClick={handleStart}
        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-xl shadow-lg shadow-emerald-900/50"
      >
        Start Career
      </Button>
    </div>
  );
}
