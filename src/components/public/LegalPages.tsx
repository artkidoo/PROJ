import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface LegalLayoutProps {
  current: 'terms' | 'privacy' | 'refund';
  navigate: (r: PublicRoute, p?: string) => void;
  eyebrow: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({
  current,
  navigate,
  eyebrow,
  title,
  summary,
  children,
}) => (
  <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased selection:bg-[#FF1E1E] selection:text-white">
    <PublicHeader current={current} navigate={navigate} />

    <main className="flex-1">
      <section className="px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-4xl space-y-10">
          <header className="space-y-4 border-b border-[#1E1E1E] pb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#FF1E1E]">
                {eyebrow}
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                KeedoHub Studio Policy Framework
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.04em] text-white uppercase leading-[0.98]">
              {title}
            </h1>
            <p className="text-sm sm:text-base leading-7 text-neutral-400 max-w-2xl">
              {summary}
            </p>
          </header>

          <div className="space-y-8">{children}</div>

          <div className="border-t border-[#1E1E1E] pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => navigate('terms')}
                className={current === 'terms' ? 'text-[#FF1E1E]' : 'text-neutral-400 hover:text-white'}
              >
                Terms &amp; Conditions
              </button>
              <button
                type="button"
                onClick={() => navigate('privacy')}
                className={current === 'privacy' ? 'text-[#FF1E1E]' : 'text-neutral-400 hover:text-white'}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => navigate('refund')}
                className={current === 'refund' ? 'text-[#FF1E1E]' : 'text-neutral-400 hover:text-white'}
              >
                Refund &amp; Revision Policy
              </button>
            </div>
            <button
              type="button"
              onClick={() => navigate('contact')}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white hover:text-[#FF1E1E]"
            >
              <span>Questions? Contact Studio</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>
    </main>

    <PublicFooter navigate={navigate} />
  </div>
);

interface ClauseProps {
  index: string;
  heading: string;
  body: string;
}

const Clause: React.FC<ClauseProps> = ({ index, heading, body }) => (
  <section className="grid gap-3 border-b border-[#191919] pb-7 sm:grid-cols-[3.5rem_1fr]">
    <span className="font-mono text-xs text-[#FF1E1E] tabular-nums">{index}</span>
    <div className="space-y-2">
      <h2 className="text-lg font-bold text-white">{heading}</h2>
      <p className="text-sm leading-7 text-neutral-400">{body}</p>
    </div>
  </section>
);

export const TermsPage: React.FC<{ navigate: (r: PublicRoute, p?: string) => void }> = ({ navigate }) => (
  <LegalLayout
    current="terms"
    navigate={navigate}
    eyebrow="Terms & Conditions"
    title="Terms of Studio Engagement & Workspace Use"
    summary="General terms governing public enquiry submissions, private Creative OS accounts, project approvals, and intellectual property handover."
  >
    <Clause
      index="01"
      heading="Scope of Services"
      body="Creative direction, brand identity, music artwork, motion design, promotional creative assets, and corporate documentation engagements are governed by the deliverables, turnaround schedule, and revision allowance confirmed upon brief acceptance."
    />
    <Clause
      index="02"
      heading="Client Workspace Access"
      body="Each client account receives a single private workspace organized for Artist OS or Brand OS operations. Account credentials and shared access belong strictly to the authorized account holder and invited collaborators."
    />
    <Clause
      index="03"
      heading="Concept Showcase vs. Client Property"
      body="Public portfolio studies represent studio concepts and approved showcase permissions. Client-specific project files, contracts, drafts, and private brand assets remain restricted to private authenticated workspaces."
    />
    <Clause
      index="04"
      heading="Intellectual Property & Licensing"
      body="Upon final engagement settlement and project delivery confirmation, usage rights for agreed final deliverables transfer according to the engagement terms. Pre-production exploratory concepts not selected remain the intellectual property of KeedoHub."
    />
  </LegalLayout>
);

export const PrivacyPage: React.FC<{ navigate: (r: PublicRoute, p?: string) => void }> = ({ navigate }) => (
  <LegalLayout
    current="privacy"
    navigate={navigate}
    eyebrow="Privacy Policy"
    title="Data Protection & Workspace Confidentiality"
    summary="How KeedoHub handles public enquiry submissions, authentication identities, and private project files inside client workspaces."
  >
    <Clause
      index="01"
      heading="Enquiry & Contact Submissions"
      body="Details submitted through the Contact page—including name, email address, requested discipline, and project notes—are recorded exclusively so KeedoHub administrators can evaluate and respond to your brief."
    />
    <Clause
      index="02"
      heading="Workspace Data Isolation"
      body="Client briefs, artwork proofs, internal notes, contracts, and downloadable assets stored inside KeedoHub workspaces are scoped strictly to the owning account and authorized platform administrators under security rules enforcement."
    />
    <Clause
      index="03"
      heading="Authentication & Third-Party Providers"
      body="Authentication is processed through Firebase Authentication (Email/Password and Google Sign-In). We store only essential identity metadata required to provision and secure your Artist or Brand workspace."
    />
    <Clause
      index="04"
      heading="Data Retention & Removal Requests"
      body="Clients may request updates or removal of enquiry contact records or workspace data by contacting the studio administration desk."
    />
  </LegalLayout>
);

export const RefundPolicyPage: React.FC<{ navigate: (r: PublicRoute, p?: string) => void }> = ({ navigate }) => (
  <LegalLayout
    current="refund"
    navigate={navigate}
    eyebrow="Refund & Revision Policy"
    title="Structured Revisions & Engagement Safeguards"
    summary="Transparent expectations on included revision rounds, milestone approvals inside the workspace, and cancellation or refund handling."
  >
    <Clause
      index="01"
      heading="Included Revision Rounds"
      body="Each creative engagement specifies an agreed revision allowance (typically 2 rounds for Essential scopes and 3 rounds for Professional scopes). Revision feedback is logged directly against published deliverable versions inside your workspace."
    />
    <Clause
      index="02"
      heading="Scope Changes & Additional Rounds"
      body="Feedback requesting changes beyond the original confirmed creative brief—or extra rounds after the included allowance—is scoped transparently and approved before further production work proceeds."
    />
    <Clause
      index="03"
      heading="Cancellations & Milestones"
      body="If an engagement is paused or cancelled prior to creative production starting, unspent deposits are evaluated fairly against initial direction work completed. Once deliverables enter production or final masters are approved, fees cover studio time rendered."
    />
    <Clause
      index="04"
      heading="Quality Assurance Remedy"
      body="If a final master file contains technical production defects (such as incorrect export bleed margins, corrupted codecs, or missing agreed formats), KeedoHub corrects the technical defect at no additional revision cost."
    />
  </LegalLayout>
);
