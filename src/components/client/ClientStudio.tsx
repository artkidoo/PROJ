import React, { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, getBlob, ref, uploadBytes } from 'firebase/storage';
import { ArrowDownToLine, FilePlus2, ImagePlus, Music2, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { BrandAsset, BrandWorkspaceProfile, ClientProject, CorporateDocument, DocumentType, Workspace } from '../../types';
import { db, storage } from '../../lib/firebase';
import { generateCorporateDocumentPdf } from '../../utils/pdfGenerator';

export type ClientStudioSection = 'profile' | 'releases' | 'content' | 'assets' | 'brand' | 'documents';
type ReleaseStatus = 'Draft' | 'Scheduled' | 'Live' | 'Archived';
type ContentKind = 'Caption' | 'Lyrics' | 'Promotional copy' | 'Creative idea' | 'Social post' | 'Guideline';
type ContentPhase = 'Pre-release' | 'Release day' | 'Post-release' | 'Ongoing';
type ContentStatus = 'Draft' | 'In progress' | 'Ready' | 'Published';
type StudioDocumentStatus = 'Draft' | 'Under Review' | 'Approved' | 'Issued';

interface StudioRelease {
  id: string;
  title: string;
  type: 'Single' | 'EP' | 'Album';
  releaseDate: string;
  trackList: string;
  artworkUrl: string;
  artworkPath?: string;
  streamingUrl: string;
  preSaveUrl: string;
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

interface StudioContentItem {
  id: string;
  title: string;
  kind: ContentKind;
  phase: ContentPhase;
  status: ContentStatus;
  releaseId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

interface StudioAsset {
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
  description: string;
  uploadedAt: string;
}

interface StudioDocument {
  id: string;
  type: DocumentType;
  title: string;
  referenceNo: string;
  date: string;
  recipientName: string;
  recipientOrg: string;
  recipientEmail: string;
  projectId?: string;
  subject: string;
  bodyContent: string;
  totalAmount?: number;
  paymentTerms?: string;
  status: StudioDocumentStatus;
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

interface ClientStudioProps {
  section: ClientStudioSection;
  workspace: Workspace;
  uid: string;
  accountName: string;
  projects: ClientProject[];
  primaryWorkspaceId?: string;
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

const panelClass = 'rounded-xl border border-[#242424] bg-[#0D0D0D] p-4 sm:p-6';
const fieldClass = 'w-full rounded border border-[#303030] bg-[#141414] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF1E1E]';
const labelClass = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500';

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
  if (mimeType.startsWith('audio/')) return mimeType === 'audio/wav' || mimeType === 'audio/x-wav' ? 'WAV' : mimeType === 'audio/aac' ? 'AAC' : mimeType === 'audio/flac' ? 'FLAC' : 'MP3';
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

export const ClientStudio: React.FC<ClientStudioProps> = ({ section, workspace, uid, accountName, projects, primaryWorkspaceId }) => {
  const [artistProfile, setArtistProfile] = useState<ArtistProfileForm>(EMPTY_ARTIST_PROFILE);
  const [brandProfile, setBrandProfile] = useState<BrandWorkspaceProfile>(EMPTY_BRAND_PROFILE);
  const [brandForm, setBrandForm] = useState(workspace.brand);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [loadingAssetId, setLoadingAssetId] = useState('');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef(new Map<string, string>());
  const [releases, setReleases] = useState<StudioRelease[]>([]);
  const [contentItems, setContentItems] = useState<StudioContentItem[]>([]);
  const [assets, setAssets] = useState<StudioAsset[]>([]);
  const [documents, setDocuments] = useState<StudioDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [releaseEditingId, setReleaseEditingId] = useState('');
  const [releaseForm, setReleaseForm] = useState({
    title: '',
    type: 'Single' as StudioRelease['type'],
    releaseDate: '',
    trackList: '',
    artworkUrl: '',
    streamingUrl: '',
    preSaveUrl: '',
    status: 'Draft' as ReleaseStatus,
    isrc: '',
    upc: '',
  });
  const [contentEditingId, setContentEditingId] = useState('');
  const [contentForm, setContentForm] = useState({
    title: '',
    kind: 'Caption' as ContentKind,
    phase: 'Pre-release' as ContentPhase,
    status: 'Draft' as ContentStatus,
    releaseId: '',
    body: '',
  });
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
  const [assetCategory, setAssetCategory] = useState('Artwork');
  const [assetReleaseId, setAssetReleaseId] = useState('');
  const [assetProjectId, setAssetProjectId] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [uploading, setUploading] = useState(false);

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
    const storedPath = isArtistWorkspace(workspace)
      ? workspace.artistProfile?.profileImagePath
      : workspace.brandProfile?.logoPath;
    const externalUrl = isArtistWorkspace(workspace)
      ? workspace.artistProfile?.profileImageUrl
      : workspace.brandProfile?.logoUrl;
    let active = true;
    let objectUrl = '';
    if (!storedPath) {
      setProfileImagePreview(externalUrl || '');
      return () => { active = false; };
    }
    void getBlob(ref(storage, storedPath)).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setProfileImagePreview(objectUrl);
    }).catch(loadError => {
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

  useEffect(() => {
    if (workspace.status === 'Paused' || workspace.status === 'Archived') {
      setLoading(false);
      setError(`This workspace is ${workspace.status.toLowerCase()} and its creative records are temporarily unavailable.`);
      return;
    }
    setLoading(true);
    setError('');
    const base = collection(db, 'workspaces', workspace.id);
    const unsubscribers = [
      onSnapshot(collection(base, 'releases'), snapshot => {
        setReleases(snapshot.docs.map(item => {
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
        }));
        setLoading(false);
      }, err => { setError(messageFromError(err)); setLoading(false); }),
      onSnapshot(collection(base, 'contentItems'), snapshot => {
        setContentItems(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StudioContentItem)));
        setLoading(false);
      }, err => { setError(messageFromError(err)); setLoading(false); }),
      onSnapshot(collection(base, 'brandAssets'), snapshot => {
        setAssets(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StudioAsset)));
        setLoading(false);
      }, err => { setError(messageFromError(err)); setLoading(false); }),
      onSnapshot(collection(base, 'documents'), snapshot => {
        setDocuments(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StudioDocument)));
        setLoading(false);
      }, err => { setError(messageFromError(err)); setLoading(false); }),
    ];
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [workspace.id, workspace.status]);

  const saveWorkspace = async (updates: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', workspace.id), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
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
    if (saved) setError('Artist profile saved.');
  };

  const saveBrandProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspaceName.trim()) {
      setError('Brand name is required.');
      return;
    }
    if (![brandForm.primaryColor, brandForm.secondaryColor, brandForm.accentColor || ''].every(color => /^#[0-9a-fA-F]{6}$/.test(color))) {
      setError('Brand colors must be valid six-digit hex values.');
      return;
    }
    const saved = await saveWorkspace({
      name: workspaceName.trim(),
      description: brandProfile.description,
      brand: { ...brandForm, name: workspaceName.trim(), logoUrl: brandProfile.logoUrl },
      brandProfile,
    });
    if (saved) setError('Brand identity saved.');
  };

  const setReleaseField = <K extends keyof typeof releaseForm>(key: K, value: (typeof releaseForm)[K]) => {
    setReleaseForm(previous => ({ ...previous, [key]: value }));
  };

  const resetReleaseForm = () => {
    setReleaseEditingId('');
    setReleaseForm({
      title: '', type: 'Single', releaseDate: '', trackList: '', artworkUrl: '',
      streamingUrl: '', preSaveUrl: '', status: 'Draft', isrc: '', upc: '',
    });
  };

  const editRelease = (release: StudioRelease) => {
    setReleaseEditingId(release.id);
    setReleaseForm({
      title: release.title || '',
      type: release.type || 'Single',
      releaseDate: release.releaseDate || '',
      trackList: release.trackList || '',
      artworkUrl: release.artworkUrl || '',
      streamingUrl: release.streamingUrl || '',
      preSaveUrl: release.preSaveUrl || '',
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
    const payload = {
      ...releaseForm,
      title: releaseForm.title.trim(),
      workspaceId: workspace.id,
      artistName: workspace.name,
      artistId: workspace.id,
      producer: '',
      songwriters: '',
      credits: '',
      plannedReleaseDate: releaseForm.releaseDate,
      distributionStatus: releaseForm.status === 'Live' ? 'Live' : releaseForm.status === 'Scheduled' ? 'Scheduled' : 'Planning',
      releaseNotes: releaseForm.trackList,
      publicUrl: releaseForm.streamingUrl,
      marketingAssetsCount: 0,
      rightsInfo: '',
      checklist: {
        audioMastered: existingRelease?.checklist?.audioMastered ?? false,
        artworkApproved: existingRelease?.checklist?.artworkApproved ?? Boolean(releaseForm.artworkUrl),
        splitSheetSigned: existingRelease?.checklist?.splitSheetSigned ?? false,
        metadataVerified: existingRelease?.checklist?.metadataVerified ?? Boolean(releaseForm.isrc || releaseForm.upc),
        distributionSubmitted: existingRelease?.checklist?.distributionSubmitted ?? (releaseForm.status === 'Scheduled' || releaseForm.status === 'Live'),
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
      } else {
        await addDoc(collection(db, 'workspaces', workspace.id, 'releases'), payload);
      }
      resetReleaseForm();
    } catch (saveError) {
      setError(messageFromError(saveError));
    } finally {
      setSaving(false);
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
      body: item.body,
    });
  };

  const resetContentForm = () => {
    setContentEditingId('');
    setContentForm({ title: '', kind: 'Caption', phase: 'Pre-release', status: 'Draft', releaseId: '', body: '' });
  };

  const saveContent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!contentForm.title.trim() || !contentForm.body.trim()) return;
    setSaving(true);
    setError('');
    const now = new Date().toISOString();
    const payload = { ...contentForm, title: contentForm.title.trim(), workspaceId: workspace.id, updatedAt: now };
    try {
      if (contentEditingId) await updateDoc(doc(db, 'workspaces', workspace.id, 'contentItems', contentEditingId), payload);
      else await addDoc(collection(db, 'workspaces', workspace.id, 'contentItems'), { ...payload, createdAt: now });
      resetContentForm();
    } catch (saveError) {
      setError(messageFromError(saveError));
    } finally {
      setSaving(false);
    }
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
    const now = new Date().toISOString();
    const payload = { ...documentForm, title: documentForm.title.trim(), workspaceId: workspace.id, authorName: accountName, authorRole: 'Workspace Owner', updatedAt: now };
    try {
      if (documentEditingId) await updateDoc(doc(db, 'workspaces', workspace.id, 'documents', documentEditingId), payload);
      else await addDoc(collection(db, 'workspaces', workspace.id, 'documents'), { ...payload, createdAt: now });
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
    if (!/^(image\/(jpeg|png|svg\+xml|webp|gif|avif)|audio\/(mpeg|wav|x-wav|aac|flac|mp4|m4a|ogg)|video\/(mp4|webm|quicktime)|application\/(pdf|json|xml|zip|x-zip-compressed|font-woff)|font\/(ttf|otf|woff|woff2)|text\/(plain|xml))$/.test(file.type)) {
      setError('This file type is not supported. Use an image, audio/video, PDF, archive, font or text asset.');
      return;
    }
    setUploading(true);
    setError('');
    const assetId = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `workspaces/${workspace.id}/assets/${assetId}/${safeName}`;
    let uploaded = false;
    let assetSaved = false;
    try {
      await uploadBytes(ref(storage, storagePath), file, { contentType: file.type });
      uploaded = true;
      await setDoc(
        doc(db, 'workspaces', workspace.id, 'brandAssets', assetId),
        {
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
          uploadedAt: new Date().toISOString(),
          uploadedBy: uid,
        },
      );
      assetSaved = true;
      if (assetReleaseId && assetCategory === 'Artwork') {
        await updateDoc(doc(db, 'workspaces', workspace.id, 'releases', assetReleaseId), {
          artworkPath: storagePath,
          updatedAt: new Date().toISOString(),
        });
      }
      setAssetDescription('');
    } catch (uploadError) {
      if (uploaded && !assetSaved) {
        try {
          await deleteObject(ref(storage, storagePath));
        } catch (cleanupError) {
          setError(`${messageFromError(uploadError)} The uploaded file could not be cleaned up: ${messageFromError(cleanupError)}`);
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
    try {
      if (asset.storagePath) await deleteObject(ref(storage, asset.storagePath));
      await deleteDoc(doc(db, 'workspaces', workspace.id, 'brandAssets', asset.id));
    } catch (removeError) {
      setError(messageFromError(removeError));
    }
  };

  const setAssetAsImage = async (asset: StudioAsset, target: 'artist' | 'brand') => {
    setError('');
    try {
      if (!asset.storagePath) throw new Error('This asset does not have a private workspace storage path.');
      const field = target === 'artist' ? 'artistProfile.profileImagePath' : 'brandProfile.logoPath';
      const urlField = target === 'artist' ? 'artistProfile.profileImageUrl' : 'brandProfile.logoUrl';
      await updateDoc(doc(db, 'workspaces', workspace.id), {
        [field]: asset.storagePath,
        [urlField]: '',
        updatedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      setError(messageFromError(updateError));
    }
  };

  const removeRecord = async (collectionName: string, id: string) => {
    setError('');
    try {
      await deleteDoc(doc(db, 'workspaces', workspace.id, collectionName, id));
    } catch (removeError) {
      setError(messageFromError(removeError));
    }
  };

  const releaseById = new Map(releases.map(release => [release.id, release]));
  const isArtist = workspace.clientCategory === 'artist' || workspace.type === 'Artist' || workspace.type === 'Personal';
  const isBrand = workspace.clientCategory === 'brand' || workspace.type === 'Brand' || workspace.type === 'Agency' || workspace.clientCategory === 'business' || workspace.type === 'Business' || workspace.type === 'Enterprise';

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
        statusHistory: [
          ...(release.statusHistory || []),
          { status, changedAt: now, changedBy: accountName },
        ],
        updatedAt: now,
      });
    } catch (updateError) {
      setError(messageFromError(updateError));
    }
  };

  const renderProfile = () => (
    <form onSubmit={saveArtistProfile} className={`${panelClass} space-y-5`}>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">Artist OS · Profile</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Tell the story behind the sound.</h2>
        <p className="mt-1 text-sm text-neutral-400">A living artist profile for your releases, production team and creative partners.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className={labelClass}>Artist name</span><input required value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} className={fieldClass} /></label>
        <label><span className={labelClass}>Genre</span><input value={artistProfile.genre} onChange={event => setArtistProfile(value => ({ ...value, genre: event.target.value }))} className={fieldClass} placeholder="Alternative R&B, Afrobeats…" /></label>
        <label className="sm:col-span-2"><span className={labelClass}>Biography</span><textarea rows={5} maxLength={4000} value={artistProfile.biography} onChange={event => setArtistProfile(value => ({ ...value, biography: event.target.value }))} className={fieldClass} placeholder="Share your sound, story and point of view." /></label>
        <label><span className={labelClass}>Instagram URL</span><input type="url" value={artistProfile.instagram} onChange={event => setArtistProfile(value => ({ ...value, instagram: event.target.value }))} className={fieldClass} placeholder="https://" /></label>
        <label><span className={labelClass}>Spotify URL</span><input type="url" value={artistProfile.spotify} onChange={event => setArtistProfile(value => ({ ...value, spotify: event.target.value }))} className={fieldClass} placeholder="https://" /></label>
        <label><span className={labelClass}>Apple Music URL</span><input type="url" value={artistProfile.appleMusic} onChange={event => setArtistProfile(value => ({ ...value, appleMusic: event.target.value }))} className={fieldClass} placeholder="https://" /></label>
        <label><span className={labelClass}>YouTube URL</span><input type="url" value={artistProfile.youtube} onChange={event => setArtistProfile(value => ({ ...value, youtube: event.target.value }))} className={fieldClass} placeholder="https://" /></label>
        <label><span className={labelClass}>Website</span><input type="url" value={artistProfile.website} onChange={event => setArtistProfile(value => ({ ...value, website: event.target.value }))} className={fieldClass} placeholder="https://" /></label>
        <label><span className={labelClass}>Profile image URL</span><input type="url" value={artistProfile.profileImageUrl} onChange={event => setArtistProfile(value => ({ ...value, profileImageUrl: event.target.value, profileImagePath: '' }))} className={fieldClass} placeholder="Upload an image in Asset Library or paste a URL." /></label>
      </div>
      {profileImagePreview && <img src={profileImagePreview} alt={`${workspace.name} profile`} className="h-24 w-24 rounded-full border border-[#333] object-cover" />}
      <button disabled={saving} className="inline-flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} />{saving ? 'Saving…' : 'Save artist profile'}</button>
    </form>
  );

  const renderBrandIdentity = () => (
    <form onSubmit={saveBrandProfile} className={`${panelClass} space-y-5`}>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">Brand OS · Identity</p>
        <h2 className="mt-2 text-2xl font-bold text-white">One identity, consistently expressed.</h2>
        <p className="mt-1 text-sm text-neutral-400">Your brand profile, visual tokens and creative guidelines stay with this workspace.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className={labelClass}>Brand name</span><input required value={workspaceName} onChange={event => setWorkspaceName(event.target.value)} className={fieldClass} /></label>
        <label><span className={labelClass}>Industry</span><input value={brandProfile.industry} onChange={event => setBrandProfile(value => ({ ...value, industry: event.target.value }))} className={fieldClass} placeholder="Industry or category" /></label>
        <label><span className={labelClass}>Website</span><input type="url" value={brandProfile.website} onChange={event => setBrandProfile(value => ({ ...value, website: event.target.value }))} className={fieldClass} placeholder="https://" /></label>
        <label><span className={labelClass}>Logo URL</span><input type="url" value={brandProfile.logoUrl} onChange={event => setBrandProfile(value => ({ ...value, logoUrl: event.target.value, logoPath: '' }))} className={fieldClass} placeholder="Upload a logo in Asset Library or paste a URL." /></label>
        <label className="sm:col-span-2"><span className={labelClass}>Brand description</span><textarea rows={3} value={brandProfile.description} onChange={event => setBrandProfile(value => ({ ...value, description: event.target.value }))} className={fieldClass} placeholder="What the business does and who it serves." /></label>
        <label><span className={labelClass}>Primary color</span><div className="flex gap-2"><input type="color" value={brandForm.primaryColor} onChange={event => setBrandForm(value => ({ ...value, primaryColor: event.target.value }))} className="h-10 w-12 rounded border border-[#303030] bg-[#141414] p-1" /><input value={brandForm.primaryColor} onChange={event => setBrandForm(value => ({ ...value, primaryColor: event.target.value }))} className={fieldClass} /></div></label>
        <label><span className={labelClass}>Accent color</span><div className="flex gap-2"><input type="color" value={brandForm.accentColor || '#FF1E1E'} onChange={event => setBrandForm(value => ({ ...value, accentColor: event.target.value }))} className="h-10 w-12 rounded border border-[#303030] bg-[#141414] p-1" /><input value={brandForm.accentColor || ''} onChange={event => setBrandForm(value => ({ ...value, accentColor: event.target.value }))} className={fieldClass} /></div></label>
        <label><span className={labelClass}>Secondary color</span><div className="flex gap-2"><input type="color" value={brandForm.secondaryColor || '#0A0A0A'} onChange={event => setBrandForm(value => ({ ...value, secondaryColor: event.target.value }))} className="h-10 w-12 rounded border border-[#303030] bg-[#141414] p-1" /><input value={brandForm.secondaryColor || ''} onChange={event => setBrandForm(value => ({ ...value, secondaryColor: event.target.value }))} className={fieldClass} /></div></label>
        <label><span className={labelClass}>Display typography</span><input value={brandForm.typography?.displayFont || ''} onChange={event => setBrandForm(value => ({ ...value, typography: { ...value.typography, displayFont: event.target.value } }))} className={fieldClass} /></label>
        <label><span className={labelClass}>Body typography</span><input value={brandForm.typography?.bodyFont || ''} onChange={event => setBrandForm(value => ({ ...value, typography: { ...value.typography, bodyFont: event.target.value } }))} className={fieldClass} /></label>
        <label><span className={labelClass}>Brand voice</span><textarea rows={3} value={brandProfile.brandVoice} onChange={event => setBrandProfile(value => ({ ...value, brandVoice: event.target.value }))} className={fieldClass} /></label>
        <label><span className={labelClass}>Photography direction</span><textarea rows={3} value={brandProfile.photographyDirection} onChange={event => setBrandProfile(value => ({ ...value, photographyDirection: event.target.value }))} className={fieldClass} /></label>
        <label><span className={labelClass}>Graphic design principles</span><textarea rows={3} value={brandProfile.graphicDesignPrinciples} onChange={event => setBrandProfile(value => ({ ...value, graphicDesignPrinciples: event.target.value }))} className={fieldClass} /></label>
        <label><span className={labelClass}>Logo and usage rules</span><textarea rows={3} value={brandProfile.usageGuidelines} onChange={event => setBrandProfile(value => ({ ...value, usageGuidelines: event.target.value }))} className={fieldClass} /></label>
        <label className="sm:col-span-2"><span className={labelClass}>Creative references</span><textarea rows={3} value={brandProfile.creativeReferences} onChange={event => setBrandProfile(value => ({ ...value, creativeReferences: event.target.value }))} className={fieldClass} placeholder="Links and references for the creative team." /></label>
      </div>
      {profileImagePreview && <img src={profileImagePreview} alt={`${workspace.name} logo`} className="max-h-24 max-w-48 rounded border border-[#292929] bg-white p-2 object-contain" />}
      <button disabled={saving} className="inline-flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} />{saving ? 'Saving…' : 'Save brand identity'}</button>
    </form>
  );

  const renderReleases = () => (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,.7fr)]">
      <section className={panelClass}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">Artist OS · Catalog</p><h2 className="mt-1 text-xl font-bold text-white">Music &amp; releases</h2></div>
          <span className="rounded-full border border-[#333] px-3 py-1 text-xs text-neutral-400">{releases.length} release{releases.length === 1 ? '' : 's'}</span>
        </div>
        {loading && releases.length === 0 ? <p className="text-sm text-neutral-500">Loading your catalog…</p> : releases.length === 0 ? <p className="rounded border border-dashed border-[#333] p-6 text-center text-sm text-neutral-500">Your release history starts here. Add a single, EP or album.</p> : (
          <div className="grid gap-3 md:grid-cols-2">
            {[...releases].sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || '')).map(release => {
              const coverAsset = assets.find(asset => asset.storagePath === release.artworkPath);
              const coverPreview = release.artworkUrl || (coverAsset ? previewUrls[coverAsset.id] : '');
              return <article key={release.id} className="overflow-hidden rounded-lg border border-[#252525] bg-[#111]">
                {coverPreview ? <img src={coverPreview} alt={`${release.title} artwork`} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#231810] to-[#0b0b0b] text-amber-400"><Music2 size={36} /></div>}
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2"><div><h3 className="font-bold text-white">{release.title}</h3><p className="text-xs text-neutral-500">{release.type} · {release.releaseDate || 'Date TBC'}</p></div><select aria-label={`Status for ${release.title}`} value={release.status} onChange={event => void setReleaseStatus(release, event.target.value as ReleaseStatus)} className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-[10px] text-neutral-300"><option>Draft</option><option>Scheduled</option><option>Live</option><option>Archived</option></select></div>
                  {release.trackList && <p className="line-clamp-2 whitespace-pre-line text-xs text-neutral-400">{release.trackList}</p>}
                  {coverAsset && !coverPreview && <button onClick={() => void loadAssetUrl(coverAsset).catch(loadError => setError(messageFromError(loadError)))} className="text-xs text-red-300 underline">Load private cover art preview</button>}
                  {release.statusHistory && release.statusHistory.length > 0 && <details className="text-[10px] text-neutral-500"><summary className="cursor-pointer">Release history · {release.statusHistory.length} update(s)</summary><ol className="mt-2 space-y-1">{[...release.statusHistory].reverse().map((entry, index) => <li key={`${entry.changedAt}-${index}`}>{entry.status} · {entry.changedAt} · {entry.changedBy}</li>)}</ol></details>}
                  <div className="flex flex-wrap gap-3 text-xs">{release.streamingUrl && <a className="text-red-300 underline" href={release.streamingUrl} target="_blank" rel="noreferrer">Streaming</a>}{release.preSaveUrl && <a className="text-red-300 underline" href={release.preSaveUrl} target="_blank" rel="noreferrer">Pre-save</a>}</div>
                  <div className="flex gap-2 pt-1"><button onClick={() => editRelease(release)} className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-white"><Pencil size={12} />Edit</button><button onClick={() => void removeRecord('releases', release.id)} className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-300"><Trash2 size={12} />Delete</button></div>
                </div>
              </article>;
            })}
          </div>
        )}
      </section>
      <form onSubmit={saveRelease} className={`${panelClass} h-fit space-y-3`}>
        <div className="flex items-center justify-between"><h3 className="font-bold text-white">{releaseEditingId ? 'Edit release' : 'Add a release'}</h3>{releaseEditingId && <button type="button" onClick={resetReleaseForm} aria-label="Cancel editing" className="text-neutral-500"><X size={16} /></button>}</div>
        <label><span className={labelClass}>Release title</span><input required value={releaseForm.title} onChange={event => setReleaseField('title', event.target.value)} className={fieldClass} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><span className={labelClass}>Format</span><select value={releaseForm.type} onChange={event => setReleaseField('type', event.target.value as StudioRelease['type'])} className={fieldClass}><option>Single</option><option>EP</option><option>Album</option></select></label>
          <label><span className={labelClass}>Status</span><select value={releaseForm.status} onChange={event => setReleaseField('status', event.target.value as ReleaseStatus)} className={fieldClass}><option>Draft</option><option>Scheduled</option><option>Live</option><option>Archived</option></select></label>
        </div>
        <label><span className={labelClass}>Release date</span><input type="date" value={releaseForm.releaseDate} onChange={event => setReleaseField('releaseDate', event.target.value)} className={fieldClass} /></label>
        <label><span className={labelClass}>Track list / notes</span><textarea rows={3} value={releaseForm.trackList} onChange={event => setReleaseField('trackList', event.target.value)} className={fieldClass} placeholder="One track per line" /></label>
        <label><span className={labelClass}>Artwork URL</span><input type="url" value={releaseForm.artworkUrl} onChange={event => setReleaseField('artworkUrl', event.target.value)} className={fieldClass} placeholder="Use an uploaded asset URL" /></label>
        <label><span className={labelClass}>Streaming link</span><input type="url" value={releaseForm.streamingUrl} onChange={event => setReleaseField('streamingUrl', event.target.value)} className={fieldClass} placeholder="https://" /></label>
        <label><span className={labelClass}>Pre-save link</span><input type="url" value={releaseForm.preSaveUrl} onChange={event => setReleaseField('preSaveUrl', event.target.value)} className={fieldClass} placeholder="https://" /></label>
        <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>ISRC</span><input value={releaseForm.isrc} onChange={event => setReleaseField('isrc', event.target.value)} className={fieldClass} /></label><label><span className={labelClass}>UPC</span><input value={releaseForm.upc} onChange={event => setReleaseField('upc', event.target.value)} className={fieldClass} /></label></div>
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#FF1E1E] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Plus size={15} />{saving ? 'Saving…' : releaseEditingId ? 'Save changes' : 'Create release'}</button>
      </form>
    </div>
  );

  const renderContent = () => (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
      <section className={panelClass}>
        <div className="mb-5"><p className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-400">{isArtist ? 'Artist OS' : 'Brand OS'} · Studio</p><h2 className="mt-1 text-xl font-bold text-white">{isArtist ? 'Content engine' : 'Creative system'}</h2><p className="mt-1 text-sm text-neutral-400">{isArtist ? 'Keep lyrics, release copy and creative ideas connected to the right moment.' : 'Coordinate brand graphics, marketing visuals and social content in one place.'}</p></div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(['All', 'Pre-release', 'Release day', 'Post-release', 'Ongoing'] as const).map(phase => <span key={phase} className="rounded-full border border-[#303030] px-3 py-1 text-[10px] text-neutral-500">{phase === 'All' ? contentItems.length : contentItems.filter(item => item.phase === phase).length} · {phase}</span>)}
        </div>
        {contentItems.length === 0 ? <p className="rounded border border-dashed border-[#333] p-6 text-center text-sm text-neutral-500">No creative material yet. Add the first caption, lyric, concept or visual brief.</p> : (
          <div className="space-y-3">{[...contentItems].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).map(item => (
            <article key={item.id} className="rounded-lg border border-[#252525] bg-[#111] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-white">{item.title}</h3><p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">{item.kind} · {item.phase}{item.releaseId && releaseById.has(item.releaseId) ? ` · ${releaseById.get(item.releaseId)?.title}` : ''}</p></div>
                <select aria-label={`Status for ${item.title}`} value={item.status} onChange={event => void saveStatus('contentItems', item.id, event.target.value)} className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-xs text-neutral-300"><option>Draft</option><option>In progress</option><option>Ready</option><option>Published</option></select>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-300">{item.body}</p>
              <div className="mt-3 flex gap-2"><button onClick={() => editContent(item)} className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-white"><Pencil size={12} />Edit</button><button onClick={() => void removeRecord('contentItems', item.id)} className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-300"><Trash2 size={12} />Delete</button></div>
            </article>
          ))}</div>
        )}
      </section>
      <form onSubmit={saveContent} className={`${panelClass} h-fit space-y-3`}>
        <div className="flex items-center justify-between"><h3 className="font-bold text-white">{contentEditingId ? 'Edit material' : 'New creative material'}</h3>{contentEditingId && <button type="button" onClick={resetContentForm} aria-label="Cancel editing" className="text-neutral-500"><X size={16} /></button>}</div>
        <label><span className={labelClass}>Title</span><input required value={contentForm.title} onChange={event => setContentField('title', event.target.value)} className={fieldClass} placeholder="Working title" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><span className={labelClass}>Material</span><select value={contentForm.kind} onChange={event => setContentField('kind', event.target.value as ContentKind)} className={fieldClass}><option>Caption</option><option>Lyrics</option><option>Promotional copy</option><option>Creative idea</option><option>Social post</option><option>Guideline</option></select></label>
          <label><span className={labelClass}>Phase</span><select value={contentForm.phase} onChange={event => setContentField('phase', event.target.value as ContentPhase)} className={fieldClass}><option>Pre-release</option><option>Release day</option><option>Post-release</option><option>Ongoing</option></select></label>
        </div>
        <label><span className={labelClass}>Related release</span><select value={contentForm.releaseId} onChange={event => setContentField('releaseId', event.target.value)} className={fieldClass}><option value="">No release association</option>{releases.map(release => <option value={release.id} key={release.id}>{release.title}</option>)}</select></label>
        <label><span className={labelClass}>Status</span><select value={contentForm.status} onChange={event => setContentField('status', event.target.value as ContentStatus)} className={fieldClass}><option>Draft</option><option>In progress</option><option>Ready</option><option>Published</option></select></label>
        <label><span className={labelClass}>Copy / notes</span><textarea required rows={7} maxLength={10000} value={contentForm.body} onChange={event => setContentField('body', event.target.value)} className={fieldClass} placeholder="Write the lyric, caption, campaign copy or creative direction." /></label>
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#FF1E1E] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Plus size={15} />{saving ? 'Saving…' : contentEditingId ? 'Save material' : 'Add to content library'}</button>
      </form>
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-5">
      <div className={`${panelClass} grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end`}>
        <div><p className="text-[10px] font-mono uppercase tracking-[0.2em] text-red-400">Shared workspace library</p><h2 className="mt-1 text-xl font-bold text-white">{isArtist ? 'Artist assets' : 'Brand assets'}</h2><p className="mt-1 text-sm text-neutral-400">Private to {workspace.name}. Files stay in this workspace and can be associated with releases and projects.</p></div>
        <div className="grid grid-cols-2 gap-3">
          <label><span className={labelClass}>Category</span><select value={assetCategory} onChange={event => setAssetCategory(event.target.value)} className={fieldClass}><option>Artwork</option><option>Logo</option><option>Photography</option><option>Video</option><option>Visualizer</option><option>Promotional</option><option>Guideline</option><option>Document</option><option>Other</option></select></label>
          <label><span className={labelClass}>Associate with release</span><select value={assetReleaseId} onChange={event => setAssetReleaseId(event.target.value)} className={fieldClass}><option value="">No release</option>{releases.map(release => <option key={release.id} value={release.id}>{release.title}</option>)}</select></label>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"><Upload size={15} />{uploading ? 'Uploading…' : 'Upload asset'}<input name="workspace-asset-file" type="file" className="sr-only" disabled={uploading} onChange={event => void uploadAsset(event)} /></label>
        <label className="md:col-span-2"><span className={labelClass}>Description / usage note</span><input value={assetDescription} onChange={event => setAssetDescription(event.target.value)} className={fieldClass} maxLength={500} placeholder="Optional context for this asset" /></label>
        <label><span className={labelClass}>Production project</span><select value={assetProjectId} onChange={event => setAssetProjectId(event.target.value)} className={fieldClass}><option value="">No project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
      </div>
      {assets.length === 0 ? <div className={`${panelClass} border-dashed text-center text-sm text-neutral-500`}>Your workspace library is ready for artwork, photography, video, visualizers and documents.</div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map(asset => {
            const previewUrl = previewUrls[asset.id] || asset.downloadUrl;
            return <article key={asset.id} className="overflow-hidden rounded-lg border border-[#252525] bg-[#0D0D0D]">
            {previewUrl && asset.mimeType?.startsWith('image/') ? <img src={previewUrl} alt={asset.name} className="aspect-[4/3] w-full object-cover" /> : previewUrl && asset.mimeType?.startsWith('video/') ? <video controls preload="metadata" src={previewUrl} className="aspect-[4/3] w-full bg-black object-contain" /> : previewUrl && asset.mimeType?.startsWith('audio/') ? <div className="flex aspect-[4/3] items-center justify-center bg-[#121212] p-5"><audio controls src={previewUrl} className="w-full" /></div> : previewUrl && asset.mimeType === 'application/pdf' ? <iframe title={`${asset.name} preview`} src={previewUrl} className="aspect-[4/3] w-full bg-white" /> : <div className="flex aspect-[4/3] items-center justify-center bg-[#121212] text-neutral-500"><ImagePlus size={32} /></div>}
            <div className="space-y-2 p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-white">{asset.name}</h3><p className="text-[10px] uppercase tracking-wider text-neutral-500">{asset.category} · {fileSizeLabel(asset.fileSizeBytes || 0)}</p></div><button type="button" onClick={() => void downloadAsset(asset)} disabled={loadingAssetId === asset.id} aria-label={`Download ${asset.name}`} className="rounded border border-[#333] p-2 text-neutral-300 hover:text-white disabled:opacity-50"><ArrowDownToLine size={14} /></button></div>
              {asset.description && <p className="text-xs text-neutral-400">{asset.description}</p>}
              <p className="text-[10px] text-neutral-600">{asset.releaseId ? `Release: ${releaseById.get(asset.releaseId)?.title || asset.releaseId}` : 'Workspace asset'}{asset.projectId ? ` · Project: ${projects.find(project => project.id === asset.projectId)?.title || asset.projectId}` : ''}</p>
              <button type="button" onClick={() => void loadAssetUrl(asset).catch(loadError => setError(messageFromError(loadError)))} disabled={loadingAssetId === asset.id} className="rounded border border-[#333] px-2 py-1 text-[10px] text-neutral-300 disabled:opacity-50">{loadingAssetId === asset.id ? 'Loading preview…' : previewUrls[asset.id] ? 'Preview loaded' : 'Load private preview'}</button>
              {asset.mimeType?.startsWith('image/') && <div className="flex gap-2">{isArtist && <button onClick={() => void setAssetAsImage(asset, 'artist')} className="rounded border border-[#333] px-2 py-1 text-[10px] text-neutral-300">Use as profile image</button>}{isBrand && <button onClick={() => void setAssetAsImage(asset, 'brand')} className="rounded border border-[#333] px-2 py-1 text-[10px] text-neutral-300">Use as logo</button>}</div>}
              <button onClick={() => void removeAsset(asset)} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-300"><Trash2 size={12} />Remove asset</button>
            </div>
          </article>;
          })}
        </div>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
      <section className={panelClass}>
        <div className="mb-5"><p className="text-[10px] font-mono uppercase tracking-[0.2em] text-blue-400">Brand OS · Business</p><h2 className="mt-1 text-xl font-bold text-white">Business documents</h2><p className="mt-1 text-sm text-neutral-400">Draft, revise, approve and download branded invoices, proposals and business correspondence.</p></div>
        {documents.length === 0 ? <p className="rounded border border-dashed border-[#333] p-6 text-center text-sm text-neutral-500">No business documents have been created for this workspace.</p> : <div className="space-y-3">{documents.map(item => <article key={item.id} className="rounded-lg border border-[#252525] bg-[#111] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-white">{item.title}</h3><p className="mt-1 text-[10px] uppercase tracking-wider text-neutral-500">{item.type.replaceAll('_', ' ')} · {item.referenceNo} · {item.date}</p>          <p className="mt-1 text-xs text-neutral-400">Prepared for {item.recipientName}{item.recipientOrg ? ` · ${item.recipientOrg}` : ''}{item.projectId ? ` · ${projects.find(project => project.id === item.projectId)?.title || 'Project'}` : ''}{item.totalAmount ? ` · $${item.totalAmount.toFixed(2)}` : ''}</p></div><select aria-label={`Status for ${item.title}`} value={item.status} onChange={event => void saveStatus('documents', item.id, event.target.value)} className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-xs text-neutral-300"><option>Draft</option><option>Under Review</option><option>Approved</option><option>Issued</option></select></div>
          <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-neutral-300">{item.bodyContent}</p>
          <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => editDocument(item)} className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-white"><Pencil size={12} />Edit</button><button onClick={() => generateCorporateDocumentPdf({
            ...item,
            workspaceId: workspace.id,
            recipientAddress: '',
            authorName: accountName,
            authorRole: 'Workspace Owner',
            items: item.totalAmount ? [{ description: item.subject || item.title, quantity: 1, unitPrice: item.totalAmount, total: item.totalAmount }] : [],
            paymentTerms: item.paymentTerms || '',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          } as CorporateDocument, workspace)} className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-300"><ArrowDownToLine size={12} />Download PDF</button><button onClick={() => downloadText(`${item.referenceNo || item.title}.txt`, `${workspace.name}\n${item.title}\n${item.referenceNo} · ${item.date}\nPrepared for: ${item.recipientName}${item.recipientOrg ? ` · ${item.recipientOrg}` : ''}${item.recipientEmail ? ` · ${item.recipientEmail}` : ''}\nStatus: ${item.status}\n\n${item.subject || ''}\n\n${item.bodyContent}`)} className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-300"><ArrowDownToLine size={12} />Download TXT</button><button onClick={() => void removeRecord('documents', item.id)} className="inline-flex items-center gap-1 rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-400 hover:text-red-300"><Trash2 size={12} />Delete</button></div>
        </article>)}</div>}
      </section>
      <form onSubmit={saveDocument} className={`${panelClass} h-fit space-y-3`}>
        <div className="flex items-center justify-between"><h3 className="font-bold text-white">{documentEditingId ? 'Edit document' : 'Create document'}</h3>{documentEditingId && <button type="button" onClick={resetDocumentForm} aria-label="Cancel editing" className="text-neutral-500"><X size={16} /></button>}</div>
        <label><span className={labelClass}>Document type</span><select value={documentForm.type} onChange={event => setDocumentForm(value => ({ ...value, type: event.target.value as DocumentType }))} className={fieldClass}><option value="invoice">Invoice</option><option value="quotation">Proposal / quotation</option><option value="partnership_proposal">Partnership proposal</option><option value="official_letter">Business letter</option></select></label>
        <label><span className={labelClass}>Title</span><input required value={documentForm.title} onChange={event => setDocumentForm(value => ({ ...value, title: event.target.value }))} className={fieldClass} /></label>
        <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Reference</span><input value={documentForm.referenceNo} onChange={event => setDocumentForm(value => ({ ...value, referenceNo: event.target.value }))} className={fieldClass} placeholder="INV-2026-001" /></label><label><span className={labelClass}>Date</span><input type="date" value={documentForm.date} onChange={event => setDocumentForm(value => ({ ...value, date: event.target.value }))} className={fieldClass} /></label></div>
        <label><span className={labelClass}>Client / recipient name</span><input required value={documentForm.recipientName} onChange={event => setDocumentForm(value => ({ ...value, recipientName: event.target.value }))} className={fieldClass} /></label>
        <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Organization</span><input value={documentForm.recipientOrg} onChange={event => setDocumentForm(value => ({ ...value, recipientOrg: event.target.value }))} className={fieldClass} /></label><label><span className={labelClass}>Email</span><input type="email" value={documentForm.recipientEmail} onChange={event => setDocumentForm(value => ({ ...value, recipientEmail: event.target.value }))} className={fieldClass} /></label></div>
        <label><span className={labelClass}>Related project</span><select value={documentForm.projectId} onChange={event => setDocumentForm(value => ({ ...value, projectId: event.target.value }))} className={fieldClass}><option value="">No project association</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
        {documentForm.type === 'invoice' && <>
          <label><span className={labelClass}>Invoice total (USD)</span><input type="number" min="0" step="0.01" value={documentForm.totalAmount} onChange={event => setDocumentForm(value => ({ ...value, totalAmount: Math.max(0, Number(event.target.value) || 0) }))} className={fieldClass} /></label>
          <label><span className={labelClass}>Payment terms</span><input value={documentForm.paymentTerms} onChange={event => setDocumentForm(value => ({ ...value, paymentTerms: event.target.value }))} className={fieldClass} /></label>
        </>}
        <label><span className={labelClass}>Subject</span><input value={documentForm.subject} onChange={event => setDocumentForm(value => ({ ...value, subject: event.target.value }))} className={fieldClass} /></label>
        <label><span className={labelClass}>Document content</span><textarea rows={7} value={documentForm.bodyContent} onChange={event => setDocumentForm(value => ({ ...value, bodyContent: event.target.value }))} className={fieldClass} placeholder="Editable document copy, scope or payment terms." /></label>
        <label><span className={labelClass}>Status</span><select value={documentForm.status} onChange={event => setDocumentForm(value => ({ ...value, status: event.target.value as StudioDocumentStatus }))} className={fieldClass}><option>Draft</option><option>Under Review</option><option>Approved</option><option>Issued</option></select></label>
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#FF1E1E] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><FilePlus2 size={15} />{saving ? 'Saving…' : documentEditingId ? 'Save document' : 'Create document'}</button>
      </form>
    </div>
  );

  return (
    <div className="space-y-5">
      {error && <div role={error.includes('saved.') ? 'status' : 'alert'} className={`rounded border p-3 text-sm ${error.includes('saved.') ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' : 'border-red-500/30 bg-red-950/30 text-red-300'}`}>{error}</div>}
      {section === 'profile' && renderProfile()}
      {section === 'releases' && renderReleases()}
      {section === 'content' && renderContent()}
      {section === 'assets' && renderAssets()}
      {section === 'brand' && renderBrandIdentity()}
      {section === 'documents' && renderDocuments()}
    </div>
  );
};
