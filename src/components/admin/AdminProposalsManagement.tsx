/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Admin Proposals & Quotations Management
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CorporateDocument, DocumentItem, DocumentType } from '../../types';
import { FileText, Plus, Search, CheckCircle2, Clock, Download, Printer, X, Eye, Send } from 'lucide-react';
import { generateCorporateDocumentPdf } from '../../utils/pdfGenerator';

interface AdminProposalsManagementProps {
  initialSelectedId?: string;
  onSelectedIdChange?: (id: string) => void;
}

export const AdminProposalsManagement: React.FC<AdminProposalsManagementProps> = ({
  initialSelectedId,
  onSelectedIdChange,
}) => {
  const { documents, addDocument, updateDocument, deleteDocument, workspaces, activeWorkspace, clientProfile, firebaseUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Proposal form state
  const [propTitle, setPropTitle] = useState('');
  const [propReferenceNo, setPropReferenceNo] = useState(`PROP-${Date.now().toString().slice(-5)}`);
  const [propType, setPropType] = useState<DocumentType>('quotation');
  const [propWorkspaceId, setPropWorkspaceId] = useState(workspaces[0]?.id || activeWorkspace?.id || '');
  const [propRecipientName, setPropRecipientName] = useState('');
  const [propRecipientOrg, setPropRecipientOrg] = useState('');
  const [propRecipientEmail, setPropRecipientEmail] = useState('');
  const [propDate, setPropDate] = useState(new Date().toISOString().split('T')[0]);
  const [propValidityDate, setPropValidityDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [propItems, setPropItems] = useState<DocumentItem[]>([
    { description: 'Creative Direction & Strategy Package', quantity: 1, unitPrice: 7500, total: 7500 }
  ]);
  const [propNotes, setPropNotes] = useState('');
  const [propStatus, setPropStatus] = useState<CorporateDocument['status']>('Issued');

  // Filter proposals and quotations
  const proposals = useMemo(() => {
    return documents.filter(d => ['quotation', 'partnership_proposal', 'sponsorship_proposal'].includes(d.type));
  }, [documents]);

  const metrics = useMemo(() => {
    let totalQuoted = 0;
    let acceptedCount = 0;
    let pendingCount = 0;

    proposals.forEach(p => {
      const docTotal = (p.items || []).reduce((acc, it) => acc + (it.total || (it.quantity || 1) * (it.unitPrice || 0)), 0);
      totalQuoted += docTotal;
      if (p.clientAction === 'Accepted' || p.status === 'Accepted' || p.status === 'Approved') acceptedCount++;
      else pendingCount++;
    });

    return { totalQuoted, acceptedCount, pendingCount };
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.recipientOrg || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'All' || p.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [proposals, searchQuery, typeFilter]);

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim()) return;

    const calculatedItems = propItems.map(it => ({
      ...it,
      total: (it.quantity || 1) * (it.unitPrice || 0)
    }));

    const ws = workspaces.find(w => w.id === propWorkspaceId);

    const newDoc: Omit<CorporateDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      workspaceId: propWorkspaceId,
      type: propType,
      title: propTitle.trim(),
      referenceNo: propReferenceNo.trim(),
      date: propDate,
      validityDate: propValidityDate,
      recipientName: propRecipientName.trim() || ws?.name || 'Client',
      recipientOrg: propRecipientOrg.trim() || ws?.name || '',
      recipientEmail: propRecipientEmail.trim(),
      authorName: clientProfile?.displayName || firebaseUser?.displayName || 'Platform Admin',
      authorRole: 'Managing Director & Creative Director',
      status: propStatus,
      subject: `Commercial Proposal / Quotation ${propReferenceNo}`,
      bodyContent: `Official commercial proposal and scope of work issued for ${ws?.name || 'KeedoHub'} creative agency partnership.`,
      items: calculatedItems,
      paymentTerms: '50% deposit upon proposal acceptance, 50% upon final deliverable review.',
      notes: propNotes,
    };

    addDocument(newDoc);
    setIsEditorOpen(false);
    setPropTitle('');
    setPropRecipientName('');
    setPropRecipientOrg('');
    setPropRecipientEmail('');
  };

  const handleAddLineItem = () => {
    setPropItems([...propItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setPropItems(propItems.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: keyof DocumentItem, value: any) => {
    const updated = [...propItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : (updated[index].quantity || 1);
      const p = field === 'unitPrice' ? Number(value) : (updated[index].unitPrice || 0);
      updated[index].total = q * p;
    }
    setPropItems(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0C0C0C] border border-[#1E1E1E] p-5 rounded-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">Commercial Agency</span>
          <h2 className="text-xl font-bold text-white mt-1">Proposals & Quotations</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Draft and publish project quotations, partnership scopes, and sponsorship proposals for clients.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPropReferenceNo(`PROP-${Date.now().toString().slice(-5)}`);
            setIsEditorOpen(true);
          }}
          className="flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-lg active:scale-95"
        >
          <Plus size={15} />
          <span>New Proposal / Quotation</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <FileText size={14} className="text-purple-400" />
            Total Quoted Pipeline
          </span>
          <div className="text-2xl font-black text-white mt-2 tracking-tight">
            ${metrics.totalQuoted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Across {proposals.length} active proposals
          </span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" />
            Accepted Proposals
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-2 tracking-tight">
            {metrics.acceptedCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Client-approved agreements
          </span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <Clock size={14} className="text-amber-400" />
            Pending Review
          </span>
          <div className="text-2xl font-black text-amber-400 mt-2 tracking-tight">
            {metrics.pendingCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Awaiting client review & sign-off
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0C0C0C] border border-[#1E1E1E] p-3.5 rounded-xl">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={15} className="text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search proposals by title, reference, or recipient..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-neutral-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['All', 'quotation', 'partnership_proposal', 'sponsorship_proposal'].map(t => (
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
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-[#0C0C0C] border border-[#1E1E1E] rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Proposals & Quotations Directory</h3>
          <span className="text-xs font-mono text-neutral-500">{filteredProposals.length} Record(s)</span>
        </div>

        {filteredProposals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121212] text-neutral-400 font-mono border-b border-[#1E1E1E]">
                <tr>
                  <th className="py-3 px-4 font-normal">REF CODE</th>
                  <th className="py-3 px-4 font-normal">TYPE</th>
                  <th className="py-3 px-4 font-normal">TITLE & SCOPE</th>
                  <th className="py-3 px-4 font-normal">RECIPIENT / CLIENT</th>
                  <th className="py-3 px-4 font-normal">VALID UNTIL</th>
                  <th className="py-3 px-4 font-normal text-right">TOTAL (USD)</th>
                  <th className="py-3 px-4 font-normal text-center">CLIENT ACTION</th>
                  <th className="py-3 px-4 font-normal text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filteredProposals.map(prop => {
                  const docTotal = (prop.items || []).reduce((acc, it) => acc + (it.total || (it.quantity || 1) * (it.unitPrice || 0)), 0);

                  const actionBadge = 
                    prop.clientAction === 'Accepted' || prop.status === 'Accepted' ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300' :
                    prop.clientAction === 'Declined' || prop.status === 'Declined' ? 'border-red-800/60 bg-red-950/30 text-red-300' :
                    'border-amber-800/60 bg-amber-950/30 text-amber-300';

                  return (
                    <tr key={prop.id} className="hover:bg-[#121212] transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{prop.referenceNo}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40">
                          {prop.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white max-w-xs truncate">{prop.title}</div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">Issued: {prop.date}</div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300">
                        <div>{prop.recipientName}</div>
                        {prop.recipientOrg && <div className="text-[11px] text-neutral-500">{prop.recipientOrg}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-400">
                        {prop.validityDate || 'Flexible'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ${docTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-mono uppercase ${actionBadge}`}>
                          {prop.clientAction || prop.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const ws = workspaces.find(w => w.id === prop.workspaceId) || activeWorkspace;
                              generateCorporateDocumentPdf(prop, ws);
                            }}
                            className="p-1.5 rounded border border-[#333] bg-[#151515] text-neutral-300 hover:text-white hover:border-[#555]"
                            title="Download PDF"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDocument(prop.id)}
                            className="p-1.5 rounded border border-[#333] bg-[#151515] text-neutral-500 hover:text-red-400"
                            title="Delete Proposal"
                          >
                            <X size={13} />
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
            No proposals or quotations recorded yet.
          </div>
        )}
      </div>

      {/* Create Proposal Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] bg-[#121212]">
              <h3 className="text-sm font-bold text-white">Create Proposal or Quotation</h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Proposal Title *</label>
                  <input
                    type="text"
                    required
                    value={propTitle}
                    onChange={e => setPropTitle(e.target.value)}
                    placeholder="e.g., Global Release Rollout & Visual Identity Scope"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Document Type</label>
                  <select
                    value={propType}
                    onChange={e => setPropType(e.target.value as DocumentType)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="quotation">Creative Quotation</option>
                    <option value="partnership_proposal">Partnership Proposal</option>
                    <option value="sponsorship_proposal">Sponsorship Proposal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Workspace / Client</label>
                  <select
                    value={propWorkspaceId}
                    onChange={e => setPropWorkspaceId(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    {workspaces.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.clientCategory || w.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={propDate}
                    onChange={e => setPropDate(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Validity Date</label>
                  <input
                    type="date"
                    value={propValidityDate}
                    onChange={e => setPropValidityDate(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={propRecipientName}
                    onChange={e => setPropRecipientName(e.target.value)}
                    placeholder="Contact Name"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Organization</label>
                  <input
                    type="text"
                    value={propRecipientOrg}
                    onChange={e => setPropRecipientOrg(e.target.value)}
                    placeholder="Organization"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={propRecipientEmail}
                    onChange={e => setPropRecipientEmail(e.target.value)}
                    placeholder="client@brand.com"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">Proposal Scope & Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-[#FF1E1E] hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                {propItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#141414] p-2.5 rounded-lg border border-[#222]">
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={e => handleUpdateLineItem(idx, 'description', e.target.value)}
                      placeholder="Scope or deliverable description"
                      className="col-span-6 bg-transparent text-xs text-white outline-none"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity || 1}
                      onChange={e => handleUpdateLineItem(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="col-span-2 bg-[#1A1A1A] rounded px-2 py-1 text-xs text-white text-center outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice || 0}
                      onChange={e => handleUpdateLineItem(idx, 'unitPrice', e.target.value)}
                      placeholder="Price ($)"
                      className="col-span-3 bg-[#1A1A1A] rounded px-2 py-1 text-xs text-white text-right outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      disabled={propItems.length === 1}
                      className="col-span-1 text-neutral-500 hover:text-red-400 flex justify-center disabled:opacity-30"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Additional Notes & Terms</label>
                <textarea
                  rows={3}
                  value={propNotes}
                  onChange={e => setPropNotes(e.target.value)}
                  placeholder="Terms, deliverables breakdown, validity conditions..."
                  className="w-full bg-[#151515] border border-[#262626] rounded-lg p-3 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 bg-[#151515] rounded-lg hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#FF1E1E] rounded-lg hover:bg-red-600 transition-colors"
                >
                  Save & Publish Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
