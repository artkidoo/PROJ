import React, { useEffect, useRef, useState } from 'react';
import { WorkspaceLogo } from '../brand/LogoSystem';
import {
  LyricalLogoConcept,
  LogoConceptId,
} from '../brand/LogoConcepts';
import { LineArtRenderer } from '../common/LineArtRenderer';
import {
  BusinessCardData,
  BusinessCardTemplateId,
  deriveWorkspaceMonogram,
  generateBusinessCardPdf,
} from '../../utils/pdfGenerator';
import type { DocumentType, Workspace } from '../../types';
import {
  Check,
  Download,
  FileCheck2,
  Printer,
  RotateCw,
  Shapes,
  Sparkles,
} from 'lucide-react';

export interface CollateralSavePayload {
  type: DocumentType;
  title: string;
  referenceNo: string;
  bodyContent: string;
  recipientName: string;
  subject?: string;
}

export interface BusinessCardDesignerProps {
  workspace?: Workspace;
  onSaveRecord?: (doc: CollateralSavePayload) => Promise<void> | void;
}

function buildDefaultCardData(workspace?: Workspace): BusinessCardData {
  const wsName = workspace?.name?.trim() || workspace?.brand?.name?.trim() || 'Brand Workspace';
  const slug = wsName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'workspace';
  const websiteUrl = workspace?.brandProfile?.website?.trim() || `www.${slug}.com`;
  const contactEmail = workspace?.contactEmail?.trim() || `team@${slug}.com`;
  return {
    fullName: 'Jordan Vance',
    position: 'Creative Director',
    department: workspace?.brandProfile?.industry?.trim() || 'Brand & Production',
    phone: '+1 (555) 014-8820',
    email: contactEmail,
    website: websiteUrl.replace(/^https?:\/\//i, ''),
    socialHandle: `@${slug}`,
    showQr: true,
    qrContent: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
  };
}

export const BusinessCardDesigner: React.FC<BusinessCardDesignerProps> = ({
  workspace,
  onSaveRecord,
}) => {
  const [template, setTemplate] = useState<BusinessCardTemplateId>('executive_black');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [isPrintReadyMode, setIsPrintReadyMode] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [savingRecord, setSavingRecord] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const [cardLogoConcept, setCardLogoConcept] = useState<LogoConceptId>('classic');
  const [cardOrnament, setCardOrnament] = useState<'corner_brackets' | 'waveform' | 'studio_mic' | 'none'>('corner_brackets');

  const wsName = workspace?.name?.trim() || workspace?.brand?.name?.trim() || 'Brand Workspace';
  const wsId = workspace?.id || 'ws-brand';
  const wsSlug = wsName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'workspace';
  const wsDomain = (workspace?.brandProfile?.website?.trim() || `www.${wsSlug}.com`).replace(/^https?:\/\//i, '');
  const wsMonogram = deriveWorkspaceMonogram(wsName);
  const wsTagline =
    workspace?.brand?.tagline?.trim() ||
    workspace?.brandProfile?.industry?.trim() ||
    'Brand Identity & Creative Studio';

  const [formData, setFormData] = useState<BusinessCardData>(() => buildDefaultCardData(workspace));
  const lastWorkspaceIdRef = useRef<string | undefined>(workspace?.id);

  useEffect(() => {
    if (workspace?.id && workspace.id !== lastWorkspaceIdRef.current) {
      lastWorkspaceIdRef.current = workspace.id;
      setFormData(buildDefaultCardData(workspace));
    }
  }, [workspace]);

  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = (printReady: boolean) => {
    setIsDownloading(true);
    try {
      generateBusinessCardPdf(formData, template, printReady, {
        workspaceName: wsName,
        monogram: wsMonogram,
        tagline: wsTagline,
        website: wsDomain,
      });
    } catch (err) {
      console.error('PDF generation error', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToDocs = async () => {
    if (!onSaveRecord) return;
    setSavingRecord(true);
    try {
      await onSaveRecord({
        type: 'business_card',
        title: `Business Card Spec — ${formData.fullName}`,
        referenceNo: `BC-${Date.now().toString().slice(-6)}`,
        recipientName: formData.fullName,
        subject: `${wsName} Executive Business Card (${template})`,
        bodyContent: [
          `Workspace: ${wsName}`,
          `Template: ${template}`,
          `Print Bleed Mode: ${isPrintReadyMode ? '3mm Press Bleed' : 'Digital Standard'}`,
          `Full Name: ${formData.fullName}`,
          `Position: ${formData.position}`,
          `Department: ${formData.department}`,
          `Phone: ${formData.phone}`,
          `Email: ${formData.email}`,
          `Website: ${formData.website}`,
          `Social: ${formData.socialHandle}`,
        ].join('\n'),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSavingRecord(false);
    }
  };

  // High-resolution Canvas PNG render for digital preview
  const handleDownloadSidePng = (side: 'front' | 'back') => {
    const canvas = document.createElement('canvas');
    canvas.width = 1063;
    canvas.height = 638;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (side === 'front') {
      if (template === 'white_minimal') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 50, 963, 538);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsName.toUpperCase(), 90, 140);

        ctx.fillStyle = '#666666';
        ctx.font = '500 15px "JetBrains Mono", monospace';
        ctx.fillText(wsTagline.toUpperCase().slice(0, 36), 90, 175);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(formData.fullName, 90, 320);

        ctx.fillStyle = '#444444';
        ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(formData.position, 90, 365);

        ctx.fillStyle = '#888888';
        ctx.font = '600 16px "JetBrains Mono", monospace';
        ctx.fillText(formData.department.toUpperCase(), 90, 405);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#222222';
        ctx.font = '500 18px "JetBrains Mono", monospace';
        ctx.fillText(formData.phone, 963, 320);
        ctx.fillText(formData.email, 963, 365);
        ctx.fillText(formData.website, 963, 410);
        ctx.fillText(formData.socialHandle, 963, 455);

        ctx.fillStyle = '#000000';
        ctx.fillRect(873, 90, 90, 90);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 46px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsMonogram, 918, 153);
      } else if (template === 'monogram_signature') {
        ctx.fillStyle = '#141414';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 300, canvas.height);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(90, 140, 120, 120);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsMonogram, 150, 225);

        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillText((wsName.split(' ')[0] || wsName).toUpperCase(), 150, 330);
        ctx.fillText(wsName.split(' ')[1]?.toUpperCase() || 'STUDIO', 150, 355);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(formData.fullName, 360, 180);

        ctx.fillStyle = '#CCCCCC';
        ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(formData.position, 360, 225);

        ctx.fillStyle = '#888888';
        ctx.font = '600 16px "JetBrains Mono", monospace';
        ctx.fillText(formData.department.toUpperCase(), 360, 265);

        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(360, 310);
        ctx.lineTo(983, 310);
        ctx.stroke();

        ctx.fillStyle = '#AAAAAA';
        ctx.font = '500 18px "JetBrains Mono", monospace';
        ctx.fillText(`TEL:  ${formData.phone}`, 360, 370);
        ctx.fillText(`MAIL: ${formData.email}`, 360, 415);
        ctx.fillText(`WEB:  ${formData.website}`, 360, 460);
        ctx.fillText(`TAG:  ${formData.socialHandle}`, 360, 505);
      } else {
        ctx.fillStyle = '#0C0C0C';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#262626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, 240);
        ctx.lineTo(983, 240);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsName.toUpperCase(), 80, 130);

        ctx.fillStyle = '#888888';
        ctx.font = '500 16px "JetBrains Mono", monospace';
        ctx.fillText(wsTagline.toUpperCase().slice(0, 40), 80, 175);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(formData.fullName, 80, 340);

        ctx.fillStyle = '#CCCCCC';
        ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(formData.position, 80, 385);

        ctx.fillStyle = '#888888';
        ctx.font = '600 16px "JetBrains Mono", monospace';
        ctx.fillText(formData.department.toUpperCase(), 80, 425);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '500 18px "JetBrains Mono", monospace';
        ctx.fillText(formData.phone, 983, 340);
        ctx.fillText(formData.email, 983, 385);
        ctx.fillText(formData.website, 983, 430);
        ctx.fillText(formData.socialHandle, 983, 475);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.strokeRect(883, 80, 100, 100);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 50px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsMonogram, 933, 150);
      }
    } else {
      if (template === 'white_minimal') {
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#000000';
        ctx.fillRect(canvas.width / 2 - 90, canvas.height / 2 - 120, 180, 180);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 96px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsMonogram, canvas.width / 2, canvas.height / 2 - 5);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsName.toUpperCase(), canvas.width / 2, canvas.height / 2 + 120);

        ctx.fillStyle = '#777777';
        ctx.font = '500 15px "JetBrains Mono", monospace';
        ctx.fillText(wsDomain, canvas.width / 2, canvas.height / 2 + 155);
      } else if (template === 'monogram_signature') {
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#141414';
        ctx.font = 'bold 360px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsMonogram, canvas.width / 2, canvas.height / 2 + 120);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsName.toUpperCase(), canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = '#AAAAAA';
        ctx.font = '500 16px "JetBrains Mono", monospace';
        ctx.fillText(wsTagline.toUpperCase().slice(0, 44), canvas.width / 2, canvas.height / 2 + 25);
      } else {
        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 2;
        [160, 220, 280, 340].forEach(r => {
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
          ctx.stroke();
        });

        ctx.fillStyle = '#000000';
        ctx.fillRect(canvas.width / 2 - 80, canvas.height / 2 - 80, 160, 160);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 5;
        ctx.strokeRect(canvas.width / 2 - 80, canvas.height / 2 - 80, 160, 160);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 84px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsMonogram, canvas.width / 2, canvas.height / 2 + 28);

        ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(wsName.toUpperCase(), canvas.width / 2, canvas.height - 90);

        ctx.fillStyle = '#888888';
        ctx.font = '500 14px "JetBrains Mono", monospace';
        ctx.fillText(wsDomain.toUpperCase(), canvas.width / 2, canvas.height - 60);
      }
    }

    const a = document.createElement('a');
    a.download = `${wsSlug.toUpperCase()}_CARD_${template}_${side.toUpperCase()}_${formData.fullName.replace(/[^a-z0-9]/gi, '_')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <span>{wsName.toUpperCase()} COLLATERAL</span>
            <span>/</span>
            <span className="text-white font-semibold">BUSINESS CARD DESIGNER</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white font-mono uppercase">
            90 × 54 MM Business Card Studio
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Workspace-bound business cards with vector typography, front &amp; back previews, and print-ready 3mm bleed PDF export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSide(s => (s === 'front' ? 'back' : 'front'))}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded transition-colors"
          >
            <RotateCw size={13} />
            <span>Flip to {activeSide === 'front' ? 'Back' : 'Front'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintReadyMode(!isPrintReadyMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
              isPrintReadyMode
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-[#141414] text-neutral-300 border-[#2B2B2B] hover:text-white'
            }`}
          >
            <Printer size={13} />
            <span>{isPrintReadyMode ? 'Print Marks: ACTIVE (3mm Bleed)' : 'Digital Preview'}</span>
          </button>

          {onSaveRecord && (
            <button
              type="button"
              onClick={handleSaveToDocs}
              disabled={savingRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-emerald-400 border border-emerald-500/30 rounded transition-colors disabled:opacity-60"
            >
              {savedNotice ? <Check size={13} /> : <FileCheck2 size={13} />}
              <span>{savedNotice ? 'Saved to Docs' : savingRecord ? 'Saving...' : 'Save Spec to Docs'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDownloadPdf(isPrintReadyMode)}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Download PDF {isPrintReadyMode ? '(Print-Ready)' : '(Standard)'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">
                DESIGN TEMPLATE (12 STYLES)
              </label>
              <span className="text-[10px] font-mono text-white">
                {template.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {[
                { id: 'executive_black', name: 'Executive Black', sub: 'Noir Minimal' },
                { id: 'white_minimal', name: 'Clean White', sub: 'Editorial Border' },
                { id: 'monogram_signature', name: 'Monogram Sig', sub: 'Dual Split' },
                { id: 'luxury_black', name: 'Luxury Noir', sub: 'High Contrast' },
                { id: 'creative_agency', name: 'Creative Agency', sub: 'Hairline Grid' },
                { id: 'music_executive', name: 'Studio Exec', sub: 'Signature Suite' },
                { id: 'artist_manager', name: 'Client Partner', sub: 'Advisory Ops' },
                { id: 'producer', name: 'Lead Producer', sub: 'Studio Console' },
                { id: 'artist', name: 'Talent Edition', sub: 'Press Signature' },
                { id: 'minimal_monogram', name: 'Minimal Monogram', sub: 'Center Stamp' },
                { id: 'bold_typography', name: 'Bold Typography', sub: 'Swiss Grid' },
                { id: 'modern_corporate', name: 'Modern Corporate', sub: 'Architectural' },
              ].map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setTemplate(tpl.id as BusinessCardTemplateId)}
                  className={`p-2 rounded text-left border transition-all truncate ${
                    template === tpl.id
                      ? 'bg-[#1C1C1C] border-white text-white font-bold shadow'
                      : 'bg-[#121212] border-[#222222] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-[11px] truncate">{tpl.name}</div>
                  <div className="text-[9px] text-neutral-500 font-mono truncate">{tpl.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1C1C1C]">
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1 flex items-center gap-1">
                <Sparkles size={11} />
                <span>BRAND MARK</span>
              </label>
              <select
                value={cardLogoConcept}
                onChange={e => setCardLogoConcept(e.target.value as LogoConceptId)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-white font-mono"
              >
                <option value="classic">Architectural Monogram</option>
                <option value="mic_integrated">Studio Mic Integrated</option>
                <option value="soundwave_vinyl">Vinyl Soundwave</option>
                <option value="mic_negative">Negative Space Mic</option>
                <option value="label_seal">Studio Seal</option>
                <option value="bespoke_wordmark">Bespoke Wordmark</option>
                <option value="monoline_icon">Monoline Micro-Icon</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1 flex items-center gap-1">
                <Shapes size={11} />
                <span>LINE ART ORNAMENT</span>
              </label>
              <select
                value={cardOrnament}
                onChange={e => setCardOrnament(e.target.value as typeof cardOrnament)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-white font-mono"
              >
                <option value="corner_brackets">Corner Crosshairs</option>
                <option value="waveform">Acoustic Waveform</option>
                <option value="studio_mic">Condenser Studio Mic</option>
                <option value="none">None (Clean Minimal)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3.5 pt-2 border-t border-[#1C1C1C]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">FULL NAME *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">POSITION / TITLE *</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={e => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">DEPARTMENT</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">DIRECT PHONE</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">OFFICIAL EMAIL</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">WEBSITE</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">SOCIAL MEDIA HANDLE</label>
              <input
                type="text"
                value={formData.socialHandle}
                onChange={e => setFormData({ ...formData, socialHandle: e.target.value })}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div className="pt-3 border-t border-[#1C1C1C]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Print-Ready Bleed &amp; Crop Marks</div>
                  <div className="text-[10px] text-neutral-400">Add 3mm perimeter overflow for die-cut press</div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrintReadyMode}
                  onChange={e => setIsPrintReadyMode(e.target.checked)}
                  className="h-4 w-4 rounded accent-white bg-black border-neutral-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col items-center space-y-4">
          <div className="w-full p-6 sm:p-10 bg-[#080808] border border-[#1A1A1A] rounded-lg flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
            <div
              ref={cardRef}
              className={`w-full max-w-[500px] aspect-[1.666/1] rounded shadow-2xl relative transition-all duration-300 select-none overflow-hidden ${
                isPrintReadyMode ? 'p-3 border-2 border-dashed border-red-500/40' : ''
              } ${
                template === 'white_minimal'
                  ? 'bg-white text-black border border-neutral-300'
                  : template === 'monogram_signature'
                    ? 'bg-[#141414] text-white border border-[#262626]'
                    : 'bg-[#0C0C0C] text-white border border-[#262626]'
              }`}
            >
              {isPrintReadyMode && (
                <div className="absolute top-1 left-1 z-20 text-[9px] font-mono text-red-400 bg-black/80 px-1.5 py-0.5 rounded border border-red-500/30">
                  +3MM DIE-CUT BLEED ZONE
                </div>
              )}

              {isPrintReadyMode && (
                <div className="absolute inset-2 border border-emerald-500/30 border-dashed pointer-events-none rounded-[2px] z-30 flex items-start justify-end p-1">
                  <span className="text-[7.5px] font-mono text-emerald-400 bg-black/90 px-1 py-0.5 rounded">
                    SAFE COPY ZONE (3MM)
                  </span>
                </div>
              )}

              {cardOrnament === 'corner_brackets' && (
                <div className="absolute inset-0 pointer-events-none p-2.5 opacity-35 z-0">
                  <LineArtRenderer
                    itemOrId="edit_corner_brackets"
                    size="100%"
                    color={template === 'white_minimal' ? '#000000' : '#FFFFFF'}
                  />
                </div>
              )}
              {cardOrnament === 'waveform' && (
                <div className="absolute bottom-6 right-6 pointer-events-none opacity-25 z-0">
                  <LineArtRenderer
                    itemOrId="audio_waveform"
                    size={90}
                    color={template === 'white_minimal' ? '#000000' : '#FFFFFF'}
                  />
                </div>
              )}
              {cardOrnament === 'studio_mic' && (
                <div className="absolute top-4 right-16 pointer-events-none opacity-30 z-0">
                  <LineArtRenderer
                    itemOrId="mic_studio_condenser"
                    size={44}
                    color={template === 'white_minimal' ? '#000000' : '#FFFFFF'}
                  />
                </div>
              )}

              {activeSide === 'front' ? (
                <div className="w-full h-full p-6 flex flex-col justify-between relative z-10">
                  {template === 'white_minimal' ? (
                    <div className="w-full h-full border border-black p-4 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-base font-extrabold tracking-widest text-black uppercase">{wsName}</div>
                          <div className="text-[8px] font-mono text-neutral-600 uppercase tracking-wider">
                            {wsTagline}
                          </div>
                        </div>
                        <LyricalLogoConcept
                          conceptId={cardLogoConcept}
                          variant="monogram"
                          theme="monochrome-black"
                          size={32}
                        />
                      </div>

                      <div>
                        <div className="text-base font-bold text-black tracking-tight">{formData.fullName}</div>
                        <div className="text-xs text-neutral-700">{formData.position}</div>
                        <div className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                          {formData.department}
                        </div>
                      </div>

                      <div className="flex items-end justify-between text-[9px] font-mono text-neutral-800 border-t border-neutral-300 pt-2">
                        <div className="space-y-0.5">
                          <div>{formData.phone}</div>
                          <div>{formData.email}</div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className="text-black font-bold">{formData.website}</div>
                          <div>{formData.socialHandle}</div>
                        </div>
                      </div>
                    </div>
                  ) : template === 'monogram_signature' ? (
                    <div className="w-full h-full flex">
                      <div className="w-24 bg-black border-r border-[#262626] -m-6 p-4 flex flex-col items-center justify-between">
                        <WorkspaceLogo
                          workspaceId={wsId}
                          workspaceName={wsName}
                          height={40}
                          theme="monochrome-white"
                        />
                        <div className="text-[8px] font-mono font-bold tracking-widest text-white rotate-180 [writing-mode:vertical-rl] uppercase">
                          {wsName}
                        </div>
                      </div>

                      <div className="flex-1 pl-8 flex flex-col justify-between">
                        <div>
                          <div className="text-base font-extrabold text-white">{formData.fullName}</div>
                          <div className="text-xs text-neutral-300">{formData.position}</div>
                          <div className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                            {formData.department}
                          </div>
                        </div>

                        <div className="text-[9px] font-mono text-neutral-400 space-y-1 border-t border-[#222222] pt-2">
                          <div><span className="text-neutral-600">TEL:</span> {formData.phone}</div>
                          <div><span className="text-neutral-600">MAIL:</span> {formData.email}</div>
                          <div><span className="text-neutral-600">WEB:</span> <span className="text-white">{formData.website}</span></div>
                          <div><span className="text-neutral-600">TAG:</span> {formData.socialHandle}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between border-b border-[#222222] pb-3">
                        <div>
                          <div className="text-base font-extrabold tracking-widest text-white uppercase">{wsName}</div>
                          <div className="text-[8px] font-mono text-neutral-400 uppercase tracking-wider">
                            {wsTagline}
                          </div>
                        </div>
                        <LyricalLogoConcept
                          conceptId={cardLogoConcept}
                          variant="monogram"
                          theme="monochrome-white"
                          size={34}
                        />
                      </div>

                      <div>
                        <div className="text-base font-bold text-white tracking-tight">{formData.fullName}</div>
                        <div className="text-xs text-neutral-300 font-medium">{formData.position}</div>
                        <div className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">
                          {formData.department}
                        </div>
                      </div>

                      <div className="flex items-end justify-between text-[9px] font-mono text-neutral-400 border-t border-[#1C1C1C] pt-2">
                        <div className="space-y-0.5">
                          <div>{formData.phone}</div>
                          <div>{formData.email}</div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className="text-white font-semibold">{formData.website}</div>
                          <div>{formData.socialHandle}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-full p-6 flex flex-col items-center justify-center relative">
                  {template === 'white_minimal' ? (
                    <div className="w-full h-full border border-black p-4 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 bg-black text-white flex items-center justify-center font-bold text-2xl font-mono mb-2 uppercase">
                        {wsMonogram}
                      </div>
                      <div className="text-sm font-extrabold tracking-widest text-black uppercase">{wsName}</div>
                      <div className="text-[9px] font-mono text-neutral-600 mt-1">{wsDomain}</div>
                    </div>
                  ) : template === 'monogram_signature' ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <div className="absolute text-7xl font-black text-neutral-800/40 select-none pointer-events-none uppercase">
                        {wsMonogram}
                      </div>
                      <div className="relative z-10 text-center">
                        <div className="text-sm font-extrabold tracking-widest text-white uppercase">{wsName}</div>
                        <div className="text-[8px] font-mono text-neutral-400 mt-1 uppercase tracking-widest">
                          {wsTagline}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="w-48 h-48 rounded-full border border-neutral-600" />
                        <div className="w-36 h-36 rounded-full border border-neutral-600 absolute" />
                        <div className="w-24 h-24 rounded-full border border-neutral-600 absolute" />
                      </div>

                      <div className="relative z-10 flex flex-col items-center text-center">
                        <WorkspaceLogo
                          workspaceId={wsId}
                          workspaceName={wsName}
                          height={50}
                          theme="monochrome-white"
                        />
                        <div className="mt-3 text-sm font-extrabold tracking-widest text-white uppercase">{wsName}</div>
                        <div className="text-[8px] font-mono text-neutral-500 tracking-wider uppercase mt-0.5">
                          {wsDomain}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>90 × 54 MM STANDARD HORIZONTAL</span>
              </span>
              <span>·</span>
              <span>PREVIEWING: <span className="text-white font-semibold uppercase">{activeSide}</span></span>
              <span>·</span>
              <span>300 DPI RENDER RESOLUTION</span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleDownloadSidePng('front')}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded transition-colors"
            >
              <Download size={13} />
              <span>Download Front (300 DPI PNG)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadSidePng('back')}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded transition-colors"
            >
              <Download size={13} />
              <span>Download Back (300 DPI PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
