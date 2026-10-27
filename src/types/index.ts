/**
 * LYRICAL ENT — Brand & Label Studio
 * Core Data Models & Type Definitions
 */

export type UserRole = 
  | 'Executive'
  | 'A&R Director'
  | 'Creative Director'
  | 'Label Manager'
  | 'Legal & Business Affairs';

export type AppModule = 
  | 'dashboard'
  | 'production'
  | 'admin'
  | 'brand'
  | 'documents'
  | 'artists'
  | 'releases'
  | 'campaigns'
  | 'templates'
  | 'celebration'
  | 'promotion'
  | 'motion'
  | 'cards'
  | 'press'
  | 'blogger'
  | 'assets'
  | 'operations'
  | 'export';

/**
 * KEEDOHUB — Platform Foundation Types
 */

export type AppMode = 'public' | 'workspace';

export type UserStatus = 'Active' | 'Suspended' | 'Pending';
export type MembershipStatus = 'Active' | 'Invited' | 'Revoked';
export type WorkspaceRole = 'Owner' | 'Admin' | 'Member' | 'Guest';
export type WorkspaceStatus = 'Active' | 'Onboarding' | 'Paused' | 'Archived';

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
}

export type WorkspaceType = 'Artist' | 'Brand' | 'Label' | 'Agency' | 'Personal' | 'Enterprise';
export type ClientCategory = 'artist' | 'brand' | 'label';

export interface WorkspaceBrand {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  tagline?: string;
  typography?: {
    displayFont?: string;
    bodyFont?: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  clientCategory?: ClientCategory;
  brand: WorkspaceBrand;
  ownerId: string;
  description?: string;
  status?: WorkspaceStatus;
  contactEmail?: string;
  contractedPackageIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface WorkspaceMembership {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  status: MembershipStatus;
  joinedAt: string;
}

/**
 * KEEDOHUB — Phase 4 Services & Packages Types
 */
export type ServiceCategory = 
  | 'Music Release Promotion'
  | 'Cover Artwork & Visuals'
  | 'Motion Design & Video'
  | 'Brand Identity System'
  | 'Business & Corporate Creative'
  | 'Executive Creative Retainer';

export type ServiceTier = 'Essential' | 'Professional' | 'Flagship / Custom';

export interface ServicePackage {
  id: string;
  category: ServiceCategory;
  name: string;
  tier: ServiceTier;
  description: string;
  deliverables: string[];
  priceUsd: number;
  billingType: 'One-Time' | 'Per-Release' | 'Monthly Retainer';
  revisionLimit: number; // e.g. 2, 3, or -1 for unlimited
  turnaroundDays: number; // e.g. 3, 5, 10
  isActive: boolean;
  targetAudience: 'Artist' | 'Brand' | 'Both';
  createdAt: string;
  updatedAt: string;
}

export interface CreativeProject {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  status: 'Draft' | 'Active' | 'Paused' | 'Completed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * KEEDOHUB — Phase 3 Private Production Center Types
 */
export type ProductionStage = 
  | 'New Request'
  | 'Brief Approved'
  | 'In Production'
  | 'Internal QA'
  | 'Client Review'
  | 'Revision Required'
  | 'Ready for Delivery'
  | 'Delivered';

export type ProductionPriority = 'Low' | 'Medium' | 'Normal' | 'High' | 'Urgent';

export type ProductionProjectType = 
  | 'Music Release Package'
  | 'Cover Artwork Design'
  | 'Motion Teaser & 9:16 Canvas'
  | 'Brand Identity System'
  | 'Marketing Campaign Kit'
  | 'Corporate Contract & Stationery'
  | 'Website & Press Kit';

export interface DeliverableVersion {
  id: string;
  versionNumber: string;
  title: string;
  fileUrl?: string;
  previewUrl?: string;
  fileType: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string;
  isClientPublished: boolean;
  publishedAt?: string;
  clientReviewStatus?: 'Pending' | 'Approved' | 'Revision Requested';
  clientFeedback?: string;
}

export interface ProductionNote {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  isInternalOnly: boolean;
}

export interface ProductionQualityCheck {
  id: string;
  label: string;
  passed: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ProductionProject {
  id: string;
  title: string;
  workspaceId: string;
  clientName: string;
  clientCategory: ClientCategory;
  projectType: ProductionProjectType;
  stage: ProductionStage;
  priority: ProductionPriority;
  leadProducer: string;
  dueDate: string;
  brief: {
    description: string;
    deliverableSpecs: string;
    targetAudience?: string;
    inspirationNotes?: string;
    referenceLinks?: string[];
  };
  sourceMaterials: {
    id: string;
    name: string;
    fileType: string;
    url: string;
    uploadedAt: string;
  }[];
  versions: DeliverableVersion[];
  internalNotes: ProductionNote[];
  qualityChecks: ProductionQualityCheck[];
  relatedReleaseId?: string;
  relatedDocumentId?: string;
  relatedTaskId?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export interface Artist {
  id: string;
  workspaceId?: string; // Multi-tenancy support
  name: string;
  moniker?: string;
  legalName?: string;
  genre: string;
  bio: string;
  email: string;
  phone?: string;
  location?: string;
  instagram?: string;
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  status: 'Active' | 'Development' | 'Signed' | 'Prospect';
  careerGoals: string;
  developmentNotes: string;
  projectHistory: string[];
  releaseIds: string[];
  avatarUrl?: string;
  isConfidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReleaseType = 'Single' | 'EP' | 'Album' | 'Music Video' | 'Collaboration';
export type DistributionStatus = 
  | 'Planning' 
  | 'In Production' 
  | 'Metadata Verification' 
  | 'Scheduled' 
  | 'Delivered' 
  | 'Live';

export interface ReleaseChecklist {
  audioMastered: boolean;
  artworkApproved: boolean;
  splitSheetSigned: boolean;
  metadataVerified: boolean;
  distributionSubmitted: boolean;
  pressKitReady: boolean;
  marketingAssetsReady: boolean;
}

export type CampaignStage = 'Pre-Release' | 'Release Day' | 'Post-Release';

export interface AudioMetadata {
  fileName?: string;
  fileUrl?: string;
  format?: string;
  durationSeconds?: number;
  sampleRate?: string;
  bitDepth?: string;
  fileSize?: string;
  uploadedAt?: string;
}

export interface ArtworkMetadata {
  fileName?: string;
  fileUrl?: string;
  dimensions?: string;
  colorSpace?: string;
  resolutionDpi?: number;
  fileSize?: string;
  uploadedAt?: string;
}

export type DeliverableWorkflowStage = 
  | 'Brief'
  | 'In Production'
  | 'Internal QA'
  | 'Client Review'
  | 'Revision Required'
  | 'Delivered';

export interface ReleaseDeliverableItem {
  id: string;
  name: string;
  category: 'Artwork' | 'Motion Video' | 'Social Asset' | 'EPK & Press' | 'Audio Master';
  format: string;
  stage: DeliverableWorkflowStage;
  previewUrl?: string;
  downloadUrl?: string;
  fileSpecs?: string;
  revisionCount: number;
  maxRevisions: number;
  clientFeedback?: string;
  isClientPublished: boolean;
  publishedAt?: string;
  clientApproved?: boolean;
  approvedAt?: string;
}

export interface MotionProjectSpec {
  id: string;
  workspaceId: string;
  releaseId?: string;
  title: string;
  aspectRatio: '1:1 Square' | '9:16 Vertical Story' | '16:9 Landscape';
  deliverableType: 'Music Visualizer' | 'Lyric Video' | 'Out Now Teaser' | 'Countdown Promo' | 'Spotify Canvas Loop';
  audioFileName?: string;
  audioDurationSeconds?: number;
  intendedVideoDurationSeconds: number;
  visualDirection: string;
  referenceLinks?: string[];
  storyboardNotes?: string;
  stage: DeliverableWorkflowStage;
  isClientPublished: boolean;
  clientFeedback?: string;
  internalProductionNotes?: string;
  currentVersion: string;
  previewKeyframeUrl?: string;
  exportSpecs?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface MusicRelease {
  id: string;
  workspaceId?: string;
  title: string;
  type: ReleaseType;
  artistId: string;
  artistName: string;
  featuredArtists?: string;
  producer: string;
  songwriters: string;
  credits: string;
  plannedReleaseDate: string;
  artworkUrl?: string;
  audioLocation?: string;
  distributionStatus: DistributionStatus;
  isrc?: string;
  upc?: string;
  rightsInfo: string;
  releaseNotes: string;
  marketingAssetsCount: number;
  publicUrl?: string;
  checklist: ReleaseChecklist;
  budgetAllocated?: number;
  budgetSpent?: number;
  // Phase 5 Structured Workflows
  packageId?: string;
  campaignStage?: CampaignStage;
  audioMetadata?: AudioMetadata;
  artworkMetadata?: ArtworkMetadata;
  deliverables?: ReleaseDeliverableItem[];
  clientApprovalStatus?: 'Pending' | 'Approved' | 'Revision Requested';
  clientApprovalDate?: string;
  finalDeliveryUrl?: string;
  associatedProductionProjectId?: string;
  createdAt: string;
}

export interface CampaignDeliverable {
  id: string;
  name: string;
  format: '1:1 Square' | '9:16 Vertical Story' | '16:9 Landscape' | 'Print / Poster' | 'Audio Visualizer';
  status: 'Pending' | 'In Progress' | 'In Review' | 'Approved';
  assignedTo?: string;
  dueDate: string;
  assetUrl?: string;
}

export interface CreativeCampaign {
  id: string;
  workspaceId?: string;
  title: string;
  releaseId?: string;
  releaseTitle?: string;
  artistId?: string;
  artistName: string;
  type: 'Single Launch' | 'EP Rollout' | 'Album Campaign' | 'Tour Announcement' | 'Signing Reveal' | 'Brand Partnership';
  budget: number;
  status: 'Planning' | 'In Production' | 'In Review' | 'Active' | 'Completed';
  launchDate: string;
  notes: string;
  deliverables: CampaignDeliverable[];
  createdAt: string;
}

export type DocumentType = 
  | 'letterhead'
  | 'business_card'
  | 'company_profile'
  | 'official_letter'
  | 'invoice'
  | 'receipt'
  | 'quotation'
  | 'partnership_proposal'
  | 'sponsorship_proposal'
  | 'internal_memo'
  | 'meeting_agenda'
  | 'meeting_minutes'
  | 'business_report'
  | 'email_signature'
  | 'asset_handover'
  | 'split_sheet'
  | 'producer_agreement_memo'
  | 'video_release_memo';

export interface DocumentItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

export interface CorporateDocument {
  id: string;
  workspaceId?: string;
  type: DocumentType;
  title: string;
  referenceNo: string;
  date: string;
  recipientName: string;
  recipientOrg?: string;
  recipientAddress?: string;
  recipientEmail?: string;
  authorName: string;
  authorRole: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Issued';
  subject?: string;
  bodyContent: string;
  items?: DocumentItem[];
  paymentTerms?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BrandAsset {
  id: string;
  workspaceId?: string;
  name: string;
  category: 'Primary Logo' | 'Secondary Logo' | 'Monogram' | 'Icon' | 'Favicon' | 'Typography' | 'Palette' | 'Guideline';
  fileType: 'SVG' | 'PNG' | 'PDF' | 'JSON';
  dimensions?: string;
  fileSize?: string;
  version: string;
  status: 'Approved' | 'Review' | 'Draft' | 'Archived';
  description: string;
  usageRules: string;
  downloadUrl?: string;
  isVector: boolean;
  uploadedAt: string;
}

export interface OperationTask {
  id: string;
  workspaceId?: string;
  title: string;
  category: 'A&R' | 'Creative' | 'Legal' | 'Distribution' | 'Marketing' | 'Executive';
  priority: 'Urgent' | 'High' | 'Normal' | 'Low';
  dueDate: string;
  assignee: string;
  status: 'Todo' | 'In Progress' | 'In Review' | 'Done';
  relatedEntityId?: string;
  relatedEntityName?: string;
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  module: AppModule;
  details: string;
}

export interface PressRelease {
  id: string;
  workspaceId?: string;
  title: string;
  subtitle: string;
  date: string;
  embargoDate?: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  leadParagraph: string;
  body: string;
  quoteSpeaker: string;
  quoteTitle: string;
  quoteBody: string;
  mediaContact: string;
  relatedArtistId?: string;
}

export interface MediaContact {
  id: string;
  workspaceId?: string;
  outlet: string;
  contactName: string;
  role: string;
  email: string;
  phone?: string;
  beat: string;
  tier: 'Tier 1' | 'Tier 2' | 'Blog / Independent';
  notes?: string;
}

export interface BloggerThemeSettings {
  siteTitle: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroButtonText: string;
  heroButtonUrl: string;
  musicCardColumns: 2 | 3 | 4;
  showArtistRoster: boolean;
  showLatestReleases: boolean;
  showNewsSection: boolean;
  showAboutSection: boolean;
  showNewsletterSubscribe: boolean;
  showDemoSubmissionLink: boolean;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  footerCopyright: string;
  aboutLabelText: string;
  missionText: string;
  visionText: string;
  contactEmail: string;
  demoSubmissionEmail: string;
  featuredReleaseId: string;
  featuredArtistId: string;
  instagramUrl: string;
  spotifyUrl: string;
  youtubeUrl: string;
  xUrl: string;
  featuredVideoTitle: string;
  featuredVideoEmbedUrl: string;
}

export interface BrandGuidelinesData {
  brandVoice: string;
  photographyDirection: string;
  graphicDesignPrinciples: string;
  clearSpaceRules: string;
  minLogoSizePrint: string;
  minLogoSizeDigital: string;
  backgroundRules: string;
  incorrectUsageRules: string[];
}
