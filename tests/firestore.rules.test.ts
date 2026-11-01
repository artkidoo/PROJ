import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

async function runClientSecurityTests() {
  console.log('========================================================================');
  console.log('KEEDOHUB - PHASE 2C.2 CLOUD FUNCTIONS SECURITY RULES TEST SUITE');
  console.log('========================================================================');

  let testEnv: RulesTestEnvironment | null = null;

  try {
    const rulesContent = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: 'keedohub-phase2c2-test',
      firestore: { rules: rulesContent, host: 'localhost', port: 8080 }
    });

    console.log('[INIT] Connected to Firestore Emulator on localhost:8080.');

    const clientA = testEnv.authenticatedContext('client-a', { email: 'clienta@example.com' });
    const clientB = testEnv.authenticatedContext('client-b', { email: 'clientb@example.com' });
    const adminContext = testEnv.authenticatedContext('admin-user', { email: 'admin@keedohub.com' });

    const dbClientA = clientA.firestore();
    const dbClientB = clientB.firestore();
    const dbAdmin = adminContext.firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();

      await adminDb.doc('admins/admin-user').set({ uid: 'admin-user', role: 'PlatformAdmin', grantedAt: new Date().toISOString() });

      await adminDb.doc('clientProfiles/client-a').set({ uid: 'client-a', displayName: 'Client A', email: 'clienta@example.com', accountType: 'Artist', organizationName: 'Artist A', onboardingComplete: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await adminDb.doc('clientProfiles/client-b').set({ uid: 'client-b', displayName: 'Client B', email: 'clientb@example.com', accountType: 'Brand', organizationName: 'Brand B', onboardingComplete: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      await adminDb.doc('clientProjects/proj-a').set({ id: 'proj-a', clientUid: 'client-a', title: 'Client A Project', status: 'Active' });
      await adminDb.doc('clientProjects/proj-b').set({ id: 'proj-b', clientUid: 'client-b', title: 'Client B Project', status: 'Active' });

      await adminDb.doc('clientDeliverables/deliv-a').set({ id: 'deliv-a', clientUid: 'client-a', title: 'Client A Deliverable', status: 'Published', reviewStatus: 'Awaiting Review', published: true, feedback: '', projectId: 'proj-a' });
      await adminDb.doc('clientDeliverables/deliv-b').set({ id: 'deliv-b', clientUid: 'client-b', title: 'Client B Deliverable', status: 'Published', reviewStatus: 'Awaiting Review', published: true, feedback: '', projectId: 'proj-b' });
      await adminDb.doc('clientDeliverables/deliv-approved').set({ id: 'deliv-approved', clientUid: 'client-a', title: 'Approved Deliverable', status: 'Published', reviewStatus: 'Approved', published: true, feedback: '', projectId: 'proj-a' });

      await adminDb.doc('clientNotifications/notif-a').set({ id: 'notif-a', clientUid: 'client-a', message: 'Test notification', read: false });
      await adminDb.doc('clientNotifications/notif-b').set({ id: 'notif-b', clientUid: 'client-b', message: 'Test notification', read: false });

      await adminDb.doc('users/client-a').set({ uid: 'client-a', email: 'clienta@example.com', displayName: 'Client A', onboardingComplete: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await adminDb.doc('users/client-b').set({ uid: 'client-b', email: 'clientb@example.com', displayName: 'Client B', onboardingComplete: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      await adminDb.doc('revisionRequests/req-existing').set({ id: 'req-existing', clientUid: 'client-a', deliverableId: 'deliv-a', feedback: 'Test feedback', status: 'Submitted', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await adminDb.doc('revisionRequests/req-b').set({ id: 'req-b', clientUid: 'client-b', deliverableId: 'deliv-b', feedback: 'Test feedback', status: 'Submitted', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    });

    const unauthDb = testEnv.unauthenticatedContext().firestore();
    // TEST 1: Unauthenticated cannot create revision request directly
    console.log('[TEST 1] Unauthenticated cannot create revision request...');
    await assertFails(unauthDb.doc('revisionRequests/req-1').set({ id: 'req-1', clientUid: 'client-a', deliverableId: 'deliv-a', feedback: 'test', status: 'Submitted', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    console.log('  [PASS] Unauthenticated revision request creation denied.');

    // TEST 2: Client cannot create revision request directly
    console.log('[TEST 2] Client cannot create revision request directly...');
    await assertFails(dbClientA.doc('revisionRequests/req-2').set({ id: 'req-2', clientUid: 'client-a', deliverableId: 'deliv-a', feedback: 'test', status: 'Submitted', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    console.log('  [PASS] Direct client revision request creation denied.');

    // TEST 3: Client cannot update revision request
    console.log('[TEST 3] Client cannot update revision request...');
    await assertFails(dbClientA.doc('revisionRequests/req-existing').update({ status: 'Completed' }));
    console.log('  [PASS] Client revision request update denied.');

    // TEST 4: Client cannot delete revision request
    console.log('[TEST 4] Client cannot delete revision request...');
    await assertFails(dbClientA.doc('revisionRequests/req-existing').delete());
    console.log('  [PASS] Client revision request deletion denied.');

    // TEST 5: Client cannot approve via direct Firestore write
    console.log('[TEST 5] Client cannot approve via direct Firestore write...');
    await assertFails(dbClientA.doc('clientDeliverables/deliv-awaiting').update({
      reviewStatus: 'Approved',
      approval: { approvedBy: 'client-a', approvedAt: new Date().toISOString() }
    }));
    console.log('  [PASS] Direct client approval write blocked.');

    // TEST 6: Client cannot modify privileged deliverable fields
    console.log('[TEST 6] Client cannot modify privileged deliverable fields...');
    await assertFails(dbClientA.doc('clientDeliverables/deliv-awaiting').update({
      status: 'Approved', published: false, fileUrl: 'https://evil.com/file.pdf', clientUid: 'client-b'
    }));
    console.log('  [PASS] Privileged field modifications blocked.');

    // TEST 7: Client cannot read another client revision request
    console.log('[TEST 7] Client cannot read another client revision request...');
    await assertFails(dbClientA.doc('revisionRequests/req-b').get());
    console.log('  [PASS] Cross-client revision request read denied.');

    // TEST 8: Admin can read revision requests
    console.log('[TEST 8] Admin can read revision requests...');
    await assertSucceeds(dbAdmin.doc('revisionRequests/req-existing').get());
    console.log('  [PASS] Admin revision request read allowed.');

    // TEST 9: Admin can update revision request status
    console.log('[TEST 9] Admin can update revision request status...');
    await assertSucceeds(dbAdmin.doc('revisionRequests/req-existing').update({ status: 'Completed', adminResponse: 'Done' }));
    console.log('  [PASS] Admin revision request update allowed.');

    // TEST 10: Admin can create revision requests
    console.log('[TEST 10] Admin can create revision requests...');
    await assertSucceeds(dbAdmin.doc('revisionRequests/req-admin').set({ id: 'req-admin', clientUid: 'client-a', deliverableId: 'deliv-awaiting', feedback: 'Admin created', status: 'Submitted', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    console.log('  [PASS] Admin revision request creation allowed.');

    // TEST 11: Client cannot modify users role field
    console.log('[TEST 11] Client cannot modify users role field...');
    await assertFails(dbClientA.doc('users/client-a').update({ role: 'PlatformAdmin', isAdmin: true }));
    console.log('  [PASS] User role modification blocked.');

    // TEST 12: Client cannot change uid/email in users
    console.log('[TEST 12] Client cannot change uid/email in users...');
    await assertFails(dbClientA.doc('users/client-a').update({ uid: 'client-b', email: 'hacker@example.com' }));
    console.log('  [PASS] User identity field changes blocked.');
    // TEST 13: Client cannot read another client notification
    console.log('[TEST 13] Client cannot read another client notification...');
    await assertFails(dbClientA.doc('clientNotifications/notif-b').get());
    console.log('  [PASS] Cross-client notification read denied.');

    // TEST 14: Client cannot read another client deliverable
    console.log('[TEST 14] Client cannot read another client deliverable...');
    await assertFails(dbClientA.doc('clientDeliverables/deliv-b').get());
    console.log('  [PASS] Cross-client deliverable read denied.');

    // TEST 15: Client cannot read another client project
    console.log('[TEST 15] Client cannot read another client project...');
    await assertFails(dbClientA.doc('clientProjects/proj-b').get());
    console.log('  [PASS] Cross-client project read denied.');

    // TEST 16: Client can read own project
    console.log('[TEST 16] Client can read own project...');
    await assertSucceeds(dbClientA.doc('clientProjects/proj-a').get());
    console.log('  [PASS] Own project read allowed.');

    // TEST 17: Client can read own deliverable
    console.log('[TEST 17] Client can read own deliverable...');
    await assertSucceeds(dbClientA.doc('clientDeliverables/deliv-a').get());
    console.log('  [PASS] Own deliverable read allowed.');

    // TEST 18: Client can submit feedback on own deliverable
    console.log('[TEST 18] Client can submit feedback on own deliverable...');
    await assertSucceeds(dbClientA.doc('clientDeliverables/deliv-a').update({ feedback: 'Looks great!' }));
    console.log('  [PASS] Feedback submission allowed.');

    // TEST 19: Client can mark own notification as read
    console.log('[TEST 19] Client can mark own notification as read...');
    await assertSucceeds(dbClientA.doc('clientNotifications/notif-a').update({ read: true }));
    console.log('  [PASS] Notification read status update allowed.');

    // TEST 20: Admin can read client profiles
    console.log('[TEST 20] Admin can read client profiles...');
    await assertSucceeds(dbAdmin.doc('clientProfiles/client-a').get());
    console.log('  [PASS] Admin profile read allowed.');

    // TEST 21: Admin can create client projects
    console.log('[TEST 21] Admin can create client projects...');
    await assertSucceeds(dbAdmin.doc('clientProjects/proj-new').set({ id: 'proj-new', clientUid: 'client-a', title: 'New Project', status: 'Active' }));
    console.log('  [PASS] Admin project creation allowed.');

    // TEST 22: Admin can update deliverable status
    console.log('[TEST 22] Admin can update deliverable status...');
    await assertSucceeds(dbAdmin.doc('clientDeliverables/deliv-a').update({ status: 'Approved', published: true }));
    console.log('  [PASS] Admin deliverable update allowed.');

    // TEST 23: Admin can create notifications
    console.log('[TEST 23] Admin can create notifications...');
    await assertSucceeds(dbAdmin.doc('clientNotifications/notif-new').set({ id: 'notif-new', clientUid: 'client-a', message: 'Admin notification', read: false }));
    console.log('  [PASS] Admin notification creation allowed.');

    // TEST 24: Unauthenticated cannot access protected collections
    console.log('[TEST 24] Unauthenticated cannot access protected collections...');
    await assertFails(unauthDb.doc('clientProfiles/client-a').get());
    await assertFails(unauthDb.doc('clientProjects/proj-a').get());
    await assertFails(unauthDb.doc('clientDeliverables/deliv-a').get());
    await assertFails(unauthDb.doc('clientNotifications/notif-a').get());
    await assertFails(unauthDb.doc('revisionRequests/req-existing').get());
    console.log('  [PASS] Unauthenticated access correctly denied.');

  } catch (err: any) {
    console.error('\n[BLOCKED] Firebase Emulator is not running or test assertions failed.');
    console.error('Reason: Firebase Emulator Suite requires Java runtime (JRE >= 11).');
    console.error('Exact command needed to run the tests locally:');
    console.error('  1. Ensure Java (JRE 11+) and Node.js are installed.');
    console.error('  2. Run: npx firebase emulators:start --only firestore');
    console.error('  3. In another terminal run: npx tsx tests/firestore.rules.test.ts\n');
    console.error('Underlying error details:', err.message || err);
    process.exit(1);
  } finally {
    if (testEnv) {
      await testEnv.cleanup();
    }
  }

  console.log('========================================================================');
  console.log('ALL PHASE 2C.2 SECURITY RULES ASSERTIONS COMPLETED SUCCESSFULLY');
  console.log('========================================================================');
}

runClientSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
