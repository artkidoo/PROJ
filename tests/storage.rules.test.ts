import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { LOCAL_PROJECT_ID, FIRESTORE_DATABASE_ID, adminDb } from './firebase-test-helpers';

async function runStorageSecurityTests() {
  const rules = fs.readFileSync(path.resolve('./storage.rules'), 'utf8');
  const firestoreRules = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');
  let testEnv: RulesTestEnvironment | null = null;

  try {
    testEnv = await initializeTestEnvironment({
      projectId: LOCAL_PROJECT_ID,
      firestore: { rules: firestoreRules, host: 'localhost', port: 8080 },
      storage: { rules, host: 'localhost', port: 9199 },
    });

    const adminCtx = testEnv.authenticatedContext('admin-a', { email: 'admin@example.com' });
    const clientACtx = testEnv.authenticatedContext('client-a', { email: 'client-a@example.com' });
    const memberACtx = testEnv.authenticatedContext('member-a', { email: 'member-a@example.com' });
    const clientBCtx = testEnv.authenticatedContext('client-b', { email: 'client-b@example.com' });
    const guestCtx = testEnv.unauthenticatedContext();

    const bucketUrl = `gs://${LOCAL_PROJECT_ID}.appspot.com`;
    const adminStorage = adminCtx.storage(bucketUrl);
    const clientAStorage = clientACtx.storage(bucketUrl);
    const memberAStorage = memberACtx.storage(bucketUrl);
    const clientBStorage = clientBCtx.storage(bucketUrl);
    const guestStorage = guestCtx.storage(bucketUrl);

    const now = new Date().toISOString();

    // Seed cross-service Firestore fixtures in the named database referenced by storage.rules
    await Promise.all([
      adminDb.doc('admins/admin-a').set({ uid: 'admin-a', email: 'admin@example.com', role: 'PlatformAdmin', grantedAt: now }),
      adminDb.doc('clientProfiles/client-a').set({
        uid: 'client-a', email: 'client-a@example.com', accountType: 'Artist', organizationName: 'Artist A',
        workspaceId: 'ws-client-a', onboardingComplete: true, status: 'Active', createdAt: now, updatedAt: now,
      }),
      adminDb.doc('clientProfiles/member-a').set({
        uid: 'member-a', email: 'member-a@example.com', accountType: 'Artist', organizationName: 'Member A',
        workspaceId: 'ws-client-a', onboardingComplete: true, status: 'Active', createdAt: now, updatedAt: now,
      }),
      adminDb.doc('clientProfiles/client-b').set({
        uid: 'client-b', email: 'client-b@example.com', accountType: 'Brand', organizationName: 'Brand B',
        workspaceId: 'ws-client-b', onboardingComplete: true, status: 'Active', createdAt: now, updatedAt: now,
      }),
      adminDb.doc('workspaces/ws-client-a').set({
        id: 'ws-client-a', ownerId: 'client-a', name: 'Artist A Workspace', type: 'Artist', status: 'Active', createdAt: now, updatedAt: now,
      }),
      adminDb.doc('workspaces/ws-client-a/memberships/member-a').set({
        id: 'member-a', userId: 'member-a', workspaceId: 'ws-client-a', role: 'Member', status: 'Active', joinedAt: now,
      }),
      adminDb.doc('workspaces/ws-client-b').set({
        id: 'ws-client-b', ownerId: 'client-b', name: 'Client B Workspace', type: 'Brand', status: 'Active', createdAt: now, updatedAt: now,
      }),
      adminDb.doc('clientProjects/proj-a').set({
        id: 'proj-a', clientUid: 'client-a', workspaceId: 'ws-client-a', title: 'Project A', status: 'In Progress',
      }),
      adminDb.doc('clientProjects/proj-b').set({
        id: 'proj-b', clientUid: 'client-b', workspaceId: 'ws-client-b', title: 'Project B', status: 'In Progress',
      }),
      adminDb.doc('clientProjects/proj-a/deliverables/deliv-a').set({
        id: 'deliv-a', projectId: 'proj-a', clientUid: 'client-a', title: 'Published Deliverable A', isClientPublished: true, reviewStatus: 'Awaiting Review',
      }),
      adminDb.doc('clientProjects/proj-a/deliverables/deliv-draft').set({
        id: 'deliv-draft', projectId: 'proj-a', clientUid: 'client-a', title: 'Draft Deliverable A', isClientPublished: false, reviewStatus: 'Draft',
      }),
      adminDb.doc('clientProjects/proj-b/deliverables/deliv-b').set({
        id: 'deliv-b', projectId: 'proj-b', clientUid: 'client-b', title: 'Published Deliverable B', isClientPublished: true, reviewStatus: 'Awaiting Review',
      }),
    ]);

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const seedStorage = context.storage(bucketUrl);
      await seedStorage.ref('workspaces/ws-client-a/assets/portfolio.jpg').put(new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });
      await seedStorage.ref('workspaces/ws-client-a/internal/assets/confidential.pdf').put(new Uint8Array([1, 2, 3]), { contentType: 'application/pdf' });
      await seedStorage.ref('production/proj-a/deliverables/deliv-a/image.jpg').put(new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });
      await seedStorage.ref('production/proj-a/deliverables/deliv-draft/image.jpg').put(new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });
      await seedStorage.ref('production/proj-b/deliverables/deliv-b/image.jpg').put(new Uint8Array([1, 2, 3]), { contentType: 'image/jpeg' });
    });

    // SECTION 1: Workspace shared assets (owner + active member vs cross-client)
    console.log('[SECTION 1] Workspace shared asset permissions');
    await assertSucceeds(clientAStorage.ref('workspaces/ws-client-a/assets/portfolio.jpg').getMetadata());
    await assertSucceeds(memberAStorage.ref('workspaces/ws-client-a/assets/portfolio.jpg').getMetadata());
    await assertSucceeds(
      memberAStorage.ref('workspaces/ws-client-a/assets/shared-logo.png').put(new Uint8Array([1, 2, 3]), { contentType: 'image/png' }).then(() => undefined)
    );
    await assertSucceeds(
      clientAStorage.ref('workspaces/ws-client-a/assets/owner-logo.png').put(new Uint8Array([1, 2, 3]), { contentType: 'image/png' }).then(() => undefined)
    );
    await assertSucceeds(memberAStorage.ref('workspaces/ws-client-a/assets/shared-logo.png').delete());
    await assertFails(clientBStorage.ref('workspaces/ws-client-a/assets/portfolio.jpg').getMetadata());

    // SECTION 2: Suspended client account denied across workspace storage
    console.log('[SECTION 2] Suspended user access denial');
    await adminDb.doc('clientProfiles/client-a').update({ status: 'Suspended' });
    await assertFails(clientAStorage.ref('workspaces/ws-client-a/assets/portfolio.jpg').getMetadata());
    await adminDb.doc('clientProfiles/client-a').update({ status: 'Active' });

    // SECTION 3: Published vs unpublished production deliverable access
    console.log('[SECTION 3] Production deliverable access');
    await assertSucceeds(clientAStorage.ref('production/proj-a/deliverables/deliv-a/image.jpg').getMetadata());
    await assertSucceeds(adminStorage.ref('production/proj-b/deliverables/deliv-b/image.jpg').getMetadata());
    await assertFails(clientAStorage.ref('production/proj-a/deliverables/deliv-draft/image.jpg').getMetadata());
    await assertFails(clientBStorage.ref('production/proj-a/deliverables/deliv-a/image.jpg').getMetadata());

    // SECTION 4: Phase 8.5 Internal Storage Isolation (No Rule Overlap Bypass)
    console.log('[SECTION 4] Internal staging isolation (admin-only, no overlap bypass)');
    await assertSucceeds(adminStorage.ref('workspaces/ws-client-a/internal/assets/confidential.pdf').getMetadata());
    await assertSucceeds(
      adminStorage.ref('workspaces/ws-client-a/internal/assets/admin-brief.pdf').put(new Uint8Array([4, 5, 6]), { contentType: 'application/pdf' }).then(() => undefined)
    );
    // Workspace owner cannot read, upload, overwrite, or delete internal assets
    await assertFails(clientAStorage.ref('workspaces/ws-client-a/internal/assets/confidential.pdf').getMetadata());
    await assertFails(
      clientAStorage.ref('workspaces/ws-client-a/internal/assets/owner-upload.pdf').put(new Uint8Array([1, 2]), { contentType: 'application/pdf' }).then(() => undefined)
    );
    await assertFails(
      clientAStorage.ref('workspaces/ws-client-a/internal/assets/confidential.pdf').put(new Uint8Array([9, 9]), { contentType: 'application/pdf' }).then(() => undefined)
    );
    await assertFails(clientAStorage.ref('workspaces/ws-client-a/internal/assets/confidential.pdf').delete());
    // Active workspace member cannot read, upload, overwrite, or delete internal assets
    await assertFails(memberAStorage.ref('workspaces/ws-client-a/internal/assets/confidential.pdf').getMetadata());
    await assertFails(
      memberAStorage.ref('workspaces/ws-client-a/internal/assets/member-upload.pdf').put(new Uint8Array([1, 2]), { contentType: 'application/pdf' }).then(() => undefined)
    );
    await assertFails(
      memberAStorage.ref('workspaces/ws-client-a/internal/assets/confidential.pdf').put(new Uint8Array([9, 9]), { contentType: 'application/pdf' }).then(() => undefined)
    );
    await assertFails(memberAStorage.ref('workspaces/ws-client-a/internal/assets/confidential.pdf').delete());

    // SECTION 5: Unauthenticated and invalid payloads
    console.log('[SECTION 5] Unauthenticated and payload validation');
    await assertFails(guestStorage.ref('workspaces/ws-client-a/assets/portfolio.jpg').getMetadata());
    await assertFails(
      clientAStorage.ref('workspaces/ws-client-a/assets/malware.exe').put(new Uint8Array([1, 2]), { contentType: 'application/x-msdownload' }).then(() => undefined)
    );
    await assertFails(
      clientAStorage.ref('workspaces/ws-client-a/assets/large-file.zip').put(new Uint8Array(50 * 1024 * 1024 + 1024), { contentType: 'application/zip' }).then(() => undefined)
    );

    console.log('ALL STORAGE RULES ASSERTIONS COMPLETED SUCCESSFULLY (DB=' + FIRESTORE_DATABASE_ID + ')');
  } catch (err: any) {
    console.error('[BLOCKED] Firebase Emulator is not running or test assertions failed.');
    console.error('Reason: Firebase Emulator Suite requires Java runtime (JRE 11+) and the Firebase CLI.');
    console.error('Exact command needed to run the tests locally:');
    console.error('  1. Ensure Java (JRE 11+) and Node.js are installed.');
    console.error('  2. Start emulators: npx firebase emulators:start --only auth,firestore,storage,functions --project demo-keedohub');
    console.error('  3. Run: npx tsx tests/storage.rules.test.ts');
    console.error('Underlying error details:', err.message || err);
    process.exit(1);
  } finally {
    if (testEnv) {
      await testEnv.cleanup();
    }
  }
}

runStorageSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
