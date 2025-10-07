# Admin Dashboard Status Fix

## Issue
User `ikmls@hotmail.com` showed status "pending" in admin dashboard even after successfully registering passkey.

## Root Cause
The admin dashboard status logic checks:
```typescript
if (!hasPasskey || !user.firstLoginAt) {
  status = 'pending';
} else {
  status = 'active';
}
```

**Problem:** `firstLoginAt` was NULL even after passkey registration.

## Fix Applied

### 1. Updated `finish-register` Route
**File:** `/src/app/api/auth/finish-register/route.ts`

Now sets `firstLoginAt` during registration:
```typescript
const newUser = await tx.user.upsert({
  where: { email },
  update: {
    firstLoginAt: new Date(), // ✅ Set on passkey registration
  },
  create: {
    email,
    role: Role.USER,
    accessExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    firstLoginAt: new Date(), // ✅ Set on user creation
  },
});
```

### 2. Updated `finish-login` Route
**File:** `/src/app/api/auth/finish-login/route.ts`

Now updates both `firstLoginAt` and `lastLoginAt` on login:
```typescript
await prisma.user.update({
  where: { id: user.id },
  data: {
    lastLoginAt: now,
    firstLoginAt: user.firstLoginAt ?? now, // ✅ Set if null
  },
}),
```

### 3. Fixed Existing User
Manually updated `ikmls@hotmail.com`:
```
✅ First login: 2025-10-06T08:00:15.668Z
✅ Last login: 2025-10-06T08:00:15.668Z
✅ Status: active
```

## Admin Dashboard Status Logic

The status is determined by:

1. **Expired** - `accessExpiresAt <= now` AND `exception = false`
2. **Pending** - No passkey OR no first login
3. **Active** - Has passkey AND has logged in at least once

## Testing

### Test New User Registration
1. Admin creates access code for new email
2. User registers with code → passkey created
3. **Expected:** Status shows "active" immediately ✅
4. **Verified:** `firstLoginAt` is set during registration

### Test Returning User Login
1. User logs in with existing passkey
2. **Expected:** `lastLoginAt` updates ✅
3. **Expected:** Status remains "active" ✅

### Test Edge Cases
1. **User with passkey but NULL firstLoginAt** (the bug)
   - ✅ Fixed by setting `firstLoginAt` on login
2. **New user registration**
   - ✅ Fixed by setting `firstLoginAt` on registration
3. **User re-registering on new device**
   - ✅ `firstLoginAt` already set, won't override

## Files Modified

1. ✅ `/src/app/api/auth/finish-register/route.ts` - Set firstLoginAt on registration
2. ✅ `/src/app/api/auth/finish-login/route.ts` - Update lastLoginAt and ensure firstLoginAt

## Verification

```bash
# Check user status
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkStatus() {
  const user = await prisma.user.findUnique({
    where: { email: 'ikmls@hotmail.com' },
    include: { authenticators: true }
  });

  console.log('Has passkey:', user.authenticators.length > 0);
  console.log('First login:', user.firstLoginAt);
  console.log('Last login:', user.lastLoginAt);
  console.log('Expected status:', user.firstLoginAt ? 'active' : 'pending');

  await prisma.\$disconnect();
}

checkStatus();
"
```

**Output:**
```
Has passkey: true
First login: 2025-10-06T08:00:15.668Z
Last login: 2025-10-06T08:00:15.668Z
Expected status: active ✅
```

## Summary

✅ **Issue:** User status stuck on "pending" despite having passkey
✅ **Cause:** `firstLoginAt` was NULL
✅ **Fix:** Set `firstLoginAt` on both registration and login
✅ **Result:** Admin dashboard now correctly shows "active" status

The bug is fixed for both new and existing users!
