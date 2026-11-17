# KeedoHub Admin Authentication & Temporary Email/Password Setup

This guide documents exact manual steps to restore/test Admin HQ login on Firebase project `alpine-scion-kds98` and named Firestore database `ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38`.

> **Safety Notice:** `alpine-scion-kds98` is treated as the live KeedoHub production project. Do **not** deploy rules or create/modify Auth or Firestore records without explicit project owner approval.

---

## 1. Root Causes Fixed in Code

1. **`/admins/{uid}` and `/workspaces/{workspaceId}` Firestore rules (`firestore.rules`)**:
   - `match /admins/{adminId}` previously denied `list` (`allow write: if false; allow get: ...`), while `AdminAccounts.tsx` and admin checks needed active `PlatformAdmin` `list` access. Updated to:
     - `allow get: if isSignedIn() && (request.auth.uid == adminId || isPlatformAdmin());`
     - `allow list: if isPlatformAdmin();`
   - `isWorkspaceOwner` and `isWorkspaceMember` previously evaluated workspace document helpers before `isPlatformAdmin()`, causing admin queries on `workspaces` (or workspaces without client status) to fail. Both helpers and `match /workspaces/{workspaceId}` `allow read` now evaluate `isPlatformAdmin() || ...` first.
2. **Missing `status` field on `clientProfiles/{uid}` (`AppContext.tsx` & `firestore.rules`)**:
   - Known admin `artkidmummyspet@gmail.com` (`6FcpXQYOxGMY2nltDFIvphnlcF03`) had a `/clientProfiles/{uid}` document without a `status` property.
   - `firestore.rules` `isWorkspaceAccountActive()` now checks `!get(...).data.keys().hasAny(['status']) || ...status != 'Suspended'`.
   - `AppContext.tsx` defaults `status: 'Active'` when hydrating `clientProfiles/{uid}` documents missing `status`.
3. **Google Sign-In `auth/unauthorized-domain` in Preview (`firebaseAuth.ts` & `AdminLoginPage.tsx`)**:
   - Added explicit `auth/unauthorized-domain` error guidance and restored Email & Password login + Forgot Password reset on `/admin-login`.

---

## 2. Manual Owner Steps to Activate Email/Password Admin Testing

### Step A — Deploy Updated `firestore.rules` (Requires Owner Approval)

From the repository root, after reviewing `firestore.rules`:

```bash
firebase deploy --only firestore:rules --project alpine-scion-kds98
```

### Step B — Enable Email/Password Sign-In Provider

1. Open [Firebase Console](https://console.firebase.google.com/) → project **`alpine-scion-kds98`**.
2. Go to **Build → Authentication → Sign-in method**.
3. Enable **Email/Password** (keep Google enabled).

### Step C — Option 1: Set / Link a Password for the Existing Admin (`artkidmummyspet@gmail.com`)

Because `artkidmummyspet@gmail.com` (`6FcpXQYOxGMY2nltDFIvphnlcF03`) already has an active `/admins/6FcpXQYOxGMY2nltDFIvphnlcF03` record:

1. In Firebase Console → **Authentication → Users**, locate `artkidmummyspet@gmail.com` (`6FcpXQYOxGMY2nltDFIvphnlcF03`).
2. Either use **Forgot password?** on the KeedoHub `/admin-login` page (which triggers `sendPasswordResetEmail` once Email/Password is enabled and sets/links a password to the same UID), **or** set/add an Email/Password credential for that account in Firebase Auth without deleting the existing UID.
3. Verify `/clientProfiles/6FcpXQYOxGMY2nltDFIvphnlcF03` in Firestore database `ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38` contains:
   - `uid`: `"6FcpXQYOxGMY2nltDFIvphnlcF03"`
   - `email`: `"artkidmummyspet@gmail.com"`
   - `onboardingComplete`: `true`
   - `status`: `"Active"` (recommended even though missing `status` is now safely handled)
4. Optional (for task/project assignee picker & notifications): create `/users/6FcpXQYOxGMY2nltDFIvphnlcF03` with `uid`, `displayName`, `email`.

### Step C — Option 2: Create a Dedicated Temporary Email/Password Test Admin

1. In Firebase Console → **Authentication → Users**, click **Add user**, enter a dedicated test admin email and strong temporary password, and copy the newly created **User UID** (`<TEST_ADMIN_UID>`).
2. In Firestore Database `ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38`, create:
   - Document `/admins/<TEST_ADMIN_UID>`:
     ```json
     {
       "uid": "<TEST_ADMIN_UID>",
       "role": "PlatformAdmin",
       "status": "Active",
       "grantedAt": "2026-01-01T00:00:00.000Z"
     }
     ```
   - Document `/clientProfiles/<TEST_ADMIN_UID>`:
     ```json
     {
       "uid": "<TEST_ADMIN_UID>",
       "displayName": "Test Platform Admin",
       "email": "<TEST_ADMIN_EMAIL>",
       "accountType": "Brand",
       "organizationName": "KeedoHub Internal",
       "onboardingComplete": true,
       "status": "Active",
       "createdAt": "2026-01-01T00:00:00.000Z",
       "updatedAt": "2026-01-01T00:00:00.000Z"
     }
     ```
   - Document `/users/<TEST_ADMIN_UID>` (recommended so production task assignment & `userNotifications` resolve cleanly):
     ```json
     {
       "uid": "<TEST_ADMIN_UID>",
       "displayName": "Test Platform Admin",
       "email": "<TEST_ADMIN_EMAIL>",
       "createdAt": "2026-01-01T00:00:00.000Z",
       "updatedAt": "2026-01-01T00:00:00.000Z"
     }
     ```
3. When finished testing, either delete the temporary Auth user and Firestore docs or revoke via Admin HQ → Administrator Management.

---

## 3. Re-Enabling Google Sign-In in Preview & Production Domains

When ready to restore Google Sign-In in the AI Studio preview environment:

1. Open Firebase Console → project **`alpine-scion-kds98`** → **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and add:
   - `ais-dev-r5qcdurldhm6joxhkyfpz7-779145751099.europe-west2.run.app` (and your production domain when deployed).
3. Wait ~1–2 minutes and retry **Continue with Google** on `/admin-login`.
