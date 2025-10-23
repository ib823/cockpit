/**
 * Environment Variable Validation
 * SECURITY: Fails loudly at startup if required variables are missing
 * Provides type-safe access to configuration
 */

import { z } from 'zod';

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database (Required)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  DATABASE_URL_UNPOOLED: z.string().url('DATABASE_URL_UNPOOLED must be a valid PostgreSQL connection URL'),

  // NextAuth (Required)
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters for HS256 security'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // Admin bootstrap (Optional)
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),

  // WebAuthn configuration
  WEBAUTHN_RP_ID: z.string().optional(),
  WEBAUTHN_ORIGIN: z.string().url().optional(),

  // Rate limiting (Redis) - Optional
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email configuration - Optional
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Feature flags
  ENABLE_PASSKEYS: z.string().default('true').transform(val => val === 'true'),
  ENABLE_MAGIC_LINKS: z.string().default('true').transform(val => val === 'true'),

  // Monitoring and analytics - Optional
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // Skip validation during Vercel build time - env vars are injected at runtime
  const isVercelBuild = process.env.VERCEL === '1' && process.env.CI === '1';

  // During Vercel build, return minimal config to allow build to complete
  if (isVercelBuild && !process.env.DATABASE_URL) {
    console.warn('⚠️  Building on Vercel without runtime env vars - using build-time placeholders');
    console.warn('   Environment variables will be validated at runtime');
    return {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
      DATABASE_URL_UNPOOLED: 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
      NEXTAUTH_SECRET: 'placeholder-secret-for-build-only-min-32-chars',
      NEXTAUTH_URL: 'https://placeholder.vercel.app',
      ENABLE_PASSKEYS: true,
      ENABLE_MAGIC_LINKS: true,
    } as Env;
  }

  try {
    const env = envSchema.parse(process.env);

    // Production-specific validations
    if (env.NODE_ENV === 'production') {
      const warnings: string[] = [];

      // Warn about missing production features (non-blocking)
      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
        warnings.push('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (challenge storage will use in-memory fallback)');
      }

      if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
        warnings.push('RESEND_API_KEY and EMAIL_FROM (email features disabled)');
      }

      if (!env.WEBAUTHN_ORIGIN) {
        warnings.push('WEBAUTHN_ORIGIN (passkey authentication may fail)');
      }

      if (!env.SENTRY_DSN) {
        warnings.push('SENTRY_DSN (error tracking disabled)');
      }

      if (!env.NEXT_PUBLIC_POSTHOG_KEY) {
        warnings.push('NEXT_PUBLIC_POSTHOG_KEY (analytics disabled)');
      }

      if (warnings.length > 0) {
        console.warn('⚠️  Production warnings - Missing optional environment variables:');
        warnings.forEach(w => console.warn(`   • ${w}`));
        console.warn('💡 Set these variables in your Vercel dashboard for full functionality\n');
      }
    }

    // Security validation: Ensure NEXTAUTH_SECRET is not a weak default
    // Skip for test environments and Vercel builds (environment vars set in Vercel dashboard)
    const isVercelBuild = process.env.VERCEL === '1';
    if (env.NODE_ENV === 'production' && !isVercelBuild) {
      const dangerousDefaults = [
        'dev-secret-key',
        'change-me',
        'password',
        'nextauth_secret',
        'SESSION_SECRET', // old var name
      ];

      if (dangerousDefaults.some(bad => env.NEXTAUTH_SECRET.toLowerCase().includes(bad))) {
        console.error('❌ SECURITY VIOLATION: NEXTAUTH_SECRET appears to use a default or weak value');
        console.error('   Generate a strong secret with: openssl rand -base64 32');
        throw new Error('Weak NEXTAUTH_SECRET detected');
      }
    }

    // Log successful validation
    if (env.NODE_ENV === 'production') {
      console.log('✅ Environment validation passed (production mode)');
    } else {
      console.log('✅ Environment validation passed (development mode)');
    }

    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.issues.forEach((issue: z.ZodIssue) => {
        const path = issue.path.join('.');
        console.error(`   • ${path}: ${issue.message}`);
      });
    } else {
      console.error('   • ', error);
    }
    console.error('\n💡 See .env.example for required environment variables');
    throw new Error('Environment validation failed - check logs above');
  }
}

// Validate and freeze environment configuration
export const env = validateEnv();

// Prevent accidental mutation
Object.freeze(env);
