import React from 'react';
import { ArrowLeft, ArrowRight, MoveUpRight } from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { StudioImage } from './PublicMedia';
import { BLOG_POSTS } from '../../data/publicContent';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
  param?: string | null;
}

export const ArticlePage: React.FC<Props> = ({ navigate, param }) => {
  const post = BLOG_POSTS.find(item => item.id === param) || BLOG_POSTS[0];
  const related = BLOG_POSTS.filter(item => item.id !== post.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="journal" navigate={navigate} />

      <main className="flex-1">
        <article className="border-b border-[#1E1E1E] px-4 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl space-y-8">
            <button
              type="button"
              onClick={() => navigate('journal')}
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Back to Studio Journal</span>
            </button>

            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                <span className="text-[#FF1E1E]">{post.category}</span>
                <span>·</span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
                <span>·</span>
                <span>{post.artist}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.035em] text-white leading-[1.04]">
                {post.title}
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-neutral-300">
                {post.excerpt}
              </p>
            </header>

            <div className="aspect-[16/9] w-full overflow-hidden border border-[#242424] bg-[#121212]">
              <StudioImage
                src={post.image}
                alt={post.title}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-6 text-base leading-8 text-neutral-300">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="border-t border-[#202020] pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                  Work With KeedoHub
                </p>
                <p className="mt-1 text-sm text-neutral-400">
                  Start a creative direction or production brief with our studio desk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('contact', encodeURIComponent(post.category))}
                className="inline-flex shrink-0 items-center gap-2 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors self-start sm:self-auto"
              >
                <span>Start a Project</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="bg-[#0B0B0B] px-4 py-14 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-5xl space-y-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                Further Reading
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {related.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate('article', item.id)}
                    className="group border border-[#202020] bg-[#0D0D0D] p-6 text-left hover:border-[#3A3A3A] transition-colors space-y-2.5"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF1E1E]">
                      {item.category} · {item.readTime}
                    </p>
                    <h2 className="text-lg font-bold text-white group-hover:text-[#FF1E1E] transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-xs leading-6 text-neutral-400">{item.excerpt}</p>
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
