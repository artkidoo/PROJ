import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MusicRelease, 
  ReleaseType, 
  DistributionStatus, 
  CampaignStage, 
  DeliverableWorkflowStage,
  ReleaseDeliverableItem,
  AudioMetadata,
  ArtworkMetadata
} from '../../types';
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
  FileText, 
  DollarSign,
  Package,
  Music,
  Image as ImageIcon,
  Film,
  Send,
  Eye,
  RefreshCw,
  Share2,
  FolderArchive,
  ArrowRight
} from 'lucide-react';

export const MusicReleaseManagement: React.FC = () => {
  const { 
    releases, 
    artists, 
    addRelease, 
    updateRelease, 
    deleteRelease, 
    servicePackages,
    publishDeliverableToClient,
    updateDeliverableStage,
    clientApproveReleaseDeliverable,
    clientRequestRevisionDeliverable,
    searchQuery, 
    activeWorkspace 
  } = useApp();
  
  const workspaceReleases = releases.filter(r => r.workspaceId === activeWorkspace.id);
  const workspaceArtists = artists.filter(a => a.workspaceId === activeWorkspace.id);

  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(workspaceReleases[0]?.id || null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterType, setFilterType] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'deliverables' | 'audioArtwork' | 'campaign' | 'checklist'>('deliverables');

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

  // Phase 5 Form States
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-music-promo-deluxe');
  const [selectedCampaignStage, setSelectedCampaignStage] = useState<CampaignStage>('Pre-Release');
  const [audioFileName, setAudioFileName] = useState('');
  const [audioDurationSec, setAudioDurationSec] = useState<number>(210);
  const [audioFormat, setAudioFormat] = useState('24-Bit / 96kHz Lossless WAV');
  const [audioFileSize, setAudioFileSize] = useState('65.4 MB');
  const [artworkDimensions, setArtworkDimensions] = useState('3000x3000px');
  const [artworkDpi, setArtworkDpi] = useState<number>(300);

  // New Deliverable Inline Form
  const [isAddDeliverableOpen, setIsAddDeliverableOpen] = useState(false);
  const [newDelivName, setNewDelivName] = useState('');
  const [newDelivCategory, setNewDelivCategory] = useState<'Artwork' | 'Motion Video' | 'Social Asset' | 'EPK & Press' | 'Audio Master'>('Artwork');
  const [newDelivFormat, setNewDelivFormat] = useState('1:1 Square (3000x3000px)');

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
    const workspaceShort = activeWorkspace.name.slice(0, 3).toUpperCase();

    setEditingId(null);
    setTitle('');
    setType('Single');
    setArtistId(workspaceArtists[0]?.id || '');
    setFeaturedArtists('');
    setProducer(`${activeWorkspace.name} Studio`);
    setSongwriters('');
    setCredits(`Executive Producer: ${activeWorkspace.name} LLC.`);
    setPlannedReleaseDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setArtworkUrl(activeWorkspace.brand?.logoUrl || '/src/assets/images/vinyl_press_mockup_1792791744149.jpg');
    setAudioLocation(`${workspaceShort} Cloud Vault // Master_WAV.zip`);
    setDistributionStatus('Planning');
    setIsrc('');
    setUpc('');
    setRightsInfo(`(P) & (C) ${new Date().getFullYear()} ${activeWorkspace.name} LLC.`);
    setReleaseNotes('');
    setPublicUrl('');
    setBudgetAllocated(10000);
    setBudgetSpent(0);
    setSelectedPackageId('pkg-music-promo-deluxe');
    setSelectedCampaignStage('Pre-Release');
    setAudioFileName('');
    setAudioDurationSec(210);
    setAudioFormat('24-Bit / 96kHz Lossless WAV');
    setAudioFileSize('65.4 MB');
    setArtworkDimensions('3000x3000px');
    setArtworkDpi(300);
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
    setSelectedPackageId(rel.packageId || 'pkg-music-promo-deluxe');
    setSelectedCampaignStage(rel.campaignStage || 'Pre-Release');
    setAudioFileName(rel.audioMetadata?.fileName || '');
    setAudioDurationSec(rel.audioMetadata?.durationSeconds || 210);
    setAudioFormat(rel.audioMetadata?.format || '24-Bit / 96kHz Lossless WAV');
    setAudioFileSize(rel.audioMetadata?.fileSize || '65.4 MB');
    setArtworkDimensions(rel.artworkMetadata?.dimensions || '3000x3000px');
    setArtworkDpi(rel.artworkMetadata?.resolutionDpi || 300);
    setIsModalOpen(true);
  };

  const handleSaveRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artistId || !plannedReleaseDate) return;

    const artistObj = workspaceArtists.find(a => a.id === artistId);
    const artistName = artistObj ? artistObj.name : 'Unknown Artist';

    const audioMeta: AudioMetadata = {
      fileName: audioFileName.trim() || undefined,
      durationSeconds: Number(audioDurationSec) || 0,
      format: audioFormat,
      fileSize: audioFileSize,
      uploadedAt: new Date().toISOString()
    };

    const artworkMeta: ArtworkMetadata = {
      dimensions: artworkDimensions,
      resolutionDpi: Number(artworkDpi) || 300,
      colorSpace: 'sRGB',
      fileSize: '12.4 MB',
      uploadedAt: new Date().toISOString()
    };

    // If initial deliverables empty, populate from chosen package
    const chosenPkg = servicePackages.find(p => p.id === selectedPackageId);
    const defaultDeliverables: ReleaseDeliverableItem[] = (chosenPkg?.deliverables || []).map((dName, idx) => ({
      id: `deliv-${Date.now()}-${idx}`,
      name: dName,
      category: dName.toLowerCase().includes('canvas') || dName.toLowerCase().includes('motion') ? 'Motion Video' :
                dName.toLowerCase().includes('artwork') || dName.toLowerCase().includes('cover') ? 'Artwork' :
                dName.toLowerCase().includes('press') || dName.toLowerCase().includes('epk') ? 'EPK & Press' : 'Social Asset',
      format: dName.toLowerCase().includes('canvas') ? '9:16 Vertical (1080x1920px)' :
              dName.toLowerCase().includes('artwork') ? '1:1 Square (3000x3000px)' : 'Standard Specification',
      stage: idx === 0 ? 'In Production' : 'Brief',
      revisionCount: 0,
      maxRevisions: chosenPkg?.revisionLimit || 3,
      isClientPublished: false
    }));

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
        isrc: isrc.trim() || undefined,
        upc: upc.trim() || undefined,
        rightsInfo,
        releaseNotes,
        publicUrl,
        budgetAllocated,
        budgetSpent,
        packageId: selectedPackageId,
        campaignStage: selectedCampaignStage,
        audioMetadata: audioMeta,
        artworkMetadata: artworkMeta
      });
    } else {
      addRelease({
        workspaceId: activeWorkspace.id,
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
        isrc: isrc.trim() || undefined,
        upc: upc.trim() || undefined,
        rightsInfo,
        releaseNotes,
        publicUrl,
        marketingAssetsCount: defaultDeliverables.length,
        budgetAllocated,
        budgetSpent,
        packageId: selectedPackageId,
        campaignStage: selectedCampaignStage,
        audioMetadata: audioMeta,
        artworkMetadata: artworkMeta,
        deliverables: defaultDeliverables,
        checklist: {
          audioMastered: !!audioFileName,
          artworkApproved: false,
          splitSheetSigned: false,
          metadataVerified: false,
          distributionSubmitted: false,
          pressKitReady: false,
          marketingAssetsReady: false
        }
      });
    }

    setIsModalOpen(false);
  };

  // Add individual deliverable item to selected release
  const handleAddDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelease || !newDelivName.trim()) return;

    const newDeliv: ReleaseDeliverableItem = {
      id: `deliv-${Date.now()}`,
      name: newDelivName.trim(),
      category: newDelivCategory,
      format: newDelivFormat,
      stage: 'Brief',
      revisionCount: 0,
      maxRevisions: 3,
      isClientPublished: false
    };

    const currentList = selectedRelease.deliverables || [];
    updateRelease(selectedRelease.id, {
      deliverables: [...currentList, newDeliv],
      marketingAssetsCount: currentList.length + 1
    });

    setNewDelivName('');
    setIsAddDeliverableOpen(false);
  };

  // Synchronize deliverables from assigned package
  const handleSyncPackageDeliverables = () => {
    if (!selectedRelease || !selectedRelease.packageId) return;
    const pkg = servicePackages.find(p => p.id === selectedRelease.packageId);
    if (!pkg) return;

    const existingNames = new Set((selectedRelease.deliverables || []).map(d => d.name));
    const toAdd = pkg.deliverables
      .filter(dName => !existingNames.has(dName))
      .map((dName, idx) => ({
        id: `deliv-${Date.now()}-${idx}`,
        name: dName,
        category: dName.toLowerCase().includes('canvas') || dName.toLowerCase().includes('motion') ? 'Motion Video' as const :
                  dName.toLowerCase().includes('artwork') || dName.toLowerCase().includes('cover') ? 'Artwork' as const :
                  dName.toLowerCase().includes('press') || dName.toLowerCase().includes('epk') ? 'EPK & Press' as const : 'Social Asset' as const,
        format: dName.toLowerCase().includes('canvas') ? '9:16 Vertical (1080x1920px)' :
                dName.toLowerCase().includes('artwork') ? '1:1 Square (3000x3000px)' : 'Standard Specification',
        stage: 'Brief' as const,
        revisionCount: 0,
        maxRevisions: pkg.revisionLimit,
        isClientPublished: false
      }));

    if (toAdd.length > 0) {
      const merged = [...(selectedRelease.deliverables || []), ...toAdd];
      updateRelease(selectedRelease.id, {
        deliverables: merged,
        marketingAssetsCount: merged.length
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF1E1E] animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
              PHASE 5: MUSIC RELEASE &amp; MOTION PRODUCTION COMMAND
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
            MUSIC RELEASE COMMAND CENTER
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Multi-stage release project workflows, deliverable pipeline tracking, audio stem verification, and client review publishing gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#242424] rounded bg-[#121212] p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                viewMode === 'list' ? 'bg-[#262626] text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Catalog View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                viewMode === 'calendar' ? 'bg-[#262626] text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Roadmap View
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#FF1E1E] hover:bg-red-600 text-white rounded transition-colors shadow-md"
          >
            <Plus size={14} />
            <span>New Release</span>
          </button>
        </div>
      </div>

      {workspaceReleases.length === 0 ? (
        <EmptyState
          icon={Disc3}
          title="No releases scheduled in this workspace"
          description="Create your first music release project to organize audio stems, artwork, motion packages, and campaign stages."
          actionLabel="Schedule Release"
          onAction={handleOpenCreateModal}
        />
      ) : viewMode === 'calendar' ? (
        /* Calendar / Roadmap View */
        <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Calendar size={15} />
              <span>Release Calendar &amp; Roadmap</span>
            </h2>
            <span className="text-[11px] font-mono text-neutral-400">CHRONOLOGICAL SCHEDULE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[...workspaceReleases]
              .sort((a, b) => new Date(a.plannedReleaseDate).getTime() - new Date(b.plannedReleaseDate).getTime())
              .map(rel => (
                <div 
                  key={rel.id} 
                  onClick={() => {
                    setSelectedReleaseId(rel.id);
                    setViewMode('list');
                  }}
                  className="p-4 bg-[#121212] border border-[#1E1E1E] rounded-md hover:border-[#333333] transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="text-white font-semibold">{rel.plannedReleaseDate}</span>
                    <span className="uppercase text-[#FF1E1E] font-bold">{rel.type}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{rel.title}</h4>
                  <div className="text-xs text-neutral-400 truncate">{rel.artistName}</div>

                  <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono">
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
                const deliverablesCount = (rel.deliverables || []).length;
                const deliveredCount = (rel.deliverables || []).filter(d => d.stage === 'Delivered').length;

                return (
                  <div
                    key={rel.id}
                    onClick={() => setSelectedReleaseId(rel.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#181818] border-neutral-400 text-white shadow-sm' 
                        : 'bg-[#0E0E0E] border-[#1E1E1E] text-neutral-300 hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                      <span className="uppercase text-[#FF1E1E] font-bold">{rel.type}</span>
                      <span className="tabular-nums">{rel.plannedReleaseDate}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-white truncate">{rel.title}</h4>
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">{rel.artistName}</div>

                    <div className="mt-3 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-neutral-400">{rel.distributionStatus}</span>
                      <span className="text-neutral-300 tabular-nums">
                        {deliverablesCount > 0 ? `${deliveredCount}/${deliverablesCount} DELIVERED` : `${percent}% READY`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep Release Control & Phase 5 Workflows (8 Cols) */}
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
                        className="w-24 h-24 rounded-md object-cover border border-[#333333] shrink-0" 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-md bg-[#161616] flex items-center justify-center text-white border border-[#333333] shrink-0">
                        <Disc3 size={32} />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                        <span className="text-white font-bold uppercase">{selectedRelease.type}</span>
                        <span>·</span>
                        <span>DATE: {selectedRelease.plannedReleaseDate}</span>
                        {selectedRelease.packageId && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400">
                              {servicePackages.find(p => p.id === selectedRelease.packageId)?.name || 'Custom Package'}
                            </span>
                          </>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">
                        {selectedRelease.title}
                      </h2>

                      <div className="text-xs font-mono text-neutral-300">
                        Artist: <span className="text-white font-semibold">{selectedRelease.artistName}</span>
                        {selectedRelease.featuredArtists && (
                          <span className="text-neutral-400"> (feat. {selectedRelease.featuredArtists})</span>
                        )}
                      </div>

                      {/* Client Approval Status Banner */}
                      <div className="pt-1">
                        {selectedRelease.clientApprovalStatus === 'Approved' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            <CheckCircle2 size={12} />
                            CLIENT SIGN-OFF EXECUTED ({selectedRelease.clientApprovalDate?.split('T')[0] || 'APPROVED'})
                          </span>
                        ) : selectedRelease.clientApprovalStatus === 'Revision Requested' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-800/40">
                            <AlertCircle size={12} />
                            CLIENT REVISION REQUESTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-400 border border-neutral-700">
                            <Clock size={12} />
                            CLIENT REVIEW PENDING
                          </span>
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
                      <span>Edit Release</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete release "${selectedRelease.title}" from catalog?`)) {
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

                {/* Section Navigation Tabs */}
                <div className="flex border-b border-[#1E1E1E] gap-2 overflow-x-auto text-xs font-mono">
                  <button
                    onClick={() => setActiveTab('deliverables')}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
                      activeTab === 'deliverables' ? 'border-[#FF1E1E] text-white font-bold' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Package size={14} />
                    <span>Deliverables &amp; Review ({(selectedRelease.deliverables || []).length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('audioArtwork')}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
                      activeTab === 'audioArtwork' ? 'border-[#FF1E1E] text-white font-bold' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Music size={14} />
                    <span>Audio &amp; Artwork Master Stems</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('campaign')}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
                      activeTab === 'campaign' ? 'border-[#FF1E1E] text-white font-bold' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Send size={14} />
                    <span>Campaign Stage Tracker</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('checklist')}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
                      activeTab === 'checklist' ? 'border-[#FF1E1E] text-white font-bold' : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>Readiness &amp; Legal</span>
                  </button>
                </div>

                {/* TAB 1: DELIVERABLES & CLIENT REVIEW GATES */}
                {activeTab === 'deliverables' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-mono uppercase text-white font-bold flex items-center gap-1.5">
                          <span>Package Deliverables &amp; Revision Tracking</span>
                        </h3>
                        <p className="text-[11px] text-neutral-400">
                          Track included assets through Brief, Production, Internal QA, Client Review, and Final Delivery.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedRelease.packageId && (
                          <button
                            onClick={handleSyncPackageDeliverables}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-[#161616] hover:bg-[#202020] text-neutral-300 rounded border border-[#2B2B2B] transition-colors"
                            title="Populate missing deliverables from package catalog"
                          >
                            <RefreshCw size={11} />
                            <span>Sync Package Specs</span>
                          </button>
                        )}

                        <button
                          onClick={() => setIsAddDeliverableOpen(!isAddDeliverableOpen)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-[#FF1E1E] hover:bg-red-600 text-white rounded transition-colors"
                        >
                          <Plus size={12} />
                          <span>Add Deliverable</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Add Deliverable Form */}
                    {isAddDeliverableOpen && (
                      <form onSubmit={handleAddDeliverable} className="p-3.5 bg-[#141414] border border-[#262626] rounded-lg space-y-3 text-xs font-mono">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-neutral-400 mb-1">DELIVERABLE NAME *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Master Cover Artwork (3000x3000px)"
                              value={newDelivName}
                              onChange={e => setNewDelivName(e.target.value)}
                              className="w-full bg-[#1C1C1C] border border-[#333333] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#FF1E1E]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-neutral-400 mb-1">CATEGORY</label>
                            <select
                              value={newDelivCategory}
                              onChange={e => setNewDelivCategory(e.target.value as any)}
                              className="w-full bg-[#1C1C1C] border border-[#333333] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#FF1E1E]"
                            >
                              <option value="Artwork">Artwork</option>
                              <option value="Motion Video">Motion Video</option>
                              <option value="Social Asset">Social Asset</option>
                              <option value="EPK & Press">EPK & Press</option>
                              <option value="Audio Master">Audio Master</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] text-neutral-400 mb-1">TARGET SPECIFICATION</label>
                            <input
                              type="text"
                              placeholder="e.g. 1:1 Square (3000x3000px) or 9:16 Vertical Story"
                              value={newDelivFormat}
                              onChange={e => setNewDelivFormat(e.target.value)}
                              className="w-full bg-[#1C1C1C] border border-[#333333] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#FF1E1E]"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-4">
                            <button
                              type="button"
                              onClick={() => setIsAddDeliverableOpen(false)}
                              className="px-3 py-1.5 text-neutral-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-[#FF1E1E] text-white font-bold rounded"
                            >
                              Add to Pipeline
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Deliverables List Table */}
                    <div className="border border-[#1E1E1E] rounded-lg overflow-hidden bg-[#121212]">
                      {(selectedRelease.deliverables || []).length > 0 ? (
                        <div className="divide-y divide-[#1A1A1A]">
                          {(selectedRelease.deliverables || []).map(deliv => {
                            const stageColor = 
                              deliv.stage === 'Delivered' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' :
                              deliv.stage === 'Client Review' ? 'text-amber-400 bg-amber-950/40 border-amber-800/40' :
                              deliv.stage === 'Revision Required' ? 'text-red-400 bg-red-950/40 border-red-800/40' :
                              deliv.stage === 'Internal QA' ? 'text-blue-400 bg-blue-950/40 border-blue-800/40' :
                              'text-neutral-400 bg-neutral-900 border-neutral-700';

                            return (
                              <div key={deliv.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161616] transition-colors">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-xs">{deliv.name}</span>
                                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${stageColor}`}>
                                      {deliv.stage}
                                    </span>
                                    {deliv.clientApproved && (
                                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 size={11} />
                                        APPROVED
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-neutral-400 flex flex-wrap items-center gap-3">
                                    <span>Format: <strong className="text-neutral-300">{deliv.format}</strong></span>
                                    <span>·</span>
                                    <span>Revisions: <strong className="text-neutral-300">{deliv.revisionCount} / {deliv.maxRevisions}</strong></span>
                                    {deliv.fileSpecs && (
                                      <>
                                        <span>·</span>
                                        <span>Specs: <strong className="text-neutral-300">{deliv.fileSpecs}</strong></span>
                                      </>
                                    )}
                                  </div>

                                  {deliv.clientFeedback && (
                                    <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-800/30 mt-1">
                                      Client Note: "{deliv.clientFeedback}"
                                    </div>
                                  )}
                                </div>

                                {/* Operator Controls */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Stage Stepper Dropdown */}
                                  <select
                                    value={deliv.stage}
                                    onChange={e => updateDeliverableStage(selectedRelease.id, deliv.id, e.target.value as DeliverableWorkflowStage)}
                                    className="bg-[#1C1C1C] text-neutral-300 text-xs font-mono rounded px-2.5 py-1 border border-[#333333] focus:outline-none"
                                  >
                                    <option value="Brief">Brief</option>
                                    <option value="In Production">In Production</option>
                                    <option value="Internal QA">Internal QA</option>
                                    <option value="Client Review">Client Review</option>
                                    <option value="Revision Required">Revision Required</option>
                                    <option value="Delivered">Delivered</option>
                                  </select>

                                  {/* Client Publishing Gate */}
                                  <button
                                    onClick={() => publishDeliverableToClient(selectedRelease.id, deliv.id, !deliv.isClientPublished)}
                                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                                      deliv.isClientPublished
                                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 hover:bg-neutral-800'
                                        : 'bg-[#1C1C1C] text-neutral-400 hover:text-white border border-[#2E2E2E]'
                                    }`}
                                    title={deliv.isClientPublished ? 'Visible to client in their workspace' : 'Draft stage - hidden from client'}
                                  >
                                    {deliv.isClientPublished ? 'Published to Client' : 'Private Draft'}
                                  </button>

                                  {/* Approve / Sign-Off Button */}
                                  {!deliv.clientApproved && (
                                    <button
                                      onClick={() => clientApproveReleaseDeliverable(selectedRelease.id, deliv.id)}
                                      className="px-2.5 py-1 rounded text-[11px] font-mono bg-white hover:bg-neutral-200 text-black font-semibold transition-colors"
                                      title="Record official sign-off on deliverable"
                                    >
                                      Sign-Off
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs font-mono text-neutral-500">
                          No deliverables assigned yet. Click "Sync Package Specs" or "Add Deliverable".
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: AUDIO & ARTWORK MASTER STEMS */}
                {activeTab === 'audioArtwork' && (
                  <div className="space-y-4 font-mono text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Audio Master File Particulars */}
                      <div className="bg-[#121212] border border-[#1E1E1E] rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-2">
                          <span className="font-bold text-white uppercase flex items-center gap-1.5">
                            <Music size={14} className="text-[#FF1E1E]" />
                            Lossless Master Audio Stems
                          </span>
                          <span className="text-[10px] text-emerald-400">VERIFIED STEM</span>
                        </div>

                        <div className="space-y-2 text-neutral-300">
                          <div>
                            <span className="text-neutral-500 block text-[10px]">FILE NAME:</span>
                            <span className="text-white font-semibold">
                              {selectedRelease.audioMetadata?.fileName || selectedRelease.audioLocation || 'Master_WAV_Lossless.zip'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-neutral-500 block text-[10px]">FORMAT:</span>
                              <span>{selectedRelease.audioMetadata?.format || '24-Bit / 96kHz PCM'}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500 block text-[10px]">DURATION:</span>
                              <span>
                                {selectedRelease.audioMetadata?.durationSeconds 
                                  ? `${Math.floor(selectedRelease.audioMetadata.durationSeconds / 60)}m ${selectedRelease.audioMetadata.durationSeconds % 60}s`
                                  : '3m 38s (218 seconds)'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-neutral-500 block text-[10px]">FILE SIZE:</span>
                              <span>{selectedRelease.audioMetadata?.fileSize || '78.4 MB'}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500 block text-[10px]">UPLOAD DATE:</span>
                              <span>{selectedRelease.audioMetadata?.uploadedAt?.split('T')[0] || selectedRelease.plannedReleaseDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px]">
                          <span className="text-neutral-500">Audio Inspection: PASSED</span>
                          <span className="text-white bg-[#1C1C1C] px-2 py-0.5 rounded">
                            STEREO 2.0 + DOLBY ATMOS
                          </span>
                        </div>
                      </div>

                      {/* Cover Artwork File Particulars */}
                      <div className="bg-[#121212] border border-[#1E1E1E] rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-2">
                          <span className="font-bold text-white uppercase flex items-center gap-1.5">
                            <ImageIcon size={14} className="text-amber-400" />
                            DSP Master Cover Artwork
                          </span>
                          <span className="text-[10px] text-emerald-400">DSP COMPLIANT</span>
                        </div>

                        <div className="space-y-2 text-neutral-300">
                          <div>
                            <span className="text-neutral-500 block text-[10px]">DIMENSIONS:</span>
                            <span className="text-white font-semibold">
                              {selectedRelease.artworkMetadata?.dimensions || '3000 x 3000 Pixels (1:1)'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-neutral-500 block text-[10px]">RESOLUTION:</span>
                              <span>{selectedRelease.artworkMetadata?.resolutionDpi || 300} DPI Print Ready</span>
                            </div>
                            <div>
                              <span className="text-neutral-500 block text-[10px]">COLOR SPACE:</span>
                              <span>{selectedRelease.artworkMetadata?.colorSpace || 'sRGB Master'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-neutral-500 block text-[10px]">FILE SIZE:</span>
                              <span>{selectedRelease.artworkMetadata?.fileSize || '14.2 MB'}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500 block text-[10px]">INSPECTION STATUS:</span>
                              <span className="text-emerald-400 font-bold">APPROVED FOR DSP</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px]">
                          <span className="text-neutral-500">Apple Music &amp; Spotify QA: PASSED</span>
                          <a 
                            href={selectedRelease.artworkUrl || '#'} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[#FF1E1E] hover:underline flex items-center gap-1"
                          >
                            <span>Inspect Full Artwork</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: CAMPAIGN STAGE TRACKER */}
                {activeTab === 'campaign' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      {[
                        { stage: 'Pre-Release', desc: 'Pre-saves, countdown stories, press kit dispatch, teaser visualizers' },
                        { stage: 'Release Day', desc: 'Out Now campaigns, DSP streaming links, Spotify 9:16 canvas activation' },
                        { stage: 'Post-Release', desc: 'Editorial playlist push, lyric videos, acoustic stems, physical vinyl' }
                      ].map(item => {
                        const isActive = (selectedRelease.campaignStage || 'Pre-Release') === item.stage;
                        return (
                          <button
                            key={item.stage}
                            onClick={() => updateRelease(selectedRelease.id, { campaignStage: item.stage as CampaignStage })}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              isActive 
                                ? 'bg-[#181818] border-[#FF1E1E] text-white shadow-sm' 
                                : 'bg-[#121212] border-[#222222] text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            <div className="font-bold uppercase flex items-center justify-between mb-1">
                              <span>{item.stage}</span>
                              {isActive && <Check size={12} className="text-[#FF1E1E]" />}
                            </div>
                            <p className="text-[10px] leading-tight text-neutral-400">{item.desc}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Campaign Deliverables Checklist */}
                    <div className="p-4 rounded-lg bg-[#121212] border border-[#1E1E1E] space-y-3 text-xs font-mono">
                      <div className="text-[10px] text-neutral-400 uppercase">
                        CURRENT ACTIVE MILESTONE: <strong className="text-white">{selectedRelease.campaignStage || 'Pre-Release'}</strong>
                      </div>

                      <div className="space-y-2">
                        {[
                          { label: 'Single Artwork Master & DSP Verification', done: selectedRelease.checklist.artworkApproved },
                          { label: 'Spotify 9:16 Canvas Loop Staged & Approved', done: (selectedRelease.deliverables || []).some(d => d.category === 'Motion Video' && d.stage === 'Delivered') },
                          { label: 'ISRC & UPC Registry Catalog Entry', done: !!selectedRelease.isrc && !!selectedRelease.upc },
                          { label: 'Press Release Dispatch & EPK One-Sheet Prepared', done: selectedRelease.checklist.pressKitReady }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#161616] border border-[#222222]">
                            <span className="text-neutral-300">{item.label}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded ${item.done ? 'bg-emerald-950/60 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                              {item.done ? 'COMPLETED' : 'PENDING'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: READINESS CHECKLIST & LEGAL */}
                {activeTab === 'checklist' && (
                  <div className="space-y-4">
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

                    {/* Catalog Metadata & Attribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="bg-[#121212] p-4 rounded border border-[#1E1E1E] space-y-2">
                        <span className="text-[10px] text-neutral-500 block uppercase">CATALOG METADATA</span>
                        <div><span className="text-neutral-400">ISRC:</span> <span className="text-white font-medium">{selectedRelease.isrc || 'Pending Official Registration'}</span></div>
                        <div><span className="text-neutral-400">UPC / EAN:</span> <span className="text-white font-medium">{selectedRelease.upc || 'Pending Official Registration'}</span></div>
                        <div><span className="text-neutral-400">Master Stems:</span> <span className="text-neutral-300 truncate block">{selectedRelease.audioLocation || 'Not linked'}</span></div>
                      </div>

                      <div className="bg-[#121212] p-4 rounded border border-[#1E1E1E] space-y-2">
                        <span className="text-[10px] text-neutral-500 block uppercase">CREDITS &amp; ATTRIBUTION</span>
                        <div><span className="text-neutral-400">Producer:</span> <span className="text-white">{selectedRelease.producer}</span></div>
                        <div><span className="text-neutral-400">Songwriters:</span> <span className="text-white">{selectedRelease.songwriters}</span></div>
                        <div><span className="text-neutral-400">Rights:</span> <span className="text-neutral-300 text-[11px] block">{selectedRelease.rightsInfo}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Release Create/Edit Modal with Phase 5 Fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0E0E0E] border border-[#242424] rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">
              {editingId ? 'Edit Music Release Project' : 'Schedule New Music Release Project'}
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              Configure track metadata, package deliverable specifications, master stems, and release milestones.
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
                    placeholder="e.g. Monochrome State"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">TYPE *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as ReleaseType)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] cursor-pointer"
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
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] cursor-pointer"
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
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
                  />
                </div>
              </div>

              {/* Package Association & Campaign Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">ASSIGNED SERVICE PACKAGE</label>
                  <select
                    value={selectedPackageId}
                    onChange={e => setSelectedPackageId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] cursor-pointer"
                  >
                    {servicePackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} (${pkg.priceUsd.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">CAMPAIGN STAGE</label>
                  <select
                    value={selectedCampaignStage}
                    onChange={e => setSelectedCampaignStage(e.target.value as CampaignStage)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] cursor-pointer"
                  >
                    <option value="Pre-Release">Pre-Release (Teasers & Pre-Saves)</option>
                    <option value="Release Day">Release Day (DSP Live & Canvas)</option>
                    <option value="Post-Release">Post-Release (Lyric & Editorial Push)</option>
                  </select>
                </div>
              </div>

              {/* Planned Date & Distribution Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">PLANNED RELEASE DATE *</label>
                  <input
                    type="date"
                    required
                    value={plannedReleaseDate}
                    onChange={e => setPlannedReleaseDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">DISTRIBUTION STATUS</label>
                  <select
                    value={distributionStatus}
                    onChange={e => setDistributionStatus(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] cursor-pointer"
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

              {/* Audio Stem File Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-neutral-400 mb-1">AUDIO MASTER FILE NAME</label>
                  <input
                    type="text"
                    value={audioFileName}
                    onChange={e => setAudioFileName(e.target.value)}
                    placeholder="e.g. Monochrome_State_Master_24bit_96k.wav"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">AUDIO DURATION (SEC)</label>
                  <input
                    type="number"
                    min={1}
                    value={audioDurationSec}
                    onChange={e => setAudioDurationSec(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] font-mono"
                  />
                </div>
              </div>

              {/* Producer & Songwriter Credits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">PRODUCER CREDITS</label>
                  <input
                    type="text"
                    value={producer}
                    onChange={e => setProducer(e.target.value)}
                    placeholder="e.g. Kaelen Vance"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">SONGWRITERS</label>
                  <input
                    type="text"
                    value={songwriters}
                    onChange={e => setSongwriters(e.target.value)}
                    placeholder="Full composer names"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
                  />
                </div>
              </div>

              {/* Real ISRC / UPC Fields (Do not invent) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">
                    ISRC CODE <span className="text-neutral-500">(Optional if pending)</span>
                  </label>
                  <input
                    type="text"
                    value={isrc}
                    onChange={e => setIsrc(e.target.value)}
                    placeholder="e.g. US-LYR-26-00104"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">
                    UPC / BARCODE <span className="text-neutral-500">(Optional if pending)</span>
                  </label>
                  <input
                    type="text"
                    value={upc}
                    onChange={e => setUpc(e.target.value)}
                    placeholder="e.g. 198273948201"
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">COPYRIGHT &amp; RIGHTS HOLDER NOTICE</label>
                <input
                  type="text"
                  value={rightsInfo}
                  onChange={e => setRightsInfo(e.target.value)}
                  placeholder="(P) & (C) 2026 Artist / Label LLC."
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">RELEASE NOTES &amp; DSP LOGISTICS</label>
                <textarea
                  rows={2}
                  value={releaseNotes}
                  onChange={e => setReleaseNotes(e.target.value)}
                  placeholder="Mastering specifications, marketing delivery instructions..."
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
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
                  className="px-4 py-2 text-xs font-semibold bg-[#FF1E1E] hover:bg-red-600 text-white rounded transition-colors"
                >
                  Save Release Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
