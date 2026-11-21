export type CreativeProductAudience =
  | 'Artist'
  | 'Brand'
  | 'Business'
  | 'Brand & Business'
  | 'Shared';

export type CreativeProductAccessType =
  | 'Free'
  | 'IncludedInPackage'
  | 'AdminAssigned'
  | 'RequestRequired';

export type CreativeProductStatus = 'Draft' | 'Published' | 'Archived';

export type CreativeProductFileFormat =
  | 'PNG'
  | 'JPG'
  | 'PDF'
  | 'PSD'
  | 'SVG'
  | 'ZIP'
  | 'MP4'
  | 'WEBP'
  | 'OTHER';

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
  version: string;
  isApprovedForClient: boolean;
  createdAt: string;
  uploadedBy: string;
}

export interface CreativeProductSpecItem {
  platform: string;
  dimensions: string;
  aspectRatio: string;
  notes?: string;
}

export interface CreativeProduct {
  id: string;
  title: string;
  slug: string;
  audience: CreativeProductAudience;
  productFamily?: string;
  category: string;
  subcategory: string;
  summary: string;
  description: string;
  status: CreativeProductStatus;
  accessType: CreativeProductAccessType;
  assignedWorkspaceIds: string[];
  includedPackageIds?: string[];
  linkedServiceCategory: string;
  version: string;
  supportedFormats: string[];
  deliverablesSummary: string[];
  dimensionSpecs: CreativeProductSpecItem[];
  previewImageUrl: string;
  previewStoragePath?: string;
  previewAlt?: string;
  files: CreativeProductDeliverableFile[];
  linkedCanvasDesignId?: string;
  linkedTemplateId?: string;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreativeProductInternalSpec {
  id: string;
  productId: string;
  productionNotes: string;
  internalCanvasDesignJson?: string;
  sourceFiles: CreativeProductDeliverableFile[];
  updatedAt: string;
  updatedBy: string;
}
