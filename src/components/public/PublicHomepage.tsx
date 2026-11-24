/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Public Creative Ecosystem & Operations Platform Homepage
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
  type PortfolioItem,
} from '../../data/publicContent';

interface Props {
  navigate: (route: PublicRoute, param?: string) => void;
}

const ECOSYSTEM_DESTINATIONS: Array<{
  index: string;
  label: string;
  title: string;
  summary: string;
  actionLabel: string;
  route: PublicRoute;
}> = [
  {
    index: '01',
    label: 'Music & Talent',
    title: 'Artists',
    summary: 'Cover artwork systems, era direction, release visual worlds, and Artist OS production access.',
    actionLabel: 'Artist Worlds',
    route: 'artists',
  },
  {
    index: '02',
    label: 'Identity & Design',
    title: 'Brands',
    summary: 'Mark architecture, typographic rules, visual guidelines, and Brand OS workspace continuity.',
    actionLabel: 'Brand Scope',
    route: 'services',
  },
  {
    index: '03',
    label: 'Executive Collateral',
    title: 'Commercial & Corporate',
    summary: 'Pitch decks, structured contracts, corporate stationery suites, and Brand OS document delivery.',
    actionLabel: 'Brand Packages',
    route: 'pricing',
  },
  {
    index: '04',
    label: 'End-to-End Execution',
    title: 'Studio Operations',
    summary: 'Brief intake, Admin HQ production tracking, internal QA verification, and clean master handovers.',
    actionLabel: 'Start Brief',
    route: 'contact',
  },
];

const PRODUCTION_WORKFLOW_STEPS: Array<{
  step: string;
  label: string;
  title: string;
  detail: string;
  highlight: boolean;
}> = [
  {
    step: '01',
    label: 'Intake & Direction',
    title: 'Brief Intake & Review',
    detail: 'Creative requests and public project enquiries are reviewed for goals, deliverables, and timeline alignment.',
    highlight: true,
  },
  {
    step: '02',
    label: 'Execution Room',
    title: 'Studio Production',
    detail: 'Designers, art directors, and motion specialists build deliverables against locked project milestones.',
    highlight: false,
  },
  {
    step: '03',
    label: 'Verification',
    title: 'Internal QA Gate',
    detail: 'Every export passes internal resolution, print-profile, and brand consistency checks prior to publishing.',
    highlight: false,
  },
  {
    step: '04',
    label: 'Sign-Off & Vault',
    title: 'Client Review & Delivery',
    detail: 'Inspect proofs in your private workspace, request structured revisions by version, and download clean masters.',
    highlight: true,
  },
];

const CREATIVE_OS_CAPABILITIES: Array<{
  code: string;
  scope: string;
  title: string;
  detail: string;
}> = [
  {
    code: 'OS · 01',
    scope: 'Single Workspace',
    title: 'Artist OS',
    detail: 'Track Music & Releases, organize visual Content Engine drafts, submit artwork briefs, and access release masters.',
  },
  {
    code: 'OS · 02',
    scope: 'Single Workspace',
    title: 'Brand OS',
    detail: 'Govern Brand Identity tokens, Creative System briefs, graphic guidelines, and approved visual assets in one room.',
  },
  {
    code: 'OS · 03',
    scope: 'Single Workspace',
    title: 'Business Documents Vault',
    detail: 'Manage commercial proposals, invoices, executive stationery, and verified deliverables inside your Brand OS workspace.',
  },
  {
    code: 'OS · 04',
    scope: 'Live Pipeline',
    title: 'Active Projects & Milestones',
    detail: 'Monitor production stages from brief approval and studio work through QA and final client delivery in real time.',
  },
  {
    code: 'OS · 05',
    scope: 'Accountable Feedback',
    title: 'Deliverable Proofs & Revisions',
    detail: 'Inspect published versions directly, approve finished outputs, or submit timestamped revision notes with clarity.',
  },
  {
    code: 'OS · 06',
    scope: 'Isolated Storage',
    title: 'Client Asset Library',
    detail: 'Approved client masters stay cleanly separated from internal studio working files, always organized by project.',
  },
];

const SHOWCASE_COMMUNITIES: Array<{
  id: string;
  category: string;
  title: string;
  subtitle: string;
  image: string;
  route: PublicRoute;
}> = [
  {
    id: 'sc-kflow',
    category: 'Artist · Studio Concept',
    title: ARTISTS[0].name,
    subtitle: `${ARTISTS[0].genre} · ${ARTISTS[0].featuredRelease}`,
    image: ARTISTS[0].image,
    route: 'artists',
  },
  {
    id: 'sc-amara',
    category: 'Artist · Studio Concept',
    title: ARTISTS[1].name,
    subtitle: `${ARTISTS[1].genre} · ${ARTISTS[1].featuredRelease}`,
    image: ARTISTS[1].image,
    route: 'artists',
  },
  {
    id: 'sc-obsidian',
    category: 'Brand Identity · Studio Concept',
    title: 'Obsidian Visual System',
    subtitle: 'Packaging architecture, Pantone swatches & identity manual',
    image: STUDIO_MEDIA.brandIdentitySystem,
    route: 'portfolio',
  },
  {
    id: 'sc-corporate',
    category: 'Business · Studio Concept',
    title: 'Executive Collateral Suite',
    subtitle: 'Corporate stationery, licensing layouts & access credentials',
    image: STUDIO_MEDIA.lyricalBrandStationery,
    route: 'pricing',
  },
];

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

  const filteredProjects = PORTFOLIO_ITEMS.filter(
    item => activeWorkFilter === 'all' || item.category === activeWorkFilter,
  );

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white overflow-x-hidden">
      <PublicHeader current="home" navigate={navigate} />

      <main className="flex-1">
        {/* =========================================================================
            1. HERO / BRAND INTRODUCTION
        ========================================================================= */}
        <section id="top" className="relative isolate overflow-hidden border-b border-[#1E1E1E]">
          <div className="absolute inset-0 -z-10">
            <StudioImage
              src={STUDIO_MEDIA.lyricalStudioHero}
              alt="KeedoHub creative direction and studio lighting environment"
              loading="eager"
              className="h-full w-full object-cover object-center opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/92 to-[#080808]/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/40" />
          </div>

          <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-12">
              <div className="min-w-0 space-y-6">
                <div className="flex items-center gap-3 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#FF1E1E]">
                  <span className="h-px w-7 bg-[#FF1E1E]" aria-hidden="true" />
                  <span>KeedoHub · Creative Agency &amp; Production OS</span>
                </div>

                <h1 className="text-balance text-[clamp(1.85rem,6.8vw,4.85rem)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white">
                  A Creative Ecosystem.{' '}
                  <span className="block">
                    A Creative <span className="text-[#FF1E1E]">Operations</span> Platform.
                  </span>
                </h1>

                <p className="max-w-2xl text-sm leading-7 text-neutral-300 sm:text-base">
                  KeedoHub combines senior creative production—brand identity, music artwork, motion systems, and executive collateral—with structured studio operations from brief intake and internal QA to final workspace handover.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('ecosystem');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex min-h-11 items-center gap-2 bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black whitespace-nowrap shrink-0"
                  >
                    <span>Explore Ecosystem</span>
                    <ArrowDownRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => (isAuthenticated ? enterWorkspace() : navigate('register'))}
                    className="inline-flex min-h-11 items-center gap-2 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#FF1E1E] hover:text-white whitespace-nowrap shrink-0"
                  >
                    <span>{isAuthenticated ? 'Open Workspace' : 'Create Client Workspace'}</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('contact')}
                    className="inline-flex min-h-11 items-center gap-2 border border-white/25 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-white hover:bg-white/5 whitespace-nowrap shrink-0"
                  >
                    <span>Submit Project Brief</span>
                    <MoveUpRight size={14} />
                  </button>
                </div>
              </div>

              {/* Dual Visual Study Grid — Visible in CSS Grid on Mobile & Desktop */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-0 items-stretch">
                <div className="border border-[#262626] bg-[#0D0D0D] overflow-hidden flex flex-col min-w-0">
                  <div className="aspect-[4/5] w-full overflow-hidden bg-[#121212]">
                    <StudioImage
                      src={STUDIO_MEDIA.creativeDirectorStudio}
                      alt="KeedoHub studio creative direction desk with visual proofs"
                      loading="eager"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-3 sm:p-4 border-t border-[#1E1E1E] space-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#FF1E1E]">
                      Studio Craft
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      Direction &amp; Production
                    </p>
                  </div>
                </div>

                <div className="border border-[#262626] bg-[#0D0D0D] overflow-hidden flex flex-col min-w-0">
                  <div className="aspect-[4/5] w-full overflow-hidden bg-[#121212]">
                    <StudioImage
                      src={STUDIO_MEDIA.vinylPressMockup}
                      alt="Monochrome vinyl sleeve master production study"
                      loading="eager"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-3 sm:p-4 border-t border-[#1E1E1E] space-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                      Concept 01
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      Release &amp; Brand Masters
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 border-t border-white/15 pt-6">
              {[
                ['01', 'Creative Direction & Craft'],
                ['02', 'Unified Artist & Brand OS'],
                ['03', 'QA-Gated Studio Production'],
                ['04', 'Client Review & Master Delivery'],
              ].map(([num, label]) => (
                <div key={num} className="min-w-0 space-y-1">
                  <span className="block font-mono text-[10px] text-[#FF1E1E] tabular-nums">{num}</span>
                  <span className="block text-xs font-medium text-neutral-300 break-words">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. CREATIVE ECOSYSTEM (4-CARD MULTI-COLUMN GRID)
        ========================================================================= */}
        <section id="ecosystem" className="border-b border-[#1E1E1E] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px] space-y-10">
            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  <span className="text-[#FF1E1E] tabular-nums">01</span>
                  <span className="text-neutral-400">Creative Ecosystem</span>
                </div>
                <h2 className="text-balance text-2xl font-black uppercase leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                  Built For Artists, Brands, Businesses &amp; Studio Execution.
                </h2>
              </div>
              <p className="text-sm leading-7 text-neutral-400 max-w-2xl">
                Every participant enters one coherent platform—connecting client creative identity directly to Admin HQ studio workflows without fractured tools or scattered threads.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {ECOSYSTEM_DESTINATIONS.map(item => (
                <button
                  key={item.index}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className="group min-w-0 border border-[#202020] bg-[#0C0C0C] hover:border-[#FF1E1E] p-3.5 sm:p-6 text-left flex flex-col justify-between gap-4 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                      <span className="text-[#FF1E1E] tabular-nums">{item.index}</span>
                      <span className="text-neutral-500 truncate">{item.label}</span>
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-white uppercase tracking-tight group-hover:text-[#FF1E1E] break-words">
                      {item.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-neutral-400 break-words">
                      {item.summary}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-200 group-hover:text-white pt-2 border-t border-[#1A1A1A]">
                    <span className="truncate">{item.actionLabel}</span>
                    <MoveUpRight size={13} className="shrink-0 text-[#FF1E1E]" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. WHAT WE CREATE (ALL 9 CAPABILITIES IN MULTI-COLUMN GRID)
        ========================================================================= */}
        <section id="services" className="border-b border-[#1E1E1E] bg-[#0B0B0B] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px] space-y-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between border-b border-[#1E1E1E] pb-8">
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  <span className="text-[#FF1E1E] tabular-nums">02</span>
                  <span className="text-neutral-400">What We Create</span>
                </div>
                <h2 className="text-balance text-2xl font-black uppercase leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                  Nine Studio Disciplines Under One Standard.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('services')}
                className="inline-flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white hover:text-[#FF1E1E] transition-colors self-start sm:self-end"
              >
                <span>All 9 Capabilities</span>
                <MoveUpRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
              {PUBLIC_SERVICES.map((service, index) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => navigate('contact', encodeURIComponent(service.title))}
                  className="group min-w-0 border border-[#222222] bg-[#080808] hover:border-[#FF1E1E] p-3.5 sm:p-6 text-left flex flex-col justify-between gap-4 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                      <span className="text-[#FF1E1E] tabular-nums truncate">
                        {String(index + 1).padStart(2, '0')} · {service.category}
                      </span>
                      <MoveUpRight
                        size={13}
                        className="shrink-0 text-neutral-600 group-hover:text-white transition-colors"
                      />
                    </div>
                    <h3 className="text-xs sm:text-base lg:text-lg font-bold leading-snug text-white group-hover:text-[#FF1E1E] break-words">
                      {service.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs leading-relaxed text-neutral-400 break-words">
                      {service.description}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500 pt-2 border-t border-[#181818] truncate">
                    {service.audience} · {service.turnaround}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. SELECTED CREATIVE WORK SHOWCASE (MULTI-COLUMN GRID + QUICK VIEW)
        ========================================================================= */}
        <section id="showcase" className="border-b border-[#1E1E1E] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#1E1E1E]">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  <span className="text-[#FF1E1E] tabular-nums">03</span>
                  <span className="text-neutral-400">Selected Creative Work</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-[-0.03em] text-white uppercase">
                  Visual Worlds &amp; Production Craft.
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Curated studio studies across music packaging, identity architecture, stage motion, and executive collateral. Sample studies are clearly labeled.
                </p>
              </div>

              <div
                className="flex flex-wrap items-center gap-1 border border-[#242424] bg-[#101010] p-1 self-start lg:self-auto"
                role="group"
                aria-label="Filter selected creative work"
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
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
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

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pt-8">
              {filteredProjects.map(proj => (
                <article
                  key={proj.id}
                  className="group min-w-0 border border-[#222222] bg-[#0B0B0B] hover:border-[#FF1E1E] flex flex-col justify-between transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedProject(proj)}
                    className="relative aspect-[4/3] w-full overflow-hidden border-b border-[#1E1E1E] bg-[#121212] text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF1E1E]"
                  >
                    <StudioImage
                      src={proj.image}
                      alt={proj.title}
                      className="h-full w-full object-cover contrast-[1.05] transition duration-700 group-hover:scale-[1.03]"
                    />
                  </button>

                  <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#FF1E1E] truncate">
                        {proj.sample ? 'Studio Concept' : 'Featured'} · {proj.discipline}
                      </p>
                      <h3 className="text-xs sm:text-base lg:text-lg font-bold tracking-tight text-white group-hover:text-[#FF1E1E] break-words">
                        {proj.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs leading-relaxed text-neutral-400 break-words">
                        {proj.client} · {proj.year}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProject(proj)}
                      className="inline-flex items-center justify-between gap-2 border-t border-[#1A1A1A] pt-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-200 hover:text-[#FF1E1E]"
                    >
                      <span>Inspect Study</span>
                      <MoveUpRight size={13} className="shrink-0" />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('portfolio')}
                className="inline-flex items-center gap-2 border-b border-[#333] pb-1.5 text-xs font-bold uppercase tracking-[0.14em] text-neutral-200 hover:border-[#FF1E1E] hover:text-white transition-colors"
              >
                <span>Open Full Portfolio Archive</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. CREATIVE OPERATIONS WORKFLOW (4-CARD MULTI-COLUMN GRID)
        ========================================================================= */}
        <section id="process" className="border-b border-[#1E1E1E] bg-[#0B0B0B] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px] space-y-10">
            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  <span className="text-[#FF1E1E] tabular-nums">04</span>
                  <span className="text-neutral-400">Creative Operations</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-[-0.03em] text-white uppercase">
                  From Request to Verified Delivery.
                </h2>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
                Every commission moves inside an accountable studio pipeline—separating internal QA drafts from client-published deliverables and tracking every approval and revision by version.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {PRODUCTION_WORKFLOW_STEPS.map(stage => (
                <div
                  key={stage.step}
                  className="min-w-0 border border-[#222222] bg-[#080808] p-3.5 sm:p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                      <span
                        className={`text-xl sm:text-2xl font-black tabular-nums ${
                          stage.highlight ? 'text-[#FF1E1E]' : 'text-white'
                        }`}
                      >
                        {stage.step}
                      </span>
                      <span className="text-neutral-500 truncate">{stage.label}</span>
                    </div>
                    <h3 className="text-xs sm:text-base font-bold text-white uppercase tracking-tight break-words">
                      {stage.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-neutral-400 leading-relaxed break-words">
                      {stage.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. KEEDOHUB CREATIVE OS WORKSPACE EXPERIENCE (6-CARD GRID)
        ========================================================================= */}
        <section id="studio" className="border-b border-[#1E1E1E] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px] space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#1E1E1E] pb-8">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  <span className="text-[#FF1E1E] tabular-nums">05</span>
                  <span className="text-neutral-400">KeedoHub Creative OS</span>
                </div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase leading-[0.98] tracking-[-0.04em] text-white">
                  One Private Workspace.{' '}
                  <span className="text-[#FF1E1E]">Tailored To Your Role.</span>
                </h2>
                <p className="text-sm leading-7 text-neutral-400">
                  Each Firebase account owns one unified client workspace shaped automatically around its client type—Artist OS or Brand OS—while staying connected directly to studio production.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => (isAuthenticated ? enterWorkspace() : navigate('register'))}
                  className="inline-flex min-h-11 items-center gap-2 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#FF1E1E] hover:text-white whitespace-nowrap shrink-0"
                >
                  <span>{isAuthenticated ? 'Open Your Workspace' : 'Create Client Workspace'}</span>
                  <ArrowRight size={14} />
                </button>
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => navigate('login')}
                    className="inline-flex min-h-11 items-center gap-2 border border-[#333] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-white whitespace-nowrap shrink-0"
                  >
                    <span>Client Sign In</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {CREATIVE_OS_CAPABILITIES.map(card => (
                <div
                  key={card.code}
                  className="min-w-0 border border-[#222222] bg-[#0C0C0C] p-3.5 sm:p-6 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#FF1E1E] truncate">
                      {card.code} · {card.scope}
                    </p>
                    <h3 className="text-xs sm:text-base lg:text-lg font-bold text-white break-words">
                      {card.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs leading-relaxed text-neutral-400 break-words">
                      {card.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            7. ARTISTS, BRANDS & BUSINESSES SHOWCASE (4-CARD GRID)
        ========================================================================= */}
        <section id="community" className="border-b border-[#1E1E1E] bg-[#0B0B0B] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px] space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1E1E1E] pb-8">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  <span className="text-[#FF1E1E] tabular-nums">06</span>
                  <span className="text-neutral-400">Artists, Brands &amp; Businesses</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-[-0.03em] text-white">
                  Visual Direction Across Every Tier.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('artists')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-200 hover:text-[#FF1E1E] self-start sm:self-end"
              >
                <span>Explore Artists Showcase</span>
                <MoveUpRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {SHOWCASE_COMMUNITIES.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className="group min-w-0 border border-[#222222] bg-[#080808] hover:border-[#FF1E1E] text-left flex flex-col overflow-hidden transition-colors"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden border-b border-[#1E1E1E] bg-[#121212]">
                    <StudioImage
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-3 sm:p-4 space-y-1.5 min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#FF1E1E] truncate">
                      {item.category}
                    </p>
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight group-hover:text-[#FF1E1E] break-words">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed break-words">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            8. JOURNAL & CREATIVE INSIGHTS (4-CARD MULTI-COLUMN GRID)
        ========================================================================= */}
        <section id="journal" className="border-b border-[#1E1E1E] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px] space-y-10">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1E1E1E] pb-8">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  <span className="text-[#FF1E1E] tabular-nums">07</span>
                  <span className="text-neutral-400">Journal &amp; Insights</span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-4xl">
                  Perspectives On Craft &amp; Operations.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('journal')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-300 hover:text-white transition-colors"
              >
                <span>All Journal Stories</span>
                <MoveUpRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {BLOG_POSTS.map(post => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => navigate('article', post.id)}
                  className="group min-w-0 border border-[#222222] bg-[#0B0B0B] hover:border-[#FF1E1E] text-left flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#1E1E1E] bg-[#121212]">
                      <StudioImage
                        src={post.image}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-3 sm:p-5 space-y-2 min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#FF1E1E] truncate">
                        {post.category} · {post.readTime}
                      </p>
                      <h3 className="text-xs sm:text-base font-bold leading-snug text-white group-hover:text-[#FF1E1E] break-words">
                        {post.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs leading-relaxed text-neutral-400 break-words">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 pb-3 sm:px-5 sm:pb-4 pt-2 border-t border-[#181818] flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                    <span>{post.date}</span>
                    <MoveUpRight size={13} className="text-neutral-400 group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            9. INDICATIVE PACKAGES + CLOSING CTA
        ========================================================================= */}
        <section id="packages" className="border-b border-[#1E1E1E] bg-[#0B0B0B] px-4 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="mx-auto max-w-[1440px] space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                  <span className="text-[#FF1E1E] tabular-nums">08</span>
                  <span className="text-neutral-400">Packages &amp; Scope</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-[-0.03em] text-white">
                  Structured Scopes For Every Engagement.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('pricing')}
                className="inline-flex items-center gap-2 border-b border-[#444] pb-1 text-xs font-bold uppercase tracking-[0.14em] text-white hover:border-[#FF1E1E] self-start sm:self-end"
              >
                <span>View All Packages</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {PRICING_PACKAGES.map((pkg, idx) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => navigate('pricing')}
                  className="group min-w-0 border border-[#222222] bg-[#080808] hover:border-[#FF1E1E] p-3.5 sm:p-5 text-left flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
                      <span className="text-[#FF1E1E] tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="text-neutral-500 truncate">{pkg.audience}</span>
                    </div>
                    <h3 className="text-xs sm:text-base font-bold text-white group-hover:text-[#FF1E1E] break-words">
                      {pkg.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed break-words">
                      {pkg.summary}
                    </p>
                  </div>
                  <div className="border-t border-[#181818] pt-2.5 flex items-center justify-between gap-2 font-mono text-[10px] uppercase text-neutral-400">
                    <span className="truncate">{pkg.turnaround}</span>
                    <MoveUpRight size={12} className="shrink-0 group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="mx-auto max-w-[1440px] border border-[#242424] bg-[#0C0C0C] p-6 sm:p-10 lg:p-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em]">
                <span className="text-[#FF1E1E] tabular-nums">09</span>
                <span className="text-neutral-400">Begin With KeedoHub</span>
              </div>
              <h2 className="text-balance text-3xl font-black uppercase leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                Launch Your Next Release Or Brand Inside <span className="text-[#FF1E1E]">One Creative OS.</span>
              </h2>
              <p className="max-w-xl text-sm leading-7 text-neutral-400">
                Submit a creative brief to our studio team or register your Artist or Brand account to enter your private production room right away.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('contact')}
                className="inline-flex min-h-12 items-center gap-2 bg-[#FF1E1E] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black whitespace-nowrap shrink-0"
              >
                <span>Submit Project Brief</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => (isAuthenticated ? enterWorkspace() : navigate('register'))}
                className="inline-flex min-h-12 items-center gap-2 border border-[#333] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:border-white whitespace-nowrap shrink-0"
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
