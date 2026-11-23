# KeedoHub Admin HQ — Eight-Section Architecture

**Document Status:** Target Restructuring Blueprint vs. Current Implementation  
**Primary Sources:** `src/components/admin/AdminHQ.tsx`, `src/components/admin/AdminHQOverview.tsx`, `src/components/admin/AdminProduction.tsx`, `src/components/admin/AdminDesignLibrary.tsx`, `src/components/admin/AdminCreativeProducts.tsx`, `src/components/admin/ClientsDirectory.tsx`, `src/components/admin/WorkspacesManagement.tsx`, `src/components/admin/ServicesPackagesManagement.tsx`, `src/components/admin/AdminInvoicesManagement.tsx`, `src/components/admin/AdminProposalsManagement.tsx`, `src/components/admin/brand-room/BrandRoom.tsx`, `src/components/modules/CorporateDocuments.tsx`.

> **Clear Status Statement:** The **eight-section** Admin HQ layout documented below is **`PLANNED` (Phase 3)** and has **not** been implemented yet. Today, `AdminHQ.tsx` renders an 18-item navigation tree across 6 mixed groups (`Dashboard`, `Clients`, `Production`, `Creative Library`, `Business`, `Settings`).

---

## 1. Current Admin HQ Navigation (`IMPLEMENTED — RUNTIME VERIFICATION PENDING` with Known Gaps)

In `src/components/admin/AdminHQ.tsx` (`ADMIN_HQ_NAV`, lines 87–136):
- **Dashboard:** `HQ Overview` (`AdminHQOverview.tsx`), `Brand Room & Marketing Kit` (`BrandRoom.tsx`)
- **Clients:** `Clients & Accounts` (`ClientsDirectory.tsx`), `Workspaces` (`WorkspacesManagement.tsx`), `Services & Packages` (`ServicesPackagesManagement.tsx`)
- **Production:** `Production Studio` (`AdminProduction.tsx`), `Projects`, `Deliverables & Reviews`, `Creative Requests`
- **Creative Library:** `Creative Products` (`AdminCreativeProducts.tsx`), `Design & Templates` (`AdminDesignLibrary.tsx`)
- **Business:** `Invoices & Payments` (`AdminInvoicesManagement.tsx` — **`LEGACY / DISCONNECTED` `localStorage`**), `Proposals` (`AdminProposalsManagement.tsx` — **`LEGACY / DISCONNECTED` `localStorage`**), `Business Documents` (`CorporateDocuments.tsx` — **`LEGACY / DISCONNECTED` `localStorage`**)
- **Settings:** `Administrator Management` (`AdminManagement.tsx`), `Security & Access` (`SecurityAccessManagement.tsx`), `Audit History` (`AuditHistoryManagement.tsx`), `Platform Settings` (`PlatformSettingsManagement.tsx`)

### Why Restructure? (`Confirmed from code`)
1. Artist and Brand production work is mixed together inside flat queues (`ClientsDirectory`, `WorkspacesManagement`, `AdminProduction`, `AdminDesignLibrary`).
2. `ClientsDirectory` & `WorkspacesManagement` expose redundant `'Company'` / `'Business'` / `'Enterprise'` / `'Label'` categories.
3. **Finance & Business Documents** live under `'Business'` reading `AppContext` `localStorage` rather than Firestore, totally isolated from client workspaces.
4. **KeedoHub Brand Room** sits inside the main `Dashboard` group rather than clearly separated as KeedoHub's private internal marketing studio.

---

## 2. Target Admin HQ — Eight Main Sections (`PLANNED` — Phase 3)

```text
ADMIN HQ SIDEBAR (8 PRIMARY SECTIONS)
├── 1. HQ Overview
├── 2. Artist Department
├── 3. Brand Department
├── 4. Shared Operations
├── 5. Creative Products
├── 6. Finance
├── 7. KeedoHub Brand Room   [Internal KeedoHub Marketing Only]
└── 8. Platform Settings
```

### Section 1: HQ Overview (`AdminHQOverview.tsx` refactored)
- **Responsibilities:**
  - Dual-department KPI strip separating **Artist Department** metrics (active artists, upcoming releases, artist briefs/deliverables) from **Brand Department** metrics (active brands, identity/collateral projects).
  - Cross-platform operational alerts: pending public enquiries, overdue SLA projects, deliverables awaiting Internal QA, unpaid invoices / pending proposals (from Firestore Finance).
  - Quick navigation into Artist Dept, Brand Dept, Shared Operations, or Finance.
- **Boundary:** Does not display internal Brand Room marketing drafts as client deliverables.

### Section 2: Artist Department (New Departmental Shell)
- **Sub-sections & Responsibilities:**
  - **Artist Clients & Workspaces:** Scoped views of `ClientsDirectory` & `WorkspacesManagement` (`accountType === 'Artist'` / `type === 'Artist'`), viewing artist bios, genres, streaming URLs, and package entitlements.
  - **Artist Requests & Projects:** Scoped `AdminProduction` for music release production, cover art, motion visualizers, lyric videos, artist branding, tour posters, and release readiness tracking.
  - **Artist Deliverables & Internal QA:** Versioned uploads, QA checklist sign-off, explicit `isClientPublished` toggles.
  - **Artist Templates & Document Masters:** Filtered `AdminDesignLibrary` (`department === 'Artist'`) + Artist legal/production document masters (Split Sheets, Producer Memos, Master Authorizations, Video Releases, EPKs, Album Budgets) + `DesignCanvasEditor` launched in `'artist-production'` context.

### Section 3: Brand Department (New Departmental Shell)
- **Sub-sections & Responsibilities:**
  - **Brand Clients & Workspaces:** Scoped views of `ClientsDirectory` & `WorkspacesManagement` (`accountType === 'Brand'`, plus dual-read legacy `'Company'`/`'Business'`/`'Label'` during migration), inspecting brand colours, typography, logos, and usage guidelines.
  - **Brand Requests & Projects:** Scoped `AdminProduction` for Brand Identity, Brand Guidelines, Social Media Designs, Company Profiles, Presentations, Brochures, Flyers/Posters, and Packaging requests.
  - **Brand Deliverables & Internal QA:** Versioned uploads, print/digital format QA, publish-to-client controls.
  - **Brand Templates & Corporate Collateral Studio:** Filtered `AdminDesignLibrary` (`department === 'Brand'`) + refactored collateral producers (`BusinessCardDesigner`, `StaffIdCardDesigner`, `EmailSignatureDesigner`, Company Profile / Pitch Deck layouts) + `DesignCanvasEditor` launched in `'brand-production'` context.

### Section 4: Shared Operations
- **Sub-sections & Responsibilities:**
  - **Incoming Enquiries & Triage:** Public `serviceEnquiries` (`ContactPage.tsx`) + incoming uncategorized client requests; Admin assigns to Artist Department or Brand Department and converts approved enquiries into projects.
  - **Master Production Calendar & Deadlines:** Cross-department timeline, SLA monitoring, urgent/overdue filters (`AdminProduction` overdue view + scheduled deadline alerts).
  - **Shared Quality Assurance Queue:** Cross-roster internal QA gate before publishing deliverables to client workspaces.
  - **Client Notifications Desk:** Production notifications audit (`ProductionNotificationCenter.tsx` / `userNotifications`).
  - **Services & Packages (`ServicesPackagesManagement.tsx`):** Catalog pricing, turnaround days, revision limits, active availability (`targetAudience: 'Artist' | 'Brand' | 'Both'`).

### Section 5: Creative Products (`AdminCreativeProducts.tsx` refactored)
- **Responsibilities:**
  - Unified marketplace/hub manager for downloadable pre-built creative packs (`creativeProducts`), partitioned cleanly into **three audience tabs**:
    1. **Artist Packs** (`audience: 'Artist'`)
    2. **Brand Packs** (`audience: 'Brand'` — absorbing legacy `'Business'` & `'Brand & Business'`)
    3. **Shared Utilities** (`audience: 'Shared'`)
  - Product creation via `DesignCanvasEditor` (`canvasMode: 'product-master'`) + `productPackager.ts` multi-format export (`PNG/JPG/SVG/PDF/ZIP/PSD/MP4`), Storage asset validation, package entitlement linking (`includedPackageIds`), and workspace direct assignment (`assignedWorkspaceIds`).

### Section 6: Finance (`PLANNED` Firestore Migration — Phase 2 & 6)
- **Responsibilities:** Unified billing & commercial governance serving **both** Artist and Brand departments using **Firestore** (retiring `localStorage` `AdminInvoicesManagement` & `AdminProposalsManagement`):
  - **Invoices & Payment Ledger:** Create/issue Artist & Brand invoices, record manual bank/wire/card payments, track automated online gateway payments (`Phase 6`), generate official PDF receipts.
  - **Proposals & Quotations:** Issue formal commercial scopes/quotes, track client Accept/Decline actions (via Cloud Function), convert accepted proposals into active invoices + department projects.
  - **Workspace Subscriptions & Entitlements:** Manage active service retainers, expiration dates, and package access across workspaces.
  - **Financial Reporting:** Revenue split by Department (Artist vs. Brand), pending receivables, overdue accounts.

### Section 7: KeedoHub Brand Room (`BrandRoom.tsx`)
- **Responsibilities:** Strictly **private internal marketing studio for KeedoHub itself** (KeedoHub identity, Collection 001, social formats, internal calendar, real internal publishing analytics, opted-in portfolio showcases).
- **Hard Isolation:** Never manages client assets, never converts Brand Room templates into client deliverables, never accessible to client roles. See [BRAND_ROOM.md](BRAND_ROOM.md).

### Section 8: Platform Settings
- **Consolidates Existing Settings Modules:**
  - `AdminManagement.tsx` — Grant/revoke `admins/{uid}` roles via audited `adminUpdatePlatformRole` with last-admin protection.
  - `SecurityAccessManagement.tsx` — RBAC boundary & security invariant status.
  - `AuditHistoryManagement.tsx` — Searchable immutable `adminAuditLogs` stream.
  - `PlatformSettingsManagement.tsx` — Contact email, SLA defaults, public pricing display toggle, Slack/notification webhook configuration.

---

## 3. Existing-to-Target Module Mapping Table

| Existing Component (`src/components/...`) | Current Role | Planned Destination |
|---|---|---|
| `admin/AdminHQOverview.tsx` | `hq-overview` | **1. HQ Overview** (department split added) |
| `admin/ClientsDirectory.tsx`, `admin/WorkspacesManagement.tsx` | Under `Clients` group | Parameterized by department inside **2. Artist Dept** & **3. Brand Dept** |
| `admin/AdminProduction.tsx` | `production-studio`, `projects`, `deliverables-reviews`, `creative-requests` | Department-scoped instances in **2. Artist Dept** & **3. Brand Dept**; Triage/Calendar/QA in **4. Shared Operations** |
| `admin/AdminDesignLibrary.tsx` | `design-library` | Split by `department` across **2. Artist Dept** & **3. Brand Dept** |
| `admin/ServicesPackagesManagement.tsx` | `services-packages` | **4. Shared Operations** (Package & Service Catalog) |
| `admin/AdminCreativeProducts.tsx` | `creative-products` | **5. Creative Products** (`Artist Packs` · `Brand Packs` · `Shared Utilities`) |
| `admin/AdminInvoicesManagement.tsx`, `AdminProposalsManagement.tsx` | `Business` group (`localStorage`) | Rebuilt on Firestore inside **6. Finance** |
| `modules/CorporateDocuments.tsx` + `BusinessCard/StaffId/EmailSignature` | `business-documents` (`localStorage`) | Delete wrapper; refactor Collateral Designers into **3. Brand Dept** + Brand Client Vault |
| `modules/DocumentTemplates.tsx` (orphaned music docs) | Disconnected (`localStorage`) | Extract 6 templates into **2. Artist Dept** (Masters) & **Artist OS** (Vault) |
| `admin/brand-room/BrandRoom.tsx` | `brand-room` | **7. KeedoHub Brand Room** (isolated internal studio) |
| `admin/AdminManagement.tsx`, `SecurityAccessManagement.tsx`, `AuditHistoryManagement.tsx`, `PlatformSettingsManagement.tsx` | `Settings` group | **8. Platform Settings** |
