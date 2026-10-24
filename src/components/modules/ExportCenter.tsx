import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MusicRelease } from '../../types';
import { 
  triggerSvgDownload, 
  triggerPngDownload 
} from '../brand/LogoSystem';
import { generateMasterBrandZip, ZipOptions } from '../../utils/zipGenerator';
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
  BookOpen
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
    activeWorkspace
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
