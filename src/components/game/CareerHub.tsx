'use client';

import { useGameStore } from '@/store/gameStore';
import { formatCurrency, getOverallColor } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Calendar, TrendingUp, Award } from 'lucide-react';

export default function CareerHub() {
  const gameState = useGameStore(state => state.gameState);
  const setScreen = useGameStore(state => state.setScreen);

  if (!gameState) return null;

  const { player, currentClub, seasons, currentSeason, careerStats } = gameState;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold">Career Hub</h2>

      {/* Career Summary */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl border-2" style={{ borderColor: getOverallColor(player.overall), color: getOverallColor(player.overall) }}>
              {player.overall}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{player.name}</h3>
              <p className="text-sm text-slate-400">{player.nationality} • {player.position}</p>
              <p className="text-xs text-slate-500">{currentClub.logo} {currentClub.name} • Age {player.age}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-400">{careerStats.totalGoals}</p>
              <p className="text-[10px] text-slate-500">Goals</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-400">{careerStats.totalAssists}</p>
              <p className="text-[10px] text-slate-500">Assists</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{careerStats.totalAppearances}</p>
              <p className="text-[10px] text-slate-500">Apps</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-300">{careerStats.seasonsPlayed}</p>
              <p className="text-[10px] text-slate-500">Seasons</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Season History */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
            <Calendar className="h-3 w-3" /> Season History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {seasons.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">No completed seasons yet</p>
          ) : (
            <div className="space-y-2">
              {seasons.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Season {s.number}</p>
                    <p className="text-xs text-slate-500">Position: {s.leaguePosition}{s.leaguePosition === 1 ? 'st' : s.leaguePosition === 2 ? 'nd' : s.leaguePosition === 3 ? 'rd' : 'th'}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-slate-300">{s.playerStats.goals}G {s.playerStats.assists}A</p>
                    <p className="text-slate-500">{s.playerStats.appearances} apps • {s.playerStats.averageRating > 0 ? s.playerStats.averageRating.toFixed(1) : '-'} avg</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
            <Award className="h-3 w-3" /> Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-2">
            {gameState.achievements.map(a => (
              <div key={a.id} className={`flex items-center gap-2 p-2 rounded-lg ${a.unlocked ? 'bg-emerald-900/20 border border-emerald-800/50' : 'bg-slate-800/50 border border-slate-800'}`}>
                <span className="text-lg">{a.unlocked ? a.icon : '🔒'}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${a.unlocked ? 'text-emerald-300' : 'text-slate-500'}`}>{a.name}</p>
                  <p className="text-[10px] text-slate-600 truncate">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trophies */}
      {careerStats.trophies.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
              <Trophy className="h-3 w-3" /> Trophies
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {careerStats.trophies.map((t, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <span>🏆</span>
                <span className="text-sm text-amber-300">{t.name}</span>
                <span className="text-xs text-slate-500 ml-auto">S{t.season}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Attributes Link */}
      <button
        onClick={() => setScreen('analytics')}
        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800 transition-all"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold">View Full Analytics</span>
        </div>
        <span className="text-slate-500">→</span>
      </button>
    </div>
  );
}
