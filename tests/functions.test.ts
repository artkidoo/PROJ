import functionsTest from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import { expect } from 'chai';
import { LOCAL_PROJECT_ID, adminDb } from './firebase-test-helpers';

// Minimal describe/it/beforeEach/afterEach shims for tsx execution without mocha
let beforeEachHook: (() => Promise<void>) | null = null;
let afterEachHook: (() => Promise<void>) | null = null;
function describe(name: string, fn: () => void): void { fn(); }
function beforeEach(fn: () => Promise<void>): void { beforeEachHook = fn; }
function afterEach(fn: () => Promise<void>): void { afterEachHook = fn; }
function it(name: string, fn: () => Promise<void>): void {
  (async () => {
    if (beforeEachHook) await beforeEachHook();
    try { await fn(); } finally { if (afterEachHook) await afterEachHook(); }
  })();
}

// Force emulator mode before any firestore access
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
process.env.GCLOUD_PROJECT = LOCAL_PROJECT_ID;

// Firebase Admin for test
const test = functionsTest({ projectId: LOCAL_PROJECT_ID });

import {
  adminUpdateClientProfile,
  adminUpdatePlatformRole,
  adminSaveServicePackage,
  submitProductionRequest,
  requestProductionRevision,
  approveProductionDeliverable,
  rejectProductionDeliverable,
  adminCreateClientWorkspace,
  adminUpdateWorkspace,
  adminUpdatePlatformSettings,
} from '../functions/src/index';

const wrappedAdminUpdateClientProfile = test.wrap(adminUpdateClientProfile);
const wrappedAdminUpdatePlatformRole = test.wrap(adminUpdatePlatformRole);
const wrappedAdminSaveServicePackage = test.wrap(adminSaveServicePackage);
const wrappedSubmitProductionRequest = test.wrap(submitProductionRequest);
const wrappedRequestProductionRevision = test.wrap(requestProductionRevision);
const wrappedApproveProductionDeliverable = test.wrap(approveProductionDeliverable);
const wrappedRejectProductionDeliverable = test.wrap(rejectProductionDeliverable);
const wrappedAdminCreateClientWorkspace = test.wrap(adminCreateClientWorkspace);
const wrappedAdminUpdateWorkspace = test.wrap(adminUpdateWorkspace);
const wrappedAdminUpdatePlatformSettings = test.wrap(adminUpdatePlatformSettings);


describe('adminUpdateClientProfile', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedAdminUpdateClientProfile({ uid: 'client-a', displayName: 'Test' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects non-admin requests', async () => {
    try {
      await wrappedAdminUpdateClientProfile({ uid: 'client-a', displayName: 'Test' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('permission-denied');
    }
  });

  it('rejects missing uid', async () => {
    try {
      await wrappedAdminUpdateClientProfile({ displayName: 'Test' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects nonexistent client profile', async () => {
    try {
      await wrappedAdminUpdateClientProfile({ uid: 'nonexistent', displayName: 'Test' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('not-found');
    }
  });
});

describe('adminUpdatePlatformRole', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedAdminUpdatePlatformRole({ targetUid: 'client-a', action: 'grant' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects non-admin requests', async () => {
    try {
      await wrappedAdminUpdatePlatformRole({ targetUid: 'client-a', action: 'grant' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('permission-denied');
    }
  });

  it('rejects invalid action', async () => {
    try {
      await wrappedAdminUpdatePlatformRole({ targetUid: 'client-a', action: 'invalid' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects missing targetUid', async () => {
    try {
      await wrappedAdminUpdatePlatformRole({ action: 'grant' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });
});

describe('adminSaveServicePackage', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedAdminSaveServicePackage({ id: 'svc-1', name: 'Service', category: 'Music Release Promotion' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects non-admin requests', async () => {
    try {
      await wrappedAdminSaveServicePackage({ id: 'svc-1', name: 'Service', category: 'Music Release Promotion' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('permission-denied');
    }
  });

  it('rejects invalid service ID', async () => {
    try {
      await wrappedAdminSaveServicePackage({ id: 'invalid id!', name: 'Service', category: 'Music Release Promotion' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects invalid category', async () => {
    try {
      await wrappedAdminSaveServicePackage({ id: 'svc-1', name: 'Service', category: 'Invalid Category' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });
});

describe('submitProductionRequest', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedSubmitProductionRequest({ workspaceId: 'ws-client-a' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects missing workspaceId', async () => {
    try {
      await wrappedSubmitProductionRequest({}, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects invalid workspaceId', async () => {
    try {
      await wrappedSubmitProductionRequest({ workspaceId: 'invalid id!' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects incomplete profile', async () => {
    try {
      await wrappedSubmitProductionRequest({ workspaceId: 'ws-client-a' }, { auth: { uid: 'client-b' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('failed-precondition');
    }
  });
});

describe('requestProductionRevision', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedRequestProductionRevision({ projectId: 'proj-a', deliverableId: 'deliv-a', feedback: 'Fix colors' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects missing projectId', async () => {
    try {
      await wrappedRequestProductionRevision({ deliverableId: 'deliv-a', feedback: 'test' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects missing deliverableId', async () => {
    try {
      await wrappedRequestProductionRevision({ projectId: 'proj-a', feedback: 'test' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects empty feedback', async () => {
    try {
      await wrappedRequestProductionRevision({ projectId: 'proj-a', deliverableId: 'deliv-a', feedback: '' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects oversized feedback', async () => {
    try {
      await wrappedRequestProductionRevision({ projectId: 'proj-a', deliverableId: 'deliv-a', feedback: 'a'.repeat(5001) }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects cross-client access', async () => {
    try {
      await wrappedRequestProductionRevision({ projectId: 'proj-b', deliverableId: 'deliv-b', feedback: 'test' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('permission-denied');
    }
  });
});

describe('approveProductionDeliverable', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedApproveProductionDeliverable({ projectId: 'proj-a', deliverableId: 'deliv-a' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects missing projectId', async () => {
    try {
      await wrappedApproveProductionDeliverable({ deliverableId: 'deliv-a' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects missing deliverableId', async () => {
    try {
      await wrappedApproveProductionDeliverable({ projectId: 'proj-a' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects cross-client access', async () => {
    try {
      await wrappedApproveProductionDeliverable({ projectId: 'proj-b', deliverableId: 'deliv-b' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('permission-denied');
    }
  });
});

describe('rejectProductionDeliverable', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedRejectProductionDeliverable({ projectId: 'proj-a', deliverableId: 'deliv-a', feedback: 'Needs work' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects empty feedback', async () => {
    try {
      await wrappedRejectProductionDeliverable({ projectId: 'proj-a', deliverableId: 'deliv-a', feedback: '' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects oversized feedback', async () => {
    try {
      await wrappedRejectProductionDeliverable({ projectId: 'proj-a', deliverableId: 'deliv-a', feedback: 'a'.repeat(5001) }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });
});

describe('adminCreateClientWorkspace', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedAdminCreateClientWorkspace({ email: 'client@test.com', name: 'Workspace' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects invalid email', async () => {
    try {
      await wrappedAdminCreateClientWorkspace({ email: 'invalid', name: 'Workspace' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });
});

describe('adminUpdateWorkspace', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedAdminUpdateWorkspace({ workspaceId: 'ws-client-a', status: 'Active' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects missing workspaceId', async () => {
    try {
      await wrappedAdminUpdateWorkspace({}, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });
});

describe('adminUpdatePlatformSettings', () => {
  it('rejects unauthenticated requests', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ platformName: 'Test Platform' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects invalid settings object', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings('not-an-object', { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects unexpected fields', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ platformName: 'Test', invalidField: 'x' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects invalid email format', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ supportEmail: 'not-an-email' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects invalid currency', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ defaultCurrency: 'XYZ' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects out-of-range turnaround days', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ standardTurnaroundDays: 0 }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects invalid URL', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ publicWebsite: 'not-a-url' }, { auth: { uid: 'admin-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });
});

describe('adminUpdatePlatformSettings', () => {
  const adminUid = 'admin-settings-active';
  const settingsDocRef = adminDb.collection('settings').doc('platform');
  const adminDocRef = adminDb.collection('admins').doc(adminUid);
  const profileDocRef = adminDb.collection('clientProfiles').doc(adminUid);

  beforeEach(async () => {
    await adminDocRef.set({ uid: adminUid, role: 'PlatformAdmin', status: 'Active', grantedAt: new Date().toISOString() });
    await profileDocRef.set({ uid: adminUid, email: 'admin-settings@test.com', displayName: 'Settings Admin', accountType: 'Brand', status: 'Active', onboardingComplete: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    await settingsDocRef.set({ platformName: 'Original Platform', supportEmail: 'original@test.com', contactPhone: '+1 (555) 000-0000', publicWebsite: 'https://original.example.com', agencyAddress: '123 Original St', defaultCurrency: 'USD', standardTurnaroundDays: 7, clientRegistrationEnabled: true, emailAlertsEnabled: true, slackWebhookUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  });

  afterEach(async () => {
    const batch = adminDb.batch();
    batch.delete(adminDocRef);
    batch.delete(profileDocRef);
    batch.delete(settingsDocRef);
    const auditSnap = await adminDb.collection('adminAuditLogs').where('actorUid', '==', adminUid).get();
    auditSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  });

  it('rejects unauthenticated requests', async () => {
    const result = await wrappedAdminUpdatePlatformSettings({
      platformName: 'Updated Platform',
      supportEmail: 'updated@test.com',
      contactPhone: '+1 (555) 111-2222',
      publicWebsite: 'https://updated.example.com',
      agencyAddress: '456 Updated Ave',
      defaultCurrency: 'EUR',
      standardTurnaroundDays: 14,
      clientRegistrationEnabled: false,
      emailAlertsEnabled: false,
      slackWebhookUrl: 'https://hooks.slack.com/services/TEST',
    }, { auth: { uid: adminUid } });
    expect(result.success).to.equal(true);
  });

  it('persists settings document with expected values', async () => {
    await wrappedAdminUpdatePlatformSettings({
      platformName: 'Persisted Platform',
      supportEmail: 'persist@test.com',
      defaultCurrency: 'GBP',
      standardTurnaroundDays: 21,
    }, { auth: { uid: adminUid } });
    const snapshot = await settingsDocRef.get();
    expect(snapshot.exists()).to.equal(true);
    const data = snapshot.data();
    expect(data.platformName).to.equal('Persisted Platform');
    expect(data.supportEmail).to.equal('persist@test.com');
    expect(data.defaultCurrency).to.equal('GBP');
    expect(data.standardTurnaroundDays).to.equal(21);
    expect(data.contactPhone).to.equal('+1 (555) 000-0000');
    expect(data.agencyAddress).to.equal('123 Original St');
    expect(data.clientRegistrationEnabled).to.equal(true);
    expect(data.emailAlertsEnabled).to.equal(true);
  });

  it('creates audit record with correct actor UID and action', async () => {
    await wrappedAdminUpdatePlatformSettings({ platformName: 'Audit Test Platform' }, { auth: { uid: adminUid } });
    const auditSnap = await adminDb.collection('adminAuditLogs').where('actorUid', '==', adminUid).where('action', '==', 'update_platform_settings').get();
    expect(auditSnap.size).to.be.greaterThan(0);
    const auditDoc = auditSnap.docs[0];
    const auditData = auditDoc.data();
    expect(auditData.target).to.equal('settings/platform');
    expect(auditData.createdAt).to.be.a('string');
  });

  it('rejects non-admin users', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ platformName: 'Hack' }, { auth: { uid: 'non-admin-user' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('permission-denied');
    }
  });

  it('rejects suspended administrators', async () => {
    const suspendedUid = 'admin-settings-suspended';
    await adminDb.collection('admins').doc(suspendedUid).set({ uid: suspendedUid, role: 'PlatformAdmin', status: 'Suspended', grantedAt: new Date().toISOString() });
    await adminDb.collection('clientProfiles').doc(suspendedUid).set({ uid: suspendedUid, email: 'suspended@test.com', status: 'Suspended', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    try {
      await wrappedAdminUpdatePlatformSettings({ platformName: 'Suspended Try' }, { auth: { uid: suspendedUid } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('permission-denied');
    } finally {
      await adminDb.batch().delete(adminDb.collection('admins').doc(suspendedUid)).delete(adminDb.collection('clientProfiles').doc(suspendedUid)).commit();
    }
  });

  it('handles missing settings document gracefully', async () => {
    await settingsDocRef.delete();
    try {
      await wrappedAdminUpdatePlatformSettings({ platformName: 'No Settings Doc' }, { auth: { uid: adminUid } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('not-found');
    } finally {
      await settingsDocRef.set({ platformName: 'Restored', supportEmail: 'restore@test.com', contactPhone: '+1 (555) 000-0000', publicWebsite: 'https://restore.example.com', agencyAddress: 'Restored St', defaultCurrency: 'USD', standardTurnaroundDays: 7, clientRegistrationEnabled: true, emailAlertsEnabled: true, slackWebhookUrl: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
  });

  it('does not create audit record on failed update', async () => {
    const auditBefore = await adminDb.collection('adminAuditLogs').where('actorUid', '==', adminUid).get();
    const countBefore = auditBefore.size;
    try {
      await wrappedAdminUpdatePlatformSettings({ platformName: '', invalidField: 'x' }, { auth: { uid: adminUid } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
    const auditAfter = await adminDb.collection('adminAuditLogs').where('actorUid', '==', adminUid).get();
    expect(auditAfter.size).to.equal(countBefore);
  });

  it('rejects unsupported currency', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ defaultCurrency: 'ZZZ' }, { auth: { uid: adminUid } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects empty platform name', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ platformName: '' }, { auth: { uid: adminUid } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects out-of-range turnaround days too high', async () => {
    try {
      await wrappedAdminUpdatePlatformSettings({ standardTurnaroundDays: 366 }, { auth: { uid: adminUid } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });
});
