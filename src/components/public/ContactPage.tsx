import React from 'react';
import { ArrowRight, LockKeyhole, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface Props {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const ContactPage: React.FC<Props> = ({ navigate }) => {
  const { isAuthenticated, loginWithGoogle, enterWorkspace, authError } = useApp();

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-[#F3F3F3] antialiased">
      <PublicHeader current="contact" navigate={navigate} />
      <main className="mx-auto grid w-full max-w-[1440px] flex-1 gap-10 px-4 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_.8fr] lg:gap-20 lg:px-12">
        <div className="space-y-6">
          <p className="text-[10px] font-mono uppercase tracking-[.25em] text-[#ff3030]">Project enquiry</p>
          <h1 className="max-w-3xl text-4xl font-black uppercase leading-[.92] tracking-[-.06em] text-white sm:text-6xl">Let’s put a plan behind the idea.</h1>
          <p className="max-w-xl text-sm leading-7 text-neutral-400">
            KeedoHub project requests are submitted through a private workspace so your brief, production updates and deliverables stay connected.
          </p>
          {authError && <p role="alert" className="border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-300">{authError}</p>}
          <button
            type="button"
            onClick={() => isAuthenticated ? enterWorkspace() : loginWithGoogle()}
            className="inline-flex min-h-12 items-center gap-3 bg-[#ff2929] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-black"
          >
            {isAuthenticated ? <><span>Open your workspace</span><ArrowRight size={16} /></> : <><LogIn size={16} /><span>Sign in / create account</span><ArrowRight size={16} /></>}
          </button>
          <p className="text-xs leading-6 text-neutral-600">New clients choose Artist, Brand or Company during account setup, then send a project brief from the workspace.</p>
        </div>

        <aside className="self-start border-t border-[#333] pt-5">
          <div className="flex items-start gap-4">
            <LockKeyhole size={17} className="mt-1 shrink-0 text-[#ff3030]" />
            <div>
              <h2 className="text-sm font-semibold text-white">A clear, private start</h2>
              <p className="mt-2 text-sm leading-7 text-neutral-500">The request flow captures the project title, brief and category in your account. The production team can then review scope and follow up within the platform.</p>
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
