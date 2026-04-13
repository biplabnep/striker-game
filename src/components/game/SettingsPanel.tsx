'use client';

import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Save,
  User,
  Shield,
  Trash2,
  Check,
  Settings,
  Monitor,
  Gamepad2,
  Volume2,
  Database,
  Info,
  Upload,
  AlertTriangle,
  Download,
  Github,
  Twitter,
  Sparkles,
  Zap,
  Timer,
  GraduationCap,
  MessageCircle,
  Moon,
  Sun,
  Trophy,
  Bell,
  BellOff,
  ChevronRight,
  BarChart3,
  BookOpen,
  Award,
  Calendar,
  Clock,
  Lock,
  HardDrive,
  FileDown,
} from 'lucide-react';
import { getLeagueById, getSeasonMatchdays } from '@/lib/game/clubsData';
import { getSaveSlots, deleteSave as persistDeleteSave } from '@/services/persistenceService';
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// Constants
// ============================================================

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
  match: '\u26BD',
  transfer: '\uD83D\uDD04',
  event: '\u26A1',
  achievement: '\uD83C\uDFC6',
  social: '\uD83D\uDCF1',
  contract: '\uD83D\uDCDD',
  training: '\uD83D\uDCAA',
  career: 'Career',
};

// ============================================================
// Section Card Component
// ============================================================

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4, delay, ease: 'easeOut' } }}
    >
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
            <Icon className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#c9d1d9]">{title}</h3>
            {description && (
              <p className="text-xs text-[#8b949e] mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        <Separator className="bg-[#21262d]" />
        {children}
      </div>
    </motion.div>
  );
}

// ============================================================
// Setting Toggle Row Component
// ============================================================

function SettingToggle({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  icon?: React.ElementType;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {Icon && (
          <div className="flex items-center justify-center w-8 h-8 bg-[#21262d] rounded-lg flex-shrink-0">
            <Icon className="h-3.5 w-3.5 text-[#8b949e]" />
          </div>
        )}
        <div className="min-w-0">
          <p className={`text-sm text-[#c9d1d9] ${disabled ? 'opacity-50' : ''}`}>{label}</p>
          {description && (
            <p className={`text-xs text-[#8b949e] ${disabled ? 'opacity-50' : ''}`}>{description}</p>
          )}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-emerald-600 flex-shrink-0"
      />
    </div>
  );
}

// ============================================================
// Selectable Option Card
// ============================================================

function OptionCard({
  label,
  sublabel,
  selected,
  onClick,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg p-3 text-left transition-colors ${
        selected
          ? 'bg-emerald-600/15 border border-emerald-500/40'
          : 'bg-[#21262d] border border-transparent hover:bg-[#292e36] hover:border-[#30363d]'
      }`}
    >
      <p className={`text-sm font-medium ${selected ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
        {label}
      </p>
      {sublabel && (
        <p className={`text-[10px] mt-0.5 ${selected ? 'text-emerald-400/60' : 'text-[#484f58]'}`}>
          {sublabel}
        </p>
      )}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1 mt-2"
        >
          <div className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium">Active</span>
        </motion.div>
      )}
    </button>
  );
}

// ============================================================
// Quick Link Row Component
// ============================================================

function QuickLinkRow({
  icon: Icon,
  label,
  screen,
}: {
  icon: React.ElementType;
  label: string;
  screen: string;
}) {
  const setScreen = useGameStore(state => state.setScreen);
  return (
    <button
      type="button"
      onClick={() => setScreen(screen as Parameters<typeof setScreen>[0])}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#21262d] hover:bg-[#292e36] transition-colors group"
    >
      <div className="flex items-center justify-center w-9 h-9 bg-[#161b22] rounded-lg flex-shrink-0">
        <Icon className="h-4 w-4 text-emerald-400" />
      </div>
      <span className="text-sm text-[#c9d1d9] font-medium flex-1 text-left">{label}</span>
      <ChevronRight className="h-4 w-4 text-[#484f58] group-hover:text-[#8b949e] transition-colors" />
    </button>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SettingsPanel() {
  const gameState = useGameStore(state => state.gameState);
  const notifications = useGameStore(state => state.notifications);
  const markNotificationRead = useGameStore(state => state.markNotificationRead);
  const clearNotifications = useGameStore(state => state.clearNotifications);
  const setScreen = useGameStore(state => state.setScreen);
  const saveGame = useGameStore(state => state.saveGame);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ---- Display Settings State ----
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [animSpeed, setAnimSpeed] = useState<'off' | 'normal' | 'fast'>('normal');
  const [darkTheme, setDarkTheme] = useState(true);

  // ---- Gameplay Settings State ----
  const [simSpeed, setSimSpeed] = useState<'1x' | '2x' | '4x'>('1x');
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [tutorialTips, setTutorialTips] = useState(true);

  // ---- Audio Settings State ----
  const [sfxVolume, setSfxVolume] = useState([70]);
  const [musicVolume, setMusicVolume] = useState([50]);

  // ---- Notification Toggles State ----
  const [notifMatchReminders, setNotifMatchReminders] = useState(true);
  const [notifTransferNews, setNotifTransferNews] = useState(true);
  const [notifAchievementAlerts, setNotifAchievementAlerts] = useState(true);
  const [notifTrainingReminders, setNotifTrainingReminders] = useState(true);

  // ---- Notification section open state ----
  const [notifOpen, setNotifOpen] = useState(true);

  // ---- Handlers (all hooks before early return) ----

  const handleSave = useCallback(() => {
    const gs = useGameStore.getState().gameState;
    if (!gs) return;
    const { player, currentSeason, currentWeek } = gs;
    const slotName = `${player.name} - S${currentSeason}W${currentWeek}`;
    saveGame(slotName);
    setSaveMessage('Game saved successfully!');
    setTimeout(() => setSaveMessage(null), 3000);
  }, [saveGame]);

  const handleBackToMenu = useCallback(() => {
    if (
      window.confirm(
        'Are you sure you want to return to the main menu? Unsaved progress will be lost.'
      )
    ) {
      useGameStore.setState({
        gameState: null,
        screen: 'main_menu',
        notifications: [],
        scheduledTraining: null,
        matchAnimation: { isPlaying: false, events: [], currentMinute: 0 },
      });
    }
  }, []);

  const handleLoadGame = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data?.gameState?.player) {
            useGameStore.getState().loadCareer(data);
            setSaveMessage('Game loaded successfully!');
            setTimeout(() => setSaveMessage(null), 3000);
          } else {
            setSaveMessage('Invalid save file format.');
            setTimeout(() => setSaveMessage(null), 3000);
          }
        } catch {
          setSaveMessage('Failed to parse save file.');
          setTimeout(() => setSaveMessage(null), 3000);
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  }, []);

  const handleResetCareer = useCallback(() => {
    const gs = useGameStore.getState().gameState;
    if (!gs) return;
    const { player, currentClub, difficulty: diff } = gs;
    if (
      window.confirm(
        'WARNING: This will permanently reset your current career progress.\n\nAll current season data, training history, relationships, and achievements will be lost.\n\nAre you sure you want to continue?'
      )
    ) {
      useGameStore.getState().startNewCareer({
        name: player.name,
        nationality: player.nationality,
        position: player.position,
        clubId: currentClub.id,
        difficulty: diff,
      });
      setSaveMessage('Career has been reset!');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, []);

  const handleExportSave = useCallback(() => {
    try {
      const state = useGameStore.getState();
      if (!state.gameState) return;
      const { player, currentSeason, currentWeek } = state.gameState;
      const saveData = {
        id: 'export_' + Date.now(),
        name: `${player.name} - S${currentSeason}W${currentWeek}`,
        savedAt: new Date().toISOString(),
        playTime: state.gameState.playTime,
        gameState: state.gameState,
      };
      const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elite_striker_save_S${currentSeason}W${currentWeek}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSaveMessage('Save data exported!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to export save data.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, []);

  const handleExportAllData = useCallback(() => {
    try {
      const state = useGameStore.getState();
      const allData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        gameState: state.gameState,
        notifications: state.notifications,
        screen: state.screen,
      };
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elite_striker_all_data_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSaveMessage('All data exported successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to export data.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, []);

  const handleClearCache = useCallback(() => {
    try {
      // Clear non-essential cached data
      const keysToKeep = ['elite_striker_store'];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      setSaveMessage(`Cache cleared! (${keysToRemove.length} items removed)`);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to clear cache.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, []);

  const handleClearAllData = useCallback(() => {
    if (
      window.confirm(
        'WARNING: This will permanently delete ALL game data including:\n\n\u2022 All save files\n\u2022 All career progress\n\u2022 All settings\n\nThis action cannot be undone.\n\nAre you absolutely sure?'
      )
    ) {
      const slots = getSaveSlots();
      slots.forEach(slot => persistDeleteSave(slot.id));
      localStorage.removeItem('elite_striker_store');
      useGameStore.setState({
        gameState: null,
        screen: 'main_menu',
        notifications: [],
        scheduledTraining: null,
        matchAnimation: { isPlaying: false, events: [], currentMinute: 0 },
      });
      setSaveMessage('All data cleared.');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, []);

  // ---- Computed Values (before early return, computed safely) ----

  const _currentSeason = gameState?.currentSeason ?? 1;
  const _currentWeek = gameState?.currentWeek ?? 1;
  const _currentClubLeague = gameState?.currentClub?.league ?? '';

  const careerStartedDate = useMemo(() => {
    const createdAt = gameState?.createdAt;
    if (createdAt) {
      try {
        return new Date(createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } catch {
        // fall through
      }
    }
    return 'Today';
  }, [gameState?.createdAt]);

  const playtimeHours = useMemo(() => {
    const pt = gameState?.playTime || 0;
    const mins = Math.floor(pt / 60);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }, [gameState?.playTime]);

  if (!gameState) return null;

  const { player, currentClub, currentSeason, currentWeek, difficulty } = gameState;
  const leagueInfo = getLeagueById(currentClub.league);
  const unreadCount = notifications.filter(n => !n.read).length;

  // ---- Helpers ----

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

  const animSpeedOptions = [
    { value: 'off' as const, label: 'Off', sublabel: 'No animations' },
    { value: 'normal' as const, label: 'Normal', sublabel: 'Default speed' },
    { value: 'fast' as const, label: 'Fast', sublabel: 'Quick transitions' },
  ];

  const simSpeedOptions = [
    { value: '1x' as const, label: '1x', sublabel: 'Real-time' },
    { value: '2x' as const, label: '2x', sublabel: 'Double speed' },
    { value: '4x' as const, label: '4x', sublabel: 'Turbo' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* ===== Header with Logo/Name/Version ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }}
        className="flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScreen('dashboard')}
          className="text-[#8b949e] hover:text-white hover:bg-[#21262d]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 bg-[#161b22] border border-[#30363d] rounded-lg">
              <Settings className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#c9d1d9] tracking-tight">Settings</h1>
              <p className="text-[10px] text-[#484f58] font-medium tracking-wider uppercase">Elite Striker v1.0</p>
            </div>
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-600 text-white text-xs px-2 py-0.5">
            {unreadCount} unread
          </Badge>
        )}
      </motion.div>

      {/* ===== Player Profile Summary Card ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.08, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-[#8b949e] uppercase tracking-wide">Player Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#21262d] flex items-center justify-center text-xl border border-[#30363d]">
              {currentClub.logo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[#c9d1d9] truncate">{player.name}</p>
              <p className="text-xs text-[#8b949e]">{currentClub.name} &bull; {player.position}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-black text-emerald-400">{player.overall}</p>
              <p className="text-[10px] text-[#484f58] font-medium">OVR</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="flex items-center gap-2 text-xs text-[#8b949e] bg-[#21262d] rounded-lg px-2.5 py-2">
              <Calendar className="h-3 w-3 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-[#484f58]">Season</p>
                <p className="font-semibold text-[#c9d1d9]">S{currentSeason} Wk {currentWeek}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b949e] bg-[#21262d] rounded-lg px-2.5 py-2">
              <Clock className="h-3 w-3 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-[#484f58]">Playtime</p>
                <p className="font-semibold text-[#c9d1d9]">{playtimeHours}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b949e] bg-[#21262d] rounded-lg px-2.5 py-2">
              <BookOpen className="h-3 w-3 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-[#484f58]">Started</p>
                <p className="font-semibold text-[#c9d1d9] text-[10px]">{careerStartedDate}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {leagueInfo && (
              <div className="flex-1 flex items-center gap-2 text-xs text-[#8b949e] bg-[#21262d] rounded-lg px-2.5 py-2">
                <Trophy className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{leagueInfo.emoji} {leagueInfo.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs bg-[#21262d] rounded-lg px-2.5 py-2 flex-shrink-0">
              <Shield className={`h-3 w-3 ${diffInfo.color} flex-shrink-0`} />
              <span className={diffInfo.color}>{diffInfo.label}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Quick Links Section ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.12, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <ChevronRight className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Quick Links</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">Jump to key sections</p>
            </div>
          </div>
          <Separator className="bg-[#21262d]" />
          <QuickLinkRow icon={Award} label="View Achievements" screen="achievements_system" />
          <QuickLinkRow icon={BarChart3} label="View Statistics" screen="career_statistics" />
          <QuickLinkRow icon={BookOpen} label="Career Journal" screen="career_milestones" />
        </div>
      </motion.div>

      {/* ===== Theme Settings ===== */}
      <SettingsCard
        icon={Monitor}
        title="Theme"
        description="Customize the look and feel"
        delay={0.16}
      >
        <SettingToggle
          icon={darkTheme ? Moon : Sun}
          label={darkTheme ? 'Dark Theme' : 'Light Theme'}
          description={darkTheme ? 'Currently using dark color scheme' : 'Currently using light color scheme'}
          checked={darkTheme}
          onCheckedChange={setDarkTheme}
        />
      </SettingsCard>

      {/* ===== Display Settings ===== */}
      <SettingsCard
        icon={Sparkles}
        title="Display"
        description="Control visual animations and layout"
        delay={0.2}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] font-medium">Animation Speed</span>
          </div>
          <div className="flex gap-2">
            {animSpeedOptions.map(opt => (
              <OptionCard
                key={opt.value}
                label={opt.label}
                sublabel={opt.sublabel}
                selected={animSpeed === opt.value}
                onClick={() => {
                  setAnimSpeed(opt.value);
                  setAnimationsEnabled(opt.value !== 'off');
                }}
              />
            ))}
          </div>
        </div>

        <Separator className="bg-[#21262d]" />

        <SettingToggle
          icon={Gamepad2}
          label="Compact Mode"
          description="Smaller text and tighter spacing"
          checked={compactMode}
          onCheckedChange={setCompactMode}
        />
      </SettingsCard>

      {/* ===== Gameplay Settings ===== */}
      <SettingsCard
        icon={Gamepad2}
        title="Gameplay"
        description="Match simulation and gameplay preferences"
        delay={0.26}
      >
        {/* Simulation Speed */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-[#8b949e]" />
            <span className="text-xs text-[#8b949e] font-medium">Match Simulation Speed</span>
          </div>
          <div className="flex gap-2">
            {simSpeedOptions.map(opt => (
              <OptionCard
                key={opt.value}
                label={opt.label}
                sublabel={opt.sublabel}
                selected={simSpeed === opt.value}
                onClick={() => setSimSpeed(opt.value)}
              />
            ))}
          </div>
        </div>

        <Separator className="bg-[#21262d]" />

        <SettingToggle
          icon={Timer}
          label="Auto-Advance Week"
          description="Skip to next action automatically"
          checked={autoAdvance}
          onCheckedChange={setAutoAdvance}
        />

        <Separator className="bg-[#21262d]" />

        <SettingToggle
          icon={GraduationCap}
          label="Tutorial Tips"
          description="Show helpful tips and guidance"
          checked={tutorialTips}
          onCheckedChange={setTutorialTips}
        />
      </SettingsCard>

      {/* ===== Notifications Settings ===== */}
      <SettingsCard
        icon={Bell}
        title="Notifications"
        description="Control which notifications you receive"
        delay={0.32}
      >
        <SettingToggle
          icon={Bell}
          label="Match Reminders"
          description="Get notified before upcoming matches"
          checked={notifMatchReminders}
          onCheckedChange={setNotifMatchReminders}
        />

        <Separator className="bg-[#21262d]" />

        <SettingToggle
          icon={Shield}
          label="Transfer News"
          description="Updates on transfer rumors and deals"
          checked={notifTransferNews}
          onCheckedChange={setNotifTransferNews}
        />

        <Separator className="bg-[#21262d]" />

        <SettingToggle
          icon={Trophy}
          label="Achievement Alerts"
          description="Notifications when you unlock achievements"
          checked={notifAchievementAlerts}
          onCheckedChange={setNotifAchievementAlerts}
        />

        <Separator className="bg-[#21262d]" />

        <SettingToggle
          icon={Sparkles}
          label="Training Reminders"
          description="Reminders to complete training sessions"
          checked={notifTrainingReminders}
          onCheckedChange={setNotifTrainingReminders}
        />
      </SettingsCard>

      {/* ===== Audio Settings ===== */}
      <SettingsCard
        icon={Volume2}
        title="Audio"
        description="Sound effects and music volume"
        delay={0.38}
      >
        <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400">Sound effects and music coming in a future update.</p>
        </div>
        <div className="space-y-3 opacity-60">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#c9d1d9]">Sound Effects</p>
              <span className="text-xs text-[#8b949e]">{sfxVolume[0]}%</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${sfxVolume[0]}%` }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#c9d1d9]">Music</p>
              <span className="text-xs text-[#8b949e]">{musicVolume[0]}%</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${musicVolume[0]}%` }}
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* ===== Save & Data ===== */}
      <SettingsCard
        icon={Database}
        title="Save & Data"
        description="Manage your career saves and data"
        delay={0.44}
      >
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleSave}
            className="h-11 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg text-xs gap-2"
          >
            <Save className="h-4 w-4" />
            Save Game
          </Button>
          <Button
            onClick={handleLoadGame}
            variant="outline"
            className="h-11 border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] hover:text-white font-medium rounded-lg text-xs gap-2"
          >
            <Upload className="h-4 w-4" />
            Load Game
          </Button>
          <Button
            onClick={handleExportSave}
            variant="outline"
            className="h-11 border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] hover:text-white font-medium rounded-lg text-xs gap-2"
          >
            <Download className="h-4 w-4" />
            Export Save
          </Button>
          <Button
            onClick={handleBackToMenu}
            variant="outline"
            className="h-11 border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] hover:text-white font-medium rounded-lg text-xs gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Main Menu
          </Button>
        </div>

        <Separator className="bg-[#21262d]" />

        {/* Danger Zone */}
        <div className="space-y-2">
          <p className="text-[10px] text-[#8b949e] font-semibold uppercase tracking-widest">Danger Zone</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleResetCareer}
              variant="outline"
              className="h-10 border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 hover:border-red-800/60 font-medium rounded-lg text-xs gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Reset Career
            </Button>
            <Button
              onClick={handleClearAllData}
              variant="outline"
              className="h-10 border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 hover:border-red-800/60 font-medium rounded-lg text-xs gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All Data
            </Button>
          </div>
        </div>

        {/* Save message toast */}
        <AnimatePresence>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-emerald-400 text-center py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
            >
              {saveMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsCard>

      {/* ===== Data & Privacy ===== */}
      <SettingsCard
        icon={Lock}
        title="Data & Privacy"
        description="Manage cached data and exports"
        delay={0.5}
      >
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleClearCache}
            variant="outline"
            className="h-11 border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] hover:text-white font-medium rounded-lg text-xs gap-2"
          >
            <HardDrive className="h-4 w-4" />
            Clear Cache
          </Button>
          <Button
            onClick={handleExportAllData}
            variant="outline"
            className="h-11 border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] hover:text-white font-medium rounded-lg text-xs gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export All Data
          </Button>
        </div>
      </SettingsCard>

      {/* ===== Notifications Feed ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.56, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#1c2129] transition-colors focus:outline-none"
          >
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0">
              <Bell className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-[#c9d1d9]">Notification Feed</span>
              <p className="text-xs text-[#8b949e] mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'You\'re all caught up'}
              </p>
            </div>
            {notifications.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-[#30363d] text-[#8b949e] px-1.5 py-0">
                {notifications.length}
              </Badge>
            )}
          </button>

          <AnimatePresence initial={false}>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <Separator className="bg-[#30363d]" />
                <div className="px-4 pt-2 pb-3">
                  {notifications.length > 0 && (
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearNotifications}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 px-2"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    </div>
                  )}
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-[#8b949e]">
                      <BellOff className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No notifications</p>
                      <p className="text-xs text-[#484f58]">Notifications will appear here as you progress</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-80">
                      <div className="space-y-2 pr-1">
                        {notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                              notification.read
                                ? 'bg-[#21262d] opacity-60'
                                : 'bg-[#21262d] hover:bg-[#292e36]'
                            }`}
                            onClick={() => markNotificationRead(notification.id)}
                          >
                            <div className={`w-1.5 h-1.5 rounded-sm mt-2 flex-shrink-0 ${notificationTypeColors[notification.type] || 'bg-slate-600'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs">
                                  {notificationTypeIcons[notification.type] || '\uD83D\uDCCC'}
                                </span>
                                <span className={`text-xs font-semibold ${notification.read ? 'text-[#8b949e]' : 'text-[#c9d1d9]'}`}>
                                  {notification.title}
                                </span>
                                {notification.actionRequired && !notification.read && (
                                  <Badge className="bg-amber-600 text-white text-[8px] px-1 py-0">
                                    ACTION
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-xs mt-0.5 ${notification.read ? 'text-[#484f58]' : 'text-[#8b949e]'}`}>
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-[10px] text-[#484f58]">{formatTimestamp(notification.timestamp)}</span>
                              {!notification.read && (
                                <Check className="h-3 w-3 text-[#8b949e] hover:text-emerald-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ===== About ===== */}
      <SettingsCard
        icon={Info}
        title="About"
        description="Elite Striker v1.0"
        delay={0.62}
      >
        <div className="space-y-3">
          <div className="text-center py-3">
            <h4 className="text-base font-bold text-[#c9d1d9]">Elite Striker v1.0</h4>
            <p className="text-xs text-emerald-400 mt-1">Football Career Simulator</p>
          </div>

          <Separator className="bg-[#21262d]" />

          <p className="text-xs text-[#8b949e] leading-relaxed text-center">
            Elite Striker is a football career simulation game where you develop your
            player from a youth academy prospect to a world-class superstar. Train hard,
            make smart career decisions, and lead your team to glory.
          </p>

          <Separator className="bg-[#21262d]" />

          <div className="space-y-2">
            <p className="text-xs text-[#8b949e] font-medium">Built With</p>
            <div className="flex flex-wrap gap-1.5">
              {['Next.js', 'TypeScript', 'Zustand', 'Tailwind CSS'].map(tech => (
                <Badge
                  key={tech}
                  variant="outline"
                  className="border-[#30363d] text-emerald-400 text-[10px] px-2 py-0.5"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-[#21262d]" />

          <div className="flex items-center justify-center gap-2 text-xs text-[#484f58]">
            <span>43 Components</span>
            <span className="w-1 h-1 rounded-sm bg-[#30363d]" />
            <span>33 Screens</span>
          </div>

          <Separator className="bg-[#21262d]" />

          <div className="space-y-1.5">
            <p className="text-xs text-[#8b949e] font-medium">Community</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg text-xs gap-1.5"
                onClick={() => window.open('https://github.com', '_blank')}
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg text-xs gap-1.5"
                onClick={() => window.open('https://twitter.com', '_blank')}
              >
                <Twitter className="h-3.5 w-3.5" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-lg text-xs gap-1.5"
                disabled
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Discord
              </Button>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Bottom spacing for nav */}
      <div className="h-20" />
    </div>
  );
}
