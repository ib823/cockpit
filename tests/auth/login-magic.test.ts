/**
 * Magic Link Login Tests
 * Tests for /api/auth/magic-login
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { POST as magicLogin } from '../../src/app/api/auth/magic-login/route';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUserWithPasskey,
  createTestUserWithoutPasskey,
  createTestMagicToken,
} from './helpers/test-setup';
import { createMockRequest, parseJsonResponse } from './helpers/auth-helpers';
import { TEST_USERS, TEST_SCENARIOS } from './helpers/mock-users';

describe('Magic Link Login Flow', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('magic-login with existing passkey', () => {
    it('should return auth challenge for user with passkey', async () => {
      // Setup
      const { user } = await createTestUserWithPasskey({
        email: TEST_USERS.REGULAR_USER.email,
      });

      const token = await createTestMagicToken({
        email: user.email,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: { token },
      });

      const response = await magicLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.requiresPasskeyAuth).toBe(true);
      expect(data.options).toBeDefined();
      expect(data.email).toBe(user.email);
      expect(data.message).toContain('authenticate with your passkey');
    });
  });

  describe('magic-login without passkey', () => {
    it('should return registration challenge for user without passkey', async () => {
      // Setup
      const { user } = await createTestUserWithoutPasskey({
        email: TEST_USERS.NO_PASSKEY_USER.email,
        hasApproval: false,
      });

      const token = await createTestMagicToken({
        email: user.email,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: { token },
      });

      const response = await magicLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.requiresPasskeyRegistration).toBe(true);
      expect(data.options).toBeDefined();
      expect(data.email).toBe(user.email);
      expect(data.message).toContain('set up your passkey');
    });
  });

  describe('magic-login failure scenarios', () => {
    it(TEST_SCENARIOS.FAILURE.expiredToken, async () => {
      // Setup: User with expired token
      const { user } = await createTestUserWithPasskey({
        email: TEST_USERS.REGULAR_USER.email,
      });

      const token = await createTestMagicToken({
        email: user.email,
        expired: true,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: { token },
      });

      const response = await magicLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.error).toContain('expired');
    });

    it(TEST_SCENARIOS.FAILURE.usedToken, async () => {
      // Setup: User with already used token
      const { user } = await createTestUserWithPasskey({
        email: TEST_USERS.REGULAR_USER.email,
      });

      const token = await createTestMagicToken({
        email: user.email,
        used: true,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: { token },
      });

      const response = await magicLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.error).toContain('already been used');
    });

    it('should reject invalid token', async () => {
      // Act: Non-existent token
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: { token: 'invalid-token-12345' },
      });

      const response = await magicLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.error).toContain('Invalid or expired');
    });

    it('should reject missing token', async () => {
      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: {},
      });

      const response = await magicLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(400);
      expect(data.ok).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should reject when user not found', async () => {
      // Setup: Token for non-existent user
      const { testPrisma } = await import('./helpers/test-setup');
      const token = 'test-token-' + Date.now();

      await testPrisma.magic_tokens.create({
        data: {
          id: 'test-' + Date.now(),
          email: 'nonexistent@example.com',
          token,
          expiresAt: new Date(Date.now() + 2 * 60 * 1000),
          usedAt: null,
        },
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: { token },
      });

      const response = await magicLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(404);
      expect(data.ok).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should reject expired user access', async () => {
      // Setup: User with expired access
      const { user } = await createTestUserWithPasskey({
        email: TEST_USERS.EXPIRED_USER.email,
        accessExpiresAt: new Date(Date.now() - 1000),
        exception: false,
      });

      const token = await createTestMagicToken({
        email: user.email,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: { token },
      });

      const response = await magicLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(403);
      expect(data.ok).toBe(false);
      expect(data.error).toContain('expired');
    });
  });

  describe('magic-login token marking', () => {
    it('should mark token as used after processing', async () => {
      // Setup
      const { user } = await createTestUserWithPasskey({
        email: TEST_USERS.REGULAR_USER.email,
      });

      const token = await createTestMagicToken({
        email: user.email,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: { token },
      });

      await magicLogin(request);

      // Assert: Check token is marked as used
      const { testPrisma } = await import('./helpers/test-setup');
      const magicToken = await testPrisma.magic_tokens.findUnique({
        where: { token },
      });

      expect(magicToken?.usedAt).toBeDefined();
      expect(magicToken?.usedAt).toBeInstanceOf(Date);
    });

    it('should store device info', async () => {
      // Setup
      const { user } = await createTestUserWithPasskey({
        email: TEST_USERS.REGULAR_USER.email,
      });

      const token = await createTestMagicToken({
        email: user.email,
      });

      const deviceInfo = JSON.stringify({
        browser: 'Chrome',
        os: 'Windows',
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/magic-login',
        method: 'POST',
        body: { token, deviceInfo },
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser',
          'x-forwarded-for': '192.168.1.1',
        },
      });

      await magicLogin(request);

      // Assert: Check device info is stored
      const { testPrisma } = await import('./helpers/test-setup');
      const magicToken = await testPrisma.magic_tokens.findUnique({
        where: { token },
      });

      expect(magicToken?.deviceInfo).toBeDefined();
      expect(magicToken?.ipAddress).toBe('192.168.1.1');

      if (magicToken?.deviceInfo) {
        const storedInfo = JSON.parse(magicToken.deviceInfo as string);
        expect(storedInfo.browser).toBe('Chrome');
        expect(storedInfo.os).toBe('Windows');
        expect(storedInfo.ip).toBe('192.168.1.1');
        expect(storedInfo.userAgent).toBe('Mozilla/5.0 Test Browser');
      }
    });
  });
});
