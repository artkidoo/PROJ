import React, { useEffect, useState } from 'react';
import { PublicHomepage } from './PublicHomepage';
import { PublicRoute } from './PublicHeader';
import { AboutPage } from './AboutPage';
import { VisionMissionPage } from './VisionMissionPage';
import { ServicesPage } from './ServicesPage';
import { PortfolioPage } from './PortfolioPage';
import { ArtistsPage } from './ArtistsPage';
import { JournalPage } from './JournalPage';
import { ArticlePage } from './ArticlePage';
import { PricingPage } from './PricingPage';
import { ContactPage } from './ContactPage';
import { FaqPage } from './FaqPage';
import { TermsPage, PrivacyPage, RefundPolicyPage } from './LegalPages';

const TITLES: Record<PublicRoute, string> = {
  home: 'KeedoHub — Creative Production Operating System',
  about: 'About KeedoHub',
  vision: 'Vision & Mission — KeedoHub',
  services: 'Services — KeedoHub',
  portfolio: 'Portfolio — KeedoHub',
  artists: 'Artists — KeedoHub',
  journal: 'Journal — KeedoHub',
  article: 'Article — KeedoHub',
  pricing: 'Pricing — KeedoHub',
  contact: 'Contact — KeedoHub',
  faq: 'FAQ — KeedoHub',
  terms: 'Terms of Service — KeedoHub',
  privacy: 'Privacy Policy — KeedoHub',
  refund: 'Refund & Revision Policy — KeedoHub',
};

export const PublicSite: React.FC = () => {
  const [route, setRoute] = useState<PublicRoute>('home');
  const [param, setParam] = useState<string | null>(null);

  useEffect(() => {
    const parse = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash) {
        const [r, p] = hash.split('/');
        if (r in TITLES) { setRoute(r as PublicRoute); setParam(p || null); }
      }
    };
    parse();
    window.addEventListener('hashchange', parse);
    return () => window.removeEventListener('hashchange', parse);
  }, []);

  const navigate = (r: PublicRoute, p?: string) => {
    setRoute(r);
    setParam(p || null);
    window.location.hash = p ? `${r}/${p}` : r;
    document.title = TITLES[r];
    window.scrollTo(0, 0);
  };

  useEffect(() => { document.title = TITLES[route]; }, [route]);

  interface Props {
    navigate: (r: PublicRoute, p?: string) => void;
  }

  const common = { navigate };

  switch (route) {
    case 'about': return <AboutPage {...common} />;
    case 'vision': return <VisionMissionPage {...common} />;
    case 'services': return <ServicesPage {...common} />;
    case 'portfolio': return <PortfolioPage {...common} />;
    case 'artists': return <ArtistsPage {...common} />;
    case 'journal': return <JournalPage {...common} />;
    case 'article': return <ArticlePage {...common} param={param} />;
    case 'pricing': return <PricingPage {...common} />;
    case 'contact': return <ContactPage {...common} />;
    case 'faq': return <FaqPage {...common} />;
    case 'terms': return <TermsPage {...common} />;
    case 'privacy': return <PrivacyPage {...common} />;
    case 'refund': return <RefundPolicyPage {...common} />;
    default: return <PublicHomepage navigate={navigate} />;
  }
};
