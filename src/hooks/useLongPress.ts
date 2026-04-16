import { useState, useRef, useCallback, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { haptics } from '@/lib/haptics';

export interface UseLongPressOptions {
  onPressStart?: () => void;
  onPressComplete?: () => void;
  onCancel?: () => void;
  duration?: number;
  moveThreshold?: number;
  hapticEnabled?: boolean;
  disabled?: boolean;
}

export interface UseLongPressReturn {
  isPressed: boolean;
  pressDuration: number;
  bind: ReturnType<typeof useDrag>;
}

/**
 * Long Press Hook
 * Detects long-press gestures for contextual actions and detail views.
 * Provides visual feedback through scale animation and haptic patterns.
 */
export function useLongPress({
  onPressStart,
  onPressComplete,
  onCancel,
  duration = 500,
  moveThreshold = 10,
  hapticEnabled = true,
  disabled = false,
}: UseLongPressOptions): UseLongPressReturn {
  const [isPressed, setIsPressed] = useState(false);
  const [pressDuration, setPressDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Update press duration for visual feedback
  const updateDuration = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      setPressDuration(elapsed);
      animationFrameRef.current = requestAnimationFrame(updateDuration);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const dragHandler = useDrag(
    ({
      active,
      movement: [mx, my],
      first,
      last,
      cancel,
    }) => {
      if (disabled) return;

      // Check movement threshold
      const distance = Math.sqrt(mx * mx + my * my);
      if (distance > moveThreshold) {
        // Cancel long press if moved too far
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        setIsPressed(false);
        setPressDuration(0);

        if (isPressed && onCancel) {
          onCancel();
        }
        return;
      }

      // Press started
      if (first && !isPressed) {
        setIsPressed(true);
        startTimeRef.current = Date.now();
        setPressDuration(0);

        // Start duration tracking
        animationFrameRef.current = requestAnimationFrame(updateDuration);

        // Haptic feedback on start
        if (hapticEnabled) {
          haptics.light();
        }

        if (onPressStart) {
          onPressStart();
        }

        // Set timer for completion
        timerRef.current = setTimeout(() => {
          if (hapticEnabled) {
            haptics.success();
          }

          if (onPressComplete) {
            onPressComplete();
          }
        }, duration);
      }

      // Press ended
      if (last) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        setIsPressed(false);
        setPressDuration(0);
        startTimeRef.current = null;
      }
    },
    {
      filterTaps: false,
      threshold: 0,
      enabled: !disabled,
    }
  );

  return {
    isPressed,
    pressDuration,
    bind: dragHandler,
  };
}
