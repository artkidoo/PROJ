import type { BrandWorkspaceProfile, ClientProfile, Workspace } from '../types';
import type { AspectRatioType, CanvasDesign } from '../types/designStudio';
import {
  defaultCategoryForAudience,
  isValidCalendarDate,
  UNIFIED_PRODUCTION_CATEGORIES,
} from './productionCategories';

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
  | 'projects'
  | 'requests'
  | 'deliverables'
  | 'updates'
  | 'account'
  | ClientStudioSection;

export type ClientOSMode = 'artist' | 'brand' | 'company';

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
  navGroups: ClientNavGroup[];
}

export interface ProductionRequestPrefill {
  title: string;
  category: string;
  description: string;
  requirements?: string;
  references?: string;
  dueDate?: string;
}

const ARTIST_EXCLUDED_CATEGORIES = new Set<string>(['Business Cards', 'Brand Identity']);
const BRAND_EXCLUDED_CATEGORIES = new Set<string>(['Music Cover Artwork', 'Artist Promotional Graphics']);

export function getRequestCategoriesForExperience(isArtist: boolean): string[] {
  const excluded = isArtist ? ARTIST_EXCLUDED_CATEGORIES : BRAND_EXCLUDED_CATEGORIES;
  const preferred = defaultCategoryForAudience(isArtist);
  const filtered = UNIFIED_PRODUCTION_CATEGORIES.filter(category => !excluded.has(category));
  return [preferred, ...filtered.filter(category => category !== preferred)];
}

export function resolveClientExperience(
  accountType?: ClientProfile['accountType'] | string,
  workspaceType?: Workspace['type'],
): ClientExperienceConfig {
  const normalized = (accountType || '').trim();
  const isArtist =
    normalized === 'Artist' ||
    (!normalized && (workspaceType === 'Artist' || workspaceType === 'Personal'));
  const isCompany = normalized === 'Company' || (!normalized && workspaceType === 'Business');
  const osMode: ClientOSMode = isArtist ? 'artist' : isCompany ? 'company' : 'brand';

  const sharedGroup: ClientNavGroup = {
    group: 'Workspace',
    items: [
      { id: 'overview', title: 'Overview', description: 'Workspace summary, active work, and quick actions.' },
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
          { id: 'content', title: 'Content Engine', description: 'Release copy, lyrics, social posts, and design canvas.' },
          { id: 'assets', title: 'Asset Library', description: 'Approved cover art, photography, visualizers, and downloads.' },
        ],
      }
    : {
        group: osMode === 'company' ? 'Business OS' : 'Brand OS',
        items: [
          { id: 'brand', title: 'Brand Identity', description: 'Logo lockups, color palette, typography, and brand rules.' },
          { id: 'content', title: 'Creative System', description: 'Marketing visuals, messaging, and design canvas graphics.' },
          { id: 'documents', title: 'Business Documents', description: 'Proposals, commercial invoices, and corporate documents.' },
          { id: 'assets', title: 'Asset Library', description: 'Approved logos, brand graphics, photography, and downloads.' },
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
    osTitle: osMode === 'artist' ? 'Artist OS' : osMode === 'company' ? 'Business OS' : 'Brand OS',
    osSubtitle:
      osMode === 'artist'
        ? 'Your music releases, artist identity, content engine, and production deliverables in one workspace.'
        : osMode === 'company'
          ? 'Your brand identity, business documents, creative assets, and active production in one workspace.'
          : 'Your brand identity, creative system, commercial documents, and production deliverables in one workspace.',
    isArtist,
    isBrandOrCompany: !isArtist,
    navGroups: [sharedGroup, osGroup, accountGroup],
  };
}

export function buildReleaseProductionPrefill(
  release: {
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
  };
}

export function buildClientCanvasDesign(params: {
  workspace: Workspace;
  isArtist: boolean;
  title?: string;
  subtitle?: string;
  aspectRatio?: AspectRatioType;
  linkedReleaseId?: string;
}): CanvasDesign {
  const { workspace, isArtist, title, subtitle, aspectRatio = '1:1 Square' } = params;
  const primary = /^#[0-9a-fA-F]{6}$/.test(workspace.brand?.primaryColor || '')
    ? workspace.brand.primaryColor
    : '#FF1E1E';
  const secondary = /^#[0-9a-fA-F]{6}$/.test(workspace.brand?.secondaryColor || '')
    ? workspace.brand.secondaryColor
    : '#0A0A0A';
  const now = new Date().toISOString();
  const width =
    aspectRatio === '9:16 Vertical Story'
      ? 1080
      : aspectRatio === '16:9 Landscape'
        ? 1920
        : aspectRatio === '4:5 Portrait'
          ? 1080
          : aspectRatio === 'Print / Poster'
            ? 1414
            : 1200;
  const height =
    aspectRatio === '9:16 Vertical Story'
      ? 1920
      : aspectRatio === '16:9 Landscape'
        ? 1080
        : aspectRatio === '4:5 Portrait'
          ? 1350
          : aspectRatio === 'Print / Poster'
            ? 2000
            : 1200;

  return {
    id: `client-des-${Date.now()}`,
    workspaceId: workspace.id,
    name: (title || (isArtist ? `${workspace.name} Release Graphic` : `${workspace.name} Brand Visual`)).slice(0, 120),
    aspectRatio,
    width,
    height,
    backgroundColor: secondary,
    backgroundTheme: 'charcoal',
    templateFamily: isArtist ? 'Artist Branding' : 'Clean Commercial',
    category: isArtist ? 'Music Release Visual' : 'Brand Creative',
    textureOverlay: isArtist ? 'vignette' : 'none',
    textureOpacity: 0.3,
    createdAt: now,
    updatedAt: now,
    elements: [
      {
        id: 'el-frame-1',
        type: 'shape',
        name: 'Outer Border Frame',
        x: 50,
        y: 50,
        width: 90,
        height: 90,
        rotation: 0,
        opacity: 0.55,
        zIndex: 1,
        visible: true,
        shapeType: 'frame',
        borderColor: primary,
        borderWidth: 2,
      },
      {
        id: 'el-eyebrow-1',
        type: 'text',
        name: 'Workspace Eyebrow',
        x: 50,
        y: 22,
        rotation: 0,
        opacity: 0.85,
        zIndex: 2,
        visible: true,
        text: workspace.name.toUpperCase(),
        fontFamily: 'mono',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 4,
        color: primary,
        textTransform: 'uppercase',
      },
      {
        id: 'el-headline-1',
        type: 'text',
        name: 'Primary Headline',
        x: 50,
        y: 48,
        rotation: 0,
        opacity: 1,
        zIndex: 3,
        visible: true,
        text: (title || (isArtist ? 'NEW RELEASE' : 'BRAND STATEMENT')).toUpperCase(),
        fontFamily: isArtist ? 'serif' : 'sans',
        fontSize: 48,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 2,
        color: '#FFFFFF',
        textTransform: 'uppercase',
      },
      {
        id: 'el-sub-1',
        type: 'text',
        name: 'Subheadline',
        x: 50,
        y: 74,
        rotation: 0,
        opacity: 0.8,
        zIndex: 4,
        visible: true,
        text: subtitle || workspace.brand?.tagline || (isArtist ? 'OUT ON ALL PLATFORMS' : 'OFFICIAL CREATIVE ASSET'),
        fontFamily: 'mono',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 3,
        color: '#D4D4D4',
      },
    ],
  };
}

export function buildClientWorkspaceCanvasAssetMetadata(params: {
  workspaceId: string;
  assetId: string;
  name: string;
  storagePath: string;
  fileSizeBytes: number;
  uid: string;
  category?: string;
  releaseId?: string;
  projectId?: string;
  description?: string;
}) {
  const sizeLabel =
    params.fileSizeBytes < 1024 * 1024
      ? `${Math.max(1, Math.round(params.fileSizeBytes / 1024))} KB`
      : `${(params.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  return {
    id: params.assetId,
    workspaceId: params.workspaceId,
    name: params.name.trim().slice(0, 120) || 'Canvas Graphic',
    category: params.category || 'Promotional',
    mimeType: 'image/png',
    fileType: 'PNG' as const,
    fileSize: sizeLabel,
    fileSizeBytes: params.fileSizeBytes,
    storagePath: params.storagePath,
    version: '1.0',
    status: 'Draft' as const,
    dimensions: '',
    usageRules: 'Created in KeedoHub Design Canvas.',
    isVector: false,
    releaseId: params.releaseId || '',
    projectId: params.projectId || '',
    description: params.description || 'Rendered graphic saved from workspace Design Canvas.',
    isInternal: false,
    uploadedAt: new Date().toISOString(),
    uploadedBy: params.uid,
  };
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
