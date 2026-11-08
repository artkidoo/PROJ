import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ClientProject, ProductionActivity, ProductionDeliverable, ProductionRevisionRequest, ProductionTask } from '../../types';
import { useApp } from '../../context/AppContext';
import { db, functions } from '../../lib/firebase';
import { ProductionNotificationCenter } from '../common/ProductionNotificationCenter';
import { ClientOnboarding } from './ClientOnboarding';

type ClientTab = 'projects' | 'deliverables' | 'updates';

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
  const { firebaseUser, logout } = useApp();
  const [activeTab, setActiveTab] = useState<ClientTab>('projects');
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
  const [requestCategory, setRequestCategory] = useState('Creative');
  const [requestDueDate, setRequestDueDate] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
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
    void getDoc(doc(db, 'clientProfiles', firebaseUser.uid)).then(snapshot => {
      if (!active) return;
      setProfileState(snapshot.exists() && snapshot.data().onboardingComplete === true ? 'complete' : 'required');
    }).catch(error => {
      if (!active) return;
      setProfileError(messageFromError(error));
      setProfileState('error');
    });

    return () => { active = false; };
  }, [firebaseUser, profileCheck]);

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

    setLoading(true);
    setError('');
    let childUnsubscribers: (() => void)[] = [];
    const unsubscribeProjects = onSnapshot(
      query(collection(db, 'clientProjects'), where('clientUid', '==', firebaseUser.uid)),
      snapshot => {
        setLoading(true);
        const clientProjects = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ClientProject));
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
  }, [firebaseUser]);

  const projectById = useMemo(() => new Map(projects.map(project => [project.id, project])), [projects]);
  const requestsByProject = useMemo(() => {
    const grouped = new Map<string, ProductionRevisionRequest[]>();
    for (const revision of [...revisions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))) {
      const current = grouped.get(revision.projectId) || [];
      current.push(revision);
      grouped.set(revision.projectId, current);
    }
    return grouped;
  }, [revisions]);
  const recentActivity = useMemo(
    () => [...activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activity],
  );
  const recentRevisions = useMemo(
    () => [...revisions].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [revisions],
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
    try {
      const callable = httpsCallable(functions, 'submitProductionRequest');
      await callable({
        title: requestTitle.trim(),
        description: requestDescription.trim(),
        category: requestCategory,
        dueDate: requestDueDate,
        priority: 'Normal',
      });
      setRequestTitle('');
      setRequestDescription('');
      setRequestDueDate('');
      setRequestOpen(false);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setRequestSubmitting(false);
    }
  };

  const tabs: { id: ClientTab; title: string }[] = [
    { id: 'projects', title: 'My projects' },
    { id: 'deliverables', title: 'Deliverables' },
    { id: 'updates', title: 'Updates & revisions' },
  ];

  if (profileState === 'loading') {
    return <main className="flex min-h-screen items-center justify-center bg-[#080808] text-sm text-neutral-400">Preparing your secure workspace…</main>;
  }
  if (profileState === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4">
        <div className="w-full max-w-lg space-y-4 border border-red-500/30 bg-red-950/20 p-6 text-sm text-red-200">
          <p role="alert">{profileError}</p>
          <button type="button" onClick={() => setProfileCheck(value => value + 1)} className="border border-red-300/30 px-4 py-2 text-white">Retry</button>
        </div>
      </main>
    );
  }
  if (profileState === 'required') {
    return <ClientOnboarding onComplete={() => setProfileState('complete')} />;
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1A1A1A] bg-[#080808]/95 px-4 sm:px-8">
        <div><span className="font-black tracking-tight text-white">KEEDO<span className="text-[#FF1E1E]">HUB</span></span><span className="ml-3 text-xs text-neutral-500">CLIENT WORKSPACE</span></div>
        <div className="flex items-center gap-3"><span className="hidden text-xs text-neutral-400 sm:inline">{firebaseUser?.displayName || firebaseUser?.email}</span>{firebaseUser && <ProductionNotificationCenter uid={firebaseUser.uid} />}<button onClick={() => setRequestOpen(true)} className="rounded bg-[#FF1E1E] px-3 py-1.5 text-xs font-semibold text-white">New request</button><button onClick={() => void logout()} className="rounded border border-[#292929] bg-[#141414] px-3 py-1.5 text-xs text-white">Sign out</button></div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <h1 className="text-2xl font-black text-white">Your production workspace</h1>
        <p className="mt-1 text-sm text-neutral-400">Project progress, assigned tasks and approved client deliverables.</p>
        <nav className="my-6 flex flex-wrap gap-2 border-b border-[#1A1A1A] pb-3">
          {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded px-3 py-2 text-sm ${activeTab === tab.id ? 'bg-white text-black' : 'text-neutral-400 hover:bg-[#141414] hover:text-white'}`}>{tab.title}</button>)}
        </nav>
        {error && <div role="alert" className="mb-5 rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}
        {loading ? <p className="py-12 text-center text-sm text-neutral-400">Loading your projects…</p> : (
          <>
            {activeTab === 'projects' && (
              <div className="space-y-4">
                {projects.length === 0 && <div className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-8 text-center text-sm text-neutral-400">No projects are assigned to your account yet.</div>}
                {projects.map(project => {
                  const projectTasks = tasks.filter(task => task.projectId === project.id);
                  const projectRevisions = requestsByProject.get(project.id) || [];
                  return <article key={project.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h2 className="text-lg font-bold text-white">{project.title}</h2><p className="mt-1 text-sm text-neutral-400">{project.description}</p></div>
                      <span className="rounded border border-[#333] px-2 py-1 text-xs text-neutral-200">{project.stage || project.status}</span>
                    </div>
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
                  </article>;
                })}
              </div>
            )}

            {activeTab === 'deliverables' && (
              <div className="grid gap-4 md:grid-cols-2">
                {deliverables.length === 0 && <p className="text-sm text-neutral-500">No deliverables have been published for review.</p>}
                {deliverables.map(deliverable => {
                  const project = projectById.get(deliverable.projectId);
                  const feedback = feedbackByDeliverable[deliverable.id] || '';
                  const waiting = deliverable.reviewStatus === 'Awaiting Review' || deliverable.reviewStatus === 'Revised - Awaiting Review';
                  return <article key={deliverable.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500">{project?.title || 'Project'}</p>
                    <h2 className="mt-1 font-bold text-white">{deliverable.title}</h2>
                    {deliverable.description && <p className="mt-2 text-sm text-neutral-400">{deliverable.description}</p>}
                    <p className="mt-2 text-xs text-neutral-500">Review status: {deliverable.reviewStatus}</p>
                    {deliverable.fileUrl && <div className="mt-3 space-y-2">
                      {deliverable.fileType.startsWith('image/') && <img src={deliverable.fileUrl} alt={deliverable.title} className="max-h-80 max-w-full rounded border border-[#292929] object-contain" />}
                      {deliverable.fileType.startsWith('video/') && <video controls preload="metadata" src={deliverable.fileUrl} className="max-h-80 w-full rounded" />}
                      {deliverable.fileType.startsWith('audio/') && <audio controls preload="metadata" src={deliverable.fileUrl} className="w-full" />}
                      {deliverable.fileType === 'application/pdf' && <iframe title={`${deliverable.title} preview`} src={deliverable.fileUrl} className="h-80 w-full rounded border border-[#292929]" />}
                      <a href={deliverable.fileUrl} download={deliverable.fileName} target="_blank" rel="noreferrer" className="inline-block text-sm text-red-300 underline">Download · {deliverable.fileName}</a>
                    </div>}
                    {deliverable.versions && deliverable.versions.length > 1 && <details className="mt-3 text-xs text-neutral-400"><summary className="cursor-pointer">Version history ({deliverable.versions.length})</summary><ol className="mt-2 space-y-1">{[...deliverable.versions].reverse().map(version => <li key={version.version}><a href={version.fileUrl} download={version.fileName} target="_blank" rel="noreferrer" className="text-red-300 underline">Version {version.version} · {version.fileName}</a><span className="ml-2 text-neutral-500">{version.createdAt}</span></li>)}</ol></details>}
                    {waiting && <div className="mt-4 space-y-2"><textarea value={feedback} onChange={event => setFeedbackByDeliverable(previous => ({ ...previous, [deliverable.id]: event.target.value }))} placeholder="Feedback (required to reject or request a revision)" rows={3} maxLength={5000} className="w-full rounded border border-[#333] bg-[#141414] p-2 text-sm text-white" /><div className="flex flex-wrap gap-2"><button disabled={submittingId === deliverable.id} onClick={() => void review(deliverable, 'approve')} className="rounded bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve</button><button disabled={submittingId === deliverable.id || !feedback.trim()} onClick={() => void review(deliverable, 'reject')} className="rounded border border-red-900 px-3 py-2 text-xs text-red-200 disabled:opacity-50">Reject</button><button disabled={submittingId === deliverable.id || !feedback.trim()} onClick={() => void review(deliverable, 'revision')} className="rounded border border-[#444] px-3 py-2 text-xs text-white disabled:opacity-50">Request revision</button></div></div>}
                    {deliverable.reviewStatus === 'Rejected' && <p className="mt-3 rounded border border-red-900/50 bg-red-950/20 p-2 text-xs text-red-200">Rejected: {deliverable.feedback || 'No feedback was provided.'}</p>}
                  </article>;
                })}
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="space-y-3">
                {activity.length === 0 && revisions.length === 0 && <p className="text-sm text-neutral-500">No client-visible updates yet.</p>}
                {recentActivity.map(item => <article key={item.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4"><p className="text-sm font-semibold text-white">{item.action}</p><p className="mt-1 text-sm text-neutral-400">{item.details}</p><p className="mt-2 text-[10px] text-neutral-600">{projectById.get(item.projectId)?.title || 'Project'} · {item.createdAt}</p></article>)}
                {recentRevisions.map(item => <article key={item.id} className="rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4"><p className="text-sm font-semibold text-white">Revision · {item.status}</p><p className="mt-1 text-sm text-neutral-400">{item.feedback}</p><p className="mt-2 text-[10px] text-neutral-600">{projectById.get(item.projectId)?.title || 'Project'} · {item.submittedAt}</p></article>)}
              </div>
            )}
          </>
        )}
      </main>
      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form onSubmit={submitRequest} className="w-full max-w-lg space-y-3 rounded-xl border border-[#292929] bg-[#0C0C0C] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Submit a production request</h2>
              <button type="button" onClick={() => setRequestOpen(false)} className="text-sm text-neutral-400 hover:text-white">Close</button>
            </div>
            <input value={requestTitle} onChange={event => setRequestTitle(event.target.value)} maxLength={160} required placeholder="Project title" className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
            <select value={requestCategory} onChange={event => setRequestCategory(event.target.value)} className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white">
              <option>Creative</option><option>Marketing</option><option>Distribution</option><option>Legal</option><option>Executive</option>
            </select>
            <textarea value={requestDescription} onChange={event => setRequestDescription(event.target.value)} maxLength={5000} required rows={5} placeholder="Describe the work and deliverables" className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
            <label className="block text-xs text-neutral-400">Requested delivery date<input type="date" value={requestDueDate} onChange={event => setRequestDueDate(event.target.value)} className="mt-1 block rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" /></label>
            <button disabled={requestSubmitting} className="w-full rounded bg-[#FF1E1E] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{requestSubmitting ? 'Submitting…' : 'Submit request'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClientWorkspace;
