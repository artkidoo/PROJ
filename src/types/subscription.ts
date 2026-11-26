import type { CommercialCurrency } from './index';
import type { CreativeProductAudience } from './creativeProduct';

export type PaymentProviderId = 'paystack' | 'flutterwave';

export type BillingFrequency = 'Monthly' | 'Annual';

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

export type PlanAudience = 'Artist' | 'Brand' | 'Shared' | 'Both';
export type PlanStatus = 'Draft' | 'Published' | 'Inactive' | 'Archived';
export type PlanVisibility = 'Public' | 'Workspace Only' | 'Hidden';
export type RenewalBehavior = 'Auto-Renew' | 'Manual Renewal';

export type CheckoutIntentType =
  | 'subscription'
  | 'plan_change'
  | 'one_time_product'
  | 'one_time_package'
  | 'invoice';

export type PaymentTransactionStatus =
  | 'Initialized'
  | 'Pending'
  | 'Succeeded'
  | 'Failed'
  | 'Refunded'
  | 'Partially Refunded'
  | 'Cancelled';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  audience: PlanAudience;
  tierName: string;
  currency: CommercialCurrency;
  billingFrequencies: BillingFrequency[];
  monthlyPrice: number;
  annualPrice: number;
  includedProductIds: string[];
  includedCategories: string[];
  includedPackageIds: string[];
  downloadLimitPerPeriod: number; // -1 for unlimited
  usageLimitsSummary?: string;
  accessRestrictionsSummary?: string;
  serviceBenefits: string[];
  packageBenefits: string[];
  durationDays?: number;
  renewalBehavior: RenewalBehavior;
  trialDays: number;
  gracePeriodDays: number;
  visibility: PlanVisibility;
  status: PlanStatus;
  featured?: boolean;
  terms?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  providerPlanCodes?: {
    paystackMonthly?: string;
    paystackAnnual?: string;
    flutterwaveMonthly?: string;
    flutterwaveAnnual?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdByUid?: string;
  updatedByUid?: string;
}

export interface SubscriptionHistoryEntry {
  id: string;
  action:
    | 'created'
    | 'activated'
    | 'renewed'
    | 'payment_failed'
    | 'grace_entered'
    | 'suspended'
    | 'expired'
    | 'cancelled'
    | 'reactivated'
    | 'plan_changed'
    | 'admin_adjusted'
    | 'refunded';
  fromStatus?: SubscriptionStatus;
  toStatus: SubscriptionStatus;
  fromPlanId?: string;
  toPlanId?: string;
  note?: string;
  actorUid?: string;
  actorRole: 'System' | 'Client' | 'Admin' | 'Webhook';
  timestamp: string;
}

export interface SubscriptionRecord {
  id: string;
  workspaceId: string;
  clientUid: string;
  planId: string;
  planName: string;
  planAudience: PlanAudience;
  department: 'Artist' | 'Brand';
  status: SubscriptionStatus;
  provider: PaymentProviderId | 'manual';
  billingFrequency: BillingFrequency;
  currency: CommercialCurrency;
  recurringAmount: number;
  renewalBehavior: RenewalBehavior;
  providerCustomerCode?: string;
  providerSubscriptionCode?: string;
  providerAuthorizationCode?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  trialEndsAt?: string;
  graceEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  pendingPlanId?: string;
  pendingPlanFrequency?: BillingFrequency;
  retryCount: number;
  maxRetries: number;
  lastPaymentError?: string;
  lastTransactionId?: string;
  lastInvoiceId?: string;
  downloadsUsedThisPeriod: number;
  downloadLimitPerPeriod: number;
  includedProductIds: string[];
  includedCategories: string[];
  includedPackageIds: string[];
  history: SubscriptionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionEventRecord {
  id: string;
  subscriptionId: string;
  workspaceId: string;
  clientUid: string;
  eventType:
    | 'subscription_created'
    | 'subscription_activated'
    | 'renewal_approaching'
    | 'renewal_succeeded'
    | 'renewal_failed'
    | 'grace_period_entered'
    | 'subscription_suspended'
    | 'subscription_expired'
    | 'subscription_cancelled'
    | 'subscription_reactivated'
    | 'plan_changed'
    | 'payment_refunded'
    | 'admin_override';
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface OneTimePurchaseRecord {
  id: string;
  workspaceId: string;
  clientUid: string;
  itemType: 'creative_product' | 'resource_bundle' | 'service_package';
  itemId: string;
  itemTitle: string;
  productAudience?: CreativeProductAudience;
  grantedProductIds: string[];
  grantedPackageIds: string[];
  entitlementType: 'permanent' | 'term';
  expiresAt?: string;
  status: 'Active' | 'Refunded' | 'Revoked';
  currency: CommercialCurrency;
  amount: number;
  transactionId: string;
  invoiceId: string;
  receiptNumber: string;
  purchasedAt: string;
  refundedAt?: string;
  updatedAt: string;
}

export interface PaymentTransactionRecord {
  id: string;
  reference: string;
  providerReference?: string;
  provider: PaymentProviderId | 'manual';
  intentType: CheckoutIntentType;
  workspaceId: string;
  clientUid: string;
  department: 'Artist' | 'Brand';
  planId?: string;
  subscriptionId?: string;
  billingFrequency?: BillingFrequency;
  productId?: string;
  packageId?: string;
  invoiceId?: string;
  purchaseId?: string;
  description: string;
  currency: CommercialCurrency;
  expectedAmount: number;
  amount: number;
  refundedAmount: number;
  status: PaymentTransactionStatus;
  receiptNumber?: string;
  authorizationUrl?: string;
  channel?: string;
  failureReason?: string;
  verifiedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentProviderSettings {
  activeProvider: PaymentProviderId;
  enabledProviders: PaymentProviderId[];
  defaultCurrency: CommercialCurrency;
  supportedCurrencies: CommercialCurrency[];
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
  updatedAt?: string;
  updatedByUid?: string;
}

export interface PaymentGatewayRuntimeStatus {
  settings: PaymentProviderSettings;
  providers: {
    paystack: {
      enabled: boolean;
      secretConfigured: boolean;
      webhookConfigured: boolean;
      ready: boolean;
    };
    flutterwave: {
      enabled: boolean;
      secretConfigured: boolean;
      webhookConfigured: boolean;
      ready: boolean;
    };
  };
}
