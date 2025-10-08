/**
 * Environment Variable Validation
 * SECURITY: Fails loudly at startup if required variables are missing
 * Provides type-safe access to configuration
 */

import { z } from 'zod';

const envSchema = z.object({
  // Required in all environments
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  DATABASE_URL_UNPOOLED: z.string().url('DATABASE_URL_UNPOOLED must be a valid PostgreSQL connection URL'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters for HS256 security'),
  
  // Base URL for magic links and redirects
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Rate limiting (Redis)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Email configuration
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // WebAuthn configuration
  RP_ID: z.string().optional(),
  RP_NAME: z.string().default('SAP Presales Engine'),
  RP_ORIGIN: z.string().url().optional(),
  
  // Feature flags
  //ENABLE_PASSKEYS: z.string().transform(val => val === 'true').default('true'),
  //ENABLE_MAGIC_LINKS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_PASSKEYS: z.string().default('true').transform(val => val === 'true'),
  ENABLE_MAGIC_LINKS: z.string().default('true').transform(val => val === 'true'),

  // Monitoring and analytics
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // Production-specific validations
    if (env.NODE_ENV === 'production') {
      const missingProdVars: string[] = [];
      
      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
        missingProdVars.push('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (required for distributed rate limiting)');
      }
      
      if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
        missingProdVars.push('RESEND_API_KEY and EMAIL_FROM (required for magic link emails)');
      }
      
      if (!env.RP_ORIGIN) {
        missingProdVars.push('RP_ORIGIN (required for passkey authentication)');
      }
      
      if (missingProdVars.length > 0) {
        console.error('❌ Production deployment blocked: Missing required environment variables:');
        missingProdVars.forEach(varName => {
          console.error(`   • ${varName}`);
        });
        console.error('\n💡 Set these variables in your Vercel dashboard or .env.production.local file');
        throw new Error('Environment validation failed');
      }
      
      // Warn about missing optional production features
      if (!env.SENTRY_DSN) {
        console.warn('⚠️  SENTRY_DSN not set - error tracking disabled');
      }
      
      if (!env.NEXT_PUBLIC_POSTHOG_KEY) {
        console.warn('⚠️  NEXT_PUBLIC_POSTHOG_KEY not set - analytics disabled');
      }
    }
    
    // Security validation: Ensure SESSION_SECRET is not the obvious default
    const dangerousDefaults = [
      'dev-secret-key',
      'change-me',
      'secret',
      'password',
      'SESSION_SECRET',
    ];
    
    if (dangerousDefaults.some(bad => env.SESSION_SECRET.toLowerCase().includes(bad))) {
      console.error('❌ SECURITY VIOLATION: SESSION_SECRET appears to use a default or weak value');
      console.error('   Generate a strong secret with: openssl rand -base64 32');
      throw new Error('SECURITY VIOLATION: SESSION_SECRET appears to use a default or weak value');
    }
    
    // Log successful validation
    if (env.NODE_ENV === 'production') {
      console.log('✅ Environment validation passed (production mode)');
    } else {
      console.log('✅ Environment validation passed (development mode)');
    }
    
    return env;
  /** } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError && error.errors) {
      error.errors.forEach(err => {
        const path = err.path.join('.');
        console.error(`   • ${path}: ${err.message}`);
      });
    } else {
      console.error('   • ', error);
    }
    throw new Error('Environment validation failed');
  } */
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        console.error(`   • ${path}: ${err.message}`);
      });
    } else {
      console.error('   • ', error);
    }
    throw new Error('Environment validation failed');
}

}

// Validate and freeze environment configuration
export const env = validateEnv();

// Prevent accidental mutation
Object.freeze(env);
