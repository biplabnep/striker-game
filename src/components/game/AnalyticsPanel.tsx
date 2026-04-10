'use client';

import { useGameStore } from '@/store/gameStore';
import { PlayerAttributes } from '@/lib/game/types';
import { getAttributeCategory, getOverallColor, getPositionColor } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export default function AnalyticsPanel() {
  const gameState = useGameStore(state => state.gameState);

  if (!gameState) return null;

  const { player, recentResults } = gameState;

  const attrLabels: Record<keyof PlayerAttributes, string> = {
    pace: 'Pace', shooting: 'Shooting', passing: 'Passing',
    dribbling: 'Dribbling', defending: 'Defending', physical: 'Physical',
  };

  const recentRatings = recentResults.slice(0, 10).map(r => r.playerRating).filter(r => r > 0);
  const maxRating = Math.max(...recentRatings, 8);
  const minRating = Math.min(...recentRatings, 4);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-emerald-400" />
        Analytics
      </h2>

      {/* Overall & Potential */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl border-2" style={{ borderColor: getOverallColor(player.overall), color: getOverallColor(player.overall) }}>
                {player.overall}
              </div>
              <p className="text-xs text-slate-500 mt-1">Overall</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-0.5 h-8 bg-slate-700" />
              <span className="text-xs text-slate-600">→</span>
              <div className="w-0.5 h-8 bg-slate-700" />
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-slate-600 text-slate-400">
                {player.potential}
              </div>
              <p className="text-xs text-slate-500 mt-1">Potential</p>
            </div>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-slate-500">Room to grow: <span className="text-emerald-400 font-semibold">{player.potential - player.overall}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Attributes */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-slate-500 uppercase">Attributes</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-3">
          {(Object.keys(attrLabels) as (keyof PlayerAttributes)[]).map(attr => {
            const val = player.attributes[attr];
            const cat = getAttributeCategory(val);
            return (
              <div key={attr} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{attrLabels[attr]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: cat.color }}>{cat.label}</span>
                    <span className="text-sm font-bold" style={{ color: cat.color }}>{val}</span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${val}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Match Rating History */}
      {recentRatings.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
              <Activity className="h-3 w-3" /> Match Rating Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-end gap-1 h-32">
              {recentRatings.map((rating, i) => {
                const height = ((rating - 3) / (11 - 3)) * 100;
                const color = rating >= 7.5 ? '#10b981' : rating >= 6.0 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-500">{rating.toFixed(1)}</span>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{ height: `${Math.max(height, 5)}%`, backgroundColor: color }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-600">
              <span>Latest</span>
              <span>Oldest</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Season Stats */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-slate-500 uppercase">Season Stats</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-800 rounded-lg p-2">
              <p className="text-lg font-bold text-emerald-400">{player.seasonStats.goals}</p>
              <p className="text-[10px] text-slate-500">Goals</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2">
              <p className="text-lg font-bold text-blue-400">{player.seasonStats.assists}</p>
              <p className="text-[10px] text-slate-500">Assists</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2">
              <p className="text-lg font-bold text-amber-400">{player.seasonStats.appearances}</p>
              <p className="text-[10px] text-slate-500">Apps</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2">
              <p className="text-lg font-bold text-slate-300">{player.seasonStats.starts}</p>
              <p className="text-[10px] text-slate-500">Starts</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2">
              <p className="text-lg font-bold text-slate-300">{player.seasonStats.cleanSheets}</p>
              <p className="text-[10px] text-slate-500">Clean Sheets</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2">
              <p className="text-lg font-bold text-red-400">{player.seasonStats.yellowCards + player.seasonStats.redCards}</p>
              <p className="text-[10px] text-slate-500">Cards</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
