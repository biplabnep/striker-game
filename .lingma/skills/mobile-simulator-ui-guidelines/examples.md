# Mobile Simulator UI/UX - Genre Examples

Complete layout examples for different simulator game types.

## Example 1: Racing Simulator

### Game Context
- First or third-person driving
- Realistic vehicle physics
- Multiple camera angles
- Pit stops and vehicle management

### Control Layout

```json
{
  "name": "RacingSimulatorLayout",
  "version": "1.0",
  "leftWheel": {
    "inner": [
      {
        "type": "joystick",
        "axis": {
          "input": "axisX",
          "output": "leftJoystick",
          "deadzone": { "threshold": 0.05, "radial": false }
        },
        "relative": false,
        "styles": {
          "default": {
            "knob": {
              "size": 64,
              "faceImage": {
                "type": "image",
                "value": "assets/icons/steering_wheel.png"
              },
              "backgroundColor": "#FFFFFF90"
            },
            "base": {
              "size": 128,
              "backgroundColor": "#00000030"
            }
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
        "pullAction": "rightBumper",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "handbrake" },
            "backgroundColor": "#FF9800AA"
          },
          "pulled": {
            "faceImage": { "type": "icon", "value": "drift" },
            "backgroundColor": "#FF5722CC"
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
      {
        "type": "button",
        "action": "y",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "lights" }
          }
        }
      }
    ]
  },
  "rightWheel": {
    "inner": [
      {
        "type": "button",
        "action": "rightTrigger",
        "styles": {
          "default": {
            "size": 80,
            "faceImage": { "type": "icon", "value": "gas_pedal" },
            "backgroundColor": "#4CAF50AA"
          },
          "pressed": {
            "backgroundColor": "#4CAF50FF"
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
            "size": 72,
            "faceImage": { "type": "icon", "value": "brake_pedal" },
            "backgroundColor": "#F44336AA"
          },
          "pressed": {
            "backgroundColor": "#F44336FF"
          }
        }
      },
      {
        "type": "button",
        "action": "a",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "gear_up" }
          }
        }
      },
      null,
      {
        "type": "button",
        "action": "b",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "gear_down" }
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
          "faceImage": { "type": "icon", "value": "rearview_mirror" }
        }
      }
    }
  ],
  "gyroscope": {
    "enabled": true,
    "output": "relativeMouse",
    "sensitivity": { "x": 3.0, "y": 0 },
    "usage": "camera_look",
    "toggleButton": "dpadUp"
  }
}
```

### HUD Elements

**Dashboard (Diegetic):**
- Speedometer on dashboard (bottom-center of screen)
- Tachometer next to speedometer
- Gear indicator (large number, center-bottom)
- Fuel gauge on dashboard

**Overlay UI:**
- Position indicator (top-left): `P3/12`
- Lap timer (top-center): `1:23.456`
- Mini-map (top-right, circular, semi-transparent)
- Damage indicator (when damaged, fades out)

**Progressive Disclosure:**
- First race: Only steering, gas, brake visible
- After tutorial: Handbrake unlocked
- Advanced: Manual transmission controls appear

---

## Example 2: Flight Simulator

### Game Context
- Aircraft control (plane/helicopter)
- Complex instrument panel
- Navigation systems
- Combat or cargo missions

### Control Layout

```json
{
  "name": "FlightSimulatorLayout",
  "version": "1.0",
  "leftWheel": {
    "inner": [
      {
        "type": "joystick",
        "axis": {
          "input": "axisXY",
          "output": "leftJoystick",
          "deadzone": { "threshold": 0.08, "radial": true }
        },
        "relative": false,
        "action": "leftTrigger",
        "actionThreshold": 3.0,
        "styles": {
          "default": {
            "knob": {
              "size": 56,
              "faceImage": { "type": "icon", "value": "joystick" }
            },
            "base": { "size": 112 }
          },
          "activated": {
            "knob": {
              "faceImage": { "type": "icon", "value": "afterburner" }
            }
          }
        }
      }
    ],
    "outer": [
      {
        "type": "button",
        "action": "x",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "landing_gear" }
          }
        }
      },
      null,
      null,
      {
        "type": "button",
        "action": "y",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "flaps" }
          }
        }
      },
      null,
      null,
      {
        "type": "button",
        "action": "leftBumper",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "trim_up" }
          }
        }
      },
      {
        "type": "button",
        "action": "rightBumper",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "trim_down" }
          }
        }
      }
    ]
  },
  "rightWheel": {
    "inner": [
      {
        "type": "touchpad",
        "axis": [
          {
            "input": "axisX",
            "output": "relativeMouseX",
            "sensitivity": 6
          },
          {
            "input": "axisY",
            "output": "relativeMouseY",
            "sensitivity": 3
          }
        ],
        "renderAsButton": true,
        "action": ["rightTrigger"],
        "styles": {
          "default": {
            "width": 140,
            "height": 140,
            "faceImage": { "type": "icon", "value": "fire" },
            "backgroundColor": "#F4433640"
          }
        }
      }
    ],
    "outer": [
      null,
      {
        "type": "button",
        "action": "a",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "brakes" }
          }
        }
      },
      null,
      {
        "type": "button",
        "action": "b",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "eject" },
            "backgroundColor": "#FF000060"
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
  ],
  "gyroscope": {
    "enabled": true,
    "output": "relativeMouse",
    "sensitivity": { "x": 8.0, "y": 4.0 },
    "invertY": true,
    "usage": "camera_control",
    "alwaysOn": false
  }
}
```

### HUD Elements

**Cockpit Instruments (Diegetic):**
- Altimeter (left side of cockpit)
- Airspeed indicator (right side)
- Attitude indicator (center)
- Compass (top of windshield)
- Fuel gauges (instrument panel)

**HUD Overlay:**
- Targeting reticle (center, only in combat mode)
- Waypoint markers (3D arrows pointing to objectives)
- Altitude/Speed readout (top-left corner, small)
- Radar (bottom-right, circular, semi-transparent)
- Weapon status (bottom-left)

**Mode-Specific Controls:**
- Takeoff mode: Simplified controls, auto-throttle
- Combat mode: Weapon selection appears
- Landing mode: Landing gear/flaps highlighted

---

## Example 3: Farming Simulator

### Game Context
- Vehicle operation (tractors, harvesters)
- Crop management
- Resource planning
- Slow-paced, methodical gameplay

### Control Layout

```json
{
  "name": "FarmingSimulatorLayout",
  "version": "1.0",
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
              "size": 64,
              "faceImage": { "type": "icon", "value": "steering" }
            },
            "base": { "size": 128 }
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
            "faceImage": { "type": "icon", "value": "implement_lower" }
          }
        }
      },
      null,
      {
        "type": "button",
        "action": "rightBumper",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "implement_raise" }
          }
        }
      },
      {
        "type": "button",
        "action": "x",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "cruise_control" }
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
            "size": 64,
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
            "faceImage": { "type": "icon", "value": "interact" }
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

### On-Foot Mode (Walking Around Farm)

```json
{
  "name": "FarmingOnFootLayout",
  "layers": [
    {
      "name": "walking",
      "active": true,
      "leftWheel": {
        "inner": [
          {
            "type": "directionalPad",
            "interaction": { "activationType": "combined" },
            "action": {
              "up": "dpadUp",
              "down": "dpadDown",
              "left": "dpadLeft",
              "right": "dpadRight"
            },
            "styles": {
              "default": {
                "size": 128,
                "backgroundColor": "#FFFFFF40"
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
            "action": "leftTrigger",
            "styles": {
              "default": {
                "faceImage": { "type": "icon", "value": "run" }
              }
            }
          },
          null,
          null,
          null,
          null
        ]
      },
      "rightWheel": {
        "inner": [
          {
            "type": "button",
            "action": "a",
            "styles": {
              "default": {
                "size": 72,
                "faceImage": { "type": "icon", "value": "interact" }
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
            "action": "b",
            "styles": {
              "default": {
                "faceImage": { "type": "icon", "value": "inventory" }
              }
            }
          },
          null,
          null,
          null,
          null
        ]
      }
    }
  ]
}
```

### HUD Elements

**Vehicle Dashboard:**
- Speed (small, bottom-center)
- Implement status (attached/raised/lowered)
- Fuel level
- Crop tank capacity (for harvesters)

**Farm Management UI:**
- Money display (top-right): `$125,450`
- Time/date (top-left): `Day 15, 14:30`
- Weather forecast (top-left, below time)
- Active contract info (when active, top-center)

**Field Indicators:**
- Field boundaries (subtle colored lines on ground)
- Crop health overlay (toggle with button)
- Yield prediction (hover over field)

---

## Example 4: City Building Simulator

### Game Context
- Top-down or isometric view
- Grid-based construction
- Resource management
- Long-term planning

### Control Layout

```json
{
  "name": "CityBuilderLayout",
  "version": "1.0",
  "leftWheel": {
    "inner": [
      {
        "type": "joystick",
        "axis": {
          "input": "axisXY",
          "output": "leftJoystick",
          "deadzone": { "threshold": 0.1, "radial": true }
        },
        "relative": true,
        "styles": {
          "default": {
            "knob": {
              "size": 48,
              "faceImage": { "type": "icon", "value": "pan" }
            },
            "base": {
              "size": 96,
              "backgroundColor": "#00000020"
            }
          }
        }
      }
    ],
    "outer": [
      {
        "type": "button",
        "action": "leftBumper",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "zoom_in" }
          }
        }
      },
      null,
      null,
      {
        "type": "button",
        "action": "rightBumper",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "zoom_out" }
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
            "faceImage": { "type": "icon", "value": "rotate_left" }
          }
        }
      },
      {
        "type": "button",
        "action": "y",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "rotate_right" }
          }
        }
      }
    ]
  },
  "rightWheel": {
    "inner": [
      {
        "type": "button",
        "action": "a",
        "styles": {
          "default": {
            "size": 72,
            "faceImage": { "type": "icon", "value": "place" },
            "backgroundColor": "#4CAF5080"
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
        "action": "b",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "cancel" },
            "backgroundColor": "#F4433660"
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
          "faceImage": { "type": "icon", "value": "settings" }
        }
      }
    },
    {
      "position": "upper-left",
      "controlCluster": {
        "layout": "horizontal",
        "controls": [
          {
            "type": "button",
            "action": "dpadUp",
            "styles": {
              "default": {
                "faceImage": { "type": "icon", "value": "residential" }
              }
            }
          },
          {
            "type": "button",
            "action": "dpadRight",
            "styles": {
              "default": {
                "faceImage": { "type": "icon", "value": "commercial" }
              }
            }
          },
          {
            "type": "button",
            "action": "dpadDown",
            "styles": {
              "default": {
                "faceImage": { "type": "icon", "value": "industrial" }
              }
            }
          }
        ]
      }
    }
  ]
}
```

### Build Menu (Radial)

When player taps build menu button:

```json
{
  "type": "radialMenu",
  "center": { "x": "50%", "y": "50%" },
  "radius": 160,
  "items": [
    { "angle": 0, "action": "build_road", "icon": "road" },
    { "angle": 45, "action": "build_house", "icon": "house" },
    { "angle": 90, "action": "build_shop", "icon": "shop" },
    { "angle": 135, "action": "build_factory", "icon": "factory" },
    { "angle": 180, "action": "build_power", "icon": "power_plant" },
    { "angle": 225, "action": "build_water", "icon": "water_tower" },
    { "angle": 270, "action": "build_park", "icon": "park" },
    { "angle": 315, "action": "bulldoze", "icon": "bulldozer" }
  ]
}
```

### HUD Elements

**Resource Bar (Top):**
- Money: `$50,000` (green if positive, red if negative)
- Population: `1,234/2,000`
- Power: `⚡ 450/500` (with bar graph)
- Water: `💧 380/500` (with bar graph)
- Happiness: `😊 78%` (emoji + percentage)

**Build Preview:**
- Ghost building follows finger/cursor
- Green tint = valid placement
- Red tint = invalid placement (show reason)
- Cost displayed above preview

**Info Panel (Bottom):**
- Selected building stats
- Upgrade options
- Demolish button

---

## Example 5: Life Simulator

### Game Context
- Character customization
- Social interactions
- Career progression
- Daily activities

### Control Layout

```json
{
  "name": "LifeSimulatorLayout",
  "version": "1.0",
  "leftWheel": {
    "inner": [
      {
        "type": "directionalPad",
        "interaction": { "activationType": "combined" },
        "styles": {
          "default": {
            "size": 128,
            "backgroundColor": "#FFFFFF50",
            "indicatorColor": "#FFFFFFFF"
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
        "action": "leftTrigger",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "run" }
          }
        }
      },
      null,
      null,
      null,
      null
    ]
  },
  "rightWheel": {
    "inner": [
      {
        "type": "button",
        "action": "a",
        "styles": {
          "default": {
            "size": 72,
            "faceImage": { "type": "icon", "value": "interact" }
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
        "action": "b",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "jump" }
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
          "faceImage": { "type": "icon", "value": "phone" }
        }
      }
    },
    {
      "position": "upper-left",
      "type": "button",
      "action": "view",
      "styles": {
        "default": {
          "faceImage": { "type": "icon", "value": "quests" }
        }
      }
    }
  ]
}
```

### Dialogue System

When interacting with NPC:

```json
{
  "layer": "dialogue",
  "controls": {
    "lower": [
      {
        "type": "verticalList",
        "position": "lower-center",
        "maxVisible": 3,
        "choices": [
          { "text": "Hello! How are you?", "action": "greet" },
          { "text": "Can I help you with something?", "action": "offer_help" },
          { "text": "Goodbye", "action": "leave" }
        ],
        "navigation": {
          "up": "dpadUp",
          "down": "dpadDown",
          "select": "a"
        }
      }
    ]
  }
}
```

### HUD Elements

**Character Status (Top-Left):**
- Energy bar: `██████░░ 75%` (depletes throughout day)
- Hunger bar: `█████░░░ 60%` (refill by eating)
- Mood emoji: `😊` (changes based on events)
- Money: `$1,250`

**Time Display (Top-Center):**
- Day: `Monday, Week 2`
- Time: `14:30` (advances in real-time or accelerated)

**Contextual Prompts:**
- Near object: `[A] Pick up`
- Near NPC: `[A] Talk`
- Near door: `[A] Enter`
- Phone notification: Icon pulses in upper-right

**Inventory Quick-Access:**
- Tap phone icon to open
- Drag items to use
- Native touch support for inventory management

---

## Example 6: Train Simulator

### Game Context
- Realistic train operation
- Schedule adherence
- Signal observance
- Route knowledge

### Control Layout

```json
{
  "name": "TrainSimulatorLayout",
  "version": "1.0",
  "leftWheel": {
    "inner": [
      {
        "type": "joystick",
        "axis": {
          "input": "axisY",
          "output": "leftJoystick",
          "deadzone": { "threshold": 0.05, "radial": false }
        },
        "relative": false,
        "action": "leftBumper",
        "actionThreshold": 2.0,
        "styles": {
          "default": {
            "knob": {
              "size": 56,
              "faceImage": { "type": "icon", "value": "throttle" }
            },
            "base": { "size": 112 }
          },
          "activated": {
            "knob": {
              "faceImage": { "type": "icon", "value": "emergency_brake" }
            }
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
        "action": "x",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "horn" }
          }
        }
      },
      null,
      null,
      {
        "type": "button",
        "action": "y",
        "styles": {
          "default": {
            "faceImage": { "type": "icon", "value": "bell" }
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
            "size": 64,
            "faceImage": { "type": "icon", "value": "brake_release" }
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
            "size": 64,
            "faceImage": { "type": "icon", "value": "brake_apply" }
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
            "faceImage": { "type": "icon", "value": "doors_open" }
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
          "faceImage": { "type": "icon", "value": "schedule" }
        }
      }
    }
  ]
}
```

### HUD Elements

**Cab Instruments (Diegetic):**
- Speedometer (prominent, center-left)
- Pressure gauges (brake pipe, main reservoir)
- Signal display (next track signal aspect)
- Next station distance

**Schedule Display (Top-Right):**
- Current station: `Central Station`
- Next station: `North Park (2.3 km)`
- Scheduled arrival: `14:45`
- Expected arrival: `14:44` (green) or `14:47` (red)
- Delay: `+2 min` or `On time`

**Safety Systems:**
- AWS/ATP warnings (large, center-screen, temporary)
- Speed limit indicator (current vs maximum)
- Emergency brake activation warning

---

## Progressive Complexity Examples

### Beginner Mode (First Play Session)

Show only essential controls:
- Movement (left wheel inner)
- Primary action (right wheel inner)
- Pause button (upper-right)

Hide:
- All secondary controls
- Complex menus
- Advanced features

### Intermediate Mode (After Tutorial)

Unlock:
- Secondary actions (outer rings)
- Basic menus
- Inventory access

Still hide:
- Advanced combinations
- Gesture controls
- Customization options

### Advanced Mode (Experienced Players)

Full control set available:
- All buttons visible
- Gesture shortcuts enabled
- Custom layouts unlockable

Optional:
- Allow control remapping
- Enable macro buttons
- Support external controllers

---

## Accessibility Variants

### One-Handed Mode

For players who need to hold device with one hand:

```json
{
  "name": "OneHandedLayout",
  "mirror": false,
  "leftWheel": {
    "visible": false
  },
  "rightWheel": {
    "position": { "x": "50%", "y": "70%" },
    "inner": [
      {
        "type": "joystick",
        "axis": {
          "input": "axisXY",
          "output": "leftJoystick"
        }
      }
    ],
    "outer": [
      // All actions accessible from right side
      { "type": "button", "action": "a" },
      { "type": "button", "action": "b" },
      { "type": "button", "action": "x" },
      { "type": "button", "action": "y" }
    ]
  },
  "autoActions": {
    "description": "Some actions automated to reduce input requirements",
    "autoCenterCamera": true,
    "autoPickupItems": true
  }
}
```

### High Contrast Mode

For visually impaired players:

```json
{
  "theme": "highContrast",
  "colors": {
    "primary": "#FFFFFF",
    "secondary": "#FFFF00",
    "background": "#000000",
    "accent": "#00FFFF"
  },
  "controls": {
    "borderWidth": 4,
    "opacity": 1.0,
    "labelAlwaysVisible": true,
    "fontSizeMultiplier": 1.5
  }
}
```

### Reduced Motion Mode

For players sensitive to animations:

```json
{
  "animations": {
    "buttonPress": "instant",
    "menuTransition": "fade_only",
    "controlAppear": "instant",
    "disableParallax": true,
    "disableScreenShake": true
  }
}
```

---

These examples provide starting points for different simulator genres. Adapt and combine patterns based on your specific game mechanics and target audience.
