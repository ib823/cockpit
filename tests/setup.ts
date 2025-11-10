// Test setup file
import "@testing-library/jest-dom/vitest";
import { TextEncoder, TextDecoder } from 'util';

// Set required environment variables for testing
process.env.NEXTAUTH_SECRET = "test-secret-key-for-jwt-encoding-minimum-32-characters-long";
process.env.ENABLE_MAGIC_LINKS = "true";
process.env.NODE_ENV = "test";

// Force Node.js TextEncoder/TextDecoder globally (for jose library compatibility)
// This is critical because jsdom's TextEncoder returns a different type that
// jose's instanceof check doesn't recognize as Uint8Array
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock window.getComputedStyle for AntD components
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      getPropertyValue: () => '',
      display: 'none',
      width: '0px',
      height: '0px',
    }),
  });

  // Mock matchMedia for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated
      removeListener: () => {}, // deprecated
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}
