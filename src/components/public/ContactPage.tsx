import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, LockKeyhole, LogIn, Send } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { useApp } from '../../context/AppContext';
import { functions } from '../../lib/firebase';
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
  const { isAuthenticated, loginWithGoogle, enterWorkspace, authError } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState(() => decodeService(serviceParam));
  const [message, setMessage] = useState('');
  const [requirements, setRequirements] = useState('');
  const [references, setReferences] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitEnquiry = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await httpsCallable(functions, 'submitPublicEnquiry')({
        name: name.trim(),
        email: email.trim(),
        service: service.trim(),
        message: message.trim(),
        requirements: requirements.trim(),
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
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#F3F3F3] antialiased">
      <PublicHeader current="contact" navigate={navigate} />
      <main className="mx-auto grid w-full max-w-[1440px] flex-1 gap-10 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_.8fr] lg:gap-20 lg:px-12">
        <div className="space-y-6">
          <p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">Project enquiry</p>
          <h1 className="max-w-3xl text-4xl font-black uppercase leading-[.92] tracking-[-.06em] text-white sm:text-6xl">Let’s put a plan behind the idea.</h1>
          <p className="max-w-xl text-sm leading-7 text-neutral-400">
            Share a creative brief with our team. Enquiries are routed to KeedoHub administrators; production updates and deliverables are managed in your private workspace.
          </p>
          {authError && <p role="alert" className="border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-300">{authError}</p>}
          {submitted ? (
            <div role="status" className="max-w-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
              <CheckCircle2 size={20} className="text-emerald-300" />
              <h2 className="mt-2 font-semibold text-white">Enquiry received</h2>
              <p className="mt-1 text-sm text-neutral-300">The team will review your brief and follow up using the email you provided.</p>
              <button type="button" onClick={() => setSubmitted(false)} className="mt-3 text-xs text-emerald-200 underline">Submit another enquiry</button>
            </div>
          ) : (
            <form onSubmit={submitEnquiry} className="max-w-xl space-y-3 border border-[#252525] bg-[#0C0C0C] p-5 sm:p-6">
              {error && <p role="alert" className="border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">{error}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-neutral-400">Your name
                  <input required maxLength={100} value={name} onChange={event => setName(event.target.value)} className="mt-1 block w-full rounded border border-[#333] bg-[#141414] px-3 py-2.5 text-sm text-white" />
                </label>
                <label className="text-xs text-neutral-400">Email address
                  <input required type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className="mt-1 block w-full rounded border border-[#333] bg-[#141414] px-3 py-2.5 text-sm text-white" />
                </label>
              </div>
              <label className="block text-xs text-neutral-400">Service
                <input required maxLength={160} value={service} onChange={event => setService(event.target.value)} placeholder="Brand identity, music artwork, motion design…" className="mt-1 block w-full rounded border border-[#333] bg-[#141414] px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="block text-xs text-neutral-400">Project brief
                <textarea required maxLength={5000} rows={5} value={message} onChange={event => setMessage(event.target.value)} placeholder="What are you building, and what outcome do you need?" className="mt-1 block w-full rounded border border-[#333] bg-[#141414] px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="block text-xs text-neutral-400">Requirements and deliverables
                <textarea maxLength={3000} rows={3} value={requirements} onChange={event => setRequirements(event.target.value)} placeholder="Formats, dimensions, scope or target date" className="mt-1 block w-full rounded border border-[#333] bg-[#141414] px-3 py-2.5 text-sm text-white" />
              </label>
              <label className="block text-xs text-neutral-400">Reference links
                <textarea maxLength={2000} rows={2} value={references} onChange={event => setReferences(event.target.value)} placeholder="Paste links to references or inspiration" className="mt-1 block w-full rounded border border-[#333] bg-[#141414] px-3 py-2.5 text-sm text-white" />
              </label>
              <button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center gap-2 bg-[#ff2929] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50">
                <Send size={15} />{submitting ? 'Sending enquiry…' : 'Send project enquiry'}
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() => isAuthenticated ? enterWorkspace() : loginWithGoogle()}
            className="inline-flex min-h-11 items-center gap-3 border border-[#333] px-4 py-2.5 text-xs font-semibold text-neutral-200 transition-colors hover:border-white hover:text-white"
          >
            {isAuthenticated ? <><span>Open your workspace</span><ArrowRight size={14} /></> : <><LogIn size={14} /><span>Sign in / create a client workspace</span></>}
          </button>
        </div>

        <aside className="self-start border-t border-[#333] pt-5">
          <div className="flex items-start gap-4">
            <LockKeyhole size={17} className="mt-1 shrink-0 text-[#ff3030]" />
            <div>
              <h2 className="text-sm font-semibold text-white">A clear, private start</h2>
              <p className="mt-2 text-sm leading-7 text-neutral-500">The team reviews enquiries in the administration workspace. Once you have an account, submit a production request from your Artist or Brand workspace to track its status and conversation alongside project work.</p>
            </div>
          </div>
          <button type="button" onClick={() => navigate('pricing')} className="mt-7 inline-flex items-center gap-2 border-b border-[#555] pb-2 text-xs font-semibold uppercase tracking-[.12em] text-neutral-300 hover:border-[#ff3030] hover:text-white">
            Review packages <ArrowRight size={14} />
          </button>
        </aside>
      </main>
      <PublicFooter navigate={navigate} />
    </div>
  );
};
