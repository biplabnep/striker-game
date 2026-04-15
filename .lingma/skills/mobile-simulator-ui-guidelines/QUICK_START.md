# Mobile Simulator UI Design - Quick Reference Card

## Thumb Zone Layout

```
┌─────────────────────────────────────┐
│  [MAP]                     [PAUSE]  │  ← Upper zone (infrequent)
│                                     │
│     ○                           ○   │
│   ○   ○                       ○   ○ │  ← Wheel outer rings
│     LEFT                        RIGHT │    (secondary actions)
│   ○   ○                       ○   ○ │
│     ○       GAMEPLAY            ○   │
│               AREA                  │
│           (keep clear!)             │
│                                     │
│                                     │  ← Lower zone (avoid)
└─────────────────────────────────────┘
```

## Control Priority Matrix

| Frequency | Location | Examples |
|-----------|----------|----------|
| **Constant** | Wheel inner rings | Movement, primary action |
| **Frequent** | Wheel outer rings | Jump, brake, interact |
| **Occasional** | Upper corners | Menu, map, inventory |
| **Rare** | Hide in menus | Settings, help, quit |

## Size Guidelines

```
Button Sizes (pixels):
  Minimum:      48px ━━━━━━━━
  Standard:     56px ━━━━━━━━━━
  Primary:      64-72px ━━━━━━━━━━━━
  Critical:     80px+ ━━━━━━━━━━━━━━

Spacing:
  Between controls:  16px minimum
  Edge margins:      32px (phone), 48px (tablet)

Wheel Radius:
  Phones:  120px
  Tablets: 160px
```

## Color System

```
Primary UI:        #FFFFFF @ 80% opacity
Interactive:       #2196F3 (Blue)
Warning:           #FF9800 (Orange) - sparingly
Critical:          #F44336 (Red) - emergencies only
Success:           #4CAF50 (Green) - confirmations
Backgrounds:       #000000 @ 40-60% opacity
```

## Genre-Specific Patterns

### Racing/Driving
- Left: Steering joystick + handbrake
- Right: Gas (large) + Brake + Camera
- Use gyroscope for steering (optional)

### Flight
- Left: Control stick + trim/flaps
- Right: Touchpad aim + fire (combined)
- Gyroscope for camera look

### Farming
- Left: Steering + implement controls
- Right: Accelerate + Interact
- Switch to D-pad when on foot

### City Builder
- Left: Camera pan + zoom/rotate
- Right: Place + Cancel
- Radial menu for building types

## Accessibility Checklist

- [ ] All controls reachable on small phones
- [ ] One-handed mode available
- [ ] Control size adjustable (80-120%)
- [ ] High contrast mode
- [ ] Gyroscope fallback present
- [ ] Pause button always accessible
- [ ] Text readable without zoom

## Common Mistakes

❌ **Don't:**
- Put buttons in lower corners
- Show 10+ controls at once
- Use neon colors everywhere
- Require 3-finger combinations
- Block center of screen

✅ **Do:**
- Keep controls in thumb arcs
- Start with 4-6 visible controls
- Use muted, semi-transparent UI
- Combine actions with pull gestures
- Leave gameplay area clear

## Validation Commands

```bash
# Quick test (default device)
python scripts/validate_layout.py layout.json

# Test specific device
python scripts/validate_layout.py layout.json --device iphone-se

# Full compatibility check
python scripts/validate_layout.py layout.json --all-devices
```

## Implementation Snippet

```json
{
  "leftWheel": {
    "inner": [ movement_joystick ],
    "outer": [ null, null, null, secondary_action, ... ]
  },
  "rightWheel": {
    "inner": [ primary_action_button ],
    "outer": [ tertiary_action, null, null, jump_action, ... ]
  },
  "upper": [
    { "position": "upper-right", "type": "button", "action": "menu" }
  ]
}
```

## Progressive Disclosure

**Session 1 (Tutorial):**
- Show: Movement + 1 action
- Hide: Everything else

**Session 2-3:**
- Unlock: Secondary controls
- Add: Basic menus

**Experienced:**
- Full control set
- Advanced gestures
- Custom layouts

---

**Golden Rule**: If players notice your UI, you've failed. Great simulator UI is invisible.
