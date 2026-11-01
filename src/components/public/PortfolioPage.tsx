import React, { useState } from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PORTFOLIO_ITEMS } from '../../data/publicContent';
import { ArrowRight } from 'lucide-react';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const PortfolioPage: React.FC<Props> = ({ navigate }) => {
  const [filter, setFilter] = useState<'all' | 'music' | 'brand' | 'motion' | 'web'>('all');
  const items = PORTFOLIO_ITEMS.filter(p => filter === 'all' || p.category === filter);
  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      <PublicHeader current="portfolio" navigate={navigate} />
      <main className="flex-1">
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div>
            <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">Portfolio</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mt-2">Selected work.</h1>
            <p className="text-sm text-neutral-500 mt-2">Sample work is clearly labelled. Private client deliverables are never exposed by default.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all','music','brand','motion','web'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs rounded border ${filter===f ? 'bg-[#FF1E1E] border-[#FF1E1E] text-white' : 'border-[#242424] text-neutral-400 hover:text-white'}`}>{f}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(p => (
              <div key={p.id} className="border border-[#1F1F1F] bg-[#0E0E0E] rounded overflow-hidden">
                <img src={p.image} alt={p.title} className="w-full aspect-[4/3] object-cover" />
                <div className="p-5 space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-[#FF1E1E] uppercase">{p.category} {p.sample ? '· SAMPLE' : ''}</span>
                  <h3 className="text-white font-semibold">{p.title}</h3>
                  <p className="text-xs text-neutral-500">{p.client}</p>
                  <p className="text-sm text-neutral-400">{p.description}</p>
                  <button onClick={() => navigate('contact')} className="text-xs text-white inline-flex items-center gap-1.5 hover:text-[#FF1E1E]">
                    View project <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
};
