'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/haptics';

export interface RadialAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color?: string;
  onClick: () => void;
}

interface RadialMenuProps {
  actions: RadialAction[];
  visible?: boolean;
  size?: number; // multiplier 0.8-1.2
  position?: 'bottom-right' | 'bottom-left';
}

/**
 * Radial Menu Component
 * A circular menu that displays action buttons in a radial pattern.
 * Optimized for mobile touch interactions with haptic feedback.
 */
export default function RadialMenu({
  actions,
  visible = true,
  size = 1,
  position = 'bottom-right',
}: RadialMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate dimensions based on size multiplier
  const baseSize = 140 * size;
  const centerButtonSize = 56 * size;
  const actionButtonSize = 48 * size;
  const radius = 70 * size; // Distance from center to action buttons

  // Calculate positions for action buttons in a circle
  const actionPositions = useMemo(() => {
    const totalActions = actions.length;
    const angleStep = (2 * Math.PI) / totalActions;
    // Start from top (-PI/2) and distribute evenly
    const startAngle = -Math.PI / 2;

    return actions.map((_, index) => {
      const angle = startAngle + index * angleStep;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return { x, y };
    });
  }, [actions.length, radius]);

  const handleToggle = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    haptics.medium();
  }, [isOpen]);

  const handleActionClick = useCallback(
    (action: RadialAction) => {
      action.onClick();
      haptics.success();
      setIsOpen(false);
    },
    []
  );

  const handleClose = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      haptics.light();
    }
  }, [isOpen]);

  if (!visible) return null;

  const isRightPosition = position === 'bottom-right';

  return (
    <div
      className="fixed select-none touch-none z-50"
      style={{
        bottom: '80px',
        [isRightPosition ? 'right' : 'left']: '20px',
        width: baseSize,
        height: baseSize,
      }}
    >
      {/* Backdrop when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-full"
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen &&
          actionPositions.map((pos, index) => {
            const action = actions[index];
            return (
              <motion.button
                key={action.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  delay: index * 0.05,
                }}
                className="absolute flex flex-col items-center justify-center"
                style={{
                  left: '50%',
                  top: '50%',
                  x: pos.x - actionButtonSize / 2,
                  y: pos.y - actionButtonSize / 2,
                  width: actionButtonSize,
                  height: actionButtonSize,
                }}
                onClick={() => handleActionClick(action)}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center shadow-lg border-2"
                  style={{
                    backgroundColor: action.color || '#1e293b',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div className="text-white">{action.icon}</div>
                </div>
                <span className="text-[10px] font-medium text-white mt-1 drop-shadow-md">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
      </AnimatePresence>

      {/* Center button */}
      <motion.button
        className="absolute rounded-full flex items-center justify-center shadow-lg border-2"
        style={{
          width: centerButtonSize,
          height: centerButtonSize,
          left: '50%',
          top: '50%',
          x: '-50%',
          y: '-50%',
          background: isOpen
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          boxShadow: isOpen
            ? '0 4px 16px rgba(239, 68, 68, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)'
            : '0 4px 16px rgba(249, 115, 22, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
        }}
        animate={{
          scale: isOpen ? 0.9 : 1,
          rotate: isOpen ? 45 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        onClick={handleToggle}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="text-white"
          animate={{
            rotate: isOpen ? -45 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        >
          {isOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}
