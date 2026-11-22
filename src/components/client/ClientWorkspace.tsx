import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  Activity,
  ArrowRight,
  Bell,
  Briefcase,
  CheckCircle2,
  FileCheck2,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Inbox,
  Layers,
  LogOut,
  Menu,
  Music2,
  Package,
  Palette,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import {
  ClientProfile,
  ClientProject,
  ProductionActivity,
  ProductionDeliverable,
  ProductionNotification,
  ProductionRevisionRequest,
  ProductionTask,
  RequestAttachment,
  Workspace,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { db, functions, storage } from '../../lib/firebase';
import { ensureClientWorkspace, resolveClientProjectWorkspaceId } from '../../lib/clientWorkspace';
import { defaultCategoryForAudience } from '../../lib/productionCategories';
import { isInternalStoragePath } from '../../lib/productionPromotion';
import keedohubBrandLogo from '../../assets/images/keedohub_brand_logo_1795340542093.jpg';
import {
  ClientStudio,
  ClientStudioSection,
  ReleaseStatus,
  StudioAsset,
  StudioContentItem,
  StudioDocument,
  StudioRelease,
} from './ClientStudio';
import {
  ClientTab,
  formatDynamicRequestBrief,
  getRequestCategoriesForExperience,
  ProductionRequestPrefill,
  resolveClientExperience,
  validatePersonalAccountUpdate,
} from '../../lib/clientOS';
import { ProductionNotificationCenter } from '../common/ProductionNotificationCenter';
import { ClientOnboarding } from './ClientOnboarding';
import { ClientCreativeHub } from './ClientCreativeHub';

const STAGE_ORDER = [
  'New Request',
  'Brief Approved',
  'In Production',
  'Internal QA',
  'Client Review',
  'Revision Required',
  'Ready for Delivery',
  'Delivered',
];

function messageFromError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return String(error);
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const TAB_ICONS: Record<ClientTab, React.ComponentType<{ size?: number; className?: string }>> = {
  overview: Sparkles,
  'creative-hub': Package,
  projects: FolderKanban,
  requests: Inbox,
  deliverables: FileCheck2,
  updates: Activity,
  account: User,
  'artist-profile': Music2,
  profile: Music2,
  releases: Music2,
  content: Layers,
  assets: ImageIcon,
  brand: Palette,
  documents: FileText,
  invoices: Briefcase,
  proposals: FileText,
};

export const ClientWorkspace: React.FC = () => {
  const {
    firebaseUser,
    clientProfile: contextClientProfile,
    isClientProfileLoading,
    clientProfileError,
    refreshClientProfile,
    canAccessAdminCenter,
    setAppMode,
    sendPasswordReset,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ClientTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaceError, setWorkspaceError] = useState('');

  // Production operations collections
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [deliverables, setDeliverables] = useState<ProductionDeliverable[]>([]);
  const [revisions, setRevisions] = useState<ProductionRevisionRequest[]>([]);
  const [activity, setActivity] = useState<ProductionActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Studio subcollections (shared across Overview + Artist/Brand OS)
  const [studioReleases, setStudioReleases] = useState<StudioRelease[]>([]);
  const [studioContentItems, setStudioContentItems] = useState<StudioContentItem[]>([]);
  const [studioAssets, setStudioAssets] = useState<StudioAsset[]>([]);
  const [studioDocuments, setStudioDocuments] = useState<StudioDocument[]>([]);
  const [studioLoading, setStudioLoading] = useState(true);
  const [studioError, setStudioError] = useState('');

  const [error, setError] = useState('');
  const [feedbackByDeliverable, setFeedbackByDeliverable] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState('');

  // Creative request submission & tracking state
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestRequirements, setRequestRequirements] = useState('');
  const [requestReferences, setRequestReferences] = useState('');
  const [requestFiles, setRequestFiles] = useState<File[]>([]);
  const [requestCategory, setRequestCategory] = useState<string>(defaultCategoryForAudience(true));
  const [requestDueDate, setRequestDueDate] = useState('');
  const [requestIntendedUse, setRequestIntendedUse] = useState('');
  const [requestTargetPlatforms, setRequestTargetPlatforms] = useState<string[]>([]);
  const [requestDeliverableTypes, setRequestDeliverableTypes] = useState<string[]>([]);
  const [requestPackagingSpec, setRequestPackagingSpec] = useState('');
  const [requestLinkedProductId, setRequestLinkedProductId] = useState('');
  const [requestLinkedProductTitle, setRequestLinkedProductTitle] = useState('');
  const [requestLinkedReleaseId, setRequestLinkedReleaseId] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestReplyByProject, setRequestReplyByProject] = useState<Record<string, string>>({});
  const [replySubmittingId, setReplySubmittingId] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'clarification' | 'accepted' | 'rejected'>('all');

  const [projectStageFilter, setProjectStageFilter] = useState<'all' | 'production' | 'review' | 'delivered'>('all');
  const [deliverableStatusFilter, setDeliverableStatusFilter] = useState<'all' | 'awaiting' | 'approved' | 'revisions'>('all');
  const [updatesFilter, setUpdatesFilter] = useState<'all' | 'activity' | 'revisions'>('all');
  const [requestSuccessSummary, setRequestSuccessSummary] = useState<{
    title: string;
    category: string;
    filesCount: number;
    dueDate: string;
  } | null>(null);

  const [profileState, setProfileState] = useState<'loading' | 'required' | 'complete' | 'error'>('loading');
  const [profileError, setProfileError] = useState('');
  const [profileCheck, setProfileCheck] = useState(0);

  // Separated Personal Account Profile & Settings state
  const [editNameValue, setEditNameValue] = useState('');
  const [savingAccountName, setSavingAccountName] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [accountNotice, setAccountNotice] = useState('');
  const [accountError, setAccountError] = useState('');
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  useEffect(() => {
    if (canAccessAdminCenter) {
      setAppMode('workspace');
    }
  }, [canAccessAdminCenter, setAppMode]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    let active = true;
    if (!firebaseUser) {
      setClientProfile(null);
      setProfileState('error');
      setProfileError('Sign in to access your client workspace.');
      return () => {
        active = false;
      };
    }

    if (isClientProfileLoading) {
      setProfileState('loading');
      setProfileError('');
      return () => {
        active = false;
      };
    }

    if (clientProfileError) {
      setProfileState('error');
      setProfileError(clientProfileError);
      return () => {
        active = false;
      };
    }

    if (!contextClientProfile || contextClientProfile.onboardingComplete !== true) {
      setClientProfile(null);
      setActiveWorkspace(null);
      setProjects([]);
      setTasks([]);
      setDeliverables([]);
      setRevisions([]);
      setActivity([]);
      setProfileState('required');
      setProfileError('');
      return () => {
        active = false;
      };
    }

    setEditNameValue(contextClientProfile.displayName || firebaseUser.displayName || '');

    if (contextClientProfile.workspaceId) {
      setClientProfile(contextClientProfile);
      setProfileError('');
      setProfileState('complete');
      return () => {
        active = false;
      };
    }

    setProfileState('loading');
    setProfileError('');
    setClientProfile(contextClientProfile);
    void ensureClientWorkspace(firebaseUser.uid)
      .then((workspace: Workspace) => {
        if (!active) return;
        setClientProfile({ ...contextClientProfile, workspaceId: workspace.id });
        setProfileState('complete');
      })
      .catch((workspaceErr: Error) => {
        if (!active) return;
        setProfileError(messageFromError(workspaceErr));
        setProfileState('error');
      });

    return () => {
      active = false;
    };
  }, [firebaseUser, contextClientProfile, isClientProfileLoading, clientProfileError, profileCheck]);

  // Load the single primary workspace for this account.
  useEffect(() => {
    if (!firebaseUser || profileState !== 'complete' || !clientProfile?.workspaceId) {
      setActiveWorkspace(null);
      setWorkspaceError('');
      return;
    }
    setWorkspaceError('');
    const workspaceRef = doc(db, 'workspaces', clientProfile.workspaceId);
    const unsub = onSnapshot(
      workspaceRef,
      snapshot => {
        if (!snapshot.exists()) {
          setActiveWorkspace(null);
          setWorkspaceError('Your workspace could not be found. Contact KeedoHub support.');
          return;
        }
        const data = snapshot.data() as Workspace;
        if (data.ownerId !== firebaseUser.uid) {
          setActiveWorkspace(null);
          setWorkspaceError('You do not own this workspace. Contact KeedoHub support.');
          return;
        }
        setActiveWorkspace({ ...data, id: snapshot.id } as Workspace);
      },
      err => setWorkspaceError(messageFromError(err)),
    );
    return () => unsub();
  }, [firebaseUser, profileState, clientProfile?.workspaceId]);

  // Load workspace studio subcollections once for Overview + Artist/Brand OS sections.
  useEffect(() => {
    if (!activeWorkspace || contextClientProfile?.status === 'Suspended') {
      setStudioReleases([]);
      setStudioContentItems([]);
      setStudioAssets([]);
      setStudioDocuments([]);
      setStudioLoading(false);
      return;
    }
    if (activeWorkspace.status === 'Paused' || activeWorkspace.status === 'Archived') {
      setStudioLoading(false);
      setStudioError(`This workspace is ${activeWorkspace.status.toLowerCase()} and its creative records are temporarily unavailable.`);
      return;
    }

    setStudioLoading(true);
    setStudioError('');
    const base = doc(db, 'workspaces', activeWorkspace.id);
    const unsubscribers = [
      onSnapshot(
        collection(base, 'releases'),
        snapshot => {
          setStudioReleases(
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
          setStudioLoading(false);
        },
        err => {
          setStudioError(messageFromError(err));
          setStudioLoading(false);
        },
      ),
      onSnapshot(
        collection(base, 'contentItems'),
        snapshot => {
          setStudioContentItems(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StudioContentItem)));
          setStudioLoading(false);
        },
        err => {
          setStudioError(messageFromError(err));
          setStudioLoading(false);
        },
      ),
      onSnapshot(
        query(collection(base, 'brandAssets'), where('isInternal', '==', false)),
        snapshot => {
          setStudioAssets(
            snapshot.docs
              .map(item => ({ id: item.id, ...item.data() } as StudioAsset))
              .filter(asset => !isInternalStoragePath(asset.storagePath)),
          );
          setStudioLoading(false);
        },
        err => {
          setStudioError(messageFromError(err));
          setStudioLoading(false);
        },
      ),
      onSnapshot(
        collection(base, 'documents'),
        snapshot => {
          setStudioDocuments(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as StudioDocument)));
          setStudioLoading(false);
        },
        err => {
          setStudioError(messageFromError(err));
          setStudioLoading(false);
        },
      ),
    ];
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [activeWorkspace]);

  // Load projects, tasks, deliverables, revisions, activity for the single workspace.
  useEffect(() => {
    setError('');
    let cancelled = false;
    let activeProjectsUnsub: (() => void) | undefined;
    let childUnsubscribers: (() => void)[] = [];

    if (!firebaseUser) {
      setLoading(false);
      setError('Sign in to view your client workspace.');
      return;
    }
    if (!activeWorkspace || contextClientProfile?.status === 'Suspended') {
      setLoading(false);
      return;
    }
    const uid = firebaseUser.uid;

    const handleProjectsSnapshot = (docs: Array<{ id: string; data: () => Record<string, any> }>) => {
      if (cancelled) return;
      setLoading(true);
      const clientProjects = docs.map(item => {
        const data = item.data();
        return {
          id: item.id,
          ...data,
          workspaceId: resolveClientProjectWorkspaceId(data.workspaceId, clientProfile?.workspaceId),
        } as ClientProject;
      });
      setProjects(clientProjects);
      childUnsubscribers.forEach(unsubscribe => unsubscribe());
      childUnsubscribers = [];
      setTasks([]);
      setDeliverables([]);
      setRevisions([]);
      setActivity([]);

      const scopedProjects = clientProjects.filter(project => project.workspaceId === activeWorkspace.id);
      if (scopedProjects.length === 0) {
        setLoading(false);
        return;
      }

      const receivedListeners = new Set<string>();
      const totalListeners = scopedProjects.length * 4;
      const finishInitialLoad = (listenerId: string) => {
        receivedListeners.add(listenerId);
        if (receivedListeners.size >= totalListeners) setLoading(false);
      };

      for (const project of scopedProjects) {
        const projectRef = doc(db, 'clientProjects', project.id);
        childUnsubscribers.push(
          onSnapshot(
            query(
              collection(projectRef, 'tasks'),
              where('clientVisible', '==', true),
              where('clientUid', '==', uid),
              where('projectId', '==', project.id),
            ),
            snapshot => {
              const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionTask));
              setTasks(previous => [...previous.filter(task => task.projectId !== project.id), ...rows]);
              finishInitialLoad(`${project.id}:tasks`);
            },
            err => {
              setError(messageFromError(err));
              setLoading(false);
            },
          ),
          onSnapshot(
            query(
              collection(projectRef, 'deliverables'),
              where('isClientPublished', '==', true),
              where('clientUid', '==', uid),
              where('projectId', '==', project.id),
            ),
            snapshot => {
              const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionDeliverable));
              setDeliverables(previous => [...previous.filter(item => item.projectId !== project.id), ...rows]);
              finishInitialLoad(`${project.id}:deliverables`);
            },
            err => {
              setError(messageFromError(err));
              setLoading(false);
            },
          ),
          onSnapshot(
            query(
              collection(projectRef, 'revisionRequests'),
              where('clientUid', '==', uid),
              where('projectId', '==', project.id),
            ),
            snapshot => {
              const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionRevisionRequest));
              setRevisions(previous => [...previous.filter(item => item.projectId !== project.id), ...rows]);
              finishInitialLoad(`${project.id}:revisions`);
            },
            err => {
              setError(messageFromError(err));
              setLoading(false);
            },
          ),
          onSnapshot(
            query(
              collection(projectRef, 'activity'),
              where('clientVisible', '==', true),
              where('projectId', '==', project.id),
            ),
            snapshot => {
              const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionActivity));
              setActivity(previous => [...previous.filter(item => item.projectId !== project.id), ...rows]);
              finishInitialLoad(`${project.id}:activity`);
            },
            err => {
              setError(messageFromError(err));
              setLoading(false);
            },
          ),
        );
      }
    };

    activeProjectsUnsub = onSnapshot(
      query(
        collection(db, 'clientProjects'),
        where('clientUid', '==', uid),
        where('workspaceId', '==', activeWorkspace.id),
      ),
      snapshot => handleProjectsSnapshot(snapshot.docs),
      err => {
        setError(messageFromError(err));
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
      activeProjectsUnsub?.();
      childUnsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [firebaseUser, clientProfile?.workspaceId, activeWorkspace, contextClientProfile?.status]);

  const experience = useMemo(
    () => resolveClientExperience(clientProfile?.accountType, activeWorkspace?.type),
    [clientProfile?.accountType, activeWorkspace?.type],
  );

  const availableRequestCategories = useMemo(
    () => getRequestCategoriesForExperience(experience.isArtist),
    [experience.isArtist],
  );

  const workspaceProjects = useMemo(
    () => projects.filter(project => project.workspaceId === activeWorkspace?.id),
    [projects, activeWorkspace],
  );
  const workspaceProjectIds = useMemo(() => new Set(workspaceProjects.map(project => project.id)), [workspaceProjects]);
  const workspaceDeliverables = useMemo(
    () => deliverables.filter(deliverable => workspaceProjectIds.has(deliverable.projectId)),
    [deliverables, workspaceProjectIds],
  );
  const awaitingDeliverables = useMemo(
    () =>
      workspaceDeliverables.filter(
        d => d.reviewStatus === 'Awaiting Review' || d.reviewStatus === 'Revised - Awaiting Review',
      ),
    [workspaceDeliverables],
  );
  const approvedDeliverables = useMemo(
    () => workspaceDeliverables.filter(d => d.reviewStatus === 'Approved'),
    [workspaceDeliverables],
  );
  const filteredDeliverables = useMemo(
    () =>
      workspaceDeliverables.filter(deliverable => {
        if (deliverableStatusFilter === 'awaiting') {
          return (
            deliverable.reviewStatus === 'Awaiting Review' ||
            deliverable.reviewStatus === 'Revised - Awaiting Review'
          );
        }
        if (deliverableStatusFilter === 'approved') {
          return deliverable.reviewStatus === 'Approved';
        }
        if (deliverableStatusFilter === 'revisions') {
          return (
            deliverable.reviewStatus === 'Revision Requested' ||
            deliverable.reviewStatus === 'Revision In Progress' ||
            deliverable.reviewStatus === 'Rejected'
          );
        }
        return true;
      }),
    [workspaceDeliverables, deliverableStatusFilter],
  );
  const workspaceRevisions = useMemo(
    () => revisions.filter(revision => workspaceProjectIds.has(revision.projectId)),
    [revisions, workspaceProjectIds],
  );
  const workspaceActivity = useMemo(
    () => activity.filter(item => workspaceProjectIds.has(item.projectId)),
    [activity, workspaceProjectIds],
  );
  const projectById = useMemo(() => new Map(workspaceProjects.map(project => [project.id, project])), [workspaceProjects]);
  const requestsByProject = useMemo(() => {
    const grouped = new Map<string, ProductionRevisionRequest[]>();
    for (const revision of [...workspaceRevisions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))) {
      const current = grouped.get(revision.projectId) || [];
      current.push(revision);
      grouped.set(revision.projectId, current);
    }
    return grouped;
  }, [workspaceRevisions]);
  const recentActivity = useMemo(
    () => [...workspaceActivity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [workspaceActivity],
  );
  const recentRevisions = useMemo(
    () => [...workspaceRevisions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [workspaceRevisions],
  );

  const openRequests = useMemo(
    () =>
      workspaceProjects.filter(
        p => p.requestStatus === 'Pending' || p.requestStatus === 'Clarification Requested' || p.stage === 'New Request',
      ),
    [workspaceProjects],
  );

  const activeProjectsList = useMemo(
    () => workspaceProjects.filter(p => p.stage !== 'Delivered' && p.requestStatus !== 'Rejected'),
    [workspaceProjects],
  );

  const filteredRequests = useMemo(() => {
    return [...workspaceProjects]
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
      .filter(project => {
        if (requestStatusFilter === 'pending') return project.requestStatus === 'Pending';
        if (requestStatusFilter === 'clarification') return project.requestStatus === 'Clarification Requested';
        if (requestStatusFilter === 'accepted') return project.requestStatus === 'Accepted';
        if (requestStatusFilter === 'rejected') return project.requestStatus === 'Rejected';
        return true;
      });
  }, [workspaceProjects, requestStatusFilter]);

  const allowedTabIds = useMemo(
    () => new Set<ClientTab>(experience.navGroups.flatMap(group => group.items.map(item => item.id))),
    [experience.navGroups],
  );

  useEffect(() => {
    if (!allowedTabIds.has(activeTab)) {
      setActiveTab('overview');
    }
  }, [allowedTabIds, activeTab]);

  const activeNavItem = useMemo(() => {
    for (const group of experience.navGroups) {
      const found = group.items.find(item => item.id === activeTab);
      if (found) return found;
    }
    return experience.navGroups[0].items[0];
  }, [experience.navGroups, activeTab]);

  const selectTab = (tab: ClientTab) => {
    setActiveTab(allowedTabIds.has(tab) ? tab : 'overview');
    setMobileMenuOpen(false);
  };

  const dynamicPlatformOptions = useMemo(() => {
    if (experience.isArtist) {
      return [
        'Spotify Canvas (1080×1920)',
        'Spotify Cover & Header (3000×3000 / 2660×1140)',
        'Apple Music Cover & Motion',
        'YouTube Music (1280×720 / 2560×1440)',
        'Audiomack',
        'Boomplay',
        'Instagram / TikTok Reels (9:16)',
      ];
    }
    return [
      'A4 / US Letter Print & Digital PDF',
      'Instagram & LinkedIn Feed / Carousel',
      'Corporate Web & Landing Banners',
      '16:9 Presentation / Pitch Deck',
      'CMYK 300 DPI Press Print',
      'Email Signature & Stationery',
    ];
  }, [experience.isArtist]);

  const dynamicDeliverableOptions = useMemo(() => {
    const cat = requestCategory.toLowerCase();
    if (experience.isArtist) {
      if (cat.includes('cover') || cat.includes('streaming')) {
        return [
          '3000×3000 Master Cover Artwork',
          'Explicit & Clean Artwork Variants',
          'Spotify Canvas / 9:16 Loop',
          'Apple & YouTube DSP Headers',
          'Out-Now & Countdown Promo Pack',
          'Tracklist Back Sleeve / Lyrics Card',
        ];
      }
      return [
        'Artist EPK / Press Kit PDF',
        'Booking & Press Photos Layout',
        'Tour / Show Poster & Flyer',
        '9:16 Release Teaser Video / Motion',
        'Social Rollout Carousel Kit',
      ];
    }
    if (cat.includes('brand') || cat.includes('card')) {
      return [
        'Primary & Secondary Logo Lockups (SVG/PDF)',
        'Brand Guidelines & Usage Deck',
        'Business Cards (Print CMYK 300 DPI)',
        'Official Letterhead & Email Signature',
        'Social Avatars & Cover System',
      ];
    }
    return [
      'Company Profile Deck',
      'Commercial Proposal / Quotation Template',
      'Branded Invoice & Receipt Suite',
      'Tri-Fold / Digital Brochure',
      'Paid Social & Launch Banners',
    ];
  }, [experience.isArtist, requestCategory]);

  const openRequestModal = (prefill?: Partial<ProductionRequestPrefill>) => {
    setRequestSuccessSummary(null);
    setError('');
    setRequestTitle(prefill?.title || '');
    const preferredCategory =
      prefill?.category && availableRequestCategories.includes(prefill.category)
        ? prefill.category
        : defaultCategoryForAudience(experience.isArtist);
    setRequestCategory(preferredCategory);
    setRequestDescription(prefill?.description || '');
    setRequestRequirements(prefill?.requirements || '');
    setRequestReferences(prefill?.references || '');
    setRequestDueDate(prefill?.dueDate || '');
    setRequestIntendedUse(prefill?.intendedUse || '');
    setRequestTargetPlatforms(prefill?.targetPlatforms || []);
    setRequestDeliverableTypes(prefill?.requiredDeliverables || []);
    setRequestPackagingSpec(prefill?.packagingSpec || '');
    setRequestLinkedProductId(prefill?.linkedProductId || '');
    setRequestLinkedProductTitle(prefill?.linkedProductTitle || '');
    setRequestLinkedReleaseId(prefill?.linkedReleaseId || '');
    setRequestFiles([]);
    setRequestOpen(true);
  };

  const review = async (deliverable: ProductionDeliverable, action: 'approve' | 'reject' | 'revision') => {
    const feedback = feedbackByDeliverable[deliverable.id] || '';
    if (action !== 'approve' && !feedback.trim()) {
      setError('Add feedback before rejecting or requesting a revision.');
      return;
    }
    setSubmittingId(deliverable.id);
    setError('');
    try {
      const functionName =
        action === 'approve'
          ? 'approveProductionDeliverable'
          : action === 'reject'
            ? 'rejectProductionDeliverable'
            : 'requestProductionRevision';
      const callable = httpsCallable(functions, functionName);
      await callable({
        projectId: deliverable.projectId,
        deliverableId: deliverable.id,
        feedback: feedback.trim(),
      });
      setFeedbackByDeliverable(previous => ({ ...previous, [deliverable.id]: '' }));
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setSubmittingId('');
    }
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestTitle.trim() || !requestDescription.trim()) {
      setError('Enter a project title and brief.');
      return;
    }
    setRequestSubmitting(true);
    setError('');
    const uploadedPaths: string[] = [];
    try {
      const callable = httpsCallable(functions, 'submitProductionRequest');
      const requestId = crypto.randomUUID();
      const attachments: RequestAttachment[] = [];
      for (const file of requestFiles) {
        if (!activeWorkspace?.id || !firebaseUser?.uid) {
          throw new Error('Workspace must be active before attaching files.');
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'attachment';
        const storagePath = `workspaces/${activeWorkspace.id}/requests/${firebaseUser.uid}/${requestId}/${safeName}`;
        await uploadBytes(ref(storage, storagePath), file, { contentType: file.type });
        uploadedPaths.push(storagePath);
        attachments.push({ fileName: file.name.slice(0, 120), storagePath, fileType: file.type, fileSize: file.size });
      }
      const linkedRelease = studioReleases.find(r => r.id === requestLinkedReleaseId);
      const requestBrief = formatDynamicRequestBrief({
        workspaceName: activeWorkspace?.name || clientProfile?.organizationName || 'Client workspace',
        workspaceType: activeWorkspace?.type || clientProfile?.accountType || 'Client',
        category: requestCategory,
        description: requestDescription,
        requirements: requestRequirements,
        references: requestReferences,
        intendedUse: requestIntendedUse,
        targetPlatforms: requestTargetPlatforms,
        requiredDeliverables: requestDeliverableTypes,
        packagingSpec: requestPackagingSpec,
        linkedProductTitle: requestLinkedProductTitle || (requestLinkedProductId ? `Product ${requestLinkedProductId}` : undefined),
        linkedReleaseTitle: linkedRelease ? `${linkedRelease.title} (${linkedRelease.type})` : undefined,
      });
      await callable({
        title: requestTitle.trim(),
        description: requestBrief,
        category: requestCategory,
        dueDate: requestDueDate,
        priority: 'Normal',
        workspaceId: activeWorkspace?.id,
        attachments,
      });
      setRequestSuccessSummary({
        title: requestTitle.trim(),
        category: requestCategory,
        filesCount: attachments.length,
        dueDate: requestDueDate,
      });
      setRequestTitle('');
      setRequestDescription('');
      setRequestRequirements('');
      setRequestReferences('');
      setRequestIntendedUse('');
      setRequestTargetPlatforms([]);
      setRequestDeliverableTypes([]);
      setRequestPackagingSpec('');
      setRequestLinkedProductId('');
      setRequestLinkedProductTitle('');
      setRequestLinkedReleaseId('');
      setRequestFiles([]);
      setRequestDueDate('');
    } catch (err) {
      const cleanupResults = await Promise.allSettled(uploadedPaths.map(path => deleteObject(ref(storage, path))));
      const cleanupFailed = cleanupResults.some(result => result.status === 'rejected');
      setError(`${messageFromError(err)}${cleanupFailed ? ' Some uploaded files could not be cleaned up; contact support.' : ''}`);
    } finally {
      setRequestSubmitting(false);
    }
  };

  const downloadRequestAttachment = async (attachment: RequestAttachment) => {
    try {
      const url = await getDownloadURL(ref(storage, attachment.storagePath));
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (downloadError) {
      setError(messageFromError(downloadError));
    }
  };

  const handleSelectNotification = (notification: ProductionNotification) => {
    const type = (notification.type || '').toLowerCase();
    if (type.includes('deliverable')) {
      selectTab('deliverables');
    } else if (type.includes('revision')) {
      selectTab('updates');
    } else if (type.includes('request')) {
      selectTab('requests');
    } else {
      selectTab('projects');
    }
  };

  const replyToRequest = async (project: ClientProject) => {
    const message = requestReplyByProject[project.id]?.trim();
    if (!message) return;
    setReplySubmittingId(project.id);
    setError('');
    try {
      await httpsCallable(functions, 'replyToProductionRequest')({ projectId: project.id, message });
      setRequestReplyByProject(previous => ({ ...previous, [project.id]: '' }));
    } catch (replyError) {
      setError(messageFromError(replyError));
    } finally {
      setReplySubmittingId('');
    }
  };

  const savePersonalDisplayName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firebaseUser) return;
    setAccountError('');
    setAccountNotice('');
    setSavingAccountName(true);
    try {
      const validated = validatePersonalAccountUpdate(
        editNameValue,
        clientProfile?.photoURL || firebaseUser.photoURL || '',
      );
      const now = new Date().toISOString();
      await updateProfile(firebaseUser, { displayName: validated.displayName });
      await updateDoc(doc(db, 'clientProfiles', firebaseUser.uid), {
        displayName: validated.displayName,
        updatedAt: now,
      });
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          displayName: validated.displayName,
          updatedAt: now,
        },
        { merge: true },
      );
      setClientProfile(prev => (prev ? { ...prev, displayName: validated.displayName, updatedAt: now } : prev));
      setAccountNotice('Personal display name updated.');
    } catch (err) {
      setAccountError(messageFromError(err));
    } finally {
      setSavingAccountName(false);
    }
  };

  const uploadPersonalAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !firebaseUser || !activeWorkspace) return;
    setAccountError('');
    setAccountNotice('');

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setAccountError('Choose a JPEG, PNG, WebP, GIF, or AVIF image for your account avatar.');
      return;
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      setAccountError('Avatar image must be smaller than 5 MB.');
      return;
    }

    setUploadingProfileImage(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'avatar.png';
      const storagePath = `workspaces/${activeWorkspace.id}/account/${firebaseUser.uid}/${Date.now()}-${safeName}`;
      const uploaded = await uploadBytes(ref(storage, storagePath), file, { contentType: file.type });
      const downloadUrl = await getDownloadURL(uploaded.ref);
      const validated = validatePersonalAccountUpdate(
        clientProfile?.displayName || firebaseUser.displayName || 'Keedohub Member',
        downloadUrl,
      );
      const now = new Date().toISOString();
      await updateProfile(firebaseUser, { photoURL: validated.photoURL });
      await updateDoc(doc(db, 'clientProfiles', firebaseUser.uid), {
        photoURL: validated.photoURL,
        updatedAt: now,
      });
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          photoURL: validated.photoURL,
          updatedAt: now,
        },
        { merge: true },
      );
      setClientProfile(prev => (prev ? { ...prev, photoURL: validated.photoURL, updatedAt: now } : prev));
      setAvatarLoadError(false);
      setAccountNotice('Account avatar updated.');
    } catch (err) {
      setAccountError(messageFromError(err));
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleTriggerPasswordReset = async () => {
    if (!firebaseUser?.email) return;
    setAccountError('');
    setAccountNotice('');
    setSendingResetEmail(true);
    try {
      await sendPasswordReset(firebaseUser.email);
      setAccountNotice(`Password reset link sent to ${firebaseUser.email}.`);
    } catch (err) {
      setAccountError(messageFromError(err));
    } finally {
      setSendingResetEmail(false);
    }
  };

  if (contextClientProfile?.status === 'Suspended') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4">
        <div className="w-full max-w-lg space-y-4 rounded border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-200">
          <p role="alert">This client account is suspended. Contact KeedoHub support for access.</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded border border-red-300/30 px-4 py-2 text-white hover:bg-red-950/40"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }
  if (profileState === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-sm text-neutral-400">
        Preparing your secure workspace…
      </main>
    );
  }
  if (profileState === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4">
        <div className="w-full max-w-lg space-y-4 border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-200">
          <p role="alert">{profileError}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void refreshClientProfile().finally(() => setProfileCheck(value => value + 1));
              }}
              className="border border-red-300/30 px-4 py-2 text-white"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="border border-[#333] bg-[#141414] px-4 py-2 text-neutral-200 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }
  if (profileState === 'required') {
    return (
      <ClientOnboarding
        onComplete={() => {
          void refreshClientProfile().finally(() => setProfileCheck(value => value + 1));
        }}
      />
    );
  }
  if (!activeWorkspace) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4">
        <div className="w-full max-w-lg space-y-3 rounded border border-[#292929] bg-[#0C0C0C] p-6 text-sm text-neutral-300">
          {workspaceError ? <p role="alert" className="text-red-300">{workspaceError}</p> : <p>Loading your private workspace…</p>}
          {workspaceError && (
            <button
              type="button"
              onClick={() => {
                void refreshClientProfile().finally(() => setProfileCheck(value => value + 1));
              }}
              className="border border-[#444] px-3 py-2 text-white"
            >
              Retry
            </button>
          )}
        </div>
      </main>
    );
  }

  const accountName = clientProfile?.displayName || firebaseUser?.displayName || 'Workspace Owner';
  const accountAvatar = clientProfile?.photoURL || firebaseUser?.photoURL || '';
  const approvedAssets = studioAssets.filter(asset => asset.status === 'Approved');

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0A0A0A] border-r border-[#1A1A1A]">
      <div className="h-16 px-5 border-b border-[#1A1A1A] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={keedohubBrandLogo}
            alt="KeedoHub Logo"
            referrerPolicy="no-referrer"
            className="h-8 w-8 object-cover border border-[#222222] shrink-0"
          />
          <span className="text-base font-black tracking-tighter text-white uppercase">
            KEEDOHUB
          </span>
          <span className="text-neutral-700">/</span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 truncate">
            {experience.osTitle}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-neutral-400 hover:text-white"
          aria-label="Close navigation menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Workspace Identity Summary */}
      <div className="px-4 py-3.5 border-b border-[#181818] bg-[#0C0C0C]">
        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Workspace</p>
        <p className="mt-0.5 text-sm font-bold text-white truncate">{activeWorkspace.name}</p>
        <p className="mt-0.5 text-[11px] font-mono text-neutral-500 truncate">
          {clientProfile?.accountType || activeWorkspace.type} · {activeWorkspace.status || 'Active'}
        </p>
      </div>

      <nav aria-label="Workspace navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {experience.navGroups.map(group => (
          <div key={group.group}>
            <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              {group.group}
            </div>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const Icon = TAB_ICONS[item.id] || Settings;
                const isActive = activeTab === item.id;
                const badgeCount =
                  item.id === 'deliverables'
                    ? awaitingDeliverables.length
                    : item.id === 'requests'
                      ? openRequests.length
                      : 0;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectTab(item.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded text-xs font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-[#171717] text-white border border-[#2C2C2C]'
                          : 'border border-transparent text-neutral-400 hover:text-white hover:bg-[#111111]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon size={15} className={isActive ? 'text-[#FF1E1E] shrink-0' : 'text-neutral-500 shrink-0'} />
                        <span className="truncate">{item.title}</span>
                      </span>
                      {badgeCount > 0 && (
                        <span className="font-mono text-[10px] tabular-nums text-[#FF1E1E] shrink-0">{badgeCount}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Account Footer */}
      <div className="border-t border-[#1A1A1A] p-4 space-y-3 shrink-0 bg-[#080808]">
        <button
          type="button"
          onClick={() => selectTab('account')}
          className="w-full flex items-center gap-2.5 text-left group"
        >
          {accountAvatar && !avatarLoadError ? (
            <img
              src={accountAvatar}
              alt={accountName}
              referrerPolicy="no-referrer"
              onError={() => setAvatarLoadError(true)}
              className="h-8 w-8 rounded-full border border-[#2E2E2E] object-cover shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full border border-[#2E2E2E] bg-[#141414] flex items-center justify-center text-neutral-400 shrink-0">
              <User size={14} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate group-hover:text-red-300 transition-colors">
              {accountName}
            </p>
            <p className="text-[11px] font-mono text-neutral-500 truncate">
              {clientProfile?.email || firebaseUser?.email}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full flex items-center justify-center gap-1.5 rounded border border-[#242424] bg-[#121212] px-3 py-1.5 text-[11px] font-medium text-neutral-300 hover:text-white hover:border-red-900"
        >
          <LogOut size={12} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Personalized Welcome Banner */}
      <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
            {experience.osTitle} · {activeWorkspace.name}
          </p>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Welcome back, {accountName}.
          </h2>
          <p className="text-sm text-neutral-400 max-w-2xl">{experience.osSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openRequestModal()}
            className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-600 whitespace-nowrap shrink-0"
          >
            <Plus size={14} />
            <span>New Request</span>
          </button>
          {awaitingDeliverables.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setDeliverableStatusFilter('awaiting');
                selectTab('deliverables');
              }}
              className="inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-950/20 px-3.5 py-2 text-xs font-semibold text-amber-200 hover:text-white whitespace-nowrap shrink-0"
            >
              <FileCheck2 size={14} />
              <span>Review {awaitingDeliverables.length} Deliverable(s)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => selectTab(experience.isArtist ? 'content' : 'documents')}
            className="inline-flex items-center gap-1.5 rounded border border-[#2A2A2A] bg-[#141414] px-3.5 py-2 text-xs font-medium text-neutral-200 hover:text-white whitespace-nowrap shrink-0"
          >
            <span>{experience.isArtist ? 'Open Content Engine' : 'Business Documents'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {workspaceProjects.some(p => p.requestStatus === 'Clarification Requested') && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-amber-200">
              Clarification requested by KeedoHub production team
            </p>
            <p className="text-xs text-amber-100/80 mt-0.5">
              One or more of your creative requests needs an answer before production can proceed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setRequestStatusFilter('clarification');
              selectTab('requests');
            }}
            className="rounded bg-amber-500/20 border border-amber-400/50 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/30 whitespace-nowrap shrink-0"
          >
            Reply to Request
          </button>
        </div>
      )}

      {/* Real Operational Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => selectTab('projects')}
          className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Active Projects</p>
          <p className="mt-2 text-2xl font-black text-white font-mono tabular-nums">{activeProjectsList.length}</p>
          <p className="mt-1 text-xs text-neutral-500">{workspaceProjects.length} total in workspace</p>
        </button>
        <button
          type="button"
          onClick={() => {
            setDeliverableStatusFilter('awaiting');
            selectTab('deliverables');
          }}
          className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Awaiting Review</p>
          <p className={`mt-2 text-2xl font-black font-mono tabular-nums ${awaitingDeliverables.length > 0 ? 'text-amber-400' : 'text-white'}`}>
            {awaitingDeliverables.length}
          </p>
          <p className="mt-1 text-xs text-neutral-500">{approvedDeliverables.length} approved final output(s)</p>
        </button>
        <button
          type="button"
          onClick={() => selectTab('requests')}
          className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Open Requests</p>
          <p className="mt-2 text-2xl font-black text-white font-mono tabular-nums">{openRequests.length}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {workspaceProjects.filter(p => p.requestStatus === 'Clarification Requested').length} needing reply
          </p>
        </button>
        {experience.isArtist ? (
          <button
            type="button"
            onClick={() => selectTab('releases')}
            className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Music Releases</p>
            <p className="mt-2 text-2xl font-black text-white font-mono tabular-nums">{studioReleases.length}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {studioReleases.filter(r => r.status === 'Live').length} live · {studioAssets.length} assets
            </p>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => selectTab('assets')}
            className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 text-left hover:border-[#3A3A3A] transition-colors"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Brand Assets &amp; Docs</p>
            <p className="mt-2 text-2xl font-black text-white font-mono tabular-nums">{studioAssets.length}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {approvedAssets.length} approved · {studioDocuments.length} business docs
            </p>
          </button>
        )}
      </div>

      {/* Main Overview Two-Column Grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
        {/* Current Projects & Production Status */}
        <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Current Projects &amp; Production Status</h3>
              <p className="text-xs text-neutral-500">Live progress across active production briefs.</p>
            </div>
            <button
              type="button"
              onClick={() => selectTab('projects')}
              className="text-xs font-medium text-neutral-300 hover:text-white whitespace-nowrap shrink-0"
            >
              View all
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-neutral-500 py-4">Loading projects…</p>
          ) : workspaceProjects.length === 0 ? (
            <div className="rounded border border-dashed border-[#2C2C2C] p-6 text-center space-y-3">
              <p className="text-sm text-neutral-400">No production projects in this workspace yet.</p>
              <button
                type="button"
                onClick={() => openRequestModal()}
                className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-600"
              >
                <Plus size={13} />
                Submit First Creative Request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workspaceProjects.slice(0, 4).map(project => (
                <div key={project.id} className="rounded border border-[#1E1E1E] bg-[#111] p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">{project.title}</p>
                    <span className="text-[11px] font-mono text-neutral-300 shrink-0">
                      {project.stage || project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded bg-[#242424]">
                      <div
                        className="h-full bg-[#FF1E1E]"
                        style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 tabular-nums">{project.progress || 0}%</span>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-500 tabular-nums">
                    {project.category} · Target delivery: {project.expectedDeliveryDate || 'TBC'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions & Creative Requests Attention */}
        <div className="space-y-5">
          <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
            <h3 className="text-sm font-bold text-white">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              {experience.isArtist ? (
                <>
                  <button
                    type="button"
                    onClick={() => selectTab('creative-hub')}
                    className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                  >
                    <span>Artist Creative Hub &amp; Streaming Packs</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('releases')}
                    className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                  >
                    <span>Manage Music &amp; Releases ({studioReleases.length})</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('content')}
                    className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                  >
                    <span>Release Content Engine ({studioContentItems.length})</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('assets')}
                    className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                  >
                    <span>Artist Asset Library ({studioAssets.length})</span>
                    <ArrowRight size={13} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => selectTab('creative-hub')}
                    className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                  >
                    <span>{experience.osMode === 'company' ? 'Business Creative Hub & Packs' : 'Brand Creative Hub & Packs'}</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('brand')}
                    className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                  >
                    <span>Brand Identity &amp; Guidelines</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('content')}
                    className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                  >
                    <span>Creative Copy &amp; Messaging ({studioContentItems.length})</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTab('documents')}
                    className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
                  >
                    <span>Proposals, Invoices &amp; Documents ({studioDocuments.length})</span>
                    <ArrowRight size={13} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => selectTab('account')}
                className="flex items-center justify-between rounded border border-[#242424] bg-[#121212] px-3.5 py-2.5 text-xs font-medium text-neutral-200 hover:border-[#FF1E1E] hover:text-white"
              >
                <span>Account Profile &amp; Settings</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Recent Deliverables &amp; Assets</h3>
              <button
                type="button"
                onClick={() => selectTab('deliverables')}
                className="text-xs text-neutral-400 hover:text-white"
              >
                All deliverables
              </button>
            </div>
            {workspaceDeliverables.length === 0 && approvedAssets.length === 0 ? (
              <p className="text-xs text-neutral-500">
                Published deliverables and approved studio assets will appear here once ready.
              </p>
            ) : (
              <div className="space-y-2">
                {workspaceDeliverables.slice(0, 3).map(del => (
                  <div key={del.id} className="flex items-center justify-between gap-2 rounded border border-[#1E1E1E] bg-[#111] px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{del.title}</p>
                      <p className="text-[10px] font-mono text-neutral-500">{del.reviewStatus}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectTab('deliverables')}
                      className="text-[11px] text-red-300 hover:text-white shrink-0"
                    >
                      Open
                    </button>
                  </div>
                ))}
                {approvedAssets.slice(0, 2).map(asset => (
                  <div key={asset.id} className="flex items-center justify-between gap-2 rounded border border-[#1E1E1E] bg-[#111] px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{asset.name}</p>
                      <p className="text-[10px] font-mono text-emerald-400">Approved Asset · {asset.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectTab('assets')}
                      className="text-[11px] text-neutral-300 hover:text-white shrink-0"
                    >
                      Library
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Creative Requests & Recent Activity */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Creative Requests Status</h3>
            <button type="button" onClick={() => selectTab('requests')} className="text-xs text-neutral-400 hover:text-white">
              Manage requests
            </button>
          </div>
          {workspaceProjects.length === 0 ? (
            <p className="text-xs text-neutral-500">No requests submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {workspaceProjects.slice(0, 4).map(req => (
                <div key={req.id} className="flex items-center justify-between gap-3 rounded border border-[#1E1E1E] bg-[#111] px-3 py-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{req.title}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{req.category}</p>
                  </div>
                  <span
                    className={`font-mono text-[11px] shrink-0 ${
                      req.requestStatus === 'Clarification Requested'
                        ? 'text-amber-300'
                        : req.requestStatus === 'Accepted'
                          ? 'text-emerald-400'
                          : req.requestStatus === 'Rejected'
                            ? 'text-red-300'
                            : 'text-neutral-300'
                    }`}
                  >
                    {req.requestStatus || req.stage || 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Bell size={14} className="text-[#FF1E1E]" />
              <span>Notifications &amp; Recent Activity</span>
            </h3>
            <button type="button" onClick={() => selectTab('updates')} className="text-xs text-neutral-400 hover:text-white">
              Full log
            </button>
          </div>
          {recentActivity.length === 0 && recentRevisions.length === 0 ? (
            <p className="text-xs text-neutral-500">No recent activity yet. Updates from KeedoHub production appear here.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.slice(0, 4).map(item => (
                <div key={item.id} className="rounded border border-[#1E1E1E] bg-[#111] px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white truncate">{item.action}</p>
                    <span className="text-[10px] font-mono text-neutral-500 tabular-nums shrink-0">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-neutral-400 line-clamp-2">{item.details}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">Production Briefs</p>
          <h2 className="mt-1 text-lg font-bold text-white">Creative Requests</h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            Submit creative production requests, respond to clarification prompts, and track approval into active projects.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openRequestModal()}
          className="inline-flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-600 whitespace-nowrap shrink-0"
        >
          <Plus size={14} />
          <span>New Creative Request</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[#1A1A1A] pb-3">
        {[
          { id: 'all' as const, label: 'All Requests', count: workspaceProjects.length },
          { id: 'pending' as const, label: 'Pending Review', count: workspaceProjects.filter(p => p.requestStatus === 'Pending').length },
          {
            id: 'clarification' as const,
            label: 'Clarification Needed',
            count: workspaceProjects.filter(p => p.requestStatus === 'Clarification Requested').length,
          },
          { id: 'accepted' as const, label: 'Accepted', count: workspaceProjects.filter(p => p.requestStatus === 'Accepted').length },
          { id: 'rejected' as const, label: 'Declined', count: workspaceProjects.filter(p => p.requestStatus === 'Rejected').length },
        ].map(filterItem => (
          <button
            key={filterItem.id}
            type="button"
            onClick={() => setRequestStatusFilter(filterItem.id)}
            className={`rounded px-3 py-1.5 text-xs font-mono tabular-nums whitespace-nowrap shrink-0 transition-colors ${
              requestStatusFilter === filterItem.id
                ? 'bg-white text-black font-semibold'
                : 'border border-[#262626] bg-[#121212] text-neutral-400 hover:text-white'
            }`}
          >
            {filterItem.label} ({filterItem.count})
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#2A2A2A] bg-[#0C0C0C] p-8 text-center space-y-3">
          <p className="text-sm text-neutral-400">
            {workspaceProjects.length === 0 ? 'No creative requests submitted yet.' : 'No requests match this status filter.'}
          </p>
          <button
            type="button"
            onClick={() => openRequestModal()}
            className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus size={13} />
            Submit Creative Request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(project => (
            <article key={project.id} className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white">{project.title}</h3>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                        project.requestStatus === 'Clarification Requested'
                          ? 'border-amber-500/40 bg-amber-950/30 text-amber-200'
                          : project.requestStatus === 'Accepted'
                            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                            : project.requestStatus === 'Rejected'
                              ? 'border-red-500/40 bg-red-950/30 text-red-300'
                              : 'border-[#333] bg-[#141414] text-neutral-300'
                      }`}
                    >
                      {project.requestStatus || 'Pending'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-mono text-neutral-500 tabular-nums">
                    {project.category} · Target delivery: {project.expectedDeliveryDate || 'TBC'} · Current stage: {project.stage || project.status}
                  </p>
                </div>
                {project.requestStatus === 'Accepted' && (
                  <button
                    type="button"
                    onClick={() => selectTab('projects')}
                    className="rounded border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E] whitespace-nowrap shrink-0"
                  >
                    View Active Project
                  </button>
                )}
              </div>

              <p className="text-sm text-neutral-300 whitespace-pre-wrap">{project.description}</p>

              {project.adminMessage && project.requestStatus !== 'Clarification Requested' && (
                <div className="rounded border border-[#242424] bg-[#121212] p-3 text-xs text-neutral-200">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Admin Feedback</p>
                  <p>{project.adminMessage}</p>
                </div>
              )}

              {(project.requestAttachmentsOwnerUid === firebaseUser?.uid || project.clientUid === firebaseUser?.uid) &&
                project.requestAttachments &&
                project.requestAttachments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-neutral-400">Attachments:</span>
                    {project.requestAttachments.map(attachment => (
                      <button
                        key={attachment.storagePath}
                        type="button"
                        onClick={() => void downloadRequestAttachment(attachment)}
                        className="rounded border border-[#333] px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:border-[#555]"
                      >
                        {attachment.fileName} · Download
                      </button>
                    ))}
                  </div>
                )}

              {project.requestHistory && project.requestHistory.length > 0 && (
                <details className="rounded border border-[#222] bg-[#101010] p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-neutral-300">
                    Request conversation · {project.requestHistory.length} message(s)
                  </summary>
                  <ol className="mt-3 space-y-2">
                    {project.requestHistory.map((entry, index) => (
                      <li key={`${entry.createdAt}-${index}`} className="rounded border border-[#242424] bg-[#141414] p-2.5">
                        <p className="text-[10px] font-mono text-neutral-500">
                          {entry.authorName} · {entry.authorRole} · {new Date(entry.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-200">{entry.message}</p>
                      </li>
                    ))}
                  </ol>
                </details>
              )}

              {project.requestStatus === 'Clarification Requested' && (
                <div className="space-y-2 rounded border border-amber-500/30 bg-amber-950/15 p-3">
                  {project.adminMessage && <p className="text-xs font-medium text-amber-100">{project.adminMessage}</p>}
                  <textarea
                    value={requestReplyByProject[project.id] || ''}
                    onChange={event =>
                      setRequestReplyByProject(previous => ({ ...previous, [project.id]: event.target.value }))
                    }
                    maxLength={3000}
                    rows={3}
                    placeholder="Provide the requested clarification details…"
                    className="w-full rounded border border-[#333] bg-[#141414] p-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    disabled={replySubmittingId === project.id || !requestReplyByProject[project.id]?.trim()}
                    onClick={() => void replyToRequest(project)}
                    className="inline-flex items-center gap-1.5 rounded bg-[#FF1E1E] px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Send size={12} />
                    {replySubmittingId === project.id ? 'Sending…' : 'Send clarification'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderAccountSettings = () => (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
      <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 sm:p-6 space-y-6">
        <div className="border-b border-[#1E1E1E] pb-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">Personal Account</p>
          <h2 className="mt-1 text-xl font-bold text-white">Account Profile &amp; Settings</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Manage your personal login name, account avatar and sign-in security. Artist Profile and Brand Identity are managed separately in their OS sections.
          </p>
        </div>

        {accountError && (
          <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
            {accountError}
          </div>
        )}
        {accountNotice && (
          <div role="status" className="rounded border border-emerald-500/30 bg-emerald-950/20 p-3 text-sm text-emerald-300">
            {accountNotice}
          </div>
        )}

        {/* Personal Avatar */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#1E1E1E] bg-[#111] p-4">
          {accountAvatar && !avatarLoadError ? (
            <img
              src={accountAvatar}
              alt={accountName}
              referrerPolicy="no-referrer"
              onError={() => setAvatarLoadError(true)}
              className="h-16 w-16 rounded-full border border-[#333] object-cover shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-full border border-[#333] bg-[#181818] flex items-center justify-center text-neutral-400 shrink-0">
              <User size={24} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{accountName}</p>
            <p className="text-xs font-mono text-neutral-400 truncate">
              {clientProfile?.email || firebaseUser?.email}
            </p>
            <p className="mt-1 text-[11px] text-neutral-500">JPEG, PNG, WebP, GIF, or AVIF up to 5 MB.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-[#333] bg-[#161616] px-3.5 py-2 text-xs font-semibold text-white hover:border-[#FF1E1E] whitespace-nowrap shrink-0">
            <Upload size={13} />
            <span>{uploadingProfileImage ? 'Uploading…' : 'Change Avatar'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              disabled={uploadingProfileImage}
              onChange={event => void uploadPersonalAvatar(event)}
              className="sr-only"
            />
          </label>
        </div>

        {/* Display Name Form */}
        <form onSubmit={savePersonalDisplayName} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Personal Display Name
              </span>
              <input
                required
                maxLength={100}
                value={editNameValue}
                onChange={event => setEditNameValue(event.target.value)}
                className="w-full rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2.5 text-sm text-white outline-none focus:border-[#FF1E1E]"
                placeholder="Your full name"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Sign-In Email (Read-Only)
              </span>
              <input
                disabled
                value={clientProfile?.email || firebaseUser?.email || ''}
                className="w-full rounded border border-[#242424] bg-[#101010] px-3 py-2.5 text-sm text-neutral-500 cursor-not-allowed"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={savingAccountName}
            className="inline-flex items-center gap-2 rounded bg-[#FF1E1E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            <span>{savingAccountName ? 'Saving…' : 'Save Account Profile'}</span>
          </button>
        </form>
      </section>

      <aside className="space-y-5">
        <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={16} className="text-[#FF1E1E]" />
            <h3 className="text-sm font-bold">Workspace &amp; Account Binding</h3>
          </div>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between gap-2 border-b border-[#1A1A1A] pb-2">
              <dt className="text-neutral-500">Account Type</dt>
              <dd className="font-mono text-white">{clientProfile?.accountType || activeWorkspace.type}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[#1A1A1A] pb-2">
              <dt className="text-neutral-500">OS Mode</dt>
              <dd className="font-mono text-white">{experience.osTitle}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-[#1A1A1A] pb-2">
              <dt className="text-neutral-500">Account Status</dt>
              <dd className="font-mono text-emerald-400">{clientProfile?.status || 'Active'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-500">Workspace ID</dt>
              <dd className="font-mono text-neutral-300 truncate max-w-[180px]">{activeWorkspace.id}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-[#222222] bg-[#0C0C0C] p-5 space-y-3">
          <h3 className="text-sm font-bold text-white">Security &amp; Session</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            If your account uses email and password sign-in, you can send a password reset link to your verified email address.
          </p>
          <div className="flex flex-col gap-2">
            {firebaseUser?.email && (
              <button
                type="button"
                disabled={sendingResetEmail}
                onClick={() => void handleTriggerPasswordReset()}
                className="w-full rounded border border-[#2E2E2E] bg-[#141414] px-3 py-2 text-xs font-medium text-neutral-200 hover:text-white hover:border-neutral-500 disabled:opacity-50"
              >
                {sendingResetEmail ? 'Sending reset link…' : 'Send Password Reset Email'}
              </button>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full rounded border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-950/40"
            >
              Sign Out of KeedoHub
            </button>
          </div>
        </section>
      </aside>
    </div>
  );

  const allowedStudioTabs = experience.isArtist
    ? ['artist-profile', 'profile', 'releases', 'content', 'assets']
    : ['brand', 'content', 'assets', 'documents', 'invoices', 'proposals'];
  const isStudioSection = allowedTabIds.has(activeTab) && allowedStudioTabs.includes(activeTab);

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-[#080808]/95 backdrop-blur border-b border-[#1A1A1A] px-4 md:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-[#141414] rounded"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="font-mono uppercase tracking-wider text-neutral-500 hidden sm:inline">
                {experience.osTitle}
              </span>
              <span className="text-neutral-600 hidden sm:inline">/</span>
              <h1 className="text-sm font-bold text-white truncate">{activeNavItem.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {firebaseUser && (
              <ProductionNotificationCenter uid={firebaseUser.uid} onSelectNotification={handleSelectNotification} />
            )}
            <button
              type="button"
              onClick={() => openRequestModal()}
              className="rounded bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 whitespace-nowrap shrink-0 transition-colors"
            >
              New request
            </button>
            <button
              type="button"
              onClick={() => selectTab('account')}
              className="hidden md:inline-flex items-center gap-2 rounded border border-[#242424] bg-[#101010] px-2.5 py-1.5 text-xs text-neutral-200 hover:text-white whitespace-nowrap shrink-0"
            >
              {accountAvatar && !avatarLoadError ? (
                <img
                  src={accountAvatar}
                  alt={accountName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarLoadError(true)}
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <User size={13} className="text-neutral-400" />
              )}
              <span className="max-w-[130px] truncate">{accountName}</span>
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded border border-[#242424] bg-[#101010] px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:border-red-900 whitespace-nowrap shrink-0"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto space-y-6">
          {workspaceError && (
            <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
              {workspaceError}
            </div>
          )}
          {error && (
            <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="border-b border-[#1A1A1A] pb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">
                  {experience.osTitle} · {activeWorkspace.name}
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-white">{activeNavItem.title}</h2>
                <p className="mt-1 text-xs sm:text-sm text-neutral-400">{activeNavItem.description}</p>
              </div>
            </div>
          )}

          {activeTab === 'creative-hub' ? (
            <ClientCreativeHub
              workspace={activeWorkspace}
              clientProfile={clientProfile}
              experience={experience}
              onRequestProduction={prefill => openRequestModal(prefill)}
              onNavigateSection={target => selectTab(target)}
            />
          ) : isStudioSection ? (
            <ClientStudio
              section={activeTab as ClientStudioSection}
              workspace={activeWorkspace}
              uid={firebaseUser?.uid || ''}
              accountName={accountName}
              projects={workspaceProjects}
              deliverables={workspaceDeliverables}
              primaryWorkspaceId={clientProfile?.workspaceId}
              externalData={{
                releases: studioReleases,
                contentItems: studioContentItems,
                assets: studioAssets,
                documents: studioDocuments,
                loading: studioLoading,
                error: studioError,
              }}
              onNavigateSection={target => selectTab(target)}
              onRequestProduction={prefill => openRequestModal(prefill)}
            />
          ) : activeTab === 'overview' ? (
            renderOverview()
          ) : activeTab === 'requests' ? (
            renderRequests()
          ) : activeTab === 'account' ? (
            renderAccountSettings()
          ) : loading ? (
            <p className="py-12 text-center text-sm text-neutral-400">Loading your projects…</p>
          ) : (
            <>
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 border-b border-[#1A1A1A] pb-3">
                    <span className="text-xs text-neutral-500">Filter:</span>
                    {[
                      { id: 'all' as const, label: 'All projects', count: workspaceProjects.length },
                      {
                        id: 'production' as const,
                        label: 'In production',
                        count: workspaceProjects.filter(p =>
                          ['Brief Approved', 'In Production', 'Internal QA', 'Revision Required', 'Ready for Delivery'].includes(
                            p.stage || '',
                          ),
                        ).length,
                      },
                      {
                        id: 'review' as const,
                        label: 'Briefs in review',
                        count: workspaceProjects.filter(
                          p =>
                            p.requestStatus === 'Pending' ||
                            p.requestStatus === 'Clarification Requested' ||
                            p.stage === 'New Request',
                        ).length,
                      },
                      {
                        id: 'delivered' as const,
                        label: 'Delivered',
                        count: workspaceProjects.filter(p => p.stage === 'Delivered').length,
                      },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setProjectStageFilter(f.id)}
                        className={`rounded px-2.5 py-1 text-xs font-mono tabular-nums transition-colors ${
                          projectStageFilter === f.id
                            ? 'border border-red-500/50 bg-red-950/40 text-white font-medium'
                            : 'border border-[#262626] bg-[#121212] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {f.label} ({f.count})
                      </button>
                    ))}
                  </div>

                  {workspaceProjects.length === 0 && (
                    <div className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-8 text-center text-sm text-neutral-400">
                      No projects are assigned to this workspace yet. Submit a Creative Request to start production.
                    </div>
                  )}

                  {workspaceProjects
                    .filter(project => {
                      if (projectStageFilter === 'production') {
                        return [
                          'Brief Approved',
                          'In Production',
                          'Internal QA',
                          'Revision Required',
                          'Ready for Delivery',
                        ].includes(project.stage || '');
                      }
                      if (projectStageFilter === 'review') {
                        return (
                          project.requestStatus === 'Pending' ||
                          project.requestStatus === 'Clarification Requested' ||
                          project.stage === 'New Request'
                        );
                      }
                      if (projectStageFilter === 'delivered') {
                        return project.stage === 'Delivered';
                      }
                      return true;
                    })
                    .map(project => {
                      const projectTasks = tasks.filter(task => task.projectId === project.id);
                      const projectRevisions = requestsByProject.get(project.id) || [];
                      const projectDeliverables = workspaceDeliverables.filter(d => d.projectId === project.id);
                      const awaitingProjectDeliverables = projectDeliverables.filter(
                        d => d.reviewStatus === 'Awaiting Review' || d.reviewStatus === 'Revised - Awaiting Review',
                      ).length;
                      const approvedProjectDeliverables = projectDeliverables.filter(
                        d => d.reviewStatus === 'Approved',
                      ).length;
                      return (
                        <article key={project.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-bold text-white">{project.title}</h3>
                              <p className="mt-1 text-sm text-neutral-400">{project.description}</p>
                            </div>
                            <span className="rounded border border-[#333] px-2.5 py-1 text-xs font-mono text-neutral-200 shrink-0">
                              {project.stage || project.status}
                            </span>
                          </div>

                          {project.requestStatus === 'Rejected' && (
                            <div className="mt-3 rounded border border-red-900/60 bg-red-950/20 p-3 text-xs text-red-200">
                              <p className="font-semibold text-red-300">Request Declined</p>
                              <p className="mt-1">
                                {project.adminMessage ||
                                  'No specific explanation was provided. Contact KeedoHub support or submit an updated brief.'}
                              </p>
                            </div>
                          )}
                          {project.requestStatus === 'Accepted' && project.adminMessage && (
                            <div className="mt-3 rounded border border-emerald-900/60 bg-emerald-950/20 p-3 text-xs text-emerald-200">
                              <p className="font-semibold text-emerald-300">Production Brief Accepted</p>
                              <p className="mt-1">{project.adminMessage}</p>
                            </div>
                          )}
                          {project.requestStatus === 'Pending' && (
                            <p className="mt-3 text-xs text-amber-300">Request status: Pending production review</p>
                          )}

                          {(project.requestAttachmentsOwnerUid === firebaseUser?.uid ||
                            project.clientUid === firebaseUser?.uid) &&
                            project.requestAttachments &&
                            project.requestAttachments.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="w-full text-[11px] font-semibold text-neutral-400">Reference files:</span>
                                {project.requestAttachments.map(attachment => (
                                  <button
                                    key={attachment.storagePath}
                                    type="button"
                                    onClick={() => void downloadRequestAttachment(attachment)}
                                    className="rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:border-[#555] transition-colors"
                                  >
                                    {attachment.fileName} · Download
                                  </button>
                                ))}
                              </div>
                            )}

                          {project.requestHistory && project.requestHistory.length > 0 && (
                            <details className="mt-3 rounded border border-[#242424] bg-[#101010] p-3">
                              <summary className="cursor-pointer text-xs font-semibold text-neutral-300">
                                Request conversation · {project.requestHistory.length} message(s)
                              </summary>
                              <ol className="mt-3 space-y-2.5">
                                {project.requestHistory.map((entry, index) => (
                                  <li key={`${entry.createdAt}-${index}`} className="rounded border border-[#262626] bg-[#141414] p-2.5">
                                    <p className="text-[10px] font-mono text-neutral-500">
                                      {entry.authorName} · {entry.authorRole} · {new Date(entry.createdAt).toLocaleString()}
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-300">{entry.message}</p>
                                  </li>
                                ))}
                              </ol>
                            </details>
                          )}

                          {project.requestStatus === 'Clarification Requested' && (
                            <div className="mt-3 space-y-2 rounded border border-amber-900/40 bg-amber-950/10 p-3">
                              {project.adminMessage && <p className="text-xs text-amber-100 font-medium">{project.adminMessage}</p>}
                              <textarea
                                value={requestReplyByProject[project.id] || ''}
                                onChange={event =>
                                  setRequestReplyByProject(previous => ({ ...previous, [project.id]: event.target.value }))
                                }
                                maxLength={3000}
                                rows={3}
                                placeholder="Reply with the requested details…"
                                className="w-full rounded border border-[#333] bg-[#141414] p-2 text-sm text-white"
                              />
                              <button
                                type="button"
                                disabled={replySubmittingId === project.id || !requestReplyByProject[project.id]?.trim()}
                                onClick={() => void replyToRequest(project)}
                                className="rounded bg-[#FF1E1E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                {replySubmittingId === project.id ? 'Sending…' : 'Send clarification'}
                              </button>
                            </div>
                          )}

                          <div className="mt-4 flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded bg-[#252525]">
                              <div
                                className="h-full bg-[#FF1E1E]"
                                style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-300 font-mono tabular-nums">{project.progress || 0}%</span>
                          </div>
                          <p
                            className={`mt-2 text-xs font-mono tabular-nums ${
                              project.expectedDeliveryDate &&
                              project.expectedDeliveryDate < new Date().toISOString().slice(0, 10) &&
                              project.stage !== 'Delivered'
                                ? 'text-amber-300'
                                : 'text-neutral-500'
                            }`}
                          >
                            Expected delivery: {project.expectedDeliveryDate || 'To be confirmed'}
                            {project.expectedDeliveryDate &&
                            project.expectedDeliveryDate < new Date().toISOString().slice(0, 10) &&
                            project.stage !== 'Delivered'
                              ? ' · Overdue'
                              : ''}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-1">
                            {STAGE_ORDER.map((stage, index) => {
                              const currentIndex = STAGE_ORDER.indexOf(project.stage || 'New Request');
                              const reached = index <= currentIndex;
                              return (
                                <span
                                  key={stage}
                                  className={`rounded px-2 py-1 text-[10px] font-mono ${
                                    reached ? 'bg-red-950/50 text-red-200' : 'bg-[#161616] text-neutral-600'
                                  }`}
                                >
                                  {stage}
                                </span>
                              );
                            })}
                          </div>
                          {(awaitingProjectDeliverables > 0 || approvedProjectDeliverables > 0) && (
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#1D1D1D] pt-3 text-xs">
                              <span className="font-mono text-neutral-400 tabular-nums">
                                Deliverables: {awaitingProjectDeliverables} awaiting review · {approvedProjectDeliverables} approved final
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {awaitingProjectDeliverables > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeliverableStatusFilter('awaiting');
                                      selectTab('deliverables');
                                    }}
                                    className="rounded bg-[#FF1E1E] px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                                  >
                                    Review {awaitingProjectDeliverables} deliverable(s)
                                  </button>
                                )}
                                {approvedProjectDeliverables > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeliverableStatusFilter('approved');
                                      selectTab('deliverables');
                                    }}
                                    className="rounded border border-emerald-800/60 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:text-white"
                                  >
                                    View {approvedProjectDeliverables} final approved file(s)
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          {projectTasks.length > 0 && (
                            <div className="mt-4 border-t border-[#222] pt-3">
                              <h4 className="text-xs font-semibold text-neutral-300">Shared tasks</h4>
                              {projectTasks.map(task => {
                                const overdue = Boolean(
                                  task.dueDate &&
                                    task.dueDate < new Date().toISOString().slice(0, 10) &&
                                    task.status !== 'Done',
                                );
                                return (
                                  <div key={task.id} className="mt-2 flex justify-between gap-2 text-xs">
                                    <span className="text-neutral-300">{task.title}</span>
                                    <span className={`font-mono tabular-nums ${overdue ? 'text-amber-300' : 'text-neutral-500'}`}>
                                      {task.status}
                                      {task.dueDate ? ` · Due ${task.dueDate}` : ''}
                                      {overdue ? ' · Overdue' : ''}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {projectRevisions.length > 0 && (
                            <p className="mt-3 text-xs text-neutral-500">
                              {projectRevisions.length} revision request(s) · latest: {projectRevisions[0].status}
                            </p>
                          )}
                        </article>
                      );
                    })}
                </div>
              )}

              {activeTab === 'deliverables' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A] pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-neutral-500">View:</span>
                      {[
                        { id: 'all' as const, label: 'All published', count: workspaceDeliverables.length },
                        {
                          id: 'awaiting' as const,
                          label: 'Awaiting your review',
                          count: awaitingDeliverables.length,
                        },
                        {
                          id: 'approved' as const,
                          label: 'Approved final outputs',
                          count: approvedDeliverables.length,
                        },
                        {
                          id: 'revisions' as const,
                          label: 'In revision / Rejected',
                          count: workspaceDeliverables.filter(
                            d =>
                              d.reviewStatus === 'Revision Requested' ||
                              d.reviewStatus === 'Revision In Progress' ||
                              d.reviewStatus === 'Rejected',
                          ).length,
                        },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setDeliverableStatusFilter(f.id)}
                          className={`rounded px-2.5 py-1 text-xs font-mono tabular-nums transition-colors ${
                            deliverableStatusFilter === f.id
                              ? 'border border-red-500/50 bg-red-950/40 text-white font-medium'
                              : 'border border-[#262626] bg-[#121212] text-neutral-400 hover:text-white'
                          }`}
                        >
                          {f.label} ({f.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {workspaceDeliverables.length === 0 ? (
                    <p className="text-sm text-neutral-500">No deliverables have been published for review yet.</p>
                  ) : filteredDeliverables.length === 0 ? (
                    <div className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-6 text-center space-y-2">
                      <p className="text-sm text-neutral-400">No deliverables match this filter.</p>
                      <button
                        type="button"
                        onClick={() => setDeliverableStatusFilter('all')}
                        className="rounded border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#555]"
                      >
                        Show all published deliverables
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredDeliverables.map(deliverable => {
                        const project = projectById.get(deliverable.projectId);
                        const feedback = feedbackByDeliverable[deliverable.id] || '';
                        const waiting =
                          deliverable.reviewStatus === 'Awaiting Review' ||
                          deliverable.reviewStatus === 'Revised - Awaiting Review';
                        const isApproved = deliverable.reviewStatus === 'Approved';
                        const deliverableRevisions = workspaceRevisions.filter(r => r.deliverableId === deliverable.id);
                        return (
                          <article
                            key={deliverable.id}
                            className={`rounded border p-4 bg-[#0C0C0C] ${
                              isApproved ? 'border-emerald-800/50' : 'border-[#1A1A1A]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[10px] uppercase tracking-widest text-neutral-500">
                                {project?.title || 'Project'}
                              </p>
                              <span className="rounded bg-[#1C1C1C] border border-[#333] px-2 py-0.5 text-[11px] font-mono text-neutral-300 tabular-nums">
                                v{deliverable.currentVersion || 1} (Latest)
                              </span>
                            </div>
                            <h3 className="mt-1 font-bold text-white">{deliverable.title}</h3>
                            {deliverable.description && (
                              <p className="mt-2 text-sm text-neutral-400">{deliverable.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded border px-2 py-0.5 text-xs font-medium ${
                                  isApproved
                                    ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                                    : deliverable.reviewStatus === 'Rejected'
                                      ? 'border-red-800/60 bg-red-950/30 text-red-300'
                                      : deliverable.reviewStatus === 'Revision Requested' ||
                                          deliverable.reviewStatus === 'Revision In Progress'
                                        ? 'border-amber-800/60 bg-amber-950/30 text-amber-300'
                                        : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                                }`}
                              >
                                {isApproved ? 'Final Approved Output' : deliverable.reviewStatus}
                              </span>
                              {deliverable.approvedAt && (
                                <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
                                  Approved {new Date(deliverable.approvedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {deliverable.fileUrl && (
                              <div className="mt-3 space-y-2">
                                {deliverable.fileType.startsWith('image/') && (
                                  <img
                                    src={deliverable.fileUrl}
                                    alt={deliverable.title}
                                    referrerPolicy="no-referrer"
                                    className="max-h-80 max-w-full rounded border border-[#292929] object-contain"
                                  />
                                )}
                                {deliverable.fileType.startsWith('video/') && (
                                  <video controls preload="metadata" src={deliverable.fileUrl} className="max-h-80 w-full rounded" />
                                )}
                                {deliverable.fileType.startsWith('audio/') && (
                                  <audio controls preload="metadata" src={deliverable.fileUrl} className="w-full" />
                                )}
                                {deliverable.fileType === 'application/pdf' && (
                                  <iframe
                                    title={`${deliverable.title} preview`}
                                    src={deliverable.fileUrl}
                                    className="h-80 w-full rounded border border-[#292929]"
                                  />
                                )}
                                <a
                                  href={deliverable.fileUrl}
                                  download={deliverable.fileName}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`inline-block text-sm underline ${
                                    isApproved ? 'text-emerald-300 font-medium' : 'text-red-300'
                                  }`}
                                >
                                  {isApproved
                                    ? `Download Final File · ${deliverable.fileName}`
                                    : `Download · ${deliverable.fileName}`}
                                </a>
                              </div>
                            )}
                            {deliverable.versions && deliverable.versions.length > 1 && (
                              <details className="mt-3 text-xs text-neutral-400">
                                <summary className="cursor-pointer">
                                  Previous version history ({deliverable.versions.length})
                                </summary>
                                <ol className="mt-2 space-y-1">
                                  {[...deliverable.versions].reverse().map(version => (
                                    <li key={version.version}>
                                      <a
                                        href={version.fileUrl}
                                        download={version.fileName}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-red-300 underline"
                                      >
                                        Version {version.version} · {version.fileName}
                                      </a>
                                      <span className="ml-2 text-neutral-500">{version.createdAt}</span>
                                    </li>
                                  ))}
                                </ol>
                              </details>
                            )}
                            {deliverableRevisions.length > 0 && (
                              <details className="mt-3 rounded border border-[#222] bg-[#101010] p-2.5 text-xs text-neutral-400">
                                <summary className="cursor-pointer font-semibold text-neutral-300">
                                  Revision requests for this deliverable ({deliverableRevisions.length})
                                </summary>
                                <div className="mt-2 space-y-2">
                                  {deliverableRevisions.map(rev => (
                                    <div key={rev.id} className="rounded border border-[#292929] bg-[#141414] p-2">
                                      <div className="flex justify-between text-[11px] font-mono text-neutral-500 tabular-nums">
                                        <span>Status: {rev.status}</span>
                                        <span>{new Date(rev.submittedAt).toLocaleDateString()}</span>
                                      </div>
                                      <p className="mt-1 text-neutral-300 font-normal">Feedback: {rev.feedback}</p>
                                      {rev.adminResponse && (
                                        <div className="mt-1.5 rounded bg-[#1C1C1C] p-2 text-xs text-emerald-300">
                                          <span className="font-semibold text-white">Production reply: </span>
                                          {rev.adminResponse}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                            {waiting && (
                              <div className="mt-4 space-y-2">
                                <textarea
                                  value={feedback}
                                  onChange={event =>
                                    setFeedbackByDeliverable(previous => ({
                                      ...previous,
                                      [deliverable.id]: event.target.value,
                                    }))
                                  }
                                  placeholder="Feedback (required to reject or request a revision)"
                                  rows={3}
                                  maxLength={5000}
                                  className="w-full rounded border border-[#333] bg-[#141414] p-2 text-sm text-white"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={submittingId === deliverable.id}
                                    onClick={() => void review(deliverable, 'approve')}
                                    className="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    disabled={submittingId === deliverable.id || !feedback.trim()}
                                    onClick={() => void review(deliverable, 'reject')}
                                    className="rounded border border-red-900 px-3 py-2 text-xs text-red-200 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    type="button"
                                    disabled={submittingId === deliverable.id || !feedback.trim()}
                                    onClick={() => void review(deliverable, 'revision')}
                                    className="rounded border border-[#444] px-3 py-2 text-xs text-white disabled:opacity-50"
                                  >
                                    Request revision
                                  </button>
                                </div>
                              </div>
                            )}
                            {deliverable.reviewStatus === 'Rejected' && (
                              <p className="mt-3 rounded border border-red-900/50 bg-red-950/20 p-2 text-xs text-red-200">
                                Rejected: {deliverable.feedback || 'No feedback was provided.'}
                              </p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'updates' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 border-b border-[#1A1A1A] pb-3">
                    {[
                      { id: 'all' as const, label: 'All Updates', count: recentActivity.length + recentRevisions.length },
                      { id: 'activity' as const, label: 'Production Activity', count: recentActivity.length },
                      { id: 'revisions' as const, label: 'Revision History', count: recentRevisions.length },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setUpdatesFilter(tab.id)}
                        className={`rounded px-3 py-1.5 text-xs font-mono tabular-nums ${
                          updatesFilter === tab.id
                            ? 'bg-white text-black font-semibold'
                            : 'border border-[#262626] bg-[#121212] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>

                  {workspaceActivity.length === 0 && workspaceRevisions.length === 0 && (
                    <p className="text-sm text-neutral-500">No client-visible updates yet.</p>
                  )}

                  {(updatesFilter === 'all' || updatesFilter === 'activity') &&
                    recentActivity.map(item => (
                      <article key={item.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4">
                        <p className="text-sm font-semibold text-white">{item.action}</p>
                        <p className="mt-1 text-sm text-neutral-400">{item.details}</p>
                        <p className="mt-2 text-[10px] font-mono text-neutral-500 tabular-nums">
                          {projectById.get(item.projectId)?.title || 'Project'} · {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </article>
                    ))}

                  {(updatesFilter === 'all' || updatesFilter === 'revisions') &&
                    recentRevisions.map(item => {
                      const project = projectById.get(item.projectId);
                      const deliverable = deliverables.find(d => d.id === item.deliverableId);
                      return (
                        <article key={item.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-white">Revision · {item.status}</span>
                            <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
                              {new Date(item.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-neutral-500">
                            {project?.title || 'Project'}
                            {deliverable ? ` · Deliverable: ${deliverable.title}` : ''}
                          </p>
                          <p className="mt-2 text-sm text-neutral-300">{item.feedback}</p>
                          {item.adminResponse ? (
                            <div className="mt-3 rounded border border-neutral-800 bg-[#141414] p-3 text-xs text-neutral-200">
                              <p className="font-semibold text-white">Production team response:</p>
                              <p className="mt-1 whitespace-pre-wrap">{item.adminResponse}</p>
                            </div>
                          ) : (
                            <p className="mt-2 text-[11px] text-neutral-500 italic">
                              Awaiting response from production team
                            </p>
                          )}
                        </article>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Creative Request Modal */}
      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          {requestSuccessSummary ? (
            <div className="w-full max-w-lg space-y-4 rounded-xl border border-emerald-900/60 bg-[#0C0C0C] p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-lg font-bold text-white">Creative Request Submitted</h2>
              <p className="text-xs text-neutral-400">Your request has been routed to the KeedoHub production team.</p>
              <div className="rounded border border-[#222] bg-[#141414] p-3 text-left text-xs space-y-1.5 text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Title:</span>
                  <span className="font-semibold text-white">{requestSuccessSummary.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Category:</span>
                  <span>{requestSuccessSummary.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Deadline:</span>
                  <span>{requestSuccessSummary.dueDate || 'Flexible'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Attachments:</span>
                  <span>{requestSuccessSummary.filesCount} file(s) attached</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRequestSuccessSummary(null);
                  setRequestOpen(false);
                  selectTab('requests');
                }}
                className="w-full rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
              >
                View in Creative Requests
              </button>
            </div>
          ) : (
            <form
              onSubmit={submitRequest}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3 rounded-xl border border-[#292929] bg-[#0C0C0C] p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Submit a production request</h2>
                  {requestLinkedProductTitle && (
                    <p className="text-[11px] font-mono text-[#FF1E1E] mt-0.5">
                      Customizing product: {requestLinkedProductTitle}
                    </p>
                  )}
                </div>
                <button type="button" onClick={() => setRequestOpen(false)} className="text-sm text-neutral-400 hover:text-white">
                  Close
                </button>
              </div>
              <input
                value={requestTitle}
                onChange={event => setRequestTitle(event.target.value)}
                maxLength={160}
                required
                placeholder="Project title"
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  aria-label="Requested service category"
                  value={requestCategory}
                  onChange={event => setRequestCategory(event.target.value)}
                  className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
                >
                  {availableRequestCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  value={requestIntendedUse}
                  onChange={event => setRequestIntendedUse(event.target.value)}
                  maxLength={140}
                  placeholder={experience.isArtist ? 'Release / rollout goal' : 'Usage / distribution channel'}
                  className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
                />
              </div>

              {experience.isArtist && studioReleases.length > 0 && (
                <select
                  aria-label="Link music release"
                  value={requestLinkedReleaseId}
                  onChange={event => setRequestLinkedReleaseId(event.target.value)}
                  className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
                >
                  <option value="">Optional: link to an existing Music Release…</option>
                  {studioReleases.map(rel => (
                    <option key={rel.id} value={rel.id}>
                      {rel.title} ({rel.type}{rel.releaseDate ? ` · ${rel.releaseDate}` : ''})
                    </option>
                  ))}
                </select>
              )}

              <div className="border border-[#242424] bg-[#111111] p-3 space-y-2">
                <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Target Platforms &amp; Formats
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {dynamicPlatformOptions.map(platform => {
                    const checked = requestTargetPlatforms.includes(platform);
                    return (
                      <label key={platform} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setRequestTargetPlatforms(prev =>
                              checked ? prev.filter(p => p !== platform) : [...prev, platform],
                            )
                          }
                          className="accent-[#FF1E1E]"
                        />
                        <span className="truncate">{platform}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="border border-[#242424] bg-[#111111] p-3 space-y-2">
                <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Requested Deliverables
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {dynamicDeliverableOptions.map(item => {
                    const checked = requestDeliverableTypes.includes(item);
                    return (
                      <label key={item} className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setRequestDeliverableTypes(prev =>
                              checked ? prev.filter(d => d !== item) : [...prev, item],
                            )
                          }
                          className="accent-[#FF1E1E]"
                        />
                        <span className="truncate">{item}</span>
                      </label>
                    );
                  })}
                </div>
                <input
                  value={requestPackagingSpec}
                  onChange={event => setRequestPackagingSpec(event.target.value)}
                  maxLength={140}
                  placeholder="Preferred deliverable formats (e.g. PNG, JPG, PDF, PSD, SVG)"
                  className="mt-1 w-full rounded border border-[#2C2C2C] bg-[#161616] px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <textarea
                value={requestDescription}
                onChange={event => setRequestDescription(event.target.value)}
                maxLength={5000}
                required
                rows={4}
                placeholder="Describe the creative direction, copy, messaging, and deliverables"
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
              />
              <textarea
                value={requestRequirements}
                onChange={event => setRequestRequirements(event.target.value)}
                maxLength={3000}
                rows={2}
                placeholder="Additional dimensions, specs, or branding notes"
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
              />
              <textarea
                value={requestReferences}
                onChange={event => setRequestReferences(event.target.value)}
                maxLength={2000}
                rows={2}
                placeholder="Reference links or visual examples"
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
              />
              <label className="block text-xs text-neutral-400">
                Reference files · up to 5 files, 100 MB total
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif,image/avif,audio/mpeg,audio/wav,audio/x-wav,audio/aac,audio/flac,audio/mp4,audio/m4a,audio/ogg,video/mp4,video/webm,video/quicktime,application/pdf,application/json,application/xml,application/zip,application/x-zip-compressed,font/ttf,font/otf,font/woff,font/woff2,text/plain,text/xml"
                  onChange={event => {
                    const files = Array.from(event.target.files || []);
                    const allowedType =
                      /^(image\/(jpeg|png|svg\+xml|webp|gif|avif)|audio\/(mpeg|wav|x-wav|aac|flac|mp4|m4a|ogg)|video\/(mp4|webm|quicktime)|application\/(pdf|json|xml|zip|x-zip-compressed|font-woff)|font\/(ttf|otf|woff|woff2)|text\/(plain|xml))$/;
                    const invalid =
                      files.length > 5 ||
                      files.some(file => file.size <= 0 || file.size >= 50 * 1024 * 1024 || !allowedType.test(file.type)) ||
                      files.reduce((total, file) => total + file.size, 0) > 100 * 1024 * 1024;
                    if (invalid) {
                      setRequestFiles([]);
                      setError('Choose up to five supported files, each under 50 MB and no more than 100 MB total.');
                      event.target.value = '';
                      return;
                    }
                    setError('');
                    setRequestFiles(files);
                  }}
                  className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-[#252525] file:px-3 file:py-2 file:text-xs file:text-white"
                />
              </label>
              {requestFiles.length > 0 && (
                <p className="text-[11px] text-neutral-500">{requestFiles.map(file => file.name).join(' · ')}</p>
              )}
              <label className="block text-xs text-neutral-400">
                Requested delivery date
                <input
                  type="date"
                  value={requestDueDate}
                  onChange={event => setRequestDueDate(event.target.value)}
                  className="mt-1 block rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
                />
              </label>
              <button
                disabled={requestSubmitting}
                className="w-full rounded bg-[#FF1E1E] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {requestSubmitting ? 'Submitting…' : 'Submit request'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientWorkspace;
