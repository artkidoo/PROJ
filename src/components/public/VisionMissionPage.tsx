import React from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const VisionMissionPage: React.FC<Props> = ({ navigate }) => (
  <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
    <PublicHeader current="vision" navigate={navigate} />
    <main className="flex-1">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div>
          <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">Vision & Mission</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mt-2">Where creative ambition meets production discipline.</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-[#1F1F1F] bg-[#0E0E0E] p-8 rounded space-y-3">
            <h2 className="text-xl font-bold text-white">Mission</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">To equip artists, labels and brands with a production system that turns creative vision into consistent, high-quality deliverables.</p>
          </div>
          <div className="border border-[#1F1F1F] bg-[#0E0E0E] p-8 rounded space-y-3">
            <h2 className="text-xl font-bold text-white">Vision</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">To be the creative production operating system behind the world's most distinctive artists and modern brands.</p>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Values</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-neutral-400">
            {['Originality over imitation', 'Systems over chaos', 'Clarity in communication', 'Quality without compromise'].map(v => (
              <li key={v} className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#FF1E1E] rounded-full" />{v}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-neutral-600">Note: legal/business review required before finalising public mission statements.</p>
      </section>
    </main>
    <PublicFooter navigate={navigate} />
  </div>
);
