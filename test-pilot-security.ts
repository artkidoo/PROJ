import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

async function runSecurityTests() {
  console.log('========================================================================');
  console.log('KEEDOHUB — STRICT FIREBASE SECURITY RULES & BINARY ZIP TEST RUNNER');
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
    const brandContext = testEnv.authenticatedContext('brand-user-1', { email: 'brand@blackslate.com' });

    const dbArtist = artistContext.firestore();
    const dbBrand = brandContext.firestore();

    // Seed test data with rules disabled
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();
      await adminDb.doc('workspaces/ws-brand-slate').set({
        id: 'ws-brand-slate',
        name: 'Black Slate Brand',
        ownerId: 'brand-user-1',
        clientCategory: 'brand'
      });
      await adminDb.doc('workspaces/ws-sariyah').set({
        id: 'ws-sariyah',
        name: 'Sariyah Artist',
        ownerId: 'artist-user-1',
        clientCategory: 'artist'
      });
      await adminDb.doc('workspaces/ws-sariyah/memberships/artist-user-1').set({
        uid: 'artist-user-1',
        status: 'Active'
      });
    });

    // Test 1: Cross-workspace read denial (Artist trying to read Brand workspace)
    console.log('[TEST 1] Asserting cross-workspace read denial...');
    const brandDocRef = dbArtist.doc('workspaces/ws-brand-slate');
    await assertFails(brandDocRef.get());
    console.log('  [PASS] Cross-workspace read correctly denied (assertFails passed).');

    // Test 2: Privilege escalation prevention (Artist self-assigning PlatformAdmin)
    console.log('[TEST 2] Asserting privilege escalation prevention...');
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
    console.log('  [PASS] Privilege escalation correctly blocked (assertFails passed).');

    // Test 3: Authorized workspace member read success
    console.log('[TEST 3] Asserting authorized workspace member read success...');
    const sariyahDocRef = dbArtist.doc('workspaces/ws-sariyah');
    await assertSucceeds(sariyahDocRef.get());
    console.log('  [PASS] Authorized read successfully allowed (assertSucceeds passed).');

  } catch (err: any) {
    console.error('\n[BLOCKED] Firebase Emulator is not running or test assertions failed.');
    console.error('Exact command needed to run the tests locally:');
    console.error('  firebase emulators:start --only firestore\n');
    console.error('Error details:', err.message || err);
    process.exit(1);
  } finally {
    if (testEnv) {
      await testEnv.cleanup();
    }
  }

  console.log('========================================================================');
  console.log('ALL STRICT SECURITY RULES ASSERTIONS PASSED');
  console.log('========================================================================');
}

runSecurityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
