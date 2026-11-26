/**
 * KEEDOHUB — Unified Public Agency Footer
 */
import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PublicRoute } from './PublicHeader';
import { useWebsiteCms } from '../../context/WebsiteCmsContext';
import keedohubMarkTransparent from '../../assets/images/keedohub_mark_transparent.png';

interface PublicFooterProps {
  navigate: (route: PublicRoute, param?: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ navigate }) => {
  const { siteNavigation, siteSettings } = useWebsiteCms();

  const go = (r: PublicRoute) => {
    navigate(r);
    window.scrollTo(0, 0);
  };

  const logoMark = siteSettings?.markDarkSurfaceUrl || keedohubMarkTransparent;
  const brandName = siteSettings?.siteName || 'KEEDOHUB';
  const bio = siteSettings?.footerBio || 'Creative direction, brand identity, music visual worlds, and structured creative production for artists, labels, and modern companies.';
  const locations = siteSettings?.studioLocations || 'Lagos · London · Remote Global Studio';
  const copyright = siteSettings?.copyrightText || `© ${new Date().getFullYear()} KeedoHub Creative Agency & Production OS. All rights reserved.`;

  const footerCols = siteNavigation?.footerColumns && siteNavigation.footerColumns.length > 0
    ? siteNavigation.footerColumns
    : [
        {
          id: 'footer_studio',
          title: 'Studio',
          items: [
            { id: 'f-home', label: 'Home', route: 'home' as PublicRoute, visible: true, order: 1, location: 'footer_studio' as const },
            { id: 'f-about', label: 'About the Agency', route: 'about' as PublicRoute, visible: true, order: 2, location: 'footer_studio' as const },
            { id: 'f-vision', label: 'Vision & Mission', route: 'vision' as PublicRoute, visible: true, order: 3, location: 'footer_studio' as const },
            { id: 'f-services', label: 'Capabilities & Services', route: 'services' as PublicRoute, visible: true, order: 4, location: 'footer_studio' as const },
            { id: 'f-portfolio', label: 'Portfolio Showcase', route: 'portfolio' as PublicRoute, visible: true, order: 5, location: 'footer_studio' as const },
          ],
        },
        {
          id: 'footer_ecosystem',
          title: 'Ecosystem',
          items: [
            { id: 'f-artists', label: 'Artists & Visual Worlds', route: 'artists' as PublicRoute, visible: true, order: 1, location: 'footer_ecosystem' as const },
            { id: 'f-journal', label: 'Studio Journal', route: 'journal' as PublicRoute, visible: true, order: 2, location: 'footer_ecosystem' as const },
            { id: 'f-pricing', label: 'Packages & Scope', route: 'pricing' as PublicRoute, visible: true, order: 3, location: 'footer_ecosystem' as const },
            { id: 'f-faq', label: 'FAQ', route: 'faq' as PublicRoute, visible: true, order: 4, location: 'footer_ecosystem' as const },
            { id: 'f-contact', label: 'Contact & Enquiries', route: 'contact' as PublicRoute, visible: true, order: 5, location: 'footer_ecosystem' as const },
          ],
        },
        {
          id: 'footer_os',
          title: 'Creative OS',
          items: [
            { id: 'f-reg', label: 'Create Client Workspace', route: 'register' as PublicRoute, visible: true, order: 1, location: 'footer_os' as const },
            { id: 'f-login', label: 'Client Sign In', route: 'login' as PublicRoute, visible: true, order: 2, location: 'footer_os' as const },
            { id: 'f-forgot', label: 'Reset Password', route: 'forgot-password' as PublicRoute, visible: true, order: 3, location: 'footer_os' as const },
            { id: 'f-admin', label: 'Admin HQ Login', route: 'admin-login' as PublicRoute, visible: true, order: 4, location: 'footer_os' as const },
          ],
        },
        {
          id: 'footer_policies',
          title: 'Policies',
          items: [
            { id: 'f-terms', label: 'Terms & Conditions', route: 'terms' as PublicRoute, visible: true, order: 1, location: 'footer_policies' as const },
            { id: 'f-priv', label: 'Privacy Policy', route: 'privacy' as PublicRoute, visible: true, order: 2, location: 'footer_policies' as const },
            { id: 'f-ref', label: 'Refund & Revision Policy', route: 'refund' as PublicRoute, visible: true, order: 3, location: 'footer_policies' as const },
          ],
        },
      ];

  return (
    <footer className="bg-[#080808] border-t border-[#1A1A1A] py-14 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-[1440px] mx-auto space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 text-xs text-neutral-400">
          <div className="space-y-4 lg:col-span-1">
            <button type="button" onClick={() => go('home')} className="inline-flex items-center gap-2.5 text-left focus:outline-none">
              <img
                src={logoMark}
                alt={`${brandName} Logo`}
                referrerPolicy="no-referrer"
                className="h-9 w-9 object-contain bg-transparent shrink-0"
              />
              <span className="text-lg font-black text-white tracking-tighter uppercase">
                {brandName}
              </span>
            </button>
            <p className="text-neutral-400 leading-relaxed text-xs max-w-xs">
              {bio}
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

          {footerCols.map(col => (
            <div key={col.id} className="space-y-2.5">
              <p className="text-white font-mono uppercase tracking-[0.18em] text-[10px]">{col.title}</p>
              {col.items.filter(i => i.visible !== false).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.route)}
                  className="block hover:text-white transition-colors text-left"
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-[#181818] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-[11px] text-neutral-500">
          <p>{copyright}</p>
          <p className="uppercase tracking-[0.18em]">{locations}</p>
        </div>
      </div>
    </footer>
  );
};

