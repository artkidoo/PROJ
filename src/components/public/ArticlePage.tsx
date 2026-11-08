import React from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { BLOG_POSTS } from '../../data/publicContent';
import { ArrowLeft } from 'lucide-react';

interface Props { navigate: (r: PublicRoute, p?: string) => void; param?: string | null; }

export const ArticlePage: React.FC<Props> = ({ navigate, param }) => {
  const post = BLOG_POSTS.find(p => p.id === param) || BLOG_POSTS[0];
  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      <PublicHeader current="journal" navigate={navigate} />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
          <button onClick={() => navigate('journal')} className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1.5">
            <ArrowLeft size={12} /> Back to journal
          </button>
          <img src={post.image} alt={post.title} className="w-full aspect-[16/9] object-cover rounded border border-[#1F1F1F]" />
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 uppercase">
            <span>{post.category}</span><span>·</span><span>{post.date}</span><span>·</span><span>{post.artist}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{post.title}</h1>
          <div className="space-y-5 text-base leading-relaxed text-neutral-400">
            {post.content.split('\n\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
};
