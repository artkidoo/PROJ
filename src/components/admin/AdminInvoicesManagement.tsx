/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Admin Invoices & Payments Management (Firestore + Cloud Functions)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useApp } from '../../context/AppContext';
import { db, functions, logFirestoreError, OperationType } from '../../lib/firebase';
import {
  calculateCommercialTotals,
  COMMERCIAL_CURRENCIES,
  deriveClientInvoiceStatus,
  formatMoney,
} from '../../lib/financeDocuments';
import {
  buildInvoiceCallablePayloadFromLegacy,
  buildNonCommercialWorkspaceDocPayloadFromLegacy,
  buildProposalCallablePayloadFromLegacy,
  LegacyLocalDocumentInspection,
  readLegacyLocalStorageFinanceRecords,
} from '../../lib/legacyFinanceMigration';
import { generateCommercialInvoicePdf } from '../../utils/pdfGenerator';
import type {
  ClientProfile,
  ClientProject,
  CommercialCurrency,
  DocumentItem,
  InvoiceRecord,
  InvoiceStatus,
  PaymentRecord,
  Workspace,
} from '../../types';
import {
  AlertTriangle,
  Archive,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  Info,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

interface AdminInvoicesManagementProps {
  initialSelectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  onOpenWorkspace?: (workspaceId: string) => void;
}

export const AdminInvoicesManagement: React.FC<AdminInvoicesManagementProps> = ({
  initialSelectedId,
  onSelectedIdChange,
  onOpenWorkspace,
}) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialSelectedId || '');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string>('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetInvoiceForPayment, setTargetInvoiceForPayment] = useState<InvoiceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Legacy localStorage importer state
  const [showLegacyImporter, setShowLegacyImporter] = useState(false);
  const [legacyRecords, setLegacyRecords] = useState<LegacyLocalDocumentInspection[]>([]);
  const [legacyWorkspaceMap, setLegacyWorkspaceMap] = useState<Record<string, string>>({});
  const [importedLegacyIds, setImportedLegacyIds] = useState<Record<string, boolean>>({});
  const [importingLegacyId, setImportingLegacyId] = useState<string>('');

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<string>('0');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('Wire Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Invoice form state
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceReferenceNo, setInvoiceReferenceNo] = useState('');
  const [invoiceWorkspaceId, setInvoiceWorkspaceId] = useState('');
  const [invoiceProjectId, setInvoiceProjectId] = useState('');
  const [invoiceCurrency, setInvoiceCurrency] = useState<CommercialCurrency>('USD');
  const [invoiceRecipientName, setInvoiceRecipientName] = useState('');
  const [invoiceRecipientOrg, setInvoiceRecipientOrg] = useState('');
  const [invoiceRecipientEmail, setInvoiceRecipientEmail] = useState('');
  const [invoiceRecipientAddress, setInvoiceRecipientAddress] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [invoiceBodyContent, setInvoiceBodyContent] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<DocumentItem[]>([
    { description: 'Creative Production & Direction Services', quantity: 1, unitPrice: 2500, total: 2500 },
  ]);
  const [invoiceTaxRate, setInvoiceTaxRate] = useState<string>('0');
  const [invoiceDiscountAmount, setInvoiceDiscountAmount] = useState<string>('0');
  const [invoicePaymentTerms, setInvoicePaymentTerms] = useState('Net 30 Days from invoice issue');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>('Issued');

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedInvoiceId(initialSelectedId);
    }
  }, [initialSelectedId]);

  useEffect(() => {
    if (!firebaseUser || !canAccessAdminCenter) {
      setInvoices([]);
      setWorkspaces([]);
      setClientProfiles([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedbackError('');

    const unsubInvoices = onSnapshot(
      query(collection(db, 'invoices'), orderBy('updatedAt', 'desc')),
      snapshot => {
        setInvoices(snapshot.docs.map(d => ({ ...(d.data() as InvoiceRecord), id: d.id })));
        setLoading(false);
      },
      err => {
        logFirestoreError(err, OperationType.LIST, 'invoices');
        setFeedbackError(err?.message || 'Unable to load invoices due to missing or insufficient permissions.');
        setLoading(false);
      },
    );

    const unsubWorkspaces = onSnapshot(
      collection(db, 'workspaces'),
      snapshot => {
        setWorkspaces(snapshot.docs.map(d => ({ ...(d.data() as Workspace), id: d.id })));
      },
      err => {
        logFirestoreError(err, OperationType.LIST, 'workspaces');
      },
    );

    const unsubProfiles = onSnapshot(
      collection(db, 'clientProfiles'),
      snapshot => {
        setClientProfiles(snapshot.docs.map(d => ({ ...(d.data() as ClientProfile), uid: d.id })));
      },
      err => {
        logFirestoreError(err, OperationType.LIST, 'clientProfiles');
      },
    );

    const unsubProjects = onSnapshot(
      collection(db, 'clientProjects'),
      snapshot => {
        setProjects(snapshot.docs.map(d => ({ ...(d.data() as ClientProject), id: d.id })));
      },
      err => {
        logFirestoreError(err, OperationType.LIST, 'clientProjects');
      },
    );

    return () => {
      unsubInvoices();
      unsubWorkspaces();
      unsubProfiles();
      unsubProjects();
    };
  }, [firebaseUser, canAccessAdminCenter]);

  const refreshLegacyInspector = () => {
    const detected = readLegacyLocalStorageFinanceRecords(workspaces);
    setLegacyRecords(detected);
    setLegacyWorkspaceMap(prev => {
      const next = { ...prev };
      detected.forEach(item => {
        if (!next[item.id] && item.suggestedFirestoreWorkspaceId) {
          next[item.id] = item.suggestedFirestoreWorkspaceId;
        }
      });
      return next;
    });
  };

  useEffect(() => {
    refreshLegacyInspector();
  }, [workspaces]);

  const workspaceMap = useMemo(() => new Map(workspaces.map(w => [w.id, w])), [workspaces]);
  const profileMap = useMemo(() => new Map(clientProfiles.map(p => [p.uid, p])), [clientProfiles]);

  const enrichedInvoices = useMemo(() => {
    return invoices.map(inv => ({
      ...inv,
      displayStatus: deriveClientInvoiceStatus(inv),
    }));
  }, [invoices]);

  const currencyTotals = useMemo(() => {
    const byCurrency = new Map<
      CommercialCurrency,
      { invoiced: number; paid: number; outstanding: number; count: number }
    >();
    let overdueCount = 0;

    enrichedInvoices.forEach(inv => {
      if (inv.displayStatus === 'Void') return;
      if (inv.displayStatus === 'Overdue') overdueCount += 1;
      const cur = (inv.currency || 'USD') as CommercialCurrency;
      const entry = byCurrency.get(cur) || { invoiced: 0, paid: 0, outstanding: 0, count: 0 };
      entry.invoiced += Number(inv.totalAmount || 0);
      entry.paid += Number(inv.totalPaid || 0);
      entry.outstanding += Number(inv.balanceDue || 0);
      entry.count += 1;
      byCurrency.set(cur, entry);
    });

    return {
      currencies: Array.from(byCurrency.entries()),
      overdueCount,
      activeCount: enrichedInvoices.filter(i => i.displayStatus !== 'Void').length,
    };
  }, [enrichedInvoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedInvoices.filter(inv => {
      const wsName = workspaceMap.get(inv.workspaceId)?.name?.toLowerCase() || '';
      const matchesSearch =
        !q ||
        inv.title.toLowerCase().includes(q) ||
        inv.referenceNo.toLowerCase().includes(q) ||
        inv.recipientName.toLowerCase().includes(q) ||
        (inv.recipientOrg || '').toLowerCase().includes(q) ||
        wsName.includes(q);
      const matchesStatus = statusFilter === 'All' || inv.displayStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrichedInvoices, searchQuery, statusFilter, workspaceMap]);

  const selectedInvoice = useMemo(
    () => enrichedInvoices.find(i => i.id === selectedInvoiceId) || filteredInvoices[0] || null,
    [enrichedInvoices, selectedInvoiceId, filteredInvoices],
  );

  const formPreviewTotals = useMemo(
    () =>
      calculateCommercialTotals({
        items: invoiceItems,
        taxRate: Number(invoiceTaxRate || 0),
        discountAmount: Number(invoiceDiscountAmount || 0),
      }),
    [invoiceItems, invoiceTaxRate, invoiceDiscountAmount],
  );

  const workspaceProjects = useMemo(
    () => projects.filter(p => p.workspaceId === invoiceWorkspaceId),
    [projects, invoiceWorkspaceId],
  );

  const applyWorkspaceRecipientDefaults = (wsId: string) => {
    const ws = workspaceMap.get(wsId);
    if (!ws) return;
    const owner = profileMap.get(ws.ownerId);
    setInvoiceRecipientName(owner?.displayName || ws.name);
    setInvoiceRecipientOrg(ws.name);
    setInvoiceRecipientEmail(ws.contactEmail || owner?.email || '');
  };

  const openCreateModal = () => {
    setFeedbackError('');
    setEditingInvoiceId('');
    const defaultWs = workspaces[0];
    setInvoiceTitle('');
    setInvoiceReferenceNo(`INV-${Date.now().toString().slice(-6)}`);
    setInvoiceWorkspaceId(defaultWs?.id || '');
    setInvoiceProjectId('');
    setInvoiceCurrency('USD');
    if (defaultWs) {
      const owner = profileMap.get(defaultWs.ownerId);
      setInvoiceRecipientName(owner?.displayName || defaultWs.name);
      setInvoiceRecipientOrg(defaultWs.name);
      setInvoiceRecipientEmail(defaultWs.contactEmail || owner?.email || '');
    } else {
      setInvoiceRecipientName('');
      setInvoiceRecipientOrg('');
      setInvoiceRecipientEmail('');
    }
    setInvoiceRecipientAddress('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setInvoiceDueDate(due.toISOString().split('T')[0]);
    setInvoiceBodyContent('Commercial invoice issued for creative production and brand/release deliverables.');
    setInvoiceItems([{ description: 'Creative Production Services & Deliverables', quantity: 1, unitPrice: 2500, total: 2500 }]);
    setInvoiceTaxRate('0');
    setInvoiceDiscountAmount('0');
    setInvoicePaymentTerms('Net 30 Days from invoice issue');
    setInvoiceNotes('');
    setInvoiceStatus('Issued');
    setIsEditorOpen(true);
  };

  const openEditModal = (inv: InvoiceRecord) => {
    setFeedbackError('');
    setEditingInvoiceId(inv.id);
    setInvoiceTitle(inv.title);
    setInvoiceReferenceNo(inv.referenceNo);
    setInvoiceWorkspaceId(inv.workspaceId);
    setInvoiceProjectId(inv.projectId || '');
    setInvoiceCurrency(inv.currency || 'USD');
    setInvoiceRecipientName(inv.recipientName || '');
    setInvoiceRecipientOrg(inv.recipientOrg || '');
    setInvoiceRecipientEmail(inv.recipientEmail || '');
    setInvoiceRecipientAddress(inv.recipientAddress || '');
    setInvoiceDate(inv.issueDate || new Date().toISOString().split('T')[0]);
    setInvoiceDueDate(inv.dueDate || '');
    setInvoiceBodyContent(inv.bodyContent || '');
    setInvoiceItems(
      inv.items && inv.items.length > 0
        ? inv.items
        : [{ description: inv.title, quantity: 1, unitPrice: inv.subtotal || 0, total: inv.subtotal || 0 }],
    );
    setInvoiceTaxRate(String(inv.taxRate ?? 0));
    setInvoiceDiscountAmount(String(inv.discountAmount ?? 0));
    setInvoicePaymentTerms(inv.paymentTerms || 'Net 30 Days');
    setInvoiceNotes(inv.notes || '');
    setInvoiceStatus(inv.status);
    setIsEditorOpen(true);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError('');
    if (!invoiceWorkspaceId) {
      setFeedbackError('Select a target client workspace before saving.');
      return;
    }
    setSubmitting(true);
    try {
      const saveInvoice = httpsCallable(functions, 'adminSaveInvoice');
      const res = await saveInvoice({
        ...(editingInvoiceId ? { id: editingInvoiceId } : {}),
        workspaceId: invoiceWorkspaceId,
        projectId: invoiceProjectId,
        referenceNo: invoiceReferenceNo.trim(),
        title: invoiceTitle.trim(),
        currency: invoiceCurrency,
        issueDate: invoiceDate,
        dueDate: invoiceDueDate,
        recipientName: invoiceRecipientName.trim(),
        recipientOrg: invoiceRecipientOrg.trim(),
        recipientEmail: invoiceRecipientEmail.trim(),
        recipientAddress: invoiceRecipientAddress.trim(),
        subject: `Commercial Invoice ${invoiceReferenceNo.trim()}`,
        bodyContent: invoiceBodyContent.trim(),
        items: invoiceItems.map(it => ({
          description: it.description,
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || 0),
        })),
        taxRate: Number(invoiceTaxRate || 0),
        discountAmount: Number(invoiceDiscountAmount || 0),
        paymentTerms: invoicePaymentTerms.trim(),
        notes: invoiceNotes.trim(),
        status: invoiceStatus,
      });
      const data = res.data as { invoice?: InvoiceRecord };
      if (data?.invoice?.id) {
        setSelectedInvoiceId(data.invoice.id);
        onSelectedIdChange?.(data.invoice.id);
      }
      setIsEditorOpen(false);
      setFeedbackSuccess(`Invoice ${invoiceReferenceNo.trim()} saved to Firestore.`);
      setTimeout(() => setFeedbackSuccess(''), 3500);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Unable to save invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoidInvoice = async (inv: InvoiceRecord) => {
    setFeedbackError('');
    setSubmitting(true);
    try {
      const saveInvoice = httpsCallable(functions, 'adminSaveInvoice');
      await saveInvoice({
        id: inv.id,
        workspaceId: inv.workspaceId,
        projectId: inv.projectId || '',
        referenceNo: inv.referenceNo,
        title: inv.title,
        currency: inv.currency,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate || '',
        recipientName: inv.recipientName,
        recipientOrg: inv.recipientOrg || '',
        recipientEmail: inv.recipientEmail || '',
        recipientAddress: inv.recipientAddress || '',
        subject: inv.subject || '',
        bodyContent: inv.bodyContent || '',
        items: inv.items,
        taxRate: inv.taxRate || 0,
        discountAmount: inv.discountAmount || 0,
        paymentTerms: inv.paymentTerms || '',
        notes: inv.notes || '',
        status: 'Void',
      });
      setFeedbackSuccess(`Invoice ${inv.referenceNo} marked as Void.`);
      setTimeout(() => setFeedbackSuccess(''), 3000);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Unable to void invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForPayment) return;
    setFeedbackError('');
    const amt = Number(paymentAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setFeedbackError('Payment amount must be greater than zero.');
      return;
    }
    setSubmitting(true);
    try {
      const recordPayment = httpsCallable(functions, 'adminRecordManualPayment');
      const res = await recordPayment({
        invoiceId: targetInvoiceForPayment.id,
        amount: amt,
        method: paymentMethod,
        date: paymentDate,
        reference: paymentReference.trim() || `PAY-${Date.now().toString().slice(-6)}`,
        notes: paymentNotes.trim(),
      });
      const data = res.data as { paymentRecord?: PaymentRecord; nextStatus?: string };
      setIsPaymentModalOpen(false);
      setTargetInvoiceForPayment(null);
      setPaymentNotes('');
      setPaymentReference('');
      setFeedbackSuccess(
        `Receipt ${data?.paymentRecord?.receiptNumber || ''} recorded (${data?.nextStatus || 'Updated'}).`,
      );
      setTimeout(() => setFeedbackSuccess(''), 4000);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Unable to record manual payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportLegacyRecord = async (item: LegacyLocalDocumentInspection) => {
    const targetWsId = legacyWorkspaceMap[item.id];
    if (!targetWsId) {
      setFeedbackError(`Select a target Firestore workspace before importing ${item.document.referenceNo || item.id}.`);
      return;
    }
    setFeedbackError('');
    setImportingLegacyId(item.id);
    try {
      if (item.targetCollection === 'invoice') {
        const saveInvoice = httpsCallable(functions, 'adminSaveInvoice');
        await saveInvoice(buildInvoiceCallablePayloadFromLegacy(item, targetWsId));
      } else if (item.targetCollection === 'proposal') {
        const saveProposal = httpsCallable(functions, 'adminSaveProposal');
        await saveProposal(buildProposalCallablePayloadFromLegacy(item, targetWsId));
      } else {
        const payload = buildNonCommercialWorkspaceDocPayloadFromLegacy(item, targetWsId);
        await setDoc(doc(db, 'workspaces', targetWsId, 'documents', payload.id), payload);
      }
      setImportedLegacyIds(prev => ({ ...prev, [item.id]: true }));
      setFeedbackSuccess(`Non-destructively imported ${item.document.referenceNo || item.id} into Firestore.`);
      setTimeout(() => setFeedbackSuccess(''), 4000);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Legacy import failed.');
    } finally {
      setImportingLegacyId('');
    }
  };

  const handleAddLineItem = () => {
    setInvoiceItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: keyof DocumentItem, value: string | number) => {
    setInvoiceItems(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        const q = Number(updated.quantity || 1);
        const p = Number(updated.unitPrice || 0);
        updated.total = q * p;
        return updated;
      }),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0C0C0C] border border-[#1E1E1E] p-5 rounded-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
            Server-Governed Commercial Billing
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Invoices &amp; Settlement Ledger</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Live Firestore billing across multi-currency invoices, manual payment receipts, and client visibility controls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {legacyRecords.length > 0 && (
            <button
              type="button"
              onClick={() => {
                refreshLegacyInspector();
                setShowLegacyImporter(v => !v);
              }}
              className="flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-950/20 px-3 py-2 text-xs font-mono text-amber-300 hover:bg-amber-950/35"
            >
              <Archive size={14} />
              <span>Legacy Browser Records ({legacyRecords.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-lg"
          >
            <Plus size={15} />
            <span>New Commercial Invoice</span>
          </button>
        </div>
      </div>

      {feedbackError && (
        <div className="border border-red-900/60 bg-red-950/30 rounded-lg px-4 py-3 text-xs text-red-300 flex items-center justify-between gap-3">
          <span>{feedbackError}</span>
          <button type="button" onClick={() => setFeedbackError('')} className="text-red-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {feedbackSuccess && (
        <div className="border border-emerald-900/60 bg-emerald-950/25 rounded-lg px-4 py-3 text-xs text-emerald-300 flex items-center justify-between gap-3">
          <span>{feedbackSuccess}</span>
          <button type="button" onClick={() => setFeedbackSuccess('')} className="text-emerald-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Non-destructive Legacy localStorage Finance Importer */}
      {showLegacyImporter && (
        <div className="bg-[#0E0E0E] border border-amber-500/35 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1E1E1E] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Archive size={15} className="text-amber-400" />
                <span>Non-Destructive Legacy LocalStorage Finance Inspector</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Inspects existing records stored in this browser under <code className="text-amber-300">lyrical_ent_studio_state_v1_documents</code> without modifying or deleting local storage. Initial demo seeds are flagged so you only import real client history.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshLegacyInspector}
              className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded border border-[#2B2B2B] text-neutral-300 hover:text-white"
            >
              <RefreshCw size={12} />
              <span>Rescan Browser</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {legacyRecords.map(item => (
              <div
                key={item.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#141414] border border-[#222222] rounded-lg p-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-white">{item.document.referenceNo || item.id}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#1E1E1E] text-neutral-300 font-mono text-[10px] uppercase">
                      Target: {item.targetCollection.replace('_', ' ')}
                    </span>
                    {item.isInitialSeedDefault && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-700/40 text-amber-300 font-mono text-[10px]">
                        DEFAULT DEMO SEED
                      </span>
                    )}
                  </div>
                  <div className="text-neutral-200 font-medium truncate">{item.document.title}</div>
                  <div className="text-[11px] text-neutral-400">
                    Legacy Workspace: {item.sourceWorkspaceName} · Total: {formatMoney(item.computedTotal, item.document.currency || 'USD')}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    value={legacyWorkspaceMap[item.id] || ''}
                    onChange={e => setLegacyWorkspaceMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                    className="bg-[#0B0B0B] border border-[#2C2C2C] rounded px-2.5 py-1.5 text-xs text-white max-w-[220px]"
                  >
                    <option value="">Select target workspace...</option>
                    {workspaces.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={importingLegacyId === item.id || Boolean(importedLegacyIds[item.id])}
                    onClick={() => handleImportLegacyRecord(item)}
                    className="px-3 py-1.5 rounded bg-white text-black font-semibold text-xs hover:bg-neutral-200 disabled:opacity-50"
                  >
                    {importedLegacyIds[item.id]
                      ? 'Imported'
                      : importingLegacyId === item.id
                        ? 'Importing...'
                        : 'Import to Firestore'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Currency Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <FileText size={14} className="text-blue-400" />
            Total Invoiced (Active)
          </span>
          <div className="mt-2 space-y-1">
            {currencyTotals.currencies.length > 0 ? (
              currencyTotals.currencies.map(([cur, stats]) => (
                <div key={cur} className="text-lg font-black text-white tracking-tight font-mono">
                  {formatMoney(stats.invoiced, cur)}{' '}
                  <span className="text-[10px] font-normal text-neutral-500">{cur}</span>
                </div>
              ))
            ) : (
              <div className="text-xl font-black text-white font-mono">$0.00</div>
            )}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Across {currencyTotals.activeCount} non-void invoice(s)
          </span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <Receipt size={14} className="text-emerald-400" />
            Total Settled
          </span>
          <div className="mt-2 space-y-1">
            {currencyTotals.currencies.length > 0 ? (
              currencyTotals.currencies.map(([cur, stats]) => (
                <div key={cur} className="text-lg font-black text-emerald-400 tracking-tight font-mono">
                  {formatMoney(stats.paid, cur)}{' '}
                  <span className="text-[10px] font-normal text-neutral-500">{cur}</span>
                </div>
              ))
            ) : (
              <div className="text-xl font-black text-emerald-400 font-mono">$0.00</div>
            )}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Server-verified receipts</span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <Clock size={14} className="text-amber-400" />
            Outstanding Balance
          </span>
          <div className="mt-2 space-y-1">
            {currencyTotals.currencies.length > 0 ? (
              currencyTotals.currencies.map(([cur, stats]) => (
                <div key={cur} className="text-lg font-black text-amber-400 tracking-tight font-mono">
                  {formatMoney(stats.outstanding, cur)}{' '}
                  <span className="text-[10px] font-normal text-neutral-500">{cur}</span>
                </div>
              ))
            ) : (
              <div className="text-xl font-black text-amber-400 font-mono">$0.00</div>
            )}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Pending settlement</span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-400" />
            Overdue Invoices
          </span>
          <div className="text-2xl font-black text-red-400 mt-2 tracking-tight font-mono">
            {currencyTotals.overdueCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Past due date &amp; unpaid</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0C0C0C] border border-[#1E1E1E] p-3.5 rounded-xl">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={15} className="text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, title, client name, or workspace..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-neutral-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['All', 'Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Void'].map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#141414] text-neutral-400 hover:text-white border border-[#222]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table & Selected Invoice Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-[#0C0C0C] border border-[#1E1E1E] rounded-xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Firestore Invoices Ledger</h3>
            <span className="text-xs font-mono text-neutral-500">{filteredInvoices.length} Record(s)</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-500 font-mono">Loading Firestore invoices...</div>
          ) : filteredInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] text-neutral-400 font-mono border-b border-[#1E1E1E]">
                  <tr>
                    <th className="py-3 px-4 font-normal">INVOICE #</th>
                    <th className="py-3 px-4 font-normal">WORKSPACE &amp; TITLE</th>
                    <th className="py-3 px-4 font-normal">DATES</th>
                    <th className="py-3 px-4 font-normal text-right">TOTAL</th>
                    <th className="py-3 px-4 font-normal text-right">BALANCE</th>
                    <th className="py-3 px-4 font-normal text-center">STATUS</th>
                    <th className="py-3 px-4 font-normal text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {filteredInvoices.map(inv => {
                    const ws = workspaceMap.get(inv.workspaceId);
                    const statusBadge =
                      inv.displayStatus === 'Paid'
                        ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                        : inv.displayStatus === 'Partially Paid'
                          ? 'border-blue-800/60 bg-blue-950/30 text-blue-300'
                          : inv.displayStatus === 'Overdue'
                            ? 'border-red-800/60 bg-red-950/30 text-red-300'
                            : inv.displayStatus === 'Void'
                              ? 'border-neutral-800 bg-neutral-950 text-neutral-500'
                              : 'border-neutral-700 bg-neutral-900 text-neutral-300';

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => {
                          setSelectedInvoiceId(inv.id);
                          onSelectedIdChange?.(inv.id);
                        }}
                        className={`cursor-pointer transition-colors ${
                          selectedInvoice?.id === inv.id ? 'bg-[#151515]' : 'hover:bg-[#111111]'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{inv.referenceNo}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white max-w-[220px] truncate">{inv.title}</div>
                          <div className="text-[11px] text-neutral-400">
                            {ws?.name || inv.recipientOrg || inv.recipientName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-400">
                          <div>{inv.issueDate}</div>
                          {inv.dueDate && <div className="text-[10px] text-neutral-500">Due: {inv.dueDate}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {formatMoney(inv.totalAmount, inv.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className="text-emerald-400 text-[11px]">
                            Paid {formatMoney(inv.totalPaid, inv.currency)}
                          </div>
                          <div className="text-amber-400 font-semibold">
                            Due {formatMoney(inv.balanceDue, inv.currency)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block rounded border px-2 py-0.5 text-[10px] font-mono uppercase ${statusBadge}`}
                          >
                            {inv.displayStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.status !== 'Void' && inv.status !== 'Draft' && inv.balanceDue > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetInvoiceForPayment(inv);
                                  setPaymentAmount(String(inv.balanceDue));
                                  setIsPaymentModalOpen(true);
                                }}
                                className="rounded border border-emerald-700/50 bg-emerald-950/30 px-2 py-1 text-[11px] text-emerald-300 hover:border-emerald-400"
                              >
                                + Payment
                              </button>
                            )}
                            {inv.status !== 'Void' && (
                              <button
                                type="button"
                                onClick={() => openEditModal(inv)}
                                className="p-1.5 rounded border border-[#333] bg-[#151515] text-neutral-300 hover:text-white"
                                title="Edit Invoice"
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => generateCommercialInvoicePdf(inv, ws)}
                              className="p-1.5 rounded border border-[#333] bg-[#151515] text-neutral-300 hover:text-white"
                              title="Download Commercial PDF"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-neutral-500 font-mono">
              No invoices recorded in Firestore matching your filters.
            </div>
          )}
        </div>

        {/* Selected Invoice Ledger & Receipt Detail */}
        <div className="xl:col-span-4 bg-[#0C0C0C] border border-[#1E1E1E] rounded-xl p-5 space-y-4">
          {selectedInvoice ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-[#1E1E1E] pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-500">
                    {selectedInvoice.referenceNo} · {selectedInvoice.currency}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{selectedInvoice.title}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {workspaceMap.get(selectedInvoice.workspaceId)?.name || selectedInvoice.recipientOrg}
                  </p>
                </div>
                {onOpenWorkspace && (
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace(selectedInvoice.workspaceId)}
                    className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded border border-[#2B2B2B] text-neutral-300 hover:text-white"
                  >
                    <Building2 size={12} />
                    <span>Workspace</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-[#121212] border border-[#1E1E1E] p-3 rounded-lg">
                <div>
                  <span className="text-[10px] text-neutral-500 block">TOTAL</span>
                  <span className="font-bold text-white">
                    {formatMoney(selectedInvoice.totalAmount, selectedInvoice.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">PAID</span>
                  <span className="font-bold text-emerald-400">
                    {formatMoney(selectedInvoice.totalPaid, selectedInvoice.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">BALANCE</span>
                  <span className="font-bold text-amber-400">
                    {formatMoney(selectedInvoice.balanceDue, selectedInvoice.currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-neutral-500">Line Items</div>
                {selectedInvoice.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 text-xs bg-[#121212] px-3 py-2 rounded border border-[#1C1C1C]"
                  >
                    <div className="min-w-0">
                      <div className="text-neutral-200 truncate">{it.description}</div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        Qty {it.quantity || 1} × {formatMoney(it.unitPrice || 0, selectedInvoice.currency)}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-white shrink-0">
                      {formatMoney(it.total ?? (it.quantity || 1) * (it.unitPrice || 0), selectedInvoice.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-[#1E1E1E] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">
                    Payment &amp; Receipt History ({selectedInvoice.payments?.length || 0})
                  </span>
                </div>
                {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedInvoice.payments.map(p => (
                      <div
                        key={p.id}
                        className="bg-[#121212] border border-[#1E1E1E] rounded p-2.5 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-emerald-400">
                            {p.receiptNumber || p.id}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {p.date} · {p.method} · Ref: {p.reference}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-white shrink-0">
                          {formatMoney(p.amount, selectedInvoice.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">No payments recorded yet.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() =>
                    generateCommercialInvoicePdf(
                      selectedInvoice,
                      workspaceMap.get(selectedInvoice.workspaceId),
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 rounded bg-white text-black px-3 py-2 text-xs font-semibold hover:bg-neutral-200"
                >
                  <Download size={13} />
                  <span>Invoice PDF</span>
                </button>
                {selectedInvoice.status !== 'Void' && (selectedInvoice.totalPaid || 0) === 0 && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleVoidInvoice(selectedInvoice)}
                    className="flex items-center gap-1.5 rounded border border-red-900/60 bg-red-950/20 px-3 py-2 text-xs text-red-300 hover:bg-red-950/40"
                  >
                    <Ban size={13} />
                    <span>Void</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-500 font-mono">
              Select an invoice row to inspect totals, receipts, and PDF export.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Invoice Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] bg-[#121212]">
              <h3 className="text-sm font-bold text-white">
                {editingInvoiceId ? `Edit Invoice ${invoiceReferenceNo}` : 'Create Commercial Invoice'}
              </h3>
              <button type="button" onClick={() => setIsEditorOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Invoice Title *</label>
                  <input
                    type="text"
                    required
                    value={invoiceTitle}
                    onChange={e => setInvoiceTitle(e.target.value)}
                    placeholder="e.g., Release Rollout & Cover Art Production"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Reference No *</label>
                  <input
                    type="text"
                    required
                    value={invoiceReferenceNo}
                    onChange={e => setInvoiceReferenceNo(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Target Workspace *</label>
                  <select
                    required
                    disabled={Boolean(editingInvoiceId)}
                    value={invoiceWorkspaceId}
                    onChange={e => {
                      setInvoiceWorkspaceId(e.target.value);
                      setInvoiceProjectId('');
                      applyWorkspaceRecipientDefaults(e.target.value);
                    }}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none disabled:opacity-60"
                  >
                    <option value="">Select client workspace...</option>
                    {workspaces.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Currency *</label>
                  <select
                    value={invoiceCurrency}
                    onChange={e => setInvoiceCurrency(e.target.value as CommercialCurrency)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                  >
                    {COMMERCIAL_CURRENCIES.map(cur => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Status</label>
                  <select
                    value={invoiceStatus}
                    onChange={e => setInvoiceStatus(e.target.value as InvoiceStatus)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Issued">Issued (Client Visible)</option>
                    <option value="Draft">Draft (Admin Only)</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Linked Project (Optional)</label>
                  <select
                    value={invoiceProjectId}
                    onChange={e => setInvoiceProjectId(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="">None (General Billing)</option>
                    {workspaceProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invoiceDueDate}
                    onChange={e => setInvoiceDueDate(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={invoiceRecipientName}
                    onChange={e => setInvoiceRecipientName(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Organization / Artist</label>
                  <input
                    type="text"
                    value={invoiceRecipientOrg}
                    onChange={e => setInvoiceRecipientOrg(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={invoiceRecipientEmail}
                    onChange={e => setInvoiceRecipientEmail(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Billing Scope Summary</label>
                <textarea
                  rows={2}
                  value={invoiceBodyContent}
                  onChange={e => setInvoiceBodyContent(e.target.value)}
                  className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">Service Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-[#FF1E1E] hover:underline font-medium"
                  >
                    + Add Line Item
                  </button>
                </div>

                {invoiceItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-[#141414] p-2.5 rounded-lg border border-[#222]"
                  >
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={e => handleUpdateLineItem(idx, 'description', e.target.value)}
                      placeholder="Service description"
                      className="col-span-6 bg-transparent text-xs text-white outline-none"
                    />
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      value={item.quantity ?? 1}
                      onChange={e => handleUpdateLineItem(idx, 'quantity', e.target.value)}
                      className="col-span-2 bg-[#1A1A1A] rounded px-2 py-1 text-xs text-white text-center outline-none font-mono"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice ?? 0}
                      onChange={e => handleUpdateLineItem(idx, 'unitPrice', e.target.value)}
                      className="col-span-3 bg-[#1A1A1A] rounded px-2 py-1 text-xs text-white text-right outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      disabled={invoiceItems.length === 1}
                      className="col-span-1 text-neutral-500 hover:text-red-400 flex justify-center disabled:opacity-30"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={invoiceTaxRate}
                    onChange={e => setInvoiceTaxRate(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Discount ({invoiceCurrency})</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={invoiceDiscountAmount}
                    onChange={e => setInvoiceDiscountAmount(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div className="sm:col-span-2 bg-[#121212] border border-[#222] rounded-lg px-3 py-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">
                    Sub: {formatMoney(formPreviewTotals.subtotal, invoiceCurrency)} · Tax:{' '}
                    {formatMoney(formPreviewTotals.taxAmount, invoiceCurrency)}
                  </span>
                  <span className="font-bold text-white">
                    Total: {formatMoney(formPreviewTotals.totalAmount, invoiceCurrency)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={invoicePaymentTerms}
                    onChange={e => setInvoicePaymentTerms(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Notes</label>
                  <input
                    type="text"
                    value={invoiceNotes}
                    onChange={e => setInvoiceNotes(e.target.value)}
                    placeholder="Optional wire / settlement memo"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 bg-[#151515] rounded-lg hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#FF1E1E] rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Saving via Server...' : editingInvoiceId ? 'Save Changes' : 'Save & Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
      {isPaymentModalOpen && targetInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Record Manual Payment</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  {targetInvoiceForPayment.referenceNo} · Balance:{' '}
                  {formatMoney(targetInvoiceForPayment.balanceDue, targetInvoiceForPayment.currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Payment Amount ({targetInvoiceForPayment.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  max={targetInvoiceForPayment.balanceDue}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentRecord['method'])}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="ACH">ACH Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Check">Check</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Reference / Confirmation # *
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder="e.g., SWIFT-REF-987124"
                  className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Settlement Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Optional bank confirmation note"
                  className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 bg-[#151515] rounded-lg hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Recording...' : 'Record Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
