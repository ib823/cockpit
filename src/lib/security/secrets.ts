/**
 * Secrets Management Module
 *
 * Provides secure handling of sensitive configuration values
 * and environment variables.
 *
 * IMPORTANT: This module does NOT store secrets. It provides
 * validation and access patterns for secrets stored in environment
 * variables or secure vaults.
 */

// ============================================================================
// Types
// ============================================================================

export interface SecretConfig {
  key: string;
  required: boolean;
  description: string;
  validationRegex?: RegExp;
}

// ============================================================================
// Secret Definitions
// ============================================================================

const SECRETS: Record<string, SecretConfig> = {
  DATABASE_URL: {
    key: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
    validationRegex: /^postgresql:\/\/.+/,
  },
  NEXTAUTH_SECRET: {
    key: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth.js secret for session encryption',
    validationRegex: /^.{32,}$/, // At least 32 characters
  },
  ADMIN_CODE: {
    key: 'ADMIN_CODE',
    required: false,
    description: 'Admin access code for initial setup',
    validationRegex: /^[A-Z0-9]{6,12}$/,
  },
  WEBAUTHN_RP_ID: {
    key: 'WEBAUTHN_RP_ID',
    required: false,
    description: 'WebAuthn Relying Party ID (domain)',
    validationRegex: /^[a-z0-9.-]+$/,
  },
  WEBAUTHN_RP_NAME: {
    key: 'WEBAUTHN_RP_NAME',
    required: false,
    description: 'WebAuthn Relying Party Name',
  },
  NEXTAUTH_URL: {
    key: 'NEXTAUTH_URL',
    required: false,
    description: 'NextAuth.js URL for callbacks',
    validationRegex: /^https?:\/\/.+/,
  },
};

// ============================================================================
// Secret Access Functions
// ============================================================================

/**
 * Get a secret value from environment variables
 *
 * @param key - Secret key
 * @returns Secret value or undefined if not found
 */
export function getSecret(key: string): string | undefined {
  const config = SECRETS[key];

  if (!config) {
    console.warn(`[Secrets] Unknown secret key: ${key}`);
    return undefined;
  }

  const value = process.env[config.key];

  if (!value) {
    if (config.required) {
      console.error(`[Secrets] Required secret missing: ${key}`);
    }
    return undefined;
  }

  // Validate format if regex is provided
  if (config.validationRegex && !config.validationRegex.test(value)) {
    console.error(`[Secrets] Secret validation failed: ${key}`);
    return undefined;
  }

  return value;
}

/**
 * Check if a required secret is configured
 */
export function hasSecret(key: string): boolean {
  return getSecret(key) !== undefined;
}

/**
 * Validate all required secrets are present
 */
export function validateRequiredSecrets(): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  for (const [key, config] of Object.entries(SECRETS)) {
    if (config.required && !hasSecret(key)) {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get all configured secrets (for debugging - redacted values)
 */
export function listSecrets(): Array<{
  key: string;
  configured: boolean;
  required: boolean;
  description: string;
}> {
  return Object.entries(SECRETS).map(([key, config]) => ({
    key,
    configured: hasSecret(key),
    required: config.required,
    description: config.description,
  }));
}

// ============================================================================
// Secret Masking
// ============================================================================

/**
 * Mask a secret value for logging/debugging
 * Shows first 2 and last 2 characters, masks the rest
 */
export function maskSecret(value: string): string {
  if (value.length <= 4) {
    return '****';
  }

  const first = value.slice(0, 2);
  const last = value.slice(-2);
  const masked = '*'.repeat(Math.min(value.length - 4, 20));

  return `${first}${masked}${last}`;
}

/**
 * Redact secrets from an object (useful for logging)
 */
export function redactSecrets<T extends Record<string, any>>(obj: T): Record<string, any> {
  const redacted: Record<string, any> = { ...obj };
  const secretKeys = [
    'password',
    'secret',
    'token',
    'key',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
  ];

  for (const [key, value] of Object.entries(redacted)) {
    const lowerKey = key.toLowerCase();
    const isSecret = secretKeys.some((secretKey) => lowerKey.includes(secretKey));

    if (isSecret && typeof value === 'string') {
      redacted[key] = maskSecret(value);
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSecrets(value);
    }
  }

  return redacted;
}

// ============================================================================
// Development Helpers
// ============================================================================

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get a development-only secret with fallback
 */
export function getDevSecret(key: string, fallback: string): string {
  if (isProduction()) {
    const value = getSecret(key);
    if (!value) {
      throw new Error(`Required secret missing in production: ${key}`);
    }
    return value;
  }

  // Development mode - allow fallback
  return getSecret(key) || fallback;
}
