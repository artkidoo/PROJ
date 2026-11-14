import type { DocumentSnapshot } from 'firebase/firestore';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmailInput(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter your email address.';
  if (trimmed.length > 254 || !EMAIL_PATTERN.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePasswordInput(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  return null;
}

export function isAdminRecordActive(snapshot: DocumentSnapshot): boolean {
  if (!snapshot.exists()) return false;
  const data = snapshot.data() || {};
  const status = typeof data.status === 'string' ? data.status.trim().toLowerCase() : '';
  if (status === 'suspended' || status === 'revoked' || status === 'inactive' || status === 'disabled') {
    return false;
  }
  if (data.revoked === true || data.suspended === true || data.active === false) {
    return false;
  }
  return true;
}

export function friendlyFirebaseAuthError(error: unknown, fallback = 'Authentication failed. Please try again.'): string {
  if (!error || typeof error !== 'object') {
    return typeof error === 'string' && error.trim() ? error : fallback;
  }

  const code = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Sign in or reset your password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Choose a stronger password (at least 8 characters).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact KeedoHub support for assistance.';
    case 'auth/too-many-requests':
      return 'Too many authentication attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error while reaching authentication services. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled on this authentication project.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow pop-ups for this site and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using another sign-in method.';
    default: {
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return fallback;
    }
  }
}
