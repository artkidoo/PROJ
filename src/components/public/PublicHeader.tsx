/**
 * KEEDOHUB — Unified Public Agency Header
 * Top Bar Contract:
 *   Zone 1: Wordmark only
 *   Zone 2: 5 concise single-line links
 *   Zone 3: Workspace / Sign-In entry
 */
import React, { useState } from 'react';
import { Menu, X, ArrowRight, LogIn, LayoutDashboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type PublicRoute =
  | 'home' | 'about' | 'vision' | 'services' | 'portfolio' | 'artists'
  | 'journal' | 'article' | 'pricing' | 'contact' | 'faq'
  | 'terms' | 'privacy' | 'refund'
  | 'login' | 'register' | 'forgot-password' | 'admin-login';

interface PublicHeaderProps {
  current: PublicRoute;
  navigate: (route: PublicRoute, param?: string) => void;
}

const DESKTOP_NAV_ITEMS: { label: string; route: PublicRoute }[] = [
  { label: 'Services', route: 'services' },
  { label: 'Portfolio', route: 'portfolio' },
  { label: 'Artists', route: 'artists' },
  { label: 'Journal', route: 'journal' },
  { label: 'Contact', route: 'contact' },
];

const MOBILE_NAV_ITEMS: { label: string; route: PublicRoute }[] = [
  { label: 'Home', route: 'home' },
  { label: 'Services', route: 'services' },
  { label: 'Portfolio', route: 'portfolio' },
  { label: 'Artists', route: 'artists' },
  { label: 'Journal', route: 'journal' },
  { label: 'Pricing', route: 'pricing' },
  { label: 'About', route: 'about' },
  { label: 'Vision & Mission', route: 'vision' },
  { label: 'FAQ', route: 'faq' },
  { label: 'Contact', route: 'contact' },
];

export const PublicHeader: React.FC<PublicHeaderProps> = ({ current, navigate }) => {
  const { isAuthenticated, authError, enterWorkspace } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (route: PublicRoute) => {
    navigate(route);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#080808]/95 backdrop-blur-md border-b border-[#1A1A1A] px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => go('home')}
          className="shrink-0 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#FF1E1E]"
          aria-label="KeedoHub Home"
        >
          <span className="text-lg md:text-xl font-black tracking-tighter text-white uppercase whitespace-nowrap select-none">
            KEEDO<span className="text-[#FF1E1E]">HUB</span>
          </span>
        </button>

        {/* Zone 2: Concise Navigation (5 single-line items) */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-7 text-xs font-medium tracking-wide text-neutral-400">
          {DESKTOP_NAV_ITEMS.map(item => {
            const isActive = current === item.route || (item.route === 'journal' && current === 'article');
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => go(item.route)}
                className={`relative py-1 transition-colors whitespace-nowrap shrink-0 ${
                  isActive ? 'text-white' : 'hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <span aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF1E1E]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Workspace / Account Action */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2 text-neutral-300 hover:text-white"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => enterWorkspace()}
              className="flex items-center gap-2 bg-white text-black hover:bg-[#FF1E1E] hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0"
            >
              <span>Open Workspace</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => go('login')}
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  current === 'login' ? 'text-white' : 'text-neutral-300 hover:text-white'
                }`}
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => go('register')}
                className="flex items-center gap-1.5 bg-[#FF1E1E] hover:bg-white hover:text-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0"
              >
                <span>Start Workspace</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {authError && (
        <p role="alert" className="mx-auto max-w-[1440px] border-t border-red-900/50 bg-[#080808] px-4 py-2 text-xs text-red-300">
          {authError}
        </p>
      )}

      {mobileOpen && (
        <div id="public-mobile-menu" className="lg:hidden absolute left-0 right-0 top-full border-b border-[#222222] bg-[#080808] px-4 py-5 shadow-2xl">
          <div className="grid grid-cols-2 gap-1">
            {MOBILE_NAV_ITEMS.map(item => (
              <button
                key={item.route}
                type="button"
                onClick={() => go(item.route)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                  current === item.route ? 'text-white bg-[#141414] font-semibold' : 'text-neutral-400 hover:text-white hover:bg-[#121212]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-[#1A1A1A] mt-4 grid grid-cols-1 gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => { enterWorkspace(); setMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-white text-black px-3 py-2.5 text-sm font-bold uppercase tracking-wider"
              >
                <LayoutDashboard size={14} /> Open Workspace
              </button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => go('login')}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-neutral-200 border border-[#262626] hover:border-white"
                  >
                    <LogIn size={14} /> Client Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => go('register')}
                    className="flex items-center justify-center gap-2 bg-[#FF1E1E] text-white px-3 py-2.5 text-xs font-bold uppercase tracking-wider"
                  >
                    <LayoutDashboard size={14} /> Start Workspace
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => go('admin-login')}
                  className="w-full py-2 text-center text-xs font-medium text-neutral-500 hover:text-white"
                >
                  Admin HQ Sign In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
