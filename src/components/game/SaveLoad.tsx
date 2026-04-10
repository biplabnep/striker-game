'use client';

import { useState, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { SaveSlot } from '@/lib/game/types';
import { getSaveSlots, hasSaveSlots } from '@/services/persistenceService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Trash2, Clock, Play, HardDrive } from 'lucide-react';

export default function SaveLoad() {
  const setScreen = useGameStore(state => state.setScreen);
  const gameState = useGameStore(state => state.gameState);
  const loadCareer = useGameStore(state => state.loadCareer);
  const deleteCareer = useGameStore(state => state.deleteCareer);
  const saveGame = useGameStore(state => state.saveGame);

  const [savesVersion, setSavesVersion] = useState(0);
  const [mode, setMode] = useState<'load' | 'save'>('load');

  const saves = useMemo(() => getSaveSlots(), [savesVersion]);

  const handleSave = (slotName: string) => {
    saveGame(slotName);
    setSavesVersion(v => v + 1);
  };

  const handleLoad = (save: SaveSlot) => {
    loadCareer(save);
  };

  const handleDelete = (saveId: string) => {
    deleteCareer(saveId);
    setSavesVersion(v => v + 1);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setScreen('main_menu')} className="text-slate-400">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Save / Load</h1>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('load')}
          className={`flex-1 p-3 rounded-xl text-sm font-semibold transition-all ${
            mode === 'load'
              ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300'
              : 'bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800'
          }`}
        >
          <HardDrive className="h-4 w-4 inline mr-2" />
          Load Game
        </button>
        <button
          onClick={() => setMode('save')}
          className={`flex-1 p-3 rounded-xl text-sm font-semibold transition-all ${
            mode === 'save'
              ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300'
              : 'bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800'
          }`}
        >
          <Save className="h-4 w-4 inline mr-2" />
          Save Game
        </button>
      </div>

      {/* Save Mode */}
      {mode === 'save' && gameState && (
        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-slate-500 uppercase">Current Game</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{gameState.currentClub.logo}</span>
                <div className="flex-1">
                  <p className="font-semibold">{gameState.player.name}</p>
                  <p className="text-xs text-slate-400">
                    {gameState.currentClub.name} • Season {gameState.currentSeason} • Week {gameState.currentWeek}
                  </p>
                </div>
                <Badge variant="outline" className="border-emerald-700 text-emerald-400">
                  OVR {gameState.player.overall}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => handleSave(`${gameState.player.name} - Season ${gameState.currentSeason}`)}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-xl shadow-lg"
          >
            <Save className="mr-2 h-5 w-5" />
            Quick Save
          </Button>
        </div>
      )}

      {mode === 'save' && !gameState && (
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">No active game to save</p>
            <p className="text-xs text-slate-700 mt-1">Start a new career first</p>
          </CardContent>
        </Card>
      )}

      {/* Load Mode */}
      {mode === 'load' && (
        <div className="space-y-3">
          {saves.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800/50">
              <CardContent className="p-8 text-center">
                <HardDrive className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500">No saved games found</p>
                <p className="text-xs text-slate-700 mt-1">Start a new career to create your first save</p>
              </CardContent>
            </Card>
          ) : (
            saves.map(save => (
              <Card key={save.id} className="bg-slate-900 border-slate-800 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{save.gameState.currentClub.logo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{save.name}</p>
                      <p className="text-xs text-slate-400">
                        {save.gameState.player.name} • {save.gameState.currentClub.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-slate-600" />
                        <span className="text-[10px] text-slate-600">{formatDate(save.savedAt)}</span>
                        <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500">
                          Season {save.gameState.currentSeason}
                        </Badge>
                      </div>
                    </div>
                    <Badge className="bg-emerald-800 text-emerald-300 text-xs">
                      {save.gameState.player.overall} OVR
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3 text-center text-xs">
                    <div className="bg-slate-800 rounded-lg p-1.5">
                      <p className="font-bold text-emerald-400">{save.gameState.player.seasonStats.goals}</p>
                      <p className="text-slate-600">Goals</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-1.5">
                      <p className="font-bold text-blue-400">{save.gameState.player.seasonStats.assists}</p>
                      <p className="text-slate-600">Assists</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-1.5">
                      <p className="font-bold text-amber-400">{save.gameState.player.seasonStats.appearances}</p>
                      <p className="text-slate-600">Apps</p>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-1.5">
                      <p className="font-bold text-slate-300">{save.gameState.player.age}</p>
                      <p className="text-slate-600">Age</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleLoad(save)}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white h-9 text-xs"
                    >
                      <Play className="mr-1 h-3 w-3" /> Load
                    </Button>
                    <Button
                      onClick={() => handleDelete(save.id)}
                      variant="outline"
                      className="border-red-800 text-red-400 hover:bg-red-900/30 h-9 text-xs"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
