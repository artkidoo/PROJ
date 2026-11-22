import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, MoveUpRight, X } from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { StudioImage } from './PublicMedia';
import { PORTFOLIO_ITEMS, type PortfolioItem } from '../../data/publicContent';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

const PORTFOLIO_FILTERS: { id: 'all' | PortfolioItem['category']; label: string }[] = [
  { id: 'all', label: 'All Works' },
  { id: 'music', label: 'Music & Artists' },
  { id: 'brand', label: 'Brand & Collateral' },
  { id: 'motion', label: 'Motion & Stage' },
  { id: 'web', label: 'Direction & Print' },
];

export const PortfolioPage: React.FC<Props> = ({ navigate }) => {
  const [filter, setFilter] = useState<'all' | PortfolioItem['category']>('all');
  const [selected, setSelected] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  const items = PORTFOLIO_ITEMS.filter(item => filter === 'all' || item.category === filter);

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="portfolio" navigate={navigate} />

      <main className="flex-1">
        <section className="px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="max-w-[1440px] mx-auto space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1E1E1E] pb-10">
              <div className="max-w-3xl space-y-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                  Portfolio Archive
                </p>
                <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.045em] text-white uppercase leading-[0.94]">
                  Selected Creative Studies &amp; Visual Systems.
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 leading-7 max-w-2xl">
                  Explore concept showcases across music packaging, identity architecture, corporate collateral, and kinetic stage design. Studio concept studies are clearly marked; private client deliverables remain confidential inside client workspaces.
                </p>
              </div>

              <div
                className="flex flex-wrap gap-1 border border-[#242424] bg-[#101010] p-1 self-start lg:self-auto"
                role="group"
                aria-label="Filter portfolio items"
              >
                {PORTFOLIO_FILTERS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={filter === tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`px-3.5 py-2 text-xs font-semibold transition-colors ${
                      filter === tab.id
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
              {items.map(item => (
                <article
                  key={item.id}
                  className="group border border-[#202020] bg-[#0D0D0D] flex flex-col justify-between hover:border-[#3A3A3A] transition-colors"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="relative block aspect-[4/3] w-full overflow-hidden bg-[#121212] text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF1E1E]"
                    >
                      <StudioImage
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                      <span className="absolute left-3.5 top-3.5 border border-white/25 bg-black/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                        {item.sample ? 'Studio Concept' : 'Featured'} · {item.category}
                      </span>
                    </button>

                    <div className="p-6 space-y-2.5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                        {item.discipline} · {item.year}
                      </p>
                      <h2 className="text-xl font-bold text-white group-hover:text-[#FF1E1E] transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-xs text-neutral-500">{item.client}</p>
                      <p className="text-sm text-neutral-400 leading-6">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#1D1D1D] px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] transition-colors"
                    >
                      <span>Open Case Details</span>
                      <MoveUpRight size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('contact', encodeURIComponent(item.title))}
                      className="text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                      Enquire
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="portfolio-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#2A2A2A] bg-[#0B0B0B]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E1E] px-6 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                {selected.sample ? 'Studio Concept Study' : 'Portfolio Case'} · {selected.discipline}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close project details"
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-[16/9] w-full overflow-hidden border-b border-[#1E1E1E] bg-[#121212]">
              <StudioImage
                src={selected.image}
                alt={selected.title}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  {selected.client} · {selected.year}
                </p>
                <h2 id="portfolio-modal-title" className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  {selected.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-neutral-300">{selected.directionNotes}</p>
              </div>
              <div className="border-t border-[#1E1E1E] pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">Deliverables Breakdown</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selected.deliverables.map(deliverable => (
                    <li key={deliverable} className="flex items-center gap-2 text-xs text-neutral-200">
                      <Check size={13} className="shrink-0 text-[#FF1E1E]" />
                      <span>{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-[#1E1E1E] pt-5">
                <button
                  type="button"
                  onClick={() => {
                    const title = selected.title;
                    setSelected(null);
                    navigate('contact', encodeURIComponent(title));
                  }}
                  className="inline-flex items-center gap-2 bg-[#FF1E1E] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors"
                >
                  <span>Request Similar Scope</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="border border-[#333] px-5 py-2.5 text-xs font-semibold text-neutral-200 hover:border-white hover:text-white transition-colors"
                >
                  Back to Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PublicFooter navigate={navigate} />
    </div>
  );
};
