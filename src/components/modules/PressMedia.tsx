import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PressRelease, MediaContact } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { 
  Newspaper, 
  Plus, 
  Mail, 
  Download, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Radio, 
  Camera,
  Share2
} from 'lucide-react';

export const PressMedia: React.FC = () => {
  const { 
    pressReleases, 
    mediaContacts, 
    artists, 
    addPressRelease, 
    updatePressRelease, 
    deletePressRelease, 
    addMediaContact, 
    deleteMediaContact,
    activeWorkspace
  } = useApp();

  const filteredPrs = React.useMemo(() => {
    return pressReleases.filter(p => 
      p.workspaceId === activeWorkspace.id || 
      (!p.workspaceId && activeWorkspace.id === 'ws-lyrical-ent')
    );
  }, [pressReleases, activeWorkspace.id]);

  const filteredContacts = React.useMemo(() => {
    return mediaContacts.filter(m => 
      m.workspaceId === activeWorkspace.id || 
      (!m.workspaceId && activeWorkspace.id === 'ws-lyrical-ent')
    );
  }, [mediaContacts, activeWorkspace.id]);

  const [activeTab, setActiveTab] = useState<'releases' | 'contacts' | 'company_epk' | 'photos'>('releases');
  const [selectedPrId, setSelectedPrId] = useState<string | null>(filteredPrs[0]?.id || null);
  const [isNewPrModalOpen, setIsNewPrModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);

  const wsName = activeWorkspace.name;
  const wsDomain = wsName.toLowerCase().replace(/\s+/g, '') + '.com';

  // Form states for Press Release
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [leadParagraph, setLeadParagraph] = useState('');
  const [body, setBody] = useState('');
  const [quoteSpeaker, setQuoteSpeaker] = useState('Ojo Abdulkareem');
  const [quoteTitle, setQuoteTitle] = useState(`Managing Director, ${wsName}`);
  const [quoteBody, setQuoteBody] = useState('');
  const [mediaContactEmail, setMediaContactEmail] = useState(`press@${wsDomain} | ${wsName} Press Office`);

  // Form states for Media Contact
  const [outlet, setOutlet] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Music Editor');
  const [email, setEmail] = useState('');
  const [beat, setBeat] = useState('Alternative, Electronic, Visual Arts');
  const [tier, setTier] = useState<MediaContact['tier']>('Tier 1');

  const selectedPr = filteredPrs.find(p => p.id === selectedPrId) || filteredPrs[0];

  const handleCreatePr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !leadParagraph) return;

    const created = addPressRelease({
      title,
      subtitle,
      date,
      status: 'Draft',
      leadParagraph,
      body,
      quoteSpeaker,
      quoteTitle,
      quoteBody,
      mediaContact: mediaContactEmail
    });

    setSelectedPrId(created.id);
    setIsNewPrModalOpen(false);
    resetPrForm();
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outlet || !contactName || !email) return;

    addMediaContact({
      outlet,
      contactName,
      role: contactRole,
      email,
      beat,
      tier
    });

    setIsNewContactModalOpen(false);
    resetContactForm();
  };

  const resetPrForm = () => {
    setTitle('');
    setSubtitle('');
    setLeadParagraph('');
    setBody('');
    setQuoteBody('');
  };

  const resetContactForm = () => {
    setOutlet('');
    setContactName('');
    setEmail('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            PRESS & MEDIA HUB
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Official press dispatches, editorial EPKs, journalist directory, and approved media assets
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Section Tab Buttons (Anti-pill) */}
          <div className="flex items-center gap-1 p-1 bg-[#121212] border border-[#242424] rounded">
            <button
              onClick={() => setActiveTab('releases')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${activeTab === 'releases' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Press Releases
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${activeTab === 'contacts' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Media Rolodex
            </button>
            <button
              onClick={() => setActiveTab('company_epk')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${activeTab === 'company_epk' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Label EPK & Bio
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${activeTab === 'photos' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Approved Photos
            </button>
          </div>

          {activeTab === 'releases' && (
            <button
              onClick={() => setIsNewPrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors whitespace-nowrap"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Draft Release</span>
            </button>
          )}

          {activeTab === 'contacts' && (
            <button
              onClick={() => setIsNewContactModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors whitespace-nowrap"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Add Journalist</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Press Releases Tab */}
      {activeTab === 'releases' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List (4 Cols) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider px-1">
              PRESS DISPATCHES ({filteredPrs.length})
            </div>

            {filteredPrs.map(pr => {
              const isSelected = pr.id === selectedPr?.id;
              return (
                <div
                  key={pr.id}
                  onClick={() => setSelectedPrId(pr.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#181818] border-neutral-400 text-white' 
                      : 'bg-[#0E0E0E] border-[#1E1E1E] text-neutral-300 hover:border-[#333333]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                    <span className="tabular-nums">{pr.date}</span>
                    <span className="text-neutral-300">{pr.status.toUpperCase()}</span>
                  </div>

                  <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug">{pr.title}</h4>

                  <div className="mt-3 pt-2 border-t border-[#1C1C1C] text-[10px] font-mono text-neutral-500 truncate">
                    Contact: {pr.mediaContact}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reader / Formal Dispatch Sheet (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedPr && (
              <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-4">
                  <div className="text-xs font-mono text-neutral-400">
                    STATUS: <span className="text-white font-medium">{selectedPr.status.toUpperCase()}</span> · DATE: {selectedPr.date}
                  </div>

                  <button
                    onClick={() => {
                      const text = `${selectedPr.title}\n${selectedPr.subtitle}\n\nFOR IMMEDIATE RELEASE\n${selectedPr.leadParagraph}\n\n${selectedPr.body}\n\n"${selectedPr.quoteBody}" — ${selectedPr.quoteSpeaker}, ${selectedPr.quoteTitle}\n\nMEDIA CONTACT: ${selectedPr.mediaContact}`;
                      navigator.clipboard.writeText(text);
                      alert('Press release copied to clipboard!');
                    }}
                    className="text-xs font-mono text-neutral-300 hover:text-white px-2.5 py-1 bg-[#1A1A1A] border border-[#2B2B2B] rounded"
                  >
                    Copy Wire Text
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                    FOR IMMEDIATE RELEASE
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono leading-tight uppercase">
                    {selectedPr.title}
                  </h2>

                  {selectedPr.subtitle && (
                    <p className="text-sm text-neutral-300 italic border-l-2 border-neutral-600 pl-3">
                      {selectedPr.subtitle}
                    </p>
                  )}

                  <div className="text-xs text-neutral-200 leading-relaxed font-sans pt-2">
                    <span className="font-bold text-white uppercase font-mono">{selectedPr.leadParagraph.split('—')[0]} — </span>
                    {selectedPr.leadParagraph.split('—')[1] || selectedPr.leadParagraph}
                  </div>

                  <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line font-sans">
                    {selectedPr.body}
                  </div>

                  {selectedPr.quoteBody && (
                    <blockquote className="p-4 bg-[#141414] border border-[#222222] rounded text-xs text-neutral-200 italic my-4">
                      "{selectedPr.quoteBody}"
                      <div className="not-italic text-[11px] font-mono font-medium text-white mt-2">
                        — {selectedPr.quoteSpeaker}, {selectedPr.quoteTitle}
                      </div>
                    </blockquote>
                  )}

                  <div className="pt-6 border-t border-[#1C1C1C] text-xs font-mono text-neutral-400">
                    <div className="font-semibold text-white mb-1">MEDIA CONTACT:</div>
                    <div>{selectedPr.mediaContact}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{wsName} Global Communications Dept.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Media Rolodex Tab */}
      {activeTab === 'contacts' && (
        <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Accredited Journalists & Editors</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Tier 1 music publications, curators, and culture writers</p>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">{filteredContacts.length} CONTACTS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C1C1C] text-neutral-400 font-mono text-[11px]">
                  <th className="pb-2.5 font-normal">OUTLET / PUBLICATION</th>
                  <th className="pb-2.5 font-normal">NAME & ROLE</th>
                  <th className="pb-2.5 font-normal">EMAIL</th>
                  <th className="pb-2.5 font-normal">BEAT & GENRE FOCUS</th>
                  <th className="pb-2.5 font-normal">TIER</th>
                  <th className="pb-2.5 font-normal text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161616]">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-[#141414] transition-colors">
                    <td className="py-3 pr-3 font-semibold text-white">{contact.outlet}</td>
                    <td className="py-3 pr-3 text-neutral-300">
                      <div>{contact.contactName}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{contact.role}</div>
                    </td>
                    <td className="py-3 pr-3 text-neutral-300 font-mono text-[11px]">
                      <a href={`mailto:${contact.email}`} className="hover:underline flex items-center gap-1">
                        <Mail size={11} className="text-neutral-500" />
                        <span>{contact.email}</span>
                      </a>
                    </td>
                    <td className="py-3 pr-3 text-neutral-400 truncate max-w-[200px]">{contact.beat}</td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-neutral-300">{contact.tier}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => deleteMediaContact(contact.id)}
                        className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                        title="Remove contact"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Company EPK & Bio Tab */}
      {activeTab === 'company_epk' && (
        <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-6">
          <div className="border-b border-[#1C1C1C] pb-5">
            <span className="text-xs font-mono text-neutral-400 uppercase">OFFICIAL LABEL DOSSIER</span>
            <h2 className="text-2xl font-bold tracking-tight text-white font-mono uppercase mt-1">
              {wsName} — COMPANY PROFILE & EPK
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4 text-xs text-neutral-300 leading-relaxed">
              <h3 className="text-sm font-semibold text-white font-mono uppercase">EXECUTIVE BIOGRAPHY</h3>
              <p>
                Founded on the premise that timeless recorded art demands architectural precision and unfettered creative autonomy, {wsName} is an independent record label, creative production house, and music publishing entity based between London and Los Angeles.
              </p>
              <p>
                The label represents a curated roster of multidisciplinary recording artists whose work bridges contemporary soul, alternative R&B, avant-garde electronics, cinematic composition, and spatial audiovisual experiences. Operating state-of-the-art analog and digital recording facilities, {wsName} controls its own master engineering pipelines, artwork print production, and global distributor relationships.
              </p>

              <h3 className="text-sm font-semibold text-white font-mono uppercase pt-4">LABEL PILLARS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-[#121212] border border-[#1E1E1E] rounded">
                  <div className="font-semibold text-white font-mono mb-1">01. ARTIST AUTONOMY</div>
                  <p className="text-[11px] text-neutral-400">Artists maintain creative authority over track arrangements, album art, and visual films.</p>
                </div>
                <div className="p-3 bg-[#121212] border border-[#1E1E1E] rounded">
                  <div className="font-semibold text-white font-mono mb-1">02. MASTER QUALITY</div>
                  <p className="text-[11px] text-neutral-400">Every catalog sound recording undergoes rigorous 24-bit/96kHz mastering and vinyl lacquer inspection.</p>
                </div>
                <div className="p-3 bg-[#121212] border border-[#1E1E1E] rounded">
                  <div className="font-semibold text-white font-mono mb-1">03. GLOBAL SYNC</div>
                  <p className="text-[11px] text-neutral-400">Direct licensing relationships with premier arthouse film distributors and streaming platforms.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-[#121212] border border-[#1E1E1E] rounded p-5 space-y-3 text-xs font-mono">
              <span className="text-[10px] text-neutral-500 block uppercase">CORPORATE PARTICULARS</span>
              <div><span className="text-neutral-400">Founded:</span> <span className="text-white">2024</span></div>
              <div><span className="text-neutral-400">Head of Label:</span> <span className="text-white">Ojo Abdulkareem</span></div>
              <div><span className="text-neutral-400">Operating Studios:</span> <span className="text-neutral-200">London Sound Lab A / LA Studio</span></div>
              <div><span className="text-neutral-400">Catalog Registry:</span> <span className="text-neutral-200">US-{wsName.substring(0, 3).toUpperCase()} Prefix (IFPI)</span></div>
              <div><span className="text-neutral-400">Press Queries:</span> <span className="text-white">press@${wsDomain}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Approved Photos Tab */}
      {activeTab === 'photos' && (
        <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Approved Promotional Photographs & Assets</h2>
              <p className="text-xs text-neutral-400 mt-0.5">High-resolution monochrome press portraits licensed for editorial syndication</p>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">300 DPI PRINT READY</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="border border-[#1E1E1E] rounded overflow-hidden bg-[#121212]">
              <img 
                src="/src/assets/images/artist_showcase_portrait_1792791744296.jpg" 
                alt="Sariyah Cole Master Press Portrait" 
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover grayscale contrast-125"
              />
              <div className="p-3">
                <div className="text-xs font-semibold text-white truncate">Sariyah Cole — Studio Portrait #1</div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Credit: {wsName} Visuals · 2026</div>
                <div className="mt-2 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-neutral-300">APPROVED FOR PRINT</span>
                  <a href="/src/assets/images/artist_showcase_portrait_1792791744296.jpg" download className="text-white hover:underline flex items-center gap-1">
                    <Download size={10} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="border border-[#1E1E1E] rounded overflow-hidden bg-[#121212]">
              <img 
                src="/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg" 
                alt="LYRICAL ENT Sound Lab A Control Room" 
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover grayscale contrast-125"
              />
              <div className="p-3">
                <div className="text-xs font-semibold text-white truncate">London Sound Lab A — Control Room</div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Credit: Architectural Archive · 2026</div>
                <div className="mt-2 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-neutral-300">APPROVED FOR WEB</span>
                  <a href="/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg" download className="text-white hover:underline flex items-center gap-1">
                    <Download size={10} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="border border-[#1E1E1E] rounded overflow-hidden bg-[#121212]">
              <img 
                src="/src/assets/images/vinyl_press_mockup_1792791744149.jpg" 
                alt="LYRICAL ENT Vinyl Master Pressing" 
                referrerPolicy="no-referrer"
                className="w-full h-56 object-cover grayscale contrast-125"
              />
              <div className="p-3">
                <div className="text-xs font-semibold text-white truncate">12-Inch Vinyl Pressing — Packaging Master</div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">Credit: {wsName} Archive · 2026</div>
                <div className="mt-2 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-neutral-300">APPROVED FOR SYNDICATION</span>
                  <a href="/src/assets/images/vinyl_press_mockup_1792791744149.jpg" download className="text-white hover:underline flex items-center gap-1">
                    <Download size={10} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Press Release Modal */}
      {isNewPrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#0E0E0E] border border-[#242424] rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">Draft Press Release</h3>
            <p className="text-xs text-neutral-400 mb-5">Create official editorial dispatch for syndication</p>

            <form onSubmit={handleCreatePr} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">HEADLINE *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={`e.g. ${wsName.toUpperCase()} SIGNS COMPOSER ELENA VANCE`}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">SUBHEADLINE</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="Subheading summarizing the news angle"
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">LEAD PARAGRAPH (DATELINE) *</label>
                <textarea
                  rows={2}
                  required
                  value={leadParagraph}
                  onChange={e => setLeadParagraph(e.target.value)}
                  placeholder={`LONDON & LOS ANGELES — Record label ${wsName} today announced...`}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">DISPATCH BODY CONTENT</label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Full background, production team, distribution dates..."
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">EXECUTIVE QUOTE</label>
                <textarea
                  rows={2}
                  value={quoteBody}
                  onChange={e => setQuoteBody(e.target.value)}
                  placeholder="Quote from label head or artist..."
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="pt-4 border-t border-[#1C1C1C] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPrModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                >
                  Save Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Media Contact Modal */}
      {isNewContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E0E0E] border border-[#242424] rounded-lg p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">Add Media Contact</h3>
            <p className="text-xs text-neutral-400 mb-5">Register music journalist or editor in {wsName} press rolodex</p>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">PUBLICATION / OUTLET *</label>
                <input
                  type="text"
                  required
                  value={outlet}
                  onChange={e => setOutlet(e.target.value)}
                  placeholder="e.g. Rolling Stone, Pitchfork, BBC Radio"
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">CONTACT NAME *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="e.g. Maya Smith"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">ROLE</label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={e => setContactRole(e.target.value)}
                    placeholder="Senior Music Writer"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">EMAIL *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="editor@publication.com"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">TIER</label>
                  <select
                    value={tier}
                    onChange={e => setTier(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                  >
                    <option value="Tier 1">Tier 1 (Major Global)</option>
                    <option value="Tier 2">Tier 2 (Industry / Trade)</option>
                    <option value="Blog / Independent">Independent / Regional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">BEAT & GENRE SPECIALTY</label>
                <input
                  type="text"
                  value={beat}
                  onChange={e => setBeat(e.target.value)}
                  placeholder="e.g. Alternative R&B, Film Scores, Vinyl Reviews"
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="pt-4 border-t border-[#1C1C1C] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewContactModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
