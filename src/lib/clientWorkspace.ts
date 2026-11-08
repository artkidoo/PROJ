import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { ClientProfile, Workspace, WorkspaceType } from '../types';
import { db } from './firebase';

function workspaceTypeForAccount(accountType: ClientProfile['accountType']): WorkspaceType {
  if (accountType === 'Artist') return 'Artist';
  if (accountType === 'Brand') return 'Brand';
  return 'Business';
}

function workspaceIdForUser(uid: string): string {
  const suffix = Array.from(uid).reduce(
    (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  ).toString(36);
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 90);
  return `ws-${safeUid}-${suffix}`;
}

export function createClientWorkspaceData(
  uid: string,
  profile: ClientProfile,
  workspaceId: string,
): Workspace {
  const type = workspaceTypeForAccount(profile.accountType);
  const accentColor = type === 'Artist' ? '#D97706' : type === 'Brand' ? '#2563EB' : '#10B981';
  const now = new Date().toISOString();
  return {
    id: workspaceId,
    name: profile.organizationName,
    type,
    clientCategory: type === 'Business' ? 'business' : type.toLowerCase() as 'artist' | 'brand',
    ownerId: uid,
    status: 'Active',
    description: `${profile.organizationName} ${type} Workspace`,
    contactEmail: profile.email,
    brand: {
      name: profile.organizationName,
      primaryColor: accentColor,
      secondaryColor: '#0A0A0A',
      accentColor,
      typography: { displayFont: 'Plus Jakarta Sans', bodyFont: 'Plus Jakarta Sans' },
    },
    ...(type === 'Artist' ? {
      artistProfile: {
        biography: '',
        genre: '',
        profileImageUrl: profile.photoURL || '',
        instagram: '',
        spotify: '',
        appleMusic: '',
        youtube: '',
        website: '',
      },
    } : {
      brandProfile: {
        description: '',
        industry: '',
        website: '',
        logoUrl: profile.photoURL || '',
        brandVoice: '',
        photographyDirection: '',
        graphicDesignPrinciples: '',
        usageGuidelines: '',
        creativeReferences: '',
      },
    }),
    createdAt: now,
    updatedAt: now,
  };
}

export async function ensureClientWorkspace(uid: string): Promise<Workspace> {
  const profileRef = doc(db, 'clientProfiles', uid);
  const profileSnapshot = await getDoc(profileRef);
  if (!profileSnapshot.exists()) {
    throw new Error('Complete your client profile before opening a workspace.');
  }

  const profile = { uid, ...profileSnapshot.data() } as ClientProfile;
  if (profile.onboardingComplete !== true) {
    throw new Error('Complete your client profile before opening a workspace.');
  }
  if (profile.status === 'Suspended') {
    throw new Error('This account is suspended. Contact KeedoHub support for access.');
  }

  if (profile.workspaceId) {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(profile.workspaceId)) {
      throw new Error('The saved workspace reference is invalid. Contact KeedoHub support.');
    }
    const workspaceSnapshot = await getDoc(doc(db, 'workspaces', profile.workspaceId));
    if (!workspaceSnapshot.exists() || workspaceSnapshot.data().ownerId !== uid) {
      throw new Error('The saved workspace is unavailable to your account. Contact KeedoHub support.');
    }
    return { id: workspaceSnapshot.id, ...workspaceSnapshot.data() } as Workspace;
  }

  const workspaceId = workspaceIdForUser(uid);
  const workspace = createClientWorkspaceData(uid, profile, workspaceId);
  const batch = writeBatch(db);
  batch.set(doc(db, 'workspaces', workspaceId), workspace);
  batch.update(profileRef, {
    workspaceId,
    updatedAt: new Date().toISOString(),
  });
  await batch.commit();
  return workspace;
}
