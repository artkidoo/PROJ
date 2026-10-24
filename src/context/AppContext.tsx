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
  BrandGuidelinesData 
} from '../types';
import { ReleaseProject, CampaignDesign } from '../types/campaign';
import { 
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
  INITIAL_BRAND_GUIDELINES 
} from '../data/initialData';

interface AppContextType {
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

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_artists`, JSON.stringify(artists));
      localStorage.setItem(`${STORAGE_KEY}_releases`, JSON.stringify(releases));
      localStorage.setItem(`${STORAGE_KEY}_campaigns`, JSON.stringify(campaigns));
      localStorage.setItem(`${STORAGE_KEY}_documents`, JSON.stringify(documents));
      localStorage.setItem(`${STORAGE_KEY}_brandAssets`, JSON.stringify(brandAssets));
      localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
      localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
      localStorage.setItem(`${STORAGE_KEY}_pressReleases`, JSON.stringify(pressReleases));
      localStorage.setItem(`${STORAGE_KEY}_mediaContacts`, JSON.stringify(mediaContacts));
      localStorage.setItem(`${STORAGE_KEY}_bloggerSettings`, JSON.stringify(bloggerSettings));
      localStorage.setItem(`${STORAGE_KEY}_brandGuidelines`, JSON.stringify(brandGuidelines));
      localStorage.setItem(`${STORAGE_KEY}_releaseProjects`, JSON.stringify(releaseProjects));
      localStorage.setItem(`${STORAGE_KEY}_campaignDesigns`, JSON.stringify(campaignDesigns));
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
  }, [artists, releases, campaigns, documents, brandAssets, tasks, activities, pressReleases, mediaContacts, bloggerSettings, brandGuidelines, releaseProjects, campaignDesigns]);

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
    setActivities(INITIAL_ACTIVITY);
    setPressReleases(INITIAL_PRESS_RELEASES);
    setMediaContacts(INITIAL_MEDIA_CONTACTS);
    setBloggerSettings(INITIAL_BLOGGER_SETTINGS);
    setBrandGuidelines(INITIAL_BRAND_GUIDELINES);
    logActivity('Reset Database', 'dashboard', 'Restored official LYRICAL ENT production sample records');
  };

  const clearAllData = () => {
    setArtists([]);
    setReleases([]);
    setCampaigns([]);
    setDocuments([]);
    setBrandAssets([]);
    setTasks([]);
    setActivities([]);
    setPressReleases([]);
    setMediaContacts([]);
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
      brandGuidelines
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
      if (Array.isArray(data.activities)) setActivities(data.activities);
      if (Array.isArray(data.pressReleases)) setPressReleases(data.pressReleases);
      if (Array.isArray(data.mediaContacts)) setMediaContacts(data.mediaContacts);
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
        openQuickAction
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
