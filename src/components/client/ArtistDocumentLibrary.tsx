import React, { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import {
  ArrowDownToLine,
  Check,
  Copy,
  FileCheck2,
  FilePlus2,
  FileText,
  Music2,
  Pencil,
  Percent,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import {
  ARTIST_DOCUMENT_TYPE_OPTIONS,
  isCommercialDocumentType,
  isLegacyCommercialWorkspaceDoc,
  validateSplitContributorsTotal,
} from '../../lib/financeDocuments';
import type { ClientProfile, CorporateDocument, DocumentType, Workspace } from '../../types';
import {
  generateArtistEpkPdf,
  generateCorporateDocumentPdf,
  generateSplitSheetPdf,
  generateTracklistCreditsPdf,
} from '../../utils/pdfGenerator';

export interface ArtistReleaseInput {
  id: string;
  title: string;
  type: string;
  releaseDate?: string;
  trackList?: string;
  featuredArtists?: string;
  producer?: string;
  songwriters?: string;
  rightsInfo?: string;
  isrc?: string;
  upc?: string;
  status?: string;
  distributionStatus?: string;
}

export interface ArtistDocumentLibraryProps {
  workspace: Workspace;
  clientProfile: ClientProfile | null;
  accountName: string;
  releases: ArtistReleaseInput[];
  documents: CorporateDocument[];
  onOpenReleases?: () => void;
  onOpenBilling?: () => void;
  onOpenCreativeHub?: () => void;
}

interface MusicTemplateDef {
  id: string;
  docType: DocumentType;
  name: string;
  category: 'Agreements & Splits' | 'Artist & Press' | 'Production & Video' | 'Budget & Planning';
  description: string;
  isLegalDraft: boolean;
  defaultTitle: string;
  buildBody: (artistName: string) => string;
}

const panelClass = 'rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 sm:p-6';
const fieldClass =
  'w-full rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-sm text-white outline-none focus:border-[#FF1E1E] transition-colors';
const labelClass =
  'mb-1.5 block text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-neutral-500';

const NON_COMMERCIAL_STATUSES: Array<'Draft' | 'Under Review' | 'Approved' | 'Issued'> = [
  'Draft',
  'Under Review',
  'Approved',
  'Issued',
];

function buildMusicTemplates(artistName: string): MusicTemplateDef[] {
  const safeArtist = artistName.trim() || 'Recording Artist';
  return [
    {
      id: 'tpl-split',
      docType: 'split_sheet',
      name: 'Songwriter Split Sheet Agreement',
      category: 'Agreements & Splits',
      description:
        'Composition ownership split record between contributing lyricists, vocalists, composers, and music producers.',
      isLegalDraft: true,
      defaultTitle: `${safeArtist} — Songwriter & Producer Split Sheet`,
      buildBody: name => `SONGWRITER & PRODUCER SPLIT SHEET

Song Title: [Insert Title]
ISRC: [Insert ISRC]
Recording Artist / Workspace: ${name}
Rights Holder / Imprint: [Insert Label or Independent Entity]
Date of Execution: ${new Date().toISOString().slice(0, 10)}

1. COMPOSITION OWNERSHIP SHARES:
The undersigned parties hereby certify and agree that the musical composition described above was created collaboratively, and all publishing rights, performance royalties, and mechanical shares are allocated as follows:

- Contributor 1 (Lyricist / Performer): 50.00% Share | PRO: BMI / ASCAP | IPI: [Number]
- Contributor 2 (Lead Producer / Composer): 35.00% Share | PRO: PRS / ASCAP | IPI: [Number]
- Contributor 3 (Arranger / Co-Writer): 15.00% Share | PRO: SOCAN / PRO | IPI: [Number]
Total Composition Shares: 100.00%

2. WARRANTIES & CLEARANCE:
Each party confirms that their respective contributions are original and do not infringe third-party copyrights, uncleared samples, or master recordings.`,
    },
    {
      id: 'tpl-producer',
      docType: 'producer_agreement_memo',
      name: 'Producer Engagement & Credits Memo',
      category: 'Agreements & Splits',
      description:
        'Engagement drafting memorandum recording production fee terms, master royalty points, stem delivery, and billing credits.',
      isLegalDraft: true,
      defaultTitle: `${safeArtist} — Producer Engagement Memorandum`,
      buildBody: name => `PRODUCER ENGAGEMENT MEMORANDUM

Date: ${new Date().toISOString().slice(0, 10)}
Artist / Workspace: ${name}
Producer: [Insert Producer Legal Name] (p/k/a "[Producer Tag]")
Track Title: "[Insert Track Title]"

1. SCOPE OF ENGAGEMENT:
Artist engages Producer to render production, instrumental composition, and tracked-out stem delivery for the master recording specified above.

2. AGREED PRODUCTION TERMS & CREDITS:
- Credit Line: "Produced by [Producer Moniker]"
- Stem Delivery Standard: 24-bit / 48kHz uncompressed WAV stems plus stereo instrumental & TV mix.
- Royalty / Master Points Allocation: [Insert Agreed Terms after Entertainment Counsel Review]`,
    },
    {
      id: 'tpl-video-release',
      docType: 'video_release_memo',
      name: 'Music Video Appearance & Location Release',
      category: 'Production & Video',
      description:
        'Appearance and location clearance form for cast, directors, and shoot venues across visualizers, music videos, and DSP canvas loops.',
      isLegalDraft: true,
      defaultTitle: `${safeArtist} — Music Video Appearance & Likeness Release`,
      buildBody: name => `AUDIOVISUAL APPEARANCE & LIKENESS RELEASE

Production Title: "[Insert Video / Visualizer Title]"
Artist / Workspace: ${name}
Director / Production Lead: [Insert Director Name]
Filming Date & Location: [Insert Date / Studio Address]

For good and valuable consideration, the undersigned Participant grants to ${name} and its authorized distribution licensees the non-exclusive worldwide right to capture, edit, synchronize, and distribute Participant's image, likeness, and performance recorded on the filming date specified above across music streaming canvases, video platforms, and promotional media.`,
    },
    {
      id: 'tpl-auth',
      docType: 'master_authorization',
      name: 'Master Release Authorization Checklist',
      category: 'Agreements & Splits',
      description:
        'Pre-release sign-off sheet verifying mastered audio, 3000px artwork, split sheets, ISRC/UPC codes, and DSP delivery readiness.',
      isLegalDraft: true,
      defaultTitle: `${safeArtist} — Master Release Authorization`,
      buildBody: name => `MASTER RELEASE AUTHORIZATION NOTICE

Release Title: "[Insert Project Title]"
Artist / Workspace: ${name}
Release Format: [Single / EP / Album]
UPC / Catalog Reference: [Insert UPC / Catalog Ref]
Target Street Date: [Insert Release Date]

PRE-DELIVERY VERIFICATION SIGN-OFF:
[ ] 24-bit WAV Master Audio Verified
[ ] 3000x3000px RGB Cover Artwork Approved
[ ] Split Sheet & Sample Clearances Signed
[ ] ISRC & Songwriter / Producer Credits Finalized
[ ] Press Kit (EPK) & Streaming Visual Assets Ready

Authorized Signatory (${name}): ___________________________ Date: _______________`,
    },
    {
      id: 'tpl-onboard',
      docType: 'artist_onboarding',
      name: 'Artist Legal & PRO Metadata Intake Sheet',
      category: 'Artist & Press',
      description:
        'Intake sheet capturing legal performer names, PRO affiliation, IPI/CAE numbers, SoundExchange ID, and distributor details.',
      isLegalDraft: false,
      defaultTitle: `${safeArtist} — Artist Metadata & PRO Intake`,
      buildBody: name => `ARTIST METADATA & PRO INTAKE SHEET

1. ARTIST PARTICULARS:
- Workspace / Performing Name: ${name}
- Legal Name (for Publishing & Contracts):
- Management / Booking Contact:
- Primary Territory & Residence:

2. PERFORMING RIGHTS & PUBLISHING DATA:
- Performing Rights Organization (PRO): [BMI / ASCAP / PRS / GEMA / Other]
- PRO IPI / CAE Number:
- Publishing Administrator:
- SoundExchange Registrant ID:
- Digital Distributor / Aggregator: [e.g. DistroKid / TuneCore / UnitedMasters / AWAL]`,
    },
    {
      id: 'tpl-budget',
      docType: 'album_budget',
      name: 'Single / EP / Album Release Budget Plan',
      category: 'Budget & Planning',
      description:
        'Structured planning worksheet for studio tracking, mixing, mastering, cover art, motion visualizers, and rollout promo planning.',
      isLegalDraft: false,
      defaultTitle: `${safeArtist} — Release Production Cost Plan`,
      buildBody: name => `RELEASE PRODUCTION PLANNING WORKSHEET

Artist / Workspace: ${name}
Release Title: [Single / EP / Album Title]
Target Release Date: [YYYY-MM-DD]

ESTIMATED PRODUCTION ALLOCATION:
1. Recording Studio Time & Session Musicians: [Amount]
2. Vocal Mixing & Stem Engineering: [Amount]
3. Stereo & Dolby Atmos Mastering: [Amount]
4. Cover Artwork & DSP Streaming Visuals: [Amount]
5. Motion Visualizers, Lyric Video & Press Photography: [Amount]
6. PR, Playlist Pitching & Listening Event Contingency: [Amount]

Note: Planning worksheet for internal release budgeting only.`,
    },
  ];
}

function downloadText(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const ArtistDocumentLibrary: React.FC<ArtistDocumentLibraryProps> = ({
  workspace,
  clientProfile,
  accountName,
  releases,
  documents,
  onOpenReleases,
  onOpenBilling,
  onOpenCreativeHub,
}) => {
  const templates = useMemo(() => buildMusicTemplates(workspace.name), [workspace.name]);

  const [subTab, setSubTab] = useState<'vault' | 'templates' | 'epk' | 'credits'>('vault');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewDoc, setPreviewDoc] = useState<CorporateDocument | null>(null);

  // Vault Document Editor State (non-commercial only)
  const [editingId, setEditingId] = useState('');
  const [docForm, setDocForm] = useState({
    type: 'split_sheet' as DocumentType,
    title: '',
    referenceNo: '',
    date: new Date().toISOString().slice(0, 10),
    recipientName: '',
    recipientOrg: '',
    recipientEmail: '',
    subject: '',
    bodyContent: '',
    notes: '',
    status: 'Draft' as 'Draft' | 'Under Review' | 'Approved' | 'Issued',
  });

  // Templates & Split Sheet Calculator State
  const [selectedTplId, setSelectedTplId] = useState<string>(templates[0].id);
  const selectedTpl = useMemo(
    () => templates.find(t => t.id === selectedTplId) || templates[0],
    [templates, selectedTplId],
  );
  const [copiedTpl, setCopiedTpl] = useState(false);
  const [splitTrackTitle, setSplitTrackTitle] = useState(releases[0]?.title || 'Untitled Master');
  const [splitIsrc, setSplitIsrc] = useState(releases[0]?.isrc || '');
  const [splitDate, setSplitDate] = useState(new Date().toISOString().slice(0, 10));
  const [splits, setSplits] = useState([
    { name: workspace.name || accountName, role: 'Lead Artist / Lyricist', percent: 50, pro: 'ASCAP', ipi: '' },
    { name: 'Co-Producer', role: 'Beat & Composition', percent: 35, pro: 'BMI', ipi: '' },
    { name: 'Featured Writer', role: 'Top-line & Backing Vocals', percent: 15, pro: 'PRS', ipi: '' },
  ]);
  const splitValidation = useMemo(() => validateSplitContributorsTotal(splits), [splits]);

  // EPK Builder State
  const [epkGenre, setEpkGenre] = useState(workspace.artistProfile?.genre || '');
  const [epkBio, setEpkBio] = useState(workspace.artistProfile?.biography || '');
  const [epkSpotify, setEpkSpotify] = useState(workspace.artistProfile?.spotify || '');
  const [epkApple, setEpkApple] = useState(workspace.artistProfile?.appleMusic || '');
  const [epkYoutube, setEpkYoutube] = useState(workspace.artistProfile?.youtube || '');
  const [epkInstagram, setEpkInstagram] = useState(workspace.artistProfile?.instagram || '');
  const [epkWebsite, setEpkWebsite] = useState(workspace.artistProfile?.website || '');

  // Tracklist & Credits Sheet Builder State
  const [creditsReleaseId, setCreditsReleaseId] = useState(releases[0]?.id || '');
  const [creditsTitle, setCreditsTitle] = useState(releases[0]?.title || 'Release Title');
  const [creditsType, setCreditsType] = useState(releases[0]?.type || 'Single');
  const [creditsDate, setCreditsDate] = useState(releases[0]?.releaseDate || '');
  const [creditsUpc, setCreditsUpc] = useState(releases[0]?.upc || '');
  const [creditsIsrc, setCreditsIsrc] = useState(releases[0]?.isrc || '');
  const [creditsRights, setCreditsRights] = useState(
    releases[0]?.rightsInfo || `℗ & © ${new Date().getFullYear()} ${workspace.name}`,
  );
  const [creditTracks, setCreditTracks] = useState([
    {
      trackNumber: 1,
      title: releases[0]?.title || 'Track 01',
      featuredArtists: releases[0]?.featuredArtists || '',
      producer: releases[0]?.producer || '',
      songwriters: releases[0]?.songwriters || workspace.name,
      duration: '03:12',
      isrc: releases[0]?.isrc || '',
    },
  ]);

  const artistSafeDocs = useMemo(
    () => documents.filter(d => !isLegacyCommercialWorkspaceDoc(d)),
    [documents],
  );
  const legacyCommercialDocs = useMemo(
    () => documents.filter(d => isLegacyCommercialWorkspaceDoc(d)),
    [documents],
  );

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return artistSafeDocs.filter(docItem => {
      if (typeFilter !== 'All' && docItem.type !== typeFilter) return false;
      if (!q) return true;
      return (
        docItem.title.toLowerCase().includes(q) ||
        (docItem.referenceNo || '').toLowerCase().includes(q) ||
        (docItem.recipientName || '').toLowerCase().includes(q) ||
        (docItem.bodyContent || '').toLowerCase().includes(q)
      );
    });
  }, [artistSafeDocs, searchQuery, typeFilter]);

  const showNotice = (msg: string) => {
    setError('');
    setNotice(msg);
  };

  const resetDocForm = () => {
    setEditingId('');
    setDocForm({
      type: 'split_sheet',
      title: '',
      referenceNo: '',
      date: new Date().toISOString().slice(0, 10),
      recipientName: '',
      recipientOrg: '',
      recipientEmail: '',
      subject: '',
      bodyContent: '',
      notes: '',
      status: 'Draft',
    });
  };

  const writeNonCommercialDoc = async (payload: {
    type: DocumentType;
    title: string;
    referenceNo: string;
    date: string;
    recipientName: string;
    recipientOrg?: string;
    recipientEmail?: string;
    subject?: string;
    bodyContent: string;
    notes?: string;
    status: 'Draft' | 'Under Review' | 'Approved' | 'Issued';
  }) => {
    if (isCommercialDocumentType(payload.type)) {
      throw new Error(
        'Commercial invoices, quotes, and proposals cannot be created here. KeedoHub Admin issues those under Billing & Agreements.',
      );
    }
    const cleanTitle = payload.title.trim().slice(0, 160);
    if (!cleanTitle) throw new Error('Document title is required.');

    const now = new Date().toISOString();
    const docData = {
      workspaceId: workspace.id,
      library: 'artist' as const,
      type: payload.type,
      title: cleanTitle,
      referenceNo:
        payload.referenceNo.trim() ||
        `ART-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: payload.date || now.slice(0, 10),
      recipientName: payload.recipientName.trim() || workspace.name,
      recipientOrg: payload.recipientOrg?.trim() || workspace.name,
      recipientEmail: payload.recipientEmail?.trim() || clientProfile?.email || '',
      authorName: accountName,
      authorRole: 'Artist Workspace Owner',
      status: payload.status,
      subject: payload.subject?.trim() || cleanTitle,
      bodyContent: payload.bodyContent.slice(0, 20000),
      ...(payload.notes?.trim() ? { notes: payload.notes.trim().slice(0, 1000) } : {}),
      updatedAt: now,
    };

    if (editingId) {
      await updateDoc(doc(db, 'workspaces', workspace.id, 'documents', editingId), docData);
      showNotice(`Updated "${cleanTitle}" in Artist Documents.`);
      resetDocForm();
    } else {
      await addDoc(collection(db, 'workspaces', workspace.id, 'documents'), {
        ...docData,
        createdAt: now,
      });
      showNotice(`Saved "${cleanTitle}" to Artist Documents.`);
    }
  };

  const handleSaveVaultDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await writeNonCommercialDoc(docForm);
      if (!editingId) resetDocForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplateDraft = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      let body = selectedTpl.buildBody(workspace.name);
      if (selectedTpl.id === 'tpl-split') {
        const splitLines = splits
          .map(
            s =>
              `- ${s.name} (${s.role}): ${Number(s.percent || 0).toFixed(2)}% | PRO: ${s.pro || 'N/A'} | IPI: ${s.ipi || 'Pending'}`,
          )
          .join('\n');
        body = `SONGWRITER & PRODUCER SPLIT SHEET\n\nTrack Title: ${splitTrackTitle}\nISRC: ${splitIsrc || 'Pending'}\nRecording Artist: ${workspace.name}\nDate: ${splitDate}\n\n1. COMPOSITION OWNERSHIP SHARES (Total: ${splitValidation.total.toFixed(2)}%):\n${splitLines}\n\n2. DRAFTING NOTICE:\nAll contributors certify original authorship prior to legal counsel sign-off.`;
      }
      await writeNonCommercialDoc({
        type: selectedTpl.docType,
        title: selectedTpl.id === 'tpl-split' ? `Split Sheet — ${splitTrackTitle}` : selectedTpl.defaultTitle,
        referenceNo: `ART-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().slice(0, 10),
        recipientName: workspace.name,
        subject: selectedTpl.name,
        bodyContent: body,
        notes: selectedTpl.isLegalDraft
          ? 'DRAFTING TEMPLATE ONLY: Review with qualified entertainment legal counsel before binding execution.'
          : undefined,
        status: 'Draft',
      });
      setSubTab('vault');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEpkSnapshot = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const linksSummary = [
        epkSpotify ? `Spotify: ${epkSpotify}` : '',
        epkApple ? `Apple Music: ${epkApple}` : '',
        epkYoutube ? `YouTube: ${epkYoutube}` : '',
        epkInstagram ? `Instagram: ${epkInstagram}` : '',
        epkWebsite ? `Website: ${epkWebsite}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const releaseLines = releases
        .map(r => `- ${r.title} (${r.type}) · ${r.releaseDate || 'TBD'} · ${r.status || r.distributionStatus || 'Draft'}`)
        .join('\n');

      await writeNonCommercialDoc({
        type: 'epk',
        title: `${workspace.name} — Official Electronic Press Kit (EPK)`,
        referenceNo: `EPK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().slice(0, 10),
        recipientName: 'Press, Booking & DSP Editorial Contacts',
        subject: `${workspace.name} Electronic Press Kit (${epkGenre || 'Recording Artist'})`,
        bodyContent: [
          `GENRE & SOUND:\n${epkGenre || 'Independent'}`,
          `ARTIST BIOGRAPHY:\n${epkBio || 'Biography pending update.'}`,
          linksSummary ? `OFFICIAL CHANNELS:\n${linksSummary}` : '',
          releaseLines ? `DISCOGRAPHY & RELEASES:\n${releaseLines}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
        status: 'Approved',
      });
      setSubTab('vault');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLoadReleaseIntoCredits = (releaseId: string) => {
    setCreditsReleaseId(releaseId);
    const rel = releases.find(r => r.id === releaseId);
    if (!rel) return;
    setCreditsTitle(rel.title);
    setCreditsType(rel.type);
    setCreditsDate(rel.releaseDate || '');
    setCreditsUpc(rel.upc || '');
    setCreditsIsrc(rel.isrc || '');
    setCreditsRights(rel.rightsInfo || `℗ & © ${new Date().getFullYear()} ${workspace.name}`);

    const parsedLines = (rel.trackList || '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    if (parsedLines.length > 0) {
      setCreditTracks(
        parsedLines.map((line, idx) => ({
          trackNumber: idx + 1,
          title: line.replace(/^\d+[.)]\s*/, ''),
          featuredArtists: rel.featuredArtists || '',
          producer: rel.producer || '',
          songwriters: rel.songwriters || workspace.name,
          duration: '03:15',
          isrc: idx === 0 ? rel.isrc || '' : '',
        })),
      );
    } else {
      setCreditTracks([
        {
          trackNumber: 1,
          title: rel.title,
          featuredArtists: rel.featuredArtists || '',
          producer: rel.producer || '',
          songwriters: rel.songwriters || workspace.name,
          duration: '03:15',
          isrc: rel.isrc || '',
        },
      ]);
    }
  };

  const handleSaveCreditsSheet = async () => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const trackText = creditTracks
        .map(
          t =>
            `${t.trackNumber}. ${t.title}${t.featuredArtists ? ` (feat. ${t.featuredArtists})` : ''} — Producer: ${t.producer || 'TBC'} · Writers: ${t.songwriters || workspace.name} · ISRC: ${t.isrc || 'Pending'} (${t.duration || '00:00'})`,
        )
        .join('\n');

      await writeNonCommercialDoc({
        type: 'tracklist_credits',
        title: `${creditsTitle} — Tracklist & Credits Sheet`,
        referenceNo: `CRD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().slice(0, 10),
        recipientName: workspace.name,
        subject: `${creditsTitle} (${creditsType}) Master Liner Credits`,
        bodyContent: `RELEASE METADATA:\nArtist: ${workspace.name}\nRelease: ${creditsTitle} (${creditsType})\nRelease Date: ${creditsDate || 'TBD'}\nUPC: ${creditsUpc || 'Pending'}\nPrimary ISRC: ${creditsIsrc || 'Pending'}\nRights Line: ${creditsRights}\n\nTRACKLIST & CREDITS:\n${trackText}`,
        status: 'Approved',
      });
      setSubTab('vault');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (docItem: CorporateDocument) => {
    if (isLegacyCommercialWorkspaceDoc(docItem)) {
      setError('Commercial invoices and proposals are governed in Billing & Agreements and cannot be modified here.');
      return;
    }
    setError('');
    try {
      await deleteDoc(doc(db, 'workspaces', workspace.id, 'documents', docItem.id));
      showNotice(`Removed "${docItem.title}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      {/* Navigation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E1E] pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'vault' as const, label: `Artist Vault (${artistSafeDocs.length})` },
            { id: 'templates' as const, label: 'Music Templates & Split Sheet' },
            { id: 'epk' as const, label: 'Artist EPK Builder' },
            { id: 'credits' as const, label: 'Tracklist & Credits' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`rounded px-3 py-1.5 text-xs font-mono tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                subTab === tab.id
                  ? 'bg-white text-black font-semibold'
                  : 'border border-[#262626] bg-[#121212] text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenCreativeHub && (
            <button
              type="button"
              onClick={onOpenCreativeHub}
              className="inline-flex items-center gap-1.5 rounded border border-[#2A2A2A] bg-[#121212] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#FF1E1E] hover:text-white whitespace-nowrap shrink-0"
            >
              <Sparkles size={13} className="text-[#FF1E1E]" />
              <span>Press &amp; Release Packs</span>
            </button>
          )}
          {onOpenReleases && (
            <button
              type="button"
              onClick={onOpenReleases}
              className="inline-flex items-center gap-1.5 rounded border border-[#2A2A2A] bg-[#121212] px-3 py-1.5 text-xs text-neutral-300 hover:text-white whitespace-nowrap shrink-0"
            >
              <Music2 size={13} />
              <span>Releases ({releases.length})</span>
            </button>
          )}
          {onOpenBilling && (
            <button
              type="button"
              onClick={onOpenBilling}
              className="inline-flex items-center gap-1.5 rounded border border-[#2A2A2A] bg-[#121212] px-3 py-1.5 text-xs text-neutral-300 hover:border-[#FF1E1E] hover:text-white whitespace-nowrap shrink-0"
            >
              <FileCheck2 size={13} />
              <span>Commercial Billing</span>
            </button>
          )}
        </div>
      </div>

      {legacyCommercialDocs.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-semibold text-amber-200">
              {legacyCommercialDocs.length} legacy commercial record(s) remain read-only in this workspace.
            </p>
            <p className="mt-0.5 text-amber-100/75">
              All active commercial invoices, receipts, and proposals issued by KeedoHub are managed under Billing &amp; Agreements.
            </p>
          </div>
          {onOpenBilling && (
            <button
              type="button"
              onClick={onOpenBilling}
              className="rounded border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 font-semibold text-amber-100 hover:bg-amber-500/25 whitespace-nowrap shrink-0"
            >
              Open Invoices &amp; Proposals
            </button>
          )}
        </div>
      )}

      {/* SUBTAB 1: ARTIST DOCUMENT VAULT */}
      {subTab === 'vault' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(310px,.75fr)]">
          <section className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A] pb-4 mb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                  Artist OS · Document Vault
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">Artist Agreements, EPKs &amp; Credits</h3>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Private release drafts, split sheets, press kits, and track metadata for {workspace.name}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter artist documents by type"
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="rounded border border-[#2C2C2C] bg-[#141414] px-2.5 py-1.5 text-xs text-neutral-200"
                >
                  <option value="All">All types</option>
                  {ARTIST_DOCUMENT_TYPE_OPTIONS.map(opt => (
                    <option key={opt.type} value={opt.type}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <label className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search artist docs…"
                    className="w-44 rounded border border-[#2C2C2C] bg-[#141414] pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
                  />
                </label>
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="rounded border border-dashed border-[#2C2C2C] p-8 text-center space-y-3">
                <p className="text-sm text-neutral-400">
                  No artist documents recorded yet. Draft a split sheet, build an EPK, or save a release checklist.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubTab('templates')}
                    className="rounded border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                  >
                    Open Split Sheet &amp; Templates
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab('epk')}
                    className="rounded bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                  >
                    Build Artist EPK
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map(item => (
                  <article key={item.id} className="rounded-lg border border-[#252525] bg-[#111] p-4 space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-white truncate">{item.title}</h4>
                        <p className="mt-1 text-[11px] font-mono text-neutral-500 tabular-nums">
                          {item.type.replaceAll('_', ' ')} · {item.referenceNo} · {item.date} · {item.status}
                        </p>
                      </div>
                      <select
                        aria-label={`Status for ${item.title}`}
                        value={item.status}
                        onChange={e =>
                          void updateDoc(doc(db, 'workspaces', workspace.id, 'documents', item.id), {
                            status: e.target.value,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="rounded border border-[#2E2E2E] bg-[#141414] px-2 py-1 text-xs text-neutral-300"
                      >
                        {NON_COMMERCIAL_STATUSES.map(st => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="line-clamp-3 whitespace-pre-wrap text-xs text-neutral-300 leading-relaxed">
                      {item.bodyContent}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1D1D1D]">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(item)}
                        className="rounded border border-[#333] px-2.5 py-1 text-xs text-neutral-200 hover:text-white"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setDocForm({
                            type: item.type,
                            title: item.title,
                            referenceNo: item.referenceNo || '',
                            date: item.date || new Date().toISOString().slice(0, 10),
                            recipientName: item.recipientName || '',
                            recipientOrg: item.recipientOrg || '',
                            recipientEmail: item.recipientEmail || '',
                            subject: item.subject || '',
                            bodyContent: item.bodyContent || '',
                            notes: item.notes || '',
                            status:
                              NON_COMMERCIAL_STATUSES.includes(item.status as typeof NON_COMMERCIAL_STATUSES[number])
                                ? (item.status as typeof NON_COMMERCIAL_STATUSES[number])
                                : 'Draft',
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1 text-xs text-white"
                      >
                        <Pencil size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => generateCorporateDocumentPdf(item, workspace)}
                        className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
                      >
                        <ArrowDownToLine size={12} />
                        <span>PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadText(
                            `${item.referenceNo || item.title}.txt`,
                            `${workspace.name}\n${item.title}\n${item.referenceNo} · ${item.date}\n\n${item.bodyContent}`,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
                      >
                        <ArrowDownToLine size={12} />
                        <span>TXT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteDoc(item)}
                        className="ml-auto inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-300"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Non-Commercial Artist Document Form */}
          <form onSubmit={handleSaveVaultDoc} className={`${panelClass} h-fit space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">
                {editingId ? 'Edit Artist Document' : 'New Artist Document'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetDocForm}
                  aria-label="Cancel editing"
                  className="text-neutral-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <label className="block">
              <span className={labelClass}>Document Type</span>
              <select
                value={docForm.type}
                onChange={e => setDocForm(prev => ({ ...prev, type: e.target.value as DocumentType }))}
                className={fieldClass}
              >
                {ARTIST_DOCUMENT_TYPE_OPTIONS.map(opt => (
                  <option key={opt.type} value={opt.type}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>Title</span>
              <input
                required
                maxLength={160}
                value={docForm.title}
                onChange={e => setDocForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Midnight Echoes — Split Sheet"
                className={fieldClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Reference No</span>
                <input
                  value={docForm.referenceNo}
                  onChange={e => setDocForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                  placeholder="ART-2026-001"
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Date</span>
                <input
                  type="date"
                  value={docForm.date}
                  onChange={e => setDocForm(prev => ({ ...prev, date: e.target.value }))}
                  className={fieldClass}
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Party / Recipient</span>
              <input
                value={docForm.recipientName}
                onChange={e => setDocForm(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="Co-writers, Producer, Press Contact…"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Content</span>
              <textarea
                required
                rows={7}
                value={docForm.bodyContent}
                onChange={e => setDocForm(prev => ({ ...prev, bodyContent: e.target.value }))}
                placeholder="Write split allocations, credits, release checklist, or artist correspondence…"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Status</span>
              <select
                value={docForm.status}
                onChange={e =>
                  setDocForm(prev => ({
                    ...prev,
                    status: e.target.value as typeof NON_COMMERCIAL_STATUSES[number],
                  }))
                }
                className={fieldClass}
              >
                {NON_COMMERCIAL_STATUSES.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#FF1E1E] px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              <FilePlus2 size={15} />
              <span>{saving ? 'Saving…' : editingId ? 'Update Document' : 'Save to Artist Vault'}</span>
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 2: MUSIC TEMPLATES & INTERACTIVE 100% SPLIT CALCULATOR */}
      {subTab === 'templates' && (
        <div className="space-y-5">
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 p-4 flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-300 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-mono font-bold uppercase tracking-wider text-amber-200">
                Legal Disclaimer &amp; Drafting Notice
              </p>
              <p className="mt-1 text-neutral-300 leading-relaxed">
                Music agreement templates, split sheets, and release checklists are provided for internal drafting and
                artist preparation only. They do not constitute formal legal advice; have a qualified entertainment
                attorney review binding contracts prior to execution.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-4 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 px-1">
                Artist Template Library
              </p>
              {templates.map(tpl => {
                const active = tpl.id === selectedTpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTplId(tpl.id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                      active
                        ? 'bg-[#171717] border-[#FF1E1E] text-white'
                        : 'bg-[#0C0C0C] border-[#222222] text-neutral-300 hover:border-[#3A3A3A]'
                    }`}
                  >
                    <p className="text-[10px] font-mono uppercase text-neutral-500">
                      {tpl.category}
                      {tpl.isLegalDraft ? ' · Legal Draft' : ''}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-white">{tpl.name}</p>
                    <p className="mt-1 text-[11px] text-neutral-400 line-clamp-2">{tpl.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div className={`${panelClass} space-y-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1A1A1A] pb-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                      {selectedTpl.category} · {workspace.name}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-white">{selectedTpl.name}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(selectedTpl.buildBody(workspace.name));
                        setCopiedTpl(true);
                        setTimeout(() => setCopiedTpl(false), 1800);
                      }}
                      className="inline-flex items-center gap-1.5 rounded border border-[#2C2C2C] bg-[#141414] px-3 py-1.5 text-xs text-neutral-200 hover:text-white whitespace-nowrap shrink-0"
                    >
                      {copiedTpl ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedTpl ? 'Copied' : 'Copy Text'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveTemplateDraft()}
                      className="inline-flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-neutral-200 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      <FileText size={13} />
                      <span>Save Draft to Vault</span>
                    </button>
                  </div>
                </div>

                {selectedTpl.id === 'tpl-split' && (
                  <div className="rounded-lg border border-[#262626] bg-[#121212] p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-mono uppercase text-white flex items-center gap-2">
                        <Percent size={14} className="text-[#FF1E1E]" />
                        <span>100% Songwriter Split Calculator</span>
                      </h4>
                      <span
                        className={`text-xs font-mono font-bold tabular-nums ${
                          splitValidation.isValid ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        TOTAL: {splitValidation.total.toFixed(2)}%{' '}
                        {splitValidation.isValid ? '(BALANCED 100%)' : '(MUST EQUAL 100%)'}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className={labelClass}>Track Title</span>
                        <input
                          value={splitTrackTitle}
                          onChange={e => setSplitTrackTitle(e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>ISRC (Optional)</span>
                        <input
                          value={splitIsrc}
                          onChange={e => setSplitIsrc(e.target.value)}
                          placeholder="USRC12600001"
                          className={fieldClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Execution Date</span>
                        <input
                          type="date"
                          value={splitDate}
                          onChange={e => setSplitDate(e.target.value)}
                          className={fieldClass}
                        />
                      </label>
                    </div>

                    <div className="space-y-2">
                      {splits.map((s, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs">
                          <input
                            value={s.name}
                            placeholder="Contributor Name"
                            onChange={e => {
                              const val = e.target.value;
                              setSplits(prev => prev.map((it, i) => (i === idx ? { ...it, name: val } : it)));
                            }}
                            className="col-span-4 rounded border border-[#2C2C2C] bg-[#161616] px-2.5 py-1.5 text-white"
                          />
                          <input
                            value={s.role}
                            placeholder="Role"
                            onChange={e => {
                              const val = e.target.value;
                              setSplits(prev => prev.map((it, i) => (i === idx ? { ...it, role: val } : it)));
                            }}
                            className="col-span-3 rounded border border-[#2C2C2C] bg-[#161616] px-2.5 py-1.5 text-neutral-300"
                          />
                          <input
                            value={s.pro}
                            placeholder="PRO (BMI/ASCAP)"
                            onChange={e => {
                              const val = e.target.value;
                              setSplits(prev => prev.map((it, i) => (i === idx ? { ...it, pro: val } : it)));
                            }}
                            className="col-span-2 rounded border border-[#2C2C2C] bg-[#161616] px-2 py-1.5 text-neutral-300 font-mono"
                          />
                          <div className="col-span-2 flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={s.percent}
                              onChange={e => {
                                const val = Number(e.target.value) || 0;
                                setSplits(prev => prev.map((it, i) => (i === idx ? { ...it, percent: val } : it)));
                              }}
                              className="w-full rounded border border-[#2C2C2C] bg-[#161616] px-2 py-1.5 text-right text-white font-mono tabular-nums"
                            />
                            <span className="text-neutral-500">%</span>
                          </div>
                          <button
                            type="button"
                            disabled={splits.length <= 1}
                            onClick={() => setSplits(prev => prev.filter((_, i) => i !== idx))}
                            aria-label="Remove contributor"
                            className="col-span-1 flex justify-center text-neutral-500 hover:text-red-300 disabled:opacity-30"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#222]">
                      <button
                        type="button"
                        onClick={() =>
                          setSplits(prev => [
                            ...prev,
                            { name: '', role: 'Songwriter', percent: 0, pro: 'ASCAP', ipi: '' },
                          ])
                        }
                        className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-200 hover:text-white"
                      >
                        <Plus size={12} />
                        <span>Add Contributor</span>
                      </button>

                      <button
                        type="button"
                        disabled={!splitValidation.isValid}
                        onClick={() =>
                          generateSplitSheetPdf({
                            title: splitTrackTitle || 'Untitled Master',
                            isrc: splitIsrc,
                            artistName: workspace.name,
                            workspaceName: workspace.name,
                            executionDate: splitDate,
                            contributors: splits,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-40 whitespace-nowrap shrink-0"
                      >
                        <ArrowDownToLine size={13} />
                        <span>Export Split Sheet PDF</span>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className={labelClass}>Template Clauses &amp; Structure</p>
                  <pre className="p-4 bg-[#121212] border border-[#1E1E1E] rounded-md text-xs font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                    {selectedTpl.buildBody(workspace.name)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ARTIST EPK BUILDER */}
      {subTab === 'epk' && (
        <div className="grid gap-5 lg:grid-cols-12">
          <div className={`${panelClass} lg:col-span-7 space-y-4`}>
            <div className="border-b border-[#1A1A1A] pb-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                Press &amp; Booking Kit
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">Artist EPK Generator</h3>
              <p className="mt-0.5 text-xs text-neutral-400">
                Pre-filled from your Artist Profile and Releases catalog. Export a print-ready A4 PDF or save a snapshot to your vault.
              </p>
            </div>

            <label className="block">
              <span className={labelClass}>Primary Genre &amp; Sonic Tagline</span>
              <input
                value={epkGenre}
                onChange={e => setEpkGenre(e.target.value)}
                placeholder="Alternative R&B · Afrobeats · Indie Electronic"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Official Press Biography</span>
              <textarea
                rows={6}
                value={epkBio}
                onChange={e => setEpkBio(e.target.value)}
                placeholder="Artist origin, artistic direction, milestone performances, and press highlights…"
                className={fieldClass}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Spotify Profile URL</span>
                <input value={epkSpotify} onChange={e => setEpkSpotify(e.target.value)} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Apple Music URL</span>
                <input value={epkApple} onChange={e => setEpkApple(e.target.value)} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>YouTube Channel</span>
                <input value={epkYoutube} onChange={e => setEpkYoutube(e.target.value)} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Instagram / Social</span>
                <input value={epkInstagram} onChange={e => setEpkInstagram(e.target.value)} className={fieldClass} />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Official Website / Booking Portal</span>
              <input value={epkWebsite} onChange={e => setEpkWebsite(e.target.value)} className={fieldClass} />
            </label>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  generateArtistEpkPdf({
                    artistName: workspace.name,
                    genre: epkGenre,
                    biography: epkBio,
                    workspaceName: workspace.name,
                    links: {
                      spotify: epkSpotify,
                      appleMusic: epkApple,
                      youtube: epkYoutube,
                      instagram: epkInstagram,
                      website: epkWebsite,
                    },
                    releases: releases.map(r => ({
                      title: r.title,
                      type: r.type,
                      releaseDate: r.releaseDate,
                      distributionStatus: r.status || r.distributionStatus,
                      isrc: r.isrc,
                    })),
                  })
                }
                className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
              >
                <ArrowDownToLine size={14} />
                <span>Download EPK PDF</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveEpkSnapshot()}
                className="inline-flex items-center gap-1.5 rounded border border-[#333] bg-[#141414] px-4 py-2 text-xs font-medium text-white hover:border-white disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{saving ? 'Saving…' : 'Save EPK Snapshot'}</span>
              </button>
            </div>
          </div>

          <aside className={`${panelClass} lg:col-span-5 space-y-4`}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Included Discography ({releases.length})
            </p>
            {releases.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No releases added yet. Releases created in Music &amp; Releases will appear automatically in your EPK.
              </p>
            ) : (
              <div className="space-y-2">
                {releases.map(rel => (
                  <div
                    key={rel.id}
                    className="rounded border border-[#1E1E1E] bg-[#121212] px-3 py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{rel.title}</p>
                      <p className="text-[11px] font-mono text-neutral-500 tabular-nums">
                        {rel.type} · {rel.releaseDate || 'TBD'} {rel.isrc ? `· ${rel.isrc}` : ''}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-neutral-300 shrink-0">
                      {rel.status || rel.distributionStatus || 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* SUBTAB 4: TRACKLIST & RELEASE CREDITS SHEET */}
      {subTab === 'credits' && (
        <div className={`${panelClass} space-y-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1A1A1A] pb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
                Master Liner Metadata
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">Tracklist &amp; Release Credits Sheet</h3>
              <p className="mt-0.5 text-xs text-neutral-400">
                Compile track sequences, featured artists, producers, songwriters, ISRC/UPC codes, and phonographic copyright lines.
              </p>
            </div>
            {releases.length > 0 && (
              <select
                aria-label="Load release metadata"
                value={creditsReleaseId}
                onChange={e => handleLoadReleaseIntoCredits(e.target.value)}
                className="rounded border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs text-white"
              >
                <option value="">Load from Music &amp; Releases…</option>
                {releases.map(rel => (
                  <option key={rel.id} value={rel.id}>
                    {rel.title} ({rel.type})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Release Title</span>
              <input value={creditsTitle} onChange={e => setCreditsTitle(e.target.value)} className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Format</span>
              <select value={creditsType} onChange={e => setCreditsType(e.target.value)} className={fieldClass}>
                <option>Single</option>
                <option>EP</option>
                <option>Album</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Release Date</span>
              <input type="date" value={creditsDate} onChange={e => setCreditsDate(e.target.value)} className={fieldClass} />
            </label>
            <label className="block">
              <span className={labelClass}>UPC / Primary ISRC</span>
              <input
                value={creditsUpc || creditsIsrc}
                onChange={e => {
                  setCreditsUpc(e.target.value);
                  setCreditsIsrc(e.target.value);
                }}
                placeholder="UPC / ISRC"
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Copyright &amp; Phonographic Rights Line</span>
            <input value={creditsRights} onChange={e => setCreditsRights(e.target.value)} className={fieldClass} />
          </label>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className={labelClass}>Track Sequence &amp; Credits</span>
              <button
                type="button"
                onClick={() =>
                  setCreditTracks(prev => [
                    ...prev,
                    {
                      trackNumber: prev.length + 1,
                      title: `Track ${String(prev.length + 1).padStart(2, '0')}`,
                      featuredArtists: '',
                      producer: '',
                      songwriters: workspace.name,
                      duration: '03:00',
                      isrc: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1 text-xs text-neutral-200 hover:text-white"
              >
                <Plus size={12} />
                <span>Add Track</span>
              </button>
            </div>

            {creditTracks.map((tr, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded border border-[#222] bg-[#121212] p-3 text-xs items-center"
              >
                <div className="md:col-span-1 font-mono text-neutral-400 tabular-nums">#{tr.trackNumber}</div>
                <input
                  value={tr.title}
                  placeholder="Track title"
                  onChange={e => {
                    const val = e.target.value;
                    setCreditTracks(prev => prev.map((it, i) => (i === idx ? { ...it, title: val } : it)));
                  }}
                  className="md:col-span-3 rounded border border-[#2C2C2C] bg-[#161616] px-2.5 py-1.5 text-white"
                />
                <input
                  value={tr.featuredArtists}
                  placeholder="Featured artists"
                  onChange={e => {
                    const val = e.target.value;
                    setCreditTracks(prev =>
                      prev.map((it, i) => (i === idx ? { ...it, featuredArtists: val } : it)),
                    );
                  }}
                  className="md:col-span-2 rounded border border-[#2C2C2C] bg-[#161616] px-2.5 py-1.5 text-neutral-300"
                />
                <input
                  value={tr.producer}
                  placeholder="Producer(s)"
                  onChange={e => {
                    const val = e.target.value;
                    setCreditTracks(prev => prev.map((it, i) => (i === idx ? { ...it, producer: val } : it)));
                  }}
                  className="md:col-span-2 rounded border border-[#2C2C2C] bg-[#161616] px-2.5 py-1.5 text-neutral-300"
                />
                <input
                  value={tr.songwriters}
                  placeholder="Songwriters"
                  onChange={e => {
                    const val = e.target.value;
                    setCreditTracks(prev => prev.map((it, i) => (i === idx ? { ...it, songwriters: val } : it)));
                  }}
                  className="md:col-span-2 rounded border border-[#2C2C2C] bg-[#161616] px-2.5 py-1.5 text-neutral-300"
                />
                <input
                  value={tr.isrc}
                  placeholder="ISRC"
                  onChange={e => {
                    const val = e.target.value;
                    setCreditTracks(prev => prev.map((it, i) => (i === idx ? { ...it, isrc: val } : it)));
                  }}
                  className="md:col-span-1 rounded border border-[#2C2C2C] bg-[#161616] px-2 py-1.5 text-neutral-300 font-mono"
                />
                <button
                  type="button"
                  disabled={creditTracks.length <= 1}
                  onClick={() =>
                    setCreditTracks(prev =>
                      prev
                        .filter((_, i) => i !== idx)
                        .map((item, newIdx) => ({ ...item, trackNumber: newIdx + 1 })),
                    )
                  }
                  aria-label="Remove track"
                  className="md:col-span-1 flex justify-end text-neutral-500 hover:text-red-300 disabled:opacity-30"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1A1A1A]">
            <button
              type="button"
              onClick={() =>
                generateTracklistCreditsPdf({
                  releaseTitle: creditsTitle,
                  artistName: workspace.name,
                  releaseType: creditsType,
                  releaseDate: creditsDate,
                  upc: creditsUpc,
                  isrc: creditsIsrc,
                  rightsInfo: creditsRights,
                  workspaceName: workspace.name,
                  tracks: creditTracks,
                })
              }
              className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
            >
              <ArrowDownToLine size={14} />
              <span>Export Tracklist Credits PDF</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveCreditsSheet()}
              className="inline-flex items-center gap-1.5 rounded border border-[#333] bg-[#141414] px-4 py-2 text-xs font-medium text-white hover:border-white disabled:opacity-50"
            >
              <FilePlus2 size={14} />
              <span>{saving ? 'Saving…' : 'Save Credits Sheet to Vault'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#2E2E2E] bg-[#0C0C0C] p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#1E1E1E] pb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  {previewDoc.type.replaceAll('_', ' ')} · {previewDoc.referenceNo}
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">{previewDoc.title}</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  {workspace.name} · {previewDoc.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                aria-label="Close document preview"
                className="rounded border border-[#2E2E2E] p-1.5 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="rounded border border-[#1E1E1E] bg-[#111] p-4 text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {previewDoc.bodyContent}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#1E1E1E]">
              <button
                type="button"
                onClick={() => generateCorporateDocumentPdf(previewDoc, workspace)}
                className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
              >
                <ArrowDownToLine size={13} />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded border border-[#333] bg-[#141414] px-4 py-2 text-xs text-neutral-200 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
