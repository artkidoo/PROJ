/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Website CMS Real-Time Provider & Context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  HomepageCmsConfig,
  JournalArticle,
  PublicPageCmsConfig,
  PublicPageId,
  SiteNavigationConfig,
  SiteSettingsCmsConfig,
} from '../types/cms';
import {
  DEFAULT_HOMEPAGE_CMS,
  DEFAULT_JOURNAL_ARTICLES,
  DEFAULT_PUBLIC_PAGES,
  DEFAULT_SITE_NAVIGATION,
  DEFAULT_SITE_SETTINGS,
  subscribePublishedJournalArticles,
  subscribeSiteCmsDoc,
  subscribeSitePages,
} from '../lib/websiteCms';
import { applyRuntimeSeo } from '../lib/seo';

interface WebsiteCmsContextValue {
  homepageCms: HomepageCmsConfig;
  siteNavigation: SiteNavigationConfig;
  siteSettings: SiteSettingsCmsConfig;
  sitePages: Record<PublicPageId, PublicPageCmsConfig>;
  publishedArticles: JournalArticle[];
  loading: boolean;
  findArticleBySlugOrId: (identifier?: string | null) => JournalArticle | undefined;
  isPageVisible: (pageId: PublicPageId) => boolean;
}

const WebsiteCmsContext = createContext<WebsiteCmsContextValue | null>(null);

export const WebsiteCmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [homepageCms, setHomepageCms] = useState<HomepageCmsConfig>(DEFAULT_HOMEPAGE_CMS);
  const [siteNavigation, setSiteNavigation] = useState<SiteNavigationConfig>(DEFAULT_SITE_NAVIGATION);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsCmsConfig>(DEFAULT_SITE_SETTINGS);
  const [sitePages, setSitePages] = useState<Record<PublicPageId, PublicPageCmsConfig>>(DEFAULT_PUBLIC_PAGES);
  const [publishedArticles, setPublishedArticles] = useState<JournalArticle[]>(DEFAULT_JOURNAL_ARTICLES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: Array<() => void> = [];

    try {
      const unsubHome = subscribeSiteCmsDoc<HomepageCmsConfig>('homepage', DEFAULT_HOMEPAGE_CMS, data => {
        setHomepageCms(data);
      });
      const unsubNav = subscribeSiteCmsDoc<SiteNavigationConfig>('navigation', DEFAULT_SITE_NAVIGATION, data => {
        setSiteNavigation(data);
      });
      const unsubSettings = subscribeSiteCmsDoc<SiteSettingsCmsConfig>('settings', DEFAULT_SITE_SETTINGS, data => {
        setSiteSettings(data);
      });
      const unsubPages = subscribeSitePages(data => {
        setSitePages(data);
      });
      const unsubArticles = subscribePublishedJournalArticles(data => {
        setPublishedArticles(data);
        setLoading(false);
      });

      unsubs = [unsubHome, unsubNav, unsubSettings, unsubPages, unsubArticles];
    } catch {
      setLoading(false);
    }

    return () => {
      unsubs.forEach(u => {
        try {
          u();
        } catch {
          // ignore
        }
      });
    };
  }, []);

  // Sync basic site defaults to document head on mount / settings update
  useEffect(() => {
    applyRuntimeSeo({
      siteName: siteSettings.siteName,
      title: siteSettings.defaultSeoTitle,
      description: siteSettings.defaultSeoDescription,
      ogImageUrl: siteSettings.defaultOgImageUrl,
      faviconUrl: siteSettings.faviconUrl,
    });
  }, [siteSettings]);

  const findArticleBySlugOrId = (identifier?: string | null): JournalArticle | undefined => {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();

    // 1. Check exact slug
    const bySlug = publishedArticles.find(a => a.slug.toLowerCase() === clean);
    if (bySlug) return bySlug;

    // 2. Check exact id
    const byId = publishedArticles.find(a => a.id.toLowerCase() === clean);
    if (byId) return byId;

    // 3. Check previousSlugs for legacy or updated URLs
    const byPrev = publishedArticles.find(
      a => Array.isArray(a.previousSlugs) && a.previousSlugs.some(ps => ps.toLowerCase() === clean),
    );
    if (byPrev) return byPrev;

    // 4. Fallback search against defaults
    return DEFAULT_JOURNAL_ARTICLES.find(
      a =>
        a.slug.toLowerCase() === clean ||
        a.id.toLowerCase() === clean ||
        a.previousSlugs.some(ps => ps.toLowerCase() === clean),
    );
  };

  const isPageVisible = (pageId: PublicPageId): boolean => {
    const page = sitePages[pageId];
    return page ? page.isVisible : true;
  };

  return (
    <WebsiteCmsContext.Provider
      value={{
        homepageCms,
        siteNavigation,
        siteSettings,
        sitePages,
        publishedArticles,
        loading,
        findArticleBySlugOrId,
        isPageVisible,
      }}
    >
      {children}
    </WebsiteCmsContext.Provider>
  );
};

export function useWebsiteCms(): WebsiteCmsContextValue {
  const ctx = useContext(WebsiteCmsContext);
  if (!ctx) {
    return {
      homepageCms: DEFAULT_HOMEPAGE_CMS,
      siteNavigation: DEFAULT_SITE_NAVIGATION,
      siteSettings: DEFAULT_SITE_SETTINGS,
      sitePages: DEFAULT_PUBLIC_PAGES,
      publishedArticles: DEFAULT_JOURNAL_ARTICLES,
      loading: false,
      findArticleBySlugOrId: id => DEFAULT_JOURNAL_ARTICLES.find(a => a.id === id || a.slug === id),
      isPageVisible: () => true,
    };
  }
  return ctx;
}
