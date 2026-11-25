export type CreativeProductAudience = 'Artist' | 'Brand' | 'Business' | 'Brand & Business' | 'Shared';

export type CreativeProductStatus = 'Draft' | 'Published' | 'Archived';

export type CreativeProductReviewStatus = 'Draft' | 'Pending Review' | 'Published' | 'Archived';

export type CreativeProductAccessType =
  | 'Free'
  | 'IncludedInPackage'
  | 'AdminAssigned'
  | 'RequestRequired';

export type CreativeProductFileFormat =
  | 'PSD'
  | 'PDF'
  | 'SVG'
  | 'PNG'
  | 'JPG'
  | 'WEBP'
  | 'ZIP'
  | 'MP4'
  | 'OTHER';

export type CreativeResourceType =
  | 'Template'
  | 'Document Suite'
  | 'Social Pack'
  | 'Press & EPK'
  | 'Brand Kit'
  | 'Mockup & Print'
  | 'Motion & Canvas'
  | 'Shared Utility';

export type CreativeDropStatus = 'Draft' | 'Scheduled' | 'Published' | 'Archived';

export type CreativeDropAccessLevel = 'Free' | 'Restricted';

export interface ProductDimensionSpec {
  platform: string;
  dimensions: string;
  aspectRatio: string;
  notes?: string;
}

export type CreativeProductSpecItem = ProductDimensionSpec;

export interface ProductPreviewItem {
  url: string;
  alt: string;
  caption?: string;
}

export interface ProductVariationOption {
  id: string;
  label: string;
  format: string;
  aspectRatio?: string;
  paletteMode?: 'Dark Studio' | 'Monochrome Light' | 'Accent Crimson';
  notes?: string;
}

export interface CreativeProductDeliverableFile {
  id: string;
  label: string;
  fileName: string;
  fileFormat: CreativeProductFileFormat;
  mimeType: string;
  storagePath: string;
  fileSizeBytes: number;
  fileSizeLabel: string;
  dimensions?: string;
  version?: string;
  isApprovedForClient: boolean;
  createdAt: string;
  uploadedBy: string;
}

export interface CreativeProduct {
  id: string;
  title: string;
  slug: string;
  audience: CreativeProductAudience;
  productFamily?: string;
  category: string;
  subcategory: string;
  resourceType?: CreativeResourceType;
  industryTag?: string;
  summary: string;
  description: string;
  status: CreativeProductStatus;
  reviewStatus?: CreativeProductReviewStatus;
  accessType: CreativeProductAccessType;
  includedPackageIds?: string[];
  assignedWorkspaceIds: string[];
  membershipTiers?: string[];
  priceUsd?: number;
  unlockedByDefault?: boolean;
  instantStudioPackEligible?: boolean;
  linkedServiceCategory: string;
  linkedCanvasDesignId?: string;
  linkedTemplateId?: string;
  version: string;
  supportedFormats: string[];
  deliverablesSummary: string[];
  includedItems?: string[];
  dimensionSpecs: ProductDimensionSpec[];
  variationOptions?: ProductVariationOption[];
  previewImageUrl: string;
  previewStoragePath?: string;
  previewAlt?: string;
  previewGallery?: ProductPreviewItem[];
  files: CreativeProductDeliverableFile[];
  featured?: boolean;
  dropIds?: string[];
  viewCount?: number;
  downloadCount?: number;
  saveCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  createdByUid?: string;
}

/**
 * Admin-only internal creative production specification stored under
 * creativeProducts/{productId}/internalSpecs/master so clients never read
 * internal Canvas JSON structures, proprietary notes, or unreleased master layers.
 */
export interface CreativeProductInternalSpec {
  id: string;
  productId: string;
  productionNotes: string;
  internalCanvasDesignJson?: string;
  canvasDesignIds?: string[];
  sourceFiles: CreativeProductDeliverableFile[];
  updatedAt: string;
  updatedBy: string;
}

export interface CreativeResourceDrop {
  id: string;
  title: string;
  slug: string;
  monthKey: string; // YYYY-MM e.g. '2026-11'
  headline: string;
  description: string;
  audience: CreativeProductAudience;
  accessLevel: CreativeDropAccessLevel;
  status: CreativeDropStatus;
  heroImageUrl: string;
  productIds: string[];
  highlightTags?: string[];
  publishDate: string;
  expiresAt?: string;
  createdByUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FavouriteResource {
  productId: string;
  uid: string;
  workspaceId: string;
  audience: CreativeProductAudience;
  titleSnapshot?: string;
  categorySnapshot?: string;
  previewImageUrlSnapshot?: string;
  savedAt: string;
}

export interface ResourceCollection {
  id: string;
  uid: string;
  workspaceId: string;
  name: string;
  description?: string;
  productIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAccessHistoryItem {
  productId: string;
  uid: string;
  workspaceId: string;
  lastAction: 'view' | 'preview' | 'download';
  lastFormat?: string;
  lastVariation?: string;
  downloadCount: number;
  titleSnapshot?: string;
  categorySnapshot?: string;
  previewImageUrlSnapshot?: string;
  lastAccessedAt: string;
}

export type ResourceAnalyticsAction =
  | 'view'
  | 'preview'
  | 'download_attempt'
  | 'download_success'
  | 'download_denied'
  | 'favourite_add'
  | 'favourite_remove'
  | 'collection_add'
  | 'drop_view';

export interface ResourceAnalyticsEvent {
  id: string;
  productId?: string;
  dropId?: string;
  action: ResourceAnalyticsAction;
  uid: string;
  workspaceId: string;
  audience: CreativeProductAudience | 'Unknown';
  category?: string;
  accessType?: CreativeProductAccessType;
  format?: string;
  createdAt: string;
}

export interface ResourceAnalyticsSummary {
  productId: string;
  title?: string;
  audience?: CreativeProductAudience;
  category?: string;
  accessType?: CreativeProductAccessType;
  viewCount: number;
  previewCount: number;
  downloadCount: number;
  deniedCount: number;
  favouriteCount: number;
  collectionAddCount: number;
  dropViewCount?: number;
  lastEventAt?: string;
}
