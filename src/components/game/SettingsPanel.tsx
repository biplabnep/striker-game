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
  ShieldAlert,
} from 'lucide-react';
import { getLeagueById, getSeasonMatchdays } from '@/lib/game/clubsData';
import { getSaveSlots, deleteSave as persistDeleteSave } from '@/services/persistenceService';
import { useState, useCallback, useMemo, useEffect } from 'react';
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

const notificationTypeBarColors: Record<string, string> = {
  match: '#10B981',
  transfer: '#F59E0B',
  achievement: '#A855F7',
  event: '#06B6D4',
  social: '#EC4899',
  contract: '#3B82F6',
  training: '#06B6D4',
  career: '#64748B',
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

// Anim preview keyframes
const ANIM_PREVIEW_STYLE = `
@keyframes slide-off {
  0% { left: 4px; }
  100% { left: 4px; }
}
@keyframes slide-normal {
  0% { left: 4px; }
  50% { left: 48px; }
  100% { left: 4px; }
}
@keyframes slide-fast {
  0% { left: 4px; }
  25% { left: 48px; }
  50% { left: 4px; }
  75% { left: 48px; }
  100% { left: 4px; }
}
@keyframes pulse-danger-border {
  0%, 100% { border-color: rgba(239, 68, 68, 0.3); }
  50% { border-color: rgba(239, 68, 68, 0.7); }
}
`;

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
// Animation Speed Preview Card
// ============================================================

function AnimSpeedPreviewCard({
  label,
  sublabel,
  selected,
  onClick,
  animName,
  barColor,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
  animName: string;
  barColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg p-3 text-left transition-colors ${
        selected
          ? 'bg-emerald-600/15 border-2 border-emerald-500/50'
          : 'bg-[#21262d] border-2 border-transparent hover:bg-[#292e36] hover:border-[#30363d]'
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
      {/* Mini animation preview bar */}
      <div className="mt-2 h-2.5 bg-[#161b22] rounded-sm overflow-hidden relative">
        <div
          className="absolute top-0 bottom-0 w-3 rounded-sm"
          style={{
            background: selected ? barColor : '#484f58',
            animation: `${animName} 2s ease-in-out infinite`,
          }}
        />
      </div>
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1 mt-1.5"
        >
          <div className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium">Active</span>
        </motion.div>
      )}
    </button>
  );
}

// ============================================================
// Selectable Option Card (for sim speed)
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
// Storage Usage Hook
// ============================================================

function useStorageUsage() {
  const [usageKB, setUsageKB] = useState(0);

  useEffect(() => {
    const calc = () => {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key);
          if (val) total += val.length * 2; // UTF-16 = 2 bytes per char
        }
      }
      setUsageKB(Math.round(total / 1024));
    };
    calc();
    const id = setInterval(calc, 5000);
    return () => clearInterval(id);
  }, []);

  const quotaKB = 5 * 1024; // 5MB
  const pct = Math.min((usageKB / quotaKB) * 100, 100);
  const barColor = pct < 50 ? '#10B981' : pct < 75 ? '#F59E0B' : '#EF4444';

  return { usageKB, quotaKB, pct, barColor };
}

// ============================================================
// SVG Helper Functions (pure, no hooks)
// ============================================================

function describeArc(cx: number, cy: number, r: number, ir: number, startDeg: number, endDeg: number): string {
  if (endDeg - startDeg >= 359.9) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} L ${cx + ir} ${cy} A ${ir} ${ir} 0 1 0 ${cx - ir} ${cy} A ${ir} ${ir} 0 1 0 ${cx + ir} ${cy} Z`;
  }
  const startRad = ((startDeg - 90) * Math.PI) / 180;
  const endRad = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const ix1 = cx + ir * Math.cos(endRad);
  const iy1 = cy + ir * Math.sin(endRad);
  const ix2 = cx + ir * Math.cos(startRad);
  const iy2 = cy + ir * Math.sin(startRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
}

function radarPointsStr(cx: number, cy: number, r: number, values: number[]): string {
  return values.map((v, i) => {
    const angle = ((i * 360) / values.length - 90) * (Math.PI / 180);
    const dist = (v / 100) * r;
    return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
  }).join(' ');
}

function radarAxisEndpoints(cx: number, cy: number, r: number, count: number): string {
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const angle = ((i * 360) / count - 90) * (Math.PI / 180);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function radarGridPolygons(cx: number, cy: number, maxR: number, levels: number, count: number): string[] {
  const polys: string[] = [];
  for (let lvl = 1; lvl <= levels; lvl++) {
    const r = (lvl / levels) * maxR;
    polys.push(radarAxisEndpoints(cx, cy, r, count));
  }
  return polys;
}

function areaChartLinePath(data: number[], w: number, h: number, padX: number, padY: number, maxVal: number): string {
  if (data.length === 0) return '';
  const stepX = (w - padX * 2) / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => {
    const x = padX + i * stepX;
    const y = padY + (h - padY * 2) - (v / maxVal) * (h - padY * 2);
    return `${x},${y}`;
  });
  return pts.join(' ');
}

function areaChartFillPath(data: number[], w: number, h: number, padX: number, padY: number, maxVal: number): string {
  if (data.length === 0) return '';
  const line = areaChartLinePath(data, w, h, padX, padY, maxVal);
  const lastX = padX + (data.length - 1) * ((w - padX * 2) / Math.max(data.length - 1, 1));
  return `${line} ${lastX},${h - padY} ${padX},${h - padY}`;
}

function semiCircleArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const startRad = ((startDeg - 90) * Math.PI) / 180;
  const endRad = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function ringArc(cx: number, cy: number, r: number, pctVal: number): string {
  if (pctVal <= 0) return '';
  if (pctVal >= 100) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
  }
  const endDeg = (pctVal / 100) * 360;
  const startRad = -Math.PI / 2;
  const endRad = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
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

  // ---- Storage usage ----
  const { usageKB, quotaKB, pct, barColor } = useStorageUsage();

  // ---- Notification distribution ----
  const notifDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notifications) {
      counts[n.type] = (counts[n.type] || 0) + 1;
    }
    return counts;
  }, [notifications]);

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

  // ---- SVG Visualization Data (plain reduce / direct assignment) ----

  // Safe access to stats with ?? fallback
  const cs = player.careerStats ?? { totalAppearances: 0, totalGoals: 0, totalAssists: 0, totalCleanSheets: 0, trophies: [], seasonsPlayed: 0 };
  const ss = player.seasonStats ?? { appearances: 0, starts: 0, minutesPlayed: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, averageRating: 0, manOfTheMatch: 0, injuries: 0 };
  const playerMorale = player.morale ?? 70;

  // 1. Notification Distribution Donut segments via .reduce()
  const donutTypes = ['match', 'transfer', 'achievement', 'event'];
  const donutColors = ['#10B981', '#F59E0B', '#A855F7', '#06B6D4'];
  const donutFiltered = notifications.filter(n => donutTypes.includes(n.type));
  const donutTotal = donutFiltered.length;
  const donutCounts = donutFiltered.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});
  const donutSegments = donutTypes.reduce<Array<{ seg: string; startPct: number; endPct: number; path: string; color: string; count: number }>>((arcs, type, i) => {
    const count = donutTotal > 0 ? (donutCounts[type] || 0) : 0;
    const fraction = donutTotal > 0 ? count / donutTotal : 0;
    const prevEnd = arcs.length > 0 ? arcs[arcs.length - 1].endPct : 0;
    const startPct = prevEnd;
    const endPct = startPct + fraction;
    const path = fraction > 0.001 ? describeArc(120, 120, 80, 50, startPct * 360, endPct * 360) : '';
    arcs.push({ seg: type, startPct, endPct, path, color: donutColors[i], count });
    return arcs;
  }, []);

  // 2. Gameplay Statistics Radar values
  const gpRadarVals = [
    Math.min(((cs.totalGoals ?? 0) / Math.max(cs.totalAppearances ?? 1, 1)) * 300, 100),
    Math.min(((cs.totalGoals ?? 0) / 20) * 100, 100),
    Math.min(((cs.totalAssists ?? 0) / 15) * 100, 100),
    Math.min(((cs.totalCleanSheets ?? 0) / 10) * 100, 100),
    Math.min((ss.averageRating ?? 0) * 10, 100),
  ];
  const gpRadarLabels = ['Win Rate', 'Goals', 'Assists', 'Clean Shts', 'Rating'];
  const gpRadarShape = radarPointsStr(120, 120, 80, gpRadarVals);
  const gpRadarAxes = radarAxisEndpoints(120, 120, 80, 5);
  const gpRadarGrids = radarGridPolygons(120, 120, 80, 4, 5);

  // 3. Career Progress Timeline milestones
  const careerMilestones = [
    { label: 'Start', achieved: true },
    { label: 'Debut', achieved: (cs.totalAppearances ?? 0) > 0 },
    { label: '1st Goal', achieved: (cs.totalGoals ?? 0) > 0 },
    { label: '1st Assist', achieved: (cs.totalAssists ?? 0) > 0 },
    { label: 'Clean Sheet', achieved: (cs.totalCleanSheets ?? 0) > 0 },
    { label: 'Trophy', achieved: (cs.trophies ?? []).length > 0 },
    { label: '50 Apps', achieved: (cs.totalAppearances ?? 0) >= 50 },
    { label: '100 Apps', achieved: (cs.totalAppearances ?? 0) >= 100 },
  ];

  // 4. Weekly Activity Heatmap (7 days × 4 weeks)
  const hmDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const heatmapGrid = (() => {
    const grid: number[][] = [];
    const now = Date.now();
    for (let week = 3; week >= 0; week--) {
      const row: number[] = [];
      for (let day = 0; day < 7; day++) {
        const dayStart = now - (week * 7 + (6 - day)) * 86400000;
        const dayEnd = dayStart + 86400000;
        const cnt = notifications.reduce((c, n) => {
          const ts = new Date(n.timestamp).getTime();
          return c + (ts >= dayStart && ts < dayEnd ? 1 : 0);
        }, 0);
        row.push(cnt);
      }
      grid.push(row);
    }
    return grid;
  })();
  const hmMaxVal = Math.max(...heatmapGrid.flat(), 1);

  // 5. Settings Completeness Ring
  const settingsTogglesArr = [animationsEnabled, compactMode, darkTheme, autoAdvance, tutorialTips, notifMatchReminders, notifTransferNews, notifAchievementAlerts, notifTrainingReminders];
  const settingsTotalCount = settingsTogglesArr.length;
  const settingsEnabledCount = settingsTogglesArr.reduce((c, v) => c + (v ? 1 : 0), 0);
  const settingsPct = Math.round((settingsEnabledCount / settingsTotalCount) * 100);
  const settingsRingD = ringArc(120, 120, 80, settingsPct);

  // 6. Audio Levels
  const audioSfx = sfxVolume[0];
  const audioMus = musicVolume[0];

  // 7. Difficulty Impact Gauge
  const diffScore = difficulty === 'easy' ? 30 : difficulty === 'hard' ? 90 : 60;
  const gaugeNeedleAngle = (-90 + (diffScore / 100) * 180) * (Math.PI / 180);
  const gaugeNx = 120 + 68 * Math.cos(gaugeNeedleAngle);
  const gaugeNy = 120 + 68 * Math.sin(gaugeNeedleAngle);
  const gaugeBgArc = semiCircleArc(120, 120, 80, 0, 180);
  const gaugeFillArc = semiCircleArc(120, 120, 80, 0, (diffScore / 100) * 180);

  // 8. Season Time Investment Bars
  const investBars = [
    { label: 'Training', value: Math.min((ss.appearances ?? 0) * 3 + 20, 100), color: '#10B981' },
    { label: 'Matches', value: Math.min((ss.appearances ?? 0) * 8, 100), color: '#3B82F6' },
    { label: 'Transfers', value: 15, color: '#A855F7' },
    { label: 'Social', value: Math.min((cs.totalAssists ?? 0) * 5 + 10, 100), color: '#EC4899' },
    { label: 'Media', value: 20, color: '#F59E0B' },
    { label: 'Management', value: 25, color: '#06B6D4' },
  ];

  // 9. Save Data Integrity Ring (inverse of storage usage)
  const integrityPct = Math.max(0, Math.round(100 - pct));
  const integrityD = ringArc(120, 120, 80, integrityPct);

  // 10. Notification Frequency Area Chart (7 days)
  const notifFreqData = (() => {
    const now = Date.now();
    const daily: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - i * 86400000;
      const dayEnd = dayStart + 86400000;
      const cnt = notifications.reduce((c, n) => {
        const ts = new Date(n.timestamp).getTime();
        return c + (ts >= dayStart && ts < dayEnd ? 1 : 0);
      }, 0);
      daily.push(cnt);
    }
    return daily;
  })();
  const notifFreqMax = Math.max(...notifFreqData, 1);
  const notifFreqLine = areaChartLinePath(notifFreqData, 300, 160, 30, 20, notifFreqMax);
  const notifFreqFill = areaChartFillPath(notifFreqData, 300, 160, 30, 20, notifFreqMax);

  // 11. Career Balance Radar
  const balRadarVals = [
    Math.min(((cs.totalAppearances ?? 0) / 40) * 100, 100),
    Math.min((ss.averageRating ?? 0) * 10, 100),
    Math.min(((cs.totalAssists ?? 0) / 10) * 100, 100),
    30,
    playerMorale,
  ];
  const balRadarLabels = ['Playing', 'Develop', 'Social', 'Finance', 'Morale'];
  const balRadarShape = radarPointsStr(120, 120, 80, balRadarVals);
  const balRadarAxes = radarAxisEndpoints(120, 120, 80, 5);
  const balRadarGrids = radarGridPolygons(120, 120, 80, 4, 5);

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
    { value: 'off' as const, label: 'Off', sublabel: 'No animations', anim: 'slide-off', barColor: '#484f58' },
    { value: 'normal' as const, label: 'Normal', sublabel: 'Default speed', anim: 'slide-normal', barColor: '#10B981' },
    { value: 'fast' as const, label: 'Fast', sublabel: 'Quick transitions', anim: 'slide-fast', barColor: '#3B82F6' },
  ];

  const simSpeedOptions = [
    { value: '1x' as const, label: '1x', sublabel: 'Real-time' },
    { value: '2x' as const, label: '2x', sublabel: 'Double speed' },
    { value: '4x' as const, label: '4x', sublabel: 'Turbo' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <style>{ANIM_PREVIEW_STYLE}</style>

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

      {/* ===== Quick Links Section (FIXED) ===== */}
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
          <QuickLinkRow icon={BookOpen} label="Career Journal" screen="career_journal" />
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

      {/* ===== Display Settings (with Animation Speed Preview Cards) ===== */}
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
              <AnimSpeedPreviewCard
                key={opt.value}
                label={opt.label}
                sublabel={opt.sublabel}
                selected={animSpeed === opt.value}
                onClick={() => {
                  setAnimSpeed(opt.value);
                  setAnimationsEnabled(opt.value !== 'off');
                }}
                animName={opt.anim}
                barColor={opt.barColor}
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
            <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="h-full bg-emerald-600 rounded-lg"
                style={{ width: `${sfxVolume[0]}%` }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#c9d1d9]">Music</p>
              <span className="text-xs text-[#8b949e]">{musicVolume[0]}%</span>
            </div>
            <div className="h-2 bg-[#21262d] rounded-lg overflow-hidden">
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="h-full bg-emerald-600 rounded-lg"
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

        {/* ===== Danger Zone (Enhanced) ===== */}
        <div
          className="border-2 rounded-lg p-3 space-y-3"
          style={{ borderColor: 'rgba(239, 68, 68, 0.3)', animation: 'pulse-danger-border 3s ease-in-out infinite' }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <span className="text-xs text-red-400 font-semibold uppercase tracking-widest">Danger Zone</span>
          </div>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            These actions are irreversible. Please make sure you have exported your data before proceeding.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleResetCareer}
              className="h-10 bg-red-900/60 hover:bg-red-800/80 text-red-100 hover:text-white font-medium rounded-lg text-xs gap-1.5 border-0"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Reset Career
            </Button>
            <Button
              onClick={handleClearAllData}
              className="h-10 bg-red-900/60 hover:bg-red-800/80 text-red-100 hover:text-white font-medium rounded-lg text-xs gap-1.5 border-0"
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

      {/* ===== Storage Usage Card ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.54, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <HardDrive className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Storage</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">localStorage usage (5 MB quota)</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-[#21262d] rounded-lg overflow-hidden">
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-lg"
                style={{ width: `${Math.max(2, pct)}%`, background: barColor }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#8b949e]">
                {usageKB > 1024 ? `${(usageKB / 1024).toFixed(1)} MB` : `${usageKB} KB`} used
              </span>
              <span className="text-[10px] text-[#484f58]">
                {pct.toFixed(1)}% of 5 MB
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SVG VISUALIZATIONS (11 inline SVG data viz sections)          */}
      {/* ============================================================ */}

      {/* 1. Notification Distribution Donut */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.56, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <Bell className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Notification Distribution</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">Breakdown by type (match/transfer/achievement/event)</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 240 240" className="w-48 h-48">
              {donutSegments.map((arc) => (
                arc.path ? (
                  <path key={arc.seg} d={arc.path} fill={arc.color} style={{ opacity: 0.85 }} />
                ) : null
              ))}
              {donutTotal === 0 && (
                <circle cx="120" cy="120" r="65" fill="none" stroke="#30363d" strokeWidth="30" />
              )}
              <text x="120" y="116" textAnchor={"middle" as "middle"} fill="#c9d1d9" fontSize="22" fontWeight="bold">{donutTotal}</text>
              <text x="120" y="134" textAnchor={"middle" as "middle"} fill="#8b949e" fontSize="10">total</text>
            </svg>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {donutSegments.map((arc) => (
              <span key={arc.seg} className="flex items-center gap-1.5 text-[10px] text-[#8b949e]">
                <div className="w-2 h-2 rounded-sm" style={{ background: arc.color }} />
                {arc.seg} ({arc.count})
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 2. Gameplay Statistics Radar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.58, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Gameplay Statistics</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">5-axis performance radar from career stats</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 240 240" className="w-48 h-48">
              {/* Grid polygons */}
              {gpRadarGrids.map((pts, idx) => (
                <polygon key={idx} points={pts} fill="none" stroke="#21262d" strokeWidth="1" />
              ))}
              {/* Axis lines */}
              {gpRadarAxes.split(' ').map((pt, idx) => {
                const [x, y] = pt.split(',');
                return <line key={idx} x1="120" y1="120" x2={x} y2={y} stroke="#21262d" strokeWidth="1" />;
              })}
              {/* Data shape */}
              <polygon points={gpRadarShape} fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" />
              {/* Labels */}
              {gpRadarAxes.split(' ').map((pt, idx) => {
                const [x, y] = pt.split(',');
                const anchor = (parseFloat(x) as number) < 120 ? 'end' as const : (parseFloat(x) as number) > 120 ? 'start' as const : 'middle' as const;
                return <text key={idx} x={parseFloat(x) as number} y={(parseFloat(y) as number) - 8} textAnchor={anchor} fill="#8b949e" fontSize="9">{gpRadarLabels[idx]}</text>;
              })}
              {/* Center dot */}
              <circle cx="120" cy="120" r="2" fill="#30363d" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 3. Career Progress Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.60, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <Trophy className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Career Progress Timeline</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">8 milestones tracked across your career</p>
            </div>
          </div>
          <div className="flex justify-center overflow-x-auto">
            <svg viewBox="0 0 300 80" className="w-full max-w-[300px]" preserveAspectRatio="xMidYMid meet">
              {/* Base line */}
              <line x1="20" y1="40" x2="280" y2="40" stroke="#30363d" strokeWidth="2" />
              {/* Milestone dots and labels */}
              {careerMilestones.map((m, i) => {
                const x = 20 + i * (260 / 7);
                const fill = m.achieved ? '#10B981' : '#21262d';
                const stroke = m.achieved ? '#10B981' : '#30363d';
                return (
                  <g key={m.label}>
                    <circle cx={x} cy="40" r="6" fill={fill} stroke={stroke} strokeWidth="2" />
                    {m.achieved && <circle cx={x} cy="40" r="2.5" fill="#161b22" />}
                    <text
                      x={x}
                      y="22"
                      textAnchor={'middle' as 'middle'}
                      fill={m.achieved ? '#c9d1d9' : '#484f58'}
                      fontSize="8"
                    >
                      {m.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-center gap-3 text-[10px] text-[#8b949e]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" /> Achieved</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#21262d] border border-[#30363d]" /> Locked</span>
          </div>
        </div>
      </motion.div>

      {/* 4. Weekly Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.62, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <Calendar className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Weekly Activity Heatmap</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">Notification volume by day (last 4 weeks)</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 240 160" className="w-full max-w-[280px]">
              {/* Day labels */}
              {hmDayLabels.map((d, i) => (
                <text key={d + i} x="18" y={30 + i * 22} textAnchor={'end' as 'end'} fill="#8b949e" fontSize="9">{d}</text>
              ))}
              {/* Week labels */}
              {['W-4', 'W-3', 'W-2', 'W-1'].map((w, wi) => (
                <text key={w} x={55 + wi * 46} y="14" textAnchor={'middle' as 'middle'} fill="#484f58" fontSize="8">{w}</text>
              ))}
              {/* Heatmap cells */}
              {heatmapGrid.map((row, ri) =>
                row.map((val, ci) => {
                  const intensity = hmMaxVal > 0 ? val / hmMaxVal : 0;
                  const cellColor = val === 0 ? '#161b22' : intensity < 0.33 ? '#064e3b' : intensity < 0.66 ? '#10B981' : '#34D399';
                  return (
                    <rect
                      key={`${ri}-${ci}`}
                      x={30 + ci * 46}
                      y={20 + ri * 22}
                      width="38"
                      height="16"
                      rx="3"
                      fill={cellColor}
                      stroke="#21262d"
                      strokeWidth="1"
                    />
                  );
                })
              )}
            </svg>
          </div>
          <div className="flex justify-center gap-2 text-[9px] text-[#484f58]">
            <span>Less</span>
            {[0, 1, 2, 3].map((lvl) => (
              <div key={lvl} className="w-3 h-3 rounded-sm" style={{ background: lvl === 0 ? '#161b22' : lvl === 1 ? '#064e3b' : lvl === 2 ? '#10B981' : '#34D399' }} />
            ))}
            <span>More</span>
          </div>
        </div>
      </motion.div>

      {/* 5. Settings Completeness Ring */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.64, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Settings Completeness</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">{settingsEnabledCount}/{settingsTotalCount} toggles configured</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 240 240" className="w-44 h-44">
              <circle cx="120" cy="120" r="80" fill="none" stroke="#21262d" strokeWidth="12" />
              {settingsRingD && (
                <path d={settingsRingD} fill="none" stroke="#10B981" strokeWidth="12" strokeLinecap="round" />
              )}
              <text x="120" y="114" textAnchor={'middle' as 'middle'} fill="#c9d1d9" fontSize="28" fontWeight="bold">{settingsPct}%</text>
              <text x="120" y="134" textAnchor={'middle' as 'middle'} fill="#8b949e" fontSize="10">complete</text>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 6. Audio Levels Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.66, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <Volume2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Audio Levels</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">SFX and Music volume visualization</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 300 120" className="w-full max-w-[300px]">
              {/* SFX Bar */}
              <text x="10" y="38" fill="#c9d1d9" fontSize="11">SFX</text>
              <rect x="50" y="24" width="220" height="20" rx="4" fill="#21262d" />
              <rect x="50" y="24" width={(audioSfx / 100) * 220} height="20" rx="4" fill="#10B981" />
              <text x="280" y="38" textAnchor={'end' as 'end'} fill="#8b949e" fontSize="10">{audioSfx}%</text>
              {/* Music Bar */}
              <text x="10" y="88" fill="#c9d1d9" fontSize="11">Music</text>
              <rect x="50" y="74" width="220" height="20" rx="4" fill="#21262d" />
              <rect x="50" y="74" width={(audioMus / 100) * 220} height="20" rx="4" fill="#3B82F6" />
              <text x="280" y="88" textAnchor={'end' as 'end'} fill="#8b949e" fontSize="10">{audioMus}%</text>
              {/* Tick marks */}
              {[0, 25, 50, 75, 100].map((tick) => (
                <line key={tick} x1={50 + (tick / 100) * 220} y1="104" x2={50 + (tick / 100) * 220} y2="110" stroke="#484f58" strokeWidth="1" />
              ))}
              {[0, 25, 50, 75, 100].map((tick) => (
                <text key={tick} x={50 + (tick / 100) * 220} y="118" textAnchor={'middle' as 'middle'} fill="#484f58" fontSize="7">{tick}</text>
              ))}
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 7. Difficulty Impact Gauge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.68, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <Shield className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Difficulty Impact Gauge</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">How difficulty affects your career (0-100)</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 240 140" className="w-full max-w-[240px]">
              {/* Background semi-circle */}
              <path d={gaugeBgArc} fill="none" stroke="#21262d" strokeWidth="14" strokeLinecap="round" />
              {/* Filled arc */}
              <path d={gaugeFillArc} fill="none" stroke={diffScore <= 30 ? '#10B981' : diffScore <= 60 ? '#F59E0B' : '#EF4444'} strokeWidth="14" strokeLinecap="round" />
              {/* Needle */}
              <line x1="120" y1="120" x2={gaugeNx} y2={gaugeNy} stroke="#c9d1d9" strokeWidth="2" strokeLinecap="round" />
              <circle cx="120" cy="120" r="4" fill="#c9d1d9" />
              {/* Labels */}
              <text x="38" y="136" textAnchor={'start' as 'start'} fill="#484f58" fontSize="9">0</text>
              <text x="120" y="60" textAnchor={'middle' as 'middle'} fill="#c9d1d9" fontSize="18" fontWeight="bold">{diffScore}</text>
              <text x="120" y="136" textAnchor={'middle' as 'middle'} fill="#8b949e" fontSize="9">50</text>
              <text x="202" y="136" textAnchor={'end' as 'end'} fill="#484f58" fontSize="9">100</text>
              {/* Difficulty label */}
              <text x="120" y="78" textAnchor={'middle' as 'middle'} fill="#8b949e" fontSize="10">{diffInfo.label}</text>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 8. Season Time Investment Bars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.70, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <Timer className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Season Time Investment</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">Time distribution across game areas</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 300 200" className="w-full max-w-[300px]">
              {investBars.map((bar, i) => {
                const barY = 10 + i * 30;
                return (
                  <g key={bar.label}>
                    <text x="70" y={barY + 13} textAnchor={'end' as 'end'} fill="#c9d1d9" fontSize="10">{bar.label}</text>
                    <rect x="78" y={barY} width="190" height="18" rx="4" fill="#21262d" />
                    <rect x="78" y={barY} width={(bar.value / 100) * 190} height="18" rx="4" fill={bar.color} />
                    <text x="278" y={barY + 13} textAnchor={'end' as 'end'} fill="#8b949e" fontSize="9">{bar.value}%</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 9. Save Data Integrity Ring */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.72, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <HardDrive className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Save Data Integrity</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">Storage health based on remaining capacity</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 240 240" className="w-44 h-44">
              <circle cx="120" cy="120" r="80" fill="none" stroke="#21262d" strokeWidth="12" />
              {integrityD && (
                <path d={integrityD} fill="none" stroke={integrityPct > 50 ? '#10B981' : integrityPct > 25 ? '#F59E0B' : '#EF4444'} strokeWidth="12" strokeLinecap="round" />
              )}
              <text x="120" y="114" textAnchor={'middle' as 'middle'} fill="#c9d1d9" fontSize="28" fontWeight="bold">{integrityPct}%</text>
              <text x="120" y="134" textAnchor={'middle' as 'middle'} fill="#8b949e" fontSize="10">integrity</text>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 10. Notification Frequency Area Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.74, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Notification Frequency</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">Volume over the last 7 days</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 300 160" className="w-full max-w-[300px]">
              {/* Grid lines */}
              {[0, 1, 2, 3].map((lvl) => {
                const y = 20 + ((3 - lvl) / 3) * 120;
                return (
                  <g key={lvl}>
                    <line x1="30" y1={y} x2="270" y2={y} stroke="#21262d" strokeWidth="1" />
                    <text x="25" y={y + 3} textAnchor={'end' as 'end'} fill="#484f58" fontSize="8">{Math.round((lvl / 3) * notifFreqMax)}</text>
                  </g>
                );
              })}
              {/* Area fill */}
              {notifFreqFill && <polygon points={notifFreqFill} fill="#10B981" fillOpacity="0.15" />}
              {/* Line */}
              {notifFreqLine && <polyline points={notifFreqLine} fill="none" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />}
              {/* Dots */}
              {notifFreqData.map((val, i) => {
                const x = 30 + (i / Math.max(notifFreqData.length - 1, 1)) * 240;
                const y = 20 + 120 - (val / notifFreqMax) * 120;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="3" fill="#10B981" stroke="#161b22" strokeWidth="1.5" />
                    {val > 0 && <text x={x} y={y - 7} textAnchor={'middle' as 'middle'} fill="#c9d1d9" fontSize="8">{val}</text>}
                  </g>
                );
              })}
              {/* X-axis day labels */}
              {notifFreqData.map((_, i) => {
                const x = 30 + (i / Math.max(notifFreqData.length - 1, 1)) * 240;
                const dayLabel = ['6d', '5d', '4d', '3d', '2d', '1d', 'Now'];
                return (
                  <text key={i} x={x} y="150" textAnchor={'middle' as 'middle'} fill="#484f58" fontSize="8">{dayLabel[i]}</text>
                );
              })}
            </svg>
          </div>
        </div>
      </motion.div>

      {/* 11. Career Balance Radar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.76, ease: 'easeOut' } }}
      >
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-[#21262d] rounded-lg flex-shrink-0 mt-0.5">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Career Balance</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">5-axis balance radar (Playing/Development/Social/Finances/Morale)</p>
            </div>
          </div>
          <div className="flex justify-center">
            <svg viewBox="0 0 240 240" className="w-48 h-48">
              {/* Grid polygons */}
              {balRadarGrids.map((pts, idx) => (
                <polygon key={idx} points={pts} fill="none" stroke="#21262d" strokeWidth="1" />
              ))}
              {/* Axis lines */}
              {balRadarAxes.split(' ').map((pt, idx) => {
                const coords = pt.split(',');
                return <line key={idx} x1="120" y1="120" x2={coords[0]} y2={coords[1]} stroke="#21262d" strokeWidth="1" />;
              })}
              {/* Data shape */}
              <polygon points={balRadarShape} fill="#A855F7" fillOpacity="0.2" stroke="#A855F7" strokeWidth="2" />
              {/* Labels */}
              {balRadarAxes.split(' ').map((pt, idx) => {
                const coords = pt.split(',');
                const px = parseFloat(coords[0]);
                const py = parseFloat(coords[1]);
                const anchor: 'start' | 'middle' | 'end' = px < 118 ? 'end' : px > 122 ? 'start' : 'middle';
                return <text key={idx} x={px} y={py - 8} textAnchor={anchor} fill="#8b949e" fontSize="9">{balRadarLabels[idx]}</text>;
              })}
              {/* Center dot */}
              <circle cx="120" cy="120" r="2" fill="#30363d" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* ===== Notifications Feed (with distribution bar) ===== */}
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
                  {/* Notification Category Distribution Bar */}
                  {notifications.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-[#8b949e] mb-1">Distribution</p>
                      <div className="flex h-2 rounded-lg overflow-hidden">
                        {Object.entries(notifDistribution)
                          .sort(([, a], [, b]) => b - a)
                          .map(([type, count]) => {
                            const widthPct = (count / notifications.length) * 100;
                            const color = notificationTypeBarColors[type] || '#64748B';
                            return (
                              <div
                                key={type}
                                className="h-full"
                                style={{ width: `${widthPct}%`, background: color, minWidth: count > 0 ? 2 : 0 }}
                                title={`${type}: ${count}`}
                              />
                            );
                          })}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {Object.entries(notifDistribution)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 4)
                          .map(([type, count]) => (
                            <span key={type} className="flex items-center gap-1 text-[9px] text-[#8b949e]">
                              <div className="w-1.5 h-1.5 rounded-sm" style={{ background: notificationTypeBarColors[type] || '#64748B' }} />
                              {type} ({count})
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

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