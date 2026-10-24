/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT — Music Promotion & Campaign Studio
 * Integrated Release Project Workflow & Coordinated Design Generation
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Disc3, 
  Plus, 
  FolderArchive, 
  Download, 
  Edit3, 
  Trash2, 
  ChevronRight,
  Music,
  CheckCircle2,
  Filter,
  Eye,
  Grid
} from 'lucide-react';
import JSZip from 'jszip';
import { ReleaseProject, CampaignDesign, CampaignCategory } from '../../types/campaign';
import { ReleaseProjectForm } from '../studio/ReleaseProjectForm';
import { DesignCanvasEditor } from '../studio/DesignCanvasEditor';

export const MusicPromotionStudio: React.FC = () => {
  const { 
    releaseProjects, 
    campaignDesigns, 
    deleteReleaseProject, 
    updateCampaignDesign,
    logActivity 
  } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'project' | 'create' | 'edit'>('list');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeDesignId, setActiveDesignId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CampaignCategory | 'All'>('All');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const activeProject = useMemo(() => 
    releaseProjects.find(p => p.id === selectedProjectId), 
    [releaseProjects, selectedProjectId]
  );

  const filteredDesigns = useMemo(() => {
    if (!selectedProjectId) return [];
    let designs = campaignDesigns.filter(d => d.projectId === selectedProjectId);
    if (categoryFilter !== 'All') {
      designs = designs.filter(d => d.category === categoryFilter);
    }
    return designs;
  }, [campaignDesigns, selectedProjectId, categoryFilter]);

  const activeDesign = useMemo(() => 
    campaignDesigns.find(d => d.id === activeDesignId), 
    [campaignDesigns, activeDesignId]
  );

  const handleCreateComplete = (project: ReleaseProject) => {
    setSelectedProjectId(project.id);
    setViewMode('project');
    showToast('Release campaign generated successfully');
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm('Are you sure? This will delete the project and all 22 generated designs.')) {
      deleteReleaseProject(id);
      if (selectedProjectId === id) setSelectedProjectId(null);
      setViewMode('list');
      showToast('Project deleted');
    }
  };

  const handleOpenDesign = (designId: string) => {
    setActiveDesignId(designId);
    setViewMode('edit');
  };

  const handleSaveDesign = (updatedCanvasDesign: any) => {
    if (activeDesignId) {
      updateCampaignDesign(activeDesignId, { canvasDesign: updatedCanvasDesign });
      showToast('Design updated and saved');
    }
  };

  const handleExportZip = async () => {
    if (!activeProject) return;
    setIsExporting(true);
    
    try {
      const zip = new JSZip();
      const folderName = `${activeProject.artistName.replace(/\s+/g, '_')}_${activeProject.songTitle.replace(/\s+/g, '_')}`;
      const root = zip.folder(folderName);
      if (!root) return;

      // Add manifest/notes
      root.file('RELEASE_SUMMARY.txt', `
LYRICAL ENT — CAMPAIGN STUDIO EXPORT
=====================================
Artist: ${activeProject.artistName}
Release: ${activeProject.songTitle}
Type: ${activeProject.releaseType}
Date: ${activeProject.releaseDate}
Genre: ${activeProject.genre}
Export Date: ${new Date().toLocaleString()}

Contains 22 coordinated promotional assets.
      `.trim());

      const folders: Record<string, JSZip> = {
        'Anticipation': root.folder('01_ANTICIPATION')!,
        'Release Day': root.folder('02_RELEASE_DAY')!,
        'Post-Release': root.folder('03_POST_RELEASE')!
      };

      // In a real environment, we would render each canvas to a blob
      // Here we will add the JSON definition for demonstration or a mock SVG
      const projectDesigns = campaignDesigns.filter(d => d.projectId === activeProject.id);
      
      projectDesigns.forEach(d => {
        const fileName = `${d.name.toLowerCase().replace(/\s+/g, '_')}.json`;
        folders[d.category].file(fileName, JSON.stringify(d.canvasDesign, null, 2));
        
        // Add a placeholder SVG for better visual feedback in the ZIP
        const svg = `
<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000"/>
  <text x="50%" y="45%" fill="#FFF" font-family="monospace" font-size="40" text-anchor="middle">${activeProject.songTitle.toUpperCase()}</text>
  <text x="50%" y="55%" fill="#888" font-family="monospace" font-size="24" text-anchor="middle">${d.name.toUpperCase()}</text>
  <text x="50%" y="90%" fill="#FFF" font-family="monospace" font-size="16" text-anchor="middle">LYRICAL ENT CAMPAIGN STUDIO</text>
</svg>`.trim();
        folders[d.category].file(fileName.replace('.json', '.svg'), svg);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folderName}_Campaign_Pack.zip`;
      link.click();
      URL.revokeObjectURL(url);
      
      logActivity('Campaign Exported', 'campaigns', `Exported full ZIP pack for ${activeProject.songTitle}`);
      showToast('Campaign ZIP Pack exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to generate ZIP pack');
    } finally {
      setIsExporting(false);
    }
  };

  if (viewMode === 'edit' && activeDesign) {
    return (
      <DesignCanvasEditor 
        initialDesign={activeDesign.canvasDesign}
        onSaveDesign={handleSaveDesign}
        onClose={() => setViewMode('project')}
      />
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 font-mono text-xs border border-neutral-200">
          <CheckCircle2 size={16} className="text-black" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500">
              MUSIC RELEASE CAMPAIGN STUDIO
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">
            {viewMode === 'list' ? 'Campaign Archive' : activeProject?.songTitle || 'New Campaign'}
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl">
            {viewMode === 'list' 
              ? 'Manage and access all your music release promotional campaigns.' 
              : `Coordinated visual strategy for ${activeProject?.artistName}.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'list' ? (
            <button
              onClick={() => setViewMode('create')}
              className="px-5 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-all rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Create New Release</span>
            </button>
          ) : (
            <button
              onClick={() => setViewMode('list')}
              className="px-5 py-2.5 bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-700 transition-all rounded-lg flex items-center gap-2"
            >
              <span>Back to Archive</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'create' ? (
        <ReleaseProjectForm 
          onComplete={handleCreateComplete}
          onCancel={() => setViewMode('list')}
        />
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {releaseProjects.length > 0 ? (
            releaseProjects.map(project => (
              <div 
                key={project.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-600 transition-all group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-black rounded-lg border border-neutral-800">
                      <Disc3 className="text-white" size={24} />
                    </div>
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-neutral-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors">{project.songTitle}</h3>
                    <p className="text-sm text-neutral-400">{project.artistName}</p>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-500 uppercase">
                    <span className="flex items-center gap-1"><Grid size={12} /> 22 Designs</span>
                    <span>{project.releaseType}</span>
                  </div>
                </div>

                <div className="px-6 py-4 bg-black/40 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-500">{new Date(project.createdAt).toLocaleDateString()}</span>
                  <button 
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setViewMode('project');
                    }}
                    className="text-xs font-bold text-white hover:underline flex items-center gap-1"
                  >
                    Open Studio <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-4 bg-neutral-900/50 border border-dashed border-neutral-800 rounded-2xl">
              <div className="p-4 bg-neutral-800 rounded-full">
                <Music className="text-neutral-500" size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No campaigns found</h3>
                <p className="text-neutral-500 text-sm max-w-xs mx-auto">Start by creating a new release project to generate your promotional pack.</p>
              </div>
              <button
                onClick={() => setViewMode('create')}
                className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-all text-xs uppercase"
              >
                Create First Release
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Project View */
        <div className="space-y-8">
          {/* Project Summary Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div className="flex gap-6 items-center">
              <div className="w-20 h-20 bg-black rounded-lg border border-neutral-800 flex items-center justify-center relative overflow-hidden">
                {activeProject?.coverArtwork ? (
                  <img src={activeProject.coverArtwork} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                  <Disc3 size={32} className="text-neutral-700" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-white text-black text-[9px] font-black uppercase rounded tracking-tighter">
                    {activeProject?.releaseType}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                    {activeProject?.genre}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">{activeProject?.songTitle}</h2>
                <p className="text-neutral-400 font-medium">{activeProject?.artistName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="px-4 py-2 bg-black border border-neutral-800 rounded-lg">
                <p className="text-[9px] text-neutral-500 uppercase font-mono mb-0.5">Release Date</p>
                <p className="text-xs font-bold text-white font-mono">{activeProject?.releaseDate}</p>
              </div>
              
              <button
                onClick={handleExportZip}
                disabled={isExporting}
                className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 transition-all rounded-lg flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isExporting ? (
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FolderArchive size={18} />
                )}
                <span>{isExporting ? 'Exporting...' : 'Export Full ZIP Pack'}</span>
              </button>
            </div>
          </div>

          {/* Design Board */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-black border border-neutral-800 p-1 rounded-lg">
                {['All', 'Anticipation', 'Release Day', 'Post-Release'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat as any)}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md ${
                      categoryFilter === cat 
                        ? 'bg-neutral-800 text-white' 
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                Showing {filteredDesigns.length} Coordinated Designs
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredDesigns.map(design => (
                <div 
                  key={design.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-600 transition-all group flex flex-col"
                >
                  {/* Preview Area */}
                  <div 
                    className="aspect-square bg-black p-4 flex flex-col items-center justify-center relative cursor-pointer group-hover:bg-neutral-950 transition-colors"
                    onClick={() => handleOpenDesign(design.id)}
                  >
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                      {/* Abstract pattern to suggest canvas content */}
                      <div className="w-full h-full border border-white/5 grid grid-cols-4 grid-rows-4">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="border-[0.5px] border-white/5" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="z-10 flex flex-col items-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Eye size={20} className="text-white/40 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">{design.exportPreset}</p>
                        <h4 className="text-xs font-bold text-white uppercase tracking-tight group-hover:underline">{design.name}</h4>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className="px-1.5 py-0.5 bg-black/50 border border-white/10 text-[8px] font-mono text-neutral-400 uppercase rounded">
                        {design.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border-t border-neutral-800 flex items-center justify-between">
                    <button 
                      onClick={() => handleOpenDesign(design.id)}
                      className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5 hover:underline"
                    >
                      <Edit3 size={12} />
                      Edit Canvas
                    </button>
                    <button 
                      className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                      title="Download Sample SVG"
                      onClick={() => {
                        const svg = `
<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#000"/>
  <text x="50%" y="50%" fill="#FFF" font-family="monospace" font-size="24" text-anchor="middle">${design.name.toUpperCase()}</text>
</svg>`.trim();
                        const blob = new Blob([svg], { type: 'image/svg+xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${design.name.toLowerCase().replace(/\s+/g, '_')}.svg`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
