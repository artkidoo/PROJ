import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, getBlob, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  FolderKanban,
  Image as ImageIcon,
  Layers,
  Lock,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import { isAdminRecordActive } from '../../lib/firebaseAuth';
import {
  ALLOWED_PRODUCTION_MIME_TYPES,
  createDeliverableFromBlob,
  inferBrandAssetFileType,
  isDeliverablePromotionRestrictedAsset,
  isInternalStoragePath,
  MAX_PRODUCTION_ASSET_BYTES,
  promoteBrandAssetToDeliverable,
  sanitizeStorageFileName,
  saveCanvasWorkingAssetFromBlob,
} from '../../lib/productionPromotion';
import { useApp } from '../../context/AppContext';
import {
  BrandAsset,
  ClientProfile,
  ClientProject,
  Workspace,
} from '../../types';
import { CampaignCategory, CampaignDesign } from '../../types/campaign';
import { AspectRatioType, CanvasDesign, TemplateFamilyItem } from '../../types/designStudio';
import { CreativeTemplate, MASTER_CREATIVE_TEMPLATES } from '../../data/creativeTemplatesData';
import { TEMPLATE_FAMILIES } from '../../data/templateFamiliesData';
import { buildHonestDesignForTemplate } from '../../utils/templateDesignBuilder';
import {
  isTemplateFamilyRelevantToDepartment,
  isTemplateRelevantToDepartment,
  resolveProjectDepartment,
  resolveWorkspaceDepartment,
} from '../../lib/adminHQNavigation';
import { Modal } from '../common/Modal';
import { DesignCanvasEditor } from '../studio/DesignCanvasEditor';

export type DesignLibraryTab = 'designs' | 'assets' | 'templates';

export interface AdminDesignLibraryProps {
  lockedDepartment?: 'Artist' | 'Brand';
  initialWorkspaceId?: string;
  initialProjectId?: string;
  initialTab?: DesignLibraryTab;
  onOpenProject?: (
    projectId: string,
    tab?: 'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity'
  ) => void;
  onOpenWorkspace?: (workspaceId: string) => void;
  onCreateCreativeProductFromDesign?: (design: CanvasDesign) => void;
}

interface WorkspaceDesignRecord extends CampaignDesign {
  workspaceId: string;
}

interface WorkspaceAssetRecord extends BrandAsset {
  workspaceId: string;
  sourceCollection: 'internalAssets' | 'brandAssets';
  legacyInternalLocation?: boolean;
}

const ASPECT_RATIO_OPTIONS: AspectRatioType[] = [
  '1:1 Square',
  '9:16 Vertical Story',
  '16:9 Landscape',
  '4:5 Portrait',
  'Print / Poster',
  'YouTube Thumbnail',
];

const CAMPAIGN_CATEGORIES: CampaignCategory[] = ['Anticipation', 'Release Day', 'Post-Release'];

const ASSET_CATEGORIES: BrandAsset['category'][] = [
  'Artwork',
  'Logo',
  'Primary Logo',
  'Secondary Logo',
  'Photography',
  'Video',
  'Visualizer',
  'Promotional',
  'Guideline',
  'Typography',
  'Palette',
  'Document',
  'Other',
];

const ASSET_STATUSES: BrandAsset['status'][] = ['Draft', 'Review', 'Approved', 'Archived'];

const BG_THEME_HEX: Record<NonNullable<CreativeTemplate['bgTheme']>, { bg: string; fg: string; muted: string }> = {
  black: { bg: '#080808', fg: '#FFFFFF', muted: '#A3A3A3' },
  pitch: { bg: '#000000', fg: '#FFFFFF', muted: '#A3A3A3' },
  charcoal: { bg: '#151515', fg: '#F5F5F5', muted: '#9CA3AF' },
  cream: { bg: '#F4F1EA', fg: '#111111', muted: '#525252' },
  crimson: { bg: '#2A0707', fg: '#FFF5F5', muted: '#FCA5A5' },
  silver: { bg: '#E5E7EB', fg: '#111827', muted: '#4B5563' },
};

function dimensionsForAspect(aspectRatio: AspectRatioType): { width: number; height: number } {
  switch (aspectRatio) {
    case '9:16 Vertical Story':
      return { width: 1080, height: 1920 };
    case '16:9 Landscape':
      return { width: 1920, height: 1080 };
    case 'YouTube Thumbnail':
      return { width: 1280, height: 720 };
    case '4:5 Portrait':
      return { width: 1080, height: 1350 };
    case 'Print / Poster':
      return { width: 1414, height: 2000 };
    default:
      return { width: 1200, height: 1200 };
  }
}

function formatShortDate(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AdminDesignLibrary: React.FC<AdminDesignLibraryProps> = ({
  lockedDepartment,
  initialWorkspaceId = '',
  initialProjectId = '',
  initialTab = 'designs',
  onOpenProject,
  onOpenWorkspace,
  onCreateCreativeProductFromDesign,
}) => {
  const { firebaseUser, canAccessAdminCenter } = useApp();

  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [designs, setDesigns] = useState<WorkspaceDesignRecord[]>([]);
  const [internalAssets, setInternalAssets] = useState<WorkspaceAssetRecord[]>([]);
  const [sharedAssets, setSharedAssets] = useState<WorkspaceAssetRecord[]>([]);
  const [internalPreviewUrls, setInternalPreviewUrls] = useState<Record<string, string>>({});
  const internalPreviewUrlsRef = useRef(new Map<string, string>());

  const [activeTab, setActiveTab] = useState<DesignLibraryTab>(initialTab);
  const [workspaceFilter, setWorkspaceFilter] = useState(initialWorkspaceId);
  const [projectFilter, setProjectFilter] = useState(initialProjectId);
  const [searchQuery, setSearchQuery] = useState('');

  // Tab-specific filters
  const [designCategoryFilter, setDesignCategoryFilter] = useState<string>('All');
  const [designAspectFilter, setDesignAspectFilter] = useState<string>('All');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('All');
  const [assetStatusFilter, setAssetStatusFilter] = useState<string>('All');
  const [assetScopeFilter, setAssetScopeFilter] = useState<'all' | 'internal' | 'shared'>('all');

  // Template Catalog filters
  const [catalogMode, setCatalogMode] = useState<'creative' | 'families'>('creative');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('All');
  const [templateAspectFilter, setTemplateAspectFilter] = useState<string>('All');
  const [templateFamilyFilter, setTemplateFamilyFilter] = useState<string>('All');

  // Modals & action state
  const [busyAction, setBusyAction] = useState(false);

  // Create / Edit Design Modal
  const [designModal, setDesignModal] = useState<{
    mode: 'create' | 'edit' | 'fromTemplate';
    existingId?: string;
    workspaceId: string;
    projectId: string;
    name: string;
    templateId: string;
    category: CampaignCategory;
    exportPreset: AspectRatioType;
    headline: string;
    subtext: string;
    bgColor: string;
    bgTheme: CanvasDesign['backgroundTheme'];
    internalNotes: string;
    baseCanvasDesign?: CanvasDesign;
  } | null>(null);

  // Upload Asset Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadWorkspaceId, setUploadWorkspaceId] = useState('');
  const [uploadProjectId, setUploadProjectId] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<BrandAsset['category']>('Artwork');
  const [uploadStatus, setUploadStatus] = useState<BrandAsset['status']>('Draft');
  const [uploadScope, setUploadScope] = useState<'internal' | 'shared'>('internal');
  const [uploadVersion, setUploadVersion] = useState('v1.0');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadUsageRules, setUploadUsageRules] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Promote Asset to Deliverable Modal
  const [stageDeliverableModal, setStageDeliverableModal] = useState<{
    asset: WorkspaceAssetRecord;
    targetProjectId: string;
    title: string;
    notes: string;
  } | null>(null);

  // Active DesignCanvasEditor creative production session
  const [activeCanvasSession, setActiveCanvasSession] = useState<{
    design: CanvasDesign;
    workspaceId: string;
    projectId: string;
    campaignDesignId?: string;
    templateId: string;
    category: CampaignCategory;
    internalNotes: string;
  } | null>(null);
  const [canvasOverlayNotice, setCanvasOverlayNotice] = useState('');
  const [canvasOverlayError, setCanvasOverlayError] = useState('');

  // Sync incoming navigation context props cleanly
  useEffect(() => {
    setWorkspaceFilter(initialWorkspaceId || '');
  }, [initialWorkspaceId]);

  useEffect(() => {
    setProjectFilter(initialProjectId || '');
  }, [initialProjectId]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Verify admin record + top-level workspace/project/client subscriptions
  useEffect(() => {
    setIsAdminVerified(false);
    setLoading(true);
    setError('');
    setWorkspaces([]);
    setProjects([]);
    setClients([]);

    if (!firebaseUser || !canAccessAdminCenter) {
      setLoading(false);
      return;
    }

    let active = true;
    let unsubTop: (() => void) | undefined;

    const verifyAdmin = async () => {
      try {
        const adminRef = doc(db, 'admins', firebaseUser.uid);
        let snap;
        try {
          snap = await getDocFromServer(adminRef);
        } catch (firstErr) {
          const code =
            firstErr && typeof firstErr === 'object' && 'code' in firstErr
              ? String((firstErr as { code?: unknown }).code || '')
              : '';
          if (code.includes('permission-denied')) {
            await firebaseUser.getIdToken(true);
            snap = await getDocFromServer(adminRef);
          } else {
            snap = await getDoc(adminRef);
          }
        }
        if (!active) return;
        if (!isAdminRecordActive(snap)) {
          setError('Active platform administrator access is required.');
          setLoading(false);
          return;
        }
        setIsAdminVerified(true);

        const unsubs = [
          onSnapshot(
            collection(db, 'workspaces'),
            snapshot => {
              setWorkspaces(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Workspace)));
              setLoading(false);
            },
            err => {
              setError(err?.message || 'Unable to load workspaces.');
              setLoading(false);
            }
          ),
          onSnapshot(
            collection(db, 'clientProjects'),
            snapshot => {
              setProjects(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ClientProject)));
            },
            err => setError(err?.message || 'Unable to load production projects.')
          ),
          onSnapshot(
            collection(db, 'clientProfiles'),
            snapshot => {
              setClients(snapshot.docs.map(item => ({ uid: item.id, ...item.data() } as ClientProfile)));
            },
            err => setError(err?.message || 'Unable to load client profiles.')
          ),
        ];

        unsubTop = () => unsubs.forEach(u => u());
      } catch (err: unknown) {
        if (active) {
          const message = err instanceof Error ? err.message : 'Unable to verify administrator credentials.';
          setError(message);
          setLoading(false);
        }
      }
    };

    void verifyAdmin();

    return () => {
      active = false;
      unsubTop?.();
    };
  }, [firebaseUser, canAccessAdminCenter]);

  useEffect(() => {
    const previewMap = internalPreviewUrlsRef.current;
    return () => {
      previewMap.forEach(url => URL.revokeObjectURL(url));
      previewMap.clear();
    };
  }, []);

  // Subscribe with bounded queries (3 collectionGroup listeners across all workspaces OR 3 scoped listeners)
  useEffect(() => {
    if (!isAdminVerified) {
      setDesigns([]);
      setInternalAssets([]);
      setSharedAssets([]);
      return;
    }

    const extractWorkspaceId = (docWorkspaceId: unknown, parentWorkspaceId?: string) =>
      (typeof docWorkspaceId === 'string' && docWorkspaceId) || parentWorkspaceId || '';

    const designsSource = workspaceFilter
      ? collection(db, 'workspaces', workspaceFilter, 'campaignDesigns')
      : collectionGroup(db, 'campaignDesigns');
    const internalAssetsSource = workspaceFilter
      ? collection(db, 'workspaces', workspaceFilter, 'internalAssets')
      : collectionGroup(db, 'internalAssets');
    const sharedAssetsSource = workspaceFilter
      ? collection(db, 'workspaces', workspaceFilter, 'brandAssets')
      : collectionGroup(db, 'brandAssets');

    const unsubs = [
      onSnapshot(
        designsSource,
        snapshot => {
          const rows = snapshot.docs
            .map((item): WorkspaceDesignRecord | null => {
              const data = item.data() as CampaignDesign;
              const workspaceId = extractWorkspaceId(data.workspaceId, item.ref.parent.parent?.id);
              if (!workspaceId) return null;
              return {
                ...data,
                id: item.id,
                workspaceId,
              };
            })
            .filter((row): row is WorkspaceDesignRecord => row !== null);
          setDesigns(rows);
        },
        err => setError(err?.message || 'Unable to load internal production design specifications.')
      ),
      onSnapshot(
        internalAssetsSource,
        snapshot => {
          const rows = snapshot.docs
            .map((item): WorkspaceAssetRecord | null => {
              const data = item.data() as BrandAsset;
              const workspaceId = extractWorkspaceId(data.workspaceId, item.ref.parent.parent?.id);
              if (!workspaceId) return null;
              return {
                ...data,
                id: item.id,
                workspaceId,
                sourceCollection: 'internalAssets',
                legacyInternalLocation: false,
              };
            })
            .filter((row): row is WorkspaceAssetRecord => row !== null);
          setInternalAssets(rows);
        },
        err => setError(err?.message || 'Unable to load internal production assets.')
      ),
      onSnapshot(
        sharedAssetsSource,
        snapshot => {
          const rows = snapshot.docs
            .map((item): WorkspaceAssetRecord | null => {
              const data = item.data() as BrandAsset;
              const workspaceId = extractWorkspaceId(data.workspaceId, item.ref.parent.parent?.id);
              if (!workspaceId) return null;
              return {
                ...data,
                id: item.id,
                workspaceId,
                sourceCollection: 'brandAssets',
                legacyInternalLocation: isInternalStoragePath(data.storagePath),
              };
            })
            .filter((row): row is WorkspaceAssetRecord => row !== null);
          setSharedAssets(rows);
        },
        err => setError(err?.message || 'Unable to load shared workspace assets.')
      ),
    ];

    return () => {
      unsubs.forEach(u => u());
    };
  }, [isAdminVerified, workspaceFilter]);

  const workspacesById = useMemo(
    () => new Map(workspaces.map(w => [w.id, w])),
    [workspaces]
  );
  const projectsById = useMemo(
    () => new Map(projects.map(p => [p.id, p])),
    [projects]
  );
  const clientsByUid = useMemo(
    () => new Map(clients.map(c => [c.uid, c])),
    [clients]
  );

  const scopedWorkspaces = useMemo(() => {
    if (!lockedDepartment) return workspaces;
    return workspaces.filter(ws => resolveWorkspaceDepartment(ws) === lockedDepartment);
  }, [workspaces, lockedDepartment]);

  const scopedWorkspaceIds = useMemo(
    () => new Set(scopedWorkspaces.map(w => w.id)),
    [scopedWorkspaces]
  );

  const scopedProjects = useMemo(() => {
    if (!lockedDepartment) return projects;
    return projects.filter(p => {
      if (p.workspaceId && scopedWorkspaceIds.has(p.workspaceId)) return true;
      return resolveProjectDepartment(p, clientsByUid, workspacesById) === lockedDepartment;
    });
  }, [projects, lockedDepartment, scopedWorkspaceIds, clientsByUid, workspacesById]);

  // If projectFilter is set and workspaceFilter is blank, let projects dropdown still filter cleanly
  const projectsForDropdown = useMemo(() => {
    const base = workspaceFilter
      ? scopedProjects.filter(p => p.workspaceId === workspaceFilter)
      : scopedProjects;
    return [...base].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [scopedProjects, workspaceFilter]);

  const allDesigns = useMemo(
    () =>
      [...designs]
        .filter(d => !lockedDepartment || scopedWorkspaceIds.has(d.workspaceId))
        .sort((a, b) =>
          (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
        ),
    [designs, lockedDepartment, scopedWorkspaceIds]
  );

  const allAssets = useMemo(() => {
    const merged = new Map<string, WorkspaceAssetRecord>();
    for (const item of sharedAssets) {
      if (!lockedDepartment || scopedWorkspaceIds.has(item.workspaceId)) {
        merged.set(`${item.workspaceId}/${item.id}`, item);
      }
    }
    for (const item of internalAssets) {
      if (!lockedDepartment || scopedWorkspaceIds.has(item.workspaceId)) {
        merged.set(`${item.workspaceId}/${item.id}`, item);
      }
    }
    return Array.from(merged.values()).sort((a, b) =>
      (b.uploadedAt || '').localeCompare(a.uploadedAt || '')
    );
  }, [internalAssets, sharedAssets, lockedDepartment, scopedWorkspaceIds]);

  const legacyInternalAssets = useMemo(
    () => allAssets.filter(asset => asset.legacyInternalLocation),
    [allAssets]
  );

  const legacyUnscopedSharedAssets = useMemo(
    () =>
      allAssets.filter(
        asset =>
          asset.sourceCollection === 'brandAssets' &&
          !asset.legacyInternalLocation &&
          asset.isInternal !== false
      ),
    [allAssets]
  );

  const filteredDesigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allDesigns.filter(design => {
      if (workspaceFilter && design.workspaceId !== workspaceFilter) return false;
      if (projectFilter && design.projectId !== projectFilter) return false;
      if (designCategoryFilter !== 'All' && design.category !== designCategoryFilter) return false;
      if (designAspectFilter !== 'All' && design.exportPreset !== designAspectFilter) return false;
      if (!q) return true;
      const ws = workspacesById.get(design.workspaceId);
      const proj = design.projectId ? projectsById.get(design.projectId) : undefined;
      return (
        design.name.toLowerCase().includes(q) ||
        (design.templateId || '').toLowerCase().includes(q) ||
        (design.internalNotes || '').toLowerCase().includes(q) ||
        (ws?.name || '').toLowerCase().includes(q) ||
        (proj?.title || '').toLowerCase().includes(q)
      );
    });
  }, [
    allDesigns,
    workspaceFilter,
    projectFilter,
    designCategoryFilter,
    designAspectFilter,
    searchQuery,
    workspacesById,
    projectsById,
  ]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allAssets.filter(asset => {
      if (workspaceFilter && asset.workspaceId !== workspaceFilter) return false;
      if (projectFilter && asset.projectId !== projectFilter) return false;
      if (assetCategoryFilter !== 'All' && asset.category !== assetCategoryFilter) return false;
      if (assetStatusFilter !== 'All' && asset.status !== assetStatusFilter) return false;
      const internal = isInternalStoragePath(asset.storagePath);
      if (assetScopeFilter === 'internal' && !internal) return false;
      if (assetScopeFilter === 'shared' && internal) return false;
      if (!q) return true;
      const ws = workspacesById.get(asset.workspaceId);
      const proj = asset.projectId ? projectsById.get(asset.projectId) : undefined;
      return (
        asset.name.toLowerCase().includes(q) ||
        (asset.description || '').toLowerCase().includes(q) ||
        (asset.usageRules || '').toLowerCase().includes(q) ||
        (ws?.name || '').toLowerCase().includes(q) ||
        (proj?.title || '').toLowerCase().includes(q)
      );
    });
  }, [
    allAssets,
    workspaceFilter,
    projectFilter,
    assetCategoryFilter,
    assetStatusFilter,
    assetScopeFilter,
    searchQuery,
    workspacesById,
    projectsById,
  ]);

  const departmentCreativeTemplates = useMemo(() => {
    if (!lockedDepartment) return MASTER_CREATIVE_TEMPLATES;
    return MASTER_CREATIVE_TEMPLATES.filter(t =>
      isTemplateRelevantToDepartment(t.category, lockedDepartment, t.title)
    );
  }, [lockedDepartment]);

  const departmentFamilyTemplates = useMemo(() => {
    if (!lockedDepartment) return TEMPLATE_FAMILIES;
    return TEMPLATE_FAMILIES.filter(t =>
      isTemplateFamilyRelevantToDepartment(t.familyName, t.design?.templateFamily, lockedDepartment)
    );
  }, [lockedDepartment]);

  const creativeTemplateCategories = useMemo(
    () => Array.from(new Set(departmentCreativeTemplates.map(t => t.category))),
    [departmentCreativeTemplates]
  );

  const templateFamiliesList = useMemo(
    () => Array.from(new Set(departmentFamilyTemplates.map(t => t.familyName))),
    [departmentFamilyTemplates]
  );

  const filteredCreativeTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return departmentCreativeTemplates.filter(t => {
      if (templateCategoryFilter !== 'All' && t.category !== templateCategoryFilter) return false;
      if (templateAspectFilter !== 'All' && t.aspectRatio !== templateAspectFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.style.toLowerCase().includes(q) ||
        t.headline.toLowerCase().includes(q)
      );
    });
  }, [departmentCreativeTemplates, templateCategoryFilter, templateAspectFilter, searchQuery]);

  const filteredFamilyTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return departmentFamilyTemplates.filter(t => {
      if (templateFamilyFilter !== 'All' && t.familyName !== templateFamilyFilter) return false;
      if (templateAspectFilter !== 'All' && t.aspectRatio !== templateAspectFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.familyName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [departmentFamilyTemplates, templateFamilyFilter, templateAspectFilter, searchQuery]);

  // Fail-closed authorization guard
  if (!firebaseUser || !canAccessAdminCenter) {
    return (
      <div className="border border-red-900/50 bg-[#0C0C0C] p-6 text-sm text-red-300">
        Restricted to active KeedoHub platform administrators.
      </div>
    );
  }

  const openBlankDesignModal = () => {
    const defaultWsId = workspaceFilter || scopedWorkspaces[0]?.id || '';
    const defaultProjId =
      projectFilter && (!defaultWsId || projectsById.get(projectFilter)?.workspaceId === defaultWsId)
        ? projectFilter
        : scopedProjects.find(p => p.workspaceId === defaultWsId)?.id || '';
    setDesignModal({
      mode: 'create',
      workspaceId: defaultWsId,
      projectId: defaultProjId,
      name: '',
      templateId: 'custom-production-spec',
      category: 'Release Day',
      exportPreset: '1:1 Square',
      headline: '',
      subtext: '',
      bgColor: '#080808',
      bgTheme: 'black',
      internalNotes: '',
    });
  };

  const openTemplateStageModal = (template: CreativeTemplate) => {
    const built = buildHonestDesignForTemplate(template);
    const defaultWsId = workspaceFilter || scopedWorkspaces[0]?.id || '';
    const defaultProjId =
      projectFilter || scopedProjects.find(p => p.workspaceId === defaultWsId)?.id || '';
    setDesignModal({
      mode: 'fromTemplate',
      workspaceId: defaultWsId,
      projectId: defaultProjId,
      name: template.title,
      templateId: template.id,
      category:
        template.category === 'Pre-Launch Campaigns'
          ? 'Anticipation'
          : template.category === 'Post-Launch Campaigns'
            ? 'Post-Release'
            : 'Release Day',
      exportPreset: template.aspectRatio,
      headline: template.headline,
      subtext: template.subtext,
      bgColor: built.backgroundColor,
      bgTheme: built.backgroundTheme,
      internalNotes: `${template.category} · ${template.style} · ${template.tagline}`,
      baseCanvasDesign: built,
    });
  };

  const openFamilyTemplateStageModal = (item: TemplateFamilyItem) => {
    const defaultWsId = workspaceFilter || scopedWorkspaces[0]?.id || '';
    const defaultProjId =
      projectFilter || scopedProjects.find(p => p.workspaceId === defaultWsId)?.id || '';
    const textEls = item.design.elements.filter(el => el.type === 'text');
    setDesignModal({
      mode: 'fromTemplate',
      workspaceId: defaultWsId,
      projectId: defaultProjId,
      name: item.title,
      templateId: item.id,
      category: 'Release Day',
      exportPreset: item.aspectRatio,
      headline: textEls[0]?.text || item.title,
      subtext: textEls[1]?.text || item.description,
      bgColor: item.design.backgroundColor,
      bgTheme: item.design.backgroundTheme,
      internalNotes: `${item.familyName} · ${item.description}`,
      baseCanvasDesign: item.design,
    });
  };

  const openEditDesignModal = (design: WorkspaceDesignRecord) => {
    const textEls = (design.canvasDesign?.elements || []).filter(el => el.type === 'text');
    setDesignModal({
      mode: 'edit',
      existingId: design.id,
      workspaceId: design.workspaceId,
      projectId: design.projectId || '',
      name: design.name,
      templateId: design.templateId,
      category: design.category,
      exportPreset: design.exportPreset,
      headline: textEls[0]?.text || '',
      subtext: textEls[1]?.text || '',
      bgColor: design.canvasDesign?.backgroundColor || '#080808',
      bgTheme: design.canvasDesign?.backgroundTheme || 'black',
      internalNotes: design.internalNotes || '',
      baseCanvasDesign: design.canvasDesign,
    });
  };

  const buildDesignModalPayload = () => {
    if (!designModal || !designModal.workspaceId || !designModal.name.trim()) {
      return null;
    }
    const now = new Date().toISOString();
    const targetRef =
      designModal.mode === 'edit' && designModal.existingId
        ? doc(db, 'workspaces', designModal.workspaceId, 'campaignDesigns', designModal.existingId)
        : doc(collection(db, 'workspaces', designModal.workspaceId, 'campaignDesigns'));
    const dims = dimensionsForAspect(designModal.exportPreset);

    let canvasDesign: CanvasDesign;
    if (designModal.baseCanvasDesign) {
      const clonedElements = designModal.baseCanvasDesign.elements.map(el => ({ ...el }));
      let textCount = 0;
      for (const el of clonedElements) {
        if (el.type === 'text') {
          if (textCount === 0 && designModal.headline.trim()) el.text = designModal.headline.trim();
          if (textCount === 1 && designModal.subtext.trim()) el.text = designModal.subtext.trim();
          textCount += 1;
        }
      }
      canvasDesign = {
        ...designModal.baseCanvasDesign,
        id: targetRef.id,
        workspaceId: designModal.workspaceId,
        name: designModal.name.trim(),
        aspectRatio: designModal.exportPreset,
        width: dims.width,
        height: dims.height,
        backgroundColor: designModal.bgColor,
        backgroundTheme: designModal.bgTheme,
        elements: clonedElements,
        updatedAt: now,
      };
    } else {
      canvasDesign = {
        id: targetRef.id,
        workspaceId: designModal.workspaceId,
        name: designModal.name.trim(),
        aspectRatio: designModal.exportPreset,
        width: dims.width,
        height: dims.height,
        backgroundColor: designModal.bgColor,
        backgroundTheme: designModal.bgTheme,
        category: designModal.category,
        elements: [
          {
            id: `el-head-${targetRef.id}`,
            type: 'text',
            name: 'Primary Headline',
            x: 50,
            y: 42,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            visible: true,
            text: designModal.headline.trim() || designModal.name.trim(),
            fontFamily: 'sans',
            fontSize: 48,
            fontWeight: '800',
            textAlign: 'center',
            color: designModal.bgTheme === 'cream' || designModal.bgTheme === 'silver' ? '#111111' : '#FFFFFF',
          },
          {
            id: `el-sub-${targetRef.id}`,
            type: 'text',
            name: 'Production Subtext',
            x: 50,
            y: 62,
            rotation: 0,
            opacity: 0.85,
            zIndex: 2,
            visible: true,
            text: designModal.subtext.trim() || 'KeedoHub Production Specification',
            fontFamily: 'mono',
            fontSize: 16,
            fontWeight: '500',
            textAlign: 'center',
            color: '#A3A3A3',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
    }

    const payload: CampaignDesign = {
      id: targetRef.id,
      workspaceId: designModal.workspaceId,
      projectId: designModal.projectId || '',
      name: designModal.name.trim(),
      templateId: designModal.templateId || 'custom-production-spec',
      canvasDesign,
      category: designModal.category,
      exportPreset: designModal.exportPreset,
      internalNotes: designModal.internalNotes.trim(),
      createdAt:
        designModal.mode === 'edit' && designModal.baseCanvasDesign?.createdAt
          ? designModal.baseCanvasDesign.createdAt
          : now,
      updatedAt: now,
    };

    return { targetRef, payload, canvasDesign };
  };

  const persistDesignModal = async (openCanvasAfterSave: boolean) => {
    const built = buildDesignModalPayload();
    if (!built) {
      setError('Select a workspace and enter a production design name.');
      return;
    }
    setBusyAction(true);
    setError('');
    setStatusMessage('');
    try {
      await setDoc(built.targetRef, built.payload, { merge: true });
      setStatusMessage(
        designModal?.mode === 'edit'
          ? `Updated production design "${built.payload.name}".`
          : `Saved production design "${built.payload.name}" to workspace library.`
      );
      setDesignModal(null);
      setActiveTab('designs');
      if (openCanvasAfterSave) {
        setCanvasOverlayNotice('');
        setCanvasOverlayError('');
        setActiveCanvasSession({
          design: built.canvasDesign,
          workspaceId: built.payload.workspaceId || designModal?.workspaceId || '',
          projectId: built.payload.projectId || '',
          campaignDesignId: built.payload.id,
          templateId: built.payload.templateId,
          category: built.payload.category,
          internalNotes: built.payload.internalNotes || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  };

  const saveDesignSpec = async (event: React.FormEvent) => {
    event.preventDefault();
    await persistDesignModal(false);
  };

  const launchCanvasFromDesign = (design: WorkspaceDesignRecord) => {
    const dims = dimensionsForAspect(design.exportPreset);
    const now = new Date().toISOString();
    const fallbackCanvas: CanvasDesign = design.canvasDesign || {
      id: design.id,
      workspaceId: design.workspaceId,
      name: design.name,
      aspectRatio: design.exportPreset,
      width: dims.width,
      height: dims.height,
      backgroundColor: '#080808',
      backgroundTheme: 'black',
      category: design.category,
      elements: [
        {
          id: `el-head-${design.id}`,
          type: 'text',
          name: 'Primary Headline',
          x: 50,
          y: 45,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          visible: true,
          text: design.name,
          fontFamily: 'sans',
          fontSize: 48,
          fontWeight: '800',
          textAlign: 'center',
          color: '#FFFFFF',
        },
      ],
      createdAt: design.createdAt || now,
      updatedAt: design.updatedAt || now,
    };
    const defaultProj =
      design.projectId ||
      (projectFilter && projectsById.get(projectFilter)?.workspaceId === design.workspaceId ? projectFilter : '') ||
      projects.find(p => p.workspaceId === design.workspaceId)?.id ||
      '';
    setCanvasOverlayNotice('');
    setCanvasOverlayError('');
    setActiveCanvasSession({
      design: { ...fallbackCanvas, workspaceId: design.workspaceId },
      workspaceId: design.workspaceId,
      projectId: defaultProj,
      campaignDesignId: design.id,
      templateId: design.templateId,
      category: design.category,
      internalNotes: design.internalNotes || '',
    });
  };

  const launchCanvasFromCreativeTemplate = (template: CreativeTemplate) => {
    const wsId = workspaceFilter || scopedWorkspaces[0]?.id || '';
    if (!wsId) {
      setError('Create or select a client workspace before opening the creative engine.');
      return;
    }
    const projId =
      (projectFilter && projectsById.get(projectFilter)?.workspaceId === wsId ? projectFilter : '') ||
      scopedProjects.find(p => p.workspaceId === wsId)?.id ||
      '';
    const built = buildHonestDesignForTemplate(template);
    const category: CampaignCategory =
      template.category === 'Pre-Launch Campaigns'
        ? 'Anticipation'
        : template.category === 'Post-Launch Campaigns'
          ? 'Post-Release'
          : 'Release Day';
    setCanvasOverlayNotice('');
    setCanvasOverlayError('');
    setActiveCanvasSession({
      design: { ...built, workspaceId: wsId },
      workspaceId: wsId,
      projectId: projId,
      templateId: template.id,
      category,
      internalNotes: `${template.category} · ${template.style} · ${template.tagline}`,
    });
  };

  const launchCanvasFromFamilyTemplate = (item: TemplateFamilyItem) => {
    const wsId = workspaceFilter || scopedWorkspaces[0]?.id || '';
    if (!wsId) {
      setError('Create or select a client workspace before opening the creative engine.');
      return;
    }
    const projId =
      (projectFilter && projectsById.get(projectFilter)?.workspaceId === wsId ? projectFilter : '') ||
      scopedProjects.find(p => p.workspaceId === wsId)?.id ||
      '';
    setCanvasOverlayNotice('');
    setCanvasOverlayError('');
    setActiveCanvasSession({
      design: {
        ...item.design,
        workspaceId: wsId,
        elements: item.design.elements.map(el => ({ ...el })),
      },
      workspaceId: wsId,
      projectId: projId,
      templateId: item.id,
      category: 'Release Day',
      internalNotes: `${item.familyName} · ${item.description}`,
    });
  };

  const launchBlankCanvasEngine = () => {
    const wsId = workspaceFilter || scopedWorkspaces[0]?.id || '';
    if (!wsId) {
      setError('Create or select a client workspace before opening the creative engine.');
      return;
    }
    const projId =
      (projectFilter && projectsById.get(projectFilter)?.workspaceId === wsId ? projectFilter : '') ||
      scopedProjects.find(p => p.workspaceId === wsId)?.id ||
      '';
    const now = new Date().toISOString();
    const blankDesign: CanvasDesign = {
      id: `studio-${Date.now()}`,
      workspaceId: wsId,
      name: projectsById.get(projId)?.title
        ? `${projectsById.get(projId)?.title} Key Visual`
        : 'New Studio Production Design',
      aspectRatio: '1:1 Square',
      width: 1200,
      height: 1200,
      backgroundColor: '#080808',
      backgroundTheme: 'black',
      category: 'Release Day',
      elements: [
        {
          id: `el-title-${Date.now()}`,
          type: 'text',
          name: 'Main Title',
          x: 50,
          y: 45,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          visible: true,
          text: 'KEEDOHUB STUDIO',
          fontFamily: 'sans',
          fontSize: 56,
          fontWeight: '800',
          textAlign: 'center',
          color: '#FFFFFF',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    setCanvasOverlayNotice('');
    setCanvasOverlayError('');
    setActiveCanvasSession({
      design: blankDesign,
      workspaceId: wsId,
      projectId: projId,
      templateId: 'custom-canvas-studio',
      category: 'Release Day',
      internalNotes: 'Created directly in DesignCanvasEditor production engine.',
    });
  };

  const duplicateDesign = async (design: WorkspaceDesignRecord) => {
    setBusyAction(true);
    setError('');
    setStatusMessage('');
    try {
      const targetRef = doc(collection(db, 'workspaces', design.workspaceId, 'campaignDesigns'));
      const now = new Date().toISOString();
      await setDoc(targetRef, {
        ...design,
        id: targetRef.id,
        name: `${design.name} (Copy)`,
        canvasDesign: {
          ...design.canvasDesign,
          id: targetRef.id,
          name: `${design.name} (Copy)`,
          createdAt: now,
          updatedAt: now,
        },
        createdAt: now,
        updatedAt: now,
      });
      setStatusMessage(`Duplicated "${design.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  };

  const deleteDesign = async (design: WorkspaceDesignRecord) => {
    setBusyAction(true);
    setError('');
    setStatusMessage('');
    try {
      await deleteDoc(doc(db, 'workspaces', design.workspaceId, 'campaignDesigns', design.id));
      setStatusMessage(`Removed production design "${design.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  };

  const downloadDesignJson = (design: WorkspaceDesignRecord) => {
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeStorageFileName(design.name.toLowerCase().replace(/\s+/g, '-'))}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openUploadAssetModal = () => {
    const defaultWs = workspaceFilter || scopedWorkspaces[0]?.id || '';
    const defaultProj =
      projectFilter && (!defaultWs || projectsById.get(projectFilter)?.workspaceId === defaultWs)
        ? projectFilter
        : '';
    setUploadWorkspaceId(defaultWs);
    setUploadProjectId(defaultProj);
    setUploadName('');
    setUploadCategory('Artwork');
    setUploadStatus('Draft');
    setUploadScope('internal');
    setUploadVersion('v1.0');
    setUploadDescription('');
    setUploadUsageRules('');
    setUploadFile(null);
    setUploadModalOpen(true);
  };

  const handleUploadAsset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!uploadWorkspaceId || !uploadFile) {
      setError('Select a target workspace and file to upload.');
      return;
    }
    if (!ALLOWED_PRODUCTION_MIME_TYPES.has(uploadFile.type)) {
      setError('Unsupported file type. Upload an allowed image, audio, video, PDF, font, JSON, or ZIP asset.');
      return;
    }
    if (uploadFile.size <= 0 || uploadFile.size >= MAX_PRODUCTION_ASSET_BYTES) {
      setError('Asset files must be larger than 0 bytes and smaller than 50 MB.');
      return;
    }

    setBusyAction(true);
    setError('');
    setStatusMessage('');
    const targetCollection = uploadScope === 'internal' ? 'internalAssets' : 'brandAssets';
    const assetRef = doc(collection(db, 'workspaces', uploadWorkspaceId, targetCollection));
    const safeFileName = sanitizeStorageFileName(uploadFile.name, 'asset');
    const storagePath =
      uploadScope === 'internal'
        ? `workspaces/${uploadWorkspaceId}/internal/assets/${assetRef.id}/${safeFileName}`
        : `workspaces/${uploadWorkspaceId}/assets/${assetRef.id}/${safeFileName}`;

    let storageUploaded = false;
    let metadataSaved = false;
    try {
      const uploaded = await uploadBytes(ref(storage, storagePath), uploadFile, {
        contentType: uploadFile.type,
      });
      storageUploaded = true;
      // Never persist tokenized download URLs for internal admin-only files.
      const downloadUrl = uploadScope === 'shared' ? await getDownloadURL(uploaded.ref) : undefined;
      const now = new Date().toISOString();

      const record: BrandAsset = {
        id: assetRef.id,
        workspaceId: uploadWorkspaceId,
        ...(uploadProjectId ? { projectId: uploadProjectId } : {}),
        name: uploadName.trim() || uploadFile.name.replace(/\.[^.]+$/, ''),
        category: uploadCategory,
        fileType: inferBrandAssetFileType(uploadFile),
        mimeType: uploadFile.type,
        storagePath,
        fileSizeBytes: uploadFile.size,
        fileSize: formatBytes(uploadFile.size),
        version: uploadVersion.trim() || 'v1.0',
        status: uploadStatus,
        description: uploadDescription.trim(),
        usageRules:
          uploadUsageRules.trim() ||
          (uploadScope === 'internal'
            ? 'Internal production staging asset (admin-only Firestore & Storage).'
            : 'Shared workspace production asset.'),
        ...(downloadUrl ? { downloadUrl } : {}),
        isVector: uploadFile.type === 'image/svg+xml',
        isInternal: uploadScope === 'internal',
        uploadedAt: now,
      };

      await setDoc(assetRef, record);
      metadataSaved = true;
      setUploadModalOpen(false);
      setUploadFile(null);
      setStatusMessage(
        `Uploaded "${record.name}" (${uploadScope === 'internal' ? 'Internal Admin Only' : 'Shared Workspace'}).`
      );
      setActiveTab('assets');
    } catch (err) {
      if (storageUploaded && !metadataSaved) {
        try {
          await deleteObject(ref(storage, storagePath));
        } catch {
          // Best-effort cleanup if metadata write failed
        }
      }
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  };

  const loadInternalAssetUrl = async (asset: WorkspaceAssetRecord): Promise<string> => {
    const cacheKey = `${asset.workspaceId}/${asset.id}`;
    const cached = internalPreviewUrlsRef.current.get(cacheKey);
    if (cached) return cached;
    if (!asset.storagePath) {
      throw new Error('Selected internal asset has no backing Storage path.');
    }
    const blob = await getBlob(ref(storage, asset.storagePath));
    const url = URL.createObjectURL(blob);
    internalPreviewUrlsRef.current.set(cacheKey, url);
    setInternalPreviewUrls(prev => ({ ...prev, [cacheKey]: url }));
    return url;
  };

  const openOrDownloadAsset = async (asset: WorkspaceAssetRecord) => {
    setError('');
    try {
      const isInternal = asset.sourceCollection === 'internalAssets' || isInternalStoragePath(asset.storagePath);
      const targetUrl =
        !isInternal && asset.downloadUrl
          ? asset.downloadUrl
          : await loadInternalAssetUrl(asset);
      const anchor = document.createElement('a');
      anchor.href = targetUrl;
      anchor.download = asset.name;
      if (!isInternal && asset.downloadUrl) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
      anchor.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const migrateLegacyInternalAssets = async () => {
    if (legacyInternalAssets.length === 0 && legacyUnscopedSharedAssets.length === 0) return;
    setBusyAction(true);
    setError('');
    setStatusMessage('');
    try {
      const now = new Date().toISOString();
      const INTERNAL_CHUNK_SIZE = 100; // 2 writes per asset (set + delete) stays safely below 500-op batch limit
      for (let i = 0; i < legacyInternalAssets.length; i += INTERNAL_CHUNK_SIZE) {
        const chunk = legacyInternalAssets.slice(i, i + INTERNAL_CHUNK_SIZE);
        const batch = writeBatch(db);
        for (const asset of chunk) {
          const {
            downloadUrl: _dropTokenizedUrl,
            sourceCollection: _sc,
            legacyInternalLocation: _lil,
            ...cleanRecord
          } = asset;
          batch.set(doc(db, 'workspaces', asset.workspaceId, 'internalAssets', asset.id), {
            ...cleanRecord,
            isInternal: true,
            migratedFromBrandAssetsAt: now,
          });
          batch.delete(doc(db, 'workspaces', asset.workspaceId, 'brandAssets', asset.id));
        }
        await batch.commit();
      }
      const SHARED_CHUNK_SIZE = 200;
      for (let i = 0; i < legacyUnscopedSharedAssets.length; i += SHARED_CHUNK_SIZE) {
        const chunk = legacyUnscopedSharedAssets.slice(i, i + SHARED_CHUNK_SIZE);
        const batch = writeBatch(db);
        for (const asset of chunk) {
          batch.update(doc(db, 'workspaces', asset.workspaceId, 'brandAssets', asset.id), {
            isInternal: false,
          });
        }
        await batch.commit();
      }
      setStatusMessage(
        `Migrated ${legacyInternalAssets.length} legacy internal record(s) into admin-only internalAssets (stripped downloadUrl, Storage files untouched) and tagged ${legacyUnscopedSharedAssets.length} shared brandAssets record(s) with isInternal: false.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  };

  const updateAssetStatus = async (asset: WorkspaceAssetRecord, nextStatus: BrandAsset['status']) => {
    setError('');
    try {
      await updateDoc(doc(db, 'workspaces', asset.workspaceId, asset.sourceCollection, asset.id), {
        status: nextStatus,
      });
      setStatusMessage(`Updated "${asset.name}" status to ${nextStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const deleteAsset = async (asset: WorkspaceAssetRecord) => {
    setBusyAction(true);
    setError('');
    setStatusMessage('');
    try {
      if (asset.storagePath) {
        try {
          await deleteObject(ref(storage, asset.storagePath));
        } catch {
          // Proceed to remove metadata doc if Storage object is already gone
        }
      }
      await deleteDoc(doc(db, 'workspaces', asset.workspaceId, asset.sourceCollection, asset.id));
      setStatusMessage(`Deleted asset "${asset.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  };

  const handleConfirmStageDeliverable = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stageDeliverableModal || !firebaseUser) return;
    const targetProject = projectsById.get(stageDeliverableModal.targetProjectId);
    if (!targetProject) {
      setError('Select a valid target production project.');
      return;
    }

    setBusyAction(true);
    setError('');
    setStatusMessage('');
    try {
      const actorName = firebaseUser.displayName || firebaseUser.email || 'Production Admin';
      await promoteBrandAssetToDeliverable({
        asset: stageDeliverableModal.asset,
        project: targetProject,
        actorUid: firebaseUser.uid,
        actorName,
        titleOverride: stageDeliverableModal.title,
        descriptionOverride: stageDeliverableModal.notes,
      });
      const projId = targetProject.id;
      const stagedTitle = stageDeliverableModal.title;
      setStageDeliverableModal(null);
      setStatusMessage(
        `Staged "${stagedTitle}" as a Draft deliverable inside "${targetProject.title}". Publish it from Project Deliverables when ready for client review.`
      );
      if (onOpenProject) {
        setProjectFilter(projId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  };

  const selectedFilterProject = projectFilter ? projectsById.get(projectFilter) : undefined;
  const selectedFilterWorkspace = workspaceFilter ? workspacesById.get(workspaceFilter) : undefined;

  return (
    <div className="space-y-6">
      {/* Scope & Primary Actions Toolbar */}
      <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Admin-only Production Repository
            </p>
            <p className="mt-1 text-xs text-neutral-300">
              Manage master production templates, workspace design specifications, and reusable studio assets, then stage outputs directly into client project deliverables.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={launchBlankCanvasEngine}
              disabled={scopedWorkspaces.length === 0}
              className="inline-flex items-center gap-1.5 border border-[#FF1E1E]/60 bg-[#1A0E0E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#FF1E1E] disabled:opacity-40 whitespace-nowrap"
            >
              <Sparkles size={13} />
              <span>Open Creative Engine</span>
            </button>
            <button
              type="button"
              onClick={openUploadAssetModal}
              disabled={scopedWorkspaces.length === 0}
              className="inline-flex items-center gap-1.5 border border-[#2C2C2C] bg-[#141414] px-3 py-2 text-xs font-medium text-white hover:border-[#FF1E1E] disabled:opacity-40 whitespace-nowrap"
            >
              <Upload size={13} />
              <span>Upload Asset</span>
            </button>
            <button
              type="button"
              onClick={openBlankDesignModal}
              disabled={scopedWorkspaces.length === 0}
              className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-40 whitespace-nowrap"
            >
              <Plus size={13} />
              <span>New Design Spec</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics Strip (Single-Elevation, Tabular Numerals) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="border border-[#1A1A1A] bg-[#101010] p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Saved Design Specs
            </p>
            <p className="mt-1 text-xl font-bold font-mono tabular-nums text-white">
              {allDesigns.length}
            </p>
          </div>
          <div className="border border-[#1A1A1A] bg-[#101010] p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Workspace &amp; Studio Assets
            </p>
            <p className="mt-1 text-xl font-bold font-mono tabular-nums text-white">
              {allAssets.length}
            </p>
          </div>
          <div className="border border-[#1A1A1A] bg-[#101010] p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Master Creative Templates
            </p>
            <p className="mt-1 text-xl font-bold font-mono tabular-nums text-white">
              {departmentCreativeTemplates.length}
            </p>
          </div>
          <div className="border border-[#1A1A1A] bg-[#101010] p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Layout Family Blueprints
            </p>
            <p className="mt-1 text-xl font-bold font-mono tabular-nums text-white">
              {departmentFamilyTemplates.length}
            </p>
          </div>
        </div>

        {/* Global Context Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-[#1A1A1A]">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search designs, assets, templates…"
              className="w-full border border-[#262626] bg-[#141414] pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by workspace"
            value={workspaceFilter}
            onChange={event => {
              const nextWs = event.target.value;
              setWorkspaceFilter(nextWs);
              if (nextWs && projectFilter && projectsById.get(projectFilter)?.workspaceId !== nextWs) {
                setProjectFilter('');
              }
            }}
            className="border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
          >
            <option value="">
              {lockedDepartment
                ? `All ${lockedDepartment} Workspaces (${scopedWorkspaces.length})`
                : `All Workspaces (${scopedWorkspaces.length})`}
            </option>
            {scopedWorkspaces.map(ws => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.type})
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by production project"
            value={projectFilter}
            onChange={event => {
              const nextProj = event.target.value;
              setProjectFilter(nextProj);
              const proj = projectsById.get(nextProj);
              if (proj?.workspaceId && !workspaceFilter) {
                setWorkspaceFilter(proj.workspaceId);
              }
            }}
            className="border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
          >
            <option value="">All Production Projects ({projectsForDropdown.length})</option>
            {projectsForDropdown.map(project => (
              <option key={project.id} value={project.id}>
                {project.title} · {project.stage || project.status}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between gap-2">
            {(workspaceFilter || projectFilter || searchQuery) ? (
              <button
                type="button"
                onClick={() => {
                  setWorkspaceFilter('');
                  setProjectFilter('');
                  setSearchQuery('');
                }}
                className="w-full border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-xs text-neutral-300 hover:border-white hover:text-white"
              >
                Reset Context Filters
              </button>
            ) : (
              <span className="text-[11px] font-mono text-neutral-500 px-1">
                Scoped to all active workspaces
              </span>
            )}
          </div>
        </div>

        {/* Active Context Banner */}
        {(selectedFilterWorkspace || selectedFilterProject) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border border-[#242424] bg-[#121212] px-3.5 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-neutral-300">
              {selectedFilterWorkspace && (
                <span>
                  Workspace: <strong className="text-white">{selectedFilterWorkspace.name}</strong>
                </span>
              )}
              {selectedFilterProject && (
                <span>
                  Project: <strong className="text-white">{selectedFilterProject.title}</strong> ({selectedFilterProject.stage || selectedFilterProject.status})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {selectedFilterWorkspace && onOpenWorkspace && (
                <button
                  type="button"
                  onClick={() => onOpenWorkspace(selectedFilterWorkspace.id)}
                  className="inline-flex items-center gap-1 text-[#FF1E1E] hover:underline"
                >
                  <Building2 size={12} />
                  <span>Workspace Details</span>
                </button>
              )}
              {selectedFilterProject && onOpenProject && (
                <button
                  type="button"
                  onClick={() => onOpenProject(selectedFilterProject.id, 'deliverables')}
                  className="inline-flex items-center gap-1 text-[#FF1E1E] hover:underline"
                >
                  <FolderKanban size={12} />
                  <span>Open Project Deliverables</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banners */}
      {error && (
        <div role="alert" className="border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-200 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="underline text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {statusMessage && (
        <div role="status" className="border border-emerald-900/60 bg-emerald-950/25 p-3 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </span>
          {selectedFilterProject && onOpenProject && (
            <button
              type="button"
              onClick={() => onOpenProject(selectedFilterProject.id, 'deliverables')}
              className="inline-flex items-center gap-1 font-semibold text-white underline hover:text-emerald-200"
            >
              <span>Inspect Project Deliverables</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      {/* Primary Section Segmented Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1A1A1A] pb-3">
        {[
          { id: 'designs' as const, label: `Saved Production Designs (${filteredDesigns.length})` },
          { id: 'assets' as const, label: `Production & Workspace Assets (${filteredAssets.length})` },
          {
            id: 'templates' as const,
            label: `Master Template Catalog (${departmentCreativeTemplates.length + departmentFamilyTemplates.length})`,
          },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-black font-semibold'
                : 'border border-[#262626] bg-[#121212] text-neutral-300 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {[1, 2, 3].map(item => (
            <div key={item} className="h-44 border border-[#1E1E1E] bg-[#101010]" />
          ))}
        </div>
      ) : (
        <>
          {/* ==========================================================
              TAB 1: SAVED PRODUCTION DESIGNS (campaignDesigns)
             ========================================================== */}
          {activeTab === 'designs' && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  aria-label="Filter designs by campaign stage"
                  value={designCategoryFilter}
                  onChange={event => setDesignCategoryFilter(event.target.value)}
                  className="border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="All">All Campaign Phases</option>
                  {CAMPAIGN_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter designs by aspect ratio"
                  value={designAspectFilter}
                  onChange={event => setDesignAspectFilter(event.target.value)}
                  className="border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="All">All Output Formats</option>
                  {ASPECT_RATIO_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {filteredDesigns.length === 0 ? (
                <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-10 text-center space-y-3">
                  <Layers size={28} className="mx-auto text-neutral-600" />
                  <p className="text-sm text-neutral-300 font-medium">
                    No saved production design specifications match the current filters.
                  </p>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Stage a template from the Master Template Catalog or create a new design specification assigned to a client workspace and project.
                  </p>
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('templates')}
                      className="border border-[#333] bg-[#141414] px-3.5 py-2 text-xs text-white hover:border-white"
                    >
                      Browse Master Templates
                    </button>
                    <button
                      type="button"
                      onClick={openBlankDesignModal}
                      className="bg-[#FF1E1E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-600"
                    >
                      New Design Spec
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredDesigns.map(design => {
                    const ws = workspacesById.get(design.workspaceId);
                    const linkedProject = design.projectId ? projectsById.get(design.projectId) : undefined;
                    const eligibleTargetProject =
                      linkedProject ||
                      projects.find(p => p.workspaceId === design.workspaceId) ||
                      projects[0];
                    const headlineText =
                      design.canvasDesign?.elements?.find(el => el.type === 'text')?.text || design.name;
                    const bgHex = design.canvasDesign?.backgroundColor || '#121212';

                    return (
                      <article
                        key={`${design.workspaceId}-${design.id}`}
                        className="border border-[#1E1E1E] bg-[#0C0C0C] flex flex-col justify-between"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] text-neutral-500 truncate">
                                {ws?.name || design.workspaceId} · {design.category} · {design.exportPreset}
                              </p>
                              <h3 className="mt-1 text-sm font-bold text-white truncate" title={design.name}>
                                {design.name}
                              </h3>
                            </div>
                            <span
                              className="w-7 h-7 border border-[#333] shrink-0"
                              style={{ backgroundColor: bgHex }}
                              title={`Canvas background ${bgHex}`}
                            />
                          </div>

                          <div className="border border-[#1A1A1A] bg-[#121212] p-3 text-xs space-y-1">
                            <p className="font-semibold text-neutral-200 truncate">{headlineText}</p>
                            <p className="text-[11px] font-mono tabular-nums text-neutral-500">
                              {design.canvasDesign?.width || 1200}×{design.canvasDesign?.height || 1200}px ·{' '}
                              {design.canvasDesign?.elements?.length || 0} layers · tpl: {design.templateId}
                            </p>
                          </div>

                          {design.internalNotes && (
                            <p className="text-xs text-neutral-400 line-clamp-2">{design.internalNotes}</p>
                          )}

                          <div className="text-[11px] text-neutral-400 flex items-center justify-between gap-2 pt-1">
                            <span className="truncate">
                              Project:{' '}
                              {linkedProject ? (
                                <strong className="text-neutral-200">{linkedProject.title}</strong>
                              ) : (
                                <span className="text-neutral-500">Workspace-wide</span>
                              )}
                            </span>
                            <span className="font-mono text-neutral-500 shrink-0 tabular-nums">
                              {formatShortDate(design.updatedAt || design.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-[#181818] bg-[#0A0A0A] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => launchCanvasFromDesign(design)}
                              className="inline-flex items-center gap-1 bg-[#FF1E1E] hover:bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                            >
                              <Sparkles size={11} />
                              <span>Open in Canvas</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditDesignModal(design)}
                              className="text-xs text-neutral-300 hover:text-white"
                            >
                              Edit spec
                            </button>
                            <button
                              type="button"
                              onClick={() => void duplicateDesign(design)}
                              disabled={busyAction}
                              className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                            >
                              <Copy size={11} />
                              <span>Duplicate</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDesignJson(design)}
                              className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
                            >
                              <FileCode2 size={11} />
                              <span>JSON</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteDesign(design)}
                              disabled={busyAction}
                              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                              title="Delete production design"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {onCreateCreativeProductFromDesign && design.canvasDesign && (
                              <button
                                type="button"
                                onClick={() => onCreateCreativeProductFromDesign(design.canvasDesign)}
                                className="inline-flex items-center gap-1 bg-[#141414] border border-[#2E2E2E] hover:border-[#FF1E1E] px-2.5 py-1 text-[11px] font-medium text-neutral-200 hover:text-white"
                                title="Create a publishable Creative Product from this design"
                              >
                                <Sparkles size={11} className="text-[#FF1E1E]" />
                                <span>To Product</span>
                              </button>
                            )}
                            {eligibleTargetProject && onOpenProject && (
                              <button
                                type="button"
                                onClick={() => onOpenProject(eligibleTargetProject.id, 'deliverables')}
                                className="inline-flex items-center gap-1 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF1E1E] px-2.5 py-1 text-[11px] font-medium text-white"
                                title="Internal specs stay admin-only; upload finished client outputs in Project Deliverables"
                              >
                                <FolderKanban size={11} className="text-[#FF1E1E]" />
                                <span>Project Deliverables</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ==========================================================
              TAB 2: PRODUCTION & WORKSPACE ASSETS (internalAssets + brandAssets)
             ========================================================== */}
          {activeTab === 'assets' && (
            <section className="space-y-4">
              {(legacyInternalAssets.length > 0 || legacyUnscopedSharedAssets.length > 0) && (
                <div className="border border-amber-700/50 bg-amber-950/20 p-3 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      {legacyInternalAssets.length > 0 && (
                        <>
                          <strong>{legacyInternalAssets.length} legacy internal asset record(s)</strong> still store metadata inside{' '}
                          <code className="font-mono text-amber-100">brandAssets</code>; migration moves them to admin-only{' '}
                          <code className="font-mono text-amber-100">internalAssets</code> (stripping tokenized URLs without touching Storage files).{' '}
                        </>
                      )}
                      {legacyUnscopedSharedAssets.length > 0 && (
                        <>
                          <strong>{legacyUnscopedSharedAssets.length} legacy shared brandAssets record(s)</strong> need{' '}
                          <code className="font-mono text-amber-100">isInternal: false</code> so clients can list them under hardened rules.
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => void migrateLegacyInternalAssets()}
                    className="shrink-0 bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                  >
                    {busyAction
                      ? 'Migrating…'
                      : `Migrate & Sync ${legacyInternalAssets.length + legacyUnscopedSharedAssets.length} Record(s)`}
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  aria-label="Filter assets by category"
                  value={assetCategoryFilter}
                  onChange={event => setAssetCategoryFilter(event.target.value)}
                  className="border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="All">All Categories</option>
                  {ASSET_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter assets by approval status"
                  value={assetStatusFilter}
                  onChange={event => setAssetStatusFilter(event.target.value)}
                  className="border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="All">All Statuses</option>
                  {ASSET_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="flex items-center border border-[#262626] bg-[#141414] p-0.5">
                  {(
                    [
                      ['all', 'All Scopes'],
                      ['internal', 'Internal Staging Only'],
                      ['shared', 'Shared Workspace'],
                    ] as const
                  ).map(([scopeId, scopeLabel]) => (
                    <button
                      key={scopeId}
                      type="button"
                      onClick={() => setAssetScopeFilter(scopeId)}
                      className={`px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors ${
                        assetScopeFilter === scopeId
                          ? 'bg-white text-black font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {scopeLabel}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAssets.length === 0 ? (
                <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-10 text-center space-y-3">
                  <ImageIcon size={28} className="mx-auto text-neutral-600" />
                  <p className="text-sm text-neutral-300 font-medium">
                    No workspace or internal production assets match these filters.
                  </p>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    Upload production working files (to admin-only internalAssets + internal Storage) or shared brand/artist assets, or inspect client-uploaded workspace assets.
                  </p>
                  <button
                    type="button"
                    onClick={openUploadAssetModal}
                    disabled={workspaces.length === 0}
                    className="bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-40"
                  >
                    Upload First Asset
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredAssets.map(asset => {
                    const ws = workspacesById.get(asset.workspaceId);
                    const linkedProject = asset.projectId ? projectsById.get(asset.projectId) : undefined;
                    const eligibleTargetProject =
                      linkedProject ||
                      projects.find(p => p.workspaceId === asset.workspaceId) ||
                      projects[0];
                    const isInternal =
                      asset.sourceCollection === 'internalAssets' || isInternalStoragePath(asset.storagePath);
                    const isImage =
                      asset.mimeType?.startsWith('image/') ||
                      ['PNG', 'JPEG', 'WEBP', 'GIF', 'SVG', 'AVIF'].includes(asset.fileType);
                    const cacheKey = `${asset.workspaceId}/${asset.id}`;
                    const previewSrc = isInternal
                      ? internalPreviewUrls[cacheKey]
                      : asset.downloadUrl;
                    const canPromote = !isDeliverablePromotionRestrictedAsset(asset);

                    return (
                      <article
                        key={`${asset.workspaceId}-${asset.id}`}
                        className="border border-[#1E1E1E] bg-[#0C0C0C] flex flex-col justify-between"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[11px] text-neutral-500 truncate">
                                {ws?.name || asset.workspaceId} · {asset.category} · {asset.fileType}
                              </p>
                              <h3 className="mt-1 text-sm font-bold text-white truncate" title={asset.name}>
                                {asset.name}
                              </h3>
                            </div>
                            <span
                              className={`shrink-0 text-[10px] font-mono px-2 py-0.5 border ${
                                isInternal
                                  ? 'border-amber-800/50 bg-amber-950/30 text-amber-300'
                                  : 'border-[#2E2E2E] bg-[#151515] text-neutral-300'
                              }`}
                            >
                              {asset.legacyInternalLocation
                                ? 'Legacy Internal'
                                : isInternal
                                  ? 'Admin Only'
                                  : 'Shared WS'}
                            </span>
                          </div>

                          {isImage && previewSrc ? (
                            <div className="h-32 border border-[#1E1E1E] bg-[#121212] overflow-hidden flex items-center justify-center">
                              <img
                                src={previewSrc}
                                alt={asset.name}
                                referrerPolicy="no-referrer"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="h-20 border border-[#1E1E1E] bg-[#121212] px-3 flex items-center justify-between text-xs text-neutral-400">
                              <span className="font-mono">{asset.fileType}</span>
                              <div className="flex items-center gap-2">
                                {isImage && isInternal && asset.storagePath && (
                                  <button
                                    type="button"
                                    onClick={() => void loadInternalAssetUrl(asset).catch(err => setError(err instanceof Error ? err.message : String(err)))}
                                    className="text-[11px] text-amber-300 underline hover:text-white"
                                  >
                                    Load Preview
                                  </button>
                                )}
                                <span className="font-mono tabular-nums">
                                  {asset.fileSize || formatBytes(asset.fileSizeBytes)}
                                </span>
                              </div>
                            </div>
                          )}

                          {asset.description && (
                            <p className="text-xs text-neutral-400 line-clamp-2">{asset.description}</p>
                          )}

                          <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400">
                            <span className="truncate">
                              {linkedProject ? `Project: ${linkedProject.title}` : `Version ${asset.version || 'v1.0'}`}
                            </span>
                            <select
                              aria-label={`Status for ${asset.name}`}
                              value={asset.status}
                              onChange={event =>
                                void updateAssetStatus(asset, event.target.value as BrandAsset['status'])
                              }
                              className="border border-[#2C2C2C] bg-[#141414] px-2 py-0.5 text-[11px] text-white"
                            >
                              {ASSET_STATUSES.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="border-t border-[#181818] bg-[#0A0A0A] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            {(asset.storagePath || asset.downloadUrl) && (
                              <button
                                type="button"
                                onClick={() => void openOrDownloadAsset(asset)}
                                className="inline-flex items-center gap-1 text-xs text-neutral-300 hover:text-white"
                              >
                                <Download size={12} />
                                <span>{isInternal ? 'Download' : 'Open'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void deleteAsset(asset)}
                              disabled={busyAction}
                              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                              title="Delete asset"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {eligibleTargetProject && canPromote && (
                            <button
                              type="button"
                              onClick={() =>
                                setStageDeliverableModal({
                                  asset,
                                  targetProjectId: linkedProject?.id || eligibleTargetProject.id,
                                  title: asset.name,
                                  notes: asset.description || asset.usageRules || '',
                                })
                              }
                              className="inline-flex items-center gap-1 border border-[#2E2E2E] bg-[#1A1A1A] hover:border-[#FF1E1E] px-2.5 py-1 text-[11px] font-medium text-white"
                            >
                              <Send size={11} className="text-[#FF1E1E]" />
                              <span>Promote to Deliverable</span>
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ==========================================================
              TAB 3: MASTER TEMPLATE CATALOG (Structured Non-Canva Catalog)
             ========================================================== */}
          {activeTab === 'templates' && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center border border-[#262626] bg-[#141414] p-0.5">
                  <button
                    type="button"
                    onClick={() => setCatalogMode('creative')}
                    className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                      catalogMode === 'creative' ? 'bg-white text-black font-semibold' : 'text-neutral-300'
                    }`}
                  >
                    Master Creative Templates ({departmentCreativeTemplates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogMode('families')}
                    className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                      catalogMode === 'families' ? 'bg-white text-black font-semibold' : 'text-neutral-300'
                    }`}
                  >
                    Layout Blueprints ({departmentFamilyTemplates.length})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {catalogMode === 'creative' ? (
                    <select
                      aria-label="Filter templates by category"
                      value={templateCategoryFilter}
                      onChange={event => setTemplateCategoryFilter(event.target.value)}
                      className="border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="All">All 15 Categories</option>
                      {creativeTemplateCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      aria-label="Filter templates by family"
                      value={templateFamilyFilter}
                      onChange={event => setTemplateFamilyFilter(event.target.value)}
                      className="border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="All">All 6 Design Families</option>
                      {templateFamiliesList.map(fam => (
                        <option key={fam} value={fam}>{fam}</option>
                      ))}
                    </select>
                  )}

                  <select
                    aria-label="Filter templates by aspect ratio"
                    value={templateAspectFilter}
                    onChange={event => setTemplateAspectFilter(event.target.value)}
                    className="border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="All">All Output Formats</option>
                    {ASPECT_RATIO_OPTIONS.map(ar => (
                      <option key={ar} value={ar}>{ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              {catalogMode === 'creative' ? (
                filteredCreativeTemplates.length === 0 ? (
                  <p className="border border-[#1E1E1E] bg-[#0C0C0C] p-8 text-center text-xs text-neutral-500">
                    No master templates match your active filters.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCreativeTemplates.map(template => {
                      const theme = BG_THEME_HEX[template.bgTheme || 'black'];
                      return (
                        <article
                          key={template.id}
                          className="border border-[#1E1E1E] bg-[#0C0C0C] flex flex-col justify-between"
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] text-neutral-500 truncate">
                                  {template.category} · {template.style} · {template.aspectRatio}
                                </p>
                                <h3 className="mt-1 text-sm font-bold text-white truncate">
                                  {template.title}
                                </h3>
                              </div>
                              <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                                {template.id}
                              </span>
                            </div>

                            {/* Structured Visual Spec Swatch Card (Non-Canva) */}
                            <div
                              className="border border-[#262626] p-3.5 space-y-1.5"
                              style={{ backgroundColor: theme.bg, color: theme.fg }}
                            >
                              {template.badgeText && (
                                <p
                                  className="text-[10px] font-mono uppercase tracking-widest"
                                  style={{ color: template.accentColor || theme.muted }}
                                >
                                  {template.badgeText}
                                </p>
                              )}
                              <p className="text-sm font-bold leading-snug line-clamp-1">
                                {template.headline}
                              </p>
                              <p className="text-[11px] line-clamp-2" style={{ color: theme.muted }}>
                                {template.subtext}
                              </p>
                              <p className="text-[10px] font-mono pt-1" style={{ color: theme.muted }}>
                                Font: {template.fontFamily || 'sans'} · {template.tagline}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-[#181818] bg-[#0A0A0A] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-neutral-500">
                              Ready for studio
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={workspaces.length === 0}
                                onClick={() => launchCanvasFromCreativeTemplate(template)}
                                className="inline-flex items-center gap-1 bg-[#FF1E1E] hover:bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
                              >
                                <Sparkles size={11} />
                                <span>Open in Canvas</span>
                              </button>
                              <button
                                type="button"
                                disabled={workspaces.length === 0}
                                onClick={() => openTemplateStageModal(template)}
                                className="inline-flex items-center gap-1 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF1E1E] px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-40"
                              >
                                <Plus size={11} className="text-[#FF1E1E]" />
                                <span>Use Spec</span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )
              ) : filteredFamilyTemplates.length === 0 ? (
                <p className="border border-[#1E1E1E] bg-[#0C0C0C] p-8 text-center text-xs text-neutral-500">
                  No layout blueprints match your active filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredFamilyTemplates.map(item => (
                    <article
                      key={item.id}
                      className="border border-[#1E1E1E] bg-[#0C0C0C] flex flex-col justify-between"
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] text-neutral-500 truncate">
                              {item.familyName} · {item.aspectRatio}
                            </p>
                            <h3 className="mt-1 text-sm font-bold text-white truncate">
                              {item.title}
                            </h3>
                          </div>
                          <span
                            className="w-6 h-6 border border-[#333] shrink-0"
                            style={{ backgroundColor: item.design.backgroundColor }}
                          />
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-2">{item.description}</p>
                        <p className="text-[11px] font-mono tabular-nums text-neutral-500">
                          {item.design.width}×{item.design.height}px · {item.design.elements.length} blueprint layers
                        </p>
                      </div>

                      <div className="border-t border-[#181818] bg-[#0A0A0A] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-neutral-500">{item.id}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={workspaces.length === 0}
                            onClick={() => launchCanvasFromFamilyTemplate(item)}
                            className="inline-flex items-center gap-1 bg-[#FF1E1E] hover:bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
                          >
                            <Sparkles size={11} />
                            <span>Open in Canvas</span>
                          </button>
                          <button
                            type="button"
                            disabled={workspaces.length === 0}
                            onClick={() => openFamilyTemplateStageModal(item)}
                            className="inline-flex items-center gap-1 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#FF1E1E] px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-40"
                          >
                            <Plus size={11} className="text-[#FF1E1E]" />
                            <span>Use Spec</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* ==========================================================
          MODAL: CREATE / EDIT / STAGE PRODUCTION DESIGN SPEC
         ========================================================== */}
      <Modal
        isOpen={Boolean(designModal)}
        onClose={() => {
          if (!busyAction) setDesignModal(null);
        }}
        maxWidth="lg"
        title={
          designModal?.mode === 'edit'
            ? 'Edit Production Design Specification'
            : designModal?.mode === 'fromTemplate'
              ? 'Assign Template to Workspace Production Design'
              : 'New Production Design Specification'
        }
        subtitle="Saved under admin-only workspaces/{workspaceId}/campaignDesigns for production team planning and reference."
      >
        {designModal && (
          <form onSubmit={saveDesignSpec} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="dl-design-ws" className="mb-1 block text-xs text-neutral-300">
                  Target Workspace *
                </label>
                <select
                  id="dl-design-ws"
                  required
                  disabled={designModal.mode === 'edit'}
                  value={designModal.workspaceId}
                  onChange={event =>
                    setDesignModal({
                      ...designModal,
                      workspaceId: event.target.value,
                      projectId: '',
                    })
                  }
                  className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white disabled:opacity-60"
                >
                  <option value="">Select workspace…</option>
                  {scopedWorkspaces.map(ws => {
                    const owner = ws.ownerId ? clientsByUid.get(ws.ownerId) : undefined;
                    return (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.type}){owner ? ` · ${owner.displayName}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="dl-design-proj" className="mb-1 block text-xs text-neutral-300">
                  Linked Production Project (optional)
                </label>
                <select
                  id="dl-design-proj"
                  value={designModal.projectId}
                  onChange={event => setDesignModal({ ...designModal, projectId: event.target.value })}
                  className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
                >
                  <option value="">Workspace-wide (unlinked)</option>
                  {projects
                    .filter(p => !designModal.workspaceId || p.workspaceId === designModal.workspaceId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.stage || p.status})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="dl-design-name" className="mb-1 block text-xs text-neutral-300">
                Design Name *
              </label>
              <input
                id="dl-design-name"
                required
                maxLength={140}
                value={designModal.name}
                onChange={event => setDesignModal({ ...designModal, name: event.target.value })}
                placeholder="e.g. Debut Single Cover Art Key Visual"
                className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="dl-design-cat" className="mb-1 block text-xs text-neutral-300">
                  Campaign Phase
                </label>
                <select
                  id="dl-design-cat"
                  value={designModal.category}
                  onChange={event =>
                    setDesignModal({ ...designModal, category: event.target.value as CampaignCategory })
                  }
                  className="w-full border border-[#333] bg-[#141414] px-2.5 py-2 text-xs text-white"
                >
                  {CAMPAIGN_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dl-design-aspect" className="mb-1 block text-xs text-neutral-300">
                  Output Format
                </label>
                <select
                  id="dl-design-aspect"
                  value={designModal.exportPreset}
                  onChange={event =>
                    setDesignModal({
                      ...designModal,
                      exportPreset: event.target.value as AspectRatioType,
                    })
                  }
                  className="w-full border border-[#333] bg-[#141414] px-2.5 py-2 text-xs text-white"
                >
                  {ASPECT_RATIO_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dl-design-theme" className="mb-1 block text-xs text-neutral-300">
                  Palette Theme
                </label>
                <select
                  id="dl-design-theme"
                  value={designModal.bgTheme}
                  onChange={event => {
                    const nextTheme = event.target.value as CanvasDesign['backgroundTheme'];
                    setDesignModal({
                      ...designModal,
                      bgTheme: nextTheme,
                      bgColor: BG_THEME_HEX[nextTheme]?.bg || '#080808',
                    });
                  }}
                  className="w-full border border-[#333] bg-[#141414] px-2.5 py-2 text-xs text-white"
                >
                  {Object.keys(BG_THEME_HEX).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="dl-design-head" className="mb-1 block text-xs text-neutral-300">
                  Headline Copy
                </label>
                <input
                  id="dl-design-head"
                  value={designModal.headline}
                  onChange={event => setDesignModal({ ...designModal, headline: event.target.value })}
                  placeholder="Primary headline copy"
                  className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label htmlFor="dl-design-sub" className="mb-1 block text-xs text-neutral-300">
                  Subtext / Tagline Copy
                </label>
                <input
                  id="dl-design-sub"
                  value={designModal.subtext}
                  onChange={event => setDesignModal({ ...designModal, subtext: event.target.value })}
                  placeholder="Secondary text or release credit line"
                  className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dl-design-notes" className="mb-1 block text-xs text-neutral-300">
                Production Direction &amp; Export Notes
              </label>
              <textarea
                id="dl-design-notes"
                rows={3}
                value={designModal.internalNotes}
                onChange={event => setDesignModal({ ...designModal, internalNotes: event.target.value })}
                placeholder="Dimensions, safe zones, typeface rules, motion notes…"
                className="w-full border border-[#333] bg-[#141414] p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#1E1E1E]">
              <button
                type="button"
                disabled={busyAction}
                onClick={() => setDesignModal(null)}
                className="border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyAction}
                onClick={() => void persistDesignModal(true)}
                className="inline-flex items-center gap-1.5 border border-[#FF1E1E]/60 bg-[#1A0E0E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FF1E1E] disabled:opacity-50"
              >
                <Sparkles size={12} />
                <span>{busyAction ? 'Opening…' : 'Save & Open in Canvas'}</span>
              </button>
              <button
                type="submit"
                disabled={busyAction}
                className="bg-[#FF1E1E] px-5 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {busyAction ? 'Saving…' : 'Save Design Spec'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ==========================================================
          MODAL: UPLOAD PRODUCTION / WORKSPACE ASSET
         ========================================================== */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => {
          if (!busyAction) setUploadModalOpen(false);
        }}
        maxWidth="lg"
        title="Upload Studio or Workspace Asset"
        subtitle="Store admin-only working production files under internal Storage or shared assets visible to the workspace."
      >
        <form onSubmit={handleUploadAsset} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="dl-up-ws" className="mb-1 block text-xs text-neutral-300">
                Workspace *
              </label>
              <select
                id="dl-up-ws"
                required
                value={uploadWorkspaceId}
                onChange={event => {
                  setUploadWorkspaceId(event.target.value);
                  setUploadProjectId('');
                }}
                className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
              >
                <option value="">Select workspace…</option>
                {scopedWorkspaces.map(ws => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dl-up-proj" className="mb-1 block text-xs text-neutral-300">
                Link to Production Project (optional)
              </label>
              <select
                id="dl-up-proj"
                value={uploadProjectId}
                onChange={event => setUploadProjectId(event.target.value)}
                className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
              >
                <option value="">Workspace-wide asset</option>
                {projects
                  .filter(p => !uploadWorkspaceId || p.workspaceId === uploadWorkspaceId)
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="dl-up-name" className="mb-1 block text-xs text-neutral-300">
                Asset Title
              </label>
              <input
                id="dl-up-name"
                value={uploadName}
                onChange={event => setUploadName(event.target.value)}
                placeholder="Defaults to file name"
                className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label htmlFor="dl-up-cat" className="mb-1 block text-xs text-neutral-300">
                Asset Category
              </label>
              <select
                id="dl-up-cat"
                value={uploadCategory}
                onChange={event => setUploadCategory(event.target.value as BrandAsset['category'])}
                className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
              >
                {ASSET_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="dl-up-scope" className="mb-1 block text-xs text-neutral-300">
                Storage Isolation Scope
              </label>
              <select
                id="dl-up-scope"
                value={uploadScope}
                onChange={event => setUploadScope(event.target.value as 'internal' | 'shared')}
                className="w-full border border-[#333] bg-[#141414] px-2.5 py-2 text-xs text-white"
              >
                <option value="internal">Internal Production Only (Admin)</option>
                <option value="shared">Shared Workspace Asset</option>
              </select>
            </div>

            <div>
              <label htmlFor="dl-up-status" className="mb-1 block text-xs text-neutral-300">
                Asset Status
              </label>
              <select
                id="dl-up-status"
                value={uploadStatus}
                onChange={event => setUploadStatus(event.target.value as BrandAsset['status'])}
                className="w-full border border-[#333] bg-[#141414] px-2.5 py-2 text-xs text-white"
              >
                {ASSET_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="dl-up-ver" className="mb-1 block text-xs text-neutral-300">
                Version Tag
              </label>
              <input
                id="dl-up-ver"
                value={uploadVersion}
                onChange={event => setUploadVersion(event.target.value)}
                className="w-full border border-[#333] bg-[#141414] px-2.5 py-2 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="border border-[#242424] bg-[#101010] px-3 py-2 text-[11px] text-neutral-400 flex items-center gap-2">
            <Lock size={12} className="text-amber-400 shrink-0" />
            <span>
              {uploadScope === 'internal'
                ? 'Metadata saved to admin-only internalAssets and files stored under workspaces/{ws}/internal/assets/... — strictly blocked for clients.'
                : 'Stored under brandAssets & workspaces/{ws}/assets/... — accessible to both the production team and the workspace owner.'}
            </span>
          </div>

          <div>
            <label htmlFor="dl-up-file" className="mb-1 block text-xs text-neutral-300">
              Source or Production File (max 50 MB) *
            </label>
            <input
              id="dl-up-file"
              type="file"
              required
              accept="image/*,audio/*,video/*,application/pdf,application/json,application/xml,application/zip,text/plain,font/*"
              onChange={event => setUploadFile(event.target.files?.[0] || null)}
              className="block w-full text-xs text-neutral-300 file:mr-3 file:border-0 file:bg-[#222] file:px-3 file:py-2 file:text-xs file:text-white"
            />
          </div>

          <div>
            <label htmlFor="dl-up-desc" className="mb-1 block text-xs text-neutral-300">
              Notes / Usage Guidelines
            </label>
            <textarea
              id="dl-up-desc"
              rows={2}
              value={uploadDescription}
              onChange={event => setUploadDescription(event.target.value)}
              placeholder="Usage specifications, licensing, or handoff notes"
              className="w-full border border-[#333] bg-[#141414] p-2.5 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1E1E1E]">
            <button
              type="button"
              disabled={busyAction}
              onClick={() => setUploadModalOpen(false)}
              className="border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busyAction}
              className="bg-[#FF1E1E] px-5 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {busyAction ? 'Uploading…' : 'Upload Asset'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==========================================================
          MODAL: STAGE DESIGN SPEC OR ASSET TO PROJECT DELIVERABLE
         ========================================================== */}
      <Modal
        isOpen={Boolean(stageDeliverableModal)}
        onClose={() => {
          if (!busyAction) setStageDeliverableModal(null);
        }}
        maxWidth="md"
        title="Stage as Production Deliverable Draft"
        subtitle="Uploads a validated deliverable package into production/{projectId}/deliverables/ as an unpublished Draft ready for internal QA or client publishing."
      >
        {stageDeliverableModal && (
          <form onSubmit={handleConfirmStageDeliverable} className="space-y-4">
            <div>
              <label htmlFor="dl-stage-proj" className="mb-1 block text-xs text-neutral-300">
                Target Production Project *
              </label>
              <select
                id="dl-stage-proj"
                required
                value={stageDeliverableModal.targetProjectId}
                onChange={event =>
                  setStageDeliverableModal({
                    ...stageDeliverableModal,
                    targetProjectId: event.target.value,
                  })
                }
                className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
              >
                <option value="">Select production project…</option>
                {projects.map(project => {
                  const ws = project.workspaceId ? workspacesById.get(project.workspaceId) : undefined;
                  return (
                    <option key={project.id} value={project.id}>
                      {project.title} · {project.stage || project.status}
                      {ws ? ` (${ws.name})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label htmlFor="dl-stage-title" className="mb-1 block text-xs text-neutral-300">
                Deliverable Title *
              </label>
              <input
                id="dl-stage-title"
                required
                maxLength={300}
                value={stageDeliverableModal.title}
                onChange={event =>
                  setStageDeliverableModal({ ...stageDeliverableModal, title: event.target.value })
                }
                className="w-full border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label htmlFor="dl-stage-notes" className="mb-1 block text-xs text-neutral-300">
                Deliverable Description
              </label>
              <textarea
                id="dl-stage-notes"
                rows={3}
                maxLength={5000}
                value={stageDeliverableModal.notes}
                onChange={event =>
                  setStageDeliverableModal({ ...stageDeliverableModal, notes: event.target.value })
                }
                className="w-full border border-[#333] bg-[#141414] p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E1E1E]">
              <button
                type="button"
                disabled={busyAction}
                onClick={() => setStageDeliverableModal(null)}
                className="border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyAction}
                className="bg-[#FF1E1E] px-5 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {busyAction ? 'Staging…' : 'Stage Deliverable Draft'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ==========================================================
          FULL-SCREEN ADMIN CREATIVE CANVAS STUDIO OVERLAY
         ========================================================== */}
      {activeCanvasSession && (
        <div className="fixed inset-0 z-50 bg-black/95 p-3 sm:p-5 flex flex-col gap-3 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#242424] bg-[#0D0D0D] px-4 py-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wider text-white font-semibold">
                <Sparkles size={13} className="text-[#FF1E1E]" />
                KeedoHub Creative Engine
              </span>
              <label className="inline-flex items-center gap-1.5 text-neutral-400">
                <span>Workspace:</span>
                <select
                  value={activeCanvasSession.workspaceId}
                  onChange={event => {
                    const nextWsId = event.target.value;
                    const nextProjId = projects.find(p => p.workspaceId === nextWsId)?.id || '';
                    setActiveCanvasSession(prev =>
                      prev
                        ? {
                            ...prev,
                            workspaceId: nextWsId,
                            projectId: nextProjId,
                            campaignDesignId:
                              prev.workspaceId === nextWsId ? prev.campaignDesignId : undefined,
                          }
                        : null
                    );
                  }}
                  className="border border-[#333] bg-[#141414] px-2.5 py-1 text-xs text-white"
                >
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.type})
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex items-center gap-1.5 text-neutral-400">
                <span>Target Project:</span>
                <select
                  value={activeCanvasSession.projectId}
                  onChange={event =>
                    setActiveCanvasSession(prev =>
                      prev ? { ...prev, projectId: event.target.value } : null
                    )
                  }
                  className="border border-[#333] bg-[#141414] px-2.5 py-1 text-xs text-white"
                >
                  <option value="">Workspace-wide (no project selected)</option>
                  {projects
                    .filter(p => p.workspaceId === activeCanvasSession.workspaceId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.stage || p.status})
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2">
              {onCreateCreativeProductFromDesign && (
                <button
                  type="button"
                  onClick={() => {
                    const draft = activeCanvasSession.design;
                    setActiveCanvasSession(null);
                    onCreateCreativeProductFromDesign(draft);
                  }}
                  className="inline-flex items-center gap-1 border border-[#2E2E2E] bg-[#141414] px-2.5 py-1 text-xs text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                >
                  <Sparkles size={12} className="text-[#FF1E1E]" />
                  <span>Create Creative Product</span>
                </button>
              )}
              {activeCanvasSession.projectId && onOpenProject && (
                <button
                  type="button"
                  onClick={() => {
                    const projId = activeCanvasSession.projectId;
                    setActiveCanvasSession(null);
                    onOpenProject(projId, 'deliverables');
                  }}
                  className="inline-flex items-center gap-1 border border-[#333] bg-[#141414] px-2.5 py-1 text-xs text-neutral-200 hover:border-[#FF1E1E]"
                >
                  <FolderKanban size={12} className="text-[#FF1E1E]" />
                  <span>Open Project Deliverables</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveCanvasSession(null)}
                className="border border-[#333] bg-[#141414] px-3 py-1 text-xs text-neutral-300 hover:text-white"
              >
                Close Studio
              </button>
            </div>
          </div>

          {canvasOverlayError && (
            <div role="alert" className="border border-red-900/60 bg-red-950/30 px-3.5 py-2 text-xs text-red-200 flex items-center justify-between">
              <span>{canvasOverlayError}</span>
              <button type="button" onClick={() => setCanvasOverlayError('')} className="underline">
                Dismiss
              </button>
            </div>
          )}

          {canvasOverlayNotice && (
            <div role="status" className="border border-emerald-900/60 bg-emerald-950/25 px-3.5 py-2 text-xs text-emerald-200 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                {canvasOverlayNotice}
              </span>
              <button type="button" onClick={() => setCanvasOverlayNotice('')} className="underline">
                Dismiss
              </button>
            </div>
          )}

          <DesignCanvasEditor
            key={activeCanvasSession.campaignDesignId || activeCanvasSession.design.id}
            initialDesign={activeCanvasSession.design}
            targetProjectTitle={projectsById.get(activeCanvasSession.projectId)?.title}
            onClose={() => setActiveCanvasSession(null)}
            onSaveDesign={async savedDesign => {
              if (!activeCanvasSession.workspaceId) return;
              setCanvasOverlayError('');
              setCanvasOverlayNotice('');
              try {
                const now = new Date().toISOString();
                const targetRef = activeCanvasSession.campaignDesignId
                  ? doc(
                      db,
                      'workspaces',
                      activeCanvasSession.workspaceId,
                      'campaignDesigns',
                      activeCanvasSession.campaignDesignId
                    )
                  : doc(collection(db, 'workspaces', activeCanvasSession.workspaceId, 'campaignDesigns'));
                const record: CampaignDesign = {
                  id: targetRef.id,
                  workspaceId: activeCanvasSession.workspaceId,
                  projectId: activeCanvasSession.projectId || '',
                  name: savedDesign.name || activeCanvasSession.design.name,
                  templateId: activeCanvasSession.templateId || 'custom-canvas-studio',
                  canvasDesign: {
                    ...savedDesign,
                    id: targetRef.id,
                    workspaceId: activeCanvasSession.workspaceId,
                    updatedAt: now,
                  },
                  category: activeCanvasSession.category || 'Release Day',
                  exportPreset: savedDesign.aspectRatio,
                  internalNotes: activeCanvasSession.internalNotes || '',
                  createdAt: savedDesign.createdAt || now,
                  updatedAt: now,
                };
                await setDoc(targetRef, record, { merge: true });
                setActiveCanvasSession(prev =>
                  prev ? { ...prev, campaignDesignId: targetRef.id, design: record.canvasDesign } : null
                );
                setCanvasOverlayNotice(`Saved production design "${record.name}" to workspace library.`);
                setStatusMessage(`Saved production design "${record.name}" to workspace library.`);
              } catch (err) {
                setCanvasOverlayError(err instanceof Error ? err.message : String(err));
              }
            }}
            onSaveAsWorkingAsset={async (blob, renderedDesign) => {
              setCanvasOverlayError('');
              setCanvasOverlayNotice('');
              try {
                const asset = await saveCanvasWorkingAssetFromBlob({
                  workspaceId: activeCanvasSession.workspaceId,
                  projectId: activeCanvasSession.projectId || undefined,
                  name: renderedDesign.name || 'Canvas Artwork',
                  blob,
                  mimeType: 'image/png',
                });
                const msg = `Saved "${asset.name}" to admin-only Working Assets (Internal Storage).`;
                setCanvasOverlayNotice(msg);
                setStatusMessage(msg);
              } catch (err) {
                setCanvasOverlayError(err instanceof Error ? err.message : String(err));
              }
            }}
            onSaveAsDeliverable={async (blob, renderedDesign, format) => {
              setCanvasOverlayError('');
              setCanvasOverlayNotice('');
              if (!firebaseUser) {
                setCanvasOverlayError('Authenticated admin session is required.');
                return;
              }
              const targetProject =
                projectsById.get(activeCanvasSession.projectId) ||
                projects.find(p => p.workspaceId === activeCanvasSession.workspaceId);
              if (!targetProject) {
                setCanvasOverlayError(
                  'Select a Target Project in the top bar (or create a project for this workspace) before staging a deliverable.'
                );
                return;
              }
              try {
                const ext = format === 'jpeg' ? 'jpg' : 'png';
                const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
                const actorName = firebaseUser.displayName || firebaseUser.email || 'Production Admin';
                await createDeliverableFromBlob({
                  project: targetProject,
                  title: renderedDesign.name || `${targetProject.title} Artwork`,
                  description: `Rendered in DesignCanvasEditor (${renderedDesign.aspectRatio}, ${renderedDesign.width}×${renderedDesign.height}px).`,
                  fileName: `${sanitizeStorageFileName(renderedDesign.name || 'canvas-deliverable')}.${ext}`,
                  mimeType,
                  blob,
                  actorUid: firebaseUser.uid,
                  actorName,
                  publishImmediately: false,
                  activityDetails: `Staged creative studio output "${renderedDesign.name}" as Internal QA Draft deliverable.`,
                });
                const msg = `Staged "${renderedDesign.name}" as a QA Draft deliverable inside "${targetProject.title}".`;
                setCanvasOverlayNotice(msg);
                setStatusMessage(msg);
                setProjectFilter(targetProject.id);
              } catch (err) {
                setCanvasOverlayError(err instanceof Error ? err.message : String(err));
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDesignLibrary;
