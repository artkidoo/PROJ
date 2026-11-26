import React, { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import {
  ArrowDownToLine,
  BadgeCheck,
  CreditCard,
  FilePlus2,
  Mail,
  Palette,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import {
  BRAND_DOCUMENT_TYPE_OPTIONS,
  isCommercialDocumentType,
  isLegacyCommercialWorkspaceDoc,
} from '../../lib/financeDocuments';
import type { BrandGuidelinesData, ClientProfile, CorporateDocument, DocumentType, Workspace } from '../../types';
import { generateBrandGuidelinesPdf, generateCorporateDocumentPdf } from '../../utils/pdfGenerator';
import { BusinessCardDesigner, CollateralSavePayload } from '../modules/BusinessCardDesigner';
import { StaffIdCardDesigner } from '../modules/StaffIdCardDesigner';
import { EmailSignatureDesigner } from '../modules/EmailSignatureDesigner';

export interface BrandDocumentLibraryProps {
  workspace: Workspace;
  clientProfile: ClientProfile | null;
  accountName: string;
  projects?: Array<{ id: string; title: string }>;
  documents: CorporateDocument[];
  onOpenBrandIdentity?: () => void;
  onOpenBilling?: () => void;
  onOpenProposals?: () => void;
  onRequestCollateral?: () => void;
  onOpenCreativeHub?: () => void;
}

const panelClass = 'rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 sm:p-6';
const fieldClass =
  'w-full rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white outline-none focus:border-[#FF1E1E] transition-colors';
const labelClass =
  'mb-1.5 block text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-neutral-500';

const NON_COMMERCIAL_STATUSES: Array<'Draft' | 'Under Review' | 'Approved' | 'Issued'> = [
  'Draft',
  'Under Review',
  'Approved',
  'Issued',
];

function downloadText(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildGuidelinesPayload(workspace: Workspace): BrandGuidelinesData {
  const bp = workspace.brandProfile;
  return {
    brandVoice:
      bp?.brandVoice?.trim() ||
      `${workspace.name} communicates with clarity, discipline, and consistent visual authority across print and digital surfaces.`,
    photographyDirection:
      bp?.photographyDirection?.trim() ||
      'Use crisp editorial lighting, controlled neutral contrast, and authentic brand-aligned framing.',
    graphicDesignPrinciples:
      bp?.graphicDesignPrinciples?.trim() ||
      'Maintain strict modular grids, intentional whitespace, and legible typographic hierarchy.',
    clearSpaceRules:
      bp?.usageGuidelines?.trim() ||
      'Maintain an exclusion zone equal to the cap-height of the primary wordmark on all sides.',
    minLogoSizePrint: '24 mm minimum width',
    minLogoSizeDigital: '96 px minimum width',
    backgroundRules: `Primary lockup sits on clean light (#FFFFFF) or deep neutral (${workspace.brand?.secondaryColor || '#0A0A0A'}) surfaces with primary accent (${workspace.brand?.primaryColor || '#FF1E1E'}).`,
    incorrectUsageRules: [
      'Do not stretch, skew, or distort primary logo proportions.',
      'Do not substitute unapproved colors outside the workspace token palette.',
      'Do not place dark wordmarks over low-contrast backgrounds without a scrim.',
    ],
  };
}

export const BrandDocumentLibrary: React.FC<BrandDocumentLibraryProps> = ({
  workspace,
  clientProfile,
  accountName,
  projects = [],
  documents,
  onOpenBrandIdentity,
  onOpenBilling,
  onOpenProposals,
  onRequestCollateral,
  onOpenCreativeHub,
}) => {
  const [subTab, setSubTab] = useState<'vault' | 'business-cards' | 'staff-ids' | 'email-signatures'>('vault');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewDoc, setPreviewDoc] = useState<CorporateDocument | null>(null);

  const [editingId, setEditingId] = useState('');
  const [docForm, setDocForm] = useState({
    type: 'company_profile' as DocumentType,
    title: '',
    referenceNo: '',
    date: new Date().toISOString().slice(0, 10),
    recipientName: '',
    recipientOrg: '',
    recipientEmail: '',
    projectId: '',
    subject: '',
    bodyContent: '',
    notes: '',
    status: 'Draft' as 'Draft' | 'Under Review' | 'Approved' | 'Issued',
  });

  const brandSafeDocs = useMemo(
    () => documents.filter(d => !isLegacyCommercialWorkspaceDoc(d)),
    [documents],
  );
  const legacyCommercialDocs = useMemo(
    () => documents.filter(d => isLegacyCommercialWorkspaceDoc(d)),
    [documents],
  );

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return brandSafeDocs.filter(docItem => {
      if (typeFilter !== 'All' && docItem.type !== typeFilter) return false;
      if (!q) return true;
      return (
        docItem.title.toLowerCase().includes(q) ||
        (docItem.referenceNo || '').toLowerCase().includes(q) ||
        (docItem.recipientName || '').toLowerCase().includes(q) ||
        (docItem.bodyContent || '').toLowerCase().includes(q)
      );
    });
  }, [brandSafeDocs, searchQuery, typeFilter]);

  const showNotice = (msg: string) => {
    setError('');
    setNotice(msg);
  };

  const resetDocForm = () => {
    setEditingId('');
    setDocForm({
      type: 'company_profile',
      title: '',
      referenceNo: '',
      date: new Date().toISOString().slice(0, 10),
      recipientName: '',
      recipientOrg: '',
      recipientEmail: '',
      projectId: '',
      subject: '',
      bodyContent: '',
      notes: '',
      status: 'Draft',
    });
  };

  const persistBrandDoc = async (payload: {
    type: DocumentType;
    title: string;
    referenceNo: string;
    date: string;
    recipientName: string;
    recipientOrg?: string;
    recipientEmail?: string;
    projectId?: string;
    subject?: string;
    bodyContent: string;
    notes?: string;
    status: 'Draft' | 'Under Review' | 'Approved' | 'Issued';
  }) => {
    if (isCommercialDocumentType(payload.type)) {
      throw new Error(
        'Commercial invoices, quotes, and proposals cannot be created inside Brand Documents. KeedoHub Admin issues commercial records under Billing & Agreements.',
      );
    }
    const cleanTitle = payload.title.trim().slice(0, 160);
    if (!cleanTitle) throw new Error('Document title is required.');

    const now = new Date().toISOString();
    const docData = {
      workspaceId: workspace.id,
      library: 'brand' as const,
      type: payload.type,
      title: cleanTitle,
      referenceNo:
        payload.referenceNo.trim() ||
        `BRD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: payload.date || now.slice(0, 10),
      recipientName: payload.recipientName.trim() || workspace.name,
      recipientOrg: payload.recipientOrg?.trim() || workspace.name,
      recipientEmail: payload.recipientEmail?.trim() || clientProfile?.email || '',
      ...(payload.projectId ? { projectId: payload.projectId } : {}),
      authorName: accountName,
      authorRole: 'Brand Workspace Owner',
      status: payload.status,
      subject: payload.subject?.trim() || cleanTitle,
      bodyContent: payload.bodyContent.slice(0, 20000),
      ...(payload.notes?.trim() ? { notes: payload.notes.trim().slice(0, 1000) } : {}),
      updatedAt: now,
    };

    if (editingId) {
      await updateDoc(doc(db, 'workspaces', workspace.id, 'documents', editingId), docData);
      showNotice(`Updated "${cleanTitle}".`);
      resetDocForm();
    } else {
      await addDoc(collection(db, 'workspaces', workspace.id, 'documents'), {
        ...docData,
        createdAt: now,
      });
      showNotice(`Saved "${cleanTitle}" to Brand & Business Docs.`);
    }
  };

  const handleSaveVaultDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await persistBrandDoc(docForm);
      if (!editingId) resetDocForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCollateralRecord = async (collateral: CollateralSavePayload) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await persistBrandDoc({
        type: collateral.type,
        title: collateral.title,
        referenceNo: collateral.referenceNo,
        date: new Date().toISOString().slice(0, 10),
        recipientName: collateral.recipientName,
        subject: collateral.subject || collateral.title,
        bodyContent: collateral.bodyContent,
        status: 'Approved',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (docItem: CorporateDocument) => {
    if (isLegacyCommercialWorkspaceDoc(docItem)) {
      setError('Legacy commercial invoices and proposals are read-only here.');
      return;
    }
    setError('');
    try {
      await deleteDoc(doc(db, 'workspaces', workspace.id, 'documents', docItem.id));
      showNotice(`Removed "${docItem.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      {/* Navigation & Brand Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'vault' as const, label: `Brand Vault (${brandSafeDocs.length})`, icon: FilePlus2 },
            { id: 'business-cards' as const, label: 'Business Cards', icon: CreditCard },
            { id: 'staff-ids' as const, label: 'Staff ID Cards', icon: BadgeCheck },
            { id: 'email-signatures' as const, label: 'Email Signatures', icon: Mail },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                  subTab === tab.id
                    ? 'bg-white text-black font-semibold'
                    : 'border border-[#262626] bg-[#121212] text-neutral-400 hover:text-white'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenCreativeHub && (
            <button
              type="button"
              onClick={onOpenCreativeHub}
              className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#FF1E1E] hover:text-white whitespace-nowrap shrink-0"
            >
              <Sparkles size={13} className="text-[#FF1E1E]" />
              <span>Brand &amp; Industry Packs</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => generateBrandGuidelinesPdf(buildGuidelinesPayload(workspace), workspace)}
            className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white whitespace-nowrap shrink-0"
          >
            <ArrowDownToLine size={13} />
            <span>Brand Guidelines PDF</span>
          </button>
          {onOpenBrandIdentity && (
            <button
              type="button"
              onClick={onOpenBrandIdentity}
              className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-neutral-300 hover:text-white whitespace-nowrap shrink-0"
            >
              <Palette size={13} />
              <span>Brand Identity</span>
            </button>
          )}
          {onRequestCollateral && (
            <button
              type="button"
              onClick={onRequestCollateral}
              className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 whitespace-nowrap shrink-0"
            >
              <Plus size={13} />
              <span>Request Collateral</span>
            </button>
          )}
        </div>
      </div>

      {legacyCommercialDocs.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-amber-200">
              {legacyCommercialDocs.length} legacy commercial snapshot(s) exist in workspace history (read-only).
            </p>
            <p className="mt-0.5 text-amber-100/75">
              Official billing statements, receipts, and interactive proposals now live under Billing &amp; Agreements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenBilling && (
              <button
                type="button"
                onClick={onOpenBilling}
                className="rounded border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 font-semibold text-amber-100 hover:bg-amber-500/25 whitespace-nowrap shrink-0"
              >
                Invoices &amp; Receipts
              </button>
            )}
            {onOpenProposals && (
              <button
                type="button"
                onClick={onOpenProposals}
                className="rounded border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 font-semibold text-amber-100 hover:bg-amber-500/25 whitespace-nowrap shrink-0"
              >
                Proposals &amp; Quotes
              </button>
            )}
          </div>
        </div>
      )}

      {subTab === 'vault' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(310px,.75fr)]">
          <section className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A] pb-4 mb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">
                  Brand OS · Document Vault
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">Company Profiles, Letters &amp; Collateral</h3>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Non-commercial brand dossiers, executive correspondence, and saved print collateral specs for {workspace.name}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter brand documents by type"
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="rounded border border-[#2C2C2C] bg-[#141414] px-2.5 py-1.5 text-xs text-neutral-200"
                >
                  <option value="All">All types</option>
                  {BRAND_DOCUMENT_TYPE_OPTIONS.map(opt => (
                    <option key={opt.type} value={opt.type}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="staff_id_card">Staff ID Card Record</option>
                </select>
                <label className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search brand docs…"
                    className="w-44 rounded border border-[#2C2C2C] bg-[#141414] pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
                  />
                </label>
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="rounded border border-dashed border-[#2C2C2C] p-8 text-center space-y-3">
                <p className="text-sm text-neutral-400">
                  No brand documents created yet. Draft a company profile, official business letter, or generate print business cards and signatures.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubTab('business-cards')}
                    className="rounded border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                  >
                    Design Business Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab('email-signatures')}
                    className="rounded border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                  >
                    Generate Email Signature
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map(item => (
                  <article key={item.id} className="rounded-lg border border-[#252525] bg-[#111] p-4 space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white truncate">{item.title}</h4>
                        <p className="mt-1 text-[11px] font-mono text-neutral-500 tabular-nums">
                          {item.type.replaceAll('_', ' ')} · {item.referenceNo} · {item.date} · {item.status}
                        </p>
                      </div>
                      <select
                        aria-label={`Status for ${item.title}`}
                        value={item.status}
                        onChange={e =>
                          void updateDoc(doc(db, 'workspaces', workspace.id, 'documents', item.id), {
                            status: e.target.value,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="rounded border border-[#2E2E2E] bg-[#141414] px-2 py-1 text-xs text-neutral-300"
                      >
                        {NON_COMMERCIAL_STATUSES.map(st => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="line-clamp-3 whitespace-pre-wrap text-xs text-neutral-300 leading-relaxed">
                      {item.bodyContent}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1D1D1D]">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(item)}
                        className="rounded border border-[#333] px-2.5 py-1 text-xs text-neutral-200 hover:text-white"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setDocForm({
                            type: item.type,
                            title: item.title,
                            referenceNo: item.referenceNo || '',
                            date: item.date || new Date().toISOString().slice(0, 10),
                            recipientName: item.recipientName || '',
                            recipientOrg: item.recipientOrg || '',
                            recipientEmail: item.recipientEmail || '',
                            projectId: item.projectId || '',
                            subject: item.subject || '',
                            bodyContent: item.bodyContent || '',
                            notes: item.notes || '',
                            status:
                              NON_COMMERCIAL_STATUSES.includes(item.status as typeof NON_COMMERCIAL_STATUSES[number])
                                ? (item.status as typeof NON_COMMERCIAL_STATUSES[number])
                                : 'Draft',
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1 text-xs text-white"
                      >
                        <Pencil size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => generateCorporateDocumentPdf(item, workspace)}
                        className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
                      >
                        <ArrowDownToLine size={12} />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadText(
                            `${item.referenceNo || item.title}.txt`,
                            `${workspace.name}\n${item.title}\n${item.referenceNo} · ${item.date}\n\n${item.bodyContent}`,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
                      >
                        <ArrowDownToLine size={12} />
                        <span>TXT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteDoc(item)}
                        className="ml-auto inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-300"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <form onSubmit={handleSaveVaultDoc} className={`${panelClass} h-fit space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">
                {editingId ? 'Edit Brand Document' : 'New Brand Document'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetDocForm}
                  aria-label="Cancel editing"
                  className="text-neutral-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <label className="block">
              <span className={labelClass}>Document Type</span>
              <select
                value={docForm.type}
                onChange={e => setDocForm(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                className={fieldClass}
              >
                {BRAND_DOCUMENT_TYPE_OPTIONS.map(opt => (
                  <option key={opt.type} value={opt.type}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>Title</span>
              <input
                required
                maxLength={160}
                value={docForm.title}
                onChange={e => setDocForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Executive Brand Overview 2026"
                className={fieldClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Reference No</span>
                <input
                  value={docForm.referenceNo}
                  onChange={e => setDocForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                  placeholder="BRD-2026-001"
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Date</span>
                <input
                  type="date"
                  value={docForm.date}
                  onChange={e => setDocForm(prev => ({ ...prev, date: e.target.value }))}
                  className={fieldClass}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Recipient / Partner</span>
              <input
                value={docForm.recipientName}
                onChange={e => setDocForm(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="Recipient name or department"
                className={fieldClass}
              />
            </label>

            {projects.length > 0 && (
              <label className="block">
                <span className={labelClass}>Linked Project</span>
                <select
                  value={docForm.projectId}
                  onChange={e => setDocForm(prev => ({ ...prev, projectId: e.target.value }))}
                  className={fieldClass}
                >
                  <option value="">None</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      {proj.title}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className={labelClass}>Content</span>
              <textarea
                required
                rows={7}
                value={docForm.bodyContent}
                onChange={e => setDocForm(prev => ({ ...prev, bodyContent: e.target.value }))}
                placeholder="Write brand narrative, letter body, meeting agenda, or handover checklist…"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Status</span>
              <select
                value={docForm.status}
                onChange={e =>
                  setDocForm(prev => ({
                    ...prev,
                    status: e.target.value as typeof NON_COMMERCIAL_STATUSES[number],
                  }))
                }
                className={fieldClass}
              >
                {NON_COMMERCIAL_STATUSES.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#FF1E1E] px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              <FilePlus2 size={15} />
              <span>{saving ? 'Saving…' : editingId ? 'Update Document' : 'Save to Brand Vault'}</span>
            </button>
          </form>
        </div>
      )}

      {subTab === 'business-cards' && (
        <BusinessCardDesigner workspace={workspace} onSaveRecord={handleSaveCollateralRecord} />
      )}

      {subTab === 'staff-ids' && (
        <StaffIdCardDesigner workspace={workspace} onSaveRecord={handleSaveCollateralRecord} />
      )}

      {subTab === 'email-signatures' && (
        <EmailSignatureDesigner workspace={workspace} onSaveRecord={handleSaveCollateralRecord} />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#2E2E2E] bg-[#0C0C0C] p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#1E1E1E] pb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  {previewDoc.type.replaceAll('_', ' ')} · {previewDoc.referenceNo}
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">{previewDoc.title}</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  {workspace.name} · {previewDoc.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                aria-label="Close document preview"
                className="rounded border border-[#2E2E2E] p-1.5 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="rounded border border-[#1E1E1E] bg-[#111] p-4 text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {previewDoc.bodyContent}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#1E1E1E]">
              <button
                type="button"
                onClick={() => generateCorporateDocumentPdf(previewDoc, workspace)}
                className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
              >
                <ArrowDownToLine size={13} />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded border border-[#333] bg-[#141414] px-4 py-2 text-xs text-neutral-200 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
