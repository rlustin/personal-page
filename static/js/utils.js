const DEFAULT_COLOR = { r: 255, g: 51, b: 102 };

/**
 * Parses a color string in hex or rgb(a) format to RGB object
 */
export function parseColor(color) {
  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  const rgbMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  return DEFAULT_COLOR;
}

/**
 * Observes CSS custom property changes and provides current color
 */
export class ColorObserver {
  constructor(propertyName = '--accent-primary', updateInterval = 1000) {
    this.propertyName = propertyName;
    this.updateInterval = updateInterval;
    this.cachedColor = null;
    this.cachedRgb = DEFAULT_COLOR;
    this.intervalId = null;
  }

  start() {
    this.update();
    this.intervalId = setInterval(() => this.update(), this.updateInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  update() {
    const color = getComputedStyle(document.body).getPropertyValue(this.propertyName).trim();

    if (color && color !== this.cachedColor) {
      this.cachedColor = color;
      this.cachedRgb = parseColor(color);
    }
  }

  getRgb() {
    return this.cachedRgb;
  }
}

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if Canvas API is supported
 */
export function supportsCanvas() {
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
}

/**
 * Creates a Page Visibility handler
 */
export function createVisibilityHandler(onVisible, onHidden) {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      onHidden();
    } else {
      onVisible();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
