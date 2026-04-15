# Mobile Simulator UI/UX Design Guidelines

A comprehensive skill for designing professional mobile simulator game interfaces following ergonomic principles, accessibility standards, and industry best practices.

## What This Skill Does

This skill provides AI agents with expert knowledge for creating mobile simulator game UIs that are:

- **Ergonomic**: Controls placed in natural thumb reach zones
- **Minimalist**: Clean interfaces that don't obstruct gameplay
- **Accessible**: Usable by players with different abilities
- **Immersive**: Diegetic HUD elements that enhance realism
- **Responsive**: Adapts to various screen sizes and devices

## When to Use

The AI agent will automatically apply this skill when you:

- Create mobile simulator games (driving, flying, farming, etc.)
- Design touch control layouts
- Implement game HUDs and UI systems
- Optimize existing mobile game interfaces
- Request mobile game UX advice

## File Structure

```
mobile-simulator-ui-guidelines/
├── SKILL.md              # Core guidelines and principles
├── reference.md          # Technical API reference
├── examples.md           # Complete layout examples by genre
├── scripts/
│   └── validate_layout.py  # Automated layout validator
└── README.md             # This file
```

## Quick Start

### 1. Ask the Agent

Simply describe your game and ask for UI design:

```
"Design controls for a mobile racing simulator"
"Create a HUD layout for my flight simulator game"
"How should I arrange buttons for a farming sim?"
```

### 2. Review the Design

The agent will provide:
- Control placement diagram
- JSON layout configuration
- Visual design recommendations
- Accessibility considerations

### 3. Validate Your Layout

Test your layout against multiple devices:

```bash
python .lingma/skills/mobile-simulator-ui-guidelines/scripts/validate_layout.py \
  my_layout.json --all-devices
```

## Supported Simulator Genres

The skill includes specialized patterns for:

- **Vehicle Simulators**: Racing, driving, parking
- **Flight Simulators**: Planes, helicopters, spacecraft
- **Marine Simulators**: Boats, submarines, ships
- **Construction Sims**: Cranes, excavators, building
- **Farming Sims**: Tractors, harvesters, livestock
- **City Builders**: Urban planning, resource management
- **Life Sims**: Character simulation, social interaction
- **Train Sims**: Locomotive operation, route management
- **Business Sims**: Management, tycoon games

## Key Features

### Ergonomic Thumb Zones
Controls positioned where thumbs naturally rest, reducing fatigue during extended play sessions.

### Progressive Complexity
Start simple, unlock advanced controls as players gain skill.

### Diegetic Integration
HUD elements integrated into the game world (dashboards, instruments, displays).

### Adaptive Layouts
Switch control schemes based on context (driving vs walking, combat vs exploration).

### Accessibility First
Support for one-handed play, high contrast modes, customizable control sizes.

## Layout Validation

The validation script checks:

✅ Touch target sizes meet accessibility standards
✅ Controls within safe screen areas
✅ Proper spacing between interactive elements
✅ Zone distribution follows ergonomic guidelines
✅ Gyroscope fallbacks present
✅ Pause/menu controls accessible

### Running Validation

```bash
# Test on default device (iPhone 14)
python scripts/validate_layout.py layout.json

# Test on specific device
python scripts/validate_layout.py layout.json --device iphone-se

# Test on all devices
python scripts/validate_layout.py layout.json --all-devices
```

### Interpreting Results

```
✅ PASSED: All touch targets meet minimum size requirement
⚠️  WARNING: 2 control pairs closer than recommended spacing
❌ ERROR: 1 control outside safe area

RESULT: INVALID ✗
```

Fix errors before deployment. Warnings indicate areas for improvement.

## Common Workflows

### Designing from Scratch

1. Describe your game mechanics to the agent
2. Agent suggests control layout based on genre patterns
3. Review and request modifications
4. Get JSON configuration for implementation
5. Validate across target devices

### Improving Existing UI

1. Share your current layout JSON
2. Agent identifies issues and suggests improvements
3. Apply recommended changes
4. Re-validate to confirm fixes

### Testing Different Devices

1. Create base layout for standard phone
2. Run validation with `--all-devices` flag
3. Adjust sizing/spacing for tablet compatibility
4. Create alternative layouts if needed

## Best Practices Summary

### DO ✅

- Place primary controls in wheel inner rings
- Keep center 60% of screen clear for gameplay
- Use semi-transparent backgrounds (opacity 0.6-0.8)
- Provide gyroscope alternatives
- Test on actual devices, not just emulators
- Allow control customization in settings

### DON'T ❌

- Put critical controls in lower corners
- Show more than 8 controls simultaneously
- Use bright, saturated colors that distract
- Require 3+ simultaneous touches
- Ignore safe areas (notches, home indicators)
- Assume all players have large hands

## Implementation Examples

See [examples.md](examples.md) for complete layouts for:
- Racing Simulator
- Flight Simulator
- Farming Simulator
- City Builder
- Life Simulator
- Train Simulator

Each example includes:
- Full JSON configuration
- HUD element placement
- Progressive disclosure strategy
- Mode-specific variations

## Technical Reference

For detailed API documentation, see [reference.md](reference.md):

- Control types (button, joystick, D-pad, gyroscope, touchpad)
- Zone and slot system
- Style properties
- Responsive design formulas
- Platform integration (Unity, Unreal, Godot)
- Troubleshooting guide

## Customization

You can extend this skill by:

1. Adding new genre examples to `examples.md`
2. Creating custom validation rules in `scripts/`
3. Adding platform-specific notes
4. Including your team's design patterns

## Resources

### External References
- Microsoft Touch Adaptation Kit Documentation
- Apple Human Interface Guidelines (Gaming)
- Google Play Games Services - Touch Controls
- Unity UI Best Practices

### Related Skills
- `ui-designer` - General web UI design
- `create-skill-ui` - Build interactive widgets

## Contributing

Found an issue or have a suggestion? Improve this skill by:

1. Adding new simulator genre examples
2. Updating validation rules for new devices
3. Enhancing accessibility guidelines
4. Sharing real-world case studies

## Version History

**v1.0** (April 2026)
- Initial release
- 6 genre examples
- Layout validation tool
- Comprehensive reference docs

---

**Remember**: Great mobile simulator UI is invisible. Players should focus on the simulation, not fighting the controls.
