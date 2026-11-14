/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Admin Invoices & Payments Management
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CorporateDocument, DocumentItem, PaymentRecord, Workspace } from '../../types';
import { FileText, Plus, Search, DollarSign, Receipt, Clock, CheckCircle2, AlertTriangle, Download, Printer, X, Eye, ShieldAlert } from 'lucide-react';
import { generateCorporateDocumentPdf } from '../../utils/pdfGenerator';

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
  const { documents, addDocument, updateDocument, deleteDocument, workspaces, activeWorkspace, clientProfile, firebaseUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialSelectedId || '');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetInvoiceForPayment, setTargetInvoiceForPayment] = useState<CorporateDocument | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['method']>('Wire Transfer');

  // Invoice form state
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceReferenceNo, setInvoiceReferenceNo] = useState(`INV-${Date.now().toString().slice(-5)}`);
  const [invoiceWorkspaceId, setInvoiceWorkspaceId] = useState(workspaces[0]?.id || activeWorkspace?.id || '');
  const [invoiceRecipientName, setInvoiceRecipientName] = useState('');
  const [invoiceRecipientOrg, setInvoiceRecipientOrg] = useState('');
  const [invoiceRecipientEmail, setInvoiceRecipientEmail] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [invoiceItems, setInvoiceItems] = useState<DocumentItem[]>([
    { description: 'Commercial Production Services & Licensing', quantity: 1, unitPrice: 5000, total: 5000 }
  ]);
  const [invoicePaymentTerms, setInvoicePaymentTerms] = useState('Net 30 Days from invoice receipt');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<CorporateDocument['status']>('Issued');

  // Filter invoices only
  const invoices = useMemo(() => {
    return documents.filter(d => d.type === 'invoice' || d.type === 'receipt');
  }, [documents]);

  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let pendingBalance = 0;
    let overdueCount = 0;

    invoices.forEach(inv => {
      const docTotal = (inv.items || []).reduce((acc, it) => acc + (it.total || (it.quantity || 1) * (it.unitPrice || 0)), 0);
      totalInvoiced += docTotal;
      const paid = inv.totalPaid || 0;
      totalPaid += paid;
      const balance = Math.max(0, docTotal - paid);
      pendingBalance += balance;
      if (inv.status === 'Overdue' || (inv.date && inv.status !== 'Paid' && new Date(inv.date).getTime() + 30*24*60*60*1000 < Date.now())) {
        overdueCount++;
      }
    });

    return { totalInvoiced, totalPaid, pendingBalance, overdueCount };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.recipientOrg || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId) || filteredInvoices[0] || null;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceTitle.trim()) return;

    const calculatedItems = invoiceItems.map(it => ({
      ...it,
      total: (it.quantity || 1) * (it.unitPrice || 0)
    }));
    const totalAmount = calculatedItems.reduce((acc, it) => acc + it.total, 0);

    const ws = workspaces.find(w => w.id === invoiceWorkspaceId);

    const newDoc: Omit<CorporateDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      workspaceId: invoiceWorkspaceId,
      type: 'invoice',
      title: invoiceTitle.trim(),
      referenceNo: invoiceReferenceNo.trim(),
      date: invoiceDate,
      validityDate: invoiceDueDate,
      recipientName: invoiceRecipientName.trim() || ws?.name || 'Client',
      recipientOrg: invoiceRecipientOrg.trim() || ws?.name || '',
      recipientEmail: invoiceRecipientEmail.trim(),
      authorName: clientProfile?.displayName || firebaseUser?.displayName || 'Platform Admin',
      authorRole: 'Managing Director & Platform Admin',
      status: invoiceStatus,
      subject: `Commercial Invoice ${invoiceReferenceNo}`,
      bodyContent: `Commercial invoice issued for creative production services rendered under ${ws?.name || 'KeedoHub'} workspace agreement.`,
      items: calculatedItems,
      paymentTerms: invoicePaymentTerms,
      notes: invoiceNotes,
      payments: [],
      totalPaid: 0,
      balanceDue: totalAmount,
    };

    addDocument(newDoc);
    setIsEditorOpen(false);
    setInvoiceTitle('');
    setInvoiceRecipientName('');
    setInvoiceRecipientOrg('');
    setInvoiceRecipientEmail('');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForPayment || paymentAmount <= 0) return;

    const docTotal = (targetInvoiceForPayment.items || []).reduce((acc, it) => acc + (it.total || (it.quantity || 1) * (it.unitPrice || 0)), 0);
    const existingPayments = targetInvoiceForPayment.payments || [];
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      amount: paymentAmount,
      date: paymentDate,
      reference: paymentReference.trim() || `WIRE-${Math.floor(100000 + Math.random() * 900000)}`,
      method: paymentMethod,
      recordedBy: clientProfile?.displayName || firebaseUser?.displayName || 'Admin',
    };

    const updatedPayments = [...existingPayments, newPayment];
    const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = Math.max(0, docTotal - totalPaid);
    const newStatus: CorporateDocument['status'] = balanceDue === 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : targetInvoiceForPayment.status;

    updateDocument(targetInvoiceForPayment.id, {
      payments: updatedPayments,
      totalPaid,
      balanceDue,
      status: newStatus,
    });

    setIsPaymentModalOpen(false);
    setTargetInvoiceForPayment(null);
    setPaymentAmount(0);
    setPaymentReference('');
  };

  const handleAddLineItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: keyof DocumentItem, value: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : (updated[index].quantity || 1);
      const p = field === 'unitPrice' ? Number(value) : (updated[index].unitPrice || 0);
      updated[index].total = q * p;
    }
    setInvoiceItems(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0C0C0C] border border-[#1E1E1E] p-5 rounded-xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">Financial Operations</span>
          <h2 className="text-xl font-bold text-white mt-1">Invoices & Settlement Ledger</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Issue commercial invoices, track wires and ACH settlements, and manage outstanding balances.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setInvoiceReferenceNo(`INV-${Date.now().toString().slice(-5)}`);
            setIsEditorOpen(true);
          }}
          className="flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors shadow-lg active:scale-95"
        >
          <Plus size={15} />
          <span>New Commercial Invoice</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <FileText size={14} className="text-blue-400" />
            Total Invoiced
          </span>
          <div className="text-2xl font-black text-white mt-2 tracking-tight">
            ${metrics.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Across {invoices.length} invoices
          </span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <Receipt size={14} className="text-emerald-400" />
            Total Settled
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-2 tracking-tight">
            ${metrics.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Wire & ACH receipts verified
          </span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <Clock size={14} className="text-amber-400" />
            Outstanding Balance
          </span>
          <div className="text-2xl font-black text-amber-400 mt-2 tracking-tight">
            ${metrics.pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Pending client wire settlement
          </span>
        </div>

        <div className="bg-[#0C0C0C] border border-[#1E1E1E] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-neutral-500 uppercase flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-400" />
            Overdue Invoices
          </span>
          <div className="text-2xl font-black text-red-400 mt-2 tracking-tight">
            {metrics.overdueCount}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Requiring accounts follow-up
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
            placeholder="Search by reference, title, client name or organization..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-neutral-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['All', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Draft'].map(status => (
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

      {/* Main Invoices Table */}
      <div className="bg-[#0C0C0C] border border-[#1E1E1E] rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Commercial Invoices</h3>
          <span className="text-xs font-mono text-neutral-500">{filteredInvoices.length} Record(s)</span>
        </div>

        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121212] text-neutral-400 font-mono border-b border-[#1E1E1E]">
                <tr>
                  <th className="py-3 px-4 font-normal">INVOICE #</th>
                  <th className="py-3 px-4 font-normal">TITLE & DESCRIPTION</th>
                  <th className="py-3 px-4 font-normal">RECIPIENT / CLIENT</th>
                  <th className="py-3 px-4 font-normal">ISSUE / DUE</th>
                  <th className="py-3 px-4 font-normal text-right">TOTAL</th>
                  <th className="py-3 px-4 font-normal text-right">PAID / BALANCE</th>
                  <th className="py-3 px-4 font-normal text-center">STATUS</th>
                  <th className="py-3 px-4 font-normal text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {filteredInvoices.map(inv => {
                  const docTotal = (inv.items || []).reduce((acc, it) => acc + (it.total || (it.quantity || 1) * (it.unitPrice || 0)), 0);
                  const paid = inv.totalPaid || 0;
                  const balance = Math.max(0, docTotal - paid);

                  const statusBadge = 
                    inv.status === 'Paid' ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300' :
                    inv.status === 'Partially Paid' ? 'border-blue-800/60 bg-blue-950/30 text-blue-300' :
                    inv.status === 'Overdue' ? 'border-red-800/60 bg-red-950/30 text-red-300' :
                    'border-neutral-700 bg-neutral-900 text-neutral-300';

                  return (
                    <tr key={inv.id} className="hover:bg-[#121212] transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{inv.referenceNo}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white max-w-xs truncate">{inv.title}</div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">{inv.paymentTerms || 'Net 30'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300">
                        <div>{inv.recipientName}</div>
                        {inv.recipientOrg && <div className="text-[11px] text-neutral-500">{inv.recipientOrg}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-400">
                        <div>{inv.date}</div>
                        {inv.validityDate && <div className="text-[10px] text-neutral-500">Due: {inv.validityDate}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ${docTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="text-emerald-400">${paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[11px] text-amber-400">Bal: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-mono uppercase ${statusBadge}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetInvoiceForPayment(inv);
                              setPaymentAmount(balance > 0 ? balance : docTotal);
                              setIsPaymentModalOpen(true);
                            }}
                            className="rounded border border-[#333] bg-[#151515] px-2 py-1 text-[11px] text-white hover:border-emerald-500 transition-colors"
                            title="Record Payment"
                          >
                            + Payment
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const ws = workspaces.find(w => w.id === inv.workspaceId) || activeWorkspace;
                              generateCorporateDocumentPdf(inv, ws);
                            }}
                            className="p-1.5 rounded border border-[#333] bg-[#151515] text-neutral-300 hover:text-white hover:border-[#555]"
                            title="Download PDF"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDocument(inv.id)}
                            className="p-1.5 rounded border border-[#333] bg-[#151515] text-neutral-500 hover:text-red-400"
                            title="Delete Invoice"
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
            No invoices found matching your filters.
          </div>
        )}
      </div>

      {/* Create Invoice Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] bg-[#121212]">
              <h3 className="text-sm font-bold text-white">Create Commercial Invoice</h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Invoice Title *</label>
                  <input
                    type="text"
                    required
                    value={invoiceTitle}
                    onChange={e => setInvoiceTitle(e.target.value)}
                    placeholder="e.g., Q4 Master Production & Licensing Invoice"
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
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Workspace / Client</label>
                  <select
                    value={invoiceWorkspaceId}
                    onChange={e => setInvoiceWorkspaceId(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-white"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={invoiceRecipientName}
                    onChange={e => setInvoiceRecipientName(e.target.value)}
                    placeholder="Client Contact Name"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Organization / Artist</label>
                  <input
                    type="text"
                    value={invoiceRecipientOrg}
                    onChange={e => setInvoiceRecipientOrg(e.target.value)}
                    placeholder="Organization Name"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={invoiceRecipientEmail}
                    onChange={e => setInvoiceRecipientEmail(e.target.value)}
                    placeholder="billing@client.com"
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">Service Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-[#FF1E1E] hover:underline"
                  >
                    + Add Line Item
                  </button>
                </div>

                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#141414] p-2.5 rounded-lg border border-[#222]">
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
                      disabled={invoiceItems.length === 1}
                      className="col-span-1 text-neutral-500 hover:text-red-400 flex justify-center disabled:opacity-30"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
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
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Initial Status</label>
                  <select
                    value={invoiceStatus}
                    onChange={e => setInvoiceStatus(e.target.value as any)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Issued">Issued</option>
                    <option value="Draft">Draft</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
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
                  Save & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && targetInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Record Wire / ACH Payment</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">Invoice {targetInvoiceForPayment.referenceNo}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Payment Amount (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full bg-[#151515] border border-[#262626] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
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
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Reference / Confirmation #</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder="e.g., SWIFT-REF-987124"
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  Record Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
