# Migration Notes - NextAuth Authentication System

This document outlines the breaking changes and migration steps from the previous custom JWT authentication system to NextAuth 4.24.

## Summary of Changes

The application has migrated from a custom `jose` JWT-based authentication system to **NextAuth 4.24** with the following goals:

- ✅ Standardize authentication using industry-standard NextAuth
- ✅ Maintain WebAuthn/Passkeys support
- ✅ Preserve role-based access control (USER, MANAGER, ADMIN)
- ✅ Add audit logging for security events
- ✅ Implement edge-compatible middleware

**Date**: January 2025
**Version**: 0.1.x

---

## Breaking Changes

### 1. Environment Variables

#### REMOVED:
```bash
SESSION_SECRET=your-secret-key  # ❌ No longer used
```

#### ADDED:
```bash
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars  # ✅ Required (min 32 characters)
NEXTAUTH_URL=http://localhost:3000                  # ✅ Required
```

**Action Required**:
- Update `.env.local` to use `NEXTAUTH_SECRET` instead of `SESSION_SECRET`
- Generate a secure secret: `openssl rand -base64 32`
- Add `NEXTAUTH_URL` pointing to your application URL

### 2. Session Structure

#### Old Session Structure (jose):
```typescript
interface Session {
  sub: string;        // User ID
  role: string;       // User role
  iat: number;        // Issued at
  exp: number;        // Expiration
}

// Usage:
const userId = session.sub;
const userRole = session.role;
```

#### New Session Structure (NextAuth):
```typescript
interface Session {
  user: {
    id: string;       // User ID (was `sub`)
    email: string;    // User email
    role: 'USER' | 'MANAGER' | 'ADMIN';
  };
  expires: string;    // ISO date string
}

// Usage:
const userId = session.user.id;
const userRole = session.user.role;
const userEmail = session.user.email;
```

**Action Required**:
- Update code that accesses `session.sub` to use `session.user.id`
- Update code that accesses `session.role` to use `session.user.role`
- Add email handling if needed (`session.user.email`)

### 3. API Changes

#### Removed Files:
- `src/lib/session.ts` - Custom jose JWT session management
- `src/shims/` directory - Monday UI component shims

#### Added Files:
- `src/lib/nextauth-helpers.ts` - NextAuth session helpers
- `src/types/next-auth.d.ts` - NextAuth TypeScript type extensions

#### Updated Files:
- `src/lib/auth.ts` - Now uses NextAuth configuration
- `src/lib/env.ts` - Updated to validate `NEXTAUTH_SECRET`
- `src/middleware.ts` - Edge-compatible JWT decoding

### 4. Authentication Flow Changes

#### Old Flow (Custom JWT):
```typescript
import { setSession, logout } from '@/lib/session';

// Login
await setSession({ sub: user.id, role: 'USER' });

// Logout
await logout();

// Get session
const session = await getSession();
```

#### New Flow (NextAuth):
```typescript
import { createAuthSession, destroyAuthSession, getAuthSession } from '@/lib/nextauth-helpers';

// Login (for custom WebAuthn routes)
await createAuthSession(user.id, user.email, 'USER');

// Logout
await destroyAuthSession();

// Get session
const session = await getAuthSession();
```

**Action Required**:
- Replace imports of `setSession`, `logout`, `getSession` from `@/lib/session`
- Use new functions from `@/lib/nextauth-helpers`
- Update function signatures to include email parameter

---

## Migration Steps

### For Existing Deployments

#### Step 1: Update Environment Variables
```bash
# Old .env.local
SESSION_SECRET=abc123

# New .env.local
NEXTAUTH_SECRET=your-new-secret-minimum-32-characters-long-change-me
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

⚠️ **Important**: Changing secrets will **invalidate all existing sessions**. Users will need to log in again.

#### Step 2: Update Code References

If you have custom code that accesses sessions:

```typescript
// OLD CODE ❌
const userId = session.sub;
const role = session.role;

// NEW CODE ✅
const userId = session.user.id;
const role = session.user.role;
const email = session.user.email;
```

#### Step 3: Test Authentication Flow

1. **Login**: Test all login methods (WebAuthn, magic link, password)
2. **Session**: Verify sessions persist across page refreshes
3. **Logout**: Confirm logout clears session
4. **RBAC**: Test role-based access control (USER, MANAGER, ADMIN routes)
5. **Middleware**: Verify protected routes redirect to `/login`

#### Step 4: Verify Database

No database schema changes are required. The migration is authentication-layer only.

```bash
# Verify Prisma schema
pnpm prisma validate

# Optional: Check for pending migrations
pnpm prisma migrate status
```

#### Step 5: Deploy

1. Update environment variables in production
2. Deploy the updated code
3. Monitor logs for authentication errors
4. Notify users that they may need to log in again

---

## Technical Details

### Custom WebAuthn Integration

The migration preserves custom WebAuthn routes by using NextAuth's manual session creation:

```typescript
// src/lib/nextauth-helpers.ts
import { encode } from 'next-auth/jwt';

export async function createAuthSession(
  userId: string,
  email: string,
  role: 'USER' | 'MANAGER' | 'ADMIN'
): Promise<void> {
  const token = await encode({
    token: {
      userId,
      email,
      role,
      sub: userId,
    },
    secret: env.NEXTAUTH_SECRET,
    maxAge: 24 * 60 * 60,
  });

  const cookieStore = await cookies();
  cookieStore.set('next-auth.session-token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
}
```

This allows custom authentication flows to create NextAuth-compatible sessions.

### Edge Runtime Compatibility

The middleware now uses edge-compatible JWT decoding:

```typescript
// src/middleware.ts
import { decode } from "next-auth/jwt";

const session = await decode({
  token: request.cookies.get('next-auth.session-token')?.value,
  secret: process.env.NEXTAUTH_SECRET!,
});
```

This replaces `getServerSession()` which is not compatible with Edge Runtime.

### Type Safety

NextAuth types are extended via module augmentation:

```typescript
// src/types/next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: 'USER' | 'MANAGER' | 'ADMIN';
    } & DefaultSession['user'];
  }
}
```

This ensures TypeScript knows about custom `role` property.

---

## Rollback Plan

If issues occur, you can rollback by:

1. Revert to previous commit: `git revert HEAD`
2. Restore old environment variables (`SESSION_SECRET`)
3. Redeploy previous version
4. Notify users of potential session loss

**Rollback commits**:
- Last stable pre-migration: `b2b81073` (SNAPSHOT: Before release engineering fixes)

---

## Affected Routes

### Custom Authentication Routes (Updated):
- `/api/auth/finish-login` - WebAuthn login completion
- `/api/auth/admin-login` - Admin passkey login
- `/api/auth/finish-register` - Registration completion
- `/api/auth/logout` - Session termination
- `/api/auth/magic-login` - Magic link authentication

### Protected API Routes (Updated):
- `/api/admin/*` - Admin dashboard APIs
- `/api/projects/*` - Project management APIs
- `/api/approvals/*` - Approval workflow APIs
- `/api/dependencies/*` - Dependency tracking APIs
- `/api/users/*` - User management APIs

### Middleware Protection:
All routes except `/login`, `/api/auth/*`, and static assets require authentication.

---

## Testing Checklist

- [ ] Environment variables updated in all environments (dev, staging, prod)
- [ ] Login works with all methods (WebAuthn, magic link, password)
- [ ] Sessions persist across page refreshes
- [ ] Logout properly clears sessions
- [ ] Role-based access control works (USER, MANAGER, ADMIN)
- [ ] Middleware redirects unauthenticated users to `/login`
- [ ] Middleware blocks users from `/admin` routes without ADMIN role
- [ ] Build succeeds: `pnpm build`
- [ ] TypeScript check passes: `pnpm typecheck`
- [ ] Tests pass: `pnpm test`
- [ ] Rate limiting works (60 req/min, 5 login attempts/5min)
- [ ] Audit logs capture admin access events

---

## Support

If you encounter issues during migration:

1. Check environment variables are correctly set
2. Verify `NEXTAUTH_SECRET` is at least 32 characters
3. Clear browser cookies and try logging in again
4. Check server logs for authentication errors
5. Verify database connection is working: `pnpm prisma db pull`

For security-related issues, see `SECURITY.md`.

---

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth JWT Documentation](https://next-auth.js.org/configuration/options#jwt)
- [Edge Runtime Compatibility](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [WebAuthn Guide](https://webauthn.guide/)

---

**Migration Completed**: January 2025
**Next Review**: Q2 2025 (NextAuth 5.x upgrade consideration)
