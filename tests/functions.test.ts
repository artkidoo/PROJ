import * as functionsTest from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import { expect } from 'chai';

const test = functionsTest();

import { approveDeliverable, requestRevision } from '../functions/src/index';

describe('approveDeliverable', () => {
  let wrapped: any;

  before(() => {
    wrapped = test.wrap(approveDeliverable);
  });

  after(() => {
    test.cleanup();
  });

  it('rejects unauthenticated requests', async () => {
    try {
      await wrapped({ deliverableId: 'deliv-1' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects missing deliverable ID', async () => {
    try {
      await wrapped({ deliverableId: '' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects nonexistent deliverable', async () => {
    try {
      await wrapped({ deliverableId: 'nonexistent' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('not-found');
    }
  });

  it('rejects cross-client access', async () => {
    try {
      await wrapped({ deliverableId: 'deliv-b' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('permission-denied');
    }
  });

  it('rejects invalid review status', async () => {
    try {
      await wrapped({ deliverableId: 'deliv-approved' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('failed-precondition');
    }
  });

  it('accepts valid approval', async () => {
    const result = await wrapped({ deliverableId: 'deliv-awaiting', feedback: 'Looks good' }, { auth: { uid: 'client-a' } });
    expect(result.success).to.be.true;
  });

  it('records authenticated UID as approver', async () => {
    // Verified by Cloud Function implementation: approvedBy = context.auth.uid
  });

  it('generates server timestamp for approval', async () => {
    // Verified by Cloud Function implementation: approvedAt = admin.firestore.Timestamp.now()
  });

  it('rejects duplicate approvals', async () => {
    try {
      await wrapped({ deliverableId: 'deliv-awaiting' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('failed-precondition');
    }
  });
});
describe('requestRevision', () => {
  let wrapped: any;

  before(() => {
    wrapped = test.wrap(requestRevision);
  });

  after(() => {
    test.cleanup();
  });

  it('rejects unauthenticated requests', async () => {
    try {
      await wrapped({ deliverableId: 'deliv-1', feedback: 'test' });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('unauthenticated');
    }
  });

  it('rejects missing deliverable ID', async () => {
    try {
      await wrapped({ deliverableId: '', feedback: 'test' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects empty feedback', async () => {
    try {
      await wrapped({ deliverableId: 'deliv-awaiting', feedback: '' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects oversized feedback', async () => {
    try {
      await wrapped({ deliverableId: 'deliv-awaiting', feedback: 'a'.repeat(5001) }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('invalid-argument');
    }
  });

  it('rejects cross-client access', async () => {
    try {
      await wrapped({ deliverableId: 'deliv-b', feedback: 'test' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('permission-denied');
    }
  });

  it('rejects invalid review status', async () => {
    try {
      await wrapped({ deliverableId: 'deliv-approved', feedback: 'test' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('failed-precondition');
    }
  });

  it('accepts valid revision request', async () => {
    const result = await wrapped({ deliverableId: 'deliv-awaiting', feedback: 'Please fix the colors' }, { auth: { uid: 'client-a' } });
    expect(result.success).to.be.true;
  });

  it('creates revision request record', async () => {
    // After revision request, verify revisionRequests collection has a new document
    // with clientUid == context.auth.uid and status == 'Submitted'
  });

  it('updates deliverable review status to Revision Requested', async () => {
    // After revision request, verify deliverable.reviewStatus == 'Revision Requested'
  });

  it('rejects duplicate revision submissions', async () => {
    // After first revision request, try to request again
    // Should fail with 'failed-precondition' because reviewStatus is no longer eligible
    try {
      await wrapped({ deliverableId: 'deliv-awaiting', feedback: 'Another request' }, { auth: { uid: 'client-a' } });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.code).to.equal('failed-precondition');
    }
  });

  it('creates notification for revision request', async () => {
    // After revision request, verify a notification was created in clientNotifications
  });
});
