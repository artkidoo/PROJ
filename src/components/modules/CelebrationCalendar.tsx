/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Year-Round Celebration Calendar & Design System
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Download, 
  ArrowUpRight,
  Bookmark,
  Share2,
  Check,
  Palette,
  Eye,
  Sliders,
  X
} from 'lucide-react';
import { LyricalMonogram } from '../brand/LogoSystem';

interface CelebrationItem {
  id: string;
  name: string;
  date: string;
  month: string;
  region: string;
  audience: string;
  category: string;
  status: 'Draft' | 'Prepared' | 'Approved' | 'Published';
  designDirections: string[];
  headline: string;
  greeting: string;
}

const CELEBRATIONS: CelebrationItem[] = [
  { 
    id: 'cel-01', 
    name: "New Year's Day", 
    date: '2026-01-01', 
    month: 'January', 
    region: 'Global', 
    audience: 'All Audiences', 
    category: 'Cultural', 
    status: 'Published', 
    designDirections: ['Corporate Greeting', 'Luxury Editorial', 'Minimal Typography'],
    headline: 'HAPPY NEW YEAR 2026',
    greeting: 'A new dawn of uncompromising sound, bold frequency, and global musical excellence. To our artists and listeners worldwide.'
  },
  { 
    id: 'cel-02', 
    name: "Valentine's Day", 
    date: '2026-02-14', 
    month: 'February', 
    region: 'Global', 
    audience: 'Romance & R&B Fans', 
    category: 'Social', 
    status: 'Prepared', 
    designDirections: ['Luxury Editorial', 'Artist-Themed', 'Creative Photo Composition'],
    headline: 'DEVOTED TO THE SOUND',
    greeting: 'Where words fall short, sound speaks the unspoken truth. Celebrating connection and raw harmonic beauty.'
  },
  { 
    id: 'cel-03', 
    name: "International Women's Day", 
    date: '2026-03-08', 
    month: 'March', 
    region: 'Global', 
    audience: 'Music & Culture', 
    category: 'Cultural', 
    status: 'Prepared', 
    designDirections: ['Editorial Portrait', 'Minimal Typography', 'Story Format'],
    headline: 'WOMEN SHAPING THE SOUND',
    greeting: 'Saluting the visionary producers, songwriters, engineers, and executive leaders redefining global music.'
  },
  { 
    id: 'cel-04', 
    name: "Mother's Day", 
    date: '2026-03-15', 
    month: 'March', 
    region: 'Global & Nigeria', 
    audience: 'Family & Culture', 
    category: 'Cultural', 
    status: 'Prepared', 
    designDirections: ['Editorial Portrait', 'Luxury Editorial', 'Square Post'],
    headline: 'FIRST SOURCE OF HARMONY',
    greeting: 'Celebrating the strength, tenderness, and endless inspiration of mothers everywhere.'
  },
  { 
    id: 'cel-05', 
    name: "Easter Sunday", 
    date: '2026-04-05', 
    month: 'April', 
    region: 'Global & Nigeria', 
    audience: 'Christian Community', 
    category: 'Faith & Cultural', 
    status: 'Draft', 
    designDirections: ['Corporate Greeting', 'Minimal Typography', 'Landscape Banner'],
    headline: 'RENEWAL & HOPE',
    greeting: 'Warmest Easter blessings to our global family. May your season be filled with peace and renewed inspiration.'
  },
  { 
    id: 'cel-06', 
    name: "Eid al-Fitr", 
    date: '2026-04-10', 
    month: 'April', 
    region: 'Global & Nigeria', 
    audience: 'Muslim Community', 
    category: 'Faith & Cultural', 
    status: 'Draft', 
    designDirections: ['Corporate Greeting', 'Luxury Editorial', 'Story Format'],
    headline: 'EID MUBARAK',
    greeting: 'May peace, joy, and profound blessings grace your home this Eid. From the entire LYRICAL ENT management.'
  },
  { 
    id: 'cel-07', 
    name: "Workers' Day / May Day", 
    date: '2026-05-01', 
    month: 'May', 
    region: 'Global & Nigeria', 
    audience: 'Creators & Workforce', 
    category: 'Professional', 
    status: 'Draft', 
    designDirections: ['Social Poster', 'Brand Promotional', 'Square Post'],
    headline: 'DEDICATION BUILDS EMPIRES',
    greeting: 'Honouring the tireless hands behind the soundboard, the late-night studio engineers, and the workers worldwide.'
  },
  { 
    id: 'cel-08', 
    name: "Children's Day (Nigeria)", 
    date: '2026-05-27', 
    month: 'May', 
    region: 'Nigeria', 
    audience: 'Family & Youth', 
    category: 'Cultural', 
    status: 'Draft', 
    designDirections: ['Creative Composition', 'Square Post', 'Landscape Banner'],
    headline: 'VOICES OF TOMORROW',
    greeting: 'Nurturing young curiosity, raw rhythm, and artistic courage across Nigeria and the diaspora.'
  },
  { 
    id: 'cel-09', 
    name: "Father's Day", 
    date: '2026-06-21', 
    month: 'June', 
    region: 'Global', 
    audience: 'Family & Culture', 
    category: 'Cultural', 
    status: 'Draft', 
    designDirections: ['Minimal Typography', 'Editorial Portrait', 'Square Post'],
    headline: 'PILLARS OF GUIDANCE',
    greeting: 'Celebrating fathers, mentors, and executive stewards who believe in our creative aspirations.'
  },
  { 
    id: 'cel-10', 
    name: "World Music Day (Fête de la Musique)", 
    date: '2026-06-21', 
    month: 'June', 
    region: 'Global', 
    audience: 'Musicians & Audiophiles', 
    category: 'Music & Arts', 
    status: 'Approved', 
    designDirections: ['Bold Typographic', 'Artist-Themed', 'Story Format'],
    headline: 'SOUND IS ARCHITECTURE',
    greeting: 'A worldwide celebration of independent creators, organic vibrations, and boundary-pushing audio.'
  },
  { 
    id: 'cel-11', 
    name: "Eid al-Adha", 
    date: '2026-06-28', 
    month: 'June', 
    region: 'Global & Nigeria', 
    audience: 'Muslim Community', 
    category: 'Faith & Cultural', 
    status: 'Draft', 
    designDirections: ['Corporate Greeting', 'Luxury Editorial', 'Landscape Banner'],
    headline: 'BLESSED EID AL-ADHA',
    greeting: 'Celebrating devotion, sacrifice, and shared communion. Peace and prosperity to all our partners and fans.'
  },
  { 
    id: 'cel-12', 
    name: "International Youth Day", 
    date: '2026-08-12', 
    month: 'August', 
    region: 'Global', 
    audience: 'Youth & Creators', 
    category: 'Cultural', 
    status: 'Draft', 
    designDirections: ['Urban Street', 'Bold Typographic', 'Reels Cover'],
    headline: 'THE NEW SONIC GENERATION',
    greeting: 'Empowering fearless young composers, producers, and vocalists taking African and global music to new heights.'
  },
  { 
    id: 'cel-13', 
    name: "World Photography Day", 
    date: '2026-08-19', 
    month: 'August', 
    region: 'Global', 
    audience: 'Visual Creatives', 
    category: 'Music & Arts', 
    status: 'Draft', 
    designDirections: ['Creative Photo Composition', 'High Fashion', 'Story Format'],
    headline: 'FRAMING THE FREQUENCY',
    greeting: 'Honouring the photographers and cinematographers who capture the human essence of live performance.'
  },
  { 
    id: 'cel-14', 
    name: "Independence Day (Nigeria)", 
    date: '2026-10-01', 
    month: 'October', 
    region: 'Nigeria', 
    audience: 'Patriotic Fans & Media', 
    category: 'National', 
    status: 'Approved', 
    designDirections: ['Bold Typographic', 'Editorial', 'Square Post'],
    headline: 'NIGERIA AT 66 // OCT 01',
    greeting: 'Celebrating Nigerian resilience, undeniable cultural mastery, and musical rhythms that captivate the planet.'
  },
  { 
    id: 'cel-15', 
    name: "World Mental Health Day", 
    date: '2026-10-10', 
    month: 'October', 
    region: 'Global', 
    audience: 'Creatives & Fans', 
    category: 'Wellness', 
    status: 'Draft', 
    designDirections: ['Minimal Typography', 'Luxury Editorial', 'Square Post'],
    headline: 'SPACE FOR INNER PEACE',
    greeting: 'Prioritizing artist well-being, creative space, and mental peace in an always-connected music industry.'
  },
  { 
    id: 'cel-16', 
    name: "International Men's Day", 
    date: '2026-11-19', 
    month: 'November', 
    region: 'Global', 
    audience: 'Men & Creators', 
    category: 'Social', 
    status: 'Draft', 
    designDirections: ['Editorial Portrait', 'Minimal Typography', 'Story Format'],
    headline: 'LEADERSHIP & INTEGRITY',
    greeting: 'Recognizing positive male leadership, mental strength, and musical mentorship in our studios.'
  },
  { 
    id: 'cel-17', 
    name: "Black Friday & Cyber Week", 
    date: '2026-11-27', 
    month: 'November', 
    region: 'Global', 
    audience: 'Merch & Vinyl Buyers', 
    category: 'Commercial', 
    status: 'Draft', 
    designDirections: ['High-Contrast Promo', 'Square Post', 'Story Format'],
    headline: 'ANNUAL VINYL ARCHIVE SALE',
    greeting: 'Exclusive label merchandise, limited 180g vinyl test pressings, and archival prints at member prices.'
  },
  { 
    id: 'cel-18', 
    name: "Christmas Day", 
    date: '2026-12-25', 
    month: 'December', 
    region: 'Global', 
    audience: 'All Audiences', 
    category: 'Cultural', 
    status: 'Prepared', 
    designDirections: ['Luxury Editorial', 'Corporate Greeting', 'Story Format'],
    headline: 'PEACE ON EARTH',
    greeting: 'Warm holiday tidings, deep gratitude, and beautiful music from all of us at LYRICAL ENT.'
  }
];

export const CelebrationCalendar: React.FC = () => {
  const [celebrations, setCelebrations] = useState<CelebrationItem[]>(CELEBRATIONS);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCel, setActiveCel] = useState<CelebrationItem | null>(null);
  
  // Custom design greeting inside modal
  const [customHeadline, setCustomHeadline] = useState<string>('');
  const [customGreeting, setCustomGreeting] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const months = ['ALL', 'January', 'February', 'March', 'April', 'May', 'June', 'August', 'October', 'November', 'December'];

  const filtered = celebrations.filter(c => {
    const matchesMonth = selectedMonth === 'ALL' || c.month === selectedMonth;
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
    const matchesRegion = selectedRegion === 'ALL' || c.region.includes(selectedRegion);
    const matchesSearch = searchQuery === '' || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.greeting.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMonth && matchesStatus && matchesRegion && matchesSearch;
  });

  const handleUpdateStatus = (id: string, newStatus: 'Draft' | 'Prepared' | 'Approved' | 'Published') => {
    setCelebrations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    if (activeCel && activeCel.id === id) {
      setActiveCel({ ...activeCel, status: newStatus });
    }
    showToast(`Status updated to ${newStatus}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenStudio = (cel: CelebrationItem) => {
    setActiveCel(cel);
    setCustomHeadline(cel.headline);
    setCustomGreeting(cel.greeting);
  };

  // Real Canvas PNG Export for Celebration
  const handleExportCelebrationPng = () => {
    if (!activeCel) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background fill
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, 1200, 1200);

    // Architectural Borders
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, 1120, 1120);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, 1080, 1080);

    // Header badge
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('LYRICAL ENT · CELEBRATION ARCHIVE', 90, 130);

    ctx.fillStyle = '#A3A3A3';
    ctx.font = '500 18px monospace';
    ctx.fillText(`${activeCel.name.toUpperCase()} · ${activeCel.date}`, 90, 165);

    // Main Occasion Headline
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 60px Georgia, serif';
    
    // Word wrapping for headline
    const headlineWords = (customHeadline || activeCel.headline).split(' ');
    let line = '';
    let yPos = 460;
    for (let n = 0; n < headlineWords.length; n++) {
      const testLine = line + headlineWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 1000 && n > 0) {
        ctx.fillText(line.toUpperCase(), 90, yPos);
        line = headlineWords[n] + ' ';
        yPos += 70;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.toUpperCase(), 90, yPos);

    // Greeting copy
    ctx.fillStyle = '#D4D4D4';
    ctx.font = '400 24px sans-serif';
    const copyWords = (customGreeting || activeCel.greeting).split(' ');
    let copyLine = '';
    let copyY = yPos + 70;
    for (let n = 0; n < copyWords.length; n++) {
      const testLine = copyLine + copyWords[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 980 && n > 0) {
        ctx.fillText(copyLine, 90, copyY);
        copyLine = copyWords[n] + ' ';
        copyY += 38;
      } else {
        copyLine = testLine;
      }
    }
    ctx.fillText(copyLine, 90, copyY);

    // Footer
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('LYRICAL ENT RECORDS', 90, 1070);

    ctx.fillStyle = '#888888';
    ctx.font = '400 18px monospace';
    ctx.fillText('LONDON · NEW YORK · LAGOS // EST. 2024', 90, 1110);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('OFFICIAL OCCASION DISPATCH', 1110, 1110);
    ctx.textAlign = 'left';

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `lyrical_ent_${activeCel.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_card.png`;
    a.click();
    showToast(`High-Res card exported for ${activeCel.name}`);
    setActiveCel(null);
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-white/20 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 font-mono text-xs">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
              ANNUAL CELEBRATION SYSTEM · 18+ OCCASIONS · NIGERIA &amp; GLOBAL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase break-words">
            CELEBRATION CALENDAR &amp; PREPARATION WORKFLOW
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Prepare professional brand graphics, cultural greetings, and promotional campaigns weeks ahead of major national, faith, and entertainment events.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search occasions..."
            className="bg-[#121212] border border-[#262626] rounded pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-neutral-500 w-full sm:w-56 focus:outline-none focus:border-white transition-colors"
          />
        </div>
      </div>

      {/* Filter Bars (Responsive across 360px - 1440px) */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-neutral-500 uppercase">Month:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-[#121212] border border-[#262626] rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-neutral-500 uppercase">Region:</span>
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="bg-[#121212] border border-[#262626] rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
          >
            <option value="ALL">All Regions</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Global">Global</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-neutral-500 uppercase">Workflow Status:</span>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-[#121212] border border-[#262626] rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Prepared">Prepared</option>
            <option value="Approved">Approved</option>
            <option value="Published">Published</option>
          </select>
        </div>
      </div>

      {/* Celebrations Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full min-w-0">
        {filtered.map(cel => (
          <div
            key={cel.id}
            className="w-full min-w-0 bg-[#0A0A0A] border border-[#202020] hover:border-[#383838] rounded-lg p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm group"
          >
            <div className="space-y-3 min-w-0">
              {/* Card Meta Top */}
              <div className="flex items-center justify-between text-[10px] font-mono gap-2">
                <span className="px-2 py-0.5 bg-[#171717] border border-[#282828] text-white uppercase truncate">
                  {cel.region} · {cel.category}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold shrink-0 ${
                  cel.status === 'Published' ? 'bg-white text-black' :
                  cel.status === 'Approved' ? 'bg-neutral-200 text-black font-semibold' :
                  cel.status === 'Prepared' ? 'bg-neutral-800 text-white border border-neutral-600' :
                  'bg-[#121212] text-neutral-400 border border-[#222]'
                }`}>
                  {cel.status}
                </span>
              </div>

              {/* Title & Date */}
              <div className="min-w-0">
                <div className="font-mono text-xs text-neutral-400">{cel.date} · {cel.month}</div>
                <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight mt-1 truncate">
                  {cel.name}
                </h3>
                <div className="text-xs font-mono text-neutral-400 mt-1 truncate">
                  Audience: <strong className="text-white">{cel.audience}</strong>
                </div>
              </div>

              {/* Design Directions */}
              <div className="pt-2 border-t border-[#1C1C1C]">
                <div className="text-[10px] font-mono text-neutral-500 uppercase mb-1.5">Design Directions:</div>
                <div className="flex flex-wrap gap-1.5">
                  {cel.designDirections.map(dir => (
                    <span key={dir} className="px-2 py-0.5 bg-[#121212] border border-[#222] font-mono text-[10px] text-neutral-300">
                      {dir}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-[#1C1C1C] flex flex-wrap items-center justify-between gap-2">
              <select
                value={cel.status}
                onChange={e => handleUpdateStatus(cel.id, e.target.value as any)}
                className="bg-[#121212] border border-[#262626] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
              >
                <option value="Draft">Draft</option>
                <option value="Prepared">Prepared</option>
                <option value="Approved">Approved</option>
                <option value="Published">Published</option>
              </select>

              <button
                onClick={() => handleOpenStudio(cel)}
                className="px-3 py-1.5 bg-white text-black font-mono text-xs font-bold rounded hover:bg-neutral-200 transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>Open Studio →</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= CELEBRATION STUDIO MODAL ================= */}
      {activeCel && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-[#0D0D0D] border border-[#292929] max-w-2xl w-full rounded-xl p-4 sm:p-6 lg:p-8 space-y-5 animate-in zoom-in-95 duration-150 shadow-2xl my-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                  CELEBRATION CAMPAIGN WORKSPACE · {activeCel.region}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white uppercase mt-0.5">
                  {activeCel.name} ({activeCel.date})
                </h2>
              </div>
              <button
                onClick={() => setActiveCel(null)}
                className="text-neutral-400 hover:text-white p-2 font-mono text-xs border border-[#2A2A2A] rounded hover:bg-[#1A1A1A] transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-[#121212] border border-[#222] rounded space-y-2">
                <div className="text-white font-bold text-xs uppercase">Approved Design Directions</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {activeCel.designDirections.map(d => (
                    <div key={d} className="p-2 bg-[#090909] border border-[#262626] rounded text-neutral-300 text-[11px]">
                      ✓ {d}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">CAMPAIGN POSTER HEADLINE</label>
                <input
                  type="text"
                  value={customHeadline}
                  onChange={e => setCustomHeadline(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded px-3 py-2 text-white uppercase focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">OFFICIAL OCCASION GREETING COPY</label>
                <textarea
                  rows={3}
                  value={customGreeting}
                  onChange={e => setCustomGreeting(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded p-3 text-xs font-sans text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222222]">
                <span className="text-neutral-400 text-xs">Workflow: <strong className="text-white">{activeCel.status}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCelebrationPng}
                    className="px-4 py-2 bg-white text-black font-bold uppercase rounded hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Download size={14} />
                    <span>Download High-Res Card</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
