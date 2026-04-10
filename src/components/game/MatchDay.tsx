'use client';

import { useGameStore } from '@/store/gameStore';
import { getClubById } from '@/lib/game/clubsData';
import { getMatchRatingLabel } from '@/lib/game/gameUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, FastForward, ArrowRight, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MatchDay() {
  const gameState = useGameStore(state => state.gameState);
  const advanceWeek = useGameStore(state => state.advanceWeek);
  const playNextMatch = useGameStore(state => state.playNextMatch);
  const matchAnimation = useGameStore(state => state.matchAnimation);
  const setScreen = useGameStore(state => state.setScreen);

  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState(gameState?.recentResults[0] || null);

  if (!gameState) return null;

  const { player, currentClub, currentWeek, upcomingFixtures } = gameState;
  const nextFixture = upcomingFixtures.find(f => !f.played && (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id));
  const opponent = nextFixture ? getClubById(nextFixture.homeClubId === currentClub.id ? nextFixture.awayClubId : nextFixture.homeClubId) : null;
  const isHome = nextFixture?.homeClubId === currentClub.id;

  const handlePlayMatch = () => {
    advanceWeek();
    const latest = useGameStore.getState().gameState?.recentResults[0];
    if (latest) {
      setLastResult(latest);
      setShowResult(true);
    }
  };

  const handleSimulate = () => {
    playNextMatch();
    const latest = useGameStore.getState().gameState?.recentResults[0];
    if (latest) {
      setLastResult(latest);
      setShowResult(true);
    }
  };

  // Match result display
  if (showResult && lastResult) {
    const won = (lastResult.homeClub.id === currentClub.id && lastResult.homeScore > lastResult.awayScore) ||
                (lastResult.awayClub.id === currentClub.id && lastResult.awayScore > lastResult.homeScore);
    const drew = lastResult.homeScore === lastResult.awayScore;

    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <div className={`h-2 ${won ? 'bg-emerald-500' : drew ? 'bg-amber-500' : 'bg-red-500'}`} />
          <CardContent className="p-6 text-center">
            <p className="text-sm text-slate-400 mb-4">{won ? 'VICTORY!' : drew ? 'DRAW' : 'DEFEAT'}</p>
            
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{lastResult.homeClub.logo}</span>
                <span className="text-xs text-slate-400">{lastResult.homeClub.shortName || lastResult.homeClub.name.slice(0,3)}</span>
              </div>
              <div className="text-4xl font-black text-white">
                {lastResult.homeScore} - {lastResult.awayScore}
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{lastResult.awayClub.logo}</span>
                <span className="text-xs text-slate-400">{lastResult.awayClub.shortName || lastResult.awayClub.name.slice(0,3)}</span>
              </div>
            </div>

            {/* Player Performance */}
            <div className="bg-slate-800 rounded-xl p-4 space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Your Performance</p>
              <div className="text-5xl font-black" style={{ color: lastResult.playerRating >= 7 ? '#10b981' : lastResult.playerRating >= 6 ? '#f59e0b' : '#ef4444' }}>
                {lastResult.playerRating.toFixed(1)}
              </div>
              <p className="text-sm text-slate-400">{getMatchRatingLabel(lastResult.playerRating)}</p>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
                <div>
                  <p className="text-lg font-bold">{lastResult.playerGoals}</p>
                  <p className="text-[10px] text-slate-500">Goals</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{lastResult.playerAssists}</p>
                  <p className="text-[10px] text-slate-500">Assists</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{lastResult.playerMinutesPlayed}&apos;</p>
                  <p className="text-[10px] text-slate-500">Minutes</p>
                </div>
              </div>
            </div>

            {/* Match Events */}
            {lastResult.events.length > 0 && (
              <div className="mt-4 text-left">
                <p className="text-xs text-slate-500 mb-2">Match Events</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {lastResult.events.filter(e => e.type === 'goal' || e.type === 'red_card' || e.type === 'yellow_card').map((event, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-1">
                      <span className="text-slate-600 w-8">{event.minute}&apos;</span>
                      <span>{event.type === 'goal' ? '⚽' : event.type === 'red_card' ? '🟥' : '🟨'}</span>
                      <span className="text-slate-300">{event.detail || event.playerName || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={() => { setShowResult(false); setScreen('dashboard'); }} className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 rounded-xl font-semibold">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Pre-match screen
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold">Match Day</h2>

      {opponent && nextFixture ? (
        <>
          {/* Match Preview */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">{currentClub.logo}</span>
                  <span className="font-semibold text-sm">{currentClub.name}</span>
                  <Badge variant="outline" className="text-[10px] border-slate-600">{currentClub.squadQuality} OVR</Badge>
                </div>
                <div className="text-slate-500 font-bold text-lg">VS</div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">{opponent.logo}</span>
                  <span className="font-semibold text-sm">{opponent.name}</span>
                  <Badge variant="outline" className="text-[10px] border-slate-600">{opponent.squadQuality} OVR</Badge>
                </div>
              </div>
              <div className="text-center mt-4">
                <Badge variant="outline" className="text-xs border-slate-600">
                  {isHome ? '🏠 HOME' : '✈️ AWAY'} • Week {currentWeek}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Player Status */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs text-slate-500 uppercase">Your Status</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div><span className="text-emerald-400 font-bold">{player.fitness}%</span><br/><span className="text-slate-500">Fitness</span></div>
                <div><span className="font-bold" style={{ color: player.form >= 7 ? '#10b981' : player.form >= 5 ? '#f59e0b' : '#ef4444' }}>{player.form.toFixed(1)}</span><br/><span className="text-slate-500">Form</span></div>
                <div><span className="text-amber-400 font-bold capitalize">{player.squadStatus.replace('_', ' ')}</span><br/><span className="text-slate-500">Status</span></div>
              </div>
              {player.injuryWeeks > 0 && (
                <div className="mt-2 bg-red-900/30 rounded-lg p-2 text-center text-red-400 text-xs">
                  🏥 Injured — {player.injuryWeeks} week{player.injuryWeeks > 1 ? 's' : ''} remaining
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handlePlayMatch} className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 rounded-xl shadow-lg">
              <Play className="mr-2 h-5 w-5" />
              Play Match
            </Button>
          </div>
        </>
      ) : (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No match this week</p>
            <p className="text-xs text-slate-600 mt-1">Advance the week to continue</p>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => advanceWeek()} variant="outline" className="w-full border-slate-700 text-slate-300 rounded-xl">
        <ArrowRight className="mr-2 h-4 w-4" />
        Advance Week (No Match)
      </Button>
    </div>
  );
}
