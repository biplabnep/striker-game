#!/usr/bin/env python3
"""
Mobile Simulator UI Layout Validator

Validates touch control layouts for mobile simulator games against
ergonomic and accessibility standards.

Usage:
    python validate_layout.py layout.json [--device DEVICE] [--all-devices]

Examples:
    python validate_layout.py driving_layout.json
    python validate_layout.py layout.json --device iphone-se
    python validate_layout.py layout.json --all-devices
"""

import json
import sys
import argparse
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class DeviceSpec:
    """Device specifications for testing."""
    name: str
    width: int
    height: int
    pixel_density: float  # pixels per inch
    screen_size: float  # diagonal inches


# Common device specifications
DEVICES = {
    "iphone-se": DeviceSpec("iPhone SE", 375, 667, 326, 4.7),
    "iphone-14": DeviceSpec("iPhone 14", 390, 844, 460, 6.1),
    "iphone-14-pro-max": DeviceSpec("iPhone 14 Pro Max", 430, 932, 460, 6.7),
    "ipad-air": DeviceSpec("iPad Air", 820, 1180, 264, 10.9),
    "samsung-s23": DeviceSpec("Samsung Galaxy S23", 393, 852, 460, 6.1),
    "samsung-tab-s8": DeviceSpec("Samsung Tab S8", 800, 1280, 274, 11.0),
    "pixel-7": DeviceSpec("Google Pixel 7", 412, 915, 416, 6.3),
}

# Minimum standards
MIN_TOUCH_TARGET = 48  # pixels (at 160 DPI)
RECOMMENDED_TOUCH_TARGET = 56
MIN_SPACING = 16  # pixels between controls
EDGE_MARGIN_PHONE = 32
EDGE_MARGIN_TABLET = 48
WHEEL_RADIUS_PHONE = 120
WHEEL_RADIUS_TABLET = 160


class ValidationResult:
    """Stores validation results."""

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.passed: List[str] = []

    def add_error(self, message: str):
        self.errors.append(f"❌ ERROR: {message}")

    def add_warning(self, message: str):
        self.warnings.append(f"⚠️  WARNING: {message}")

    def add_passed(self, message: str):
        self.passed.append(f"✅ PASSED: {message}")

    def is_valid(self) -> bool:
        return len(self.errors) == 0

    def print_report(self):
        print("\n" + "=" * 70)
        print("LAYOUT VALIDATION REPORT")
        print("=" * 70)

        if self.passed:
            print("\nPASSED CHECKS:")
            for check in self.passed:
                print(f"  {check}")

        if self.warnings:
            print("\nWARNINGS:")
            for warning in self.warnings:
                print(f"  {warning}")

        if self.errors:
            print("\nERRORS:")
            for error in self.errors:
                print(f"  {error}")

        print("\n" + "-" * 70)
        if self.is_valid():
            if self.warnings:
                print("RESULT: VALID WITH WARNINGS")
            else:
                print("RESULT: VALID ✓")
        else:
            print("RESULT: INVALID ✗")
        print("-" * 70)
        print(f"\nTotal: {len(self.passed)} passed, {len(self.warnings)} warnings, {len(self.errors)} errors\n")


def load_layout(filepath: str) -> Dict:
    """Load and parse layout JSON file."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File '{filepath}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in '{filepath}': {e}")
        sys.exit(1)


def calculate_scale_factor(device: DeviceSpec, reference_width: int = 1920) -> float:
    """Calculate scale factor based on device dimensions."""
    return device.width / reference_width


def get_control_positions(layout: Dict, device: DeviceSpec) -> List[Dict]:
    """Extract all control positions from layout."""
    controls = []
    scale = calculate_scale_factor(device)

    # Process left wheel
    if "leftWheel" in layout:
        wheel_center_x = device.width * 0.2
        wheel_center_y = device.height * 0.6
        radius = WHEEL_RADIUS_PHONE if device.screen_size < 7 else WHEEL_RADIUS_TABLET

        inner = layout["leftWheel"].get("inner", [])
        for control in inner:
            controls.append({
                "type": control.get("type", "unknown"),
                "x": wheel_center_x,
                "y": wheel_center_y,
                "size": radius * 0.4 * scale,
                "zone": "left_wheel_inner"
            })

        outer = layout["leftWheel"].get("outer", [])
        for i, control in enumerate(outer):
            if control is not None:
                angle = (i * 45 - 90) * 3.14159 / 180
                x = wheel_center_x + radius * 1.5 * scale * (1 if i in [1, 2, 3] else -1 if i in [5, 6, 7] else 0)
                y = wheel_center_y + radius * 1.5 * scale * (-1 if i in [0, 1, 7] else 1 if i in [3, 4, 5] else 0)
                controls.append({
                    "type": control.get("type", "unknown"),
                    "x": x,
                    "y": y,
                    "size": RECOMMENDED_TOUCH_TARGET * scale,
                    "zone": f"left_wheel_outer_{i}"
                })

    # Process right wheel
    if "rightWheel" in layout:
        wheel_center_x = device.width * 0.8
        wheel_center_y = device.height * 0.6
        radius = WHEEL_RADIUS_PHONE if device.screen_size < 7 else WHEEL_RADIUS_TABLET

        inner = layout["rightWheel"].get("inner", [])
        for control in inner:
            controls.append({
                "type": control.get("type", "unknown"),
                "x": wheel_center_x,
                "y": wheel_center_y,
                "size": radius * 0.4 * scale,
                "zone": "right_wheel_inner"
            })

        outer = layout["rightWheel"].get("outer", [])
        for i, control in enumerate(outer):
            if control is not None:
                x = wheel_center_x + radius * 1.5 * scale * (1 if i in [1, 2, 3] else -1 if i in [5, 6, 7] else 0)
                y = wheel_center_y + radius * 1.5 * scale * (-1 if i in [0, 1, 7] else 1 if i in [3, 4, 5] else 0)
                controls.append({
                    "type": control.get("type", "unknown"),
                    "x": x,
                    "y": y,
                    "size": RECOMMENDED_TOUCH_TARGET * scale,
                    "zone": f"right_wheel_outer_{i}"
                })

    # Process upper zone controls
    if "upper" in layout:
        for control_def in layout["upper"]:
            position = control_def.get("position", "")
            if "upper-right" in position:
                controls.append({
                    "type": control_def.get("type", "unknown"),
                    "x": device.width - EDGE_MARGIN_PHONE * scale,
                    "y": EDGE_MARGIN_PHONE * scale,
                    "size": RECOMMENDED_TOUCH_TARGET * scale,
                    "zone": "upper_right"
                })
            elif "upper-left" in position:
                controls.append({
                    "type": control_def.get("type", "unknown"),
                    "x": EDGE_MARGIN_PHONE * scale,
                    "y": EDGE_MARGIN_PHONE * scale,
                    "size": RECOMMENDED_TOUCH_TARGET * scale,
                    "zone": "upper_left"
                })

    return controls


def validate_touch_targets(controls: List[Dict], device: DeviceSpec, result: ValidationResult):
    """Validate that all touch targets meet minimum size requirements."""
    min_size = MIN_TOUCH_TARGET * calculate_scale_factor(device)

    too_small = [c for c in controls if c["size"] < min_size]
    if too_small:
        result.add_error(f"{len(too_small)} controls smaller than minimum {min_size:.0f}px")
    else:
        result.add_passed("All touch targets meet minimum size requirement")


def validate_screen_bounds(controls: List[Dict], device: DeviceSpec, result: ValidationResult):
    """Validate that all controls are within screen bounds."""
    margin = EDGE_MARGIN_PHONE if device.screen_size < 7 else EDGE_MARGIN_TABLET
    margin_scaled = margin * calculate_scale_factor(device)

    out_of_bounds = []
    for control in controls:
        if (control["x"] - control["size"]/2 < margin_scaled or
            control["x"] + control["size"]/2 > device.width - margin_scaled or
            control["y"] - control["size"]/2 < margin_scaled or
            control["y"] + control["size"]/2 > device.height - margin_scaled):
            out_of_bounds.append(control)

    if out_of_bounds:
        result.add_error(f"{len(out_of_bounds)} controls outside safe area")
    else:
        result.add_passed("All controls within screen bounds")


def validate_control_spacing(controls: List[Dict], device: DeviceSpec, result: ValidationResult):
    """Validate minimum spacing between controls."""
    min_spacing = MIN_SPACING * calculate_scale_factor(device)
    violations = 0

    for i, c1 in enumerate(controls):
        for j, c2 in enumerate(controls[i+1:], i+1):
            distance = ((c1["x"] - c2["x"])**2 + (c1["y"] - c2["y"])**2)**0.5
            min_distance = (c1["size"] + c2["size"]) / 2 + min_spacing

            if distance < min_distance:
                violations += 1

    if violations > 0:
        result.add_warning(f"{violations} control pairs closer than recommended spacing")
    else:
        result.add_passed("All controls properly spaced")


def validate_zone_distribution(controls: List[Dict], result: ValidationResult):
    """Validate that controls are distributed across appropriate zones."""
    zone_counts = {}
    for control in controls:
        zone = control.get("zone", "unknown")
        zone_type = zone.split("_")[0] if "_" in zone else zone
        zone_counts[zone_type] = zone_counts.get(zone_type, 0) + 1

    # Check for too many controls in lower zone
    lower_count = zone_counts.get("lower", 0)
    if lower_count > 2:
        result.add_warning(f"{lower_count} controls in lower zone (hard to reach)")
    else:
        result.add_passed("Lower zone usage appropriate")

    # Check wheel utilization
    left_wheel = zone_counts.get("left", 0)
    right_wheel = zone_counts.get("right", 0)

    if left_wheel == 0 or right_wheel == 0:
        result.add_warning("One or both wheels unused")
    else:
        result.add_passed("Both thumb wheels utilized")


def validate_control_count(layout: Dict, result: ValidationResult):
    """Validate total number of visible controls."""
    # Count controls recursively
    def count_controls(obj):
        if isinstance(obj, dict):
            if obj.get("type") in ["button", "joystick", "directionalPad", "touchpad"]:
                return 1
            return sum(count_controls(v) for v in obj.values())
        elif isinstance(obj, list):
            return sum(count_controls(item) for item in obj if item is not None)
        return 0

    total = count_controls(layout)

    if total > 20:
        result.add_warning(f"High control count ({total}). Consider simplifying.")
    elif total > 12:
        result.add_passed(f"Control count reasonable ({total})")
    else:
        result.add_passed(f"Minimal control scheme ({total} controls)")


def validate_accessibility(layout: Dict, result: ValidationResult):
    """Validate accessibility features."""
    # Check for gyroscope fallback
    has_gyro = "gyroscope" in layout
    has_joystick = False

    def find_joysticks(obj):
        nonlocal has_joystick
        if isinstance(obj, dict):
            if obj.get("type") == "joystick":
                has_joystick = True
            for v in obj.values():
                find_joysticks(v)
        elif isinstance(obj, list):
            for item in obj:
                find_joysticks(item)

    find_joysticks(layout)

    if has_gyro and not has_joystick:
        result.add_warning("Gyroscope control without joystick fallback")
    elif has_gyro and has_joystick:
        result.add_passed("Gyroscope has joystick fallback")

    # Check for essential controls
    has_pause = False
    def find_pause(obj):
        nonlocal has_pause
        if isinstance(obj, dict):
            if obj.get("action") == "menu" or obj.get("action") == "pause":
                has_pause = True
            for v in obj.values():
                find_pause(v)
        elif isinstance(obj, list):
            for item in obj:
                find_pause(item)

    find_pause(layout)

    if has_pause:
        result.add_passed("Pause/menu control present")
    else:
        result.add_warning("No pause/menu control found")


def validate_layout(layout: Dict, device: DeviceSpec) -> ValidationResult:
    """Run all validation checks on a layout."""
    result = ValidationResult()

    # Extract controls
    controls = get_control_positions(layout, device)

    if not controls:
        result.add_error("No controls found in layout")
        return result

    # Run validations
    validate_touch_targets(controls, device, result)
    validate_screen_bounds(controls, device, result)
    validate_control_spacing(controls, device, result)
    validate_zone_distribution(controls, result)
    validate_control_count(layout, result)
    validate_accessibility(layout, result)

    return result


def main():
    parser = argparse.ArgumentParser(description="Validate mobile game UI layouts")
    parser.add_argument("layout_file", help="Path to layout JSON file")
    parser.add_argument("--device", choices=DEVICES.keys(), default=None,
                       help="Specific device to test")
    parser.add_argument("--all-devices", action="store_true",
                       help="Test against all devices")

    args = parser.parse_args()

    layout = load_layout(args.layout_file)

    if args.all_devices:
        print(f"Validating layout against all devices...\n")
        all_results = []

        for device_name, device_spec in DEVICES.items():
            print(f"\nTesting on {device_spec.name} ({device_spec.width}x{device_spec.height})...")
            result = validate_layout(layout, device_spec)
            result.print_report()
            all_results.append(result)

        # Summary
        print("\n" + "=" * 70)
        print("SUMMARY ACROSS ALL DEVICES")
        print("=" * 70)
        valid_count = sum(1 for r in all_results if r.is_valid())
        print(f"Valid on {valid_count}/{len(all_results)} devices")

        if valid_count < len(all_results):
            print("\nConsider responsive design adjustments for better compatibility.")

    else:
        device_name = args.device or "iphone-14"
        device = DEVICES[device_name]

        print(f"Validating layout for {device.name} ({device.width}x{device.height})...\n")
        result = validate_layout(layout, device)
        result.print_report()

    sys.exit(0 if result.is_valid() else 1)


if __name__ == "__main__":
    main()
