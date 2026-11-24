/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Admin Proposals & Quotations Management (Firestore + Cloud Functions)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useApp } from '../../context/AppContext';
import { db, functions, logFirestoreError, OperationType } from '../../lib/firebase';
import {
  calculateCommercialTotals,
  COMMERCIAL_CURRENCIES,
  formatMoney,
} from '../../lib/financeDocuments';
import { generateCommercialProposalPdf } from '../../utils/pdfGenerator';
import type {
  ClientProfile,
  ClientProject,
  CommercialCurrency,
  DocumentItem,
  ProposalRecord,
  ProposalStatus,
  ProposalType,
  Workspace,
} from '../../types';
import {
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  FileText,
  MessageSquare,
  Plus,
  Search,
  X,
} from 'lucide-react';

interface AdminProposalsManagementProps {
  initialSelectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  onOpenWorkspace?: (workspaceId: string) => void;
}

export const AdminProposalsManagement: React.FC<AdminProposalsManagementProps> = ({
  initialSelectedId,
  onSelectedIdChange,
  onOpenWorkspace,
}) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedProposalId, setSelectedProposalId] = useState<string>(initialSelectedId || '');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Form state
  const [propTitle, setPropTitle] = useState('');
  const [propReferenceNo, setPropReferenceNo] = useState('');
  const [propType, setPropType] = useState<ProposalType>('quotation');
  const [propWorkspaceId, setPropWorkspaceId] = useState('');
  const [propProjectId, setPropProjectId] = useState('');
  const [propCurrency, setPropCurrency] = useState<CommercialCurrency>('USD');
  const [propRecipientName, setPropRecipientName] = useState('');
  const [propRecipientOrg, setPropRecipientOrg] = useState('');
  const [propRecipientEmail, setPropRecipientEmail] = useState('');
  const [propDate, setPropDate] = useState(new Date().toISOString().split('T')[0]);
  const [propValidityDate, setPropValidityDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [propBodyContent, setPropBodyContent] = useState('');
  const [propItems, setPropItems] = useState<DocumentItem[]>([
    { description: 'Creative Direction & Production Package', quantity: 1, unitPrice: 3500, total: 3500 },
  ]);
  const [propTaxRate, setPropTaxRate] = useState('0');
  const [propDiscountAmount, setPropDiscountAmount] = useState('0');
  const [propPaymentTerms, setPropPaymentTerms] = useState('50% deposit upon approval, 50% upon delivery');
  const [propNotes, setPropNotes] = useState('');
  const [propStatus, setPropStatus] = useState<ProposalStatus>('Issued');
  const [propRevisionNote, setPropRevisionNote] = useState('');

  useEffect(() => {
    if (initialSelectedId) setSelectedProposalId(initialSelectedId);
  }, [initialSelectedId]);

  useEffect(() => {
    if (!firebaseUser || !canAccessAdminCenter) {
      setProposals([]);
      setWorkspaces([]);
      setClientProfiles([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFeedbackError('');

    const unsubProposals = onSnapshot(
      query(collection(db, 'proposals'), orderBy('updatedAt', 'desc')),
      snapshot => {
        setProposals(snapshot.docs.map(d => ({ ...(d.data() as ProposalRecord), id: d.id })));
        setLoading(false);
      },
      err => {
        logFirestoreError(err, OperationType.LIST, 'proposals');
        setFeedbackError(err?.message || 'Unable to load proposals due to missing or insufficient permissions.');
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
      unsubProposals();
      unsubWorkspaces();
      unsubProfiles();
      unsubProjects();
    };
  }, [firebaseUser, canAccessAdminCenter]);

  const workspaceMap = useMemo(() => new Map(workspaces.map(w => [w.id, w])), [workspaces]);
  const profileMap = useMemo(() => new Map(clientProfiles.map(p => [p.uid, p])), [clientProfiles]);

  const metrics = useMemo(() => {
    const pipelineByCurrency = new Map<CommercialCurrency, number>();
    let approvedCount = 0;
    let awaitingResponseCount = 0;

    proposals.forEach(p => {
      if (p.status !== 'Declined' && p.status !== 'Expired') {
        const cur = (p.currency || 'USD') as CommercialCurrency;
        pipelineByCurrency.set(cur, (pipelineByCurrency.get(cur) || 0) + Number(p.totalAmount || 0));
      }
      if (p.status === 'Approved') approvedCount += 1;
      if (['Issued', 'Sent', 'Under Review', 'Revision Requested'].includes(p.status)) {
        awaitingResponseCount += 1;
      }
    });

    return {
      currencies: Array.from(pipelineByCurrency.entries()),
      approvedCount,
      awaitingResponseCount,
    };
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return proposals.filter(p => {
      const wsName = workspaceMap.get(p.workspaceId)?.name?.toLowerCase() || '';
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.referenceNo.toLowerCase().includes(q) ||
        p.recipientName.toLowerCase().includes(q) ||
        (p.recipientOrg || '').toLowerCase().includes(q) ||
        wsName.includes(q);
      const matchesType = typeFilter === 'All' || p.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [proposals, searchQuery, typeFilter, workspaceMap]);

  const selectedProposal = useMemo(
    () => proposals.find(p => p.id === selectedProposalId) || filteredProposals[0] || null,
    [proposals, selectedProposalId, filteredProposals],
  );

  const formPreviewTotals = useMemo(
    () =>
      calculateCommercialTotals({
        items: propItems,
        taxRate: Number(propTaxRate || 0),
        discountAmount: Number(propDiscountAmount || 0),
      }),
    [propItems, propTaxRate, propDiscountAmount],
  );

  const workspaceProjects = useMemo(
    () => projects.filter(p => p.workspaceId === propWorkspaceId),
    [projects, propWorkspaceId],
  );

  const applyWorkspaceDefaults = (wsId: string) => {
    const ws = workspaceMap.get(wsId);
    if (!ws) return;
    const owner = profileMap.get(ws.ownerId);
    setPropRecipientName(owner?.displayName || ws.name);
    setPropRecipientOrg(ws.name);
    setPropRecipientEmail(ws.contactEmail || owner?.email || '');
  };

  const openCreateModal = () => {
    setFeedbackError('');
    setEditingProposalId('');
    const defaultWs = workspaces[0];
    setPropTitle('');
    setPropReferenceNo(`PROP-${Date.now().toString().slice(-6)}`);
    setPropType('quotation');
    setPropWorkspaceId(defaultWs?.id || '');
    setPropProjectId('');
    setPropCurrency('USD');
    if (defaultWs) {
      const owner = profileMap.get(defaultWs.ownerId);
      setPropRecipientName(owner?.displayName || defaultWs.name);
      setPropRecipientOrg(defaultWs.name);
      setPropRecipientEmail(defaultWs.contactEmail || owner?.email || '');
    } else {
      setPropRecipientName('');
      setPropRecipientOrg('');
      setPropRecipientEmail('');
    }
    setPropDate(new Date().toISOString().split('T')[0]);
    const valid = new Date();
    valid.setDate(valid.getDate() + 14);
    setPropValidityDate(valid.toISOString().split('T')[0]);
    setPropBodyContent('Commercial proposal & scope of work prepared for your KeedoHub workspace.');
    setPropItems([{ description: 'Creative Direction & Production Package', quantity: 1, unitPrice: 3500, total: 3500 }]);
    setPropTaxRate('0');
    setPropDiscountAmount('0');
    setPropPaymentTerms('50% deposit upon approval, 50% upon delivery.');
    setPropNotes('');
    setPropStatus('Issued');
    setPropRevisionNote('');
    setIsEditorOpen(true);
  };

  const openEditModal = (prop: ProposalRecord) => {
    setFeedbackError('');
    setEditingProposalId(prop.id);
    setPropTitle(prop.title);
    setPropReferenceNo(prop.referenceNo);
    setPropType(prop.type);
    setPropWorkspaceId(prop.workspaceId);
    setPropProjectId(prop.projectId || '');
    setPropCurrency(prop.currency || 'USD');
    setPropRecipientName(prop.recipientName || '');
    setPropRecipientOrg(prop.recipientOrg || '');
    setPropRecipientEmail(prop.recipientEmail || '');
    setPropDate(prop.issueDate || new Date().toISOString().split('T')[0]);
    setPropValidityDate(prop.validUntil || '');
    setPropBodyContent(prop.bodyContent || '');
    setPropItems(prop.items || []);
    setPropTaxRate(String(prop.taxRate ?? 0));
    setPropDiscountAmount(String(prop.discountAmount ?? 0));
    setPropPaymentTerms(prop.paymentTerms || '');
    setPropNotes(prop.notes || '');
    setPropStatus(prop.status === 'Revision Requested' ? 'Issued' : prop.status);
    setPropRevisionNote('');
    setIsEditorOpen(true);
  };

  const handleSaveProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError('');
    if (!propWorkspaceId) {
      setFeedbackError('Select a target client workspace before saving.');
      return;
    }
    setSubmitting(true);
    try {
      const saveProposal = httpsCallable(functions, 'adminSaveProposal');
      const res = await saveProposal({
        ...(editingProposalId ? { id: editingProposalId } : {}),
        workspaceId: propWorkspaceId,
        projectId: propProjectId,
        type: propType,
        referenceNo: propReferenceNo.trim(),
        title: propTitle.trim(),
        currency: propCurrency,
        issueDate: propDate,
        validUntil: propValidityDate,
        recipientName: propRecipientName.trim(),
        recipientOrg: propRecipientOrg.trim(),
        recipientEmail: propRecipientEmail.trim(),
        subject: `Commercial Proposal ${propReferenceNo.trim()}`,
        bodyContent: propBodyContent.trim(),
        items: propItems.map(it => ({
          description: it.description,
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || 0),
        })),
        taxRate: Number(propTaxRate || 0),
        discountAmount: Number(propDiscountAmount || 0),
        paymentTerms: propPaymentTerms.trim(),
        notes: propNotes.trim(),
        status: propStatus,
        ...(propRevisionNote.trim() ? { revisionNote: propRevisionNote.trim() } : {}),
      });
      const data = res.data as { proposal?: ProposalRecord };
      if (data?.proposal?.id) {
        setSelectedProposalId(data.proposal.id);
        onSelectedIdChange?.(data.proposal.id);
      }
      setIsEditorOpen(false);
      setFeedbackSuccess(`Proposal ${propReferenceNo.trim()} saved to Firestore.`);
      setTimeout(() => setFeedbackSuccess(''), 3500);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Unable to save proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLineItem = () => {
    setPropItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setPropItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: keyof DocumentItem, value: string | number) => {
    setPropItems(prev =>
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0C0C0C] border border-[#1E1E1E] p-5 rounded-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
            Server-Governed Commercial Agency
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Proposals &amp; Quotations</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Draft, publish, revise, and track client-approved proposals, quotations, and commercial scopes.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-lg"
        >
          <Plus size={15} />
          <span>New Proposal / Quotation</span>
        </button>
      </div>

      {feedbackError && (
        <div className="border border-red-900/60 bg-red-950/30 rounded-lg px-4 py-3 text-xs text-red-300 flex items-center justify-between">
          <span>{feedbackError}</span>
          <button type="button" onClick={() => setFeedbackError('')} className="text-red-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {feedbackSuccess && (
        <div className="border border-emerald-900/60 bg-emerald-950/25 rounded-lg px-4 py-3 text-xs text-emerald-300 flex items-center justify-between">
          <span>{feedbackSuccess}</span>
          <button type="button" onClick={() => setFeedbackSuccess('')} className="text-emerald-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <FileText size={14} className="text-purple-400" />
            Active Quoted Pipeline
          </span>
          <div className="mt-2 space-y-1">
            {metrics.currencies.length > 0 ? (
              metrics.currencies.map(([cur, amt]) => (
                <div key={cur} className="text-lg font-black text-white font-mono">
                  {formatMoney(amt, cur)} <span className="text-[10px] font-normal text-neutral-500">{cur}</span>
                </div>
              ))
            ) : (
              <div className="text-xl font-black text-white font-mono">$0.00</div>
            )}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">{proposals.length} total proposal(s)</span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" />
            Approved Agreements
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-2 tracking-tight font-mono">
            {metrics.approvedCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Server-recorded client approvals</span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <Clock size={14} className="text-amber-400" />
            Awaiting Client / Revision
          </span>
          <div className="text-2xl font-black text-amber-400 mt-2 tracking-tight font-mono">
            {metrics.awaitingResponseCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">Issued, under review, or revision requested</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0C0C0C] border border-[#1E1E1E] p-3.5 rounded-xl">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={15} className="text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search proposals by title, reference, recipient, or workspace..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-neutral-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['All', 'quotation', 'partnership_proposal', 'sponsorship_proposal', 'proposal'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap uppercase ${
                typeFilter === t
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#141414] text-neutral-400 hover:text-white border border-[#222]'
              }`}
            >
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Directory + Detail */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 bg-[#0C0C0C] border border-[#1E1E1E] rounded-xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Proposals &amp; Quotations Directory</h3>
            <span className="text-xs font-mono text-neutral-500">{filteredProposals.length} Record(s)</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-500 font-mono">Loading Firestore proposals...</div>
          ) : filteredProposals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] text-neutral-400 font-mono border-b border-[#1E1E1E]">
                  <tr>
                    <th className="py-3 px-4 font-normal">REF CODE</th>
                    <th className="py-3 px-4 font-normal">TYPE &amp; SCOPE</th>
                    <th className="py-3 px-4 font-normal">CLIENT WORKSPACE</th>
                    <th className="py-3 px-4 font-normal text-right">VALUE</th>
                    <th className="py-3 px-4 font-normal text-center">STATUS</th>
                    <th className="py-3 px-4 font-normal text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {filteredProposals.map(prop => {
                    const ws = workspaceMap.get(prop.workspaceId);
                    const statusBadge =
                      prop.status === 'Approved'
                        ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                        : prop.status === 'Declined'
                          ? 'border-red-800/60 bg-red-950/30 text-red-300'
                          : prop.status === 'Revision Requested'
                            ? 'border-amber-700/60 bg-amber-950/40 text-amber-300'
                            : 'border-purple-800/50 bg-purple-950/20 text-purple-200';

                    return (
                      <tr
                        key={prop.id}
                        onClick={() => {
                          setSelectedProposalId(prop.id);
                          onSelectedIdChange?.(prop.id);
                        }}
                        className={`cursor-pointer transition-colors ${
                          selectedProposal?.id === prop.id ? 'bg-[#151515]' : 'hover:bg-[#111111]'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{prop.referenceNo}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white max-w-[220px] truncate">{prop.title}</div>
                          <div className="text-[10px] font-mono uppercase text-purple-300 mt-0.5">
                            {prop.type.replace(/_/g, ' ')} · Valid {prop.validUntil || 'Open'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300">
                          <div>{ws?.name || prop.recipientOrg || prop.recipientName}</div>
                          <div className="text-[11px] text-neutral-500">{prop.recipientName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                          {formatMoney(prop.totalAmount, prop.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block rounded border px-2 py-0.5 text-[10px] font-mono uppercase ${statusBadge}`}
                          >
                            {prop.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(prop)}
                              className="p-1.5 rounded border border-[#333] bg-[#151515] text-neutral-300 hover:text-white"
                              title="Edit / Revise Proposal"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => generateCommercialProposalPdf(prop, ws)}
                              className="p-1.5 rounded border border-[#333] bg-[#151515] text-neutral-300 hover:text-white"
                              title="Download Proposal PDF"
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
              No proposals or quotations recorded in Firestore yet.
            </div>
          )}
        </div>

        {/* Selected Proposal Inspector */}
        <div className="xl:col-span-4 bg-[#0C0C0C] border border-[#1E1E1E] rounded-xl p-5 space-y-4">
          {selectedProposal ? (
            <>
              <div className="flex items-start justify-between gap-2 border-b border-[#1E1E1E] pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-purple-300">
                    {selectedProposal.referenceNo} · {selectedProposal.type.replace(/_/g, ' ')}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{selectedProposal.title}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {workspaceMap.get(selectedProposal.workspaceId)?.name || selectedProposal.recipientOrg}
                  </p>
                </div>
                {onOpenWorkspace && (
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace(selectedProposal.workspaceId)}
                    className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded border border-[#2B2B2B] text-neutral-300 hover:text-white"
                  >
                    <Building2 size={12} />
                    <span>Workspace</span>
                  </button>
                )}
              </div>

              {selectedProposal.clientResponse && (
                <div className="bg-[#121212] border border-[#252525] rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1.5">
                    <MessageSquare size={12} />
                    <span>Client Response · {selectedProposal.clientResponse.action}</span>
                  </div>
                  {selectedProposal.clientResponse.comment && (
                    <p className="text-xs text-white leading-relaxed">
                      &ldquo;{selectedProposal.clientResponse.comment}&rdquo;
                    </p>
                  )}
                  <div className="text-[10px] font-mono text-neutral-500">
                    {selectedProposal.clientResponse.respondedByName || 'Client'} ·{' '}
                    {selectedProposal.clientResponse.respondedAt.slice(0, 10)}
                  </div>
                </div>
              )}

              <div className="text-xs text-neutral-300 whitespace-pre-line bg-[#111] border border-[#1D1D1D] rounded-lg p-3 max-h-40 overflow-y-auto">
                {selectedProposal.bodyContent || 'No narrative scope recorded.'}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-500">
                  <span>Revision Timeline ({selectedProposal.revisionHistory?.length || 0})</span>
                  <span className="text-white font-bold">
                    {formatMoney(selectedProposal.totalAmount, selectedProposal.currency)}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(selectedProposal.revisionHistory || []).map((rev, idx) => (
                    <div
                      key={idx}
                      className="bg-[#121212] border border-[#1E1E1E] rounded px-3 py-2 text-[11px]"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-white font-semibold">
                          v{rev.version} · {rev.action} ({rev.actorRole})
                        </span>
                        <span className="text-neutral-500">{rev.timestamp.slice(0, 10)}</span>
                      </div>
                      {rev.comment && <p className="text-neutral-300 mt-0.5">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#1E1E1E]">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedProposal)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded border border-[#333] bg-[#151515] px-3 py-2 text-xs text-white hover:border-white"
                >
                  <Edit3 size={13} />
                  <span>{selectedProposal.status === 'Revision Requested' ? 'Revise & Re-Issue' : 'Edit Proposal'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    generateCommercialProposalPdf(
                      selectedProposal,
                      workspaceMap.get(selectedProposal.workspaceId),
                    )
                  }
                  className="flex items-center gap-1.5 rounded bg-white text-black px-3 py-2 text-xs font-semibold hover:bg-neutral-200"
                >
                  <Download size={13} />
                  <span>PDF</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-500 font-mono">
              Select a proposal to inspect client feedback, revision timeline, and PDF export.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Proposal Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] bg-[#121212]">
              <h3 className="text-sm font-bold text-white">
                {editingProposalId ? `Edit / Revise ${propReferenceNo}` : 'Create Proposal or Quotation'}
              </h3>
              <button type="button" onClick={() => setIsEditorOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProposal} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Proposal Title *</label>
                  <input
                    type="text"
                    required
                    value={propTitle}
                    onChange={e => setPropTitle(e.target.value)}
                    placeholder="e.g., Global Release Rollout & Brand System"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Proposal Type</label>
                  <select
                    value={propType}
                    onChange={e => setPropType(e.target.value as ProposalType)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="quotation">Creative Quotation</option>
                    <option value="partnership_proposal">Partnership Proposal</option>
                    <option value="sponsorship_proposal">Sponsorship Proposal</option>
                    <option value="proposal">General Proposal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Target Workspace *</label>
                  <select
                    required
                    disabled={Boolean(editingProposalId)}
                    value={propWorkspaceId}
                    onChange={e => {
                      setPropWorkspaceId(e.target.value);
                      setPropProjectId('');
                      applyWorkspaceDefaults(e.target.value);
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
                    value={propCurrency}
                    onChange={e => setPropCurrency(e.target.value as CommercialCurrency)}
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
                    value={propStatus}
                    onChange={e => setPropStatus(e.target.value as ProposalStatus)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Issued">Issued (Client Review)</option>
                    <option value="Sent">Sent</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Draft">Draft (Admin Only)</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Reference No *</label>
                  <input
                    type="text"
                    required
                    value={propReferenceNo}
                    onChange={e => setPropReferenceNo(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Linked Project</label>
                  <select
                    value={propProjectId}
                    onChange={e => setPropProjectId(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="">None</option>
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
                    value={propDate}
                    onChange={e => setPropDate(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={propValidityDate}
                    onChange={e => setPropValidityDate(e.target.value)}
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
                    value={propRecipientName}
                    onChange={e => setPropRecipientName(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Organization</label>
                  <input
                    type="text"
                    value={propRecipientOrg}
                    onChange={e => setPropRecipientOrg(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={propRecipientEmail}
                    onChange={e => setPropRecipientEmail(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Scope &amp; Proposal Narrative</label>
                <textarea
                  rows={3}
                  value={propBodyContent}
                  onChange={e => setPropBodyContent(e.target.value)}
                  className="w-full bg-[#151515] border border-[#262626] rounded-lg p-3 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">Deliverables &amp; Priced Items (Optional)</label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-[#FF1E1E] hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                {propItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-[#141414] p-2.5 rounded-lg border border-[#222]"
                  >
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={e => handleUpdateLineItem(idx, 'description', e.target.value)}
                      placeholder="Scope or deliverable item"
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
                      className="col-span-1 text-neutral-500 hover:text-red-400 flex justify-center"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={propTaxRate}
                    onChange={e => setPropTaxRate(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Discount ({propCurrency})</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={propDiscountAmount}
                    onChange={e => setPropDiscountAmount(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div className="sm:col-span-2 bg-[#121212] border border-[#222] rounded-lg px-3 py-2 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-400">
                    Sub: {formatMoney(formPreviewTotals.subtotal, propCurrency)}
                  </span>
                  <span className="font-bold text-white">
                    Total: {formatMoney(formPreviewTotals.totalAmount, propCurrency)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={propPaymentTerms}
                    onChange={e => setPropPaymentTerms(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Notes</label>
                  <input
                    type="text"
                    value={propNotes}
                    onChange={e => setPropNotes(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {editingProposalId && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Revision Summary Note (Recorded in History)
                  </label>
                  <input
                    type="text"
                    value={propRevisionNote}
                    onChange={e => setPropRevisionNote(e.target.value)}
                    placeholder="Describe scope or pricing updates made for this revision..."
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              )}

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
                  {submitting ? 'Saving via Server...' : editingProposalId ? 'Save & Re-Issue' : 'Save & Publish Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
