import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, getBlob, ref, uploadBytes } from 'firebase/storage';
import {
  ArrowDownToLine,
  Check,
  CheckSquare,
  Copy,
  ExternalLink,
  FilePlus2,
  ImagePlus,
  Layers,
  Music2,
  Palette,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  BrandAsset,
  BrandGuidelinesData,
  BrandWorkspaceProfile,
  ClientProject,
  CorporateDocument,
  DocumentItem,
  DocumentType,
  PaymentRecord,
  ProductionDeliverable,
  Workspace,
} from '../../types';
import type { AspectRatioType, CanvasDesign } from '../../types/designStudio';
import { db, storage } from '../../lib/firebase';
import { isInternalStoragePath } from '../../lib/productionPromotion';
import {
  buildBrandProductionPrefill,
  buildClientCanvasDesign,
  buildClientWorkspaceCanvasAssetMetadata,
  buildReleaseProductionPrefill,
  ProductionRequestPrefill,
} from '../../lib/clientOS';
import { generateBrandGuidelinesPdf, generateCorporateDocumentPdf } from '../../utils/pdfGenerator';
import { DesignCanvasEditor } from '../studio/DesignCanvasEditor';

export type ClientStudioSection =
  | 'artist-profile'
  | 'profile'
  | 'releases'
  | 'content'
  | 'assets'
  | 'brand'
  | 'documents'
  | 'invoices'
  | 'proposals';

export type ReleaseStatus = 'Draft' | 'Scheduled' | 'Live' | 'Archived';
export type ContentKind = 'Caption' | 'Lyrics' | 'Promotional copy' | 'Creative idea' | 'Social post' | 'Guideline';
export type ContentPhase = 'Pre-release' | 'Release day' | 'Post-release' | 'Ongoing';
export type ContentStatus = 'Draft' | 'In progress' | 'Ready' | 'Published';
export type StudioDocumentStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved'
  | 'Issued'
  | 'Partially Paid'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled'
  | 'Accepted'
  | 'Declined';

export interface StudioRelease {
  id: string;
  title: string;
  type: 'Single' | 'EP' | 'Album';
  releaseDate: string;
  trackList: string;
  featuredArtists?: string;
  producer?: string;
  songwriters?: string;
  rightsInfo?: string;
  artworkUrl: string;
  artworkPath?: string;
  streamingUrl: string;
  preSaveUrl: string;
  projectId?: string;
  status: ReleaseStatus;
  isrc: string;
  upc: string;
  checklist?: {
    audioMastered: boolean;
    artworkApproved: boolean;
    splitSheetSigned: boolean;
    metadataVerified: boolean;
    distributionSubmitted: boolean;
    pressKitReady: boolean;
    marketingAssetsReady: boolean;
  };
  statusHistory?: { status: ReleaseStatus; changedAt: string; changedBy: string }[];
  createdAt: string;
}

export interface StudioContentItem {
  id: string;
  title: string;
  kind: ContentKind;
  phase: ContentPhase;
  status: ContentStatus;
  releaseId: string;
  projectId?: string;
  deliverableId?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioAsset {
  id: string;
  name: string;
  category: string;
  fileType: BrandAsset['fileType'];
  mimeType: string;
  fileSize?: string;
  fileSizeBytes?: number;
  downloadUrl?: string;
  storagePath?: string;
  releaseId: string;
  projectId: string;
  status?: BrandAsset['status'];
  description: string;
  uploadedAt: string;
}

export interface StudioDocument {
  id: string;
  type: DocumentType;
  title: string;
  referenceNo: string;
  date: string;
  validityDate?: string;
  recipientName: string;
  recipientOrg: string;
  recipientEmail: string;
  projectId?: string;
  subject: string;
  bodyContent: string;
  items?: DocumentItem[];
  totalAmount?: number;
  totalPaid?: number;
  balanceDue?: number;
  payments?: PaymentRecord[];
  paymentTerms?: string;
  status: StudioDocumentStatus;
  clientAction?: 'Accepted' | 'Declined';
  clientActionDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ArtistProfileForm {
  biography: string;
  genre: string;
  profileImageUrl: string;
  profileImagePath?: string;
  instagram: string;
  spotify: string;
  appleMusic: string;
  youtube: string;
  website: string;
}

export interface ClientStudioExternalData {
  releases: StudioRelease[];
  contentItems: StudioContentItem[];
  assets: StudioAsset[];
  documents: StudioDocument[];
  loading: boolean;
  error?: string;
}

interface ClientStudioProps {
  section: ClientStudioSection;
  workspace: Workspace;
  uid: string;
  accountName: string;
  projects: ClientProject[];
  deliverables?: ProductionDeliverable[];
  primaryWorkspaceId?: string;
  externalData?: ClientStudioExternalData;
  onNavigateSection?: (section: ClientStudioSection | 'projects' | 'deliverables' | 'requests') => void;
  onRequestProduction?: (prefill: ProductionRequestPrefill) => void;
}

const EMPTY_ARTIST_PROFILE: ArtistProfileForm = {
  biography: '',
  genre: '',
  profileImageUrl: '',
  profileImagePath: '',
  instagram: '',
  spotify: '',
  appleMusic: '',
  youtube: '',
  website: '',
};

const EMPTY_BRAND_PROFILE: BrandWorkspaceProfile = {
  description: '',
  industry: '',
  website: '',
  logoUrl: '',
  logoPath: '',
  brandVoice: '',
  photographyDirection: '',
  graphicDesignPrinciples: '',
  usageGuidelines: '',
  creativeReferences: '',
};

const RELEASE_CHECKLIST_ITEMS: Array<{
  key: keyof NonNullable<StudioRelease['checklist']>;
  label: string;
}> = [
  { key: 'audioMastered', label: 'Audio mastered' },
  { key: 'artworkApproved', label: 'Cover artwork approved' },
  { key: 'splitSheetSigned', label: 'Split sheet signed' },
  { key: 'metadataVerified', label: 'ISRC / UPC metadata verified' },
  { key: 'distributionSubmitted', label: 'Distribution submitted' },
  { key: 'pressKitReady', label: 'Press kit ready' },
  { key: 'marketingAssetsReady', label: 'Promo assets ready' },
];

const panelClass = 'rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 sm:p-6';
const fieldClass =
  'w-full rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF1E1E] transition-colors';
const labelClass = 'mb-1.5 block text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-neutral-500';

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isArtistWorkspace(workspace: Workspace): boolean {
  return workspace.clientCategory === 'artist' || workspace.type === 'Artist' || workspace.type === 'Personal';
}

function fileSizeLabel(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileTypeFromMime(mimeType: string): BrandAsset['fileType'] {
  if (mimeType === 'image/svg+xml') return 'SVG';
  if (mimeType === 'image/png') return 'PNG';
  if (mimeType === 'image/jpeg') return 'JPEG';
  if (mimeType === 'image/webp') return 'WEBP';
  if (mimeType === 'image/gif') return 'GIF';
  if (mimeType === 'image/avif') return 'AVIF';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'application/json') return 'JSON';
  if (mimeType.startsWith('video/')) return mimeType === 'video/quicktime' ? 'MOV' : mimeType === 'video/webm' ? 'WEBM' : 'MP4';
  if (mimeType.startsWith('audio/')) {
    return mimeType === 'audio/wav' || mimeType === 'audio/x-wav'
      ? 'WAV'
      : mimeType === 'audio/aac'
        ? 'AAC'
        : mimeType === 'audio/flac'
          ? 'FLAC'
          : 'MP3';
  }
  if (mimeType.includes('zip')) return 'ZIP';
  if (mimeType.startsWith('font/')) return 'FONT';
  return 'TEXT';
}

function downloadText(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function canvasDraftStorageKey(workspaceId: string): string {
  return `keedohub_client_canvas_drafts_${workspaceId}`;
}

function loadClientCanvasDrafts(workspaceId: string): CanvasDesign[] {
  try {
    const raw = localStorage.getItem(canvasDraftStorageKey(workspaceId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const ClientStudio: React.FC<ClientStudioProps> = ({
  section,
  workspace,
  uid,
  accountName,
  projects,
  deliverables = [],
  primaryWorkspaceId,
  externalData,
  onNavigateSection,
  onRequestProduction,
}) => {
  const [artistProfile, setArtistProfile] = useState<ArtistProfileForm>(EMPTY_ARTIST_PROFILE);
  const [brandProfile, setBrandProfile] = useState<BrandWorkspaceProfile>(EMPTY_BRAND_PROFILE);
  const [brandForm, setBrandForm] = useState(workspace.brand);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [failedReleaseCoverIds, setFailedReleaseCoverIds] = useState<Record<string, boolean>>({});
  const [failedAssetIds, setFailedAssetIds] = useState<Record<string, boolean>>({});
  const [failedDeliverableIds, setFailedDeliverableIds] = useState<Record<string, boolean>>({});
  const [copiedTokenKey, setCopiedTokenKey] = useState('');
  const [copiedContentId, setCopiedContentId] = useState('');
  const [loadingAssetId, setLoadingAssetId] = useState('');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef(new Map<string, string>());

  const [internalReleases, setInternalReleases] = useState<StudioRelease[]>([]);
  const [internalContentItems, setInternalContentItems] = useState<StudioContentItem[]>([]);
  const [internalAssets, setInternalAssets] = useState<StudioAsset[]>([]);
  const [internalDocuments, setInternalDocuments] = useState<StudioDocument[]>([]);
  const [internalLoading, setInternalLoading] = useState(!externalData);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  // Release catalog state
  const [releaseEditingId, setReleaseEditingId] = useState('');
  const [releaseForm, setReleaseForm] = useState({
    title: '',
    type: 'Single' as StudioRelease['type'],
    releaseDate: '',
    trackList: '',
    featuredArtists: '',
    producer: '',
    songwriters: '',
    rightsInfo: '',
    artworkUrl: '',
    artworkPath: '',
    streamingUrl: '',
    preSaveUrl: '',
    projectId: '',
    status: 'Draft' as ReleaseStatus,
    isrc: '',
    upc: '',
  });
  const [releaseFilter, setReleaseFilter] = useState<'All' | ReleaseStatus>('All');

  // Content engine / creative system state
  const [contentEditingId, setContentEditingId] = useState('');
  const [contentPhaseFilter, setContentPhaseFilter] = useState<'All' | ContentPhase>('All');
  const [contentSearch, setContentSearch] = useState('');
  const [contentForm, setContentForm] = useState({
    title: '',
    kind: 'Caption' as ContentKind,
    phase: (isArtistWorkspace(workspace) ? 'Pre-release' : 'Ongoing') as ContentPhase,
    status: 'Draft' as ContentStatus,
    releaseId: '',
    projectId: '',
    deliverableId: '',
    body: '',
  });

  // Canvas overlay state for client content/creative graphics
  const [canvasDrafts, setCanvasDrafts] = useState<CanvasDesign[]>(() => loadClientCanvasDrafts(workspace.id));
  const [activeCanvasDesign, setActiveCanvasDesign] = useState<CanvasDesign | null>(null);
  const [canvasLinkedReleaseId, setCanvasLinkedReleaseId] = useState('');

  // Business documents sub-view
  const [docSubTab, setDocSubTab] = useState<'all' | 'proposals' | 'invoices' | 'corporate'>('all');
  const [previewDocument, setPreviewDocument] = useState<StudioDocument | null>(null);
  const [documentEditingId, setDocumentEditingId] = useState('');
  const [documentForm, setDocumentForm] = useState({
    type: 'invoice' as DocumentType,
    title: '',
    referenceNo: '',
    date: new Date().toISOString().slice(0, 10),
    recipientName: '',
    recipientOrg: '',
    recipientEmail: '',
    projectId: '',
    subject: '',
    bodyContent: '',
    totalAmount: 0,
    paymentTerms: 'Net 30 days',
    status: 'Draft' as StudioDocumentStatus,
  });

  // Asset Library filters & upload form
  const [assetCategory, setAssetCategory] = useState(isArtistWorkspace(workspace) ? 'Artwork' : 'Logo');
  const [assetReleaseId, setAssetReleaseId] = useState('');
  const [assetProjectId, setAssetProjectId] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetFilterCategory, setAssetFilterCategory] = useState('All');
  const [assetFilterStatus, setAssetFilterStatus] = useState<'All' | 'Approved' | 'Review' | 'Draft'>('All');
  const [assetSearch, setAssetSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const releases = externalData ? externalData.releases : internalReleases;
  const contentItems = externalData ? externalData.contentItems : internalContentItems;
  const assets = externalData ? externalData.assets : internalAssets;
  const documents = externalData ? externalData.documents : internalDocuments;
  const loading = externalData ? externalData.loading : internalLoading;

  useEffect(() => {
    setArtistProfile({ ...EMPTY_ARTIST_PROFILE, ...workspace.artistProfile });
    setBrandProfile({
      ...EMPTY_BRAND_PROFILE,
      ...workspace.brandProfile,
      description: workspace.brandProfile?.description ?? workspace.description ?? '',
    });
    setBrandForm(workspace.brand);
    setWorkspaceName(workspace.name);
  }, [workspace]);

  useEffect(() => {
    setCanvasDrafts(loadClientCanvasDrafts(workspace.id));
    setAssetCategory(isArtistWorkspace(workspace) ? 'Artwork' : 'Logo');
    setContentForm(prev =>
      contentEditingId || prev.title || prev.body
        ? prev
        : { ...prev, phase: isArtistWorkspace(workspace) ? 'Pre-release' : 'Ongoing' },
    );
  }, [workspace.id, workspace.type, workspace.clientCategory]);

  useEffect(() => {
    const storedPath = isArtistWorkspace(workspace)
      ? workspace.artistProfile?.profileImagePath
      : workspace.brandProfile?.logoPath;
    const externalUrl = isArtistWorkspace(workspace)
      ? workspace.artistProfile?.profileImageUrl
      : workspace.brandProfile?.logoUrl;
    let active = true;
    let objectUrl = '';
    setProfileImageFailed(false);
    if (!storedPath) {
      setProfileImagePreview(externalUrl || '');
      return () => {
        active = false;
      };
    }
    void getBlob(ref(storage, storedPath))
      .then(blob => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setProfileImagePreview(objectUrl);
      })
      .catch(loadError => {
        if (active) setError(messageFromError(loadError));
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [workspace]);

  useEffect(() => {
    setPreviewUrls({});
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, [workspace.id]);

  // Standalone fallback listener only if externalData was not provided
  useEffect(() => {
    if (externalData) {
      if (externalData.error) setError(externalData.error);
      return;
    }
    if (workspace.status === 'Paused' || workspace.status === 'Archived') {
      setInternalLoading(false);
      setError(`This workspace is ${workspace.status.toLowerCase()} and its creative records are temporarily unavailable.`);
      return;
    }
    setInternalLoading(true);
    setError('');
    const base = doc(db, 'workspaces', workspace.id);
    const unsubscribers = [
      onSnapshot(
        collection(base, 'releases'),
        snapshot => {
          setInternalReleases(
            snapshot.docs.map(item => {
              const data = item.data();
              const status: ReleaseStatus = ['Draft', 'Scheduled', 'Live', 'Archived'].includes(data.status)
                ? data.status
                : data.distributionStatus === 'Live'
                  ? 'Live'
                  : data.distributionStatus === 'Scheduled'
                    ? 'Scheduled'
                    : 'Draft';
              return {
                id: item.id,
                ...data,
                type: ['Single', 'EP', 'Album'].includes(data.type) ? data.type : 'Single',
                releaseDate: data.releaseDate || data.plannedReleaseDate || '',
                trackList: data.trackList || data.releaseNotes || '',
                streamingUrl: data.streamingUrl || data.publicUrl || '',
                status,
              } as StudioRelease;
            }),
          );
          setInternalLoading(false);
        },
        err => {
          setError(messageFromError(err));
          setInternalLoading(false);
        },
      ),
      onSnapshot(
        collection(base, 'contentItems'),
        snapshot => {
          setInternalContentItems(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StudioContentItem)));
          setInternalLoading(false);
        },
        err => {
          setError(messageFromError(err));
          setInternalLoading(false);
        },
      ),
      onSnapshot(
        query(collection(base, 'brandAssets'), where('isInternal', '==', false)),
        snapshot => {
          setInternalAssets(
            snapshot.docs
              .map(item => ({ id: item.id, ...item.data() } as StudioAsset))
              .filter(asset => !isInternalStoragePath(asset.storagePath)),
          );
          setInternalLoading(false);
        },
        err => {
          setError(messageFromError(err));
          setInternalLoading(false);
        },
      ),
      onSnapshot(
        collection(base, 'documents'),
        snapshot => {
          setInternalDocuments(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StudioDocument)));
          setInternalLoading(false);
        },
        err => {
          setError(messageFromError(err));
          setInternalLoading(false);
        },
      ),
    ];
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [externalData, workspace.id, workspace.status]);

  const showNotice = (msg: string) => {
    setError('');
    setNotice(msg);
  };

  const saveWorkspace = async (updates: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', workspace.id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      // Preserve personal login displayName & photoURL — only sync workspace organizationName if primary workspace
      if (workspace.id === primaryWorkspaceId && typeof updates.name === 'string') {
        batch.update(doc(db, 'clientProfiles', uid), {
          organizationName: updates.name,
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
      return true;
    } catch (saveError) {
      setError(messageFromError(saveError));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveArtistProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspaceName.trim()) {
      setError('Artist name is required.');
      return;
    }
    const saved = await saveWorkspace({
      name: workspaceName.trim(),
      brand: { ...workspace.brand, name: workspaceName.trim() },
      artistProfile,
    });
    if (saved) showNotice('Artist profile saved.');
  };

  const saveBrandProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspaceName.trim()) {
      setError('Brand name is required.');
      return;
    }
    if (
      ![brandForm.primaryColor, brandForm.secondaryColor, brandForm.accentColor || '#FF1E1E'].every(color =>
        /^#[0-9a-fA-F]{6}$/.test(color),
      )
    ) {
      setError('Brand colors must be valid six-digit hex values.');
      return;
    }
    const saved = await saveWorkspace({
      name: workspaceName.trim(),
      description: brandProfile.description,
      brand: { ...brandForm, name: workspaceName.trim(), logoUrl: brandProfile.logoUrl },
      brandProfile,
    });
    if (saved) showNotice('Brand identity saved.');
  };

  const setReleaseField = <K extends keyof typeof releaseForm>(key: K, value: (typeof releaseForm)[K]) => {
    setReleaseForm(previous => ({ ...previous, [key]: value }));
  };

  const resetReleaseForm = () => {
    setReleaseEditingId('');
    setReleaseForm({
      title: '',
      type: 'Single',
      releaseDate: '',
      trackList: '',
      featuredArtists: '',
      producer: '',
      songwriters: '',
      rightsInfo: '',
      artworkUrl: '',
      artworkPath: '',
      streamingUrl: '',
      preSaveUrl: '',
      projectId: '',
      status: 'Draft',
      isrc: '',
      upc: '',
    });
  };

  const editRelease = (release: StudioRelease) => {
    setReleaseEditingId(release.id);
    setReleaseForm({
      title: release.title || '',
      type: release.type || 'Single',
      releaseDate: release.releaseDate || '',
      trackList: release.trackList || '',
      featuredArtists: release.featuredArtists || '',
      producer: release.producer || '',
      songwriters: release.songwriters || '',
      rightsInfo: release.rightsInfo || '',
      artworkUrl: release.artworkUrl || '',
      artworkPath: release.artworkPath || '',
      streamingUrl: release.streamingUrl || '',
      preSaveUrl: release.preSaveUrl || '',
      projectId: release.projectId || '',
      status: release.status || 'Draft',
      isrc: release.isrc || '',
      upc: release.upc || '',
    });
  };

  const saveRelease = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!releaseForm.title.trim()) return;
    setSaving(true);
    setError('');
    setNotice('');
    const now = new Date().toISOString();
    const existingRelease = releases.find(release => release.id === releaseEditingId);
    const statusHistory = [
      ...(existingRelease?.statusHistory || []),
      ...(existingRelease && existingRelease.status !== releaseForm.status
        ? [{ status: releaseForm.status, changedAt: now, changedBy: accountName }]
        : !existingRelease
          ? [{ status: releaseForm.status, changedAt: now, changedBy: accountName }]
          : []),
    ];
    const combinedCredits = [
      releaseForm.featuredArtists.trim() ? `Featuring: ${releaseForm.featuredArtists.trim()}` : '',
      releaseForm.producer.trim() ? `Producer: ${releaseForm.producer.trim()}` : '',
      releaseForm.songwriters.trim() ? `Songwriters: ${releaseForm.songwriters.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const payload = {
      ...releaseForm,
      title: releaseForm.title.trim(),
      featuredArtists: releaseForm.featuredArtists.trim(),
      producer: releaseForm.producer.trim(),
      songwriters: releaseForm.songwriters.trim(),
      rightsInfo: releaseForm.rightsInfo.trim(),
      credits: combinedCredits,
      workspaceId: workspace.id,
      artistName: workspace.name,
      artistId: workspace.id,
      plannedReleaseDate: releaseForm.releaseDate,
      distributionStatus:
        releaseForm.status === 'Live' ? 'Live' : releaseForm.status === 'Scheduled' ? 'Scheduled' : 'Planning',
      releaseNotes: releaseForm.trackList,
      publicUrl: releaseForm.streamingUrl,
      marketingAssetsCount: assets.filter(asset => asset.releaseId === releaseEditingId).length,
      checklist: {
        audioMastered: existingRelease?.checklist?.audioMastered ?? false,
        artworkApproved:
          existingRelease?.checklist?.artworkApproved ?? Boolean(releaseForm.artworkUrl || releaseForm.artworkPath),
        splitSheetSigned: existingRelease?.checklist?.splitSheetSigned ?? false,
        metadataVerified: existingRelease?.checklist?.metadataVerified ?? Boolean(releaseForm.isrc || releaseForm.upc),
        distributionSubmitted:
          existingRelease?.checklist?.distributionSubmitted ??
          (releaseForm.status === 'Scheduled' || releaseForm.status === 'Live'),
        pressKitReady: existingRelease?.checklist?.pressKitReady ?? false,
        marketingAssetsReady: existingRelease?.checklist?.marketingAssetsReady ?? false,
      },
      statusHistory,
      createdAt: now,
      updatedAt: now,
    };
    try {
      if (releaseEditingId) {
        const { createdAt: _createdAt, ...updates } = payload;
        await updateDoc(doc(db, 'workspaces', workspace.id, 'releases', releaseEditingId), updates);
        showNotice(`Updated release "${releaseForm.title.trim()}".`);
      } else {
        await addDoc(collection(db, 'workspaces', workspace.id, 'releases'), payload);
        showNotice(`Created release "${releaseForm.title.trim()}".`);
      }
      resetReleaseForm();
    } catch (saveError) {
      setError(messageFromError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const toggleReleaseChecklist = async (
    release: StudioRelease,
    key: keyof NonNullable<StudioRelease['checklist']>,
  ) => {
    setError('');
    const currentChecklist = {
      audioMastered: false,
      artworkApproved: false,
      splitSheetSigned: false,
      metadataVerified: false,
      distributionSubmitted: false,
      pressKitReady: false,
      marketingAssetsReady: false,
      ...release.checklist,
    };
    try {
      await updateDoc(doc(db, 'workspaces', workspace.id, 'releases', release.id), {
        checklist: {
          ...currentChecklist,
          [key]: !currentChecklist[key],
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      setError(messageFromError(updateError));
    }
  };

  const setContentField = <K extends keyof typeof contentForm>(key: K, value: (typeof contentForm)[K]) => {
    setContentForm(previous => ({ ...previous, [key]: value }));
  };

  const editContent = (item: StudioContentItem) => {
    setContentEditingId(item.id);
    setContentForm({
      title: item.title,
      kind: item.kind,
      phase: item.phase,
      status: item.status,
      releaseId: item.releaseId || '',
      projectId: item.projectId || '',
      deliverableId: item.deliverableId || '',
      body: item.body,
    });
  };

  const resetContentForm = () => {
    setContentEditingId('');
    setContentForm({
      title: '',
      kind: 'Caption',
      phase: isArtist ? 'Pre-release' : 'Ongoing',
      status: 'Draft',
      releaseId: '',
      projectId: '',
      deliverableId: '',
      body: '',
    });
  };

  const saveContent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!contentForm.title.trim() || !contentForm.body.trim()) return;
    setSaving(true);
    setError('');
    setNotice('');
    const now = new Date().toISOString();
    const payload = {
      ...contentForm,
      title: contentForm.title.trim(),
      workspaceId: workspace.id,
      updatedAt: now,
    };
    try {
      if (contentEditingId) {
        await updateDoc(doc(db, 'workspaces', workspace.id, 'contentItems', contentEditingId), payload);
        showNotice('Content item saved.');
      } else {
        await addDoc(collection(db, 'workspaces', workspace.id, 'contentItems'), { ...payload, createdAt: now });
        showNotice('Added creative material.');
      }
      resetContentForm();
    } catch (saveError) {
      setError(messageFromError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const persistCanvasDraft = (design: CanvasDesign) => {
    const next = [design, ...canvasDrafts.filter(d => d.id !== design.id)].slice(0, 20);
    setCanvasDrafts(next);
    try {
      localStorage.setItem(canvasDraftStorageKey(workspace.id), JSON.stringify(next));
    } catch {
      // Ignore quota errors gracefully
    }
  };

  const removeCanvasDraft = (designId: string) => {
    const next = canvasDrafts.filter(d => d.id !== designId);
    setCanvasDrafts(next);
    try {
      localStorage.setItem(canvasDraftStorageKey(workspace.id), JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const saveCanvasToWorkspaceLibrary = async (blob: Blob, design: CanvasDesign) => {
    setError('');
    if (blob.size <= 0 || blob.size >= 50 * 1024 * 1024) {
      throw new Error('Rendered artwork must be smaller than 50 MB.');
    }
    const assetId = crypto.randomUUID();
    const safeName = `${design.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'canvas-graphic'}.png`;
    const storagePath = `workspaces/${workspace.id}/assets/${assetId}/${safeName}`;
    await uploadBytes(ref(storage, storagePath), blob, { contentType: 'image/png' });

    const linkedRelease = canvasLinkedReleaseId ? releaseById.get(canvasLinkedReleaseId) : undefined;
    const record = buildClientWorkspaceCanvasAssetMetadata({
      workspaceId: workspace.id,
      assetId,
      name: design.name,
      storagePath,
      fileSizeBytes: blob.size,
      uid,
      category: 'Promotional',
      releaseId: canvasLinkedReleaseId,
      projectId: linkedRelease?.projectId || '',
      description: `Created in ${isArtist ? 'Artist OS' : 'Brand OS'} Design Canvas (${design.aspectRatio}).`,
    });

    await setDoc(doc(db, 'workspaces', workspace.id, 'brandAssets', assetId), record);
    persistCanvasDraft(design);
    showNotice(`Saved "${design.name}" to your Asset Library.`);
  };

  const openCanvasForStudio = (options?: {
    title?: string;
    subtitle?: string;
    aspectRatio?: AspectRatioType;
    releaseId?: string;
    existingDraft?: CanvasDesign;
  }) => {
    setCanvasLinkedReleaseId(options?.releaseId || '');
    if (options?.existingDraft) {
      setActiveCanvasDesign({ ...options.existingDraft, workspaceId: workspace.id });
      return;
    }
    const draft = buildClientCanvasDesign({
      workspace,
      isArtist,
      title: options?.title,
      subtitle: options?.subtitle,
      aspectRatio: options?.aspectRatio,
      linkedReleaseId: options?.releaseId,
    });
    setActiveCanvasDesign(draft);
  };

  const editDocument = (item: StudioDocument) => {
    setDocumentEditingId(item.id);
    setDocumentForm({
      type: item.type,
      title: item.title,
      referenceNo: item.referenceNo,
      date: item.date,
      recipientName: item.recipientName,
      recipientOrg: item.recipientOrg || '',
      recipientEmail: item.recipientEmail || '',
      projectId: item.projectId || '',
      subject: item.subject || '',
      bodyContent: item.bodyContent,
      totalAmount: item.totalAmount || 0,
      paymentTerms: item.paymentTerms || 'Net 30 days',
      status: item.status,
    });
  };

  const resetDocumentForm = () => {
    setDocumentEditingId('');
    setDocumentForm({
      type: 'invoice',
      title: '',
      referenceNo: '',
      date: new Date().toISOString().slice(0, 10),
      recipientName: '',
      recipientOrg: '',
      recipientEmail: '',
      projectId: '',
      subject: '',
      bodyContent: '',
      totalAmount: 0,
      paymentTerms: 'Net 30 days',
      status: 'Draft',
    });
  };

  const saveDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!documentForm.title.trim() || !documentForm.recipientName.trim()) return;
    setSaving(true);
    setError('');
    setNotice('');
    const now = new Date().toISOString();
    const payload = {
      ...documentForm,
      title: documentForm.title.trim(),
      workspaceId: workspace.id,
      authorName: accountName,
      authorRole: 'Workspace Owner',
      updatedAt: now,
    };
    try {
      if (documentEditingId) {
        await updateDoc(doc(db, 'workspaces', workspace.id, 'documents', documentEditingId), payload);
        showNotice('Document saved.');
      } else {
        await addDoc(collection(db, 'workspaces', workspace.id, 'documents'), { ...payload, createdAt: now });
        showNotice('Document created.');
      }
      resetDocumentForm();
    } catch (saveError) {
      setError(messageFromError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const uploadAsset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size >= 50 * 1024 * 1024) {
      setError('Choose a file smaller than 50 MB.');
      return;
    }
    if (
      !/^(image\/(jpeg|png|svg\+xml|webp|gif|avif)|audio\/(mpeg|wav|x-wav|aac|flac|mp4|m4a|ogg)|video\/(mp4|webm|quicktime)|application\/(pdf|json|xml|zip|x-zip-compressed|font-woff)|font\/(ttf|otf|woff|woff2)|text\/(plain|xml))$/.test(
        file.type,
      )
    ) {
      setError('This file type is not supported. Use an image, audio/video, PDF, archive, font or text asset.');
      return;
    }
    setUploading(true);
    setError('');
    setNotice('');
    const assetId = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `workspaces/${workspace.id}/assets/${assetId}/${safeName}`;
    let uploaded = false;
    let assetSaved = false;
    try {
      await uploadBytes(ref(storage, storagePath), file, { contentType: file.type });
      uploaded = true;
      await setDoc(doc(db, 'workspaces', workspace.id, 'brandAssets', assetId), {
        id: assetId,
        workspaceId: workspace.id,
        name: file.name,
        category: assetCategory,
        mimeType: file.type,
        fileType: fileTypeFromMime(file.type),
        fileSize: fileSizeLabel(file.size),
        fileSizeBytes: file.size,
        storagePath,
        version: '1.0',
        status: 'Draft',
        dimensions: '',
        usageRules: '',
        isVector: file.type === 'image/svg+xml' || file.type === 'application/pdf',
        releaseId: assetReleaseId,
        projectId: assetProjectId,
        description: assetDescription.trim(),
        isInternal: false,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uid,
      });
      assetSaved = true;
      if (assetReleaseId && assetCategory === 'Artwork') {
        await updateDoc(doc(db, 'workspaces', workspace.id, 'releases', assetReleaseId), {
          artworkPath: storagePath,
          updatedAt: new Date().toISOString(),
        });
      }
      setAssetDescription('');
      showNotice(`Uploaded "${file.name}" to workspace library.`);
    } catch (uploadError) {
      if (uploaded && !assetSaved) {
        try {
          await deleteObject(ref(storage, storagePath));
        } catch (cleanupError) {
          setError(
            `${messageFromError(uploadError)} The uploaded file could not be cleaned up: ${messageFromError(cleanupError)}`,
          );
          return;
        }
      }
      setError(messageFromError(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const removeAsset = async (asset: StudioAsset) => {
    setError('');
    setNotice('');
    try {
      if (asset.storagePath) await deleteObject(ref(storage, asset.storagePath));
      await deleteDoc(doc(db, 'workspaces', workspace.id, 'brandAssets', asset.id));
      showNotice(`Removed "${asset.name}".`);
    } catch (removeError) {
      setError(messageFromError(removeError));
    }
  };

  const setAssetAsImage = async (asset: StudioAsset, target: 'artist' | 'brand') => {
    setError('');
    setNotice('');
    try {
      if (!asset.storagePath) throw new Error('This asset does not have a private workspace storage path.');
      const field = target === 'artist' ? 'artistProfile.profileImagePath' : 'brandProfile.logoPath';
      const urlField = target === 'artist' ? 'artistProfile.profileImageUrl' : 'brandProfile.logoUrl';
      await updateDoc(doc(db, 'workspaces', workspace.id), {
        [field]: asset.storagePath,
        [urlField]: '',
        updatedAt: new Date().toISOString(),
      });
      showNotice(target === 'artist' ? 'Updated artist profile image.' : 'Updated brand logo.');
    } catch (updateError) {
      setError(messageFromError(updateError));
    }
  };

  const removeRecord = async (collectionName: string, id: string) => {
    setError('');
    setNotice('');
    try {
      await deleteDoc(doc(db, 'workspaces', workspace.id, collectionName, id));
    } catch (removeError) {
      setError(messageFromError(removeError));
    }
  };

  const releaseById = useMemo(() => new Map(releases.map(release => [release.id, release])), [releases]);
  const projectById = useMemo(() => new Map(projects.map(project => [project.id, project])), [projects]);
  const deliverableById = useMemo(() => new Map(deliverables.map(item => [item.id, item])), [deliverables]);
  const imageAssets = useMemo(() => assets.filter(asset => asset.mimeType?.startsWith('image/')), [assets]);

  const isArtist = isArtistWorkspace(workspace);
  const isCompany = workspace.clientCategory === 'business' || workspace.type === 'Business' || workspace.type === 'Enterprise';
  const isBrand =
    workspace.clientCategory === 'brand' ||
    workspace.type === 'Brand' ||
    workspace.type === 'Agency' ||
    isCompany;

  const copyTextValue = async (text: string, marker: string, kind: 'token' | 'content') => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === 'token') {
        setCopiedTokenKey(marker);
        window.setTimeout(() => setCopiedTokenKey(prev => (prev === marker ? '' : prev)), 1500);
      } else {
        setCopiedContentId(marker);
        window.setTimeout(() => setCopiedContentId(prev => (prev === marker ? '' : prev)), 1500);
      }
    } catch {
      setError('Clipboard copy was blocked by the browser.');
    }
  };

  const loadAssetUrl = async (asset: StudioAsset): Promise<string> => {
    const cachedUrl = previewUrlsRef.current.get(asset.id);
    if (cachedUrl) return cachedUrl;
    if (!asset.storagePath) {
      if (asset.downloadUrl) return asset.downloadUrl;
      throw new Error('This asset has no available file.');
    }
    setLoadingAssetId(asset.id);
    try {
      const blob = await getBlob(ref(storage, asset.storagePath));
      const url = URL.createObjectURL(blob);
      previewUrlsRef.current.set(asset.id, url);
      setPreviewUrls(previous => ({ ...previous, [asset.id]: url }));
      return url;
    } finally {
      setLoadingAssetId('');
    }
  };

  const downloadAsset = async (asset: StudioAsset) => {
    setError('');
    try {
      const url = await loadAssetUrl(asset);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = asset.name;
      anchor.click();
    } catch (downloadError) {
      setError(messageFromError(downloadError));
    }
  };

  const saveStatus = async (collectionName: string, id: string, status: string) => {
    setError('');
    try {
      await updateDoc(doc(db, 'workspaces', workspace.id, collectionName, id), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      setError(messageFromError(updateError));
    }
  };

  const setReleaseStatus = async (release: StudioRelease, status: ReleaseStatus) => {
    setError('');
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'workspaces', workspace.id, 'releases', release.id), {
        status,
        distributionStatus: status === 'Live' ? 'Live' : status === 'Scheduled' ? 'Scheduled' : 'Planning',
        statusHistory: [...(release.statusHistory || []), { status, changedAt: now, changedBy: accountName }],
        updatedAt: now,
      });
    } catch (updateError) {
      setError(messageFromError(updateError));
    }
  };

  const handleClientProposalAction = async (docId: string, action: 'Accepted' | 'Declined') => {
    setError('');
    setNotice('');
    try {
      await updateDoc(doc(db, 'workspaces', workspace.id, 'documents', docId), {
        clientAction: action,
        clientActionDate: new Date().toISOString(),
        status: action === 'Accepted' ? 'Accepted' : 'Declined',
        updatedAt: new Date().toISOString(),
      });
      showNotice(`Proposal ${action.toLowerCase()}.`);
    } catch (err) {
      setError(messageFromError(err));
    }
  };

  const renderProfile = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Catalog Releases</p>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{releases.length}</p>
        </div>
        <div className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Live Releases</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-400 tabular-nums">
            {releases.filter(r => r.status === 'Live').length}
          </p>
        </div>
        <div className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Content Pieces</p>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{contentItems.length}</p>
        </div>
        <div className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Artist Assets</p>
          <p className="mt-1.5 text-2xl font-black text-white tabular-nums">{assets.length}</p>
        </div>
      </div>

      <form onSubmit={saveArtistProfile} className={`${panelClass} space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1E1E1E] pb-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">Artist OS · Identity</p>
            <h2 className="mt-1 text-xl font-bold text-white">Artist Profile &amp; Sound Identity</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Represents your recording artist persona for releases and production briefs. Personal login details live separately under Account Profile &amp; Settings.
            </p>
          </div>
          {profileImagePreview && !profileImageFailed && (
            <img
              src={profileImagePreview}
              alt={`${workspace.name} profile`}
              referrerPolicy="no-referrer"
              onError={() => setProfileImageFailed(true)}
              className="h-16 w-16 rounded-full border border-[#333] object-cover shrink-0"
            />
          )}
        </div>

        {(artistProfile.spotify || artistProfile.appleMusic || artistProfile.youtube || artistProfile.instagram || artistProfile.website) && (
          <div className="flex flex-wrap items-center gap-2 rounded border border-[#1E1E1E] bg-[#101010] px-3.5 py-2.5 text-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mr-1">Verified Channels:</span>
            {[
              { label: 'Spotify', url: artistProfile.spotify },
              { label: 'Apple Music', url: artistProfile.appleMusic },
              { label: 'YouTube', url: artistProfile.youtube },
              { label: 'Instagram', url: artistProfile.instagram },
              { label: 'Website', url: artistProfile.website },
            ]
              .filter(ch => Boolean(ch.url))
              .map(ch => (
                <a
                  key={ch.label}
                  href={ch.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-[#2C2C2C] bg-[#151515] px-2.5 py-1 text-neutral-200 hover:border-[#FF1E1E] hover:text-white transition-colors"
                >
                  <span>{ch.label}</span>
                  <ExternalLink size={11} />
                </a>
              ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              openCanvasForStudio({
                title: workspaceName || workspace.name,
                subtitle: artistProfile.genre ? artistProfile.genre.toUpperCase() : 'OFFICIAL ARTIST VISUAL',
                aspectRatio: '1:1 Square',
              })
            }
            className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E] transition-colors"
          >
            <Sparkles size={13} />
            <span>Open Artist Canvas</span>
          </button>
          {onRequestProduction && (
            <button
              type="button"
              onClick={() =>
                onRequestProduction({
                  title: `${workspaceName || workspace.name} — Artist Press Kit & Promo Graphics`,
                  category: 'Artist Promotional Graphics',
                  description: [
                    `Promotional graphics & EPK brief for ${workspaceName || workspace.name}.`,
                    artistProfile.genre ? `Genre: ${artistProfile.genre}` : '',
                    artistProfile.biography ? `Artist bio:\n${artistProfile.biography.slice(0, 800)}` : '',
                  ]
                    .filter(Boolean)
                    .join('\n\n'),
                  references: [artistProfile.spotify, artistProfile.instagram, artistProfile.website].filter(Boolean).join('\n'),
                })
              }
              className="inline-flex items-center gap-1.5 rounded border border-red-500/40 bg-red-950/20 px-3 py-2 text-xs font-medium text-red-200 hover:text-white transition-colors"
            >
              <Plus size={13} />
              <span>Request Promo / Press Kit</span>
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Artist / Stage Name</span>
            <input required value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Primary Genre</span>
            <input
              value={artistProfile.genre}
              onChange={event => setArtistProfile(value => ({ ...value, genre: event.target.value }))}
              className={fieldClass}
              placeholder="Alternative R&B, Afrobeats…"
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Artist Biography</span>
            <textarea
              rows={5}
              maxLength={4000}
              value={artistProfile.biography}
              onChange={event => setArtistProfile(value => ({ ...value, biography: event.target.value }))}
              className={fieldClass}
              placeholder="Share your sound, story and point of view."
            />
          </label>
          <label>
            <span className={labelClass}>Instagram URL</span>
            <input
              type="url"
              value={artistProfile.instagram}
              onChange={event => setArtistProfile(value => ({ ...value, instagram: event.target.value }))}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <label>
            <span className={labelClass}>Spotify URL</span>
            <input
              type="url"
              value={artistProfile.spotify}
              onChange={event => setArtistProfile(value => ({ ...value, spotify: event.target.value }))}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <label>
            <span className={labelClass}>Apple Music URL</span>
            <input
              type="url"
              value={artistProfile.appleMusic}
              onChange={event => setArtistProfile(value => ({ ...value, appleMusic: event.target.value }))}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <label>
            <span className={labelClass}>YouTube URL</span>
            <input
              type="url"
              value={artistProfile.youtube}
              onChange={event => setArtistProfile(value => ({ ...value, youtube: event.target.value }))}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <label>
            <span className={labelClass}>Official Website</span>
            <input
              type="url"
              value={artistProfile.website}
              onChange={event => setArtistProfile(value => ({ ...value, website: event.target.value }))}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <label>
            <span className={labelClass}>Profile Image URL</span>
            <input
              type="url"
              value={artistProfile.profileImageUrl}
              onChange={event =>
                setArtistProfile(value => ({ ...value, profileImageUrl: event.target.value, profileImagePath: '' }))
              }
              className={fieldClass}
              placeholder="Select from Asset Library or paste URL"
            />
          </label>
          {imageAssets.length > 0 && (
            <label className="sm:col-span-2">
              <span className={labelClass}>Or Choose From Workspace Asset Library</span>
              <select
                value={artistProfile.profileImagePath || ''}
                onChange={event =>
                  setArtistProfile(value => ({
                    ...value,
                    profileImagePath: event.target.value,
                    profileImageUrl: event.target.value ? '' : value.profileImageUrl,
                  }))
                }
                className={fieldClass}
              >
                <option value="">Custom URL / Keep current</option>
                {imageAssets.map(asset => (
                  <option key={asset.id} value={asset.storagePath || ''}>
                    {asset.name} ({asset.category})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <button
          disabled={saving}
          className="inline-flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save artist profile'}
        </button>
      </form>
    </div>
  );

  const renderBrandIdentity = () => (
    <div className="space-y-5">
      {/* Live Brand Token Preview */}
      <section className={panelClass}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E1E1E] pb-4">
          <div className="flex items-center gap-4 min-w-0">
            {profileImagePreview && !profileImageFailed ? (
              <img
                src={profileImagePreview}
                alt={`${workspace.name} logo`}
                referrerPolicy="no-referrer"
                onError={() => setProfileImageFailed(true)}
                className="h-14 w-14 rounded border border-[#2A2A2A] bg-white p-1.5 object-contain shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded border border-[#2A2A2A] bg-[#141414] flex items-center justify-center text-neutral-500 shrink-0">
                <Palette size={20} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">
                {isCompany ? 'Business OS · Tokens' : 'Brand OS · Tokens'}
              </p>
              <h2 className="text-lg font-bold text-white truncate">{workspaceName || workspace.name}</h2>
              <p className="text-xs text-neutral-400 truncate">
                {brandProfile.industry || 'Brand & Visual System'}
                {brandProfile.website ? ` · ${brandProfile.website}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: 'Primary', hex: brandForm.primaryColor },
              { label: 'Accent', hex: brandForm.accentColor || '#FF1E1E' },
              { label: 'Secondary', hex: brandForm.secondaryColor || '#0A0A0A' },
            ].map(swatch => (
              <button
                key={swatch.label}
                type="button"
                onClick={() => void copyTextValue(swatch.hex.toUpperCase(), swatch.label, 'token')}
                title={`Copy ${swatch.label} hex (${swatch.hex.toUpperCase()})`}
                className="flex items-center gap-2 rounded border border-[#242424] bg-[#111] px-2.5 py-1.5 text-left hover:border-[#FF1E1E] transition-colors"
              >
                <span
                  className="h-4 w-4 rounded border border-white/20 shrink-0"
                  style={{ backgroundColor: swatch.hex }}
                />
                <div>
                  <p className="text-[9px] font-mono uppercase text-neutral-500">
                    {copiedTokenKey === swatch.label ? 'Copied' : swatch.label}
                  </p>
                  <p className="text-[11px] font-mono text-white tabular-nums">{swatch.hex.toUpperCase()}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded border border-[#1E1E1E] bg-[#101010] p-3">
            <p className="text-[10px] font-mono uppercase text-neutral-500">Display Typography</p>
            <p className="mt-1 text-base font-bold text-white">{brandForm.typography?.displayFont || 'Plus Jakarta Sans'}</p>
          </div>
          <div className="rounded border border-[#1E1E1E] bg-[#101010] p-3">
            <p className="text-[10px] font-mono uppercase text-neutral-500">Body Typography</p>
            <p className="mt-1 text-base font-medium text-neutral-200">{brandForm.typography?.bodyFont || 'Plus Jakarta Sans'}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#1E1E1E] pt-4">
          <button
            type="button"
            onClick={() => openCanvasForStudio({ title: `${workspace.name} Brand Visual`, aspectRatio: '1:1 Square' })}
            className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E] transition-colors"
          >
            <Sparkles size={13} />
            <span>Open Brand Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const guidelinesPayload: BrandGuidelinesData = {
                brandVoice:
                  brandProfile.brandVoice || `${workspaceName || workspace.name} maintains clear, authoritative communication.`,
                photographyDirection:
                  brandProfile.photographyDirection ||
                  'Clean lighting, purposeful composition, and consistent color grading aligned with workspace tokens.',
                graphicDesignPrinciples:
                  brandProfile.graphicDesignPrinciples ||
                  'Use balanced editorial hierarchy, grid alignment, and restrained color contrast.',
                clearSpaceRules:
                  brandProfile.usageGuidelines ||
                  'Maintain clear space equal to the height of the brand mark on all sides.',
                minLogoSizePrint: '18 mm minimum width',
                minLogoSizeDigital: '96 px minimum width',
                backgroundRules:
                  brandProfile.graphicDesignPrinciples ||
                  'Use high-contrast light or deep charcoal backgrounds paired with official palette tokens.',
                incorrectUsageRules: [
                  'Do not stretch, skew, or alter logo lockup proportions.',
                  'Do not apply unapproved color gradients over primary marks.',
                  'Do not place marks over cluttered photography without contrast scrims.',
                  'Do not substitute unapproved display fonts in official templates.',
                ],
              };
              generateBrandGuidelinesPdf(guidelinesPayload, {
                ...workspace,
                name: workspaceName || workspace.name,
                brand: { ...brandForm, name: workspaceName || workspace.name, logoUrl: brandProfile.logoUrl },
              });
            }}
            className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-xs font-medium text-neutral-200 hover:text-white transition-colors"
          >
            <ArrowDownToLine size={13} />
            <span>Download Brand Guide PDF</span>
          </button>
          {onRequestProduction && (
            <button
              type="button"
              onClick={() => onRequestProduction(buildBrandProductionPrefill(workspace, brandProfile))}
              className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
            >
              <Plus size={13} />
              <span>Request Brand Production</span>
            </button>
          )}
        </div>
      </section>

      <form onSubmit={saveBrandProfile} className={`${panelClass} space-y-5`}>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">
            {isCompany ? 'Business OS · Identity' : 'Brand OS · Identity'}
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">Brand Guidelines &amp; Identity</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Keep brand colors, voice, photography direction and usage rules aligned across projects. Personal sign-in credentials are edited in Account Profile &amp; Settings.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Brand / Company Name</span>
            <input required value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Industry / Category</span>
            <input
              value={brandProfile.industry}
              onChange={event => setBrandProfile(value => ({ ...value, industry: event.target.value }))}
              className={fieldClass}
              placeholder="Fashion, Media, Technology…"
            />
          </label>
          <label>
            <span className={labelClass}>Website</span>
            <input
              type="url"
              value={brandProfile.website}
              onChange={event => setBrandProfile(value => ({ ...value, website: event.target.value }))}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <label>
            <span className={labelClass}>Logo URL</span>
            <input
              type="url"
              value={brandProfile.logoUrl}
              onChange={event => setBrandProfile(value => ({ ...value, logoUrl: event.target.value, logoPath: '' }))}
              className={fieldClass}
              placeholder="Upload in Asset Library or paste URL"
            />
          </label>
          {imageAssets.length > 0 && (
            <label className="sm:col-span-2">
              <span className={labelClass}>Or Select Logo From Asset Library</span>
              <select
                value={brandProfile.logoPath || ''}
                onChange={event =>
                  setBrandProfile(value => ({
                    ...value,
                    logoPath: event.target.value,
                    logoUrl: event.target.value ? '' : value.logoUrl,
                  }))
                }
                className={fieldClass}
              >
                <option value="">Custom URL / Keep current</option>
                {imageAssets.map(asset => (
                  <option key={asset.id} value={asset.storagePath || ''}>
                    {asset.name} ({asset.category})
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="sm:col-span-2">
            <span className={labelClass}>Brand Description</span>
            <textarea
              rows={3}
              value={brandProfile.description}
              onChange={event => setBrandProfile(value => ({ ...value, description: event.target.value }))}
              className={fieldClass}
              placeholder="What the brand does and who it serves."
            />
          </label>
          <label>
            <span className={labelClass}>Primary Color</span>
            <div className="flex gap-2">
              <input
                type="color"
                value={brandForm.primaryColor}
                onChange={event => setBrandForm(value => ({ ...value, primaryColor: event.target.value }))}
                className="h-10 w-12 rounded border border-[#303030] bg-[#141414] p-1"
              />
              <input
                value={brandForm.primaryColor}
                onChange={event => setBrandForm(value => ({ ...value, primaryColor: event.target.value }))}
                className={fieldClass}
              />
            </div>
          </label>
          <label>
            <span className={labelClass}>Accent Color</span>
            <div className="flex gap-2">
              <input
                type="color"
                value={brandForm.accentColor || '#FF1E1E'}
                onChange={event => setBrandForm(value => ({ ...value, accentColor: event.target.value }))}
                className="h-10 w-12 rounded border border-[#303030] bg-[#141414] p-1"
              />
              <input
                value={brandForm.accentColor || ''}
                onChange={event => setBrandForm(value => ({ ...value, accentColor: event.target.value }))}
                className={fieldClass}
              />
            </div>
          </label>
          <label>
            <span className={labelClass}>Secondary Color</span>
            <div className="flex gap-2">
              <input
                type="color"
                value={brandForm.secondaryColor || '#0A0A0A'}
                onChange={event => setBrandForm(value => ({ ...value, secondaryColor: event.target.value }))}
                className="h-10 w-12 rounded border border-[#303030] bg-[#141414] p-1"
              />
              <input
                value={brandForm.secondaryColor || ''}
                onChange={event => setBrandForm(value => ({ ...value, secondaryColor: event.target.value }))}
                className={fieldClass}
              />
            </div>
          </label>
          <datalist id="keedohub-brand-fonts">
            <option value="Plus Jakarta Sans" />
            <option value="Inter" />
            <option value="Syne" />
            <option value="Space Grotesk" />
            <option value="DM Sans" />
            <option value="Montserrat" />
            <option value="Playfair Display" />
            <option value="JetBrains Mono" />
          </datalist>
          <label>
            <span className={labelClass}>Display Typography</span>
            <input
              list="keedohub-brand-fonts"
              value={brandForm.typography?.displayFont || ''}
              onChange={event =>
                setBrandForm(value => ({ ...value, typography: { ...value.typography, displayFont: event.target.value } }))
              }
              className={fieldClass}
              placeholder="Plus Jakarta Sans"
            />
          </label>
          <label>
            <span className={labelClass}>Body Typography</span>
            <input
              list="keedohub-brand-fonts"
              value={brandForm.typography?.bodyFont || ''}
              onChange={event =>
                setBrandForm(value => ({ ...value, typography: { ...value.typography, bodyFont: event.target.value } }))
              }
              className={fieldClass}
              placeholder="Plus Jakarta Sans"
            />
          </label>
          <label>
            <span className={labelClass}>Brand Voice</span>
            <textarea
              rows={3}
              value={brandProfile.brandVoice}
              onChange={event => setBrandProfile(value => ({ ...value, brandVoice: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label>
            <span className={labelClass}>Photography Direction</span>
            <textarea
              rows={3}
              value={brandProfile.photographyDirection}
              onChange={event => setBrandProfile(value => ({ ...value, photographyDirection: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label>
            <span className={labelClass}>Graphic Design Principles</span>
            <textarea
              rows={3}
              value={brandProfile.graphicDesignPrinciples}
              onChange={event => setBrandProfile(value => ({ ...value, graphicDesignPrinciples: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label>
            <span className={labelClass}>Logo &amp; Usage Rules</span>
            <textarea
              rows={3}
              value={brandProfile.usageGuidelines}
              onChange={event => setBrandProfile(value => ({ ...value, usageGuidelines: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="sm:col-span-2">
            <span className={labelClass}>Creative References</span>
            <textarea
              rows={3}
              value={brandProfile.creativeReferences}
              onChange={event => setBrandProfile(value => ({ ...value, creativeReferences: event.target.value }))}
              className={fieldClass}
              placeholder="Links and references for the creative team."
            />
          </label>
        </div>
        <button
          disabled={saving}
          className="inline-flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save brand identity'}
        </button>
      </form>
    </div>
  );

  const renderReleases = () => {
    const filteredReleases = [...releases]
      .filter(release => releaseFilter === 'All' || release.status === releaseFilter)
      .sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));

    return (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(310px,.7fr)]">
        <section className={panelClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E1E] pb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">Artist OS · Catalog</p>
              <h2 className="mt-1 text-xl font-bold text-white">Music &amp; Releases</h2>
              <p className="mt-0.5 text-xs text-neutral-400">
                Manage singles, EPs and albums, release metadata, readiness checklist and promotional artwork.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['All', 'Draft', 'Scheduled', 'Live', 'Archived'] as const).map(status => {
                const count = status === 'All' ? releases.length : releases.filter(r => r.status === status).length;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReleaseFilter(status)}
                    className={`rounded px-2.5 py-1 text-xs font-mono tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                      releaseFilter === status
                        ? 'bg-white text-black font-semibold'
                        : 'border border-[#2A2A2A] bg-[#121212] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {loading && releases.length === 0 ? (
            <p className="py-8 text-sm text-neutral-500">Loading your catalog…</p>
          ) : filteredReleases.length === 0 ? (
            <div className="rounded border border-dashed border-[#2C2C2C] p-8 text-center space-y-2">
              <p className="text-sm text-neutral-400">
                {releases.length === 0
                  ? 'Your release catalog starts here. Add your first single, EP or album on the right.'
                  : 'No releases match this status filter.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredReleases.map(release => {
                const coverAsset = assets.find(asset => asset.storagePath === release.artworkPath);
                const coverPreview = release.artworkUrl || (coverAsset ? previewUrls[coverAsset.id] : '');
                const coverBroken = Boolean(failedReleaseCoverIds[release.id]);
                const linkedAssetsCount = assets.filter(asset => asset.releaseId === release.id).length;
                const linkedContentCount = contentItems.filter(item => item.releaseId === release.id).length;
                const linkedProject = release.projectId ? projectById.get(release.projectId) : undefined;
                const linkedDeliverablesCount = linkedProject
                  ? deliverables.filter(d => d.projectId === linkedProject.id).length
                  : 0;
                const checklistCompleted = RELEASE_CHECKLIST_ITEMS.filter(item => Boolean(release.checklist?.[item.key])).length;

                return (
                  <article key={release.id} className="overflow-hidden rounded-lg border border-[#252525] bg-[#111] flex flex-col">
                    {coverPreview && !coverBroken ? (
                      <img
                        src={coverPreview}
                        alt={`${release.title} artwork`}
                        referrerPolicy="no-referrer"
                        onError={() => setFailedReleaseCoverIds(prev => ({ ...prev, [release.id]: true }))}
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#231810] to-[#0b0b0b] text-amber-400">
                        <Music2 size={36} />
                      </div>
                    )}
                    <div className="space-y-3 p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-white truncate">{release.title}</h3>
                          <p className="text-xs font-mono text-neutral-500 tabular-nums">
                            {release.type} · {release.releaseDate || 'Date TBC'}
                          </p>
                        </div>
                        <select
                          aria-label={`Status for ${release.title}`}
                          value={release.status}
                          onChange={event => void setReleaseStatus(release, event.target.value as ReleaseStatus)}
                          className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-[11px] font-mono text-neutral-200 shrink-0"
                        >
                          <option>Draft</option>
                          <option>Scheduled</option>
                          <option>Live</option>
                          <option>Archived</option>
                        </select>
                      </div>

                      {(release.featuredArtists || release.producer || release.songwriters || release.rightsInfo) && (
                        <div className="space-y-0.5 text-[11px] text-neutral-400">
                          {release.featuredArtists && (
                            <p className="truncate">
                              <span className="text-neutral-500">Featuring:</span> {release.featuredArtists}
                            </p>
                          )}
                          {release.producer && (
                            <p className="truncate">
                              <span className="text-neutral-500">Producer:</span> {release.producer}
                            </p>
                          )}
                          {release.songwriters && (
                            <p className="truncate">
                              <span className="text-neutral-500">Writers:</span> {release.songwriters}
                            </p>
                          )}
                          {release.rightsInfo && (
                            <p className="truncate font-mono text-[10px] text-neutral-500">{release.rightsInfo}</p>
                          )}
                        </div>
                      )}

                      {(release.isrc || release.upc) && (
                        <div className="flex flex-wrap gap-3 text-[11px] font-mono text-neutral-400 tabular-nums">
                          {release.isrc && <span>ISRC: {release.isrc}</span>}
                          {release.upc && <span>UPC: {release.upc}</span>}
                        </div>
                      )}

                      {release.trackList && (
                        <p className="line-clamp-3 whitespace-pre-line text-xs text-neutral-400">{release.trackList}</p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1E1E1E] pt-2 text-[11px] font-mono text-neutral-500 tabular-nums">
                        <span>{linkedContentCount} copy items</span>
                        <span>{linkedAssetsCount} assets</span>
                        <span>
                          {checklistCompleted}/{RELEASE_CHECKLIST_ITEMS.length} ready
                        </span>
                      </div>

                      {linkedProject && (
                        <div className="rounded border border-[#242424] bg-[#0B0B0B] px-2.5 py-2 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-200 truncate">Project: {linkedProject.title}</p>
                            <p className="text-[10px] font-mono text-neutral-500 tabular-nums">
                              {linkedProject.stage || linkedProject.status} · {linkedDeliverablesCount} deliverable(s)
                            </p>
                          </div>
                          {onNavigateSection && (
                            <div className="flex items-center gap-2 shrink-0">
                              {linkedDeliverablesCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateSection('deliverables')}
                                  className="text-[11px] text-emerald-300 hover:text-white"
                                >
                                  Deliverables
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onNavigateSection('projects')}
                                className="text-[11px] text-red-300 hover:text-white"
                              >
                                Project
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {coverAsset && !coverPreview && (
                        <button
                          type="button"
                          onClick={() => void loadAssetUrl(coverAsset).catch(loadError => setError(messageFromError(loadError)))}
                          className="text-left text-xs text-red-300 underline"
                        >
                          Load private cover art preview
                        </button>
                      )}

                      <details className="rounded border border-[#202020] bg-[#0B0B0B] p-2.5 text-xs">
                        <summary className="cursor-pointer font-medium text-neutral-300 flex items-center gap-1.5">
                          <CheckSquare size={12} className="text-amber-400" />
                          <span>
                            Release checklist ({checklistCompleted}/{RELEASE_CHECKLIST_ITEMS.length})
                          </span>
                        </summary>
                        <div className="mt-2 space-y-1.5">
                          {RELEASE_CHECKLIST_ITEMS.map(item => {
                            const checked = Boolean(release.checklist?.[item.key]);
                            return (
                              <label key={item.key} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => void toggleReleaseChecklist(release, item.key)}
                                  className="accent-[#FF1E1E]"
                                />
                                <span className={checked ? 'line-through text-neutral-500' : ''}>{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </details>

                      {release.statusHistory && release.statusHistory.length > 0 && (
                        <details className="text-[11px] text-neutral-500">
                          <summary className="cursor-pointer">
                            Release history · {release.statusHistory.length} update(s)
                          </summary>
                          <ol className="mt-2 space-y-1 font-mono tabular-nums">
                            {[...release.statusHistory].reverse().map((entry, index) => (
                              <li key={`${entry.changedAt}-${index}`}>
                                {entry.status} · {new Date(entry.changedAt).toLocaleDateString()} · {entry.changedBy}
                              </li>
                            ))}
                          </ol>
                        </details>
                      )}

                      {(release.streamingUrl || release.preSaveUrl) && (
                        <div className="flex flex-wrap gap-3 text-xs">
                          {release.streamingUrl && (
                            <a
                              className="inline-flex items-center gap-1 text-red-300 hover:text-white underline"
                              href={release.streamingUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span>Streaming</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                          {release.preSaveUrl && (
                            <a
                              className="inline-flex items-center gap-1 text-red-300 hover:text-white underline"
                              href={release.preSaveUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span>Pre-save</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      )}

                      <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-[#1E1E1E]">
                        <button
                          type="button"
                          onClick={() => editRelease(release)}
                          className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-white hover:border-neutral-500"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openCanvasForStudio({
                              title: release.title,
                              subtitle: `${release.type.toUpperCase()} · ${release.releaseDate || 'COMING SOON'}`,
                              releaseId: release.id,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-950/20 px-2.5 py-1.5 text-xs text-amber-200 hover:text-white"
                        >
                          <Sparkles size={12} />
                          Promo Graphic
                        </button>
                        {onNavigateSection && (
                          <button
                            type="button"
                            onClick={() => {
                              setContentEditingId('');
                              setContentForm({
                                title: `${release.title} — Release Copy`,
                                kind: 'Promotional copy',
                                phase: release.status === 'Live' ? 'Post-release' : 'Pre-release',
                                status: 'Draft',
                                releaseId: release.id,
                                projectId: release.projectId || '',
                                deliverableId: '',
                                body: '',
                              });
                              onNavigateSection('content');
                            }}
                            className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-200 hover:text-white"
                          >
                            <FilePlus2 size={12} />
                            Draft Copy
                          </button>
                        )}
                        {onRequestProduction && (
                          <button
                            type="button"
                            onClick={() => onRequestProduction(buildReleaseProductionPrefill(release, workspace))}
                            className="inline-flex items-center gap-1 rounded border border-red-500/40 bg-red-950/20 px-2.5 py-1.5 text-xs text-red-200 hover:text-white"
                          >
                            <Plus size={12} />
                            Request Production
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void removeRecord('releases', release.id)}
                          className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-300"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <form onSubmit={saveRelease} className={`${panelClass} h-fit space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">{releaseEditingId ? 'Edit release' : 'Add a release'}</h3>
            {releaseEditingId && (
              <button type="button" onClick={resetReleaseForm} aria-label="Cancel editing" className="text-neutral-500 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
          <label>
            <span className={labelClass}>Release title</span>
            <input required value={releaseForm.title} onChange={event => setReleaseField('title', event.target.value)} className={fieldClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelClass}>Format</span>
              <select
                value={releaseForm.type}
                onChange={event => setReleaseField('type', event.target.value as StudioRelease['type'])}
                className={fieldClass}
              >
                <option>Single</option>
                <option>EP</option>
                <option>Album</option>
              </select>
            </label>
            <label>
              <span className={labelClass}>Status</span>
              <select
                value={releaseForm.status}
                onChange={event => setReleaseField('status', event.target.value as ReleaseStatus)}
                className={fieldClass}
              >
                <option>Draft</option>
                <option>Scheduled</option>
                <option>Live</option>
                <option>Archived</option>
              </select>
            </label>
          </div>
          <label>
            <span className={labelClass}>Release date</span>
            <input type="date" value={releaseForm.releaseDate} onChange={event => setReleaseField('releaseDate', event.target.value)} className={fieldClass} />
          </label>
          <label>
            <span className={labelClass}>Track list / notes</span>
            <textarea
              rows={3}
              value={releaseForm.trackList}
              onChange={event => setReleaseField('trackList', event.target.value)}
              className={fieldClass}
              placeholder="One track per line"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelClass}>Featured artists (optional)</span>
              <input
                value={releaseForm.featuredArtists}
                onChange={event => setReleaseField('featuredArtists', event.target.value)}
                className={fieldClass}
                placeholder="Collaborators"
              />
            </label>
            <label>
              <span className={labelClass}>Producer(s) (optional)</span>
              <input
                value={releaseForm.producer}
                onChange={event => setReleaseField('producer', event.target.value)}
                className={fieldClass}
                placeholder="Producer credits"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelClass}>Songwriters (optional)</span>
              <input
                value={releaseForm.songwriters}
                onChange={event => setReleaseField('songwriters', event.target.value)}
                className={fieldClass}
                placeholder="Writers"
              />
            </label>
            <label>
              <span className={labelClass}>Rights / label (optional)</span>
              <input
                value={releaseForm.rightsInfo}
                onChange={event => setReleaseField('rightsInfo', event.target.value)}
                className={fieldClass}
                placeholder="℗ 2026 Independent"
              />
            </label>
          </div>
          {imageAssets.length > 0 && (
            <label>
              <span className={labelClass}>Cover art from Asset Library</span>
              <select
                value={releaseForm.artworkPath}
                onChange={event => setReleaseField('artworkPath', event.target.value)}
                className={fieldClass}
              >
                <option value="">None selected</option>
                {imageAssets.map(asset => (
                  <option key={asset.id} value={asset.storagePath || ''}>
                    {asset.name} ({asset.category})
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span className={labelClass}>External artwork URL (optional)</span>
            <input
              type="url"
              value={releaseForm.artworkUrl}
              onChange={event => setReleaseField('artworkUrl', event.target.value)}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <label>
            <span className={labelClass}>Streaming link</span>
            <input
              type="url"
              value={releaseForm.streamingUrl}
              onChange={event => setReleaseField('streamingUrl', event.target.value)}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <label>
            <span className={labelClass}>Pre-save link</span>
            <input
              type="url"
              value={releaseForm.preSaveUrl}
              onChange={event => setReleaseField('preSaveUrl', event.target.value)}
              className={fieldClass}
              placeholder="https://"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelClass}>ISRC</span>
              <input value={releaseForm.isrc} onChange={event => setReleaseField('isrc', event.target.value)} className={fieldClass} />
            </label>
            <label>
              <span className={labelClass}>UPC</span>
              <input value={releaseForm.upc} onChange={event => setReleaseField('upc', event.target.value)} className={fieldClass} />
            </label>
          </div>
          {projects.length > 0 && (
            <label>
              <span className={labelClass}>Linked production project (optional)</span>
              <select
                value={releaseForm.projectId}
                onChange={event => setReleaseField('projectId', event.target.value)}
                className={fieldClass}
              >
                <option value="">No project association</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#FF1E1E] px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <Plus size={15} />
            {saving ? 'Saving…' : releaseEditingId ? 'Save changes' : 'Create release'}
          </button>
        </form>
      </div>
    );
  };

  const renderContent = () => {
    const queryLower = contentSearch.trim().toLowerCase();
    const filteredContent = [...contentItems]
      .filter(item => contentPhaseFilter === 'All' || item.phase === contentPhaseFilter)
      .filter(item => {
        if (!queryLower) return true;
        return (
          item.title.toLowerCase().includes(queryLower) ||
          item.body.toLowerCase().includes(queryLower) ||
          item.kind.toLowerCase().includes(queryLower)
        );
      })
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    return (
      <div className="space-y-5">
        {/* Creative Engine / Design Canvas Launcher */}
        <section className={`${panelClass} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-400">
              {isArtist ? 'Artist OS · Content Engine' : 'Brand OS · Creative System'}
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              {isArtist ? 'Content Engine & Visual Studio' : 'Creative System & Visual Studio'}
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              {isArtist
                ? 'Keep captions, lyrics and promo copy connected to releases and deliverables, or open the Design Canvas to build cover & social graphics.'
                : 'Coordinate marketing visuals, social copy and design graphics tied to your brand identity and active deliverables.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openCanvasForStudio({ aspectRatio: '1:1 Square' })}
              className="inline-flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-600 whitespace-nowrap shrink-0 transition-colors"
            >
              <Sparkles size={14} />
              <span>Open Design Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => openCanvasForStudio({ aspectRatio: '9:16 Vertical Story' })}
              className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2.5 text-xs font-medium text-neutral-200 hover:text-white whitespace-nowrap shrink-0"
            >
              <Layers size={14} />
              <span>9:16 Story Graphic</span>
            </button>
            <button
              type="button"
              onClick={() => openCanvasForStudio({ aspectRatio: '16:9 Landscape' })}
              className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2.5 text-xs font-medium text-neutral-200 hover:text-white whitespace-nowrap shrink-0"
            >
              <Layers size={14} />
              <span>16:9 Landscape</span>
            </button>
            {(onRequestProduction || onNavigateSection) && (
              <button
                type="button"
                onClick={() => {
                  if (onRequestProduction) {
                    onRequestProduction(
                      isArtist
                        ? {
                            title: `${workspace.name} — Content & Visual Pack`,
                            category: 'Artist Promotional Graphics',
                            description: `Creative request from ${workspace.name} Content Engine.`,
                          }
                        : buildBrandProductionPrefill(workspace, brandProfile),
                    );
                  } else if (onNavigateSection) {
                    onNavigateSection('requests');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2.5 text-xs font-medium text-neutral-300 hover:text-white whitespace-nowrap shrink-0"
              >
                <span>Request Studio Production</span>
              </button>
            )}
          </div>
        </section>

        {/* Local Saved Canvas Drafts */}
        {canvasDrafts.length > 0 && (
          <section className={panelClass}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Your Canvas Graphics Drafts ({canvasDrafts.length})</h3>
              <span className="text-[11px] font-mono text-neutral-500">
                Open a draft to export or save directly into Asset Library
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {canvasDrafts.map(draft => (
                <div key={draft.id} className="rounded border border-[#252525] bg-[#111] p-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{draft.name}</p>
                    <p className="mt-0.5 text-[11px] font-mono text-neutral-500 tabular-nums">
                      {draft.aspectRatio} · {draft.width}×{draft.height}
                    </p>
                    <p className="mt-1 text-[10px] font-mono text-neutral-600 tabular-nums">
                      Updated {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openCanvasForStudio({ existingDraft: draft })}
                      className="rounded border border-[#333] bg-[#161616] px-2.5 py-1 text-xs font-medium text-white hover:border-[#FF1E1E]"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCanvasDraft(draft.id)}
                      aria-label={`Delete draft ${draft.name}`}
                      className="rounded border border-[#2A2A2A] p-1 text-neutral-500 hover:text-red-300"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
          <section className={panelClass}>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1E1E] pb-4">
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Pre-release', 'Release day', 'Post-release', 'Ongoing'] as const).map(phase => {
                  const count =
                    phase === 'All' ? contentItems.length : contentItems.filter(item => item.phase === phase).length;
                  const phaseLabel =
                    phase === 'Release day' && !isArtist ? 'Launch day' : phase;
                  return (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => setContentPhaseFilter(phase)}
                      className={`rounded px-2.5 py-1 text-xs font-mono tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                        contentPhaseFilter === phase
                          ? 'bg-white text-black font-semibold'
                          : 'border border-[#2A2A2A] bg-[#121212] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {phaseLabel} ({count})
                    </button>
                  );
                })}
              </div>
              <label className="relative w-full sm:w-56">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  value={contentSearch}
                  onChange={event => setContentSearch(event.target.value)}
                  placeholder="Search copy & captions…"
                  className="w-full rounded border border-[#2C2C2C] bg-[#141414] pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
                />
              </label>
            </div>

            {filteredContent.length === 0 ? (
              <p className="rounded border border-dashed border-[#333] p-6 text-center text-sm text-neutral-500">
                {contentItems.length === 0
                  ? 'No creative material yet. Add the first caption, lyric, promotional copy or social post.'
                  : 'No content items match your current filter.'}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredContent.map(item => {
                  const linkedRelease = item.releaseId ? releaseById.get(item.releaseId) : undefined;
                  const linkedProject = item.projectId ? projectById.get(item.projectId) : undefined;
                  const linkedDeliverable = item.deliverableId ? deliverableById.get(item.deliverableId) : undefined;
                  return (
                    <article key={item.id} className="rounded-lg border border-[#252525] bg-[#111] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white">{item.title}</h3>
                          <p className="mt-1 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                            {item.kind} · {item.phase === 'Release day' && !isArtist ? 'Launch day' : item.phase}
                            {linkedRelease ? ` · Release: ${linkedRelease.title}` : ''}
                            {linkedProject ? ` · Project: ${linkedProject.title}` : ''}
                            {linkedDeliverable ? ` · Deliverable: ${linkedDeliverable.title}` : ''}
                          </p>
                        </div>
                        <select
                          aria-label={`Status for ${item.title}`}
                          value={item.status}
                          onChange={event => void saveStatus('contentItems', item.id, event.target.value)}
                          className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-xs text-neutral-300"
                        >
                          <option>Draft</option>
                          <option>In progress</option>
                          <option>Ready</option>
                          <option>Published</option>
                        </select>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-300">{item.body}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void copyTextValue(item.body, item.id, 'content')}
                          className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-200 hover:border-neutral-500 hover:text-white"
                        >
                          {copiedContentId === item.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          {copiedContentId === item.id ? 'Copied' : 'Copy text'}
                        </button>
                        <button
                          type="button"
                          onClick={() => editContent(item)}
                          className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-white hover:border-neutral-500"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeRecord('contentItems', item.id)}
                          className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-300"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <form onSubmit={saveContent} className={`${panelClass} h-fit space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{contentEditingId ? 'Edit material' : 'New creative material'}</h3>
              {contentEditingId && (
                <button type="button" onClick={resetContentForm} aria-label="Cancel editing" className="text-neutral-500">
                  <X size={16} />
                </button>
              )}
            </div>
            <label>
              <span className={labelClass}>Title</span>
              <input
                required
                value={contentForm.title}
                onChange={event => setContentField('title', event.target.value)}
                className={fieldClass}
                placeholder="Working title"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={labelClass}>Material</span>
                <select
                  value={contentForm.kind}
                  onChange={event => setContentField('kind', event.target.value as ContentKind)}
                  className={fieldClass}
                >
                  <option>Caption</option>
                  {isArtist && <option>Lyrics</option>}
                  <option>Promotional copy</option>
                  <option>Creative idea</option>
                  <option>Social post</option>
                  <option>Guideline</option>
                </select>
              </label>
              <label>
                <span className={labelClass}>Phase</span>
                <select
                  value={contentForm.phase}
                  onChange={event => setContentField('phase', event.target.value as ContentPhase)}
                  className={fieldClass}
                >
                  <option value="Pre-release">Pre-release</option>
                  <option value="Release day">{isArtist ? 'Release day' : 'Launch day'}</option>
                  <option value="Post-release">Post-release</option>
                  <option value="Ongoing">Ongoing</option>
                </select>
              </label>
            </div>
            {isArtist && (
              <label>
                <span className={labelClass}>Related release</span>
                <select
                  value={contentForm.releaseId}
                  onChange={event => setContentField('releaseId', event.target.value)}
                  className={fieldClass}
                >
                  <option value="">No release association</option>
                  {releases.map(release => (
                    <option value={release.id} key={release.id}>
                      {release.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span className={labelClass}>Related project (optional)</span>
              <select
                value={contentForm.projectId}
                onChange={event => setContentField('projectId', event.target.value)}
                className={fieldClass}
              >
                <option value="">No project association</option>
                {projects.map(project => (
                  <option value={project.id} key={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>
            {deliverables.length > 0 && (
              <label>
                <span className={labelClass}>Associated deliverable (optional)</span>
                <select
                  value={contentForm.deliverableId}
                  onChange={event => setContentField('deliverableId', event.target.value)}
                  className={fieldClass}
                >
                  <option value="">No deliverable association</option>
                  {deliverables.map(item => (
                    <option value={item.id} key={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              <span className={labelClass}>Status</span>
              <select
                value={contentForm.status}
                onChange={event => setContentField('status', event.target.value as ContentStatus)}
                className={fieldClass}
              >
                <option>Draft</option>
                <option>In progress</option>
                <option>Ready</option>
                <option>Published</option>
              </select>
            </label>
            <label>
              <span className={labelClass}>Copy / notes</span>
              <textarea
                required
                rows={7}
                maxLength={10000}
                value={contentForm.body}
                onChange={event => setContentField('body', event.target.value)}
                className={fieldClass}
                placeholder="Write the caption, promotional copy or creative direction."
              />
            </label>
            <button
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#FF1E1E] px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <Plus size={15} />
              {saving ? 'Saving…' : contentEditingId ? 'Save material' : 'Add to content library'}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderAssets = () => {
    const categories = ['All', ...Array.from(new Set(assets.map(a => a.category).filter(Boolean)))];
    const queryLower = assetSearch.trim().toLowerCase();
    const filteredAssets = assets.filter(asset => {
      if (assetFilterCategory !== 'All' && asset.category !== assetFilterCategory) return false;
      if (assetFilterStatus !== 'All' && (asset.status || 'Draft') !== assetFilterStatus) return false;
      if (queryLower) {
        return (
          asset.name.toLowerCase().includes(queryLower) ||
          (asset.description || '').toLowerCase().includes(queryLower) ||
          asset.category.toLowerCase().includes(queryLower)
        );
      }
      return true;
    });

    return (
      <div className="space-y-5">
        <div className={`${panelClass} grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end`}>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-400">Shared workspace library</p>
            <h2 className="mt-1 text-xl font-bold text-white">{isArtist ? 'Artist Asset Library' : 'Brand Asset Library'}</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Private to {workspace.name}. Files stay in this workspace and can be organized, previewed and downloaded.
            </p>
          </div>
          <div className={`grid gap-3 ${isArtist ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <label>
              <span className={labelClass}>Category</span>
              <select value={assetCategory} onChange={event => setAssetCategory(event.target.value)} className={fieldClass}>
                {isArtist ? (
                  <>
                    <option>Artwork</option>
                    <option>Visualizer</option>
                    <option>Photography</option>
                    <option>Video</option>
                    <option>Promotional</option>
                    <option>Document</option>
                    <option>Other</option>
                  </>
                ) : (
                  <>
                    <option>Logo</option>
                    <option>Guideline</option>
                    <option>Photography</option>
                    <option>Video</option>
                    <option>Promotional</option>
                    <option>Document</option>
                    <option>Other</option>
                  </>
                )}
              </select>
            </label>
            {isArtist && (
              <label>
                <span className={labelClass}>Associate with release</span>
                <select value={assetReleaseId} onChange={event => setAssetReleaseId(event.target.value)} className={fieldClass}>
                  <option value="">No release</option>
                  {releases.map(release => (
                    <option key={release.id} value={release.id}>
                      {release.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 whitespace-nowrap shrink-0">
            <Upload size={15} />
            {uploading ? 'Uploading…' : 'Upload asset'}
            <input
              name="workspace-asset-file"
              type="file"
              className="sr-only"
              disabled={uploading}
              onChange={event => void uploadAsset(event)}
            />
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>Description / usage note</span>
            <input
              value={assetDescription}
              onChange={event => setAssetDescription(event.target.value)}
              className={fieldClass}
              maxLength={500}
              placeholder="Optional context for this asset"
            />
          </label>
          <label>
            <span className={labelClass}>Production project</span>
            <select value={assetProjectId} onChange={event => setAssetProjectId(event.target.value)} className={fieldClass}>
              <option value="">No project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-[#1E1E1E] bg-[#0B0B0B] px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setAssetFilterCategory(category)}
                className={`rounded px-2.5 py-1 text-xs font-mono whitespace-nowrap shrink-0 transition-colors ${
                  assetFilterCategory === category
                    ? 'bg-white text-black font-semibold'
                    : 'border border-[#2A2A2A] bg-[#141414] text-neutral-400 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter assets by status"
              value={assetFilterStatus}
              onChange={event => setAssetFilterStatus(event.target.value as typeof assetFilterStatus)}
              className="rounded border border-[#2C2C2C] bg-[#141414] px-2.5 py-1.5 text-xs text-neutral-200"
            >
              <option value="All">All statuses</option>
              <option value="Approved">Approved</option>
              <option value="Review">In Review</option>
              <option value="Draft">Draft</option>
            </select>
            <label className="relative w-full sm:w-52">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                value={assetSearch}
                onChange={event => setAssetSearch(event.target.value)}
                placeholder="Search assets…"
                className="w-full rounded border border-[#2C2C2C] bg-[#141414] pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#FF1E1E]"
              />
            </label>
          </div>
        </div>

        {assets.length === 0 ? (
          <div className={`${panelClass} border-dashed text-center text-sm text-neutral-500`}>
            Your workspace library is ready for artwork, logos, photography, video, visualizers and documents.
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className={`${panelClass} text-center text-sm text-neutral-500`}>
            No assets match this category or search query.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredAssets.map(asset => {
              const previewUrl = previewUrls[asset.id] || asset.downloadUrl;
              const statusLabel = asset.status || 'Draft';
              return (
                <article key={asset.id} className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0D] flex flex-col">
                  {previewUrl && asset.mimeType?.startsWith('image/') && !failedAssetIds[asset.id] ? (
                    <img
                      src={previewUrl}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      onError={() => setFailedAssetIds(prev => ({ ...prev, [asset.id]: true }))}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : previewUrl && asset.mimeType?.startsWith('video/') ? (
                    <video controls preload="metadata" src={previewUrl} className="aspect-[4/3] w-full bg-black object-contain" />
                  ) : previewUrl && asset.mimeType?.startsWith('audio/') ? (
                    <div className="flex aspect-[4/3] items-center justify-center bg-[#121212] p-5">
                      <audio controls src={previewUrl} className="w-full" />
                    </div>
                  ) : previewUrl && asset.mimeType === 'application/pdf' ? (
                    <iframe title={`${asset.name} preview`} src={previewUrl} className="aspect-[4/3] w-full bg-white" />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-[#121212] text-neutral-500">
                      <ImagePlus size={32} />
                    </div>
                  )}
                  <div className="space-y-2 p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">{asset.name}</h3>
                        <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 tabular-nums">
                          {asset.category} · {fileSizeLabel(asset.fileSizeBytes || 0)} · {statusLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void downloadAsset(asset)}
                        disabled={loadingAssetId === asset.id}
                        aria-label={`Download ${asset.name}`}
                        className="rounded border border-[#333] p-2 text-neutral-300 hover:text-white disabled:opacity-50 shrink-0"
                      >
                        <ArrowDownToLine size={14} />
                      </button>
                    </div>
                    {asset.description && <p className="text-xs text-neutral-400">{asset.description}</p>}
                    <p className="text-[11px] text-neutral-500">
                      {asset.releaseId
                        ? `Release: ${releaseById.get(asset.releaseId)?.title || asset.releaseId}`
                        : 'Workspace asset'}
                      {asset.projectId
                        ? ` · Project: ${projects.find(project => project.id === asset.projectId)?.title || asset.projectId}`
                        : ''}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 border-t border-[#1C1C1C]">
                      <button
                        type="button"
                        onClick={() => void loadAssetUrl(asset).catch(loadError => setError(messageFromError(loadError)))}
                        disabled={loadingAssetId === asset.id}
                        className="rounded border border-[#333] px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white disabled:opacity-50"
                      >
                        {loadingAssetId === asset.id ? 'Loading…' : previewUrls[asset.id] ? 'Preview loaded' : 'Load preview'}
                      </button>
                      {asset.mimeType?.startsWith('image/') && isArtist && (
                        <button
                          type="button"
                          onClick={() => void setAssetAsImage(asset, 'artist')}
                          className="rounded border border-[#333] px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white"
                        >
                          Use as artist image
                        </button>
                      )}
                      {asset.mimeType?.startsWith('image/') && isBrand && (
                        <button
                          type="button"
                          onClick={() => void setAssetAsImage(asset, 'brand')}
                          className="rounded border border-[#333] px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white"
                        >
                          Use as logo
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void removeAsset(asset)}
                        className="ml-auto inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-300"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Approved Phase 2 Production Deliverables */}
        {(() => {
          const approvedDeliverables = deliverables.filter(d => {
            if (d.reviewStatus !== 'Approved') return false;
            if (!queryLower) return true;
            const projTitle = projectById.get(d.projectId)?.title || '';
            return (
              d.title.toLowerCase().includes(queryLower) ||
              (d.fileName || '').toLowerCase().includes(queryLower) ||
              projTitle.toLowerCase().includes(queryLower)
            );
          });
          if (approvedDeliverables.length === 0) return null;
          return (
            <section className={`${panelClass} space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1E1E] pb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400">
                    Phase 2 Production Outputs
                  </p>
                  <h3 className="text-base font-bold text-white">
                    Approved Production Deliverables ({approvedDeliverables.length})
                  </h3>
                </div>
                {onNavigateSection && (
                  <button
                    type="button"
                    onClick={() => onNavigateSection('deliverables')}
                    className="text-xs text-neutral-300 hover:text-white"
                  >
                    Open Deliverables
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {approvedDeliverables.map(item => {
                  const linkedProject = projectById.get(item.projectId);
                  return (
                    <article key={item.id} className="overflow-hidden rounded-lg border border-emerald-800/40 bg-[#0D0D0D] flex flex-col">
                      {item.fileUrl && item.fileType?.startsWith('image/') && !failedDeliverableIds[item.id] ? (
                        <img
                          src={item.fileUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          onError={() => setFailedDeliverableIds(prev => ({ ...prev, [item.id]: true }))}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : item.fileUrl && item.fileType?.startsWith('video/') ? (
                        <video controls preload="metadata" src={item.fileUrl} className="aspect-[4/3] w-full bg-black object-contain" />
                      ) : item.fileUrl && item.fileType?.startsWith('audio/') ? (
                        <div className="flex aspect-[4/3] items-center justify-center bg-[#121212] p-5">
                          <audio controls src={item.fileUrl} className="w-full" />
                        </div>
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center bg-[#121212] text-emerald-400">
                          <CheckSquare size={32} />
                        </div>
                      )}
                      <div className="space-y-2 p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-white">{item.title}</h4>
                            <p className="text-[11px] font-mono text-emerald-400 tabular-nums">
                              Approved · v{item.currentVersion || 1}
                              {linkedProject ? ` · ${linkedProject.title}` : ''}
                            </p>
                          </div>
                        </div>
                        {item.description && <p className="text-xs text-neutral-400 line-clamp-2">{item.description}</p>}
                        {item.fileUrl && (
                          <div className="mt-auto pt-2 border-t border-[#1C1C1C]">
                            <a
                              href={item.fileUrl}
                              download={item.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-white"
                            >
                              <ArrowDownToLine size={13} />
                              <span>Download Final · {item.fileName}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })()}
      </div>
    );
  };

  const renderInvoices = () => {
    const invoices = documents.filter(d => d.type === 'invoice');
    const totalInvoiced = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((acc, i) => acc + (i.totalPaid || 0), 0);
    const balanceDue = invoices.reduce(
      (acc, i) => acc + (i.balanceDue !== undefined ? i.balanceDue : (i.totalAmount || 0) - (i.totalPaid || 0)),
      0,
    );

    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className={panelClass}>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Total Invoiced</p>
            <p className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
              ${totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className={panelClass}>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400">Total Settled</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className={panelClass}>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">Balance Due</p>
            <p className="mt-2 text-2xl font-bold text-blue-400 font-mono tabular-nums">
              ${balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <section className={panelClass}>
          <div className="mb-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">Workspace Billing</p>
            <h3 className="mt-1 text-xl font-bold text-white">Invoices &amp; Settlement History</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Review commercial invoices, verify recorded settlements and download official PDF statements.
            </p>
          </div>

          {invoices.length === 0 ? (
            <p className="rounded border border-dashed border-[#333] p-6 text-center text-sm text-neutral-500">
              No invoices have been issued to this workspace yet.
            </p>
          ) : (
            <div className="space-y-4">
              {invoices.map(inv => {
                const paid = inv.totalPaid || 0;
                const total = inv.totalAmount || 0;
                const balance = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, total - paid);
                const isPaid = inv.status === 'Paid' || balance <= 0;

                return (
                  <article key={inv.id} className="rounded-lg border border-[#252525] bg-[#111] p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-white">{inv.title}</h4>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                : inv.status === 'Partially Paid'
                                  ? 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                                  : inv.status === 'Overdue'
                                    ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                                    : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-mono text-neutral-400 tabular-nums">
                          Ref: {inv.referenceNo} · Issued: {inv.date}
                          {inv.validityDate ? ` · Due: ${inv.validityDate}` : ''}
                        </p>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <p className="text-lg font-bold text-white">${total.toFixed(2)}</p>
                        <p className="text-xs text-neutral-400">
                          Balance due: <strong className="text-blue-400">${balance.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    {inv.items && inv.items.length > 0 && (
                      <div className="rounded border border-[#222] bg-[#0A0A0A] p-3 text-xs space-y-1">
                        <p className="font-semibold text-neutral-300 uppercase tracking-wider text-[10px] mb-2">Line Items</p>
                        {inv.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-neutral-400">
                            <span>
                              {item.quantity}x {item.description} (${(item.unitPrice || 0).toFixed(2)} ea)
                            </span>
                            <span className="font-mono text-white tabular-nums">${(item.total || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {inv.payments && inv.payments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-neutral-500">Recorded Payments</p>
                        <div className="space-y-1.5">
                          {inv.payments.map((p, idx) => (
                            <div
                              key={idx}
                              className="flex flex-wrap items-center justify-between rounded bg-[#161616] px-3 py-2 text-xs font-mono tabular-nums"
                            >
                              <span className="text-emerald-400 font-semibold">
                                +${p.amount.toFixed(2)} <span className="text-neutral-400 font-normal">({p.method})</span>
                              </span>
                              <span className="text-neutral-500">
                                {p.date} {p.reference ? `· Ref: ${p.reference}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#222]">
                      <p className="text-xs text-neutral-500">Terms: {inv.paymentTerms || 'Net 30'}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(inv)}
                          className="rounded border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-neutral-200 hover:text-white"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            generateCorporateDocumentPdf(
                              {
                                ...inv,
                                workspaceId: workspace.id,
                                recipientAddress: '',
                                authorName: accountName,
                                authorRole: 'Client Review',
                                items:
                                  inv.items || [{ description: inv.subject || inv.title, quantity: 1, unitPrice: total, total }],
                                paymentTerms: inv.paymentTerms || 'Net 30',
                                createdAt: inv.createdAt,
                                updatedAt: inv.updatedAt,
                              } as CorporateDocument,
                              workspace,
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded border border-[#333] bg-[#161616] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#222]"
                        >
                          <ArrowDownToLine size={13} /> Download PDF
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderProposals = () => {
    const proposals = documents.filter(d =>
      ['quotation', 'partnership_proposal', 'sponsorship_proposal'].includes(d.type),
    );

    return (
      <div className="space-y-5">
        <section className={panelClass}>
          <div className="mb-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-400">Commercial Agreements</p>
            <h3 className="mt-1 text-xl font-bold text-white">Proposals &amp; Quotations</h3>
            <p className="mt-1 text-sm text-neutral-400">
              Review project quotations, partnership scopes and sponsorship proposals issued for your workspace.
            </p>
          </div>

          {proposals.length === 0 ? (
            <p className="rounded border border-dashed border-[#333] p-6 text-center text-sm text-neutral-500">
              No proposals or quotations have been issued to this workspace yet.
            </p>
          ) : (
            <div className="space-y-4">
              {proposals.map(prop => {
                const isAccepted = prop.clientAction === 'Accepted' || prop.status === 'Accepted';
                const isDeclined = prop.clientAction === 'Declined' || prop.status === 'Declined';

                return (
                  <article key={prop.id} className="rounded-lg border border-[#252525] bg-[#111] p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-white">{prop.title}</h4>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              isAccepted
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                : isDeclined
                                  ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                                  : 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {prop.clientAction || prop.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-mono text-neutral-400 tabular-nums">
                          {prop.type.replaceAll('_', ' ')} · Ref: {prop.referenceNo} · Issued: {prop.date}
                          {prop.validityDate ? ` · Valid until: ${prop.validityDate}` : ''}
                        </p>
                      </div>
                      {prop.totalAmount !== undefined && prop.totalAmount > 0 && (
                        <p className="text-lg font-bold font-mono text-white tabular-nums">${prop.totalAmount.toFixed(2)}</p>
                      )}
                    </div>

                    <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">{prop.bodyContent}</p>

                    {prop.items && prop.items.length > 0 && (
                      <div className="rounded border border-[#222] bg-[#0A0A0A] p-3 text-xs space-y-1">
                        <p className="font-semibold text-neutral-300 uppercase tracking-wider text-[10px] mb-2">
                          Proposed Scope &amp; Deliverables
                        </p>
                        {prop.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-neutral-400">
                            <span>
                              {item.quantity}x {item.description} (${(item.unitPrice || 0).toFixed(2)} ea)
                            </span>
                            <span className="font-mono text-white tabular-nums">${(item.total || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222]">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleClientProposalAction(prop.id, 'Accepted')}
                          disabled={isAccepted}
                          className="rounded bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {isAccepted ? 'Accepted' : 'Accept Proposal'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleClientProposalAction(prop.id, 'Declined')}
                          disabled={isDeclined}
                          className="rounded border border-red-500/40 bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-200 hover:bg-red-950/60 disabled:opacity-50"
                        >
                          {isDeclined ? 'Declined' : 'Decline'}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(prop)}
                          className="rounded border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-neutral-200 hover:text-white"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            generateCorporateDocumentPdf(
                              {
                                ...prop,
                                workspaceId: workspace.id,
                                recipientAddress: '',
                                authorName: accountName,
                                authorRole: 'Client Review',
                                items:
                                  prop.items || [
                                    {
                                      description: prop.subject || prop.title,
                                      quantity: 1,
                                      unitPrice: prop.totalAmount || 0,
                                      total: prop.totalAmount || 0,
                                    },
                                  ],
                                paymentTerms: prop.paymentTerms || '',
                                createdAt: prop.createdAt,
                                updatedAt: prop.updatedAt,
                              } as CorporateDocument,
                              workspace,
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded border border-[#333] bg-[#161616] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#222]"
                        >
                          <ArrowDownToLine size={13} /> Download PDF
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderDocumentsListAndForm = (onlyCorporate = false) => {
    const visibleDocs = onlyCorporate
      ? documents.filter(
          d => d.type !== 'invoice' && !['quotation', 'partnership_proposal', 'sponsorship_proposal'].includes(d.type),
        )
      : documents;

    return (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
        <section className={panelClass}>
          <div className="mb-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">Brand OS · Business</p>
            <h3 className="mt-1 text-xl font-bold text-white">
              {onlyCorporate ? 'Corporate & Correspondence' : 'All Business Documents'}
            </h3>
            <p className="mt-1 text-sm text-neutral-400">
              Draft, revise, preview and download branded invoices, proposals and business correspondence.
            </p>
          </div>
          {visibleDocs.length === 0 ? (
            <p className="rounded border border-dashed border-[#333] p-6 text-center text-sm text-neutral-500">
              No business documents match this category yet.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleDocs.map(item => (
                <article key={item.id} className="rounded-lg border border-[#252525] bg-[#111] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-white">{item.title}</h4>
                      <p className="mt-1 text-[11px] font-mono uppercase tracking-wider text-neutral-500 tabular-nums">
                        {item.type.replaceAll('_', ' ')} · {item.referenceNo} · {item.date}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        Prepared for {item.recipientName}
                        {item.recipientOrg ? ` · ${item.recipientOrg}` : ''}
                        {item.projectId ? ` · ${projects.find(project => project.id === item.projectId)?.title || 'Project'}` : ''}
                        {item.totalAmount ? ` · $${item.totalAmount.toFixed(2)}` : ''}
                      </p>
                    </div>
                    <select
                      aria-label={`Status for ${item.title}`}
                      value={item.status}
                      onChange={event => void saveStatus('documents', item.id, event.target.value)}
                      className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-xs text-neutral-300"
                    >
                      <option>Draft</option>
                      <option>Under Review</option>
                      <option>Approved</option>
                      <option>Issued</option>
                    </select>
                  </div>
                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-neutral-300">{item.bodyContent}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDocument(item)}
                      className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-200 hover:text-white"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => editDocument(item)}
                      className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-white"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        generateCorporateDocumentPdf(
                          {
                            ...item,
                            workspaceId: workspace.id,
                            recipientAddress: '',
                            authorName: accountName,
                            authorRole: 'Workspace Owner',
                            items:
                              item.items && item.items.length > 0
                                ? item.items
                                : item.totalAmount
                                  ? [{ description: item.subject || item.title, quantity: 1, unitPrice: item.totalAmount, total: item.totalAmount }]
                                  : [],
                            paymentTerms: item.paymentTerms || '',
                            createdAt: item.createdAt,
                            updatedAt: item.updatedAt,
                          } as CorporateDocument,
                          workspace,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                    >
                      <ArrowDownToLine size={12} />
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadText(
                          `${item.referenceNo || item.title}.txt`,
                          `${workspace.name}\n${item.title}\n${item.referenceNo} · ${item.date}\nPrepared for: ${item.recipientName}${item.recipientOrg ? ` · ${item.recipientOrg}` : ''}${item.recipientEmail ? ` · ${item.recipientEmail}` : ''}\nStatus: ${item.status}\n\n${item.subject || ''}\n\n${item.bodyContent}`,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                    >
                      <ArrowDownToLine size={12} />
                      Download TXT
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeRecord('documents', item.id)}
                      className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-300"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={saveDocument} className={`${panelClass} h-fit space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">{documentEditingId ? 'Edit document' : 'Create document'}</h3>
            {documentEditingId && (
              <button type="button" onClick={resetDocumentForm} aria-label="Cancel editing" className="text-neutral-500">
                <X size={16} />
              </button>
            )}
          </div>
          <label>
            <span className={labelClass}>Document type</span>
            <select
              value={documentForm.type}
              onChange={event => setDocumentForm(value => ({ ...value, type: event.target.value as DocumentType }))}
              className={fieldClass}
            >
              <option value="invoice">Invoice</option>
              <option value="quotation">Proposal / quotation</option>
              <option value="partnership_proposal">Partnership proposal</option>
              <option value="official_letter">Business letter</option>
              <option value="company_profile">Company profile</option>
            </select>
          </label>
          <label>
            <span className={labelClass}>Title</span>
            <input
              required
              value={documentForm.title}
              onChange={event => setDocumentForm(value => ({ ...value, title: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelClass}>Reference</span>
              <input
                value={documentForm.referenceNo}
                onChange={event => setDocumentForm(value => ({ ...value, referenceNo: event.target.value }))}
                className={fieldClass}
                placeholder="INV-2026-001"
              />
            </label>
            <label>
              <span className={labelClass}>Date</span>
              <input
                type="date"
                value={documentForm.date}
                onChange={event => setDocumentForm(value => ({ ...value, date: event.target.value }))}
                className={fieldClass}
              />
            </label>
          </div>
          <label>
            <span className={labelClass}>Client / recipient name</span>
            <input
              required
              value={documentForm.recipientName}
              onChange={event => setDocumentForm(value => ({ ...value, recipientName: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelClass}>Organization</span>
              <input
                value={documentForm.recipientOrg}
                onChange={event => setDocumentForm(value => ({ ...value, recipientOrg: event.target.value }))}
                className={fieldClass}
              />
            </label>
            <label>
              <span className={labelClass}>Email</span>
              <input
                type="email"
                value={documentForm.recipientEmail}
                onChange={event => setDocumentForm(value => ({ ...value, recipientEmail: event.target.value }))}
                className={fieldClass}
              />
            </label>
          </div>
          <label>
            <span className={labelClass}>Related project</span>
            <select
              value={documentForm.projectId}
              onChange={event => setDocumentForm(value => ({ ...value, projectId: event.target.value }))}
              className={fieldClass}
            >
              <option value="">No project association</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>
          {documentForm.type === 'invoice' && (
            <>
              <label>
                <span className={labelClass}>Invoice total (USD)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={documentForm.totalAmount}
                  onChange={event =>
                    setDocumentForm(value => ({ ...value, totalAmount: Math.max(0, Number(event.target.value) || 0) }))
                  }
                  className={fieldClass}
                />
              </label>
              <label>
                <span className={labelClass}>Payment terms</span>
                <input
                  value={documentForm.paymentTerms}
                  onChange={event => setDocumentForm(value => ({ ...value, paymentTerms: event.target.value }))}
                  className={fieldClass}
                />
              </label>
            </>
          )}
          <label>
            <span className={labelClass}>Subject</span>
            <input
              value={documentForm.subject}
              onChange={event => setDocumentForm(value => ({ ...value, subject: event.target.value }))}
              className={fieldClass}
            />
          </label>
          <label>
            <span className={labelClass}>Document content</span>
            <textarea
              rows={7}
              value={documentForm.bodyContent}
              onChange={event => setDocumentForm(value => ({ ...value, bodyContent: event.target.value }))}
              className={fieldClass}
              placeholder="Editable document copy, scope or payment terms."
            />
          </label>
          <label>
            <span className={labelClass}>Status</span>
            <select
              value={documentForm.status}
              onChange={event => setDocumentForm(value => ({ ...value, status: event.target.value as StudioDocumentStatus }))}
              className={fieldClass}
            >
              <option>Draft</option>
              <option>Under Review</option>
              <option>Approved</option>
              <option>Issued</option>
            </select>
          </label>
          <button
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#FF1E1E] px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            <FilePlus2 size={15} />
            {saving ? 'Saving…' : documentEditingId ? 'Save document' : 'Create document'}
          </button>
        </form>
      </div>
    );
  };

  const renderDocumentsHub = () => {
    const proposalsCount = documents.filter(d =>
      ['quotation', 'partnership_proposal', 'sponsorship_proposal'].includes(d.type),
    ).length;
    const invoicesCount = documents.filter(d => d.type === 'invoice').length;
    const corporateCount = documents.filter(
      d => d.type !== 'invoice' && !['quotation', 'partnership_proposal', 'sponsorship_proposal'].includes(d.type),
    ).length;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E1E1E] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all' as const, label: 'All Documents', count: documents.length },
              { id: 'proposals' as const, label: 'Proposals & Quotes', count: proposalsCount },
              { id: 'invoices' as const, label: 'Invoices & Billing', count: invoicesCount },
              { id: 'corporate' as const, label: 'Corporate Docs', count: corporateCount },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDocSubTab(tab.id)}
                className={`rounded px-3 py-1.5 text-xs font-mono tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                  docSubTab === tab.id
                    ? 'bg-white text-black font-semibold'
                    : 'border border-[#2A2A2A] bg-[#121212] text-neutral-400 hover:text-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          {onRequestProduction && (
            <button
              type="button"
              onClick={() =>
                onRequestProduction(
                  buildBrandProductionPrefill(workspace, brandProfile, {
                    category: 'Business Cards',
                    titleSuffix: 'Business Cards & Corporate Collateral',
                  }),
                )
              }
              className="inline-flex items-center gap-1.5 rounded border border-[#2E2E2E] bg-[#141414] px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white whitespace-nowrap shrink-0"
            >
              <Plus size={13} />
              <span>Request Business Collateral</span>
            </button>
          )}
        </div>

        {docSubTab === 'proposals' && renderProposals()}
        {docSubTab === 'invoices' && renderInvoices()}
        {docSubTab === 'corporate' && renderDocumentsListAndForm(true)}
        {docSubTab === 'all' && renderDocumentsListAndForm(false)}
      </div>
    );
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

      {(section === 'profile' || section === 'artist-profile') && renderProfile()}
      {section === 'releases' && renderReleases()}
      {section === 'content' && renderContent()}
      {section === 'assets' && renderAssets()}
      {section === 'brand' && renderBrandIdentity()}
      {section === 'documents' && renderDocumentsHub()}
      {section === 'invoices' && renderInvoices()}
      {section === 'proposals' && renderProposals()}

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-[#2E2E2E] bg-[#0C0C0C] p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[#1E1E1E] pb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  {previewDocument.type.replaceAll('_', ' ')} · {previewDocument.referenceNo}
                </p>
                <h3 className="mt-1 text-lg font-bold text-white">{previewDocument.title}</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Prepared for {previewDocument.recipientName}
                  {previewDocument.recipientOrg ? ` · ${previewDocument.recipientOrg}` : ''} · {previewDocument.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                aria-label="Close document preview"
                className="rounded border border-[#2E2E2E] p-1.5 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            {previewDocument.subject && (
              <p className="text-sm font-semibold text-white">Subject: {previewDocument.subject}</p>
            )}
            <div className="rounded border border-[#1E1E1E] bg-[#111] p-4 text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {previewDocument.bodyContent || 'No body content recorded.'}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#1E1E1E]">
              <button
                type="button"
                onClick={() =>
                  generateCorporateDocumentPdf(
                    {
                      ...previewDocument,
                      workspaceId: workspace.id,
                      recipientAddress: '',
                      authorName: accountName,
                      authorRole: 'Client Review',
                      items:
                        previewDocument.items && previewDocument.items.length > 0
                          ? previewDocument.items
                          : previewDocument.totalAmount
                            ? [
                                {
                                  description: previewDocument.subject || previewDocument.title,
                                  quantity: 1,
                                  unitPrice: previewDocument.totalAmount,
                                  total: previewDocument.totalAmount,
                                },
                              ]
                            : [],
                      paymentTerms: previewDocument.paymentTerms || '',
                      createdAt: previewDocument.createdAt,
                      updatedAt: previewDocument.updatedAt,
                    } as CorporateDocument,
                    workspace,
                  )
                }
                className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600"
              >
                <ArrowDownToLine size={13} />
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                className="rounded border border-[#333] bg-[#141414] px-4 py-2 text-xs text-neutral-200 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Design Canvas Overlay */}
      {activeCanvasDesign && (
        <div className="fixed inset-0 z-50 bg-black/95 p-2 sm:p-4 flex flex-col">
          <DesignCanvasEditor
            initialDesign={activeCanvasDesign}
            targetProjectTitle={
              canvasLinkedReleaseId ? `Release: ${releaseById.get(canvasLinkedReleaseId)?.title || ''}` : workspace.name
            }
            saveAssetLabel="Save to Asset Library"
            onSaveDesign={persistCanvasDraft}
            onSaveAsWorkingAsset={saveCanvasToWorkspaceLibrary}
            onClose={() => setActiveCanvasDesign(null)}
          />
        </div>
      )}
    </div>
  );
};
