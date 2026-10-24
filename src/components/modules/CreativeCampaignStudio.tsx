import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreativeCampaign, CampaignDeliverable } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { LaunchCreativeStudio } from './LaunchCreativeStudio';
import { 
  Megaphone, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Check, 
  Image as ImageIcon,
  Film,
  Smartphone,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const DELIVERABLE_PRESETS = [
  { name: 'Cover Artwork (3000x3000px Master)', format: '1:1 Square' as const },
  { name: 'Announcement Poster (A2 / Print)', format: 'Print / Poster' as const },
  { name: '7-Day Countdown Stories Series', format: '9:16 Vertical Story' as const },
  { name: 'Out-Now Motion Graphic & Spotify Canvas', format: '9:16 Vertical Story' as const },
  { name: 'YouTube Premiere Thumbnail & 4K Title Card', format: '16:9 Landscape' as const },
  { name: 'Lyric Quote Typography Cards', format: '1:1 Square' as const },
  { name: 'Social Feed Showcase Banners', format: '1:1 Square' as const },
  { name: 'Audio Visualizer 16:9 Loop', format: '16:9 Landscape' as const }
];

export const CreativeCampaignStudio: React.FC = () => {
  const { campaigns, releases, artists, addCampaign, updateCampaign, deleteCampaign, activeWorkspace } = useApp();
  
  const workspaceCampaigns = campaigns.filter(c => c.workspaceId === activeWorkspace.id);
  const workspaceReleases = releases.filter(r => r.workspaceId === activeWorkspace.id);
  const workspaceArtists = artists.filter(a => a.workspaceId === activeWorkspace.id);

  const [activeStudioView, setActiveStudioView] = useState<'briefs' | 'templates'>('briefs');
  const [selectedCampId, setSelectedCampId] = useState<string | null>(workspaceCampaigns[0]?.id || null);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [isAddDeliverableModalOpen, setIsAddDeliverableModalOpen] = useState(false);

  // Form states for Campaign
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState(workspaceArtists[0]?.id || '');
  const [releaseId, setReleaseId] = useState('');
  const [type, setType] = useState<CreativeCampaign['type']>('Single Launch');
  const [budget, setBudget] = useState(7500);
  const [launchDate, setLaunchDate] = useState(new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Form states for Deliverable
  const [delName, setDelName] = useState('');
  const [delFormat, setDelFormat] = useState<CampaignDeliverable['format']>('1:1 Square');
  const [delDueDate, setDelDueDate] = useState('');
  const [delAssignee, setDelAssignee] = useState('Studio Art Director');

  const selectedCampaign = workspaceCampaigns.find(c => c.id === selectedCampId) || workspaceCampaigns[0];

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artistId || !launchDate) return;

    const artistObj = workspaceArtists.find(a => a.id === artistId);
    const relObj = workspaceReleases.find(r => r.id === releaseId);

    const initialDeliverables: CampaignDeliverable[] = DELIVERABLE_PRESETS.slice(0, 4).map((p, idx) => ({
      id: `del-${Date.now()}-${idx}`,
      name: p.name,
      format: p.format,
      status: 'Pending',
      dueDate: launchDate,
      assignedTo: 'Creative Team'
    }));

    const created = addCampaign({
      title,
      artistId,
      artistName: artistObj ? artistObj.name : 'Unknown Artist',
      releaseId: releaseId || undefined,
      releaseTitle: relObj ? relObj.title : undefined,
      type,
      budget: Number(budget) || 5000,
      status: 'In Production',
      launchDate,
      notes: notes || `${activeWorkspace.name} campaign rollout suite initiated.`,
      deliverables: initialDeliverables
    });

    setSelectedCampId(created.id);
    setIsNewCampaignModalOpen(false);
    resetForm();
  };

  const handleAddDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !delName) return;

    const newDeliverable: CampaignDeliverable = {
      id: `del-${Date.now()}`,
      name: delName,
      format: delFormat,
      status: 'Pending',
      dueDate: delDueDate || selectedCampaign.launchDate,
      assignedTo: delAssignee
    };

    updateCampaign(selectedCampaign.id, {
      deliverables: [...selectedCampaign.deliverables, newDeliverable]
    });

    setDelName('');
    setIsAddDeliverableModalOpen(false);
  };

  const handleUpdateDeliverableStatus = (campaignId: string, delId: string, status: CampaignDeliverable['status']) => {
    const camp = workspaceCampaigns.find(c => c.id === campaignId);
    if (!camp) return;

    const updated = camp.deliverables.map(d => d.id === delId ? { ...d, status } : d);
    updateCampaign(campaignId, { deliverables: updated });
  };

  const handleDeleteDeliverable = (campaignId: string, delId: string) => {
    const camp = workspaceCampaigns.find(c => c.id === campaignId);
    if (!camp) return;

    const updated = camp.deliverables.filter(d => d.id !== delId);
    updateCampaign(campaignId, { deliverables: updated });
  };

  const resetForm = () => {
    setTitle('');
    setArtistId(workspaceArtists[0]?.id || '');
    setReleaseId('');
    setType('Single Launch');
    setBudget(7500);
    setNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            CREATIVE CAMPAIGN STUDIO
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Art direction, social teasers, YouTube countdowns, vertical video suites, and deliverable approvals
          </p>
        </div>

        {activeStudioView === 'briefs' && (
          <button
            onClick={() => {
              resetForm();
              setIsNewCampaignModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>New Campaign Brief</span>
          </button>
        )}
      </div>

      {/* Sub-Section View Switcher */}
      <div className="flex items-center gap-1 border-b border-[#1C1C1C] pb-3 no-print">
        <button
          onClick={() => setActiveStudioView('briefs')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors ${
            activeStudioView === 'briefs'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Layers size={13} />
          <span>Active Campaign Briefs ({workspaceCampaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveStudioView('templates')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded transition-colors ${
            activeStudioView === 'templates'
              ? 'bg-white text-black font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Sparkles size={13} />
          <span>Launch Creative Templates (7 Formats &amp; PNG/JPEG Export)</span>
        </button>
      </div>

      {activeStudioView === 'templates' ? (
        <LaunchCreativeStudio />
      ) : (
        <>
          {workspaceCampaigns.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No Creative Campaigns Active"
              description={`Plan your next music single launch, video premiere, or album rollout brief for ${activeWorkspace.name}.`}
              actionLabel="Create Campaign Brief"
              onAction={() => setIsNewCampaignModalOpen(true)}
            />
          ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Campaign List (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider px-1">
              ACTIVE CAMPAIGN BRIEFS ({workspaceCampaigns.length})
            </div>

            <div className="space-y-2">
              {workspaceCampaigns.map(camp => {
                const isSelected = camp.id === selectedCampaign?.id;
                const approvedCount = camp.deliverables.filter(d => d.status === 'Approved').length;

                return (
                  <div
                    key={camp.id}
                    onClick={() => setSelectedCampId(camp.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#181818] border-neutral-400 text-white' 
                        : 'bg-[#0E0E0E] border-[#1E1E1E] text-neutral-300 hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                      <span className="uppercase">{camp.type}</span>
                      <span className="tabular-nums">{camp.launchDate}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-white truncate">{camp.title}</h4>
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">{camp.artistName}</div>

                    <div className="mt-3 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-neutral-400">{camp.status}</span>
                      <span className="text-neutral-300 tabular-nums">
                        {approvedCount}/{camp.deliverables.length} Approved
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Campaign Studio & Deliverables Board (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedCampaign && (
              <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-6">
                {/* Header banner */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#1C1C1C] pb-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
                      <span>{selectedCampaign.type.toUpperCase()}</span>
                      <span>·</span>
                      <span>TARGET LAUNCH: {selectedCampaign.launchDate}</span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">
                      {selectedCampaign.title}
                    </h2>

                    <div className="text-xs font-mono text-neutral-300 mt-1">
                      Artist: <span className="text-white font-semibold">{selectedCampaign.artistName}</span>
                      {selectedCampaign.releaseTitle && (
                        <span className="text-neutral-400"> · Release: {selectedCampaign.releaseTitle}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAddDeliverableModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white border border-[#2B2B2B] rounded transition-colors"
                    >
                      <Plus size={13} strokeWidth={2} />
                      <span>Add Deliverable</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove campaign "${selectedCampaign.title}"?`)) {
                          deleteCampaign(selectedCampaign.id);
                        }
                      }}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-[#1A1A1A] rounded transition-colors"
                      title="Delete campaign"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Campaign KPI overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-[#121212] border border-[#1E1E1E] rounded">
                    <span className="text-[10px] text-neutral-500 block">CAMPAIGN BUDGET</span>
                    <span className="text-lg font-bold text-white tabular-nums">${selectedCampaign.budget.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-[#121212] border border-[#1E1E1E] rounded">
                    <span className="text-[10px] text-neutral-500 block">TOTAL DELIVERABLES</span>
                    <span className="text-lg font-bold text-white tabular-nums">{selectedCampaign.deliverables.length} Assets</span>
                  </div>
                  <div className="p-3 bg-[#121212] border border-[#1E1E1E] rounded">
                    <span className="text-[10px] text-neutral-500 block">PRODUCTION STATUS</span>
                    <span className="text-lg font-bold text-white">{selectedCampaign.status}</span>
                  </div>
                </div>

                {/* Strategy Notes */}
                {selectedCampaign.notes && (
                  <div className="p-3.5 bg-[#121212] border border-[#1E1E1E] rounded text-xs">
                    <span className="text-[10px] font-mono text-neutral-500 block mb-1 uppercase">CREATIVE STRATEGY</span>
                    <p className="text-neutral-300 leading-relaxed">{selectedCampaign.notes}</p>
                  </div>
                )}

                {/* Deliverables Pipeline Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono text-white uppercase tracking-wider">
                      PRODUCTION DELIVERABLES & APPROVAL STAGES
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-400">CYCLE WORKFLOW</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1C1C1C] text-neutral-400 font-mono text-[11px]">
                          <th className="pb-2.5 font-normal">ASSET NAME</th>
                          <th className="pb-2.5 font-normal">FORMAT</th>
                          <th className="pb-2.5 font-normal">DUE DATE</th>
                          <th className="pb-2.5 font-normal">ASSIGNEE</th>
                          <th className="pb-2.5 font-normal">STATUS</th>
                          <th className="pb-2.5 font-normal text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#161616]">
                        {selectedCampaign.deliverables.map(del => (
                          <tr key={del.id} className="hover:bg-[#141414] transition-colors">
                            <td className="py-3 pr-3 font-medium text-white truncate max-w-[200px]">
                              {del.name}
                            </td>
                            <td className="py-3 pr-3 text-neutral-400 font-mono text-[11px]">
                              {del.format}
                            </td>
                            <td className="py-3 pr-3 text-neutral-400 font-mono tabular-nums">
                              {del.dueDate}
                            </td>
                            <td className="py-3 pr-3 text-neutral-300 truncate max-w-[120px]">
                              {del.assignedTo || 'Creative Lead'}
                            </td>
                            <td className="py-3 pr-3">
                              <select
                                value={del.status}
                                onChange={e => handleUpdateDeliverableStatus(selectedCampaign.id, del.id, e.target.value as any)}
                                className={`text-[11px] font-mono rounded px-2 py-1 border bg-[#141414] focus:outline-none cursor-pointer ${
                                  del.status === 'Approved' 
                                    ? 'border-white text-white' 
                                    : del.status === 'In Review' 
                                    ? 'border-neutral-500 text-neutral-200' 
                                    : 'border-[#262626] text-neutral-400'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="In Review">In Review</option>
                                <option value="Approved">Approved</option>
                              </select>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteDeliverable(selectedCampaign.id, del.id)}
                                className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                                title="Remove deliverable"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}

      {/* New Campaign Modal */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#0E0E0E] border border-[#242424] rounded-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">Create Campaign Brief</h3>
            <p className="text-xs text-neutral-400 mb-5">Define creative rollout strategy, deliverables, and marketing budget</p>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">CAMPAIGN TITLE *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Quiet Foundations EP Worldwide Premiere"
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">PRIMARY ARTIST *</label>
                  <select
                    required
                    value={artistId}
                    onChange={e => setArtistId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                  >
                    {workspaceArtists.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">LINKED MUSIC RELEASE</label>
                  <select
                    value={releaseId}
                    onChange={e => setReleaseId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                  >
                    <option value="">Independent Campaign (None)</option>
                    {workspaceReleases.map(r => (
                      <option key={r.id} value={r.id}>{r.title} ({r.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">CAMPAIGN TYPE *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                  >
                    <option value="Single Launch">Single Launch</option>
                    <option value="EP Rollout">EP Rollout</option>
                    <option value="Album Campaign">Album Campaign</option>
                    <option value="Tour Announcement">Tour Announcement</option>
                    <option value="Signing Reveal">Signing Reveal</option>
                    <option value="Brand Partnership">Brand Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">BUDGET (USD)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">TARGET LAUNCH DATE *</label>
                <input
                  type="date"
                  required
                  value={launchDate}
                  onChange={e => setLaunchDate(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">CREATIVE STRATEGY NOTES</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Outline aesthetic themes, photo shoots, trailer concepts..."
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="pt-4 border-t border-[#1C1C1C] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                >
                  Save Campaign Brief
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deliverable Modal */}
      {isAddDeliverableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E0E0E] border border-[#242424] rounded-lg p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-white tracking-tight mb-1">Add Deliverable</h3>
            <p className="text-xs text-neutral-400 mb-5">Attach creative production asset to {selectedCampaign?.title}</p>

            <form onSubmit={handleAddDeliverable} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">ASSET DELIVERABLE NAME *</label>
                <input
                  type="text"
                  required
                  value={delName}
                  onChange={e => setDelName(e.target.value)}
                  placeholder="e.g. 15-Second Motion Teaser for TikTok/Reels"
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">ASSET FORMAT *</label>
                <select
                  value={delFormat}
                  onChange={e => setDelFormat(e.target.value as any)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400 cursor-pointer"
                >
                  <option value="1:1 Square">1:1 Square (Feed & Artwork)</option>
                  <option value="9:16 Vertical Story">9:16 Vertical Story (Reels, TikTok, Shorts)</option>
                  <option value="16:9 Landscape">16:9 Landscape (YouTube & Visualizer)</option>
                  <option value="Print / Poster">Print / Poster (Physical Marketing)</option>
                  <option value="Audio Visualizer">Audio Visualizer (Motion Loop)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">DUE DATE</label>
                  <input
                    type="date"
                    value={delDueDate}
                    onChange={e => setDelDueDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">ASSIGNEE</label>
                  <input
                    type="text"
                    value={delAssignee}
                    onChange={e => setDelAssignee(e.target.value)}
                    className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#1C1C1C] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDeliverableModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
                >
                  Add Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
