import functionsTest from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import { expect } from 'chai';
import { LOCAL_PROJECT_ID } from './firebase-test-helpers';

// Minimal describe/it shims for tsx execution without mocha
function describe(name: string, fn: () => void): void { fn(); }
function it(name: string, fn: () => Promise<void>): void { void fn(); }

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
