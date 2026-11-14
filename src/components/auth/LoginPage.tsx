import React, { useState } from 'react';
import { ArrowRight, KeyRound, Lock, LogIn, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { validateEmailInput } from '../../lib/firebaseAuth';
import { PublicFooter } from '../public/PublicFooter';
import { PublicHeader, PublicRoute } from '../public/PublicHeader';

interface LoginPageProps {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const {
    isAuthenticated,
    authError,
    clearAuthError,
    loginWithEmail,
    loginWithGoogle,
    enterWorkspace,
    logout,
    firebaseUser,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    clearAuthError();

    const emailIssue = validateEmailInput(email);
    if (emailIssue) {
      setLocalError(emailIssue);
      return;
    }
    if (!password) {
      setLocalError('Enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Sign in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearAuthError();
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle({ intent: 'login' });
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#F3F3F3] antialiased">
      <PublicHeader current="login" navigate={navigate} />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-4 py-12 sm:px-8 sm:py-20">
        <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <section className="border border-[#242424] bg-[#0C0C0C] p-6 sm:p-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF1E1E]">
              Client Workspace Access
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
              Sign In
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Access your unified Artist OS or Brand OS workspace, deliverables, and production requests.
            </p>

            {isAuthenticated ? (
              <div className="mt-6 space-y-4 border border-[#292929] bg-[#121212] p-5">
                <p className="text-sm text-neutral-200">
                  Signed in as <strong className="text-white">{firebaseUser?.email || firebaseUser?.displayName}</strong>.
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
                    Sign out
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

                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                  <div>
                    <label htmlFor="client-login-email" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      Email Address
                    </label>
                    <input
                      id="client-login-email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.com"
                      className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="client-login-password" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate('forgot-password')}
                        className="text-xs text-neutral-400 hover:text-white underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="client-login-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="mt-1.5 w-full border border-[#292929] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || googleSubmitting}
                    className="flex w-full items-center justify-center gap-2 bg-[#FF1E1E] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E01818] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogIn size={16} />
                    <span>{submitting ? 'Signing in…' : 'Sign In to Workspace'}</span>
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
                  onClick={() => void handleGoogleSignIn()}
                  className="flex w-full items-center justify-center gap-2 border border-[#333] bg-[#121212] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>{googleSubmitting ? 'Connecting to Google…' : 'Continue with Google'}</span>
                </button>
              </>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1E1E1E] pt-5 text-xs text-neutral-400">
              <span>
                New to KeedoHub?{' '}
                <button
                  type="button"
                  onClick={() => navigate('register')}
                  className="font-semibold text-white hover:text-[#FF1E1E]"
                >
                  Create an account
                </button>
              </span>
              <button
                type="button"
                onClick={() => navigate('admin-login')}
                className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white"
              >
                <ShieldCheck size={13} className="text-[#FF1E1E]" />
                <span>Admin Login</span>
              </button>
            </div>
          </section>

          <aside className="space-y-6 border border-[#1E1E1E] bg-[#0A0A0A] p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <Lock size={18} className="mt-0.5 shrink-0 text-[#FF1E1E]" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  One Unified Client Workspace
                </h2>
                <p className="mt-2 text-xs leading-6 text-neutral-400">
                  Whether you run an Artist OS for music releases and press or a Brand OS for visual identity and campaign systems, all your workspaces live in one private client hub.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t border-[#1A1A1A] pt-5">
              <KeyRound size={18} className="mt-0.5 shrink-0 text-[#FF1E1E]" />
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Need Account Recovery?
                </h2>
                <p className="mt-2 text-xs leading-6 text-neutral-400">
                  Use the password reset flow for email/password accounts, or sign in with Google if your workspace was originally created with Google.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('forgot-password')}
                  className="mt-3 text-xs font-semibold text-white underline underline-offset-4 hover:text-[#FF1E1E]"
                >
                  Reset your password
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
};

export default LoginPage;
