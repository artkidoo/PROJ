/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Dynamic Article & Editorial Reader Page
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Linkedin,
  MoveUpRight,
  Share2,
  Twitter,
} from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { StudioImage } from './PublicMedia';
import { useWebsiteCms } from '../../context/WebsiteCmsContext';
import { parseJournalContentBlocks, type ContentBlock } from '../../lib/websiteCms';
import { applyRuntimeSeo, buildBlogPostingJsonLd } from '../../lib/seo';
import type { JournalArticle } from '../../types/cms';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
  param?: string | null;
}

export const ArticlePage: React.FC<Props> = ({ navigate, param }) => {
  const { publishedArticles, findArticleBySlugOrId, siteSettings } = useWebsiteCms();
  const [copied, setCopied] = useState(false);

  // 1. Resolve article by param (slug, id, or previousSlugs)
  const article: JournalArticle = useMemo(() => {
    const found = findArticleBySlugOrId(param);
    if (found) return found;
    return publishedArticles[0];
  }, [param, findArticleBySlugOrId, publishedArticles]);

  // 2. Canonical URL redirection if viewed via legacy slug
  useEffect(() => {
    if (article?.slug && param && param.toLowerCase() !== article.slug.toLowerCase()) {
      window.location.hash = `article/${article.slug}`;
    }
  }, [article?.slug, param]);

  // 3. Dynamic Runtime SEO & Schema.org JSON-LD
  useEffect(() => {
    if (!article) return;
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const jsonLd = buildBlogPostingJsonLd({
      title: article.seoTitle || article.title,
      headline: article.title,
      description: article.seoDescription || article.excerpt,
      image: article.coverImageUrl,
      url: pageUrl,
      authorName: article.authorName,
      authorRole: article.authorRole,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      publisherName: siteSettings.siteName || 'KeedoHub',
      publisherLogo: siteSettings.faviconUrl,
    });

    applyRuntimeSeo({
      title: `${article.seoTitle || article.title} — KeedoHub Studio Journal`,
      description: article.seoDescription || article.excerpt,
      ogImageUrl: article.ogImageUrl || article.coverImageUrl,
      ogType: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authorName: article.authorName,
      tags: article.tags,
      jsonLd,
    });
  }, [article, siteSettings]);

  // 4. Parse content blocks
  const blocks: ContentBlock[] = useMemo(() => {
    if (!article?.content) return [];
    return parseJournalContentBlocks(article.content);
  }, [article?.content]);

  // 5. Next & Previous articles
  const { prevArticle, nextArticle, relatedArticles } = useMemo(() => {
    if (!article || publishedArticles.length === 0) {
      return { prevArticle: null, nextArticle: null, relatedArticles: [] };
    }
    const idx = publishedArticles.findIndex(a => a.id === article.id);
    const prev = idx > 0 ? publishedArticles[idx - 1] : null;
    const next = idx >= 0 && idx < publishedArticles.length - 1 ? publishedArticles[idx + 1] : null;

    const sameCategory = publishedArticles
      .filter(a => a.id !== article.id && a.category === article.category)
      .slice(0, 2);

    const related =
      sameCategory.length > 0
        ? sameCategory
        : publishedArticles.filter(a => a.id !== article.id).slice(0, 2);

    return { prevArticle: prev, nextArticle: next, relatedArticles: related };
  }, [article, publishedArticles]);

  // 6. Social Share Handlers
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      });
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${article.title} via @KeedoHub`);
    const url = encodeURIComponent(currentUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(currentUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: article.title,
          text: article.excerpt,
          url: currentUrl,
        })
        .catch(() => {
          // ignore share aborts
        });
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col antialiased">
        <PublicHeader current="journal" navigate={navigate} />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold uppercase">Article Not Found</h1>
            <p className="text-neutral-400 text-sm">The essay you were looking for does not exist or has been archived.</p>
            <button
              type="button"
              onClick={() => navigate('journal')}
              className="bg-white text-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Return to Journal
            </button>
          </div>
        </main>
        <PublicFooter navigate={navigate} />
      </div>
    );
  }

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent Publication';

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="journal" navigate={navigate} />

      <main className="flex-1">
        <article className="border-b border-[#1E1E1E] px-4 py-12 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('journal')}
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Back to Studio Journal</span>
              </button>

              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Editorial Release
              </span>
            </div>

            {/* Article Header */}
            <header className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                <span className="text-[#FF1E1E] font-bold">{article.category}</span>
                <span>·</span>
                <span>{formattedDate}</span>
                <span>·</span>
                <span>{article.readingTimeMinutes || 5} min read</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-[-0.04em] text-white leading-[1.02] uppercase">
                {article.title}
              </h1>

              <p className="text-base sm:text-xl leading-relaxed text-neutral-300">
                {article.excerpt}
              </p>

              {/* Author & Social Sharing Bar */}
              <div className="border-t border-b border-[#1E1E1E] py-4 my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#181818] border border-[#2A2A2A] flex items-center justify-center font-mono text-xs font-bold text-[#FF1E1E]">
                    {article.authorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{article.authorName}</p>
                    <p className="text-[11px] text-neutral-500">{article.authorRole}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto" aria-label="Share article">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    title="Copy article link"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#242424] bg-[#101010] hover:border-[#FF1E1E] text-xs text-neutral-300 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span className="font-mono text-[10px] uppercase tracking-wider">
                      {copied ? 'Copied' : 'Copy'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareTwitter}
                    title="Share on X"
                    className="p-2 border border-[#242424] bg-[#101010] hover:border-[#FF1E1E] text-neutral-300 hover:text-white transition-colors"
                    aria-label="Share on X"
                  >
                    <Twitter size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={handleShareLinkedIn}
                    title="Share on LinkedIn"
                    className="p-2 border border-[#242424] bg-[#101010] hover:border-[#FF1E1E] text-neutral-300 hover:text-white transition-colors"
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin size={13} />
                  </button>

                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      title="Share via device menu"
                      className="p-2 border border-[#242424] bg-[#101010] hover:border-[#FF1E1E] text-neutral-300 hover:text-white transition-colors"
                      aria-label="Share via device menu"
                    >
                      <Share2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Hero Cover Image */}
            <div className="aspect-[16/9] w-full overflow-hidden border border-[#242424] bg-[#121212]">
              <StudioImage
                src={article.coverImageUrl}
                alt={article.coverImageAlt || article.title}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Structured Content Blocks */}
            <div className="prose-content space-y-6 pt-4 text-base sm:text-lg leading-relaxed text-neutral-300">
              {blocks.length > 0 ? (
                blocks.map((block, idx) => {
                  switch (block.type) {
                    case 'heading2':
                      return (
                        <h2
                          key={idx}
                          className="text-2xl sm:text-3xl font-black uppercase text-white tracking-[-0.02em] pt-6 pb-2 border-b border-[#202020]"
                        >
                          {block.text}
                        </h2>
                      );
                    case 'heading3':
                      return (
                        <h3
                          key={idx}
                          className="text-xl sm:text-2xl font-bold uppercase text-white tracking-tight pt-4"
                        >
                          {block.text}
                        </h3>
                      );
                    case 'blockquote':
                      return (
                        <blockquote
                          key={idx}
                          className="border-l-2 border-[#FF1E1E] bg-[#0E0E0E] pl-6 pr-4 py-4 my-6 text-base sm:text-lg italic text-neutral-200"
                        >
                          “{block.text}”
                        </blockquote>
                      );
                    case 'bullet_list':
                      return (
                        <ul key={idx} className="space-y-2.5 my-5 pl-5 list-disc text-neutral-300 marker:text-[#FF1E1E]">
                          {block.items?.map((it, itemIdx) => (
                            <li key={itemIdx} className="leading-7">
                              {it}
                            </li>
                          ))}
                        </ul>
                      );
                    case 'image':
                      return (
                        <figure key={idx} className="my-8 space-y-2">
                          <div className="aspect-[16/9] w-full overflow-hidden border border-[#242424] bg-[#121212]">
                            <img
                              src={block.imageUrl}
                              alt={block.imageAlt || 'Inline article figure'}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          {block.imageAlt && (
                            <figcaption className="font-mono text-[11px] text-neutral-500 uppercase tracking-wider">
                              {block.imageAlt}
                            </figcaption>
                          )}
                        </figure>
                      );
                    case 'paragraph':
                    default:
                      return (
                        <p key={idx} className="leading-8 text-neutral-300">
                          {block.text}
                        </p>
                      );
                  }
                })
              ) : (
                <div className="space-y-6">
                  {article.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="leading-8 text-neutral-300">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Article Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="border-t border-[#1C1C1C] pt-6 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">Tags:</span>
                {article.tags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => navigate('journal')}
                    className="font-mono text-[11px] bg-[#141414] border border-[#242424] hover:border-[#FF1E1E] text-neutral-300 hover:text-white px-2.5 py-1 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* Previous & Next Article Navigation */}
            <div className="border-t border-b border-[#202020] py-6 my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevArticle ? (
                <button
                  type="button"
                  onClick={() => navigate('article', prevArticle.slug || prevArticle.id)}
                  className="group text-left border border-[#1A1A1A] hover:border-[#333] p-4 bg-[#0A0A0A] space-y-1 transition-colors"
                >
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-[#FF1E1E]">
                    <ChevronLeft size={12} /> Previous Story
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF1E1E] transition-colors line-clamp-1">
                    {prevArticle.title}
                  </p>
                </button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextArticle ? (
                <button
                  type="button"
                  onClick={() => navigate('article', nextArticle.slug || nextArticle.id)}
                  className="group text-right border border-[#1A1A1A] hover:border-[#333] p-4 bg-[#0A0A0A] space-y-1 transition-colors sm:col-start-2"
                >
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-[#FF1E1E] justify-end w-full">
                    Next Story <ChevronRight size={12} />
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF1E1E] transition-colors line-clamp-1">
                    {nextArticle.title}
                  </p>
                </button>
              ) : null}
            </div>

            {/* CTA Box */}
            <div className="border border-[#242424] bg-[#0E0E0E] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                  Work With KeedoHub
                </p>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  Launch Your Next Release Or Identity.
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Commission senior creative direction or enter your private Artist/Brand OS workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('contact', encodeURIComponent(article.category))}
                className="inline-flex shrink-0 items-center gap-2 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors self-start sm:self-auto"
              >
                <span>Submit Brief</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </article>

        {/* Related Articles Section */}
        {relatedArticles.length > 0 && (
          <section className="bg-[#0B0B0B] px-4 py-14 sm:px-8 sm:py-20 border-b border-[#1A1A1A]">
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                  Further Reading In {article.category}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('journal')}
                  className="font-mono text-xs uppercase text-[#FF1E1E] hover:text-white tracking-wider"
                >
                  View All Stories →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedArticles.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate('article', item.slug || item.id)}
                    className="group border border-[#202020] bg-[#0D0D0D] p-6 text-left hover:border-[#3A3A3A] transition-colors space-y-3"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF1E1E]">
                      {item.category} · {item.readingTimeMinutes || 5} min read
                    </p>
                    <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-[#FF1E1E] transition-colors leading-snug">
                      {item.title}
                    </h2>
                    <p className="text-xs leading-6 text-neutral-400 line-clamp-2">{item.excerpt}</p>
                    <span className="inline-flex items-center gap-1.5 pt-1 text-xs font-bold uppercase tracking-wider text-white">
                      <span>Read Essay</span>
                      <MoveUpRight size={13} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
};

