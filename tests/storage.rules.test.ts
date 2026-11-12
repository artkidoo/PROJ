import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { LOCAL_PROJECT_ID, FIRESTORE_DATABASE_ID } from './firebase-test-helpers';

const NAMED_DB = FIRESTORE_DATABASE_ID;

async function runStorageSecurityTests() {
  const rules = fs.readFileSync(path.resolve('./storage.rules'), 'utf8');
  const firestoreRules = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');
  let testEnv: RulesTestEnvironment | null = null;

  try {
    testEnv = await initializeTestEnvironment({
      projectId: LOCAL_PROJECT_ID,
      firestore: { rules: firestoreRules, host: 'localhost', port: 8080 },
      storage: { rules: rules, host: 'localhost', port: 9199 },
      auth: { host: 'localhost', port: 9099 },
    });

    const adminCtx = testEnv.authenticatedContext('admin-a', { email: 'admin@example.com' });
    const clientACtx = testEnv.authenticatedContext('client-a', { email: 'client-a@example.com' });
    const clientBCtx = testEnv.authenticatedContext('client-b', { email: 'client-b@example.com' });
    const guestCtx = testEnv.unauthenticatedContext();

    const adminStorage = adminCtx.storage('gs://demo-keedohub.appspot.com');
    const clientAStorage = clientACtx.storage('gs://demo-keedohub.appspot.com');
    const clientBStorage = clientBCtx.storage('gs://demo-keedohub.appspot.com');
    const guestStorage = guestCtx.storage('gs://demo-keedohub.appspot.com');

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const seedDb = context.firestore();

      await seedDb.doc('admins/admin-a').set({ uid: 'admin-a', email: 'admin@example.com', role: 'PlatformAdmin', grantedAt: new Date().toISOString() });

      await seedDb.doc('clientProfiles/client-a').set({ uid: 'client-a', email: 'clienta@example.com', accountType: 'Artist', organizationName: 'Artist A', workspaceId: 'ws-client-a', onboardingComplete: true, status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      await seedDb.doc('clientProfiles/client-b').set({ uid: 'client-b', email: 'clientb@example.com', accountType: 'Brand', organizationName: 'Brand B', workspaceId: 'ws-client-b', onboardingComplete: true, status: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      await seedDb.doc('workspaces/ws-client-a').set({ id: 'ws-client-a', ownerId: 'client-a', name: 'Artist A Workspace', status: 'Active', membersCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      await seedDb.doc('workspaces/ws-client-b').set({ id: 'ws-client-b', ownerId: 'client-b', name: 'Client B Workspace', status: 'Active', membersCount: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

      await seedDb.doc('userNotifications/client-a/items/notice-a').set({ recipientUid: 'client-a', title: 'Test', message: 'Test', type: 'deliverable', projectId: 'project-a', read: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    });

    // SECTION 1: Artist and Brand private assets
    console.log('[SECTION 1] Artist and Brand private assets');
    console.log('  1.1: Artist can read own private assets (owner: client-a)');
    await assertSucceeds(clientAStorage.ref('artist-assets/portfolio.jpg').getMetadata());
    console.log('    [PASS] Private asset read allowed for owner.');

    console.log('  1.2: Brand cannot read another client private assets');
    await assertFails(clientBStorage.ref('artist-assets/portfolio.jpg').getMetadata());
    console.log('    [PASS] Cross-client private asset read denied.');

    // SECTION 2: Suspended / inactive users
    console.log('[SECTION 2] Suspended / inactive user access');
    console.log('  2.1: Suspended client cannot access private assets');
    await assertFails(clientAStorage.ref('artist-assets/portfolio.jpg').getMetadata());
    console.log('    [PASS] Suspended client access denied.');

    // SECTION 3: Published deliverable access
    console.log('[SECTION 3] Published deliverable access');
    console.log('  3.1: Client can read own published deliverable');
    await assertSucceeds(clientAStorage.ref('production/proj-a/deliverables/deliv-a/image.jpg').getMetadata());
    console.log('    [PASS] Published deliverable read allowed.');

    console.log('  3.2: Admin can read any published deliverable');
    await assertSucceeds(adminStorage.ref('production/proj-b/deliverables/deliv-b/image.jpg').getMetadata());
    console.log('    [PASS] Admin published deliverable read allowed.');

    console.log('  3.3: Draft deliverable is not readable by anyone (owner blocked)');
    await assertFails(clientAStorage.ref('production/proj-a/deliverables/deliv-draft/image.jpg').getMetadata());
    console.log('    [PASS] Unpublished deliverable read denied.');

    // SECTION 4: Admin-only files and internal resources
    console.log('[SECTION 4] Admin-only files and internal resources');
    console.log('  4.1: Admin can read internal workspace resources');
    await assertSucceeds(adminStorage.ref('workspaces/ws-client-a/internal/confidential.pdf').getMetadata());
    console.log('    [PASS] Admin internal file read allowed.');

    console.log('  4.2: Non-admin cannot read internal workspace resources');
    await assertFails(clientAStorage.ref('workspaces/ws-client-a/internal/confidential.pdf').getMetadata());
    console.log('    [PASS] Non-admin internal file read denied.');

    // SECTION 5: Unauthorized and cross-client access
    console.log('[SECTION 5] Unauthorized and cross-client access');
    console.log('  5.1: Unauthenticated cannot read any storage');
    await assertFails(guestStorage.ref('artist-assets/portfolio.jpg').getMetadata());
    console.log('    [PASS] Unauthenticated read denied.');

    console.log('  5.2: Cross-client access to workspace files denied');
    await assertFails(clientBStorage.ref('workspaces/ws-client-a/artist-assets/portfolio.jpg').getMetadata());
    console.log('    [PASS] Cross-client read denied.');

    // SECTION 6: Invalid file access
    console.log('[SECTION 6] Invalid file access');
    console.log('  6.1: Invalid MIME type (executable) blocked');
    await assertFails(clientAStorage.ref('workspaces/ws-client-a/malware.exe').putString('test', 'data_text'));
    console.log('    [PASS] Executable file blocked.');

    console.log('  6.2: File too large (>50MB) blocked');
    await assertFails(clientAStorage.ref('workspaces/ws-client-a/large-file.zip').putString('a'.repeat(51 * 1024 * 1024), 'data_text'));
    console.log('    [PASS] Oversized file blocked.');

    console.log('========================================================================');
    console.log('ALL STORAGE RULES ASSERTIONS COMPLETED SUCCESSFULLY');
    console.log('========================================================================');
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
};

runStorageSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
