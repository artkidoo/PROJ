import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MusicRelease, ReleaseType, DistributionStatus } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { 
  Disc3, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  ListFilter,
  FileText,
  Sliders,
  DollarSign
} from 'lucide-react';

export const MusicReleaseManagement: React.FC = () => {
  const { releases, artists, addRelease, updateRelease, deleteRelease, searchQuery, activeWorkspace } = useApp();
  
  const workspaceReleases = releases.filter(r => r.workspaceId === activeWorkspace.id);
  const workspaceArtists = artists.filter(a => a.workspaceId === activeWorkspace.id);

  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(workspaceReleases[0]?.id || null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterType, setFilterType] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReleaseType>('Single');
  const [artistId, setArtistId] = useState('');
  const [featuredArtists, setFeaturedArtists] = useState('');
  const [producer, setProducer] = useState('');
  const [songwriters, setSongwriters] = useState('');
  const [credits, setCredits] = useState('');
  const [plannedReleaseDate, setPlannedReleaseDate] = useState('');
  const [artworkUrl, setArtworkUrl] = useState('');
  const [audioLocation, setAudioLocation] = useState('');
  const [distributionStatus, setDistributionStatus] = useState<DistributionStatus>('Planning');
  const [isrc, setIsrc] = useState('');
  const [upc, setUpc] = useState('');
  const [rightsInfo, setRightsInfo] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [budgetAllocated, setBudgetAllocated] = useState(10000);
  const [budgetSpent, setBudgetSpent] = useState(0);

  const selectedRelease = workspaceReleases.find(r => r.id === selectedReleaseId) || workspaceReleases[0];

  const filteredReleases = workspaceReleases.filter(r => {
    const matchesSearch = searchQuery === '' || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.isrc && r.isrc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'All' || r.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleToggleChecklist = (releaseId: string, checkKey: keyof MusicRelease['checklist']) => {
    const rel = workspaceReleases.find(r => r.id === releaseId);
    if (!rel) return;

    const currentVal = rel.checklist[checkKey];
    updateRelease(releaseId, {
      checklist: {
        ...rel.checklist,
        [checkKey]: !currentVal
      }
    });
  };

  const handleStatusChange = (releaseId: string, newStatus: DistributionStatus) => {
    updateRelease(releaseId, { distributionStatus: newStatus });
  };

  const handleOpenCreateModal = () => {
    const isLyrical = activeWorkspace.id === 'ws-lyrical-ent' || activeWorkspace.name.toUpperCase() === 'LYRICAL ENT';
    const workspaceShort = activeWorkspace.name.slice(0, 3).toUpperCase();
    const year = new Date().getFullYear();

    setEditingId(null);
    setTitle('');
    setType('Single');
    setArtistId(workspaceArtists[0]?.id || '');
    setFeaturedArtists('');
    setProducer(`${activeWorkspace.name} Studio A`);
    setSongwriters('');
    setCredits(`Executive Producer: ${activeWorkspace.name} LLC.`);
    setPlannedReleaseDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setArtworkUrl(isLyrical ? '/src/assets/images/vinyl_press_mockup_1792791744149.jpg' : '');
    setAudioLocation(`${workspaceShort} Cloud Vault // Master_WAV.zip`);
    setDistributionStatus('Planning');
    setIsrc(`US-${workspaceShort}-${year.toString().slice(-2)}-${Math.floor(10000 + Math.random() * 90000)}`);
    setUpc(`198${Math.floor(100000000 + Math.random() * 900000000)}`);
    setRightsInfo(`(P) & (C) ${year} ${activeWorkspace.name} LLC.`);
    setReleaseNotes('');
    setPublicUrl('');
    setBudgetAllocated(10000);
    setBudgetSpent(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rel: MusicRelease) => {
    setEditingId(rel.id);
    setTitle(rel.title);
    setType(rel.type);
    setArtistId(rel.artistId);
    setFeaturedArtists(rel.featuredArtists || '');
    setProducer(rel.producer);
    setSongwriters(rel.songwriters);
    setCredits(rel.credits);
    setPlannedReleaseDate(rel.plannedReleaseDate);
    setArtworkUrl(rel.artworkUrl || '');
    setAudioLocation(rel.audioLocation || '');
    setDistributionStatus(rel.distributionStatus);
    setIsrc(rel.isrc || '');
    setUpc(rel.upc || '');
    setRightsInfo(rel.rightsInfo);
    setReleaseNotes(rel.releaseNotes);
    setPublicUrl(rel.publicUrl || '');
    setBudgetAllocated(rel.budgetAllocated || 10000);
    setBudgetSpent(rel.budgetSpent || 0);
    setIsModalOpen(true);
  };

  const handleSaveRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artistId || !plannedReleaseDate) return;

    const artistObj = workspaceArtists.find(a => a.id === artistId);
    const artistName = artistObj ? artistObj.name : 'Unknown Artist';

    if (editingId) {
      updateRelease(editingId, {
        title,
        type,
        artistId,
        artistName,
        featuredArtists,
        producer,
        songwriters,
        credits,
        plannedReleaseDate,
        artworkUrl,
        audioLocation,
        distributionStatus,
        isrc,
        upc,
        rightsInfo,
        releaseNotes,
        publicUrl,
        budgetAllocated,
        budgetSpent
      });
    } else {
      const created = addRelease({
        title,
        type,
        artistId,
        artistName,
        featuredArtists,
        producer,
        songwriters,
        credits,
        plannedReleaseDate,
        artworkUrl,
        audioLocation,
        distributionStatus,
        isrc,
        upc,
        rightsInfo,
        releaseNotes,
        marketingAssetsCount: 0,
        publicUrl,
        budgetAllocated,
        budgetSpent,
        checklist: {
          audioMastered: false,
          artworkApproved: false,
          splitSheetSigned: false,
          metadataVerified: false,
          distributionSubmitted: false,
          pressKitReady: false,
          marketingAssetsReady: false
        }
      });
      setSelectedReleaseId(created.id);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            MUSIC RELEASE MANAGEMENT
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Singles, EPs, albums, catalog ISRCs, rights attribution, and global distribution readiness
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#121212] border border-[#242424] rounded">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${viewMode === 'list' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${viewMode === 'calendar' ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'}`}
            >
              Calendar
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors whitespace-nowrap"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Schedule Release</span>
          </button>
        </div>
      </div>

      {workspaceReleases.length === 0 ? (
        <EmptyState
          icon={Disc3}
          title="No Music Releases Scheduled"
          description={`Build your ${activeWorkspace.name} catalog pipeline. Schedule your first single, EP, or full album master.`}
          actionLabel="Schedule First Release"
          onAction={handleOpenCreateModal}
        />
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Calendar size={15} />
              <span>Release Calendar & Roadmap</span>
            </h2>
            <span className="text-[11px] font-mono text-neutral-400">CHRONOLOGICAL SCHEDULE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[...workspaceReleases].sort((a, b) => new Date(a.plannedReleaseDate).getTime() - new Date(b.plannedReleaseDate).getTime()).map(rel => (
              <div 
                key={rel.id} 
                onClick={() => {
                  setSelectedReleaseId(rel.id);
                  setViewMode('list');
                }}
                className="p-4 bg-[#121212] border border-[#1E1E1E] rounded-md hover:border-[#333333] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2">
                  <span className="text-white font-semibold">{rel.plannedReleaseDate}</span>
                  <span className="uppercase">{rel.type}</span>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{rel.title}</h4>
                <div className="text-xs text-neutral-400 truncate mt-0.5">{rel.artistName}</div>

                <div className="mt-4 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-neutral-500">ISRC: {rel.isrc || 'Pending'}</span>
                  <span className="text-neutral-300 font-medium">{rel.distributionStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Standard 2-Column Split: Catalog Browser + Release Dossier */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Releases List (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 bg-[#121212] border border-[#242424] rounded overflow-x-auto">
              {(['All', 'Single', 'EP', 'Album', 'Music Video'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-2.5 py-1 text-[11px] font-mono whitespace-nowrap rounded ${
                    filterType === tab ? 'bg-[#262626] text-white font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredReleases.map(rel => {
                const isSelected = rel.id === selectedRelease?.id;
                const checks = Object.values(rel.checklist);
                const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100);

                return (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedReleaseId(rel.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#181818] border-neutral-400 text-white' 
                        : 'bg-[#0E0E0E] border-[#1E1E1E] text-neutral-300 hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                      <span className="uppercase">{rel.type}</span>
                      <span className="tabular-nums">{rel.plannedReleaseDate}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-white truncate">{rel.title}</h4>
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">{rel.artistName}</div>

                    <div className="mt-3 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-neutral-400">{rel.distributionStatus}</span>
                      <span className="text-neutral-300 tabular-nums">{percent}% READY</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Release Control & Checklist (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedRelease && (
              <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-6">
                {/* Header banner */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#1C1C1C] pb-6">
                  <div className="flex items-start gap-4">
                    {selectedRelease.artworkUrl ? (
                      <img 
                        src={selectedRelease.artworkUrl} 
                        alt={selectedRelease.title} 
                        referrerPolicy="no-referrer"
                        className="w-24 h-24 rounded-md object-cover grayscale contrast-125 border border-[#333333] shrink-0" 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-md bg-[#161616] flex items-center justify-center text-white border border-[#333333] shrink-0">
                        <Disc3 size={32} />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
                        <span>{selectedRelease.type.toUpperCase()}</span>
                        <span>·</span>
                        <span>RELEASE DATE: {selectedRelease.plannedReleaseDate}</span>
                      </div>

                      <h2 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">
                        {selectedRelease.title}
                      </h2>

                      <div className="text-xs font-mono text-neutral-300 mt-1">
                        Main Artist: <span className="text-white font-semibold">{selectedRelease.artistName}</span>
                        {selectedRelease.featuredArtists && (
                          <span className="text-neutral-400"> (feat. {selectedRelease.featuredArtists})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(selectedRelease)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white border border-[#2B2B2B] rounded transition-colors"
                    >
                      <Edit3 size={13} />
                      <span>Edit Details</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete release "${selectedRelease.title}" from catalog database?`)) {
                          deleteRelease(selectedRelease.id);
                        }
                      }}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-[#1A1A1A] rounded transition-colors"
                      title="Delete release"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Distribution Status Stepper */}
                <div>
                  <div className="text-xs font-mono text-neutral-400 uppercase mb-2">DISTRIBUTION STATUS</div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {(['Planning', 'In Production', 'Metadata Verification', 'Scheduled', 'Delivered', 'Live'] as DistributionStatus[]).map((st) => {
                      const isActive = selectedRelease.distributionStatus === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(selectedRelease.id, st)}
                          className={`p-2 rounded text-[11px] font-mono text-center border transition-all ${
                            isActive 
                              ? 'bg-white text-black font-semibold border-white shadow-sm' 
                              : 'bg-[#121212] text-neutral-400 border-[#1E1E1E] hover:border-[#333333]'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Release Readiness Checklist */}
                <div className="border border-[#1E1E1E] rounded-md bg-[#121212] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-white" />
                      <span>Release Readiness Checklist</span>
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-400">CLICK TO TOGGLE STATUS</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {[
                      { key: 'audioMastered', label: '24-Bit Audio Master Signed Off' },
                      { key: 'artworkApproved', label: '3000x3000px Artwork Approved' },
                      { key: 'splitSheetSigned', label: 'Songwriter Split Sheet Executed' },
                      { key: 'metadataVerified', label: 'ISRC & UPC Registry Verified' },
                      { key: 'distributionSubmitted', label: 'DSP Ingestion Feed Dispatched' },
                      { key: 'pressKitReady', label: 'Press Kit & EPK Assembled' },
                      { key: 'marketingAssetsReady', label: 'Rollout Visual Assets Exported' }
                    ].map(item => {
                      const isChecked = selectedRelease.checklist[item.key as keyof MusicRelease['checklist']];
                      return (
                        <button
                          key={item.key}
                          onClick={() => handleToggleChecklist(selectedRelease.id, item.key as any)}
                          className={`flex items-center justify-between p-2.5 rounded border text-left transition-colors ${
                            isChecked 
                              ? 'bg-[#181818] border-neutral-400 text-white' 
                              : 'bg-[#0E0E0E] border-[#222222] text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <span className="truncate pr-2">{item.label}</span>
                          <span className={`w-4 h-4 rounded-none border flex items-center justify-center shrink-0 ${
                            isChecked ? 'border-white bg-white text-black' : 'border-neutral-600'
                          }`}>
                            {isChecked && <Check size={11} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Metadata & Legal Attribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-[#121212] p-4 rounded border border-[#1E1E1E] space-y-2">
                    <span className="text-[10px] text-neutral-500 block uppercase">CATALOG METADATA</span>
                    <div><span className="text-neutral-400">ISRC:</span> <span className="text-white font-medium">{selectedRelease.isrc || 'Pending Generation'}</span></div>
                    <div><span className="text-neutral-400">UPC / EAN:</span> <span className="text-white font-medium">{selectedRelease.upc || 'Pending Ingestion'}</span></div>
                    <div><span className="text-neutral-400">Master Stems:</span> <span className="text-neutral-300 truncate block">{selectedRelease.audioLocation || 'Not linked'}</span></div>
                  </div>

                  <div className="bg-[#121212] p-4 rounded border border-[#1E1E1E] space-y-2">
                    <span className="text-[10px] text-neutral-500 block uppercase">CREDITS & ATTRIBUTION</span>
                    <div><span className="text-neutral-400">Producer:</span> <span className="text-white">{selectedRelease.producer}</span></div>
                    <div><span className="text-neutral-400">Songwriters:</span> <span className="text-white">{selectedRelease.songwriters}</span></div>
                    <div><span className="text-neutral-400">Rights:</span> <span className="text-neutral-300 text-[11px] block">{selectedRelease.rightsInfo}</span></div>
                  </div>
                </div>

                {/* Budget & Marketing Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-[#121212] border border-[#1E1E1E] rounded">
                    <span className="text-[10px] text-neutral-500 block">BUDGET ALLOCATED</span>
                    <span className="text-lg font-bold text-white tabular-nums">${(selectedRelease.budgetAllocated || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-[#121212] border border-[#1E1E1E] rounded">
                    <span className="text-[10px] text-neutral-500 block">BUDGET EXPENDED</span>
                    <span className="text-lg font-bold text-white tabular-nums">${(selectedRelease.budgetSpent || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-[#121212] border border-[#1E1E1E] rounded">
                    <span className="text-[10px] text-neutral-500 block">CAMPAIGN ASSETS</span>
                    <span className="text-lg font-bold text-white tabular-nums">{selectedRelease.marketingAssetsCount} Deliverables</span>
                  </div>
                </div>

                {/* Release Notes */}
                {selectedRelease.releaseNotes && (
                  <div className="p-4 bg-[#121212] border border-[#1E1E1E] rounded text-xs text-neutral-300">
                    <span className="text-[10px] font-mono text-neutral-500 block mb-1">EXECUTIVE NOTES</span>
                    <p className="leading-relaxed">{selectedRelease.releaseNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Release Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0E0E0E] border border-[#242424] rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">
              {editingId ? 'Edit Music Release' : 'Schedule New Music Release'}
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              Enter official catalog metadata, producer credits, and distribution parameters
            </p>

            <form onSubmit={handleSaveRelease} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-neutral-400 mb-1">PROJECT TITLE *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Midnight Architecture"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">TYPE *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as ReleaseType)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                  >
                    <option value="Single">Single</option>
                    <option value="EP">EP</option>
                    <option value="Album">Album</option>
                    <option value="Music Video">Music Video</option>
                    <option value="Collaboration">Collaboration</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">MAIN ARTIST *</label>
                  <select
                    required
                    value={artistId}
                    onChange={e => setArtistId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                  >
                    <option value="">Select artist...</option>
                    {workspaceArtists.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">FEATURED ARTISTS</label>
                  <input
                    type="text"
                    value={featuredArtists}
                    onChange={e => setFeaturedArtists(e.target.value)}
                    placeholder="Optional guest features"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">PLANNED RELEASE DATE *</label>
                  <input
                    type="date"
                    required
                    value={plannedReleaseDate}
                    onChange={e => setPlannedReleaseDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">DISTRIBUTION STATUS</label>
                  <select
                    value={distributionStatus}
                    onChange={e => setDistributionStatus(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Production">In Production</option>
                    <option value="Metadata Verification">Metadata Verification</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Live">Live</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">PRODUCER CREDITS</label>
                  <input
                    type="text"
                    value={producer}
                    onChange={e => setProducer(e.target.value)}
                    placeholder="e.g. Kaelen Vance"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">SONGWRITERS</label>
                  <input
                    type="text"
                    value={songwriters}
                    onChange={e => setSongwriters(e.target.value)}
                    placeholder="Full composer names"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">ISRC CODE</label>
                  <input
                    type="text"
                    value={isrc}
                    onChange={e => setIsrc(e.target.value)}
                    placeholder="US-LYR-26-00000"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">UPC / BARCODE</label>
                  <input
                    type="text"
                    value={upc}
                    onChange={e => setUpc(e.target.value)}
                    placeholder="198000000000"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">BUDGET ALLOCATED ($)</label>
                  <input
                    type="number"
                    value={budgetAllocated}
                    onChange={e => setBudgetAllocated(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">BUDGET SPENT ($)</label>
                  <input
                    type="number"
                    value={budgetSpent}
                    onChange={e => setBudgetSpent(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">COPYRIGHT & RIGHTS HOLDER NOTICE</label>
                <input
                  type="text"
                  value={rightsInfo}
                  onChange={e => setRightsInfo(e.target.value)}
                  placeholder="(P) & (C) 2026 LYRICAL ENT LLC."
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">RELEASE NOTES & DSP LOGISTICS</label>
                <textarea
                  rows={2}
                  value={releaseNotes}
                  onChange={e => setReleaseNotes(e.target.value)}
                  placeholder="Mastering details, distribution instructions..."
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="pt-4 border-t border-[#1C1C1C] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                >
                  Save Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
