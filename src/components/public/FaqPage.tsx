import React, { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { FAQS } from '../../data/publicContent';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

export const FaqPage: React.FC<Props> = ({ navigate }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const categories = ['All', ...Array.from(new Set(FAQS.map(item => item.category)))];
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const visibleFaqs = FAQS.filter(
    item => activeCategory === 'All' || item.category === activeCategory,
  );

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="faq" navigate={navigate} />

      <main className="flex-1">
        <section className="px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-4xl space-y-10">
            <div className="space-y-4 border-b border-[#1E1E1E] pb-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                Frequently Asked Questions
              </p>
              <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.045em] text-white uppercase leading-[0.94]">
                Process, Scope &amp; Workspace Answers.
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 leading-7 max-w-2xl">
                Clarity on how creative briefs enter production, how Artist OS and Brand OS workspaces operate, and what comes with final deliverable handover.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter FAQ by topic">
              {categories.map(category => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => {
                    setActiveCategory(category);
                    setOpenIndex(0);
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold border transition-colors ${
                    activeCategory === category
                      ? 'bg-white border-white text-black'
                      : 'border-[#242424] bg-[#0D0D0D] text-neutral-400 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {visibleFaqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={faq.q} className="border border-[#202020] bg-[#0D0D0D]">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-[#111111] transition-colors"
                    >
                      <div>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#FF1E1E] mb-1">
                          {faq.category}
                        </span>
                        <span className="text-base font-semibold text-white">{faq.q}</span>
                      </div>
                      <ChevronDown
                        size={17}
                        className={`shrink-0 text-neutral-400 transition-transform ${
                          isOpen ? 'rotate-180 text-white' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#1B1B1B] px-6 py-5 text-sm leading-7 text-neutral-300">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border border-[#222222] bg-[#0B0B0B] p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <h2 className="text-lg font-bold text-white">Still need detail on a specific brief?</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Send your creative question directly to the KeedoHub team.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('contact')}
                className="inline-flex shrink-0 items-center gap-2 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors self-start sm:self-auto"
              >
                <span>Contact Studio</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
};
