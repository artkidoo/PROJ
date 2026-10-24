import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MusicRelease, Artist, PressRelease } from '../../types';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Share2, 
  ExternalLink, 
  Search, 
  Download, 
  Disc, 
  Music, 
  User, 
  Radio, 
  ChevronRight, 
  Check, 
  Copy, 
  Send, 
  X, 
  Clock, 
  Calendar, 
  ArrowUpRight,
  Maximize2,
  Tv,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { LyricalMonogram, LyricalPrimaryLogo, LyricalHorizontalLogo } from '../brand/LogoSystem';

export const BloggerWebsitePreview: React.FC = () => {
  const { bloggerSettings, releases, artists, pressReleases } = useApp();

  // Viewport simulator
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');

  // Interactive Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(24);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active Modals
  const [activeReleaseModal, setActiveReleaseModal] = useState<MusicRelease | null>(null);
  const [activeArtistModal, setActiveArtistModal] = useState<Artist | null>(null);
  const [activeDispatchModal, setActiveDispatchModal] = useState<PressRelease | null>(null);

  // Demo Submission Form State
  const [demoArtistName, setDemoArtistName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoGenre, setDemoGenre] = useState('');
  const [demoTrackTitle, setDemoTrackTitle] = useState('');
  const [demoStreamUrl, setDemoStreamUrl] = useState('');
  const [demoNotes, setDemoNotes] = useState('');
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoSubmissionId, setDemoSubmissionId] = useState('');

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Featured Release
  const featuredRelease = releases.find(r => r.id === bloggerSettings.featuredReleaseId) || releases[0];

  // Audio player simulation timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleCopyTrackLink = (title: string) => {
    const fakeUrl = `https://lyricalent.com/releases/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}`;
    navigator.clipboard.writeText(fakeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoArtistName || !demoEmail || !demoStreamUrl) {
      alert('Please fill in Artist Name, Contact Email, and Streaming Demo URL.');
      return;
    }
    const trackingId = `DEMO-LYR-${Math.floor(100000 + Math.random() * 900000)}`;
    setDemoSubmissionId(trackingId);
    setDemoSubmitted(true);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setNewsletterSuccess(false);
    }, 4000);
  };

  // Filtered releases
  const filteredReleases = releases.filter(r => {
    const matchesSearch = searchQuery === '' || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.producer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFormat = selectedFormat === 'ALL' || r.type.toUpperCase() === selectedFormat;
    return matchesSearch && matchesFormat;
  });

  // Filtered artists
  const filteredArtists = artists.filter(a => {
    return searchQuery === '' || 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.bio.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Device Viewport Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0A0A0A] border border-[#222222] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            PUBLIC BLOGGER WEBSITE SIMULATOR
          </span>
          <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
            · BENTO LAYOUT V3
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-[#141414] border border-[#2B2B2B] rounded">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                deviceView === 'desktop' ? 'bg-[#2A2A2A] text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Desktop 100% View"
            >
              <Monitor size={12} />
              <span className="hidden md:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDeviceView('tablet')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                deviceView === 'tablet' ? 'bg-[#2A2A2A] text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Tablet 768px View"
            >
              <Tablet size={12} />
              <span className="hidden md:inline">Tablet</span>
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                deviceView === 'mobile' ? 'bg-[#2A2A2A] text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Mobile 390px View"
            >
              <Smartphone size={12} />
              <span className="hidden md:inline">Mobile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Website Viewport Frame Container */}
      <div className="flex justify-center bg-[#050505] p-2 sm:p-4 rounded-xl border border-[#1A1A1A] overflow-hidden min-h-[850px]">
        <div 
          className={`transition-all duration-300 bg-[#000000] text-white border border-[#242424] shadow-2xl relative ${
            deviceView === 'desktop' ? 'w-full' :
            deviceView === 'tablet' ? 'w-[768px] rounded-lg' : 'w-[390px] rounded-2xl'
          }`}
          style={{ minHeight: '800px' }}
        >
          {/* ================= WEBSITE HEADER ================= */}
          <header className="sticky top-0 z-40 bg-[#000000]/95 backdrop-blur-md border-b border-[#222222]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
              {/* Brand Logo & Tagline */}
              <div className="flex items-center gap-3">
                <a href="#featured" className="flex items-center gap-2.5 group">
                  <div className="w-9 h-9 border-2 border-white flex items-center justify-center font-mono font-black text-sm tracking-tighter bg-black text-white group-hover:bg-white group-hover:text-black transition-colors">
                    LE
                  </div>
                  <div>
                    <span className="font-mono font-extrabold text-sm sm:text-base tracking-[0.16em] uppercase block">
                      {bloggerSettings.siteTitle}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-400 tracking-[0.2em] uppercase block">
                      SOUND LABS &amp; RECORD LABEL
                    </span>
                  </div>
                </a>
              </div>

              {/* Desktop Nav Links */}
              {deviceView !== 'mobile' && (
                <nav className="hidden lg:flex items-center gap-6 font-mono text-[11px] tracking-wider uppercase text-neutral-300">
                  <a href="#releases" className="hover:text-white transition-colors">Catalog</a>
                  <a href="#artists" className="hover:text-white transition-colors">Roster</a>
                  <a href="#news" className="hover:text-white transition-colors">Dispatches</a>
                  <a href="#videos" className="hover:text-white transition-colors">Film</a>
                  <a href="#about" className="hover:text-white transition-colors">Ethos</a>
                  <a href="#demo-submission" className="hover:text-white transition-colors text-white font-bold border-b border-white pb-0.5">
                    Demo Submissions
                  </a>
                </nav>
              )}

              {/* Search Bar & Mobile Nav Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search catalog..."
                    className="w-28 sm:w-44 bg-[#0D0D0D] border border-[#262626] rounded px-2.5 py-1.5 text-[11px] font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-neutral-400 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {deviceView === 'mobile' && (
                  <button 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-1.5 border border-[#2B2B2B] rounded bg-[#111111] text-white"
                  >
                    <Radio size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && deviceView === 'mobile' && (
              <div className="p-4 bg-[#0A0A0A] border-b border-[#242424] space-y-3 font-mono text-xs uppercase tracking-wider">
                <a 
                  href="#releases" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-neutral-300 hover:text-white border-b border-[#1A1A1A]"
                >
                  Catalog &amp; Releases
                </a>
                <a 
                  href="#artists" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-neutral-300 hover:text-white border-b border-[#1A1A1A]"
                >
                  Artist Roster
                </a>
                <a 
                  href="#news" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-neutral-300 hover:text-white border-b border-[#1A1A1A]"
                >
                  Dispatches &amp; News
                </a>
                <a 
                  href="#about" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-neutral-300 hover:text-white border-b border-[#1A1A1A]"
                >
                  About &amp; Constitution
                </a>
                <a 
                  href="#demo-submission" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-white font-bold"
                >
                  Submit Demo to A&amp;R →
                </a>
              </div>
            )}
          </header>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16">
            {/* ================= HERO & FEATURED RELEASE BENTO ================= */}
            <section id="featured" className="border border-[#222222] bg-[#0A0A0A] p-6 sm:p-8 rounded-lg relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Column: Billboard Text & Actions (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-widest uppercase bg-white text-black">
                      INDEPENDENT RECORD LABEL
                    </span>
                    <span className="font-mono text-[10px] tracking-wider text-neutral-400">
                      LONDON · LOS ANGELES
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase leading-[1.05]">
                    {bloggerSettings.heroHeadline}
                  </h1>

                  <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-sans max-w-xl">
                    {bloggerSettings.heroSubheadline}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="#releases"
                      className="px-5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase bg-white text-black hover:bg-neutral-200 transition-colors"
                    >
                      {bloggerSettings.heroButtonText}
                    </a>
                    <a
                      href="#demo-submission"
                      className="px-5 py-2.5 text-xs font-mono font-bold tracking-wider uppercase border border-[#333333] hover:border-white text-white transition-colors"
                    >
                      Submit Demo to A&amp;R
                    </a>
                  </div>

                  {/* Acoustic Specs Strip */}
                  <div className="pt-4 border-t border-[#1C1C1C] grid grid-cols-3 gap-3 text-left font-mono">
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">Acoustic Specs</div>
                      <div className="text-xs font-bold text-neutral-200">24-Bit / 96kHz</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">Analog Master</div>
                      <div className="text-xs font-bold text-neutral-200">1/2-Inch ATR Tape</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase">Physical Pressing</div>
                      <div className="text-xs font-bold text-neutral-200">180g Heavy Vinyl</div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Featured Release Spotlight Card (5 cols) */}
                {featuredRelease && (
                  <div className="lg:col-span-5 bg-[#000000] border border-[#262626] p-5 rounded space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-[#1C1C1C]">
                      <span className="font-mono text-[10px] tracking-wider text-white font-bold uppercase bg-[#171717] px-2 py-0.5 border border-[#2D2D2D]">
                        LEAD MASTER RELEASE
                      </span>
                      <span className="font-mono text-[10px] text-neutral-400">
                        {featuredRelease.isrc || 'US-LYR-26-00101'}
                      </span>
                    </div>

                    {/* Artwork Container */}
                    <div className="relative aspect-square bg-[#0E0E0E] border border-[#222222] overflow-hidden flex flex-col items-center justify-center p-6 text-center group">
                      <div className="w-16 h-16 border-2 border-white flex items-center justify-center font-mono font-black text-2xl tracking-tighter mb-3">
                        LE
                      </div>
                      <div className="font-mono font-extrabold text-lg text-white uppercase tracking-tight">
                        {featuredRelease.title}
                      </div>
                      <div className="font-mono text-xs text-neutral-400 uppercase tracking-widest mt-1">
                        {featuredRelease.artistName}
                      </div>
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-mono bg-black/80 border border-white/20 text-neutral-300">
                        {featuredRelease.type}
                      </div>
                    </div>

                    {/* Metadata & Credits */}
                    <div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-neutral-400 mb-1">
                        <span>RELEASE DATE: {featuredRelease.plannedReleaseDate}</span>
                        <span className="text-white font-bold">{featuredRelease.distributionStatus}</span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {featuredRelease.credits || 'Recorded at LYRICAL Sound Lab A, London. Mastered by Sterling Sound.'}
                      </p>
                    </div>

                    {/* Interactive Master Audio Player Simulator */}
                    <div className="p-3 bg-[#0A0A0A] border border-[#222222] rounded space-y-2">
                      <div className="flex items-center justify-between font-mono text-[10px] text-neutral-400">
                        <span className="text-white font-semibold">MASTER STREAM PREVIEW</span>
                        <span>{isPlaying ? '0:42 / 3:18' : 'READY TO PLAY'}</span>
                      </div>

                      {/* Waveform / Progress bar */}
                      <div 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          setAudioProgress(Math.min(100, Math.max(0, (clickX / rect.width) * 100)));
                        }}
                        className="w-full h-2 bg-[#1C1C1C] rounded-full overflow-hidden cursor-pointer relative"
                      >
                        <div 
                          className="h-full bg-white transition-all duration-200"
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-7 h-7 rounded bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors"
                          >
                            {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                          </button>
                          <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-neutral-400 hover:text-white p-1"
                          >
                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                          </button>
                        </div>

                        <span className="font-mono text-[10px] text-neutral-400">
                          {isPlaying ? 'STREAMING ACTIVE' : 'HIGH-RES 24-BIT'}
                        </span>
                      </div>
                    </div>

                    {/* DSP & Share Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[10px]">
                      {/* WhatsApp Real Share */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Listen to "${featuredRelease.title}" by ${featuredRelease.artistName} on LYRICAL ENT: https://lyricalent.com/releases/${featuredRelease.id}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-[#141414] border border-[#2B2B2B] text-white hover:border-white rounded transition-colors flex items-center gap-1.5"
                      >
                        <Share2 size={11} />
                        <span>WhatsApp</span>
                      </a>

                      {/* X / Twitter */}
                      <a
                        href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                          `Now listening to "${featuredRelease.title}" by ${featuredRelease.artistName} via @lyricalent`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-[#141414] border border-[#2B2B2B] text-white hover:border-white rounded transition-colors"
                      >
                        X / Tweet
                      </a>

                      {/* Copy Link */}
                      <button
                        onClick={() => handleCopyTrackLink(featuredRelease.title)}
                        className="px-2.5 py-1.5 bg-[#141414] border border-[#2B2B2B] text-white hover:border-white rounded transition-colors flex items-center gap-1"
                      >
                        {copiedLink ? <Check size={11} className="text-white" /> : <Copy size={11} />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Full Info Modal */}
                      <button
                        onClick={() => setActiveReleaseModal(featuredRelease)}
                        className="px-2.5 py-1.5 bg-white text-black font-bold rounded hover:bg-neutral-200 transition-colors"
                      >
                        Full Credits
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ================= RELEASES CATALOG BENTO ================= */}
            <section id="releases" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222222] pb-4">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase mb-1">
                    OFFICIAL DISCOGRAPHY
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">
                    Label Catalog Releases
                  </h2>
                </div>

                {/* Format Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                  {['ALL', 'SINGLE', 'EP', 'ALBUM', 'MUSIC VIDEO'].map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      className={`px-3 py-1 rounded transition-colors ${
                        selectedFormat === fmt 
                          ? 'bg-white text-black font-bold' 
                          : 'bg-[#121212] border border-[#242424] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReleases.map(rel => (
                  <div 
                    key={rel.id} 
                    className="bg-[#0A0A0A] border border-[#202020] hover:border-[#383838] transition-all p-5 rounded-lg flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-3">
                        <span className="px-2 py-0.5 bg-[#171717] border border-[#262626] text-white uppercase">
                          {rel.type}
                        </span>
                        <span>{rel.plannedReleaseDate}</span>
                      </div>

                      {/* Card Artwork / Geometric Monogram */}
                      <div className="aspect-square w-full bg-[#111111] border border-[#222222] rounded flex flex-col items-center justify-center p-4 mb-4 relative overflow-hidden">
                        <div className="w-12 h-12 border border-white flex items-center justify-center font-mono font-bold text-lg mb-2 text-white">
                          LE
                        </div>
                        <div className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                          {rel.artistName}
                        </div>
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 font-mono text-[9px] text-neutral-300">
                          {rel.distributionStatus}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-neutral-200 transition-colors">
                        {rel.title}
                      </h3>
                      <div className="text-xs font-mono text-neutral-400 mt-0.5">
                        {rel.artistName}
                      </div>

                      <p className="text-xs text-neutral-400 mt-2.5 line-clamp-2 leading-relaxed">
                        {rel.credits || `Produced by ${rel.producer}. Engineered at LYRICAL Sound Labs.`}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between">
                      <button
                        onClick={() => setActiveReleaseModal(rel)}
                        className="text-xs font-mono text-white hover:underline flex items-center gap-1"
                      >
                        <span>Listen &amp; Credits</span>
                        <ChevronRight size={12} />
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Listen to ${rel.title} by ${rel.artistName} on LYRICAL ENT`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-[#1A1A1A] transition-colors"
                        title="Share on WhatsApp"
                      >
                        <Share2 size={13} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ================= ARTIST ROSTER BENTO ================= */}
            <section id="artists" className="space-y-6">
              <div className="flex items-end justify-between border-b border-[#222222] pb-4">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase mb-1">
                    SIGNED ARTISTS &amp; PRODUCERS
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">
                    The Artist Roster
                  </h2>
                </div>
                <div className="font-mono text-xs text-neutral-400">
                  {filteredArtists.length} ARTISTS IN RESIDENCE
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArtists.map(artist => (
                  <div 
                    key={artist.id}
                    className="bg-[#0A0A0A] border border-[#202020] hover:border-[#383838] p-5 rounded-lg flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-3">
                        <span className="text-white font-bold tracking-wider">{artist.genre}</span>
                        <span className="px-1.5 py-0.5 bg-[#141414] border border-[#262626]">
                          {artist.status}
                        </span>
                      </div>

                      {/* Monochrome Silhouette / Avatar */}
                      <div className="h-44 w-full bg-[#121212] border border-[#222222] rounded flex flex-col items-center justify-center p-4 mb-4 text-center">
                        <User size={36} className="text-neutral-500 mb-2" />
                        <div className="font-mono font-bold text-base text-white uppercase">
                          {artist.name}
                        </div>
                        {artist.moniker && (
                          <div className="font-mono text-[11px] text-neutral-400">
                            "{artist.moniker}"
                          </div>
                        )}
                        <div className="font-mono text-[10px] text-neutral-500 mt-2">
                          {artist.location || 'London / Los Angeles'}
                        </div>
                      </div>

                      <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                        {artist.bio}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between">
                      <span className="font-mono text-[10px] text-neutral-400">
                        {artist.releaseIds?.length || 1} Catalog Releases
                      </span>
                      <button
                        onClick={() => setActiveArtistModal(artist)}
                        className="px-3 py-1.5 text-xs font-mono bg-white text-black hover:bg-neutral-200 rounded font-bold transition-colors"
                      >
                        View Profile →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ================= EDITORIAL DISPATCHES & BLOG1 SIMULATOR ================= */}
            <section id="news" className="space-y-6">
              <div className="flex items-end justify-between border-b border-[#222222] pb-4">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase mb-1">
                    NATIVE BLOGGER DISPATCHES (BLOG1)
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">
                    Latest Editorial &amp; Press
                  </h2>
                </div>
                <div className="font-mono text-xs text-neutral-400">
                  REAL BLOGGER POST ENGINE
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pressReleases.map(pr => (
                  <article 
                    key={pr.id}
                    className="bg-[#0A0A0A] border border-[#202020] p-6 rounded-lg space-y-4 hover:border-[#383838] transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-400">
                        <span>{pr.date}</span>
                        <span>·</span>
                        <span className="px-2 py-0.5 bg-[#171717] border border-[#292929] text-white">
                          {pr.status === 'Draft' ? 'LABEL ANNOUNCEMENT' : 'PRESS RELEASE'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white leading-snug">
                        {pr.title}
                      </h3>

                      <p className="text-xs text-neutral-300 leading-relaxed font-sans line-clamp-3">
                        {pr.leadParagraph || pr.body}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#1C1C1C] flex items-center justify-between font-mono text-[11px]">
                      <button
                        onClick={() => setActiveDispatchModal(pr)}
                        className="font-bold text-white hover:underline flex items-center gap-1"
                      >
                        <span>Read Full Dispatch</span>
                        <ArrowUpRight size={12} />
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `${pr.title}: https://lyricalent.com/dispatches/${pr.id}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        <Share2 size={12} />
                        <span>Share</span>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ================= CINEMATIC 4K VIDEO SECTION ================= */}
            <section id="videos" className="border border-[#222222] bg-[#0A0A0A] p-6 sm:p-8 rounded-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#1E1E1E] pb-4">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase mb-1">
                    CINEMATOGRAPHY &amp; 35MM VISUALS
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">
                    Featured Music Video
                  </h2>
                </div>
                <div className="font-mono text-xs text-neutral-400">
                  DIRECTED BY JORDAN K. · PARIS / BERLIN
                </div>
              </div>

              <div className="relative aspect-video w-full bg-[#050505] border border-[#242424] rounded-lg overflow-hidden flex flex-col items-center justify-center p-8 text-center group">
                <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform bg-black/60">
                  <Play size={24} fill="currentColor" className="ml-1" />
                </div>
                <div className="font-mono font-bold text-lg text-white uppercase">
                  {bloggerSettings.featuredVideoTitle}
                </div>
                <p className="text-xs text-neutral-400 max-w-lg mt-2 leading-relaxed">
                  Shot exclusively on 35mm monochrome negative. Exploration of brutalist architecture, acoustic reverberation, and emotional clarity.
                </p>
                <div className="mt-4 flex items-center gap-3 font-mono text-[10px] text-neutral-400">
                  <span>Aspect: 2.39:1 Anamorphic</span>
                  <span>·</span>
                  <span>Audio: 24-Bit Linear PCM</span>
                  <span>·</span>
                  <span>Color: Pure Monochrome Negative</span>
                </div>
              </div>
            </section>

            {/* ================= MISSION, VISION & ETHOS BENTO ================= */}
            <section id="about" className="space-y-6">
              <div className="border-b border-[#222222] pb-4">
                <div className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase mb-1">
                  LABEL CONSTITUTION
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-tight">
                  Acoustic Philosophy &amp; Ethos
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0A0A0A] border border-[#202020] p-6 rounded-lg space-y-3">
                  <div className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                    OUR MISSION
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {bloggerSettings.missionText}
                  </p>
                </div>

                <div className="bg-[#0A0A0A] border border-[#202020] p-6 rounded-lg space-y-3">
                  <div className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                    OUR VISION
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {bloggerSettings.visionText}
                  </p>
                </div>

                <div className="bg-[#0A0A0A] border border-[#202020] p-6 rounded-lg space-y-3">
                  <div className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                    SOUND LAB ARCHITECTURE
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {bloggerSettings.aboutLabelText}
                  </p>
                </div>
              </div>
            </section>

            {/* ================= DEMO SUBMISSION & A&R PORTAL ================= */}
            <section id="demo-submission" className="border border-[#262626] bg-[#0A0A0A] p-6 sm:p-8 rounded-lg space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-4">
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-widest uppercase bg-[#171717] border border-[#2A2A2A] text-white inline-block">
                    A&amp;R PORTAL
                  </span>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">
                    Artist Demo Submissions
                  </h2>
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    LYRICAL ENT welcomes unsolicited demo submissions from visionary songwriters, vocalists, and producers worldwide.
                  </p>

                  <div className="space-y-2 pt-2 border-t border-[#1C1C1C]">
                    <div className="font-mono text-[10px] text-white font-bold uppercase">
                      SUBMISSION GUIDELINES:
                    </div>
                    <ul className="space-y-1.5 font-mono text-[11px] text-neutral-400">
                      <li>• Streaming links only (SoundCloud private link, Google Drive, or Dropbox)</li>
                      <li>• Do not attach raw audio files directly to emails</li>
                      <li>• Include songwriter &amp; producer credits with your submission</li>
                      <li>• Expected review window: 14 business days</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-[#000000] border border-[#222222] rounded font-mono text-xs">
                    <div className="text-[10px] text-neutral-400 uppercase">A&amp;R INBOX</div>
                    <div className="text-white font-bold">{bloggerSettings.demoSubmissionEmail}</div>
                  </div>
                </div>

                {/* Interactive Demo Submission Form */}
                <div className="lg:col-span-7 bg-[#000000] border border-[#242424] p-6 rounded-lg">
                  {demoSubmitted ? (
                    <div className="p-6 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mx-auto">
                        <Check size={20} strokeWidth={3} />
                      </div>
                      <h3 className="font-mono text-sm font-bold uppercase text-white">
                        Demo Submission Received
                      </h3>
                      <p className="text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
                        Your track has been routed to the LYRICAL ENT London &amp; Los Angeles A&amp;R review queue.
                      </p>
                      <div className="p-2 bg-[#121212] border border-[#242424] rounded font-mono text-xs text-neutral-300 inline-block">
                        TRACKING ID: {demoSubmissionId}
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setDemoSubmitted(false);
                            setDemoArtistName('');
                            setDemoTrackTitle('');
                            setDemoStreamUrl('');
                          }}
                          className="text-xs font-mono text-white underline hover:text-neutral-300"
                        >
                          Submit Another Track
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleDemoSubmit} className="space-y-4">
                      <div className="font-mono text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-[#1C1C1C]">
                        Direct A&amp;R Submission Form
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-mono text-[10px] text-neutral-400 mb-1">
                            ARTIST / ACT NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={demoArtistName}
                            onChange={e => setDemoArtistName(e.target.value)}
                            placeholder="e.g. Kaelen Vance"
                            className="w-full bg-[#0D0D0D] border border-[#242424] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[10px] text-neutral-400 mb-1">
                            CONTACT EMAIL *
                          </label>
                          <input
                            type="email"
                            required
                            value={demoEmail}
                            onChange={e => setDemoEmail(e.target.value)}
                            placeholder="artist@domain.com"
                            className="w-full bg-[#0D0D0D] border border-[#242424] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-mono text-[10px] text-neutral-400 mb-1">
                            TRACK TITLE
                          </label>
                          <input
                            type="text"
                            value={demoTrackTitle}
                            onChange={e => setDemoTrackTitle(e.target.value)}
                            placeholder="e.g. Midnight Reverie (Demo)"
                            className="w-full bg-[#0D0D0D] border border-[#242424] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                          />
                        </div>

                        <div>
                          <label className="block font-mono text-[10px] text-neutral-400 mb-1">
                            GENRE / STYLE
                          </label>
                          <input
                            type="text"
                            value={demoGenre}
                            onChange={e => setDemoGenre(e.target.value)}
                            placeholder="Alternative R&B, Electronic, Soul"
                            className="w-full bg-[#0D0D0D] border border-[#242424] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] text-neutral-400 mb-1">
                          STREAMING DEMO URL (SOUNDCLOUD, DRIVE, DROPBOX) *
                        </label>
                        <input
                          type="url"
                          required
                          value={demoStreamUrl}
                          onChange={e => setDemoStreamUrl(e.target.value)}
                          placeholder="https://soundcloud.com/private/s-..."
                          className="w-full bg-[#0D0D0D] border border-[#242424] rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] text-neutral-400 mb-1">
                          BRIEF ARTIST STATEMENT / CREDITS
                        </label>
                        <textarea
                          rows={2}
                          value={demoNotes}
                          onChange={e => setDemoNotes(e.target.value)}
                          placeholder="Tell us about the creative vision and production..."
                          className="w-full bg-[#0D0D0D] border border-[#242424] rounded px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors rounded"
                      >
                        Transmit Demo to A&amp;R Desk →
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </section>
          </main>

          {/* ================= WEBSITE FOOTER ================= */}
          <footer className="border-t border-[#222222] bg-[#050505] pt-12 pb-8 px-4 sm:px-6 mt-16 font-mono">
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Col 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border border-white flex items-center justify-center font-bold text-xs text-white">
                      LE
                    </div>
                    <span className="font-extrabold tracking-widest text-sm text-white">
                      {bloggerSettings.siteTitle}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                    Independent record label &amp; audio production house. London · Los Angeles.
                  </p>
                </div>

                {/* Col 2 */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-white uppercase tracking-wider mb-1 text-[11px]">
                    Navigation
                  </div>
                  <div><a href="#releases" className="text-neutral-400 hover:text-white">Catalog</a></div>
                  <div><a href="#artists" className="text-neutral-400 hover:text-white">Artist Roster</a></div>
                  <div><a href="#news" className="text-neutral-400 hover:text-white">Editorial Dispatches</a></div>
                  <div><a href="#about" className="text-neutral-400 hover:text-white">Constitution</a></div>
                </div>

                {/* Col 3 */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-white uppercase tracking-wider mb-1 text-[11px]">
                    Connect &amp; Stream
                  </div>
                  <div><a href={bloggerSettings.spotifyUrl} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white">Spotify</a></div>
                  <div><a href={bloggerSettings.instagramUrl} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white">Instagram</a></div>
                  <div><a href={bloggerSettings.youtubeUrl} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white">YouTube</a></div>
                  <div><a href={bloggerSettings.xUrl} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white">X / Twitter</a></div>
                </div>

                {/* Col 4: Newsletter */}
                <div className="space-y-2.5">
                  <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Private Catalog Dispatch
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    Receive announcements for limited 180g vinyl pressings and premiere broadcasts.
                  </p>
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-1.5">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={e => setNewsletterEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className="w-full bg-[#111111] border border-[#2B2B2B] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-white text-black font-bold text-xs uppercase hover:bg-neutral-200"
                    >
                      {newsletterSuccess ? <Check size={12} /> : 'Join'}
                    </button>
                  </form>
                  {newsletterSuccess && (
                    <div className="text-[10px] text-white">Subscribed to private dispatches.</div>
                  )}
                </div>
              </div>

              {/* Bottom bar */}
              <div className="pt-6 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-neutral-500">
                <div>{bloggerSettings.footerCopyright}</div>
                <div>PUBLISHED ON GOOGLE BLOGGER PLATFORM · THEME VERSION 3.1.0</div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* ================= RELEASE DETAIL MODAL ================= */}
      {activeReleaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#292929] max-w-lg w-full rounded-lg p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                CATALOG METADATA &amp; CREDITS
              </span>
              <button 
                onClick={() => setActiveReleaseModal(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
                  {activeReleaseModal.type} · RELEASED {activeReleaseModal.plannedReleaseDate}
                </div>
                <h3 className="text-xl font-extrabold text-white uppercase mt-0.5">
                  {activeReleaseModal.title}
                </h3>
                <div className="text-sm font-mono text-neutral-300">
                  {activeReleaseModal.artistName}
                </div>
              </div>

              <div className="p-3 bg-[#121212] border border-[#222222] rounded space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">ISRC:</span>
                  <span className="text-white">{activeReleaseModal.isrc || 'US-LYR-26-00101'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">UPC / BARCODE:</span>
                  <span className="text-white">{activeReleaseModal.upc || '198273948201'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">PRODUCER:</span>
                  <span className="text-white">{activeReleaseModal.producer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">SONGWRITERS:</span>
                  <span className="text-white">{activeReleaseModal.songwriters}</span>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-neutral-400 uppercase mb-1">
                  MASTER RECORDING RIGHTS:
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed font-mono bg-[#111111] p-2.5 rounded border border-[#222222]">
                  {activeReleaseModal.rightsInfo}
                </p>
              </div>

              <div>
                <div className="font-mono text-[10px] text-neutral-400 uppercase mb-1">
                  ENGINEERING NOTES:
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {activeReleaseModal.credits || 'Engineered at LYRICAL Sound Labs, London. Mastered for vinyl and digital streaming.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222222] flex items-center justify-between">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Listen to "${activeReleaseModal.title}" by ${activeReleaseModal.artistName} on LYRICAL ENT`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#171717] border border-[#2B2B2B] text-white hover:border-white rounded text-xs font-mono flex items-center gap-1.5"
              >
                <Share2 size={12} />
                <span>Share via WhatsApp</span>
              </a>

              <button
                onClick={() => setActiveReleaseModal(null)}
                className="px-4 py-1.5 bg-white text-black font-mono font-bold text-xs uppercase rounded hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ARTIST PROFILE MODAL ================= */}
      {activeArtistModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#292929] max-w-lg w-full rounded-lg p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                ARTIST PROFILE DOSSIER
              </span>
              <button 
                onClick={() => setActiveArtistModal(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#161616] border border-[#2A2A2A] rounded flex items-center justify-center font-mono font-bold text-xl text-white">
                  {activeArtistModal.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white uppercase">
                    {activeArtistModal.name}
                  </h3>
                  <div className="font-mono text-xs text-neutral-400">
                    {activeArtistModal.genre} · {activeArtistModal.location || 'London / Los Angeles'}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-neutral-400 uppercase mb-1">
                  BIOGRAPHY &amp; ARTISTIC CONSTITUTION:
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {activeArtistModal.bio}
                </p>
              </div>

              <div className="p-3 bg-[#111111] border border-[#222222] rounded space-y-1.5 font-mono text-xs">
                <div className="text-[10px] text-neutral-400 uppercase">OFFICIAL CONNECT:</div>
                <div className="flex flex-wrap gap-3 pt-1 text-neutral-300">
                  <a href={activeArtistModal.instagram || bloggerSettings.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-white underline">Instagram</a>
                  <a href={activeArtistModal.spotify || bloggerSettings.spotifyUrl} target="_blank" rel="noreferrer" className="hover:text-white underline">Spotify</a>
                  <a href={activeArtistModal.youtube || bloggerSettings.youtubeUrl} target="_blank" rel="noreferrer" className="hover:text-white underline">YouTube</a>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222222] flex justify-end">
              <button
                onClick={() => setActiveArtistModal(null)}
                className="px-4 py-1.5 bg-white text-black font-mono font-bold text-xs uppercase rounded hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DISPATCH MODAL ================= */}
      {activeDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0A] border border-[#292929] max-w-xl w-full rounded-lg p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                LABEL DISPATCH · {activeDispatchModal.date}
              </span>
              <button 
                onClick={() => setActiveDispatchModal(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
              <h3 className="text-lg font-bold text-white uppercase leading-snug">
                {activeDispatchModal.title}
              </h3>

              {activeDispatchModal.subtitle && (
                <div className="text-xs font-mono text-neutral-400 italic">
                  {activeDispatchModal.subtitle}
                </div>
              )}

              <div className="text-xs text-neutral-300 leading-relaxed font-sans space-y-3 whitespace-pre-line pt-2">
                {activeDispatchModal.body || activeDispatchModal.leadParagraph}
              </div>

              {activeDispatchModal.quoteBody && (
                <blockquote className="p-3 bg-[#111111] border-l-2 border-white text-xs italic text-neutral-300 font-sans my-3">
                  "{activeDispatchModal.quoteBody}"
                  <div className="font-mono text-[10px] text-neutral-400 not-italic mt-1">
                    — {activeDispatchModal.quoteSpeaker}, {activeDispatchModal.quoteTitle}
                  </div>
                </blockquote>
              )}
            </div>

            <div className="pt-3 border-t border-[#222222] flex items-center justify-between">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${activeDispatchModal.title}: https://lyricalent.com/dispatches/${activeDispatchModal.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#171717] border border-[#2B2B2B] text-white hover:border-white rounded text-xs font-mono flex items-center gap-1.5"
              >
                <Share2 size={12} />
                <span>Share Dispatch</span>
              </a>

              <button
                onClick={() => setActiveDispatchModal(null)}
                className="px-4 py-1.5 bg-white text-black font-mono font-bold text-xs uppercase rounded hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
