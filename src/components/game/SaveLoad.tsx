'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { SaveSlot } from '@/lib/game/types';
import { getSaveSlots } from '@/services/persistenceService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Save, Trash2, Clock, Play, HardDrive,
  Plus, Upload, Download, ChevronRight, User, Target,
  Building2, DollarSign, Calendar, ToggleLeft, ToggleRight,
  FileJson, Shield, Zap, BarChart3, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_SLOTS = 8;
const AUTO_SAVE_KEY = 'elite_striker_autosave_settings';

type AutoSaveFrequency = 'off' | 'every_week' | 'every_5_weeks';
interface AutoSaveSettings {
  enabled: boolean;
  frequency: AutoSaveFrequency;
  lastAutoSave: string | null;
}

function loadAutoSaveSettings(): AutoSaveSettings {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_KEY);
    if (raw) return JSON.parse(raw) as AutoSaveSettings;
  } catch { /* ignore */ }
  return { enabled: true, frequency: 'every_week', lastAutoSave: null };
}

function persistAutoSaveSettings(s: AutoSaveSettings) {
  try {
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value.toLocaleString()}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function estimateSaveSize(slot: SaveSlot): number {
  return new Blob([JSON.stringify(slot)]).size;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Stat pill used in the save details panel */
function StatPill({ label, value, color = 'text-[#c9d1d9]' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-[#0d1117] rounded-lg p-2 text-center">
      <p className={`font-bold text-sm ${color}`}>{value}</p>
      <p className="text-[10px] text-[#484f58] mt-0.5">{label}</p>
    </div>
  );
}

/** Delete confirmation overlay */
function DeleteConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 max-w-sm mx-4 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-[#c9d1d9]">Delete Save?</p>
            <p className="text-xs text-[#8b949e]">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-[#8b949e] mb-5">
          This save file will be permanently deleted from your device.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-10 bg-[#21262d] border-[#30363d] text-[#8b949e] hover:bg-[#30363d]"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 h-10 bg-red-600 hover:bg-red-500 text-white"
          >
            Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function SaveLoad() {
  const setScreen = useGameStore(state => state.setScreen);
  const gameState = useGameStore(state => state.gameState);
  const loadCareer = useGameStore(state => state.loadCareer);
  const deleteCareer = useGameStore(state => state.deleteCareer);
  const saveGame = useGameStore(state => state.saveGame);

  const [savesVersion, setSavesVersion] = useState(0);
  const [mode, setMode] = useState<'load' | 'save'>('load');
  const [selectedSave, setSelectedSave] = useState<SaveSlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState<AutoSaveSettings>(loadAutoSaveSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saves = useMemo(() => getSaveSlots(), [savesVersion]);

  // ---- Flash Status ----
  const flashStatus = useCallback((msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 2000);
  }, []);

  // ---- Handlers ----
  const handleSave = useCallback((slotName: string) => {
    saveGame(slotName);
    setSavesVersion(v => v + 1);
    flashStatus('Game saved!');
  }, [saveGame, flashStatus]);

  const handleLoad = useCallback((save: SaveSlot) => {
    loadCareer(save);
  }, [loadCareer]);

  const handleDelete = useCallback((saveId: string) => {
    deleteCareer(saveId);
    setSavesVersion(v => v + 1);
    setSelectedSave(prev => prev?.id === saveId ? null : prev);
    setDeleteTarget(null);
    flashStatus('Save deleted');
  }, [deleteCareer, flashStatus]);

  const handleExport = useCallback((save: SaveSlot) => {
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elite_striker_${save.gameState.player.name.replace(/\s+/g, '_')}_S${save.gameState.currentSeason}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('Save exported!');
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as SaveSlot;
        if (data?.gameState?.player) {
          // Re-save it as a new slot
          saveGame(`${data.gameState.player.name} - Imported S${data.gameState.currentSeason}`);
          setSavesVersion(v => v + 1);
          flashStatus('Save imported!');
        } else {
          flashStatus('Invalid save file');
        }
      } catch {
        flashStatus('Failed to parse file');
      }
    };
    reader.readAsText(file);
    // Reset the input so same file can be re-selected
    e.target.value = '';
  }, [saveGame, flashStatus]);

  const handleAutoSaveToggle = useCallback(() => {
    const next = { ...autoSave, enabled: !autoSave.enabled };
    setAutoSave(next);
    persistAutoSaveSettings(next);
  }, [autoSave]);

  const handleAutoSaveFreq = useCallback((freq: AutoSaveFrequency) => {
    const next = { ...autoSave, frequency: freq, enabled: freq !== 'off' ? autoSave.enabled : false };
    setAutoSave(next);
    persistAutoSaveSettings(next);
  }, [autoSave]);

  // ---- Derived ----
  const activeSaveId = gameState ? saves.find(s => s.gameState?.createdAt === gameState?.createdAt)?.id : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0d1117] pb-20">
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setScreen('main_menu')} className="text-[#8b949e] hover:text-[#c9d1d9]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#c9d1d9]">Save / Load</h1>
            <p className="text-xs text-[#484f58]">Manage your career saves</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#484f58]">
            <HardDrive className="h-3 w-3" />
            {saves.length}/{MAX_SLOTS}
          </div>
        </div>

        {/* Status Toast */}
        <AnimatePresence>
          {statusMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 border border-emerald-600 text-emerald-200 text-sm px-4 py-2 rounded-lg shadow-lg"
            >
              {statusMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-5">
          {(['load', 'save'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelectedSave(null); }}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-colors ${
                mode === m
                  ? 'bg-emerald-600/20 border border-emerald-500 text-emerald-300'
                  : 'bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
              }`}
            >
              {m === 'load' ? <HardDrive className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {m === 'load' ? 'Load Game' : 'Save Game'}
            </button>
          ))}
        </div>

        {/* ================================================================ */}
        {/* SAVE MODE                                                        */}
        {/* ================================================================ */}
        {mode === 'save' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Current Game Card */}
            {gameState && (
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Current Game</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{gameState.currentClub.logo}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#c9d1d9] truncate">{gameState.player.name}</p>
                      <p className="text-xs text-[#8b949e]">
                        {gameState.currentClub.name} &bull; Season {gameState.currentSeason} &bull; Week {gameState.currentWeek}
                      </p>
                    </div>
                    <Badge className="bg-emerald-800 text-emerald-300 text-xs border-0">
                      OVR {gameState.player.overall}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <StatPill label="Goals" value={gameState.player.seasonStats.goals} color="text-emerald-400" />
                    <StatPill label="Assists" value={gameState.player.seasonStats.assists} color="text-blue-400" />
                    <StatPill label="Apps" value={gameState.player.seasonStats.appearances} color="text-amber-400" />
                    <StatPill label="Age" value={gameState.player.age} />
                  </div>

                  {/* Quick Save */}
                  <Button
                    onClick={() => handleSave(`${gameState.player.name} - Season ${gameState.currentSeason}`)}
                    className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg mt-3"
                  >
                    <Save className="mr-2 h-5 w-5" />
                    Quick Save
                  </Button>
                </CardContent>
              </Card>
            )}

            {!gameState && (
              <Card className="bg-[#161b22]/50 border-[#30363d]">
                <CardContent className="p-8 text-center">
                  <p className="text-[#8b949e]">No active game to save</p>
                  <p className="text-xs text-[#484f58] mt-1">Start a new career first</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* LOAD MODE                                                        */}
        {/* ================================================================ */}
        {mode === 'load' && (
          <div className="space-y-3">
            {saves.length === 0 ? (
              <Card className="bg-[#161b22]/50 border-[#30363d]">
                <CardContent className="p-8 text-center">
                  <HardDrive className="h-12 w-12 mx-auto text-[#30363d] mb-3" />
                  <p className="text-[#8b949e]">No saved games found</p>
                  <p className="text-xs text-[#484f58] mt-1">Start a new career to create your first save</p>
                </CardContent>
              </Card>
            ) : (
              saves.map((save, idx) => {
                const isActive = save.id === activeSaveId;
                const isSelected = selectedSave?.id === save.id;
                const gs = save.gameState;

                return (
                  <motion.div
                    key={save.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      onClick={() => setSelectedSave(isSelected ? null : save)}
                      className={`bg-[#161b22] border overflow-hidden cursor-pointer transition-colors ${
                        isActive
                          ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : isSelected
                            ? 'border-blue-500'
                            : 'border-[#30363d] hover:border-[#484f58]'
                      }`}
                    >
                      <CardContent className="p-3">
                        {/* Top row */}
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                            isActive ? 'bg-emerald-800/30' : 'bg-[#21262d]'
                          }`}>
                            {gs.currentClub.logo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-[#c9d1d9] truncate">{save.name}</p>
                              {isActive && (
                                <Badge className="bg-emerald-800 text-emerald-300 text-[9px] px-1.5 py-0 border-0 shrink-0">
                                  ACTIVE
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-[#8b949e] truncate">
                              {gs.player.name} &bull; {gs.currentClub.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-[#484f58]" />
                              <span className="text-[10px] text-[#484f58]">{formatDate(save.savedAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge className="bg-[#21262d] text-[#c9d1d9] text-xs border-0">
                              OVR {gs.player.overall}
                            </Badge>
                            <ChevronRight className={`h-4 w-4 text-[#484f58] transition-colors ${isSelected ? 'rotate-90 text-blue-400' : ''}`} />
                          </div>
                        </div>

                        {/* Mini stats row */}
                        <div className="grid grid-cols-4 gap-1.5 mt-3">
                          {[
                            { label: 'GLS', val: gs.player.seasonStats.goals, c: 'text-emerald-400' },
                            { label: 'AST', val: gs.player.seasonStats.assists, c: 'text-blue-400' },
                            { label: 'APP', val: gs.player.seasonStats.appearances, c: 'text-amber-400' },
                            { label: 'AGE', val: gs.player.age, c: 'text-[#c9d1d9]' },
                          ].map(s => (
                            <div key={s.label} className="bg-[#21262d] rounded-md py-1 text-center">
                              <p className={`text-xs font-bold ${s.c}`}>{s.val}</p>
                              <p className="text-[9px] text-[#484f58]">{s.label}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* ---- Selected Details Panel ---- */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <Card className="bg-[#161b22] border border-[#30363d] border-t-0 rounded-t-none">
                            <CardContent className="p-4 space-y-4">

                              {/* Player Info Section */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="h-3.5 w-3.5 text-[#484f58]" />
                                  <span className="text-[10px] text-[#484f58] uppercase tracking-wider font-semibold">Player Info</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-[#21262d] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#484f58]">Name</p>
                                    <p className="text-sm text-[#c9d1d9] font-medium">{gs.player.name}</p>
                                  </div>
                                  <div className="bg-[#21262d] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#484f58]">Position</p>
                                    <p className="text-sm text-[#c9d1d9] font-medium">{gs.player.position}</p>
                                  </div>
                                  <div className="bg-[#21262d] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#484f58]">Age</p>
                                    <p className="text-sm text-[#c9d1d9] font-medium">{gs.player.age}</p>
                                  </div>
                                  <div className="bg-[#21262d] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#484f58]">Overall</p>
                                    <p className="text-sm text-emerald-400 font-bold">{gs.player.overall}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Career Stats Section */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <BarChart3 className="h-3.5 w-3.5 text-[#484f58]" />
                                  <span className="text-[10px] text-[#484f58] uppercase tracking-wider font-semibold">Career Stats</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  <StatPill label="Goals" value={gs.player.careerStats.totalGoals} color="text-emerald-400" />
                                  <StatPill label="Assists" value={gs.player.careerStats.totalAssists} color="text-blue-400" />
                                  <StatPill label="Appearances" value={gs.player.careerStats.totalAppearances} color="text-amber-400" />
                                  <StatPill label="Trophies" value={gs.player.careerStats.trophies.length} color="text-yellow-400" />
                                </div>
                              </div>

                              {/* Club Info Section */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Building2 className="h-3.5 w-3.5 text-[#484f58]" />
                                  <span className="text-[10px] text-[#484f58] uppercase tracking-wider font-semibold">Club Info</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-[#21262d] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#484f58]">Club</p>
                                    <p className="text-sm text-[#c9d1d9] font-medium">{gs.currentClub.logo} {gs.currentClub.name}</p>
                                  </div>
                                  <div className="bg-[#21262d] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#484f58]">League</p>
                                    <p className="text-sm text-[#c9d1d9] font-medium">{gs.currentClub.league}</p>
                                  </div>
                                </div>
                                <div className="bg-[#21262d] rounded-lg p-2.5 mt-2">
                                  <p className="text-[10px] text-[#484f58]">League Position</p>
                                  <p className="text-sm text-[#c9d1d9] font-medium">
                                    {gs.seasons.length > 0
                                      ? `${gs.seasons[gs.seasons.length - 1].leaguePosition}${gs.seasons[gs.seasons.length - 1].leaguePosition === 1 ? 'st' : gs.seasons[gs.seasons.length - 1].leaguePosition === 2 ? 'nd' : gs.seasons[gs.seasons.length - 1].leaguePosition === 3 ? 'rd' : 'th'}`
                                      : 'N/A'}
                                  </p>
                                </div>
                              </div>

                              {/* Financial Info */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <DollarSign className="h-3.5 w-3.5 text-[#484f58]" />
                                  <span className="text-[10px] text-[#484f58] uppercase tracking-wider font-semibold">Finances</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-[#21262d] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#484f58]">Weekly Wage</p>
                                    <p className="text-sm text-[#c9d1d9] font-medium">{formatCurrency(gs.player.contract.weeklyWage)}</p>
                                  </div>
                                  <div className="bg-[#21262d] rounded-lg p-2.5">
                                    <p className="text-[10px] text-[#484f58]">Market Value</p>
                                    <p className="text-sm text-emerald-400 font-medium">{formatCurrency(gs.player.marketValue)}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Save File Info */}
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Info className="h-3.5 w-3.5 text-[#484f58]" />
                                  <span className="text-[10px] text-[#484f58] uppercase tracking-wider font-semibold">Save Info</span>
                                </div>
                                <div className="bg-[#21262d] rounded-lg p-2.5 space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-[10px] text-[#484f58]">Season / Week</span>
                                    <span className="text-xs text-[#c9d1d9]">{gs.currentSeason} / {gs.currentWeek}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[10px] text-[#484f58]">Date Saved</span>
                                    <span className="text-xs text-[#c9d1d9]">{formatDate(save.savedAt)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-[10px] text-[#484f58]">File Size</span>
                                    <span className="text-xs text-[#c9d1d9]">{formatFileSize(estimateSaveSize(save))}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <Button
                                  onClick={() => handleLoad(save)}
                                  className="h-10 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg"
                                >
                                  <Play className="mr-1.5 h-4 w-4" /> Load
                                </Button>
                                <Button
                                  onClick={() => handleSave(`${gs.player.name} - Season ${gs.currentSeason}`)}
                                  className="h-10 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg"
                                >
                                  <Save className="mr-1.5 h-4 w-4" /> Overwrite
                                </Button>
                                <Button
                                  onClick={() => handleExport(save)}
                                  variant="outline"
                                  className="h-10 bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] text-sm rounded-lg"
                                >
                                  <Download className="mr-1.5 h-4 w-4" /> Export
                                </Button>
                                <Button
                                  onClick={() => setDeleteTarget(save.id)}
                                  variant="outline"
                                  className="h-10 border-red-800/60 text-red-400 hover:bg-red-900/30 text-sm rounded-lg"
                                >
                                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* AUTO-SAVE SETTINGS                                               */}
        {/* ================================================================ */}
        <Card className="bg-[#161b22] border-[#30363d] mt-5">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-xs text-[#8b949e] uppercase tracking-wider">Auto-Save</CardTitle>
              </div>
              <button
                onClick={handleAutoSaveToggle}
                className="flex items-center gap-1 text-xs"
              >
                {autoSave.enabled ? (
                  <ToggleRight className="h-5 w-5 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-[#484f58]" />
                )}
                <span className={autoSave.enabled ? 'text-emerald-400' : 'text-[#484f58]'}>
                  {autoSave.enabled ? 'On' : 'Off'}
                </span>
              </button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-center gap-2 text-[10px] text-[#484f58] mb-3">
              <Clock className="h-3 w-3" />
              {autoSave.lastAutoSave
                ? <>Last auto-save: {formatDate(autoSave.lastAutoSave)}</>
                : <>No auto-save yet</>}
            </div>
            <div className="flex gap-2">
              {([
                { value: 'every_week' as AutoSaveFrequency, label: 'Every Week' },
                { value: 'every_5_weeks' as AutoSaveFrequency, label: 'Every 5 Weeks' },
                { value: 'off' as AutoSaveFrequency, label: 'Off' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAutoSaveFreq(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    autoSave.frequency === opt.value
                      ? 'bg-amber-600/20 border border-amber-500 text-amber-300'
                      : 'bg-[#21262d] border border-[#30363d] text-[#484f58] hover:text-[#8b949e]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ================================================================ */}
        {/* IMPORT / EXPORT (standalone)                                      */}
        {/* ================================================================ */}
        <Card className="bg-[#161b22] border-[#30363d] mt-3">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileJson className="h-4 w-4 text-[#484f58]" />
              <span className="text-xs text-[#8b949e] uppercase tracking-wider font-semibold">Transfer Save</span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 h-10 bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] text-sm rounded-lg"
              >
                <Upload className="mr-1.5 h-4 w-4" /> Import JSON
              </Button>
              <Button
                onClick={() => {
                  if (selectedSave) handleExport(selectedSave);
                }}
                variant="outline"
                disabled={!selectedSave}
                className="flex-1 h-10 bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] text-sm rounded-lg disabled:opacity-40"
              >
                <Download className="mr-1.5 h-4 w-4" /> Export JSON
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            onConfirm={() => handleDelete(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
