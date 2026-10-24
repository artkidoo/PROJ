import React, { useState } from 'react';
import { Copy, Check, Download, Mail, ExternalLink, Sparkles } from 'lucide-react';
import { LyricalMonogram } from '../brand/LogoSystem';

export const EmailSignatureDesigner: React.FC = () => {
  const [fullName, setFullName] = useState('Ojo Abdulkareem');
  const [position, setPosition] = useState('Managing Director & Head of Label');
  const [department, setDepartment] = useState('Executive Management & A&R Operations');
  const [phone, setPhone] = useState('+44 (0) 20 7946 0921');
  const [email, setEmail] = useState('kareem@lyricalent.com');
  const [website, setWebsite] = useState('www.lyricalent.com');
  const [address, setAddress] = useState('London Sound Labs · 42 Bermondsey St, London SE1 3UD');
  const [confidentialityNotice, setConfidentialityNotice] = useState(true);
  const [copied, setCopied] = useState(false);

  const getSignatureHtml = () => {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;font-size:13px;line-height:1.45;max-width:550px;">
  <tr>
    <td style="padding-right:18px;border-right:2px solid #000000;vertical-align:middle;text-align:center;">
      <div style="background-color:#000000;color:#FFFFFF;width:48px;height:48px;font-weight:900;font-size:16px;letter-spacing:1px;line-height:48px;font-family:monospace;text-align:center;">LE</div>
      <div style="font-size:8px;font-family:monospace;font-weight:bold;color:#000000;margin-top:4px;letter-spacing:1px;">LYRICAL</div>
    </td>
    <td style="padding-left:18px;vertical-align:middle;">
      <div style="font-size:16px;font-weight:bold;color:#000000;letter-spacing:-0.2px;">${fullName}</div>
      <div style="font-size:12px;font-weight:600;color:#444444;margin-top:1px;">${position}</div>
      <div style="font-size:10px;font-family:monospace;color:#777777;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${department}</div>
      <div style="font-size:11px;font-family:monospace;color:#555555;line-height:1.6;">
        <span style="color:#888888;">TEL:</span> <a href="tel:${phone.replace(/\s+/g, '')}" style="color:#111111;text-decoration:none;">${phone}</a> &nbsp;|&nbsp; 
        <span style="color:#888888;">EMAIL:</span> <a href="mailto:${email}" style="color:#111111;text-decoration:none;">${email}</a>
      </div>
      <div style="font-size:11px;font-family:monospace;color:#555555;">
        <span style="color:#888888;">WEB:</span> <a href="https://${website}" style="color:#000000;font-weight:bold;text-decoration:none;">${website}</a> &nbsp;|&nbsp; 
        <span style="color:#888888;">LOC:</span> ${address}
      </div>
      ${confidentialityNotice ? `
      <div style="font-size:9px;color:#999999;border-top:1px solid #E5E5E5;padding-top:6px;margin-top:8px;line-height:1.4;font-family:sans-serif;">
        NOTICE: This transmission contains confidential proprietary information belonging to LYRICAL ENT LLC. If you have received this message in error, please immediately delete and notify the sender.
      </div>` : ''}
    </td>
  </tr>
</table>`;
  };

  const handleCopyHtml = () => {
    const html = getSignatureHtml();
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadHtmlFile = () => {
    const html = getSignatureHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LYRICAL_EMAIL_SIGNATURE_${fullName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
            <span>CORPORATE COLLATERAL</span>
            <span>/</span>
            <span className="text-white font-semibold">EMAIL SIGNATURE GENERATOR</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white font-mono uppercase">
            Official HTML Email Signature
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Cross-client email signature compatible with Gmail, Apple Mail, Outlook, and mobile clients with pure inline styles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-white text-black hover:bg-neutral-200 rounded font-semibold transition-colors"
          >
            {copied ? <Check size={13} className="text-black" /> : <Copy size={13} />}
            <span>{copied ? 'HTML Copied!' : 'Copy Raw HTML'}</span>
          </button>

          <button
            onClick={handleDownloadHtmlFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2B2B2B] rounded transition-colors"
          >
            <Download size={13} />
            <span>Download .HTML</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Form (5 cols) */}
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
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">STUDIO LOCATION</label>
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

        {/* Live Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 bg-white rounded-lg shadow-xl border border-neutral-200">
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest border-b border-neutral-200 pb-2 mb-4">
              EMAIL CLIENT PREVIEW
            </div>

            {/* Rendered HTML */}
            <div dangerouslySetInnerHTML={{ __html: getSignatureHtml() }} />
          </div>

          <div className="p-4 bg-[#0E0E0E] border border-[#1E1E1E] rounded-lg text-xs font-mono text-neutral-400 space-y-2">
            <div className="text-white font-semibold flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Installation Instructions for Gmail &amp; Apple Mail:</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-neutral-400 text-[11px]">
              <li>Click <strong>&quot;Copy Raw HTML&quot;</strong> or select the preview box above.</li>
              <li>Open your email client settings (e.g. Gmail Settings &gt; General &gt; Signature).</li>
              <li>Paste directly into the signature rich-text box. The inline styles and logo seal will render immediately.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
