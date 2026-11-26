export type ProductionLifecycleStatus =
  | 'Draft'
  | 'In Progress'
  | 'Saved'
  | 'Under Review'
  | 'Approved'
  | 'Completed'
  | 'Archived';

export type CreativeStudioToolId =
  | 'release-artwork-studio'
  | 'launch-social-studio'
  | 'motion-visualizer-studio'
  | 'product-ad-designer'
  | 'lyric-card-studio'
  | 'brand-collateral-studio'
  | 'artist-epk-studio'
  | 'split-sheet-studio'
  | 'pack-template-customizer';

export type StudioToolCategory =
  | 'Music & Releases'
  | 'Social & Marketing'
  | 'Brand & Identity'
  | 'Motion & DSPs'
  | 'Documents & Legal';

export interface StudioToolDefinition {
  id: CreativeStudioToolId;
  name: string;
  headline: string;
  description: string;
  category: StudioToolCategory;
  audience: 'Artist' | 'Brand' | 'Shared';
  formats: string[];
  defaultAspectRatios: string[];
  badge: string;
  featured?: boolean;
  exampleOutputs: string[];
}

export interface MultiFormatPreset {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
  aspectRatio: string;
  notes: string;
  targetAudience: 'Artist' | 'Brand' | 'Shared';
}

export interface ProductionDesignState {
  headline: string;
  subtitle: string;
  artistOrBrandName: string;
  tagline: string;
  dateText: string;
  genreOrCategory?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  theme: 'noir' | 'minimal_white' | 'dark_grid' | 'crimson_accent' | 'pitch_black' | 'silver_slate';
  fontFamily: 'serif' | 'sans' | 'mono' | 'display';
  fontWeight: '300' | '400' | '600' | '700' | '900';
  letterSpacing: number; // in px
  textTransform: 'none' | 'uppercase' | 'lowercase';
  imageUrl?: string;
  imageFilter?: 'none' | 'grayscale' | 'noir' | 'contrast';
  imageScale?: number; // 0.5 to 2
  imagePositionX?: number; // 0 to 100 percentage
  imagePositionY?: number; // 0 to 100 percentage
  textureOverlay?: 'none' | 'film_grain' | 'subtle_noise' | 'fine_grid' | 'scan_lines' | 'halftone_dots';
  textureOpacity?: number; // 0 to 1
  badgeText?: string;
  showBorder?: boolean;
  showDivider?: boolean;
  showAdvisoryBadge?: boolean;
  explicitLyrics?: boolean;
  spotifySafeZoneOverlay?: boolean;
  trackListSnippet?: string;
  barcodeOrUpc?: string;
  isrcSnippet?: string;
  quoteOrLyricsText?: string;
  productFeaturePoints?: string[];
  customCtaText?: string;
}

export interface ProductionVariation {
  formatId: string;
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  previewDataUrl?: string;
}

export interface ProductionExportedFile {
  id: string;
  name: string;
  format: 'PNG' | 'JPEG' | 'SVG' | 'PDF' | 'ZIP';
  downloadUrl?: string;
  fileSize?: string;
  exportedAt: string;
}

export interface CreativeProductionItem {
  id: string;
  workspaceId: string;
  title: string;
  toolId: CreativeStudioToolId;
  productionType: string;
  audience: 'Artist' | 'Brand' | 'Shared';
  status: ProductionLifecycleStatus;
  projectId?: string;
  projectTitle?: string;
  releaseId?: string;
  releaseTitle?: string;
  requestId?: string;
  assetId?: string;
  productId?: string;
  productTitle?: string;
  currentFormat: string;
  dimensions: {
    width: number;
    height: number;
    aspectRatio: string;
    label: string;
  };
  designState: ProductionDesignState;
  variations: ProductionVariation[];
  exportedFiles: ProductionExportedFile[];
  previewDataUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreativeStarterSource =
  | 'scratch'
  | 'template'
  | 'resource'
  | 'asset'
  | 'project'
  | 'request'
  | 'release'
  | 'profile';

export interface CreativeStarterParams {
  source: CreativeStarterSource;
  toolId: CreativeStudioToolId;
  title?: string;
  productionType?: string;
  formatId?: string;
  prefillDesign?: Partial<ProductionDesignState>;
  linkedReleaseId?: string;
  linkedReleaseTitle?: string;
  linkedProjectId?: string;
  linkedProjectTitle?: string;
  linkedRequestId?: string;
  linkedAssetId?: string;
  linkedProductId?: string;
  linkedProductTitle?: string;
}
