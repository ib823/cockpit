/**
 * Dynamic Favicon Utility
 * Changes favicon color based on page status
 */

export type FaviconStatus = 'ready' | 'success' | 'error' | 'warning' | 'not-logged-in';

interface StatusColors {
  start: string;
  end: string;
}

const STATUS_COLORS: Record<FaviconStatus, StatusColors> = {
  ready: {
    start: '#3b82f6', // Blue - Ready, logged on
    end: '#2563eb',   // Dark Blue
  },
  success: {
    start: '#10b981', // Green - Generic good status
    end: '#059669',   // Dark Green
  },
  error: {
    start: '#ef4444', // Red - Error state
    end: '#dc2626',   // Dark Red
  },
  warning: {
    start: '#f59e0b', // Amber - Warning
    end: '#d97706',   // Dark Amber
  },
  'not-logged-in': {
    start: '#f59e0b', // Amber - Not logged on
    end: '#d97706',   // Dark Amber
  },
};

/**
 * Generate SVG favicon with custom gradient colors
 */
function generateFaviconSVG(startColor: string, endColor: string): string {
  return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="url(#gradient-favicon)"/>
  <text x="16" y="22" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="white" text-anchor="middle">SC</text>
  <defs>
    <linearGradient id="gradient-favicon" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${startColor}"/>
      <stop offset="100%" stop-color="${endColor}"/>
    </linearGradient>
  </defs>
</svg>`;
}

/**
 * Convert SVG string to data URL
 */
function svgToDataURL(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Update the favicon in the document
 */
export function setFaviconStatus(status: FaviconStatus = 'ready'): void {
  const colors = STATUS_COLORS[status];
  const svg = generateFaviconSVG(colors.start, colors.end);
  const dataURL = svgToDataURL(svg);

  // Find or create the favicon link element
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");

  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  link.href = dataURL;
}

/**
 * Animated favicon (optional enhancement)
 * Cycles through different shades to create a pulsing effect
 * Useful for indicating ongoing processes
 */
export function startAnimatedFavicon(status: FaviconStatus = 'warning'): () => void {
  let frame = 0;
  const frames = 60;

  const interval = setInterval(() => {
    const progress = (Math.sin(frame / frames * Math.PI * 2) + 1) / 2;
    const colors = STATUS_COLORS[status];

    // Interpolate between the two colors
    const startColor = interpolateColor(colors.start, colors.end, progress);
    const endColor = interpolateColor(colors.end, colors.start, progress);

    const svg = generateFaviconSVG(startColor, endColor);
    const dataURL = svgToDataURL(svg);

    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = dataURL;

    frame = (frame + 1) % frames;
  }, 50); // Update every 50ms

  // Return cleanup function
  return () => {
    clearInterval(interval);
    setFaviconStatus('ready'); // Reset to ready state
  };
}

/**
 * Helper function to interpolate between two hex colors
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);

  return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
