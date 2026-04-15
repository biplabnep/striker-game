# Mobile UI/UX Subagent Team

This document describes the specialized subagents created for transforming Elite Striker into a mobile-first football simulation game.

## 📱 Subagent Overview

### 1. **mobile-ui-specialist** 
**Purpose**: Phase 1 - Critical Touch Controls  
**File**: `.lingma/agents/mobile-ui-specialist.md`

**Responsibilities**:
- Virtual joystick implementation (left thumb zone)
- Radial action menus (right thumb zone)
- Haptic feedback system
- Touch target optimization (48px minimum)
- Safe area CSS for notched devices
- Thumb-zone compliant layouts

**When to Use**: 
> "Use mobile-ui-specialist to implement touch controls"

**Deliverables**:
- `VirtualJoystick.tsx` component
- `RadialMenu.tsx` component
- `haptic.ts` utility
- `TouchControls.tsx` overlay
- Updated `globals.css` with safe areas
- Modified `BottomNav.tsx` (hidden on mobile)

---

### 2. **mobile-gesture-specialist**
**Purpose**: Phase 2 - Advanced Gestures  
**File**: `.lingma/agents/mobile-gesture-specialist.md`

**Responsibilities**:
- Pinch-to-zoom for tactical boards
- Swipe navigation between screens
- Long-press for contextual actions
- Two-finger rotate gestures
- Pull-to-refresh functionality
- Gesture hints/tutorials

**When to Use**:
> "Use mobile-gesture-specialist to add gesture controls"

**Deliverables**:
- `@use-gesture/react` integration
- `useSwipeNavigation.ts` hook
- `useLongPress.ts` hook
- `usePullToRefresh.ts` hook
- Enhanced `TacticalFormationBoard.tsx`
- `GestureHints.tsx` component

---

### 3. **mobile-accessibility-specialist**
**Purpose**: Phase 3A - Accessibility & Customization  
**File**: `.lingma/agents/mobile-accessibility-specialist.md`

**Responsibilities**:
- Control customization (size, position, opacity)
- Left-handed mode (mirror layout)
- High contrast mode
- Colorblind-friendly palettes
- Text scaling (100%-150%)
- Reduce motion support
- Gyroscope sensitivity presets
- Portrait/landscape adaptation

**When to Use**:
> "Use mobile-accessibility-specialist to improve accessibility"

**Deliverables**:
- `settingsStore.ts` with persistence
- Comprehensive `SettingsPanel.tsx`
- High contrast CSS variables
- Colorblind SVG filters
- `useOrientation.ts` hook
- Responsive control positioning

---

### 4. **mobile-visual-polish-specialist**
**Purpose**: Phase 3B - Visual Polish & Immersion  
**File**: `.lingma/agents/mobile-visual-polish-specialist.md`

**Responsibilities**:
- Diegetic UI (status on jersey, clock on scoreboard)
- Cinematic mode for cutscenes
- Context-sensitive control visibility
- Muted color palette refinement
- Minimal HUD design
- Smooth page transitions
- Visual feedback systems

**When to Use**:
> "Use mobile-visual-polish-specialist to enhance visual design"

**Deliverables**:
- `DiegeticPlayerStatus.tsx` component
- `DiegeticMatchClock.tsx` component
- `CinematicMode.tsx` component
- `MinimalHUD.tsx` component
- `VisualFeedback.tsx` component
- `useContextSensitiveControls.ts` hook
- Refined Tailwind color palette

---

### 5. **mobile-ui-orchestrator** ⭐ MASTER
**Purpose**: Coordinate All Phases  
**File**: `.lingma/agents/mobile-ui-orchestrator.md`

**Responsibilities**:
- Assess current state
- Create implementation plan
- Delegate to specialized subagents
- Verify each phase completion
- Run integration tests
- Create documentation
- Build interactive tutorial
- Final review and handoff

**When to Use**:
> "Use mobile-ui-orchestrator to implement complete mobile transformation"

**Deliverables**:
- Complete phased implementation plan
- Coordination of all subagents
- Integration testing results
- `MOBILE_CONTROLS.md` documentation
- `MOBILE_IMPLEMENTATION.md` notes
- Interactive tutorial component
- Final success report

---

## 🎯 Implementation Strategy

### Recommended Approach: Orchestrator-Led

```bash
# Single command to start complete transformation
Use mobile-ui-orchestrator to implement all mobile UI/UX improvements
```

The orchestrator will:
1. ✅ Analyze codebase
2. ✅ Execute Phase 1 via mobile-ui-specialist
3. ✅ Execute Phase 2 via mobile-gesture-specialist
4. ✅ Execute Phase 3A via mobile-accessibility-specialist
5. ✅ Execute Phase 3B via mobile-visual-polish-specialist
6. ✅ Run comprehensive tests
7. ✅ Generate documentation
8. ✅ Provide final report

**Estimated Time**: 3-4 hours for complete implementation

---

### Alternative: Phase-by-Phase

If you prefer manual control:

```bash
# Phase 1
Use mobile-ui-specialist to implement touch controls

# Phase 2
Use mobile-gesture-specialist to add gesture controls

# Phase 3A
Use mobile-accessibility-specialist to improve accessibility

# Phase 3B
Use mobile-visual-polish-specialist to enhance visuals
```

---

## 📊 Expected Outcomes

### Before Transformation
- ❌ Desktop-only web interface
- ❌ Tiny buttons hard to tap
- ❌ No touch optimization
- ❌ Poor mobile experience
- ❌ Not accessible

### After Transformation
- ✅ Virtual joystick navigation
- ✅ Radial action menus
- ✅ Intuitive gestures (pinch, swipe, long-press)
- ✅ Fully customizable controls
- ✅ Accessible to all players
- ✅ Beautiful diegetic UI
- ✅ 60fps performance
- ✅ Premium mobile experience

---

## 🔧 Technical Stack

**Libraries Added**:
- `@use-gesture/react` - Gesture recognition
- `framer-motion` - Already installed (animations)
- `zustand` - Already installed (state management)

**No Breaking Changes**:
- Desktop functionality preserved
- Existing components enhanced, not replaced
- Backward compatible
- Progressive enhancement approach

---

## 📝 Usage Examples

### Example 1: Quick Start
```
Use mobile-ui-orchestrator to begin Phase 1 implementation
```

### Example 2: Specific Phase
```
Use mobile-ui-specialist to create virtual joystick and radial menu
```

### Example 3: Fix Issue
```
Use mobile-accessibility-specialist to add left-handed mode support
```

### Example 4: Enhancement
```
Use mobile-visual-polish-specialist to create diegetic match clock
```

---

## 🎓 Learning Resources

Each subagent includes:
- Detailed implementation guides
- Code examples and snippets
- Best practices and constraints
- Testing checklists
- Troubleshooting tips

Refer to individual subagent files for complete documentation.

---

## 🚀 Getting Started

1. **Review this document** to understand the team
2. **Choose your approach** (orchestrator vs. manual)
3. **Activate the subagent** using the commands above
4. **Monitor progress** through status updates
5. **Test thoroughly** after each phase
6. **Provide feedback** for iteration

---

## 💡 Pro Tips

1. **Start with Orchestrator**: Let it manage complexity
2. **Test on Real Devices**: Simulators aren't enough
3. **Iterate Based on Feedback**: First pass won't be perfect
4. **Document Issues**: Help improve future implementations
5. **Share Learnings**: Update subagents with new insights

---

## 📞 Support

If you encounter issues:
1. Check the specific subagent's constraints section
2. Review the testing checklist
3. Verify all prerequisites are met
4. Consult the implementation notes in each subagent

---

**Created**: April 15, 2026  
**Project**: Elite Striker Football Simulation  
**Goal**: Transform web game into premium mobile experience  
**Status**: Ready for implementation ✨
