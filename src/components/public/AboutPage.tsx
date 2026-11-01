import React from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface Props { navigate: (r: PublicRoute, p?: string) => void; }

export const AboutPage: React.FC<Props> = ({ navigate }) => (
  <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
    <PublicHeader current="about" navigate={navigate} />
    <main className="flex-1">
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <p className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">About KeedoHub</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase">A creative production company built like an operating system.</h1>
        <p className="text-base text-neutral-400 max-w-3xl leading-relaxed">
          KeedoHub unifies brand identity, corporate collateral, music artwork, release campaigns, motion, streaming graphics and publishing into dedicated private workspaces for artists, labels and modern brands.
        </p>
        <p className="text-base text-neutral-400 max-w-3xl leading-relaxed">
          We are not a template shop. Every engagement is scoped, planned and produced with the discipline of a studio and the clarity of a system.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {['Craft', 'Clarity', 'Continuity'].map(v => (
            <div key={v} className="border border-[#1F1F1F] bg-[#0E0E0E] p-6 rounded">
              <h3 className="text-white font-semibold mb-2">{v}</h3>
              <p className="text-sm text-neutral-400">Sample supporting copy — refine with approved brand messaging.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
    <PublicFooter navigate={navigate} />
  </div>
);
