/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LYRICAL ENT & KEEDOHUB — Motion Studio & Animated Promotional Production
 * Phase 5 Connected Workflows: Audio Association, Motion Specs, Deliverable Gates & Real Export
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MotionProjectSpec, 
  DeliverableWorkflowStage,
  MusicRelease 
} from '../../types';
import { 
  Play, 
  Pause, 
  Film, 
  Download, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Music, 
  Layers, 
  Plus, 
  Send, 
  Eye, 
  ShieldAlert, 
  Lock, 
  Sliders, 
  FileCode,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Edit3,
  Trash2
} from 'lucide-react';

interface MotionTemplate {
  id: string;
  title: string;
  category: string;
  aspectRatio: '1:1 Square' | '9:16 Vertical Story' | '16:9 Landscape';
  defaultDuration: number;
  preset: 'Cinematic Reveal' | 'Typewriter' | 'Slow Zoom' | 'Beat Typography' | 'Glitch' | 'Sliding Title';
  description: string;
}

const MOTION_TEMPLATES: MotionTemplate[] = [
  { id: 'mot-01', title: 'Spotify 9:16 Canvas Seamless Loop', category: 'Music Visualizer', aspectRatio: '9:16 Vertical Story', defaultDuration: 8, preset: 'Cinematic Reveal', description: 'Continuous atmospheric 8-second seamless looping keyframe with subtle ambient grain' },
  { id: 'mot-02', title: 'Coming Soon Countdown Story', category: 'Pre-Launch', aspectRatio: '9:16 Vertical Story', defaultDuration: 10, preset: 'Typewriter', description: 'Monospace terminal character-by-character reveal with blinking cursor' },
  { id: 'mot-03', title: 'Cover-Art 35mm Reveal', category: 'Launch Day', aspectRatio: '1:1 Square', defaultDuration: 12, preset: 'Slow Zoom', description: 'Continuous optical push-in with subtle analog film grain texture' },
  { id: 'mot-04', title: 'OUT NOW Kinetic Video Drop', category: 'Launch Day', aspectRatio: '16:9 Landscape', defaultDuration: 20, preset: 'Beat Typography', description: 'Rhythmic scale-bounce synced to 120 BPM tempo transients' },
  { id: 'mot-05', title: 'Artist Introduction Feature', category: 'Artist Branding', aspectRatio: '9:16 Vertical Story', defaultDuration: 15, preset: 'Glitch', description: 'RGB split displacement with horizontal scanline interference' },
  { id: 'mot-06', title: 'Music Video Premiere Trailer', category: 'Video Promotion', aspectRatio: '16:9 Landscape', defaultDuration: 30, preset: 'Sliding Title', description: 'Left-to-right cinematic letter-spacing slide with shutter release' }
];

export const MotionStudio: React.FC = () => {
  const { 
    releases, 
    artists, 
    activeWorkspace, 
    motionProjects,
    addMotionProject,
    updateMotionProject,
    deleteMotionProject,
    addDeliverableVersion,
    productionProjects,
    logActivity 
  } = useApp();

  const workspaceReleases = useMemo(() => 
    releases.filter(r => r.workspaceId === activeWorkspace.id),
    [releases, activeWorkspace.id]
  );

  const workspaceMotionProjects = useMemo(() =>
    motionProjects.filter(p => p.workspaceId === activeWorkspace.id),
    [motionProjects, activeWorkspace.id]
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    workspaceMotionProjects[0]?.id || null
  );

  const [selectedTpl, setSelectedTpl] = useState<MotionTemplate>(MOTION_TEMPLATES[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active Project Data (if selected) or standalone scratchpad
  const activeMotionProject = useMemo(() => 
    workspaceMotionProjects.find(p => p.id === selectedProjectId),
    [workspaceMotionProjects, selectedProjectId]
  );

  // Form & Studio States
  const [associatedReleaseId, setAssociatedReleaseId] = useState<string>(
    activeMotionProject?.releaseId || workspaceReleases[0]?.id || ''
  );
  const [customHeadline, setCustomHeadline] = useState<string>(
    activeMotionProject?.title || 'MONOCHROME STATE · OUT NOW'
  );
  const [artistName, setArtistName] = useState<string>(
    workspaceReleases.find(r => r.id === associatedReleaseId)?.artistName || activeWorkspace.name
  );
  const [intendedDuration, setIntendedDuration] = useState<number>(
    activeMotionProject?.intendedVideoDurationSeconds || selectedTpl.defaultDuration
  );
  const [audioFileName, setAudioFileName] = useState<string>(
    activeMotionProject?.audioFileName || 'Master_Audio_Stem_24bit.wav'
  );
  const [audioDurationSec, setAudioDurationSec] = useState<number>(
    activeMotionProject?.audioDurationSeconds || 214
  );
  const [visualDirection, setVisualDirection] = useState<string>(
    activeMotionProject?.visualDirection || 'Monochrome high-contrast typography synced to transient beats at 120 BPM'
  );
  const [storyboardNotes, setStoryboardNotes] = useState<string>(
    activeMotionProject?.storyboardNotes || 'Intro title slide -> Optical push-in -> Safe-zone streaming link badges'
  );
  const [internalNotes, setInternalNotes] = useState<string>(
    activeMotionProject?.internalProductionNotes || 'Render target: 1080x1920 60FPS ProRes 422 + H.264 web delivery.'
  );
  const [currentVersion, setCurrentVersion] = useState<string>(
    activeMotionProject?.currentVersion || 'v1.0'
  );
  const [isClientPublished, setIsClientPublished] = useState<boolean>(
    activeMotionProject?.isClientPublished || false
  );
  const [stage, setStage] = useState<DeliverableWorkflowStage>(
    activeMotionProject?.stage || 'In Production'
  );

  // When selected project changes, sync local states
  const handleSelectProject = (proj: MotionProjectSpec) => {
    setSelectedProjectId(proj.id);
    setAssociatedReleaseId(proj.releaseId || '');
    setCustomHeadline(proj.title);
    setIntendedDuration(proj.intendedVideoDurationSeconds);
    setAudioFileName(proj.audioFileName || '');
    setAudioDurationSec(proj.audioDurationSeconds || 0);
    setVisualDirection(proj.visualDirection);
    setStoryboardNotes(proj.storyboardNotes || '');
    setInternalNotes(proj.internalProductionNotes || '');
    setCurrentVersion(proj.currentVersion);
    setIsClientPublished(proj.isClientPublished);
    setStage(proj.stage);

    // Pick matching template
    const match = MOTION_TEMPLATES.find(t => t.aspectRatio === proj.aspectRatio);
    if (match) setSelectedTpl(match);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Create new motion project
  const handleCreateNewMotionProject = () => {
    const rel = workspaceReleases.find(r => r.id === associatedReleaseId);
    const newProj = addMotionProject({
      workspaceId: activeWorkspace.id,
      releaseId: associatedReleaseId || undefined,
      title: `${rel ? rel.title : activeWorkspace.name} — ${selectedTpl.title}`,
      aspectRatio: selectedTpl.aspectRatio,
      deliverableType: selectedTpl.category === 'Music Visualizer' ? 'Music Visualizer' : 'Spotify Canvas Loop',
      audioFileName: audioFileName || `${rel?.title || 'Track'}_Master.wav`,
      audioDurationSeconds: audioDurationSec || 180,
      intendedVideoDurationSeconds: intendedDuration,
      visualDirection,
      storyboardNotes,
      internalProductionNotes: internalNotes,
      stage: 'In Production',
      isClientPublished: false,
      currentVersion: 'v1.0'
    });

    setSelectedProjectId(newProj.id);
    showToast(`Created motion project: "${newProj.title}"`);
  };

  // Save current project updates
  const handleSaveProjectUpdates = () => {
    if (!selectedProjectId) {
      handleCreateNewMotionProject();
      return;
    }

    updateMotionProject(selectedProjectId, {
      title: customHeadline,
      releaseId: associatedReleaseId || undefined,
      aspectRatio: selectedTpl.aspectRatio,
      intendedVideoDurationSeconds: intendedDuration,
      audioFileName,
      audioDurationSeconds: audioDurationSec,
      visualDirection,
      storyboardNotes,
      internalProductionNotes: internalNotes,
      stage,
      isClientPublished,
      currentVersion
    });

    showToast('Motion project specifications updated');
  };

  // Real Production Export: Generates Lossless Keyframe Canvas PNG + Motion Specification JSON
  const handleExportMotionPackage = () => {
    const canvas = document.createElement('canvas');
    let w = 1200;
    let h = 1200;
    if (selectedTpl.aspectRatio === '9:16 Vertical Story') {
      w = 1080;
      h = 1920;
    } else if (selectedTpl.aspectRatio === '16:9 Landscape') {
      w = 1920;
      h = 1080;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark modernist background
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, w, h);

    // Accent line border
    ctx.strokeStyle = activeWorkspace.brand?.accentColor || '#FF1E1E';
    ctx.lineWidth = 12;
    ctx.strokeRect(36, 36, w - 72, h - 72);

    // Header metadata banner
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(`${activeWorkspace.name.toUpperCase()} · MOTION PRODUCTION ATELIER`, 70, 110);

    ctx.fillStyle = '#888888';
    ctx.font = '500 20px monospace';
    ctx.fillText(
      `PRESET: ${selectedTpl.preset.toUpperCase()} · RATIO: ${selectedTpl.aspectRatio.toUpperCase()} · VERSION: ${currentVersion}`,
      70,
      150
    );

    // Title & Headline
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 60px sans-serif';
    ctx.fillText(customHeadline.toUpperCase(), 70, h / 2 - 20);

    // Artist credit
    ctx.fillStyle = activeWorkspace.brand?.accentColor || '#FF1E1E';
    ctx.font = '700 32px monospace';
    ctx.fillText(artistName.toUpperCase(), 70, h / 2 + 45);

    // Audio & timecode particulars
    ctx.fillStyle = '#A3A3A3';
    ctx.font = '400 20px monospace';
    ctx.fillText(
      `AUDIO STEM: ${audioFileName} (${audioDurationSec}s) · INTENDED TIMECODE: 00:00:${intendedDuration < 10 ? '0' + intendedDuration : intendedDuration}:00`,
      70,
      h - 130
    );
    ctx.fillText(`VISUAL DIRECTION: ${visualDirection}`, 70, h - 90);

    // Download Keyframe PNG
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    const wsSlug = activeWorkspace.name.toLowerCase().replace(/\s+/g, '_');
    a.download = `${wsSlug}_motion_${selectedTpl.preset.toLowerCase().replace(/\s+/g, '_')}_${currentVersion}_keyframe.png`;
    a.click();

    // Export Motion Spec JSON
    const motionSpec = {
      projectTitle: customHeadline,
      workspaceId: activeWorkspace.id,
      clientName: activeWorkspace.name,
      associatedReleaseId: associatedReleaseId || 'N/A',
      preset: selectedTpl.preset,
      aspectRatio: selectedTpl.aspectRatio,
      dimensions: `${w}x${h}`,
      targetFrameRate: 60,
      intendedDurationSeconds: intendedDuration,
      audioFileName,
      audioDurationSeconds: audioDurationSec,
      visualDirection,
      storyboardNotes,
      currentVersion,
      productionStage: stage,
      isClientPublished,
      exportedAt: new Date().toISOString()
    };

    const specBlob = new Blob([JSON.stringify(motionSpec, null, 2)], { type: 'application/json' });
    const specUrl = URL.createObjectURL(specBlob);
    const specLink = document.createElement('a');
    specLink.href = specUrl;
    specLink.download = `${wsSlug}_motion_${currentVersion}_production_spec.json`;
    specLink.click();
    URL.revokeObjectURL(specUrl);

    showToast('Exported Lossless Keyframe PNG & Motion Specification JSON');
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-white/20 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2.5 font-mono text-xs">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF1E1E] animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
              PHASE 5: MOTION PRODUCTION WORKFLOW &amp; TIMELINE SPECIFICATIONS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono uppercase">
            MOTION STUDIO &amp; DELIVERABLE PIPELINE
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Manage audio-synced video visualizers, Spotify 9:16 Canvas loops, social release teasers, storyboard notes, and client review publishing gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNewMotionProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#FF1E1E] hover:bg-red-600 text-white rounded transition-colors shadow"
          >
            <Plus size={14} />
            <span>New Motion Project</span>
          </button>
        </div>
      </div>

      {/* Active Motion Projects Roster (If Any) */}
      {workspaceMotionProjects.length > 0 && (
        <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-lg p-3.5 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="uppercase font-bold text-white flex items-center gap-1.5">
              <Film size={14} className="text-[#FF1E1E]" />
              Active Workspace Motion Deliverables ({workspaceMotionProjects.length})
            </span>
            <span className="text-neutral-500">CLICK TO LOAD PROJECT</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {workspaceMotionProjects.map(proj => {
              const isSelected = proj.id === selectedProjectId;
              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj)}
                  className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? 'bg-[#1C1C1C] border-[#FF1E1E] text-white shadow-sm' 
                      : 'bg-[#121212] border-[#222222] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-white truncate text-xs">{proj.title}</div>
                    <div className="text-[10px] text-neutral-400">
                      {proj.aspectRatio} · {proj.currentVersion} · {proj.stage}
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${
                    proj.isClientPublished ? 'bg-emerald-950/60 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {proj.isClientPublished ? 'PUBLISHED' : 'PRIVATE'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Studio Viewport & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Preset Selector & Storyboard Specs (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 font-mono text-xs">
          {/* Preset Selection */}
          <div className="bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-4 space-y-3">
            <h2 className="text-xs font-semibold text-white tracking-tight uppercase border-b border-[#1C1C1C] pb-2 flex items-center justify-between">
              <span>Motion Formats &amp; Presets</span>
              <span className="text-neutral-500 text-[10px]">60FPS ENGINE</span>
            </h2>

            <div className="space-y-2">
              {MOTION_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTpl(tpl);
                    setIntendedDuration(tpl.defaultDuration);
                  }}
                  className={`w-full text-left p-2.5 rounded border transition-all ${
                    selectedTpl.id === tpl.id 
                      ? 'bg-[#1C1C1C] border-white text-white font-bold shadow-sm' 
                      : 'bg-[#121212] border-[#222222] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5 gap-2">
                    <span className="text-white text-xs truncate">{tpl.title}</span>
                    <span className="text-[10px] text-neutral-400 shrink-0">{tpl.aspectRatio.split(' ')[0]}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Preset: {tpl.preset} · {tpl.defaultDuration}s Loop
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Track Association & Metadata */}
          <div className="bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase border-b border-[#1C1C1C] pb-2 flex items-center gap-1.5">
              <Music size={14} className="text-[#FF1E1E]" />
              <span>Audio Stem Association</span>
            </h3>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">ASSOCIATED RELEASE</label>
              <select
                value={associatedReleaseId}
                onChange={e => {
                  setAssociatedReleaseId(e.target.value);
                  const rel = workspaceReleases.find(r => r.id === e.target.value);
                  if (rel) {
                    setArtistName(rel.artistName);
                    if (rel.audioMetadata?.fileName) setAudioFileName(rel.audioMetadata.fileName);
                    if (rel.audioMetadata?.durationSeconds) setAudioDurationSec(rel.audioMetadata.durationSeconds);
                  }
                }}
                className="w-full bg-[#141414] border border-[#242424] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
              >
                <option value="">None (Independent Motion Asset)</option>
                {workspaceReleases.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.artistName})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">AUDIO STEM FILE NAME</label>
              <input
                type="text"
                value={audioFileName}
                onChange={e => setAudioFileName(e.target.value)}
                placeholder="e.g. Monochrome_State_Hook_Master.wav"
                className="w-full bg-[#141414] border border-[#242424] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF1E1E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">AUDIO LENGTH (SEC)</label>
                <input
                  type="number"
                  min={1}
                  value={audioDurationSec}
                  onChange={e => setAudioDurationSec(Number(e.target.value))}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-2 py-1 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">VIDEO LOOP (SEC)</label>
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={intendedDuration}
                  onChange={e => setIntendedDuration(Number(e.target.value))}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-2 py-1 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Visual Direction & Private Production Notes */}
          <div className="bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase border-b border-[#1C1C1C] pb-2 flex items-center gap-1.5">
              <Sliders size={14} className="text-amber-400" />
              <span>Storyboard &amp; Private Notes</span>
            </h3>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">VISUAL DIRECTION</label>
              <input
                type="text"
                value={visualDirection}
                onChange={e => setVisualDirection(e.target.value)}
                placeholder="e.g. Modernist monochrome, transient transient beat-sync"
                className="w-full bg-[#141414] border border-[#242424] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1">STORYBOARD KEYFRAME NOTES</label>
              <textarea
                rows={2}
                value={storyboardNotes}
                onChange={e => setStoryboardNotes(e.target.value)}
                placeholder="Frame 1-3 intro -> Optical zoom -> Out now card"
                className="w-full bg-[#141414] border border-[#242424] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 mb-1 flex items-center gap-1">
                <Lock size={10} className="text-[#FF1E1E]" />
                <span>PRIVATE OPERATOR NOTES (INTERNAL ONLY)</span>
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                placeholder="Internal render notes, QA checklist, encoder specs..."
                className="w-full bg-[#141414] border border-[#242424] rounded px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Motion Canvas Simulation & Pipeline Controls (8 Cols) */}
        <div className="lg:col-span-8 space-y-5 font-mono">
          {/* Viewport Top Bar */}
          <div className="bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white tracking-tight uppercase truncate">
                {customHeadline}
              </h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Ratio: <strong className="text-white">{selectedTpl.aspectRatio}</strong> · Preset: <strong className="text-[#FF1E1E]">{selectedTpl.preset}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-bold text-xs rounded hover:bg-neutral-200 transition-colors shadow-sm"
              >
                {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
                <span>{isPlaying ? 'Pause' : 'Play Motion'}</span>
              </button>
            </div>
          </div>

          {/* High Frame-Rate Dynamic Canvas Simulation Viewport */}
          <div className="aspect-video w-full bg-[#050505] border border-[#222222] rounded-lg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-3 left-3 text-[10px] text-neutral-500 flex items-center gap-1.5">
              <Film size={12} />
              <span>CANVAS PREVIEW ({selectedTpl.aspectRatio}) · {intendedDuration}s TIMECODE LOOP</span>
            </div>

            {/* Dynamic CSS Keyframe Animated Monolith */}
            <div 
              className={`space-y-3 z-10 p-4 transition-all duration-700 ${
                isPlaying
                  ? selectedTpl.preset === 'Slow Zoom'
                    ? 'scale-105 transition-transform duration-1000'
                    : selectedTpl.preset === 'Glitch'
                    ? 'animate-pulse'
                    : selectedTpl.preset === 'Sliding Title'
                    ? 'translate-x-1 transition-transform'
                    : 'animate-in fade-in duration-500'
                  : 'opacity-90'
              }`}
            >
              <div 
                className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white flex items-center justify-center mx-auto font-black text-lg sm:text-xl text-white shadow-xl uppercase"
                style={{ backgroundColor: activeWorkspace.brand?.accentColor || '#000000' }}
              >
                {activeWorkspace.name.substring(0, 2)}
              </div>

              <h1 className="font-black text-xl sm:text-2xl lg:text-3xl text-white uppercase tracking-tight break-words max-w-lg">
                {customHeadline}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-300 uppercase tracking-widest">
                {artistName} · {activeWorkspace.name.toUpperCase()} MOTION SUITE
              </p>

              <div className="text-[10px] text-neutral-500 uppercase flex items-center justify-center gap-2">
                <span>TIMECODE: 00:00:{intendedDuration < 10 ? '0' + intendedDuration : intendedDuration}:00</span>
                <span>·</span>
                <span>BPM: 120 TRANSIENT</span>
              </div>
            </div>
          </div>

          {/* Pipeline Lifecycle & Client Review Gate Controls */}
          <div className="bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
              <div>
                <span className="font-bold text-white uppercase block">Deliverable Review &amp; Publishing Gate</span>
                <span className="text-[11px] text-neutral-400">Control stage transitions and client portal visibility</span>
              </div>

              {/* Version pill */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-neutral-500">VERSION:</span>
                <input
                  type="text"
                  value={currentVersion}
                  onChange={e => setCurrentVersion(e.target.value)}
                  className="w-16 bg-[#161616] border border-[#2E2E2E] rounded px-2 py-1 text-center text-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Stage selector */}
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">PIPELINE WORKFLOW STAGE</label>
                <select
                  value={stage}
                  onChange={e => setStage(e.target.value as DeliverableWorkflowStage)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Brief">Brief</option>
                  <option value="In Production">In Production</option>
                  <option value="Internal QA">Internal QA</option>
                  <option value="Client Review">Client Review</option>
                  <option value="Revision Required">Revision Required</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              {/* Client Publishing Gate */}
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">CLIENT ACCESS GATE</label>
                <button
                  type="button"
                  onClick={() => setIsClientPublished(!isClientPublished)}
                  className={`w-full py-2 px-3 rounded border font-semibold flex items-center justify-center gap-2 transition-colors ${
                    isClientPublished 
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50 hover:bg-emerald-950/90' 
                      : 'bg-[#161616] text-neutral-400 border-[#2B2B2B] hover:text-white'
                  }`}
                >
                  <Eye size={14} />
                  <span>{isClientPublished ? 'Published to Client Portal' : 'Private (Operator Draft)'}</span>
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleSaveProjectUpdates}
                className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] text-white border border-[#2E2E2E] rounded text-xs font-semibold transition-colors"
              >
                Save Project Specs
              </button>

              <button
                onClick={handleExportMotionPackage}
                className="flex items-center gap-2 py-2 px-4 bg-[#FF1E1E] hover:bg-red-600 text-white font-bold rounded transition-colors shadow-md shadow-red-950/40"
              >
                <Download size={14} />
                <span>Export Motion Package</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
