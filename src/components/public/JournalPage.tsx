import React, { useState } from 'react';
import { ArrowRight, MoveUpRight } from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { StudioImage } from './PublicMedia';
import { BLOG_POSTS, type BlogPost } from '../../data/publicContent';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

type CategoryFilter = 'All' | BlogPost['category'];

const JOURNAL_CATEGORIES: CategoryFilter[] = [
  'All',
  'Creative Direction',
  'Brand Systems',
  'Music & Visuals',
  'Motion & Production',
];

export const JournalPage: React.FC<Props> = ({ navigate }) => {
  const [category, setCategory] = useState<CategoryFilter>('All');

  const filteredPosts = BLOG_POSTS.filter(
    post => category === 'All' || post.category === category,
  );
  const [leadPost, ...otherPosts] = filteredPosts;

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="journal" navigate={navigate} />

      <main className="flex-1">
        <section className="px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="max-w-[1440px] mx-auto space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1E1E1E] pb-10">
              <div className="max-w-3xl space-y-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                  Studio Journal
                </p>
                <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.045em] text-white uppercase leading-[0.94]">
                  Editorial &amp; Studio Notes.
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-7 max-w-2xl">
                  Essays on creative direction, release visual systems, executive brand collateral, and structured studio production from the KeedoHub team.
                </p>
              </div>

              <div
                className="flex flex-wrap gap-1 border border-[#242424] bg-[#101010] p-1 self-start lg:self-auto"
                role="group"
                aria-label="Filter journal stories by category"
              >
                {JOURNAL_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={category === cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${
                      category === cat
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {leadPost && (
              <article className="group border border-[#222222] bg-[#0D0D0D] grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] overflow-hidden hover:border-[#3A3A3A] transition-colors">
                <button
                  type="button"
                  onClick={() => navigate('article', leadPost.id)}
                  className="aspect-[16/9] lg:aspect-auto lg:min-h-[380px] overflow-hidden bg-[#121212] text-left"
                >
                  <StudioImage
                    src={leadPost.image}
                    alt={leadPost.title}
                    loading="eager"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </button>
                <div className="p-7 sm:p-10 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      <span className="text-[#FF1E1E]">{leadPost.category}</span>
                      <span>·</span>
                      <span>{leadPost.date}</span>
                      <span>·</span>
                      <span>{leadPost.readTime}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-white group-hover:text-[#FF1E1E] transition-colors">
                      {leadPost.title}
                    </h2>
                    <p className="text-sm text-neutral-400 leading-7">{leadPost.excerpt}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      By {leadPost.artist}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('article', leadPost.id)}
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] transition-colors self-start"
                  >
                    <span>Read Full Essay</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            )}

            {otherPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {otherPosts.map(post => (
                  <article
                    key={post.id}
                    className="group border border-[#202020] bg-[#0D0D0D] flex flex-col justify-between hover:border-[#3A3A3A] transition-colors"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => navigate('article', post.id)}
                        className="block aspect-[16/10] w-full overflow-hidden bg-[#121212] text-left"
                      >
                        <StudioImage
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </button>
                      <div className="p-6 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                          <span className="text-[#FF1E1E]">{post.category}</span>
                          <span>·</span>
                          <span>{post.date}</span>
                          <span>·</span>
                          <span>{post.readTime}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white leading-snug group-hover:text-[#FF1E1E] transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-neutral-400 leading-6">{post.excerpt}</p>
                      </div>
                    </div>

                    <div className="border-t border-[#1D1D1D] px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate('article', post.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] transition-colors"
                      >
                        <span>Read Article</span>
                        <MoveUpRight size={13} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
};
