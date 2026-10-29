import React from 'react';
import { useApp } from '../../context/AppContext';
import { AppModule } from '../../types';
import { KeedohubLogo, WorkspaceLogo } from '../brand/LogoSystem';
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
  ShieldCheck
} from 'lucide-react';
import { NewWorkspaceModal } from '../modals/NewWorkspaceModal';

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

interface NavItem {
  id: AppModule;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  badgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { 
    activeModule, 
    setActiveModule, 
    artists, 
    releases, 
    documents, 
    tasks,
    productionProjects,
    canAccessProductionCenter,
    canAccessAdminCenter,
    resetToSampleData,
    clearAllData,
    activeWorkspace,
    workspaces,
    switchWorkspace,
    exitToPublic
  } = useApp();

  const [workspaceOpen, setWorkspaceOpen] = React.useState(false);
  const [isNewWorkspaceOpen, setIsNewWorkspaceOpen] = React.useState(false);

  const isArtist = activeWorkspace.clientCategory === 'artist' || activeWorkspace.type === 'Artist' || activeWorkspace.type === 'Personal';
  const isBrand = activeWorkspace.clientCategory === 'brand' || activeWorkspace.type === 'Brand' || activeWorkspace.type === 'Agency';
  const isBusiness = activeWorkspace.clientCategory === 'business' || activeWorkspace.type === 'Business' || activeWorkspace.type === 'Enterprise';
  const isLabel = activeWorkspace.clientCategory === 'label' || activeWorkspace.type === 'Label';
  const brandAccent = activeWorkspace.brand?.accentColor || (isArtist ? '#D97706' : isBrand ? '#2563EB' : isBusiness ? '#10B981' : '#FF1E1E');

  const pendingTasks = tasks.filter(t => t.status !== 'Done' && t.workspaceId === activeWorkspace.id).length;
  const pendingDocs = documents.filter(d => (d.status === 'Under Review' || d.status === 'Draft') && d.workspaceId === activeWorkspace.id).length;
  const activeProductionCount = productionProjects.filter(p => p.stage !== 'Delivered').length;

  const getNavItems = (): NavItem[] => {
    if (isArtist) {
      return [
        { id: 'dashboard', label: 'Project Status & Overview', icon: LayoutDashboard },
        { id: 'releases', label: 'Music Projects & Releases', icon: Disc3, badgeCount: releases.filter(r => r.workspaceId === activeWorkspace.id).length },
        { id: 'promotion', label: 'Promotional Artwork & Covers', icon: Music },
        { id: 'motion', label: 'Motion & Video Deliverables', icon: Film },
        { id: 'campaigns', label: 'Release Campaign Rollout', icon: Megaphone },
        { id: 'assets', label: 'Master Files & Asset Vault', icon: FolderArchive },
        { id: 'operations', label: 'Reviews, Revisions & Requests', icon: CheckSquare, badgeCount: pendingTasks > 0 ? pendingTasks : undefined },
        { id: 'export', label: 'Final Deliverables & Downloads', icon: Share2 }
      ];
    }

    if (isBrand) {
      return [
        { id: 'dashboard', label: 'Brand Pulse & Overview', icon: LayoutDashboard },
        { id: 'brand', label: 'Brand Identity & Guidelines', icon: Layers },
        { id: 'campaigns', label: 'Marketing Creatives & Social Kits', icon: Megaphone },
        { id: 'documents', label: 'Business & Brand Agreements', icon: FileText, badgeCount: pendingDocs > 0 ? pendingDocs : undefined },
        { id: 'cards', label: 'Business Stationery & Cards', icon: CreditCard },
        { id: 'assets', label: 'Brand Asset Vault', icon: FolderArchive },
        { id: 'operations', label: 'Reviews, Revisions & Requests', icon: CheckSquare, badgeCount: pendingTasks > 0 ? pendingTasks : undefined },
        { id: 'export', label: 'Final Deliverables & Downloads', icon: Share2 }
      ];
    }

    if (isBusiness) {
      return [
        { id: 'dashboard', label: 'Corporate Overview & Pulse', icon: LayoutDashboard },
        { id: 'brand', label: 'Corporate Standards & Identity', icon: Layers },
        { id: 'documents', label: 'Contracts, SOWs & Invoices', icon: FileText, badgeCount: pendingDocs > 0 ? pendingDocs : undefined },
        { id: 'cards', label: 'Staff Credentials & Stationery', icon: CreditCard },
        { id: 'campaigns', label: 'Commercial & B2B Campaigns', icon: Megaphone },
        { id: 'templates', label: 'Corporate Document Templates', icon: Sparkles },
        { id: 'assets', label: 'Corporate Asset Vault', icon: FolderArchive },
        { id: 'operations', label: 'Approvals & Change Requests', icon: CheckSquare, badgeCount: pendingTasks > 0 ? pendingTasks : undefined },
        { id: 'export', label: 'Package Exports & Deliverables', icon: Share2 }
      ];
    }

    // Flagship Master Label Suite (ws-lyrical-ent) & Record Label Workspace
    return [
      { id: 'dashboard', label: 'Label Operations & Overview', icon: LayoutDashboard },
      { id: 'brand', label: 'Brand Identity & Vector System', icon: Layers },
      { id: 'artists', label: 'Artist Roster', icon: Users, badgeCount: artists.filter(a => a.workspaceId === activeWorkspace.id).length },
      { id: 'releases', label: 'Music Catalog & Releases', icon: Disc3, badgeCount: releases.filter(r => r.workspaceId === activeWorkspace.id).length },
      { id: 'campaigns', label: 'Creative Campaign Studio', icon: Megaphone },
      { id: 'templates', label: 'Creative Templates', icon: Sparkles },
      { id: 'celebration', label: 'Celebration Calendar', icon: Calendar },
      { id: 'promotion', label: 'Music Promo Studio', icon: Music },
      { id: 'motion', label: 'Motion Studio', icon: Film },
      { id: 'cards', label: 'Business & Artist Cards', icon: CreditCard },
      { id: 'documents', label: 'Corporate & Legal Docs', icon: FileText, badgeCount: pendingDocs > 0 ? pendingDocs : undefined },
      { id: 'press', label: 'Press & Media', icon: Newspaper },
      { id: 'blogger', label: 'Blogger Studio', icon: Globe },
      { id: 'assets', label: 'Master Asset Library', icon: FolderArchive },
      { id: 'operations', label: 'Operations & Requests', icon: CheckSquare, badgeCount: pendingTasks > 0 ? pendingTasks : undefined },
      { id: 'export', label: 'Export & Handover', icon: Share2 }
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
          <KeedohubLogo height={24} theme="dark" />
        </div>
 
        {/* Workspace Selector */}
        <div className="px-3 py-4 border-b border-[#1B1B1B] bg-[#0A0A0A]">
          <div className="relative">
            <button 
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] transition-colors group"
            >
              <WorkspaceLogo 
                workspaceId={activeWorkspace.id} 
                workspaceName={activeWorkspace.name} 
                brand={activeWorkspace.brand}
                clientCategory={activeWorkspace.clientCategory}
                height={28} 
                theme="monochrome-white" 
              />
              <ChevronDown size={14} className={`ml-auto text-neutral-500 transition-transform ${workspaceOpen ? 'rotate-180' : ''}`} />
            </button>

            {workspaceOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#141414] border border-[#222222] rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-[#222222] bg-[#0D0D0D] flex items-center justify-between">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase px-1">Your Workspaces</span>
                  <span className="text-[9px] font-mono text-neutral-600">{workspaces.length} ACTIVE</span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {workspaces.map(ws => {
                    const wsIsArtist = ws.clientCategory === 'artist' || ws.type === 'Artist' || ws.type === 'Personal';
                    const wsIsBrand = ws.clientCategory === 'brand' || ws.type === 'Brand' || ws.type === 'Agency';
                    const wsIsBusiness = ws.clientCategory === 'business' || ws.type === 'Business' || ws.type === 'Enterprise';
                    const wsIsLabel = ws.clientCategory === 'label' || ws.type === 'Label';
                    const wsAccent = ws.brand?.accentColor || (wsIsArtist ? '#D97706' : wsIsBrand ? '#2563EB' : wsIsBusiness ? '#10B981' : '#FF1E1E');

                    const categoryBadge = wsIsArtist 
                      ? 'Artist Client' 
                      : wsIsBrand 
                      ? 'Brand Client' 
                      : wsIsBusiness 
                      ? 'Enterprise Client' 
                      : wsIsLabel 
                      ? 'Record Label' 
                      : 'Client Workspace';

                    return (
                      <button
                        key={ws.id}
                        onClick={() => {
                          switchWorkspace(ws.id);
                          setWorkspaceOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-[#1A1A1A] ${
                          activeWorkspace.id === ws.id ? 'bg-[#1A1A1A] text-white font-medium' : 'text-neutral-400'
                        }`}
                      >
                        <div 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: wsAccent }}
                        />
                        <div className="flex flex-col items-start leading-tight truncate">
                          <span className="truncate">{ws.name}</span>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase">
                            {categoryBadge}
                          </span>
                        </div>
                        {activeWorkspace.id === ws.id && (
                          <div 
                            className="ml-auto w-1.5 h-1.5 rounded-full" 
                            style={{ backgroundColor: wsAccent }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Create New Client Workspace */}
                <div className="p-2 border-t border-[#222222] bg-[#0A0A0A]">
                  <button
                    onClick={() => {
                      setWorkspaceOpen(false);
                      setIsNewWorkspaceOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold text-white bg-[#1A1A1A] hover:bg-[#242424] border border-[#2D2D2D] rounded-md transition-colors"
                  >
                    <Plus size={13} className="text-[#FF1E1E]" />
                    <span>New Client Workspace</span>
                  </button>
                </div>
              </div>
            )}
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
          <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-neutral-500 uppercase flex items-center justify-between">
            <span>{isArtist ? 'ARTIST WORKSPACE' : isBrand ? 'BRAND WORKSPACE' : isBusiness ? 'ENTERPRISE WORKSPACE' : 'LABEL WORKSPACE'}</span>
            <span 
              className="w-1.5 h-1.5 rounded-full" 
              style={{ backgroundColor: brandAccent }} 
            />
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
                  {activeProductionCount > 0 && (
                    <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-red-950/90 text-red-300 border border-red-900/50">
                      {activeProductionCount}
                    </span>
                  )}
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

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                if (confirm('Reset workspace with official production records?')) {
                  resetToSampleData();
                }
              }}
              title="Restore standard label records"
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium bg-[#171717] hover:bg-[#222222] text-neutral-300 rounded border border-[#242424] transition-colors"
            >
              <RefreshCw size={11} />
              <span>Reset Data</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Clear all workspace records to test clean empty states?')) {
                  clearAllData();
                }
              }}
              title="Test empty states"
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-medium bg-[#171717] hover:bg-[#222222] text-neutral-400 hover:text-red-400 rounded border border-[#242424] transition-colors"
            >
              <Trash2 size={11} />
              <span>Clear State</span>
            </button>
          </div>

          <p className="text-[10px] text-neutral-500 leading-tight pt-1">
            {activeWorkspace.name} · {activeWorkspace.type} Client v1.0
          </p>
        </div>
      </aside>

      {/* New Workspace Modal */}
      <NewWorkspaceModal
        isOpen={isNewWorkspaceOpen}
        onClose={() => setIsNewWorkspaceOpen(false)}
      />
    </>
  );
};
