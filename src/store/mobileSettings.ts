import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Mobile Settings Interface
 * Stores user preferences for mobile-specific features
 */
export interface MobileSettings {
  touchControlsEnabled: boolean;
  joystickSize: number; // 0.8 - 1.2
  radialMenuSize: number; // 0.8 - 1.2
  hapticsEnabled: boolean;
  leftHandedMode: boolean;
  showTutorial: boolean;
}

interface MobileSettingsState {
  mobileSettings: MobileSettings;
  updateMobileSettings: (settings: Partial<MobileSettings>) => void;
  resetMobileSettings: () => void;
}

const defaultSettings: MobileSettings = {
  touchControlsEnabled: true,
  joystickSize: 1,
  radialMenuSize: 1,
  hapticsEnabled: true,
  leftHandedMode: false,
  showTutorial: true,
};

/**
 * Mobile Settings Store
 * Manages mobile-specific user preferences with localStorage persistence
 */
export const useMobileSettingsStore = create<MobileSettingsState>()(
  persist(
    (set) => ({
      mobileSettings: defaultSettings,
      
      updateMobileSettings: (newSettings) =>
        set((state) => ({
          mobileSettings: {
            ...state.mobileSettings,
            ...newSettings,
          },
        })),
      
      resetMobileSettings: () =>
        set({
          mobileSettings: defaultSettings,
        }),
    }),
    {
      name: 'elite-striker-mobile-settings',
      partialize: (state) => ({
        mobileSettings: state.mobileSettings,
      }),
    }
  )
);

// Helper functions for common operations
export const mobileSettingsActions = {
  enableTouchControls: () =>
    useMobileSettingsStore.getState().updateMobileSettings({
      touchControlsEnabled: true,
    }),
  
  disableTouchControls: () =>
    useMobileSettingsStore.getState().updateMobileSettings({
      touchControlsEnabled: false,
    }),
  
  setJoystickSize: (size: number) =>
    useMobileSettingsStore.getState().updateMobileSettings({
      joystickSize: Math.max(0.8, Math.min(1.2, size)),
    }),
  
  setRadialMenuSize: (size: number) =>
    useMobileSettingsStore.getState().updateMobileSettings({
      radialMenuSize: Math.max(0.8, Math.min(1.2, size)),
    }),
  
  enableHaptics: () =>
    useMobileSettingsStore.getState().updateMobileSettings({
      hapticsEnabled: true,
    }),
  
  disableHaptics: () =>
    useMobileSettingsStore.getState().updateMobileSettings({
      hapticsEnabled: false,
    }),
  
  toggleLeftHandedMode: () => {
    const current = useMobileSettingsStore.getState().mobileSettings.leftHandedMode;
    useMobileSettingsStore.getState().updateMobileSettings({
      leftHandedMode: !current,
    });
  },
  
  hideTutorial: () =>
    useMobileSettingsStore.getState().updateMobileSettings({
      showTutorial: false,
    }),
  
  showTutorial: () =>
    useMobileSettingsStore.getState().updateMobileSettings({
      showTutorial: true,
    }),
};
