import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, LockKeyhole, LogIn, Send } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { useApp } from '../../context/AppContext';
import { functions } from '../../lib/firebase';
import { PUBLIC_SERVICES } from '../../data/publicContent';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface Props {
  navigate: (route: PublicRoute, param?: string) => void;
  serviceParam?: string | null;
}

function decodeService(value?: string | null): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const ContactPage: React.FC<Props> = ({ navigate, serviceParam }) => {
  const { isAuthenticated, enterWorkspace, authError } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clientRole, setClientRole] = useState<'Artist' | 'Brand' | 'Company'>('Artist');
  const [service, setService] = useState(() => decodeService(serviceParam));
  const [message, setMessage] = useState('');
  const [requirements, setRequirements] = useState('');
  const [references, setReferences] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitEnquiry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const formattedRequirements = [
        `Client Profile: ${clientRole}`,
        requirements.trim(),
      ]
        .filter(Boolean)
        .join('\n')
        .slice(0, 3000);

      await httpsCallable(functions, 'submitPublicEnquiry')({
        name: name.trim(),
        email: email.trim(),
        service: service.trim(),
        message: message.trim(),
        requirements: formattedRequirements,
        references: references.trim(),
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      setRequirements('');
      setReferences('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#F3F3F3] antialiased selection:bg-[#FF1E1E] selection:text-white">
      <PublicHeader current="contact" navigate={navigate} />

      <main className="mx-auto grid w-full max-w-[1440px] flex-1 gap-12 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-12">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
              Project Enquiry
            </p>
            <h1 className="max-w-3xl text-4xl font-black uppercase leading-[0.94] tracking-[-0.045em] text-white sm:text-6xl">
              Put Creative Direction Behind the Idea.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-neutral-400">
              Send your brief directly to the KeedoHub studio desk. Once reviewed, projects move into your private Artist, Brand, or Company workspace for structured production, proofing, and delivery.
            </p>
          </div>

          {authError && (
            <p role="alert" className="border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-300">
              {authError}
            </p>
          )}

          {submitted ? (
            <div role="status" className="max-w-xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-3">
              <CheckCircle2 size={22} className="text-emerald-300" />
              <h2 className="text-lg font-bold text-white">Enquiry Received</h2>
              <p className="text-sm text-neutral-300 leading-6">
                Your creative brief has been logged for studio review. Our team will respond via the email address provided.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold uppercase tracking-wider text-emerald-200 underline underline-offset-4"
                >
                  Submit another brief
                </button>
                <button
                  type="button"
                  onClick={() => (isAuthenticated ? enterWorkspace() : navigate('register'))}
                  className="text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E]"
                >
                  {isAuthenticated ? 'Open Workspace' : 'Create Client Workspace'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submitEnquiry} className="max-w-xl space-y-5 border border-[#222222] bg-[#0D0D0D] p-6 sm:p-8">
              {error && (
                <p role="alert" className="border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
                  {error}
                </p>
              )}

              <div>
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                  I Am Enquiring As
                </span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['Artist', 'Brand', 'Company'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      aria-pressed={clientRole === role}
                      onClick={() => setClientRole(role)}
                      className={`py-2.5 text-xs font-semibold border transition-colors ${
                        clientRole === role
                          ? 'bg-white border-white text-black'
                          : 'border-[#2A2A2A] bg-[#121212] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs text-neutral-400">
                  Your name *
                  <input
                    required
                    maxLength={100}
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="Full name or artist name"
                    className="mt-1.5 block w-full border border-[#2E2E2E] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                  />
                </label>
                <label className="text-xs text-neutral-400">
                  Email address *
                  <input
                    required
                    type="email"
                    maxLength={254}
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 block w-full border border-[#2E2E2E] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-neutral-400">
                  Service or focus area *
                  <input
                    required
                    maxLength={160}
                    value={service}
                    onChange={event => setService(event.target.value)}
                    placeholder="Creative direction, brand identity, music artwork, motion…"
                    className="mt-1.5 block w-full border border-[#2E2E2E] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                  />
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PUBLIC_SERVICES.slice(0, 5).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setService(item.title)}
                      className={`px-2.5 py-1 font-mono text-[10px] border transition-colors ${
                        service === item.title
                          ? 'border-[#FF1E1E] text-white bg-[#FF1E1E]/15'
                          : 'border-[#252525] text-neutral-500 hover:text-neutral-200 hover:border-[#444]'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-xs text-neutral-400">
                Project brief *
                <textarea
                  required
                  maxLength={5000}
                  rows={5}
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder="Describe what you are creating, the visual direction you are after, and your target release or launch window."
                  className="mt-1.5 block w-full border border-[#2E2E2E] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                />
              </label>

              <label className="block text-xs text-neutral-400">
                Deliverables &amp; target dates
                <textarea
                  maxLength={3000}
                  rows={3}
                  value={requirements}
                  onChange={event => setRequirements(event.target.value)}
                  placeholder="Cover art masters, brand manual PDF, corporate stationery, animation formats, or deadline"
                  className="mt-1.5 block w-full border border-[#2E2E2E] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                />
              </label>

              <label className="block text-xs text-neutral-400">
                Visual references (optional)
                <textarea
                  maxLength={2000}
                  rows={2}
                  value={references}
                  onChange={event => setReferences(event.target.value)}
                  placeholder="Paste links to moodboards, streaming profiles, existing brand assets, or inspiration"
                  className="mt-1.5 block w-full border border-[#2E2E2E] bg-[#141414] px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:border-[#FF1E1E] focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2 bg-[#FF1E1E] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
              >
                <Send size={14} />
                <span>{submitting ? 'Sending Brief…' : 'Send Project Brief'}</span>
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-6 self-start lg:pt-14">
          <div className="border border-[#202020] bg-[#0D0D0D] p-7 space-y-4">
            <div className="flex items-start gap-3.5">
              <LockKeyhole size={18} className="mt-0.5 shrink-0 text-[#FF1E1E]" />
              <div>
                <h2 className="text-base font-bold text-white">One Private Production Room</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  Already have an account? Submit production requests directly inside your Artist, Brand, or Company workspace to monitor status, inspect deliverable versions, and approve final masters.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => (isAuthenticated ? enterWorkspace() : navigate('login'))}
                className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#FF1E1E] hover:text-white transition-colors"
              >
                {isAuthenticated ? (
                  <>
                    <span>Open Your Workspace</span>
                    <ArrowRight size={13} />
                  </>
                ) : (
                  <>
                    <LogIn size={13} />
                    <span>Client Sign In</span>
                  </>
                )}
              </button>
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => navigate('register')}
                  className="border border-[#333] px-4 py-2.5 text-xs font-semibold text-white hover:border-white transition-colors"
                >
                  Create Workspace Account
                </button>
              )}
            </div>
          </div>

          <div className="border border-[#202020] bg-[#0B0B0B] p-7 space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF1E1E]">
              Studio Operations
            </p>
            <div className="space-y-3 text-xs leading-6 text-neutral-400">
              <p>
                <strong className="text-white">Turnaround Guidance:</strong> Indicative delivery windows range from 5 business days for focused artwork to 14 business days for comprehensive identity suites.
              </p>
              <p>
                <strong className="text-white">Global Collaboration:</strong> Remote studio workflows connecting Lagos, London, and international creative teams.
              </p>
            </div>
            <div className="flex flex-wrap gap-6 border-t border-[#1E1E1E] pt-4">
              <button
                type="button"
                onClick={() => navigate('pricing')}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-200 hover:text-[#FF1E1E]"
              >
                <span>Review Packages</span>
                <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => navigate('faq')}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-white"
              >
                <span>Read FAQ</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </aside>
      </main>

      <PublicFooter navigate={navigate} />
    </div>
  );
};
