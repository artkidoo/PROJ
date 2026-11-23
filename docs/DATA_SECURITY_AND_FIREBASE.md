# KeedoHub Data, Firebase & Security Architecture

**Document Status:** Infrastructure Audit & Risk Register  
**Primary Sources:** `firebase.json`, `firestore.rules` (913 lines), `storage.rules` (293 lines), `firestore.indexes.json` (34 lines), `firebase-blueprint.json` (401 lines), `functions/src/index.ts` (1,489 lines), `src/lib/firebase.ts`, `src/lib/creativeProductAccess.ts`.  
*(Security Note: Zero API keys, service account credentials, or private environment secrets are included in this document.)*

---

## 1. Firebase Infrastructure Overview

- **Firebase Project & Named Firestore Database:**
  - `firebase.json` configures the named Firestore database ID: **`ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38`** alongside Cloud Functions (`functions/`), Storage (`storage.rules`), and local Emulators (`demo-keedohub` in `QA_SETUP.md`).
  - **Hard Infrastructure Rule (`Confirmed from code`):** Because `functions/src/index.ts:5`, `storage.rules` cross-service `firestore.get(...)` paths, and client initialization pin this exact database ID, **never change or rename it without a dedicated database export/import and simultaneous Cloud Functions + Rules redeployment**.
- **Firebase Authentication (`IMPLEMENTED — RUNTIME VERIFICATION PENDING`):**
  - Supports Email/Password, Password Reset, and Google Sign-In (`src/lib/firebaseAuth.ts`). See `ADMIN_SETUP.md` for preview-domain authorized host configuration.

---

## 2. Backend Security & Cloud Functions Inventory (`functions/src/index.ts`)

`functions/src/index.ts` implements 17 Cloud Functions enforcing `assertActiveAdmin()` (`admins/{uid}` + active `clientProfiles` check), payload validation, and immutable `adminAuditLogs` writes (`IMPLEMENTED — RUNTIME VERIFICATION PENDING`):
- **Public & Profile:** `submitPublicEnquiry`, `updateClientOwnProfile` *(note: currently validates `['Artist', 'Brand', 'Company']` on line 132—scheduled for Phase 1 update)*.
- **Admin Governance & Workspace Admin:** `adminUpdatePlatformRole` (with self-modification and last-admin protection), `adminUpdateClientStatus`, `adminCreateClientWorkspace`, `adminUpdateWorkspace`, `adminSaveServicePackage` *(already validates `targetAudience: 'Artist' | 'Brand' | 'Both'` on line 516)*.
- **Production Lifecycle & Deliverable Reviews:** Request submission/triage, deliverable publication, client approve/revision submission, notification triggers (`onDocumentWritten` / scheduled deadline cron).
- **Missing Backend Functions (`PLANNED`):** No Cloud Functions currently exist for Invoices, Proposals, Payments/Webhooks (`onRequest`), Automated Subscription Entitlement Sync/Expiry, or `Slack` webhook dispatch (even though `PlatformSettingsManagement.tsx` stores `slackWebhookUrl`).

---

## 3. Firestore Collections & Security Rules Overview (`firestore.rules`)

| Collection / Path | Read Rule (`Confirmed from code`) | Write Rule (`Confirmed from code`) | Known Audit Risks / Gaps |
|---|---|---|---|
| `/admins/{adminId}` | Signed-in owner `get`; `isPlatformAdmin()` `list` | Client write `false` (Cloud Functions only) | `IMPLEMENTED` |
| `/users/{userId}` | Owner or active Admin | Owner (`clientProfiles` constraints) or Admin | `accountType` still allows `'Company'`. |
| `/clientProfiles/{profileId}` | Owner `get`; Admin `read` | Owner create/restricted update (`accountType`, `status`, `onboardingComplete` guarded) | `accountType in ['Artist', 'Brand', 'Company']` (lines 449, 483, 510). Needs Phase 1 dual-read transition. |
| `/workspaces/{workspaceId}` | `isPlatformAdmin()` or `isWorkspaceMember()` | Owner (`isWorkspaceOwner`) restricted fields or Admin | `type` allows 7 legacy enums (line 361); `contractedPackageIds` capped at 5 items in entitlement checks; `packageEntitlements` expiry ignored by rules. |
| `/workspaces/{ws}/documents/{docId}` | `isWorkspaceMember(ws)` | `isWorkspaceMember(ws)` (**line 402**) | **CRITICAL VULNERABILITY:** Allows clients to forge/overwrite `'invoice'`, `'quotation'`, and proposal statuses/totals. Must lock in Phase 2. |
| `/workspaces/{ws}/brandAssets/{assetId}` | `isWorkspaceMember` (`isInternal == false`) or Admin | `isWorkspaceMember` (`isInternal == false`) or Admin | Well-isolated from internal working assets. |
| `/workspaces/{ws}/internalAssets/{assetId}` | `isPlatformAdmin()` | `isPlatformAdmin()` | Properly Admin-locked. |
| `/clientProjects/{projectId}` & subcollections | Client owner (published deliverables, `clientVisible` tasks/activities) or Admin | Client limited request/review; Admin full production (`internalNotes` Admin-only) | Add `department: 'Artist' \| 'Brand'` & optional `allowPublicShowcase` flag for Brand Room showcase consent. |
| `/services/{serviceId}` | Public read (active packages) + Admin all | Admin / Cloud Function only | Already standardized on `Artist | Brand | Both`. |
| `/creativeProducts/{productId}` | Admin all; Clients gated by `status == 'Published'`, `audience` match, and Phase 8.5 `accessType` (`Free` / `assignedWorkspaceIds` / `includedPackageIds` check) | `isPlatformAdmin()` | **Gap:** Rules check `contractedPackageIds[0..4]` only—ignoring `packageEntitlements[].expiresAt` & `status` enforced client-side in `creativeProductAccess.ts`. **Brand Room risk:** Brand Room must never mix here. |
| `/creativeProductInternalSpecs/{specId}` | `isPlatformAdmin()` | `isPlatformAdmin()` | Properly Admin-locked. |
| `/brandRoomIdentity`, `/brandRoomPillars`, `/brandRoomSeries`, `/brandRoomAssets` | `isPlatformAdmin()` only (lines 877–910) | `isPlatformAdmin()` only | Properly isolated internal KeedoHub studio collections. |
| `/serviceEnquiries`, `/adminAuditLogs`, `/settings`, `/userNotifications` | Scoped per role (Admin or recipient `uid`) | Server/Admin-controlled (`adminAuditLogs` immutable) | `IMPLEMENTED`. |
| `/invoices`, `/proposals`, `/subscriptions`, `/paymentEvents` | *Does not exist yet* | *Does not exist yet* | **`PLANNED` (Phase 2 & 6)** — currently Admin invoices/proposals live in browser `localStorage`! |

---

## 4. Storage Rules Overview (`storage.rules`)

- **Size & MIME Controls:** Strict `isValidCreativeAsset()` MIME allowlist (`PNG`, `JPG`, `SVG`, `WEBP`, `PSD`, `PDF`, `JSON`, `ZIP`, `MP4`, audio, fonts) & file size checks (`storage.rules:100-104`).
- **Bucket Paths:**
  - `/clients/{clientUid}/**` — Workspace/project scoped; published deliverables require `isClientPublished == true` (`ownsPublishedDeliverable`), internal paths Admin-only.
  - `/creative-products/{productId}/**` — Enforces matching product `audience` (`clientMatchesProductAudience`) & entitlement check (`Free` / `assignedWorkspaceIds` / `contractedPackageIds[0..4]` against `/services`) (`storage.rules:106-187`).
  - `/brand-room/**` — Strictly `isPlatformAdmin()` (`storage.rules:279-285`).
- **Migration Risk:** Just like `firestore.rules`, `storage.rules` checks `accountType == 'Company'` vs `'Brand'` (lines 114–117) and ignores `packageEntitlements.expiresAt`. Both must be updated safely alongside data backfill and subscription rollout.

---

## 5. Schema Blueprint & Index Drift (`Confirmed from code`)

1. **`firebase-blueprint.json` Drift:** Currently omits `/admins`, `/clientProfiles`, `/clientProjects` (and subcollections), `/clientDeliverables`, `/revisionRequests`, `/settings`, `/serviceEnquiries`, `/userNotifications`, `/adminAuditLogs`, `/productionTasks`, `/creativeProducts`, and `/brandRoom*` collections, while still describing legacy label concepts. Must be synchronized during Phase 0/1.
2. **`firestore.indexes.json` Coverage:** Currently defines only **3 composite indexes**, all on `creativeProducts` (`status+audience+accessType`, `status+audience+assignedWorkspaceIds`, `status+audience+accessType+includedPackageIds`). Adding Artist/Brand departmental queries (`clientProjects` by `department + stage + updatedAt`) and unified Finance queries (`/invoices` by `workspaceId + status + createdAt`) will require deploying new composite indexes before UI cutover (`Requires live Firebase verification`).

---

## 6. Critical Summary Register

| Severity | Finding | Target Phase |
|---|---|---|
| **Critical** | `workspaces/{ws}/documents` writable by clients for invoice/proposal types (`firestore.rules:402`). | **Phase 2** |
| **Critical** | Admin Invoices/Proposals/Corporate Docs read/write `localStorage` instead of Firestore (`AppContext.tsx`). | **Phase 2** |
| **High** | Changing named Firestore DB ID (`ai-studio-lyricalentbrandl-...`) will break live services without full DB migration. | **Hold / Pin** |
| **High** | Premature removal of `'Company'`/`'Business'` from rules before backfill locks out existing Brand/Business accounts. | **Phase 1 (Dual-Read)** |
| **High** | `firestore.rules` / `storage.rules` ignore `packageEntitlements.expiresAt` & cap `contractedPackageIds` at 5 items. | **Phase 6** |
| **Medium** | `BrandRoom` `PortfolioShowcasesPanel` shows completed client projects without explicit client showcase approval flag. | **Phase 3** |
| **Medium** | `firebase-blueprint.json` out of sync with live collections & missing indexes for Dept/Finance queries. | **Phase 0–2** |
