import type { BrandWorkspaceProfile, ClientProfile, Workspace } from '../types';
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
  | 'projects'
  | 'requests'
  | 'deliverables'
  | 'updates'
  | 'account'
  | ClientStudioSection;

export type ClientOSMode = 'artist' | 'brand';

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
): ClientExperienceConfig {
  const inspection = inspectAccountType(accountType, workspaceType);
  const isArtist = inspection.canonicalType === 'Artist';
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
          { id: 'artist-profile', title: 'Artist Profile', description: 'Public artist biography, genre, and streaming links.' },
          { id: 'releases', title: 'Music & Releases', description: 'Singles, EPs, albums, release metadata, and artwork.' },
          { id: 'content', title: 'Content Engine', description: 'Release copy, lyrics, social posts, and rollout messaging.' },
          { id: 'documents', title: 'Artist Documents', description: 'Split sheets, EPKs, tracklist credits, release checklists & templates.' },
          { id: 'assets', title: 'Asset Library', description: 'Approved cover art, photography, visualizers, and downloads.' },
        ],
      }
    : {
        group: 'Brand OS',
        items: [
          { id: 'brand', title: 'Brand Identity', description: 'Logo lockups, color palette, typography, and brand rules.' },
          { id: 'content', title: 'Creative System', description: 'Marketing messaging, campaign copy, and brand visuals.' },
          { id: 'documents', title: 'Brand & Business Docs', description: 'Brand dossiers, letters, business cards, IDs & email signatures.' },
          { id: 'assets', title: 'Asset Library', description: 'Approved logos, brand graphics, photography, and downloads.' },
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
