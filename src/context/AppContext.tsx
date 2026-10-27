import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, 
  AppModule, 
  Artist, 
  MusicRelease, 
  CreativeCampaign, 
  CorporateDocument, 
  BrandAsset, 
  OperationTask, 
  ActivityLog, 
  PressRelease, 
  MediaContact, 
  BloggerThemeSettings,
  BrandGuidelinesData,
  PlatformUser,
  Workspace,
  WorkspaceBrand,
  WorkspaceMembership,
  CreativeProject,
  AppMode,
  ProductionProject,
  ProductionStage,
  ProductionPriority,
  ProductionProjectType,
  DeliverableVersion,
  ProductionNote,
  ProductionQualityCheck,
  ServicePackage,
  MotionProjectSpec,
  ReleaseDeliverableItem,
  DeliverableWorkflowStage
} from '../types';
import { ReleaseProject, CampaignDesign } from '../types/campaign';
import { 
  INITIAL_PLATFORM_USER,
  INITIAL_WORKSPACES,
  INITIAL_MEMBERSHIPS,
  INITIAL_ARTISTS, 
  INITIAL_RELEASES, 
  INITIAL_CAMPAIGNS, 
  INITIAL_DOCUMENTS, 
  INITIAL_BRAND_ASSETS, 
  INITIAL_TASKS, 
  INITIAL_ACTIVITY, 
  INITIAL_PRESS_RELEASES, 
  INITIAL_MEDIA_CONTACTS, 
  INITIAL_BLOGGER_SETTINGS,
  INITIAL_BRAND_GUIDELINES,
  INITIAL_PRODUCTION_PROJECTS,
  INITIAL_SERVICE_PACKAGES,
  INITIAL_MOTION_PROJECTS
} from '../data/initialData';
import { 
  auth, 
  googleProvider, 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AppContextType {
  // Firebase Auth & Session
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // Application Mode (Public Landing vs Client Workspace)
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  enterWorkspace: (workspaceId?: string) => void;
  exitToPublic: () => void;

  activeModule: AppModule;
  setActiveModule: (module: AppModule) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Data entities
  artists: Artist[];
  releases: MusicRelease[];
  campaigns: CreativeCampaign[];
  documents: CorporateDocument[];
  brandAssets: BrandAsset[];
  tasks: OperationTask[];
  activities: ActivityLog[];
  pressReleases: PressRelease[];
  mediaContacts: MediaContact[];
  bloggerSettings: BloggerThemeSettings;
  brandGuidelines: BrandGuidelinesData;
  releaseProjects: ReleaseProject[];
  campaignDesigns: CampaignDesign[];

  // Workspace state
  currentUser: PlatformUser;
  workspaces: Workspace[];
  memberships: WorkspaceMembership[];
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (workspace: Omit<Workspace, 'id' | 'createdAt'>) => Workspace;
  updateWorkspaceBrand: (workspaceId: string, updates: Partial<WorkspaceBrand>) => void;
  submitClientRequest: (request: { title: string; category: OperationTask['category']; dueDate: string; notes: string; priority: OperationTask['priority'] }) => OperationTask;
  approveDeliverable: (releaseId: string) => void;

  // Phase 3: Production Center
  productionProjects: ProductionProject[];
  canAccessProductionCenter: boolean;
  addProductionProject: (project: Omit<ProductionProject, 'id' | 'createdAt' | 'updatedAt'>) => ProductionProject;
  updateProductionProject: (id: string, updates: Partial<ProductionProject>) => void;
  deleteProductionProject: (id: string) => void;
  updateProductionStage: (id: string, stage: ProductionStage, note?: string) => void;
  publishDeliverableVersion: (projectId: string, versionId: string, isPublished: boolean) => void;
  addDeliverableVersion: (projectId: string, version: Omit<DeliverableVersion, 'id' | 'uploadedAt'>) => DeliverableVersion;
  addProductionNote: (projectId: string, note: Omit<ProductionNote, 'id' | 'timestamp'>) => ProductionNote;
  toggleQualityCheck: (projectId: string, checkId: string) => void;

  // Phase 4: Admin / Operator Control Center
  servicePackages: ServicePackage[];
  canAccessAdminCenter: boolean;
  addServicePackage: (pkg: Omit<ServicePackage, 'id' | 'createdAt' | 'updatedAt'>) => ServicePackage;
  updateServicePackage: (id: string, updates: Partial<ServicePackage>) => void;
  deleteServicePackage: (id: string) => void;
  toggleServicePackageActive: (id: string) => void;
  updateWorkspaceStatus: (workspaceId: string, status: 'Active' | 'Onboarding' | 'Paused' | 'Archived') => void;
  updateWorkspaceDetails: (workspaceId: string, updates: Partial<Workspace>) => void;
  assignServicePackageToWorkspace: (workspaceId: string, packageId: string) => void;
  removeServicePackageFromWorkspace: (workspaceId: string, packageId: string) => void;

  // Phase 5: Music Release & Motion Production
  motionProjects: MotionProjectSpec[];
  addMotionProject: (project: Omit<MotionProjectSpec, 'id' | 'createdAt' | 'updatedAt'>) => MotionProjectSpec;
  updateMotionProject: (id: string, updates: Partial<MotionProjectSpec>) => void;
  deleteMotionProject: (id: string) => void;
  updateReleaseDeliverables: (releaseId: string, deliverables: ReleaseDeliverableItem[]) => void;
  updateDeliverableStage: (releaseId: string, deliverableId: string, stage: DeliverableWorkflowStage) => void;
  publishDeliverableToClient: (releaseId: string, deliverableId: string, isPublished: boolean) => void;
  clientApproveReleaseDeliverable: (releaseId: string, deliverableId: string, feedback?: string) => void;
  clientRequestRevisionDeliverable: (releaseId: string, deliverableId: string, feedback: string) => void;

  // Actions
  addArtist: (artist: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>) => Artist;
  updateArtist: (id: string, updates: Partial<Artist>) => void;
  deleteArtist: (id: string) => void;

  addRelease: (release: Omit<MusicRelease, 'id' | 'createdAt'>) => MusicRelease;
  updateRelease: (id: string, updates: Partial<MusicRelease>) => void;
  deleteRelease: (id: string) => void;

  addCampaign: (campaign: Omit<CreativeCampaign, 'id' | 'createdAt'>) => CreativeCampaign;
  updateCampaign: (id: string, updates: Partial<CreativeCampaign>) => void;
  deleteCampaign: (id: string) => void;

  addDocument: (doc: Omit<CorporateDocument, 'id' | 'createdAt' | 'updatedAt'>) => CorporateDocument;
  updateDocument: (id: string, updates: Partial<CorporateDocument>) => void;
  deleteDocument: (id: string) => void;

  addBrandAsset: (asset: Omit<BrandAsset, 'id' | 'uploadedAt'>) => BrandAsset;
  updateBrandAsset: (id: string, updates: Partial<BrandAsset>) => void;
  deleteBrandAsset: (id: string) => void;

  addTask: (task: Omit<OperationTask, 'id' | 'createdAt'>) => OperationTask;
  updateTask: (id: string, updates: Partial<OperationTask>) => void;
  deleteTask: (id: string) => void;

  addPressRelease: (pr: Omit<PressRelease, 'id'>) => PressRelease;
  updatePressRelease: (id: string, updates: Partial<PressRelease>) => void;
  deletePressRelease: (id: string) => void;

  addMediaContact: (contact: Omit<MediaContact, 'id'>) => MediaContact;
  updateMediaContact: (id: string, updates: Partial<MediaContact>) => void;
  deleteMediaContact: (id: string) => void;

  addReleaseProject: (project: Omit<ReleaseProject, 'id' | 'createdAt' | 'updatedAt'>) => ReleaseProject;
  updateReleaseProject: (id: string, updates: Partial<ReleaseProject>) => void;
  deleteReleaseProject: (id: string) => void;

  addCampaignDesign: (design: Omit<CampaignDesign, 'id' | 'createdAt' | 'updatedAt'>) => CampaignDesign;
  updateCampaignDesign: (id: string, updates: Partial<CampaignDesign>) => void;
  deleteCampaignDesign: (id: string) => void;

  updateBloggerSettings: (settings: Partial<BloggerThemeSettings>) => void;
  updateBrandGuidelines: (guidelines: Partial<BrandGuidelinesData>) => void;
  
  logActivity: (action: string, module: AppModule, details: string) => void;

  // State utility
  resetToSampleData: () => void;
  clearAllData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;

  // Quick Action Modal control
  isQuickActionOpen: boolean;
  setIsQuickActionOpen: (open: boolean) => void;
  quickActionTarget: 'release' | 'artist' | 'document' | 'campaign' | 'task' | 'releaseProject' | null;
  openQuickAction: (target: 'release' | 'artist' | 'document' | 'campaign' | 'task' | 'releaseProject') => void;
}

const STORAGE_KEY = 'lyrical_ent_studio_state_v1';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appMode, setAppMode] = useState<AppMode>(() => {
    try {
      const saved = localStorage.getItem('keedohub_app_mode');
      return (saved === 'workspace') ? 'workspace' : 'public';
    } catch {
      return 'public';
    }
  });

  const enterWorkspace = (workspaceId?: string) => {
    if (workspaceId) {
      switchWorkspace(workspaceId);
    }
    setAppMode('workspace');
    try {
      localStorage.setItem('keedohub_app_mode', 'workspace');
    } catch {}
  };

  const exitToPublic = () => {
    setAppMode('public');
    try {
      localStorage.setItem('keedohub_app_mode', 'public');
    } catch {}
  };

  const [activeModule, setActiveModule] = useState<AppModule>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('Executive');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickActionTarget, setQuickActionTarget] = useState<'release' | 'artist' | 'document' | 'campaign' | 'task' | 'releaseProject' | null>(null);

  // Load from local storage or initial seed
  const [artists, setArtists] = useState<Artist[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_artists`);
      return stored ? JSON.parse(stored) : INITIAL_ARTISTS;
    } catch {
      return INITIAL_ARTISTS;
    }
  });

  const [releases, setReleases] = useState<MusicRelease[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_releases`);
      return stored ? JSON.parse(stored) : INITIAL_RELEASES;
    } catch {
      return INITIAL_RELEASES;
    }
  });

  const [campaigns, setCampaigns] = useState<CreativeCampaign[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_campaigns`);
      return stored ? JSON.parse(stored) : INITIAL_CAMPAIGNS;
    } catch {
      return INITIAL_CAMPAIGNS;
    }
  });

  const [documents, setDocuments] = useState<CorporateDocument[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_documents`);
      return stored ? JSON.parse(stored) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_brandAssets`);
      return stored ? JSON.parse(stored) : INITIAL_BRAND_ASSETS;
    } catch {
      return INITIAL_BRAND_ASSETS;
    }
  });

  const [productionProjects, setProductionProjects] = useState<ProductionProject[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_productionProjects`);
      return stored ? JSON.parse(stored) : INITIAL_PRODUCTION_PROJECTS;
    } catch {
      return INITIAL_PRODUCTION_PROJECTS;
    }
  });

  const [tasks, setTasks] = useState<OperationTask[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      return stored ? JSON.parse(stored) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_activities`);
      return stored ? JSON.parse(stored) : INITIAL_ACTIVITY;
    } catch {
      return INITIAL_ACTIVITY;
    }
  });

  const [pressReleases, setPressReleases] = useState<PressRelease[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_pressReleases`);
      return stored ? JSON.parse(stored) : INITIAL_PRESS_RELEASES;
    } catch {
      return INITIAL_PRESS_RELEASES;
    }
  });

  const [mediaContacts, setMediaContacts] = useState<MediaContact[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_mediaContacts`);
      return stored ? JSON.parse(stored) : INITIAL_MEDIA_CONTACTS;
    } catch {
      return INITIAL_MEDIA_CONTACTS;
    }
  });

  const [bloggerSettings, setBloggerSettings] = useState<BloggerThemeSettings>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_bloggerSettings`);
      return stored ? { ...INITIAL_BLOGGER_SETTINGS, ...JSON.parse(stored) } : INITIAL_BLOGGER_SETTINGS;
    } catch {
      return INITIAL_BLOGGER_SETTINGS;
    }
  });

  const [brandGuidelines, setBrandGuidelines] = useState<BrandGuidelinesData>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_brandGuidelines`);
      return stored ? JSON.parse(stored) : INITIAL_BRAND_GUIDELINES;
    } catch {
      return INITIAL_BRAND_GUIDELINES;
    }
  });

  const [releaseProjects, setReleaseProjects] = useState<ReleaseProject[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_releaseProjects`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [campaignDesigns, setCampaignDesigns] = useState<CampaignDesign[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_campaignDesigns`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [servicePackages, setServicePackages] = useState<ServicePackage[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_servicePackages`);
      return stored ? JSON.parse(stored) : INITIAL_SERVICE_PACKAGES;
    } catch {
      return INITIAL_SERVICE_PACKAGES;
    }
  });

  const [motionProjects, setMotionProjects] = useState<MotionProjectSpec[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_motionProjects`);
      return stored ? JSON.parse(stored) : INITIAL_MOTION_PROJECTS;
    } catch {
      return INITIAL_MOTION_PROJECTS;
    }
  });

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<PlatformUser>(INITIAL_PLATFORM_USER);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsAuthLoading(false);
      if (user) {
        const liveUser: PlatformUser = {
          id: user.uid,
          name: user.displayName || 'Keedohub Member',
          email: user.email || 'user@keedohub.com',
          status: 'Active',
          avatarUrl: user.photoURL || undefined,
          createdAt: new Date().toISOString()
        };
        setCurrentUser(liveUser);

        // Sync authenticated user profile to Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Keedohub Member',
            photoURL: user.photoURL || '',
            role: 'Executive',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn('Firestore user profile sync warning:', err);
        }
      } else {
        setCurrentUser(INITIAL_PLATFORM_USER);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res?.user) {
        enterWorkspace();
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-blocked'
      ) {
        console.info('Google Sign-In popup closed or cancelled by user.');
        return;
      }
      console.error('Google Sign-In Error:', err);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      exitToPublic();
    } catch (err) {
      console.error('Sign-Out Error:', err);
    }
  };

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_workspaces`);
      return stored ? JSON.parse(stored) : INITIAL_WORKSPACES;
    } catch {
      return INITIAL_WORKSPACES;
    }
  });

  const [memberships] = useState<WorkspaceMembership[]>(INITIAL_MEMBERSHIPS);
  
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(() => {
    try {
      const storedId = localStorage.getItem(`${STORAGE_KEY}_activeWorkspaceId`);
      const ws = workspaces.find(w => w.id === storedId) || workspaces[0];
      return ws;
    } catch {
      return workspaces[0];
    }
  });

  // Migration logic for existing data
  useEffect(() => {
    const defaultWsId = INITIAL_WORKSPACES[0].id;
    
    setArtists(prev => prev.map(a => a.workspaceId ? a : { ...a, workspaceId: defaultWsId }));
    setReleases(prev => prev.map(r => r.workspaceId ? r : { ...r, workspaceId: defaultWsId }));
    setCampaigns(prev => prev.map(c => c.workspaceId ? c : { ...c, workspaceId: defaultWsId }));
    setDocuments(prev => prev.map(d => d.workspaceId ? d : { ...d, workspaceId: defaultWsId }));
    setBrandAssets(prev => prev.map(b => b.workspaceId ? b : { ...b, workspaceId: defaultWsId }));
    setTasks(prev => prev.map(t => t.workspaceId ? t : { ...t, workspaceId: defaultWsId }));
    setPressReleases(prev => prev.map(p => p.workspaceId ? p : { ...p, workspaceId: defaultWsId }));
    setMediaContacts(prev => prev.map(m => m.workspaceId ? m : { ...m, workspaceId: defaultWsId }));

    // Ensure client sample workspaces and entities exist if starting from previously saved session
    setWorkspaces(prev => {
      const existingIds = new Set(prev.map(w => w.id));
      const missing = INITIAL_WORKSPACES.filter(w => !existingIds.has(w.id));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });

    setReleases(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const missing = INITIAL_RELEASES.filter(r => !existingIds.has(r.id));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });

    setDocuments(prev => {
      const existingIds = new Set(prev.map(d => d.id));
      const missing = INITIAL_DOCUMENTS.filter(d => !existingIds.has(d.id));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });

    setBrandAssets(prev => {
      const existingIds = new Set(prev.map(b => b.id));
      const missing = INITIAL_BRAND_ASSETS.filter(b => !existingIds.has(b.id));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });

    setTasks(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const missing = INITIAL_TASKS.filter(t => !existingIds.has(t.id));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
  }, []);

  const switchWorkspace = (workspaceId: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      setActiveWorkspace(ws);
      localStorage.setItem(`${STORAGE_KEY}_activeWorkspaceId`, workspaceId);
      logActivity('Switched Workspace', 'dashboard', `Moved to ${ws.name} workspace`);

      // Guard cross-category module exposure
      const cat = ws.clientCategory || (ws.type === 'Artist' ? 'artist' : ws.type === 'Brand' ? 'brand' : 'label');
      if (cat === 'artist' && ['documents', 'cards', 'blogger'].includes(activeModule)) {
        setActiveModule('dashboard');
      } else if (cat === 'brand' && ['artists', 'releases', 'celebration', 'promotion'].includes(activeModule)) {
        setActiveModule('dashboard');
      }
    }
  };

  const createWorkspace = (workspaceData: Omit<Workspace, 'id' | 'createdAt'>): Workspace => {
    const newWs: Workspace = {
      ...workspaceData,
      id: `ws-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString()
    };
    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspace(newWs);
    setActiveModule('dashboard');
    try {
      localStorage.setItem(`${STORAGE_KEY}_activeWorkspaceId`, newWs.id);
    } catch {}
    logActivity('Created Workspace', 'dashboard', `Created new ${newWs.type} workspace: "${newWs.name}"`);
    return newWs;
  };

  const updateWorkspaceBrand = (workspaceId: string, updates: Partial<WorkspaceBrand>) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === workspaceId) {
        const updated = {
          ...w,
          brand: { ...w.brand, ...updates }
        };
        if (activeWorkspace.id === workspaceId) {
          setActiveWorkspace(updated);
        }
        return updated;
      }
      return w;
    }));
    logActivity('Updated Workspace Brand', 'brand', `Modified brand parameters for workspace ${workspaceId}`);
  };

  const submitClientRequest = (requestData: {
    title: string;
    category: OperationTask['category'];
    dueDate: string;
    notes: string;
    priority: OperationTask['priority'];
  }): OperationTask => {
    const newTask: OperationTask = {
      id: `req-${Date.now().toString().slice(-5)}`,
      workspaceId: activeWorkspace.id,
      title: requestData.title,
      category: requestData.category,
      dueDate: requestData.dueDate,
      priority: requestData.priority,
      assignee: 'KeedoHub Creative Team',
      status: 'In Review',
      notes: requestData.notes,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
    logActivity('Client Creative Request', 'operations', `Submitted creative brief: "${newTask.title}"`);

    // Bridge client request directly into Operator Production Center
    const newProdProject: ProductionProject = {
      id: `prod-${Date.now().toString().slice(-5)}`,
      title: requestData.title,
      workspaceId: activeWorkspace.id,
      clientName: activeWorkspace.name,
      clientCategory: activeWorkspace.clientCategory || 'brand',
      projectType: requestData.category === 'Creative' ? 'Cover Artwork Design' : requestData.category === 'Marketing' ? 'Marketing Campaign Kit' : 'Corporate Contract & Stationery',
      stage: 'New Request',
      priority: requestData.priority,
      leadProducer: 'KeedoHub Operator',
      dueDate: requestData.dueDate,
      brief: {
        description: requestData.notes,
        deliverableSpecs: 'Client-submitted creative request. Awaiting operator brief review.'
      },
      sourceMaterials: [],
      versions: [],
      internalNotes: [
        {
          id: `not-${Date.now()}`,
          author: 'System Intake',
          role: 'System',
          content: `Intake ticket created from ${activeWorkspace.name} (${activeWorkspace.clientCategory || 'Client'}) request submission.`,
          timestamp: new Date().toISOString(),
          isInternalOnly: true
        }
      ],
      qualityChecks: [
        { id: `qc-${Date.now()}-1`, label: 'Review brief & confirm deliverable specs', passed: false },
        { id: `qc-${Date.now()}-2`, label: 'Assign lead producer', passed: false }
      ],
      relatedTaskId: newTask.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProductionProjects(prev => [newProdProject, ...prev]);

    return newTask;
  };

  const approveDeliverable = (releaseId: string) => {
    setReleases(prev => prev.map(r => {
      if (r.id === releaseId) {
        return {
          ...r,
          checklist: {
            ...r.checklist,
            artworkApproved: true
          }
        };
      }
      return r;
    }));

    // Synchronize approval state into matching Production Project
    setProductionProjects(prev => prev.map(p => {
      if (p.relatedReleaseId === releaseId || (p.workspaceId === activeWorkspace.id && p.projectType.includes('Release'))) {
        const updatedVersions = p.versions.map(v => 
          v.isClientPublished ? { ...v, clientReviewStatus: 'Approved' as const, clientFeedback: 'Approved by client in workspace portal' } : v
        );
        return {
          ...p,
          stage: 'Ready for Delivery' as const,
          versions: updatedVersions,
          updatedAt: new Date().toISOString(),
          internalNotes: [
            {
              id: `not-${Date.now()}`,
              author: 'Client Verification',
              role: 'Client',
              content: 'Client executed artwork approval sign-off in workspace review gate.',
              timestamp: new Date().toISOString(),
              isInternalOnly: true
            },
            ...p.internalNotes
          ]
        };
      }
      return p;
    }));

    logActivity('Approved Deliverable', 'releases', `Client signed off on artwork for release ${releaseId}`);
  };

  // Operator access check
  const canAccessProductionCenter = 
    currentRole === 'Executive' || 
    currentRole === 'Label Manager' || 
    currentRole === 'Creative Director' || 
    currentRole === 'A&R Director' || 
    activeWorkspace.id === 'ws-lyrical-ent';

  const addProductionProject = (projectData: Omit<ProductionProject, 'id' | 'createdAt' | 'updatedAt'>): ProductionProject => {
    const newProj: ProductionProject = {
      ...projectData,
      id: `prod-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProductionProjects(prev => [newProj, ...prev]);
    logActivity('Created Production Project', 'production', `Initiated project: "${newProj.title}" for ${newProj.clientName}`);
    return newProj;
  };

  const updateProductionProject = (id: string, updates: Partial<ProductionProject>) => {
    setProductionProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
    logActivity('Updated Production Project', 'production', `Updated project records: ${id}`);
  };

  const deleteProductionProject = (id: string) => {
    const proj = productionProjects.find(p => p.id === id);
    setProductionProjects(prev => prev.filter(p => p.id !== id));
    logActivity('Deleted Production Project', 'production', `Removed project: "${proj?.title || id}"`);
  };

  const updateProductionStage = (id: string, stage: ProductionStage, noteText?: string) => {
    setProductionProjects(prev => prev.map(p => {
      if (p.id === id) {
        const notes = noteText ? [
          {
            id: `not-${Date.now()}`,
            author: 'Ojo Abdulkareem',
            role: currentRole,
            content: noteText,
            timestamp: new Date().toISOString(),
            isInternalOnly: true
          },
          ...p.internalNotes
        ] : p.internalNotes;

        return {
          ...p,
          stage,
          updatedAt: new Date().toISOString(),
          deliveredAt: stage === 'Delivered' ? (p.deliveredAt || new Date().toISOString()) : p.deliveredAt,
          internalNotes: notes
        };
      }
      return p;
    }));
    logActivity('Updated Production Stage', 'production', `Transitioned project ${id} to stage: "${stage}"`);
  };

  const publishDeliverableVersion = (projectId: string, versionId: string, isPublished: boolean) => {
    setProductionProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedVersions = p.versions.map(v => {
          if (v.id === versionId) {
            return {
              ...v,
              isClientPublished: isPublished,
              publishedAt: isPublished ? new Date().toISOString() : undefined,
              clientReviewStatus: isPublished ? (v.clientReviewStatus || 'Pending') : undefined
            };
          }
          return v;
        });
        return {
          ...p,
          versions: updatedVersions,
          updatedAt: new Date().toISOString(),
          internalNotes: [
            {
              id: `not-${Date.now()}`,
              author: 'Ojo Abdulkareem',
              role: currentRole,
              content: isPublished 
                ? `Published version ${versionId} to client portal for review.`
                : `Unpublished version ${versionId} from client view.`,
              timestamp: new Date().toISOString(),
              isInternalOnly: true
            },
            ...p.internalNotes
          ]
        };
      }
      return p;
    }));
  };

  const addDeliverableVersion = (projectId: string, versionData: Omit<DeliverableVersion, 'id' | 'uploadedAt'>): DeliverableVersion => {
    const newVer: DeliverableVersion = {
      ...versionData,
      id: `ver-${Date.now().toString().slice(-5)}`,
      uploadedAt: new Date().toISOString(),
      publishedAt: versionData.isClientPublished ? new Date().toISOString() : undefined
    };
    setProductionProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          versions: [newVer, ...p.versions],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    return newVer;
  };

  const addProductionNote = (projectId: string, noteData: Omit<ProductionNote, 'id' | 'timestamp'>): ProductionNote => {
    const newNote: ProductionNote = {
      ...noteData,
      id: `not-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString()
    };
    setProductionProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          internalNotes: [newNote, ...p.internalNotes],
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
    return newNote;
  };

  const toggleQualityCheck = (projectId: string, checkId: string) => {
    setProductionProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const updatedChecks = p.qualityChecks.map(qc => {
          if (qc.id === checkId) {
            const passed = !qc.passed;
            return {
              ...qc,
              passed,
              verifiedBy: passed ? currentRole : undefined,
              verifiedAt: passed ? new Date().toISOString() : undefined
            };
          }
          return qc;
        });
        return {
          ...p,
          qualityChecks: updatedChecks,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // Phase 4: Admin / Operator Access & Management
  const canAccessAdminCenter = 
    activeWorkspace.id === 'ws-lyrical-ent' && 
    (currentRole === 'Executive' || currentRole === 'Label Manager');

  const addServicePackage = (pkgData: Omit<ServicePackage, 'id' | 'createdAt' | 'updatedAt'>): ServicePackage => {
    const newPkg: ServicePackage = {
      ...pkgData,
      id: `pkg-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setServicePackages(prev => [newPkg, ...prev]);
    logActivity('Created Service Package', 'admin', `Created package "${newPkg.name}" (${newPkg.category})`);
    return newPkg;
  };

  const updateServicePackage = (id: string, updates: Partial<ServicePackage>) => {
    setServicePackages(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
    logActivity('Updated Service Package', 'admin', `Modified package specs for ${id}`);
  };

  const deleteServicePackage = (id: string) => {
    setServicePackages(prev => prev.filter(p => p.id !== id));
    logActivity('Deleted Service Package', 'admin', `Removed service package ${id}`);
  };

  const toggleServicePackageActive = (id: string) => {
    setServicePackages(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p));
    logActivity('Toggled Service Status', 'admin', `Toggled catalog status for package ${id}`);
  };

  const updateWorkspaceStatus = (workspaceId: string, status: 'Active' | 'Onboarding' | 'Paused' | 'Archived') => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === workspaceId) {
        const updated = { ...w, status, updatedAt: new Date().toISOString() };
        if (activeWorkspace.id === workspaceId) {
          setActiveWorkspace(updated);
        }
        return updated;
      }
      return w;
    }));
    logActivity('Updated Workspace Status', 'admin', `Workspace ${workspaceId} status updated to ${status}`);
  };

  const updateWorkspaceDetails = (workspaceId: string, updates: Partial<Workspace>) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === workspaceId) {
        const updated = { ...w, ...updates, updatedAt: new Date().toISOString() };
        if (activeWorkspace.id === workspaceId) {
          setActiveWorkspace(updated);
        }
        return updated;
      }
      return w;
    }));
    logActivity('Updated Workspace Details', 'admin', `Updated configuration for workspace ${workspaceId}`);
  };

  const assignServicePackageToWorkspace = (workspaceId: string, packageId: string) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === workspaceId) {
        const currentPackages = w.contractedPackageIds || [];
        if (currentPackages.includes(packageId)) return w;
        const updated = {
          ...w,
          contractedPackageIds: [...currentPackages, packageId],
          updatedAt: new Date().toISOString()
        };
        if (activeWorkspace.id === workspaceId) {
          setActiveWorkspace(updated);
        }
        return updated;
      }
      return w;
    }));
    logActivity('Assigned Service Package', 'admin', `Assigned package ${packageId} to client workspace ${workspaceId}`);
  };

  const removeServicePackageFromWorkspace = (workspaceId: string, packageId: string) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === workspaceId) {
        const currentPackages = w.contractedPackageIds || [];
        const updated = {
          ...w,
          contractedPackageIds: currentPackages.filter(pid => pid !== packageId),
          updatedAt: new Date().toISOString()
        };
        if (activeWorkspace.id === workspaceId) {
          setActiveWorkspace(updated);
        }
        return updated;
      }
      return w;
    }));
    logActivity('Removed Service Package', 'admin', `Removed package ${packageId} from client workspace ${workspaceId}`);
  };

  // Phase 5: Music Release & Motion Production Methods
  const addMotionProject = (projectData: Omit<MotionProjectSpec, 'id' | 'createdAt' | 'updatedAt'>): MotionProjectSpec => {
    const newProj: MotionProjectSpec = {
      ...projectData,
      id: `mot-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setMotionProjects(prev => [newProj, ...prev]);
    logActivity('Created Motion Project', 'motion', `Created motion project: "${newProj.title}"`);
    return newProj;
  };

  const updateMotionProject = (id: string, updates: Partial<MotionProjectSpec>) => {
    setMotionProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
    logActivity('Updated Motion Project', 'motion', `Updated motion project ${id}`);
  };

  const deleteMotionProject = (id: string) => {
    setMotionProjects(prev => prev.filter(p => p.id !== id));
    logActivity('Deleted Motion Project', 'motion', `Removed motion project ${id}`);
  };

  const updateReleaseDeliverables = (releaseId: string, deliverables: ReleaseDeliverableItem[]) => {
    setReleases(prev => prev.map(r => r.id === releaseId ? { ...r, deliverables } : r));
    logActivity('Updated Release Deliverables', 'releases', `Updated deliverables checklist for release ${releaseId}`);
  };

  const updateDeliverableStage = (releaseId: string, deliverableId: string, stage: DeliverableWorkflowStage) => {
    setReleases(prev => prev.map(r => {
      if (r.id === releaseId) {
        const updatedDeliverables = (r.deliverables || []).map(d => 
          d.id === deliverableId ? { ...d, stage } : d
        );
        return { ...r, deliverables: updatedDeliverables };
      }
      return r;
    }));
    logActivity('Updated Deliverable Stage', 'releases', `Stage set to "${stage}" for deliverable ${deliverableId}`);
  };

  const publishDeliverableToClient = (releaseId: string, deliverableId: string, isPublished: boolean) => {
    setReleases(prev => prev.map(r => {
      if (r.id === releaseId) {
        const updatedDeliverables = (r.deliverables || []).map(d => 
          d.id === deliverableId ? { 
            ...d, 
            isClientPublished: isPublished, 
            publishedAt: isPublished ? new Date().toISOString() : undefined 
          } : d
        );
        return { ...r, deliverables: updatedDeliverables };
      }
      return r;
    }));
    logActivity('Published Deliverable', 'releases', `${isPublished ? 'Published' : 'Unpublished'} deliverable ${deliverableId} for client review`);
  };

  const clientApproveReleaseDeliverable = (releaseId: string, deliverableId: string, feedback?: string) => {
    setReleases(prev => prev.map(r => {
      if (r.id === releaseId) {
        const updatedDeliverables = (r.deliverables || []).map(d => 
          d.id === deliverableId ? { 
            ...d, 
            stage: 'Delivered' as const, 
            clientApproved: true, 
            approvedAt: new Date().toISOString(),
            clientFeedback: feedback || 'Approved by client'
          } : d
        );
        const allApproved = updatedDeliverables.length > 0 && updatedDeliverables.every(d => d.clientApproved);
        return { 
          ...r, 
          deliverables: updatedDeliverables,
          clientApprovalStatus: allApproved ? 'Approved' as const : r.clientApprovalStatus,
          clientApprovalDate: allApproved ? new Date().toISOString() : r.clientApprovalDate,
          checklist: {
            ...r.checklist,
            artworkApproved: true
          }
        };
      }
      return r;
    }));
    logActivity('Client Deliverable Signoff', 'releases', `Client approved deliverable ${deliverableId}`);
  };

  const clientRequestRevisionDeliverable = (releaseId: string, deliverableId: string, feedback: string) => {
    setReleases(prev => prev.map(r => {
      if (r.id === releaseId) {
        const updatedDeliverables = (r.deliverables || []).map(d => 
          d.id === deliverableId ? { 
            ...d, 
            stage: 'Revision Required' as const, 
            revisionCount: d.revisionCount + 1,
            clientFeedback: feedback 
          } : d
        );
        return { 
          ...r, 
          deliverables: updatedDeliverables,
          clientApprovalStatus: 'Revision Requested' as const
        };
      }
      return r;
    }));
    logActivity('Client Revision Request', 'releases', `Client requested revision on deliverable ${deliverableId}: "${feedback}"`);
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_artists`, JSON.stringify(artists));
      localStorage.setItem(`${STORAGE_KEY}_releases`, JSON.stringify(releases));
      localStorage.setItem(`${STORAGE_KEY}_campaigns`, JSON.stringify(campaigns));
      localStorage.setItem(`${STORAGE_KEY}_documents`, JSON.stringify(documents));
      localStorage.setItem(`${STORAGE_KEY}_brandAssets`, JSON.stringify(brandAssets));
      localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
      localStorage.setItem(`${STORAGE_KEY}_productionProjects`, JSON.stringify(productionProjects));
      localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
      localStorage.setItem(`${STORAGE_KEY}_pressReleases`, JSON.stringify(pressReleases));
      localStorage.setItem(`${STORAGE_KEY}_mediaContacts`, JSON.stringify(mediaContacts));
      localStorage.setItem(`${STORAGE_KEY}_bloggerSettings`, JSON.stringify(bloggerSettings));
      localStorage.setItem(`${STORAGE_KEY}_brandGuidelines`, JSON.stringify(brandGuidelines));
      localStorage.setItem(`${STORAGE_KEY}_releaseProjects`, JSON.stringify(releaseProjects));
      localStorage.setItem(`${STORAGE_KEY}_campaignDesigns`, JSON.stringify(campaignDesigns));
      localStorage.setItem(`${STORAGE_KEY}_servicePackages`, JSON.stringify(servicePackages));
      localStorage.setItem(`${STORAGE_KEY}_motionProjects`, JSON.stringify(motionProjects));
      localStorage.setItem(`${STORAGE_KEY}_workspaces`, JSON.stringify(workspaces));
      localStorage.setItem(`${STORAGE_KEY}_activeWorkspaceId`, activeWorkspace.id);
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [artists, releases, campaigns, documents, brandAssets, tasks, activities, pressReleases, mediaContacts, bloggerSettings, brandGuidelines, releaseProjects, campaignDesigns, productionProjects, servicePackages, motionProjects, workspaces]);

  const logActivity = (action: string, module: AppModule, details: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Ojo Abdulkareem',
      role: currentRole,
      action,
      module,
      details
    };
    setActivities(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const addArtist = (artistData: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>): Artist => {
    const newArtist: Artist = {
      ...artistData,
      workspaceId: activeWorkspace.id,
      id: `art-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setArtists(prev => [newArtist, ...prev]);
    logActivity('Added Artist', 'artists', `Added artist profile for ${newArtist.name}`);
    return newArtist;
  };

  const updateArtist = (id: string, updates: Partial<Artist>) => {
    setArtists(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
    logActivity('Updated Artist', 'artists', `Updated profile records for ID: ${id}`);
  };

  const deleteArtist = (id: string) => {
    const artist = artists.find(a => a.id === id);
    setArtists(prev => prev.filter(a => a.id !== id));
    logActivity('Deleted Artist', 'artists', `Removed artist profile ${artist?.name || id}`);
  };

  const addRelease = (releaseData: Omit<MusicRelease, 'id' | 'createdAt'>): MusicRelease => {
    const newRelease: MusicRelease = {
      ...releaseData,
      workspaceId: activeWorkspace.id,
      id: `rel-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString()
    };
    setReleases(prev => [newRelease, ...prev]);
    logActivity('Scheduled Release', 'releases', `Created release entry: "${newRelease.title}" (${newRelease.type})`);
    return newRelease;
  };

  const updateRelease = (id: string, updates: Partial<MusicRelease>) => {
    setReleases(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    logActivity('Updated Release', 'releases', `Updated release record ID: ${id}`);
  };

  const deleteRelease = (id: string) => {
    const rel = releases.find(r => r.id === id);
    setReleases(prev => prev.filter(r => r.id !== id));
    logActivity('Deleted Release', 'releases', `Removed release "${rel?.title || id}"`);
  };

  const addCampaign = (campaignData: Omit<CreativeCampaign, 'id' | 'createdAt'>): CreativeCampaign => {
    const newCamp: CreativeCampaign = {
      ...campaignData,
      workspaceId: activeWorkspace.id,
      id: `camp-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString()
    };
    setCampaigns(prev => [newCamp, ...prev]);
    logActivity('Initiated Campaign', 'campaigns', `Launched campaign: "${newCamp.title}"`);
    return newCamp;
  };

  const updateCampaign = (id: string, updates: Partial<CreativeCampaign>) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    logActivity('Updated Campaign', 'campaigns', `Updated campaign ID: ${id}`);
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    logActivity('Deleted Campaign', 'campaigns', `Removed campaign ID: ${id}`);
  };

  const addDocument = (docData: Omit<CorporateDocument, 'id' | 'createdAt' | 'updatedAt'>): CorporateDocument => {
    const newDoc: CorporateDocument = {
      ...docData,
      workspaceId: activeWorkspace.id,
      id: `doc-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setDocuments(prev => [newDoc, ...prev]);
    logActivity('Generated Document', 'documents', `Created ${newDoc.type.toUpperCase()}: ${newDoc.title}`);
    return newDoc;
  };

  const updateDocument = (id: string, updates: Partial<CorporateDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
    logActivity('Updated Document', 'documents', `Modified document reference: ${id}`);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    logActivity('Deleted Document', 'documents', `Removed document ID: ${id}`);
  };

  const addBrandAsset = (assetData: Omit<BrandAsset, 'id' | 'uploadedAt'>): BrandAsset => {
    const newAsset: BrandAsset = {
      ...assetData,
      workspaceId: activeWorkspace.id,
      id: `brand-${Date.now().toString().slice(-5)}`,
      uploadedAt: new Date().toISOString()
    };
    setBrandAssets(prev => [newAsset, ...prev]);
    logActivity('Uploaded Brand Asset', 'brand', `Added ${newAsset.name} (${newAsset.version})`);
    return newAsset;
  };

  const updateBrandAsset = (id: string, updates: Partial<BrandAsset>) => {
    setBrandAssets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    logActivity('Updated Brand Asset', 'brand', `Updated asset metadata ID: ${id}`);
  };

  const deleteBrandAsset = (id: string) => {
    setBrandAssets(prev => prev.filter(b => b.id !== id));
    logActivity('Archived Asset', 'brand', `Archived brand asset ID: ${id}`);
  };

  const addTask = (taskData: Omit<OperationTask, 'id' | 'createdAt'>): OperationTask => {
    const newTask: OperationTask = {
      ...taskData,
      workspaceId: activeWorkspace.id,
      id: `tsk-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [newTask, ...prev]);
    logActivity('Created Task', 'operations', `Assigned task: "${newTask.title}"`);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<OperationTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addPressRelease = (prData: Omit<PressRelease, 'id'>): PressRelease => {
    const newPr: PressRelease = {
      ...prData,
      workspaceId: activeWorkspace.id,
      id: `pr-${Date.now().toString().slice(-5)}`
    };
    setPressReleases(prev => [newPr, ...prev]);
    logActivity('Drafted Press Release', 'press', `Composed: "${newPr.title}"`);
    return newPr;
  };

  const updatePressRelease = (id: string, updates: Partial<PressRelease>) => {
    setPressReleases(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePressRelease = (id: string) => {
    setPressReleases(prev => prev.filter(p => p.id !== id));
  };

  const addMediaContact = (contactData: Omit<MediaContact, 'id'>): MediaContact => {
    const newContact: MediaContact = {
      ...contactData,
      workspaceId: activeWorkspace.id,
      id: `med-${Date.now().toString().slice(-5)}`
    };
    setMediaContacts(prev => [newContact, ...prev]);
    return newContact;
  };

  const updateMediaContact = (id: string, updates: Partial<MediaContact>) => {
    setMediaContacts(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMediaContact = (id: string) => {
    setMediaContacts(prev => prev.filter(m => m.id !== id));
  };

  const addReleaseProject = (projectData: Omit<ReleaseProject, 'id' | 'createdAt' | 'updatedAt'>): ReleaseProject => {
    const newProject: ReleaseProject = {
      ...projectData,
      workspaceId: activeWorkspace.id,
      id: `proj-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setReleaseProjects(prev => [newProject, ...prev]);
    logActivity('Created Release Project', 'campaigns', `New campaign studio project: "${newProject.songTitle}"`);
    return newProject;
  };

  const updateReleaseProject = (id: string, updates: Partial<ReleaseProject>) => {
    setReleaseProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  };

  const deleteReleaseProject = (id: string) => {
    setReleaseProjects(prev => prev.filter(p => p.id !== id));
    // Also cleanup associated designs
    setCampaignDesigns(prev => prev.filter(d => d.projectId !== id));
  };

  const addCampaignDesign = (designData: Omit<CampaignDesign, 'id' | 'createdAt' | 'updatedAt'>): CampaignDesign => {
    const newDesign: CampaignDesign = {
      ...designData,
      id: `cdes-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCampaignDesigns(prev => [newDesign, ...prev]);
    return newDesign;
  };

  const updateCampaignDesign = (id: string, updates: Partial<CampaignDesign>) => {
    setCampaignDesigns(prev => prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
  };

  const deleteCampaignDesign = (id: string) => {
    setCampaignDesigns(prev => prev.filter(d => d.id !== id));
  };

  const updateBloggerSettings = (updates: Partial<BloggerThemeSettings>) => {
    setBloggerSettings(prev => ({ ...prev, ...updates }));
    logActivity('Updated Blogger Theme', 'blogger', 'Adjusted XML theme layout configurations');
  };

  const updateBrandGuidelines = (updates: Partial<BrandGuidelinesData>) => {
    setBrandGuidelines(prev => ({ ...prev, ...updates }));
    logActivity('Updated Brand Guidelines', 'brand', 'Saved revisions to brand voice and usage rules');
  };

  const resetToSampleData = () => {
    setArtists(INITIAL_ARTISTS);
    setReleases(INITIAL_RELEASES);
    setCampaigns(INITIAL_CAMPAIGNS);
    setDocuments(INITIAL_DOCUMENTS);
    setBrandAssets(INITIAL_BRAND_ASSETS);
    setTasks(INITIAL_TASKS);
    setProductionProjects(INITIAL_PRODUCTION_PROJECTS);
    setActivities(INITIAL_ACTIVITY);
    setPressReleases(INITIAL_PRESS_RELEASES);
    setMediaContacts(INITIAL_MEDIA_CONTACTS);
    setBloggerSettings(INITIAL_BLOGGER_SETTINGS);
    setBrandGuidelines(INITIAL_BRAND_GUIDELINES);
    setServicePackages(INITIAL_SERVICE_PACKAGES);
    setMotionProjects(INITIAL_MOTION_PROJECTS);
    logActivity('Reset Database', 'dashboard', 'Restored official LYRICAL ENT production sample records');
  };

  const clearAllData = () => {
    setArtists([]);
    setReleases([]);
    setCampaigns([]);
    setDocuments([]);
    setBrandAssets([]);
    setTasks([]);
    setProductionProjects([]);
    setActivities([]);
    setPressReleases([]);
    setMediaContacts([]);
    setServicePackages([]);
    setMotionProjects([]);
    logActivity('Cleared Database', 'dashboard', 'All operational records cleared to empty state');
  };

  const exportDatabaseJson = (): string => {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      label: 'LYRICAL ENT',
      artists,
      releases,
      campaigns,
      documents,
      brandAssets,
      tasks,
      activities,
      pressReleases,
      mediaContacts,
      bloggerSettings,
      brandGuidelines,
      servicePackages,
      motionProjects
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.artists)) setArtists(data.artists);
      if (Array.isArray(data.releases)) setReleases(data.releases);
      if (Array.isArray(data.campaigns)) setCampaigns(data.campaigns);
      if (Array.isArray(data.documents)) setDocuments(data.documents);
      if (Array.isArray(data.brandAssets)) setBrandAssets(data.brandAssets);
      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.productionProjects)) setProductionProjects(data.productionProjects);
      if (Array.isArray(data.activities)) setActivities(data.activities);
      if (Array.isArray(data.pressReleases)) setPressReleases(data.pressReleases);
      if (Array.isArray(data.mediaContacts)) setMediaContacts(data.mediaContacts);
      if (Array.isArray(data.servicePackages)) setServicePackages(data.servicePackages);
      if (Array.isArray(data.motionProjects)) setMotionProjects(data.motionProjects);
      if (data.bloggerSettings) setBloggerSettings(data.bloggerSettings);
      if (data.brandGuidelines) setBrandGuidelines(data.brandGuidelines);
      logActivity('Imported Database', 'export', 'Restored database snapshot from external file');
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  };

  const openQuickAction = (target: 'release' | 'artist' | 'document' | 'campaign' | 'task' | 'releaseProject') => {
    setQuickActionTarget(target);
    setIsQuickActionOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        appMode,
        setAppMode,
        enterWorkspace,
        exitToPublic,
        firebaseUser,
        isAuthenticated: !!firebaseUser,
        isAuthLoading,
        loginWithGoogle,
        logout,
        activeModule,
        setActiveModule,
        currentRole,
        setCurrentRole,
        searchQuery,
        setSearchQuery,
        artists,
        releases,
        campaigns,
        documents,
        brandAssets,
        tasks,
        activities,
        pressReleases,
        mediaContacts,
        bloggerSettings,
        brandGuidelines,
        releaseProjects,
        campaignDesigns,
        addArtist,
        updateArtist,
        deleteArtist,
        addRelease,
        updateRelease,
        deleteRelease,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        addDocument,
        updateDocument,
        deleteDocument,
        addBrandAsset,
        updateBrandAsset,
        deleteBrandAsset,
        addTask,
        updateTask,
        deleteTask,
        addPressRelease,
        updatePressRelease,
        deletePressRelease,
        addMediaContact,
        updateMediaContact,
        deleteMediaContact,
        addReleaseProject,
        updateReleaseProject,
        deleteReleaseProject,
        addCampaignDesign,
        updateCampaignDesign,
        deleteCampaignDesign,
        updateBloggerSettings,
        updateBrandGuidelines,
        logActivity,
        resetToSampleData,
        clearAllData,
        exportDatabaseJson,
        importDatabaseJson,
        isQuickActionOpen,
        setIsQuickActionOpen,
        quickActionTarget,
        openQuickAction,
        currentUser,
        workspaces,
        memberships,
        activeWorkspace,
        setActiveWorkspace,
        switchWorkspace,
        createWorkspace,
        updateWorkspaceBrand,
        submitClientRequest,
        approveDeliverable,
        productionProjects,
        canAccessProductionCenter,
        addProductionProject,
        updateProductionProject,
        deleteProductionProject,
        updateProductionStage,
        publishDeliverableVersion,
        addDeliverableVersion,
        addProductionNote,
        toggleQualityCheck,
        // Phase 4: Admin / Operator Control Center
        servicePackages,
        canAccessAdminCenter,
        addServicePackage,
        updateServicePackage,
        deleteServicePackage,
        toggleServicePackageActive,
        updateWorkspaceStatus,
        updateWorkspaceDetails,
        assignServicePackageToWorkspace,
        removeServicePackageFromWorkspace,
        // Phase 5: Music Release & Motion Production
        motionProjects,
        addMotionProject,
        updateMotionProject,
        deleteMotionProject,
        updateReleaseDeliverables,
        updateDeliverableStage,
        publishDeliverableToClient,
        clientApproveReleaseDeliverable,
        clientRequestRevisionDeliverable
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
