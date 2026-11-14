import React, { useState } from 'react';
import { ArrowRight, Briefcase, Disc3, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { validateEmailInput, validatePasswordInput } from '../../lib/firebaseAuth';
import { PublicFooter } from '../public/PublicFooter';
import { PublicHeader, PublicRoute } from '../public/PublicHeader';

interface RegisterPageProps {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const {
    isAuthenticated,
    authError,
    clearAuthError,
    registerWithEmail,
    loginWithGoogle,
    enterWorkspace,
    logout,
    firebaseUser,
  } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState<'Artist' | 'Brand'>('Artist');
  const [organizationName, setOrganizationName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    clearAuthError();

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length > 100) {
      setLocalError('Enter your full name (up to 100 characters).');
      return;
    }
    const emailIssue = validateEmailInput(email);
    if (emailIssue) {
      setLocalError(emailIssue);
      return;
    }
    const passwordIssue = validatePasswordInput(password);
    if (passwordIssue) {
      setLocalError(passwordIssue);
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Password and confirmation do not match.');
      return;
    }
    if (organizationName.trim().length > 100) {
      setLocalError('Workspace name must be 100 characters or fewer.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail({
        fullName: trimmedName,
        email: email.trim(),
        password,
        accountType,
        organizationName: organizationName.trim() || undefined,
      });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Account registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLocalError(null);
    clearAuthError();
    if (fullName.trim().length > 100) {
      setLocalError('Full name must be 100 characters or fewer.');
      return;
    }
    if (organizationName.trim().length > 100) {
      setLocalError('Workspace name must be 100 characters or fewer.');
      return;
    }
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle({
        intent: 'register',
        accountType,
        organizationName: organizationName.trim() || undefined,
        fullName: fullName.trim() || undefined,
      });
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#F3F3F3] antialiased">
      <PublicHeader current="register" navigate={navigate} />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-4 py-12 sm:px-8 sm:py-16">
        <div className="w-full max-w-2xl border border-[#242424] bg-[#0C0C0C] p-6 sm:p-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF1E1E]">
            Create Client Account
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
            Start Your KeedoHub Workspace
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Select your primary workspace experience below. You can manage additional Artist or Brand spaces inside your unified workspace later.
          </p>

          {isAuthenticated ? (
            <div className="mt-6 space-y-4 border border-[#292929] bg-[#121212] p-5">
              <p className="text-sm text-neutral-200">
                You are currently signed in as <strong className="text-white">{firebaseUser?.email || firebaseUser?.displayName}</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => enterWorkspace()}
                  className="inline-flex items-center gap-2 bg-[#FF1E1E] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E01818]"
                >
                  <span>Open Workspace</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="border border-[#333] px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:border-white hover:text-white"
                >
                  Sign out to create another account
                </button>
              </div>
            </div>
          ) : (
            <>
              {displayedError && (
                <div
                  role="alert"
                  className="mt-5 border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-200"
                >
                  {displayedError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="register-full-name" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      Full Name *
                    </label>
                    <input
                      id="register-full-name"
                      type="text"
                      autoComplete="name"
                      maxLength={100}
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="register-email" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      Email Address *
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                    Workspace Experience *
                  </span>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      aria-pressed={accountType === 'Artist'}
                      onClick={() => setAccountType('Artist')}
                      className={`flex items-start gap-3 border p-4 text-left transition-colors ${
                        accountType === 'Artist'
                          ? 'border-[#FF1E1E] bg-[#FF1E1E]/10 text-white'
                          : 'border-[#262626] bg-[#121212] text-neutral-400 hover:border-[#444] hover:text-white'
                      }`}
                    >
                      <Disc3 size={18} className="mt-0.5 shrink-0 text-[#FF1E1E]" />
                      <span>
                        <span className="block text-sm font-bold">Artist</span>
                        <span className="mt-1 block text-xs text-neutral-400">
                          Artist OS for releases, press kits, content engine, and assets.
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-pressed={accountType === 'Brand'}
                      onClick={() => setAccountType('Brand')}
                      className={`flex items-start gap-3 border p-4 text-left transition-colors ${
                        accountType === 'Brand'
                          ? 'border-[#FF1E1E] bg-[#FF1E1E]/10 text-white'
                          : 'border-[#262626] bg-[#121212] text-neutral-400 hover:border-[#444] hover:text-white'
                      }`}
                    >
                      <Briefcase size={18} className="mt-0.5 shrink-0 text-[#FF1E1E]" />
                      <span>
                        <span className="block text-sm font-bold">Brand</span>
                        <span className="mt-1 block text-xs text-neutral-400">
                          Brand OS for identity systems, creative campaigns, and documents.
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-org-name" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                    {accountType === 'Artist' ? 'Artist / Stage Name (Optional)' : 'Brand / Studio Name (Optional)'}
                  </label>
                  <input
                    id="register-org-name"
                    type="text"
                    maxLength={100}
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder={accountType === 'Artist' ? 'Defaults to your full name if left blank' : 'Defaults to your full name if left blank'}
                    className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="register-password" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      Password *
                    </label>
                    <input
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="register-confirm-password" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      Confirm Password *
                    </label>
                    <input
                      id="register-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || googleSubmitting}
                  className="flex w-full items-center justify-center gap-2 bg-[#FF1E1E] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E01818] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  <span>{submitting ? 'Creating Account & Workspace…' : 'Create Client Account'}</span>
                </button>
              </form>

              <div className="my-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                <span className="h-px flex-1 bg-[#222]" />
                <span>Or continue with</span>
                <span className="h-px flex-1 bg-[#222]" />
              </div>

              <button
                type="button"
                disabled={submitting || googleSubmitting}
                onClick={() => void handleGoogleRegister()}
                className="flex w-full items-center justify-center gap-2 border border-[#333] bg-[#121212] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{googleSubmitting ? 'Connecting to Google…' : 'Continue with Google'}</span>
              </button>
            </>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1E1E1E] pt-5 text-xs text-neutral-400">
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('login')}
                className="font-semibold text-white hover:text-[#FF1E1E]"
              >
                Sign in
              </button>
            </span>
            <button
              type="button"
              onClick={() => navigate('contact')}
              className="text-neutral-400 hover:text-white"
            >
              Need studio onboarding help?
            </button>
          </div>
        </div>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
};

export default RegisterPage;
