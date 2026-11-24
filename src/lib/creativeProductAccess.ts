import type {
  CreativeProduct,
  CreativeProductAudience,
  CreativeProductDeliverableFile,
  CreativeProductFileFormat,
} from '../types/creativeProduct';
import type { ClientProfile, Workspace } from '../types';
import { inspectAccountType } from './accountNormalization';

export interface ProductFamilyDefinition {
  id: string;
  label: string;
  category: string;
  description: string;
}

export const ARTIST_PRODUCT_FAMILIES: ProductFamilyDefinition[] = [
  {
    id: 'Streaming & Music Platform Assets',
    label: 'Streaming & Music Platform Assets',
    category: 'Streaming Platform Packs',
    description: 'Spotify, Apple Music, Audiomack, Boomplay, YouTube Music, streaming milestones, artist profile headers & pre-save packs.',
  },
  {
    id: 'Music Release Packs',
    label: 'Music Release Packs',
    category: 'Music Release Promo Packs',
    description: 'Single, EP & Album launch kits, Coming Soon teasers, Out Now visuals, tracklists, countdowns, video promo & listening party packs.',
  },
  {
    id: 'Artist Branding & Press',
    label: 'Artist Branding & Press',
    category: 'Artist Branding & Press',
    description: 'Electronic Press Kits (EPKs), artist media kits, biography & press release layouts, artist identity packs, posters, event & tour graphics.',
  },
  {
    id: 'Social Content',
    label: 'Social Content',
    category: 'Social Media & Content Packs',
    description: 'Instagram content packs, TikTok promos, story sequences, lyric cards, quote graphics, teaser visuals & YouTube thumbnails.',
  },
];

export const BRAND_BUSINESS_PRODUCT_FAMILIES: ProductFamilyDefinition[] = [
  {
    id: 'Brand Identity',
    label: 'Brand Identity',
    category: 'Brand Identity',
    description: 'Logo systems, brand guidelines manuals, executive stationery, business cards, letterheads, email signatures & brand presentations.',
  },
  {
    id: 'Social Content',
    label: 'Social Content',
    category: 'Social Media & Content',
    description: 'Instagram brand packs, promotional posts, story sequences, product announcements, client testimonials & sale/offer graphics.',
  },
  {
    id: 'Business Documents',
    label: 'Business Documents',
    category: 'Business Documents',
    description: 'Company profiles, commercial proposals, quotations, invoices, receipts, pitch decks, presentations, brochures, business reports & client onboarding docs.',
  },
  {
    id: 'Marketing Materials',
    label: 'Marketing Materials',
    category: 'Marketing & Promotional',
    description: 'Print flyers, launch posters, web & outdoor banners, product catalogues, promotional graphics & digital ad suites.',
  },
];

export const ALL_PRODUCT_FAMILIES = Array.from(
  new Set([
    ...ARTIST_PRODUCT_FAMILIES.map(f => f.label),
    ...BRAND_BUSINESS_PRODUCT_FAMILIES.map(f => f.label),
  ]),
);

export const ARTIST_PRODUCT_CATEGORIES = [
  'Streaming Platform Packs',
  'Music Release Promo Packs',
  'Artist Branding & Press',
  'Social Media & Content Packs',
] as const;

export const BRAND_BUSINESS_PRODUCT_CATEGORIES = [
  'Brand Identity',
  'Social Media & Content',
  'Business Documents',
  'Marketing & Promotional',
] as const;

export const ALL_PRODUCT_CATEGORIES = [
  ...ARTIST_PRODUCT_CATEGORIES,
  ...BRAND_BUSINESS_PRODUCT_CATEGORIES,
] as const;

export const STREAMING_PLATFORM_DIMENSIONS = [
  { platform: 'Spotify Canvas', dimensions: '1080 × 1920 px', aspectRatio: '9:16 Vertical', notes: '3–8 sec visual / Safe center zone' },
  { platform: 'Spotify Release Cover & Header', dimensions: '3000 × 3000 px / 2660 × 1140 px', aspectRatio: '1:1 & Wide Header', notes: '300 DPI sRGB Master + Banner' },
  { platform: 'Apple Music Motion & Cover', dimensions: '3000 × 3000 px / 3840 × 2160 px', aspectRatio: '1:1 & 16:9 / 3:4', notes: 'Clean key art without badges' },
  { platform: 'YouTube Music Thumbnail & Banner', dimensions: '1280 × 720 px / 2560 × 1440 px', aspectRatio: '16:9 Landscape', notes: 'Safe title area 1546 × 423 px' },
  { platform: 'Audiomack Artwork & Spotlight', dimensions: '3000 × 3000 px / 1500 × 500 px', aspectRatio: '1:1 & 3:1 Header', notes: 'High contrast track badges' },
  { platform: 'Boomplay Release Pack', dimensions: '3000 × 3000 px / 1080 × 1080 px', aspectRatio: '1:1 Square', notes: 'Release announcement & milestone kit' },
] as const;

export function resolveProductFamily(
  product: Pick<CreativeProduct, 'productFamily' | 'audience' | 'category'>,
): string {
  if (product.productFamily && product.productFamily.trim()) {
    return product.productFamily.trim();
  }
  const cat = (product.category || '').trim();
  const isArtist = product.audience === 'Artist';
  const list = isArtist ? ARTIST_PRODUCT_FAMILIES : BRAND_BUSINESS_PRODUCT_FAMILIES;
  const match = list.find(f => f.category === cat || f.label.toLowerCase() === cat.toLowerCase());
  if (match) return match.label;
  const fallbackMatch = [...ARTIST_PRODUCT_FAMILIES, ...BRAND_BUSINESS_PRODUCT_FAMILIES].find(
    f => f.category === cat,
  );
  return fallbackMatch?.label || cat || 'Studio Resources';
}

export function inferCreativeFileFormat(fileName: string, mimeType = ''): CreativeProductFileFormat {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const mime = mimeType.toLowerCase();
  if (ext === 'psd' || mime.includes('photoshop')) return 'PSD';
  if (ext === 'pdf' || mime === 'application/pdf') return 'PDF';
  if (ext === 'svg' || mime.includes('svg')) return 'SVG';
  if (ext === 'png' || mime === 'image/png') return 'PNG';
  if (ext === 'jpg' || ext === 'jpeg' || mime === 'image/jpeg') return 'JPG';
  if (ext === 'webp' || mime === 'image/webp') return 'WEBP';
  if (ext === 'zip' || mime.includes('zip')) return 'ZIP';
  if (ext === 'mp4' || mime === 'video/mp4') return 'MP4';
  return 'OTHER';
}

export function formatBytesCompact(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function resolveClientAudienceBucket(
  accountType?: ClientProfile['accountType'] | string | null,
  workspaceType?: Workspace['type'] | string | null,
): 'Artist' | 'Brand' {
  return inspectAccountType(accountType, workspaceType).canonicalType;
}

export function matchesProductAudience(
  productAudience: CreativeProductAudience,
  clientBucket: 'Artist' | 'Brand' | 'Business',
): boolean {
  if (productAudience === 'Shared') return true;
  if (clientBucket === 'Artist') return productAudience === 'Artist';
  return productAudience === 'Brand' || productAudience === 'Business' || productAudience === 'Brand & Business';
}

export interface WorkspacePackageEntitlementInput {
  packageId: string;
  status?: 'Active' | 'Inactive' | 'Paused' | 'Expired' | 'Revoked' | string;
  expiresAt?: string;
}

export interface ClientProductEligibilityParams {
  product: Pick<
    CreativeProduct,
    'status' | 'audience' | 'accessType' | 'assignedWorkspaceIds' | 'includedPackageIds'
  >;
  clientBucket: 'Artist' | 'Brand' | 'Business';
  workspaceId: string;
  workspaceStatus?: Workspace['status'] | string;
  contractedPackageIds?: unknown;
  activeServicePackageIds?: readonly string[] | ReadonlySet<string>;
  packageEntitlements?: readonly WorkspacePackageEntitlementInput[];
  nowIso?: string;
}

const VALID_PACKAGE_OR_WORKSPACE_ID = /^[a-zA-Z0-9_-]+$/;

export function sanitizeIdList(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const clean: string[] = [];
  for (const item of ids) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.length > 0 && trimmed.length <= 128 && VALID_PACKAGE_OR_WORKSPACE_ID.test(trimmed)) {
        if (!clean.includes(trimmed)) clean.push(trimmed);
      }
    }
  }
  return clean;
}

export function isWorkspaceStatusEligible(status?: string): boolean {
  if (!status) return true;
  return status === 'Active' || status === 'Onboarding';
}

export function resolveActiveWorkspacePackageIds(params: {
  workspaceId: string;
  workspaceStatus?: Workspace['status'] | string;
  contractedPackageIds?: unknown;
  activeServicePackageIds?: readonly string[] | ReadonlySet<string>;
  packageEntitlements?: readonly WorkspacePackageEntitlementInput[];
  nowIso?: string;
}): string[] {
  const {
    workspaceId,
    workspaceStatus,
    contractedPackageIds,
    activeServicePackageIds,
    packageEntitlements,
    nowIso,
  } = params;

  if (!workspaceId || !workspaceId.trim() || !isWorkspaceStatusEligible(workspaceStatus)) {
    return [];
  }

  const contracted = sanitizeIdList(contractedPackageIds);
  if (contracted.length === 0) return [];

  const activeCatalogSet =
    activeServicePackageIds === undefined
      ? null
      : activeServicePackageIds instanceof Set
        ? activeServicePackageIds
        : new Set(sanitizeIdList(Array.from(activeServicePackageIds)));

  const entitlementMap = new Map<string, WorkspacePackageEntitlementInput>();
  if (Array.isArray(packageEntitlements)) {
    for (const entry of packageEntitlements) {
      if (entry && typeof entry.packageId === 'string') {
        const key = entry.packageId.trim();
        if (key) entitlementMap.set(key, entry);
      }
    }
  }

  const nowMs = nowIso ? Date.parse(nowIso) : Date.now();

  return contracted.filter(pkgId => {
    if (activeCatalogSet !== null && !activeCatalogSet.has(pkgId)) {
      return false;
    }
    const entitlement = entitlementMap.get(pkgId);
    if (entitlement) {
      if (entitlement.status && entitlement.status !== 'Active') {
        return false;
      }
      if (entitlement.expiresAt !== undefined && entitlement.expiresAt !== '') {
        const expMs = Date.parse(entitlement.expiresAt);
        if (Number.isNaN(expMs) || expMs <= nowMs) {
          return false;
        }
      }
    }
    return true;
  });
}

export function hasExplicitWorkspaceAssignment(params: {
  product: Pick<CreativeProduct, 'assignedWorkspaceIds'>;
  workspaceId: string;
  workspaceStatus?: Workspace['status'] | string;
}): boolean {
  const { product, workspaceId, workspaceStatus } = params;
  if (!workspaceId || !workspaceId.trim() || !isWorkspaceStatusEligible(workspaceStatus)) {
    return false;
  }
  const assignedIds = sanitizeIdList(product.assignedWorkspaceIds);
  return assignedIds.includes(workspaceId.trim());
}

export function hasMatchingPackageEntitlement(params: ClientProductEligibilityParams): boolean {
  const productPkgIds = sanitizeIdList(params.product.includedPackageIds);
  if (productPkgIds.length === 0) {
    return false;
  }
  const activeWorkspacePkgs = resolveActiveWorkspacePackageIds(params);
  if (activeWorkspacePkgs.length === 0) {
    return false;
  }
  return productPkgIds.some(pkgId => activeWorkspacePkgs.includes(pkgId));
}

export function isClientEligibleForProductView(params: ClientProductEligibilityParams): boolean {
  const { product, clientBucket, workspaceStatus } = params;
  if (product.status !== 'Published') return false;
  if (!isWorkspaceStatusEligible(workspaceStatus)) return false;
  if (!matchesProductAudience(product.audience, clientBucket)) return false;

  if (product.accessType === 'AdminAssigned') {
    return hasExplicitWorkspaceAssignment(params);
  }

  if (product.accessType === 'IncludedInPackage') {
    return hasExplicitWorkspaceAssignment(params) || hasMatchingPackageEntitlement(params);
  }

  if (product.accessType === 'Free' || product.accessType === 'RequestRequired') {
    return true;
  }

  return false;
}

export function isClientEligibleForProductDownload(params: ClientProductEligibilityParams): boolean {
  if (!isClientEligibleForProductView(params)) {
    return false;
  }
  const { product } = params;
  if (product.accessType === 'Free') {
    return true;
  }
  if (product.accessType === 'AdminAssigned') {
    return hasExplicitWorkspaceAssignment(params);
  }
  if (product.accessType === 'IncludedInPackage') {
    return hasExplicitWorkspaceAssignment(params) || hasMatchingPackageEntitlement(params);
  }
  if (product.accessType === 'RequestRequired') {
    return hasExplicitWorkspaceAssignment(params);
  }
  return false;
}

export function getApprovedDownloadableFiles(
  files: CreativeProductDeliverableFile[] = [],
): CreativeProductDeliverableFile[] {
  if (!Array.isArray(files)) return [];
  return files.filter(
    file =>
      file &&
      file.isApprovedForClient === true &&
      typeof file.storagePath === 'string' &&
      file.storagePath.startsWith('products/') &&
      file.storagePath.includes('/deliverables/') &&
      !file.storagePath.includes('/internal/') &&
      !file.storagePath.includes('..') &&
      !file.storagePath.includes('\\'),
  );
}

export interface ProductAccessSummary {
  state:
    | 'download-ready'
    | 'free-catalog'
    | 'included-in-package'
    | 'workspace-assigned'
    | 'request-required'
    | 'access-restricted';
  badgeLabel: string;
  explanation: string;
  canDownload: boolean;
  approvedFilesCount: number;
  isAssignedToWorkspace: boolean;
}

export function getProductDownloadStatusSummary(
  params: Omit<ClientProductEligibilityParams, 'product'> & { product: CreativeProduct },
): ProductAccessSummary {
  const { product } = params;
  const canView = isClientEligibleForProductView(params);
  const canDownload = canView && isClientEligibleForProductDownload(params);
  const isAssignedToWorkspace = canView && hasExplicitWorkspaceAssignment(params);
  const hasPackageAccess =
    canView && product.accessType === 'IncludedInPackage' && hasMatchingPackageEntitlement(params);

  if (!canView) {
    return {
      state: 'access-restricted',
      badgeLabel:
        product.accessType === 'IncludedInPackage' ? 'Package Entitlement Required' : 'Access Restricted',
      explanation:
        product.accessType === 'IncludedInPackage'
          ? 'This product requires an active contracted studio package linked to your workspace or explicit Admin HQ assignment.'
          : 'This product is not unlocked for your workspace.',
      canDownload: false,
      approvedFilesCount: 0,
      isAssignedToWorkspace: false,
    };
  }

  const approvedFiles = canDownload ? getApprovedDownloadableFiles(product.files) : [];

  if (canDownload && approvedFiles.length > 0) {
    return {
      state: 'download-ready',
      badgeLabel: isAssignedToWorkspace
        ? `Assigned · Download Ready (${approvedFiles.length})`
        : hasPackageAccess
          ? `Package · Download Ready (${approvedFiles.length})`
          : `Download Ready (${approvedFiles.length})`,
      explanation: isAssignedToWorkspace
        ? 'Prepared specifically for your workspace and approved by Admin HQ for immediate download.'
        : hasPackageAccess
          ? 'Unlocked by your active contracted studio package and ready for immediate download.'
          : 'Approved studio deliverable files are published and ready for immediate download.',
      canDownload: true,
      approvedFilesCount: approvedFiles.length,
      isAssignedToWorkspace,
    };
  }

  if (isAssignedToWorkspace) {
    return {
      state: 'workspace-assigned',
      badgeLabel: 'Assigned to Workspace',
      explanation: 'Assigned to your workspace. Studio deliverable files are being finalized or can be requested below.',
      canDownload,
      approvedFilesCount: 0,
      isAssignedToWorkspace: true,
    };
  }

  if (product.accessType === 'IncludedInPackage') {
    return {
      state: 'included-in-package',
      badgeLabel: 'Included in Package',
      explanation: 'Unlocked by your active contracted studio package. Commission a customized deliverable pack below.',
      canDownload: true,
      approvedFilesCount: 0,
      isAssignedToWorkspace: false,
    };
  }

  if (product.accessType === 'Free') {
    return {
      state: 'free-catalog',
      badgeLabel: 'Free Resource',
      explanation: 'Free Creative Hub resource for eligible accounts. Request studio customization or await file release.',
      canDownload: true,
      approvedFilesCount: 0,
      isAssignedToWorkspace: false,
    };
  }

  return {
    state: 'request-required',
    badgeLabel: 'Request Required',
    explanation: 'Custom-tailored per workspace. Submit a quick production request so KeedoHub produces this asset for you.',
    canDownload: false,
    approvedFilesCount: 0,
    isAssignedToWorkspace: false,
  };
}

export function slugifyProductTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `product-${Date.now()}`
  );
}
