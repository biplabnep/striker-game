/**
 * Haptic Feedback Utility
 * Provides tactile feedback for mobile devices using the Vibration API
 * with graceful fallbacks for unsupported browsers.
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export interface HapticConfig {
  enabled: boolean;
}

// Default configuration - can be overridden by user settings
let config: HapticConfig = {
  enabled: true,
};

/**
 * Configure haptic feedback globally
 */
export function configureHaptics(newConfig: Partial<HapticConfig>) {
  config = { ...config, ...newConfig };
}

/**
 * Check if vibration is supported in the current browser
 */
export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with a predefined pattern
 * @param pattern - The type of haptic feedback to trigger
 */
export function triggerHaptic(pattern: HapticPattern): void {
  if (!config.enabled || !isVibrationSupported()) {
    return;
  }

  const patterns: Record<HapticPattern, number | number[]> = {
    light: 10,                    // Quick tap
    medium: 20,                   // Standard feedback
    heavy: [30, 50, 30],         // Strong double pulse
    success: [20, 30, 40],       // Positive confirmation
    error: [50, 30, 50, 30, 50], // Error alert
    warning: [30, 30, 30],       // Warning notification
  };

  try {
    navigator.vibrate(patterns[pattern]);
  } catch (error) {
    // Silently fail if vibration API throws an error
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Shorthand functions for common haptic patterns
 */
export const haptics = {
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  error: () => triggerHaptic('error'),
  warning: () => triggerHaptic('warning'),
};

/**
 * Context-aware haptic triggers for game events
 */
export const gameHaptics = {
  // Navigation
  menuTap: () => triggerHaptic('light'),
  screenTransition: () => triggerHaptic('medium'),
  tabSwitch: () => triggerHaptic('light'),

  // Actions
  buttonPress: () => triggerHaptic('light'),
  selectionConfirm: () => triggerHaptic('medium'),
  actionComplete: () => triggerHaptic('success'),

  // Game events
  goalScored: () => triggerHaptic('heavy'),
  matchStart: () => triggerHaptic('medium'),
  whistleBlow: () => triggerHaptic('warning'),
  foulCommitted: () => triggerHaptic('error'),
  substitution: () => triggerHaptic('light'),

  // Feedback
  success: () => triggerHaptic('success'),
  error: () => triggerHaptic('error'),
  warning: () => triggerHaptic('warning'),
};
