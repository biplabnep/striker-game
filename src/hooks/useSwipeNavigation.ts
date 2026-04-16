import { useState, useRef } from 'react';
import { useDrag } from '@use-gesture/react';
import { haptics } from '@/lib/haptics';

export interface UseSwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  blockVertical?: boolean;
  debounceMs?: number;
  hapticEnabled?: boolean;
}

export interface UseSwipeNavigationReturn {
  isSwiping: boolean;
  direction: 'left' | 'right' | null;
  bind: ReturnType<typeof useDrag>;
}

/**
 * Swipe Navigation Hook
 * Detects horizontal swipe gestures for screen transitions and navigation.
 * Uses velocity-based detection to distinguish intentional swipes from casual drags.
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  velocityThreshold = 0.3,
  blockVertical = false,
  debounceMs = 300,
  hapticEnabled = true,
}: UseSwipeNavigationOptions): UseSwipeNavigationReturn {
  const [isSwiping, setIsSwiping] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const lastSwipeTime = useRef<number>(0);

  const dragHandler = useDrag(
    ({
      active,
      movement: [mx, my],
      velocity: [vx],
      cancel,
    }) => {
      // Block vertical swipes if configured
      if (blockVertical && Math.abs(my) > Math.abs(mx)) {
        cancel();
        return;
      }

      // Track swiping state
      setIsSwiping(active);

      // On release, evaluate swipe
      if (!active) {
        const now = Date.now();
        const timeSinceLastSwipe = now - lastSwipeTime.current;

        // Check debounce
        if (timeSinceLastSwipe < debounceMs) {
          setDirection(null);
          return;
        }

        // Validate swipe criteria
        const isValidSwipe =
          Math.abs(mx) >= threshold &&
          Math.abs(vx) >= velocityThreshold;

        if (isValidSwipe) {
          const swipeDirection = mx > 0 ? 'right' : 'left';
          setDirection(swipeDirection);
          lastSwipeTime.current = now;

          // Trigger haptic feedback
          if (hapticEnabled) {
            haptics.light();
          }

          // Execute callbacks
          if (swipeDirection === 'left' && onSwipeLeft) {
            onSwipeLeft();
          } else if (swipeDirection === 'right' && onSwipeRight) {
            onSwipeRight();
          }

          // Clear direction after short delay
          setTimeout(() => setDirection(null), 200);
        } else {
          setDirection(null);
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      threshold: 10,
    }
  );

  return {
    isSwiping,
    direction,
    bind: dragHandler,
  };
}
