import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WebsiteCmsProvider, useWebsiteCms } from '../../context/WebsiteCmsContext';
import type { PublicPageId } from '../../types/cms';
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
import { LoginPage } from '../auth/LoginPage';
import { RegisterPage } from '../auth/RegisterPage';
import { ForgotPasswordPage } from '../auth/ForgotPasswordPage';
import { AdminLoginPage } from '../auth/AdminLoginPage';

const TITLES: Record<PublicRoute, string> = {
  home: 'KeedoHub — Creative Agency & Production Operating System',
  about: 'About the Agency — KeedoHub',
  vision: 'Vision & Mission — KeedoHub',
  services: 'Creative Services — KeedoHub',
  portfolio: 'Portfolio Archive — KeedoHub',
  artists: 'Artists & Visual Worlds — KeedoHub',
  journal: 'Studio Journal — KeedoHub',
  article: 'Studio Essay — KeedoHub',
  pricing: 'Packages & Scope — KeedoHub',
  contact: 'Project Enquiry — KeedoHub',
  faq: 'FAQ — KeedoHub',
  terms: 'Terms & Conditions — KeedoHub',
  privacy: 'Privacy Policy — KeedoHub',
  refund: 'Refund & Revision Policy — KeedoHub',
  login: 'Client Sign In — KeedoHub',
  register: 'Create Client Workspace — KeedoHub',
  'forgot-password': 'Reset Password — KeedoHub',
  'admin-login': 'Admin HQ Sign In — KeedoHub',
};

const PublicSiteInner: React.FC = () => {
  const { clearAuthError } = useApp();
  const { isPageVisible } = useWebsiteCms();
  const [route, setRoute] = useState<PublicRoute>('home');
  const [param, setParam] = useState<string | null>(null);
  const routeRef = useRef<PublicRoute>('home');
  const clearAuthErrorRef = useRef(clearAuthError);
  clearAuthErrorRef.current = clearAuthError;

  useEffect(() => {
    const parse = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      let nextRoute: PublicRoute = 'home';
      let nextParam: string | null = null;
      if (hash) {
        const [r, p] = hash.split('/');
        if (r in TITLES) {
          nextRoute = r as PublicRoute;
          nextParam = p || null;
        } else {
          return;
        }
      }
      if (nextRoute !== routeRef.current) {
        clearAuthErrorRef.current();
        routeRef.current = nextRoute;
      }
      setRoute(nextRoute);
      setParam(nextParam);
    };
    parse();
    window.addEventListener('hashchange', parse);
    return () => window.removeEventListener('hashchange', parse);
  }, []);

  const navigate = (r: PublicRoute, p?: string) => {
    if (r !== routeRef.current) {
      clearAuthError();
      routeRef.current = r;
    }
    setRoute(r);
    setParam(p || null);
    window.location.hash = p ? `${r}/${p}` : r;
    document.title = TITLES[r];
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);

  const common = { navigate };

  const canShow = (id: PublicPageId) => isPageVisible(id);

  switch (route) {
    case 'about':
      return canShow('about') ? <AboutPage {...common} /> : <PublicHomepage navigate={navigate} />;
    case 'vision':
      return canShow('vision') ? <VisionMissionPage {...common} /> : <PublicHomepage navigate={navigate} />;
    case 'services':
      return canShow('services') ? <ServicesPage {...common} /> : <PublicHomepage navigate={navigate} />;
    case 'portfolio':
      return canShow('portfolio') ? <PortfolioPage {...common} /> : <PublicHomepage navigate={navigate} />;
    case 'artists':
      return canShow('artists') ? <ArtistsPage {...common} /> : <PublicHomepage navigate={navigate} />;
    case 'journal':
      return canShow('journal') ? <JournalPage {...common} /> : <PublicHomepage navigate={navigate} />;
    case 'article':
      return <ArticlePage {...common} param={param} />;
    case 'pricing':
      return canShow('pricing') ? <PricingPage {...common} /> : <PublicHomepage navigate={navigate} />;
    case 'contact':
      return canShow('contact') ? <ContactPage {...common} serviceParam={param} /> : <PublicHomepage navigate={navigate} />;
    case 'faq':
      return canShow('faq') ? <FaqPage {...common} /> : <PublicHomepage navigate={navigate} />;
    case 'terms':
      return <TermsPage {...common} />;
    case 'privacy':
      return <PrivacyPage {...common} />;
    case 'refund':
      return <RefundPolicyPage {...common} />;
    case 'login':
      return <LoginPage {...common} />;
    case 'register':
      return <RegisterPage {...common} />;
    case 'forgot-password':
      return <ForgotPasswordPage {...common} />;
    case 'admin-login':
      return <AdminLoginPage {...common} />;
    default:
      return <PublicHomepage navigate={navigate} />;
  }
};

export const PublicSite: React.FC = () => {
  return (
    <WebsiteCmsProvider>
      <PublicSiteInner />
    </WebsiteCmsProvider>
  );
};

