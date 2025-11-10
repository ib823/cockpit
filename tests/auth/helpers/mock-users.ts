/**
 * Mock User Fixtures
 * Pre-defined test users for various scenarios
 */

export const TEST_USERS = {
  // Regular user with passkey
  REGULAR_USER: {
    email: "test-user@example.com",
    name: "Test User",
    role: "USER" as const,
  },

  // Admin user
  ADMIN_USER: {
    email: "test-admin@example.com",
    name: "Test Admin",
    role: "ADMIN" as const,
    code: "123456",
  },

  // Manager user
  MANAGER_USER: {
    email: "test-manager@example.com",
    name: "Test Manager",
    role: "MANAGER" as const,
  },

  // User without passkey (needs registration)
  NO_PASSKEY_USER: {
    email: "test-no-passkey@example.com",
    name: "No Passkey User",
    role: "USER" as const,
  },

  // User with expired access
  EXPIRED_USER: {
    email: "test-expired@example.com",
    name: "Expired User",
    role: "USER" as const,
  },

  // User without approval
  UNAPPROVED_USER: {
    email: "test-unapproved@example.com",
    name: "Unapproved User",
    role: "USER" as const,
  },
};

export const TEST_SCENARIOS = {
  SUCCESS: {
    passkey: "Valid user with passkey logs in successfully",
    admin: "Admin logs in with valid code",
    magic: "User logs in via magic link",
  },
  FAILURE: {
    notFound: "User email not found in database",
    noPasskey: "User exists but has no passkey registered",
    noApproval: "User has no passkey and no approval",
    expiredAccess: "User access has expired",
    expiredChallenge: "Authentication challenge expired",
    invalidPasskey: "Passkey verification failed",
    invalidCode: "Admin code is incorrect",
    expiredCode: "Admin code has expired",
    usedCode: "Admin code already used",
    expiredToken: "Magic link token expired",
    usedToken: "Magic link already used",
  },
  RATE_LIMIT: {
    exceededLogin: "Too many login attempts",
    exceededApi: "Too many API requests",
    recovery: "Rate limit resets after window",
  },
};
