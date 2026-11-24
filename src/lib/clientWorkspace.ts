import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { ClientProfile, Workspace } from '../types';
import { db } from './firebase';
import { normalizeAccountType, type CanonicalWorkspaceType } from './accountNormalization';
import { resolveClientProjectWorkspaceId } from './workspaceResolution';

export { resolveClientProjectWorkspaceId };

/** Error thrown when a legacy account has more than one owned workspace and must be reviewed by an administrator. */
export class MultipleLegacyWorkspacesError extends Error {
  constructor(message = 'Multiple legacy workspaces detected. Review required before access can be granted.') {
    super(message);
    this.name = 'MultipleLegacyWorkspacesError';
  }
}

function workspaceTypeForAccount(accountType: ClientProfile['accountType'] | string | undefined): CanonicalWorkspaceType {
  return normalizeAccountType(accountType);
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
  const accentColor = type === 'Artist' ? '#D97706' : '#2563EB';
  const now = new Date().toISOString();
  return {
    id: workspaceId,
    name: profile.organizationName,
    type,
    clientCategory: type === 'Artist' ? 'artist' : 'brand',
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

  // Run the entire resolution-and-creation inside a transaction so concurrent login,
  // onboarding and permission flows can never create duplicate workspaces.
  return runTransaction(db, async (transaction) => {
    const profileInTx = { uid, ...profileSnapshot.data() } as ClientProfile;

    if (profileInTx.onboardingComplete !== true) {
      throw new Error('Complete your client profile before opening a workspace.');
    }
    if (profileInTx.status === 'Suspended') {
      throw new Error('This account is suspended. Contact KeedoHub support for access.');
    }

    const candidates: Array<{
      id: string;
      data: Workspace;
      isValid: boolean;
    }> = [];

    const savedWorkspaceId = profileInTx.workspaceId;

    // 1. If a saved workspace reference exists and belongs to this account, reuse it.
    if (savedWorkspaceId) {
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(savedWorkspaceId)) {
        throw new Error('The saved workspace reference is invalid. Contact KeedoHub support.');
      }
      const savedSnap = await transaction.get(doc(db, 'workspaces', savedWorkspaceId));
      if (savedSnap.exists()) {
        const savedData = savedSnap.data() as Workspace;
        const isUsable =
          savedData.ownerId === uid &&
          ['Active', 'Onboarding'].includes(savedData.status || 'Active');
        candidates.push({ id: savedWorkspaceId, data: savedData, isValid: isUsable });
      }
    }

    // 2. Inspect the deterministic workspace for this uid.
    const deterministicId = workspaceIdForUser(uid);
    const deterministicSnap = await transaction.get(doc(db, 'workspaces', deterministicId));
    if (deterministicSnap.exists()) {
      const deterministicData = deterministicSnap.data() as Workspace;
      const isUsable =
        deterministicData.ownerId === uid &&
        ['Active', 'Onboarding'].includes(deterministicData.status || 'Active');
      candidates.push({ id: deterministicId, data: deterministicData, isValid: isUsable });
    }

    const valid = candidates.filter((c) => c.isValid);

    // Deduplicate candidates that resolve to the same workspace document.
    const seen = new Map<string, typeof valid[0]>();
    for (const candidate of valid) {
      if (!seen.has(candidate.id)) {
        seen.set(candidate.id, candidate);
      }
    }
    const uniqueValid = Array.from(seen.values());

    // 3. Idempotent: if any owned workspace is usable, return it without creation.
    if (uniqueValid.length === 1) {
      return { ...uniqueValid[0].data, id: uniqueValid[0].id } as Workspace;
    }

    // 4. Multiple distinct owned workspaces were found. Do NOT guess, merge or
    //    delete them. Flag the account for administrator review.
    if (uniqueValid.length > 1) {
      throw new MultipleLegacyWorkspacesError(
        'Account has more than one owned workspace. KeedoHub administrators must review and consolidate before access is granted.',
      );
    }

    // 5. No usable workspace found. Create a primary workspace and persist its ID
    //    to the profile atomically inside the same transaction.
    const type = workspaceTypeForAccount(profileInTx.accountType);
    const workspace = createClientWorkspaceData(uid, profileInTx, deterministicId);
    transaction.set(doc(db, 'workspaces', deterministicId), workspace);
    transaction.update(profileRef, {
      workspaceId: deterministicId,
      updatedAt: new Date().toISOString(),
    });

    return { ...workspace, id: deterministicId } as Workspace;
  });
}

