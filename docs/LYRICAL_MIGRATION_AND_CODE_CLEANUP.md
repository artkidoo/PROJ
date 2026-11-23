# Lyrical Legacy Migration & Safe Code Cleanup Plan

**Document Status:** Repository Audit & Cleanup Specification  
**Policy:** **Do NOT delete files, rename database IDs, or mutate live client data during documentation.** Execution spans Phases 0–2.

---

## 1. Objectives & Hard Guardrails

1. **Remove `LYRICAL ENT` as a client-facing identity** from HTML metadata, public portfolio copy, PDF defaults, Canvas template headers, and `localStorage` seeds.
2. **Preserve Infrastructure Continuity:** Never rename the named Firestore database ID (`ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38`) without an audited multi-step Firestore export/import and Cloud Functions/Storage rule cutover.
3. **Preserve Useful Music & Brand Functionality:** Do not discard release checklists, audio/artwork validators, EPK helpers, 6 music agreements (`DocumentTemplates.tsx`), or collateral designers (`BusinessCardDesigner`, `StaffIdCardDesigner`, `EmailSignatureDesigner`). Migrate them to Firestore first.
4. **Preserve Persisted Canvas Backward Compatibility:** Saved `CanvasDesign` JSON documents in Firestore may still reference historical `logoConceptId` values (`'classic'`, `'mic_integrated'`, etc. in `src/types/designStudio.ts` / `LogoConcepts.tsx`). Keep deserialization tolerant so older designs still render.
5. **Normalize Legacy Account Types Safely (`Dual-Read` Pattern):** Historical `Company`, `Business`, `Label`, `Enterprise`, `Agency`, and `Personal` records must continue functioning via dual-read mapping (`normalizeWorkspaceType` → `'Artist' | 'Brand'`) until backfilled in Firestore.

---

## 2. Lyrical Legacy Footprint (`Confirmed from code`)

| Location | Legacy Artifact Found | Planned Action & Target Phase |
|---|---|---|
| `metadata.json` & `index.html` | `"LYRICAL ENT — Brand & Label Studio"` title, description, and OpenGraph tags | **Phase 0:** Update text cleanly to `"KeedoHub — Creative Ecosystem & Production Platform"`. |
| Named Firestore Database ID (`firebase.json`, `functions/src/index.ts`, `storage.rules`, `firebase-applet-config.json`) | `ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38` | **Keep Frozen:** Immutable live platform database pin (`Requires live Firebase verification` before any future DB migration). |
| `src/data/publicContent.ts` & `src/assets/images/lyrical_ent_*` | Portfolio items `p1` (`LYRICAL ENT`), `p4` (`Lyrical Entertainment Group`), and images `lyrical_ent_studio_hero_*.jpg`, `lyrical_ent_brand_stationery_*.jpg` (also referenced in `creativeCatalogSeeds.ts` & `brandRoomStudio.ts`) | **Phase 0:** Replace LYRICAL portfolio text & swap/rename legacy studio/stationery hero photos with KeedoHub studio visuals. |
| `src/context/AppContext.tsx` & `src/data/initialData.ts` | `STORAGE_KEY = 'lyrical_ent_studio_state_v1'`, hardcoded actor `'Ojo Abdulkareem'`, workspace `'ws-lyrical-ent'`, mock label/artist seed data | **Phase 2:** Remove `localStorage` document/workspace seed state after Finance & Docs migrate to Firestore; retain only thin Firebase Auth/session state in `AppContext`. Keep `productionImport.ts` temporarily if unmigrated local snapshots remain. |
| `src/utils/pdfGenerator.ts` (line 79) | Fallback reference `'LYR-DOC-2026'` | **Phase 0:** Replace fallback prefix with `'KH-DOC-'`. |
| `src/data/creativeTemplatesData.ts`, `templateFamiliesData.ts`, `templateDesignBuilder.ts`, `src/types/*` | File headers & sample copy (`'LYRICAL ENT SOUND LABS'`, `'LYRICAL ENT EXECUTIVE'`, `tpl-bl-01`, `tpl-bl-02`) | **Phase 0 / Phase 5:** Rebrand copy to neutral KeedoHub / client placeholder tokens. |
| `src/components/brand/LogoConcepts.tsx` & `LogoSystem.tsx` | Export names `LyricalMonogram`, `LyricalPrimaryLogo`, `LyricalLogoConcept` imported by `DesignCanvasEditor`, `productPackager`, `HonestCanvasThumbnail`, `CorporateDocuments` | **Phase 5:** Rename/alias symbols cleanly while keeping backwards-compatible fallback switches for stored `logoConceptId` values. |
| `src/components/modules/DocumentTemplates.tsx` | 6 Artist/Music legal & budget docs stamped `LYRICAL ENT LLC` (`localStorage`) | **Phase 2:** Extract & parameterize into Firestore **Artist Document Vault**, then delete file. |
| `src/components/modules/CorporateDocuments.tsx` (line 101) | `.txt` download defaults to `'lyrical_doc.txt'` (`localStorage`) | **Phase 2:** Replace wrapper by routing collateral designers into Brand Docs & Admin Brand Dept, then delete. |

---

## 3. Safe Unused-Code Cleanup Inventory (`Confirmed from code`)

Import-graph audit across `src/` verified **0 live entry imports** (not reachable from `main.tsx` or `App.tsx`) for the following files:

### Group A — Safe Immediate Deletion Candidates (`Phase 0`)
- **Dead Legacy Navigation & Modals (9 files):**
  - `src/components/common/Header.tsx` (249 lines)
  - `src/components/common/Sidebar.tsx` (289 lines)
  - `src/components/brand/KeedohubLogo.tsx` (superseded by `keedohub_brand_logo_*.jpg`)
  - `src/components/admin/AdminAccounts.tsx` (53 lines)
  - `src/components/admin/AdminWorkspace.tsx` (7 lines)
  - `src/components/modals/NewWorkspaceModal.tsx` (293 lines)
  - `src/components/modals/QuickActionModal.tsx` (772 lines)
  - `src/components/modals/ClientRequestModal.tsx`
  - `src/components/modals/WorkspaceSettingsModal.tsx`
- **Dead Blogger & Legacy Export Modules + Utils (8 files):**
  - `src/components/modules/BloggerWebsiteStudio.tsx` (728 lines) & `src/components/blogger/BloggerWebsitePreview.tsx`
  - `src/utils/bloggerXmlGenerator.ts`, `src/utils/releaseZipGenerator.ts`, `src/utils/zipGenerator.ts`
  - `src/components/modules/ExportCenter.tsx` (788 lines)
  - `src/components/modules/LaunchCreativeStudio.tsx`
  - `src/components/modules/MotionStudio.tsx` (26 lines empty stub)
- **Dead `localStorage` Dashboards, Campaign & Client-Canvas Stubs (12 files):**
  - `src/components/modules/OverviewDashboard.tsx` (1,140 lines)
  - `src/components/modules/AdminControlCenter.tsx` (1,990 lines)
  - `src/components/modules/Operations.tsx` (343 lines)
  - `src/components/modules/ProductionCenter.tsx` (7 lines)
  - `src/components/modules/AssetLibrary.tsx` (350 lines)
  - `src/components/modules/BrandIdentityManager.tsx` (1,125 lines)
  - `src/components/modules/CelebrationCalendar.tsx` (648 lines)
  - `src/components/modules/CreativeCampaignStudio.tsx` (601 lines)
  - `src/components/modules/CreativeTemplateLibrary.tsx` (464 lines)
  - `src/components/modules/MusicPromotionStudio.tsx` (463 lines)
  - `src/components/studio/ReleaseProjectForm.tsx` & `src/utils/campaignGenerator.ts`

### Group B — Migrate Domain Functionality BEFORE Deleting (`Phase 2` / `Phase 4`)
- `src/components/modules/DocumentTemplates.tsx` (355 lines) → Port 6 music legal/production agreements first.
- `src/components/modules/MusicReleaseManagement.tsx` (1,361 lines) → Port 7-step `ReleaseChecklist` & audio/artwork technical spec validators first.
- `src/components/modules/ArtistManagement.tsx` (463 lines) → Port extra artist profile fields into Artist Onboarding / `artistProfile`.
- `src/components/modules/PressMedia.tsx` (668 lines) → Port structured Press Release / EPK builder into Artist Studio.

### Group C — Refactor & Relocate (`Phase 2` / `Phase 3`)
- `src/components/modules/BusinessCardDesigner.tsx`, `StaffIdCardDesigner.tsx`, `EmailSignatureDesigner.tsx` → Currently mounted via `AdminHQ` → `CorporateDocuments.tsx`. Disconnect from `AppContext` `localStorage`, wire to Firestore Brand tokens + Storage/Brand Assets, then delete `CorporateDocuments.tsx`.
- `src/data/initialData.ts` → Keep only until `AppContext` legacy state & `AdminInvoicesManagement`/`AdminProposalsManagement` finish moving to Firestore.

---

## 4. Legacy Account Type Normalization Rules (`Phase 1`)

During Phase 1–2, enforce **dual-read compatibility** so zero existing users lose workspace access:

| Legacy Stored Value | Where Found | Dual-Read Runtime Mapping | Target Backfilled Value |
|---|---|---|---|
| `'Company'`, `'Business'`, `'Enterprise'`, `'Agency'`, `'Label'` | `clientProfiles.accountType`, `workspaces.type`, `workspaces.clientCategory` | Treated identically as **`Brand`** in `clientOS.ts`, `ClientWorkspace`, Admin Department filters, and security rules. | `accountType: 'Brand'`, `workspaces.type: 'Brand'`, `clientCategory: 'brand'` |
| `'Personal'` | `workspaces.type` (`firestore.rules:361`, `clientOS.ts:209`) | Mapped to `'Artist'` if `clientProfiles.accountType === 'Artist'` else `'Brand'`. | `'Artist'` or `'Brand'` (inspected per record prior to backfill) |
| `'Business'`, `'Brand & Business'` | `creativeProducts.audience` (`creativeProduct.ts`, `firestore.rules`, `storage.rules`) | Matched cleanly against `'Brand'` clients during transition window. | `audience: 'Brand'` |
