import * as crypto from 'node:crypto';
import {
  ALLOWED_CURRENCIES,
  AllowedCurrency,
  cleanText,
  computeMonetarySummary,
  FinanceValidationError,
  roundCurrency,
  validateCurrency,
} from './financeValidation';

export type PaymentProviderId = 'paystack' | 'flutterwave';
export type BillingFrequency = 'Monthly' | 'Annual';
export type PlanAudience = 'Artist' | 'Brand' | 'Shared' | 'Both';
export type PlanStatus = 'Draft' | 'Published' | 'Inactive' | 'Archived';
export type PlanVisibility = 'Public' | 'Workspace Only' | 'Hidden';
export type RenewalBehavior = 'Auto-Renew' | 'Manual Renewal';

export type SubscriptionStatus =
  | 'Pending'
  | 'Active'
  | 'Trialing'
  | 'Past Due'
  | 'Grace Period'
  | 'Suspended'
  | 'Cancelled'
  | 'Expired'
  | 'Failed';

export type PaymentTransactionStatus =
  | 'Initialized'
  | 'Pending'
  | 'Succeeded'
  | 'Failed'
  | 'Refunded'
  | 'Partially Refunded'
  | 'Cancelled';

export const ENTITLED_SUBSCRIPTION_STATUSES = new Set<SubscriptionStatus>([
  'Active',
  'Trialing',
  'Grace Period',
]);

export interface SanitizedPlanInput {
  id?: string;
  name: string;
  slug: string;
  description: string;
  audience: PlanAudience;
  tierName: string;
  currency: AllowedCurrency;
  billingFrequencies: BillingFrequency[];
  monthlyPrice: number;
  annualPrice: number;
  includedProductIds: string[];
  includedCategories: string[];
  includedPackageIds: string[];
  downloadLimitPerPeriod: number;
  usageLimitsSummary: string;
  accessRestrictionsSummary: string;
  serviceBenefits: string[];
  packageBenefits: string[];
  durationDays: number;
  renewalBehavior: RenewalBehavior;
  trialDays: number;
  gracePeriodDays: number;
  visibility: PlanVisibility;
  status: PlanStatus;
  featured: boolean;
  terms: string;
  effectiveFrom: string;
  effectiveUntil: string;
}

export interface PaymentSettingsData {
  activeProvider: PaymentProviderId;
  enabledProviders: PaymentProviderId[];
  defaultCurrency: AllowedCurrency;
  supportedCurrencies: AllowedCurrency[];
  supportedMethods: string[];
  enableOneTimePurchases: boolean;
  enableSubscriptions: boolean;
  maxPaymentRetries: number;
  retryIntervalHours: number;
  defaultGracePeriodDays: number;
  cancellationPolicy: 'immediate_or_period_end' | 'period_end_only' | 'immediate_only';
  refundWindowDays: number;
  autoGenerateInvoices: boolean;
  autoGenerateReceipts: boolean;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettingsData = {
  activeProvider: 'paystack',
  enabledProviders: ['paystack', 'flutterwave'],
  defaultCurrency: 'NGN',
  supportedCurrencies: ['NGN', 'USD', 'GBP', 'EUR', 'CAD'],
  supportedMethods: ['card', 'bank_transfer', 'ussd', 'mobile_money'],
  enableOneTimePurchases: true,
  enableSubscriptions: true,
  maxPaymentRetries: 3,
  retryIntervalHours: 24,
  defaultGracePeriodDays: 5,
  cancellationPolicy: 'immediate_or_period_end',
  refundWindowDays: 14,
  autoGenerateInvoices: true,
  autoGenerateReceipts: true,
};

function sanitizeStringArray(raw: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > maxLen) continue;
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
    if (out.length >= maxItems) break;
  }
  return out;
}

function sanitizeSafeIdArray(raw: unknown, maxItems = 100): string[] {
  const arr = sanitizeStringArray(raw, maxItems, 128);
  return arr.filter(item => /^[a-zA-Z0-9_-]+$/.test(item));
}

export function slugifyPlanName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `plan-${Date.now()}`
  );
}

export function sanitizeSubscriptionPlanInput(raw: Record<string, unknown>): SanitizedPlanInput {
  const name = cleanText(raw.name, 'Plan name', 120, true);
  const rawSlug = typeof raw.slug === 'string' && raw.slug.trim() ? raw.slug.trim() : slugifyPlanName(name);
  const slug = rawSlug.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 100) || slugifyPlanName(name);
  const description = cleanText(raw.description ?? '', 'Description', 2000, false);

  const audienceRaw = String(raw.audience || 'Shared').trim();
  const validAudiences = new Set<PlanAudience>(['Artist', 'Brand', 'Shared', 'Both']);
  if (!validAudiences.has(audienceRaw as PlanAudience)) {
    throw new FinanceValidationError('invalid-argument', 'Plan audience must be Artist, Brand, Shared, or Both.');
  }
  const audience = audienceRaw as PlanAudience;

  const tierName = cleanText(raw.tierName ?? 'Standard', 'Tier name', 60, false) || 'Standard';
  const currency = validateCurrency(raw.currency || 'NGN');

  const rawFreqs = Array.isArray(raw.billingFrequencies) ? raw.billingFrequencies : ['Monthly'];
  const billingFrequencies = rawFreqs
    .map(f => String(f).trim())
    .filter((f): f is BillingFrequency => f === 'Monthly' || f === 'Annual');
  const uniqueFrequencies = Array.from(new Set(billingFrequencies));
  if (uniqueFrequencies.length === 0) {
    uniqueFrequencies.push('Monthly');
  }

  const monthlyNum = Number(raw.monthlyPrice ?? 0);
  const annualNum = Number(raw.annualPrice ?? 0);
  if (!Number.isFinite(monthlyNum) || monthlyNum < 0 || monthlyNum > 100_000_000) {
    throw new FinanceValidationError('invalid-argument', 'Monthly price must be 0 or greater.');
  }
  if (!Number.isFinite(annualNum) || annualNum < 0 || annualNum > 1_000_000_000) {
    throw new FinanceValidationError('invalid-argument', 'Annual price must be 0 or greater.');
  }

  const monthlyPrice = roundCurrency(monthlyNum);
  const annualPrice = roundCurrency(annualNum);
  if (uniqueFrequencies.includes('Monthly') && monthlyPrice <= 0 && !uniqueFrequencies.includes('Annual')) {
    throw new FinanceValidationError('invalid-argument', 'Monthly price must be greater than zero for Monthly plans.');
  }
  if (uniqueFrequencies.includes('Annual') && annualPrice <= 0 && !uniqueFrequencies.includes('Monthly')) {
    throw new FinanceValidationError('invalid-argument', 'Annual price must be greater than zero for Annual plans.');
  }
  if (
    (uniqueFrequencies.includes('Monthly') && monthlyPrice <= 0 && annualPrice <= 0) ||
    (uniqueFrequencies.includes('Annual') && annualPrice <= 0 && monthlyPrice <= 0)
  ) {
    throw new FinanceValidationError('invalid-argument', 'At least one enabled billing frequency must have a positive price.');
  }

  const downloadLimitRaw = raw.downloadLimitPerPeriod === undefined ? -1 : Number(raw.downloadLimitPerPeriod);
  if (!Number.isFinite(downloadLimitRaw) || downloadLimitRaw < -1 || downloadLimitRaw > 100000) {
    throw new FinanceValidationError('invalid-argument', 'Download limit must be -1 (unlimited) or a non-negative number.');
  }
  const downloadLimitPerPeriod = Math.floor(downloadLimitRaw);

  const durationDaysRaw = raw.durationDays === undefined ? 30 : Number(raw.durationDays);
  const durationDays = Number.isFinite(durationDaysRaw) && durationDaysRaw >= 1 && durationDaysRaw <= 3650
    ? Math.floor(durationDaysRaw)
    : 30;

  const trialDaysRaw = raw.trialDays === undefined ? 0 : Number(raw.trialDays);
  if (!Number.isFinite(trialDaysRaw) || trialDaysRaw < 0 || trialDaysRaw > 90) {
    throw new FinanceValidationError('invalid-argument', 'Trial days must be between 0 and 90.');
  }
  const trialDays = Math.floor(trialDaysRaw);

  const graceDaysRaw = raw.gracePeriodDays === undefined ? 5 : Number(raw.gracePeriodDays);
  if (!Number.isFinite(graceDaysRaw) || graceDaysRaw < 0 || graceDaysRaw > 60) {
    throw new FinanceValidationError('invalid-argument', 'Grace period days must be between 0 and 60.');
  }
  const gracePeriodDays = Math.floor(graceDaysRaw);

  const renewalRaw = String(raw.renewalBehavior || 'Auto-Renew').trim();
  const renewalBehavior: RenewalBehavior = renewalRaw === 'Manual Renewal' ? 'Manual Renewal' : 'Auto-Renew';

  const visibilityRaw = String(raw.visibility || 'Public').trim();
  const validVis = new Set<PlanVisibility>(['Public', 'Workspace Only', 'Hidden']);
  if (!validVis.has(visibilityRaw as PlanVisibility)) {
    throw new FinanceValidationError('invalid-argument', 'Invalid plan visibility.');
  }
  const visibility = visibilityRaw as PlanVisibility;

  const statusRaw = String(raw.status || 'Draft').trim();
  const validStatus = new Set<PlanStatus>(['Draft', 'Published', 'Inactive', 'Archived']);
  if (!validStatus.has(statusRaw as PlanStatus)) {
    throw new FinanceValidationError('invalid-argument', 'Invalid plan status.');
  }
  const status = statusRaw as PlanStatus;

  const effectiveFrom = cleanText(raw.effectiveFrom ?? '', 'Effective from date', 40, false);
  const effectiveUntil = cleanText(raw.effectiveUntil ?? '', 'Effective until date', 40, false);
  if (effectiveFrom && effectiveUntil && effectiveFrom > effectiveUntil) {
    throw new FinanceValidationError('invalid-argument', 'Effective until date cannot precede effective from date.');
  }

  return {
    ...(typeof raw.id === 'string' && raw.id.trim() ? { id: raw.id.trim() } : {}),
    name,
    slug,
    description,
    audience,
    tierName,
    currency,
    billingFrequencies: uniqueFrequencies,
    monthlyPrice,
    annualPrice,
    includedProductIds: sanitizeSafeIdArray(raw.includedProductIds, 200),
    includedCategories: sanitizeStringArray(raw.includedCategories, 50, 120),
    includedPackageIds: sanitizeSafeIdArray(raw.includedPackageIds, 50),
    downloadLimitPerPeriod,
    usageLimitsSummary: cleanText(raw.usageLimitsSummary ?? '', 'Usage limits summary', 500, false),
    accessRestrictionsSummary: cleanText(raw.accessRestrictionsSummary ?? '', 'Access restrictions', 500, false),
    serviceBenefits: sanitizeStringArray(raw.serviceBenefits, 25, 240),
    packageBenefits: sanitizeStringArray(raw.packageBenefits, 25, 240),
    durationDays,
    renewalBehavior,
    trialDays,
    gracePeriodDays,
    visibility,
    status,
    featured: raw.featured === true,
    terms: cleanText(raw.terms ?? '', 'Subscription terms', 2000, false),
    effectiveFrom,
    effectiveUntil,
  };
}

export function sanitizePaymentSettingsInput(
  raw: Record<string, unknown>,
  existing: PaymentSettingsData = DEFAULT_PAYMENT_SETTINGS,
): PaymentSettingsData {
  const activeProviderRaw = String(raw.activeProvider ?? existing.activeProvider).trim().toLowerCase();
  if (activeProviderRaw !== 'paystack' && activeProviderRaw !== 'flutterwave') {
    throw new FinanceValidationError('invalid-argument', 'Active payment provider must be paystack or flutterwave.');
  }
  const activeProvider = activeProviderRaw as PaymentProviderId;

  const rawEnabled = Array.isArray(raw.enabledProviders) ? raw.enabledProviders : existing.enabledProviders;
  const enabledProviders = Array.from(
    new Set(
      rawEnabled
        .map(v => String(v).trim().toLowerCase())
        .filter((v): v is PaymentProviderId => v === 'paystack' || v === 'flutterwave'),
    ),
  );
  if (!enabledProviders.includes(activeProvider)) {
    enabledProviders.push(activeProvider);
  }

  const defaultCurrency = validateCurrency(raw.defaultCurrency ?? existing.defaultCurrency);
  const rawSupportedCurrencies = Array.isArray(raw.supportedCurrencies)
    ? raw.supportedCurrencies
    : existing.supportedCurrencies;
  const supportedCurrencies = Array.from(
    new Set(
      rawSupportedCurrencies
        .map(v => String(v).trim().toUpperCase())
        .filter((v): v is AllowedCurrency => ALLOWED_CURRENCIES.has(v as AllowedCurrency)),
    ),
  );
  if (!supportedCurrencies.includes(defaultCurrency)) {
    supportedCurrencies.unshift(defaultCurrency);
  }

  const supportedMethods = sanitizeStringArray(
    raw.supportedMethods ?? existing.supportedMethods,
    12,
    40,
  );

  const maxPaymentRetries = Math.min(
    10,
    Math.max(0, Math.floor(Number(raw.maxPaymentRetries ?? existing.maxPaymentRetries) || 0)),
  );
  const retryIntervalHours = Math.min(
    168,
    Math.max(1, Math.floor(Number(raw.retryIntervalHours ?? existing.retryIntervalHours) || 24)),
  );
  const defaultGracePeriodDays = Math.min(
    60,
    Math.max(0, Math.floor(Number(raw.defaultGracePeriodDays ?? existing.defaultGracePeriodDays) || 5)),
  );
  const refundWindowDays = Math.min(
    365,
    Math.max(0, Math.floor(Number(raw.refundWindowDays ?? existing.refundWindowDays) || 14)),
  );

  const cancelPolicyRaw = String(raw.cancellationPolicy ?? existing.cancellationPolicy).trim();
  const cancellationPolicy =
    cancelPolicyRaw === 'period_end_only' || cancelPolicyRaw === 'immediate_only'
      ? cancelPolicyRaw
      : 'immediate_or_period_end';

  return {
    activeProvider,
    enabledProviders,
    defaultCurrency,
    supportedCurrencies,
    supportedMethods: supportedMethods.length > 0 ? supportedMethods : DEFAULT_PAYMENT_SETTINGS.supportedMethods,
    enableOneTimePurchases:
      raw.enableOneTimePurchases !== undefined
        ? Boolean(raw.enableOneTimePurchases)
        : existing.enableOneTimePurchases,
    enableSubscriptions:
      raw.enableSubscriptions !== undefined
        ? Boolean(raw.enableSubscriptions)
        : existing.enableSubscriptions,
    maxPaymentRetries,
    retryIntervalHours,
    defaultGracePeriodDays,
    cancellationPolicy,
    refundWindowDays,
    autoGenerateInvoices:
      raw.autoGenerateInvoices !== undefined
        ? Boolean(raw.autoGenerateInvoices)
        : existing.autoGenerateInvoices,
    autoGenerateReceipts:
      raw.autoGenerateReceipts !== undefined
        ? Boolean(raw.autoGenerateReceipts)
        : existing.autoGenerateReceipts,
  };
}

export function planAppliesToDepartment(planAudience: string | undefined, department: 'Artist' | 'Brand'): boolean {
  if (!planAudience) return false;
  if (planAudience === 'Shared' || planAudience === 'Both') return true;
  return planAudience === department;
}

export function resolvePlanBillingTerms(params: {
  plan: {
    status: string;
    audience: string;
    currency: string;
    billingFrequencies: string[];
    monthlyPrice: number;
    annualPrice: number;
    effectiveFrom?: string;
    effectiveUntil?: string;
  };
  department: 'Artist' | 'Brand';
  billingFrequency: BillingFrequency;
  nowIso?: string;
}): { amount: number; currency: AllowedCurrency; periodDays: number } {
  const { plan, department, billingFrequency, nowIso = new Date().toISOString() } = params;
  if (plan.status !== 'Published') {
    throw new FinanceValidationError('failed-precondition', 'This subscription plan is not published.');
  }
  if (!planAppliesToDepartment(plan.audience, department)) {
    throw new FinanceValidationError(
      'permission-denied',
      `This subscription plan is not available for ${department} accounts.`,
    );
  }
  if (plan.effectiveFrom && nowIso.slice(0, 10) < plan.effectiveFrom) {
    throw new FinanceValidationError('failed-precondition', 'This subscription plan is not active yet.');
  }
  if (plan.effectiveUntil && nowIso.slice(0, 10) > plan.effectiveUntil) {
    throw new FinanceValidationError('failed-precondition', 'This subscription plan has expired.');
  }
  if (!Array.isArray(plan.billingFrequencies) || !plan.billingFrequencies.includes(billingFrequency)) {
    throw new FinanceValidationError(
      'invalid-argument',
      `${billingFrequency} billing is not enabled on this subscription plan.`,
    );
  }
  const rawPrice = billingFrequency === 'Annual' ? Number(plan.annualPrice || 0) : Number(plan.monthlyPrice || 0);
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) {
    throw new FinanceValidationError(
      'failed-precondition',
      `No valid positive price is configured for ${billingFrequency} billing on this plan.`,
    );
  }
  return {
    amount: roundCurrency(rawPrice),
    currency: validateCurrency(plan.currency || 'NGN'),
    periodDays: billingFrequency === 'Annual' ? 365 : 30,
  };
}

export function resolveProductOneTimePrice(product: {
  status?: string;
  isPurchasable?: boolean;
  purchasePrice?: number;
  purchaseCurrency?: string;
  priceUsd?: number;
}): { amount: number; currency: AllowedCurrency } {
  if (product.status && product.status !== 'Published') {
    throw new FinanceValidationError('failed-precondition', 'Only published creative resources can be purchased.');
  }
  if (product.isPurchasable !== true) {
    throw new FinanceValidationError('failed-precondition', 'This creative resource is not configured for one-time purchase.');
  }
  const direct = Number(product.purchasePrice ?? 0);
  if (Number.isFinite(direct) && direct > 0) {
    return {
      amount: roundCurrency(direct),
      currency: validateCurrency(product.purchaseCurrency || 'NGN'),
    };
  }
  const usdFallback = Number(product.priceUsd ?? 0);
  if (Number.isFinite(usdFallback) && usdFallback > 0) {
    return {
      amount: roundCurrency(usdFallback),
      currency: 'USD',
    };
  }
  throw new FinanceValidationError('failed-precondition', 'This creative resource does not have a valid purchase price.');
}

export function resolveServicePackageOneTimePrice(pkg: {
  isActive?: boolean;
  priceUsd?: number;
  currency?: string;
  isPurchasableOneTime?: boolean;
  billingType?: string;
}): { amount: number; currency: AllowedCurrency } {
  if (pkg.isActive !== true) {
    throw new FinanceValidationError('failed-precondition', 'This service package is inactive.');
  }
  if (pkg.isPurchasableOneTime === false) {
    throw new FinanceValidationError('failed-precondition', 'This service package requires a custom studio proposal.');
  }
  const amount = Number(pkg.priceUsd ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new FinanceValidationError('failed-precondition', 'Service package has no positive checkout price.');
  }
  return {
    amount: roundCurrency(amount),
    currency: validateCurrency(pkg.currency || 'USD'),
  };
}

export function addDaysIso(baseIso: string, days: number): string {
  const baseMs = Date.parse(baseIso);
  const start = Number.isNaN(baseMs) ? Date.now() : baseMs;
  return new Date(start + days * 24 * 60 * 60 * 1000).toISOString();
}

export function verifyPaystackWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !signatureHeader) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signatureHeader.trim(), 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function verifyFlutterwaveWebhookSignature(
  verifHashHeader: string | undefined,
  expectedSecretHash: string | undefined,
): boolean {
  if (!expectedSecretHash || !verifHashHeader) return false;
  const sigBuf = Buffer.from(verifHashHeader.trim(), 'utf8');
  const expBuf = Buffer.from(expectedSecretHash.trim(), 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function toProviderSmallestUnit(amount: number): number {
  return Math.round(roundCurrency(amount) * 100);
}

export function fromProviderSmallestUnit(minorAmount: number): number {
  return roundCurrency((Number(minorAmount) || 0) / 100);
}

export function validateVerifiedProviderPayment(params: {
  provider: PaymentProviderId;
  providerStatus: string;
  paidAmountMajor: number;
  paidCurrency: string;
  expectedAmountMajor: number;
  expectedCurrency: AllowedCurrency;
}): { ok: boolean; reason?: string } {
  const normalizedStatus = params.providerStatus.trim().toLowerCase();
  const isSuccess =
    params.provider === 'paystack'
      ? normalizedStatus === 'success'
      : normalizedStatus === 'successful' || normalizedStatus === 'success';
  if (!isSuccess) {
    return { ok: false, reason: `Provider payment status is "${params.providerStatus}", not verified paid.` };
  }
  const paidCur = params.paidCurrency.trim().toUpperCase();
  if (paidCur !== params.expectedCurrency) {
    return {
      ok: false,
      reason: `Currency mismatch: expected ${params.expectedCurrency}, provider reported ${paidCur}.`,
    };
  }
  if (roundCurrency(params.paidAmountMajor) + 0.005 < roundCurrency(params.expectedAmountMajor)) {
    return {
      ok: false,
      reason: `Amount mismatch: expected ${params.expectedAmountMajor} ${params.expectedCurrency}, provider settled ${params.paidAmountMajor} ${paidCur}.`,
    };
  }
  return { ok: true };
}

export function buildAutomatedInvoiceData(params: {
  invoiceId: string;
  referenceNo: string;
  workspaceId: string;
  clientUid: string;
  recipientName: string;
  recipientOrg?: string;
  recipientEmail?: string;
  title: string;
  description: string;
  currency: AllowedCurrency;
  amount: number;
  nowIso: string;
  paymentRecord?: {
    id: string;
    receiptNumber: string;
    amount: number;
    reference: string;
    method: 'Paystack' | 'Flutterwave' | 'Other';
    notes?: string;
  };
}) {
  const lineAmount = roundCurrency(params.amount);
  const lineItems = [
    {
      description: params.description,
      quantity: 1,
      unitPrice: lineAmount,
      total: lineAmount,
    },
  ];
  const summary = computeMonetarySummary({
    items: lineItems,
    taxRate: 0,
    discountAmount: 0,
  });

  const payments = params.paymentRecord
    ? [
        {
          id: params.paymentRecord.id,
          receiptNumber: params.paymentRecord.receiptNumber,
          amount: roundCurrency(params.paymentRecord.amount),
          date: params.nowIso.slice(0, 10),
          reference: params.paymentRecord.reference,
          method: params.paymentRecord.method,
          recordedBy: 'KeedoHub Payment Automation',
          recordedByUid: 'system',
          ...(params.paymentRecord.notes ? { notes: params.paymentRecord.notes } : {}),
        },
      ]
    : [];

  const totalPaid = roundCurrency(payments.reduce((sum, p) => sum + p.amount, 0));
  const balanceDue = Math.max(0, roundCurrency(summary.totalAmount - totalPaid));
  const status = balanceDue <= 0.005 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Issued';

  return {
    id: params.invoiceId,
    workspaceId: params.workspaceId,
    clientUid: params.clientUid,
    referenceNo: params.referenceNo,
    title: params.title,
    currency: params.currency,
    issueDate: params.nowIso.slice(0, 10),
    dueDate: params.nowIso.slice(0, 10),
    recipientName: params.recipientName || 'Workspace Client',
    recipientOrg: params.recipientOrg || '',
    recipientEmail: params.recipientEmail || '',
    subject: params.title,
    bodyContent: params.description,
    items: lineItems,
    subtotal: summary.subtotal,
    taxRate: summary.taxRate,
    taxAmount: summary.taxAmount,
    discountAmount: summary.discountAmount,
    totalAmount: summary.totalAmount,
    payments,
    totalPaid,
    balanceDue,
    paymentTerms: 'Settled electronically via KeedoHub Billing',
    status,
    issuedByAdmin: true,
    issuedByUid: 'system',
    issuedByName: 'KeedoHub Automated Billing',
    issuedAt: params.nowIso,
    ...(status === 'Paid' ? { paidAt: params.nowIso } : {}),
    createdAt: params.nowIso,
    updatedAt: params.nowIso,
  };
}

export function appendPaymentToExistingInvoiceIdempotent(params: {
  existingInvoice: Record<string, unknown>;
  paymentId: string;
  receiptNumber: string;
  amount: number;
  reference: string;
  method: 'Paystack' | 'Flutterwave' | 'Other';
  nowIso: string;
  notes?: string;
}): {
  alreadyRecorded: boolean;
  updates: Record<string, unknown>;
} {
  const existingPayments = Array.isArray(params.existingInvoice.payments)
    ? (params.existingInvoice.payments as Array<Record<string, unknown>>)
    : [];

  const duplicate = existingPayments.some(
    p => p.id === params.paymentId || (p.reference && p.reference === params.reference),
  );
  if (duplicate) {
    return { alreadyRecorded: true, updates: {} };
  }

  const nextPayments = [
    ...existingPayments,
    {
      id: params.paymentId,
      receiptNumber: params.receiptNumber,
      amount: roundCurrency(params.amount),
      date: params.nowIso.slice(0, 10),
      reference: params.reference,
      method: params.method,
      recordedBy: 'KeedoHub Payment Automation',
      recordedByUid: 'system',
      ...(params.notes ? { notes: params.notes } : {}),
    },
  ];
  const totalAmount = roundCurrency(Number(params.existingInvoice.totalAmount || 0));
  const totalPaid = roundCurrency(nextPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0));
  const balanceDue = Math.max(0, roundCurrency(totalAmount - totalPaid));
  const status = balanceDue <= 0.005 ? 'Paid' : 'Partially Paid';

  return {
    alreadyRecorded: false,
    updates: {
      payments: nextPayments,
      totalPaid,
      balanceDue,
      status,
      ...(status === 'Paid' ? { paidAt: params.nowIso } : {}),
      updatedAt: params.nowIso,
    },
  };
}

export interface LifecycleEvaluationResult {
  changed: boolean;
  nextStatus: SubscriptionStatus;
  nextRetryCount: number;
  nextGraceEndsAt?: string;
  eventType?:
    | 'renewal_approaching'
    | 'grace_period_entered'
    | 'subscription_suspended'
    | 'subscription_expired'
    | 'subscription_cancelled';
  notificationTitle?: string;
  notificationMessage?: string;
}

export function evaluateSubscriptionLifecycle(params: {
  subscription: {
    status: SubscriptionStatus;
    planName: string;
    currentPeriodEnd: string;
    trialEndsAt?: string;
    graceEndsAt?: string;
    cancelAtPeriodEnd: boolean;
    renewalBehavior: RenewalBehavior;
    retryCount: number;
    maxRetries: number;
  };
  gracePeriodDays: number;
  nowIso: string;
}): LifecycleEvaluationResult {
  const { subscription, gracePeriodDays, nowIso } = params;
  const nowMs = Date.parse(nowIso);
  const periodEndMs = Date.parse(subscription.currentPeriodEnd);

  // 1. Period-end cancellation takes effect when currentPeriodEnd passes
  if (
    subscription.cancelAtPeriodEnd &&
    ENTITLED_SUBSCRIPTION_STATUSES.has(subscription.status) &&
    !Number.isNaN(periodEndMs) &&
    nowMs >= periodEndMs
  ) {
    return {
      changed: true,
      nextStatus: 'Cancelled',
      nextRetryCount: subscription.retryCount,
      eventType: 'subscription_cancelled',
      notificationTitle: `Subscription Cancelled · ${subscription.planName}`,
      notificationMessage: `Your ${subscription.planName} billing period has ended and your cancellation is now finalized.`,
    };
  }

  // 2. Grace Period expiry -> Suspended
  if (subscription.status === 'Grace Period' && subscription.graceEndsAt) {
    const graceEndMs = Date.parse(subscription.graceEndsAt);
    if (!Number.isNaN(graceEndMs) && nowMs >= graceEndMs) {
      return {
        changed: true,
        nextStatus: 'Suspended',
        nextRetryCount: subscription.retryCount,
        eventType: 'subscription_suspended',
        notificationTitle: `Subscription Suspended · ${subscription.planName}`,
        notificationMessage: `Your grace period for ${subscription.planName} expired without settled payment. Membership entitlements have been suspended.`,
      };
    }
  }

  // 3. Past Due -> move to Grace Period or Suspended if max retries reached
  if (subscription.status === 'Past Due') {
    if (subscription.retryCount >= subscription.maxRetries && gracePeriodDays <= 0) {
      return {
        changed: true,
        nextStatus: 'Suspended',
        nextRetryCount: subscription.retryCount,
        eventType: 'subscription_suspended',
        notificationTitle: `Subscription Suspended · ${subscription.planName}`,
        notificationMessage: `Payment retries for ${subscription.planName} were unsuccessful. Please update payment to restore membership access.`,
      };
    }
    const graceEndsAt = subscription.graceEndsAt || addDaysIso(nowIso, Math.max(1, gracePeriodDays));
    return {
      changed: true,
      nextStatus: 'Grace Period',
      nextRetryCount: subscription.retryCount + 1,
      nextGraceEndsAt: graceEndsAt,
      eventType: 'grace_period_entered',
      notificationTitle: `Payment Required · Grace Period Active`,
      notificationMessage: `Renewal payment for ${subscription.planName} is past due. Your access remains active during the grace period until ${graceEndsAt.slice(0, 10)}.`,
    };
  }

  // 4. Trialing / Active expiration when currentPeriodEnd passes
  if (
    (subscription.status === 'Active' || subscription.status === 'Trialing') &&
    !Number.isNaN(periodEndMs) &&
    nowMs >= periodEndMs
  ) {
    if (subscription.renewalBehavior === 'Manual Renewal') {
      return {
        changed: true,
        nextStatus: 'Expired',
        nextRetryCount: subscription.retryCount,
        eventType: 'subscription_expired',
        notificationTitle: `Membership Expired · ${subscription.planName}`,
        notificationMessage: `Your ${subscription.planName} term ended on ${subscription.currentPeriodEnd.slice(0, 10)}. Renew anytime from Billing.`,
      };
    }
    const graceEndsAt = addDaysIso(nowIso, Math.max(1, gracePeriodDays));
    return {
      changed: true,
      nextStatus: 'Grace Period',
      nextRetryCount: subscription.retryCount + 1,
      nextGraceEndsAt: graceEndsAt,
      eventType: 'grace_period_entered',
      notificationTitle: `Renewal Payment Due · ${subscription.planName}`,
      notificationMessage: `Your ${subscription.planName} renewal is due. Settle payment by ${graceEndsAt.slice(0, 10)} to avoid suspension.`,
    };
  }

  // 5. Renewal approaching notification (within 3 days of renewal)
  if (
    subscription.status === 'Active' &&
    !subscription.cancelAtPeriodEnd &&
    !Number.isNaN(periodEndMs) &&
    periodEndMs > nowMs &&
    periodEndMs - nowMs <= 3 * 24 * 60 * 60 * 1000
  ) {
    return {
      changed: false,
      nextStatus: subscription.status,
      nextRetryCount: subscription.retryCount,
      eventType: 'renewal_approaching',
      notificationTitle: `Upcoming Renewal · ${subscription.planName}`,
      notificationMessage: `Your ${subscription.planName} membership renews on ${subscription.currentPeriodEnd.slice(0, 10)}.`,
    };
  }

  return {
    changed: false,
    nextStatus: subscription.status,
    nextRetryCount: subscription.retryCount,
  };
}

export function computeWorkspaceEntitlementSyncPatch(params: {
  existingWorkspace: Record<string, unknown>;
  subscription?: {
    id: string;
    planId: string;
    status: SubscriptionStatus;
    currentPeriodEnd: string;
    includedProductIds: string[];
    includedCategories: string[];
    includedPackageIds: string[];
  } | null;
  activePurchasedProductIds: string[];
  activePurchasedPackageIds: string[];
  nowIso: string;
}): Record<string, unknown> {
  const { existingWorkspace, subscription, activePurchasedProductIds, activePurchasedPackageIds, nowIso } = params;
  const contractedPackages = sanitizeSafeIdArray(existingWorkspace.contractedPackageIds, 50);

  const isSubEntitled = Boolean(
    subscription &&
      ENTITLED_SUBSCRIPTION_STATUSES.has(subscription.status) &&
      (!subscription.currentPeriodEnd || Date.parse(subscription.currentPeriodEnd) > Date.parse(nowIso)),
  );

  const subProducts = isSubEntitled ? sanitizeSafeIdArray(subscription?.includedProductIds, 200) : [];
  const subCategories = isSubEntitled ? sanitizeStringArray(subscription?.includedCategories, 50, 120) : [];
  const subPackages = isSubEntitled ? sanitizeSafeIdArray(subscription?.includedPackageIds, 50) : [];

  const mergedActivePackages = Array.from(
    new Set([...contractedPackages, ...activePurchasedPackageIds, ...subPackages]),
  );

  return {
    activePackageIds: mergedActivePackages,
    activeSubscriptionId: subscription ? subscription.id : '',
    activeSubscriptionPlanId: subscription ? subscription.planId : '',
    activeSubscriptionStatus: subscription ? subscription.status : '',
    subscriptionExpiresAt: subscription ? subscription.currentPeriodEnd : '',
    subscriptionEntitledProductIds: subProducts,
    subscriptionEntitledCategories: subCategories,
    purchasedProductIds: Array.from(new Set(activePurchasedProductIds)),
    updatedAt: nowIso,
  };
}

// =========================================================================
// Live Gateway REST Helpers (Node 20 native fetch)
// =========================================================================

export async function callPaystackInitialize(params: {
  secretKey: string;
  email: string;
  amountMajor: number;
  currency: AllowedCurrency;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorizationUrl: string; accessCode?: string; reference: string }> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: toProviderSmallestUnit(params.amountMajor),
      currency: params.currency,
      reference: params.reference,
      ...(params.callbackUrl ? { callback_url: params.callbackUrl } : {}),
      ...(params.metadata ? { metadata: params.metadata } : {}),
    }),
  });

  const json = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; access_code?: string; reference?: string };
  };

  if (!response.ok || !json.status || !json.data?.authorization_url) {
    throw new Error(json.message || 'Paystack transaction initialization failed.');
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference || params.reference,
  };
}

export async function callPaystackVerify(params: {
  secretKey: string;
  reference: string;
}): Promise<{
  status: string;
  amountMajor: number;
  currency: string;
  channel?: string;
  customerCode?: string;
  authorizationCode?: string;
  providerReference?: string;
}> {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(params.reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
    },
  });
  const json = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      channel?: string;
      reference?: string;
      id?: number;
      customer?: { customer_code?: string };
      authorization?: { authorization_code?: string };
    };
  };
  if (!response.ok || !json.status || !json.data) {
    throw new Error(json.message || 'Paystack verification failed.');
  }
  return {
    status: String(json.data.status || ''),
    amountMajor: fromProviderSmallestUnit(Number(json.data.amount || 0)),
    currency: String(json.data.currency || '').toUpperCase(),
    channel: json.data.channel,
    customerCode: json.data.customer?.customer_code,
    authorizationCode: json.data.authorization?.authorization_code,
    providerReference: json.data.id ? String(json.data.id) : json.data.reference,
  };
}

export async function callPaystackRefund(params: {
  secretKey: string;
  reference: string;
  amountMajor?: number;
  note?: string;
}): Promise<{ status: string; providerRefundId?: string }> {
  const response = await fetch('https://api.paystack.co/refund', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction: params.reference,
      ...(params.amountMajor !== undefined ? { amount: toProviderSmallestUnit(params.amountMajor) } : {}),
      ...(params.note ? { merchant_note: params.note } : {}),
    }),
  });
  const json = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: { id?: number | string; status?: string };
  };
  if (!response.ok || !json.status) {
    throw new Error(json.message || 'Paystack refund request failed.');
  }
  return {
    status: String(json.data?.status || 'pending'),
    providerRefundId: json.data?.id ? String(json.data.id) : undefined,
  };
}

export async function callFlutterwaveInitialize(params: {
  secretKey: string;
  email: string;
  customerName: string;
  amountMajor: number;
  currency: AllowedCurrency;
  reference: string;
  redirectUrl: string;
  title: string;
  description: string;
  meta?: Record<string, unknown>;
}): Promise<{ authorizationUrl: string; reference: string }> {
  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: params.reference,
      amount: roundCurrency(params.amountMajor),
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: {
        email: params.email,
        name: params.customerName || 'KeedoHub Client',
      },
      customizations: {
        title: params.title,
        description: params.description,
      },
      ...(params.meta ? { meta: params.meta } : {}),
    }),
  });
  const json = (await response.json()) as {
    status?: string;
    message?: string;
    data?: { link?: string };
  };
  if (!response.ok || json.status !== 'success' || !json.data?.link) {
    throw new Error(json.message || 'Flutterwave payment initialization failed.');
  }
  return {
    authorizationUrl: json.data.link,
    reference: params.reference,
  };
}

export async function callFlutterwaveVerify(params: {
  secretKey: string;
  transactionId?: string;
  txRef?: string;
}): Promise<{
  status: string;
  amountMajor: number;
  currency: string;
  channel?: string;
  providerReference?: string;
}> {
  const endpoint = params.transactionId
    ? `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(params.transactionId)}/verify`
    : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(params.txRef || '')}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
    },
  });
  const json = (await response.json()) as {
    status?: string;
    message?: string;
    data?: {
      id?: number | string;
      status?: string;
      amount?: number;
      currency?: string;
      payment_type?: string;
      flw_ref?: string;
    };
  };
  if (!response.ok || json.status !== 'success' || !json.data) {
    throw new Error(json.message || 'Flutterwave verification failed.');
  }
  return {
    status: String(json.data.status || ''),
    amountMajor: roundCurrency(Number(json.data.amount || 0)),
    currency: String(json.data.currency || '').toUpperCase(),
    channel: json.data.payment_type,
    providerReference: json.data.id ? String(json.data.id) : json.data.flw_ref,
  };
}

export async function callFlutterwaveRefund(params: {
  secretKey: string;
  transactionId: string;
  amountMajor?: number;
  comments?: string;
}): Promise<{ status: string; providerRefundId?: string }> {
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(params.transactionId)}/refund`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(params.amountMajor !== undefined ? { amount: roundCurrency(params.amountMajor) } : {}),
        ...(params.comments ? { comments: params.comments } : {}),
      }),
    },
  );
  const json = (await response.json()) as {
    status?: string;
    message?: string;
    data?: { id?: number | string; status?: string };
  };
  if (!response.ok || json.status !== 'success') {
    throw new Error(json.message || 'Flutterwave refund request failed.');
  }
  return {
    status: String(json.data?.status || 'completed'),
    providerRefundId: json.data?.id ? String(json.data.id) : undefined,
  };
}
