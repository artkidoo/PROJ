import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CorporateDocument, DocumentType, DocumentItem } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { LyricalMonogram, LyricalHorizontalLogo } from '../brand/LogoSystem';
import { generateCorporateDocumentPdf } from '../../utils/pdfGenerator';
import { BusinessCardDesigner } from './BusinessCardDesigner';
import { StaffIdCardDesigner } from './StaffIdCardDesigner';
import { EmailSignatureDesigner } from './EmailSignatureDesigner';
import { 
  FileText, 
  Printer, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Eye, 
  ChevronRight,
  Receipt,
  FileCheck2,
  Mail,
  Briefcase,
  CreditCard,
  UserCheck,
  AtSign
} from 'lucide-react';

export const CorporateDocuments: React.FC = () => {
  const { documents, addDocument, updateDocument, deleteDocument, currentRole } = useApp();
  const [activeSection, setActiveSection] = useState<'documents' | 'business_cards' | 'staff_id' | 'email_signatures'>('documents');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'financial' | 'legal' | 'administrative'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Form states for creating / editing documents
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocumentType>('official_letter');
  const [title, setTitle] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientOrg, setRecipientOrg] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyContent, setBodyContent] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days from invoice receipt');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DocumentItem[]>([
    { description: 'Master Recording & Production Services', quantity: 1, unitPrice: 5000, total: 5000 }
  ]);

  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = (doc: CorporateDocument) => {
    let content = `====================================================\n`;
    content += `LYRICAL ENT — OFFICIAL RECORD LABEL DOCUMENT\n`;
    content += `Reference: ${doc.referenceNo}\n`;
    content += `Date: ${doc.date}\n`;
    content += `Document Type: ${doc.type.toUpperCase()}\n`;
    content += `Title: ${doc.title}\n`;
    content += `====================================================\n\n`;
    content += `RECIPIENT:\n`;
    content += `${doc.recipientName}\n`;
    if (doc.recipientOrg) content += `${doc.recipientOrg}\n`;
    if (doc.recipientAddress) content += `${doc.recipientAddress}\n`;
    if (doc.recipientEmail) content += `Email: ${doc.recipientEmail}\n`;
    content += `\nSUBJECT: ${doc.subject || doc.title}\n\n`;
    content += `CONTENT:\n${doc.bodyContent}\n\n`;

    if (doc.items && doc.items.length > 0) {
      content += `LINE ITEMS:\n`;
      let grandTotal = 0;
      doc.items.forEach((item, idx) => {
        const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);
        grandTotal += itemTotal;
        content += `${idx + 1}. ${item.description} - Qty: ${item.quantity || 1} @ $${item.unitPrice || 0} = $${itemTotal}\n`;
      });
      content += `\nTOTAL AMOUNT DUE: $${grandTotal.toFixed(2)}\n`;
    }

    if (doc.paymentTerms) content += `\nPAYMENT TERMS: ${doc.paymentTerms}\n`;
    if (doc.notes) content += `\nADDITIONAL NOTES: ${doc.notes}\n`;

    content += `\n====================================================\n`;
    content += `AUTHORIZED BY: ${doc.authorName} (${doc.authorRole})\n`;
    content += `LYRICAL ENT LLC · All rights reserved.\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.referenceNo || 'lyrical_doc'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openNewDocModal = (type: DocumentType = 'official_letter') => {
    setEditingDocId(null);
    setDocType(type);
    setTitle(type === 'invoice' ? 'Production Master Invoice' : type === 'quotation' ? 'Creative Project Quotation' : 'Official Label Communication');
    setReferenceNo(`LYR-${type.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setDate(new Date().toISOString().split('T')[0]);
    setRecipientName('');
    setRecipientOrg('');
    setRecipientAddress('');
    setRecipientEmail('');
    setSubject('');
    setBodyContent('This document serves as formal corporate communication from LYRICAL ENT LLC.');
    setNotes('');
    setPaymentTerms('Net 30 Days from date of invoice.');
    setItems([{ description: 'Recording & Label Services', quantity: 1, unitPrice: 3500, total: 3500 }]);
    setIsEditorOpen(true);
  };

  const handleEditCurrentDoc = (doc: CorporateDocument) => {
    setEditingDocId(doc.id);
    setDocType(doc.type);
    setTitle(doc.title);
    setReferenceNo(doc.referenceNo);
    setDate(doc.date);
    setRecipientName(doc.recipientName);
    setRecipientOrg(doc.recipientOrg || '');
    setRecipientAddress(doc.recipientAddress || '');
    setRecipientEmail(doc.recipientEmail || '');
    setSubject(doc.subject || '');
    setBodyContent(doc.bodyContent);
    setPaymentTerms(doc.paymentTerms || '');
    setNotes(doc.notes || '');
    setItems(doc.items || [{ description: 'Recording Services', quantity: 1, unitPrice: 1000, total: 1000 }]);
    setIsEditorOpen(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !recipientName) return;

    if (editingDocId) {
      updateDocument(editingDocId, {
        type: docType,
        title,
        referenceNo,
        date,
        recipientName,
        recipientOrg,
        recipientAddress,
        recipientEmail,
        subject,
        bodyContent,
        paymentTerms,
        notes,
        items
      });
    } else {
      const created = addDocument({
        type: docType,
        title,
        referenceNo,
        date,
        recipientName,
        recipientOrg,
        recipientAddress,
        recipientEmail,
        authorName: 'Ojo Abdulkareem',
        authorRole: currentRole,
        status: 'Draft',
        subject,
        bodyContent,
        paymentTerms,
        notes,
        items
      });
      setSelectedDocId(created.id);
    }

    setIsEditorOpen(false);
  };

  const addItemRow = () => {
    setItems(prev => [...prev, { description: 'New line item', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const updateItemRow = (index: number, updates: Partial<DocumentItem>) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const updated = { ...item, ...updates };
      const qty = updated.quantity || 1;
      const price = updated.unitPrice || 0;
      updated.total = qty * price;
      return updated;
    }));
  };

  const removeItemRow = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const filteredDocs = documents.filter(doc => {
    if (activeTabFilter === 'financial') {
      return ['invoice', 'receipt', 'quotation'].includes(doc.type);
    }
    if (activeTabFilter === 'legal') {
      return ['split_sheet', 'partnership_proposal', 'sponsorship_proposal', 'asset_handover'].includes(doc.type);
    }
    if (activeTabFilter === 'administrative') {
      return ['letterhead', 'official_letter', 'internal_memo', 'meeting_minutes', 'business_report', 'email_signature', 'company_profile', 'business_card'].includes(doc.type);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5 no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            CORPORATE DOCUMENTS &amp; COLLATERAL
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Official letterheads, commercial invoices, business cards, security ID badges, and printable PDF dispatch generator
          </p>
        </div>

        {activeSection === 'documents' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openNewDocModal('official_letter')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>New Letter</span>
            </button>

            <button
              onClick={() => openNewDocModal('invoice')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white border border-[#2B2B2B] rounded transition-colors"
            >
              <Receipt size={13} />
              <span>New Invoice</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1C1C1C] pb-3 no-print overflow-x-auto">
        <button
          onClick={() => setActiveSection('documents')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
            activeSection === 'documents'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <FileText size={13} />
          <span>A4 Official Documents &amp; Letters ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('business_cards')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
            activeSection === 'business_cards'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <CreditCard size={13} />
          <span>Business Card Designer (3 Templates)</span>
        </button>

        <button
          onClick={() => setActiveSection('staff_id')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
            activeSection === 'staff_id'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <UserCheck size={13} />
          <span>Staff ID Badges (CR80 PVC)</span>
        </button>

        <button
          onClick={() => setActiveSection('email_signatures')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
            activeSection === 'email_signatures'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <AtSign size={13} />
          <span>Email Signatures (HTML)</span>
        </button>
      </div>

      {/* Switch Between Sub-Sections */}
      {activeSection === 'business_cards' && <BusinessCardDesigner />}
      {activeSection === 'staff_id' && <StaffIdCardDesigner />}
      {activeSection === 'email_signatures' && <EmailSignatureDesigner />}

      {activeSection === 'documents' && (
        <>

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Corporate Documents in Archive"
          description="Create your first official LYRICAL ENT letterhead, executive memo, or commercial invoice."
          actionLabel="Create Letterhead Document"
          onAction={() => openNewDocModal('official_letter')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Document Browser Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-4 no-print">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 bg-[#121212] border border-[#242424] rounded">
              {(['all', 'financial', 'legal', 'administrative'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTabFilter(tab)}
                  className={`flex-1 py-1 text-[11px] font-mono capitalize rounded ${
                    activeTabFilter === tab ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {filteredDocs.map(doc => {
                const isSelected = doc.id === selectedDoc?.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#181818] border-neutral-400 text-white shadow-sm' 
                        : 'bg-[#0E0E0E] border-[#1E1E1E] text-neutral-300 hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                      <span className="uppercase">{doc.type.replace('_', ' ')}</span>
                      <span className="tabular-nums">{doc.date}</span>
                    </div>

                    <h4 className="text-xs font-semibold truncate leading-snug">{doc.title}</h4>

                    <div className="text-[11px] text-neutral-400 truncate mt-1">
                      To: {doc.recipientName} {doc.recipientOrg && `(${doc.recipientOrg})`}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono text-neutral-500">
                      <span>{doc.referenceNo}</span>
                      <span className="text-neutral-300 font-medium">{doc.status.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Preview & Printable A4 Sheet (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedDoc && (
              <>
                {/* Control bar above sheet */}
                <div className="flex items-center justify-between bg-[#121212] border border-[#242424] px-4 py-2.5 rounded-lg no-print">
                  <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
                    <span className="text-white font-medium">{selectedDoc.referenceNo}</span>
                    <span>·</span>
                    <span>{selectedDoc.status.toUpperCase()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditCurrentDoc(selectedDoc)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-[#1C1C1C] hover:bg-[#252525] border border-[#2B2B2B] rounded transition-colors"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDownloadText(selectedDoc)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-[#1C1C1C] hover:bg-[#252525] border border-[#2B2B2B] rounded transition-colors"
                      title="Download formatted text document"
                    >
                      <Download size={12} />
                      <span>Download TXT</span>
                    </button>

                    <button
                      onClick={() => generateCorporateDocumentPdf(selectedDoc)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                      title="Download high-resolution official A4 PDF document"
                    >
                      <Download size={12} strokeWidth={2.5} />
                      <span>Download PDF</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-[#1C1C1C] hover:bg-[#252525] border border-[#2B2B2B] rounded transition-colors"
                      title="Direct browser print"
                    >
                      <Printer size={12} />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {/* The Formal A4 Letterhead Document (High contrast monochrome layout) */}
                <div className="print-sheet bg-white text-black p-8 sm:p-12 rounded-lg shadow-2xl border border-neutral-300 font-sans min-h-[750px] flex flex-col justify-between">
                  {/* Top Letterhead Header */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-black pb-6 gap-4">
                      <div>
                        <LyricalHorizontalLogo height={44} theme="monochrome-black" showDescriptor={true} />
                      </div>

                      <div className="text-right text-[11px] font-mono text-neutral-800 space-y-0.5">
                        <div className="font-semibold text-black">LYRICAL ENT LLC</div>
                        <div>Production Sound Lab & Global Offices</div>
                        <div>London · Los Angeles</div>
                        <div>contact@lyricalent.com · www.lyricalent.com</div>
                      </div>
                    </div>

                    {/* Metadata strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-neutral-300 text-xs font-mono">
                      <div>
                        <span className="text-neutral-500 block text-[10px]">DOCUMENT REF</span>
                        <span className="font-semibold text-black">{selectedDoc.referenceNo}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">ISSUE DATE</span>
                        <span className="font-semibold text-black">{selectedDoc.date}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">TYPE</span>
                        <span className="font-semibold text-black uppercase">{selectedDoc.type.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">STATUS</span>
                        <span className="font-semibold text-black">{selectedDoc.status.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Recipient Details */}
                    <div className="py-6">
                      <div className="text-[10px] font-mono text-neutral-500 mb-1">PREPARED FOR:</div>
                      <div className="text-sm font-bold text-black">{selectedDoc.recipientName}</div>
                      {selectedDoc.recipientOrg && (
                        <div className="text-xs font-semibold text-neutral-800">{selectedDoc.recipientOrg}</div>
                      )}
                      {selectedDoc.recipientAddress && (
                        <div className="text-xs text-neutral-700 whitespace-pre-line mt-1">{selectedDoc.recipientAddress}</div>
                      )}
                      {selectedDoc.recipientEmail && (
                        <div className="text-xs font-mono text-neutral-700 mt-0.5">{selectedDoc.recipientEmail}</div>
                      )}
                    </div>

                    {/* Subject Line */}
                    {selectedDoc.subject && (
                      <div className="pb-4 font-mono text-xs font-bold uppercase tracking-wider text-black border-b border-neutral-200">
                        RE: {selectedDoc.subject}
                      </div>
                    )}

                    {/* Main Document Body */}
                    <div className="py-6 text-sm text-neutral-900 leading-relaxed whitespace-pre-line">
                      {selectedDoc.bodyContent}
                    </div>

                    {/* Line Items Table if Invoice or Quotation */}
                    {selectedDoc.items && selectedDoc.items.length > 0 && (
                      <div className="my-6">
                        <table className="w-full text-left text-xs border border-neutral-300">
                          <thead className="bg-neutral-100 text-neutral-800 font-mono text-[11px] border-b border-neutral-300">
                            <tr>
                              <th className="p-2.5">DESCRIPTION</th>
                              <th className="p-2.5 text-center">QTY</th>
                              <th className="p-2.5 text-right">UNIT PRICE</th>
                              <th className="p-2.5 text-right">TOTAL</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 font-mono">
                            {selectedDoc.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="p-2.5 font-sans font-medium text-neutral-900">{item.description}</td>
                                <td className="p-2.5 text-center text-neutral-800">{item.quantity || 1}</td>
                                <td className="p-2.5 text-right text-neutral-800">${(item.unitPrice || 0).toLocaleString()}</td>
                                <td className="p-2.5 text-right font-bold text-black">${((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t-2 border-black bg-neutral-50 font-mono text-xs">
                            <tr>
                              <td colSpan={3} className="p-2.5 text-right font-bold uppercase">Grand Total (USD):</td>
                              <td className="p-2.5 text-right font-black text-sm text-black">
                                ${selectedDoc.items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.unitPrice || 0)), 0).toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}

                    {/* Payment Terms & Notes */}
                    {selectedDoc.paymentTerms && (
                      <div className="p-3 bg-neutral-100 border border-neutral-300 rounded text-xs font-mono text-neutral-800 mb-4">
                        <span className="font-bold text-black">TERMS: </span>
                        {selectedDoc.paymentTerms}
                      </div>
                    )}

                    {selectedDoc.notes && (
                      <div className="text-xs text-neutral-600 italic mb-6">
                        {selectedDoc.notes}
                      </div>
                    )}
                  </div>

                  {/* Document Signature & Execution Footer */}
                  <div className="pt-8 border-t border-neutral-300 mt-12">
                    <div className="grid grid-cols-2 gap-8 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-neutral-500 mb-6">AUTHORIZED SIGNATORY:</div>
                        <div className="font-serif italic text-base text-black mb-1">Ojo Abdulkareem</div>
                        <div className="font-bold text-black">{selectedDoc.authorName}</div>
                        <div className="text-neutral-700">{selectedDoc.authorRole}</div>
                        <div className="text-neutral-500 text-[10px] mt-1">LYRICAL ENT LLC Executive Office</div>
                      </div>

                      <div className="text-right flex flex-col justify-end items-end">
                        <div className="flex flex-col items-center mb-1">
                          <LyricalMonogram size={48} framed={true} theme="monochrome-black" />
                          <span className="font-mono text-[8px] font-bold tracking-widest text-black mt-1 uppercase">OFFICIAL SEAL</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          Registered Trademark · Catalog Registry Archive
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </>
      )}

      {/* Document Create / Edit Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0E0E0E] border border-[#242424] rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">
              {editingDocId ? 'Edit Corporate Document' : 'Draft New Corporate Document'}
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              Generate official letterheads, statements, split sheets, or invoices for LYRICAL ENT
            </p>

            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">TYPE *</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value as DocumentType)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  >
                    <option value="official_letter">Official Letter</option>
                    <option value="company_profile">Company Profile Dossier</option>
                    <option value="invoice">Commercial Invoice</option>
                    <option value="receipt">Payment Receipt</option>
                    <option value="quotation">Project Quotation</option>
                    <option value="partnership_proposal">Partnership Proposal</option>
                    <option value="sponsorship_proposal">Sponsorship Proposal</option>
                    <option value="internal_memo">Internal Executive Memo</option>
                    <option value="meeting_minutes">Meeting Minutes</option>
                    <option value="asset_handover">Asset Handover Form</option>
                    <option value="split_sheet">Songwriter Split Sheet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">REFERENCE NO *</label>
                  <input
                    type="text"
                    required
                    value={referenceNo}
                    onChange={e => setReferenceNo(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">DATE *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">DOCUMENT TITLE *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Master Synchronization License Notice"
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">RECIPIENT NAME *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="Recipient contact name"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">RECIPIENT COMPANY</label>
                  <input
                    type="text"
                    value={recipientOrg}
                    onChange={e => setRecipientOrg(e.target.value)}
                    placeholder="Company or agency"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">SUBJECT LINE</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Formal subject line"
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">BODY CONTENT</label>
                <textarea
                  rows={4}
                  required
                  value={bodyContent}
                  onChange={e => setBodyContent(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-sans leading-relaxed"
                />
              </div>

              {/* Items for financial docs */}
              {(docType === 'invoice' || docType === 'quotation' || docType === 'receipt') && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono text-neutral-400">LINE ITEMS</label>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 font-mono"
                    >
                      <Plus size={12} />
                      <span>Add Item</span>
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#141414] p-2 rounded border border-[#242424]">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={e => updateItemRow(idx, { description: e.target.value })}
                          className="w-full bg-transparent text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateItemRow(idx, { quantity: Number(e.target.value) })}
                          className="w-full bg-transparent text-xs text-white focus:outline-none text-center font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={e => updateItemRow(idx, { unitPrice: Number(e.target.value) })}
                          className="w-full bg-transparent text-xs text-white focus:outline-none text-right font-mono"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-neutral-500 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-[#1C1C1C] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
