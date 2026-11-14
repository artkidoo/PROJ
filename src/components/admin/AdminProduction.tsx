import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  collectionGroup,
  deleteField,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Clock,
  ExternalLink,
  FileCheck2,
  FolderKanban,
  Inbox,
  Plus,
  Search,
  UserCheck,
  X,
} from 'lucide-react';
import {
  ClientProfile,
  ClientProject,
  ProductionActivity,
  ProductionDeliverable,
  ProductionDeliverableReviewStatus,
  ProductionDeliverableVersion,
  ProductionRevisionRequest,
  ProductionStage,
  ProductionTask,
  Workspace,
} from '../../types';
import { db, functions, storage } from '../../lib/firebase';
import { isAdminRecordActive } from '../../lib/firebaseAuth';
import {
  defaultCategoryForAudience,
  getCategoryOptionsForProjects,
  isValidCalendarDate,
  UNIFIED_PRODUCTION_CATEGORIES,
} from '../../lib/productionCategories';
import { ProductionNotificationCenter } from '../common/ProductionNotificationCenter';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import {
  importLegacyProduction,
  legacyClientAssignmentSuggestions,
  readLegacyProductionSnapshot,
  type LegacyImportResult,
  type LegacyProductionSnapshot,
} from '../../lib/productionImport';

const STAGES: ProductionStage[] = [
  'New Request',
  'Brief Approved',
  'In Production',
  'Internal QA',
  'Client Review',
  'Revision Required',
  'Ready for Delivery',
  'Delivered',
];

const IN_PRODUCTION_STAGES: ReadonlySet<ProductionStage> = new Set([
  'Brief Approved',
  'In Production',
  'Internal QA',
  'Ready for Delivery',
]);

const PRIORITIES = ['Low', 'Medium', 'Normal', 'High', 'Urgent'] as const;
const TASK_STATUSES = ['Todo', 'In Progress', 'In Review', 'Done'] as const;
const MAX_DELIVERABLE_SIZE = 50 * 1024 * 1024;

interface ServiceEnquiry {
  id: string;
  name: string;
  email: string;
  service: string;
  message: string;
  requirements?: string;
  references?: string;
  status: 'New' | 'In Review' | 'Contacted' | 'Closed' | 'Converted';
  adminNote?: string;
  projectId?: string;
  createdAt: string;
}

interface AdminAssigneeOption {
  uid: string;
  role: string;
  label: string;
  email: string;
  hasUserDoc: boolean;
}

interface TaskAdminDetails {
  assignee: string;
  assigneeUid: string;
  internalNotes: string;
}

interface ProjectAdminDetails {
  leadProducer: string;
  assignedTo: string;
  assignedToUid: string;
}

const ALLOWED_DELIVERABLE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif', 'image/avif',
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/flac', 'audio/mp4', 'audio/m4a', 'audio/ogg',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf', 'application/json', 'application/xml', 'application/zip',
  'application/x-zip-compressed', 'application/font-woff',
  'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
  'text/plain', 'text/xml',
]);

function statusForStage(stage: ProductionStage): ClientProject['status'] {
  if (stage === 'Delivered') return 'Completed';
  if (stage === 'New Request') return 'Pending';
  if (stage === 'Client Review' || stage === 'Internal QA') return 'Review';
  return 'In Progress';
}

function friendlyError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String(error.code);
    if (code.includes('permission-denied')) {
      return 'Permission denied. Confirm this account has an active Firestore admins record and valid references.';
    }
  }
  return error instanceof Error ? error.message : String(error);
}

function formatShortDate(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function stageBadgeClasses(stage?: ProductionStage): string {
  switch (stage) {
    case 'Delivered':
      return 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300';
    case 'Revision Required':
      return 'border-red-800/60 bg-red-950/30 text-red-300';
    case 'Client Review':
    case 'Internal QA':
      return 'border-amber-800/50 bg-amber-950/30 text-amber-300';
    case 'New Request':
      return 'border-neutral-700 bg-neutral-900 text-neutral-300';
    default:
      return 'border-neutral-700 bg-[#141414] text-neutral-200';
  }
}

function isWorkspaceLinkEligible(workspace: Workspace | undefined, clientUid: string): boolean {
  if (!workspace || workspace.ownerId !== clientUid) return false;
  return workspace.status === 'Active' || workspace.status === 'Onboarding';
}

export type AdminProductionSection = 'studio' | 'projects' | 'reviews' | 'requests';

export interface AdminProductionNavigateOptions {
  projectId?: string;
  stageFilter?: string;
  overdueOnly?: boolean;
  clearFilters?: boolean;
  tab?: 'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity';
}

export interface AdminProductionProps {
  section?: AdminProductionSection;
  embeddedMode?: boolean;
  initialProjectId?: string;
  initialTab?: 'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity';
  filterClientUid?: string;
  filterWorkspaceId?: string;
  initialStageFilter?: string;
  initialOverdueOnly?: boolean;
  onClearFilter?: () => void;
  onNavigateSection?: (section: AdminProductionSection, options?: AdminProductionNavigateOptions) => void;
  onOpenClient?: (clientUid: string) => void;
  onOpenWorkspace?: (workspaceId: string) => void;
}

export const AdminProduction: React.FC<AdminProductionProps> = ({
  section = 'studio',
  embeddedMode = false,
  initialProjectId = '',
  initialTab,
  filterClientUid = '',
  filterWorkspaceId = '',
  initialStageFilter = 'All',
  initialOverdueOnly = false,
  onClearFilter,
  onNavigateSection,
  onOpenClient,
  onOpenWorkspace,
}) => {
  const { firebaseUser } = useApp();
  const user = firebaseUser;

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [adminAssignees, setAdminAssignees] = useState<AdminAssigneeOption[]>([]);

  const [projectTasks, setProjectTasks] = useState<ProductionTask[]>([]);
  const [taskAdminDetails, setTaskAdminDetails] = useState<Record<string, TaskAdminDetails>>({});
  const [unassignedTasks, setUnassignedTasks] = useState<ProductionTask[]>([]);
  const [deliverables, setDeliverables] = useState<ProductionDeliverable[]>([]);
  const [allDeliverables, setAllDeliverables] = useState<ProductionDeliverable[]>([]);
  const [revisions, setRevisions] = useState<ProductionRevisionRequest[]>([]);
  const [allRevisions, setAllRevisions] = useState<ProductionRevisionRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, { id: string; content: string; authorName: string; createdAt: string }[]>>({});
  const [activity, setActivity] = useState<ProductionActivity[]>([]);
  const [serviceEnquiries, setServiceEnquiries] = useState<ServiceEnquiry[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);
  const [projectTab, setProjectTab] = useState<'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity'>('overview');
  const [saving, setSaving] = useState(false);

  // Filters
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'approved' | 'rejected' | 'revisions'>('pending');
  const [requestListFilter, setRequestListFilter] = useState<'awaiting' | 'accepted' | 'rejected' | 'all'>('awaiting');
  const [enquiryListFilter, setEnquiryListFilter] = useState<'open' | 'all'>('open');
  const [projectSearch, setProjectSearch] = useState('');
  const [localClientFilter, setLocalClientFilter] = useState(filterClientUid);
  const [localWorkspaceFilter, setLocalWorkspaceFilter] = useState(filterWorkspaceId);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState(initialStageFilter || 'All');
  const [overdueOnlyFilter, setOverdueOnlyFilter] = useState(initialOverdueOnly);

  // Create project modal & form
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectClientUid, setProjectClientUid] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState<string>(UNIFIED_PRODUCTION_CATEGORIES[1]);
  const [projectStage, setProjectStage] = useState<ProductionStage>('New Request');
  const [projectPriority, setProjectPriority] = useState<(typeof PRIORITIES)[number]>('Normal');
  const [projectLead, setProjectLead] = useState('');
  const [projectAssignedToUid, setProjectAssignedToUid] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [projectProgress, setProjectProgress] = useState(0);
  const [projectCategory, setProjectCategory] = useState<'artist' | 'label' | 'brand' | 'business'>('brand');
  const [createProjectError, setCreateProjectError] = useState('');

  // Task creation state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskAssigneeUid, setTaskAssigneeUid] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskInternalNote, setTaskInternalNote] = useState('');
  const [taskClientVisible, setTaskClientVisible] = useState(false);

  // Deliverable / Note / Revision state
  const [noteText, setNoteText] = useState('');
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [deliverableDescription, setDeliverableDescription] = useState('');
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [revisionResponses, setRevisionResponses] = useState<Record<string, string>>({});
  const [requestResponse, setRequestResponse] = useState('');
  const [showLegacyTools, setShowLegacyTools] = useState(false);

  // Project admin details
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<ProjectAdminDetails>({
    leadProducer: '',
    assignedTo: '',
    assignedToUid: '',
  });

  // Modal dialogs
  const [promptDialog, setPromptDialog] = useState<
    | { type: 'taskAssignment'; task: ProductionTask; assignee: string; assigneeUid: string }
    | { type: 'taskDeadline'; task: ProductionTask; dueDate: string }
    | {
        type: 'editTask';
        task: ProductionTask;
        title: string;
        description: string;
        internalNotes: string;
        dueDate: string;
        clientVisible: boolean;
      }
    | { type: 'addSubtask'; task: ProductionTask; title: string }
    | { type: 'editNote'; noteId: string; content: string }
    | { type: 'projectDeadline'; expectedDeliveryDate: string }
    | { type: 'projectTitle'; title: string }
    | { type: 'projectDescription'; description: string }
    | { type: 'projectPersonnel'; leadProducer: string; assignedTo: string; assignedToUid: string }
    | null
  >(null);
  const [dialogError, setDialogError] = useState('');
  const [dialogSaving, setDialogSaving] = useState(false);

  const clientsByUid = useMemo(
    () => new Map(clients.map(client => [client.uid, client])),
    [clients]
  );

  const workspacesById = useMemo(
    () => new Map(workspaces.map(workspace => [workspace.id, workspace])),
    [workspaces]
  );

  const adminAssigneesByUid = useMemo(
    () => new Map(adminAssignees.map(admin => [admin.uid, admin])),
    [adminAssignees]
  );

  const selectedProject = projects.find(project => project.id === selectedProjectId) || null;
  const selectedTasks = projectTasks;
  const todayIso = new Date().toISOString().slice(0, 10);

  const isProjectOverdue = (project: ClientProject): boolean =>
    Boolean(
      project.expectedDeliveryDate &&
      project.expectedDeliveryDate < todayIso &&
      project.stage !== 'Delivered'
    );

  const isTaskOverdue = (task: ProductionTask): boolean =>
    Boolean(task.dueDate && task.dueDate < todayIso && task.status !== 'Done');

  // Sync incoming filter props from AdminHQ
  useEffect(() => {
    setLocalClientFilter(filterClientUid);
  }, [filterClientUid]);

  useEffect(() => {
    setLocalWorkspaceFilter(filterWorkspaceId);
  }, [filterWorkspaceId]);

  useEffect(() => {
    if (initialStageFilter) setStageFilter(initialStageFilter);
  }, [initialStageFilter]);

  useEffect(() => {
    setOverdueOnlyFilter(initialOverdueOnly);
  }, [initialOverdueOnly]);

  useEffect(() => {
    setSelectedProjectId(initialProjectId || '');
    if (initialTab) {
      setProjectTab(initialTab);
    } else if (initialProjectId && section === 'reviews') {
      setProjectTab('deliverables');
    } else {
      setProjectTab('overview');
    }
  }, [section, initialProjectId, initialTab]);

  // Top-level Admin verification + Firestore subscriptions
  useEffect(() => {
    setIsAdmin(false);
    setLoading(true);
    setError('');
    setProjects([]);
    setClients([]);
    setWorkspaces([]);
    setAdminAssignees([]);
    setProjectTasks([]);
    setTaskAdminDetails({});
    setUnassignedTasks([]);
    setDeliverables([]);
    setAllDeliverables([]);
    setRevisions([]);
    setAllRevisions([]);
    setNotes({});
    setActivity([]);
    setServiceEnquiries([]);

    if (!user) {
      setLoading(false);
      setError('Sign in with an authorized admin account to manage production.');
      return;
    }

    let active = true;
    let unsubscribeData: (() => void) | undefined;

    const verifyAdmin = async () => {
      try {
        const adminSnapshot = await getDoc(doc(db, 'admins', user.uid));
        if (!active) return;
        if (!isAdminRecordActive(adminSnapshot)) {
          setLoading(false);
          setError('This account is not listed as an active platform admin.');
          return;
        }
        setIsAdmin(true);

        // Fetch verified active admin assignees & inspect whether their /users/{uid} docs exist
        void httpsCallable<Record<string, never>, { admins?: { uid: string; role: string }[] }>(
          functions,
          'adminListPlatformRoles'
        )({})
          .then(async response => {
            if (!active) return;
            const list = response.data?.admins || [];
            const resolved = await Promise.all(
              list.map(async entry => {
                let displayName = '';
                let email = '';
                let hasUserDoc = false;
                try {
                  const userSnap = await getDoc(doc(db, 'users', entry.uid));
                  if (userSnap.exists()) {
                    hasUserDoc = true;
                    displayName = String(userSnap.get('displayName') || '');
                    email = String(userSnap.get('email') || '');
                  }
                } catch {
                  hasUserDoc = false;
                }
                return {
                  uid: entry.uid,
                  role: entry.role || 'Platform Admin',
                  label: displayName || email || `${entry.role || 'Admin'} (${entry.uid.slice(0, 6)})`,
                  email,
                  hasUserDoc,
                } satisfies AdminAssigneeOption;
              })
            );
            if (active) setAdminAssignees(resolved);
          })
          .catch(() => {
            if (active) setAdminAssignees([]);
          });

        const unsubscribers = [
          onSnapshot(
            query(collection(db, 'clientProjects'), orderBy('updatedAt', 'desc')),
            snapshot => {
              setProjects(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ClientProject)));
              setLoading(false);
              setError('');
            },
            err => {
              setError(friendlyError(err));
              setLoading(false);
            }
          ),
          onSnapshot(
            collection(db, 'clientProfiles'),
            snapshot => {
              setClients(snapshot.docs.map(item => ({ uid: item.id, ...item.data() } as ClientProfile)));
            },
            err => setError(friendlyError(err))
          ),
          onSnapshot(
            collection(db, 'workspaces'),
            snapshot => {
              setWorkspaces(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Workspace)));
            },
            err => setError(friendlyError(err))
          ),
          onSnapshot(
            collection(db, 'productionTasks'),
            snapshot => {
              setUnassignedTasks(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionTask)));
            },
            err => setError(friendlyError(err))
          ),
          onSnapshot(
            collectionGroup(db, 'deliverables'),
            snapshot => {
              setAllDeliverables(
                snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionDeliverable))
              );
            },
            err => setError(friendlyError(err))
          ),
          onSnapshot(
            collectionGroup(db, 'revisionRequests'),
            snapshot => {
              setAllRevisions(
                snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionRevisionRequest))
              );
            },
            err => setError(friendlyError(err))
          ),
          onSnapshot(
            query(collection(db, 'serviceEnquiries'), orderBy('createdAt', 'desc'), limit(50)),
            snapshot => {
              setServiceEnquiries(
                snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ServiceEnquiry))
              );
            },
            err => setError(friendlyError(err))
          ),
        ];

        unsubscribeData = () => unsubscribers.forEach(unsubscribe => unsubscribe());
      } catch (err) {
        if (active) {
          setLoading(false);
          setError(friendlyError(err));
        }
      }
    };

    void verifyAdmin();

    return () => {
      active = false;
      unsubscribeData?.();
    };
  }, [user]);

  // Per-project Firestore subscriptions with strict reset on switch
  useEffect(() => {
    setProjectTasks([]);
    setTaskAdminDetails({});
    setDeliverables([]);
    setRevisions([]);
    setActivity([]);
    setSelectedProjectDetails({ leadProducer: '', assignedTo: '', assignedToUid: '' });

    if (!isAdmin || !selectedProjectId) {
      setProjectDetailLoading(false);
      return;
    }

    setProjectDetailLoading(true);
    const projectRef = doc(db, 'clientProjects', selectedProjectId);
    let active = true;

    void getDoc(doc(projectRef, 'admin', 'details'))
      .then(details => {
        if (!active) return;
        setSelectedProjectDetails({
          leadProducer: String(details.get('leadProducer') || ''),
          assignedTo: String(details.get('assignedTo') || ''),
          assignedToUid: String(details.get('assignedToUid') || ''),
        });
      })
      .catch(() => {
        if (active) {
          setSelectedProjectDetails({ leadProducer: '', assignedTo: '', assignedToUid: '' });
        }
      });

    const unsubs = [
      onSnapshot(
        collection(projectRef, 'tasks'),
        snapshot => {
          const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionTask));
          setProjectTasks(rows);
          setProjectDetailLoading(false);
          void Promise.all(
            snapshot.docs.map(async item => {
              try {
                const details = await getDoc(
                  doc(db, 'clientProjects', selectedProjectId, 'tasks', item.id, 'admin', 'details')
                );
                return [
                  item.id,
                  {
                    assignee: String(details.get('assignee') || ''),
                    assigneeUid: String(details.get('assigneeUid') || ''),
                    internalNotes: String(details.get('internalNotes') || ''),
                  },
                ] as const;
              } catch {
                return [
                  item.id,
                  { assignee: '', assigneeUid: '', internalNotes: '' },
                ] as const;
              }
            })
          ).then(entries => {
            if (active) setTaskAdminDetails(Object.fromEntries(entries));
          });
        },
        err => {
          setError(friendlyError(err));
          setProjectDetailLoading(false);
        }
      ),
      onSnapshot(
        collection(projectRef, 'deliverables'),
        snapshot => {
          setDeliverables(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionDeliverable)));
        },
        err => setError(friendlyError(err))
      ),
      onSnapshot(
        query(collection(projectRef, 'revisionRequests'), orderBy('createdAt', 'desc')),
        snapshot => {
          setRevisions(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionRevisionRequest)));
        },
        err => setError(friendlyError(err))
      ),
      onSnapshot(
        query(collection(projectRef, 'internalNotes'), orderBy('createdAt', 'desc')),
        snapshot => {
          setNotes(previous => ({
            ...previous,
            [selectedProjectId]: snapshot.docs.map(
              item =>
                ({
                  id: item.id,
                  ...item.data(),
                }) as { id: string; content: string; authorName: string; createdAt: string }
            ),
          }));
        },
        err => setError(friendlyError(err))
      ),
      onSnapshot(
        query(collection(projectRef, 'activity'), orderBy('createdAt', 'desc')),
        snapshot => {
          setActivity(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionActivity)));
        },
        err => setError(friendlyError(err))
      ),
    ];

    return () => {
      active = false;
      unsubs.forEach(unsubscribe => unsubscribe());
    };
  }, [isAdmin, selectedProjectId]);

  useEffect(() => {
    setProjectProgress(selectedProject?.progress || 0);
  }, [selectedProject?.id, selectedProject?.progress]);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0 && !projects.some(project => project.id === selectedProjectId)) {
      setSelectedProjectId('');
    }
  }, [projects, selectedProjectId]);

  // Enrich admin assignees with ClientProfile labels if user doc lacked displayName
  const resolvedAdminAssignees = useMemo<AdminAssigneeOption[]>(() => {
    return adminAssignees.map(option => {
      const profile = clientsByUid.get(option.uid);
      if (!profile) return option;
      return {
        ...option,
        label: profile.displayName || profile.organizationName || option.label,
        email: profile.email || option.email,
      };
    });
  }, [adminAssignees, clientsByUid]);

  const categoryOptions = useMemo(() => getCategoryOptionsForProjects(projects), [projects]);

  const effectiveClientFilter = localClientFilter;
  const effectiveWorkspaceFilter = localWorkspaceFilter;

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    return projects.filter(project => {
      if (effectiveClientFilter && project.clientUid !== effectiveClientFilter) return false;
      if (effectiveWorkspaceFilter && project.workspaceId !== effectiveWorkspaceFilter) return false;
      if (categoryFilter !== 'All' && (project.category || '') !== categoryFilter) return false;
      if (overdueOnlyFilter && !isProjectOverdue(project)) return false;

      if (stageFilter === 'Active') {
        if ((project.stage || 'New Request') === 'Delivered') return false;
      } else if (stageFilter !== 'All') {
        if ((project.stage || 'New Request') !== stageFilter) return false;
      }

      if (!q) return true;
      const client = clientsByUid.get(project.clientUid);
      const workspace = project.workspaceId ? workspacesById.get(project.workspaceId) : undefined;
      return (
        project.id.toLowerCase().includes(q) ||
        project.title.toLowerCase().includes(q) ||
        (project.category || '').toLowerCase().includes(q) ||
        (project.stage || '').toLowerCase().includes(q) ||
        (client?.displayName || '').toLowerCase().includes(q) ||
        (client?.organizationName || '').toLowerCase().includes(q) ||
        (client?.email || '').toLowerCase().includes(q) ||
        (workspace?.name || '').toLowerCase().includes(q) ||
        (workspace?.id || '').toLowerCase().includes(q)
      );
    });
  }, [
    projects,
    clientsByUid,
    workspacesById,
    effectiveClientFilter,
    effectiveWorkspaceFilter,
    categoryFilter,
    stageFilter,
    overdueOnlyFilter,
    projectSearch,
    todayIso,
  ]);

  const studioMetrics = useMemo(() => {
    const active = projects.filter(p => p.stage !== 'Delivered');
    const pendingRequests = projects.filter(
      p =>
        p.requestStatus === 'Pending' ||
        p.requestStatus === 'Clarification Requested' ||
        (!p.requestStatus && p.stage === 'New Request')
    );
    const inProduction = projects.filter(p =>
      IN_PRODUCTION_STAGES.has((p.stage || 'New Request') as ProductionStage)
    );
    const awaitingClientReview = projects.filter(p => p.stage === 'Client Review');
    const awaitingRevision = projects.filter(p => p.stage === 'Revision Required');
    const delivered = projects.filter(p => p.stage === 'Delivered');
    const overdue = projects.filter(p => isProjectOverdue(p));
    const openEnquiries = serviceEnquiries.filter(
      e => e.status !== 'Closed' && e.status !== 'Converted'
    );
    const deliverablesAwaitingReview = allDeliverables.filter(d =>
      ['Awaiting Review', 'Revised - Awaiting Review'].includes(d.reviewStatus)
    );
    const pendingRevisions = allRevisions.filter(r =>
      ['Submitted', 'In Progress'].includes(r.status)
    );

    const stageCounts = STAGES.map(stage => ({
      stage,
      count: projects.filter(p => (p.stage || 'New Request') === stage).length,
    }));

    return {
      total: projects.length,
      activeCount: active.length,
      pendingRequests,
      openEnquiries,
      inProductionCount: inProduction.length,
      awaitingClientReviewCount: awaitingClientReview.length,
      awaitingRevisionCount: awaitingRevision.length,
      deliveredCount: delivered.length,
      overdue,
      deliverablesAwaitingReview,
      pendingRevisions,
      stageCounts,
    };
  }, [projects, serviceEnquiries, allDeliverables, allRevisions, todayIso]);

  const recentProductionEvents = useMemo(() => {
    type ProductionEventItem = {
      id: string;
      kind: 'project' | 'deliverable' | 'revision' | 'enquiry';
      title: string;
      subtitle: string;
      timestamp: string;
      projectId?: string;
      targetTab?: 'overview' | 'deliverables' | 'revisions';
    };

    const items: ProductionEventItem[] = [];

    projects.slice(0, 12).forEach(project => {
      const client = clientsByUid.get(project.clientUid);
      items.push({
        id: `proj-${project.id}`,
        kind: 'project',
        title: project.title,
        subtitle: `${client?.displayName || client?.organizationName || project.clientUid} · ${project.stage || project.status} · ${project.category}`,
        timestamp: project.updatedAt || project.createdAt,
        projectId: project.id,
        targetTab: 'overview',
      });
    });

    allDeliverables.slice(0, 12).forEach(deliverable => {
      const proj = projects.find(p => p.id === deliverable.projectId);
      items.push({
        id: `del-${deliverable.id}`,
        kind: 'deliverable',
        title: `${deliverable.title} (${deliverable.reviewStatus})`,
        subtitle: `${proj?.title || 'Project'} · v${deliverable.currentVersion || 1}`,
        timestamp: deliverable.updatedAt || deliverable.createdAt,
        projectId: deliverable.projectId,
        targetTab: 'deliverables',
      });
    });

    allRevisions.slice(0, 12).forEach(revision => {
      const proj = projects.find(p => p.id === revision.projectId);
      items.push({
        id: `rev-${revision.id}`,
        kind: 'revision',
        title: `Revision ${revision.status} · ${proj?.title || 'Project'}`,
        subtitle: revision.feedback.slice(0, 120),
        timestamp: revision.updatedAt || revision.submittedAt || revision.createdAt,
        projectId: revision.projectId,
        targetTab: 'revisions',
      });
    });

    serviceEnquiries.slice(0, 8).forEach(enquiry => {
      items.push({
        id: `enq-${enquiry.id}`,
        kind: 'enquiry',
        title: `Public enquiry: ${enquiry.name} (${enquiry.service})`,
        subtitle: `${enquiry.email} · ${enquiry.status}`,
        timestamp: enquiry.createdAt,
      });
    });

    return items
      .filter(item => Boolean(item.timestamp))
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 12);
  }, [projects, allDeliverables, allRevisions, serviceEnquiries, clientsByUid]);

  const pendingCreativeRequests = studioMetrics.pendingRequests;
  const filteredCreativeRequests = useMemo(() => {
    switch (requestListFilter) {
      case 'awaiting':
        return pendingCreativeRequests;
      case 'accepted':
        return projects.filter(p => p.requestStatus === 'Accepted');
      case 'rejected':
        return projects.filter(p => p.requestStatus === 'Rejected');
      default:
        return projects.filter(p => Boolean(p.requestStatus) || p.stage === 'New Request');
    }
  }, [projects, pendingCreativeRequests, requestListFilter]);

  const filteredEnquiries = useMemo(() => {
    if (enquiryListFilter === 'open') {
      return serviceEnquiries.filter(e => e.status !== 'Closed' && e.status !== 'Converted');
    }
    return serviceEnquiries;
  }, [serviceEnquiries, enquiryListFilter]);

  const downloadRequestAttachment = async (
    attachment: NonNullable<ClientProject['requestAttachments']>[number]
  ) => {
    try {
      const url = await getDownloadURL(ref(storage, attachment.storagePath));
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (downloadError) {
      setError(friendlyError(downloadError));
    }
  };

  const navigateOrFilterProjects = (opts: AdminProductionNavigateOptions) => {
    if (onNavigateSection) {
      onNavigateSection('projects', opts);
      return;
    }
    if (opts.stageFilter !== undefined) setStageFilter(opts.stageFilter);
    if (opts.overdueOnly !== undefined) setOverdueOnlyFilter(opts.overdueOnly);
    if (opts.projectId) {
      setSelectedProjectId(opts.projectId);
      setProjectTab('overview');
    }
  };

  const clearAllProjectFilters = () => {
    setProjectSearch('');
    setLocalClientFilter('');
    setLocalWorkspaceFilter('');
    setCategoryFilter('All');
    setStageFilter('All');
    setOverdueOnlyFilter(false);
    onClearFilter?.();
  };

  const hasActiveFilters = Boolean(
    projectSearch.trim() ||
    effectiveClientFilter ||
    effectiveWorkspaceFilter ||
    categoryFilter !== 'All' ||
    stageFilter !== 'All' ||
    overdueOnlyFilter
  );

  const writeActivity = async (projectId: string, action: string, details: string, clientVisible = true) => {
    if (!user) throw new Error('You must be signed in.');
    await addDoc(collection(db, 'clientProjects', projectId, 'activity'), {
      projectId,
      actorUid: user.uid,
      actorName: user.displayName || user.email || 'Production admin',
      action,
      details,
      clientVisible,
      createdAt: new Date().toISOString(),
    });
  };

  const openCreateProjectModal = () => {
    const preselectedClient = effectiveClientFilter
      ? clientsByUid.get(effectiveClientFilter)
      : effectiveWorkspaceFilter
        ? clientsByUid.get(workspacesById.get(effectiveWorkspaceFilter)?.ownerId || '')
        : undefined;

    setCreateProjectError('');
    setProjectTitle('');
    setProjectDescription('');
    setProjectDeadline('');
    setProjectLead('');
    setProjectAssignedToUid('');
    setProjectStage('New Request');
    setProjectPriority('Normal');
    setProjectProgress(0);
    if (preselectedClient) {
      setProjectClientUid(preselectedClient.uid);
      const isArtist = preselectedClient.accountType === 'Artist';
      setProjectCategory(
        isArtist ? 'artist' : preselectedClient.accountType === 'Company' ? 'business' : 'brand'
      );
      setProjectType(defaultCategoryForAudience(isArtist));
    } else {
      setProjectClientUid('');
      setProjectCategory('brand');
      setProjectType(UNIFIED_PRODUCTION_CATEGORIES[1]);
    }
    setCreateProjectModalOpen(true);
  };

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateProjectError('');

    if (!projectTitle.trim() || !projectClientUid) {
      setCreateProjectError('Enter a project title and assign it to a client profile.');
      return;
    }
    if (!isValidCalendarDate(projectDeadline)) {
      setCreateProjectError('Expected delivery date must be a valid YYYY-MM-DD calendar date.');
      return;
    }
    const client = clientsByUid.get(projectClientUid);
    if (!client) {
      setCreateProjectError('The selected client profile could not be found.');
      return;
    }
    if (client.status === 'Suspended') {
      setCreateProjectError('Suspended client accounts cannot receive new active production projects until restored.');
      return;
    }

    const clientWorkspace = client.workspaceId ? workspacesById.get(client.workspaceId) : undefined;
    const attachWorkspaceId = isWorkspaceLinkEligible(clientWorkspace, client.uid)
      ? clientWorkspace!.id
      : undefined;

    // Only set assignedToUid if verified against /users/{uid}
    const verifiedAssignee = projectAssignedToUid
      ? resolvedAdminAssignees.find(a => a.uid === projectAssignedToUid && a.hasUserDoc)
      : undefined;

    setSaving(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const projectRef = doc(collection(db, 'clientProjects'));
      const stage = projectStage;
      const cleanDeadline = projectDeadline.trim();

      await setDoc(projectRef, {
        id: projectRef.id,
        clientUid: client.uid,
        ...(attachWorkspaceId ? { workspaceId: attachWorkspaceId } : {}),
        title: projectTitle.trim(),
        description: projectDescription.trim(),
        category: projectType.trim() || 'Other Creative Work',
        status: statusForStage(stage),
        progress: Math.max(0, Math.min(100, Number(projectProgress))),
        startDate: now.slice(0, 10),
        expectedDeliveryDate: cleanDeadline,
        createdAt: now,
        updatedAt: now,
        stage,
        priority: projectPriority,
        requestStatus: stage === 'New Request' ? 'Pending' : 'Accepted',
      });

      const resolvedLeadName =
        projectLead.trim() || verifiedAssignee?.label || '';

      await setDoc(doc(projectRef, 'admin', 'details'), {
        projectType: projectType.trim() || 'Other Creative Work',
        clientName: client.displayName || client.organizationName,
        clientCategory: projectCategory,
        leadProducer: resolvedLeadName,
        assignedTo: verifiedAssignee?.label || resolvedLeadName,
        assignedToUid: verifiedAssignee ? verifiedAssignee.uid : '',
        brief: { description: projectDescription.trim(), deliverableSpecs: '' },
      });

      await writeActivity(projectRef.id, 'Project created', 'Your production project is now open.');
      setCreateProjectModalOpen(false);
      setProjectTitle('');
      setProjectDescription('');
      setProjectDeadline('');
      setProjectLead('');
      setProjectAssignedToUid('');
      setSelectedProjectId(projectRef.id);
      setProjectTab('overview');
    } catch (err) {
      setCreateProjectError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const updateProject = async (patch: Partial<ClientProject>) => {
    if (!selectedProject) return;
    setSaving(true);
    setError('');
    try {
      const cleanPatch = { ...patch, updatedAt: new Date().toISOString() };
      await updateDoc(doc(db, 'clientProjects', selectedProject.id), cleanPatch);
      const details = patch.stage
        ? `Production stage changed to ${patch.stage}.`
        : patch.progress !== undefined
          ? `Project progress changed to ${patch.progress}%.`
          : patch.expectedDeliveryDate !== undefined
            ? `Project deadline updated to ${patch.expectedDeliveryDate || 'To be confirmed'}.`
            : patch.category !== undefined
              ? `Creative category updated to ${patch.category}.`
              : patch.priority !== undefined
                ? `Project priority updated to ${patch.priority}.`
                : 'Project details updated.';
      await writeActivity(selectedProject.id, 'Project updated', details, !('clientUid' in patch));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const reviewRequest = async (status: 'Accepted' | 'Rejected' | 'Clarification Requested') => {
    if (!selectedProject) return;
    if (status !== 'Accepted' && !requestResponse.trim()) {
      setError('Enter a message before requesting clarification or rejecting this request.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await httpsCallable(functions, 'reviewProductionRequest')({
        projectId: selectedProject.id,
        status,
        message: requestResponse.trim(),
      });
      setRequestResponse('');
    } catch (reviewError) {
      setError(friendlyError(reviewError));
    } finally {
      setSaving(false);
    }
  };

  const updateEnquiryStatus = async (enquiryId: string, status: Exclude<ServiceEnquiry['status'], 'Converted'>) => {
    if ((status as string) === 'Converted') return;
    setError('');
    try {
      await httpsCallable(functions, 'reviewPublicEnquiry')({ enquiryId, status });
    } catch (reviewError) {
      setError(friendlyError(reviewError));
    }
  };

  const convertEnquiry = async (enquiryId: string) => {
    setError('');
    try {
      const result = await httpsCallable<{ enquiryId: string }, { projectId: string }>(
        functions,
        'convertServiceEnquiryToProject'
      )({ enquiryId });
      setSelectedProjectId(result.data.projectId);
      setProjectTab('overview');
    } catch (convertError) {
      setError(friendlyError(convertError));
    }
  };

  const updatePrivateProjectDetails = async (patch: Record<string, unknown>) => {
    if (!selectedProject) return;
    setSaving(true);
    setError('');
    try {
      const detailsRef = doc(db, 'clientProjects', selectedProject.id, 'admin', 'details');
      const existing = await getDoc(detailsRef);
      await setDoc(detailsRef, { ...(existing.data() || {}), ...patch });
      await writeActivity(
        selectedProject.id,
        'Private production details updated',
        'Admin-only assignments or production details changed.',
        false
      );
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const updateStage = async (stage: ProductionStage) => {
    const progress = stage === 'Delivered' ? 100 : selectedProject?.progress || 0;
    await updateProject({
      stage,
      status: statusForStage(stage),
      progress,
      ...(stage === 'Delivered' ? { deliveredAt: new Date().toISOString() } : {}),
    });
  };

  const resolveSafeAssigneeUid = async (rawUid: string): Promise<string> => {
    const cleanUid = rawUid.trim();
    if (!cleanUid) return '';
    const known = adminAssigneesByUid.get(cleanUid);
    if (known?.hasUserDoc) return cleanUid;
    try {
      const snap = await getDoc(doc(db, 'users', cleanUid));
      if (snap.exists()) return cleanUid;
    } catch {
      // Fall through cleanly
    }
    throw new Error(
      `User profile /users/${cleanUid} does not exist yet. Select a verified admin or leave UID blank while keeping the assignee name.`
    );
  };

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProject || !taskTitle.trim()) return;
    if (!isValidCalendarDate(taskDeadline)) {
      setError('Task deadline must be a valid YYYY-MM-DD calendar date.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const safeAssigneeUid = await resolveSafeAssigneeUid(taskAssigneeUid);
      const taskRef = doc(collection(db, 'clientProjects', selectedProject.id, 'tasks'));
      const now = new Date().toISOString();
      const cleanDescription = taskDescription.trim();

      await setDoc(taskRef, {
        id: taskRef.id,
        projectId: selectedProject.id,
        clientUid: selectedProject.clientUid,
        title: taskTitle.trim(),
        ...(cleanDescription ? { description: cleanDescription } : {}),
        status: 'Todo',
        dueDate: taskDeadline.trim(),
        clientVisible: taskClientVisible,
        subtasks: [],
        createdAt: now,
        updatedAt: now,
      });

      await setDoc(doc(taskRef, 'admin', 'details'), {
        assignee: taskAssignee.trim(),
        assigneeUid: safeAssigneeUid,
        internalNotes: taskInternalNote.trim(),
      });

      await writeActivity(
        selectedProject.id,
        'Task created',
        `A task was added: ${taskTitle.trim()}.`,
        taskClientVisible
      );
      setTaskTitle('');
      setTaskAssignee('');
      setTaskAssigneeUid('');
      setTaskDeadline('');
      setTaskDescription('');
      setTaskInternalNote('');
      setTaskClientVisible(false);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (task: ProductionTask, patch: Partial<ProductionTask>) => {
    setError('');
    try {
      const taskRef = task.projectId
        ? doc(db, 'clientProjects', task.projectId, 'tasks', task.id)
        : doc(db, 'productionTasks', task.id);
      await updateDoc(taskRef, { ...patch, updatedAt: new Date().toISOString() });
      if (task.projectId) {
        await writeActivity(
          task.projectId,
          'Task updated',
          `${task.title}: ${patch.status || 'details updated'}.`,
          patch.clientVisible ?? task.clientVisible
        );
      }
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const updateTaskAssignment = (task: ProductionTask) => {
    const current = taskAdminDetails[task.id] || { assignee: '', assigneeUid: '', internalNotes: '' };
    setDialogError('');
    setPromptDialog({
      type: 'taskAssignment',
      task,
      assignee: current.assignee,
      assigneeUid: current.assigneeUid,
    });
  };

  const updateTaskDeadline = (task: ProductionTask) => {
    setDialogError('');
    setPromptDialog({
      type: 'taskDeadline',
      task,
      dueDate: task.dueDate || '',
    });
  };

  const openEditTaskModal = (task: ProductionTask) => {
    const current = taskAdminDetails[task.id] || { assignee: '', assigneeUid: '', internalNotes: '' };
    setDialogError('');
    setPromptDialog({
      type: 'editTask',
      task,
      title: task.title,
      description: task.description || '',
      internalNotes: current.internalNotes || '',
      dueDate: task.dueDate || '',
      clientVisible: task.clientVisible,
    });
  };

  const addSubtask = (task: ProductionTask) => {
    setDialogError('');
    setPromptDialog({
      type: 'addSubtask',
      task,
      title: '',
    });
  };

  const toggleSubtask = async (task: ProductionTask, subtaskId: string) => {
    await updateTask(task, {
      subtasks: (task.subtasks || []).map(subtask =>
        subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
      ),
    });
  };

  const addNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProject || !noteText.trim() || !user) return;
    setSaving(true);
    setError('');
    try {
      await addDoc(collection(db, 'clientProjects', selectedProject.id, 'internalNotes'), {
        content: noteText.trim(),
        authorUid: user.uid,
        authorName: user.displayName || user.email || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await writeActivity(
        selectedProject.id,
        'Internal note added',
        'An admin added a private production note.',
        false
      );
      setNoteText('');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const editNote = (noteId: string, currentContent: string) => {
    setDialogError('');
    setPromptDialog({
      type: 'editNote',
      noteId,
      content: currentContent,
    });
  };

  const closePromptDialog = () => {
    if (dialogSaving) return;
    setPromptDialog(null);
    setDialogError('');
  };

  const handlePromptSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!promptDialog) return;
    setDialogError('');
    setDialogSaving(true);
    try {
      if (promptDialog.type === 'taskAssignment') {
        const assignee = promptDialog.assignee.trim();
        const safeAssigneeUid = await resolveSafeAssigneeUid(promptDialog.assigneeUid);
        const task = promptDialog.task;
        const taskRef = task.projectId
          ? doc(db, 'clientProjects', task.projectId, 'tasks', task.id)
          : doc(db, 'productionTasks', task.id);
        await setDoc(
          doc(taskRef, 'admin', 'details'),
          {
            assignee,
            assigneeUid: safeAssigneeUid,
          },
          { merge: true }
        );
        setTaskAdminDetails(previous => ({
          ...previous,
          [task.id]: {
            internalNotes: previous[task.id]?.internalNotes || '',
            assignee,
            assigneeUid: safeAssigneeUid,
          },
        }));
      } else if (promptDialog.type === 'taskDeadline') {
        const dueDate = promptDialog.dueDate.trim();
        if (!isValidCalendarDate(dueDate)) {
          setDialogError('Deadline must be blank or a valid YYYY-MM-DD calendar date.');
          setDialogSaving(false);
          return;
        }
        await updateTask(promptDialog.task, { dueDate });
      } else if (promptDialog.type === 'editTask') {
        const cleanTitle = promptDialog.title.trim();
        const cleanDescription = promptDialog.description.trim();
        const cleanInternal = promptDialog.internalNotes.trim();
        const cleanDue = promptDialog.dueDate.trim();
        if (!cleanTitle || cleanTitle.length > 300) {
          setDialogError('Task title is required and must be 300 characters or fewer.');
          setDialogSaving(false);
          return;
        }
        if (cleanDescription.length > 5000) {
          setDialogError('Task notes must be 5000 characters or fewer.');
          setDialogSaving(false);
          return;
        }
        if (!isValidCalendarDate(cleanDue)) {
          setDialogError('Deadline must be blank or a valid YYYY-MM-DD calendar date.');
          setDialogSaving(false);
          return;
        }
        await updateTask(promptDialog.task, {
          title: cleanTitle,
          description: cleanDescription,
          dueDate: cleanDue,
          clientVisible: promptDialog.clientVisible,
        });
        const taskRef = promptDialog.task.projectId
          ? doc(db, 'clientProjects', promptDialog.task.projectId, 'tasks', promptDialog.task.id)
          : doc(db, 'productionTasks', promptDialog.task.id);
        await setDoc(
          doc(taskRef, 'admin', 'details'),
          { internalNotes: cleanInternal },
          { merge: true }
        );
        setTaskAdminDetails(previous => ({
          ...previous,
          [promptDialog.task.id]: {
            assignee: previous[promptDialog.task.id]?.assignee || '',
            assigneeUid: previous[promptDialog.task.id]?.assigneeUid || '',
            internalNotes: cleanInternal,
          },
        }));
      } else if (promptDialog.type === 'addSubtask') {
        const cleanTitle = promptDialog.title.trim();
        if (!cleanTitle) {
          setDialogError('Subtask title is required.');
          setDialogSaving(false);
          return;
        }
        await updateTask(promptDialog.task, {
          subtasks: [
            ...(promptDialog.task.subtasks || []),
            { id: crypto.randomUUID(), title: cleanTitle, completed: false },
          ],
        });
      } else if (promptDialog.type === 'editNote') {
        const cleanContent = promptDialog.content.trim();
        if (!cleanContent) {
          setDialogError('Internal note content cannot be empty.');
          setDialogSaving(false);
          return;
        }
        if (!selectedProject) {
          setDialogError('Select a project first.');
          setDialogSaving(false);
          return;
        }
        await updateDoc(doc(db, 'clientProjects', selectedProject.id, 'internalNotes', promptDialog.noteId), {
          content: cleanContent,
          updatedAt: new Date().toISOString(),
        });
        await writeActivity(selectedProject.id, 'Internal note updated', 'An admin edited a private production note.', false);
      } else if (promptDialog.type === 'projectDeadline') {
        if (!selectedProject) return;
        const cleanDate = promptDialog.expectedDeliveryDate.trim();
        if (!isValidCalendarDate(cleanDate)) {
          setDialogError('Expected delivery date must be blank or a valid YYYY-MM-DD calendar date.');
          setDialogSaving(false);
          return;
        }
        await updateProject({ expectedDeliveryDate: cleanDate });
      } else if (promptDialog.type === 'projectTitle') {
        if (!selectedProject) return;
        const cleanTitle = promptDialog.title.trim();
        if (!cleanTitle || cleanTitle.length > 160) {
          setDialogError('Project title is required and must be 160 characters or fewer.');
          setDialogSaving(false);
          return;
        }
        await updateProject({ title: cleanTitle });
      } else if (promptDialog.type === 'projectDescription') {
        if (!selectedProject) return;
        const cleanDescription = promptDialog.description.trim();
        if (cleanDescription.length > 5000) {
          setDialogError('Description must be 5000 characters or fewer.');
          setDialogSaving(false);
          return;
        }
        await updateProject({ description: cleanDescription });
      } else if (promptDialog.type === 'projectPersonnel') {
        if (!selectedProject) return;
        const cleanLead = promptDialog.leadProducer.trim();
        const cleanAssignedTo = promptDialog.assignedTo.trim();
        const safeAssignedUid = await resolveSafeAssigneeUid(promptDialog.assignedToUid);
        await updatePrivateProjectDetails({
          leadProducer: cleanLead,
          assignedTo: cleanAssignedTo,
          assignedToUid: safeAssignedUid,
        });
        setSelectedProjectDetails({
          leadProducer: cleanLead,
          assignedTo: cleanAssignedTo,
          assignedToUid: safeAssignedUid,
        });
      }
      setPromptDialog(null);
    } catch (err) {
      setDialogError(friendlyError(err));
    } finally {
      setDialogSaving(false);
    }
  };

  const uploadDeliverable = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProject || !deliverableTitle.trim() || !deliverableFile || !user) {
      setError('Enter a deliverable title and choose a file.');
      return;
    }
    if (!ALLOWED_DELIVERABLE_TYPES.has(deliverableFile.type)) {
      setError('This file type is not allowed. Choose a supported image, audio, video, document, or font file.');
      return;
    }
    if (deliverableFile.size >= MAX_DELIVERABLE_SIZE) {
      setError('Deliverable files must be smaller than 50 MB.');
      return;
    }
    setSaving(true);
    setError('');
    const deliverableRef = doc(collection(db, 'clientProjects', selectedProject.id, 'deliverables'));
    const safeFileName = deliverableFile.name.replace(/[\\/]/g, '_');
    const storagePath = `production/${selectedProject.id}/deliverables/${deliverableRef.id}/${safeFileName}`;
    try {
      const uploaded = await uploadBytes(ref(storage, storagePath), deliverableFile, {
        contentType: deliverableFile.type || 'application/octet-stream',
      });
      const fileUrl = await getDownloadURL(uploaded.ref);
      const now = new Date().toISOString();
      await setDoc(deliverableRef, {
        id: deliverableRef.id,
        projectId: selectedProject.id,
        clientUid: selectedProject.clientUid,
        title: deliverableTitle.trim(),
        description: deliverableDescription.trim(),
        fileUrl,
        storagePath,
        fileName: deliverableFile.name,
        fileType: deliverableFile.type || 'application/octet-stream',
        fileSize: deliverableFile.size,
        isClientPublished: false,
        reviewStatus: 'Draft',
        createdAt: now,
        updatedAt: now,
        uploadedBy: user.uid,
        currentVersion: 1,
        versions: [
          {
            version: 1,
            fileUrl,
            storagePath,
            fileName: deliverableFile.name,
            fileType: deliverableFile.type || 'application/octet-stream',
            fileSize: deliverableFile.size,
            uploadedBy: user.uid,
            createdAt: now,
          } satisfies ProductionDeliverableVersion,
        ],
      });
      await writeActivity(
        selectedProject.id,
        'Deliverable uploaded',
        `${deliverableTitle.trim()} was added to the project.`,
        false
      );
      setDeliverableTitle('');
      setDeliverableDescription('');
      setDeliverableFile(null);
      event.currentTarget.reset();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const uploadDeliverableVersion = async (deliverable: ProductionDeliverable, file: File) => {
    if (!user || !ALLOWED_DELIVERABLE_TYPES.has(file.type) || file.size >= MAX_DELIVERABLE_SIZE) {
      setError('Choose a supported file smaller than 50 MB.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const versions = deliverable.versions || [];
      const versionNumber =
        Math.max(deliverable.currentVersion || 0, ...versions.map(version => version.version)) + 1;
      const safeFileName = file.name.replace(/[\\/]/g, '_');
      const storagePath = `production/${deliverable.projectId}/deliverables/${deliverable.id}/v${versionNumber}/${safeFileName}`;
      const uploaded = await uploadBytes(ref(storage, storagePath), file, {
        contentType: file.type || 'application/octet-stream',
      });
      const fileUrl = await getDownloadURL(uploaded.ref);
      const now = new Date().toISOString();
      const version: ProductionDeliverableVersion = {
        version: versionNumber,
        fileUrl,
        storagePath,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadedBy: user.uid,
        createdAt: now,
      };
      await updateDoc(doc(db, 'clientProjects', deliverable.projectId, 'deliverables', deliverable.id), {
        fileUrl,
        storagePath,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        currentVersion: versionNumber,
        versions: [...versions, version],
        reviewStatus: deliverable.isClientPublished ? 'Revised - Awaiting Review' : 'Draft',
        feedback: deleteField(),
        approvedAt: deleteField(),
        approvedBy: deleteField(),
        rejectedAt: deleteField(),
        rejectedBy: deleteField(),
        updatedAt: now,
      });
      await writeActivity(
        deliverable.projectId,
        'Deliverable version uploaded',
        `${deliverable.title} version ${versionNumber} was uploaded.`,
        deliverable.isClientPublished
      );
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const publishDeliverable = async (deliverable: ProductionDeliverable) => {
    try {
      const published = !deliverable.isClientPublished;
      await updateDoc(doc(db, 'clientProjects', deliverable.projectId, 'deliverables', deliverable.id), {
        isClientPublished: published,
        reviewStatus: published ? 'Awaiting Review' : 'Draft',
        updatedAt: new Date().toISOString(),
      });
      await writeActivity(
        deliverable.projectId,
        published ? 'Deliverable published' : 'Deliverable unpublished',
        `${deliverable.title} was ${published ? 'published to' : 'removed from'} the client workspace.`
      );
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const updateDeliverableReviewStatus = async (
    deliverable: ProductionDeliverable,
    reviewStatus: ProductionDeliverableReviewStatus
  ) => {
    try {
      await updateDoc(doc(db, 'clientProjects', deliverable.projectId, 'deliverables', deliverable.id), {
        reviewStatus,
        updatedAt: new Date().toISOString(),
        ...(reviewStatus === 'Approved' ? { approvedAt: new Date().toISOString(), approvedBy: user?.displayName || user?.email || 'Platform Admin' } : {}),
        ...(reviewStatus === 'Rejected' ? { rejectedAt: new Date().toISOString(), rejectedBy: user?.displayName || user?.email || 'Platform Admin' } : {}),
      });
      await writeActivity(
        deliverable.projectId,
        'Deliverable status updated',
        `${deliverable.title} review status set to ${reviewStatus}.`,
        deliverable.isClientPublished
      );
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const updateRevision = async (
    revision: ProductionRevisionRequest,
    status: ProductionRevisionRequest['status']
  ) => {
    try {
      await updateDoc(doc(db, 'clientProjects', revision.projectId, 'revisionRequests', revision.id), {
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'Completed' ? { completedAt: new Date().toISOString() } : {}),
      });
      await writeActivity(revision.projectId, 'Revision updated', `Revision status changed to ${status}.`, true);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const respondToRevision = async (revision: ProductionRevisionRequest) => {
    const response = revisionResponses[revision.id]?.trim();
    if (!response) {
      setError('Enter a response before sending it to the client.');
      return;
    }
    try {
      await updateDoc(doc(db, 'clientProjects', revision.projectId, 'revisionRequests', revision.id), {
        adminResponse: response.slice(0, 5000),
        updatedAt: new Date().toISOString(),
      });
      await writeActivity(
        revision.projectId,
        'Revision response sent',
        'The production team responded to a revision request.'
      );
      setRevisionResponses(previous => ({ ...previous, [revision.id]: '' }));
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-24 bg-[#111] border border-[#1E1E1E]" />
          ))}
        </div>
        <div className="h-48 bg-[#111] border border-[#1E1E1E]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-300">
        {error || 'Admin access required.'}
      </div>
    );
  }

  const currentNotes = selectedProjectId ? notes[selectedProjectId] || [] : [];
  const filteredClientProfile = effectiveClientFilter ? clientsByUid.get(effectiveClientFilter) : undefined;
  const filteredWorkspaceRecord = effectiveWorkspaceFilter
    ? workspacesById.get(effectiveWorkspaceFilter)
    : undefined;

  const isStandaloneStudio = section === 'studio' && !onNavigateSection;
  const showStudioOverview = section === 'studio';
  const showEnquiries = section === 'requests' || isStandaloneStudio;
  const showCreativeRequestsList = section === 'requests';
  const showReviewQueue = section === 'reviews' || isStandaloneStudio;
  const showProjectWorkspace =
    section === 'projects' ||
    isStandaloneStudio ||
    ((section === 'reviews' || section === 'requests') && Boolean(selectedProject));

  const selectedProjectClient = selectedProject ? clientsByUid.get(selectedProject.clientUid) : undefined;
  const selectedProjectWorkspace = selectedProject?.workspaceId
    ? workspacesById.get(selectedProject.workspaceId)
    : undefined;
  const selectedClientPrimaryWorkspace = selectedProjectClient?.workspaceId
    ? workspacesById.get(selectedProjectClient.workspaceId)
    : undefined;
  const canLinkSelectedClientWorkspace = Boolean(
    selectedProject &&
    !selectedProject.workspaceId &&
    selectedClientPrimaryWorkspace &&
    isWorkspaceLinkEligible(selectedClientPrimaryWorkspace, selectedProject.clientUid)
  );

  const selectedCreateClient = projectClientUid ? clientsByUid.get(projectClientUid) : undefined;
  const selectedCreateWorkspace = selectedCreateClient?.workspaceId
    ? workspacesById.get(selectedCreateClient.workspaceId)
    : undefined;

  const visibleMilestoneTasks = selectedTasks.filter(task => task.clientVisible);
  const doneTasksCount = selectedTasks.filter(task => task.status === 'Done').length;
  const overdueTasksCount = selectedTasks.filter(task => isTaskOverdue(task)).length;

  return (
    <div className="space-y-6">
      {!embeddedMode && (
        <header className="flex flex-col gap-3 border-b border-[#1C1C1C] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-mono uppercase tracking-widest text-red-400">
              Production Center
            </p>
            <h1 className="text-2xl font-black text-white">Production Studio</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Unified creative production across artists, brands, and businesses — requests, tasks, deliverables, and reviews.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono tabular-nums text-neutral-500">
              {projects.length} projects · {clients.length} client profiles
            </span>
            {user && (
              <ProductionNotificationCenter
                uid={user.uid}
                onSelectNotification={notification => {
                  if (notification.projectId) {
                    setSelectedProjectId(notification.projectId);
                    if (notification.type === 'deliverable' || notification.type === 'review') {
                      setProjectTab('deliverables');
                    } else if (notification.type === 'revision') {
                      setProjectTab('revisions');
                    } else if (notification.type === 'assignment' || notification.type === 'task') {
                      setProjectTab('tasks');
                    } else {
                      setProjectTab('overview');
                    }
                  }
                }}
              />
            )}
          </div>
        </header>
      )}

      {error && (
        <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300 flex items-start justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error" className="text-red-300 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ============================================================
          SECTION: PRODUCTION STUDIO OVERVIEW
         ============================================================ */}
      {showStudioOverview && (
        <div className="space-y-6">
          {/* Header Actions Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[#1E1E1E] bg-[#0C0C0C] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Clapperboard size={15} className="text-[#FF1E1E]" />
              <span>
                Live creative operations snapshot across <strong className="text-white">{projects.length}</strong> production project{projects.length === 1 ? '' : 's'}.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreateProjectModal}
                className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
              >
                <Plus size={13} />
                <span>New Project</span>
              </button>
              {onNavigateSection && (
                <button
                  type="button"
                  onClick={() => onNavigateSection('projects', { clearFilters: true })}
                  className="inline-flex items-center gap-1.5 border border-[#2C2C2C] bg-[#141414] px-3 py-1.5 text-xs text-neutral-200 hover:border-[#444]"
                >
                  <FolderKanban size={13} />
                  <span>Open Project Directory</span>
                </button>
              )}
            </div>
          </div>

          {/* 7 Production KPI Metrics */}
          <section aria-label="Production studio metrics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <button
              type="button"
              onClick={() => navigateOrFilterProjects({ stageFilter: 'Active', overdueOnly: false })}
              className="text-left border border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333] p-4 transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Active Projects</p>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">{studioMetrics.activeCount}</p>
              <p className="mt-1 text-[11px] text-neutral-500 font-mono tabular-nums">{studioMetrics.total} total</p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateSection) onNavigateSection('requests');
              }}
              className="text-left border border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333] p-4 transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Requests & Enquiries</p>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">
                {studioMetrics.pendingRequests.length + studioMetrics.openEnquiries.length}
              </p>
              <p className="mt-1 text-[11px] text-amber-400 font-mono tabular-nums">
                {studioMetrics.pendingRequests.length} briefs · {studioMetrics.openEnquiries.length} enquiries
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigateOrFilterProjects({ stageFilter: 'In Production', overdueOnly: false })}
              className="text-left border border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333] p-4 transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">In Production</p>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-white">{studioMetrics.inProductionCount}</p>
              <p className="mt-1 text-[11px] text-neutral-500">Approved, studio & QA</p>
            </button>

            <button
              type="button"
              onClick={() => navigateOrFilterProjects({ stageFilter: 'Client Review', overdueOnly: false })}
              className="text-left border border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333] p-4 transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Client Review</p>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-300">
                {studioMetrics.awaitingClientReviewCount}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500 font-mono tabular-nums">
                {studioMetrics.deliverablesAwaitingReview.length} deliverables pending
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigateOrFilterProjects({ stageFilter: 'Revision Required', overdueOnly: false })}
              className="text-left border border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333] p-4 transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Awaiting Revision</p>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-red-300">
                {studioMetrics.awaitingRevisionCount}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500 font-mono tabular-nums">
                {studioMetrics.pendingRevisions.length} revision threads
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigateOrFilterProjects({ stageFilter: 'Delivered', overdueOnly: false })}
              className="text-left border border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333] p-4 transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Delivered</p>
              <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-300">
                {studioMetrics.deliveredCount}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">Completed deliveries</p>
            </button>

            <button
              type="button"
              onClick={() => navigateOrFilterProjects({ stageFilter: 'All', overdueOnly: true })}
              className={`text-left border p-4 transition-colors ${
                studioMetrics.overdue.length > 0
                  ? 'border-red-900/60 bg-red-950/15 hover:border-red-700'
                  : 'border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#333]'
              }`}
            >
              <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Overdue</p>
              <p
                className={`mt-2 text-2xl font-bold font-mono tabular-nums ${
                  studioMetrics.overdue.length > 0 ? 'text-[#FF1E1E]' : 'text-neutral-300'
                }`}
              >
                {studioMetrics.overdue.length}
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">Past delivery date</p>
            </button>
          </section>

          {/* Pipeline Breakdown by Stage */}
          <section className="border border-[#1E1E1E] bg-[#0C0C0C] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Production Pipeline by Stage</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Click any stage to view matching projects in the directory.
                </p>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                8 enforced Firestore stages
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {studioMetrics.stageCounts.map(({ stage, count }) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => navigateOrFilterProjects({ stageFilter: stage, overdueOnly: false })}
                  className="border border-[#1E1E1E] bg-[#111] hover:border-[#FF1E1E]/60 p-3 text-left transition-colors"
                >
                  <p className="text-[10px] font-mono text-neutral-400 truncate" title={stage}>
                    {stage}
                  </p>
                  <p className="mt-1.5 text-lg font-bold font-mono tabular-nums text-white">{count}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Studio Queues & Recent Production Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Immediate Attention Queues */}
            <section className="border border-[#1E1E1E] bg-[#0C0C0C]">
              <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white">Attention & Deadlines Queue</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Overdue deliveries, revision blockers, and briefs awaiting triage.
                  </p>
                </div>
                {onNavigateSection && (
                  <button
                    type="button"
                    onClick={() => onNavigateSection('requests')}
                    className="text-xs text-[#FF1E1E] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Requests</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#171717]">
                {studioMetrics.overdue.length === 0 &&
                studioMetrics.pendingRequests.length === 0 &&
                studioMetrics.awaitingRevisionCount === 0 ? (
                  <p className="p-6 text-xs text-neutral-500">
                    No overdue projects, unreviewed client briefs, or revision blockers right now.
                  </p>
                ) : (
                  <>
                    {studioMetrics.overdue.slice(0, 4).map(project => {
                      const client = clientsByUid.get(project.clientUid);
                      return (
                        <button
                          key={`overdue-${project.id}`}
                          type="button"
                          onClick={() =>
                            navigateOrFilterProjects({
                              projectId: project.id,
                              stageFilter: 'All',
                              overdueOnly: true,
                            })
                          }
                          className="w-full px-5 py-3 text-left hover:bg-[#121212] flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {project.title}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {client?.displayName || client?.organizationName || project.clientUid} · {project.stage || project.status}
                            </p>
                          </div>
                          <span className="shrink-0 inline-flex items-center gap-1 border border-red-900/60 bg-red-950/30 px-2 py-0.5 text-[10px] font-mono text-red-300">
                            <AlertTriangle size={10} />
                            Due {project.expectedDeliveryDate}
                          </span>
                        </button>
                      );
                    })}

                    {studioMetrics.pendingRequests.slice(0, 4).map(request => {
                      const client = clientsByUid.get(request.clientUid);
                      return (
                        <button
                          key={`req-${request.id}`}
                          type="button"
                          onClick={() => {
                            if (onNavigateSection) {
                              onNavigateSection('requests', { projectId: request.id });
                            } else {
                              setSelectedProjectId(request.id);
                              setProjectTab('overview');
                            }
                          }}
                          className="w-full px-5 py-3 text-left hover:bg-[#121212] flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              Brief: {request.title}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {client?.displayName || client?.organizationName || request.clientUid} · {request.category}
                            </p>
                          </div>
                          <span className="shrink-0 font-mono text-[10px] text-amber-300 border border-amber-900/50 bg-amber-950/20 px-2 py-0.5">
                            {request.requestStatus || 'Pending review'}
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </section>

            {/* Recent Production Activity */}
            <section className="border border-[#1E1E1E] bg-[#0C0C0C]">
              <div className="px-5 py-4 border-b border-[#1E1E1E] flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white">Recent Production Activity</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Derived live from recent Firestore project, deliverable, revision, and enquiry timestamps.
                  </p>
                </div>
                {onNavigateSection && (
                  <button
                    type="button"
                    onClick={() => onNavigateSection('reviews')}
                    className="text-xs text-[#FF1E1E] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Review Queue</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#171717]">
                {recentProductionEvents.length === 0 ? (
                  <p className="p-6 text-xs text-neutral-500">
                    No production projects, deliverables, revisions, or enquiries recorded yet.
                  </p>
                ) : (
                  recentProductionEvents.map(event => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        if (event.kind === 'enquiry') {
                          if (onNavigateSection) onNavigateSection('requests');
                        } else if (event.projectId) {
                          if (onNavigateSection) {
                            onNavigateSection(
                              event.kind === 'deliverable' || event.kind === 'revision' ? 'reviews' : 'projects',
                              { projectId: event.projectId }
                            );
                          } else {
                            setSelectedProjectId(event.projectId);
                            setProjectTab(event.targetTab || 'overview');
                          }
                        }
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-[#121212] flex items-start justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{event.title}</p>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">{event.subtitle}</p>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-neutral-500">
                        {formatShortDate(event.timestamp)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Collapsible Legacy Browser Data Import Utility */}
          <div className="border border-[#1E1E1E] bg-[#0C0C0C]">
            <button
              type="button"
              onClick={() => setShowLegacyTools(v => !v)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <span className="font-mono uppercase tracking-wider">
                Legacy Browser Production Import Utility
              </span>
              {showLegacyTools ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showLegacyTools && (
              <div className="border-t border-[#1A1A1A] p-4">
                <LegacyImportPanel clients={clients} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION: CREATIVE REQUESTS & PUBLIC ENQUIRIES
         ============================================================ */}
      {showCreativeRequestsList && (
        <section className="rounded border border-[#292929] bg-[#0C0C0C] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Inbox size={15} className="text-[#FF1E1E]" />
                <span>Client Creative Requests</span>
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Submitted client briefs. Review, ask for clarification, reject, or accept into production.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['awaiting', `Awaiting review · ${pendingCreativeRequests.length}`],
                  ['accepted', `Accepted · ${projects.filter(p => p.requestStatus === 'Accepted').length}`],
                  ['rejected', `Rejected · ${projects.filter(p => p.requestStatus === 'Rejected').length}`],
                  ['all', `All · ${projects.filter(p => Boolean(p.requestStatus) || p.stage === 'New Request').length}`],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRequestListFilter(tab)}
                  className={`border px-2.5 py-1 text-[11px] font-mono tabular-nums transition-colors ${
                    requestListFilter === tab
                      ? 'border-[#FF1E1E] bg-[#1A0E0E] text-white'
                      : 'border-[#2B2B2B] bg-[#121212] text-neutral-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredCreativeRequests.length === 0 ? (
            <p className="py-4 text-sm text-neutral-500">No client creative requests match this filter.</p>
          ) : (
            <div className="space-y-2.5">
              {filteredCreativeRequests.map(request => {
                const client = clientsByUid.get(request.clientUid);
                const workspace = request.workspaceId ? workspacesById.get(request.workspaceId) : undefined;
                const isSelected = selectedProjectId === request.id;
                const attachmentCount = request.requestAttachments?.length || 0;

                return (
                  <div
                    key={request.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border p-3.5 transition-colors ${
                      isSelected
                        ? 'border-[#FF1E1E]/60 bg-[#171010]'
                        : 'border-[#242424] bg-[#101010] hover:border-[#3A3A3A]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(request.id);
                        setProjectTab('overview');
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">{request.title}</span>
                        <span className="border border-[#2C2C2C] bg-[#161616] px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                          {request.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">
                        Client: <strong className="text-neutral-200">{client?.displayName || client?.organizationName || request.clientUid}</strong>
                        {workspace && (
                          <>
                            {' · '}Workspace: <strong className="text-neutral-200">{workspace.name}</strong>
                          </>
                        )}
                        {' · '}Submitted {formatShortDate(request.createdAt)}
                        {attachmentCount > 0 && ` · ${attachmentCount} reference file${attachmentCount === 1 ? '' : 's'}`}
                      </p>
                      {request.description && (
                        <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2">{request.description}</p>
                      )}
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-mono text-[11px] px-2 py-0.5 border ${
                          request.requestStatus === 'Accepted'
                            ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300'
                            : request.requestStatus === 'Rejected'
                              ? 'border-red-900/50 bg-red-950/30 text-red-300'
                              : 'border-amber-800/50 bg-amber-950/30 text-amber-300'
                        }`}
                      >
                        {request.requestStatus || 'Pending review'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(request.id);
                          setProjectTab('overview');
                        }}
                        className="border border-[#333] bg-[#141414] px-2.5 py-1 text-xs text-neutral-200 hover:border-white"
                      >
                        Inspect brief
                      </button>
                      {onNavigateSection && (
                        <button
                          type="button"
                          onClick={() => onNavigateSection('projects', { projectId: request.id })}
                          className="border border-[#333] bg-[#141414] px-2.5 py-1 text-xs text-neutral-300 hover:text-white inline-flex items-center gap-1"
                        >
                          <span>Project</span>
                          <ExternalLink size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {showEnquiries && (
        <section className="rounded border border-[#292929] bg-[#0C0C0C] p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white">Public Service Enquiries</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Contact form submissions are stored here for triage and conversion into client production requests.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(['open', 'all'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEnquiryListFilter(mode)}
                  className={`border px-2.5 py-1 font-mono text-[11px] tabular-nums ${
                    enquiryListFilter === mode
                      ? 'border-[#FF1E1E] bg-[#1A0E0E] text-white'
                      : 'border-[#333] text-neutral-400 hover:text-white'
                  }`}
                >
                  {mode === 'open'
                    ? `Open · ${serviceEnquiries.filter(item => item.status !== 'Closed' && item.status !== 'Converted').length}`
                    : `All · ${serviceEnquiries.length} (latest 50)`}
                </button>
              ))}
            </div>
          </div>

          {filteredEnquiries.length === 0 ? (
            <p className="py-4 text-sm text-neutral-500">No public enquiries match this filter.</p>
          ) : (
            <div className="space-y-3">
              {filteredEnquiries.map(enquiry => (
                <article key={enquiry.id} className="rounded border border-[#242424] bg-[#101010] p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white">
                        {enquiry.name} ·{' '}
                        <a className="text-red-300 underline" href={`mailto:${encodeURIComponent(enquiry.email)}`}>
                          {enquiry.email}
                        </a>
                      </h3>
                      <p className="mt-1 text-xs text-neutral-400">
                        {enquiry.service} · {new Date(enquiry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {enquiry.status === 'Converted' ? (
                      <span
                        aria-label={`Enquiry status for ${enquiry.name}: Converted`}
                        className="rounded border border-emerald-800/50 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-300"
                      >
                        Converted
                      </span>
                    ) : (
                      <select
                        aria-label={`Enquiry status for ${enquiry.name}`}
                        value={enquiry.status}
                        onChange={event =>
                          void updateEnquiryStatus(
                            enquiry.id,
                            event.target.value as Exclude<ServiceEnquiry['status'], 'Converted'>
                          )
                        }
                        className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-xs text-white"
                      >
                        <option value="New">New</option>
                        <option value="In Review">In Review</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Closed">Closed</option>
                      </select>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-300">{enquiry.message}</p>
                  {enquiry.requirements && (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-neutral-400">
                      <strong>Requirements:</strong> {enquiry.requirements}
                    </p>
                  )}
                  {enquiry.references && (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-neutral-400">
                      <strong>References:</strong> {enquiry.references}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {enquiry.status !== 'Converted' && enquiry.status !== 'Closed' && (
                      <button
                        type="button"
                        onClick={() => void convertEnquiry(enquiry.id)}
                        className="rounded border border-red-900/60 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950/30"
                      >
                        Convert to production request
                      </button>
                    )}
                    {enquiry.projectId && (
                      <button
                        type="button"
                        onClick={() => navigateOrFilterProjects({ projectId: enquiry.projectId })}
                        className="inline-flex items-center gap-1.5 border border-emerald-800/50 bg-emerald-950/20 px-2.5 py-1 text-xs text-emerald-300 hover:border-emerald-500"
                      >
                        <span>Open Resulting Project ({enquiry.projectId.slice(0, 8)}…)</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          SECTION: DELIVERABLES & REVIEW QUEUE
         ============================================================ */}
      {showReviewQueue && (
        <section className="space-y-3 rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 size={15} className="text-[#FF1E1E]" />
                <span>Deliverable & Revision Review Queue</span>
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Global review and client revision queue across all production projects.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  [
                    'pending',
                    'Pending review',
                    allDeliverables.filter(item =>
                      ['Awaiting Review', 'Revised - Awaiting Review'].includes(item.reviewStatus)
                    ).length,
                  ],
                  [
                    'approved',
                    'Approved',
                    allDeliverables.filter(item => item.reviewStatus === 'Approved').length,
                  ],
                  [
                    'rejected',
                    'Rejected',
                    allDeliverables.filter(item => item.reviewStatus === 'Rejected').length,
                  ],
                  [
                    'revisions',
                    'Outstanding revisions',
                    allRevisions.filter(item => ['Submitted', 'In Progress'].includes(item.status)).length,
                  ],
                ] as const
              ).map(([filter, title, count]) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setReviewFilter(filter)}
                  className={`rounded border px-3 py-1.5 font-mono text-xs tabular-nums ${
                    reviewFilter === filter
                      ? 'border-red-500 bg-red-950/40 text-white'
                      : 'border-[#333] text-neutral-400 hover:text-white'
                  }`}
                >
                  {title} · {count}
                </button>
              ))}
            </div>
          </div>

          {reviewFilter === 'revisions' ? (
            <div className="space-y-2">
              {allRevisions
                .filter(item => ['Submitted', 'In Progress'].includes(item.status))
                .map(revision => {
                  const project = projects.find(p => p.id === revision.projectId);
                  const client = project ? clientsByUid.get(project.clientUid) : undefined;
                  const workspace = project?.workspaceId ? workspacesById.get(project.workspaceId) : undefined;
                  const deliverable = allDeliverables.find(d => d.id === revision.deliverableId);
                  return (
                    <div
                      key={revision.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded border border-[#222] bg-[#101010] p-3 hover:border-[#444]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(revision.projectId);
                          setProjectTab('revisions');
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {project?.title || revision.projectId} · {revision.status}
                          </span>
                          {deliverable && (
                            <span className="rounded bg-[#1C1C1C] border border-[#333] px-1.5 py-0.5 text-[10px] text-neutral-300">
                              Deliverable: {deliverable.title}
                            </span>
                          )}
                          <span className={`text-[10px] font-mono ${revision.adminResponse ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {revision.adminResponse ? 'Response sent' : 'Response pending'}
                          </span>
                        </div>
                        <span className="mt-0.5 block text-[11px] text-neutral-500">
                          {client?.displayName || client?.organizationName || revision.clientUid}
                          {workspace ? ` · ${workspace.name}` : ''} · Submitted {formatShortDate(revision.submittedAt)}
                        </span>
                        <span className="mt-1 block text-xs text-neutral-300">{revision.feedback}</span>
                        {revision.adminResponse && (
                          <span className="mt-1 block text-xs text-emerald-300">Response: {revision.adminResponse}</span>
                        )}
                      </button>
                      {onNavigateSection && (
                        <button
                          type="button"
                          onClick={() => onNavigateSection('projects', { projectId: revision.projectId, tab: 'revisions' })}
                          className="shrink-0 border border-[#333] bg-[#141414] px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
                        >
                          Open Project
                        </button>
                      )}
                    </div>
                  );
                })}
              {allRevisions.filter(item => ['Submitted', 'In Progress'].includes(item.status)).length === 0 && (
                <p className="text-xs text-neutral-500 py-2">No outstanding revision requests.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {allDeliverables
                .filter(item =>
                  reviewFilter === 'pending'
                    ? ['Awaiting Review', 'Revised - Awaiting Review'].includes(item.reviewStatus)
                    : item.reviewStatus === (reviewFilter === 'approved' ? 'Approved' : 'Rejected')
                )
                .map(deliverable => {
                  const project = projects.find(p => p.id === deliverable.projectId);
                  const client = project ? clientsByUid.get(project.clientUid) : undefined;
                  const workspace = project?.workspaceId ? workspacesById.get(project.workspaceId) : undefined;
                  return (
                    <div
                      key={deliverable.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#222] bg-[#101010] p-3 hover:border-[#444]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(deliverable.projectId);
                          setProjectTab('deliverables');
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <span className="block text-xs font-semibold text-white">{deliverable.title}</span>
                        <span className="block text-[11px] text-neutral-500 mt-0.5">
                          {project?.title || deliverable.projectId} · v{deliverable.currentVersion || 1}
                          {client ? ` · ${client.displayName || client.organizationName}` : ''}
                          {workspace ? ` · ${workspace.name}` : ''}
                        </span>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-300">{deliverable.reviewStatus}</span>
                        {onNavigateSection && (
                          <button
                            type="button"
                            onClick={() => onNavigateSection('projects', { projectId: deliverable.projectId, tab: 'deliverables' })}
                            className="border border-[#333] bg-[#141414] px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
                          >
                            Open Project
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              {allDeliverables.filter(item =>
                reviewFilter === 'pending'
                  ? ['Awaiting Review', 'Revised - Awaiting Review'].includes(item.reviewStatus)
                  : item.reviewStatus === (reviewFilter === 'approved' ? 'Approved' : 'Rejected')
              ).length === 0 && <p className="text-xs text-neutral-500 py-2">Nothing in this view.</p>}
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          SECTION: PROJECTS DIRECTORY & DETAIL WORKSPACE
         ============================================================ */}
      {showProjectWorkspace && (
        <section
          className={
            section === 'projects' || isStandaloneStudio
              ? 'grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.7fr)]'
              : 'space-y-4'
          }
        >
          {(section === 'projects' || isStandaloneStudio) && (
            <div className="space-y-4">
              {/* Project Directory Filter Controls */}
              <div className="space-y-3 rounded border border-[#1E1E1E] bg-[#0C0C0C] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-white">
                    Projects Directory ({filteredProjects.length})
                  </h2>
                  <button
                    type="button"
                    onClick={openCreateProjectModal}
                    className="inline-flex items-center gap-1.5 bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
                  >
                    <Plus size={13} />
                    <span>New Project</span>
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="search"
                    value={projectSearch}
                    onChange={event => setProjectSearch(event.target.value)}
                    placeholder="Search title, ID, client, workspace, category…"
                    className="w-full rounded border border-[#262626] bg-[#141414] pl-8 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-[#FF1E1E] focus:outline-none"
                  />
                </div>

                {/* Structured Dropdown Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    aria-label="Filter projects by stage"
                    value={stageFilter}
                    onChange={event => setStageFilter(event.target.value)}
                    className="rounded border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                  >
                    <option value="All">All stages ({projects.length})</option>
                    <option value="Active">Active only ({studioMetrics.activeCount})</option>
                    {STAGES.map(stage => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter projects by category"
                    value={categoryFilter}
                    onChange={event => setCategoryFilter(event.target.value)}
                    className="rounded border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                  >
                    <option value="All">All categories</option>
                    {categoryOptions.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter projects by client"
                    value={localClientFilter}
                    onChange={event => {
                      const next = event.target.value;
                      setLocalClientFilter(next);
                      if (!next && filterClientUid) onClearFilter?.();
                    }}
                    className="rounded border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                  >
                    <option value="">All clients ({clients.length})</option>
                    {clients.map(client => (
                      <option key={client.uid} value={client.uid}>
                        {client.displayName || client.organizationName} ({client.accountType})
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter projects by workspace"
                    value={localWorkspaceFilter}
                    onChange={event => {
                      const next = event.target.value;
                      setLocalWorkspaceFilter(next);
                      if (!next && filterWorkspaceId) onClearFilter?.();
                    }}
                    className="rounded border border-[#262626] bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                  >
                    <option value="">All workspaces ({workspaces.length})</option>
                    {workspaces.map(workspace => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name} ({workspace.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Overdue Toggle & Active Filter Chips */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overdueOnlyFilter}
                      onChange={event => setOverdueOnlyFilter(event.target.checked)}
                    />
                    <span>Overdue only ({studioMetrics.overdue.length})</span>
                  </label>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllProjectFilters}
                      className="text-xs text-[#FF1E1E] hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {(effectiveClientFilter || effectiveWorkspaceFilter) && (
                  <div className="rounded border border-[#2B1A1A] bg-[#160D0D] px-3 py-2 text-xs text-neutral-300 space-y-1">
                    {effectiveClientFilter && (
                      <p>
                        Client filter:{' '}
                        <strong className="text-white">
                          {filteredClientProfile?.displayName ||
                            filteredClientProfile?.organizationName ||
                            filteredClientProfile?.email ||
                            effectiveClientFilter}
                        </strong>
                      </p>
                    )}
                    {effectiveWorkspaceFilter && (
                      <p>
                        Workspace filter:{' '}
                        <strong className="text-white">
                          {filteredWorkspaceRecord?.name || effectiveWorkspaceFilter}
                        </strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Project List */}
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-0.5">
                {filteredProjects.length === 0 ? (
                  <div className="rounded border border-[#1E1E1E] bg-[#0C0C0C] p-6 text-center space-y-2">
                    <p className="text-sm text-neutral-400">No production projects match the active filters.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearAllProjectFilters}
                        className="text-xs text-[#FF1E1E] hover:underline"
                      >
                        Reset all filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredProjects.map(project => {
                    const client = clientsByUid.get(project.clientUid);
                    const workspace = project.workspaceId
                      ? workspacesById.get(project.workspaceId)
                      : undefined;
                    const overdue = isProjectOverdue(project);

                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setProjectTab('overview');
                        }}
                        className={`w-full rounded border p-3.5 text-left transition-colors ${
                          selectedProjectId === project.id
                            ? 'border-[#FF1E1E]/70 bg-[#171010]'
                            : 'border-[#1E1E1E] bg-[#0C0C0C] hover:border-[#3A3A3A]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm text-white leading-snug">
                            {project.title}
                          </span>
                          <span
                            className={`shrink-0 border px-1.5 py-0.5 text-[10px] font-mono ${stageBadgeClasses(
                              project.stage
                            )}`}
                          >
                            {project.stage || project.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-neutral-400 truncate">
                          {client?.displayName || client?.organizationName || project.clientUid}
                          {workspace ? ` · ${workspace.name}` : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-neutral-500">
                          <span className="truncate">{project.category}</span>
                          <span className={overdue ? 'text-red-400 font-semibold' : ''}>
                            {project.progress || 0}% · Due {project.expectedDeliveryDate || '—'}
                            {overdue ? ' (OVERDUE)' : ''}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Project Detail Inspector */}
          <div className="min-w-0 rounded border border-[#1E1E1E] bg-[#0C0C0C] p-4 sm:p-5">
            {!selectedProject ? (
              <div className="py-16 text-center space-y-3">
                <FolderKanban size={28} className="mx-auto text-neutral-600" />
                <p className="text-sm text-neutral-400">
                  Select a project from the directory to manage its creative production lifecycle, tasks, deliverables, and reviews.
                </p>
                <button
                  type="button"
                  onClick={openCreateProjectModal}
                  className="inline-flex items-center gap-1.5 border border-[#333] bg-[#141414] px-3 py-1.5 text-xs text-white hover:border-[#FF1E1E]"
                >
                  <Plus size={13} />
                  <span>Create a production project</span>
                </button>
              </div>
            ) : (
              <>
                {/* Selected Project Header */}
                <div className="flex flex-col gap-4 border-b border-[#222] pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{selectedProject.title}</h2>
                      {isProjectOverdue(selectedProject) && (
                        <span className="inline-flex items-center gap-1 border border-red-900/60 bg-red-950/40 px-2 py-0.5 text-[10px] font-mono uppercase text-red-300">
                          <AlertTriangle size={11} />
                          Overdue
                        </span>
                      )}
                      {selectedProject.priority && (
                        <span className="border border-[#2C2C2C] bg-[#141414] px-2 py-0.5 text-[10px] font-mono uppercase text-neutral-300">
                          {selectedProject.priority}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                      <span>
                        Client:{' '}
                        {onOpenClient ? (
                          <button
                            type="button"
                            onClick={() => onOpenClient(selectedProject.clientUid)}
                            className="text-white hover:text-[#FF1E1E] underline decoration-[#333]"
                          >
                            {selectedProjectClient?.displayName ||
                              selectedProjectClient?.organizationName ||
                              selectedProject.clientUid}
                          </button>
                        ) : (
                          <strong className="text-neutral-200">
                            {selectedProjectClient?.displayName ||
                              selectedProjectClient?.organizationName ||
                              selectedProject.clientUid}
                          </strong>
                        )}
                      </span>

                      {selectedProjectWorkspace && (
                        <span>
                          Workspace:{' '}
                          {onOpenWorkspace ? (
                            <button
                              type="button"
                              onClick={() => onOpenWorkspace(selectedProjectWorkspace.id)}
                              className="text-white hover:text-[#FF1E1E] underline decoration-[#333] inline-flex items-center gap-1"
                            >
                              <Building2 size={11} />
                              <span>{selectedProjectWorkspace.name}</span>
                            </button>
                          ) : (
                            <strong className="text-neutral-200">{selectedProjectWorkspace.name}</strong>
                          )}
                          <span className="ml-1 font-mono text-[10px] text-neutral-500">
                            ({selectedProjectWorkspace.type} · {selectedProjectWorkspace.status || 'Active'})
                          </span>
                        </span>
                      )}

                      <span className="font-mono text-[11px] text-neutral-500">ID: {selectedProject.id}</span>
                    </div>
                  </div>

                  {/* Quick Stage & Priority Selectors */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <label className="text-xs text-neutral-400">
                      Stage
                      <select
                        value={selectedProject.stage || 'New Request'}
                        disabled={saving}
                        onChange={event => void updateStage(event.target.value as ProductionStage)}
                        className="ml-2 rounded border border-[#333] bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                      >
                        {STAGES.map(stage => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-neutral-400">
                      Priority
                      <select
                        value={selectedProject.priority || 'Normal'}
                        disabled={saving}
                        onChange={event =>
                          void updateProject({
                            priority: event.target.value as ClientProject['priority'],
                          })
                        }
                        className="ml-2 rounded border border-[#333] bg-[#141414] px-2.5 py-1.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                      >
                        {PRIORITIES.map(priority => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* Project Detail Tabs */}
                <nav className="my-4 flex flex-wrap gap-2 border-b border-[#1A1A1A] pb-3">
                  {(
                    [
                      ['overview', 'Overview'],
                      ['tasks', `Tasks (${selectedTasks.length})`],
                      ['deliverables', `Deliverables (${deliverables.length})`],
                      ['notes', `Internal Notes (${currentNotes.length})`],
                      ['revisions', `Revisions (${revisions.length})`],
                      ['activity', `Activity (${activity.length})`],
                    ] as const
                  ).map(([tab, label]) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setProjectTab(tab)}
                      className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                        projectTab === tab
                          ? 'bg-white text-black'
                          : 'bg-[#161616] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>

                {projectDetailLoading && (
                  <p className="mb-3 text-xs font-mono text-neutral-500">
                    Syncing project tasks, deliverables, notes, and personnel details…
                  </p>
                )}

                {/* TAB: OVERVIEW */}
                {projectTab === 'overview' && (
                  <div className="space-y-5">
                    {/* Schedule & Assigned Personnel Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="border border-[#1E1E1E] bg-[#101010] p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                            <Calendar size={12} className="text-[#FF1E1E]" />
                            Schedule & Delivery
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDialogError('');
                              setPromptDialog({
                                type: 'projectDeadline',
                                expectedDeliveryDate: selectedProject.expectedDeliveryDate || '',
                              });
                            }}
                            className="text-[11px] text-red-300 hover:text-white"
                          >
                            Edit deadline
                          </button>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <dt className="text-neutral-500">Start date</dt>
                            <dd className="font-mono text-neutral-200">{selectedProject.startDate || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-neutral-500">Expected delivery</dt>
                            <dd
                              className={`font-mono ${
                                isProjectOverdue(selectedProject) ? 'text-red-300 font-semibold' : 'text-neutral-200'
                              }`}
                            >
                              {selectedProject.expectedDeliveryDate || 'To be confirmed'}
                            </dd>
                          </div>
                          {selectedProject.deliveredAt && (
                            <div className="col-span-2">
                              <dt className="text-neutral-500">Delivered at</dt>
                              <dd className="font-mono text-emerald-300">
                                {formatShortDate(selectedProject.deliveredAt)}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      <div className="border border-[#1E1E1E] bg-[#101010] p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                            <UserCheck size={12} className="text-[#FF1E1E]" />
                            Assigned Personnel (Admin-only)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDialogError('');
                              setPromptDialog({
                                type: 'projectPersonnel',
                                leadProducer: selectedProjectDetails.leadProducer,
                                assignedTo: selectedProjectDetails.assignedTo,
                                assignedToUid: selectedProjectDetails.assignedToUid,
                              });
                            }}
                            className="text-[11px] text-red-300 hover:text-white"
                          >
                            Edit personnel
                          </button>
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <dt className="text-neutral-500">Lead producer</dt>
                            <dd className="text-neutral-200">
                              {selectedProjectDetails.leadProducer || 'Unassigned'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-neutral-500">Assigned producer</dt>
                            <dd className="text-neutral-200">
                              {selectedProjectDetails.assignedTo || 'Unassigned'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Client-Visible Task Milestones Summary */}
                    <div className="border border-[#1E1E1E] bg-[#101010] p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                          <Clock size={12} className="text-[#FF1E1E]" />
                          Task Milestones ({doneTasksCount}/{selectedTasks.length} completed · {visibleMilestoneTasks.length} client-visible)
                        </span>
                        <button
                          type="button"
                          onClick={() => setProjectTab('tasks')}
                          className="text-[11px] text-red-300 hover:text-white"
                        >
                          Manage tasks →
                        </button>
                      </div>
                      {visibleMilestoneTasks.length === 0 ? (
                        <p className="text-xs text-neutral-500">
                          No client-visible milestone tasks configured yet. Create tasks in the Tasks tab and enable client visibility to surface milestones to the client.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {visibleMilestoneTasks.slice(0, 4).map(task => (
                            <div
                              key={task.id}
                              className="border border-[#222] bg-[#141414] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="truncate text-neutral-200">{task.title}</span>
                              <span className="shrink-0 font-mono text-[10px] text-neutral-400">
                                {task.status}
                                {task.dueDate ? ` · ${task.dueDate}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client-Visible Brief */}
                    <div className="border border-[#1E1E1E] bg-[#101010] p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                          Client-visible Brief & Scope
                        </span>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setDialogError('');
                              setPromptDialog({ type: 'projectTitle', title: selectedProject.title });
                            }}
                            className="text-[11px] text-neutral-300 hover:text-white"
                          >
                            Edit title
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDialogError('');
                              setPromptDialog({
                                type: 'projectDescription',
                                description: selectedProject.description || '',
                              });
                            }}
                            className="text-[11px] text-red-300 hover:text-white"
                          >
                            Edit description
                          </button>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-neutral-200">
                        {selectedProject.description || 'No brief description recorded.'}
                      </p>
                    </div>

                    {selectedProject.requestAttachments && selectedProject.requestAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.requestAttachments.map(attachment => (
                          <button
                            key={attachment.storagePath}
                            type="button"
                            onClick={() => void downloadRequestAttachment(attachment)}
                            className="rounded border border-[#333] px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white"
                          >
                            {attachment.fileName} · Download reference
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedProject.requestHistory && selectedProject.requestHistory.length > 0 && (
                      <details className="rounded border border-[#292929] bg-[#101010] p-3">
                        <summary className="cursor-pointer text-xs font-semibold text-neutral-300">
                          Request conversation · {selectedProject.requestHistory.length} message(s)
                        </summary>
                        <ol className="mt-3 space-y-3">
                          {selectedProject.requestHistory.map((entry, index) => (
                            <li key={`${entry.createdAt}-${index}`} className="border-l border-[#444] pl-3">
                              <p className="text-[10px] text-neutral-500">
                                {entry.authorName} · {entry.authorRole} · {new Date(entry.createdAt).toLocaleString()}
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-300">{entry.message}</p>
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}

                    {(selectedProject.requestStatus === 'Pending' ||
                      selectedProject.requestStatus === 'Clarification Requested' ||
                      (!selectedProject.requestStatus && selectedProject.stage === 'New Request')) && (
                      <section className="space-y-2 rounded border border-amber-900/40 bg-amber-950/10 p-3.5">
                        <div>
                          <p className="text-xs font-semibold text-amber-200">
                            Creative request · {selectedProject.requestStatus || 'Pending review'}
                          </p>
                          <p className="mt-1 text-[11px] text-neutral-400">
                            Accept this request into production, ask the client to clarify scope, or reject it via audited Cloud Function.
                          </p>
                        </div>
                        <textarea
                          value={requestResponse}
                          onChange={event => setRequestResponse(event.target.value)}
                          maxLength={5000}
                          rows={3}
                          placeholder="Response to client (required for clarification or rejection)"
                          className="w-full rounded border border-[#333] bg-[#141414] p-2 text-sm text-white"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void reviewRequest('Accepted')}
                            className="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Accept &amp; start production
                          </button>
                          <button
                            type="button"
                            disabled={saving || !requestResponse.trim()}
                            onClick={() => void reviewRequest('Clarification Requested')}
                            className="rounded border border-amber-700 px-3 py-2 text-xs text-amber-100 disabled:opacity-50"
                          >
                            Request clarification
                          </button>
                          <button
                            type="button"
                            disabled={saving || !requestResponse.trim()}
                            onClick={() => void reviewRequest('Rejected')}
                            className="rounded border border-red-900 px-3 py-2 text-xs text-red-200 disabled:opacity-50"
                          >
                            Reject request
                          </button>
                        </div>
                      </section>
                    )}

                    {/* Category, Client & Progress Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#1A1A1A] pt-4">
                      <label className="text-xs text-neutral-400">
                        Creative category
                        <select
                          value={selectedProject.category}
                          disabled={saving}
                          onChange={event => void updateProject({ category: event.target.value })}
                          className="mt-1 block w-full rounded border border-[#333] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                        >
                          {categoryOptions.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-xs text-neutral-400">
                        Assigned client account
                        <select
                          value={selectedProject.clientUid}
                          disabled={saving}
                          onChange={event => {
                            const nextClient = clientsByUid.get(event.target.value);
                            if (!nextClient) return;
                            const nextWorkspace = nextClient.workspaceId
                              ? workspacesById.get(nextClient.workspaceId)
                              : undefined;
                            const eligibleWsId = isWorkspaceLinkEligible(nextWorkspace, nextClient.uid)
                              ? nextWorkspace!.id
                              : undefined;
                            setSaving(true);
                            setError('');
                            void (async () => {
                              try {
                                await updateDoc(doc(db, 'clientProjects', selectedProject.id), {
                                  clientUid: nextClient.uid,
                                  workspaceId: eligibleWsId || deleteField(),
                                  updatedAt: new Date().toISOString(),
                                });
                                await updatePrivateProjectDetails({
                                  clientName: nextClient.displayName || nextClient.organizationName,
                                });
                              } catch (assignError) {
                                setError(friendlyError(assignError));
                              } finally {
                                setSaving(false);
                              }
                            })();
                          }}
                          className="mt-1 block w-full rounded border border-[#333] bg-[#141414] px-2.5 py-1.5 text-xs text-white"
                        >
                          {clients.map(client => (
                            <option key={client.uid} value={client.uid}>
                              {client.displayName || client.organizationName} · {client.email}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {canLinkSelectedClientWorkspace && selectedClientPrimaryWorkspace && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void updateProject({ workspaceId: selectedClientPrimaryWorkspace.id })}
                        className="rounded border border-amber-900/50 px-3 py-2 text-xs text-amber-200 disabled:opacity-50"
                      >
                        Link this project to {selectedClientPrimaryWorkspace.name} ({selectedClientPrimaryWorkspace.status})
                      </button>
                    )}

                    <label className="block text-xs text-neutral-400">
                      Completion progress: <strong className="font-mono text-white">{projectProgress}%</strong>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={projectProgress}
                        onChange={event => setProjectProgress(Number(event.target.value))}
                        onMouseUp={() => void updateProject({ progress: projectProgress })}
                        onTouchEnd={() => void updateProject({ progress: projectProgress })}
                        onKeyUp={() => void updateProject({ progress: projectProgress })}
                        className="mt-2 block w-full accent-red-500"
                      />
                    </label>

                    <p className="text-[11px] text-neutral-500">
                      Client-facing fields live on clientProjects; producer assignments and internal task notes remain restricted to the admin-only subcollection.
                    </p>
                  </div>
                )}

                {/* TAB: TASKS */}
                {projectTab === 'tasks' && (
                  <div className="space-y-4">
                    {/* Task Summary Strip */}
                    <div className="flex flex-wrap items-center gap-4 border border-[#1E1E1E] bg-[#101010] px-3.5 py-2.5 text-xs font-mono tabular-nums text-neutral-300">
                      <span>Total: <strong className="text-white">{selectedTasks.length}</strong></span>
                      <span>Completed: <strong className="text-emerald-300">{doneTasksCount}</strong></span>
                      <span>Overdue: <strong className={overdueTasksCount > 0 ? 'text-red-300' : 'text-neutral-400'}>{overdueTasksCount}</strong></span>
                      <span>Client-visible: <strong className="text-white">{visibleMilestoneTasks.length}</strong></span>
                    </div>

                    {/* Create Task Form */}
                    <form onSubmit={createTask} className="grid gap-2.5 rounded border border-[#222] bg-[#101010] p-3.5 md:grid-cols-2">
                      <div className="md:col-span-2 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                          Add production task
                        </h3>
                      </div>
                      <input
                        value={taskTitle}
                        onChange={event => setTaskTitle(event.target.value)}
                        placeholder="Task title *"
                        maxLength={300}
                        required
                        className="rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                      />
                      <input
                        type="date"
                        aria-label="Task deadline"
                        value={taskDeadline}
                        onChange={event => setTaskDeadline(event.target.value)}
                        className="rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                      />
                      <select
                        aria-label="Select verified admin assignee"
                        value={taskAssigneeUid}
                        onChange={event => {
                          const uid = event.target.value;
                          setTaskAssigneeUid(uid);
                          const match = adminAssigneesByUid.get(uid);
                          if (match) setTaskAssignee(match.label);
                        }}
                        className="rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                      >
                        <option value="">Select verified platform admin (optional)…</option>
                        {resolvedAdminAssignees.map(admin => (
                          <option key={admin.uid} value={admin.hasUserDoc ? admin.uid : ''}>
                            {admin.label} · {admin.role}
                            {admin.hasUserDoc ? '' : ' (name-only)'}
                          </option>
                        ))}
                      </select>
                      <input
                        value={taskAssignee}
                        onChange={event => setTaskAssignee(event.target.value)}
                        placeholder="Assigned display name (private)"
                        className="rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                      />
                      <textarea
                        value={taskDescription}
                        onChange={event => setTaskDescription(event.target.value)}
                        placeholder="Task description / brief (visible to client if Client-visible is checked)"
                        rows={2}
                        maxLength={5000}
                        className="rounded border border-[#333] bg-[#141414] p-2.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                      />
                      <textarea
                        value={taskInternalNote}
                        onChange={event => setTaskInternalNote(event.target.value)}
                        placeholder="Private internal task note (admin-only subcollection)"
                        rows={2}
                        maxLength={5000}
                        className="rounded border border-[#333] bg-[#141414] p-2.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                      />
                      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={taskClientVisible}
                            onChange={event => setTaskClientVisible(event.target.checked)}
                          />
                          <span>Show this task milestone and status to the client</span>
                        </label>
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          {saving ? 'Adding…' : 'Add task'}
                        </button>
                      </div>
                    </form>

                    {/* Task Cards */}
                    {selectedTasks.length === 0 ? (
                      <p className="py-4 text-sm text-neutral-500">No production tasks on this project yet.</p>
                    ) : (
                      selectedTasks.map(task => {
                        const details = taskAdminDetails[task.id];
                        const overdue = isTaskOverdue(task);
                        const isDone = task.status === 'Done';
                        return (
                          <div key={task.id} className="space-y-2.5 rounded border border-[#222] bg-[#101010] p-3.5">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className={`text-sm font-semibold ${isDone ? 'line-through text-neutral-400' : 'text-white'}`}>
                                    {task.title}
                                  </p>
                                  {overdue && (
                                    <span className="border border-red-900/60 bg-red-950/30 px-1.5 py-0.5 text-[10px] font-mono text-red-300">
                                      OVERDUE
                                    </span>
                                  )}
                                  <span className="border border-[#2C2C2C] bg-[#151515] px-1.5 py-0.5 text-[10px] font-mono text-neutral-400">
                                    {task.clientVisible ? 'Client-visible' : 'Admin-only'}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-neutral-400">
                                  Due: <span className="font-mono">{task.dueDate || '—'}</span> · Assigned to:{' '}
                                  <strong className="text-neutral-200">{details?.assignee || 'Unassigned'}</strong>
                                  {details?.assigneeUid ? ` (${details.assigneeUid.slice(0, 6)}…)` : ''}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void updateTask(task, { status: isDone ? 'In Progress' : 'Done' })
                                  }
                                  className={`inline-flex items-center gap-1 border px-2.5 py-1 text-xs ${
                                    isDone
                                      ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300 hover:border-emerald-600'
                                      : 'border-[#333] bg-[#141414] text-neutral-200 hover:border-emerald-700'
                                  }`}
                                >
                                  <CheckCircle2 size={12} />
                                  <span>{isDone ? 'Reopen' : 'Complete'}</span>
                                </button>
                                <select
                                  aria-label={`Status for ${task.title}`}
                                  value={task.status}
                                  onChange={event =>
                                    void updateTask(task, { status: event.target.value as ProductionTask['status'] })
                                  }
                                  className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-xs text-white"
                                >
                                  {TASK_STATUSES.map(status => (
                                    <option key={status}>{status}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-xs text-neutral-300 whitespace-pre-wrap border-l-2 border-[#2B2B2B] pl-2.5">
                                {task.description}
                              </p>
                            )}

                            {details?.internalNotes && (
                              <p className="text-xs text-amber-200/90 whitespace-pre-wrap bg-[#15120C] border border-amber-900/30 px-2.5 py-1.5">
                                <span className="font-mono text-[10px] uppercase text-amber-400 mr-1.5">
                                  Internal note:
                                </span>
                                {details.internalNotes}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                              <button
                                type="button"
                                onClick={() => openEditTaskModal(task)}
                                className="text-red-300 hover:text-white"
                              >
                                Edit details & notes
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTaskAssignment(task)}
                                className="text-neutral-300 hover:text-white"
                              >
                                Assign / change assignee
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTaskDeadline(task)}
                                className="text-neutral-300 hover:text-white"
                              >
                                Edit deadline
                              </button>
                              <button
                                type="button"
                                onClick={() => addSubtask(task)}
                                className="text-neutral-300 hover:text-white"
                              >
                                + Add subtask
                              </button>
                            </div>

                            {(task.subtasks || []).length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1 border-t border-[#1D1D1D]">
                                {(task.subtasks || []).map(subtask => (
                                  <label
                                    key={subtask.id}
                                    className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={subtask.completed}
                                      onChange={() => void toggleSubtask(task, subtask.id)}
                                    />
                                    <span className={subtask.completed ? 'line-through text-neutral-500' : ''}>
                                      {subtask.title}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {unassignedTasks.length > 0 && (
                      <div className="space-y-2 border-t border-[#222] pt-3">
                        <p className="text-xs text-neutral-500">
                          Unassigned legacy tasks ({unassignedTasks.length}) · admin only
                        </p>
                        {unassignedTasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-neutral-300">{task.title}</span>
                            <select
                              value={task.status}
                              onChange={event =>
                                void updateTask(task, { status: event.target.value as ProductionTask['status'] })
                              }
                              className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-white"
                            >
                              {TASK_STATUSES.map(status => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: DELIVERABLES */}
                {projectTab === 'deliverables' && (
                  <div className="space-y-4">
                    <form onSubmit={uploadDeliverable} className="space-y-2.5 rounded border border-[#222] bg-[#101010] p-3.5">
                      <input
                        value={deliverableTitle}
                        onChange={event => setDeliverableTitle(event.target.value)}
                        placeholder="Deliverable title"
                        required
                        className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
                      />
                      <input
                        value={deliverableDescription}
                        onChange={event => setDeliverableDescription(event.target.value)}
                        placeholder="Description (optional)"
                        className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white"
                      />
                      <input
                        type="file"
                        accept="image/*,audio/*,video/*,application/pdf,application/json,application/xml,application/zip,text/plain,font/*"
                        onChange={event => setDeliverableFile(event.target.files?.[0] || null)}
                        required
                        className="block w-full text-xs text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-[#222] file:px-3 file:py-2 file:text-xs file:text-white"
                      />
                      <button
                        disabled={saving}
                        className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? 'Uploading…' : 'Upload deliverable'}
                      </button>
                    </form>

                    {deliverables.length === 0 ? (
                      <p className="py-4 text-sm text-neutral-500">No deliverables uploaded to this project yet.</p>
                    ) : (
                      deliverables.map(deliverable => (
                        <article key={deliverable.id} className="space-y-3 rounded border border-[#222] bg-[#101010] p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{deliverable.title}</p>
                              <p className="text-xs text-neutral-500">
                                {deliverable.reviewStatus} · v{deliverable.currentVersion || 1} · {deliverable.fileName}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={deliverable.reviewStatus}
                                onChange={event => void updateDeliverableReviewStatus(deliverable, event.target.value as ProductionDeliverableReviewStatus)}
                                className="rounded border border-[#333] bg-[#141414] px-2 py-1.5 text-xs text-white"
                                title="Review status"
                              >
                                {[
                                  'Draft',
                                  'Awaiting Review',
                                  'Approved',
                                  'Rejected',
                                  'Revision Requested',
                                  'Revision In Progress',
                                  'Revised - Awaiting Review',
                                ].map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                              <label className="cursor-pointer rounded border border-[#333] px-3 py-1.5 text-xs text-neutral-200 hover:border-[#555]">
                                {saving ? 'Uploading…' : 'Upload new version'}
                                <input
                                  type="file"
                                  disabled={saving}
                                  className="sr-only"
                                  accept="image/*,audio/*,video/*,application/pdf,application/json,application/xml,application/zip,text/plain,font/*"
                                  onChange={event => {
                                    const file = event.target.files?.[0];
                                    if (file) void uploadDeliverableVersion(deliverable, file);
                                    event.target.value = '';
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => void publishDeliverable(deliverable)}
                                className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  deliverable.isClientPublished
                                    ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300 hover:border-emerald-700'
                                    : 'border-[#333] text-neutral-200 hover:border-[#555]'
                                }`}
                              >
                                {deliverable.isClientPublished ? 'Published (Click to Unpublish)' : 'Publish to client'}
                              </button>
                            </div>
                          </div>
                          {deliverable.feedback && (
                            <p className="rounded bg-[#161616] p-2.5 text-xs text-amber-200">
                              Client feedback: {deliverable.feedback}
                            </p>
                          )}
                          {deliverable.fileUrl && (
                            <a
                              href={deliverable.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-red-300 underline"
                            >
                              Preview current file
                            </a>
                          )}
                          {(deliverable.versions || []).length > 0 && (
                            <details className="text-xs text-neutral-400">
                              <summary className="cursor-pointer">
                                Version history ({deliverable.versions?.length})
                              </summary>
                              <ol className="mt-2 space-y-1">
                                {[...(deliverable.versions || [])].reverse().map(version => (
                                  <li key={version.version}>
                                    <a
                                      href={version.fileUrl}
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
                        </article>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: INTERNAL NOTES */}
                {projectTab === 'notes' && (
                  <div className="space-y-3">
                    <form onSubmit={addNote} className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={event => setNoteText(event.target.value)}
                        placeholder="Private admin note"
                        rows={3}
                        required
                        className="w-full rounded border border-[#333] bg-[#141414] p-3 text-sm text-white"
                      />
                      <button
                        disabled={saving}
                        className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Save internal note
                      </button>
                    </form>
                    {currentNotes.map(note => (
                      <article key={note.id} className="rounded border border-[#222] bg-[#101010] p-3">
                        <p className="whitespace-pre-wrap text-sm text-neutral-200">{note.content}</p>
                        <div className="mt-2 flex justify-between text-[11px] text-neutral-500">
                          <span>
                            {note.authorName} · {new Date(note.createdAt).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => editNote(note.id, note.content)}
                            className="text-red-300 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      </article>
                    ))}
                    <p className="text-xs text-neutral-500">
                      Notes are stored separately and readable only by active platform admins.
                    </p>
                  </div>
                )}

                {/* TAB: REVISIONS */}
                {projectTab === 'revisions' && (
                  <div className="space-y-3">
                    {revisions.map(revision => (
                      <article key={revision.id} className="rounded border border-[#222] bg-[#101010] p-3.5">
                        <p className="text-sm text-neutral-200">{revision.feedback}</p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-xs text-neutral-500">
                            {revision.status} · {new Date(revision.submittedAt).toLocaleString()}
                          </span>
                          <select
                            value={revision.status}
                            onChange={event =>
                              void updateRevision(
                                revision,
                                event.target.value as ProductionRevisionRequest['status']
                              )
                            }
                            className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-xs text-white"
                          >
                            {['Submitted', 'In Progress', 'Completed', 'Cancelled'].map(status => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                        {revision.adminResponse && (
                          <p className="mt-3 rounded bg-[#151515] p-2 text-xs text-neutral-300">
                            Sent to client: {revision.adminResponse}
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <textarea
                            value={revisionResponses[revision.id] || ''}
                            onChange={event =>
                              setRevisionResponses(previous => ({
                                ...previous,
                                [revision.id]: event.target.value,
                              }))
                            }
                            maxLength={5000}
                            rows={2}
                            placeholder="Response visible to the client"
                            className="min-w-0 flex-1 rounded border border-[#333] bg-[#141414] p-2 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => void respondToRevision(revision)}
                            className="rounded border border-[#444] px-3 text-xs text-white hover:border-white"
                          >
                            Send response
                          </button>
                        </div>
                      </article>
                    ))}
                    {revisions.length === 0 && (
                      <p className="text-sm text-neutral-500 py-4">No revision requests for this project.</p>
                    )}
                  </div>
                )}

                {/* TAB: ACTIVITY */}
                {projectTab === 'activity' && (
                  <div className="space-y-2">
                    {activity.map(item => (
                      <article key={item.id} className="rounded border border-[#222] bg-[#101010] p-3">
                        <p className="text-sm font-medium text-white">{item.action}</p>
                        <p className="mt-1 text-xs text-neutral-400">{item.details}</p>
                        <p className="mt-1 text-[10px] font-mono text-neutral-500">
                          {item.actorName} · {new Date(item.createdAt).toLocaleString()}
                          {!item.clientVisible ? ' · Admin only' : ''}
                        </p>
                      </article>
                    ))}
                    {activity.length === 0 && <p className="text-sm text-neutral-500 py-4">No activity recorded yet.</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ============================================================
          MODAL: CREATE PRODUCTION PROJECT
         ============================================================ */}
      <Modal
        isOpen={createProjectModalOpen}
        onClose={() => {
          if (!saving) setCreateProjectModalOpen(false);
        }}
        maxWidth="lg"
        title="Create production project"
        subtitle="Creates a Firestore production project under an active client account and eligible workspace."
      >
        <form onSubmit={createProject} className="space-y-4">
          {createProjectError && (
            <p role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
              {createProjectError}
            </p>
          )}

          <div>
            <label htmlFor="create-proj-title" className="mb-1.5 block text-xs font-medium text-neutral-300">
              Project title *
            </label>
            <input
              id="create-proj-title"
              value={projectTitle}
              onChange={event => setProjectTitle(event.target.value)}
              placeholder="e.g. Debut Single Cover Art & Streaming Pack"
              maxLength={160}
              required
              autoFocus
              className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="create-proj-client" className="mb-1.5 block text-xs font-medium text-neutral-300">
                Client account *
              </label>
              <select
                id="create-proj-client"
                value={projectClientUid}
                onChange={event => {
                  const nextUid = event.target.value;
                  setProjectClientUid(nextUid);
                  const nextClient = clientsByUid.get(nextUid);
                  if (nextClient) {
                    const isArtist = nextClient.accountType === 'Artist';
                    setProjectCategory(
                      isArtist ? 'artist' : nextClient.accountType === 'Company' ? 'business' : 'brand'
                    );
                    setProjectType(defaultCategoryForAudience(isArtist));
                  }
                }}
                required
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                <option value="">Assign to client profile…</option>
                {clients.map(client => (
                  <option key={client.uid} value={client.uid} disabled={client.status === 'Suspended'}>
                    {client.displayName || client.organizationName} · {client.accountType}
                    {client.status === 'Suspended' ? ' (Suspended)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="create-proj-category" className="mb-1.5 block text-xs font-medium text-neutral-300">
                Creative production category *
              </label>
              <select
                id="create-proj-category"
                value={projectType}
                onChange={event => setProjectType(event.target.value)}
                required
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
              >
                {UNIFIED_PRODUCTION_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCreateClient && (
            <div className="border border-[#242424] bg-[#111] px-3 py-2 text-xs text-neutral-400">
              Workspace association:{' '}
              {selectedCreateWorkspace ? (
                isWorkspaceLinkEligible(selectedCreateWorkspace, selectedCreateClient.uid) ? (
                  <span className="text-emerald-300">
                    Will link to <strong>{selectedCreateWorkspace.name}</strong> ({selectedCreateWorkspace.status})
                  </span>
                ) : (
                  <span className="text-amber-300">
                    {selectedCreateWorkspace.name} is {selectedCreateWorkspace.status || 'unverified'}; project will be saved under the client without linking an inactive workspace.
                  </span>
                )
              ) : (
                <span className="text-neutral-500">Client has no primary workspace yet.</span>
              )}
            </div>
          )}

          <div>
            <label htmlFor="create-proj-desc" className="mb-1.5 block text-xs font-medium text-neutral-300">
              Client-visible project brief
            </label>
            <textarea
              id="create-proj-desc"
              value={projectDescription}
              onChange={event => setProjectDescription(event.target.value)}
              placeholder="Scope, creative specifications, format requirements, and deliverables"
              maxLength={5000}
              rows={3}
              className="w-full rounded border border-[#333] bg-[#141414] p-3 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="create-proj-stage" className="mb-1 block text-[11px] text-neutral-400">
                Initial stage
              </label>
              <select
                id="create-proj-stage"
                value={projectStage}
                onChange={event => setProjectStage(event.target.value as ProductionStage)}
                className="w-full rounded border border-[#333] bg-[#141414] px-2 py-2 text-xs text-white"
              >
                {STAGES.map(stage => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="create-proj-priority" className="mb-1 block text-[11px] text-neutral-400">
                Priority
              </label>
              <select
                id="create-proj-priority"
                value={projectPriority}
                onChange={event => setProjectPriority(event.target.value as typeof projectPriority)}
                className="w-full rounded border border-[#333] bg-[#141414] px-2 py-2 text-xs text-white"
              >
                {PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="create-proj-audience" className="mb-1 block text-[11px] text-neutral-400">
                Client segment
              </label>
              <select
                id="create-proj-audience"
                value={projectCategory}
                onChange={event => setProjectCategory(event.target.value as typeof projectCategory)}
                className="w-full rounded border border-[#333] bg-[#141414] px-2 py-2 text-xs text-white"
              >
                <option value="artist">Artist</option>
                <option value="label">Label</option>
                <option value="brand">Brand</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div>
              <label htmlFor="create-proj-deadline" className="mb-1 block text-[11px] text-neutral-400">
                Target delivery
              </label>
              <input
                id="create-proj-deadline"
                type="date"
                value={projectDeadline}
                onChange={event => setProjectDeadline(event.target.value)}
                className="w-full rounded border border-[#333] bg-[#141414] px-2 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="create-proj-admin" className="mb-1 block text-[11px] text-neutral-400">
                Assigned platform admin (admin-only)
              </label>
              <select
                id="create-proj-admin"
                value={projectAssignedToUid}
                onChange={event => {
                  const uid = event.target.value;
                  setProjectAssignedToUid(uid);
                  const admin = adminAssigneesByUid.get(uid);
                  if (admin && !projectLead.trim()) setProjectLead(admin.label);
                }}
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
              >
                <option value="">Unassigned / enter name only</option>
                {resolvedAdminAssignees.map(admin => (
                  <option key={admin.uid} value={admin.hasUserDoc ? admin.uid : ''}>
                    {admin.label} · {admin.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="create-proj-lead" className="mb-1 block text-[11px] text-neutral-400">
                Lead producer display name (admin-only)
              </label>
              <input
                id="create-proj-lead"
                value={projectLead}
                onChange={event => setProjectLead(event.target.value)}
                placeholder="Lead producer name"
                className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1E1E1E]">
            <button
              type="button"
              onClick={() => setCreateProjectModalOpen(false)}
              disabled={saving}
              className="rounded border border-[#333] px-4 py-2 text-xs text-neutral-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-[#FF1E1E] px-5 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================
          MODAL: CONTEXT DIALOGS (TASKS, PERSONNEL, DEADLINES, NOTES)
         ============================================================ */}
      <Modal
        isOpen={Boolean(promptDialog)}
        onClose={closePromptDialog}
        maxWidth="md"
        title={
          promptDialog?.type === 'taskAssignment' ? 'Assign task' :
          promptDialog?.type === 'taskDeadline' ? 'Edit task deadline' :
          promptDialog?.type === 'editTask' ? 'Edit production task' :
          promptDialog?.type === 'addSubtask' ? 'Add subtask' :
          promptDialog?.type === 'editNote' ? 'Edit internal note' :
          promptDialog?.type === 'projectDeadline' ? 'Edit project deadline' :
          promptDialog?.type === 'projectTitle' ? 'Edit project title' :
          promptDialog?.type === 'projectDescription' ? 'Edit client-visible description' :
          promptDialog?.type === 'projectPersonnel' ? 'Assign production personnel' : ''
        }
        subtitle={
          promptDialog?.type === 'taskAssignment' ||
          promptDialog?.type === 'taskDeadline' ||
          promptDialog?.type === 'editTask' ||
          promptDialog?.type === 'addSubtask'
            ? promptDialog.task.title
            : selectedProject?.title
        }
      >
        {promptDialog && (
          <form onSubmit={handlePromptSubmit} className="space-y-4">
            {dialogError && (
              <p role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                {dialogError}
              </p>
            )}

            {promptDialog.type === 'taskAssignment' && (
              <>
                <div>
                  <label htmlFor="admin-prod-assignee-select" className="mb-1.5 block text-xs font-medium text-neutral-300">
                    Verified platform admin
                  </label>
                  <select
                    id="admin-prod-assignee-select"
                    value={promptDialog.assigneeUid}
                    onChange={event => {
                      const uid = event.target.value;
                      const match = adminAssigneesByUid.get(uid);
                      setPromptDialog({
                        ...promptDialog,
                        assigneeUid: uid,
                        assignee: match ? match.label : promptDialog.assignee,
                      });
                    }}
                    className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                  >
                    <option value="">Custom name / no UID notification</option>
                    {resolvedAdminAssignees.map(admin => (
                      <option key={admin.uid} value={admin.hasUserDoc ? admin.uid : ''}>
                        {admin.label} · {admin.role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-prod-assignee" className="mb-1.5 block text-xs font-medium text-neutral-300">
                    Assigned display name (private)
                  </label>
                  <input
                    id="admin-prod-assignee"
                    type="text"
                    autoFocus
                    value={promptDialog.assignee}
                    onChange={event => setPromptDialog({ ...promptDialog, assignee: event.target.value })}
                    placeholder="Producer or specialist name"
                    className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                  />
                </div>
              </>
            )}

            {promptDialog.type === 'taskDeadline' && (
              <div>
                <label htmlFor="admin-prod-task-deadline" className="mb-1.5 block text-xs font-medium text-neutral-300">
                  Task deadline (YYYY-MM-DD)
                </label>
                <input
                  id="admin-prod-task-deadline"
                  type="date"
                  autoFocus
                  value={promptDialog.dueDate}
                  onChange={event => setPromptDialog({ ...promptDialog, dueDate: event.target.value })}
                  className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
            )}

            {promptDialog.type === 'editTask' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="edit-task-title" className="mb-1 block text-xs font-medium text-neutral-300">
                    Task title *
                  </label>
                  <input
                    id="edit-task-title"
                    type="text"
                    required
                    maxLength={300}
                    autoFocus
                    value={promptDialog.title}
                    onChange={event => setPromptDialog({ ...promptDialog, title: event.target.value })}
                    className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="edit-task-desc" className="mb-1 block text-xs font-medium text-neutral-300">
                    Task notes / scope (client-visible if shared)
                  </label>
                  <textarea
                    id="edit-task-desc"
                    rows={3}
                    maxLength={5000}
                    value={promptDialog.description}
                    onChange={event => setPromptDialog({ ...promptDialog, description: event.target.value })}
                    className="w-full rounded border border-[#333] bg-[#141414] p-2.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="edit-task-internal" className="mb-1 block text-xs font-medium text-neutral-300">
                    Private internal note (admin-only)
                  </label>
                  <textarea
                    id="edit-task-internal"
                    rows={3}
                    maxLength={5000}
                    value={promptDialog.internalNotes}
                    onChange={event => setPromptDialog({ ...promptDialog, internalNotes: event.target.value })}
                    className="w-full rounded border border-[#333] bg-[#141414] p-2.5 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label htmlFor="edit-task-due" className="mb-1 block text-xs font-medium text-neutral-300">
                      Deadline
                    </label>
                    <input
                      id="edit-task-due"
                      type="date"
                      value={promptDialog.dueDate}
                      onChange={event => setPromptDialog({ ...promptDialog, dueDate: event.target.value })}
                      className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-neutral-300 pt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={promptDialog.clientVisible}
                      onChange={event => setPromptDialog({ ...promptDialog, clientVisible: event.target.checked })}
                    />
                    <span>Visible to client</span>
                  </label>
                </div>
              </div>
            )}

            {promptDialog.type === 'addSubtask' && (
              <div>
                <label htmlFor="admin-prod-subtask-title" className="mb-1.5 block text-xs font-medium text-neutral-300">
                  Subtask title *
                </label>
                <input
                  id="admin-prod-subtask-title"
                  type="text"
                  autoFocus
                  required
                  value={promptDialog.title}
                  onChange={event => setPromptDialog({ ...promptDialog, title: event.target.value })}
                  placeholder="Enter subtask title"
                  className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
            )}

            {promptDialog.type === 'editNote' && (
              <div>
                <label htmlFor="admin-prod-edit-note" className="mb-1.5 block text-xs font-medium text-neutral-300">
                  Internal note *
                </label>
                <textarea
                  id="admin-prod-edit-note"
                  rows={4}
                  autoFocus
                  required
                  value={promptDialog.content}
                  onChange={event => setPromptDialog({ ...promptDialog, content: event.target.value })}
                  className="w-full rounded border border-[#333] bg-[#141414] p-3 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
            )}

            {promptDialog.type === 'projectDeadline' && (
              <div>
                <label htmlFor="admin-prod-project-deadline" className="mb-1.5 block text-xs font-medium text-neutral-300">
                  Expected delivery deadline (YYYY-MM-DD)
                </label>
                <input
                  id="admin-prod-project-deadline"
                  type="date"
                  autoFocus
                  value={promptDialog.expectedDeliveryDate}
                  onChange={event =>
                    setPromptDialog({ ...promptDialog, expectedDeliveryDate: event.target.value })
                  }
                  className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
            )}

            {promptDialog.type === 'projectTitle' && (
              <div>
                <label htmlFor="admin-prod-project-title" className="mb-1.5 block text-xs font-medium text-neutral-300">
                  Project title *
                </label>
                <input
                  id="admin-prod-project-title"
                  type="text"
                  autoFocus
                  required
                  maxLength={160}
                  value={promptDialog.title}
                  onChange={event => setPromptDialog({ ...promptDialog, title: event.target.value })}
                  className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
            )}

            {promptDialog.type === 'projectDescription' && (
              <div>
                <label htmlFor="admin-prod-project-description" className="mb-1.5 block text-xs font-medium text-neutral-300">
                  Client-visible description
                </label>
                <textarea
                  id="admin-prod-project-description"
                  rows={5}
                  autoFocus
                  maxLength={5000}
                  value={promptDialog.description}
                  onChange={event => setPromptDialog({ ...promptDialog, description: event.target.value })}
                  className="w-full rounded border border-[#333] bg-[#141414] p-3 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                />
              </div>
            )}

            {promptDialog.type === 'projectPersonnel' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="admin-prod-personnel-select" className="mb-1 block text-xs font-medium text-neutral-300">
                    Assigned platform admin
                  </label>
                  <select
                    id="admin-prod-personnel-select"
                    value={promptDialog.assignedToUid}
                    onChange={event => {
                      const uid = event.target.value;
                      const match = adminAssigneesByUid.get(uid);
                      setPromptDialog({
                        ...promptDialog,
                        assignedToUid: uid,
                        assignedTo: match ? match.label : promptDialog.assignedTo,
                        leadProducer: promptDialog.leadProducer || (match ? match.label : ''),
                      });
                    }}
                    className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-xs text-white focus:border-[#FF1E1E] focus:outline-none"
                  >
                    <option value="">Unassigned / custom name only</option>
                    {resolvedAdminAssignees.map(admin => (
                      <option key={admin.uid} value={admin.hasUserDoc ? admin.uid : ''}>
                        {admin.label} · {admin.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-prod-project-lead" className="mb-1 block text-xs font-medium text-neutral-300">
                    Lead producer display name (admin-only)
                  </label>
                  <input
                    id="admin-prod-project-lead"
                    type="text"
                    autoFocus
                    value={promptDialog.leadProducer}
                    onChange={event => setPromptDialog({ ...promptDialog, leadProducer: event.target.value })}
                    placeholder="Lead producer name"
                    className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="admin-prod-project-assigned" className="mb-1 block text-xs font-medium text-neutral-300">
                    Assigned producer / specialist name (admin-only)
                  </label>
                  <input
                    id="admin-prod-project-assigned"
                    type="text"
                    value={promptDialog.assignedTo}
                    onChange={event => setPromptDialog({ ...promptDialog, assignedTo: event.target.value })}
                    placeholder="Assigned producer name"
                    className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white focus:border-[#FF1E1E] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closePromptDialog}
                disabled={dialogSaving}
                className="rounded border border-[#333] px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={dialogSaving}
                className="rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {dialogSaving ? 'Saving…' : promptDialog.type === 'addSubtask' ? 'Add subtask' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

const LegacyImportPanel: React.FC<{ clients: ClientProfile[] }> = ({ clients }) => {
  const [snapshot, setSnapshot] = useState<LegacyProductionSnapshot | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [result, setResult] = useState<LegacyImportResult | null>(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  const load = () => {
    try {
      const legacy = readLegacyProductionSnapshot();
      setSnapshot(legacy);
      setAssignments(legacyClientAssignmentSuggestions(legacy, new Set(clients.map(client => client.uid))));
      setResult(null);
      setError('');
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const runImport = async () => {
    if (!snapshot) return;
    setRunning(true);
    setError('');
    try {
      setResult(await importLegacyProduction(snapshot, assignments));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded border border-amber-900/30 bg-[#100E0A] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Import existing browser production data</h2>
          <p className="mt-1 text-xs text-neutral-400">
            Reads local records only; does not delete or overwrite them. Review client assignments before importing.
          </p>
        </div>
        <button type="button" onClick={load} className="rounded border border-[#444] px-3 py-2 text-xs text-white">
          Read this browser’s saved data
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
      {snapshot && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-neutral-300">
            Found {snapshot.projects.length} legacy projects, {snapshot.tasks.length} tasks and {snapshot.workspaces.length} local workspaces on this browser.
          </p>
          {snapshot.projects.map(project => (
            <label
              key={project.id}
              className="grid gap-2 text-xs text-neutral-300 sm:grid-cols-[1fr_260px] sm:items-center"
            >
              <span>
                {project.title || project.id} · {project.internalNotes?.length || 0} private note(s) ·{' '}
                {project.versions?.length || 0} deliverable version(s)
              </span>
              <select
                value={assignments[project.id] || ''}
                onChange={event =>
                  setAssignments(previous => ({ ...previous, [project.id]: event.target.value }))
                }
                className="rounded border border-[#333] bg-[#141414] px-2 py-2 text-white"
              >
                <option value="">Select verified client assignment…</option>
                {clients.map(client => (
                  <option key={client.uid} value={client.uid}>
                    {client.displayName || client.organizationName} · {client.email}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button
            type="button"
            onClick={() => void runImport()}
            disabled={running || (!snapshot.projects.length && !snapshot.tasks.length)}
            className="rounded bg-amber-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {running ? 'Importing…' : 'Import without deleting local records'}
          </button>
          {result && (
            <div className="space-y-1 text-xs text-neutral-300">
              <p>Projects imported/skipped: {result.projectsImported}/{result.projectsSkipped}</p>
              <p>Tasks imported/skipped: {result.tasksImported}/{result.tasksSkipped}</p>
              <p>Notes imported: {result.notesImported} · Deliverables imported: {result.deliverablesImported}</p>
              {result.errors.map((message, index) => (
                <p key={`${index}-${message}`} className="text-amber-300">{message}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AdminProduction;
