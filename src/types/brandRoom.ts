import type { AspectRatioType, CanvasDesign } from './designStudio';

export type BrandRoomSection =
  | 'marketing-overview'
  | 'brand-identity'
  | 'marketing-design-studio'
  | 'social-media-library'
  | 'advertising-promotions'
  | 'portfolio-showcases'
  | 'artist-marketing'
  | 'brand-business-marketing'
  | 'motion-video-marketing'
  | 'website-digital-marketing'
  | 'print-offline-marketing'
  | 'content-strategy'
  | 'content-calendar'
  | 'publishing-management'
  | 'marketing-archive'
  | 'marketing-analytics';

export type MarketingPlatform =
  | 'Instagram'
  | 'Facebook'
  | 'TikTok'
  | 'LinkedIn'
  | 'YouTube'
  | 'X'
  | 'Pinterest'
  | 'Website & Email'
  | 'Print & Offline';

export type MarketingContentType =
  | 'Single-image post'
  | 'Carousel post'
  | 'Story'
  | 'Reel'
  | 'Short-form video'
  | 'Motion graphic'
  | 'Promotional poster'
  | 'Service advertisement'
  | 'Product advertisement'
  | 'Portfolio post'
  | 'Educational graphic'
  | 'Infographic'
  | 'Testimonial'
  | 'Announcement'
  | 'Event graphic'
  | 'Website banner'
  | 'Print advertisement'
  | 'Brochure'
  | 'Company presentation';

export type MarketingContentStatus =
  | 'Draft'
  | 'Planned'
  | 'Approved'
  | 'Scheduled'
  | 'Published'
  | 'Archived';

export type MarketingCategoryArea =
  | 'Social Media'
  | 'Advertising & Promotions'
  | 'Artist Marketing'
  | 'Brand & Business Marketing'
  | 'Motion & Video'
  | 'Website & Email'
  | 'Print & Offline'
  | 'Portfolio & Showcases';

export type MarketingTargetAudience =
  | 'Artists'
  | 'Brands'
  | 'Businesses'
  | 'Brands & Businesses'
  | 'All Audiences';

export interface MarketingFormatSpec {
  id: string;
  platform: MarketingPlatform;
  label: string;
  width: number;
  height: number;
  aspectLabel: string;
  canvasAspectRatio: AspectRatioType;
  safeAreaTopPct: number;
  safeAreaBottomPct: number;
  safeAreaSidePct: number;
  cropRule: string;
  recommendedFormats: ('PNG' | 'JPG' | 'SVG' | 'PDF' | 'MP4' | 'WEBM' | 'ZIP')[];
  printDpi?: number;
}

export type BrandIdentityAssetSlot =
  | 'primary_logo'
  | 'secondary_logo'
  | 'logo_variation'
  | 'transparent_logo'
  | 'light_logo'
  | 'dark_logo'
  | 'brand_pattern'
  | 'background_texture'
  | 'graphic_element';

export interface BrandIdentityAsset {
  id: string;
  slot: BrandIdentityAssetSlot;
  title: string;
  notes?: string;
  fileName: string;
  fileFormat: string;
  mimeType: string;
  storagePath: string;
  downloadUrl: string;
  fileSizeBytes: number;
  dimensions?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface BrandColorSwatch {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  role: 'Primary' | 'Background' | 'Surface' | 'Text' | 'Border' | 'Accent';
  usage: string;
}

export interface BrandTypographySpec {
  id: string;
  role: 'Display' | 'Heading' | 'Body' | 'Monospace';
  fontFamily: string;
  weights: string;
  usage: string;
  sampleText: string;
}

export interface KeedoBrandIdentity {
  id: 'keedohub';
  companyName: string;
  legalEntityName: string;
  tagline: string;
  officialDescription: string;
  positioningStatement: string;
  brandVoiceAndTone: string;
  brandGuidelinesSummary: string;
  contactEmail: string;
  websiteUrl: string;
  headquarters: string;
  approvedMessages: string[];
  colors: BrandColorSwatch[];
  typography: BrandTypographySpec[];
  assets: BrandIdentityAsset[];
  updatedAt: string;
  updatedBy: string;
}

export interface ContentPillar {
  id: string;
  name: string;
  description: string;
  audience: MarketingTargetAudience;
  coreObjectives: string[];
  isSystemDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ContentSeries {
  id: string;
  name: string;
  pillarId: string;
  pillarName: string;
  cadence: string;
  description: string;
  recommendedFormats: string[];
  isSystemDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface MarketingExportFile {
  id: string;
  label: string;
  fileName: string;
  fileFormat: string;
  mimeType: string;
  storagePath: string;
  downloadUrl?: string;
  fileSizeBytes: number;
  dimensions?: string;
  platform?: MarketingPlatform;
  formatId?: string;
  isEditableSource?: boolean;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface MarketingAssetVersion {
  version: number;
  note: string;
  storagePath?: string;
  fileName?: string;
  fileFormat?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface MarketingAsset {
  id: string;
  title: string;
  categoryArea: MarketingCategoryArea;
  topic: string;
  contentPillarId: string;
  contentPillarName: string;
  seriesId?: string;
  seriesName?: string;
  contentType: MarketingContentType;
  targetAudience: MarketingTargetAudience;
  platform: MarketingPlatform;
  formatId: string;
  formatLabel: string;
  dimensions: string;
  description: string;
  caption: string;
  callToAction: string;
  hashtags: string[];
  tags: string[];
  status: MarketingContentStatus;
  publicationDate?: string;
  publishedAt?: string;
  publishedUrl?: string;
  assignedTeamMemberUid?: string;
  assignedTeamMemberName?: string;
  promotionObjective?: string;
  showcaseProjectId?: string;
  showcaseSourceType?: 'ClientProject' | 'CreativeProduct' | 'StudioSample';
  masterTemplateId?: string;
  canvasDesignJson?: string;
  previewUrl?: string;
  previewStoragePath?: string;
  editableSourcePath?: string;
  editableSourceUrl?: string;
  exportedFiles: MarketingExportFile[];
  version: number;
  versionHistory: MarketingAssetVersion[];
  reuseCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface MarketingMasterTemplate {
  id: string;
  title: string;
  categoryArea: MarketingCategoryArea;
  topic: string;
  contentType: MarketingContentType;
  targetAudience: MarketingTargetAudience;
  pillarId: string;
  pillarName: string;
  seriesName?: string;
  platform: MarketingPlatform;
  formatId: string;
  description: string;
  defaultCaption: string;
  defaultCallToAction: string;
  defaultHashtags: string[];
  buildDesign: (format: MarketingFormatSpec) => CanvasDesign;
}
