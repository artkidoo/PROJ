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

export interface Artist {
  id: string;
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

export interface MusicRelease {
  id: string;
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
