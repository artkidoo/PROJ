import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  login: 'Client Sign In — KeedoHub',
  register: 'Create Account — KeedoHub',
  'forgot-password': 'Reset Password — KeedoHub',
  'admin-login': 'Admin HQ Sign In — KeedoHub',
};

export const PublicSite: React.FC = () => {
  const { clearAuthError } = useApp();
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
    case 'contact': return <ContactPage {...common} serviceParam={param} />;
    case 'faq': return <FaqPage {...common} />;
    case 'terms': return <TermsPage {...common} />;
    case 'privacy': return <PrivacyPage {...common} />;
    case 'refund': return <RefundPolicyPage {...common} />;
    case 'login': return <LoginPage {...common} />;
    case 'register': return <RegisterPage {...common} />;
    case 'forgot-password': return <ForgotPasswordPage {...common} />;
    case 'admin-login': return <AdminLoginPage {...common} />;
    default: return <PublicHomepage navigate={navigate} />;
  }
};
