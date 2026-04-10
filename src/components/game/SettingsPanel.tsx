'use client';

import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Save,
  Home,
  Trophy,
  User,
  Shield,
  Trash2,
  Check,
} from 'lucide-react';
import { getLeagueById } from '@/lib/game/clubsData';
import { useState } from 'react';

const notificationTypeColors: Record<string, string> = {
  match: 'bg-emerald-600',
  transfer: 'bg-purple-600',
  event: 'bg-amber-600',
  achievement: 'bg-yellow-600',
  social: 'bg-pink-600',
  contract: 'bg-blue-600',
  training: 'bg-cyan-600',
  career: 'bg-slate-600',
};

const notificationTypeIcons: Record<string, string> = {
  match: '⚽',
  transfer: '🔄',
  event: '⚡',
  achievement: '🏆',
  social: '📱',
  contract: '📝',
  training: '🏋️',
  career: 'Career',
};

export default function SettingsPanel() {
  const gameState = useGameStore(state => state.gameState);
  const notifications = useGameStore(state => state.notifications);
  const markNotificationRead = useGameStore(state => state.markNotificationRead);
  const clearNotifications = useGameStore(state => state.clearNotifications);
  const setScreen = useGameStore(state => state.setScreen);
  const saveGame = useGameStore(state => state.saveGame);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!gameState) return null;

  const { player, currentClub, currentSeason, currentWeek, difficulty } = gameState;
  const leagueInfo = getLeagueById(currentClub.league);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSave = () => {
    const slotName = `${player.name} - S${currentSeason}W${currentWeek}`;
    saveGame(slotName);
    setSaveMessage('Game saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleBackToMenu = () => {
    if (window.confirm('Are you sure you want to return to the main menu? Unsaved progress will be lost.')) {
      useGameStore.setState({
        gameState: null,
        screen: 'main_menu',
        notifications: [],
        scheduledTraining: null,
        matchAnimation: { isPlaying: false, events: [], currentMinute: 0 },
      });
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const difficultyConfig: Record<string, { label: string; color: string; description: string }> = {
    easy: { label: 'Easy', color: 'text-emerald-400', description: 'Higher potential, more forgiving' },
    normal: { label: 'Normal', color: 'text-amber-400', description: 'Balanced challenge' },
    hard: { label: 'Hard', color: 'text-red-400', description: 'Lower potential, tougher challenges' },
  };

  const diffInfo = difficultyConfig[difficulty] || difficultyConfig.normal;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScreen('dashboard')}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Settings & Notifications</h1>
          <p className="text-xs text-slate-500">Manage your game and view alerts</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-600 text-white text-xs px-2">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {/* Current Game Info */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <User className="h-3 w-3" />
            Current Career
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                {currentClub.logo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{player.name}</p>
                <p className="text-xs text-slate-400">{currentClub.name} • {player.position}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Season {currentSeason}</p>
                <p className="text-xs text-slate-500">Week {currentWeek}/38</p>
              </div>
            </div>
            {leagueInfo && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 rounded-lg p-2">
                <Trophy className="h-3 w-3 text-emerald-400" />
                <span>{leagueInfo.emoji} {leagueInfo.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs bg-slate-800/50 rounded-lg p-2">
              <Shield className={`h-3 w-3 ${diffInfo.color}`} />
              <span className={diffInfo.color}>{diffInfo.label}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{diffInfo.description}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Game */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Game
            </Button>
            <Button
              onClick={handleBackToMenu}
              variant="outline"
              className="h-11 border-red-800/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 font-semibold rounded-xl"
            >
              <Home className="mr-2 h-4 w-4" />
              Main Menu
            </Button>
          </div>
          {saveMessage && (
            <p className="text-xs text-emerald-400 mt-2 text-center">{saveMessage}</p>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2 pt-3 px-4 flex-row items-center justify-between">
          <CardTitle className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Bell className="h-3 w-3" />
            Notifications
            {notifications.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 ml-1">
                {notifications.length}
              </Badge>
            )}
          </CardTitle>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
              <BellOff className="h-8 w-8 opacity-30" />
              <p className="text-sm">No notifications</p>
              <p className="text-xs text-slate-600">Notifications will appear here as you progress</p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="space-y-2 pr-1">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                      notification.read
                        ? 'bg-slate-800/30 opacity-60'
                        : 'bg-slate-800/80 hover:bg-slate-800'
                    }`}
                    onClick={() => markNotificationRead(notification.id)}
                  >
                    {/* Type indicator */}
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${notificationTypeColors[notification.type] || 'bg-slate-600'}`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {notificationTypeIcons[notification.type] || '📌'}
                        </span>
                        <span className={`text-xs font-semibold ${notification.read ? 'text-slate-500' : 'text-slate-200'}`}>
                          {notification.title}
                        </span>
                        {notification.actionRequired && !notification.read && (
                          <Badge className="bg-amber-600 text-white text-[8px] px-1 py-0">
                            ACTION
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${notification.read ? 'text-slate-600' : 'text-slate-400'}`}>
                        {notification.message}
                      </p>
                    </div>

                    {/* Timestamp & read status */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-slate-600">{formatTimestamp(notification.timestamp)}</span>
                      {!notification.read && (
                        <Check className="h-3 w-3 text-slate-500 hover:text-emerald-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
