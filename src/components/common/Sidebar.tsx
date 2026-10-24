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
  Building2
} from 'lucide-react';

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
    resetToSampleData,
    clearAllData,
    activeWorkspace,
    workspaces,
    switchWorkspace
  } = useApp();

  const [workspaceOpen, setWorkspaceOpen] = React.useState(false);

  const pendingTasks = tasks.filter(t => t.status !== 'Done' && t.workspaceId === activeWorkspace.id).length;
  const pendingDocs = documents.filter(d => (d.status === 'Under Review' || d.status === 'Draft') && d.workspaceId === activeWorkspace.id).length;

  const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'brand', label: 'Brand Identity', icon: Layers },
    { id: 'artists', label: 'Artist Roster', icon: Users, badgeCount: artists.filter(a => a.workspaceId === activeWorkspace.id).length },
    { id: 'releases', label: 'Music Releases', icon: Disc3, badgeCount: releases.filter(r => r.workspaceId === activeWorkspace.id).length },
    { id: 'campaigns', label: 'Campaign Studio', icon: Megaphone },
    { id: 'templates', label: 'Creative Templates', icon: Sparkles },
    { id: 'celebration', label: 'Celebration Calendar', icon: Calendar },
    { id: 'promotion', label: 'Music Promo Studio', icon: Music },
    { id: 'motion', label: 'Motion Studio', icon: Film },
    { id: 'cards', label: 'Business Cards', icon: CreditCard },
    { id: 'documents', label: 'Corporate Docs', icon: FileText, badgeCount: pendingDocs > 0 ? pendingDocs : undefined },
    { id: 'press', label: 'Press & Media', icon: Newspaper },
    { id: 'blogger', label: 'Blogger Studio', icon: Globe },
    { id: 'assets', label: 'Asset Library', icon: FolderArchive },
    { id: 'operations', label: 'Operations', icon: CheckSquare, badgeCount: pendingTasks > 0 ? pendingTasks : undefined },
    { id: 'export', label: 'Export & Handover', icon: Share2 }
  ];

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
                height={28} 
                theme="monochrome-white" 
              />
              <ChevronDown size={14} className={`ml-auto text-neutral-500 transition-transform ${workspaceOpen ? 'rotate-180' : ''}`} />
            </button>

            {workspaceOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#141414] border border-[#222222] rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-[#222222] bg-[#0D0D0D]">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase px-2">Your Workspaces</span>
                </div>
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setWorkspaceOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors hover:bg-[#1A1A1A] ${
                      activeWorkspace.id === ws.id ? 'bg-[#1A1A1A] text-white' : 'text-neutral-400'
                    }`}
                  >
                    <Building2 size={14} />
                    <span className="truncate">{ws.name}</span>
                    {activeWorkspace.id === ws.id && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF1E1E]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
            WORKSPACE MODULES
          </div>

          {NAV_ITEMS.map((item) => {
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
                  <Icon size={16} className={isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'} />
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
                if (confirm('Reset workspace with official LYRICAL ENT production records?')) {
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
            Production environment v1.0. Records auto-sync to local storage.
          </p>
        </div>
      </aside>
    </>
  );
};
