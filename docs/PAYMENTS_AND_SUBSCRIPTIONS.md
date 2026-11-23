# KeedoHub Payments & Subscriptions Architecture

**Document Status:** Gap Analysis & Phase 6 Target Specification  
**Primary Sources:** `package.json`, `functions/package.json`, `functions/src/index.ts`, `src/components/admin/AdminInvoicesManagement.tsx`, `src/components/admin/ServicesPackagesManagement.tsx`, `src/components/admin/WorkspacesManagement.tsx`, `src/components/client/ClientStudio.tsx`, `src/lib/creativeProductAccess.ts`, `firestore.rules`, `storage.rules`.

---

## 1. Honest Current Implementation Status (`Confirmed from code`)

**Complete online payment processing and subscription billing are `Not implemented` (`PLANNED` — Phase 6).**

| Capability | Current Status | Code Reality (`Confirmed from code`) |
|---|---|---|
| **Payment Gateway SDKs** | `Not implemented` | Zero gateway packages (`paystack`, `stripe`, `flutterwave`, `paypal`) appear in `/package.json` or `/functions/package.json`. |
| **Online Payment Checkout (Invoices, Packs, Custom Projects)** | `Not implemented` | `ClientStudio.tsx` `renderInvoices()` provides PDF download and read-only line items/payments—no "Pay Now" or checkout trigger. `PricingPage.tsx` routes users to `/contact` or `/register`. |
| **Manual Payment Records** | `LEGACY / DISCONNECTED` | `AdminInvoicesManagement.tsx` has UI to log manual `PaymentRecord` entries (`Wire Transfer \| ACH \| Credit Card \| Check \| Crypto \| Other`), **but saves only to browser `localStorage`** (`AppContext.tsx`). |
| **Webhook Endpoints** | `Not implemented` | `functions/src/index.ts` exports 0 HTTP `onRequest` payment webhooks. |
| **Package Entitlement Model** | `PARTIALLY IMPLEMENTED` (Inconsistent) | `firestore.rules:772-784` & `storage.rules:152-187` check `workspace.contractedPackageIds` (capped at indices `[0..4]`) against active `/services/{pkgId}` documents. Meanwhile, `src/lib/creativeProductAccess.ts:166-267` supports `workspace.packageEntitlements` (`status`, `expiresAt`), **which backend rules currently ignore** (`Confirmed from code`). |
| **Subscription Renewals & Expiry Revocation** | `Not implemented` | No automated billing cycle or expiry Cloud Function revokes `contractedPackageIds` or updates `packageEntitlements.status` when a subscription lapses. Package assignment is 100% manual (`adminUpdateWorkspace`). |

---

## 2. Target Commerce Scope (`PLANNED` — Phase 6)

KeedoHub's future payment system must unify all revenue streams across **Artist** and **Brand** clients inside Firestore `/invoices`, `/subscriptions`, and `/transactions`:

1. **One-Time Creative Products:** Direct checkout for paid Creative Hub packs (instant webhook unlock → assigns entitlement or unlocks download access).
2. **Custom Creative Projects:** Deposit + milestone/balance invoices converted from approved Proposals (`AdminProposalsManagement`) or project scopes.
3. **Standalone & Retainer Invoices:** Ad-hoc Admin-issued commercial invoices payable online or via verified bank transfer.
4. **Manual Payment Recording (Firestore):** Admin records verified offline transfers/wires/checks inside `6. Finance`, attaching bank reference numbers and issuing official KeedoHub Receipts.
5. **Recurring Subscriptions / Retainers:** Monthly/recurring `ServicePackage` plans (`billingType: 'Monthly Retainer' | 'One-Time' | 'Per-Release'`) provisioning time-bound `packageEntitlements` + `contractedPackageIds`.
6. **Payment Receipts & Transaction History:** Immutable receipt records and client-visible payment history ledger.

---

## 3. Payment Gateway Evaluation Plan (Paystack Candidate)

- **Paystack** is the primary practical candidate to evaluate for Nigerian and cross-border African operations (supporting NGN cards, bank transfers, USSD, NQR, and USD international cards where enabled on merchant account).
- **Comparative Evaluation Gate (Deferred Until Phase 6 Kickoff):** Before installing SDKs, compare **Paystack** vs. international fallback providers (e.g., **Stripe** or multi-currency provider) across:
  - Supported settlement currencies (NGN, USD, GBP/EUR) and merchant entity eligibility.
  - Recurring subscription tokenization / Plan APIs vs. webhook-driven invoice billing.
  - Platform fee structure, payout latency, and dispute/refund webhook fidelity.
- **Action Constraint:** Do **not** install Paystack/Stripe SDKs or configure secrets prior to Phase 6.

---

## 4. Non-Negotiable Security & Architectural Invariants

When implementing Phase 6, all payment and entitlement paths must enforce these rules:

1. **Server-Authoritative Payment Confirmation Only:**
   - **Clients must NEVER mark their own invoice as paid** or mutate `totalPaid`, `status: 'Paid'`, `payments[]`, `contractedPackageIds`, or `packageEntitlements`.
   - `firestore.rules` must deny all client writes to `/invoices`, `/transactions`, `/subscriptions`, `/paymentWebhookEvents`, and workspace entitlement fields.
2. **Signed Webhook Verification (`onRequest` Cloud Function):**
   - Verify HMAC signature on the raw request body (`x-paystack-signature` SHA-512 or `Stripe-Signature`) using secrets stored in Firebase Functions Secrets Manager (never committed to repo or `VITE_*` client vars).
   - Optionally re-verify transaction status against the gateway's `Verify Transaction` API before committing fulfillment.
3. **Strict Idempotency Ledger (`/paymentWebhookEvents/{providerEventId}`):**
   - Process every webhook inside a Firestore transaction checking `/paymentWebhookEvents/{eventId}`. Duplicate webhook deliveries must return `200 OK` without double-recording payments or double-extending subscription periods.
4. **Automatic Entitlement Provisioning & Expiry Enforcement:**
   - Upon confirmed payment webhook (`charge.success` / `invoice.paid`):
     - Atomically mark invoice `Paid` (or `Partially Paid`), append verified `PaymentRecord`, generate official `Receipt`, and notify client + Admin Finance.
     - For package/subscription payments: write/extend `/subscriptions/{subId}`, update `workspace.packageEntitlements` (`status: 'Active'`, `expiresAt`), and sync `workspace.contractedPackageIds`.
   - Scheduled expiry sweep (`pubsub.schedule`) + **updated `firestore.rules` / `storage.rules`** verifying expiry timestamps (`expiresAt > request.time`) so lapsed subscriptions lose gated `IncludedInPackage` access automatically without waiting for manual Admin cleanup.
5. **Dual Client Visibility:** Expose unified Billing, Active Package Entitlements, Payment History, and Receipts inside **both** Artist Dashboard and Brand Dashboard (`ClientWorkspace`).
