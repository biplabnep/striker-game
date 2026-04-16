import { useState, useRef, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { haptics } from '@/lib/haptics';

export interface UsePullToRefreshOptions {
  threshold?: number;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  hapticEnabled?: boolean;
}

export interface UsePullToRefreshReturn {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  bind: ReturnType<typeof useDrag>;
}

/**
 * Pull-to-Refresh Hook
 * Implements pull-to-refresh gesture for mobile devices with haptic feedback.
 * Tracks vertical pull distance and triggers refresh when threshold is exceeded.
 */
export function usePullToRefresh({
  threshold = 80,
  onRefresh,
  enabled = true,
  hapticEnabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const hasTriggeredHaptic = useRef(false);
  const hasReachedThreshold = useRef(false);

  // Calculate normalized progress (0 to 1.5)
  const progress = Math.min(pullDistance / threshold, 1.5);

  const dragHandler = useDrag(
    ({
      active,
      movement: [, my],
      direction: [, dy],
      cancel,
    }) => {
      if (!enabled) return;

      // Only respond to downward pulls (positive y movement)
      if (dy < 0) {
        cancel();
        return;
      }

      // Track pulling state
      if (active && my > 0) {
        setIsPulling(true);
        setPullDistance(my);

        // Haptic feedback on threshold crossing
        if (hapticEnabled) {
          if (my > 10 && !hasTriggeredHaptic.current) {
            haptics.light();
            hasTriggeredHaptic.current = true;
          }

          if (my >= threshold && !hasReachedThreshold.current) {
            haptics.medium();
            hasReachedThreshold.current = true;
          }
        }
      }

      // On release
      if (!active) {
        setIsPulling(false);
        hasTriggeredHaptic.current = false;
        hasReachedThreshold.current = false;

        if (pullDistance >= threshold && !isRefreshing) {
          // Trigger refresh
          setIsRefreshing(true);
          setPullDistance(threshold); // Snap to threshold during refresh

          onRefresh()
            .then(() => {
              if (hapticEnabled) haptics.success();
            })
            .catch((error) => {
              console.error('Pull-to-refresh failed:', error);
              if (hapticEnabled) haptics.error();
            })
            .finally(() => {
              setIsRefreshing(false);
              setPullDistance(0);
            });
        } else {
          // Reset if threshold not met
          setPullDistance(0);
        }
      }
    },
    {
      axis: 'y',
      filterTaps: true,
      enabled,
      preventDefault: true,
      rubberband: true,
    }
  );

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    progress,
    bind: dragHandler,
  };
}
