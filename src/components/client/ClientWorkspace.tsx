import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { CheckCircle2 } from 'lucide-react';
import { ClientProfile, ClientProject, ProductionActivity, ProductionDeliverable, ProductionNotification, ProductionRevisionRequest, ProductionTask, RequestAttachment, Workspace } from '../../types';
import { useApp } from '../../context/AppContext';
import { db, functions, storage } from '../../lib/firebase';
import { createClientWorkspaceData, ensureClientWorkspace } from '../../lib/clientWorkspace';
import { UNIFIED_PRODUCTION_CATEGORIES } from '../../lib/productionCategories';
import { ClientStudio, ClientStudioSection } from './ClientStudio';
import { ProductionNotificationCenter } from '../common/ProductionNotificationCenter';
import { ClientOnboarding } from './ClientOnboarding';

type ClientTab = 'projects' | 'deliverables' | 'updates' | ClientStudioSection;

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

export const ClientWorkspace: React.FC = () => {
  const { firebaseUser, clientProfile: contextClientProfile, isClientProfileLoading, logout } = useApp();
  const [activeTab, setActiveTab] = useState<ClientTab>('projects');
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('');
  const [workspaceError, setWorkspaceError] = useState('');
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState<'Artist' | 'Brand'>('Artist');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [deliverables, setDeliverables] = useState<ProductionDeliverable[]>([]);
  const [revisions, setRevisions] = useState<ProductionRevisionRequest[]>([]);
  const [activity, setActivity] = useState<ProductionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackByDeliverable, setFeedbackByDeliverable] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestRequirements, setRequestRequirements] = useState('');
  const [requestReferences, setRequestReferences] = useState('');
  const [requestFiles, setRequestFiles] = useState<File[]>([]);
  const [requestCategory, setRequestCategory] = useState<string>(UNIFIED_PRODUCTION_CATEGORIES[1]);
  const [requestDueDate, setRequestDueDate] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestReplyByProject, setRequestReplyByProject] = useState<Record<string, string>>({});
  const [replySubmittingId, setReplySubmittingId] = useState('');
  const [projectStageFilter, setProjectStageFilter] = useState<'all' | 'production' | 'review' | 'delivered'>('all');
  const [requestSuccessSummary, setRequestSuccessSummary] = useState<{ title: string; category: string; filesCount: number; dueDate: string } | null>(null);
  const [profileState, setProfileState] = useState<'loading' | 'required' | 'complete' | 'error'>('loading');
  const [profileError, setProfileError] = useState('');
  const [profileCheck, setProfileCheck] = useState(0);

  useEffect(() => {
    let active = true;
    if (!firebaseUser) {
      setProfileState('error');
      setProfileError('Sign in to access your client workspace.');
      return () => { active = false; };
    }

    setProfileState('loading');
    setProfileError('');
    void getDoc(doc(db, 'clientProfiles', firebaseUser.uid)).then(async snapshot => {
      if (!active) return;
      if (!snapshot.exists() || snapshot.data().onboardingComplete !== true) {
        setProfileState('required');
        return;
      }
      const profile = { uid: firebaseUser.uid, ...snapshot.data() } as ClientProfile;
      setClientProfile(profile);
      try {
        const workspace = await ensureClientWorkspace(firebaseUser.uid);
        if (!active) return;
        setClientProfile({ ...profile, workspaceId: workspace.id });
        setProfileState('complete');
      } catch (workspaceError) {
        if (!active) return;
        setProfileError(messageFromError(workspaceError));
        setProfileState('error');
      }
    }).catch(error => {
      if (!active) return;
      setProfileError(messageFromError(error));
      setProfileState('error');
    });

    return () => { active = false; };
  }, [firebaseUser, profileCheck]);

  useEffect(() => {
    if (!firebaseUser || isClientProfileLoading) return;
    if (!contextClientProfile || contextClientProfile.onboardingComplete !== true) {
      setClientProfile(null);
      setWorkspaces([]);
      setActiveWorkspaceId('');
      setProjects([]);
      setTasks([]);
      setDeliverables([]);
      setRevisions([]);
      setActivity([]);
      setProfileState((current) => (current === 'complete' ? 'required' : current));
      return;
    }
    setClientProfile((previous) => ({
      ...contextClientProfile,
      workspaceId: contextClientProfile.workspaceId || previous?.workspaceId,
    }));
  }, [firebaseUser, contextClientProfile, isClientProfileLoading]);

  useEffect(() => {
    if (!firebaseUser || profileState !== 'complete') return;
    setWorkspaceError('');
    return onSnapshot(
      query(
        collection(db, 'workspaces'),
        where('ownerId', '==', firebaseUser.uid),
        where('status', 'in', ['Active', 'Onboarding']),
      ),
      snapshot => {
        const owned = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Workspace));
        setWorkspaces(owned);
        const available = owned.filter(workspace => !workspace.status || ['Active', 'Onboarding'].includes(workspace.status));
        setActiveWorkspaceId(current => {
          if (available.some(workspace => workspace.id === current)) return current;
          if (clientProfile?.workspaceId && available.some(workspace => workspace.id === clientProfile.workspaceId)) return clientProfile.workspaceId;
          return available[0]?.id || '';
        });
      },
      err => setWorkspaceError(messageFromError(err)),
    );
  }, [firebaseUser, profileState, clientProfile?.workspaceId]);

  useEffect(() => {
    setProjects([]);
    setTasks([]);
    setDeliverables([]);
    setRevisions([]);
    setActivity([]);
    if (!firebaseUser) {
      setLoading(false);
      setError('Sign in to view your client workspace.');
      return;
    }
    if (!activeWorkspaceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    let childUnsubscribers: (() => void)[] = [];
    const unsubscribeProjects = onSnapshot(
      query(
        collection(db, 'clientProjects'),
        where('clientUid', '==', firebaseUser.uid),
        where('workspaceId', '==', activeWorkspaceId),
      ),
      snapshot => {
        setLoading(true);
        const clientProjects = snapshot.docs.map(item => ({
          id: item.id,
          ...item.data(),
          workspaceId: item.data().workspaceId || clientProfile?.workspaceId,
        } as ClientProject));
        setProjects(clientProjects);
        childUnsubscribers.forEach(unsubscribe => unsubscribe());
        childUnsubscribers = [];
        setTasks([]);
        setDeliverables([]);
        setRevisions([]);
        setActivity([]);

        if (clientProjects.length === 0) {
          setLoading(false);
          return;
        }

        const receivedListeners = new Set<string>();
        const totalListeners = clientProjects.length * 4;
        const finishInitialLoad = (listenerId: string) => {
          receivedListeners.add(listenerId);
          if (receivedListeners.size >= totalListeners) setLoading(false);
        };

        for (const project of clientProjects) {
          const projectRef = doc(db, 'clientProjects', project.id);
          childUnsubscribers.push(
            onSnapshot(query(collection(projectRef, 'tasks'),
              where('clientVisible', '==', true),
              where('clientUid', '==', firebaseUser.uid),
              where('projectId', '==', project.id)), snapshot => {
              const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionTask));
              setTasks(previous => [...previous.filter(task => task.projectId !== project.id), ...rows]);
              finishInitialLoad(`${project.id}:tasks`);
            }, err => { setError(messageFromError(err)); setLoading(false); }),
            onSnapshot(query(collection(projectRef, 'deliverables'),
              where('isClientPublished', '==', true),
              where('clientUid', '==', firebaseUser.uid),
              where('projectId', '==', project.id)), snapshot => {
              const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionDeliverable));
              setDeliverables(previous => [...previous.filter(item => item.projectId !== project.id), ...rows]);
              finishInitialLoad(`${project.id}:deliverables`);
            }, err => { setError(messageFromError(err)); setLoading(false); }),
            onSnapshot(query(collection(projectRef, 'revisionRequests'),
              where('clientUid', '==', firebaseUser.uid),
              where('projectId', '==', project.id)), snapshot => {
              const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionRevisionRequest));
              setRevisions(previous => [...previous.filter(item => item.projectId !== project.id), ...rows]);
              finishInitialLoad(`${project.id}:revisions`);
            }, err => { setError(messageFromError(err)); setLoading(false); }),
            onSnapshot(query(collection(projectRef, 'activity'),
              where('clientVisible', '==', true),
              where('projectId', '==', project.id)), snapshot => {
              const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionActivity));
              setActivity(previous => [...previous.filter(item => item.projectId !== project.id), ...rows]);
              finishInitialLoad(`${project.id}:activity`);
            }, err => { setError(messageFromError(err)); setLoading(false); }),
          );
        }
      },
      err => { setError(messageFromError(err)); setLoading(false); },
    );

    return () => {
      unsubscribeProjects();
      childUnsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [firebaseUser, clientProfile?.workspaceId, activeWorkspaceId]);

  const activeWorkspace = workspaces.find(workspace => workspace.id === activeWorkspaceId &&
    (!workspace.status || ['Active', 'Onboarding'].includes(workspace.status)));

  const createWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firebaseUser || !clientProfile || !newWorkspaceName.trim()) return;
    setCreatingWorkspace(true);
    setWorkspaceError('');
    const workspaceRef = doc(collection(db, 'workspaces'));
    const profileForWorkspace: ClientProfile = {
      ...clientProfile,
      accountType: newWorkspaceType,
      organizationName: newWorkspaceName.trim(),
    };
    const workspace = createClientWorkspaceData(firebaseUser.uid, profileForWorkspace, workspaceRef.id);
    try {
      await setDoc(workspaceRef, workspace);
      setActiveWorkspaceId(workspaceRef.id);
      setActiveTab(newWorkspaceType === 'Artist' ? 'profile' : 'brand');
      setNewWorkspaceName('');
      setCreateWorkspaceOpen(false);
    } catch (createError) {
      setWorkspaceError(messageFromError(createError));
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const workspaceProjects = useMemo(
    () => projects.filter(project => project.workspaceId === activeWorkspaceId),
    [projects, activeWorkspaceId],
  );
  const workspaceProjectIds = useMemo(() => new Set(workspaceProjects.map(project => project.id)), [workspaceProjects]);
  const workspaceDeliverables = useMemo(
    () => deliverables.filter(deliverable => workspaceProjectIds.has(deliverable.projectId)),
    [deliverables, workspaceProjectIds],
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

  const review = async (deliverable: ProductionDeliverable, action: 'approve' | 'reject' | 'revision') => {
    const feedback = feedbackByDeliverable[deliverable.id] || '';
    if (action !== 'approve' && !feedback.trim()) {
      setError('Add feedback before rejecting or requesting a revision.');
      return;
    }
    setSubmittingId(deliverable.id);
    setError('');
    try {
      const functionName = action === 'approve'
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
          throw new Error('Choose an active workspace before attaching files.');
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'attachment';
        const storagePath = `workspaces/${activeWorkspace.id}/requests/${firebaseUser.uid}/${requestId}/${safeName}`;
        await uploadBytes(ref(storage, storagePath), file, { contentType: file.type });
        uploadedPaths.push(storagePath);
        attachments.push({ fileName: file.name.slice(0, 120), storagePath, fileType: file.type, fileSize: file.size });
      }
      const requestBrief = [
        `Workspace: ${activeWorkspace?.name || clientProfile?.organizationName || 'Client workspace'}`,
        `Workspace type: ${activeWorkspace?.type || clientProfile?.accountType || 'Client'}`,
        `Requested service: ${requestCategory}`,
        '',
        requestDescription.trim(),
        requestRequirements.trim() ? `Requirements:\n${requestRequirements.trim()}` : '',
        requestReferences.trim() ? `References:\n${requestReferences.trim()}` : '',
      ].filter(Boolean).join('\n').slice(0, 5000);
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
    if (notification.projectId) {
      const targetProject = projects.find(p => p.id === notification.projectId);
      if (targetProject && targetProject.workspaceId && targetProject.workspaceId !== activeWorkspaceId) {
        if (workspaces.some(w => w.id === targetProject.workspaceId)) {
          setActiveWorkspaceId(targetProject.workspaceId);
        }
      }
    }
    const type = (notification.type || '').toLowerCase();
    if (type.includes('deliverable')) {
      setActiveTab('deliverables');
    } else if (type.includes('revision')) {
      setActiveTab('updates');
    } else {
      setActiveTab('projects');
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

  const isArtistWorkspace = activeWorkspace?.clientCategory === 'artist' || activeWorkspace?.type === 'Artist' || activeWorkspace?.type === 'Personal';
  const isBrandWorkspace = activeWorkspace?.clientCategory === 'brand' || activeWorkspace?.type === 'Brand' || activeWorkspace?.type === 'Agency' || activeWorkspace?.clientCategory === 'business' || activeWorkspace?.type === 'Business' || activeWorkspace?.type === 'Enterprise';
  const tabs: { id: ClientTab; title: string }[] = [
    { id: 'projects', title: 'My projects' },
    { id: 'deliverables', title: 'Deliverables' },
    { id: 'updates', title: 'Updates & revisions' },
    { id: 'invoices', title: 'Invoices & Payments' },
    { id: 'proposals', title: 'Proposals & Quotations' },
    ...(isArtistWorkspace ? [
      { id: 'profile' as const, title: 'Artist profile' },
      { id: 'releases' as const, title: 'Music & releases' },
      { id: 'content' as const, title: 'Content engine' },
      { id: 'assets' as const, title: 'Asset library' },
    ] : []),
    ...(isBrandWorkspace ? [
      { id: 'brand' as const, title: 'Brand identity' },
      { id: 'content' as const, title: 'Creative system' },
      { id: 'documents' as const, title: 'Business documents' },
      { id: 'assets' as const, title: 'Asset library' },
    ] : []),
  ];

  if (contextClientProfile?.status === 'Suspended') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4">
        <div className="w-full max-w-lg space-y-4 rounded border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-200">
          <p role="alert">This client account is suspended. Contact KeedoHub support for access.</p>
          <button type="button" onClick={() => void logout()} className="rounded border border-red-300/30 px-4 py-2 text-white hover:bg-red-950/40">Sign out</button>
        </div>
      </main>
    );
  }
  if (profileState === 'loading') {
    return <main className="flex min-h-screen items-center justify-center bg-[#080808] text-sm text-neutral-400">Preparing your secure workspace…</main>;
  }
  if (profileState === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4">
        <div className="w-full max-w-lg space-y-4 border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-200">
          <p role="alert">{profileError}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setProfileCheck(value => value + 1)} className="border border-red-300/30 px-4 py-2 text-white">Retry</button>
            <button type="button" onClick={() => void logout()} className="border border-[#333] bg-[#141414] px-4 py-2 text-neutral-200 hover:text-white">Sign out</button>
          </div>
        </div>
      </main>
    );
  }
  if (profileState === 'required') {
    return <ClientOnboarding onComplete={() => { setProfileState('complete'); setProfileCheck(value => value + 1); }} />;
  }
  if (!activeWorkspace) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4">
        <div className="w-full max-w-lg space-y-3 rounded border border-[#292929] bg-[#0C0C0C] p-6 text-sm text-neutral-300">
          {workspaceError
            ? <p role="alert" className="text-red-300">{workspaceError}</p>
            : workspaces.some(workspace => workspace.status && !['Active', 'Onboarding'].includes(workspace.status))
              ? <p>Your workspace is paused or archived. Contact KeedoHub support to restore access.</p>
              : <p>Loading your private workspace…</p>}
          {workspaceError && <button type="button" onClick={() => setProfileCheck(value => value + 1)} className="border border-[#444] px-3 py-2 text-white">Retry</button>}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3]">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A] bg-[#080808]/95 px-4 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0"><span className="font-black tracking-tight text-white">KEEDO<span className="text-[#FF1E1E]">HUB</span></span><span className="ml-3 hidden text-[10px] font-mono tracking-widest text-neutral-500 sm:inline">UNIFIED WORKSPACE</span></div>
          <label className="flex min-w-0 items-center gap-2">
            <span className="hidden text-[10px] uppercase tracking-widest text-neutral-600 md:inline">Workspace</span>
            <select aria-label="Switch workspace" value={activeWorkspaceId} onChange={event => {
              const nextWorkspace = workspaces.find(workspace => workspace.id === event.target.value);
              setActiveWorkspaceId(event.target.value);
              if (nextWorkspace?.clientCategory === 'artist' || nextWorkspace?.type === 'Artist' || nextWorkspace?.type === 'Personal') setActiveTab('profile');
              else if (nextWorkspace?.clientCategory === 'brand' || nextWorkspace?.clientCategory === 'business' || nextWorkspace?.type === 'Brand' || nextWorkspace?.type === 'Agency' || nextWorkspace?.type === 'Business' || nextWorkspace?.type === 'Enterprise') setActiveTab('brand');
              else setActiveTab('projects');
            }} className="max-w-[42vw] truncate rounded border border-[#292929] bg-[#121212] px-3 py-2 text-xs font-semibold text-white sm:max-w-56">
              {workspaces.filter(workspace => !workspace.status || ['Active', 'Onboarding'].includes(workspace.status)).map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name} · {workspace.clientCategory || workspace.type}</option>)}
            </select>
            <button type="button" onClick={() => { setNewWorkspaceType(isArtistWorkspace ? 'Brand' : 'Artist'); setCreateWorkspaceOpen(true); }} className="rounded border border-[#303030] px-2.5 py-2 text-xs text-neutral-300 hover:border-[#FF1E1E] hover:text-white">+ Workspace</button>
          </label>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-36 truncate text-xs text-neutral-400 lg:inline">{firebaseUser?.displayName || firebaseUser?.email}</span>
          {firebaseUser && <ProductionNotificationCenter uid={firebaseUser.uid} onSelectNotification={handleSelectNotification} />}
          <button onClick={() => { setRequestSuccessSummary(null); setRequestOpen(true); }} className="rounded bg-[#FF1E1E] px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors">New request</button>
          <button onClick={() => void logout()} className="rounded border border-[#292929] bg-[#141414] px-3 py-2 text-xs text-white">Sign out</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF1E1E]">{activeWorkspace.type} OS</p>
        <h1 className="mt-2 text-2xl font-black text-white">{activeWorkspace.name}</h1>
        <p className="mt-1 text-sm text-neutral-400">{isArtistWorkspace ? 'Your music, story and creative work in one artist workspace.' : isBrandWorkspace ? 'Your identity, creative system and production work in one brand workspace.' : 'Project progress, deliverables and your workspace tools.'}</p>
        {workspaceError && <div role="alert" className="mt-4 rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{workspaceError}</div>}
        <nav aria-label="Workspace navigation" className="my-6 flex gap-2 overflow-x-auto border-b border-[#1A1A1A] pb-3">
          {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 rounded px-3 py-2 text-sm ${activeTab === tab.id ? 'bg-white font-semibold text-black' : 'text-neutral-400 hover:bg-[#141414] hover:text-white'}`}>{tab.title}</button>)}
        </nav>
        {error && <div role="alert" className="mb-5 rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
        {['profile', 'releases', 'content', 'assets', 'brand', 'documents', 'invoices', 'proposals'].includes(activeTab) ? (
          <ClientStudio
            section={activeTab as unknown as ClientStudioSection}
            workspace={activeWorkspace}
            uid={firebaseUser?.uid || ''}
            accountName={clientProfile?.displayName || firebaseUser?.displayName || 'Workspace Owner'}
            projects={workspaceProjects}
            primaryWorkspaceId={clientProfile?.workspaceId}
          />
        ) : loading ? <p className="py-12 text-center text-sm text-neutral-400">Loading your projects…</p> : (
          <>
            {activeTab === 'projects' && (
              <div className="space-y-4">
                {/* Project Filter Badges */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[#1A1A1A] pb-3">
                  <span className="text-xs text-neutral-500">Filter:</span>
                  {[
                    { id: 'all' as const, label: 'All projects', count: workspaceProjects.length },
                    { id: 'production' as const, label: 'In production', count: workspaceProjects.filter(p => ['Brief Approved', 'In Production', 'Internal QA', 'Revision Required', 'Ready for Delivery'].includes(p.stage || '')).length },
                    { id: 'review' as const, label: 'Briefs in review', count: workspaceProjects.filter(p => p.requestStatus === 'Pending' || p.requestStatus === 'Clarification Requested' || p.stage === 'New Request').length },
                    { id: 'delivered' as const, label: 'Delivered', count: workspaceProjects.filter(p => p.stage === 'Delivered').length },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setProjectStageFilter(f.id)}
                      className={`rounded px-2.5 py-1 text-xs transition-colors ${
                        projectStageFilter === f.id
                          ? 'border border-red-500/50 bg-red-950/40 text-white font-medium'
                          : 'border border-[#262626] bg-[#121212] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>

                {workspaceProjects.length === 0 && <div className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-8 text-center text-sm text-neutral-400">No projects are assigned to this workspace yet.</div>}
                {workspaceProjects
                  .filter(project => {
                    if (projectStageFilter === 'production') {
                      return ['Brief Approved', 'In Production', 'Internal QA', 'Revision Required', 'Ready for Delivery'].includes(project.stage || '');
                    }
                    if (projectStageFilter === 'review') {
                      return project.requestStatus === 'Pending' || project.requestStatus === 'Clarification Requested' || project.stage === 'New Request';
                    }
                    if (projectStageFilter === 'delivered') {
                      return project.stage === 'Delivered';
                    }
                    return true;
                  })
                  .map(project => {
                    const projectTasks = tasks.filter(task => task.projectId === project.id);
                    const projectRevisions = requestsByProject.get(project.id) || [];
                    return (
                      <article key={project.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="text-lg font-bold text-white">{project.title}</h2>
                            <p className="mt-1 text-sm text-neutral-400">{project.description}</p>
                          </div>
                          <span className="rounded border border-[#333] px-2 py-1 text-xs text-neutral-200">{project.stage || project.status}</span>
                        </div>

                        {/* Request Status & Feedback Banners */}
                        {project.requestStatus === 'Rejected' && (
                          <div className="mt-3 rounded border border-red-900/60 bg-red-950/20 p-3 text-xs text-red-200">
                            <p className="font-semibold text-red-300">Request Declined</p>
                            <p className="mt-1">{project.adminMessage || 'No specific explanation was provided. Contact KeedoHub support or submit an updated brief.'}</p>
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

                        {/* Attachments */}
                        {(project.requestAttachmentsOwnerUid === firebaseUser?.uid || project.clientUid === firebaseUser?.uid) &&
                          project.requestAttachments && project.requestAttachments.length > 0 && (
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

                        {/* Request Conversation History */}
                        {project.requestHistory && project.requestHistory.length > 0 && (
                          <details className="mt-3 rounded border border-[#242424] bg-[#101010] p-3">
                            <summary className="cursor-pointer text-xs font-semibold text-neutral-300">Request conversation · {project.requestHistory.length} message(s)</summary>
                            <ol className="mt-3 space-y-3">{project.requestHistory.map((entry, index) => (
                              <li key={`${entry.createdAt}-${index}`} className="border-l border-[#444] pl-3">
                                <p className="text-[10px] text-neutral-500">{entry.authorName} · {entry.authorRole} · {new Date(entry.createdAt).toLocaleString()}</p>
                                <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-300">{entry.message}</p>
                              </li>
                            ))}</ol>
                          </details>
                        )}

                        {/* Clarification Request Input */}
                        {project.requestStatus === 'Clarification Requested' && (
                          <div className="mt-3 space-y-2 rounded border border-amber-900/40 bg-amber-950/10 p-3">
                            {project.adminMessage && <p className="text-xs text-amber-100 font-medium">{project.adminMessage}</p>}
                            <textarea value={requestReplyByProject[project.id] || ''} onChange={event => setRequestReplyByProject(previous => ({ ...previous, [project.id]: event.target.value }))} maxLength={3000} rows={3} placeholder="Reply with the requested details…" className="w-full rounded border border-[#333] bg-[#141414] p-2 text-sm text-white" />
                            <button type="button" disabled={replySubmittingId === project.id || !requestReplyByProject[project.id]?.trim()} onClick={() => void replyToRequest(project)} className="rounded bg-[#FF1E1E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{replySubmittingId === project.id ? 'Sending…' : 'Send clarification'}</button>
                          </div>
                        )}

                        {/* Progress */}
                        <div className="mt-4 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded bg-[#252525]"><div className="h-full bg-[#FF1E1E]" style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }} /></div>
                          <span className="text-xs text-neutral-300">{project.progress || 0}%</span>
                        </div>
                        <p className={`mt-2 text-xs ${project.expectedDeliveryDate && project.expectedDeliveryDate < new Date().toISOString().slice(0, 10) && project.stage !== 'Delivered' ? 'text-amber-300' : 'text-neutral-500'}`}>
                          Expected delivery: {project.expectedDeliveryDate || 'To be confirmed'}
                          {project.expectedDeliveryDate && project.expectedDeliveryDate < new Date().toISOString().slice(0, 10) && project.stage !== 'Delivered' ? ' · Overdue' : ''}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-1">{STAGE_ORDER.map((stage, index) => {
                          const currentIndex = STAGE_ORDER.indexOf(project.stage || 'New Request');
                          const reached = index <= currentIndex;
                          return <span key={stage} className={`rounded px-2 py-1 text-[10px] ${reached ? 'bg-red-950/50 text-red-200' : 'bg-[#161616] text-neutral-600'}`}>{stage}</span>;
                        })}</div>
                        {projectTasks.length > 0 && <div className="mt-4 border-t border-[#222] pt-3"><h3 className="text-xs font-semibold text-neutral-300">Shared tasks</h3>{projectTasks.map(task => {
                          const overdue = Boolean(task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'Done');
                          return <div key={task.id} className="mt-2 flex justify-between gap-2 text-xs"><span className="text-neutral-300">{task.title}</span><span className={overdue ? 'text-amber-300' : 'text-neutral-500'}>{task.status}{task.dueDate ? ` · Due ${task.dueDate}` : ''}{overdue ? ' · Overdue' : ''}</span></div>;
                        })}</div>}
                        {projectRevisions.length > 0 && <p className="mt-3 text-xs text-neutral-500">{projectRevisions.length} revision request(s) · latest: {projectRevisions[0].status}</p>}
                      </article>
                    );
                  })}
              </div>
            )}

            {activeTab === 'deliverables' && (
              <div className="grid gap-4 md:grid-cols-2">
                {workspaceDeliverables.length === 0 && <p className="text-sm text-neutral-500">No deliverables have been published for review.</p>}
                {workspaceDeliverables.map(deliverable => {
                  const project = projectById.get(deliverable.projectId);
                  const feedback = feedbackByDeliverable[deliverable.id] || '';
                  const waiting = deliverable.reviewStatus === 'Awaiting Review' || deliverable.reviewStatus === 'Revised - Awaiting Review';
                  const deliverableRevisions = workspaceRevisions.filter(r => r.deliverableId === deliverable.id);
                  return (
                    <article key={deliverable.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500">{project?.title || 'Project'}</p>
                        <span className="rounded bg-[#1C1C1C] border border-[#333] px-2 py-0.5 text-[11px] font-mono text-neutral-300">
                          v{deliverable.currentVersion || 1} (Latest)
                        </span>
                      </div>
                      <h2 className="mt-1 font-bold text-white">{deliverable.title}</h2>
                      {deliverable.description && <p className="mt-2 text-sm text-neutral-400">{deliverable.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-2 py-0.5 text-xs font-medium ${
                          deliverable.reviewStatus === 'Approved'
                            ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                            : deliverable.reviewStatus === 'Rejected'
                            ? 'border-red-800/60 bg-red-950/30 text-red-300'
                            : deliverable.reviewStatus === 'Revision Requested' || deliverable.reviewStatus === 'Revision In Progress'
                            ? 'border-amber-800/60 bg-amber-950/30 text-amber-300'
                            : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                        }`}>
                          {deliverable.reviewStatus}
                        </span>
                        {deliverable.approvedAt && (
                          <span className="text-[11px] text-emerald-400">
                            Approved {new Date(deliverable.approvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {deliverable.fileUrl && (
                        <div className="mt-3 space-y-2">
                          {deliverable.fileType.startsWith('image/') && <img src={deliverable.fileUrl} alt={deliverable.title} className="max-h-80 max-w-full rounded border border-[#292929] object-contain" />}
                          {deliverable.fileType.startsWith('video/') && <video controls preload="metadata" src={deliverable.fileUrl} className="max-h-80 w-full rounded" />}
                          {deliverable.fileType.startsWith('audio/') && <audio controls preload="metadata" src={deliverable.fileUrl} className="w-full" />}
                          {deliverable.fileType === 'application/pdf' && <iframe title={`${deliverable.title} preview`} src={deliverable.fileUrl} className="h-80 w-full rounded border border-[#292929]" />}
                          <a href={deliverable.fileUrl} download={deliverable.fileName} target="_blank" rel="noreferrer" className="inline-block text-sm text-red-300 underline">Download · {deliverable.fileName}</a>
                        </div>
                      )}
                      {deliverable.versions && deliverable.versions.length > 1 && (
                        <details className="mt-3 text-xs text-neutral-400">
                          <summary className="cursor-pointer">Previous version history ({deliverable.versions.length})</summary>
                          <ol className="mt-2 space-y-1">
                            {[...deliverable.versions].reverse().map(version => (
                              <li key={version.version}>
                                <a href={version.fileUrl} download={version.fileName} target="_blank" rel="noreferrer" className="text-red-300 underline">
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
                          <summary className="cursor-pointer font-semibold text-neutral-300">Revision requests for this deliverable ({deliverableRevisions.length})</summary>
                          <div className="mt-2 space-y-2">
                            {deliverableRevisions.map(rev => (
                              <div key={rev.id} className="rounded border border-[#292929] bg-[#141414] p-2">
                                <div className="flex justify-between text-[11px] text-neutral-500">
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
                          <textarea value={feedback} onChange={event => setFeedbackByDeliverable(previous => ({ ...previous, [deliverable.id]: event.target.value }))} placeholder="Feedback (required to reject or request a revision)" rows={3} maxLength={5000} className="w-full rounded border border-[#333] bg-[#141414] p-2 text-sm text-white" />
                          <div className="flex flex-wrap gap-2">
                            <button disabled={submittingId === deliverable.id} onClick={() => void review(deliverable, 'approve')} className="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve</button>
                            <button disabled={submittingId === deliverable.id || !feedback.trim()} onClick={() => void review(deliverable, 'reject')} className="rounded border border-red-900 px-3 py-2 text-xs text-red-200 disabled:opacity-50">Reject</button>
                            <button disabled={submittingId === deliverable.id || !feedback.trim()} onClick={() => void review(deliverable, 'revision')} className="rounded border border-[#444] px-3 py-2 text-xs text-white disabled:opacity-50">Request revision</button>
                          </div>
                        </div>
                      )}
                      {deliverable.reviewStatus === 'Rejected' && <p className="mt-3 rounded border border-red-900/50 bg-red-950/20 p-2 text-xs text-red-200">Rejected: {deliverable.feedback || 'No feedback was provided.'}</p>}
                    </article>
                  );
                })}
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="space-y-3">
                {workspaceActivity.length === 0 && workspaceRevisions.length === 0 && <p className="text-sm text-neutral-500">No client-visible updates yet.</p>}
                {recentActivity.map(item => (
                  <article key={item.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4">
                    <p className="text-sm font-semibold text-white">{item.action}</p>
                    <p className="mt-1 text-sm text-neutral-400">{item.details}</p>
                    <p className="mt-2 text-[10px] text-neutral-600">{projectById.get(item.projectId)?.title || 'Project'} · {item.createdAt}</p>
                  </article>
                ))}
                {recentRevisions.map(item => {
                  const project = projectById.get(item.projectId);
                  const deliverable = deliverables.find(d => d.id === item.deliverableId);
                  return (
                    <article key={item.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">Revision · {item.status}</span>
                        <span className="text-[10px] text-neutral-500">{new Date(item.submittedAt).toLocaleDateString()}</span>
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
                        <p className="mt-2 text-[11px] text-neutral-500 italic">Awaiting response from production team</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          {requestSuccessSummary ? (
            <div className="w-full max-w-lg space-y-4 rounded-xl border border-emerald-900/60 bg-[#0C0C0C] p-6 text-center shadow-2xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-lg font-bold text-white">Creative Request Submitted</h2>
              <p className="text-xs text-neutral-400">
                Your request has been routed to the KeedoHub production team.
              </p>
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
                }}
                className="w-full rounded bg-[#FF1E1E] px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Back to Workspace
              </button>
            </div>
          ) : (
            <form onSubmit={submitRequest} className="w-full max-w-lg space-y-3 rounded-xl border border-[#292929] bg-[#0C0C0C] p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Submit a production request</h2>
                <button type="button" onClick={() => setRequestOpen(false)} className="text-sm text-neutral-400 hover:text-white">Close</button>
              </div>
              <input value={requestTitle} onChange={event => setRequestTitle(event.target.value)} maxLength={160} required placeholder="Project title" className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
              <select value={requestCategory} onChange={event => setRequestCategory(event.target.value)} className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white">
                {UNIFIED_PRODUCTION_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <textarea value={requestDescription} onChange={event => setRequestDescription(event.target.value)} maxLength={5000} required rows={5} placeholder="Describe the work and deliverables" className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
              <textarea value={requestRequirements} onChange={event => setRequestRequirements(event.target.value)} maxLength={3000} rows={3} placeholder="Requirements, specifications or deliverables" className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
              <textarea value={requestReferences} onChange={event => setRequestReferences(event.target.value)} maxLength={2000} rows={2} placeholder="Reference links or creative examples" className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
              <label className="block text-xs text-neutral-400">Reference files · up to 5 files, 100 MB total
                <input type="file" multiple accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif,image/avif,audio/mpeg,audio/wav,audio/x-wav,audio/aac,audio/flac,audio/mp4,audio/m4a,audio/ogg,video/mp4,video/webm,video/quicktime,application/pdf,application/json,application/xml,application/zip,application/x-zip-compressed,font/ttf,font/otf,font/woff,font/woff2,text/plain,text/xml" onChange={event => {
                  const files = Array.from(event.target.files || []);
                  const allowedType = /^(image\/(jpeg|png|svg\+xml|webp|gif|avif)|audio\/(mpeg|wav|x-wav|aac|flac|mp4|m4a|ogg)|video\/(mp4|webm|quicktime)|application\/(pdf|json|xml|zip|x-zip-compressed|font-woff)|font\/(ttf|otf|woff|woff2)|text\/(plain|xml))$/;
                  const invalid = files.length > 5 || files.some(file => file.size <= 0 || file.size >= 50 * 1024 * 1024 || !allowedType.test(file.type)) || files.reduce((total, file) => total + file.size, 0) > 100 * 1024 * 1024;
                  if (invalid) {
                    setRequestFiles([]);
                    setError('Choose up to five supported files, each under 50 MB and no more than 100 MB total.');
                    event.target.value = '';
                    return;
                  }
                  setError('');
                  setRequestFiles(files);
                }} className="mt-1 block w-full text-xs text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-[#252525] file:px-3 file:py-2 file:text-xs file:text-white" />
              </label>
              {requestFiles.length > 0 && <p className="text-[11px] text-neutral-500">{requestFiles.map(file => file.name).join(' · ')}</p>}
              <label className="block text-xs text-neutral-400">Requested delivery date<input type="date" value={requestDueDate} onChange={event => setRequestDueDate(event.target.value)} className="mt-1 block rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" /></label>
              <button disabled={requestSubmitting} className="w-full rounded bg-[#FF1E1E] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{requestSubmitting ? 'Submitting…' : 'Submit request'}</button>
            </form>
          )}
        </div>
      )}
      {createWorkspaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form onSubmit={createWorkspace} className="w-full max-w-md space-y-4 rounded-xl border border-[#292929] bg-[#0C0C0C] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#FF1E1E]">One KeedoHub workspace</p><h2 className="mt-1 text-lg font-bold text-white">Add an Artist or Brand space</h2><p className="mt-1 text-xs text-neutral-400">Each space has its own private profile, creative library and working files.</p></div>
              <button type="button" onClick={() => setCreateWorkspaceOpen(false)} aria-label="Close" className="text-neutral-500 hover:text-white">×</button>
            </div>
            <label className="block text-xs text-neutral-400">Workspace name<input autoFocus required maxLength={100} value={newWorkspaceName} onChange={event => setNewWorkspaceName(event.target.value)} placeholder="Artist or brand name" className="mt-1.5 w-full rounded border border-[#333] bg-[#141414] px-3 py-2.5 text-sm text-white" /></label>
            <label className="block text-xs text-neutral-400">Experience<select value={newWorkspaceType} onChange={event => setNewWorkspaceType(event.target.value as 'Artist' | 'Brand')} className="mt-1.5 w-full rounded border border-[#333] bg-[#141414] px-3 py-2.5 text-sm text-white"><option value="Artist">Artist OS</option><option value="Brand">Brand OS</option></select></label>
            {workspaceError && <p role="alert" className="text-xs text-red-300">{workspaceError}</p>}
            <button disabled={creatingWorkspace} className="w-full rounded bg-[#FF1E1E] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{creatingWorkspace ? 'Creating workspace…' : 'Create workspace'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClientWorkspace;
