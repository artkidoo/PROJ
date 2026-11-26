import React, { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { ALL_PRODUCT_CATEGORIES } from '../../lib/creativeProductAccess';
import {
  adminManageSubscriptionAction,
  adminProcessRefundAction,
  adminSaveSubscriptionPlanAction,
  adminSetSubscriptionPlanStatusAction,
  formatSubscriptionMoney,
  resolvePlanPriceForFrequency,
} from '../../lib/subscriptions';
import type {
  BillingFrequency,
  CommercialCurrency,
  CreativeProduct,
  OneTimePurchaseRecord,
  PaymentTransactionRecord,
  PlanAudience,
  PlanStatus,
  PlanVisibility,
  RenewalBehavior,
  ServicePackage,
  SubscriptionEventRecord,
  SubscriptionPlan,
  SubscriptionRecord,
  Workspace,
} from '../../types';
import { Modal } from '../common/Modal';

export interface AdminSubscriptionsPanelProps {
  activeTab: 'plans' | 'subscriptions' | 'payments';
  workspaces: Workspace[];
  onOpenWorkspace: (workspaceId: string) => void;
}

const CURRENCY_OPTIONS: CommercialCurrency[] = ['NGN', 'USD', 'GBP', 'EUR', 'CAD'];
const AUDIENCE_OPTIONS: PlanAudience[] = ['Artist', 'Brand', 'Shared', 'Both'];
const STATUS_OPTIONS: PlanStatus[] = ['Draft', 'Published', 'Inactive', 'Archived'];
const VISIBILITY_OPTIONS: PlanVisibility[] = ['Public', 'Workspace Only', 'Hidden'];

interface PlanFormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  audience: PlanAudience;
  tierName: string;
  currency: CommercialCurrency;
  billingFrequencies: BillingFrequency[];
  monthlyPrice: string;
  annualPrice: string;
  downloadLimitPerPeriod: string;
  usageLimitsSummary: string;
  accessRestrictionsSummary: string;
  serviceBenefitsText: string;
  packageBenefitsText: string;
  includedCategories: string[];
  includedProductIds: string[];
  includedPackageIds: string[];
  durationDays: string;
  trialDays: string;
  gracePeriodDays: string;
  renewalBehavior: RenewalBehavior;
  visibility: PlanVisibility;
  status: PlanStatus;
  featured: boolean;
  terms: string;
}

function emptyPlanForm(): PlanFormState {
  return {
    name: '',
    slug: '',
    description: '',
    audience: 'Shared',
    tierName: 'Pro',
    currency: 'NGN',
    billingFrequencies: ['Monthly', 'Annual'],
    monthlyPrice: '25000',
    annualPrice: '250000',
    downloadLimitPerPeriod: '-1',
    usageLimitsSummary: 'Unlimited verified downloads for active members.',
    accessRestrictionsSummary: 'Personal and workspace commercial usage rights.',
    serviceBenefitsText: 'Priority Creative Studio queue\nInstant ZIP/PDF/SVG resource exports',
    packageBenefitsText: '',
    includedCategories: [],
    includedProductIds: [],
    includedPackageIds: [],
    durationDays: '30',
    trialDays: '0',
    gracePeriodDays: '5',
    renewalBehavior: 'Auto-Renew',
    visibility: 'Public',
    status: 'Draft',
    featured: false,
    terms: '',
  };
}

function planToForm(plan: SubscriptionPlan): PlanFormState {
  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug || '',
    description: plan.description || '',
    audience: plan.audience || 'Shared',
    tierName: plan.tierName || 'Pro',
    currency: plan.currency || 'NGN',
    billingFrequencies: plan.billingFrequencies?.length ? plan.billingFrequencies : ['Monthly'],
    monthlyPrice: String(plan.monthlyPrice ?? 0),
    annualPrice: String(plan.annualPrice ?? 0),
    downloadLimitPerPeriod: String(plan.downloadLimitPerPeriod ?? -1),
    usageLimitsSummary: plan.usageLimitsSummary || '',
    accessRestrictionsSummary: plan.accessRestrictionsSummary || '',
    serviceBenefitsText: (plan.serviceBenefits || []).join('\n'),
    packageBenefitsText: (plan.packageBenefits || []).join('\n'),
    includedCategories: plan.includedCategories || [],
    includedProductIds: plan.includedProductIds || [],
    includedPackageIds: plan.includedPackageIds || [],
    durationDays: String(plan.durationDays ?? 30),
    trialDays: String(plan.trialDays ?? 0),
    gracePeriodDays: String(plan.gracePeriodDays ?? 5),
    renewalBehavior: plan.renewalBehavior || 'Auto-Renew',
    visibility: plan.visibility || 'Public',
    status: plan.status || 'Draft',
    featured: plan.featured === true,
    terms: plan.terms || '',
  };
}

function statusChipStyle(status: string): string {
  switch (status) {
    case 'Published':
    case 'Active':
    case 'Succeeded':
      return 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300';
    case 'Trialing':
    case 'Grace Period':
    case 'Pending':
    case 'Initialized':
      return 'border-amber-700/60 bg-amber-950/40 text-amber-300';
    case 'Past Due':
    case 'Suspended':
    case 'Failed':
    case 'Refunded':
    case 'Partially Refunded':
      return 'border-red-800/60 bg-red-950/40 text-red-300';
    default:
      return 'border-[#2E2E2E] bg-[#161616] text-neutral-300';
  }
}

export const AdminSubscriptionsPanel: React.FC<AdminSubscriptionsPanelProps> = ({
  activeTab,
  workspaces,
  onOpenWorkspace,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [events, setEvents] = useState<SubscriptionEventRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [purchases, setPurchases] = useState<OneTimePurchaseRecord[]>([]);
  const [products, setProducts] = useState<CreativeProduct[]>([]);
  const [services, setServices] = useState<ServicePackage[]>([]);

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Plans state
  const [planSearch, setPlanSearch] = useState('');
  const [planAudienceFilter, setPlanAudienceFilter] = useState<'All' | PlanAudience>('All');
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlanForm);
  const [productPickerQuery, setProductPickerQuery] = useState('');

  // Subscriptions state
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('All');
  const [subDeptFilter, setSubDeptFilter] = useState<'All' | 'Artist' | 'Brand'>('All');
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantWorkspaceId, setGrantWorkspaceId] = useState('');
  const [grantPlanId, setGrantPlanId] = useState('');
  const [grantFreq, setGrantFreq] = useState<BillingFrequency>('Monthly');
  const [grantNote, setGrantNote] = useState('');

  // Payments / Refunds state
  const [txStatusFilter, setTxStatusFilter] = useState('All');
  const [txSearch, setTxSearch] = useState('');
  const [refundTarget, setRefundTarget] = useState<PaymentTransactionRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundRevoke, setRefundRevoke] = useState(true);

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'subscriptionPlans'), orderBy('updatedAt', 'desc')), snap => {
        setPlans(snap.docs.map(d => ({ ...(d.data() as SubscriptionPlan), id: d.id })));
      }),
      onSnapshot(query(collection(db, 'subscriptions'), orderBy('updatedAt', 'desc')), snap => {
        setSubscriptions(snap.docs.map(d => ({ ...(d.data() as SubscriptionRecord), id: d.id })));
      }),
      onSnapshot(
        query(collection(db, 'subscriptionEvents'), orderBy('createdAt', 'desc'), limit(40)),
        snap => {
          setEvents(snap.docs.map(d => ({ ...(d.data() as SubscriptionEventRecord), id: d.id })));
        },
      ),
      onSnapshot(
        query(collection(db, 'paymentTransactions'), orderBy('createdAt', 'desc'), limit(120)),
        snap => {
          setTransactions(snap.docs.map(d => ({ ...(d.data() as PaymentTransactionRecord), id: d.id })));
        },
      ),
      onSnapshot(
        query(collection(db, 'oneTimePurchases'), orderBy('purchasedAt', 'desc'), limit(100)),
        snap => {
          setPurchases(snap.docs.map(d => ({ ...(d.data() as OneTimePurchaseRecord), id: d.id })));
        },
      ),
      onSnapshot(collection(db, 'creativeProducts'), snap => {
        setProducts(snap.docs.map(d => ({ ...(d.data() as CreativeProduct), id: d.id })));
      }),
      onSnapshot(collection(db, 'services'), snap => {
        setServices(snap.docs.map(d => ({ ...(d.data() as ServicePackage), id: d.id })));
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const workspacesById = useMemo(() => new Map(workspaces.map(w => [w.id, w])), [workspaces]);

  const filteredPlans = useMemo(() => {
    const q = planSearch.trim().toLowerCase();
    return plans.filter(p => {
      if (planAudienceFilter !== 'All' && p.audience !== planAudienceFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.tierName || '').toLowerCase().includes(q)
      );
    });
  }, [plans, planSearch, planAudienceFilter]);

  const filteredSubs = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    return subscriptions.filter(s => {
      if (subStatusFilter !== 'All' && s.status !== subStatusFilter) return false;
      if (subDeptFilter !== 'All' && s.department !== subDeptFilter) return false;
      if (!q) return true;
      const wsName = workspacesById.get(s.workspaceId)?.name || '';
      return (
        s.planName.toLowerCase().includes(q) ||
        wsName.toLowerCase().includes(q) ||
        s.workspaceId.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [subscriptions, subSearch, subStatusFilter, subDeptFilter, workspacesById]);

  const selectedSub = useMemo(
    () => subscriptions.find(s => s.id === selectedSubId) || filteredSubs[0] || null,
    [subscriptions, selectedSubId, filteredSubs],
  );

  const filteredTransactions = useMemo(() => {
    const q = txSearch.trim().toLowerCase();
    return transactions.filter(tx => {
      if (txStatusFilter !== 'All' && tx.status !== txStatusFilter) return false;
      if (!q) return true;
      const wsName = workspacesById.get(tx.workspaceId)?.name || '';
      return (
        tx.reference.toLowerCase().includes(q) ||
        (tx.receiptNumber || '').toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q) ||
        wsName.toLowerCase().includes(q)
      );
    });
  }, [transactions, txStatusFilter, txSearch, workspacesById]);

  const pickerProducts = useMemo(() => {
    const q = productPickerQuery.trim().toLowerCase();
    return products
      .filter(p => p.status === 'Published')
      .filter(p => !q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 60);
  }, [products, productPickerQuery]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await adminSaveSubscriptionPlanAction({
        ...(planForm.id ? { id: planForm.id } : {}),
        name: planForm.name.trim(),
        slug: planForm.slug.trim() || undefined,
        description: planForm.description.trim(),
        audience: planForm.audience,
        tierName: planForm.tierName.trim() || 'Membership',
        currency: planForm.currency,
        billingFrequencies: planForm.billingFrequencies.length ? planForm.billingFrequencies : ['Monthly'],
        monthlyPrice: Number(planForm.monthlyPrice || 0),
        annualPrice: Number(planForm.annualPrice || 0),
        downloadLimitPerPeriod: Number(planForm.downloadLimitPerPeriod || -1),
        usageLimitsSummary: planForm.usageLimitsSummary.trim(),
        accessRestrictionsSummary: planForm.accessRestrictionsSummary.trim(),
        serviceBenefits: planForm.serviceBenefitsText.split('\n').map(s => s.trim()).filter(Boolean),
        packageBenefits: planForm.packageBenefitsText.split('\n').map(s => s.trim()).filter(Boolean),
        includedCategories: planForm.includedCategories,
        includedProductIds: planForm.includedProductIds,
        includedPackageIds: planForm.includedPackageIds,
        durationDays: Number(planForm.durationDays || 30),
        trialDays: Number(planForm.trialDays || 0),
        gracePeriodDays: Number(planForm.gracePeriodDays || 5),
        renewalBehavior: planForm.renewalBehavior,
        visibility: planForm.visibility,
        status: planForm.status,
        featured: planForm.featured,
        terms: planForm.terms.trim(),
      });
      setNotice(result.message);
      setPlanModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save subscription plan.');
    } finally {
      setBusy(false);
    }
  };

  const handlePlanStatus = async (planId: string, status: PlanStatus) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await adminSetSubscriptionPlanStatusAction({ planId, status });
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update plan status.');
    } finally {
      setBusy(false);
    }
  };

  const handleAdminSubAction = async (
    sub: SubscriptionRecord,
    action: 'suspend' | 'reactivate' | 'cancel_immediate' | 'sync_entitlements',
  ) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await adminManageSubscriptionAction({
        subscriptionId: sub.id,
        workspaceId: sub.workspaceId,
        action,
      });
      setNotice(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update subscription.');
    } finally {
      setBusy(false);
    }
  };

  const handleGrantMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantWorkspaceId || !grantPlanId) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await adminManageSubscriptionAction({
        workspaceId: grantWorkspaceId,
        action: 'grant',
        planId: grantPlanId,
        billingFrequency: grantFreq,
        note: grantNote.trim() || undefined,
      });
      setNotice(res.message);
      setGrantModalOpen(false);
      setGrantNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to grant membership.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const parsedAmt = refundAmount.trim() ? Number(refundAmount) : undefined;
      const res = await adminProcessRefundAction({
        transactionId: refundTarget.id,
        amount: parsedAmt,
        reason: refundReason.trim() || 'Admin HQ refund issued',
        revokeEntitlement: refundRevoke,
      });
      setNotice(res.message);
      setRefundTarget(null);
      setRefundAmount('');
      setRefundReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process refund.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-200 flex items-center gap-2">
          <AlertCircle size={14} className="text-[#FF1E1E] shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB A: SUBSCRIPTION PLANS & ENTITLEMENTS                            */}
      {/* =================================================================== */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#1E1E1E] bg-[#0C0C0C] p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  value={planSearch}
                  onChange={e => setPlanSearch(e.target.value)}
                  placeholder="Search membership plans..."
                  className="border border-[#2A2A2A] bg-[#141414] pl-8 pr-3 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none w-56"
                />
              </div>
              <select
                value={planAudienceFilter}
                onChange={e => setPlanAudienceFilter(e.target.value as 'All' | PlanAudience)}
                className="border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-xs text-white"
              >
                <option value="All">All Audiences</option>
                {AUDIENCE_OPTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setPlanForm(emptyPlanForm());
                setPlanModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-red-600 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
            >
              <Plus size={13} />
              <span>Create Subscription Plan</span>
            </button>
          </div>

          <div className="border border-[#1E1E1E] bg-[#0C0C0C] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111111] border-b border-[#1E1E1E] text-[10px] font-mono uppercase text-neutral-400">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Plan</th>
                  <th className="py-2.5 px-4 font-normal">Audience</th>
                  <th className="py-2.5 px-4 font-normal text-right">Monthly / Annual</th>
                  <th className="py-2.5 px-4 font-normal">Entitlements</th>
                  <th className="py-2.5 px-4 font-normal">Status</th>
                  <th className="py-2.5 px-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171717]">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-neutral-500">
                      No subscription plans match your current filter. Create your first plan to monetize memberships.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(plan => {
                    const monthly = resolvePlanPriceForFrequency(plan, 'Monthly');
                    const annual = resolvePlanPriceForFrequency(plan, 'Annual');
                    return (
                      <tr key={plan.id} className="hover:bg-[#121212]">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">
                            {plan.name} {plan.featured ? '· Featured' : ''}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            {plan.tierName} · {plan.visibility} · {plan.renewalBehavior}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-neutral-300">{plan.audience}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-white">
                          <div>{plan.billingFrequencies.includes('Monthly') ? formatSubscriptionMoney(monthly.amount, monthly.currency) : '—'}</div>
                          <div className="text-[11px] text-neutral-400">
                            {plan.billingFrequencies.includes('Annual') ? `${formatSubscriptionMoney(annual.amount, annual.currency)} / yr` : '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[11px] font-mono tabular-nums text-neutral-300">
                          {plan.includedCategories?.length || 0} cat · {plan.includedProductIds?.length || 0} prod ·{' '}
                          {plan.includedPackageIds?.length || 0} pkg
                          <div className="text-neutral-500">
                            Cap: {plan.downloadLimitPerPeriod < 0 ? 'Unlimited' : `${plan.downloadLimitPerPeriod}/period`}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block border px-2 py-0.5 text-[10px] font-mono uppercase ${statusChipStyle(plan.status)}`}>
                            {plan.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setPlanForm(planToForm(plan));
                              setPlanModalOpen(true);
                            }}
                            className="border border-[#2E2E2E] bg-[#141414] hover:border-white px-2.5 py-1 text-[11px] text-white"
                          >
                            Edit
                          </button>
                          {plan.status !== 'Published' ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handlePlanStatus(plan.id, 'Published')}
                              className="bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white"
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handlePlanStatus(plan.id, 'Inactive')}
                              className="border border-amber-700/60 bg-amber-950/30 hover:bg-amber-900/40 px-2.5 py-1 text-[11px] text-amber-200"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB B: ACTIVE & HISTORICAL SUBSCRIPTIONS                            */}
      {/* =================================================================== */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#1E1E1E] bg-[#0C0C0C] p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  value={subSearch}
                  onChange={e => setSubSearch(e.target.value)}
                  placeholder="Workspace, plan, or ID..."
                  className="border border-[#2A2A2A] bg-[#141414] pl-8 pr-3 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none w-56"
                />
              </div>
              <select
                value={subStatusFilter}
                onChange={e => setSubStatusFilter(e.target.value)}
                className="border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-xs text-white"
              >
                <option value="All">All Statuses</option>
                {['Active', 'Trialing', 'Grace Period', 'Past Due', 'Suspended', 'Cancelled', 'Expired'].map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <select
                value={subDeptFilter}
                onChange={e => setSubDeptFilter(e.target.value as 'All' | 'Artist' | 'Brand')}
                className="border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-xs text-white"
              >
                <option value="All">All Departments</option>
                <option value="Artist">Artist Dept</option>
                <option value="Brand">Brand Dept</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setGrantWorkspaceId(workspaces[0]?.id || '');
                setGrantPlanId(plans.find(p => p.status === 'Published')?.id || plans[0]?.id || '');
                setGrantModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-red-600 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
            >
              <Sparkles size={13} />
              <span>Grant Manual Membership</span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] gap-5">
            <div className="border border-[#1E1E1E] bg-[#0C0C0C] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111111] border-b border-[#1E1E1E] text-[10px] font-mono uppercase text-neutral-400">
                  <tr>
                    <th className="py-2.5 px-4 font-normal">Workspace</th>
                    <th className="py-2.5 px-4 font-normal">Plan</th>
                    <th className="py-2.5 px-4 font-normal text-right">Amount</th>
                    <th className="py-2.5 px-4 font-normal">Period End</th>
                    <th className="py-2.5 px-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171717]">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-xs text-neutral-500">
                        No workspace subscriptions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map(sub => {
                      const ws = workspacesById.get(sub.workspaceId);
                      const isSel = selectedSub?.id === sub.id;
                      return (
                        <tr
                          key={sub.id}
                          onClick={() => setSelectedSubId(sub.id)}
                          className={`cursor-pointer transition-colors ${isSel ? 'bg-[#171212]' : 'hover:bg-[#121212]'}`}
                        >
                          <td className="py-3 px-4">
                            <p className="font-semibold text-white truncate max-w-[180px]">{ws?.name || sub.workspaceId}</p>
                            <p className="text-[10px] font-mono text-neutral-500">{sub.department} · {sub.provider}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-neutral-200">{sub.planName}</p>
                            <p className="text-[10px] font-mono text-neutral-500">{sub.billingFrequency}</p>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-white">
                            {formatSubscriptionMoney(sub.recurringAmount, sub.currency)}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums text-neutral-400">
                            {sub.currentPeriodEnd?.slice(0, 10) || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block border px-2 py-0.5 text-[10px] font-mono uppercase ${statusChipStyle(sub.status)}`}>
                              {sub.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <aside className="border border-[#1E1E1E] bg-[#0C0C0C] p-5 space-y-4">
              {selectedSub ? (
                <>
                  <div className="border-b border-[#1A1A1A] pb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">Subscription Controls</p>
                      <h3 className="text-sm font-bold text-white truncate">{selectedSub.planName}</h3>
                      <p className="text-[11px] font-mono text-neutral-500 truncate">{selectedSub.id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenWorkspace(selectedSub.workspaceId)}
                      className="inline-flex items-center gap-1 border border-[#2E2E2E] bg-[#141414] px-2.5 py-1 text-[11px] text-white hover:border-white shrink-0"
                    >
                      <span>Workspace</span>
                      <ExternalLink size={11} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
                    <div className="border border-[#1E1E1E] bg-[#111] p-2.5">
                      <span className="block text-[10px] uppercase text-neutral-500">Status</span>
                      <span className="text-white font-semibold">{selectedSub.status}</span>
                    </div>
                    <div className="border border-[#1E1E1E] bg-[#111] p-2.5">
                      <span className="block text-[10px] uppercase text-neutral-500">Downloads Used</span>
                      <span className="text-white font-semibold">
                        {selectedSub.downloadsUsedThisPeriod || 0} / {selectedSub.downloadLimitPerPeriod < 0 ? '∞' : selectedSub.downloadLimitPerPeriod}
                      </span>
                    </div>
                    <div className="border border-[#1E1E1E] bg-[#111] p-2.5">
                      <span className="block text-[10px] uppercase text-neutral-500">Retries</span>
                      <span className="text-white font-semibold">{selectedSub.retryCount} / {selectedSub.maxRetries}</span>
                    </div>
                    <div className="border border-[#1E1E1E] bg-[#111] p-2.5">
                      <span className="block text-[10px] uppercase text-neutral-500">Period End</span>
                      <span className="text-white font-semibold">{selectedSub.currentPeriodEnd?.slice(0, 10) || '—'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleAdminSubAction(selectedSub, 'sync_entitlements')}
                      className="inline-flex items-center gap-1 border border-[#2E2E2E] bg-[#141414] hover:border-white px-2.5 py-1.5 text-[11px] text-white"
                    >
                      <RefreshCw size={11} />
                      <span>Sync Entitlements</span>
                    </button>
                    {selectedSub.status !== 'Active' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleAdminSubAction(selectedSub, 'reactivate')}
                        className="bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-white"
                      >
                        Reactivate
                      </button>
                    )}
                    {selectedSub.status !== 'Suspended' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleAdminSubAction(selectedSub, 'suspend')}
                        className="border border-amber-700/60 bg-amber-950/30 px-2.5 py-1.5 text-[11px] text-amber-200"
                      >
                        Suspend
                      </button>
                    )}
                    {selectedSub.status !== 'Cancelled' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleAdminSubAction(selectedSub, 'cancel_immediate')}
                        className="border border-red-800/60 bg-red-950/30 px-2.5 py-1.5 text-[11px] text-red-200"
                      >
                        Cancel Immediate
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-[#1A1A1A] pt-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Audit Trail</p>
                    <div className="max-h-56 overflow-y-auto space-y-1.5">
                      {(selectedSub.history || []).slice().reverse().map(entry => (
                        <div key={entry.id} className="border border-[#1C1C1C] bg-[#101010] p-2 text-[11px]">
                          <div className="flex items-center justify-between font-mono text-[10px] text-neutral-400">
                            <span className="uppercase text-white">{entry.action}</span>
                            <span>{entry.timestamp.slice(0, 16).replace('T', ' ')}</span>
                          </div>
                          {entry.note && <p className="mt-1 text-neutral-300">{entry.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-neutral-500">Select a subscription row to inspect history and manage entitlements.</p>
              )}
            </aside>
          </div>

          {events.length > 0 && (
            <section className="border border-[#1E1E1E] bg-[#0C0C0C] p-4 space-y-2.5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Recent Subscription Lifecycle Events</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {events.slice(0, 9).map(ev => (
                  <div key={ev.id} className="border border-[#1A1A1A] bg-[#111] p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-neutral-500">
                      <span className="text-[#FF1E1E] uppercase">{ev.eventType.replace(/_/g, ' ')}</span>
                      <span className="tabular-nums">{ev.createdAt.slice(0, 10)}</span>
                    </div>
                    <p className="mt-1 text-neutral-200 line-clamp-2">{ev.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB C: PAYMENT TRANSACTIONS & VERIFIED REFUNDS                      */}
      {/* =================================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#1E1E1E] bg-[#0C0C0C] p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  placeholder="Reference, receipt, workspace..."
                  className="border border-[#2A2A2A] bg-[#141414] pl-8 pr-3 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none w-64"
                />
              </div>
              <select
                value={txStatusFilter}
                onChange={e => setTxStatusFilter(e.target.value)}
                className="border border-[#2A2A2A] bg-[#141414] px-3 py-1.5 text-xs text-white"
              >
                <option value="All">All Payment Statuses</option>
                {['Succeeded', 'Pending', 'Initialized', 'Failed', 'Refunded', 'Partially Refunded'].map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
              {filteredTransactions.length} transaction(s) · {purchases.length} one-time purchase(s)
            </span>
          </div>

          <section className="border border-[#1E1E1E] bg-[#0C0C0C] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111111] border-b border-[#1E1E1E] text-[10px] font-mono uppercase text-neutral-400">
                <tr>
                  <th className="py-2.5 px-4 font-normal">Reference / Receipt</th>
                  <th className="py-2.5 px-4 font-normal">Workspace &amp; Item</th>
                  <th className="py-2.5 px-4 font-normal">Provider</th>
                  <th className="py-2.5 px-4 font-normal text-right">Amount</th>
                  <th className="py-2.5 px-4 font-normal">Status</th>
                  <th className="py-2.5 px-4 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171717]">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-neutral-500">
                      No online checkout transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => {
                    const ws = workspacesById.get(tx.workspaceId);
                    const refundable = tx.status === 'Succeeded' || tx.status === 'Partially Refunded';
                    return (
                      <tr key={tx.id} className="hover:bg-[#121212]">
                        <td className="py-3 px-4 font-mono tabular-nums">
                          <div className="text-white">{tx.reference}</div>
                          <div className="text-[10px] text-neutral-500">
                            {tx.receiptNumber || tx.createdAt.slice(0, 10)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-medium truncate max-w-[240px]">{tx.description}</div>
                          <div className="text-[11px] text-neutral-500 truncate max-w-[240px]">
                            {ws?.name || tx.workspaceId} · {tx.department}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono uppercase text-[11px] text-neutral-300">
                          {tx.provider}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          <div className="text-white">{formatSubscriptionMoney(tx.amount, tx.currency)}</div>
                          {(tx.refundedAmount || 0) > 0 && (
                            <div className="text-[10px] text-red-400">
                              -{formatSubscriptionMoney(tx.refundedAmount || 0, tx.currency)} refunded
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block border px-2 py-0.5 text-[10px] font-mono uppercase ${statusChipStyle(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {refundable && (
                            <button
                              type="button"
                              onClick={() => {
                                setRefundTarget(tx);
                                setRefundAmount(String(Math.max(0, (tx.amount || 0) - (tx.refundedAmount || 0))));
                                setRefundReason('');
                                setRefundRevoke(true);
                              }}
                              className="inline-flex items-center gap-1 border border-red-800/60 bg-red-950/30 hover:bg-red-900/40 px-2.5 py-1 text-[11px] text-red-200 whitespace-nowrap"
                            >
                              <RotateCcw size={11} />
                              <span>Refund</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>

          {purchases.length > 0 && (
            <section className="border border-[#1E1E1E] bg-[#0C0C0C] p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag size={14} className="text-[#FF1E1E]" />
                <span>Verified One-Time Resource &amp; Package Purchases</span>
              </h3>
              <div className="overflow-x-auto border border-[#1A1A1A]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111] border-b border-[#1A1A1A] text-[10px] font-mono uppercase text-neutral-400">
                    <tr>
                      <th className="py-2 px-3 font-normal">Item</th>
                      <th className="py-2 px-3 font-normal">Workspace</th>
                      <th className="py-2 px-3 font-normal">Entitlement</th>
                      <th className="py-2 px-3 font-normal text-right">Amount</th>
                      <th className="py-2 px-3 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#171717]">
                    {purchases.slice(0, 30).map(p => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 text-white font-medium">{p.itemTitle}</td>
                        <td className="py-2.5 px-3 text-neutral-400">{workspacesById.get(p.workspaceId)?.name || p.workspaceId}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-300 uppercase">{p.entitlementType}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-white">
                          {formatSubscriptionMoney(p.amount, p.currency)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block border px-2 py-0.5 text-[10px] font-mono uppercase ${statusChipStyle(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* CREATE / EDIT SUBSCRIPTION PLAN MODAL                               */}
      {/* =================================================================== */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => !busy && setPlanModalOpen(false)}
        maxWidth="xl"
        title={planForm.id ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        subtitle="Configure NGN/USD recurring pricing, resource category & item entitlements, and renewal rules."
      >
        <form onSubmit={e => void handleSavePlan(e)} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="sm:col-span-2 block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Plan Name *</span>
              <input
                required
                value={planForm.name}
                onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="Artist Growth Pass"
                className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white focus:border-[#FF1E1E] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Tier Label</span>
              <input
                value={planForm.tierName}
                onChange={e => setPlanForm({ ...planForm, tierName: e.target.value })}
                placeholder="Pro / Studio"
                className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Description *</span>
            <textarea
              required
              rows={2}
              value={planForm.description}
              onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
              className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white"
            />
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Audience</span>
              <select
                value={planForm.audience}
                onChange={e => setPlanForm({ ...planForm, audience: e.target.value as PlanAudience })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white"
              >
                {AUDIENCE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Currency</span>
              <select
                value={planForm.currency}
                onChange={e => setPlanForm({ ...planForm, currency: e.target.value as CommercialCurrency })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white font-mono"
              >
                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Monthly Price</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={planForm.monthlyPrice}
                onChange={e => setPlanForm({ ...planForm, monthlyPrice: e.target.value })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white font-mono tabular-nums"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Annual Price</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={planForm.annualPrice}
                onChange={e => setPlanForm({ ...planForm, annualPrice: e.target.value })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white font-mono tabular-nums"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Download Cap (-1 = Unl.)</span>
              <input
                type="number"
                min={-1}
                value={planForm.downloadLimitPerPeriod}
                onChange={e => setPlanForm({ ...planForm, downloadLimitPerPeriod: e.target.value })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white font-mono"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Trial Days</span>
              <input
                type="number"
                min={0}
                value={planForm.trialDays}
                onChange={e => setPlanForm({ ...planForm, trialDays: e.target.value })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white font-mono"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Grace Days</span>
              <input
                type="number"
                min={0}
                value={planForm.gracePeriodDays}
                onChange={e => setPlanForm({ ...planForm, gracePeriodDays: e.target.value })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white font-mono"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Renewal Behavior</span>
              <select
                value={planForm.renewalBehavior}
                onChange={e => setPlanForm({ ...planForm, renewalBehavior: e.target.value as RenewalBehavior })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white"
              >
                <option value="Auto-Renew">Auto-Renew</option>
                <option value="Manual Renewal">Manual Renewal</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-[#1E1E1E] bg-[#101010] p-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Visibility</span>
              <select
                value={planForm.visibility}
                onChange={e => setPlanForm({ ...planForm, visibility: e.target.value as PlanVisibility })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white"
              >
                {VISIBILITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Status</span>
              <select
                value={planForm.status}
                onChange={e => setPlanForm({ ...planForm, status: e.target.value as PlanStatus })}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-2.5 py-2 text-white"
              >
                {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </label>
            <div className="flex flex-col justify-center gap-2 pt-3">
              <div className="flex items-center gap-3">
                {(['Monthly', 'Annual'] as const).map(freq => (
                  <label key={freq} className="inline-flex items-center gap-1.5 text-neutral-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.billingFrequencies.includes(freq)}
                      onChange={e => {
                        const next = e.target.checked
                          ? Array.from(new Set([...planForm.billingFrequencies, freq]))
                          : planForm.billingFrequencies.filter(f => f !== freq);
                        setPlanForm({ ...planForm, billingFrequencies: next });
                      }}
                      className="accent-[#FF1E1E]"
                    />
                    <span>{freq}</span>
                  </label>
                ))}
              </div>
              <label className="inline-flex items-center gap-1.5 text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.featured}
                  onChange={e => setPlanForm({ ...planForm, featured: e.target.checked })}
                  className="accent-[#FF1E1E]"
                />
                <span>Featured Plan</span>
              </label>
            </div>
          </div>

          <div className="space-y-2 border border-[#1E1E1E] bg-[#101010] p-3">
            <span className="block text-[10px] font-mono uppercase text-neutral-400">
              Included Creative Resource Categories ({planForm.includedCategories.length} selected)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {ALL_PRODUCT_CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-2 text-[11px] text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.includedCategories.includes(cat)}
                    onChange={e => {
                      const next = e.target.checked
                        ? [...planForm.includedCategories, cat]
                        : planForm.includedCategories.filter(c => c !== cat);
                      setPlanForm({ ...planForm, includedCategories: next });
                    }}
                    className="accent-[#FF1E1E]"
                  />
                  <span className="truncate">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 border border-[#1E1E1E] bg-[#101010] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase text-neutral-400">
                Specific Included Creative Products ({planForm.includedProductIds.length} selected)
              </span>
              <input
                value={productPickerQuery}
                onChange={e => setProductPickerQuery(e.target.value)}
                placeholder="Filter published resources..."
                className="border border-[#2A2A2A] bg-[#141414] px-2.5 py-1 text-[11px] text-white w-52"
              />
            </div>
            <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {pickerProducts.map(prod => (
                <label key={prod.id} className="flex items-center gap-2 text-[11px] text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.includedProductIds.includes(prod.id)}
                    onChange={e => {
                      const next = e.target.checked
                        ? [...planForm.includedProductIds, prod.id]
                        : planForm.includedProductIds.filter(id => id !== prod.id);
                      setPlanForm({ ...planForm, includedProductIds: next });
                    }}
                    className="accent-[#FF1E1E]"
                  />
                  <span className="truncate">{prod.title}</span>
                </label>
              ))}
            </div>
          </div>

          {services.length > 0 && (
            <div className="space-y-2 border border-[#1E1E1E] bg-[#101010] p-3">
              <span className="block text-[10px] font-mono uppercase text-neutral-400">
                Included Studio Service Packages ({planForm.includedPackageIds.length} selected)
              </span>
              <div className="max-h-28 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {services.filter(s => s.isActive).map(pkg => (
                  <label key={pkg.id} className="flex items-center gap-2 text-[11px] text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planForm.includedPackageIds.includes(pkg.id)}
                      onChange={e => {
                        const next = e.target.checked
                          ? [...planForm.includedPackageIds, pkg.id]
                          : planForm.includedPackageIds.filter(id => id !== pkg.id);
                        setPlanForm({ ...planForm, includedPackageIds: next });
                      }}
                      className="accent-[#FF1E1E]"
                    />
                    <span className="truncate">{pkg.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Service &amp; Membership Benefits (one per line)</span>
            <textarea
              rows={3}
              value={planForm.serviceBenefitsText}
              onChange={e => setPlanForm({ ...planForm, serviceBenefitsText: e.target.value })}
              className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white font-mono"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-[#1E1E1E] pt-3">
            <button
              type="button"
              onClick={() => setPlanModalOpen(false)}
              className="border border-[#2E2E2E] bg-[#141414] px-4 py-2 text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="bg-[#FF1E1E] hover:bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Saving Plan…' : 'Save Subscription Plan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* GRANT MANUAL MEMBERSHIP MODAL                                       */}
      {/* =================================================================== */}
      <Modal
        isOpen={grantModalOpen}
        onClose={() => !busy && setGrantModalOpen(false)}
        maxWidth="md"
        title="Grant Manual Workspace Membership"
        subtitle="Creates an Active subscription record and immediately syncs workspace resource entitlements."
      >
        <form onSubmit={e => void handleGrantMembership(e)} className="space-y-4 text-xs">
          <label className="block">
            <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Target Workspace *</span>
            <select
              required
              value={grantWorkspaceId}
              onChange={e => setGrantWorkspaceId(e.target.value)}
              className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white"
            >
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id}>{ws.name} ({ws.type})</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Subscription Plan *</span>
              <select
                required
                value={grantPlanId}
                onChange={e => setGrantPlanId(e.target.value)}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.currency})</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Billing Cycle</span>
              <select
                value={grantFreq}
                onChange={e => setGrantFreq(e.target.value as BillingFrequency)}
                className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white"
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Admin Note</span>
            <input
              value={grantNote}
              onChange={e => setGrantNote(e.target.value)}
              placeholder="e.g. Executive studio retainer onboarding"
              className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setGrantModalOpen(false)} className="border border-[#2E2E2E] px-4 py-2 text-neutral-300">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="bg-[#FF1E1E] px-4 py-2 font-semibold text-white">
              {busy ? 'Granting…' : 'Grant & Sync Entitlements'}
            </button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* VERIFIED REFUND MODAL                                               */}
      {/* =================================================================== */}
      <Modal
        isOpen={Boolean(refundTarget)}
        onClose={() => !busy && setRefundTarget(null)}
        maxWidth="md"
        title="Process Gateway Refund"
        subtitle={refundTarget ? `${refundTarget.reference} · ${refundTarget.provider.toUpperCase()}` : undefined}
      >
        {refundTarget && (
          <form onSubmit={e => void handleSubmitRefund(e)} className="space-y-4 text-xs">
            <div className="border border-[#262626] bg-[#111] p-3 font-mono tabular-nums space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-400">Settled Amount</span>
                <span className="text-white">{formatSubscriptionMoney(refundTarget.amount, refundTarget.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Already Refunded</span>
                <span className="text-neutral-300">{formatSubscriptionMoney(refundTarget.refundedAmount || 0, refundTarget.currency)}</span>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Refund Amount ({refundTarget.currency})</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={Math.max(0, (refundTarget.amount || 0) - (refundTarget.refundedAmount || 0))}
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                required
                className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white font-mono tabular-nums"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-mono uppercase text-neutral-500">Refund Reason *</span>
              <input
                required
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Duplicate billing or client cancellation request"
                className="w-full border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-white"
              />
            </label>

            <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={refundRevoke}
                onChange={e => setRefundRevoke(e.target.checked)}
                className="accent-[#FF1E1E]"
              />
              <span>Revoke linked membership or purchase entitlement on full refund</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setRefundTarget(null)} className="border border-[#2E2E2E] px-4 py-2 text-neutral-300">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="bg-[#FF1E1E] px-4 py-2 font-semibold text-white">
                {busy ? 'Processing Refund…' : 'Confirm Refund'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminSubscriptionsPanel;
