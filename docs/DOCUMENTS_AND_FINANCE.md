# KeedoHub Documents & Finance Architecture

**Document Status:** Critical Audit Findings & Target Specification  
**Primary Sources:** `src/components/admin/AdminInvoicesManagement.tsx`, `src/components/admin/AdminProposalsManagement.tsx`, `src/components/modules/CorporateDocuments.tsx`, `src/components/modules/DocumentTemplates.tsx`, `src/components/modules/BusinessCardDesigner.tsx`, `src/components/modules/StaffIdCardDesigner.tsx`, `src/components/modules/EmailSignatureDesigner.tsx`, `src/components/client/ClientStudio.tsx`, `src/context/AppContext.tsx`, `src/utils/pdfGenerator.ts`, `firestore.rules`.

---

## 1. Critical Audit Findings (`Confirmed from code`)

### Defect 1 — Admin HQ Finance vs. Client Workspace Split-Brain (`LEGACY / DISCONNECTED`)
- **`AdminInvoicesManagement.tsx` (699 lines)**, **`AdminProposalsManagement.tsx` (518 lines)**, and **`CorporateDocuments.tsx` (776 lines)** all call `useApp()` (`documents`, `addDocument`, `updateDocument`, `deleteDocument`, `workspaces`) from `AppContext.tsx`.
- `AppContext.tsx` persists those records exclusively in browser **`localStorage` (`lyrical_ent_studio_state_v1`)** seeded from `src/data/initialData.ts`.
- Meanwhile, **`ClientStudio.tsx` (lines 2840–3450)** reads and writes **`workspaces/{workspaceId}/documents`** in Firestore (`onSnapshot`, `addDoc`, `updateDoc`, `deleteDoc`).
- **Result:** Invoices and proposals issued by Admin HQ in live production **never appear** inside a client's Firestore workspace, and Client documents never appear in Admin HQ (`Confirmed from code`).

### Defect 2 — Overly Permissive Workspace Document Write Vulnerability (`CRITICAL SECURITY RISK`)
- `firestore.rules` line 402 reads:
  ```
  match /documents/{documentId} { allow read, write: if isWorkspaceMember(workspaceId); }
  ```
- Simultaneously, `ClientStudio.tsx` lines 3188–3294 render client controls to create/edit/delete documents with `type` values `'invoice'`, `'quotation'`, and `'partnership_proposal'`, and mutate `status` (`Draft`, `Under Review`, `Approved`, `Issued`) and `totalAmount`.
- **Result:** Any authenticated workspace member can currently write directly to `workspaces/{workspaceId}/documents` and fabricate commercial invoices, alter billed line items/totals, or tamper with Admin-issued proposals (`Confirmed from code`).
- **Action Policy:** **Do not deploy rules fixes or modify `firestore.rules` during this documentation phase.** Remediation is scheduled cleanly in **Phase 2**.

---

## 2. Target Document Classification & Authority Matrix (`PLANNED` — Phase 2)

Future document & financial architecture separates authority strictly across three record classes:

| Record Class | Authority / Write Access | Client Read & Action Permissions | Target Storage Location |
|---|---|---|---|
| **1. Admin-Issued Commercial Finance & Contracts** (`Invoices`, `Receipts`, `Proposals`, `Quotations`, `Commercial Contracts / NDAs`) | **Platform Admin & Billing Cloud Functions / Webhooks ONLY** (`adminSaveInvoice`, `adminRecordManualPayment`, `adminSaveProposal`, `adminConvertProposalToInvoice`) | Read + PDF download for workspace owner/members; Proposal response (`Accepted` / `Declined` / `Revision Requested`) via **strict Cloud Function (`clientRespondProposal`)** only. Clients can **never** edit prices, payment status, or invoice totals. | Top-level Firestore `/invoices/{invoiceId}`, `/proposals/{proposalId}`, `/receipts/{receiptId}` (or server-guarded commercial subcollection with strict rules). |
| **2. Client-Created Workspace Documents** (Non-commercial working & creative docs) | **Workspace Members + Platform Admin** | Full CRUD scoped by workspace membership, with Firestore rules explicitly **denying** commercial billing doc types (`type in ['invoice', 'receipt', 'quotation', 'partnership_proposal', 'sponsorship_proposal']` or `issuedByAdmin == true`). | `workspaces/{workspaceId}/documents/{docId}` (`library: 'artist' \| 'brand'`). |
| **3. Internal Administrative Records** | **Platform Admin ONLY** | Completely invisible to clients (`isPlatformAdmin()`). | `adminAuditLogs`, `clientProjects/{id}/internalNotes`, `creativeProductInternalSpecs`, Brand Room collections. |

---

## 3. Separated Document Libraries

### 3.1 Artist Document Library (`PLANNED` Integration)
Combines live Firestore Artist workspace metadata with the 6 music legal/production templates currently trapped in legacy `DocumentTemplates.tsx` (`localStorage`, stamped `LYRICAL ENT LLC`) plus `PressMedia.tsx`:

| Document Type | Current Status | Source / Planned Target |
|---|---|---|
| **Artist EPK (Electronic Press Kit)** | `PARTIALLY IMPLEMENTED` | Synthesize live `artistProfile` + `releases` + press photos via `pdfGenerator.ts` (`PLANNED` in Phase 4). |
| **Artist Biography & Press Release** | `PARTIALLY IMPLEMENTED` / `LEGACY / DISCONNECTED` | Bio in `ClientStudio`; structured press release builder in legacy `PressMedia.tsx` (`localStorage`) → port to Firestore. |
| **Split Sheet Agreement** | `LEGACY / DISCONNECTED` | Re-brand & parameterize from `DocumentTemplates.tsx` into Firestore Artist Document Builder (`Phase 2`). |
| **Producer Fee & Royalty Memo** | `LEGACY / DISCONNECTED` | Re-brand & parameterize from `DocumentTemplates.tsx` (`Phase 2`). |
| **Master Recording Authorization** | `LEGACY / DISCONNECTED` | Re-brand & parameterize from `DocumentTemplates.tsx` (`Phase 2`). |
| **Music Video Release Form** | `LEGACY / DISCONNECTED` | Re-brand & parameterize from `DocumentTemplates.tsx` (`Phase 2`). |
| **Tracklist & Credits Sheet (ISRC / UPC)** | `PARTIALLY IMPLEMENTED` | Data exists on `workspaces/{id}/releases` (`ClientStudio.tsx`); formatted export generator is `PLANNED`. |
| **Production Brief & Album Budget** | `LEGACY / DISCONNECTED` | Ported from `DocumentTemplates.tsx` + `ClientWorkspace` request brief export (`Phase 2`). |
| **Artist Commercial Proposals & Invoices** | `PARTIALLY IMPLEMENTED` (Disconnected) | Issued by Admin Finance (`6. Finance`) and viewed read-only by Artist inside Billing & Entitlements. |

### 3.2 Brand Document Library (`PLANNED` Unification)
Unifies Brand corporate collateral with secure Admin-issued commercial finance documents:

| Document Type | Current Status | Source / Planned Target |
|---|---|---|
| **Brand Guidelines Manual PDF** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `generateBrandGuidelinesPdf()` in `src/utils/pdfGenerator.ts` using live Firestore `workspace.brand` & `brandProfile`. |
| **Company Profile** | `PARTIALLY IMPLEMENTED` | Supported as `'company_profile'` in `ClientStudio` + `svc-company-profile-design`; add multi-page designed layout template (`Phase 4`/`5`). |
| **Proposals & Quotations** | `PARTIALLY IMPLEMENTED` / `LEGACY / DISCONNECTED` | Admin UI in `AdminProposalsManagement` (`localStorage`) + Client UI in `ClientStudio` (`Firestore`). Unify in Admin Finance (`6. Finance`) -> Firestore -> Client Proposal Review. |
| **Invoices & Payment Receipts** | `PARTIALLY IMPLEMENTED` / `LEGACY / DISCONNECTED` | Admin ledger in `AdminInvoicesManagement` (`localStorage`) + Client viewer in `ClientStudio` (`Firestore`). Unify in Firestore with locked commercial write rules. |
| **Contracts & NDAs** | `PARTIALLY IMPLEMENTED` | `CorporateDocuments` / `types/index.ts` support types; move to Firestore Admin-issued Vault. |
| **Brochures & Letterheads** | `PARTIALLY IMPLEMENTED` | Letterhead/correspondence (`official_letter`) supported by `generateCorporateDocumentPdf()`; printable brochure masters via Canvas (`Phase 5`). |
| **Business Cards** | `LEGACY / DISCONNECTED` | Visual designer + PNG/SVG/PDF export in `BusinessCardDesigner.tsx` (`localStorage`). Refactor to read Firestore Brand profile & save outputs to `workspaces/{id}/brandAssets` / `documents`. |
| **Staff ID Cards** | `LEGACY / DISCONNECTED` | Visual builder in `StaffIdCardDesigner.tsx` (`localStorage`). Refactor to Firestore Brand workspace (`Phase 2`/`4`). |
| **Email Signatures** | `LEGACY / DISCONNECTED` | Visual/HTML generator in `EmailSignatureDesigner.tsx` (`localStorage`). Refactor to Firestore Brand workspace (`Phase 2`/`4`). |

---

## 4. Target PDF Engine Cleanup (`src/utils/pdfGenerator.ts`)

- Remove legacy fallback reference prefix `'LYR-DOC-2026'` (`pdfGenerator.ts:79`) and replace with `'KH-DOC-'` / dynamic workspace prefix (`Phase 0`/`2`).
- Parameterize company footer/header cleanly so **Admin-issued commercial invoices/proposals** carry KeedoHub legal billing identity while **Client Brand/Artist collateral** (Brand Guidelines, Company Profiles, Business Cards, Artist EPKs) carries the client workspace's name, logo, and color tokens (`IMPLEMENTED` partially in `generateBrandGuidelinesPdf`).
