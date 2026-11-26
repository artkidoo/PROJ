import React, { useEffect, useState } from 'react';
import {
  Building2,
  Clapperboard,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Music,
  Receipt,
  Settings,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionNotificationCenter } from '../common/ProductionNotificationCenter';
import {
  ADMIN_HQ_SECTIONS,
  formatAdminHQHash,
  getAdminSectionConfig,
  normalizeAdminSubTab,
  parseAdminHQHash,
  type AdminHQSection,
  type CreativeProductsSegment,
  type FinanceTab,
  type PlatformSettingsTab,
  type SharedOpsTab,
} from '../../lib/adminHQNavigation';
import {
  AdminHQOverview,
  type AdminHQOverviewNavigateOptions,
  type AdminHQOverviewTarget,
} from './AdminHQOverview';
import {
  type AdminProductionNavigateOptions,
  type AdminProductionSection,
} from './AdminProduction';
import { type DesignLibraryTab } from './AdminDesignLibrary';
import { AdminDepartmentConsole } from './AdminDepartmentConsole';
import { AdminSharedOperations } from './AdminSharedOperations';
import { AdminCreativeProducts } from './AdminCreativeProducts';
import { AdminFinanceConsole } from './AdminFinanceConsole';
import { AdminPlatformSettingsConsole } from './AdminPlatformSettingsConsole';
import { BrandRoom } from './brand-room/BrandRoom';
import type { CanvasDesign } from '../../types/designStudio';
import keedohubMarkTransparent from '../../assets/images/keedohub_mark_transparent.png';

const SECTION_ICONS: Record<
  AdminHQSection,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  'hq-overview': LayoutDashboard,
  'artist-department': Music,
  'brand-department': Building2,
  'shared-operations': Clapperboard,
  'creative-products': Sparkles,
  finance: Receipt,
  'brand-room': Megaphone,
  'platform-settings': Settings,
};

export type { AdminHQSection };

export const AdminHQ: React.FC = () => {
  const {
    firebaseUser,
    clientProfile,
    canAccessAdminCenter,
    logout,
    exitToPublic,
  } = useApp();

  const initialRoute =
    typeof window !== 'undefined'
      ? parseAdminHQHash(window.location.hash)
      : { section: 'hq-overview' as AdminHQSection };

  const [activeSection, setActiveSection] = useState<AdminHQSection>(initialRoute.section);
  const [activeSubTab, setActiveSubTab] = useState<string>(
    initialRoute.subTab || getAdminSectionConfig(initialRoute.section).defaultSubTab || '',
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectTab, setSelectedProjectTab] = useState<
    'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity'
  >('overview');
  const [projectClientFilter, setProjectClientFilter] = useState('');
  const [projectWorkspaceFilter, setProjectWorkspaceFilter] = useState('');
  const [projectStageFilter, setProjectStageFilter] = useState('All');
  const [projectOverdueOnly, setProjectOverdueOnly] = useState(false);
  const [selectedClientUid, setSelectedClientUid] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const [selectedServicePackageId, setSelectedServicePackageId] = useState('');
  const [designLibraryWorkspaceId, setDesignLibraryWorkspaceId] = useState('');
  const [designLibraryProjectId, setDesignLibraryProjectId] = useState('');
  const [designLibraryTab, setDesignLibraryTab] = useState<DesignLibraryTab>('designs');
  const [pendingProductCanvasDraft, setPendingProductCanvasDraft] = useState<CanvasDesign | null>(null);

  // Sync Admin HQ section & sub-tab to URL hash for direct navigation and browser refresh persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextHash = formatAdminHQHash(activeSection, activeSubTab);
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }, [activeSection, activeSubTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => {
      const raw = window.location.hash;
      if (!raw.startsWith('#/admin') && !raw.startsWith('#admin')) return;
      const parsed = parseAdminHQHash(raw);
      setActiveSection(parsed.section);
      setActiveSubTab(
        parsed.subTab || getAdminSectionConfig(parsed.section).defaultSubTab || '',
      );
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  // Fail-closed component-level authorization guard
  if (!firebaseUser || !canAccessAdminCenter) {
    return (
      <main className="min-h-screen bg-[#080808] text-[#F3F3F3] flex items-center justify-center p-6">
        <section className="max-w-md w-full border border-red-900/50 bg-[#0C0C0C] p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-[#FF1E1E]">
            <ShieldAlert size={20} />
            <h1 className="text-base font-bold text-white">Admin HQ Access Restricted</h1>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            This environment is reserved for verified, active KeedoHub platform administrators.
          </p>
          <button
            type="button"
            onClick={() => exitToPublic()}
            className="border border-[#2E2E2E] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:border-white"
          >
            Return to Public Site
          </button>
        </section>
      </main>
    );
  }

  const adminName =
    clientProfile?.displayName ||
    firebaseUser.displayName ||
    firebaseUser.email ||
    'Platform Admin';
  const adminEmail = firebaseUser.email || '';

  const clearProjectFilters = () => {
    setProjectClientFilter('');
    setProjectWorkspaceFilter('');
    setProjectStageFilter('All');
    setProjectOverdueOnly(false);
  };

  const navigateTo = (section: AdminHQSection, subTab?: string) => {
    const normalizedSub = normalizeAdminSubTab(section, subTab) || '';
    setActiveSection(section);
    setActiveSubTab(normalizedSub);
    setMobileMenuOpen(false);
  };

  const selectSection = (section: AdminHQSection) => {
    clearProjectFilters();
    setDesignLibraryWorkspaceId('');
    setDesignLibraryProjectId('');
    setDesignLibraryTab('designs');
    setSelectedProjectId('');
    setSelectedProjectTab('overview');
    navigateTo(section);
  };

  const handleExitToPublic = () => {
    if (
      typeof window !== 'undefined' &&
      (window.location.hash.startsWith('#/admin') || window.location.hash.startsWith('#admin'))
    ) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    exitToPublic();
  };

  const handleOpenDesignLibrary = (
    options?: {
      workspaceId?: string;
      projectId?: string;
      tab?: DesignLibraryTab;
    },
    departmentFallback: 'Artist' | 'Brand' = 'Brand',
  ) => {
    setDesignLibraryWorkspaceId(options?.workspaceId || '');
    setDesignLibraryProjectId(options?.projectId || '');
    setDesignLibraryTab(options?.tab || 'designs');
    const targetSection: AdminHQSection =
      departmentFallback === 'Artist' ? 'artist-department' : 'brand-department';
    const targetSub =
      departmentFallback === 'Artist' ? 'templates-documents' : 'templates-collateral';
    navigateTo(targetSection, targetSub);
  };

  const handleOverviewNavigate = (
    target: AdminHQOverviewTarget,
    projectId?: string,
    options?: AdminHQOverviewNavigateOptions,
  ) => {
    setSelectedProjectId(projectId || '');
    setSelectedProjectTab(
      options?.tab || (options?.subTab === 'qa-reviews' ? 'deliverables' : 'overview'),
    );
    setProjectClientFilter('');
    setProjectWorkspaceFilter('');
    setProjectStageFilter(options?.stageFilter || 'All');
    setProjectOverdueOnly(Boolean(options?.overdueOnly));
    navigateTo(target, options?.subTab);
  };

  const handleProductionNavigate = (
    targetSection: AdminProductionSection,
    options?: AdminProductionNavigateOptions,
  ) => {
    if (options?.clearFilters) {
      clearProjectFilters();
    }
    if (options?.stageFilter !== undefined) {
      setProjectStageFilter(options.stageFilter);
    }
    if (options?.overdueOnly !== undefined) {
      setProjectOverdueOnly(options.overdueOnly);
    }
    if (options?.projectId !== undefined) {
      setSelectedProjectId(options.projectId);
    } else if (targetSection === 'studio' || targetSection === 'projects') {
      if (options?.clearFilters) setSelectedProjectId('');
    }
    if (options?.tab) {
      setSelectedProjectTab(options.tab);
    } else if (targetSection === 'reviews') {
      setSelectedProjectTab('deliverables');
    } else {
      setSelectedProjectTab('overview');
    }

    const subMap: Record<AdminProductionSection, SharedOpsTab> = {
      requests: 'requests-enquiries',
      studio: 'master-studio',
      projects: 'master-studio',
      reviews: 'qa-reviews',
    };
    navigateTo('shared-operations', subMap[targetSection]);
  };

  const meta = getAdminSectionConfig(activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'hq-overview':
        return <AdminHQOverview onNavigate={handleOverviewNavigate} />;

      case 'artist-department':
        return (
          <AdminDepartmentConsole
            department="Artist"
            subTab={activeSubTab}
            onSubTabChange={tab => setActiveSubTab(tab)}
            selectedClientUid={selectedClientUid}
            onSelectedClientChange={setSelectedClientUid}
            selectedWorkspaceId={selectedWorkspaceId}
            onSelectedWorkspaceChange={setSelectedWorkspaceId}
            selectedProjectId={selectedProjectId}
            selectedProjectTab={selectedProjectTab}
            projectClientFilter={projectClientFilter}
            projectWorkspaceFilter={projectWorkspaceFilter}
            projectStageFilter={projectStageFilter}
            projectOverdueOnly={projectOverdueOnly}
            onClearProjectFilters={clearProjectFilters}
            onOpenProject={(projectId, opts) => {
              setSelectedProjectId(projectId);
              if (opts?.tab) setSelectedProjectTab(opts.tab);
              if (opts?.clientUid !== undefined) setProjectClientFilter(opts.clientUid);
              if (opts?.workspaceId !== undefined) setProjectWorkspaceFilter(opts.workspaceId);
            }}
            onOpenServicePackage={packageId => {
              setSelectedServicePackageId(packageId);
              navigateTo('shared-operations', 'services-packages');
            }}
            onNavigateProduction={handleProductionNavigate}
            onCreateCreativeProductFromDesign={design => {
              setPendingProductCanvasDraft(design);
              navigateTo('creative-products', 'artist');
            }}
            designLibraryWorkspaceId={designLibraryWorkspaceId}
            designLibraryProjectId={designLibraryProjectId}
            designLibraryTab={designLibraryTab}
            onConfigureDesignLibrary={opts => handleOpenDesignLibrary(opts, 'Artist')}
          />
        );

      case 'brand-department':
        return (
          <AdminDepartmentConsole
            department="Brand"
            subTab={activeSubTab}
            onSubTabChange={tab => setActiveSubTab(tab)}
            selectedClientUid={selectedClientUid}
            onSelectedClientChange={setSelectedClientUid}
            selectedWorkspaceId={selectedWorkspaceId}
            onSelectedWorkspaceChange={setSelectedWorkspaceId}
            selectedProjectId={selectedProjectId}
            selectedProjectTab={selectedProjectTab}
            projectClientFilter={projectClientFilter}
            projectWorkspaceFilter={projectWorkspaceFilter}
            projectStageFilter={projectStageFilter}
            projectOverdueOnly={projectOverdueOnly}
            onClearProjectFilters={clearProjectFilters}
            onOpenProject={(projectId, opts) => {
              setSelectedProjectId(projectId);
              if (opts?.tab) setSelectedProjectTab(opts.tab);
              if (opts?.clientUid !== undefined) setProjectClientFilter(opts.clientUid);
              if (opts?.workspaceId !== undefined) setProjectWorkspaceFilter(opts.workspaceId);
            }}
            onOpenServicePackage={packageId => {
              setSelectedServicePackageId(packageId);
              navigateTo('shared-operations', 'services-packages');
            }}
            onNavigateProduction={handleProductionNavigate}
            onCreateCreativeProductFromDesign={design => {
              setPendingProductCanvasDraft(design);
              navigateTo('creative-products', 'brand');
            }}
            designLibraryWorkspaceId={designLibraryWorkspaceId}
            designLibraryProjectId={designLibraryProjectId}
            designLibraryTab={designLibraryTab}
            onConfigureDesignLibrary={opts => handleOpenDesignLibrary(opts, 'Brand')}
          />
        );

      case 'shared-operations':
        return (
          <AdminSharedOperations
            subTab={(activeSubTab as SharedOpsTab) || 'requests-enquiries'}
            onSubTabChange={tab => setActiveSubTab(tab)}
            selectedProjectId={selectedProjectId}
            selectedProjectTab={selectedProjectTab}
            projectClientFilter={projectClientFilter}
            projectWorkspaceFilter={projectWorkspaceFilter}
            projectStageFilter={projectStageFilter}
            projectOverdueOnly={projectOverdueOnly}
            onClearProjectFilters={clearProjectFilters}
            onNavigateProduction={handleProductionNavigate}
            onOpenClient={clientUid => {
              setSelectedClientUid(clientUid);
              navigateTo('brand-department', 'accounts-workspaces');
            }}
            onOpenWorkspace={workspaceId => {
              setSelectedWorkspaceId(workspaceId);
              navigateTo('brand-department', 'accounts-workspaces');
            }}
            onOpenDesignLibrary={opts => handleOpenDesignLibrary(opts, 'Brand')}
            selectedServicePackageId={selectedServicePackageId}
            onSelectedServicePackageChange={setSelectedServicePackageId}
          />
        );

      case 'creative-products':
        return (
          <AdminCreativeProducts
            initialCanvasDraft={pendingProductCanvasDraft}
            onConsumeInitialCanvasDraft={() => setPendingProductCanvasDraft(null)}
            initialSegment={(activeSubTab as CreativeProductsSegment) || 'all'}
            onSegmentChange={segment => setActiveSubTab(segment)}
          />
        );

      case 'finance':
        return (
          <AdminFinanceConsole
            subTab={(activeSubTab as FinanceTab) || 'overview'}
            onSubTabChange={tab => setActiveSubTab(tab)}
            selectedInvoiceId={selectedInvoiceId}
            onSelectedInvoiceChange={setSelectedInvoiceId}
            selectedProposalId={selectedProposalId}
            onSelectedProposalChange={setSelectedProposalId}
            onOpenWorkspace={workspaceId => {
              setSelectedWorkspaceId(workspaceId);
              navigateTo('brand-department', 'accounts-workspaces');
            }}
          />
        );

      case 'brand-room':
        return <BrandRoom />;

      case 'platform-settings':
        return (
          <AdminPlatformSettingsConsole
            subTab={(activeSubTab as PlatformSettingsTab) || 'administrators'}
            onSubTabChange={tab => setActiveSubTab(tab)}
          />
        );

      default:
        return <AdminHQOverview onNavigate={handleOverviewNavigate} />;
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0A0A0A] border-r border-[#1A1A1A]">
      {/* Brand Identity */}
      <div className="h-16 px-5 border-b border-[#1A1A1A] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={keedohubMarkTransparent}
            alt="KeedoHub Logo"
            referrerPolicy="no-referrer"
            className="h-7 w-7 object-contain bg-transparent shrink-0"
          />
          <span className="text-base font-black tracking-tighter text-white uppercase">
            KEEDOHUB
          </span>
          <span className="text-neutral-600">/</span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-300 truncate">
            ADMIN HQ
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 text-neutral-400 hover:text-white"
          aria-label="Close navigation menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Exact 8 Primary Sections Navigation */}
      <nav aria-label="Admin HQ navigation" className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-2.5 mb-2 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          Control Center · 8 Pillars
        </div>
        <ul className="space-y-1">
          {ADMIN_HQ_SECTIONS.map(item => {
            const Icon = SECTION_ICONS[item.id];
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectSection(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold transition-colors text-left border-l-2 ${
                    isActive
                      ? 'border-[#FF1E1E] bg-[#141414] text-white'
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#111111]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      size={15}
                      className={isActive ? 'text-[#FF1E1E] shrink-0' : 'text-neutral-500 shrink-0'}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Active Admin Session Summary */}
      <div className="border-t border-[#1A1A1A] p-4 space-y-3 shrink-0 bg-[#080808]">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">{adminName}</p>
          {adminEmail && (
            <p className="text-[11px] font-mono text-neutral-500 truncate">{adminEmail}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExitToPublic}
            className="flex-1 flex items-center justify-center gap-1.5 border border-[#242424] bg-[#121212] px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:text-white hover:border-[#3A3A3A]"
          >
            <Globe size={12} className="text-[#FF1E1E]" />
            <span>Public Site</span>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center justify-center gap-1.5 border border-[#242424] bg-[#121212] px-2.5 py-1.5 text-[11px] font-medium text-neutral-300 hover:text-white hover:border-red-900"
            title="Sign Out"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-[#F3F3F3] flex flex-col antialiased">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-[#080808]/95 backdrop-blur border-b border-[#1A1A1A] px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-[#141414]"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="font-mono uppercase tracking-wider text-neutral-500 hidden sm:inline">
                Admin HQ
              </span>
              <span className="text-neutral-600 hidden sm:inline">/</span>
              <h1 className="text-sm font-bold text-white truncate">{meta.label}</h1>
              {activeSubTab && (
                <>
                  <span className="text-neutral-600 hidden md:inline">/</span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 hidden md:inline truncate">
                    {activeSubTab.replace(/-/g, ' ')}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ProductionNotificationCenter
              uid={firebaseUser.uid}
              onSelectNotification={notification => {
                setSelectedProjectId(notification.projectId || '');
                const kind = (notification.type || '').toLowerCase();
                if (kind.includes('proposal')) {
                  if (notification.entityId) setSelectedProposalId(notification.entityId);
                  navigateTo('finance', 'proposals');
                } else if (kind.includes('invoice')) {
                  if (notification.entityId) setSelectedInvoiceId(notification.entityId);
                  navigateTo('finance', 'invoices');
                } else if (kind === 'request' || kind === 'enquiry') {
                  navigateTo('shared-operations', 'requests-enquiries');
                } else if (kind === 'deliverable' || kind === 'review' || kind === 'revision') {
                  navigateTo('shared-operations', 'qa-reviews');
                } else {
                  navigateTo('shared-operations', 'master-studio');
                }
              }}
            />
            <div className="hidden md:flex items-center gap-2 border border-[#242424] bg-[#101010] px-3 py-1.5 text-xs">
              <span className="font-medium text-white truncate max-w-[140px]">{adminName}</span>
              <span className="text-neutral-600">·</span>
              <span className="font-mono text-[10px] uppercase text-[#FF1E1E]">Admin</span>
            </div>
            <button
              type="button"
              onClick={handleExitToPublic}
              className="hidden sm:inline-flex items-center gap-1.5 border border-[#242424] bg-[#101010] px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:border-[#3A3A3A]"
            >
              <Globe size={13} className="text-[#FF1E1E]" />
              <span>Public Site</span>
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 border border-[#242424] bg-[#101010] px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:border-red-900"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          <div className="border-b border-[#1A1A1A] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
                KEEDOHUB ADMIN HQ
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-white">
                {meta.label}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-neutral-400">{meta.subtitle}</p>
            </div>
          </div>

          {renderSection()}
        </main>

        <footer className="border-t border-[#191919] bg-[#0A0A0A] px-6 py-4 mt-auto">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-500 font-mono">
            <span>KEEDOHUB ADMIN HQ · PRIVATE INTERNAL CONTROL ENVIRONMENT</span>
            <span>SESSION: {adminEmail || firebaseUser.uid}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminHQ;
