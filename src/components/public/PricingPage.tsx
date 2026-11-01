import React from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PRICING_PACKAGES } from '../../data/publicContent';
import { ArrowRight } from 'lucide-react';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const PricingPage: React.FC<Props> = ({ navigate }) => (
  <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
    <PublicHeader current="pricing" navigate={navigate} />
    <main className="flex-1">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div>
          <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">Pricing</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mt-2">Packages for artists and brands.</h1>
          <p className="text-sm text-neutral-500 mt-2">Sample/configurable pricing data — update before publishing final rates.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRICING_PACKAGES.map(p => (
            <div key={p.id} className="border border-[#1F1F1F] bg-[#0E0E0E] p-6 rounded flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">{p.name}</h3>
                <span className="text-[10px] font-mono text-[#FF1E1E] uppercase">{p.audience} · {p.tier}</span>
              </div>
              <p className="text-sm text-neutral-400">{p.priceLabel}</p>
              <ul className="text-sm text-neutral-400 space-y-1">
                {p.deliverables.map(d => <li key={d} className="flex items-center gap-2"><span className="w-1 h-1 bg-[#FF1E1E] rounded-full" />{d}</li>)}
              </ul>
              <div className="text-xs text-neutral-500 font-mono">Revisions: {p.revisions} · Turnaround: {p.turnaround}</div>
              <button onClick={() => navigate('contact')} className="mt-2 text-xs text-white inline-flex items-center gap-1.5 hover:text-[#FF1E1E]">
                Enquire <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
    <PublicFooter navigate={navigate} />
  </div>
);
