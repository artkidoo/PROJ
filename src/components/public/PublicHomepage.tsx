/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Public Creative Agency & Production OS Homepage
 */
import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowDownRight,
  Check,
  MoveUpRight,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { StudioImage } from './PublicMedia';
import {
  ARTISTS,
  BLOG_POSTS,
  PORTFOLIO_ITEMS,
  PRICING_PACKAGES,
  PUBLIC_SERVICES,
  STUDIO_MEDIA,
  STUDIO_PILLARS,
  type PortfolioItem,
} from '../../data/publicContent';

interface Props {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const PublicHomepage: React.FC<Props> = ({ navigate }) => {
  const { enterWorkspace, isAuthenticated } = useApp();
  const [activeWorkFilter, setActiveWorkFilter] = useState<'all' | 'music' | 'brand' | 'motion'>('all');
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!selectedProject) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedProject]);

  const featuredPortfolio = PORTFOLIO_ITEMS.slice(0, 4);
  const filteredProjects = featuredPortfolio.filter(
    item => activeWorkFilter === 'all' || item.category === activeWorkFilter,
  );

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="home" navigate={navigate} />

      <main className="flex-1">
        {/* =========================================================================
            1. CINEMATIC HERO
        ========================================================================= */}
        <section id="top" className="relative isolate overflow-hidden border-b border-[#1E1E1E]">
          <div className="absolute inset-0 -z-10">
            <StudioImage
              src={STUDIO_MEDIA.lyricalStudioHero}
              alt="KeedoHub studio lighting environment"
              loading="eager"
              className="h-full w-full object-cover object-center opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/90 to-[#080808]/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/35" />
          </div>

          <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1440px] grid-cols-1 items-end gap-12 px-4 pb-12 pt-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10 lg:px-12 lg:py-20">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF2E2E]">
                <span className="h-px w-8 bg-[#FF2E2E]" aria-hidden="true" />
                <span>Creative Direction &amp; Visual Production Agency</span>
              </div>

              <h1 className="text-[clamp(2.4rem,9vw,6.2rem)] font-black uppercase leading-[0.86] tracking-[-0.055em] text-white">
                Ideas<br />
                Deserve<br />
                <span className="text-[#FF1E1E]">Extraordinary</span><br />
                Execution.
              </h1>

              <div className="mt-8 grid max-w-2xl gap-6 sm:grid-cols-[1fr_auto] sm:items-end lg:mt-10">
                <p className="text-sm leading-7 text-neutral-300 sm:text-base">
                  KeedoHub crafts visual identities, music artwork, motion systems, and executive collateral for artists, brands, and companies—paired with a private Creative OS from brief to final handover.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('portfolio')}
                    className="inline-flex min-h-12 items-center gap-2.5 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black"
                  >
                    <span>Explore Portfolio</span>
                    <MoveUpRight size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('contact')}
                    className="inline-flex min-h-12 items-center gap-2.5 border border-white/30 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-white hover:bg-white/5"
                  >
                    <span>Start a Project</span>
                    <ArrowDownRight size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                <span>Creative Direction</span>
                <span>Brand Identity</span>
                <span>Music Artwork</span>
                <span>Motion &amp; Production</span>
              </div>
            </div>

            {/* Curated Asymmetric Editorial Visual Stack */}
            <div className="relative hidden min-h-[460px] items-center justify-center lg:flex">
              <div className="absolute right-[4%] top-[4%] h-[76%] w-[72%] overflow-hidden border border-white/15 bg-[#0E0E0E]">
                <StudioImage
                  src={STUDIO_MEDIA.creativeDirectorStudio}
                  alt="KeedoHub creative direction studio desk showing print proofs and visual monitor"
                  loading="eager"
                  className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>
              <div className="absolute bottom-[3%] left-0 w-[52%] border border-white/20 bg-[#0A0A0A] p-2.5 shadow-2xl">
                <div className="aspect-[4/3] overflow-hidden bg-[#121212]">
                  <StudioImage
                    src={STUDIO_MEDIA.vinylPressMockup}
                    alt="Vinyl sleeve and release concept study"
                    loading="eager"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between px-1 pt-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                  <span>Sound &amp; Identity Study</span>
                  <span className="text-[#FF1E1E] tabular-nums">Concept 01</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. STUDIO POSITIONING
        ========================================================================= */}
        <section id="about" className="border-b border-[#1E1E1E] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
            <div className="space-y-5">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                <span className="text-[#FF1E1E] tabular-nums">01</span>
                <span className="text-neutral-400">About the Agency</span>
              </div>
              <p className="max-w-xs text-sm leading-6 text-neutral-400">
                Built as both a full-craft creative direction studio and a structured production operating system.
              </p>
            </div>

            <div>
              <h2 className="max-w-4xl text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl">
                We connect <span className="text-neutral-500">art direction, visual identity, and production craft</span> across music, brands, and modern companies.
              </h2>

              <div className="mt-10 grid gap-6 border-t border-[#222222] pt-8 sm:grid-cols-3">
                {STUDIO_PILLARS.map(pillar => (
                  <div key={pillar.number} className="space-y-2">
                    <p className="font-mono text-[11px] text-[#FF1E1E] tabular-nums">{pillar.number}</p>
                    <h3 className="text-sm font-semibold text-white">{pillar.title}</h3>
                    <p className="text-xs leading-6 text-neutral-400">{pillar.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-[#1E1E1E] pt-6">
                <button
                  type="button"
                  onClick={() => navigate('about')}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] transition-colors"
                >
                  <span>Read Studio Profile</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('vision')}
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                >
                  <span>Vision &amp; Mission</span>
                  <MoveUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. SELECTED CREATIVE WORK SHOWCASE
        ========================================================================= */}
        <section id="showcase" className="py-20 sm:py-28 border-b border-[#1E1E1E] px-4 sm:px-8 lg:px-12">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12 border-b border-[#1E1E1E]">
              <div className="space-y-3">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                  <span className="text-[#FF1E1E] tabular-nums">02</span>
                  <span className="text-neutral-400">Selected Portfolio</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase">
                  Visual Worlds &amp; Craft.
                </h2>
                <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
                  Curated studio studies across release packaging, brand identity systems, executive collateral, and stage motion. Sample concepts are clearly identified.
                </p>
              </div>

              <div
                className="flex flex-wrap items-center gap-1 border border-[#242424] bg-[#101010] p-1 self-start lg:self-auto"
                role="group"
                aria-label="Filter selected portfolio concepts"
              >
                {(
                  [
                    ['all', 'All Works'],
                    ['music', 'Music & Artists'],
                    ['brand', 'Brand & Identity'],
                    ['motion', 'Motion & Visuals'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={activeWorkFilter === value}
                    onClick={() => setActiveWorkFilter(value)}
                    className={`px-3.5 py-2 text-xs font-semibold transition-colors ${
                      activeWorkFilter === value
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-12 pt-10 md:grid-cols-12 md:gap-y-16">
              {filteredProjects.map((proj, index) => (
                <article
                  key={proj.id}
                  className={`group flex min-w-0 flex-col ${
                    index % 4 === 1 || index % 4 === 2 ? 'md:col-span-5' : 'md:col-span-7'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProject(proj)}
                    className="relative aspect-[4/3] w-full overflow-hidden border border-[#222222] bg-[#0D0D0D] text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF1E1E]"
                  >
                    <StudioImage
                      src={proj.image}
                      alt={proj.title}
                      className="h-full w-full object-cover contrast-[1.06] transition duration-700 group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-3.5 top-3.5 border border-white/25 bg-black/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                      {proj.sample ? 'Studio Concept' : 'Featured'} · {proj.discipline}
                    </span>
                  </button>

                  <div className="flex flex-1 flex-col justify-between gap-4 border-b border-[#242424] py-5 sm:flex-row sm:items-end">
                    <div className="space-y-1.5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                        {proj.client} · {proj.year}
                      </p>
                      <h3 className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-[#FF1E1E] sm:text-2xl">
                        {proj.title}
                      </h3>
                      <p className="max-w-xl text-xs leading-6 text-neutral-400">
                        {proj.deliverables.join(' · ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProject(proj)}
                      className="inline-flex shrink-0 items-center gap-2 self-start text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E] sm:self-end"
                    >
                      <span>Inspect Study</span>
                      <MoveUpRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('portfolio')}
                className="inline-flex items-center gap-2 border-b border-[#333] pb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-neutral-200 hover:border-[#FF1E1E] hover:text-white transition-colors"
              >
                <span>View Full Portfolio</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. CREATIVE SERVICES OVERVIEW (ALL 9 CAPABILITIES)
        ========================================================================= */}
        <section id="services" className="border-b border-[#1E1E1E] bg-[#0B0B0B] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 grid gap-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-end lg:gap-16">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                <span className="text-[#FF1E1E] tabular-nums">03</span>
                <span className="text-neutral-400">Agency Capabilities</span>
              </div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="max-w-3xl text-3xl font-bold uppercase leading-[1.03] tracking-[-0.04em] text-white sm:text-5xl">
                  Creative built to hold together across every format.
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('services')}
                  className="inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-300 hover:text-white transition-colors"
                >
                  <span>All 9 Services</span>
                  <MoveUpRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {PUBLIC_SERVICES.map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => navigate('contact', encodeURIComponent(service.title))}
                  className="group min-w-0 border-t border-[#252525] py-7 text-left transition-colors hover:border-[#FF1E1E]"
                >
                  <span className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E] tabular-nums">
                      {String(index + 1).padStart(2, '0')} · {service.category}
                    </span>
                    <MoveUpRight
                      size={15}
                      className="text-neutral-600 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                    />
                  </span>
                  <span className="mt-5 block text-lg font-semibold leading-snug tracking-tight text-white group-hover:text-[#FF1E1E] sm:text-xl">
                    {service.title}
                  </span>
                  <span className="mt-2 block text-xs leading-6 text-neutral-400">
                    {service.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. ARTIST & BRAND ECOSYSTEM
        ========================================================================= */}
        <section id="ecosystem" className="border-b border-[#1E1E1E] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 grid gap-6 lg:grid-cols-[0.65fr_1.35fr] lg:items-end lg:gap-16">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                <span className="text-[#FF1E1E] tabular-nums">04</span>
                <span className="text-neutral-400">Artists &amp; Brands</span>
              </div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="max-w-3xl text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl">
                  Two creative worlds.<br />
                  <span className="text-neutral-500">One uncompromising studio standard.</span>
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('artists')}
                  className="inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-300 hover:text-white"
                >
                  <span>Explore Artist Profiles</span>
                  <MoveUpRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-12 md:items-end">
              <button
                type="button"
                onClick={() => navigate('artists')}
                className="group relative min-w-0 text-left md:col-span-7"
              >
                <div className="relative aspect-[4/5] max-h-[680px] overflow-hidden border border-[#242424] bg-[#0F0F0F]">
                  <StudioImage
                    src={ARTISTS[0].image}
                    alt={`${ARTISTS[0].name} sample studio portrait`}
                    className="h-full w-full object-cover object-center grayscale-[25%] transition duration-700 group-hover:scale-[1.025] group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <span className="absolute left-5 top-5 border border-white/25 bg-black/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
                    Artist Profile · Studio Concept
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6 sm:p-8">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                        {ARTISTS[0].genre}
                      </p>
                      <h3 className="mt-2 text-2xl font-black uppercase leading-[0.95] tracking-[-0.03em] text-white sm:text-4xl">
                        {ARTISTS[0].name}
                      </h3>
                    </div>
                    <MoveUpRight
                      size={21}
                      className="shrink-0 text-white transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </button>

              <div className="space-y-6 md:col-span-5 md:pb-2">
                <div className="flex items-center justify-between border-t border-[#242424] pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  <span>Brands &amp; Companies</span>
                  <span>Identity &amp; Collateral Study</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('portfolio')}
                  className="group block w-full text-left"
                >
                  <div className="relative aspect-[5/4] overflow-hidden border border-[#242424] bg-[#0F0F0F]">
                    <StudioImage
                      src={STUDIO_MEDIA.brandIdentitySystem}
                      alt="Obsidian brand identity system and Swiss grid specification booklet"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <span className="absolute bottom-4 left-4 bg-[#080808]/85 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white border border-white/15">
                      Identity · Typography · Print Systems
                    </span>
                  </div>
                  <span className="mt-4 flex items-center justify-between gap-3 text-lg font-semibold text-white group-hover:text-[#FF1E1E]">
                    <span>Brand worlds engineered for authority</span>
                    <ArrowRight size={15} />
                  </span>
                </button>
                <p className="text-sm leading-7 text-neutral-400">
                  Whether building an artist’s release era or structuring a company’s brand system and executive documents, the discipline remains identical: clear art direction carried consistently into every asset.
                </p>
                <div className="flex flex-wrap gap-6 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('artists')}
                    className="inline-flex items-center gap-2 border-b border-[#444] pb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:border-[#FF1E1E]"
                  >
                    <span>Explore Artists</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('services')}
                    className="inline-flex items-center gap-2 border-b border-[#444] pb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-neutral-300 hover:border-white hover:text-white"
                  >
                    <span>Brand Services</span>
                    <MoveUpRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. PRODUCTION METHODOLOGY (ALIGNED WITH REAL AGENCY WORKFLOW)
        ========================================================================= */}
        <section id="process" className="py-20 sm:py-28 border-b border-[#1E1E1E] px-4 sm:px-8 lg:px-12">
          <div className="max-w-[1440px] mx-auto">
            <div className="max-w-2xl space-y-3 mb-14">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                <span className="text-[#FF1E1E] tabular-nums">05</span>
                <span className="text-neutral-400">Production Discipline</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase">
                From Brief to Final Handover.
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Every commission moves through a clear four-stage studio workflow inside your private workspace—eliminating scattered emails and lost versions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Brief & Creative Direction',
                  desc: 'We review your goals, references, and target deliverables, aligning on creative direction and timeline before work begins.',
                  accent: true,
                },
                {
                  step: '02',
                  title: 'Design & Visual Production',
                  desc: 'Art direction, custom typography, cover artwork, motion frames, or corporate document systems crafted to agency specification.',
                  accent: false,
                },
                {
                  step: '03',
                  title: 'Internal Studio QA & Proofing',
                  desc: 'Every file undergoes resolution, typography, print-bleed, and brand-consistency verification prior to client publishing.',
                  accent: false,
                },
                {
                  step: '04',
                  title: 'Client Review & Master Delivery',
                  desc: 'Inspect proofs directly in your workspace, request structured revisions if required, and receive clean final masters.',
                  accent: true,
                },
              ].map(stage => (
                <div
                  key={stage.step}
                  className="space-y-3 border border-[#202020] bg-[#0D0D0D] p-6"
                >
                  <span
                    className={`block text-3xl font-black font-mono tabular-nums ${
                      stage.accent ? 'text-[#FF1E1E]' : 'text-white'
                    }`}
                  >
                    {stage.step}
                  </span>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            7. KEEDOHUB CREATIVE OS WORKSPACE EXPERIENCE
        ========================================================================= */}
        <section id="studio" className="border-b border-[#1E1E1E] bg-[#0B0B0B] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="flex flex-col justify-between space-y-8">
              <div>
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                  <span className="text-[#FF1E1E] tabular-nums">06</span>
                  <span className="text-neutral-400">KeedoHub Creative OS</span>
                </div>
                <h2 className="mt-6 max-w-xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.045em] text-white sm:text-6xl">
                  Creative Work,<br />
                  In <span className="text-[#FF1E1E]">Clear Order.</span>
                </h2>
              </div>

              <div className="space-y-4">
                <p className="max-w-md text-sm leading-7 text-neutral-400">
                  Every client receives one private workspace tailored to their role: Artist OS for music releases and content workflows, or Brand OS and Company OS for visual identity, documents, and asset libraries.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => (isAuthenticated ? enterWorkspace() : navigate('register'))}
                    className="inline-flex min-h-12 items-center gap-2.5 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#FF1E1E] hover:text-white"
                  >
                    <span>{isAuthenticated ? 'Open Your Workspace' : 'Create Client Workspace'}</span>
                    <ArrowRight size={15} />
                  </button>
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => navigate('login')}
                      className="inline-flex min-h-12 items-center gap-2.5 border border-[#333] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-white"
                    >
                      <span>Client Sign In</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-[#2A2A2A]">
              {[
                ['01', 'Dedicated Experience Per Account', 'Artist, Brand, and Company accounts unlock purpose-built workspaces without clutter.'],
                ['02', 'Creative Requests & Milestones', 'Submit new production briefs directly to the studio and follow progress across active stages.'],
                ['03', 'Deliverable Proofs & Revisions', 'Review uploaded artwork and documents, approve finished work, or log revision notes by version.'],
                ['04', 'Central Asset & Brand Library', 'Keep finalized masters, press kits, guidelines, and brand collateral organized in one room.'],
              ].map(([step, title, description]) => (
                <div
                  key={step}
                  className="grid gap-2 border-b border-[#222222] py-5 sm:grid-cols-[3rem_1fr_1.25fr] sm:items-start sm:gap-6"
                >
                  <span className="font-mono text-xs text-[#FF1E1E] tabular-nums">{step}</span>
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="text-xs leading-6 text-neutral-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            8. JOURNAL STORIES
        ========================================================================= */}
        <section id="journal" className="border-b border-[#1E1E1E] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                  <span className="text-[#FF1E1E] tabular-nums">07</span>
                  <span className="text-neutral-400">Studio Journal</span>
                </div>
                <h2 className="text-3xl font-bold uppercase tracking-tight text-white sm:text-5xl">
                  Perspectives on Craft.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('journal')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-300 hover:text-white transition-colors"
              >
                <span>All Stories</span>
                <MoveUpRight size={14} />
              </button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {BLOG_POSTS.slice(0, 2).map((post, index) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate('article', post.id)}
                  className={`group min-w-0 text-left ${index === 1 ? 'md:mt-14' : ''}`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden border border-[#242424] bg-[#0E0E0E]">
                    <StudioImage
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                    <span className="absolute left-4 top-4 bg-black/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white border border-white/15">
                      {post.category}
                    </span>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-5 border-b border-[#242424] pb-5">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                        {post.date} · {post.readTime}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold leading-snug text-white group-hover:text-[#FF1E1E] sm:text-2xl">
                        {post.title}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">{post.excerpt}</p>
                    </div>
                    <MoveUpRight size={18} className="mt-1 shrink-0 text-neutral-500 group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            9. INDICATIVE PACKAGES + ENQUIRY CTA
        ========================================================================= */}
        <section id="pricing" className="border-b border-[#1E1E1E] bg-[#0B0B0B] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                <span className="text-[#FF1E1E] tabular-nums">08</span>
                <span className="text-neutral-400">Packages &amp; Scope</span>
              </div>
              <h2 className="mt-5 text-3xl font-bold uppercase leading-[1.04] tracking-[-0.04em] text-white sm:text-5xl">
                Built Around Your Deliverables.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-400">
                Review indicative packages for Artists, Brands, and Companies, then share your brief so we can confirm scope and turnaround.
              </p>
              <button
                type="button"
                onClick={() => navigate('pricing')}
                className="mt-6 inline-flex items-center gap-2 border-b border-[#444] pb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white hover:border-[#FF1E1E] transition-colors"
              >
                <span>View Full Packages</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="border-t border-[#2A2A2A]">
              {PRICING_PACKAGES.slice(0, 3).map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate('pricing')}
                  className="group grid w-full gap-3 border-b border-[#242424] py-5 text-left sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:gap-5"
                >
                  <span className="font-mono text-xs text-[#FF1E1E] tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="block text-lg font-semibold text-white group-hover:text-[#FF1E1E]">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-xs text-neutral-400">
                      {item.audience} · {item.deliverables.slice(0, 2).join(' · ')}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 group-hover:text-white">
                    <span>{item.turnaround}</span>
                    <MoveUpRight size={14} />
                  </span>
                </button>
              ))}
              <p className="pt-4 text-[11px] leading-5 text-neutral-500">
                Package details shown here are indicative frameworks. Final deliverables, timelines, and pricing are confirmed on project enquiry.
              </p>
            </div>
          </div>
        </section>

        <section id="contact" className="px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
                <span className="text-[#FF1E1E] tabular-nums">09</span>
                <span className="text-neutral-400">Commission Work</span>
              </div>
              <h2 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                Ready To Shape<br />
                <span className="text-[#FF1E1E]">Your Next Release Or Brand?</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-400">
                Send a public project enquiry to our studio team or create your private Artist, Brand, or Company workspace right away.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('contact')}
                className="inline-flex min-h-12 items-center gap-2.5 bg-[#FF1E1E] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black"
              >
                <span>Submit Project Brief</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => (isAuthenticated ? enterWorkspace() : navigate('register'))}
                className="inline-flex min-h-12 items-center gap-2.5 border border-[#333] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-white"
              >
                <span>{isAuthenticated ? 'Enter Workspace' : 'Create Account'}</span>
                <MoveUpRight size={15} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          PORTFOLIO QUICK-VIEW MODAL
      ========================================================================= */}
      {selectedProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="homepage-project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#2A2A2A] bg-[#0B0B0B]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E1E1E] px-6 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#FF1E1E]">
                {selectedProject.sample ? 'Studio Concept Study' : 'Portfolio Case'} · {selectedProject.discipline}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                aria-label="Close project details"
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-[16/9] w-full overflow-hidden border-b border-[#1E1E1E] bg-[#121212]">
              <StudioImage
                src={selectedProject.image}
                alt={selectedProject.title}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-6 p-6 sm:p-8">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  {selectedProject.client} · {selectedProject.year}
                </p>
                <h3 id="homepage-project-modal-title" className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  {selectedProject.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-neutral-300">{selectedProject.directionNotes}</p>
              </div>
              <div className="border-t border-[#1E1E1E] pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">Included Deliverables</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selectedProject.deliverables.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-neutral-200">
                      <Check size={13} className="shrink-0 text-[#FF1E1E]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-[#1E1E1E] pt-5">
                <button
                  type="button"
                  onClick={() => {
                    const title = selectedProject.title;
                    setSelectedProject(null);
                    navigate('contact', encodeURIComponent(title));
                  }}
                  className="inline-flex items-center gap-2 bg-[#FF1E1E] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors"
                >
                  <span>Enquire About Similar Work</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject(null);
                    navigate('portfolio');
                  }}
                  className="border border-[#333] px-5 py-2.5 text-xs font-semibold text-neutral-200 hover:border-white hover:text-white transition-colors"
                >
                  Open Full Portfolio
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
