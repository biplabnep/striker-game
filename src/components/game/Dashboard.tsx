'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getOverallColor, getFormLabel, getMoraleLabel, formatCurrency, getSeasonWeekDescription, getMatchRatingLabel, getPositionColor } from '@/lib/game/gameUtils';
import { NATIONALITIES } from '@/lib/game/playerData';
import { getClubById, LEAGUES, getLeagueById } from '@/lib/game/clubsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, Zap, Heart, Activity, Trophy, ArrowRight, Bell, Star, Swords, Table, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import WeeklySummary from '@/components/game/WeeklySummary';

export default function Dashboard() {
  const gameState = useGameStore(state => state.gameState);
  const advanceWeek = useGameStore(state => state.advanceWeek);
  const setScreen = useGameStore(state => state.setScreen);
  const notifications = useGameStore(state => state.notifications);

  const [showSummary, setShowSummary] = useState(false);

  const handleAdvanceWeek = () => {
    advanceWeek();
    setShowSummary(true);
  };

  if (!gameState) return null;

  const { player, currentClub, currentWeek, currentSeason, recentResults, upcomingFixtures, activeEvents, leagueTable, trainingAvailable } = gameState;
  const nationInfo = NATIONALITIES.find(n => n.name === player.nationality);
  const overallColor = getOverallColor(player.overall);
  const posColor = getPositionColor(player.position);

  // Find next fixture
  const nextFixture = upcomingFixtures.find(f => !f.played && (f.homeClubId === currentClub.id || f.awayClubId === currentClub.id));
  const nextOpponent = nextFixture ? getClubById(nextFixture.homeClubId === currentClub.id ? nextFixture.awayClubId : nextFixture.homeClubId) : null;
  const isHome = nextFixture?.homeClubId === currentClub.id;

  // League position
  const leaguePos = leagueTable.findIndex(e => e.clubId === currentClub.id) + 1;
  const leagueInfo = getLeagueById(currentClub.league);

  // Unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingEvents = activeEvents.length;

  // Season progress
  const seasonProgress = Math.min(100, Math.round((currentWeek / 38) * 100));
  const posSuffix = leaguePos === 1 ? 'st' : leaguePos === 2 ? 'nd' : leaguePos === 3 ? 'rd' : 'th';

  return (
    <>
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header with notification bell */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => setScreen('settings')}
          className="relative p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Player Profile Card */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, ${currentClub.primaryColor}, transparent)` }} />
        <CardContent className="p-4 relative">
          <div className="flex items-center gap-4">
            {/* Overall Rating */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-2" style={{ borderColor: overallColor, color: overallColor }}>
                {player.overall}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">OVR</span>
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{player.name}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{nationInfo?.flag}</span>
                <Badge variant="outline" className="text-xs font-bold" style={{ color: posColor, borderColor: posColor }}>{player.position}</Badge>
                <span className="text-xs">Age {player.age}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base">{currentClub.logo}</span>
                <span className="text-sm text-slate-300">{currentClub.name}</span>
                <Badge variant="outline" className="text-[10px] border-slate-600 capitalize">{player.squadStatus.replace('_', ' ')}</Badge>
              </div>
            </div>

            {/* Potential */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border border-slate-600 text-slate-400">
                {player.potential}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">POT</span>
            </div>
          </div>

          {/* Key Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatBar icon={<Activity className="h-3 w-3" />} label="Form" value={player.form} max={10} color="#10b981" />
            <StatBar icon={<Heart className="h-3 w-3" />} label="Morale" value={player.morale} max={100} color="#f59e0b" />
            <StatBar icon={<Zap className="h-3 w-3" />} label="Fitness" value={player.fitness} max={100} color="#3b82f6" />
          </div>
        </CardContent>
      </Card>

      {/* Season Info Bar + Progress */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>Season {currentSeason} • Week {currentWeek}/38</span>
              <span className="text-slate-600">•</span>
              <span>{getSeasonWeekDescription(currentWeek)}</span>
            </div>
            <div className="flex items-center gap-2">
              {pendingEvents > 0 && (
                <Badge className="bg-amber-600 text-white text-[10px] px-1.5">
                  {pendingEvents} event{pendingEvents > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          {/* Season Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Season Progress</span>
              <span className="text-emerald-400 font-semibold">{seasonProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400 transition-all duration-500"
                style={{ width: `${seasonProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* League Table Quick Link Card */}
      <Card
        className="bg-slate-900 border-slate-800 cursor-pointer hover:bg-slate-800/80 transition-colors"
        onClick={() => setScreen('league_table')}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                <Table className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  {leagueInfo ? `${leagueInfo.emoji} ${leagueInfo.name}` : 'League Table'}
                </p>
                <p className="text-sm font-semibold">
                  <span className="text-emerald-400">{leaguePos}{posSuffix}</span>
                  <span className="text-slate-400"> in the league</span>
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </div>
        </CardContent>
      </Card>

      {/* Next Fixture */}
      {nextOpponent && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase tracking-wider">Next Match</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isHome ? currentClub.logo : nextOpponent.logo}</span>
                <div>
                  <p className="font-semibold text-sm">{isHome ? currentClub.name : nextOpponent.name}</p>
                  <p className="text-xs text-slate-500">vs</p>
                  <p className="text-sm text-slate-300">{isHome ? nextOpponent.name : currentClub.name}</p>
                </div>
                <span className="text-2xl">{isHome ? nextOpponent.logo : currentClub.logo}</span>
              </div>
              <Badge variant="outline" className="text-xs border-slate-600">
                {isHome ? 'HOME' : 'AWAY'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions - Enhanced */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleAdvanceWeek}
          className="h-14 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:shadow-emerald-800/40"
        >
          <ArrowRight className="mr-2 h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm leading-tight">Advance Week</span>
            <span className="text-[9px] opacity-70 font-normal">Week {currentWeek} → {currentWeek + 1}</span>
          </div>
        </Button>
        <Button
          onClick={() => setScreen('match_day')}
          variant="outline"
          className="h-14 border-amber-700/50 bg-gradient-to-r from-amber-900/20 to-amber-800/10 text-amber-300 hover:from-amber-900/30 hover:to-amber-800/20 font-semibold rounded-xl transition-all"
        >
          <Swords className="mr-2 h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-sm leading-tight">Match Day</span>
            <span className="text-[9px] opacity-70 font-normal">Play next match</span>
          </div>
        </Button>
      </div>

      {/* Season Stats Summary */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
          <CardTitle className="text-xs text-slate-500 uppercase tracking-wider">Season Stats</CardTitle>
          <button
            onClick={() => setScreen('league_table')}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Trophy className="h-3 w-3" />
            <span>{leaguePos}{posSuffix}</span>
            <span className="text-emerald-600">→</span>
          </button>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-400">{player.seasonStats.goals}</p>
              <p className="text-[10px] text-slate-500">Goals</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-400">{player.seasonStats.assists}</p>
              <p className="text-[10px] text-slate-500">Assists</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400">{player.seasonStats.appearances}</p>
              <p className="text-[10px] text-slate-500">Apps</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-300">{player.seasonStats.averageRating > 0 ? player.seasonStats.averageRating.toFixed(1) : '-'}</p>
              <p className="text-[10px] text-slate-500">Avg Rating</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-500">Market Value</span>
            <span className="text-sm font-semibold text-emerald-400">{formatCurrency(player.marketValue, 'M')}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">Weekly Wage</span>
            <span className="text-sm text-slate-300">{formatCurrency(player.contract.weeklyWage, 'K')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs text-slate-500 uppercase tracking-wider">Recent Results</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {recentResults.slice(0, 3).map((result, i) => {
              const playerWon = (result.homeClub.id === currentClub.id && result.homeScore > result.awayScore) ||
                               (result.awayClub.id === currentClub.id && result.awayScore > result.homeScore);
              const playerDrew = result.homeScore === result.awayScore;
              return (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className={`text-[10px] px-1.5 ${playerWon ? 'bg-emerald-700' : playerDrew ? 'bg-amber-700' : 'bg-red-700'}`}>
                      {playerWon ? 'W' : playerDrew ? 'D' : 'L'}
                    </Badge>
                    <span className="text-slate-300">{result.homeClub.shortName || result.homeClub.name.slice(0,3)} {result.homeScore}-{result.awayScore} {result.awayClub.shortName || result.awayClub.name.slice(0,3)}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    result.playerRating >= 7 ? 'border-emerald-500 text-emerald-400' :
                    result.playerRating >= 6 ? 'border-amber-500 text-amber-400' :
                    'border-red-500 text-red-400'
                  }`}>
                    {result.playerRating.toFixed(1)}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Pending Events */}
      {activeEvents.length > 0 && (
        <Button
          onClick={() => setScreen('events')}
          variant="outline"
          className="w-full h-12 border-amber-700 text-amber-300 hover:bg-amber-900/30 font-semibold rounded-xl"
        >
          <Bell className="mr-2 h-4 w-4" />
          {activeEvents.length} Pending Event{activeEvents.length > 1 ? 's' : ''}
        </Button>
      )}

      {/* Training Available */}
      {trainingAvailable > 0 && (
        <Button
          onClick={() => setScreen('training')}
          variant="outline"
          className="w-full h-10 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          {trainingAvailable} Training Session{trainingAvailable > 1 ? 's' : ''} Available
        </Button>
      )}
    </div>

    {/* Weekly Summary Modal */}
    {showSummary && <WeeklySummary onClose={() => setShowSummary(false)} />}
    </>
  );
}

function StatBar({ icon, label, value, max, color }: { icon: React.ReactNode; label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1 text-slate-400">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{value}{max === 10 ? '/10' : ''}</span>
    </div>
  );
}
