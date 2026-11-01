import React, { useState } from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { FAQS } from '../../data/publicContent';
import { ChevronDown } from 'lucide-react';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const FaqPage: React.FC<Props> = ({ navigate }) => {
  const [open, setOpen] = useState<number | null>(0);
  const categories = Array.from(new Set(FAQS.map(f => f.category)));
  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      <PublicHeader current="faq" navigate={navigate} />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div>
            <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">FAQ</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mt-2">Frequently asked questions.</h1>
          </div>
          {categories.map(cat => (
            <div key={cat} className="space-y-3">
              <h2 className="text-sm font-mono tracking-widest text-neutral-500 uppercase">{cat}</h2>
              {FAQS.filter(f => f.category === cat).map((f, i) => {
                const idx = FAQS.indexOf(f);
                return (
                  <div key={idx} className="border border-[#1F1F1F] bg-[#0E0E0E] rounded">
                    <button onClick={() => setOpen(open === idx ? null : idx)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                      <span className="text-sm text-white font-medium">{f.q}</span>
                      <ChevronDown size={16} className={`text-neutral-400 transition-transform ${open === idx ? 'rotate-180' : ''}`} />
                    </button>
                    {open === idx && <p className="px-5 pb-4 text-sm text-neutral-400 leading-relaxed">{f.a}</p>}
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
};
