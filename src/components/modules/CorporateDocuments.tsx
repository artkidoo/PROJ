/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Admin Workspace Non-Commercial Business Documents & Collateral
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  ARTIST_DOCUMENT_TYPE_OPTIONS,
  BRAND_DOCUMENT_TYPE_OPTIONS,
  isCommercialDocumentType,
  isLegacyCommercialWorkspaceDoc,
} from '../../lib/financeDocuments';
import type { CorporateDocument, DocumentType, Workspace } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { WorkspaceLogo } from '../brand/LogoSystem';
import { generateCorporateDocumentPdf } from '../../utils/pdfGenerator';
import { BusinessCardDesigner, CollateralSavePayload } from './BusinessCardDesigner';
import { StaffIdCardDesigner } from './StaffIdCardDesigner';
import { EmailSignatureDesigner } from './EmailSignatureDesigner';
import {
  AtSign,
  Building2,
  CreditCard,
  Download,
  Edit3,
  FileText,
  Info,
  Plus,
  Printer,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';

import { normalizeWorkspaceType } from '../../lib/accountNormalization';

interface CorporateDocumentsProps {
  lockedDepartment?: 'Artist' | 'Brand';
  defaultSection?: 'documents' | 'business_cards' | 'staff_id' | 'email_signatures';
}

export const CorporateDocuments: React.FC<CorporateDocumentsProps> = ({
  lockedDepartment,
  defaultSection = 'documents',
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [workspaceDocuments, setWorkspaceDocuments] = useState<CorporateDocument[]>([]);
  const [activeSection, setActiveSection] = useState<
    'documents' | 'business_cards' | 'staff_id' | 'email_signatures'
  >(defaultSection);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'music' | 'administrative' | 'legacy'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Form states (strictly non-commercial documents)
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
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'workspaces'), snapshot => {
      const list = snapshot.docs.map(d => ({ ...(d.data() as Workspace), id: d.id }));
      setWorkspaces(list);
      setSelectedWorkspaceId(prev => prev || list[0]?.id || '');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setWorkspaceDocuments([]);
      return;
    }
    const q = query(
      collection(db, 'workspaces', selectedWorkspaceId, 'documents'),
      orderBy('updatedAt', 'desc'),
    );
    const unsub = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(d => ({ ...(d.data() as CorporateDocument), id: d.id }));
      setWorkspaceDocuments(list);
    });
    return () => unsub();
  }, [selectedWorkspaceId]);

  const visibleWorkspaces = useMemo(() => {
    if (!lockedDepartment) return workspaces;
    return workspaces.filter(
      w => normalizeWorkspaceType(w.clientCategory || w.type) === lockedDepartment,
    );
  }, [workspaces, lockedDepartment]);

  useEffect(() => {
    if (visibleWorkspaces.length > 0 && !visibleWorkspaces.some(w => w.id === selectedWorkspaceId)) {
      setSelectedWorkspaceId(visibleWorkspaces[0].id);
    }
  }, [visibleWorkspaces, selectedWorkspaceId]);

  const activeWorkspace = useMemo(
    () => visibleWorkspaces.find(w => w.id === selectedWorkspaceId) || visibleWorkspaces[0],
    [visibleWorkspaces, selectedWorkspaceId],
  );

  const nonCommercialTypeOptions = useMemo(() => {
    const map = new Map<DocumentType, string>();
    const ordered =
      lockedDepartment === 'Artist'
        ? [...ARTIST_DOCUMENT_TYPE_OPTIONS, ...BRAND_DOCUMENT_TYPE_OPTIONS]
        : [...BRAND_DOCUMENT_TYPE_OPTIONS, ...ARTIST_DOCUMENT_TYPE_OPTIONS];
    ordered.forEach(opt => {
      if (!isCommercialDocumentType(opt.type)) {
        map.set(opt.type, opt.label);
      }
    });
    return Array.from(map.entries()).map(([type, label]) => ({ type, label }));
  }, [lockedDepartment]);

  const filteredDocs = useMemo(() => {
    return workspaceDocuments.filter(d => {
      const legacyCommercial = isLegacyCommercialWorkspaceDoc(d);
      if (activeTabFilter === 'legacy') return legacyCommercial;
      if (activeTabFilter === 'music') {
        return !legacyCommercial && ['split_sheet', 'producer_agreement_memo', 'video_release_memo', 'master_authorization', 'epk', 'tracklist_credits', 'artist_onboarding', 'album_budget'].includes(d.type);
      }
      if (activeTabFilter === 'administrative') {
        return !legacyCommercial && !['split_sheet', 'producer_agreement_memo', 'video_release_memo', 'master_authorization', 'epk', 'tracklist_credits', 'artist_onboarding', 'album_budget'].includes(d.type);
      }
      return true;
    });
  }, [workspaceDocuments, activeTabFilter]);

  const selectedDoc = useMemo(
    () => workspaceDocuments.find(d => d.id === selectedDocId) || filteredDocs[0] || null,
    [workspaceDocuments, selectedDocId, filteredDocs],
  );

  const handleSaveCollateralSpec = async (payload: CollateralSavePayload) => {
    if (!activeWorkspace) return;
    if (isCommercialDocumentType(payload.type)) return;
    const now = new Date().toISOString();
    const created = await addDoc(collection(db, 'workspaces', activeWorkspace.id, 'documents'), {
      workspaceId: activeWorkspace.id,
      library: activeWorkspace.type === 'Artist' ? 'artist' : 'brand',
      type: payload.type,
      title: payload.title,
      referenceNo: payload.referenceNo,
      date: now.slice(0, 10),
      recipientName: payload.recipientName,
      recipientOrg: activeWorkspace.name,
      authorName: 'Platform Admin',
      authorRole: 'Brand Operations',
      status: 'Approved',
      subject: payload.subject || payload.title,
      bodyContent: payload.bodyContent,
      createdAt: now,
      updatedAt: now,
    });
    setSelectedDocId(created.id);
  };

  const handleDownloadText = (docItem: CorporateDocument) => {
    if (!activeWorkspace) return;
    let content = `====================================================\n`;
    content += `${activeWorkspace.name.toUpperCase()} — WORKSPACE DOCUMENT\n`;
    content += `Reference: ${docItem.referenceNo}\n`;
    content += `Date: ${docItem.date}\n`;
    content += `Type: ${docItem.type.toUpperCase().replace(/_/g, ' ')}\n`;
    content += `Title: ${docItem.title}\n`;
    content += `====================================================\n\n`;
    content += `RECIPIENT: ${docItem.recipientName || 'Workspace Record'}\n`;
    if (docItem.recipientOrg) content += `${docItem.recipientOrg}\n`;
    if (docItem.recipientEmail) content += `Email: ${docItem.recipientEmail}\n`;
    content += `\nSUBJECT: ${docItem.subject || docItem.title}\n\n`;
    content += `${docItem.bodyContent}\n`;
    if (docItem.notes) content += `\nNOTES: ${docItem.notes}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(docItem.referenceNo || 'keedohub_doc').replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openNewDocModal = (type: DocumentType = 'official_letter') => {
    if (!activeWorkspace) return;
    setStatusError('');
    const wsPrefix = activeWorkspace.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'KH';
    setEditingDocId(null);
    setDocType(isCommercialDocumentType(type) ? 'official_letter' : type);
    setTitle('Official Workspace Correspondence');
    setReferenceNo(`${wsPrefix}-DOC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setDate(new Date().toISOString().split('T')[0]);
    setRecipientName('');
    setRecipientOrg(activeWorkspace.name);
    setRecipientAddress('');
    setRecipientEmail('');
    setSubject('');
    setBodyContent(`Prepared for ${activeWorkspace.name} workspace records.`);
    setNotes('');
    setIsEditorOpen(true);
  };

  const handleEditCurrentDoc = (docItem: CorporateDocument) => {
    if (isLegacyCommercialWorkspaceDoc(docItem)) {
      setStatusError('Legacy commercial snapshots are read-only here. Use Invoices & Payments or Proposals.');
      return;
    }
    setStatusError('');
    setEditingDocId(docItem.id);
    setDocType(isCommercialDocumentType(docItem.type) ? 'official_letter' : docItem.type);
    setTitle(docItem.title);
    setReferenceNo(docItem.referenceNo);
    setDate(docItem.date);
    setRecipientName(docItem.recipientName);
    setRecipientOrg(docItem.recipientOrg || '');
    setRecipientAddress(docItem.recipientAddress || '');
    setRecipientEmail(docItem.recipientEmail || '');
    setSubject(docItem.subject || '');
    setBodyContent(docItem.bodyContent);
    setNotes(docItem.notes || '');
    setIsEditorOpen(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !title.trim()) return;
    if (isCommercialDocumentType(docType)) {
      setStatusError('Commercial invoices and proposals must be managed in Invoices & Proposals tabs.');
      return;
    }
    setSaving(true);
    setStatusError('');
    const now = new Date().toISOString();
    try {
      const payload = {
        workspaceId: activeWorkspace.id,
        library: activeWorkspace.type === 'Artist' ? 'artist' : 'brand',
        type: docType,
        title: title.trim(),
        referenceNo: referenceNo.trim(),
        date,
        recipientName: recipientName.trim() || activeWorkspace.name,
        recipientOrg: recipientOrg.trim(),
        recipientAddress: recipientAddress.trim(),
        recipientEmail: recipientEmail.trim(),
        authorName: 'Platform Admin',
        authorRole: 'Workspace Document Control',
        status: 'Approved' as const,
        subject: subject.trim(),
        bodyContent,
        notes: notes.trim(),
        updatedAt: now,
      };
      if (editingDocId) {
        await updateDoc(doc(db, 'workspaces', activeWorkspace.id, 'documents', editingDocId), payload);
      } else {
        const created = await addDoc(collection(db, 'workspaces', activeWorkspace.id, 'documents'), {
          ...payload,
          createdAt: now,
        });
        setSelectedDocId(created.id);
      }
      setIsEditorOpen(false);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to save workspace document.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (docItem: CorporateDocument) => {
    if (!activeWorkspace) return;
    await deleteDoc(doc(db, 'workspaces', activeWorkspace.id, 'documents', docItem.id));
  };

  if (!activeWorkspace) {
    return (
      <div className="p-8 text-center text-xs font-mono text-neutral-400 bg-[#0C0C0C] border border-[#1E1E1E] rounded-xl">
        {workspaces.length === 0
          ? 'Loading workspaces from Firestore...'
          : `No ${lockedDepartment || ''} workspaces available in Firestore yet.`}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5 no-print">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            {lockedDepartment === 'Artist'
              ? 'ARTIST DOCUMENTS & PRODUCTION MASTERS'
              : lockedDepartment === 'Brand'
                ? 'BRAND COLLATERAL & CORPORATE DOCUMENTS'
                : 'WORKSPACE BUSINESS DOCUMENTS & COLLATERAL'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {lockedDepartment === 'Artist'
              ? 'Non-commercial artist split sheets, producer memos, master authorizations, EPK records, and correspondence backed by Firestore.'
              : 'Non-commercial workspace dossiers, correspondence, and parameterized Brand collateral tools backed by Firestore.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-[#121212] border border-[#252525] rounded px-3 py-1.5">
            <Building2 size={13} className="text-neutral-400" />
            <select
              value={selectedWorkspaceId}
              onChange={e => {
                setSelectedWorkspaceId(e.target.value);
                setSelectedDocId(null);
              }}
              className="bg-transparent text-xs text-white outline-none"
            >
              {visibleWorkspaces.map(w => (
                <option key={w.id} value={w.id} className="bg-[#111]">
                  {w.name} ({w.type})
                </option>
              ))}
            </select>
          </div>

          {activeSection === 'documents' && (
            <button
              type="button"
              onClick={() => openNewDocModal('official_letter')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>New Workspace Doc</span>
            </button>
          )}
        </div>
      </div>

      {/* Phase 2 Governance Notice */}
      <div className="border border-[#242424] bg-[#101010] rounded-lg px-4 py-3 text-xs text-neutral-300 flex items-start gap-2.5 no-print">
        <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
        <span>
          Commercial billing (Invoices, Receipts) and client-reviewed Quotations/Proposals are governed separately under{' '}
          <strong className="text-white">Invoices &amp; Payments</strong> and{' '}
          <strong className="text-white">Proposals &amp; Quotes</strong>. This archive holds non-commercial brand &amp; artist workspace records.
        </span>
      </div>

      {statusError && (
        <div className="border border-red-900/60 bg-red-950/30 rounded-lg px-4 py-2.5 text-xs text-red-300 flex items-center justify-between">
          <span>{statusError}</span>
          <button type="button" onClick={() => setStatusError('')}><X size={13} /></button>
        </div>
      )}

      {/* Sub-Section Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1C1C1C] pb-3 no-print overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('documents')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
            activeSection === 'documents'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <FileText size={13} />
          <span>Workspace Documents ({workspaceDocuments.length})</span>
        </button>

        {lockedDepartment !== 'Artist' && (
          <>
            <button
              type="button"
              onClick={() => setActiveSection('business_cards')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                activeSection === 'business_cards'
                  ? 'bg-white text-black font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
              }`}
            >
              <CreditCard size={13} />
              <span>Business Card Designer</span>
            </button>

            <button
              type="button"
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
              type="button"
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
          </>
        )}
      </div>

      {activeSection === 'business_cards' && (
        <BusinessCardDesigner workspace={activeWorkspace} onSaveRecord={handleSaveCollateralSpec} />
      )}
      {activeSection === 'staff_id' && (
        <StaffIdCardDesigner workspace={activeWorkspace} onSaveRecord={handleSaveCollateralSpec} />
      )}
      {activeSection === 'email_signatures' && (
        <EmailSignatureDesigner workspace={activeWorkspace} onSaveRecord={handleSaveCollateralSpec} />
      )}

      {activeSection === 'documents' && (
        <>
          {workspaceDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={`No Documents in ${activeWorkspace.name}`}
              description="Create a non-commercial workspace letter, company profile, handover record, or save collateral specs from the tabs above."
              actionLabel="Create Workspace Document"
              onAction={() => openNewDocModal('official_letter')}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-4 no-print">
                <div className="flex items-center gap-1 p-1 bg-[#121212] border border-[#242424] rounded">
                  {(['all', 'administrative', 'music', 'legacy'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTabFilter(tab)}
                      className={`flex-1 py-1 text-[10px] font-mono capitalize rounded ${
                        activeTabFilter === tab ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                  {filteredDocs.map(docItem => {
                    const isSelected = docItem.id === selectedDoc?.id;
                    const legacyFlag = isLegacyCommercialWorkspaceDoc(docItem);
                    return (
                      <div
                        key={docItem.id}
                        onClick={() => setSelectedDocId(docItem.id)}
                        className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#181818] border-neutral-400 text-white'
                            : 'bg-[#0E0E0E] border-[#1E1E1E] text-neutral-300 hover:border-[#333333]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                          <span className="uppercase">{docItem.type.replace(/_/g, ' ')}</span>
                          <span className="tabular-nums">{docItem.date}</span>
                        </div>
                        <h4 className="text-xs font-semibold truncate">{docItem.title}</h4>
                        <div className="text-[11px] text-neutral-400 truncate mt-1">
                          To: {docItem.recipientName || activeWorkspace.name}
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <span>{docItem.referenceNo}</span>
                          <span className={legacyFlag ? 'text-amber-400' : 'text-neutral-300'}>
                            {legacyFlag ? 'LEGACY READ-ONLY' : docItem.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                {selectedDoc && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121212] border border-[#242424] px-4 py-2.5 rounded-lg no-print">
                      <div className="text-xs font-mono text-neutral-400 flex items-center gap-2">
                        <span className="text-white font-medium">{selectedDoc.referenceNo}</span>
                        <span>·</span>
                        <span>{selectedDoc.status.toUpperCase()}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {!isLegacyCommercialWorkspaceDoc(selectedDoc) && (
                          <button
                            type="button"
                            onClick={() => handleEditCurrentDoc(selectedDoc)}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-[#1C1C1C] border border-[#2B2B2B] rounded"
                          >
                            <Edit3 size={12} />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownloadText(selectedDoc)}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-[#1C1C1C] border border-[#2B2B2B] rounded"
                        >
                          <Download size={12} />
                          <span>TXT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => generateCorporateDocumentPdf(selectedDoc, activeWorkspace)}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded"
                        >
                          <Download size={12} strokeWidth={2.5} />
                          <span>Download PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-[#1C1C1C] border border-[#2B2B2B] rounded"
                        >
                          <Printer size={12} />
                          <span>Print</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(selectedDoc)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 bg-[#1C1C1C] border border-[#2B2B2B] rounded"
                          title="Delete Document"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="print-sheet bg-white text-black p-8 sm:p-12 rounded-lg shadow-2xl border border-neutral-300 font-sans min-h-[680px] flex flex-col justify-between">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-black pb-6 gap-4">
                          <WorkspaceLogo
                            workspaceId={activeWorkspace.id}
                            workspaceName={activeWorkspace.name}
                            height={44}
                            theme="monochrome-black"
                          />
                          <div className="text-right text-[11px] font-mono text-neutral-800 space-y-0.5">
                            <div className="font-semibold text-black uppercase">{activeWorkspace.name}</div>
                            <div>KeedoHub Workspace Document</div>
                            {activeWorkspace.contactEmail && <div>{activeWorkspace.contactEmail}</div>}
                          </div>
                        </div>

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
                            <span className="font-semibold text-black uppercase">
                              {selectedDoc.type.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block text-[10px]">STATUS</span>
                            <span className="font-semibold text-black">{selectedDoc.status.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="py-5">
                          <div className="text-[10px] font-mono text-neutral-500 mb-1">PREPARED FOR:</div>
                          <div className="text-sm font-bold text-black">{selectedDoc.recipientName || activeWorkspace.name}</div>
                          {selectedDoc.recipientOrg && (
                            <div className="text-xs font-semibold text-neutral-800">{selectedDoc.recipientOrg}</div>
                          )}
                          {selectedDoc.recipientEmail && (
                            <div className="text-xs font-mono text-neutral-700 mt-0.5">{selectedDoc.recipientEmail}</div>
                          )}
                        </div>

                        {selectedDoc.subject && (
                          <div className="pb-4 font-mono text-xs font-bold uppercase tracking-wider text-black border-b border-neutral-200">
                            RE: {selectedDoc.subject}
                          </div>
                        )}

                        <div className="py-6 text-sm text-neutral-900 leading-relaxed whitespace-pre-line">
                          {selectedDoc.bodyContent}
                        </div>

                        {selectedDoc.notes && (
                          <div className="text-xs text-neutral-600 italic mb-6">{selectedDoc.notes}</div>
                        )}
                      </div>

                      <div className="pt-6 border-t border-neutral-300 text-xs font-mono flex items-center justify-between text-neutral-600">
                        <div>
                          <div className="font-bold text-black">{selectedDoc.authorName || `${activeWorkspace.name} Signatory`}</div>
                          <div>{selectedDoc.authorRole || 'Workspace Document'}</div>
                        </div>
                        <div className="text-right">SECURED VIA KEEDOHUB</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0E0E0E] border border-[#242424] rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {editingDocId ? 'Edit Workspace Document' : 'New Non-Commercial Workspace Document'}
                </h3>
                <p className="text-xs text-neutral-400">Workspace: {activeWorkspace.name}</p>
              </div>
              <button type="button" onClick={() => setIsEditorOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">DOCUMENT TYPE *</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value as DocumentType)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white"
                  >
                    {nonCommercialTypeOptions.map(opt => (
                      <option key={opt.type} value={opt.type}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">REFERENCE NO *</label>
                  <input
                    type="text"
                    required
                    value={referenceNo}
                    onChange={e => setReferenceNo(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">DATE *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white"
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
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">RECIPIENT NAME</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">ORGANIZATION</label>
                  <input
                    type="text"
                    value={recipientOrg}
                    onChange={e => setRecipientOrg(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">SUBJECT LINE</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">BODY CONTENT *</label>
                <textarea
                  rows={5}
                  required
                  value={bodyContent}
                  onChange={e => setBodyContent(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white leading-relaxed"
                />
              </div>

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
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
