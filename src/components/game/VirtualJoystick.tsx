'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { haptics } from '@/lib/haptics';

interface VirtualJoystickProps {
  /** Size multiplier for the joystick (0.8 to 1.2) */
  size?: number;
  /** Callback when joystick value changes */
  onValueChange?: (value: { x: number; y: number }) => void;
  /** Whether the joystick is visible/active */
  visible?: boolean;
  /** Opacity of the joystick overlay */
  opacity?: number;
}

/**
 * Virtual Joystick Component
 * A touch-responsive circular joystick for mobile navigation.
 * Tracks touch movement relative to center point and emits directional vectors.
 */
export default function VirtualJoystick({
  size = 1,
  onValueChange,
  visible = true,
  opacity = 0.6,
}: VirtualJoystickProps) {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dimensions based on size multiplier
  const baseSize = 120 * size; // Base size in pixels
  const knobSize = 50 * size;
  const maxDistance = baseSize / 2 - knobSize / 2;

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;

      setIsActive(true);
      haptics.light();

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate initial position
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const clampedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(dy, dx);

      const newX = Math.cos(angle) * clampedDistance;
      const newY = Math.sin(angle) * clampedDistance;

      setPosition({ x: newX, y: newY });

      // Normalize output to -1 to 1 range
      if (onValueChange) {
        onValueChange({
          x: newX / maxDistance,
          y: newY / maxDistance,
        });
      }
    },
    [maxDistance, onValueChange]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isActive || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const clampedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(dy, dx);

      const newX = Math.cos(angle) * clampedDistance;
      const newY = Math.sin(angle) * clampedDistance;

      setPosition({ x: newX, y: newY });

      // Emit normalized values
      if (onValueChange) {
        onValueChange({
          x: newX / maxDistance,
          y: newY / maxDistance,
        });
      }
    },
    [isActive, maxDistance, onValueChange]
  );

  const handleEnd = useCallback(() => {
    setIsActive(false);
    setPosition({ x: 0, y: 0 });
    if (onValueChange) {
      onValueChange({ x: 0, y: 0 });
    }
  }, [onValueChange]);

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Mouse event handlers (for testing on desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isActive) {
      handleMove(e.clientX, e.clientY);
    }
  };

  const onMouseUp = () => {
    handleEnd();
  };

  const onMouseLeave = () => {
    if (isActive) {
      handleEnd();
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 left-4 select-none touch-none z-50"
      style={{
        width: baseSize,
        height: baseSize,
        opacity,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Joystick base */}
      <div
        className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-sm border-2 border-white/20"
        style={{
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Direction indicator gradient */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at ${50 + (position.x / maxDistance) * 50}% ${
              50 + (position.y / maxDistance) * 50
            }%, rgba(255, 165, 0, 0.3) 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Joystick knob */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg"
        style={{
          width: knobSize,
          height: knobSize,
          left: '50%',
          top: '50%',
          x: position.x - knobSize / 2,
          y: position.y - knobSize / 2,
          boxShadow: isActive
            ? '0 4px 12px rgba(255, 165, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
        }}
        animate={{
          scale: isActive ? 1.1 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      >
        {/* Center dot for visual feedback */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white/80" />
        </div>
      </motion.div>
    </div>
  );
}
