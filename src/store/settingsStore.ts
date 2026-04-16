import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ControlSettings {
  // Control sizing
  joystickSize: number; // 80-120%
  buttonSize: number; // 80-120%
  
  // Layout
  leftHandedMode: boolean;
  controlOpacity: number; // 50-100%
  
  // Sensitivity
  gyroscopeEnabled: boolean;
  gyroscopeSensitivity: 'low' | 'medium' | 'high';
  joystickDeadzone: number; // 0.05-0.15
  
  // Interaction
  holdToActivate: boolean; // false = toggle
  longPressDuration: number; // 300-700ms
  
  // Accessibility
  highContrast: boolean;
  colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  textSize: number; // 100-150%
  reduceMotion: boolean;
  hapticIntensity: 'off' | 'low' | 'medium' | 'high';
}

const defaultSettings: ControlSettings = {
  joystickSize: 100,
  buttonSize: 100,
  leftHandedMode: false,
  controlOpacity: 80,
  gyroscopeEnabled: true,
  gyroscopeSensitivity: 'medium',
  joystickDeadzone: 0.08,
  holdToActivate: false,
  longPressDuration: 500,
  highContrast: false,
  colorblindMode: 'none',
  textSize: 100,
  reduceMotion: false,
  hapticIntensity: 'medium',
};

interface SettingsState {
  settings: ControlSettings;
  updateSettings: (updates: Partial<ControlSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'elite-striker-settings',
    }
  )
);
