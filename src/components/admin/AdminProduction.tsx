import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  collectionGroup,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  ClientProfile,
  ClientProject,
  ProductionActivity,
  ProductionDeliverable,
  ProductionRevisionRequest,
  ProductionDeliverableVersion,
  ProductionTask,
  ProductionStage,
} from '../../types';
import { db, storage } from '../../lib/firebase';
import { ProductionNotificationCenter } from '../common/ProductionNotificationCenter';
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

const PRIORITIES = ['Low', 'Medium', 'Normal', 'High', 'Urgent'] as const;
const TASK_STATUSES = ['Todo', 'In Progress', 'In Review', 'Done'] as const;
const MAX_DELIVERABLE_SIZE = 50 * 1024 * 1024;
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
    if (code.includes('permission-denied')) return 'Permission denied. Confirm this account has a Firestore admins record and the latest rules are deployed to the named database.';
  }
  return error instanceof Error ? error.message : String(error);
}

export const AdminProduction: React.FC = () => {
  const { firebaseUser } = useApp();
  const user = firebaseUser;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProductionTask[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<Record<string, { assignee: string; assigneeUid: string }>>({});
  const [unassignedTasks, setUnassignedTasks] = useState<ProductionTask[]>([]);
  const [deliverables, setDeliverables] = useState<ProductionDeliverable[]>([]);
  const [allDeliverables, setAllDeliverables] = useState<ProductionDeliverable[]>([]);
  const [revisions, setRevisions] = useState<ProductionRevisionRequest[]>([]);
  const [allRevisions, setAllRevisions] = useState<ProductionRevisionRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, { id: string; content: string; authorName: string; createdAt: string }[]>>({});
  const [activity, setActivity] = useState<ProductionActivity[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectTab, setProjectTab] = useState<'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity'>('overview');
  const [saving, setSaving] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'approved' | 'rejected' | 'revisions'>('pending');

  const [projectTitle, setProjectTitle] = useState('');
  const [projectClientUid, setProjectClientUid] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('Creative production');
  const [projectStage, setProjectStage] = useState<ProductionStage>('New Request');
  const [projectPriority, setProjectPriority] = useState<(typeof PRIORITIES)[number]>('Normal');
  const [projectLead, setProjectLead] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [projectProgress, setProjectProgress] = useState(0);
  const [projectCategory, setProjectCategory] = useState<'artist' | 'label' | 'brand' | 'business'>('brand');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskAssigneeUid, setTaskAssigneeUid] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskClientVisible, setTaskClientVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [deliverableDescription, setDeliverableDescription] = useState('');
  const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
  const [revisionResponses, setRevisionResponses] = useState<Record<string, string>>({});

  const selectedProject = projects.find(project => project.id === selectedProjectId) || null;
  const selectedTasks = projectTasks;

  useEffect(() => {
    setIsAdmin(false);
    setLoading(true);
    setError('');
    setProjects([]);
    setClients([]);
    setProjectTasks([]);
    setTaskAssignments({});
    setUnassignedTasks([]);
    setDeliverables([]);
    setRevisions([]);
    setNotes({});
    setActivity([]);
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
        if (!adminSnapshot.exists()) {
          setLoading(false);
          setError('This account is not listed as a platform admin.');
          return;
        }
        setIsAdmin(true);
        const unsubscribers = [
          onSnapshot(query(collection(db, 'clientProjects'), orderBy('updatedAt', 'desc')), snapshot => {
            setProjects(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ClientProject)));
            setLoading(false);
            setError('');
          }, err => { setError(friendlyError(err)); setLoading(false); }),
          onSnapshot(collection(db, 'clientProfiles'), snapshot => {
            setClients(snapshot.docs.map(item => ({ uid: item.id, ...item.data() } as ClientProfile)));
          }, err => setError(friendlyError(err))),
          onSnapshot(collection(db, 'productionTasks'), snapshot => {
            setUnassignedTasks(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionTask)));
          }, err => setError(friendlyError(err))),
          onSnapshot(collectionGroup(db, 'deliverables'), snapshot => {
            setAllDeliverables(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionDeliverable)));
          }, err => setError(friendlyError(err))),
          onSnapshot(collectionGroup(db, 'revisionRequests'), snapshot => {
            setAllRevisions(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionRevisionRequest)));
          }, err => setError(friendlyError(err))),
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

  useEffect(() => {
    if (!isAdmin || !selectedProjectId) {
      setProjectTasks([]);
      setTaskAssignments({});
      setDeliverables([]);
      setAllDeliverables([]);
      setRevisions([]);
      setAllRevisions([]);
      setActivity([]);
      setNotes({});
      return;
    }

    const projectRef = doc(db, 'clientProjects', selectedProjectId);
    let active = true;
    const unsubs = [
      onSnapshot(collection(projectRef, 'tasks'), snapshot => {
        const rows = snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionTask));
        setProjectTasks(rows);
        void Promise.all(snapshot.docs.map(async item => {
          const details = await getDoc(doc(db, 'clientProjects', selectedProjectId, 'tasks', item.id, 'admin', 'details'));
          return [item.id, {
            assignee: String(details.get('assignee') || ''),
            assigneeUid: String(details.get('assigneeUid') || ''),
          }] as const;
        })).then(entries => {
          if (active) setTaskAssignments(Object.fromEntries(entries));
        }).catch(err => {
          if (active) setError(friendlyError(err));
        });
      }, err => setError(friendlyError(err))),
      onSnapshot(collection(projectRef, 'deliverables'), snapshot => {
        setDeliverables(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionDeliverable)));
      }, err => setError(friendlyError(err))),
      onSnapshot(query(collection(projectRef, 'revisionRequests'), orderBy('createdAt', 'desc')), snapshot => {
        setRevisions(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionRevisionRequest)));
      }, err => setError(friendlyError(err))),
      onSnapshot(query(collection(projectRef, 'internalNotes'), orderBy('createdAt', 'desc')), snapshot => {
        setNotes(previous => ({
          ...previous,
          [selectedProjectId]: snapshot.docs.map(item => ({ id: item.id, ...item.data() } as { id: string; content: string; authorName: string; createdAt: string })),
        }));
      }, err => setError(friendlyError(err))),
      onSnapshot(query(collection(projectRef, 'activity'), orderBy('createdAt', 'desc')), snapshot => {
        setActivity(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as ProductionActivity)));
      }, err => setError(friendlyError(err))),
    ];
    return () => {
      active = false;
      unsubs.forEach(unsubscribe => unsubscribe());
    };
  }, [isAdmin, selectedProjectId]);

  useEffect(() => {
    setProjectProgress(selectedProject?.progress || 0);
    if (selectedProject) {
      setProjectClientUid(selectedProject.clientUid);
      setProjectDeadline(selectedProject.expectedDeliveryDate || '');
    }
  }, [selectedProject?.id, selectedProject?.progress, selectedProject?.clientUid, selectedProject?.expectedDeliveryDate]);

  useEffect(() => {
    if (selectedProjectId && !projects.some(project => project.id === selectedProjectId)) setSelectedProjectId('');
  }, [projects, selectedProjectId]);

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

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectTitle.trim() || !projectClientUid) {
      setError('Enter a project title and assign it to a client profile.');
      return;
    }
    const client = clients.find(item => item.uid === projectClientUid);
    if (!client) {
      setError('The selected client profile could not be found.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const projectRef = doc(collection(db, 'clientProjects'));
      const stage = projectStage;
      await setDoc(projectRef, {
        id: projectRef.id,
        clientUid: client.uid,
        title: projectTitle.trim(),
        description: projectDescription.trim(),
        category: projectType,
        status: statusForStage(stage),
        progress: Math.max(0, Math.min(100, Number(projectProgress))),
        startDate: now.slice(0, 10),
        expectedDeliveryDate: projectDeadline,
        createdAt: now,
        updatedAt: now,
        stage,
        priority: projectPriority,
      });
      await setDoc(doc(projectRef, 'admin', 'details'), {
        projectType,
        clientName: client.displayName || client.organizationName,
        clientCategory: projectCategory,
        leadProducer: projectLead.trim(),
        assignedTo: projectLead.trim(),
        assignedToUid: '',
        brief: { description: projectDescription.trim(), deliverableSpecs: '' },
      });
      await writeActivity(projectRef.id, 'Project created', 'Your production project is now open.');
      setProjectTitle('');
      setProjectDescription('');
      setProjectDeadline('');
      setProjectLead('');
      setSelectedProjectId(projectRef.id);
      setProjectTab('overview');
    } catch (err) {
      setError(friendlyError(err));
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
            : 'Project details updated.';
      await writeActivity(selectedProject.id, 'Project updated', details, !('clientUid' in patch));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
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
      await writeActivity(selectedProject.id, 'Private production details updated', 'Admin-only assignments or production details changed.', false);
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

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProject || !taskTitle.trim()) return;
    setSaving(true);
    setError('');
    try {
      const taskRef = doc(collection(db, 'clientProjects', selectedProject.id, 'tasks'));
      const now = new Date().toISOString();
      await setDoc(taskRef, {
        id: taskRef.id,
        projectId: selectedProject.id,
        clientUid: selectedProject.clientUid,
        title: taskTitle.trim(),
        status: 'Todo',
        dueDate: taskDeadline,
        clientVisible: taskClientVisible,
        subtasks: [],
        createdAt: now,
        updatedAt: now,
      });
      await setDoc(doc(taskRef, 'admin', 'details'), {
        assignee: taskAssignee.trim(),
        assigneeUid: taskAssigneeUid,
      });
      await writeActivity(selectedProject.id, 'Task created', `A task was added: ${taskTitle.trim()}.`, taskClientVisible);
      setTaskTitle('');
      setTaskAssignee('');
      setTaskAssigneeUid('');
      setTaskDeadline('');
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
      if (task.projectId) await writeActivity(task.projectId, 'Task updated', `${task.title}: ${patch.status || 'details updated'}.`, task.clientVisible);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const updateTaskAssignment = async (task: ProductionTask) => {
    const current = taskAssignments[task.id] || { assignee: '', assigneeUid: '' };
    const assignee = window.prompt('Assigned to (private)', current.assignee);
    if (assignee === null) return;
    const assigneeUid = window.prompt('Assignee UID (private, optional)', current.assigneeUid);
    if (assigneeUid === null) return;
    const taskRef = task.projectId
      ? doc(db, 'clientProjects', task.projectId, 'tasks', task.id)
      : doc(db, 'productionTasks', task.id);
    try {
      await setDoc(doc(taskRef, 'admin', 'details'), {
        assignee: assignee.trim(),
        assigneeUid: assigneeUid.trim(),
      }, { merge: true });
      setTaskAssignments(previous => ({
        ...previous,
        [task.id]: { assignee: assignee.trim(), assigneeUid: assigneeUid.trim() },
      }));
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const updateTaskDeadline = async (task: ProductionTask) => {
    const dueDate = window.prompt('Task deadline (YYYY-MM-DD)', task.dueDate || '');
    if (dueDate === null) return;
    await updateTask(task, { dueDate: dueDate.trim() });
  };

  const addSubtask = async (task: ProductionTask) => {
    const title = window.prompt('Subtask title');
    if (!title?.trim()) return;
    await updateTask(task, {
      subtasks: [...(task.subtasks || []), { id: crypto.randomUUID(), title: title.trim(), completed: false }],
    });
  };

  const toggleSubtask = async (task: ProductionTask, subtaskId: string) => {
    await updateTask(task, {
      subtasks: (task.subtasks || []).map(subtask => subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask),
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
      await writeActivity(selectedProject.id, 'Internal note added', 'An admin added a private production note.', false);
      setNoteText('');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const editNote = async (noteId: string, currentContent: string) => {
    const content = window.prompt('Edit internal note', currentContent);
    if (content === null || !content.trim() || !selectedProject) return;
    try {
      await updateDoc(doc(db, 'clientProjects', selectedProject.id, 'internalNotes', noteId), {
        content: content.trim(),
        updatedAt: new Date().toISOString(),
      });
      await writeActivity(selectedProject.id, 'Internal note updated', 'An admin edited a private production note.', false);
    } catch (err) {
      setError(friendlyError(err));
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
        versions: [{
          version: 1,
          fileUrl,
          storagePath,
          fileName: deliverableFile.name,
          fileType: deliverableFile.type || 'application/octet-stream',
          fileSize: deliverableFile.size,
          uploadedBy: user.uid,
          createdAt: now,
        } satisfies ProductionDeliverableVersion],
      });
      await writeActivity(selectedProject.id, 'Deliverable uploaded', `${deliverableTitle.trim()} was added to the project.`, false);
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
      const versionNumber = Math.max(deliverable.currentVersion || 0, ...versions.map(version => version.version)) + 1;
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
      await writeActivity(deliverable.projectId, 'Deliverable version uploaded', `${deliverable.title} version ${versionNumber} was uploaded.`, deliverable.isClientPublished);
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
      await writeActivity(deliverable.projectId, published ? 'Deliverable published' : 'Deliverable unpublished',
        `${deliverable.title} was ${published ? 'published to' : 'removed from'} the client workspace.`);
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const updateRevision = async (revision: ProductionRevisionRequest, status: ProductionRevisionRequest['status']) => {
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
      await writeActivity(revision.projectId, 'Revision response sent', 'The production team responded to a revision request.');
      setRevisionResponses(previous => ({ ...previous, [revision.id]: '' }));
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  if (loading) return <div className="py-16 text-center text-sm text-neutral-400">Loading production records…</div>;
  if (!isAdmin) return <div className="rounded border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-300">{error || 'Admin access required.'}</div>;

  const currentNotes = selectedProjectId ? notes[selectedProjectId] || [] : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 border-b border-[#1C1C1C] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-mono uppercase tracking-widest text-red-400">Phase 3D / 3E · Firestore-backed</p>
          <h1 className="text-2xl font-black text-white">Production Center</h1>
          <p className="mt-1 text-sm text-neutral-400">Projects, deliverable reviews, assignments, private notes and operational alerts.</p>
        </div>
        <div className="flex items-center gap-3"><span className="text-xs text-neutral-500">{projects.length} projects · {clients.length} client profiles</span>{user && <ProductionNotificationCenter uid={user.uid} />}</div>
      </header>

      {error && <div role="alert" className="rounded border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}

      <section className="space-y-3 rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-white">Deliverable review queue</h2><p className="mt-1 text-xs text-neutral-500">Review status across all client projects.</p></div>
          <div className="flex flex-wrap gap-2">
            {([
              ['pending', 'Pending review', allDeliverables.filter(item => ['Awaiting Review', 'Revised - Awaiting Review'].includes(item.reviewStatus)).length],
              ['approved', 'Approved', allDeliverables.filter(item => item.reviewStatus === 'Approved').length],
              ['rejected', 'Rejected', allDeliverables.filter(item => item.reviewStatus === 'Rejected').length],
              ['revisions', 'Outstanding revisions', allRevisions.filter(item => ['Submitted', 'In Progress'].includes(item.status)).length],
            ] as const).map(([filter, title, count]) => (
              <button key={filter} onClick={() => setReviewFilter(filter)} className={`rounded border px-3 py-1.5 text-xs ${reviewFilter === filter ? 'border-red-500 bg-red-950/40 text-white' : 'border-[#333] text-neutral-400'}`}>{title} · {count}</button>
            ))}
          </div>
        </div>
        {reviewFilter === 'revisions' ? (
          <div className="space-y-2">
            {allRevisions.filter(item => ['Submitted', 'In Progress'].includes(item.status)).map(revision => (
              <button key={revision.id} onClick={() => { setSelectedProjectId(revision.projectId); setProjectTab('revisions'); }} className="block w-full rounded border border-[#222] p-3 text-left hover:border-[#555]">
                <span className="block text-xs font-semibold text-white">{projects.find(project => project.id === revision.projectId)?.title || 'Project'} · {revision.status}</span>
                <span className="mt-1 block text-xs text-neutral-400">{revision.feedback}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {allDeliverables.filter(item => reviewFilter === 'pending'
              ? ['Awaiting Review', 'Revised - Awaiting Review'].includes(item.reviewStatus)
              : item.reviewStatus === (reviewFilter === 'approved' ? 'Approved' : 'Rejected')).map(deliverable => (
              <button key={deliverable.id} onClick={() => { setSelectedProjectId(deliverable.projectId); setProjectTab('deliverables'); }} className="flex w-full flex-wrap items-center justify-between gap-2 rounded border border-[#222] p-3 text-left hover:border-[#555]">
                <span><span className="block text-xs font-semibold text-white">{deliverable.title}</span><span className="block text-[11px] text-neutral-500">{projects.find(project => project.id === deliverable.projectId)?.title || 'Project'} · v{deliverable.currentVersion || 1}</span></span>
                <span className="text-xs text-neutral-400">{deliverable.reviewStatus}</span>
              </button>
            ))}
            {allDeliverables.filter(item => reviewFilter === 'pending'
              ? ['Awaiting Review', 'Revised - Awaiting Review'].includes(item.reviewStatus)
              : item.reviewStatus === (reviewFilter === 'approved' ? 'Approved' : 'Rejected')).length === 0 && <p className="text-xs text-neutral-500">Nothing in this view.</p>}
          </div>
        )}
      </section>

      <LegacyImportPanel clients={clients} />

      <section className="grid gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.8fr)]">
        <div className="space-y-5">
          <form onSubmit={createProject} className="space-y-3 rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4">
            <h2 className="text-sm font-bold text-white">Create production project</h2>
            <input value={projectTitle} onChange={event => setProjectTitle(event.target.value)} placeholder="Project title" maxLength={160} required className="w-full rounded border border-[#262626] bg-[#141414] px-3 py-2 text-sm text-white" />
            <select value={projectClientUid} onChange={event => setProjectClientUid(event.target.value)} required className="w-full rounded border border-[#262626] bg-[#141414] px-3 py-2 text-sm text-white">
              <option value="">Assign to client profile…</option>
              {clients.map(client => <option key={client.uid} value={client.uid}>{client.displayName || client.organizationName} · {client.email}</option>)}
            </select>
            <textarea value={projectDescription} onChange={event => setProjectDescription(event.target.value)} placeholder="Client-visible project brief" maxLength={5000} rows={3} className="w-full rounded border border-[#262626] bg-[#141414] px-3 py-2 text-sm text-white" />
            <div className="grid grid-cols-2 gap-2">
              <input value={projectType} onChange={event => setProjectType(event.target.value)} placeholder="Project type" className="rounded border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white" />
              <select value={projectCategory} onChange={event => setProjectCategory(event.target.value as typeof projectCategory)} className="rounded border border-[#262626] bg-[#141414] px-2 py-2 text-xs text-white">
                <option value="artist">Artist</option><option value="label">Label</option><option value="brand">Brand</option><option value="business">Business</option>
              </select>
              <select value={projectPriority} onChange={event => setProjectPriority(event.target.value as typeof projectPriority)} className="rounded border border-[#262626] bg-[#141414] px-2 py-2 text-xs text-white">
                {PRIORITIES.map(priority => <option key={priority}>{priority}</option>)}
              </select>
              <input type="date" value={projectDeadline} onChange={event => setProjectDeadline(event.target.value)} className="rounded border border-[#262626] bg-[#141414] px-2 py-2 text-xs text-white" />
            </div>
            <input value={projectLead} onChange={event => setProjectLead(event.target.value)} placeholder="Lead producer (admin-only)" className="w-full rounded border border-[#262626] bg-[#141414] px-3 py-2 text-sm text-white" />
            <button disabled={saving} className="w-full rounded bg-[#FF1E1E] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Create project'}</button>
          </form>

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-white">Projects</h2>
            {projects.length === 0 && <p className="rounded border border-[#1A1A1A] p-4 text-sm text-neutral-500">No production projects yet.</p>}
            {projects.map(project => (
              <button key={project.id} onClick={() => setSelectedProjectId(project.id)} className={`w-full rounded border p-3 text-left ${selectedProjectId === project.id ? 'border-[#FF1E1E]/60 bg-[#171010]' : 'border-[#1A1A1A] bg-[#0C0C0C] hover:border-[#333]'}`}>
                <span className="block font-semibold text-white">{project.title}</span>
                <span className="mt-1 block text-xs text-neutral-400">{clients.find(client => client.uid === project.clientUid)?.displayName || project.clientUid} · {project.stage || project.status}</span>
                <span className="mt-1 block text-[11px] text-neutral-500">{project.progress || 0}% · Due {project.expectedDeliveryDate || '—'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded border border-[#1A1A1A] bg-[#0C0C0C] p-4 sm:p-5">
          {!selectedProject ? <p className="py-12 text-center text-sm text-neutral-500">Select a project to manage its production.</p> : (
            <>
              <div className="flex flex-col gap-3 border-b border-[#222] pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedProject.title}</h2>
                  <p className="mt-1 text-sm text-neutral-400">{clients.find(client => client.uid === selectedProject.clientUid)?.displayName || selectedProject.clientUid}</p>
                </div>
                <label className="text-xs text-neutral-400">Stage
                  <select value={selectedProject.stage || 'New Request'} onChange={event => void updateStage(event.target.value as ProductionStage)} className="ml-2 rounded border border-[#333] bg-[#141414] px-2 py-1 text-white">
                    {STAGES.map(stage => <option key={stage}>{stage}</option>)}
                  </select>
                </label>
              </div>

              <nav className="my-4 flex flex-wrap gap-2">
                {(['overview', 'tasks', 'deliverables', 'notes', 'revisions', 'activity'] as const).map(tab => (
                  <button key={tab} onClick={() => setProjectTab(tab)} className={`rounded px-3 py-1.5 text-xs capitalize ${projectTab === tab ? 'bg-white text-black' : 'bg-[#161616] text-neutral-400 hover:text-white'}`}>{tab}</button>
                ))}
              </nav>

              {projectTab === 'overview' && (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-300">{selectedProject.description}</p>
                  <label className="block text-xs text-neutral-400">Assigned client
                    <select value={selectedProject.clientUid} onChange={event => {
                      const nextClient = clients.find(client => client.uid === event.target.value);
                      setProjectClientUid(event.target.value);
                      void updateProject({ clientUid: event.target.value });
                      if (nextClient) void updatePrivateProjectDetails({ clientName: nextClient.displayName || nextClient.organizationName });
                    }} className="ml-2 rounded border border-[#333] bg-[#141414] px-2 py-1 text-white">
                      {clients.map(client => <option key={client.uid} value={client.uid}>{client.displayName || client.organizationName} · {client.email}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs text-neutral-400">Progress: {selectedProject.progress || 0}%
                    <input type="range" min="0" max="100" value={projectProgress} onChange={event => setProjectProgress(Number(event.target.value))} onMouseUp={() => void updateProject({ progress: projectProgress })} onTouchEnd={() => void updateProject({ progress: projectProgress })} onKeyUp={() => void updateProject({ progress: projectProgress })} className="mt-2 block w-full accent-red-500" />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => void updateProject({ expectedDeliveryDate: window.prompt('Deadline (YYYY-MM-DD)', selectedProject.expectedDeliveryDate) || selectedProject.expectedDeliveryDate })} className="rounded border border-[#333] px-3 py-2 text-xs text-neutral-200">Edit deadline</button>
                    <button onClick={() => void updateProject({ title: window.prompt('Project title', selectedProject.title) || selectedProject.title })} className="rounded border border-[#333] px-3 py-2 text-xs text-neutral-200">Edit title</button>
                    <button onClick={() => void updateProject({ description: window.prompt('Client-visible description', selectedProject.description) ?? selectedProject.description })} className="rounded border border-[#333] px-3 py-2 text-xs text-neutral-200">Edit description</button>
                    <button onClick={() => void updatePrivateProjectDetails({ leadProducer: window.prompt('Lead producer (admin-only)') || '' })} className="rounded border border-[#333] px-3 py-2 text-xs text-neutral-200">Set lead producer</button>
                  </div>
                  <p className="text-xs text-neutral-500">Project records contain client-safe fields. Producer assignments and private details are stored in the admin-only subcollection.</p>
                </div>
              )}

              {projectTab === 'tasks' && (
                <div className="space-y-4">
                  <form onSubmit={createTask} className="grid gap-2 rounded border border-[#222] p-3 md:grid-cols-2">
                    <input value={taskTitle} onChange={event => setTaskTitle(event.target.value)} placeholder="Task title" required className="rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
                    <input value={taskAssignee} onChange={event => setTaskAssignee(event.target.value)} placeholder="Assigned to (private)" className="rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
                    <input value={taskAssigneeUid} onChange={event => setTaskAssigneeUid(event.target.value)} placeholder="Assignee UID (private, optional)" className="rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
                    <input type="date" value={taskDeadline} onChange={event => setTaskDeadline(event.target.value)} className="rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
                    <label className="flex items-center gap-2 text-xs text-neutral-300 md:col-span-2"><input type="checkbox" checked={taskClientVisible} onChange={event => setTaskClientVisible(event.target.checked)} />Show this task and its status to the client</label>
                    <button disabled={saving} className="rounded bg-[#FF1E1E] px-3 py-2 text-sm font-semibold text-white md:col-span-2">Add task</button>
                  </form>
                  {selectedTasks.map(task => (
                    <div key={task.id} className="space-y-2 rounded border border-[#222] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div><p className="text-sm font-semibold text-white">{task.title}</p><p className="text-xs text-neutral-500">{task.clientVisible ? 'Visible to client' : 'Admin-only'} · Due {task.dueDate || '—'} · Assigned to {taskAssignments[task.id]?.assignee || 'Unassigned'}</p></div>
                        <select value={task.status} onChange={event => void updateTask(task, { status: event.target.value as ProductionTask['status'] })} className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-xs text-white">{TASK_STATUSES.map(status => <option key={status}>{status}</option>)}</select>
                      </div>
                      <button onClick={() => void updateTaskAssignment(task)} className="text-xs text-red-300 hover:text-white">Assign / change assignee</button>
                      <button onClick={() => void updateTaskDeadline(task)} className="ml-3 text-xs text-neutral-300 hover:text-white">Edit deadline</button>
                      <div className="flex flex-wrap gap-2">{(task.subtasks || []).map(subtask => <label key={subtask.id} className="flex items-center gap-1 text-xs text-neutral-300"><input type="checkbox" checked={subtask.completed} onChange={() => void toggleSubtask(task, subtask.id)} />{subtask.title}</label>)}</div>
                      <button onClick={() => void addSubtask(task)} className="text-xs text-red-300 hover:text-white">+ Add subtask</button>
                    </div>
                  ))}
                  {unassignedTasks.length > 0 && <div className="space-y-2 border-t border-[#222] pt-3"><p className="text-xs text-neutral-500">Unassigned legacy tasks ({unassignedTasks.length}) · admin only</p>{unassignedTasks.map(task => <div key={task.id} className="flex items-center justify-between gap-2 text-xs"><span className="text-neutral-300">{task.title}</span><select value={task.status} onChange={event => void updateTask(task, { status: event.target.value as ProductionTask['status'] })} className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-white">{TASK_STATUSES.map(status => <option key={status}>{status}</option>)}</select></div>)}</div>}
                </div>
              )}

              {projectTab === 'deliverables' && (
                <div className="space-y-4">
                  <form onSubmit={uploadDeliverable} className="space-y-2 rounded border border-[#222] p-3">
                    <input value={deliverableTitle} onChange={event => setDeliverableTitle(event.target.value)} placeholder="Deliverable title" required className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
                    <input value={deliverableDescription} onChange={event => setDeliverableDescription(event.target.value)} placeholder="Description (optional)" className="w-full rounded border border-[#333] bg-[#141414] px-3 py-2 text-sm text-white" />
                    <input type="file" accept="image/*,audio/*,video/*,application/pdf,application/json,application/xml,application/zip,text/plain,font/*" onChange={event => setDeliverableFile(event.target.files?.[0] || null)} required className="block w-full text-xs text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-[#222] file:px-3 file:py-2 file:text-xs file:text-white" />
                    <button disabled={saving} className="rounded bg-[#FF1E1E] px-3 py-2 text-sm font-semibold text-white">Upload deliverable</button>
                  </form>
                  {deliverables.map(deliverable => (
                    <article key={deliverable.id} className="space-y-3 rounded border border-[#222] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div><p className="text-sm font-semibold text-white">{deliverable.title}</p><p className="text-xs text-neutral-500">{deliverable.reviewStatus} · v{deliverable.currentVersion || 1} · {deliverable.fileName}</p></div>
                        <div className="flex gap-2">
                          <label className="cursor-pointer rounded border border-[#333] px-3 py-1.5 text-xs text-neutral-200">{saving ? 'Uploading…' : 'Upload new version'}<input type="file" disabled={saving} className="sr-only" accept="image/*,audio/*,video/*,application/pdf,application/json,application/xml,application/zip,text/plain,font/*" onChange={event => {
                            const file = event.target.files?.[0];
                            if (file) void uploadDeliverableVersion(deliverable, file);
                            event.target.value = '';
                          }} /></label>
                          <button onClick={() => void publishDeliverable(deliverable)} className="rounded border border-[#333] px-3 py-1.5 text-xs text-neutral-200">{deliverable.isClientPublished ? 'Unpublish' : 'Publish to client'}</button>
                        </div>
                      </div>
                      {deliverable.fileUrl && <a href={deliverable.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-red-300 underline">Preview current file</a>}
                      {(deliverable.versions || []).length > 0 && <details className="text-xs text-neutral-400"><summary className="cursor-pointer">Version history ({deliverable.versions?.length})</summary><ol className="mt-2 space-y-1">{[...(deliverable.versions || [])].reverse().map(version => <li key={version.version}><a href={version.fileUrl} target="_blank" rel="noreferrer" className="text-red-300 underline">Version {version.version} · {version.fileName}</a><span className="ml-2 text-neutral-500">{version.createdAt}</span></li>)}</ol></details>}
                    </article>
                  ))}
                </div>
              )}

              {projectTab === 'notes' && (
                <div className="space-y-3">
                  <form onSubmit={addNote} className="space-y-2">
                    <textarea value={noteText} onChange={event => setNoteText(event.target.value)} placeholder="Private admin note" rows={3} required className="w-full rounded border border-[#333] bg-[#141414] p-3 text-sm text-white" />
                    <button disabled={saving} className="rounded bg-[#FF1E1E] px-3 py-2 text-sm font-semibold text-white">Save internal note</button>
                  </form>
                  {currentNotes.map(note => <article key={note.id} className="rounded border border-[#222] p-3"><p className="whitespace-pre-wrap text-sm text-neutral-200">{note.content}</p><div className="mt-2 flex justify-between text-[11px] text-neutral-500"><span>{note.authorName} · {note.createdAt}</span><button onClick={() => void editNote(note.id, note.content)} className="text-red-300">Edit</button></div></article>)}
                  <p className="text-xs text-neutral-500">Notes are stored separately and readable only by platform admins.</p>
                </div>
              )}

              {projectTab === 'revisions' && <div className="space-y-3">{revisions.map(revision => <article key={revision.id} className="rounded border border-[#222] p-3"><p className="text-sm text-neutral-200">{revision.feedback}</p><div className="mt-3 flex items-center justify-between"><span className="text-xs text-neutral-500">{revision.status} · {revision.submittedAt}</span><select value={revision.status} onChange={event => void updateRevision(revision, event.target.value as ProductionRevisionRequest['status'])} className="rounded border border-[#333] bg-[#141414] px-2 py-1 text-xs text-white">{['Submitted', 'In Progress', 'Completed', 'Cancelled'].map(status => <option key={status}>{status}</option>)}</select></div>{revision.adminResponse && <p className="mt-3 rounded bg-[#151515] p-2 text-xs text-neutral-300">Sent to client: {revision.adminResponse}</p>}<div className="mt-3 flex gap-2"><textarea value={revisionResponses[revision.id] || ''} onChange={event => setRevisionResponses(previous => ({ ...previous, [revision.id]: event.target.value }))} maxLength={5000} rows={2} placeholder="Response visible to the client" className="min-w-0 flex-1 rounded border border-[#333] bg-[#141414] p-2 text-xs text-white" /><button onClick={() => void respondToRevision(revision)} className="rounded border border-[#444] px-3 text-xs text-white">Send response</button></div></article>)}{revisions.length === 0 && <p className="text-sm text-neutral-500">No revision requests.</p>}</div>}

              {projectTab === 'activity' && <div className="space-y-2">{activity.map(item => <article key={item.id} className="rounded border border-[#222] p-3"><p className="text-sm text-white">{item.action}</p><p className="mt-1 text-xs text-neutral-400">{item.details}</p><p className="mt-1 text-[10px] text-neutral-600">{item.actorName} · {item.createdAt}{!item.clientVisible ? ' · Admin only' : ''}</p></article>)}{activity.length === 0 && <p className="text-sm text-neutral-500">No activity yet.</p>}</div>}
            </>
          )}
        </div>
      </section>
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
        <div><h2 className="text-sm font-bold text-white">Import existing browser production data</h2><p className="mt-1 text-xs text-neutral-400">Reads local records only; does not delete or overwrite them. Review client assignments before importing.</p></div>
        <button onClick={load} className="rounded border border-[#444] px-3 py-2 text-xs text-white">Read this browser’s saved data</button>
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
      {snapshot && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-neutral-300">Found {snapshot.projects.length} legacy projects, {snapshot.tasks.length} tasks and {snapshot.workspaces.length} local workspaces on this browser.</p>
          {snapshot.projects.map(project => (
            <label key={project.id} className="grid gap-2 text-xs text-neutral-300 sm:grid-cols-[1fr_260px] sm:items-center">
              <span>{project.title || project.id} · {project.internalNotes?.length || 0} private note(s) · {project.versions?.length || 0} deliverable version(s)</span>
              <select value={assignments[project.id] || ''} onChange={event => setAssignments(previous => ({ ...previous, [project.id]: event.target.value }))} className="rounded border border-[#333] bg-[#141414] px-2 py-2 text-white">
                <option value="">Select verified client assignment…</option>
                {clients.map(client => <option key={client.uid} value={client.uid}>{client.displayName || client.organizationName} · {client.email}</option>)}
              </select>
            </label>
          ))}
          <button onClick={() => void runImport()} disabled={running || !snapshot.projects.length && !snapshot.tasks.length} className="rounded bg-amber-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{running ? 'Importing…' : 'Import without deleting local records'}</button>
          {result && <div className="space-y-1 text-xs text-neutral-300"><p>Projects imported/skipped: {result.projectsImported}/{result.projectsSkipped}</p><p>Tasks imported/skipped: {result.tasksImported}/{result.tasksSkipped}</p><p>Notes imported: {result.notesImported} · Deliverables imported: {result.deliverablesImported}</p>{result.errors.map((message, index) => <p key={`${index}-${message}`} className="text-amber-300">{message}</p>)}</div>}
        </div>
      )}
    </section>
  );
};

export default AdminProduction;
