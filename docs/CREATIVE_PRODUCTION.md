# KeedoHub Creative Production Lifecycle

**Document Status:** Production Pipeline Specification & Audit Baseline  
**Primary Sources:** `src/components/client/ClientWorkspace.tsx`, `src/components/admin/AdminProduction.tsx`, `src/lib/productionPromotion.ts`, `src/lib/assetSecurity.ts`, `src/types/index.ts`, `functions/src/index.ts`, `firestore.rules`, `storage.rules`.

---

## 1. End-to-End Production Workflow

The intended KeedoHub production pipeline enforces clear accountability and strict separation between internal working drafts and client-approved deliverables:

```text
 1. Client Request          ──▶ Client submits brief in ClientWorkspace (or ContactPage enquiry)
 2. Admin Review            ──▶ Shared Operations / Department Lead reviews brief & attachments
 3. Department Assignment   ──▶ Assigned to Artist Department OR Brand Department
 4. Project Creation        ──▶ clientProjects/{projectId} created/linked with stage & SLA dueDate
 5. Creative Brief          ──▶ Locked scope, client brand/artist identity data & specs attached
 6. Production              ──▶ Admin works internally (DesignCanvasEditor / external tools / tasks)
 7. Internal QA             ──▶ Lead Producer checks dimensions, formats, brand/release accuracy
 8. Client Review           ──▶ Approved version marked isClientPublished: true -> stage: Client Review
 9. Revision Request        ──▶ (If needed) Client submits feedback -> Revision Required -> back to 6
10. Final Approval          ──▶ Client marks deliverable Approved -> recorded with timestamp/UID
11. Deliverable Publication ──▶ Approved finals promoted to Client Asset Vault / Deliverable archive
12. Client Download         ──▶ Client downloads verified Storage assets (PNG/JPG/SVG/PDF/MP4/ZIP)
13. Project Completion      ──▶ Stage advances to Delivered / status Completed + Audit/Notifications
```

### Current Implementation Check (`Confirmed from code`)
- **Stages Implemented (`AdminProduction.tsx` lines 85–94):** `New Request`, `Brief Approved`, `In Production`, `Internal QA`, `Client Review`, `Revision Required`, `Ready for Delivery`, `Delivered` (`IMPLEMENTED — RUNTIME VERIFICATION PENDING`).
- **Cloud Functions (`functions/src/index.ts`):** `createProductionRequest`, `submitDeliverableReview`, `adminUpdateProjectStage` (inferred/check callable names), triggers syncing notifications & activity feeds (`IMPLEMENTED — RUNTIME VERIFICATION PENDING`).
- **Missing Departmental Split:** Today, projects are not strictly partitioned into Artist Department vs. Brand Department views in `AdminProduction.tsx` (`PLANNED` Phase 3).

---

## 2. Responsibility & Visibility Boundaries

| Capability | Client (`Artist` / `Brand`) | Platform Admin / Producer | Enforcement Status (`Confirmed from code`) |
|---|---|---|---|
| **Access `DesignCanvasEditor`** | **Strictly Forbidden** | Allowed (`admins/{uid}` verified from server) | `IMPLEMENTED AND VERIFIED` in `DesignCanvasEditor.tsx:114-132`. |
| **See Unfinished Internal Drafts** | **Strictly Forbidden** | Allowed | `IMPLEMENTED — RUNTIME VERIFICATION PENDING`: `firestore.rules` & `storage.rules` require `isClientPublished == true` on project deliverables and `isInternal == false` on `brandAssets`. |
| **See `internalNotes` & `internalAssets`** | **Strictly Forbidden** | Allowed | `IMPLEMENTED — RUNTIME VERIFICATION PENDING`: `internalNotes` subcollection & `internalAssets` subcollection/storage folders (`isInternalStoragePath`) are Admin-only. |
| **Preview, Download, Approve, Revise** | Allowed on **published** deliverables only | Uploads versions, resolves revision requests, toggles publish | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` (`ClientWorkspace.tsx`, `AdminProduction.tsx`). |
| **Version History & Activity Log** | Sees client-visible updates & published versions | Full `versions[]`, `productionActivities`, `adminAuditLogs` | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` (`types/index.ts`). |

---

## 3. Three Asset Layers

KeedoHub strictly separates creative files across three distinct layers so master templates, client work-in-progress, and client-approved finals never bleed across boundaries:

### Layer 1: KeedoHub Master Creative Library (`Admin-Only`)
- **Purpose:** Reusable foundational creative templates, design families, Canvas masters, and studio packaging blueprints curated by KeedoHub staff.
- **Code Locations (`Confirmed from code`):** `AdminDesignLibrary.tsx` (`masterTemplates`, `creativeDesigns`), `AdminCreativeProducts.tsx` (`creativeProducts`, `creativeProductInternalSpecs`), `src/data/creativeTemplatesData.ts`, `src/data/templateFamiliesData.ts`.
- **Note:** Internal **KeedoHub Brand Room** templates (`brandRoomStudio.ts`, `marketingCollection001.ts`) remain isolated inside Brand Room and are **not** part of client-facing Master Templates.

### Layer 2: Client Production Library (`Project-Scoped Working & Review Layer`)
- **Purpose:** Active client brief attachments, working internal Canvas designs, raw production source files (e.g. unflattened PSD/working exports), internal QA proofs, and versioned client-review proofs.
- **Code Locations (`Confirmed from code`):**
  - Firestore: `clientProjects/{projectId}`, `clientProjects/{projectId}/deliverables/{deliverableId}` (`isClientPublished: false` for drafts, `true` for client review), `clientProjects/{projectId}/internalNotes`, `workspaces/{wsId}/internalAssets`.
  - Storage: `/clients/{clientUid}/requests/**`, `/clients/{clientUid}/projects/{projectId}/deliverables/**`, internal paths protected via `isInternalStoragePath()` (`src/lib/productionPromotion.ts`).

### Layer 3: Client Asset Vault (`Client-Accessible Approved Archive`)
- **Purpose:** Permanent workspace library containing client-uploaded reference media (approved logos, press photos, audio masters) and **Admin-promoted approved deliverables** ready for ongoing client reuse.
- **Code Locations (`Confirmed from code`):**
  - Firestore: `workspaces/{workspaceId}/brandAssets/{assetId}` (`isInternal == false` enforced by `firestore.rules:403-419`).
  - Promotion Utility: `promoteBrandAssetToDeliverable` / `createDeliverableFromBlob` in `src/lib/productionPromotion.ts`.
  - UI: `ClientStudio.tsx` (`tab === 'assets'`).
