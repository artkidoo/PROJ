/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Admin HQ 8-Section Navigation, Routing & Department Partition Helpers
 */

import {
  normalizeAccountType,
  normalizeWorkspaceType,
  type CanonicalAccountType,
} from './accountNormalization';
import {
  calculateCommercialTotals,
  deriveClientInvoiceStatus,
} from './financeDocuments';
import type {
  ClientProfile,
  ClientProject,
  CommercialCurrency,
  InvoiceRecord,
  ProposalRecord,
  Workspace,
} from '../types';
import type { CreativeProductAudience } from '../types/creativeProduct';

export type AdminHQSection =
  | 'hq-overview'
  | 'artist-department'
  | 'brand-department'
  | 'shared-operations'
  | 'creative-products'
  | 'finance'
  | 'brand-room'
  | 'platform-settings';

export type ArtistDeptTab =
  | 'accounts-workspaces'
  | 'requests-projects'
  | 'releases'
  | 'deliverables-reviews'
  | 'templates-documents';

export type BrandDeptTab =
  | 'accounts-workspaces'
  | 'requests-projects'
  | 'deliverables-reviews'
  | 'templates-collateral';

export type SharedOpsTab =
  | 'requests-enquiries'
  | 'master-studio'
  | 'qa-reviews'
  | 'services-packages';

export type CreativeProductsSegment = 'all' | 'artist' | 'brand' | 'shared';

export type FinanceTab = 'overview' | 'invoices' | 'proposals';

export type PlatformSettingsTab =
  | 'administrators'
  | 'security-access'
  | 'audit-history'
  | 'platform-settings';

export interface AdminHQSectionConfig {
  id: AdminHQSection;
  label: string;
  shortLabel: string;
  subtitle: string;
  defaultSubTab?: string;
  subTabs?: readonly string[];
}

export const ADMIN_HQ_SECTIONS: readonly AdminHQSectionConfig[] = [
  {
    id: 'hq-overview',
    label: 'HQ Overview',
    shortLabel: 'Overview',
    subtitle:
      'Live platform performance indicators across Artist Department, Brand Department, Shared Operations, Finance, and recent audit activity.',
  },
  {
    id: 'artist-department',
    label: 'Artist Department',
    shortLabel: 'Artists',
    subtitle:
      'Artist accounts, artist workspaces, music releases, artist creative requests, artist deliverables, and artist template & document masters.',
    defaultSubTab: 'accounts-workspaces',
    subTabs: [
      'accounts-workspaces',
      'requests-projects',
      'releases',
      'deliverables-reviews',
      'templates-documents',
    ] satisfies ArtistDeptTab[],
  },
  {
    id: 'brand-department',
    label: 'Brand Department',
    shortLabel: 'Brands',
    subtitle:
      'Brand accounts (including normalized Company, Business & Label records), brand workspaces, identity guidelines, brand deliverables, and corporate collateral.',
    defaultSubTab: 'accounts-workspaces',
    subTabs: [
      'accounts-workspaces',
      'requests-projects',
      'deliverables-reviews',
      'templates-collateral',
    ] satisfies BrandDeptTab[],
  },
  {
    id: 'shared-operations',
    label: 'Shared Operations',
    shortLabel: 'Operations',
    subtitle:
      'Cross-department request & public enquiry triage, master studio pipeline & SLA deadlines, shared QA reviews queue, and services & packages catalog.',
    defaultSubTab: 'requests-enquiries',
    subTabs: [
      'requests-enquiries',
      'master-studio',
      'qa-reviews',
      'services-packages',
    ] satisfies SharedOpsTab[],
  },
  {
    id: 'creative-products',
    label: 'Creative Products',
    shortLabel: 'Products',
    subtitle:
      'Unified Creative Hub catalog and Canvas-to-product studio partitioned across Artist Packs, Brand Packs, and Shared Utilities.',
    defaultSubTab: 'all',
    subTabs: ['all', 'artist', 'brand', 'shared'] satisfies CreativeProductsSegment[],
  },
  {
    id: 'finance',
    label: 'Finance',
    shortLabel: 'Finance',
    subtitle:
      'Unified Firestore billing, invoices & payment ledgers, commercial proposals & quotations, and departmental receivables reporting.',
    defaultSubTab: 'overview',
    subTabs: ['overview', 'invoices', 'proposals'] satisfies FinanceTab[],
  },
  {
    id: 'brand-room',
    label: 'KeedoHub Brand Room',
    shortLabel: 'Brand Room',
    subtitle:
      'Strictly private internal marketing studio for KeedoHub itself — isolated from client workspaces and gated by client opt-in showcase consent.',
  },
  {
    id: 'platform-settings',
    label: 'Platform Settings',
    shortLabel: 'Settings',
    subtitle:
      'Administrator role governance, security & access controls, immutable audit history, and platform operational configuration.',
    defaultSubTab: 'administrators',
    subTabs: [
      'administrators',
      'security-access',
      'audit-history',
      'platform-settings',
    ] satisfies PlatformSettingsTab[],
  },
] as const;

export interface ParsedAdminHQRoute {
  section: AdminHQSection;
  subTab?: string;
}

const VALID_SECTIONS = new Set<AdminHQSection>(ADMIN_HQ_SECTIONS.map(s => s.id));

const LEGACY_SECTION_ALIASES: Record<string, ParsedAdminHQRoute> = {
  'clients-accounts': { section: 'artist-department', subTab: 'accounts-workspaces' },
  workspaces: { section: 'brand-department', subTab: 'accounts-workspaces' },
  'services-packages': { section: 'shared-operations', subTab: 'services-packages' },
  'production-studio': { section: 'shared-operations', subTab: 'master-studio' },
  projects: { section: 'shared-operations', subTab: 'master-studio' },
  'deliverables-reviews': { section: 'shared-operations', subTab: 'qa-reviews' },
  'creative-requests': { section: 'shared-operations', subTab: 'requests-enquiries' },
  'design-library': { section: 'artist-department', subTab: 'templates-documents' },
  'invoices-payments': { section: 'finance', subTab: 'invoices' },
  proposals: { section: 'finance', subTab: 'proposals' },
  'business-documents': { section: 'brand-department', subTab: 'templates-collateral' },
  'admin-management': { section: 'platform-settings', subTab: 'administrators' },
  'security-access': { section: 'platform-settings', subTab: 'security-access' },
  'audit-history': { section: 'platform-settings', subTab: 'audit-history' },
  'platform-settings-general': { section: 'platform-settings', subTab: 'platform-settings' },
};

export function getAdminSectionConfig(section: AdminHQSection): AdminHQSectionConfig {
  return ADMIN_HQ_SECTIONS.find(s => s.id === section) || ADMIN_HQ_SECTIONS[0];
}

export function normalizeAdminSubTab(
  section: AdminHQSection,
  rawSubTab?: string | null,
): string | undefined {
  const cfg = getAdminSectionConfig(section);
  if (!cfg.subTabs || cfg.subTabs.length === 0) return undefined;
  if (rawSubTab && cfg.subTabs.includes(rawSubTab)) {
    return rawSubTab;
  }
  return cfg.defaultSubTab;
}

/**
 * Parses URL hash into an Admin HQ route.
 * Accepts `#/admin/<section>`, `#/admin/<section>/<subTab>`, `#admin/<section>`, and legacy aliases.
 */
export function parseAdminHQHash(rawHash?: string | null): ParsedAdminHQRoute {
  if (!rawHash) return { section: 'hq-overview' };
  const cleaned = rawHash.trim().replace(/^#\/?/, '').replace(/\/+$/, '');
  if (!cleaned) return { section: 'hq-overview' };

  const parts = cleaned.split('/').filter(Boolean);
  // Ignore non-admin public/client hashes
  if (parts[0] !== 'admin') {
    return { section: 'hq-overview' };
  }

  const rawSection = (parts[1] || 'hq-overview').toLowerCase();
  const rawSubTab = parts[2]?.toLowerCase();

  if (VALID_SECTIONS.has(rawSection as AdminHQSection)) {
    const section = rawSection as AdminHQSection;
    const subTab = normalizeAdminSubTab(section, rawSubTab);
    return subTab ? { section, subTab } : { section };
  }

  const alias = LEGACY_SECTION_ALIASES[rawSection];
  if (alias) {
    return alias;
  }

  return { section: 'hq-overview' };
}

export function formatAdminHQHash(section: AdminHQSection, subTab?: string): string {
  const normalizedSub = normalizeAdminSubTab(section, subTab);
  if (normalizedSub) {
    return `#/admin/${section}/${normalizedSub}`;
  }
  return `#/admin/${section}`;
}

export function resolveClientDepartment(
  profile?: Pick<ClientProfile, 'accountType' | 'rawLegacyAccountType'> | null,
): CanonicalAccountType {
  return normalizeAccountType(profile?.accountType || profile?.rawLegacyAccountType);
}

export function resolveWorkspaceDepartment(
  workspace?: Pick<Workspace, 'type' | 'clientCategory'> | null,
): CanonicalAccountType {
  return normalizeWorkspaceType(workspace?.clientCategory || workspace?.type);
}

const ARTIST_CATEGORY_KEYWORDS = [
  'music',
  'release',
  'single',
  'ep',
  'album',
  'cover art',
  'cover artwork',
  'spotify',
  'apple music',
  'lyric',
  'visualizer',
  'epk',
  'tour',
  'artist',
];

const BRAND_CATEGORY_KEYWORDS = [
  'brand identity',
  'brand guidelines',
  'corporate',
  'stationery',
  'business card',
  'company profile',
  'pitch deck',
  'brochure',
  'packaging',
  'merch',
  'staff id',
  'email signature',
  'website & press',
];

export function inferDepartmentFromCategory(category?: string | null): CanonicalAccountType | null {
  if (!category || typeof category !== 'string') return null;
  const lower = category.trim().toLowerCase();
  if (!lower) return null;
  if (ARTIST_CATEGORY_KEYWORDS.some(k => lower.includes(k))) return 'Artist';
  if (BRAND_CATEGORY_KEYWORDS.some(k => lower.includes(k))) return 'Brand';
  return null;
}

export function resolveProjectDepartment(
  project: Pick<ClientProject, 'id' | 'clientUid' | 'workspaceId' | 'category' | 'department'>,
  clientsByUid: ReadonlyMap<string, Pick<ClientProfile, 'accountType' | 'rawLegacyAccountType'>>,
  workspacesById: ReadonlyMap<string, Pick<Workspace, 'type' | 'clientCategory'>>,
  projectAdminDetailsMap?: Record<string, { clientCategory?: string }>,
): CanonicalAccountType | 'Unassigned' {
  if (project.department === 'Artist' || project.department === 'Brand') {
    return project.department;
  }

  const ws = project.workspaceId ? workspacesById.get(project.workspaceId) : undefined;
  if (ws && (ws.clientCategory || ws.type)) {
    return resolveWorkspaceDepartment(ws);
  }

  const adminCat = projectAdminDetailsMap?.[project.id]?.clientCategory;
  if (adminCat) {
    return normalizeAccountType(adminCat);
  }

  const client = project.clientUid ? clientsByUid.get(project.clientUid) : undefined;
  if (client && (client.accountType || client.rawLegacyAccountType)) {
    return resolveClientDepartment(client);
  }

  const inferred = inferDepartmentFromCategory(project.category);
  if (inferred) return inferred;

  return 'Unassigned';
}

export function classifyCreativeProductSegment(
  audience?: CreativeProductAudience | string | null,
): Exclude<CreativeProductsSegment, 'all'> {
  if (audience === 'Artist') return 'artist';
  if (audience === 'Shared') return 'shared';
  return 'brand';
}

export function isTemplateRelevantToDepartment(
  category: string,
  department: CanonicalAccountType,
  title?: string,
): boolean {
  const hay = `${category} ${title || ''}`.toLowerCase();
  const isArtist =
    hay.includes('artist') ||
    hay.includes('release') ||
    hay.includes('music') ||
    hay.includes('spotify') ||
    hay.includes('cover') ||
    hay.includes('tour') ||
    hay.includes('epk') ||
    hay.includes('single') ||
    hay.includes('album') ||
    hay.includes('tracklist');
  const isBrand =
    hay.includes('brand') ||
    hay.includes('business') ||
    hay.includes('corporate') ||
    hay.includes('company') ||
    hay.includes('product') ||
    hay.includes('editorial') ||
    hay.includes('promotional') ||
    hay.includes('launch') ||
    hay.includes('announcement') ||
    hay.includes('poster');

  if (department === 'Artist') {
    return isArtist || !isBrand;
  }
  return isBrand || !isArtist;
}

export function isTemplateFamilyRelevantToDepartment(
  familyName: string,
  templateFamilyTag?: string,
  department: CanonicalAccountType = 'Brand',
): boolean {
  const hay = `${familyName} ${templateFamilyTag || ''}`.toLowerCase();
  const artistHit =
    hay.includes('artist') ||
    hay.includes('release') ||
    hay.includes('streaming') ||
    hay.includes('music') ||
    hay.includes('tour');
  if (department === 'Artist') {
    return artistHit;
  }
  return !artistHit || hay.includes('commercial') || hay.includes('brand') || hay.includes('corporate');
}

/**
 * Brand Room privacy guard:
 * Client production projects NEVER appear as Brand Room portfolio showcase sources
 * unless explicit opt-in showcase consent is recorded AND the project is completed/delivered.
 */
export function isProjectShowcaseEligible(
  project: Pick<ClientProject, 'id' | 'status' | 'stage' | 'progress' | 'allowPublicShowcase'>,
  optedInProjectIds?: ReadonlySet<string>,
): boolean {
  const hasExplicitConsent =
    project.allowPublicShowcase === true || Boolean(optedInProjectIds?.has(project.id));
  if (!hasExplicitConsent) return false;
  return project.status === 'Completed' || project.stage === 'Delivered' || project.progress >= 80;
}

export interface CurrencyDepartmentTotals {
  currency: CommercialCurrency;
  invoiced: number;
  collected: number;
  outstanding: number;
  artistInvoiced: number;
  artistOutstanding: number;
  brandInvoiced: number;
  brandOutstanding: number;
  quotedPipeline: number;
}

export interface FinanceDepartmentSummary {
  totalInvoices: number;
  activeInvoicesCount: number;
  overdueInvoicesCount: number;
  paidInvoicesCount: number;
  artistInvoicesCount: number;
  brandInvoicesCount: number;
  totalProposals: number;
  approvedProposalsCount: number;
  awaitingProposalsCount: number;
  artistProposalsCount: number;
  brandProposalsCount: number;
  byCurrency: CurrencyDepartmentTotals[];
}

export function computeDepartmentFinanceSummary(
  invoices: InvoiceRecord[],
  proposals: ProposalRecord[],
  workspacesById: ReadonlyMap<string, Pick<Workspace, 'type' | 'clientCategory'>>,
  clientsByUid: ReadonlyMap<string, Pick<ClientProfile, 'accountType' | 'rawLegacyAccountType'>>,
  nowIso: string = new Date().toISOString().slice(0, 10),
): FinanceDepartmentSummary {
  const currencyMap = new Map<CommercialCurrency, CurrencyDepartmentTotals>();

  const ensureCurrency = (cur: CommercialCurrency): CurrencyDepartmentTotals => {
    const existing = currencyMap.get(cur);
    if (existing) return existing;
    const created: CurrencyDepartmentTotals = {
      currency: cur,
      invoiced: 0,
      collected: 0,
      outstanding: 0,
      artistInvoiced: 0,
      artistOutstanding: 0,
      brandInvoiced: 0,
      brandOutstanding: 0,
      quotedPipeline: 0,
    };
    currencyMap.set(cur, created);
    return created;
  };

  const resolveRecordDept = (workspaceId?: string, clientUid?: string): CanonicalAccountType => {
    const ws = workspaceId ? workspacesById.get(workspaceId) : undefined;
    if (ws) return resolveWorkspaceDepartment(ws);
    const client = clientUid ? clientsByUid.get(clientUid) : undefined;
    if (client) return resolveClientDepartment(client);
    return 'Brand';
  };

  let activeInvoicesCount = 0;
  let overdueInvoicesCount = 0;
  let paidInvoicesCount = 0;
  let artistInvoicesCount = 0;
  let brandInvoicesCount = 0;

  for (const inv of invoices) {
    const status = deriveClientInvoiceStatus(inv, nowIso);
    if (status === 'Void') continue;
    activeInvoicesCount += 1;
    if (status === 'Overdue') overdueInvoicesCount += 1;
    if (status === 'Paid') paidInvoicesCount += 1;

    const dept = resolveRecordDept(inv.workspaceId, inv.clientUid);
    if (dept === 'Artist') artistInvoicesCount += 1;
    else brandInvoicesCount += 1;

    const computed = calculateCommercialTotals({
      items: inv.items || [],
      taxRate: inv.taxRate || 0,
      discountAmount: inv.discountAmount || 0,
    });
    const summedPayments = (inv.payments || []).reduce(
      (sum, p) => sum + (Number.isFinite(Number(p.amount)) ? Number(p.amount) : 0),
      0,
    );

    const cur = (inv.currency || 'USD') as CommercialCurrency;
    const bucket = ensureCurrency(cur);
    const totalAmt = Number.isFinite(inv.totalAmount) ? inv.totalAmount : computed.totalAmount;
    const paidAmt = Number.isFinite(inv.totalPaid) ? inv.totalPaid : summedPayments;
    const dueAmt = Number.isFinite(inv.balanceDue)
      ? inv.balanceDue
      : Math.max(0, totalAmt - paidAmt);

    bucket.invoiced += totalAmt;
    bucket.collected += paidAmt;
    bucket.outstanding += dueAmt;
    if (dept === 'Artist') {
      bucket.artistInvoiced += totalAmt;
      bucket.artistOutstanding += dueAmt;
    } else {
      bucket.brandInvoiced += totalAmt;
      bucket.brandOutstanding += dueAmt;
    }
  }

  let approvedProposalsCount = 0;
  let awaitingProposalsCount = 0;
  let artistProposalsCount = 0;
  let brandProposalsCount = 0;

  for (const prop of proposals) {
    const dept = resolveRecordDept(prop.workspaceId, prop.clientUid);
    if (dept === 'Artist') artistProposalsCount += 1;
    else brandProposalsCount += 1;

    if (prop.status === 'Approved') approvedProposalsCount += 1;
    if (['Issued', 'Sent', 'Under Review', 'Revision Requested'].includes(prop.status)) {
      awaitingProposalsCount += 1;
    }
    if (prop.status !== 'Declined' && prop.status !== 'Expired') {
      const cur = (prop.currency || 'USD') as CommercialCurrency;
      const bucket = ensureCurrency(cur);
      bucket.quotedPipeline += Number(prop.totalAmount || 0);
    }
  }

  return {
    totalInvoices: invoices.length,
    activeInvoicesCount,
    overdueInvoicesCount,
    paidInvoicesCount,
    artistInvoicesCount,
    brandInvoicesCount,
    totalProposals: proposals.length,
    approvedProposalsCount,
    awaitingProposalsCount,
    artistProposalsCount,
    brandProposalsCount,
    byCurrency: Array.from(currencyMap.values()),
  };
}
