import {
  collection,
  doc,
  getDoc,
  runTransaction,
  type DocumentReference,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { OperationTask, ProductionProject } from '../types';

const STORAGE_KEY = 'lyrical_ent_studio_state_v1';

export interface LegacyProductionSnapshot {
  projects: ProductionProject[];
  tasks: OperationTask[];
  workspaces: { id: string; ownerId?: string }[];
}

export interface LegacyImportResult {
  projectsImported: number;
  projectsSkipped: number;
  tasksImported: number;
  tasksSkipped: number;
  notesImported: number;
  deliverablesImported: number;
  errors: string[];
}

export function readLegacyProductionSnapshot(): LegacyProductionSnapshot {
  const readArray = <T>(key: string): T[] => {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error(`Saved ${key} data is not a list.`);
    return parsed as T[];
  };

  return {
    projects: readArray<ProductionProject>('productionProjects'),
    tasks: readArray<OperationTask>('tasks'),
    workspaces: readArray<{ id: string; ownerId?: string }>('workspaces'),
  };
}

function stableId(sourceId: string): string {
  const id = `legacy_${encodeURIComponent(sourceId)}`;
  if (id.length > 1400) throw new Error('Legacy record ID is too long to import safely.');
  return id;
}

async function createIfMissing(
  ref: DocumentReference,
  data: Record<string, unknown>,
): Promise<boolean> {
  return runTransaction(db, async transaction => {
    const existing = await transaction.get(ref);
    if (existing.exists()) return false;
    transaction.set(ref, data);
    return true;
  });
}

function statusFromStage(stage: ProductionProject['stage']) {
  if (stage === 'Delivered') return 'Completed';
  if (stage === 'New Request') return 'Pending';
  if (stage === 'Client Review' || stage === 'Internal QA') return 'Review';
  return 'In Progress';
}

export async function importLegacyProduction(
  snapshot: LegacyProductionSnapshot,
  clientAssignments: Record<string, string>,
): Promise<LegacyImportResult> {
  const importingAdminUid = auth.currentUser?.uid;
  if (!importingAdminUid) throw new Error('Sign in with an authorized admin account before importing production records.');

  const result: LegacyImportResult = {
    projectsImported: 0,
    projectsSkipped: 0,
    tasksImported: 0,
    tasksSkipped: 0,
    notesImported: 0,
    deliverablesImported: 0,
    errors: [],
  };
  const projectIds = new Map<string, string>();
  const projectClients = new Map<string, string>();
  const projectsByWorkspace = new Map<string, { id: string; clientUid: string }[]>();

  for (const project of snapshot.projects) {
    const clientUid = clientAssignments[project.id];
    if (!clientUid) {
      result.errors.push(`Project "${project.title || project.id}" was not imported: select its client.`);
      continue;
    }

    try {
      const projectId = stableId(project.id);
      const projectRef = doc(db, 'clientProjects', projectId);

      const now = new Date().toISOString();
      const publicProject = {
        id: projectId,
        clientUid,
        title: project.title || 'Untitled production project',
        description: project.brief?.description || '',
        category: project.projectType || project.clientCategory || 'Creative',
        status: statusFromStage(project.stage),
        progress: project.stage === 'Delivered' ? 100 : 0,
        startDate: project.createdAt?.slice(0, 10) || now.slice(0, 10),
        expectedDeliveryDate: project.dueDate || '',
        createdAt: project.createdAt || now,
        updatedAt: now,
        stage: project.stage || 'New Request',
        priority: project.priority || 'Normal',
      };
      const created = await createIfMissing(projectRef, publicProject);
      const importedProject = await getDoc(projectRef);
      if (!importedProject.exists() || importedProject.get('clientUid') !== clientUid) {
        throw new Error('The existing project is assigned to a different client. Resolve the assignment before importing its records.');
      }
      projectIds.set(project.id, projectId);
      projectClients.set(project.id, clientUid);
      if (project.relatedTaskId) projectIds.set(`task:${project.relatedTaskId}`, projectId);
      if (project.workspaceId) {
        const bucket = projectsByWorkspace.get(project.workspaceId) || [];
        if (!bucket.some(item => item.id === projectId)) bucket.push({ id: projectId, clientUid });
        projectsByWorkspace.set(project.workspaceId, bucket);
      }
      if (created) result.projectsImported++;
      else result.projectsSkipped++;

      const { internalNotes = [], versions = [], ...privateProject } = project;
      const privateDetails: Record<string, unknown> = { ...privateProject };
      const legacyAssignedToUid = 'assignedToUid' in privateProject && typeof privateProject.assignedToUid === 'string'
        ? privateProject.assignedToUid
        : '';
      delete privateDetails.assignedToUid;
      const validAssignedToUid = legacyAssignedToUid &&
        (await getDoc(doc(db, 'users', legacyAssignedToUid))).exists()
        ? legacyAssignedToUid
        : '';
      await createIfMissing(doc(projectRef, 'admin', 'details'), {
        ...privateDetails,
        assignedToUid: validAssignedToUid,
        ...(legacyAssignedToUid && !validAssignedToUid ? { legacyAssignedToUid } : {}),
        legacySourceId: project.id,
        importedAt: now,
      });

      for (const note of internalNotes) {
        if (note.isInternalOnly === false) {
          const activityRef = doc(collection(projectRef, 'activity'), stableId(`legacy-note:${project.id}:${note.id}`));
          if (await createIfMissing(activityRef, {
            id: activityRef.id,
            projectId,
            actorUid: importingAdminUid,
            actorName: note.author || 'Legacy note',
            action: 'Previous client-visible project note',
            details: note.content,
            clientVisible: true,
            createdAt: note.timestamp || now,
          })) result.notesImported++;
        } else {
          const noteRef = doc(collection(projectRef, 'internalNotes'), stableId(note.id));
          if (await createIfMissing(noteRef, {
            ...note,
            id: noteRef.id,
            projectId,
            importedAt: now,
          })) result.notesImported++;
        }
      }

      for (const version of versions) {
        const deliverableRef = doc(collection(projectRef, 'deliverables'), stableId(version.id));
        const reviewStatus = version.clientReviewStatus === 'Approved'
          ? 'Approved'
          : version.clientReviewStatus === 'Revision Requested'
            ? 'Revision Requested'
            : version.isClientPublished
              ? 'Awaiting Review'
              : 'Draft';
        if (await createIfMissing(deliverableRef, {
          id: deliverableRef.id,
          projectId,
          clientUid,
          title: version.title || version.versionNumber || 'Legacy deliverable',
          description: '',
          fileUrl: version.fileUrl || '',
          storagePath: '',
          fileName: version.title || version.versionNumber || '',
          fileType: version.fileType || 'application/octet-stream',
          fileSize: Number.parseInt(version.fileSize || '0', 10) || 0,
          isClientPublished: version.isClientPublished === true,
          reviewStatus,
          createdAt: version.uploadedAt || now,
          updatedAt: now,
          uploadedBy: version.uploadedBy || 'Legacy import',
          legacyVersionNumber: version.versionNumber || '',
        })) result.deliverablesImported++;
      }

      for (const update of project.recentUpdates || []) {
        const activityRef = doc(collection(projectRef, 'activity'), stableId(`${project.id}:${update.date}:${update.message}`));
        await createIfMissing(activityRef, {
          id: activityRef.id,
          projectId,
          actorUid: importingAdminUid,
          actorName: 'Legacy import',
          action: 'Previous project update',
          details: update.message,
          clientVisible: true,
          createdAt: update.date || now,
        });
      }
    } catch (error) {
      result.errors.push(`Project "${project.title || project.id}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const task of snapshot.tasks) {
    try {
      const relatedProjectId =
        (task.relatedEntityId && (projectIds.get(task.relatedEntityId) || projectIds.get(`task:${task.relatedEntityId}`))) ||
        (task.workspaceId && projectsByWorkspace.get(task.workspaceId)?.length === 1
          ? projectsByWorkspace.get(task.workspaceId)?.[0].id
          : undefined);
      const relatedProject = relatedProjectId
        ? Array.from(projectIds.entries()).find(([, id]) => id === relatedProjectId)?.[0]
        : undefined;
      const clientUid = relatedProject ? projectClients.get(relatedProject) : undefined;
      const taskId = stableId(task.id);
      const taskRef = relatedProjectId
        ? doc(db, 'clientProjects', relatedProjectId, 'tasks', taskId)
        : doc(db, 'productionTasks', taskId);
      const now = new Date().toISOString();
      const created = await createIfMissing(taskRef, {
        id: taskId,
        ...(relatedProjectId ? { projectId: relatedProjectId } : {}),
        ...(clientUid ? { clientUid } : {}),
        ...(task.workspaceId ? { workspaceId: task.workspaceId } : {}),
        title: task.title || 'Untitled legacy task',
        description: task.notes || '',
        status: task.status || 'Todo',
        dueDate: task.dueDate || '',
        clientVisible: false,
        subtasks: [],
        createdAt: task.createdAt || now,
        updatedAt: now,
      });
      if (created) result.tasksImported++;
      else result.tasksSkipped++;

      await createIfMissing(doc(taskRef, 'admin', 'details'), {
        assignee: task.assignee || '',
        assigneeUid: '',
        relatedEntityId: task.relatedEntityId || '',
        relatedEntityName: task.relatedEntityName || '',
        importedAt: now,
      });
    } catch (error) {
      result.errors.push(`Task "${task.title || task.id}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return result;
}

export function legacyClientAssignmentSuggestions(
  snapshot: LegacyProductionSnapshot,
  clientUids: Set<string>,
): Record<string, string> {
  const assignments: Record<string, string> = {};
  for (const project of snapshot.projects) {
    const ownerId = snapshot.workspaces.find(workspace => workspace.id === project.workspaceId)?.ownerId;
    if (ownerId && clientUids.has(ownerId)) assignments[project.id] = ownerId;
  }
  return assignments;
}
