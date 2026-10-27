import React from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../common/EmptyState';
import { WorkspaceLogo } from '../brand/LogoSystem';
import { 
  Users, 
  Disc3, 
  Clock, 
  FileCheck2, 
  FileText, 
  Megaphone, 
  Calendar, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Download,
  Send,
  Sparkles,
  Check,
  Film,
  Layers,
  Share2,
  Briefcase
} from 'lucide-react';
import { ClientRequestModal } from '../modals/ClientRequestModal';
import { triggerSvgDownload } from '../brand/LogoSystem';

const triggerBlobDownload = (filename: string, content: string, contentType: string = 'text/plain') => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const OverviewDashboard: React.FC = () => {
  const { 
    artists, 
    releases, 
    campaigns, 
    documents, 
    brandAssets,
    tasks, 
    activities, 
    openQuickAction, 
    setActiveModule,
    resetToSampleData,
    activeWorkspace,
    approveDeliverable,
    updateDocument,
    updateTask,
    productionProjects,
    canAccessProductionCenter,
    updateProductionProject
  } = useApp();

  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);
  const [approvalFeedback, setApprovalFeedback] = React.useState<string | null>(null);

  const isArtist = activeWorkspace.clientCategory === 'artist' || activeWorkspace.type === 'Artist';
  const isBrand = activeWorkspace.clientCategory === 'brand' || activeWorkspace.type === 'Brand';
  const brandAccent = activeWorkspace.brand?.accentColor || (isArtist ? '#D97706' : isBrand ? '#2563EB' : '#FF1E1E');

  // Filter data by active workspace
  const workspaceArtists = artists.filter(a => a.workspaceId === activeWorkspace.id);
  const workspaceReleases = releases.filter(r => r.workspaceId === activeWorkspace.id);
  const workspaceCampaigns = campaigns.filter(c => c.workspaceId === activeWorkspace.id);
  const workspaceDocuments = documents.filter(d => d.workspaceId === activeWorkspace.id);
  const workspaceBrandAssets = brandAssets.filter(b => b.workspaceId === activeWorkspace.id);
  const workspaceTasks = tasks.filter(t => t.workspaceId === activeWorkspace.id);

  // Calculate live operational metrics
  const totalArtists = workspaceArtists.length;
  const activeProjects = isBrand 
    ? workspaceBrandAssets.length + workspaceDocuments.length
    : workspaceReleases.filter(r => r.distributionStatus !== 'Live').length;
  const upcomingReleases = workspaceReleases.filter(r => {
    if (r.distributionStatus === 'Live') return false;
    const releaseDate = new Date(r.plannedReleaseDate);
    const now = new Date();
    return releaseDate >= now;
  }).length;
  
  const pendingApprovals = isArtist
    ? workspaceReleases.filter(r => !r.checklist.artworkApproved).length
    : isBrand
    ? workspaceDocuments.filter(d => d.status === 'Under Review' || d.status === 'Draft').length + workspaceTasks.filter(t => t.status === 'In Review').length
    : workspaceReleases.filter(r => !r.checklist.artworkApproved || !r.checklist.splitSheetSigned || r.distributionStatus === 'Metadata Verification').length;

  const documentsAwaitingReview = workspaceDocuments.filter(d => d.status === 'Under Review' || d.status === 'Draft').length;
  const activeCampaigns = workspaceCampaigns.filter(c => c.status === 'Active' || c.status === 'In Production' || c.status === 'In Review').length;

  const hasData = totalArtists > 0 || workspaceReleases.length > 0 || workspaceDocuments.length > 0 || workspaceBrandAssets.length > 0;

  // Sorted upcoming deadlines from releases and tasks
  const projectDeadlines = [
    ...workspaceReleases.filter(r => r.distributionStatus !== 'Live').map(r => ({
      id: r.id,
      title: `${r.title} (${r.type}) — Planned Release`,
      date: r.plannedReleaseDate,
      category: 'Release',
      status: r.distributionStatus,
      targetModule: 'releases' as const
    })),
    ...workspaceTasks.filter(t => t.status !== 'Done').map(t => ({
      id: t.id,
      title: t.title,
      date: t.dueDate,
      category: t.category,
      status: t.status,
      targetModule: isBrand ? 'brand' as const : 'operations' as const
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6);

  const handleApproveArtwork = (releaseId: string, title: string) => {
    approveDeliverable(releaseId);
    setApprovalFeedback(`✓ Approved artwork for "${title}". Production delivery locked.`);
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  // Published client deliverables from Production Center for active workspace
  const clientPublishedDeliverables = (productionProjects || [])
    .filter(p => p.workspaceId === activeWorkspace.id)
    .flatMap(p => 
      (p.versions || [])
        .filter(v => v.isClientPublished)
        .map(v => ({ project: p, version: v }))
    );

  const handleApproveProductionDeliverable = (projectId: string, versionId: string, versionTitle: string) => {
    const targetProject = (productionProjects || []).find(p => p.id === projectId);
    if (!targetProject) return;
    
    updateProductionProject(projectId, {
      stage: 'Ready for Delivery',
      versions: (targetProject.versions || []).map(v => 
        v.id === versionId ? { ...v, clientReviewStatus: 'Approved' as const, clientFeedback: 'Signed off and approved by client in workspace portal' } : v
      ),
      internalNotes: [
        ...(targetProject.internalNotes || []),
        {
          id: `not-${Date.now()}`,
          author: 'Client Verification',
          role: 'Client',
          content: `Deliverable version "${versionTitle}" approved in client review gate.`,
          timestamp: new Date().toISOString(),
          isInternalOnly: false
        }
      ]
    });
    setApprovalFeedback(`✓ Approved deliverable "${versionTitle}". Status advanced to Ready for Delivery.`);
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  const handleSignOffDocument = (docId: string, title: string) => {
    updateDocument(docId, { status: 'Approved' });
    setApprovalFeedback(`✓ Signed and approved "${title}".`);
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  const handleSignOffTask = (taskId: string, title: string) => {
    updateTask(taskId, { status: 'Done' });
    setApprovalFeedback(`✓ Completed & signed off on "${title}".`);
    setTimeout(() => setApprovalFeedback(null), 4000);
  };

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-mono">{activeWorkspace.name} OVERVIEW</h2>
          <p className="text-xs text-neutral-400 mt-1">
            {activeWorkspace.name} central operational intelligence and status
          </p>
        </div>

        <EmptyState
          icon={Disc3}
          title="No Operational Records Found"
          description="The workspace is currently in an empty state. You can initialize the label with official LYRICAL ENT production sample records, or manually onboard your first artist and release."
          actionLabel="Onboard First Artist"
          onAction={() => openQuickAction('artist')}
          secondaryActionLabel="Load Sample Records"
          onSecondaryAction={resetToSampleData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Feedback Banner */}
      {approvalFeedback && (
        <div className="flex items-center justify-between p-3.5 bg-[#002200] border border-green-700/60 text-green-300 rounded-md text-xs font-mono animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-400" />
            <span>{approvalFeedback}</span>
          </div>
          <button onClick={() => setApprovalFeedback(null)} className="text-green-500 hover:text-green-300">✕</button>
        </div>
      )}

      {/* Studio Banner with Personalized Identity */}
      <div 
        className="relative rounded-lg border border-[#222222] bg-[#0E0E0E] overflow-hidden"
        style={{ borderColor: `${brandAccent}40` }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <WorkspaceLogo 
                  workspaceId={activeWorkspace.id} 
                  workspaceName={activeWorkspace.name} 
                  brand={activeWorkspace.brand}
                  clientCategory={activeWorkspace.clientCategory}
                  height={32} 
                  theme="monochrome-white" 
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
                {activeWorkspace.name} · {isArtist ? 'ARTIST WORKSPACE' : isBrand ? 'BRAND WORKSPACE' : 'STUDIO OPERATIONS'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2.5 max-w-xl leading-relaxed">
                {activeWorkspace.brand?.tagline ? `${activeWorkspace.brand.tagline} — Dedicated client production portal.` : (isArtist 
                  ? 'Private music production workspace for master audio, release packages, promotional key visuals, and streaming delivery.' 
                  : isBrand 
                  ? 'Private brand client workspace for corporate design systems, marketing collateral, active creative requests, and vector handovers.' 
                  : 'Centralized production studio for catalog metadata, artist development, corporate contracts, creative rollout campaigns, and global music distribution.')}
              </p>
            </div>

            {/* Quick action bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-6 mt-4 border-t border-[#1C1C1C]">
              {isArtist ? (
                <>
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded transition-transform active:scale-95 shadow-md"
                    style={{ backgroundColor: brandAccent }}
                  >
                    <Send size={13} />
                    <span>Submit Creative Request</span>
                  </button>

                  <button
                    onClick={() => setActiveModule('releases')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white hover:bg-[#242424] border border-[#2B2B2B] rounded transition-colors"
                  >
                    <Disc3 size={13} />
                    <span>View Music Releases</span>
                  </button>

                  <button
                    onClick={() => setActiveModule('motion')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white hover:bg-[#242424] border border-[#2B2B2B] rounded transition-colors"
                  >
                    <Sparkles size={13} />
                    <span>Motion Deliverables</span>
                  </button>
                </>
              ) : isBrand ? (
                <>
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded transition-transform active:scale-95 shadow-md"
                    style={{ backgroundColor: brandAccent }}
                  >
                    <Send size={13} />
                    <span>Submit Design Request</span>
                  </button>

                  <button
                    onClick={() => setActiveModule('brand')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white hover:bg-[#242424] border border-[#2B2B2B] rounded transition-colors"
                  >
                    <Layers size={13} />
                    <span>Brand Guidelines & Assets</span>
                  </button>

                  <button
                    onClick={() => setActiveModule('documents')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white hover:bg-[#242424] border border-[#2B2B2B] rounded transition-colors"
                  >
                    <FileText size={13} />
                    <span>Corporate Documents</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openQuickAction('release')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>Schedule Release</span>
                  </button>

                  <button
                    onClick={() => openQuickAction('artist')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white hover:bg-[#242424] border border-[#2B2B2B] rounded transition-colors"
                  >
                    <Users size={13} />
                    <span>Add Artist</span>
                  </button>

                  <button
                    onClick={() => openQuickAction('document')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white hover:bg-[#242424] border border-[#2B2B2B] rounded transition-colors"
                  >
                    <FileText size={13} />
                    <span>Create Document</span>
                  </button>

                  <button
                    onClick={() => openQuickAction('campaign')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white hover:bg-[#242424] border border-[#2B2B2B] rounded transition-colors"
                  >
                    <Megaphone size={13} />
                    <span>Launch Campaign</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[220px] bg-[#141414] border-t lg:border-t-0 lg:border-l border-[#222222]">
            <img 
              src={isArtist 
                ? "/src/assets/images/vinyl_press_mockup_1792791744149.jpg" 
                : isBrand 
                ? "/src/assets/images/lyrical_ent_brand_stationery_1792793391733.jpg" 
                : "/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg"
              } 
              alt={activeWorkspace.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover grayscale contrast-125 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
              <span className="text-[11px] font-mono tracking-wider text-neutral-300">
                {isArtist ? 'MASTER RELEASES // VINYL PROOFS & DSP DELIVERY' : isBrand ? 'IDENTITY SUITE // DESIGN TOKENS & COLLATERAL' : 'LONDON // SOUND LAB A — STUDIO MONITORING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid: 6 Operational Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
            {isArtist ? 'ARTIST METRICS & RELEASE READINESS' : isBrand ? 'BRAND METRICS & PRODUCTION PIPELINE' : 'OPERATIONAL STATUS INDICATORS'}
          </h2>
          <span className="text-[11px] font-mono text-neutral-500">LIVE LOCAL SYNC</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1 */}
          <div 
            onClick={() => setActiveModule(isBrand ? 'brand' : 'artists')}
            className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              {isBrand ? <Layers size={16} className="text-neutral-500 group-hover:text-white transition-colors" /> : <Users size={16} className="text-neutral-500 group-hover:text-white transition-colors" />}
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {isBrand ? workspaceBrandAssets.length : totalArtists}
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-1">{isBrand ? 'Brand Assets' : 'Total Artists'}</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">{isBrand ? 'VECTOR & MOTION' : 'ROSTER RECORDS'}</div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => setActiveModule(isBrand ? 'brand' : 'releases')}
            className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <Disc3 size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {activeProjects}
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-1">Active Projects</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">IN PRODUCTION</div>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => setActiveModule(isBrand ? 'documents' : 'releases')}
            className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <Calendar size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {isBrand ? workspaceTasks.length : upcomingReleases}
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-1">{isBrand ? 'Active Requests' : 'Upcoming Releases'}</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">{isBrand ? 'CREATIVE QUEUE' : 'Q4 PIPELINE'}</div>
          </div>

          {/* Card 4 */}
          <div 
            onClick={() => setActiveModule(isBrand ? 'documents' : 'releases')}
            className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <Clock size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {pendingApprovals}
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-1">Pending Approvals</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">{isBrand ? 'SIGNOFF REQUIRED' : 'ART & METADATA'}</div>
          </div>

          {/* Card 5 */}
          <div 
            onClick={() => setActiveModule('documents')}
            className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <FileCheck2 size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {documentsAwaitingReview}
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-1">Docs In Review</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">LEGAL & INVOICES</div>
          </div>

          {/* Card 6 */}
          <div 
            onClick={() => setActiveModule(isBrand ? 'brand' : 'campaigns')}
            className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <Megaphone size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {isBrand ? workspaceDocuments.filter(d => d.status === 'Approved' || d.status === 'Issued').length : activeCampaigns}
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-1">{isBrand ? 'Approved Contracts' : 'Active Campaigns'}</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">{isBrand ? 'LEGAL CLEARANCE' : 'ROLLOUT SUITES'}</div>
          </div>
        </div>
      </div>

      {/* DELIVERABLE REVIEW & APPROVAL GATEWAY */}
      <div className="border border-[#222222] rounded-lg bg-[#0E0E0E] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A1A1A]">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} style={{ color: brandAccent }} />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                {isArtist ? 'Artist Deliverables Review & Sign-Off Gate' : isBrand ? 'Brand Deliverables & Approval Gateway' : 'Master Creative Review & Sign-Off Center'}
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {isArtist 
                ? 'Review promotional artwork proofs, verify metadata, and provide client sign-off before DSP distribution.' 
                : isBrand 
                ? 'Sign off on corporate identity packages, brand guideline revisions, and motion deliverable renders.' 
                : 'Direct client review pipeline for audio masters, cover artwork packages, and corporate agreements.'}
            </p>
          </div>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="text-xs font-mono px-3 py-1.5 rounded flex items-center gap-1.5 border border-[#333333] hover:border-white transition-colors text-neutral-200"
          >
            <Send size={12} />
            <span>Request Revision</span>
          </button>
        </div>

        {isArtist && (
          <div className="space-y-4">
            {workspaceReleases.map(rel => {
              const isApproved = rel.checklist.artworkApproved;
              return (
                <div 
                  key={rel.id} 
                  className="p-4 rounded-md border border-[#1E1E1E] bg-[#121212] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {rel.artworkUrl ? (
                      <img 
                        src={rel.artworkUrl} 
                        alt={rel.title} 
                        className="w-16 h-16 rounded object-cover border border-[#2B2B2B] shrink-0" 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-[#1C1C1C] flex items-center justify-center font-mono text-xs text-neutral-400 border border-[#2B2B2B] shrink-0">
                        ARTWORK
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{rel.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C1C] text-neutral-300 border border-[#2B2B2B]">
                          {rel.type}
                        </span>
                        {isApproved ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-950/80 text-green-400 border border-green-800 flex items-center gap-1">
                            <Check size={10} /> ARTWORK APPROVED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800 flex items-center gap-1">
                            <Clock size={10} /> AWAITING CLIENT SIGN-OFF
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        Artist: <span className="text-neutral-200">{rel.artistName}</span> · Planned Release: <span className="font-mono text-neutral-200">{rel.plannedReleaseDate}</span> · ISRC: <span className="font-mono text-neutral-400">{rel.isrc || 'In Registration'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-500 mt-2">
                        <span>Format: 3000x3000px TIFF/RGB</span>
                        <span>•</span>
                        <span>Audio: 24-bit 48kHz Master WAV</span>
                        <span>•</span>
                        <span>Split Sheet: {rel.checklist.splitSheetSigned ? '✓ Signed' : 'Pending'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isApproved ? (
                      <button
                        onClick={() => handleApproveArtwork(rel.id, rel.title)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded transition-colors shadow-sm"
                      >
                        <Check size={13} strokeWidth={2.5} />
                        <span>Approve Artwork Proof</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 bg-[#1C1C1C] border border-[#2A2A2A] rounded cursor-default"
                      >
                        <CheckCircle2 size={13} className="text-green-500" />
                        <span>Sign-Off Recorded</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsRequestModalOpen(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white hover:bg-[#242424] border border-[#2B2B2B] rounded transition-colors"
                    >
                      <span>Request Revision</span>
                    </button>

                    <button
                      onClick={() => triggerBlobDownload(
                        `${rel.title.toLowerCase().replace(/\s+/g, '_')}_master_specs.json`,
                        JSON.stringify(rel, null, 2),
                        'application/json'
                      )}
                      className="p-1.5 text-neutral-400 hover:text-white bg-[#1A1A1A] border border-[#2B2B2B] rounded hover:bg-[#242424] transition-colors"
                      title="Download Release Package Metadata"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isBrand && (
          <div className="space-y-3">
            {workspaceDocuments.slice(0, 3).map(doc => {
              const isApproved = doc.status === 'Approved' || doc.status === 'Issued';
              return (
                <div 
                  key={doc.id}
                  className="p-3.5 rounded-md border border-[#1E1E1E] bg-[#121212] flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{doc.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C1C] text-neutral-300 border border-[#2B2B2B]">
                        {doc.type}
                      </span>
                      {isApproved ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-950/80 text-green-400 border border-green-800 flex items-center gap-1">
                          <Check size={10} /> {doc.status.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800 flex items-center gap-1">
                          <Clock size={10} /> {doc.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 line-clamp-1">{doc.subject || doc.bodyContent}</div>
                    <div className="text-[10px] font-mono text-neutral-500 mt-1">
                      Recipient: {doc.recipientName}{doc.recipientOrg ? ` (${doc.recipientOrg})` : ''} · Author: {doc.authorName} · Last modified: {doc.updatedAt.slice(0, 10)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isApproved && (
                      <button
                        onClick={() => handleSignOffDocument(doc.id, doc.title)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                      >
                        <Check size={13} />
                        <span>Sign Off & Approve</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsRequestModalOpen(true)}
                      className="px-2.5 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white border border-[#2B2B2B] rounded"
                    >
                      Request Edit
                    </button>

                    <button
                      onClick={() => triggerBlobDownload(
                        `${doc.title.toLowerCase().replace(/\s+/g, '_')}.txt`,
                        `KEEDOHUB CORPORATE DOCUMENT ARCHIVE\n==================================\nTitle: ${doc.title}\nType: ${doc.type}\nStatus: ${doc.status}\nWorkspace: ${activeWorkspace.name}\n\nSubject: ${doc.subject || 'N/A'}\nRecipient: ${doc.recipientName}\n\nContent:\n${doc.bodyContent}\n`,
                        'text/plain'
                      )}
                      className="p-1.5 text-neutral-400 hover:text-white bg-[#1A1A1A] border border-[#2B2B2B] rounded hover:bg-[#242424]"
                      title="Download Document"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {workspaceTasks.filter(t => t.status === 'In Review').map(tsk => (
              <div 
                key={tsk.id}
                className="p-3.5 rounded-md border border-[#292215] bg-[#14120E] flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-200">{tsk.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800">
                      DELIVERABLE READY FOR REVIEW
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">Due: {tsk.dueDate} · Priority: {tsk.priority} · Assignee: {tsk.assignee}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSignOffTask(tsk.id, tsk.title)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded flex items-center gap-1.5"
                  >
                    <Check size={13} />
                    <span>Approve Deliverable</span>
                  </button>
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="px-2.5 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white border border-[#2B2B2B] rounded"
                  >
                    Request Revision
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PUBLISHED PRODUCTION DELIVERABLES FROM OPERATOR STUDIO */}
        {clientPublishedDeliverables.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-[#1C1C1C]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Official Studio Deliverable Packages ({clientPublishedDeliverables.length})
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">CLIENT VERIFICATION GATE</span>
            </div>

            <div className="space-y-3">
              {clientPublishedDeliverables.map(({ project, version }) => {
                const reviewStatus = version.clientReviewStatus || 'Pending';
                const isApproved = reviewStatus === 'Approved';
                const isRevisionRequested = reviewStatus === 'Revision Requested';
                return (
                  <div
                    key={`${project.id}-${version.id}`}
                    className="p-4 rounded-md border border-[#222222] bg-[#121212] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {version.previewUrl ? (
                        <div className="w-16 h-16 rounded overflow-hidden bg-black border border-[#222222] shrink-0">
                          <img
                            src={version.previewUrl}
                            alt={version.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded bg-neutral-900 border border-[#222222] flex items-center justify-center shrink-0 text-neutral-500">
                          <Layers size={22} />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white">{version.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C1C] text-neutral-300 border border-[#2D2D2D]">
                            {version.versionNumber}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#151515] text-neutral-400 border border-[#242424]">
                            {project.title}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              isApproved
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                                : isRevisionRequested
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                : 'bg-purple-950/80 text-purple-300 border border-purple-700/60'
                            }`}
                          >
                            {reviewStatus.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-400">
                          {version.clientFeedback || `${project.projectType} — Master Deliverable Package`}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-neutral-500 pt-1">
                          <span>Specs: <span className="text-neutral-300">{version.fileType}{version.fileSize ? ` · ${version.fileSize}` : ''}</span></span>
                          {version.publishedAt && (
                            <span>Published: <span className="text-neutral-400">{new Date(version.publishedAt).toLocaleDateString()}</span></span>
                          )}
                          {version.fileUrl && (
                            <a
                              href={version.fileUrl}
                              download
                              className="text-neutral-300 hover:text-white underline inline-flex items-center gap-1"
                            >
                              <Download size={11} />
                              <span>Source File</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isApproved ? (
                        <>
                          <button
                            onClick={() => handleApproveProductionDeliverable(project.id, version.id, version.title)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 rounded transition-colors shadow-sm"
                          >
                            <Check size={13} strokeWidth={2.5} />
                            <span>Sign & Approve Deliverable</span>
                          </button>
                          <button
                            onClick={() => setIsRequestModalOpen(true)}
                            className="px-2.5 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-300 hover:text-white border border-[#2B2B2B] rounded transition-colors"
                          >
                            Request Revision
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 px-3 py-1.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                          <CheckCircle2 size={13} />
                          <span>Approved & Locked for Final Delivery</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isArtist && !isBrand && (
          <div className="p-4 rounded-md border border-[#2B2B2B] bg-[#141414] space-y-3 mt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Studio Master Operations & Private Production Center
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Operator-only pipeline across all client accounts. Manage intake, briefs, QA checklists, versioning, and client review publishing.
                </p>
              </div>
              <button
                onClick={() => setActiveModule('production')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-bold bg-[#FF1E1E] hover:bg-[#e01b1b] text-white rounded transition-colors shadow-sm"
              >
                <Briefcase size={13} />
                <span>Open Production Center</span>
                <ChevronRight size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#222222] text-[11px] font-mono">
              <div className="bg-[#0B0B0B] p-2 rounded border border-[#1A1A1A]">
                <span className="text-neutral-500 block">Total Pipeline:</span>
                <span className="text-white font-bold">{productionProjects.length} Projects</span>
              </div>
              <div className="bg-[#0B0B0B] p-2 rounded border border-[#1A1A1A]">
                <span className="text-neutral-500 block">In Production:</span>
                <span className="text-amber-400 font-bold">
                  {productionProjects.filter(p => p.stage === 'In Production').length} Active
                </span>
              </div>
              <div className="bg-[#0B0B0B] p-2 rounded border border-[#1A1A1A]">
                <span className="text-neutral-500 block">Client Review:</span>
                <span className="text-purple-400 font-bold">
                  {productionProjects.filter(p => p.stage === 'Client Review').length} Awaiting
                </span>
              </div>
              <div className="bg-[#0B0B0B] p-2 rounded border border-[#1A1A1A]">
                <span className="text-neutral-500 block">Ready to Deliver:</span>
                <span className="text-emerald-400 font-bold">
                  {productionProjects.filter(p => p.stage === 'Ready for Delivery').length} Finalized
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AVAILABLE DOWNLOADS VAULT */}
      <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <Download size={14} style={{ color: brandAccent }} />
              <span>Available Final Deliverables & Downloads Vault</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Production-ready vector assets, master audio specs, and corporate branding files
            </p>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">SECURE VAULT</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Item 1: Vector Logo Mark */}
          <div className="p-3.5 rounded-md bg-[#121212] border border-[#1E1E1E] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[10px] font-mono text-neutral-500">VECTOR GRAPHIC</span>
                <span className="text-[10px] font-mono text-emerald-400">READY</span>
              </div>
              <div className="text-xs font-bold text-white">{activeWorkspace.name} Master Monogram</div>
              <p className="text-[11px] text-neutral-400 mt-1">Vector SVG mark with primary accent tokens.</p>
            </div>
            <button
              onClick={() => triggerSvgDownload('monogram', 'white-on-black', `${activeWorkspace.name.toLowerCase().replace(/\s+/g, '_')}_monogram.svg`)}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium bg-[#1C1C1C] hover:bg-[#252525] text-white border border-[#2B2B2B] rounded transition-colors"
            >
              <Download size={12} />
              <span>Download Vector SVG</span>
            </button>
          </div>

          {/* Item 2: Audio Specs or Brand Tokens */}
          <div className="p-3.5 rounded-md bg-[#121212] border border-[#1E1E1E] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[10px] font-mono text-neutral-500">SPECIFICATION</span>
                <span className="text-[10px] font-mono text-emerald-400">CURRENT</span>
              </div>
              <div className="text-xs font-bold text-white">
                {isArtist ? 'DSP Master Audio Spec Sheet' : 'Brand Token System (JSON)'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                {isArtist ? 'Apple Digital Masters & Spotify 24-bit guidelines.' : 'Hex codes, font families, and container constraints.'}
              </p>
            </div>
            <button
              onClick={() => {
                const content = isArtist ? (
                  `DSP AUDIO & ARTWORK SPECIFICATION\n=================================\nClient: ${activeWorkspace.name}\nResolution: 3000 x 3000 px minimum\nColor Space: RGB (sRGB profile)\nSample Rate: 24-bit / 48 kHz uncompressed WAV\nISRC Standard: US-XX-YY-NNNNN\nDelivered via: KeedoHub Private Client Portal`
                ) : (
                  JSON.stringify({
                    brandName: activeWorkspace.name,
                    category: activeWorkspace.clientCategory,
                    accentColor: brandAccent,
                    tagline: activeWorkspace.brand?.tagline,
                    typography: { primary: 'JetBrains Mono', headings: 'Syne / Inter' }
                  }, null, 2)
                );
                triggerBlobDownload(`${activeWorkspace.name.toLowerCase().replace(/\s+/g, '_')}_tokens.txt`, content);
              }}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium bg-[#1C1C1C] hover:bg-[#252525] text-white border border-[#2B2B2B] rounded transition-colors"
            >
              <Download size={12} />
              <span>Download Specs</span>
            </button>
          </div>

          {/* Item 3: Releases Sheet or Agreement */}
          <div className="p-3.5 rounded-md bg-[#121212] border border-[#1E1E1E] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[10px] font-mono text-neutral-500">OFFICIAL MANIFEST</span>
                <span className="text-[10px] font-mono text-emerald-400">VERIFIED</span>
              </div>
              <div className="text-xs font-bold text-white">
                {isArtist ? 'Release Catalog Manifest' : 'Client Retainer Terms'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                {isArtist ? 'Full metadata, tracklist, and licensing summary.' : 'Commercial usage rights and scope of work.'}
              </p>
            </div>
            <button
              onClick={() => {
                const manifest = isArtist ? workspaceReleases : workspaceDocuments;
                triggerBlobDownload(
                  `${activeWorkspace.name.toLowerCase().replace(/\s+/g, '_')}_manifest.json`,
                  JSON.stringify(manifest, null, 2),
                  'application/json'
                );
              }}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium bg-[#1C1C1C] hover:bg-[#252525] text-white border border-[#2B2B2B] rounded transition-colors"
            >
              <Download size={12} />
              <span>Export Manifest</span>
            </button>
          </div>

          {/* Item 4: Motion Package or Guidelines */}
          <div className="p-3.5 rounded-md bg-[#121212] border border-[#1E1E1E] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-[10px] font-mono text-neutral-500">MOTION SUITE</span>
                <span className="text-[10px] font-mono text-emerald-400">AVAILABLE</span>
              </div>
              <div className="text-xs font-bold text-white">
                {isArtist ? 'Social Motion Renders' : 'Brand Identity Package'}
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                {isArtist ? '9:16 Canvas loops and Spotify teaser formats.' : 'Vector marks, stationary layouts, and typography.'}
              </p>
            </div>
            <button
              onClick={() => setActiveModule(isArtist ? 'motion' : 'brand')}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium bg-[#1C1C1C] hover:bg-[#252525] text-white border border-[#2B2B2B] rounded transition-colors"
            >
              <ExternalLink size={12} />
              <span>Open In Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Release Pipeline & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Release Readiness Snapshot (for Artist / Studio) or Brand Assets Suite (for Brands) */}
          {isBrand ? (
            <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">Corporate Brand Collateral & Assets</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Vector identity marks, marketing decks, and design guidelines</p>
                </div>
                <button
                  onClick={() => setActiveModule('brand')}
                  className="text-xs text-neutral-400 hover:text-white font-mono flex items-center gap-1 transition-colors"
                >
                  <span>Brand System</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {workspaceBrandAssets.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center font-mono">No brand collateral uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workspaceBrandAssets.map(asset => (
                    <div key={asset.id} className="p-3 bg-[#121212] border border-[#1E1E1E] rounded hover:border-[#333333] transition-colors">
                      <div className="flex items-center justify-between text-xs font-medium text-white mb-1">
                        <span>{asset.name}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{asset.fileType.toUpperCase()} · {asset.version}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">Category: {asset.category}</div>
                      <div className="mt-2 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                        <span>Uploaded: {asset.uploadedAt.slice(0, 10)}</span>
                        <button 
                          onClick={() => triggerSvgDownload('primary', 'white-on-black', `${asset.name.toLowerCase().replace(/\s+/g, '_')}.svg`)} 
                          className="text-neutral-300 hover:text-white flex items-center gap-1"
                        >
                          <Download size={11} /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">Active Music Release Pipeline</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Master audio, split agreements, and DSP distribution readiness</p>
                </div>
                <button
                  onClick={() => setActiveModule('releases')}
                  className="text-xs text-neutral-400 hover:text-white font-mono flex items-center gap-1 transition-colors"
                >
                  <span>Full Catalog</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {workspaceReleases.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center font-mono">No releases currently scheduled for this workspace.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1C1C1C] text-neutral-400 font-mono text-[11px]">
                        <th className="pb-2.5 font-normal">PROJECT</th>
                        <th className="pb-2.5 font-normal">ARTIST</th>
                        <th className="pb-2.5 font-normal">TARGET DATE</th>
                        <th className="pb-2.5 font-normal">STATUS</th>
                        <th className="pb-2.5 font-normal">READINESS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#161616]">
                      {workspaceReleases.map(release => {
                        // Calculate checklist readiness percentage
                        const checks = Object.values(release.checklist);
                        const completedChecks = checks.filter(Boolean).length;
                        const percent = Math.round((completedChecks / checks.length) * 100);

                        return (
                          <tr key={release.id} className="hover:bg-[#141414] transition-colors">
                            <td className="py-3 pr-3">
                              <div className="font-medium text-white truncate max-w-[180px]">{release.title}</div>
                              <div className="text-[11px] text-neutral-500 font-mono">{release.type} · ISRC: {release.isrc || 'Pending'}</div>
                            </td>
                            <td className="py-3 pr-3 text-neutral-300 truncate max-w-[140px]">
                              {release.artistName}
                            </td>
                            <td className="py-3 pr-3 text-neutral-400 font-mono tabular-nums whitespace-nowrap">
                              {release.plannedReleaseDate}
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap">
                              <span className="text-[11px] font-mono text-neutral-300">
                                {release.distributionStatus}
                              </span>
                            </td>
                            <td className="py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-[#202020] h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-white h-full transition-all" 
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-neutral-400 tabular-nums">{percent}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Quick Roster Showcase (Only for Artist or Label mode, NOT brand) */}
          {!isBrand && (
            <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">Active Artist Roster</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Development pipeline and primary recording talent</p>
                </div>
                <button
                  onClick={() => setActiveModule('artists')}
                  className="text-xs text-neutral-400 hover:text-white font-mono flex items-center gap-1 transition-colors"
                >
                  <span>Manage Roster</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {workspaceArtists.slice(0, 3).map(artist => (
                  <div 
                    key={artist.id}
                    onClick={() => setActiveModule('artists')}
                    className="p-3.5 bg-[#121212] border border-[#1E1E1E] rounded-md hover:border-[#333333] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      {artist.avatarUrl ? (
                        <img 
                          src={artist.avatarUrl} 
                          alt={artist.name} 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded object-cover grayscale border border-[#2B2B2B]" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-[#1C1C1C] flex items-center justify-center font-mono font-bold text-xs text-white border border-[#2B2B2B]">
                          {artist.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white truncate">{artist.name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono truncate">{artist.moniker || artist.genre}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {artist.bio}
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span>{artist.status.toUpperCase()}</span>
                      <span>{artist.releaseIds.length} Releases</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Creative Requests (for Brands) */}
          {isBrand && (
            <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">Active Design & Motion Requests</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Live work tickets assigned to KeedoHub studio artists</p>
                </div>
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Plus size={13} />
                  <span>New Request</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {workspaceTasks.map(task => (
                  <div key={task.id} className="p-3 rounded bg-[#121212] border border-[#1E1E1E] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>{task.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1C1C1C] text-neutral-400 border border-[#262626]">
                          {task.category}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 mt-1">
                        Due: {task.dueDate} · Priority: {task.priority} · {task.assignee}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181818] text-neutral-300 border border-[#2B2B2B]">
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Deadlines & Live Activity Audit (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Project Deadlines */}
          <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <Calendar size={14} className="text-neutral-400" />
                <span>Project Deadlines</span>
              </h3>
              <span className="text-[10px] font-mono text-neutral-400">NEXT 30 DAYS</span>
            </div>

            {projectDeadlines.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center font-mono">No active deadlines recorded.</p>
            ) : (
              <div className="space-y-3">
                {projectDeadlines.map((dl, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveModule(dl.targetModule)}
                    className="p-2.5 rounded bg-[#121212] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-1">
                      <span>{dl.category.toUpperCase()}</span>
                      <span className="tabular-nums text-white font-medium">{dl.date}</span>
                    </div>
                    <div className="text-xs font-medium text-neutral-200 line-clamp-1">
                      {dl.title}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-1">
                      Status: {dl.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Studio Activity */}
          <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white tracking-tight">Recent Studio Activity</h3>
              <span className="text-[10px] font-mono text-neutral-400">AUDIT TRAIL</span>
            </div>

            {activities.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center font-mono">No activity logged yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map(act => (
                  <div key={act.id} className="text-xs border-b border-[#171717] pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-0.5">
                      <span className="text-neutral-300 font-medium">{act.action}</span>
                      <span className="tabular-nums">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-snug">
                      {act.details}
                    </p>
                    <div className="text-[10px] text-neutral-400 font-mono mt-1">
                      {act.actor} · {act.role}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mount Client Request Modal */}
      <ClientRequestModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
      />
    </div>
  );
};
