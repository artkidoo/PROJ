/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Dynamic Studio Journal & Editorial Hub
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Clock,
  MoveUpRight,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { StudioImage } from './PublicMedia';
import { useWebsiteCms } from '../../context/WebsiteCmsContext';
import { applyRuntimeSeo } from '../../lib/seo';
import type { JournalArticle } from '../../types/cms';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

const ITEMS_PER_PAGE = 6;

export const JournalPage: React.FC<Props> = ({ navigate }) => {
  const { publishedArticles, sitePages } = useWebsiteCms();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayCount, setDisplayCount] = useState<number>(ITEMS_PER_PAGE);

  const pageCms = sitePages?.journal;

  // Runtime SEO
  useEffect(() => {
    applyRuntimeSeo({
      title: pageCms?.seoTitle || 'Studio Journal — Editorial & Perspectives | KeedoHub',
      description:
        pageCms?.seoDescription ||
        'Essays on creative direction, release visual systems, brand collateral, and structured studio production from KeedoHub.',
      ogImageUrl: pageCms?.ogImageUrl,
      canonicalPath: 'journal',
    });
  }, [pageCms]);

  // Extract categories & popular tags from published articles
  const categories = useMemo(() => {
    const set = new Set<string>();
    publishedArticles.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return ['All', ...Array.from(set)];
  }, [publishedArticles]);

  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    publishedArticles.forEach(a => {
      (a.tags || []).forEach(t => {
        if (!t) return;
        const clean = t.trim().toLowerCase();
        map.set(clean, (map.get(clean) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [publishedArticles]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedArticles.filter(a => {
      // Category match
      if (selectedCategory !== 'All' && a.category !== selectedCategory) {
        return false;
      }
      // Tag match
      if (selectedTag) {
        const hasTag = (a.tags || []).some(t => t.toLowerCase() === selectedTag);
        if (!hasTag) return false;
      }
      // Search query match
      if (q) {
        const matchTitle = a.title?.toLowerCase().includes(q);
        const matchExcerpt = a.excerpt?.toLowerCase().includes(q);
        const matchAuthor = a.authorName?.toLowerCase().includes(q);
        const matchTags = (a.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchTitle && !matchExcerpt && !matchAuthor && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [publishedArticles, selectedCategory, selectedTag, searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [selectedCategory, selectedTag, searchQuery]);

  // Lead article: prefer featured or first of filtered
  const leadArticle: JournalArticle | undefined = useMemo(() => {
    if (filteredArticles.length === 0) return undefined;
    const featured = filteredArticles.find(a => a.featured);
    return featured || filteredArticles[0];
  }, [filteredArticles]);

  const otherArticles: JournalArticle[] = useMemo(() => {
    if (!leadArticle) return [];
    const remaining = filteredArticles.filter(a => a.id !== leadArticle.id);
    return remaining.slice(0, displayCount);
  }, [filteredArticles, leadArticle, displayCount]);

  const totalRemainingCount = leadArticle
    ? Math.max(0, filteredArticles.length - 1 - otherArticles.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="journal" navigate={navigate} />

      <main className="flex-1">
        <section className="px-4 py-16 sm:px-8 sm:py-24 lg:px-12 border-b border-[#1A1A1A]">
          <div className="max-w-[1440px] mx-auto space-y-10">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1E1E1E] pb-10">
              <div className="max-w-3xl space-y-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                  {pageCms?.eyebrow || 'Studio Journal'}
                </p>
                <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.045em] text-white uppercase leading-[0.94]">
                  {pageCms?.title || 'Editorial & Studio Notes.'}
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-7 max-w-2xl">
                  {pageCms?.introCopy ||
                    'Essays on creative direction, release visual systems, executive brand collateral, and structured studio production from the KeedoHub team.'}
                </p>
              </div>

              {/* Search & Tag Clear Controls */}
              <div className="w-full lg:w-80 space-y-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search articles, tags, authors..."
                    className="w-full bg-[#111111] border border-[#262626] focus:border-[#FF1E1E] pl-9 pr-8 py-2.5 text-xs text-white placeholder-neutral-500 transition-colors focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter Tabs & Tag Pills */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div
                  className="flex flex-wrap gap-1 border border-[#242424] bg-[#101010] p-1"
                  role="group"
                  aria-label="Filter journal stories by category"
                >
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={selectedCategory === cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-white text-black'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {selectedTag && (
                  <div className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-[#333] px-3 py-1.5 text-xs text-neutral-300">
                    <Tag size={12} className="text-[#FF1E1E]" />
                    <span>Tag: #{selectedTag}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="text-neutral-400 hover:text-white ml-1"
                      aria-label="Remove tag filter"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>

              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Popular Tags:
                  </span>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`px-2.5 py-1 text-[11px] font-mono transition-colors ${
                        selectedTag === tag
                          ? 'bg-[#FF1E1E] text-white'
                          : 'bg-[#121212] border border-[#222] text-neutral-400 hover:text-white hover:border-[#444]'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredArticles.length === 0 && (
              <div className="border border-[#222] bg-[#0E0E0E] p-12 text-center space-y-4">
                <p className="font-mono text-xs uppercase tracking-widest text-[#FF1E1E]">
                  No Stories Found
                </p>
                <p className="text-neutral-400 text-sm max-w-md mx-auto">
                  No articles matched your active filters. Try searching for different keywords or clear selected tags and categories.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedTag(null);
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#FF1E1E] hover:text-white transition-colors"
                >
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}

            {/* Lead Featured Article */}
            {leadArticle && (
              <article className="group border border-[#222222] bg-[#0D0D0D] grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] overflow-hidden hover:border-[#3A3A3A] transition-colors">
                <button
                  type="button"
                  onClick={() => navigate('article', leadArticle.slug || leadArticle.id)}
                  className="aspect-[16/10] lg:aspect-auto lg:min-h-[420px] overflow-hidden bg-[#121212] text-left"
                >
                  <StudioImage
                    src={leadArticle.coverImageUrl}
                    alt={leadArticle.coverImageAlt || leadArticle.title}
                    loading="eager"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </button>
                <div className="p-7 sm:p-10 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      <span className="text-[#FF1E1E] font-bold">{leadArticle.category}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} />
                        {leadArticle.publishedAt
                          ? new Date(leadArticle.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        {leadArticle.readingTimeMinutes || 5} min read
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-bold leading-tight text-white group-hover:text-[#FF1E1E] transition-colors">
                      {leadArticle.title}
                    </h2>

                    <p className="text-sm text-neutral-400 leading-7 line-clamp-4">
                      {leadArticle.excerpt}
                    </p>

                    {leadArticle.tags && leadArticle.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {leadArticle.tags.slice(0, 4).map(t => (
                          <span
                            key={t}
                            className="bg-[#141414] border border-[#222] px-2 py-0.5 text-[10px] font-mono text-neutral-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#1C1C1C] pt-6 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                        Words By
                      </p>
                      <p className="text-xs font-semibold text-white mt-0.5">
                        {leadArticle.authorName} <span className="text-neutral-500">({leadArticle.authorRole})</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('article', leadArticle.slug || leadArticle.id)}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] transition-colors"
                    >
                      <span>Read Full Essay</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            )}

            {/* Other Articles Grid */}
            {otherArticles.length > 0 && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {otherArticles.map(post => {
                    const articleSlug = post.slug || post.id;
                    return (
                      <article
                        key={post.id}
                        className="group border border-[#202020] bg-[#0D0D0D] flex flex-col justify-between hover:border-[#3A3A3A] transition-colors"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => navigate('article', articleSlug)}
                            className="block aspect-[16/10] w-full overflow-hidden bg-[#121212] text-left"
                          >
                            <StudioImage
                              src={post.coverImageUrl}
                              alt={post.coverImageAlt || post.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                            />
                          </button>
                          <div className="p-6 space-y-3">
                            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                              <span className="text-[#FF1E1E] font-bold">{post.category}</span>
                              <span>·</span>
                              <span>
                                {post.publishedAt
                                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : 'Recent'}
                              </span>
                              <span>·</span>
                              <span>{post.readingTimeMinutes || 5} min read</span>
                            </div>
                            <h3 className="text-lg font-bold text-white leading-snug group-hover:text-[#FF1E1E] transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-sm text-neutral-400 leading-6 line-clamp-3">
                              {post.excerpt}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-[#1D1D1D] px-6 py-4 flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                            {post.authorName}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate('article', articleSlug)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] transition-colors"
                          >
                            <span>Read Article</span>
                            <MoveUpRight size={13} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {totalRemainingCount > 0 && (
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                      className="inline-flex items-center gap-2 border border-[#333] hover:border-white bg-[#111] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                    >
                      <span>Load More Stories ({totalRemainingCount} remaining)</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
};

