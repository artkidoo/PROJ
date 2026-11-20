/**
 * KEEDOHUB — Unified Public Agency Footer
 */
import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PublicRoute } from './PublicHeader';

interface PublicFooterProps {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ navigate }) => {
  const go = (r: PublicRoute) => {
    navigate(r);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="bg-[#080808] border-t border-[#1A1A1A] py-14 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-[1440px] mx-auto space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 text-xs text-neutral-400">
          <div className="space-y-4 lg:col-span-1">
            <button type="button" onClick={() => go('home')} className="text-left focus:outline-none">
              <span className="text-lg font-black text-white tracking-tighter uppercase">
                KEEDO<span className="text-[#FF1E1E]">HUB</span>
              </span>
            </button>
            <p className="text-neutral-400 leading-relaxed text-xs max-w-xs">
              Creative direction, brand identity, music visual worlds, and structured creative production for artists, labels, and modern companies.
            </p>
            <button
              type="button"
              onClick={() => go('contact')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white border-b border-[#333] pb-1 hover:border-[#FF1E1E] hover:text-[#FF1E1E] transition-colors"
            >
              <span>Start a project brief</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            <p className="text-white font-mono uppercase tracking-[0.18em] text-[10px]">Studio</p>
            <button type="button" onClick={() => go('home')} className="block hover:text-white transition-colors">Home</button>
            <button type="button" onClick={() => go('about')} className="block hover:text-white transition-colors">About the Agency</button>
            <button type="button" onClick={() => go('vision')} className="block hover:text-white transition-colors">Vision &amp; Mission</button>
            <button type="button" onClick={() => go('services')} className="block hover:text-white transition-colors">Capabilities &amp; Services</button>
            <button type="button" onClick={() => go('portfolio')} className="block hover:text-white transition-colors">Portfolio Showcase</button>
          </div>

          <div className="space-y-2.5">
            <p className="text-white font-mono uppercase tracking-[0.18em] text-[10px]">Ecosystem</p>
            <button type="button" onClick={() => go('artists')} className="block hover:text-white transition-colors">Artists &amp; Visual Worlds</button>
            <button type="button" onClick={() => go('journal')} className="block hover:text-white transition-colors">Studio Journal</button>
            <button type="button" onClick={() => go('pricing')} className="block hover:text-white transition-colors">Packages &amp; Scope</button>
            <button type="button" onClick={() => go('faq')} className="block hover:text-white transition-colors">FAQ</button>
            <button type="button" onClick={() => go('contact')} className="block hover:text-white transition-colors">Contact &amp; Enquiries</button>
          </div>

          <div className="space-y-2.5">
            <p className="text-white font-mono uppercase tracking-[0.18em] text-[10px]">Creative OS</p>
            <button type="button" onClick={() => go('register')} className="block hover:text-white transition-colors">Create Client Workspace</button>
            <button type="button" onClick={() => go('login')} className="block hover:text-white transition-colors">Client Sign In</button>
            <button type="button" onClick={() => go('forgot-password')} className="block hover:text-white transition-colors">Reset Password</button>
            <button type="button" onClick={() => go('admin-login')} className="block hover:text-white transition-colors">Admin HQ Login</button>
          </div>

          <div className="space-y-2.5">
            <p className="text-white font-mono uppercase tracking-[0.18em] text-[10px]">Policies</p>
            <button type="button" onClick={() => go('terms')} className="block hover:text-white transition-colors">Terms &amp; Conditions</button>
            <button type="button" onClick={() => go('privacy')} className="block hover:text-white transition-colors">Privacy Policy</button>
            <button type="button" onClick={() => go('refund')} className="block hover:text-white transition-colors">Refund &amp; Revision Policy</button>
          </div>
        </div>

        <div className="pt-6 border-t border-[#181818] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} KeedoHub Creative Agency &amp; Production OS. All rights reserved.</p>
          <p className="uppercase tracking-[0.18em]">Lagos · London · Remote Global Studio</p>
        </div>
      </div>
    </footer>
  );
};
