import React from 'react';
import { PublicHeader, PublicRoute } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface Props { navigate: (r: PublicRoute, p?: string) => void; title: string; }

const LegalLayout: React.FC<Props & { children: React.ReactNode }> = ({ navigate, title, children }) => (
  <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
    <PublicHeader current="terms" navigate={navigate} />
    <main className="flex-1">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase">{title}</h1>
        <p className="text-xs text-amber-400">Draft legal wording — requires business/legal review before publication. Not legal advice.</p>
        <div className="space-y-4 text-sm text-neutral-400 leading-relaxed">{children}</div>
      </section>
    </main>
    <PublicFooter navigate={navigate} />
  </div>
);

export const TermsPage: React.FC<{ navigate: (r: PublicRoute, p?: string) => void }> = ({ navigate }) => (
  <LegalLayout navigate={navigate} title="Terms of Service">
    <p>These terms govern use of the KeedoHub public website and services. Content is a draft placeholder pending legal review.</p>
    <p>Use of the platform constitutes acceptance of these terms. Do not rely on this draft as final legal text.</p>
  </LegalLayout>
);

export const PrivacyPage: React.FC<{ navigate: (r: PublicRoute, p?: string) => void }> = ({ navigate }) => (
  <LegalLayout navigate={navigate} title="Privacy Policy">
    <p>KeedoHub respects user privacy. This draft outlines data handling principles pending legal review.</p>
    <p>No personal data is collected by the public site beyond standard analytics if configured.</p>
  </LegalLayout>
);

export const RefundPolicyPage: React.FC<{ navigate: (r: PublicRoute, p?: string) => void }> = ({ navigate }) => (
  <LegalLayout navigate={navigate} title="Refund and Revision Policy">
    <p>Revisions are scoped per package. Refunds and revision limits require confirmation per engagement.</p>
    <p>This draft requires business/legal review before publication.</p>
  </LegalLayout>
);
