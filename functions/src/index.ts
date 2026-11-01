import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

async function verifyDeliverableOwnership(
  deliverableId: string,
  uid: string
): Promise<FirebaseFirestore.DocumentSnapshot> {
  const deliverableRef = db.collection('clientDeliverables').doc(deliverableId);
  const deliverableSnap = await deliverableRef.get();

  if (!deliverableSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Deliverable not found.');
  }

  const data = deliverableSnap.data();
  if (data?.clientUid !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'You do not own this deliverable.');
  }

  return deliverableSnap;
}

export const approveDeliverable = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to approve a deliverable.');
  }

  const uid = context.auth.uid;
  const { deliverableId, feedback } = data;

  if (!deliverableId || typeof deliverableId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Deliverable ID is required.');
  }

  if (feedback !== undefined && feedback !== null && (typeof feedback !== 'string' || feedback.length > 5000)) {
    throw new functions.https.HttpsError('invalid-argument', 'Feedback must be a string of 5000 characters or less.');
  }

  const deliverableSnap = await verifyDeliverableOwnership(deliverableId, uid);
  const deliverableData = deliverableSnap.data();

  if (deliverableData?.reviewStatus !== 'Awaiting Review' && deliverableData?.reviewStatus !== 'Revised - Awaiting Review') {
    throw new functions.https.HttpsError('failed-precondition', 'This deliverable is not eligible for approval.');
  }

  const deliverableRef = db.collection('clientDeliverables').doc(deliverableId);
  const now = admin.firestore.Timestamp.now();

  await db.runTransaction(async (transaction) => {
    const freshSnap = await transaction.get(deliverableRef);
    if (!freshSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Deliverable not found.');
    }

    const freshData = freshSnap.data();
    if (freshData?.clientUid !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'You do not own this deliverable.');
    }

    if (freshData?.reviewStatus !== 'Awaiting Review' && freshData?.reviewStatus !== 'Revised - Awaiting Review') {
      throw new functions.https.HttpsError('failed-precondition', 'This deliverable is no longer eligible for approval.');
    }

    transaction.update(deliverableRef, {
      reviewStatus: 'Approved',
      approval: {
        approvedBy: uid,
        approvedAt: now.toDate().toISOString(),
        feedback: feedback || null,
      },
      updatedAt: now.toDate().toISOString(),
    });
  });

  const notificationRef = db.collection('clientNotifications').doc();
  await notificationRef.set({
    id: notificationRef.id,
    clientUid: uid,
    title: 'Deliverable Approved',
    message: `You approved "${deliverableData?.title || 'a deliverable'}".`,
    read: false,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  });

  return { success: true, message: 'Deliverable approved successfully.' };
});
export const requestRevision = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to request a revision.');
  }

  const uid = context.auth.uid;
  const { deliverableId, feedback } = data;

  if (!deliverableId || typeof deliverableId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Deliverable ID is required.');
  }

  if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Feedback is required.');
  }

  if (feedback.length > 5000) {
    throw new functions.https.HttpsError('invalid-argument', 'Feedback must be 5000 characters or less.');
  }

  const deliverableSnap = await verifyDeliverableOwnership(deliverableId, uid);
  const deliverableData = deliverableSnap.data();

  if (deliverableData?.reviewStatus !== 'Awaiting Review' && deliverableData?.reviewStatus !== 'Revised - Awaiting Review') {
    throw new functions.https.HttpsError('failed-precondition', 'This deliverable is not eligible for revision requests.');
  }

  const deliverableRef = db.collection('clientDeliverables').doc(deliverableId);
  const now = admin.firestore.Timestamp.now();

  await db.runTransaction(async (transaction) => {
    const freshSnap = await transaction.get(deliverableRef);
    if (!freshSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Deliverable not found.');
    }

    const freshData = freshSnap.data();
    if (freshData?.clientUid !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'You do not own this deliverable.');
    }

    if (freshData?.reviewStatus !== 'Awaiting Review' && freshData?.reviewStatus !== 'Revised - Awaiting Review') {
      throw new functions.https.HttpsError('failed-precondition', 'This deliverable is no longer eligible for revision requests.');
    }

    const revisionRequestRef = db.collection('revisionRequests').doc();
    transaction.set(revisionRequestRef, {
      id: revisionRequestRef.id,
      deliverableId,
      clientUid: uid,
      projectId: freshData?.projectId || '',
      feedback: feedback.trim(),
      status: 'Submitted',
      submittedAt: now.toDate().toISOString(),
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    });

    transaction.update(deliverableRef, {
      reviewStatus: 'Revision Requested',
      updatedAt: now.toDate().toISOString(),
    });
  });

  const notificationRef = db.collection('clientNotifications').doc();
  await notificationRef.set({
    id: notificationRef.id,
    clientUid: uid,
    title: 'Revision Request Submitted',
    message: `Your revision request for "${deliverableData?.title || 'a deliverable'}" has been submitted.`,
    read: false,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  });

  return { success: true, message: 'Revision request submitted successfully.' };
});