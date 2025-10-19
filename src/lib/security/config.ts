/**
 * Security Configuration
 *
 * Central configuration for all security features
 */

export const SECURITY_CONFIG = {
  /**
   * CAPTCHA Settings
   */
  captcha: {
    enabled: process.env.ENABLE_CAPTCHA === 'true',
    provider: (process.env.CAPTCHA_PROVIDER || 'hcaptcha') as 'hcaptcha' | 'recaptcha' | 'turnstile',
    siteKey: process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || '',
    secretKey: process.env.CAPTCHA_SECRET_KEY || '',

    // When to require CAPTCHA
    requireFor: {
      projectCreation: true, // Prevent spam project creation
      import: true, // Prevent automated import attacks
      registration: true, // Prevent bot registrations
      login: false, // Only after failed attempts
      loginAfterFailures: 3, // Require CAPTCHA after 3 failed logins
    },

    // reCAPTCHA v3 specific
    scoreThreshold: 0.5, // 0.0 (bot) to 1.0 (human)
  },

  /**
   * Rate Limiting
   */
  rateLimit: {
    enabled: true,

    // Use Redis in production for distributed rate limiting
    useRedis: process.env.REDIS_URL !== undefined,
    redisUrl: process.env.REDIS_URL,

    // Store cleanup interval (milliseconds)
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  },

  /**
   * Bot Detection
   */
  botDetection: {
    enabled: true,

    // Confidence threshold (0.0 - 1.0)
    // Requests with bot confidence >= threshold are blocked
    threshold: 0.6,

    // Log bot attempts for analysis
    logAttempts: true,

    // Automatically block high-confidence bots
    autoBlock: true,

    // Block duration for detected bots (milliseconds)
    blockDuration: 60 * 60 * 1000, // 1 hour
  },

  /**
   * Abuse Prevention
   */
  abuse: {
    // Detect and prevent suspicious patterns
    detectPatterns: true,

    // Maximum identical actions per minute
    maxIdenticalActionsPerMinute: 10,

    // Automatically escalate to CAPTCHA if suspicious
    escalateToCaptcha: true,

    // Temporarily block suspicious IPs
    tempBlockSuspicious: true,
    tempBlockDuration: 15 * 60 * 1000, // 15 minutes
  },

  /**
   * File Upload Limits
   */
  upload: {
    maxFileSize: 1024 * 1024, // 1MB (for Excel paste)
    maxRows: 500, // Maximum rows in import
    allowedFormats: ['text/plain', 'text/tab-separated-values'],
  },

  /**
   * Session Security
   */
  session: {
    // Require re-authentication for sensitive operations
    requireReauthFor: {
      projectDeletion: false, // Require password confirmation
      exportData: false,
      changeEmail: true,
    },

    // Session timeout (milliseconds)
    timeout: 24 * 60 * 60 * 1000, // 24 hours

    // Idle timeout (milliseconds)
    idleTimeout: 4 * 60 * 60 * 1000, // 4 hours
  },

  /**
   * IP Allowlist/Blocklist
   */
  ipControl: {
    enabled: false, // Disable by default

    // Allowlist (if set, only these IPs can access)
    allowlist: process.env.IP_ALLOWLIST?.split(',') || [],

    // Blocklist (these IPs are always blocked)
    blocklist: process.env.IP_BLOCKLIST?.split(',') || [],
  },

  /**
   * Logging and Monitoring
   */
  logging: {
    // Log security events
    logSecurityEvents: true,

    // Events to log
    events: {
      rateLimitExceeded: true,
      botDetected: true,
      suspiciousPattern: true,
      captchaFailed: true,
      ipBlocked: true,
    },

    // Send alerts for critical events
    alerts: {
      enabled: process.env.ENABLE_SECURITY_ALERTS === 'true',
      webhookUrl: process.env.SECURITY_ALERT_WEBHOOK,
      criticalThreshold: 10, // Alert if 10+ security events in 1 minute
    },
  },
} as const;

/**
 * Security event types for logging
 */
export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  BOT_DETECTED = 'bot_detected',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  CAPTCHA_FAILED = 'captcha_failed',
  IP_BLOCKED = 'ip_blocked',
  ABUSE_DETECTED = 'abuse_detected',
  CONCURRENT_EDIT_CONFLICT = 'concurrent_edit_conflict',
}

/**
 * Log security event
 */
export function logSecurityEvent(
  type: SecurityEventType,
  details: {
    identifier?: string;
    ip?: string;
    userAgent?: string;
    endpoint?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }
): void {
  if (!SECURITY_CONFIG.logging.logSecurityEvents) {
    return;
  }

  const event = {
    type,
    timestamp: new Date().toISOString(),
    ...details,
  };

  // Log to console (replace with proper logging service in production)
  console.warn('[SECURITY EVENT]', JSON.stringify(event));

  // Send alert if critical
  if (SECURITY_CONFIG.logging.alerts.enabled) {
    checkAndSendAlert(type, event);
  }
}

/**
 * Check if security event should trigger alert
 */
const eventCounts = new Map<SecurityEventType, number[]>();

function checkAndSendAlert(type: SecurityEventType, event: any): void {
  const now = Date.now();
  const counts = eventCounts.get(type) || [];

  // Add current event
  counts.push(now);

  // Keep only last 1 minute
  const filtered = counts.filter(timestamp => timestamp > now - 60000);
  eventCounts.set(type, filtered);

  // Send alert if threshold exceeded
  if (filtered.length >= SECURITY_CONFIG.logging.alerts.criticalThreshold) {
    sendSecurityAlert(type, filtered.length, event);

    // Reset to prevent spam
    eventCounts.set(type, []);
  }
}

/**
 * Send security alert to webhook
 */
async function sendSecurityAlert(type: SecurityEventType, count: number, lastEvent: any): Promise<void> {
  const webhookUrl = SECURITY_CONFIG.logging.alerts.webhookUrl;
  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alert: 'SECURITY_THRESHOLD_EXCEEDED',
        type,
        count,
        timeWindow: '1 minute',
        lastEvent,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('[SECURITY ALERT] Failed to send alert:', error);
  }
}

/**
 * Get IP address from request
 */
export function getClientIP(req: Request): string {
  // Check various headers for the real IP (behind proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = req.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Check if IP is allowed
 */
export function isIPAllowed(ip: string): boolean {
  if (!SECURITY_CONFIG.ipControl.enabled) {
    return true;
  }

  // Check blocklist first
  if (SECURITY_CONFIG.ipControl.blocklist.includes(ip)) {
    return false;
  }

  // Check allowlist (if configured)
  if (SECURITY_CONFIG.ipControl.allowlist.length > 0) {
    return SECURITY_CONFIG.ipControl.allowlist.includes(ip);
  }

  return true;
}
