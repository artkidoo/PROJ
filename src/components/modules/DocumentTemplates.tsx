import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileCheck2, 
  AlertTriangle, 
  Plus, 
  Printer, 
  Copy, 
  Check, 
  ChevronRight, 
  Percent, 
  FileText,
  ShieldAlert
} from 'lucide-react';

interface TemplateDef {
  id: string;
  name: string;
  category: 'Agreements & Splits' | 'Artist & A&R' | 'Production & Video' | 'Operations & Budget';
  description: string;
  isLegalDraft: boolean;
  defaultTitle: string;
  defaultBody: string;
}

const TEMPLATES: TemplateDef[] = [
  {
    id: 'tpl-split',
    name: 'Songwriter Split Sheet Agreement',
    category: 'Agreements & Splits',
    description: 'Contractual ownership split agreement between all contributing composers, top-line lyricists, and music producers for a master composition.',
    isLegalDraft: true,
    defaultTitle: 'Binding Songwriter & Producer Split Sheet',
    defaultBody: `SONGWRITER & PRODUCER SPLIT SHEET

Song Title: [Insert Title]
ISRC: [Insert ISRC]
Recording Artist: [Insert Artist]
Record Label: LYRICAL ENT LLC
Date of Execution: [Insert Date]

1. COMPOSITION OWNERSHIP SHARES:
The undersigned parties hereby certify and agree that the musical composition described above was created collaboratively, and all worldwide publishing rights, performance royalties, and mechanical shares are allocated as follows:

- Contributor 1 (Lyricist / Performer): 50.00% Share | PRO: BMI / ASCAP | IPI: [Number]
- Contributor 2 (Lead Producer / Composer): 35.00% Share | PRO: PRS / ASCAP | IPI: [Number]
- Contributor 3 (Arranger / Sound Designer): 15.00% Share | PRO: SOCAN | IPI: [Number]
Total Composition Shares: 100.00%

2. WARRANTIES & INDEMNIFICATION:
Each party warrants that their respective contributions are entirely original and do not infringe upon any third-party copyrights or rights of publicity. No unauthorized samples or uncleared stems are contained in the master recording.`
  },
  {
    id: 'tpl-producer',
    name: 'Master Producer Credit & Fee Agreement',
    category: 'Agreements & Splits',
    description: 'Standard producer engagement memorandum establishing upfront production fees, master points (points on wholesale), and statutory mechanical terms.',
    isLegalDraft: true,
    defaultTitle: 'Producer Engagement Memorandum',
    defaultBody: `LYRICAL ENT LLC — PRODUCER ENGAGEMENT MEMORANDUM

Date: [Insert Date]
Producer: [Insert Producer Legal Name] (p/k/a "[Moniker]")
Artist: [Insert Artist Name]
Label: LYRICAL ENT LLC

1. ENGAGEMENT:
Label hereby engages Producer to render exclusive production, beat composition, and stem engineering services for the master recording entitled "[Insert Track Title]".

2. PRODUCTION ADVANCE & COMPENSATION:
Label agrees to pay Producer a non-returnable production fee advance in the amount of $[Insert Amount] USD, payable 50% upon commencement of recording and 50% upon final master stem acceptance by LYRICAL ENT.

3. MASTER ROYALTY POINTS:
Producer shall be entitled to receive three percent (3.00%) of wholesale net receipts ("Producer Points") derived from digital downloads and interactive streaming after full recoupment of recording costs.`
  },
  {
    id: 'tpl-video-release',
    name: 'Music Video Actor & Location Release Form',
    category: 'Production & Video',
    description: 'Appearance release giving LYRICAL ENT worldwide, perpetual rights to broadcast the audiovisual performance across YouTube, Vevo, film, and television.',
    isLegalDraft: true,
    defaultTitle: 'Music Video Appearance and Likeness Release',
    defaultBody: `LYRICAL ENT LLC — AUDIOTAPE & VIDEO APPEARANCE RELEASE

Production Title: "[Insert Video Title]"
Artist: [Insert Artist Name]
Director: [Insert Director Name]
Filming Date & Location: [Insert Date / Studio]

For good and valuable consideration received, the undersigned Participant irrevocably grants to LYRICAL ENT LLC, its successors and licensees, the unrestricted worldwide right to record, photograph, edit, and publicly broadcast Participant's image, likeness, voice, and performance in connection with the music video production specified above in any and all media now known or hereafter devised in perpetuity.`
  },
  {
    id: 'tpl-auth',
    name: 'Master Release Authorization Agreement',
    category: 'Agreements & Splits',
    description: 'Formal sign-off authorizing LYRICAL ENT to ingest, manufacture, and distribute sound recordings to digital service providers (DSPs) worldwide.',
    isLegalDraft: true,
    defaultTitle: 'Master Release Authorization Notice',
    defaultBody: `LYRICAL ENT LLC — MASTER RELEASE AUTHORIZATION

Release Title: "[Insert Project Title]"
Catalog ID: [Insert Catalog Number]
Planned Street Date: [Insert Date]

The undersigned Artist and authorized Label Representative hereby formally authorize the global delivery of the mastered audio files and approved artwork for digital ingestion into Spotify, Apple Music, YouTube Music, Amazon Music, Tidal, and physical vinyl pressing facilities under exclusive license to LYRICAL ENT LLC.`
  },
  {
    id: 'tpl-onboard',
    name: 'Artist Onboarding & Legal Intake Sheet',
    category: 'Artist & A&R',
    description: 'Detailed intake dossier capturing legal names, tax IDs, passport copies, performing rights affiliations (BMI/ASCAP/PRS), and publishing administrator details.',
    isLegalDraft: false,
    defaultTitle: 'LYRICAL ENT Artist Onboarding Dossier',
    defaultBody: `ARTIST ONBOARDING & LEGAL INTAKE QUESTIONNAIRE

1. ARTIST PARTICULARS:
- Legal Full Name:
- Stage Name / Moniker:
- Date of Birth & Nationality:
- Government Tax ID / SSN / National Insurance:
- Permanent Residential Address:
- Direct Mobile & Emergency Contact:

2. PUBLISHING & RIGHTS DATA:
- Performing Rights Organization (PRO): BMI / ASCAP / PRS / GEMA / Other:
- PRO CAE/IPI Number:
- Publishing Company Name:
- SoundExchange Registrant ID:`
  },
  {
    id: 'tpl-budget',
    name: 'Album & EP Project Budget Template',
    category: 'Operations & Budget',
    description: 'Itemized financial cost model breaking down studio time, mixing engineers, mastering suites, graphic design, session musicians, and promo.',
    isLegalDraft: false,
    defaultTitle: 'Production Master Budget & Expenditure Model',
    defaultBody: `LYRICAL ENT PRODUCTION BUDGET BREAKDOWN

Project: [Album / EP Title]
Artist: [Artist Name]
Total Approved Cap: $25,000.00 USD

EXPENDITURE ALLOCATION:
1. Studio Tracking & Live Instrumentation: $8,000.00
2. Stem Mixing & Vocal Tuning: $4,500.00
3. Master Engineering & Dolby Atmos Pass: $2,500.00
4. Photography & 3000px Vinyl Packaging Design: $3,500.00
5. Audiovisual Visualizers & Premiere Film: $4,500.00
6. Legal Review & Copyright Filing Contingency: $2,000.00`
  }
];

export const DocumentTemplates: React.FC = () => {
  const { addDocument, setActiveModule } = useApp();
  const [selectedTpl, setSelectedTpl] = useState<TemplateDef>(TEMPLATES[0]);
  const [copied, setCopied] = useState(false);

  // Split sheet calculator helper
  const [splits, setSplits] = useState([
    { name: 'Lead Vocalist / Lyricist', role: 'Lyrics & Top-line', percent: 50 },
    { name: 'Music Producer', role: 'Beat & Sound Design', percent: 35 },
    { name: 'Session Composer', role: 'Keys & Horns', percent: 15 }
  ]);

  const totalSplitPercent = splits.reduce((sum, s) => sum + s.percent, 0);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(selectedTpl.defaultBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInCorporateDocs = () => {
    addDocument({
      type: selectedTpl.id === 'tpl-split' ? 'split_sheet' : 'official_letter',
      title: selectedTpl.defaultTitle,
      referenceNo: `TPL-LYR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
      recipientName: 'The Recording Authors & Publishers',
      authorName: 'Ojo Abdulkareem',
      authorRole: 'Managing Director & Head of Label',
      status: 'Draft',
      bodyContent: selectedTpl.defaultBody,
      notes: selectedTpl.isLegalDraft ? 'DRAFT ONLY: Requires qualified entertainment legal counsel review before signature.' : undefined
    });

    setActiveModule('documents');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
            ARTIST & LABEL DOCUMENT TEMPLATES
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Standard entertainment contracts, songwriter split sheets, producer memos, and onboarding questionnaires
          </p>
        </div>
      </div>

      {/* Mandatory Legal Review Banner */}
      <div className="border border-neutral-700 bg-[#141414] rounded-lg p-4 flex items-start gap-3">
        <ShieldAlert size={20} className="text-neutral-300 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-white font-mono tracking-wider uppercase">
            LEGAL DISCLAIMER & STATUTORY NOTICE
          </span>
          <p className="text-neutral-400 mt-1 leading-relaxed">
            All agreement documents, split sheets, and appearance forms provided in this studio are industry-standard drafting templates for informational and internal planning purposes only. They do not constitute formal legal counsel. Prior to binding signature and execution, all contracts must undergo qualified review by an admitted entertainment attorney.
          </p>
        </div>
      </div>

      {/* Template Selector & Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Template List (4 Cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider px-1">
            LABEL TEMPLATE LIBRARY
          </div>

          {TEMPLATES.map(tpl => {
            const isSelected = tpl.id === selectedTpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTpl(tpl)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-[#181818] border-neutral-400 text-white' 
                    : 'bg-[#0E0E0E] border-[#1E1E1E] text-neutral-300 hover:border-[#333333]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1">
                  <span className="uppercase">{tpl.category}</span>
                  {tpl.isLegalDraft && (
                    <span className="text-neutral-300">LEGAL DRAFT</span>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-white leading-snug">{tpl.name}</h4>
                <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                  {tpl.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Template Preview & Split Calculator (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="border border-[#1E1E1E] rounded-lg bg-[#0E0E0E] p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#1C1C1C] pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
                  <span>{selectedTpl.category.toUpperCase()}</span>
                  <span>·</span>
                  <span>TEMPLATE</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
                  {selectedTpl.name}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A1A1A] text-neutral-200 hover:text-white border border-[#2B2B2B] rounded transition-colors"
                >
                  {copied ? <Check size={13} className="text-white" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={handleOpenInCorporateDocs}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded transition-colors whitespace-nowrap"
                >
                  <FileText size={13} />
                  <span>Draft in Corporate Studio</span>
                </button>
              </div>
            </div>

            {/* Split Sheet Calculator if split sheet selected */}
            {selectedTpl.id === 'tpl-split' && (
              <div className="p-4 bg-[#121212] border border-[#222222] rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono text-white uppercase flex items-center gap-2">
                    <Percent size={14} />
                    <span>Interactive Split Percentage Balance</span>
                  </h4>
                  <span className={`text-xs font-mono font-bold tabular-nums ${
                    totalSplitPercent === 100 ? 'text-white' : 'text-neutral-400'
                  }`}>
                    TOTAL: {totalSplitPercent.toFixed(2)}% {totalSplitPercent === 100 ? '(BALANCED 100%)' : '(MUST EQUAL 100%)'}
                  </span>
                </div>

                <div className="space-y-2">
                  {splits.map((s, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs font-mono">
                      <input
                        type="text"
                        value={s.name}
                        onChange={e => {
                          const val = e.target.value;
                          setSplits(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                        }}
                        className="col-span-5 bg-[#181818] border border-[#262626] rounded px-2.5 py-1 text-white"
                      />
                      <input
                        type="text"
                        value={s.role}
                        onChange={e => {
                          const val = e.target.value;
                          setSplits(prev => prev.map((item, i) => i === idx ? { ...item, role: val } : item));
                        }}
                        className="col-span-4 bg-[#181818] border border-[#262626] rounded px-2.5 py-1 text-neutral-300"
                      />
                      <div className="col-span-3 flex items-center gap-1">
                        <input
                          type="number"
                          value={s.percent}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setSplits(prev => prev.map((item, i) => i === idx ? { ...item, percent: val } : item));
                          }}
                          className="w-full bg-[#181818] border border-[#262626] rounded px-2.5 py-1 text-right text-white font-mono"
                        />
                        <span className="text-neutral-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Template Body Preview */}
            <div>
              <div className="text-xs font-mono text-neutral-400 uppercase mb-2">TEMPLATE CLAUSES & STRUCTURE</div>
              <pre className="p-4 bg-[#121212] border border-[#1E1E1E] rounded-md text-xs font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap overflow-x-auto selection:bg-white selection:text-black">
                {selectedTpl.defaultBody}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
