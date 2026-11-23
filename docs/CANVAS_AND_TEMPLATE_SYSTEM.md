# KeedoHub Canvas & Template System

**Document Status:** Technical & Architectural Specification  
**Primary Sources:** `src/components/studio/DesignCanvasEditor.tsx` (1,965 lines), `src/lib/canvasShapeRenderer.ts`, `src/lib/productPackager.ts`, `src/utils/templateDesignBuilder.ts`, `src/components/admin/AdminDesignLibrary.tsx`, `src/components/admin/AdminCreativeProducts.tsx`, `src/components/admin/AdminProduction.tsx`, `src/components/admin/brand-room/BrandRoom.tsx`, `src/data/creativeTemplatesData.ts`, `src/data/templateFamiliesData.ts`, `src/data/marketingCollection001.ts`.

---

## 1. Architectural Mandate: One Admin-Only Canvas Engine

KeedoHub operates **one** interactive visual production engine: **`DesignCanvasEditor`** (`src/components/studio/DesignCanvasEditor.tsx`).

- **No Second Editor:** Do not build an alternate client canvas or separate Brand Room editor.
- **Strict Admin Gate (`IMPLEMENTED AND VERIFIED`):** On mount (`DesignCanvasEditor.tsx` lines 114–132), the editor verifies an active record in `admins/{uid}` via `getDocFromServer()`. Non-admin sessions are rejected immediately.
- **Current Live Mount Points (`Confirmed from code`):**
  1. `AdminDesignLibrary.tsx` (Master Templates, Template Families, Saved Designs)
  2. `AdminCreativeProducts.tsx` (Drafting & packaging Creative Hub products)
  3. `AdminProduction.tsx` (In-project deliverable creation from active client briefs)
  4. `BrandRoom.tsx` (Internal KeedoHub Marketing Kit & Collection 001)
  *(Note: Legacy imports in `modules/MusicPromotionStudio.tsx` and `modules/CreativeTemplateLibrary.tsx` are orphaned `LEGACY / DISCONNECTED` modules slated for deletion.)*

---

## 2. Three Isolated Canvas Contexts (`PLANNED` Enforcement — Phase 5)

Currently, `DesignCanvasEditor` receives optional design/brand props (`initialDesign`, `onSave`, `onExport`, etc.), **without strict context isolation or automatic Firestore client Brand token hydration (`PARTIALLY IMPLEMENTED`)**. In Phase 5, every Canvas launch will enforce an explicit **`canvasMode`**:

| Context (`canvasMode`) | Launched From | Required Context Inputs (`PLANNED`) | Template Collection Allowed | Allowed Storage Output Path |
|---|---|---|---|---|
| **1. Artist Client Production** | Admin Artist Dept (`AdminProduction`, `AdminDesignLibrary` Artist tab) | Selected Artist Client & Workspace, Project/Brief, `artistProfile` (name, press photo, release metadata) | **Artist Templates** + Master Cover/Streaming Layouts | `clients/{clientUid}/projects/{projectId}/...` or Artist workspace assets |
| **2. Brand Client Production** | Admin Brand Dept (`AdminProduction`, `AdminDesignLibrary` Brand tab) | Selected Brand Client & Workspace, Project/Brief, `workspace.brand` & `brandProfile` (logo, colors, typography, guidelines) | **Brand Templates** + Commercial Collateral Layouts | `clients/{clientUid}/projects/{projectId}/...` or Brand workspace assets |
| **3. Internal KeedoHub Brand Room** | `BrandRoom.tsx` | KeedoHub Identity (`brandRoomIdentity/keedohub`) | **Collection 001** & `MARKETING_MASTER_TEMPLATES` (`brandRoomStudio.ts`) | `brand-room/**` (`isPlatformAdmin()` only) |

*(Note: Creative Hub Pack Authoring from `AdminCreativeProducts.tsx` outputs into `creative-products/**`, tagged strictly as `Artist`, `Brand`, or `Shared`.)*

### Isolation Invariants
- Artist templates, Brand templates, and KeedoHub Brand Room templates **must never** mix in the same picker.
- KeedoHub Brand Room logos/badges/copy must **never** leak into client deliverables (`Confirmed risk` in legacy `LogoConcepts.tsx` & `templateDesignBuilder.ts` where `LYRICAL` or platform marks appear by default unless stripped).

---

## 3. Template Ecosystem Inventory (`Confirmed from code`)

| Source | Volume / Contents | Audience Mixing Today | Target Normalization (`PLANNED`) |
|---|---|---|---|
| `src/data/creativeTemplatesData.ts` | 60+ `MASTER_CREATIVE_TEMPLATES` across 15 categories | Mixes `'Music Promotion'`/`'Artist Branding'` with `'Business Promotion'`/`'Company Announcements'` + contains `'LYRICAL ENT'` copy (`tpl-bl-01`). | Tag every template `department: 'Artist' \| 'Brand'`; remove `'Company'`/`'LYRICAL ENT'` copy; load dynamically in Dept Libraries. |
| `src/data/templateFamiliesData.ts` | 36 `TEMPLATE_FAMILIES` across 6 design families | Mixes `'urban_music'` & `'artist_branding'` with `'clean_commercial'`. | Partition families cleanly by `'Artist'`, `'Brand'`, or neutral geometric structural base. |
| Firestore `masterTemplates` / `creativeDesigns` (`AdminDesignLibrary.tsx`) | Admin-saved reusable `CanvasDesign` masters | Stored without mandatory `Artist` vs `Brand` isolation flag. | Add required `department: 'Artist' \| 'Brand'` field (`Shared` strictly limited to neutral layout grids). |
| `src/data/marketingCollection001.ts` & `src/lib/brandRoomStudio.ts` | 12 Collection 001 flagship designs + Brand Room formats | Isolated inside `BrandRoom.tsx` — **`IMPLEMENTED — RUNTIME VERIFICATION PENDING`**. | Keep strictly inside KeedoHub Brand Room (`7. KeedoHub Brand Room`). |

---

## 4. Brand Identity Hydration into Canvas (`PLANNED`)

- **Current Status:** `Not implemented` as an automatic link (`Confirmed from code`). Admins currently pick colors/text manually or pass partial static props when opening `DesignCanvasEditor` from `AdminProduction.tsx`.
- **Target Workflow (`Phase 5`):** When opening `DesignCanvasEditor` inside a Client Project (`Artist` or `Brand`), the editor sidebar will display a **Client Identity Drawer**:
  - **For Brands:** One-click apply for `Primary`, `Secondary`, and `Accent` color swatches, workspace display/body typography hints, and direct drag/insert of the client's uploaded Logo (`workspace.brandProfile.logoUrl`) and Asset Vault photos.
  - **For Artists:** Artist stage name, release title/credits (`MusicRelease`), color mood, and approved press photo insertion.

---

## 5. Exports, Product Packaging & Real-Asset Verification

- **Supported Export Engine (`src/lib/productPackager.ts`, `src/lib/canvasShapeRenderer.ts`, `DesignCanvasEditor.tsx`):**
  - Interactive Canvas preview + standalone raster/vector export supporting `PNG`, `JPEG`, `SVG`, `PDF` (via `jsPDF`), and bundled multi-file `ZIP` archives (via `JSZip`), plus manual upload slots for `PSD` and `MP4` deliverables inside `AdminCreativeProducts.tsx` (`IMPLEMENTED — RUNTIME VERIFICATION PENDING`).
  - Phase 6/8.5 fixes added rectangle shape rendering (`canvasShapeRenderer.ts`) and Blob packaging (`productPackager.ts`).
- **Verification Requirement (`Testing Policy`):**
  - Saving a `CanvasDesign` JSON **must** be verified to persist complete editable layer geometry (`CanvasElement[]`), fonts, colors, and safe relative/Storage image URLs—never flattened-only screenshots or broken `blob:` URLs.
  - Exported deliverables and `CreativeProduct` packages **must** undergo browser/runtime verification (`Requires manual browser verification`) confirming that downloaded PNG/SVG/PDF/ZIP files open cleanly, render typography/images accurately, and match declared dimensions.
