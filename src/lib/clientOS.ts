import type {
  ArtistWorkspaceProfile,
  BrandWorkspaceProfile,
  ClientProfile,
  ClientProject,
  CreativeProduct,
  InvoiceRecord,
  ProductionActivity,
  ProductionRevisionRequest,
  ProposalRecord,
  Workspace,
} from '../types';
import {
  defaultCategoryForAudience,
  isValidCalendarDate,
  UNIFIED_PRODUCTION_CATEGORIES,
} from './productionCategories';
import { inspectAccountType } from './accountNormalization';

export type ClientStudioSection =
  | 'artist-profile'
  | 'profile'
  | 'releases'
  | 'content'
  | 'assets'
  | 'brand'
  | 'documents'
  | 'invoices'
  | 'proposals';

export type ClientTab =
  | 'overview'
  | 'creative-hub'
  | 'studio'
  | 'projects'
  | 'requests'
  | 'deliverables'
  | 'updates'
  | 'account'
  | ClientStudioSection;

export type ClientOSMode = 'artist' | 'brand';

export const ARTIST_ASSET_CATEGORIES = [
  'Cover Art',
  'Alt Artwork',
  'Release Graphics',
  'Promotional',
  'Lyrics',
  'Visualizer',
  'Video',
  'EPK',
  'Branding',
  'Social',
  'Documents',
  'Uploaded Files',
  'Artwork',
  'Photography',
  'Other',
] as const;

export const BRAND_ASSET_CATEGORIES = [
  'Logo',
  'Brand Identity',
  'Social Content',
  'Marketing Graphics',
  'Product Images',
  'Packaging',
  'Photography',
  'Video',
  'Documents',
  'Stationery',
  'Guideline',
  'Promotional',
  'Other',
] as const;

export const BRAND_BUSINESS_CATEGORIES = [
  'Restaurant / Food & Hospitality',
  'Fashion / Apparel',
  'Beauty / Skincare',
  'Real Estate & Architecture',
  'Retail / E-Commerce',
  'Corporate / Professional Services',
  'Technology / SaaS',
  'Media & Entertainment',
  'Health & Wellness',
  'Other',
] as const;

export interface ClientNavItem {
  id: ClientTab;
  title: string;
  description: string;
}

export interface ClientNavGroup {
  group: string;
  items: ClientNavItem[];
}

export interface ClientExperienceConfig {
  osMode: ClientOSMode;
  osTitle: string;
  osSubtitle: string;
  isArtist: boolean;
  isBrandOrCompany: boolean;
  accountTypeWarning?: string;
  navGroups: ClientNavGroup[];
  isOverride?: boolean;
}

export interface ProductionRequestPrefill {
  title: string;
  category: string;
  description: string;
  requirements?: string;
  references?: string;
  dueDate?: string;
  intendedUse?: string;
  targetPlatforms?: string[];
  requiredDeliverables?: string[];
  packagingSpec?: string;
  linkedProductId?: string;
  linkedProductTitle?: string;
  linkedReleaseId?: string;
  linkedReleaseTitle?: string;
}

export interface CreativeServiceOption {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  deliverables: string[];
  defaultFormats: string[];
  turnaroundHint: string;
}

export const ARTIST_CREATIVE_SERVICES: CreativeServiceOption[] = [
  {
    id: 'svc-cover-artwork',
    title: 'Cover Art',
    category: 'Music Cover Artwork',
    subtitle: 'Art-directed single, EP & album cover art built for DSP compliance and physical vinyl sleeves.',
    deliverables: ['3000×3000 Master Cover', 'Explicit/Clean Variants', 'Tracklist Back Sleeve', 'Print PDF/X Ready'],
    defaultFormats: ['PNG', 'JPG', 'PDF', 'PSD'],
    turnaroundHint: '3–5 business days',
  },
  {
    id: 'svc-motion-visualizer',
    title: 'Motion Visualizers',
    category: 'Motion Graphics',
    subtitle: '9:16 Spotify Canvas loops, visualizer backdrops, and release motion teasers.',
    deliverables: ['Spotify Canvas Loop (9:16)', 'YouTube Visualizer Master (16:9)', 'Reels & TikTok Teaser Cut'],
    defaultFormats: ['MP4', 'PNG'],
    turnaroundHint: '4–7 business days',
  },
  {
    id: 'svc-lyric-videos',
    title: 'Lyric Videos',
    category: '2D Animation',
    subtitle: 'Full-length kinetic typography lyric videos synced to your master audio and brand palette.',
    deliverables: ['16:9 4K/1080p Lyric Video', '9:16 Chorus Vertical Cut', 'Lyric Quote Stills'],
    defaultFormats: ['MP4', 'PNG'],
    turnaroundHint: '5–8 business days',
  },
  {
    id: 'svc-artist-branding',
    title: 'Artist Branding',
    category: 'Artist Promotional Graphics',
    subtitle: 'Complete artist visual identity, custom monogram, EPK media kit, and stage/press styling.',
    deliverables: ['Artist Monogram & Wordmark', 'Multi-page EPK PDF', 'Press Bio Layout', 'Show & Tour Poster Kit'],
    defaultFormats: ['SVG', 'PDF', 'PNG', 'PSD'],
    turnaroundHint: '5–7 business days',
  },
  {
    id: 'svc-music-promo-design',
    title: 'Music Promotional Design',
    category: 'Streaming Pack',
    subtitle: 'Full DSP promotional suites for Spotify, Apple Music, Audiomack, Boomplay & YouTube Music.',
    deliverables: ['All-DSP Release Headers', 'Pre-Save & Out-Now Suite', 'Playlist & Milestone Cards', 'Countdown Reels'],
    defaultFormats: ['PNG', 'JPG', 'PSD', 'ZIP'],
    turnaroundHint: '3–5 business days',
  },
  {
    id: 'svc-custom-release-materials',
    title: 'Custom Release Materials',
    category: 'Social Media Designs',
    subtitle: 'Listening party invites, merch hangtags, merch graphics, vinyl inserts & custom rollout assets.',
    deliverables: ['Listening Party Flyers & Passes', 'Tracklist & Credit Sheets', 'Merch & Vinyl Packaging'],
    defaultFormats: ['PDF', 'PNG', 'PSD', 'ZIP'],
    turnaroundHint: '4–6 business days',
  },
];

export const BRAND_BUSINESS_CREATIVE_SERVICES: CreativeServiceOption[] = [
  {
    id: 'svc-brand-identity-suite',
    title: 'Brand Identity Development',
    category: 'Brand Identity',
    subtitle: 'Logo systems, monograms, typography & color tokens, and comprehensive brand guidelines.',
    deliverables: ['Vector Logo Suite (SVG/PDF)', 'Brand Guidelines Manual', 'Stationery & Email Signatures', 'Brand Presentation Deck'],
    defaultFormats: ['SVG', 'PDF', 'PNG', 'PSD'],
    turnaroundHint: '5–10 business days',
  },
  {
    id: 'svc-social-media-design',
    title: 'Social Media Design',
    category: 'Social Media Designs',
    subtitle: 'Cohesive Instagram packs, promotional posts, story sequences, testimonials & offer graphics.',
    deliverables: ['Carousel & Post Templates (4:5)', 'Story Announcements (9:16)', 'Testimonial & Offer Cards'],
    defaultFormats: ['PNG', 'JPG', 'PSD', 'ZIP'],
    turnaroundHint: '3–5 business days',
  },
  {
    id: 'svc-business-document-design',
    title: 'Business Document Design',
    category: 'Business Cards',
    subtitle: 'Commercial proposals, quotations, invoices, receipts, business reports & client onboarding docs.',
    deliverables: ['Proposal & Quotation Suite', 'Invoice & Receipt Layouts', 'Business Card & Letterhead', 'Onboarding Packet PDF'],
    defaultFormats: ['PDF', 'SVG', 'PSD', 'ZIP'],
    turnaroundHint: '3–5 business days',
  },
  {
    id: 'svc-presentation-design',
    title: 'Presentation Design',
    category: 'Other Creative Work',
    subtitle: 'Investor pitch decks, executive keynote presentations, and sales credential slide systems.',
    deliverables: ['16:9 Master Pitch Deck (PDF)', 'Keynote / Executive Slide Masters', 'Data Chart & Icon Kit'],
    defaultFormats: ['PDF', 'PNG', 'ZIP'],
    turnaroundHint: '4–7 business days',
  },
  {
    id: 'svc-company-profile-design',
    title: 'Company Profile Design',
    category: 'Other Creative Work',
    subtitle: 'Bespoke corporate company profiles, capability statements, annual reports & print brochures.',
    deliverables: ['Multi-Page Company Profile PDF', 'Tri-Fold & Bi-Fold Brochures', 'Print-Ready & Web Compressed PDFs'],
    defaultFormats: ['PDF', 'PSD', 'ZIP'],
    turnaroundHint: '4–7 business days',
  },
  {
    id: 'svc-marketing-creative-production',
    title: 'Marketing Creative Production',
    category: 'Flyers & Posters',
    subtitle: 'Campaign flyers, launch posters, web & outdoor banners, product catalogues & digital ads.',
    deliverables: ['Product Catalogue PDF', 'Event Flyers & Posters', 'Paid Social & Web Banners'],
    defaultFormats: ['PNG', 'JPG', 'PDF', 'PSD'],
    turnaroundHint: '3–5 business days',
  },
];

const ARTIST_EXCLUDED_CATEGORIES = new Set<string>(['Business Cards', 'Brand Identity']);
const BRAND_EXCLUDED_CATEGORIES = new Set<string>(['Music Cover Artwork', 'Artist Promotional Graphics']);

export function getRequestCategoriesForExperience(isArtist: boolean): string[] {
  const excluded = isArtist ? ARTIST_EXCLUDED_CATEGORIES : BRAND_EXCLUDED_CATEGORIES;
  const preferred = defaultCategoryForAudience(isArtist);
  const filtered = UNIFIED_PRODUCTION_CATEGORIES.filter(category => !excluded.has(category));
  return [preferred, ...filtered.filter(category => category !== preferred)];
}

export function resolveClientExperience(
  accountType?: ClientProfile['accountType'] | string | null,
  workspaceType?: Workspace['type'] | string | null,
  overrideMode?: ClientOSMode | null,
): ClientExperienceConfig {
  const inspection = inspectAccountType(accountType, workspaceType);
  const isArtist = overrideMode ? overrideMode === 'artist' : inspection.canonicalType === 'Artist';
  const osMode: ClientOSMode = isArtist ? 'artist' : 'brand';

  const sharedGroup: ClientNavGroup = {
    group: 'Workspace',
    items: [
      { id: 'overview', title: 'Overview', description: 'Workspace summary, active work, and quick actions.' },
      {
        id: 'creative-hub',
        title: isArtist ? 'Artist Creative Hub' : 'Brand Creative Hub',
        description: isArtist
          ? 'Streaming packs, release promo kits, press materials, downloads, and custom creative services.'
          : 'Brand identity packs, social kits, business document systems, downloads, and custom creative services.',
      },
      { id: 'projects', title: 'Active Projects', description: 'Production stages, milestones, and shared project tasks.' },
      { id: 'requests', title: 'Creative Requests', description: 'Submit new creative briefs and respond to clarifications.' },
      { id: 'deliverables', title: 'Deliverables', description: 'Review published outputs, download finals, or request revisions.' },
      { id: 'updates', title: 'Updates & Activity', description: 'Chronological production timeline and revision responses.' },
    ],
  };

  const osGroup: ClientNavGroup = isArtist
    ? {
        group: 'Artist OS',
        items: [
          { id: 'artist-profile', title: 'Artist Profile', description: 'Artist identity, biography, genre, booking contact, and channels.' },
          { id: 'releases', title: 'Music & Releases', description: 'Singles, EPs, albums, release metadata, readiness checklist, and artwork.' },
          { id: 'content', title: 'Content Engine', description: 'Release copy, lyrics, scheduled posts, and rollout messaging.' },
          { id: 'studio', title: 'Artist Studio', description: 'Instant creative pack studio, EPK & split sheet tools, and studio briefs.' },
          { id: 'documents', title: 'Artist Documents', description: 'Split sheets, EPKs, tracklist credits, release checklists & templates.' },
          { id: 'assets', title: 'Asset Library', description: 'Cover art, visualizers, photography, EPK files, and approved finals.' },
        ],
      }
    : {
        group: 'Brand OS',
        items: [
          { id: 'brand', title: 'Brand Identity', description: 'Logo lockups, color tokens, typography, and creative guidelines.' },
          { id: 'content', title: 'Content Studio', description: 'Brand copy, social visuals, product content, and launch scheduling.' },
          { id: 'studio', title: 'Brand Studio', description: 'Brand kit studio, print collateral builders, and custom studio briefs.' },
          { id: 'documents', title: 'Brand & Business Docs', description: 'Brand dossiers, letters, business cards, IDs & email signatures.' },
          { id: 'assets', title: 'Asset Library', description: 'Logos, brand graphics, product shots, packaging, and approved finals.' },
        ],
      };

  const billingGroup: ClientNavGroup = {
    group: 'Billing & Agreements',
    items: [
      { id: 'invoices', title: 'Invoices & Receipts', description: 'Read-only billing statements, balances, and payment receipts.' },
      { id: 'proposals', title: 'Proposals & Quotes', description: 'Review commercial scopes, approve pricing, or request revisions.' },
    ],
  };

  const accountGroup: ClientNavGroup = {
    group: 'Account',
    items: [
      { id: 'account', title: 'Account Profile & Settings', description: 'Personal login identity, display name, and avatar.' },
    ],
  };

  return {
    osMode,
    osTitle: osMode === 'artist' ? 'Artist OS' : 'Brand OS',
    osSubtitle:
      osMode === 'artist'
        ? 'Your streaming creative packs, music releases, artist identity, and studio deliverables in one workspace.'
        : 'Your brand creative hub, identity packs, campaign deliverables, and production briefs in one workspace.',
    isArtist,
    isBrandOrCompany: !isArtist,
    isOverride: Boolean(overrideMode && overrideMode !== inspection.canonicalType.toLowerCase()),
    ...(inspection.warning ? { accountTypeWarning: inspection.warning } : {}),
    navGroups: [sharedGroup, osGroup, billingGroup, accountGroup],
  };
}

export function buildReleaseProductionPrefill(
  release: {
    id?: string;
    title: string;
    type: string;
    releaseDate?: string;
    trackList?: string;
    featuredArtists?: string;
    producer?: string;
    songwriters?: string;
    rightsInfo?: string;
    streamingUrl?: string;
    preSaveUrl?: string;
    isrc?: string;
    upc?: string;
  },
  workspace: Pick<Workspace, 'name'>,
): ProductionRequestPrefill {
  const title = `${release.title} — ${release.type} Production Package`.slice(0, 160);
  const dueDate = release.releaseDate && isValidCalendarDate(release.releaseDate) ? release.releaseDate : '';
  const description = [
    `Creative production request for ${workspace.name}'s ${release.type.toLowerCase()} "${release.title}".`,
    release.releaseDate ? `Target release date: ${release.releaseDate}.` : '',
    release.featuredArtists ? `Featured artists: ${release.featuredArtists}.` : '',
    release.trackList ? `Track / credit notes:\n${release.trackList.slice(0, 800)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 2000);

  const requirements = [
    'Cover artwork & release visual assets aligned with artist profile.',
    release.producer ? `Producer: ${release.producer}` : '',
    release.songwriters ? `Songwriters: ${release.songwriters}` : '',
    release.isrc ? `ISRC: ${release.isrc}` : '',
    release.upc ? `UPC: ${release.upc}` : '',
    release.rightsInfo ? `Rights: ${release.rightsInfo}` : '',
  ]
    .filter(Boolean)
    .join('\n')
    .slice(0, 1000);

  const references = [release.streamingUrl, release.preSaveUrl].filter(Boolean).join('\n').slice(0, 1000);

  return {
    title,
    category: 'Music Cover Artwork',
    description,
    requirements,
    references,
    dueDate,
    intendedUse: `${release.type} release campaign across streaming & social channels`,
    targetPlatforms: ['Spotify', 'Apple Music', 'YouTube Music', 'Instagram / TikTok'],
    requiredDeliverables: ['3000×3000 Release Cover', 'Streaming Platform Headers', 'Release Promo Story & Square'],
    linkedReleaseId: release.id,
    linkedReleaseTitle: release.title,
  };
}

export function buildBrandProductionPrefill(
  workspace: Pick<Workspace, 'name' | 'brand'>,
  brandProfile?: Partial<BrandWorkspaceProfile>,
  options?: { category?: string; titleSuffix?: string },
): ProductionRequestPrefill {
  const displayFont = workspace.brand?.typography?.displayFont || 'Plus Jakarta Sans';
  const bodyFont = workspace.brand?.typography?.bodyFont || 'Plus Jakarta Sans';
  const category = options?.category || 'Brand Identity';
  const suffix = options?.titleSuffix || 'Brand Creative Production';
  return {
    title: `${workspace.name} — ${suffix}`.slice(0, 160),
    category,
    description: [
      `Brand creative production request for ${workspace.name} (${category}).`,
      brandProfile?.description ? `Brand overview: ${brandProfile.description}` : '',
      brandProfile?.brandVoice ? `Brand voice: ${brandProfile.brandVoice}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 2000),
    requirements: [
      `Primary color: ${workspace.brand?.primaryColor || '#FF1E1E'} | Accent: ${workspace.brand?.accentColor || '#FF1E1E'} | Secondary: ${workspace.brand?.secondaryColor || '#0A0A0A'}`,
      `Typography: ${displayFont} (Display) / ${bodyFont} (Body)`,
      brandProfile?.usageGuidelines ? `Usage guidelines: ${brandProfile.usageGuidelines}` : '',
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, 1000),
    references: [brandProfile?.website, brandProfile?.creativeReferences].filter(Boolean).join('\n').slice(0, 1000),
    dueDate: '',
    intendedUse: `${category} rollout for ${workspace.name}`,
    targetPlatforms: category === 'Business Cards' ? ['Print / CMYK (300 DPI)', 'Digital PDF'] : ['Web & Social', 'Print & PDF'],
    requiredDeliverables: ['Print/Web Finals (PNG, PDF)', 'Editable Source Files (PSD / SVG)'],
  };
}

export function buildProductRequestPrefill(params: {
  product: {
    id: string;
    title: string;
    category: string;
    subcategory?: string;
    linkedServiceCategory: string;
    supportedFormats: string[];
    deliverablesSummary: string[];
  };
  workspaceName: string;
}): ProductionRequestPrefill {
  const { product, workspaceName } = params;
  return {
    title: `${workspaceName} — Custom ${product.title}`.slice(0, 160),
    category: product.linkedServiceCategory || 'Other Creative Work',
    description: `Requesting a customized production version of "${product.title}" (${product.category}${product.subcategory ? ` / ${product.subcategory}` : ''}) tailored for ${workspaceName}.`,
    requirements: [
      product.deliverablesSummary.length > 0 ? `Requested pack scope:\n- ${product.deliverablesSummary.join('\n- ')}` : '',
      product.supportedFormats.length > 0 ? `Preferred formats: ${product.supportedFormats.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 1000),
    intendedUse: `${product.category} customization`,
    targetPlatforms: [],
    requiredDeliverables: product.deliverablesSummary.slice(0, 6),
    packagingSpec: product.supportedFormats.join(', '),
    linkedProductId: product.id,
    linkedProductTitle: product.title,
  };
}

export function formatDynamicRequestBrief(params: {
  workspaceName: string;
  workspaceType: string;
  category: string;
  description: string;
  requirements?: string;
  references?: string;
  intendedUse?: string;
  targetPlatforms?: string[];
  requiredDeliverables?: string[];
  packagingSpec?: string;
  linkedProductTitle?: string;
  linkedReleaseTitle?: string;
}): string {
  const lines = [
    `Workspace: ${params.workspaceName}`,
    `Workspace type: ${params.workspaceType}`,
    `Requested service: ${params.category}`,
    params.linkedProductTitle ? `Referenced Creative Hub product: ${params.linkedProductTitle}` : '',
    params.linkedReleaseTitle ? `Linked release: ${params.linkedReleaseTitle}` : '',
    params.intendedUse?.trim() ? `Intended use / campaign goal: ${params.intendedUse.trim()}` : '',
    params.targetPlatforms && params.targetPlatforms.length > 0
      ? `Target platforms & dimensions: ${params.targetPlatforms.join(', ')}`
      : '',
    params.requiredDeliverables && params.requiredDeliverables.length > 0
      ? `Requested deliverables:\n- ${params.requiredDeliverables.join('\n- ')}`
      : '',
    params.packagingSpec?.trim() ? `Packaging / file formats: ${params.packagingSpec.trim()}` : '',
    '',
    params.description.trim(),
    params.requirements?.trim() ? `\nSpecifications & requirements:\n${params.requirements.trim()}` : '',
    params.references?.trim() ? `\nReferences & links:\n${params.references.trim()}` : '',
  ];

  return lines.filter(line => line !== '').join('\n').slice(0, 5000);
}

export function validatePersonalAccountUpdate(displayName: string, photoURL?: string): {
  displayName: string;
  photoURL: string;
} {
  const cleanName = displayName.trim();
  if (!cleanName || cleanName.length > 100) {
    throw new Error('Display name must be between 1 and 100 characters.');
  }
  const cleanPhoto = (photoURL || '').trim();
  if (cleanPhoto.length > 2048) {
    throw new Error('Avatar URL must be 2048 characters or fewer.');
  }
  return { displayName: cleanName, photoURL: cleanPhoto };
}

export interface ProfileCompletenessResult {
  score: number;
  completedCount: number;
  totalCount: number;
  missingFields: string[];
}

export function computeArtistProfileCompleteness(
  workspace: Pick<Workspace, 'name' | 'contactEmail'> & { artistProfile?: Partial<ArtistWorkspaceProfile> },
): ProfileCompletenessResult {
  const ap = workspace.artistProfile;
  const checks: Array<{ label: string; ok: boolean }> = [
    { label: 'Artist / stage name', ok: Boolean(workspace.name?.trim()) },
    { label: 'Primary genre', ok: Boolean(ap?.genre?.trim()) },
    { label: 'Artist biography', ok: Boolean(ap?.biography?.trim() && ap.biography.trim().length >= 20) },
    { label: 'Artist profile image', ok: Boolean(ap?.profileImageUrl?.trim() || ap?.profileImagePath?.trim()) },
    {
      label: 'Streaming or social link',
      ok: Boolean(ap?.spotify?.trim() || ap?.appleMusic?.trim() || ap?.youtube?.trim() || ap?.instagram?.trim() || ap?.website?.trim()),
    },
    { label: 'Location or booking contact', ok: Boolean(ap?.location?.trim() || ap?.bookingContact?.trim() || ap?.contactEmail?.trim() || workspace.contactEmail?.trim()) },
  ];
  const completedCount = checks.filter(c => c.ok).length;
  const totalCount = checks.length;
  return {
    score: Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    missingFields: checks.filter(c => !c.ok).map(c => c.label),
  };
}

export function computeBrandProfileCompleteness(
  workspace: Pick<Workspace, 'name' | 'description' | 'contactEmail' | 'brand'> & {
    brandProfile?: Partial<BrandWorkspaceProfile>;
  },
): ProfileCompletenessResult {
  const bp = workspace.brandProfile;
  const checks: Array<{ label: string; ok: boolean }> = [
    { label: 'Brand name', ok: Boolean(workspace.name?.trim()) },
    { label: 'Business category / industry', ok: Boolean(bp?.businessCategory?.trim() || bp?.industry?.trim()) },
    { label: 'Brand overview description', ok: Boolean(bp?.description?.trim() || workspace.description?.trim()) },
    { label: 'Brand logo', ok: Boolean(bp?.logoUrl?.trim() || bp?.logoPath?.trim() || workspace.brand?.logoUrl?.trim()) },
    {
      label: 'Color palette tokens',
      ok: Boolean(workspace.brand?.primaryColor && /^#[0-9a-fA-F]{6}$/.test(workspace.brand.primaryColor)),
    },
    {
      label: 'Typography pairing',
      ok: Boolean(workspace.brand?.typography?.displayFont?.trim() || workspace.brand?.typography?.bodyFont?.trim()),
    },
    {
      label: 'Brand voice & usage guidelines',
      ok: Boolean(bp?.brandVoice?.trim() || bp?.usageGuidelines?.trim()),
    },
    {
      label: 'Website or contact details',
      ok: Boolean(bp?.website?.trim() || bp?.contactEmail?.trim() || workspace.contactEmail?.trim()),
    },
  ];
  const completedCount = checks.filter(c => c.ok).length;
  const totalCount = checks.length;
  return {
    score: Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    missingFields: checks.filter(c => !c.ok).map(c => c.label),
  };
}

export interface ReleaseReadinessSummary {
  completed: number;
  total: number;
  percent: number;
  warnings: string[];
}

export function evaluateReleaseReadiness(release: {
  releaseDate?: string;
  artworkUrl?: string;
  artworkPath?: string;
  trackList?: string;
  isrc?: string;
  upc?: string;
  checklist?: Partial<Record<'audioMastered' | 'artworkApproved' | 'splitSheetSigned' | 'metadataVerified' | 'distributionSubmitted' | 'pressKitReady' | 'marketingAssetsReady', boolean>>;
}): ReleaseReadinessSummary {
  const keys: Array<'audioMastered' | 'artworkApproved' | 'splitSheetSigned' | 'metadataVerified' | 'distributionSubmitted' | 'pressKitReady' | 'marketingAssetsReady'> = [
    'audioMastered',
    'artworkApproved',
    'splitSheetSigned',
    'metadataVerified',
    'distributionSubmitted',
    'pressKitReady',
    'marketingAssetsReady',
  ];
  const completed = keys.filter(k => Boolean(release.checklist?.[k])).length;
  const warnings: string[] = [];
  if (!release.artworkUrl && !release.artworkPath) warnings.push('Cover artwork missing (3000×3000 recommended)');
  if (!release.releaseDate) warnings.push('Target release date not set');
  if (!release.isrc && !release.upc) warnings.push('ISRC / UPC codes not recorded');
  if (!release.trackList?.trim()) warnings.push('Tracklist or credits missing');
  return {
    completed,
    total: keys.length,
    percent: Math.round((completed / keys.length) * 100),
    warnings,
  };
}

export interface WorkspaceSearchResult {
  id: string;
  kind: 'Project' | 'Release' | 'Content' | 'Asset' | 'Document' | 'Invoice' | 'Proposal' | 'Creative Hub';
  title: string;
  subtitle: string;
  targetTab: ClientTab;
}

export function buildWorkspaceSearchResults(params: {
  queryText: string;
  isArtist: boolean;
  projects?: Array<Pick<ClientProject, 'id' | 'title' | 'category' | 'stage' | 'status'>>;
  releases?: Array<{ id: string; title: string; type: string; status: string; releaseDate?: string }>;
  contentItems?: Array<{ id: string; title: string; kind: string; status: string; phase: string }>;
  assets?: Array<{ id: string; name: string; category: string; fileType?: string }>;
  documents?: Array<{ id: string; title: string; type: string; referenceNo?: string }>;
  invoices?: Array<Pick<InvoiceRecord, 'id' | 'title' | 'referenceNo' | 'status'>>;
  proposals?: Array<Pick<ProposalRecord, 'id' | 'title' | 'referenceNo' | 'status'>>;
  products?: Array<Pick<CreativeProduct, 'id' | 'title' | 'category' | 'resourceType'>>;
  limit?: number;
}): WorkspaceSearchResult[] {
  const q = params.queryText.trim().toLowerCase();
  if (!q) return [];
  const results: WorkspaceSearchResult[] = [];
  const limit = params.limit ?? 24;

  for (const p of params.projects || []) {
    if (`${p.title} ${p.category} ${p.stage || p.status}`.toLowerCase().includes(q)) {
      results.push({
        id: `proj:${p.id}`,
        kind: 'Project',
        title: p.title,
        subtitle: `${p.category} · ${p.stage || p.status}`,
        targetTab: 'projects',
      });
    }
  }
  if (params.isArtist) {
    for (const r of params.releases || []) {
      if (`${r.title} ${r.type} ${r.status}`.toLowerCase().includes(q)) {
        results.push({
          id: `rel:${r.id}`,
          kind: 'Release',
          title: r.title,
          subtitle: `${r.type} · ${r.status}${r.releaseDate ? ` · ${r.releaseDate}` : ''}`,
          targetTab: 'releases',
        });
      }
    }
  }
  for (const c of params.contentItems || []) {
    if (`${c.title} ${c.kind} ${c.phase}`.toLowerCase().includes(q)) {
      results.push({
        id: `cnt:${c.id}`,
        kind: 'Content',
        title: c.title,
        subtitle: `${c.kind} · ${c.status}`,
        targetTab: 'content',
      });
    }
  }
  for (const a of params.assets || []) {
    if (`${a.name} ${a.category} ${a.fileType || ''}`.toLowerCase().includes(q)) {
      results.push({
        id: `ast:${a.id}`,
        kind: 'Asset',
        title: a.name,
        subtitle: `${a.category}${a.fileType ? ` · ${a.fileType}` : ''}`,
        targetTab: 'assets',
      });
    }
  }
  for (const d of params.documents || []) {
    if (`${d.title} ${d.type} ${d.referenceNo || ''}`.toLowerCase().includes(q)) {
      results.push({
        id: `doc:${d.id}`,
        kind: 'Document',
        title: d.title,
        subtitle: `${d.referenceNo || d.type}`,
        targetTab: 'documents',
      });
    }
  }
  for (const inv of params.invoices || []) {
    if (`${inv.title} ${inv.referenceNo} ${inv.status}`.toLowerCase().includes(q)) {
      results.push({
        id: `inv:${inv.id}`,
        kind: 'Invoice',
        title: inv.title,
        subtitle: `${inv.referenceNo} · ${inv.status}`,
        targetTab: 'invoices',
      });
    }
  }
  for (const prop of params.proposals || []) {
    if (`${prop.title} ${prop.referenceNo} ${prop.status}`.toLowerCase().includes(q)) {
      results.push({
        id: `prop:${prop.id}`,
        kind: 'Proposal',
        title: prop.title,
        subtitle: `${prop.referenceNo} · ${prop.status}`,
        targetTab: 'proposals',
      });
    }
  }
  for (const prod of params.products || []) {
    if (`${prod.title} ${prod.category} ${prod.resourceType || ''}`.toLowerCase().includes(q)) {
      results.push({
        id: `hub:${prod.id}`,
        kind: 'Creative Hub',
        title: prod.title,
        subtitle: `${prod.category}${prod.resourceType ? ` · ${prod.resourceType}` : ''}`,
        targetTab: 'creative-hub',
      });
    }
  }

  return results.slice(0, limit);
}

export interface UnifiedActivityEntry {
  id: string;
  source: 'Production' | 'Revision' | 'Release' | 'Content' | 'Asset' | 'Invoice' | 'Proposal';
  title: string;
  detail: string;
  timestamp: string;
  targetTab: ClientTab;
}

export function buildUnifiedWorkspaceActivity(params: {
  isArtist: boolean;
  activities?: ProductionActivity[];
  revisions?: ProductionRevisionRequest[];
  releases?: Array<{ id: string; title: string; status: string; createdAt?: string }>;
  contentItems?: Array<{ id: string; title: string; kind: string; status: string; updatedAt?: string }>;
  assets?: Array<{ id: string; name: string; category: string; uploadedAt?: string }>;
  invoices?: Array<Pick<InvoiceRecord, 'id' | 'title' | 'referenceNo' | 'status' | 'updatedAt' | 'createdAt'>>;
  proposals?: Array<Pick<ProposalRecord, 'id' | 'title' | 'referenceNo' | 'status' | 'updatedAt' | 'createdAt'>>;
  limit?: number;
}): UnifiedActivityEntry[] {
  const entries: UnifiedActivityEntry[] = [];

  for (const act of params.activities || []) {
    if (!act.createdAt) continue;
    entries.push({
      id: `act:${act.id}`,
      source: 'Production',
      title: act.action,
      detail: act.details,
      timestamp: act.createdAt,
      targetTab: 'updates',
    });
  }
  for (const rev of params.revisions || []) {
    const ts = rev.updatedAt || rev.submittedAt;
    if (!ts) continue;
    entries.push({
      id: `rev:${rev.id}`,
      source: 'Revision',
      title: `Revision · ${rev.status}`,
      detail: rev.adminResponse || rev.feedback,
      timestamp: ts,
      targetTab: 'deliverables',
    });
  }
  if (params.isArtist) {
    for (const rel of params.releases || []) {
      if (!rel.createdAt) continue;
      entries.push({
        id: `rel:${rel.id}`,
        source: 'Release',
        title: `Release · ${rel.title}`,
        detail: `Status: ${rel.status}`,
        timestamp: rel.createdAt,
        targetTab: 'releases',
      });
    }
  }
  for (const cnt of params.contentItems || []) {
    if (!cnt.updatedAt) continue;
    entries.push({
      id: `cnt:${cnt.id}`,
      source: 'Content',
      title: cnt.title,
      detail: `${cnt.kind} · ${cnt.status}`,
      timestamp: cnt.updatedAt,
      targetTab: 'content',
    });
  }
  for (const ast of params.assets || []) {
    if (!ast.uploadedAt) continue;
    entries.push({
      id: `ast:${ast.id}`,
      source: 'Asset',
      title: ast.name,
      detail: `Added to Asset Library · ${ast.category}`,
      timestamp: ast.uploadedAt,
      targetTab: 'assets',
    });
  }
  for (const inv of params.invoices || []) {
    const ts = inv.updatedAt || inv.createdAt;
    if (!ts) continue;
    entries.push({
      id: `inv:${inv.id}`,
      source: 'Invoice',
      title: `Invoice ${inv.referenceNo} · ${inv.status}`,
      detail: inv.title,
      timestamp: ts,
      targetTab: 'invoices',
    });
  }
  for (const prop of params.proposals || []) {
    const ts = prop.updatedAt || prop.createdAt;
    if (!ts) continue;
    entries.push({
      id: `prop:${prop.id}`,
      source: 'Proposal',
      title: `Proposal ${prop.referenceNo} · ${prop.status}`,
      detail: prop.title,
      timestamp: ts,
      targetTab: 'proposals',
    });
  }

  return entries
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    .slice(0, params.limit ?? 16);
}
