/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Unified Finance Console (Strictly Firestore-Backed)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  FileText,
  Layers,
  Receipt,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';
import {
  deriveClientInvoiceStatus,
  formatMoney,
} from '../../lib/financeDocuments';
import {
  computeSubscriptionAnalytics,
  formatSubscriptionMoney,
} from '../../lib/subscriptions';
import {
  computeDepartmentFinanceSummary,
  type FinanceTab,
} from '../../lib/adminHQNavigation';
import type {
  ClientProfile,
  InvoiceRecord,
  OneTimePurchaseRecord,
  PaymentTransactionRecord,
  ProposalRecord,
  SubscriptionPlan,
  SubscriptionRecord,
  Workspace,
} from '../../types';
import { AdminInvoicesManagement } from './AdminInvoicesManagement';
import { AdminProposalsManagement } from './AdminProposalsManagement';
import { AdminSubscriptionsPanel } from './AdminSubscriptionsPanel';

interface AdminFinanceConsoleProps {
  subTab: FinanceTab;
  onSubTabChange: (subTab: FinanceTab) => void;
  selectedInvoiceId: string;
  onSelectedInvoiceChange: (invoiceId: string) => void;
  selectedProposalId: string;
  onSelectedProposalChange: (proposalId: string) => void;
  onOpenWorkspace: (workspaceId: string) => void;
}

const FINANCE_TABS: {
  id: FinanceTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'overview', label: 'Finance Overview', icon: BarChart3 },
  { id: 'subscriptions', label: 'Subscriptions', icon: Sparkles },
  { id: 'plans', label: 'Membership Plans', icon: Layers },
  { id: 'payments', label: 'Online Payments & Refunds', icon: CreditCard },
  { id: 'invoices', label: 'Invoices & Payments', icon: Receipt },
  { id: 'proposals', label: 'Proposals & Quotations', icon: FileText },
];

export const AdminFinanceConsole: React.FC<AdminFinanceConsoleProps> = ({
  subTab,
  onSubTabChange,
  selectedInvoiceId,
  onSelectedInvoiceChange,
  selectedProposalId,
  onSelectedProposalChange,
  onOpenWorkspace,
}) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [purchases, setPurchases] = useState<OneTimePurchaseRecord[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeTab: FinanceTab = FINANCE_TABS.some(t => t.id === subTab)
    ? subTab
    : 'overview';

  useEffect(() => {
    if (!firebaseUser || !canAccessAdminCenter) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const unsubs = [
      onSnapshot(
        query(collection(db, 'invoices'), orderBy('updatedAt', 'desc')),
        snap => {
          setInvoices(snap.docs.map(d => ({ ...(d.data() as InvoiceRecord), id: d.id })));
          setLoading(false);
        },
        err => {
          setError(err?.message || 'Unable to load invoices.');
          setLoading(false);
        },
      ),
      onSnapshot(
        query(collection(db, 'proposals'), orderBy('updatedAt', 'desc')),
        snap => {
          setProposals(snap.docs.map(d => ({ ...(d.data() as ProposalRecord), id: d.id })));
        },
        err => setError(prev => prev || err?.message || 'Unable to load proposals.'),
      ),
      onSnapshot(
        collection(db, 'workspaces'),
        snap => {
          setWorkspaces(snap.docs.map(d => ({ ...(d.data() as Workspace), id: d.id })));
        },
        () => {},
      ),
      onSnapshot(
        collection(db, 'clientProfiles'),
        snap => {
          setClients(snap.docs.map(d => ({ ...(d.data() as ClientProfile), uid: d.id })));
        },
        () => {},
      ),
      onSnapshot(
        collection(db, 'subscriptions'),
        snap => {
          setSubscriptions(snap.docs.map(d => ({ ...(d.data() as SubscriptionRecord), id: d.id })));
        },
        () => {},
      ),
      onSnapshot(
        collection(db, 'paymentTransactions'),
        snap => {
          setTransactions(snap.docs.map(d => ({ ...(d.data() as PaymentTransactionRecord), id: d.id })));
        },
        () => {},
      ),
      onSnapshot(
        collection(db, 'oneTimePurchases'),
        snap => {
          setPurchases(snap.docs.map(d => ({ ...(d.data() as OneTimePurchaseRecord), id: d.id })));
        },
        () => {},
      ),
      onSnapshot(
        collection(db, 'subscriptionPlans'),
        snap => {
          setPlans(snap.docs.map(d => ({ ...(d.data() as SubscriptionPlan), id: d.id })));
        },
        () => {},
      ),
    ];

    return () => unsubs.forEach(u => u());
  }, [firebaseUser, canAccessAdminCenter]);

  const workspacesById = useMemo(
    () => new Map(workspaces.map(w => [w.id, w])),
    [workspaces],
  );
  const clientsByUid = useMemo(
    () => new Map(clients.map(c => [c.uid, c])),
    [clients],
  );

  const summary = useMemo(
    () => computeDepartmentFinanceSummary(invoices, proposals, workspacesById, clientsByUid),
    [invoices, proposals, workspacesById, clientsByUid],
  );

  const subscriptionAnalytics = useMemo(
    () => computeSubscriptionAnalytics({ subscriptions, transactions, purchases }),
    [subscriptions, transactions, purchases],
  );

  const attentionInvoices = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return invoices
      .map(inv => ({
        invoice: inv,
        derivedStatus: deriveClientInvoiceStatus(inv, todayIso),
      }))
      .filter(
        entry =>
          entry.derivedStatus === 'Overdue' ||
          entry.derivedStatus === 'Issued' ||
          entry.derivedStatus === 'Partially Paid',
      )
      .slice(0, 6);
  }, [invoices]);

  const activeProposals = useMemo(
    () =>
      proposals
        .filter(p =>
          ['Issued', 'Sent', 'Under Review', 'Revision Requested', 'Approved'].includes(p.status),
        )
        .slice(0, 6),
    [proposals],
  );

  if (!firebaseUser || !canAccessAdminCenter) {
    return (
      <div className="border border-red-900/50 bg-[#0C0C0C] p-6 text-xs text-red-300 flex items-center gap-3">
        <ShieldAlert size={16} className="text-[#FF1E1E]" />
        <span>Authorized platform administrator access is required to access Finance.</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sub-Navigation */}
      <div
        role="tablist"
        aria-label="Finance subsections"
        className="border border-[#1E1E1E] bg-[#0B0B0B] px-2 pt-2 flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex flex-wrap items-center gap-1">
          {FINANCE_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSubTabChange(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#FF1E1E] bg-[#141414] text-white'
                    : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#101010]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#FF1E1E]' : 'text-neutral-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <span className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          Firestore Commercial Source of Truth
        </span>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {error && (
            <div role="alert" className="border border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Top Finance KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => onSubTabChange('invoices')}
              className="text-left border border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333] p-4 transition-colors"
            >
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Active Invoices</span>
                <Receipt size={15} className="text-[#FF1E1E]" />
              </div>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
                {loading ? '—' : summary.activeInvoicesCount}
              </p>
              <p className="mt-1 text-xs text-neutral-500 font-mono tabular-nums">
                {summary.paidInvoicesCount} paid · {summary.overdueInvoicesCount} overdue
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSubTabChange('invoices')}
              className="text-left border border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333] p-4 transition-colors"
            >
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Department Split</span>
                <BarChart3 size={15} className="text-neutral-400" />
              </div>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
                {summary.artistInvoicesCount} / {summary.brandInvoicesCount}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Artist Dept vs Brand Dept invoices
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSubTabChange('proposals')}
              className="text-left border border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333] p-4 transition-colors"
            >
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Commercial Proposals</span>
                <FileText size={15} className="text-blue-400" />
              </div>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
                {loading ? '—' : summary.totalProposals}
              </p>
              <p className="mt-1 text-xs text-neutral-500 font-mono tabular-nums">
                {summary.awaitingProposalsCount} pending client · {summary.approvedProposalsCount} approved
              </p>
            </button>

            <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-4">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider">Overdue Attention</span>
                <AlertTriangle
                  size={15}
                  className={summary.overdueInvoicesCount > 0 ? 'text-amber-400' : 'text-emerald-400'}
                />
              </div>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
                {summary.overdueInvoicesCount}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {summary.overdueInvoicesCount === 0
                  ? 'All active receivables current'
                  : 'Invoices past due date'}
              </p>
            </div>
          </div>

          {/* Multi-Currency Financial Summary */}
          <section className="border border-[#1E1E1E] bg-[#0C0C0C]">
            <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Currency &amp; Department Financial Ledger</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Aggregated strictly from Firestore `/invoices` and `/proposals` by currency without cross-currency distortion.
                </p>
              </div>
            </div>

            {summary.byCurrency.length === 0 ? (
              <div className="p-6 text-xs text-neutral-500">
                No Firestore invoices or proposals recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111111] border-b border-[#1E1E1E] text-neutral-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 font-normal">Currency</th>
                      <th className="py-2.5 px-4 font-normal text-right">Total Invoiced</th>
                      <th className="py-2.5 px-4 font-normal text-right">Collected</th>
                      <th className="py-2.5 px-4 font-normal text-right">Outstanding</th>
                      <th className="py-2.5 px-4 font-normal text-right">Artist Invoiced</th>
                      <th className="py-2.5 px-4 font-normal text-right">Brand Invoiced</th>
                      <th className="py-2.5 px-4 font-normal text-right">Proposal Pipeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#171717] font-mono tabular-nums">
                    {summary.byCurrency.map(row => (
                      <tr key={row.currency} className="hover:bg-[#121212]">
                        <td className="py-3 px-4 font-bold text-white">{row.currency}</td>
                        <td className="py-3 px-4 text-right text-white">
                          {formatMoney(row.invoiced, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400">
                          {formatMoney(row.collected, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-300">
                          {formatMoney(row.outstanding, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-300">
                          {formatMoney(row.artistInvoiced, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-300">
                          {formatMoney(row.brandInvoiced, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-300">
                          {formatMoney(row.quotedPipeline, row.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recurring Revenue & Subscription Monetization Analytics */}
          <section className="border border-[#1E1E1E] bg-[#0C0C0C]">
            <div className="px-5 py-4 border-b border-[#1E1E1E] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Recurring Revenue &amp; Online Monetization</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Normalized MRR/ARR tracked separately from historical settled cash, one-time purchases, and refunds.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onSubTabChange('subscriptions')}
                  className="border border-[#2E2E2E] bg-[#141414] hover:border-white px-3 py-1.5 text-white"
                >
                  Manage Subscriptions ({subscriptionAnalytics.activeSubscriptions})
                </button>
                <button
                  type="button"
                  onClick={() => onSubTabChange('plans')}
                  className="bg-[#FF1E1E] hover:bg-red-600 px-3 py-1.5 font-semibold text-white"
                >
                  Membership Plans ({plans.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 border-b border-[#1A1A1A]">
              <div className="border border-[#1E1E1E] bg-[#111] p-3.5">
                <span className="block text-[10px] font-mono uppercase text-neutral-500">Active Subscribers</span>
                <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-white">
                  {subscriptionAnalytics.activeSubscriptions}
                </p>
                <p className="mt-1 text-[11px] font-mono text-neutral-400 tabular-nums">
                  {subscriptionAnalytics.artistSubscribers} Artist · {subscriptionAnalytics.brandSubscribers} Brand
                </p>
              </div>
              <div className="border border-[#1E1E1E] bg-[#111] p-3.5">
                <span className="block text-[10px] font-mono uppercase text-neutral-500">Payment Success Rate</span>
                <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-emerald-400">
                  {subscriptionAnalytics.paymentSuccessRate}%
                </p>
                <p className="mt-1 text-[11px] font-mono text-neutral-400 tabular-nums">
                  {subscriptionAnalytics.succeededTransactions} settled · {subscriptionAnalytics.failedTransactions} failed
                </p>
              </div>
              <div className="border border-[#1E1E1E] bg-[#111] p-3.5">
                <span className="block text-[10px] font-mono uppercase text-neutral-500">Churn &amp; Suspended</span>
                <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-white">
                  {subscriptionAnalytics.churnRate}%
                </p>
                <p className="mt-1 text-[11px] font-mono text-neutral-400 tabular-nums">
                  {subscriptionAnalytics.pastDueOrGraceCount} grace/past due · {subscriptionAnalytics.refundedTransactions} refunds
                </p>
              </div>
              <div className="border border-[#1E1E1E] bg-[#111] p-3.5">
                <span className="block text-[10px] font-mono uppercase text-neutral-500">One-Time Purchases</span>
                <p className="mt-1.5 text-xl font-bold font-mono tabular-nums text-white">
                  {purchases.filter(p => p.status === 'Active').length}
                </p>
                <p className="mt-1 text-[11px] font-mono text-neutral-400">
                  Lifetime resource &amp; package unlocks
                </p>
              </div>
            </div>

            {subscriptionAnalytics.byCurrency.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111111] border-b border-[#1E1E1E] text-[10px] font-mono uppercase text-neutral-400">
                    <tr>
                      <th className="py-2.5 px-4 font-normal">Currency</th>
                      <th className="py-2.5 px-4 font-normal text-right">MRR</th>
                      <th className="py-2.5 px-4 font-normal text-right">ARR</th>
                      <th className="py-2.5 px-4 font-normal text-right">Subscription Cash</th>
                      <th className="py-2.5 px-4 font-normal text-right">One-Time Cash</th>
                      <th className="py-2.5 px-4 font-normal text-right">Net Cash Collected</th>
                      <th className="py-2.5 px-4 font-normal text-right">Refunded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#171717] font-mono tabular-nums">
                    {subscriptionAnalytics.byCurrency.map(row => (
                      <tr key={row.currency} className="hover:bg-[#121212]">
                        <td className="py-3 px-4 font-bold text-white">{row.currency}</td>
                        <td className="py-3 px-4 text-right text-emerald-400">
                          {formatSubscriptionMoney(row.mrr, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-200">
                          {formatSubscriptionMoney(row.arr, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-300">
                          {formatSubscriptionMoney(row.subscriptionCash, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-300">
                          {formatSubscriptionMoney(row.oneTimeCash, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-white">
                          {formatSubscriptionMoney(row.cashCollected, row.currency)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-400">
                          {formatSubscriptionMoney(row.refundedTotal, row.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(subscriptionAnalytics.topPlans.length > 0 || subscriptionAnalytics.topOneTimeItems.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 border-t border-[#1A1A1A]">
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Top Active Membership Plans</p>
                  {subscriptionAnalytics.topPlans.length === 0 ? (
                    <p className="text-xs text-neutral-500">No active recurring memberships yet.</p>
                  ) : (
                    subscriptionAnalytics.topPlans.map(tp => (
                      <div key={tp.planId} className="flex items-center justify-between border border-[#1C1C1C] bg-[#111] px-3 py-2 text-xs">
                        <span className="text-white font-medium">{tp.planName}</span>
                        <span className="font-mono tabular-nums text-emerald-400">
                          {tp.activeCount} active · {formatSubscriptionMoney(tp.mrr, tp.currency)}/mo
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Top One-Time Purchases</p>
                  {subscriptionAnalytics.topOneTimeItems.length === 0 ? (
                    <p className="text-xs text-neutral-500">No one-time purchases recorded yet.</p>
                  ) : (
                    subscriptionAnalytics.topOneTimeItems.map(item => (
                      <div key={item.itemId} className="flex items-center justify-between border border-[#1C1C1C] bg-[#111] px-3 py-2 text-xs">
                        <span className="text-white font-medium truncate pr-2">{item.itemTitle}</span>
                        <span className="font-mono tabular-nums text-neutral-300 shrink-0">
                          {item.purchaseCount}× · {formatSubscriptionMoney(item.totalRevenue, item.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Action Queues: Receivables & Active Proposals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="border border-[#1E1E1E] bg-[#0C0C0C]">
              <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Invoices &amp; Receivables Queue</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Sent, partially paid, and overdue invoices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSubTabChange('invoices')}
                  className="text-xs font-medium text-[#FF1E1E] hover:text-red-400 inline-flex items-center gap-1"
                >
                  <span>Manage Invoices</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="divide-y divide-[#171717]">
                {attentionInvoices.length === 0 ? (
                  <div className="p-6 text-xs text-neutral-500 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>No outstanding invoices awaiting payment.</span>
                  </div>
                ) : (
                  attentionInvoices.map(({ invoice, derivedStatus }) => (
                    <button
                      key={invoice.id}
                      type="button"
                      onClick={() => {
                        onSelectedInvoiceChange(invoice.id);
                        onSubTabChange('invoices');
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-[#121212] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {invoice.referenceNo} · {invoice.title || invoice.recipientName}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          {workspacesById.get(invoice.workspaceId)?.name || invoice.recipientName} · Due{' '}
                          {invoice.dueDate || '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono tabular-nums text-white">
                          {formatMoney(invoice.balanceDue ?? invoice.totalAmount, invoice.currency)}
                        </p>
                        <p
                          className={`text-[10px] font-mono uppercase ${
                            derivedStatus === 'Overdue' ? 'text-[#FF1E1E]' : 'text-amber-300'
                          }`}
                        >
                          {derivedStatus}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="border border-[#1E1E1E] bg-[#0C0C0C]">
              <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Active Commercial Proposals</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Issued quotations and client acceptance status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSubTabChange('proposals')}
                  className="text-xs font-medium text-[#FF1E1E] hover:text-red-400 inline-flex items-center gap-1"
                >
                  <span>Manage Proposals</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="divide-y divide-[#171717]">
                {activeProposals.length === 0 ? (
                  <div className="p-6 text-xs text-neutral-500">
                    No active proposals awaiting client approval.
                  </div>
                ) : (
                  activeProposals.map(proposal => (
                    <button
                      key={proposal.id}
                      type="button"
                      onClick={() => {
                        onSelectedProposalChange(proposal.id);
                        onSubTabChange('proposals');
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-[#121212] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {proposal.referenceNo} · {proposal.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          {workspacesById.get(proposal.workspaceId)?.name || proposal.recipientName} ·{' '}
                          {proposal.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono tabular-nums text-white">
                          {formatMoney(proposal.totalAmount, proposal.currency)}
                        </p>
                        <p
                          className={`text-[10px] font-mono uppercase ${
                            proposal.status === 'Approved' ? 'text-emerald-400' : 'text-blue-300'
                          }`}
                        >
                          {proposal.status}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {(activeTab === 'subscriptions' || activeTab === 'plans' || activeTab === 'payments') && (
        <AdminSubscriptionsPanel
          activeTab={activeTab}
          workspaces={workspaces}
          onOpenWorkspace={onOpenWorkspace}
        />
      )}

      {activeTab === 'invoices' && (
        <AdminInvoicesManagement
          initialSelectedId={selectedInvoiceId}
          onSelectedIdChange={onSelectedInvoiceChange}
          onOpenWorkspace={onOpenWorkspace}
        />
      )}

      {activeTab === 'proposals' && (
        <AdminProposalsManagement
          initialSelectedId={selectedProposalId}
          onSelectedIdChange={onSelectedProposalChange}
          onOpenWorkspace={onOpenWorkspace}
        />
      )}
    </div>
  );
};

export default AdminFinanceConsole;
