import React from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { BLOG_POSTS } from '../../data/publicContent';
import { ArrowRight } from 'lucide-react';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const JournalPage: React.FC<Props> = ({ navigate }) => (
  <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
    <PublicHeader current="journal" navigate={navigate} />
    <main className="flex-1">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div>
          <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">Journal</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mt-2">Editorial and release notes.</h1>
          <p className="text-sm text-neutral-500 mt-2">Sample posts — will connect to Blogger in a later phase.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BLOG_POSTS.map(p => (
            <article key={p.id} className="border border-[#1F1F1F] bg-[#0E0E0E] rounded overflow-hidden">
              <img src={p.image} alt={p.title} className="w-full aspect-[16/9] object-cover" />
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase">
                  <span>{p.category}</span><span>·</span><span>{p.date}</span><span>·</span><span>{p.artist}</span>
                </div>
                <h3 className="text-white font-semibold text-lg">{p.title}</h3>
                <p className="text-sm text-neutral-400">{p.excerpt}</p>
                <button onClick={() => navigate('article', p.id)} className="text-xs text-white inline-flex items-center gap-1.5 hover:text-[#FF1E1E]">
                  Read article <ArrowRight size={12} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
    <PublicFooter navigate={navigate} />
  </div>
);
