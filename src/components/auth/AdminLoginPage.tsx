import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { validateEmailInput } from '../../lib/firebaseAuth';
import { PublicFooter } from '../public/PublicFooter';
import { PublicHeader, PublicRoute } from '../public/PublicHeader';

interface AdminLoginPageProps {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ navigate }) => {
  const {
    isAuthenticated,
    canAccessAdminCenter,
    authError,
    clearAuthError,
    loginAdminWithEmail,
    setAppMode,
    logout,
    firebaseUser,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      await loginAdminWithEmail(email, password);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Administrator sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#F3F3F3] antialiased">
      <PublicHeader current="admin-login" navigate={navigate} />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-4 py-12 sm:px-8 sm:py-20">
        <section className="w-full max-w-md border border-[#2C2C2C] bg-[#0C0C0C] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF1E1E]">
            <LockKeyhole size={14} />
            <span>Private Platform Operations</span>
          </div>
          <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
            KeedoHub Admin HQ
          </h1>
          <p className="mt-2 text-xs leading-6 text-neutral-400">
            Authorized platform operators only. Access requires server-verified administrator credentials. Public registration is disabled.
          </p>

          {isAuthenticated ? (
            <div className="mt-6 space-y-4 border border-[#292929] bg-[#121212] p-5">
              {canAccessAdminCenter ? (
                <>
                  <p className="text-xs leading-6 text-neutral-200">
                    Verified administrator session active for <strong className="text-white">{firebaseUser?.email}</strong>.
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
                    <ShieldAlert size={16} className="mt-0.5 shrink-0 text-[#FF1E1E]" />
                    <p>
                      You are currently signed in as <strong className="text-white">{firebaseUser?.email || 'a client user'}</strong>, which does not have active Admin HQ privileges.
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
              {displayedError && (
                <div
                  role="alert"
                  className="mt-5 border border-red-500/40 bg-red-950/30 px-4 py-3 text-xs text-red-200"
                >
                  {displayedError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <label htmlFor="admin-login-email" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                    Administrator Email
                  </label>
                  <input
                    id="admin-login-email"
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
                  <label htmlFor="admin-login-password" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                    Password
                  </label>
                  <input
                    id="admin-login-password"
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
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 bg-[#FF1E1E] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E01818] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LockKeyhole size={16} />
                  <span>{submitting ? 'Verifying Admin Credentials…' : 'Sign In to Admin HQ'}</span>
                </button>
              </form>
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
