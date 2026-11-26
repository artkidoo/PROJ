/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Vision & Mission Page
 */
import React from 'react';
import { ArrowRight, Check, MoveUpRight } from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { StudioImage } from './PublicMedia';
import { STUDIO_MEDIA } from '../../data/publicContent';
import { useWebsiteCms } from '../../context/WebsiteCmsContext';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

const STUDIO_VALUES = [
  {
    code: '01',
    title: 'Originality Over Imitation',
    detail: 'Every project starts from the subject’s own story, sound, or commercial purpose rather than recycled agency formulas.',
  },
  {
    code: '02',
    title: 'Systems Over Chaos',
    detail: 'Creative ideas survive translation across media only when backed by clear grids, typography rules, and version control.',
  },
  {
    code: '03',
    title: 'Precision Across Mediums',
    detail: 'Print ink tolerances, vinyl sleeve finishes, streaming loops, and executive documents all receive the same art direction rigor.',
  },
  {
    code: '04',
    title: 'Accountable Collaboration',
    detail: 'Clear briefs, internal QA checks, structured client reviews, and clean final delivery keep momentum unmistakable.',
  },
];

export const VisionMissionPage: React.FC<Props> = ({ navigate }) => {
  const { sitePages } = useWebsiteCms();
  const cms = sitePages?.vision;

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="vision" navigate={navigate} />

      <main className="flex-1">
        <section className="border-b border-[#1E1E1E] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px] space-y-12">
            <div className="max-w-3xl space-y-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                {cms?.eyebrow || 'Vision & Mission'}
              </p>
              <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl">
                {cms?.title || 'Where Creative Ambition Meets Production Discipline.'}
              </h1>
              <p className="text-base leading-7 text-neutral-400">
                {cms?.introCopy ||
                  'Our purpose is straightforward: help artists and modern organizations look unmistakable in public while operating cleanly behind the scenes.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-[#242424] bg-[#0D0D0D] p-8 sm:p-10 space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF1E1E]">Mission</span>
                <h2 className="text-2xl font-bold text-white">Turn Raw Ideas Into Cohesive Visual Worlds</h2>
                <p className="text-sm leading-7 text-neutral-400">
                  To equip artists, labels, and ambitious companies with sharp creative direction and disciplined visual production—delivering artwork, identities, motion, and documents built to endure.
                </p>
              </div>

              <div className="border border-[#242424] bg-[#0D0D0D] p-8 sm:p-10 space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF1E1E]">Vision</span>
                <h2 className="text-2xl font-bold text-white">The Standard Behind Defining Artists &amp; Brands</h2>
                <p className="text-sm leading-7 text-neutral-400">
                  To set the benchmark for independent creative studios—where world-class visual craft and a transparent Creative Operating System work together seamlessly from day one.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#1E1E1E] bg-[#0B0B0B] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px] grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="space-y-5">
              <div className="aspect-[4/3] overflow-hidden border border-[#242424] bg-[#121212]">
                <StudioImage
                  src={STUDIO_MEDIA.brandIdentitySystem}
                  alt="KeedoHub studio brand architecture swatch and manual showcase"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Identity Systems · Print Specifications · Studio Discipline
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">Core Values</p>
                <h2 className="mt-2 text-3xl font-bold uppercase tracking-tight text-white">
                  Four Commitments Behind Every Commission.
                </h2>
              </div>

              <div className="divide-y divide-[#202020] border-t border-[#202020]">
                {STUDIO_VALUES.map(value => (
                  <div key={value.code} className="grid gap-2 py-5 sm:grid-cols-[3rem_1fr] sm:gap-4">
                    <span className="font-mono text-xs text-[#FF1E1E] tabular-nums">{value.code}</span>
                    <div className="space-y-1.5">
                      <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                        <Check size={14} className="text-[#FF1E1E]" />
                        <span>{value.title}</span>
                      </h3>
                      <p className="text-sm leading-6 text-neutral-400">{value.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('portfolio')}
                  className="inline-flex items-center gap-2 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors"
                >
                  <span>See Work in Practice</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('contact')}
                  className="inline-flex items-center gap-2 border border-[#333] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:border-white transition-colors"
                >
                  <span>Discuss a Brief</span>
                  <MoveUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
};
