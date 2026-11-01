/**
 * KEEDOHUB — Public Site Footer
 */
import React from 'react';
import { PublicRoute } from './PublicHeader';

interface PublicFooterProps {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ navigate }) => {
  const go = (r: PublicRoute) => { navigate(r); window.scrollTo(0, 0); };
  return (
    <footer className="bg-[#080808] border-t border-[#191919] py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-neutral-500 font-mono">
        <div className="space-y-3">
          <span className="text-base font-black text-white tracking-tighter uppercase">
            KEEDO<span className="text-[#FF1E1E]">HUB</span>
          </span>
          <p className="text-neutral-500 leading-relaxed">
            Creative Production Operating System. Engineered for artists, labels and modern brands.
          </p>
          <p>© {new Date().getFullYear()} KeedoHub Technologies. All rights reserved.</p>
        </div>

        <div className="space-y-2">
          <p className="text-white font-semibold uppercase tracking-widest text-[10px]">Company</p>
          <button onClick={() => go('about')} className="block hover:text-white transition-colors">About</button>
          <button onClick={() => go('vision')} className="block hover:text-white transition-colors">Vision & Mission</button>
          <button onClick={() => go('services')} className="block hover:text-white transition-colors">Services</button>
          <button onClick={() => go('portfolio')} className="block hover:text-white transition-colors">Portfolio</button>
        </div>

        <div className="space-y-2">
          <p className="text-white font-semibold uppercase tracking-widest text-[10px]">Resources</p>
          <button onClick={() => go('artists')} className="block hover:text-white transition-colors">Artists</button>
          <button onClick={() => go('journal')} className="block hover:text-white transition-colors">Journal</button>
          <button onClick={() => go('pricing')} className="block hover:text-white transition-colors">Pricing</button>
          <button onClick={() => go('faq')} className="block hover:text-white transition-colors">FAQ</button>
          <button onClick={() => go('contact')} className="block hover:text-white transition-colors">Contact</button>
        </div>

        <div className="space-y-2">
          <p className="text-white font-semibold uppercase tracking-widest text-[10px]">Legal</p>
          <button onClick={() => go('terms')} className="block hover:text-white transition-colors">Terms of Service</button>
          <button onClick={() => go('privacy')} className="block hover:text-white transition-colors">Privacy Policy</button>
          <button onClick={() => go('refund')} className="block hover:text-white transition-colors">Refund & Revision Policy</button>
        </div>
      </div>
    </footer>
  );
};
