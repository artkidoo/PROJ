import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const DATABASE_ID = 'ai-studio-lyricalentbrandl-85ee0d5d-6fc2-41f3-a410-3e059e509c38';

admin.initializeApp();
const db = getFirestore(admin.app(), DATABASE_ID);

interface ClientProjectHistoryEntry {
  authorUid: string;
  authorName: string;
  authorRole: 'Client' | 'Admin';
  message: string;
  createdAt: string;
}

function notificationId(eventKey: string): string {
  return `evt_${eventKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120)}`;
}

async function notifyUser(
  uid: string,
  eventKey: string,
  title: string,
  message: string,
  type: string,
  projectId?: string,
  entityId?: string,
  dueDate?: string,
) {
  if (!uid) return;
  const now = new Date().toISOString();
  const notificationRef = db.collection('userNotifications').doc(uid).collection('items').doc(notificationId(eventKey));
  const notification = {
    recipientUid: uid,
    title,
    message,
    type,
    ...(projectId ? { projectId } : {}),
    ...(entityId ? { entityId } : {}),
    ...(dueDate ? { dueDate } : {}),
    read: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.runTransaction(async transaction => {
    const existing = await transaction.get(notificationRef);
    if (!existing.exists) transaction.create(notificationRef, notification);
  });
}

async function notifyAdmins(
  eventKey: string,
  title: string,
  message: string,
  type: string,
  projectId?: string,
  entityId?: string,
) {
  const admins = await db.collection('admins').get();
  await Promise.all(admins.docs.map(adminDoc =>
    notifyUser(adminDoc.id, eventKey, title, message, type, projectId, entityId)
  ));
}

export const adminUpdateClientProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  const adminSnap = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminSnap.exists) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  const uid = String(data?.uid || '');
  if (!uid) throw new functions.https.HttpsError('invalid-argument', 'uid required.');
  const profileRef = db.collection('clientProfiles').doc(uid);
  const profile = await profileRef.get();
  if (!profile.exists) throw new functions.https.HttpsError('not-found', 'Client profile not found.');
  const updates: Record<string, string> = {};
  for (const field of ['displayName', 'organizationName'] as const) {
    if (data[field] !== undefined) updates[field] = requireText(data[field], field, 100);
  }
  if (data.accountType !== undefined) {
    if (!['Artist', 'Brand', 'Company'].includes(data.accountType)) {
      throw new functions.https.HttpsError('invalid-argument', 'accountType is invalid.');
    }
    updates.accountType = data.accountType;
  }
  if (data.status !== undefined) {
    if (!['Active', 'Suspended'].includes(data.status)) {
      throw new functions.https.HttpsError('invalid-argument', 'status is invalid.');
    }
    updates.status = data.status;
  }
  if (Object.keys(updates).length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Provide at least one client profile field to update.');
  }
  const now = new Date().toISOString();
  updates.updatedAt = now;
  const batch = db.batch();
  batch.update(profileRef, updates);
  if (updates.organizationName) {
    const workspaces = await db.collection('workspaces').where('ownerId', '==', uid).get();
    for (const workspace of workspaces.docs) {
      batch.update(workspace.ref, {
        name: updates.organizationName,
        'brand.name': updates.organizationName,
        updatedAt: now,
      });
    }
  }
  batch.create(db.collection('adminAuditLogs').doc(), {
    actorUid: context.auth.uid,
    actorName: context.auth.token.name || context.auth.uid,
    action: 'update_client_profile',
    targetUid: uid,
    details: JSON.stringify({ changedFields: Object.keys(updates).filter(field => field !== 'updatedAt'), status: updates.status }),
    createdAt: now,
  });
  await batch.commit();
  if (updates.status && updates.status !== profile.get('status')) {
    await notifyUser(
      uid,
      `client_status_${updates.status}_${Date.now()}`,
      updates.status === 'Suspended' ? 'Workspace access suspended' : 'Workspace access restored',
      updates.status === 'Suspended'
        ? 'Your account access has been suspended. Contact KeedoHub support if you believe this is an error.'
        : 'Your account is active again. Sign in to continue using your workspace.',
      'account',
    );
  }
  return { ok: true };
});

export const submitPublicEnquiry = functions.https.onCall(async (data, context) => {
  const name = requireText(data?.name, 'Name', 100);
  const email = requireText(data?.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Enter a valid email address.');
  }
  const service = requireText(data?.service, 'Service', 160);
  const message = requireText(data?.message, 'Project brief', 5000);
  const requirements = typeof data?.requirements === 'string' ? data.requirements.trim().slice(0, 3000) : '';
  const references = typeof data?.references === 'string' ? data.references.trim().slice(0, 2000) : '';
  const now = new Date().toISOString();
  const enquiryRef = db.collection('serviceEnquiries').doc();
  await enquiryRef.create({
    id: enquiryRef.id,
    name,
    email,
    service,
    message,
    requirements,
    references,
    status: 'New',
    createdAt: now,
    updatedAt: now,
    ...(context.auth ? { submittedByUid: context.auth.uid } : {}),
  });
  await notifyAdmins(
    `public_enquiry_${enquiryRef.id}`,
    'New public service enquiry',
    `${name} asked about ${service}.`,
    'enquiry',
    undefined,
    enquiryRef.id,
  );
  return { success: true, enquiryId: enquiryRef.id };
});

export const reviewPublicEnquiry = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  const adminSnap = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminSnap.exists) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  const enquiryId = requireText(data?.enquiryId, 'Enquiry ID', 128);
  const status = data?.status;
  if (!['New', 'In Review', 'Contacted', 'Closed'].includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', 'Enquiry status is invalid.');
  }
  const enquiryRef = db.collection('serviceEnquiries').doc(enquiryId);
  const enquiry = await enquiryRef.get();
  if (!enquiry.exists) throw new functions.https.HttpsError('not-found', 'Enquiry not found.');
  const now = new Date().toISOString();
  const adminNote = typeof data?.adminNote === 'string' ? data.adminNote.trim().slice(0, 2000) : '';
  const batch = db.batch();
  batch.update(enquiryRef, {
    status,
    ...(adminNote ? { adminNote } : {}),
    updatedAt: now,
  });
  batch.create(db.collection('adminAuditLogs').doc(), {
    actorUid: context.auth.uid,
    actorName: context.auth.token.name || context.auth.uid,
    action: 'review_public_enquiry',
    target: enquiryId,
    details: JSON.stringify({ status, email: enquiry.get('email') }),
    createdAt: now,
  });
  await batch.commit();
  return { success: true };
});

export const convertServiceEnquiryToProject = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  const adminSnap = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminSnap.exists) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  const enquiryId = requireText(data?.enquiryId, 'Enquiry ID', 128);
  const enquiryRef = db.collection('serviceEnquiries').doc(enquiryId);
  const enquiry = await enquiryRef.get();
  if (!enquiry.exists) throw new functions.https.HttpsError('not-found', 'Enquiry not found.');
  if (enquiry.get('status') === 'Converted') {
    throw new functions.https.HttpsError('failed-precondition', 'This enquiry has already been converted.');
  }
  const enquiryEmail = String(enquiry.get('email') || '');
  const client = await findClientProfileByEmail(enquiryEmail);
  if (client.get('onboardingComplete') !== true || client.get('status') === 'Suspended') {
    throw new functions.https.HttpsError('failed-precondition', 'The matching client account must complete onboarding and be active.');
  }
  const workspaceId = client.get('workspaceId');
  if (typeof workspaceId !== 'string') {
    throw new functions.https.HttpsError('failed-precondition', 'The client must create an Artist or Brand workspace before this enquiry can become a production request.');
  }
  const workspace = await db.collection('workspaces').doc(workspaceId).get();
  if (!workspace.exists || workspace.get('ownerId') !== client.id || !['Active', 'Onboarding'].includes(workspace.get('status') || 'Active')) {
    throw new functions.https.HttpsError('failed-precondition', 'The client workspace is unavailable.');
  }
  const message = [
    `Public service enquiry from ${enquiry.get('name')} (${enquiry.get('email')}).`,
    `Requested service: ${enquiry.get('service')}.`,
    String(enquiry.get('message') || ''),
    enquiry.get('requirements') ? `Requirements:\n${enquiry.get('requirements')}` : '',
    enquiry.get('references') ? `References:\n${enquiry.get('references')}` : '',
  ].filter(Boolean).join('\n\n');
  const projectRef = db.collection('clientProjects').doc();
  const activityRef = projectRef.collection('activity').doc();
  const now = new Date().toISOString();
  await db.runTransaction(async transaction => {
    const latestEnquiry = await transaction.get(enquiryRef);
    if (!latestEnquiry.exists || latestEnquiry.get('status') === 'Converted') {
      throw new functions.https.HttpsError('failed-precondition', 'This enquiry has already been converted or removed.');
    }
    transaction.create(projectRef, {
      id: projectRef.id,
      clientUid: client.id,
      workspaceId,
      title: `${enquiry.get('service')}: ${String(enquiry.get('message') || '').slice(0, 100)}`,
      description: message.slice(0, 5000),
      category: String(enquiry.get('service') || 'Creative production').slice(0, 160),
      status: 'Pending',
      stage: 'New Request',
      priority: 'Normal',
      progress: 0,
      startDate: now.slice(0, 10),
      expectedDeliveryDate: '',
      requestStatus: 'Pending',
      requestHistory: [{
        authorUid: client.id,
        authorName: client.get('displayName') || enquiry.get('name'),
        authorRole: 'Client',
        message,
        createdAt: now,
      }],
      createdAt: now,
      updatedAt: now,
    });
    transaction.create(activityRef, {
      projectId: projectRef.id,
      actorUid: context.auth!.uid,
      actorName: context.auth!.token.name || 'KeedoHub team',
      action: 'Public enquiry converted to production request',
      details: 'The original enquiry brief and references were linked to this project.',
      clientVisible: true,
      createdAt: now,
    });
    transaction.update(enquiryRef, {
      status: 'Converted',
      projectId: projectRef.id,
      updatedAt: now,
    });
    transaction.create(db.collection('adminAuditLogs').doc(), {
      actorUid: context.auth!.uid,
      actorName: context.auth!.token.name || context.auth!.uid,
      action: 'convert_service_enquiry',
      target: enquiryId,
      targetUid: client.id,
      details: JSON.stringify({ projectId: projectRef.id, service: enquiry.get('service') }),
      createdAt: now,
    });
  });
  await notifyUser(
    client.id,
    `enquiry_converted_${enquiryId}`,
    'Your enquiry is now a production request',
    `The team linked your ${enquiry.get('service')} enquiry to a request in your workspace.`,
    'request',
    projectRef.id,
  );
  return { success: true, projectId: projectRef.id };
});

export const adminCreateClientWorkspace = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  if (!(await db.collection('admins').doc(context.auth.uid).get()).exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  }
  const email = requireText(data?.email, 'Client email', 254).toLowerCase();
  const name = requireText(data?.name, 'Workspace name', 100);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Enter a valid client email address.');
  }
  const client = await findClientProfileByEmail(email);
  if (client.get('onboardingComplete') !== true || client.get('status') === 'Suspended') {
    throw new functions.https.HttpsError('failed-precondition', 'The client must be active and have completed onboarding.');
  }
  const [existingWorkspace, ownedWorkspaces] = await Promise.all([
    client.get('workspaceId') ? db.collection('workspaces').doc(client.get('workspaceId')).get() : Promise.resolve(null),
    db.collection('workspaces').where('ownerId', '==', client.id).limit(1).get(),
  ]);
  if (existingWorkspace?.exists && existingWorkspace.get('ownerId') === client.id) {
    return { success: true, workspaceId: existingWorkspace.id, alreadyExists: true };
  }
  if (!existingWorkspace && !ownedWorkspaces.empty) {
    const workspace = ownedWorkspaces.docs[0];
    await client.ref.update({ workspaceId: workspace.id, updatedAt: new Date().toISOString() });
    return { success: true, workspaceId: workspace.id, alreadyExists: true };
  }
  const type = data.workspaceType === 'Brand' ? 'Brand' : 'Artist';
  const category = type.toLowerCase();
  const accentColor = typeof data.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(data.accentColor)
    ? data.accentColor
    : type === 'Artist' ? '#D97706' : '#2563EB';
  const description = typeof data.description === 'string' ? data.description.trim().slice(0, 1000) : '';
  const tagline = typeof data.tagline === 'string' ? data.tagline.trim().slice(0, 160) : '';
  const packageId = typeof data.packageId === 'string' ? data.packageId.trim() : '';
  if (packageId && !(await db.collection('services').doc(packageId).get()).exists) {
    throw new functions.https.HttpsError('not-found', 'The selected service package no longer exists.');
  }
  const now = new Date().toISOString();
  const workspaceRef = db.collection('workspaces').doc();
  const workspace: Record<string, unknown> = {
    id: workspaceRef.id,
    name,
    type,
    clientCategory: category,
    ownerId: client.id,
    status: 'Onboarding',
    description: description || `${name} ${type} Workspace`,
    contactEmail: email,
    ...(packageId ? { contractedPackageIds: [packageId] } : {}),
    brand: {
      name,
      primaryColor: accentColor,
      secondaryColor: '#0A0A0A',
      accentColor,
      ...(tagline ? { tagline } : {}),
      typography: { displayFont: 'Plus Jakarta Sans', bodyFont: 'Plus Jakarta Sans' },
    },
    createdAt: now,
    updatedAt: now,
  };
  if (type === 'Artist') {
    workspace.artistProfile = {
      biography: '',
      genre: '',
      profileImageUrl: client.get('photoURL') || '',
      instagram: '',
      spotify: '',
      appleMusic: '',
      youtube: '',
      website: '',
    };
  } else {
    workspace.brandProfile = {
      description: '',
      industry: '',
      website: '',
      logoUrl: client.get('photoURL') || '',
      brandVoice: '',
      photographyDirection: '',
      graphicDesignPrinciples: '',
      usageGuidelines: '',
      creativeReferences: '',
    };
  }
  const batch = db.batch();
  batch.create(workspaceRef, workspace);
  batch.update(client.ref, { workspaceId: workspaceRef.id, updatedAt: now });
  batch.create(db.collection('adminAuditLogs').doc(), {
    actorUid: context.auth.uid,
    actorName: context.auth.token.name || context.auth.uid,
    action: 'create_client_workspace',
    target: workspaceRef.id,
    targetUid: client.id,
    details: JSON.stringify({ type, name }),
    createdAt: now,
  });
  await batch.commit();
  return { success: true, workspaceId: workspaceRef.id, alreadyExists: false };
});

export const adminUpdateWorkspace = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  if (!(await db.collection('admins').doc(context.auth.uid).get()).exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  }
  const workspaceId = requireText(data?.workspaceId, 'Workspace ID', 128);
  const updates: Record<string, unknown> = {};
  if (data.status !== undefined) {
    if (!['Active', 'Onboarding', 'Paused', 'Archived'].includes(data.status)) {
      throw new functions.https.HttpsError('invalid-argument', 'Workspace status is invalid.');
    }
    updates.status = data.status;
  }
  if (data.contractedPackageIds !== undefined) {
    if (!Array.isArray(data.contractedPackageIds) || data.contractedPackageIds.length > 50 ||
        data.contractedPackageIds.some((id: unknown) => typeof id !== 'string' || id.length > 128)) {
      throw new functions.https.HttpsError('invalid-argument', 'Service assignments are invalid.');
    }
    updates.contractedPackageIds = [...new Set(data.contractedPackageIds)];
  }
  if (Object.keys(updates).length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'No supported workspace updates were provided.');
  }
  const workspaceRef = db.collection('workspaces').doc(workspaceId);
  const now = new Date().toISOString();
  const batch = db.batch();
  batch.update(workspaceRef, { ...updates, updatedAt: now });
  batch.create(db.collection('adminAuditLogs').doc(), {
    actorUid: context.auth.uid,
    actorName: context.auth.token.name || context.auth.uid,
    action: 'update_workspace',
    target: workspaceId,
    targetUid: (await workspaceRef.get()).get('ownerId') || '',
    details: JSON.stringify(updates),
    createdAt: now,
  });
  await batch.commit();
  return { success: true };
});

export const adminListPlatformRoles = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  if (!(await db.collection('admins').doc(context.auth.uid).get()).exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  }
  const admins = await db.collection('admins').get();
  return {
    admins: admins.docs.map(adminDoc => ({
      uid: adminDoc.id,
      role: adminDoc.get('role') || 'Platform Admin',
      grantedAt: adminDoc.get('grantedAt') || '',
    })),
  };
});

export const adminSaveServicePackage = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  if (!(await db.collection('admins').doc(context.auth.uid).get()).exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  }
  const serviceId = requireText(data?.id, 'Service ID', 128);
  if (!/^[a-zA-Z0-9_-]+$/.test(serviceId)) {
    throw new functions.https.HttpsError('invalid-argument', 'Service ID is invalid.');
  }
  const name = requireText(data?.name, 'Service name', 120);
  const description = typeof data?.description === 'string' ? data.description.trim().slice(0, 2000) : '';
  const categories = [
    'Music Release Promotion', 'Cover Artwork & Visuals', 'Motion Design & Video',
    'Brand Identity System', 'Business & Corporate Creative', 'Executive Creative Retainer',
  ];
  if (!categories.includes(data?.category)) throw new functions.https.HttpsError('invalid-argument', 'Service category is invalid.');
  if (!['Essential', 'Professional', 'Flagship / Custom'].includes(data?.tier)) {
    throw new functions.https.HttpsError('invalid-argument', 'Service tier is invalid.');
  }
  if (!['One-Time', 'Per-Release', 'Monthly Retainer'].includes(data?.billingType)) {
    throw new functions.https.HttpsError('invalid-argument', 'Billing type is invalid.');
  }
  if (!['Artist', 'Brand', 'Both'].includes(data?.targetAudience)) {
    throw new functions.https.HttpsError('invalid-argument', 'Service audience is invalid.');
  }
  const priceUsd = data?.priceUsd;
  const revisionLimit = data?.revisionLimit;
  const turnaroundDays = data?.turnaroundDays;
  if (typeof priceUsd !== 'number' || !Number.isFinite(priceUsd) || priceUsd < 0 || priceUsd > 10000000 ||
      typeof revisionLimit !== 'number' || !Number.isInteger(revisionLimit) || revisionLimit < -1 || revisionLimit > 100 ||
      typeof turnaroundDays !== 'number' || !Number.isInteger(turnaroundDays) || turnaroundDays < 1 || turnaroundDays > 365) {
    throw new functions.https.HttpsError('invalid-argument', 'Price, revision limit or turnaround is invalid.');
  }
  if (!Array.isArray(data?.deliverables) || data.deliverables.length > 50 ||
      data.deliverables.some((item: unknown) => typeof item !== 'string' || item.trim().length > 200)) {
    throw new functions.https.HttpsError('invalid-argument', 'Service deliverables are invalid.');
  }
  if (typeof data?.isActive !== 'boolean') throw new functions.https.HttpsError('invalid-argument', 'Service status is invalid.');
  const serviceRef = db.collection('services').doc(serviceId);
  const existing = await serviceRef.get();
  const now = new Date().toISOString();
  const service = {
    id: serviceId,
    name,
    category: data.category,
    tier: data.tier,
    description,
    deliverables: data.deliverables.map((item: string) => item.trim()).filter(Boolean),
    priceUsd,
    billingType: data.billingType,
    revisionLimit,
    turnaroundDays,
    targetAudience: data.targetAudience,
    isActive: data.isActive,
    createdAt: existing.get('createdAt') || now,
    updatedAt: now,
  };
  const batch = db.batch();
  batch.set(serviceRef, service);
  batch.create(db.collection('adminAuditLogs').doc(), {
    actorUid: context.auth.uid,
    actorName: context.auth.token.name || context.auth.uid,
    action: existing.exists ? 'update_service_package' : 'create_service_package',
    target: serviceId,
    details: JSON.stringify({ name, category: data.category, isActive: data.isActive }),
    createdAt: now,
  });
  await batch.commit();
  return { success: true };
});

export const adminSetServicePackageActive = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  if (!(await db.collection('admins').doc(context.auth.uid).get()).exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  }
  const serviceId = requireText(data?.id, 'Service ID', 128);
  if (typeof data?.isActive !== 'boolean') throw new functions.https.HttpsError('invalid-argument', 'Service status is invalid.');
  const serviceRef = db.collection('services').doc(serviceId);
  const existing = await serviceRef.get();
  if (!existing.exists) throw new functions.https.HttpsError('not-found', 'Service package not found.');
  const now = new Date().toISOString();
  const batch = db.batch();
  batch.update(serviceRef, { isActive: data.isActive, updatedAt: now });
  batch.create(db.collection('adminAuditLogs').doc(), {
    actorUid: context.auth.uid,
    actorName: context.auth.token.name || context.auth.uid,
    action: data.isActive ? 'activate_service_package' : 'deactivate_service_package',
    target: serviceId,
    details: JSON.stringify({ name: existing.get('name') || serviceId }),
    createdAt: now,
  });
  await batch.commit();
  return { success: true };
});

export const adminDeleteServicePackage = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  if (!(await db.collection('admins').doc(context.auth.uid).get()).exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  }
  const serviceId = requireText(data?.id, 'Service ID', 128);
  const serviceRef = db.collection('services').doc(serviceId);
  const existing = await serviceRef.get();
  if (!existing.exists) throw new functions.https.HttpsError('not-found', 'Service package not found.');
  const assignments = await db.collection('workspaces')
    .where('contractedPackageIds', 'array-contains', serviceId)
    .limit(1)
    .get();
  if (!assignments.empty) {
    throw new functions.https.HttpsError('failed-precondition', 'This service package is assigned to a workspace. Deactivate it instead to preserve service history.');
  }
  const batch = db.batch();
  batch.delete(serviceRef);
  batch.create(db.collection('adminAuditLogs').doc(), {
    actorUid: context.auth.uid,
    actorName: context.auth.token.name || context.auth.uid,
    action: 'delete_service_package',
    target: serviceId,
    details: JSON.stringify({ name: existing.get('name') || serviceId }),
    createdAt: new Date().toISOString(),
  });
  await batch.commit();
  return { success: true };
});

export const adminUpdatePlatformRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  const actorRef = db.collection('admins').doc(context.auth.uid);
  if (!(await actorRef.get()).exists) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  const targetUid = requireText(data?.targetUid, 'Target user UID', 128);
  const action = data?.action;
  if (!['grant', 'revoke'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'Role action must be grant or revoke.');
  }
  if (action === 'revoke' && targetUid === context.auth.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot remove your own administrator access.');
  }
  try {
    await admin.auth().getUser(targetUid);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'The target Firebase Auth account does not exist.');
    }
    throw error;
  }
  const targetRef = db.collection('admins').doc(targetUid);
  const now = new Date().toISOString();
  await db.runTransaction(async transaction => {
    const [actor, target, adminRecords] = await Promise.all([
      transaction.get(actorRef),
      transaction.get(targetRef),
      transaction.get(db.collection('admins')),
    ]);
    if (!actor.exists) throw new functions.https.HttpsError('permission-denied', 'Admin access changed; sign in again.');
    if (action === 'revoke' && !target.exists) {
      throw new functions.https.HttpsError('not-found', 'The target user is not an administrator.');
    }
    if (action === 'revoke' && adminRecords.size <= 1) {
      throw new functions.https.HttpsError('failed-precondition', 'The last platform administrator cannot be removed.');
    }
    if (action === 'grant') {
      transaction.set(targetRef, {
        uid: targetUid,
        role: 'Platform Admin',
        grantedBy: context.auth!.uid,
        grantedAt: now,
      }, { merge: true });
    } else {
      transaction.delete(targetRef);
    }
    transaction.create(db.collection('adminAuditLogs').doc(), {
      actorUid: context.auth!.uid,
      actorName: context.auth!.token.name || context.auth!.uid,
      action: `platform_admin_${action}`,
      targetUid,
      details: JSON.stringify({ action }),
      createdAt: now,
    });
  });
  return { success: true };
});

function requireText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    throw new functions.https.HttpsError('invalid-argument', `${label} is required and must be ${maxLength} characters or fewer.`);
  }
  return value.trim();
}

async function findClientProfileByEmail(email: string) {
  let user: admin.auth.UserRecord;
  try {
    user = await admin.auth().getUserByEmail(email.trim().toLowerCase());
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No client account exists for this email. Ask the client to register and complete onboarding first.',
      );
    }
    throw error;
  }
  const profile = await db.collection('clientProfiles').doc(user.uid).get();
  if (!profile.exists || String(profile.get('email') || '').toLowerCase() !== user.email?.toLowerCase()) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The client account profile is missing or its email does not match. Resolve the profile before continuing.',
    );
  }
  return profile;
}

function optionalDate(value: unknown, label: string): string {
  if (value === undefined || value === null || value === '') return '';
  const date = requireText(value, label, 10);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new functions.https.HttpsError('invalid-argument', `${label} must be a valid calendar date in YYYY-MM-DD format.`);
  }
  return date;
}

async function getOwnedPublishedDeliverable(projectId: string, deliverableId: string, uid: string) {
  const profile = await db.collection('clientProfiles').doc(uid).get();
  if (!profile.exists || profile.get('onboardingComplete') !== true || profile.get('status') === 'Suspended') {
    throw new functions.https.HttpsError('permission-denied', 'An active client profile is required for this action.');
  }
  const projectRef = db.collection('clientProjects').doc(projectId);
  const deliverableRef = projectRef.collection('deliverables').doc(deliverableId);
  const [projectSnap, deliverableSnap] = await Promise.all([projectRef.get(), deliverableRef.get()]);
  if (!projectSnap.exists || projectSnap.get('clientUid') !== uid) {
    throw new functions.https.HttpsError('permission-denied', 'This project is not assigned to your account.');
  }
  const workspaceId = projectSnap.get('workspaceId') || profile.get('workspaceId');
  if (typeof workspaceId !== 'string') {
    throw new functions.https.HttpsError('permission-denied', 'A client workspace is required for this action.');
  }
  const workspace = await db.collection('workspaces').doc(workspaceId).get();
  if (!workspace.exists || workspace.get('ownerId') !== uid || !['Active', 'Onboarding'].includes(workspace.get('status') || 'Active')) {
    throw new functions.https.HttpsError('permission-denied', 'This workspace is not available to your account.');
  }
  if (!deliverableSnap.exists || deliverableSnap.get('clientUid') !== uid || deliverableSnap.get('isClientPublished') !== true) {
    throw new functions.https.HttpsError('not-found', 'Published deliverable not found.');
  }
  return { projectRef, projectSnap, deliverableRef, deliverableSnap };
}

export const submitProductionRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in before submitting a production request.');
  }

  const uid = context.auth.uid;
  const profile = await db.collection('clientProfiles').doc(uid).get();
  if (!profile.exists || profile.get('onboardingComplete') !== true || profile.get('status') === 'Suspended') {
    throw new functions.https.HttpsError('failed-precondition', 'Complete your client profile before submitting a production request.');
  }
  const workspaceId = requireText(data?.workspaceId, 'Workspace ID', 128);
  if (!/^[a-zA-Z0-9_-]+$/.test(workspaceId)) {
    throw new functions.https.HttpsError('invalid-argument', 'Workspace ID is invalid.');
  }
  const workspace = await db.collection('workspaces').doc(workspaceId).get();
  if (!workspace.exists || workspace.get('ownerId') !== uid || !['Active', 'Onboarding'].includes(workspace.get('status') || 'Active')) {
    throw new functions.https.HttpsError('permission-denied', 'This workspace is not available to your account.');
  }
  const title = requireText(data?.title, 'Project title', 160);
  const description = requireText(data?.description, 'Project brief', 5000);
  const dueDate = optionalDate(data?.dueDate, 'Expected delivery date');
  const attachments: unknown = data?.attachments === undefined ? [] : data.attachments;
  if (!Array.isArray(attachments) || attachments.length > 5) {
    throw new functions.https.HttpsError('invalid-argument', 'Attach no more than five files.');
  }
  const requestAttachments = attachments.map((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new functions.https.HttpsError('invalid-argument', 'An attached file is invalid.');
    }
    const attachment = value as Record<string, unknown>;
    const fileName = requireText(attachment.fileName, 'Attachment file name', 120);
    const storagePath = requireText(attachment.storagePath, 'Attachment storage path', 500);
    const fileType = requireText(attachment.fileType, 'Attachment file type', 120);
    const fileSize = attachment.fileSize;
    if (!workspaceId || !storagePath.startsWith(`workspaces/${workspaceId}/requests/${uid}/`) ||
        storagePath.includes('..') || typeof fileSize !== 'number' || !Number.isInteger(fileSize) ||
        fileSize <= 0 || fileSize >= 50 * 1024 * 1024) {
      throw new functions.https.HttpsError('invalid-argument', 'An attached file is invalid or does not belong to this workspace.');
    }
    return { fileName, storagePath, fileType, fileSize };
  });
  if (requestAttachments.reduce((total: number, item: { fileSize: number }) => total + item.fileSize, 0) > 100 * 1024 * 1024) {
    throw new functions.https.HttpsError('invalid-argument', 'Request attachments cannot exceed 100 MB combined.');
  }
  const now = new Date().toISOString();
  const projectRef = db.collection('clientProjects').doc();

  const batch = db.batch();
  batch.create(projectRef, {
    id: projectRef.id,
    clientUid: uid,
    workspaceId,
    title,
    description,
    category: requireText(data?.category, 'Project category', 80),
    status: 'Pending',
    stage: 'New Request',
    priority: ['Low', 'Normal', 'High', 'Urgent'].includes(data?.priority) ? data.priority : 'Normal',
    progress: 0,
    startDate: now.slice(0, 10),
    expectedDeliveryDate: dueDate,
    requestStatus: 'Pending',
    requestAttachments,
    ...(requestAttachments.length > 0
      ? { requestAttachmentsOwnerUid: uid, requestAttachmentsWorkspaceId: workspaceId }
      : {}),
    requestHistory: [{
      authorUid: uid,
      authorName: context.auth.token.name || 'Client',
      authorRole: 'Client',
      message: description,
      createdAt: now,
    }],
    createdAt: now,
    updatedAt: now,
  });

  const activityRef = projectRef.collection('activity').doc();
  batch.create(activityRef, {
    projectId: projectRef.id,
    actorUid: uid,
    actorName: context.auth.token.name || 'Client',
    action: 'Production request submitted',
    details: 'Your request was sent to the production team.',
    clientVisible: true,
    createdAt: now,
  });
  await batch.commit();

  return { success: true, projectId: projectRef.id };
});

export const reviewProductionRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  const adminSnap = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminSnap.exists) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  const projectId = requireText(data?.projectId, 'Project ID', 150);
  const status = data?.status;
  if (!['Accepted', 'Rejected', 'Clarification Requested'].includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', 'Request status is invalid.');
  }
  const message = status === 'Accepted'
    ? (typeof data?.message === 'string' ? data.message.trim().slice(0, 5000) : '')
    : requireText(data?.message, 'A response message', 5000);
  const projectRef = db.collection('clientProjects').doc(projectId);
  const activityRef = projectRef.collection('activity').doc();
  const now = new Date().toISOString();
  let projectTitle = '';
  let clientUid = '';
  await db.runTransaction(async transaction => {
    const project = await transaction.get(projectRef);
    if (!project.exists) throw new functions.https.HttpsError('not-found', 'Production request not found.');
    const currentStatus = project.get('requestStatus') || (project.get('stage') === 'New Request' ? 'Pending' : 'Accepted');
    if (!['Pending', 'Clarification Requested'].includes(currentStatus)) {
      throw new functions.https.HttpsError('failed-precondition', 'This request has already been reviewed.');
    }
    projectTitle = project.get('title') || 'Production request';
    clientUid = project.get('clientUid');
    const history = (project.get('requestHistory') || []) as ClientProjectHistoryEntry[];
    const updatedHistory = [...history, {
      authorUid: context.auth!.uid,
      authorName: context.auth!.token.name || 'KeedoHub team',
      authorRole: 'Admin',
      message: message || 'Your request has been accepted and production planning can begin.',
      createdAt: now,
    } satisfies ClientProjectHistoryEntry].slice(-100);
    transaction.update(projectRef, {
      requestStatus: status,
      adminMessage: message,
      requestHistory: updatedHistory,
      ...(status === 'Accepted'
        ? { stage: 'Brief Approved', status: 'Confirmed' }
        : status === 'Rejected'
          ? { status: 'On Hold' }
          : {}),
      updatedAt: now,
    });
    transaction.create(activityRef, {
      projectId,
      actorUid: context.auth!.uid,
      actorName: context.auth!.token.name || 'KeedoHub team',
      action: `Request ${status.toLowerCase()}`,
      details: message || 'Your request has been accepted and production planning can begin.',
      clientVisible: true,
      createdAt: now,
    });
    transaction.create(db.collection('adminAuditLogs').doc(), {
      actorUid: context.auth!.uid,
      actorName: context.auth!.token.name || context.auth!.uid,
      action: `production_request_${status.toLowerCase().replace(/ /g, '_')}`,
      target: projectId,
      targetUid: clientUid,
      details: JSON.stringify({ title: projectTitle, message }),
      createdAt: now,
    });
  });
  await notifyUser(
    clientUid,
    `request_review_${projectId}_${status.replace(/ /g, '_')}_${Date.now()}`,
    status === 'Accepted' ? 'Production request accepted' : status === 'Rejected' ? 'Production request update' : 'More information requested',
    message || `${projectTitle} has been accepted for production planning.`,
    'request',
    projectId,
  );
  return { success: true };
});

export const replyToProductionRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  const projectId = requireText(data?.projectId, 'Project ID', 150);
  const message = requireText(data?.message, 'Reply', 3000);
  const uid = context.auth.uid;
  const projectRef = db.collection('clientProjects').doc(projectId);
  const now = new Date().toISOString();
  let projectTitle = '';
  await db.runTransaction(async transaction => {
    const project = await transaction.get(projectRef);
    if (!project.exists || project.get('clientUid') !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'This request is not assigned to your account.');
    }
    const profile = await transaction.get(db.collection('clientProfiles').doc(uid));
    if (!profile.exists || profile.get('status') === 'Suspended' || profile.get('onboardingComplete') !== true) {
      throw new functions.https.HttpsError('permission-denied', 'An active client profile is required.');
    }
    if (project.get('requestStatus') !== 'Clarification Requested') {
      throw new functions.https.HttpsError('failed-precondition', 'This request is not awaiting clarification.');
    }
    const workspaceId = project.get('workspaceId') || profile.get('workspaceId');
    if (typeof workspaceId !== 'string') {
      throw new functions.https.HttpsError('permission-denied', 'A client workspace is required for this action.');
    }
    const workspace = await transaction.get(db.collection('workspaces').doc(workspaceId));
    if (!workspace.exists || workspace.get('ownerId') !== uid || !['Active', 'Onboarding'].includes(workspace.get('status') || 'Active')) {
      throw new functions.https.HttpsError('permission-denied', 'This workspace is unavailable.');
    }
    projectTitle = project.get('title') || 'Production request';
    const history = (project.get('requestHistory') || []) as ClientProjectHistoryEntry[];
    transaction.update(projectRef, {
      requestStatus: 'Pending',
      adminMessage: '',
      requestHistory: [...history, {
        authorUid: uid,
        authorName: context.auth!.token.name || 'Client',
        authorRole: 'Client',
        message,
        createdAt: now,
      } satisfies ClientProjectHistoryEntry].slice(-100),
      updatedAt: now,
    });
    transaction.create(projectRef.collection('activity').doc(), {
      projectId,
      actorUid: uid,
      actorName: context.auth!.token.name || 'Client',
      action: 'Clarification provided',
      details: message,
      clientVisible: true,
      createdAt: now,
    });
  });
  await notifyAdmins(
    `request_reply_${projectId}_${Date.now()}`,
    'Client replied to a production request',
    `${projectTitle}: ${message}`,
    'request',
    projectId,
  );
  return { success: true };
});

export const requestProductionRevision = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in before requesting a revision.');
  }

  const projectId = requireText(data?.projectId, 'Project ID', 150);
  const deliverableId = requireText(data?.deliverableId, 'Deliverable ID', 150);
  const feedback = requireText(data?.feedback, 'Revision feedback', 5000);
  const uid = context.auth.uid;
  const { projectRef, deliverableRef, deliverableSnap } = await getOwnedPublishedDeliverable(projectId, deliverableId, uid);
  const currentStatus = deliverableSnap.get('reviewStatus');
  if (currentStatus !== 'Awaiting Review' && currentStatus !== 'Revised - Awaiting Review') {
    throw new functions.https.HttpsError('failed-precondition', 'This deliverable is not accepting revision requests.');
  }

  const now = new Date().toISOString();
  const revisionRef = projectRef.collection('revisionRequests').doc();
  const activityRef = projectRef.collection('activity').doc();
  await db.runTransaction(async (transaction) => {
    const freshProject = await transaction.get(projectRef);
    const freshDeliverable = await transaction.get(deliverableRef);
    if (!freshProject.exists || freshProject.get('clientUid') !== uid ||
        !freshDeliverable.exists || freshDeliverable.get('clientUid') !== uid ||
        freshDeliverable.get('isClientPublished') !== true ||
        !['Awaiting Review', 'Revised - Awaiting Review'].includes(freshDeliverable.get('reviewStatus'))) {
      throw new functions.https.HttpsError('failed-precondition', 'The project or deliverable changed; refresh and try again.');
    }

    transaction.create(revisionRef, {
      id: revisionRef.id,
      projectId,
      deliverableId,
      clientUid: uid,
      feedback,
      status: 'Submitted',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    transaction.update(deliverableRef, { reviewStatus: 'Revision Requested', updatedAt: now });
    transaction.update(projectRef, {
      stage: 'Revision Required',
      status: 'In Progress',
      updatedAt: now,
    });
    transaction.create(activityRef, {
      projectId,
      actorUid: uid,
      actorName: context.auth?.token.name || 'Client',
      action: 'Revision requested',
      details: `Revision requested for ${deliverableSnap.get('title') || 'a deliverable'}.`,
      clientVisible: true,
      createdAt: now,
    });
  });

  return { success: true, revisionId: revisionRef.id };
});

export const approveProductionDeliverable = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in before approving a deliverable.');
  }

  const projectId = requireText(data?.projectId, 'Project ID', 150);
  const deliverableId = requireText(data?.deliverableId, 'Deliverable ID', 150);
  const feedback = typeof data?.feedback === 'string' ? data.feedback.trim().slice(0, 5000) : '';
  const uid = context.auth.uid;
  const { projectRef, deliverableRef, deliverableSnap } = await getOwnedPublishedDeliverable(projectId, deliverableId, uid);
  const currentStatus = deliverableSnap.get('reviewStatus');
  if (currentStatus !== 'Awaiting Review' && currentStatus !== 'Revised - Awaiting Review') {
    throw new functions.https.HttpsError('failed-precondition', 'This deliverable is not awaiting approval.');
  }

  const now = new Date().toISOString();
  const activityRef = projectRef.collection('activity').doc();
  await db.runTransaction(async (transaction) => {
    const freshProject = await transaction.get(projectRef);
    const freshDeliverable = await transaction.get(deliverableRef);
    if (!freshProject.exists || freshProject.get('clientUid') !== uid ||
        !freshDeliverable.exists || freshDeliverable.get('clientUid') !== uid ||
        freshDeliverable.get('isClientPublished') !== true ||
        !['Awaiting Review', 'Revised - Awaiting Review'].includes(freshDeliverable.get('reviewStatus'))) {
      throw new functions.https.HttpsError('failed-precondition', 'The project or deliverable changed; refresh and try again.');
    }
    const publishedDeliverables = await transaction.get(
      projectRef.collection('deliverables').where('isClientPublished', '==', true)
    );
    const allPublishedDeliverablesApproved = publishedDeliverables.docs.every(deliverable =>
      deliverable.id === deliverableId || deliverable.get('reviewStatus') === 'Approved'
    );
    transaction.update(deliverableRef, {
      reviewStatus: 'Approved',
      feedback,
      approvedBy: uid,
      approvedAt: now,
      updatedAt: now,
    });
    transaction.update(projectRef, {
      ...(allPublishedDeliverablesApproved && freshProject.get('stage') !== 'Delivered'
        ? { stage: 'Ready for Delivery', status: 'In Progress' }
        : {}),
      updatedAt: now,
    });
    transaction.create(activityRef, {
      projectId,
      actorUid: uid,
      actorName: context.auth?.token.name || 'Client',
      action: 'Deliverable approved',
      details: `${deliverableSnap.get('title') || 'A deliverable'} was approved.`,
      clientVisible: true,
      createdAt: now,
    });
  });

  return { success: true };
});

export const rejectProductionDeliverable = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in before rejecting a deliverable.');
  }

  const projectId = requireText(data?.projectId, 'Project ID', 150);
  const deliverableId = requireText(data?.deliverableId, 'Deliverable ID', 150);
  const feedback = requireText(data?.feedback, 'Rejection feedback', 5000);
  const uid = context.auth.uid;
  const { projectRef, deliverableRef, deliverableSnap } = await getOwnedPublishedDeliverable(projectId, deliverableId, uid);
  if (!['Awaiting Review', 'Revised - Awaiting Review'].includes(deliverableSnap.get('reviewStatus'))) {
    throw new functions.https.HttpsError('failed-precondition', 'This deliverable is not awaiting review.');
  }

  const now = new Date().toISOString();
  const activityRef = projectRef.collection('activity').doc();
  await db.runTransaction(async transaction => {
    const [freshProject, freshDeliverable] = await Promise.all([
      transaction.get(projectRef),
      transaction.get(deliverableRef),
    ]);
    if (!freshProject.exists || freshProject.get('clientUid') !== uid ||
        !freshDeliverable.exists || freshDeliverable.get('clientUid') !== uid ||
        freshDeliverable.get('isClientPublished') !== true ||
        !['Awaiting Review', 'Revised - Awaiting Review'].includes(freshDeliverable.get('reviewStatus'))) {
      throw new functions.https.HttpsError('failed-precondition', 'The project or deliverable changed; refresh and try again.');
    }

    transaction.update(deliverableRef, {
      reviewStatus: 'Rejected',
      feedback,
      rejectedBy: uid,
      rejectedAt: now,
      updatedAt: now,
    });
    transaction.create(activityRef, {
      projectId,
      actorUid: uid,
      actorName: context.auth?.token.name || 'Client',
      action: 'Deliverable rejected',
      details: `${deliverableSnap.get('title') || 'A deliverable'} was rejected with feedback.`,
      clientVisible: true,
      createdAt: now,
    });
  });

  return { success: true };
});

export const productionProjectCreated = functions.firestore
  .document('clientProjects/{projectId}')
  .onCreate(async (snapshot, context) => {
    const project = snapshot.data();
    const projectId = context.params.projectId;
    await notifyUser(
      project.clientUid,
      `project_created_${projectId}`,
      'Production project created',
      `${project.title || 'Your project'} is now in the production workspace.`,
      'project',
      projectId,
    );
    if (project.stage === 'New Request' && project.status === 'Pending') {
      await notifyAdmins(`project_created_${projectId}`, 'New production project', `${project.title || 'A project'} was created.`, 'project', projectId);
    }
  });

export const productionProjectUpdated = functions.firestore
  .document('clientProjects/{projectId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.stage === after.stage) return;
    await notifyUser(
      after.clientUid,
      `project_stage_${context.params.projectId}_${change.after.updateTime!.toMillis()}`,
      'Project stage updated',
      `${after.title || 'Your project'} moved to ${after.stage || 'a new stage'}.`,
      'stage',
      context.params.projectId,
    );
  });

export const productionTaskCreated = functions.firestore
  .document('clientProjects/{projectId}/tasks/{taskId}')
  .onCreate(async (snapshot, context) => {
    const task = snapshot.data();
    const projectId = context.params.projectId;
    const taskId = context.params.taskId;
    if (task.clientVisible === true) {
      await notifyUser(task.clientUid, `task_created_${taskId}`, 'New project task', `${task.title || 'A task'} was added to your project.`, 'task', projectId, taskId);
    }
  });

export const productionTaskUpdated = functions.firestore
  .document('clientProjects/{projectId}/tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const projectId = context.params.projectId;
    const taskId = context.params.taskId;
    if (before.status !== 'Done' && after.status === 'Done') {
      const recipients = new Set<string>();
      if (after.clientVisible === true && typeof after.clientUid === 'string') recipients.add(after.clientUid);
      const details = await change.after.ref.collection('admin').doc('details').get();
      if (typeof details.get('assigneeUid') === 'string' && details.get('assigneeUid')) recipients.add(details.get('assigneeUid'));
      await Promise.all([...recipients].map(uid =>
        notifyUser(uid, `task_completed_${taskId}_${change.after.updateTime!.toMillis()}`, 'Task completed', `${after.title || 'A task'} was marked complete.`, 'task', projectId, taskId)
      ));
    }
  });

export const productionTaskAssignmentChanged = functions.firestore
  .document('clientProjects/{projectId}/tasks/{taskId}/admin/details')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;
    const beforeUid = change.before.exists ? change.before.get('assigneeUid') : '';
    const afterUid = change.after.get('assigneeUid');
    if (typeof afterUid !== 'string' || !afterUid || beforeUid === afterUid) return;
    const task = await change.after.ref.parent.parent?.get();
    const taskTitle = task?.get('title') || 'A production task';
    await notifyUser(
      afterUid,
      `task_assigned_${context.params.taskId}_${afterUid}_${change.after.updateTime!.toMillis()}`,
      'Production task assigned',
      `${taskTitle} was assigned to you.`,
      'assignment',
      context.params.projectId,
      context.params.taskId,
    );
  });

export const productionDeliverableCreated = functions.firestore
  .document('clientProjects/{projectId}/deliverables/{deliverableId}')
  .onCreate(async (snapshot, context) => {
    const deliverable = snapshot.data();
    if (deliverable.isClientPublished !== true) return;
    await notifyUser(
      deliverable.clientUid,
      `deliverable_published_${context.params.deliverableId}`,
      'Deliverable ready for review',
      `${deliverable.title || 'A deliverable'} is available in your workspace.`,
      'deliverable',
      context.params.projectId,
      context.params.deliverableId,
    );
  });

export const productionDeliverableUpdated = functions.firestore
  .document('clientProjects/{projectId}/deliverables/{deliverableId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const projectId = context.params.projectId;
    const deliverableId = context.params.deliverableId;
    if (before.isClientPublished !== true && after.isClientPublished === true) {
      await notifyUser(
        after.clientUid,
        `deliverable_published_${deliverableId}_${change.after.updateTime!.toMillis()}`,
        'Deliverable ready for review',
        `${after.title || 'A deliverable'} is available in your workspace.`,
        'deliverable',
        projectId,
        deliverableId,
      );
    }
    if (before.reviewStatus !== after.reviewStatus && ['Approved', 'Rejected'].includes(after.reviewStatus)) {
      const label = after.reviewStatus === 'Approved' ? 'approved' : 'rejected';
      await notifyAdmins(
        `deliverable_${label}_${deliverableId}_${change.after.updateTime!.toMillis()}`,
        `Deliverable ${label}`,
        `${after.title || 'A deliverable'} was ${label} by the client.`,
        'review',
        projectId,
        deliverableId,
      );
    }
  });

export const productionRevisionCreated = functions.firestore
  .document('clientProjects/{projectId}/revisionRequests/{revisionId}')
  .onCreate(async (snapshot, context) => {
    const revision = snapshot.data();
    await notifyAdmins(
      `revision_created_${context.params.revisionId}`,
      'Revision requested',
      revision.feedback || 'A client requested a deliverable revision.',
      'revision',
      context.params.projectId,
      revision.deliverableId,
    );
  });

export const productionRevisionUpdated = functions.firestore
  .document('clientProjects/{projectId}/revisionRequests/{revisionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status) return;
    await notifyUser(
      after.clientUid,
      `revision_status_${context.params.revisionId}_${change.after.updateTime!.toMillis()}`,
      'Revision status updated',
      `Your revision request is now ${after.status}.`,
      'revision',
      context.params.projectId,
      context.params.revisionId,
    );
  });

export const productionDeadlineReminders = functions.pubsub.schedule('every 24 hours').timeZone('Etc/UTC').onRun(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const [projects, admins] = await Promise.all([
    db.collection('clientProjects').where('expectedDeliveryDate', '<=', today).get(),
    db.collection('admins').get(),
  ]);
  const adminUids = admins.docs.map(item => item.id);
  const work: Promise<void>[] = [];
  for (const projectDoc of projects.docs) {
    const project = projectDoc.data();
    const projectId = projectDoc.id;
    const projectDue = typeof project.expectedDeliveryDate === 'string' ? project.expectedDeliveryDate : '';
    if (projectDue && projectDue <= today && !['Completed', 'Delivered'].includes(project.status) && project.stage !== 'Delivered') {
      const overdue = projectDue < today;
      const message = `${project.title || 'A project'} is ${overdue ? 'overdue' : 'due today'} (${projectDue}).`;
      work.push(notifyUser(project.clientUid, `deadline_project_${projectId}_${projectDue}`, overdue ? 'Project overdue' : 'Project due today', message, 'deadline', projectId, undefined, projectDue));
      work.push(...adminUids.map(uid => notifyUser(uid, `deadline_project_${projectId}_${projectDue}`, overdue ? 'Project overdue' : 'Project due today', message, 'deadline', projectId, undefined, projectDue)));
    }

    const tasks = await projectDoc.ref.collection('tasks').where('dueDate', '<=', today).get();
    for (const taskDoc of tasks.docs) {
      const task = taskDoc.data();
      const dueDate = typeof task.dueDate === 'string' ? task.dueDate : '';
      if (!dueDate || dueDate > today || task.status === 'Done') continue;
      const overdue = dueDate < today;
      const message = `${task.title || 'A production task'} is ${overdue ? 'overdue' : 'due today'} (${dueDate}).`;
      const recipients = new Set<string>(adminUids);
      if (task.clientVisible === true && typeof task.clientUid === 'string') recipients.add(task.clientUid);
      const details = await taskDoc.ref.collection('admin').doc('details').get();
      if (typeof details.get('assigneeUid') === 'string' && details.get('assigneeUid')) recipients.add(details.get('assigneeUid'));
      work.push(...[...recipients].map(uid =>
        notifyUser(uid, `deadline_task_${taskDoc.id}_${dueDate}`, overdue ? 'Task overdue' : 'Task due today', message, 'deadline', projectId, taskDoc.id, dueDate)
      ));
    }
  }
  await Promise.all(work);
  return null;
});
