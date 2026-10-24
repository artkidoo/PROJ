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
  ChevronRight
} from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const { 
    artists, 
    releases, 
    campaigns, 
    documents, 
    tasks, 
    activities, 
    openQuickAction, 
    setActiveModule,
    resetToSampleData,
    activeWorkspace
  } = useApp();

  // Filter data by active workspace
  const workspaceArtists = artists.filter(a => a.workspaceId === activeWorkspace.id);
  const workspaceReleases = releases.filter(r => r.workspaceId === activeWorkspace.id);
  const workspaceCampaigns = campaigns.filter(c => c.workspaceId === activeWorkspace.id);
  const workspaceDocuments = documents.filter(d => d.workspaceId === activeWorkspace.id);
  const workspaceTasks = tasks.filter(t => t.workspaceId === activeWorkspace.id);

  // Calculate live operational metrics
  const totalArtists = workspaceArtists.length;
  const activeProjects = workspaceReleases.filter(r => r.distributionStatus !== 'Live').length;
  const upcomingReleases = workspaceReleases.filter(r => {
    if (r.distributionStatus === 'Live') return false;
    const releaseDate = new Date(r.plannedReleaseDate);
    const now = new Date();
    return releaseDate >= now;
  }).length;
  
  const pendingApprovals = workspaceReleases.filter(r => !r.checklist.artworkApproved || !r.checklist.splitSheetSigned || r.distributionStatus === 'Metadata Verification').length;
  const documentsAwaitingReview = workspaceDocuments.filter(d => d.status === 'Under Review' || d.status === 'Draft').length;
  const activeCampaigns = workspaceCampaigns.filter(c => c.status === 'Active' || c.status === 'In Production' || c.status === 'In Review').length;

  const hasData = totalArtists > 0 || workspaceReleases.length > 0 || workspaceDocuments.length > 0;

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
      targetModule: 'operations' as const
    }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6);

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
      {/* Studio Banner with Genuine Visual Anchor */}
      <div className="relative rounded-lg border border-[#222222] bg-[#0E0E0E] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-3">
                <WorkspaceLogo 
                  workspaceId={activeWorkspace.id} 
                  workspaceName={activeWorkspace.name} 
                  height={32} 
                  theme="monochrome-white" 
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
                {activeWorkspace.name} · STUDIO OPERATIONS
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2.5 max-w-xl leading-relaxed">
                Centralized production studio for catalog metadata, artist development, corporate contracts, creative rollout campaigns, and global music distribution.
              </p>
            </div>

            {/* Quick action bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-6 mt-4 border-t border-[#1C1C1C]">
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
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[220px] bg-[#141414] border-t lg:border-t-0 lg:border-l border-[#222222]">
            <img 
              src="/src/assets/images/lyrical_ent_studio_hero_1792791743831.jpg" 
              alt="LYRICAL ENT Production Control Room"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover grayscale contrast-125 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
              <span className="text-[11px] font-mono tracking-wider text-neutral-300">
                LONDON // SOUND LAB A — STUDIO MONITORING
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid: 6 Operational Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
            OPERATIONAL STATUS INDICATORS
          </h2>
          <span className="text-[11px] font-mono text-neutral-500">LIVE LOCAL SYNC</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Artists */}
          <div 
            onClick={() => setActiveModule('artists')}
            className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <Users size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {totalArtists}
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-1">Total Artists</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">ROSTER RECORDS</div>
          </div>

          {/* Card 2: Active Projects */}
          <div 
            onClick={() => setActiveModule('releases')}
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

          {/* Card 3: Upcoming Releases */}
          <div 
            onClick={() => setActiveModule('releases')}
            className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <Calendar size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {upcomingReleases}
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-1">Upcoming Releases</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">Q4 PIPELINE</div>
          </div>

          {/* Card 4: Pending Creative Approvals */}
          <div 
            onClick={() => setActiveModule('releases')}
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
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">ART & METADATA</div>
          </div>

          {/* Card 5: Documents Awaiting Review */}
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
            <div className="text-xs text-neutral-400 font-medium mt-1">Docs Awaiting Review</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">LEGAL & INVOICES</div>
          </div>

          {/* Card 6: Campaigns in Progress */}
          <div 
            onClick={() => setActiveModule('campaigns')}
            className="p-4 rounded-lg bg-[#0E0E0E] border border-[#1E1E1E] hover:border-[#333333] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <Megaphone size={16} className="text-neutral-500 group-hover:text-white transition-colors" />
              <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {activeCampaigns}
            </div>
            <div className="text-xs text-neutral-400 font-medium mt-1">Active Campaigns</div>
            <div className="text-[10px] text-neutral-500 mt-2 font-mono">ROLLOUT SUITES</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Release Pipeline & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Release Pipeline (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Release Readiness Snapshot */}
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

          {/* Quick Roster Showcase */}
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
    </div>
  );
};
