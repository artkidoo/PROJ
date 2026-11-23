# KeedoHub Artist Workspace Architecture

**Document Status:** Product Specification & Audit Baseline  
**Primary Sources:** `src/components/client/ClientWorkspace.tsx`, `src/components/client/ClientStudio.tsx`, `src/components/client/ClientCreativeHub.tsx`, `src/lib/clientOS.ts`, `src/data/creativeCatalogSeeds.ts`, `src/components/modules/ArtistManagement.tsx`, `src/components/modules/MusicReleaseManagement.tsx`, `src/components/modules/PressMedia.tsx`, `src/components/modules/DocumentTemplates.tsx`, `src/components/modules/MusicPromotionStudio.tsx`.

---

## 1. Purpose of the Artist Experience

The Artist Workspace (`Artist OS`) equips recording artists, vocalists, producers, and performers with a dedicated environment inside the shared `ClientWorkspace` shell to manage their public artist identity, upcoming music releases, creative requests, studio deliverables, press kits, rights/production documents, and streaming-ready Creative Hub packs.

---

## 2. Workspace Modules: Current vs. Proposed Architecture

| Module | Current Status | Code Reality (`Confirmed from code`) | Target Artist Experience (`PLANNED`) |
|---|---|---|---|
| **Artist Dashboard (Overview)** | `PARTIALLY IMPLEMENTED` | `ClientWorkspace.tsx` provides shared summary cards, recent projects, deliverables, and updates. | Artist-tailored KPIs: next release countdown, pending cover/visualizer reviews, release readiness score, quick-launch release request. |
| **Artist Identity & Profile** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientStudio.tsx` (`tab === 'artist-profile'`) persists `biography`, `genre`, `profileImageUrl/Path`, `instagram`, `spotify`, `appleMusic`, `youtube`, `website` on `workspaces/{id}.artistProfile`. | Expanded during initial onboarding + enriched with Press Quote, EPK highlights, management contact, and visual aesthetic notes. |
| **Artist EPK (Electronic Press Kit)** | `PARTIALLY IMPLEMENTED` / `LEGACY / DISCONNECTED` | Legacy `PressMedia.tsx` (668 lines, `localStorage`) has structured press release & EPK drafting. Live `ClientStudio` stores bio/links/photos separately without one-click **EPK PDF** generation (`Not implemented`). | Live one-click **Export Artist EPK PDF** combining `artistProfile`, high-res press photos (`brandAssets`), discography (`releases`), and streaming metrics/links. |
| **Music & Releases** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientStudio.tsx` (`tab === 'releases'`) manages `workspaces/{id}/releases` (Single/EP/Album, release date, tracklist, featured artists, producer, songwriters, rights info, ISRC/UPC, artwork/streaming/pre-save URLs) + `buildReleaseProductionPrefill()`. | Link seamlessly with Admin Artist Department production stages, cover artwork approvals, and streaming delivery packs. |
| **Release Readiness** | `LEGACY / DISCONNECTED` | `MusicReleaseManagement.tsx` (1,361 lines, `localStorage`) contains the 7-point `ReleaseChecklist` (`audioMastered`, `artworkApproved`, `splitSheetSigned`, `metadataVerified`, `distributionSubmitted`, `pressKitReady`, `marketingAssetsReady`) + audio/artwork technical spec inspectors. Not wired in live `ClientStudio.tsx`. | Port `ReleaseChecklist` & audio/cover technical spec validation directly into Firestore `ClientStudio` (`releases` tab) without `localStorage`. |
| **Creative Hub (Artist)** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientCreativeHub.tsx` filters `creativeProducts` where `audience in ['Artist', 'Shared']`, enforces Phase 8.5 package entitlement rules, supports multi-format downloads (`PNG`, `JPG`, `SVG`, `PDF`, `PSD`, `ZIP`), and renders `ARTIST_CREATIVE_SERVICES`. | Curated strictly around `Artist Packs` and `Shared Utilities`; package purchase/subscription upgrade CTA (`Phase 6`). |
| **Creative Requests** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientWorkspace` uses `getRequestCategoriesForExperience(true)` excluding `'Business Cards'` & `'Brand Identity'`, supporting dynamic prefill from releases & Creative Hub products. | Preserve category scoping; enrich brief forms with DSP dimensions, release date locking, and audio reference uploads. |
| **Active Projects & Deliverables** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | Real-time Firestore tracking of `clientProjects`, client-visible `productionTasks`, versioned `deliverables`, approve/revision actions. | Clear artist-friendly stage indicators (`Brief Approved` → `Client Review` → `Delivered`). |
| **Content & Release Materials** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientStudio.tsx` (`tab === 'content'`) stores rollout captions, lyrics, promotional copy, creative ideas in `workspaces/{id}/contentDrafts`. | Group materials by linked release (`Pre-Release`, `Release Day`, `Post-Release`) alongside track lyrics and press quotes. |
| **Asset Vault** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientStudio.tsx` (`tab === 'assets'`) manages `workspaces/{id}/brandAssets` (client uploads + studio-approved finals, isolated from internal files). | Separate approved Master Artwork, Stems/Audio References, Press Photography, and Motion Visualizers cleanly. |
| **Artist Documents** | `LEGACY / DISCONNECTED` | `ClientStudio.tsx` contains document UI for `workspaces/{id}/documents`, **but `clientOS.ts` omits `documents`/`invoices`/`proposals` from Artist OS nav**. Meanwhile, `DocumentTemplates.tsx` (355 lines, `localStorage`) holds 6 music legal/production templates stamped `LYRICAL ENT LLC`. | Expose **Artist Documents** in `Artist OS` nav with re-branded Firestore generators for Split Sheets, Producer Memos, Master Authorizations, Video Releases, EPKs, Briefs & Album Budgets ([DOCUMENTS_AND_FINANCE.md](DOCUMENTS_AND_FINANCE.md)). |
| **Billing & Entitlements** | `PARTIALLY IMPLEMENTED` / `PLANNED` | Workspaces store `contractedPackageIds` & `packageEntitlements`, surfaced passively in Creative Hub. Artist nav lacks Billing/Invoices view (`ClientStudio.tsx` `renderInvoices` is only linked from Brand nav). | Dedicated Billing & Entitlements view showing active Artist retainers/packages, invoices, payment history, and online checkout (`Phase 6`). |
| **Account Settings** | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | `ClientWorkspace.tsx` Account tab allows editing display name & avatar (`validatePersonalAccountUpdate`). | Keep unified Account tab across both workspaces. |

---

## 3. Legacy Music & Artist Features to Preserve & Port

During `LYRICAL ENT` cleanup, **do not delete** the domain logic inside these legacy modules before porting them into live Firestore services:

1. **`ArtistManagement.tsx` (463 lines — `LEGACY / DISCONNECTED`):** Artist profile depth (moniker, legal name, career goals, bio structure) → enrich `artistProfile` & onboarding.
2. **`MusicReleaseManagement.tsx` (1,361 lines — `LEGACY / DISCONNECTED`):** 7-point `ReleaseChecklist` and audio/artwork format metadata checks (`sampleRate`, `bitDepth`, `3000×3000` cover DPI/colorSpace inspection) → integrate into `ClientStudio` (`releases`) and Admin Artist Dept.
3. **`PressMedia.tsx` (668 lines — `LEGACY / DISCONNECTED`):** Press release drafting structure & media kit metadata → integrate into Artist EPK & Artist Documents.
4. **`DocumentTemplates.tsx` (355 lines — `LEGACY / DISCONNECTED`):** Six music-industry templates currently hardcoded to `LYRICAL ENT LLC`:
   - Split Sheet Agreement
   - Producer Fee & Royalty Memo
   - Master Recording Authorization
   - Music Video Release Form
   - Artist Onboarding & Production Brief
   - Album Production Budget Sheet
   *(Must be parameterized with KeedoHub / client artist data and persisted to Firestore before deleting `DocumentTemplates.tsx`.)*
5. **Non-portable / Superseded Legacy Modules:** `MusicPromotionStudio.tsx` (`localStorage` + client-accessible Canvas) must **not** expose `DesignCanvasEditor` to clients; its campaign promo template presets belong in the **Admin-only Artist Master Templates** catalogue.

---

## 4. Artist Creative Production Catalogue (Capability Matrix)

| Catalogue Item | Current Status | Code Evidence / Gap Notes |
|---|---|---|
| Single & album artwork (`3000×3000` masters) | `PARTIALLY IMPLEMENTED` | Request category (`Music Cover Artwork`), Creative Hub pack seeds (`creativeCatalogSeeds.ts`), and custom Canvas masters exist (`Requires runtime verification`). |
| Alternative cover artwork & tracklist graphics | `PARTIALLY IMPLEMENTED` | Can be produced via Admin `DesignCanvasEditor` (`AdminDesignLibrary` / `AdminProduction`); needs explicit Artist Dept template presets (`PLANNED`). |
| Lyric cards, posters & lyric quote graphics | `PARTIALLY IMPLEMENTED` | Lyrics stored in `ClientStudio` (`content`), visual masters depend on Admin template library (`PLANNED` dedicated Artist packs). |
| Pre-release artwork, pre-save & countdown graphics | `PARTIALLY IMPLEMENTED` | Pre-save URL supported in `MusicRelease`; visual pack seeds exist in `creativeCatalogSeeds.ts` (`prod-spotify-release-visual-pack`, `Requires runtime verification`). |
| Release-day & post-release graphics | `PARTIALLY IMPLEMENTED` | Content phases (`Pre-release`, `Release day`, `Post-release`) exist in `ClientStudio`; dedicated Artist production deliverables handled via Admin projects. |
| Streaming platform packs (Spotify, Apple Music, etc.) | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | Seeded in `creativeCatalogSeeds.ts` (8 streaming packs) & `clientOS.ts` (`ARTIST_CREATIVE_SERVICES`); packaged via `productPackager.ts`. |
| Streaming banners | `IMPLEMENTED — RUNTIME VERIFICATION PENDING` | Dimension specs defined in Spotify/Apple Music packs (`2660×1140`, etc.). |
| Spotify Canvas & motion visualizers (`9:16`) | `PARTIALLY IMPLEMENTED` | Listed in `ARTIST_CREATIVE_SERVICES` & request categories (`Motion Graphics`, `2D Animation`). Video upload/delivery (`MP4`) works via Storage; **browser-based Canvas animation rendering is `Not implemented`** (`MotionStudio.tsx` is a 26-line stub). |
| Music promotional materials & tour/event posters | `PARTIALLY IMPLEMENTED` | Covered by `Flyers & Posters` / `Artist Promotional Graphics` categories and `creativeTemplatesData.ts` (`Music Promotion`, `Event Promotion`). |
| Artist branding (monogram, visual world) | `PARTIALLY IMPLEMENTED` | Requestable via `svc-artist-branding`; full artist token binding into Admin Canvas is `PLANNED`. |
| EPK designs, artist biographies, one-sheets | `PARTIALLY IMPLEMENTED` | Biography stored in `ClientStudio`; structured EPK PDF export & one-sheet generator are `PLANNED` (to port from `PressMedia.tsx`). |
| Press releases | `LEGACY / DISCONNECTED` | Exists in legacy `PressMedia.tsx` (`localStorage`); migration to Firestore `ClientStudio` is `PLANNED`. |
| Merchandise artwork | `PLANNED` | Mentioned in `ARTIST_CREATIVE_SERVICES` copy (`"Merch & Vinyl Packaging"`); no dedicated merch template catalog or mockup exporter exists yet (`Not implemented`). |
| Music video promotional assets | `PARTIALLY IMPLEMENTED` | `Music Video` release type and request flows exist; `Music Video Release Form` lives in legacy `DocumentTemplates.tsx` pending Firestore migration. |
