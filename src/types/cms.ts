/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Public Website CMS, Dynamic Journal & Media Library Types
 */

import type { PublicRoute } from '../components/public/PublicHeader';

export type JournalArticleStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived';

export interface JournalInlineImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
}

export interface JournalArticle {
  id: string;
  title: string;
  slug: string;
  previousSlugs: string[];
  excerpt: string;
  content: string;
  coverImageUrl: string;
  coverImageAlt: string;
  inlineImages: JournalInlineImage[];
  authorName: string;
  authorRole: string;
  category: string;
  tags: string[];
  readingTimeMinutes: number;
  status: JournalArticleStatus;
  featured: boolean;
  publishedAt: string;
  scheduledFor?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type HomepageSectionId =
  | 'ecosystem'
  | 'services'
  | 'showcase'
  | 'process'
  | 'studio'
  | 'community'
  | 'testimonials'
  | 'journal'
  | 'packages'
  | 'cta';

export interface HomepageTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface HomepageCmsConfig {
  id: 'homepage';
  heroKicker: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaTarget: PublicRoute | '#ecosystem';
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaTarget: PublicRoute;
  heroTertiaryCtaLabel: string;
  heroTertiaryCtaTarget: PublicRoute;
  heroBackgroundImageUrl: string;
  heroVisualLeftLabel: string;
  heroVisualLeftTitle: string;
  heroVisualLeftImageUrl: string;
  heroVisualLeftAlt: string;
  heroVisualRightLabel: string;
  heroVisualRightTitle: string;
  heroVisualRightImageUrl: string;
  heroVisualRightAlt: string;
  ecosystemHeading: string;
  ecosystemDescription: string;
  servicesHeading: string;
  showcaseHeading: string;
  showcaseDescription: string;
  featuredPortfolioIds: string[];
  featuredArtistIds: string[];
  featuredServiceIds: string[];
  featuredJournalSlugs: string[];
  processHeading: string;
  processDescription: string;
  studioHeading: string;
  studioDescription: string;
  communityHeading: string;
  journalHeading: string;
  packagesHeading: string;
  testimonialsHeading: string;
  testimonials: HomepageTestimonial[];
  ctaHeading: string;
  ctaDescription: string;
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
  sectionVisibility: Record<HomepageSectionId, boolean>;
  sectionOrder: HomepageSectionId[];
  updatedAt: string;
  updatedBy: string;
}

export type PublicPageId =
  | 'about'
  | 'vision'
  | 'services'
  | 'portfolio'
  | 'artists'
  | 'journal'
  | 'pricing'
  | 'faq'
  | 'contact';

export interface PublicPageExtraSection {
  id: string;
  eyebrow?: string;
  heading: string;
  body: string;
}

export interface PublicPageFaqEntry {
  id: string;
  category: string;
  q: string;
  a: string;
}

export interface PublicPageCmsConfig {
  id: PublicPageId;
  eyebrow: string;
  title: string;
  subtitle: string;
  introCopy: string;
  secondaryCopy?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  extraSections?: PublicPageExtraSection[];
  customFaqs?: PublicPageFaqEntry[];
  isVisible: boolean;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  updatedAt: string;
  updatedBy: string;
}

export type NavLocation =
  | 'header'
  | 'mobile'
  | 'footer_studio'
  | 'footer_ecosystem'
  | 'footer_os'
  | 'footer_policies';

export interface SiteNavItem {
  id: string;
  label: string;
  route: PublicRoute;
  visible: boolean;
  order: number;
  location: NavLocation;
}

export interface FooterNavColumn {
  id: 'footer_studio' | 'footer_ecosystem' | 'footer_os' | 'footer_policies';
  title: string;
  items: SiteNavItem[];
}

export interface SiteNavigationConfig {
  id: 'navigation';
  headerItems: SiteNavItem[];
  mobileItems: SiteNavItem[];
  footerColumns: FooterNavColumn[];
  primaryCtaLabel: string;
  primaryCtaRoute: PublicRoute;
  updatedAt: string;
  updatedBy: string;
}

export interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
}

export interface SiteSettingsCmsConfig {
  id: 'settings';
  siteName: string;
  tagline: string;
  logoDarkSurfaceUrl: string;
  logoLightSurfaceUrl: string;
  markDarkSurfaceUrl: string;
  markLightSurfaceUrl: string;
  faviconUrl: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImageUrl: string;
  contactEmail: string;
  contactPhone: string;
  studioLocations: string;
  footerBio: string;
  copyrightText: string;
  socialLinks: SocialLinkItem[];
  updatedAt: string;
  updatedBy: string;
}

export type CmsMediaFolder = 'journal' | 'homepage' | 'pages' | 'branding' | 'general';

export interface CmsMediaAsset {
  id: string;
  title: string;
  fileName: string;
  folder: CmsMediaFolder;
  url: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  altText: string;
  caption?: string;
  tags: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}
