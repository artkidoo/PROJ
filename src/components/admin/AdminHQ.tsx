import React, { useEffect, useState } from 'react';
import {
  Building2,
  Clapperboard,
  FileCheck2,
  FileText,
  FolderKanban,
  Globe,
  History,
  Inbox,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionNotificationCenter } from '../common/ProductionNotificationCenter';
import { AdminControlCenter } from '../modules/AdminControlCenter';
import { AdminHQOverview, AdminHQOverviewTarget } from './AdminHQOverview';
import {
  AdminProduction,
  AdminProductionNavigateOptions,
  AdminProductionSection,
} from './AdminProduction';
import { ClientsDirectory } from './ClientsDirectory';
import { ServicesPackagesManagement } from './ServicesPackagesManagement';
import { WorkspacesManagement } from './WorkspacesManagement';
import { AdminInvoicesManagement } from './AdminInvoicesManagement';
import { AdminProposalsManagement } from './AdminProposalsManagement';
import { AdminManagement } from './AdminManagement';
import { SecurityAccessManagement } from './SecurityAccessManagement';
import { AuditHistoryManagement } from './AuditHistoryManagement';
import { CorporateDocuments } from '../modules/CorporateDocuments';
import { PlatformSettingsManagement } from './PlatformSettingsManagement';

export type AdminHQSection =
  | 'hq-overview'
  | 'clients-accounts'
  | 'workspaces'
  | 'services-packages'
  | 'production-studio'
  | 'projects'
  | 'deliverables-reviews'
  | 'creative-requests'
  | 'invoices-payments'
  | 'proposals'
  | 'business-documents'
  | 'admin-management'
  | 'security-access'
  | 'audit-history'
  | 'platform-settings';

interface NavItem {
  id: AdminHQSection;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  implemented: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const ADMIN_HQ_NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { id: 'hq-overview', label: 'HQ Overview', icon: LayoutDashboard, implemented: true },
    ],
  },
  {
    group: 'Platform',
    items: [
      { id: 'clients-accounts', label: 'Clients & Accounts', icon: Users, implemented: true },
      { id: 'workspaces', label: 'Workspaces', icon: Building2, implemented: true },
      { id: 'services-packages', label: 'Services & Packages', icon: Package, implemented: true },
    ],
  },
  {
    group: 'Creative Operations',
    items: [
      { id: 'production-studio', label: 'Production Studio', icon: Clapperboard, implemented: true },
      { id: 'projects', label: 'Projects', icon: FolderKanban, implemented: true },
      { id: 'deliverables-reviews', label: 'Deliverables & Reviews', icon: FileCheck2, implemented: true },
      { id: 'creative-requests', label: 'Creative Requests', icon: Inbox, implemented: true },
    ],
  },
  {
    group: 'Business',
    items: [
      { id: 'invoices-payments', label: 'Invoices & Payments', icon: Receipt, implemented: true },
      { id: 'proposals', label: 'Proposals', icon: FileText, implemented: true },
      { id: 'business-documents', label: 'Business Documents', icon: FileText, implemented: true },
    ],
  },
  {
    group: 'Administration',
    items: [
      { id: 'admin-management', label: 'Administrator Management', icon: ShieldCheck, implemented: true },
      { id: 'security-access', label: 'Security & Access', icon: Lock, implemented: true },
      { id: 'audit-history', label: 'Audit History', icon: History, implemented: true },
      { id: 'platform-settings', label: 'Platform Settings', icon: Settings, implemented: true },
    ],
  },
];

const SECTION_DESCRIPTIONS: Record<AdminHQSection, { title: string; group: string; subtitle: string }> = {
  'hq-overview': {
    title: 'HQ Overview',
    group: 'Overview',
    subtitle: 'Live platform metrics, production queues, and recent administrative activity.',
  },
  'clients-accounts': {
    title: 'Clients & Accounts',
    group: 'Platform',
    subtitle: 'Registered client profiles, onboarding status, profile updates, and account suspension controls.',
  },
  workspaces: {
    title: 'Workspaces',
    group: 'Platform',
    subtitle: 'Unified Artist and Brand workspaces, ownership and membership inspection, lifecycle statuses, and contracted services.',
  },
  'services-packages': {
    title: 'Services & Packages',
    group: 'Platform',
    subtitle: 'Service catalog packages, tiers, turnaround timelines, and active availability.',
  },
  'production-studio': {
    title: 'Production Studio',
    group: 'Creative Operations',
    subtitle: 'Full creative production environment covering requests, deliverables, tasks, and notes.',
  },
  projects: {
    title: 'Projects',
    group: 'Creative Operations',
    subtitle: 'Production project directory, assignments, tasks, internal notes, and stage progression.',
  },
  'deliverables-reviews': {
    title: 'Deliverables & Reviews',
    group: 'Creative Operations',
    subtitle: 'Cross-project deliverable review queue and client revision requests.',
  },
  'creative-requests': {
    title: 'Creative Requests',
    group: 'Creative Operations',
    subtitle: 'Incoming client creative briefs and public service enquiries awaiting review.',
  },
  'invoices-payments': {
    title: 'Invoices & Payments',
    group: 'Business',
    subtitle: 'Scheduled for a later Admin HQ phase.',
  },
  proposals: {
    title: 'Proposals',
    group: 'Business',
    subtitle: 'Scheduled for a later Admin HQ phase.',
  },
  'business-documents': {
    title: 'Business Documents',
    group: 'Business',
    subtitle: 'Scheduled for a later Admin HQ phase.',
  },
  'admin-management': {
    title: 'Administrator Management',
    group: 'Administration',
    subtitle: 'Manage platform administrator role grants and revocations via audited Cloud Functions.',
  },
  'security-access': {
    title: 'Security & Access',
    group: 'Administration',
    subtitle: 'Role-based access control architecture and active Firestore enforcement summary.',
  },
  'audit-history': {
    title: 'Audit History',
    group: 'Administration',
    subtitle: 'Server-recorded administrative audit trail across roles, clients, services, and requests.',
  },
  'platform-settings': {
    title: 'Platform Settings',
    group: 'Administration',
    subtitle: 'Scheduled for a later Admin HQ phase.',
  },
};

const DeferredPhaseNotice: React.FC<{
  title: string;
  details: string;
  onReturnOverview: () => void;
}> = ({ title, details, onReturnOverview }) => (
  <section className="border border-[#1E1E1E] bg-[#0C0C0C] p-6 sm:p-8 max-w-2xl">
    <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
      Scheduled for later phase
    </p>
    <h2 className="mt-2 text-lg font-bold text-white">{title}</h2>
    <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{details}</p>
    <div className="mt-5">
      <button
        type="button"
        onClick={onReturnOverview}
        className="border border-[#2E2E2E] bg-[#141414] px-4 py-2 text-xs font-semibold text-white hover:border-[#FF1E1E] transition-colors"
      >
        Return to HQ Overview
      </button>
    </div>
  </section>
);

export const AdminHQ: React.FC = () => {
  const {
    firebaseUser,
    clientProfile,
    canAccessAdminCenter,
    logout,
    exitToPublic,
  } = useApp();

  const [activeSection, setActiveSection] = useState<AdminHQSection>('hq-overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProjectTab, setSelectedProjectTab] = useState<'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity'>('overview');
  const [projectClientFilter, setProjectClientFilter] = useState('');
  const [projectWorkspaceFilter, setProjectWorkspaceFilter] = useState('');
  const [projectStageFilter, setProjectStageFilter] = useState('All');
  const [projectOverdueOnly, setProjectOverdueOnly] = useState(false);
  const [selectedClientUid, setSelectedClientUid] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedServicePackageId, setSelectedServicePackageId] = useState('');

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

  const selectSection = (section: AdminHQSection) => {
    setActiveSection(section);
    if (section !== 'projects') {
      setProjectClientFilter('');
      setProjectWorkspaceFilter('');
      setProjectStageFilter('All');
      setProjectOverdueOnly(false);
    }
    setSelectedProjectId('');
    setSelectedProjectTab('overview');
    setMobileMenuOpen(false);
  };

  const handleOverviewNavigate = (target: AdminHQOverviewTarget, projectId?: string) => {
    setSelectedProjectId(projectId || '');
    setSelectedProjectTab(target === 'deliverables-reviews' ? 'deliverables' : 'overview');
    setProjectClientFilter('');
    setProjectWorkspaceFilter('');
    setProjectStageFilter('All');
    setProjectOverdueOnly(false);
    setActiveSection(target);
  };

  const handleProductionNavigate = (
    targetSection: AdminProductionSection,
    options?: AdminProductionNavigateOptions
  ) => {
    if (options?.clearFilters) {
      setProjectClientFilter('');
      setProjectWorkspaceFilter('');
      setProjectStageFilter('All');
      setProjectOverdueOnly(false);
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

    const sectionMap: Record<AdminProductionSection, AdminHQSection> = {
      studio: 'production-studio',
      projects: 'projects',
      reviews: 'deliverables-reviews',
      requests: 'creative-requests',
    };
    setActiveSection(sectionMap[targetSection]);
  };

  const meta = SECTION_DESCRIPTIONS[activeSection];

  const renderSection = () => {
    switch (activeSection) {
      case 'hq-overview':
        return <AdminHQOverview onNavigate={handleOverviewNavigate} />;

      case 'clients-accounts':
        return (
          <div className="space-y-4">
            <p className="text-xs text-neutral-400">
              Select a client row to open account details, workspace association, audit history, and actions, or jump directly to their production projects.
            </p>
            <ClientsDirectory
              initialSelectedUid={selectedClientUid}
              onSelectedClientChange={uid => setSelectedClientUid(uid || '')}
              onOpenWorkspace={(workspaceId, clientUid) => {
                setSelectedClientUid(clientUid);
                setSelectedWorkspaceId(workspaceId);
                setActiveSection('workspaces');
              }}
              onViewClientProjects={uid => {
                setSelectedClientUid(uid);
                setProjectClientFilter(uid);
                setProjectWorkspaceFilter('');
                setSelectedProjectId('');
                setActiveSection('projects');
              }}
            />
          </div>
        );

      case 'workspaces':
        return (
          <WorkspacesManagement
            initialSelectedWorkspaceId={selectedWorkspaceId}
            onSelectedWorkspaceChange={workspaceId => setSelectedWorkspaceId(workspaceId || '')}
            onOpenClient={(clientUid, workspaceId) => {
              setSelectedWorkspaceId(workspaceId);
              setSelectedClientUid(clientUid);
              setActiveSection('clients-accounts');
            }}
            onViewWorkspaceProjects={workspaceId => {
              setSelectedWorkspaceId(workspaceId);
              setProjectWorkspaceFilter(workspaceId);
              setProjectClientFilter('');
              setSelectedProjectId('');
              setActiveSection('projects');
            }}
            onOpenServicePackage={packageId => {
              setSelectedServicePackageId(packageId);
              setActiveSection('services-packages');
            }}
          />
        );

      case 'services-packages':
        return (
          <ServicesPackagesManagement
            initialSelectedPackageId={selectedServicePackageId}
            onSelectedPackageChange={packageId => setSelectedServicePackageId(packageId || '')}
            onOpenWorkspace={workspaceId => {
              setSelectedWorkspaceId(workspaceId);
              setActiveSection('workspaces');
            }}
          />
        );

      case 'production-studio':
        return (
          <AdminProduction
            section="studio"
            embeddedMode
            initialTab={selectedProjectTab}
            onNavigateSection={handleProductionNavigate}
            onOpenClient={clientUid => {
              setSelectedClientUid(clientUid);
              setActiveSection('clients-accounts');
            }}
            onOpenWorkspace={workspaceId => {
              setSelectedWorkspaceId(workspaceId);
              setActiveSection('workspaces');
            }}
          />
        );

      case 'projects':
        return (
          <AdminProduction
            section="projects"
            embeddedMode
            initialProjectId={selectedProjectId}
            initialTab={selectedProjectTab}
            filterClientUid={projectClientFilter}
            filterWorkspaceId={projectWorkspaceFilter}
            initialStageFilter={projectStageFilter}
            initialOverdueOnly={projectOverdueOnly}
            onClearFilter={() => {
              setProjectClientFilter('');
              setProjectWorkspaceFilter('');
              setProjectStageFilter('All');
              setProjectOverdueOnly(false);
            }}
            onNavigateSection={handleProductionNavigate}
            onOpenClient={clientUid => {
              setSelectedClientUid(clientUid);
              setActiveSection('clients-accounts');
            }}
            onOpenWorkspace={workspaceId => {
              setSelectedWorkspaceId(workspaceId);
              setActiveSection('workspaces');
            }}
          />
        );

      case 'deliverables-reviews':
        return (
          <AdminProduction
            section="reviews"
            embeddedMode
            initialProjectId={selectedProjectId}
            initialTab={selectedProjectTab}
            onNavigateSection={handleProductionNavigate}
            onOpenClient={clientUid => {
              setSelectedClientUid(clientUid);
              setActiveSection('clients-accounts');
            }}
            onOpenWorkspace={workspaceId => {
              setSelectedWorkspaceId(workspaceId);
              setActiveSection('workspaces');
            }}
          />
        );

      case 'creative-requests':
        return (
          <AdminProduction
            section="requests"
            embeddedMode
            initialProjectId={selectedProjectId}
            initialTab={selectedProjectTab}
            onNavigateSection={handleProductionNavigate}
            onOpenClient={clientUid => {
              setSelectedClientUid(clientUid);
              setActiveSection('clients-accounts');
            }}
            onOpenWorkspace={workspaceId => {
              setSelectedWorkspaceId(workspaceId);
              setActiveSection('workspaces');
            }}
          />
        );

      case 'invoices-payments':
        return (
          <AdminInvoicesManagement
            onOpenWorkspace={workspaceId => {
              setSelectedWorkspaceId(workspaceId);
              setActiveSection('workspaces');
            }}
          />
        );

      case 'proposals':
        return (
          <AdminProposalsManagement />
        );

      case 'business-documents':
        return <CorporateDocuments />;

      case 'admin-management':
        return <AdminManagement />;

      case 'security-access':
        return <SecurityAccessManagement />;

      case 'audit-history':
        return <AuditHistoryManagement />;

      case 'platform-settings':
        return <PlatformSettingsManagement />;

      default:
        return <AdminHQOverview onNavigate={handleOverviewNavigate} />;
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0A0A0A] border-r border-[#1A1A1A]">
      {/* Brand Identity */}
      <div className="h-16 px-5 border-b border-[#1A1A1A] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base font-black tracking-tighter text-white uppercase">
            KEEDO<span className="text-[#FF1E1E]">HUB</span>
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

      {/* Navigation Groups */}
      <nav aria-label="Admin HQ navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {ADMIN_HQ_NAV.map(group => (
          <div key={group.group}>
            <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              {group.group}
            </div>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectSection(item.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs font-medium transition-colors text-left border-l-2 ${
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
                      {!item.implemented && (
                        <span className="text-[9px] font-mono uppercase text-neutral-500 shrink-0">
                          Planned
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
            onClick={() => exitToPublic()}
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
              <span className="font-mono uppercase tracking-wider text-neutral-400 hidden md:inline">
                {meta.group}
              </span>
              <span className="text-neutral-600 hidden md:inline">/</span>
              <h1 className="text-sm font-bold text-white truncate">{meta.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <ProductionNotificationCenter
              uid={firebaseUser.uid}
              onSelectNotification={notification => {
                setSelectedProjectId(notification.projectId || '');
                const kind = (notification.type || '').toLowerCase();
                if (kind === 'request' || kind === 'enquiry') {
                  setActiveSection('creative-requests');
                } else if (kind === 'deliverable' || kind === 'review' || kind === 'revision') {
                  setActiveSection('deliverables-reviews');
                } else {
                  setActiveSection('projects');
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
              onClick={() => exitToPublic()}
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
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                {meta.group}
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-white">
                {meta.title}
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
