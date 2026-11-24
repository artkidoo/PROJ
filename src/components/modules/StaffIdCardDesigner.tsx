import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Check, Download, FileCheck2, RotateCw } from 'lucide-react';
import type { DocumentType, Workspace } from '../../types';
import { deriveWorkspaceMonogram } from '../../utils/pdfGenerator';

export interface StaffIdCardDesignerProps {
  workspace?: Workspace;
  onSaveRecord?: (doc: {
    type: DocumentType;
    title: string;
    referenceNo: string;
    bodyContent: string;
    recipientName: string;
    subject?: string;
  }) => Promise<void> | void;
}

export const StaffIdCardDesigner: React.FC<StaffIdCardDesignerProps> = ({
  workspace,
  onSaveRecord,
}) => {
  const wsName = workspace?.name?.trim() || workspace?.brand?.name?.trim() || 'Brand Workspace';
  const wsMonogram = deriveWorkspaceMonogram(wsName);
  const wsSlug = wsName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'workspace';
  const passPrefix = wsMonogram || 'ID';

  const [staffName, setStaffName] = useState('Jordan Vance');
  const [staffRole, setStaffRole] = useState('Operations Lead');
  const [staffId, setStaffId] = useState(`${passPrefix}-TEAM-001`);
  const [clearanceLevel, setClearanceLevel] = useState<
    'LEVEL 1 — EXECUTIVE ACCESS' | 'LEVEL 2 — PRODUCTION CONTROL' | 'LEVEL 3 — GENERAL WORKSPACE'
  >('LEVEL 1 — EXECUTIVE ACCESS');
  const [department, setDepartment] = useState(
    workspace?.brandProfile?.industry?.trim() || 'Brand & Studio Operations',
  );
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(
    `${new Date().getFullYear() + 2}-12-31`,
  );
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [savingRecord, setSavingRecord] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setStaffId(prev =>
      prev.endsWith('-TEAM-001') ? `${passPrefix}-TEAM-001` : prev,
    );
    if (workspace?.brandProfile?.industry) {
      setDepartment(workspace.brandProfile.industry);
    }
  }, [passPrefix, workspace?.id, workspace?.brandProfile?.industry]);

  // Standard CR80 PVC badge: 54 x 85.6 mm (portrait)
  const handleDownloadPdf = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [54, 85.6],
    });

    // FRONT
    pdf.setFillColor(10, 10, 10);
    pdf.rect(0, 0, 54, 85.6, 'F');

    pdf.setFillColor(30, 30, 30);
    pdf.roundedRect(21, 3, 12, 3, 1, 1, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.2);
    pdf.setTextColor(255, 255, 255);
    pdf.text(wsName.toUpperCase().slice(0, 22), 27, 13, { align: 'center' });

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(4);
    pdf.setTextColor(160, 160, 160);
    pdf.text('SECURE ACCESS CREDENTIAL', 27, 16, { align: 'center' });

    pdf.setFillColor(20, 20, 20);
    pdf.rect(13, 20, 28, 30, 'F');
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.4);
    pdf.rect(13, 20, 28, 30, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text(wsMonogram, 27, 37, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(staffName, 27, 55, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.setTextColor(200, 200, 200);
    pdf.text(staffRole, 27, 59, { align: 'center' });

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(staffId, 27, 65, { align: 'center' });

    pdf.setFillColor(255, 255, 255);
    pdf.rect(4, 70, 46, 5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(4.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text(clearanceLevel, 27, 73.5, { align: 'center' });

    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.3);
    for (let x = 8; x < 46; x += 1.2) {
      if ((x * 10) % 3 !== 0) {
        pdf.line(x, 78, x, 82);
      }
    }

    // BACK SIDE
    pdf.addPage([54, 85.6], 'portrait');
    pdf.setFillColor(8, 8, 8);
    pdf.rect(0, 0, 54, 85.6, 'F');

    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 8, 54, 12, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(3.8);
    pdf.setTextColor(180, 180, 180);
    const terms = [
      `This credential remains the property of ${wsName}.`,
      'Must be visibly worn during authorized site access.',
      'Loss or theft must be reported immediately to workspace admin.',
      `Contact: ${workspace?.contactEmail || `security@${wsSlug}.com`}`,
      `Valid: ${issueDate} to ${expiryDate}`,
    ];
    terms.forEach((t, i) => {
      pdf.text(t, 27, 28 + i * 5, { align: 'center' });
    });

    pdf.setFillColor(240, 240, 240);
    pdf.rect(6, 56, 42, 8, 'F');
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(4);
    pdf.setTextColor(80, 80, 80);
    pdf.text('AUTHORIZED CREDENTIAL HOLDER', 27, 61, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${wsName.toUpperCase().slice(0, 18)} ACCESS`, 27, 76, { align: 'center' });

    pdf.save(`${wsSlug.toUpperCase()}_STAFF_PASS_${staffId}.pdf`);
  };

  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 638;
    canvas.height = 1011;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeSide === 'front') {
      ctx.fillStyle = '#0D0D0D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 70, 30, 140, 36, 12);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(wsName.toUpperCase().slice(0, 20), canvas.width / 2, 140);

      ctx.fillStyle = '#888888';
      ctx.font = '600 16px "JetBrains Mono", monospace';
      ctx.fillText('SECURE ACCESS CREDENTIAL', canvas.width / 2, 175);

      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(canvas.width / 2 - 160, 220, 320, 350);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.strokeRect(canvas.width / 2 - 160, 220, 320, 350);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 96px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(wsMonogram, canvas.width / 2, 420);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(staffName, canvas.width / 2, 640);

      ctx.fillStyle = '#AAAAAA';
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(staffRole, canvas.width / 2, 680);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText(staffId, canvas.width / 2, 735);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(50, 780, canvas.width - 100, 60);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 17px "JetBrains Mono", monospace';
      ctx.fillText(clearanceLevel, canvas.width / 2, 818);

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      for (let x = 80; x < canvas.width - 80; x += 12) {
        if ((x * 7) % 5 !== 0) {
          ctx.beginPath();
          ctx.moveTo(x, 880);
          ctx.lineTo(x, 950);
          ctx.stroke();
        }
      }
    } else {
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 90, canvas.width, 140);

      ctx.fillStyle = '#CCCCCC';
      ctx.textAlign = 'center';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`This credential remains the property of ${wsName}.`, canvas.width / 2, 340);
      ctx.fillText('Must be visibly worn in authorized operational areas.', canvas.width / 2, 380);
      ctx.fillText('Report lost badges immediately to workspace admin.', canvas.width / 2, 420);

      ctx.fillStyle = '#888888';
      ctx.font = '500 16px "JetBrains Mono", monospace';
      ctx.fillText(`VALID: ${issueDate} TO ${expiryDate}`, canvas.width / 2, 500);

      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(60, 600, canvas.width - 120, 90);
      ctx.fillStyle = '#444444';
      ctx.font = '600 16px "JetBrains Mono", monospace';
      ctx.fillText('HOLDER AUTHORIZED SIGNATURE', canvas.width / 2, 652);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${wsName.toUpperCase().slice(0, 20)} ACCESS`, canvas.width / 2, 820);
    }

    const a = document.createElement('a');
    a.download = `${wsSlug.toUpperCase()}_STAFF_PASS_${staffId}_${activeSide.toUpperCase()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const handleSaveToDocs = async () => {
    if (!onSaveRecord) return;
    setSavingRecord(true);
    try {
      await onSaveRecord({
        type: 'official_letter',
        title: `Staff ID Credential Spec — ${staffName}`,
        referenceNo: staffId || `ID-${Date.now().toString().slice(-6)}`,
        recipientName: staffName,
        subject: `${wsName} CR80 Identification Badge Record`,
        bodyContent: [
          `Workspace: ${wsName}`,
          `Badge Holder: ${staffName}`,
          `Role: ${staffRole}`,
          `Department: ${department}`,
          `Pass ID: ${staffId}`,
          `Clearance: ${clearanceLevel}`,
          `Validity: ${issueDate} to ${expiryDate}`,
        ].join('\n'),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSavingRecord(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <span>{wsName.toUpperCase()} COLLATERAL</span>
            <span>/</span>
            <span className="text-white font-semibold">STAFF IDENTIFICATION BADGES</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white font-mono uppercase">
            CR80 PVC Access Credential Engine
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Standard 54 × 85.6 mm lanyard pass parameterized with workspace monogram, clearance tier, and validity window
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
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded transition-colors"
          >
            <Download size={13} />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Download CR80 PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-5 space-y-4">
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
            CREDENTIAL CONFIGURATION
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">TEAM MEMBER NAME</label>
              <input
                type="text"
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">ROLE / TITLE</label>
              <input
                type="text"
                value={staffRole}
                onChange={e => setStaffRole(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">PASS ID NO</label>
                <input
                  type="text"
                  value={staffId}
                  onChange={e => setStaffId(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">DEPARTMENT</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">CLEARANCE LEVEL</label>
              <select
                value={clearanceLevel}
                onChange={e => setClearanceLevel(e.target.value as typeof clearanceLevel)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              >
                <option value="LEVEL 1 — EXECUTIVE ACCESS">LEVEL 1 — EXECUTIVE ACCESS (All Facilities)</option>
                <option value="LEVEL 2 — PRODUCTION CONTROL">LEVEL 2 — PRODUCTION CONTROL (Studio Floors)</option>
                <option value="LEVEL 3 — GENERAL WORKSPACE">LEVEL 3 — GENERAL WORKSPACE (Offices)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">ISSUE DATE</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">EXPIRY DATE</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 bg-[#080808] border border-[#1A1A1A] rounded-lg min-h-[460px]">
          <div className="w-64 aspect-[54/85.6] bg-[#0E0E0E] border-2 border-[#262626] rounded-xl shadow-2xl p-5 flex flex-col justify-between relative overflow-hidden select-none">
            <div className="w-16 h-3 bg-[#1C1C1C] rounded-full mx-auto -mt-2 mb-2 border border-neutral-700" />

            {activeSide === 'front' ? (
              <>
                <div className="text-center">
                  <div className="text-sm font-extrabold tracking-widest text-white uppercase truncate">{wsName}</div>
                  <div className="text-[7px] font-mono text-neutral-500 uppercase tracking-wider">
                    SECURE ACCESS PASS
                  </div>
                </div>

                <div className="w-28 h-32 bg-black border border-white mx-auto flex flex-col items-center justify-center my-2 shadow-inner">
                  <div className="w-12 h-12 border border-white/70 flex items-center justify-center text-white font-black text-lg tracking-wider">
                    {wsMonogram}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs font-bold text-white">{staffName}</div>
                  <div className="text-[9px] text-neutral-400">{staffRole}</div>
                  <div className="text-[8px] font-mono text-neutral-300 mt-1 font-semibold">{staffId}</div>
                </div>

                <div className="bg-white text-black py-1 px-2 text-center text-[7px] font-mono font-bold tracking-tight rounded-sm">
                  {clearanceLevel}
                </div>

                <div className="h-6 flex items-center justify-center gap-1 opacity-70">
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1.5 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1.5 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                </div>
              </>
            ) : (
              <>
                <div className="w-full h-8 bg-black -mx-5 px-5 flex items-center justify-center text-[6px] font-mono text-neutral-600">
                  MAGNETIC STRIPE ENCODED
                </div>

                <div className="text-center text-[8px] text-neutral-400 space-y-1.5 my-auto">
                  <p>Property of {wsName}.</p>
                  <p>Must be worn in authorized areas.</p>
                  <p className="font-mono text-[7px] text-neutral-500">
                    VALID: {issueDate} TO {expiryDate}
                  </p>
                </div>

                <div className="bg-neutral-200 text-black py-2 px-3 text-center text-[7px] font-mono">
                  SECURITY SIGNATURE VERIFIED
                </div>

                <div className="text-center text-[8px] font-mono text-neutral-500 uppercase truncate">
                  {wsName} · ACCESS CONTROL
                </div>
              </>
            )}
          </div>

          <div className="mt-4 text-[10px] font-mono text-neutral-400">
            PREVIEWING: <span className="text-white font-semibold uppercase">{activeSide}</span> · CR80 STANDARD 54 × 85.6 MM
          </div>
        </div>
      </div>
    </div>
  );
};
