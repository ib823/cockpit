/**
 * Logo Upload Utilities
 *
 * Handles file validation, conversion, resizing, and optimization for company logos.
 * Apple-level quality: Fast, reliable, user-friendly error messages.
 */

export interface LogoValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Supported image formats for logos
 */
const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

/**
 * Maximum file size: 2MB
 */
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

/**
 * Standard logo dimensions (will maintain aspect ratio)
 */
export const LOGO_MAX_WIDTH = 400;
export const LOGO_MAX_HEIGHT = 400;

/**
 * Validate logo file format and size
 */
export async function validateLogoFile(file: File): Promise<LogoValidationResult> {
  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file format. Please use PNG, JPG, or SVG.`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File too large (${sizeMB}MB). Maximum size is 2MB.`,
    };
  }

  // For SVG, validate XML structure
  if (file.type === 'image/svg+xml') {
    try {
      const text = await file.text();
      if (!text.includes('<svg')) {
        return {
          valid: false,
          error: 'Invalid SVG file. File does not contain valid SVG markup.',
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to read SVG file. Please try another file.',
      };
    }
  }

  return { valid: true };
}

/**
 * Convert file to base64 data URL
 */
export function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from data URL
 */
export function getImageDimensions(dataUrl: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    // For SVG, parse dimensions from markup
    if (dataUrl.startsWith('data:image/svg+xml')) {
      try {
        const base64 = dataUrl.split(',')[1];
        const svgText = atob(base64);

        // Try to extract width/height attributes
        const widthMatch = svgText.match(/width="(\d+)"/);
        const heightMatch = svgText.match(/height="(\d+)"/);

        if (widthMatch && heightMatch) {
          resolve({
            width: parseInt(widthMatch[1], 10),
            height: parseInt(heightMatch[1], 10),
          });
        } else {
          // Default to standard dimensions for SVG without explicit size
          resolve({ width: 400, height: 400 });
        }
      } catch (error) {
        reject(new Error('Failed to parse SVG dimensions'));
      }
      return;
    }

    // For raster images, load and measure
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 */
export function resizeLogo(
  dataUrl: string,
  maxWidth: number = LOGO_MAX_WIDTH,
  maxHeight: number = LOGO_MAX_HEIGHT
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // SVG doesn't need resizing (vector format)
    if (dataUrl.startsWith('data:image/svg+xml')) {
      resolve(dataUrl);
      return;
    }

    try {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const resizedDataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(resizedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for resizing'));
      };

      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Optimize logo by compressing and resizing
 */
export async function optimizeLogo(
  dataUrl: string,
  quality: number = 0.85
): Promise<string> {
  // SVG is already optimized (text-based)
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return dataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Convert with compression
      const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(optimizedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for optimization'));
    };

    img.src = dataUrl;
  });
}

/**
 * Process uploaded logo file: validate, convert, resize, optimize
 *
 * This is the main function to use for logo uploads.
 */
export async function processLogoFile(file: File): Promise<{
  success: boolean;
  dataUrl?: string;
  error?: string;
  dimensions?: ImageDimensions;
}> {
  try {
    // Step 1: Validate
    const validation = await validateLogoFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Step 2: Convert to base64
    const dataUrl = await convertToBase64(file);

    // Step 3: Get dimensions
    const dimensions = await getImageDimensions(dataUrl);

    // Step 4: Resize if needed
    let processedDataUrl = dataUrl;
    if (dimensions.width > LOGO_MAX_WIDTH || dimensions.height > LOGO_MAX_HEIGHT) {
      processedDataUrl = await resizeLogo(dataUrl);
    }

    // Step 5: Optimize (compress) for raster images
    if (!dataUrl.startsWith('data:image/svg+xml')) {
      processedDataUrl = await optimizeLogo(processedDataUrl);
    }

    // Get final dimensions
    const finalDimensions = await getImageDimensions(processedDataUrl);

    return {
      success: true,
      dataUrl: processedDataUrl,
      dimensions: finalDimensions,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process logo file',
    };
  }
}

/**
 * Get file size from data URL (in bytes)
 */
export function getDataUrlSize(dataUrl: string): number {
  // Remove data URL prefix
  const base64String = dataUrl.split(',')[1] || dataUrl;

  // Calculate size (base64 is ~33% larger than original)
  const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
  const size = (base64String.length * 3) / 4 - padding;

  return size;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

/**
 * Validate company name
 */
export function validateCompanyName(name: string): LogoValidationResult {
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: 'Company name is required',
    };
  }

  if (name.trim().length < 2) {
    return {
      valid: false,
      error: 'Company name must be at least 2 characters',
    };
  }

  if (name.length > 100) {
    return {
      valid: false,
      error: 'Company name must be less than 100 characters',
    };
  }

  // Check for valid characters (alphanumeric, spaces, hyphens, periods, ampersands)
  const validNameRegex = /^[a-zA-Z0-9\s\-\.&]+$/;
  if (!validNameRegex.test(name)) {
    return {
      valid: false,
      error: 'Company name contains invalid characters',
    };
  }

  return { valid: true };
}

/**
 * Sanitize company name for use as key
 */
export function sanitizeCompanyName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}
