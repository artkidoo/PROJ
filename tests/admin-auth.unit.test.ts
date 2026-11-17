import assert from 'node:assert/strict';
import type { DocumentSnapshot } from 'firebase/firestore';
import {
  friendlyFirebaseAuthError,
  hasPlatformAdminRole,
  isAdminRecordActive,
  validateEmailInput,
  validatePasswordInput,
} from '../src/lib/firebaseAuth';
import {
  isDeliverablePromotionRestrictedAsset,
  isInternalStoragePath,
} from '../src/lib/assetSecurity';
import { resolveClientProjectWorkspaceId } from '../src/lib/workspaceResolution';

function fakeSnapshot(exists: boolean, data?: Record<string, unknown>): DocumentSnapshot {
  return {
    exists: () => exists,
    data: () => data,
  } as unknown as DocumentSnapshot;
}

function run() {
  // 1. Admin record role & status handling (requires PlatformAdmin role; missing status allowed; revoked/suspended/inactive rejected)
  assert.equal(isAdminRecordActive(fakeSnapshot(false)), false, 'Non-existent admin doc must be rejected');
  assert.equal(hasPlatformAdminRole({ role: 'PlatformAdmin' }), true);
  assert.equal(hasPlatformAdminRole({ role: 'Platform Admin' }), true);
  assert.equal(hasPlatformAdminRole({ role: 'SuperAdmin' }), true);
  assert.equal(hasPlatformAdminRole({ role: 'Client' }), false);
  assert.equal(hasPlatformAdminRole({ role: 'Viewer' }), false);
  assert.equal(hasPlatformAdminRole({ Role: 'PlatformAdmin' }), true);
  assert.equal(hasPlatformAdminRole({}), false);

  assert.equal(
    isAdminRecordActive(fakeSnapshot(true, { uid: '6FcpXQYOxGMY2nltDFIvphnlcF03', role: 'PlatformAdmin' })),
    true,
    'Active PlatformAdmin doc missing status field must succeed'
  );
  assert.equal(
    isAdminRecordActive(fakeSnapshot(true, { uid: '6FcpXQYOxGMY2nltDFIvphnlcF03', Role: 'PlatformAdmin', Status: 'Active', Active: true })),
    true,
    'Active PlatformAdmin doc with capitalized Role, Status, Active fields must succeed'
  );
  assert.equal(
    isAdminRecordActive(fakeSnapshot(true, { uid: 'a1', role: 'PlatformAdmin', status: 'Active' })),
    true,
    'Active status PlatformAdmin doc must succeed'
  );
  assert.equal(
    isAdminRecordActive(fakeSnapshot(true, { uid: 'a-legacy-role', role: 'Platform Admin', status: 'Active' })),
    true,
    'Active status Platform Admin role alias must succeed'
  );
  assert.equal(
    isAdminRecordActive(fakeSnapshot(true, { uid: 'a-no-role', status: 'Active' })),
    false,
    'Admin doc missing role field must be rejected'
  );
  assert.equal(
    isAdminRecordActive(fakeSnapshot(true, { uid: 'a-client-role', role: 'Client', status: 'Active' })),
    false,
    'Admin doc with non-admin Client role must be rejected'
  );
  assert.equal(
    isAdminRecordActive(fakeSnapshot(true, { uid: 'a-viewer-role', role: 'Viewer', status: 'Active' })),
    false,
    'Admin doc with non-admin Viewer role must be rejected'
  );
  for (const status of ['Suspended', 'suspended', 'Revoked', 'Inactive', 'Disabled']) {
    assert.equal(
      isAdminRecordActive(fakeSnapshot(true, { uid: 'a2', role: 'PlatformAdmin', status })),
      false,
      `Admin doc with status=${status} must be rejected`
    );
  }
  assert.equal(
    isAdminRecordActive(fakeSnapshot(true, { uid: 'a2-cap', Role: 'PlatformAdmin', Status: 'Suspended' })),
    false,
    'Admin doc with capitalized Status=Suspended must be rejected'
  );
  assert.equal(isAdminRecordActive(fakeSnapshot(true, { uid: 'a3', role: 'PlatformAdmin', revoked: true })), false);
  assert.equal(isAdminRecordActive(fakeSnapshot(true, { uid: 'a4', role: 'PlatformAdmin', suspended: true })), false);
  assert.equal(isAdminRecordActive(fakeSnapshot(true, { uid: 'a5', role: 'PlatformAdmin', active: false })), false);
  assert.equal(isAdminRecordActive(fakeSnapshot(true, { uid: 'a6', Role: 'PlatformAdmin', Active: false })), false);

  // 2. Email & password validation
  assert.equal(validateEmailInput(''), 'Enter your email address.');
  assert.equal(validateEmailInput('not-an-email'), 'Enter a valid email address.');
  assert.equal(validateEmailInput('artkidmummyspet@gmail.com'), null);
  assert.equal(validatePasswordInput(''), 'Enter a password.');
  assert.equal(validatePasswordInput('short'), 'Password must be at least 8 characters long.');
  assert.equal(validatePasswordInput('StrongPass123!'), null);

  // 3. Friendly error mappings for Google unauthorized-domain & email auth codes
  const domainError = friendlyFirebaseAuthError({ code: 'auth/unauthorized-domain' });
  assert.match(domainError, /Authorized Domains/i);
  assert.match(domainError, /Email and Password/i);

  assert.equal(
    friendlyFirebaseAuthError({ code: 'auth/invalid-credential' }),
    'Invalid email address or password.'
  );
  assert.equal(
    friendlyFirebaseAuthError({ code: 'auth/operation-not-allowed' }),
    'Email/password sign-in is not enabled on this authentication project.'
  );

  // 4. Phase 8.5 production & asset isolation helpers
  assert.equal(isInternalStoragePath('workspaces/ws-1/internal/assets/a1/rough.png'), true);
  assert.equal(isInternalStoragePath('internal/notes.txt'), true);
  assert.equal(isInternalStoragePath('workspaces/ws-1/assets/a1/logo.png'), false);
  assert.equal(isInternalStoragePath('workspaces/ws-1/assets/a1/internal-notes.png'), false);
  assert.equal(isInternalStoragePath('workspaces/ws-1/requests/u1/ref.pdf'), false);

  assert.equal(
    isDeliverablePromotionRestrictedAsset({
      name: 'release-spec.json',
      fileType: 'JSON',
      mimeType: 'application/json',
      storagePath: 'workspaces/ws-1/internal/assets/a1/release-spec.json',
    }),
    true
  );
  assert.equal(
    isDeliverablePromotionRestrictedAsset({
      name: 'cover-final.png',
      fileType: 'PNG',
      mimeType: 'image/png',
      storagePath: 'workspaces/ws-1/internal/assets/a2/cover-final.png',
    }),
    false
  );

  // 5. Phase 8.5 legacy project workspace resolution
  assert.equal(resolveClientProjectWorkspaceId(undefined, 'ws-primary'), 'ws-primary');
  assert.equal(resolveClientProjectWorkspaceId('', 'ws-primary'), 'ws-primary');
  assert.equal(resolveClientProjectWorkspaceId('ws-secondary', 'ws-primary'), 'ws-secondary');

  console.log('ALL ADMIN AUTH & PHASE 8.5 UNIT TESTS PASSED');
}

run();
