// ============================================================
// Elite Striker - Persistence Service
// Handles saving and loading game state to/from localStorage
// ============================================================

import { SaveSlot } from '@/lib/game/types';

const SAVE_PREFIX = 'elite_striker_save_';
const SAVE_METADATA_KEY = 'elite_striker_saves';

// -----------------------------------------------------------
// Check if localStorage is available
// -----------------------------------------------------------
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__elite_striker_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------
// Save a game slot to localStorage
// -----------------------------------------------------------
export function saveGame(slot: SaveSlot): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available. Cannot save game.');
    return;
  }

  try {
    const serialized = JSON.stringify(slot);
    localStorage.setItem(SAVE_PREFIX + slot.id, serialized);

    // Update the metadata index
    const metadata = getSaveMetadata();
    const existingIndex = metadata.findIndex((s) => s.id === slot.id);
    const metaEntry = {
      id: slot.id,
      name: slot.name,
      savedAt: slot.savedAt,
      playTime: slot.playTime,
      playerName: slot.gameState.player.name,
      playerClub: slot.gameState.currentClub.name,
      playerOverall: slot.gameState.player.overall,
      season: slot.gameState.currentSeason,
      week: slot.gameState.currentWeek,
    };

    if (existingIndex >= 0) {
      metadata[existingIndex] = metaEntry;
    } else {
      metadata.push(metaEntry);
    }

    localStorage.setItem(SAVE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

// -----------------------------------------------------------
// Load a game slot from localStorage
// -----------------------------------------------------------
export function loadGame(slotId: string): SaveSlot | null {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available. Cannot load game.');
    return null;
  }

  try {
    const serialized = localStorage.getItem(SAVE_PREFIX + slotId);
    if (!serialized) return null;

    const parsed = JSON.parse(serialized) as SaveSlot;

    // Basic validation
    if (!parsed.gameState || !parsed.gameState.player) {
      console.warn('Save data is corrupted or invalid.');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

// -----------------------------------------------------------
// Delete a save slot from localStorage
// -----------------------------------------------------------
export function deleteSave(slotId: string): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available. Cannot delete save.');
    return;
  }

  try {
    localStorage.removeItem(SAVE_PREFIX + slotId);

    // Remove from metadata
    const metadata = getSaveMetadata();
    const filtered = metadata.filter((s) => s.id !== slotId);
    localStorage.setItem(SAVE_METADATA_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete save:', error);
  }
}

// -----------------------------------------------------------
// Get all save slots (metadata only, for display purposes)
// -----------------------------------------------------------
export function getSaveSlots(): SaveSlot[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const metadata = getSaveMetadata();
    const slots: SaveSlot[] = [];

    for (const meta of metadata) {
      const slot = loadGame(meta.id);
      if (slot) {
        slots.push(slot);
      }
    }

    // Sort by most recent
    slots.sort(
      (a, b) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );

    return slots;
  } catch (error) {
    console.error('Failed to get save slots:', error);
    return [];
  }
}

// -----------------------------------------------------------
// Check if any save slots exist
// -----------------------------------------------------------
export function hasSaveSlots(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const metadata = getSaveMetadata();
    return metadata.length > 0;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------
// Internal: Get save metadata index
// -----------------------------------------------------------
interface SaveMetadataEntry {
  id: string;
  name: string;
  savedAt: string;
  playTime: number;
  playerName: string;
  playerClub: string;
  playerOverall: number;
  season: number;
  week: number;
}

function getSaveMetadata(): SaveMetadataEntry[] {
  try {
    const raw = localStorage.getItem(SAVE_METADATA_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SaveMetadataEntry[];
  } catch {
    return [];
  }
}
