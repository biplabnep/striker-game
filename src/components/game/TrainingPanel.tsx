'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { TrainingType, TrainingSession, PlayerAttributes } from '@/lib/game/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Sword, Shield, Zap, Brain, Heart, TrendingUp, Clock } from 'lucide-react';

const trainingTypes: { type: TrainingType; icon: React.ReactNode; label: string; description: string; color: string; focusAttrs: (keyof PlayerAttributes)[] }[] = [
  { type: 'attacking', icon: <Sword className="h-5 w-5" />, label: 'Attacking', description: 'Shooting & dribbling', color: '#ef4444', focusAttrs: ['shooting', 'dribbling'] },
  { type: 'defensive', icon: <Shield className="h-5 w-5" />, label: 'Defensive', description: 'Defending & positioning', color: '#3b82f6', focusAttrs: ['defending'] },
  { type: 'physical', icon: <Zap className="h-5 w-5" />, label: 'Physical', description: 'Pace & strength', color: '#f59e0b', focusAttrs: ['pace', 'physical'] },
  { type: 'technical', icon: <Dumbbell className="h-5 w-5" />, label: 'Technical', description: 'Passing & ball control', color: '#10b981', focusAttrs: ['passing', 'dribbling'] },
  { type: 'tactical', icon: <Brain className="h-5 w-5" />, label: 'Tactical', description: 'Game awareness', color: '#8b5cf6', focusAttrs: ['passing', 'defending'] },
  { type: 'recovery', icon: <Heart className="h-5 w-5" />, label: 'Recovery', description: 'Rest & recuperation', color: '#ec4899', focusAttrs: [] },
];

const intensities = [
  { value: 30, label: 'Light', color: '#10b981' },
  { value: 60, label: 'Moderate', color: '#f59e0b' },
  { value: 90, label: 'Intense', color: '#ef4444' },
];

export default function TrainingPanel() {
  const gameState = useGameStore(state => state.gameState);
  const scheduleTraining = useGameStore(state => state.scheduleTraining);
  const advanceWeek = useGameStore(state => state.advanceWeek);
  const scheduledTraining = useGameStore(state => state.scheduledTraining);

  const [selectedType, setSelectedType] = useState<TrainingType | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState(60);
  const [focusAttr, setFocusAttr] = useState<keyof PlayerAttributes | undefined>(undefined);

  if (!gameState) return null;

  const { player, trainingAvailable, trainingHistory } = gameState;

  const handleSchedule = () => {
    if (!selectedType) return;
    scheduleTraining({
      type: selectedType,
      intensity: selectedIntensity,
      focusAttribute: focusAttr,
      completedAt: Date.now(),
    });
  };

  const attrLabels: Record<keyof PlayerAttributes, string> = {
    pace: 'Pace', shooting: 'Shooting', passing: 'Passing',
    dribbling: 'Dribbling', defending: 'Defending', physical: 'Physical',
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Training</h2>
        <Badge variant="outline" className="border-emerald-600 text-emerald-400">
          {trainingAvailable} session{trainingAvailable !== 1 ? 's' : ''} left
        </Badge>
      </div>

      {/* Current Attributes */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-slate-500 uppercase">Current Attributes</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {(Object.keys(attrLabels) as (keyof PlayerAttributes)[]).map(attr => (
            <div key={attr} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-16">{attrLabels[attr]}</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${player.attributes[attr]}%`,
                    backgroundColor: player.attributes[attr] >= 75 ? '#10b981' : player.attributes[attr] >= 60 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <span className="text-xs font-bold w-8 text-right">{player.attributes[attr]}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Training Type Selection */}
      <div className="grid grid-cols-2 gap-2">
        {trainingTypes.map(t => (
          <button
            key={t.type}
            onClick={() => { setSelectedType(t.type); setFocusAttr(t.focusAttrs[0]); }}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              selectedType === t.type
                ? 'bg-slate-800 border-2'
                : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'
            }`}
            style={selectedType === t.type ? { borderColor: t.color } : {}}
          >
            <div style={{ color: t.color }}>{t.icon}</div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{t.label}</p>
              <p className="text-[10px] text-slate-500">{t.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Intensity Selection */}
      {selectedType && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase">Intensity</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-2">
              {intensities.map(i => (
                <button
                  key={i.value}
                  onClick={() => setSelectedIntensity(i.value)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    selectedIntensity === i.value
                      ? 'border-2 bg-slate-800'
                      : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800'
                  }`}
                  style={selectedIntensity === i.value ? { borderColor: i.color } : {}}
                >
                  <p className="text-sm font-semibold" style={{ color: i.color }}>{i.label}</p>
                  <p className="text-[10px] text-slate-500">{i.value}%</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Focus Attribute */}
      {selectedType && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase">Focus Attribute</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(attrLabels) as (keyof PlayerAttributes)[]).map(attr => (
                <button
                  key={attr}
                  onClick={() => setFocusAttr(attr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    focusAttr === attr
                      ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {attrLabels[attr]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Button */}
      {scheduledTraining ? (
        <Card className="bg-emerald-900/20 border-emerald-800">
          <CardContent className="p-4 text-center">
            <p className="text-emerald-300 text-sm font-semibold">Training Scheduled!</p>
            <p className="text-emerald-400/70 text-xs mt-1">Will be applied when you advance the week</p>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={handleSchedule}
          disabled={!selectedType || trainingAvailable <= 0}
          className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-semibold"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Schedule Training
        </Button>
      )}

      {/* Advance Week */}
      <Button onClick={() => advanceWeek()} variant="outline" className="w-full border-slate-700 text-slate-300 rounded-xl">
        <Clock className="mr-2 h-4 w-4" />
        Advance Week
      </Button>
    </div>
  );
}
