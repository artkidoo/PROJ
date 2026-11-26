import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Layers,
  Package,
  Receipt,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import type { ClientExperienceConfig, ClientTab } from '../../lib/clientOS';
import { deriveClientInvoiceStatus, formatMoney } from '../../lib/financeDocuments';
import {
  cancelWorkspaceSubscriptionAction,
  formatSubscriptionMoney,
  isSubscriptionStatusEntitled,
  planMatchesDepartment,
  resolvePlanPriceForFrequency,
} from '../../lib/subscriptions';
import type {
  BillingFrequency,
  InvoiceRecord,
  OneTimePurchaseRecord,
  PaymentTransactionRecord,
  SubscriptionEventRecord,
  SubscriptionPlan,
  SubscriptionRecord,
  Workspace,
} from '../../types';
import { generateCommercialInvoicePdf } from '../../utils/pdfGenerator';
import { Modal } from '../common/Modal';
import { CheckoutModal, type CheckoutTarget } from '../billing/CheckoutModal';

export interface ClientBillingCenterProps {
  workspace: Workspace;
  experience: ClientExperienceConfig;
  invoices: InvoiceRecord[];
  onNavigateTab: (tab: ClientTab) => void;
}

type BillingSectionTab = 'overview' | 'plans' | 'purchases' | 'payments' | 'invoices';

function statusTone(status: string): string {
  switch (status) {
    case 'Active':
    case 'Succeeded':
    case 'Paid':
      return 'border-emerald-700/60 bg-emerald-950/30 text-emerald-300';
    case 'Trialing':
      return 'border-blue-700/60 bg-blue-950/30 text-blue-300';
    case 'Past Due':
    case 'Grace Period':
    case 'Partially Paid':
      return 'border-amber-700/60 bg-amber-950/30 text-amber-300';
    case 'Suspended':
    case 'Failed':
    case 'Overdue':
      return 'border-red-800/60 bg-red-950/30 text-red-300';
    default:
      return 'border-[#333] bg-[#141414] text-neutral-300';
  }
}

export const ClientBillingCenter: React.FC<ClientBillingCenterProps> = ({
  workspace,
  experience,
  invoices,
  onNavigateTab,
}) => {
  const [sectionTab, setSectionTab] = useState<BillingSectionTab>('overview');
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('Monthly');

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [purchases, setPurchases] = useState<OneTimePurchaseRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [events, setEvents] = useState<SubscriptionEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SubscriptionRecord | null>(null);
  const [cancelMode, setCancelMode] = useState<'period_end' | 'immediate'>('period_end');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const department = experience.isArtist ? 'Artist' : 'Brand';

  useEffect(() => {
    if (!workspace.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    const unsubs = [
      onSnapshot(
        query(collection(db, 'subscriptionPlans'), where('status', '==', 'Published')),
        snap => {
          setPlans(
            snap.docs
              .map(d => ({ id: d.id, ...(d.data() as Omit<SubscriptionPlan, 'id'>) }))
              .filter(p => p.visibility !== 'Hidden'),
          );
          setLoading(false);
        },
        err => {
          setError(err?.message || 'Unable to load subscription plans.');
          setLoading(false);
        },
      ),
      onSnapshot(
        query(collection(db, 'subscriptions'), where('workspaceId', '==', workspace.id)),
        snap => {
          const list = snap.docs
            .map(d => ({ id: d.id, ...(d.data() as Omit<SubscriptionRecord, 'id'>) }))
            .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
          setSubscriptions(list);
        },
        () => {},
      ),
      onSnapshot(
        query(collection(db, 'oneTimePurchases'), where('workspaceId', '==', workspace.id)),
        snap => {
          const list = snap.docs
            .map(d => ({ id: d.id, ...(d.data() as Omit<OneTimePurchaseRecord, 'id'>) }))
            .sort((a, b) => (b.purchasedAt || '').localeCompare(a.purchasedAt || ''));
          setPurchases(list);
        },
        () => {},
      ),
      onSnapshot(
        query(collection(db, 'paymentTransactions'), where('workspaceId', '==', workspace.id)),
        snap => {
          const list = snap.docs
            .map(d => ({ id: d.id, ...(d.data() as Omit<PaymentTransactionRecord, 'id'>) }))
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setTransactions(list);
        },
        () => {},
      ),
      onSnapshot(
        query(collection(db, 'subscriptionEvents'), where('workspaceId', '==', workspace.id)),
        snap => {
          const list = snap.docs
            .map(d => ({ id: d.id, ...(d.data() as Omit<SubscriptionEventRecord, 'id'>) }))
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
          setEvents(list);
        },
        () => {},
      ),
    ];

    return () => unsubs.forEach(u => u());
  }, [workspace.id]);

  const eligiblePlans = useMemo(
    () =>
      plans
        .filter(p => planMatchesDepartment(p.audience, department))
        .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.monthlyPrice - b.monthlyPrice),
    [plans, department],
  );

  const activeSubscription = useMemo(
    () =>
      subscriptions.find(s => isSubscriptionStatusEntitled(s.status)) ||
      subscriptions.find(s => s.status === 'Past Due' || s.status === 'Pending') ||
      subscriptions[0] ||
      null,
    [subscriptions],
  );

  const openInvoices = useMemo(
    () =>
      invoices.filter(inv => {
        const st = deriveClientInvoiceStatus(inv);
        return st !== 'Paid' && st !== 'Void' && (inv.balanceDue ?? inv.totalAmount) > 0;
      }),
    [invoices],
  );

  const activeOneTimePurchases = useMemo(
    () => purchases.filter(p => p.status === 'Active'),
    [purchases],
  );

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;
    setCancelling(true);
    setError('');
    setNotice('');
    try {
      const res = await cancelWorkspaceSubscriptionAction({
        workspaceId: workspace.id,
        subscriptionId: cancelTarget.id,
        mode: cancelMode,
        reason: cancelReason.trim(),
      });
      setNotice(res.message);
      setCancelTarget(null);
      setCancelReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="border border-red-900/60 bg-red-950/30 px-4 py-3 text-xs text-red-200 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="underline shrink-0">Dismiss</button>
        </div>
      )}

      {notice && (
        <div role="status" className="border border-emerald-900/60 bg-emerald-950/25 px-4 py-3 text-xs text-emerald-200 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </span>
          <button type="button" onClick={() => setNotice('')} className="underline shrink-0">Dismiss</button>
        </div>
      )}

      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Billing center sections">
          {(
            [
              { id: 'overview', label: 'Membership Overview' },
              { id: 'plans', label: `Available Plans (${eligiblePlans.length})` },
              { id: 'purchases', label: `Unlocked Purchases (${activeOneTimePurchases.length})` },
              { id: 'payments', label: `Payment History (${transactions.length})` },
              { id: 'invoices', label: `Open Invoices (${openInvoices.length})` },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={sectionTab === tab.id}
              onClick={() => setSectionTab(tab.id)}
              className={`border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                sectionTab === tab.id
                  ? 'border-[#FF1E1E] bg-[#180A0A] text-white'
                  : 'border-[#252525] bg-[#111] text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('proposals')}
          className="text-xs text-neutral-400 hover:text-white whitespace-nowrap shrink-0"
        >
          View Proposals &amp; Quotes
        </button>
      </div>

      {/* SECTION 1: MEMBERSHIP OVERVIEW */}
      {sectionTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-5">
            <section className="border border-[#222] bg-[#0C0C0C] p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1B1B1B] pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                    {department} OS Membership
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    {activeSubscription ? activeSubscription.planName : 'No Active Membership Plan'}
                  </h3>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {activeSubscription
                      ? `${activeSubscription.billingFrequency} billing · ${activeSubscription.renewalBehavior}`
                      : `Subscribe to unlock recurring ${department} Creative Hub resources, templates, and studio downloads.`}
                  </p>
                </div>
                {activeSubscription && (
                  <span className={`border px-2.5 py-1 text-[11px] font-mono uppercase ${statusTone(activeSubscription.status)}`}>
                    {activeSubscription.status}
                  </span>
                )}
              </div>

              {activeSubscription ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
                    <div className="border border-[#1E1E1E] bg-[#111] p-3">
                      <p className="text-[10px] uppercase text-neutral-500">Recurring Rate</p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {formatSubscriptionMoney(activeSubscription.recurringAmount, activeSubscription.currency)}
                      </p>
                    </div>
                    <div className="border border-[#1E1E1E] bg-[#111] p-3">
                      <p className="text-[10px] uppercase text-neutral-500">Current Period End</p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {activeSubscription.currentPeriodEnd?.slice(0, 10) || '—'}
                      </p>
                    </div>
                    <div className="border border-[#1E1E1E] bg-[#111] p-3">
                      <p className="text-[10px] uppercase text-neutral-500">Downloads Used</p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {activeSubscription.downloadsUsedThisPeriod || 0} /{' '}
                        {activeSubscription.downloadLimitPerPeriod < 0
                          ? 'Unlimited'
                          : activeSubscription.downloadLimitPerPeriod}
                      </p>
                    </div>
                    <div className="border border-[#1E1E1E] bg-[#111] p-3">
                      <p className="text-[10px] uppercase text-neutral-500">Provider</p>
                      <p className="mt-1 text-sm font-bold text-white capitalize">
                        {activeSubscription.provider}
                      </p>
                    </div>
                  </div>

                  {activeSubscription.cancelAtPeriodEnd && (
                    <div className="border border-amber-800/60 bg-amber-950/20 px-3.5 py-2.5 text-xs text-amber-200">
                      Cancellation scheduled for period end ({activeSubscription.currentPeriodEnd?.slice(0, 10)}). Access remains active until then.
                    </div>
                  )}

                  {activeSubscription.lastPaymentError && (
                    <div className="border border-red-800/60 bg-red-950/25 px-3.5 py-2.5 text-xs text-red-200 flex items-start gap-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[#FF1E1E]" />
                      <span>Payment notice: {activeSubscription.lastPaymentError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setSectionTab('plans')}
                      className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
                    >
                      <RefreshCw size={13} />
                      <span>Switch or Upgrade Plan</span>
                    </button>
                    {isSubscriptionStatusEntitled(activeSubscription.status) && !activeSubscription.cancelAtPeriodEnd && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelMode('period_end');
                          setCancelReason('');
                          setCancelTarget(activeSubscription);
                        }}
                        className="border border-[#333] bg-[#141414] hover:border-red-700 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white whitespace-nowrap shrink-0"
                      >
                        Cancel Membership
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigateTab('creative-hub')}
                      className="border border-[#262626] bg-[#111] px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white whitespace-nowrap shrink-0"
                    >
                      Browse Unlocked Resources
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Free Creative Hub assets and any permanently purchased one-time items remain accessible in your workspace. Subscribe to a membership plan to unlock the full {department} Creative Hub library.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSectionTab('plans')}
                      className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      <span>Compare Membership Plans</span>
                      <ArrowRight size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('creative-hub')}
                      className="border border-[#333] bg-[#141414] px-4 py-2 text-xs font-medium text-neutral-200 hover:text-white"
                    >
                      Open Creative Hub
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Quick Summary Sidebar */}
            <aside className="border border-[#222] bg-[#0C0C0C] p-5 space-y-4">
              <h4 className="text-sm font-bold text-white">Billing &amp; Entitlement Snapshot</h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
                  <span className="text-neutral-400">Permanent Resource Licenses</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {activeOneTimePurchases.length}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
                  <span className="text-neutral-400">Open Commercial Invoices</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {openInvoices.length}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
                  <span className="text-neutral-400">Verified Payments</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {transactions.filter(t => t.status === 'Succeeded').length}
                  </span>
                </div>
              </div>

              {openInvoices.length > 0 && (
                <div className="border border-blue-900/50 bg-blue-950/20 p-3.5 space-y-2">
                  <p className="font-semibold text-blue-200 text-xs">
                    {openInvoices[0].referenceNo} Due
                  </p>
                  <p className="font-mono text-sm font-bold text-white tabular-nums">
                    {formatMoney(openInvoices[0].balanceDue ?? openInvoices[0].totalAmount, openInvoices[0].currency)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCheckoutTarget({ mode: 'invoice', invoice: openInvoices[0] })}
                    className="w-full bg-[#FF1E1E] hover:bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Pay Invoice Online
                  </button>
                </div>
              )}
            </aside>
          </div>

          {/* Subscription Timeline Events */}
          {events.length > 0 && (
            <section className="border border-[#222] bg-[#0C0C0C] p-5 space-y-3">
              <h4 className="text-sm font-bold text-white">Membership &amp; Billing Events</h4>
              <div className="divide-y divide-[#181818] border border-[#181818]">
                {events.slice(0, 8).map(ev => (
                  <div key={ev.id} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="text-neutral-200 font-medium">{ev.summary}</p>
                      <p className="font-mono text-[10px] text-neutral-500 uppercase">{ev.eventType.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-500 tabular-nums">
                      {ev.createdAt.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* SECTION 2: AVAILABLE PLANS */}
      {sectionTab === 'plans' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                {department} Creative Membership Plans
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Plans curated for {department} OS and Shared Creative Ecosystem entitlements.
              </p>
            </div>
            <div className="flex items-center gap-1 border border-[#242424] bg-[#101010] p-1">
              {(['Monthly', 'Annual'] as const).map(freq => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setBillingFrequency(freq)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    billingFrequency === freq ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-xs text-neutral-500">Loading published plans…</p>
          ) : eligiblePlans.length === 0 ? (
            <div className="border border-dashed border-[#2C2C2C] bg-[#0C0C0C] p-10 text-center space-y-2">
              <Layers size={22} className="mx-auto text-neutral-600" />
              <p className="text-sm font-semibold text-neutral-200">No subscription plans published yet</p>
              <p className="text-xs text-neutral-500">
                KeedoHub administrators publish {department} &amp; Shared subscription packages here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {eligiblePlans.map(plan => {
                const freqs: BillingFrequency[] = plan.billingFrequencies?.length
                  ? plan.billingFrequencies
                  : ['Monthly'];
                const effectiveFreq: BillingFrequency = freqs.includes(billingFrequency)
                  ? billingFrequency
                  : freqs[0];
                const priceInfo = resolvePlanPriceForFrequency(plan, effectiveFreq);
                const isCurrentPlan =
                  activeSubscription &&
                  isSubscriptionStatusEntitled(activeSubscription.status) &&
                  activeSubscription.planId === plan.id;

                return (
                  <article
                    key={plan.id}
                    className={`border p-5 flex flex-col justify-between gap-5 ${
                      plan.featured
                        ? 'border-[#FF1E1E] bg-[#120A0A]'
                        : 'border-[#242424] bg-[#0C0C0C]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase text-neutral-400">
                        <span className="text-[#FF1E1E]">{plan.audience} · {plan.tierName || 'Plan'}</span>
                        {isCurrentPlan && <span className="text-emerald-400 font-bold">Current Plan</span>}
                      </div>
                      <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-mono tabular-nums text-white">
                          {formatSubscriptionMoney(priceInfo.amount, priceInfo.currency)}
                        </span>
                        <span className="text-xs text-neutral-400">/{effectiveFreq.toLowerCase()}</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">{plan.description}</p>

                      <ul className="space-y-1.5 border-t border-[#1C1C1C] pt-3 text-xs text-neutral-300">
                        <li className="flex items-start gap-2">
                          <Check size={13} className="text-[#FF1E1E] shrink-0 mt-0.5" />
                          <span>
                            {plan.downloadLimitPerPeriod < 0
                              ? 'Unlimited downloads per billing cycle'
                              : `${plan.downloadLimitPerPeriod} resource downloads per cycle`}
                          </span>
                        </li>
                        {plan.includedCategories?.length > 0 && (
                          <li className="flex items-start gap-2">
                            <Check size={13} className="text-[#FF1E1E] shrink-0 mt-0.5" />
                            <span>Categories: {plan.includedCategories.join(', ')}</span>
                          </li>
                        )}
                        {(plan.serviceBenefits || []).slice(0, 4).map(b => (
                          <li key={b} className="flex items-start gap-2">
                            <Check size={13} className="text-[#FF1E1E] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={Boolean(isCurrentPlan && activeSubscription?.billingFrequency === effectiveFreq)}
                      onClick={() => {
                        if (activeSubscription && isSubscriptionStatusEntitled(activeSubscription.status)) {
                          setCheckoutTarget({
                            mode: 'plan_change',
                            subscription: activeSubscription,
                            targetPlan: plan,
                            initialFrequency: effectiveFreq,
                          });
                        } else {
                          setCheckoutTarget({
                            mode: 'subscription',
                            plan,
                            initialFrequency: effectiveFreq,
                          });
                        }
                      }}
                      className="w-full bg-[#FF1E1E] hover:bg-red-600 disabled:bg-[#222] disabled:text-neutral-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors"
                    >
                      {isCurrentPlan && activeSubscription?.billingFrequency === effectiveFreq
                        ? 'Active Plan'
                        : activeSubscription && isSubscriptionStatusEntitled(activeSubscription.status)
                          ? `Switch to ${plan.name}`
                          : `Subscribe to ${plan.name}`}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: ONE-TIME PURCHASES */}
      {sectionTab === 'purchases' && (
        <section className="border border-[#222] bg-[#0C0C0C] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B1B1B] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">One-Time Purchases &amp; Permanent Licenses</h3>
              <p className="text-xs text-neutral-400">
                Individual Creative Hub products &amp; studio packages unlocked permanently for {workspace.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('creative-hub')}
              className="border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
            >
              Browse Creative Hub
            </button>
          </div>

          {purchases.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Package size={22} className="mx-auto text-neutral-600" />
              <p className="text-xs text-neutral-400">
                You have no one-time resource or package purchases yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A1A1A] border border-[#1A1A1A]">
              {purchases.map(p => (
                <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">{p.itemTitle}</span>
                      <span className={`border px-2 py-0.5 text-[10px] font-mono uppercase ${statusTone(p.status === 'Active' ? 'Active' : 'Failed')}`}>
                        {p.status} · {p.entitlementType === 'permanent' ? 'Permanent License' : 'Term'}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-neutral-500 tabular-nums">
                      Receipt {p.receiptNumber} · Purchased {p.purchasedAt.slice(0, 10)} · {formatSubscriptionMoney(p.amount, p.currency)}
                    </p>
                  </div>
                  {p.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('creative-hub')}
                      className="border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                    >
                      Access in Creative Hub
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION 4: PAYMENT HISTORY */}
      {sectionTab === 'payments' && (
        <section className="border border-[#222] bg-[#0C0C0C]">
          <div className="px-5 py-4 border-b border-[#1B1B1B]">
            <h3 className="text-sm font-bold text-white">Automated Payment Ledger</h3>
            <p className="text-xs text-neutral-400">
              Verified Paystack and Flutterwave payment attempts, receipts, and refunds.
            </p>
          </div>
          {transactions.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <CreditCard size={22} className="mx-auto text-neutral-600" />
              <p className="text-xs text-neutral-400">No payment transactions recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111] border-b border-[#1E1E1E] text-[10px] font-mono uppercase text-neutral-400">
                  <tr>
                    <th className="py-2.5 px-4">Reference</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Provider</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181818] font-mono tabular-nums">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-[#111]">
                      <td className="py-3 px-4 text-white">
                        <div>{tx.reference}</div>
                        {tx.receiptNumber && (
                          <div className="text-[10px] text-emerald-400">{tx.receiptNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-neutral-300">{tx.description}</td>
                      <td className="py-3 px-4 capitalize text-neutral-300">{tx.provider}</td>
                      <td className="py-3 px-4">
                        <span className={`border px-2 py-0.5 text-[10px] uppercase ${statusTone(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-white">
                        {formatSubscriptionMoney(tx.amount || tx.expectedAmount, tx.currency)}
                      </td>
                      <td className="py-3 px-4 text-right text-neutral-400">
                        {(tx.verifiedAt || tx.createdAt).slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* SECTION 5: COMMERCIAL INVOICES */}
      {sectionTab === 'invoices' && (
        <section className="border border-[#222] bg-[#0C0C0C] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B1B1B] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Commercial Invoices</h3>
              <p className="text-xs text-neutral-400">Pay open invoices online or download official PDF statements.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('invoices')}
              className="border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
            >
              Full Invoices Console
            </button>
          </div>
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-xs text-neutral-500">No invoices issued to this workspace yet.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => {
                const status = deriveClientInvoiceStatus(inv);
                const balance = inv.balanceDue ?? Math.max(0, (inv.totalAmount || 0) - (inv.totalPaid || 0));
                const payable = status !== 'Paid' && status !== 'Void' && balance > 0;
                return (
                  <div key={inv.id} className="border border-[#222] bg-[#111] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{inv.title}</span>
                        <span className={`border px-2 py-0.5 text-[10px] font-mono uppercase ${statusTone(status)}`}>
                          {status}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-neutral-400 tabular-nums">
                        {inv.referenceNo} · Issued {inv.issueDate} · Total {formatMoney(inv.totalAmount, inv.currency)} · Balance {formatMoney(balance, inv.currency)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {payable && (
                        <button
                          type="button"
                          onClick={() => setCheckoutTarget({ mode: 'invoice', invoice: inv })}
                          className="bg-[#FF1E1E] hover:bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                        >
                          Pay Now
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => generateCommercialInvoicePdf(inv, workspace)}
                        className="inline-flex items-center gap-1.5 border border-[#333] bg-[#161616] px-3 py-1.5 text-xs text-white hover:border-white"
                      >
                        <ArrowDownToLine size={12} />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={Boolean(checkoutTarget)}
        onClose={() => setCheckoutTarget(null)}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        target={checkoutTarget}
        onVerifiedSuccess={res => {
          setNotice(res.message);
        }}
      />

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => !cancelling && setCancelTarget(null)}
        maxWidth="md"
        title="Cancel Membership"
        subtitle={cancelTarget ? `${cancelTarget.planName} · ${cancelTarget.billingFrequency}` : undefined}
      >
        {cancelTarget && (
          <form onSubmit={e => void handleConfirmCancel(e)} className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 border border-[#262626] bg-[#111] p-3 cursor-pointer">
                <input
                  type="radio"
                  name="cancel-mode"
                  checked={cancelMode === 'period_end'}
                  onChange={() => setCancelMode('period_end')}
                  className="mt-0.5 accent-[#FF1E1E]"
                />
                <div>
                  <p className="font-semibold text-white">Cancel at End of Billing Period</p>
                  <p className="text-neutral-400 mt-0.5">
                    Keep full membership access through {cancelTarget.currentPeriodEnd?.slice(0, 10)} without future renewals.
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-2.5 border border-[#262626] bg-[#111] p-3 cursor-pointer">
                <input
                  type="radio"
                  name="cancel-mode"
                  checked={cancelMode === 'immediate'}
                  onChange={() => setCancelMode('immediate')}
                  className="mt-0.5 accent-[#FF1E1E]"
                />
                <div>
                  <p className="font-semibold text-white">Cancel Immediately</p>
                  <p className="text-neutral-400 mt-0.5">
                    Ends recurring entitlements now. Any permanent one-time purchases remain unlocked.
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase text-neutral-400 mb-1">
                Reason (Optional)
              </label>
              <textarea
                rows={2}
                maxLength={500}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Share any context for your team…"
                className="w-full border border-[#2C2C2C] bg-[#121212] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#1E1E1E] pt-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelTarget(null)}
                className="border border-[#333] bg-[#141414] px-4 py-2 text-xs text-neutral-300"
              >
                Keep Membership
              </button>
              <button
                type="submit"
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                <XCircle size={13} />
                <span>{cancelling ? 'Cancelling…' : 'Confirm Cancellation'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ClientBillingCenter;
