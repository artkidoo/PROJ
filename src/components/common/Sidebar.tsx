import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppModule } from '../../types';
import { 
  LayoutDashboard, 
  Layers, 
  FileText, 
  Users, 
  Disc3, 
  Megaphone, 
  FileCheck2, 
  Newspaper, 
  Globe, 
  FolderArchive, 
  CheckSquare, 
  Share2,
  Sparkles,
  Calendar,
  Music,
  Film,
  CreditCard,
  RefreshCw,
  Trash2,
  ChevronRight,
  ChevronDown,
  Building2,
  ArrowLeft,
  Plus,
  Briefcase,
  ShieldCheck,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { ClientProfile } from '../../types';
import { KeedohubLogo } from '../brand/KeedohubLogo';

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

interface NavItem {
  id: AppModule;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  badgeCount?: number;
  description?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { 
    activeModule, 
    setActiveModule, 
    artists, 
    releases, 
    documents, 
    tasks,
    canAccessProductionCenter,
    canAccessAdminCenter,
    clientProfile,
    activeWorkspace,
    workspaces,
    exitToPublic,
    logout
  } = useApp();

  const accountType = clientProfile?.accountType;
  const isArtist = accountType === 'Artist';
  const isBrand = accountType === 'Brand';
  const isBusiness = accountType === 'Company';
  const brandAccent = isArtist ? '#D97706' : isBrand ? '#2563EB' : isBusiness ? '#10B981' : '#FF1E1E';

  const pendingTasks = tasks.filter(t => t.status !== 'Done' && t.workspaceId === activeWorkspace.id).length;
  const pendingDocs = documents.filter(d => (d.status === 'Under Review' || d.status === 'Draft') && d.workspaceId === activeWorkspace.id).length;

  const getNavItems = (): NavItem[] => {
    const account = accountType;
    const showBadge = (count: number) => (count > 0 ? count : undefined);

    if (account === 'Artist') {
      return [
        { id: 'dashboard', label: 'Project Status & Overview', icon: LayoutDashboard, description: 'Active projects, production stages, and timeline overview' },
        { id: 'releases', label: 'Music & Releases', icon: Disc3, badgeCount: showBadge(releases.filter(r => r.workspaceId === activeWorkspace.id).length), description: 'Singles, EPs, albums, release metadata, and artwork' },
        { id: 'assets', label: 'Asset Library', icon: FolderArchive, description: 'Approved cover art, photography, visualizers, and downloads' },
        { id: 'operations', label: 'Reviews, Revisions & Requests', icon: CheckSquare, badgeCount: showBadge(pendingTasks), description: 'Review revision requests, respond to feedback' },
        { id: 'deliverables', label: 'Deliverables', icon: FileCheck2, description: 'Review published outputs, download finals, or request revisions' },
        { id: 'updates', label: 'Updates & Revisions', icon: RefreshCw, description: 'Chronological production timeline and revision responses' },
        { id: 'profile', label: 'My Profile & Settings', icon: User }
      ];
    }

    if (account === 'Brand' || account === 'Company') {
      const isCompany = account === 'Company';
      return [
        { id: 'dashboard', label: isCompany ? 'Company Overview' : 'Brand Overview', icon: LayoutDashboard, description: 'Workspace summary, active work, and quick actions' },
        { id: 'brand', label: 'Brand Identity & Creative System', icon: Layers, description: 'Logo lockups, color palette, typography, and brand rules' },
        { id: 'documents', label: 'Business Documents', icon: FileText, badgeCount: showBadge(pendingDocs), description: 'Proposals, commercial invoices, and corporate documents' },
        { id: 'assets', label: isCompany ? 'Asset Library' : 'Brand Asset Library', icon: FolderArchive, description: 'Approved logos, brand graphics, photography, and downloads' },
        { id: 'operations', label: 'Reviews, Revisions & Requests', icon: CheckSquare, badgeCount: showBadge(pendingTasks), description: 'Review revision requests, respond to feedback' },
        { id: 'deliverables', label: 'Deliverables', icon: FileCheck2, description: 'Review published outputs, download finals, or request revisions' },
        { id: 'updates', label: 'Updates & Revisions', icon: RefreshCw, description: 'Chronological production timeline and revision responses' },
        { id: 'profile', label: 'My Profile & Settings', icon: User }
      ];
    }

    // Unclassified account: show the personal profile shell so the client is never left
    // without a routing destination.
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'profile', label: 'My Profile & Settings', icon: User }
    ];
  };


  const navItems = getNavItems();

  const handleSelect = (id: AppModule) => {
    setActiveModule(id);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#090909] border-r border-[#1B1B1B] flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Keedohub Platform Header */}
        <div className="px-5 py-4 border-b border-[#1B1B1B]">
          <KeedohubLogo size={24} theme="monochrome-white" />
        </div>
 
      {/* Account Profile Control */}
      <div className="px-3 pb-3 pt-2 border-t border-[#1B1B1B] bg-[#0A0A0A]">
        <div className="flex items-center gap-3 px-2">
          <div className="flex items-center gap-3 flex-1 text-left min-w-0">
            <button type="button" onClick={() => handleSelect('profile')} className="flex items-center gap-3 flex-1 text-left min-w-0" aria-label="My Profile &amp; Settings">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF1E1E] to-[#FF7A7A] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {clientProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {clientProfile?.displayName || 'Account'}
                </p>
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                  {accountType === 'Artist' ? 'Artist' : accountType === 'Brand' ? 'Brand' : accountType === 'Company' ? 'Company' : 'Client'}
                </p>
              </div>
            </button>
            <button type="button" onClick={() => handleSelect('profile')} className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-neutral-400 hover:text-white hover:bg-[#141414] rounded-md transition-colors" aria-label="Open My Profile &amp; Settings">
              <Settings size={13} />
            </button>
          </div>
        </div>
      </div>

        {/* Return to Public Portal */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => {
              exitToPublic();
              if (mobileMenuOpen) setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-neutral-300 hover:text-white bg-[#121212] hover:bg-[#1A1A1A] border border-[#222222] transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <ArrowLeft size={14} className="text-[#FF1E1E] group-hover:-translate-x-0.5 transition-transform" />
              <span>Public Homepage</span>
            </div>
            <Globe size={13} className="text-neutral-500" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono tracking-widest uppercase flex items-center justify-between" style={{ color: brandAccent }}>
            <span>{isArtist ? 'ARTIST WORKSPACE' : isBrand ? 'BRAND WORKSPACE' : isBusiness ? 'COMPANY WORKSPACE' : 'CLIENT WORKSPACE'}</span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all group ${
                  isActive 
                    ? 'bg-[#181818] text-white font-semibold' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#121212]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon 
                    size={16} 
                    className={isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'} 
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badgeCount !== undefined && (
                  <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                    isActive ? 'text-white bg-[#262626]' : 'text-neutral-500'
                  }`}>
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Dedicated Platform Operator Console (Decoupled from client workspace identity) */}
          {(canAccessProductionCenter || canAccessAdminCenter) && (
            <div className="pt-3 mt-3 border-t border-[#1C1C1C] space-y-1">
              <div className="px-3 pb-1.5 text-[9px] font-mono tracking-widest text-red-400 uppercase flex items-center justify-between">
                <span>OPERATOR CONSOLE</span>
                <span className="px-1 py-0.2 bg-red-950/80 border border-red-800/60 rounded text-[8px] text-red-300 font-bold">STAFF</span>
              </div>

              {canAccessProductionCenter && (
                <button
                  onClick={() => handleSelect('production')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all group ${
                    activeModule === 'production' 
                      ? 'bg-[#1C1212] text-white font-semibold border border-red-900/60 shadow-sm' 
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#141212]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Briefcase size={16} className={activeModule === 'production' ? 'text-red-400' : 'text-neutral-500 group-hover:text-neutral-300'} />
                    <span className="truncate">Production Center</span>
                  </div>
                </button>
              )}

              {canAccessAdminCenter && (
                <button
                  onClick={() => handleSelect('admin')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all group ${
                    activeModule === 'admin' 
                      ? 'bg-[#1C1212] text-white font-semibold border border-red-900/60 shadow-sm' 
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#141212]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <ShieldCheck size={16} className={activeModule === 'admin' ? 'text-red-400' : 'text-neutral-500 group-hover:text-neutral-300'} />
                    <span className="truncate">Admin Control Center</span>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-[#1C1C1C] text-neutral-400">
                    {workspaces.length}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Database state management / Real empty-state toggle */}
        <div className="p-4 border-t border-[#1B1B1B] bg-[#0C0C0C] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>DATABASE MODE</span>
            <span className="text-white">LOCAL PERSISTENT</span>
          </div>

          <p className="text-[10px] text-neutral-500 leading-tight">
            {activeWorkspace.name} · {activeWorkspace.type} Client v1.0
          </p>
        </div>
      </aside>

    </>
  );
};

