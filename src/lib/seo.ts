/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Runtime SEO, Meta Tags & Schema.org Structured Data Engine
 */

export interface RuntimeSeoParams {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImageUrl?: string;
  ogType?: 'website' | 'article';
  siteName?: string;
  faviconUrl?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown> | null;
}

const DEFAULT_SITE_NAME = 'KeedoHub';
const DEFAULT_DESCRIPTION =
  'Multidisciplinary creative studio delivering creative direction, brand identity, music artwork, motion graphics, and unified Artist & Brand production workspaces.';
const DEFAULT_OG_IMAGE = '/assets/images/studio_workstation_hero_1795688232526.jpg';

function getOrCreateMeta(name: string, isProperty = false): HTMLMetaElement {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  return el;
}

function setMetaContent(name: string, content: string | undefined, isProperty = false) {
  if (!content) return;
  const meta = getOrCreateMeta(name, isProperty);
  meta.content = content;
}

export function applyRuntimeSeo(params: RuntimeSeoParams): void {
  if (typeof document === 'undefined') return;

  const siteName = params.siteName || DEFAULT_SITE_NAME;
  const pageTitle = params.title || `${siteName} — Creative Agency & Production Operating System`;
  const description = params.description || DEFAULT_DESCRIPTION;
  const ogImageUrl = params.ogImageUrl || DEFAULT_OG_IMAGE;
  const ogType = params.ogType || 'website';

  // 1. Title
  document.title = pageTitle;

  // 2. Standard Meta
  setMetaContent('description', description);
  setMetaContent('twitter:card', 'summary_large_image');
  setMetaContent('twitter:title', pageTitle);
  setMetaContent('twitter:description', description);
  setMetaContent('twitter:image', ogImageUrl);

  // 3. OpenGraph
  setMetaContent('og:title', pageTitle, true);
  setMetaContent('og:description', description, true);
  setMetaContent('og:image', ogImageUrl, true);
  setMetaContent('og:type', ogType, true);
  setMetaContent('og:site_name', siteName, true);

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const fullCanonical = params.canonicalPath
      ? `${origin}/#${params.canonicalPath.replace(/^#\/?/, '')}`
      : window.location.href;
    setMetaContent('og:url', fullCanonical, true);

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = fullCanonical;
  }

  // 4. Favicon
  if (params.faviconUrl) {
    const iconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (iconLink) {
      iconLink.href = params.faviconUrl;
    }
  }

  // 5. Article-specific meta
  if (ogType === 'article') {
    if (params.publishedTime) {
      setMetaContent('article:published_time', params.publishedTime, true);
    }
    if (params.modifiedTime) {
      setMetaContent('article:modified_time', params.modifiedTime, true);
    }
    if (params.authorName) {
      setMetaContent('article:author', params.authorName, true);
    }
    if (params.tags && params.tags.length > 0) {
      setMetaContent('article:tag', params.tags.join(', '), true);
    }
  }

  // 6. Schema.org JSON-LD structured data
  let scriptEl = document.getElementById('keedohub-ld-json') as HTMLScriptElement | null;
  if (params.jsonLd) {
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'keedohub-ld-json';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(params.jsonLd);
  } else if (scriptEl) {
    scriptEl.remove();
  }
}

export function buildOrganizationJsonLd(options?: {
  name?: string;
  url?: string;
  logoUrl?: string;
  email?: string;
  description?: string;
}): Record<string, unknown> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://keedohub.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options?.name || 'KeedoHub',
    url: options?.url || origin,
    logo: options?.logoUrl || `${origin}/favicon.png`,
    description: options?.description || DEFAULT_DESCRIPTION,
    email: options?.email || 'studio@keedohub.com',
    sameAs: ['https://instagram.com/keedohub', 'https://x.com/keedohub', 'https://linkedin.com/company/keedohub'],
  };
}

export function buildBlogPostingJsonLd(params: {
  title: string;
  headline?: string;
  description: string;
  image: string;
  url: string;
  authorName: string;
  authorRole?: string;
  datePublished: string;
  dateModified?: string;
  publisherName?: string;
  publisherLogo?: string;
}): Record<string, unknown> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://keedohub.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: params.headline || params.title,
    name: params.title,
    description: params.description,
    image: params.image,
    url: params.url,
    datePublished: params.datePublished,
    dateModified: params.dateModified || params.datePublished,
    author: {
      '@type': 'Person',
      name: params.authorName,
      jobTitle: params.authorRole || 'Studio Author',
    },
    publisher: {
      '@type': 'Organization',
      name: params.publisherName || 'KeedoHub',
      logo: {
        '@type': 'ImageObject',
        url: params.publisherLogo || `${origin}/favicon.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url,
    },
  };
}
