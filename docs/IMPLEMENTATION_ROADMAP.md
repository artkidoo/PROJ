# KeedoHub Implementation Roadmap

**Document Status:** Agreed Phased Execution Plan (`PLANNED`)  
**Governance Rule:** Do **not** execute any phase without prior written approval. Do not reorder phases or deploy Firebase changes without explicit owner confirmation.

---

## Phase Overview

| Phase | Title | Core Outcome |
|---|---|---|
| **Phase 0** | Documentation, Hygiene & Rebranding | Official docs complete, `Group A` dead files deleted, HTML/metadata/PDF prefixes rebranded cleanly. Zero DB changes. |
| **Phase 1** | Artist & Brand Normalization, Compatibility & Migration Prep | Only `Artist` and `Brand` exposed in UI/new writes; historical `Company`/`Business`/`Label` preserved via dual-read + verified backfill. |
| **Phase 2** | Unified Firestore Documents & Secure Finance Migration | Admin Finance & Collateral moved from `localStorage` to Firestore; `/invoices` & `/proposals` locked from client tampering; 6 Artist docs ported. |
| **Phase 3** | Admin HQ Eight-Section Reorganisation | Current 18-tab sidebar replaced by clean 8-section departmental Admin HQ + `BrandRoom` showcase opt-in guard. |
| **Phase 4** | Distinct Artist & Brand Client Dashboards | Upgraded Artist Dashboard (Checklist, EPK PDF, Release Readiness, Doc Vault) & Brand Dashboard (Identity/Collateral, Commercial Viewer). |
| **Phase 5** | Canvas & Template Catalogue Separation | `canvasMode` isolation in `DesignCanvasEditor`, live client brand-token hydration, clean Artist vs Brand vs Brand Room catalogs. |
| **Phase 6** | Payments & Subscription Automation | Gateway evaluation (Paystack candidate) & rollout: checkout, signed webhooks, idempotency, automated package entitlements & expiry rules. |

---

## PHASE 0 — Documentation, Hygiene & Rebranding

- **Objective:** Establish authoritative documentation, strip dead `localStorage`/Blogspot code (`Group A`), and remove `LYRICAL ENT` branding from HTML/metadata/PDF defaults without touching Firestore schemas or live app logic.
- **Existing Code Involved:** `README.md`, `docs/*`, `metadata.json`, `index.html`, `src/data/publicContent.ts`, `src/utils/pdfGenerator.ts`, 29 verified orphaned files (`docs/LYRICAL_MIGRATION_AND_CODE_CLEANUP.md` Group A), `firebase-blueprint.json`.
- **Planned Changes:** Delete verified Group A unused files; update `metadata.json`, `index.html`, `publicContent.ts` (`p1`/`p4` sample copy), and `pdfGenerator.ts` (`KH-DOC-` fallback); sync `firebase-blueprint.json` with current live collections.
- **Dependencies:** Owner sign-off on Phase 0 after reviewing `docs/`.
- **Risks:** Accidental deletion of a dynamically referenced helper or asset; breaking legacy test imports.
- **Verification:**
  - *Automated:* Full import-graph re-check, `npm run lint` (`tsc --noEmit`), `npm run build` (`vite build`).
  - *Manual Browser:* Walk all public site routes (`PublicSite`), Login/Register, Client Workspace, and Admin HQ ensuring zero broken imports or images.
  - *Firebase:* None required (zero rules/functions/DB edits).
- **Completion Criteria:** Clean TypeScript & production build; 0 references to Group A dead files; 0 `LYRICAL ENT` brand strings in public UI/HTML/metadata.

---

## PHASE 1 — Artist & Brand Normalization, Compatibility & Migration Prep

- **Objective:** Consolidate KeedoHub onto **two** client types (`Artist` and `Brand`) across registration, onboarding, UI helpers, and Cloud Functions while maintaining **dual-read** compatibility for existing `'Company'`/`'Business'`/`'Label'`/`'Enterprise'`/`'Agency'`/`'Personal'` records.
- **Existing Code Involved:** `RegisterPage.tsx`, `ClientOnboarding.tsx`, `ContactPage.tsx`, `src/lib/clientOS.ts`, `src/lib/clientWorkspace.ts`, `src/lib/creativeProductAccess.ts`, `ClientsDirectory.tsx`, `WorkspacesManagement.tsx`, `AdminCreativeProducts.tsx`, `functions/src/index.ts`, `firestore.rules`, `storage.rules`.
- **Planned Changes:** Update registration & onboarding UI to offer only **Artist** and **Brand** (capturing richer initial Artist/Brand identity fields); introduce `normalizeAccountType()` / `normalizeWorkspaceType()` dual-read helpers; prepare idempotent Admin migration script to backfill legacy `'Company'`/`'Business'` records to `'Brand'`; plan staged `firestore.rules` & `storage.rules` transition rules.
- **Dependencies:** Phase 0 complete.
- **Risks:** Locking out existing production `'Company'`/`'Business'` users if rules reject legacy values before DB backfill finishes (`HIGH`).
- **Verification:**
  - *Automated:* Unit tests in `tests/client-os.unit.test.ts` & `tests/phase8-5-remediation.unit.test.ts`; Emulator tests in `tests/firestore.rules.test.ts`, `tests/storage.rules.test.ts`, `tests/functions.test.ts`.
  - *Manual Browser:* New Artist signup, new Brand signup, login with mocked legacy `'Company'` profile confirming seamless Brand OS rendering.
  - *Firebase:* Emulator backfill dry-run + explicit owner approval before any staging/live backfill.
- **Completion Criteria:** All new signups write `'Artist'` or `'Brand'` only; dual-read tests pass for every legacy type; backfill plan validated in emulator.

---

## PHASE 2 — Unified Firestore Documents & Secure Finance Migration

- **Objective:** Eliminate the `AppContext` `localStorage` vs. Firestore split-brain bug, fix the `workspaces/{ws}/documents` write vulnerability (`firestore.rules:402`), move Invoices & Proposals to server-governed Firestore collections, and migrate useful Artist/Brand document tools (`DocumentTemplates`, `BusinessCardDesigner`, `StaffIdCardDesigner`, `EmailSignatureDesigner`) to Firestore.
- **Existing Code Involved:** `AdminInvoicesManagement.tsx`, `AdminProposalsManagement.tsx`, `CorporateDocuments.tsx`, `DocumentTemplates.tsx`, `BusinessCardDesigner.tsx`, `StaffIdCardDesigner.tsx`, `EmailSignatureDesigner.tsx`, `ClientStudio.tsx`, `AppContext.tsx`, `functions/src/index.ts`, `firestore.rules`, `firestore.indexes.json`.
- **Planned Changes:** Introduce `/invoices` & `/proposals` collections + callable Functions (`adminSaveInvoice`, `adminRecordManualPayment`, `adminSaveProposal`, `clientRespondProposal`); harden `firestore.rules` denying client writes on commercial document types inside `workspaces/{ws}/documents`; rebuild Admin Finance tabs on Firestore; parameterize & port 6 Artist templates and 3 Brand collateral designers to Firestore; remove `localStorage` `lyrical_ent_studio_state_v1` seeding & delete `CorporateDocuments.tsx`/`DocumentTemplates.tsx`.
- **Dependencies:** Phase 1 complete.
- **Risks:** Missing composite Firestore indexes for invoice/proposal queries; breaking historical `workspaces/{ws}/documents` PDF generation; client permissions error if UI still tries direct Firestore status mutation on proposals.
- **Verification:**
  - *Automated:* New security tests in `tests/firestore.rules.test.ts` asserting clients **cannot** forge invoices/proposals or mark invoices Paid; `tests/functions.test.ts` validating proposal acceptance & invoice line-item calculations.
  - *Manual Browser:* Admin creates invoice & proposal → Client receives in real time, downloads PDF, accepts proposal → Admin records manual payment & receipt.
  - *Firebase:* Deploy `firestore.indexes.json` + updated Functions + hardened `firestore.rules` (only with owner approval).
- **Completion Criteria:** Zero financial/document state stored in `localStorage`; security tests confirm server-only control over commercial billing records.

---

## PHASE 3 — Admin HQ Eight-Section Reorganisation

- **Objective:** Replace the 18-item mixed Admin sidebar in `AdminHQ.tsx` with the agreed **8 separated sections** (`HQ Overview`, `Artist Department`, `Brand Department`, `Shared Operations`, `Creative Products`, `Finance`, `KeedoHub Brand Room`, `Platform Settings`) and add client opt-in consent guards to `BrandRoom`'s `PortfolioShowcasesPanel`.
- **Existing Code Involved:** `AdminHQ.tsx`, `AdminHQOverview.tsx`, `AdminProduction.tsx`, `ClientsDirectory.tsx`, `WorkspacesManagement.tsx`, `ServicesPackagesManagement.tsx`, `AdminDesignLibrary.tsx`, `AdminCreativeProducts.tsx`, `BrandRoom.tsx`, `PortfolioShowcasesPanel.tsx`, `AdminManagement.tsx`, `SecurityAccessManagement.tsx`, `AuditHistoryManagement.tsx`, `PlatformSettingsManagement.tsx`.
- **Planned Changes:** Refactor navigation & deep-linking callbacks (`AdminHQOverviewNavigateOptions`) around the 8 sections; add department filter props (`department: 'Artist' | 'Brand'`) to `ClientsDirectory`, `WorkspacesManagement`, `AdminProduction`, and `AdminDesignLibrary`; partition `AdminCreativeProducts` into 3 audience views (`Artist Packs`, `Brand Packs`, `Shared Utilities`); enforce `allowPublicShowcase` opt-in check on `PortfolioShowcasesPanel`.
- **Dependencies:** Phase 2 complete (so **6. Finance** embeds real Firestore Finance).
- **Risks:** Broken cross-section deep links (`onOpenProject`, `onOpenWorkspace`, `onOpenDesignLibrary`); uncategorized legacy projects invisible in Artist/Brand filters unless placed in Shared Operations triage.
- **Verification:**
  - *Automated:* `npm run lint`, `npm run build`, update `tests/admin-auth.unit.test.ts` & `tests/brand-room.unit.test.ts`.
  - *Manual Browser:* Full click-through of all 8 Admin HQ sections and cross-section deep links; verify Brand Room shows zero unconsented client projects.
  - *Firebase:* Verify any added department composite queries work against `firestore.indexes.json`.
- **Completion Criteria:** All 8 Admin HQ sections operational with zero mixing of Artist, Brand, and internal Brand Room workflows.

---

## PHASE 4 — Distinct Artist & Brand Client Dashboards

- **Objective:** Elevate the live Artist and Brand dashboards inside `ClientWorkspace` / `ClientStudio` by integrating legacy domain features (Release Checklist, audio/artwork validators, EPK PDF exporter, Artist Document Vault navigation) and tailoring Brand Overview/Collateral workflows.
- **Existing Code Involved:** `ClientWorkspace.tsx`, `ClientStudio.tsx`, `ClientCreativeHub.tsx`, `src/lib/clientOS.ts`, `MusicReleaseManagement.tsx`, `ArtistManagement.tsx`, `PressMedia.tsx`, `pdfGenerator.ts`.
- **Planned Changes:** Port `ReleaseChecklist` & audio/cover metadata checks from `MusicReleaseManagement.tsx` into Firestore `ClientStudio` (`releases`); port structured press release & **Export Artist EPK PDF** from `PressMedia.tsx`; expose `Artist Documents` & `Billing & Entitlements` cleanly in `Artist OS` nav (`clientOS.ts`); refine Artist & Brand overview dashboards; delete remaining `Group B` orphaned legacy modules.
- **Dependencies:** Phase 2 & Phase 3 complete.
- **Risks:** Cluttering `ClientStudio.tsx` (already 3,598 lines) unless modularized cleanly into subcomponents (`ArtistDashboard/`, `BrandDashboard/`).
- **Verification:**
  - *Automated:* Expanded `tests/client-os.unit.test.ts` validating distinct Artist vs Brand nav, request categories, prefill builders, and release/brand validation.
  - *Manual Browser:* Complete Artist journey (Release + Checklist + EPK PDF + Split Sheet + Request + Deliverable Approve) & Brand journey (Identity + Brand Guidelines PDF + Business Card + Proposal Review) across desktop and mobile viewports.
  - *Firebase:* Verify Firestore writes from ported features under client auth rules.
- **Completion Criteria:** Group B legacy modules retired cleanly; Artist & Brand users experience distinct, tailored workspaces on unified infrastructure.

---

## PHASE 5 — Canvas & Template Catalogue Separation

- **Objective:** Partition Master Templates (`AdminDesignLibrary`) and Creative Products (`AdminCreativeProducts`) cleanly between **Artist**, **Brand**, and **Shared Utilities**, add strict `canvasMode` isolation + live client Brand/Artist identity hydration to `DesignCanvasEditor`, and clean legacy `LYRICAL` Canvas template copy/symbols.
- **Existing Code Involved:** `DesignCanvasEditor.tsx`, `AdminDesignLibrary.tsx`, `AdminCreativeProducts.tsx`, `AdminProduction.tsx`, `BrandRoom.tsx`, `src/lib/productPackager.ts`, `src/utils/templateDesignBuilder.ts`, `src/data/creativeTemplatesData.ts`, `src/data/templateFamiliesData.ts`, `src/components/brand/LogoConcepts.tsx`.
- **Planned Changes:** Pass `canvasMode: 'artist-production' | 'brand-production' | 'keedohub-brand-room' | 'product-master'` into `DesignCanvasEditor`; add **Client Brand & Asset Drawer** inside Canvas allowing Admin producers to apply client colors, typography, logos, and approved vault photos; enforce department-scoped template pickers & Storage output paths; audit & verify real exported PNG/SVG/PDF/ZIP files; add backward-compatible handling for old `logoConceptId` JSON records.
- **Dependencies:** Phase 3 & Phase 4 complete.
- **Risks:** Breaking persisted Firestore `CanvasDesign` records created with older `LogoConcepts` schemas; visual regressions in SVG/Canvas raster export (`productPackager.ts`).
- **Verification:**
  - *Automated:* Expand `tests/phase6-products.unit.test.ts`, `tests/phase7-catalog.unit.test.ts`, `tests/brand-room.unit.test.ts`.
  - *Manual Browser:* Open Canvas in all 3 isolated contexts → verify client Brand colors/logo load in Brand mode, Brand Room templates cannot appear in Client Production, saved Canvas JSON reopens cleanly with intact layers, and exported PNG/SVG/PDF/ZIP files render properly on disk.
  - *Firebase:* Storage rules verification confirming outputs stay inside scoped prefixes.
- **Completion Criteria:** Zero cross-contamination across Artist Templates, Brand Templates, and Brand Room Collection 001; client brand tokens usable inside Admin Canvas.

---

## PHASE 6 — Payments & Subscription Automation

- **Objective:** Evaluate and integrate online payment checkout (Paystack candidate for Nigeria + multi-currency comparison), signed Cloud Function webhooks, idempotent fulfillment, automated `ServicePackage` subscription entitlements, and rules-enforced expiration revocation.
- **Existing Code Involved:** `functions/package.json`, `functions/src/index.ts`, `firestore.rules`, `storage.rules`, `src/lib/creativeProductAccess.ts`, Client Billing tabs, Admin Finance (`6. Finance`), `ServicesPackagesManagement.tsx`.
- **Planned Changes:** Execute Paystack vs. alternative gateway evaluation; implement server-side checkout session callable + raw-body HMAC-verified webhook HTTP Function (`/paymentWebhookEvents` idempotency); support one-time Creative Product purchases, invoice payments, and recurring subscriptions; update `firestore.rules` & `storage.rules` to enforce active `packageEntitlements` (`status == 'Active'` & `expiresAt > request.time`) and remove the 5-package index cap via structured entitlement lookup or sync; schedule expiry sweep Cloud Function.
- **Dependencies:** Phase 2 (Firestore Finance) & Phase 5 (Catalog separation) complete; merchant gateway account & secret configuration approved by owner.
- **Risks:** Unverified webhook spoofing or replay attacks (`CRITICAL`); race conditions between webhook fulfillment and client redirect; clients retaining `IncludedInPackage` access after expiry if Storage/Firestore rules lag behind entitlement state.
- **Verification:**
  - *Automated:* Cloud Functions emulator tests simulating valid signed webhooks, tampered signatures (must fail `401/403`), duplicate webhook delivery (idempotent), partial vs full payment, and subscription expiration; Firestore/Storage rules tests confirming expired entitlements block `IncludedInPackage` downloads.
  - *Manual Browser:* Sandbox/test-mode checkout for an Invoice, Creative Pack, and Monthly Retainer subscription → instant entitlement unlock & receipt generation.
  - *Firebase:* Live webhook secret setup & staging sandbox end-to-end verification (`Requires live Firebase verification`).
- **Completion Criteria:** Clients can pay invoices/subscriptions online without ever writing billing statuses client-side; expired subscriptions automatically revoke gated Creative Hub access at both UI and Firestore/Storage rule layers.
