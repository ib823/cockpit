/**
 * Admin Login Tests
 * Tests for /api/auth/admin-login
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { POST as adminLogin } from '../../src/app/api/auth/admin-login/route';
import { createMockRequest, parseJsonResponse } from './helpers/auth-helpers';
import { TEST_SCENARIOS, TEST_USERS } from './helpers/mock-users';
import {
  cleanupTestData,
  createTestAdmin,
  setupTestDatabase,
  teardownTestDatabase,
} from './helpers/test-setup';

describe('Admin Login Flow', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('admin-login success scenarios', () => {
    it(TEST_SCENARIOS.SUCCESS.admin, async () => {
      // Setup: Create admin with code
      const { user, code } = await createTestAdmin({
        email: TEST_USERS.ADMIN_USER.email,
        code: TEST_USERS.ADMIN_USER.code,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: {
          email: user.email,
          code: code,
        },
      });

     /* const response = await adminLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);*/
      const response = await adminLogin(request);
      const data = await parseJsonResponse(response);

      // Debug: Log response if not 200
      if (response.status !== 200) {
        console.error('Test failed - Response:', { status: response.status, data });
      }

      // Assert
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });

  describe('admin-login failure scenarios', () => {
    it(TEST_SCENARIOS.FAILURE.invalidCode, async () => {
      // Setup
      const { user } = await createTestAdmin({
        email: TEST_USERS.ADMIN_USER.email,
        code: '123456',
      });

      // Act: Wrong code
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: {
          email: user.email,
          code: '999999', // Wrong code
        },
      });

      const response = await adminLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.message).toContain('Invalid code');
    });

    it(TEST_SCENARIOS.FAILURE.expiredCode, async () => {
      // Setup: Admin with expired code
      const { user, code } = await createTestAdmin({
        email: TEST_USERS.ADMIN_USER.email,
        code: '123456',
        codeExpired: true,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: {
          email: user.email,
          code: code,
        },
      });

      const response = await adminLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.message).toContain('expired');
    });

    it(TEST_SCENARIOS.FAILURE.usedCode, async () => {
      // Setup: Admin with already used code
      const { user, code } = await createTestAdmin({
        email: TEST_USERS.ADMIN_USER.email,
        code: '123456',
        codeUsed: true,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: {
          email: user.email,
          code: code,
        },
      });

      const response = await adminLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.message).toContain('expired'); // Used codes show as expired
    });

    it('should reject non-admin users', async () => {
      // Setup: Create regular user (not admin) with code
      const { user, code } = await createTestAdmin({
        email: 'regular-user@example.com',
        code: '123456',
      });

      // Downgrade to regular user
      const { testPrisma } = await import('./helpers/test-setup');
      await testPrisma.users.update({
        where: { id: user.id },
        data: { role: 'USER' },
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: {
          email: user.email,
          code: code,
        },
      });

      const response = await adminLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.message).toContain('Invalid credentials');
    });

    it('should reject user not found', async () => {
      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: {
          email: 'nonexistent@example.com',
          code: '123456',
        },
      });

      const response = await adminLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.message).toContain('Invalid credentials');
    });

    it('should reject expired admin access (non-exception)', async () => {
      // Setup: Admin with expired access
      const { user, code } = await createTestAdmin({
        email: TEST_USERS.ADMIN_USER.email,
        code: '123456',
        accessExpired: true,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: {
          email: user.email,
          code: code,
        },
      });

      const response = await adminLogin(request);
      const data = await parseJsonResponse(response);

      // Assert
      expect(response.status).toBe(401);
      expect(data.ok).toBe(false);
      expect(data.message).toContain('expired');
    });

    it('should require email and code', async () => {
      // Act: Missing email
      const request1 = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: { code: '123456' },
      });

      const response1 = await adminLogin(request1);
      const data1 = await parseJsonResponse(response1);

      expect(response1.status).toBe(400);
      expect(data1.ok).toBe(false);
      expect(data1.message).toContain('required');

      // Act: Missing code
      const request2 = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: { email: 'test@example.com' },
      });

      const response2 = await adminLogin(request2);
      const data2 = await parseJsonResponse(response2);

      expect(response2.status).toBe(400);
      expect(data2.ok).toBe(false);
      expect(data2.message).toContain('required');
    });
  });

  describe('admin-login audit logging', () => {
    it('should create audit event on successful login', async () => {
      // Setup
      const { user, code } = await createTestAdmin({
        email: TEST_USERS.ADMIN_USER.email,
        code: TEST_USERS.ADMIN_USER.code,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: { email: user.email, code },
      });

      await adminLogin(request);

      // Assert: Check audit event was created
      const { testPrisma } = await import('./helpers/test-setup');
      const auditEvent = await testPrisma.auditEvent.findFirst({
        where: {
          userId: user.id,
          type: 'admin_login',
        },
      });

      expect(auditEvent).toBeDefined();
      expect(auditEvent?.userId).toBe(user.id);
    });

    it('should mark code as used after successful login', async () => {
      // Setup
      const { user, code } = await createTestAdmin({
        email: TEST_USERS.ADMIN_USER.email,
        code: TEST_USERS.ADMIN_USER.code,
      });

      // Act
      const request = createMockRequest({
        url: 'http://localhost:3000/api/auth/admin-login',
        method: 'POST',
        body: { email: user.email, code },
      });

      await adminLogin(request);

      // Assert: Check code is marked as used
      const { testPrisma } = await import('./helpers/test-setup');
      const approval = await testPrisma.emailApproval.findUnique({
        where: { email: user.email },
      });

      expect(approval?.usedAt).toBeDefined();
      expect(approval?.usedAt).toBeInstanceOf(Date);
    });
  });
});
