# KeedoHub Testing & Release Policy

**Document Status:** Engineering Verification & Deployment Standard  
**Primary Sources:** `package.json`, `QA_SETUP.md`, `ADMIN_SETUP.md`, `tests/*` (12 suites), `src/tests/security.test.ts`, `firebase.json`.

---

## 1. Eight Tiers of Verification (What Each Proves — and What It Does NOT)

KeedoHub strictly distinguishes between build/static signals and live runtime proof. **Never claim a feature "works in production" based solely on a lower verification tier.**

| Tier | Command / Method | What It Proves (`Confirmed from code`) | What It Does **NOT** Prove |
|---|---|---|---|
| **1. Static Code Inspection** | Repository review (`grep`, AST/import checks, rules audit) | File existence, dead imports, hardcoded legacy strings, logical rule flaws (e.g. `firestore.rules:402`). | Type safety, runtime execution, UI layout, or live Firebase security enforcement. |
| **2. Unit Tests** | TSX / Mocha / Chai unit scripts (`tests/*.unit.test.ts`, `src/tests/security.test.ts`) | Pure helper logic (access matching, category normalization, Brand Room builders, packager helpers). | Firebase Auth integration, real Firestore/Storage rule evaluation, or React DOM rendering. |
| **3. TypeScript Checks** | `npm run lint` (`tsc --noEmit`) | Type signatures, missing imports, union exhaustiveness across TypeScript files. | Runtime `undefined` crashes, CSS/layout defects, or Firebase rule mismatches. |
| **4. Production Build** | `npm run build` (`vite build`) | Vite bundling succeeds cleanly with zero syntax or module resolution errors. | **Does NOT prove** any workflow works, Cloud Functions compile, or security rules pass. |
| **5. Firebase Emulator Tests** | `npm run test` or `npm run emulators:start` + `npm run test:firebase` (`QA_SETUP.md`) | Real local Firestore Rules, Storage Rules, and Cloud Functions execution against `demo-keedohub` emulator ports (`9099`, `8080`, `5001`, `9199`). | Real browser interaction, Stripe/Paystack live webhook delivery, or production data integrity on the live named DB. |
| **6. Browser / Manual Verification** | Local dev server (`npm run dev` on port `3000`) or staging preview walkthrough | Actual rendered UI, file uploads, PDF/PNG/SVG/ZIP exports opening cleanly, mobile/desktop responsiveness, zero console errors. | Multi-tenant load behavior or live deployed production security rules if tested against mock/local config. |
| **7. Live Firebase Verification** | Read-only inspection / smoke verification against staging or `alpine-scion-kds98` | Deployed indexes built, Auth authorized domains active, live `admins/{uid}` / `clientProfiles` records match code assumptions, named DB parity. | Requires explicit owner authorization before running checks or backfills. |
| **8. Production Deployment** | Explicit owner-approved `firebase deploy` / hosting release | End-user production release on live Firebase project & named database. | Ongoing regression safety without repeating Tiers 2–6 per release. |

---

## 2. Existing Test Suite Map (`Confirmed from code`)

All test files verified in `tests/` and `src/tests/` (`package.json` & `QA_SETUP.md`):

| Test File | NPM Script / Runner | Scope Covered |
|---|---|---|
| `tests/firestore.rules.test.ts` | `npm run test:firestore-rules` | Core Firestore RBAC, admin vs client isolation, workspace rules, suspended users, service catalog, audit logs. |
| `tests/firestore.phase3c.rules.test.ts` | `npm run test:firestore-phase3c` | Phase 3C production deliverables, internal notes, revision requests rules. |
| `tests/storage.rules.test.ts` | `npm run test:storage-rules` | Storage path isolation, published deliverables, Artist/Brand/Shared asset rules, MIME validation. |
| `tests/functions.test.ts` | `npm run test:functions` | Cloud Functions callable authorization, validation, admin role changes, service packages, production reviews. |
| `tests/admin-auth.unit.test.ts` | `tsx` unit runner | Admin record status normalization & Auth validation helpers. |
| `tests/brand-room.unit.test.ts` | `tsx` unit runner | Brand Room Collection 001 studio builders, formats & service helpers. |
| `tests/client-os.unit.test.ts` | `tsx` unit runner | Client OS navigation resolution, request category scoping & prefill builders. |
| `tests/phase6-products.unit.test.ts` | `tsx` unit runner | Phase 6 Creative Products & `productPackager` export/packaging behavior. |
| `tests/phase7-catalog.unit.test.ts` | `tsx` unit runner | Phase 7 catalog seeds & studio metadata consistency. |
| `tests/phase8-security.unit.test.ts` | `tsx` unit runner | Phase 8 Creative Product access/security unit assertions. |
| `tests/phase8-5-remediation.unit.test.ts` | `tsx` unit runner | Phase 8.5 strict `IncludedInPackage` entitlement matching (rejecting empty/malformed packages). |
| `test-pilot-security.ts` & `src/tests/security.test.ts` | `npm run test:security` / TSX | Security helper unit checks (review for consolidation during Phase 0). |

*(Note: During this documentation-only phase, test execution and builds were intentionally withheld; emulator pass state requires running `npm run test:firebase` against Java + Firebase Emulators as outlined in `QA_SETUP.md`.)*

---

## 3. Release & Deployment Governance Policy

1. **No Autonomous Production Deployments:**
   - Agents and contributors must **never** run `firebase deploy` (Rules, Storage, Functions, Indexes, or Hosting) or mutate live production records in `alpine-scion-kds98` / named DB `ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38` without **explicit project owner approval**.
2. **Release Pre-Flight Checklist (Mandatory Before Any Phase Cutover):**
   - `npm run lint` passes with zero errors.
   - `npm run build` succeeds cleanly.
   - Functions TypeScript build (`functions/`) compiles cleanly when backend files change.
   - `npm run test:firebase` (with local emulators running) + all relevant `tests/*.unit.test.ts` files pass **after the final edit**.
   - Manual browser checklist passed (`Requires manual browser verification`), including downloading real generated PDFs/PNGs/SVGs/ZIPs when Canvas or Documents are modified.
   - Database backfill scripts dry-run on emulator + rollback snapshot taken prior to any live schema migration.
3. **Documentation-Before-Code Gate:**
   - Every architectural change begins with reviewing/updating the corresponding specification in `docs/` prior to authorizing implementation.
