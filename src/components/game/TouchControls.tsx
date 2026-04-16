'use client';

import React, { useMemo } from 'react';
import VirtualJoystick from './VirtualJoystick';
import RadialMenu, { RadialAction } from './RadialMenu';
import { useGameStore } from '@/store/gameStore';
import { isTouchDevice, shouldShowTouchControls } from '@/lib/device';

interface TouchControlsProps {
  showJoystick?: boolean;
  showRadialMenu?: boolean;
  joystickSize?: number;
  radialMenuSize?: number;
  radialActions?: RadialAction[];
  onJoystickChange?: (value: { x: number; y: number }) => void;
}

/**
 * TouchControls Overlay Component
 * Manages all touch control overlays and their visibility based on device detection and user settings.
 * Provides a unified interface for integrating touch controls into game screens.
 */
export default function TouchControls({
  showJoystick = false,
  showRadialMenu = false,
  joystickSize = 1,
  radialMenuSize = 1,
  radialActions = [],
  onJoystickChange,
}: TouchControlsProps) {
  const touchControlsEnabled = useGameStore((state) => state.mobileSettings?.touchControlsEnabled ?? true);
  const isInMatch = useGameStore((state) => state.screen === 'match_day' || state.screen === 'match_day_live');

  // Determine if touch controls should be shown
  const shouldShow = useMemo(() => {
    // Check if user has enabled touch controls
    if (!touchControlsEnabled) return false;

    // Check if this is a touch-capable device
    if (!isTouchDevice()) return false;

    // Check if we should show controls based on context
    if (!shouldShowTouchControls()) return false;

    return true;
  }, [touchControlsEnabled]);

  // Don't render anything if conditions aren't met
  if (!shouldShow) return null;

  return (
    <>
      {/* Virtual Joystick - Left side for navigation */}
      {showJoystick && (
        <VirtualJoystick
          size={joystickSize}
          visible={shouldShow}
          onValueChange={onJoystickChange}
          opacity={0.7}
        />
      )}

      {/* Radial Menu - Right side for actions */}
      {showRadialMenu && radialActions.length > 0 && (
        <RadialMenu
          actions={radialActions}
          visible={shouldShow}
          size={radialMenuSize}
          position="bottom-right"
        />
      )}
    </>
  );
}
