import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Info,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { validateEmailInput } from '../../lib/firebaseAuth';
import { PublicFooter } from '../public/PublicFooter';
import { PublicHeader, PublicRoute } from '../public/PublicHeader';

interface AdminLoginPageProps {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  navigate,
}) => {
  const {
    isAuthenticated,
    canAccessAdminCenter,
    authError,
    clearAuthError,
    loginAdminWithEmail,
    loginWithGoogle,
    sendPasswordReset,
    setAppMode,
    logout,
    firebaseUser,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [displayedError, setDisplayedError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Password reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDisplayedError(null);
    clearAuthError();

    const emailIssue = validateEmailInput(email);
    if (emailIssue) {
      setDisplayedError(emailIssue);
      return;
    }
    if (!password) {
      setDisplayedError('Enter your administrator password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginAdminWithEmail(email, password);
    } catch (error) {
      setDisplayedError(
        error instanceof Error
          ? error.message
          : 'Administrator sign-in failed. Please verify your credentials.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setDisplayedError(null);
    clearAuthError();
    setGoogleSubmitting(true);

    try {
      await loginWithGoogle({ intent: 'login' });
    } catch (error) {
      setDisplayedError(
        error instanceof Error
          ? error.message
          : 'Google sign-in failed. Please try again.',
      );
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDisplayedError(null);
    setResetSuccess(null);
    clearAuthError();

    const targetEmail = resetEmail.trim() || email.trim();
    const emailIssue = validateEmailInput(targetEmail);
    if (emailIssue) {
      setDisplayedError(emailIssue);
      return;
    }

    setResetSubmitting(true);
    try {
      await sendPasswordReset(targetEmail);
      setResetSuccess(
        `If an administrator account is registered under ${targetEmail}, a password recovery email has been dispatched. Please check your inbox.`,
      );
    } catch (error) {
      setDisplayedError(
        error instanceof Error
          ? error.message
          : 'Could not send password reset email. Please try again.',
      );
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleCopyDomain = () => {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      navigator.clipboard.writeText(window.location.hostname).catch(() => {});
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const errorMessage = displayedError || authError;
  const currentHostname =
    typeof window !== 'undefined' && window.location ? window.location.hostname : '';
  const isUnauthorizedDomain =
    typeof errorMessage === 'string' &&
    (errorMessage.toLowerCase().includes('not authorized for google sign-in') ||
      errorMessage.toLowerCase().includes('unauthorized-domain'));

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#F3F3F3] antialiased">
      <PublicHeader current="admin-login" navigate={navigate} />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-4 py-12 sm:px-8 sm:py-20">
        <section className="w-full max-w-lg border border-[#2C2C2C] bg-[#0C0C0C] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF1E1E]">
            <ShieldAlert size={16} />
            <span>Private Platform Operations</span>
          </div>

          <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
            KeedoHub Admin HQ
          </h1>

          <p className="mt-2 text-xs leading-6 text-neutral-400">
            Authorized platform operators only. Access requires an active,
            server-verified administrator account. Public registration is
            disabled.
          </p>

          {isAuthenticated ? (
            <div className="mt-6 space-y-4 border border-[#292929] bg-[#121212] p-5">
              {canAccessAdminCenter ? (
                <>
                  <p className="text-xs leading-6 text-neutral-200">
                    Verified administrator session active for{' '}
                    <strong className="text-white">
                      {firebaseUser?.email}
                    </strong>.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setAppMode('workspace')}
                      className="inline-flex items-center gap-2 bg-[#FF1E1E] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#E01818]"
                    >
                      <span>Enter Admin HQ</span>
                      <ArrowRight size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="border border-[#333] px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:border-white hover:text-white"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 text-xs text-red-200">
                    <ShieldAlert
                      size={16}
                      className="mt-0.5 shrink-0 text-[#FF1E1E]"
                    />
                    <p>
                      You are signed in as{' '}
                      <strong className="text-white">
                        {firebaseUser?.email || 'a client user'}
                      </strong>
                      , but this account does not have active Admin HQ
                      privileges.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setAppMode('client')}
                      className="border border-[#333] bg-[#161616] px-4 py-2 text-xs font-semibold text-white hover:border-white"
                    >
                      Open Client Workspace
                    </button>

                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="border border-[#FF1E1E]/40 px-4 py-2 text-xs font-semibold text-red-200 hover:border-[#FF1E1E] hover:text-white"
                    >
                      Sign out to switch account
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {errorMessage && (
                <div
                  role="alert"
                  className="mt-5 space-y-3 border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-200"
                >
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={16} className="mt-0.5 shrink-0 text-[#FF1E1E]" />
                    <p className="leading-5">{errorMessage}</p>
                  </div>

                  {isUnauthorizedDomain && currentHostname && (
                    <div className="border-t border-red-500/20 pt-3 text-[11px] leading-5 text-neutral-300">
                      <div className="flex items-center justify-between gap-2 rounded bg-black/40 p-2 font-mono text-[10px] text-white">
                        <span className="truncate">{currentHostname}</span>
                        <button
                          type="button"
                          onClick={handleCopyDomain}
                          className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-[#FF1E1E] hover:text-white"
                        >
                          {copiedDomain ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedDomain ? 'Copied' : 'Copy Domain'}</span>
                        </button>
                      </div>
                      <p className="mt-2 text-neutral-400">
                        <strong className="text-white">Workaround:</strong> Use the Email &amp; Password form below to sign in immediately without domain authorization.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Password Reset Form Mode */}
              {isResetMode ? (
                <form onSubmit={handleResetSubmit} className="mt-6 space-y-4" noValidate>
                  <div className="border border-[#1E1E1E] bg-[#101010] p-4 text-xs text-neutral-300">
                    <p className="font-semibold text-white">Administrator Password Recovery</p>
                    <p className="mt-1 text-neutral-400">
                      Enter your authorized administrator email address. A password recovery link will be dispatched through Firebase Authentication.
                    </p>
                  </div>

                  {resetSuccess && (
                    <div
                      role="status"
                      className="border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex items-start gap-2"
                    >
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span>{resetSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="admin-reset-email"
                      className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-400"
                    >
                      <span>Administrator Email</span>
                      <Mail size={12} className="text-neutral-500" />
                    </label>
                    <input
                      id="admin-reset-email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="admin@keedohub.com"
                      className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={resetSubmitting}
                      className="flex w-full items-center justify-center gap-2 bg-[#FF1E1E] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E01818] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resetSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <KeyRound size={16} />
                      )}
                      <span>{resetSubmitting ? 'Sending Reset Link…' : 'Send Password Reset Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                        setDisplayedError(null);
                        setResetSuccess(null);
                      }}
                      className="w-full border border-[#333] bg-[#121212] px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:border-white hover:text-white"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Email & Password Sign-In Form */}
                  <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4" noValidate>
                    <div>
                      <label
                        htmlFor="admin-email"
                        className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-400"
                      >
                        <span>Administrator Email</span>
                        <Mail size={12} className="text-neutral-500" />
                      </label>
                      <input
                        id="admin-email"
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@keedohub.com"
                        className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="admin-password"
                          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-400"
                        >
                          <Lock size={12} className="text-neutral-500" />
                          <span>Password</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsResetMode(true);
                            setResetEmail(email);
                            setDisplayedError(null);
                            setResetSuccess(null);
                          }}
                          className="text-xs text-neutral-400 underline-offset-4 hover:text-[#FF1E1E] hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter administrator password"
                        className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || googleSubmitting}
                      className="flex w-full items-center justify-center gap-2 bg-[#FF1E1E] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E01818] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <KeyRound size={16} />
                      )}
                      <span>{submitting ? 'Verifying Credentials…' : 'Sign In to Admin HQ'}</span>
                    </button>
                  </form>

                  <div className="my-6 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-neutral-600">
                    <span className="h-px flex-1 bg-[#222]" />
                    <span>Or use authorized provider</span>
                    <span className="h-px flex-1 bg-[#222]" />
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => void handleGoogleSignIn()}
                      disabled={submitting || googleSubmitting}
                      className="flex w-full items-center justify-center gap-3 border border-[#393939] bg-[#171717] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-[#FF1E1E] hover:bg-[#202020] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {googleSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <LogIn size={16} />
                      )}

                      <span>
                        {googleSubmitting
                          ? 'Signing in with Google…'
                          : 'Continue with Google'}
                      </span>
                    </button>

                    <div className="flex items-start gap-2 rounded border border-[#1E1E1E] bg-[#0E0E0E] p-2.5 text-[11px] leading-4 text-neutral-500">
                      <Info size={13} className="mt-0.5 shrink-0 text-neutral-400" />
                      <span>
                        Google sign-in requires pre-assigned administrative permissions and an authorized preview domain in Firebase Console.
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-[#1E1E1E] pt-5 text-xs text-neutral-400">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[#FF1E1E]"
            >
              <ArrowLeft size={13} />
              <span>Client Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('home')}
              className="hover:text-white"
            >
              Public Home
            </button>
          </div>
        </section>
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
};

export default AdminLoginPage;