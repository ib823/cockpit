/**
 * CAPTCHA Integration
 *
 * Protects against automated bot abuse
 * Supports multiple CAPTCHA providers:
 * - hCaptcha (recommended - privacy-focused)
 * - Google reCAPTCHA v3 (invisible, automatic)
 * - Turnstile (Cloudflare)
 */

export type CaptchaProvider = "hcaptcha" | "recaptcha" | "turnstile";

interface CaptchaConfig {
  provider: CaptchaProvider;
  siteKey: string;
  secretKey: string;
  scoreThreshold?: number; // For reCAPTCHA v3 (0.0 - 1.0)
}

/**
 * Verify CAPTCHA token on server-side
 */
export async function verifyCaptcha(
  token: string,
  config: CaptchaConfig,
  userIP?: string
): Promise<{
  success: boolean;
  score?: number; // reCAPTCHA v3 score
  challengeTimestamp?: string;
  hostname?: string;
  errorCodes?: string[];
}> {
  try {
    switch (config.provider) {
      case "hcaptcha":
        return await verifyHCaptcha(token, config.secretKey, userIP);

      case "recaptcha":
        return await verifyRecaptcha(token, config.secretKey, userIP);

      case "turnstile":
        return await verifyTurnstile(token, config.secretKey, userIP);

      default:
        throw new Error(`Unsupported CAPTCHA provider: ${config.provider}`);
    }
  } catch (error) {
    console.error("[CAPTCHA] Verification failed:", error);
    return {
      success: false,
      errorCodes: ["verification-failed"],
    };
  }
}

/**
 * Verify hCaptcha token
 */
async function verifyHCaptcha(token: string, secretKey: string, userIP?: string): Promise<any> {
  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(userIP && { remoteip: userIP }),
    }),
  });

  const data = await response.json();

  return {
    success: data.success,
    challengeTimestamp: data.challenge_ts,
    hostname: data.hostname,
    errorCodes: data["error-codes"],
  };
}

/**
 * Verify Google reCAPTCHA v3 token
 */
async function verifyRecaptcha(token: string, secretKey: string, userIP?: string): Promise<any> {
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(userIP && { remoteip: userIP }),
    }),
  });

  const data = await response.json();

  return {
    success: data.success,
    score: data.score, // 0.0 - 1.0 (1.0 = likely human)
    challengeTimestamp: data.challenge_ts,
    hostname: data.hostname,
    errorCodes: data["error-codes"],
  };
}

/**
 * Verify Cloudflare Turnstile token
 */
async function verifyTurnstile(token: string, secretKey: string, userIP?: string): Promise<any> {
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret: secretKey,
      response: token,
      ...(userIP && { remoteip: userIP }),
    }),
  });

  const data = await response.json();

  return {
    success: data.success,
    challengeTimestamp: data.challenge_ts,
    hostname: data.hostname,
    errorCodes: data["error-codes"],
  };
}

/**
 * Client-side CAPTCHA loader
 */
export function loadCaptchaScript(provider: CaptchaProvider, siteKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("CAPTCHA can only be loaded in browser"));
      return;
    }

    // Check if already loaded
    const scriptId = `captcha-${provider}`;
    if (document.getElementById(scriptId)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${provider} script`));

    switch (provider) {
      case "hcaptcha":
        script.src = "https://js.hcaptcha.com/1/api.js";
        break;

      case "recaptcha":
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        break;

      case "turnstile":
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        break;

      default:
        reject(new Error(`Unknown provider: ${provider}`));
        return;
    }

    document.head.appendChild(script);
  });
}

/**
 * Execute CAPTCHA challenge
 */
export function executeCaptcha(
  provider: CaptchaProvider,
  siteKey: string,
  action?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("CAPTCHA can only be executed in browser"));
      return;
    }

    switch (provider) {
      case "hcaptcha":
        // @ts-ignore
        if (window.hcaptcha) {
          // @ts-ignore
          window.hcaptcha
            .execute(siteKey, { async: true })
            .then((token: string) => resolve(token))
            .catch((error: any) => reject(error));
        } else {
          reject(new Error("hCaptcha not loaded"));
        }
        break;

      case "recaptcha":
        // @ts-ignore
        if (window.grecaptcha) {
          // @ts-ignore
          window.grecaptcha.ready(() => {
            // @ts-ignore
            window.grecaptcha
              .execute(siteKey, { action: action || "submit" })
              .then((token: string) => resolve(token))
              .catch((error: any) => reject(error));
          });
        } else {
          reject(new Error("reCAPTCHA not loaded"));
        }
        break;

      case "turnstile":
        // @ts-ignore
        if (window.turnstile) {
          // @ts-ignore
          window.turnstile.execute(siteKey, {
            callback: (token: string) => resolve(token),
            "error-callback": () => reject(new Error("Turnstile failed")),
          });
        } else {
          reject(new Error("Turnstile not loaded"));
        }
        break;

      default:
        reject(new Error(`Unknown provider: ${provider}`));
    }
  });
}

/**
 * Simple honeypot field check (catches basic bots)
 */
export function checkHoneypot(honeypotValue: string): boolean {
  // Honeypot should be empty (hidden from humans, filled by bots)
  return honeypotValue === "" || honeypotValue === undefined;
}

/**
 * Timing check (detects automated form submissions)
 */
export function checkFormTiming(startTime: number, minSeconds: number = 3): boolean {
  const elapsed = (Date.now() - startTime) / 1000;
  return elapsed >= minSeconds; // Humans take at least minSeconds to fill form
}
