# KeedoHub Brand Workspace Architecture

**Document Status:** Product Specification & Audit Baseline  
**Primary Sources:** `src/components/client/ClientWorkspace.tsx`, `src/components/client/ClientStudio.tsx`, `src/components/client/ClientCreativeHub.tsx`, `src/lib/clientOS.ts`, `src/data/creativeCatalogSeeds.ts`, `src/utils/pdfGenerator.ts`, `src/components/modules/CorporateDocuments.tsx`, `src/components/modules/BusinessCardDesigner.tsx`, `src/components/modules/StaffIdCardDesigner.tsx`, `src/components/modules/EmailSignatureDesigner.tsx`.

---

## 1. Purpose & Unified Scope

The Brand Workspace (`Brand OS`) serves **all commercial and organizational clients**: product brands, service businesses, startups, corporate organizations, agencies, and record labels operating as commercial entities.

- **Architectural Rule:** There is **no separate Company, Business, Enterprise, Agency, or Label experience**. All business creative needs, corporate profiles, commercial proposals, quotations, invoices, and operational collateral live inside **Brand**.
- **Not Primarily Campaign Software:** While brands can manage promotional copy and request promotional graphics, KeedoHub Brand Workspace centers on **brand identity governance, creative production requests, studio deliverables, brand assets, corporate collateral, and commercial documents**.

---

## 2. Workspace Modules: Current vs. Proposed Architecture

| Module | Current Status | Code Reality (`Confirmed from code`) | Target Brand Experience (`PLANNED`) |
|---|---|---|---|
| **Brand Dashboard (Overview)** | `PARTIALLY IMPLEMENTED` | `ClientWorkspace.tsx` renders shared overview metrics across projects, deliverables, and updates (with `"Brand OS"` vs redundant `"Business OS"` label for `'Company'`). | Brand-focused overview: Brand Identity completion status, active design projects, deliverables awaiting review, open proposals/invoices summary, quick-launch actions. |
| **Brand Identity** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientStudio.tsx` (`tab === 'brand'`) persists `workspace.brand` (`primaryColor`, `secondaryColor`, `accentColor`, `displayFont`, `bodyFont`, `tagline`, `logoUrl`) and `workspace.brandProfile` (`description`, `industry`, `website`, `brandVoice`, `photographyDirection`, `graphicDesignPrinciples`, `usageGuidelines`, `creativeReferences`) in Firestore. | Collected starting at onboarding, synced into Admin Brand Department & `DesignCanvasEditor` (`Phase 5`), removing `'Company'`/`'Business'` split labels. |
| **Brand Guidelines** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `generateBrandGuidelinesPdf()` (`src/utils/pdfGenerator.ts`) renders downloadable Brand Guidelines PDF directly from live Firestore `workspace.brand` + `brandProfile`. | Retain live PDF exporter; add versioned guidelines storage in Brand Asset Vault / Documents. |
| **Creative System (Content & Collateral Copy)** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientStudio.tsx` (`tab === 'content'`) persists brand announcements, promotional copy, and social copy in Firestore `workspaces/{id}/contentDrafts`. | Position clearly as brand messaging, product/service copy, and collateral brief inputs rather than an autonomous ad-campaign manager. |
| **Creative Hub (Brand)** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientCreativeHub.tsx` renders `BRAND_BUSINESS_CREATIVE_SERVICES` and filters `creativeProducts` matching `'Brand'`, `'Business'`, `'Brand & Business'`, or `'Shared'`. | Normalize catalog filters to **`Brand Packs`** and **`Shared Utilities`** (`Phase 1` + `Phase 5`). |
| **Creative Requests** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientWorkspace` filters out music-only categories (`Music Cover Artwork`, `Artist Promotional Graphics`), supports one-click prefill from `buildBrandProductionPrefill()` & Creative Hub products. | Cover full Brand creative services (Identity, Social, Business Docs, Presentations, Company Profiles, Flyers/Print/Signage). |
| **Active Projects & Deliverables** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | Live Firestore tracking of project stages, client-visible tasks, multi-version deliverables, preview/download, approve, revision requests. | Brand-aligned stage summary & deliverable packaging preview. |
| **Asset Vault** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientStudio.tsx` (`tab === 'assets'`) stores approved logos, brand graphics, and photography in Firestore `brandAssets` + Storage. | Categorized vault folders: Logo Suite, Brand Photography, Print Finals, Pitch & Profile PDFs, Collateral Templates. |
| **Brand Documents** | `PARTIALLY IMPLEMENTED` (Security Risk) | `ClientStudio.tsx` reads/writes `workspaces/{id}/documents` and exports PDFs via `generateCorporateDocumentPdf()`. **Defect:** `firestore.rules:402` lets workspace members edit/forge financial docs, while Admin Finance still reads `localStorage`. Useful collateral designers (`BusinessCardDesigner`, `StaffIdCardDesigner`, `EmailSignatureDesigner`) sit disconnected in `modules/` (`localStorage`). | Secure separation: client-editable **Brand Collateral Docs** (Company Profile, Brochures, Letterheads, Business Cards, Staff IDs, Email Signatures) vs. Admin-issued read-only **Commercial Finance Docs** (Proposals, Quotations, Invoices, Receipts, Contracts/NDAs). |
| **Billing & Entitlements** | `PARTIALLY IMPLEMENTED` / `PLANNED` | `ClientStudio.tsx` displays `renderInvoices` & `renderProposals` from `workspaces/{id}/documents` (disconnected from Admin HQ). Online payment checkout is `Not implemented`. | Unified Firestore `/invoices`, `/proposals`, active Brand package entitlements, and online checkout (`Phase 2` + `Phase 6`). |
| **Account Settings** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientWorkspace.tsx` manages personal login display name & avatar (`validatePersonalAccountUpdate`). | Retain unified Account tab. |

---

## 3. Brand Profile & Identity System

Currently stored on `workspaces/{workspaceId}` (`src/types/index.ts`, `ClientStudio.tsx`):

| Identity Field | Storage Field | Used Today By (`Confirmed from code`) | Planned Integration |
|---|---|---|---|
| Brand Name & Tagline | `workspace.brand.name`, `.tagline` | `ClientStudio`, `generateBrandGuidelinesPdf`, `generateCorporateDocumentPdf` | Pre-populate onboarding & Canvas Brand layers |
| Brand Colours (`Primary`, `Secondary`, `Accent`) | `workspace.brand.primaryColor`, `.secondaryColor`, `.accentColor` | `ClientStudio`, `generateBrandGuidelinesPdf`, `buildBrandProductionPrefill` | Load as one-click swatches in Admin `DesignCanvasEditor` (`Phase 5`) |
| Typography (`Display`, `Body`) | `workspace.brand.typography.{displayFont, bodyFont}` | `ClientStudio`, `generateBrandGuidelinesPdf`, `buildBrandProductionPrefill` | Map to Canvas font presets (`Phase 5`) |
| Logo File | `workspace.brandProfile.logoUrl`, `.logoPath` | `ClientStudio` (`Brand Identity` upload) | Surface directly in Admin Canvas client asset drawer & Collateral Designers |
| Voice & Strategy | `workspace.brandProfile.{description, industry, website, brandVoice}` | `ClientStudio`, `generateBrandGuidelinesPdf` | Visible in Admin Brand Department project briefs |
| Design Direction | `workspace.brandProfile.{photographyDirection, graphicDesignPrinciples, usageGuidelines, creativeReferences}` | `ClientStudio`, `generateBrandGuidelinesPdf` | Mandatory brief reference for Admin producers during Brand production |

---

## 4. Brand Creative Production Catalogue (Capability Matrix)

| Catalogue Item | Current Status | Code Evidence / Gap Notes |
|---|---|---|
| Logo systems & brand identity development | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | Supported via `Brand Identity` request category, `svc-brand-identity-suite`, `creativeCatalogSeeds.ts`, and Canvas custom projects (`Requires runtime verification`). |
| Brand guidelines | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | Live PDF export via `generateBrandGuidelinesPdf()` in `ClientStudio.tsx` + `Brand Identity` service packs. |
| Social media designs & advertising graphics | `PARTIALLY IMPLEMENTED` | Supported via `Social Media Designs` category, `svc-social-media-design`, and Creative Hub social packs (`Needs cleanup to remove Company split`). |
| Flyers, posters, banners & signage | `PARTIALLY IMPLEMENTED` | Covered by `Flyers & Posters` request category and `svc-marketing-creative-production`; dedicated signage/outdoor print spec packs are `PLANNED`. |
| Business profiles & company profiles | `PARTIALLY IMPLEMENTED` | Requestable via `svc-company-profile-design` and `'company_profile'` document type; full multi-page designed PDF layout templates in Admin Library are `PLANNED`. |
| Proposals, quotations, invoices & receipts | `PARTIALLY IMPLEMENTED` / `LEGACY / DISCONNECTED` | PDF generation (`generateCorporateDocumentPdf`) exists, **but Admin HQ uses `localStorage` while Client uses permissive Firestore rules** (see [DOCUMENTS_AND_FINANCE.md](DOCUMENTS_AND_FINANCE.md)). |
| Contracts, NDAs & corporate agreements | `PARTIALLY IMPLEMENTED` | Document types exist in `src/types/index.ts`; needs secure Admin-vs-Client workflow in Firestore (`Phase 2`). |
| Business cards | `LEGACY / DISCONNECTED` | Full visual designer + PDF/SVG export exists in `src/components/modules/BusinessCardDesigner.tsx`, wired only to `AppContext` `localStorage` via `CorporateDocuments.tsx`. Planned refactor into Brand Workspace & Admin Brand Dept (`Phase 2`/`4`). |
| Staff ID cards | `LEGACY / DISCONNECTED` | Full designer exists in `src/components/modules/StaffIdCardDesigner.tsx` (`localStorage` only). Refactor to Firestore planned (`Phase 2`/`4`). |
| Email signatures | `LEGACY / DISCONNECTED` | HTML/visual builder exists in `src/components/modules/EmailSignatureDesigner.tsx` (`localStorage` only). Refactor to Firestore planned (`Phase 2`/`4`). |
| Brochures & letterheads | `PARTIALLY IMPLEMENTED` | `official_letter` & print collateral listed in services/requests; dedicated printable brochure Canvas packs are `PLANNED`. |
| Presentations (pitch & executive decks) | `PARTIALLY IMPLEMENTED` | `svc-presentation-design` request prefill exists; multi-slide deck template engine in Design Library is `PLANNED`. |
| Packaging, menus, price lists & product catalogues | `PLANNED` | Commercial categories fit under Brand requests (`Other Creative Work` / `Marketing Creative Production`); specialized template families/calculators are `Not implemented`. |
| Business & promotional graphics | `PARTIALLY IMPLEMENTED` | `creativeTemplatesData.ts` contains `'Business Promotion'` & `'Company Announcements'` templates needing normalization to `'Brand'`. |
