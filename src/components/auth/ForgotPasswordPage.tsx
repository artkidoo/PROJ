import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { validateEmailInput } from '../../lib/firebaseAuth';
import { PublicFooter } from '../public/PublicFooter';
import { PublicHeader, PublicRoute } from '../public/PublicHeader';

interface ForgotPasswordPageProps {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ navigate }) => {
  const { authError, clearAuthError, sendPasswordReset } = useApp();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    clearAuthError();
    setSent(false);

    const emailIssue = validateEmailInput(email);
    if (emailIssue) {
      setLocalError(emailIssue);
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Unable to send reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#F3F3F3] antialiased">
      <PublicHeader current="forgot-password" navigate={navigate} />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-4 py-12 sm:px-8 sm:py-20">
        <section className="w-full max-w-md border border-[#242424] bg-[#0C0C0C] p-6 sm:p-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FF1E1E]">
            Account Recovery
          </p>
          <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Enter your account email address and we will send password reset instructions if an email/password account matches.
          </p>

          {displayedError && (
            <div
              role="alert"
              className="mt-5 border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-200"
            >
              {displayedError}
            </div>
          )}

          {sent ? (
            <div
              role="status"
              className="mt-6 space-y-3 border border-emerald-500/30 bg-emerald-950/20 p-5 text-sm text-emerald-100"
            >
              <CheckCircle2 size={20} className="text-emerald-300" />
              <p className="font-semibold text-white">Check your inbox</p>
              <p className="text-xs leading-6 text-neutral-300">
                If an account exists for <strong className="text-white">{email.trim()}</strong>, password reset instructions have been sent.
              </p>
              <button
                type="button"
                onClick={() => navigate('login')}
                className="inline-flex items-center gap-2 border border-emerald-300/30 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-950/40"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="reset-email" className="block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                  Email Address
                </label>
                <input
                  id="reset-email"
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

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 bg-[#FF1E1E] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E01818] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mail size={16} />
                <span>{submitting ? 'Sending Reset Link…' : 'Send Reset Instructions'}</span>
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-[#1E1E1E] pt-5 text-xs text-neutral-400">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[#FF1E1E]"
            >
              <ArrowLeft size={13} />
              <span>Back to Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('register')}
              className="hover:text-white"
            >
              Create account
            </button>
          </div>
        </section>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
};

export default ForgotPasswordPage;
