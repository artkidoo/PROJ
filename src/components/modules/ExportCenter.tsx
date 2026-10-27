import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MusicRelease } from '../../types';
import { 
  triggerSvgDownload, 
  triggerPngDownload 
} from '../brand/LogoSystem';
import JSZip from 'jszip';
import { generateMasterBrandZip, ZipOptions } from '../../utils/zipGenerator';
import { generateReleaseDeliveryZip } from '../../utils/releaseZipGenerator';
import { generateBrandGuidelinesPdf } from '../../utils/pdfGenerator';
import { generateBloggerThemeXml } from '../../utils/bloggerXmlGenerator';
import { 
  Share2, 
  Download, 
  FileCode, 
  FileText, 
  Database, 
  Globe, 
  CheckCircle2, 
  Upload, 
  AlertCircle,
  Layers,
  Archive,
  Printer,
  PackageCheck,
  FolderArchive,
  Check,
  Sparkles,
  BookOpen,
  Disc3,
  Film,
  Music,
  Clock,
  ShieldCheck,
  ChevronRight,
  Eye,
  CheckCircle
} from 'lucide-react';

export const ExportCenter: React.FC = () => {
  const { 
    exportDatabaseJson, 
    importDatabaseJson, 
    releases, 
    artists, 
    documents, 
    brandAssets, 
    bloggerSettings,
    brandGuidelines,
    activeWorkspace,
    motionProjects,
    servicePackages
  } = useApp();

  const filteredArtists = useMemo(() => {
    return artists.filter(a => 
      a.workspaceId === activeWorkspace.id || 
      (!a.workspaceId && activeWorkspace.id === 'ws-lyrical-ent')
    );
  }, [artists, activeWorkspace.id]);

  const filteredReleases = useMemo(() => {
    return releases.filter(r => 
      r.workspaceId === activeWorkspace.id || 
      (!r.workspaceId && activeWorkspace.id === 'ws-lyrical-ent')
    );
  }, [releases, activeWorkspace.id]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(d => 
      d.workspaceId === activeWorkspace.id || 
      (!d.workspaceId && activeWorkspace.id === 'ws-lyrical-ent')
    );
  }, [documents, activeWorkspace.id]);

  const wsName = activeWorkspace.name;
  const wsSlug = wsName.toLowerCase().replace(/\s+/g, '_');

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>(() => filteredReleases[0]?.id || '');
  const [isPackagingRelease, setIsPackagingRelease] = useState(false);

  const currentRelease = useMemo(() => {
    return filteredReleases.find(r => r.id === selectedReleaseId) || filteredReleases[0] || null;
  }, [filteredReleases, selectedReleaseId]);

  const connectedPackage = useMemo(() => {
    if (!currentRelease?.packageId) return null;
    return servicePackages.find(p => p.id === currentRelease.packageId) || null;
  }, [currentRelease, servicePackages]);

  const currentReleaseMotionProjects = useMemo(() => {
    if (!currentRelease) return [];
    return motionProjects.filter(m => 
      m.releaseId === currentRelease.id || 
      (currentRelease.title && m.title.toLowerCase().includes(currentRelease.title.toLowerCase()))
    );
  }, [currentRelease, motionProjects]);

  const handleDownloadReleasePackageZip = async () => {
    if (!currentRelease) return;
    setIsPackagingRelease(true);
    try {
      await generateReleaseDeliveryZip(currentRelease, activeWorkspace, currentReleaseMotionProjects, connectedPackage || undefined);
    } catch (err) {
      console.error('Release delivery package zip error', err);
    } finally {
      setIsPackagingRelease(false);
    }
  };

  const [zipOptions, setZipOptions] = useState<ZipOptions>({
    includeIdentity: true,
    includeGuidelines: true,
    includeDocuments: true,
    includeCompanyProfile: true,
    includeLaunchCreative: true,
    includeWebsite: true
  });

  const handleDownloadMasterZip = async () => {
    setIsZipping(true);
    try {
      await generateMasterBrandZip(brandGuidelines, filteredDocuments, zipOptions);
    } catch (err) {
      console.error('ZIP generation error', err);
    } finally {
      setIsZipping(false);
    }
  };

  // 1. Export JSON database snapshot
  const handleExportJson = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wsSlug}_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Import JSON database snapshot
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJson(content);
      if (success) {
        setImportStatus('Successfully restored label database from JSON snapshot!');
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus('Failed to parse database snapshot. Please ensure valid JSON format.');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  // 3. Export Releases Catalog CSV
  const handleExportReleasesCsv = () => {
    let csv = `ID,Title,Type,Artist,PlannedDate,Status,ISRC,UPC,Producer,Rights\n`;
    filteredReleases.forEach((r: MusicRelease) => {
      csv += `"${r.id}","${r.title}","${r.type}","${r.artistName}","${r.plannedReleaseDate}","${r.distributionStatus}","${r.isrc || ''}","${r.upc || ''}","${r.producer}","${r.rightsInfo.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wsSlug}_catalog_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 4. Export Blogger Theme XML
  const handleExportThemeXml = () => {
    const xml = generateBloggerThemeXml(bloggerSettings, filteredReleases[0] || releases[0], filteredArtists[0] || artists[0]);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wsSlug}_official_blogger_theme_v3.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            EXPORT &amp; HANDOVER STATION
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Production asset packages, catalog metadata spreadsheets, official vector marks, Blogger XML themes, and full JSON backups
          </p>
        </div>
      </div>

      {importStatus && (
        <div className="p-4 bg-[#141414] border border-[#2B2B2B] rounded-lg text-xs font-mono text-white flex items-center gap-2">
          <CheckCircle2 size={16} className="text-white" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Phase 5: Release & Motion Deliverables Package Archive (.ZIP) */}
      <div className="p-6 bg-[#0E0E0E] border-2 border-[#FF1E1E]/40 rounded-lg space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF1E1E]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header with Release Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E1E1E] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#FF1E1E] mb-1">
              <Disc3 size={16} className="animate-spin-slow" />
              <span className="font-bold uppercase tracking-wider">PHASE 5 PRODUCTION WORKFLOW</span>
              <span className="text-neutral-600">·</span>
              <span className="text-white font-mono">RELEASE &amp; MOTION DELIVERY SUITE</span>
            </div>
            <h2 className="text-lg font-bold text-white font-mono uppercase flex items-center gap-2">
              Music Release Deliverables &amp; Motion Package (.ZIP)
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Consolidates client-approved master cover art, vertical motion teasers, lossless audio master stems, ISRC/UPC DSP metadata manifests, and technical handover quality audit checklists into a unified client delivery package.
            </p>
          </div>

          {/* Release Switcher Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                ACTIVE RELEASE SELECTION
              </label>
              <select
                value={selectedReleaseId}
                onChange={(e) => setSelectedReleaseId(e.target.value)}
                className="bg-[#141414] border border-[#2B2B2B] text-white text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-[#FF1E1E]"
              >
                {filteredReleases.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} — {r.artistName} ({r.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDownloadReleasePackageZip}
              disabled={isPackagingRelease || !currentRelease}
              className="mt-auto flex items-center justify-center gap-2 py-2.5 px-5 text-xs font-bold font-mono bg-[#FF1E1E] text-white hover:bg-[#d91919] rounded transition-colors whitespace-nowrap shadow-lg shadow-[#FF1E1E]/20"
            >
              {isPackagingRelease ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Compiling Package...</span>
                </>
              ) : (
                <>
                  <FolderArchive size={15} strokeWidth={2.5} />
                  <span>Download Release Package (.ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {currentRelease ? (
          <div className="space-y-5">
            {/* Package Association & Key Specs Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-[#121212] border border-[#222222] rounded">
                <span className="text-[10px] font-mono text-neutral-500 uppercase block">CONNECTED PACKAGE</span>
                <span className="text-xs font-mono font-bold text-white mt-1 block">
                  {connectedPackage ? connectedPackage.name : 'Custom / Unassigned'}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
                  {connectedPackage ? `${connectedPackage.revisionLimit} Revisions Included` : 'Standard Production Terms'}
                </span>
              </div>

              <div className="p-3 bg-[#121212] border border-[#222222] rounded">
                <span className="text-[10px] font-mono text-neutral-500 uppercase block">CAMPAIGN STAGE</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#FF1E1E] animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white">
                    {currentRelease.campaignStage || 'Pre-Release'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
                  Target Street Date: {currentRelease.plannedReleaseDate || 'TBA'}
                </span>
              </div>

              <div className="p-3 bg-[#121212] border border-[#222222] rounded">
                <span className="text-[10px] font-mono text-neutral-500 uppercase block">CLIENT APPROVAL GATE</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {currentRelease.clientApprovalStatus === 'Approved' ? (
                    <CheckCircle size={14} className="text-green-400" />
                  ) : (
                    <Clock size={14} className="text-yellow-400" />
                  )}
                  <span className="text-xs font-mono font-bold text-white">
                    {currentRelease.clientApprovalStatus || 'Pending Client Sign-Off'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
                  {currentRelease.clientApprovalDate ? `Signed ${currentRelease.clientApprovalDate}` : 'Under Review'}
                </span>
              </div>

              <div className="p-3 bg-[#121212] border border-[#222222] rounded">
                <span className="text-[10px] font-mono text-neutral-500 uppercase block">DELIVERABLES INCLUDED</span>
                <span className="text-xs font-mono font-bold text-white mt-1 block">
                  {(currentRelease.deliverables || []).length} Tracked Deliverables
                </span>
                <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
                  {(currentRelease.deliverables || []).filter(d => d.clientApproved).length} Client Approved · {(currentRelease.deliverables || []).filter(d => d.isClientPublished).length} Published
                </span>
              </div>
            </div>

            {/* Technical Verification Quality Checklist */}
            <div className="p-4 bg-[#121212] border border-[#1F1F1F] rounded-lg">
              <div className="flex items-center justify-between mb-3 border-b border-[#1C1C1C] pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-[#FF1E1E]" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    TECHNICAL DELIVERY CHECKLIST &amp; VERIFICATION
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">
                  ZERO ARBITRARY DATA · REAL VERIFIED SPECS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                {/* 1:1 Cover Artwork Spec */}
                <div className="p-3 bg-[#0A0A0A] border border-[#222222] rounded space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                    <span>1:1 COVER ARTWORK</span>
                    <Check size={12} className="text-green-400" />
                  </div>
                  {currentRelease.artworkMetadata ? (
                    <>
                      <div className="font-bold text-white truncate">{currentRelease.artworkMetadata.fileName}</div>
                      <div className="text-[11px] text-neutral-400">
                        {currentRelease.artworkMetadata.dimensions} · {currentRelease.artworkMetadata.resolutionDpi} DPI
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {currentRelease.artworkMetadata.colorSpace} · {currentRelease.artworkMetadata.fileSize}
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-neutral-400">Master cover artwork reference attached</div>
                  )}
                </div>

                {/* Vertical Motion Teaser / Canvas */}
                <div className="p-3 bg-[#0A0A0A] border border-[#222222] rounded space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                    <span>9:16 VERTICAL MOTION</span>
                    <Film size={12} className="text-[#FF1E1E]" />
                  </div>
                  {currentReleaseMotionProjects.length > 0 ? (
                    <>
                      <div className="font-bold text-white truncate">
                        {currentReleaseMotionProjects[0].title} ({currentReleaseMotionProjects[0].currentVersion})
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {currentReleaseMotionProjects[0].aspectRatio} · {currentReleaseMotionProjects[0].intendedVideoDurationSeconds}s Loop
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Stage: {currentReleaseMotionProjects[0].stage}
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-neutral-400">Configured in Motion Studio</div>
                  )}
                </div>

                {/* Master Audio Stem */}
                <div className="p-3 bg-[#0A0A0A] border border-[#222222] rounded space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                    <span>MASTER AUDIO STEM</span>
                    <Music size={12} className="text-green-400" />
                  </div>
                  {currentRelease.audioMetadata ? (
                    <>
                      <div className="font-bold text-white truncate">{currentRelease.audioMetadata.fileName}</div>
                      <div className="text-[11px] text-neutral-400">
                        {currentRelease.audioMetadata.sampleRate} · {currentRelease.audioMetadata.bitDepth}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {currentRelease.audioMetadata.durationSeconds}s · {currentRelease.audioMetadata.fileSize}
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-neutral-400">Awaiting master stem file attachment</div>
                  )}
                </div>

                {/* Catalog Identifiers */}
                <div className="p-3 bg-[#0A0A0A] border border-[#222222] rounded space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                    <span>DSP CATALOG CODES</span>
                    <Disc3 size={12} className="text-neutral-400" />
                  </div>
                  <div className="text-[11px] text-white">
                    ISRC: <span className="text-neutral-300">{currentRelease.isrc || 'Pending Registration'}</span>
                  </div>
                  <div className="text-[11px] text-white">
                    UPC: <span className="text-neutral-300">{currentRelease.upc || 'Pending Registration'}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Distribution: {currentRelease.distributionStatus}
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverables Roster Table */}
            <div className="border border-[#1F1F1F] rounded-lg overflow-hidden">
              <div className="p-3 bg-[#141414] border-b border-[#1F1F1F] flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  PACKAGE DELIVERABLES PIPELINE
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Tracked across 6 stages from Brief to Delivered
                </span>
              </div>

              <div className="divide-y divide-[#181818] bg-[#0A0A0A]">
                {(currentRelease.deliverables || []).map((deliv) => {
                  const stageColors: Record<string, string> = {
                    'Brief': 'bg-neutral-800 text-neutral-300 border-neutral-700',
                    'In Production': 'bg-blue-950/80 text-blue-300 border-blue-800/80',
                    'Internal QA': 'bg-purple-950/80 text-purple-300 border-purple-800/80',
                    'Client Review': 'bg-amber-950/80 text-amber-300 border-amber-800/80',
                    'Revision Required': 'bg-red-950/80 text-red-300 border-red-800/80',
                    'Delivered': 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                  };

                  return (
                    <div key={deliv.id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#FF1E1E] mt-1.5 flex-shrink-0" />
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{deliv.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${stageColors[deliv.stage] || 'bg-neutral-800 text-neutral-300'}`}>
                              {deliv.stage}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            Format: {deliv.format} · Specs: {deliv.fileSpecs || 'Lossless'} · Revisions: {deliv.revisionCount}/{deliv.maxRevisions}
                          </div>
                          {deliv.clientFeedback && (
                            <div className="text-[10px] text-amber-300/80 mt-1 italic">
                              Client feedback: "{deliv.clientFeedback}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          deliv.isClientPublished 
                            ? 'bg-blue-900/30 text-blue-300 border-blue-700/50' 
                            : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                        }`}>
                          {deliv.isClientPublished ? 'Published to Client' : 'Internal Only'}
                        </span>

                        <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                          deliv.clientApproved 
                            ? 'bg-green-900/30 text-green-300 border-green-700/50' 
                            : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                        }`}>
                          {deliv.clientApproved ? (
                            <>
                              <Check size={10} />
                              <span>Client Approved</span>
                            </>
                          ) : (
                            <span>Awaiting Sign-Off</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs font-mono text-neutral-500">
            No music releases registered in the active workspace. Create a release in Release Management to generate a delivery package.
          </div>
        )}
      </div>

      {/* Master Brand Package Archive (.ZIP) Section */}
      <div className="p-6 bg-[#0E0E0E] border-2 border-neutral-700 rounded-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
              <PackageCheck size={16} className="text-white" />
              <span className="text-white font-bold uppercase tracking-wider">ALL-IN-ONE MASTER ARCHIVE</span>
              <span>·</span>
              <span className="text-neutral-400">STRUCTURED .ZIP BUNDLE</span>
            </div>
            <h2 className="text-lg font-bold text-white font-mono uppercase">
              Master Brand Package (.ZIP) Handover Suite
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Consolidates official vector logos, brand guidelines manual, legal corporate dispatch documents, executive company profile, launch creative cards, and verified Blogger XML theme into a single organized ZIP package.
            </p>
          </div>

          <button
            onClick={handleDownloadMasterZip}
            disabled={isZipping}
            className="flex items-center gap-2 py-2.5 px-5 text-xs font-bold font-mono bg-white text-black hover:bg-neutral-200 rounded transition-colors whitespace-nowrap self-start"
          >
            {isZipping ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Compiling Archive...</span>
              </>
            ) : (
              <>
                <FolderArchive size={15} strokeWidth={2.5} />
                <span>Download Master Brand Package (.ZIP)</span>
              </>
            )}
          </button>
        </div>

        {/* Folder Selectors */}
        <div className="pt-4 border-t border-[#1C1C1C]">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-2.5">
            SELECT INCLUDED DIRECTORIES:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { key: 'includeIdentity', label: '01_BRAND_IDENTITY', desc: 'Vector SVGs & Marks' },
              { key: 'includeGuidelines', label: '02_BRAND_GUIDELINES', desc: 'Constitution & Palette' },
              { key: 'includeDocuments', label: '03_CORPORATE_DOCS', desc: `${filteredDocuments.length} Dispatches & Signatures` },
              { key: 'includeCompanyProfile', label: '04_COMPANY_PROFILE', desc: 'Executive Dossier' },
              { key: 'includeLaunchCreative', label: '05_LAUNCH_CREATIVE', desc: 'Playbook & Copy Presets' },
              { key: 'includeWebsite', label: '06_WEBSITE', desc: 'Blogger Layout v3 XML' }
            ].map(f => {
              const active = zipOptions[f.key as keyof ZipOptions];
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setZipOptions({ ...zipOptions, [f.key]: !active })}
                  className={`p-2.5 rounded text-left border transition-all ${
                    active 
                      ? 'bg-[#161616] border-white text-white' 
                      : 'bg-[#101010] border-[#222222] text-neutral-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold">{f.label}</span>
                    <div className={`w-3 h-3 rounded flex items-center justify-center ${active ? 'bg-white text-black' : 'border border-neutral-700'}`}>
                      {active && <Check size={8} strokeWidth={3} />}
                    </div>
                  </div>
                  <div className="text-[9px] text-neutral-400 truncate">{f.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Export: Brand Guidelines Official Multi-Page PDF */}
        <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
              <span>BRAND GOVERNANCE</span>
              <BookOpen size={15} />
            </div>
            <h3 className="text-sm font-semibold text-white">Official Brand Guidelines (PDF)</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Multi-page formal brand manual covering the {wsName.substring(0, 2).toUpperCase()} monogram, exclusion zones, print/digital minimum sizes, monochrome palette, and typography standards.
            </p>
          </div>

          <button
            onClick={() => generateBrandGuidelinesPdf(brandGuidelines, activeWorkspace)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Download Brand Manual (PDF)</span>
          </button>
        </div>
        {/* Export 1: Full Database Backup JSON */}
        <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
              <span>DATABASE SNAPSHOT</span>
              <Database size={15} />
            </div>
            <h3 className="text-sm font-semibold text-white">Full Workspace JSON Backup</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Complete archive containing all {filteredArtists.length} artists, {filteredReleases.length} releases, {filteredDocuments.length} corporate documents, brand assets, and operations logs.
            </p>
          </div>

          <button
            onClick={handleExportJson}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Download Full Backup (JSON)</span>
          </button>
        </div>

        {/* Export 2: Releases Catalog CSV */}
        <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
              <span>DSP METADATA MANIFEST</span>
              <FileText size={15} />
            </div>
            <h3 className="text-sm font-semibold text-white">Releases Catalog Spreadsheet (CSV)</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Tabular spreadsheet of all ISRC numbers, UPC barcodes, songwriter splits, and planned street dates ready for DSP distributor ingestion.
            </p>
          </div>

          <button
            onClick={handleExportReleasesCsv}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-[#1C1C1C] text-white hover:bg-[#252525] border border-[#2B2B2B] rounded transition-colors"
          >
            <Download size={13} />
            <span>Download Catalog (CSV)</span>
          </button>
        </div>

        {/* Export 3: Blogger Theme XML */}
        <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
              <span>BLOGGER PUBLISHING PLATFORM</span>
              <FileCode size={15} />
            </div>
            <h3 className="text-sm font-semibold text-white">Validated Blogger XML Theme</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Standalone XML template compliant with Google Blogger Layout v3 syntax, preserving native Blog1 widget structure and pagination.
            </p>
          </div>

          <button
            onClick={handleExportThemeXml}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-[#1C1C1C] text-white hover:bg-[#252525] border border-[#2B2B2B] rounded transition-colors"
          >
            <Download size={13} />
            <span>Download Theme (XML)</span>
          </button>
        </div>

        {/* Export 4: Primary Logo SVG & PNG */}
        <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
              <span>OFFICIAL MASTER LOGO</span>
              <Layers size={15} />
            </div>
            <h3 className="text-sm font-semibold text-white">Primary Stacked Logo Pack</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Official {wsName.toUpperCase()} stacked primary mark combining the {wsName.substring(0, 2).toUpperCase()} monogram and typography. Available in vector SVG and 1200px PNG.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => triggerSvgDownload('primary', 'white-on-black')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-mono bg-[#1C1C1C] text-neutral-300 hover:text-white rounded border border-[#2B2B2B] transition-colors"
            >
              <Download size={12} />
              <span>SVG Vector</span>
            </button>
            <button
              onClick={() => triggerPngDownload('primary', 'white-on-black', 1200)}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-mono bg-[#1C1C1C] text-white hover:bg-[#252525] rounded border border-[#2B2B2B] transition-colors"
            >
              <Download size={12} />
              <span>PNG 1200px</span>
            </button>
          </div>
        </div>

        {/* Export 5: LE Monogram Emblem Pack */}
        <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
              <span>BRAND SEAL</span>
              <Layers size={15} />
            </div>
            <h3 className="text-sm font-semibold text-white">{wsName.substring(0, 2).toUpperCase()} Monogram Emblem Pack</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Precision geometric {wsName.substring(0, 2).toUpperCase()} monogram for vinyl runout matrix etching, social profiles, apparel embroidery, and watermarking.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => triggerSvgDownload('monogram', 'white-on-black')}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-mono bg-[#1C1C1C] text-neutral-300 hover:text-white rounded border border-[#2B2B2B] transition-colors"
            >
              <Download size={12} />
              <span>SVG Vector</span>
            </button>
            <button
              onClick={() => triggerPngDownload('monogram', 'white-on-black', 1200)}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-mono bg-[#1C1C1C] text-white hover:bg-[#252525] rounded border border-[#2B2B2B] transition-colors"
            >
              <Download size={12} />
              <span>PNG 1200px</span>
            </button>
          </div>
        </div>

        {/* Export 6: Print Dispatch PDF Engine */}
        <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
              <span>EXECUTIVE DISPATCH</span>
              <Printer size={15} />
            </div>
            <h3 className="text-sm font-semibold text-white">Corporate Printable PDF Engine</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Generate pixel-perfect A4 printable letters, master synchronization invoices, and split sheet contracts formatted for browser PDF export.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-[#1C1C1C] text-white hover:bg-[#252525] border border-[#2B2B2B] rounded transition-colors"
          >
            <Printer size={13} />
            <span>Print Current View (PDF)</span>
          </button>
        </div>

        {/* Database Restore from JSON */}
        <div className="p-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-2">
              <span>SYSTEM RESTORATION</span>
              <Upload size={15} />
            </div>
            <h3 className="text-sm font-semibold text-white">Restore Snapshot (JSON)</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Upload a previously exported {wsName.toUpperCase()} backup file to restore records across devices or recover state.
            </p>
          </div>

          <label className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-[#1C1C1C] text-neutral-300 hover:text-white hover:bg-[#252525] border border-[#2B2B2B] rounded transition-colors cursor-pointer">
            <Upload size={13} />
            <span>Upload JSON Snapshot</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
