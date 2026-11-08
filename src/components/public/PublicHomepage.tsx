/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Public Homepage & Creative Production Portal
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowRight,
  LogIn,
  Menu,
  X,
  MoveUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { PublicRoute } from './PublicHeader';
import { ARTISTS, BLOG_POSTS, PORTFOLIO_ITEMS, PRICING_PACKAGES, PUBLIC_SERVICES } from '../../data/publicContent';
import vinylPressImg from '../../assets/images/vinyl_press_mockup_1792791744149.jpg';
import brandStationeryImg from '../../assets/images/lyrical_ent_brand_stationery_1792793391733.jpg';
import artistPortraitImg from '../../assets/images/artist_showcase_portrait_1792791744296.jpg';
import studioHeroImg from '../../assets/images/lyrical_ent_studio_hero_1792791743831.jpg';

interface Props {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const PublicHomepage: React.FC<Props> = ({ navigate }) => {
  const { enterWorkspace, loginWithGoogle, isAuthenticated, authError } = useApp();

  const [activeWorkFilter, setActiveWorkFilter] = useState<'all' | 'music' | 'brand' | 'motion'>('all');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const scrollToSection = (sectionId: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileNavOpen(false);
  };

  const creativeProjects = [
    {
      id: 'proj-01',
      title: 'Monolith Vinyl Master & Release Suite',
      category: 'music',
      client: 'LYRICAL ENT',
      year: '2026',
      deliverables: 'Vinyl 33⅓ RPM Press · Streaming Canvas · Single Cover Architecture',
      image: vinylPressImg
    },
    {
      id: 'proj-02',
      title: 'Atelier Brand Stationery & Corporate Suite',
      category: 'brand',
      client: 'Lyrical Entertainment Group',
      year: '2026',
      deliverables: 'Executive Letterhead · Legal Contract Layout · NFC Identity Cards',
      image: brandStationeryImg
    },
    {
      id: 'proj-03',
      title: 'Noir Cinematic Artist Roster Campaign',
      category: 'music',
      client: 'KAYODE OLUWASEUN (K-FLOW)',
      year: '2026',
      deliverables: 'High-Contrast Photography · Billboard Campaign · Press Media Kit',
      image: artistPortraitImg
    },
    {
      id: 'proj-04',
      title: 'Sound Labs Audio Acoustic Identity',
      category: 'motion',
      client: 'KeedoHub Sound Labs',
      year: '2026',
      deliverables: 'Soundwave Animation · Stage Visualizers · Motion Graphics Loop',
      image: studioHeroImg
    }
  ];

  const filteredProjects = creativeProjects.filter(p =>
    activeWorkFilter === 'all' || p.category === activeWorkFilter
  );
  const publicPageLinks: { label: string; route: PublicRoute }[] = [
    { label: 'About', route: 'about' },
    { label: 'Vision & Mission', route: 'vision' },
    { label: 'Artists', route: 'artists' },
    { label: 'Journal', route: 'journal' },
    { label: 'Pricing', route: 'pricing' },
    { label: 'FAQ', route: 'faq' },
    { label: 'Contact', route: 'contact' },
    { label: 'Terms', route: 'terms' },
    { label: 'Privacy', route: 'privacy' },
    { label: 'Refund & Revision', route: 'refund' },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      {/* =========================================================================
          TOP BAR CONTRACT
          Zone 1: Single element wordmark
          Zone 2: 4-5 single-line nav links
          Zone 3: Primary action button
      ========================================================================= */}
      <header className="sticky top-0 z-40 h-16 bg-[#080808]/90 backdrop-blur border-b border-[#1A1A1A] px-4 md:px-8 relative">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#top"
              onClick={scrollToSection('top')}
              className="text-lg md:text-xl font-black tracking-tighter text-white uppercase whitespace-nowrap select-none"
            >
              KEEDO<span className="text-[#FF1E1E]">HUB</span>
            </a>
            <span className="hidden sm:inline text-neutral-600">/</span>
            <span className="hidden sm:inline text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              CREATIVE OS
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-neutral-400">
            <a href="#about" onClick={scrollToSection('about')} className="hover:text-white transition-colors whitespace-nowrap shrink-0">About</a>
            <a href="#services" onClick={scrollToSection('services')} className="hover:text-white transition-colors whitespace-nowrap shrink-0">Services</a>
            <a href="#showcase" onClick={scrollToSection('showcase')} className="hover:text-white transition-colors whitespace-nowrap shrink-0">Selected Work</a>
            <a href="#studio" onClick={scrollToSection('studio')} className="hover:text-white transition-colors whitespace-nowrap shrink-0">Creative OS</a>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(open => !open)}
              className="lg:hidden p-2 text-neutral-300 hover:text-white"
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
              aria-controls="homepage-mobile-menu"
            >
              {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => enterWorkspace()}
                className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap"
              >
                <span>Open Workspace</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => loginWithGoogle()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#141414] rounded border border-[#242424] transition-colors whitespace-nowrap"
                >
                  <LogIn size={13} />
                  <span>Client Sign In</span>
                </button>
                <button
                  onClick={() => enterWorkspace()}
                  className="flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-[#E01818] text-white px-3.5 py-1.5 text-xs font-semibold rounded transition-all shadow-sm whitespace-nowrap active:scale-[0.98]"
                >
                  <span>Client Access</span>
                  <ArrowRight size={13} />
                </button>
              </>
            )}
          </div>
        </div>
        {mobileNavOpen && (
          <nav id="homepage-mobile-menu" className="absolute left-0 right-0 top-full border-b border-[#262626] bg-[#080808] px-4 py-4 shadow-2xl lg:hidden">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-1">
              {[
                ['About', 'about'],
                ['Services', 'services'],
                ['Selected Work', 'showcase'],
                ['Artists & Brands', 'ecosystem'],
                ['Production Process', 'process'],
                ['Creative OS', 'studio'],
                ['Journal', 'journal'],
                ['Pricing', 'pricing'],
                ['Workspace Access', 'workspaces'],
                ['Contact', 'contact'],
              ].map(([label, section]) => (
                <a key={section} href={`#${section}`} onClick={scrollToSection(section)} className="px-3 py-3 text-sm text-neutral-300 hover:bg-[#141414] hover:text-white">
                  {label}
                </a>
              ))}
              <button onClick={() => { enterWorkspace(); setMobileNavOpen(false); }} className="col-span-2 mt-2 bg-[#FF1E1E] px-3 py-3 text-sm font-semibold text-white">
                Sign In / Create Account
              </button>
            </div>
          </nav>
        )}
        {authError && <p role="alert" className="border-t border-red-900/50 px-4 py-2 text-center text-xs text-red-300">{authError}</p>}
      </header>

      {/* =========================================================================
          HERO SECTION
      ========================================================================= */}
      <section id="top" className="relative isolate overflow-hidden border-b border-[#222]">
        <div className="absolute inset-0 -z-10">
          <img src={studioHeroImg} alt="" className="h-full w-full object-cover object-center opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/85 to-[#080808]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/30" />
        </div>
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1600px] grid-cols-1 items-end gap-12 px-4 pb-8 pt-20 sm:px-8 sm:pb-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-8 lg:px-12 lg:py-16">
          <div className="relative z-10 max-w-4xl">
            <p className="mb-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[.28em] text-[#ff3636] sm:text-xs">
              <span className="h-px w-9 bg-[#ff3636]" /> Creative production / Lagos · London · LA
            </p>
            <h1 className="max-w-4xl text-[clamp(2.1rem,11vw,7.2rem)] font-black uppercase leading-[.79] tracking-[-.08em] text-white sm:text-[clamp(3.35rem,9vw,7.2rem)]">
              Ideas<br />deserve<br /><span className="text-[#ff3030]">extraordinary</span><br />execution.
            </h1>
            <div className="mt-8 grid max-w-3xl gap-6 sm:grid-cols-[1fr_auto] sm:items-end lg:mt-10">
              <p className="max-w-xl text-sm leading-7 text-neutral-300 sm:text-base">
                KeedoHub builds distinctive visual identities and release worlds for artists, labels and ambitious brands — then carries the work through a considered production process.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigate('portfolio')} className="inline-flex min-h-12 items-center gap-3 bg-[#ff2929] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-black">
                  Explore the work <MoveUpRight size={16} />
                </button>
                <button onClick={() => navigate('contact')} className="inline-flex min-h-12 items-center gap-3 border border-white/35 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white">
                  Start a project <ArrowDownRight size={16} />
                </button>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-2 border-t border-white/20 pt-4 text-[9px] font-mono uppercase tracking-[.16em] text-neutral-400 sm:text-[10px]">
              <span>Music &amp; artist worlds</span><span>Identity systems</span><span>Motion &amp; production</span>
            </div>
          </div>
          <div className="relative hidden min-h-[420px] items-center justify-center lg:flex">
            <div className="absolute right-[5%] top-[6%] h-[72%] w-[71%] overflow-hidden border border-white/15">
              <img src={artistPortraitImg} alt="Artist portrait from a KeedoHub sample creative project" className="h-full w-full object-cover object-center grayscale transition-transform duration-700 hover:scale-[1.04]" />
            </div>
            <div className="absolute bottom-[4%] left-[0%] w-[51%] border border-white/20 bg-[#090909] p-2">
              <img src={vinylPressImg} alt="Vinyl artwork from a KeedoHub sample creative project" className="aspect-[4/3] w-full object-cover" />
              <p className="flex items-center justify-between px-1 pt-2 text-[9px] font-mono uppercase tracking-[.18em] text-neutral-400"><span>Image / sound / identity</span><span className="text-[#ff3030]">KH — 01</span></p>
            </div>
            <div className="absolute right-0 top-0 font-mono text-[9px] uppercase tracking-[.2em] text-neutral-500 [writing-mode:vertical-rl]">Independent creative production</div>
            <span className="absolute bottom-0 right-[4%] text-[clamp(4rem,8vw,7.5rem)] font-black leading-none tracking-[-.1em] text-white/10">KH.</span>
          </div>
        </div>
      </section>

      <section id="about" className="border-b border-[#222] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">01 / About KeedoHub</p>
            <p className="mt-6 max-w-xs text-sm leading-6 text-neutral-500">A creative production partner for work that needs a point of view — and the discipline to bring it to life.</p>
          </div>
          <div>
            <h2 className="max-w-5xl text-balance text-3xl font-semibold leading-[1.08] tracking-[-.045em] text-white sm:text-5xl lg:text-6xl">
              We connect <span className="text-neutral-500">ideas, identity and execution</span> across music, culture and business.
            </h2>
            <div className="mt-9 flex flex-col gap-6 border-t border-[#262626] pt-6 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-xl text-sm leading-7 text-neutral-400">From the first creative direction to the final delivery package, each part of the work is designed to feel coherent, intentional and unmistakably yours.</p>
              <button onClick={() => navigate('about')} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-white hover:text-[#ff3030]">More about the studio <ArrowRight size={15} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SELECTED CREATIVE WORK SHOWCASE
      ========================================================================= */}
      <section id="showcase" className="py-20 md:py-28 border-b border-[#1A1A1A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#1A1A1A]">
            <div className="space-y-2">
              <span className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">
                CURATED PORTFOLIO
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase">
                Selected Production Work.
              </h2>
              <p className="text-sm text-neutral-400 max-w-xl">
                A selection of studio concepts and sample creative work. Sample pieces are clearly identified rather than presented as client commissions.
              </p>
            </div>

            {/* Filter segmented buttons (Functional interactive tabs) */}
            <div className="flex max-w-full flex-wrap items-center gap-1 border border-[#222222] bg-[#121212] p-1 self-start md:self-auto" aria-label="Filter portfolio concepts">
              <button
                type="button"
                aria-pressed={activeWorkFilter === 'all'}
                onClick={() => setActiveWorkFilter('all')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  activeWorkFilter === 'all' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Works
              </button>
              <button
                type="button"
                aria-pressed={activeWorkFilter === 'music'}
                onClick={() => setActiveWorkFilter('music')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  activeWorkFilter === 'music' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Music &amp; Artists
              </button>
              <button
                type="button"
                aria-pressed={activeWorkFilter === 'brand'}
                onClick={() => setActiveWorkFilter('brand')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  activeWorkFilter === 'brand' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Brand &amp; Identity
              </button>
              <button
                type="button"
                aria-pressed={activeWorkFilter === 'motion'}
                onClick={() => setActiveWorkFilter('motion')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  activeWorkFilter === 'motion' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Motion &amp; Visuals
              </button>
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 gap-x-7 gap-y-12 pt-10 md:grid-cols-12 md:gap-y-16">
            {filteredProjects.map((proj, index) => (
              <div
                key={proj.id}
                className={`group flex min-w-0 flex-col ${index % 4 === 1 || index % 4 === 2 ? 'md:col-span-5' : 'md:col-span-7'}`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden border border-[#222] bg-black">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale-[.35] contrast-110 transition duration-700 group-hover:scale-[1.035] group-hover:grayscale-0"
                  />
                  <div className="absolute left-3 top-3 border border-white/30 bg-black/70 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-[.14em] text-white">
                    Studio concept · {proj.category}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-5 border-b border-[#262626] py-5 sm:flex-row sm:items-end">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-mono uppercase tracking-[.18em] text-neutral-500">{proj.client} · Sample / concept</p>
                    <h3 className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-[#FF3030] sm:text-2xl">
                      {proj.title}
                    </h3>
                    <p className="max-w-xl text-xs leading-relaxed text-neutral-400">
                      {proj.deliverables}
                    </p>
                  </div>
                  <button type="button" onClick={() => navigate('portfolio')} aria-label={`View portfolio page for ${proj.title}`} className="inline-flex shrink-0 items-center gap-2 self-start text-xs font-semibold text-white hover:text-[#ff3030] sm:self-end">
                    View project <MoveUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-end">
            <button onClick={() => navigate('portfolio')} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-neutral-300 hover:text-white">View full portfolio <ArrowRight size={14} /></button>
          </div>
        </div>
      </section>

      <section id="services" className="border-b border-[#222] bg-[#0b0b0b] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-12 grid gap-6 lg:grid-cols-[.7fr_1.3fr] lg:items-end lg:gap-16">
            <p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">02 / What we make</p>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-3xl text-3xl font-semibold uppercase leading-[1.03] tracking-[-.05em] text-white sm:text-5xl">
                Creative built to travel across formats.
              </h2>
              <button onClick={() => navigate('services')} className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-neutral-300 hover:text-white">All services <MoveUpRight size={14} /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_SERVICES.map((service, index) => (
              <button key={service.id} onClick={() => navigate('contact')} className="group min-w-0 border-t border-[#2a2a2a] py-6 text-left transition-colors hover:border-[#ff3030] sm:py-7">
                <span className="flex items-start justify-between gap-4">
                  <span className="text-[10px] font-mono tracking-[.18em] text-[#ff3030]">0{index + 1} / {service.category}</span>
                  <MoveUpRight size={15} className="text-neutral-600 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
                </span>
                <span className="mt-7 block text-lg font-semibold leading-snug tracking-tight text-white group-hover:text-[#ff3030] sm:text-xl">{service.title}</span>
                <span className="mt-2 block max-w-sm text-xs leading-6 text-neutral-500">{service.description}</span>
              </button>
            ))}
          </div>
          <div className="mt-8 border-t border-[#2a2a2a] pt-5 text-xs text-neutral-500">Music artwork · artist branding · motion design · video · identity systems · documents · campaign production</div>
        </div>
      </section>

      <section id="ecosystem" className="border-b border-[#222] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-12 grid gap-6 lg:grid-cols-[.7fr_1.3fr] lg:items-end lg:gap-16">
            <p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">03 / The creative ecosystem</p>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-3xl text-3xl font-semibold leading-[1.03] tracking-[-.05em] text-white sm:text-5xl">
                Different worlds.<br /><span className="text-neutral-500">One considered point of view.</span>
              </h2>
              <button onClick={() => navigate('artists')} className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-neutral-300 hover:text-white">Meet the artists <MoveUpRight size={14} /></button>
            </div>
          </div>
          <div className="grid gap-8 md:grid-cols-12 md:items-end">
            <button onClick={() => navigate('artists')} className="group relative min-w-0 text-left md:col-span-7">
              <div className="relative aspect-[4/5] max-h-[720px] overflow-hidden border border-[#292929] bg-[#101010]">
                <img src={ARTISTS[0].image} alt={`${ARTISTS[0].name} sample artist profile`} loading="lazy" className="h-full w-full object-cover object-center grayscale-[35%] transition duration-700 group-hover:scale-[1.025] group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                <span className="absolute left-5 top-5 border border-white/30 bg-black/50 px-3 py-2 text-[9px] font-mono uppercase tracking-[.18em] text-white">Artist profile / sample</span>
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5 sm:p-8">
                  <div><p className="text-[10px] font-mono uppercase tracking-[.18em] text-[#ff3030]">{ARTISTS[0].genre}</p><h3 className="mt-2 text-2xl font-black uppercase leading-[.9] tracking-[-.04em] text-white sm:text-4xl">{ARTISTS[0].name}</h3></div>
                  <MoveUpRight size={21} className="shrink-0 text-white transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
              </div>
            </button>
            <div className="space-y-5 md:col-span-5 md:pb-2">
              <div className="flex items-center justify-between border-t border-[#292929] pt-4 text-[10px] font-mono uppercase tracking-[.18em] text-neutral-500">
                <span>Brand and business</span><span>Sample / concept</span>
              </div>
              <button onClick={() => navigate('portfolio')} className="group block w-full text-left">
                <div className="relative aspect-[5/4] overflow-hidden border border-[#292929] bg-[#101010]">
                  <img src={PORTFOLIO_ITEMS.find(item => item.category === 'brand')?.image || brandStationeryImg} alt="Sample KeedoHub brand identity and stationery project" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
                  <span className="absolute bottom-4 left-4 bg-[#080808]/85 px-3 py-2 text-[9px] font-mono uppercase tracking-[.15em] text-white">Identity / stationery / systems</span>
                </div>
                <span className="mt-4 flex items-center justify-between gap-3 text-lg font-semibold text-white group-hover:text-[#ff3030]">Brand worlds with a clear signature <ArrowRight size={15} /></span>
              </button>
              <p className="max-w-md text-sm leading-7 text-neutral-400">Artist identities and brand systems share the same foundation: clear direction, purposeful detail and consistency across every place the work appears.</p>
              <button onClick={() => navigate('artists')} className="inline-flex items-center gap-2 border-b border-[#555] pb-2 text-xs font-semibold uppercase tracking-[.12em] text-neutral-200 hover:border-[#ff3030] hover:text-white">Explore the ecosystem <ArrowRight size={14} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PRODUCTION PROCESS SECTION (01 - 04)
      ========================================================================= */}
      <section id="process" className="py-20 md:py-28 border-b border-[#1A1A1A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-2 mb-16">
            <span className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">
              WORKFLOW METHODOLOGY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase">
              A Disciplined Production Process.
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Engineered to take ambitious creative concepts to final multi-platform delivery without bottlenecks or design dilution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 01 */}
            <div className="space-y-3 p-5 bg-[#0D0D0D] border border-[#222222] rounded">
              <span className="text-3xl font-black text-[#FF1E1E] font-mono">01</span>
              <h4 className="text-base font-bold text-white uppercase tracking-tight">
                Creative Ingestion &amp; Archetype
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Share the intent, audience and formats. We align on scope and direction before production begins.
              </p>
            </div>

            {/* Step 02 */}
            <div className="space-y-3 p-5 bg-[#0D0D0D] border border-[#222222] rounded">
              <span className="text-3xl font-black text-white font-mono">02</span>
              <h4 className="text-base font-bold text-white uppercase tracking-tight">
                Precision Studio Execution
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Multi-layer canvas execution with high-contrast noir imagery, custom vector line art, letterspaced typography, and logo lockups.
              </p>
            </div>

            {/* Step 03 */}
            <div className="space-y-3 p-5 bg-[#0D0D0D] border border-[#222222] rounded">
              <span className="text-3xl font-black text-white font-mono">03</span>
              <h4 className="text-base font-bold text-white uppercase tracking-tight">
                Role-Based Approval
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Collaborative verification by Creative Directors, Label Managers, and Legal Affairs with live checklist validation and metadata sign-off.
              </p>
            </div>

            {/* Step 04 */}
            <div className="space-y-3 p-5 bg-[#0D0D0D] border border-[#222222] rounded">
              <span className="text-3xl font-black text-[#FF1E1E] font-mono">04</span>
              <h4 className="text-base font-bold text-white uppercase tracking-tight">
                Master Package Handover
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Immediate compilation of 300DPI print PDFs, vector SVGs, lossless PNGs, Blogger XML themes, and full archival ZIP packages.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="studio" className="relative overflow-hidden border-b border-[#222] bg-[#0b0b0b] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="pointer-events-none absolute -right-12 top-1/2 hidden -translate-y-1/2 select-none text-[26rem] font-black leading-none tracking-[-.14em] text-white/[.025] lg:block">K</div>
        <div className="relative mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">05 / KeedoHub Creative OS</p>
              <h2 className="mt-7 max-w-xl text-4xl font-black uppercase leading-[.9] tracking-[-.06em] text-white sm:text-6xl">Creative<br />work, in<br /><span className="text-[#ff3030]">good order.</span></h2>
            </div>
            <p className="mt-8 max-w-sm text-sm leading-7 text-neutral-400">A private client workspace connects the brief to the production — with clear progress, shared tasks, reviewed files and project updates in one place.</p>
          </div>
          <div className="border-t border-[#333]">
            {[
              ['01', 'Project brief & progress', 'Submit a request and follow its stage from intake through delivery.'],
              ['02', 'Tasks & deadlines', 'See client-visible milestones and the dates attached to your project.'],
              ['03', 'Deliverables & versions', 'Review published files, approve work or request a revision with feedback.'],
              ['04', 'Updates & notifications', 'Keep project changes, review requests and deadline reminders close at hand.'],
            ].map(([step, title, description]) => (
              <div key={step} className="grid gap-2 border-b border-[#292929] py-5 sm:grid-cols-[3rem_1fr_1.2fr] sm:items-start sm:gap-5">
                <span className="text-[10px] font-mono text-[#ff3030]">{step}</span>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="text-xs leading-6 text-neutral-500">{description}</p>
              </div>
            ))}
            <button onClick={() => isAuthenticated ? enterWorkspace() : loginWithGoogle()} className="mt-7 inline-flex min-h-12 items-center gap-3 bg-white px-5 py-3 text-sm font-bold text-black transition-colors hover:bg-[#ff3030] hover:text-white">
              {isAuthenticated ? 'Open your workspace' : 'Sign in or create an account'} <ArrowRight size={16} />
            </button>
            <p className="mt-3 text-[10px] leading-5 text-neutral-600">Google sign-in creates or opens your account. First-time clients choose Artist, Brand or Company during setup.</p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CLIENT WORKSPACES & AUTHENTICATION ENTRY CALLOUT
      ========================================================================= */}
      <section id="workspaces" className="border-b border-[#222] bg-[#101010] px-4 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">06 / Client workspace access</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold uppercase leading-[1.03] tracking-[-.05em] text-white sm:text-5xl">Your project. Your private production room.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400">Sign in with Google or create an account to set up an Artist, Brand or Company profile and start a project request.</p>
          </div>
          <button onClick={() => isAuthenticated ? enterWorkspace() : loginWithGoogle()} className="inline-flex min-h-14 items-center justify-center gap-3 bg-[#ff2929] px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-white hover:text-black">
            {isAuthenticated ? 'Open your workspace' : 'Sign in / create account'} <ArrowRight size={16} />
          </button>
          <p className="text-[10px] text-neutral-600 sm:col-span-2">Workspace access is private and tied to your authenticated account.</p>
        </div>
      </section>

      <section id="journal" className="border-b border-[#222] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div><p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">07 / Journal</p><h2 className="mt-4 text-3xl font-semibold uppercase tracking-[-.04em] text-white sm:text-5xl">Notes from the studio.</h2></div>
            <button onClick={() => navigate('journal')} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-neutral-300 hover:text-white">All stories <MoveUpRight size={14} /></button>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {BLOG_POSTS.slice(0, 2).map((post, index) => (
              <button key={post.id} onClick={() => navigate('article', post.id)} className={`group min-w-0 text-left ${index === 1 ? 'md:mt-16' : ''}`}>
                <div className="relative aspect-[16/10] overflow-hidden border border-[#292929] bg-[#101010]">
                  <img src={post.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
                  <span className="absolute left-4 top-4 bg-black/80 px-2.5 py-2 text-[9px] font-mono uppercase tracking-[.15em] text-white">{post.category} · Studio story</span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-5 border-b border-[#292929] pb-5">
                  <div><p className="text-[10px] font-mono uppercase tracking-[.15em] text-neutral-600">{post.date}</p><h3 className="mt-2 text-xl font-semibold leading-snug text-white group-hover:text-[#ff3030] sm:text-2xl">{post.title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">{post.excerpt}</p></div>
                  <MoveUpRight size={18} className="mt-1 shrink-0 text-neutral-500 group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-[#222] bg-[#0b0b0b] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">08 / Packages</p>
            <h2 className="mt-5 text-3xl font-semibold uppercase leading-[1.02] tracking-[-.05em] text-white sm:text-5xl">The right scale for the work.</h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-400">Explore the current package guide, then tell us what you are building. Scope and final pricing are confirmed through enquiry.</p>
            <button onClick={() => navigate('pricing')} className="mt-6 inline-flex items-center gap-2 border-b border-[#555] pb-2 text-xs font-semibold uppercase tracking-[.12em] text-neutral-200 hover:border-[#ff3030] hover:text-white">View packages &amp; details <ArrowRight size={14} /></button>
          </div>
          <div className="border-t border-[#303030]">
            {PRICING_PACKAGES.slice(0, 3).map((item, index) => (
              <button key={item.id} onClick={() => navigate('pricing')} className="group grid w-full gap-3 border-b border-[#303030] py-5 text-left sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:gap-5">
                <span className="text-[10px] font-mono text-[#ff3030]">0{index + 1}</span>
                <span><span className="block text-lg font-semibold text-white group-hover:text-[#ff3030]">{item.name}</span><span className="mt-1 block text-xs text-neutral-500">{item.audience} · {item.tier} · {item.deliverables.slice(0, 2).join(' / ')}</span></span>
                <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[.1em] text-neutral-500">Indicative <MoveUpRight size={14} /></span>
              </button>
            ))}
            <p className="pt-4 text-[10px] leading-5 text-neutral-600">Package and rate information is indicative. Confirm scope and pricing with KeedoHub before booking.</p>
          </div>
        </div>
      </section>

      <section id="contact" className="relative overflow-hidden border-b border-[#222] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="absolute right-0 top-0 hidden h-full w-[34%] border-l border-[#222] lg:block" />
        <div className="relative mx-auto grid max-w-[1400px] gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">09 / Next move</p><h2 className="mt-5 max-w-4xl text-4xl font-black uppercase leading-[.9] tracking-[-.06em] text-white sm:text-6xl lg:text-7xl">Have a good idea?<br /><span className="text-[#ff3030]">Let’s make it real.</span></h2><p className="mt-5 max-w-xl text-sm leading-7 text-neutral-400">Start with a project brief in your private workspace. We’ll take it from there.</p></div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('contact')} className="inline-flex min-h-12 items-center gap-3 bg-[#ff2929] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-black">Project enquiry <ArrowRight size={16} /></button>
            <button onClick={() => navigate('contact')} className="inline-flex min-h-12 items-center gap-3 border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:border-white">Contact details <MoveUpRight size={16} /></button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
      ========================================================================= */}
      <footer className="bg-[#080808] border-t border-[#191919] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="text-base font-black text-white tracking-tighter uppercase">
              KEEDO<span className="text-[#FF1E1E]">HUB</span>
            </span>
            <span>·</span>
            <span>CREATIVE PRODUCTION OS</span>
            <span>·</span>
            <span>LONDON · NEW YORK · LAGOS</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px]">
            <a href="#services" onClick={scrollToSection('services')} className="hover:text-white transition-colors">Services</a>
            <a href="#showcase" onClick={scrollToSection('showcase')} className="hover:text-white transition-colors">Portfolio</a>
            <a href="#process" onClick={scrollToSection('process')} className="hover:text-white transition-colors">Process</a>
            {publicPageLinks.map(({ label, route }) => (
              <button key={route} onClick={() => navigate(route)} className="hover:text-white transition-colors">
                {label}
              </button>
            ))}
            <button
              onClick={() => enterWorkspace()}
              className="hover:text-[#FF1E1E] transition-colors"
            >
              Client Access
            </button>
          </div>

          <div>
            &copy; {new Date().getFullYear()} KeedoHub Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
