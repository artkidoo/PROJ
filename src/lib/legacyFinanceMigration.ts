import type { CorporateDocument, Workspace } from '../types';
import { calculateCommercialTotals, isCommercialDocumentType } from './financeDocuments';

export const LEGACY_FINANCE_STORAGE_PREFIX = 'lyrical_ent_studio_state_v1';

export type LegacyRecordTarget = 'invoice' | 'proposal' | 'workspace_document';

export interface LegacyLocalDocumentInspection {
  id: string;
  targetCollection: LegacyRecordTarget;
  isInitialSeedDefault: boolean;
  sourceWorkspaceId: string;
  sourceWorkspaceName: string;
  suggestedFirestoreWorkspaceId: string;
  document: CorporateDocument;
  computedTotal: number;
}

const INITIAL_SEED_DOCUMENT_IDS = new Set([
  'doc-01',
  'doc-02',
  'doc-03',
  'doc-04',
  'doc-05',
  'doc-06',
  'doc-07',
  'doc-08',
  'doc-09',
  'doc-apex-01',
  'doc-apex-02',
  'doc-apex-03',
  'doc-nexus-01',
  'doc-nexus-02',
]);

const LEGACY_WORKSPACE_NAME_BY_ID: Record<string, string> = {
  'ws-lyrical-ent': 'LYRICAL ENT LLC',
  'ws-sariyah-artist': 'Sariyah Cole',
  'ws-apex-brand': 'Apex Dynamics',
  'ws-nexus-enterprise': 'Nexus Capital & Strategy',
};

export function classifyLegacyDocumentTarget(docType: unknown): LegacyRecordTarget {
  const normalized = typeof docType === 'string' ? docType.trim().toLowerCase() : '';
  if (normalized === 'invoice' || normalized === 'receipt') {
    return 'invoice';
  }
  if (
    normalized === 'quotation' ||
    normalized === 'partnership_proposal' ||
    normalized === 'sponsorship_proposal' ||
    normalized === 'proposal'
  ) {
    return 'proposal';
  }
  return 'workspace_document';
}

export function readLegacyLocalStorageFinanceRecords(
  liveWorkspaces: Workspace[],
  storage?: Pick<Storage, 'getItem'> | null,
): LegacyLocalDocumentInspection[] {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return [];

  let parsedDocs: CorporateDocument[] = [];
  let parsedLegacyWorkspaces: Array<{ id?: string; name?: string }> = [];

  try {
    const rawDocs = store.getItem(`${LEGACY_FINANCE_STORAGE_PREFIX}_documents`);
    if (rawDocs) {
      const candidate = JSON.parse(rawDocs);
      if (Array.isArray(candidate)) {
        parsedDocs = candidate.filter(item => item && typeof item === 'object' && typeof item.id === 'string');
      }
    }
  } catch {
    return [];
  }

  try {
    const rawWs = store.getItem(`${LEGACY_FINANCE_STORAGE_PREFIX}_workspaces`);
    if (rawWs) {
      const candidate = JSON.parse(rawWs);
      if (Array.isArray(candidate)) {
        parsedLegacyWorkspaces = candidate;
      }
    }
  } catch {
    parsedLegacyWorkspaces = [];
  }

  const legacyWsNameMap = new Map<string, string>(Object.entries(LEGACY_WORKSPACE_NAME_BY_ID));
  for (const ws of parsedLegacyWorkspaces) {
    if (ws?.id && ws?.name) legacyWsNameMap.set(ws.id, ws.name);
  }

  return parsedDocs.map(doc => {
    const sourceWorkspaceId = doc.workspaceId || '';
    const sourceWorkspaceName =
      legacyWsNameMap.get(sourceWorkspaceId) ||
      liveWorkspaces.find(w => w.id === sourceWorkspaceId)?.name ||
      sourceWorkspaceId ||
      'Unassigned Legacy Workspace';

    const directMatch = liveWorkspaces.find(w => w.id === sourceWorkspaceId);
    const nameMatch = !directMatch
      ? liveWorkspaces.find(
          w =>
            w.name.trim().toLowerCase() === sourceWorkspaceName.trim().toLowerCase() ||
            (doc.recipientOrg && w.name.trim().toLowerCase() === doc.recipientOrg.trim().toLowerCase()),
        )
      : undefined;

    const totals = calculateCommercialTotals({
      items: doc.items || [],
      taxRate: doc.taxRate,
      discountAmount: doc.discountAmount,
    });

    const computedTotal =
      totals.totalAmount > 0
        ? totals.totalAmount
        : Number.isFinite(Number(doc.totalAmount))
          ? Number(doc.totalAmount)
          : 0;

    return {
      id: doc.id,
      targetCollection: classifyLegacyDocumentTarget(doc.type),
      isInitialSeedDefault: INITIAL_SEED_DOCUMENT_IDS.has(doc.id),
      sourceWorkspaceId,
      sourceWorkspaceName,
      suggestedFirestoreWorkspaceId: (directMatch || nameMatch)?.id || '',
      document: doc,
      computedTotal,
    };
  });
}

export function buildInvoiceCallablePayloadFromLegacy(
  record: LegacyLocalDocumentInspection,
  targetWorkspaceId: string,
) {
  const { document } = record;
  const fallbackItems =
    document.items && document.items.length > 0
      ? document.items
      : [
          {
            description: document.subject || document.title || 'Legacy Invoice Service',
            quantity: 1,
            unitPrice: Math.max(0, record.computedTotal),
            total: Math.max(0, record.computedTotal),
          },
        ];

  const mappedStatus =
    document.status === 'Paid' ||
    document.status === 'Partially Paid' ||
    document.status === 'Overdue' ||
    document.status === 'Draft' ||
    document.status === 'Issued' ||
    document.status === 'Void'
      ? document.status
      : document.status === 'Cancelled'
        ? 'Void'
        : 'Issued';

  return {
    id: `legacy_${document.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    workspaceId: targetWorkspaceId,
    projectId: document.projectId || '',
    referenceNo: document.referenceNo || `INV-${document.id.slice(-5).toUpperCase()}`,
    title: document.title || 'Migrated Commercial Invoice',
    currency: document.currency || 'USD',
    issueDate: /^\d{4}-\d{2}-\d{2}$/.test(document.date || '') ? document.date : new Date().toISOString().slice(0, 10),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(document.validityDate || '') ? document.validityDate : '',
    recipientName: document.recipientName || 'Client',
    recipientOrg: document.recipientOrg || '',
    recipientEmail: document.recipientEmail || '',
    recipientAddress: document.recipientAddress || '',
    subject: document.subject || '',
    bodyContent: document.bodyContent || '',
    items: fallbackItems,
    taxRate: document.taxRate || 0,
    discountAmount: document.discountAmount || 0,
    paymentTerms: document.paymentTerms || 'Net 30',
    notes: [document.notes, 'Imported from legacy localStorage record'].filter(Boolean).join(' · '),
    status: mappedStatus,
  };
}

export function buildProposalCallablePayloadFromLegacy(
  record: LegacyLocalDocumentInspection,
  targetWorkspaceId: string,
) {
  const { document } = record;
  const proposalType =
    document.type === 'quotation' ||
    document.type === 'partnership_proposal' ||
    document.type === 'sponsorship_proposal'
      ? document.type
      : 'proposal';

  const mappedStatus =
    document.status === 'Approved' || document.clientAction === 'Accepted'
      ? 'Approved'
      : document.status === 'Declined' || document.clientAction === 'Declined'
        ? 'Declined'
        : document.status === 'Revision Requested'
          ? 'Revision Requested'
          : document.status === 'Under Review'
            ? 'Under Review'
            : document.status === 'Draft'
              ? 'Draft'
              : 'Issued';

  const fallbackItems =
    document.items && document.items.length > 0
      ? document.items
      : record.computedTotal > 0
        ? [
            {
              description: document.subject || document.title || 'Proposed Creative Scope',
              quantity: 1,
              unitPrice: record.computedTotal,
              total: record.computedTotal,
            },
          ]
        : [];

  return {
    id: `legacy_${document.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    workspaceId: targetWorkspaceId,
    projectId: document.projectId || '',
    type: proposalType,
    referenceNo: document.referenceNo || `PROP-${document.id.slice(-5).toUpperCase()}`,
    title: document.title || 'Migrated Proposal',
    currency: document.currency || 'USD',
    issueDate: /^\d{4}-\d{2}-\d{2}$/.test(document.date || '') ? document.date : new Date().toISOString().slice(0, 10),
    validUntil: /^\d{4}-\d{2}-\d{2}$/.test(document.validityDate || '') ? document.validityDate : '',
    recipientName: document.recipientName || 'Client',
    recipientOrg: document.recipientOrg || '',
    recipientEmail: document.recipientEmail || '',
    recipientAddress: document.recipientAddress || '',
    subject: document.subject || '',
    bodyContent: document.bodyContent || '',
    items: fallbackItems,
    taxRate: document.taxRate || 0,
    discountAmount: document.discountAmount || 0,
    paymentTerms: document.paymentTerms || '',
    notes: [document.notes, 'Imported from legacy localStorage record'].filter(Boolean).join(' · '),
    status: mappedStatus,
  };
}

export function buildNonCommercialWorkspaceDocPayloadFromLegacy(
  record: LegacyLocalDocumentInspection,
  targetWorkspaceId: string,
) {
  const { document } = record;
  const safeType = isCommercialDocumentType(document.type) ? 'official_letter' : document.type;
  return {
    id: `legacy_${document.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    workspaceId: targetWorkspaceId,
    type: safeType,
    title: document.title || 'Migrated Document',
    referenceNo: document.referenceNo || `DOC-${document.id.slice(-5).toUpperCase()}`,
    date: document.date || new Date().toISOString().slice(0, 10),
    recipientName: document.recipientName || '',
    recipientOrg: document.recipientOrg || '',
    recipientAddress: document.recipientAddress || '',
    recipientEmail: document.recipientEmail || '',
    authorName: document.authorName || 'KeedoHub Admin',
    authorRole: document.authorRole || 'Platform Admin',
    status: document.status === 'Approved' ? 'Approved' : document.status === 'Issued' ? 'Issued' : 'Draft',
    subject: document.subject || '',
    bodyContent: document.bodyContent || '',
    notes: [document.notes, 'Imported non-destructively from legacy localStorage'].filter(Boolean).join(' · '),
    createdAt: document.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
