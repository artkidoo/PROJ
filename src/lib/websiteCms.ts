/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website CMS, Dynamic Journal, Media Library & Firestore Sync Engine
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { db, storage } from './firebase';
import type {
  CmsMediaAsset,
  CmsMediaFolder,
  FooterNavColumn,
  HomepageCmsConfig,
  HomepageSectionId,
  JournalArticle,
  JournalArticleStatus,
  JournalInlineImage,
  PublicPageCmsConfig,
  PublicPageId,
  SiteNavigationConfig,
  SiteNavItem,
  SiteSettingsCmsConfig,
} from '../types/cms';
import {
  BLOG_POSTS,
  STUDIO_MEDIA,
} from '../data/publicContent';
import {
  keedohubLogoLightBg,
  keedohubLogoTransparent,
  keedohubMarkLightBg,
  keedohubMarkTransparent,
} from '../components/brand/KeedohubLogo';

// ============================================================================
// 1. DEFAULT DATA HYDRATION
// ============================================================================

export const DEFAULT_HOMEPAGE_CMS: HomepageCmsConfig = {
  id: 'homepage',
  heroKicker: 'KeedoHub · Creative Agency & Production OS',
  heroHeadline: 'A Creative Ecosystem. A Creative Operations Platform.',
  heroSubheadline:
    'KeedoHub combines senior creative production—brand identity, music artwork, motion systems, and executive collateral—with structured studio operations from brief intake and internal QA to final workspace handover.',
  heroPrimaryCtaLabel: 'Explore Ecosystem',
  heroPrimaryCtaTarget: '#ecosystem',
  heroSecondaryCtaLabel: 'Create Client Workspace',
  heroSecondaryCtaTarget: 'register',
  heroTertiaryCtaLabel: 'Submit Project Brief',
  heroTertiaryCtaTarget: 'contact',
  heroBackgroundImageUrl: STUDIO_MEDIA.lyricalStudioHero,
  heroVisualLeftLabel: 'Studio Craft',
  heroVisualLeftTitle: 'Direction & Production',
  heroVisualLeftImageUrl: STUDIO_MEDIA.creativeDirectorStudio,
  heroVisualLeftAlt: 'KeedoHub studio creative direction desk with visual proofs',
  heroVisualRightLabel: 'Creative Production',
  heroVisualRightTitle: 'Workstation & Identity Desk',
  heroVisualRightImageUrl: STUDIO_MEDIA.studioWorkstationHero,
  heroVisualRightAlt: 'KeedoHub architectural design workstation displaying bold Swiss typography and brand guidelines',
  ecosystemHeading: 'Built For Artists, Brands, Businesses & Studio Execution.',
  ecosystemDescription:
    'Every participant enters one coherent platform—connecting client creative identity directly to Admin HQ studio workflows without fractured tools or scattered threads.',
  servicesHeading: 'Nine Studio Disciplines Under One Standard.',
  showcaseHeading: 'Visual Worlds & Production Craft.',
  showcaseDescription:
    'Curated studio studies across music packaging, identity architecture, stage motion, and executive collateral. Sample studies are clearly labeled.',
  featuredPortfolioIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
  featuredArtistIds: ['kflow', 'amara-vance'],
  featuredServiceIds: [
    'creative-direction',
    'brand-identity',
    'graphic-design',
    'music-artwork',
    'artist-visual-identity',
    'motion-graphics-animation',
  ],
  featuredJournalSlugs: [
    'designing-a-release-identity-that-travels-beyond-the-cover',
    'from-concept-to-print-why-branded-collateral-defines-authority',
    'architectural-restraint-in-motion-graphics-and-live-stage-design',
    'bridging-studio-craft-with-an-organized-production-system',
  ],
  processHeading: 'From Request to Verified Delivery.',
  processDescription:
    'Every commission moves inside an accountable studio pipeline—separating internal QA drafts from client-published deliverables and tracking every approval and revision by version.',
  studioHeading: 'One Private Workspace. Tailored To Your Role.',
  studioDescription:
    'Each Firebase account owns one unified client workspace shaped automatically around its client type—Artist OS or Brand OS—while staying connected directly to studio production.',
  communityHeading: 'Visual Direction Across Every Tier.',
  journalHeading: 'Perspectives On Craft & Operations.',
  packagesHeading: 'Structured Scopes For Every Engagement.',
  testimonialsHeading: 'Client Trust & Studio Testimonials',
  testimonials: [
    {
      id: 'test-1',
      quote:
        'KeedoHub unified our album release visual language from initial vinyl proofs to 60fps stage graphics without a single dropped asset.',
      author: 'A&R Direction Lead',
      role: 'Creative Director',
      company: 'Indie Sound Group',
    },
    {
      id: 'test-2',
      quote:
        'Having our corporate collateral, contracts, and pitch templates live in the same workspace as our master logo files saved our executive team weeks.',
      author: 'Managing Director',
      role: 'Founding Partner',
      company: 'Obsidian Capital Labs',
    },
    {
      id: 'test-3',
      quote:
        'The separation between internal QA and client review proofs gave our roster artists absolute confidence in every deliverable version.',
      author: 'Operations Head',
      role: 'Label Manager',
      company: 'Global Talent Management',
    },
  ],
  ctaHeading: 'Launch Your Next Release Or Brand Inside One Creative OS.',
  ctaDescription:
    'Submit a creative brief to our studio team or register your Artist or Brand account to enter your private production room right away.',
  ctaPrimaryLabel: 'Submit Project Brief',
  ctaSecondaryLabel: 'Create Account',
  sectionVisibility: {
    ecosystem: true,
    services: true,
    showcase: true,
    process: true,
    studio: true,
    community: true,
    testimonials: true,
    journal: true,
    packages: true,
    cta: true,
  },
  sectionOrder: [
    'ecosystem',
    'services',
    'showcase',
    'process',
    'studio',
    'community',
    'testimonials',
    'journal',
    'packages',
    'cta',
  ],
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

export const DEFAULT_SITE_NAVIGATION: SiteNavigationConfig = {
  id: 'navigation',
  headerItems: [
    { id: 'nav-services', label: 'Services', route: 'services', visible: true, order: 1, location: 'header' },
    { id: 'nav-portfolio', label: 'Portfolio', route: 'portfolio', visible: true, order: 2, location: 'header' },
    { id: 'nav-artists', label: 'Artists', route: 'artists', visible: true, order: 3, location: 'header' },
    { id: 'nav-journal', label: 'Journal', route: 'journal', visible: true, order: 4, location: 'header' },
    { id: 'nav-contact', label: 'Contact', route: 'contact', visible: true, order: 5, location: 'header' },
  ],
  mobileItems: [
    { id: 'mob-home', label: 'Home', route: 'home', visible: true, order: 1, location: 'mobile' },
    { id: 'mob-services', label: 'Services', route: 'services', visible: true, order: 2, location: 'mobile' },
    { id: 'mob-portfolio', label: 'Portfolio', route: 'portfolio', visible: true, order: 3, location: 'mobile' },
    { id: 'mob-artists', label: 'Artists', route: 'artists', visible: true, order: 4, location: 'mobile' },
    { id: 'mob-journal', label: 'Journal', route: 'journal', visible: true, order: 5, location: 'mobile' },
    { id: 'mob-pricing', label: 'Pricing & Scope', route: 'pricing', visible: true, order: 6, location: 'mobile' },
    { id: 'mob-about', label: 'About Agency', route: 'about', visible: true, order: 7, location: 'mobile' },
    { id: 'mob-vision', label: 'Vision & Mission', route: 'vision', visible: true, order: 8, location: 'mobile' },
    { id: 'mob-faq', label: 'FAQ', route: 'faq', visible: true, order: 9, location: 'mobile' },
    { id: 'mob-contact', label: 'Contact Brief', route: 'contact', visible: true, order: 10, location: 'mobile' },
  ],
  footerColumns: [
    {
      id: 'footer_studio',
      title: 'Studio',
      items: [
        { id: 'foot-home', label: 'Home', route: 'home', visible: true, order: 1, location: 'footer_studio' },
        { id: 'foot-about', label: 'About the Agency', route: 'about', visible: true, order: 2, location: 'footer_studio' },
        { id: 'foot-vision', label: 'Vision & Mission', route: 'vision', visible: true, order: 3, location: 'footer_studio' },
        { id: 'foot-services', label: 'Capabilities & Services', route: 'services', visible: true, order: 4, location: 'footer_studio' },
        { id: 'foot-portfolio', label: 'Portfolio Showcase', route: 'portfolio', visible: true, order: 5, location: 'footer_studio' },
      ],
    },
    {
      id: 'footer_ecosystem',
      title: 'Ecosystem',
      items: [
        { id: 'foot-artists', label: 'Artists & Visual Worlds', route: 'artists', visible: true, order: 1, location: 'footer_ecosystem' },
        { id: 'foot-journal', label: 'Studio Journal', route: 'journal', visible: true, order: 2, location: 'footer_ecosystem' },
        { id: 'foot-pricing', label: 'Packages & Scope', route: 'pricing', visible: true, order: 3, location: 'footer_ecosystem' },
        { id: 'foot-faq', label: 'FAQ', route: 'faq', visible: true, order: 4, location: 'footer_ecosystem' },
        { id: 'foot-contact', label: 'Contact & Enquiries', route: 'contact', visible: true, order: 5, location: 'footer_ecosystem' },
      ],
    },
    {
      id: 'footer_os',
      title: 'Creative OS',
      items: [
        { id: 'foot-register', label: 'Create Client Workspace', route: 'register', visible: true, order: 1, location: 'footer_os' },
        { id: 'foot-login', label: 'Client Sign In', route: 'login', visible: true, order: 2, location: 'footer_os' },
        { id: 'foot-forgot', label: 'Reset Password', route: 'forgot-password', visible: true, order: 3, location: 'footer_os' },
        { id: 'foot-admin', label: 'Admin HQ Login', route: 'admin-login', visible: true, order: 4, location: 'footer_os' },
      ],
    },
    {
      id: 'footer_policies',
      title: 'Policies',
      items: [
        { id: 'foot-terms', label: 'Terms & Conditions', route: 'terms', visible: true, order: 1, location: 'footer_policies' },
        { id: 'foot-privacy', label: 'Privacy Policy', route: 'privacy', visible: true, order: 2, location: 'footer_policies' },
        { id: 'foot-refund', label: 'Refund & Revision Policy', route: 'refund', visible: true, order: 3, location: 'footer_policies' },
      ],
    },
  ],
  primaryCtaLabel: 'Start Workspace',
  primaryCtaRoute: 'register',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsCmsConfig = {
  id: 'settings',
  siteName: 'KeedoHub',
  tagline: 'Creative Agency & Production Operating System',
  logoDarkSurfaceUrl: keedohubLogoTransparent,
  logoLightSurfaceUrl: keedohubLogoLightBg,
  markDarkSurfaceUrl: keedohubMarkTransparent,
  markLightSurfaceUrl: keedohubMarkLightBg,
  faviconUrl: '/favicon.svg',
  defaultSeoTitle: 'KeedoHub — Creative Agency & Production Operating System',
  defaultSeoDescription:
    'Multidisciplinary creative studio delivering creative direction, brand identity, music artwork, motion graphics, and unified Artist & Brand production workspaces.',
  defaultOgImageUrl: STUDIO_MEDIA.studioWorkstationHero,
  contactEmail: 'studio@keedohub.com',
  contactPhone: '+44 (0) 20 8123 4567 / +234 1 234 5678',
  studioLocations: 'Lagos · London · Remote Global Studio',
  footerBio:
    'Creative direction, brand identity, music visual worlds, and structured creative production for artists, labels, and modern companies.',
  copyrightText: 'KeedoHub Creative Agency & Production OS. All rights reserved.',
  socialLinks: [
    { id: 'soc-ig', platform: 'Instagram', url: 'https://instagram.com/keedohub' },
    { id: 'soc-x', platform: 'X', url: 'https://x.com/keedohub' },
    { id: 'soc-li', platform: 'LinkedIn', url: 'https://linkedin.com/company/keedohub' },
    { id: 'soc-yt', platform: 'YouTube', url: 'https://youtube.com/@keedohub' },
    { id: 'soc-sp', platform: 'Spotify', url: 'https://open.spotify.com/user/keedohub' },
  ],
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

export const DEFAULT_PUBLIC_PAGES: Record<PublicPageId, PublicPageCmsConfig> = {
  about: {
    id: 'about',
    eyebrow: 'Studio Profile',
    title: 'A Creative Agency Structured Like an Operating System.',
    subtitle: 'About KeedoHub',
    introCopy:
      'KeedoHub brings together creative direction, graphic design, brand identity, music artwork, motion production, and executive collateral under one studio roof—supported by private client workspaces that keep every brief and proof organized.',
    secondaryCopy:
      'We partner with independent and label-backed artists building cohesive release worlds, as well as ambitious brands and companies requiring sharp visual systems and presentation-grade documentation.',
    heroImageUrl: STUDIO_MEDIA.creativeDirectorStudio,
    heroImageAlt: 'KeedoHub studio creative direction desk with print proofs and layout monitor',
    primaryCtaLabel: 'Explore Services',
    secondaryCtaLabel: 'View Portfolio',
    isVisible: true,
    seoTitle: 'About the Agency — KeedoHub',
    seoDescription:
      'Learn about KeedoHub, our multidisciplinary creative studio, operational principles, and private client workspaces.',
    ogImageUrl: STUDIO_MEDIA.creativeDirectorStudio,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  },
  vision: {
    id: 'vision',
    eyebrow: 'Vision & Mission',
    title: 'Where Creative Ambition Meets Production Discipline.',
    subtitle: 'Our Purpose & Commitment',
    introCopy:
      'Our purpose is straightforward: help artists and modern organizations look unmistakable in public while operating cleanly behind the scenes.',
    secondaryCopy:
      'To set the benchmark for independent creative studios—where world-class visual craft and a transparent Creative Operating System work together seamlessly from day one.',
    heroImageUrl: STUDIO_MEDIA.brandIdentitySystem,
    heroImageAlt: 'KeedoHub studio brand architecture swatch and manual showcase',
    primaryCtaLabel: 'See Work in Practice',
    secondaryCtaLabel: 'Discuss a Brief',
    isVisible: true,
    seoTitle: 'Vision & Mission — KeedoHub',
    seoDescription: 'The core values, mission, and long-term vision behind KeedoHub creative operations.',
    ogImageUrl: STUDIO_MEDIA.brandIdentitySystem,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  },
  services: {
    id: 'services',
    eyebrow: 'Creative Services & Capabilities',
    title: 'Nine Disciplines. One Studio Standard.',
    subtitle: 'Full-Spectrum Capabilities',
    introCopy:
      'From creative direction and brand identity systems to music artwork, motion animation, promotional key art, and corporate collateral—every service connects directly into our production workflow.',
    heroImageUrl: STUDIO_MEDIA.motionVisualizerStage,
    heroImageAlt: 'Motion visualizer and stage lighting installation',
    primaryCtaLabel: 'Request Custom Scope',
    isVisible: true,
    seoTitle: 'Creative Services — KeedoHub',
    seoDescription:
      'Explore KeedoHub capabilities in Creative Direction, Brand Identity, Music Artwork, Motion Graphics, and Corporate Collateral.',
    ogImageUrl: STUDIO_MEDIA.motionVisualizerStage,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  },
  portfolio: {
    id: 'portfolio',
    eyebrow: 'Portfolio Archive',
    title: 'Selected Creative Studies & Visual Systems.',
    subtitle: 'Case Studies & Release Concepts',
    introCopy:
      'Explore concept showcases across music packaging, identity architecture, corporate collateral, and kinetic stage design. Studio concept studies are clearly marked; private client deliverables remain confidential inside client workspaces.',
    heroImageUrl: STUDIO_MEDIA.vinylPressMockup,
    heroImageAlt: 'Monochrome vinyl gatefold packaging master',
    primaryCtaLabel: 'Submit Project Brief',
    isVisible: true,
    seoTitle: 'Portfolio Archive — KeedoHub',
    seoDescription:
      'Browse curated creative work across music artwork, brand identity systems, stage visuals, and print collateral.',
    ogImageUrl: STUDIO_MEDIA.vinylPressMockup,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  },
  artists: {
    id: 'artists',
    eyebrow: 'Artists & Visual Worlds',
    title: 'Visual Direction Built Around the Sound.',
    subtitle: 'Artist Identities & Concept Releases',
    introCopy:
      'From album artwork and press portraiture to stage lighting direction, KeedoHub develops distinctive artist visual identities. Studio concept profiles demonstrate our direction approach without exposing private client records.',
    heroImageUrl: STUDIO_MEDIA.artistShowcasePortrait,
    heroImageAlt: 'Editorial monochrome artist portraiture study',
    primaryCtaLabel: 'Launch Artist OS',
    isVisible: true,
    seoTitle: 'Artists & Visual Worlds — KeedoHub',
    seoDescription:
      'Visual identities, era moodboards, single packaging, and release worlds for musicians and vocalists.',
    ogImageUrl: STUDIO_MEDIA.artistShowcasePortrait,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  },
  journal: {
    id: 'journal',
    eyebrow: 'Studio Journal',
    title: 'Editorial & Studio Notes.',
    subtitle: 'Perspectives on Direction & Production',
    introCopy:
      'Essays on creative direction, release visual systems, executive brand collateral, and structured studio production from the KeedoHub team.',
    heroImageUrl: STUDIO_MEDIA.journalCoverReleaseWorld,
    heroImageAlt: 'Studio desk with release design proofing and typography sheets',
    primaryCtaLabel: 'Read Latest Stories',
    isVisible: true,
    seoTitle: 'Studio Journal — KeedoHub',
    seoDescription:
      'Insights and essays on creative direction, brand identity architecture, motion stagecraft, and studio operations.',
    ogImageUrl: STUDIO_MEDIA.journalCoverReleaseWorld,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  },
  pricing: {
    id: 'pricing',
    eyebrow: 'Packages & Engagements',
    title: 'Structured Scope for Artists & Brands.',
    subtitle: 'Transparent Studio Frameworks',
    introCopy:
      'Indicative creative frameworks outlining standard deliverables, revision rounds, and studio turnarounds. Final pricing is confirmed directly against your brief.',
    heroImageUrl: STUDIO_MEDIA.brandIdentitySystem,
    heroImageAlt: 'Brand identity and collateral production swatch layout',
    primaryCtaLabel: 'Request Quote',
    isVisible: true,
    seoTitle: 'Packages & Scope — KeedoHub',
    seoDescription:
      'Review indicative creative packages, revision guidelines, and turnaround timelines for artists and companies.',
    ogImageUrl: STUDIO_MEDIA.brandIdentitySystem,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  },
  faq: {
    id: 'faq',
    eyebrow: 'Frequently Asked Questions',
    title: 'Process, Scope & Workspace Answers.',
    subtitle: 'Clear Operating Details',
    introCopy:
      'Clarity on how creative briefs enter production, how Artist OS and Brand OS workspaces operate, and what comes with final deliverable handover.',
    heroImageUrl: STUDIO_MEDIA.creativeDirectorStudio,
    heroImageAlt: 'Studio work desk and reference proofs',
    primaryCtaLabel: 'Contact Studio',
    isVisible: true,
    seoTitle: 'FAQ — KeedoHub',
    seoDescription:
      'Frequently asked questions regarding creative turnaround times, client workspaces, deliverable handovers, and quote confirmations.',
    ogImageUrl: STUDIO_MEDIA.creativeDirectorStudio,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  },
  contact: {
    id: 'contact',
    eyebrow: 'Project Enquiry',
    title: 'Put Creative Direction Behind the Idea.',
    subtitle: 'Studio Intake Desk',
    introCopy:
      'Send your brief directly to the KeedoHub studio desk. Once reviewed, projects move into your private Artist or Brand workspace for structured production, proofing, and delivery.',
    heroImageUrl: STUDIO_MEDIA.studioWorkstationHero,
    heroImageAlt: 'Architectural studio desk with open production brief',
    primaryCtaLabel: 'Send Project Brief',
    isVisible: true,
    seoTitle: 'Project Enquiry — KeedoHub',
    seoDescription:
      'Submit a creative brief or commission request directly to the KeedoHub studio desk.',
    ogImageUrl: STUDIO_MEDIA.studioWorkstationHero,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  },
};

export const DEFAULT_JOURNAL_ARTICLES: JournalArticle[] = BLOG_POSTS.map((post, idx) => {
  const slug = slugifyTitle(post.title);
  const now = new Date().toISOString();
  return {
    id: post.id,
    title: post.title,
    slug,
    previousSlugs: [],
    excerpt: post.excerpt,
    content: post.content,
    coverImageUrl: post.image,
    coverImageAlt: post.title,
    inlineImages: [],
    authorName: post.artist,
    authorRole: 'KeedoHub Editorial Desk',
    category: post.category,
    tags: [
      post.category.toLowerCase().replace(/\s*&\s*/g, '-').replace(/\s+/g, '-'),
      'creative-direction',
      'studio-craft',
    ],
    readingTimeMinutes: calculateReadingTimeMinutes(post.content),
    status: 'Published',
    featured: idx === 0,
    publishedAt: post.date,
    seoTitle: `${post.title} — KeedoHub Journal`,
    seoDescription: post.excerpt,
    ogImageUrl: post.image,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    updatedBy: 'system',
  };
});

// ============================================================================
// 2. PURE DOMAIN HELPER FUNCTIONS
// ============================================================================

export function slugifyTitle(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ensureUniqueSlug(
  candidate: string,
  existing: Array<{ id: string; slug: string; previousSlugs?: string[] }>,
  currentId?: string,
): string {
  const baseSlug = candidate || 'article';
  let targetSlug = baseSlug;
  let counter = 1;

  const isCollision = (s: string) =>
    existing.some(item => {
      if (currentId && item.id === currentId) return false;
      if (item.slug === s) return true;
      if (Array.isArray(item.previousSlugs) && item.previousSlugs.includes(s)) return true;
      return false;
    });

  while (isCollision(targetSlug)) {
    counter += 1;
    targetSlug = `${baseSlug}-${counter}`;
  }

  return targetSlug;
}

export function calculateReadingTimeMinutes(text: string): number {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

export function sanitizeCmsUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html')
  ) {
    return '#';
  }
  return trimmed;
}

export function isArticlePubliclyVisible(article: JournalArticle, nowIso?: string): boolean {
  if (article.status !== 'Published') return false;
  if (!article.scheduledFor) return true;
  const current = nowIso || new Date().toISOString();
  return article.scheduledFor <= current;
}

export interface FilterJournalOptions {
  search?: string;
  category?: string;
  tag?: string;
  status?: JournalArticleStatus | 'All';
  includeNonPublic?: boolean;
  nowIso?: string;
}

export function filterJournalArticles(
  articles: JournalArticle[],
  options: FilterJournalOptions = {},
): JournalArticle[] {
  const { search, category, tag, status, includeNonPublic, nowIso } = options;
  const searchLower = search ? search.trim().toLowerCase() : '';

  return articles.filter(art => {
    if (!includeNonPublic && !isArticlePubliclyVisible(art, nowIso)) {
      return false;
    }
    if (status && status !== 'All' && art.status !== status) {
      return false;
    }
    if (category && category !== 'All' && art.category !== category) {
      return false;
    }
    if (tag && tag !== 'All' && !art.tags.includes(tag)) {
      return false;
    }
    if (searchLower) {
      const matchTitle = art.title.toLowerCase().includes(searchLower);
      const matchExcerpt = art.excerpt.toLowerCase().includes(searchLower);
      const matchAuthor = art.authorName.toLowerCase().includes(searchLower);
      const matchTags = art.tags.some(t => t.toLowerCase().includes(searchLower));
      if (!matchTitle && !matchExcerpt && !matchAuthor && !matchTags) return false;
    }
    return true;
  });
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; totalPages: number; currentPage: number; totalCount: number } {
  const validPageSize = Math.max(1, pageSize);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / validPageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * validPageSize;
  const pagedItems = items.slice(offset, offset + validPageSize);

  return {
    items: pagedItems,
    totalPages,
    currentPage,
    totalCount,
  };
}

export interface ContentBlock {
  type: 'heading2' | 'heading3' | 'paragraph' | 'blockquote' | 'bullet_list' | 'image';
  text?: string;
  items?: string[];
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
}

export function parseJournalContentBlocks(markdown: string): ContentBlock[] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const blocks: ContentBlock[] = [];

  let currentParagraphLines: string[] = [];
  let currentListItems: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim();
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentListItems.length > 0) {
      blocks.push({ type: 'bullet_list', items: [...currentListItems] });
      currentListItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    // Markdown inline image: ![alt](url)
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'image',
        imageAlt: imgMatch[1] || 'Journal Illustration',
        imageUrl: sanitizeCmsUrl(imgMatch[2]),
      });
      continue;
    }

    // Heading 2: ## Title
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading2', text: line.replace(/^##\s+/, '') });
      continue;
    }

    // Heading 3: ### Title
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading3', text: line.replace(/^###\s+/, '') });
      continue;
    }

    // Blockquote: > Quote
    if (line.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'blockquote', text: line.replace(/^>\s+/, '') });
      continue;
    }

    // Bullet list: - or *
    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph();
      currentListItems.push(line.replace(/^[-*]\s+/, ''));
      continue;
    }

    // Standard paragraph line
    flushList();
    currentParagraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

export function findMediaAssetUsages(
  assetUrl: string,
  context: {
    homepage?: HomepageCmsConfig;
    pages?: PublicPageCmsConfig[];
    settings?: SiteSettingsCmsConfig;
    articles?: JournalArticle[];
  },
): string[] {
  if (!assetUrl) return [];
  const hits: string[] = [];

  const hp = context.homepage;
  if (hp) {
    if (hp.heroBackgroundImageUrl === assetUrl) hits.push('Homepage Hero Background');
    if (hp.heroVisualLeftImageUrl === assetUrl) hits.push('Homepage Hero Visual (Left)');
    if (hp.heroVisualRightImageUrl === assetUrl) hits.push('Homepage Hero Visual (Right)');
  }

  if (context.pages) {
    for (const p of context.pages) {
      if (p.heroImageUrl === assetUrl) hits.push(`Page Hero: ${p.title} (${p.id})`);
      if (p.ogImageUrl === assetUrl) hits.push(`Page Social Image: ${p.id}`);
    }
  }

  const s = context.settings;
  if (s) {
    if (s.logoDarkSurfaceUrl === assetUrl) hits.push('Site Settings Logo (Dark Surface)');
    if (s.logoLightSurfaceUrl === assetUrl) hits.push('Site Settings Logo (Light Surface)');
    if (s.markDarkSurfaceUrl === assetUrl) hits.push('Site Settings Mark (Dark Surface)');
    if (s.markLightSurfaceUrl === assetUrl) hits.push('Site Settings Mark (Light Surface)');
    if (s.faviconUrl === assetUrl) hits.push('Site Settings Favicon');
    if (s.defaultOgImageUrl === assetUrl) hits.push('Default Social Share Card');
  }

  if (context.articles) {
    for (const art of context.articles) {
      if (art.coverImageUrl === assetUrl) hits.push(`Journal Cover: ${art.title}`);
      if (art.inlineImages?.some(img => img.url === assetUrl)) {
        hits.push(`Journal Inline Image: ${art.title}`);
      }
    }
  }

  return hits;
}

export function repairNavigationConfig(config?: Partial<SiteNavigationConfig>): SiteNavigationConfig {
  const base = DEFAULT_SITE_NAVIGATION;
  if (!config) return base;

  const ensureHeader = config.headerItems && config.headerItems.length > 0 ? config.headerItems : base.headerItems;
  const ensureMobile = config.mobileItems && config.mobileItems.length > 0 ? config.mobileItems : base.mobileItems;
  const ensureFooter = config.footerColumns && config.footerColumns.length > 0 ? config.footerColumns : base.footerColumns;

  // Safeguard: home and contact must exist in header/mobile
  const hasContact = ensureHeader.some(item => item.route === 'contact' && item.visible);
  const fixedHeader = hasContact
    ? ensureHeader
    : [...ensureHeader, { id: 'nav-contact-auto', label: 'Contact', route: 'contact' as any, visible: true, order: 99, location: 'header' as const }];

  return {
    id: 'navigation',
    headerItems: fixedHeader,
    mobileItems: ensureMobile,
    footerColumns: ensureFooter,
    primaryCtaLabel: config.primaryCtaLabel || base.primaryCtaLabel,
    primaryCtaRoute: config.primaryCtaRoute || base.primaryCtaRoute,
    updatedAt: new Date().toISOString(),
    updatedBy: config.updatedBy || 'repair',
  };
}

// ============================================================================
// 3. FIRESTORE SUBSCRIPTIONS & CLIENT READERS
// ============================================================================

export function subscribePublishedJournalArticles(
  onData: (articles: JournalArticle[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'journalArticles'),
    where('status', '==', 'Published'),
  );

  return onSnapshot(
    q,
    snapshot => {
      const items: JournalArticle[] = snapshot.docs.map(docSnap => ({
        ...(docSnap.data() as JournalArticle),
        id: docSnap.id,
      }));
      // Sort published articles by publishedAt descending
      items.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
      onData(items.length > 0 ? items : DEFAULT_JOURNAL_ARTICLES);
    },
    err => {
      if (onError) onError(err);
      onData(DEFAULT_JOURNAL_ARTICLES);
    },
  );
}

export function subscribeAdminJournalArticles(
  onData: (articles: JournalArticle[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(collection(db, 'journalArticles'));
  return onSnapshot(
    q,
    snapshot => {
      const items: JournalArticle[] = snapshot.docs.map(docSnap => ({
        ...(docSnap.data() as JournalArticle),
        id: docSnap.id,
      }));
      items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onData(items);
    },
    err => {
      if (onError) onError(err);
      onData([]);
    },
  );
}

export function subscribeSiteCmsDoc<T extends { id: string }>(
  docId: 'homepage' | 'navigation' | 'settings',
  fallback: T,
  onData: (data: T) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'siteCms', docId),
    snap => {
      if (snap.exists()) {
        onData({ ...fallback, ...(snap.data() as T), id: docId });
      } else {
        onData(fallback);
      }
    },
    err => {
      if (onError) onError(err);
      onData(fallback);
    },
  );
}

export function subscribeSitePages(
  onData: (pages: Record<PublicPageId, PublicPageCmsConfig>) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'sitePages'),
    snapshot => {
      const merged: Record<PublicPageId, PublicPageCmsConfig> = { ...DEFAULT_PUBLIC_PAGES };
      snapshot.forEach(docSnap => {
        const id = docSnap.id as PublicPageId;
        if (id in DEFAULT_PUBLIC_PAGES) {
          merged[id] = {
            ...DEFAULT_PUBLIC_PAGES[id],
            ...(docSnap.data() as PublicPageCmsConfig),
            id,
          };
        }
      });
      onData(merged);
    },
    err => {
      if (onError) onError(err);
      onData(DEFAULT_PUBLIC_PAGES);
    },
  );
}

export function subscribeCmsMediaAssets(
  onData: (assets: CmsMediaAsset[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'cmsMedia'),
    snapshot => {
      const assets = snapshot.docs.map(d => ({ ...(d.data() as CmsMediaAsset), id: d.id }));
      assets.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onData(assets);
    },
    err => {
      if (onError) onError(err);
      onData([]);
    },
  );
}

// ============================================================================
// 4. ADMIN CMS SAVE / DELETE / UPLOAD MUTATIONS
// ============================================================================

export async function saveHomepageCms(
  payload: HomepageCmsConfig,
  adminUid: string,
): Promise<HomepageCmsConfig> {
  const docRef = doc(db, 'siteCms', 'homepage');
  const record: HomepageCmsConfig = {
    ...payload,
    id: 'homepage',
    updatedAt: new Date().toISOString(),
    updatedBy: adminUid,
  };
  await setDoc(docRef, record, { merge: true });
  return record;
}

export async function saveSiteNavigationCms(
  payload: SiteNavigationConfig,
  adminUid: string,
): Promise<SiteNavigationConfig> {
  const repaired = repairNavigationConfig({
    ...payload,
    updatedBy: adminUid,
  });
  const docRef = doc(db, 'siteCms', 'navigation');
  await setDoc(docRef, repaired, { merge: true });
  return repaired;
}

export async function saveSiteSettingsCms(
  payload: SiteSettingsCmsConfig,
  adminUid: string,
): Promise<SiteSettingsCmsConfig> {
  const docRef = doc(db, 'siteCms', 'settings');
  const record: SiteSettingsCmsConfig = {
    ...payload,
    id: 'settings',
    updatedAt: new Date().toISOString(),
    updatedBy: adminUid,
  };
  await setDoc(docRef, record, { merge: true });
  return record;
}

export async function savePublicPageCms(
  payload: PublicPageCmsConfig,
  adminUid: string,
): Promise<PublicPageCmsConfig> {
  const docRef = doc(db, 'sitePages', payload.id);
  const record: PublicPageCmsConfig = {
    ...payload,
    updatedAt: new Date().toISOString(),
    updatedBy: adminUid,
  };
  await setDoc(docRef, record, { merge: true });
  return record;
}

export async function saveJournalArticle(
  payload: Partial<JournalArticle> & { title: string },
  adminUid: string,
  existingArticles: Array<{ id: string; slug: string; previousSlugs?: string[] }> = [],
): Promise<JournalArticle> {
  const now = new Date().toISOString();
  const id = payload.id || `article-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const title = payload.title.trim();
  const rawCandidateSlug = payload.slug ? slugifyTitle(payload.slug) : slugifyTitle(title);
  const slug = ensureUniqueSlug(rawCandidateSlug, existingArticles, id);

  const prevSlugs = new Set(payload.previousSlugs || []);
  if (payload.slug && payload.slug !== slug) {
    prevSlugs.add(payload.slug);
  }

  const readingTime = calculateReadingTimeMinutes(payload.content || '');

  const article: JournalArticle = {
    id,
    title,
    slug,
    previousSlugs: Array.from(prevSlugs),
    excerpt: payload.excerpt?.trim() || '',
    content: payload.content || '',
    coverImageUrl: payload.coverImageUrl || STUDIO_MEDIA.journalCoverReleaseWorld,
    coverImageAlt: payload.coverImageAlt || title,
    inlineImages: Array.isArray(payload.inlineImages) ? payload.inlineImages : [],
    authorName: payload.authorName?.trim() || 'KeedoHub Direction Desk',
    authorRole: payload.authorRole?.trim() || 'Studio Author',
    category: payload.category || 'Creative Direction',
    tags: Array.isArray(payload.tags) ? payload.tags : ['creative-direction'],
    readingTimeMinutes: readingTime,
    status: payload.status || 'Draft',
    featured: Boolean(payload.featured),
    publishedAt: payload.publishedAt || now.slice(0, 10),
    scheduledFor: payload.scheduledFor || undefined,
    seoTitle: payload.seoTitle?.trim() || `${title} — KeedoHub Journal`,
    seoDescription: payload.seoDescription?.trim() || payload.excerpt?.trim() || '',
    ogImageUrl: payload.ogImageUrl || payload.coverImageUrl || STUDIO_MEDIA.journalCoverReleaseWorld,
    canonicalUrl: payload.canonicalUrl || undefined,
    createdAt: payload.createdAt || now,
    updatedAt: now,
    createdBy: payload.createdBy || adminUid,
    updatedBy: adminUid,
  };

  await setDoc(doc(db, 'journalArticles', id), article);
  return article;
}

export async function deleteJournalArticle(articleId: string): Promise<void> {
  await deleteDoc(doc(db, 'journalArticles', articleId));
}

export async function uploadCmsMediaAsset(
  file: File,
  folder: CmsMediaFolder,
  metadata: { title: string; altText: string; caption?: string; tags?: string[] },
  adminUid: string,
  onProgress?: (pct: number) => void,
): Promise<CmsMediaAsset> {
  const assetId = `cms-media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `website-media/${assetId}/${cleanFileName}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      snap => {
        if (onProgress && snap.totalBytes > 0) {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress(pct);
        }
      },
      err => reject(err),
      () => resolve(),
    );
  });

  const downloadUrl = await getDownloadURL(storageRef);
  const now = new Date().toISOString();

  const asset: CmsMediaAsset = {
    id: assetId,
    title: metadata.title.trim() || cleanFileName,
    fileName: cleanFileName,
    folder,
    url: downloadUrl,
    storagePath,
    mimeType: file.type || 'image/jpeg',
    sizeBytes: file.size,
    altText: metadata.altText.trim() || metadata.title.trim(),
    caption: metadata.caption?.trim(),
    tags: metadata.tags || [folder],
    createdAt: now,
    createdBy: adminUid,
    updatedAt: now,
  };

  await setDoc(doc(db, 'cmsMedia', assetId), asset);
  return asset;
}

export async function replaceCmsMediaAsset(
  assetId: string,
  file: File,
  adminUid: string,
  onProgress?: (pct: number) => void,
): Promise<CmsMediaAsset> {
  const assetDoc = await getDoc(doc(db, 'cmsMedia', assetId));
  if (!assetDoc.exists()) {
    throw new Error(`Media asset ${assetId} not found`);
  }
  const existing = assetDoc.data() as CmsMediaAsset;

  // Upload new file at original storage path
  const storageRef = ref(storage, existing.storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || existing.mimeType,
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      snap => {
        if (onProgress && snap.totalBytes > 0) {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress(pct);
        }
      },
      err => reject(err),
      () => resolve(),
    );
  });

  const downloadUrl = await getDownloadURL(storageRef);
  const now = new Date().toISOString();

  const updated: CmsMediaAsset = {
    ...existing,
    url: downloadUrl,
    sizeBytes: file.size,
    mimeType: file.type || existing.mimeType,
    updatedAt: now,
  };

  await setDoc(doc(db, 'cmsMedia', assetId), updated);
  return updated;
}

export async function deleteCmsMediaAsset(assetId: string, storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch {
    // Storage object might already be missing; proceed with Firestore cleanup
  }
  await deleteDoc(doc(db, 'cmsMedia', assetId));
}

export async function seedDefaultJournalArticles(adminUid: string): Promise<number> {
  let count = 0;
  for (const article of DEFAULT_JOURNAL_ARTICLES) {
    const docRef = doc(db, 'journalArticles', article.id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...article,
        createdBy: adminUid,
        updatedBy: adminUid,
      });
      count += 1;
    }
  }
  return count;
}
