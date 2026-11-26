import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { formatMoney, roundMoney } from './financeDocuments';
import type {
  BillingFrequency,
  CheckoutIntentType,
  CommercialCurrency,
  CreativeProduct,
  OneTimePurchaseRecord,
  PaymentGatewayRuntimeStatus,
  PaymentProviderId,
  PaymentProviderSettings,
  PaymentTransactionRecord,
  PlanAudience,
  SubscriptionPlan,
  SubscriptionRecord,
  SubscriptionStatus,
} from '../types';

export const ENTITLED_SUBSCRIPTION_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  'Active',
  'Trialing',
  'Grace Period',
]);

export function formatSubscriptionMoney(amount: number, currency: CommercialCurrency | string = 'NGN'): string {
  return formatMoney(amount, currency);
}

export function resolvePlanPriceForFrequency(
  plan: Pick<SubscriptionPlan, 'monthlyPrice' | 'annualPrice' | 'currency'>,
  frequency: BillingFrequency,
): { amount: number; currency: CommercialCurrency } {
  const currency = (plan.currency || 'NGN') as CommercialCurrency;
  const raw = frequency === 'Annual' ? plan.annualPrice : plan.monthlyPrice;
  return {
    amount: roundMoney(Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : 0),
    currency,
  };
}

export function resolveProductPurchaseTerms(
  product: Pick<CreativeProduct, 'isPurchasable' | 'purchasePrice' | 'purchaseCurrency' | 'priceUsd' | 'pricesByCurrency'>,
  preferredCurrency?: CommercialCurrency,
): { purchasable: boolean; amount: number; currency: CommercialCurrency } {
  if (product.isPurchasable !== true) {
    return { purchasable: false, amount: 0, currency: preferredCurrency || 'NGN' };
  }
  if (preferredCurrency && product.pricesByCurrency?.[preferredCurrency] && Number(product.pricesByCurrency[preferredCurrency]) > 0) {
    return {
      purchasable: true,
      amount: roundMoney(Number(product.pricesByCurrency[preferredCurrency])),
      currency: preferredCurrency,
    };
  }
  if (product.purchasePrice && Number(product.purchasePrice) > 0) {
    return {
      purchasable: true,
      amount: roundMoney(Number(product.purchasePrice)),
      currency: (product.purchaseCurrency || 'NGN') as CommercialCurrency,
    };
  }
  if (product.priceUsd && Number(product.priceUsd) > 0) {
    return {
      purchasable: true,
      amount: roundMoney(Number(product.priceUsd)),
      currency: 'USD',
    };
  }
  return { purchasable: false, amount: 0, currency: (product.purchaseCurrency || 'NGN') as CommercialCurrency };
}

export function planMatchesDepartment(
  planAudience: PlanAudience | string | undefined,
  department: 'Artist' | 'Brand',
): boolean {
  if (!planAudience) return false;
  if (planAudience === 'Shared' || planAudience === 'Both') return true;
  return planAudience === department;
}

export function isSubscriptionStatusEntitled(status?: string): boolean {
  return Boolean(status && ENTITLED_SUBSCRIPTION_STATUSES.has(status as SubscriptionStatus));
}

export interface CurrencyRecurringRevenueBreakdown {
  currency: CommercialCurrency;
  mrr: number;
  arr: number;
  activeSubscribers: number;
  cashCollected: number;
  refundedTotal: number;
  oneTimeCash: number;
  subscriptionCash: number;
}

export interface SubscriptionAnalyticsSummary {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueOrGraceCount: number;
  cancelledOrExpiredCount: number;
  suspendedCount: number;
  artistSubscribers: number;
  brandSubscribers: number;
  totalTransactions: number;
  succeededTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  paymentSuccessRate: number;
  churnRate: number;
  byCurrency: CurrencyRecurringRevenueBreakdown[];
  topPlans: Array<{
    planId: string;
    planName: string;
    activeCount: number;
    currency: CommercialCurrency;
    mrr: number;
  }>;
  topOneTimeItems: Array<{
    itemId: string;
    itemTitle: string;
    purchaseCount: number;
    currency: CommercialCurrency;
    totalRevenue: number;
  }>;
}

/**
 * Strictly separates active recurring revenue (MRR/ARR normalized from recurring active subscriptions)
 * from historical collected cash transactions.
 */
export function computeSubscriptionAnalytics(params: {
  subscriptions: SubscriptionRecord[];
  transactions: PaymentTransactionRecord[];
  purchases?: OneTimePurchaseRecord[];
}): SubscriptionAnalyticsSummary {
  const { subscriptions, transactions, purchases = [] } = params;
  const byCurrencyMap = new Map<CommercialCurrency, CurrencyRecurringRevenueBreakdown>();

  const ensureCur = (cur: CommercialCurrency): CurrencyRecurringRevenueBreakdown => {
    const existing = byCurrencyMap.get(cur);
    if (existing) return existing;
    const created: CurrencyRecurringRevenueBreakdown = {
      currency: cur,
      mrr: 0,
      arr: 0,
      activeSubscribers: 0,
      cashCollected: 0,
      refundedTotal: 0,
      oneTimeCash: 0,
      subscriptionCash: 0,
    };
    byCurrencyMap.set(cur, created);
    return created;
  };

  let activeSubscriptions = 0;
  let trialingSubscriptions = 0;
  let pastDueOrGraceCount = 0;
  let cancelledOrExpiredCount = 0;
  let suspendedCount = 0;
  let artistSubscribers = 0;
  let brandSubscribers = 0;

  const planRollup = new Map<string, { planId: string; planName: string; activeCount: number; currency: CommercialCurrency; mrr: number }>();

  for (const sub of subscriptions) {
    if (sub.status === 'Active' || sub.status === 'Trialing' || sub.status === 'Grace Period') {
      if (sub.status === 'Trialing') trialingSubscriptions += 1;
      if (sub.status === 'Grace Period') pastDueOrGraceCount += 1;
      activeSubscriptions += 1;

      if (sub.department === 'Artist') artistSubscribers += 1;
      else brandSubscribers += 1;

      // Only monetized active/grace subscriptions contribute to MRR (trials at $0 or unpaid until billed only count when active/paid)
      if (sub.status === 'Active' || sub.status === 'Grace Period') {
        const cur = (sub.currency || 'NGN') as CommercialCurrency;
        const bucket = ensureCur(cur);
        const monthlyEquivalent =
          sub.billingFrequency === 'Annual'
            ? roundMoney((sub.recurringAmount || 0) / 12)
            : roundMoney(sub.recurringAmount || 0);
        bucket.mrr = roundMoney(bucket.mrr + monthlyEquivalent);
        bucket.arr = roundMoney(bucket.mrr * 12);
        bucket.activeSubscribers += 1;

        const existingPlan = planRollup.get(sub.planId) || {
          planId: sub.planId,
          planName: sub.planName,
          activeCount: 0,
          currency: cur,
          mrr: 0,
        };
        existingPlan.activeCount += 1;
        existingPlan.mrr = roundMoney(existingPlan.mrr + monthlyEquivalent);
        planRollup.set(sub.planId, existingPlan);
      }
    } else if (sub.status === 'Past Due') {
      pastDueOrGraceCount += 1;
    } else if (sub.status === 'Suspended') {
      suspendedCount += 1;
    } else if (sub.status === 'Cancelled' || sub.status === 'Expired') {
      cancelledOrExpiredCount += 1;
    }
  }

  let succeededTransactions = 0;
  let failedTransactions = 0;
  let refundedTransactions = 0;

  for (const tx of transactions) {
    const cur = (tx.currency || 'NGN') as CommercialCurrency;
    const bucket = ensureCur(cur);
    if (tx.status === 'Succeeded' || tx.status === 'Partially Refunded' || tx.status === 'Refunded') {
      succeededTransactions += 1;
      const netAmount = roundMoney(Math.max(0, (tx.amount || 0) - (tx.refundedAmount || 0)));
      bucket.cashCollected = roundMoney(bucket.cashCollected + netAmount);
      bucket.refundedTotal = roundMoney(bucket.refundedTotal + (tx.refundedAmount || 0));
      if (tx.intentType === 'subscription' || tx.intentType === 'plan_change') {
        bucket.subscriptionCash = roundMoney(bucket.subscriptionCash + netAmount);
      } else {
        bucket.oneTimeCash = roundMoney(bucket.oneTimeCash + netAmount);
      }
    }
    if (tx.status === 'Failed') {
      failedTransactions += 1;
    }
    if (tx.status === 'Refunded' || tx.status === 'Partially Refunded') {
      refundedTransactions += 1;
    }
  }

  const itemRollup = new Map<string, { itemId: string; itemTitle: string; purchaseCount: number; currency: CommercialCurrency; totalRevenue: number }>();
  for (const purchase of purchases) {
    if (purchase.status !== 'Active') continue;
    const cur = (purchase.currency || 'NGN') as CommercialCurrency;
    const entry = itemRollup.get(purchase.itemId) || {
      itemId: purchase.itemId,
      itemTitle: purchase.itemTitle,
      purchaseCount: 0,
      currency: cur,
      totalRevenue: 0,
    };
    entry.purchaseCount += 1;
    entry.totalRevenue = roundMoney(entry.totalRevenue + (purchase.amount || 0));
    itemRollup.set(purchase.itemId, entry);
  }

  const attemptCount = succeededTransactions + failedTransactions;
  const paymentSuccessRate = attemptCount > 0 ? Math.round((succeededTransactions / attemptCount) * 100) : 100;
  const cohortDenom = activeSubscriptions + cancelledOrExpiredCount + suspendedCount;
  const churnRate = cohortDenom > 0 ? Math.round(((cancelledOrExpiredCount + suspendedCount) / cohortDenom) * 100) : 0;

  return {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions,
    trialingSubscriptions,
    pastDueOrGraceCount,
    cancelledOrExpiredCount,
    suspendedCount,
    artistSubscribers,
    brandSubscribers,
    totalTransactions: transactions.length,
    succeededTransactions,
    failedTransactions,
    refundedTransactions,
    paymentSuccessRate,
    churnRate,
    byCurrency: Array.from(byCurrencyMap.values()),
    topPlans: Array.from(planRollup.values()).sort((a, b) => b.mrr - a.mrr).slice(0, 6),
    topOneTimeItems: Array.from(itemRollup.values()).sort((a, b) => b.purchaseCount - a.purchaseCount).slice(0, 6),
  };
}

// =========================================================================
// Cloud Function Callables
// =========================================================================

export async function fetchPaymentSystemConfig(): Promise<PaymentGatewayRuntimeStatus> {
  const fn = httpsCallable<Record<string, never>, PaymentGatewayRuntimeStatus>(functions, 'getPaymentSystemConfig');
  const res = await fn({});
  return res.data;
}

export interface InitializeCheckoutPayload {
  workspaceId: string;
  intentType: CheckoutIntentType;
  provider?: PaymentProviderId;
  planId?: string;
  billingFrequency?: BillingFrequency;
  productId?: string;
  packageId?: string;
  invoiceId?: string;
  callbackUrl?: string;
}

export interface InitializeCheckoutResult {
  success: boolean;
  transactionId: string;
  reference: string;
  provider: PaymentProviderId;
  providerConfigured: boolean;
  authorizationUrl?: string;
  amount: number;
  currency: CommercialCurrency;
  description: string;
  invoiceId: string;
  message?: string;
}

export async function initializeCheckoutSession(
  payload: InitializeCheckoutPayload,
): Promise<InitializeCheckoutResult> {
  const fn = httpsCallable<InitializeCheckoutPayload, InitializeCheckoutResult>(
    functions,
    'initializeCheckoutPayment',
  );
  const res = await fn(payload);
  return res.data;
}

export interface VerifyPaymentResult {
  success: boolean;
  verified: boolean;
  status: string;
  transactionId: string;
  reference: string;
  receiptNumber?: string;
  invoiceId?: string;
  subscriptionId?: string;
  purchaseId?: string;
  message: string;
}

export async function verifyCheckoutTransaction(payload: {
  reference: string;
  provider?: PaymentProviderId;
  providerTransactionId?: string;
}): Promise<VerifyPaymentResult> {
  const fn = httpsCallable<typeof payload, VerifyPaymentResult>(functions, 'verifyPaymentTransaction');
  const res = await fn(payload);
  return res.data;
}

export async function cancelWorkspaceSubscriptionAction(payload: {
  workspaceId: string;
  subscriptionId: string;
  mode: 'immediate' | 'period_end';
  reason?: string;
}): Promise<{ success: boolean; status: SubscriptionStatus; message: string }> {
  const fn = httpsCallable<typeof payload, { success: boolean; status: SubscriptionStatus; message: string }>(
    functions,
    'cancelWorkspaceSubscription',
  );
  const res = await fn(payload);
  return res.data;
}

export async function changeWorkspaceSubscriptionPlanAction(payload: {
  workspaceId: string;
  subscriptionId: string;
  targetPlanId: string;
  billingFrequency: BillingFrequency;
  provider?: PaymentProviderId;
  callbackUrl?: string;
}): Promise<{
  success: boolean;
  requiresPayment: boolean;
  checkout?: InitializeCheckoutResult;
  message: string;
}> {
  const fn = httpsCallable<
    typeof payload,
    { success: boolean; requiresPayment: boolean; checkout?: InitializeCheckoutResult; message: string }
  >(functions, 'changeWorkspaceSubscriptionPlan');
  const res = await fn(payload);
  return res.data;
}

export async function adminSaveSubscriptionPlanAction(
  payload: Partial<SubscriptionPlan> & { name: string },
): Promise<{ success: boolean; planId: string; message: string }> {
  const fn = httpsCallable<typeof payload, { success: boolean; planId: string; message: string }>(
    functions,
    'adminSaveSubscriptionPlan',
  );
  const res = await fn(payload);
  return res.data;
}

export async function adminSetSubscriptionPlanStatusAction(payload: {
  planId: string;
  status: SubscriptionPlan['status'];
}): Promise<{ success: boolean; message: string }> {
  const fn = httpsCallable<typeof payload, { success: boolean; message: string }>(
    functions,
    'adminSetSubscriptionPlanStatus',
  );
  const res = await fn(payload);
  return res.data;
}

export async function adminUpdatePaymentSettingsAction(
  payload: Partial<PaymentProviderSettings>,
): Promise<{ success: boolean; message: string }> {
  const fn = httpsCallable<typeof payload, { success: boolean; message: string }>(
    functions,
    'adminUpdatePaymentSettings',
  );
  const res = await fn(payload);
  return res.data;
}

export async function adminManageSubscriptionAction(payload: {
  subscriptionId?: string;
  workspaceId: string;
  action: 'grant' | 'suspend' | 'reactivate' | 'cancel_immediate' | 'sync_entitlements' | 'retry_renewal';
  planId?: string;
  billingFrequency?: BillingFrequency;
  note?: string;
}): Promise<{ success: boolean; subscriptionId?: string; status?: string; message: string }> {
  const fn = httpsCallable<
    typeof payload,
    { success: boolean; subscriptionId?: string; status?: string; message: string }
  >(functions, 'adminManageSubscription');
  const res = await fn(payload);
  return res.data;
}

export async function adminProcessRefundAction(payload: {
  transactionId: string;
  amount?: number;
  reason: string;
  revokeEntitlement?: boolean;
}): Promise<{ success: boolean; status: string; refundedAmount: number; message: string }> {
  const fn = httpsCallable<
    typeof payload,
    { success: boolean; status: string; refundedAmount: number; message: string }
  >(functions, 'adminProcessRefund');
  const res = await fn(payload);
  return res.data;
}
