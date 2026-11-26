import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import type {
  BillingFrequency,
  CommercialCurrency,
  CreativeProduct,
  InvoiceRecord,
  PaymentGatewayRuntimeStatus,
  PaymentProviderId,
  ServicePackage,
  SubscriptionPlan,
  SubscriptionRecord,
} from '../../types';
import {
  changeWorkspaceSubscriptionPlanAction,
  fetchPaymentSystemConfig,
  formatSubscriptionMoney,
  initializeCheckoutSession,
  resolvePlanPriceForFrequency,
  resolveProductPurchaseTerms,
  verifyCheckoutTransaction,
  type InitializeCheckoutResult,
  type VerifyPaymentResult,
} from '../../lib/subscriptions';

export type CheckoutTarget =
  | {
      mode: 'subscription';
      plan: SubscriptionPlan;
      initialFrequency?: BillingFrequency;
    }
  | {
      mode: 'plan_change';
      subscription: SubscriptionRecord;
      targetPlan: SubscriptionPlan;
      initialFrequency?: BillingFrequency;
    }
  | {
      mode: 'one_time_product';
      product: CreativeProduct;
    }
  | {
      mode: 'one_time_package';
      pkg: ServicePackage;
    }
  | {
      mode: 'invoice';
      invoice: InvoiceRecord;
    };

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName: string;
  target: CheckoutTarget | null;
  onVerifiedSuccess?: (result: VerifyPaymentResult | { message: string }) => void;
}

const PROVIDER_LABELS: Record<PaymentProviderId, { name: string; subtitle: string }> = {
  paystack: {
    name: 'Paystack',
    subtitle: 'Card, Bank Transfer, USSD & NGN/USD Automated Billing',
  },
  flutterwave: {
    name: 'Flutterwave',
    subtitle: 'Card, Mobile Money, Bank & Multi-Currency Checkout',
  },
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  target,
  onVerifiedSuccess,
}) => {
  const [config, setConfig] = useState<PaymentGatewayRuntimeStatus | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState('');

  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderId>('paystack');
  const [selectedFrequency, setSelectedFrequency] = useState<BillingFrequency>('Monthly');

  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<InitializeCheckoutResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyPaymentResult | null>(null);
  const [planChangeNotice, setPlanChangeNotice] = useState('');

  useEffect(() => {
    if (!isOpen || !target) return;
    setError('');
    setSession(null);
    setVerifyResult(null);
    setPlanChangeNotice('');

    if (target.mode === 'subscription') {
      const availableFreqs: BillingFrequency[] =
        target.plan.billingFrequencies?.length > 0 ? target.plan.billingFrequencies : ['Monthly'];
      setSelectedFrequency(
        target.initialFrequency && availableFreqs.includes(target.initialFrequency)
          ? target.initialFrequency
          : availableFreqs[0],
      );
    } else if (target.mode === 'plan_change') {
      const availableFreqs: BillingFrequency[] =
        target.targetPlan.billingFrequencies?.length > 0
          ? target.targetPlan.billingFrequencies
          : ['Monthly'];
      setSelectedFrequency(
        target.initialFrequency && availableFreqs.includes(target.initialFrequency)
          ? target.initialFrequency
          : availableFreqs[0],
      );
    }

    setConfigLoading(true);
    setConfigError('');
    void fetchPaymentSystemConfig()
      .then(data => {
        setConfig(data);
        const enabled = data.settings.enabledProviders || ['paystack', 'flutterwave'];
        const preferred = data.settings.activeProvider || enabled[0] || 'paystack';
        setSelectedProvider(enabled.includes(preferred) ? preferred : enabled[0] || 'paystack');
      })
      .catch(err => {
        setConfigError(err instanceof Error ? err.message : 'Unable to load payment gateway status.');
      })
      .finally(() => setConfigLoading(false));
  }, [isOpen, target]);

  const summary = useMemo<{
    title: string;
    subtitle: string;
    amount: number;
    currency: CommercialCurrency;
    highlights: string[];
    availableFrequencies: BillingFrequency[];
  } | null>(() => {
    if (!target) return null;

    if (target.mode === 'subscription') {
      const plan = target.plan;
      const pricing = resolvePlanPriceForFrequency(plan, selectedFrequency);
      const freqs =
        plan.billingFrequencies?.length > 0 ? plan.billingFrequencies : (['Monthly'] as BillingFrequency[]);
      return {
        title: `${plan.name} Membership`,
        subtitle: `${plan.audience} · ${selectedFrequency} billing · ${plan.renewalBehavior}`,
        amount: pricing.amount,
        currency: pricing.currency,
        availableFrequencies: freqs,
        highlights: [
          plan.downloadLimitPerPeriod < 0
            ? 'Unlimited creative resource downloads per billing cycle'
            : `${plan.downloadLimitPerPeriod} creative resource downloads per billing cycle`,
          plan.trialDays > 0 ? `${plan.trialDays}-day introductory period included` : 'Immediate membership activation upon verified payment',
          plan.includedCategories?.length
            ? `Unlocks categories: ${plan.includedCategories.join(', ')}`
            : `${plan.includedProductIds?.length || 0} curated Creative Hub resources included`,
        ],
      };
    }

    if (target.mode === 'plan_change') {
      const plan = target.targetPlan;
      const pricing = resolvePlanPriceForFrequency(plan, selectedFrequency);
      const freqs =
        plan.billingFrequencies?.length > 0 ? plan.billingFrequencies : (['Monthly'] as BillingFrequency[]);
      return {
        title: `Switch Plan to ${plan.name}`,
        subtitle: `Current: ${target.subscription.planName} -> Target: ${plan.name} (${selectedFrequency})`,
        amount: pricing.amount,
        currency: pricing.currency,
        availableFrequencies: freqs,
        highlights: [
          'Upgrades activate immediately once payment verification completes.',
          'Downgrades take effect cleanly at the end of your current paid billing period.',
        ],
      };
    }

    if (target.mode === 'one_time_product') {
      const terms = resolveProductPurchaseTerms(
        target.product,
        (config?.settings.defaultCurrency || 'NGN') as CommercialCurrency,
      );
      return {
        title: target.product.title,
        subtitle: `One-Time Resource License · ${target.product.category}`,
        amount: terms.amount,
        currency: terms.currency,
        availableFrequencies: [],
        highlights: [
          'Permanent workspace access — preserved independently of active subscriptions.',
          'Includes automated invoice & receipt generation after payment verification.',
        ],
      };
    }

    if (target.mode === 'one_time_package') {
      return {
        title: target.pkg.name,
        subtitle: `One-Time Studio Package · ${target.pkg.tier}`,
        amount: Number(target.pkg.priceUsd || 0),
        currency: (target.pkg.currency || 'USD') as CommercialCurrency,
        availableFrequencies: [],
        highlights: [
          `${target.pkg.turnaroundDays} business days estimated turnaround · ${
            target.pkg.revisionLimit < 0 ? 'Unlimited revisions' : `${target.pkg.revisionLimit} revision rounds`
          }`,
          'Automated package entitlement unlock upon verified checkout.',
        ],
      };
    }

    const inv = target.invoice;
    const due = Math.max(0, Number(inv.balanceDue ?? inv.totalAmount ?? 0));
    return {
      title: `Invoice ${inv.referenceNo}`,
      subtitle: inv.title || 'Commercial Invoice Settlement',
      amount: due,
      currency: (inv.currency || 'USD') as CommercialCurrency,
      availableFrequencies: [],
      highlights: [
        `Recipient: ${inv.recipientName}${inv.dueDate ? ` · Due ${inv.dueDate}` : ''}`,
        'Verified settlement updates this invoice and issues an official receipt automatically.',
      ],
    };
  }, [target, selectedFrequency, config?.settings.defaultCurrency]);

  if (!target || !summary) return null;

  const enabledProviders: PaymentProviderId[] = config?.settings.enabledProviders?.length
    ? config.settings.enabledProviders
    : ['paystack', 'flutterwave'];

  const providerRuntime = config?.providers?.[selectedProvider];
  const callbackUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';

  const handleInitialize = async () => {
    setError('');
    setInitializing(true);
    try {
      if (target.mode === 'plan_change') {
        const res = await changeWorkspaceSubscriptionPlanAction({
          workspaceId,
          subscriptionId: target.subscription.id,
          targetPlanId: target.targetPlan.id,
          billingFrequency: selectedFrequency,
          provider: selectedProvider,
          callbackUrl,
        });
        if (!res.requiresPayment || !res.checkout) {
          setPlanChangeNotice(res.message);
          onVerifiedSuccess?.({ message: res.message });
          return;
        }
        setSession(res.checkout);
        try {
          window.sessionStorage.setItem(
            'keedohub_pending_checkout',
            JSON.stringify({
              reference: res.checkout.reference,
              provider: res.checkout.provider,
              workspaceId,
            }),
          );
        } catch {
          // ignore storage unavailability
        }
        return;
      }

      const result = await initializeCheckoutSession({
        workspaceId,
        intentType: target.mode,
        provider: selectedProvider,
        ...(target.mode === 'subscription'
          ? { planId: target.plan.id, billingFrequency: selectedFrequency }
          : {}),
        ...(target.mode === 'one_time_product' ? { productId: target.product.id } : {}),
        ...(target.mode === 'one_time_package' ? { packageId: target.pkg.id } : {}),
        ...(target.mode === 'invoice' ? { invoiceId: target.invoice.id } : {}),
        callbackUrl,
      });

      setSession(result);
      try {
        window.sessionStorage.setItem(
          'keedohub_pending_checkout',
          JSON.stringify({
            reference: result.reference,
            provider: result.provider,
            workspaceId,
          }),
        );
      } catch {
        // ignore storage unavailability
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to initialize checkout session.');
    } finally {
      setInitializing(false);
    }
  };

  const handleVerifyNow = async () => {
    if (!session) return;
    setError('');
    setVerifying(true);
    try {
      const verified = await verifyCheckoutTransaction({
        reference: session.reference,
        provider: session.provider,
      });
      setVerifyResult(verified);
      if (verified.verified) {
        try {
          window.sessionStorage.removeItem('keedohub_pending_checkout');
        } catch {
          // ignore
        }
        onVerifiedSuccess?.(verified);
      } else {
        setError(verified.message || 'Payment has not completed verification yet.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify payment transaction.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={summary.title}
      subtitle={`${workspaceName} · ${summary.subtitle}`}
    >
      <div className="space-y-5 text-xs">
        {(error || configError) && (
          <div
            role="alert"
            className="border border-red-900/60 bg-red-950/30 px-4 py-3 text-red-200 flex items-start gap-2.5"
          >
            <AlertTriangle size={15} className="text-[#FF1E1E] shrink-0 mt-0.5" />
            <span>{error || configError}</span>
          </div>
        )}

        {planChangeNotice && (
          <div className="border border-emerald-900/60 bg-emerald-950/25 px-4 py-3.5 text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Plan Change Scheduled</span>
            </div>
            <p className="text-neutral-200">{planChangeNotice}</p>
            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {verifyResult?.verified && (
          <div className="border border-emerald-900/60 bg-emerald-950/25 px-4 py-4 text-emerald-100 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 size={17} className="text-emerald-400" />
              <span>Payment Verified &amp; Access Activated</span>
            </div>
            <p className="text-xs text-neutral-300">{verifyResult.message}</p>
            <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px] text-neutral-300 tabular-nums">
              <span>Ref: {verifyResult.reference}</span>
              {verifyResult.receiptNumber && <span>Receipt: {verifyResult.receiptNumber}</span>}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        )}

        {!planChangeNotice && !verifyResult?.verified && (
          <>
            {/* Billing Frequency Selector (for subscriptions & plan changes) */}
            {summary.availableFrequencies.length > 1 && (
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  Billing Cadence
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {summary.availableFrequencies.map(freq => {
                    const planObj =
                      target.mode === 'subscription'
                        ? target.plan
                        : target.mode === 'plan_change'
                          ? target.targetPlan
                          : null;
                    const priceInfo = planObj ? resolvePlanPriceForFrequency(planObj, freq) : null;
                    const active = selectedFrequency === freq;
                    return (
                      <button
                        key={freq}
                        type="button"
                        disabled={Boolean(session)}
                        onClick={() => setSelectedFrequency(freq)}
                        className={`border px-3.5 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-[#FF1E1E] bg-[#180A0A] text-white'
                            : 'border-[#252525] bg-[#111] text-neutral-400 hover:text-white'
                        } disabled:opacity-60`}
                      >
                        <p className="font-semibold text-xs">{freq}</p>
                        {priceInfo && (
                          <p className="mt-0.5 font-mono text-xs tabular-nums text-neutral-200">
                            {formatSubscriptionMoney(priceInfo.amount, priceInfo.currency)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Canonical Order Summary */}
            <div className="border border-[#222] bg-[#101010] p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-4 border-b border-[#1C1C1C] pb-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Authorized Total
                  </p>
                  <p className="mt-0.5 text-neutral-300">{summary.title}</p>
                </div>
                <p className="text-2xl font-black font-mono tabular-nums text-white">
                  {formatSubscriptionMoney(summary.amount, summary.currency)}
                </p>
              </div>
              <ul className="space-y-1.5 text-neutral-300">
                {summary.highlights.map(line => (
                  <li key={line} className="flex items-start gap-2">
                    <ShieldCheck size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Provider Selection */}
            {!session && (
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  Select Payment Gateway
                </p>
                {configLoading ? (
                  <p className="text-neutral-500 py-2">Checking payment gateway availability…</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {enabledProviders.map(provId => {
                      const meta = PROVIDER_LABELS[provId];
                      const status = config?.providers?.[provId];
                      const active = selectedProvider === provId;
                      return (
                        <button
                          key={provId}
                          type="button"
                          onClick={() => setSelectedProvider(provId)}
                          className={`border p-3 text-left transition-colors ${
                            active
                              ? 'border-[#FF1E1E] bg-[#180A0A] text-white'
                              : 'border-[#252525] bg-[#111] text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-white flex items-center gap-1.5">
                              <CreditCard size={13} className={active ? 'text-[#FF1E1E]' : 'text-neutral-500'} />
                              <span>{meta.name}</span>
                            </span>
                            <span
                              className={`font-mono text-[10px] uppercase ${
                                status?.ready ? 'text-emerald-400' : 'text-amber-300'
                              }`}
                            >
                              {status?.ready ? 'Live Ready' : 'Key Unset'}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-neutral-400 leading-snug">{meta.subtitle}</p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {providerRuntime && !providerRuntime.ready && (
                  <div className="border border-amber-900/50 bg-amber-950/20 p-3 text-amber-200 flex items-start gap-2">
                    <Lock size={14} className="shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      Server gateway credentials for {PROVIDER_LABELS[selectedProvider].name} are not configured in Cloud Functions environment variables yet. Creating a session will record the checkout intent safely without granting unpaid access.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Active Session State */}
            {session && (
              <div className="border border-[#282828] bg-[#111] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1E1E] pb-2.5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                      Checkout Reference
                    </p>
                    <p className="font-mono text-sm font-bold text-white tabular-nums">{session.reference}</p>
                  </div>
                  <span className="font-mono text-xs text-neutral-300">
                    {PROVIDER_LABELS[session.provider].name} · {formatSubscriptionMoney(session.amount, session.currency)}
                  </span>
                </div>

                {session.providerConfigured && session.authorizationUrl ? (
                  <div className="space-y-3">
                    <p className="text-neutral-300 leading-relaxed">
                      Your checkout session is authorized on {PROVIDER_LABELS[session.provider].name}. Continue to the secure payment window, or click Verify Status once you complete payment.
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => window.location.assign(session.authorizationUrl!)}
                        className="inline-flex items-center gap-2 bg-[#FF1E1E] hover:bg-red-600 px-4 py-2.5 text-xs font-semibold text-white whitespace-nowrap shrink-0"
                      >
                        <span>Continue to {PROVIDER_LABELS[session.provider].name}</span>
                        <ArrowRight size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={verifying}
                        onClick={() => void handleVerifyNow()}
                        className="inline-flex items-center gap-1.5 border border-[#333] bg-[#161616] hover:border-white px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        <RefreshCw size={13} className={verifying ? 'animate-spin' : ''} />
                        <span>{verifying ? 'Verifying…' : 'Verify Payment Status'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-amber-200">
                    <p className="font-semibold">Gateway Credentials Required on Server</p>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {session.message ||
                        `${PROVIDER_LABELS[session.provider].name} server API secrets are not set in Cloud Functions. Invoice ${session.invoiceId} remains unpaid and access has not been unlocked.`}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-[#1E1E1E] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="border border-[#333] bg-[#141414] px-4 py-2 text-xs text-neutral-300 hover:text-white"
              >
                {session ? 'Close' : 'Cancel'}
              </button>
              {!session && (
                <button
                  type="button"
                  disabled={initializing || configLoading}
                  onClick={() => void handleInitialize()}
                  className="inline-flex items-center gap-2 bg-[#FF1E1E] hover:bg-red-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <span>
                    {initializing
                      ? 'Preparing Checkout…'
                      : `Pay ${formatSubscriptionMoney(summary.amount, summary.currency)}`}
                  </span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CheckoutModal;
