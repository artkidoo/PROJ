/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB - Public Homepage & Creative Production Portal
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowRight,
  LogIn,
  ExternalLink,
  ShieldCheck,
  Layers,
  LayoutGrid,
} from 'lucide-react';
import { PublicRoute } from './PublicHeader';

import vinylPressImg from '../../assets/images/vinyl_press_mockup_1792791744149.jpg';
import brandStationeryImg from '../../assets/images/lyrical_ent_brand_stationery_1792793391733.jpg';
import artistPortraitImg from '../../assets/images/artist_showcase_portrait_1792791744296.jpg';
import studioHeroImg from '../../assets/images/lyrical_ent_studio_hero_1792791743831.jpg';

interface Props {
  navigate: (r: PublicRoute, p?: string) => void;
}

export const PublicHomepage: React.FC<Props> = ({ navigate }) => {
  const { loginWithGoogle, enterWorkspace, isAuthenticated } = useApp();

  const portfolioItems = [
    { id: 'p1', title: 'Monolith Vinyl Master & Release Suite', category: 'Music', client: 'LYRICAL ENT (sample)', year: '2026', deliverables: 'Vinyl press artwork, Streaming canvas, Single cover architecture', image: vinylPressImg, sample: true },
    { id: 'p2', title: 'Atelier Brand Stationery & Corporate Suite', category: 'Brand', client: 'Lyrical Entertainment Group (sample)', year: '2026', deliverables: 'Executive letterhead, Legal contract layout, NFC identity cards', image: brandStationeryImg, sample: true },
    { id: 'p3', title: 'Noir Cinematic Artist Roster Campaign', category: 'Music', client: 'KAYODE OLUWASEUN (K-FLOW) (sample)', year: '2026', deliverables: 'High-contrast photography, Billboard campaign, Press media kit', image: artistPortraitImg, sample: true },
    { id: 'p4', title: 'Sound Labs Audio Acoustic Identity', category: 'Motion', client: 'KeedoHub Sound Labs (sample)', year: '2026', deliverables: 'Soundwave animation, Stage visualizers, Motion graphics loop', image: studioHeroImg, sample: true },
  ];

  const disciplines = [
    { id: 'music', title: 'Music & Artist Creative', description: 'Album and single cover systems, artist identity, visual language and release rollout assets.', category: 'Music' },
    { id: 'brand', title: 'Brand Identity & Design', description: 'Vector logo architectures, brand guidelines, colour systems and identity toolkits for ambitious brands.', category: 'Brand' },
    { id: 'motion', title: 'Motion & Visual Production', description: 'Soundwave visualizers, stage graphics, animated brand elements and motion graphics loops.', category: 'Motion' },
    { id: 'marketing', title: 'Marketing & Campaign Assets', description: 'Campaign graphics, ad creatives, social content systems and promotional rollout materials.', category: 'Marketing' },
    { id: 'corporate', title: 'Business & Corporate Creative', description: 'Executive letterheads, contracts, proposals, pitch decks and stationery suites.', category: 'Brand' },
    { id: 'digital', title: 'Digital Experiences', description: 'Editorial websites, blog publishing workflows and platform-specific digital assets.', category: 'Web' },
  ];

  const productionStages = [
    { step: '01', title: 'Discover', body: 'We listen, research and map the creative opportunity before a single pixel is placed.' },
    { step: '02', title: 'Direction', body: 'Editorial art direction defines the visual language, tone and production roadmap.' },
    { step: '03', title: 'Production', body: 'Assets are produced across print, digital, motion and streaming formats in parallel.' },
    { step: '04', title: 'Refinement', body: 'Every deliverable is reviewed, refined and pressure-tested against the original brief.' },
    { step: '05', title: 'Delivery', body: 'Final assets are packaged, delivered and archived, ready for release to the world.' },
  ];

  const journalItems = [
    { id: 'j1', title: 'The Anatomy of a Vinyl Press Campaign', category: 'Production', date: '2026-03-10', excerpt: 'From cutting lacquer to sleeve design, how a physical release comes together.', image: vinylPressImg },
    { id: 'j2', title: 'From Concept to Print: Corporate Collateral', category: 'Brand', date: '2026-01-22', excerpt: 'Building executive-grade documents that feel considered and on-brand.', image: brandStationeryImg },
  ];

  return (
    <div className="bg-[#080808] text-white antialiased selection:bg-[#FF1E1E] selection:text-white">

      <section id="top" className="relative min-h-screen flex flex-col justify-end overflow-hidden px-4 sm:px-6 lg:px-8 pb-12 lg:pb-20">
        <div className="absolute top-0 right-0 w-[1px] h-full bg-[#1A1A1A]" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#1A1A1A]" />
        <div className="absolute top-1/2 left-8 w-8 h-[1px] bg-[#FF1E1E]" />
        <div className="max-w-[1440px] mx-auto w-full">
          <div className="flex items-end justify-between mb-8 lg:mb-12">
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#FF1E1E] opacity-80">Creative Production</span>
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-600">EST. 2024 / Lagos - London - LA</span>
          </div>
          <h1 className="text-[12vw] md:text-[10vw] lg:text-[9vw] font-black leading-[0.85] tracking-tighter text-white">
            IDEAS<br />
            DESERVE<br />
            <span className="text-[#FF1E1E]">EXTRAORDINARY</span><br />
            EXECUTION.
          </h1>
          <div className="mt-8 lg:mt-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-[38rem]">
              KeedoHub is a creative production company for artists, musicians, record labels, brands and businesses.
              From vinyl press architecture to streaming platform graphics, brand identity to motion visualizers.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#portfolio" onClick={() => navigate('portfolio')} className="inline-flex items-center gap-3 bg-[#FF1E1E] hover:bg-[#E01E1E] text-white px-8 py-4 rounded font-bold tracking-tight transition-colors">
                Explore Our Work <ArrowRight size={16} />
              </a>
              <a href="#contact" onClick={() => navigate('contact')} className="inline-flex items-center gap-3 border border-[#242424] hover:border-[#FF1E1E] text-white hover:text-[#FF1E1E] px-8 py-4 rounded font-medium tracking-tight transition-colors">
                Start a Project <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>
      <section id="portfolio" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-baseline justify-between mb-16 lg:mb-24">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Selected Production</h2>
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-600">Sample / Concept Work</span>
          </div>
          <div className="relative group mb-8 lg:mb-12">
            <div className="relative h-[60vh] lg:h-[75vh] bg-black overflow-hidden">
              <img src={portfolioItems[0].image} alt={portfolioItems[0].title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12">
                <div className="max-w-[1440px] mx-auto">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF1E1E] mb-2 block">Music · Sample / Concept</span>
                  <h3 className="text-2xl md:text-4xl font-bold text-white mb-2">{portfolioItems[0].title}</h3>
                  <p className="text-neutral-400 text-sm max-w-[38rem]">{portfolioItems[0].deliverables}</p>
                  <span className="text-[10px] font-mono text-neutral-600 mt-4 block">{portfolioItems[0].client} · {portfolioItems[0].year}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-5 relative group">
              <div className="relative h-[40vh] lg:h-[50vh] bg-black overflow-hidden">
                <img src={portfolioItems[1].image} alt={portfolioItems[1].title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-8">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF1E1E] mb-1 block">Brand · Sample / Concept</span>
                  <h4 className="text-xl font-bold text-white">{portfolioItems[1].title}</h4>
                  <p className="text-neutral-500 text-sm mt-1">{portfolioItems[1].deliverables}</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 relative group mt-0 lg:mt-24">
              <div className="relative h-[30vh] lg:h-[40vh] bg-black overflow-hidden">
                <img src={portfolioItems[2].image} alt={portfolioItems[2].title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF1E1E] mb-1 block">Music · Sample / Concept</span>
                  <h4 className="text-lg font-bold text-white">{portfolioItems[2].title}</h4>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 relative group">
              <div className="relative h-[35vh] lg:h-[45vh] bg-black overflow-hidden">
                <img src={portfolioItems[3].image} alt={portfolioItems[3].title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-8">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF1E1E] mb-1 block">Motion · Sample / Concept</span>
                  <h4 className="text-xl font-bold text-white">{portfolioItems[3].title}</h4>
                  <p className="text-neutral-500 text-sm mt-1">{portfolioItems[3].deliverables}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-16 lg:mt-24">
            <a href="#portfolio" onClick={() => navigate('portfolio')} className="inline-flex items-center gap-2 text-[#FF1E1E] hover:text-white transition-colors">
              View Full Portfolio <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>
      <section id="services" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A1A]">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-16 lg:mb-24">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">What We Create</h2>
            <p className="text-neutral-400 text-lg max-w-[38rem] leading-relaxed">
              Six creative production disciplines. One organised partner. Everything produced in-house.
            </p>
          </div>
          <div className="border-t border-[#1A1A1A]">
            {disciplines.map((d, i) => (
              <div key={d.id} className="group border-b border-[#1A1A1A] py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-baseline hover:bg-[#0A0A0A] transition-colors px-4 -mx-4">
                <div className="lg:col-span-1">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-600 group-hover:text-[#FF1E1E] transition-colors">0{i + 1}</span>
                </div>
                <div className="lg:col-span-4">
                  <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-[#FF1E1E] transition-colors">{d.title}</h3>
                </div>
                <div className="lg:col-span-4">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-600 group-hover:text-neutral-400 transition-colors">{d.category}</span>
                </div>
                <div className="lg:col-span-3">
                  <p className="text-neutral-500 text-sm leading-relaxed group-hover:text-neutral-400 transition-colors">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="process" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A1A]">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-16 lg:mb-24">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">The Production Approach</h2>
            <p className="text-neutral-400 text-lg max-w-[38rem] leading-relaxed">How an idea becomes a finished creative output.</p>
          </div>
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-8 lg:left-1/2 w-[1px] bg-[#1A1A1A]" />
            {productionStages.map((stage, i) => (
              <div key={stage.step} className={`relative flex flex-col lg:flex-row gap-8 lg:gap-16 mb-16 lg:mb-24 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="lg:w-1/2 pl-16 lg:pl-0">
                  <div className={`lg:px-12 ${i % 2 === 1 ? 'lg:text-right' : ''}`}>
                    <span className="text-[10px] font-mono tracking-widest text-[#FF1E1E] block mb-2">{stage.step}</span>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{stage.title}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed max-w-[28rem] inline-block">{stage.body}</p>
                  </div>
                </div>
                <div className="hidden lg:block lg:w-1/2" />
                <div className="absolute left-6 lg:left-1/2 top-0 w-4 h-4 rounded-full bg-[#FF1E1E] -translate-x-1/2 z-10" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="artists" className="py-24 lg:py-36 border-t border-[#1A1A1A]">
        <div className="relative h-[70vh] lg:h-[85vh] overflow-hidden">
          <img src={artistPortraitImg} alt="KAYODE OLUWASEUN (K-FLOW)" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 flex items-end lg:items-center">
            <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-0">
              <div className="max-w-[38rem]">
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF1E1E] mb-4 block">Artist · Afrobeats / Hip-Hop · Sample / Concept</span>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.9] mb-6">
                  KAYODE<br />OLUWASEUN<br />(K-FLOW)
                </h2>
                <p className="text-neutral-400 text-sm leading-relaxed mb-8 max-w-[28rem]">
                  Sample artist profile showcasing visual identity and release rollout creative.
                </p>
                <a href="#artists" onClick={() => navigate('artists')} className="inline-flex items-center gap-2 text-[#FF1E1E] hover:text-white transition-colors">
                  Explore Artists <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="capabilities" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A1A]">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-6">One Partner.<br />Every Format.</h2>
              <p className="text-neutral-400 text-lg leading-relaxed">
                KeedoHub operates as both a creative production company and an internal production environment.
                Every project moves through a single organised workflow.
              </p>
            </div>
            <div className="lg:col-span-7">
              <div className="space-y-0">
                <div className="border-t border-[#1A1A1A] py-8 group">
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-[10px] font-mono tracking-widest text-[#FF1E1E]">01</span>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#FF1E1E] transition-colors">Creative Direction</h3>
                  </div>
                  <p className="text-neutral-500 text-sm leading-relaxed pl-8 max-w-[38rem]">Editorial art direction that defines a distinct visual language for every client.</p>
                </div>
                <div className="border-t border-[#1A1A1A] py-8 group">
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-[10px] font-mono tracking-widest text-[#FF1E1E]">02</span>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#FF1E1E] transition-colors">Consistent Brand Quality</h3>
                  </div>
                  <p className="text-neutral-500 text-sm leading-relaxed pl-8 max-w-[38rem]">One team, one standard across print, digital, motion and streaming.</p>
                </div>
                <div className="border-t border-[#1A1A1A] py-8 group border-b border-[#1A1A1A]">
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-[10px] font-mono tracking-widest text-[#FF1E1E]">03</span>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#FF1E1E] transition-colors">Organised Production</h3>
                  </div>
                  <p className="text-neutral-500 text-sm leading-relaxed pl-8 max-w-[38rem]">Internal workspace tracks every deliverable, revision and deadline in real time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="journal" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A1A]">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-16 lg:mb-24">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">From the Studio Desk</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7">
              <article className="group">
                <div className="relative h-[40vh] lg:h-[50vh] bg-black overflow-hidden mb-6">
                  <img src={journalItems[0].image} alt={journalItems[0].title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF1E1E] mb-2 block">{journalItems[0].category}</span>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#FF1E1E] transition-colors">{journalItems[0].title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed max-w-[38rem]">{journalItems[0].excerpt}</p>
                <span className="text-[10px] font-mono text-neutral-600 mt-4 block">{new Date(journalItems[0].date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </article>
            </div>
            <div className="lg:col-span-5 lg:pt-24">
              <article className="group">
                <div className="relative h-[30vh] lg:h-[35vh] bg-black overflow-hidden mb-6">
                  <img src={journalItems[1].image} alt={journalItems[1].title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#FF1E1E] mb-2 block">{journalItems[1].category}</span>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#FF1E1E] transition-colors">{journalItems[1].title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{journalItems[1].excerpt}</p>
                <span className="text-[10px] font-mono text-neutral-600 mt-4 block">{new Date(journalItems[1].date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </article>
            </div>
          </div>
          <div className="mt-16 lg:mt-24">
            <a href="#journal" onClick={() => navigate('journal')} className="inline-flex items-center gap-2 text-[#FF1E1E] hover:text-white transition-colors">
              Read Journal <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>
      <section id="contact" className="py-24 lg:py-36 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A1A]">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-12 lg:mb-16">
            <h2 className="text-[10vw] md:text-[8vw] lg:text-[7vw] font-black tracking-tighter text-white leading-[0.85]">
              LET'S MAKE<br />
              <span className="text-[#FF1E1E]">SOMETHING</span><br />
              MATTER.
            </h2>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <p className="text-neutral-400 text-lg max-w-[38rem] leading-relaxed">
              Ready to turn your idea into a professionally executed creative output?
              Start a project with KeedoHub today.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#contact" onClick={() => navigate('contact')} className="inline-flex items-center gap-3 bg-[#FF1E1E] hover:bg-[#E01E1E] text-white px-10 py-5 rounded font-bold tracking-tight transition-colors">
                Start a Project <ArrowRight size={18} />
              </a>
              <a href="mailto:hello@keedohub.com" className="inline-flex items-center gap-3 border border-[#242424] hover:border-[#FF1E1E] text-white hover:text-[#FF1E1E] px-10 py-5 rounded font-medium tracking-tight transition-colors">
                hello@keedohub.com <ExternalLink size={16} />
              </a>
            </div>
          </div>
          <div className="mt-16 lg:mt-24 pt-8 border-t border-[#1A1A1A] grid grid-cols-2 md:grid-cols-4 gap-8 text-[10px] font-mono tracking-widest uppercase text-neutral-600">
            <div>
              <span className="block text-white font-bold mb-2">Studio</span>
              <span>KEEDOHUB CREATIVE OS</span>
            </div>
            <div>
              <span className="block text-white font-bold mb-2">Location</span>
              <span>Lagos · London · Los Angeles</span>
            </div>
            <div>
              <span className="block text-white font-bold mb-2">Contact</span>
              <span>hello@keedohub.com</span>
            </div>
            <div>
              <span className="block text-white font-bold mb-2">Follow</span>
              <div className="flex gap-3">
                <a href="#" className="text-neutral-400 hover:text-white">@keedohub</a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-[#1A1A1A] bg-[#060606]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <span className="text-lg font-black tracking-tighter text-white uppercase">
                  KEEDO<span className="text-[#FF1E1E]">HUB</span>
                </span>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-[20rem]">
                Creative production company and operating system for artists, musicians, record labels, brands and businesses.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 tracking-tighter uppercase text-[10px]">Services</h4>
              <ul className="space-y-3 text-neutral-500 text-sm">
                <li><a href="#services" onClick={() => navigate('services')} className="hover:text-white transition-colors">Brand Identity & Design</a></li>
                <li><a href="#services" onClick={() => navigate('services')} className="hover:text-white transition-colors">Music & Artist Creative</a></li>
                <li><a href="#services" onClick={() => navigate('services')} className="hover:text-white transition-colors">Motion & Visual Production</a></li>
                <li><a href="#services" onClick={() => navigate('services')} className="hover:text-white transition-colors">Marketing & Campaign Assets</a></li>
                <li><a href="#services" onClick={() => navigate('services')} className="hover:text-white transition-colors">Business & Corporate Creative</a></li>
                <li><a href="#services" onClick={() => navigate('services')} className="hover:text-white transition-colors">Digital Experiences</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 tracking-tighter uppercase text-[10px]">Portfolio</h4>
              <ul className="space-y-3 text-neutral-500 text-sm">
                <li><a href="#portfolio" onClick={() => navigate('portfolio')} className="hover:text-white transition-colors">Selected Production</a></li>
                <li><a href="#artists" onClick={() => navigate('artists')} className="hover:text-white transition-colors">Artists & Releases</a></li>
                <li><a href="#journal" onClick={() => navigate('journal')} className="hover:text-white transition-colors">Journal & Insights</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 tracking-tighter uppercase text-[10px]">Company</h4>
              <ul className="space-y-3 text-neutral-500 text-sm">
                <li><a href="#top" onClick={() => navigate('home')} className="hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" onClick={() => navigate('contact')} className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#contact" onClick={() => navigate('contact')} className="hover:text-white transition-colors">Pricing</a></li>
                <li>
                  <button onClick={() => loginWithGoogle()} className="hover:text-white transition-colors flex items-center gap-2 text-[#FF1E1E]">
                    Client Sign In <LogIn size={12} />
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1A1A1A] pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              © {new Date().getFullYear()} KeedoHub Technologies. All rights reserved.
            </div>
            <div className="flex gap-8 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Refund & Revision Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
