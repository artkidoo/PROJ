/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Public Homepage & Creative Production Portal
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowRight, 
  Sparkles, 
  Disc3, 
  Layers, 
  Film, 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  LogIn, 
  LayoutDashboard, 
  Compass, 
  FileText, 
  Briefcase,
  ChevronRight,
  Globe
} from 'lucide-react';

export const PublicHomepage: React.FC = () => {
  const { 
    enterWorkspace, 
    loginWithGoogle, 
    isAuthenticated, 
    currentUser, 
    activeWorkspace,
    workspaces,
    switchWorkspace
  } = useApp();

  const [activeWorkFilter, setActiveWorkFilter] = useState<'all' | 'music' | 'brand' | 'motion'>('all');

  const creativeProjects = [
    {
      id: 'proj-01',
      title: 'Monolith Vinyl Master & Release Suite',
      category: 'music',
      client: 'LYRICAL ENT',
      year: '2026',
      deliverables: 'Vinyl 33⅓ RPM Press · Streaming Canvas · Single Cover Architecture',
      image: '/src/assets/images/vinyl_press_mockup_1792791744149.jpg',
      aspect: '4/3',
      targetModule: 'releases' as const
    },
    {
      id: 'proj-02',
      title: 'Atelier Brand Stationery & Corporate Suite',
      category: 'brand',
      client: 'Lyrical Entertainment Group',
      year: '2026',
      deliverables: 'Executive Letterhead · Legal Contract Layout · NFC Identity Cards',
      image: '/src/assets/images/lyrical_ent_brand_stationery_1792793391733.jpg',
      aspect: '4/3',
      targetModule: 'documents' as const
    },
    {
      id: 'proj-03',
      title: 'Noir Cinematic Artist Roster Campaign',
      category: 'music',
      client: 'KAYODE OLUWASEUN (K-FLOW)',
      year: '2026',
      deliverables: 'High-Contrast Photography · Billboard Campaign · Press Media Kit',
      image: '/src/assets/images/artist_showcase_portrait_1792791744296.jpg',
      aspect: '4/3',
      targetModule: 'artists' as const
    },
    {
      id: 'proj-04',
      title: 'Sound Labs Audio Acoustic Identity',
      category: 'motion',
      client: 'KeedoHub Sound Labs',
      year: '2026',
      deliverables: 'Soundwave Animation · Stage Visualizers · Motion Graphics Loop',
      image: '/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg',
      aspect: '4/3',
      targetModule: 'motion' as const
    }
  ];

  const filteredProjects = creativeProjects.filter(p => 
    activeWorkFilter === 'all' || p.category === activeWorkFilter
  );

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
      {/* =========================================================================
          TOP BAR CONTRACT
          Zone 1: Single element wordmark
          Zone 2: 4-5 single-line nav links
          Zone 3: Primary action button
      ========================================================================= */}
      <header className="sticky top-0 z-40 h-16 bg-[#080808]/90 backdrop-blur border-b border-[#1A1A1A] px-4 md:px-8">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="#top" 
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
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-neutral-400">
            <a href="#services" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Services</a>
            <a href="#showcase" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Selected Work</a>
            <a href="#process" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Production Process</a>
            <a href="#workspaces" className="hover:text-white transition-colors whitespace-nowrap shrink-0">Client Workspaces</a>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
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
                  onClick={() => enterWorkspace('ws-lyrical-ent')}
                  className="flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-[#E01818] text-white px-3.5 py-1.5 text-xs font-semibold rounded transition-all shadow-sm whitespace-nowrap active:scale-[0.98]"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION
      ========================================================================= */}
      <section id="top" className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[#1A1A1A] overflow-hidden">
        {/* Subtle grid background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,30,30,0.12),transparent)] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Kicker (Zero-Pill discipline: unboxed clean text) */}
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#FF1E1E] tracking-widest uppercase">
              <span className="w-1.5 h-1.5 bg-[#FF1E1E] rounded-full" />
              <span>THE CREATIVE PRODUCTION OPERATING SYSTEM</span>
              <span className="w-1.5 h-1.5 bg-[#FF1E1E] rounded-full" />
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white uppercase leading-[1.08] text-balance">
              Engineered for Artists, Labels &amp; Modern Brands.
            </h1>

            {/* Body */}
            <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              KeedoHub unifies high-contrast music artwork, vector brand architectures, motion visualizers, and managed production operations into dedicated, private client workspaces.
            </p>

            {/* Functional Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                onClick={() => enterWorkspace('ws-lyrical-ent')}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#FF1E1E] hover:bg-[#E01818] text-white px-6 py-3.5 text-sm font-semibold rounded transition-all shadow-lg shadow-[#FF1E1E]/20 active:scale-[0.98]"
              >
                <span>Enter Workspace</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => loginWithGoogle()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#1C1C1C] text-neutral-200 hover:text-white px-5 py-3.5 text-sm font-medium rounded border border-[#262626] transition-colors"
              >
                <LogIn size={15} />
                <span>Sign In with Google</span>
              </button>
            </div>

            {/* Trust and Feature Strip (No pills: clean unboxed typographic metadata) */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-500 font-mono">
              <span>16 Integrated Production Modules</span>
              <span aria-hidden="true">·</span>
              <span>8 Layout Composition Archetypes</span>
              <span aria-hidden="true">·</span>
              <span>Multi-Tenant Workspace Security</span>
              <span aria-hidden="true">·</span>
              <span>Lossless Print &amp; Streaming Handover</span>
            </div>
          </div>

          {/* Hero Visual Showcase Split */}
          <div className="mt-14 max-w-5xl mx-auto rounded-lg overflow-hidden border border-[#222222] bg-[#0E0E0E] shadow-2xl relative group">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img 
                src="/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg" 
                alt="KeedoHub Creative Production Atelier" 
                className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-[1.01] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />
              
              {/* Overlay Label Card */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 p-4 sm:p-6 bg-[#0E0E0E]/90 backdrop-blur border border-[#262626] rounded">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#FF1E1E]">
                    <span>CLIENT SPOTLIGHT</span>
                    <span>·</span>
                    <span>LYRICAL ENT ATELIER</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Full-Scale Music Release &amp; Brand Identity Deployment
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-lg">
                    Complete multi-format rollout comprising vinyl packaging, corporate documents, artist roster management, and Blogger Layout v3 web deployment.
                  </p>
                </div>

                <button
                  onClick={() => enterWorkspace('ws-lyrical-ent')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-semibold rounded transition-colors shrink-0"
                >
                  <span>Launch Live Workspace</span>
                  <ExternalLink size={13} />
                </button>
              </div>
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
                Real creative deliverables built, managed, and exported inside the KeedoHub workspace suite.
              </p>
            </div>

            {/* Filter segmented buttons (Functional interactive tabs) */}
            <div className="flex items-center gap-1 p-1 bg-[#121212] rounded border border-[#222222] self-start md:self-auto">
              <button
                onClick={() => setActiveWorkFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeWorkFilter === 'all' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Works
              </button>
              <button
                onClick={() => setActiveWorkFilter('music')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeWorkFilter === 'music' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Music &amp; Artists
              </button>
              <button
                onClick={() => setActiveWorkFilter('brand')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeWorkFilter === 'brand' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Brand &amp; Identity
              </button>
              <button
                onClick={() => setActiveWorkFilter('motion')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeWorkFilter === 'motion' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Motion &amp; Visuals
              </button>
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
            {filteredProjects.map((proj) => (
              <div 
                key={proj.id}
                className="group border border-[#222222] bg-[#0C0C0C] rounded overflow-hidden flex flex-col hover:border-neutral-500 transition-colors"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                  <img 
                    src={proj.image} 
                    alt={proj.title}
                    className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-[1.02] transition-transform duration-500" 
                  />
                  <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/80 backdrop-blur border border-[#333] text-[10px] font-mono text-white">
                    {proj.year}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                      <span>{proj.client}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#FF1E1E] uppercase">{proj.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-[#FF1E1E] transition-colors">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {proj.deliverables}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-500">
                      DELIVERABLE VERIFIED
                    </span>
                    <button
                      onClick={() => enterWorkspace('ws-lyrical-ent')}
                      className="flex items-center gap-1.5 text-xs font-medium text-white hover:text-[#FF1E1E] transition-colors"
                    >
                      <span>Explore In Studio</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SERVICES SECTION (4 CORE PILLARS)
      ========================================================================= */}
      <section id="services" className="py-20 md:py-28 border-b border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-2 mb-16">
            <span className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">
              CREATIVE CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white uppercase">
              Production Services Built for Impact.
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              From individual release campaigns to complete corporate branding and multi-format master asset delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: Artist & Music Creatives */}
            <div className="p-6 bg-[#0E0E0E] border border-[#222222] rounded flex flex-col justify-between space-y-6 hover:border-neutral-500 transition-colors">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded bg-[#171717] border border-[#292929] flex items-center justify-center text-[#FF1E1E]">
                  <Disc3 size={20} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Artist &amp; Music Creatives
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Single and album artwork, streaming canvas designs, anticipation campaigns, tracklist typography, and vinyl packaging.
                </p>
                <div className="space-y-1.5 pt-2 text-[11px] font-mono text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>EP &amp; LP Cover Architectures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Spotify &amp; Apple Canvas Stems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Out-Now Promotional Packs</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => enterWorkspace('ws-lyrical-ent')}
                className="text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 pt-4 border-t border-[#1C1C1C]"
              >
                <span>Launch Release Studio</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Pillar 2: Brand & Business Design */}
            <div className="p-6 bg-[#0E0E0E] border border-[#222222] rounded flex flex-col justify-between space-y-6 hover:border-neutral-500 transition-colors">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded bg-[#171717] border border-[#292929] flex items-center justify-center text-[#FF1E1E]">
                  <Briefcase size={20} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Brand &amp; Business Design
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  End-to-end corporate and label identities, 7-concept logo suites, brand guideline PDFs, business cards, and official legal agreements.
                </p>
                <div className="space-y-1.5 pt-2 text-[11px] font-mono text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Vector Brand Systems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Corporate Document Generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Executive NFC Business Cards</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => enterWorkspace('ws-lyrical-ent')}
                className="text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 pt-4 border-t border-[#1C1C1C]"
              >
                <span>View Identity Manager</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Pillar 3: Motion Design & Video Assets */}
            <div className="p-6 bg-[#0E0E0E] border border-[#222222] rounded flex flex-col justify-between space-y-6 hover:border-neutral-500 transition-colors">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded bg-[#171717] border border-[#292929] flex items-center justify-center text-[#FF1E1E]">
                  <Film size={20} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Motion &amp; Video Visuals
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Kinetic title animations, soundwave visualizers, tour lower-thirds, video teasers, and broadcast-ready event promotion loops.
                </p>
                <div className="space-y-1.5 pt-2 text-[11px] font-mono text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Animated Release Visualizers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Lower-Third Tour Graphics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Celebration Motion Assets</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => enterWorkspace('ws-lyrical-ent')}
                className="text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 pt-4 border-t border-[#1C1C1C]"
              >
                <span>Open Motion Studio</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Pillar 4: Managed Production Pipeline */}
            <div className="p-6 bg-[#0E0E0E] border border-[#222222] rounded flex flex-col justify-between space-y-6 hover:border-neutral-500 transition-colors">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded bg-[#171717] border border-[#292929] flex items-center justify-center text-[#FF1E1E]">
                  <Layers size={20} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Managed Production
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Centralized asset repositories, operation task management, multi-client workspace partitioning, and 1-click ZIP master packages.
                </p>
                <div className="space-y-1.5 pt-2 text-[11px] font-mono text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Isolated Client Workspaces</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Turnkey ZIP Master Handover</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={12} className="text-[#FF1E1E]" />
                    <span>Blogger Theme XML Compiler</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => enterWorkspace('ws-lyrical-ent')}
                className="text-xs font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 pt-4 border-t border-[#1C1C1C]"
              >
                <span>Access Operations Hub</span>
                <ChevronRight size={13} />
              </button>
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
                Intake of artist requirements, album narrative, and target format. Selection from 8 distinct layout archetypes (Cinematic, Editorial, Minimal, Street).
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

      {/* =========================================================================
          CLIENT WORKSPACES & AUTHENTICATION ENTRY CALLOUT
      ========================================================================= */}
      <section id="workspaces" className="py-20 md:py-28 border-b border-[#1A1A1A] bg-[#0A0A0A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#141414] to-[#0C0C0C] border border-[#292929] rounded-xl p-8 sm:p-12 text-center space-y-8 relative overflow-hidden shadow-2xl">
            {/* Top red accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF1E1E]" />

            <div className="space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-mono tracking-widest text-[#FF1E1E] uppercase">
                ENTERPRISE CLIENT ACCESS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
                Access Your Private Creative Workspace.
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Connect directly with your verified Google account or tour our official sample production suite configured with complete record label data.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => loginWithGoogle()}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#FF1E1E] hover:bg-[#E01818] text-white px-7 py-4 text-sm font-semibold rounded transition-all shadow-lg shadow-[#FF1E1E]/20 active:scale-[0.98]"
              >
                <LogIn size={16} />
                <span>Sign In with Google</span>
              </button>

              <button
                onClick={() => enterWorkspace('ws-lyrical-ent')}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white text-black hover:bg-neutral-200 px-6 py-4 text-sm font-semibold rounded transition-colors active:scale-[0.98]"
              >
                <LayoutDashboard size={16} />
                <span>Open LYRICAL ENT Studio</span>
              </button>
            </div>

            <div className="pt-4 border-t border-[#1F1F1F] flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#FF1E1E]" />
                <span>Zero-Trust Workspace Isolation</span>
              </div>
              <span aria-hidden="true">·</span>
              <span>Encrypted Cloud Storage</span>
              <span aria-hidden="true">·</span>
              <span>Local Offline Persistence</span>
            </div>
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

          <div className="flex items-center gap-6 text-[11px]">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#showcase" className="hover:text-white transition-colors">Portfolio</a>
            <a href="#process" className="hover:text-white transition-colors">Process</a>
            <button 
              onClick={() => enterWorkspace('ws-lyrical-ent')} 
              className="hover:text-[#FF1E1E] transition-colors"
            >
              Client Portal
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
