/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KEEDOHUB — Admin HQ Artist & Brand Department Consoles
 */

import React, { useState } from 'react';
import {
  Building2,
  Disc3,
  FileCheck2,
  FileText,
  FolderKanban,
  Layers,
  Users,
} from 'lucide-react';
import type {
  ArtistDeptTab,
  BrandDeptTab,
} from '../../lib/adminHQNavigation';
import type { CanvasDesign } from '../../types/designStudio';
import { ClientsDirectory } from './ClientsDirectory';
import { WorkspacesManagement } from './WorkspacesManagement';
import {
  AdminProduction,
  type AdminProductionNavigateOptions,
  type AdminProductionSection,
} from './AdminProduction';
import { AdminDesignLibrary, type DesignLibraryTab } from './AdminDesignLibrary';
import { CorporateDocuments } from '../modules/CorporateDocuments';
import { AdminArtistReleasesPanel } from './AdminArtistReleasesPanel';

interface AdminDepartmentConsoleProps {
  department: 'Artist' | 'Brand';
  subTab: string;
  onSubTabChange: (subTab: string) => void;
  selectedClientUid: string;
  onSelectedClientChange: (uid: string) => void;
  selectedWorkspaceId: string;
  onSelectedWorkspaceChange: (workspaceId: string) => void;
  selectedProjectId: string;
  selectedProjectTab: 'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity';
  projectClientFilter: string;
  projectWorkspaceFilter: string;
  projectStageFilter: string;
  projectOverdueOnly: boolean;
  onClearProjectFilters: () => void;
  onOpenProject: (
    projectId: string,
    options?: {
      tab?: 'overview' | 'tasks' | 'deliverables' | 'notes' | 'revisions' | 'activity';
      clientUid?: string;
      workspaceId?: string;
    },
  ) => void;
  onOpenServicePackage: (packageId: string) => void;
  onNavigateProduction: (
    section: AdminProductionSection,
    options?: AdminProductionNavigateOptions,
  ) => void;
  onCreateCreativeProductFromDesign: (design: CanvasDesign) => void;
  designLibraryWorkspaceId: string;
  designLibraryProjectId: string;
  designLibraryTab: DesignLibraryTab;
  onConfigureDesignLibrary: (options?: {
    workspaceId?: string;
    projectId?: string;
    tab?: DesignLibraryTab;
  }) => void;
}

const ARTIST_TABS: {
  id: ArtistDeptTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'accounts-workspaces', label: 'Accounts & Workspaces', icon: Users },
  { id: 'requests-projects', label: 'Requests & Projects', icon: FolderKanban },
  { id: 'releases', label: 'Releases', icon: Disc3 },
  { id: 'deliverables-reviews', label: 'Deliverables & Reviews', icon: FileCheck2 },
  { id: 'templates-documents', label: 'Templates & Documents', icon: Layers },
];

const BRAND_TABS: {
  id: BrandDeptTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: 'accounts-workspaces', label: 'Accounts & Workspaces', icon: Users },
  { id: 'requests-projects', label: 'Requests & Projects', icon: FolderKanban },
  { id: 'deliverables-reviews', label: 'Deliverables & Reviews', icon: FileCheck2 },
  { id: 'templates-collateral', label: 'Templates & Collateral', icon: Layers },
];

export const AdminDepartmentConsole: React.FC<AdminDepartmentConsoleProps> = ({
  department,
  subTab,
  onSubTabChange,
  selectedClientUid,
  onSelectedClientChange,
  selectedWorkspaceId,
  onSelectedWorkspaceChange,
  selectedProjectId,
  selectedProjectTab,
  projectClientFilter,
  projectWorkspaceFilter,
  projectStageFilter,
  projectOverdueOnly,
  onClearProjectFilters,
  onOpenProject,
  onOpenServicePackage,
  onNavigateProduction,
  onCreateCreativeProductFromDesign,
  designLibraryWorkspaceId,
  designLibraryProjectId,
  designLibraryTab,
  onConfigureDesignLibrary,
}) => {
  const [directoryView, setDirectoryView] = useState<'accounts' | 'workspaces'>('accounts');
  const [assetsView, setAssetsView] = useState<'templates' | 'documents'>('templates');

  const tabs = department === 'Artist' ? ARTIST_TABS : BRAND_TABS;
  const activeTab = tabs.some(t => t.id === subTab) ? subTab : tabs[0].id;

  const openDeptWorkspace = (workspaceId: string, clientUid?: string) => {
    if (clientUid) onSelectedClientChange(clientUid);
    onSelectedWorkspaceChange(workspaceId);
    setDirectoryView('workspaces');
    onSubTabChange('accounts-workspaces');
  };

  const openDeptClient = (clientUid: string, workspaceId?: string) => {
    if (workspaceId) onSelectedWorkspaceChange(workspaceId);
    onSelectedClientChange(clientUid);
    setDirectoryView('accounts');
    onSubTabChange('accounts-workspaces');
  };

  const openDeptDesignLibrary = (options?: {
    workspaceId?: string;
    projectId?: string;
    tab?: DesignLibraryTab;
  }) => {
    onConfigureDesignLibrary(options);
    setAssetsView('templates');
    onSubTabChange(department === 'Artist' ? 'templates-documents' : 'templates-collateral');
  };

  return (
    <div className="space-y-5">
      {/* Department Sub-Navigation Bar */}
      <div
        role="tablist"
        aria-label={`${department} Department subsections`}
        className="border border-[#1E1E1E] bg-[#0B0B0B] px-2 pt-2 flex flex-wrap items-center gap-1"
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSubTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-[#FF1E1E] bg-[#141414] text-white'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-[#101010]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#FF1E1E]' : 'text-neutral-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Accounts & Workspaces */}
      {activeTab === 'accounts-workspaces' && (
        <div className="space-y-4">
          <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDirectoryView('accounts')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  directoryView === 'accounts'
                    ? 'border-[#FF1E1E] bg-[#181818] text-white'
                    : 'border-[#262626] bg-[#101010] text-neutral-400 hover:text-white'
                }`}
              >
                <Users size={13} className={directoryView === 'accounts' ? 'text-[#FF1E1E]' : ''} />
                <span>{department} Accounts</span>
              </button>
              <button
                type="button"
                onClick={() => setDirectoryView('workspaces')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  directoryView === 'workspaces'
                    ? 'border-[#FF1E1E] bg-[#181818] text-white'
                    : 'border-[#262626] bg-[#101010] text-neutral-400 hover:text-white'
                }`}
              >
                <Building2 size={13} className={directoryView === 'workspaces' ? 'text-[#FF1E1E]' : ''} />
                <span>{department} Workspaces</span>
              </button>
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              {department === 'Artist'
                ? 'Scoped to canonical Artist accounts & workspaces'
                : 'Scoped to Brand accounts (includes normalized Business, Company & Label)'}
            </span>
          </div>

          {directoryView === 'accounts' ? (
            <ClientsDirectory
              lockedDepartment={department}
              initialSelectedUid={selectedClientUid}
              onSelectedClientChange={uid => onSelectedClientChange(uid || '')}
              onOpenWorkspace={(workspaceId, clientUid) =>
                openDeptWorkspace(workspaceId, clientUid)
              }
              onViewClientProjects={uid => {
                onSelectedClientChange(uid);
                onOpenProject('', { clientUid: uid });
                onSubTabChange('requests-projects');
              }}
            />
          ) : (
            <WorkspacesManagement
              lockedDepartment={department}
              initialSelectedWorkspaceId={selectedWorkspaceId}
              onSelectedWorkspaceChange={workspaceId =>
                onSelectedWorkspaceChange(workspaceId || '')
              }
              onOpenClient={(clientUid, workspaceId) =>
                openDeptClient(clientUid, workspaceId)
              }
              onViewWorkspaceProjects={workspaceId => {
                onSelectedWorkspaceChange(workspaceId);
                onOpenProject('', { workspaceId });
                onSubTabChange('requests-projects');
              }}
              onOpenServicePackage={onOpenServicePackage}
              onOpenDesignLibrary={workspaceId =>
                openDeptDesignLibrary({ workspaceId, tab: 'assets' })
              }
            />
          )}
        </div>
      )}

      {/* 2. Requests & Projects */}
      {activeTab === 'requests-projects' && (
        <AdminProduction
          section="projects"
          lockedDepartment={department}
          embeddedMode
          initialProjectId={selectedProjectId}
          initialTab={selectedProjectTab}
          filterClientUid={projectClientFilter}
          filterWorkspaceId={projectWorkspaceFilter}
          initialStageFilter={projectStageFilter}
          initialOverdueOnly={projectOverdueOnly}
          onClearFilter={onClearProjectFilters}
          onNavigateSection={(targetSection, opts) => {
            if (targetSection === 'reviews') {
              onSubTabChange('deliverables-reviews');
              return;
            }
            onNavigateProduction(targetSection, opts);
          }}
          onOpenClient={clientUid => openDeptClient(clientUid)}
          onOpenWorkspace={workspaceId => openDeptWorkspace(workspaceId)}
          onOpenDesignLibrary={openDeptDesignLibrary}
        />
      )}

      {/* 3. Releases (Artist Department only) */}
      {activeTab === 'releases' && department === 'Artist' && (
        <AdminArtistReleasesPanel
          onOpenWorkspace={workspaceId => openDeptWorkspace(workspaceId)}
          onOpenProject={projectId => {
            onOpenProject(projectId, { tab: 'overview' });
            onSubTabChange('requests-projects');
          }}
        />
      )}

      {/* 4. Deliverables & Reviews */}
      {activeTab === 'deliverables-reviews' && (
        <AdminProduction
          section="reviews"
          lockedDepartment={department}
          embeddedMode
          initialProjectId={selectedProjectId}
          initialTab={selectedProjectTab}
          onNavigateSection={(targetSection, opts) => {
            if (targetSection === 'projects') {
              onSubTabChange('requests-projects');
              return;
            }
            onNavigateProduction(targetSection, opts);
          }}
          onOpenClient={clientUid => openDeptClient(clientUid)}
          onOpenWorkspace={workspaceId => openDeptWorkspace(workspaceId)}
          onOpenDesignLibrary={openDeptDesignLibrary}
        />
      )}

      {/* 5. Templates & Documents / Collateral */}
      {(activeTab === 'templates-documents' || activeTab === 'templates-collateral') && (
        <div className="space-y-4">
          <div className="border border-[#1E1E1E] bg-[#0C0C0C] p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAssetsView('templates')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  assetsView === 'templates'
                    ? 'border-[#FF1E1E] bg-[#181818] text-white'
                    : 'border-[#262626] bg-[#101010] text-neutral-400 hover:text-white'
                }`}
              >
                <Layers size={13} className={assetsView === 'templates' ? 'text-[#FF1E1E]' : ''} />
                <span>{department} Design &amp; Templates</span>
              </button>
              <button
                type="button"
                onClick={() => setAssetsView('documents')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors ${
                  assetsView === 'documents'
                    ? 'border-[#FF1E1E] bg-[#181818] text-white'
                    : 'border-[#262626] bg-[#101010] text-neutral-400 hover:text-white'
                }`}
              >
                <FileText size={13} className={assetsView === 'documents' ? 'text-[#FF1E1E]' : ''} />
                <span>
                  {department === 'Artist'
                    ? 'Artist Documents & Release Letters'
                    : 'Corporate Documents & Collateral'}
                </span>
              </button>
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              {department === 'Artist'
                ? 'Release graphics, artwork templates & non-commercial artist letters'
                : 'Brand identity templates, stationery, business cards, IDs & signatures'}
            </span>
          </div>

          {assetsView === 'templates' ? (
            <AdminDesignLibrary
              lockedDepartment={department}
              initialWorkspaceId={designLibraryWorkspaceId}
              initialProjectId={designLibraryProjectId}
              initialTab={designLibraryTab}
              onOpenProject={(projectId, tab) => {
                onOpenProject(projectId, { tab: tab || 'deliverables' });
                onSubTabChange('requests-projects');
              }}
              onOpenWorkspace={workspaceId => openDeptWorkspace(workspaceId)}
              onCreateCreativeProductFromDesign={onCreateCreativeProductFromDesign}
            />
          ) : (
            <CorporateDocuments
              lockedDepartment={department}
              defaultSection="documents"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDepartmentConsole;
