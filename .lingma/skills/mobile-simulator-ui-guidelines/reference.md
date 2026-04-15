# Mobile Simulator UI/UX - Technical Reference

## Touch Adaptation Kit (TAK) Specification

### Control Types Reference

#### Button Control

Basic interactive button that maps to gamepad input.

**Properties:**
```json
{
  "type": "button",
  "action": "a" | "b" | "x" | "y" | "leftBumper" | "rightBumper" |
            "leftTrigger" | "rightTrigger" | "view" | "menu",
  "pullAction": "same as action",  // Optional: drag outward to activate
  "toggle": true | false,          // Toggle state on press
  "styles": {
    "default": {
      "faceImage": {
        "type": "icon" | "image",
        "value": "iconName" | "path/to/image.png"
      },
      "backgroundColor": "#RRGGBBAA",
      "borderColor": "#RRGGBBAA",
      "size": 56
    },
    "pressed": { ... },   // Visual state when pressed
    "toggled": { ... },   // Visual state when toggled on
    "pulled": { ... }     // Visual state when pulled (if pullAction set)
  }
}
```

**Built-in Icons:**
`fire`, `aim`, `jump`, `crouch`, `reload`, `interact`, `use`, `attack`,
`defend`, `sprint`, `walk`, `inventory`, `map`, `settings`, `pause`

#### Joystick Control

Analog stick for movement or camera control.

**Properties:**
```json
{
  "type": "joystick",
  "axis": {
    "input": "axisX" | "axisY" | "axisXY",
    "output": "leftJoystick" | "rightJoystick" | "relativeMouseX" | "relativeMouseY",
    "deadzone": {
      "threshold": 0.05,    // 0.0 - 1.0, ignore small movements
      "radial": true         // Circular deadzone vs square
    },
    "sensitivity": 1.0       // Multiplier for input response
  },
  "action": "a" | "b" | ...,           // Optional: activate when threshold reached
  "actionThreshold": 2.5,               // Distance to trigger action
  "relative": true | false,             // Relative vs absolute positioning
  "styles": {
    "default": {
      "knob": {
        "size": 48,
        "faceImage": { "type": "icon", "value": "move" },
        "backgroundColor": "#FFFFFF80"
      },
      "base": {
        "size": 96,
        "backgroundColor": "#00000040"
      }
    },
    "activated": { ... }  // When action threshold exceeded
  }
}
```

**Absolute vs Relative:**
- **Absolute**: Joystick returns to center when released. Best for character movement.
- **Relative**: Joystick stays where dragged. Best for camera control or variable-speed movement.

#### Directional Pad (D-Pad)

Four-way or eight-way directional input.

**Properties:**
```json
{
  "type": "directionalPad",
  "interaction": {
    "activationType": "exclusive"  // "exclusive" = 4-way, "combined" = 8-way
  },
  "action": {
    "up": "dpadUp",
    "down": "dpadDown",
    "left": "dpadLeft",
    "right": "dpadRight"
  },
  "styles": {
    "default": {
      "size": 128,
      "backgroundColor": "#FFFFFF40",
      "indicatorColor": "#FFFFFFFF"
    }
  }
}
```

**When to Use:**
- Grid-based movement (tile games)
- Menu navigation
- Simple 4-directional or 8-directional character movement

#### Gyroscope Control

Device tilt/rotation input for camera or steering.

**Properties:**
```json
{
  "type": "gyroscope",
  "output": "relativeMouse" | "relativeJoystick",
  "sensitivity": {
    "x": 5.0,    // Horizontal sensitivity (degrees to units)
    "y": 2.5     // Vertical sensitivity
  },
  "invertY": true | false,  // Invert vertical axis
  "deadzone": 0.1,          // Ignore small tilts
  "clamp": {
    "minX": -90, "maxX": 90,   // Rotation limits in degrees
    "minY": -45, "maxY": 45
  }
}
```

**Best Practices:**
- Default rotation: 90° physical = 120° in-game
- Always provide joystick fallback
- Allow sensitivity customization in settings
- Test on devices without gyroscope

#### Touchpad Control

Large touch surface for gestures or combined actions.

**Properties:**
```json
{
  "type": "touchpad",
  "axis": [
    {
      "input": "axisX",
      "output": "relativeMouseX",
      "sensitivity": 5
    },
    {
      "input": "axisY",
      "output": "relativeMouseY",
      "sensitivity": 2.5
    }
  ],
  "renderAsButton": true,  // Show as button but track swipes
  "action": ["leftTrigger", "rightTrigger"],  // Actions on tap
  "swipeActions": {
    "up": "action1",
    "down": "action2",
    "left": "action3",
    "right": "action4"
  },
  "styles": {
    "default": {
      "width": 160,
      "height": 160,
      "backgroundColor": "#FFFFFF30",
      "faceImage": { "type": "icon", "value": "aim" }
    }
  }
}
```

### Zone & Slot System

Touch controls are positioned using zones and slots.

#### Zones

**Left Wheel:**
- Centered at 20% from left edge, 60% from top
- Radius: 120px on phones, 160px on tablets
- Contains inner ring + outer ring slots

**Right Wheel:**
- Centered at 80% from left edge, 60% from top
- Same radius as left wheel
- Mirror of left wheel layout

**Upper Zone:**
- Spans top 15% of screen
- Starts from corners, extends inward
- Used for menu/navigation buttons

**Lower Zone:**
- Spans bottom 10% of screen
- Centered horizontally
- Least accessible - use sparingly

#### Slot Positions

**Wheel Slots (numbered clockwise from top):**

```
        [7] [1]
      [8]  |  [2]
     [6] INNER [3]
      [5]  |  [4]
        [4] [5]
```

- **Inner Ring**: Single large control (movement or primary action)
- **Slot 1-2**: Upper outer (easy reach, secondary actions)
- **Slot 3**: Right outer
- **Slot 4-5**: Lower outer (comfortable for jump/dash)
- **Slot 6**: Left outer
- **Slot 7-8**: Upper-left outer (secondary movement actions)

**Slot Configuration:**
```json
{
  "leftWheel": {
    "inner": [ joystick_control ],
    "outer": [
      null,              // Slot 1
      null,              // Slot 2
      null,              // Slot 3
      handbrake_button,  // Slot 4
      null,              // Slot 5
      null,              // Slot 6
      horn_button,       // Slot 7
      null               // Slot 8
    ]
  }
}
```

### Control Clustering

Group multiple actions in single slot to save space.

**Outer Ring Cluster:**
```json
{
  "type": "controlCluster",
  "position": "outer",
  "slots": [1, 2],  // Occupies slots 1 and 2
  "controls": [
    {
      "type": "button",
      "action": "jump",
      "styles": { ... }
    },
    {
      "type": "button",
      "action": "dash",
      "styles": { ... }
    }
  ],
  "layout": "vertical"  // or "horizontal"
}
```

**Positioning Trick:**
Use `[control, null]` or `[null, control]` to shift single control slightly:
```json
// Control positioned more outward
[jump_button, null]

// Control positioned more inward
[null, jump_button]
```

### Layout Layers

Switch between different control sets based on game state.

**Layer Definition:**
```json
{
  "layers": [
    {
      "name": "driving",
      "active": true,
      "controls": { ... }
    },
    {
      "name": "onFoot",
      "active": false,
      "controls": { ... }
    },
    {
      "name": "cinematic",
      "active": false,
      "controls": {
        "upper-right": [{
          "type": "button",
          "action": "skipCutscene",
          "visibility": "onTouch"
        }]
      }
    }
  ]
}
```

**Switching Layers (Game Code):**
```cpp
// C++ example using XGameStreaming API
XGameStreamingSetTouchLayoutLayer("onFoot");
```

### Style Properties

Complete list of customizable visual properties.

**Button Styles:**
```json
{
  "size": 56,                      // Diameter in pixels
  "backgroundColor": "#FFFFFF80",  // RGBA hex color
  "borderColor": "#000000FF",
  "borderWidth": 2,
  "opacity": 0.8,
  "faceImage": {
    "type": "icon" | "image",
    "value": "iconName" | "assets/icons/fire.png",
    "size": 32,
    "color": "#FFFFFFFF"
  },
  "label": {
    "text": "Fire",
    "fontSize": 14,
    "color": "#FFFFFFFF",
    "position": "bottom"  // "top" | "bottom" | "left" | "right"
  }
}
```

**Joystick Styles:**
```json
{
  "knob": {
    "size": 48,
    "backgroundColor": "#FFFFFFCC",
    "borderColor": "#000000FF",
    "borderWidth": 2,
    "faceImage": { ... }
  },
  "base": {
    "size": 96,
    "backgroundColor": "#00000040",
    "borderColor": "#FFFFFF40",
    "borderWidth": 1
  },
  "trail": {
    "visible": true,
    "color": "#FFFFFF40",
    "width": 2
  }
}
```

### Complete Layout Example

Full driving simulator layout:

```json
{
  "version": "1.0",
  "name": "DrivingSimulatorLayout",
  "orientation": "landscape",
  "leftWheel": {
    "inner": [
      {
        "type": "joystick",
        "axis": {
          "input": "axisXY",
          "output": "leftJoystick",
          "deadzone": { "threshold": 0.05, "radial": true }
        },
        "relative": false,
        "styles": {
          "default": {
            "knob": {
              "size": 56,
              "faceImage": { "type": "icon", "value": "steering" }
            },
            "base": { "size": 112 }
          }
        }
      }
    ],
    "outer": [
      null,
      null,
      null,
      {
        "type": "button",
        "action": "leftBumper",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "handbrake" }
          }
        }
      },
      null,
      null,
      {
        "type": "button",
        "action": "x",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "horn" }
          }
        }
      },
      null
    ]
  },
  "rightWheel": {
    "inner": [
      {
        "type": "button",
        "action": "rightTrigger",
        "styles": {
          "default": {
            "size": 72,
            "faceImage": { "type": "icon", "value": "accelerate" }
          }
        }
      }
    ],
    "outer": [
      {
        "type": "button",
        "action": "leftTrigger",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "brake" }
          }
        }
      },
      null,
      null,
      {
        "type": "button",
        "action": "a",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "camera" }
          }
        }
      },
      null,
      null,
      null,
      null
    ]
  },
  "upper": [
    {
      "position": "upper-right",
      "type": "button",
      "action": "menu",
      "styles": {
        "default": {
          "faceImage": { "type": "icon", "value": "pause" }
        }
      }
    },
    {
      "position": "upper-left",
      "type": "button",
      "action": "view",
      "styles": {
        "default": {
          "faceImage": { "type": "icon", "value": "map" }
        }
      }
    }
  ]
}
```

## Responsive Design Specifications

### Breakpoints

Design for three size categories:

**Small Phones (< 5.5"):**
- Control wheel radius: 100px
- Button size: 48px minimum
- Font size: 14px minimum
- Edge margin: 24px

**Standard Phones (5.5" - 6.5"):**
- Control wheel radius: 120px
- Button size: 56px standard
- Font size: 16px standard
- Edge margin: 32px

**Tablets (> 7"):**
- Control wheel radius: 160px
- Button size: 64px
- Font size: 18px
- Edge margin: 48px
- Consider allowing two-handed grip (wider wheel spacing)

### Scaling Formula

Calculate responsive sizes:

```javascript
const baseWidth = 1920;  // Design reference width
const scaleFactor = screenWidth / baseWidth;

const buttonSize = 56 * scaleFactor;
const wheelRadius = 120 * scaleFactor;
const fontSize = 16 * scaleFactor;

// Clamp to reasonable ranges
const clampedButtonSize = Math.max(48, Math.min(72, buttonSize));
```

### Safe Areas

Account for device notches and system UI:

**iOS Safe Areas:**
- Top: 44px (notch) or 54px (Dynamic Island)
- Bottom: 34px (home indicator)
- Sides: 0px (full width)

**Android Safe Areas:**
- Varies by manufacturer
- Use system APIs to query
- Typical: 24-48px top, 0-48px bottom

**Implementation:**
```css
/* CSS approach for web-based games */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Performance Optimization

### Rendering Tips

**Maintain 60 FPS:**
- Limit visible controls to < 20 elements
- Use sprite sheets for icons (reduce draw calls)
- Avoid real-time blur effects
- Cache rendered control states

**Memory Management:**
- Compress icon images (PNG-8 or WebP)
- Reuse style objects across controls
- Unload unused layout layers

### Input Latency

**Target: < 50ms touch-to-action:**
- Poll touch input every frame (16ms at 60fps)
- Process input before rendering
- Use hardware-accelerated animations
- Avoid heavy computation during gameplay

## Testing Automation

### Automated Layout Validation

Use the validation script to check layouts:

```bash
python scripts/validate_layout.py layout.json --device iphone-se
python scripts/validate_layout.py layout.json --device ipad-air
python scripts/validate_layout.py layout.json --all-devices
```

**Checks Performed:**
- All controls within screen bounds
- Minimum spacing between controls (16px)
- Touch target sizes meet accessibility standards
- No overlapping control zones
- Color contrast ratios pass WCAG AA

### Manual Testing Protocol

**Test Sequence:**
1. **Reachability Test**: Hold device naturally, try to reach all controls without adjusting grip
2. **Simultaneous Input Test**: Press all possible control combinations
3. **Extended Play Test**: Play for 30 minutes, note any discomfort
4. **Lighting Test**: Use in bright sunlight and dark room
5. **One-Hand Test**: Try to play with one hand (should be possible for basic actions)

**Metrics to Track:**
- Accidental touch rate (< 5% acceptable)
- Missed input rate (< 3% acceptable)
- Time to perform common actions
- Player-reported comfort score (1-10)

## Integration Examples

### Unity Integration

```csharp
using UnityEngine;
using Xbox.GameStreaming;

public class TouchLayoutManager : MonoBehaviour
{
    public TextAsset drivingLayout;
    public TextAsset walkingLayout;

    void Start()
    {
        // Load initial layout
        XGameStreaming.SetTouchLayout(drivingLayout.text);
    }

    public void SwitchToWalkingMode()
    {
        XGameStreaming.SetTouchLayout(walkingLayout.text);
    }

    public void OnPlayerEnterVehicle()
    {
        XGameStreaming.SetTouchLayoutLayer("driving");
    }

    public void OnPlayerExitVehicle()
    {
        XGameStreaming.SetTouchLayoutLayer("onFoot");
    }
}
```

### Unreal Engine Integration

```cpp
#include "XGameStreaming.h"

void AGameMode::SetupTouchControls()
{
    FString LayoutJSON = LoadLayoutFromAsset("DrivingLayout");
    UXGameStreamingFunctionLibrary::SetTouchLayout(LayoutJSON);
}

void AGameMode::SwitchToCinematicMode()
{
    UXGameStreamingFunctionLibrary::SetTouchLayoutLayer("cinematic");
}
```

### Godot Integration

```gdscript
extends Node

var driving_layout: String
var walking_layout: String

func _ready():
    driving_layout = load_layout("res://layouts/driving.json")
    OS.set_touch_layout(driving_layout)

func switch_to_walking():
    walking_layout = load_layout("res://layouts/walking.json")
    OS.set_touch_layout(walking_layout)

func load_layout(path: String) -> String:
    var file = FileAccess.open(path, FileAccess.READ)
    return file.get_as_text()
```

## Troubleshooting

### Common Issues

**Problem: Controls feel unresponsive**
- Check: Deadzone threshold too high (reduce to 0.05)
- Check: Sensitivity too low (increase gradually)
- Check: Frame rate drops during input processing

**Problem: Accidental touches on system gestures**
- Solution: Increase edge margins to 48px
- Solution: Disable system gesture regions if platform allows
- Solution: Add slight delay to edge swipes

**Problem: Controls overlap on small screens**
- Solution: Reduce wheel radius for small devices
- Solution: Remove non-essential controls
- Solution: Use control clustering more aggressively

**Problem: Gyroscope drift**
- Solution: Implement calibration routine at startup
- Solution: Increase deadzone (0.1-0.15)
- Solution: Provide manual recalibration button

**Problem: Poor visibility in bright light**
- Solution: Increase opacity to 0.9-1.0
- Solution: Add outline/border to controls
- Solution: Offer high-contrast theme option

### Debugging Tools

**Visual Debug Mode:**
Enable to see touch zones and hit areas:
```json
{
  "debug": {
    "showZones": true,
    "showHitAreas": true,
    "showFPS": true,
    "logInput": true
  }
}
```

**Input Logging:**
Record all touch events for analysis:
```javascript
// Log format
{
  "timestamp": 1234567890,
  "type": "touchStart",
  "position": { "x": 240, "y": 480 },
  "control": "leftWheel.inner.joystick",
  "deviceId": 0
}
```

## Platform-Specific Notes

### iOS Human Interface Guidelines Compliance

**Required:**
- Respect all safe areas
- Support all device orientations you advertise
- Don't mimic system controls exactly
- Provide haptic feedback for important actions

**Recommended:**
- Use SF Symbols for consistency
- Support VoiceOver for accessibility
- Implement Dark Mode variants
- Test on latest 3 device generations

### Android Compatibility

**Fragmentation Handling:**
```java
// Detect device capabilities
boolean hasGyroscope = packageManager.hasSystemFeature(PackageManager.FEATURE_SENSOR_GYROSCOPE);
int screenSize = getResources().getConfiguration().screenLayout & Configuration.SCREENLAYOUT_SIZE_MASK;

if (!hasGyroscope) {
    // Fallback to touchpad controls
    loadLayoutWithoutGyro();
}

if (screenSize >= Configuration.SCREENLAYOUT_SIZE_LARGE) {
    // Tablet-optimized layout
    loadTabletLayout();
}
```

**Manufacturer Quirks:**
- Samsung: Some devices have aggressive battery optimization (disable for games)
- Xiaomi: MIUI may block background services
- Huawei: HMS devices lack Google Play Services
- OnePlus: Gaming Mode may interfere with touch input

Always test on target devices and provide workarounds.
