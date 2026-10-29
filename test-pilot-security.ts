import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

async function runSecurityTests() {
  console.log('========================================================================');
  console.log('KEEDOHUB — STRICT FIREBASE SECURITY RULES & TENANT ISOLATION SUITE');
  console.log('========================================================================');

  let testEnv: RulesTestEnvironment | null = null;

  try {
    const rulesContent = fs.readFileSync(path.resolve('./firestore.rules'), 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: 'keedohub-pilot-test-proj',
      firestore: {
        rules: rulesContent,
        host: 'localhost',
        port: 8080
      }
    });

    console.log('[INIT] Connected to Firestore Emulator on localhost:8080.');

    const artistContext = testEnv.authenticatedContext('artist-user-1', { email: 'artist@sariyah.com' });
    const brandContext = testEnv.authenticatedContext('brand-user-1', { email: 'brand@apexdynamics.io' });
    const operatorContext = testEnv.authenticatedContext('operator-user-1', { email: 'operator@keedohub.com' });

    const dbArtist = artistContext.firestore();
    const dbBrand = brandContext.firestore();
    const dbOperator = operatorContext.firestore();

    // Seed test data with rules disabled
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      
      // Register operator as platform admin in admins collection
      await adminDb.doc('admins/operator-user-1').set({
        uid: 'operator-user-1',
        role: 'PlatformAdmin',
        grantedAt: new Date().toISOString()
      });

      // Workspace 1: Brand
      await adminDb.doc('workspaces/ws-brand-apex').set({
        id: 'ws-brand-apex',
        name: 'Apex Dynamics Brand',
        ownerId: 'brand-user-1',
        clientCategory: 'brand'
      });
      await adminDb.doc('workspaces/ws-brand-apex/memberships/brand-user-1').set({
        uid: 'brand-user-1',
        status: 'Active'
      });

      // Workspace 2: Artist
      await adminDb.doc('workspaces/ws-artist-sariyah').set({
        id: 'ws-artist-sariyah',
        name: 'Sariyah Artist',
        ownerId: 'artist-user-1',
        clientCategory: 'artist'
      });
      await adminDb.doc('workspaces/ws-artist-sariyah/memberships/artist-user-1').set({
        uid: 'artist-user-1',
        status: 'Active'
      });

      // Production project in Artist workspace
      await adminDb.doc('workspaces/ws-artist-sariyah/productionProjects/prod-01').set({
        id: 'prod-01',
        title: 'Single Artwork',
        workspaceId: 'ws-artist-sariyah'
      });

      // Internal operator note (internal-only)
      await adminDb.doc('workspaces/ws-artist-sariyah/productionProjects/prod-01/internalNotes/note-01').set({
        id: 'note-01',
        content: 'Confidential mastering revision note',
        isInternalOnly: true,
        authorId: 'operator-user-1'
      });

      // Unpublished deliverable
      await adminDb.doc('workspaces/ws-artist-sariyah/productionProjects/prod-01/deliverables/deliv-draft').set({
        id: 'deliv-draft',
        name: 'Draft Artwork Preview',
        isClientPublished: false
      });

      // Published deliverable
      await adminDb.doc('workspaces/ws-artist-sariyah/productionProjects/prod-01/deliverables/deliv-published').set({
        id: 'deliv-published',
        name: 'Final Approved Artwork',
        isClientPublished: true
      });
    });

    // TEST 1: Cross-workspace read denial
    console.log('[TEST 1] Asserting cross-workspace read denial (Artist -> Brand workspace)...');
    const brandDocRef = dbArtist.doc('workspaces/ws-brand-apex');
    await assertFails(brandDocRef.get());
    console.log('  [PASS] Cross-workspace read correctly denied.');

    // TEST 2: Cross-workspace write denial
    console.log('[TEST 2] Asserting cross-workspace write denial (Artist -> Brand tasks)...');
    const brandTaskRef = dbArtist.doc('workspaces/ws-brand-apex/tasks/unauthorized-task');
    await assertFails(brandTaskRef.set({ title: 'Malicious task insertion', status: 'Todo' }));
    console.log('  [PASS] Cross-workspace write correctly denied.');

    // TEST 3: Privilege escalation prevention
    console.log('[TEST 3] Asserting privilege escalation prevention (self-assigning admin)...');
    const userRef = dbArtist.doc('users/artist-user-1');
    await assertFails(
      userRef.set({
        uid: 'artist-user-1',
        email: 'artist@sariyah.com',
        role: 'PlatformAdmin',
        isAdmin: true,
        isPlatformAdmin: true,
        createdAt: new Date().toISOString()
      })
    );
    console.log('  [PASS] Privilege escalation correctly blocked.');

    // TEST 4: Unpublished deliverable shielding
    console.log('[TEST 4] Asserting unpublished deliverable isolation (Client -> Draft deliverable)...');
    const draftDelivRef = dbArtist.doc('workspaces/ws-artist-sariyah/productionProjects/prod-01/deliverables/deliv-draft');
    await assertFails(draftDelivRef.get());
    console.log('  [PASS] Unpublished deliverable access denied to client.');

    // TEST 5: Private operator notes protection
    console.log('[TEST 5] Asserting internal operator notes protection (Client -> Internal note)...');
    const internalNoteRef = dbArtist.doc('workspaces/ws-artist-sariyah/productionProjects/prod-01/internalNotes/note-01');
    await assertFails(internalNoteRef.get());
    console.log('  [PASS] Internal operator note access denied to client.');

    // TEST 6: Authorized workspace member read success
    console.log('[TEST 6] Asserting authorized workspace member read success (Artist -> Own workspace)...');
    const sariyahDocRef = dbArtist.doc('workspaces/ws-artist-sariyah');
    await assertSucceeds(sariyahDocRef.get());
    console.log('  [PASS] Authorized read successfully allowed.');

    // TEST 7: Operator access to internal notes success
    console.log('[TEST 7] Asserting operator admin access to internal notes...');
    const operatorNoteRef = dbOperator.doc('workspaces/ws-artist-sariyah/productionProjects/prod-01/internalNotes/note-01');
    await assertSucceeds(operatorNoteRef.get());
    console.log('  [PASS] Operator access to internal notes allowed.');

  } catch (err: any) {
    console.error('\n[BLOCKED] Firebase Emulator is not running or test assertions failed.');
    console.error('Reason: Firebase Emulator Suite requires Java runtime (JRE >= 11) which is unavailable in this environment container.');
    console.error('Exact command needed to run the tests locally:');
    console.error('  1. Ensure Java (JRE 11+) and Node.js are installed.');
    console.error('  2. Run: npx firebase emulators:start --only firestore');
    console.error('  3. In another terminal run: npm run test:security\n');
    console.error('Underlying error details:', err.message || err);
    process.exit(1);
  } finally {
    if (testEnv) {
      await testEnv.cleanup();
    }
  }

  console.log('========================================================================');
  console.log('ALL STRICT SECURITY RULES ASSERTIONS COMPLETED SUCCESSFULLY');
  console.log('========================================================================');
}

runSecurityTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
