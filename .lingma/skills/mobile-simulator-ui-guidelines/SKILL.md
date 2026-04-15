---
name: mobile-simulator-ui-guidelines
description: Design UI/UX for mobile simulator games following ergonomic principles, thumb zone patterns, minimal HUD design, and touch control best practices. Use when creating mobile simulation games, designing game interfaces, implementing touch controls, or building simulator game HUDs.
---

# Mobile Simulator Game UI/UX Design Guidelines

## Core Principles

### 1. Thumb Zone Ergonomics

Mobile devices have natural grip zones. Design around where thumbs can comfortably reach:

**Comfortable Zones (Priority Order):**
- **Left/Right Wheels**: Primary gameplay actions (70% of interaction time)
- **Upper Corners**: Infrequent menu/navigation actions
- **Lower Center**: Least used - avoid critical controls here

**Design Rules:**
- Place movement controls in left wheel inner ring
- Place primary action (shoot/jump/use) in right wheel inner ring
- Secondary actions go in outer rings (slots 1-8)
- Menu/pause buttons in upper corners
- Never place critical controls in lower corners

### 2. Minimal Control Philosophy

Simulator games thrive on immersion. Keep UI invisible:

**Maximum Controls:**
- 2 simultaneous inputs (left + right thumb)
- 4-6 total visible controls during active gameplay
- Hide menus until needed

**Progressive Disclosure:**
- Show basic controls first
- Unlock advanced controls as player learns
- Context-sensitive controls appear only when relevant

### 3. Diegetic HUD Design

Integrate UI into the game world when possible:

**Examples:**
- Health displayed on character's suit/backpack
- Fuel gauge on vehicle dashboard
- Ammo count on weapon model
- Speed shown on vehicle speedometer

**Non-Diegetic Fallback:**
- Use semi-transparent overlays (opacity 0.6-0.8)
- Corner placement to avoid center screen
- Muted colors that don't compete with gameplay

## Touch Control Layout Patterns

### Pattern 1: Vehicle Simulator (Driving/Flying)

```
LEFT WHEEL:
- Inner: Steering joystick (absolute, non-relative)
- Outer slot 7-8: Horn/light toggle
- Outer slot 4-5: Handbrake

RIGHT WHEEL:
- Inner: Accelerate button (large hit area)
- Outer slot 1-2: Brake
- Outer slot 4-5: Gear shift/camera toggle

UPPER:
- Upper-right: Pause/menu
- Upper-left: Map/inventory

LOWER:
- Avoid placing controls here
```

**Special Considerations:**
- Use gyroscope for steering (optional toggle)
- Tilt device for camera look (gyroscope)
- Pull-action: Press brake → pull down for handbrake

### Pattern 2: Life/Business Simulator

```
LEFT WHEEL:
- Inner: Movement D-pad (4-way for grid-based, 8-way for free movement)
- Outer slot 7-8: Interact/use item
- Outer slot 4-5: Run/sprint toggle

RIGHT WHEEL:
- Inner: Primary action (contextual: talk/buy/build)
- Outer slot 1-2: Jump/climb
- Outer slot 4-5: Inventory quick-access

UPPER:
- Upper-right: Menu/settings
- Upper-left: Quest log/map

LOWER:
- Optional: Quick-emote wheel (tap to open radial menu)
```

**Special Considerations:**
- Radial menus for complex interactions
- Long-press for contextual actions
- Native touch for inventory management (drag & drop)

### Pattern 3: Construction/Management Simulator

```
LEFT WHEEL:
- Inner: Camera pan joystick (relative)
- Outer slot 7-8: Zoom in/out
- Outer slot 4-5: Rotate view

RIGHT WHEEL:
- Inner: Place/build button
- Outer slot 1-2: Delete/cancel
- Outer slot 4-5: Tool selector (opens radial menu)

UPPER:
- Upper-right: Build menu categories
- Upper-left: Resources/status panel

LOWER:
- Avoid controls here (reserved for info display)
```

**Special Considerations:**
- Pinch-to-zoom gesture support
- Two-finger rotate gesture
- Tap-to-select, drag-to-place pattern
- Ghost preview before placement

## Control Type Guidelines

### Joysticks

**Use Absolute (Non-Relative) When:**
- Character movement in simulators
- Precise positioning required
- Speed doesn't vary with stick position

**Use Relative When:**
- Camera control
- Variable speed movement (walk/run based on tilt)
- Menu navigation

**Configuration:**
```json
{
  "type": "joystick",
  "axis": {
    "input": "axisXY",
    "output": "leftJoystick",
    "deadzone": {
      "threshold": 0.05,
      "radial": true
    }
  },
  "styles": {
    "default": {
      "knob": {
        "faceImage": {
          "type": "icon",
          "value": "move"
        }
      }
    }
  }
}
```

### Buttons

**Pull-Action Pattern:**
For combined actions (aim+fire, sprint+jump):

```json
{
  "type": "button",
  "action": "leftTrigger",
  "pullAction": "rightTrigger",
  "styles": {
    "default": {
      "faceImage": {
        "type": "icon",
        "value": "aim"
      }
    },
    "pulled": {
      "faceImage": {
        "type": "icon",
        "value": "fire"
      }
    }
  }
}
```

**Button Clustering:**
Group related actions to save space:
```json
["jump", null]  // Single button positioned outward
[jump, dash]     // Two buttons split vertically
```

### Gyroscope Controls

**Best For:**
- Camera aiming in first/third-person views
- Vehicle steering (cars, planes)
- Fine adjustments combined with joystick

**Configuration:**
```json
{
  "type": "gyroscope",
  "output": "relativeMouse",
  "sensitivity": {
    "x": 5.0,
    "y": 2.5
  }
}
```

**Fallback:** Always provide joystick alternative for devices without gyroscope

## Visual Design Standards

### Color Palette

**Simulator Game Colors:**
- Primary UI: White/Light gray (#FFFFFF, #E0E0E0) at 80% opacity
- Interactive elements: Blue accent (#2196F3)
- Warning/alert: Orange (#FF9800) - use sparingly
- Critical: Red (#F44336) - emergencies only
- Success: Green (#4CAF50) - confirmations

**Avoid:**
- Pure black backgrounds (too harsh)
- Saturated colors (distract from simulation)
- More than 3 accent colors

### Typography

**Font Choices:**
- Sans-serif only (Roboto, Open Sans, system fonts)
- Minimum 14px body text
- Minimum 18px interactive labels
- Bold for important values only

**Hierarchy:**
- H1: 24px - Section headers
- H2: 20px - Subsections
- Body: 14-16px - Instructions, descriptions
- Caption: 12px - Secondary info

### Iconography

**Style:**
- Flat, minimalist icons
- 2px stroke width minimum
- Consistent visual weight
- Recognizable symbols over text

**Common Simulator Icons:**
- ⚙ Settings/gear
- 📍 Location/map pin
- 🔧 Build/construct
- 💰 Currency/money
- ⛽ Fuel/energy
- 📦 Inventory/storage
- ▶ Play/start
- ⏸ Pause

### Spacing & Layout

**Touch Target Sizes:**
- Minimum: 48x48 pixels (7-10mm)
- Recommended: 56x56 pixels
- Critical actions: 64x64 pixels

**Spacing:**
- Between controls: 16px minimum
- Control clusters: 24px separation
- Edge margins: 32px from screen edges

## Immersion Techniques

### Cinematic Mode

During cutscenes/narrative moments:

**Hide All Controls:**
- Fade out UI completely
- Show only skip button (upper-right corner)
- Detect touch input to show minimal overlay

**Implementation:**
```json
{
  "layer": "cinematic",
  "controls": [
    {
      "type": "button",
      "position": "upper-right",
      "action": "skipCutscene",
      "visibility": "onTouch"
    }
  ]
}
```

### Context-Sensitive UI

Show controls only when relevant:

**Examples:**
- Build tools appear near construction sites
- Dialogue options fade in near NPCs
- Driving controls hide when parked
- Flight instruments show only in aircraft

**Transition:**
- Fade in/out over 200-300ms
- Slide from edge of screen
- Scale up from interaction point

### Haptic Feedback

Enhance touch feedback:

**Patterns:**
- Light tap: Button press confirmation
- Medium pulse: Action completed
- Strong vibration: Error/warning
- Continuous rumble: Engine/machinery active

## Accessibility Requirements

### Essential Features

**Customization:**
- Control size adjustment (80%-120%)
- Control repositioning (drag to move)
- Sensitivity sliders (gyroscope, joystick)
- Left-handed mode (mirror layout)

**Visual Aids:**
- High contrast mode toggle
- Colorblind-friendly palette option
- Text size scaling (100%-150%)
- Button label visibility toggle

**Input Assistance:**
- Toggle vs hold options for actions
- Auto-center joystick option
- Gyroscope sensitivity presets (low/medium/high)
- Touch-and-hold delay adjustment

### Testing Checklist

Before release, verify:

- [ ] All controls reachable on 4.7" phone (iPhone SE size)
- [ ] All controls reachable on 10" tablet
- [ ] Two-thumb gameplay comfortable for 30+ minutes
- [ ] No accidental touches on system gestures
- [ ] Works without gyroscope (fallback controls)
- [ ] Portrait and landscape orientations supported
- [ ] Colorblind players can distinguish all states
- [ ] Text readable without zooming

## Platform-Specific Adaptations

### iOS (iPhone/iPad)

**Considerations:**
- Respect safe areas (notch, home indicator)
- Support Dynamic Island on newer models
- Handle swipe-from-edge gestures carefully
- Test on both Face ID and Touch ID devices

**Optimization:**
- Use SF Symbols for native feel
- Support haptic feedback (CoreHaptics)
- Implement 3D Touch/long-press previews

### Android

**Considerations:**
- Vast screen size variety (4.7" to 12"+)
- Different aspect ratios (18:9, 19.5:9, 20:9)
- Back button/gesture navigation
- Fragmented hardware capabilities

**Optimization:**
- Responsive layouts (percentage-based positioning)
- Detect and disable unsupported sensors
- Provide low-end device mode (simplified UI)
- Test on Samsung, Xiaomi, Pixel devices

## Implementation Workflow

### Step 1: Define Control Priority

List all game actions by frequency:

```
Primary (constant use):
- Movement/steering
- Primary action (accelerate/shoot/build)

Secondary (frequent use):
- Jump/brake
- Camera control
- Item selection

Tertiary (occasional use):
- Menu access
- Map/inventory
- Settings

Rare (infrequent use):
- Pause/quit
- Tutorial help
- Social features
```

### Step 2: Create Wireframe Layout

Sketch control positions:

1. Draw device outline
2. Mark thumb grip zones (wheels)
3. Place primary controls in wheels
4. Add secondary controls in outer rings
5. Position tertiary in upper/lower zones
6. Leave center 60% clear for gameplay

### Step 3: Prototype & Test

**Testing Protocol:**
1. Play for 15 minutes continuously
2. Note any uncomfortable reaches
3. Identify accidental touches
4. Check control conflicts
5. Verify all actions accessible simultaneously

**Iterate:**
- Move controls causing strain
- Increase hit areas for missed inputs
- Reduce control count if overwhelmed
- Add/remove clustering as needed

### Step 4: Polish Visual Design

**Final Touches:**
- Apply custom iconography matching game art style
- Add subtle animations (button press, joystick movement)
- Implement smooth transitions between states
- Test color contrast in various lighting conditions

## Common Mistakes to Avoid

### ❌ Don't Do This

**Control Overload:**
- More than 8 visible controls simultaneously
- Placing buttons in hard-to-reach corners
- Requiring 3+ simultaneous touches

**Poor Placement:**
- Critical controls in lower center (hard to reach)
- Movement controls too close to screen edge
- Overlapping control zones

**Visual Clutter:**
- Bright, saturated UI competing with gameplay
- Too many notifications/toasts
- Complex menus blocking game view

**Ignoring Ergonomics:**
- Not testing on actual devices
- Assuming all players have large hands
- Forgetting about device bezels/cases

### ✅ Do This Instead

**Minimalist Approach:**
- Start with 4 essential controls
- Add more only if absolutely necessary
- Use context-sensitive appearance

**Thumb-Friendly Layout:**
- Keep controls in comfortable arc from grip point
- Allow slight repositioning based on preference
- Provide larger targets for frequent actions

**Subtle Visual Design:**
- Semi-transparent backgrounds
- Muted colors that complement game art
- Clear visual hierarchy

**Extensive Testing:**
- Test on multiple device sizes
- Get feedback from different hand sizes
- Observe real players struggling (then fix it)

## Additional Resources

For detailed implementation examples and advanced patterns:
- See [reference.md](reference.md) for complete API documentation
- See [examples.md](examples.md) for genre-specific layouts
- See [scripts/validate_layout.py](scripts/validate_layout.py) for automated testing
