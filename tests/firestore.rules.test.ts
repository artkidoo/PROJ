import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { LOCAL_PROJECT_ID, FIRESTORE_DATABASE_ID } from './firebase-test-helpers';

const NAMED_DB = FIRESTORE_DATABASE_ID;

async function runClientSecurityTests() {
  console.log('========================================================================');
  console.log('KEEDOHUB - PHASE 2C.2 CLOUD FUNCTIONS SECURITY RULES TEST SUITE');
  console.log('========================================================================');
  console.log('[CONFIG] Local projectId = ' + LOCAL_PROJECT_ID);
  console.log('[CONFIG] Named Firestore databaseId = ' + NAMED_DB);
  console.log('========================================================================');

  let testEnv: RulesTestEnvironment | null = null;

  try {
    const rulesContent = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: LOCAL_PROJECT_ID,
      firestore: { rules: rulesContent, host: 'localhost', port: 8080 }
    });

    console.log('[INIT] Connected to Firestore Emulator on localhost:8080.');

    const clientA = testEnv.authenticatedContext('client-a', { email: 'clienta@example.com' });
    const clientB = testEnv.authenticatedContext('client-b', { email: 'clientb@example.com' });
    const adminContext = testEnv.authenticatedContext('admin-user', { email: 'admin@keedohub.com' });
    const guestCtx = testEnv.unauthenticatedContext();

    const dbClientA = clientA.firestore();
    const dbClientB = clientB.firestore();
    const dbAdmin = adminContext.firestore();
    const unauthDb = guestCtx.firestore();

    const dbAdminNoStatus = testEnv.authenticatedContext('admin-no-status', { email: 'nostatus@keedohub.com' }).firestore();

    // SECTION A: Admin permissions
    console.log('\n[SECTION A] Admin permissions');

    // TEST A1: Admin can read own profile
    console.log('[TEST A1] Admin can read own profile...');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const seedDb = context.firestore();
      await seedDb.doc('admins/admin-user').set({ uid: 'admin-user', role: 'PlatformAdmin', grantedAt: new Date().toISOString() });
      await seedDb.doc('admins/admin-no-status').set({ uid: 'admin-no-status', role: 'PlatformAdmin', grantedAt: new Date().toISOString() });
      await seedDb.doc('clientProfiles/admin-no-status').set({
        uid: 'admin-no-status',
        displayName: 'No Status Admin',
        email: 'nostatus@keedohub.com',
        accountType: 'Brand',
        organizationName: 'KeedoHub',
        onboardingComplete: true,
        // Intentionally omit `status` field to match production admin profile state
      });
    });
    await assertSucceeds(dbAdmin.doc('admins/admin-user').get());
    await assertSucceeds(dbAdminNoStatus.doc('admins/admin-no-status').get());
    await assertSucceeds(dbAdminNoStatus.collection('admins').get());
    console.log('  [PASS] Admin profile read & list allowed (including clientProfile without status field).');

    // TEST A2: Admin cannot create audit log via client SDK
    console.log('[TEST A2] Admin cannot create audit log via client SDK...');
    await assertFails(dbAdmin.doc('adminAuditLogs/log-new').set({
      id: 'log-new',
      actorUid: 'admin-user',
      action: 'audit_test',
      target: 'proj-a',
      targetUid: 'client-a',
      details: '{}'
    }));
    console.log('  [PASS] Admin audit log creation via client SDK denied.');

    // TEST A3: Audit logs can be seeded using withSecurityRulesDisabled
    console.log('[TEST A3] Audit logs can be seeded using withSecurityRulesDisabled...');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const seedDb = context.firestore();
      await seedDb.doc('adminAuditLogs/log-seeded').set({
        id: 'log-seeded',
        actorUid: 'admin-user',
        action: 'audit_test',
        target: 'proj-a',
        targetUid: 'client-a',
        details: '{}'
      });
    });
    console.log('  [PASS] Audit log seeded via disabled-rules context.');

    // Seed remaining fixtures with rules disabled
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const seedDb = context.firestore();

      await seedDb.doc('admins/admin-user').set({ uid: 'admin-user', role: 'PlatformAdmin', grantedAt: new Date().toISOString() });

      await seedDb.doc('clientProfiles/client-a').set({ uid: 'client-a', displayName: 'Client A', email: 'clienta@example.com', accountType: 'Artist', organizationName: 'Artist A', onboardingComplete: true, workspaceId: 'ws-client-a', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await seedDb.doc('clientProfiles/client-b').set({ uid: 'client-b', displayName: 'Client B', email: 'clientb@example.com', accountType: 'Brand', organizationName: 'Brand B', onboardingComplete: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      await seedDb.doc('clientProjects/proj-a').set({ id: 'proj-a', clientUid: 'client-a', title: 'Client A Project', status: 'Active', workspaceId: 'ws-client-a' });
      await seedDb.doc('clientProjects/proj-b').set({ id: 'proj-b', clientUid: 'client-b', title: 'Client B Project', status: 'Active' });

      await seedDb.doc('clientDeliverables/deliv-a').set({ id: 'deliv-a', clientUid: 'client-a', title: 'Client A Deliverable', status: 'Published', reviewStatus: 'Awaiting Review', published: true, feedback: '', projectId: 'proj-a' });
      await seedDb.doc('clientDeliverables/deliv-b').set({ id: 'deliv-b', clientUid: 'client-b', title: 'Client B Deliverable', status: 'Published', reviewStatus: 'Awaiting Review', published: true, feedback: '', projectId: 'proj-b' });
      await seedDb.doc('clientDeliverables/deliv-approved').set({ id: 'deliv-approved', clientUid: 'client-a', title: 'Approved Deliverable', status: 'Published', reviewStatus: 'Approved', published: true, feedback: '', projectId: 'proj-a' });

      await seedDb.doc('clientNotifications/notif-a').set({ id: 'notif-a', clientUid: 'client-a', message: 'Test notification', read: false });
      await seedDb.doc('clientNotifications/notif-b').set({ id: 'notif-b', clientUid: 'client-b', message: 'Test notification', read: false });

      await seedDb.doc('users/client-a').set({ uid: 'client-a', email: 'clienta@example.com', displayName: 'Client A', onboardingComplete: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await seedDb.doc('users/client-b').set({ uid: 'client-b', email: 'clientb@example.com', displayName: 'Client B', onboardingComplete: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      await seedDb.doc('workspaces/ws-client-a').set({ id: 'ws-client-a', ownerId: 'client-a', name: 'Client A Workspace', status: 'Active', membersCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await seedDb.doc('workspaces/ws-client-b').set({ id: 'ws-client-b', ownerId: 'client-b', name: 'Client B Workspace', status: 'Active', membersCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      await seedDb.doc('revisionRequests/req-existing').set({ id: 'req-existing', clientUid: 'client-a', deliverableId: 'deliv-a', feedback: 'Test feedback', status: 'Submitted', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await seedDb.doc('revisionRequests/req-b').set({ id: 'req-b', clientUid: 'client-b', deliverableId: 'deliv-b', feedback: 'Test feedback', status: 'Submitted', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    });


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

    // TEST 10: Admin cannot create revision requests via client SDK (only Cloud Functions can)
    console.log('[TEST 10] Admin cannot create revision requests via client SDK...');
    await assertFails(dbAdmin.doc('revisionRequests/req-admin').set({ id: 'req-admin', clientUid: 'client-a', deliverableId: 'deliv-awaiting', feedback: 'Admin created', status: 'Submitted', submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    console.log('  [PASS] Admin revision request creation via client SDK denied.');

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
    await assertSucceeds(dbAdmin.doc('clientProjects/proj-new').set({
      id: 'proj-new',
      clientUid: 'client-a',
      title: 'New Project',
      description: 'A new project',
      category: 'Design',
      status: 'Pending',
      progress: 0,
      startDate: '2026-01-01',
      expectedDeliveryDate: '2026-02-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stage: 'New Request',
      priority: 'Normal',
      workspaceId: 'ws-client-a'
    }));
    console.log('  [PASS] Admin project creation allowed.');

    // TEST 22: Admin can update deliverable status
    console.log('[TEST 22] Admin can update deliverable status...');
    await assertSucceeds(dbAdmin.doc('clientDeliverables/deliv-a').update({ status: 'Approved', published: true }));
    console.log('  [PASS] Admin deliverable update allowed.');

    // DEBUG: check admin
    console.log('[DEBUG] Reading admins/admin-user...');
    await assertSucceeds(dbAdmin.doc('admins/admin-user').get());
    console.log('[DEBUG] admins/admin-user readable');
    // TEST 23: Admin can create notifications
    console.log('[TEST 23] Admin can create notifications...');
    await assertSucceeds(dbAdmin.doc('clientNotifications/notif-new').set({ id: 'notif-new', clientUid: 'client-a', message: 'Admin notification', read: false }));
    console.log('  [PASS] Admin notification creation allowed.');

    // TEST 24A: Admin can read platform settings
    console.log('[TEST 24A] Admin can read platform settings...');
    await assertSucceeds(dbAdmin.doc('settings/platform').get());
    console.log('  [PASS] Admin can read platform settings.');

    // TEST 24B: Admin CANNOT directly write platform settings
    console.log('[TEST 24B] Admin cannot directly update platform settings...');
    await assertFails(dbAdmin.doc('settings/platform').update({ agencyAddress: 'Updated Address' }));
    console.log('  [PASS] Admin direct settings write correctly denied (must use Cloud Function).');

    // TEST 24C: Non-admin user cannot access platform settings, other admin docs, or list admins
    console.log('[TEST 24C] Non-admin user cannot access platform settings, other admin records, or list admins...');
    await assertFails(dbClientA.doc('settings/platform').get());
    await assertFails(dbClientA.doc('settings/platform').update({ agencyAddress: 'Blocked' }));
    await assertFails(dbClientA.doc('admins/admin-user').get());
    await assertFails(dbClientA.collection('admins').get());
    await assertFails(dbClientA.collection('workspaces/ws-client-b/campaignDesigns').get());
    await assertSucceeds(dbAdminNoStatus.doc('clientProfiles/admin-no-status').get());
    await assertSucceeds(dbAdminNoStatus.collection('clientProfiles').get());
    await assertSucceeds(dbAdminNoStatus.collection('workspaces').get());
    await assertSucceeds(dbAdminNoStatus.doc('settings/platform').get());
    await assertFails(dbClientA.collection('clientProfiles').get());
    console.log('  [PASS] Non-admin access restricted & admin-no-status can read/list profiles, workspaces, and platform settings.');

    // TEST 24D: Inactive/revoked/suspended or invalid-role admin records denied even if /admins/{uid} exists
    console.log('[TEST 24D] Revoked, suspended, or invalid-role admin records denied...');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const seedDb = context.firestore();
      await seedDb.doc('admins/revoked-admin').set({ uid: 'revoked-admin', role: 'PlatformAdmin', status: 'Revoked' });
      await seedDb.doc('admins/false-active-admin').set({ uid: 'false-active-admin', role: 'PlatformAdmin', active: false });
      await seedDb.doc('admins/missing-role-admin').set({ uid: 'missing-role-admin', status: 'Active' });
      await seedDb.doc('admins/client-role-admin').set({ uid: 'client-role-admin', role: 'Client', status: 'Active' });
      await seedDb.doc('workspaces/ws-client-a/memberships/member-a').set({
        id: 'member-a', userId: 'client-b', workspaceId: 'ws-client-a', role: 'Member', status: 'Active', joinedAt: new Date().toISOString()
      });
      // Replace client-b membership keyed by uid so isWorkspaceMember matches memberships/$(request.auth.uid)
      await seedDb.doc('workspaces/ws-client-a/memberships/client-b').set({
        id: 'client-b', userId: 'client-b', workspaceId: 'ws-client-a', role: 'Member', status: 'Active', joinedAt: new Date().toISOString()
      });
    });
    const dbRevokedAdmin = testEnv.authenticatedContext('revoked-admin').firestore();
    const dbFalseActiveAdmin = testEnv.authenticatedContext('false-active-admin').firestore();
    const dbMissingRoleAdmin = testEnv.authenticatedContext('missing-role-admin').firestore();
    const dbClientRoleAdmin = testEnv.authenticatedContext('client-role-admin').firestore();
    await assertFails(dbRevokedAdmin.collection('workspaces').get());
    await assertFails(dbFalseActiveAdmin.collection('workspaces').get());
    await assertFails(dbMissingRoleAdmin.collection('workspaces').get());
    await assertFails(dbMissingRoleAdmin.collection('clientProfiles').get());
    await assertFails(dbMissingRoleAdmin.doc('settings/platform').get());
    await assertFails(dbMissingRoleAdmin.collection('admins').get());
    await assertFails(dbClientRoleAdmin.collection('workspaces').get());
    await assertFails(dbClientRoleAdmin.collection('clientProfiles').get());
    await assertFails(dbClientRoleAdmin.doc('settings/platform').get());
    await assertFails(dbClientRoleAdmin.collection('admins').get());

    // TEST 24H: Full AdminHQOverview collection queries with canonical PlatformAdmin doc shape
    console.log('[TEST 24H] AdminHQOverview six collection queries (projects, deliverables, revisions, enquiries, clients, auditLogs)...');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const seedDb = context.firestore();
      await seedDb.doc('admins/live-shape-admin').set({
        uid: 'live-shape-admin',
        role: 'PlatformAdmin',
        status: 'Active',
        active: true,
      });
      await seedDb.doc('clientProfiles/live-shape-admin').set({
        uid: 'live-shape-admin',
        displayName: 'Live Shape Admin',
        email: 'artkidmummyspet@gmail.com',
        status: 'Active',
      });
      await seedDb.doc('clientProjects/proj-a').set({
        id: 'proj-a',
        clientUid: 'client-a',
        title: 'Client A Project',
        status: 'Active',
        workspaceId: 'ws-client-a',
        updatedAt: new Date().toISOString(),
      });
      await seedDb.doc('clientProjects/proj-a/deliverables/deliv-1').set({
        id: 'deliv-1',
        projectId: 'proj-a',
        clientUid: 'client-a',
        title: 'Cover Art',
        isClientPublished: true,
        reviewStatus: 'Awaiting Review',
      });
      await seedDb.doc('clientProjects/proj-a/revisionRequests/rev-1').set({
        id: 'rev-1',
        projectId: 'proj-a',
        clientUid: 'client-a',
        deliverableId: 'deliv-1',
        feedback: 'Adjust margin',
        status: 'Submitted',
        createdAt: new Date().toISOString(),
      });
      await seedDb.doc('serviceEnquiries/enq-1').set({
        id: 'enq-1',
        name: 'Prospect',
        email: 'prospect@example.com',
        service: 'Brand Identity',
        status: 'New',
        createdAt: new Date().toISOString(),
      });
    });

    const dbLiveShapeAdmin = testEnv.authenticatedContext('live-shape-admin', { email: 'artkidmummyspet@gmail.com' }).firestore();
    for (const adminDbCtx of [dbLiveShapeAdmin, dbAdminNoStatus]) {
      await assertSucceeds(adminDbCtx.collection('clientProfiles').get());
      await assertSucceeds(adminDbCtx.collection('clientProjects').orderBy('updatedAt', 'desc').get());
      await assertSucceeds(adminDbCtx.collectionGroup('deliverables').get());
      await assertSucceeds(adminDbCtx.collectionGroup('revisionRequests').get());
      await assertSucceeds(adminDbCtx.collection('serviceEnquiries').orderBy('createdAt', 'desc').limit(20).get());
      await assertSucceeds(adminDbCtx.collection('adminAuditLogs').orderBy('createdAt', 'desc').limit(12).get());
    }
    await assertFails(dbClientA.collection('clientProfiles').get());
    await assertFails(dbClientA.collection('clientProjects').orderBy('updatedAt', 'desc').get());
    await assertFails(dbClientA.collectionGroup('deliverables').get());
    await assertFails(dbClientA.collectionGroup('revisionRequests').get());
    await assertFails(dbClientA.collection('serviceEnquiries').orderBy('createdAt', 'desc').limit(20).get());
    await assertFails(dbClientA.collection('adminAuditLogs').orderBy('createdAt', 'desc').limit(12).get());
    console.log('  [PASS] All 6 AdminHQOverview queries succeed for active PlatformAdmin and remain denied for non-admins.');

    // TEST 24E: campaignDesigns & internalAssets restricted to active platform admins; brandAssets shared
    console.log('[TEST 24E] campaignDesigns and internalAssets restricted to active platform admins...');
    await assertSucceeds(dbAdmin.doc('workspaces/ws-client-a/campaignDesigns/spec-1').set({
      id: 'spec-1', workspaceId: 'ws-client-a', name: 'Internal Spec', internalNotes: 'Admin secret notes'
    }));
    await assertSucceeds(dbAdmin.doc('workspaces/ws-client-a/campaignDesigns/spec-1').get());
    await assertSucceeds(dbAdmin.collectionGroup('campaignDesigns').get());
    await assertFails(dbClientA.doc('workspaces/ws-client-a/campaignDesigns/spec-1').get());
    await assertFails(dbClientA.doc('workspaces/ws-client-a/campaignDesigns/spec-client').set({ id: 'spec-client', workspaceId: 'ws-client-a', name: 'Blocked' }));
    await assertFails(dbClientA.doc('workspaces/ws-client-a/campaignDesigns/spec-1').delete());
    await assertFails(dbClientB.doc('workspaces/ws-client-a/campaignDesigns/spec-1').get());
    await assertFails(dbClientB.collection('workspaces/ws-client-a/campaignDesigns').get());
    await assertFails(dbClientA.collectionGroup('campaignDesigns').get());

    await assertSucceeds(dbAdmin.doc('workspaces/ws-client-a/internalAssets/int-1').set({
      id: 'int-1', workspaceId: 'ws-client-a', name: 'Internal Working File', storagePath: 'workspaces/ws-client-a/internal/assets/int-1/file.png'
    }));
    await assertSucceeds(dbAdmin.collectionGroup('internalAssets').get());
    await assertFails(dbClientA.doc('workspaces/ws-client-a/internalAssets/int-1').get());
    await assertFails(dbClientA.doc('workspaces/ws-client-a/internalAssets/int-2').set({ id: 'int-2', workspaceId: 'ws-client-a', name: 'Blocked' }));
    await assertFails(dbClientA.doc('workspaces/ws-client-a/internalAssets/int-1').delete());
    await assertFails(dbClientB.doc('workspaces/ws-client-a/internalAssets/int-1').get());
    await assertFails(dbClientA.collectionGroup('internalAssets').get());

    await assertSucceeds(dbClientA.doc('workspaces/ws-client-a/brandAssets/shared-1').set({
      id: 'shared-1', workspaceId: 'ws-client-a', name: 'Public Brand Logo',
      storagePath: 'workspaces/ws-client-a/assets/shared-1/logo.png', isInternal: false,
    }));
    await assertSucceeds(dbClientB.doc('workspaces/ws-client-a/brandAssets/shared-1').get());
    await assertSucceeds(
      dbClientA.collection('workspaces/ws-client-a/brandAssets').where('isInternal', '==', false).get()
    );
    await assertSucceeds(
      dbClientB.collection('workspaces/ws-client-a/brandAssets').where('isInternal', '==', false).get()
    );
    await assertSucceeds(dbAdmin.collectionGroup('brandAssets').get());
    await assertFails(dbClientA.collectionGroup('brandAssets').get());

    // TEST 24G: Legacy internal brandAssets isolation (storagePath pointing to internal/**)
    console.log('[TEST 24G] Legacy internal brandAssets blocked for owner/member while shared & admin access remain...');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const seedDb = context.firestore();
      await seedDb.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').set({
        id: 'legacy-internal-1',
        workspaceId: 'ws-client-a',
        name: 'Legacy Internal PSD',
        storagePath: 'workspaces/ws-client-a/internal/assets/legacy-internal-1/source.psd',
        downloadUrl: 'https://firebasestorage.googleapis.com/v0/b/demo/o/secret?token=legacy',
      });
      await seedDb.doc('workspaces/ws-client-a/brandAssets/legacy-internal-2').set({
        id: 'legacy-internal-2',
        workspaceId: 'ws-client-a',
        name: 'Legacy Root Internal Path',
        storagePath: 'internal/notes/spec.pdf',
      });
      await seedDb.doc('workspaces/ws-client-a/brandAssets/legacy-shared-1').set({
        id: 'legacy-shared-1',
        workspaceId: 'ws-client-a',
        name: 'Legacy Legitimate Shared Asset',
        storagePath: 'workspaces/ws-client-a/assets/legacy-shared-1/cover.png',
      });
    });

    // Admin retains read & migration write access to legacy internal and shared brandAssets
    await assertSucceeds(dbAdmin.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').get());
    await assertSucceeds(dbAdmin.doc('workspaces/ws-client-a/brandAssets/legacy-internal-2').get());
    await assertSucceeds(dbAdmin.collection('workspaces/ws-client-a/brandAssets').get());

    // Workspace owner cannot read, unfiltered-list, update, or delete legacy internal brandAssets
    await assertFails(dbClientA.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').get());
    await assertFails(dbClientA.doc('workspaces/ws-client-a/brandAssets/legacy-internal-2').get());
    await assertFails(dbClientA.collection('workspaces/ws-client-a/brandAssets').get());
    await assertFails(dbClientA.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').update({ name: 'Tampered' }));
    await assertFails(dbClientA.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').delete());

    // Active workspace member cannot read, unfiltered-list, update, or delete legacy internal brandAssets
    await assertFails(dbClientB.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').get());
    await assertFails(dbClientB.doc('workspaces/ws-client-a/brandAssets/legacy-internal-2').get());
    await assertFails(dbClientB.collection('workspaces/ws-client-a/brandAssets').get());
    await assertFails(dbClientB.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').update({ name: 'Tampered' }));
    await assertFails(dbClientB.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').delete());

    // Members cannot forge isInternal: false when pointing storagePath at internal/**
    await assertFails(dbClientA.doc('workspaces/ws-client-a/brandAssets/spoofed-internal').set({
      id: 'spoofed-internal',
      workspaceId: 'ws-client-a',
      name: 'Spoofed Internal',
      storagePath: 'workspaces/ws-client-a/internal/assets/spoofed/raw.zip',
      isInternal: false,
    }));

    // Workspace owner and active member retain direct read access to legitimate shared brandAssets (legacy & scoped)
    await assertSucceeds(dbClientA.doc('workspaces/ws-client-a/brandAssets/legacy-shared-1').get());
    await assertSucceeds(dbClientB.doc('workspaces/ws-client-a/brandAssets/legacy-shared-1').get());
    await assertSucceeds(dbClientA.doc('workspaces/ws-client-a/brandAssets/shared-1').get());
    await assertSucceeds(dbClientB.doc('workspaces/ws-client-a/brandAssets/shared-1').get());
    const ownerSharedList = await assertSucceeds(
      dbClientA.collection('workspaces/ws-client-a/brandAssets').where('isInternal', '==', false).get()
    );
    const ownerListedIds = ownerSharedList.docs.map(d => d.id);
    if (ownerListedIds.includes('legacy-internal-1') || ownerListedIds.includes('legacy-internal-2')) {
      throw new Error('Filtered shared brandAssets query returned legacy internal record(s).');
    }

    // Admin can safely migrate legacy internal records to internalAssets (stripping downloadUrl) & tag legacy shared records
    const legacyInternalSnap = await assertSucceeds(dbAdmin.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').get());
    const legacyData = legacyInternalSnap.data() || {};
    const { downloadUrl: _omittedUrl, ...sanitizedInternal } = legacyData as Record<string, unknown>;
    await assertSucceeds(dbAdmin.doc('workspaces/ws-client-a/internalAssets/legacy-internal-1').set({
      ...sanitizedInternal,
      isInternal: true,
      migratedFromBrandAssetsAt: new Date().toISOString(),
    }));
    await assertSucceeds(dbAdmin.doc('workspaces/ws-client-a/brandAssets/legacy-internal-1').delete());
    await assertSucceeds(dbAdmin.doc('workspaces/ws-client-a/brandAssets/legacy-shared-1').update({ isInternal: false }));
    await assertFails(dbClientA.doc('workspaces/ws-client-a/internalAssets/legacy-internal-1').get());
    await assertFails(dbClientB.doc('workspaces/ws-client-a/internalAssets/legacy-internal-1').get());
    const migratedSharedList = await assertSucceeds(
      dbClientB.collection('workspaces/ws-client-a/brandAssets').where('isInternal', '==', false).get()
    );
    if (!migratedSharedList.docs.some(d => d.id === 'legacy-shared-1')) {
      throw new Error('Backfilled shared brandAssets record must be visible to active workspace member.');
    }

    // TEST 24F: Hardened create allowlists on clientProfiles & workspaces
    console.log('[TEST 24F] Hardened clientProfiles and workspaces create allowlists...');
    const dbNewClient = testEnv.authenticatedContext('new-client-1', { email: 'new@example.com' }).firestore();
    await assertFails(dbNewClient.doc('clientProfiles/new-client-1').set({
      uid: 'new-client-1',
      displayName: 'Malicious User',
      email: 'new@example.com',
      accountType: 'Artist',
      organizationName: 'Malicious Org',
      onboardingComplete: true,
      status: 'Active',
      role: 'PlatformAdmin',
      isAdmin: true,
    }));
    await assertFails(dbNewClient.doc('clientProfiles/new-client-1').set({
      uid: 'new-client-1',
      displayName: 'Extra Field User',
      email: 'new@example.com',
      accountType: 'Artist',
      organizationName: 'Test Org',
      onboardingComplete: true,
      unexpectedFlag: true,
    }));
    await assertSucceeds(dbNewClient.doc('clientProfiles/new-client-1').set({
      uid: 'new-client-1',
      displayName: 'Valid New User',
      email: 'new@example.com',
      photoURL: '',
      accountType: 'Artist',
      organizationName: 'Valid Artist',
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    await assertFails(dbNewClient.doc('workspaces/ws-new-bad-status').set({
      id: 'ws-new-bad-status',
      name: 'Paused Hack',
      type: 'Artist',
      clientCategory: 'artist',
      ownerId: 'new-client-1',
      status: 'Paused',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    await assertFails(dbNewClient.doc('workspaces/ws-new-extra').set({
      id: 'ws-new-extra',
      name: 'Extra Key Hack',
      type: 'Artist',
      clientCategory: 'artist',
      ownerId: 'new-client-1',
      status: 'Active',
      adminOverride: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    await assertSucceeds(dbNewClient.doc('workspaces/ws-new-valid').set({
      id: 'ws-new-valid',
      name: 'Valid Artist Workspace',
      type: 'Artist',
      clientCategory: 'artist',
      ownerId: 'new-client-1',
      status: 'Active',
      description: 'Valid workspace',
      contactEmail: 'new@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // TEST 24I: clientProfiles access, admin updates, client isolation & Admin HQ collections
    console.log('[TEST 24I] clientProfiles access, admin updates, client isolation & Admin HQ collections...');
    const dbLegacyClient = testEnv.authenticatedContext('client-legacy', { email: 'legacy@example.com' }).firestore();
    const dbSuspendedProfileClient = testEnv.authenticatedContext('client-suspended-profile', { email: 'suspended-profile@example.com' }).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const seedDb = context.firestore();
      await seedDb.doc('clientProfiles/admin-user').set({
        uid: 'admin-user',
        displayName: 'Platform Admin',
        email: 'admin@keedohub.com',
        accountType: 'Brand',
        organizationName: 'KeedoHub HQ',
        onboardingComplete: true,
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await seedDb.doc('clientProfiles/client-legacy').set({
        // Intentionally omit `uid` to verify legacy client profile updates remain allowed
        displayName: 'Legacy Client',
        email: 'legacy@example.com',
        accountType: 'Artist',
        organizationName: 'Legacy Studio',
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await seedDb.doc('clientProfiles/client-suspended-profile').set({
        uid: 'client-suspended-profile',
        displayName: 'Suspended Client',
        email: 'suspended-profile@example.com',
        accountType: 'Brand',
        organizationName: 'Suspended Brand',
        onboardingComplete: true,
        status: 'Suspended',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await seedDb.doc('serviceEnquiries/enq-hq-1').set({
        id: 'enq-hq-1',
        name: 'Prospect Brand',
        email: 'prospect@example.com',
        service: 'Brand Identity',
        message: 'Enquiry payload',
        createdAt: new Date().toISOString(),
      });
      await seedDb.doc('settings/platform').set({
        maintenanceMode: false,
        supportEmail: 'support@keedohub.com',
      });
      await seedDb.doc('productionTasks/pt-hq-1').set({
        id: 'pt-hq-1',
        projectId: 'proj-a',
        clientUid: 'client-a',
        title: 'Master Art Direction',
        status: 'In Progress',
        clientVisible: false,
      });
    });

    // Admin profile reads & administrative updates
    await assertSucceeds(dbAdmin.doc('clientProfiles/admin-user').get());
    await assertSucceeds(dbAdmin.doc('clientProfiles/client-a').get());
    await assertSucceeds(dbAdmin.collection('clientProfiles').get());
    await assertSucceeds(dbAdmin.doc('clientProfiles/client-a').update({
      displayName: 'Client A Verified',
      organizationName: 'Artist A Studio',
      accountType: 'Brand',
      status: 'Suspended',
      updatedAt: new Date().toISOString(),
    }));
    await assertSucceeds(dbAdmin.doc('clientProfiles/client-a').update({
      status: 'Active',
      updatedAt: new Date().toISOString(),
    }));
    // Admin cannot inject privilege-escalation flags or rewrite immutable identity fields
    await assertFails(dbAdmin.doc('clientProfiles/client-a').update({ role: 'PlatformAdmin' }));
    await assertFails(dbAdmin.doc('clientProfiles/client-a').update({ isAdmin: true }));
    await assertFails(dbAdmin.doc('clientProfiles/client-a').update({ isPlatformAdmin: true }));
    await assertFails(dbAdmin.doc('clientProfiles/client-a').update({ uid: 'client-b' }));
    await assertFails(dbAdmin.doc('clientProfiles/client-a').update({ email: 'hijack@example.com' }));

    // Client own-profile reads & permitted updates (including legacy profile missing `uid`)
    await assertSucceeds(dbClientA.doc('clientProfiles/client-a').get());
    await assertSucceeds(dbClientA.doc('clientProfiles/client-a').update({
      displayName: 'Client A Self Updated',
      organizationName: 'Artist A Collective',
      accountType: 'Artist',
      photoURL: 'https://example.com/avatar.png',
      updatedAt: new Date().toISOString(),
    }));
    await assertSucceeds(dbLegacyClient.doc('clientProfiles/client-legacy').update({
      displayName: 'Legacy Client Updated',
      updatedAt: new Date().toISOString(),
    }));

    // Client isolation on clientProfiles
    await assertFails(dbClientA.doc('clientProfiles/client-b').get());
    await assertFails(dbClientA.collection('clientProfiles').get());
    await assertFails(dbClientA.doc('clientProfiles/client-b').set({
      uid: 'client-b',
      displayName: 'Overwrite Attempt',
      email: 'clientb@example.com',
      accountType: 'Brand',
      organizationName: 'Hijacked',
      onboardingComplete: true,
    }));
    await assertFails(dbClientA.doc('clientProfiles/client-b').update({ displayName: 'Tampered' }));
    await assertFails(dbClientA.doc('clientProfiles/client-b').delete());

    // Client privilege escalation denials & suspended account lock
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ status: 'Suspended' }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ status: 'Active' }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ role: 'PlatformAdmin' }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ isAdmin: true }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ isPlatformAdmin: true }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ suspended: false }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ revoked: false }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ active: true }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ uid: 'admin-user' }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ email: 'other@example.com' }));
    await assertFails(dbClientA.doc('clientProfiles/client-a').update({ createdAt: '2020-01-01T00:00:00.000Z' }));
    await assertFails(dbSuspendedProfileClient.doc('clientProfiles/client-suspended-profile').update({
      displayName: 'Bypass Attempt',
      updatedAt: new Date().toISOString(),
    }));

    // Admin HQ collection access & client isolation
    await assertSucceeds(dbAdmin.collection('clientProjects').get());
    await assertSucceeds(dbAdmin.collection('clientDeliverables').get());
    await assertSucceeds(dbAdmin.collection('revisionRequests').get());
    await assertSucceeds(dbAdmin.collection('serviceEnquiries').get());
    await assertSucceeds(dbAdmin.collection('adminAuditLogs').get());
    await assertSucceeds(dbAdmin.collection('workspaces').get());
    await assertSucceeds(dbAdmin.collection('settings').get());
    await assertSucceeds(dbAdmin.collection('admins').get());
    await assertSucceeds(dbAdmin.collection('productionTasks').get());

    await assertFails(dbClientA.collection('admins').get());
    await assertFails(dbClientA.collection('serviceEnquiries').get());
    await assertFails(dbClientA.collection('adminAuditLogs').get());
    await assertFails(dbClientA.collection('settings').get());
    await assertFails(dbClientA.collection('productionTasks').get());
    await assertFails(dbClientA.doc('clientProjects/proj-b').get());
    await assertFails(dbClientA.doc('clientDeliverables/deliv-b').get());
    await assertFails(dbClientA.doc('revisionRequests/req-b').get());
    await assertFails(dbClientA.doc('workspaces/ws-client-b').get());
    console.log('  [PASS] clientProfiles, Admin HQ collections, isolation, and escalation controls verified.');

    // TEST 25: Unauthenticated cannot access protected collections
    console.log('[TEST 25] Unauthenticated cannot access protected collections...');
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
