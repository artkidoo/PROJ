import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, AppModule } from '../../types';
import { WorkspaceLogo } from '../brand/LogoSystem';
import { 
  Search, 
  Plus, 
  Menu, 
  X, 
  ShieldCheck, 
  Sliders,
  Database,
  LogIn,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const MODULE_NAMES: Record<AppModule, string> = {
  dashboard: 'Overview Dashboard',
  brand: 'Brand Identity Manager',
  documents: 'Corporate Documents',
  artists: 'Artist Roster Management',
  releases: 'Music Release Command Center',
  campaigns: 'Creative Campaign Studio',
  templates: 'Advanced Creative Template Library',
  celebration: 'Celebration Calendar & Workflow',
  promotion: 'Music Promotion Pack Studio',
  motion: 'Motion Studio & Animated Assets',
  cards: 'Business Identity Studio',
  press: 'Press & Media Hub',
  blogger: 'Blogger Website Studio',
  assets: 'Digital Asset Library',
  operations: 'Operations & Workflow',
  export: 'Export & Handover'
};

const ROLES: UserRole[] = [
  'Executive',
  'A&R Director',
  'Creative Director',
  'Label Manager',
  'Legal & Business Affairs'
];

export const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { 
    activeModule, 
    currentRole, 
    setCurrentRole, 
    searchQuery, 
    setSearchQuery,
    openQuickAction,
    releases,
    documents,
    activeWorkspace,
    currentUser,
    isAuthenticated,
    loginWithGoogle,
    logout
  } = useApp();

  const pendingApprovals = releases.filter(r => (r.distributionStatus === 'Metadata Verification' || !r.checklist.artworkApproved) && r.workspaceId === activeWorkspace.id).length;
  const pendingDocs = documents.filter(d => (d.status === 'Under Review' || d.status === 'Draft') && d.workspaceId === activeWorkspace.id).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080808]/95 backdrop-blur border-b border-[#1F1F1F] px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile toggle + Breadcrumb trail */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-neutral-400 hover:text-white hover:bg-[#171717] rounded-md transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2.5 text-xs md:text-sm font-medium tracking-tight min-w-0">
          <WorkspaceLogo 
            workspaceId={activeWorkspace.id} 
            workspaceName={activeWorkspace.name} 
            height={22} 
            theme="monochrome-white" 
            className="shrink-0"
          />
          <span className="text-neutral-600 shrink-0">/</span>
          <span className="text-neutral-300 font-medium truncate">{MODULE_NAMES[activeModule]}</span>
        </div>
      </div>

      {/* Zone 2: Search + Contextual Status + Role selector */}
      <div className="hidden sm:flex items-center gap-3 max-w-md w-full justify-end">
        {/* Search Input */}
        <div className="relative w-44 md:w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search artists, releases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-[#242424] text-xs text-neutral-200 placeholder-neutral-500 rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:border-neutral-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Role Selector (Simulating authenticated workspace permission levels) */}
        <div className="flex items-center gap-1.5 bg-[#121212] border border-[#242424] rounded-md px-2.5 py-1">
          <ShieldCheck size={13} className="text-neutral-400 shrink-0" />
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="bg-transparent text-xs text-neutral-300 focus:outline-none cursor-pointer pr-1"
            title="Switch Workspace Role"
          >
            {ROLES.map(role => (
              <option key={role} value={role} className="bg-[#121212] text-neutral-200">
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zone 3: Primary Action Button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => openQuickAction('release')}
          className="hidden xs:flex items-center gap-1.5 bg-white text-black hover:bg-neutral-200 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shadow-sm active:scale-[0.98]"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Entry</span>
        </button>

        <div className="h-8 w-px bg-[#1F1F1F] mx-1 hidden sm:block"></div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-[#121212] border border-[#242424]">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover border border-[#333]" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-600 flex items-center justify-center text-[10px] font-bold border border-[#333]">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-[11px] font-bold text-white truncate max-w-[110px]">{currentUser.name}</span>
                <span className="text-[9px] text-[#FF1E1E] font-mono tracking-tighter">VERIFIED PRO</span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out of Firebase"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#1A1A1A] rounded-md transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => loginWithGoogle()}
            className="flex items-center gap-2 bg-[#FF1E1E] hover:bg-[#E01818] text-white px-3 py-1.5 text-xs font-semibold rounded-md transition-all shadow-sm active:scale-[0.98]"
          >
            <LogIn size={14} />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
