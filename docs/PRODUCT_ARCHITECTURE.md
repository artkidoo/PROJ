# KeedoHub Product Architecture

**Document Status:** Architectural Specification (Audit-Grounded)  
**Primary Sources:** `src/App.tsx`, `src/context/AppContext.tsx`, `src/lib/clientOS.ts`, `src/lib/clientWorkspace.ts`, `src/components/auth/RegisterPage.tsx`, `src/components/client/ClientOnboarding.tsx`, `src/components/client/ClientWorkspace.tsx`, `src/components/admin/AdminHQ.tsx`, `firestore.rules`, `functions/src/index.ts`.

---

## 1. Architectural Principle

```text
ONE PLATFORM
ONE SHARED APPLICATION ARCHITECTURE
TWO DISTINCT CLIENT EXPERIENCES (ARTIST · BRAND)
ONE ADMIN HQ (EIGHT SECTIONS)
```

KeedoHub is engineered on a single codebase, authentication boundary, project/deliverable engine, and Firestore security model—without forcing **Artists** and **Brands** into identical user interfaces.

---

## 2. Client Model & Account Normalization

| Dimension | Current Repository State (`Confirmed from code`) | Target Future Architecture (`PLANNED`) |
|---|---|---|
| **Account Types (`clientProfiles.accountType`)** | `'Artist' \| 'Brand' \| 'Company'` (`RegisterPage.tsx`, `ClientOnboarding.tsx`, `firestore.rules`) | **`'Artist' \| 'Brand'`** only. All businesses, agencies, labels, startups, and enterprises belong under `'Brand'`. |
| **Workspace Types (`workspaces.type`)** | `'Artist' \| 'Label' \| 'Brand' \| 'Business' \| 'Enterprise' \| 'Agency' \| 'Personal'` (`src/types/index.ts`, `firestore.rules:361`) | Normalized to **`'Artist' \| 'Brand'`** for all newly provisioned workspaces, with dual-read mapping for historical records. |
| **Workspace Category (`workspaces.clientCategory`)** | `'artist' \| 'label' \| 'brand' \| 'business'` | Normalized to **`'artist' \| 'brand'`**. |
| **Client OS Mode (`clientOS.ts`)** | `ClientOSMode = 'artist' \| 'brand' \| 'company'` (where `'company'` duplicates `'brand'` screens under `"Business OS"` label) | **`'artist' \| 'brand'`** only. |
| **Creative Product Audience (`creativeProduct.ts`)** | `'Artist' \| 'Brand' \| 'Business' \| 'Brand & Business' \| 'Shared'` | **`'Artist' \| 'Brand' \| 'Shared'`**. |
| **Service Package Audience (`ServicePackage`)** | Already `'Artist' \| 'Brand' \| 'Both'` (`functions/src/index.ts:516`) — `IMPLEMENTED AND VERIFIED` | Retain `'Artist' \| 'Brand' \| 'Both'`. |

---

## 3. Authentication, Registration & Onboarding Flow

### 3.1 Authentication (`IMPLEMENTED — RUNTIME VERIFICATION PENDING`)
- Handled via Firebase Authentication (`src/lib/firebaseAuth.ts`) supporting Email/Password sign-in, Forgot Password reset, and Google Sign-In.
- `AppContext.tsx` binds `onAuthStateChanged`, loads `clientProfiles/{uid}`, and checks `admins/{uid}` (`isAdminRecordActive`) using server verification in `AdminHQ` and `DesignCanvasEditor`.
- Suspended client accounts (`clientProfiles/{uid}.status === 'Suspended'`) are blocked from client routes (`ClientWorkspace`) and denied in both `firestore.rules` (`isWorkspaceAccountActive()`) and `storage.rules`.

### 3.2 Registration (`IMPLEMENTED — RUNTIME VERIFICATION PENDING`; `PLANNED` 2-type refinement)
- **Current (`RegisterPage.tsx`):** Collects Full Name, Email, Password, optional Workspace/Organization Name, and 3-way Account Type (`Artist | Brand | Company`). On completion, writes initial `clientProfiles/{uid}`, `users/{uid}`, and workspace records (or creates pending onboarding state).
- **Planned (Phase 1):** Restrict Account Type selection to **Artist** or **Brand** (`2 cards`) and remove `'Company'`.

### 3.3 Client Onboarding (`PARTIALLY IMPLEMENTED` → Target Rich Onboarding `PLANNED`)
- **Current (`ClientOnboarding.tsx`):** Minimal form collecting Display Name, Email (read-only), Account Type (`Artist | Brand | Company`), and Artist/Brand/Company Name, writing `clientProfiles/{uid}` (`onboardingComplete: true`), `users/{uid}`, and invoking `ensureClientWorkspace(uid)`.
  - Richer Artist & Brand identity fields currently reside inside `ClientStudio.tsx` **post-onboarding** (`artistProfile`, `brand`, `brandProfile`), rather than during initial onboarding.
- **Target Onboarding Data Capture (`PLANNED` in Phase 1 / Phase 4):**
  - **Artist Onboarding:**
    - Artist / stage name, account display name
    - Profile picture upload (Storage `clients/...` or workspace path)
    - Biography & primary genre
    - Streaming & social links (`Spotify`, `Apple Music`, `YouTube`, `Instagram`, `Website`)
    - Initial visual identity notes / artwork aesthetic references
  - **Brand Onboarding:**
    - Brand / business name, account display name
    - Profile picture / avatar & primary brand logo upload
    - Industry / sector & website URL
    - Color system: Primary colour (`#...`), Secondary colour (`#...`), Accent colour (`#...`)
    - Typography preferences (`displayFont`, `bodyFont`)
    - Brand voice, photography/graphic principles, and usage notes
  - **Admin Canvas Integration (`PLANNED` in Phase 5):** Structured brand identity data stored on `workspaces/{workspaceId}` (`brand` + `brandProfile` / `artistProfile`) will load directly into `DesignCanvasEditor` context panels when Admin creates client assets (`canvasMode: 'client-production'`). Currently, this automatic token injection into `DesignCanvasEditor` is **not implemented** (`Confirmed from code`).

---

## 4. Shared Workspace Infrastructure & Navigation Differences

### 4.1 Shared Infrastructure (`ClientWorkspace.tsx` + `src/lib/clientWorkspace.ts`)
- **Workspace Resolution (`workspaceResolution.ts`):** Resolves active client workspace ownership (`workspaces.ownerId == uid` or `memberships/{uid}.status == 'Active'`).
- **Shared Core Collections Scoped by `clientUid` / `workspaceId`:**
  - `workspaces/{workspaceId}` (status `'Active' | 'Onboarding' | 'Paused' | 'Archived'`)
  - `clientProjects/{projectId}` (production requests, briefs, milestones, stages, deliverables, tasks, revision requests, activity)
  - `creativeProducts/{productId}` (downloadable packs filtered by entitlement & audience)
  - `userNotifications/{notificationId}` (client alerts)

### 4.2 Artist vs. Brand Navigation Matrix

| Shared Shell Tabs (`ClientWorkspace`) | Artist Navigation (`Artist OS`) | Brand Navigation (`Brand OS`) |
|---|---|---|
| Overview | Artist Dashboard (`PARTIALLY IMPLEMENTED`) | Brand Dashboard (`PARTIALLY IMPLEMENTED`) |
| Creative Hub (`ClientCreativeHub`) | **Artist Creative Hub** (Cover art, streaming packs, press kits) | **Brand Creative Hub** (Identity kits, social kits, business docs) |
| Active Projects | Artist Production Projects | Brand & Collateral Projects |
| Creative Requests | Excluded: `'Business Cards'`, `'Brand Identity'` | Excluded: `'Music Cover Artwork'`, `'Artist Promotional Graphics'` |
| Deliverables | Preview, download, approve, request revision | Preview, download, approve, request revision |
| Updates & Activity | Chronological release & project log | Chronological brand project log |
| Specialized OS Tabs (`ClientStudio`) | **Artist Identity & EPK**, **Music & Releases**, **Release Readiness**, **Content & Release Materials**, **Asset Vault**, **Artist Documents** *(nav link `PLANNED`)* | **Brand Identity**, **Brand Guidelines**, **Creative System**, **Asset Vault**, **Brand Documents**, **Proposals & Invoices** |
| Billing & Account | Account Settings + Billing/Entitlements (`PLANNED` self-service) | Account Settings + Billing/Entitlements (`PLANNED` self-service) |

---

## 5. Role & Permission Boundaries

| Role | Entry Route | Allowed Capabilities (`Confirmed from code` / `PLANNED`) | Forbidden Boundaries |
|---|---|---|---|
| **Public Visitor** | `/` (Public Site) | Browse pages, read active `/services` & public `/settings`, submit `submitPublicEnquiry`. | Cannot read workspaces, profiles, projects, creative products, or Brand Room. |
| **Client — Artist** | `/client` | Manage own Artist workspace & profile, releases, content, non-commercial assets, own Artist Creative Hub downloads, submit briefs, review/approve/revise published deliverables. | Cannot access `AdminHQ`, `DesignCanvasEditor`, internal notes/assets (`isInternal: true`), Brand Room, or unpublished drafts. |
| **Client — Brand** | `/client` | Manage own Brand workspace, brand tokens/guidelines, content, non-commercial assets, collateral builders, Brand Creative Hub downloads, respond to proposals. | Cannot access `AdminHQ`, `DesignCanvasEditor`, internal notes/assets, Brand Room, other brands' workspaces, or alter Admin-issued commercial invoice totals (`PLANNED` rule fix). |
| **Platform Admin / Lead Producer** | `/admin-login` → `/admin` | Full Admin HQ governance, request triage, production execution in `DesignCanvasEditor`, deliverable QA/publication, Creative Products curation, Finance issuance, KeedoHub Brand Room, audited RBAC (`admins/{uid}`). | Cannot self-elevate or revoke the last active administrator (`functions/src/index.ts` safeguards). |

---

## 6. Client-to-Admin Production Workflow (Architectural Summary)

1. **Enquiry / Request:** Client submits a structured request inside `ClientWorkspace` (`createProductionRequest` / `ClientRequest` flow) or public `submitPublicEnquiry` → arrives in Admin Shared Operations / Department queue.
2. **Department Routing & Workspace Linkage:** Admin reviews brief, assigns department (`Artist` or `Brand`), links workspace/client, and creates or advances `clientProjects` + `productionTasks`.
3. **Internal Production (`Admin-Only`):** Admin opens `DesignCanvasEditor` or studio tools, uses client brand/artist identity data (`PLANNED` direct binding), creates internal masters (`workspaces/{ws}/internalAssets` / internal paths), runs QA checklist.
4. **Client Review & Publication:** Admin publishes approved version (`isClientPublished: true`) to `clientProjects/{projectId}/deliverables`. Client previews, approves, or submits revision feedback (`revisionRequests`). Once approved, final files move to the client's Asset Vault and project marks `Delivered`.

See [CREATIVE_PRODUCTION.md](CREATIVE_PRODUCTION.md) for all 13 lifecycle stages and asset-layer rules.
