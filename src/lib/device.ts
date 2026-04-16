/**
 * Device Detection Utility
 * Provides functions to detect touch-capable devices, screen sizes, and mobile contexts.
 */

export type ScreenSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Check if the current device supports touch events
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - MSPointerEnabled is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Check if the current device is a mobile device (phone or tablet)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
  ];
  
  const isMobileUA = mobileKeywords.some((keyword) => userAgent.includes(keyword));
  const isTouch = isTouchDevice();
  const isSmallScreen = window.innerWidth < 768;
  
  return isMobileUA || (isTouch && isSmallScreen);
}

/**
 * Get the current screen size category based on width
 */
export function getScreenSize(): ScreenSize {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  return 'xl';
}

/**
 * Determine if touch controls should be shown based on device and user preferences
 */
export function shouldShowTouchControls(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage for user preference override
  const userPreference = localStorage.getItem('touchControlsEnabled');
  if (userPreference !== null) {
    return userPreference === 'true';
  }
  
  // Default behavior: show on mobile/touch devices
  return isMobileDevice();
}

/**
 * Enable or disable touch controls globally
 */
export function setTouchControlsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('touchControlsEnabled', enabled.toString());
}

/**
 * Check if the device is in portrait orientation
 */
export function isPortrait(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerHeight > window.innerWidth;
}

/**
 * Check if the device is in landscape orientation
 */
export function isLandscape(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
}

/**
 * Get device pixel ratio for high-DPI displays
 */
export function getPixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
}
