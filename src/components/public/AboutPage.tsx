import React from 'react';
import { ArrowRight, MoveUpRight } from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { StudioImage } from './PublicMedia';
import { STUDIO_MEDIA, STUDIO_PILLARS } from '../../data/publicContent';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

export const AboutPage: React.FC<Props> = ({ navigate }) => (
  <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
    <PublicHeader current="about" navigate={navigate} />

    <main className="flex-1">
      <section className="border-b border-[#1E1E1E] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-[1440px] grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
              <span className="text-[#FF1E1E]">Studio Profile</span>
              <span className="text-neutral-500">About KeedoHub</span>
            </div>
            <h1 className="text-4xl font-black uppercase leading-[0.94] tracking-[-0.045em] text-white sm:text-6xl">
              A Creative Agency Structured Like an Operating System.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-neutral-300">
              KeedoHub brings together creative direction, graphic design, brand identity, music artwork, motion production, and executive collateral under one studio roof—supported by private client workspaces that keep every brief and proof organized.
            </p>
            <p className="max-w-2xl text-sm leading-7 text-neutral-400">
              We partner with independent and label-backed artists building cohesive release worlds, as well as ambitious brands and companies requiring sharp visual systems and presentation-grade documentation.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('services')}
                className="inline-flex items-center gap-2 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black"
              >
                <span>Explore Services</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => navigate('portfolio')}
                className="inline-flex items-center gap-2 border border-[#333] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-white"
              >
                <span>View Portfolio</span>
                <MoveUpRight size={14} />
              </button>
            </div>
          </div>

          <div className="border border-[#242424] bg-[#0D0D0D] p-3">
            <div className="aspect-[16/10] overflow-hidden bg-[#121212]">
              <StudioImage
                src={STUDIO_MEDIA.creativeDirectorStudio}
                alt="KeedoHub studio creative direction desk with print proofs and layout monitor"
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between px-1 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              <span>Art Direction · Print Proofing · Production</span>
              <span className="text-[#FF1E1E]">KeedoHub Studio</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#1E1E1E] bg-[#0B0B0B] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-[1440px] space-y-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">Operating Principles</p>
              <h2 className="mt-2 text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
                How We Think About Visual Craft.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('vision')}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white"
            >
              <span>Read Vision &amp; Mission</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STUDIO_PILLARS.map(pillar => (
              <div key={pillar.number} className="border border-[#222222] bg-[#0E0E0E] p-7 space-y-3">
                <span className="font-mono text-xs text-[#FF1E1E] tabular-nums">{pillar.number}</span>
                <h3 className="text-lg font-bold text-white">{pillar.title}</h3>
                <p className="text-sm leading-7 text-neutral-400">{pillar.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-[1440px] grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">One Unified Workspace</p>
            <h2 className="text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
              Tailored Experience for Artists, Brands, and Companies.
            </h2>
            <p className="text-sm leading-7 text-neutral-400">
              Instead of scattering artwork proofs, licensing contracts, brand palettes, and feedback across chat apps, every KeedoHub client account provides one private workspace—adapting cleanly into Artist OS, Brand OS, or Company OS.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <button
              type="button"
              onClick={() => navigate('register')}
              className="inline-flex items-center gap-2 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#FF1E1E] hover:text-white transition-colors"
            >
              <span>Create Client Workspace</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => navigate('contact')}
              className="inline-flex items-center gap-2 border border-[#333] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:border-white transition-colors"
            >
              <span>Start a Project Brief</span>
              <MoveUpRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </main>

    <PublicFooter navigate={navigate} />
  </div>
);
