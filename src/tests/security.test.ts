/**
 * Complete Security Rule & RBAC Assertion Test Suite for Keedohub Multi-Tenant Platform
 */

export interface TestUser {
  uid: string;
  email: string;
  isPlatformAdmin?: boolean;
}

export interface SecurityTestCase {
  id: string;
  name: string;
  user: TestUser | null;
  resource: 'STORAGE' | 'USER_PROFILE' | 'WORKSPACE_DATA' | 'MEMBERSHIP_MANAGEMENT';
  targetId: string; // workspaceId or targetUserId
  payloadUpdates?: Record<string, any>;
  expectedAccess: 'ALLOW' | 'DENY';
  reason: string;
}

export function evaluateSecurityRule(
  user: TestUser | null,
  resource: 'STORAGE' | 'USER_PROFILE' | 'WORKSPACE_DATA' | 'MEMBERSHIP_MANAGEMENT',
  targetId: string,
  payloadUpdates: Record<string, any> = {},
  memberships: Record<string, { uids: string[]; activeUids: string[] }>,
  owners: Record<string, string>
): 'ALLOW' | 'DENY' {
  if (!user) return 'DENY';

  // 1. User Profile Access Rules
  if (resource === 'USER_PROFILE') {
    // Attempting to modify privileged role or admin flags
    if (payloadUpdates.role || payloadUpdates.isAdmin || payloadUpdates.isPlatformAdmin) {
      return 'DENY';
    }
    // Only owner or platform admin can read/modify profile
    if (user.uid === targetId || user.isPlatformAdmin) {
      return 'ALLOW';
    }
    return 'DENY';
  }

  // 2. Membership Management Rules
  if (resource === 'MEMBERSHIP_MANAGEMENT') {
    // Only workspace owner or platform admin can alter workspace team roster
    const isOwner = owners[targetId] === user.uid || user.isPlatformAdmin;
    return isOwner ? 'ALLOW' : 'DENY';
  }

  // 3. Workspace Data & Storage Rules
  const isOwner = owners[targetId] === user.uid || user.isPlatformAdmin;
  const isTargetActiveMember = memberships[targetId]?.activeUids.includes(user.uid) || false;

  if (isOwner || isTargetActiveMember) {
    if (resource === 'STORAGE') {
      // Enforce 50MB max file size limit
      if (payloadUpdates.fileSize && payloadUpdates.fileSize > 50 * 1024 * 1024) {
        return 'DENY';
      }
      // Enforce MIME allowlist regex check
      if (payloadUpdates.contentType) {
        const allowedMimePattern = /^(image\/(jpeg|png|svg\+xml|webp|gif|avif)|audio\/(mpeg|wav|x-wav|aac|flac|mp4|m4a|ogg)|video\/(mp4|webm|quicktime)|application\/(pdf|json|xml|zip|x-zip-compressed|font-woff)|font\/(ttf|otf|woff|woff2)|text\/(plain|xml))$/;
        if (!allowedMimePattern.test(payloadUpdates.contentType)) {
          return 'DENY';
        }
      }
    }
    return 'ALLOW';
  }

  return 'DENY';
}

export const COMPLETE_SECURITY_CASES: SecurityTestCase[] = [
  {
    id: 'SEC-001',
    name: 'Unauthenticated user accessing private Cloud Storage files',
    user: null,
    resource: 'STORAGE',
    targetId: 'ws-agency-a',
    expectedAccess: 'DENY',
    reason: 'Unauthenticated requests must be rejected by storage security rules.'
  },
  {
    id: 'SEC-002',
    name: 'Workspace A member accessing Workspace A storage files',
    user: { uid: 'usr-member-a', email: 'membera@agency.com' },
    resource: 'STORAGE',
    targetId: 'ws-agency-a',
    payloadUpdates: { contentType: 'image/png', fileSize: 1024 * 1024 },
    expectedAccess: 'ALLOW',
    reason: 'Verified workspace member permitted to read/write workspace storage assets.'
  },
  {
    id: 'SEC-003',
    name: 'Workspace A member accessing Workspace B storage files',
    user: { uid: 'usr-member-a', email: 'membera@agency.com' },
    resource: 'STORAGE',
    targetId: 'ws-agency-b',
    expectedAccess: 'DENY',
    reason: 'Cross-tenant storage access strictly forbidden.'
  },
  {
    id: 'SEC-004',
    name: 'Workspace A member attempting to overwrite Workspace B storage files',
    user: { uid: 'usr-member-a', email: 'membera@agency.com' },
    resource: 'STORAGE',
    targetId: 'ws-agency-b',
    payloadUpdates: { action: 'OVERWRITE' },
    expectedAccess: 'DENY',
    reason: 'Unauthorized overwrite mutations across tenant boundaries rejected.'
  },
  {
    id: 'SEC-005',
    name: "Ordinary user reading another user's private profile (/users/{userId})",
    user: { uid: 'usr-member-a', email: 'membera@agency.com' },
    resource: 'USER_PROFILE',
    targetId: 'usr-member-b',
    expectedAccess: 'DENY',
    reason: 'User profile privacy rule prevents unauthorized reading of third-party user profiles.'
  },
  {
    id: 'SEC-006',
    name: 'User attempting to self-assign administrator status or modify role field',
    user: { uid: 'usr-member-a', email: 'membera@agency.com' },
    resource: 'USER_PROFILE',
    targetId: 'usr-member-a',
    payloadUpdates: { role: 'PlatformAdmin', isAdmin: true },
    expectedAccess: 'DENY',
    reason: 'Self-assignment of privileged roles or admin flags blocked by key diff rules.'
  },
  {
    id: 'SEC-007',
    name: 'Non-owner attempting to alter workspace membership or ownership',
    user: { uid: 'usr-member-a', email: 'membera@agency.com' },
    resource: 'MEMBERSHIP_MANAGEMENT',
    targetId: 'ws-agency-a',
    expectedAccess: 'DENY',
    reason: 'Membership management restricted exclusively to workspace owners or platform admins.'
  },
  {
    id: 'SEC-008',
    name: 'Authorized workspace owner performing permitted management operations',
    user: { uid: 'usr-agency-a-owner', email: 'owner@agency-a.com' },
    resource: 'MEMBERSHIP_MANAGEMENT',
    targetId: 'ws-agency-a',
    expectedAccess: 'ALLOW',
    reason: 'Workspace owner explicitly authorized to manage memberships and workspace configuration.'
  },
  {
    id: 'SEC-009',
    name: 'Authorized member accessing permitted workspace documents and assets',
    user: { uid: 'usr-member-a', email: 'membera@agency.com' },
    resource: 'WORKSPACE_DATA',
    targetId: 'ws-agency-a',
    expectedAccess: 'ALLOW',
    reason: 'Verified workspace member granted read/write access to assigned workspace entities.'
  },
  {
    id: 'SEC-010',
    name: 'Revoked or inactive member attempting to access workspace files',
    user: { uid: 'usr-revoked-member', email: 'revoked@agency.com' },
    resource: 'STORAGE',
    targetId: 'ws-agency-a',
    expectedAccess: 'DENY',
    reason: 'Revoked membership status (status != Active) explicitly revokes storage and document access.'
  },
  {
    id: 'SEC-011',
    name: 'Member attempting to upload executable or disallowed file type (.exe / .sh)',
    user: { uid: 'usr-member-a', email: 'membera@agency.com' },
    resource: 'STORAGE',
    targetId: 'ws-agency-a',
    payloadUpdates: { contentType: 'application/x-msdownload', fileSize: 1024 },
    expectedAccess: 'DENY',
    reason: 'Storage MIME allowlist rejects unauthorized executable or binary payloads.'
  }
];

export function runCompleteSecuritySuite(): { total: number; passed: number; failed: number } {
  const memberships: Record<string, { uids: string[]; activeUids: string[] }> = {
    'ws-agency-a': {
      uids: ['usr-member-a', 'usr-revoked-member'],
      activeUids: ['usr-member-a']
    },
    'ws-agency-b': {
      uids: ['usr-member-b'],
      activeUids: ['usr-member-b']
    },
    'ws-lyrical-ent': {
      uids: ['usr-lyrical-owner', 'usr-lyrical-staff'],
      activeUids: ['usr-lyrical-owner', 'usr-lyrical-staff']
    }
  };

  const owners: Record<string, string> = {
    'ws-agency-a': 'usr-agency-a-owner',
    'ws-agency-b': 'usr-agency-b-owner',
    'ws-lyrical-ent': 'usr-lyrical-owner'
  };

  let passed = 0;
  let failed = 0;

  for (const testCase of COMPLETE_SECURITY_CASES) {
    const result = evaluateSecurityRule(
      testCase.user,
      testCase.resource,
      testCase.targetId,
      testCase.payloadUpdates || {},
      memberships,
      owners
    );

    if (result === testCase.expectedAccess) {
      passed++;
    } else {
      failed++;
      console.error(`Security Rule Failure in [${testCase.id}] ${testCase.name}`);
    }
  }

  return { total: COMPLETE_SECURITY_CASES.length, passed, failed };
}
