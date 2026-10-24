import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LyricalMonogram } from '../brand/LogoSystem';
import { jsPDF } from 'jspdf';
import { Download, Shield, Printer, RotateCw, UserCheck } from 'lucide-react';

export const StaffIdCardDesigner: React.FC = () => {
  const { currentRole } = useApp();

  const [staffName, setStaffName] = useState('Ojo Abdulkareem');
  const [staffRole, setStaffRole] = useState('Managing Director & Head of Label');
  const [staffId, setStaffId] = useState('LYR-EXEC-001');
  const [clearanceLevel, setClearanceLevel] = useState<'LEVEL 1 — EXECUTIVE OMNI' | 'LEVEL 2 — SOUND LAB CONTROL' | 'LEVEL 3 — GENERAL STUDIO'>('LEVEL 1 — EXECUTIVE OMNI');
  const [department, setDepartment] = useState('Executive & A&R Operations');
  const [issueDate, setIssueDate] = useState('2026-01-01');
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  // Standard CR80 PVC badge: 54 x 85.6 mm (portrait)
  const handleDownloadPdf = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [54, 85.6]
    });

    // FRONT
    pdf.setFillColor(10, 10, 10);
    pdf.rect(0, 0, 54, 85.6, 'F');

    // Lanyard slot punch hole indicator
    pdf.setFillColor(30, 30, 30);
    pdf.roundedRect(21, 3, 12, 3, 1, 1, 'F');

    // Header brand
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('LYRICAL ENT', 27, 13, { align: 'center' });

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(4);
    pdf.setTextColor(160, 160, 160);
    pdf.text('SECURE STUDIO PASS', 27, 16, { align: 'center' });

    // Photo Box Placeholder
    pdf.setFillColor(20, 20, 20);
    pdf.rect(13, 20, 28, 30, 'F');
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.4);
    pdf.rect(13, 20, 28, 30, 'S');

    // Monogram inside photo box
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text('LE', 27, 37, { align: 'center' });

    // Staff Info
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

    // Clearance level banner
    pdf.setFillColor(255, 255, 255);
    pdf.rect(4, 70, 46, 5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(4.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text(clearanceLevel, 27, 73.5, { align: 'center' });

    // Barcode simulated lines
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

    // Magnetic stripe
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 8, 54, 12, 'F');

    // Terms
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(3.8);
    pdf.setTextColor(180, 180, 180);
    const terms = [
      'This credential remains the property of LYRICAL ENT LLC.',
      'Must be visibly worn at all times within Sound Lab facilities.',
      'Loss or theft must be reported immediately to Studio Security.',
      'London: +44 (0) 20 7946 0921 | Los Angeles: +1 310 555 0192',
      `Valid: ${issueDate} to ${expiryDate}`
    ];
    terms.forEach((t, i) => {
      pdf.text(t, 27, 28 + i * 5, { align: 'center' });
    });

    // Signature strip
    pdf.setFillColor(240, 240, 240);
    pdf.rect(6, 56, 42, 8, 'F');
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(4);
    pdf.setTextColor(80, 80, 80);
    pdf.text('AUTHORIZED SECURITY HOLDER SIGNATURE', 27, 61, { align: 'center' });

    // Bottom seal
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(255, 255, 255);
    pdf.text('LYRICAL ENT SECURITY', 27, 76, { align: 'center' });

    pdf.save(`LYRICAL_STAFF_PASS_${staffId}.pdf`);
  };

  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    // 54 x 85.6 mm at 300 DPI is approx 638 x 1011 px
    canvas.width = 638;
    canvas.height = 1011;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeSide === 'front') {
      ctx.fillStyle = '#0D0D0D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Slot punch
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 70, 30, 140, 36, 12);
      ctx.fill();

      // Brand
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('LYRICAL ENT', canvas.width / 2, 140);

      ctx.fillStyle = '#888888';
      ctx.font = '600 16px "JetBrains Mono", monospace';
      ctx.fillText('SECURE STUDIO PASS', canvas.width / 2, 175);

      // Photo avatar box
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(canvas.width / 2 - 160, 220, 320, 350);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.strokeRect(canvas.width / 2 - 160, 220, 320, 350);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 96px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('LE', canvas.width / 2, 420);

      // Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(staffName, canvas.width / 2, 640);

      ctx.fillStyle = '#AAAAAA';
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(staffRole, canvas.width / 2, 680);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText(staffId, canvas.width / 2, 735);

      // Clearance banner
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(50, 780, canvas.width - 100, 60);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.fillText(clearanceLevel, canvas.width / 2, 818);

      // Barcode
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
      // BACK
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Magnetic strip
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 90, canvas.width, 140);

      ctx.fillStyle = '#CCCCCC';
      ctx.textAlign = 'center';
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('This credential remains the property of LYRICAL ENT LLC.', canvas.width / 2, 340);
      ctx.fillText('Must be visibly worn within Sound Lab facilities at all times.', canvas.width / 2, 380);
      ctx.fillText('Loss or theft must be reported immediately to Studio Security.', canvas.width / 2, 420);

      ctx.fillStyle = '#888888';
      ctx.font = '500 16px "JetBrains Mono", monospace';
      ctx.fillText(`VALID: ${issueDate} TO ${expiryDate}`, canvas.width / 2, 500);

      // Signature strip
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(60, 600, canvas.width - 120, 90);
      ctx.fillStyle = '#444444';
      ctx.font = '600 16px "JetBrains Mono", monospace';
      ctx.fillText('SECURITY HOLDER SIGNATURE', canvas.width / 2, 652);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('LYRICAL ENT SECURITY', canvas.width / 2, 820);
    }

    const a = document.createElement('a');
    a.download = `LYRICAL_STAFF_PASS_${staffId}_${activeSide.toUpperCase()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <span>CORPORATE COLLATERAL</span>
            <span>/</span>
            <span className="text-white font-semibold">STAFF IDENTIFICATION BADGES</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white font-mono uppercase">
            Official CR80 PVC Studio Access Credential
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Standard 54 × 85.6 mm lanyard security pass with barcode, sound lab clearance tiers, and magnetic stripe representation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSide(s => s === 'front' ? 'back' : 'front')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded transition-colors"
          >
            <RotateCw size={13} />
            <span>Flip to {activeSide === 'front' ? 'Back' : 'Front'}</span>
          </button>

          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded transition-colors"
          >
            <Download size={13} />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Download CR80 PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form controls (5 cols) */}
        <div className="lg:col-span-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-5 space-y-4">
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
            CREDENTIAL CONFIGURATION
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">STAFF MEMBER NAME</label>
              <input
                type="text"
                value={staffName}
                onChange={e => setStaffName(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">EXECUTIVE ROLE</label>
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
                onChange={e => setClearanceLevel(e.target.value as any)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              >
                <option value="LEVEL 1 — EXECUTIVE OMNI">LEVEL 1 — EXECUTIVE OMNI (All Facilities)</option>
                <option value="LEVEL 2 — SOUND LAB CONTROL">LEVEL 2 — SOUND LAB CONTROL (Studios A &amp; B)</option>
                <option value="LEVEL 3 — GENERAL STUDIO">LEVEL 3 — GENERAL STUDIO (A&amp;R / Offices)</option>
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

        {/* Live Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 bg-[#080808] border border-[#1A1A1A] rounded-lg min-h-[460px]">
          {/* Badge Frame (CR80 aspect ratio 54:85.6 = 1:1.585) */}
          <div className="w-64 aspect-[54/85.6] bg-[#0E0E0E] border-2 border-[#262626] rounded-xl shadow-2xl p-5 flex flex-col justify-between relative overflow-hidden select-none">
            {/* Slot Punch */}
            <div className="w-16 h-3 bg-[#1C1C1C] rounded-full mx-auto -mt-2 mb-2 border border-neutral-700" />

            {activeSide === 'front' ? (
              <>
                <div className="text-center">
                  <div className="text-sm font-extrabold tracking-widest text-white">LYRICAL ENT</div>
                  <div className="text-[7px] font-mono text-neutral-500 uppercase tracking-wider">
                    SECURE STUDIO PASS
                  </div>
                </div>

                {/* Avatar Box */}
                <div className="w-28 h-32 bg-black border border-white mx-auto flex flex-col items-center justify-center my-2 shadow-inner">
                  <LyricalMonogram size={44} framed={true} theme="monochrome-white" />
                </div>

                <div className="text-center">
                  <div className="text-xs font-bold text-white">{staffName}</div>
                  <div className="text-[9px] text-neutral-400">{staffRole}</div>
                  <div className="text-[8px] font-mono text-neutral-300 mt-1 font-semibold">{staffId}</div>
                </div>

                {/* Clearance banner */}
                <div className="bg-white text-black py-1 px-2 text-center text-[7px] font-mono font-bold tracking-tight rounded-sm">
                  {clearanceLevel}
                </div>

                {/* Simulated Barcode */}
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
                {/* Magnetic Stripe */}
                <div className="w-full h-8 bg-black -mx-5 px-5 flex items-center justify-center text-[6px] font-mono text-neutral-600">
                  MAGNETIC STRIPE ENCODED
                </div>

                <div className="text-center text-[8px] text-neutral-400 space-y-1.5 my-auto">
                  <p>Property of LYRICAL ENT LLC.</p>
                  <p>Must be worn in Sound Lab facilities.</p>
                  <p className="font-mono text-[7px] text-neutral-500">
                    VALID: {issueDate} TO {expiryDate}
                  </p>
                </div>

                <div className="bg-neutral-200 text-black py-2 px-3 text-center text-[7px] font-mono">
                  SECURITY SIGNATURE VERIFIED
                </div>

                <div className="text-center text-[8px] font-mono text-neutral-500">
                  LYRICAL ENT · ACCESS CONTROL
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
