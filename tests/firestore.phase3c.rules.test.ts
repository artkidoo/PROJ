import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

async function runPhase3CSecurityTests() {
  const rules = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');
  let testEnv: RulesTestEnvironment | null = null;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: 'keedohub-phase3c-test',
      firestore: { rules, host: 'localhost', port: 8080 },
    });

    const clientA = testEnv.authenticatedContext('client-a').firestore();
    const clientB = testEnv.authenticatedContext('client-b').firestore();
    const admin = testEnv.authenticatedContext('admin-user').firestore();

    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await db.doc('admins/admin-user').set({ uid: 'admin-user' });
      for (const uid of ['client-a', 'client-b']) {
        await db.doc(`clientProfiles/${uid}`).set({ uid, displayName: uid });
      }
      await db.doc('users/staff-a').set({ uid: 'staff-a', displayName: 'Staff A' });
      await db.doc('userNotifications/client-a/items/notice-a').set({
        recipientUid: 'client-a',
        title: 'Deliverable published',
        message: 'A new file is ready to review.',
        type: 'deliverable',
        projectId: 'project-a',
        read: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
      await db.doc('userNotifications/client-b/items/notice-b').set({
        recipientUid: 'client-b',
        title: 'Private notification',
        message: 'Client B only.',
        type: 'project',
        read: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
      await db.doc('clientProjects/project-a').set({
        id: 'project-a',
        clientUid: 'client-a',
        title: 'Client A project',
        description: 'Project description',
        category: 'Creative',
        progress: 25,
        status: 'In Progress',
        startDate: '2026-01-01',
        expectedDeliveryDate: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        stage: 'In Production',
        priority: 'Normal',
      });
      await db.doc('clientProjects/project-b').set({
        id: 'project-b',
        clientUid: 'client-b',
        title: 'Client B project',
        description: 'Project description',
        category: 'Creative',
        progress: 0,
        status: 'Pending',
        startDate: '2026-01-01',
        expectedDeliveryDate: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        stage: 'New Request',
        priority: 'Normal',
      });
      await db.doc('clientProjects/project-b/deliverables/deliverable-b').set({
        id: 'deliverable-b',
        projectId: 'project-b',
        clientUid: 'client-b',
        title: 'Client B deliverable',
        isClientPublished: true,
        reviewStatus: 'Awaiting Review',
      });
      await db.doc('clientProjects/project-a/tasks/task-public').set({
        id: 'task-public',
        projectId: 'project-a',
        clientUid: 'client-a',
        title: 'Visible task',
        status: 'Todo',
        clientVisible: true,
      });
      await db.doc('clientProjects/project-a/tasks/task-private').set({
        id: 'task-private',
        projectId: 'project-a',
        clientUid: 'client-a',
        title: 'Private task',
        status: 'Todo',
        clientVisible: false,
      });
      await db.doc('clientProjects/project-a/tasks/task-public/admin/details').set({
        assignee: 'Private assignee',
        assigneeUid: 'staff-uid',
      });
      await db.doc('clientProjects/project-a/deliverables/published').set({
        id: 'published',
        projectId: 'project-a',
        clientUid: 'client-a',
        title: 'Published deliverable',
        isClientPublished: true,
        reviewStatus: 'Awaiting Review',
      });
      await db.doc('clientProjects/project-a/deliverables/draft').set({
        id: 'draft',
        projectId: 'project-a',
        clientUid: 'client-a',
        title: 'Private draft',
        isClientPublished: false,
        reviewStatus: 'Draft',
      });
      await db.doc('clientProjects/project-a/internalNotes/note-a').set({ content: 'Admin-only note' });
      await db.doc('clientProjects/project-a/activity/visible').set({
        projectId: 'project-a',
        actorUid: 'admin-user',
        action: 'Stage changed',
        details: 'Client-visible update',
        clientVisible: true,
      });
      await db.doc('clientProjects/project-a/activity/private').set({
        projectId: 'project-a',
        actorUid: 'admin-user',
        action: 'Internal update',
        details: 'Private update',
        clientVisible: false,
      });
      await db.doc('clientProjects/project-a/revisionRequests/revision-a').set({
        id: 'revision-a',
        projectId: 'project-a',
        clientUid: 'client-a',
        deliverableId: 'published',
        feedback: 'Please revise the color',
        status: 'Submitted',
        submittedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    await assertSucceeds(clientA.doc('clientProjects/project-a').get());
    await assertFails(clientB.doc('clientProjects/project-a').get());
    await assertSucceeds(clientA.collection('clientProjects').where('clientUid', '==', 'client-a').get());
    await assertFails(clientA.doc('clientProjects/project-a').update({ progress: 100 }));
    await assertFails(admin.doc('clientProjects/project-a').update({ internalMemo: 'Private data' }));
    await assertFails(clientA.doc('clientProjects/project-a/tasks/task-private').get());
    await assertSucceeds(clientA.doc('clientProjects/project-a/tasks/task-public').get());
    await assertSucceeds(clientA.collection('clientProjects/project-a/tasks')
      .where('clientVisible', '==', true)
      .where('clientUid', '==', 'client-a')
      .where('projectId', '==', 'project-a')
      .get());
    await assertFails(clientA.doc('clientProjects/project-a/tasks/task-public/admin/details').get());
    await assertSucceeds(admin.doc('clientProjects/project-a/tasks/task-public/admin/details').get());
    await assertSucceeds(admin.doc('clientProjects/project-a/tasks/task-public/admin/details').set({ assigneeUid: 'staff-a' }, { merge: true }));
    await assertFails(admin.doc('clientProjects/project-a/tasks/task-public/admin/details').set({ assigneeUid: 'missing-staff' }, { merge: true }));
    await assertFails(clientA.doc('clientProjects/project-a/tasks/task-public').update({ status: 'Done' }));
    await assertSucceeds(admin.doc('clientProjects/project-a/tasks/task-public').update({ status: 'Done' }));
    await assertSucceeds(clientA.doc('clientProjects/project-a/deliverables/published').get());
    await assertFails(clientA.doc('clientProjects/project-a/deliverables/draft').get());
    await assertFails(clientB.doc('clientProjects/project-a/deliverables/published').get());
    await assertSucceeds(clientA.collection('clientProjects/project-a/deliverables')
      .where('isClientPublished', '==', true)
      .where('clientUid', '==', 'client-a')
      .where('projectId', '==', 'project-a')
      .get());
    await assertFails(clientA.doc('clientProjects/project-a/deliverables/published').update({ reviewStatus: 'Approved' }));
    await assertFails(clientA.doc('clientProjects/project-a/deliverables/published').update({ isClientPublished: false }));
    await assertSucceeds(admin.doc('clientProjects/project-a/deliverables/published').update({ reviewStatus: 'Rejected' }));
    await assertSucceeds(admin.doc('clientProjects/project-a/deliverables/published').update({
      storagePath: 'production/project-a/deliverables/published/v2/revised-artwork.pdf',
    }));
    await assertFails(admin.doc('clientProjects/project-a/deliverables/published').update({
      storagePath: 'production/project-a/deliverables/published/v2/nested/revised-artwork.pdf',
    }));
    await assertSucceeds(admin.collectionGroup('deliverables').get());
    await assertFails(clientA.collectionGroup('deliverables').get());
    await assertFails(clientA.doc('clientProjects/project-a/internalNotes/note-a').get());
    await assertSucceeds(admin.doc('clientProjects/project-a/internalNotes/note-a').get());
    await assertSucceeds(clientA.doc('clientProjects/project-a/activity/visible').get());
    await assertFails(clientA.doc('clientProjects/project-a/activity/private').get());
    await assertSucceeds(clientA.collection('clientProjects/project-a/activity')
      .where('clientVisible', '==', true)
      .where('projectId', '==', 'project-a')
      .get());
    await assertSucceeds(clientA.doc('clientProjects/project-a/revisionRequests/revision-a').get());
    await assertSucceeds(clientA.collection('clientProjects/project-a/revisionRequests')
      .where('clientUid', '==', 'client-a')
      .where('projectId', '==', 'project-a')
      .get());
    await assertSucceeds(admin.collectionGroup('revisionRequests').get());
    await assertFails(clientA.collectionGroup('revisionRequests').get());
    await assertFails(clientB.doc('clientProjects/project-a/revisionRequests/revision-a').get());
    await assertFails(clientA.doc('clientProjects/project-a/revisionRequests/client-created').set({
      id: 'client-created',
      projectId: 'project-a',
      clientUid: 'client-a',
      deliverableId: 'published',
      feedback: 'Client direct write',
      status: 'Submitted',
      submittedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));
    await assertSucceeds(clientA.doc('userNotifications/client-a/items/notice-a').get());
    await assertFails(clientA.doc('userNotifications/client-b/items/notice-b').get());
    await assertSucceeds(clientA.doc('userNotifications/client-a/items/notice-a').update({
      read: true,
      updatedAt: '2026-01-02T00:00:00.000Z',
    }));
    await assertFails(clientA.doc('userNotifications/client-a/items/client-created').set({
      recipientUid: 'client-a',
      read: false,
    }));
    await assertFails(clientA.doc('userNotifications/client-a/items/notice-a').update({
      read: false,
      title: 'Tampered',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }));

    await assertSucceeds(admin.doc('clientProjects/admin-created').set({
      id: 'admin-created',
      clientUid: 'client-a',
      title: 'Assigned project',
      description: '',
      category: 'Creative',
      progress: 0,
      status: 'Pending',
      startDate: '2026-01-01',
      expectedDeliveryDate: '',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      stage: 'New Request',
      priority: 'Normal',
    }));
    await assertSucceeds(admin.doc('clientProjects/admin-created').update({ clientUid: 'client-b' }));
    await assertFails(clientA.doc('clientProjects/admin-created').get());
    await assertSucceeds(clientB.doc('clientProjects/admin-created').get());
    await assertFails(clientA.doc('clientProjects/project-a/internalNotes/client-write').set({ content: 'Not allowed' }));
    await assertFails(admin.doc('clientProjects/project-a/revisionRequests/wrong-client').set({
      projectId: 'project-a',
      clientUid: 'client-b',
      deliverableId: 'deliverable-b',
      feedback: 'Invalid cross-project revision',
      status: 'Submitted',
      id: 'wrong-client',
      submittedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));
    await assertSucceeds(admin.doc('clientProjects/project-a/revisionRequests/revision-admin').set({
      id: 'revision-admin',
      projectId: 'project-a',
      clientUid: 'client-a',
      deliverableId: 'published',
      feedback: 'Valid admin-created revision',
      status: 'Submitted',
      submittedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));
    await assertFails(clientA.doc('clientProjects/project-a/tasks/client-task').set({
      id: 'client-task',
      projectId: 'project-a',
      clientUid: 'client-a',
      title: 'Unauthorized task',
      status: 'Todo',
      clientVisible: true,
    }));
    await assertFails(admin.doc('clientProjects/project-a/tasks/cross-project-task').set({
      id: 'cross-project-task',
      projectId: 'project-b',
      clientUid: 'client-b',
      title: 'Wrong project relation',
      status: 'Todo',
      clientVisible: true,
    }));

    console.log('Phase 3C/3D/3E Firestore rules tests passed.');
  } finally {
    await testEnv?.cleanup();
  }
}

void runPhase3CSecurityTests().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
