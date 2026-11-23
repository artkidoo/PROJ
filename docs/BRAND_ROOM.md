# KeedoHub Brand Room Architecture

**Document Status:** Operational Audit & Isolation Specification  
**Primary Sources:** `src/components/admin/brand-room/BrandRoom.tsx`, `src/components/admin/brand-room/Collection001GallerySection.tsx`, `src/components/admin/brand-room/PortfolioShowcasesPanel.tsx`, `src/lib/brandRoomService.ts`, `src/lib/brandRoomStudio.ts`, `src/data/marketingCollection001.ts`, `src/types/brandRoom.ts`, `firestore.rules` (lines 877–910), `storage.rules` (lines 279–285).

---

## 1. Core Mandate: Strictly Internal to KeedoHub

**KeedoHub Brand Room is an internal-only marketing and brand operations studio created exclusively to market KeedoHub itself.**

- It is **NOT** the Client Brand Department.
- It must **NEVER** become a client Brand workspace or publish assets into the client `CreativeProduct` hub (`ClientCreativeHub`).
- It must **NEVER** be accessible to Artist or Brand client accounts (`Confirmed from code`: enforced by `isPlatformAdmin()` in `firestore.rules:877-910`, `storage.rules:279-285`, and `BrandRoom.tsx` mount verification).

---

## 2. Implemented Capabilities (`IMPLEMENTED — RUNTIME VERIFICATION PENDING`)

Located in `src/components/admin/brand-room/` (`BrandRoom.tsx` hosts 16 internal sub-sections backed by `brandRoomService.ts` & `brandRoomStudio.ts`):

| Subsystem | Components / Source | Dedicated Storage & Collections | Status (`Confirmed from code`) |
|---|---|---|---|
| **KeedoHub Brand Identity Vault** | `BrandIdentityPanel.tsx`, `brandRoomStudio.ts` | `/brandRoomIdentity/{doc}` (`#FF1E1E`, `#080808`, `#FFFFFF`, official KeedoHub logo `keedohub_brand_logo_*.jpg`) | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` |
| **Marketing Studio & Canvas Integration** | `MarketingStudioPanel.tsx`, `DesignCanvasEditor.tsx`, `BrandRoomCanvasPreview.tsx` | Launches `DesignCanvasEditor` for internal formats (`Instagram`, `Facebook`, `TikTok`, `LinkedIn`, `YouTube`, `X`, `Pinterest`, `Website & Email`, `Print & Offline`) | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` |
| **Collection 001 (Flagship Campaign Library)** | `Collection001GallerySection.tsx`, `src/data/marketingCollection001.ts` | 12 internal KeedoHub flagship designs (`01 — The Creative Universe` through `12 — The KeedoHub Statement`) editable via `DesignCanvasEditor` | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` |
| **Content Strategy, Pillars & Series** | `ContentStrategyPanel.tsx` | `/brandRoomPillars`, `/brandRoomSeries` | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` |
| **Internal Marketing Asset Library** | `MarketingAssetLibraryPanel.tsx` | `/brandRoomAssets` + Storage `/brand-room/**` | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` |
| **Marketing Calendar & Publishing Queue** | `ContentCalendarPublishingPanel.tsx` | Tracks internal marketing status (`Draft`, `Planned`, `Approved`, `Scheduled`, `Published`, `Archived`) | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` |
| **Analytics & Overview** | `MarketingOverviewPanel.tsx`, `MarketingAnalyticsPanel.tsx` | Aggregates real Firestore counts across internal `brandRoomAssets`, pillars, and status progression | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` |
| **Portfolio & Project Showcases** | `PortfolioShowcasesPanel.tsx` | Reads `clientProjects` (completed >=80%/Delivered), published `creativeProducts`, and `PORTFOLIO_ITEMS` | `IMPLEMENTED` *(Has Privacy Boundary Risk — see §3)* |

---

## 3. Critical Boundary Risks & Required Controls

### Risk A — Unconsented Client Work in `PortfolioShowcasesPanel.tsx` (`Confirmed from code`)
- **Finding:** `BrandRoom.tsx` (lines 226–240) & `PortfolioShowcasesPanel.tsx` (lines 31–107) automatically display **all** completed/delivered `clientProjects` (`status === 'Completed' || stage === 'Delivered' || progress >= 80`) with a `"Build Showcase Post"` button—without checking whether the client granted permission to feature their project in KeedoHub external marketing.
- **Required Target Control (`PLANNED` Phase 3/5):**
  1. Client work must **never** appear in KeedoHub public/marketing showcases without explicit client opt-in consent and an approved showcase record (e.g., `clientProjects.allowPublicShowcase === true` or dedicated `/showcaseApprovals/{id}` record).
  2. Remove legacy `LYRICAL ENT` sample items (`p1`, `p4` in `src/data/publicContent.ts`) and legacy `lyrical_ent_*` asset imports referenced in `brandRoomStudio.ts` lines 17–18 (`Confirmed from code`).

### Risk B — Canvas Template & Logo Cross-Contamination (`Confirmed from code`)
- In the refactored Phase 5 architecture, launching `DesignCanvasEditor` from Brand Room must pass `canvasMode: 'keedohub-brand-room'`, ensuring:
  - KeedoHub Brand Room assets export only to Storage `/brand-room/**`.
  - Brand Room designs never pollute `AdminDesignLibrary` client template pickers or `ClientCreativeHub`.
  - Brand Room stays in Section **7. KeedoHub Brand Room** of Admin HQ—never merged into **3. Brand Department**.
