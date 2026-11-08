import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const DATABASE_ID = 'ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38';

admin.initializeApp();
const db = getFirestore(admin.app(), DATABASE_ID);

function notificationId(eventKey: string): string {
  return `evt_${eventKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120)}`;
}

async function notifyUser(
  uid: string,
  eventKey: string,
  title: string,
  message: string,
  type: string,
  projectId?: string,
  entityId?: string,
  dueDate?: string,
) {
  if (!uid) return;
  const now = new Date().toISOString();
  const notificationRef = db.collection('userNotifications').doc(uid).collection('items').doc(notificationId(eventKey));
  const notification = {
    recipientUid: uid,
    title,
    message,
    type,
    ...(projectId ? { projectId } : {}),
    ...(entityId ? { entityId } : {}),
    ...(dueDate ? { dueDate } : {}),
    read: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.runTransaction(async transaction => {
    const existing = await transaction.get(notificationRef);
    if (!existing.exists) transaction.create(notificationRef, notification);
  });
}

async function notifyAdmins(
  eventKey: string,
  title: string,
  message: string,
  type: string,
  projectId?: string,
  entityId?: string,
) {
  const admins = await db.collection('admins').get();
  await Promise.all(admins.docs.map(adminDoc =>
    notifyUser(adminDoc.id, eventKey, title, message, type, projectId, entityId)
  ));
}

export const adminUpdateClientProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  const adminSnap = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminSnap.exists) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  const uid = String(data?.uid || '');
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'uid required.');
  const updates: Record<string, any> = {};
  if (typeof data.displayName === 'string') updates.displayName = data.displayName.trim();
  if (typeof data.organizationName === 'string') updates.organizationName = data.organizationName.trim();
  if (typeof data.accountType === 'string') updates.accountType = data.accountType;
  if (typeof data.status === 'string') updates.status = data.status;
  updates.updatedAt = new Date().toISOString();
  await db.collection('clientProfiles').doc(uid).set(updates, { merge: true });
  await db.collection('adminAuditLogs').add({
    actorUid: context.auth.uid,
    action: 'update_client_profile',
    targetUid: uid,
    details: JSON.stringify(updates),
    createdAt: new Date().toISOString(),
  });
  return { ok: true };
});

function requireText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    throw new functions.https.HttpsError('invalid-argument', `${label} is required and must be ${maxLength} characters or fewer.`);
  }
  return value.trim();
}

function optionalDate(value: unknown, label: string): string {
  if (value === undefined || value === null || value === '') return '';
  const date = requireText(value, label, 10);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new functions.https.HttpsError('invalid-argument', `${label} must be a valid calendar date in YYYY-MM-DD format.`);
  }
  return date;
}

async function getOwnedPublishedDeliverable(projectId: string, deliverableId: string, uid: string) {
  const profile = await db.collection('clientProfiles').doc(uid).get();
  if (!profile.exists || profile.get('onboardingComplete') !== true || profile.get('status') === 'Suspended') {
    throw new functions.https.HttpsError('permission-denied', 'An active client profile is required for this action.');
  }
  const projectRef = db.collection('clientProjects').doc(projectId);
  const deliverableRef = projectRef.collection('deliverables').doc(deliverableId);
  const [projectSnap, deliverableSnap] = await Promise.all([projectRef.get(), deliverableRef.get()]);
  if (!projectSnap.exists || projectSnap.get('clientUid') !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'This project is not assigned to your account.');
  }
  const workspaceId = projectSnap.get('workspaceId');
  if (typeof workspaceId === 'string') {
    const workspace = await db.collection('workspaces').doc(workspaceId).get();
    if (!workspace.exists || workspace.get('ownerId') !== uid || !['Active', 'Onboarding'].includes(workspace.get('status') || 'Active')) {
      throw new functions.https.HttpsError('permission-denied', 'This workspace is not available to your account.');
    }
  }
  if (!deliverableSnap.exists || deliverableSnap.get('clientUid') !== uid || deliverableSnap.get('isClientPublished') !== true) {
    throw new functions.https.HttpsError('not-found', 'Published deliverable not found.');
  }
  return { projectRef, projectSnap, deliverableRef, deliverableSnap };
}

export const submitProductionRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in before submitting a production request.');
  }

  const uid = context.auth.uid;
  const profile = await db.collection('clientProfiles').doc(uid).get();
  if (!profile.exists || profile.get('onboardingComplete') !== true || profile.get('status') === 'Suspended') {
    throw new functions.https.HttpsError('failed-precondition', 'Complete your client profile before submitting a production request.');
  }
  const workspaceId = typeof data?.workspaceId === 'string' ? requireText(data.workspaceId, 'Workspace ID', 128) : '';
  if (workspaceId) {
    if (!/^[a-zA-Z0-9_-]+$/.test(workspaceId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Workspace ID is invalid.');
    }
    const workspace = await db.collection('workspaces').doc(workspaceId).get();
    if (!workspace.exists || workspace.get('ownerId') !== uid || workspace.get('status') === 'Paused' || workspace.get('status') === 'Archived') {
      throw new functions.https.HttpsError('permission-denied', 'This workspace is not available to your account.');
    }
  }
  const title = requireText(data?.title, 'Project title', 160);
  const description = requireText(data?.description, 'Project brief', 5000);
  const dueDate = optionalDate(data?.dueDate, 'Expected delivery date');
  const now = new Date().toISOString();
  const projectRef = db.collection('clientProjects').doc();

  const batch = db.batch();
  batch.create(projectRef, {
    id: projectRef.id,
    clientUid: uid,
    ...(workspaceId ? { workspaceId } : {}),
    title,
    description,
    category: requireText(data?.category, 'Project category', 80),
    status: 'Pending',
    stage: 'New Request',
    priority: ['Low', 'Normal', 'High', 'Urgent'].includes(data?.priority) ? data.priority : 'Normal',
    progress: 0,
    startDate: now.slice(0, 10),
    expectedDeliveryDate: dueDate,
    createdAt: now,
    updatedAt: now,
  });

  const activityRef = projectRef.collection('activity').doc();
  batch.create(activityRef, {
    projectId: projectRef.id,
    actorUid: uid,
    actorName: context.auth.token.name || 'Client',
    action: 'Production request submitted',
    details: 'Your request was sent to the production team.',
    clientVisible: true,
    createdAt: now,
  });
  await batch.commit();

  return { success: true, projectId: projectRef.id };
});

export const requestProductionRevision = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in before requesting a revision.');
  }

  const projectId = requireText(data?.projectId, 'Project ID', 150);
  const deliverableId = requireText(data?.deliverableId, 'Deliverable ID', 150);
  const feedback = requireText(data?.feedback, 'Revision feedback', 5000);
  const uid = context.auth.uid;
  const { projectRef, deliverableRef, deliverableSnap } = await getOwnedPublishedDeliverable(projectId, deliverableId, uid);
  const currentStatus = deliverableSnap.get('reviewStatus');
  if (currentStatus !== 'Awaiting Review' && currentStatus !== 'Revised - Awaiting Review') {
    throw new functions.https.HttpsError('failed-precondition', 'This deliverable is not accepting revision requests.');
  }

  const now = new Date().toISOString();
  const revisionRef = projectRef.collection('revisionRequests').doc();
  const activityRef = projectRef.collection('activity').doc();
  await db.runTransaction(async (transaction) => {
    const freshProject = await transaction.get(projectRef);
    const freshDeliverable = await transaction.get(deliverableRef);
    if (!freshProject.exists || freshProject.get('clientUid') !== uid ||
        !freshDeliverable.exists || freshDeliverable.get('clientUid') !== uid ||
        freshDeliverable.get('isClientPublished') !== true ||
        !['Awaiting Review', 'Revised - Awaiting Review'].includes(freshDeliverable.get('reviewStatus'))) {
      throw new functions.https.HttpsError('failed-precondition', 'The project or deliverable changed; refresh and try again.');
    }

    transaction.create(revisionRef, {
      id: revisionRef.id,
      projectId,
      deliverableId,
      clientUid: uid,
      feedback,
      status: 'Submitted',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    transaction.update(deliverableRef, { reviewStatus: 'Revision Requested', updatedAt: now });
    transaction.update(projectRef, {
      stage: 'Revision Required',
      status: 'In Progress',
      updatedAt: now,
    });
    transaction.create(activityRef, {
      projectId,
      actorUid: uid,
      actorName: context.auth?.token.name || 'Client',
      action: 'Revision requested',
      details: `Revision requested for ${deliverableSnap.get('title') || 'a deliverable'}.`,
      clientVisible: true,
      createdAt: now,
    });
  });

  return { success: true, revisionId: revisionRef.id };
});

export const approveProductionDeliverable = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in before approving a deliverable.');
  }

  const projectId = requireText(data?.projectId, 'Project ID', 150);
  const deliverableId = requireText(data?.deliverableId, 'Deliverable ID', 150);
  const feedback = typeof data?.feedback === 'string' ? data.feedback.trim().slice(0, 5000) : '';
  const uid = context.auth.uid;
  const { projectRef, deliverableRef, deliverableSnap } = await getOwnedPublishedDeliverable(projectId, deliverableId, uid);
  const currentStatus = deliverableSnap.get('reviewStatus');
  if (currentStatus !== 'Awaiting Review' && currentStatus !== 'Revised - Awaiting Review') {
    throw new functions.https.HttpsError('failed-precondition', 'This deliverable is not awaiting approval.');
  }

  const now = new Date().toISOString();
  const activityRef = projectRef.collection('activity').doc();
  await db.runTransaction(async (transaction) => {
    const freshProject = await transaction.get(projectRef);
    const freshDeliverable = await transaction.get(deliverableRef);
    if (!freshProject.exists || freshProject.get('clientUid') !== uid ||
        !freshDeliverable.exists || freshDeliverable.get('clientUid') !== uid ||
        freshDeliverable.get('isClientPublished') !== true ||
        !['Awaiting Review', 'Revised - Awaiting Review'].includes(freshDeliverable.get('reviewStatus'))) {
      throw new functions.https.HttpsError('failed-precondition', 'The project or deliverable changed; refresh and try again.');
    }
    const publishedDeliverables = await transaction.get(
      projectRef.collection('deliverables').where('isClientPublished', '==', true)
    );
    const allPublishedDeliverablesApproved = publishedDeliverables.docs.every(deliverable =>
      deliverable.id === deliverableId || deliverable.get('reviewStatus') === 'Approved'
    );
    transaction.update(deliverableRef, {
      reviewStatus: 'Approved',
      feedback,
      approvedBy: uid,
      approvedAt: now,
      updatedAt: now,
    });
    transaction.update(projectRef, {
      ...(allPublishedDeliverablesApproved && freshProject.get('stage') !== 'Delivered'
        ? { stage: 'Ready for Delivery', status: 'In Progress' }
        : {}),
      updatedAt: now,
    });
    transaction.create(activityRef, {
      projectId,
      actorUid: uid,
      actorName: context.auth?.token.name || 'Client',
      action: 'Deliverable approved',
      details: `${deliverableSnap.get('title') || 'A deliverable'} was approved.`,
      clientVisible: true,
      createdAt: now,
    });
  });

  return { success: true };
});

export const rejectProductionDeliverable = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in before rejecting a deliverable.');
  }

  const projectId = requireText(data?.projectId, 'Project ID', 150);
  const deliverableId = requireText(data?.deliverableId, 'Deliverable ID', 150);
  const feedback = requireText(data?.feedback, 'Rejection feedback', 5000);
  const uid = context.auth.uid;
  const { projectRef, deliverableRef, deliverableSnap } = await getOwnedPublishedDeliverable(projectId, deliverableId, uid);
  if (!['Awaiting Review', 'Revised - Awaiting Review'].includes(deliverableSnap.get('reviewStatus'))) {
    throw new functions.https.HttpsError('failed-precondition', 'This deliverable is not awaiting review.');
  }

  const now = new Date().toISOString();
  const activityRef = projectRef.collection('activity').doc();
  await db.runTransaction(async transaction => {
    const [freshProject, freshDeliverable] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(deliverableRef),
    ]);
    if (!freshProject.exists || freshProject.get('clientUid') !== uid ||
        !freshDeliverable.exists || freshDeliverable.get('clientUid') !== uid ||
        freshDeliverable.get('isClientPublished') !== true ||
        !['Awaiting Review', 'Revised - Awaiting Review'].includes(freshDeliverable.get('reviewStatus'))) {
      throw new functions.https.HttpsError('failed-precondition', 'The project or deliverable changed; refresh and try again.');
    }

    transaction.update(deliverableRef, {
      reviewStatus: 'Rejected',
      feedback,
      rejectedBy: uid,
      rejectedAt: now,
      updatedAt: now,
    });
    transaction.create(activityRef, {
      projectId,
      actorUid: uid,
      actorName: context.auth?.token.name || 'Client',
      action: 'Deliverable rejected',
      details: `${deliverableSnap.get('title') || 'A deliverable'} was rejected with feedback.`,
      clientVisible: true,
      createdAt: now,
    });
  });

  return { success: true };
});

export const productionProjectCreated = functions.firestore
  .document('clientProjects/{projectId}')
  .onCreate(async (snapshot, context) => {
    const project = snapshot.data();
    const projectId = context.params.projectId;
    await notifyUser(
      project.clientUid,
      `project_created_${projectId}`,
      'Production project created',
      `${project.title || 'Your project'} is now in the production workspace.`,
      'project',
      projectId,
    );
    if (project.stage === 'New Request' && project.status === 'Pending') {
      await notifyAdmins(`project_created_${projectId}`, 'New production project', `${project.title || 'A project'} was created.`, 'project', projectId);
    }
  });

export const productionProjectUpdated = functions.firestore
  .document('clientProjects/{projectId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.stage === after.stage) return;
    await notifyUser(
      after.clientUid,
      `project_stage_${context.params.projectId}_${change.after.updateTime!.toMillis()}`,
      'Project stage updated',
      `${after.title || 'Your project'} moved to ${after.stage || 'a new stage'}.`,
      'stage',
      context.params.projectId,
    );
  });

export const productionTaskCreated = functions.firestore
  .document('clientProjects/{projectId}/tasks/{taskId}')
  .onCreate(async (snapshot, context) => {
    const task = snapshot.data();
    const projectId = context.params.projectId;
    const taskId = context.params.taskId;
    if (task.clientVisible === true) {
      await notifyUser(task.clientUid, `task_created_${taskId}`, 'New project task', `${task.title || 'A task'} was added to your project.`, 'task', projectId, taskId);
    }
  });

export const productionTaskUpdated = functions.firestore
  .document('clientProjects/{projectId}/tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const projectId = context.params.projectId;
    const taskId = context.params.taskId;
    if (before.status !== 'Done' && after.status === 'Done') {
      const recipients = new Set<string>();
      if (after.clientVisible === true && typeof after.clientUid === 'string') recipients.add(after.clientUid);
      const details = await change.after.ref.collection('admin').doc('details').get();
      if (typeof details.get('assigneeUid') === 'string' && details.get('assigneeUid')) recipients.add(details.get('assigneeUid'));
      await Promise.all([...recipients].map(uid =>
        notifyUser(uid, `task_completed_${taskId}_${change.after.updateTime!.toMillis()}`, 'Task completed', `${after.title || 'A task'} was marked complete.`, 'task', projectId, taskId)
      ));
    }
  });

export const productionTaskAssignmentChanged = functions.firestore
  .document('clientProjects/{projectId}/tasks/{taskId}/admin/details')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;
    const beforeUid = change.before.exists ? change.before.get('assigneeUid') : '';
    const afterUid = change.after.get('assigneeUid');
    if (typeof afterUid !== 'string' || !afterUid || beforeUid === afterUid) return;
    const task = await change.after.ref.parent.parent?.get();
    const taskTitle = task?.get('title') || 'A production task';
    await notifyUser(
      afterUid,
      `task_assigned_${context.params.taskId}_${afterUid}_${change.after.updateTime!.toMillis()}`,
      'Production task assigned',
      `${taskTitle} was assigned to you.`,
      'assignment',
      context.params.projectId,
      context.params.taskId,
    );
  });

export const productionDeliverableCreated = functions.firestore
  .document('clientProjects/{projectId}/deliverables/{deliverableId}')
  .onCreate(async (snapshot, context) => {
    const deliverable = snapshot.data();
    if (deliverable.isClientPublished !== true) return;
    await notifyUser(
      deliverable.clientUid,
      `deliverable_published_${context.params.deliverableId}`,
      'Deliverable ready for review',
      `${deliverable.title || 'A deliverable'} is available in your workspace.`,
      'deliverable',
      context.params.projectId,
      context.params.deliverableId,
    );
  });

export const productionDeliverableUpdated = functions.firestore
  .document('clientProjects/{projectId}/deliverables/{deliverableId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const projectId = context.params.projectId;
    const deliverableId = context.params.deliverableId;
    if (before.isClientPublished !== true && after.isClientPublished === true) {
      await notifyUser(
        after.clientUid,
        `deliverable_published_${deliverableId}_${change.after.updateTime!.toMillis()}`,
        'Deliverable ready for review',
        `${after.title || 'A deliverable'} is available in your workspace.`,
        'deliverable',
        projectId,
        deliverableId,
      );
    }
    if (before.reviewStatus !== after.reviewStatus && ['Approved', 'Rejected'].includes(after.reviewStatus)) {
      const label = after.reviewStatus === 'Approved' ? 'approved' : 'rejected';
      await notifyAdmins(
        `deliverable_${label}_${deliverableId}_${change.after.updateTime!.toMillis()}`,
        `Deliverable ${label}`,
        `${after.title || 'A deliverable'} was ${label} by the client.`,
        'review',
        projectId,
        deliverableId,
      );
    }
  });

export const productionRevisionCreated = functions.firestore
  .document('clientProjects/{projectId}/revisionRequests/{revisionId}')
  .onCreate(async (snapshot, context) => {
    const revision = snapshot.data();
    await notifyAdmins(
      `revision_created_${context.params.revisionId}`,
      'Revision requested',
      revision.feedback || 'A client requested a deliverable revision.',
      'revision',
      context.params.projectId,
      revision.deliverableId,
    );
  });

export const productionRevisionUpdated = functions.firestore
  .document('clientProjects/{projectId}/revisionRequests/{revisionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status) return;
    await notifyUser(
      after.clientUid,
      `revision_status_${context.params.revisionId}_${change.after.updateTime!.toMillis()}`,
      'Revision status updated',
      `Your revision request is now ${after.status}.`,
      'revision',
      context.params.projectId,
      context.params.revisionId,
    );
  });

export const productionDeadlineReminders = functions.pubsub.schedule('every 24 hours').timeZone('Etc/UTC').onRun(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const [projects, admins] = await Promise.all([
    db.collection('clientProjects').where('expectedDeliveryDate', '<=', today).get(),
    db.collection('admins').get(),
  ]);
  const adminUids = admins.docs.map(item => item.id);
  const work: Promise<void>[] = [];
  for (const projectDoc of projects.docs) {
    const project = projectDoc.data();
    const projectId = projectDoc.id;
    const projectDue = typeof project.expectedDeliveryDate === 'string' ? project.expectedDeliveryDate : '';
    if (projectDue && projectDue <= today && !['Completed', 'Delivered'].includes(project.status) && project.stage !== 'Delivered') {
      const overdue = projectDue < today;
      const message = `${project.title || 'A project'} is ${overdue ? 'overdue' : 'due today'} (${projectDue}).`;
      work.push(notifyUser(project.clientUid, `deadline_project_${projectId}_${projectDue}`, overdue ? 'Project overdue' : 'Project due today', message, 'deadline', projectId, undefined, projectDue));
      work.push(...adminUids.map(uid => notifyUser(uid, `deadline_project_${projectId}_${projectDue}`, overdue ? 'Project overdue' : 'Project due today', message, 'deadline', projectId, undefined, projectDue)));
    }

    const tasks = await projectDoc.ref.collection('tasks').where('dueDate', '<=', today).get();
    for (const taskDoc of tasks.docs) {
      const task = taskDoc.data();
      const dueDate = typeof task.dueDate === 'string' ? task.dueDate : '';
      if (!dueDate || dueDate > today || task.status === 'Done') continue;
      const overdue = dueDate < today;
      const message = `${task.title || 'A production task'} is ${overdue ? 'overdue' : 'due today'} (${dueDate}).`;
      const recipients = new Set<string>(adminUids);
      if (task.clientVisible === true && typeof task.clientUid === 'string') recipients.add(task.clientUid);
      const details = await taskDoc.ref.collection('admin').doc('details').get();
      if (typeof details.get('assigneeUid') === 'string' && details.get('assigneeUid')) recipients.add(details.get('assigneeUid'));
      work.push(...[...recipients].map(uid =>
        notifyUser(uid, `deadline_task_${taskDoc.id}_${dueDate}`, overdue ? 'Task overdue' : 'Task due today', message, 'deadline', projectId, taskDoc.id, dueDate)
      ));
    }
  }
  await Promise.all(work);
  return null;
});
