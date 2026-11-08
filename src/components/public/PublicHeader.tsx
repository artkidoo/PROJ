/**
 * KEEDOHUB — Public Site Header
 */
import React, { useState } from 'react';
import { Menu, X, ArrowRight, LogIn, LayoutDashboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type PublicRoute =
  | 'home' | 'about' | 'vision' | 'services' | 'portfolio' | 'artists'
  | 'journal' | 'article' | 'pricing' | 'contact' | 'faq'
  | 'terms' | 'privacy' | 'refund';

interface PublicHeaderProps {
  current: PublicRoute;
  navigate: (route: PublicRoute, param?: string) => void;
}

const NAV_ITEMS: { label: string; route: PublicRoute }[] = [
  { label: 'Home', route: 'home' },
  { label: 'Services', route: 'services' },
  { label: 'Portfolio', route: 'portfolio' },
  { label: 'Artists', route: 'artists' },
  { label: 'Journal', route: 'journal' },
  { label: 'About', route: 'about' },
  { label: 'Pricing', route: 'pricing' },
  { label: 'Contact', route: 'contact' },
];

export const PublicHeader: React.FC<PublicHeaderProps> = ({ current, navigate }) => {
  const { isAuthenticated, authError, loginWithGoogle, enterWorkspace } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (route: PublicRoute) => {
    navigate(route);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#080808]/90 backdrop-blur border-b border-[#1A1A1A] px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-6">
        <button onClick={() => go('home')} className="flex items-center gap-3 shrink-0">
          <span className="text-lg md:text-xl font-black tracking-tighter text-white uppercase whitespace-nowrap select-none">
            KEEDO<span className="text-[#FF1E1E]">HUB</span>
          </span>
          <span className="hidden sm:inline text-neutral-600">/</span>
          <span className="hidden sm:inline text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            CREATIVE OS
          </span>
        </button>

        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-neutral-400">
          {NAV_ITEMS.map(item => (
            <button
              key={item.route}
              onClick={() => go(item.route)}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${current === item.route ? 'text-white' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2 text-neutral-300 hover:text-white"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => enterWorkspace()}
              className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap"
            >
              <span>Open Workspace</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <>
              <button
                onClick={() => loginWithGoogle()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#141414] rounded border border-[#242424] transition-colors whitespace-nowrap"
              >
                <LogIn size={13} />
                <span>Client Sign In</span>
              </button>
              <button
                onClick={() => enterWorkspace()}
                className="flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-[#E01818] text-white px-3.5 py-1.5 text-xs font-semibold rounded transition-all shadow-sm whitespace-nowrap active:scale-[0.98]"
              >
                <span>Sign In / Create Account</span>
                <ArrowRight size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {authError && <p role="alert" className="mx-auto max-w-[1440px] px-4 py-2 text-xs text-red-300">{authError}</p>}

      {mobileOpen && (
        <div id="public-mobile-menu" className="lg:hidden border-t border-[#1A1A1A] bg-[#080808] px-4 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.route}
              onClick={() => go(item.route)}
              className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${current === item.route ? 'text-white bg-[#141414]' : 'text-neutral-400 hover:text-white hover:bg-[#141414]'}`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 border-t border-[#1A1A1A] mt-3 space-y-2">
            {!isAuthenticated && (
              <button
                onClick={() => { loginWithGoogle(); setMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-200 rounded border border-[#242424]"
              >
                <LogIn size={14} /> Client Sign In
              </button>
            )}
            <button
              onClick={() => { enterWorkspace(); setMobileOpen(false); }}
              className="w-full flex items-center justify-center gap-2 bg-[#FF1E1E] text-white px-3 py-2 text-sm font-semibold rounded"
            >
              <LayoutDashboard size={14} /> Sign In / Create Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
