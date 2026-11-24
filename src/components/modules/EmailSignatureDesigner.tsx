import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, FileCheck2, Sparkles } from 'lucide-react';
import type { DocumentType, Workspace } from '../../types';
import { deriveWorkspaceMonogram } from '../../utils/pdfGenerator';

export interface EmailSignatureDesignerProps {
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

function escapeHtml(input: string): string {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDefaults(workspace?: Workspace) {
  const wsName = workspace?.name?.trim() || workspace?.brand?.name?.trim() || 'Brand Workspace';
  const slug = wsName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'workspace';
  const domain = (workspace?.brandProfile?.website?.trim() || `www.${slug}.com`).replace(/^https?:\/\//i, '');
  return {
    fullName: 'Jordan Vance',
    position: 'Brand Director',
    department: workspace?.brandProfile?.industry?.trim() || 'Creative Operations',
    phone: '+1 (555) 014-8820',
    email: workspace?.contactEmail?.trim() || `hello@${slug}.com`,
    website: domain,
    address: 'Studio Operations · Global',
  };
}

export const EmailSignatureDesigner: React.FC<EmailSignatureDesignerProps> = ({
  workspace,
  onSaveRecord,
}) => {
  const wsName = workspace?.name?.trim() || workspace?.brand?.name?.trim() || 'Brand Workspace';
  const wsMonogram = deriveWorkspaceMonogram(wsName);
  const wsSlug = wsName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'workspace';
  const defaults = buildDefaults(workspace);

  const [fullName, setFullName] = useState(defaults.fullName);
  const [position, setPosition] = useState(defaults.position);
  const [department, setDepartment] = useState(defaults.department);
  const [phone, setPhone] = useState(defaults.phone);
  const [email, setEmail] = useState(defaults.email);
  const [website, setWebsite] = useState(defaults.website);
  const [address, setAddress] = useState(defaults.address);
  const [confidentialityNotice, setConfidentialityNotice] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const lastWorkspaceIdRef = useRef<string | undefined>(workspace?.id);
  useEffect(() => {
    if (workspace?.id && workspace.id !== lastWorkspaceIdRef.current) {
      lastWorkspaceIdRef.current = workspace.id;
      const next = buildDefaults(workspace);
      setDepartment(next.department);
      setEmail(next.email);
      setWebsite(next.website);
    }
  }, [workspace]);

  const cleanHrefHost = website.replace(/^https?:\/\//i, '').replace(/["'<>\s]/g, '');

  const getSignatureHtml = () => {
    const safeWsName = escapeHtml(wsName);
    const safeMonogram = escapeHtml(wsMonogram);
    const safeFullName = escapeHtml(fullName);
    const safePosition = escapeHtml(position);
    const safeDepartment = escapeHtml(department);
    const safePhone = escapeHtml(phone);
    const safeEmail = escapeHtml(email);
    const safeWebsite = escapeHtml(website);
    const safeAddress = escapeHtml(address);
    const safeTelHref = escapeHtml(phone.replace(/[^+\d]/g, ''));

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;font-size:13px;line-height:1.45;max-width:550px;">
  <tr>
    <td style="padding-right:18px;border-right:2px solid #000000;vertical-align:middle;text-align:center;">
      <div style="background-color:#000000;color:#FFFFFF;width:48px;height:48px;font-weight:900;font-size:16px;letter-spacing:1px;line-height:48px;font-family:monospace;text-align:center;margin:0 auto;">${safeMonogram}</div>
      <div style="font-size:8px;font-family:monospace;font-weight:bold;color:#000000;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">${safeWsName.slice(0, 14)}</div>
    </td>
    <td style="padding-left:18px;vertical-align:middle;">
      <div style="font-size:16px;font-weight:bold;color:#000000;letter-spacing:-0.2px;">${safeFullName}</div>
      <div style="font-size:12px;font-weight:600;color:#444444;margin-top:1px;">${safePosition}</div>
      <div style="font-size:10px;font-family:monospace;color:#777777;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${safeDepartment}</div>
      <div style="font-size:11px;font-family:monospace;color:#555555;line-height:1.6;">
        <span style="color:#888888;">TEL:</span> <a href="tel:${safeTelHref}" style="color:#111111;text-decoration:none;">${safePhone}</a> &nbsp;|&nbsp;
        <span style="color:#888888;">EMAIL:</span> <a href="mailto:${safeEmail}" style="color:#111111;text-decoration:none;">${safeEmail}</a>
      </div>
      <div style="font-size:11px;font-family:monospace;color:#555555;">
        <span style="color:#888888;">WEB:</span> <a href="https://${escapeHtml(cleanHrefHost)}" style="color:#000000;font-weight:bold;text-decoration:none;">${safeWebsite}</a> &nbsp;|&nbsp;
        <span style="color:#888888;">LOC:</span> ${safeAddress}
      </div>
      ${confidentialityNotice ? `
      <div style="font-size:9px;color:#999999;border-top:1px solid #E5E5E5;padding-top:6px;margin-top:8px;line-height:1.4;font-family:sans-serif;">
        NOTICE: This transmission contains confidential proprietary information belonging to ${safeWsName}. If you have received this message in error, please immediately delete and notify the sender.
      </div>` : ''}
    </td>
  </tr>
</table>`;
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(getSignatureHtml());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadHtmlFile = () => {
    const html = getSignatureHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wsSlug.toUpperCase()}_EMAIL_SIGNATURE_${fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToDocs = async () => {
    if (!onSaveRecord) return;
    setSavingRecord(true);
    try {
      await onSaveRecord({
        type: 'email_signature',
        title: `Email Signature Spec — ${fullName}`,
        referenceNo: `SIG-${Date.now().toString().slice(-6)}`,
        recipientName: fullName,
        subject: `${wsName} HTML Email Signature (${email})`,
        bodyContent: getSignatureHtml(),
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
            <span className="text-white font-semibold">EMAIL SIGNATURE GENERATOR</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white font-mono uppercase">
            Official HTML Email Signature
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Cross-client email signature parameterized with {wsName} monogram and inline styles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-white text-black hover:bg-neutral-200 rounded font-semibold transition-colors"
          >
            {copied ? <Check size={13} className="text-black" /> : <Copy size={13} />}
            <span>{copied ? 'HTML Copied!' : 'Copy Raw HTML'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadHtmlFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded transition-colors"
          >
            <Download size={13} />
            <span>Download .HTML</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg p-5 space-y-4">
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2">
            SIGNATORY DETAILS
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">FULL NAME</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">JOB TITLE / POSITION</label>
              <input
                type="text"
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">DEPARTMENT / DIVISION</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">PHONE</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">OFFICIAL WEBSITE</label>
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">LOCATION</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-[#141414] border border-[#242424] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div className="pt-2 border-t border-[#1C1C1C]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confidentialityNotice}
                  onChange={e => setConfidentialityNotice(e.target.checked)}
                  className="h-4 w-4 rounded accent-white bg-black border-neutral-700"
                />
                <span className="text-xs text-neutral-300">Include Legal Confidentiality Notice</span>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 bg-white rounded-lg shadow-xl border border-neutral-200">
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest border-b border-neutral-200 pb-2 mb-4">
              EMAIL CLIENT PREVIEW
            </div>

            <div className="flex items-start gap-4 text-[#111111]" style={{ maxWidth: 550 }}>
              <div className="pr-4 border-r-2 border-black text-center shrink-0">
                <div className="w-12 h-12 bg-black text-white font-black font-mono text-base flex items-center justify-center mx-auto">
                  {wsMonogram}
                </div>
                <div className="text-[8px] font-mono font-bold text-black mt-1 tracking-wider uppercase max-w-[68px] truncate">
                  {wsName}
                </div>
              </div>
              <div className="min-w-0 text-[13px] leading-snug">
                <div className="text-base font-bold text-black">{fullName}</div>
                <div className="text-xs font-semibold text-neutral-700 mt-0.5">{position}</div>
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1.5">
                  {department}
                </div>
                <div className="text-[11px] font-mono text-neutral-700">
                  <span className="text-neutral-400">TEL:</span> {phone} &nbsp;|&nbsp;{' '}
                  <span className="text-neutral-400">EMAIL:</span> {email}
                </div>
                <div className="text-[11px] font-mono text-neutral-700">
                  <span className="text-neutral-400">WEB:</span>{' '}
                  <span className="text-black font-bold">{website}</span> &nbsp;|&nbsp;{' '}
                  <span className="text-neutral-400">LOC:</span> {address}
                </div>
                {confidentialityNotice && (
                  <div className="text-[9px] text-neutral-400 border-t border-neutral-200 pt-1.5 mt-2 leading-relaxed">
                    NOTICE: This transmission contains confidential proprietary information belonging to {wsName}. If you
                    have received this message in error, please immediately delete and notify the sender.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg text-xs font-mono text-neutral-400 space-y-2">
            <div className="text-white font-semibold flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Installation Instructions for Gmail &amp; Apple Mail:</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-neutral-400 text-[11px]">
              <li>Click <strong>&quot;Copy Raw HTML&quot;</strong> or download the standalone `.html` file.</li>
              <li>Open your email client settings (e.g. Gmail Settings &gt; General &gt; Signature).</li>
              <li>Paste into the signature box. Inline styles and workspace seal will render directly.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
